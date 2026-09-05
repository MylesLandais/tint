import { useState } from "react";
import { Home, Search, Settings } from "lucide-react";
import { Icon } from "../components/icon";
import {
  AppShell,
  WorkspaceTabs,
  WorkspaceSplit,
  MetadataPanel,
  DetailSheet,
  FilterBar,
  CommandPalette,
  EmptyState,
  NavRail,
  StatusBar,
  TopNav,
  WorkspaceHeader,
  type CommandPaletteItem,
  type NavGroup,
  type StatusItem,
} from "../components/shell";
import {
  DocsDemo,
  DocsFooter,
  DocsPage,
  DocsSection,
} from "./components/DocsPage";

const commands: CommandPaletteItem[] = [
  {
    id: "search",
    label: "Search workspace",
    description: "Find files and projects",
    shortcut: "⌘F",
  },
  { id: "settings", label: "Open settings", keywords: ["preferences"] },
];
const groups: NavGroup[] = [
  {
    id: "workspace",
    label: "Workspace",
    items: [
      { id: "home", label: "Home", href: "#home", icon: <Icon icon={Home} /> },
      {
        id: "settings",
        label: "Settings",
        href: "#settings",
        icon: <Icon icon={Settings} />,
      },
    ],
  },
];
const statusItems: StatusItem[] = [
  { id: "saved", label: "All changes saved", tone: "success" },
];
const example = `import { AppShell, NavRail, WorkspaceHeader, StatusBar } from 'tint/shell'

<AppShell
  nav={<NavRail groups={groups} activeId="home" onNavigate={navigate} />}
  header={<WorkspaceHeader breadcrumbs={breadcrumbs} title="Workspace" />}
  aside={<Inspector />}
  status={<StatusBar items={statusItems} connection={{ state: 'connected', label: 'Connected' }} />}
>
  <YourWorkspace />
</AppShell>`;
const topExample = `import { AppShell, TopNav, WorkspaceHeader, StatusBar } from 'tint/shell'

<AppShell
  navPosition="top"
  nav={<TopNav brand={<a href="/">Acme</a>} groups={groups} activeId="home" onNavigate={navigate} actions={<UserMenu />} />}
  header={<WorkspaceHeader breadcrumbs={breadcrumbs} title="Workspace" />}
  status={<StatusBar items={statusItems} connection={{ state: 'connected', label: 'Connected' }} />}
>
  <YourWorkspace />
</AppShell>`;

