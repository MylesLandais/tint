import type { FormField, FormSchema, FormSection } from './schema'
import { getAtPath } from './values'

export type FormIssue = {
  code: string
  message: string
  severity: 'error' | 'warning' | 'info'
  path?: string
}

export type FormValidationResult = {
  ok: boolean
  issues: readonly FormIssue[]
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function defaultValueForField(field: FormField): unknown {
  switch (field.kind) {
    case 'toggle':
      return false
    case 'number':
    case 'slider':
      return field.min ?? 0
    case 'tags':
    case 'repeatable':
      return []
    case 'file':
      return null
    case 'select':
      return field.options?.[0]?.value ?? ''
    default:
      return ''
  }
}

export function defaultItemForField(field: FormField): unknown {
  if (field.defaultItem !== undefined) return cloneDefault(field.defaultItem)
  if (field.itemSchema) return defaultValuesForSections([field.itemSchema])
  if (field.itemKind === 'toggle') return false
  if (field.itemKind === 'number' || field.itemKind === 'slider') return 0
  if (field.itemKind === 'tags') return []
  return ''
}

export function defaultValuesForSchema(schema: FormSchema): Record<string, unknown> {
  return defaultValuesForSections(schema.sections)
}

export function defaultValuesForSections(sections: readonly FormSection[]): Record<string, unknown> {
  let values: Record<string, unknown> = {}
  for (const section of sections) {
    for (const field of section.fields) {
      values = setDeepDefault(values, field.name, defaultValueForField(field))
    }
  }
  return values
}

function setDeepDefault(
  values: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
  const parts = path.split('.')
  const root = { ...values }
  let cursor: Record<string, unknown> = root
  for (let index = 0; index < parts.length - 1; index += 1) {
    const part = parts[index]!
    const existing = cursor[part]
    const next =
      existing != null && typeof existing === 'object' && !Array.isArray(existing)
        ? { ...(existing as Record<string, unknown>) }
        : {}
    cursor[part] = next
    cursor = next
  }
  const leaf = parts[parts.length - 1]!
  if (cursor[leaf] === undefined) cursor[leaf] = value
  return root
}

function cloneDefault(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(cloneDefault)
  if (value != null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, cloneDefault(entry)]),
    )
  }
  return value
}

export function validateForm(schema: FormSchema, values: unknown): FormValidationResult {
  const issues: FormIssue[] = []
  for (const section of schema.sections) {
    validateSection(section, values, issues)
  }
  return { ok: issues.every((issue) => issue.severity !== 'error'), issues }
}

function validateSection(section: FormSection, values: unknown, issues: FormIssue[], prefix = '') {
  for (const field of section.fields) {
    // Field names are relative to `values`. Repeatable item schemas pass the
    // row object, so looking up the *issue* path (`entries.0.keys`) here would
    // miss every nested field — the bug that let required lore keys through.
    const lookup = field.name
    const path = prefix ? (lookup ? `${prefix}.${lookup}` : prefix) : lookup
    const value = lookup === '' ? values : getAtPath(values, lookup)
    validateField(field, value, path, issues)
  }
}

function validateField(field: FormField, value: unknown, path: string, issues: FormIssue[]) {
  if (field.required && isEmpty(value)) {
    issues.push({
      code: 'FORM_REQUIRED',
      message: `${field.label} is required.`,
      severity: 'error',
      path,
    })
    return
  }

  if (field.kind === 'email' && typeof value === 'string' && value && !EMAIL_PATTERN.test(value)) {
    issues.push({
      code: 'FORM_EMAIL',
      message: `${field.label} must be an email address.`,
      severity: 'error',
      path,
    })
  }

  if ((field.kind === 'number' || field.kind === 'slider') && value != null && value !== '') {
    const numeric = typeof value === 'number' ? value : Number(value)
    if (!Number.isFinite(numeric)) {
      issues.push({
        code: 'FORM_NUMBER',
        message: `${field.label} must be a number.`,
        severity: 'error',
        path,
      })
    } else {
      if (field.min != null && numeric < field.min) {
        issues.push({
          code: 'FORM_MIN',
          message: `${field.label} must be at least ${field.min}.`,
          severity: 'error',
          path,
        })
      }
      if (field.max != null && numeric > field.max) {
        issues.push({
          code: 'FORM_MAX',
          message: `${field.label} must be at most ${field.max}.`,
          severity: 'error',
          path,
        })
      }
    }
  }

  if (field.kind === 'repeatable' && Array.isArray(value)) {
    value.forEach((item, index) => {
      const itemPath = `${path}.${index}`
      if (field.itemSchema) {
        validateSection(field.itemSchema, item, issues, itemPath)
      } else if (field.itemKind && field.required && isEmpty(item)) {
        issues.push({
          code: 'FORM_REQUIRED',
          message: `${field.label} item ${index + 1} is required.`,
          severity: 'error',
          path: itemPath,
        })
      }
    })
  }
}

function isEmpty(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  return false
}
