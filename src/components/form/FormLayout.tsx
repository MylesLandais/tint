import React, { useId, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import type { FormField, FormSchema, FormSection } from './contracts'
import {
  appendAtPath,
  createFormSubmitEnvelope,
  defaultItemForField,
  getAtPath,
  isFormFileValue,
  removeAtIndex,
  setAtPath,
  validateForm,
  type FormFileValue,
  type FormIssue,
  type FormSubmitEnvelope,
  type FormTransport,
  type FormValues,
} from './contracts'
import { FormControl } from './FormControl'
import {
  FileField,
  NumberField,
  PasswordField,
  SelectField,
  SliderField,
  TagsField,
  TextAreaField,
  TextField,
  ToggleField,
} from './inputs'

void React

export type FormLayoutProps = {
  schema: FormSchema
  values: FormValues
  onValuesChange: (values: FormValues) => void
  issues?: readonly FormIssue[]
  busy?: boolean
  disabled?: boolean
  readonly?: boolean
  error?: ReactNode
  density?: 'compact' | 'comfortable'
  columns?: 1 | 2
  submitLabel?: string
  submittingLabel?: string
  hideSubmit?: boolean
  className?: string
  transport?: FormTransport<FormValues, unknown>
  onSubmit?: (envelope: FormSubmitEnvelope<FormValues>) => void | Promise<void>
  onValidation?: (issues: readonly FormIssue[]) => void
}

/**
 * Schema in, labelled fields out. The host owns `values`; this owns the
 * mapping from `FormField.kind` onto the input primitives.
 *
 * Submit builds a `FormSubmitEnvelope` and, when a `transport` is supplied,
 * runs `validate` then `submit`. Field issues resolve — they do not reject.
 */
export function FormLayout({
  schema,
  values,
  onValuesChange,
  issues: issueProp,
  busy = false,
  disabled = false,
  readonly = false,
  error,
  density = 'comfortable',
  columns = 1,
  submitLabel = 'Submit',
  submittingLabel = 'Submitting…',
  hideSubmit = false,
  className,
  transport,
  onSubmit,
  onValidation,
}: FormLayoutProps) {
  const prefix = useId()
  const [localIssues, setLocalIssues] = useState<readonly FormIssue[]>([])
  const issues = issueProp ?? localIssues
  const locked = busy || disabled || readonly

  const issuesByPath = useMemo(() => {
    const map = new Map<string, string>()
    for (const issue of issues) {
      if (issue.path && issue.severity === 'error' && !map.has(issue.path)) {
        map.set(issue.path, issue.message)
      }
    }
    return map
  }, [issues])

  function setPath(path: string, value: unknown) {
    onValuesChange(setAtPath(values, path, value))
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (locked) return
    const result = validateForm(schema, values)
    setLocalIssues(result.issues)
    onValidation?.(result.issues)
    if (!result.ok) return

    const envelope = createFormSubmitEnvelope(schema, values)
    if (transport) {
      void submitWithTransport(envelope)
      return
    }
    void onSubmit?.(envelope)
  }

  async function submitWithTransport(envelope: FormSubmitEnvelope<FormValues>) {
    const remote = await transport!.validate(envelope)
    if (!remote.ok) {
      setLocalIssues(remote.issues)
      onValidation?.(remote.issues)
      return
    }
    await transport!.submit(envelope)
    await onSubmit?.(envelope)
  }

  return (
    <form
      className={['tint-form', className].filter(Boolean).join(' ')}
      data-density={density}
      data-columns={columns}
      onSubmit={(event) => submit(event)}
      noValidate
    >
      {schema.title ? <h2 className="tint-form-title">{schema.title}</h2> : null}
      {schema.description ? <p className="tint-form-lede">{schema.description}</p> : null}
      {error ? (
        <div className="tint-form-banner" role="alert" aria-live="polite">
          {error}
        </div>
      ) : null}
      {schema.sections.map((section) => (
        <FormSectionView
          key={section.id}
          section={section}
          prefix={prefix}
          values={values}
          issuesByPath={issuesByPath}
          locked={locked}
          onSetPath={setPath}
          onValuesChange={onValuesChange}
        />
      ))}
      {hideSubmit ? null : (
        <button className="tint-form-submit" type="submit" disabled={locked}>
          {busy ? submittingLabel : submitLabel}
        </button>
      )}
    </form>
  )
}

function FormSectionView({
  section,
  prefix,
  values,
  issuesByPath,
  locked,
  onSetPath,
  onValuesChange,
  pathPrefix = '',
}: {
  section: FormSection
  prefix: string
  values: FormValues
  issuesByPath: Map<string, string>
  locked: boolean
  onSetPath: (path: string, value: unknown) => void
  onValuesChange: (values: FormValues) => void
  pathPrefix?: string
}) {
  return (
    <fieldset className="tint-form-section" disabled={locked}>
      {section.title ? <legend className="tint-form-section__title">{section.title}</legend> : null}
      {section.description ? <p className="tint-form-section__description">{section.description}</p> : null}
      <div className="tint-form-fields">
        {section.fields.map((field) => {
          const path = joinPath(pathPrefix, field.name)
          return (
            <FieldView
              key={path || field.label}
              field={field}
              path={path}
              prefix={prefix}
              values={values}
              issuesByPath={issuesByPath}
              locked={locked}
              onSetPath={onSetPath}
              onValuesChange={onValuesChange}
            />
          )
        })}
      </div>
    </fieldset>
  )
}

function FieldView({
  field,
  path,
  prefix,
  values,
  issuesByPath,
  locked,
  onSetPath,
  onValuesChange,
}: {
  field: FormField
  path: string
  prefix: string
  values: FormValues
  issuesByPath: Map<string, string>
  locked: boolean
  onSetPath: (path: string, value: unknown) => void
  onValuesChange: (values: FormValues) => void
}) {
  const id = `${prefix}-${path || field.label}`.replace(/[^A-Za-z0-9_-]/g, '-')
  const error = issuesByPath.get(path)
  const raw = getAtPath(values, path)
  const shared = {
    id,
    description: field.description,
    error,
    disabled: locked,
  }

  if (field.kind === 'repeatable') {
    const items = Array.isArray(raw) ? raw : []
    return (
      <div className="tint-form-repeatable">
        <div className="tint-form-repeatable__header">
          <p className="tint-form-label">{field.label}</p>
          <button
            type="button"
            className="tint-form-repeatable__add"
            disabled={locked}
            onClick={() => onValuesChange(appendAtPath(values, path, defaultItemForField(field)))}
          >
            {field.addLabel ?? `Add ${field.label}`}
          </button>
        </div>
        {field.description ? <p className="tint-form-description">{field.description}</p> : null}
        {error ? (
          <p className="tint-form-error" role="alert">
            {error}
          </p>
        ) : null}
        <ol className="tint-form-repeatable__list">
          {items.map((item, index) => {
            const itemPath = `${path}.${index}`
            return (
              <li key={itemPath} className="tint-form-repeatable__item">
                <div className="tint-form-repeatable__item-bar">
                  <span>
                    {field.label} {index + 1}
                  </span>
                  <button
                    type="button"
                    className="tint-form-repeatable__remove"
                    disabled={locked}
                    onClick={() => onValuesChange(removeAtIndex(values, path, index))}
                  >
                    {field.removeLabel ?? 'Remove'}
                  </button>
                </div>
                {field.itemSchema ? (
                  <FormSectionView
                    section={field.itemSchema}
                    prefix={`${prefix}-${index}`}
                    values={values}
                    issuesByPath={issuesByPath}
                    locked={locked}
                    onSetPath={onSetPath}
                    onValuesChange={onValuesChange}
                    pathPrefix={itemPath}
                  />
                ) : (
                  <PrimitiveItem
                    kind={field.itemKind ?? 'textarea'}
                    id={`${id}-${index}`}
                    value={item}
                    locked={locked}
                    error={issuesByPath.get(itemPath)}
                    onChange={(next) => onSetPath(itemPath, next)}
                  />
                )}
              </li>
            )
          })}
        </ol>
      </div>
    )
  }

  return (
    <FormControl
      id={id}
      label={field.label}
      description={field.description}
      error={error}
      required={field.required}
      disabled={locked}
    >
      <KindInput
        field={field}
        shared={shared}
        raw={raw}
        locked={locked}
        onSetPath={onSetPath}
        path={path}
      />
    </FormControl>
  )
}

function KindInput({
  field,
  shared,
  raw,
  locked,
  onSetPath,
  path,
}: {
  field: FormField
  shared: { id: string; description?: string; error?: string; disabled?: boolean }
  raw: unknown
  locked: boolean
  onSetPath: (path: string, value: unknown) => void
  path: string
}) {
  switch (field.kind) {
    case 'textarea':
      return (
        <TextAreaField
          {...shared}
          value={asString(raw)}
          placeholder={field.placeholder}
          required={field.required}
          onChange={(value) => onSetPath(path, value)}
        />
      )
    case 'password':
      return (
        <PasswordField
          {...shared}
          value={asString(raw)}
          placeholder={field.placeholder}
          required={field.required}
          autoComplete="current-password"
          showPasswordLabel={field.showPasswordLabel}
          hidePasswordLabel={field.hidePasswordLabel}
          onChange={(value) => onSetPath(path, value)}
        />
      )
    case 'email':
      return (
        <TextField
          {...shared}
          type="email"
          value={asString(raw)}
          placeholder={field.placeholder}
          required={field.required}
          autoComplete="email"
          onChange={(value) => onSetPath(path, value)}
        />
      )
    case 'number':
      return (
        <NumberField
          {...shared}
          value={raw === '' || raw == null ? '' : Number(raw)}
          min={field.min}
          max={field.max}
          step={field.step}
          required={field.required}
          onChange={(value) => onSetPath(path, value)}
        />
      )
    case 'slider':
      return (
        <SliderField
          {...shared}
          value={typeof raw === 'number' ? raw : Number(raw) || field.min || 0}
          min={field.min}
          max={field.max}
          step={field.step}
          onChange={(value) => onSetPath(path, value)}
        />
      )
    case 'select':
      return (
        <SelectField
          {...shared}
          value={asString(raw)}
          options={field.options ?? []}
          required={field.required}
          onChange={(value) => onSetPath(path, value)}
        />
      )
    case 'toggle':
      return (
        <ToggleField
          {...shared}
          checked={Boolean(raw)}
          onChange={(checked) => onSetPath(path, checked)}
        />
      )
    case 'tags':
      return (
        <TagsField
          {...shared}
          value={Array.isArray(raw) ? raw.map(String) : []}
          placeholder={field.placeholder}
          onChange={(value) => onSetPath(path, value)}
        />
      )
    case 'file':
      return (
        <FileField
          {...shared}
          value={isFormFileValue(raw) ? raw : null}
          accept={field.accept}
          onChange={(value: FormFileValue | null) => onSetPath(path, value)}
        />
      )
    default:
      return (
        <TextField
          {...shared}
          value={asString(raw)}
          placeholder={field.placeholder}
          required={field.required}
          disabled={locked}
          onChange={(value) => onSetPath(path, value)}
        />
      )
  }
}

function PrimitiveItem({
  kind,
  id,
  value,
  locked,
  error,
  onChange,
}: {
  kind: FormField['kind']
  id: string
  value: unknown
  locked: boolean
  error?: string
  onChange: (value: unknown) => void
}) {
  if (kind === 'textarea') {
    return (
      <TextAreaField
        id={id}
        value={asString(value)}
        disabled={locked}
        error={error}
        onChange={onChange}
      />
    )
  }
  if (kind === 'number') {
    return (
      <NumberField
        id={id}
        value={value === '' || value == null ? '' : Number(value)}
        disabled={locked}
        error={error}
        onChange={onChange}
      />
    )
  }
  return (
    <TextField
      id={id}
      value={asString(value)}
      disabled={locked}
      error={error}
      onChange={(next) => onChange(next)}
    />
  )
}

function joinPath(prefix: string, name: string): string {
  if (!prefix) return name
  if (!name) return prefix
  return `${prefix}.${name}`
}

function asString(value: unknown): string {
  if (value == null) return ''
  return String(value)
}
