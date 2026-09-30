import { expect, test } from '@playwright/test'

test('Svelte Mock Lab serves the controlled client and policy fixture page', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/demos.html')
  await expect(page.getByRole('heading', { name: /Promises, clients, and host-owned contracts/ })).toBeVisible()
  await expect(page.getByTestId('client-status')).toHaveText('ready')
  await page.getByRole('button', { name: 'Degraded' }).click()
  await expect(page.getByTestId('client-status')).toHaveText('degraded')
  await page.getByRole('button', { name: 'Send typed request' }).click()
  await expect(page.getByRole('status')).toHaveText('200 · contract accepted')
  await expect(page.getByRole('heading', { name: 'Feed and policy fixtures' })).toBeVisible()
  expect(errors).toEqual([])
})

test('Svelte Ludis panel applies a host operation and reports poll failure', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/discord-bot-panel.html')
  await expect(page.getByRole('heading', { name: 'Nebula Lounge' })).toBeVisible()
  await expect(page.getByText('NOW PLAYING')).toBeVisible()
  await expect(page.getByRole('table', { name: 'Queue for Nebula Lounge' })).toContainText('Slow Corrosion')
  await page.getByRole('combobox', { name: 'Radio station' }).selectOption('nts1')
  await page.getByRole('button', { name: 'Start station' }).click()
  await expect(page.getByText('The last command failed')).toBeVisible()
  await expect(page.getByRole('list', { name: 'Submitted operations' })).toContainText('failed')
  await page.getByRole('button', { name: 'Offline' }).click()
  await expect(page.getByText(/Poll offline/)).toBeVisible()
  expect(errors).toEqual([])
})

test('Svelte Nebula moderation panel filters and follows correlated activity', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/discord-mod-panel.html')
  await expect(page.getByRole('heading', { name: 'system-nebula' })).toBeVisible()
  const feed = page.getByRole('list', { name: 'Guild activity events' })
  await expect(feed).toBeVisible()
  await feed.getByRole('button', { name: /^Follow / }).first().click()
  await expect(page.getByRole('tab', { name: 'Agent trace' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('list', { name: 'Agent conversation' })).toBeVisible()
  await page.getByRole('tab', { name: 'Slash commands' }).click()
  await page.getByRole('combobox', { name: 'Status' }).selectOption('failed')
  await expect(page.getByRole('table', { name: 'Slash command interactions' })).toBeVisible()
  await page.getByRole('tab', { name: 'Correlations' }).click()
  await expect(page.getByText('Not run yet')).toBeVisible()
  await page.getByRole('button', { name: 'Run correlations' }).click()
  await expect(page.getByRole('region', { name: 'Correlation findings' })).not.toContainText('Not run yet')
  expect(errors).toEqual([])
})
