<script lang="ts">
  import type { Editor as TiptapEditor } from '@tiptap/core'
  import { codeTabsContent, type EditorDocument } from '../core/editor'
  import Editor from '../svelte/components/editor/Editor.svelte'
  import DocPage from './svelte/DocPage.svelte'
  import type { ApiRow } from './svelte/types'

  const initial: EditorDocument = {
    type: 'doc',
    content: [
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Draft release note' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Write the next release note here.' }] },
    ],
  }
  const replacement: EditorDocument = {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Host replacement document' }] }],
  }
  let value = $state<EditorDocument>(initial)
  let expanded = $state(true)
  let editable = $state(true)
  let edits = $state(0)
  let instance = $state<TiptapEditor | null>(null)

  function update(next: EditorDocument) { value = next; edits++ }
  function replace() { value = replacement }
  function insertTabbedCode() { instance?.chain().focus().insertContent(codeTabsContent()).run() }

  const api: ApiRow[] = [
    { prop: 'value / onValueChange', type: 'EditorDocument / (document) => void', description: 'Host-owned Tiptap JSON. User edits emit the next document; an external value replaces the visible content without another edit event.' },
    { prop: 'expanded / onExpandedChange', type: 'boolean / (expanded) => void', description: 'Controlled disclosure. The editor remains mounted when its body is hidden.' },
    { prop: 'editable', type: 'boolean', description: 'Controls text editing and hides formatting controls in read-only mode.' },
    { prop: 'editorRef', type: '(Editor | null) => void', description: 'Provides the mounted Tiptap instance for commands, then null on teardown.' },
    { prop: 'extensions / includeDefaultExtensions', type: 'Extensions / boolean', description: 'Stable custom extension list and optional default schema.' },
    { prop: 'slashCommands', type: 'EditorSlashCommand[]', description: 'Custom / menu commands with optional Svelte Lucide icons.' },
    { prop: 'editorDocumentToHTML / editorHTMLToDocument', type: 'plain TypeScript functions', description: 'Serialize with the same schema without mounting Svelte.' },
  ]
  const usage = `import { Editor } from '@nebula/tint/editor'

let value = $state<EditorDocument>({ type: 'doc', content: [{ type: 'paragraph' }] })
let expanded = $state(true)

<Editor {value} onValueChange={(next) => value = next}
  {expanded} onExpandedChange={(next) => expanded = next}
  title="Release note" label="Release note body" />`
</script>

<DocPage title="Editor" description="A rich text editor backed by Tiptap and a host-owned JSON document. Format text, insert tabbed code, and use / at the start of a line for block commands." importPath="@nebula/tint/editor" {usage} {api} accessibility="The editable region has a host-supplied label and multiline textbox semantics. The disclosure button reports its state, toolbar buttons have names and pressed states, the slash menu supports arrow keys and Enter, and read-only mode keeps the document readable.">
  <div class="editor-demo">
    <div class="demo-controls">
      <button type="button" onclick={replace}>Replace document</button>
      <button type="button" onclick={insertTabbedCode} disabled={!instance || !editable}>Insert tabbed code</button>
      <label><input type="checkbox" checked={!editable} onchange={(event) => editable = !event.currentTarget.checked} /> Read only</label>
    </div>
    <Editor {value} onValueChange={update} {expanded} onExpandedChange={(next) => expanded = next} {editable} title="Release note" label="Demo article body" editorRef={(editor) => instance = editor} />
    <p class="summary" aria-live="polite">Edits: {edits} · Expanded: {expanded ? 'yes' : 'no'} · Mode: {editable ? 'editing' : 'read only'}</p>
  </div>
</DocPage>

<style>
  .editor-demo { display: grid; gap: var(--tint-space-3); min-width: 0; }
  .demo-controls { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tint-space-2); }
  .demo-controls button { min-height: 2rem; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); background: var(--tint-surface); padding: 0 var(--tint-space-3); color: var(--tint-ink); cursor: pointer; font: inherit; font-size: var(--tint-font-size-sm); }
  .demo-controls button:disabled { cursor: not-allowed; opacity: .5; }
  .demo-controls button:focus-visible, .demo-controls input:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
  .demo-controls label { display: inline-flex; align-items: center; gap: var(--tint-space-1); color: var(--tint-ink); font-size: var(--tint-font-size-sm); }
  .summary { margin: 0; color: var(--tint-muted); font-size: var(--tint-font-size-sm); }
</style>
