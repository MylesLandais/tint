/**
 * A very small XML reader for CalDAV `multistatus` bodies.
 *
 * `DOMParser` is browser-only and this client has to run in Node too — the
 * usual CalDAV deployment is a server-side proxy, because CalDAV servers rarely
 * send usable CORS headers. Rather than take a dependency or fork behaviour by
 * environment, this walks the handful of element shapes RFC 4791 responses use.
 *
 * Element lookup is by **local name**: servers disagree wildly about prefixes
 * (`d:`, `D:`, `dav:`, none), so matching on the qualified name is a reliable
 * way to break against half of them.
 *
 * This is not a general XML parser. It does not resolve entities beyond the
 * five predefined ones, and it has no opinion about DTDs.
 */

export type XmlNode = {
  /** Lowercased local name, prefix stripped. */
  name: string
  attributes: Record<string, string>
  children: XmlNode[]
  text: string
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
}

export function decodeEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity: string) => {
    if (entity.startsWith('#x') || entity.startsWith('#X')) {
      return String.fromCodePoint(Number.parseInt(entity.slice(2), 16))
    }
    if (entity.startsWith('#')) return String.fromCodePoint(Number.parseInt(entity.slice(1), 10))
    return ENTITIES[entity.toLowerCase()] ?? match
  })
}

export function encodeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function localName(qualified: string): string {
  const colon = qualified.indexOf(':')
  return (colon === -1 ? qualified : qualified.slice(colon + 1)).toLowerCase()
}

function parseAttributes(raw: string): Record<string, string> {
  const attributes: Record<string, string> = {}
  for (const match of raw.matchAll(/([\w:.-]+)\s*=\s*"([^"]*)"|([\w:.-]+)\s*=\s*'([^']*)'/g)) {
    const key = (match[1] ?? match[3])!
    const value = (match[2] ?? match[4])!
    attributes[localName(key)] = decodeEntities(value)
  }
  return attributes
}

/** Parse a document into its root element, or null if there is no element at all. */
export function parseXml(source: string): XmlNode | null {
  // Strip prologue, comments, and CDATA-unaware processing instructions first.
  const text = source
    .replace(/<\?[\s\S]*?\?>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<!DOCTYPE[^>]*>/gi, '')

  const stack: XmlNode[] = []
  let root: XmlNode | null = null
  const tagPattern = /<\s*(\/)?\s*([\w:.-]+)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/)?\s*>/g

  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = tagPattern.exec(text)) !== null) {
    const [, closing, name, rawAttributes, selfClosing] = match

    const between = text.slice(lastIndex, match.index)
    if (stack.length > 0 && between.trim().length > 0) {
      stack[stack.length - 1]!.text += decodeEntities(between)
    }
    lastIndex = tagPattern.lastIndex

    if (closing) {
      const finished = stack.pop()
      if (finished && stack.length === 0) root ??= finished
      continue
    }

    const node: XmlNode = {
      name: localName(name!),
      attributes: parseAttributes(rawAttributes ?? ''),
      children: [],
      text: '',
    }
    if (stack.length > 0) stack[stack.length - 1]!.children.push(node)

    if (selfClosing) {
      if (stack.length === 0) root ??= node
    } else {
      stack.push(node)
    }
  }

  // An unbalanced document still yields whatever was opened first.
  return root ?? stack[0] ?? null
}

/** Every descendant with this local name, depth-first. */
export function findAll(node: XmlNode, name: string): XmlNode[] {
  const wanted = name.toLowerCase()
  const found: XmlNode[] = []
  const visit = (current: XmlNode) => {
    if (current.name === wanted) found.push(current)
    for (const child of current.children) visit(child)
  }
  visit(node)
  return found
}

/** First descendant with this local name. */
export function find(node: XmlNode, name: string): XmlNode | undefined {
  return findAll(node, name)[0]
}

/** Trimmed text of the first descendant with this local name. */
export function textOf(node: XmlNode, name: string): string | undefined {
  const found = find(node, name)
  return found ? found.text.trim() : undefined
}
