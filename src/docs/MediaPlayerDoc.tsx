import { useState } from 'react'
import { MediaPlayer } from '../components/media-player'
import { CodeBlock } from './components/CodeBlock'
import { DocsNav } from './components/DocsNav'
import { PropsTable } from './components/PropsTable'

const VIDEO_DEMO_SRC = '/videos/big-buck-bunny.mp4'
const AUDIO_DEMO_SRC = 'https://upload.wikimedia.org/wikipedia/en/e/ef/Opening_of_%22Never_Gonna_Give_You_Up%22.mp3'
const AUDIO_ARTWORK_SRC = 'https://upload.wikimedia.org/wikipedia/en/3/34/RickAstleyNeverGonnaGiveYouUp7InchSingleCover.jpg'
const BROKEN_SRC = '/videos/does-not-exist.mp4'
const WAVEFORM = [
  4, 9, 13, 7, 18, 11, 6, 16, 21, 9, 14, 6, 12, 19, 8, 15, 23, 10, 17, 7, 13, 20, 11,
  5, 16, 9, 18, 12, 7, 14, 10,
]

const TRACKS = [
  { title: 'Opening of "Never Gonna Give You Up"', artist: 'Rick Astley' },
  { title: 'Signal Bloom', artist: 'Tint Sessions' },
  { title: 'Quiet Current', artist: 'Tint Sessions' },
] as const

const audioUsageCode = `import { MediaPlayer } from 'tint'

export function MiniPlayer() {
  return (
    <MediaPlayer
      kind="audio"
      src="https://upload.wikimedia.org/wikipedia/en/e/ef/Opening_of_%22Never_Gonna_Give_You_Up%22.mp3"
      label={'Opening of "Never Gonna Give You Up" by Rick Astley'}
      title={'Opening of "Never Gonna Give You Up"'}
      artist="Rick Astley"
      artwork="https://upload.wikimedia.org/wikipedia/en/3/34/RickAstleyNeverGonnaGiveYouUp7InchSingleCover.jpg"
      waveform={peaks}
      onPrevious={() => queue.previous()}
      onNext={() => queue.next()}
    />
  )
}`

const videoUsageCode = `import { MediaPlayer } from 'tint'

export function Example() {
  return (
    <MediaPlayer
      kind="video"
      src="/videos/big-buck-bunny.mp4"
      label="Big Buck Bunny"
      title="Big Buck Bunny"
    />
  )
}`

const sizeUsageCode = `<MediaPlayer kind="audio" src={src} label={label} size="sm" />
<MediaPlayer kind="audio" src={src} label={label} size="md" />
<MediaPlayer kind="audio" src={src} label={label} size="lg" />

// size is undefined by default: the tier is auto-detected from the
// player's own container width instead of a fixed prop.`

const baseProps = [
  {
    name: 'kind',
    type: "'audio' | 'video'",
    required: true,
    description: 'Discriminates the rest of the prop shape and which native element mounts.',
  },
  {
    name: 'src',
    type: 'string',
    required: true,
    description: 'URL of the media source, including object URLs from a recording.',
  },
  {
    name: 'label',
    type: 'string',
    required: true,
    description: 'Accessible name for the media element and every generated control label.',
  },
  {
    name: 'title',
    type: 'string',
    description: 'Visible title. Falls back to label.',
  },
  {
    name: 'duration',
    type: 'number',
    description: 'Known duration in seconds, used until media metadata loads.',
  },
  {
    name: 'waveform',
    type: 'readonly number[]',
    description: 'Optional decorative amplitude samples behind the seek rail, for either kind.',
  },
  {
    name: 'shadow',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Opt into the offset reference-design shadow.',
  },
  {
    name: 'size',
    type: "'sm' | 'md' | 'lg'",
    description: 'Explicit tier override. Auto-detected from the container width when omitted.',
  },
  {
    name: 'onPrevious / onNext',
    type: '() => void',
    description: 'Playlist intents. Each matching button is omitted when its callback is absent.',
  },
  {
    name: 'onPlay / onPause',
    type: '() => void',
    description: 'Called from the underlying media playback events.',
  },
  {
    name: 'className',
    type: 'string',
    description: 'Additional classes for sizing and positioning the player root.',
  },
]

const audioOnlyProps = [
  {
    name: 'artist',
    type: 'string',
    description: 'Optional artist, speaker, or source.',
  },
  {
    name: 'artwork',
    type: 'string',
    description: 'Square artwork URL. Renders the white-label placeholder when omitted, or if it fails to load.',
  },
  {
    name: 'artworkAlt',
    type: 'string',
    defaultValue: "''",
    description: 'Artwork alt text; leave empty when the image repeats the track metadata.',
  },
  {
    name: 'playing',
    type: 'boolean',
    description:
      'When true, seek to the start and play; when false, pause. Omit to leave transport under the player’s own controls.',
  },
  {
    name: 'playbackNonce',
    type: 'number',
    description:
      'When this value changes, seek to 0 and play. Chat Repeat uses it so the same src restarts instead of becoming a no-op.',
  },
  {
    name: 'onEnded',
    type: '() => void',
    description: 'Called when the clip finishes. Chat uses this to clear the conversation playback slot.',
  },
]

