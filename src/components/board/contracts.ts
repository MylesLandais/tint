/**
 * Host-owned board document — GraphDocument / FeedDocument-shaped, React-free.
 *
 * Tint presents this; the host (or a docs demo store) owns mutation. Collections
 * are `readonly` and replaced wholesale so `revision` stays honest.
 */

export type BoardId = string
export type BoardCardId = string
export type BoardLaneId = string
export type RevisionToken = string

/** Shipped widget kinds. Hosts extend via `renderPreview` / `renderDetail`. */
export type BoardCardKind = 'graph' | 'table' | 'media'

export type BoardLane = {
  id: BoardLaneId
  label: string
}

/**
 * Enough for variable-height masonry without mounting the live surface.
 * Live graph / table / media live in the detail pane, not on the card.
 */
export type BoardCardPreview = {
  /** Muted secondary line, e.g. `12 nodes · 18 edges`. */
  kicker?: string
  /** Optional still / poster for media-flavoured cards. */
  posterUrl?: string
  /** Small metric chips under the kicker. */
  metrics?: readonly string[]
}

export type BoardCard = {
  id: BoardCardId
  title: string
  laneId: BoardLaneId
  kind: BoardCardKind
  preview: BoardCardPreview
  /**
   * Opaque host payload. The board chrome never inspects it — docs and hosts
   * interpret it in `renderDetail`.
   */
  payload?: unknown
}

export type BoardDocument = {
  schemaVersion: string
  id: BoardId
  revision: RevisionToken
  lanes: readonly BoardLane[]
  cards: readonly BoardCard[]
  metadata: Record<string, unknown>
}

export type BoardCommand =
  | { type: 'card.create'; card: BoardCard }
  | {
      type: 'card.update'
      cardId: BoardCardId
      patch: Partial<Omit<BoardCard, 'id'>>
    }
  | { type: 'card.delete'; cardId: BoardCardId }
  | {
      type: 'card.move'
      cardId: BoardCardId
      laneId: BoardLaneId
      /** Index within the destination lane. Clamped to the lane length. */
      index: number
    }
  | {
      type: 'card.reorder'
      /** Full card id order for the document (masonry source order). */
      cardIds: readonly BoardCardId[]
    }

export function nextBoardRevision(current: RevisionToken): RevisionToken {
  const n = Number.parseInt(current.replace(/\D/g, ''), 10)
  return `r${Number.isFinite(n) ? n + 1 : 1}`
}

/** Cards whose `laneId` matches, in document order. */
export function cardsForLane(
  document: Pick<BoardDocument, 'cards'>,
  laneId: BoardLaneId,
): readonly BoardCard[] {
  return document.cards.filter((card) => card.laneId === laneId)
}

/**
 * Apply a board command. Same ownership rule as graph / policy: the chrome
 * reports, the host stores. Returns the same reference when nothing changed.
 */
export function applyBoardCommand(
  document: BoardDocument,
  command: BoardCommand,
): BoardDocument {
  switch (command.type) {
    case 'card.create': {
      if (document.cards.some((card) => card.id === command.card.id)) return document
      if (!document.lanes.some((lane) => lane.id === command.card.laneId)) return document
      return commit(document, { cards: [...document.cards, command.card] })
    }
    case 'card.update': {
      let changed = false
      const cards = document.cards.map((card) => {
        if (card.id !== command.cardId) return card
        const next = { ...card, ...command.patch, id: card.id }
        if (next.laneId !== card.laneId && !document.lanes.some((l) => l.id === next.laneId)) {
          return card
        }
        if (
          next.title === card.title &&
          next.laneId === card.laneId &&
          next.kind === card.kind &&
          next.preview === card.preview &&
          next.payload === card.payload
        ) {
          return card
        }
        changed = true
        return next
      })
      return changed ? commit(document, { cards }) : document
    }
    case 'card.delete': {
      const cards = document.cards.filter((card) => card.id !== command.cardId)
      return cards.length === document.cards.length ? document : commit(document, { cards })
    }
    case 'card.move': {
      const fromIndex = document.cards.findIndex((card) => card.id === command.cardId)
      if (fromIndex < 0) return document
      if (!document.lanes.some((lane) => lane.id === command.laneId)) return document

      const moving = document.cards[fromIndex]!
      const without = document.cards.filter((card) => card.id !== command.cardId)
      const lanePeers = without.filter((card) => card.laneId === command.laneId)
      const clamped = Math.max(0, Math.min(command.index, lanePeers.length))

      // Insert among destination-lane peers, preserving relative order of
      // other lanes' cards around the insertion site.
      const insertBeforePeer = lanePeers[clamped]
      let insertAt = without.length
      if (insertBeforePeer) {
        insertAt = without.findIndex((card) => card.id === insertBeforePeer.id)
      } else if (lanePeers.length > 0) {
        const lastPeer = lanePeers[lanePeers.length - 1]!
        insertAt = without.findIndex((card) => card.id === lastPeer.id) + 1
      } else {
        // Empty lane: place after the last card of any earlier lane, else at 0.
        const laneOrder = document.lanes.map((lane) => lane.id)
        const destLaneIndex = laneOrder.indexOf(command.laneId)
        let lastEarlier = -1
        without.forEach((card, index) => {
          const cardLaneIndex = laneOrder.indexOf(card.laneId)
          if (cardLaneIndex >= 0 && cardLaneIndex < destLaneIndex) lastEarlier = index
        })
        insertAt = lastEarlier + 1
      }

      const nextCard: BoardCard = { ...moving, laneId: command.laneId }
      const sameLane = moving.laneId === command.laneId
      const currentLaneIndex = sameLane
        ? cardsForLane(document, command.laneId).findIndex((c) => c.id === command.cardId)
        : -1
      if (sameLane && currentLaneIndex === clamped) return document

      const cards = [
        ...without.slice(0, insertAt),
        nextCard,
        ...without.slice(insertAt),
      ]
      return commit(document, { cards })
    }
    case 'card.reorder': {
      if (command.cardIds.length !== document.cards.length) return document
      const byId = new Map(document.cards.map((card) => [card.id, card]))
      if (command.cardIds.some((id) => !byId.has(id))) return document
      const sameOrder = command.cardIds.every((id, index) => document.cards[index]?.id === id)
      if (sameOrder) return document
      const cards = command.cardIds.map((id) => byId.get(id)!)
      return commit(document, { cards })
    }
  }
}

function commit(
  document: BoardDocument,
  patch: Partial<Pick<BoardDocument, 'cards' | 'lanes' | 'metadata'>>,
): BoardDocument {
  return {
    ...document,
    ...patch,
    revision: nextBoardRevision(document.revision),
  }
}
