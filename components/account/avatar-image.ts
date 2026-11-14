import { AVATAR_INPUT_MAX_BYTES, AVATAR_MAX_BYTES, AVATAR_SIZE } from '@/lib/accounts/profile-options'

export type AvatarProblem = 'read' | 'tooBig' | 'tooLarge'

export class AvatarImageError extends Error {
  constructor(readonly problem: AvatarProblem) {
    super(problem)
    this.name = 'AvatarImageError'
  }
}

const QUALITIES = [0.86, 0.76, 0.64, 0.52, 0.4]

const TYPES = ['image/webp', 'image/jpeg'] as const

function encode(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

export async function prepareAvatar(file: Blob): Promise<Blob> {
  if (file.size > AVATAR_INPUT_MAX_BYTES) throw new AvatarImageError('tooBig')
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new AvatarImageError('read')
  }
  const canvas = document.createElement('canvas')
  canvas.width = AVATAR_SIZE
  canvas.height = AVATAR_SIZE
  const context = canvas.getContext('2d')
  if (!context) throw new AvatarImageError('read')
  const side = Math.min(bitmap.width, bitmap.height)
  context.fillStyle = '#000000'
  context.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE)
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE)
  bitmap.close()
  const supported = new Set<string>()
  for (const quality of QUALITIES) {
    for (const type of TYPES) {
      if (supported.size > 0 && !supported.has(type)) continue
      const blob = await encode(canvas, type, quality)
      if (!blob || blob.type !== type) continue
      supported.add(type)
      if (blob.size <= AVATAR_MAX_BYTES) return blob
    }
  }
  throw new AvatarImageError('tooLarge')
}
