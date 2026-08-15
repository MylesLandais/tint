import { useState } from 'react'
import { FileText } from 'lucide-react'
import { Panel } from '../components/panel'
import { Icon, StatusIcon } from '../components/icon'
import { CodeBlock } from './components/CodeBlock'
import {
  DocsCallout,
  DocsDemo,
  DocsFooter,
  DocsPage,
  DocsSection,
} from './components/DocsPage'
import { PropsTable } from './components/PropsTable'

const usage = `import { Panel } from 'tint/panel'

const [open, setOpen] = useState(true)

<Panel
  title="Notes"
  icon={<Icon icon={FileText} size="sm" />}
  status={<StatusIcon status="success" size="xs" />}
  expanded={open}
  onExpandedChange={setOpen}
>
  <p>Body content stays mounted while collapsed.</p>
</Panel>`

const previewDemoCode = `<Panel
  title="Notes"
  icon={<Icon icon={FileText} size="sm" />}
  expanded={open}
  onExpandedChange={setOpen}
>
  <div className="p-4 text-sm text-tint-muted">
    The body is hidden with the hidden attribute rather than
    unmounted, so scroll position and focus survive a collapse.
  </div>
</Panel>

<Panel
  title="Build log"
  status={
    <span className="flex items-center gap-1.5">
      <StatusIcon status="success" size="xs" />
      Passed
    </span>
  }
  actions={
    <button type="button" onClick={() => setLogOpen(true)}>
      Expand
    </button>
  }
  expanded={logOpen}
  onExpandedChange={setLogOpen}
>
  <pre>✓ 279 tests passed</pre>
</Panel>`

const signature = `export type PanelProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  /** Always-visible label for the panel disclosure. */
  title: ReactNode
  /** Decorative content rendered before the title, inside the toggle button. */
  icon?: ReactNode
  /** Connection or document state rendered beside the title, outside the button. */
  status?: ReactNode
  /** Controls rendered outside the disclosure button, so they stay independently clickable. */
  actions?: ReactNode
  /** Controlled disclosure state. The body stays mounted while collapsed. */
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  /** Extra classes for the header row. */
  headerClassName?: string
  /** Extra classes for the body wrapper. */
  bodyClassName?: string
}`

const props = [
  { name: 'title', type: 'ReactNode', required: true, description: 'Always-visible label for the disclosure button.' },
  { name: 'expanded', type: 'boolean', required: true, description: 'Controlled disclosure state. The body stays mounted while collapsed.' },
  { name: 'onExpandedChange', type: '(expanded: boolean) => void', required: true, description: 'Called with the requested next state when the header is activated.' },
  { name: 'icon', type: 'ReactNode', description: 'Decorative content rendered before the title, inside the button.' },
  { name: 'status', type: 'ReactNode', description: 'Connection or document state rendered beside the title, outside the button.' },
  { name: 'actions', type: 'ReactNode', description: 'Controls rendered outside the disclosure button, so they stay independently clickable.' },
  { name: 'headerClassName', type: 'string', description: 'Extra classes for the header row.' },
  { name: 'bodyClassName', type: 'string', description: 'Extra classes for the body wrapper. See the display caveat below.' },
  { name: 'className', type: 'string', description: 'Extra classes for the panel root.' },
]

export function PanelDoc() {
  const [open, setOpen] = useState(true)
  const [logOpen, setLogOpen] = useState(false)

  return (
    <DocsPage
      route="components/panel"
      title="Panel"
      intro="The controlled disclosure shell the Editor and Terminal are mounted inside. It owns the header, the expand button, and the body wrapper — and nothing else, so a workbench can coordinate several panels from one store."
    >
      <DocsSection id="preview" title="Preview">
        <DocsDemo code={previewDemoCode}>
          <div className="flex flex-col gap-4">
            <Panel
              title="Notes"
              icon={<Icon icon={FileText} size="sm" />}
              expanded={open}
              onExpandedChange={setOpen}
            >
              <div className="p-4 text-sm text-tint-muted">
                The body is hidden with the <code>hidden</code> attribute rather than
                unmounted, so scroll position and focus survive a collapse.
              </div>
            </Panel>

            <Panel
              title="Build log"
              status={
                <span className="flex items-center gap-1.5">
                  <StatusIcon status="success" size="xs" />
                  Passed
                </span>
              }
              actions={
                <button
                  type="button"
                  onClick={() => setLogOpen(true)}
                  className="rounded-md px-2 py-1 text-xs text-tint-muted hover:bg-tint-accent-soft hover:text-tint-ink focus-visible:outline-2 focus-visible:outline-tint-accent"
                >
                  Expand
                </button>
              }
              expanded={logOpen}
              onExpandedChange={setLogOpen}
            >
              <pre className="m-0 overflow-x-auto p-4 text-xs text-tint-muted">
                ✓ 279 tests passed
              </pre>
            </Panel>
          </div>
        </DocsDemo>
      </DocsSection>

      <DocsSection
        id="usage"
        title="Usage"
        description="Controlled like the rest of the library: Panel never holds its own open state, so an app can persist it, sync it across panels, or drive it from a route."
      >
        <CodeBlock code={usage} />
        <div className="mt-4">
          <DocsCallout variant="warning" title="Watch the body’s display.">
            Collapsing sets the <code>hidden</code> attribute, which only produces{' '}
            <code>display: none</code> at user-agent priority. Any display utility in{' '}
            <code>bodyClassName</code> — <code>flex</code>, <code>grid</code>,{' '}
            <code>block</code> — outranks it and leaves a “collapsed” panel fully visible.
            Put layout on an element inside the body instead.
          </DocsCallout>
        </div>
      </DocsSection>

      <DocsSection id="api" title="API">
        <p className="mt-0 mb-4 max-w-3xl text-sm leading-6 text-tint-muted">
          The full prop signature, from the source:
        </p>
        <CodeBlock code={signature} language="tsx" className="mb-6" />
        <PropsTable rows={props} />
      </DocsSection>

      <DocsFooter />
    </DocsPage>
  )
}
