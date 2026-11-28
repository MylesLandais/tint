# Behaviours

> **Status: inventory plan (M2).** This page says what will be studied and
> recorded. It makes no adoption decision.

A *behaviour* is interaction logic that is independent of how something is
rendered. Examples are selection, roving focus, typeahead, disclosure, drag with
a keyboard alternative, virtual scrolling, undo history and optimistic commands
with rollback. Tint already puts this logic in `src/core`, so it can be tested
without a DOM.

## Known today

| Behaviour | Where | Tested by |
|---|---|---|
| Dataset editing, field values, history | `src/core/table` | `src/core/table/*.test.ts` |
| Feed presentation, split panes, narration | `src/core/feed` | `src/svelte/components/feed/Feed.test.ts` |
| Operations: submit, report, cancel | `src/client/memoryOperations.ts`, `OperationAdapter` | `src/client/client.test.ts` |
| Workspace session discovery and stream URLs | `src/core/framebuffer`, `src/core/compatibility/framebuffer.ts` | `src/core/compatibility/workspace.test.ts` |

## M2 deliverable

For each behaviour, record:

1. The current Tint module and its tests.
2. The matching pattern in the [Vercel UI SDK](../../references/architecture/vercel-ui.md),
   checked at a recorded source revision.
3. Accessibility semantics: the APG pattern and its keyboard map.
4. Svelte 5 compatibility: runes or stores, SSR, snippets.
5. A recommendation (**adopt**, **wrap**, **reimplement** or **reject**) with
   the reason.

No dependency is added from this page alone. Adopting one is a separate,
reviewed change.
