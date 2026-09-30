import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = path.resolve(import.meta.dirname, '..')

const ADOPTIONS: ReadonlyArray<readonly [string, string, RegExp]> = [
  ['chat renders identities with the shared Avatar', 'src/svelte/components/chat/ChatMessage.svelte', /import Avatar from '\.\.\/identity\/Avatar\.svelte'/],
  ['chat models actors with the shared Identity', 'src/core/chat/types.ts', /import type \{[^}]*\bIdentity\b[^}]*\} from '\.\.\/identity\/types'/],
  ['activity rows render the shared Avatar', 'src/svelte/components/activity/ActivityFeedRow.svelte', /import Avatar from '\.\.\/identity\/Avatar\.svelte'/],
  ['activity models actors with the shared Identity', 'src/core/activity/contracts.ts', /import type \{[^}]*\bIdentity\b[^}]*\} from '\.\.\/identity\/types'/],
  ['notify renders actors with the shared Avatar', 'src/svelte/components/notify/NotificationList.svelte', /import Avatar from '\.\.\/identity\/Avatar\.svelte'/],
  ['notify models actors with the shared Identity', 'src/core/notify/contracts.ts', /import type \{[^}]*\bIdentity\b[^}]*\} from '\.\.\/identity\/types'/],
  ['auth uses the shared Identity', 'src/auth/client/types.ts', /import type \{[^}]*\bIdentity\b[^}]*\} from '\.\.\/\.\.\/core\/identity'/],
  ['chart metrics use Tint Surface', 'src/svelte/components/charts/MetricCard.svelte', /import Surface from '\.\.\/surface\/Surface\.svelte'/],
  ['chat delegates the lightbox to media assets', 'src/svelte/components/chat/ChatMediaLightbox.svelte', /import MediaLightbox from '\.\.\/media-assets\/MediaLightbox\.svelte'/],
]

describe('shared foundation adoption', () => {
  it.each(ADOPTIONS)('%s', (_name, file, pattern) => {
    expect(readFileSync(path.join(ROOT, file), 'utf8')).toMatch(pattern)
  })
})
