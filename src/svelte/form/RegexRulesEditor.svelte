<script lang="ts">
  import {
    NEW_REGEX_RULE, isRegexRuleDocument, moveRegexRule, patchRegexRule,
    regexText, regexTrimText, toggleRegexPlacement,
    type RegexRuleDocument, type RegexRulesEditorProps,
  } from '../../core/form/roleplay'
  import TextAreaField from './TextAreaField.svelte'
  import TextField from './TextField.svelte'
  import './roleplay.css'

  let { value, onValueChange, placements, disabled = false }: RegexRulesEditorProps = $props()
  const id = $props.id()
  const flags = [
    { key: 'disabled', label: 'Disable rule' },
    { key: 'runOnEdit', label: 'Run when editing' },
    { key: 'promptOnly', label: 'Prompt only' },
    { key: 'markdownOnly', label: 'Display only' },
  ] as const

  function change(index: number, patch: RegexRuleDocument) { onValueChange(patchRegexRule(value, index, patch)) }
</script>

<div class="tint-regex-rules">
  <p class="tint-field-description">Rules run in order. With both Prompt only and Display only off, a rule changes saved text.</p>
  {#if !value.length}<p>No regex rules.</p>{/if}
  {#each value as rule, index (index)}
    {@const valid = isRegexRuleDocument(rule)}
    <fieldset class="tint-regex-rule" {disabled}>
      <legend>Rule {index + 1}{valid && regexText(rule, 'scriptName') ? `: ${regexText(rule, 'scriptName')}` : ''}</legend>
      <div class="tint-regex-actions">
        <button type="button" aria-label={`Move rule ${index + 1} up`} disabled={disabled || index === 0} onclick={() => onValueChange(moveRegexRule(value, index, -1))}>Move up</button>
        <button type="button" aria-label={`Move rule ${index + 1} down`} disabled={disabled || index === value.length - 1} onclick={() => onValueChange(moveRegexRule(value, index, 1))}>Move down</button>
        <button type="button" aria-label={`Remove rule ${index + 1}`} {disabled} onclick={() => onValueChange(value.filter((_, slot) => slot !== index))}>Remove</button>
      </div>
      {#if !valid}
        <p role="alert">This rule has an unsupported format. Remove it or keep the saved profile.</p>
      {:else}
        <TextField id={`${id}-${index}-name`} label="Rule name" value={regexText(rule, 'scriptName')} onValueChange={(scriptName) => change(index, { scriptName })} {disabled} />
        <TextField id={`${id}-${index}-find`} label="Find expression" value={regexText(rule, 'findRegex')} onValueChange={(findRegex) => change(index, { findRegex })} {disabled} />
        <TextAreaField id={`${id}-${index}-replace`} label="Replacement" value={regexText(rule, 'replaceString')} onValueChange={(replaceString) => change(index, { replaceString })} {disabled} />
        <div class="tint-regex-options">
          {#each flags as flag (flag.key)}
            <label><input type="checkbox" checked={Boolean(rule[flag.key])} {disabled} onchange={(event) => change(index, { [flag.key]: event.currentTarget.checked })} /> {flag.label}</label>
          {/each}
        </div>
        <fieldset class="tint-regex-options">
          <legend>Apply to</legend>
          {#each placements as placement (placement.value)}
            <label><input type="checkbox" checked={Array.isArray(rule.placement) && rule.placement.includes(placement.value)} {disabled} onchange={(event) => change(index, { placement: toggleRegexPlacement(rule, placement.value, event.currentTarget.checked) })} /> {placement.label}</label>
          {/each}
        </fieldset>
        <details>
          <summary>Advanced options</summary>
          <label>Find macros
            <select class="tint-field-input" value={String(rule.substituteRegex ?? 0)} {disabled} onchange={(event) => change(index, { substituteRegex: Number(event.currentTarget.value) })}>
              <option value="0">Keep literal</option><option value="1">Substitute</option><option value="2">Substitute and escape</option>
            </select>
          </label>
          <div class="tint-regex-options">
            <label>Minimum depth
              <input class="tint-field-input" type="number" step="1" value={typeof rule.minDepth === 'string' || typeof rule.minDepth === 'number' ? rule.minDepth : ''} {disabled} onchange={(event) => change(index, { minDepth: event.currentTarget.value === '' ? null : Number(event.currentTarget.value) })} />
            </label>
            <label>Maximum depth
              <input class="tint-field-input" type="number" step="1" value={typeof rule.maxDepth === 'string' || typeof rule.maxDepth === 'number' ? rule.maxDepth : ''} {disabled} onchange={(event) => change(index, { maxDepth: event.currentTarget.value === '' ? null : Number(event.currentTarget.value) })} />
            </label>
          </div>
          <TextAreaField id={`${id}-${index}-trim`} label="Trim from captures (one per line)" value={regexTrimText(rule)} onValueChange={(next) => change(index, { trimStrings: next === '' ? [] : next.split('\n') })} {disabled} />
        </details>
      {/if}
    </fieldset>
  {/each}
  <button type="button" {disabled} onclick={() => onValueChange([...value, { ...NEW_REGEX_RULE, placement: [...(NEW_REGEX_RULE.placement as number[])] }])}>Add regex rule</button>
</div>
