import { act, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ModPanel, filterActivity } from './ModPanel'
import { generateTraffic, NEBULA_GUILD_ID, PANEL_GUILDS } from '../discord-panel'

const nebula = PANEL_GUILDS.find((guild) => guild.id === NEBULA_GUILD_ID)!

/** Fixed seed and count, so the assertions below do not move with the fixture volume. */
function renderPanel() {
  return { traffic: generateTraffic(nebula, 0x5eed, 40), ...render(<ModPanel traffic={generateTraffic(nebula, 0x5eed, 40)} />) }
}

function openTab(name: string) {
  act(() => {
    screen.getByRole('tab', { name }).click()
  })
}

describe('system-nebula mod panel', () => {
  it('opens on the guild activity view for system-nebula', () => {
    renderPanel()
    expect(screen.getByRole('heading', { name: 'system-nebula' })).toBeInTheDocument()
    expect(screen.getByLabelText('Guild activity events')).toBeInTheDocument()
  })

  it('pins the rail to system-nebula rather than offering a switch that does nothing', () => {
    renderPanel()
    const others = PANEL_GUILDS.filter((guild) => guild.id !== NEBULA_GUILD_ID)
    for (const guild of others) {
      expect(screen.getByRole('link', { name: new RegExp(guild.name) })).toHaveAttribute('aria-disabled', 'true')
    }
  })

  it('lists the slash commands the guild triggered', () => {
    renderPanel()
    openTab('Slash commands')
    const feed = screen.getByLabelText('Slash command interactions')
    expect(within(feed).getAllByText(/^\/(play|ask|summarize|mod|ping)/).length).toBeGreaterThan(0)
  })

  it('filters the feed down to failures', () => {
    const { traffic } = renderPanel()
    openTab('Slash commands')
    const status = screen.getByLabelText('Status')
    act(() => {
      ;(status as HTMLSelectElement).value = 'failed'
      status.dispatchEvent(new Event('change', { bubbles: true }))
    })
    const failures = traffic.interactions.filter((item) => item.status === 'failed').length
    expect(failures).toBeGreaterThan(0)
    expect(screen.getByText(`${failures} shown`)).toBeInTheDocument()
  })

  it('reports which command travels with failure once correlations are run', () => {
    renderPanel()
    openTab('Correlations')
    expect(screen.getByText('Not run yet')).toBeInTheDocument()
    act(() => {
      screen.getByRole('button', { name: 'Run correlations' }).click()
    })
    const findings = screen.getByLabelText('Correlation findings')
    // `/ask` is the fixture's disproportionate failure and must be reported.
    expect(within(findings).getByText('/ask ↔ failure')).toBeInTheDocument()
  })

  it('follows a moderation event through to the agent conversation', () => {
    renderPanel()
    const feed = screen.getByLabelText('Guild activity events')
    const follow = within(feed).getAllByRole('button', { name: /^Follow / })[0]!
    const correlationId = follow.textContent!.replace('Follow ', '')
    act(() => {
      follow.click()
    })

    // Following switches to the trace tab and pins the id in the status bar.
    expect(screen.getByRole('tab', { name: 'Agent trace' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText(`Following ${correlationId}`)).toBeInTheDocument()
    expect(screen.getByLabelText('Agent conversation')).toBeInTheDocument()
  })
})

describe('filterActivity', () => {
  it('narrows by channel, kind and automation independently', () => {
    const traffic = generateTraffic(nebula, 3, 20)
    const events = traffic.moderation

    expect(filterActivity(events, { channel: 'all', kind: 'all', automatedOnly: true }).every((e) => e.automated)).toBe(true)
    expect(
      filterActivity(events, { channel: 'incidents', kind: 'all', automatedOnly: false }).every((e) => e.channel === 'incidents'),
    ).toBe(true)
    expect(filterActivity(events, { channel: 'all', kind: 'all', automatedOnly: false })).toHaveLength(events.length)
  })
})
