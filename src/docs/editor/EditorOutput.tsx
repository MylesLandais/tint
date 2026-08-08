import { useState } from 'react'
import { CodeBlock } from '../components/CodeBlock'
import type { EditorDocument } from '../../components/editor'
import { editorDocumentToHTML } from '../../components/editor'

export function EditorOutput({ document }: { document: EditorDocument }) {
  const [tab, setTab] = useState<'html' | 'json'>('html')
  const code = tab === 'html' ? editorDocumentToHTML(document) : JSON.stringify(document, null, 2)
  const language = tab

  return (
    <section className="mt-4 overflow-hidden rounded-xl border border-tint-border bg-tint-panel" aria-label="Editor output">
      <div role="tablist" aria-label="Editor output format" className="flex border-b border-tint-border bg-tint-surface px-2">
        {(['html', 'json'] as const).map((candidate) => (
          <button
            key={candidate}
            type="button"
            role="tab"
            aria-selected={tab === candidate}
            onClick={() => setTab(candidate)}
            className="border-b-2 border-transparent px-3 py-2 text-xs font-medium text-tint-muted hover:text-tint-ink aria-selected:border-tint-accent aria-selected:text-tint-ink"
          >
            {candidate.toUpperCase()}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="p-3">
        <CodeBlock code={code} language={language} />
      </div>
    </section>
  )
}
