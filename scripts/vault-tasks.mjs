/**
 * Vault journal -> board fixture.
 *
 * The daily notes in the Obsidian vault are capture-only: 473 open `- [ ]`
 * items across 60 dated notes, and outside four days nothing has ever been
 * checked off. This lifts one sprint window out of that prose and emits a
 * typed BoardDocument so the items land on Tint's board instead of being
 * re-read every night.
 *
 * Strictly read-only over the vault. It writes exactly one file, inside this
 * repo. The vault sits on a broadly dirty branch and must not gain a diff.
 *
 *   node scripts/vault-tasks.mjs [--since YYYY-MM-DD] [--until YYYY-MM-DD]
 *                                [--vault PATH] [--out PATH] [--json]
 *
 * With no window the script anchors to the newest daily note and takes the
 * 14 days ending there, so a run is reproducible regardless of the wall clock.
 */
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { homedir } from 'node:os'

const args = parseArgs(process.argv.slice(2))
const VAULT = resolve(args.vault ?? join(homedir(), 'Vault'))
const NOTES_DIR = join(VAULT, 'Daily Notes')
const OUT = resolve(
  args.out ?? fileURLToPath(new URL('../src/docs/board/vaultTasks.generated.ts', import.meta.url)),
)
const WINDOW_DAYS = 14

/**
 * The spend-pulse checkboxes are a ritual template reprinted in nightly notes,
 * not work. They are the only recurring lines that would otherwise dominate the
 * board, so they are excluded by exact match rather than by a fuzzy heuristic
 * that might swallow real items.
 */
const RITUAL_LINES = new Set(['doordash', 'instacart', 'alcohol', 'impulse (>$50)'])

/**
 * Nothing in the notes records status, so lanes are seeded by rule and the
 * board owns them afterwards. Order matters: the first match wins.
 */
const LANES = [
  { id: 'investigate', label: 'Investigate' },
  { id: 'now', label: 'Now' },
  { id: 'next', label: 'Next' },
  { id: 'backlog', label: 'Backlog' },
  { id: 'done', label: 'Done' },
]

/** Blocked on an answer that does not exist in the vault yet. */
const INVESTIGATE = /unauthorized|revoke|rotate|api[- ]key|security notice|openrouter/i

/**
 * The newest note's "Tomorrow focus" chain: one clean workspace boundary, the
 * sprint diff inventory, then live state -> planner -> acknowledged executor ->
 * replay evidence.
 */
const NOW =
  /sprint manifest|path-scoped|canonical .*workspace|logical-state adapter|acknowledged|executor|planner|humanized|radar|live player|verification commands|replay/i

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--json') out.json = true
    else if (arg.startsWith('--')) {
      out[arg.slice(2)] = argv[i + 1]
      i += 1
    }
  }
  return out
}

