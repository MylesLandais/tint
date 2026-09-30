export type WorkspaceSplitMode = 'container' | 'always'
export type WorkspaceSplitDirection = 'horizontal' | 'vertical'
export type WorkspaceSplitPrimary = 'first' | 'second'

/** Static class strings let Tailwind see each container-aware layout variant. */
export function workspaceBodyColumns({ navigation, inspector, split }: {
  navigation: boolean
  inspector: boolean
  split: WorkspaceSplitMode
}): string | undefined {
  if (navigation && inspector) return split === 'always'
    ? 'grid-cols-[var(--workspace-navigation-width)_minmax(0,1fr)_var(--workspace-inspector-width)]'
    : '@4xl/workspace:grid-cols-[var(--workspace-navigation-width)_minmax(0,1fr)_var(--workspace-inspector-width)]'
  if (navigation) return split === 'always'
    ? 'grid-cols-[var(--workspace-navigation-width)_minmax(0,1fr)]'
    : '@4xl/workspace:grid-cols-[var(--workspace-navigation-width)_minmax(0,1fr)]'
  if (inspector) return split === 'always'
    ? 'grid-cols-[minmax(0,1fr)_var(--workspace-inspector-width)]'
    : '@4xl/workspace:grid-cols-[minmax(0,1fr)_var(--workspace-inspector-width)]'
  return undefined
}

export function cssLength(value: string | number): string {
  return typeof value === 'number' ? `${value}px` : value
}

export function clampSplitSize(size: number, minSize: number, maxSize: number): number {
  return Math.max(minSize, Math.min(maxSize, size))
}

export function splitTracks(size: number, primary: WorkspaceSplitPrimary): string {
  return primary === 'first' ? `${size}px 5px minmax(0, 1fr)` : `minmax(0, 1fr) 5px ${size}px`
}

export function pointerSplitSize(startSize: number, delta: number, primary: WorkspaceSplitPrimary, minSize: number, maxSize: number): number {
  return clampSplitSize(startSize + delta * (primary === 'first' ? 1 : -1), minSize, maxSize)
}

export function keyboardSplitSize(current: number, key: string, shift: boolean, direction: WorkspaceSplitDirection, primary: WorkspaceSplitPrimary, minSize: number, maxSize: number): number | null {
  if (key === 'Home') return minSize
  if (key === 'End') return maxSize
  const forward = direction === 'horizontal' ? 'ArrowRight' : 'ArrowDown'
  const backward = direction === 'horizontal' ? 'ArrowLeft' : 'ArrowUp'
  if (key !== forward && key !== backward) return null
  const step = (shift ? 50 : 10) * (key === forward ? 1 : -1)
  return pointerSplitSize(current, step, primary, minSize, maxSize)
}

export function mobileNavigationForWidth(width: number, breakpoint = 768): boolean {
  return width < breakpoint
}
