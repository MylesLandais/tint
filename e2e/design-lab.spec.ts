import { expect, test } from '@playwright/test'

test('Svelte Design Lab exercises theme, controlled fields, and container width', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/design-lab.html')

  await expect(page.getByRole('heading', { name: 'Design Lab' })).toBeVisible()
  await page.getByLabel('Theme').selectOption('gruvbox')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'gruvbox')
  await page.getByLabel('Color scheme').selectOption('dark')
  await expect(page.locator('html')).toHaveAttribute('data-scheme', 'dark')

  await page.getByLabel('Preview width').fill('420')
  await expect(page.locator('.preview')).toHaveCSS('max-width', '420px')
  const columns = await page.locator('.preview-grid').evaluate((element) => getComputedStyle(element).gridTemplateColumns)
  expect(columns.trim().split(/\s+/)).toHaveLength(1)

  await page.getByRole('button', { name: 'Primary action' }).click()
  await expect(page.getByText('Actions: 1')).toBeVisible()

  await page.getByLabel('Collection name').fill('New collection')
  await expect(page.getByLabel('Invalid state')).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByLabel('Disabled state')).toBeDisabled()
  await page.getByLabel('Invalid state').fill('Corrected value')
  await expect(page.getByLabel('Invalid state')).not.toHaveAttribute('aria-invalid', 'true')

  const genre = page.getByRole('combobox', { name: 'Primary genre' })
  await genre.focus()
  await genre.press('ArrowDown')
  await genre.press('Enter')
  await expect(genre).toHaveValue('Electronic')

  await page.getByRole('button', { name: 'Save collection' }).click()
  await expect(page.getByText('Saved New collection')).toBeVisible()

  await page.getByRole('button', { name: 'Inspector' }).click()
  await expect(page.getByRole('button', { name: 'Inspector' })).toHaveAttribute('aria-expanded', 'false')
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByText('Retries: 1')).toBeVisible()
  await page.getByRole('button', { name: 'Actions', exact: true }).click()
  await expect(page.getByRole('menu', { name: 'Actions' })).toBeVisible()
  await page.getByRole('menuitem', { name: 'Share' }).click()
  await expect(page.getByText('Menu selection: Share')).toBeVisible()
  await page.getByRole('tab', { name: 'History' }).click()
  await expect(page.getByRole('tabpanel', { name: 'History' })).toHaveText('Recent changes')
  await page.getByRole('button', { name: 'Open dialog' }).click()
  await expect(page.getByRole('dialog', { name: 'Create view' })).toBeVisible()
  await page.getByRole('button', { name: 'Close' }).click()
  await expect(page.getByRole('dialog', { name: 'Create view' })).not.toBeVisible()
  expect(errors).toEqual([])
})

test('Svelte Design Lab honors reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/design-lab.html')
  await expect(page.locator('[data-scrolling-label]')).toHaveAttribute('data-overflowing', '')
  await expect(page.locator('[data-scrolling-label-content]')).toHaveCSS('animation-name', 'none')
})
