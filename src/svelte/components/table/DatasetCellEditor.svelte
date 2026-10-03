<script lang="ts">
  import { onMount } from 'svelte'
  import type { FieldDef } from '../../../core/table'

  type Props = {
    field: FieldDef
    draft: string
    /** Stable id so the grid can point `aria-describedby` at the message. */
    messageId?: string
    invalid?: boolean
    onInput: (draft: string) => void
    /** Select and picker types commit as soon as a choice is made. */
    onPick?: (draft: string) => void
    onKeydown: (event: KeyboardEvent) => void
    onBlur?: () => void
    label: string
    /** Select the existing text on open. Off when a keystroke seeded the draft, so typing continues after it. */
    selectOnOpen?: boolean
    class?: string
  }
  let { field, draft, messageId, invalid = false, onInput, onPick, onKeydown, onBlur, label, selectOnOpen = true, class: className }: Props = $props()

  let el = $state<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>(null)
  onMount(() => {
    el?.focus()
    if (el && 'setSelectionRange' in el && field.type !== 'select') {
      const input = el as HTMLInputElement
      if (selectOnOpen) input.select()
      else input.setSelectionRange(input.value.length, input.value.length)
    }
  })

  const listId = $derived(`${messageId ?? 'ds'}-options`)
  const common = $derived({
    'aria-label': label,
    'aria-invalid': invalid || undefined,
    'aria-describedby': messageId,
  })
</script>

{#if field.type === 'select' || field.type === 'linked-record'}
  <select bind:this={el} {...common} class={className} value={draft} onchange={(e) => onPick?.(e.currentTarget.value)} onkeydown={onKeydown} onblur={onBlur}>
    <option value=""></option>
    {#each field.options ?? [] as option (option.value)}<option value={option.value}>{option.label ?? option.value}</option>{/each}
  </select>
{:else if field.type === 'long-text'}
  <textarea bind:this={el} {...common} class={className} rows="3" value={draft} oninput={(e) => onInput(e.currentTarget.value)} onkeydown={onKeydown} onblur={onBlur}></textarea>
{:else}
  <input
    bind:this={el} {...common} class={className} type="text" value={draft}
    inputmode={field.type === 'number' ? 'decimal' : undefined}
    placeholder={field.type === 'date' ? 'YYYY-MM-DD' : field.type === 'multi-select' ? 'a; b; c' : undefined}
    list={field.type === 'multi-select' && field.options?.length ? listId : undefined}
    oninput={(e) => onInput(e.currentTarget.value)} onkeydown={onKeydown} onblur={onBlur}
  />
  {#if field.type === 'multi-select' && field.options?.length}
    <datalist id={listId}>{#each field.options as option (option.value)}<option value={option.value}></option>{/each}</datalist>
  {/if}
{/if}
