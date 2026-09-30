<script lang="ts">
  import type { FormSection, FormValues } from '../../core/form/contracts'
  import { joinFormPath } from '../../core/form/render'
  import FormFieldView from './FormFieldView.svelte'
  import './styles.css'

  type Props = {
    section: FormSection
    prefix: string
    values: FormValues
    issuesByPath: Map<string, string>
    locked: boolean
    columns: 1 | 2
    onSetPath: (path: string, value: unknown) => void
    onValuesChange: (values: FormValues) => void
    pathPrefix?: string
  }

  let {
    section, prefix, values, issuesByPath, locked, columns,
    onSetPath, onValuesChange, pathPrefix = '',
  }: Props = $props()
</script>

<fieldset class="tint-svelte-form-section" disabled={locked}>
  {#if section.title}<legend class="tint-svelte-form-section__title">{section.title}</legend>{/if}
  {#if section.description}<p class="tint-field-description">{section.description}</p>{/if}
  <div class="tint-svelte-form-fields" data-columns={columns}>
    {#each section.fields as field (joinFormPath(pathPrefix, field.name) || field.label)}
      <FormFieldView
        {field}
        path={joinFormPath(pathPrefix, field.name)}
        {prefix}
        {values}
        {issuesByPath}
        {locked}
        {columns}
        {onSetPath}
        {onValuesChange}
      />
    {/each}
  </div>
</fieldset>
