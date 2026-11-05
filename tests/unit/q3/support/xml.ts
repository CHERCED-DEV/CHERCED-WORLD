export type XmlElement = { name: string; attrs: Record<string, string>; children: XmlNode[] }

export type XmlNode = XmlElement | string

const NAME = /^[A-Za-z_][\w.\-]*(?::[A-Za-z_][\w.\-]*)?/

const ENTITY = /^&(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);/

const INVALID_CHAR = /[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/

const NAMED: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }

const BUILT_IN_PREFIXES = new Set(['xml', 'xmlns'])

export class XmlError extends Error {}

function decode(raw: string, at: number): string {
  let out = ''
  for (let index = 0; index < raw.length; index++) {
    const char = raw[index]
    if (char !== '&') {
      out += char
      continue
    }
    const match = ENTITY.exec(raw.slice(index))
    if (!match) throw new XmlError(`"&" sin escapar en la posición ${at + index}`)
    const body = match[0].slice(1, -1)
    out += body.startsWith('#x')
      ? String.fromCodePoint(Number.parseInt(body.slice(2), 16))
      : body.startsWith('#')
        ? String.fromCodePoint(Number(body.slice(1)))
        : NAMED[body]
    index += match[0].length - 1
  }
  return out
}

function prefixOf(name: string): string | null {
  const colon = name.indexOf(':')
  return colon === -1 ? null : name.slice(0, colon)
}

export function parseXml(source: string): XmlElement {
  if (INVALID_CHAR.test(source)) throw new XmlError('carácter que XML 1.0 no admite')
  let pos = 0

  const fail = (message: string): never => {
    throw new XmlError(`${message} en la posición ${pos}`)
  }
  const skipSpace = () => {
    while (pos < source.length && /\s/.test(source[pos] ?? '')) pos++
  }
  const skipMisc = () => {
    for (;;) {
      skipSpace()
      if (!source.startsWith('<!--', pos)) return
      const end = source.indexOf('-->', pos + 4)
      if (end === -1) fail('comentario sin cerrar')
      pos = end + 3
    }
  }
  const readName = (): string => {
    const match = NAME.exec(source.slice(pos))
    if (!match) return fail('nombre inválido')
    pos += match[0].length
    return match[0]
  }

  const readElement = (scope: ReadonlySet<string>): XmlElement => {
    if (source[pos] !== '<') fail('se esperaba "<"')
    pos++
    const name = readName()
    const attrs: Record<string, string> = {}
    for (;;) {
      const before = pos
      skipSpace()
      if (source.startsWith('/>', pos) || source[pos] === '>') break
      if (pos === before) fail(`falta espacio entre atributos de <${name}>`)
      const attr = readName()
      if (attr in attrs) fail(`atributo repetido "${attr}" en <${name}>`)
      skipSpace()
      if (source[pos] !== '=') fail(`al atributo "${attr}" le falta "="`)
      pos++
      skipSpace()
      const quote = source[pos]
      if (quote !== '"' && quote !== "'") return fail(`el atributo "${attr}" no va entre comillas`)
      const end = source.indexOf(quote, pos + 1)
      if (end === -1) fail(`el atributo "${attr}" no cierra sus comillas`)
      const raw = source.slice(pos + 1, end)
      if (raw.includes('<')) fail(`"<" dentro del atributo "${attr}"`)
      attrs[attr] = decode(raw, pos + 1)
      pos = end + 1
    }
    const declared = new Set(scope)
    for (const attr of Object.keys(attrs)) if (attr.startsWith('xmlns:')) declared.add(attr.slice(6))
    for (const qualified of [name, ...Object.keys(attrs)]) {
      const prefix = prefixOf(qualified)
      if (prefix && !BUILT_IN_PREFIXES.has(prefix) && !declared.has(prefix)) fail(`prefijo "${prefix}" sin declarar`)
    }
    const element: XmlElement = { name, attrs, children: [] }
    if (source.startsWith('/>', pos)) {
      pos += 2
      return element
    }
    pos++
    for (;;) {
      if (pos >= source.length) fail(`<${name}> sin cerrar`)
      if (source.startsWith('</', pos)) {
        pos += 2
        const closing = readName()
        if (closing !== name) fail(`</${closing}> cierra a <${name}>`)
        skipSpace()
        if (source[pos] !== '>') fail(`</${closing}> mal cerrado`)
        pos++
        return element
      }
      if (source.startsWith('<!--', pos)) {
        const end = source.indexOf('-->', pos + 4)
        if (end === -1) fail('comentario sin cerrar')
        pos = end + 3
        continue
      }
      if (source.startsWith('<![CDATA[', pos)) {
        const end = source.indexOf(']]>', pos + 9)
        if (end === -1) fail('CDATA sin cerrar')
        element.children.push(source.slice(pos + 9, end))
        pos = end + 3
        continue
      }
      if (source[pos] === '<') {
        element.children.push(readElement(declared))
        continue
      }
      const next = source.indexOf('<', pos)
      const raw = source.slice(pos, next === -1 ? source.length : next)
      if (raw.includes(']]>')) fail('"]]>" en el texto')
      element.children.push(decode(raw, pos))
      pos += raw.length
    }
  }

  if (source.startsWith('<?xml')) {
    const end = source.indexOf('?>')
    if (end === -1) fail('declaración XML sin cerrar')
    const declaration = source.slice(0, end)
    if (!/^<\?xml\s+version="1\.[0-9]"(\s+encoding="[A-Za-z][\w.\-]*")?(\s+standalone="(yes|no)")?\s*$/.test(declaration)) {
      fail('declaración XML inválida')
    }
    pos = end + 2
  }
  skipMisc()
  const root = readElement(new Set())
  skipMisc()
  if (pos !== source.length) fail('contenido después del elemento raíz')
  return root
}

export function elements(node: XmlElement, name?: string): XmlElement[] {
  return node.children.filter((child): child is XmlElement => typeof child !== 'string' && (name === undefined || child.name === name))
}

export function only(node: XmlElement, name: string): XmlElement {
  const found = elements(node, name)
  if (found.length !== 1) throw new XmlError(`<${node.name}> tiene ${found.length} <${name}>, no 1`)
  return found[0] as XmlElement
}

export function text(node: XmlElement): string {
  return node.children.map((child) => (typeof child === 'string' ? child : text(child))).join('')
}

export function textNodes(node: XmlElement): string[] {
  return node.children.flatMap((child) => (typeof child === 'string' ? (child.trim() ? [child] : []) : textNodes(child)))
}
