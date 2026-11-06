import en from '@/content/i18n/en/ailab.json'
import es from '@/content/i18n/es/ailab.json'
import {
  LAB_THEMES,
  type LabDownload,
  type LabExperiment,
  type LabExperimentId,
  type LabTheme,
  type Localized,
} from '@/content/types'

export const LAB_REPO_URL = 'https://github.com/CHERCED-DEV/CHERCED-WORLD'

export const LAB_REPO_BRANCH = 'main'

const MB = 1_000_000

type CopyKey = keyof typeof es & keyof typeof en

function copy(key: CopyKey): Localized {
  return { es: es[key], en: en[key] }
}

export const WHISPER_TINY: LabDownload = { resource: 'Whisper tiny (int8)', bytes: 41 * MB, host: 'huggingface.co' }

export const WHISPER_BASE: LabDownload = { resource: 'Whisper base (int8)', bytes: 77 * MB, host: 'huggingface.co' }

export const WHISPER_SMALL: LabDownload = { resource: 'Whisper small (int8)', bytes: 249 * MB, host: 'huggingface.co' }

export const E5_SMALL: LabDownload = { resource: 'multilingual-e5-small (int8)', bytes: 118 * MB, host: 'huggingface.co' }

export const PYODIDE_CORE: LabDownload = { resource: 'Pyodide 0.29.0', bytes: 12 * MB, host: 'cdn.jsdelivr.net' }

export const PYODIDE_NUMPY: LabDownload = { resource: 'numpy (Pyodide 0.29.0)', bytes: 3_100_000, host: 'cdn.jsdelivr.net' }

const V1: LabExperiment = {
  id: 'V1',
  theme: 'voice',
  title: copy('ailab.v1.title'),
  summary: copy('ailab.v1.summary'),
  status: 'beta',
  runsIn: 'browser',
  downloads: [{ ...WHISPER_BASE, default: true }, WHISPER_TINY, WHISPER_SMALL],
  privacy: copy('ailab.v1.privacy'),
  flow: [
    { es: 'Grabas o subes un audio', en: 'You record or upload audio' },
    { es: 'Whisper lo transcribe en un worker de tu navegador', en: 'Whisper transcribes it in a worker in your browser' },
    { es: 'Texto con marcas de tiempo, en .txt o .srt', en: 'Text with timestamps, as .txt or .srt' },
  ],
  adrCards: [
    {
      decision: { es: 'Whisper en el navegador, con Transformers.js', en: 'Whisper in the browser, with Transformers.js' },
      why: {
        es: 'La Web Speech API manda el audio a un servicio del navegador. Aquí el audio no sale de tu equipo.',
        en: 'The Web Speech API sends the audio to a browser service. Here the audio never leaves your device.',
      },
      tradeoff: {
        es: 'La primera vez hay que descargar el modelo, y la velocidad depende de tu equipo.',
        en: 'The first time you have to download the model, and the speed depends on your device.',
      },
    },
    {
      decision: { es: 'Base por defecto, con tiny de respaldo', en: 'Base by default, with tiny as a fallback' },
      why: {
        es: 'Small es más preciso, pero 249 MB es mucho para una primera prueba en el móvil.',
        en: 'Small is more accurate, but 249 MB is a lot for a first try on a phone.',
      },
      tradeoff: {
        es: 'En español, small promete más precisión: por eso queda como opción, con su peso a la vista.',
        en: 'In Spanish, small promises more accuracy: that is why it stays as an option, with its size in sight.',
      },
    },
  ],
  code: {
    snippet: `export function requestDownload(request: DownloadRequest): Promise<boolean> {
  assertDownloadRequest(request)
  if (hasConsent(request.experiment, request.resource)) return Promise.resolve(true)
  const key = consentKey(request.experiment, request.resource)
  const existing = pending.get(key)
  if (existing) return existing
  const turn = queue.then(() => ask(request))
  queue = turn.catch(() => false)
  const result = turn.finally(() => pending.delete(key))
  pending.set(key, result)
  return result
}`,
    lang: 'ts',
    repoPath: 'lib/ailab/core/consent.ts',
  },
}

