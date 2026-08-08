import { describe, expect, it } from 'vitest'
import { AuthError, createAuthClient, safeReturnTo } from './index'
import type {
  AuthConfig,
  AuthFlowResult,
  AuthSession,
  AuthTransport,
  PasswordSignInInput,
} from './index'

const config: AuthConfig = {
  version: 'v1',
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
    displayName: 'Test User',
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

    await client.signIn.password({ email: 'user@example.test', password: 'correct horse battery staple' })

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

    await expect(client.signIn.password({ email: 'x@example.test', password: 'wrong' }))
      .rejects.toMatchObject({ code: 'policy_denied' })
    expect(client.getSnapshot().error?.code).toBe('policy_denied')
  })
})
