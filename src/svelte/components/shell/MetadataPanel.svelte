<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'

  type Content = string | Snippet
  type Props = Omit<HTMLAttributes<HTMLElement>, 'children' | 'title'> & {
    title: Content
    eyebrow?: Content
    image?: Snippet
    description?: Content
    fields?: readonly { label: string; value: Content }[]
    tags?: readonly string[]
    actions?: Snippet
    children?: Snippet
  }
  let { title, eyebrow, image, description, fields = [], tags = [], actions, children, class: className, ...rest }: Props = $props()
</script>

<section {...rest} data-tint-metadata-panel class={['flex flex-wrap gap-6 rounded-md border border-tint-border bg-tint-panel p-5', className]}>
  {#if image}<div class="shrink-0">{@render image()}</div>{/if}
  <div class="min-w-0 flex-1">
    <div class="flex items-start justify-between gap-4">
      <div>
        {#if eyebrow}<p class="m-0 text-xs tracking-widest text-tint-accent">{#if typeof eyebrow === 'string'}{eyebrow}{:else}{@render eyebrow()}{/if}</p>{/if}
        <h2 class="my-2 text-2xl font-medium">{#if typeof title === 'string'}{title}{:else}{@render title()}{/if}</h2>
      </div>
      {@render actions?.()}
    </div>
    {#if description}<p class="text-sm leading-relaxed text-tint-muted">{#if typeof description === 'string'}{description}{:else}{@render description()}{/if}</p>{/if}
    {#if tags.length}<div class="my-3 flex flex-wrap gap-2">{#each tags as tag (tag)}<span class="rounded bg-tint-surface px-2 py-1 text-xs text-tint-muted">{tag}</span>{/each}</div>{/if}
    {#if fields.length}
      <dl class="m-0 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {#each fields as field (field.label)}
          <div class="flex gap-2"><dt class="text-tint-muted">{field.label}</dt><dd class="m-0">{#if typeof field.value === 'string'}{field.value}{:else}{@render field.value()}{/if}</dd></div>
        {/each}
      </dl>
    {/if}
    {@render children?.()}
  </div>
</section>
