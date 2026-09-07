import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AnalysisQueue } from './AnalysisQueue'
import { ImportTracksDialog } from './ImportTracksDialog'

describe('ImportTracksDialog', () => {
  it('reports selected local audio files without owning them', () => {
    const onFilesSelected = vi.fn()
    const onImport = vi.fn()
    const first = new File(['one'], '01-house.wav', { type: 'audio/wav' })
    const second = new File(['two'], '02-techno.mp3', { type: 'audio/mpeg' })
    const { container } = render(
      <ImportTracksDialog
        open
        selectedFiles={[]}
        onFilesSelected={onFilesSelected}
        onImport={onImport}
        onClose={vi.fn()}
      />,
    )

    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!
    expect(input.multiple).toBe(true)
    expect(input.accept).toBe('audio/*,.wav,.mp3,.flac,.m4a,.ogg,.opus')
    fireEvent.change(input, { target: { files: [first, second] } })
    expect(onFilesSelected).toHaveBeenCalledWith([first, second])
    expect(screen.getByRole('button', { name: 'Import tracks' })).toBeDisabled()
  })

  it('renders controlled selection and reports import and close intents', () => {
    const onImport = vi.fn()
    const onClose = vi.fn()
    const file = new File(['one'], '01-house.wav', { type: 'audio/wav' })
    render(
      <ImportTracksDialog
        open
        selectedFiles={[file]}
        onFilesSelected={vi.fn()}
        onImport={onImport}
        onClose={onClose}
      />,
    )

    expect(screen.getByText('01-house.wav')).toBeInTheDocument()
    screen.getByRole('button', { name: 'Import tracks' }).click()
    screen.getByRole('button', { name: 'Cancel import' }).click()
    expect(onImport).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalledOnce()
  })
})

describe('AnalysisQueue', () => {
  it('announces decoding progress and exposes retry only for failed tracks', () => {
    const onRetry = vi.fn()
    render(<AnalysisQueue items={[
      { id: 'one', fileName: 'one.wav', status: 'decoding' },
      { id: 'two', fileName: 'two.wav', status: 'ready', durationSeconds: 60 },
      { id: 'three', fileName: 'three.wav', status: 'error', error: 'Unsupported format' },
    ]} onRetry={onRetry} />)

    expect(screen.getByRole('status')).toHaveTextContent('1 of 3 tracks ready')
    expect(screen.getByText('Decoding')).toBeInTheDocument()
    expect(screen.getByText('1:00')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Unsupported format')
    screen.getByRole('button', { name: 'Retry three.wav' }).click()
    expect(onRetry).toHaveBeenCalledWith('three')
    expect(screen.queryByRole('button', { name: 'Retry one.wav' })).not.toBeInTheDocument()
  })
})
