<script lang="ts">
  import {
    eventReviewPeople,
    eventReviewTimestamp,
    toggleEventReviewPerson,
    type EventReviewHistoryDate,
    type EventReviewOption,
  } from '../../../core/table/eventReview'

  export type EventReviewControlsProps = {
    quickFilters: readonly EventReviewOption[]
    selectedQuickFilterId: string | null
    onQuickFilterChange: (id: string) => void
    historyDate?: EventReviewHistoryDate | null
    mediaTimestampSeconds?: number | null
    onSeek?: (seconds: number) => void
    candidatePeople: readonly EventReviewOption[]
    selectedCandidatePersonIds: readonly string[]
    onCandidatePersonIdsChange: (ids: string[]) => void
    disabled?: boolean
    class?: string
  }

  let {
    quickFilters, selectedQuickFilterId, onQuickFilterChange,
    historyDate = null, mediaTimestampSeconds = null, onSeek,
    candidatePeople, selectedCandidatePersonIds, onCandidatePersonIdsChange,
    disabled = false, class: className,
  }: EventReviewControlsProps = $props()

  const warningId = $props.id()
  let timestamp = $derived(eventReviewTimestamp(mediaTimestampSeconds))
  let people = $derived(eventReviewPeople(candidatePeople, selectedCandidatePersonIds))

  function seek() {
    if (timestamp !== null && mediaTimestampSeconds !== null) onSeek?.(mediaTimestampSeconds)
  }
</script>

<section aria-label="Event review controls" class={['tint-event-review', className].filter(Boolean).join(' ')}>
  <fieldset {disabled}>
    <legend>Quick filters</legend>
    <div class="options">
      {#each quickFilters as filter (filter.id)}
        <button type="button" {disabled} aria-pressed={selectedQuickFilterId === filter.id} onclick={() => onQuickFilterChange(filter.id)}>{filter.label}</button>
      {/each}
    </div>
  </fieldset>
  <dl>
    <div><dt>History date</dt><dd>{#if historyDate}<time datetime={historyDate.dateTime}>{historyDate.label}</time>{:else}History date unavailable{/if}</dd></div>
    <div><dt>Media timestamp</dt><dd>
      {#if timestamp === null}
        Media timestamp unavailable
      {:else if onSeek}
        <button type="button" {disabled} aria-label={`Seek to ${timestamp}`} onclick={seek}>{timestamp}</button>
      {:else}
        <span>{timestamp}</span>
      {/if}
    </dd></div>
  </dl>
  <fieldset {disabled} aria-describedby={warningId}>
    <legend>Candidate people</legend>
    <p id={warningId} class="warning">Review required · Training not approved. Candidate selection is not identity confirmation or training consent.</p>
    <div class="options">
      {#each people as person (person.id)}
        <label>
          <input type="checkbox" {disabled} checked={selectedCandidatePersonIds.includes(person.id)}
            onchange={(event) => onCandidatePersonIdsChange(toggleEventReviewPerson(selectedCandidatePersonIds, person.id, event.currentTarget.checked))} />
          {person.label}
        </label>
      {/each}
      {#if people.length === 0}<p>No candidate people available</p>{/if}
    </div>
  </fieldset>
</section>

<style>
  .tint-event-review { display: grid; gap: 1rem; min-width: 0; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-lg); background: var(--tint-panel); color: var(--tint-ink); padding: 1rem; }
  fieldset { min-width: 0; margin: 0; padding: 0; border: 0; }
  legend { margin-bottom: .5rem; font-size: var(--tint-font-size-sm); font-weight: 600; }
  .options { display: flex; flex-wrap: wrap; gap: .5rem; }
  button, label { min-height: 2.75rem; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); padding: .5rem .75rem; background: var(--tint-surface); color: var(--tint-ink); font: inherit; font-size: var(--tint-font-size-sm); }
  button { cursor: pointer; }
  button[aria-pressed='true'] { background: var(--tint-accent-soft); border-color: var(--tint-accent); }
  button:disabled { cursor: not-allowed; opacity: .5; }
  button:focus-visible, input:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
  label { display: inline-flex; align-items: center; gap: .5rem; }
  dl { display: flex; flex-wrap: wrap; gap: 1rem; margin: 0; font-size: var(--tint-font-size-sm); }
  dt { color: var(--tint-muted); }
  dd { margin: .25rem 0 0; }
  .warning { margin: 0 0 .5rem; color: var(--tint-muted); font-size: var(--tint-font-size-sm); }
  .options p { margin: .25rem 0; color: var(--tint-muted); font-size: var(--tint-font-size-sm); }
</style>
