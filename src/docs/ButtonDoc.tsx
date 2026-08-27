import { Trash2 } from 'lucide-react'
import { Button } from '../components/button'
import { Icon } from '../components/icon'
import { CodeBlock } from './components/CodeBlock'
import { DocsCallout, DocsDemo, DocsFooter, DocsPage, DocsSection } from './components/DocsPage'
import { PropsTable } from './components/PropsTable'

const usage = `import { Button } from 'tint/button'

<Button variant="primary" onClick={save}>Save</Button>
<Button variant="danger" size="sm" onClick={remove}>Delete</Button>`

const anchorUsage = `// The same surface, on an element this package never renders.
<a className="tint-button" data-variant="secondary" data-size="md" href={oauthUrl}>
  Connect Google
</a>`

const previewDemoCode = `<Button variant="primary">Save & activate</Button>
<Button>Test connection</Button>
<Button variant="ghost">Cancel</Button>
<Button variant="danger" leading={<Icon icon={Trash2} size="sm" />}>Delete</Button>
<Button disabled>Saving…</Button>`

const signature = `export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Visual weight. Defaults to the neutral bordered surface. */
  variant?: 'secondary' | 'primary' | 'ghost' | 'danger'
  /** Control height. \`md\` matches the form inputs, for buttons beside a field. */
  size?: 'sm' | 'md' | 'lg'
  /** Optional leading content (icon). */
  leading?: ReactNode
}`

const props = [
  {
    name: 'variant',
    type: "'secondary' | 'primary' | 'ghost' | 'danger'",
    description: 'Visual weight. Defaults to secondary, the neutral bordered surface.',
  },
  {
    name: 'size',
    type: "'sm' | 'md' | 'lg'",
    description:
      'Control height. Omit for the base height; md matches the 2.75rem form inputs so a button lines up beside a field.',
  },
  { name: 'leading', type: 'ReactNode', description: 'Content rendered before the label, usually an icon.' },
  {
    name: 'type',
    type: "'button' | 'submit' | 'reset'",
    description: 'Defaults to button, not the HTML default of submit. See the note under Usage.',
  },
  { name: 'className', type: 'string', description: 'Extra classes, merged with tint-button.' },
]

export function ButtonDoc() {
  return (
    <DocsPage
      route="components/button"
      title="Button"
      intro="The shared button surface, as a component and as a bare class. Variant and size are data attributes so an anchor can wear the same surface without JavaScript."
    >
      <DocsSection id="preview" title="Preview">
        <DocsDemo code={previewDemoCode}>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Save &amp; activate</Button>
            <Button>Test connection</Button>
            <Button variant="ghost">Cancel</Button>
            <Button variant="danger" leading={<Icon icon={Trash2} size="sm" />}>
              Delete
            </Button>
            <Button disabled>Saving…</Button>
          </div>
        </DocsDemo>
      </DocsSection>

      <DocsSection
        id="usage"
        title="Usage"
        description="Styling lives in styles/button.css rather than in the component, which is what lets the class travel to elements this package never renders."
      >
        <CodeBlock code={usage} />
        <div className="mt-4">
          <DocsCallout variant="warning" title="type defaults to button.">
            The HTML default is <code>submit</code>, which turns every unadorned button
            inside a form into an accidental submit. Pass <code>type="submit"</code>
            explicitly for the one that should send.
          </DocsCallout>
        </div>
      </DocsSection>

      <DocsSection
        id="anchors"
        title="On anchors and other elements"
        description="An OAuth link is an <a> and cannot be a <Button>. Apply the class and the same data attributes directly — no import required beyond tint/styles.css."
      >
        <CodeBlock code={anchorUsage} language="tsx" />
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
