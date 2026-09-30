import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import { createAudioEngineStore } from '../../../core/audio-engine/store'
import type { CompiledTransition } from '../../../core/dj/contracts'
import AudioEngineFixture from './AudioEngineFixture.svelte'

function setup() {
  const startAudition = vi.fn(async (_schedule: CompiledTransition) => {})
  const stopAudition = vi.fn(async () => {})
  const store = createAudioEngineStore({
    capabilities: { webAudio: true, audioWorklet: false, mediaRecorder: false },
    backend: {
      startAudition, stopAudition,
      getDiagnostics: () => ({
        contextState: 'running', scheduledAutomationEvents: 0, beatAlignmentErrorMs: 0,
        peakDbfs: 0, rmsDbfs: 0, droppedWorkletBlocks: 0, invalidParameterValues: 0,
      }),
    },
  })
  return { store, startAudition, stopAudition }
}

describe('Svelte AudioEngineProvider', () => {
  it('exposes a reactive plain-TS store snapshot and delegates commands', async () => {
    const { store, stopAudition } = setup()
    const view = render(AudioEngineFixture, { store })
    expect(screen.getByText('idle')).toBeInTheDocument()
    await store.audition({ transitionId: 'blend' } as CompiledTransition)
    await waitFor(() => expect(screen.getByText('playing')).toBeInTheDocument())
    await fireEvent.click(screen.getByRole('button', { name: 'Stop engine' }))
    await waitFor(() => expect(stopAudition).toHaveBeenCalledOnce())
    await waitFor(() => expect(screen.getByText('idle')).toBeInTheDocument())

    const unavailable = createAudioEngineStore({
      capabilities: { webAudio: false, audioWorklet: false, mediaRecorder: false },
      backend: { startAudition: vi.fn(), stopAudition: vi.fn(), getDiagnostics: store.getDiagnostics },
    })
    await view.rerender({ store: unavailable })
    await waitFor(() => expect(screen.getByText('unavailable')).toBeInTheDocument())
  })
})
