import { expect, test } from '@playwright/test'

test('native text suggestions retain arbitrary host values and browser validity', async ({ page }) => {
  await page.goto('/#/components/form-fields')
  const input = page.getByRole('combobox', { name: 'Service suggestions' })
  await expect(input).toHaveValue('custom-service')
  expect(await input.evaluate(element => [...(element as HTMLInputElement).list!.options].map(option => option.value))).toEqual(['local-service', 'remote-service'])
  await input.fill('private-custom-service')
  await input.blur()
  await expect(input).toHaveValue('private-custom-service')
  expect(await input.evaluate(element => (element as HTMLInputElement).checkValidity())).toBe(true)
  await page.getByRole('spinbutton', { name: 'Count', exact: true }).fill('7')
  await expect(input).toHaveValue('private-custom-service')
})
