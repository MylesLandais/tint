<script lang="ts">
  import { Editor as TiptapEditor, type Extensions } from '@tiptap/core'
  import { onDestroy, untrack } from 'svelte'
  import { createEditorSchemaExtensions, editorDocumentKey } from '../../../core/editor'
  import EditorBubbleMenu from './EditorBubbleMenu.svelte'
  import EditorToolbar from './EditorToolbar.svelte'
  import { CodeTabsExtension } from './codeTabsExtension'
  import { createSvelteSlashCommandExtension } from './slashExtension'
  import type { EditorProps, EditorSlashCommand } from './types'

  const EMPTY_EXTENSIONS: Extensions = []
  const EMPTY_COMMANDS: readonly EditorSlashCommand[] = []

  let {
    value, onValueChange, expanded, onExpandedChange, title = 'Editor', status,
    headerActions, toolbarEnd, placeholder = 'Start writing, or type / for commands…',
    label = 'Document editor', editable = true, autofocus = false,
    extensions, includeDefaultExtensions = true, slashCommands, editorRef,
    onContentError, class: className, bodyClass,
  }: EditorProps = $props()
  const bodyId = $props.id()
  let host = $state<HTMLDivElement | null>(null)
  let editor = $state<TiptapEditor | null>(null)
  let version = $state(0)
  let externalKey = $derived(editorDocumentKey(value))
  let active: TiptapEditor | null = null
  let config: { target: HTMLDivElement; extensions: Extensions; defaults: boolean; hint: string; commands: readonly EditorSlashCommand[] } | null = null
  const changed = () => { version++ }

  function clearActive() {
    if (!active) return
    active.off('transaction', changed)
    active.destroy()
    active = null
    editor = null
  }

  onDestroy(clearActive)

  $effect(() => {
    const target = host
    const customExtensions = extensions ?? EMPTY_EXTENSIONS
    const defaults = includeDefaultExtensions
    const hint = placeholder
    const commands = slashCommands ?? EMPTY_COMMANDS
    if (!target) return
    if (config && config.target === target && config.extensions === customExtensions &&
      config.defaults === defaults && config.hint === hint && config.commands === commands) return
    clearActive()
    config = { target, extensions: customExtensions, defaults, hint, commands }

    const runtime = [
      ...createEditorSchemaExtensions(defaults, customExtensions, hint, CodeTabsExtension),
      createSvelteSlashCommandExtension(commands),
    ]
    const instance = new TiptapEditor({
      element: target,
      extensions: runtime,
      content: untrack(() => value),
      editable: untrack(() => editable),
      autofocus: untrack(() => autofocus),
      enableContentCheck: true,
      onContentError: ({ error }) => onContentError?.(error),
      onUpdate: ({ editor: current }) => onValueChange(current.getJSON()),
      editorProps: { attributes: {
        role: 'textbox', 'aria-label': untrack(() => label), 'aria-multiline': 'true',
        'data-tint-editor-input': '',
      } },
    })
    instance.on('transaction', changed)
    active = instance
    editor = instance
  })

  $effect(() => {
    if (!editor) return
    editorRef?.(editor)
    return () => editorRef?.(null)
  })

  $effect(() => {
    const current = editor
    const nextEditable = editable
    if (current) untrack(() => current.setEditable(nextEditable, false))
  })

  $effect(() => {
    const current = editor
    if (!current) return
    const accessibleLabel = label
    const attributes = current.options.editorProps.attributes ?? {}
    untrack(() => current.setOptions({ editorProps: { ...current.options.editorProps, attributes: {
      ...attributes, role: 'textbox', 'aria-label': accessibleLabel, 'aria-multiline': 'true',
      'data-tint-editor-input': '',
    } } }))
  })

  $effect(() => {
    const current = editor
    const key = externalKey
    if (!current || editorDocumentKey(current.getJSON()) === key) return
    try { untrack(() => current.commands.setContent(value, { emitUpdate: false, errorOnInvalidContent: true })) }
    catch (error) { onContentError?.(error instanceof Error ? error : new Error('Invalid editor document')) }
  })
</script>

<section data-tint-editor="" data-panel="" data-expanded={expanded || undefined} class={['editor', className].filter(Boolean).join(' ')}>
  <header class="header" data-panel-header="" data-collapsed={!expanded || undefined}>
    <button type="button" class="toggle" aria-expanded={expanded} aria-controls={bodyId} onclick={() => onExpandedChange(!expanded)}>
      <span class="chevron" data-open={expanded || undefined} aria-hidden="true">›</span>
      <span class="file-icon" aria-hidden="true">▤</span>
      <span class="title">{#if typeof title === 'string'}{title}{:else}{@render title()}{/if}</span>
    </button>
    {#if status}<div class="status">{@render status()}</div>{/if}
    {#if headerActions}<div class="actions" data-panel-actions="">{@render headerActions()}</div>{/if}
  </header>
  <div id={bodyId} data-panel-body="" hidden={!expanded} class={['body', bodyClass].filter(Boolean).join(' ')}>
    {#if editor && editor.extensionManager && editable}<EditorToolbar {editor} {version} end={toolbarEnd} />{/if}
    <div class="tint-editor-content"><div bind:this={host}></div></div>
    {#if editor && editor.extensionManager && editable}<EditorBubbleMenu {editor} {version} />{/if}
    {#if !editor}<div class="loading">Loading editor…</div>{/if}
  </div>
</section>

<style>
  .editor { position: relative; display: block; min-width: 0; overflow: hidden; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-md); background: var(--tint-panel); color: var(--tint-ink); container-type: inline-size; }
  .header { display: flex; min-height: 2.5rem; align-items: center; border-bottom: 1px solid var(--tint-border); background: var(--tint-surface); }
  .header[data-collapsed] { border-bottom-color: transparent; }
  .toggle { display: flex; min-width: 0; min-height: 2.5rem; flex: 1; align-items: center; gap: var(--tint-space-2); border: 0; background: transparent; padding: 0 var(--tint-space-3); color: var(--tint-ink); cursor: pointer; font: inherit; font-size: var(--tint-font-size-sm); font-weight: 500; text-align: left; }
  .toggle:hover { background: var(--tint-accent-soft); }
  .toggle:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: calc(var(--tint-focus-width) * -1); }
  .chevron { font-size: 1.25rem; line-height: 1; transition: transform var(--tint-motion-base) var(--tint-ease); }
  .chevron[data-open] { transform: rotate(90deg); }
  .file-icon { color: var(--tint-muted); }
  .title { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .status, .actions { display: flex; min-width: 0; align-items: center; gap: var(--tint-space-1); padding: 0 var(--tint-space-2); }
  .status { color: var(--tint-muted); font-size: var(--tint-font-size-xs); }
  .body { min-width: 0; background: var(--tint-panel); }
  .body[hidden] { display: none; }
  .loading { min-height: 16rem; padding: var(--tint-space-6); color: var(--tint-muted); font-size: var(--tint-font-size-sm); }
</style>
