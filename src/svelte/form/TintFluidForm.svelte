<script lang="ts">
  import type { Snippet } from 'svelte'
  import { FluidForm } from 'carbon-components-svelte'
  import './styles.css'

  type Props = {
    id?: string
    title?: string
    description?: string
    error?: string
    density?: 'comfortable' | 'compact'
    columns?: 1 | 2
    busy?: boolean
    noValidate?: boolean
    className?: string
    onsubmit?: (event: SubmitEvent) => void
    children?: Snippet
  }

  let {
    id,
    title,
    description,
    error,
    density = 'comfortable',
    columns = 1,
    busy = false,
    noValidate = false,
    className,
    onsubmit,
    children,
  }: Props = $props()
</script>

<FluidForm
  {id}
  class={['tint-fluid-form', className].filter(Boolean).join(' ')}
  data-density={density}
  data-columns={columns}
  aria-label={title}
  aria-busy={busy || undefined}
  novalidate={noValidate}
  on:submit={(event) => onsubmit?.(event as SubmitEvent)}
>
  {#if title}<h2 class="tint-fluid-form__title">{title}</h2>{/if}
  {#if description}<p class="tint-fluid-form__description">{description}</p>{/if}
  {#if error}<p class="tint-fluid-form__error" role="alert">{error}</p>{/if}
  <div class="tint-fluid-form__fields">{@render children?.()}</div>
</FluidForm>
