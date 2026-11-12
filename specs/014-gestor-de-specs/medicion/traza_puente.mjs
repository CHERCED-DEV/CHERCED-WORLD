// Traza "ya existe" con BM25, con y sin un puente de glosario es->en. Sin modelos.
// Uso: node traza_puente.mjs <traza.json> <repo> <salida.json>
import { readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { performance } from 'node:perf_hooks'
import MiniSearch from 'minisearch'

const [trazaPath, repoPath, outPath] = process.argv.slice(2)
const traza = JSON.parse(readFileSync(trazaPath, 'utf8'))
const stripAccents = (s) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '')
const splitCode = (s) => stripAccents(s).replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 1)
const STOP = new Set(['el', 'la', 'los', 'las', 'de', 'del', 'en', 'un', 'una', 'que', 'y', 'o', 'a', 'al', 'con', 'por', 'para', 'se', 'su', 'sus', 'debe', 'deben', 'sistema', 'sitio', 'the', 'and', 'of', 'to', 'import', 'from', 'export', 'const', 'return', 'function', 'type', 'if', 'is'])
const tokenize = (s) => splitCode(s).filter((t) => !STOP.has(t))

// Puente generico: terminos de producto en espanol -> identificadores tipicos en ingles.
// Se escribio mirando las 20 consultas, asi que el resultado es optimista (ver README).
const PUENTE = {
  tema: ['theme'], oscuro: ['dark'], claro: ['light'], preferencia: ['preference', 'preferences'],
  idioma: ['lang', 'locale', 'i18n'], espanol: ['es'], ingles: ['en'], rutas: ['route', 'paths'],
  imagen: ['image'], open: ['opengraph'], graph: ['opengraph'], redes: ['social'],
  paleta: ['palette'], comandos: ['command'], teclado: ['keyboard'], navegar: ['navigate'],
  reaccionar: ['reaction', 'reactions'], comentarios: ['comment', 'comments'], moderar: ['moderate'], panel: ['inbox', 'admin'],
  transcribir: ['transcriber', 'transcribe'], audio: ['audio', 'recorder'], navegador: ['browser', 'worker'],
  simular: ['simulator'], saga: ['saga'], compensaciones: ['compensation'], buscadores: ['sitemap', 'robots'],
  articulos: ['posts', 'post'], blog: ['blog'], feed: ['feed', 'rss'],
  pagar: ['payment', 'checkout'], tarjeta: ['card'], carrito: ['cart'], compras: ['shop', 'cart'],
  notificacion: ['notification'], exportar: ['export'], estadisticas: ['analytics', 'stats'],
  aplicacion: ['app'], nativa: ['native'], inicio: ['login'], sesion: ['session'], boletin: ['newsletter'],
  correo: ['email', 'mail'], suscriptores: ['subscribers'], agendar: ['booking', 'schedule'], cita: ['appointment'],
  calendario: ['calendar'], chat: ['chat'], vivo: ['live'], persona: ['human', 'agent'], invitados: ['guest'], editor: ['editor'],
}
const bridge = (q) => {
  const toks = tokenize(q)
  return [...toks, ...toks.flatMap((t) => PUENTE[t] ?? [])].join(' ')
}

const files = execFileSync('git', ['-C', repoPath, 'ls-files', 'app', 'components', 'lib', 'content'], { encoding: 'utf8' })
  .split('\n').filter((f) => /\.(tsx?|mjs|json|md|scss)$/.test(f))
const docs = files.map((f, id) => ({ id, path: f, body: readFileSync(join(repoPath, f), 'utf8') }))
const t0 = performance.now()
const mini = new MiniSearch({ fields: ['path', 'body'], storeFields: ['path'], tokenize, processTerm: (t) => t })
mini.addAll(docs)
const indexMs = performance.now() - t0

function run(label, toQuery) {
  let hits5 = 0
  const filas = traza.map((q) => {
    const res = mini.search(toQuery(q.texto), { fields: ['path', 'body'], boost: { path: 2 }, combineWith: 'OR' })
    const top = res.slice(0, 5)
    const ok = q.existe ? top.some((h) => q.archivos.some((a) => h.path.startsWith(a))) : null
    if (ok) hits5++
    return { id: q.id, existe: q.existe, acierto_top5: ok, top1: top[0]?.path, puntaje_top1: top[0] ? +top[0].score.toFixed(1) : 0 }
  })
  const si = filas.filter((f) => f.existe).map((f) => f.puntaje_top1)
  const no = filas.filter((f) => !f.existe).map((f) => f.puntaje_top1)
  return { label, acierto_top5: `${hits5}/${traza.filter((q) => q.existe).length}`, puntaje_top1_existe: [Math.min(...si), Math.max(...si)], puntaje_top1_no_existe: [Math.min(...no), Math.max(...no)], filas }
}
const out = { archivos: docs.length, indice_ms: +indexMs.toFixed(0), sin_puente: run('sin_puente', (t) => t), con_puente: run('con_puente', bridge) }
writeFileSync(outPath, JSON.stringify(out, null, 1))
for (const k of ['sin_puente', 'con_puente']) {
  console.log(k, out[k].acierto_top5, 'existe', out[k].puntaje_top1_existe, 'no existe', out[k].puntaje_top1_no_existe)
  for (const f of out[k].filas) console.log('  ', f.id, f.existe, f.acierto_top5, f.puntaje_top1, f.top1)
}
console.log('indice', out.indice_ms, 'ms')
