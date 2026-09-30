import { describe, expect, it } from 'vitest'
import { filterSettings, groupSettings } from './settings'

describe('media settings', () => {
  const items = [
    { id: '2', label: '2x', group: 'Playback speed', description: 'Play twice as fast' },
    { id: 'auto', label: 'Auto', group: 'Quality' },
    { id: '1', label: '1x', group: 'Playback speed' },
    { id: 'reset', label: 'Reset' },
  ]

  it('finds labels, groups and descriptions', () => {
    expect(filterSettings(items, 'twice').map((item) => item.id)).toEqual(['2'])
    expect(filterSettings(items, 'quality').map((item) => item.id)).toEqual(['auto'])
  })

  it('groups in first-seen heading order before ungrouped entries', () => {
    expect(groupSettings(items).map((group) => group.heading)).toEqual(['Playback speed', 'Quality', undefined])
    expect(groupSettings(items)[0].items.map((item) => item.id)).toEqual(['2', '1'])
  })
})
