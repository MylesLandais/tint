import { act, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DiscordBotPanel } from './DiscordBotPanel'
import { createLudisHost } from './adapters'
import { GUILDS } from './fixtures'

/**
 * The host is injected and `autoAdvance` is off, so every test drives the
 * simulation by hand. Nothing here waits on a timer.
 */
function renderPanel() {
  const host = createLudisHost(GUILDS[0]!.id)
  const view = render(<DiscordBotPanel host={host} autoAdvance={false} />)
  // One tick to let the client start and the first read model land.
  return { host, view, async settle() { await act(async () => { host.advance(); await Promise.resolve() }) } }
}

describe('Ludis bot panel', () => {
  it('renders the guild read model from the request adapter', async () => {
    const panel = renderPanel()
    await panel.settle()

    expect(screen.getByRole('heading', { name: 'Nebula Lounge' })).toBeInTheDocument()
    expect(screen.getByText('Midnight Cassette')).toBeInTheDocument()
    expect(screen.getByText('NOW PLAYING')).toBeInTheDocument()
    // The queue read model reached the table.
    expect(screen.getByText('Slow Corrosion')).toBeInTheDocument()
  })

  it('carries a plugin toggle through the operation seam and records it', async () => {
    const panel = renderPanel()
    await panel.settle()

    const toggle = screen.getByLabelText('ping')
    expect(toggle).toBeChecked()
    await act(async () => { toggle.click() })

    // Submitted but not yet applied: the job is in flight and the fixture
    // state has not moved.
    const log = screen.getByLabelText('Submitted operations')
    expect(within(log).getByText('plugin:toggle')).toBeInTheDocument()
    expect(panel.host.getState().plugins[GUILDS[0]!.id]!.find((p) => p.name === 'ping')!.enabled).toBe(true)

    // Two ticks is the fixture job duration.
    await panel.settle()
    await panel.settle()
    await act(async () => { await Promise.resolve() })

    expect(panel.host.getState().plugins[GUILDS[0]!.id]!.find((p) => p.name === 'ping')!.enabled).toBe(false)
    expect(within(log).getByText('succeeded')).toBeInTheDocument()
    // ludis's audit vocabulary, re-read through the request adapter.
    expect(await screen.findByText('plugin:ping:false')).toBeInTheDocument()
  })

  it('surfaces a failing command as a rendered error rather than a rejection', async () => {
    const panel = renderPanel()
    await panel.settle()

    // NTS 1 is the fixture that always fails.
    const station = screen.getByLabelText('Radio station')
    await act(async () => {
      ;(station as HTMLSelectElement).value = 'nts1'
      station.dispatchEvent(new Event('change', { bubbles: true }))
    })
    await act(async () => { screen.getByRole('button', { name: 'Start station' }).click() })
    await panel.settle()
    await panel.settle()
    await act(async () => { await Promise.resolve() })

    const log = screen.getByLabelText('Submitted operations')
    expect(within(log).getByText('failed')).toBeInTheDocument()
    // The banner, the operation log, and the toast all say so.
    expect(screen.getAllByText(/NTS 1 did not respond/).length).toBeGreaterThan(0)
    expect(screen.getByText('The last command failed')).toBeInTheDocument()
  })

  it('reports the poll going offline through the realtime capability', async () => {
    const panel = renderPanel()
    await panel.settle()

    await act(async () => { screen.getByRole('button', { name: 'Offline' }).click() })

    expect(screen.getByText(/Poll offline/)).toBeInTheDocument()
  })
})
