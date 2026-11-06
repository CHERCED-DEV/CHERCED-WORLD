import { existsSync, readFileSync } from 'node:fs'

const RECIPE = /[\\/]recipes[\\/][^\\/]+\.md$/i
const ALLERGENS = /^#{1,6}\s*allergens\b/im

function readInput() {
  try {
    return JSON.parse(readFileSync(0, 'utf8'))
  } catch {
    return {}
  }
}

const file = readInput().tool_input?.file_path ?? ''

if (RECIPE.test(file) && existsSync(file) && !ALLERGENS.test(readFileSync(file, 'utf8'))) {
  process.stderr.write(`The recipe ${file} does not list its allergens. Add an "## Allergens" section, even if it says "none".\n`)
  process.exit(2)
}
