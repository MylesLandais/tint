# Anti-patterns

Generated interfaces drift toward the same defaults: decorative hierarchy, nested
cards, wasted space, meaningless metrics, excessive rounding. Each row below is a
**default prohibition**. An exception is allowed only with a functional reason
stated in the change, such as "immersive stage over video". "Looks modern" is not
a reason.

| Prohibited by default | Use instead |
|---|---|
| Gradient backgrounds | Neutral semantic surfaces (`bg`, `surface`, `panel`) |
| Glass and backdrop blur everywhere | Solid surfaces. Glass only over media in immersive mode ([style-guide.md](style-guide.md#surfaces)) |
| A card for every content block; cards inside cards | Sections, lists, tables and dividers. One surface step per nesting level |
| Large or arbitrary radii, pill buttons and tabs | The radius tokens. `radius-full` is for avatars and status dots only |
| Floating pill navigation | Structured navigation: sidebar, tabs, toolbar |
| Giant welcome banners and hero headings | A contextual page title at `font-size-xl` |
| Decorative uppercase eyebrows | A meaningful label, or nothing |
| Arbitrary colourful badges | Semantic status (`danger`, `warning`, `success`, `info`) paired with text or an icon |
| Meaningless dashboard statistics and decorative charts | Actionable operational information, or no chart |
| Excess whitespace on working surfaces | Intentional density. Size to the content and the task |
| Emoji as iconography | Lucide through `Icon` |
| Hover-only actions | Visible or keyboard-reachable controls, also exposed in the context menu |
| Gratuitous animation | Motion that explains a change, with a reduced-motion variant |
| Marketing copy inside the product | Short, domain-specific language ([brand/voice.md](brand/voice.md)) |
| Generic AI illustrations in empty states | A sentence that explains the state, plus the next action |
| Hardcoded mock data presented as real | Typed contracts and honest empty, loading and error states |
| Simulated progress, fake "agent is thinking" | Indicators bound to real work ([patterns.md](patterns.md#operational-state)) |
| A parallel design system (new `:root` palettes, local button styles) | Tint components and `--tint-*` tokens |
| Raw colours, literal `var()` fallbacks, literal z-index | Tokens. Tint tokens are always defined, so fallbacks hide mistakes |
| Turning a working tool into a landing page | Keep the task surface. Improve its hierarchy |

## Why fallbacks are on the list

`var(--tint-panel, #fff)` looks defensive, but it is not. Every Tint theme defines
every token, and `src/styles/themes.test.ts` enforces that. A fallback only
fires when the token name is misspelled or the stylesheet is missing, and then it
paints a light-theme colour into a dark theme instead of surfacing the bug.

## Enforcement

- **In Tint:** `npm run check` covers migration boundaries, names, types and
  lint. Components reference tokens with no fallback.
- **In consumers:** an incremental gate fails a change that *adds* raw colours,
  literal fallbacks or custom-property colour literals, and warns on literal
  z-index. Existing debt is counted, not blocked. Each consumer documents its own
  gate.
- **In review:** apply the rubric in [../eval/rubric.md](../eval/rubric.md). A
  parallel design system is a critical failure.
