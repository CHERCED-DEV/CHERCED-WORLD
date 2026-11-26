import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const DEFAULT_OUT = 'content/engineering/history.json'
const NAMES_LIST = 'specs/041-pruebame-en-vivo/privado/nombres-prohibidos.txt'
const MAIN_FILES = ['spec.md', 'propuesta.md', 'notas.md']
const DEPLOY_DAYS = 30
const MAX_MEASUREMENTS = 40
const SUBJECT_MAX = 200
const SEP = '\u001f'
const BUDGETS = new Set(['lcp', 'cls', 'inp', 'a11y'])
const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g
const LINK = /https?:\/\/\S+/g
const PRIVATE_PATH = /\S*privado\/\S*/gi
const BLOCKED = /(^|\/)(privado|node_modules|\.git|\.next|\.worktrees|\.engineering)(\/|$)/i

function option(name, fallback) {
  const index = process.argv.indexOf(name)
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback
}

function flag(name) {
  return process.argv.includes(name)
}

const repo = resolve(option('--repo', process.cwd()))
const out = resolve(process.cwd(), option('--salida', resolve(repo, DEFAULT_OUT)))
const measurementsFile = option('--mediciones', null)
const withGh = !flag('--sin-gh')

function run(command, args, cwd = repo) {
  return execFileSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true })
}

function git(args) {
  return run('git', args)
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function forbiddenNames() {
  const file = resolve(repo, NAMES_LIST)
  if (!existsSync(file)) return []
  return readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .map((name) => name.trim())
    .filter((name) => name.length >= 3)
    .map((name) => new RegExp(escapeRegExp(name), 'gi'))
}

function cleanSubject(subject, names) {
  let text = subject.replace(EMAIL, '[correo]').replace(LINK, '[enlace]').replace(PRIVATE_PATH, '[ruta privada]')
  for (const name of names) text = text.replace(name, '[reservado]')
  const redacted = text !== subject
  text = text.replace(/\s+/g, ' ').trim()
  return { text: text.length > SUBJECT_MAX ? `${text.slice(0, SUBJECT_MAX - 1)}…` : text, redacted }
}

function commits(names) {
  const raw = git(['log', '--no-merges', '--abbrev=7', `--format=%h${SEP}%aI${SEP}%s`, 'HEAD'])
  let redacted = 0
  const list = raw
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [sha = '', date = '', ...rest] = line.split(SEP)
      const subject = cleanSubject(rest.join(SEP), names)
      if (subject.redacted) redacted += 1
      return { sha, date, subject: subject.text }
    })
    .filter((commit) => /^[0-9a-f]{7,12}$/.test(commit.sha) && !Number.isNaN(Date.parse(commit.date)))
  return { list, redacted }
}

