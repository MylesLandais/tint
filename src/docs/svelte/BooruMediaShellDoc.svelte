<script lang="ts">
  import DateScrubber from '../../svelte/components/shell/DateScrubber.svelte'
  import IconButton from '../../svelte/components/shell/IconButton.svelte'
  import ListButton from '../../svelte/components/shell/ListButton.svelte'
  import PropertyList from '../../svelte/components/shell/PropertyList.svelte'
  import QueryField from '../../svelte/components/shell/QueryField.svelte'
  import SectionToggle from '../../svelte/components/shell/SectionToggle.svelte'
  import { ChevronDown, Play } from '@lucide/svelte'

  // Query field state (the query string is the single source of truth).
  let value = $state('rating:safe')
  let draft = $state('')
  const hits = $state<{ kind: string; token: string; label: string }[]>([])
  const buckets = $state([
    { month: '2026-10', count: 10 },
    { month: '2026-11', count: 30 },
  ])
  let scrubMonth = $state<string | null>('2026-11')
  let sourceOpen = $state(true)
  let trayPressed = $state(false)
  let listCurrent = $state('all')

  function Row(label: string, value: string | number | null, mono = false) {
    return { label, value, mono }
  }

  const demo = $derived([
    Row('From', 'imageboard'),
    Row('Board', '/wsg/', true),
    Row('Thread', '6108547', true),
    Row('Empty', null),
  ])
</script>

# Booru media shell (Svelte)

Components extracted from the booru nightly client: a query-string-first
search field, a density date scrubber, list/section chrome and an icon
button. Together with the media-assets core helpers (``query``, ``justify``,
``frameQueue``) they are everything the booru shell needs that Tint did not
have yet.

## QueryField

Query-string-first search input. Tokens are whitespace separated,
``-token`` negates; chips mirror ``parseQuery(value)``; the suggestion list
is driven entirely by the ``hits`` prop.

| prop | type | notes |
| --- | --- | --- |
| ``value`` | ``string`` | committed query string (source of truth) |
| ``onchange`` | ``(query: string) => void`` | fired when a token commits |
| ``draft`` | ``string`` | in-progress text |
| ``ondraftchange`` | ``(draft: string) => void`` | mirrors the input |
| ``hits`` | ``readonly QueryHit[]`` | suggestions, grouped by kind |
| ``placeholder`` | ``string?`` | input placeholder |

<QueryField
  value={value}
  draft={draft}
  {hits}
  onchange={(q) => (value = q)}
  ondraftchange={(d) => (draft = d)}
  placeholder="Search people, tags, boards…"
/>

## DateScrubber

Vertical bar scrubber over month buckets; bar heights scale by count.

| prop | type | notes |
| --- | --- | --- |
| ``buckets`` | ``readonly Bucket[]`` | one entry per month: ``month`` = ``yyyy-mm`` plus ``count`` |
| ``current`` | ``string \| null`` | highlighted month |
| ``onjump`` | ``(month: string) => void`` | click target |
| ``label`` | ``string?`` | aria-label for the nav |

<DateScrubber {buckets} current={scrubMonth} onjump={(m) => (scrubMonth = m)} />

## IconButton

| prop | type | notes |
| --- | --- | --- |
| ``icon`` | ``LucideIcon`` | the glyph |
| ``label`` | ``string`` | accessible name |
| ``pressed`` | ``boolean?`` | renders ``aria-pressed`` |
| ``size`` | ``'sm' \| 'md' \| 'lg'`` | default ``'md'`` |
| ``tone`` | ``'default' \| 'overlay'`` | overlay for media surfaces |
| ``onclick`` | ``(event) => void?`` | click handler |

<IconButton icon={ChevronDown} label="Tray" pressed={trayPressed} onclick={() => (trayPressed = !trayPressed)} />
<IconButton icon={Play} label="Preview" tone="overlay" />

## ListButton

| prop | type | notes |
| --- | --- | --- |
| ``current`` | ``boolean?`` | ``aria-current`` row state |
| ``pressed`` | ``boolean?`` | transient active state |
| ``density`` | ``'compact' \| 'default' \| 'roomy'`` | vertical rhythm |
| ``leading`` / ``trailing`` | ``Snippet?`` | side slots |
| ``children`` | ``Snippet`` | row content |
| ``onclick`` | ``(event) => void?`` | click handler |

<ListButton
  current={listCurrent === 'all'}
  onclick={() => (listCurrent = 'all')}
>All media</ListButton>
<ListButton
  current={listCurrent === 'people'}
  onclick={() => (listCurrent = 'people')}
>People</ListButton>

## PropertyList

| prop | type | notes |
| --- | --- | --- |
| ``rows`` | ``readonly Row[]`` | ``label`` / ``value`` / ``mono?``; empty values are skipped |

<PropertyList rows={demo} />

## SectionToggle

| prop | type | notes |
| --- | --- | --- |
| ``label`` | ``string`` | header text |
| ``expanded`` | ``boolean`` | controlled open state |
| ``ontoggle`` | ``() => void`` | click handler (parent owns state) |

<SectionToggle label="Source" expanded={sourceOpen} ontoggle={() => (sourceOpen = !sourceOpen)} />
{#if sourceOpen}<p class="text-sm text-tint-muted">panel body</p>{/if}

## Core helpers

- ``query`` — ``parseQuery``, ``joinTokens``, ``hasToken``, ``toggleToken``,
  ``removeToken``, ``negateToken``; whitespace-separated tokens, ``-`` negates.
- ``justify`` — ``justify(boxes, targetWidth, targetHeight)`` lays tiles out
  into justified rows that fill the container width.
- ``frameQueue`` — ``createFrameQueue(source)`` / ``frameQueue(el, source)``
  advance video elements through hover-preview frames without re-fetch
  storms.
