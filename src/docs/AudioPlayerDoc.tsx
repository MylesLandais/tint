import { useState } from 'react'
import { AudioPlayer } from '../components/audio-player'
import { CodeBlock } from './components/CodeBlock'
import { DocsNav } from './components/DocsNav'
import { PropsTable } from './components/PropsTable'

const DEMO_SRC = '/videos/big-buck-bunny.mp4'
const WAVEFORM = [
  4, 9, 13, 7, 18, 11, 6, 16, 21, 9, 14, 6, 12, 19, 8, 15, 23, 10, 17, 7, 13, 20, 11,
  5, 16, 9, 18, 12, 7, 14, 10,
]

const TRACKS = [
  { title: 'Reverberation', artist: 'Substance & Vainqueur' },
  { title: 'Signal Bloom', artist: 'Tint Sessions' },
  { title: 'Quiet Current', artist: 'Tint Sessions' },
] as const

const usageCode = `import { AudioPlayer } from 'tint/audio-player'

export function MiniPlayer() {
  return (
    <AudioPlayer
      src="/audio/reverberation.mp3"
      label="Reverberation by Substance & Vainqueur"
      title="Reverberation"
      artist="Substance & Vainqueur"
      artwork="/art/reverberation.jpg"
      onPrevious={() => queue.previous()}
      onNext={() => queue.next()}
    />
  )
}`

const shadowCode = `<AudioPlayer
  src="/audio/reverberation.mp3"
  label="Reverberation"
  shadow
/>

// shadow is false by default`

const props = [
  {
    name: 'src',
    type: 'string',
    required: true,
    description: 'URL of the audio source, including object URLs from a recording.',
  },
  {
    name: 'label',
    type: 'string',
    required: true,
    description: 'Accessible player name and fallback title.',
  },
  {
    name: 'title',
    type: 'string',
    description: 'Visible track title. Falls back to label.',
  },
  {
    name: 'artist',
    type: 'string',
    description: 'Optional artist, speaker, or source.',
  },
  {
    name: 'artwork',
    type: 'string',
    description: 'Square artwork URL. Omit it for the themed music placeholder.',
  },
  {
    name: 'artworkAlt',
    type: 'string',
    defaultValue: "''",
    description: 'Artwork alt text; leave empty when the image repeats the track metadata.',
  },
  {
    name: 'duration',
    type: 'number',
    description: 'Known duration in seconds, used until media metadata loads.',
  },
  {
    name: 'waveform',
    type: 'readonly number[]',
    description: 'Optional decorative amplitude samples behind the seek rail.',
  },
  {
    name: 'shadow',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Opt into the offset reference-design shadow.',
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

export function AudioPlayerDoc() {
  const [trackIndex, setTrackIndex] = useState(0)
  const [shadow, setShadow] = useState(false)
  const track = TRACKS[trackIndex]

  const previous = () => setTrackIndex((index) => (index + TRACKS.length - 1) % TRACKS.length)
  const next = () => setTrackIndex((index) => (index + 1) % TRACKS.length)

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        <DocsNav current="components/audio-player" />
      </div>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 text-sm font-medium tracking-[0.08em] text-tint-accent uppercase">
            Components
          </p>
          <h1 className="mb-3 text-4xl font-semibold tracking-tight text-tint-ink sm:text-5xl">
            Audio Player
          </h1>
          <p className="text-lg leading-relaxed text-tint-muted">
            A small media rail with track artwork, transport controls, a precision seek line, and
            the same volume interaction as Video Player. Its layout reacts to its container rather
            than the browser viewport; the optional offset shadow remains disabled by default.
          </p>
        </div>

        <section id="preview" className="mb-14 scroll-mt-24">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Responsive preview</h2>
              <p className="mt-1 max-w-2xl text-tint-muted">
                Wide and constrained instances use the same component. Secondary controls recede
                as its own available width shrinks.
              </p>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-tint-ink">
              <input
                type="checkbox"
                checked={shadow}
                onChange={(event) => setShadow(event.currentTarget.checked)}
                className="size-4 accent-tint-accent"
              />
              Offset shadow
            </label>
          </div>

          <div className="space-y-8 rounded-xl border border-tint-border bg-tint-surface p-4 sm:p-8">
            <div>
              <p className="mb-3 text-xs font-medium tracking-widest text-tint-muted uppercase">
                Full rail
              </p>
              <AudioPlayer
                key={`wide-${trackIndex}`}
                src={DEMO_SRC}
                label={`${track.title} by ${track.artist}`}
                title={track.title}
                artist={track.artist}
                duration={634}
                waveform={WAVEFORM}
                shadow={shadow}
                onPrevious={previous}
                onNext={next}
              />
            </div>

            <div>
              <p className="mb-3 text-xs font-medium tracking-widest text-tint-muted uppercase">
                Narrow slot
              </p>
              <div className="w-full max-w-[22rem]">
                <AudioPlayer
                  key={`narrow-${trackIndex}`}
                  src={DEMO_SRC}
                  label={`${track.title} by ${track.artist}`}
                  title={track.title}
                  artist={track.artist}
                  duration={634}
                  waveform={WAVEFORM}
                  shadow={shadow}
                  onPrevious={previous}
                  onNext={next}
                />
              </div>
            </div>
          </div>
        </section>

        <section id="usage" className="mb-14 scroll-mt-24">
          <h2 className="mb-2 text-2xl font-semibold tracking-tight">Usage</h2>
          <p className="mb-6 max-w-2xl text-tint-muted">
            Navigation controls are intent callbacks; omit them for a single clip. The offset
            shadow is also opt-in, keeping embedded rows flat by default.
          </p>
          <div className="space-y-6">
            <CodeBlock code={usageCode} />
            <CodeBlock code={shadowCode} />
          </div>
        </section>

        <section id="api" className="scroll-mt-24">
          <h2 className="mb-2 text-2xl font-semibold tracking-tight">API</h2>
          <p className="mb-6 max-w-2xl text-tint-muted">
            Playback, seek, volume, buffering, and error state stay with the media element; hosts
            provide source metadata and optional queue intents.
          </p>
          <PropsTable rows={props} />
        </section>
      </main>
    </div>
  )
}
