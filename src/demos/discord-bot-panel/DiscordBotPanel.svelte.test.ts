import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'
import { tick } from 'svelte'
import DiscordBotPanel from './DiscordBotPanel.svelte'
import { createLudisHost } from './adapters'
import { GUILDS } from './fixtures'

function renderPanel() {
  const host = createLudisHost(GUILDS[0]!.id)
  const view = render(DiscordBotPanel, { host, autoAdvance: false })
  return { host, view, async advance() { host.advance(); await tick(); await Promise.resolve(); await tick() } }
}

describe('Svelte Ludis bot panel', () => {
  it('reads the guild model and applies a plugin through the operation seam', async () => {
    const panel = renderPanel()
    await panel.advance()
    expect(screen.getByRole('heading', { name: 'Nebula Lounge' })).toBeInTheDocument()
    expect(screen.getByText('Midnight Cassette')).toBeInTheDocument()
    expect(screen.getByText('Slow Corrosion')).toBeInTheDocument()
    const toggle = screen.getByRole('checkbox', { name: /ping/ })
    expect(toggle).toBeChecked()
    await fireEvent.click(toggle)
    const log = screen.getByRole('list', { name: 'Submitted operations' })
    expect(within(log).getByText('plugin:toggle')).toBeInTheDocument()
    expect(panel.host.getState().plugins[GUILDS[0]!.id]!.find((plugin) => plugin.name === 'ping')?.enabled).toBe(true)
    await panel.advance()
    await panel.advance()
    await waitFor(() => expect(within(log).getByText('succeeded')).toBeInTheDocument())
    expect(panel.host.getState().plugins[GUILDS[0]!.id]!.find((plugin) => plugin.name === 'ping')?.enabled).toBe(false)
    await waitFor(() => expect(screen.getByText('plugin:ping:false')).toBeInTheDocument())
  })

  it('shows failed station and offline poll state', async () => {
    const panel = renderPanel()
    await panel.advance()
    await fireEvent.change(screen.getByRole('combobox', { name: 'Radio station' }), { target: { value: 'nts1' } })
    await fireEvent.click(screen.getByRole('button', { name: 'Start station' }))
    await panel.advance()
    await panel.advance()
    await waitFor(() => expect(screen.getByText('The last command failed')).toBeInTheDocument())
    expect(screen.getAllByText(/NTS 1 did not respond/).length).toBeGreaterThan(0)
    await fireEvent.click(screen.getByRole('button', { name: 'Offline' }))
    expect(screen.getByText(/Poll offline/)).toBeInTheDocument()
  })
})
