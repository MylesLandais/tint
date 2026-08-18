import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CharacterCardEditorForm } from './CharacterCardEditorForm'
import { emptyTavernCard } from './parse'

describe('CharacterCardEditorForm', () => {
  it('is controlled and submits the V2 card through the host callback', async () => {
    const onValueChange = vi.fn()
    const onSubmit = vi.fn()
    const card = emptyTavernCard()
    card.data.name = 'Aiko'

    render(
      <CharacterCardEditorForm value={card} onValueChange={onValueChange} onSubmit={onSubmit} />,
    )

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Ren' } })
    expect(onValueChange).toHaveBeenCalledWith(
      expect.objectContaining({
        spec: 'chara_card_v2',
        data: expect.objectContaining({ name: 'Ren' }),
      }),
    )

    fireEvent.submit(screen.getByRole('button', { name: 'Save character' }).closest('form')!)
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce())
  })
})
