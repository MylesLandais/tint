import { normalizeAuthError } from './errors'
import { requireOperation, safeReturnTo, type AuthTransport } from './transport'
import type {
  AuthEvent,
  AuthEventType,
  AuthFlowResult,
  AuthSnapshot,
  OAuthProviderId,
  OrganizationSelectInput,
  PasswordResetInput,
  PasswordResetRequestInput,
  PasswordSignInInput,
  PasswordSignUpInput,
  TotpVerifyInput,
  VerifyEmailInput,
} from './types'

export type AuthClientOptions = { transport: AuthTransport; broadcastChannel?: string | false }

export class AuthClient {
  private readonly transport: AuthTransport
  private readonly listeners = new Set<() => void>()
  private readonly eventListeners = new Set<(event: AuthEvent) => void>()
  private readonly channel: BroadcastChannel | null
  private revision = 0
  private initialized: Promise<void> | null = null
  private snapshot: AuthSnapshot = {
    status: 'loading', busy: false, config: null, session: null, task: null, error: null,
  }

  constructor(options: AuthClientOptions) {
    this.transport = options.transport
    const channelName = options.broadcastChannel ?? 'tint-auth'
    this.channel = channelName !== false && typeof BroadcastChannel !== 'undefined'
      ? new BroadcastChannel(channelName)
      : null
    if (this.channel) this.channel.onmessage = () => void this.refresh(false)
  }

  readonly getSnapshot = (): AuthSnapshot => this.snapshot
  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  onAuthStateChange(listener: (event: AuthEvent) => void): () => void {
    this.eventListeners.add(listener)
    return () => this.eventListeners.delete(listener)
  }

  initialize(): Promise<void> {
    this.initialized ??= this.initializeOnce()
    return this.initialized
  }

  async refresh(broadcast = false): Promise<void> {
    const revision = ++this.revision
    this.patch({ busy: true, error: null })
    try {
      const session = await this.transport.getSession()
      if (revision !== this.revision) return
      this.patch({ status: session ? 'signed_in' : 'signed_out', session, task: null, busy: false })
      this.emit(session ? 'SESSION_UPDATED' : 'SIGNED_OUT', broadcast)
    } catch (cause) {
      if (revision !== this.revision) return
      this.patch({ status: 'error', busy: false, error: normalizeAuthError(cause) })
    }
  }

  readonly signIn = {
    password: (input: PasswordSignInInput) => this.flow(
      requireOperation(this.transport.signInPassword, 'password sign-in').bind(this.transport), input,
    ),
  }
  readonly signUp = {
    password: (input: PasswordSignUpInput) => this.flow(
      requireOperation(this.transport.signUpPassword, 'password sign-up').bind(this.transport), input,
    ),
  }
  readonly email = {
    requestVerification: () => this.flow(
      requireOperation(this.transport.requestEmailVerification, 'email verification').bind(this.transport), undefined,
    ),
    verify: (input: VerifyEmailInput) => this.flow(
      requireOperation(this.transport.verifyEmail, 'email verification').bind(this.transport), input,
    ),
  }
  readonly password = {
    requestReset: (input: PasswordResetRequestInput) => this.flow(
      requireOperation(this.transport.requestPasswordReset, 'password recovery').bind(this.transport), input,
    ),
    reset: (input: PasswordResetInput) => this.flow(
      requireOperation(this.transport.resetPassword, 'password reset').bind(this.transport), input,
    ),
  }
  readonly mfa = {
    verifyTotp: (input: TotpVerifyInput) => this.flow(
      requireOperation(this.transport.verifyTotp, 'TOTP verification').bind(this.transport), input,
    ),
  }
  readonly organizations = {
    select: (input: OrganizationSelectInput) => this.flow(
      requireOperation(this.transport.selectOrganization, 'organization selection').bind(this.transport), input,
    ),
  }
  readonly oauth = {
    url: (provider: OAuthProviderId, options: { returnTo?: string } = {}) =>
      this.transport.oauthStartUrl(provider, safeReturnTo(options.returnTo)),
    start: (provider: OAuthProviderId, options: { returnTo?: string } = {}) => {
      if (typeof window !== 'undefined') window.location.assign(this.oauth.url(provider, options))
    },
  }

  async signOut(): Promise<void> {
    ++this.revision
    this.patch({ busy: true, error: null })
    try {
      await this.transport.signOut()
      this.patch({ status: 'signed_out', busy: false, session: null, task: null })
      this.emit('SIGNED_OUT', true)
    } catch (cause) {
      this.patch({ busy: false, error: normalizeAuthError(cause) })
      throw this.snapshot.error
    }
  }

  destroy(): void {
    this.channel?.close()
    this.listeners.clear()
    this.eventListeners.clear()
  }

  private async initializeOnce(): Promise<void> {
    const revision = ++this.revision
    try {
      const [config, session] = await Promise.all([this.transport.getConfig(), this.transport.getSession()])
      if (revision !== this.revision) return
      this.patch({ config, session, status: session ? 'signed_in' : 'signed_out', busy: false, error: null })
      this.emit('INITIAL_SESSION', false)
    } catch (cause) {
      if (revision !== this.revision) return
      this.patch({ status: 'error', busy: false, error: normalizeAuthError(cause) })
    }
  }

  private async flow<Input>(operation: (input: Input) => Promise<AuthFlowResult>, input: Input): Promise<AuthFlowResult> {
    const revision = ++this.revision
    this.patch({ busy: true, error: null })
    try {
      const result = await operation(input)
      if (revision !== this.revision) return result
      const status = result.task ? 'pending' : result.session ? 'signed_in' : 'signed_out'
      this.patch({ status, busy: false, session: result.session, task: result.task })
      this.emit(result.task ? 'TASK_REQUIRED' : result.session ? 'SIGNED_IN' : 'SESSION_UPDATED', true)
      return result
    } catch (cause) {
      const error = normalizeAuthError(cause)
      if (revision === this.revision) this.patch({ busy: false, error })
      throw error
    }
  }

  private patch(update: Partial<AuthSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...update }
    for (const listener of this.listeners) listener()
  }

  private emit(type: AuthEventType, broadcast: boolean): void {
    const event = { type, snapshot: this.snapshot } satisfies AuthEvent
    for (const listener of this.eventListeners) listener(event)
    if (broadcast) this.channel?.postMessage({ type })
  }
}

export function createAuthClient(options: AuthClientOptions): AuthClient {
  return new AuthClient(options)
}
