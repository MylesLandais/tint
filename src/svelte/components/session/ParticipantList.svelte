<script lang="ts">
  import { Bot, Mic, Server } from '@lucide/svelte'
  import Avatar from '../identity/Avatar.svelte'
  import Icon from '../icon/Icon.svelte'
  import type { Presence } from '../../../core/identity'
  import type { ParticipantListProps, SessionParticipantState } from './types'

  const PRESENCE: Record<SessionParticipantState, Presence> = { pending: 'unknown', participating: 'online', suspended: 'away', departed: 'offline' }
  const KIND_LABEL = { human: 'Person', agent: 'Agent', service: 'Service' } as const
  const STATE_LABEL: Record<SessionParticipantState, string> = { pending: 'Joining', participating: 'Here', suspended: 'Reconnecting', departed: 'Left' }

  let { participants, label = 'Participants', appearance = 'desktop', class: className }: ParticipantListProps = $props()
  let present = $derived(participants.filter((participant) => participant.state !== 'departed'))
</script>

<section data-tint-participant-list="" data-appearance={appearance} aria-label={label} class={['participant-list', className].filter(Boolean).join(' ')}>
  <header><h3>{label}</h3><span>{present.length} present</span></header>
  <ul>
    {#each present as participant (participant.id)}
      <li data-state={participant.state} data-speaking={participant.speaking || undefined}>
        <Avatar name={participant.name} src={participant.avatarUrl} presence={PRESENCE[participant.state]} size={appearance === 'controller' ? 'lg' : 'md'} />
        <div class="who">
          <span class="name">
            {participant.name}
            {#if participant.kind !== 'human'}<span class="kind"><Icon icon={participant.kind === 'agent' ? Bot : Server} size="sm" />{KIND_LABEL[participant.kind]}</span>{/if}
          </span>
          <span class="detail">
            {STATE_LABEL[participant.state]}
            {#if participant.state === 'participating'} · {participant.ready ? 'Ready' : 'Not ready'}{/if}
            {#if (participant.connections ?? 1) > 1} · {participant.connections} devices{/if}
          </span>
          {#if participant.capabilities?.length}
            <span class="capabilities" aria-label="Capabilities">{#each participant.capabilities as capability (capability)}<code>{capability}</code>{/each}</span>
          {/if}
        </div>
        <span class="signals">
          {#if participant.speaking}<span class="signal speaking" title="Speaking"><Icon icon={Mic} size="sm" /><span class="sr-only">Speaking</span></span>{/if}
        </span>
      </li>
    {/each}
  </ul>
</section>

<style>
  .participant-list { border: 1px solid var(--tint-border); border-radius: var(--tint-radius-lg); background: var(--tint-panel); color: var(--tint-ink); }
  header { display: flex; align-items: baseline; justify-content: space-between; padding: var(--tint-space-3) var(--tint-space-4); border-bottom: 1px solid var(--tint-border); }
  h3 { margin: 0; font-size: var(--tint-font-size-sm); font-weight: 600; }
  header span { color: var(--tint-muted); font-size: var(--tint-font-size-xs); }
  ul { margin: 0; padding: var(--tint-space-2); list-style: none; }
  li { display: flex; align-items: center; gap: var(--tint-space-3); padding: var(--tint-space-2); border-radius: var(--tint-radius-sm); }
  li[data-state='suspended'] { opacity: .7; }
  li[data-speaking] :global([data-tint-avatar]) { box-shadow: 0 0 0 2px var(--tint-success); }
  .who { display: grid; min-width: 0; flex: 1; gap: .125rem; }
  .name { display: flex; align-items: center; gap: var(--tint-space-2); font-size: var(--tint-font-size-sm); font-weight: 500; }
  .kind { display: inline-flex; align-items: center; gap: var(--tint-space-1); padding: 0 var(--tint-space-1); border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); color: var(--tint-muted); font-size: .6875rem; font-weight: 500; }
  .detail { color: var(--tint-muted); font-size: var(--tint-font-size-xs); }
  .capabilities { display: flex; flex-wrap: wrap; gap: var(--tint-space-1); }
  code { padding: 0 var(--tint-space-1); border-radius: var(--tint-radius-sm); background: var(--tint-surface); color: var(--tint-muted); font-family: var(--font-mono); font-size: .625rem; }
  .signals { display: flex; flex: none; align-items: center; gap: var(--tint-space-2); }
  .signal { display: inline-flex; }
  .speaking { color: var(--tint-success); }
  .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  [data-appearance='controller'] li { padding: var(--tint-space-3); }
  [data-appearance='controller'] .name { font-size: var(--tint-font-size-md); }
</style>
