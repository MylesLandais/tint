import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'
import Fixture from './SettingsPopoutFixture.svelte'

describe('Svelte SettingsPopout', () => {
  it('uses the shared Popover and searches grouped settings', async () => {
    render(Fixture)
    const trigger = screen.getByRole('button', { name: 'Settings' })
    await fireEvent.click(trigger)
    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument()
    const search = screen.getByRole('combobox', { name: 'Search Settings' })
    await fireEvent.input(search, { target: { value: 'twice' } })
    expect(screen.getByRole('option', { name: '2x' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: '1x' })).not.toBeInTheDocument()
    await fireEvent.keyDown(search, { key: 'Enter' })
    expect(screen.getByText('speed-2')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Settings' })).not.toBeInTheDocument())
    expect(trigger).toHaveFocus()
  })
})
