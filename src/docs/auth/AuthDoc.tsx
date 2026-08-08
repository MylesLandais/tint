import { useMemo, useState } from 'react'
import { createAuthClient } from '@/auth/client'
import {
  AuthProvider,
  OAuthButtons,
  SignInForm,
  useAuth,
  useSession,
  type OAuthOption,
  type SignInFormLabels,
} from '@/components/auth'
import '@/components/auth/styles.css'
import { CodeBlock } from '../components/CodeBlock'
import { DocsNav } from '../components/DocsNav'
import { PropsTable } from '../components/PropsTable'
import { createDemoTransport, DEMO_CREDENTIALS, DEMO_TOTP_CODE } from './demoTransport'

const LABELS: SignInFormLabels = {
  email: 'Email',
  password: 'Password',
  submit: 'Sign in',
  submitting: 'Signing in…',
  showPassword: 'Show password',
  hidePassword: 'Hide password',
}

const usageCode = `import { createAuthClient } from 'tint/auth-client'
import { AuthProvider, SignInForm, useAuth, useSession } from 'tint/auth'
import 'tint/auth/styles.css'

// The client is transport-agnostic: implement AuthTransport against your backend.
const client = createAuthClient({ transport: httpTransport })

export function App() {
  return (
    <AuthProvider client={client}>
      <SignInScreen />
    </AuthProvider>
  )
}

function SignInScreen() {
  const { client, snapshot } = useAuth()
  const { isSignedIn, user } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (isSignedIn) return <p>Signed in as {user?.email}</p>

  return (
    <SignInForm
      email={email}
      password={password}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={() => client.signIn.password({ email, password })}
      busy={snapshot.busy}
      error={snapshot.error?.message}
      labels={labels}
    />
  )
}`

const transportCode = `import { authErrorFromResponse, type AuthTransport } from 'tint/auth-client'

export const httpTransport: AuthTransport = {
  // Required — everything else is optional, and a missing method makes the
  // matching flow throw UnsupportedAuthOperationError. That is how a deployment
  // declares which flows it offers.
  getConfig: () => get('/auth/config'),
  getSession: () => get('/auth/session'),
  signOut: () => post('/auth/sign-out'),
  oauthStartUrl: (provider, returnTo) =>
    \`/auth/oauth/\${provider}?return_to=\${encodeURIComponent(returnTo ?? '/')}\`,

  signInPassword: (input) => post('/auth/sign-in', input),
  verifyTotp: (input) => post('/auth/mfa/totp', input),
}

async function post(path: string, body?: unknown) {
  const response = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
  if (!response.ok) throw await authErrorFromResponse(response)
  return response.json()
}`

const signInFormProps = [
  { name: 'email', type: 'string', required: true, description: 'Controlled email value.' },
  { name: 'password', type: 'string', required: true, description: 'Controlled password value.' },
  { name: 'labels', type: 'SignInFormLabels', required: true, description: 'All six strings; the component ships no default copy.' },
  { name: 'onEmailChange', type: '(value: string) => void', required: true, description: 'Receives each email keystroke.' },
  { name: 'onPasswordChange', type: '(value: string) => void', required: true, description: 'Receives each password keystroke.' },
  { name: 'onSubmit', type: '() => void | Promise<void>', required: true, description: 'Fires on submit unless busy; the form calls preventDefault for you.' },
  { name: 'busy', type: 'boolean', defaultValue: 'false', description: 'Disables submit and swaps in the submitting label.' },
  { name: 'error', type: 'ReactNode', description: 'Rendered in a role="alert" region above the fields.' },
  { name: 'emailPlaceholder', type: 'string', description: 'Placeholder for the email input.' },
  { name: 'passwordPlaceholder', type: 'string', description: 'Placeholder for the password input.' },
  { name: 'className', type: 'string', description: 'Appended to the tint-auth-form class.' },
]

const oauthProps = [
  { name: 'providers', type: 'readonly OAuthOption[]', required: true, description: 'Rendered as real anchors; an empty list renders nothing.' },
  { name: 'ariaLabel', type: 'string', required: true, description: 'Accessible name for the surrounding nav landmark.' },
  { name: 'className', type: 'string', description: 'Appended to the tint-auth-oauth class.' },
]

