import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

for (const width of [1290, 390]) test(`reasoning uses native disclosure and qualified copy at ${width}px`, async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.setViewportSize({ width, height: 1000 })
  await page.addInitScript(() => {
    const state = { values: [] as string[], finish: undefined as (() => void) | undefined }
    Object.assign(window, { copyFixture: state })
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText(value: string) { state.values.push(value); return new Promise<void>(resolve => { state.finish = resolve }) },
    } })
  })
  await page.goto('/#/components/chat')
  const details = page.locator('[data-chat-part="reasoning"]')
  const summary = details.locator('summary')
  await expect(details).not.toHaveAttribute('open')
  await summary.focus(); await summary.press('Enter'); await expect(details).toHaveAttribute('open', '')
  const copy = details.getByRole('button', { name: 'Copy reasoning', exact: true })
  await copy.focus(); await copy.press('Enter'); await expect(copy).toBeDisabled()
  await expect(details).toHaveAttribute('open', '')
  await expect.poll(() => page.evaluate(() => (window as any).copyFixture.values)).toEqual(['A concise summary of how the sample answer was prepared.'])
  await page.getByRole('button', { name: 'Continue reasoning summary', exact: true }).click()
  await expect(details).toContainText('An additional line arrived')
  await page.evaluate(() => (window as any).copyFixture.finish())
  await expect(copy).toBeEnabled(); await expect(details).not.toContainText('Copied')
  await copy.click(); await page.evaluate(() => (window as any).copyFixture.finish())
  await expect(details.getByRole('button', { name: 'Reasoning copied', exact: true })).toHaveText('Copied')
  if (process.env.TINT_CHAT_SCREENSHOTS) {
    await mkdir(process.env.TINT_CHAT_SCREENSHOTS, { recursive: true })
    await details.screenshot({ path: `${process.env.TINT_CHAT_SCREENSHOTS}/reasoning-${width}.png` })
  }
  expect(await details.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
  await summary.focus(); await summary.press('Space'); await expect(details).not.toHaveAttribute('open')
  await page.getByRole('button', { name: 'Continue reasoning summary', exact: true }).click()
  await expect(details).not.toHaveAttribute('open')
  expect(errors).toEqual([])
})