const V2: LabExperiment = {
  id: 'V2',
  theme: 'voice',
  title: copy('ailab.v2.title'),
  summary: copy('ailab.v2.summary'),
  status: 'beta',
  runsIn: 'browser',
  downloads: [],
  privacy: copy('ailab.v2.privacy'),
  flow: [
    { es: 'Escribes un texto y eliges una voz', en: 'You type some text and pick a voice' },
    { es: 'La Web Speech API lo lee con una voz de tu sistema', en: 'The Web Speech API reads it with a voice from your system' },
    { es: 'Lo escuchas, con reproducir, pausar y detener desde el teclado', en: 'You hear it, with play, pause and stop from the keyboard' },
  ],
  adrCards: [
    {
      decision: { es: 'La voz del navegador, sin descargas', en: "The browser's voice, with no downloads" },
      why: {
        es: 'La Web Speech API ya trae voces en español y en inglés.',
        en: 'The Web Speech API already comes with Spanish and English voices.',
      },
      tradeoff: {
        es: 'Las voces cambian de un sistema a otro, y en algunos navegadores se generan en línea: la tarjeta te avisa antes.',
        en: 'Voices change from one system to another, and in some browsers they are generated online: the card warns you first.',
      },
    },
  ],
  code: null,
}

const V3: LabExperiment = {
  id: 'V3',
  theme: 'voice',
  title: copy('ailab.v3.title'),
  summary: copy('ailab.v3.summary'),
  status: 'beta',
  runsIn: 'browser',
  downloads: [],
  privacy: copy('ailab.v3.privacy'),
  flow: [
    { es: 'Eliges un post', en: 'You pick a post' },
    { es: 'Se toma solo el cuerpo, sin los bloques de código', en: 'Only the body is taken, without the code blocks' },
    { es: 'La voz del navegador lo lee en el idioma de la página', en: "The browser's voice reads it in the page's language" },
  ],
  adrCards: [
    {
      decision: { es: 'Leer en vivo con la voz del navegador', en: "Read live with the browser's voice" },
      why: {
        es: 'Pregenerar el audio exige un motor en el build, y eso necesita un servidor o una llave.',
        en: 'Pregenerating the audio needs an engine in the build, and that needs a server or a key.',
      },
      tradeoff: {
        es: 'La voz depende del sistema de quien escucha.',
        en: 'The voice depends on the listener’s system.',
      },
    },
    {
      decision: { es: 'Un motor que se reutiliza', en: 'An engine that gets reused' },
      why: {
        es: 'Es la base de «Escuchar este post» en el blog.',
        en: 'It is the base for “Listen to this post” on the blog.',
      },
      tradeoff: {
        es: 'El blog depende de que este motor no cambie su contrato.',
        en: 'The blog depends on this engine not changing its contract.',
      },
    },
  ],
  code: null,
}

