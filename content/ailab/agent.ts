import type { Locale } from '@/lib/i18n/config'

export type AgentCopy = {
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
  states: Record<'checking' | 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'ended' | 'expired' | 'simulator', string>
  errors: Record<'off' | 'rate_limited' | 'daily_cap' | 'failed' | 'mic' | 'connection' | 'unavailable', string>
  searching: string
  opening: string
  simulatorNote: string
  greet: string
  poke: string
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
      'Tu voz y lo que escribas van a Google (Gemini Live) mientras dure la conversación, que dura como máximo 5 minutos. Este sitio no guarda audio ni texto. Al aceptar, el navegador te pide el micrófono.',
    consentAccept: 'Aceptar y conversar',
    consentCancel: 'Ahora no',
    states: {
      checking: 'Despertando a Mini Cherced…',
      idle: 'Listo para conversar',
      connecting: 'Conectando con Gemini…',
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
    },
    searching: 'Buscando en el sitio: {query}',
    opening: 'Abriendo {path}',
    simulatorNote: 'Estás en el simulador: responde con el buscador del sitio y la voz de tu navegador. Con la clave de Gemini, conversa de verdad.',
    greet: 'El visitante acaba de abrir la conversación. Salúdalo en una o dos frases, preséntate y pregúntale qué quiere conocer del sitio.',
    poke: '¡Ey! ¿Qué te pasa?',
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
      'Your voice and what you type go to Google (Gemini Live) while the conversation lasts, for 5 minutes at most. This site stores no audio or text. When you accept, the browser asks for the microphone.',
    consentAccept: 'Accept and talk',
    consentCancel: 'Not now',
    states: {
      checking: 'Waking Mini Cherced up…',
      idle: 'Ready to talk',
      connecting: 'Connecting to Gemini…',
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
    },
    searching: 'Searching the site: {query}',
    opening: 'Opening {path}',
    simulatorNote: 'You are in the simulator: it answers with the site search and your browser voice. With the Gemini key, it really talks.',
    greet: 'The visitor just opened the conversation. Greet them in one or two sentences, introduce yourself and ask what they want to know about the site.',
    poke: "Hey! What's wrong with you?",
  },
}
