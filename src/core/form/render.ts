/** Pure helpers shared by schema renderers without depending on a UI runtime. */
export function joinFormPath(prefix: string, name: string): string {
  if (!prefix) return name
  if (!name) return prefix
  return `${prefix}.${name}`
}

export function formFieldId(prefix: string, path: string, label: string): string {
  return `${prefix}-${path || label}`.replace(/[^A-Za-z0-9_-]/g, '-')
}

export function formDescribedBy(id: string, description?: string, error?: string, extra?: string): string | undefined {
  return [description && `${id}-description`, error && `${id}-error`, extra]
    .filter(Boolean)
    .join(' ') || undefined
}

export function firstFormErrorsByPath(
  issues: readonly { path?: string; severity: string; message: string }[],
): Map<string, string> {
  const errors = new Map<string, string>()
  for (const issue of issues) {
    if (issue.path && issue.severity === 'error' && !errors.has(issue.path)) {
      errors.set(issue.path, issue.message)
    }
  }
  return errors
}

export function formString(value: unknown): string {
  return value == null ? '' : String(value)
}

export function formNumber(value: unknown): number | '' {
  if (value == null || value === '') return ''
  return Number(value)
}

export function formSliderValue(value: unknown, min = 0): number {
  return typeof value === 'number' ? value : Number(value) || min
}

export function formatSliderValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}
