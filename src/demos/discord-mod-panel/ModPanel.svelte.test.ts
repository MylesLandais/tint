import { fireEvent, render, screen, within } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'
import { generateTraffic, NEBULA_GUILD_ID, PANEL_GUILDS } from '../discord-panel/fixtures'
import ModPanel from './ModPanel.svelte'

const nebula = PANEL_GUILDS.find((guild) => guild.id === NEBULA_GUILD_ID)!
function renderPanel() {
  const traffic = generateTraffic(nebula, 0x5eed, 40)
  return { traffic, ...render(ModPanel, { traffic }) }
}

describe('Svelte Nebula moderation panel', () => {
  it('pins the guild and follows an activity event into its agent trace', async () => {
    renderPanel()
    expect(screen.getByRole('heading', { name: 'system-nebula' })).toBeInTheDocument()
    const rail = screen.getByRole('navigation', { name: 'Guild navigation' })
    for (const guild of PANEL_GUILDS.filter((item) => item.id !== NEBULA_GUILD_ID)) {
      expect(within(rail).getByRole('link', { name: new RegExp(guild.name) })).toHaveAttribute('aria-disabled', 'true')
    }
    const feed = screen.getByRole('list', { name: 'Guild activity events' })
    const follow = within(feed).getAllByRole('button', { name: /^Follow / })[0]!
    const id = follow.textContent!.replace('Follow ', '')
    await fireEvent.click(follow)
    expect(screen.getByRole('tab', { name: 'Agent trace' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText(`Following ${id}`)).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Agent conversation' })).toBeInTheDocument()
  })

  it('filters failures and runs correlations', async () => {
    const { traffic } = renderPanel()
    await fireEvent.click(screen.getByRole('tab', { name: 'Slash commands' }))
    await fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), { target: { value: 'failed' } })
    const count = traffic.interactions.filter((item) => item.status === 'failed').length
    expect(screen.getByText(`${count} shown`)).toBeInTheDocument()
    await fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), { target: { value: 'all' } })
    await fireEvent.click(screen.getByRole('tab', { name: 'Correlations' }))
    expect(screen.getByText('Not run yet')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Run correlations' }))
    expect(screen.getByRole('region', { name: 'Correlation findings' })).toHaveTextContent('/ask ↔ failure')
  })
})
