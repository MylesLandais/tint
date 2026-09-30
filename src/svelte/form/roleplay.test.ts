import { fireEvent, render, screen, within } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import GroupEditor from './GroupEditor.svelte'
import PersonaEditor from './PersonaEditor.svelte'
import RegexRulesEditor from './RegexRulesEditor.svelte'
import ImportReview from './ImportReview.svelte'
import type { GroupFields, PersonaFields, RegexRuleDocument } from '../../core/form/roleplay'

const group: GroupFields = {
  name: 'Crew', members: ['ada', 'missing', 'ada'], mutedMembers: ['ada'], strategy: 99, promptMode: 0,
  allowSelfReplies: false, delay: 2, prefix: 'Saved prefix', suffix: 'Saved suffix', favorite: false,
}

describe('roleplay Svelte forms', () => {
  it('reorders group members, keeps duplicate mute state, and retains hidden settings', async () => {
    const onValueChange = vi.fn()
    const props = {
      value: group, onValueChange,
      characters: [{ value: 'ada', label: 'Ada' }, { value: 'bea', label: 'Bea' }],
      strategies: [{ value: 0, label: 'Manual' }], promptModes: [{ value: 0, label: 'None' }, { value: 1, label: 'Joined' }],
    }
    const view = render(GroupEditor, props)
    expect(screen.getByText('Unavailable character')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Speaker selection' })).toHaveValue('99')
    expect(screen.queryByRole('textbox', { name: 'Joined prompt prefix' })).not.toBeInTheDocument()

    const moveMissing = screen.getByRole('button', { name: 'Move missing up' })
    moveMissing.focus()
    await fireEvent.click(moveMissing)
    const moved = onValueChange.mock.lastCall![0] as GroupFields
    expect(moved.members).toEqual(['missing', 'ada', 'ada'])
    expect(moved.prefix).toBe('Saved prefix')
    await view.rerender({ ...props, value: moved })
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Move missing up' }))
    await fireEvent.click(screen.getAllByRole('button', { name: 'Remove Ada' })[0]!)
    const removed = onValueChange.mock.lastCall![0] as GroupFields
    expect(removed.members).toEqual(['missing', 'ada'])
    expect(removed.mutedMembers).toContain('ada')
    await view.rerender({ ...props, value: removed })
    await fireEvent.click(screen.getByRole('button', { name: 'Add member' }))
    expect((onValueChange.mock.lastCall![0] as GroupFields).members).toEqual(['missing', 'ada', 'bea'])
    await fireEvent.change(screen.getByRole('combobox', { name: 'Character prompts' }), { target: { value: '1' } })
    expect((onValueChange.mock.lastCall![0] as GroupFields).promptMode).toBe(1)
    await view.rerender({ ...props, value: { ...removed, promptMode: 1 } })
    expect(screen.getByRole('textbox', { name: 'Joined prompt prefix' })).toHaveValue('Saved prefix')
  })

  it('locks group controls and gives separate editors distinct field IDs', async () => {
    const props = {
      value: group, onValueChange: vi.fn(), characters: [{ value: 'ada', label: 'Ada' }],
      strategies: [{ value: 0, label: 'Manual' }], promptModes: [{ value: 0, label: 'None' }],
    }
    render(GroupEditor, { ...props, disabled: true })
    render(GroupEditor, props)
    const editors = screen.getAllByRole('group', { name: 'Group details' })
    const first = within(editors[0]!)
    const second = within(editors[1]!)
    expect(first.getAllByRole('button').every((button) => (button as HTMLButtonElement).disabled)).toBe(true)
    expect(first.getByRole('combobox', { name: 'Speaker selection' })).toHaveValue('99')
    expect(first.getByRole('textbox', { name: 'Group name' }).id).not.toBe(second.getByRole('textbox', { name: 'Group name' }).id)
    await fireEvent.input(second.getByRole('spinbutton', { name: 'Automatic reply delay (seconds)' }), { target: { value: '' } })
    expect(props.onValueChange.mock.lastCall![0].delay).toBe('')
  })

  it('shows saved persona options and preserves depth when placement hides it', async () => {
    const onValueChange = vi.fn()
    const value: PersonaFields = { name: 'Traveler', title: '', description: '', position: 4, depth: 8, role: 8 }
    const view = render(PersonaEditor, { value, onValueChange })
    expect(screen.getByRole('combobox', { name: 'Prompt role' })).toHaveValue('8')
    await fireEvent.change(screen.getByRole('combobox', { name: 'Description placement' }), { target: { value: '0' } })
    expect(onValueChange).toHaveBeenCalledWith({ ...value, position: 0 })
    await view.rerender({ value: { ...value, position: 0 }, onValueChange })
    expect(screen.queryByRole('spinbutton', { name: 'Depth' })).not.toBeInTheDocument()
    await view.rerender({ value: { ...value, position: 4 }, onValueChange })
    expect(screen.getByRole('spinbutton', { name: 'Depth' })).toHaveValue(8)
    await fireEvent.input(screen.getByRole('spinbutton', { name: 'Depth' }), { target: { value: '' } })
    expect(onValueChange).toHaveBeenCalledWith({ ...value, depth: '' })
  })

  it('keeps regex extensions and unknown placements through controlled edits', async () => {
    const onValueChange = vi.fn()
    const value: RegexRuleDocument[] = [{ scriptName: 'Cleanup', findRegex: 'bad', replaceString: '', placement: [1, 99], extra: { source: 'host' } }]
    const props = { value, onValueChange, placements: [{ value: 1, label: 'User input' }, { value: 2, label: 'Assistant output' }] }
    const view = render(RegexRulesEditor, props)
    await fireEvent.input(screen.getByRole('textbox', { name: 'Find expression' }), { target: { value: 'better' } })
    expect(onValueChange.mock.lastCall![0][0]).toEqual({ ...value[0], findRegex: 'better' })
    await fireEvent.click(screen.getByRole('checkbox', { name: 'User input' }))
    expect(onValueChange.mock.lastCall![0][0].placement).toEqual([99])
    await fireEvent.click(screen.getByText('Advanced options'))
    await fireEvent.change(screen.getByRole('spinbutton', { name: 'Minimum depth' }), { target: { value: '' } })
    expect(onValueChange.mock.lastCall![0][0]).toMatchObject({ minDepth: null, extra: { source: 'host' } })
    await view.rerender({ ...props, value: [{ ...value[0], findRegex: 'better' }] })
    expect(screen.getByRole('textbox', { name: 'Find expression' })).toHaveValue('better')
    await fireEvent.click(screen.getByRole('button', { name: 'Add regex rule' }))
    expect(onValueChange.mock.lastCall![0]).toHaveLength(2)
  })

  it('reorders regex rules without changing the original documents and locks them while saving', async () => {
    const onValueChange = vi.fn()
    const first = Object.freeze({ scriptName: 'First', findRegex: 'a', placement: [1, 88], extension: 'keep' })
    const second = { scriptName: 'Second', findRegex: 'b' }
    const props = { value: [first, second] as RegexRuleDocument[], onValueChange, placements: [{ value: 1, label: 'User' }] }
    const view = render(RegexRulesEditor, props)
    await fireEvent.click(screen.getByRole('button', { name: 'Move rule 1 down' }))
    expect(onValueChange.mock.lastCall![0]).toEqual([second, first])
    await view.rerender({ ...props, value: [second, first], disabled: true })
    expect(screen.getByRole('group', { name: 'Rule 2: First' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove rule 2' })).toBeDisabled()
    expect(screen.getAllByRole('textbox', { name: 'Find expression' })[1]).toBeDisabled()
    expect(first).not.toHaveProperty('disabled')
  })

  it('separates preserved files from ready records and disables import while busy or empty', async () => {
    const onImport = vi.fn()
    const rows = [{ id: 'chats', label: 'Chats', files: 2, ready: 1, errors: 1 }]
    const view = render(ImportReview, { rows, onImport, notice: 'One unreadable record is retained.' })
    const table = screen.getByRole('table', { name: 'Import file coverage' })
    expect(within(table).getByRole('row', { name: 'Chats 2 1 1' })).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Import 2 files' }))
    expect(onImport).toHaveBeenCalledTimes(1)
    await view.rerender({ rows, onImport, busy: true })
    expect(screen.getByRole('button', { name: 'Importing…' })).toBeDisabled()
    await view.rerender({ rows: [], onImport, busy: false })
    expect(screen.getByRole('button', { name: 'Import 0 files' })).toBeDisabled()
    await view.rerender({ rows, onImport, busy: false, complete: true })
    expect(screen.getByRole('status')).toHaveTextContent('Import saved.')
  })
})
