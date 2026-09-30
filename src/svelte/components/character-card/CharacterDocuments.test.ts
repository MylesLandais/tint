import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import type { CharacterDocument } from '../../../core/character-card/document'
import CharacterDocumentEditor from './CharacterDocumentEditor.svelte'
import CharacterLibrary from './CharacterLibrary.svelte'

describe('Svelte original character documents', () => {
  it('edits original V3 fields and submits the preserved document', async () => {
    const original: CharacterDocument = {
      spec: 'chara_card_v3', spec_version: '3.0', future_envelope: ['retain'],
      data: { name: 'Aster', extensions: { plugin: { nested: true } }, future_data: { keep: true } },
    }
    const onValueChange = vi.fn()
    const onSubmit = vi.fn()
    const view = render(CharacterDocumentEditor, { value: original, onValueChange, onSubmit })

    await fireEvent.input(screen.getByRole('textbox', { name: 'Name' }), { target: { value: 'Nova' } })
    const named = onValueChange.mock.lastCall?.[0] as CharacterDocument
    expect(named).toEqual({ ...original, data: { ...original.data, name: 'Nova' } })
    await view.rerender({ value: named, onValueChange, onSubmit })
    await fireEvent.click(screen.getByRole('button', { name: 'Personality' }))
    await fireEvent.input(screen.getByRole('textbox', { name: 'Personality summary' }), { target: { value: 'Curious' } })
    const described = onValueChange.mock.lastCall?.[0] as CharacterDocument
    await view.rerender({ value: described, onValueChange, onSubmit })
    await fireEvent.submit(screen.getByRole('button', { name: 'Save character' }).closest('form')!)

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({
      ...original, data: { ...original.data, name: 'Nova', personality: 'Curious' },
    }))
  })

  it('reports a failed save while keeping the controlled draft', async () => {
    const draft: CharacterDocument = { spec: 'chara_card_v2', name: 'My draft', custom: 4 }
    const onSubmit = vi.fn().mockRejectedValue(new Error('Reload the newer saved character'))
    render(CharacterDocumentEditor, { value: draft, onValueChange: vi.fn(), onSubmit })

    await fireEvent.submit(screen.getByRole('button', { name: 'Save character' }).closest('form')!)
    expect(await screen.findByText('Reload the newer saved character')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('My draft')
    expect(onSubmit).toHaveBeenCalledWith(draft)
  })

  it('filters library entries by tag and routes actions by stable IDs', async () => {
    const onSelect = vi.fn()
    const onStartChat = vi.fn()
    render(CharacterLibrary, {
      items: [
        { id: 'first', name: 'Aster', tags: ['archive'] },
        { id: 'second', name: 'Aster', tags: ['sea'] },
      ],
      query: 'SEA', onQueryChange: vi.fn(), onSelect, onStartChat, onCreate: vi.fn(),
    })
    expect(screen.getByRole('status')).toHaveTextContent('1 character')
    await fireEvent.click(screen.getByRole('button', { name: 'Edit Aster' }))
    await fireEvent.click(screen.getByRole('button', { name: 'Chat with Aster' }))
    expect(onSelect).toHaveBeenCalledWith('second')
    expect(onStartChat).toHaveBeenCalledWith('second')
  })

  it('names the selected character without relying on the border color', () => {
    render(CharacterLibrary, {
      items: [{ id: 'first', name: 'Aster', tags: [] }],
      query: '', onQueryChange: vi.fn(), onSelect: vi.fn(), onStartChat: vi.fn(), onCreate: vi.fn(),
      selectedId: 'first',
    })
    expect(screen.getByRole('listitem', { current: true })).toHaveTextContent('Selected')
  })
})
