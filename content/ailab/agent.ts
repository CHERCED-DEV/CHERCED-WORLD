import type { Locale } from '@/lib/i18n/config'

import type { DesignBoardCopy } from '@/components/ailab/agent/DesignBoard'

export type AgentInterviewCopy = {
  pick: string
  free: string
  freeHint: string
  soon: string
  title: string
  suggested: string
  sources: string
  noSources: string
  finish: string
  file: string
  design: DesignBoardCopy
}

export type AgentCopy = {
  interview: AgentInterviewCopy
  name: string
  stageLabel: string
  start: string
  hangUp: string
  mute: string
  unmute: string
  micOn: string
  micOff: string
  textLabel: string
  textPlaceholder: string
  send: string
  transcript: string
  you: string
  timeLeft: string
  consentTitle: string
  consentBody: string
  consentAccept: string
  consentCancel: string
  states: Record<'checking' | 'idle' | 'connecting' | 'arriving' | 'listening' | 'thinking' | 'speaking' | 'ended' | 'expired' | 'simulator', string>
  errors: Record<'off' | 'rate_limited' | 'daily_cap' | 'failed' | 'mic' | 'connection' | 'unavailable' | 'trial_used', string>
  trial: { note: string; ended: string; signIn: string }
  save: { consent: string }
  searching: string
  opening: string
  simulatorNote: string
  evals: string
  greet: string
  poke: string
  trace: AgentTraceCopy
}

export type AgentTraceCopy = {
  toggle: string
  title: string
  intro: string
  empty: string
  summary: Record<'turns' | 'p50' | 'p95' | 'tokens' | 'cost' | 'model' | 'tools', string>
  turn: string
  sources: Record<'voice' | 'text' | 'greeting' | 'model', string>
  question: string
  answer: string
  latency: string
  duration: string
  spoke: string
  interrupted: string
  noTools: string
  results: string
  opened: string
  refused: string
  failed: string
  tokensIn: string
  tokensOut: string
  noUsage: string
  pending: string
  prices: string
  pricesLink: string
  export: string
  simulator: string
  textAudio: string
}

