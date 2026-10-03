<script lang="ts">
  import { onMount } from 'svelte'
  import { createAuthClient } from '../../auth/client'
  import { createLastUsedStore, providerName } from '../../core/auth'
  import {
    AuthLayout, LoginForm, RegistrationForm,
    type LoginFormLabels, type OAuthOption, type RegistrationFormLabels, type RegistrationInput,
  } from '../../svelte/components/auth'
  import { createDemoTransport } from './demoTransport'
  import DocPage from '../svelte/DocPage.svelte'
  import type { ApiRow } from '../svelte/types'

  type Scenario = 'stacked' | 'card' | 'split' | 'register'
  const scenarios: { id: Scenario; label: string }[] = [
    { id: 'stacked', label: 'Stacked' },
    { id: 'card', label: 'Card' },
    { id: 'split', label: 'Split' },
    { id: 'register', label: 'Registration' },
  ]

  const transport = createDemoTransport({ registration: true })
  // A docs-only key, so the demo never marks a provider in a host app on the same origin.
  const auth = createAuthClient({ transport, broadcastChannel: false, lastUsed: createLastUsedStore({ key: 'tint-docs-auth-last-method' }) })

  let snapshot = $state(auth.getSnapshot())
  let scenario = $state<Scenario>('stacked')
  let identifier = $state('operator@example.test')
  let password = $state('')
  let registration = $state<RegistrationInput>({ displayName: '', email: '', password: '' })
  let notice = $state('')

  const loginLabels: LoginFormLabels = {
    identifier: 'Email', password: 'Password', submit: 'Sign in', continue: 'Continue', submitting: 'Signing in…',
    showPassword: 'Show password', hidePassword: 'Hide password',
    identifierRequired: 'Enter your email address.', passwordRequired: 'Enter your password.',
    changeIdentifier: 'Use a different email', forgotPassword: 'Forgotten password?',
    providers: 'Sign in with a provider', divider: 'or', lastUsed: 'Last used',
  }
  const registrationLabels: RegistrationFormLabels = {
    displayName: 'Name', email: 'Email', password: 'Password', passwordHint: 'At least {min} characters.',
    inviteCode: 'Invite code', submit: 'Create account', submitting: 'Creating account…',
    showPassword: 'Show password', hidePassword: 'Hide password',
    providers: 'Sign up with a provider', divider: 'or', lastUsed: 'Last used',
    errors: { required: 'This field is required.', invalid_email: 'Enter a valid email address.', password_too_short: 'Use at least {min} characters.' },
  }

  function providers(verb: string): OAuthOption[] {
    return (snapshot.config?.providers ?? []).map((provider) => ({
      id: provider.id,
      label: [verb, providerName(provider.id)].filter(Boolean).join(' '),
      href: auth.oauth.url(provider.id),
    }))
  }

  onMount(() => {
    const unsubscribe = auth.subscribe(() => { snapshot = auth.getSnapshot() })
    void auth.initialize().catch(() => { /* The snapshot displays the error. */ })
    return () => { unsubscribe(); auth.destroy() }
  })

  async function attempt(operation: () => Promise<unknown>) {
    try { await operation() } catch { /* The snapshot displays the error. */ }
  }

  function selectProvider(provider: OAuthOption, event: MouseEvent) {
    // The demo has no provider to redirect to; it completes the round trip in memory.
    event.preventDefault()
    transport.completeOAuth(provider.id)
    void attempt(() => auth.refresh())
  }

  function show(next: Scenario) {
    scenario = next
    notice = ''
  }

  const api: ApiRow[] = [
    { prop: 'AuthLayout', type: "variant: 'plain' | 'card' | 'split'; title; subtitle?; headingLevel?; logo? / footer? / aside? snippets", description: 'Page frame for sign-in and registration. The split aside hides when the container is too narrow for two columns.' },
    { prop: 'LoginForm', type: "identifier / password + on…Change; onSubmit; labels: LoginFormLabels; mode?: 'password' | 'email-first'", description: 'Providers, divider and credential step. Email-first asks for the identifier, then the password, with a way back.' },
    { prop: 'LoginForm extras', type: "providers?; providerLayout?: 'stack' | 'row'; lastUsed?; onProviderSelect?; forgotPasswordHref?; alternate?: Snippet", description: 'alternate renders under the submit button, for example a passkey link.' },
    { prop: 'RegistrationForm', type: 'values: RegistrationInput; onValuesChange; onSubmit(values); labels; policy?: { inviteRequired?, minPasswordLength? }; terms?: Snippet', description: 'Validates with validateRegistration on submit, then live. The invite field appears only when the policy requires it.' },
    { prop: 'OAuthButtons', type: "providers; ariaLabel; layout?: 'stack' | 'row'; lastUsed?; lastUsedLabel?; onSelect?", description: 'Known ids (discord, github, google) get their brand mark unless an icon snippet is supplied. The last-used link gets an accent ring and an info badge.' },
    { prop: 'AuthDivider / ProviderMark', type: 'label? / provider, size?', description: 'The labelled "or" rule, and the brand mark on its own.' },
    { prop: 'AuthSnapshot.lastUsedMethod', type: 'string | null', description: "The current session's method, else AuthConfig.lastUsedMethod from the server, else this device's memory. Pass it to lastUsed." },
    { prop: 'createLastUsedStore', type: '({ storage?, key? }) => LastUsedStore', description: 'Device memory for the last method. Defaults to localStorage and never throws. Pass lastUsed: false to createAuthClient to turn it off.' },
  ]

  const usage = `import { AuthLayout, LoginForm } from '@nebula/tint/svelte'
import { useAuth } from '@nebula/tint/client/svelte'

const auth = useAuth()
const providers = $derived((auth.snapshot.config?.providers ?? []).map((p) => ({
  id: p.id, label: p.label, href: auth.client.oauth.url(p.id, { returnTo: '/app' }),
})))
let identifier = $state('')
let password = $state('')

<AuthLayout variant="card" title="Sign in to Acme">
  <LoginForm mode="email-first" {providers} lastUsed={auth.snapshot.lastUsedMethod}
    {identifier} {password} {labels}
    onIdentifierChange={(next) => identifier = next}
    onPasswordChange={(next) => password = next}
    onSubmit={() => auth.client.signIn.password({ identifier, password })}
    busy={auth.snapshot.busy} error={auth.snapshot.error?.message} />
  {#snippet footer()}Don't have an account? <a href="/register">Sign up</a>{/snippet}
</AuthLayout>`

  const contract = `// What a host's AuthTransport provides for each provider.
getConfig: async () => ({
  providers: [{ id: 'github', label: 'Continue with GitHub', kind: 'oauth' }],
  lastUsedMethod: cookies.get('last_login_method') ?? null, // optional server hint
  // …
}),
// Begins the redirect. returnTo has already been through safeReturnTo.
oauthStartUrl: (provider, returnTo) => \`/auth/oauth/\${provider}?return_to=\${encodeURIComponent(returnTo ?? '/')}\`,
// After the callback, the session names the method that produced it.
getSession: async () => ({ /* … */ authenticationMethods: ['github'] }),`
</script>

