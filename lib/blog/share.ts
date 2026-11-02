export type ShareNetwork = 'x' | 'linkedin' | 'facebook' | 'whatsapp'

export type ShareTarget = { id: ShareNetwork; name: string; href: string }

function withQuery(base: string, query: Record<string, string>): string {
  return `${base}?${new URLSearchParams(query).toString()}`
}

export function shareTargets({ url, title }: { url: string; title: string }): ShareTarget[] {
  return [
    { id: 'x', name: 'X', href: withQuery('https://x.com/intent/tweet', { url, text: title }) },
    { id: 'linkedin', name: 'LinkedIn', href: withQuery('https://www.linkedin.com/sharing/share-offsite/', { url }) },
    { id: 'facebook', name: 'Facebook', href: withQuery('https://www.facebook.com/sharer/sharer.php', { u: url }) },
    { id: 'whatsapp', name: 'WhatsApp', href: withQuery('https://wa.me/', { text: `${title} ${url}` }) },
  ]
}
