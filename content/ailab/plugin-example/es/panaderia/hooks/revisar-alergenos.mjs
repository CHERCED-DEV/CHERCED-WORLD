import { existsSync, readFileSync } from 'node:fs'

const RECETA = /[\\/]recetas[\\/][^\\/]+\.md$/i
const ALERGENOS = /^#{1,6}\s*al[eé]rgenos\b/im

function leerEntrada() {
  try {
    return JSON.parse(readFileSync(0, 'utf8'))
  } catch {
    return {}
  }
}

const archivo = leerEntrada().tool_input?.file_path ?? ''

if (RECETA.test(archivo) && existsSync(archivo) && !ALERGENOS.test(readFileSync(archivo, 'utf8'))) {
  process.stderr.write(`La receta ${archivo} no declara sus alérgenos. Agrega una sección "## Alérgenos", aunque diga "ninguno".\n`)
  process.exit(2)
}
