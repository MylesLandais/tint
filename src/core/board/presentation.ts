import type { BoardCardKind } from './contracts'

export type BoardLayoutVariant = 'masonry' | 'kanban'

export const BOARD_LAYOUT_OPTIONS: readonly { value: BoardLayoutVariant; label: string }[] = [
  { value: 'masonry', label: 'Masonry' },
  { value: 'kanban', label: 'Kanban' },
]

const KIND_LABEL: Record<BoardCardKind, string> = {
  graph: 'GRAPH',
  table: 'TABLE',
  media: 'MEDIA',
  task: 'TASK',
}

export function boardKindLabel(kind: BoardCardKind): string {
  return KIND_LABEL[kind]
}
