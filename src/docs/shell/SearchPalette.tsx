import { useMemo, useState } from 'react'
import { CommandPalette, type CommandPaletteItem } from '../../components/shell'
import { DOC_ROUTES, hrefFor, type DocRoute, type DocSection } from '../routes'

type IndexedCommand = CommandPaletteItem & { route: DocRoute; section?: DocSection }

export type SearchPaletteProps = { open: boolean; onClose: () => void }

/** Docs-specific adapter over Tint's generic controlled CommandPalette. */
export function SearchPalette({ open, onClose }: SearchPaletteProps) {
  const [query, setQuery] = useState('')
  const commands = useMemo<IndexedCommand[]>(() => DOC_ROUTES.flatMap((route) => [
    { id: route.path, label: route.label, description: route.blurb, route },
    ...(route.sections ?? []).map((section) => ({ id: `${route.path}#${section.id}`, label: `${route.label} — ${section.label}`, keywords: [route.label, section.label], route, section })),
  ]), [])

  const select = (id: string) => {
    const command = commands.find((item) => item.id === id)
    if (!command) return
    window.location.hash = hrefFor(command.route)
    if (command.section) {
      const sectionId = command.section.id
      window.setTimeout(() => document.getElementById(sectionId)?.scrollIntoView(), 100)
      window.setTimeout(() => document.getElementById(sectionId)?.scrollIntoView(), 500)
    }
  }

  return <CommandPalette open={open} onOpenChange={(next) => { if (!next) onClose() }} query={query} onQueryChange={setQuery} items={commands} onSelect={select} label="Search documentation" placeholder="Search components…" />
}
