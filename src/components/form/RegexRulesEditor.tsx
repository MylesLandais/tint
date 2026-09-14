import { useId } from 'react'
import { FormControl } from './FormControl'
import { TextAreaField, TextField } from './inputs'
import './styles.css'

/** A source document, including fields understood only by the host. */
export type RegexRuleDocument = Record<string, unknown>
export type RegexRulesEditorProps = {
  value: readonly RegexRuleDocument[]
  onValueChange: (value: RegexRuleDocument[]) => void
  placements: readonly { value: number; label: string }[]
  disabled?: boolean
}

/** Controlled ordered rules. Only edited fields change; execution and saving
 * belong to the host. This component never evaluates an expression. */
export function RegexRulesEditor({ value, onValueChange, placements, disabled = false }: RegexRulesEditorProps) {
  const id = useId()
  const change = (index: number, patch: RegexRuleDocument) => onValueChange(value.map((rule, i) => i === index ? { ...rule, ...patch } : rule))
  const move = (index: number, delta: number) => {
    const next = [...value]
    ;[next[index], next[index + delta]] = [next[index + delta], next[index]]
    onValueChange(next)
  }
  return <div className="tint-regex-rules">
    <p className="tint-form-description">Rules run in order. With both Prompt only and Display only off, a rule changes saved text.</p>
    {value.length === 0 && <p>No regex rules.</p>}
    {value.map((rule, index) => {
      const valid = rule != null && typeof rule === 'object' && !Array.isArray(rule)
      const text = (key: string) => typeof rule[key] === 'string' ? rule[key] as string : ''
      const field = (key: string, label: string, multiline = false) => {
        const fieldId = `${id}-${index}-${key}`
        const props = { id: fieldId, value: text(key), onChange: (next: string) => change(index, { [key]: next }), disabled }
        return <FormControl id={fieldId} label={label}>{multiline ? <TextAreaField {...props} /> : <TextField {...props} />}</FormControl>
      }
      return <fieldset key={index} disabled={disabled} className="tint-regex-rule">
        <legend>Rule {index + 1}{valid && text('scriptName') ? `: ${text('scriptName')}` : ''}</legend>
        <div className="tint-regex-actions">
          <button type="button" disabled={disabled || index === 0} aria-label={`Move rule ${index + 1} up`} onClick={() => move(index, -1)}>Move up</button>
          <button type="button" disabled={disabled || index === value.length - 1} aria-label={`Move rule ${index + 1} down`} onClick={() => move(index, 1)}>Move down</button>
          <button type="button" aria-label={`Remove rule ${index + 1}`} onClick={() => onValueChange(value.filter((_, i) => i !== index))}>Remove</button>
        </div>
        {!valid ? <p role="alert">This rule has an unsupported format. Remove it or keep the saved profile.</p> : <>
          {field('scriptName', 'Rule name')}
          {field('findRegex', 'Find expression')}
          {field('replaceString', 'Replacement', true)}
          <div className="tint-regex-options">
            {(['disabled', 'runOnEdit', 'promptOnly', 'markdownOnly'] as const).map((key, i) => <label key={key}>
              <input type="checkbox" checked={Boolean(rule[key])} onChange={event => change(index, { [key]: event.target.checked })} />
              {['Disable rule', 'Run when editing', 'Prompt only', 'Display only'][i]}
            </label>)}
          </div>
          <fieldset className="tint-regex-options"><legend>Apply to</legend>
            {placements.map(placement => <label key={placement.value}>
              <input type="checkbox" checked={Array.isArray(rule.placement) && rule.placement.includes(placement.value)} onChange={event => {
                const next = Array.isArray(rule.placement) ? rule.placement.filter(item => item !== placement.value) : []
                change(index, { placement: event.target.checked ? [...next, placement.value] : next })
              }} />{placement.label}
            </label>)}
          </fieldset>
          <details><summary>Advanced options</summary>
            <label>Find macros<select className="tint-form-input" value={String(rule.substituteRegex ?? 0)} onChange={event => change(index, { substituteRegex: Number(event.target.value) })}>
              <option value="0">Keep literal</option><option value="1">Substitute</option><option value="2">Substitute and escape</option>
            </select></label>
            <div className="tint-regex-options">
              {(['minDepth', 'maxDepth'] as const).map((key, i) => <label key={key}>{i === 0 ? 'Minimum depth' : 'Maximum depth'}
                <input className="tint-form-input" type="number" step="1" value={typeof rule[key] === 'string' || typeof rule[key] === 'number' ? rule[key] as string | number : ''}
                  onChange={event => change(index, { [key]: event.target.value === '' ? null : Number(event.target.value) })} />
              </label>)}
            </div>
            <FormControl id={`${id}-${index}-trim`} label="Trim from captures (one per line)">
              <TextAreaField id={`${id}-${index}-trim`} value={Array.isArray(rule.trimStrings) ? rule.trimStrings.join('\n') : ''}
                onChange={next => change(index, { trimStrings: next === '' ? [] : next.split('\n') })} />
            </FormControl>
          </details>
        </>}
      </fieldset>
    })}
    <button type="button" disabled={disabled} onClick={() => onValueChange([...value, { scriptName: 'New rule', findRegex: '', replaceString: '', placement: [1, 2], disabled: false }])}>Add regex rule</button>
  </div>
}
