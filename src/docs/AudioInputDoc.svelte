<script lang="ts">
  import { onDestroy } from 'svelte'
  import { AudioInput, type AudioTranscriber, type TranscriptChunk } from '../svelte'
  import DocPage from './svelte/DocPage.svelte'
  import type { ApiRow } from './svelte/types'

  const listeners = new Set<(chunk: TranscriptChunk) => void>()
  let demoTimer: ReturnType<typeof setTimeout> | undefined
  const transcriber: AudioTranscriber = {
    start() {
      demoTimer = setTimeout(() => {
        for (const listener of listeners) listener({ text: 'Hello from Tint voice input', isFinal: true })
      }, 1800)
    },
    stop() { if (demoTimer) clearTimeout(demoTimer) },
    cancel() { if (demoTimer) clearTimeout(demoTimer) },
    onResult(listener) { listeners.add(listener); return () => listeners.delete(listener) },
  }
  onDestroy(() => { if (demoTimer) clearTimeout(demoTimer) })

  let value = $state('')
  let disabled = $state(false)
  let active = $state(false)
  const api: ApiRow[] = [
    { prop: 'transcriber', type: 'AudioTranscriber', description: 'Host-owned recognition service with start, stop, and result subscription.' },
    { prop: 'value / onValueChange', type: 'string / (text) => void', description: 'Controlled transcript destination; interim results replace the preview and final results append.' },
    { prop: 'onCapture', type: '(blob, { duration }) => void', description: 'Optional recording handoff after a successful capture.' },
    { prop: 'onActiveChange', type: '(active) => void', description: 'Reports capture lifecycle to the host.' },
    { prop: 'disabled / label', type: 'boolean / string', description: 'Guarded availability and accessible action naming.' },
  ]
  const usage = `import { AudioInput, type AudioTranscriber } from '@nebula/tint/audio-input'

let draft = $state('')
const transcriber: AudioTranscriber = {
  start: (stream) => recognition.start(stream),
  stop: () => recognition.stop(),
  onResult: (listener) => recognition.subscribe(listener),
}

<textarea value={draft} oninput={(event) => draft = event.currentTarget.value} />
<AudioInput {transcriber} value={draft}
  onValueChange={(next) => draft = next} label="Voice draft" />`
</script>

<DocPage title="Voice Input" description="Microphone capture with a host-owned transcription service and controlled text. This preview requests browser mic permission, then a local demo transcriber supplies a sample phrase." importPath="@nebula/tint/audio-input" {usage} {api} accessibility="Start, stop, and cancel are named buttons. Recording duration is visible and announced as status text, permission or transcription errors appear in an alert, disabled controls use native disabled state, and the activity meter stops animating under reduced motion.">
  <div class="audio-demo">
    <label for="voice-draft">Draft</label>
    <textarea id="voice-draft" value={value} oninput={(event) => value = event.currentTarget.value} rows={3}></textarea>
    <div class="controls">
      <AudioInput {transcriber} {value} onValueChange={(next) => value = next} onActiveChange={(next) => active = next} {disabled} label="Voice draft" />
      <label><input type="checkbox" checked={disabled} onchange={(event) => disabled = event.currentTarget.checked} /> Disable voice input</label>
      <span aria-live="polite">{active ? 'Capture active' : 'Capture idle'}</span>
    </div>
  </div>
</DocPage>

<style>
  .audio-demo { display: grid; gap: .65rem; max-width: 36rem; }
  .audio-demo > label { color: var(--tint-ink); font-weight: 600; font-size: .85rem; }
  textarea { width: 100%; border: 1px solid var(--tint-border-strong); border-radius: var(--tint-radius-sm); padding: .65rem; background: var(--tint-field); color: var(--tint-ink); font: inherit; }
  textarea:focus-visible, input:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
  .controls { display: flex; align-items: center; flex-wrap: wrap; gap: 1rem; color: var(--tint-muted); font-size: .8rem; }
  .controls label { display: inline-flex; align-items: center; gap: .35rem; color: var(--tint-ink); }
</style>
