import { expect, test } from '@playwright/test'

test('legacy session discovery keeps the matching frame namespace', async ({ page }) => {
  const streams: string[] = []
  let currentReads = 0, legacyReads = 0
  await page.route('**/api/workspace/list_sessions', async route => {
    currentReads++
    expect(route.request().headers()['x-workspace-client']).toBe('workspace')
    await route.fulfill({ status: 404, body: '' })
  })
  await page.route('**/api/workbench/list_sessions', async route => {
    legacyReads++
    expect(route.request().headers()['x-workbench-client']).toBe('workspace')
    await route.fulfill({ json: { sessions: [{ account_id: 'legacy-alpha' }] } })
  })
  await page.routeWebSocket('**/api/workbench/frames/**', stream => { streams.push(stream.url()) })
  await page.goto('/#/components/framebuffer')
  await expect(page.getByRole('tab', { name: 'legacy-alpha' })).toHaveAttribute('aria-selected', 'true')
  await expect.poll(() => streams.some(url => url.endsWith('/api/workbench/frames/legacy-alpha'))).toBe(true)
  expect(currentReads).toBeGreaterThan(0)
  expect(legacyReads).toBe(currentReads)
})

test('an authorization failure cannot select a legacy session', async ({ page }) => {
  let legacyReads = 0
  await page.route('**/api/workspace/list_sessions', async route => { await route.fulfill({ status: 403, body: '' }) })
  await page.route('**/api/workbench/list_sessions', async route => {
    legacyReads++
    await route.fulfill({ json: { sessions: [{ account_id: 'wrong-session' }] } })
  })
  await page.goto('/#/components/framebuffer')
  await expect(page.getByText('Game runtime unavailable', { exact: true })).toBeVisible()
  expect(legacyReads).toBe(0)
  await expect(page.getByRole('tab', { name: 'wrong-session' })).toHaveCount(0)
})
