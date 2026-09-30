export type WorkbenchLayout = {
  inspector: 'right' | 'below'
  navigation: 'tabs' | 'chips'
  hiddenColumns: readonly string[]
}

/** The containing workbench, not the browser viewport, sets the pane layout. */
export function workbenchLayout(containerWidth: number, tableWidth = containerWidth): WorkbenchLayout {
  const hiddenColumns: string[] = []
  if (tableWidth < 980) hiddenColumns.push('genre')
  if (tableWidth < 840) hiddenColumns.push('bpm')
  if (tableWidth < 720) hiddenColumns.push('state')
  return {
    inspector: containerWidth >= 1180 ? 'right' : 'below',
    navigation: containerWidth <= 720 ? 'chips' : 'tabs',
    hiddenColumns,
  }
}