const sessionProps = [
  { name: 'session', type: 'AuthSession | null', description: 'The full session, including memberships and capabilities.' },
  { name: 'user', type: 'AuthUser | null', description: 'Shorthand for session.user.' },
  { name: 'status', type: "'loading' | 'signed_out' | 'pending' | 'signed_in' | 'error'", description: 'The state machine position.' },
  { name: 'task', type: 'AuthTask | null', description: 'A required next step, e.g. mfa or verify_email.' },
  { name: 'isLoaded', type: 'boolean', description: 'False only while the initial session fetch is in flight.' },
  { name: 'isSignedIn', type: 'boolean', description: 'True when status is signed_in.' },
]

const transportProps = [
  { name: 'getConfig', type: '() => Promise<AuthConfig>', required: true, description: 'Enabled methods and OAuth providers.' },
  { name: 'getSession', type: '() => Promise<AuthSession | null>', required: true, description: 'Called on initialize and refresh.' },
  { name: 'signOut', type: '() => Promise<void>', required: true, description: 'Clears the server session.' },
  { name: 'oauthStartUrl', type: '(provider, returnTo?) => string', required: true, description: 'returnTo is sanitised by safeReturnTo first.' },
  { name: 'signInPassword', type: '(input) => Promise<AuthFlowResult>', description: 'Omit to disable password sign-in.' },
  { name: 'signUpPassword', type: '(input) => Promise<AuthFlowResult>', description: 'Omit to disable registration.' },
  { name: 'verifyTotp', type: '(input) => Promise<AuthFlowResult>', description: 'Resolves a pending mfa task.' },
  { name: 'requestPasswordReset', type: '(input) => Promise<AuthFlowResult>', description: 'Omit to disable recovery.' },
  { name: 'selectOrganization', type: '(input) => Promise<AuthFlowResult>', description: 'Resolves a choose_organization task.' },
]

function SnapshotRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-tint-border py-1.5 last:border-b-0">
      <span className="text-tint-muted">{label}</span>
      <span className="font-mono text-[13px] text-tint-ink">{value}</span>
    </div>
  )
}

