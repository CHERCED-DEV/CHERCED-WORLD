import { describe, expect, it } from 'vitest'
import { absoluteUrl, getSiteUrl } from '@/lib/site-url'

describe('getSiteUrl', () => {
  it('usa VERCEL_URL_CORS primero', () => {
    expect(
      getSiteUrl({ VERCEL_URL_CORS: 'https://cherced-world.vercel.app', VERCEL_PROJECT_PRODUCTION_URL: 'otro.app' }).href,
    ).toBe('https://cherced-world.vercel.app/')
  })

  it('normaliza barras finales, rutas y listas separadas por coma', () => {
    expect(getSiteUrl({ VERCEL_URL_CORS: 'https://cherced-world.vercel.app/' }).href).toBe('https://cherced-world.vercel.app/')
    expect(getSiteUrl({ VERCEL_URL_CORS: 'https://a.app/api, https://b.app' }).href).toBe('https://a.app/')
  })

  it('cae en VERCEL_PROJECT_PRODUCTION_URL sin protocolo', () => {
    expect(getSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: 'cherced-world.vercel.app' }).href).toBe(
      'https://cherced-world.vercel.app/',
    )
  })

  it('ignora valores inválidos y usa localhost sin variables', () => {
    expect(getSiteUrl({ VERCEL_URL_CORS: 'http://' }).href).toBe('http://localhost:3000/')
    expect(getSiteUrl({}).href).toBe('http://localhost:3000/')
    expect(getSiteUrl({ VERCEL_URL_CORS: 'localhost:4000' }).href).toBe('http://localhost:4000/')
  })

  it('en un deploy de Vercel nunca toma la URL de la rama ni la del deploy (B7 de la 007)', () => {
    const production = {
      VERCEL: '1',
      VERCEL_ENV: 'production',
      VERCEL_PROJECT_PRODUCTION_URL: 'cherced-world.vercel.app',
      VERCEL_URL: 'cherced-world-abc123-cherceddevs-projects.vercel.app',
      VERCEL_BRANCH_URL: 'cherced-world-git-003-laboratorio-ia-cherceddevs-projects.vercel.app',
    }
    expect(getSiteUrl(production).href).toBe('https://cherced-world.vercel.app/')
    expect(getSiteUrl({ ...production, VERCEL_ENV: 'preview' }).href).toBe('https://cherced-world.vercel.app/')
  })

  it('arma URLs absolutas', () => {
    expect(absoluteUrl('/es/blog', { VERCEL_URL_CORS: 'https://cherced.dev' })).toBe('https://cherced.dev/es/blog')
  })
})
