import { test } from '@playwright/test'
import { DJActor } from './DJActor'

test('imports generated Midnight 128 tracks and auditions a real browser transition', async ({ page }) => {
  const dj = new DJActor(page)
  await dj.openClient()
  await dj.importSyntheticReferenceTracks()
  await dj.expectGeneratedSet()
  await dj.auditionFirstTransition()
})
