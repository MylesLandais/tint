<!--
  Person image with a monogram fallback when there is no image or it fails.
  ``shape`` square for grid portraits (Stash cards), round for inline avatars.
-->
<script lang="ts">
  type Props = { src: string | null | undefined; name: string; shape?: "square" | "round"; class?: string }
  let { src, name, shape = "round", class: className }: Props = $props()
  let failed = $state(false)
  const initials = $derived(
    name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join(""),
  )
  $effect(() => { void src; failed = false })
</script>

<span
  data-tint-avatar
  class={["relative flex items-center justify-center overflow-hidden bg-[light-dark(var(--tint-border),var(--tint-panel))] text-tint-muted [container-type:inline-size]", shape === "round" ? "rounded-full" : "rounded-[2px]", className]}
>
  {#if src && !failed}
    <img {src} alt="" loading="lazy" class="absolute inset-0 h-full w-full object-cover" onerror={() => (failed = true)} onload={(e) => { const i = e.currentTarget as HTMLImageElement; if (!i.naturalWidth) failed = true }} />
    <span aria-hidden="true" class="font-medium leading-none" style:font-size="max(0.6875rem, 28cqi)">{initials}</span>
  {:else}
    <span aria-hidden="true" class="font-medium leading-none" style:font-size="max(0.6875rem, 28cqi)">{initials}</span>
  {/if}
</span>
