import en from '@/content/i18n/en/ailab.json'
import es from '@/content/i18n/es/ailab.json'
import {
  LAB_THEMES,
  type LabDownload,
  type LabEngine,
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

export const ONNX_RUNTIME_WEB: LabEngine = { resource: 'ONNX Runtime Web', bytes: 26_861_777 }

export const WHISPER_TINY: LabDownload = { resource: 'Whisper tiny (int8)', bytes: 41 * MB, host: 'huggingface.co', engine: ONNX_RUNTIME_WEB }

export const WHISPER_BASE: LabDownload = { resource: 'Whisper base (int8)', bytes: 77 * MB, host: 'huggingface.co', engine: ONNX_RUNTIME_WEB }

export const WHISPER_SMALL: LabDownload = { resource: 'Whisper small (int8)', bytes: 249 * MB, host: 'huggingface.co', engine: ONNX_RUNTIME_WEB }

export const E5_SMALL: LabDownload = { resource: 'multilingual-e5-small (int8)', bytes: 118 * MB, host: 'huggingface.co', engine: ONNX_RUNTIME_WEB }

export const PYODIDE_CORE: LabDownload = { resource: 'Pyodide 0.29.0', bytes: 12 * MB, host: 'cdn.jsdelivr.net' }

export const PYODIDE_NUMPY: LabDownload = { resource: 'numpy (Pyodide 0.29.0)', bytes: 3_100_000, host: 'cdn.jsdelivr.net' }

const V5: LabExperiment = {
  id: 'V5',
  theme: 'gemini',
  title: copy('ailab.v5.title'),
  summary: copy('ailab.v5.summary'),
  status: 'beta',
  runsIn: 'google',
  inputs: ['microphone', 'text'],
  session: { activity: 'conversation', minutes: 5, capped: true },
  poweredBy: { es: 'Gemini Live', en: 'Gemini Live' },
  limit: { uses: 3, per: 'hour' },
  downloads: [],
  privacy: copy('ailab.v5.privacy'),
  flow: [
    { es: 'Hablas o escribes, y tu navegador abre una conversación directa con Gemini Live', en: 'You speak or type, and your browser opens a direct conversation with Gemini Live' },
    {
      es: 'Gemini lleva un mapa del sitio y, si le falta un detalle, usa el buscador del sitio desde tu navegador',
      en: 'Gemini carries a map of the site and, if it needs a detail, uses the site search from your browser',
    },
    { es: 'Responde con voz, el chibi mueve la boca al ritmo del audio y, si lo pides, te lleva a la página', en: 'It answers by voice, the chibi moves its mouth to the audio and, if you ask, takes you to the page' },
  ],
  adrCards: [
    {
      decision: { es: 'Gemini Live con un token de un solo uso', en: 'Gemini Live with a single-use token' },
      why: {
        es: 'La voz va directo de tu navegador a Google, sin pasar por mi servidor, y la clave nunca sale de él: el servidor pide un token que dura minutos y trae fijados el modelo, la voz y las instrucciones.',
        en: 'Your voice goes straight from your browser to Google, without going through my server, and the key never leaves it: the server asks for a token that lasts minutes and has the model, the voice and the instructions locked in.',
      },
      tradeoff: {
        es: 'A diferencia del resto del laboratorio, aquí tu voz sale de tu equipo. Por eso te lo pregunto antes de abrir el micrófono.',
        en: 'Unlike the rest of the lab, here your voice leaves your device. That is why I ask before opening the microphone.',
      },
    },
    {
      decision: { es: 'Las herramientas corren en tu navegador', en: 'The tools run in your browser' },
      why: {
        es: 'Buscar en el sitio y abrir una página usan el índice público que ya existe, así que no hace falta un endpoint nuevo que exponga datos.',
        en: 'Searching the site and opening a page use the public index that already exists, so no new endpoint exposing data is needed.',
      },
      tradeoff: {
        es: 'El agente solo sabe lo que está publicado en el sitio. Si no aparece, te lo dice y te manda a Contacto.',
        en: 'The agent only knows what is published on the site. If it is not there, it says so and sends you to Contact.',
      },
    },
  ],
  code: null,
}

const A6: LabExperiment = {
  id: 'A6',
  theme: 'gemini',
  title: copy('ailab.a6.title'),
  summary: copy('ailab.a6.summary'),
  status: 'beta',
  runsIn: 'google',
  inputs: ['text'],
  session: { activity: 'analysis', minutes: 2 },
  poweredBy: { es: 'Gemini Flash', en: 'Gemini Flash' },
  limit: { uses: 5, per: 'day' },
  downloads: [],
  privacy: copy('ailab.a6.privacy'),
  flow: [
    { es: 'Pegas la vacante y el servidor la manda a Gemini junto con el catálogo público del sitio, cada pieza con su id', en: 'You paste the posting and the server sends it to Gemini along with the public catalog of the site, each piece with its id' },
    {
      es: 'Gemini responde con un esquema fijo: requisito, tipo, nivel, ids de evidencia, nota y tres preguntas',
      en: 'Gemini answers with a fixed schema: requirement, type, level, evidence ids, note and three questions',
    },
    {
      es: 'El servidor descarta cualquier id que no exista y baja a "sin evidencia" lo que se quede sin pruebas, antes de que lo veas',
      en: 'The server drops any id that does not exist and lowers to "no evidence" whatever is left without proof, before you see it',
    },
  ],
  adrCards: [
    {
      decision: { es: 'Salida estructurada y validada en el servidor', en: 'Structured output validated on the server' },
      why: {
        es: 'Un reclutador no puede verificar cada frase. Por eso Gemini no escribe un texto libre: llena un esquema, y el servidor lo revisa con Zod y lo pide una vez más si no cumple.',
        en: 'A recruiter cannot verify every sentence. So Gemini does not write free text: it fills a schema, and the server checks it with Zod and asks once more if it does not comply.',
      },
      tradeoff: {
        es: 'Pierde matices que un texto libre tendría. A cambio, cada fila se puede comprobar con un clic.',
        en: 'It loses nuances a free text would have. In exchange, every row can be checked with one click.',
      },
    },
    {
      decision: { es: 'La evidencia sale del índice público, no del modelo', en: 'Evidence comes from the public index, not from the model' },
      why: {
        es: 'Gemini solo puede citar ids del catálogo y el servidor borra los que no existen, así que ningún enlace inventado llega a la pantalla. Si descarta alguno, te lo dice.',
        en: 'Gemini can only cite ids from the catalog and the server deletes the ones that do not exist, so no invented link reaches the screen. If it drops any, it tells you.',
      },
      tradeoff: {
        es: 'Lo que no está publicado sale como "sin evidencia" aunque Camilo lo sepa hacer. Para eso están las preguntas de la entrevista.',
        en: 'Whatever is not published shows up as "no evidence" even if Camilo can do it. That is what the interview questions are for.',
      },
    },
  ],
  code: null,
}

const A9: LabExperiment = {
  id: 'A9',
  theme: 'gemini',
  title: copy('ailab.a9.title'),
  summary: copy('ailab.a9.summary'),
  status: 'beta',
  runsIn: 'google',
  inputs: ['text'],
  session: { activity: 'analysis', minutes: 1 },
  poweredBy: { es: 'Gemini Flash', en: 'Gemini Flash' },
  limit: { uses: 10, per: 'day' },
  downloads: [],
  privacy: copy('ailab.a9.privacy'),
  flow: [
    { es: 'Describes la arquitectura en una frase y el servidor se la pide a Gemini como JSON con esquema: nodos, conexiones y grupos', en: 'You describe the architecture in one sentence and the server asks Gemini for it as JSON with a schema: nodes, connections and groups' },
    { es: 'El servidor valida el JSON con Zod (ids únicos, conexiones válidas, máximo 40 nodos) antes de mandártelo', en: 'The server validates the JSON with Zod (unique ids, valid connections, at most 40 nodes) before sending it to you' },
    { es: 'El sitio lo acomoda por capas y lo dibuja en SVG; pides cambios sobre el diagrama actual y puedes deshacerlos', en: 'The site lays it out in layers and draws it as SVG; you ask for changes on the current diagram and can undo them' },
  ],
  adrCards: [
    {
      decision: { es: 'El modelo describe, el sitio dibuja', en: 'The model describes, the site draws' },
      why: {
        es: 'Gemini solo devuelve datos con esquema. Nunca se ejecuta código generado por el modelo: el dibujo lo hace el mismo motor de la pizarra de diseño del modo entrevista.',
        en: 'Gemini only returns schema-bound data. Code generated by the model never runs: the drawing is done by the same engine as the interview mode whiteboard.',
      },
      tradeoff: { es: 'El acomodo por capas es sencillo: diagramas muy cruzados se leen peor que uno hecho a mano.', en: 'The layered layout is simple: very tangled diagrams read worse than a hand-made one.' },
    },
  ],
  code: null,
}

const A7: LabExperiment = {
  id: 'A7',
  theme: 'gemini',
  title: copy('ailab.a7.title'),
  summary: copy('ailab.a7.summary'),
  status: 'beta',
  runsIn: 'google',
  inputs: ['text'],
  session: { activity: 'writing', minutes: 1 },
  poweredBy: { es: 'Gemini Flash', en: 'Gemini Flash' },
  limit: { uses: 10, per: 'day' },
  downloads: [],
  privacy: copy('ailab.a7.privacy'),
  flow: [
    { es: 'Eliges la herramienta: de idea a spec, generador de ADR o haiku del commit', en: 'You pick the tool: idea to spec, ADR generator or commit haiku' },
    { es: 'El servidor arma la instrucción con el estilo real de las specs y los ADR de este repo y se la manda a Gemini', en: 'The server builds the instruction with the real style of this repo’s specs and ADRs and sends it to Gemini' },
    { es: 'La respuesta llega en streaming y la copias o la descargas como .md; nada se guarda en el sitio', en: 'The answer streams in and you copy it or download it as .md; nothing is stored on the site' },
  ],
  adrCards: [
    {
      decision: { es: 'Streaming en vez de esperar la respuesta completa', en: 'Streaming instead of waiting for the full answer' },
      why: {
        es: 'Una spec con plan y tareas tarda varios segundos. Ver el texto mientras se escribe se siente inmediato y deja cancelar a tiempo.',
        en: 'A spec with plan and tasks takes several seconds. Seeing the text as it is written feels immediate and lets you cancel in time.',
      },
      tradeoff: { es: 'El texto llega sin validar con esquema; por eso es Markdown para leer y revisar, no datos.', en: 'The text arrives unvalidated by a schema; that’s why it is Markdown to read and review, not data.' },
    },
  ],
  code: null,
}

const A8: LabExperiment = {
  id: 'A8',
  theme: 'gemini',
  title: copy('ailab.a8.title'),
  summary: copy('ailab.a8.summary'),
  status: 'beta',
  runsIn: 'google',
  inputs: ['file'],
  session: { activity: 'analysis', minutes: 1 },
  poweredBy: { es: 'Gemini Flash con visión', en: 'Gemini Flash with vision' },
  limit: { uses: 5, per: 'day' },
  downloads: [],
  privacy: copy('ailab.a8.privacy'),
  flow: [
    { es: 'Subes o pegas una captura; tu navegador la reduce a 1.024 px antes de enviarla', en: 'You upload or paste a screenshot; your browser shrinks it to 1,024 px before sending it' },
    { es: 'El servidor se la pasa a Gemini con el catálogo de piezas de este sitio, pide JSON con esquema y lo valida con Zod (piezas que existen, padres válidos, sin ciclos); si no pasa, reintenta una vez', en: 'The server hands it to Gemini with this site’s piece catalog, asks for schema-bound JSON and validates it with Zod (existing pieces, valid parents, no cycles); if it fails, it retries once' },
    { es: 'El sitio dibuja el árbol con enlaces al código de cada pieza y un bosquejo en pixel art; la imagen no se guarda', en: 'The site draws the tree with links to each piece’s code and a pixel art sketch; the image is not stored' },
  ],
  adrCards: [
    {
      decision: { es: 'Solo piezas que existen, y los huecos a la vista', en: 'Only pieces that exist, with the gaps in plain sight' },
      why: {
        es: 'El esquema limita la respuesta a los ids del catálogo o a "nueva". Así el modelo no inventa componentes con nombres bonitos: lo que falta queda escrito como hueco, con su porqué.',
        en: 'The schema limits the answer to catalog ids or "new". The model can’t invent nicely named components: whatever is missing is written down as a gap, with its reason.',
      },
      tradeoff: { es: 'Usa el sistema de diseño de este sitio, que es público, y no el de Synergos, que no lo es; de Synergos toma las capas atómicas.', en: 'It uses this site’s design system, which is public, not Synergos’s, which isn’t; from Synergos it takes the atomic layers.' },
    },
  ],
  code: null,
}

const P1: LabExperiment = {
  id: 'P1',
  theme: 'gemini',
  title: copy('ailab.p1.title'),
  summary: copy('ailab.p1.summary'),
  status: 'beta',
  runsIn: 'google',
  inputs: ['camera', 'file'],
  session: { activity: 'analysis', minutes: 1 },
  poweredBy: { es: 'Gemini Flash Image (Nano Banana 2)', en: 'Gemini Flash Image (Nano Banana 2)' },
  limit: { uses: 2, per: 'day' },
  downloads: [],
  privacy: copy('ailab.p1.privacy'),
  flow: [
    { es: 'Subes o tomas una foto; tu navegador la reduce a 768 px antes de enviarla', en: 'You upload or take a photo; your browser shrinks it to 768 px before sending it' },
    { es: 'El servidor se la pasa al modelo de imagen de Gemini con una instrucción de estilo fija que el navegador no puede cambiar', en: 'The server hands it to Gemini’s image model with a fixed style instruction the browser can’t change' },
    { es: 'Tu navegador le pone la marca del AI Lab y te la muestra junto a Mini Cherced; nada se guarda en el sitio', en: 'Your browser adds the AI Lab mark and shows it next to Mini Cherced; nothing is stored on the site' },
  ],
  adrCards: [
    {
      decision: { es: 'El estilo vive en el servidor', en: 'The style lives on the server' },
      why: {
        es: 'La instrucción de estilo es fija y no viaja desde el navegador: nadie puede usar la tarjeta para generar otra cosa con mi clave. Si Gemini rechaza la foto, el escenario lo dice y no muestra nada.',
        en: 'The style instruction is fixed and never travels from the browser: nobody can use the card to generate something else with my key. If Gemini refuses the photo, the stage says so and shows nothing.',
      },
      tradeoff: { es: 'Las imágenes no tienen cuota gratis: por eso son 2 por visitante y 20 al día en total.', en: 'Images have no free quota: that’s why it’s 2 per visitor and 20 a day in total.' },
    },
  ],
  code: null,
}

const V6: LabExperiment = {
  id: 'V6',
  theme: 'gemini',
  title: copy('ailab.v6.title'),
  summary: copy('ailab.v6.summary'),
  status: 'beta',
  runsIn: 'google',
  inputs: ['microphone'],
  session: { activity: 'transcription', minutes: 3, capped: true },
  poweredBy: { es: 'Gemini Live', en: 'Gemini Live' },
  limit: { uses: 3, per: 'day' },
  downloads: [],
  privacy: copy('ailab.v6.privacy'),
  flow: [
    { es: 'Eliges la dirección y si quieres oír la traducción; el servidor pide un token de un solo uso con una instrucción de intérprete', en: 'You pick the direction and whether to hear the translation; the server requests a single-use token with an interpreter instruction' },
    { es: 'Tu navegador abre el micrófono y manda el audio directo a Gemini Live, como Mini Cherced; la sesión dura 3 minutos', en: 'Your browser opens the microphone and sends the audio straight to Gemini Live, like Mini Cherced; the session lasts 3 minutes' },
    { es: 'Las transcripciones de entrada y salida se vuelven subtítulos con tiempos, que descargas en .srt; nada se guarda', en: 'The input and output transcriptions become timed subtitles you download as .srt; nothing is stored' },
  ],
  adrCards: [
    {
      decision: { es: 'Un intérprete con instrucción, no un modelo nuevo', en: 'An interpreter by instruction, not a new model' },
      why: {
        es: 'Usa el mismo modelo de Live de Mini Cherced, que ya está probado, con una instrucción que solo deja traducir. El modelo de traducción en vivo queda para cuando se pueda validar sin gastar a ciegas.',
        en: 'It uses the same Live model as Mini Cherced, already proven, with an instruction that only allows translating. The live translation model is left for when it can be validated without spending blindly.',
      },
      tradeoff: { es: 'Traduce al final de cada frase, no palabra por palabra: hay que hacer pausas cortas.', en: 'It translates at the end of each sentence, not word by word: you need to pause briefly.' },
    },
  ],
  code: null,
}

const V1: LabExperiment = {
  id: 'V1',
  theme: 'voice',
  title: copy('ailab.v1.title'),
  summary: copy('ailab.v1.summary'),
  status: 'beta',
  runsIn: 'browser',
  inputs: ['microphone', 'file'],
  session: { activity: 'transcription', minutes: 2 },
  poweredBy: { es: 'Whisper', en: 'Whisper' },
  limit: null,
  downloads: [{ ...WHISPER_BASE, default: true }, WHISPER_TINY, WHISPER_SMALL],
  privacy: copy('ailab.v1.privacy'),
  flow: [
    { es: 'Grabas o subes un audio', en: 'You record or upload audio' },
    {
      es: 'Whisper lo transcribe en un worker de tu navegador, con ONNX Runtime Web',
      en: 'Whisper transcribes it in a worker in your browser, with ONNX Runtime Web',
    },
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
        es: 'La primera vez hay que descargar el modelo desde Hugging Face y el motor ONNX Runtime Web (27 MB) desde este sitio, y la velocidad depende de tu equipo.',
        en: 'The first time you have to download the model from Hugging Face and the ONNX Runtime Web engine (27 MB) from this site, and the speed depends on your device.',
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
    snippet: `for (const [index, window] of windows.entries()) {
  await context.checkpoint()
  const slice = audio.subarray(window.start, window.end)
  let fresh: WhisperSegment[] = []
  if (!isSilent(slice)) {
    const output = await loaded.pipe(slice, { language, task: 'transcribe', return_timestamps: true })
    const first = Array.isArray(output) ? output[0] : output
    if (first) fresh = toSegments(first, window.start / SAMPLE_RATE, window.end / SAMPLE_RATE)
  }
  segments.push(...fresh)
  context.progress({ stage: 'transcribe', done: index + 1, total: windows.length, segments: fresh })
}`,
    lang: 'ts',
    repoPath: 'lib/ailab/voice/engine.ts',
  },
}

const V2: LabExperiment = {
  id: 'V2',
  theme: 'voice',
  title: copy('ailab.v2.title'),
  summary: copy('ailab.v2.summary'),
  status: 'beta',
  runsIn: 'browser',
  inputs: ['text'],
  session: { activity: 'listening', minutes: 2 },
  poweredBy: { es: 'Web Speech API', en: 'Web Speech API' },
  limit: null,
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
  inputs: ['mouse', 'touch'],
  session: { activity: 'listening', minutes: 5 },
  poweredBy: { es: 'Web Speech API', en: 'Web Speech API' },
  limit: null,
  downloads: [],
  privacy: copy('ailab.v3.privacy'),
  flow: [
    { es: 'Eliges un post', en: 'You pick a post' },
    {
      es: 'Se toma solo el cuerpo, sin los bloques de código ni las imágenes decorativas',
      en: 'Only the body is taken, without the code blocks or the decorative images',
    },
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
  inputs: ['microphone', 'text'],
  session: { activity: 'commands', minutes: 2 },
  poweredBy: { es: 'Whisper tiny', en: 'Whisper tiny' },
  limit: null,
  downloads: [WHISPER_TINY],
  privacy: copy('ailab.v4.privacy'),
  flow: [
    { es: 'Mantienes el botón y dices un comando, o lo escribes', en: 'You hold the button and say a command, or type it' },
    {
      es: 'Whisper tiny, con ONNX Runtime Web, lo convierte en texto en tu navegador',
      en: 'Whisper tiny, with ONNX Runtime Web, turns it into text in your browser',
    },
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
    snippet: `export function matchVoiceCommand(
  utterance: string,
  commands: readonly VoiceCommand[] = voiceCommands,
  threshold = MATCH_THRESHOLD,
): VoiceMatch | null {
  let best: VoiceMatch | null = null
  for (const command of commands) {
    for (const lang of locales) {
      for (const phrase of command.phrases[lang]) {
        const score = phraseScore(utterance, phrase)
        if (score >= threshold && (!best || score > best.score)) best = { command, phrase, lang, score }
      }
    }
  }
  return best
}`,
    lang: 'ts',
    repoPath: 'lib/ailab/voice/commands.ts',
  },
}

const A2: LabExperiment = {
  id: 'A2',
  theme: 'agents',
  title: copy('ailab.a2.title'),
  summary: copy('ailab.a2.summary'),
  status: 'stable',
  runsIn: 'browser',
  inputs: ['mouse', 'touch'],
  session: { activity: 'tour', minutes: 3 },
  poweredBy: { es: 'Sin modelo: archivos reales', en: 'No model: real files' },
  limit: null,
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
  inputs: ['text'],
  session: { activity: 'writing', minutes: 3 },
  poweredBy: { es: 'Sin modelo: validador', en: 'No model: validator' },
  limit: null,
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
  inputs: ['text'],
  session: { activity: 'search', minutes: 2 },
  poweredBy: { es: 'BM25 + e5-small', en: 'BM25 + e5-small' },
  limit: null,
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
      decision: { es: 'La búsqueda por significado compara su ranking con el de palabras', en: 'Search by meaning compares its ranking with the one by words' },
      why: {
        es: 'Los vectores de multilingual-e5-small se precalculan al publicar el sitio (unos 14 s en el build) y se guardan en int8. Tu pregunta se vuelve vector en tu navegador, con tu permiso, y nada sale de él.',
        en: 'The multilingual-e5-small vectors are precomputed when the site is published (about 14 s in the build) and stored as int8. Your question becomes a vector in your browser, with your permission, and nothing leaves it.',
      },
      tradeoff: {
        es: 'La primera vez hay que descargar 118 MB, y la similitud no explica su puntaje palabra por palabra como BM25: por eso se ven los dos rankings lado a lado.',
        en: 'The first time it downloads 118 MB, and similarity does not explain its score word by word like BM25: that is why both rankings are shown side by side.',
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
  inputs: ['mouse', 'touch'],
  session: { activity: 'simulation', minutes: 3 },
  poweredBy: { es: 'Saga determinista', en: 'Deterministic saga' },
  limit: null,
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
  inputs: ['mouse', 'touch', 'text'],
  session: { activity: 'tour', minutes: 4 },
  poweredBy: { es: 'Python (Pyodide)', en: 'Python (Pyodide)' },
  limit: null,
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
  inputs: ['keyboard', 'mouse', 'touch'],
  session: { activity: 'game', minutes: 3 },
  poweredBy: { es: 'Red propia de 16 neuronas', en: 'In-house 16-neuron network' },
  limit: null,
  downloads: [],
  privacy: copy('ailab.j1.privacy'),
  flow: [
    {
      es: 'Mueves tu paleta de cristal con las flechas o W/S, con el mouse o con el dedo; espacio saca y pausa',
      en: 'You move your glass paddle with the arrow keys or W/S, the mouse or your finger; Space serves and pauses',
    },
    {
      es: 'Después de cada rally, una red de dos capas de 16 neuronas aprende por refuerzo en un worker, sin descargar nada',
      en: 'After each rally, a network with two layers of 16 neurons learns by reinforcement in a worker, with nothing to download',
    },
    {
      es: 'Sus neuronas se encienden con cada decisión y la curva muestra cuántas bolas más devuelve',
      en: 'Its neurons light up with each decision and the curve shows how many more balls it returns',
    },
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
      decision: { es: 'Sin descargas: la red nace en tu navegador', en: 'No downloads: the network is born in your browser' },
      why: {
        es: 'No hay modelo que bajar, así que no hace falta pedirte permiso: empieza con pesos al azar.',
        en: 'There is no model to fetch, so there is no need to ask for your consent: it starts with random weights.',
      },
      tradeoff: {
        es: 'Empieza sin saber nada: los primeros rallies es torpe de verdad.',
        en: 'It starts knowing nothing: in the first rallies it really is clumsy.',
      },
    },
    {
      decision: { es: 'REINFORCE con línea base, en un worker', en: 'REINFORCE with a baseline, in a worker' },
      why: {
        es: 'El entrenamiento no le quita fluidez al juego ni al fondo animado.',
        en: 'Training does not take smoothness away from the game or the animated background.',
      },
      tradeoff: {
        es: 'Los pesos viajan al juego al final de cada rally (cada dos o cuatro si tu equipo va justo), no en cada golpe.',
        en: 'The weights travel to the game at the end of each rally (every two or four if your device is running tight), not on every hit.',
      },
    },
    {
      decision: { es: 'Premio por acercarse a donde va a llegar la bola', en: 'A reward for getting closer to where the ball will arrive' },
      why: {
        es: 'Con solo "la devolvió o no", 20 rallies no alcanzan para aprender.',
        en: 'With only "did it return it or not", 20 rallies are not enough to learn.',
      },
      tradeoff: {
        es: 'Aprende a seguir la bola, no estrategias que yo no le premie.',
        en: 'It learns to follow the ball, not strategies I do not reward.',
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
    snippet: `const advantage = advantages[index]!
const action = episode.actions[t]!
for (let j = 0; j < ACTIONS; j += 1) {
  const p = probs[j]!
  const policy = advantage * (p - (j === action ? 1 : 0))
  const spread = options.entropy * p * (Math.log(p + 1e-9) + h)
  dLogits[j] = policy + spread
}
backward(net, trace, dLogits, grads, scratch)`,
    lang: 'ts',
    repoPath: 'lib/ailab/games/rival.ts',
  },
}

const J2: LabExperiment = {
  id: 'J2',
  theme: 'games',
  title: copy('ailab.j2.title'),
  summary: copy('ailab.j2.summary'),
  status: 'experiment',
  runsIn: 'browser',
  inputs: ['keyboard', 'mouse', 'touch'],
  session: { activity: 'game', minutes: 4 },
  poweredBy: { es: 'La red de J1, por imitación', en: "J1's network, by imitation" },
  limit: null,
  downloads: [],
  privacy: copy('ailab.j2.privacy'),
  flow: [
    {
      es: 'Juegas tres rallies de grabación con teclado, mouse o toque, contra un sparring con un guion simple',
      en: 'You play three recording rallies with keyboard, mouse or touch, against a sparring partner with a simple script',
    },
    {
      es: 'La misma red aprende por imitación de tus movimientos, en un worker y sin descargar nada',
      en: 'The same network learns by imitating your moves, in a worker and with nothing to download',
    },
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
      decision: { es: 'El parecido se mide en situaciones que no vio', en: 'The likeness is measured on situations it did not see' },
      why: {
        es: 'Medirlo con lo mismo que aprendió inflaría el número.',
        en: 'Measuring it on what it learned from would inflate the number.',
      },
      tradeoff: {
        es: 'Con pocos rallies, el número cambia bastante de una grabación a otra.',
        en: 'With few rallies, the number changes quite a bit from one recording to the next.',
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
    snippet: `for (const index of batch) {
  forward(net, demo.inputs.subarray(index * SENSES, (index + 1) * SENSES), trace)
  const target = demo.actions[index]!
  const weight = weights[target]!
  loss -= weight * Math.log(trace.probs[target]! + 1e-9)
  for (let j = 0; j < ACTIONS; j += 1) dLogits[j] = weight * (trace.probs[j]! - (j === target ? 1 : 0))
  backward(net, trace, dLogits, grads, scratch)
}
adamStep(net, grads, adam, options.lr, 1 / batch.length)`,
    lang: 'ts',
    repoPath: 'lib/ailab/games/clone.ts',
  },
}

export const labCatalog: readonly LabExperiment[] = [V5, V6, A6, A9, A7, A8, P1, V1, V2, V3, V4, A2, A3, A5, R1, A4, J1, J2]

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

export type LabDownloadPlan = { kind: 'none' } | { kind: 'upfront'; bytes: number } | { kind: 'onDemand'; bytes: number }

function withEngines(downloads: LabDownload[]): number {
  const engines = new Map(downloads.flatMap((download) => (download.engine ? [[download.engine.resource, download.engine.bytes] as const] : [])))
  return downloads.reduce((total, download) => total + download.bytes, 0) + [...engines.values()].reduce((total, bytes) => total + bytes, 0)
}

export function labDownloadPlan(experiment: Pick<LabExperiment, 'downloads'>): LabDownloadPlan {
  if (experiment.downloads.length === 0) return { kind: 'none' }
  const main = defaultDownload(experiment)
  if (main) return { kind: 'upfront', bytes: withEngines([main]) }
  return { kind: 'onDemand', bytes: withEngines(experiment.downloads) }
}

export function labRepoHref(repoPath: string): string {
  return `${LAB_REPO_URL}/blob/${LAB_REPO_BRANCH}/${repoPath}`
}
