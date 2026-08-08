import { AuthError, type AuthSession, type AuthTransport } from '@/auth/client'

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

function sessionFor(email: string): AuthSession {
  return {
    id: 'session_demo',
    user: {
      id: 'user_demo',
      principalRef: `user:${email}`,
      displayName: email.split('@')[0] ?? 'Operator',
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
    authenticationMethods: ['password'],
    authenticatedAt: new Date().toISOString(),
  }
}

export function createDemoTransport(): AuthTransport {
  let session: AuthSession | null = null
  let pending: AuthSession | null = null

  return {
    async getConfig() {
      await delay(200)
      return {
        version: 'v1',
        password: {
          enabled: true,
          signUpEnabled: false,
          verificationRequired: false,
          recoveryEnabled: false,
        },
        providers: [
          { id: 'github', label: 'Continue with GitHub', kind: 'oauth' },
          { id: 'google', label: 'Continue with Google', kind: 'oauth' },
        ],
        inviteRequired: false,
      }
    },

    async getSession() {
      await delay(150)
      return session
    },

    async signInPassword({ email, password }) {
      await delay(450)
      if (password !== 'tint-demo') {
        throw new AuthError('invalid_credentials', 'The credentials were not accepted.', {
          status: 401,
        })
      }
      if (email === 'mfa@example.test') {
        pending = sessionFor(email)
        return { session: null, task: 'mfa', message: `Enter ${DEMO_TOTP_CODE} to continue.` }
      }
      session = sessionFor(email)
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

    // Inert: `OAuthButtons` renders real anchors, so a live URL would navigate the
    // docs site away. Production reads `client.oauth.url(provider)`.
    oauthStartUrl: () => '#/components/auth',

    // `signUpPassword`, `requestPasswordReset` and `selectOrganization` are left
    // undefined on purpose — calling them raises `UnsupportedAuthOperationError`,
    // which is how a deployment declares which flows it does not offer.
  }
}
