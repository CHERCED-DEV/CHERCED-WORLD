export type DownloadEnv = {
  document: Pick<Document, 'createElement' | 'body'>
  url: Pick<typeof URL, 'createObjectURL' | 'revokeObjectURL'>
  later: (run: () => void) => void
}

function browserEnv(): DownloadEnv {
  return { document, url: URL, later: (run) => window.setTimeout(run, 0) }
}

export function downloadText(fileName: string, text: string, type = 'text/markdown;charset=utf-8', env: DownloadEnv = browserEnv()): Blob {
  const blob = new Blob([text], { type })
  const href = env.url.createObjectURL(blob)
  const link = env.document.createElement('a')
  link.href = href
  link.download = fileName
  link.rel = 'noopener'
  link.hidden = true
  env.document.body.append(link)
  link.click()
  link.remove()
  env.later(() => env.url.revokeObjectURL(href))
  return blob
}
