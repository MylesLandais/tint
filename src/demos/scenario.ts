import { createTintClient, type TintClient } from '../client/client'
import type { RequestAdapter, TintCapability } from '../client/types'
import type { FeedDocument } from '../core/feed/contracts'
import type { PolicyDocument } from '../core/policy/contracts'
import { DEMO_FEED, DEMO_POLICY } from '../docs/fixtures/demoDocuments'

export type ClientScenario = 'ready' | 'degraded' | 'error'

export const SCENARIOS: readonly { id: ClientScenario; label: string; detail: string }[] = [
  { id: 'ready', label: 'Ready', detail: 'All optional capabilities resolve.' },
  { id: 'degraded', label: 'Degraded', detail: 'Storage rejects while auth remains ready.' },
  { id: 'error', label: 'Error', detail: 'Every configured capability rejects.' },
]

export const requestAdapter: RequestAdapter = {
  async send<T>() {
    return { status: 200, headers: { 'content-type': 'application/json' },
      data: { ok: true, source: 'tint-mock-lab' } as T, requestId: 'demo-request-1' }
  },
}

function capability(fails: boolean): TintCapability {
  return { async start() { if (fails) throw new Error('fixture capability failure') }, async stop() {} }
}

export function createScenarioClient(scenario: ClientScenario): TintClient {
  return createTintClient({ request: requestAdapter,
    realtime: capability(scenario === 'error') as never,
    storage: capability(scenario !== 'ready') as never })
}

export function cloneFixtures(): { feed: FeedDocument; policy: PolicyDocument } {
  return { feed: structuredClone(DEMO_FEED), policy: structuredClone(DEMO_POLICY) }
}
