import { ScrollingLabel } from '../components/scrolling-label'
import { CodeBlock } from './components/CodeBlock'
import { DocsCallout, DocsDemo, DocsFooter, DocsPage, DocsSection } from './components/DocsPage'
import { PropsTable } from './components/PropsTable'

const usage = `import { ScrollingLabel } from '@nebula/tint/scrolling-label'

<ScrollingLabel text={track.title} className="w-48" />`

const previewDemoCode = `// Fits: renders still.
<ScrollingLabel text="In Rainbows" className="w-56" />

// Overflows: holds 1.5s, then marquees.
<ScrollingLabel
  text="Everything In Its Right Place (live, from the basement, extended)"
  className="w-56"
/>`

const signature = `export type ScrollingLabelProps = HTMLAttributes<HTMLSpanElement> & {
  /** Single-line text. Marquees only when it overflows the container. */
  text: string
}`

const props = [
  {
    name: 'text',
    type: 'string',
    description:
      'The single-line label. Changing it resets the scroll offset to zero and restarts the start delay.',
  },
  {
    name: 'title',
    type: 'string',
    description: 'Tooltip override. Defaults to text, so the full label is always reachable.',
  },
  {
    name: 'className',
    type: 'string',
    description:
      'Extra classes, merged onto the clipping container. Set the width here — the component measures it.',
  },
]

export function ScrollingLabelDoc() {
  return (
    <DocsPage
      route="components/scrolling-label"
      title="Scrolling Label"
      intro="Single-line text that marquees only when it overflows its container — for now-playing lines and list primaries that must never wrap. Overflow is measured with a ResizeObserver; the scroll itself is a CSS animation driven by the measured distance."
    >
      <DocsSection
        id="preview"
        title="Preview"
        description="The second label overflows its 14rem box: it holds for 1.5s, scrolls to the end, holds, and returns. Hover it — the scroll pauses and resets so the title stays readable and clickable."
      >
        <DocsDemo code={previewDemoCode}>
          <div className="flex flex-col gap-3">
            <ScrollingLabel
              text="In Rainbows"
              className="w-56 rounded-md border border-tint-border bg-tint-surface px-3 py-1.5 text-sm"
            />
            <ScrollingLabel
              text="Everything In Its Right Place (live, from the basement, extended)"
              className="w-56 rounded-md border border-tint-border bg-tint-surface px-3 py-1.5 text-sm"
            />
          </div>
        </DocsDemo>
      </DocsSection>

      <DocsSection
        id="usage"
        title="Usage"
        description="The animation lives in tint/styles.css (keyframes tint-scrolling-label), so no extra stylesheet import is needed. prefers-reduced-motion disables the scroll and falls back to a static ellipsis."
      >
        <CodeBlock code={usage} />
        <div className="mt-4">
          <DocsCallout variant="warning" title="Hover always wins.">
            A marquee that never pauses makes the title unclickable. Hovering or
            keyboard-focusing into the label removes the animation outright —
            pause <em>and</em> reset to the start — and the 1.5s delay runs again
            when the pointer leaves.
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