const V4: LabExperiment = {
  id: 'V4',
  theme: 'voice',
  title: copy('ailab.v4.title'),
  summary: copy('ailab.v4.summary'),
  status: 'experiment',
  runsIn: 'browser',
  downloads: [{ ...WHISPER_TINY, default: true }],
  privacy: copy('ailab.v4.privacy'),
  flow: [
    { es: 'Mantienes el botón y dices un comando, o lo escribes', en: 'You hold the button and say a command, or type it' },
    { es: 'Whisper tiny lo convierte en texto en tu navegador', en: 'Whisper tiny turns it into text in your browser' },
    { es: 'Se compara con la lista de frases y corre el comando de la paleta', en: 'It is matched against the phrase list and the palette command runs' },
  ],
  adrCards: [
    {
      decision: {
        es: 'Whisper local y un emparejador de frases, sin modelo de lenguaje',
        en: 'Local Whisper and a phrase matcher, with no language model',
      },
      why: {
        es: 'La Web Speech API manda el audio a un servicio, y una lista cerrada de comandos no necesita un LLM.',
        en: 'The Web Speech API sends the audio to a service, and a closed list of commands does not need an LLM.',
      },
      tradeoff: {
        es: 'Solo entiende las frases de la lista; si no, te muestra lo que entendió y las opciones.',
        en: 'It only understands the phrases on the list; otherwise it shows you what it heard and the options.',
      },
    },
    {
      decision: { es: 'Solo ejecuta comandos de la paleta', en: 'It only runs palette commands' },
      why: {
        es: 'Nunca convierte texto libre en acciones: es la misma lista que usas con Ctrl+K.',
        en: 'It never turns free text into actions: it is the same list you use with Ctrl+K.',
      },
      tradeoff: {
        es: 'No puede hacer nada que la paleta no sepa hacer.',
        en: 'It cannot do anything the palette does not know how to do.',
      },
    },
  ],
  code: {
    snippet: `export function runPaletteCommand(id: PaletteCommandId | string): boolean {
  const current = runner
  const item = findPaletteCommand(id)
  if (!current || !item) return false
  current.run(item)
  return true
}`,
    lang: 'ts',
    repoPath: 'components/experience/palette-model.ts',
  },
}

const A2: LabExperiment = {
  id: 'A2',
  theme: 'agents',
  title: copy('ailab.a2.title'),
  summary: copy('ailab.a2.summary'),
  status: 'stable',
  runsIn: 'browser',
  downloads: [],
  privacy: copy('ailab.a2.privacy'),
  flow: [
    {
      es: '.claude-plugin/plugin.json declara el plugin: nombre, versión, descripción y autor',
      en: '.claude-plugin/plugin.json declares the plugin: name, version, description and author',
    },
    {
      es: 'Claude Code descubre cada pieza por su carpeta: skills/, commands/, hooks/ y .mcp.json con su servidor',
      en: 'Claude Code finds each piece by its folder: skills/, commands/, hooks/ and .mcp.json with its server',
    },
    {
      es: 'Recorres el árbol con mouse, dedo o teclado, y cada archivo dice para qué sirve y dónde entra el oficio',
      en: 'You walk the tree with mouse, finger or keyboard, and each file says what it is for and where the trade comes in',
    },
  ],
  adrCards: [
    {
      decision: { es: 'Un plugin de ejemplo neutral: una panadería inventada', en: 'A neutral sample plugin: a made-up bakery' },
      why: {
        es: 'Muestra la estructura completa, y cómo entra un oficio en cada pieza, sin exponer el trabajo de ningún cliente.',
        en: "It shows the full structure, and how a trade comes into each piece, without exposing any client's work.",
      },
      tradeoff: {
        es: 'No es el plugin que uso con una profesión real.',
        en: 'It is not the plugin I use with a real profession.',
      },
    },
    {
      decision: { es: 'Los archivos del explorador son los del repo', en: 'The files in the explorer are the ones in the repo' },
      why: {
        es: 'Lo que ves es copia exacta de content/ailab/plugin-example, una prueba lo verifica y otra corre con Node el servidor MCP y el hook.',
        en: 'What you see is an exact copy of content/ailab/plugin-example, one test checks it and another runs the MCP server and the hook with Node.',
      },
      tradeoff: {
        es: 'Si cambio un archivo del plugin, la copia que lee el explorador tiene que cambiar con él.',
        en: 'If I change a file of the plugin, the copy the explorer reads has to change with it.',
      },
    },
    {
      decision: { es: 'Todo estático, sin descargas', en: 'All static, with no downloads' },
      why: {
        es: 'Leer la estructura de un plugin no necesita un modelo.',
        en: "Reading a plugin's structure does not need a model.",
      },
      tradeoff: {
        es: 'No ejecuta el plugin: lo explica.',
        en: 'It does not run the plugin: it explains it.',
      },
    },
  ],
  code: {
    snippet: `export function treeKey(tree: FileTree, expanded: ReadonlySet<string>, current: string, key: string): TreeMove | null {
  const node = tree.nodes.get(current)
  if (!node) return null
  const visible = visibleIds(tree, expanded)
  const index = visible.indexOf(current)
  const open = node.kind === 'folder' && expanded.has(current)
  switch (key) {
    case 'ArrowDown':
      return index < visible.length - 1 ? { focus: visible[index + 1]! } : {}
    case 'ArrowUp':
      return index > 0 ? { focus: visible[index - 1]! } : {}
    case 'ArrowRight':
      if (node.kind === 'file') return {}
      if (!open) return { expand: current }
      return node.children.length > 0 ? { focus: node.children[0]! } : {}
    case 'ArrowLeft':
      if (open) return { collapse: current }
      return node.parent ? { focus: node.parent } : {}`,
    lang: 'ts',
    repoPath: 'components/ailab/plugins/tree.ts',
  },
}

