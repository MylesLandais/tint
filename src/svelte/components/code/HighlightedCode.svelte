<script lang="ts">
  import { codeLines, codeTokens, type CodeToken } from '../../../core/code'

  type Props = {
    code: string
    language?: string
    class?: string
    lineNumbers?: boolean
    startLine?: number
    highlightLines?: readonly number[]
    highlightWords?: readonly string[]
  }

  let {
    code, language, class: className, lineNumbers = false, startLine = 1,
    highlightLines = [], highlightWords = [],
  }: Props = $props()
  let addressed = $derived(lineNumbers || highlightLines.length > 0 || highlightWords.length > 0)
  let tokens = $derived(codeTokens(code, language))
  let lines = $derived(codeLines(code, language, startLine, highlightLines, highlightWords))
</script>

{#snippet renderToken(token: CodeToken, depth: number)}
  {#if depth < token.stack.length}
    <span class={token.stack[depth]}>{@render renderToken(token, depth + 1)}</span>
  {:else}
    {#each token.parts as part}
      {#if part.marked}<mark class="bg-tint-accent-soft text-inherit">{part.text}</mark>{:else}{part.text}{/if}
    {/each}
  {/if}
{/snippet}

<code class={className}>
  {#if addressed}
    {#each lines as line (line.number)}
      <span data-code-line={line.number} data-highlighted={line.highlighted || undefined} class={line.highlighted ? 'block bg-tint-code-ink/10' : 'block'}>
        {#if lineNumbers}<span aria-hidden="true" class="mr-4 inline-block min-w-8 select-none text-right text-tint-code-muted/60">{line.number}</span>{/if}
        {#if line.tokens.length}{#each line.tokens as token}{@render renderToken(token, 0)}{/each}{:else}{'\u00a0'}{/if}
      </span>
    {/each}
  {:else}
    {#each tokens as token}{@render renderToken(token, 0)}{/each}
  {/if}
</code>
