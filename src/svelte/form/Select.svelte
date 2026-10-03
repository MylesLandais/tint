<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLSelectAttributes } from 'svelte/elements'
  import type { ChoiceOption } from './types'
  import '../../styles/select.css'

  type Props = Omit<HTMLSelectAttributes, 'value' | 'children' | 'size'> & {
    value: string
    onValueChange?: (value: string) => void
    /** Either options, or custom <option>/<optgroup> markup as children. */
    options?: readonly ChoiceOption[]
    children?: Snippet
    /** `sm` is the compact height used in toolbars and grid menus. */
    size?: 'md' | 'sm'
    invalid?: boolean
  }

  let { value, onValueChange, options, children, size = 'md', invalid = false, class: className, onchange, ...rest }: Props = $props()
</script>

<select
  {...rest}
  class={['tint-select', className].filter(Boolean).join(' ')}
  data-size={size}
  {value}
  aria-invalid={invalid ? 'true' : rest['aria-invalid']}
  onchange={(event) => { onValueChange?.(event.currentTarget.value); onchange?.(event) }}
>
  {#if options}
    {#each options as option (option.value)}
      <option value={option.value} disabled={option.disabled}>{option.label}</option>
    {/each}
  {:else}
    {@render children?.()}
  {/if}
</select>

<style>
  select { min-height: 2.75rem; padding: 0.625rem 0.75rem; border-radius: var(--tint-radius-sm, 0.25rem); font: inherit; max-width: 100%; box-sizing: border-box; }
  select:where([data-size='sm']) { min-height: 2rem; }
</style>
