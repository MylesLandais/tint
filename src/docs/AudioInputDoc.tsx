import { useEffect, useMemo, useState } from 'react'
import { AudioInput } from '../components/audio-input'
import { AudioPlayer } from '../components/audio-player'
import { ChatComposer } from '../components/chat'
import { CodeBlock } from './components/CodeBlock'
import { DocsNav } from './components/DocsNav'
import { PropsTable } from './components/PropsTable'
import { createWebSpeechTranscriber } from './audio-input/webSpeechTranscriber'

const usage = `import { AudioInput } from 'tint/audio-input'

<AudioInput
  transcriber={transcriber}
  value={draft}
  onValueChange={setDraft}
/>`
const props = [
  { name: 'transcriber', type: 'AudioTranscriber', required: true, description: 'Host-owned transcription adapter.' },
  { name: 'value', type: 'string', required: true, description: 'Controlled draft text.' },
  { name: 'onValueChange', type: '(value: string) => void', required: true, description: 'Receives interim previews and committed transcript text.' },
  { name: 'onCapture', type: '(blob, meta) => void', description: 'Optionally receives a voice-note Blob and elapsed duration after Stop.' },
  { name: 'onActiveChange', type: '(active: boolean) => void', description: 'Lets a host lock adjacent text editing during a recording.' },
]

export function AudioInputDoc() {
  const transcriber = useMemo(() => createWebSpeechTranscriber(), [])
  const [draft, setDraft] = useState('Try saying something about the component.')
  const [active, setActive] = useState(false)
  const [recording, setRecording] = useState<{ url: string; duration: number }>()

  useEffect(() => () => {
    if (recording) URL.revokeObjectURL(recording.url)
  }, [recording])

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <div className="mx-auto max-w-[1200px]">
        <DocsNav current="components/audio-input" />
        <section className="mb-8 max-w-3xl">
          <p className="m-0 text-xs font-semibold tracking-[0.14em] text-tint-accent uppercase">Components</p>
          <h1 className="mt-2 mb-3 text-3xl font-semibold tracking-tight text-tint-ink sm:text-4xl">Audio Input</h1>
          <p className="m-0 text-base leading-7 text-tint-muted">A microphone control that captures locally and delegates speech recognition to a host-supplied adapter.</p>
          <p className="mt-3 text-sm leading-6 text-tint-muted">This demo adapter uses the Web Speech API. Browser support is limited, and Chrome’s default recognition may send audio to a server-based service; it is not an offline privacy boundary.</p>
        </section>
        <section id="preview" className="mb-14 scroll-mt-24">
          <div className="rounded-xl border border-tint-border bg-tint-panel p-4 shadow-sm sm:p-6">
            <ChatComposer
              value={draft}
              onValueChange={setDraft}
              state={active ? 'disabled' : 'idle'}
              onSubmit={() => setDraft('')}
              actions={<AudioInput transcriber={transcriber} value={draft} onValueChange={setDraft} onActiveChange={setActive} onCapture={(blob, meta) => {
                setRecording((previous) => {
                  if (previous) URL.revokeObjectURL(previous.url)
                  return { url: URL.createObjectURL(blob), duration: meta.duration }
                })
              }} />}
            />
            {recording ? <AudioPlayer src={recording.url} label="Recorded voice note" duration={recording.duration} className="mt-4" /> : null}
          </div>
        </section>
        <section id="usage" className="mb-14 max-w-3xl scroll-mt-24">
          <h2 className="mb-3 text-2xl font-semibold tracking-tight">Usage</h2>
          <CodeBlock code={usage} language="tsx" />
        </section>
        <section id="api" className="scroll-mt-24">
          <h2 className="mb-2 text-2xl font-semibold tracking-tight">API</h2>
          <PropsTable rows={props} />
        </section>
      </div>
    </main>
  )
}
