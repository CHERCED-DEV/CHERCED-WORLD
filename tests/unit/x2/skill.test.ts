import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { downloadText, type DownloadEnv } from '@/lib/ailab/skill/download'
import {
  SKILL_DESCRIPTION_MAX,
  SKILL_FILE_NAME,
  SKILL_NAME_MAX,
  checkSkill,
  generateSkillMd,
  parseSteps,
  readFrontmatter,
  skillTitle,
  suggestName,
  validateSkillMd,
  type SkillInput,
} from '@/lib/ailab/skill/generate'

const HEADING = { stepsHeading: 'Pasos' }

const VALID: SkillInput[] = [
  { name: 'revisar-recetas', description: 'Revisa recetas. Úsala cuando escriban una.', steps: 'Lee la receta.\nRevisa los gramos.' },
  { name: 'a', description: 'x', steps: 'y' },
  { name: 'x'.repeat(SKILL_NAME_MAX), description: 'd'.repeat(SKILL_DESCRIPTION_MAX), steps: 'uno' },
  { name: 'scale-recipe', description: "Scales a recipe: baker's percentages, #1 rule.", steps: '1. Read it\n2) Ask\n- Show the table' },
  { name: '123', description: 'Un nombre que YAML leería como número.', steps: 'paso' },
  { name: 'true', description: 'Un nombre que YAML leería como booleano.', steps: 'paso' },
  { name: 'null', description: 'Un nombre que YAML leería como nulo.', steps: 'paso' },
  { name: '0x1f', description: 'Un nombre que YAML leería como hexadecimal.', steps: 'paso' },
  { name: '1e3', description: 'Un nombre que YAML leería como flotante.', steps: 'paso' },
  { name: 'yes', description: 'YAML 1.1 lo leería como booleano.', steps: 'paso' },
  { name: 'comillas', description: 'Dice "hola" y \'adiós\' sin romper nada.', steps: 'paso con "comillas"' },
  { name: 'barras', description: 'Rutas como C:\\temp\\notas y \\n literal.', steps: 'paso' },
  { name: 'dos-puntos', description: 'clave: valor # no es comentario', steps: 'paso' },
  { name: 'saltos', description: 'Primera línea\nsegunda línea\r\n\ttercera', steps: 'paso' },
  { name: 'emoji', description: 'Pan 🍞 y café ☕, con ñ y ü.', steps: '🥖 hornear' },
  { name: 'guiones-largos', description: '— Usa rayas – y comillas «latinas» y “curvas”.', steps: 'paso' },
  { name: 'empieza-con-simbolo', description: '- parece una lista pero no lo es', steps: 'paso' },
  { name: 'corchetes', description: '[no] {es} un mapa ni una lista & *ancla !etiqueta | %', steps: 'paso' },
  { name: 'espacios', description: '   con espacios alrededor   ', steps: '   paso con espacios   ' },
  { name: 'v2-final', description: 'Usa la versión 2. Úsala al final.', steps: 'uno\n\n\ndos' },
  { name: 'unicode-raro', description: 'Separadores\u2028de\u2029línea y espacio\u00a0duro.', steps: 'paso' },
  { name: 'controles', description: 'Con\u0007campana\u0000y\u001bescape', steps: 'paso' },
]

function seeded(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 2 ** 32
  }
}

const NAME_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'
const TEXT_CHARS = 'abcdefghijklmnñopqrstuvwxyzáéíóúü ABCXYZ0123456789:#"\'\\-_/.,;!?¿¡()[]{}&*|%@`~«»“”—🍞\n\t'

function randomInput(random: () => number): SkillInput {
  const pick = (chars: string) => [...chars][Math.floor(random() * [...chars].length)]!
  const segments = 1 + Math.floor(random() * 4)
  const name = Array.from({ length: segments }, () => Array.from({ length: 1 + Math.floor(random() * 10) }, () => pick(NAME_CHARS)).join('')).join('-')
  const description = Array.from({ length: 1 + Math.floor(random() * 300) }, () => pick(TEXT_CHARS)).join('')
  const steps = Array.from({ length: 1 + Math.floor(random() * 6) }, () => `x${Array.from({ length: Math.floor(random() * 40) }, () => pick(TEXT_CHARS)).join('')}`).join('\n')
  return { name: name.replace(/claude|anthropic/g, 'pan'), description: `d${description.replace(/[<>]/g, '')}`, steps }
}

