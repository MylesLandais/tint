/** Hash path without `#/`, a query string, or a leftover fragment. */
export const DOC_ROUTE_PATHS_CONTEXT = Symbol('tint.docs.routePaths')

export function pathFromHash(hash: string): string {
  const raw = hash.startsWith('#/') ? hash.slice(2) : hash.startsWith('#') ? hash.slice(1) : hash
  return raw.split(/[?#]/)[0] ?? ''
}
