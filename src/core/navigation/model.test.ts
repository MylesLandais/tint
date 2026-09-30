import { describe, expect, it } from 'vitest'
import { breadcrumbEntries, navigationEntries, sidebarPresentation } from './model'

describe('navigation model', () => {
  it('marks exact active hrefs without changing disabled or duplicate destinations', () => {
    const items = [
      { id: 'home', label: 'Home', href: '/home' },
      { id: 'section', label: 'Section', href: '/home/section', disabled: true },
      { id: 'alias', label: 'Alias', href: '/home' },
    ]
    expect(navigationEntries(items, '/home').map(({ active }) => active)).toEqual([true, false, true])
    expect(navigationEntries(items, '/home/').every(({ active }) => !active)).toBe(true)
    expect(items[1].disabled).toBe(true)
  })

  it('never links the current breadcrumb and keeps missing destinations as text', () => {
    expect(breadcrumbEntries([
      { id: 'root', label: 'Root', href: '/' },
      { id: 'group', label: 'Group' },
      { id: 'current', label: 'Current', href: '/current' },
    ]).map(({ current, linked }) => ({ current, linked }))).toEqual([
      { current: false, linked: true },
      { current: false, linked: false },
      { current: true, linked: false },
    ])
  })

  it('uses its own container width for sidebar presentation', () => {
    expect(sidebarPresentation(1500, false)).toBe('none')
    expect(sidebarPresentation(320, true)).toBe('overlay')
    expect(sidebarPresentation(1023, true)).toBe('overlay')
    expect(sidebarPresentation(1024, true)).toBe('inline')
  })
})
