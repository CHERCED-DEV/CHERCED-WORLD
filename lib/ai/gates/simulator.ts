import type { Localized } from '@/content/types'
import type { GateExampleId } from '@/content/ailab/gates/examples'
import type { GateLang, GateRequest, GateRoundNumber, Gravity, MergedFinding, ReviewReplyWire, RubricCriterion, SpecBreve, Verification, VerifierReplyWire, WriterReplyWire } from './schema'

type L = Localized

type SimRequirement = { id: string; text: L }

type SimCriterion = { id: string; covers: string[]; given: L; when: L; then: L }

type SimQuestion = { id: string; question: L; byDefault: L }

type SimSpec = { title: L; problem: L; includes: L[]; excludes: L[]; requirements: SimRequirement[]; criteria: SimCriterion[]; questions: SimQuestion[] }

type SimFinding = { criterion: RubricCriterion; gravity: Gravity; where: string; problem: L; fix: L; confidence: number }

type SimReview = { findings: SimFinding[]; resolves?: string[] }

type SimVerdict = { result: Verification; reason: L }

type SimScript = {
  draft: SimSpec
  fixed: SimSpec | null
  reviews: Record<1 | 2, readonly [SimReview, SimReview]>
  verdicts: Record<string, SimVerdict>
  corrected: SimSpec
}

type SimPatch = {
  requirements?: Record<string, L | null>
  criteria?: Record<string, Omit<SimCriterion, 'id'> | null>
  questions?: Record<string, Omit<SimQuestion, 'id'> | null>
}

function l(es: string, en: string): L {
  return { es, en }
}

function patchList<T extends { id: string }>(list: readonly T[], changes: Record<string, Omit<T, 'id'> | null> | undefined): T[] {
  if (!changes) return [...list]
  const out: T[] = []
  for (const item of list) {
    if (!(item.id in changes)) out.push(item)
    else if (changes[item.id] !== null) out.push({ ...(changes[item.id] as Omit<T, 'id'>), id: item.id } as T)
  }
  for (const [id, value] of Object.entries(changes)) if (value && !list.some((item) => item.id === id)) out.push({ ...value, id } as T)
  return out
}

function patch(base: SimSpec, changes: SimPatch): SimSpec {
  const requirements = changes.requirements
    ? patchList(
        base.requirements,
        Object.fromEntries(Object.entries(changes.requirements).map(([id, text]) => [id, text ? { text } : null])),
      )
    : [...base.requirements]
  return { ...base, requirements, criteria: patchList(base.criteria, changes.criteria), questions: patchList(base.questions, changes.questions) }
}

function render(spec: SimSpec, lang: GateLang): SpecBreve {
  return {
    title: spec.title[lang],
    problem: spec.problem[lang],
    includes: spec.includes.map((item) => item[lang]),
    excludes: spec.excludes.map((item) => item[lang]),
    requirements: spec.requirements.map((item) => ({ id: item.id, text: item.text[lang] })),
    criteria: spec.criteria.map((item) => ({ id: item.id, covers: item.covers, given: item.given[lang], when: item.when[lang], then: item.then[lang] })),
    questions: spec.questions.map((item) => ({ id: item.id, question: item.question[lang], byDefault: item.byDefault[lang] })),
  }
}

const CONTACT_DRAFT: SimSpec = {
  title: l('Formulario de contacto con adjuntos', 'Contact form with attachments'),
  problem: l(
    'Quien visita el sitio del estudio no puede mandar archivos con su mensaje, y el estudio no se entera a tiempo de que alguien escribió.',
    'Visitors to the studio’s website cannot send files with their message, and the studio does not find out in time that someone wrote.',
  ),
  includes: [
    l('Un formulario con nombre, correo, mensaje y hasta tres adjuntos.', 'A form with name, email, message and up to three attachments.'),
    l('Un aviso por correo al estudio por cada mensaje.', 'An email notice to the studio for every message.'),
    l('Una confirmación en pantalla para quien escribe.', 'An on-screen confirmation for the person who writes.'),
  ],
  excludes: [l('Chat en vivo.', 'Live chat.'), l('Un panel para responder los mensajes desde el sitio.', 'A dashboard to answer messages from the site.')],
  requirements: [
    { id: 'R-1', text: l('El formulario acepta hasta 3 adjuntos de 5 MB cada uno.', 'The form accepts up to 3 attachments of 5 MB each.') },
    { id: 'R-2', text: l('Al enviar, el estudio recibe un aviso por correo.', 'On submit, the studio gets an email notice.') },
    { id: 'R-3', text: l('Quien escribe ve una confirmación rápida de que su mensaje se envió.', 'The writer sees a quick confirmation that the message was sent.') },
    { id: 'R-4', text: l('El formulario responde en menos de 2.', 'The form responds in less than 2.') },
  ],
  criteria: [
    { id: 'C-1', covers: ['R-1'], given: l('un adjunto de 6 MB', 'a 6 MB attachment'), when: l('quien escribe lo envía', 'the writer sends it'), then: l('el formulario lo rechaza y dice que el máximo es 5 MB', 'the form rejects it and says the maximum is 5 MB') },
    { id: 'C-2', covers: ['R-2'], given: l('un mensaje válido', 'a valid message'), when: l('se envía', 'it is sent'), then: l('el estudio recibe un correo con el aviso', 'the studio gets an email with the notice') },
    { id: 'C-3', covers: ['R-5'], given: l('un mensaje enviado', 'a sent message'), when: l('termina el envío', 'sending finishes'), then: l('aparece la confirmación en pantalla', 'the confirmation shows on screen') },
  ],
  questions: [{ id: 'Q-1', question: l('¿Qué formatos de archivo se aceptan?', 'Which file formats are accepted?'), byDefault: l('PDF, PNG y JPG.', 'PDF, PNG and JPG.') }],
}

