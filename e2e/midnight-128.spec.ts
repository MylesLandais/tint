import { expect, test } from '@playwright/test'
import { DJActor } from './DJActor'

test('imports generated Midnight 128 tracks and auditions a real browser transition', async ({ page }) => {
  const duplicateYjsWarnings: string[] = []
  page.on('console', (message) => {
    if (message.text().includes('Yjs was already imported')) duplicateYjsWarnings.push(message.text())
  })
  const dj = new DJActor(page)
  await dj.openClient()
  await dj.importSyntheticReferenceTracks()
  await dj.expectGeneratedSet()
  await dj.auditionFirstTransition()
  expect(duplicateYjsWarnings).toEqual([])
})
