import { useMemo, useState } from 'react'
import {
  DEMO_FORM_SCHEMA,
  FormLayout,
  createMemoryFormTransport,
  defaultValuesForSchema,
  type FormSchema,
  type FormValues,
} from '../../components/form'
import '../../components/form/styles.css'
import { CodeBlock } from '../components/CodeBlock'
import { DocsPage, DocsPreview, DocsSection } from '../components/DocsPage'
import { PropsTable } from '../components/PropsTable'

const usage = `import { useState } from 'react'
import {
  FormLayout,
  DEMO_FORM_SCHEMA,
  createMemoryFormTransport,
  defaultValuesForSchema,
} from 'tint/form'
import 'tint/form/styles.css'

const [values, setValues] = useState(() => defaultValuesForSchema(DEMO_FORM_SCHEMA))
const transport = createMemoryFormTransport({
  persist: async (next) => next,
})

<FormLayout
  schema={DEMO_FORM_SCHEMA}
  values={values}
  onValuesChange={setValues}
  transport={transport}
/>`

const props = [
  { name: 'schema', type: 'FormSchema', required: true, description: 'Sections and fields. The form is this data, rendered.' },
  { name: 'values', type: 'FormValues', required: true, description: 'Controlled values. Nested paths use dotted field names.' },
  { name: 'onValuesChange', type: '(values: FormValues) => void', required: true, description: 'Receives the next values object; the previous is not mutated.' },
  { name: 'issues', type: 'readonly FormIssue[]', description: 'Field-level issues keyed by path. Client validate runs on submit if omitted.' },
  { name: 'busy', type: 'boolean', defaultValue: 'false', description: 'Disables the form and swaps in submittingLabel.' },
  { name: 'disabled', type: 'boolean', defaultValue: 'false', description: 'Disables every control without implying an in-flight submit.' },
  { name: 'readonly', type: 'boolean', defaultValue: 'false', description: 'Same lock as disabled; used by the graph inspector.' },
  { name: 'error', type: 'ReactNode', description: 'Form-level alert, rendered above the sections.' },
  { name: 'density', type: "'compact' | 'comfortable'", defaultValue: "'comfortable'", description: 'Spacing between fields.' },
  { name: 'columns', type: '1 | 2', defaultValue: '1', description: 'Field columns inside each section. Collapses to one on narrow viewports.' },
  { name: 'submitLabel', type: 'string', defaultValue: "'Submit'", description: 'Idle submit button copy.' },
  { name: 'submittingLabel', type: 'string', defaultValue: "'Submitting…'", description: 'Busy submit button copy.' },
  { name: 'hideSubmit', type: 'boolean', defaultValue: 'false', description: 'Hide the submit button when a parent owns the save action.' },
  { name: 'className', type: 'string', description: 'Appended to tint-form.' },
  { name: 'transport', type: 'FormTransport', description: 'validate then submit. Field issues resolve; transport failures reject.' },
  { name: 'onSubmit', type: '(envelope: FormSubmitEnvelope) => void | Promise<void>', description: 'Called after client (and transport) validation succeeds.' },
  { name: 'onValidation', type: '(issues: readonly FormIssue[]) => void', description: 'Receives the issues from the submit-time client validate.' },
  { name: 'onSubmitError', type: '(error: unknown) => void', description: 'Called when transport or onSubmit rejects. The form also shows the message in its banner.' },
]

function parseSchema(text: string): { schema: FormSchema | null; error: string | null } {
  try {
    const parsed = JSON.parse(text) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { schema: null, error: 'Schema must be a JSON object.' }
    }
    const candidate = parsed as FormSchema
    if (typeof candidate.id !== 'string' || !Array.isArray(candidate.sections)) {
      return { schema: null, error: 'Schema needs an id and a sections array.' }
    }
    return { schema: candidate, error: null }
  } catch (cause) {
    return { schema: null, error: cause instanceof Error ? cause.message : 'Invalid JSON.' }
  }
}

export function FormDoc() {
  const [schemaText, setSchemaText] = useState(() => JSON.stringify(DEMO_FORM_SCHEMA, null, 2))
  const parsed = useMemo(() => parseSchema(schemaText), [schemaText])
  const schema = parsed.schema ?? DEMO_FORM_SCHEMA
  const [values, setValues] = useState<FormValues>(() => defaultValuesForSchema(DEMO_FORM_SCHEMA))
  const [lastSubmit, setLastSubmit] = useState<string | null>(null)
  const transport = useMemo(
    () =>
      createMemoryFormTransport({
        persist: async (next) => next,
      }),
    [],
  )

  return (
    <DocsPage
      route="components/form"
      title="Form"
      intro="Schema-driven layouts and a Promise-based submit contract. Hosts own the values; Tint maps FormSchema onto labelled inputs and an envelope the host's FormTransport can persist."
      note={
        <>
          Sign-in and the character card editor are composed on this kit — they do not
          keep a second input stack. Graph node configuration uses the same envelope,
          reduced to <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">node.configure</code>.
        </>
      }
    >
      <DocsSection
        id="preview"
        title="Preview"
        description="Edit the schema JSON. A valid document re-renders the form immediately."
      >
        <DocsPreview className="grid gap-6 lg:grid-cols-2">
          <FormLayout
            schema={schema}
            values={values}
            onValuesChange={setValues}
            transport={transport}
            onSubmit={(envelope) => {
              setLastSubmit(JSON.stringify(envelope.values, null, 2))
            }}
          />
          <div className="flex min-h-[24rem] flex-col gap-2">
            {parsed.error ? (
              <p className="m-0 text-sm text-tint-danger" role="alert">
                {parsed.error}
              </p>
            ) : (
              <p className="m-0 text-sm text-tint-muted">
                Schema {schema.id} · v{schema.version}
              </p>
            )}
            <textarea
              className="min-h-[24rem] flex-1 rounded-md border border-tint-border bg-tint-surface p-3 font-mono text-[13px] leading-5 text-tint-ink"
              value={schemaText}
              spellCheck={false}
              aria-label="Form schema JSON"
              onChange={(event) => setSchemaText(event.target.value)}
            />
          </div>
        </DocsPreview>
        {lastSubmit ? (
          <p className="mt-3 font-mono text-xs whitespace-pre-wrap text-tint-muted">{lastSubmit}</p>
        ) : null}
      </DocsSection>

      <DocsSection id="schema" title="Schema">
        <p className="mt-0 mb-4 max-w-3xl text-sm leading-6 text-tint-muted">
          A form is sections of named fields. <code>kind</code> selects the input;
          <code>name</code> is a dotted path into <code>values</code>. Repeatable
          fields either hold primitives (<code>itemKind</code>) or objects (
          <code>itemSchema</code>).
        </p>
        <CodeBlock code={JSON.stringify(DEMO_FORM_SCHEMA, null, 2)} language="json" title="json" />
      </DocsSection>

      <DocsSection id="usage" title="Usage">
        <CodeBlock code={usage} />
      </DocsSection>

      <DocsSection id="api" title="API">
        <PropsTable rows={props} />
      </DocsSection>
    </DocsPage>
  )
}