const CONTACT_FIXED = patch(CONTACT_DRAFT, {
  requirements: {
    'R-3': l('Quien escribe ve en pantalla que su mensaje se envió, con el nombre de cada adjunto.', 'The writer sees on screen that the message was sent, with the name of each attachment.'),
    'R-4': l('El formulario muestra la confirmación en menos de 2 s después de enviar.', 'The form shows the confirmation in less than 2 s after submitting.'),
  },
  criteria: {
    'C-3': { covers: ['R-3'], given: l('un mensaje enviado con un adjunto', 'a message sent with one attachment'), when: l('termina el envío', 'sending finishes'), then: l('la pantalla dice que el mensaje se envió y muestra el nombre del adjunto', 'the screen says the message was sent and shows the attachment name') },
    'C-4': { covers: ['R-4'], given: l('un mensaje válido', 'a valid message'), when: l('se envía', 'it is sent'), then: l('la confirmación aparece en menos de 2 s', 'the confirmation appears in less than 2 s') },
  },
})

const CONTACT: SimScript = {
  draft: CONTACT_DRAFT,
  fixed: CONTACT_FIXED,
  reviews: {
    1: [
      {
        findings: [
          {
            criterion: 'completa',
            gravity: 'importante',
            where: 'R-2',
            problem: l('R-2 no dice qué trae el aviso: el estudio no sabría quién escribió sin abrir otra cosa.', 'R-2 does not say what the notice contains: the studio would not know who wrote without opening something else.'),
            fix: l('Di que el correo trae el nombre, el correo, el mensaje y los adjuntos.', 'Say that the email carries the name, email, message and attachments.'),
            confidence: 0.8,
          },
          {
            criterion: 'verificable',
            gravity: 'bloqueante',
            where: 'C-1',
            problem: l('C-1 no dice qué pasa con un adjunto de más de 5 MB.', 'C-1 does not say what happens with an attachment over 5 MB.'),
            fix: l('Agrega el caso del adjunto que pasa el límite.', 'Add the case of the attachment over the limit.'),
            confidence: 0.65,
          },
        ],
      },
      {
        findings: [
          {
            criterion: 'completa',
            gravity: 'importante',
            where: 'R-2',
            problem: l('El aviso al estudio no dice qué datos trae.', 'The notice to the studio does not say what data it carries.'),
            fix: l('Lista los campos del correo.', 'List the fields of the email.'),
            confidence: 0.75,
          },
          {
            criterion: 'honesta',
            gravity: 'importante',
            where: 'R-1',
            problem: l('El límite de 5 MB no viene del pedido: va como pregunta con su defecto, no como requisito.', 'The 5 MB limit does not come from the request: it belongs in a question with its default, not in a requirement.'),
            fix: l('Mueve el tamaño a Q-1 con su defecto y deja R-1 en «hasta 3 adjuntos».', 'Move the size to Q-1 with its default and leave R-1 as “up to 3 attachments”.'),
            confidence: 0.55,
          },
          {
            criterion: 'clara',
            gravity: 'menor',
            where: 'R-3',
            problem: l('«En pantalla» no dice cuánto tiempo queda visible la confirmación.', '“On screen” does not say how long the confirmation stays visible.'),
            fix: l('Di si queda hasta que la persona cierre la página.', 'Say whether it stays until the person closes the page.'),
            confidence: 0.5,
          },
        ],
      },
    ],
    2: [
      { findings: [] },
      {
        findings: [
          {
            criterion: 'clara',
            gravity: 'menor',
            where: 'Q-1',
            problem: l('Q-1 junta dos preguntas en una.', 'Q-1 bundles two questions into one.'),
            fix: l('Sepárala en tamaño y formatos.', 'Split it into size and formats.'),
            confidence: 0.4,
          },
        ],
      },
    ],
  },
  verdicts: {
    '1|verificable|C-1': {
      result: 'se-cae',
      reason: l('C-1 ya lo cubre: dado un adjunto de 6 MB, el formulario lo rechaza y dice que el máximo es 5 MB.', 'C-1 already covers it: given a 6 MB attachment, the form rejects it and says the maximum is 5 MB.'),
    },
    '1|honesta|R-1': { result: 'se-sostiene', reason: l('El pedido solo dice «hasta tres adjuntos»: el tamaño no aparece.', 'The request only says “up to three attachments”: the size does not appear.') },
    '1|clara|R-3': { result: 'no-se-sabe', reason: l('El pedido no dice cuánto dura la confirmación; no hay evidencia para tumbarlo ni para sostenerlo.', 'The request does not say how long the confirmation lasts; there is no evidence to knock it down or to uphold it.') },
    '2|clara|Q-1': { result: 'se-cae', reason: l('Una pregunta con un defecto compuesto se responde de una vez; no tiene dos lecturas.', 'A question with a compound default is answered at once; it has no two readings.') },
  },
  corrected: patch(CONTACT_FIXED, {
    requirements: {
      'R-1': l('El formulario acepta hasta 3 adjuntos; el tamaño y los formatos los fija Q-1.', 'The form accepts up to 3 attachments; size and formats are set by Q-1.'),
      'R-2': l('Al enviar, el estudio recibe un correo con el nombre, el correo, el mensaje y los adjuntos de quien escribe.', 'On submit, the studio gets an email with the writer’s name, email, message and attachments.'),
    },
    criteria: {
      'C-1': { covers: ['R-1'], given: l('un adjunto más grande que el máximo de Q-1', 'an attachment larger than the Q-1 maximum'), when: l('quien escribe lo envía', 'the writer sends it'), then: l('el formulario lo rechaza y dice cuál es el máximo', 'the form rejects it and says what the maximum is') },
      'C-2': { covers: ['R-2'], given: l('un mensaje válido con un adjunto', 'a valid message with one attachment'), when: l('se envía', 'it is sent'), then: l('el estudio recibe un correo con el nombre, el correo, el mensaje y el adjunto', 'the studio gets an email with the name, email, message and attachment') },
    },
    questions: {
      'Q-1': { question: l('¿Qué tamaño máximo y qué formatos se aceptan?', 'What maximum size and which formats are accepted?'), byDefault: l('5 MB por archivo, en PDF, PNG o JPG.', '5 MB per file, in PDF, PNG or JPG.') },
    },
  }),
}

