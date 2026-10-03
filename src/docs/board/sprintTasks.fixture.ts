// Hand-authored demo data for the Task Board page. Every name, date and task is
// fictional; nothing here is derived from a real notes vault.

import type { BoardDocument } from '../../components/board'

/** What a task card carries back to the note it came from. */
export type BoardTaskPayload = {
  sourceNote: string
  sourceLine: number
  date: string
  section: string
  tags: readonly string[]
  links: readonly string[]
  raw: string
}

type TaskSeed = {
  title: string
  laneId: 'investigate' | 'now' | 'next' | 'backlog' | 'done'
  date: string
  line: number
  section: string
  tags?: readonly string[]
  links?: readonly string[]
}

const SEEDS: readonly TaskSeed[] = [
  { title: 'Investigate the intermittent 502s on the staging gateway after the last deploy.', laneId: 'investigate', date: '2026-03-02', line: 14, section: 'Incidents', tags: ['ops', 'gateway'], links: ['Gateway runbook'] },
  { title: 'Find out why the nightly export job doubles its runtime on Fridays.', laneId: 'investigate', date: '2026-03-04', line: 31, section: 'Incidents', tags: ['ops', 'batch'] },
  { title: 'Draft the migration plan for moving session storage to the new cache tier.', laneId: 'now', date: '2026-03-03', line: 22, section: 'TODOs', tags: ['platform', 'cache'], links: ['Cache tier proposal'] },
  { title: 'Review the open pull requests for the notification preferences panel.', laneId: 'now', date: '2026-03-05', line: 9, section: 'TODOs', tags: ['frontend', 'review'] },
  { title: 'Add contract tests for the feed pagination endpoint.', laneId: 'now', date: '2026-03-05', line: 12, section: 'TODOs', tags: ['testing', 'api'] },
  { title: 'Write the release notes for the 2.4 milestone.', laneId: 'next', date: '2026-03-06', line: 18, section: 'TODOs', tags: ['docs', 'release'] },
  { title: 'Prototype keyboard navigation for the board layout toggle.', laneId: 'next', date: '2026-03-06', line: 21, section: 'Ideas', tags: ['frontend', 'a11y'] },
  { title: 'Audit icon usage and remove the duplicates left over from the old theme.', laneId: 'next', date: '2026-03-09', line: 7, section: 'TODOs', tags: ['design', 'cleanup'] },
  { title: 'Evaluate a lighter-weight charting option for the dashboard sparklines.', laneId: 'backlog', date: '2026-03-09', line: 25, section: 'Ideas', tags: ['frontend', 'research'] },
  { title: 'Collect screenshots of every empty state for the design review.', laneId: 'backlog', date: '2026-03-10', line: 11, section: 'TODOs', tags: ['design'] },
  { title: 'Document the retry policy for the webhook delivery worker.', laneId: 'backlog', date: '2026-03-10', line: 16, section: 'TODOs', tags: ['docs', 'ops'] },
  { title: 'Rotate the staging service credentials and update the deploy checklist.', laneId: 'done', date: '2026-03-02', line: 5, section: 'TODOs', tags: ['ops', 'security'] },
]

export const SPRINT_TASK_BOARD: BoardDocument = {
  schemaVersion: '1',
  id: 'board:sprint:2026-03-02_2026-03-13',
  revision: 'r1',
  metadata: {
    title: 'Sprint task board',
    purpose: 'Open items from team notes, laid out for triage',
    since: '2026-03-02',
    until: '2026-03-13',
    generatedFrom: 'Sample notes',
  },
  lanes: [
    { id: 'investigate', label: 'Investigate' },
    { id: 'now', label: 'Now' },
    { id: 'next', label: 'Next' },
    { id: 'backlog', label: 'Backlog' },
    { id: 'done', label: 'Done' },
  ],
  cards: SEEDS.map((seed, index) => {
    const payload: BoardTaskPayload = {
      sourceNote: `notes/${seed.date}.md`,
      sourceLine: seed.line,
      date: seed.date,
      section: seed.section,
      tags: seed.tags ?? [],
      links: seed.links ?? [],
      raw: seed.title,
    }
    return {
      id: `task-${String(index + 1).padStart(2, '0')}`,
      title: seed.title,
      laneId: seed.laneId,
      kind: 'task',
      preview: { kicker: `${seed.date} - ${seed.section}`, metrics: payload.tags },
      payload,
    }
  }),
}
