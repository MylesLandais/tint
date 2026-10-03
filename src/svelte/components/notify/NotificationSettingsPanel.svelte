<script lang="ts">
  import {
    NOTIFY_CHANNELS, withDefaultChannel, withPolicyChannel, withQuietHours, withSourceChannel,
    type NotifyChannel,
  } from '../../../core/notify'
  import type { NotificationSettingsProps } from './types'

  let {
    settings, onChange, sources = [], policies = [], disabled = false,
    class: className, ...rest
  }: NotificationSettingsProps = $props()

  function channel(event: Event): NotifyChannel {
    return (event.currentTarget as HTMLSelectElement).value as NotifyChannel
  }

  function defaultChanged(event: Event) {
    const element = event.currentTarget as HTMLSelectElement
    onChange(withDefaultChannel(settings, channel(event)))
    element.value = settings.defaultChannel
  }

  function sourceChanged(event: Event, id: string) {
    const element = event.currentTarget as HTMLSelectElement
    onChange(withSourceChannel(settings, id, channel(event)))
    element.value = settings.bySource[id] ?? settings.defaultChannel
  }

  function policyChanged(event: Event, id: string) {
    const element = event.currentTarget as HTMLSelectElement
    onChange(withPolicyChannel(settings, id, channel(event)))
    element.value = settings.byPolicy[id] ?? settings.defaultChannel
  }

  function quietChanged(event: Event) {
    const element = event.currentTarget as HTMLInputElement
    onChange(withQuietHours(settings, element.checked ? { start: '22:00', end: '07:00' } : null))
    element.checked = Boolean(settings.quietHours)
  }

  function timeChanged(event: Event, field: 'start' | 'end') {
    const element = event.currentTarget as HTMLInputElement
    const quiet = settings.quietHours
    if (!quiet) return
    onChange(withQuietHours(settings, { ...quiet, [field]: element.value }))
    element.value = quiet[field]
  }
</script>

<div {...rest} data-tint-notification-settings="" class={['notification-settings', className].filter(Boolean).join(' ')}>
  <label class="channel-row"><span>Default</span><select class="tint-select" aria-label="Default" value={settings.defaultChannel} {disabled} onchange={defaultChanged}>{#each NOTIFY_CHANNELS as option (option)}<option value={option}>{option}</option>{/each}</select></label>
  {#if sources.length > 0}
    <fieldset><legend>By source</legend>
      {#each sources as source (source.id)}
        <label class="channel-row"><span>{source.label}</span><select class="tint-select" aria-label={`Source ${source.label}`} value={settings.bySource[source.id] ?? settings.defaultChannel} {disabled} onchange={(event) => sourceChanged(event, source.id)}>{#each NOTIFY_CHANNELS as option (option)}<option value={option}>{option}</option>{/each}</select></label>
      {/each}
    </fieldset>
  {/if}
  {#if policies.length > 0}
    <fieldset><legend>By policy</legend>
      {#each policies as policy (policy.id)}
        <label class="channel-row"><span>{policy.label}</span><select class="tint-select" aria-label={`Policy ${policy.label}`} value={settings.byPolicy[policy.id] ?? settings.defaultChannel} {disabled} onchange={(event) => policyChanged(event, policy.id)}>{#each NOTIFY_CHANNELS as option (option)}<option value={option}>{option}</option>{/each}</select></label>
      {/each}
    </fieldset>
  {/if}
  <fieldset><legend>Quiet hours</legend>
    <label class="quiet-toggle"><input type="checkbox" checked={Boolean(settings.quietHours)} {disabled} onchange={quietChanged} />Suppress instant delivery overnight</label>
    {#if settings.quietHours}
      <div class="times">
        <label>Start<input type="time" value={settings.quietHours.start} {disabled} onchange={(event) => timeChanged(event, 'start')} /></label>
        <label>End<input type="time" value={settings.quietHours.end} {disabled} onchange={(event) => timeChanged(event, 'end')} /></label>
      </div>
    {/if}
  </fieldset>
</div>

<style>
  .notification-settings { display: flex; min-width: 0; flex-direction: column; gap: var(--tint-space-4); color: var(--tint-ink); font-size: var(--tint-font-size-sm); container-type: inline-size; }
  fieldset { display: flex; min-width: 0; flex-direction: column; gap: var(--tint-space-2); margin: 0; border: 0; padding: 0; }
  legend { margin-bottom: var(--tint-space-1); padding: 0; color: var(--tint-muted); font-size: var(--tint-font-size-xs); font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; }
  .channel-row { display: flex; min-width: 0; align-items: center; justify-content: space-between; gap: var(--tint-space-3); }
  .channel-row span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  select, input[type='time'] { max-width: 100%; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); background: var(--tint-surface); padding: var(--tint-space-1) var(--tint-space-2); color: var(--tint-ink); font: inherit; font-size: var(--tint-font-size-xs); }
  .quiet-toggle { display: flex; align-items: center; gap: var(--tint-space-2); }
  .times { display: flex; flex-wrap: wrap; gap: var(--tint-space-2); }
  .times label { display: flex; align-items: center; gap: var(--tint-space-1); color: var(--tint-muted); font-size: var(--tint-font-size-xs); }
  :is(select, input):focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
  :is(select, input):disabled { opacity: 0.6; cursor: not-allowed; }
  @container (max-width: 260px) { .channel-row { align-items: flex-start; flex-direction: column; gap: var(--tint-space-1); } }
</style>
