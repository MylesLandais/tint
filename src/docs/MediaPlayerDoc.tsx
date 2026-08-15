import { useState } from 'react'
import { MediaPlayer } from '../components/media-player'
import { CodeBlock } from './components/CodeBlock'
import { PropsTable } from './components/PropsTable'
import {
  DocsCallout,
  DocsDemo,
  DocsFooter,
  DocsPage,
  DocsSection,
  DocsTabs,
} from './components/DocsPage'

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

const previewDemoCode = `<MediaPlayer
  kind="audio"
  src={trackUrl}
  label={\`\${track.title} by \${track.artist}\`}
  title={track.title}
  artist={track.artist}
  artwork={artworkUrl}
  waveform={peaks}
  onPrevious={() => setTrackIndex(previous)}
  onNext={() => setTrackIndex(next)}
/>

<MediaPlayer
  kind="video"
  src="/videos/big-buck-bunny.mp4"
  label="Big Buck Bunny"
  title="Big Buck Bunny"
/>`

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

const mediaPlayerSignatureCode = `type MediaPlayerProps = MediaPlayerAudioProps | MediaPlayerVideoProps

type MediaPlayerBaseProps = {
  src: string
  label: string
  title?: string
  duration?: number
  waveform?: readonly number[]
  shadow?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onPlay?: () => void
  onPause?: () => void
  onPrevious?: () => void
  onNext?: () => void
}

type MediaPlayerAudioProps = MediaPlayerBaseProps & {
  kind: 'audio'
  artist?: string
  artwork?: string
  artworkAlt?: string
}

type MediaPlayerVideoProps = MediaPlayerBaseProps & {
  kind: 'video'
  poster?: string
  playbackSpeeds?: readonly number[]
  autoHideControls?: boolean
} & Omit<
  VideoHTMLAttributes<HTMLVideoElement>,
  'src' | 'poster' | 'className' | 'controls' | 'onPlay' | 'onPause'
>`

const settingsPopoutSignatureCode = `type SettingsPopoutProps = {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  items: readonly SettingsPopoutItem[]
  value?: string
  onSelect?: (id: string) => void
  label?: string
  placeholder?: string
  footer?: ReactNode
  emptySearchText?: ReactNode
}`

const SCENARIO_TABS = [
  { id: 'audio', label: 'Audio' },
  { id: 'video', label: 'Video' },
] as const

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
    badge: 'audio only',
    description: 'Optional artist, speaker, or source.',
  },
  {
    name: 'artwork',
    type: 'string',
    badge: 'audio only',
    description: 'Square artwork URL. Renders the white-label placeholder when omitted, or if it fails to load.',
  },
  {
    name: 'artworkAlt',
    type: 'string',
    defaultValue: "''",
    badge: 'audio only',
    description: 'Artwork alt text; leave empty when the image repeats the track metadata.',
  },
]

