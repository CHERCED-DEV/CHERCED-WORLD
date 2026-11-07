import { getSiteUrl } from '@/lib/site-url'

export type Crumb = { name: string; path: string }

export type BreadcrumbListJsonLd = {
  '@context': 'https://schema.org'
  '@type': 'BreadcrumbList'
  itemListElement: Array<{ '@type': 'ListItem'; position: number; name: string; item: string }>
}

export function breadcrumbJsonLd(crumbs: readonly Crumb[], base: URL = getSiteUrl()): BreadcrumbListJsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: new URL(crumb.path, base).toString(),
    })),
  }
}
