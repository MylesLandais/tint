# src/core

Framework-neutral TypeScript. React and Svelte bindings both import from here.

Rules (enforced by `architecture.test.ts`):

- No imports of `react`, `react-dom`, `svelte`, `.tsx` or `.svelte` files.
- No DOM or browser globals at module scope. A browser-specific submodule must say so in its filename (for example `browserPlayback.ts`).

Belongs here: contracts, state machines, reducers, formatters, filtering and selection models, parsers, commands, validation, transport contracts.

Existing pure `.ts` modules stay where they are until the component that owns them is migrated; move them here then, not before.
