/**
 * Module IDs that `index.js` inlined, and the self-reference the upstream tree
 * uses to import from its own package entry.
 *
 * These ambient declarations exist only so the vendored `.d.ts` tree resolves.
 * None of them is a runtime dependency: esbuild bundled `@xyflow/system`,
 * `zustand`, `classcat` and the d3 interaction packages into `index.js`, so the
 * specifiers survive in the declarations but not in the code.
 *
 * The alternative — hand-writing a "focused" subset of the upstream types — is
 * what this replaces. That file declared `Node` with `width`/`height` and no
 * `measured`, which xyflow v12 had already moved; the adapter read `measured`,
 * and the build broke on the first PR that used it. A hand-maintained shim over
 * a bundle it has no mechanical relationship to drifts silently and is only
 * discovered by the build failing.
 */

declare module '@xyflow/react' {
  export * from './index'
}

declare module '@xyflow/system' {
  export * from './system/index'
}

declare module 'zustand' {
  export type StoreApi<T> = {
    getState: () => T
    setState: (partial: Partial<T> | ((state: T) => Partial<T>), replace?: boolean) => void
    subscribe: (listener: (state: T, previous: T) => void) => () => void
  }
}

declare module 'd3-selection' {
  export type Selection<A = unknown, B = unknown, C = unknown, D = unknown> = unknown
  export type Transition<A = unknown, B = unknown, C = unknown, D = unknown> = unknown
}

declare module 'd3-zoom' {
  export type D3ZoomEvent<A = unknown, B = unknown> = { transform: unknown; sourceEvent: unknown }
  export type ZoomBehavior<A = unknown, B = unknown> = unknown
  export type ZoomTransform = { x: number; y: number; k: number }
}

declare module 'd3-drag' {
  export type D3DragEvent<A = unknown, B = unknown, C = unknown> = { sourceEvent: unknown }
  export type DragBehavior<A = unknown, B = unknown, C = unknown> = unknown
  export type SubjectPosition = { x: number; y: number }
}

/** Used by one upstream prop type on `ControlButton`; never rendered by tint. */
declare module '@radix-ui/react-icons' {
  export type IconProps = Record<string, unknown>
}
