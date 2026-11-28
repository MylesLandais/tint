// Which docs page documents each public package subpath. Shared by
// src/exports.test.ts (coverage) and scripts/component-index.mjs (index).

/** Subpaths documented on another package's page (subpath -> route slug). */
export const GROUPED_DOCS = {
  session: 'watch-together',
  'media-player': 'media', 'video-player': 'media', 'settings-popout': 'media',
  'workspace-grid': 'workspace', 'media-workspace': 'workspace',
  'scatter-plot': 'release-chart', 'audio-engine': 'dj',
  'audio-workspace': 'midnight-128', 'timeline': 'graph',
}

/** Subpaths with no page of their own (bindings and transports). */
export const DOC_EXEMPT = new Set(['svelte', 'client/svelte', 'auth-client', 'socket'])
