import type { Localized } from '@/content/types'

export const DESPACHO_EVIDENCE_IDS = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8'] as const

export type DespachoEvidenceId = (typeof DESPACHO_EVIDENCE_IDS)[number]

export type DespachoEvidence = {
  id: DespachoEvidenceId
  title: Localized
  by: Localized
  date: Localized
  note?: Localized
}

export const DESPACHO_RELATIONS = ['supports', 'contradicts', 'situates'] as const

export type DespachoRelation = (typeof DESPACHO_RELATIONS)[number]

export const DESPACHO_FACT_STATUSES = ['supported', 'disputed', 'onlySaid'] as const

export type DespachoFactStatus = (typeof DESPACHO_FACT_STATUSES)[number]

export type DespachoFact = {
  id: string
  text: Localized
  status: DespachoFactStatus
  links: Array<{ evidence: DespachoEvidenceId; relation: DespachoRelation; note: Localized }>
  missing?: Localized
}

export const DESPACHO_CERTAINTIES = ['documented', 'reported', 'approximate', 'deduced', 'conflict'] as const

export type DespachoCertainty = (typeof DESPACHO_CERTAINTIES)[number]

export type DespachoTimelineEntry =
  | {
      kind: 'event'
      id: string
      sortKey: string
      date: Localized
      event: Localized
      certainty: DespachoCertainty
      sources: DespachoEvidenceId[]
      note?: Localized
    }
  | { kind: 'gap'; id: string; sortKey: string; date: Localized; note: Localized }

export type DespachoCase = {
  fictional: true
  title: Localized
  summary: Localized
  evidence: DespachoEvidence[]
  facts: DespachoFact[]
  timeline: DespachoTimelineEntry[]
}

