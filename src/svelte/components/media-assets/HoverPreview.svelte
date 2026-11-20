<!--
  Stash-style hover preview: plays a short muted loop of the source video while
  mounted. The parent mounts it only while the tile is hovered, so unmount is
  the full stop/release path. Honours prefers-reduced-motion and caps
  concurrent previews module-wide so fast cursor sweeps don't open dozens of
  connections.
-->
<script lang="ts">
  const START_DELAY_MS = 400
  const SEEK_FRAGMENT = "#t=1" // poster shows frame 0; the preview shows motion
  const MAX_ACTIVE = 2

  const active = new Set<() => void>()
  const waiting: (() => void)[] = []

  function acquire(run: () => void): () => void {
    let started = false
    const go = () => { started = true; active.add(go); run() }
    if (active.size < MAX_ACTIVE) go()
    else waiting.push(go)
    return () => {
      if (!started) {
        const i = waiting.indexOf(go)
        if (i >= 0) waiting.splice(i, 1)
        return
      }
      active.delete(go)
      const next = waiting.shift()
      if (next) next()
    }
  }

  let { src, onstarted }: { src: string; onstarted?: () => void } = $props()
  let timer: ReturnType<typeof setTimeout> | null = null
  let release: (() => void) | null = null
  let video: HTMLVideoElement | null = $state(null)
  let show = $state(false)

  function stop() {
    if (timer) { clearTimeout(timer); timer = null }
    release?.()
    release = null
    show = false
    if (video) {
      video.pause()
      video.removeAttribute("src")
      video.load()
      video = null
    }
  }

  $effect(() => {
    if (typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    timer = setTimeout(() => {
      timer = null
      release = acquire(() => { show = true })
    }, START_DELAY_MS)
    return () => stop()
  })
</script>

{#if show}
  <video
    bind:this={video}
    src={`${src}${SEEK_FRAGMENT}`}
    class="absolute inset-0 h-full w-full object-cover"
    muted
    loop
    autoplay
    playsinline
    tabindex="-1"
    aria-hidden="true"
    oncanplay={() => onstarted?.()}
    onerror={stop}
  ></video>
{/if}