const videoOnlyProps = [
  {
    name: 'poster',
    type: 'string',
    description: 'Optional poster image shown before playback begins. Renders the white-label placeholder when omitted, or the source fails to load.',
  },
  {
    name: 'playbackSpeeds',
    type: 'readonly number[]',
    defaultValue: '[0.5, 1, 1.5, 2]',
    description: 'Selectable rates in the settings popout (lg tier only).',
  },
  {
    name: 'autoHideControls',
    type: 'boolean',
    defaultValue: 'true',
    description: 'Hide the control overlay until hover or focus. Set false to pin it open.',
  },
]

const settingsProps = [
  { name: 'isOpen', type: 'boolean', required: true, description: 'Whether the settings popout is visible.' },
  { name: 'onOpenChange', type: '(isOpen: boolean) => void', required: true, description: 'Called when the popout should open or close.' },
  { name: 'items', type: 'readonly SettingsPopoutItem[]', required: true, description: 'Selectable settings items, optionally grouped.' },
  { name: 'value', type: 'string', description: 'Currently selected item id in picker mode.' },
  { name: 'onSelect', type: '(id: string) => void', description: 'Called when an item is selected.' },
]

export function MediaPlayerDoc() {
  const [trackIndex, setTrackIndex] = useState(0)
  const [shadow, setShadow] = useState(false)
  const [size, setSize] = useState<'sm' | 'md' | 'lg' | undefined>(undefined)
  const [broken, setBroken] = useState(false)
  const track = TRACKS[trackIndex]

  const previous = () => setTrackIndex((index) => (index + TRACKS.length - 1) % TRACKS.length)
  const next = () => setTrackIndex((index) => (index + 1) % TRACKS.length)

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        <DocsNav current="components/media-player" />
      </div>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 text-sm font-medium tracking-[0.08em] text-tint-accent uppercase">
            Components
          </p>
          <h1 className="mb-3 text-4xl font-semibold tracking-tight text-tint-ink sm:text-5xl">
            Media Player
          </h1>
          <p className="text-lg leading-relaxed text-tint-muted">
            One entry point for two deliberate media presentations: immersive dark overlay chrome
            for video, and a compact responsive artwork rail for audio. Both share the same
            playback callbacks and accessible media primitives.
          </p>
        </div>

        <section id="preview" className="mb-14 scroll-mt-24">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Responsive preview</h2>
              <p className="mt-1 max-w-2xl text-tint-muted">
                The same component, resized. Set an explicit tier to override auto-detection, or
                clear it to let the container decide.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-tint-ink">
                <input
                  type="checkbox"
                  checked={shadow}
                  onChange={(event) => setShadow(event.currentTarget.checked)}
                  className="size-4 accent-tint-accent"
                />
                Offset shadow
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-tint-ink">
                <input
                  type="checkbox"
                  checked={broken}
                  onChange={(event) => setBroken(event.currentTarget.checked)}
                  className="size-4 accent-tint-accent"
                />
                Broken source
              </label>
              <div className="flex items-center gap-1 rounded-md border border-tint-border p-1">
                {(['auto', 'sm', 'md', 'lg'] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSize(option === 'auto' ? undefined : option)}
                    className={`rounded px-2 py-1 text-xs font-medium capitalize transition-colors ${
                      (size ?? 'auto') === option
                        ? 'bg-tint-accent text-tint-on-accent'
                        : 'text-tint-muted hover:text-tint-ink'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8 rounded-xl border border-tint-border bg-tint-surface p-4 sm:p-8">
            <div>
              <p className="mb-3 text-xs font-medium tracking-widest text-tint-muted uppercase">
                Audio
              </p>
              <p className="mb-3 max-w-2xl text-xs leading-5 text-tint-muted">
                Demo stream: <a className="text-tint-accent underline-offset-2 hover:underline" href="https://en.wikipedia.org/wiki/File:Opening_of_%22Never_Gonna_Give_You_Up%22.mp3" target="_blank" rel="noreferrer">Opening of &quot;Never Gonna Give You Up&quot;</a> by Rick Astley, loaded remotely for this demo only. <a className="text-tint-accent underline-offset-2 hover:underline" href="https://en.wikipedia.org/wiki/File:RickAstleyNeverGonnaGiveYouUp7InchSingleCover.jpg" target="_blank" rel="noreferrer">Artwork source</a>.
              </p>
              <MediaPlayer
                key={`audio-${trackIndex}-${broken}`}
                kind="audio"
                src={broken ? BROKEN_SRC : AUDIO_DEMO_SRC}
                label={`${track.title} by ${track.artist}`}
                title={track.title}
                artist={track.artist}
                artwork={AUDIO_ARTWORK_SRC}
                artworkAlt="Rick Astley Never Gonna Give You Up single cover"
                duration={trackIndex === 0 ? 21.312 : undefined}
                waveform={WAVEFORM}
                shadow={shadow}
                size={size}
                onPrevious={previous}
                onNext={next}
              />
            </div>

            <div>
              <p className="mb-3 text-xs font-medium tracking-widest text-tint-muted uppercase">
                Video
              </p>
              <MediaPlayer
                key={`video-${broken}`}
                kind="video"
                src={broken ? BROKEN_SRC : VIDEO_DEMO_SRC}
                label="Big Buck Bunny"
                title="Big Buck Bunny"
                shadow={shadow}
                size={size}
              />
            </div>

            <div>
              <p className="mb-3 text-xs font-medium tracking-widest text-tint-muted uppercase">
                Narrow slot (chat-bubble width)
              </p>
              <div className="w-full max-w-[20rem]">
                <MediaPlayer
                  key={`narrow-${trackIndex}`}
                  kind="audio"
                  src={AUDIO_DEMO_SRC}
                  label={`${track.title} by ${track.artist}`}
                  title={track.title}
                  artist={track.artist}
                  artwork={AUDIO_ARTWORK_SRC}
                  artworkAlt="Rick Astley Never Gonna Give You Up single cover"
                  duration={trackIndex === 0 ? 21.312 : undefined}
                  waveform={WAVEFORM}
                  shadow={shadow}
                />
              </div>
            </div>
          </div>
        </section>

        <section id="usage" className="mb-14 scroll-mt-24">
          <h2 className="mb-2 text-2xl font-semibold tracking-tight">Usage</h2>
          <p className="mb-6 max-w-2xl text-tint-muted">
            <code className="rounded bg-tint-surface px-1.5 py-0.5 text-[13px]">kind</code> is a
            required discriminant: TypeScript narrows the rest of the props by its value, so
            <code className="mx-1 rounded bg-tint-surface px-1.5 py-0.5 text-[13px]">poster</code>
            is a type error under <code className="rounded bg-tint-surface px-1.5 py-0.5 text-[13px]">kind=&quot;audio&quot;</code>
            and vice versa for <code className="mx-1 rounded bg-tint-surface px-1.5 py-0.5 text-[13px]">artwork</code>.
          </p>
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-base font-semibold">Audio</h3>
              <CodeBlock code={audioUsageCode} />
            </div>
            <div>
              <h3 className="mb-3 text-base font-semibold">Video</h3>
              <CodeBlock code={videoUsageCode} />
            </div>
            <div>
              <h3 className="mb-3 text-base font-semibold">Size tiers</h3>
              <CodeBlock code={sizeUsageCode} />
            </div>
          </div>
        </section>

        <section id="features" className="mb-14 scroll-mt-24">
          <h2 className="mb-2 text-2xl font-semibold tracking-tight">Features</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              'One entry point provides an immersive video player and a compact audio rail',
              'Canvas waveform with hover preview and click-to-seek, layered behind the accessible Slider',
              'White-label record placeholder for missing or broken audio artwork',
              'Three size tiers (sm/md/lg), auto-detected from container width or set explicitly',
              'Click the video surface to play or pause',
              'Title shown above the timeline, with a fullscreen toggle alongside settings and volume',
              'Settings popout for playback speed (video, lg tier)',
            ].map((feature) => (
              <li
                key={feature}
                className="rounded-xl border border-tint-border bg-tint-panel px-4 py-3 text-sm text-tint-ink"
              >
                {feature}
              </li>
            ))}
          </ul>
        </section>

        <section id="api" className="scroll-mt-24 space-y-10">
          <div>
            <h2 className="mb-2 text-2xl font-semibold tracking-tight">API</h2>
            <p className="mb-6 max-w-2xl text-tint-muted">Shared props, present regardless of kind.</p>
            <PropsTable rows={baseProps} />
          </div>
          <div>
            <h3 className="mb-2 text-xl font-semibold tracking-tight">Audio-only</h3>
            <PropsTable rows={audioOnlyProps} />
          </div>
          <div>
            <h3 className="mb-2 text-xl font-semibold tracking-tight">Video-only</h3>
            <PropsTable rows={videoOnlyProps} />
            <p className="mt-3 text-sm text-tint-muted">
              Also accepts standard HTML video attributes (minus{' '}
              <code className="rounded bg-tint-surface px-1.5 py-0.5 text-[13px]">src</code>,{' '}
              <code className="rounded bg-tint-surface px-1.5 py-0.5 text-[13px]">poster</code>,{' '}
              <code className="rounded bg-tint-surface px-1.5 py-0.5 text-[13px]">className</code>,{' '}
              <code className="rounded bg-tint-surface px-1.5 py-0.5 text-[13px]">controls</code>).
            </p>
          </div>
          <div>
            <h3 className="mb-2 text-xl font-semibold tracking-tight">SettingsPopout</h3>
            <p className="mb-6 max-w-2xl text-tint-muted">
              Reusable searchable settings picker used by the playback-speed gear menu.
            </p>
            <PropsTable rows={settingsProps} />
          </div>
        </section>
      </main>

      <footer className="border-t border-tint-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 text-sm text-tint-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>tint · React component library</span>
          <span>Demo media: Big Buck Bunny (Blender Foundation)</span>
        </div>
      </footer>
    </div>
  )
}
