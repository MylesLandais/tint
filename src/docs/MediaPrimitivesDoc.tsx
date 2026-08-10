import { useMemo, useState } from 'react'
import {
  MediaPlaceholder,
  Slider,
  VolumeControl,
  Waveform,
  formatTime,
} from '../components/media'
import { CodeBlock } from './components/CodeBlock'
import { DocsPage, DocsPreview, DocsSection } from './components/DocsPage'
import { PropsTable } from './components/PropsTable'

const usage = `import { Slider, VolumeControl, formatTime } from 'tint/media'

const [progress, setProgress] = useState(0)

<Slider value={progress} onChange={setProgress} aria-label="Seek" showThumb />
<span>{formatTime(93)}</span>  // "1:33"

<VolumeControl
  volume={volume}
  isMuted={muted}
  onVolumeChange={setVolume}
  onToggleMute={() => setMuted(m => !m)}
/>`

const waveformUsage = `import { Waveform } from 'tint/media'

// Peaks must already be normalized to 0..1, and \`color\` must be a literal
// canvas-parseable colour — fillStyle cannot resolve var(--tint-accent).
<Waveform
  peaks={peaks}
  progress={0.4}
  hoverProgress={null}
  color={resolvedAccent}
  onSeek={p => seek(p * 100)}
/>`

const sliderProps = [
  { name: 'value', type: 'number', required: true, description: 'Position, 0–100. Non-finite values clamp to 0.' },
  { name: 'onChange', type: '(value: number) => void', required: true, description: 'Called with the new 0–100 position from pointer or keyboard.' },
  { name: 'aria-label', type: 'string', required: true, description: 'Required: the track is a custom `role="slider"` with no visible label of its own.' },
  { name: 'orientation', type: "'horizontal' | 'vertical'", defaultValue: "'horizontal'", description: 'Vertical fills from the bottom and reverses the pointer maths.' },
  { name: 'showThumb', type: 'boolean', defaultValue: 'false', description: 'Renders a draggable-looking thumb. Decorative — the whole track is the control.' },
  { name: 'className', type: 'string', description: 'Extra classes for the track. Set the text colour here; the track inherits it.' },
  { name: 'fillClassName', type: 'string', description: 'Extra classes for the filled portion.' },
  { name: 'thumbClassName', type: 'string', description: 'Extra classes for the thumb.' },
]

const volumeProps = [
  { name: 'volume', type: 'number', required: true, description: 'Current level, 0–100.' },
  { name: 'isMuted', type: 'boolean', required: true, description: 'Drives the icon and the restore-on-unmute behaviour.' },
  { name: 'onVolumeChange', type: '(volume: number) => void', required: true, description: 'Called with the new 0–100 level.' },
  { name: 'onToggleMute', type: '() => void', required: true, description: 'Called when the speaker button is activated.' },
  { name: 'onOpenChange', type: '(open: boolean) => void', description: 'Reports drawer visibility, so a sibling popout can close itself.' },
  { name: 'tone', type: "'surface' | 'chrome'", defaultValue: "'chrome'", description: '`chrome` is for overlays on video; `surface` is for in-page use, where fixed white would be invisible in light mode.' },
  { name: 'className', type: 'string', description: 'Extra classes for the wrapper.' },
]

const waveformProps = [
  { name: 'peaks', type: 'readonly number[]', required: true, description: 'Pre-normalized amplitudes, each 0–1. Normalize before passing.' },
  { name: 'progress', type: 'number', required: true, description: 'Playback position, 0–1.' },
  { name: 'hoverProgress', type: 'number | null', required: true, description: 'Pointer position 0–1, or null. Owned by the caller — the canvas has no pointer-move listener.' },
  { name: 'color', type: 'string', required: true, description: 'A literal colour. `fillStyle` cannot resolve `var(--tint-*)`, so resolve it first.' },
  { name: 'onSeek', type: '(progress: number) => void', required: true, description: 'Called with the click position, 0–1.' },
]

const PEAKS = Array.from({ length: 64 }, (_, index) =>
  Math.abs(Math.sin(index / 3.1)) * 0.7 + Math.abs(Math.cos(index / 7.7)) * 0.3,
)