const REMINDER_DRAFT: SimSpec = {
  title: l('Recordatorio de citas por correo', 'Email appointment reminder'),
  problem: l(
    'Los pacientes del consultorio olvidan sus citas y el horario se pierde, porque nadie avisa con tiempo ni hay cómo cancelar.',
    'The practice’s patients forget their appointments and the slot is lost, because nobody reminds them in time and there is no way to cancel.',
  ),
  includes: [
    l('Un correo de recordatorio el día antes de cada cita.', 'A reminder email the day before each appointment.'),
    l('Un enlace para confirmar y otro para cancelar.', 'A link to confirm and another to cancel.'),
    l('Liberar el horario cuando alguien cancela.', 'Freeing the slot when someone cancels.'),
  ],
  excludes: [l('Recordatorios por SMS o por chat.', 'Reminders by SMS or chat.'), l('Cambiar la cita de día desde el correo.', 'Moving the appointment to another day from the email.')],
  requirements: [
    { id: 'R-1', text: l('El sistema manda un recordatorio por correo a cada paciente el día antes de su cita.', 'The system emails a reminder to every patient the day before the appointment.') },
    { id: 'R-2', text: l('El correo trae un enlace para confirmar y otro para cancelar.', 'The email has a link to confirm and another to cancel.') },
    { id: 'R-3', text: l('Si el paciente cancela, el horario queda libre en la agenda.', 'If the patient cancels, the slot becomes free in the schedule.') },
    { id: 'R-4', text: l('El sistema se integra con el software de agenda que ya usa el consultorio.', 'The system integrates with the scheduling software the practice already uses.') },
  ],
  criteria: [
    { id: 'C-1', covers: ['R-1'], given: l('una cita el martes', 'an appointment on Tuesday'), when: l('llega el lunes', 'Monday comes'), then: l('el paciente recibe el recordatorio por correo', 'the patient gets the reminder by email') },
    { id: 'C-2', covers: ['R-2', 'R-3'], given: l('un recordatorio recibido', 'a received reminder'), when: l('el paciente pulsa cancelar', 'the patient clicks cancel'), then: l('la cita queda cancelada y el horario aparece libre en la agenda', 'the appointment is cancelled and the slot shows as free in the schedule') },
  ],
  questions: [{ id: 'Q-1', question: l('¿A qué hora sale el recordatorio?', 'At what time is the reminder sent?'), byDefault: l('A las 9:00 del día anterior, en la hora local del consultorio.', 'At 9:00 the day before, in the practice’s local time.') }],
}

