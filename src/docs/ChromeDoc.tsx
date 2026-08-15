import { useState } from 'react'
import { Badge } from '../components/badge'
import { ProgressBar } from '../components/progress'
import { Dialog } from '../components/dialog'
import { ContextMenu } from '../components/context-menu'
import { TreeView, type TreeNode } from '../components/tree'
import { ToastProvider, useToast } from '../components/toast'
import { CodeBlock } from './components/CodeBlock'
import {
  DocsDemo,
  DocsFooter,
  DocsPage,
  DocsSection,
} from './components/DocsPage'
import { PropsTable } from './components/PropsTable'

const usage = `import { Badge } from 'tint/badge'
import { ProgressBar } from 'tint/progress'
import { Dialog } from 'tint/dialog'
import { ContextMenu } from 'tint/context-menu'
import { TreeView } from 'tint/tree'
import { ToastProvider, useToast } from 'tint/toast'`

const TREE: TreeNode[] = [
  {
    id: 'album',
    label: 'Album',
    children: [
      { id: 'a1', label: '01 Intro.flac', trailing: '12 MB' },
      { id: 'a2', label: '02 Track.flac', trailing: '28 MB' },
    ],
  },
]

function ToastDemoButton() {
  const { push } = useToast()
  return (
    <button
      type="button"
      className="rounded-lg border border-tint-border px-3 py-1.5 text-sm hover:bg-tint-surface"
      onClick={() =>
        push({ title: 'Torrent complete', description: 'Album finished seeding.', tone: 'success' })
      }
    >
      Show toast
    </button>
  )
}

export function ChromeDoc() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null)
  const [expandedIds, setExpandedIds] = useState<string[]>(['album'])
  const [selectedIds, setSelectedIds] = useState<string[]>(['a1'])
  const [progress, setProgress] = useState(64)

  return (
    <ToastProvider>
      <DocsPage
        route="components/chrome"
        title="Chrome"
        intro="Controlled feedback and overlay primitives shared by dense data UIs: badges, progress, dialogs, context menus, trees, and toasts. Host owns all state."
        wide
      >
        <DocsSection id="preview" title="Preview">
          <DocsDemo
            code={`<Badge tone="success">seeding</Badge>
<ProgressBar value={64} label="Transfer" showValue />
<Dialog open={…} title="Add torrent" onOpenChange={…}>…</Dialog>
<ContextMenu open={…} position={…} items={…} />
<TreeView nodes={…} expandedIds={…} selectedIds={…} />
<ToastProvider>…</ToastProvider>`}
          >
            <div className="flex flex-col gap-6 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="accent">downloading</Badge>
                <Badge tone="success">seeding</Badge>
                <Badge tone="warning">paused</Badge>
                <Badge tone="danger">error</Badge>
              </div>
              <div className="max-w-md space-y-2">
                <ProgressBar value={progress} label="Transfer" showValue />
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={progress}
                  onChange={(event) => setProgress(Number(event.target.value))}
                  aria-label="Demo progress"
                  className="w-full"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-tint-border px-3 py-1.5 text-sm hover:bg-tint-surface"
                  onClick={() => setDialogOpen(true)}
                >
                  Open dialog
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-tint-border px-3 py-1.5 text-sm hover:bg-tint-surface"
                  onContextMenu={(event) => {
                    event.preventDefault()
                    setMenuPos({ x: event.clientX, y: event.clientY })
                    setMenuOpen(true)
                  }}
                >
                  Right-click me
                </button>
                <ToastDemoButton />
              </div>
              <TreeView
                className="max-w-md rounded-lg border border-tint-border p-2"
                nodes={TREE}
                expandedIds={expandedIds}
                onExpandedChange={setExpandedIds}
                selectedIds={selectedIds}
                onSelectedChange={setSelectedIds}
              />
            </div>
          </DocsDemo>
        </DocsSection>

        <DocsSection id="usage" title="Usage">
          <CodeBlock code={usage} />
        </DocsSection>

        <DocsSection id="api" title="API">
          <pre className="mb-4 overflow-x-auto rounded-lg border border-tint-border bg-tint-surface p-3 text-xs">
            {`Badge / ProgressBar / Dialog / ContextMenu / TreeView / ToastProvider + useToast`}
          </pre>
          <PropsTable
            rows={[
              { name: 'Badge.tone', type: 'BadgeTone', description: 'neutral | accent | success | warning | danger | info' },
              { name: 'ProgressBar.value', type: 'number', required: true, description: '0–100 determinate progress.' },
              { name: 'Dialog.open', type: 'boolean', required: true, description: 'Controlled visibility.' },
              { name: 'Dialog.onOpenChange', type: '(open: boolean) => void', required: true, description: 'Dismiss callback.' },
              { name: 'ContextMenu.position', type: '{ x: number; y: number } | null', required: true, description: 'Pointer origin.' },
              { name: 'TreeView.expandedIds', type: 'string[] | Set<string>', required: true, description: 'Expanded node ids.' },
              { name: 'useToast().push', type: '(toast: ToastInput) => string', description: 'Enqueue a toast; returns id.' },
            ]}
          />
        </DocsSection>

        <Dialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title="Add torrent"
          description="Paste a magnet link or drop a .torrent file."
          actions={
            <>
              <button
                type="button"
                className="rounded-lg border border-tint-border px-3 py-1.5 text-sm"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-tint-accent px-3 py-1.5 text-sm text-tint-on-accent"
                onClick={() => setDialogOpen(false)}
              >
                Add
              </button>
            </>
          }
        >
          <textarea
            className="min-h-24 w-full rounded-lg border border-tint-border bg-tint-surface p-2 font-mono text-xs"
            placeholder="magnet:?xt=urn:btih:…"
            defaultValue=""
          />
        </Dialog>

        <ContextMenu
          open={menuOpen}
          position={menuPos}
          onOpenChange={setMenuOpen}
          items={[
            { id: 'start', label: 'Start' },
            { id: 'stop', label: 'Stop' },
            { type: 'separator', id: 'sep' },
            { id: 'delete', label: 'Delete', danger: true },
          ]}
        />

        <DocsFooter />
      </DocsPage>
    </ToastProvider>
  )
}
