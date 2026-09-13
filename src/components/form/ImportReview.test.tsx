import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { ImportReview } from './ImportReview'

it('distinguishes preserved files from usable records and delegates the import', () => {
  const onImport = vi.fn()
  const props = { rows: [{ id: 'chats', label: 'Chats', files: 4, ready: 3, errors: 1 }], onImport }
  const view = render(<ImportReview {...props} />)
  expect(screen.getByRole('row', { name: 'Chats 4 3 1' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Import 4 files' }))
  expect(onImport).toHaveBeenCalledOnce()
  view.rerender(<ImportReview {...props} busy />)
  expect(screen.getByRole('button', { name: 'Importing…' })).toBeDisabled()
  view.rerender(<ImportReview {...props} complete />)
  expect(screen.getByRole('status')).toHaveTextContent('Import saved.')
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})

it('prevents empty imports and exposes failures', () => {
  render(<ImportReview rows={[]} onImport={vi.fn()} error="Import failed; nothing was saved." />)
  expect(screen.getByRole('button')).toBeDisabled()
  expect(screen.getByRole('alert')).toHaveTextContent('nothing was saved')
})