const REMINDER: SimScript = {
  draft: REMINDER_DRAFT,
  fixed: null,
  reviews: {
    1: [
      {
        findings: [
          {
            criterion: 'honesta',
            gravity: 'bloqueante',
            where: 'R-4',
            problem: l('El pedido no habla de un software de agenda existente: la integración es una dependencia inventada.', 'The request does not mention existing scheduling software: the integration is an invented dependency.'),
            fix: l('Quita R-4 o conviértelo en pregunta: ¿dónde vive hoy la agenda?', 'Drop R-4 or turn it into a question: where does the schedule live today?'),
            confidence: 0.85,
          },
          {
            criterion: 'verificable',
            gravity: 'importante',
            where: 'C-1',
            problem: l('C-1 dice «llega el lunes» sin decir a qué hora sale el correo.', 'C-1 says “Monday comes” without saying when the email goes out.'),
            fix: l('Ata C-1 a la hora de Q-1.', 'Tie C-1 to the time in Q-1.'),
            confidence: 0.7,
          },
        ],
      },
      {
        findings: [
          {
            criterion: 'honesta',
            gravity: 'bloqueante',
            where: 'R-4',
            problem: l('R-4 supone una integración que el pedido no pide.', 'R-4 assumes an integration the request does not ask for.'),
            fix: l('Saca la integración del alcance.', 'Take the integration out of scope.'),
            confidence: 0.8,
          },
          {
            criterion: 'completa',
            gravity: 'importante',
            where: 'R-2',
            problem: l('No dice qué pasa cuando el paciente confirma.', 'It does not say what happens when the patient confirms.'),
            fix: l('Di qué cambia en la agenda al confirmar.', 'Say what changes in the schedule on confirming.'),
            confidence: 0.6,
          },
          {
            criterion: 'verificable',
            gravity: 'importante',
            where: 'C-2',
            problem: l('C-2 cubre R-2 y R-3 pero solo prueba cancelar: confirmar queda sin criterio.', 'C-2 covers R-2 and R-3 but only tests cancelling: confirming has no criterion.'),
            fix: l('Agrega un criterio para confirmar.', 'Add a criterion for confirming.'),
            confidence: 0.55,
          },
        ],
      },
    ],
    2: [
      {
        findings: [
          {
            criterion: 'verificable',
            gravity: 'importante',
            where: 'C-3',
            problem: l('C-3 no dice qué ve el paciente después de confirmar.', 'C-3 does not say what the patient sees after confirming.'),
            fix: l('Agrega la página que confirma la cita.', 'Add the page that confirms the appointment.'),
            confidence: 0.7,
          },
        ],
      },
      {
        findings: [
          {
            criterion: 'clara',
            gravity: 'menor',
            where: 'C-1',
            problem: l('«9:00» no dice en qué zona horaria.', '“9:00” does not say in which time zone.'),
            fix: l('Repite la hora local del consultorio.', 'Repeat the practice’s local time.'),
            confidence: 0.45,
          },
        ],
      },
    ],
  },
  verdicts: {
    '1|honesta|R-4': {
      result: 'se-sostiene',
      reason: l('El pedido dice «el horario debe quedar libre en la agenda», pero no menciona otro software.', 'The request says “the slot should become free in the schedule”, but mentions no other software.'),
    },
    '1|verificable|C-2': { result: 'se-sostiene', reason: l('C-2 solo describe el enlace de cancelar.', 'C-2 only describes the cancel link.') },
    '2|clara|C-1': { result: 'no-se-sabe', reason: l('Q-1 ya dice «hora local del consultorio»; repetirlo en C-1 es cuestión de estilo.', 'Q-1 already says “practice’s local time”; repeating it in C-1 is a matter of style.') },
  },
  corrected: patch(REMINDER_DRAFT, {
    requirements: {
      'R-2': l('El correo trae un enlace para confirmar y otro para cancelar; al confirmar, la cita queda marcada como confirmada en la agenda.', 'The email has a link to confirm and another to cancel; on confirming, the appointment is marked as confirmed in the schedule.'),
      'R-4': null,
    },
    criteria: {
      'C-1': { covers: ['R-1'], given: l('una cita el martes', 'an appointment on Tuesday'), when: l('son las 9:00 del lunes (Q-1)', 'it is 9:00 on Monday (Q-1)'), then: l('el paciente recibe el recordatorio por correo', 'the patient gets the reminder by email') },
      'C-2': { covers: ['R-3'], given: l('un recordatorio recibido', 'a received reminder'), when: l('el paciente pulsa cancelar', 'the patient clicks cancel'), then: l('la cita queda cancelada y el horario aparece libre en la agenda', 'the appointment is cancelled and the slot shows as free in the schedule') },
      'C-3': { covers: ['R-2'], given: l('un recordatorio recibido', 'a received reminder'), when: l('el paciente pulsa confirmar', 'the patient clicks confirm'), then: l('la cita aparece como confirmada en la agenda', 'the appointment shows as confirmed in the schedule') },
    },
    questions: {
      'Q-2': { question: l('¿Dónde vive hoy la agenda del consultorio?', 'Where does the practice’s schedule live today?'), byDefault: l('En este mismo sistema; no hay otro software.', 'In this same system; there is no other software.') },
    },
  }),
}

