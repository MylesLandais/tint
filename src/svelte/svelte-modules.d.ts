// Lets plain `tsc` (and a host's TypeScript program) resolve `.svelte` imports.
// svelte-check ignores this and reads the real component types.
declare module '*.svelte' {
  import type { Component } from 'svelte'
  // oxlint-disable-next-line no-explicit-any
  const component: Component<any>
  export default component
}