const videoOnlyProps = [
  {
    name: 'poster',
    type: 'string',
    badge: 'video only',
    description: 'Optional poster image shown before playback begins. Renders the white-label placeholder when omitted, or the source fails to load.',
  },
  {
    name: 'playbackSpeeds',
    type: 'readonly number[]',
    defaultValue: '[0.5, 1, 1.5, 2]',
    badge: 'video only · lg tier',
    description: 'Selectable rates in the settings popout.',
  },
  {
    name: 'autoHideControls',
    type: 'boolean',
    defaultValue: 'true',
    badge: 'video only',
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
  const [scenario, setScenario] = useState('audio')
  const track = TRACKS[trackIndex]

  const previous = () => setTrackIndex((index) => (index + TRACKS.length - 1) % TRACKS.length)
  const next = () => setTrackIndex((index) => (index + 1) % TRACKS.length)

  return (
    <DocsPage
      route="components/media-player"
      title="Media Player"
      intro="One entry point for two deliberate media presentations: immersive dark overlay chrome for video, and a compact responsive artwork rail for audio. Both share the same playback callbacks and accessible media primitives."
    >
      <DocsSection
        id="preview"
        title="Preview"
        description="The same component, resized. Set an explicit tier to override auto-detection, or clear it to let the container decide."
      >
        <div className="mb-4 flex flex-wrap items-center gap-4">
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
                className={`cursor-pointer rounded px-2 py-1 text-xs font-medium capitalize transition-colors ${
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

        <DocsDemo code={previewDemoCode}>
          <div className="space-y-8">
            <DocsTabs
              tabs={SCENARIO_TABS}
              active={scenario}
              onChange={setScenario}
              label="Media kind"
            />

            {scenario === 'audio' ? (
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
            ) : (
              <MediaPlayer
                key={`video-${broken}`}
                kind="video"
                src={broken ? BROKEN_SRC : VIDEO_DEMO_SRC}
                label="Big Buck Bunny"
                title="Big Buck Bunny"
                shadow={shadow}
                size={size}
              />
            )}

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
        </DocsDemo>
      </DocsSection>

      <DocsSection
        id="usage"
        title="Usage"
        description={
          <>
            <code>kind</code> is a required discriminant: TypeScript narrows the rest of the props
            by its value, so <code>poster</code> is a type error under <code>kind="audio"</code> and
            vice versa for <code>artwork</code>.
          </>
        }
      >
        <div className="space-y-6">
          <div>
            <h3 className="mb-3 text-base font-semibold text-tint-ink">Audio</h3>
            <CodeBlock code={audioUsageCode} />
          </div>
          <div>
            <h3 className="mb-3 text-base font-semibold text-tint-ink">Video</h3>
            <CodeBlock code={videoUsageCode} />
          </div>
          <div>
            <h3 className="mb-3 text-base font-semibold text-tint-ink">Size tiers</h3>
            <CodeBlock code={sizeUsageCode} />
          </div>
          <DocsCallout variant="warning" title="Demo audio streams from the network">
            The audio demo above loads{' '}
            <a
              className="text-tint-accent underline-offset-2 hover:underline"
              href="https://en.wikipedia.org/wiki/File:Opening_of_%22Never_Gonna_Give_You_Up%22.mp3"
              target="_blank"
              rel="noreferrer"
            >
              a remote stream
            </a>{' '}
            for this page only — your own players should point at URLs your app controls. Browsers
            also block autoplay with sound until the user interacts with the page; always start
            muted or paused.
          </DocsCallout>
        </div>
      </DocsSection>

      <DocsSection id="features" title="Features">
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
      </DocsSection>

      <DocsSection id="api" title="API" description="Shared props, present regardless of kind.">
        <div className="space-y-10">
          <div>
            <p className="mb-4 max-w-2xl text-sm text-tint-muted">
              The full prop signature, from the source:
            </p>
            <CodeBlock code={mediaPlayerSignatureCode} />
          </div>
          <PropsTable rows={baseProps} />
          <div>
            <h3 className="mb-3 text-lg font-semibold tracking-tight text-tint-ink">Audio-only</h3>
            <PropsTable rows={audioOnlyProps} />
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold tracking-tight text-tint-ink">Video-only</h3>
            <PropsTable rows={videoOnlyProps} />
            <p className="mt-3 text-sm text-tint-muted">
              Also accepts standard HTML video attributes (minus <code>src</code>,{' '}
              <code>poster</code>, <code>className</code>, <code>controls</code>).
            </p>
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold tracking-tight text-tint-ink">
              SettingsPopout
            </h3>
            <p className="mb-4 max-w-2xl text-sm text-tint-muted">
              Reusable searchable settings picker used by the playback-speed gear menu. The full
              prop signature, from the source:
            </p>
            <div className="mb-4">
              <CodeBlock code={settingsPopoutSignatureCode} />
            </div>
            <PropsTable rows={settingsProps} />
          </div>
        </div>
      </DocsSection>

      <DocsFooter>
        <span>Demo media: Big Buck Bunny (Blender Foundation)</span>
      </DocsFooter>
    </DocsPage>
  )
}
