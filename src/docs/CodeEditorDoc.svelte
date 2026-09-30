<script lang="ts">
  import { onDestroy } from 'svelte'
  import { createCollabSession } from '../components/collab/createCollabSession'
  import CodeEditor from '../svelte/components/code-editor/CodeEditor.svelte'
  import DocPage from './svelte/DocPage.svelte'
  import type { ApiRow } from './svelte/types'

  const session = createCollabSession({ room: 'docs-code-editor-svelte', awareness: false, network: { kind: 'none' } })
  session.fragment.insert(0, '-- Tint collaborative Lua\nlocal greeting = "Hello, Tint"\nprint(greeting)\n')
  onDestroy(() => session.destroy())
  let readOnly = $state(false)

  const api: ApiRow[] = [
    { prop: 'session', type: 'CollabSession', description: 'Host-owned Yjs document and text fragment; stable for the buffer lifetime.' },
    { prop: 'presence', type: 'EditorPresence?', description: 'Optional shared collaborator selections.' },
    { prop: 'readOnly', type: 'boolean', description: 'Disables editing while retaining viewing and selection.' },
    { prop: 'label', type: 'string', description: 'Accessible name for the CodeMirror content.' },
    { prop: 'onView', type: '(EditorView | null) => void', description: 'Receives the mounted view and null when it is destroyed.' },
  ]
  const usage = `import { CodeEditor } from '@nebula/tint/code-editor'
import { createCollabSession } from '@nebula/tint/collab'

const session = createCollabSession({ room: 'workspace:1:note:1' })
// The host retains and destroys this session.
<CodeEditor {session} label="Shared Lua source" />`
</script>

<DocPage title="Code Editor" description="A CodeMirror Lua editor mounted over a host-owned Yjs session. The document, transport, persistence, and presence lifecycle stay outside the Svelte component." importPath="@nebula/tint/code-editor" {usage} {api} accessibility="The CodeMirror content has a host-supplied accessible label. Read-only mode prevents edits, and the editor follows Tint code colors through semantic tokens.">
  <div class="editor-demo">
    <label><input type="checkbox" checked={readOnly} onchange={(event) => readOnly = event.currentTarget.checked} /> Read only</label>
    <div class="editor"><CodeEditor {session} {readOnly} label="Demo Lua source" /></div>
  </div>
</DocPage>

<style>
  .editor-demo { display: grid; gap: .75rem; }
  label { display: inline-flex; align-items: center; gap: .4rem; color: var(--tint-ink); font-size: .85rem; }
  .editor { min-height: 15rem; overflow: hidden; border: 1px solid var(--tint-code-border); border-radius: var(--tint-radius-lg); }
</style>
