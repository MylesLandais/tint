# Automation workspace foundations

Gateway owns authentication, route navigation, the application header, notification
aggregation, retained Maya conversations, dock placement, diagnostics and status.
A workspace supplies scoped content and runtime capabilities. Tint owns controlled
components, semantic tokens, accessibility and presentation mechanics. Runtime
adapters own process identity, transport, input leases and command receipts.

Use `AppShell` once around the application. Compose workspace bodies with the
existing `WorkspaceLayout` and `WorkspaceSplit`; do not add a second application
header, rail, notification service or status owner for a game route.

`WorkspaceResizeHandle` exposes the same controlled sizing used by
`WorkspaceSplit`. It supports pointer capture, cancel/lost capture, Arrow keys,
Shift acceleration, Home/End and a movable ARIA separator. The caller supplies the
axis, controlled pane, value, bounds and callback; persistence belongs to the host.

`workspaceDockMode` selects closed/overlay/column from measured available space,
explicit pin intent, panel width and optional media aspect/height requirements.
Measure the entire allocation before subtracting the panel. Measuring an already
shrunk primary column creates a dock/undock feedback loop. Changing placement must
not change session identity or recreate a framebuffer, editor or terminal.

Controls consume `--tint-control-sm/md/lg`: 32/44/48px. Buttons use the same scale
as form controls and `--tint-radius-md` (4px). Focus uses `--tint-focus`, not a
feature palette. Standard interface text is 14px; chat prose is 16px and code or
terminal text starts at 14px monospace. Font size remains user-adjustable.

Consume semantic `--tint-*` surfaces, fields, text, selection, focus, operational
status and code/media roles. Features must not override the theme with a local
palette. Strong control boundaries and code comments in the default theme have
been adjusted for contrast. Validate rendered states in both color schemes;
static token ratios alone do not establish accessible controls.

Selection, automation, connection, video, input ownership, debugger stop, source
revision and evidence confidence/verification are separate state dimensions.
Expose text as well as color. A warning does not imply that an action is required.
Use manual tab activation when switching has latency; a grid of simultaneously
visible sessions is a collection of labeled selection controls, not multiple
panels pretending to be one single-select tablist.

Frame layers must identify their producing frame or versioned world snapshot.
Drawing, hit testing and input share a forward/inverse transform; letterbox clicks
are rejected. Preview/frozen/hidden demand is explicit and does not authorize
pausing a game. Hooks, Lua execution, seekable replay and traces are offered only
when their adapter supplies that capability and identity.

Validation: `npm run check`, `npm run build`, and browser checks in the consuming
application. The shell unit tests cover controlled resize/focus and aspect-aware
docking. Consumers must verify 320px reflow, 200% zoom, light/dark themes, retained
resources and captured-target operations with their real adapters.

Source and terminal presentation default to 14px monospace. CodeEditor consumes
`--tint-code-font-size`; terminal options accept a user-selected font size.
`resolveTerminalTheme` and `observeTerminalTheme` are public bridges for an
existing emulator adapter, so adopting Tint colors need not replace its transport
or emulator.

`Framebuffer` accepts selected/preview/hidden/frozen/historical demand. Demand
changes retain its socket and presenter. Preview presentation and PNG producer
acknowledgements are capped at five per second; hidden/frozen/historical viewers
send the existing paused setting and skip decoding/drawing. RGBA peers without
that settings contract still receive frames, which the client discards before
presentation. Data attributes report received and presented counts separately.
This is viewer policy, not game execution or input ownership. Capture evidence
against an explicit source frame before freezing or annotating it.
