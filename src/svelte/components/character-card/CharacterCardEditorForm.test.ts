import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import { emptyTavernCard } from '../../../core/character-card/parse'
import { cardFromFormValues, toCharacterCardFormValues } from '../../../core/character-card/form'
import CharacterCardEditorForm from './CharacterCardEditorForm.svelte'

describe('Svelte CharacterCardEditorForm', () => {
  it('keeps the V2 card controlled and submits through the host', async () => {
    const card = emptyTavernCard()
    card.data.name = 'Aiko'
    const onValueChange = vi.fn()
    const onSubmit = vi.fn()
    render(CharacterCardEditorForm, { value: card, onValueChange, onSubmit })

    await fireEvent.input(screen.getByRole('textbox', { name: 'Name' }), { target: { value: 'Ren' } })
    expect(onValueChange).toHaveBeenCalledWith(expect.objectContaining({
      spec: 'chara_card_v2', data: expect.objectContaining({ name: 'Ren' }),
    }))

    await fireEvent.submit(screen.getByRole('button', { name: 'Save character' }).closest('form')!)
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce())
  })

  it('preserves extension data through the plain TypeScript form conversion', () => {
    const card = emptyTavernCard()
    card.data.extensions.custom = { enabled: true }
    const form = toCharacterCardFormValues(card)
    expect(cardFromFormValues(form).data.extensions.custom).toEqual({ enabled: true })
  })
})