const A3: LabExperiment = {
  id: 'A3',
  theme: 'agents',
  title: copy('ailab.a3.title'),
  summary: copy('ailab.a3.summary'),
  status: 'stable',
  runsIn: 'browser',
  downloads: [],
  privacy: copy('ailab.a3.privacy'),
  flow: [
    { es: 'Escribes el nombre, qué hace y cuándo usarla, y sus pasos', en: 'You write the name, what it does and when to use it, and its steps' },
    {
      es: 'Se valida el frontmatter: name en minúsculas y guiones, de hasta 64 caracteres, y description de hasta 1024',
      en: 'The frontmatter is validated: name in lowercase and hyphens, up to 64 characters, and description up to 1024',
    },
    {
      es: 'Descargas tu SKILL.md, armado en tu navegador como un Blob, sin pasar por un servidor',
      en: 'You download your SKILL.md, built in your browser as a Blob, without going through a server',
    },
  ],
  adrCards: [
    {
      decision: { es: 'El SKILL.md se genera en el navegador', en: 'The SKILL.md is generated in the browser' },
      why: {
        es: 'Sin servidor no hay una entrada pública que proteger, y lo que escribes no sale de tu equipo.',
        en: 'With no server there is no public endpoint to protect, and what you write never leaves your device.',
      },
      tradeoff: {
        es: 'Se valida el frontmatter (name y description), no lo que hará la skill.',
        en: 'The frontmatter (name and description) is validated, not what the skill will do.',
      },
    },
    {
      decision: { es: 'La descripción va siempre entre comillas', en: 'The description always goes in quotes' },
      why: {
        es: 'Así un «:», un «#» o unas comillas en tu texto no rompen el YAML del frontmatter.',
        en: 'That way a ":", a "#" or quotes in your text do not break the YAML of the frontmatter.',
      },
      tradeoff: {
        es: 'El archivo se ve un poco más rígido que uno escrito a mano.',
        en: 'The file looks a little stiffer than one written by hand.',
      },
    },
    {
      decision: { es: 'Errores por campo, con un nombre sugerido', en: 'Errors per field, with a suggested name' },
      why: {
        es: 'Si el nombre trae mayúsculas, espacios o tildes, te propongo uno válido en vez de solo decir que está mal.',
        en: 'If the name has capitals, spaces or accents, I suggest a valid one instead of only saying it is wrong.',
      },
      tradeoff: {
        es: 'La sugerencia es mecánica: no entiende lo que quisiste decir.',
        en: 'The suggestion is mechanical: it does not understand what you meant.',
      },
    },
  ],
  code: {
    snippet: `export function generateSkillMd(skill: SkillDraft, options: SkillMarkdownOptions): string {
  const steps = skill.steps.map(cleanLine).filter(Boolean).map((step, index) => \`\${index + 1}. \${step}\`)
  return [
    '---',
    \`name: \${yamlName(skill.name)}\`,
    \`description: \${yamlString(cleanLine(skill.description))}\`,
    '---',
    '',
    \`# \${skillTitle(skill.name)}\`,
    '',
    \`## \${options.stepsHeading}\`,
    '',
    ...steps,
    '',
  ].join('\\n')
}`,
    lang: 'ts',
    repoPath: 'lib/ailab/skill/generate.ts',
  },
}

