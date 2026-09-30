<script lang="ts">
  import type { TransitionAuditionControlsProps } from './types'

  let { state, onAudition, onStop, unavailableReason, error, class: className }: TransitionAuditionControlsProps = $props()
  let status = $derived(state === 'unavailable'
    ? unavailableReason ?? 'Transition audition is unavailable'
    : state === 'loading' ? 'Preparing audition'
      : state === 'playing' ? 'Audition playing' : 'Audition ready')
</script>

<section aria-label="Transition audition" class={className ?? 'flex flex-wrap items-center gap-2'}>
  <button type="button" disabled={state !== 'idle' && state !== 'error'} onclick={onAudition}
    class="rounded-md bg-tint-accent px-3 py-2 text-sm font-medium text-tint-on-accent disabled:cursor-not-allowed disabled:opacity-50">Audition transition</button>
  <button type="button" disabled={state !== 'playing' && state !== 'loading'} onclick={onStop}
    class="rounded-md border border-tint-border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50">Stop audition</button>
  {#if state === 'error'}
    <span role="alert" class="text-sm text-tint-danger">{error ?? 'Transition audition failed'}</span>
  {:else}
    <span role="status" class="text-sm text-tint-muted">{status}</span>
  {/if}
</section>
