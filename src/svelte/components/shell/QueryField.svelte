<!--
  Header query field (booru tag search). The query string is controlled by the
  host; committed tokens render as square chips inside the field, typing asks
  the host for suggestions, and picks/Enter/Backspace edit the query.
  Focus is reported so the host can open its taxonomy tray.
-->
<script lang="ts">
  import { Search, X } from "@lucide/svelte"
  import { Icon } from "@nebula/tint/icon"
  import { parseQuery, joinTokens, negateToken, removeToken } from "../media-assets/core/query"

  export type QueryHit = { kind: string; label: string; token: string; detail?: string | null; count?: number | null }

  type Props = {
    id?: string
    value: string
    onchange: (query: string) => void
    draft: string
    ondraftchange: (draft: string) => void
    hits: readonly QueryHit[]
    onfocuschange?: (focused: boolean) => void
    placeholder?: string
    groupLabels?: Record<string, string>
    input?: HTMLInputElement | null
  }
  let {
    id = "query",
    value,
    onchange,
    draft,
    ondraftchange,
    hits,
    onfocuschange,
    placeholder = "Search tags, people, person:name, type:video…",
    groupLabels = { person: "People", tag: "Tags", field: "Fields", collection: "Collections" },
    input = $bindable(null),
  }: Props = $props()

  let open = $state(false)
  let active = $state(0)
  const tokens = $derived(parseQuery(value))
  const order = ["person", "tag", "collection", "field"]
  const grouped = $derived(
    order
      .map((kind) => ({ kind, hits: hits.filter((h) => h.kind === kind) }))
      .filter((g) => g.hits.length),
  )
  const flat = $derived(grouped.flatMap((g) => g.hits))
  const showList = $derived(open && draft.trim().length > 0 && flat.length > 0)

  $effect(() => {
    void flat.length
    active = 0
  })

  function commit(token: string) {
    const trimmed = token.trim()
    if (!trimmed) return
    const existing = tokens.map((t) => t.raw)
    if (!existing.includes(trimmed)) onchange(joinTokens([...existing, trimmed]))
    ondraftchange("")
  }

  function pick(hit: QueryHit) {
    // Field hints (e.g. "person:") seed the draft instead of committing.
    if (hit.kind === "field") {
      ondraftchange(hit.token)
      input?.focus()
      return
    }
    commit(hit.token)
  }

  function keydown(event: KeyboardEvent) {
    if (event.key === "ArrowDown" && showList) {
      event.preventDefault()
      active = (active + 1) % flat.length
    } else if (event.key === "ArrowUp" && showList) {
      event.preventDefault()
      active = (active - 1 + flat.length) % flat.length
    } else if (event.key === "Enter") {
      event.preventDefault()
      if (showList && flat[active]) pick(flat[active])
      else draft.split(/\s+/).forEach(commit)
    } else if (event.key === "Backspace" && draft === "" && tokens.length) {
      onchange(removeToken(value, tokens.length - 1))
    } else if (event.key === "Escape") {
      if (draft) ondraftchange("")
      else input?.blur()
      open = false
    }
  }
</script>

<div data-tint-query-field class="relative w-full min-w-0">
  <div
    class="flex h-8 w-full min-w-0 items-center gap-1 rounded-[2px] border border-tint-border bg-tint-field px-2
           focus-within:border-tint-focus focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-tint-focus"
  >
    <Icon icon={Search} size="sm" class="shrink-0 text-tint-muted" />
    <div class="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none]">
      {#each tokens as token, index (token.raw + index)}
        <span
          class={[
            "flex shrink-0 items-center rounded-[2px] border font-mono text-[0.75rem] leading-5",
            token.negated ? "border-tint-danger-ink/40 bg-tint-danger-soft text-tint-danger-ink" : "border-tint-border bg-tint-accent-soft text-tint-ink",
          ]}
        >
          <button
            type="button"
            class="px-1.5"
            title={token.negated ? "Include instead" : "Exclude instead"}
            aria-label={`${token.raw}: ${token.negated ? "include instead" : "exclude instead"}`}
            onclick={() => onchange(negateToken(value, index))}
          >{token.raw}</button>
          <button
            type="button"
            class="border-l border-current/20 px-1 text-tint-muted hover:text-tint-ink"
            aria-label={`Remove ${token.raw}`}
            onclick={() => onchange(removeToken(value, index))}
          ><Icon icon={X} size="xs" /></button>
        </span>
      {/each}
      <input
        {id}
        bind:this={input}
        type="text"
        role="combobox"
        autocomplete="off"
        spellcheck="false"
        aria-label="Search"
        aria-expanded={showList}
        aria-controls={`${id}-list`}
        aria-activedescendant={showList ? `${id}-hit-${active}` : undefined}
        class="h-full min-w-[8rem] flex-1 bg-transparent font-mono text-[0.8125rem] text-tint-ink outline-none placeholder:text-tint-muted"
        placeholder={tokens.length ? "" : placeholder}
        value={draft}
        oninput={(event) => { ondraftchange(event.currentTarget.value); open = true }}
        onfocus={() => { open = true; onfocuschange?.(true) }}
        onblur={() => { open = false; onfocuschange?.(false) }}
        onkeydown={keydown}
      />
    </div>
    {#if value || draft}
      <button
        type="button"
        class="shrink-0 text-tint-muted hover:text-tint-ink"
        aria-label="Clear search"
        onmousedown={(event) => event.preventDefault()}
        onclick={() => { onchange(""); ondraftchange(""); input?.focus() }}
      ><Icon icon={X} size="sm" /></button>
    {/if}
  </div>

  {#if showList}
    <div
      id={`${id}-list`}
      role="listbox"
      aria-label="Suggestions"
      class="absolute left-0 right-0 top-full z-40 mt-1 max-h-[22rem] overflow-y-auto rounded-[2px] border border-tint-border bg-tint-panel py-1 shadow-lg"
    >
      {#each grouped as group (group.kind)}
        <div role="group" aria-label={groupLabels[group.kind] ?? group.kind}>
          <div class="px-3 pb-0.5 pt-1.5 text-[0.6875rem] font-medium uppercase tracking-wide text-tint-muted">
            {groupLabels[group.kind] ?? group.kind}
          </div>
          {#each group.hits as hit (hit.kind + hit.token)}
            {@const index = flat.indexOf(hit)}
            <button
              id={`${id}-hit-${index}`}
              type="button"
              role="option"
              tabindex="-1"
              aria-selected={index === active}
              class={[
                "flex w-full items-center gap-2 border-l-2 px-3 py-1 text-left",
                index === active ? "border-tint-accent bg-tint-selection" : "border-transparent hover:bg-tint-selection",
              ]}
              onmousedown={(event) => event.preventDefault()}
              onmouseenter={() => (active = index)}
              onclick={() => pick(hit)}
            >
              <span class="min-w-0 flex-1 truncate">{hit.label}</span>
              {#if hit.detail}<span class="shrink-0 text-xs text-tint-muted">{hit.detail}</span>{/if}
              {#if hit.count !== null && hit.count !== undefined}
                <span class="shrink-0 font-mono text-xs tabular-nums text-tint-muted">{hit.count.toLocaleString()}</span>
              {/if}
            </button>
          {/each}
        </div>
      {/each}
    </div>
  {/if}
</div>