function specCreated() {
  const tracked = git(['ls-files', '-z', '--', 'specs'])
    .split('\0')
    .filter((file) => /^specs\/\d{3}-[^/]+\/[^/]+\.md$/.test(file) && !BLOCKED.test(file))
  const byFolder = new Map()
  for (const file of tracked) {
    const [, folder] = file.split('/')
    const list = byFolder.get(folder) ?? []
    list.push(file.split('/')[2])
    byFolder.set(folder, list)
  }
  const added = new Map()
  let date = null
  for (const line of git(['log', '--no-merges', '--no-renames', '--diff-filter=A', '--format=@@%aI', '--name-only', 'HEAD', '--', 'specs']).split('\n')) {
    if (line.startsWith('@@')) date = line.slice(2).trim()
    else if (line.trim() && date) added.set(line.trim(), date)
  }
  const result = {}
  for (const [folder, files] of [...byFolder.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const main = MAIN_FILES.find((name) => files.includes(name)) ?? [...files].sort()[0]
    const created = main ? added.get(`specs/${folder}/${main}`) : undefined
    if (created) result[folder.slice(0, 3)] = created
  }
  return result
}

function githubRepo() {
  try {
    const url = git(['remote', 'get-url', 'origin']).trim()
    const match = /github\.com[:/]([\w.-]+)\/([\w.-]+?)(?:\.git)?$/.exec(url)
    return match ? { owner: match[1], name: match[2] } : null
  } catch {
    return null
  }
}

function deployments(now) {
  if (!withGh) return { value: null, reason: 'se pidió --sin-gh' }
  const target = githubRepo()
  if (!target) return { value: null, reason: 'el remoto origin no es de GitHub' }
  try {
    run('gh', ['auth', 'status'])
  } catch {
    return { value: null, reason: 'la CLI de GitHub no está o no tiene sesión' }
  }
  const query =
    'query($owner:String!,$name:String!){repository(owner:$owner,name:$name){deployments(last:100,orderBy:{field:CREATED_AT,direction:ASC}){nodes{environment createdAt commitOid state}}}}'
  try {
    const response = JSON.parse(run('gh', ['api', 'graphql', '-f', `query=${query}`, '-F', `owner=${target.owner}`, '-F', `name=${target.name}`]))
    const nodes = response?.data?.repository?.deployments?.nodes ?? []
    const since = now.getTime() - DEPLOY_DAYS * 24 * 60 * 60 * 1000
    const byEnvironment = {}
    for (const node of nodes) {
      const at = Date.parse(node?.createdAt ?? '')
      if (Number.isNaN(at) || at < since) continue
      const environment = String(node.environment ?? 'sin entorno').replace(/[^\p{L}\p{N} ._-]/gu, '').trim().slice(0, 40) || 'sin entorno'
      const sha = String(node.commitOid ?? '').slice(0, 7)
      if (!/^[0-9a-f]{7}$/.test(sha)) continue
      const list = byEnvironment[environment] ?? []
      list.push({ sha, date: new Date(at).toISOString(), state: String(node.state ?? 'unknown').toLowerCase().replace(/[^a-z_]/g, '') || 'unknown' })
      byEnvironment[environment] = list
    }
    for (const list of Object.values(byEnvironment)) list.sort((a, b) => b.date.localeCompare(a.date))
    return { value: { takenAt: now.toISOString(), byEnvironment }, reason: null }
  } catch {
    return { value: null, reason: 'la consulta a GitHub falló' }
  }
}

function validMeasurement(item) {
  return (
    item &&
    BUDGETS.has(item.budget) &&
    typeof item.page === 'string' &&
    item.page.startsWith('/') &&
    typeof item.value === 'number' &&
    Number.isFinite(item.value) &&
    typeof item.source === 'string' &&
    !Number.isNaN(Date.parse(item.date ?? ''))
  )
}

function measurements(now) {
  const previous = existsSync(out) ? (JSON.parse(readFileSync(out, 'utf8')).measurements ?? []) : []
  const fresh = measurementsFile ? JSON.parse(readFileSync(resolve(process.cwd(), measurementsFile), 'utf8')) : []
  const merged = [...previous, ...fresh.map((item) => ({ ...item, date: item.date ?? now.toISOString() }))]
    .filter(validMeasurement)
    .map(({ budget, page, value, date, source }) => ({ budget, page, value, date, source }))
  const seen = new Set()
  return merged
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter((item) => {
      const key = `${item.budget}|${item.page}|${item.date}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, MAX_MEASUREMENTS)
}

function indent(json, spaces) {
  return json.replace(/\n/g, `\n${' '.repeat(spaces)}`)
}

function format(history) {
  const lines = [
    '{',
    `  "version": ${history.version},`,
    `  "takenAt": ${JSON.stringify(history.takenAt)},`,
    `  "head": ${JSON.stringify(history.head)},`,
    history.commits.length ? `  "commits": [\n${history.commits.map((commit) => `    ${JSON.stringify(commit)}`).join(',\n')}\n  ],` : '  "commits": [],',
    `  "specCreated": ${indent(JSON.stringify(history.specCreated, null, 2), 2)},`,
    `  "deployments": ${indent(JSON.stringify(history.deployments, null, 2), 2)},`,
    `  "measurements": ${indent(JSON.stringify(history.measurements, null, 2), 2)}`,
    '}',
  ]
  return `${lines.join('\n')}\n`
}

const now = new Date()
const names = forbiddenNames()
const log = commits(names)
const deploy = deployments(now)
const history = {
  version: 1,
  takenAt: now.toISOString(),
  head: git(['rev-parse', '--short=7', 'HEAD']).trim(),
  commits: log.list,
  specCreated: specCreated(),
  deployments: deploy.value,
  measurements: measurements(now),
}

const text = format(history)
EMAIL.lastIndex = 0
if (EMAIL.test(text) || /vercel\.app/i.test(text) || /privado\//i.test(text)) {
  console.error('El historial trae un correo, una URL de vista previa o una ruta privada: no lo escribo.')
  process.exit(1)
}

mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, text)
console.log(`Historial al ${history.takenAt}, commit ${history.head}: ${history.commits.length} commits, ${Object.keys(history.specCreated).length} specs con fecha.`)
console.log(deploy.value ? `Despliegues de los últimos ${DEPLOY_DAYS} días por entorno: ${Object.keys(deploy.value.byEnvironment).join(', ') || 'ninguno'}.` : `Sin despliegues: ${deploy.reason}.`)
if (log.redacted) console.log(`Asuntos limpiados (correos, enlaces, rutas privadas o nombres reservados): ${log.redacted}.`)
console.log(`Escrito en ${out}`)
