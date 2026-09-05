import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AudioEngineProvider, useAudioEngine } from './AudioEngineProvider'
import { createAudioEngineStore } from './store'
import type { CompiledTransition } from '../dj/contracts'

const schedule: CompiledTransition = {
  transitionId: 'a--b',
  startBeat: 0,
  endBeat: 64,
  durationBeats: 64,
  durationSeconds: 30,
  effectTailBeats: 0,
  lanes: {},
}

function Probe() {
  const engine = useAudioEngine()
  return (
    <div>
      <span>{engine.snapshot.auditionState}</span>
      <button type="button" onClick={() => void engine.audition(schedule)}>Audition</button>
      <button type="button" onClick={() => void engine.stop()}>Stop</button>
    </div>
  )
}

describe('AudioEngineProvider', () => {
  it('subscribes React to coarse external snapshots and exposes engine intents', async () => {
    const backend = {
      startAudition: vi.fn(async () => undefined),
      stopAudition: vi.fn(async () => undefined),
      getDiagnostics: vi.fn(() => ({
        contextState: 'running' as const,
        scheduledAutomationEvents: 0,
        beatAlignmentErrorMs: 0,
        peakDbfs: -6,
        rmsDbfs: -12,
        droppedWorkletBlocks: 0,
        invalidParameterValues: 0,
      })),
    }
    const store = createAudioEngineStore({
      capabilities: { webAudio: true, audioWorklet: true, mediaRecorder: true },
      backend,
    })
    render(<AudioEngineProvider store={store}><Probe /></AudioEngineProvider>)

    screen.getByRole('button', { name: 'Audition' }).click()
    await waitFor(() => expect(screen.getByText('playing')).toBeInTheDocument())
    expect(backend.startAudition).toHaveBeenCalledWith(schedule)

    screen.getByRole('button', { name: 'Stop' }).click()
    await waitFor(() => expect(screen.getByText('idle')).toBeInTheDocument())
  })

  it('requires an explicit provider instead of a singleton engine', () => {
    expect(() => render(<Probe />)).toThrow(/AudioEngineProvider/)
  })
})