export const agentCopy: Record<Locale, AgentCopy> = {
  es: {
    name: 'Mini Cherced',
    stageLabel: 'Conversación con Mini Cherced',
    start: 'Conversar',
    hangUp: 'Colgar',
    mute: 'Silenciar voz',
    unmute: 'Activar voz',
    micOn: 'Micrófono abierto',
    micOff: 'Abrir micrófono',
    textLabel: 'Escríbele',
    textPlaceholder: '¿Qué es Synergos? Llévame al blog…',
    send: 'Enviar',
    transcript: 'Subtítulos de la conversación',
    you: 'Tú',
    timeLeft: 'Quedan {time}',
    consentTitle: 'Antes de hablar',
    consentBody:
      'Tu voz y lo que escribas van a Google (Gemini Live) mientras dure la conversación, que dura como máximo 5 minutos. Este sitio no guarda audio ni texto. Si entraste con tu cuenta, Mini Cherced recibe tu nombre para saludarte. Al aceptar, el navegador te pide el micrófono.',
    consentAccept: 'Aceptar y conversar',
    consentCancel: 'Ahora no',
    states: {
      checking: 'Despertando a Mini Cherced…',
      idle: 'Listo para conversar',
      connecting: 'Conectando con Gemini…',
      arriving: 'Mini Cherced va llegando…',
      listening: 'Escuchando',
      thinking: 'Pensando',
      speaking: 'Hablando',
      ended: 'Conversación terminada',
      expired: 'Se acabó el tiempo de esta conversación. Puedes empezar otra.',
      simulator: 'Simulador local: sin Google',
    },
    errors: {
      off: 'La conversación con Gemini todavía no está activa en este sitio.',
      rate_limited: 'Ya conversaste varias veces esta hora. Vuelve en un rato.',
      daily_cap: 'Por hoy Mini Cherced ya habló mucho y se fue a dormir. Vuelve mañana, o escríbele a Camilo desde Contacto.',
      failed: 'Gemini no respondió. Intenta de nuevo en un momento.',
      mic: 'No pude abrir el micrófono. Puedes escribirle igual.',
      connection: 'Se cortó la conexión con Gemini.',
      unavailable: 'Gemini no está disponible en este momento. Vuelve más tarde, o escríbele a Camilo desde Contacto.',
      trial_used: 'Ya usaste tus dos pruebas de hoy. Entra con tu cuenta de Google y conversamos 5 minutos completos.',
    },
    searching: 'Buscando en el sitio: {query}',
    opening: 'Abriendo {path}',
    simulatorNote: 'Estás en el simulador: responde con el buscador del sitio y la voz de tu navegador. Con la clave de Gemini, conversa de verdad.',
    evals: '¿Cómo lo mido? Mira sus evals y el red team',
    trial: {
      note: 'Prueba de 2 minutos sin cuenta. Con tu cuenta de Google son 5, y Mini Cherced te saluda por tu nombre.',
      ended: '¿Te gustó? Entra con Google y seguimos hablando.',
      signIn: 'Entrar con Google',
    },
    save: {
      consent:
        'Autorizo guardar la transcripción en texto y un resumen de mis conversaciones con Mini Cherced durante 90 días, para mejorar el sitio. Nunca se guarda mi voz, y puedo verlo y borrarlo en Mi cuenta.',
    },
    interview: {
      pick: '¿Cómo quieres conversar?',
      free: 'Conversación libre',
      freeHint: 'Pregunta lo que quieras del sitio.',
      soon: 'pronto',
      title: 'Modo entrevista',
      suggested: 'Preguntas sugeridas',
      sources: 'Fuentes de sus respuestas',
      noSources: 'Aquí aparecen los casos y posts en los que se apoya cada respuesta.',
      finish: 'Terminar y descargar el acta',
      file: 'acta-entrevista-mini-cherced',
      design: {
        title: 'Pizarra de diseño',
        empty: 'Aquí aparece el diagrama cuando Mini Cherced empiece a dibujar.',
        decisions: 'Decisiones',
        exportSvg: 'Descargar el diagrama (SVG)',
        exportMd: 'Descargar las decisiones',
        adr: { decision: 'Decisión', why: 'Por qué', tradeoff: 'Qué se sacrifica' },
        file: 'diseno-mini-cherced',
      },
    },
    greet: 'Se acaba de abrir la conversación. Saluda en una o dos frases según la sección «Quién te habla»: si es Camilo o una invitada especial, celébralo en grande como dice esa sección; si no, preséntate y pregunta qué quiere conocer del sitio.',
    poke: '¡Ey! ¿Qué te pasa?',
    trace: {
      toggle: 'Cómo pensó ({count})',
      title: 'Caja de cristal: la traza de cada respuesta',
      intro: 'Se calcula en tu navegador con los mensajes que ya llegan por la sesión. No se envía a ningún lado ni se guarda.',
      empty: 'Todavía no hay turnos. Pregúntale algo.',
      summary: {
        turns: 'Turnos',
        p50: 'Latencia p50',
        p95: 'Latencia p95',
        tokens: 'Tokens',
        cost: 'Costo estimado',
        model: 'Modelo y voz',
        tools: 'Herramientas',
      },
      turn: 'Turno {n}',
      sources: { voice: 'por voz', text: 'escrito', greeting: 'saludo', model: 'sin pregunta' },
      question: 'Pregunta',
      answer: 'Respuesta',
      latency: 'Primer audio a los {time}',
      duration: 'turno completo en {time}',
      spoke: 'habló {time}',
      interrupted: 'Lo interrumpiste',
      noTools: 'Respondió sin herramientas.',
      results: '{count} resultados',
      opened: 'abrió {path}',
      refused: 'ruta rechazada por la lista del sitio',
      failed: 'error: {error}',
      tokensIn: 'Entrada {total} ({detail})',
      tokensOut: 'Salida {total} ({detail})',
      noUsage: 'Sin tokens: este turno no pasó por Gemini.',
      pending: 'En curso…',
      prices: 'Precios de Gemini consultados el {date}. Dólar a {rate} COP (TRM del {rateDate}).',
      pricesLink: 'Ver la tabla de precios',
      export: 'Exportar JSON',
      simulator: 'simulador local',
      textAudio: 'texto {text} · audio {audio}',
    },
  },
  en: {
    name: 'Mini Cherced',
    stageLabel: 'Conversation with Mini Cherced',
    start: 'Talk',
    hangUp: 'Hang up',
    mute: 'Mute voice',
    unmute: 'Unmute voice',
    micOn: 'Microphone on',
    micOff: 'Turn on microphone',
    textLabel: 'Type to it',
    textPlaceholder: 'What is Synergos? Take me to the blog…',
    send: 'Send',
    transcript: 'Conversation captions',
    you: 'You',
    timeLeft: '{time} left',
    consentTitle: 'Before you talk',
    consentBody:
      'Your voice and what you type go to Google (Gemini Live) while the conversation lasts, for 5 minutes at most. This site stores no audio or text. If you signed in, Mini Cherced gets your name to greet you. When you accept, the browser asks for the microphone.',
    consentAccept: 'Accept and talk',
    consentCancel: 'Not now',
    states: {
      checking: 'Waking Mini Cherced up…',
      idle: 'Ready to talk',
      connecting: 'Connecting to Gemini…',
      arriving: 'Mini Cherced is on his way…',
      listening: 'Listening',
      thinking: 'Thinking',
      speaking: 'Speaking',
      ended: 'Conversation ended',
      expired: 'This conversation ran out of time. You can start another one.',
      simulator: 'Local simulator: no Google',
    },
    errors: {
      off: 'The Gemini conversation is not active on this site yet.',
      rate_limited: 'You already talked several times this hour. Come back in a while.',
      daily_cap: 'Mini Cherced talked a lot today and went to sleep. Come back tomorrow, or write to Camilo from Contact.',
      failed: 'Gemini did not answer. Try again in a moment.',
      mic: "I couldn't open the microphone. You can still type to it.",
      connection: 'The connection to Gemini dropped.',
      unavailable: 'Gemini is not available right now. Come back later, or write to Camilo from Contact.',
      trial_used: 'You already used your two tries today. Sign in with Google and we get a full 5 minutes.',
    },
    searching: 'Searching the site: {query}',
    opening: 'Opening {path}',
    simulatorNote: 'You are in the simulator: it answers with the site search and your browser voice. With the Gemini key, it really talks.',
    evals: 'How do I measure it? See its evals and red team',
    trial: {
      note: 'A 2-minute try without an account. With your Google account it’s 5, and Mini Cherced greets you by name.',
      ended: 'Liked it? Sign in with Google and let’s keep talking.',
      signIn: 'Sign in with Google',
    },
    save: {
      consent:
        'I allow saving the text transcript and a summary of my conversations with Mini Cherced for 90 days, to improve the site. My voice is never stored, and I can see and delete it in My account.',
    },
    interview: {
      pick: 'How do you want to talk?',
      free: 'Free conversation',
      freeHint: 'Ask anything about the site.',
      soon: 'soon',
      title: 'Interview mode',
      suggested: 'Suggested questions',
      sources: 'Sources behind the answers',
      noSources: 'The cases and posts behind each answer show up here.',
      finish: 'Finish and download the record',
      file: 'mini-cherced-interview-record',
      design: {
        title: 'Design whiteboard',
        empty: 'The diagram shows up here when Mini Cherced starts drawing.',
        decisions: 'Decisions',
        exportSvg: 'Download the diagram (SVG)',
        exportMd: 'Download the decisions',
        adr: { decision: 'Decision', why: 'Why', tradeoff: 'What it costs' },
        file: 'mini-cherced-design',
      },
    },
    greet: 'The conversation just opened. Greet in one or two sentences following the «Quién te habla» section: if it is Camilo or a special guest, celebrate big as that section says; otherwise, introduce yourself and ask what they want to know about the site.',
    poke: "Hey! What's wrong with you?",
    trace: {
      toggle: 'How it thought ({count})',
      title: 'Glass box: the trace of every answer',
      intro: 'Computed in your browser from the messages the session already receives. Nothing is sent anywhere or stored.',
      empty: 'No turns yet. Ask it something.',
      summary: {
        turns: 'Turns',
        p50: 'Latency p50',
        p95: 'Latency p95',
        tokens: 'Tokens',
        cost: 'Estimated cost',
        model: 'Model and voice',
        tools: 'Tools',
      },
      turn: 'Turn {n}',
      sources: { voice: 'by voice', text: 'typed', greeting: 'greeting', model: 'no question' },
      question: 'Question',
      answer: 'Answer',
      latency: 'First audio after {time}',
      duration: 'full turn in {time}',
      spoke: 'spoke for {time}',
      interrupted: 'You interrupted it',
      noTools: 'Answered without tools.',
      results: '{count} results',
      opened: 'opened {path}',
      refused: 'path rejected by the site list',
      failed: 'error: {error}',
      tokensIn: 'Input {total} ({detail})',
      tokensOut: 'Output {total} ({detail})',
      noUsage: 'No tokens: this turn did not go through Gemini.',
      pending: 'In progress…',
      prices: 'Gemini prices checked on {date}. Dollar at {rate} COP (TRM of {rateDate}).',
      pricesLink: 'See the price table',
      export: 'Export JSON',
      simulator: 'local simulator',
      textAudio: 'text {text} · audio {audio}',
    },
  },
}
