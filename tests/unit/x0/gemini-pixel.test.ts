import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { pixelate, pixelBody, pixelFromReply, PixelRefused, PIXEL_STYLE } from '@/lib/ai/pixel/generate'
import { nearestPalette, PIXEL_SAMPLE_SRC } from '@/lib/ai/pixel/model'
import { RATE_LIMITS } from '@/lib/security/rate-limit'

const PHOTO = { mimeType: 'image/jpeg', data: 'AAAA' }

const image = (data = 'iVBORw0KGgo=') => ({ candidates: [{ content: { parts: [{ inlineData: { mimeType: 'image/png', data } }] } }] })

describe('Pixélate (022, P1)', () => {
  it('FR-2201: manda la foto con un estilo fijo del servidor y pide solo imagen cuadrada', () => {
    const body = pixelBody(PHOTO, true)
    expect(body.contents[0]!.parts[0]).toEqual({ inlineData: PHOTO })
    expect(body.contents[0]!.parts[1]).toEqual({ text: PIXEL_STYLE })
    expect(PIXEL_STYLE).toMatch(/#25ED9E/)
    expect(PIXEL_STYLE).toMatch(/No text/)
    expect(body.generationConfig).toEqual({ responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '1:1', imageSize: '512' } })
    expect(pixelBody(PHOTO, false).generationConfig.imageConfig).toEqual({ aspectRatio: '1:1' })
    expect(existsSync(join(process.cwd(), 'public', PIXEL_SAMPLE_SRC))).toBe(true)
  })

  it('lee la imagen de la respuesta y trata un rechazo como «no pude», sin mostrar nada', () => {
    expect(pixelFromReply(image('XYZ='))).toEqual({ mimeType: 'image/png', data: 'XYZ=' })
    expect(() => pixelFromReply({ promptFeedback: { blockReason: 'SAFETY' } })).toThrow(PixelRefused)
    expect(() => pixelFromReply({ candidates: [{ finishReason: 'IMAGE_SAFETY', content: { parts: [] } }] })).toThrow(PixelRefused)
    expect(() => pixelFromReply({ candidates: [{ content: { parts: [{ text: 'no' }] } }] })).toThrow(PixelRefused)
  })

  it('P-2202: pide 512 px y, si el modelo no acepta el tamaño, reintenta sin él', async () => {
    const bodies: string[] = []
    const fetcher = (async (_url: unknown, init: RequestInit) => {
      bodies.push(String(init.body))
      if (bodies.length === 1) return new Response(JSON.stringify({ error: { message: 'Invalid value at imageConfig.image_size' } }), { status: 400 })
      return new Response(JSON.stringify(image()))
    }) as unknown as typeof fetch
    const result = await pixelate({ key: 'k', photo: PHOTO }, fetcher)
    expect(result.mimeType).toBe('image/png')
    expect(bodies).toHaveLength(2)
    expect(bodies[1]).not.toContain('imageSize')
    const other = (async () => new Response(JSON.stringify({ error: { message: 'bad photo' } }), { status: 400 })) as unknown as typeof fetch
    await expect(pixelate({ key: 'k', photo: PHOTO }, other)).rejects.toThrow(/400/)
  })

  it('FR-2204: 2 por visitante y 20 al día; el simulador local reduce colores', () => {
    expect(RATE_LIMITS.pixel.limit).toBe(2)
    expect(RATE_LIMITS.pixelDaily.limit).toBe(20)
    expect(nearestPalette(10, 130, 250)).toEqual([0, 128, 255])
  })
})