const BAKERY_DRAFT: SimSpec = {
  title: l('Tablero de pedidos del día', 'Board of the day’s orders'),
  problem: l(
    'El equipo de la panadería lleva los pedidos en papel y no ve de un vistazo cuáles faltan ni a qué hora los recogen.',
    'The bakery team keeps orders on paper and cannot see at a glance which are pending or when they are picked up.',
  ),
  includes: [l('Un tablero con los pedidos del día.', 'A board with the day’s orders.'), l('Marcar un pedido como listo desde una tableta.', 'Marking an order as ready from a tablet.')],
  excludes: [l('Pagos en línea.', 'Online payments.')],
  requirements: [
    { id: 'R-1', text: l('El tablero muestra cada pedido del día con quién lo pidió, qué lleva y a qué hora lo recogen.', 'The board shows every order of the day with who placed it, what it contains and when it is picked up.') },
    { id: 'R-2', text: l('El equipo marca un pedido como listo desde una tableta y el tablero se actualiza.', 'The team marks an order as ready from a tablet and the board updates.') },
    { id: 'R-3', text: l('El tablero ordena los pedidos por hora de recogida.', 'The board sorts orders by pickup time.') },
    { id: 'R-4', text: l('El tablero se actualiza en tiempo real y aguanta 500.', 'The board updates in real time and handles 500.') },
  ],
  criteria: [
    { id: 'C-1', covers: ['R-1'], given: l('tres pedidos del día', 'three orders of the day'), when: l('el equipo abre el tablero', 'the team opens the board'), then: l('ve los tres con cliente, contenido y hora', 'it sees all three with customer, contents and time') },
    { id: 'C-2', covers: ['R-2'], given: l('un pedido pendiente', 'a pending order'), when: l('alguien lo marca como listo en la tableta', 'someone marks it as ready on the tablet'), then: l('el tablero lo muestra como listo', 'the board shows it as ready') },
    { id: 'C-3', covers: ['R-3'], given: l('un pedido de las 8:00 y otro de las 7:30', 'an 8:00 order and a 7:30 order'), when: l('se abre el tablero', 'the board opens'), then: l('el de las 7:30 sale primero', 'the 7:30 one comes first') },
  ],
  questions: [],
}

const BAKERY_FIXED = patch(BAKERY_DRAFT, {
  requirements: { 'R-4': l('Cuando alguien marca un pedido como listo, el tablero lo muestra en menos de 5 s.', 'When someone marks an order as ready, the board shows it in less than 5 s.') },
  criteria: {
    'C-4': { covers: ['R-4'], given: l('el tablero abierto en otra pantalla', 'the board open on another screen'), when: l('alguien marca un pedido como listo', 'someone marks an order as ready'), then: l('el cambio aparece en menos de 5 s', 'the change shows in less than 5 s') },
  },
  questions: { 'Q-1': { question: l('¿Cuántos pedidos tiene un día normal?', 'How many orders does a normal day have?'), byDefault: l('Hasta 80 pedidos.', 'Up to 80 orders.') } },
})

