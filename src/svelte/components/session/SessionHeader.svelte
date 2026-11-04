<script lang="ts">
  import { Radio } from '@lucide/svelte'
  import Icon from '../icon/Icon.svelte'
  import type { SessionHeaderProps } from './types'

  const ACTIVITY_LABEL = { watch: 'Watching together', listen: 'Listening together', game: 'Playing together', collaborate: 'Working together', broadcast: 'Broadcast' } as const
  const MODE_LABEL = { text: 'Text channel', voice: 'Voice channel', stage: 'Stage channel' } as const

  let { channel, activity, mode, live = false, participantCount, appearance = 'desktop', actions, class: className }: SessionHeaderProps = $props()
</script>

<header data-tint-session-header="" data-appearance={appearance} class={['session-header', className].filter(Boolean).join(' ')}>
  <div class="identity">
    <h2><span aria-hidden="true">#</span>{channel}</h2>
    <p>
      {#if live}<span class="live"><Icon icon={Radio} size="sm" />Live</span>{/if}
      <span>{ACTIVITY_LABEL[activity]}</span>
      <span class="mode">{MODE_LABEL[mode]}</span>
      {#if participantCount !== undefined}<span>{participantCount} {participantCount === 1 ? 'participant' : 'participants'}</span>{/if}
    </p>
  </div>
  {#if actions}<div class="actions">{@render actions()}</div>{/if}
</header>

<style>
  .session-header { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tint-space-3) var(--tint-space-5); padding: var(--tint-space-3) var(--tint-space-4); border-bottom: 1px solid var(--tint-border); background: var(--tint-panel); color: var(--tint-ink); }
  .identity { min-width: 0; flex: 1; }
  h2 { margin: 0; font-size: var(--tint-font-size-md); font-weight: 600; }
  h2 span { margin-right: .125rem; color: var(--tint-muted); }
  p { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tint-space-1) var(--tint-space-3); margin: var(--tint-space-1) 0 0; color: var(--tint-muted); font-size: var(--tint-font-size-xs); }
  .live { display: inline-flex; align-items: center; gap: var(--tint-space-1); padding: 0 var(--tint-space-2); border-radius: var(--tint-radius-sm); background: var(--tint-danger-soft); color: var(--tint-danger-ink); font-weight: 600; text-transform: uppercase; letter-spacing: .04em; }
  .actions { display: flex; gap: var(--tint-space-2); }
  [data-appearance='controller'] h2 { font-size: var(--tint-font-size-lg); }
  [data-appearance='controller'] p { font-size: var(--tint-font-size-sm); }
</style>
