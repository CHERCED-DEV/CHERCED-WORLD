import type { Metadata } from 'next'

export type SearchVerification = { google: string | null; bing: string | null }

export const SEARCH_VERIFICATION: SearchVerification = {
  google: null,
  bing: null,
}

export const BING_META_NAME = 'msvalidate.01'

export function verificationMetadata(tokens: SearchVerification = SEARCH_VERIFICATION): Metadata['verification'] | undefined {
  const google = tokens.google?.trim()
  const bing = tokens.bing?.trim()
  if (!google && !bing) return undefined
  return {
    ...(google ? { google } : {}),
    ...(bing ? { other: { [BING_META_NAME]: bing } } : {}),
  }
}
