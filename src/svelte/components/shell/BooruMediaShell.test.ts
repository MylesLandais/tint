import { fireEvent, render, screen } from '@testing-library/svelte'
import { createRawSnippet } from 'svelte'
import { describe, expect, it, vi } from 'vitest'
import DateScrubber from './DateScrubber.svelte'
import IconButton from './IconButton.svelte'
import ListButton from './ListButton.svelte'
import PropertyList from './PropertyList.svelte'
import QueryField from './QueryField.svelte'
import SectionToggle from './SectionToggle.svelte'
import { ChevronDown } from '@lucide/svelte'

const noop = () => {}

describe('QueryField', () => {
  it('commits a draft token on Enter, merging it into the query', async () => {
    const onchange = vi.fn()
    const ondraftchange = vi.fn()
    render(QueryField, {
      value: 'rating:safe',
      draft: 'wsg',
      hits: [],
      onchange,
      ondraftchange,
    })
    const input = screen.getByRole('combobox')
    await fireEvent.keyDown(input, { key: 'Enter' })
    expect(onchange).toHaveBeenCalledWith('rating:safe wsg')
    expect(ondraftchange).toHaveBeenCalledWith('')
  })

  it('does not duplicate an existing token', async () => {
    const onchange = vi.fn()
    render(QueryField, {
      value: 'rating:safe',
      draft: 'rating:safe',
      hits: [],
      onchange,
      ondraftchange: noop,
    })
    await fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' })
    expect(onchange).not.toHaveBeenCalled()
  })
})

describe('DateScrubber', () => {
  it('jumps to the clicked month and marks the current one', async () => {
    const onjump = vi.fn()
    render(DateScrubber, {
      buckets: [
        { month: '2026-10', count: 10 },
        { month: '2026-11', count: 30 },
      ],
      current: '2026-11',
      onjump,
    })
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(2)
    expect(buttons[1]).toHaveAttribute('aria-current', 'true')
    expect(buttons[0]).not.toHaveAttribute('aria-current')
    await fireEvent.click(buttons[1])
    expect(onjump).toHaveBeenCalledWith('2026-11')
  })
})

describe('PropertyList', () => {
  it('renders only rows with a value, monospacing those flagged mono', () => {
    render(PropertyList, {
      rows: [
        { label: 'From', value: 'imageboard' },
        { label: 'Board', value: '/wsg/', mono: true },
        { label: 'Thread', value: null },
      ],
    })
    expect(screen.getByText('From')).toBeInTheDocument()
    expect(screen.getByText('/wsg/')).toBeInTheDocument()
    expect(screen.queryByText('Thread')).not.toBeInTheDocument()
  })
})

describe('SectionToggle', () => {
  it('toggles via aria-expanded and reports clicks', async () => {
    const ontoggle = vi.fn()
    const view = render(SectionToggle, { label: 'Source', expanded: false, ontoggle })
    const toggle = screen.getByRole('button', { name: /source/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await fireEvent.click(toggle)
    expect(ontoggle).toHaveBeenCalledOnce()
    await view.rerender({ label: 'Source', expanded: true, ontoggle })
    expect(screen.getByRole('button', { name: /source/i })).toHaveAttribute('aria-expanded', 'true')
  })
})

describe('IconButton', () => {
  it('renders an accessible icon button and fires on click', async () => {
    const onclick = vi.fn()
    render(IconButton, { icon: ChevronDown, label: 'Toggle tray', onclick })
    const button = screen.getByRole('button', { name: 'Toggle tray' })
    expect(button.querySelector('svg')).not.toBeNull()
    await fireEvent.click(button)
    expect(onclick).toHaveBeenCalledOnce()
  })

  it('exposes pressed state for toggle behaviour', () => {
    render(IconButton, { icon: ChevronDown, label: 'Pinned', pressed: true })
    expect(screen.getByRole('button', { name: 'Pinned' })).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('ListButton', () => {
  it('marks the current row and fires onclick', async () => {
    const onclick = vi.fn()
    render(ListButton, {
      current: true,
      onclick,
      children: createRawSnippet(() => ({
        setup: () => {},
        render: () => 'All media',
      })),
    } as never)
    const button = screen.getByRole('button', { name: /all media/i })
    expect(button.getAttribute('aria-current')).toBe('true')
    await fireEvent.click(button)
    expect(onclick).toHaveBeenCalledOnce()
  })

  it('pressed state reads as aria-pressed', () => {
    render(ListButton, {
      pressed: true,
      onclick: noop,
      children: createRawSnippet(() => ({
        setup: () => {},
        render: () => 'Recent',
      })),
    } as never)
    expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button').getAttribute('aria-current')).toBeNull()
  })
})
