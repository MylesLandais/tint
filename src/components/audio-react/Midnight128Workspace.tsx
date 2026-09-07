import { useEffect, useMemo, useSyncExternalStore } from 'react'
import type { AudioBufferRegistry } from '../audio-engine/AudioBufferRegistry'
import { bindDJSetTransitions } from '../audio-engine/AudioBufferRegistry'
import type { AudioEngineStore } from '../audio-engine/store'
import type { TrackImportStore } from '../audio-engine/trackImportStore'
import { TransitionAuditionControls } from '../dj/TransitionAuditionControls'
import { compileTransition } from '../dj/transitionCompiler'
import { createMidnight128Set } from '../dj/midnight128'
import { TrackImportController } from './TrackImportController'

export type Midnight128WorkspaceProps = {
  importOpen: boolean
  importStore: TrackImportStore
  registry: AudioBufferRegistry
  engineStore: AudioEngineStore
  onCloseImport: () => void
}

export function Midnight128Workspace({
  importOpen,
  importStore,
  registry,
  engineStore,
  onCloseImport,
}: Midnight128WorkspaceProps) {
  const importSnapshot = useSyncExternalStore(
    importStore.subscribe,
    importStore.getSnapshot,
    importStore.getSnapshot,
  )
  const engineSnapshot = useSyncExternalStore(
    engineStore.subscribe,
    engineStore.getSnapshot,
    engineStore.getSnapshot,
  )
  const document = useMemo(() => {
    if (importSnapshot.state !== 'ready') return undefined
    return createMidnight128Set(importSnapshot.items.map((item) => ({
      trackId: item.id,
      durationSeconds: item.durationSeconds ?? Number.NaN,
    })))
  }, [importSnapshot])

  useEffect(() => {
    if (document) bindDJSetTransitions(registry, document.transitions)
  }, [document, registry])

  return (
    <section aria-label="Midnight 128 demo workspace" className="space-y-6">
      <TrackImportController
        open={importOpen}
        store={importStore}
        onClose={onCloseImport}
      />
      {document && (
        <div className="space-y-5 rounded-xl border border-tint-border bg-tint-panel p-5">
          <header>
            <p className="text-sm font-medium text-tint-accent">Reference DJ set</p>
            <h2 className="text-2xl font-semibold">{document.title}</h2>
            <p className="text-sm text-tint-muted">{document.description}</p>
            <p className="mt-2 text-sm">128 BPM · 3A · <span>16:06</span></p>
          </header>
          <ol aria-label="Set tracks" className="space-y-2">
            {document.tracks.map((track) => (
              <li key={track.id} className="rounded-md border border-tint-border p-3">
                <span className="font-medium">{track.title}</span>
                <span className="ml-2 text-sm text-tint-muted">{formatDuration(track.durationSeconds)}</span>
              </li>
            ))}
          </ol>
          <div className="space-y-3" aria-label="Automatic transitions">
            {document.transitions.map((transition) => {
              const active = engineSnapshot.activeTransitionId === transition.id
              const state = engineSnapshot.auditionState === 'unavailable'
                ? 'unavailable'
                : active ? engineSnapshot.auditionState : 'idle'
              return (
                <article key={transition.id} className="rounded-md border border-tint-border p-3">
                  <h3 className="font-semibold">{transition.fromTrackId} → {transition.toTrackId}</h3>
                  <p className="mb-3 text-sm text-tint-muted">
                    {transition.lengthBars} bars · {presetLabel(transition.preset)}
                  </p>
                  <TransitionAuditionControls
                    state={state}
                    error={active ? engineSnapshot.error : undefined}
                    unavailableReason="Web Audio is unavailable in this browser"
                    onAudition={() => { void engineStore.audition(compileTransition(transition)) }}
                    onStop={() => { void engineStore.stop() }}
                  />
                </article>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${Math.round(seconds - minutes * 60).toString().padStart(2, '0')}`
}

function presetLabel(preset: 'long-bass-swap' | 'filter-echo-exit'): string {
  return preset === 'long-bass-swap' ? 'Long bass swap' : 'Filter echo exit'
}