const BAKERY: SimScript = {
  draft: BAKERY_DRAFT,
  fixed: BAKERY_FIXED,
  reviews: {
    1: [
      {
        findings: [
          {
            criterion: 'completa',
            gravity: 'bloqueante',
            where: 'R-1',
            problem: l('La spec no dice cómo entran los pedidos al tablero: ¿los escribe el equipo o llegan de otro lado?', 'The spec does not say how orders get onto the board: does the team type them in or do they come from somewhere else?'),
            fix: l('Agrega un requisito para registrar un pedido.', 'Add a requirement to register an order.'),
            confidence: 0.75,
          },
          {
            criterion: 'acotada',
            gravity: 'menor',
            where: 'excludes',
            problem: l('Solo excluye los pagos; no dice si entran pedidos por teléfono.', 'It only excludes payments; it does not say whether phone orders come in.'),
            fix: l('Di si los pedidos por teléfono quedan fuera.', 'Say whether phone orders are out.'),
            confidence: 0.5,
          },
        ],
      },
      {
        findings: [
          {
            criterion: 'clara',
            gravity: 'importante',
            where: 'R-2',
            problem: l('«Listo» puede ser «horneado» o «empacado»: tiene dos lecturas.', '“Ready” can mean “baked” or “packed”: it has two readings.'),
            fix: l('Define listo como empacado y esperando recogida.', 'Define ready as packed and waiting for pickup.'),
            confidence: 0.7,
          },
          {
            criterion: 'honesta',
            gravity: 'bloqueante',
            where: 'Q-1',
            problem: l('Los 80 pedidos son una cifra inventada.', 'The 80 orders are an invented figure.'),
            fix: l('Quita la cifra.', 'Remove the figure.'),
            confidence: 0.5,
          },
        ],
      },
    ],
    2: [
      {
        resolves: ['completa|R-1'],
        findings: [
          {
            criterion: 'acotada',
            gravity: 'bloqueante',
            where: 'R-5',
            problem: l('El SMS al cliente y su teléfono no están en el pedido: suman un proveedor y un dato personal nuevos.', 'The SMS to the customer and their phone number are not in the request: they add a new provider and a new piece of personal data.'),
            fix: l('Quita el SMS y el teléfono de R-5.', 'Remove the SMS and the phone number from R-5.'),
            confidence: 0.8,
          },
        ],
      },
      { findings: [] },
    ],
  },
  verdicts: {
    '1|completa|R-1': { result: 'se-sostiene', reason: l('Ningún R-n dice cómo se crea un pedido.', 'No R-n says how an order is created.') },
    '1|acotada|excludes': { result: 'no-se-sabe', reason: l('El pedido no habla de canales; no alcanza para decidir.', 'The request does not mention channels; it is not enough to decide.') },
    '1|honesta|Q-1': {
      result: 'se-cae',
      reason: l('Q-1 presenta la cifra como pregunta con su valor por defecto, que es justo lo que pide la rúbrica para lo incierto.', 'Q-1 presents the figure as a question with its default, which is exactly what the rubric asks for what is uncertain.'),
    },
    '2|acotada|R-5': { result: 'se-sostiene', reason: l('El pedido no menciona mensajes al cliente ni su teléfono.', 'The request mentions neither messages to the customer nor their phone.') },
  },
  corrected: patch(BAKERY_FIXED, {
    requirements: {
      'R-2': l('Listo significa empacado y esperando recogida; el equipo lo marca desde la tableta y el tablero se actualiza.', 'Ready means packed and waiting for pickup; the team marks it from the tablet and the board updates.'),
      'R-5': l('El equipo registra un pedido nuevo con cliente, contenido, hora de recogida y teléfono, y al cliente le llega un SMS cuando está listo.', 'The team registers a new order with customer, contents, pickup time and phone, and the customer gets an SMS when it is ready.'),
    },
    criteria: {
      'C-5': { covers: ['R-6'], given: l('un pedido nuevo por teléfono', 'a new phone order'), when: l('el equipo lo registra', 'the team registers it'), then: l('aparece en el tablero con su hora de recogida', 'it appears on the board with its pickup time') },
    },
  }),
}

const SCRIPTS: Readonly<Record<GateExampleId, SimScript>> = { contacto: CONTACT, citas: REMINDER, panaderia: BAKERY }

const NOT_SOFTWARE = /\b(poema|poesia|poem|poetry|cancion|song|receta|recipe|chiste|joke|cuento|story|haiku|soneto|sonnet)\b/

function fold(text: string): string {
  return text.normalize('NFD').replace(/\p{M}+/gu, '').toLowerCase()
}

