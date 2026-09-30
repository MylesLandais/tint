import { useEffect, useMemo, useState } from 'react'
import { applyPolicyCommand, mockDryRun, type PolicyDocument } from '../components/policy'
import { DEMO_FEED, DEMO_POLICY } from '../docs/fixtures/demoDocuments'
import { createTintClient, type RequestAdapter, type TintClient, type TintClientSnapshot, type TintCapability } from '../client'
import type { FeedDocument } from '../components/feed'

type ClientScenario = 'ready' | 'degraded' | 'error'

const SCENARIOS: readonly { id: ClientScenario; label: string; detail: string }[] = [
  { id: 'ready', label: 'Ready', detail: 'All optional capabilities resolve.' },
  { id: 'degraded', label: 'Degraded', detail: 'Storage rejects while auth remains ready.' },
  { id: 'error', label: 'Error', detail: 'Every configured capability rejects.' },
]

const requestAdapter: RequestAdapter = {
  async send<T>() {
    return {
      status: 200,
      headers: { 'content-type': 'application/json' },
      data: { ok: true, source: 'tint-mock-lab' } as T,
      requestId: 'demo-request-1',
    }
  },
}

function capability(fails: boolean): TintCapability {
  return {
    async start() {
      if (fails) throw new Error('fixture capability failure')
    },
    async stop() {},
  }
}

function createScenarioClient(scenario: ClientScenario): TintClient {
  return createTintClient({
    request: requestAdapter,
    realtime: capability(scenario === 'error') as never,
    storage: capability(scenario !== 'ready') as never,
  })
}

function cloneFixtures(): { feed: FeedDocument; policy: PolicyDocument } {
  return { feed: structuredClone(DEMO_FEED), policy: structuredClone(DEMO_POLICY) }
}

function Snapshot({ snapshot }: { snapshot: TintClientSnapshot }) {
  return (
    <dl className="demo-status-grid">
      <div><dt>Status</dt><dd data-testid="client-status">{snapshot.status}</dd></div>
      <div><dt>Ready</dt><dd>{snapshot.readyCapabilities.join(', ') || '—'}</dd></div>
      <div><dt>Failed</dt><dd>{snapshot.failedCapabilities.join(', ') || '—'}</dd></div>
      <div><dt>Problem</dt><dd>{snapshot.problem?.code ?? 'none'}</dd></div>
    </dl>
  )
}

export function DemoApp() {
  const [scenario, setScenario] = useState<ClientScenario>('ready')
  const [snapshot, setSnapshot] = useState<TintClientSnapshot>(() => createScenarioClient('ready').getSnapshot())
  const [requestResult, setRequestResult] = useState('No request sent.')
  const [fixtures, setFixtures] = useState(cloneFixtures)
  const [selectedEntryId, setSelectedEntryId] = useState(DEMO_FEED.entries[0]?.id ?? '')

  const entry = useMemo(
    () => fixtures.feed.entries.find((item) => item.id === selectedEntryId) ?? fixtures.feed.entries[0],
    [fixtures.feed.entries, selectedEntryId],
  )
  const rule = fixtures.policy.rules[0]

  useEffect(() => {
    const client = createScenarioClient(scenario)
    const unsubscribe = client.subscribe(() => setSnapshot(client.getSnapshot()))
    setSnapshot(client.getSnapshot())
    void client.start()
    return () => {
      unsubscribe()
      client.stop()
    }
  }, [scenario])

  async function sendRequest() {
    setRequestResult('Pending…')
    try {
      const response = await requestAdapter.send<{ ok: boolean }>({ method: 'GET', url: '/mock/health' })
      setRequestResult(`${response.status} · ${response.data.ok ? 'contract accepted' : 'unexpected response'}`)
    } catch (error) {
      setRequestResult(error instanceof Error ? error.message : 'request failed')
    }
  }

  function toggleRule() {
    if (!rule) return
    setFixtures((current) => ({
      ...current,
      policy: applyPolicyCommand(current.policy, { type: 'policy.toggle', ruleId: rule.id, enabled: !rule.enabled }),
    }))
  }

  function resetFixtures() {
    setFixtures(cloneFixtures())
    setSelectedEntryId(DEMO_FEED.entries[0]?.id ?? '')
  }

  const dryRun = entry && rule ? mockDryRun(entry, rule) : { matched: false, note: 'No fixture selected.' }

  return (
    <main className="demo-page">
      <header className="demo-header">
        <div>
          <p className="demo-kicker">TINT / MOCK LAB</p>
          <h1>Promises, clients, and host-owned contracts</h1>
          <p className="demo-lede">Deterministic fixtures for the surfaces Kino and Gateway consume. Nothing here calls a provider or mutates a server.</p>
        </div>
        <nav aria-label="Related applications" className="demo-links">
          <a href="http://localhost:4000/">Kino Theater</a>
          <a href="http://localhost:4000/watch">Kino Cinema</a>
          <a href="/discord-bot-panel.html">Ludis bot panel</a>
          <a href="http://tint.localhost/">Tint docs</a>
        </nav>
      </header>

      <section className="demo-card" aria-labelledby="client-heading">
        <div className="demo-card-heading">
          <div><p className="demo-kicker">CLIENT PROMISES</p><h2 id="client-heading">Lifecycle and capability status</h2></div>
          <div className="demo-button-row" role="group" aria-label="Client scenarios">
            {SCENARIOS.map((item) => <button key={item.id} className={scenario === item.id ? 'demo-button active' : 'demo-button'} onClick={() => setScenario(item.id)}>{item.label}</button>)}
          </div>
        </div>
        <p className="demo-muted">{SCENARIOS.find((item) => item.id === scenario)?.detail}</p>
        <Snapshot snapshot={snapshot} />
        <div className="demo-action-row"><button className="demo-button accent" onClick={() => void sendRequest()}>Send typed request</button><span role="status">{requestResult}</span></div>
      </section>

      <section className="demo-card" aria-labelledby="contracts-heading">
        <div className="demo-card-heading"><div><p className="demo-kicker">HOST CONTRACTS</p><h2 id="contracts-heading">Feed and policy fixtures</h2></div><button className="demo-button" onClick={resetFixtures}>Reset fixtures</button></div>
        <div className="demo-contract-grid">
          <div><label htmlFor="entry-select">Test entry</label><select id="entry-select" value={selectedEntryId} onChange={(event) => setSelectedEntryId(event.target.value)}>{fixtures.feed.entries.slice(0, 8).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select><p className="demo-muted">{entry?.contentKind} · {entry?.readState} · revision {fixtures.feed.revision}</p></div>
          <div className={dryRun.matched ? 'demo-result match' : 'demo-result'}><strong>{dryRun.matched ? 'Matched' : 'No match'}</strong><span>{dryRun.disposition ?? dryRun.note}</span></div>
          <div><p className="demo-label">Policy: {rule?.name ?? 'none'}</p><p className="demo-muted">{rule?.enabled ? 'Enabled' : 'Disabled'} · {fixtures.policy.revision}</p><button className="demo-button" onClick={toggleRule} disabled={!rule}>{rule?.enabled ? 'Disable rule' : 'Enable rule'}</button></div>
        </div>
        <pre className="demo-json">{JSON.stringify({ feed: { schemaVersion: fixtures.feed.schemaVersion, revision: fixtures.feed.revision, entries: fixtures.feed.entries.length }, policy: { schemaVersion: fixtures.policy.schemaVersion, revision: fixtures.policy.revision, rules: fixtures.policy.rules.length } }, null, 2)}</pre>
      </section>
    </main>
  )
}
