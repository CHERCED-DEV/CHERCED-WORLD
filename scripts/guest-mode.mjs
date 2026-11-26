import { createHash, randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const [email, name, personaPath = 'content/mini-cherced/privado/guest-persona.md'] = process.argv.slice(2)

if (!email || !email.includes('@') || !name) {
  console.error('Uso: node scripts/guest-mode.mjs <correo-de-google> <nombre> [ruta-de-la-persona]')
  process.exit(1)
}

const persona = readFileSync(resolve(personaPath), 'utf8').trim()
if (persona.length < 200 || persona.length > 12_000) {
  console.error(`La persona mide ${persona.length} caracteres: debe estar entre 200 y 12.000.`)
  process.exit(1)
}

const experiencePath = resolve(dirname(resolve(personaPath)), 'guest-experience.json')
const experience = existsSync(experiencePath) ? JSON.parse(readFileSync(experiencePath, 'utf8')) : undefined

const salt = randomBytes(24).toString('hex')
const emailHash = createHash('sha256').update(`${salt}:${email.trim().toLowerCase()}`).digest('hex')
const value = Buffer.from(JSON.stringify({ v: 1, salt, emailHash, name: name.trim(), persona, ...(experience ? { experience } : {}) })).toString('base64')
const out = resolve(dirname(resolve(personaPath)), 'GUEST_MODE.txt')
writeFileSync(out, `${value}\n`)
console.log(`Listo: ${out}${experience ? ' (con la experiencia: bienvenida, sorpresas, estrellas y final)' : ''}`)
console.log(`Pega su contenido en Vercel como la variable GUEST_MODE (Production y Preview, marcada Sensitive). Mide ${value.length} caracteres.`)
