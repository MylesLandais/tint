import { CodeBlock } from './components/CodeBlock'
import { DocsCallout, DocsPage, DocsSection } from './components/DocsPage'

const usage = `import type { Socket, SocketSpec, SocketType } from 'tint/socket'

const imageType: SocketType = { name: 'IMAGE' }

const latentIn: SocketSpec = {
  type: { name: 'LATENT' },
  lazy: true,
}

const refImages: Socket = {
  dataType: { name: 'IMAGE', union: ['MASK'] },
  isList: true,
  tooltip: 'Reference frames',
  extensions: {},
}`

const signature = `export interface SocketType {
  name: string
  wildcard?: boolean
  /** Alternate type names this socket also accepts or produces. */
  union?: readonly string[]
}

export interface SocketSpec {
  type: SocketType
  rawLink?: boolean
  lazy?: boolean
}

export interface Socket {
  dataType: SocketType
  isList: boolean
  tooltip?: string
  matchType?: string
  extensions: Readonly<Record<string, unknown>>
}`

export function SocketDoc() {
  return (
    <DocsPage
      route="components/socket"
      title="Socket"
      intro="Types-only contracts for graph and workbench socket wiring: named type identity, declaration flags, and the runtime/UI descriptor a node exposes."
    >
      <DocsSection
        id="usage"
        title="Usage"
        description={
          <>
            The three types below cover the full contract: <code>SocketType</code> names the type,
            <code>SocketSpec</code> declares it on a node definition, and <code>Socket</code> is the
            runtime/UI descriptor a node exposes.
          </>
        }
      >
        <div className="space-y-6">
          <CodeBlock code={usage} />
          <DocsCallout variant="note" title="Types only, no UI">
            There is no socket UI in this package yet. Import from <code>tint/socket</code> (or the
            root barrel) and implement matching at the host.
          </DocsCallout>
        </div>
      </DocsSection>

      <DocsSection id="api" title="API">
        <p className="mt-0 mb-4 max-w-3xl text-sm leading-6 text-tint-muted">
          The full type signatures, from the source:
        </p>
        <div className="mb-6">
          <CodeBlock code={signature} />
        </div>
        <div className="overflow-x-auto rounded-xl border border-tint-border">
          <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
            <thead className="bg-tint-surface text-xs tracking-[0.06em] text-tint-muted uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Role</th>
              </tr>
            </thead>
            <tbody className="text-tint-ink">
              <tr className="border-t border-tint-border">
                <td className="px-4 py-3 font-mono text-[0.85em]">SocketType</td>
                <td className="px-4 py-3 text-tint-muted">
                  Named type identity with optional <code>wildcard</code> / <code>union</code>.
                </td>
              </tr>
              <tr className="border-t border-tint-border">
                <td className="px-4 py-3 font-mono text-[0.85em]">SocketSpec</td>
                <td className="px-4 py-3 text-tint-muted">
                  Declaration on a node definition, including <code>rawLink</code> / <code>lazy</code>{' '}
                  evaluation flags.
                </td>
              </tr>
              <tr className="border-t border-tint-border">
                <td className="px-4 py-3 font-mono text-[0.85em]">Socket</td>
                <td className="px-4 py-3 text-tint-muted">
                  Runtime/UI descriptor: <code>dataType</code>, <code>isList</code>, optional tooltip
                  / match key, and opaque <code>extensions</code>.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </DocsSection>
    </DocsPage>
  )
}
