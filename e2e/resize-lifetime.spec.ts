import { expect, test } from '@playwright/test'

test('controlled shell resizing reports capture lifetime and keeps keyboard intent separate', async ({ page }) => {
  await page.goto('/#/components/shell')
  const handle = page.getByRole('separator', { name: 'Resize inspector' })
  await expect(handle).toHaveAttribute('aria-valuenow', '230')
  const box = (await handle.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await expect(page.locator('[data-resize-demo-state]')).toHaveText('Split interaction: dragging')
  await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2)
  await expect(handle).toHaveAttribute('aria-valuenow', '270')
  await expect(page.locator('[data-resize-demo-state]')).toHaveText('Split interaction: dragging')
  await page.mouse.up()
  await expect(page.locator('[data-resize-demo-state]')).toHaveText('Split interaction: idle')
  await handle.press('Shift+ArrowRight')
  await expect(handle).toHaveAttribute('aria-valuenow', '320')
  await expect(page.locator('[data-resize-demo-state]')).toHaveText('Split interaction: idle')
})
