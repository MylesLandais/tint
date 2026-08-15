import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HomeDoc } from './HomeDoc'
import { DOC_PAGES } from './pages'
import { DOC_ROUTES, findRoute, pathFromHash } from './routes'
import { DocsShell } from './shell/DocsShell'

/**
 * These cover the defect this module was built to fix: the Editor and Terminal
 * demos existed and were routed, but nothing linked to them, so the only way to
 * reach either was to hand-type its URL hash.
 */
describe('docs routing', () => {
  it('gives every route a page component', () => {
    for (const route of DOC_ROUTES) {
      expect(DOC_PAGES[route.path], `no page registered for ${route.path}`).toBeDefined()
    }
  })

  it('resolves every route path', () => {
    for (const route of DOC_ROUTES) {
      expect(findRoute(route.path)).toBe(route)
    }
  })

  it('keeps the retired music-library path pointing at the table page', () => {
    expect(findRoute('components/music-library')?.path).toBe('components/table')
  })

  it('does not resolve an unknown path', () => {
    expect(findRoute('nope')).toBeUndefined()
  })

  it('strips hash query strings so deep links still resolve', () => {
    expect(pathFromHash('#/components/chat?scenario=group')).toBe('components/chat')
    expect(findRoute(pathFromHash('#/components/chat?scenario=group'))?.path).toBe(
      'components/chat',
    )
  })

  it('never lets an alias shadow a real path', () => {
    const paths = new Set(DOC_ROUTES.map((route) => route.path))
    for (const route of DOC_ROUTES) {
      for (const alias of route.aliases ?? []) {
        expect(paths, `${alias} is both an alias and a live route`).not.toContain(alias)
      }
    }
  })
})

describe('HomeDoc', () => {
  it('links to every documented component', () => {
    render(<HomeDoc />)
    const hrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href'))

    for (const route of DOC_ROUTES) {
      expect(hrefs, `no card links to ${route.path}`).toContain(`#/${route.path}`)
    }
  })

  it('names each component on its card', () => {
    render(<HomeDoc />)

    for (const route of DOC_ROUTES) {
      expect(screen.getByText(route.blurb)).toBeInTheDocument()
    }
  })
})

describe('DocsShell', () => {
  beforeEach(() => {
    window.location.hash = '#/components/editor'
  })

  it('links every documented component from the sidebar', () => {
    render(<DocsShell current="components/editor">content</DocsShell>)
    const nav = screen.getByRole('navigation', { name: 'Documentation' })
    const hrefs = Array.from(nav.querySelectorAll('a')).map((link) => link.getAttribute('href'))

    for (const route of DOC_ROUTES) {
      expect(hrefs, `sidebar missing ${route.path}`).toContain(`#/${route.path}`)
    }
  })

  it('always offers a route back to the index', () => {
    render(<DocsShell current="components/terminal">content</DocsShell>)
    expect(screen.getByRole('link', { name: /tint/i })).toHaveAttribute('href', '#/')
  })

  it('marks the current page in the sidebar', () => {
    render(<DocsShell current="components/editor">content</DocsShell>)
    expect(screen.getByRole('link', { name: 'Editor' })).toHaveAttribute('aria-current', 'page')
  })

  it('scrolls to a TOC section without disturbing the route hash', () => {
    const scrollIntoView = vi.fn()
    const section = document.createElement('section')
    section.id = 'usage'
    section.scrollIntoView = scrollIntoView
    document.body.append(section)

    render(<DocsShell current="components/editor">content</DocsShell>)
    screen.getByRole('button', { name: 'Usage' }).click()

    expect(scrollIntoView).toHaveBeenCalled()
    // A plain `href="#usage"` here would blank the route and bounce to the index.
    expect(window.location.hash).toBe('#/components/editor')

    section.remove()
  })
})
