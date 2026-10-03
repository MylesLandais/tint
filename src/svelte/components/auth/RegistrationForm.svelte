<script lang="ts">
  import { tick, type Snippet } from 'svelte'
  import {
    DEFAULT_MIN_PASSWORD_LENGTH, hasRegistrationErrors, validateRegistration,
    type RegistrationErrorCode, type RegistrationErrors, type RegistrationField, type RegistrationInput,
    type RegistrationPolicy,
  } from '../../../core/auth/registration'
  import TextField from '../../form/TextField.svelte'
  import Button from '../button/Button.svelte'
  import AuthDivider from './AuthDivider.svelte'
  import OAuthButtons from './OAuthButtons.svelte'
  import PasswordCredentialInput from './PasswordCredentialInput.svelte'
  import type { OAuthOption, RegistrationFormLabels } from './types'

  type Props = {
    values: RegistrationInput
    onValuesChange: (values: RegistrationInput) => void
    /** Called only when client-side validation passes. The server still owns real validation. */
    onSubmit: (values: RegistrationInput) => void | Promise<void>
    labels: RegistrationFormLabels
    /** Usually `{ inviteRequired: config.inviteRequired }`. */
    policy?: RegistrationPolicy
    showDisplayName?: boolean
    providers?: readonly OAuthOption[]
    providerLayout?: 'stack' | 'row'
    lastUsed?: string | null
    onProviderSelect?: (provider: OAuthOption, event: MouseEvent) => void
    busy?: boolean
    error?: string
    /** Terms or consent copy rendered above the submit button. */
    terms?: Snippet
    class?: string
  }

  let {
    values, onValuesChange, onSubmit, labels, policy = {}, showDisplayName = true,
    providers = [], providerLayout = 'stack', lastUsed = null, onProviderSelect,
    busy = false, error, terms, class: className,
  }: Props = $props()

  const id = $props.id()
  let attempted = $state(false)
  let root: HTMLDivElement | undefined = $state()
  // Errors appear after the first submit and then track edits, so people are not scolded while typing.
  let errors = $derived<RegistrationErrors>(attempted ? validateRegistration(values, policy) : {})

  function message(code: RegistrationErrorCode | undefined): string | undefined {
    if (!code) return undefined
    return labels.errors[code].replace('{min}', String(policy.minPasswordLength ?? DEFAULT_MIN_PASSWORD_LENGTH))
  }

  function set(field: RegistrationField, value: string) {
    onValuesChange({ ...values, [field]: value })
  }

  async function submit(event: SubmitEvent) {
    event.preventDefault()
    if (busy) return
    attempted = true
    if (hasRegistrationErrors(validateRegistration(values, policy))) {
      await tick()
      root?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      return
    }
    await onSubmit(values)
  }
</script>

<div bind:this={root} class={['tint-registration', className].filter(Boolean).join(' ')}>
  {#if providers.length}
    <OAuthButtons {providers} ariaLabel={labels.providers} layout={providerLayout} {lastUsed} lastUsedLabel={labels.lastUsed} onSelect={onProviderSelect} />
    <AuthDivider label={labels.divider} />
  {/if}

  <form novalidate onsubmit={submit} aria-busy={busy || undefined}>
    {#if error}<p class="error" role="alert">{error}</p>{/if}
    {#if showDisplayName}
      <TextField id={`${id}-name`} label={labels.displayName} value={values.displayName ?? ''} autocomplete="name" disabled={busy}
        onValueChange={(next) => set('displayName', next)} />
    {/if}
    <TextField id={`${id}-email`} label={labels.email} type="email" value={values.email} autocomplete="email" required disabled={busy}
      error={message(errors.email)} onValueChange={(next) => set('email', next)} />
    <PasswordCredentialInput id={`${id}-password`} label={labels.password} value={values.password} autocomplete="new-password" required disabled={busy}
      description={labels.passwordHint?.replace('{min}', String(policy.minPasswordLength ?? DEFAULT_MIN_PASSWORD_LENGTH))}
      showPasswordLabel={labels.showPassword} hidePasswordLabel={labels.hidePassword}
      error={message(errors.password)} onValueChange={(next) => set('password', next)} />
    {#if policy.inviteRequired}
      <TextField id={`${id}-invite`} label={labels.inviteCode} value={values.inviteCode ?? ''} autocomplete="off" required disabled={busy}
        error={message(errors.inviteCode)} onValueChange={(next) => set('inviteCode', next)} />
    {/if}
    {#if terms}<div class="terms">{@render terms()}</div>{/if}
    <Button type="submit" variant="primary" loading={busy} class="tint-registration-submit">
      {busy ? labels.submitting : labels.submit}
    </Button>
  </form>
</div>

<style>
  .tint-registration, form { display: grid; gap: var(--tint-space-4); }
  .error { margin: 0; padding: var(--tint-space-2) var(--tint-space-3); border-radius: var(--tint-radius-sm); background: var(--tint-danger-soft); color: var(--tint-danger-ink); font-size: .875rem; }
  .terms { color: var(--tint-muted); font-size: .8rem; }
  .tint-registration :global(.tint-registration-submit) { width: 100%; max-width: none; }
</style>
