import { z } from 'zod'
import { LAB_EXPERIMENT_IDS } from '@/content/types'
import { LAB_EVENT_TYPES, type LabEventRecord } from '@/lib/data/types'

export const LAB_EVENTS_ENDPOINT = '/api/ailab/events'

export const LAB_EVENT_DAYS = 90

export const LAB_EVENTS_BATCH = 20

export const LAB_EVENT_DETAIL = /^[a-z0-9_.:-]{1,60}$/

const DAY = 24 * 60 * 60 * 1000

export const labEventsInput = z.object({
  events: z
    .array(
      z.object({
        experiment: z.enum(LAB_EXPERIMENT_IDS),
        type: z.enum(LAB_EVENT_TYPES),
        detail: z.string().regex(LAB_EVENT_DETAIL).optional(),
        lang: z.enum(['es', 'en']),
        at: z.number().int().positive().optional(),
      }),
    )
    .min(1)
    .max(LAB_EVENTS_BATCH),
})

export type LabEventInput = z.infer<typeof labEventsInput>['events'][number]

export function eventRecords(events: readonly LabEventInput[], accountId: string, now: Date): LabEventRecord[] {
  return events.map((event) => {
    const at = event.at && Math.abs(now.getTime() - event.at) < 10 * 60 * 1000 ? new Date(event.at) : now
    return { accountId, experiment: event.experiment, type: event.type, detail: event.detail ?? null, lang: event.lang, at, expiresAt: new Date(at.getTime() + LAB_EVENT_DAYS * DAY) }
  })
}

export function downloadDetail(element: Element | null): string | null {
  const control = element?.closest('a[download], button, a') ?? null
  if (!control) return null
  if (control.matches('a[download]')) return 'file'
  const name = [...control.getAttributeNames()].find((attribute) => /^data-cw-[\w-]*(download|export|srt|json|png|svg|bilingual)/.test(attribute))
  return name ? name.slice('data-cw-'.length).slice(0, 60) : null
}