export const DESPACHO_CASE: DespachoCase = {
  fictional: true,
  title: {
    es: 'Caso ficticio: la máquina de café que llegó golpeada',
    en: 'Fictional case: the coffee machine that arrived dented',
  },
  summary: {
    es: 'La dueña de un café le compra una máquina de espresso a un proveedor, paga la mitad por adelantado y la recibe cuatro semanas después con la carcasa abollada. El proveedor dice que la entregó en buen estado. Las personas, las fechas y los documentos son inventados.',
    en: 'The owner of a café buys an espresso machine from a supplier, pays half up front and receives it four weeks later with a dented casing. The supplier says it was delivered in good condition. The people, dates and documents are made up.',
  },
  evidence: [
    {
      id: 'P1',
      title: { es: 'Orden de compra n.º 0042', en: 'Purchase order no. 0042' },
      by: { es: 'el proveedor', en: 'the supplier' },
      date: { es: '3 mar 2025', en: 'Mar 3, 2025' },
      note: {
        es: 'Dice «anticipo del 50 %» y «entrega estimada: 15 días hábiles».',
        en: 'It says "50% advance" and "estimated delivery: 15 business days".',
      },
    },
    {
      id: 'P2',
      title: { es: 'Comprobante de la transferencia del anticipo', en: 'Receipt for the advance transfer' },
      by: { es: 'el banco de la clienta', en: "the client's bank" },
      date: { es: '3 mar 2025', en: 'Mar 3, 2025' },
    },
    {
      id: 'P3',
      title: { es: 'Capturas del chat con el vendedor', en: 'Screenshots of the chat with the seller' },
      by: { es: 'la clienta', en: 'the client' },
      date: { es: '3 mar a 8 abr 2025', en: 'Mar 3 to Apr 8, 2025' },
      note: { es: 'No aparece ningún plazo de entrega.', en: 'No delivery deadline appears.' },
    },
    {
      id: 'P4',
      title: { es: 'Remisión de entrega firmada', en: 'Signed delivery note' },
      by: { es: 'la transportadora', en: 'the carrier' },
      date: { es: '1 abr 2025', en: 'Apr 1, 2025' },
      note: { es: 'Firmada con la nota «recibido, sin revisar».', en: 'Signed with the note "received, not inspected".' },
    },
    {
      id: 'P5',
      title: { es: 'Cuatro fotos de la carcasa abollada', en: 'Four photos of the dented casing' },
      by: { es: 'la clienta', en: 'the client' },
      date: { es: '2 abr 2025, según sus metadatos', en: 'Apr 2, 2025, according to their metadata' },
    },
    {
      id: 'P6',
      title: { es: 'Informe del técnico', en: "Technician's report" },
      by: { es: 'un técnico independiente', en: 'an independent technician' },
      date: { es: '11 abr 2025', en: 'Apr 11, 2025' },
      note: {
        es: 'Dice «abolladura compatible con un golpe en el transporte».',
        en: 'It says "dent consistent with an impact during transport".',
      },
    },
    {
      id: 'P7',
      title: { es: 'Correo de reclamo al proveedor', en: 'Complaint email to the supplier' },
      by: { es: 'la clienta', en: 'the client' },
      date: { es: '8 abr 2025', en: 'Apr 8, 2025' },
    },
    {
      id: 'P8',
      title: { es: 'Notas de la entrevista con la clienta', en: 'Notes from the interview with the client' },
      by: { es: 'el despacho', en: 'the law office' },
      date: { es: '14 abr 2025', en: 'Apr 14, 2025' },
    },
  ],
  facts: [
    {
      id: 'H1',
      text: { es: 'La clienta pagó la mitad del precio al hacer el pedido.', en: 'The client paid half the price when placing the order.' },
      status: 'supported',
      links: [
        { evidence: 'P2', relation: 'supports', note: { es: 'La transferencia es del día del pedido.', en: 'The transfer is from the day of the order.' } },
        { evidence: 'P1', relation: 'supports', note: { es: 'La orden pide un anticipo del 50 %.', en: 'The order asks for a 50% advance.' } },
      ],
    },
    {
      id: 'H2',
      text: { es: 'El vendedor prometió entregar la máquina en una semana.', en: 'The seller promised to deliver the machine within a week.' },
      status: 'disputed',
      links: [
        { evidence: 'P8', relation: 'supports', note: { es: 'Así lo recuerda la clienta.', en: 'That is how the client remembers it.' } },
        { evidence: 'P1', relation: 'contradicts', note: { es: 'La orden dice 15 días hábiles.', en: 'The order says 15 business days.' } },
        { evidence: 'P3', relation: 'situates', note: { es: 'El chat no habla de plazos.', en: 'The chat does not mention deadlines.' } },
      ],
      missing: {
        es: 'Algo escrito del vendedor con ese plazo.',
        en: 'Something in writing from the seller with that deadline.',
      },
    },
    {
      id: 'H3',
      text: { es: 'La máquina llegó con la carcasa abollada.', en: 'The machine arrived with a dented casing.' },
      status: 'supported',
      links: [
        { evidence: 'P5', relation: 'supports', note: { es: 'Las fotos son del día siguiente a la entrega.', en: 'The photos are from the day after delivery.' } },
        {
          evidence: 'P6',
          relation: 'supports',
          note: { es: 'El técnico la ve compatible con un golpe en el transporte.', en: 'The technician finds it consistent with an impact in transport.' },
        },
        {
          evidence: 'P4',
          relation: 'situates',
          note: {
            es: 'Se firmó «sin revisar»: no deja constancia del estado al recibirla.',
            en: 'It was signed "not inspected": it leaves no record of the condition on receipt.',
          },
        },
      ],
    },
    {
      id: 'H4',
      text: { es: 'La clienta reclamó por escrito una semana después de recibirla.', en: 'The client complained in writing a week after receiving it.' },
      status: 'supported',
      links: [
        { evidence: 'P7', relation: 'supports', note: { es: 'El correo es del 8 de abril.', en: 'The email is from April 8.' } },
        { evidence: 'P4', relation: 'situates', note: { es: 'La entrega fue el 1 de abril.', en: 'Delivery was on April 1.' } },
      ],
    },
    {
      id: 'H5',
      text: { es: 'El proveedor no respondió el reclamo.', en: 'The supplier did not answer the complaint.' },
      status: 'onlySaid',
      links: [{ evidence: 'P8', relation: 'supports', note: { es: 'Lo dice la clienta.', en: 'The client says so.' } }],
      missing: {
        es: 'Los correos y mensajes posteriores al 8 de abril.',
        en: 'The emails and messages after April 8.',
      },
    },
  ],
  timeline: [
    {
      kind: 'event',
      id: 'T1',
      sortKey: '2025-03-03',
      date: { es: '3 mar 2025', en: 'Mar 3, 2025' },
      event: { es: 'Pedido de la máquina y pago del anticipo.', en: 'Order of the machine and payment of the advance.' },
      certainty: 'documented',
      sources: ['P1', 'P2'],
    },
    {
      kind: 'event',
      id: 'T2',
      sortKey: '2025-03-10',
      date: { es: 'Hacia el 10 mar 2025', en: 'Around Mar 10, 2025' },
      event: {
        es: 'Fecha en que, según la clienta, le prometieron la entrega.',
        en: 'Date on which, according to the client, delivery was promised.',
      },
      certainty: 'conflict',
      sources: ['P8', 'P1'],
      note: {
        es: 'Choca con los «15 días hábiles» de la orden. Contar ese plazo no le toca al método.',
        en: 'It clashes with the "15 business days" in the order. Counting that period is not the method’s job.',
      },
    },
    {
      kind: 'event',
      id: 'T3',
      sortKey: '2025-03-25',
      date: { es: 'Finales de mar 2025', en: 'Late Mar 2025' },
      event: {
        es: 'El vendedor le dice por teléfono que la máquina ya salió de la bodega.',
        en: 'The seller tells her over the phone that the machine has left the warehouse.',
      },
      certainty: 'reported',
      sources: ['P8'],
      note: { es: 'Solo está en la entrevista.', en: 'It is only in the interview.' },
    },
    {
      kind: 'event',
      id: 'T4',
      sortKey: '2025-04-01',
      date: { es: '1 abr 2025', en: 'Apr 1, 2025' },
      event: {
        es: 'Entrega en el café; la remisión se firma «recibido, sin revisar».',
        en: 'Delivery at the café; the note is signed "received, not inspected".',
      },
      certainty: 'documented',
      sources: ['P4'],
    },
    {
      kind: 'event',
      id: 'T5',
      sortKey: '2025-04-02',
      date: { es: '2 abr 2025', en: 'Apr 2, 2025' },
      event: { es: 'Fotos de la carcasa abollada.', en: 'Photos of the dented casing.' },
      certainty: 'deduced',
      sources: ['P5'],
      note: {
        es: 'La fecha sale de los metadatos de las fotos, no de un documento.',
        en: 'The date comes from the photos’ metadata, not from a document.',
      },
    },
    {
      kind: 'gap',
      id: 'T6',
      sortKey: '2025-04-03',
      date: { es: '3 a 7 abr 2025', en: 'Apr 3 to 7, 2025' },
      note: {
        es: 'El material no dice qué pasó estos días: si hubo llamadas, nada las registra.',
        en: 'The material says nothing about these days: if there were calls, nothing records them.',
      },
    },
    {
      kind: 'event',
      id: 'T7',
      sortKey: '2025-04-08',
      date: { es: '8 abr 2025', en: 'Apr 8, 2025' },
      event: { es: 'Correo de reclamo al proveedor.', en: 'Complaint email to the supplier.' },
      certainty: 'documented',
      sources: ['P7'],
    },
    {
      kind: 'event',
      id: 'T8',
      sortKey: '2025-04-09',
      date: { es: 'Entre el 8 y el 11 abr 2025', en: 'Between Apr 8 and 11, 2025' },
      event: { es: 'La clienta llama al técnico.', en: 'The client calls the technician.' },
      certainty: 'approximate',
      sources: ['P8', 'P6'],
      note: {
        es: 'Ella dice «al otro día del correo»; el informe no dice cuándo lo llamaron.',
        en: 'She says "the day after the email"; the report does not say when he was called.',
      },
    },
    {
      kind: 'event',
      id: 'T9',
      sortKey: '2025-04-11',
      date: { es: '11 abr 2025', en: 'Apr 11, 2025' },
      event: { es: 'Visita del técnico e informe.', en: "Technician's visit and report." },
      certainty: 'documented',
      sources: ['P6'],
    },
  ],
}

export function despachoEvidence(id: DespachoEvidenceId): DespachoEvidence {
  const found = DESPACHO_CASE.evidence.find((item) => item.id === id)
  if (!found) throw new Error(`El caso de ejemplo no tiene la pieza ${id}`)
  return found
}
