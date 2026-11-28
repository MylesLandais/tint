# Design philosophy

What we value in software. This page changes rarely. Concrete rules live in the
[style guide](style-guide.md), the [patterns](patterns.md) and the
[accessibility guidelines](accessibility.md).

**Ownership.** Nebula defines the product. Tint implements the experience. The
Gateway exposes capabilities. The ontology defines meaning. Lua makes the system
extensible. Each one owns its part, and no layer quietly does another layer's job.

## Principles

1. **The task comes first.** Every surface has one primary purpose. Navigation,
   actions and metadata are ranked by how much they serve that purpose. When
   everything has the same weight, nothing is prioritized.
2. **Tell the truth about state.** Show what the system is actually doing. Never
   show fake progress, fake activity or fake success. An honest empty state beats
   a convincing mock.
3. **One thing, many views.** An entity keeps its identity, relationships and
   permissions whether it is shown as a list, table, gallery, timeline or canvas.
   Presentation is a choice, never a new identity.
4. **Calm density.** Operational screens are dense and structured. Reading
   screens are calm and comfortable. Neither wastes space or decorates.
5. **Everyone participates.** Keyboard, touch, screen reader, zoom and reduced
   motion are first-class ways in, not afterthoughts.
6. **Humans and agents, clearly apart.** People can always see who or what made
   something, what an agent is doing, and where their approval is needed.
7. **Constrain, don't exhort.** Good design should be the easy path. Tokens,
   components and checks make the wrong choice hard, so we rely less on asking
   for the right one.
8. **Built to last.** Choose what will still look reasonable in five years over
   what is fashionable this quarter.
