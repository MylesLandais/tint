import { describe, expect, it, vi } from 'vitest'
import { AuthError, createAuthClient, safeReturnTo } from './index'
import type {
  AuthConfig,
  AuthFlowResult,
  AuthSession,
  AuthTransport,
  PasswordSignInInput,
} from './index'

const config: AuthConfig = {
  version: 'v2',
  identifierKind: 'either',
  password: {
    enabled: true,
    signUpEnabled: false,
    verificationRequired: false,
    recoveryEnabled: false,
  },
  providers: [],
  inviteRequired: false,
}

const session: AuthSession = {
  id: 'session-1',
  user: {
    id: 'user-1',
    principalRef: 'principal:user-1',
    name: 'Test User',
    email: 'user@example.test',
    emailVerified: true,
  },
  activeOrganizationId: null,
  memberships: [],
  capabilities: ['profile.read'],
  authenticationMethods: ['password'],
}

class TestTransport implements AuthTransport {
  currentSession: AuthSession | null = null
  nextError: AuthError | null = null

  async getConfig() { return config }
  async getSession() { return this.currentSession }
  async signInPassword(_input: PasswordSignInInput): Promise<AuthFlowResult> {
    if (this.nextError) {
      const error = this.nextError
      this.nextError = null
      throw error
    }
    this.currentSession = session
    return { session, task: null }
  }
  async signOut() { this.currentSession = null }
  oauthStartUrl(provider: string) { return `/oauth/${provider}` }
}

describe('AuthClient', () => {
  it('initializes and publishes transport-backed session state without token fields', async () => {
    const client = createAuthClient({ transport: new TestTransport(), broadcastChannel: false })

    await client.initialize()
    expect(client.getSnapshot().status).toBe('signed_out')

    await client.signIn.password({ identifier: 'user@example.test', password: 'correct horse battery staple' })

    expect(client.getSnapshot().session?.user.email).toBe('user@example.test')
    expect(JSON.stringify(client.getSnapshot())).not.toMatch(/access_token|refresh_token/i)
  })

  it('rejects unsafe return targets', () => {
    expect(safeReturnTo('/settings')).toBe('/settings')
    expect(safeReturnTo('//example.test')).toBeUndefined()
    expect(safeReturnTo('/\\example.test')).toBeUndefined()
    expect(safeReturnTo('https://example.test')).toBeUndefined()
  })

  it('normalizes operation failures into stable snapshot errors', async () => {
    const transport = new TestTransport()
    const client = createAuthClient({ transport, broadcastChannel: false })
    await client.initialize()
    transport.nextError = new AuthError('policy_denied', 'This sign-in is not allowed by policy.')

    await expect(client.signIn.password({ identifier: 'x@example.test', password: 'wrong' }))
      .rejects.toMatchObject({ code: 'policy_denied' })
    expect(client.getSnapshot().error?.code).toBe('policy_denied')
  })

  it('does not let an older sign-in overwrite a newer result', async () => {
    const pending = new Map<string, (result: AuthFlowResult) => void>()
    const transport: AuthTransport = {
      async getConfig() { return config },
      async getSession() { return null },
      signInPassword(input) { return new Promise((resolve) => pending.set(input.identifier, resolve)) },
      async signOut() {},
      oauthStartUrl() { return '/' },
    }
    const client = createAuthClient({ transport, broadcastChannel: false })
    await client.initialize()
    const first = client.signIn.password({ identifier: 'first', password: 'secret' })
    const second = client.signIn.password({ identifier: 'second', password: 'secret' })
    const secondSession = { ...session, id: 'session-2', user: { ...session.user, id: 'user-2', name: 'Second' } }
    pending.get('second')?.({ session: secondSession, task: null })
    await second
    pending.get('first')?.({ session, task: null })
    await first
    expect(client.getSnapshot().session?.id).toBe('session-2')
  })

  it('passes cancellation context to the auth transport', async () => {
    const controller = new AbortController()
    const seen = vi.fn()
    const transport: AuthTransport = {
      async getConfig() { return config },
      async getSession() { return null },
      async signInPassword(_input, options) { seen(options?.signal); return { session, task: null } },
      async signOut() {},
      oauthStartUrl() { return '/' },
    }
    const client = createAuthClient({ transport, broadcastChannel: false })
    await client.initialize()
    await client.signIn.password({ identifier: 'maya', password: 'secret' }, { signal: controller.signal })
    expect(seen).toHaveBeenCalledWith(controller.signal)
  })
})
