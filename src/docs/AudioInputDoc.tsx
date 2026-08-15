import { useEffect, useMemo, useState } from 'react'
import { AudioInput } from '../components/audio-input'
import { ChatComposer } from '../components/chat'
import { MediaPlayer } from '../components/media-player'
import { CodeBlock } from './components/CodeBlock'
import { PropsTable } from './components/PropsTable'
import {
  DocsCallout,
  DocsDemo,
  DocsFooter,
  DocsPage,
  DocsSection,
} from './components/DocsPage'
import { createWebSpeechTranscriber } from './audio-input/webSpeechTranscriber'

const previewDemoCode = `<ChatComposer
  value={draft}
  onValueChange={setDraft}
  state={recording ? 'disabled' : 'idle'}
  onSubmit={() => setDraft('')}
  actions={
    <AudioInput
      transcriber={transcriber}
      value={draft}
      onValueChange={setDraft}
      onActiveChange={setRecording}
      onCapture={(blob, meta) => saveVoiceNote(blob, meta.duration)}
    />
  }
/>`

const usage = `import { AudioInput } from 'tint/audio-input'

<AudioInput
  transcriber={transcriber}
  value={draft}
  onValueChange={setDraft}
/>`

const signature = `export type AudioInputProps = Omit<HTMLAttributes<HTMLDivElement>, 'onError'> & {
  /** Host-owned recognition adapter. Changing identity tears down any session. */
  transcriber: AudioTranscriber
  /**
   * The controlled draft this appends into. Captured at record time, so
   * cancelling restores exactly what was there before.
   */
  value: string
  /** Receives interim previews and committed transcript text. */
  onValueChange: (value: string) => void
  /**
   * Receives a voice-note Blob after Stop. Supplying this turns on
   * \`MediaRecorder\`; omit it and only recognition runs.
   */
  onCapture?: (blob: Blob, meta: AudioCaptureMeta) => void
  /**
   * Reports whether a session is live, so a host can lock adjacent text
   * editing while the transcript is being written into it.
   */
  onActiveChange?: (active: boolean) => void
  /** Blocks starting a recording. Has no effect on one already running. */
  disabled?: boolean
  /**
   * Names the controls: "Start {label}", "Stop {label}", "Cancel {label}".
   * Not visible text.
   */
  label?: string
}`

const props = [
  { name: 'transcriber', type: 'AudioTranscriber', required: true, description: 'Host-owned transcription adapter.' },
  { name: 'value', type: 'string', required: true, description: 'Controlled draft text.' },
  { name: 'onValueChange', type: '(value: string) => void', required: true, description: 'Receives interim previews and committed transcript text.' },
  { name: 'onCapture', type: '(blob, meta) => void', description: 'Optionally receives a voice-note Blob and elapsed duration after Stop.' },
  { name: 'onActiveChange', type: '(active: boolean) => void', description: 'Lets a host lock adjacent text editing during a recording.' },
  { name: 'disabled', type: 'boolean', defaultValue: 'false', description: 'Blocks starting a recording. Has no effect on one already running.' },
  { name: 'label', type: 'string', defaultValue: "'Voice input'", description: 'Names the start, stop, and cancel controls — “Start voice input”, and so on.' },
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
    <DocsPage
      route="components/audio-input"
      title="Audio Input"
      intro="A microphone control that captures locally and delegates speech recognition to a host-supplied adapter."
    >
      <DocsSection
        id="preview"
        title="Preview"
        description="Voice input docked in a chat composer. Stopping a recording commits the transcript to the draft and, when onCapture is set, hands back a playable voice note."
      >
        <DocsDemo code={previewDemoCode}>
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
          {recording ? <MediaPlayer kind="audio" src={recording.url} label="Recorded voice note" duration={recording.duration} className="mt-4" /> : null}
        </DocsDemo>
        <div className="mt-6">
          <DocsCallout variant="warning" title="Demo transcriber uses the Web Speech API">
            Browser support is limited, and Chrome’s default recognition may send audio to a
            server-based service; it is not an offline privacy boundary.
          </DocsCallout>
        </div>
      </DocsSection>

      <DocsSection
        id="usage"
        title="Usage"
        description={
          <>
            <code>AudioInput</code> is fully controlled: the host owns the draft text through{' '}
            <code>value</code>/<code>onValueChange</code> and supplies the transcription adapter.
          </>
        }
      >
        <CodeBlock code={usage} language="tsx" />
      </DocsSection>

      <DocsSection id="api" title="API">
        <p className="mb-3 text-sm leading-6 text-tint-muted">
          The full prop signature, from the source:
        </p>
        <div className="mb-6">
          <CodeBlock code={signature} language="tsx" />
        </div>
        <PropsTable rows={props} />
      </DocsSection>

      <DocsFooter />
    </DocsPage>
  )
}