const A5: LabExperiment = {
  id: 'A5',
  theme: 'agents',
  title: copy('ailab.a5.title'),
  summary: copy('ailab.a5.summary'),
  status: 'beta',
  runsIn: 'browser',
  downloads: [E5_SMALL],
  privacy: copy('ailab.a5.privacy'),
  flow: [
    {
      es: 'Escribes una pregunta: se pasa a minúsculas, sin tildes, y se parte en palabras',
      en: 'You type a question: it is lowercased, stripped of accents and split into words',
    },
    {
      es: 'BM25 busca en el índice del sitio, el mismo del asistente, y cada palabra se vuelve a buscar sola',
      en: "BM25 searches the site's index, the same one the assistant uses, and each word is searched again on its own",
    },
    {
      es: 'Ves cada fragmento con su puntaje, su fuente, su enlace y lo que aportó cada palabra',
      en: 'You see each passage with its score, its source, its link and what each word added',
    },
  ],
  adrCards: [
    {
      decision: { es: 'BM25 sobre el índice que ya existe', en: 'BM25 over the index that already exists' },
      why: {
        es: 'No descarga nada, y su puntaje se puede mostrar tal cual.',
        en: 'It downloads nothing, and its score can be shown as is.',
      },
      tradeoff: {
        es: 'Busca palabras, no significados.',
        en: 'It searches for words, not meanings.',
      },
    },
    {
      decision: { es: 'El puntaje se explica con el mismo buscador', en: 'The score is explained with the same search engine' },
      why: {
        es: 'Cada palabra se busca sola con el buscador del sitio: lo que aporta cada una, sumado y multiplicado por las que coincidieron, da el total, y una prueba lo verifica.',
        en: "Each word is searched on its own with the site's search engine: what each one adds, summed and multiplied by the ones that matched, gives the total, and a test checks it.",
      },
      tradeoff: {
        es: 'Para decir en qué campo coincidió, repito las reglas de coincidencia del buscador; si cambian, una prueba avisa.',
        en: 'To say which field it matched, I repeat the matching rules of the search engine; if they change, a test warns me.',
      },
    },
    {
      decision: { es: 'La búsqueda por significado espera una medición', en: 'Search by meaning waits for a measurement' },
      why: {
        es: 'Precalcular los vectores de multilingual-e5-small en el build tiene un costo que todavía no medí. Si cabe, llega con su permiso de descarga.',
        en: 'Precomputing the multilingual-e5-small vectors in the build has a cost I have not measured yet. If it fits, it arrives with its download permission.',
      },
      tradeoff: {
        es: 'Mientras tanto, una pregunta escrita con otras palabras no encuentra lo que dice lo mismo.',
        en: 'In the meantime, a question written with other words does not find what says the same thing.',
      },
    },
  ],
  code: {
    snippet: `const explained = terms.flatMap(({ term, occurrences }) => {
  const scores = termScores(term)
  const single = scores.get(hit.doc.id)
  if (single === undefined) return []
  return [{ term, occurrences, score: single * occurrences, documents: scores.size, matches: explain(hit.doc, term) }]
})`,
    lang: 'ts',
    repoPath: 'lib/ailab/search/glassbox.ts',
  },
}

