import type { Localized } from '@/content/types'
import type { Locale } from '@/lib/i18n/config'
import sources from './sources.json'

export const PLUGIN_EXAMPLE_DIR = 'content/ailab/plugin-example'

export const PLUGIN_EXAMPLE_REPO = 'https://github.com/CHERCED-DEV/CHERCED-WORLD/blob/main'

export type PluginPartKind = 'manifest' | 'skill' | 'command' | 'hooks' | 'hook-script' | 'mcp' | 'mcp-server'

export type PluginExampleFile = {
  path: string
  kind: PluginPartKind
  language: 'json' | 'markdown' | 'javascript'
  content: string
  what: string
  trade: string
}

export type PluginExample = { lang: Locale; root: string; repoDir: string; files: PluginExampleFile[] }

type FileSpec = {
  kind: PluginPartKind
  language: PluginExampleFile['language']
  path: Localized
  what: Localized
  trade: Localized
}

export const PLUGIN_EXAMPLE_ROOTS: Localized = { es: 'panaderia', en: 'bakery' }

const SPECS: readonly FileSpec[] = [
  {
    kind: 'manifest',
    language: 'json',
    path: { es: '.claude-plugin/plugin.json', en: '.claude-plugin/plugin.json' },
    what: {
      es: 'El manifiesto. Claude Code lo busca en .claude-plugin/plugin.json y lee de ahí el nombre, la versión, la descripción y el autor. Sin este archivo, la carpeta no es un plugin.',
      en: 'The manifest. Claude Code looks for it in .claude-plugin/plugin.json and reads the name, version, description and author from it. Without this file, the folder is not a plugin.',
    },
    trade: {
      es: 'En un plugin para una profesión, aquí se dice para quién es y qué resuelve. Las demás piezas no se registran a mano: Claude Code las descubre por la carpeta en la que viven.',
      en: 'In a plugin for a profession, this is where you say who it is for and what it solves. The other pieces are not registered by hand: Claude Code finds them by the folder they live in.',
    },
  },
  {
    kind: 'skill',
    language: 'markdown',
    path: { es: 'skills/escalar-receta/SKILL.md', en: 'skills/scale-recipe/SKILL.md' },
    what: {
      es: 'Una skill: instrucciones que Claude carga solo cuando hacen falta. Del frontmatter, name y description son lo único que tiene presente siempre; por eso la descripción dice qué hace y cuándo usarla.',
      en: 'A skill: instructions Claude loads only when they are needed. From the frontmatter, name and description are all it keeps in mind at all times; that is why the description says what it does and when to use it.',
    },
    trade: {
      es: 'Aquí vive el método del oficio: los pasos que seguiría alguien que sabe, y las reglas que no se rompen, como no inventar cantidades. Para otra profesión cambias el método, no la estructura.',
      en: 'This is where the method of the trade lives: the steps someone who knows would follow, and the rules that do not bend, like never making up amounts. For another profession you change the method, not the structure.',
    },
  },
  {
    kind: 'command',
    language: 'markdown',
    path: { es: 'commands/hidratacion.md', en: 'commands/hydration.md' },
    what: {
      es: 'Un comando: escribes /hidratacion receta.md y Claude recibe este texto con $ARGUMENTS reemplazado por lo que escribiste. El frontmatter le da la descripción y la pista del argumento.',
      en: 'A command: you type /hydration recipe.md and Claude receives this text with $ARGUMENTS replaced by what you typed. The frontmatter gives it the description and the argument hint.',
    },
    trade: {
      es: 'Es el atajo para la tarea de todos los días. En otra profesión sería otra tarea frecuente, con la misma forma: una línea para pedirla y unos pasos fijos.',
      en: 'It is the shortcut for the everyday task. In another profession it would be another frequent task, with the same shape: one line to ask for it and a few fixed steps.',
    },
  },
  {
    kind: 'hooks',
    language: 'json',
    path: { es: 'hooks/hooks.json', en: 'hooks/hooks.json' },
    what: {
      es: 'Los hooks corren un programa en un momento fijo, sin que Claude lo decida. Este, después de cada Write o Edit, le pasa el archivo que cambió al programa de la carpeta hooks.',
      en: 'Hooks run a program at a fixed moment, without Claude deciding to. This one, after every Write or Edit, hands the file that changed to the program in the hooks folder.',
    },
    trade: {
      es: 'Es la regla del oficio que no puede depender de que alguien se acuerde: aquí, que toda receta declare sus alérgenos.',
      en: 'It is the rule of the trade that cannot depend on someone remembering: here, that every recipe lists its allergens.',
    },
  },
  {
    kind: 'hook-script',
    language: 'javascript',
    path: { es: 'hooks/revisar-alergenos.mjs', en: 'hooks/check-allergens.mjs' },
    what: {
      es: 'El programa del hook. Recibe por la entrada estándar un JSON con la herramienta que corrió y el archivo que tocó. Si termina con código 2, lo que escribe en stderr le llega a Claude para que lo corrija.',
      en: 'The hook program. It receives on standard input a JSON with the tool that ran and the file it touched. If it exits with code 2, what it writes to stderr reaches Claude so it can fix it.',
    },
    trade: {
      es: 'La regla queda en código: se prueba una vez y no se negocia en cada conversación.',
      en: 'The rule lives in code: it is tested once and not negotiated in every conversation.',
    },
  },
  {
    kind: 'mcp',
    language: 'json',
    path: { es: '.mcp.json', en: '.mcp.json' },
    what: {
      es: 'Declara los servidores MCP del plugin: qué programa arrancar y con qué argumentos. ${CLAUDE_PLUGIN_ROOT} es la carpeta del plugin, esté donde esté instalado.',
      en: 'It declares the MCP servers of the plugin: which program to start and with which arguments. ${CLAUDE_PLUGIN_ROOT} is the plugin folder, wherever it is installed.',
    },
    trade: {
      es: 'Conecta el plugin con lo que el oficio ya usa: una calculadora, un catálogo o un sistema propio.',
      en: 'It connects the plugin to what the trade already uses: a calculator, a catalog or an in-house system.',
    },
  },
  {
    kind: 'mcp-server',
    language: 'javascript',
    path: { es: 'servers/recetas.mjs', en: 'servers/recipes.mjs' },
    what: {
      es: 'Un servidor MCP mínimo, sin dependencias: habla JSON-RPC por la entrada y la salida estándar y ofrece una herramienta, escalar_receta, con su esquema de entrada.',
      en: 'A minimal MCP server, with no dependencies: it speaks JSON-RPC over standard input and output and offers one tool, scale_recipe, with its input schema.',
    },
    trade: {
      es: 'El cálculo en el que el oficio confía va en código determinista, no en lo que el modelo recuerde: Claude pide el número y lo explica.',
      en: 'The calculation the trade trusts goes in deterministic code, not in what the model remembers: Claude asks for the number and explains it.',
    },
  },
]

const SOURCES: Readonly<Record<string, string>> = sources

export function pluginSourceKey(lang: Locale, path: string): string {
  return `${lang}/${PLUGIN_EXAMPLE_ROOTS[lang]}/${path}`
}

export function pluginFileHref(example: Pick<PluginExample, 'repoDir'>, path: string): string {
  return `${PLUGIN_EXAMPLE_REPO}/${example.repoDir}/${path}`
}

export function pluginExample(lang: Locale): PluginExample {
  const root = PLUGIN_EXAMPLE_ROOTS[lang]
  return {
    lang,
    root,
    repoDir: `${PLUGIN_EXAMPLE_DIR}/${lang}/${root}`,
    files: SPECS.map((spec) => {
      const key = pluginSourceKey(lang, spec.path[lang])
      const content = SOURCES[key]
      if (content === undefined) throw new Error(`El plugin de ejemplo no tiene ${key}`)
      return { path: spec.path[lang], kind: spec.kind, language: spec.language, content, what: spec.what[lang], trade: spec.trade[lang] }
    }),
  }
}
