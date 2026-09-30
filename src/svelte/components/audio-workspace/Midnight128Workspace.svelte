<script lang="ts">
  import { bindDJSetTransitions } from '../../../core/audio-engine/AudioBufferRegistry'
  import { createMidnight128Set } from '../../../core/dj/midnight128'
  import { compileTransition } from '../../../core/dj/transitionCompiler'
  import { auditionStateForTransition, presetLabel, trackDuration } from '../../../core/dj/view'
  import { observeAudioStore } from '../audio-engine/bindings'
  import TransitionAuditionControls from '../dj/TransitionAuditionControls.svelte'
  import TrackImportController from './TrackImportController.svelte'
  import type { Midnight128WorkspaceProps } from './types'

  let { importOpen, importStore, registry, engineStore, onCloseImport }: Midnight128WorkspaceProps = $props()
  let importObserved = $derived(observeAudioStore(importStore))
  let engineObserved = $derived(observeAudioStore(engineStore))
  let importSnapshot = $derived(importObserved.snapshot)
  let engineSnapshot = $derived(engineObserved.snapshot)
  let document = $derived(importSnapshot.state === 'ready' ? createMidnight128Set(importSnapshot.items.map((item) => ({
    trackId: item.id,
    durationSeconds: item.durationSeconds ?? Number.NaN,
  }))) : undefined)

  $effect(() => { if (document) bindDJSetTransitions(registry, document.transitions) })
</script>

<section aria-label="Midnight 128 demo workspace" class="space-y-6">
  <TrackImportController open={importOpen} store={importStore} onClose={onCloseImport} />
  {#if document}
    <div class="space-y-5 rounded-xl border border-tint-border bg-tint-panel p-5">
      <header>
        <p class="text-sm font-medium text-tint-accent">Reference DJ set</p>
        <h2 class="text-2xl font-semibold">{document.title}</h2>
        <p class="text-sm text-tint-muted">{document.description}</p>
        <p class="mt-2 text-sm">128 BPM · 3A · <span>16:06</span></p>
      </header>
      <ol aria-label="Set tracks" class="space-y-2">
        {#each document.tracks as track (track.id)}
          <li class="rounded-md border border-tint-border p-3">
            <span class="font-medium">{track.title}</span>
            <span class="ml-2 text-sm text-tint-muted">{trackDuration(track.durationSeconds)}</span>
          </li>
        {/each}
      </ol>
      <div class="space-y-3" aria-label="Automatic transitions">
        {#each document.transitions as transition (transition.id)}
          {@const active = engineSnapshot.activeTransitionId === transition.id}
          <article class="rounded-md border border-tint-border p-3">
            <h3 class="font-semibold">{transition.fromTrackId} → {transition.toTrackId}</h3>
            <p class="mb-3 text-sm text-tint-muted">{transition.lengthBars} bars · {presetLabel(transition.preset)}</p>
            <TransitionAuditionControls state={auditionStateForTransition(engineSnapshot, transition.id)}
              error={active ? engineSnapshot.error : undefined}
              unavailableReason="Web Audio is unavailable in this browser"
              onAudition={() => { void engineStore.audition(compileTransition(transition)) }}
              onStop={() => { void engineStore.stop() }} />
          </article>
        {/each}
      </div>
    </div>
  {/if}
</section>
