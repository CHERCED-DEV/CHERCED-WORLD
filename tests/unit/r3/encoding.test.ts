import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOTS = ['components/site', 'content/site.ts', 'content/i18n', 'app/[lang]/aboutMe', 'app/[lang]/services']
const MOJIBAKE = /Â[· -¿]|â€|â†|Ã[\u0080-¿¡-ÿ]/

function files(path: string): string[] {
  const full = join(process.cwd(), path)
  if (statSync(full).isFile()) return [full]
  return readdirSync(full).flatMap((entry) => files(join(path, entry)))
}

describe('codificación de las fuentes de R3', () => {
  it('ningún archivo trae texto doblemente codificado (·, ↗, tildes)', () => {
    const broken = ROOTS.flatMap(files)
      .filter((file) => /\.(tsx?|json|scss)$/.test(file))
      .filter((file) => MOJIBAKE.test(readFileSync(file, 'utf8')))
    expect(broken).toEqual([])
  })
})
