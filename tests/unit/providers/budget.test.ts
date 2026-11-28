import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { BudgetCard } from '@/components/ailab/arena/BudgetCard'
import { BUDGET_CAP_MICRO, BUDGET_CAP_USD, BUDGET_TARGET_USD, budgetMonth, toMicroUsd } from '@/lib/ai/budget/config'
import { assertBudget, reserveBudget, settleBudget, type BudgetEvent, type Ledger } from '@/lib/ai/budget/ledger'
import { budgetMessage, notifyAuthor } from '@/lib/ai/budget/notify'
import { budgetSummary, summarize } from '@/lib/ai/budget/summary'
import { BudgetExhaustedError, BudgetUnavailableError } from '@/lib/ai/providers/types'
import { createMemoryBudgetRepo } from '@/lib/data/memory/budget'
import { createMemoryMessageRepo } from '@/lib/data/memory/messages'
import { budgetExpiresAt, budgetReserveWrite, budgetSettleWrite, toBudgetMonth } from '@/lib/data/mongo/budget'
import { TTL_INDEXES } from '@/lib/data/mongo/indexes'
import type { BudgetRepo } from '@/lib/data/types'

const NOV = new Date('2026-11-27T15:00:00.000Z')

function ledger(repo: BudgetRepo = createMemoryBudgetRepo()) {
  const events: BudgetEvent[] = []
  const value: Ledger = { repo, notify: async (event) => void events.push(event) }
  return { ledger: value, repo, events }
}

async function fill(repo: BudgetRepo, month: string, usd: number) {
  await repo.reserve(month, toMicroUsd(usd), BUDGET_CAP_MICRO)
}

