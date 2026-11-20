<!--
  First-frame poster for videos with no stored thumbnail. Waits until the tile
  is near the viewport, takes a slot in the shared frame queue, draws one frame
  to a canvas, then releases the video so its connection is freed.
-->
<script lang="ts">
  import { onDestroy } from "svelte"
  import { frameQueue } from "./core/frameQueue"

  let { src, onready, onfail }: { src: string; onready?: () => void; onfail?: () => void } = $props()
  let host = $state<HTMLDivElement>()
  let canvas = $state<HTMLCanvasElement>()
  let cancel: (() => void) | null = null
  let video: HTMLVideoElement | null = null

  function release() {
    if (!video) return
    video.removeAttribute("src")
    video.load()
    video = null
  }

  function capture(done: () => void) {
    const v = document.createElement("video")
    video = v
    v.muted = true
    v.playsInline = true
    v.preload = "metadata"
    const finish = (ok: boolean) => {
      clearTimeout(timer)
      release()
      done()
      ok ? onready?.() : onfail?.()
    }
    const timer = setTimeout(() => finish(false), 15000)
    v.addEventListener("loadeddata", () => {
      try {
        if (canvas && v.videoWidth) {
          canvas.width = v.videoWidth
          canvas.height = v.videoHeight
          canvas.getContext("2d")?.drawImage(v, 0, 0)
          finish(true)
        } else finish(false)
      } catch {
        finish(false)
      }
    }, { once: true })
    v.addEventListener("error", () => finish(false), { once: true })
    v.src = `${src}#t=0.5`
  }

  $effect(() => {
    if (!host) return
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return
      observer.disconnect()
      cancel = frameQueue.enqueue(capture)
    }, { rootMargin: "400px 0px" })
    observer.observe(host)
    return () => observer.disconnect()
  })

  onDestroy(() => {
    cancel?.()
    release()
  })
</script>

<div bind:this={host} data-tint-first-frame class="absolute inset-0" aria-hidden="true">
  <canvas bind:this={canvas} class="h-full w-full object-cover"></canvas>
</div>
