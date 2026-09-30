<script lang="ts">
  import { setContext, tick } from 'svelte'
  import { ThemePicker, ThemeToggle, colorSchemeStore, themeNameStore, type ThemeOption } from '../../svelte/components/theme'
  import { SVELTE_DOC_GROUPS, SVELTE_DOC_PAGES, findSvelteDoc } from './routes'
  import { DOC_ROUTE_PATHS_CONTEXT, pathFromHash } from './routing'

  setContext(DOC_ROUTE_PATHS_CONTEXT, new Set(SVELTE_DOC_PAGES.map((page) => page.path)))

  const palettes: readonly ThemeOption[] = [
    { value: 'tint', label: 'Tint' }, { value: 'solarized', label: 'solarized' },
    { value: 'gruvbox', label: 'gruvbox' }, { value: 'latte', label: 'latte' },
    { value: 'frappe', label: 'frappe' }, { value: 'macchiato', label: 'macchiato' },
    { value: 'mocha', label: 'mocha' },
  ]

  let path = $state(typeof window === 'undefined' ? '' : pathFromHash(window.location.hash))
  let search = $state('')
  let navOpen = $state(false)
  let navToggle = $state<HTMLButtonElement>()
  let searchInput = $state<HTMLInputElement>()
  let page = $derived(findSvelteDoc(path))
  let filtered = $derived(SVELTE_DOC_PAGES.filter((item) => `${item.label} ${item.description}`.toLowerCase().includes(search.toLowerCase())))

  $effect(() => {
    document.title = page ? `${page.label} — Tint Documentation` : 'Tint Documentation'
  })

  function routeChanged() {
    path = pathFromHash(window.location.hash)
    navOpen = false
    window.scrollTo({ top: 0, behavior: 'instant' })
    void tick().then(() => document.querySelector<HTMLElement>('main h1')?.focus({ preventScroll: true }))
  }

  function keydown(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault()
      if (window.matchMedia('(max-width: 850px)').matches) navOpen = true
      void tick().then(() => searchInput?.focus())
    }
    if (event.key === 'Escape' && document.activeElement === searchInput) {
      search = ''
      if (navOpen) {
        navOpen = false
        navToggle?.focus()
      } else searchInput?.blur()
    } else if (event.key === 'Escape' && navOpen) {
      navOpen = false
      navToggle?.focus()
    }
  }

  function jumpTo(section: string) {
    const target = document.getElementById(section)
    target?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
    target?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true })
  }
</script>

<svelte:window onhashchange={routeChanged} onkeydown={keydown} />

