import { beforeEach, expect, it, vi } from 'vitest'

const fake = vi.hoisted(() => ({ files: new Map<string, string>(), failWrite: false }))
vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn(),
  readFile: vi.fn(async (path: string) => { if (!fake.files.has(path)) throw Object.assign(new Error(), { code: 'ENOENT' }); return fake.files.get(path) }),
  writeFile: vi.fn(async (path: string, value: string) => { if (fake.failWrite) throw new Error('disk unavailable'); fake.files.set(path, value) }),
  rename: vi.fn(async (source: string, target: string) => { fake.files.set(target, fake.files.get(source)!); fake.files.delete(source) }),
}))
vi.mock('@/lib/data/mongo/client', () => ({ mongoUri: () => null, getDb: vi.fn() }))
import { DraftConflict, listDrafts, saveDraft } from '@/lib/data/editorial'

const input = { id: 'a1993b3d-2fc0-4f8b-9dc4-a47c8df544cf', version: 0, lang: 'es' as const, title: 'Primer texto', description: '', body: 'Contenido', tags: [] }
beforeEach(() => { vi.stubEnv('VERCEL', ''); fake.files.clear(); fake.failWrite = false })

it('persiste y detecta conflictos sin sobreescribir la versión más reciente', async () => {
  const first = await saveDraft(input)
  const second = await saveDraft({ ...first, title: 'Segundo texto' })
  expect(second.version).toBe(2)
  await expect(saveDraft({ ...first, title: 'Texto obsoleto' })).rejects.toBeInstanceOf(DraftConflict)
  expect((await listDrafts())[0]?.title).toBe('Segundo texto')
})

it('un fallo de escritura conserva el borrador guardado', async () => {
  const first = await saveDraft(input)
  fake.failWrite = true
  await expect(saveDraft({ ...first, title: 'Cambio' })).rejects.toThrow('disk unavailable')
  expect((await listDrafts())[0]?.title).toBe('Primer texto')
})

it('no simula persistencia local en Vercel sin base configurada', async () => {
  vi.stubEnv('VERCEL', '1')
  await expect(saveDraft(input)).rejects.toThrow('EditorialUnavailable')
})
