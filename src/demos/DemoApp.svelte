<script lang="ts">
  import { applyPolicyCommand, mockDryRun } from '../core/policy/contracts'
  import { DEMO_FEED } from '../docs/fixtures/demoDocuments'
  import type { TintClientSnapshot } from '../client/types'
  import { cloneFixtures, createScenarioClient, requestAdapter, SCENARIOS, type ClientScenario } from './scenario'

  let scenario = $state<ClientScenario>('ready')
  let snapshot = $state<TintClientSnapshot>(createScenarioClient('ready').getSnapshot())
  let requestResult = $state('No request sent.')
  let fixtures = $state(cloneFixtures())
  let selectedEntryId = $state(DEMO_FEED.entries[0]?.id ?? '')
  let entry = $derived(fixtures.feed.entries.find((item) => item.id === selectedEntryId) ?? fixtures.feed.entries[0])
  let rule = $derived(fixtures.policy.rules[0])
  let dryRun = $derived(entry && rule ? mockDryRun(entry, rule) : { matched: false, note: 'No fixture selected.' })

  $effect(() => {
    const client = createScenarioClient(scenario)
    const unsubscribe = client.subscribe(() => { snapshot = client.getSnapshot() })
    snapshot = client.getSnapshot()
    void client.start()
    return () => { unsubscribe(); void client.stop() }
  })

  async function sendRequest() {
    requestResult = 'Pending…'
    try {
      const response = await requestAdapter.send<{ ok: boolean }>({ method: 'GET', url: '/mock/health' })
      requestResult = `${response.status} · ${response.data.ok ? 'contract accepted' : 'unexpected response'}`
    } catch (cause) { requestResult = cause instanceof Error ? cause.message : 'request failed' }
  }
  function toggleRule() {
    if (!rule) return
    fixtures = { ...fixtures, policy: applyPolicyCommand(fixtures.policy, { type: 'policy.toggle', ruleId: rule.id, enabled: !rule.enabled }) }
  }
  function resetFixtures() { fixtures = cloneFixtures(); selectedEntryId = DEMO_FEED.entries[0]?.id ?? '' }
</script>

<main class="demo-page">
  <header class="demo-header"><div><p class="demo-kicker">TINT / MOCK LAB</p><h1>Promises, clients, and host-owned contracts</h1><p class="demo-lede">Deterministic fixtures for the surfaces Kino and Gateway consume. Nothing here calls a provider or mutates a server.</p></div>
    <nav aria-label="Related applications" class="demo-links"><a href="http://localhost:4000/">Kino Theater</a><a href="http://localhost:4000/watch">Kino Cinema</a><a href="/discord-bot-panel.html">Ludis bot panel</a><a href="http://tint.localhost/">Tint docs</a></nav></header>

  <section class="demo-card" aria-labelledby="client-heading"><div class="demo-card-heading"><div><p class="demo-kicker">CLIENT PROMISES</p><h2 id="client-heading">Lifecycle and capability status</h2></div><div class="demo-button-row" role="group" aria-label="Client scenarios">
    {#each SCENARIOS as item (item.id)}<button type="button" class={['demo-button', scenario === item.id && 'active']} onclick={() => { scenario = item.id }}>{item.label}</button>{/each}
  </div></div><p class="demo-muted">{SCENARIOS.find((item) => item.id === scenario)?.detail}</p>
    <dl class="demo-status-grid"><div><dt>Status</dt><dd data-testid="client-status">{snapshot.status}</dd></div><div><dt>Ready</dt><dd>{snapshot.readyCapabilities.join(', ') || '—'}</dd></div><div><dt>Failed</dt><dd>{snapshot.failedCapabilities.join(', ') || '—'}</dd></div><div><dt>Problem</dt><dd>{snapshot.problem?.code ?? 'none'}</dd></div></dl>
    <div class="demo-action-row"><button type="button" class="demo-button accent" onclick={() => void sendRequest()}>Send typed request</button><span role="status">{requestResult}</span></div>
  </section>

  <section class="demo-card" aria-labelledby="contracts-heading"><div class="demo-card-heading"><div><p class="demo-kicker">HOST CONTRACTS</p><h2 id="contracts-heading">Feed and policy fixtures</h2></div><button type="button" class="demo-button" onclick={resetFixtures}>Reset fixtures</button></div>
    <div class="demo-contract-grid"><div><label for="entry-select">Test entry</label><select id="entry-select" value={selectedEntryId} onchange={(event) => { selectedEntryId = event.currentTarget.value }}>
      {#each fixtures.feed.entries.slice(0, 8) as item (item.id)}<option value={item.id}>{item.title}</option>{/each}</select><p class="demo-muted">{entry?.contentKind} · {entry?.readState} · revision {fixtures.feed.revision}</p></div>
      <div class={['demo-result', dryRun.matched && 'match']}><strong>{dryRun.matched ? 'Matched' : 'No match'}</strong><span>{dryRun.disposition ?? dryRun.note}</span></div>
      <div><p class="demo-label">Policy: {rule?.name ?? 'none'}</p><p class="demo-muted">{rule?.enabled ? 'Enabled' : 'Disabled'} · {fixtures.policy.revision}</p><button type="button" class="demo-button" onclick={toggleRule} disabled={!rule}>{rule?.enabled ? 'Disable rule' : 'Enable rule'}</button></div>
    </div>
    <pre class="demo-json">{JSON.stringify({ feed: { schemaVersion: fixtures.feed.schemaVersion, revision: fixtures.feed.revision, entries: fixtures.feed.entries.length }, policy: { schemaVersion: fixtures.policy.schemaVersion, revision: fixtures.policy.revision, rules: fixtures.policy.rules.length } }, null, 2)}</pre>
  </section>
</main>
