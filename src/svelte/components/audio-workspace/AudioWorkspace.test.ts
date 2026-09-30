import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import { AudioBufferRegistry } from '../../../core/audio-engine/AudioBufferRegistry'
import { createAudioEngineStore } from '../../../core/audio-engine/store'
import { createTrackImportStore } from '../../../core/audio-engine/trackImportStore'
import type { CompiledTransition } from '../../../core/dj/contracts'
import Midnight128Workspace from './Midnight128Workspace.svelte'
import TrackImportController from './TrackImportController.svelte'

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
    createDecoder: () => ({ decodeAudioData: vi.fn(async () => ({ duration: durations.shift() } as AudioBuffer)) }),
    identify: (file) => file.name.replace(/^\d+-/, '').replace(/\.wav$/, ''),
  })
  const startAudition = vi.fn(async (_schedule: CompiledTransition) => {})
  const stopAudition = vi.fn(async () => {})
  const engineStore = createAudioEngineStore({
    capabilities: { webAudio: true, audioWorklet: true, mediaRecorder: true },
    backend: {
      startAudition, stopAudition,
      getDiagnostics: () => ({ contextState: 'running', scheduledAutomationEvents: 0, beatAlignmentErrorMs: 0,
        peakDbfs: 0, rmsDbfs: 0, droppedWorkletBlocks: 0, invalidParameterValues: 0 }),
    },
  })
  return { registry, importStore, engineStore, startAudition, stopAudition }
}

describe('Svelte audio workspace', () => {
  it('binds file selection, decoding, and ready queue to a plain TypeScript import store', async () => {
    const { importStore } = setup()
    const onClose = vi.fn()
    render(TrackImportController, { open: true, store: importStore, onClose })
    expect(screen.getByRole('dialog', { name: 'Import local tracks' })).toBeInTheDocument()
    await fireEvent.change(screen.getByLabelText('Choose audio files'), { target: { files: [files[0]!] } })
    expect(screen.getAllByText('01-here-we-go.wav')).toHaveLength(2)
    await fireEvent.click(screen.getByRole('button', { name: 'Import tracks' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('1 of 1 tracks ready'))
    expect(screen.getByText('5:20')).toBeInTheDocument()
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
  })

  it('requests close when the import is cancelled', async () => {
    const { importStore } = setup()
    const onClose = vi.fn()
    render(TrackImportController, { open: true, store: importStore, onClose })
    await fireEvent.click(screen.getByRole('button', { name: 'Cancel import' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('binds imported tracks and compiles auditions without scheduling in the component', async () => {
    const { registry, importStore, engineStore, startAudition, stopAudition } = setup()
    importStore.selectFiles(files)
    await importStore.importSelected()
    render(Midnight128Workspace, { importOpen: false, importStore, registry, engineStore, onCloseImport: vi.fn() })
    expect(screen.getByRole('heading', { name: 'Midnight 128' })).toBeInTheDocument()
    expect(screen.getByText('16:06')).toBeInTheDocument()
    expect(screen.getByText('32 bars · Long bass swap')).toBeInTheDocument()
    expect(screen.getByText('16 bars · Filter echo exit')).toBeInTheDocument()
    await waitFor(() => expect(registry.resolveTransition('here-we-go--apapacho')).resolves.toBeDefined())
    await fireEvent.click(screen.getAllByRole('button', { name: 'Audition transition' })[0]!)
    await waitFor(() => expect(startAudition).toHaveBeenCalledOnce())
    expect(startAudition.mock.calls[0]![0]).toMatchObject({ transitionId: 'here-we-go--apapacho', durationBeats: 128 })
    expect(screen.getByText('Audition playing')).toBeInTheDocument()
    await fireEvent.click(screen.getAllByRole('button', { name: 'Stop audition' })[0]!)
    await waitFor(() => expect(stopAudition).toHaveBeenCalledOnce())
  })
})