const R1: LabExperiment = {
  id: 'R1',
  theme: 'architecture',
  title: copy('ailab.r1.title'),
  summary: copy('ailab.r1.summary'),
  status: 'stable',
  runsIn: 'browser',
  downloads: [],
  privacy: copy('ailab.r1.privacy'),
  flow: [
    {
      es: 'Eliges qué servicio se cae: la aerolínea, el hotel, la agencia de autos o la pasarela de pago',
      en: 'You pick which service goes down: the airline, the hotel, the car rental or the payment gateway',
    },
    {
      es: 'La saga reserva el vuelo, aparta hotel y auto, y deja el cobro para el final',
      en: 'The saga books the flight, holds the hotel and the car, and leaves the payment for last',
    },
    {
      es: 'Si algo falla, compensa en orden inverso: suelta los apartados y cancela la reserva',
      en: 'If something fails, it compensates in reverse order: it releases the holds and cancels the booking',
    },
  ],
  adrCards: [
    {
      decision: { es: 'Una saga con compensación en orden inverso', en: 'A saga with compensation in reverse order' },
      why: {
        es: 'Sin una transacción global, cada paso hecho necesita su forma de deshacerse.',
        en: 'Without a global transaction, every completed step needs its own way to be undone.',
      },
      tradeoff: {
        es: 'Deshacer una reserva no es lo mismo que soltar un apartado: cancelar el vuelo es una operación nueva que queda registrada; soltar el hotel o el auto no deja rastro.',
        en: "Undoing a booking isn't the same as releasing a hold: cancelling the flight is a new operation that gets recorded; releasing the hotel or the car leaves no trace.",
      },
    },
    {
      decision: { es: 'El cobro va de último', en: 'The payment goes last' },
      why: {
        es: 'Es el punto de no retorno: si el cobro pasa, ya nada falla después, y por eso no necesita compensación.',
        en: 'It is the point of no return: if the payment goes through, nothing fails after it, so it needs no compensation.',
      },
      tradeoff: {
        es: 'Hotel y auto quedan apartados mientras llega el cobro, y solo se confirman al final.',
        en: 'The hotel and the car stay on hold while the payment arrives, and are only confirmed at the end.',
      },
    },
    {
      decision: { es: 'Una simulación determinista, contada en una bitácora', en: 'A deterministic simulation, told in a log' },
      why: {
        es: 'El motor es una función pura: el mismo fallo da siempre la misma traza, cada punto de fallo tiene su prueba y la bitácora se anuncia con aria-live.',
        en: 'The engine is a pure function: the same failure always gives the same trace, every failure point has its test and the log is announced with aria-live.',
      },
      tradeoff: {
        es: 'No hay red ni latencia reales: es un modelo del sistema.',
        en: 'There is no real network or latency: it is a model of the system.',
      },
    },
  ],
  code: {
    snippet: `export function compensationFor(kind: Completed['kind']): SagaCompensation {
  return kind === 'booking' ? 'cancel' : 'release'
}

function compensate(done: readonly Completed[]): SagaEvent[] {
  return [...done].reverse().map(({ step, kind, ref }) => ({
    type: 'compensate',
    step,
    action: compensationFor(kind),
    ref,
  }))
}`,
    lang: 'ts',
    repoPath: 'lib/ailab/saga/engine.ts',
  },
}

