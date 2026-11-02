export type CapsuleDevice = 'desktop' | 'mobile'

export type CapsuleShot = {
  slug: string
  route: string
  size: Record<CapsuleDevice, { width: number; height: number }>
}

export const CAPSULE_CAPTURED_AT = '2026-11-01'

export const CAPSULE_SOURCE = 'https://cherced-world.vercel.app'

export const CAPSULE_SHOTS: CapsuleShot[] = [
  { slug: 'home', route: '/', size: { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } } },
  { slug: 'aboutMe', route: '/aboutMe', size: { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } } },
  { slug: 'services', route: '/services', size: { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 1533 } } },
  { slug: 'portfolio', route: '/portfolio', size: { desktop: { width: 1425, height: 2085 }, mobile: { width: 390, height: 2392 } } },
  { slug: 'portfolio-1', route: '/portfolio/1', size: { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } } },
  { slug: 'blog', route: '/blog', size: { desktop: { width: 1433, height: 1847 }, mobile: { width: 390, height: 2423 } } },
  { slug: 'blog-post1', route: '/blog/post1', size: { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } } },
  { slug: 'contactMe', route: '/contactMe', size: { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 1269 } } },
]

export function capsuleShotSrc(shot: CapsuleShot, device: CapsuleDevice): string {
  return `/capsule/${shot.slug}-${device}.webp`
}
