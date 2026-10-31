<script lang="ts">
  import {
    availableGroupCharacters, groupCandidate, groupMemberRows, groupNumberOptions,
    moveGroupMember, muteGroupMember, removeGroupMember,
    type GroupEditorProps, type GroupFields,
  } from '../../core/form/roleplay'
  import Button from '../components/button/Button.svelte'
  import ToggleField from './ToggleField.svelte'
  import NumberField from './NumberField.svelte'
  import SelectField from './SelectField.svelte'
  import TextAreaField from './TextAreaField.svelte'
  import TextField from './TextField.svelte'
  import './roleplay.css'

  let { value, onValueChange, characters, strategies, promptModes, disabled = false }: GroupEditorProps = $props()
  const id = $props.id()
  let candidate = $state('')
  let rows = $derived(groupMemberRows(value.members, characters))
  let available = $derived(availableGroupCharacters(value.members, characters))
  let selected = $derived(groupCandidate(candidate, available))

  function change(patch: Partial<GroupFields>) { onValueChange({ ...value, ...patch }) }
</script>

<fieldset class="tint-roleplay-editor" {disabled}>
  <legend>Group details</legend>
  <TextField id={`${id}-name`} label="Group name" value={value.name} onValueChange={(name) => change({ name })} {disabled} />

  <fieldset class="tint-roleplay-editor__members">
    <legend>Members</legend>
    {#if !rows.length}<p>No members yet.</p>{/if}
    <ol>
      {#each rows as row (row.key)}
        <li>
          <span class="tint-roleplay-editor__member-name">{row.label}{#if !row.available}<small>Unavailable character</small>{/if}</span>
          <ToggleField id={`${id}-mute-${row.key}`} label={`Mute ${row.label}`} checked={value.mutedMembers.includes(row.member)} {disabled} inline onCheckedChange={(checked) => onValueChange(muteGroupMember(value, row.member, checked))} />
          <div class="tint-roleplay-editor__actions">
            <Button size="sm" aria-label={`Move ${row.label} up`} disabled={disabled || row.index === 0} onclick={() => onValueChange(moveGroupMember(value, row.index, -1))}>↑</Button>
            <Button size="sm" aria-label={`Move ${row.label} down`} disabled={disabled || row.index === rows.length - 1} onclick={() => onValueChange(moveGroupMember(value, row.index, 1))}>↓</Button>
            <Button size="sm" aria-label={`Remove ${row.label}`} {disabled} onclick={() => onValueChange(removeGroupMember(value, row.index))}>Remove</Button>
          </div>
        </li>
      {/each}
    </ol>
    <div class="tint-roleplay-editor__add">
      <SelectField id={`${id}-add`} label="Add character" value={selected} onValueChange={(next) => candidate = next} disabled={disabled || !available.length} options={available.length ? available : [{ value: '', label: 'No more characters' }]} />
      <Button size="sm" disabled={disabled || !selected} onclick={() => change({ members: [...value.members, selected] })}>Add member</Button>
    </div>
  </fieldset>

  <div class="tint-roleplay-editor__settings">
    <SelectField id={`${id}-strategy`} label="Speaker selection" value={String(value.strategy)} onValueChange={(strategy) => change({ strategy: Number(strategy) })} options={groupNumberOptions(strategies, value.strategy)} {disabled} />
    <SelectField id={`${id}-mode`} label="Character prompts" value={String(value.promptMode)} onValueChange={(promptMode) => change({ promptMode: Number(promptMode) })} options={groupNumberOptions(promptModes, value.promptMode)} {disabled} />
    <NumberField id={`${id}-delay`} label="Automatic reply delay (seconds)" value={value.delay} onValueChange={(delay) => change({ delay })} step="any" required {disabled} />
  </div>
  <ToggleField id={`${id}-self-replies`} label="Allow consecutive replies from the same character" checked={value.allowSelfReplies} {disabled} inline onCheckedChange={(allowSelfReplies) => change({allowSelfReplies})} />
  <ToggleField id={`${id}-favorite`} label="Favorite group" checked={value.favorite} {disabled} inline onCheckedChange={(favorite) => change({favorite})} />
  {#if value.promptMode !== 0}
    <div class="tint-roleplay-editor__settings">
      <TextAreaField id={`${id}-prefix`} label="Joined prompt prefix" value={value.prefix} onValueChange={(prefix) => change({ prefix })} rows={3} {disabled} />
      <TextAreaField id={`${id}-suffix`} label="Joined prompt suffix" value={value.suffix} onValueChange={(suffix) => change({ suffix })} rows={3} {disabled} />
    </div>
  {/if}
</fieldset>
