import { CodeBlock } from './components/CodeBlock'
import { DocsPage, DocsSection } from './components/DocsPage'

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

export function SocketDoc() {
  return (
    <DocsPage
      route="components/socket"
      title="Socket"
      intro="Types-only contracts for graph and workbench socket wiring: named type identity, declaration flags, and the runtime/UI descriptor a node exposes."
      note={
        <>
          There is no socket UI in this package yet. Import from{' '}
          <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">tint/socket</code> (or
          the root barrel) and implement matching at the host.
        </>
      }
    >
      <DocsSection id="usage" title="Usage">
        <CodeBlock code={usage} />
      </DocsSection>

      <DocsSection id="api" title="API">
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
