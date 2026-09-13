import { useState } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CharacterDocumentEditor, type CharacterDocument } from './CharacterDocumentEditor'
import { CharacterLibrary } from './CharacterLibrary'

describe('original character documents', () => {
  it('edits V3 paths while retaining unknown envelope, data, extension and lore fields', async () => {
    const original: CharacterDocument = { spec: 'chara_card_v3', spec_version: '3.0', future_envelope: ['retain'],
      data: { name: 'Aster', first_mes: 'Hello', mes_example: ['nonstandard', 'preserved'], assets: [{ uri: 'embedded://portrait', type: 'icon' }],
        future_data: { keep: true }, extensions: { depth_prompt: { prompt: 'Before', future: 7 }, plugin: { nested: true } },
        character_book: { entries: [{ keys: ['archive'], content: 'Book', future_entry: 42 }], future_book: 'keep' } } }
    const submitted = vi.fn()
    function Editor() {
      const [value, setValue] = useState(original)
      return <CharacterDocumentEditor value={value} onValueChange={setValue} onSubmit={submitted} />
    }
    render(<Editor />)
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Nova' } })
    fireEvent.click(screen.getByRole('button', { name: 'Personality' }))
    fireEvent.change(screen.getByLabelText('Personality summary'), { target: { value: 'Curious' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Save character' }).closest('form')!)
    await waitFor(() => expect(submitted).toHaveBeenCalledOnce())
    expect(submitted.mock.calls[0]![0]).toEqual({ ...original, data: { ...original.data, name: 'Nova', personality: 'Curious' } })
    expect(original.data!.name).toBe('Aster')
  })

  it('keeps flattened documents flattened and surfaces failed saves without dropping edits', async () => {
    const submitted = vi.fn().mockRejectedValue(new Error('Reload the newer saved character'))
    function Editor() {
      const [value, setValue] = useState<CharacterDocument>({ spec: 'chara_card_v2', spec_version: '2.0', name: 'Aster', custom: 4 })
      return <CharacterDocumentEditor value={value} onValueChange={setValue} onSubmit={submitted} />
    }
    render(<Editor />)
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'My draft' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Save character' }).closest('form')!)
    await screen.findByText('Reload the newer saved character')
    expect(screen.getByLabelText('Name')).toHaveValue('My draft')
    expect(submitted.mock.calls[0]![0]).toEqual({ spec: 'chara_card_v2', spec_version: '2.0', name: 'My draft', custom: 4 })
  })
})

it('filters the controlled library by tags and routes actions using stable IDs', () => {
  const select = vi.fn(), chat = vi.fn()
  render(<CharacterLibrary items={[{ id: 'first', name: 'Aster', tags: ['archive'] }, { id: 'second', name: 'Aster', tags: ['sea'] }]}
    query="SEA" onQueryChange={vi.fn()} onCreate={vi.fn()} onSelect={select} onStartChat={chat} />)
  expect(screen.getByRole('status')).toHaveTextContent('1 character')
  fireEvent.click(screen.getByRole('button', { name: 'Edit Aster' }))
  fireEvent.click(screen.getByRole('button', { name: 'Chat with Aster' }))
  expect(select).toHaveBeenCalledWith('second')
  expect(chat).toHaveBeenCalledWith('second')
})
