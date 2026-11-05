import { isServiceId, type ServiceId } from '@/content/types'

export const SERVICE_QUERY_PARAM = 'servicio'

export function preselectedInterest(value: string | string[] | undefined): ServiceId | null {
  return typeof value === 'string' && isServiceId(value) ? value : null
}
