import { mount, unmount } from 'svelte'
import { CodeTabsExtension as BaseCodeTabsExtension, normalizeEditorCodeTabs, type EditorCodeTab } from '../../../core/editor'
import CodeTabsNodeView from './CodeTabsNodeView.svelte'

export const CodeTabsExtension = BaseCodeTabsExtension.extend({
  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement('div')
      dom.contentEditable = 'false'
      const tabs = normalizeEditorCodeTabs(node.attrs.tabs)
      const onApply = (next: readonly EditorCodeTab[]) => editor.commands.command(({ tr }) => {
        const position = getPos()
        if (typeof position !== 'number') return false
        tr.setNodeMarkup(position, undefined, { ...node.attrs, tabs: next })
        return true
      })
      const component = mount(CodeTabsNodeView, { target: dom, props: { tabs, onApply } })
      return {
        dom,
        update(next) {
          return next.type === node.type && JSON.stringify(next.attrs.tabs) === JSON.stringify(node.attrs.tabs)
        },
        destroy() { void unmount(component) },
      }
    }
  },
})
