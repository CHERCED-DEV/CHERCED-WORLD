const GONE_BODY = JSON.stringify({ error: 'gone' })

const GONE_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-robots-tag': 'noindex',
}

export function goneResponse(): Response {
  return new Response(GONE_BODY, { status: 410, headers: GONE_HEADERS })
}

async function gone(): Promise<Response> {
  return goneResponse()
}

export const goneHandlers = {
  GET: gone,
  HEAD: gone,
  POST: gone,
  PUT: gone,
  PATCH: gone,
  DELETE: gone,
  OPTIONS: gone,
}
