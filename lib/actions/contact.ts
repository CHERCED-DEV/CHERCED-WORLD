'use server'

import type { ActionResult } from './result'

export async function submitContact(_prev: ActionResult | null, _formData: FormData): Promise<ActionResult> {
  return { ok: false, error: 'unavailable' }
}
