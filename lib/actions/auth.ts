'use server'

import type { ActionResult } from './result'

export async function login(_prev: ActionResult | null, _formData: FormData): Promise<ActionResult> {
  return { ok: false, error: 'unavailable' }
}

export async function logout(_prev: ActionResult | null, _formData: FormData): Promise<ActionResult> {
  return { ok: false, error: 'unavailable' }
}

export async function completeSetup(_prev: ActionResult | null, _formData: FormData): Promise<ActionResult> {
  return { ok: false, error: 'unavailable' }
}

export async function changePassword(_prev: ActionResult | null, _formData: FormData): Promise<ActionResult> {
  return { ok: false, error: 'unavailable' }
}
