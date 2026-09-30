/** Host-owned roleplay form values. Editors emit full replacements and never persist them. */
export type GroupFields = {
  name: string
  members: string[]
  mutedMembers: string[]
  strategy: number
  promptMode: number
  allowSelfReplies: boolean
  delay: number | string
  prefix: string
  suffix: string
  favorite: boolean
}

export type GroupCharacterOption = { value: string; label: string }
export type NumberOption = { value: number; label: string }
export type GroupEditorProps = {
  value: GroupFields
  onValueChange: (value: GroupFields) => void
  characters: readonly GroupCharacterOption[]
  strategies: readonly NumberOption[]
  promptModes: readonly NumberOption[]
  disabled?: boolean
}

export type GroupMemberRow = { key: string; member: string; label: string; available: boolean; index: number }
export function groupMemberRows(members: readonly string[], characters: readonly GroupCharacterOption[]): GroupMemberRow[] {
  const counts = new Map<string, number>()
  return members.map((member, index) => {
    const occurrence = counts.get(member) ?? 0
    counts.set(member, occurrence + 1)
    const character = characters.find((item) => item.value === member)
    return { key: `${member}:${occurrence}`, member, label: character?.label ?? member, available: Boolean(character), index }
  })
}

export function availableGroupCharacters(members: readonly string[], characters: readonly GroupCharacterOption[]): GroupCharacterOption[] {
  return characters.filter((character) => !members.includes(character.value))
}

export function groupCandidate(candidate: string, available: readonly GroupCharacterOption[]): string {
  return available.some((character) => character.value === candidate) ? candidate : available[0]?.value ?? ''
}

export function groupNumberOptions(items: readonly NumberOption[], saved: number): { value: string; label: string }[] {
  return [...items.map((item) => ({ value: String(item.value), label: item.label })),
    ...(items.some((item) => item.value === saved) ? [] : [{ value: String(saved), label: `Saved option ${saved}` }])]
}

export function moveGroupMember(value: GroupFields, index: number, direction: -1 | 1): GroupFields {
  const nextIndex = index + direction
  if (index < 0 || nextIndex < 0 || nextIndex >= value.members.length) return value
  const members = [...value.members]
  ;[members[index], members[nextIndex]] = [members[nextIndex]!, members[index]!]
  return { ...value, members }
}

export function removeGroupMember(value: GroupFields, index: number): GroupFields {
  if (index < 0 || index >= value.members.length) return value
  const member = value.members[index]
  const members = value.members.filter((_, slot) => slot !== index)
  return { ...value, members,
    mutedMembers: members.includes(member!) ? value.mutedMembers : value.mutedMembers.filter((id) => id !== member) }
}

export function muteGroupMember(value: GroupFields, member: string, muted: boolean): GroupFields {
  return { ...value, mutedMembers: muted
    ? value.mutedMembers.includes(member) ? value.mutedMembers : [...value.mutedMembers, member]
    : value.mutedMembers.filter((id) => id !== member) }
}

export type PersonaFields = {
  name: string
  title: string
  description: string
  position: number
  depth: number | string
  role: number
}
export type PersonaEditorProps = { value: PersonaFields; onValueChange: (value: PersonaFields) => void; disabled?: boolean }

export function personaPositionOptions(saved: number): { value: string; label: string }[] {
  const items = [
    { value: 0, label: 'System prompt' }, { value: 2, label: 'Before the author note' },
    { value: 3, label: 'After the author note' }, { value: 4, label: 'At chat depth' },
    { value: 9, label: 'Do not insert' },
  ]
  return [...items.map((item) => ({ value: String(item.value), label: item.label })),
    ...(items.some((item) => item.value === saved) ? [] : [{ value: String(saved), label: `Saved position ${saved}` }])]
}

export function personaRoleOptions(saved: number): { value: string; label: string }[] {
  const items = [{ value: 0, label: 'System' }, { value: 1, label: 'User' }, { value: 2, label: 'Assistant' }]
  return [...items.map((item) => ({ value: String(item.value), label: item.label })),
    ...(items.some((item) => item.value === saved) ? [] : [{ value: String(saved), label: `Saved role ${saved}` }])]
}

/** Source rule document, including fields understood only by the host. */
export type RegexRuleDocument = Record<string, unknown>
export type RegexRulesEditorProps = {
  value: readonly RegexRuleDocument[]
  onValueChange: (value: RegexRuleDocument[]) => void
  placements: readonly NumberOption[]
  disabled?: boolean
}
export function isRegexRuleDocument(value: unknown): value is RegexRuleDocument {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}
export function regexText(rule: RegexRuleDocument, key: string): string { return typeof rule[key] === 'string' ? rule[key] : '' }
export function regexTrimText(rule: RegexRuleDocument): string {
  return Array.isArray(rule.trimStrings) ? rule.trimStrings.filter((item): item is string => typeof item === 'string').join('\n') : ''
}
export function patchRegexRule(value: readonly RegexRuleDocument[], index: number, patch: RegexRuleDocument): RegexRuleDocument[] {
  return value.map((rule, slot) => slot === index ? { ...rule, ...patch } : rule)
}
export function moveRegexRule(value: readonly RegexRuleDocument[], index: number, direction: -1 | 1): RegexRuleDocument[] {
  const nextIndex = index + direction
  if (index < 0 || nextIndex < 0 || nextIndex >= value.length) return [...value]
  const next = [...value]
  ;[next[index], next[nextIndex]] = [next[nextIndex]!, next[index]!]
  return next
}
export function toggleRegexPlacement(rule: RegexRuleDocument, placement: number, checked: boolean): unknown[] {
  const next = Array.isArray(rule.placement) ? rule.placement.filter((item) => item !== placement) : []
  return checked ? [...next, placement] : next
}
export const NEW_REGEX_RULE: RegexRuleDocument = {
  scriptName: 'New rule', findRegex: '', replaceString: '', placement: [1, 2], disabled: false,
}

export type ImportReviewRow = { id: string; label: string; files: number; ready: number; errors: number }
export function importFileCount(rows: readonly ImportReviewRow[]): number {
  return rows.reduce((sum, row) => sum + row.files, 0)
}
