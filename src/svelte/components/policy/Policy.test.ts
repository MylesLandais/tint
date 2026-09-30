import { fireEvent, render, screen } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import type { FeedEntry } from '../../../core/feed'
import type { PolicyRule } from '../../../core/policy'
import PolicyDryRun from './PolicyDryRun.svelte'
import PolicyEditor from './PolicyEditor.svelte'
import PolicyTable from './PolicyTable.svelte'

const clause = { id: 'c-1', field: 'title' as const, operator: 'contains' as const, value: 'Alpha' }
const rule: PolicyRule = {
  id: 'rule', sourceId: 'source', name: 'Alpha policy', enabled: true,
  criteria: { mode: 'builder', clauses: [clause] },
  disposition: 'notify_only', workflowEdge: 'notify', matchCount: 2,
}
const entries: FeedEntry[] = [
  { id: 'a', sourceId: 'source', title: 'Alpha entry', url: '#a', publishedAt: '2026-08-01T00:00:00Z', excerpt: '', tags: [], readState: 'unread', contentKind: 'article' },
  { id: 'b', sourceId: 'source', title: 'Beta entry', url: '#b', publishedAt: '2026-08-02T00:00:00Z', excerpt: '', tags: [], readState: 'unread', contentKind: 'article' },
]

describe('Svelte policy surfaces', () => {
  it('emits controlled rule edits, including immutable builder clauses and Lua text', async () => {
    const onChange = vi.fn()
    const sources = [{ id: 'source', label: 'Primary source' }]
    const view = render(PolicyEditor, { props: { rule, onChange, sources } })
    const name = screen.getByRole('textbox', { name: 'Name' }) as HTMLInputElement
    await fireEvent.input(name, { target: { value: 'Renamed' } })
    expect(onChange).toHaveBeenLastCalledWith({ ...rule, name: 'Renamed' })
    expect(name.value).toBe(rule.name)

    await fireEvent.click(screen.getByRole('button', { name: 'Add clause' }))
    const added = onChange.mock.lastCall?.[0] as PolicyRule
    expect(added.criteria.mode).toBe('builder')
    if (added.criteria.mode !== 'builder') throw new Error('builder expected')
    expect(added.criteria.clauses).toHaveLength(2)
    expect(rule.criteria).toEqual({ mode: 'builder', clauses: [clause] })
    await view.rerender({ rule: added, onChange, sources })
    const field = screen.getByRole('combobox', { name: 'Clause 2 field' }) as HTMLSelectElement
    await fireEvent.change(field, { target: { value: 'tags' } })
    const changed = onChange.mock.lastCall?.[0] as PolicyRule
    expect(changed.criteria.mode === 'builder' && changed.criteria.clauses[1]?.field).toBe('tags')
    expect(field.value).toBe('title')

    await fireEvent.click(screen.getByRole('button', { name: 'Lua' }))
    const lua = onChange.mock.lastCall?.[0] as PolicyRule
    expect(lua.criteria).toEqual({ mode: 'lua', source: '-- Demo only: not executed in the browser\nreturn true' })
    expect(screen.getByRole('button', { name: 'Builder' })).toHaveAttribute('aria-pressed', 'true')
    await view.rerender({ rule: lua, onChange, sources })
    const source = screen.getByRole('textbox', { name: 'Lua source' }) as HTMLTextAreaElement
    await fireEvent.input(source, { target: { value: 'error("boom")' } })
    expect(onChange.mock.lastCall?.[0].criteria).toEqual({ mode: 'lua', source: 'error("boom")' })
    expect(source.value).toBe(lua.criteria.mode === 'lua' ? lua.criteria.source : '')
  })

  it('shows a fixture dry run and evaluates Lua only through the mock projection', async () => {
    const view = render(PolicyDryRun, { rule, entries })
    expect(screen.getByText(/would match/)).toHaveTextContent('1 of 2 fixture entries')
    expect(screen.getByText('matched')).toBeInTheDocument()
    await fireEvent.change(screen.getByRole('combobox', { name: 'Fixture entry' }), { target: { value: 'b' } })
    expect(screen.getByText('matched')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Run dry-run' }))
    expect(screen.getByText('no match')).toBeInTheDocument()
    view.unmount()
    render(PolicyDryRun, { rule: { ...rule, criteria: { mode: 'lua', source: 'error("boom")' } }, entries })
    expect(screen.getByText(/Sandbox error \(fixture\)/)).toBeInTheDocument()
  })

  it('renders the table with host selection and toggle commands', async () => {
    const onSelect = vi.fn()
    const onToggle = vi.fn()
    const view = render(PolicyTable, { props: { rules: [rule], selectedId: null, onSelect, onToggle, sourceLabels: { source: 'Primary source' } } })
    expect(screen.getByRole('table', { name: 'Policy rules' })).toBeInTheDocument()
    expect(screen.getByText('Primary source')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Alpha policy' }))
    expect(onSelect).toHaveBeenCalledWith('rule')
    const toggle = screen.getByRole('checkbox', { name: 'Enable Alpha policy' }) as HTMLInputElement
    await fireEvent.click(toggle)
    expect(onToggle).toHaveBeenCalledWith('rule', false)
    expect(toggle.checked).toBe(true)
    await fireEvent.click(screen.getByRole('checkbox', { name: 'Select Alpha policy' }))
    expect(onSelect).toHaveBeenCalledTimes(2)
    expect(view.container.querySelector('[data-tint-policy-table]')).not.toHaveAttribute('data-selected')
    await view.rerender({ rules: [rule], selectedId: 'rule', onSelect, onToggle, sourceLabels: { source: 'Primary source' } })
    expect(view.container.querySelector('[data-tint-policy-table]')).toHaveAttribute('data-selected', 'rule')
  })

  it('disables editor controls from the host flag', () => {
    render(PolicyEditor, { props: { rule, onChange: vi.fn(), sources: [], disabled: true } })
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Add clause' })).toBeDisabled()
    expect(screen.getByRole('checkbox', { name: 'Enabled' })).toBeDisabled()
  })

  it('does not expose inert rule actions when the host supplies no callbacks', () => {
    render(PolicyTable, { rules: [rule] })
    expect(screen.getByRole('button', { name: 'Alpha policy' })).toBeDisabled()
    expect(screen.getByRole('checkbox', { name: 'Enable Alpha policy' })).toBeDisabled()
  })
})
