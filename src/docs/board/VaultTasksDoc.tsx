import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  applyBoardCommand,
  BoardDetail,
  BoardLayout,
  BoardLayoutToggle,
  cardsForLane,
  type BoardCardModel,
  type BoardDocument,
  type BoardLayoutVariant,
} from '../../components/board'
import { Badge } from '../../components/badge'
import { Button } from '../../components/button'
import { SplitPane } from '../../components/feed'
import { CodeBlock } from '../components/CodeBlock'
import { DocsPage, DocsPreview, DocsSection } from '../components/DocsPage'
import { VAULT_TASK_BOARD, type BoardTaskPayload } from './vaultTasks.generated'

const usage = `# Regenerate the cards from the vault, then open the page.
node scripts/vault-tasks.mjs
node scripts/vault-tasks.mjs --since 2026-08-24 --until 2026-09-05
node scripts/vault-tasks.mjs --json | jq '.cards | length'`

/**
 * Triage has to outlive a regeneration or the board is just another snapshot of
 * the notes — the exact failure the daily notes already have. Content comes
 * from the generated fixture; lane placement is remembered here, in the host,
 * because Tint components never persist.
 */
const TRIAGE_KEY = 'tint:vault-tasks:lanes:v1'

function readTriage(): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(TRIAGE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return {}
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string',
      ),
    )
  } catch {
    // Private windows and blocked site data both throw on access. A board that
    // renders un-triaged beats a page that fails to mount.
    return {}
  }
}

function writeTriage(lanes: Record<string, string>) {
  try {
    window.localStorage.setItem(TRIAGE_KEY, JSON.stringify(lanes))
  } catch {
    /* nothing to do — the board still works for this session */
  }
}

/**
 * Overlay saved lanes onto the generated document. Cards the extractor no
 * longer emits simply drop out; saved lanes that name a removed lane are
 * ignored rather than stranding a card in a column that is not rendered.
 */
function withTriage(document: BoardDocument, lanes: Record<string, string>): BoardDocument {
  const laneIds = new Set(document.lanes.map((lane) => lane.id))
  let changed = false
  const cards = document.cards.map((card) => {
    const saved = lanes[card.id]
    if (!saved || saved === card.laneId || !laneIds.has(saved)) return card
    changed = true
    return { ...card, laneId: saved }
  })
  return changed ? { ...document, cards } : document
}

function isTaskPayload(payload: unknown): payload is BoardTaskPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'sourceNote' in payload &&
    typeof (payload as BoardTaskPayload).sourceNote === 'string'
  )
}

