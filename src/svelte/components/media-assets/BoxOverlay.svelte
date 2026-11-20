<!--
  Read-only face/object boxes over media. Boxes are normalized 0..1 so the
  overlay fits any rendered size. Status is carried by line style AND label
  text, never colour alone.
-->
<script lang="ts">
  export type OverlayBox = {
    id: string
    x: number
    y: number
    w: number
    h: number
    status: "confirmed" | "suggested" | "unassigned"
    label?: string
  }
  type Props = {
    boxes: readonly OverlayBox[]
    activeId?: string | null
    onselect?: (id: string) => void
    onhover?: (id: string | null) => void
  }
  let { boxes, activeId = null, onselect, onhover }: Props = $props()
  const STYLE = { confirmed: "border-solid", suggested: "border-dashed", unassigned: "border-dotted" } as const
  const PREFIX = { confirmed: "", suggested: "Suggested: ", unassigned: "Unknown" } as const
</script>

<div data-tint-box-overlay class="pointer-events-none absolute inset-0">
  {#each boxes as box (box.id)}
    <button
      type="button"
      class={[
        "pointer-events-auto absolute rounded-[2px] border-2 transition-colors duration-[110ms]",
        STYLE[box.status],
        activeId === box.id ? "border-tint-accent" : "border-white/85 hover:border-white",
      ]}
      style:left="{box.x * 100}%"
      style:top="{box.y * 100}%"
      style:width="{box.w * 100}%"
      style:height="{box.h * 100}%"
      style:box-shadow="0 0 0 1px rgb(0 0 0 / 0.45)"
      aria-label={`${PREFIX[box.status]}${box.label ?? ""}`.trim() || "Face"}
      onclick={() => onselect?.(box.id)}
      onmouseenter={() => onhover?.(box.id)}
      onmouseleave={() => onhover?.(null)}
    >
      <span class="absolute left-0 top-full mt-0.5 whitespace-nowrap rounded-[2px] bg-tint-ink/80 px-1 py-px text-left text-[0.6875rem] text-tint-bg">
        {PREFIX[box.status]}{box.status === "unassigned" ? "" : (box.label ?? "")}
      </span>
    </button>
  {/each}
</div>
