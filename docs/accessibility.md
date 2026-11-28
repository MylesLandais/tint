# Accessibility guidelines

Accessibility is a property of the system, not ARIA added at the end. The minimum
is **WCAG 2.2 Level AA**.

## Baseline

| Requirement | Standard | WCAG |
|---|---|---|
| Normal text contrast | At least 4.5:1 | 1.4.3 |
| Large text contrast (24px, or 18.66px bold) | At least 3:1 | 1.4.3 |
| Meaningful non-text contrast (focus rings, control boundaries, state cues) | At least 3:1 against adjacent colours | 1.4.11 |
| Pointer target | At least 24×24 CSS px, subject to the spacing exception | 2.5.8 |
| Touch target (Nebula preference) | 44×44 CSS px under `pointer: coarse` | 2.5.5 (AAA, adopted) |
| Text resize | Usable at 200% | 1.4.4 |
| Reflow | No two-dimensional scrolling at a 320 CSS px width, except for genuinely 2D content | 1.4.10 |
| Keyboard | Every function is operable, with no trap | 2.1.1, 2.1.2 |
| Focus | Visible, and not hidden by sticky headers, docks or toasts | 2.4.7, 2.4.11 |
| Motion | Honours `prefers-reduced-motion`; nothing flashes more than 3 times a second | 2.3.1, 2.3.3 |
| Dragging | Every drag has a single-pointer or keyboard alternative | 2.5.7 |
| Authentication | No cognitive test without an alternative | 3.3.8 |
| Status messages | Announced without moving focus | 4.1.3 |

## Rules

- **Native first.** Use `<button>`, `<a href>`, `<input>`, `<select>` and
  `<dialog>`, or the Tint components built on them. ARIA supplements semantics; it
  does not replace them. For composite widgets (tree, grid, combobox, tabs,
  menu), follow the [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/).
- **Names.** Every interactive element has an accessible name. An icon-only
  button gets `aria-label` or visually hidden text.
- **Structure.** One `h1` per view, with headings in order. Use landmarks
  (`header`, `nav`, `main`, `aside`) for the shell regions.
- **Colour.** Never communicate state through colour alone. Pair it with text, an
  icon or a shape.
- **Hover.** Nothing essential is available only on hover. Every hover-revealed
  action is also reachable by focus and listed in the context menu.
- **Dialogs.** Trap focus while a dialog is open, close it with Escape, and
  return focus to the control that opened it. Tint's `Dialog` does this.
- **Live updates.** New feed items, job completions and errors are announced
  through polite or assertive live regions as appropriate. Never move focus to
  announce something.
- **Zoom.** Never disable browser zoom or set `maximum-scale`.
- **Svelte warnings.** Do not suppress Svelte's a11y compiler warnings (`a11y_*`)
  unless a comment gives the reason and a test proves the behaviour.
- **Virtualized lists.** Keep `aria-rowcount`, `aria-rowindex` and keyboard
  navigation correct when rows are not in the DOM.

## What automation covers, and what it does not

| Check | Catches | Misses |
|---|---|---|
| `svelte-check` a11y warnings | Missing labels, invalid roles, click without key handlers | Runtime behaviour |
| axe-core in Playwright | Roughly a third of WCAG failures: contrast on solid backgrounds, names, roles, landmarks, duplicate ids | Focus order, meaning, keyboard traps in custom widgets, contrast over images and glass |
| Measured contrast (the gateway's `contrast.spec.ts` pattern) | Contrast over translucent and image backgrounds, by sampling | Text not covered by the selectors under test |
| Manual keyboard pass | Order, traps, visibility of focus | Screen-reader semantics |
| Screen-reader pass (NVDA, VoiceOver, Orca) | Names, announcements, reading order | Nothing from this list |

Passing automated checks is not compliance. A report claims only what was
actually run. Untested areas are listed as unverified, never as passed.

## References

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [Apple Human Interface Guidelines: Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- [Svelte accessibility warnings](https://svelte.dev/docs/svelte/compiler-warnings)
- [Inclusive Components](https://inclusive-components.design/)
- [Playwright accessibility testing](https://playwright.dev/docs/accessibility-testing)
