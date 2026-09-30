import { fireEvent, render, screen } from '@testing-library/svelte'
import { expect, it, vi } from 'vitest'
import EventReviewControls from './EventReviewControls.svelte'

it('keeps review intents controlled and unknown selected people removable', async () => {
  const onQuickFilterChange = vi.fn()
  const onSeek = vi.fn()
  const onCandidatePersonIdsChange = vi.fn()
  render(EventReviewControls, {
    quickFilters: [{ id: 'recent', label: 'Recent' }],
    selectedQuickFilterId: 'recent', onQuickFilterChange,
    historyDate: { dateTime: '2026-09-30', label: 'September 30' },
    mediaTimestampSeconds: 125.9, onSeek,
    candidatePeople: [{ id: 'known', label: 'Alex' }],
    selectedCandidatePersonIds: ['missing'], onCandidatePersonIdsChange,
  })

  expect(screen.getByText('September 30').closest('time')).toHaveAttribute('datetime', '2026-09-30')
  await fireEvent.click(screen.getByRole('button', { name: 'Recent' }))
  expect(onQuickFilterChange).toHaveBeenCalledWith('recent')
  await fireEvent.click(screen.getByRole('button', { name: 'Seek to 2:05' }))
  expect(onSeek).toHaveBeenCalledWith(125.9)
  await fireEvent.click(screen.getByRole('checkbox', { name: 'Unknown person (missing)' }))
  expect(onCandidatePersonIdsChange).toHaveBeenCalledWith([])
  expect(screen.getByText(/Training not approved/)).toBeInTheDocument()
})
