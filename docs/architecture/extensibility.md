# Extensibility: presentation contracts and Lua

> **Status: proposed boundaries (M5 and M6).** Nothing here is implemented in
> Tint. The aim is to fix the boundaries now, so components and contracts do not
> have to be rebuilt later. None of this describes an existing Lua runtime
> capability.

## Presentation contracts (M5)

Agents and extensions **compose registered components through typed
contracts**. They choose a component and supply validated data. Tint controls
how it looks.

```ts
type InspectorSection = 'properties' | 'relationships' | 'provenance' | 'activity'

interface EntityInspectorSpec {
  component: 'EntityInspector'
  entityId: string
  sections: InspectorSection[]
  density?: 'compact' | 'comfortable'
}
```

Colours, spacing, markup and component libraries are outside the contract, so
an agent cannot express them. The registry is generated from
[components.md](../../components.md) plus a per-component capability section
([CONTRIBUTING.md](../../CONTRIBUTING.md#agent-capability)). Presentation
capabilities (`ConversationView`, `FeedLayout`) are kept separate from domain
concepts (Thread, Feed). The ontology never needs a revision when Tint adds a new
way to render a Thread.

## Lua extensions (M6)

The lesson we take from Roblox is not its syntax. It is the separation between
a programmable experience and the trusted engine that hosts it. An extension
never needs to know how Svelte builds a dropdown or how the server persists an
asset. It uses stable host capabilities.

### Authority model

| Capability | Client Lua | Server (Gateway) Lua |
|---|---|---|
| Compose registered UI | Yes | Declarative requests only |
| Read the current selection | Scoped | Through explicit context |
| Subscribe to events | Scoped | Scoped |
| Hold transient UI state | Yes | No direct ownership |
| Run durable workflows | Request only | Authorized |
| Access persistent resources | Through the server | Authorized |
| Change permissions | No | Only through trusted policy services |
| Touch the DOM | No | No |
| Arbitrary network access | Denied by default | Denied by default |

Tint owns rendering, interaction and local presentation state. The server owns
authorization, durable execution and persistent domain state. Every call crosses
a validated, capability-scoped host API.

### Conformance scenarios (future G5)

1. A client-only command palette extension.
2. A custom asset inspector composed from Tint components.
3. A client command that invokes a server Lua operation.
4. A server event that updates an open inspector.
5. An extension that requests a capability it was not granted, and is refused.
6. A runaway script that is terminated without crashing the host.
7. An extension that survives a transport disconnect and reconnect.
8. Revoking an extension while its subscriptions are still active.