function TaskDetailBody({ card }: { card: BoardCardModel }) {
  if (!isTaskPayload(card.payload)) {
    return <p className="m-0 p-4 text-sm text-tint-muted">No source recorded for this card.</p>
  }
  const { sourceNote, sourceLine, date, section, tags, links, raw } = card.payload

  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="m-0 text-sm leading-relaxed text-tint-ink">{raw}</p>

      <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs">
        <dt className="m-0 text-tint-muted">Source</dt>
        <dd className="m-0 font-mono text-tint-ink">
          {sourceNote}:{sourceLine}
        </dd>
        <dt className="m-0 text-tint-muted">Date</dt>
        <dd className="m-0 font-mono tabular-nums text-tint-ink">{date}</dd>
        {section ? (
          <>
            <dt className="m-0 text-tint-muted">Section</dt>
            <dd className="m-0 text-tint-ink">{section}</dd>
          </>
        ) : null}
      </dl>

      {links.length > 0 ? (
        <div>
          <p className="m-0 mb-1.5 text-[0.625rem] font-semibold tracking-[0.14em] text-tint-muted uppercase">
            Linked notes
          </p>
          <div className="flex flex-wrap gap-1">
            {links.map((link) => (
              <Badge key={link} tone="neutral">
                {link}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {tags.length > 0 ? (
        <div>
          <p className="m-0 mb-1.5 text-[0.625rem] font-semibold tracking-[0.14em] text-tint-muted uppercase">
            Note tags
          </p>
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <Badge key={tag} tone="neutral">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function MoveControl({
  card,
  document,
  onMove,
}: {
  card: BoardCardModel
  document: BoardDocument
  onMove: (cardId: string, laneId: string) => void
}) {
  return (
    <label className="inline-flex items-center gap-1 text-[0.6875rem] text-tint-muted">
      <span className="sr-only">Move {card.title} to lane</span>
      <select
        className="max-w-[6.5rem] rounded-md border border-tint-border bg-tint-panel px-1.5 py-0.5 text-[0.6875rem] text-tint-ink"
        value={card.laneId}
        onChange={(event) => {
          if (event.target.value !== card.laneId) onMove(card.id, event.target.value)
        }}
        onClick={(event) => event.stopPropagation()}
      >
        {document.lanes.map((lane) => (
          <option key={lane.id} value={lane.id}>
            {lane.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function SprintBoard() {
  const [triage, setTriage] = useState<Record<string, string>>({})
  const [hydrated, setHydrated] = useState(false)
  const [document, setDocument] = useState<BoardDocument>(VAULT_TASK_BOARD)
  const [variant, setVariant] = useState<BoardLayoutVariant>('kanban')
  const [selectedId, setSelectedId] = useState<string | null>(
    VAULT_TASK_BOARD.cards[0]?.id ?? null,
  )

  // Read once on mount rather than in the initializer: `localStorage` is not
  // available while the module is evaluated in the test environment.
  useEffect(() => {
    const saved = readTriage()
    setTriage(saved)
    setDocument(withTriage(VAULT_TASK_BOARD, saved))
    setHydrated(true)
  }, [])

  const moveCard = useCallback(
    (cardId: string, laneId: string) => {
      setDocument((current) =>
        applyBoardCommand(current, {
          type: 'card.move',
          cardId,
          laneId,
          index: cardsForLane(current, laneId).length,
        }),
      )
      setTriage((current) => {
        const next = { ...current, [cardId]: laneId }
        writeTriage(next)
        return next
      })
    },
    [],
  )

  const resetTriage = useCallback(() => {
    setTriage({})
    writeTriage({})
    setDocument(VAULT_TASK_BOARD)
    setSelectedId(VAULT_TASK_BOARD.cards[0]?.id ?? null)
  }, [])

  const selected = document.cards.find((card) => card.id === selectedId) ?? null

  const visibleIds = useMemo(
    () =>
      variant === 'kanban'
        ? document.lanes.flatMap((lane) => cardsForLane(document, lane.id).map((card) => card.id))
        : document.cards.map((card) => card.id),
    [document, variant],
  )

  const moveSelection = useCallback(
    (delta: number) => {
      if (visibleIds.length === 0) return
      const current = selectedId ? visibleIds.indexOf(selectedId) : -1
      const nextIndex = current < 0 ? 0 : (current + delta + visibleIds.length) % visibleIds.length
      setSelectedId(visibleIds[nextIndex] ?? null)
    },
    [selectedId, visibleIds],
  )

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.closest('select, input, textarea, button, [contenteditable]')) return
      if (event.key === 'j' || event.key === 'ArrowDown' || event.key === 'ArrowRight') {
        event.preventDefault()
        moveSelection(1)
      } else if (event.key === 'k' || event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
        event.preventDefault()
        moveSelection(-1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [moveSelection])

  const meta = document.metadata as { since?: string; until?: string }
  const triaged = Object.keys(triage).length

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <BoardLayoutToggle value={variant} onChange={setVariant} />
        <p className="m-0 text-xs text-tint-muted">
          <span className="font-mono tabular-nums">
            {meta.since} → {meta.until}
          </span>
          {' · '}
          {document.cards.length} open items
          {' · '}
          {hydrated && triaged > 0 ? `${triaged} triaged locally` : 'seeded by rule'}
          {' · j/k or arrows move selection'}
        </p>
        <Button size="sm" variant="ghost" className="ml-auto" onClick={resetTriage}>
          Reset triage
        </Button>
      </div>

      <div className="h-[34rem] overflow-hidden rounded-xl border border-tint-border">
        <SplitPane
          className="h-full"
          startWidth="1fr"
          middleWidth="26rem"
          start={
            <div className="h-full overflow-auto p-3">
              <BoardLayout
                cards={document.cards}
                lanes={document.lanes}
                variant={variant}
                selectedId={selectedId}
                onSelect={setSelectedId}
                label="Vault sprint board"
                renderActions={(card) => (
                  <MoveControl card={card} document={document} onMove={moveCard} />
                )}
              />
            </div>
          }
          middle={
            <div className="h-full overflow-auto p-3">
              <BoardDetail
                card={selected}
                className="h-full min-h-[20rem]"
                empty="Select a card to see the journal line it came from."
              >
                {selected ? <TaskDetailBody card={selected} /> : null}
              </BoardDetail>
            </div>
          }
        />
      </div>
    </div>
  )
}

export function VaultTasksDoc() {
  return (
    <DocsPage
      route="vault-tasks"
      title="Vault Sprint Board"
      wide
      intro="Open items lifted out of the Obsidian daily notes and packed onto the board for triage. Cards are generated from the journal; lanes are seeded by rule and then owned here."
      note="The extractor is read-only over the vault and writes one generated fixture into this repo. Regenerating replaces card content; lane placement is remembered in localStorage and re-applied, so triage survives a refresh of the source notes."
    >
      <DocsSection id="preview" title="Workbench">
        <DocsPreview className="p-3 sm:p-4">
          <SprintBoard />
        </DocsPreview>
      </DocsSection>

      <DocsSection id="usage" title="Usage">
        <CodeBlock code={usage} language="bash" />
      </DocsSection>
    </DocsPage>
  )
}