describe('SC-307: el 100 % de los SKILL.md generados en las pruebas valida su frontmatter', () => {
  const random = seeded(307)
  const generated = [...VALID, ...Array.from({ length: 400 }, () => randomInput(random))]

  it(`genera y valida ${generated.length} skills, y el frontmatter devuelve lo mismo que se escribió`, () => {
    const failures: string[] = []
    for (const input of generated) {
      const check = checkSkill(input)
      if (!check.ok) {
        failures.push(`entrada inválida: ${JSON.stringify(input)} ${JSON.stringify(check.errors)}`)
        continue
      }
      const file = generateSkillMd(check.skill, HEADING)
      const parsed = validateSkillMd(file)
      if (!parsed.ok || parsed.name !== check.skill.name || parsed.description !== check.skill.description) {
        failures.push(`${JSON.stringify(input)} → ${JSON.stringify(parsed)}`)
      }
    }
    expect(failures).toEqual([])
  })

  it('el archivo tiene la forma de una skill: frontmatter, título y pasos numerados', () => {
    const check = checkSkill({ name: 'revisar-recetas', description: 'Revisa recetas: "todas".', steps: '1. Lee\n- Revisa\n\nResponde' })
    expect(check.ok).toBe(true)
    expect(generateSkillMd(check.skill, HEADING)).toBe(
      ['---', 'name: revisar-recetas', 'description: "Revisa recetas: \\"todas\\"."', '---', '', '# Revisar recetas', '', '## Pasos', '', '1. Lee', '2. Revisa', '3. Responde', ''].join('\n'),
    )
  })

  it('los nombres que YAML leería como otra cosa van entre comillas', () => {
    for (const name of ['123', 'true', 'null', 'yes', 'off', '1e3', '0x1f']) {
      const file = generateSkillMd({ name, description: 'd', steps: ['p'] }, HEADING)
      expect(file, name).toContain(`name: "${name}"`)
    }
    expect(generateSkillMd({ name: 'pan', description: 'd', steps: ['p'] }, HEADING)).toContain('name: pan\n')
  })

  it('las skills del plugin de ejemplo pasan la misma validación y se llaman como su carpeta', () => {
    for (const path of ['es/panaderia/skills/escalar-receta/SKILL.md', 'en/bakery/skills/scale-recipe/SKILL.md']) {
      const text = readFileSync(join(process.cwd(), 'content', 'ailab', 'plugin-example', path), 'utf8')
      const parsed = validateSkillMd(text)
      expect(parsed.ok, path).toBe(true)
      expect(parsed.name, path).toBe(path.split('/').at(-2))
    }
  })
})

describe('cada campo inválido dice qué corregir (US3 escenario 3)', () => {
  const ok: SkillInput = { name: 'revisar-recetas', description: 'Revisa recetas.', steps: 'Lee' }

  it.each([
    ['', 'required'],
    ['   ', 'required'],
    ['x'.repeat(SKILL_NAME_MAX + 1), 'tooLong'],
    ['Mi Skill', 'format'],
    ['revisar_recetas', 'format'],
    ['-revisar', 'format'],
    ['revisar-', 'format'],
    ['revisar--recetas', 'format'],
    ['recetas-ñ', 'format'],
    ['claude-helper', 'reserved'],
    ['mi-anthropic', 'reserved'],
  ])('nombre %j → %s', (name, code) => {
    const check = checkSkill({ ...ok, name })
    expect(check.ok).toBe(false)
    expect(check.errors).toEqual({ name: code })
  })

  it.each([
    ['', 'required'],
    [' \n\t ', 'required'],
    ['d'.repeat(SKILL_DESCRIPTION_MAX + 1), 'tooLong'],
    ['Usa <b>negrilla</b>', 'markup'],
    ['menor > mayor', 'markup'],
  ])('descripción %j → %s', (description, code) => {
    const check = checkSkill({ ...ok, description })
    expect(check.ok).toBe(false)
    expect(check.errors).toEqual({ description: code })
  })

  it('los pasos vacíos piden al menos uno, y varios errores salen juntos', () => {
    expect(checkSkill({ ...ok, steps: '\n  \n- \n' }).errors).toEqual({ steps: 'required' })
    expect(checkSkill({ name: '', description: '', steps: '' }).errors).toEqual({ name: 'required', description: 'required', steps: 'required' })
  })

  it('cuenta caracteres, no unidades de UTF-16', () => {
    expect(checkSkill({ ...ok, description: '🍞'.repeat(SKILL_DESCRIPTION_MAX) }).ok).toBe(true)
    expect(checkSkill({ ...ok, description: '🍞'.repeat(SKILL_DESCRIPTION_MAX + 1) }).errors).toEqual({ description: 'tooLong' })
  })
})

