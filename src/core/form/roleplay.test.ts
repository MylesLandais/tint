import { describe, expect, it } from 'vitest'
import {
  groupMemberRows, moveGroupMember, muteGroupMember, removeGroupMember,
  groupNumberOptions, personaPositionOptions, patchRegexRule, toggleRegexPlacement,
  importFileCount, type GroupFields,
} from './roleplay'

const group: GroupFields = {
  name: 'Crew', members: ['a', 'missing', 'a'], mutedMembers: ['a', 'missing'],
  strategy: 42, promptMode: 0, allowSelfReplies: false, delay: 0, prefix: 'keep', suffix: 'keep', favorite: false,
}

describe('roleplay form models', () => {
  it('keeps duplicate member identity and muted state until the final occurrence is removed', () => {
    expect(groupMemberRows(group.members, [{ value: 'a', label: 'Ada' }])).toEqual([
      { key: 'a:0', member: 'a', label: 'Ada', available: true, index: 0 },
      { key: 'missing:0', member: 'missing', label: 'missing', available: false, index: 1 },
      { key: 'a:1', member: 'a', label: 'Ada', available: true, index: 2 },
    ])
    const firstRemoved = removeGroupMember(group, 0)
    expect(firstRemoved.mutedMembers).toContain('a')
    expect(removeGroupMember(firstRemoved, 1).mutedMembers).not.toContain('a')
    expect(moveGroupMember(group, 2, -1).members).toEqual(['a', 'a', 'missing'])
    expect(muteGroupMember(group, 'a', true).mutedMembers).toEqual(['a', 'missing'])
  })

  it('retains saved numeric options absent from a current catalog', () => {
    expect(groupNumberOptions([{ value: 0, label: 'Manual' }], 42)).toContainEqual({ value: '42', label: 'Saved option 42' })
    expect(personaPositionOptions(17)).toContainEqual({ value: '17', label: 'Saved position 17' })
  })

  it('edits known regex fields without losing host extensions or unknown placements', () => {
    const rule = { scriptName: 'Old', placement: [2, 99], extension: { revision: 7 } }
    const [next] = patchRegexRule([rule], 0, { scriptName: 'New' })
    expect(next).toEqual({ ...rule, scriptName: 'New' })
    expect(toggleRegexPlacement(next!, 2, false)).toEqual([99])
    expect(toggleRegexPlacement(next!, 1, true)).toEqual([2, 99, 1])
  })

  it('counts preserved files independently from usable records', () => {
    expect(importFileCount([{ id: 'a', label: 'Chats', files: 2, ready: 0, errors: 1 },
      { id: 'b', label: 'Cards', files: 1, ready: 5, errors: 0 }])).toBe(3)
  })
})
