import { expect, test } from '@playwright/test'

for (const width of [1920, 390]) test(`spoken replies stay compact at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 })
  await page.goto('/#/components/chat')
  const audio = page.locator('[data-chat-part="audio"]')
  await expect(audio).toHaveAttribute('data-audio-presentation', 'voice')
  const surface = audio.locator('[data-media-surface]')
  await expect(surface).toBeVisible()
  const dimensions = await surface.boundingBox()
  expect(dimensions).not.toBeNull()
  expect(dimensions!.width).toBeLessThanOrEqual(56)
  expect(dimensions!.height).toBeLessThanOrEqual(56)
  if (width === 1920) {
    expect(await audio.evaluate(element => element.clientWidth)).toBeGreaterThan(640)
  }
  expect(await audio.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
  await expect(audio.getByRole('button', { name: 'Play Cached sample clip', exact: true })).toBeEnabled()
  await expect(audio.getByRole('button', { name: /mute/i })).toBeVisible()
})
