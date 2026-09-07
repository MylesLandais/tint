import { CodeBlock } from './components/CodeBlock'
import { DocsPage, DocsSection } from './components/DocsPage'

const usage = `import { CodeEditor } from '@nebula/tint/code-editor'

// The host creates and retains the collaboration session and presence.
<CodeEditor session={session} presence={presence} label="Shared Lua source" />`

export function CodeEditorDoc() {
  return <DocsPage route="components/code-editor" title="Code Editor"
    intro="A collaborative Lua editor backed by a host-owned document and presence session.">
    <DocsSection id="usage" title="Usage">
      <p>Keep the session stable for the lifetime of the buffer. The host owns transport,
        persistence, and access control. Set readOnly when editing is unavailable.</p>
      <CodeBlock code={usage} language="tsx" />
    </DocsSection>
    <DocsSection id="api" title="API">
      <p>session is required. presence connects collaborator selections. readOnly defaults
        to false; label supplies the editor’s accessible name. onView receives the
        CodeMirror EditorView on mount and null when the view is destroyed.</p>
    </DocsSection>
  </DocsPage>
}
