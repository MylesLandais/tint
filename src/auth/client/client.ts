import type { OperationOptions } from '../../client/types'
import { normalizeAuthError } from './errors'
import { requireOperation, safeReturnTo, type AuthTransport } from './transport'
import type {
  AuthEvent,
  AuthEventType,
  AuthFlowResult,
  AuthOperation,
  AuthSnapshot,
  CredentialRecoveryRequestInput,
  IdentifierVerificationInput,
  OAuthProviderId,
  OrganizationSelectInput,
  PasswordResetInput,
  PasswordSignInInput,
  PasswordSignUpInput,
  TotpVerifyInput,
} from './types'

export type AuthClientOptions = { transport: AuthTransport; broadcastChannel?: string | false }

const SERVER_AUTH_SNAPSHOT: AuthSnapshot = Object.freeze({
  status: 'loading', busy: false, config: null, session: null, task: null, error: null,
})

export class AuthClient {
  private readonly transport: AuthTransport
  private readonly listeners = new Set<() => void>()
  private readonly eventListeners = new Set<(event: AuthEvent) => void>()
  private readonly channel: BroadcastChannel | null
  private revision = 0
  private initialized: Promise<void> | null = null
  private snapshot: AuthSnapshot = SERVER_AUTH_SNAPSHOT

  constructor(options: AuthClientOptions) {
    this.transport = options.transport
    const channelName = options.broadcastChannel ?? 'tint-auth'
    this.channel = channelName !== false && typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(channelName) : null
    if (this.channel) this.channel.onmessage = () => void this.refresh(false)
  }

  readonly getSnapshot = (): AuthSnapshot => this.snapshot
  readonly getServerSnapshot = (): AuthSnapshot => SERVER_AUTH_SNAPSHOT
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

  async refresh(broadcast = false, options?: OperationOptions): Promise<void> {
    const revision = ++this.revision
    this.patch({ busy: true, error: null })
    try {
      const session = await this.transport.getSession(options)
      if (revision !== this.revision) return
      this.patch({ status: session ? 'signed_in' : 'signed_out', session, task: null, busy: false })
      this.emit(session ? 'SESSION_UPDATED' : 'SIGNED_OUT', broadcast)
    } catch (cause) {
      if (revision !== this.revision) return
      this.patch({ status: 'error', busy: false, error: normalizeAuthError(cause) })
    }
  }

  readonly signIn = {
    password: (input: PasswordSignInInput, options?: OperationOptions) => this.flow(
      requireOperation(this.transport.signInPassword, 'password sign-in').bind(this.transport), input, options,
    ),
  }

  readonly signUp = {
    password: (input: PasswordSignUpInput, options?: OperationOptions) => this.flow(
      requireOperation(this.transport.signUpPassword, 'password sign-up').bind(this.transport), input, options,
    ),
  }

  readonly identifier = {
    requestVerification: (options?: OperationOptions) => this.flowWithoutInput(
      requireOperation(this.transport.requestIdentifierVerification, 'identifier verification').bind(this.transport), options,
    ),
    verify: (input: IdentifierVerificationInput, options?: OperationOptions) => this.flow(
      requireOperation(this.transport.verifyIdentifier, 'identifier verification').bind(this.transport), input, options,
    ),
  }

  readonly credentials = {
    requestRecovery: (input: CredentialRecoveryRequestInput, options?: OperationOptions) => this.flow(
      requireOperation(this.transport.requestCredentialRecovery, 'credential recovery').bind(this.transport), input, options,
    ),
    resetPassword: (input: PasswordResetInput, options?: OperationOptions) => this.flow(
      requireOperation(this.transport.resetPassword, 'password reset').bind(this.transport), input, options,
    ),
  }

  readonly mfa = {
    verifyTotp: (input: TotpVerifyInput, options?: OperationOptions) => this.flow(
      requireOperation(this.transport.verifyTotp, 'TOTP verification').bind(this.transport), input, options,
    ),
  }

  readonly organizations = {
    select: (input: OrganizationSelectInput, options?: OperationOptions) => this.flow(
      requireOperation(this.transport.selectOrganization, 'organization selection').bind(this.transport), input, options,
    ),
  }

  readonly oauth = {
    url: (provider: OAuthProviderId, options: { returnTo?: string } = {}) => this.transport.oauthStartUrl(provider, safeReturnTo(options.returnTo)),
    start: (provider: OAuthProviderId, options: { returnTo?: string } = {}) => {
      if (typeof window !== 'undefined') window.location.assign(this.oauth.url(provider, options))
    },
  }

  async execute<Input, Result>(operation: AuthOperation<Input, Result>, input: Input, options?: OperationOptions): Promise<Result> {
    const execute = requireOperation(this.transport.execute, operation.name).bind(this.transport)
    const revision = ++this.revision
    this.patch({ busy: true, error: null })
    try {
      return await execute(operation, input, options)
    } catch (cause) {
      const error = normalizeAuthError(cause)
      if (revision === this.revision) this.patch({ error })
      throw error
    } finally {
      if (revision === this.revision) this.patch({ busy: false })
    }
  }

  async signOut(options?: OperationOptions): Promise<void> {
    ++this.revision
    this.patch({ busy: true, error: null })
    try {
      await this.transport.signOut(options)
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
      throw this.snapshot.error
    }
  }

  private async flow<Input>(
    operation: (input: Input, options?: OperationOptions) => Promise<AuthFlowResult>,
    input: Input,
    options?: OperationOptions,
  ): Promise<AuthFlowResult> {
    return this.runFlow(() => operation(input, options))
  }

  private async flowWithoutInput(
    operation: (options?: OperationOptions) => Promise<AuthFlowResult>,
    options?: OperationOptions,
  ): Promise<AuthFlowResult> {
    return this.runFlow(() => operation(options))
  }

  private async runFlow(operation: () => Promise<AuthFlowResult>): Promise<AuthFlowResult> {
    const revision = ++this.revision
    this.patch({ busy: true, error: null })
    try {
      const result = await operation()
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
