import React, { useId, useState } from 'react'
import { FormControl } from './FormControl'
import { NumberField, SelectField, TextAreaField, TextField } from './inputs'
void React

export type GroupFields = {
  name: string
  members: string[]
  mutedMembers: string[]
  strategy: number
  promptMode: number
  allowSelfReplies: boolean
  delay: number | string
  prefix: string
  suffix: string
  favorite: boolean
}
export type GroupCharacterOption = { value: string; label: string }
export type GroupEditorProps = {
  value: GroupFields
  onValueChange: (value: GroupFields) => void
  characters: readonly GroupCharacterOption[]
  strategies: readonly { value: number; label: string }[]
  promptModes: readonly { value: number; label: string }[]
  disabled?: boolean
}

/** Controlled group settings and ordered members. The host owns persistence,
 * speaker execution, character identities and the meaning of each mode. */
export function GroupEditor({ value, onValueChange, characters, strategies, promptModes, disabled = false }: GroupEditorProps) {
  const id = useId()
  const [candidate, setCandidate] = useState('')
  const change = (patch: Partial<GroupFields>) => onValueChange({ ...value, ...patch })
  const options = (items: readonly {value:number;label:string}[], saved:number) => [
    ...items.map(item => ({...item,value:String(item.value)})),
    ...(items.some(item => item.value === saved) ? [] : [{value:String(saved),label:`Saved option ${saved}`}]),
  ]
  const move = (index: number, direction: number) => {
    const members = [...value.members]
    ;[members[index],members[index+direction]] = [members[index+direction],members[index]]
    change({members})
  }
  const counts = new Map<string,number>()
  const available = characters.filter(character => !value.members.includes(character.value))
  const selected = available.some(character => character.value === candidate) ? candidate : available[0]?.value ?? ''
  return <fieldset className="tint-group-editor" disabled={disabled}>
    <legend>Group details</legend>
    <FormControl id={`${id}-name`} label="Group name"><TextField id={`${id}-name`} value={value.name} onChange={name => change({name})} disabled={disabled} /></FormControl>
    <fieldset className="tint-group-editor__members"><legend>Members</legend>
      {!value.members.length && <p>No members yet.</p>}
      <ol>{value.members.map((member,index) => {
        const character = characters.find(character => character.value === member)
        const label = character?.label ?? member
        const occurrence = counts.get(member) ?? 0; counts.set(member,occurrence+1)
        return <li key={`${member}:${occurrence}`}>
          <span className="tint-group-editor__member-name">{label}{!character && <small>Unavailable character</small>}</span>
          <label><input type="checkbox" checked={value.mutedMembers.includes(member)} disabled={disabled} aria-label={`Mute ${label}`} onChange={event => change({mutedMembers:event.target.checked ? [...value.mutedMembers,member] : value.mutedMembers.filter(key => key !== member)})} /> Muted</label>
          <div className="tint-group-editor__actions">
            <button type="button" aria-label={`Move ${label} up`} disabled={disabled || index === 0} onClick={() => move(index,-1)}>↑</button>
            <button type="button" aria-label={`Move ${label} down`} disabled={disabled || index === value.members.length-1} onClick={() => move(index,1)}>↓</button>
            <button type="button" aria-label={`Remove ${label}`} disabled={disabled} onClick={() => {
              const members = value.members.filter((_,slot) => slot !== index)
              change({members,mutedMembers:members.includes(member) ? value.mutedMembers : value.mutedMembers.filter(key => key !== member)})
            }}>Remove</button>
          </div>
        </li>
      })}</ol>
      <div className="tint-group-editor__add">
        <FormControl id={`${id}-add`} label="Add character"><SelectField id={`${id}-add`} value={selected} onChange={setCandidate} disabled={disabled || !available.length} options={available.length ? available : [{value:'',label:'No more characters'}]} /></FormControl>
        <button type="button" disabled={disabled || !selected} onClick={() => change({members:[...value.members,selected]})}>Add member</button>
      </div>
    </fieldset>
    <div className="tint-group-editor__settings">
      <FormControl id={`${id}-strategy`} label="Speaker selection"><SelectField id={`${id}-strategy`} value={String(value.strategy)} onChange={strategy => change({strategy:Number(strategy)})} options={options(strategies,value.strategy)} disabled={disabled} /></FormControl>
      <FormControl id={`${id}-mode`} label="Character prompts"><SelectField id={`${id}-mode`} value={String(value.promptMode)} onChange={mode => change({promptMode:Number(mode)})} options={options(promptModes,value.promptMode)} disabled={disabled} /></FormControl>
      <FormControl id={`${id}-delay`} label="Automatic reply delay (seconds)"><NumberField id={`${id}-delay`} value={value.delay} onChange={delay => change({delay})} step="any" required disabled={disabled} /></FormControl>
    </div>
    <label><input type="checkbox" checked={value.allowSelfReplies} disabled={disabled} onChange={event => change({allowSelfReplies:event.target.checked})} /> Allow consecutive replies from the same character</label>
    <label><input type="checkbox" checked={value.favorite} disabled={disabled} onChange={event => change({favorite:event.target.checked})} /> Favorite group</label>
    {value.promptMode !== 0 && <div className="tint-group-editor__settings">
      <FormControl id={`${id}-prefix`} label="Joined prompt prefix"><TextAreaField id={`${id}-prefix`} value={value.prefix} onChange={prefix => change({prefix})} rows={3} disabled={disabled} /></FormControl>
      <FormControl id={`${id}-suffix`} label="Joined prompt suffix"><TextAreaField id={`${id}-suffix`} value={value.suffix} onChange={suffix => change({suffix})} rows={3} disabled={disabled} /></FormControl>
    </div>}
  </fieldset>
}
