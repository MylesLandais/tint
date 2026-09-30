import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Breadcrumbs from './Breadcrumbs.svelte'
import CustomLinkFixture from './CustomLinkFixture.svelte'
import NavigationFixture from './NavigationFixture.svelte'
import NavigationList from './NavigationList.svelte'

afterEach(() => vi.unstubAllGlobals())

describe('Svelte navigation', () => {
  it('marks active links, blocks disabled destinations, and reports enabled navigation', async () => {
    const onNavigate = vi.fn()
    render(NavigationList, {
      items: [
        { id: 'home', label: 'Home', href: '#home' },
        { id: 'disabled', label: 'Disabled', href: '#disabled', disabled: true },
      ],
      activeHref: '#home', label: 'Sections', onNavigate,
    })
    expect(screen.getByRole('navigation', { name: 'Sections' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Disabled' })).toHaveAttribute('aria-disabled', 'true')
    await fireEvent.click(screen.getByRole('link', { name: 'Disabled' }))
    expect(onNavigate).not.toHaveBeenCalled()
    await fireEvent.click(screen.getByRole('link', { name: 'Home' }))
    expect(onNavigate).toHaveBeenCalledWith(expect.objectContaining({ id: 'home' }))
  })

  it('renders the last breadcrumb as current text, even when it has a destination', () => {
    render(Breadcrumbs, { items: [
      { id: 'root', label: 'Root', href: '/' },
      { id: 'section', label: 'Section' },
      { id: 'current', label: 'Current', href: '/current' },
    ] })
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(nav.querySelectorAll('a')).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'Root' })).toHaveAttribute('href', '/')
    expect(screen.getByText('Current')).toHaveAttribute('aria-current', 'page')
    expect(screen.queryByRole('link', { name: 'Current' })).toBeNull()
    expect(nav.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2)
  })

  it('passes link content and active state to the custom link renderer', () => {
    render(CustomLinkFixture)
    const link = screen.getByRole('link', { name: 'Home 3' })
    expect(link).toHaveAttribute('data-custom-active', 'true')
    expect(link).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Root' })).toHaveAttribute('data-custom-crumb')
    expect(screen.getByText('Page')).toHaveAttribute('aria-current', 'page')
    expect(screen.queryByRole('link', { name: 'Page' })).toBeNull()
  })

  it('keeps sidebar open state controlled and supports Escape and focus return', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(600)
    const onSidebarOpenChange = vi.fn()
    const view = render(NavigationFixture, { sidebarOpen: false, onSidebarOpenChange })
    const shell = screen.getByTestId('shell')
    await waitFor(() => expect(shell).toHaveAttribute('data-sidebar-presentation', 'overlay'))
    const toggle = screen.getByRole('button', { name: 'Open Navigation' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(shell.querySelector('aside')).toHaveAttribute('aria-hidden', 'true')
    expect(shell.querySelector('a[href="/home"]')).toHaveAttribute('aria-current', 'page')
    await fireEvent.click(toggle)
    expect(onSidebarOpenChange).toHaveBeenCalledWith(true)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await view.rerender({ sidebarOpen: true, onSidebarOpenChange })
    const dialog = screen.getByRole('dialog', { name: 'Navigation' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await waitFor(() => expect(screen.getByRole('link', { name: 'Home' })).toHaveFocus())
    const home = screen.getByRole('link', { name: 'Home' })
    const library = screen.getByRole('link', { name: 'Library' })
    library.focus()
    await fireEvent.keyDown(window, { key: 'Tab' })
    expect(home).toHaveFocus()
    await fireEvent.keyDown(window, { key: 'Tab', shiftKey: true })
    expect(library).toHaveFocus()
    await fireEvent.keyDown(window, { key: 'Escape' })
    expect(onSidebarOpenChange).toHaveBeenLastCalledWith(false)
    await view.rerender({ sidebarOpen: false, onSidebarOpenChange })
    await waitFor(() => expect(toggle).toHaveFocus())
    expect(screen.getByText('Content').closest('main')).not.toHaveAttribute('aria-hidden')
  })

  it('switches the sidebar presentation from its container width', async () => {
    let width = 700
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.hasAttribute('data-tint-app-shell') ? width : 0
    })
    const callbacks: ResizeObserverCallback[] = []
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: ResizeObserverCallback) { callbacks.push(callback) }
      observe() {}
      disconnect() {}
    })
    const onSidebarOpenChange = vi.fn()
    render(NavigationFixture, { sidebarOpen: false, onSidebarOpenChange })
    const shell = screen.getByTestId('shell')
    await waitFor(() => expect(shell).toHaveAttribute('data-sidebar-presentation', 'overlay'))
    width = 1200
    callbacks[0]?.([], {} as ResizeObserver)
    await waitFor(() => expect(shell).toHaveAttribute('data-sidebar-presentation', 'inline'))
    expect(screen.getByRole('complementary', { name: 'Navigation' })).not.toHaveAttribute('aria-hidden')
  })
})
