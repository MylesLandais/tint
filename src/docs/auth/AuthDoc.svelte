<script lang="ts">
  import { onMount } from 'svelte'
  import { createAuthClient } from '../../auth/client'
  import {
    CredentialRecoveryForm, IdentifierSignInForm, OAuthButtons,
    type IdentifierSignInFormLabels, type OAuthOption,
  } from '../../svelte/components/auth'
  import { createDemoTransport, DEMO_CREDENTIALS, DEMO_TOTP_CODE } from './demoTransport'
  import DocPage from '../svelte/DocPage.svelte'
  import type { ApiRow } from '../svelte/types'

  const auth = createAuthClient({ transport: createDemoTransport(), broadcastChannel: false })
  const labels: IdentifierSignInFormLabels = {
    identifier: 'Email or username', password: 'Password', submit: 'Sign in',
    submitting: 'Signing in…', showPassword: 'Show password', hidePassword: 'Hide password',
  }
  let snapshot = $state(auth.getSnapshot())
  let identifier = $state('operator@example.test')
  let password = $state('tint-demo')
  let code = $state('')
  let recoveryIdentifier = $state('operator@example.test')
  let recoveryMessage = $state('')
  let providers = $derived<OAuthOption[]>((snapshot.config?.providers ?? []).map((provider) => ({
    id: provider.id, label: provider.label, href: auth.oauth.url(provider.id),
  })))

  onMount(() => {
    const unsubscribe = auth.subscribe(() => { snapshot = auth.getSnapshot() })
    void auth.initialize().catch(() => { /* The snapshot displays the error. */ })
    return () => { unsubscribe(); auth.destroy() }
  })

  async function attempt(operation: () => Promise<unknown>) {
    try { await operation() } catch { /* The snapshot displays the error. */ }
  }

  const api: ApiRow[] = [
    { prop: 'IdentifierSignInForm', type: 'identifier / password / labels / onChange / onSubmit', description: 'Controlled sign-in fields with busy and error states.' },
    { prop: 'CredentialRecoveryForm', type: 'identifier / label / onIdentifierChange / onSubmit', description: 'Controlled recovery request form.' },
    { prop: 'OAuthButtons', type: 'providers / ariaLabel', description: 'Named navigation landmark with provider links.' },
    { prop: 'AuthClient', type: 'AuthTransport → AuthSnapshot', description: 'Framework-neutral auth state machine and transport contract.' },
    { prop: 'useAuth / useSession', type: 'Svelte reactive snapshot helpers', description: 'Read the shared TintClient auth capability from Svelte context.' },
  ]
  const usage = `import { IdentifierSignInForm } from '@nebula/tint/auth'
import { useAuth, useSession } from '@nebula/tint/client/svelte'

const auth = useAuth()
const session = useSession()
let identifier = $state('')
let password = $state('')

{#if session.isSignedIn}
  <p>Signed in as {session.user?.email}</p>
{:else}
  <IdentifierSignInForm {identifier} {password} {labels}
    onIdentifierChange={(next) => identifier = next}
    onPasswordChange={(next) => password = next}
    onSubmit={() => auth.client.signIn.password({ identifier, password })}
    busy={auth.snapshot.busy} error={auth.snapshot.error?.message} />
{/if}`
</script>

<DocPage title="Auth" description="Transport-neutral authentication with controlled Svelte forms and reactive snapshots. The live transport stays in this page's memory." importPath="@nebula/tint/auth" {usage} {api} accessibility="Each field has an associated label. Validation errors use a live alert, busy states disable submission, OAuth choices are links inside a named navigation landmark, and the six-digit challenge uses a labelled input.">
  <div class="auth-demo">
    <div class="auth-panel">
      {#if snapshot.status === 'loading'}
        <p role="status">Loading the demo session…</p>
      {:else if snapshot.status === 'signed_in'}
        <div class="signed-in">
          <strong>Signed in as {snapshot.session?.user.name}</strong>
          <span>{snapshot.session?.user.email}</span>
          <button type="button" disabled={snapshot.busy} onclick={() => void attempt(() => auth.signOut())}>Sign out</button>
        </div>
      {:else if snapshot.task === 'mfa'}
        <form class="challenge" onsubmit={(event) => { event.preventDefault(); void attempt(() => auth.mfa.verifyTotp({ code })) }}>
          <label for="auth-demo-code">Six-digit code ({DEMO_TOTP_CODE})</label>
          <input id="auth-demo-code" inputmode="numeric" autocomplete="one-time-code" value={code} oninput={(event) => code = event.currentTarget.value} />
          {#if snapshot.error}<p role="alert">{snapshot.error.message}</p>{/if}
          <button type="submit" disabled={snapshot.busy}>Verify code</button>
        </form>
      {:else}
        <IdentifierSignInForm {identifier} {password} {labels}
          onIdentifierChange={(next) => identifier = next}
          onPasswordChange={(next) => password = next}
          onSubmit={() => attempt(() => auth.signIn.password({ identifier, password }))}
          busy={snapshot.busy} error={snapshot.error?.message} />
        <OAuthButtons {providers} ariaLabel="Other sign-in methods" />
      {/if}
    </div>
    <div class="auth-aside">
      <h3>Try the demo</h3>
      <ul>{#each DEMO_CREDENTIALS as credential}<li><code>{credential.email}</code> / <code>{credential.password}</code><br />{credential.outcome}</li>{/each}</ul>
      <h3>Recovery form</h3>
      <CredentialRecoveryForm identifier={recoveryIdentifier} label="Account email" onIdentifierChange={(next) => recoveryIdentifier = next} onSubmit={() => { recoveryMessage = 'Recovery is disabled in this demo transport.' }} />
      {#if recoveryMessage}<p role="status">{recoveryMessage}</p>{/if}
      <p>The demo transport intentionally has no recovery operation. Production hosts provide the operations they support.</p>
    </div>
  </div>
</DocPage>

<style>
  .auth-demo { display: grid; grid-template-columns: minmax(0, 1fr) minmax(13rem, .75fr); gap: 1.5rem; }
  .auth-panel, .auth-aside { min-width: 0; padding: 1.25rem; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-lg); background: var(--tint-surface); }
  .auth-panel { display: grid; align-content: start; gap: 1rem; }
  .auth-aside h3 { margin: .25rem 0 .65rem; color: var(--tint-ink); font-size: .9rem; }
  .auth-aside ul { margin: 0 0 1.5rem; padding-left: 1.1rem; color: var(--tint-muted); font-size: .8rem; line-height: 1.7; }
  .auth-aside li + li { margin-top: .55rem; }
  .auth-aside p { font-size: .8rem; }
  .signed-in, .challenge { display: grid; gap: .75rem; }
  .signed-in span { color: var(--tint-muted); }
  button, input { min-height: 2.5rem; border: 1px solid var(--tint-border-strong); border-radius: var(--tint-radius-sm); padding: .45rem .7rem; background: var(--tint-panel); color: var(--tint-ink); font: inherit; }
  button { cursor: pointer; }
  button:disabled { opacity: .5; cursor: not-allowed; }
  button:focus-visible, input:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
  .challenge label { color: var(--tint-ink); font-size: .85rem; }
  @container (max-width: 760px) { .auth-demo { grid-template-columns: 1fr; } }
</style>
