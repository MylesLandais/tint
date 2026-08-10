import { VideoPlayer } from '../components/video-player'
import { CodeBlock } from './components/CodeBlock'
import { DocsPage, DocsPreview, DocsSection } from './components/DocsPage'
import { PropsTable } from './components/PropsTable'

const usage = `import { VideoPlayer } from 'tint/video-player'

<VideoPlayer
  src="/videos/big-buck-bunny.mp4"
  label="Big Buck Bunny"
  poster="/images/poster.jpg"
  playbackSpeeds={[0.5, 1, 1.5, 2]}
  onPlay={() => analytics.track('play')}
/>`

const viaMediaPlayer = `import { MediaPlayer } from 'tint/media-player'

// Identical surface, reached through the unified entry point.
<MediaPlayer kind="video" src="/videos/clip.mp4" label="Clip" />`

const props = [
  { name: 'src', type: 'string', required: true, description: 'Video source URL. An object URL from a recording works too.' },
  { name: 'label', type: 'string', defaultValue: "'Video'", description: 'Accessible name for the media element and the generated control labels.' },
  { name: 'title', type: 'ReactNode', description: 'Visible title above the timeline. Falls back to `label`.' },
  { name: 'poster', type: 'string', description: 'Image shown before playback begins.' },
  { name: 'duration', type: 'number', description: 'Known duration, shown before metadata loads so the timeline does not jump.' },
  { name: 'playbackSpeeds', type: 'readonly number[]', defaultValue: '[0.5, 1, 1.5, 2]', description: 'Rates offered in the settings popout.' },
  { name: 'autoHideControls', type: 'boolean', defaultValue: 'true', description: 'Hide the chrome until hover or focus. Set false to pin it open.' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", defaultValue: "'lg'", description: 'Max width tier: sm 36rem, md 48rem, lg 56rem. Not the container-query tier MediaPlayer’s audio surface uses.' },
  { name: 'shadow', type: 'boolean', defaultValue: 'false', description: 'Adds the reference design’s offset shadow.' },
  { name: 'onPlay', type: '() => void', description: 'Called when playback starts.' },
  { name: 'onPause', type: '() => void', description: 'Called when playback pauses.' },
  { name: 'className', type: 'string', description: 'Extra classes for the player root.' },
]

export function VideoPlayerDoc() {
  return (
    <DocsPage
      route="components/video-player"
      title="Video Player"
      intro={
        <>
          The immersive video surface: a floating control bar over the frame, with
          transport, seek, volume, a searchable speed picker, and fullscreen. It is what{' '}
          <code>MediaPlayer</code> renders for <code>kind="video"</code>, and it is
          exported directly for hosts that only ever show video.
        </>
      }
      note={
        <>
          Fullscreen targets the container rather than the raw{' '}
          <code>&lt;video&gt;</code>, so the custom chrome survives — the browser’s
          native fullscreen video UI would otherwise replace it.
        </>
      }
    >
      <DocsSection id="preview" title="Preview">
        <DocsPreview>
          <VideoPlayer
            src="/videos/big-buck-bunny.mp4"
            label="Big Buck Bunny"
            title="Big Buck Bunny"
            autoHideControls={false}
          />
        </DocsPreview>
      </DocsSection>

      <DocsSection
        id="usage"
        title="Usage"
        description="Uncontrolled playback: the element owns time, volume, and rate, and the callbacks report transitions. Everything the host needs to coordinate — the queue, analytics, what plays next — comes back through onPlay/onPause."
      >
        <CodeBlock code={usage} />
        <h3 className="mt-8 mb-3 text-base font-semibold text-tint-ink">
          Through MediaPlayer
        </h3>
        <CodeBlock code={viaMediaPlayer} />
        <div className="mt-4 rounded-xl border border-tint-border bg-tint-surface/60 p-4 text-sm leading-6 text-tint-muted">
          <strong className="font-semibold text-tint-ink">
            The two surfaces are not interchangeable.
          </strong>{' '}
          <code>MediaPlayer kind="audio"</code> picks its tier from its container width
          via container queries; <code>size</code> here is a plain max-width. And the
          audio-only props — <code>waveform</code>, <code>artist</code>,{' '}
          <code>artwork</code>, <code>onPrevious</code>, <code>onNext</code> — have no
          effect on video.
        </div>
        <div className="mt-4 rounded-xl border border-tint-warning/40 bg-tint-warning-soft p-4 text-sm leading-6 text-tint-warning-ink">
          <strong className="font-semibold">No captions yet.</strong> There is no prop for
          a <code>&lt;track&gt;</code>, so subtitles and captions cannot be attached
          through tint today. A video that needs them has to be composed by the host.
        </div>
      </DocsSection>

      <DocsSection id="api" title="API">
        <PropsTable rows={props} />
        <p className="mt-4 text-sm leading-6 text-tint-muted">
          Remaining <code>&lt;video&gt;</code> attributes — <code>loop</code>,{' '}
          <code>muted</code>, <code>preload</code>, <code>playsInline</code> — pass
          straight through. <code>controls</code> is excluded, since the point is the
          custom chrome.
        </p>
      </DocsSection>
    </DocsPage>
  )
}
