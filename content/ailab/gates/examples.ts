import type { Localized } from '@/content/types'

export const GATE_EXAMPLE_IDS = ['contacto', 'citas', 'panaderia'] as const

export type GateExampleId = (typeof GATE_EXAMPLE_IDS)[number]

export type GateExample = { id: GateExampleId; title: Localized; text: Localized }

export const GATE_EXAMPLES: readonly GateExample[] = [
  {
    id: 'contacto',
    title: { es: 'Un formulario de contacto con adjuntos', en: 'A contact form with attachments' },
    text: {
      es: 'Quiero un formulario de contacto para el sitio de un estudio de diseño ficticio: nombre, correo, mensaje y hasta tres adjuntos. Cuando alguien escriba, que al estudio le llegue un aviso por correo y que la persona vea que su mensaje se envió.',
      en: 'I want a contact form for the website of a fictional design studio: name, email, message and up to three attachments. When someone writes, the studio should get an email notice and the person should see that the message was sent.',
    },
  },
  {
    id: 'citas',
    title: { es: 'Un recordatorio de citas por correo', en: 'An email appointment reminder' },
    text: {
      es: 'Un consultorio de fisioterapia ficticio quiere que cada paciente reciba un recordatorio por correo el día antes de su cita, con un enlace para confirmarla o cancelarla. Si cancela, el horario debe quedar libre en la agenda.',
      en: 'A fictional physiotherapy practice wants every patient to get an email reminder the day before the appointment, with a link to confirm or cancel it. If they cancel, the slot should become free in the schedule.',
    },
  },
  {
    id: 'panaderia',
    title: { es: 'Un tablero de pedidos para una panadería ficticia', en: 'An order board for a fictional bakery' },
    text: {
      es: 'Una panadería de barrio ficticia necesita un tablero para ver los pedidos del día: quién los pidió, qué llevan, a qué hora los recogen y si ya están listos. El equipo marca cada pedido como listo desde una tableta.',
      en: 'A fictional neighborhood bakery needs a board to see the day’s orders: who placed them, what they contain, when they are picked up and whether they are ready. The team marks each order as ready from a tablet.',
    },
  },
]

export function gateExample(id: string): GateExample | undefined {
  return GATE_EXAMPLES.find((item) => item.id === id)
}
