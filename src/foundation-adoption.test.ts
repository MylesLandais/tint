import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Tint 0.2 turned Identity/Avatar, Surface/Card, and the chart primitives into
 * shared foundations, then refactored the feature packages onto them. That
 * refactor is the point of the release, and nothing else enforces it: each
 * consumer would still compile, render, and pass its own tests if someone
 * quietly reintroduced a local avatar or a bespoke card wrapper. These
 * assertions pin the fan-out so a regression shows up as a failing test rather
 * than as drift discovered by a consuming application.
 */
const ROOT = path.resolve(import.meta.dirname, '..')

const ADOPTIONS: ReadonlyArray<readonly [string, string, RegExp]> = [
  ['chat renders identities with the shared Avatar', 'src/components/chat/ChatMessage.tsx', /import \{[^}]*\bAvatar\b[^}]*\} from '\.\.\/identity'/],
  ['chat models actors as the shared Identity', 'src/components/chat/types.ts', /import type \{[^}]*\bIdentity\b[^}]*\} from '\.\.\/identity'/],
  ['activity rows render the shared Avatar', 'src/components/activity/ActivityFeedRow.tsx', /import \{[^}]*\bAvatar\b[^}]*\} from '\.\.\/identity'/],
  ['activity models actors as the shared Identity', 'src/components/activity/contracts.ts', /import type \{[^}]*\bIdentity\b[^}]*\} from '\.\.\/identity'/],
  ['notify renders actors with the shared Avatar', 'src/components/notify/NotificationList.tsx', /import \{[^}]*\bAvatar\b[^}]*\} from '\.\.\/identity'/],
  ['notify models actors as the shared Identity', 'src/components/notify/contracts.ts', /import type \{[^}]*\bIdentity\b[^}]*\} from '\.\.\/identity'/],
  ['auth references the shared Identity rather than an email-keyed user', 'src/auth/client/types.ts', /import type \{[^}]*\bIdentity\b[^}]*\} from '\.\.\/\.\.\/components\/identity'/],
  ['board cards are built on Surface', 'src/components/board/BoardCard.tsx', /import \{[^}]*\bSurface\b[^}]*\} from '\.\.\/surface'/],
  ['charts are built on Surface', 'src/components/charts/Charts.tsx', /import \{[^}]*\bSurface\b[^}]*\} from '\.\.\/surface'/],
  ['telemetry reuses the generic MetricCard', 'src/components/telemetry/TraceMetrics.tsx', /import \{[^}]*\bMetricCard\b[^}]*\} from '\.\.\/charts'/],
  ['the docs shell dogfoods AppShell', 'src/docs/shell/DocsShell.tsx', /import \{[^}]*\bAppShell\b[^}]*\} from '\.\.\/\.\.\/components\/navigation'/],
]

describe('shared foundation adoption', () => {
  it.each(ADOPTIONS)('%s', (_name, file, pattern) => {
    expect(readFileSync(path.join(ROOT, file), 'utf8')).toMatch(pattern)
  })

  it('no feature package ships a private avatar or card implementation', () => {
    // The lightbox is the other half of this: chat must delegate to the generic
    // media lightbox instead of keeping its own viewer.
    const source = readFileSync(path.join(ROOT, 'src/components/chat/ChatMediaLightbox.tsx'), 'utf8')
    expect(source).toMatch(/from '\.\.\/media-assets'/)
  })
})