function clip(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`
}

function firstSentence(text: string): string {
  return text.split(/(?<=[.!?¿¡])\s/)[0] ?? text
}

function scriptOf(request: GateRequest): SimScript | null {
  if (request.source !== 'ejemplo' || !request.exampleId) return null
  return SCRIPTS[request.exampleId as GateExampleId] ?? null
}

const GENERIC = {
  es: {
    excludes: 'Lo que el pedido no menciona.',
    requirement: (text: string) => `El sistema hace lo que pide el pedido: «${text}».`,
    requirementFixed: (text: string) => `El sistema hace lo que pide el pedido («${text}») y muestra el resultado en pantalla.`,
    given: 'el pedido',
    when: 'alguien lo usa',
    then: 'pasa lo que el pedido describe',
    thenFixed: 'la pantalla muestra el resultado de lo que pidió',
    question: '¿Quién usa esto y desde dónde?',
    byDefault: 'Una persona desde el navegador, sin cuenta.',
    notSoftwareTitle: 'El pedido no es una funcionalidad',
    notSoftware: 'El pedido no describe software que se pueda construir, así que no hay requisitos que revisar.',
    notSoftwareInclude: 'Nada: el pedido no es una funcionalidad.',
    notSoftwareExclude: 'Responder el pedido en sí.',
    notSoftwareRequirement: 'No hay funcionalidad que construir.',
    review1: { problem: 'El simulador no entiende el pedido: R-1 lo repite sin decir qué hace el sistema paso a paso.', fix: 'Divide R-1 en requisitos que digan qué pasa y cuándo.' },
    review2: { problem: 'C-1 no dice qué resultado esperar.', fix: 'Pon en «entonces» lo que se ve o se recibe.' },
    review3: { problem: 'El título repite el pedido sin nombrar la funcionalidad.', fix: 'Pon un título de cinco palabras o menos.' },
    review4: { problem: 'Esto es una corrida simulada: un revisor de verdad juzgaría si R-1 cubre lo pedido.', fix: 'Corre el pedido en vivo con tu cuenta.' },
    verdict: 'Veredicto del simulador local: no es la opinión de un modelo.',
    comment: (text: string) => `¿Cómo se atiende este pedido de cambio: «${text}»?`,
    commentDefault: 'Se ajusta en la implementación con quien decidió.',
  },
  en: {
    excludes: 'Whatever the request does not mention.',
    requirement: (text: string) => `The system does what the request asks: “${text}”.`,
    requirementFixed: (text: string) => `The system does what the request asks (“${text}”) and shows the result on screen.`,
    given: 'the request',
    when: 'someone uses it',
    then: 'what the request describes happens',
    thenFixed: 'the screen shows the result of what they asked for',
    question: 'Who uses this and from where?',
    byDefault: 'One person from the browser, without an account.',
    notSoftwareTitle: 'The request is not a feature',
    notSoftware: 'The request does not describe software that can be built, so there are no requirements to review.',
    notSoftwareInclude: 'Nothing: the request is not a feature.',
    notSoftwareExclude: 'Answering the request itself.',
    notSoftwareRequirement: 'There is no feature to build.',
    review1: { problem: 'The simulator does not understand the request: R-1 repeats it without saying what the system does step by step.', fix: 'Split R-1 into requirements that say what happens and when.' },
    review2: { problem: 'C-1 does not say what result to expect.', fix: 'Put in “then” what is seen or received.' },
    review3: { problem: 'The title repeats the request without naming the feature.', fix: 'Use a title of five words or fewer.' },
    review4: { problem: 'This is a simulated run: a real reviewer would judge whether R-1 covers the request.', fix: 'Run the request live with your account.' },
    verdict: 'Local simulator verdict: not a model’s opinion.',
    comment: (text: string) => `How is this change request handled: “${text}”?`,
    commentDefault: 'It is settled during implementation with whoever decided.',
  },
} as const

function genericSpec(request: GateRequest, fixed: boolean): SpecBreve {
  const copy = GENERIC[request.lang]
  const sentence = clip(firstSentence(request.text), 110)
  const problem = clip(request.text, 400)
  return {
    title: clip(sentence, 80).length >= 3 ? clip(sentence, 80) : copy.notSoftwareTitle,
    problem: problem.length >= 10 ? problem : `${problem} · ${copy.excludes}`,
    includes: [clip(sentence, 190)],
    excludes: [copy.excludes],
    requirements: [{ id: 'R-1', text: clip(fixed ? copy.requirementFixed(clip(sentence, 150)) : copy.requirement(clip(sentence, 200)), 290) }],
    criteria: [{ id: 'C-1', covers: ['R-1'], given: copy.given, when: copy.when, then: fixed ? copy.thenFixed : copy.then }],
    questions: [{ id: 'Q-1', question: copy.question, byDefault: copy.byDefault }],
  }
}

function notSoftwareSpec(lang: GateLang): SpecBreve {
  const copy = GENERIC[lang]
  return {
    title: copy.notSoftwareTitle,
    problem: copy.notSoftware,
    includes: [copy.notSoftwareInclude],
    excludes: [copy.notSoftwareExclude],
    requirements: [{ id: 'R-1', text: copy.notSoftwareRequirement }],
    criteria: [{ id: 'C-1', covers: ['R-1'], given: copy.given, when: copy.when, then: copy.notSoftwareRequirement }],
    questions: [],
  }
}

function findingsOf(items: readonly SimFinding[], lang: GateLang): ReviewReplyWire['findings'] {
  return items.map((item) => ({ criterion: item.criterion, gravity: item.gravity, where: item.where, problem: item.problem[lang], fix: item.fix[lang], confidence: item.confidence }))
}

function idsFor(keys: readonly string[] | undefined, previous: readonly MergedFinding[]): string[] {
  if (!keys) return []
  return previous.filter((item) => keys.includes(`${item.criterion}|${item.where}`)).map((item) => item.id)
}

export type SimReviewInput = { request: GateRequest; spec: SpecBreve; round: GateRoundNumber; index: number; previous: readonly MergedFinding[] }

export const gateSimulator = {
  isNotSoftware(text: string): boolean {
    return NOT_SOFTWARE.test(fold(text))
  },

  write(request: GateRequest): WriterReplyWire {
    if (gateSimulator.isNotSoftware(request.text)) return { kind: 'no-es-software', spec: notSoftwareSpec(request.lang) }
    const script = scriptOf(request)
    return { kind: 'funcionalidad', spec: script ? render(script.draft, request.lang) : genericSpec(request, false) }
  },

  fixChecks(request: GateRequest, spec: SpecBreve): WriterReplyWire {
    const script = scriptOf(request)
    return { kind: 'funcionalidad', spec: script?.fixed ? render(script.fixed, request.lang) : spec }
  },

  correct(request: GateRequest, spec: SpecBreve, round: GateRoundNumber, comment: string | null): WriterReplyWire {
    const script = scriptOf(request)
    const copy = GENERIC[request.lang]
    let next = round === 2 ? (script ? render(script.corrected, request.lang) : genericSpec(request, true)) : spec
    if (comment) {
      const taken = new Set(next.questions.map((item) => item.id))
      let n = 1
      while (taken.has(`Q-${n}`)) n++
      const question = { id: `Q-${n}`, question: clip(copy.comment(clip(comment, 140)), 200), byDefault: copy.commentDefault }
      next = { ...next, questions: [...next.questions, question].slice(0, 6) }
    }
    return { kind: 'funcionalidad', spec: next }
  },

  review(input: SimReviewInput): ReviewReplyWire {
    const script = scriptOf(input.request)
    const lang = input.request.lang
    if (script && input.round <= 2) {
      const review = script.reviews[input.round as 1 | 2][input.index] ?? { findings: [] }
      return { findings: findingsOf(review.findings, lang), resolved: idsFor(review.resolves, input.previous) }
    }
    if (script || input.round > 2) return { findings: [], resolved: [] }
    const copy = GENERIC[lang]
    if (input.round === 1) {
      const findings: ReviewReplyWire['findings'] =
        input.index === 0
          ? [{ criterion: 'completa', gravity: 'importante', where: 'R-1', problem: copy.review1.problem, fix: copy.review1.fix, confidence: 0.8 }]
          : [
              { criterion: 'verificable', gravity: 'importante', where: 'C-1', problem: copy.review2.problem, fix: copy.review2.fix, confidence: 0.7 },
              { criterion: 'clara', gravity: 'menor', where: 'title', problem: copy.review3.problem, fix: copy.review3.fix, confidence: 0.45 },
            ]
      return { findings, resolved: [] }
    }
    return input.index === 0
      ? { findings: [{ criterion: 'completa', gravity: 'importante', where: 'R-1', problem: copy.review4.problem, fix: copy.review4.fix, confidence: 0.7 }], resolved: [] }
      : { findings: [], resolved: [] }
  },

  verify(request: GateRequest, round: GateRoundNumber, findings: readonly Pick<MergedFinding, 'id' | 'criterion' | 'where'>[]): VerifierReplyWire {
    const script = scriptOf(request)
    return {
      verdicts: findings.map((item) => {
        const scripted = script?.verdicts[`${round}|${item.criterion}|${item.where}`]
        return scripted ? { id: item.id, result: scripted.result, reason: scripted.reason[request.lang] } : { id: item.id, result: 'no-se-sabe' as const, reason: GENERIC[request.lang].verdict }
      }),
    }
  },
}

export type GateSimulator = typeof gateSimulator
