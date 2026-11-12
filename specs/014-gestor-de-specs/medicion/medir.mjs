// Mide el costo y la precision de cada capa del gestor de specs sobre el corpus sintetico.
// Uso: node medir.mjs <spec.md> <truth.json> <repo> <salida.json> [--sin-nli] [--nli=<modelo>]
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, resolve } from 'node:path'
import os from 'node:os'
import { performance } from 'node:perf_hooks'
import { env, pipeline, AutoTokenizer, AutoModelForSequenceClassification } from '@huggingface/transformers'
import MiniSearch from 'minisearch'

const [specPath, truthPath, repoPath, outPath, ...flags] = process.argv.slice(2)
const NLI_MODELS = flags.filter((f) => f.startsWith('--nli=')).map((f) => f.slice(6))
const SKIP_NLI = flags.includes('--sin-nli')
const SKIP_TRACE_EMB = flags.includes('--sin-traza-emb')
env.cacheDir = resolve('./modelos')
env.allowLocalModels = false

const results = { maquina: {}, capas: {}, precision: {}, notas: [] }
results.maquina = {
  cpu: os.cpus()[0].model, hilos: os.cpus().length, ram_gb: +(os.totalmem() / 1e9).toFixed(1),
  node: process.version, plataforma: `${os.platform()} ${os.release()}`,
}
let peakRss = 0
const sampler = setInterval(() => { peakRss = Math.max(peakRss, process.memoryUsage().rss) }, 50)
const mb = (b) => +(b / 1e6).toFixed(0)
async function stage(name, fn) {
  peakRss = process.memoryUsage().rss
  const c0 = process.cpuUsage()
  const t0 = performance.now()
  const out = await fn()
  const ms = performance.now() - t0
  const cpu = process.cpuUsage(c0)
  peakRss = Math.max(peakRss, process.memoryUsage().rss)
  results.capas[name] = { ms: +ms.toFixed(1), cpu_ms: +((cpu.user + cpu.system) / 1000).toFixed(0), rss_pico_mb: mb(peakRss), ...(out?.metrics ?? {}) }
  console.log(name, results.capas[name])
  writeFileSync(`${outPath}.parcial.json`, JSON.stringify(results, null, 1))
  return out
}

const stripAccents = (s) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '')
const slug = (s) => stripAccents(s.toLowerCase()).replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).join('-')
const norm = (s) => stripAccents(s.toLowerCase()).replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim()

const text = readFileSync(specPath, 'utf8')
const truth = JSON.parse(readFileSync(truthPath, 'utf8'))
const lines = text.split(/\r?\n/)
results.corpus = { lineas: lines.length, bytes: Buffer.byteLength(text) }