function AuthDemo() {
  const { client, snapshot } = useAuth()
  const { user, status, task, isSignedIn } = useSession()
  const [email, setEmail] = useState('operator@example.test')
  const [password, setPassword] = useState('tint-demo')
  const [code, setCode] = useState('')
  const [unsupported, setUnsupported] = useState<string>()

  const providers: OAuthOption[] = (snapshot.config?.providers ?? []).map((provider) => ({
    id: provider.id,
    label: provider.label,
    href: client.oauth.url(provider.id),
  }))

  async function attempt(run: () => Promise<unknown>) {
    setUnsupported(undefined)
    try {
      await run()
    } catch {
      // The snapshot already carries the error; nothing more to do here.
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
      <div className="rounded-xl border border-tint-border bg-tint-panel p-5">
        {isSignedIn ? (
          <div className="flex flex-col gap-4">
            <div>
              <p className="m-0 text-sm text-tint-muted">Signed in as</p>
              <p className="m-0 text-lg font-semibold text-tint-ink">{user?.displayName}</p>
              <p className="m-0 text-sm text-tint-muted">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={() => void attempt(() => client.signOut())}
              className="self-start rounded-md border border-tint-border px-3 py-1.5 text-sm text-tint-ink hover:bg-tint-surface"
            >
              Sign out
            </button>
          </div>
        ) : task === 'mfa' ? (
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault()
              void attempt(() => client.mfa.verifyTotp({ code }))
            }}
          >
            <label className="text-sm text-tint-muted" htmlFor="demo-totp">
              Enter the six-digit code ({DEMO_TOTP_CODE})
            </label>
            <input
              id="demo-totp"
              value={code}
              inputMode="numeric"
              onChange={(event) => setCode(event.target.value)}
              className="rounded-md border border-tint-border bg-tint-surface px-3 py-2 font-mono text-tint-ink"
            />
            {snapshot.error ? (
              <p role="alert" className="m-0 text-sm text-tint-danger">
                {snapshot.error.message}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={snapshot.busy}
              className="self-start rounded-md bg-tint-accent px-3 py-1.5 text-sm text-tint-on-accent disabled:opacity-50"
            >
              {snapshot.busy ? 'Verifying…' : 'Verify'}
            </button>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <SignInForm
              email={email}
              password={password}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onSubmit={() => attempt(() => client.signIn.password({ email, password }))}
              busy={snapshot.busy}
              error={snapshot.error?.message}
              labels={LABELS}
            />
            <OAuthButtons providers={providers} ariaLabel="Continue with a provider" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-tint-border bg-tint-panel p-5 text-sm">
          <p className="mt-0 mb-3 font-semibold text-tint-ink">AuthSnapshot</p>
          <SnapshotRow label="status" value={status} />
          <SnapshotRow label="busy" value={String(snapshot.busy)} />
          <SnapshotRow label="task" value={task ?? 'null'} />
          <SnapshotRow label="error.code" value={snapshot.error?.code ?? 'null'} />
          <SnapshotRow label="providers" value={String(snapshot.config?.providers.length ?? 0)} />
        </div>

        <div className="rounded-xl border border-tint-border bg-tint-panel p-5 text-sm">
          <p className="mt-0 mb-2 font-semibold text-tint-ink">Unsupported flows</p>
          <p className="mt-0 mb-3 text-tint-muted">
            The demo transport omits <code>signUpPassword</code>, so the client refuses the call.
          </p>
          <button
            type="button"
            onClick={() => {
              try {
                void client.signUp.password({ email, password })
              } catch (error) {
                setUnsupported(error instanceof Error ? error.message : String(error))
              }
            }}
            className="rounded-md border border-tint-border px-3 py-1.5 text-sm text-tint-ink hover:bg-tint-surface"
          >
            Try to sign up
          </button>
          {unsupported ? (
            <p role="alert" className="mt-3 mb-0 text-tint-danger">
              {unsupported}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function AuthDoc() {
  // One client for the life of the page; the demo transport holds its state in a closure.
  const client = useMemo(
    () => createAuthClient({ transport: createDemoTransport(), broadcastChannel: false }),
    [],
  )

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <div className="mx-auto max-w-[1200px]">
        <DocsNav current="components/auth" />

        <section className="mb-8 max-w-3xl">
          <p className="m-0 text-xs font-semibold tracking-[0.14em] text-tint-accent uppercase">
            Identity
          </p>
          <h1 className="mt-2 mb-3 text-3xl font-semibold tracking-tight text-tint-ink sm:text-4xl">
            Auth
          </h1>
          <p className="m-0 text-base leading-7 text-tint-muted">
            Controlled sign-in primitives over a transport-agnostic session client. Your application
            owns the network; Tint owns the state machine and the markup.
          </p>
        </section>

        <section id="preview" className="mb-14 scroll-mt-24">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-tint-warning-soft px-2.5 py-1 text-xs text-tint-warning-ink">
              Demo transport — no network
            </span>
          </div>
          <AuthProvider client={client}>
            <AuthDemo />
          </AuthProvider>

          <div className="mt-6 overflow-x-auto rounded-xl border border-tint-border bg-tint-panel">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-tint-surface text-tint-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Password</th>
                  <th className="px-4 py-3 font-medium">Result</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_CREDENTIALS.map((row) => (
                  <tr key={row.email} className="border-t border-tint-border align-top">
                    <td className="px-4 py-3 font-mono text-[13px] text-tint-accent">{row.email}</td>
                    <td className="px-4 py-3 font-mono text-[13px] text-tint-ink">{row.password}</td>
                    <td className="px-4 py-3 text-tint-muted">{row.outcome}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="usage" className="mb-14 max-w-3xl scroll-mt-24">
          <h2 className="mb-3 text-2xl font-semibold tracking-tight text-tint-ink">Usage</h2>
          <CodeBlock code={usageCode} language="tsx" />
          <p className="mt-6 mb-3 text-tint-muted">
            The client talks to your backend through one interface. Which optional methods you
            implement is what decides which flows exist.
          </p>
          <CodeBlock code={transportCode} language="ts" />
        </section>

        <section id="api" className="scroll-mt-24">
          <h2 className="mb-2 text-2xl font-semibold tracking-tight text-tint-ink">API</h2>
          <p className="mb-6 max-w-2xl text-tint-muted">Required props are marked with an asterisk.</p>

          <h3 className="mb-3 text-lg font-semibold text-tint-ink">SignInForm</h3>
          <PropsTable rows={signInFormProps} />

          <h3 className="mt-10 mb-3 text-lg font-semibold text-tint-ink">OAuthButtons</h3>
          <PropsTable rows={oauthProps} />

          <h3 className="mt-10 mb-3 text-lg font-semibold text-tint-ink">useSession()</h3>
          <PropsTable rows={sessionProps} />

          <h3 className="mt-10 mb-3 text-lg font-semibold text-tint-ink">AuthTransport</h3>
          <PropsTable rows={transportProps} />
        </section>
      </div>
    </main>
  )
}
