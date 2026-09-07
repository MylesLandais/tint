import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { EventReviewControls, type EventReviewControlsProps } from './EventReviewControls'

const base: EventReviewControlsProps = {
  quickFilters: [{ id: 'all', label: 'All events' }, { id: 'pending', label: 'Pending' }],
  selectedQuickFilterId: 'all', onQuickFilterChange: vi.fn(),
  candidatePeople: [{ id: 'person-a', label: 'Person A' }, { id: 'person-b', label: 'Person B' }],
  selectedCandidatePersonIds: ['external-id'], onCandidatePersonIdsChange: vi.fn(),
}

describe('EventReviewControls', () => {
  it('reports quick-filter intent without changing controlled selection', () => {
    const onQuickFilterChange = vi.fn()
    const { rerender } = render(<EventReviewControls {...base} onQuickFilterChange={onQuickFilterChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Pending' }))
    expect(onQuickFilterChange).toHaveBeenCalledWith('pending')
    expect(screen.getByRole('button', { name: 'All events' })).toHaveAttribute('aria-pressed', 'true')
    rerender(<EventReviewControls {...base} selectedQuickFilterId="pending" />)
    expect(screen.getByRole('button', { name: 'Pending' })).toHaveAttribute('aria-pressed', 'true')
  })
  it('keeps history dates display-only and seeks only media seconds, including zero', () => {
    const onSeek = vi.fn()
    const { rerender } = render(<EventReviewControls {...base} historyDate={{ dateTime: '2026-01-02', label: 'January 2, 2026' }} mediaTimestampSeconds={65.5} onSeek={onSeek} />)
    expect(screen.getByText('January 2, 2026').closest('time')).toHaveAttribute('datetime', '2026-01-02')
    fireEvent.click(screen.getByRole('button', { name: 'Seek to 1:05' }))
    expect(onSeek).toHaveBeenCalledWith(65.5)
    rerender(<EventReviewControls {...base} mediaTimestampSeconds={0} onSeek={onSeek} />)
    fireEvent.click(screen.getByRole('button', { name: 'Seek to 0:00' }))
    expect(onSeek).toHaveBeenLastCalledWith(0)
  })
  it.each([null, undefined, -1, NaN, Infinity])('never seeks unavailable or invalid timestamps: %s', (seconds) => {
    render(<EventReviewControls {...base} mediaTimestampSeconds={seconds} onSeek={vi.fn()} />)
    expect(screen.getByText('Media timestamp unavailable')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /seek/i })).not.toBeInTheDocument()
  })
  it('preserves unknown selected IDs, supports multiple candidates and removal, and never implies approval', () => {
    const onCandidatePersonIdsChange = vi.fn()
    const selected = Object.freeze(['external-id', 'person-b'])
    render(<EventReviewControls {...base} selectedCandidatePersonIds={selected} onCandidatePersonIdsChange={onCandidatePersonIdsChange} />)
    fireEvent.click(screen.getByRole('checkbox', { name: 'Person A' }))
    expect(onCandidatePersonIdsChange).toHaveBeenLastCalledWith(['external-id', 'person-b', 'person-a'])
    expect(screen.getByRole('checkbox', { name: 'Person A' })).not.toBeChecked()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Unknown person (external-id)' }))
    expect(onCandidatePersonIdsChange).toHaveBeenLastCalledWith(['person-b'])
    expect(screen.getByText(/Review required/)).toBeInTheDocument()
    expect(screen.getByText(/Training not approved/)).toBeInTheDocument()
    expect(selected).toEqual(['external-id', 'person-b'])
  })
  it('disables every intent while disabled and handles empty/read-only data', () => {
    render(<EventReviewControls {...base} disabled mediaTimestampSeconds={12} onSeek={vi.fn()} />)
    for (const control of [...screen.getAllByRole('button'), ...screen.getAllByRole('checkbox')]) expect(control).toBeDisabled()
  })
  it('shows empty selection affordances without inventing timestamp or history data', () => {
    render(<EventReviewControls {...base} quickFilters={[]} candidatePeople={[]} selectedCandidatePersonIds={[]} mediaTimestampSeconds={12} />)
    expect(screen.getByText('No candidate people available')).toBeInTheDocument()
    expect(screen.getByText('History date unavailable')).toBeInTheDocument()
    expect(screen.getByText('0:12')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /seek/i })).not.toBeInTheDocument()
  })
})
