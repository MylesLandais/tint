<script lang="ts">
  import { tick, type Snippet } from 'svelte'
  import TextField from '../../form/TextField.svelte'
  import Button from '../button/Button.svelte'
  import AuthDivider from './AuthDivider.svelte'
  import OAuthButtons from './OAuthButtons.svelte'
  import PasswordCredentialInput from './PasswordCredentialInput.svelte'
  import type { LoginFormLabels, OAuthOption } from './types'

  type Props = {
    identifier: string
    password: string
    onIdentifierChange: (value: string) => void
    onPasswordChange: (value: string) => void
    /** Called once the credential step is complete. In `email-first` mode that is after the password step. */
    onSubmit: () => void | Promise<void>
    labels: LoginFormLabels
    /** `password` shows both fields at once; `email-first` asks for the identifier, then the password. */
    mode?: 'password' | 'email-first'
    identifierType?: 'email' | 'text'
    providers?: readonly OAuthOption[]
    providerLayout?: 'stack' | 'row'
    /** Usually `AuthSnapshot.lastUsedMethod`. Marks the matching provider. */
    lastUsed?: string | null
    onProviderSelect?: (provider: OAuthOption, event: MouseEvent) => void
    forgotPasswordHref?: string
    busy?: boolean
    error?: string
    /** Extra sign-in route under the submit button, for example "Use passkey instead". */
    alternate?: Snippet
    class?: string
  }

  let {
    identifier, password, onIdentifierChange, onPasswordChange, onSubmit, labels,
    mode = 'password', identifierType = 'email', providers = [], providerLayout = 'stack',
    lastUsed = null, onProviderSelect, forgotPasswordHref, busy = false, error, alternate, class: className,
  }: Props = $props()

  const id = $props.id()
  let step = $state<'identifier' | 'password'>('identifier')
  let missing = $state<'identifier' | 'password' | null>(null)
  let root: HTMLDivElement | undefined = $state()

  let showPassword = $derived(mode === 'password' || step === 'password')
  let finalStep = $derived(showPassword)

  async function focus(field: 'identifier' | 'password') {
    await tick()
    root?.querySelector<HTMLInputElement>(`#${CSS.escape(`${id}-${field}`)}`)?.focus()
  }

  function submit(event: SubmitEvent) {
    event.preventDefault()
    if (busy) return
    if (!identifier.trim()) {
      missing = 'identifier'
      void focus('identifier')
      return
    }
    if (!finalStep) {
      missing = null
      step = 'password'
      void focus('password')
      return
    }
    if (!password) {
      missing = 'password'
      void focus('password')
      return
    }
    missing = null
    void onSubmit()
  }

  function changeIdentifier() {
    step = 'identifier'
    missing = null
    void focus('identifier')
  }
</script>

<div bind:this={root} class={['tint-login', className].filter(Boolean).join(' ')} data-mode={mode} data-step={mode === 'email-first' ? step : undefined}>
  {#if providers.length}
    <OAuthButtons {providers} ariaLabel={labels.providers} layout={providerLayout} {lastUsed} lastUsedLabel={labels.lastUsed} onSelect={onProviderSelect} />
    <AuthDivider label={labels.divider} />
  {/if}

  <form novalidate onsubmit={submit} aria-busy={busy || undefined}>
    {#if error}<p class="error" role="alert">{error}</p>{/if}

    {#if mode === 'email-first' && step === 'password'}
      <div class="identity">
        <span>{identifier}</span>
        <button type="button" class="link" onclick={changeIdentifier}>{labels.changeIdentifier}</button>
      </div>
    {:else}
      <TextField
        id={`${id}-identifier`}
        label={labels.identifier}
        type={identifierType}
        value={identifier}
        autocomplete={identifierType === 'email' ? 'email' : 'username'}
        required
        disabled={busy}
        error={missing === 'identifier' ? labels.identifierRequired : undefined}
        onValueChange={onIdentifierChange}
      />
    {/if}

    {#if showPassword}
      <div class="password">
        <PasswordCredentialInput
          id={`${id}-password`}
          label={labels.password}
          value={password}
          autocomplete="current-password"
          required
          disabled={busy}
          showPasswordLabel={labels.showPassword}
          hidePasswordLabel={labels.hidePassword}
          error={missing === 'password' ? labels.passwordRequired : undefined}
          onValueChange={onPasswordChange}
        />
        {#if forgotPasswordHref && labels.forgotPassword}<a class="link" href={forgotPasswordHref}>{labels.forgotPassword}</a>{/if}
      </div>
    {/if}

    <Button type="submit" variant="primary" loading={busy} class="tint-login-submit">
      {busy ? labels.submitting : finalStep ? labels.submit : labels.continue}
    </Button>
  </form>

  {#if alternate}<div class="alternate">{@render alternate()}</div>{/if}
</div>

<style>
  .tint-login, form { display: grid; gap: var(--tint-space-4); }
  .password { display: grid; gap: var(--tint-space-2); }
  .identity { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: var(--tint-space-2); padding: var(--tint-space-2) var(--tint-space-3); border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); background: var(--tint-surface); overflow-wrap: anywhere; }
  .error { margin: 0; padding: var(--tint-space-2) var(--tint-space-3); border-radius: var(--tint-radius-sm); background: var(--tint-danger-soft); color: var(--tint-danger-ink); font-size: .875rem; }
  .link { justify-self: start; padding: 0; border: 0; background: none; color: var(--tint-accent); font: inherit; font-size: .8rem; text-decoration: underline; text-underline-offset: 2px; cursor: pointer; }
  .link:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
  .alternate { display: flex; justify-content: center; font-size: .85rem; }
  .tint-login :global(.tint-login-submit) { width: 100%; max-width: none; }
</style>
