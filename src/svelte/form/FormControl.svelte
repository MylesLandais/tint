<script lang="ts">
  import type { Snippet } from 'svelte'
  import './styles.css'

  type Props = {
    id: string
    label: string
    hideLabel?: boolean
    description?: string
    error?: string
    required?: boolean
    disabled?: boolean
    className?: string
    children?: Snippet
  }

  let {
    id,
    label,
    hideLabel = false,
    description,
    error,
    required = false,
    disabled = false,
    className,
    children,
  }: Props = $props()
</script>

<div
  class={['tint-svelte-form-control', className].filter(Boolean).join(' ')}
  data-invalid={Boolean(error)}
  data-disabled={disabled}
>
  <label class="tint-field-label" class:visually-hidden={hideLabel} for={id}>
    {label}{#if required}<span class="tint-field-required" aria-hidden="true"> *</span>{/if}
  </label>
  {#if description}<p id={`${id}-description`} class="tint-field-description">{description}</p>{/if}
  <div class="tint-svelte-form-control__input">{@render children?.()}</div>
  {#if error}<p id={`${id}-error`} class="tint-field-error" role="alert">{error}</p>{/if}
</div>

<style>
  .visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
</style>
