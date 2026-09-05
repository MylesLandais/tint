import { ReleaseChart } from '../components/release-chart'
import { DocsDemo, DocsFooter, DocsPage, DocsSection } from './components/DocsPage'

export function ReleaseChartDoc() {
  return <DocsPage route="components/release-chart" title="Release Chart" intro="A controlled score-versus-size plot using Tint color tokens. Displays supplied values without computing policy or dispatching transfers.">
    <DocsSection id="preview" title="Preview"><p>Illustrative values only, not live provider results.</p><DocsDemo code={'<ReleaseChart rows={[{ id: "sample-a", size: 6.2, score: 72 }, { id: "sample-b", size: 18.2, score: 95 }]} />'}><ReleaseChart rows={[{ id: 'sample-a', size: 6.2, score: 72 }, { id: 'sample-b', size: 18.2, score: 95 }]} /></DocsDemo></DocsSection>
    <DocsSection id="api" title="API"><pre className="overflow-auto rounded-lg bg-tint-surface p-4 text-xs"><code>{"import { ReleaseChart } from 'tint/release-chart'\n\nfunction ReleaseChart(props: {\n  rows: readonly { id: string; size: number; score: number }[]\n})"}</code></pre><p>Size is GiB. Scores are displayed exactly as supplied; no fixed policy range is assumed. Nonfinite values and negative sizes are excluded. An accessible table accompanies the responsive SVG. The caller owns score provenance, policy evaluation and selection state.</p></DocsSection>
    <DocsFooter />
  </DocsPage>
}
