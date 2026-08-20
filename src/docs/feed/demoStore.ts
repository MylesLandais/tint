/**
 * Docs-only in-memory store shared by the Maya subscriptions chat scenario and
 * the Policy / Feed workbenches.
 *
 * Lives under `src/docs` on purpose — component packages stay presentational and
 * must not grow a global mutation store. All writes are mock; no server.
 */

import {
  DEMO_FEED,
  DEMO_POLICY,
  nextFeedRevision,
  type Channel,
  type FeedDocument,
  type Source,
} from '../../components/feed'
import {
  applyPolicyCommand,
  type PolicyDocument,
  type PolicyRule,
} from '../../components/policy'

export type DemoFeedStoreSnapshot = {
  feed: FeedDocument
  policy: PolicyDocument
}

type Listener = () => void

let feed: FeedDocument = structuredClone(DEMO_FEED)
let policy: PolicyDocument = structuredClone(DEMO_POLICY)
/**
 * Cached snapshot for `useSyncExternalStore`.
 *
 * Returning `{ feed, policy }` from the getter every call looks like a new
 * store on every render and React enters an infinite update loop — which is
 * how the Feed docs page rendered blank.
 */
let snapshot: DemoFeedStoreSnapshot = { feed, policy }
const listeners = new Set<Listener>()

function emit() {
  snapshot = { feed, policy }
  for (const listener of listeners) listener()
}

export function getDemoFeedStore(): DemoFeedStoreSnapshot {
  return snapshot
}

export function subscribeDemoFeedStore(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Reset to fixtures — call when a docs page wants a clean slate. */
export function resetDemoFeedStore() {
  feed = structuredClone(DEMO_FEED)
  policy = structuredClone(DEMO_POLICY)
  emit()
}

/**
 * Mocked credential vault. Returns an opaque ref so chat history never holds
 * the secret itself.
 */
export function storeCredential(_secret: string): string {
  return `cred_demo_${crypto.randomUUID().slice(0, 8)}`
}

export function upsertChannel(channel: Channel) {
  const existing = feed.channels.findIndex((item) => item.id === channel.id)
  const channels =
    existing >= 0
      ? feed.channels.map((item, index) => (index === existing ? channel : item))
      : [...feed.channels, channel]
  feed = {
    ...feed,
    channels,
    revision: nextFeedRevision(feed.revision),
  }
  emit()
}

export function upsertSource(source: Source) {
  const existing = feed.sources.findIndex((item) => item.id === source.id)
  const sources =
    existing >= 0
      ? feed.sources.map((item, index) => (index === existing ? source : item))
      : [...feed.sources, source]
  feed = {
    ...feed,
    sources,
    revision: nextFeedRevision(feed.revision),
  }
  emit()
}

export function upsertPolicyRule(rule: PolicyRule) {
  const existing = policy.rules.some((item) => item.id === rule.id)
  policy = applyPolicyCommand(
    policy,
    existing
      ? { type: 'policy.update', ruleId: rule.id, patch: rule }
      : { type: 'policy.create', rule },
  )
  emit()
}

/** Apply a policy command against the demo store document. */
export function dispatchPolicyCommand(
  command: Parameters<typeof applyPolicyCommand>[1],
) {
  policy = applyPolicyCommand(policy, command)
  emit()
}

/** Maya confirmation write: channel room + inbound stream + rule. */
export function commitSubscription(channel: Channel, source: Source, rule: PolicyRule) {
  upsertChannel(channel)
  upsertSource(source)
  upsertPolicyRule(rule)
}
