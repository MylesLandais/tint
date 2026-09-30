import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'
import CommandPalette from './CommandPalette.svelte'
import LoadingState from './LoadingState.svelte'
import NavRail from './NavRail.svelte'
import ResponsiveNavRail from './ResponsiveNavRail.svelte'
import ShellFixture from './ShellFixture.svelte'
import TopNav from './TopNav.svelte'

afterEach(() => vi.unstubAllGlobals())

describe('Svelte shell', () => {
  it('keeps pane sizes and tab selection controlled while keyboard focus follows tabs', async () => {
    const onSizeChange = vi.fn()
    const onTabChange = vi.fn()
    const view = render(ShellFixture, { size: 200, onSizeChange, activeTab: 'one', onTabChange })
    const layout = document.querySelector('[data-tint-workspace-layout]') as HTMLElement
    expect(layout).toHaveAttribute('data-theme', 'studio')
    expect(layout.style.getPropertyValue('--workspace-navigation-width').trim()).toBe('200px')
    expect(document.querySelector('[data-tint-workspace-body]')?.className).toContain('grid-cols-[var(--workspace-navigation-width)_minmax(0,1fr)_var(--workspace-inspector-width)]')
    expect(screen.getByText('Navigation region')).toBeInTheDocument()
    expect(screen.getByText('Inspector region')).toBeInTheDocument()

    const separator = screen.getByRole('separator', { name: 'Resize workspace' })
    expect(separator).toHaveAttribute('aria-valuenow', '200')
    await fireEvent.keyDown(separator, { key: 'ArrowRight' })
    expect(onSizeChange).toHaveBeenCalledWith(210)
    expect(separator).toHaveAttribute('aria-valuenow', '200')
    await view.rerender({ size: 210, onSizeChange, activeTab: 'one', onTabChange })
    expect(separator).toHaveAttribute('aria-valuenow', '210')

    const firstTab = screen.getByRole('tab', { name: 'One' })
    firstTab.focus()
    await fireEvent.keyDown(firstTab, { key: 'ArrowRight' })
    expect(onTabChange).toHaveBeenCalledWith('two')
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveFocus()
    expect(firstTab).toHaveAttribute('aria-selected', 'true')
    await view.rerender({ size: 210, onSizeChange, activeTab: 'two', onTabChange })
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel', { name: 'Two' })).not.toHaveAttribute('hidden')
  })

  it('marks the active rail link, blocks disabled links, and reports collapse intent', async () => {
    const onNavigate = vi.fn()
    const onCollapsedChange = vi.fn()
    render(NavRail, {
      groups: [{ id: 'main', label: 'Main', items: [
        { id: 'home', label: 'Home', href: '#home' },
        { id: 'locked', label: 'Locked', href: '#locked', disabled: true },
      ] }],
      activeId: 'home', collapsed: true, onNavigate, onCollapsedChange,
    })
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page')
    await fireEvent.click(screen.getByRole('link', { name: 'Locked' }))
    expect(onNavigate).not.toHaveBeenCalled()
    await fireEvent.click(screen.getByRole('link', { name: 'Home' }))
    expect(onNavigate).toHaveBeenCalledWith('home', '#home')
    await fireEvent.click(screen.getByRole('button', { name: 'Expand navigation' }))
    expect(onCollapsedChange).toHaveBeenCalledWith(false)
  })

  it('keeps palette query and open state controlled and skips disabled commands', async () => {
    const onOpenChange = vi.fn()
    const onQueryChange = vi.fn()
    const onSelect = vi.fn()
    const view = render(CommandPalette, {
      open: true, onOpenChange, query: '', onQueryChange, onSelect,
      items: [
        { id: 'open', label: 'Open' },
        { id: 'locked', label: 'Locked', disabled: true },
        { id: 'settings', label: 'Settings' },
      ],
    })
    const input = screen.getByRole('combobox')
    await waitFor(() => expect(input).toHaveFocus())
    await fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(input).toHaveAttribute('aria-activedescendant', expect.stringContaining('settings'))
    await fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSelect).toHaveBeenCalledWith('settings')
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await view.rerender({ open: false, onOpenChange, query: '', onQueryChange, onSelect, items: [] })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('opens overflow navigation and moves focus with arrow keys', async () => {
    const onNavigate = vi.fn()
    render(TopNav, { groups: [{ id: 'main', items: [
      { id: 'home', label: 'Home', href: '#home' },
      { id: 'projects', label: 'Projects', href: '#projects' },
      { id: 'settings', label: 'Settings', href: '#settings' },
    ] }], activeId: 'home', maxVisibleItems: 1, onNavigate })
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page')
    await fireEvent.click(screen.getByRole('button', { name: /More/ }))
    const menu = screen.getByRole('menu')
    expect(screen.getByRole('menuitem', { name: 'Projects' })).toHaveFocus()
    await fireEvent.keyDown(menu, { key: 'ArrowDown' })
    expect(screen.getByRole('menuitem', { name: 'Settings' })).toHaveFocus()
    await fireEvent.keyDown(menu, { key: 'Escape' })
    expect(screen.queryByRole('menu')).toBeNull()
    expect(screen.getByRole('button', { name: /More/ })).toHaveFocus()
  })

  it('closes overflow navigation on Tab and returns focus after a selection', async () => {
    const onNavigate = vi.fn()
    render(TopNav, { groups: [{ id: 'main', items: [
      { id: 'home', label: 'Home', href: '#home' },
      { id: 'projects', label: 'Projects', href: '#projects' },
    ] }], maxVisibleItems: 1, onNavigate })
    const more = screen.getByRole('button', { name: /More/ })
    await fireEvent.click(more)
    await fireEvent.keyDown(screen.getByRole('menu'), { key: 'Tab' })
    expect(screen.queryByRole('menu')).toBeNull()
    await fireEvent.click(more)
    await fireEvent.click(screen.getByRole('menuitem', { name: 'Projects' }))
    expect(onNavigate).toHaveBeenCalledWith('projects', '#projects')
    expect(more).toHaveFocus()
  })

  it('announces visible loading text as a status', () => {
    render(LoadingState, { label: 'Loading releases' })
    expect(screen.getByRole('status')).toHaveTextContent('Loading releases')
  })

  it('uses its container width to switch the rail into a controlled mobile drawer', async () => {
    const callbacks: ResizeObserverCallback[] = []
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: ResizeObserverCallback) { callbacks.push(callback) }
      observe() {}
      disconnect() {}
    })
    const onMobileOpenChange = vi.fn()
    const props = {
      groups: [{ id: 'main', items: [{ id: 'home', label: 'Home', href: '#home' }] }],
      mobileOpen: false, onMobileOpenChange,
    }
    const view = render(ResponsiveNavRail, props)
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
    callbacks[0]?.([{ contentRect: { width: 600 } } as ResizeObserverEntry], {} as ResizeObserver)
    const menuButton = await screen.findByRole('button', { name: 'Menu' })
    await fireEvent.click(menuButton)
    expect(onMobileOpenChange).toHaveBeenCalledWith(true)
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    await view.rerender({ ...props, mobileOpen: true })
    expect(screen.getByRole('dialog', { name: 'Navigation' })).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('link', { name: 'Home' }))
    expect(onMobileOpenChange).toHaveBeenLastCalledWith(false)
  })
})