<DocPage
  title="Sign-in & registration"
  description="Login and registration layouts with Discord, GitHub and Google providers, an email-first step, and a last-used marker. Everything on this page runs against an in-memory transport."
  importPath="@nebula/tint/svelte"
  {usage}
  {api}
  accessibility="Each layout has one heading, and every field has a visible label and an error message linked to it. Providers are links inside a named navigation landmark. The Last used badge is part of the link text, so screen readers hear it with the provider name. The divider is a labelled separator. Invalid submits move focus to the first invalid field, and the email-first step moves focus to the password and back again.">
  <div class="forms-demo">
    <fieldset class="scenarios">
      <legend>Layout</legend>
      {#each scenarios as option (option.id)}
        <label><input type="radio" name="auth-forms-scenario" value={option.id} checked={scenario === option.id} onchange={() => show(option.id)} /> {option.label}</label>
      {/each}
    </fieldset>

    <div class="stage" data-scenario={scenario}>
      {#if snapshot.status === 'loading'}
        <p role="status">Loading the demo session…</p>
      {:else if snapshot.status === 'signed_in'}
        <div class="signed-in">
          <strong>Signed in as {snapshot.session?.user.name}</strong>
          <span>with {providerName(snapshot.session?.authenticationMethods[0] ?? 'password')}</span>
          <button type="button" disabled={snapshot.busy} onclick={() => void attempt(() => auth.signOut())}>Sign out</button>
        </div>
      {:else if scenario === 'stacked'}
        <AuthLayout title="Log in" headingLevel={3}>
          {#snippet logo()}<span class="mark" aria-hidden="true"></span>{/snippet}
          <LoginForm mode="email-first" providers={providers('Continue with')} lastUsed={snapshot.lastUsedMethod}
            onProviderSelect={selectProvider}
            {identifier} {password} labels={loginLabels}
            onIdentifierChange={(next) => identifier = next} onPasswordChange={(next) => password = next}
            onSubmit={() => attempt(() => auth.signIn.password({ identifier, password }))}
            busy={snapshot.busy} error={snapshot.error?.message} />
          {#snippet footer()}Don't have an account? <button type="button" class="link" onclick={() => show('register')}>Create your account</button>{/snippet}
        </AuthLayout>
      {:else if scenario === 'card'}
        <AuthLayout variant="card" title="Sign in to Tint" subtitle="Welcome back! Please sign in to continue." headingLevel={3}>
          {#snippet logo()}<span class="mark" aria-hidden="true"></span>{/snippet}
          <LoginForm mode="email-first" providers={providers('')} providerLayout="row" lastUsed={snapshot.lastUsedMethod}
            onProviderSelect={selectProvider}
            {identifier} {password} labels={loginLabels}
            onIdentifierChange={(next) => identifier = next} onPasswordChange={(next) => password = next}
            onSubmit={() => attempt(() => auth.signIn.password({ identifier, password }))}
            busy={snapshot.busy} error={snapshot.error?.message}>
            {#snippet alternate()}<button type="button" class="link" onclick={() => notice = 'Passkeys are a host transport operation; this demo does not offer one.'}>Use passkey instead</button>{/snippet}
          </LoginForm>
          {#if notice}<p class="notice" role="status">{notice}</p>{/if}
          {#snippet footer()}Don't have an account? <button type="button" class="link" onclick={() => show('register')}>Sign up</button>{/snippet}
        </AuthLayout>
      {:else if scenario === 'split'}
        <AuthLayout variant="split" title="Sign in to your account" headingLevel={3}>
          <LoginForm providers={providers('')} providerLayout="row" lastUsed={snapshot.lastUsedMethod}
            onProviderSelect={selectProvider} forgotPasswordHref="#/components/auth"
            {identifier} {password} labels={loginLabels}
            onIdentifierChange={(next) => identifier = next} onPasswordChange={(next) => password = next}
            onSubmit={() => attempt(() => auth.signIn.password({ identifier, password }))}
            busy={snapshot.busy} error={snapshot.error?.message} />
          {#snippet footer()}<button type="button" class="link" onclick={() => show('register')}>Need an account?</button>{/snippet}
          {#snippet aside()}
            <div class="aside">
              <p>Tokens, not paint.<br />One theme, many palettes.<br />Same form.</p>
              <span>— the split layout's aside</span>
            </div>
          {/snippet}
        </AuthLayout>
      {:else}
        <AuthLayout title="Create your account" headingLevel={3}>
          {#snippet logo()}<span class="mark" aria-hidden="true"></span>{/snippet}
          <RegistrationForm providers={providers('Sign up with')} lastUsed={snapshot.lastUsedMethod}
            onProviderSelect={selectProvider}
            values={registration} onValuesChange={(next) => registration = next}
            policy={{ inviteRequired: snapshot.config?.inviteRequired ?? false }}
            labels={registrationLabels}
            onSubmit={(values) => attempt(() => auth.signUp.password({ identifier: values.email.trim(), password: values.password, displayName: values.displayName }))}
            busy={snapshot.busy} error={snapshot.error?.message}>
            {#snippet terms()}By creating an account you agree to the demo's imaginary terms.{/snippet}
          </RegistrationForm>
          {#snippet footer()}Already have an account? <button type="button" class="link" onclick={() => show('stacked')}>Log in</button>{/snippet}
        </AuthLayout>
      {/if}
    </div>
    <p class="hint">Sign in with <code>operator@example.test</code> / <code>tint-demo</code>, or pick a provider. After you sign out, the method you used carries the <strong>Last used</strong> badge in every layout.</p>
  </div>

  {#snippet extra()}
    <section id="server-contract" aria-labelledby="server-contract-title">
      <h2 id="server-contract-title" tabindex="-1">Server contract</h2>
      <p>Tint ships no server. Provider sign-in works through the same <code>AuthTransport</code> as passwords. The host lists its providers in <code>getConfig</code>, builds the redirect in <code>oauthStartUrl</code>, and after its callback reports the session with the provider as the first authentication method. The client records that method as last used, both in the snapshot and on the device. A server that remembers the method itself, for example in a cookie, can return it as <code>lastUsedMethod</code>, and that takes precedence when nobody is signed in.</p>
      <pre><code>{contract}</code></pre>
    </section>
  {/snippet}
</DocPage>

<style>
  .forms-demo { display: grid; gap: var(--tint-space-4); }
  .scenarios { display: flex; flex-wrap: wrap; gap: var(--tint-space-2) var(--tint-space-4); margin: 0; padding: 0; border: 0; }
  .scenarios legend { margin-bottom: var(--tint-space-2); color: var(--tint-muted); font-size: var(--tint-font-size-xs); text-transform: uppercase; letter-spacing: .04em; }
  .scenarios label { display: inline-flex; align-items: center; gap: var(--tint-space-1); color: var(--tint-ink); font-size: .875rem; cursor: pointer; }
  .stage { display: grid; min-height: 34rem; overflow: hidden; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-lg); background: var(--tint-panel); }
  .stage[data-scenario='card'] { padding: var(--tint-space-5) var(--tint-space-3); background: var(--tint-surface); }
  .stage > p[role='status'] { place-self: center; color: var(--tint-muted); }
  .signed-in { display: grid; place-self: center; justify-items: center; gap: var(--tint-space-2); padding: var(--tint-space-5); text-align: center; }
  .signed-in span { color: var(--tint-muted); }
  .signed-in button { min-height: 2.5rem; margin-top: var(--tint-space-2); border: 1px solid var(--tint-border-strong); border-radius: var(--tint-radius-sm); padding: .45rem .9rem; background: var(--tint-panel); color: var(--tint-ink); font: inherit; cursor: pointer; }
  .signed-in button:focus-visible, .link:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
  .mark { display: block; width: 2rem; height: 2rem; border-radius: 40% 40% 50% 50%; background: var(--tint-accent); }
  .link { padding: 0; border: 0; background: none; color: var(--tint-accent); font: inherit; text-decoration: underline; text-underline-offset: 2px; cursor: pointer; }
  .notice { margin: 0; color: var(--tint-muted); font-size: .8rem; text-align: center; }
  .aside { display: grid; align-content: start; gap: var(--tint-space-3); height: 100%; padding: var(--tint-space-6) var(--tint-space-5); color: var(--tint-accent); }
  .aside p { margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 1.15rem; line-height: 1.5; }
  .aside span { font-size: .85rem; }
  .hint { margin: 0; color: var(--tint-muted); font-size: .8rem; }
  #server-contract pre { overflow-x: auto; }
</style>
