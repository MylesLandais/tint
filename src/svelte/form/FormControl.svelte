<script lang="ts">
  import type { Snippet } from 'svelte'
  import './styles.css'

  type Props = {
    id: string
    label: string
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
  <label class="tint-field-label" for={id}>
    {label}{#if required}<span class="tint-field-required" aria-hidden="true"> *</span>{/if}
  </label>
  {#if description}<p id={`${id}-description`} class="tint-field-description">{description}</p>{/if}
  <div class="tint-svelte-form-control__input">{@render children?.()}</div>
  {#if error}<p id={`${id}-error`} class="tint-field-error" role="alert">{error}</p>{/if}
</div>
