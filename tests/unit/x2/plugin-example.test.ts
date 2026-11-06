import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { labRepoHref } from '@/content/ailab/catalog'
import {
  PLUGIN_EXAMPLE_DIR,
  PLUGIN_EXAMPLE_ROOTS,
  pluginExample,
  pluginFileHref,
  pluginSourceKey,
  type PluginPartKind,
} from '@/content/ailab/plugin-example'
import sources from '@/content/ailab/plugin-example/sources.json'
import { buildTree, fileIds, folderIds, siblingsOf, treeKey, typeAhead, visibleIds } from '@/components/ailab/plugins/tree'

const BASE = join(process.cwd(), PLUGIN_EXAMPLE_DIR)
const LANGS = ['es', 'en'] as const
const KINDS: PluginPartKind[] = ['manifest', 'skill', 'command', 'hooks', 'hook-script', 'mcp', 'mcp-server']
const temp = mkdtempSync(join(tmpdir(), 'cw-x2-'))

afterAll(() => rmSync(temp, { recursive: true, force: true }))

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

function disk(): Record<string, string> {
  return Object.fromEntries(
    LANGS.flatMap((lang) => walk(join(BASE, lang))).map((file) => [relative(BASE, file).split('\\').join('/'), readFileSync(file, 'utf8').replace(/\r\n/g, '\n')]),
  )
}

function rpc(server: string, messages: unknown[]): Array<{ id: unknown; result?: Record<string, unknown>; error?: { code: number } }> {
  const run = spawnSync(process.execPath, [server], { input: messages.map((message) => JSON.stringify(message)).join('\n') + '\n', encoding: 'utf8', timeout: 15_000 })
  expect(run.status, run.stderr).toBe(0)
  return run.stdout
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line))
}

