# Gateway contracts and transports

> **Status: design candidate.** What exists is listed as existing. The
> live/mock/replay transport is a proposal for M3. Consumers keep their own
> verified inventory of how their frontend talks to their server. Nebula's is
> published in its repository
> ([frontend-gateway-contract-inventory.md](https://git.nebula-1.com/warbee/workspace/src/branch/dev/docs/specs/frontend-gateway-contract-inventory.md)).

## What Tint owns, and what it does not

| Concern | Owner |
|---|---|
| Rendering, interaction, local presentation state (open panels, scroll, draft text) | Tint |
| Presentation contracts: the typed documents and props components accept | Tint, with shared conformance fixtures |
| Domain state, authorization, durable execution, persistence | The host's server (in Nebula, the Gateway) |
| Service contracts: wire schemas, events, cursors | The server's contract authority (in Nebula, `lib/protocol`, generated as `@nebula/contracts-generated`) |

## The existing seam: `TintClient` adapters

`@nebula/tint/client` exposes `TintClient`, whose capabilities are provided by
adapters:
- `auth`
- `navigation`
- `realtime`
- `uploads`
- `storage`
- `playback`
- `operations`

There are two existing adapters:

- `createFetchRequestAdapter`, which sends requests over HTTP.
- `createMemoryOperationAdapter`, an in-memory operation runner with `report`
  and cancellation that already backs the docs demos.

Errors are normalized to typed problems: `TintAuthorizationError`,
`TintConflictError`, `TintCapabilityError`, `TintTransportError` and
`TintAbortError`. This is where alternative transports plug in. Components never
call `fetch` themselves.

## Proposed: one interaction, three transports (M3)

The same component and the same user interaction should run against any of:

| Transport | Source of truth | Use |
|---|---|---|
| Live | The real server | Production, live acceptance |
| Mock | Deterministic, contract-conformant fixtures that model *behaviour* | Component development, browser tests, accessibility evaluation, agent implementation |
| Replay | Recorded event logs from a live session | Regression, reproducing reported issues |

Constraints on this proposal:

- **No mock-only domain model.** Fixtures are built from the server's
  contract types and validated against them, never hand-shaped to make a
  component look good.
- **Mocks model behaviour, not just records:**

  | Category | What the mock must be able to represent |
  |---|---|
  | Collections | Empty, sparse, large, paginated, filtered |
  | Agent execution | Queued, running, streaming, cancelled, failed |
  | Permissions | Read-only, denied, approval required |
  | Connectivity | Offline, reconnecting, stale, interrupted |
  | Concurrency | Conflicting edits, duplicate and out-of-order events |
  | Extensions | Loaded, suspended, rejected, crashed, revoked |
  | Compatibility | Unknown schema or component versions |

- **Keep existing resumption contracts.** Cursor and sequence semantics, such as
  Nebula's channel timeline `cursor` and `event_seq`, are reproduced exactly by
  mock and replay, including gaps that force a reload.
- **Proposed entities stay flagged.** Fixtures for proposed entities (see
  [vocabulary.md](../vocabulary.md)) are marked experimental.
- **Mocks never pretend to be live.** The interface says when it is running on
  mock or replay data.
