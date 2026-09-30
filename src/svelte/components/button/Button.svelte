<!-- Carbon owns the button element and its native interaction. Tint owns the
  public props and appearance through `.tint-button` and semantic tokens. -->
<script lang="ts">
  import { Button as CarbonButton } from 'carbon-components-svelte'
  import type { Snippet } from 'svelte'
  import type { HTMLButtonAttributes } from 'svelte/elements'
  import Spinner from '../icon/Spinner.svelte'

  type Props = Omit<HTMLButtonAttributes, 'children' | 'class'> & {
    variant?: 'secondary' | 'primary' | 'ghost' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    loading?: boolean
    leading?: Snippet
    trailing?: Snippet
    children?: Snippet
    class?: string
  }

  let {
    variant = 'secondary',
    size = 'md',
    loading = false,
    disabled = false,
    type = 'button',
    leading,
    trailing,
    children,
    onclick,
    class: className,
    ...rest
  }: Props = $props()

  const carbonKind = {
    primary: 'primary', secondary: 'secondary', ghost: 'ghost', danger: 'danger',
  } as const
  const carbonSize = { sm: 'small', md: 'default', lg: 'lg' } as const
  // Carbon's legacy rest-prop type intersects button, anchor and div attributes.
  // Tint exposes only native button attributes and validates them at its boundary.
  let carbonRest = $derived(rest as Record<string, unknown>)

  function handleClick(event: PointerEvent) {
    if (loading || disabled) {
      event.preventDefault()
      return
    }
    if (event.currentTarget instanceof HTMLButtonElement) {
      onclick?.(event as unknown as MouseEvent & { currentTarget: EventTarget & HTMLButtonElement })
    }
  }
</script>

<CarbonButton
  {...carbonRest}
  type={type ?? 'button'}
  disabled={Boolean(disabled)}
  kind={carbonKind[variant]}
  size={carbonSize[size]}
  class={['tint-button', className].filter(Boolean).join(' ')}
  data-variant={variant}
  data-size={size}
  aria-busy={loading || undefined}
  aria-disabled={loading || undefined}
  on:click={handleClick}
>
  {#if loading}
    <Spinner size="sm" />
  {:else if leading}
    {@render leading()}
  {/if}
  {@render children?.()}
  {@render trailing?.()}
</CarbonButton>
