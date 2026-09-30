import { Extension, type Editor } from '@tiptap/core'
import Suggestion, { type SuggestionProps } from '@tiptap/suggestion'
import { mount, unmount } from 'svelte'
import { get, writable } from 'svelte/store'
import { filterEditorSlashCommands, mergeEditorSlashCommands } from '../../../core/editor'
import SlashMenu from './SlashMenu.svelte'
import type { EditorSlashCommand } from './types'

type Props = SuggestionProps<EditorSlashCommand, EditorSlashCommand>
let menuSerial = 0

export function createSvelteSlashCommandExtension(custom: readonly EditorSlashCommand[]) {
  const commands = mergeEditorSlashCommands(custom) as EditorSlashCommand[]
  return Extension.create({
    name: 'tintSlashCommands',
    addProseMirrorPlugins() {
      const themedAncestor = this.editor.view.dom.closest<HTMLElement>('[data-theme], [data-scheme]')
      const container = themedAncestor && themedAncestor !== document.documentElement ? themedAncestor : document.body
      return [Suggestion<EditorSlashCommand, EditorSlashCommand>({
        editor: this.editor,
        char: '/',
        startOfLine: true,
        container,
        allow: ({ state, range }) => state.doc.resolve(range.from).parent.type.name !== 'codeBlock',
        items: ({ query, editor }) => filterEditorSlashCommands(commands, query, editor as Editor),
        command: ({ editor, range, props }) => props.command({ editor, range }),
        render: () => {
          const menuId = `tint-editor-slash-${++menuSerial}`
          const editorDom = this.editor.view.dom
          let element: HTMLDivElement | null = null
          let component: ReturnType<typeof mount> | null = null
          let release: (() => void) | null = null
          let current: Props | null = null
          let previousAttributes: Map<string, string | null> | null = null
          const selected = writable(0)
          let unsubscribeSelected: (() => void) | null = null
          const updateActive = (index: number) => {
            if (current?.items[index]) editorDom.setAttribute('aria-activedescendant', `${menuId}-option-${index}`)
            else editorDom.removeAttribute('aria-activedescendant')
          }
          const choose = (item: EditorSlashCommand) => current?.command(item)
          const renderMenu = (props: Props) => {
            if (!element) return
            if (component) void unmount(component)
            current = props
            selected.set(0)
            editorDom.setAttribute('aria-expanded', String(props.items.length > 0))
            updateActive(0)
            component = mount(SlashMenu, { target: element, props: { items: props.items, selected, onChoose: choose, menuId } })
          }
          return {
            onStart: (props) => {
              previousAttributes = new Map(['aria-haspopup', 'aria-controls', 'aria-expanded', 'aria-activedescendant'].map((name) => [name, editorDom.getAttribute(name)]))
              unsubscribeSelected = selected.subscribe(updateActive)
              editorDom.setAttribute('aria-haspopup', 'listbox')
              editorDom.setAttribute('aria-controls', menuId)
              element = document.createElement('div')
              release = props.mount(element)
              renderMenu(props)
            },
            onUpdate: (props) => renderMenu(props),
            onKeyDown: ({ event }) => {
              if (event.key === 'Escape') return false
              const items = current?.items ?? []
              if (!items.length) return event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'Enter'
              if (event.key === 'ArrowUp') { selected.set((get(selected) + items.length - 1) % items.length); return true }
              if (event.key === 'ArrowDown') { selected.set((get(selected) + 1) % items.length); return true }
              if (event.key === 'Enter') { choose(items[get(selected)]!); return true }
              return false
            },
            onExit: () => {
              for (const [name, value] of previousAttributes ?? []) {
                if (value === null) editorDom.removeAttribute(name)
                else editorDom.setAttribute(name, value)
              }
              previousAttributes = null
              unsubscribeSelected?.()
              unsubscribeSelected = null
              release?.()
              if (component) void unmount(component)
              element = null
              component = null
              release = null
              current = null
            },
          }
        },
      })]
    },
  })
}