export function ShellDoc() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [tab, setTab] = useState("info"),
    [detailOpen, setDetailOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [toolsWidth, setToolsWidth] = useState(200);
  return (
    <DocsPage
      route="components/shell"
      title="Application shell"
      intro="Controlled, composable workspace chrome with responsive container-query tiers, grouped navigation, headers, commands, status, and generic states."
    >
      <DocsSection id="preview" title="Workspace shell">
        <DocsDemo code={example} className="[&>div:first-child]:p-0">
          <div className="h-[28rem] overflow-hidden rounded-lg">
            <AppShell
              nav={
                <NavRail
                  aria-label="Demo navigation"
                  groups={groups}
                  activeId="home"
                />
              }
              header={
                <WorkspaceHeader
                  breadcrumbs={[
                    { label: "Projects", href: "#projects" },
                    { label: "Tint" },
                  ]}
                  title="Tint workspace"
                  subtitle="Phase 1 shell"
                  actions={
                    <button
                      type="button"
                      onClick={() => setPaletteOpen(true)}
                      aria-label="Open commands"
                    >
                      <Icon icon={Search} />
                    </button>
                  }
                />
              }
              aside={
                <div className="p-4 text-sm text-tint-muted">Inspector</div>
              }
              status={
                <StatusBar
                  items={statusItems}
                  connection={{ state: "connected", label: "Connected" }}
                />
              }
            >
              <EmptyState
                title="Choose a project"
                description="The host owns data and routing."
              />
            </AppShell>
            <CommandPalette
              open={paletteOpen}
              onOpenChange={setPaletteOpen}
              query={query}
              onQueryChange={setQuery}
              items={commands}
            />
          </div>
        </DocsDemo>
      </DocsSection>
      <DocsSection
        id="top-nav"
        title="Top navigation"
        description='TopNav renders the same NavGroup[] data as a horizontal bar, with brand and action slots and a More overflow menu via maxVisibleItems. Pair it with AppShell navPosition="top" to place the nav above the header instead of the left rail.'
      >
        <DocsDemo code={topExample} className="[&>div:first-child]:p-0">
          <div className="h-[24rem] overflow-hidden rounded-lg">
            <AppShell
              navPosition="top"
              nav={
                <TopNav
                  aria-label="Demo top navigation"
                  brand={<span className="text-sm font-semibold">Tint</span>}
                  groups={groups}
                  activeId="home"
                  actions={
                    <span className="text-xs text-tint-muted">user@acme</span>
                  }
                />
              }
              header={
                <WorkspaceHeader
                  breadcrumbs={[
                    { label: "Projects", href: "#projects" },
                    { label: "Tint" },
                  ]}
                  title="Tint workspace"
                />
              }
              status={
                <StatusBar
                  items={statusItems}
                  connection={{ state: "connected", label: "Connected" }}
                />
              }
            >
              <EmptyState
                title="Choose a project"
                description="The host owns data and routing."
              />
            </AppShell>
          </div>
        </DocsDemo>
      </DocsSection>
      <DocsSection
        id="usage"
        title="Usage"
        description="Every stateful seam is controlled. Tint performs no routing or fetching."
      >
        <pre className="overflow-auto rounded-xl bg-tint-surface p-4 text-sm">
          {example}
        </pre>
      </DocsSection>
      <DocsSection
        id="api"
        title="API"
        description="AppShell exposes nav, header, children, aside, and status slots, plus navPosition ('rail' default, or 'top'). NavRail and TopNav consume NavGroup[] and emit onNavigate(id, href); TopNav adds brand, actions, overflowLabel, and maxVisibleItems. WorkspaceHeader supports breadcrumbs, title, subtitle, and actions. StatusItem tone reuses BadgeTone; ErrorBanner exposes detail, actions, dismissal, and diagnostics."
      >
        <p className="text-sm text-tint-muted">
          Use <code>data-tint-*</code> attributes as stable host styling and
          test seams.
        </p>
      </DocsSection>
      <DocsSection id="workspace" title="Workspace content">
        <DocsDemo
          code={
            "import { WorkspaceTabs, MetadataPanel, FilterBar, DetailSheet } from 'tint/shell'"
          }
        >
          <FilterBar
            actions={
              <button onClick={() => setDetailOpen(true)}>Inspect</button>
            }
          >
            <label>
              Filter <input placeholder="Type a label" />
            </label>
          </FilterBar>
          <WorkspaceTabs
            label="Example workspace"
            value={tab}
            onChange={setTab}
            tabs={[
              {
                id: "info",
                label: "Information",
                content: (
                  <MetadataPanel
                    title="Example item"
                    eyebrow="METADATA"
                    description="Display fields supplied by the host."
                    fields={[{ label: "Year", value: 2026 }]}
                  />
                ),
              },
              {
                id: "notes",
                label: "Notes",
                content: (
                  <textarea
                    aria-label="Notes"
                    defaultValue="Draft state survives tab switches"
                  />
                ),
              },
            ]}
          />
          <DetailSheet
            title="Details"
            open={detailOpen}
            onOpenChange={setDetailOpen}
          >
            The host owns selection and content.
          </DetailSheet>
        </DocsDemo>
        <p>
          WorkspaceTabs uses arrow, Home and End keys. DetailSheet shares
          Dialog’s focus and Escape contract. ResponsiveNavRail takes mobileOpen
          and onMobileOpenChange, showing a navigation drawer below 768px.
        </p>
      </DocsSection>
      <DocsSection id="split-layout" title="Resizable workspace layout">
        <DocsDemo code={`import { WorkspaceSplit } from 'tint/shell'

<WorkspaceSplit size={toolsWidth} onSizeChange={setToolsWidth}
  minSize={120} maxSize={320} label="Resize tools"
  first={<Tools />} second={<Canvas />} />`}>
          <WorkspaceSplit size={toolsWidth} onSizeChange={setToolsWidth}
            minSize={120} maxSize={320} label="Resize tools" style={{height: 220}}
            first={<div className="bg-tint-panel p-4">Domain tools</div>}
            second={<div className="bg-tint-surface p-4">Workspace canvas</div>} />
        </DocsDemo>
        <p>
          Nest WorkspaceSplit to compose sidebars, inspectors and bottom docks.
          The host owns sizes, workspace identity, storage and domain content.
          Set direction="vertical" for stacked panes and primary="second" for
          a fixed bottom or right pane. Size, minSize and maxSize are pixels;
          give the container enough room for its fixed pane and a 5px separator.
          Each pane scrolls when its content exceeds the available space.
        </p>
        <p>
          Drag a separator or focus it and use the arrow keys (10px), Shift with
          arrows (50px), Home (minimum), or End (maximum). Layout restoration
          updates controlled sizes without remounting pane content.
        </p>
      </DocsSection>
      <DocsFooter />
    </DocsPage>
  );
}