const A4: LabExperiment = {
  id: 'A4',
  theme: 'agents',
  title: copy('ailab.a4.title'),
  summary: copy('ailab.a4.summary'),
  status: 'beta',
  runsIn: 'browser',
  downloads: [PYODIDE_CORE, PYODIDE_NUMPY],
  privacy: copy('ailab.a4.privacy'),
  flow: [
    {
      es: 'Despacho: un caso ficticio con su material, sus hechos con prueba y su cronología',
      en: 'Despacho: a fictional case with its material, its facts with evidence and its timeline',
    },
    { es: 'Obra: cambias una cantidad o una medida de la bitácora de ejemplo', en: 'Obra: you change a count or a measurement in the sample log' },
    {
      es: 'Python con numpy recalcula el estimado en COP en un worker, y ves el código que corrió',
      en: 'Python with numpy recalculates the estimate in COP in a worker, and you see the code that ran',
    },
  ],
  adrCards: [
    {
      decision: { es: 'Datos inventados y resultados pregenerados en Despacho', en: 'Made-up data and pregenerated results in Despacho' },
      why: {
        es: 'Muestra el método, cada hecho con su prueba y cada fecha con su certeza, sin material de clientes ni un modelo en vivo.',
        en: 'It shows the method, every fact with its evidence and every date with its certainty, without client material or a live model.',
      },
      tradeoff: {
        es: 'No responde a un caso tuyo: eso exigiría un servidor con un modelo.',
        en: 'It does not answer a case of yours: that would need a server with a model.',
      },
    },
    {
      decision: { es: 'Python con Pyodide en un worker para Obra', en: 'Python with Pyodide in a worker for Obra' },
      why: {
        es: 'Es Python en pequeño, sin servidor: numpy saca las cantidades y el estimado en tu navegador.',
        en: 'It is Python on a small scale, with no server: numpy works out the quantities and the estimate in your browser.',
      },
      tradeoff: {
        es: 'La primera vez descarga unos 15 MB entre Pyodide y numpy, y pide permiso para cada uno.',
        en: 'The first time it downloads about 15 MB between Pyodide and numpy, and asks permission for each one.',
      },
    },
    {
      decision: { es: 'El código que corre es el que ves', en: 'The code that runs is the code you see' },
      why: {
        es: 'El worker ejecuta estimate.py tal cual se muestra, y una prueba verifica que es el mismo archivo del repo.',
        en: 'The worker runs estimate.py exactly as shown, and a test checks that it is the same file as in the repo.',
      },
      tradeoff: {
        es: 'El estimado es tan simple como ese código: cuantías y precios de ejemplo, sin el criterio de un ingeniero.',
        en: "The estimate is as simple as that code: sample ratios and prices, without an engineer's judgment.",
      },
    },
  ],
  code: {
    snippet: `def quantities(items, ratios):
    kinds = np.array([item["kind"] for item in items])
    count = np.array([item["count"] for item in items], dtype=float)
    a = np.array([item["a"] for item in items], dtype=float)
    b = np.array([item["b"] for item in items], dtype=float)
    c = np.array([item["c"] for item in items], dtype=float)
    volume = count * a * b * c
    formwork = np.select(
        [kinds == "beam", kinds == "slab"],
        [count * (a + 2 * b) * c, count * a * b],
        default=count * 2 * (a + b) * c,
    )
    steel = volume * np.array([ratios[kind] for kind in kinds], dtype=float)
    return rounded(volume, 2), rounded(formwork, 2), rounded(steel)`,
    lang: 'python',
    repoPath: 'lib/ailab/pyodide/estimate.py',
  },
}

const J1: LabExperiment = {
  id: 'J1',
  theme: 'games',
  title: copy('ailab.j1.title'),
  summary: copy('ailab.j1.summary'),
  status: 'experiment',
  runsIn: 'browser',
  downloads: [],
  privacy: copy('ailab.j1.privacy'),
  flow: [
    { es: 'Juegas un rally con teclado, mouse o toque', en: 'You play a rally with keyboard, mouse or touch' },
    { es: 'La red del rival aprende por refuerzo en un worker', en: "The rival's network learns by reinforcement in a worker" },
    { es: 'Sus neuronas se encienden y la curva muestra cuánto mejora', en: 'Its neurons light up and the curve shows how much it improves' },
  ],
  adrCards: [
    {
      decision: { es: 'Una red propia de dos capas de 16 neuronas', en: 'An in-house network with two layers of 16 neurons' },
      why: {
        es: 'TensorFlow.js pesa más de 1 MB para una red de este tamaño.',
        en: 'TensorFlow.js weighs more than 1 MB for a network this size.',
      },
      tradeoff: {
        es: 'El forward y los gradientes se escriben y se prueban a mano.',
        en: 'The forward pass and the gradients are written and tested by hand.',
      },
    },
    {
      decision: { es: 'REINFORCE con línea base, en un worker', en: 'REINFORCE with a baseline, in a worker' },
      why: {
        es: 'El entrenamiento no le quita fluidez al juego ni al fondo animado.',
        en: 'Training does not take smoothness away from the game or the animated background.',
      },
      tradeoff: {
        es: 'Los pesos viajan al juego cada pocos rallies, no en cada golpe.',
        en: 'The weights travel to the game every few rallies, not on every hit.',
      },
    },
    {
      decision: { es: 'Lo que aprende queda en tu navegador', en: 'What it learns stays in your browser' },
      why: {
        es: 'Es tu progreso, como un easter egg descubierto, y lo borras con un botón.',
        en: 'It is your progress, like a discovered easter egg, and you delete it with a button.',
      },
      tradeoff: {
        es: 'Si cambias de navegador, el rival empieza de cero.',
        en: 'If you switch browsers, the rival starts from scratch.',
      },
    },
  ],
  code: {
    snippet: `async checkpoint() {
  if (signal.aborted) throw abortError()
  while (paused) {
    await new Promise<void>((resolve) => {
      const done = () => {
        signal.removeEventListener('abort', done)
        resolve()
      }
      waiters.push(done)
      signal.addEventListener('abort', done, { once: true })
    })
    if (signal.aborted) throw abortError()
  }
},`,
    lang: 'ts',
    repoPath: 'lib/ailab/core/worker-runtime.ts',
  },
}

