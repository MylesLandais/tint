<script lang="ts">
  import type { StageViewProps } from './types'

  let { label = 'Stage', state, waitingLabel = 'Waiting for everyone to be ready…', appearance = 'desktop', children, overlay, class: className }: StageViewProps = $props()
</script>

<section data-tint-stage-view="" data-appearance={appearance} aria-label={label} class={['stage-view', className].filter(Boolean).join(' ')}>
  <div class="media">{@render children()}</div>
  {#if overlay}<div class="overlay">{@render overlay()}</div>{/if}
  {#if state === 'waiting'}<p class="waiting" role="status">{waitingLabel}</p>{/if}
</section>

<style>
  .stage-view { position: relative; overflow: hidden; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-lg); background: var(--tint-bg); }
  .media { position: relative; z-index: 0; }
  /* The overlay never takes pointer events from the player; overlay content opts back in. */
  .overlay { position: absolute; inset: 0; z-index: 1; display: flex; align-items: flex-start; justify-content: flex-end; padding: var(--tint-space-3); pointer-events: none; }
  .overlay > :global(*) { pointer-events: auto; }
  .waiting { position: absolute; top: var(--tint-space-3); left: 50%; z-index: 2; margin: 0; padding: var(--tint-space-2) var(--tint-space-3); border: 1px solid var(--tint-border); border-radius: var(--tint-radius-md); background: var(--tint-panel); color: var(--tint-ink); font-size: var(--tint-font-size-sm); transform: translateX(-50%); }
</style>