describe('libro mensual de gasto (FR-4308, SC-4303)', () => {
  it('meta de 10 USD, techo de 25 USD y mes en UTC', () => {
    expect([BUDGET_TARGET_USD, BUDGET_CAP_USD]).toEqual([10, 25])
    expect(budgetMonth(new Date('2026-11-30T23:59:59.999Z'))).toBe('2026-11')
    expect(budgetMonth(new Date('2026-12-01T00:00:00.000Z'))).toBe('2026-12')
    expect(budgetMonth(new Date('2026-12-01T03:00:00.000-05:00'))).toBe('2026-12')
  })

  it('con el libro en 24,98 USD, un pedido de 0,03 USD se rechaza antes de llamar', async () => {
    const { ledger: book, repo, events } = ledger()
    await fill(repo, '2026-11', 24.98)
    await expect(reserveBudget(book, 0.03, NOV)).rejects.toBeInstanceOf(BudgetExhaustedError)
    await expect(assertBudget(repo, 0.03, NOV)).rejects.toBeInstanceOf(BudgetExhaustedError)
    await expect(assertBudget(repo, 0.01, NOV)).resolves.toBeUndefined()
    expect((await repo.get('2026-11'))!.totalMicroUsd).toBe(toMicroUsd(24.98))
    expect(events.map((event) => event.kind)).toEqual(['cut'])
  })

  it('50 reservas a la vez a 0,10 USD del techo: el sobregiro medido es 0', async () => {
    const { ledger: book, repo } = ledger()
    await fill(repo, '2026-11', 24.9)
    const results = await Promise.allSettled(Array.from({ length: 50 }, () => reserveBudget(book, 0.003, NOV)))
    const accepted = results.filter((result) => result.status === 'fulfilled').length
    expect(accepted).toBe(33)
    expect(results.filter((result) => result.status === 'rejected').every((result) => (result as PromiseRejectedResult).reason instanceof BudgetExhaustedError)).toBe(true)
    expect((await repo.get('2026-11'))!.totalMicroUsd).toBeLessThanOrEqual(BUDGET_CAP_MICRO)
  })

  it('ajusta al costo real y lleva el desglose por proveedor y por línea', async () => {
    const { ledger: book, repo } = ledger()
    const reservation = await reserveBudget(book, 0.05, NOV)
    const month = await settleBudget(book, reservation, 0.012, 'claude', 'arena', NOV)
    expect(month).toMatchObject({ totalMicroUsd: 12_000, byProvider: { claude: 12_000 }, byLine: { arena: 12_000 } })
    expect(await repo.get('2026-11')).toEqual(month)
  })

  it('al pasar de 10 USD avisa una sola vez en el mes, y al llegar a 25 USD registra el corte', async () => {
    const { ledger: book, repo, events } = ledger()
    await fill(repo, '2026-11', 9.99)
    const first = await reserveBudget(book, 0.02, NOV)
    await settleBudget(book, first, 0.02, 'gemini', 'arena', NOV)
    const second = await reserveBudget(book, 0.02, NOV)
    await settleBudget(book, second, 0.02, 'gemini', 'arena', NOV)
    expect(events.map((event) => event.kind)).toEqual(['warned'])
    expect((await repo.get('2026-11'))!.warnedAt).toEqual(NOV)
    await fill(repo, '2026-11', 24.95 - 10.03)
    const last = await reserveBudget(book, 0.05, NOV)
    await settleBudget(book, last, 0.05, 'openai', 'kb', NOV)
    expect(events.map((event) => event.kind)).toEqual(['warned', 'cut'])
    await expect(reserveBudget(book, 0.001, NOV)).rejects.toBeInstanceOf(BudgetExhaustedError)
    expect(events).toHaveLength(2)
  })

  it('el 1 de diciembre a las 00:00 UTC el libro empieza en cero y noviembre queda cerrado', async () => {
    const { ledger: book, repo } = ledger()
    await fill(repo, '2026-11', 25)
    await expect(reserveBudget(book, 0.01, new Date('2026-11-30T23:59:59.000Z'))).rejects.toBeInstanceOf(BudgetExhaustedError)
    const december = await reserveBudget(book, 0.01, new Date('2026-12-01T00:00:00.000Z'))
    expect(december.month).toBe('2026-12')
    expect((await repo.get('2026-12'))!.totalMicroUsd).toBe(10_000)
    expect((await repo.get('2026-11'))!.totalMicroUsd).toBe(BUDGET_CAP_MICRO)
  })

  it('un cambio de mes durante la llamada ajusta el libro del mes en que se reservó', async () => {
    const { ledger: book, repo } = ledger()
    const reservation = await reserveBudget(book, 0.05, new Date('2026-11-30T23:59:59.000Z'))
    await settleBudget(book, reservation, 0.01, 'claude', 'arena', new Date('2026-12-01T00:00:01.000Z'))
    expect((await repo.get('2026-11'))!.totalMicroUsd).toBe(10_000)
    expect(await repo.get('2026-12')).toBeNull()
  })

  it('falla cerrada: si no se puede reservar, se lanza y no hay llamada', async () => {
    const down: BudgetRepo = { reserve: () => Promise.reject(new Error('down')), settle: () => Promise.reject(new Error('down')), mark: async () => false, get: () => Promise.reject(new Error('down')) }
    await expect(reserveBudget({ repo: down }, 0.01, NOV)).rejects.toBeInstanceOf(BudgetUnavailableError)
    await expect(assertBudget(down, 0.01, NOV)).rejects.toThrow('down')
    const errors: string[] = []
    expect(await settleBudget({ repo: down, onError: (scope) => void errors.push(scope) }, { month: '2026-11', microUsd: 1 }, 0, 'gemini', 'arena', NOV)).toBeNull()
    expect(errors).toEqual(['budget.settle'])
  })

  it('en Mongo: reserva condicionada con $inc, ajuste con desglose y TTL a 400 días', () => {
    expect(budgetReserveWrite('2026-11', 30_000, BUDGET_CAP_MICRO)).toEqual({
      filter: { _id: '2026-11', totalMicroUsd: { $lte: BUDGET_CAP_MICRO - 30_000 } },
      update: { $inc: { totalMicroUsd: 30_000 }, $setOnInsert: { byProvider: {}, byLine: {}, warnedAt: null, cutAt: null, expiresAt: budgetExpiresAt('2026-11') } },
    })
    expect(budgetSettleWrite('2026-11', 30_000, 12_000, 'openai', 'pyme', ).update.$inc).toEqual({ totalMicroUsd: -18_000, 'byProvider.openai': 12_000, 'byLine.pyme': 12_000 })
    expect(budgetExpiresAt('2026-11').toISOString()).toBe('2027-12-06T00:00:00.000Z')
    expect(TTL_INDEXES).toContain('ai_budget')
    expect(toBudgetMonth({ _id: '2026-11', totalMicroUsd: 5, byProvider: { claude: 5, otro: 9 } as never, expiresAt: new Date() })).toEqual({ month: '2026-11', totalMicroUsd: 5, byProvider: { claude: 5 }, byLine: {}, warnedAt: null, cutAt: null })
  })
})

