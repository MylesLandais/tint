import { fireEvent, render, screen } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import VolumeControl from './VolumeControl.svelte'

describe('Svelte VolumeControl', () => {
  it('uses supplied mute and percentage callbacks', async () => {
    const onToggleMute = vi.fn()
    const onVolumeChange = vi.fn()
    render(VolumeControl, { volume: .75, isMuted: false, onToggleMute, onVolumeChange })
    await fireEvent.click(screen.getByRole('button', { name: 'Mute' }))
    expect(onToggleMute).toHaveBeenCalledOnce()
    await fireEvent.pointerEnter(screen.getByRole('group', { name: 'Volume controls' }))
    const input = screen.getByRole('textbox', { name: 'Volume percentage' })
    await fireEvent.input(input, { target: { value: '34' } })
    await fireEvent.keyDown(input, { key: 'Enter' })
    expect(onVolumeChange).toHaveBeenCalledWith(34)
  })

  it('emits controlled drawer changes without assuming ownership', async () => {
    const onOpenChange = vi.fn()
    render(VolumeControl, { volume: 1, isMuted: false, onToggleMute: vi.fn(), onVolumeChange: vi.fn(), open: false, onOpenChange })
    await fireEvent.pointerEnter(screen.getByRole('group', { name: 'Volume controls' }))
    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(screen.queryByRole('dialog', { name: 'Volume' })).not.toBeInTheDocument()
  })
})
