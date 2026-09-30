import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { tick } from 'svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Harness from './InteractionHarness.svelte'
import Tabs from '../tabs/Tabs.svelte'
import Dialog from '../dialog/Dialog.svelte'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function stubResizeObserver() {
  const instances: Array<{
    observed: Element[]
    fire: () => void
    disconnect: ReturnType<typeof vi.fn>
  }> = []
  class ResizeObserverStub {
    observed: Element[] = []
    disconnect = vi.fn()
    callback: ResizeObserverCallback
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback
      instances.push({ observed: this.observed, fire: () => this.callback([], this as unknown as ResizeObserver), disconnect: this.disconnect })
    }
    observe(element: Element) { this.observed.push(element) }
    unobserve() {}
  }
  vi.stubGlobal('ResizeObserver', ResizeObserverStub)
  return instances
}

describe('Menu', () => {
  it('passes controlled trigger attributes and reports opening intent', async () => {
    const onOpenChange = vi.fn()
    render(Harness, { kind: 'menu', open: false, onOpenChange })
    const trigger = screen.getByRole('button', { name: 'Actions' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await fireEvent.click(trigger)
    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('keeps state controlled and navigates around disabled items', async () => {
    const onOpenChange = vi.fn()
    const onSelect = vi.fn()
    render(Harness, { kind: 'menu', open: true, onOpenChange, onSelect })
    await tick()
    const trigger = screen.getByRole('button', { name: 'Actions' })
    const menu = screen.getByRole('menu', { name: 'Actions menu' })
    const archive = screen.getByRole('menuitem', { name: 'Archive' })
    const deleteItem = screen.getByRole('menuitem', { name: 'Delete' })
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(trigger).toHaveAttribute('aria-controls', menu.id)
    expect(archive).toHaveFocus()
    await fireEvent.keyDown(archive, { key: 'ArrowDown' })
    expect(deleteItem).toHaveFocus()
    await fireEvent.click(deleteItem)
    expect(onSelect).toHaveBeenCalledOnce()
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(trigger).toHaveFocus()
    expect(menu).toBeInTheDocument()
  })

  it('reports Escape and restores focus to the trigger', async () => {
    const onOpenChange = vi.fn()
    render(Harness, { kind: 'menu', open: true, onOpenChange })
    await tick()
    await fireEvent.keyDown(document, { key: 'Escape' })
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(screen.getByRole('button', { name: 'Actions' })).toHaveFocus()
  })

  it('repositions when the trigger or menu resizes and disconnects on unmount', async () => {
    const observers = stubResizeObserver()
    const view = render(Harness, { kind: 'menu', open: true, onOpenChange: vi.fn() })
    const trigger = screen.getByRole('button', { name: 'Actions' })
    const menu = screen.getByRole('menu')
    let triggerTop = 20
    vi.spyOn(trigger, 'getBoundingClientRect').mockImplementation(() => new DOMRect(40, triggerTop, 60, 30))
    vi.spyOn(menu, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 30, 20))
    await waitFor(() => expect(observers.some((observer) => observer.observed.includes(trigger) && observer.observed.includes(menu))).toBe(true))
    const observer = observers.find((instance) => instance.observed.includes(menu))!
    observer.fire()
    await tick()
    expect(menu.style.top).toBe('56px')
    triggerTop = 75
    observer.fire()
    await tick()
    expect(menu.style.top).toBe('111px')
    view.unmount()
    expect(observer.disconnect).toHaveBeenCalledOnce()
  })
})

describe('Popover', () => {
  it('announces title and description and requests close on Escape', async () => {
    const onOpenChange = vi.fn()
    render(Harness, { kind: 'popover', open: true, onOpenChange })
    await tick()
    const trigger = screen.getByRole('button', { name: 'Show details' })
    const dialog = screen.getByRole('dialog', { name: 'Details' })
    expect(trigger).toHaveAttribute('aria-controls', dialog.id)
    expect(dialog).toHaveAccessibleDescription('More information')
    expect(screen.getByRole('button', { name: 'Inside' })).toHaveFocus()
    await fireEvent.keyDown(document, { key: 'Escape' })
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(trigger).toHaveFocus()
    expect(dialog).toBeInTheDocument()
  })

  it('uses Carbon outside-click dismissal without taking ownership of open', async () => {
    const onOpenChange = vi.fn()
    render(Harness, { kind: 'popover', open: true, onOpenChange })
    // Carbon installs its shared outside-click listener in the next task.
    await new Promise((resolve) => setTimeout(resolve, 0))
    await fireEvent.click(document.body)
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(screen.getByRole('dialog', { name: 'Details' })).toBeInTheDocument()
  })

  it('requests close when Tab moves focus outside and leaves the new target focused', async () => {
    const onOpenChange = vi.fn()
    const external = document.createElement('button')
    external.textContent = 'After popup'
    document.body.append(external)
    try {
      render(Harness, { kind: 'popover', open: true, onOpenChange })
      await tick()
      const first = screen.getByRole('button', { name: 'Inside' })
      const second = screen.getByRole('button', { name: 'Also inside' })
      await fireEvent.keyDown(first, { key: 'Tab' })
      second.focus()
      expect(onOpenChange).not.toHaveBeenCalled()
      await fireEvent.keyDown(second, { key: 'Tab' })
      external.focus()
      expect(onOpenChange).toHaveBeenCalledWith(false)
      expect(external).toHaveFocus()
      expect(screen.getByRole('dialog', { name: 'Details' })).toBeInTheDocument()
    } finally {
      external.remove()
    }
  })

  it('repositions after trigger and panel resize notifications', async () => {
    const observers = stubResizeObserver()
    render(Harness, { kind: 'popover', open: true, onOpenChange: vi.fn() })
    const trigger = screen.getByRole('button', { name: 'Show details' })
    const panel = screen.getByRole('dialog', { name: 'Details' })
    let panelHeight = 20
    vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue(new DOMRect(10, window.innerHeight - 60, 60, 20))
    vi.spyOn(panel, 'getBoundingClientRect').mockImplementation(() => new DOMRect(0, 0, 100, panelHeight))
    await waitFor(() => expect(observers.some((observer) => observer.observed.includes(trigger) && observer.observed.includes(panel))).toBe(true))
    const observer = observers.find((instance) => instance.observed.includes(panel))!
    observer.fire()
    await tick()
    expect(panel.style.top).toBe(`${window.innerHeight - 32}px`)
    panelHeight = 80
    observer.fire()
    await tick()
    expect(panel.style.top).toBe(`${window.innerHeight - 148}px`)
    expect(observer.observed).toContain(panel)
  })
})

describe('Tabs', () => {
  it('reports keyboard selection, skips disabled tabs and links each panel', async () => {
    const onValueChange = vi.fn()
    render(Tabs, {
      value: 'one', onValueChange, label: 'Views',
      tabs: [
        { id: 'one', label: 'One', content: 'First' },
        { id: 'two', label: 'Two', content: 'Second', disabled: true },
        { id: 'three', label: 'Three', content: 'Third' },
      ],
    })
    await tick()
    const one = screen.getByRole('tab', { name: 'One' })
    const three = screen.getByRole('tab', { name: 'Three' })
    expect(screen.getByRole('tablist', { name: 'Views' })).toBeInTheDocument()
    expect(one).toHaveAttribute('aria-selected', 'true')
    expect(document.getElementById(one.getAttribute('aria-controls')!)).toHaveTextContent('First')
    await fireEvent.keyDown(one, { key: 'ArrowRight' })
    expect(three).toHaveFocus()
    expect(onValueChange).toHaveBeenCalledWith('three')
    expect(one).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Third')).not.toBeVisible()
  })
})

describe('Dialog', () => {
  it('uses Carbon focus handling while keeping close controlled', async () => {
    const onOpenChange = vi.fn()
    render(Harness, { kind: 'dialog', open: true, onOpenChange, placement: 'right' })
    await tick()
    const dialog = screen.getByRole('dialog', { name: 'Add item' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(document.querySelector('[data-placement="right"]')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Inside dialog' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(dialog).toBeInTheDocument()
  })

  it('reports Escape while remaining mounted until the host closes it', async () => {
    const onOpenChange = vi.fn()
    render(Harness, { kind: 'dialog', open: true, onOpenChange })
    const dialog = screen.getByRole('dialog', { name: 'Add item' })
    await fireEvent.keyDown(dialog, { key: 'Escape' })
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(dialog).toBeInTheDocument()
  })

  it('keeps body scroll locked until the last dialog closes', () => {
    const original = document.body.style.overflow
    const lower = render(Dialog, { open: true, title: 'Lower', onOpenChange: vi.fn() })
    const upper = render(Dialog, { open: true, title: 'Upper', onOpenChange: vi.fn() })
    expect(document.body.style.overflow).toBe('hidden')
    lower.unmount()
    expect(document.body.style.overflow).toBe('hidden')
    upper.unmount()
    expect(document.body.style.overflow).toBe(original)
  })

  it('forwards safe panel attributes and links the visible description', async () => {
    render(Dialog, {
      open: true,
      title: 'Profile',
      description: 'Edit the profile',
      onOpenChange: vi.fn(),
      id: 'profile-dialog',
      dir: 'ltr',
      lang: 'en',
      tabindex: -1,
      'data-testid': 'profile-panel',
      'aria-description': 'Account settings',
      style: '--custom-dialog-color: red',
    })
    await tick()
    const dialog = screen.getByRole('dialog', { name: 'Profile' })
    expect(dialog).toHaveAttribute('id', 'profile-dialog')
    expect(dialog).toHaveAttribute('dir', 'ltr')
    expect(dialog).toHaveAttribute('lang', 'en')
    expect(dialog).toHaveAttribute('tabindex', '-1')
    expect(dialog).toHaveAttribute('data-testid', 'profile-panel')
    expect(dialog).toHaveAttribute('aria-description', 'Account settings')
    expect(dialog.getAttribute('style')).toContain('--custom-dialog-color: red')
    expect(dialog).toHaveAttribute('aria-describedby', screen.getByText('Edit the profile').id)
  })
})
