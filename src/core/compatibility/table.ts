import type { CollectionWorkspaceLayout } from '../table/layout'
import type { WorkspaceInspectorTab, WorkspaceQuery } from '../table/workspace'

/** @deprecated Use the Workspace names; these aliases are retained for one release. */
export { collectionWorkspaceLayout as workbenchLayout } from '../table/layout'
/** @deprecated Use deriveWorkspaceRows. */
export { deriveWorkspaceRows as deriveWorkbenchRows } from '../table/workspace'
/** @deprecated Use CollectionWorkspaceLayout. */
export type WorkbenchLayout = CollectionWorkspaceLayout
/** @deprecated Use WorkspaceInspectorTab. */
export type WorkbenchInspectorTab = WorkspaceInspectorTab
/** @deprecated Use WorkspaceQuery. */
export type WorkbenchQuery = WorkspaceQuery

export type LegacyWorkspaceTableProps = {
  /** @deprecated Use workspaceResponsive; an explicit new value wins. */
  workbenchResponsive?: boolean
}
export function resolveWorkspaceResponsive(value: boolean | undefined, legacy: LegacyWorkspaceTableProps): boolean {
  return value ?? legacy.workbenchResponsive ?? false
}
// Keep existing consumer styles/selectors working for this release only.
export const legacyCollectionAttributes = { 'data-collection-workbench': '' }
export function legacyResponsiveAttributes(enabled: boolean) {
  return { 'data-workbench-responsive': enabled || undefined }
}
