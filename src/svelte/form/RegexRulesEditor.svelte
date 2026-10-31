<script lang="ts">
  import {
    NEW_REGEX_RULE, isRegexRuleDocument, moveRegexRule, patchRegexRule,
    regexText, regexTrimText, toggleRegexPlacement, groupNumberOptions,
    type RegexRuleDocument, type RegexRulesEditorProps,
  } from '../../core/form/roleplay'
  import Button from '../components/button/Button.svelte'
  import ToggleField from './ToggleField.svelte'
  import SelectField from './SelectField.svelte'
  import NumberField from './NumberField.svelte'
  import TextAreaField from './TextAreaField.svelte'
  import TextField from './TextField.svelte'
  import './roleplay.css'

  let { value, onValueChange, placements, disabled = false }: RegexRulesEditorProps = $props()
  const id = $props.id()
  const macroModes = [{value: 0, label: 'Keep literal'}, {value: 1, label: 'Substitute'}, {value: 2, label: 'Substitute and escape'}]
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
        <Button size="sm" aria-label={`Move rule ${index + 1} up`} disabled={disabled || index === 0} onclick={() => onValueChange(moveRegexRule(value, index, -1))}>Move up</Button>
        <Button size="sm" aria-label={`Move rule ${index + 1} down`} disabled={disabled || index === value.length - 1} onclick={() => onValueChange(moveRegexRule(value, index, 1))}>Move down</Button>
        <Button size="sm" aria-label={`Remove rule ${index + 1}`} {disabled} onclick={() => onValueChange(value.filter((_, slot) => slot !== index))}>Remove</Button>
      </div>
      {#if !valid}
        <p role="alert">This rule has an unsupported format. Remove it or keep the saved profile.</p>
      {:else}
        <TextField id={`${id}-${index}-name`} label="Rule name" value={regexText(rule, 'scriptName')} onValueChange={(scriptName) => change(index, { scriptName })} {disabled} />
        <TextField id={`${id}-${index}-find`} label="Find expression" value={regexText(rule, 'findRegex')} onValueChange={(findRegex) => change(index, { findRegex })} {disabled} />
        <TextAreaField id={`${id}-${index}-replace`} label="Replacement" value={regexText(rule, 'replaceString')} onValueChange={(replaceString) => change(index, { replaceString })} {disabled} />
        <div class="tint-regex-options">
          {#each flags as flag (flag.key)}
            <ToggleField id={`${id}-${index}-${flag.key}`} label={flag.label} checked={Boolean(rule[flag.key])} {disabled} inline onCheckedChange={(checked) => change(index, { [flag.key]: checked })} />
          {/each}
        </div>
        <fieldset class="tint-regex-options">
          <legend>Apply to</legend>
          {#each placements as placement (placement.value)}
            <ToggleField id={`${id}-${index}-placement-${placement.value}`} label={placement.label} checked={Array.isArray(rule.placement) && rule.placement.includes(placement.value)} {disabled} inline onCheckedChange={(checked) => change(index, { placement: toggleRegexPlacement(rule, placement.value, checked) })} />
          {/each}
        </fieldset>
        <details>
          <summary>Advanced options</summary>
          <SelectField id={`${id}-${index}-macros`} label="Find macros" value={String(rule.substituteRegex ?? 0)} {disabled}
            options={groupNumberOptions(macroModes, Number(rule.substituteRegex ?? 0))} onValueChange={(next) => change(index, { substituteRegex: Number(next) })} />
          <div class="tint-regex-options">
            <NumberField id={`${id}-${index}-min-depth`} label="Minimum depth" step={1} value={typeof rule.minDepth === 'string' || typeof rule.minDepth === 'number' ? rule.minDepth : ''} {disabled}
              onValueChange={(next) => change(index, { minDepth: next === '' ? null : next })} />
            <NumberField id={`${id}-${index}-max-depth`} label="Maximum depth" step={1} value={typeof rule.maxDepth === 'string' || typeof rule.maxDepth === 'number' ? rule.maxDepth : ''} {disabled}
              onValueChange={(next) => change(index, { maxDepth: next === '' ? null : next })} />
          </div>
          <TextAreaField id={`${id}-${index}-trim`} label="Trim from captures (one per line)" value={regexTrimText(rule)} onValueChange={(next) => change(index, { trimStrings: next === '' ? [] : next.split('\n') })} {disabled} />
        </details>
      {/if}
    </fieldset>
  {/each}
  <Button size="sm" {disabled} onclick={() => onValueChange([...value, { ...NEW_REGEX_RULE, placement: [...(NEW_REGEX_RULE.placement as number[])] }])}>Add regex rule</Button>
</div>
