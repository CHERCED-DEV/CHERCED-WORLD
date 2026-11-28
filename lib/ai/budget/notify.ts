import 'server-only'
import { publicEmail } from '@/content/site'
import type { MessageRepo } from '@/lib/data/types'
import { BUDGET_CAP_USD, BUDGET_TARGET_USD } from './config'
import type { BudgetEvent } from './ledger'

export const BUDGET_SENDER = 'Libro de gasto de IA'

export const BUDGET_SENDER_EMAIL = 'gasto@cherced-world.invalid'

export function budgetMessage(event: BudgetEvent): string {
  const spent = event.totalUsd.toFixed(2)
  if (event.kind === 'warned') {
    return `El gasto de IA de ${event.month} pasó la meta de ${BUDGET_TARGET_USD} USD: va en ${spent} USD de un techo de ${BUDGET_CAP_USD} USD. El detalle por proveedor y por línea está en el panel de gasto.`
  }
  return `El gasto de IA de ${event.month} llegó al techo de ${BUDGET_CAP_USD} USD (${spent} USD). El puerto rechaza toda llamada hasta el mes siguiente y las demos muestran su modo apagado.`
}

export async function notifyAuthor(messages: MessageRepo, event: BudgetEvent): Promise<void> {
  await messages.create({
    name: BUDGET_SENDER,
    email: publicEmail() ?? BUDGET_SENDER_EMAIL,
    phone: null,
    message: budgetMessage(event),
    interest: 'other',
    consentAt: event.at,
  })
}