describe('el plugin de ejemplo es real y el explorador lee una copia exacta (FR-352)', () => {
  it('sources.json es copia byte a byte de los archivos del repo, sin sobrantes', () => {
    expect(sources).toEqual(disk())
  })

  it.each(LANGS)('en %s trae las siete piezas: manifiesto, skill, comando, hooks, su programa, .mcp.json y el servidor', (lang) => {
    const example = pluginExample(lang)
    expect(example.root).toBe(PLUGIN_EXAMPLE_ROOTS[lang])
    expect(example.files.map((file) => file.kind)).toEqual(KINDS)
    expect(Object.keys(sources).filter((key) => key.startsWith(`${lang}/`)).sort()).toEqual(example.files.map((file) => pluginSourceKey(lang, file.path)).sort())
    for (const file of example.files) {
      expect(file.content.trim(), file.path).not.toBe('')
      expect(file.what.trim(), file.path).not.toBe('')
      expect(file.trade.trim(), file.path).not.toBe('')
      expect(pluginFileHref(example, file.path)).toBe(labRepoHref(`${PLUGIN_EXAMPLE_DIR}/${lang}/${example.root}/${file.path}`))
    }
  })

  it.each(LANGS)('en %s los JSON son válidos y apuntan a archivos que existen', (lang) => {
    const example = pluginExample(lang)
    const read = (kind: PluginPartKind) => JSON.parse(example.files.find((file) => file.kind === kind)!.content)
    const manifest = read('manifest')
    expect(manifest.name).toBe(example.root)
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+$/)
    const paths = example.files.map((file) => file.path)
    const mcp = read('mcp') as { mcpServers: Record<string, { command: string; args: string[] }> }
    const [server] = Object.values(mcp.mcpServers)
    expect(server!.command).toBe('node')
    expect(paths).toContain(server!.args[0]!.replace('${CLAUDE_PLUGIN_ROOT}/', ''))
    const hooks = read('hooks') as { hooks: Record<string, Array<{ matcher: string; hooks: Array<{ type: string; command: string }> }>> }
    const [hook] = hooks.hooks.PostToolUse![0]!.hooks
    expect(hook!.type).toBe('command')
    expect(paths).toContain(/\$\{CLAUDE_PLUGIN_ROOT\}\/([^"]+)/.exec(hook!.command)![1])
  })

  it('es neutral e inventado: ni empleador, ni clientes, ni los plugins del autor, ni rutas privadas', () => {
    const corpus = JSON.stringify(sources) + JSON.stringify(LANGS.map((lang) => pluginExample(lang).files.map((file) => [file.what, file.trade])))
    for (const pattern of [/sistecr/i, /factor[ií]a/i, /azure devops/i, /datadog/i, /fluid attacks/i, /abogad/i, /lawyer/i, /despacho/i, /estructural/i, /structural/i, /clienta/i, /[A-Z]:\\Users/i, /\/Users\/[A-Za-z]/]) {
      expect(corpus, String(pattern)).not.toMatch(pattern)
    }
  })
})

describe.each([
  { lang: 'es', server: 'es/panaderia/servers/recetas.mjs', tool: 'escalar_receta', args: { ingredientes: [{ nombre: 'harina', gramos: 1000, tipo: 'harina' }, { nombre: 'agua', gramos: 680, tipo: 'liquido' }, { nombre: 'sal', gramos: 20, tipo: 'otro' }], masa_objetivo_g: 850 }, hydration: 'hidratacion', list: 'ingredientes', scaled: 'escalados' },
  { lang: 'en', server: 'en/bakery/servers/recipes.mjs', tool: 'scale_recipe', args: { ingredients: [{ name: 'flour', grams: 1000, type: 'flour' }, { name: 'water', grams: 680, type: 'liquid' }, { name: 'salt', grams: 20, type: 'other' }], target_dough_g: 850 }, hydration: 'hydration', list: 'ingredients', scaled: 'scaled' },
])('el servidor MCP de ejemplo responde por stdio ($lang)', ({ server, tool, args, hydration, list, scaled }) => {
  it('initialize, tools/list y tools/call con el cálculo correcto', () => {
    const [init, tools, call, failed, unknown] = rpc(join(BASE, server), [
      { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '0' } } },
      { jsonrpc: '2.0', method: 'notifications/initialized' },
      { jsonrpc: '2.0', id: 2, method: 'tools/list' },
      { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: tool, arguments: args } },
      { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: tool, arguments: {} } },
      { jsonrpc: '2.0', id: 5, method: 'resources/list' },
    ])
    expect(init).toMatchObject({ id: 1, result: { protocolVersion: '2025-06-18', capabilities: { tools: {} } } })
    expect((tools!.result!.tools as Array<{ name: string; inputSchema: { type: string } }>).map((item) => [item.name, item.inputSchema.type])).toEqual([[tool, 'object']])
    const output = JSON.parse((call!.result!.content as Array<{ text: string }>)[0]!.text)
    expect(output[hydration]).toBe(68)
    expect(output.factor).toBe(0.5)
    expect(output[list].map((item: Record<string, number>) => item[scaled])).toEqual([500, 340, 10])
    expect(failed!.result!.isError).toBe(true)
    expect(unknown!.error!.code).toBe(-32601)
  }, 90_000)
})

describe.each([
  { lang: 'es', hook: 'es/panaderia/hooks/revisar-alergenos.mjs', folder: 'recetas', heading: '## Alérgenos' },
  { lang: 'en', hook: 'en/bakery/hooks/check-allergens.mjs', folder: 'recipes', heading: '## Allergens' },
])('el hook de ejemplo frena una receta sin alérgenos ($lang)', ({ hook, folder, heading }) => {
  const run = (file: string) =>
    spawnSync(process.execPath, [join(BASE, hook)], { input: JSON.stringify({ tool_name: 'Write', tool_input: { file_path: file } }), encoding: 'utf8', timeout: 15_000 })

  it('sale con 2 y explica qué falta; con la sección, o fuera de la carpeta de recetas, deja pasar', () => {
    const dir = join(temp, folder)
    mkdirSync(dir, { recursive: true })
    const missing = join(dir, 'pan.md')
    const ok = join(dir, 'pan-listo.md')
    const other = join(temp, 'notas.md')
    writeFileSync(missing, '# Pan\n\n## Ingredientes\n\n- harina\n')
    writeFileSync(ok, `# Pan\n\n${heading}\n\nGluten.\n`)
    writeFileSync(other, '# Notas\n')
    const blocked = run(missing)
    expect(blocked.status).toBe(2)
    expect(blocked.stderr).toContain('pan.md')
    expect(run(ok).status).toBe(0)
    expect(run(other).status).toBe(0)
    expect(run(join(dir, 'no-existe.md')).status).toBe(0)
  }, 90_000)
})

