import { inflateSync } from 'node:zlib'

export type Bitmap = { width: number; height: number; data: Uint8Array }

const SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10]
const CHANNELS: Record<number, number> = { 0: 1, 2: 3, 4: 2, 6: 4 }

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - b)
  const pc = Math.abs(p - c)
  if (pa <= pb && pa <= pc) return a
  return pb <= pc ? b : c
}

export function decodePng(buffer: Buffer): Bitmap {
  if (!SIGNATURE.every((byte, i) => buffer[i] === byte)) throw new Error('no es un PNG')
  let offset = 8
  let width = 0
  let height = 0
  let colorType = 0
  const parts: Buffer[] = []
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset)
    const type = buffer.toString('ascii', offset + 4, offset + 8)
    const body = buffer.subarray(offset + 8, offset + 8 + length)
    if (type === 'IHDR') {
      width = body.readUInt32BE(0)
      height = body.readUInt32BE(4)
      colorType = body[9]
      if (body[8] !== 8 || body[12] !== 0) throw new Error('PNG no soportado: solo 8 bits sin entrelazado')
    } else if (type === 'IDAT') {
      parts.push(body)
    } else if (type === 'IEND') {
      break
    }
    offset += 12 + length
  }

  const channels = CHANNELS[colorType]
  if (!channels) throw new Error(`tipo de color PNG no soportado: ${colorType}`)
  const raw = inflateSync(Buffer.concat(parts))
  const stride = width * channels
  const data = new Uint8Array(width * height * 4)
  let previous = new Uint8Array(stride)
  let line = new Uint8Array(stride)
  let position = 0

  for (let y = 0; y < height; y++) {
    const filter = raw[position++]
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? line[x - channels] : 0
      const b = previous[x]
      const c = x >= channels ? previous[x - channels] : 0
      const value = raw[position + x]
      let decoded = value
      if (filter === 1) decoded = value + a
      else if (filter === 2) decoded = value + b
      else if (filter === 3) decoded = value + ((a + b) >> 1)
      else if (filter === 4) decoded = value + paeth(a, b, c)
      line[x] = decoded & 255
    }
    position += stride

    for (let x = 0; x < width; x++) {
      const source = x * channels
      const target = (y * width + x) * 4
      if (channels >= 3) {
        data[target] = line[source]
        data[target + 1] = line[source + 1]
        data[target + 2] = line[source + 2]
      } else {
        data[target] = data[target + 1] = data[target + 2] = line[source]
      }
      data[target + 3] = channels === 4 ? line[source + 3] : channels === 2 ? line[source + 1] : 255
    }
    ;[previous, line] = [line, previous]
  }

  return { width, height, data }
}
