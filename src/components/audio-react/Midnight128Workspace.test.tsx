import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AudioBufferRegistry } from '../audio-engine/AudioBufferRegistry'
import { createAudioEngineStore } from '../audio-engine/store'
import { createTrackImportStore } from '../audio-engine/trackImportStore'
import type { CompiledTransition } from '../dj/contracts'
import { Midnight128Workspace } from './Midnight128Workspace'

const files = [
  new File(['one'], '01-here-we-go.wav', { type: 'audio/wav' }),
  new File(['two'], '02-apapacho.wav', { type: 'audio/wav' }),
  new File(['three'], '03-trajadao.wav', { type: 'audio/wav' }),
]

function setup() {
  const registry = new AudioBufferRegistry()
  const durations = [320, 391, 345]
  const importStore = createTrackImportStore({
    registry,
    createDecoder: () => ({
      decodeAudioData: vi.fn(async () => ({ duration: durations.shift() } as AudioBuffer)),
    }),
    identify: (file) => file.name.replace(/^\d+-/, '').replace(/\.wav$/, ''),
  })
  const startAudition = vi.fn(async (_schedule: CompiledTransition) => {})
  const engineStore = createAudioEngineStore({
    capabilities: { webAudio: true, audioWorklet: true, mediaRecorder: true },
    backend: {
      startAudition,
      stopAudition: vi.fn(async () => {}),
      getDiagnostics: () => ({
        contextState: 'running', scheduledAutomationEvents: 0, beatAlignmentErrorMs: 0,
        peakDbfs: 0, rmsDbfs: 0, droppedWorkletBlocks: 0, invalidParameterValues: 0,
      }),
    },
  })
  return { registry, importStore, engineStore, startAudition }
}

describe('Midnight128Workspace', () => {
  it('turns a completed visible import into the reference set and transition cards', async () => {
    const { registry, importStore, engineStore } = setup()
    importStore.selectFiles(files)
    await importStore.importSelected()

    render(
      <Midnight128Workspace
        importOpen={false}
        importStore={importStore}
        registry={registry}
        engineStore={engineStore}
        onCloseImport={vi.fn()}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Midnight 128' })).toBeInTheDocument()
    expect(screen.getByText('16:06')).toBeInTheDocument()
    expect(screen.getByText('Michele Mancini — Here We Go')).toBeInTheDocument()
    expect(screen.getByText('32 bars · Long bass swap')).toBeInTheDocument()
    expect(screen.getByText('16 bars · Filter echo exit')).toBeInTheDocument()
    await waitFor(() => expect(registry.resolveTransition('here-we-go--apapacho')).resolves.toBeDefined())
  })

  it('compiles and auditions the selected transition through the injected engine store', async () => {
    const { registry, importStore, engineStore, startAudition } = setup()
    importStore.selectFiles(files)
    await importStore.importSelected()
    render(
      <Midnight128Workspace
        importOpen={false}
        importStore={importStore}
        registry={registry}
        engineStore={engineStore}
        onCloseImport={vi.fn()}
      />,
    )

    screen.getAllByRole('button', { name: 'Audition transition' })[0]!.click()
    await waitFor(() => expect(startAudition).toHaveBeenCalledOnce())
    expect(startAudition.mock.calls[0]![0]).toMatchObject({
      transitionId: 'here-we-go--apapacho',
      durationBeats: 128,
    })
    expect(screen.getByText('Audition playing')).toBeInTheDocument()
  })
})
