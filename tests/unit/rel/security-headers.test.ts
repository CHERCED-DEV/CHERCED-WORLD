import { describe, expect, it } from 'vitest'
import nextConfig, { SECURITY_HEADERS } from '@/next.config'
import { projects } from '@/content/projects'
import { SITE_ORIGIN } from '@/lib/site-url'

describe('R4.1 B1: cabeceras de seguridad en todas las rutas', () => {
  it('se aplican a todo el sitio', async () => {
    expect(await nextConfig.headers?.()).toEqual([{ source: '/:path*', headers: SECURITY_HEADERS }])
  })

  it('nadie más puede enmarcar el sitio, pero el caso 2 puede mostrarlo en vivo dentro de su propia página', () => {
    const csp = SECURITY_HEADERS.find((header) => header.key === 'Content-Security-Policy')?.value ?? ''
    expect(csp).toContain("frame-ancestors 'self'")
    expect(csp).toContain("object-src 'none'")
    expect(csp).not.toMatch(/script-src/)
    expect(projects.some((project) => project.links.live === `${SITE_ORIGIN}/`)).toBe(true)
  })

  it('el micrófono sigue disponible para el transcriptor del AI Lab, y la cámara y la ubicación no', () => {
    const policy = SECURITY_HEADERS.find((header) => header.key === 'Permissions-Policy')?.value ?? ''
    expect(policy).toContain('microphone=(self)')
    expect(policy).toContain('camera=()')
    expect(policy).toContain('geolocation=()')
  })
})
