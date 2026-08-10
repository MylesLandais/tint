import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { SettingsPopout, type SettingsPopoutItem } from './SettingsPopout'

/**
 * A 300-line keyboard-driven dialog that shipped with no tests, and carried two
 * defects because of it: the open-highlight indexed the wrong list once items
 * were grouped, and it claimed `aria-modal` without trapping focus.
 */
const ITEMS: SettingsPopoutItem[] = [
  { id: 'speed-0.5', label: '0.5x', group: 'Playback speed' },
  { id: 'speed-1', label: '1x', group: 'Playback speed' },
  { id: 'quality-auto', label: 'Auto', group: 'Quality', description: 'Adaptive bitrate' },
  // Ungrouped items are moved to the end during grouping, which is exactly
  // where the old `items`-based index went wrong.
  { id: 'captions', label: 'Captions' },
]

function open(props: Partial<Parameters<typeof SettingsPopout>[0]> = {}) {
  const onSelect = vi.fn()
  const onOpenChange = vi.fn()
  render(
    <SettingsPopout
      isOpen
      onOpenChange={onOpenChange}
      items={ITEMS}
      onSelect={onSelect}
      label="Player settings"
      {...props}
    />,
  )
  return { onSelect, onOpenChange, input: screen.getByRole('combobox', { hidden: true }) }
}

describe('SettingsPopout', () => {
  it('renders grouped options under their headings', () => {
    open()
    expect(screen.getByRole('dialog', { name: 'Player settings' })).toBeInTheDocument()
    expect(screen.getByText('Playback speed')).toBeInTheDocument()
    expect(screen.getAllByRole('option')).toHaveLength(ITEMS.length)
  })

  it('does not claim to be modal, because it does not trap focus', () => {
    open()
    // `aria-modal` would tell a screen reader the rest of the page is inert
    // while Tab walks straight out of the popout.
    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-modal')
  })

  it('highlights the selected item using the grouped order, not the raw item order', () => {
    // Grouping moves ungrouped entries to the end, so with an ungrouped item
    // first the two orders genuinely diverge:
    //   items: [captions, speed-0.5, speed-1]
    //   flat:  [speed-0.5, speed-1, captions]
    // Indexing `items` for 'speed-0.5' yields 1, which points at 'speed-1' in
    // the rendered list — the wrong row highlighted, and Enter selecting it.
    const reordered: SettingsPopoutItem[] = [
      { id: 'captions', label: 'Captions' },
      { id: 'speed-0.5', label: '0.5x', group: 'Playback speed' },
      { id: 'speed-1', label: '1x', group: 'Playback speed' },
    ]
    const onSelect = vi.fn()
    render(
      <SettingsPopout
        isOpen
        onOpenChange={vi.fn()}
        items={reordered}
        value="speed-0.5"
        onSelect={onSelect}
      />,
    )

    const input = screen.getByRole('combobox')
    expect(input).toHaveAttribute(
      'aria-activedescendant',
      expect.stringContaining('speed-0.5'),
    )

    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSelect).toHaveBeenCalledWith('speed-0.5')
  })

  it('selects the highlighted item on Enter', () => {
    const { input, onSelect, onOpenChange } = open({ value: 'quality-auto' })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSelect).toHaveBeenCalledWith('quality-auto')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('moves the cursor with arrows and wraps at the ends', () => {
    const { input } = open({ value: 'speed-0.5' })
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(input).toHaveAttribute('aria-activedescendant', expect.stringContaining('speed-1'))

    fireEvent.keyDown(input, { key: 'ArrowUp' })
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    // Wrapped past the top, onto the last entry.
    expect(input).toHaveAttribute('aria-activedescendant', expect.stringContaining('captions'))
  })

  it('jumps to the ends with Home and End', () => {
    const { input } = open({ value: 'speed-1' })
    fireEvent.keyDown(input, { key: 'End' })
    expect(input).toHaveAttribute('aria-activedescendant', expect.stringContaining('captions'))
    fireEvent.keyDown(input, { key: 'Home' })
    expect(input).toHaveAttribute('aria-activedescendant', expect.stringContaining('speed-0.5'))
  })

  it('filters on label and on the unrendered description', () => {
    const { input } = open()
    fireEvent.change(input, { target: { value: 'bitrate' } })
    expect(screen.getAllByRole('option')).toHaveLength(1)
    expect(screen.getByRole('option', { name: /Auto/ })).toBeInTheDocument()
  })

  it('shows the empty state when nothing matches', () => {
    const { input } = open({ emptySearchText: 'Nothing here' })
    fireEvent.change(input, { target: { value: 'zzzz' } })
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
    expect(screen.queryAllByRole('option')).toHaveLength(0)
  })

  it('closes on Escape', () => {
    const { onOpenChange } = open()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('closes on an outside click but not an inside one', () => {
    const { onOpenChange } = open()
    fireEvent.mouseDown(screen.getByRole('dialog'))
    expect(onOpenChange).not.toHaveBeenCalled()

    fireEvent.mouseDown(document.body)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

describe('SettingsPopout focus', () => {
  /** A trigger plus the popout, wired the way a real call site is. */
  function Harness() {
    const [isOpen, setIsOpen] = useState(false)
    return (
      <div className="relative">
        <button type="button" onClick={() => setIsOpen(true)}>
          Open settings
        </button>
        <SettingsPopout
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          items={ITEMS}
          onSelect={() => {}}
        />
      </div>
    )
  }

  it('returns focus to the trigger on Escape', async () => {
    render(<Harness />)
    const trigger = screen.getByRole('button', { name: 'Open settings' })
    trigger.focus()
    fireEvent.click(trigger)

    expect(await screen.findByRole('dialog')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    // Previously focus was left wherever it happened to be — usually <body>.
    expect(document.activeElement).toBe(trigger)
  })
})
