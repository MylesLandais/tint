import { AuthError, type AuthSession, type AuthTransport } from '../../auth/client'

/**
 * An in-memory `AuthTransport` for the docs.
 *
 * Tint ships no backend, so the docs fake the network the same way the Terminal
 * page fakes a PTY and the Collab page fakes a peer. Everything here is state in
 * a closure; nothing leaves the tab.
 */

export const DEMO_CREDENTIALS = [
  { email: 'operator@example.test', password: 'tint-demo', outcome: 'Signs in.' },
  { email: 'mfa@example.test', password: 'tint-demo', outcome: 'Returns task "mfa" — code 123456.' },
  { email: 'anything else', password: '—', outcome: 'AuthError 401 invalid_credentials.' },
] as const

export const DEMO_TOTP_CODE = '123456'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function sessionFor(email: string, method = 'password', name?: string): AuthSession {
  return {
    id: 'session_demo',
    user: {
      id: 'user_demo',
      principalRef: `user:${email}`,
      name: name || (email.split('@')[0] ?? 'Operator'),
      email,
      emailVerified: true,
    },
    activeOrganizationId: 'org_tint',
    memberships: [
      {
        organizationId: 'org_tint',
        organizationSlug: 'tint',
        organizationName: 'Tint',
        role: 'admin',
      },
    ],
    capabilities: ['documents:read', 'documents:write'],
    authenticationMethods: [method],
    authenticatedAt: new Date().toISOString(),
  }
}

export type DemoTransport = AuthTransport & {
  /**
   * Stands in for the provider round trip: a real host redirects to
   * `oauthStartUrl`, and its callback route sets the session before the app
   * reloads. Call `client.refresh()` afterwards to pick the session up.
   */
  completeOAuth(provider: string): void
}

export type DemoTransportOptions = {
  /** Offer `signUpPassword`. Off by default so the client page can show the unsupported-operation path. */
  registration?: boolean
}

export function createDemoTransport(options: DemoTransportOptions = {}): DemoTransport {
  let session: AuthSession | null = null
  let pending: AuthSession | null = null

  const transport: DemoTransport = {
    async getConfig() {
      await delay(200)
      return {
        version: 'v2',
        identifierKind: 'either',
        password: {
          enabled: true,
          signUpEnabled: Boolean(options.registration),
          verificationRequired: false,
          recoveryEnabled: false,
        },
        providers: [
          { id: 'google', label: 'Continue with Google', kind: 'oauth' },
          { id: 'github', label: 'Continue with GitHub', kind: 'oauth' },
          { id: 'discord', label: 'Continue with Discord', kind: 'oauth' },
        ],
        inviteRequired: false,
      }
    },

    async getSession() {
      await delay(150)
      return session
    },

    async signInPassword({ identifier, password }) {
      await delay(450)
      if (password !== 'tint-demo') {
        throw new AuthError('invalid_credentials', 'The credentials were not accepted.', {
          status: 401,
        })
      }
      if (identifier === 'mfa@example.test') {
        pending = sessionFor(identifier)
        return { session: null, task: 'mfa', message: `Enter ${DEMO_TOTP_CODE} to continue.` }
      }
      session = sessionFor(identifier)
      return { session, task: null }
    },

    async verifyTotp({ code }) {
      await delay(350)
      if (code !== DEMO_TOTP_CODE) {
        throw new AuthError('invalid_code', 'That code did not match.', { status: 401 })
      }
      session = pending
      pending = null
      return { session, task: null }
    },

    async signOut() {
      await delay(200)
      session = null
      pending = null
    },

    completeOAuth(provider) {
      session = sessionFor(`${provider}-user@example.test`, provider)
    },

    // Inert: `OAuthButtons` renders real anchors, so a live URL would navigate the
    // docs site away. Production reads `client.oauth.url(provider)`.
    oauthStartUrl: () => '#/components/auth',

    // `requestCredentialRecovery` and `selectOrganization` (and `signUpPassword`
    // unless `registration` is set) are left undefined on purpose — calling them
    // raises `UnsupportedAuthOperationError`, which is how a deployment declares
    // which flows it does not offer.
  }

  if (options.registration) {
    transport.signUpPassword = async ({ identifier, displayName }) => {
      await delay(450)
      if (identifier === 'operator@example.test') {
        throw new AuthError('identifier_taken', 'An account with that email already exists.', { status: 409 })
      }
      session = sessionFor(identifier, 'password', displayName)
      return { session, task: null }
    }
  }

  return transport
}
