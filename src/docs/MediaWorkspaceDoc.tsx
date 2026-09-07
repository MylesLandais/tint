import { MediaWorkspace } from '../components/media-workspace'
import { DocsDemo, DocsFooter, DocsPage, DocsSection } from './components/DocsPage'

export function MediaWorkspaceDoc() {
  return <DocsPage route="components/media-workspace" title="Gateway Media" intro="A dense media discovery workspace based on the Gateway Media upstream capture.">
    <DocsSection id="preview" title="Preview"><DocsDemo code={`<MediaWorkspace posterSrc="/images/toy-story-5.png" />`}><MediaWorkspace /></DocsDemo></DocsSection>
    <DocsSection id="usage" title="Usage"><pre className="overflow-auto rounded-lg bg-tint-surface p-4 text-xs"><code>{"import { MediaWorkspace } from '@nebula/tint/media-workspace'\n\n<MediaWorkspace posterSrc=\"/images/toy-story-5.png\" />"}</code></pre></DocsSection>
    <DocsFooter />
  </DocsPage>
}
