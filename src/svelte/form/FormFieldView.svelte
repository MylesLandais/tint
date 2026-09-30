<script lang="ts">
  import type { FormField, FormValues } from '../../core/form/contracts'
  import {
    appendAtPath,
    defaultItemForField,
    getAtPath,
    isFormFileValue,
    removeAtIndex,
  } from '../../core/form/contracts'
  import {
    formFieldId,
    formNumber,
    formSliderValue,
    formString,
  } from '../../core/form/render'
  import FileField from './FileField.svelte'
  import FormSectionView from './FormSectionView.svelte'
  import NumberField from './NumberField.svelte'
  import PasswordField from './PasswordField.svelte'
  import SelectField from './SelectField.svelte'
  import SliderField from './SliderField.svelte'
  import TagsField from './TagsField.svelte'
  import TextAreaField from './TextAreaField.svelte'
  import TextField from './TextField.svelte'
  import ToggleField from './ToggleField.svelte'
  import './styles.css'

  type Props = {
    field: FormField
    path: string
    prefix: string
    values: FormValues
    issuesByPath: Map<string, string>
    locked: boolean
    columns: 1 | 2
    onSetPath: (path: string, value: unknown) => void
    onValuesChange: (values: FormValues) => void
  }

  let {
    field, path, prefix, values, issuesByPath, locked, columns,
    onSetPath, onValuesChange,
  }: Props = $props()

  let id = $derived(formFieldId(prefix, path, field.label))
  let error = $derived(issuesByPath.get(path))
  let raw = $derived(getAtPath(values, path))
  let items = $derived(Array.isArray(raw) ? raw : [])
</script>

{#if field.kind === 'repeatable'}
  <div class="tint-svelte-repeatable">
    <div class="tint-svelte-repeatable__header">
      <span class="tint-field-label">{field.label}</span>
      <button
        type="button"
        disabled={locked}
        onclick={() => onValuesChange(appendAtPath(values, path, defaultItemForField(field)))}
      >{field.addLabel ?? `Add ${field.label}`}</button>
    </div>
    {#if field.description}<p class="tint-field-description">{field.description}</p>{/if}
    {#if error}<p class="tint-field-error" role="alert">{error}</p>{/if}
    <ol class="tint-svelte-repeatable__list">
      {#each items as item, index (`${path}-${index}`)}
        {@const itemPath = `${path}.${index}`}
        <li class="tint-svelte-repeatable__item">
          <div class="tint-svelte-repeatable__item-bar">
            <span>{field.label} {index + 1}</span>
            <button
              type="button"
              disabled={locked}
              aria-label={`${field.removeLabel ?? 'Remove'} ${field.label} ${index + 1}`}
              onclick={() => onValuesChange(removeAtIndex(values, path, index))}
            >{field.removeLabel ?? 'Remove'}</button>
          </div>
          {#if field.itemSchema}
            <FormSectionView
              section={field.itemSchema}
              prefix={`${prefix}-${index}`}
              {values}
              {issuesByPath}
              {locked}
              {columns}
              {onSetPath}
              {onValuesChange}
              pathPrefix={itemPath}
            />
          {:else if field.itemKind === 'number'}
            <NumberField
              id={`${id}-${index}`}
              label={`${field.label} ${index + 1}`}
              value={formNumber(item)}
              error={issuesByPath.get(itemPath)}
              disabled={locked}
              onValueChange={(next) => onSetPath(itemPath, next)}
            />
          {:else if field.itemKind === 'textarea'}
            <TextAreaField
              id={`${id}-${index}`}
              label={`${field.label} ${index + 1}`}
              value={formString(item)}
              error={issuesByPath.get(itemPath)}
              disabled={locked}
              onValueChange={(next) => onSetPath(itemPath, next)}
            />
          {:else}
            <TextField
              id={`${id}-${index}`}
              label={`${field.label} ${index + 1}`}
              value={formString(item)}
              error={issuesByPath.get(itemPath)}
              disabled={locked}
              onValueChange={(next) => onSetPath(itemPath, next)}
            />
          {/if}
        </li>
      {/each}
    </ol>
  </div>
{:else if field.kind === 'textarea'}
  <TextAreaField {id} label={field.label} value={formString(raw)} description={field.description} {error} disabled={locked} required={field.required} placeholder={field.placeholder} onValueChange={(next) => onSetPath(path, next)} />
{:else if field.kind === 'password'}
  <PasswordField {id} label={field.label} value={formString(raw)} description={field.description} {error} disabled={locked} required={field.required} placeholder={field.placeholder} autocomplete="current-password" showPasswordLabel={field.showPasswordLabel} hidePasswordLabel={field.hidePasswordLabel} onValueChange={(next) => onSetPath(path, next)} />
{:else if field.kind === 'email'}
  <TextField {id} label={field.label} type="email" value={formString(raw)} description={field.description} {error} disabled={locked} required={field.required} placeholder={field.placeholder} autocomplete="email" onValueChange={(next) => onSetPath(path, next)} />
{:else if field.kind === 'number'}
  <NumberField {id} label={field.label} value={formNumber(raw)} description={field.description} {error} disabled={locked} required={field.required} min={field.min} max={field.max} step={field.step} onValueChange={(next) => onSetPath(path, next)} />
{:else if field.kind === 'slider'}
  <SliderField {id} label={field.label} value={formSliderValue(raw, field.min)} description={field.description} {error} disabled={locked} min={field.min} max={field.max} step={field.step} onValueChange={(next) => onSetPath(path, next)} />
{:else if field.kind === 'select'}
  <SelectField {id} label={field.label} value={formString(raw)} options={field.options ?? []} description={field.description} {error} disabled={locked} required={field.required} onValueChange={(next) => onSetPath(path, next)} />
{:else if field.kind === 'toggle'}
  <ToggleField {id} label={field.label} checked={Boolean(raw)} description={field.description} {error} disabled={locked} onCheckedChange={(next) => onSetPath(path, next)} />
{:else if field.kind === 'tags'}
  <TagsField {id} label={field.label} value={Array.isArray(raw) ? raw.map(String) : []} description={field.description} {error} disabled={locked} required={field.required} placeholder={field.placeholder} onValueChange={(next) => onSetPath(path, next)} />
{:else if field.kind === 'file'}
  <FileField {id} label={field.label} value={isFormFileValue(raw) ? raw : null} description={field.description} {error} disabled={locked} required={field.required} accept={field.accept} onValueChange={(next) => onSetPath(path, next)} />
{:else}
  <TextField {id} label={field.label} value={formString(raw)} description={field.description} {error} disabled={locked} required={field.required} placeholder={field.placeholder} onValueChange={(next) => onSetPath(path, next)} />
{/if}