export function MediaPrimitivesDoc() {
  const [progress, setProgress] = useState(35)
  const [volume, setVolume] = useState(70)
  const [muted, setMuted] = useState(false)
  const [hover, setHover] = useState<number | null>(null)
  const peaks = useMemo(() => {
    const peak = Math.max(...PEAKS, 1)
    return PEAKS.map((value) => value / peak)
  }, [])

  return (
    <DocsPage
      route="components/media"
      title="Media Primitives"
      intro="The parts every media surface in tint is assembled from: an accessible slider, a hover-expanding volume control, a canvas waveform, the white-label artwork placeholder, and the timecode formatter."
      note="These are exported because a host building its own player should not have to reimplement them. MediaPlayer composes exactly these."
    >
      <DocsSection id="preview" title="Preview">
        <div className="grid gap-4 sm:grid-cols-2">
          <DocsPreview>
            <p className="mt-0 mb-4 text-sm font-medium text-tint-ink">Slider</p>
            <div className="flex items-center gap-3 text-tint-ink">
              <span className="w-9 shrink-0 font-mono text-xs tabular-nums text-tint-muted">
                {formatTime((progress / 100) * 214)}
              </span>
              <Slider
                value={progress}
                onChange={setProgress}
                aria-label="Seek the example track"
                showThumb
                fillClassName="bg-tint-accent"
              />
              <span className="w-9 shrink-0 text-right font-mono text-xs tabular-nums text-tint-muted">
                {formatTime(214)}
              </span>
            </div>
            <p className="mt-4 mb-0 text-xs text-tint-muted">
              Tab to it, then use arrows, <kbd>Home</kbd>, <kbd>End</kbd>, and{' '}
              <kbd>PageUp</kbd>/<kbd>PageDown</kbd>.
            </p>
          </DocsPreview>

          <DocsPreview>
            <p className="mt-0 mb-4 text-sm font-medium text-tint-ink">VolumeControl</p>
            <div className="flex items-center gap-4">
              <VolumeControl
                volume={muted ? 0 : volume}
                isMuted={muted}
                onVolumeChange={(next) => {
                  setVolume(next)
                  setMuted(next === 0)
                }}
                onToggleMute={() => setMuted((current) => !current)}
                tone="surface"
              />
              <span className="text-xs text-tint-muted">
                {muted ? 'Muted' : `${Math.round(volume)}%`} — hover or focus the button
              </span>
            </div>
          </DocsPreview>

          <DocsPreview className="sm:col-span-2">
            <p className="mt-0 mb-4 text-sm font-medium text-tint-ink">Waveform</p>
            <div
              className="h-12 text-tint-ink"
              onPointerMove={(event) => {
                const rect = event.currentTarget.getBoundingClientRect()
                if (rect.width) setHover((event.clientX - rect.left) / rect.width)
              }}
              onPointerLeave={() => setHover(null)}
            >
              <Waveform
                peaks={peaks}
                progress={progress / 100}
                hoverProgress={hover}
                color="#0f6e56"
                onSeek={(next) => setProgress(next * 100)}
              />
            </div>
            <p className="mt-3 mb-0 text-xs text-tint-muted">
              Decorative and <code>aria-hidden</code>: it is a pointer-only enhancement,
              so the Slider above stays the single keyboard-accessible seek control.
            </p>
          </DocsPreview>

          <DocsPreview className="sm:col-span-2">
            <p className="mt-0 mb-4 text-sm font-medium text-tint-ink">MediaPlaceholder</p>
            <div className="size-32 overflow-hidden rounded-md bg-tint-surface">
              <MediaPlaceholder />
            </div>
            <p className="mt-3 mb-0 text-xs text-tint-muted">
              What renders when artwork is absent or fails to load.
            </p>
          </DocsPreview>
        </div>
      </DocsSection>

      <DocsSection id="usage" title="Usage">
        <CodeBlock code={usage} />
        <h3 className="mt-8 mb-3 text-base font-semibold text-tint-ink">Waveform</h3>
        <CodeBlock code={waveformUsage} />
      </DocsSection>

      <DocsSection id="api" title="API">
        <h3 className="mt-0 mb-3 text-base font-semibold text-tint-ink">Slider</h3>
        <PropsTable rows={sliderProps} />
        <h3 className="mt-8 mb-3 text-base font-semibold text-tint-ink">VolumeControl</h3>
        <PropsTable rows={volumeProps} />
        <h3 className="mt-8 mb-3 text-base font-semibold text-tint-ink">Waveform</h3>
        <PropsTable rows={waveformProps} />
        <h3 className="mt-8 mb-3 text-base font-semibold text-tint-ink">formatTime</h3>
        <p className="mt-0 text-sm leading-6 text-tint-muted">
          <code>formatTime(seconds: number): string</code> — renders <code>m:ss</code>.
          Minutes are not wrapped into hours, so a 70-minute recording reads{' '}
          <code>70:00</code> rather than <code>1:10:00</code>. Non-finite and negative
          input returns <code>0:00</code>, which is what keeps a live stream’s{' '}
          <code>Infinity</code> duration and the <code>NaN</code> before metadata loads
          off the screen.
        </p>
      </DocsSection>
    </DocsPage>
  )
}
