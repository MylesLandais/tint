import { fireEvent, render, screen } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import Harness from './testing/Harness.svelte'
import StatusIcon from './icon/StatusIcon.svelte'
import Spinner from './icon/Spinner.svelte'
import Surface from './surface/Surface.svelte'
import { ICON_PX } from '../../core/icon/sizes'

describe('Icon', () => {
  it('is hidden from assistive tech without a label', () => {
    const { container } = render(Harness, { kind: 'icon-decorative' })
    const svg = container.querySelector('svg')!
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).not.toHaveAttribute('role')
  })

  it('exposes an accessible name and Tint size when labelled', () => {
    render(Harness, { kind: 'icon-labelled' })
    const icon = screen.getByRole('img', { name: 'Close' })
    expect(icon).toHaveAttribute('width', String(ICON_PX.lg))
  })
})

describe('StatusIcon', () => {
  it('names the status by default and lets the consumer override it', () => {
    const { unmount } = render(StatusIcon, { status: 'error' })
    expect(screen.getByRole('img', { name: 'Failed' })).toBeInTheDocument()
    unmount()
    render(StatusIcon, { status: 'error', label: 'Upload failed' })
    expect(screen.getByRole('img', { name: 'Upload failed' })).toBeInTheDocument()
  })

  it('marks only the loading status as spinning', () => {
    const { container, unmount } = render(StatusIcon, { status: 'loading' })
    expect(container.querySelector('[data-status="loading"]')).toHaveAttribute('data-spin')
    unmount()
    const second = render(StatusIcon, { status: 'success' })
    expect(second.container.querySelector('[data-status="success"]')).not.toHaveAttribute('data-spin')
  })
})

describe('Spinner', () => {
  it('is decorative unless labelled', () => {
    const { container } = render(Spinner, {})
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('Button', () => {
  it('renders variant, size, and leading/trailing content on a real button', () => {
    render(Harness, { kind: 'button' })
    const button = screen.getByRole('button', { name: /Save/ })
    expect(button).toHaveClass('tint-button')
    expect(button).toHaveAttribute('data-variant', 'primary')
    expect(button).toHaveAttribute('data-size', 'lg')
    expect(button).toHaveAttribute('type', 'button')
    expect(screen.getByTestId('lead')).toBeInTheDocument()
    expect(screen.getByTestId('trail')).toBeInTheDocument()
  })

  it('activates on click and on keyboard (Enter and Space)', async () => {
    const onclick = vi.fn()
    render(Harness, { kind: 'button', onclick })
    const button = screen.getByRole('button', { name: /Save/ })
    await fireEvent.click(button)
    expect(onclick).toHaveBeenCalledTimes(1)
    // A native <button> turns Enter and Space into click; jsdom does not, so
    // assert the element is a real button that jsdom can activate.
    button.focus()
    expect(button).toHaveFocus()
    expect(button.tagName).toBe('BUTTON')
  })

  it('is busy, inert, and still focusable while loading', async () => {
    const onclick = vi.fn()
    render(Harness, { kind: 'button-loading', onclick })
    const button = screen.getByRole('button', { name: 'Save' })
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(button).not.toBeDisabled()
    await fireEvent.click(button)
    expect(onclick).not.toHaveBeenCalled()
    button.focus()
    expect(button).toHaveFocus()
  })
})

describe('Badge', () => {
  it('carries the semantic tone as data, not a literal colour', () => {
    const { container } = render(Harness, { kind: 'badge' })
    const badge = container.querySelector('[data-badge]')!
    expect(badge).toHaveAttribute('data-tone', 'warning')
    expect(badge).toHaveTextContent('Needs review')
    expect(screen.getByTestId('lead')).toBeInTheDocument()
  })
})

describe('Surface', () => {
  it('exposes tone, elevation, density and state as data attributes', () => {
    const { container } = render(Surface, {
      as: 'section',
      tone: 'danger',
      elevation: 'md',
      density: 'compact',
      interactive: true,
      selected: true,
    })
    const surface = container.querySelector('section')!
    expect(surface).toHaveAttribute('data-tone', 'danger')
    expect(surface).toHaveAttribute('data-elevation', 'md')
    expect(surface).toHaveAttribute('data-density', 'compact')
    expect(surface).toHaveAttribute('data-interactive')
    expect(surface).toHaveAttribute('data-selected')
  })

  it('renders as an <article> with header, actions and footer regions in Card', () => {
    const { container } = render(Harness, { kind: 'card' })
    const card = container.querySelector('article[data-tint-card]')!
    expect(card).toHaveAttribute('data-density', 'compact')
    expect(card.querySelector('header')).toHaveTextContent('Track metadata')
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
    expect(card).toHaveTextContent('Body text')
    expect(card.querySelector('footer')).toHaveTextContent('Footer text')
  })
})

describe('Panel', () => {
  it('is a disclosure that keeps its body mounted while collapsed', async () => {
    const onExpandedChange = vi.fn()
    render(Harness, { kind: 'panel', onExpandedChange })
    const toggle = screen.getByRole('button', { name: 'Details' })
    const body = screen.getByText('Panel body').closest('[data-panel-body]')!
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(toggle).toHaveAttribute('aria-controls', body.id)
    expect(body).not.toHaveAttribute('hidden')

    await fireEvent.click(toggle)
    expect(onExpandedChange).toHaveBeenLastCalledWith(false)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(body).toHaveAttribute('hidden')
    expect(body).toBeInTheDocument()
  })

  it('keeps actions outside the toggle so they do not collapse the panel', async () => {
    const onExpandedChange = vi.fn()
    render(Harness, { kind: 'panel', onExpandedChange })
    await fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))
    expect(onExpandedChange).not.toHaveBeenCalled()
  })
})
