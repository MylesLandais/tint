import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Badge } from './Badge'
import { ProgressBar } from '../progress/ProgressBar'
import { Dialog } from '../dialog/Dialog'
import { ContextMenu } from '../context-menu/ContextMenu'
import { TreeView } from '../tree/TreeView'
import { ToastProvider, useToast } from '../toast/Toast'

describe('Badge', () => {
  it('renders tone and label', () => {
    render(<Badge tone="success">seeding</Badge>)
    expect(screen.getByText('seeding').closest('[data-badge]')).toHaveAttribute('data-tone', 'success')
  })
})

describe('ProgressBar', () => {
  it('exposes progressbar semantics', () => {
    render(<ProgressBar value={42} label="Download" showValue />)
    const bar = screen.getByRole('progressbar', { name: 'Download' })
    expect(bar).toHaveAttribute('aria-valuenow', '42')
    expect(screen.getByText('42%')).toBeInTheDocument()
  })
})

describe('Dialog', () => {
  it('opens and closes via Escape', () => {
    const onOpenChange = vi.fn()
    render(
      <Dialog open title="Add torrent" onOpenChange={onOpenChange}>
        body
      </Dialog>,
    )
    expect(screen.getByRole('dialog', { name: 'Add torrent' })).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

describe('ContextMenu', () => {
  it('invokes item select', () => {
    const onSelect = vi.fn()
    const onOpenChange = vi.fn()
    render(
      <ContextMenu
        open
        position={{ x: 10, y: 10 }}
        onOpenChange={onOpenChange}
        items={[{ id: 'start', label: 'Start', onSelect }]}
      />,
    )
    fireEvent.click(screen.getByRole('menuitem', { name: 'Start' }))
    expect(onSelect).toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

describe('TreeView', () => {
  it('expands and selects nodes', () => {
    const onExpandedChange = vi.fn()
    const onSelectedChange = vi.fn()
    render(
      <TreeView
        nodes={[
          {
            id: 'root',
            label: 'Album',
            children: [{ id: 'track', label: '01.flac' }],
          },
        ]}
        expandedIds={[]}
        onExpandedChange={onExpandedChange}
        selectedIds={[]}
        onSelectedChange={onSelectedChange}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Expand' }))
    expect(onExpandedChange).toHaveBeenCalledWith(['root'])
    fireEvent.click(screen.getByRole('checkbox', { name: 'Album' }))
    expect(onSelectedChange).toHaveBeenCalledWith(['root'])
  })
})

function ToastProbe() {
  const { push } = useToast()
  return (
    <button type="button" onClick={() => push({ title: 'Done', tone: 'success', durationMs: 0 })}>
      Notify
    </button>
  )
}

describe('Toast', () => {
  it('pushes a toast into the viewport', () => {
    render(
      <ToastProvider>
        <ToastProbe />
      </ToastProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Notify' }))
    expect(screen.getByRole('status')).toHaveTextContent('Done')
  })
})
