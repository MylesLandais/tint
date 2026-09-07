import { expect, type Page } from '@playwright/test'
import { createSyntheticHouseWav } from '../src/test/syntheticHouseWav'

const TRACKS = [
  { name: '01-here-we-go.wav', durationSeconds: 320, seed: 1 },
  { name: '02-apapacho.wav', durationSeconds: 391, seed: 2 },
  { name: '03-trajadao.wav', durationSeconds: 345, seed: 3 },
] as const

export class DJActor {
  constructor(readonly page: Page) {}

  async openClient(): Promise<void> {
    await this.page.goto('/#/components/media-player')
    await expect(this.page.getByRole('heading', { name: 'Midnight 128 browser demo' })).toBeVisible()
  }

  async importSyntheticReferenceTracks(): Promise<void> {
    const files = TRACKS.map(({ name, durationSeconds, seed }) => ({
      name,
      mimeType: 'audio/wav',
      buffer: Buffer.from(createSyntheticHouseWav({ durationSeconds, sampleRate: 8_000, seed })),
    }))
    await this.page.getByLabel('Choose audio files').setInputFiles(files)
    await this.page.getByRole('button', { name: 'Import tracks', exact: true }).click()
  }

  async expectGeneratedSet(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: 'Midnight 128', exact: true })).toBeVisible({ timeout: 30_000 })
    await expect(this.page.getByText('128 BPM · 3A ·')).toContainText('16:06')
    await expect(this.page.getByText('32 bars · Long bass swap')).toBeVisible()
    await expect(this.page.getByText('16 bars · Filter echo exit')).toBeVisible()
  }

  async auditionFirstTransition(): Promise<void> {
    await this.page.getByRole('button', { name: 'Audition transition' }).first().click()
    await expect(this.page.getByText('Audition playing')).toBeVisible({ timeout: 10_000 })
  }
}
