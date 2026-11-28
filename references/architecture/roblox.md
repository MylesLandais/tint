# Research brief: Roblox scripting architecture

> **Status: not yet studied.** No source revision has been recorded. This brief
> lists the questions for M2. It does not adopt anything or imply a dependency.

- **Source:** <https://create.roblox.com/docs/scripting>
- **Why:** it shows a mature split between a programmable experience and the
  trusted engine that hosts it. That is the model for Nebula's bidirectional Lua
  extensions ([extensibility.md](../../docs/architecture/extensibility.md)).

## Questions

1. How do client and server scripts differ, and what does each side own?
2. What is the script lifecycle: load, run, yield, terminate? How is a runaway
   script contained?
3. How is state replicated, and which side is authoritative?
4. What do remote calls guarantee about validation, ordering, rate limits and
   trust in client input?
5. How are capabilities scoped, granted and revoked?
6. What carries over to a Lua 5.4 (mlua) host on the Gateway, and to a future
   client-side Lua host?

## Deliverable

A comparison table with Nebula's proposed authority model, a list of the host
APIs that already exist (from the consumer's inventory), and the gaps.