function addDays(iso, delta) {
  const date = new Date(`${iso}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + delta)
  return date.toISOString().slice(0, 10)
}

/** Frontmatter `date:` if present, else the leading YYYY-MM-DD of the filename. */
function noteDate(name, source) {
  const front = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source)
  const declared = front && /^date:\s*(\d{4}-\d{2}-\d{2})/m.exec(front[1])
  if (declared) return declared[1]
  const fromName = /^(\d{4}-\d{2}-\d{2})/.exec(name)
  return fromName ? fromName[1] : null
}

function noteTags(source) {
  const front = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source)
  const line = front && /^tags:\s*\[(.*)\]/m.exec(front[1])
  if (!line) return []
  return line[1]
    .split(',')
    .map((tag) => tag.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean)
}

/** `[[Some/Note|alias]]` -> `Some/Note`, so a card can link back into the vault. */
function wikiLinks(text) {
  return [...text.matchAll(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g)].map((match) => match[1].trim())
}

/** Strip wikilink syntax and inline code fences for a readable card title. */
function displayTitle(text) {
  return text
    .replace(/\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/g, (_, target, alias) => alias || target.split('/').pop())
    .replace(/`([^`]+)`/g, '$1')
    .trim()
}

function laneFor(text, date, until) {
  if (INVESTIGATE.test(text)) return 'investigate'
  if (date === until && NOW.test(text)) return 'now'
  if (date >= addDays(until, -4)) return 'next'
  return 'backlog'
}

function stableId(sourceNote, text) {
  const digest = createHash('sha1')
    .update(`${sourceNote} ${text.toLowerCase().replace(/\s+/g, ' ').trim()}`)
    .digest('hex')
  return `vt-${digest.slice(0, 12)}`
}

// ---------------------------------------------------------------------------

const dated = []
for (const name of readdirSync(NOTES_DIR).filter((n) => n.endsWith('.md')).sort()) {
  const source = readFileSync(join(NOTES_DIR, name), 'utf8')
  const date = noteDate(name, source)
  if (date) dated.push({ name, source, date })
}

if (dated.length === 0) {
  console.error(`No dated notes found under ${NOTES_DIR}`)
  process.exit(1)
}

const until = args.until ?? dated.reduce((max, note) => (note.date > max ? note.date : max), dated[0].date)
const since = args.since ?? addDays(until, -(WINDOW_DAYS - 1))

const cards = []
let skippedRituals = 0

const inWindow = dated
  .filter((note) => note.date >= since && note.date <= until)
  .sort((a, b) => (a.date < b.date ? -1 : 1))

for (const note of inWindow) {
  const tags = noteTags(note.source)
  // The enclosing heading gives a card its context; `####` subsections are the
  // most specific, so track all three levels and prefer the deepest seen.
  let h2 = ''
  let h3 = ''
  let h4 = ''
  let inFence = false

  note.source.split(/\r?\n/).forEach((line, index) => {
    if (/^\s*```/.test(line)) {
      inFence = !inFence
      return
    }
    if (inFence) return

    const heading = /^(#{2,4})\s+(.*)$/.exec(line)
    if (heading) {
      const level = heading[1].length
      const label = heading[2].trim()
      if (level === 2) {
        h2 = label
        h3 = ''
        h4 = ''
      } else if (level === 3) {
        h3 = label
        h4 = ''
      } else {
        h4 = label
      }
      return
    }

    const item = /^\s*-\s\[ \]\s+(.*\S)\s*$/.exec(line)
    if (!item) return

    const raw = item[1]
    const title = displayTitle(raw)
    if (RITUAL_LINES.has(title.toLowerCase())) {
      skippedRituals += 1
      return
    }

    const section = h4 || h3 || h2 || ''
    cards.push({
      id: stableId(note.name, raw),
      title,
      laneId: laneFor(raw, note.date, until),
      kind: 'task',
      preview: {
        kicker: section ? `${note.date} - ${section}` : note.date,
        // The note name is its date, which the kicker already carries; only
        // the topical tags add anything here.
        metrics: tags.filter((tag) => tag !== 'daily' && tag !== 'journal').slice(0, 4),
      },
      payload: {
        sourceNote: `Daily Notes/${note.name}`,
        sourceLine: index + 1,
        date: note.date,
        section,
        tags,
        links: wikiLinks(raw),
        raw,
      },
    })
  })
}

// Duplicate ids would silently drop cards in the board's id-keyed lookups.
const seen = new Set()
for (const card of cards) {
  if (seen.has(card.id)) {
    console.error(`Duplicate card id ${card.id} - "${card.title}"`)
    process.exit(1)
  }
  seen.add(card.id)
}

const document = {
  schemaVersion: '1',
  id: `board:vault:${since}_${until}`,
  revision: 'r1',
  metadata: {
    title: 'Vault sprint board',
    purpose: 'Open journal items lifted from the daily notes for triage',
    since,
    until,
    generatedFrom: 'Daily Notes',
    sourceNotes: [...new Set(cards.map((card) => card.payload.sourceNote))],
  },
  lanes: LANES,
  cards,
}

if (args.json) {
  console.log(JSON.stringify(document, null, 2))
  process.exit(0)
}

// Quote only what needs quoting: JSON.stringify then unquote safe keys and
// swap to single quotes, so the emitted module matches the repo's fixture style
// and survives `oxlint` without a formatter pass.
const literal = JSON.stringify(document, null, 2)
  .replace(/^(\s*)"([A-Za-z_$][A-Za-z0-9_$]*)":/gm, '$1$2:')
  .replace(/"((?:[^"\\]|\\.)*)"/g, (_, inner) => `'${inner.replace(/\\"/g, '"').replace(/'/g, "\\'")}'`)

writeFileSync(
  OUT,
  `// GENERATED by scripts/vault-tasks.mjs - do not edit by hand.
// Window ${since} to ${until}; ${cards.length} open items from ${document.metadata.sourceNotes.length} notes.
// Regenerate: node scripts/vault-tasks.mjs

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

export const VAULT_TASK_BOARD: BoardDocument = ${literal}
`,
)

const perLane = LANES.map(
  (lane) => `${lane.label} ${cards.filter((card) => card.laneId === lane.id).length}`,
).join(' / ')
console.log(`${cards.length} cards - ${since} to ${until} - ${perLane}`)
console.log(`skipped ${skippedRituals} ritual lines - wrote ${OUT}`)
