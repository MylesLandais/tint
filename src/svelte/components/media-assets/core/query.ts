/**
 * Query-token helpers for a szurubooru-style query string. Tokens are
 * whitespace separated; ``-token`` negates. The query string is the single
 * source of truth: tray picks, suggestions and chip removal all edit it.
 */
export type QueryToken = { raw: string; negated: boolean; key: string | null; value: string }

export function parseQuery(query: string): QueryToken[] {
  return query
    .split(/\s+/)
    .filter(Boolean)
    .map((raw) => {
      const negated = raw.startsWith("-")
      const body = negated ? raw.slice(1) : raw
      const colon = body.indexOf(":")
      return colon > 0
        ? { raw, negated, key: body.slice(0, colon), value: body.slice(colon + 1) }
        : { raw, negated, key: null, value: body }
    })
}

export function joinTokens(tokens: readonly string[]): string {
  return tokens.filter(Boolean).join(" ")
}

export function hasToken(query: string, token: string): boolean {
  return parseQuery(query).some((t) => t.raw === token)
}

/** Add the token if absent, otherwise remove it (and its negation). */
export function toggleToken(query: string, token: string): string {
  const tokens = parseQuery(query).map((t) => t.raw)
  const bare = token.replace(/^-/, "")
  if (tokens.includes(token)) return joinTokens(tokens.filter((t) => t !== token))
  return joinTokens([...tokens.filter((t) => t !== bare && t !== `-${bare}`), token])
}

export function removeToken(query: string, index: number): string {
  const tokens = parseQuery(query).map((t) => t.raw)
  tokens.splice(index, 1)
  return joinTokens(tokens)
}

export function negateToken(query: string, index: number): string {
  const tokens = parseQuery(query).map((t) => t.raw)
  const token = tokens[index]
  if (token !== undefined) tokens[index] = token.startsWith("-") ? token.slice(1) : `-${token}`
  return joinTokens(tokens)
}
