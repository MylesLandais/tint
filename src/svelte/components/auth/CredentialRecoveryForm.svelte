<script lang="ts">
  import type { Snippet } from 'svelte'
  import Button from '../button/Button.svelte'
  import TextField from '../../form/TextField.svelte'
  import TintFluidForm from '../../form/TintFluidForm.svelte'

  type Props = {
    identifier: string
    label: string
    submitLabel?: string
    submittingLabel?: string
    placeholder?: string
    busy?: boolean
    error?: string | Snippet
    help?: string | Snippet
    onIdentifierChange: (value: string) => void
    onSubmit: () => void | Promise<void>
    class?: string
  }

  let {
    identifier, label, submitLabel = 'Continue', submittingLabel = 'Submitting…',
    placeholder, busy = false, error, help, onIdentifierChange, onSubmit, class: className,
  }: Props = $props()
  const id = $props.id()
  const helpId = `${id}-help`

  function submit(event: SubmitEvent) {
    event.preventDefault()
    if (!busy) void onSubmit()
  }
</script>

<div class={['tint-auth-form', className].filter(Boolean).join(' ')} aria-busy={busy || undefined}>
  {#if error && typeof error !== 'string'}<div role="alert">{@render error()}</div>{/if}
  <TintFluidForm error={typeof error === 'string' ? error : undefined} onsubmit={submit}>
    <TextField {id} {label} value={identifier} onValueChange={onIdentifierChange} {placeholder} autocomplete="username" required disabled={busy} describedBy={help ? helpId : undefined} />
    {#if help}<div id={helpId} class="help">{#if typeof help === 'string'}{help}{:else}{@render help()}{/if}</div>{/if}
    <Button type="submit" disabled={busy}>{busy ? submittingLabel : submitLabel}</Button>
  </TintFluidForm>
</div>

<style>.tint-auth-form { display: grid; gap: var(--tint-space-3); } .help { color: var(--tint-muted); font-size: var(--tint-font-size-sm); }</style>