describe('la validación de un SKILL.md escrito a mano', () => {
  it('sin frontmatter, sin cierre o con una línea rota, lo dice', () => {
    expect(validateSkillMd('# Sin frontmatter').errors).toEqual({ frontmatter: 'missing' })
    expect(validateSkillMd('---\nname: a\ndescription: b\n').errors).toEqual({ frontmatter: 'unclosed' })
    expect(validateSkillMd('---\nname: a\nesto no es yaml\n---\n').errors).toEqual({ frontmatter: 'syntax' })
    expect(validateSkillMd('---\nname: a\nname: b\ndescription: c\n---\n').errors).toEqual({ frontmatter: 'syntax' })
    expect(validateSkillMd('---\nname: a\ndescription: "sin cerrar\n---\n').errors).toEqual({ frontmatter: 'syntax' })
    expect(validateSkillMd('---\nname: a\ndescription: |\n  bloque\n---\n').errors).toEqual({ frontmatter: 'syntax' })
  })

  it('valida name y description, y acepta CRLF, BOM, comillas simples, comentarios y otras claves', () => {
    expect(validateSkillMd('\uFEFF---\r\nname: mi-skill\r\ndescription: Hace algo. # comentario\r\n---\r\n# Hola')).toEqual({
      ok: true,
      name: 'mi-skill',
      description: 'Hace algo.',
      errors: {},
    })
    expect(validateSkillMd("---\nname: 'mi-skill'\ndescription: 'It''s fine'\nallowed-tools: Read, Grep\nmetadata:\n  owner: yo\n---\n")).toMatchObject({
      ok: true,
      description: "It's fine",
    })
    expect(validateSkillMd('---\ndescription: falta el nombre\n---\n').errors).toEqual({ name: 'required' })
    expect(validateSkillMd('---\nname: Mal Nombre\ndescription: d\n---\n').errors).toEqual({ name: 'format' })
    expect(validateSkillMd('---\nname: true\ndescription: d\n---\n').errors).toEqual({ name: 'format' })
    expect(validateSkillMd('---\nname: "true"\ndescription: d\n---\n').ok).toBe(true)
    expect(validateSkillMd('---\nname: mi-claude\ndescription: <b>\n---\n').errors).toEqual({ name: 'reserved', description: 'markup' })
    expect(validateSkillMd('---\nname: a\ndescription: "\\u00f1and\\u00fa"\n---\n').description).toBe('ñandú')
  })

  it('lee el frontmatter sin evaluar nada', () => {
    expect(readFrontmatter('---\nname: a\n---\n').fields).toEqual({ name: { value: 'a', quoted: false } })
  })
})

describe('ayudas del formulario', () => {
  it('sugiere un nombre válido a partir de lo que escribieron', () => {
    expect(suggestName('Revisar Recetas')).toBe('revisar-recetas')
    expect(suggestName('  Ñandú   Ágil!! ')).toBe('nandu-agil')
    expect(suggestName('claude helper')).toBe('helper')
    expect(suggestName('Mi_Skill--2')).toBe('mi-skill-2')
    expect(suggestName('x'.repeat(70))).toBe('x'.repeat(SKILL_NAME_MAX))
    expect(suggestName('revisar-recetas')).toBeNull()
    expect(suggestName('¡¡!!')).toBeNull()
    expect(suggestName('claude')).toBeNull()
  })

  it('acepta pasos numerados o con viñetas y quita las líneas vacías', () => {
    expect(parseSteps('1. Uno\n2) Dos\n- Tres\n* Cuatro\n• Cinco\n\n   \nSeis')).toEqual(['Uno', 'Dos', 'Tres', 'Cuatro', 'Cinco', 'Seis'])
  })

  it('el título sale del nombre', () => {
    expect(skillTitle('revisar-recetas')).toBe('Revisar recetas')
    expect(skillTitle('123')).toBe('123')
  })
})

describe('la descarga se arma en el navegador (FR-353)', () => {
  it('crea un Blob, lo descarga como SKILL.md y libera la URL', async () => {
    const calls: string[] = []
    const later: Array<() => void> = []
    const link = {
      href: '',
      download: '',
      rel: '',
      hidden: false,
      click: () => calls.push(`click ${link.download} ${link.href}`),
      remove: () => calls.push('remove'),
    }
    const env: DownloadEnv = {
      document: {
        createElement: (() => link) as unknown as Document['createElement'],
        body: { append: () => calls.push('append') } as unknown as HTMLElement,
      },
      url: { createObjectURL: () => 'blob:skill', revokeObjectURL: (href: string) => calls.push(`revoke ${href}`) },
      later: (run) => later.push(run),
    }
    const text = generateSkillMd({ name: 'pan', description: 'd', steps: ['p'] }, HEADING)
    const blob = downloadText(SKILL_FILE_NAME, text, undefined, env)
    expect(calls).toEqual(['append', 'click SKILL.md blob:skill', 'remove'])
    later.forEach((run) => run())
    expect(calls.at(-1)).toBe('revoke blob:skill')
    expect(blob.type).toBe('text/markdown;charset=utf-8')
    expect(await blob.text()).toBe(text)
  })
})
