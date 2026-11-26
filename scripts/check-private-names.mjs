import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const DEFAULT_LIST = 'specs/041-pruebame-en-vivo/privado/nombres-prohibidos.txt'

function option(name, fallback) {
  const index = process.argv.indexOf(name)
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback
}

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
}

function addedLines(diff) {
  const lines = []
  let file = null
  let line = 0
  for (const raw of diff.split('\n')) {
    if (raw.startsWith('+++ ')) {
      file = raw.startsWith('+++ b/') ? raw.slice(6) : null
      continue
    }
    const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(raw)
    if (hunk) {
      line = Number(hunk[1])
      continue
    }
    if (!file) continue
    if (raw.startsWith('+')) {
      lines.push({ file, line, text: raw.slice(1) })
      line += 1
    } else if (!raw.startsWith('-')) {
      line += 1
    }
  }
  return lines
}

const listPath = option('--list', DEFAULT_LIST)
const base = option('--base', 'origin/dev')

if (!existsSync(listPath)) {
  console.error(`No se encontró la lista privada (${listPath}). Esta revisión corre solo en local.`)
  process.exit(2)
}

const names = readFileSync(listPath, 'utf8')
  .split(/\r?\n/)
  .map((name) => name.trim())
  .filter(Boolean)
  .map((name) => ({ name, folded: name.toLowerCase() }))

const diffs = [git(['diff', '--no-color', '-U0', `${base}...HEAD`]), git(['diff', '--no-color', '-U0', 'HEAD'])]
const seen = new Set()
const findings = []

for (const added of diffs.flatMap(addedLines)) {
  if (added.file.includes('/privado/')) continue
  const folded = added.text.toLowerCase()
  for (const { name, folded: needle } of names) {
    if (!folded.includes(needle)) continue
    const key = `${added.file}:${added.line}:${name}`
    if (seen.has(key)) continue
    seen.add(key)
    findings.push(`${added.file}:${added.line} [${name}]`)
  }
}

if (findings.length > 0) {
  console.error(`Nombres prohibidos en el diff contra ${base}:`)
  for (const finding of findings) console.error(`  ${finding}`)
  process.exit(1)
}

console.log(`Sin nombres prohibidos en el diff contra ${base} (${names.length} nombres revisados).`)