describe('árbol de archivos accesible (role="tree", teclado)', () => {
  const tree = buildTree('panaderia', pluginExample('es').files.map((file) => file.path))
  const all = new Set(folderIds(tree))

  it('arma carpetas y archivos en el orden de lectura, con nivel y padre', () => {
    expect(tree.roots).toEqual(['panaderia'])
    expect(tree.nodes.get('panaderia')!.children).toEqual([
      'panaderia/.claude-plugin',
      'panaderia/skills',
      'panaderia/commands',
      'panaderia/hooks',
      'panaderia/.mcp.json',
      'panaderia/servers',
    ])
    expect(tree.nodes.get('panaderia/skills/escalar-receta/SKILL.md')).toMatchObject({ kind: 'file', level: 4, parent: 'panaderia/skills/escalar-receta' })
    expect(fileIds(tree)).toHaveLength(7)
    expect(siblingsOf(tree, 'panaderia/hooks/hooks.json')).toEqual(['panaderia/hooks/hooks.json', 'panaderia/hooks/revisar-alergenos.mjs'])
  })

  it('las flechas recorren lo visible; derecha abre y entra; izquierda cierra y sube', () => {
    expect(visibleIds(tree, all)).toHaveLength(tree.nodes.size)
    expect(visibleIds(tree, new Set())).toEqual(['panaderia'])
    expect(treeKey(tree, all, 'panaderia', 'ArrowDown')).toEqual({ focus: 'panaderia/.claude-plugin' })
    expect(treeKey(tree, all, 'panaderia/.claude-plugin', 'ArrowUp')).toEqual({ focus: 'panaderia' })
    expect(treeKey(tree, all, 'panaderia', 'ArrowUp')).toEqual({})
    expect(treeKey(tree, all, 'panaderia/servers/recetas.mjs', 'ArrowDown')).toEqual({})
    const closed = new Set(['panaderia'])
    expect(treeKey(tree, closed, 'panaderia/skills', 'ArrowRight')).toEqual({ expand: 'panaderia/skills' })
    expect(treeKey(tree, all, 'panaderia/skills', 'ArrowRight')).toEqual({ focus: 'panaderia/skills/escalar-receta' })
    expect(treeKey(tree, all, 'panaderia/.mcp.json', 'ArrowRight')).toEqual({})
    expect(treeKey(tree, all, 'panaderia/skills', 'ArrowLeft')).toEqual({ collapse: 'panaderia/skills' })
    expect(treeKey(tree, all, 'panaderia/.mcp.json', 'ArrowLeft')).toEqual({ focus: 'panaderia' })
    expect(treeKey(tree, closed, 'panaderia/hooks', 'ArrowDown')).toEqual({ focus: 'panaderia/.mcp.json' })
  })

  it('Inicio y Fin saltan; Enter y espacio abren archivos o pliegan carpetas; una letra busca', () => {
    expect(treeKey(tree, all, 'panaderia/hooks', 'Home')).toEqual({ focus: 'panaderia' })
    expect(treeKey(tree, all, 'panaderia', 'End')).toEqual({ focus: 'panaderia/servers/recetas.mjs' })
    expect(treeKey(tree, new Set(['panaderia']), 'panaderia', 'End')).toEqual({ focus: 'panaderia/servers' })
    expect(treeKey(tree, all, 'panaderia/.mcp.json', 'Enter')).toEqual({ select: 'panaderia/.mcp.json' })
    expect(treeKey(tree, all, 'panaderia/hooks', ' ')).toEqual({ toggle: 'panaderia/hooks' })
    expect(treeKey(tree, all, 'panaderia', 'h')).toEqual({ focus: 'panaderia/commands/hidratacion.md' })
    expect(typeAhead(tree, all, 'panaderia/commands/hidratacion.md', 'h')).toBe('panaderia/hooks')
    expect(treeKey(tree, all, 'panaderia', 'm')).toEqual({ focus: 'panaderia/.mcp.json' })
    expect(treeKey(tree, all, 'panaderia', 'z')).toEqual({})
    expect(treeKey(tree, all, 'panaderia', 'Tab')).toBeNull()
  })
})
