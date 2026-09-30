import { describe, expect, it } from 'vitest'
import { LEGACY_DOC_PATHS, SVELTE_DOC_GROUPS, SVELTE_DOC_PAGES, findSvelteDoc } from './routes'
import { pathFromHash } from './routing'

describe('Svelte documentation routes', () => {
  it('registers each page once with a known group and a component', () => {
    const paths = SVELTE_DOC_PAGES.map((page) => page.path)
    expect(new Set(paths).size).toBe(paths.length)
    for (const page of SVELTE_DOC_PAGES) {
      expect(SVELTE_DOC_GROUPS).toContain(page.group)
      expect(page.component).toBeDefined()
      expect(findSvelteDoc(page.path)).toBe(page)
    }
  })

  it('resolves retired React docs bookmarks without shadowing live pages', () => {
    const livePaths = new Set(SVELTE_DOC_PAGES.map((page) => page.path))
    for (const [oldPath, currentPath] of Object.entries(LEGACY_DOC_PATHS)) {
      expect(livePaths.has(oldPath), `${oldPath} now has a live page`).toBe(false)
      expect(findSvelteDoc(oldPath)?.path).toBe(currentPath)
    }
    expect(findSvelteDoc('components/unknown')).toBeUndefined()
  })

  it('keeps query parameters out of hash routes', () => {
    expect(pathFromHash('#/components/chat?scenario=group')).toBe('components/chat')
    expect(pathFromHash('#/components/character-documents#editor')).toBe('components/character-documents')
    expect(pathFromHash('#/')).toBe('')
  })
})
