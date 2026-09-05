import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AudioBufferRegistry } from '../audio-engine/AudioBufferRegistry'
import { TrackImportController } from './TrackImportController'
import { createTrackImportStore } from '../audio-engine/trackImportStore'

describe('TrackImportController', () => {
  it('composes visible selection, decoding, and ready states over the external store', async () => {
    const store = createTrackImportStore({
      registry: new AudioBufferRegistry(),
      createDecoder: () => ({
        decodeAudioData: vi.fn(async () => ({ duration: 60 } as AudioBuffer)),
      }),
      identify: (file) => file.name.replace('.wav', ''),
    })
    const track = new File(['audio'], 'house.wav', { type: 'audio/wav' })
    const { container } = render(<TrackImportController open store={store} onClose={vi.fn()} />)

    fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [track] } })
    expect(screen.getAllByText('house.wav')).toHaveLength(2)
    screen.getByRole('button', { name: 'Import tracks' }).click()

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('1 of 1 tracks ready'))
    expect(screen.getByText('1:00')).toBeInTheDocument()
  })
})