<div class="docs">
  <header class="topbar">
    <button bind:this={navToggle} class="nav-toggle" type="button" aria-label="Toggle documentation navigation" aria-expanded={navOpen} aria-controls="docs-navigation" onclick={() => navOpen = !navOpen}>☰</button>
    <a class="brand" href="#/"><span class="brand-mark" aria-hidden="true">t</span><span>tint <span class="muted">/ docs</span></span></a>
    <div class="header-actions">
      <a href="/design-lab.html">Design Lab</a>
      <div class="theme-control"><span>Theme</span><ThemePicker value={$themeNameStore} onChange={themeNameStore.set} themes={palettes} /></div>
      <div class="theme-control"><span>Scheme</span><ThemeToggle value={$colorSchemeStore.preference} onChange={colorSchemeStore.set} /></div>
    </div>
  </header>

  <div class="body">
    <aside id="docs-navigation" class:open={navOpen} class="sidebar">
      <label class="search-label" for="docs-search">Search components <kbd>⌘K</kbd></label>
      <input id="docs-search" type="search" placeholder="Search…" bind:value={search} bind:this={searchInput} />
      <nav aria-label="Component documentation">
        <a href="#/" aria-current={!page ? 'page' : undefined} onclick={() => navOpen = false}>Overview</a>
        {#each SVELTE_DOC_GROUPS as group}
          <p class="group-label">{group}</p>
          {#each filtered.filter((item) => item.group === group) as item (item.path)}
            <a href={`#/${item.path}`} aria-current={item.path === page?.path ? 'page' : undefined} onclick={() => navOpen = false}>{item.label}</a>
          {/each}
        {/each}
      </nav>
    </aside>

    <main id="main">
      {#if page}
        {@const Page = page.component}
        <Page />
      {:else}
        <div class="overview">
          <p class="eyebrow">Tint documentation</p>
          <h1 tabindex="-1">Tint components</h1>
          <p>Explore Tint's Svelte components. Every page includes a live preview, a usage example, the public API, and accessibility notes.</p>
          <a class="lab-link" href="/design-lab.html">Open the Design Lab →</a>
          <div class="cards">
            {#each SVELTE_DOC_PAGES as item (item.path)}
              <a href={`#/${item.path}`}><strong>{item.label}</strong><span>{item.description}</span></a>
            {/each}
          </div>
        </div>
      {/if}
    </main>

    {#if page}
      <aside class="toc" aria-label="On this page">
        <p>On this page</p>
        {#each ['preview', 'usage', 'api', 'accessibility'] as section}
          <button type="button" onclick={() => jumpTo(section)}>{section === 'preview' ? 'Live preview' : section === 'api' ? 'API' : section[0].toUpperCase() + section.slice(1)}</button>
        {/each}
      </aside>
    {/if}
  </div>
</div>

<style>
  .docs { min-height: 100vh; color: var(--tint-ink); }
  .topbar { position: sticky; z-index: 20; top: 0; display: flex; align-items: center; gap: 1rem; min-height: 3.5rem; padding: .55rem 1rem; border-bottom: 1px solid var(--tint-border); background: var(--tint-panel); }
  .brand { display: inline-flex; align-items: center; gap: .5rem; font-weight: 700; white-space: nowrap; }
  .brand-mark { display: grid; place-items: center; width: 1.5rem; height: 1.5rem; border-radius: .35rem; background: var(--tint-accent); color: var(--tint-on-accent); font-size: .8rem; }
  .muted { color: var(--tint-muted); font-weight: 500; }
  .header-actions { display: flex; align-items: center; gap: 1rem; margin-left: auto; color: var(--tint-muted); font-size: .8rem; }
  .header-actions a:hover { color: var(--tint-accent); }
  .theme-control { display: inline-flex; align-items: center; gap: .35rem; }
  input { border: 1px solid var(--tint-border-strong); border-radius: var(--tint-radius-sm); background: var(--tint-field); color: var(--tint-ink); font: inherit; }
  input:focus-visible, button:focus-visible, a:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: 2px; }
  .nav-toggle { display: none; border: 0; background: transparent; color: var(--tint-ink); cursor: pointer; font-size: 1.1rem; }
  .body { display: grid; grid-template-columns: 14rem minmax(0, 1fr) 13rem; min-height: calc(100vh - 3.5rem); }
  .sidebar { position: sticky; top: 3.5rem; height: calc(100vh - 3.5rem); overflow-y: auto; padding: 1.25rem .75rem; border-right: 1px solid var(--tint-border); background: var(--tint-panel); }
  .search-label { display: flex; justify-content: space-between; gap: .5rem; margin: 0 .4rem .35rem; color: var(--tint-muted); font-size: .73rem; }
  kbd { font-family: inherit; }
  input { width: 100%; padding: .5rem .6rem; }
  nav { display: grid; gap: .1rem; margin-top: 1rem; }
  nav a { padding: .45rem .6rem; border-radius: var(--tint-radius-sm); color: var(--tint-muted); font-size: .84rem; }
  nav a:hover, nav a[aria-current] { background: var(--tint-accent-soft); color: var(--tint-accent); }
  nav a[aria-current] { font-weight: 600; }
  .group-label { margin: 1.1rem .6rem .25rem; color: var(--tint-ink); font-size: .75rem; font-weight: 700; }
  main { min-width: 0; }
  .toc { position: sticky; top: 3.5rem; height: calc(100vh - 3.5rem); padding: 2rem 1rem; }
  .toc p { margin: 0 0 .6rem; font-size: .75rem; font-weight: 700; }
  .toc button { display: block; width: 100%; padding: .35rem .55rem; border: 0; border-left: 2px solid var(--tint-border); background: none; color: var(--tint-muted); cursor: pointer; font: inherit; font-size: .78rem; text-align: left; text-transform: none; }
  .toc button:hover { border-color: var(--tint-accent); color: var(--tint-accent); }
  .overview { max-width: 72rem; padding: clamp(1.25rem, 3vw, 3rem); }
  .eyebrow { margin: 0 0 .5rem; color: var(--tint-accent); font-size: .72rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
  .overview h1 { margin: 0; font-size: clamp(2.25rem, 4vw, 3.5rem); letter-spacing: -.04em; }
  .overview > p:not(.eyebrow) { max-width: 42rem; color: var(--tint-muted); line-height: 1.6; }
  .lab-link { display: inline-block; margin: .4rem 0 2rem; color: var(--tint-accent); font-weight: 600; }
  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr)); gap: .8rem; }
  .cards a { display: grid; gap: .4rem; padding: 1rem; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-lg); background: var(--tint-panel); }
  .cards a:hover { border-color: var(--tint-accent); }
  .cards span { color: var(--tint-muted); font-size: .82rem; line-height: 1.45; }
  @media (max-width: 1150px) { .body { grid-template-columns: 14rem minmax(0, 1fr); } .toc { display: none; } }
  @media (max-width: 850px) { .body { display: block; } .sidebar { position: fixed; z-index: 15; top: 3.5rem; left: 0; width: min(18rem, 85vw); visibility: hidden; transform: translateX(-100%); transition: transform var(--tint-motion-base) var(--tint-ease), visibility var(--tint-motion-base); box-shadow: 0 1rem 2rem var(--tint-shadow-color); } .sidebar.open { visibility: visible; transform: translateX(0); } .nav-toggle { display: block; } .header-actions .theme-control { display: none; } }
  @media (prefers-reduced-motion: reduce) { .sidebar { transition: none; } .toc button { scroll-behavior: auto; } }
</style>