// ---------- Capa 1: determinista ----------
const REQ_RE = /^- \*\*((?:FR|NFR)-\d{4})\*\*: (.+)$/
// \b de JavaScript es ASCII: no ve el limite antes de "ó" en "óptimo". Se usan limites Unicode explicitos.
const palabra = (src) => new RegExp(`(?<![\\p{L}\\p{N}])(?:${src})(?![\\p{L}\\p{N}])`, 'iu')
const VAGOS = [
  'r[aá]pid[oa]s?', 'f[aá]cil(es)? de usar', 'adecuad[oa]s?', 'eficientes?', 'en la medida de lo posible',
  'si es posible', 'intuitiv[oa]s?', '[oó]ptim[oa]s?', 'seg[uú]n corresponda', 'y/o', 'entre otros', 'etc\\.',
  '(el|la|los|las) mejor(es)?', 'robust[oa]s?', 'lo antes posible', 'amigable', 'suficientes?', 'aproximadamente',
  'normalmente', 'generalmente', 'oportun[oa]s?', 'flexibles?', 'm[ií]nim[oa]s?',
].map(palabra)
const ACRONYM_RE = /(?<![\p{L}\p{N}])[A-ZÁÉÍÓÚÑ]{2,}(?![\p{L}\p{N}])/gu
const NO_ACRONYM = new Set(['DEBE', 'DEBEN', 'NO', 'FR', 'NFR', 'MB', 'KB', 'GB', 'MS'])
const det = await stage('1_determinista', () => {
  const reqs = []
  const defined = new Map()
  const headings = new Set()
  const glossary = []
  const acronyms = new Set()
  const defLines = new Set()
  let section = ''
  lines.forEach((line, i) => {
    const h = /^(#{1,6}) (.+)$/.exec(line)
    if (h) { headings.add(slug(h[2])); section = h[2]; return }
    const g = /^- \*\*([^*]+)\*\*: /.exec(line)
    if (g && section === 'Glosario') { glossary.push(g[1]); defLines.add(i) }
    if (g && section === 'Acrónimos') { acronyms.add(g[1]); defLines.add(i) }
    const m = REQ_RE.exec(line)
    if (m) {
      reqs.push({ id: m[1], text: m[2], line: i + 1 })
      defined.set(m[1], (defined.get(m[1]) ?? []).concat(i + 1))
    }
  })
  for (const t of glossary) if (/^[A-ZÁÉÍÓÚÑ]{2,}$/.test(t)) acronyms.add(t)
  const findings = []
  for (const [id, at] of defined) if (at.length > 1) findings.push({ regla: 'id_duplicado', id, lineas: at, puntaje: 1 })
  lines.forEach((line, i) => {
    const own = REQ_RE.exec(line)?.[1]
    for (const r of line.matchAll(/\b(?:FR|NFR)-\d{4}\b/g)) {
      if (r[0] !== own && !defined.has(r[0])) findings.push({ regla: 'referencia_rota', id: own ?? null, ref: r[0], lineas: [i + 1], puntaje: 1 })
    }
    for (const a of line.matchAll(/\]\(#([^)]+)\)/g)) {
      if (!headings.has(a[1])) findings.push({ regla: 'ancla_rota', id: own ?? null, ref: `#${a[1]}`, lineas: [i + 1], puntaje: 1 })
    }
  })
  const byHash = new Map()
  for (const r of reqs) {
    const k = norm(r.text)
    byHash.set(k, (byHash.get(k) ?? []).concat(r))
  }
  for (const group of byHash.values()) if (group.length > 1 && new Set(group.map((g) => g.id)).size > 1) {
    findings.push({ regla: 'duplicado_exacto', ids: group.map((g) => g.id), lineas: group.map((g) => g.line), puntaje: 1 })
  }
  const pushPairs = (groups, regla, distinto, puntaje) => {
    for (const group of groups.values()) {
      for (let i = 0; i < group.length; i++) for (let j = i + 1; j < group.length; j++) {
        const a = group[i], b = group[j]
        if (a.id !== b.id && distinto(a, b)) findings.push({ regla, ids: [a.id, b.id], lineas: [a.line, b.line], puntaje })
      }
    }
  }
  const byNumMask = new Map()
  for (const r of reqs) {
    if (!/\d/.test(r.text)) continue
    const k = norm(r.text).replace(/\d+(?:[.,]\d+)?/g, '#')
    byNumMask.set(k, (byNumMask.get(k) ?? []).concat(r))
  }
  const numsOf = (t) => (t.match(/\d+(?:[.,]\d+)?/g) ?? []).join(',')
  pushPairs(byNumMask, 'contradiccion_numerica', (a, b) => numsOf(a.text) !== numsOf(b.text), 0.95)
  const NEG_RE = /(?<![\p{L}])(no|nunca|jam[aá]s)(?![\p{L}])/giu
  const VACIAS = new Set(['el', 'la', 'los', 'las', 'de', 'del', 'en', 'un', 'una', 'que', 'y', 'a', 'al', 'con', 'por', 'para', 'se', 'su', 'sistema', 'debe', 'deben', 'permitir', 'poder', 'pueda', 'puedan', 'no', 'nunca', 'jamas'])
  const firma = (t) => [...new Set(norm(t).split(' ').filter((w) => w && !VACIAS.has(w)))].sort().join(' ')
  const byFirma = new Map()
  for (const r of reqs) {
    const k = firma(r.text)
    if (k.split(' ').length < 3) continue
    byFirma.set(k, (byFirma.get(k) ?? []).concat(r))
  }
  const esNeg = (t) => { NEG_RE.lastIndex = 0; return NEG_RE.test(t) }
  pushPairs(byFirma, 'polaridad_opuesta', (a, b) => esNeg(a.text) !== esNeg(b.text), 0.9)
  for (const r of reqs) {
    for (const re of VAGOS) {
      const hit = re.exec(r.text)
      if (hit) findings.push({ regla: 'termino_vago', id: r.id, evidencia: hit[0], lineas: [r.line], puntaje: 0.7 })
    }
    for (const a of r.text.matchAll(ACRONYM_RE)) {
      if (!NO_ACRONYM.has(a[0]) && !acronyms.has(a[0])) findings.push({ regla: 'acronimo_sin_definir', id: r.id, evidencia: a[0], lineas: [r.line], puntaje: 0.8 })
    }
  }
  const body = lines.filter((_, i) => !defLines.has(i)).join('\n').toLowerCase()
  for (const t of glossary) if (!body.includes(t.toLowerCase())) findings.push({ regla: 'glosario_sin_uso', termino: t, puntaje: 0.6 })
  return { reqs, findings, metrics: { requisitos: reqs.length, hallazgos: findings.length } }
})

const pr = (tp, fp, fn) => ({ tp, fp, fn, precision: tp + fp ? +(tp / (tp + fp)).toFixed(3) : null, recall: tp + fn ? +(tp / (tp + fn)).toFixed(3) : null })
const pairKey = (a, b) => [a, b].sort().join('|')
{
  const f = det.findings
  const exactPairs = new Set()
  for (const x of f.filter((x) => x.regla === 'duplicado_exacto')) for (let i = 0; i < x.ids.length; i++) for (let j = i + 1; j < x.ids.length; j++) exactPairs.add(pairKey(x.ids[i], x.ids[j]))
  const exTruth = new Set(truth.exact_dup.map(([a, b]) => pairKey(a, b)))
  const tp = [...exactPairs].filter((k) => exTruth.has(k)).length
  results.precision.duplicado_exacto = pr(tp, exactPairs.size - tp, exTruth.size - tp)
  const dupIds = new Set(f.filter((x) => x.regla === 'id_duplicado').map((x) => x.id))
  const dupTruth = new Set(truth.dup_id)
  const tp2 = [...dupIds].filter((k) => dupTruth.has(k)).length
  results.precision.id_duplicado = pr(tp2, dupIds.size - tp2, dupTruth.size - tp2)
  const broken = new Set(f.filter((x) => x.regla === 'referencia_rota' || x.regla === 'ancla_rota').map((x) => `${x.id}|${x.ref}`))
  const brokenTruth = new Set(truth.broken_ref.map((x) => `${x.id}|${x.ref}`))
  const tp3 = [...broken].filter((k) => brokenTruth.has(k)).length
  results.precision.referencia_rota = pr(tp3, broken.size - tp3, brokenTruth.size - tp3)
  const vague = new Set(f.filter((x) => x.regla === 'termino_vago').map((x) => x.id))
  const vagueTruth = new Set(truth.vague.map((x) => x.id))
  const tp4 = [...vague].filter((k) => vagueTruth.has(k)).length
  results.precision.termino_vago = pr(tp4, vague.size - tp4, vagueTruth.size - tp4)
  const acr = f.filter((x) => x.regla === 'acronimo_sin_definir')
  const acrTruth = new Set(truth.undefined_acronym.map((x) => `${x.id}|${x.acronym}`))
  const acrSet = new Set(acr.map((x) => `${x.id}|${x.evidencia}`))
  const tp5 = [...acrSet].filter((k) => acrTruth.has(k)).length
  results.precision.acronimo_sin_definir = pr(tp5, acrSet.size - tp5, acrTruth.size - tp5)
  results.precision.acronimo_sin_definir.fp_detalle = [...acrSet].filter((k) => !acrTruth.has(k))
  const gl = new Set(f.filter((x) => x.regla === 'glosario_sin_uso').map((x) => x.termino))
  const glTruth = new Set(truth.unused_glossary)
  const tp6 = [...gl].filter((k) => glTruth.has(k)).length
  results.precision.glosario_sin_uso = pr(tp6, gl.size - tp6, glTruth.size - tp6)
  for (const [regla, tipo] of [['contradiccion_numerica', 'numerica'], ['polaridad_opuesta', 'polaridad']]) {
    const got = new Set(f.filter((x) => x.regla === regla).map((x) => pairKey(...x.ids)))
    const want = new Set(truth.contradiction.filter((c) => c.type === tipo).map((c) => pairKey(c.a, c.b)))
    const anyContra = new Set(truth.contradiction.map((c) => pairKey(c.a, c.b)))
    const tpc = [...got].filter((k) => anyContra.has(k)).length
    results.precision[`c1_${regla}`] = { ...pr(tpc, got.size - tpc, [...want].filter((k) => !got.has(k)).length), fp_ejemplo: [...got].filter((k) => !anyContra.has(k)).slice(0, 5) }
  }
}
const c1Contra = new Set(det.findings.filter((x) => x.regla === 'contradiccion_numerica' || x.regla === 'polaridad_opuesta').map((x) => pairKey(...x.ids)))

// ---------- Capa 2: embeddings locales ----------
const reqs = det.reqs.filter((r, i, all) => all.findIndex((x) => x.id === r.id) === i)
const idx = new Map(reqs.map((r, i) => [r.id, i]))
const EMB_MODEL = 'Xenova/multilingual-e5-small'
let extractor
const loadEmb = await stage('2a_carga_embeddings', async () => {
  extractor = await pipeline('feature-extraction', EMB_MODEL, { dtype: 'q8' })
  return { metrics: { modelo: EMB_MODEL, dtype: 'q8' } }
})
const DIM = 384
let embs = new Float32Array(reqs.length * DIM)
const EMB_CACHE = flags.find((f) => f.startsWith('--emb-cache='))?.slice(12)
if (EMB_CACHE && existsSync(EMB_CACHE)) {
  const buf = readFileSync(EMB_CACHE)
  embs = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4).slice()
  results.notas.push({ embeddings: `leidos de cache ${EMB_CACHE}; el tiempo de 2b no se midio en esta corrida` })
} else await stage('2b_embeddings_requisitos', async () => {
  const B = 32
  for (let i = 0; i < reqs.length; i += B) {
    const batch = reqs.slice(i, i + B).map((r) => `query: ${r.text}`)
    const out = await extractor(batch, { pooling: 'mean', normalize: true })
    embs.set(out.data, i * DIM)
  }
  return { metrics: { textos: reqs.length, ms_por_texto: null } }
})
if (results.capas['2b_embeddings_requisitos']) {
  results.capas['2b_embeddings_requisitos'].ms_por_texto = +(results.capas['2b_embeddings_requisitos'].ms / reqs.length).toFixed(2)
  if (EMB_CACHE) writeFileSync(EMB_CACHE, Buffer.from(embs.buffer))
}

const K = 5
const COS_MIN = 0.86
const cand = await stage('2c_vecinos_coseno', () => {
  const n = reqs.length
  const pairs = new Map()
  const hist = new Array(21).fill(0)
  const near = Array.from({ length: n }, () => [])
  for (let i = 0; i < n; i++) {
    const ai = i * DIM
    for (let j = i + 1; j < n; j++) {
      const bj = j * DIM
      let s = 0
      for (let d = 0; d < DIM; d++) s += embs[ai + d] * embs[bj + d]
      hist[s >= 1 ? 20 : s <= 0 ? 0 : (s * 20) | 0]++
      if (s >= COS_MIN) { near[i].push([j, s]); near[j].push([i, s]) }
    }
  }
  for (let i = 0; i < n; i++) {
    const best = near[i].sort((a, b) => b[1] - a[1])
    for (const [j, s] of best.slice(0, K)) {
      const k = pairKey(reqs[i].id, reqs[j].id)
      if (!pairs.has(k)) pairs.set(k, { a: reqs[Math.min(i, j)], b: reqs[Math.max(i, j)], cos: s })
    }
  }
  return { pairs: [...pairs.values()], hist, metrics: { pares_comparados: (n * (n - 1)) / 2, candidatos: pairs.size, k: K, cos_min: COS_MIN } }
})
results.notas.push({ histograma_coseno_por_0_05: cand.hist.map((c, i) => [+(i * 0.05).toFixed(2), c]).filter(([, c]) => c) })

// ---------- Capa 2.5: quitar de los candidatos lo que C1 ya resolvio ----------
const exactSet = new Set(det.findings.filter((x) => x.regla === 'duplicado_exacto').flatMap((x) => {
  const ks = []
  for (let i = 0; i < x.ids.length; i++) for (let j = i + 1; j < x.ids.length; j++) ks.push(pairKey(x.ids[i], x.ids[j]))
  return ks
}))
const classified = await stage('2d_filtrar_candidatos', () => {
  const out = []
  let resolved = 0
  for (const p of cand.pairs) {
    const k = pairKey(p.a.id, p.b.id)
    if (exactSet.has(k)) continue
    if (c1Contra.has(k)) { resolved++; continue }
    out.push({ ...p, rule: null })
  }
  return { out, metrics: { candidatos_para_nli: out.length, ya_resueltos_en_c1: resolved } }
})

// ---------- Capa 3: NLI pequeno ----------
async function runNli(modelId, pairs) {
  const tok = await AutoTokenizer.from_pretrained(modelId)
  const model = await AutoModelForSequenceClassification.from_pretrained(modelId, { dtype: 'q8' })
  const id2label = model.config.id2label
  const lab = Object.fromEntries(Object.entries(id2label).map(([i, l]) => [l.toLowerCase(), +i]))
  const scores = []
  const B = 16
  const t0 = performance.now()
  const prep = flags.includes('--nli-minusculas') ? (t) => t.replace(/(?<![\p{L}])(NO )?DEBEN?(?![\p{L}])/gu, (m) => m.toLowerCase()) : (t) => t
  for (let i = 0; i < pairs.length; i += B) {
    const chunk = pairs.slice(i, i + B)
    const prem = [...chunk.map((p) => prep(p.a.text)), ...chunk.map((p) => prep(p.b.text))]
    const hyp = [...chunk.map((p) => prep(p.b.text)), ...chunk.map((p) => prep(p.a.text))]
    const enc = tok(prem, { text_pair: hyp, padding: true, truncation: true })
    const { logits } = await model(enc)
    const [rows, cols] = logits.dims
    const data = logits.data
    const probs = []
    for (let r = 0; r < rows; r++) {
      const row = Array.from(data.slice(r * cols, (r + 1) * cols))
      const mx = Math.max(...row)
      const ex = row.map((x) => Math.exp(x - mx))
      const sum = ex.reduce((a, b) => a + b, 0)
      probs.push(ex.map((x) => x / sum))
    }
    chunk.forEach((p, j) => {
      const f = probs[j], r = probs[j + chunk.length]
      scores.push({
        contradiccion: Math.max(f[lab.contradiction], r[lab.contradiction]),
        implicacion_doble: Math.min(f[lab.entailment], r[lab.entailment]),
      })
    })
    if ((i / B) % 10 === 0) console.log(`nli_progreso ${modelId} ${Math.min(i + B, pairs.length)}/${pairs.length} ${((performance.now() - t0) / 1000).toFixed(0)}s`)
  }
  const ms = performance.now() - t0
  return { scores, ms, labels: id2label }
}

const nearTruth = new Set(truth.near_dup.map(([a, b]) => pairKey(a, b)))
const contraTruth = new Map(truth.contradiction.map((c) => [pairKey(c.a, c.b), c.type]))
// Muestra estratificada: todos los candidatos con verdad conocida + N negativos al azar (semilla fija).
const MUESTRA = +(flags.find((f) => f.startsWith('--nli-muestra='))?.slice(14) ?? 0)
let rngState = 14
const rand = () => { rngState = (rngState + 0x6d2b79f5) | 0; let t = rngState; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
const isPos = (p) => { const k = pairKey(p.a.id, p.b.id); return nearTruth.has(k) || contraTruth.has(k) }
const allPos = classified.out.filter(isPos)
const allNeg = classified.out.filter((p) => !isPos(p))
let negSample = allNeg
if (MUESTRA && MUESTRA < allNeg.length) {
  const idxs = allNeg.map((_, i) => i)
  for (let i = idxs.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [idxs[i], idxs[j]] = [idxs[j], idxs[i]] }
  negSample = idxs.slice(0, MUESTRA).sort((a, b) => a - b).map((i) => allNeg[i])
}
const nliPairs = [...allPos, ...negSample]
const negFactor = allNeg.length / Math.max(1, negSample.length)
results.notas.push({ nli_muestra: { positivos_en_candidatos: allPos.length, negativos_total: allNeg.length, negativos_muestreados: negSample.length, factor_extrapolacion_fp: +negFactor.toFixed(3) } })

const nliResults = {}
if (!SKIP_NLI) {
  for (const modelId of NLI_MODELS) {
    const pairs = nliPairs
    const r = await stage(`3_nli_${modelId.split('/')[1]}`, async () => {
      const r = await runNli(modelId, pairs)
      return { r, metrics: { modelo: modelId, pares: pairs.length, inferencias: pairs.length * 2, ms_por_par_ida_y_vuelta: +(r.ms / Math.max(1, pairs.length)).toFixed(2) } }
    })
    nliResults[modelId] = new Map(pairs.map((p, i) => [pairKey(p.a.id, p.b.id), r.r.scores[i]]))
    const byId = new Map(reqs.map((x) => [x.id, x]))
    const oracle = truth.contradiction.filter((c) => c.type === 'semantica').map((c) => ({ a: byId.get(c.a), b: byId.get(c.b) }))
    const o = await runNli(modelId, oracle)
    results.precision[`oraculo_semanticas_${modelId.split('/')[1]}`] = oracle.map((p, i) => ({ par: `${p.a.id}~${p.b.id}`, contradiccion: +o.scores[i].contradiccion.toFixed(3) }))
  }
}

// ---------- Evaluacion de casi duplicados y contradicciones ----------
// Con muestra, los FP se cuentan en los negativos muestreados y se extrapolan con negFactor.
function evaluate(label, decide, universe = classified.out, factor = 1) {
  const near = new Set(), contra = new Set(c1Contra)
  universe.forEach((p, i) => {
    const d = decide(p, i)
    const k = pairKey(p.a.id, p.b.id)
    if (d === 'casi_duplicado') near.add(k)
    if (d === 'contradiccion') contra.add(k)
  })
  const c1Fp = [...c1Contra].filter((k) => !contraTruth.has(k)).length
  const tpN = [...near].filter((k) => nearTruth.has(k)).length
  const tpC = [...contra].filter((k) => contraTruth.has(k)).length
  const fpN = Math.round((near.size - tpN) * factor)
  const fpC = Math.round((contra.size - tpC - c1Fp) * factor) + c1Fp
  const missedC = [...contraTruth.keys()].filter((k) => !contra.has(k))
  const byType = {}
  for (const [k, t] of contraTruth) { byType[t] ??= { total: 0, detectadas: 0 }; byType[t].total++; if (contra.has(k)) byType[t].detectadas++ }
  const candKeys = new Set([...classified.out.map((p) => pairKey(p.a.id, p.b.id)), ...c1Contra])
  results.precision[label] = {
    fp_extrapolados: factor !== 1,
    casi_duplicado: pr(tpN, fpN, nearTruth.size - tpN),
    contradiccion: pr(tpC, fpC, contraTruth.size - tpC),
    contradiccion_por_tipo: byType,
    techo_recall_candidatos: {
      casi_duplicado: +([...nearTruth].filter((k) => candKeys.has(k)).length / nearTruth.size).toFixed(3),
      contradiccion: +([...contraTruth.keys()].filter((k) => candKeys.has(k)).length / contraTruth.size).toFixed(3),
    },
    contradicciones_perdidas_ejemplo: missedC.slice(0, 5),
  }
}
const nearCut = 0.93
evaluate('c1_mas_coseno_sin_nli', (p) => p.cos >= nearCut ? 'casi_duplicado' : null)
for (const [modelId, r] of Object.entries(nliResults)) {
  const name = modelId.split('/')[1]
  for (const th of [0.5, 0.7, 0.9]) {
    evaluate(`con_nli_${name}_umbral_${th}`, (p) => {
      const s = r.get(pairKey(p.a.id, p.b.id))
      if (s.contradiccion >= th) return 'contradiccion'
      if (s.implicacion_doble >= 0.5 && p.cos >= 0.88) return 'casi_duplicado'
      return null
    }, nliPairs, negFactor)
  }
  for (const ent of [0.8, 0.9, 0.95, 0.98]) {
    evaluate(`con_nli_${name}_contra_0.9_implicacion_${ent}`, (p) => {
      const s = r.get(pairKey(p.a.id, p.b.id))
      if (s.contradiccion >= 0.9) return 'contradiccion'
      if (s.implicacion_doble >= ent && p.cos >= 0.88) return 'casi_duplicado'
      return null
    }, nliPairs, negFactor)
  }
  results.precision[`semanticas_${name}`] = truth.contradiction.filter((c) => c.type === 'semantica').map((c) => {
    const s = r.get(pairKey(c.a, c.b))
    const cosAB = (() => { const a = idx.get(c.a), b = idx.get(c.b); let s = 0; for (let d = 0; d < DIM; d++) s += embs[a * DIM + d] * embs[b * DIM + d]; return +s.toFixed(3) })()
    return { par: `${c.a}~${c.b}`, coseno: cosAB, en_candidatos: !!s, contradiccion: s ? +s.contradiccion.toFixed(3) : null }
  })
}
for (const cut of [0.9, 0.92, 0.94, 0.96]) {
  const near = classified.out.filter((p) => !p.rule && p.cos >= cut).map((p) => pairKey(p.a.id, p.b.id))
  const tp = near.filter((k) => nearTruth.has(k)).length
  results.precision[`casi_duplicado_coseno_${cut}`] = pr(tp, near.length - tp, nearTruth.size - tp)
}

// ---------- Capa 4: trazabilidad contra el repo ----------
const files = execFileSync('git', ['-C', repoPath, 'ls-files', 'app', 'components', 'lib', 'content'], { encoding: 'utf8' })
  .split('\n').filter((f) => /\.(tsx?|mjs|json|md|scss)$/.test(f))
const splitCode = (s) => stripAccents(s).replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 1)
const STOP = new Set(['el', 'la', 'los', 'las', 'de', 'del', 'en', 'un', 'una', 'que', 'y', 'o', 'a', 'al', 'con', 'por', 'para', 'se', 'su', 'sus', 'debe', 'deben', 'sistema', 'sitio', 'the', 'and', 'of', 'to', 'import', 'from', 'export', 'const', 'return', 'function', 'type', 'if', 'is'])
const tokenize = (s) => splitCode(s).filter((t) => !STOP.has(t))
const docs = files.map((f, id) => ({ id, path: f, body: readFileSync(join(repoPath, f), 'utf8') }))
const trazaSpec = JSON.parse(readFileSync(join(resolve(specPath, '..'), 'traza.json'), 'utf8'))
let mini
await stage('4a_indice_bm25_repo', () => {
  mini = new MiniSearch({ fields: ['path', 'body'], storeFields: ['path'], tokenize, processTerm: (t) => t })
  mini.addAll(docs)
  return { metrics: { archivos: docs.length, lineas: docs.reduce((a, d) => a + d.body.split('\n').length, 0) } }
})
const traceEval = (hitsFor) => {
  let foundTop5 = 0
  const rows = trazaSpec.map((q) => {
    const hits = hitsFor(q)
    const top = hits.slice(0, 5)
    const ok = q.existe ? top.some((h) => q.archivos.some((a) => h.path.startsWith(a))) : null
    if (ok) foundTop5++
    return { id: q.id, existe: q.existe, top1: top[0]?.path, puntaje_top1: top[0] ? +top[0].score.toFixed(3) : 0, acierto_top5: ok }
  })
  const existing = trazaSpec.filter((q) => q.existe).length
  return { acierto_top5: `${foundTop5}/${existing}`, filas: rows }
}
const bm25Hits = new Map()
await stage('4b_consultas_bm25', () => {
  const ev = traceEval((q) => {
    const hits = mini.search(q.texto, { fields: ['path', 'body'], boost: { path: 2 }, combineWith: 'OR' }).map((h) => ({ path: h.path, score: h.score }))
    bm25Hits.set(q.id, hits)
    return hits
  })
  results.precision.traza_bm25 = ev
  return { metrics: { consultas: trazaSpec.length } }
})
if (!SKIP_TRACE_EMB) {
  const chunks = []
  for (const d of docs) {
    const ls = d.body.split('\n')
    for (let i = 0; i < ls.length; i += 40) chunks.push({ path: d.path, text: `passage: ${d.path}\n${ls.slice(i, i + 40).join('\n')}`.slice(0, 1500) })
  }
  const cemb = new Float32Array(chunks.length * DIM)
  await stage('4c_embeddings_repo', async () => {
    const B = 16
    for (let i = 0; i < chunks.length; i += B) {
      const out = await extractor(chunks.slice(i, i + B).map((c) => c.text), { pooling: 'mean', normalize: true })
      cemb.set(out.data, i * DIM)
    }
    return { metrics: { fragmentos: chunks.length } }
  })
  await stage('4d_consultas_embeddings', async () => {
    const qs = await extractor(trazaSpec.map((q) => `query: ${q.texto}`), { pooling: 'mean', normalize: true })
    const embHits = new Map()
    const ev = traceEval((q) => {
      const qi = trazaSpec.indexOf(q)
      const best = new Map()
      for (let c = 0; c < chunks.length; c++) {
        let s = 0
        for (let d = 0; d < DIM; d++) s += qs.data[qi * DIM + d] * cemb[c * DIM + d]
        if (!best.has(chunks[c].path) || best.get(chunks[c].path) < s) best.set(chunks[c].path, s)
      }
      const hits = [...best].map(([path, score]) => ({ path, score })).sort((a, b) => b.score - a.score)
      embHits.set(q.id, hits)
      return hits
    })
    results.precision.traza_embeddings = ev
    results.precision.traza_hibrida_rrf = traceEval((q) => {
      const fused = new Map()
      for (const list of [bm25Hits.get(q.id) ?? [], embHits.get(q.id) ?? []]) {
        list.slice(0, 50).forEach((h, rank) => fused.set(h.path, (fused.get(h.path) ?? 0) + 1 / (60 + rank + 1)))
      }
      return [...fused].map(([path, score]) => ({ path, score })).sort((a, b) => b.score - a.score)
    })
    return { metrics: { consultas: trazaSpec.length } }
  })
}

clearInterval(sampler)
results.reproducible = { semilla: truth.seed, modelos: [EMB_MODEL, ...NLI_MODELS], cuantizacion: 'q8' }
writeFileSync(outPath, JSON.stringify(results, null, 1))
console.log('listo', outPath)
