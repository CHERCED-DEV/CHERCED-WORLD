export function queryHref(base: string, params: Record<string, string>): string {
  const search = new URLSearchParams(params).toString()
  return search ? `${base}?${search}` : base
}

export function pickParam<T extends string>(value: string | string[] | undefined, allowed: readonly T[], fallback: T): T {
  const raw = Array.isArray(value) ? value[0] : value
  return allowed.includes(raw as T) ? (raw as T) : fallback
}