const J2: LabExperiment = {
  id: 'J2',
  theme: 'games',
  title: copy('ailab.j2.title'),
  summary: copy('ailab.j2.summary'),
  status: 'experiment',
  runsIn: 'browser',
  downloads: [],
  privacy: copy('ailab.j2.privacy'),
  flow: [
    { es: 'Juegas unos rallies de grabación', en: 'You play a few recording rallies' },
    { es: 'La misma red aprende por imitación de tus movimientos', en: 'The same network learns by imitating your moves' },
    {
      es: 'Juegas contra un rival que se mueve como tú, con su parecido en pantalla',
      en: 'You play against a rival that moves like you, with its likeness on screen',
    },
  ],
  adrCards: [
    {
      decision: { es: 'La misma red de J1, entrenada por imitación', en: 'The same network as J1, trained by imitation' },
      why: {
        es: 'Reutiliza el motor: solo cambia lo que aprende, pares de estado y movimiento.',
        en: 'It reuses the engine: only what it learns changes, pairs of state and move.',
      },
      tradeoff: {
        es: 'Imita tus tendencias, no cada gesto.',
        en: 'It imitates your tendencies, not every gesture.',
      },
    },
    {
      decision: { es: 'El estado guardado lleva versión', en: 'The saved state carries a version' },
      why: {
        es: 'Si el juego cambia, los datos de una versión anterior se descartan y el rival empieza de nuevo.',
        en: 'If the game changes, data from an older version is discarded and the rival starts over.',
      },
      tradeoff: {
        es: 'Una actualización del juego borra lo que había aprendido.',
        en: 'A game update deletes what it had learned.',
      },
    },
  ],
  code: {
    snippet: `async get<T = unknown>(key: string, options: LabStoreGetOptions = {}): Promise<T | null> {
  const found = await run('readonly', (store) => store.get(key))
  const value = found.ok ? found.value : memory.get(key)
  if (value === undefined || value === null) return null
  if (options.version !== undefined && versionOf(value) !== options.version) {
    await labStore.delete(key)
    return null
  }
  return value as T
},`,
    lang: 'ts',
    repoPath: 'lib/ailab/core/store.ts',
  },
}

export const labCatalog: readonly LabExperiment[] = [V1, V2, V3, V4, A2, A3, A5, R1, A4, J1, J2]

export function labExperiment(id: LabExperimentId): LabExperiment {
  const experiment = labCatalog.find((item) => item.id === id)
  if (!experiment) throw new Error(`El catálogo del laboratorio no tiene ${id}`)
  return experiment
}

export function labThemes(catalog: readonly LabExperiment[] = labCatalog): Array<{ theme: LabTheme; experiments: LabExperiment[] }> {
  return LAB_THEMES.map((theme) => ({ theme, experiments: catalog.filter((item) => item.theme === theme) })).filter(
    (group) => group.experiments.length > 0,
  )
}

export function defaultDownload(experiment: Pick<LabExperiment, 'downloads'>): LabDownload | null {
  return experiment.downloads.find((download) => download.default) ?? null
}

export function labRepoHref(repoPath: string): string {
  return `${LAB_REPO_URL}/blob/${LAB_REPO_BRANCH}/${repoPath}`
}