describe('aviso al autor y tarjeta del tope (FR-4309, P-4304)', () => {
  it('cada cruce deja un mensaje en el buzón del autor', async () => {
    const messages = createMemoryMessageRepo()
    await notifyAuthor(messages, { kind: 'warned', month: '2026-11', totalUsd: 10.01, at: NOV })
    const [message] = await messages.list({ sort: 'newest' })
    expect(message).toMatchObject({ name: 'Libro de gasto de IA', interest: 'other', status: 'unread' })
    expect(message!.message).toContain('pasó la meta de 10 USD: va en 10.01 USD')
    expect(budgetMessage({ kind: 'cut', month: '2026-11', totalUsd: 25, at: NOV })).toContain('rechaza toda llamada hasta el mes siguiente')
  })

  it('el resumen da porcentajes, estado y desglose, y marca los precios vencidos', async () => {
    const repo = createMemoryBudgetRepo()
    const reservation = { month: '2026-11', microUsd: toMicroUsd(12.5) }
    await repo.reserve(reservation.month, reservation.microUsd, BUDGET_CAP_MICRO)
    await repo.settle(reservation.month, reservation.microUsd, toMicroUsd(12.5), 'claude', 'arena')
    const summary = await budgetSummary(repo, NOV)
    expect(summary).toMatchObject({ month: '2026-11', usd: 12.5, targetPct: 125, capPct: 50, state: 'warned', byProvider: { gemini: 0, claude: 12.5, openai: 0 }, byLine: [{ line: 'arena', usd: 12.5 }], pricesToReview: [] })
    expect(summarize('2027-01', null, '2027-01-05')).toMatchObject({ usd: 0, state: 'ok', pricesToReview: ['gemini-3.8-flash'] })
  })

  it.each(['es', 'en'] as const)('%s: la tarjeta muestra lo gastado, por proveedor, por línea y los porcentajes, con encabezados', (lang) => {
    const summary = summarize('2026-11', { month: '2026-11', totalMicroUsd: 25_000_000, byProvider: { gemini: 5_000_000, claude: 20_000_000 }, byLine: { arena: 25_000_000 }, warnedAt: NOV, cutAt: NOV }, '2027-01-05')
    const html = renderToStaticMarkup(createElement(BudgetCard, { lang, summary }))
    expect(html).toContain('data-cw-budget-card="cut"')
    expect(html).toContain('data-cw-budget-provider="claude"')
    expect(html).toContain('data-cw-budget-line="arena"')
    expect(html).toContain('<meter')
    expect(html).toContain('scope="col"')
    expect(html).toContain('role="alert"')
    expect(html).toContain('data-cw-budget-review=""')
    expect(renderToStaticMarkup(createElement(BudgetCard, { lang, summary: null }))).toContain('ai_budget')
  })

  it('el aviso no rompe la llamada si el buzón falla', async () => {
    const repo = createMemoryBudgetRepo()
    const onError = vi.fn()
    await fill(repo, '2026-11', 9.99)
    const book: Ledger = { repo, notify: () => Promise.reject(new Error('buzón caído')), onError }
    const reservation = await reserveBudget(book, 0.02, NOV)
    await expect(settleBudget(book, reservation, 0.02, 'gemini', 'arena', NOV)).resolves.toMatchObject({ month: '2026-11' })
    expect(onError).toHaveBeenCalledWith('budget.mark', expect.any(Error))
  })
})
