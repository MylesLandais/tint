import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DocsNav } from './components/DocsNav'
import { HomeDoc } from './HomeDoc'
import { DOC_PAGES } from './pages'
import { DOC_ROUTES, findRoute, pathFromHash } from './routes'

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

describe('DocsNav', () => {
  beforeEach(() => {
    window.location.hash = '#/components/editor'
  })

  it('shows the current page in the breadcrumb', () => {
    render(<DocsNav current="components/editor" />)
    expect(screen.getByText('Editor')).toBeInTheDocument()
  })

  it('always offers a route back to the index', () => {
    render(<DocsNav current="components/terminal" />)
    expect(screen.getByRole('link', { name: /tint/i })).toHaveAttribute('href', '#/')
  })

  it('scrolls to a section without disturbing the route hash', () => {
    const scrollIntoView = vi.fn()
    const section = document.createElement('section')
    section.id = 'usage'
    section.scrollIntoView = scrollIntoView
    document.body.append(section)

    render(<DocsNav current="components/editor" />)
    screen.getByRole('button', { name: 'Usage' }).click()

    expect(scrollIntoView).toHaveBeenCalled()
    // A plain `href="#usage"` here would blank the route and bounce to the index.
    expect(window.location.hash).toBe('#/components/editor')

    section.remove()
  })
})
