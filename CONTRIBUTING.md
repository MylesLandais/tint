# Contributing to Tint

Applies to people and to agents. The design rules are in
[instructions.md](instructions.md) and [docs/](docs/style-guide.md). This page
covers how changes land.

## Where changes land

Tint is developed here, upstream, and consumers pin a commit. Never leave an
edit uncommitted in a consumer's vendored checkout. Land it here, then re-pin.

## What kind of change it is

| Change | Process |
|---|---|
| Component behaviour or visuals | A normal PR. Update its docs page and run `npm run docs:components` |
| A new token, or a token value change | Update `src/styles/contract.css` and **all** themes, plus `src/styles/themes.test.ts` contrast pairs where text is involved. State why in the PR |
| Terminology ([docs/vocabulary.md](docs/vocabulary.md)) | A contract change. The ontology registry is the source of truth, so propose it there first. Renames affect search, APIs, permissions and imported data |
| Interaction pattern ([docs/patterns.md](docs/patterns.md)) | A PR with the affected components listed |
| Philosophy or brand | Discussion first. These change rarely |

## Adding a component

1. **Check [components.md](components.md) first.** Extend an existing
   component when the need is general.
2. **Logic** goes in `src/core/<area>/` with tests (no DOM, no framework).
   **Presentation** goes in `src/svelte/components/<area>/`, exported from that
   area's `index.ts`.
3. **Exports.** Add a `package.json` `exports` subpath and re-export the
   components from `src/svelte/index.ts`. `src/exports.test.ts` enforces this.
4. **Docs page.** Add a live page and register it in
   `src/docs/svelte/routes.ts`. If it shares another page, add it to
   `scripts/component-docs-map.mjs`. Props tables are checked by
   `src/docs/svelte/propsTable.test.ts`.
5. **Index.** Run `npm run docs:components`. `src/componentIndex.test.ts` fails
   when `components.md` is stale.
6. **Graph.** If cross-component imports changed, run
   `python3 scripts/gen-docs-graph.py`.

### Spec sections for each component

The docs page (or a `<name>.spec.md` beside the component) covers:

| Section | Content |
|---|---|
| Overview | What it does, and its primary task |
| Anatomy | Its parts |
| Variants | Sizes, states, densities |
| API | Typed props, snippets, callbacks |
| Usage and alternatives | When to use it, and when another component is better |
| Accessibility | Keyboard map, semantics, focus behaviour, the APG pattern |
| Composition | Compatible components and patterns |
| Agent capability | See below |
| Verification | Tests, known limitations, maturity |

### Agent capability

A short, machine-readable description of what an agent may supply: the typed
spec and its allowed values. Styling never appears in it. This becomes the
presentation registry in M5 ([docs/architecture/extensibility.md](docs/architecture/extensibility.md)).

## Definition of done

A change is done when it is:

- **Functionally correct**, with tests for its `src/core` logic.
- **Visually coherent** with the adjacent components, using tokens only.
- **Accessible.** Keyboard-complete, named, with visible focus, and no suppressed
  Svelte a11y warnings.
- **Responsive** at narrow and wide widths, in light and dark themes.
- **Honest.** It renders real states and makes no simulated activity.
- **Documented.** Docs page, `components.md` and vocabulary all agree.
- **Verified.** `npm run check` passes, and the PR states what was checked in a
  browser and what was not.

## Checks

```sh
npm run check            # names, migration, tsc, svelte-check, lint, tests
npm run docs:components  # regenerate components.md
npm run check:doc-links  # documentation links (also runs inside npm test)
```

Documentation links must resolve inside this repository. Other projects are
linked by absolute `https://` URL, so Tint stays understandable when cloned on
its own.
