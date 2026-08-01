import { VideoPlayer } from '@/components/video-player'
import { CodeBlock } from './components/CodeBlock'
import { PropsTable } from './components/PropsTable'

const DEMO_SRC =
  'https://videos.pexels.com/video-files/30333849/13003128_2560_1440_25fps.mp4'

const installCode = `npm install tint
# or copy the VideoPlayer component into your project`

const basicUsageCode = `import { VideoPlayer } from 'tint'

export function Example() {
  return (
    <VideoPlayer src="${DEMO_SRC}" />
  )
}`

const mediaCardUsageCode = `import { VideoPlayer } from 'tint'

export function MediaCard() {
  return (
    <article className="overflow-hidden rounded-xl border bg-white">
      <VideoPlayer
        src="/media/demo.mp4"
        poster="/media/poster.jpg"
        className="max-w-none rounded-none shadow-none"
      />
      <div className="space-y-2 p-4">
        <h3 className="text-lg font-semibold">Product walkthrough</h3>
        <p className="text-sm text-slate-600">
          Reinforce your content with embedded media, the same way a card uses images or video.
        </p>
      </div>
    </article>
  )
}`

const props = [
  {
    name: 'src',
    type: 'string',
    required: true,
    description: 'URL of the video to play.',
  },
  {
    name: 'poster',
    type: 'string',
    description: 'Optional poster image shown before playback begins.',
  },
  {
    name: 'className',
    type: 'string',
    description: 'Additional classes for the player root container.',
  },
  {
    name: 'autoHideControls',
    type: 'boolean',
    defaultValue: 'true',
    description: 'When true, the control bar appears on hover or focus.',
  },
  {
    name: 'onPlay',
    type: '() => void',
    description: 'Callback fired when playback starts.',
  },
  {
    name: 'onPause',
    type: '() => void',
    description: 'Callback fired when playback pauses.',
  },
]

export function VideoPlayerDoc() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-[var(--color-tint-border)] bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="inline-flex size-7 items-center justify-center rounded-md bg-[var(--color-tint-accent)] text-sm text-white">
              t
            </span>
            tint
          </a>
          <nav className="flex items-center gap-5 text-sm text-[var(--color-tint-muted)]">
            <a href="#preview" className="transition-colors hover:text-[var(--color-tint-ink)]">
              Preview
            </a>
            <a href="#usage" className="transition-colors hover:text-[var(--color-tint-ink)]">
              Usage
            </a>
            <a href="#api" className="transition-colors hover:text-[var(--color-tint-ink)]">
              API
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 text-sm font-medium tracking-[0.08em] text-[var(--color-tint-accent)] uppercase">
            Components
          </p>
          <h1 className="mb-3 text-4xl font-semibold tracking-tight text-[var(--color-tint-ink)] sm:text-5xl">
            Video Player
          </h1>
          <p className="text-lg leading-relaxed text-[var(--color-tint-muted)]">
            A reusable React video player with animated controls for play/pause, seek, volume, and
            playback speed. Built for media surfaces — product walkthroughs, card media, and
            documentation previews.
          </p>
        </div>

        <section id="preview" className="mb-14 scroll-mt-24">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Preview</h2>
              <p className="mt-1 text-[var(--color-tint-muted)]">
                Hover the player to reveal the control bar.
              </p>
            </div>
            <span className="rounded-md bg-[var(--color-tint-accent-soft)] px-2.5 py-1 text-xs font-medium text-[var(--color-tint-accent)]">
              Live demo
            </span>
          </div>

          <div className="rounded-2xl border border-[var(--color-tint-border)] bg-[var(--color-tint-panel)] p-4 shadow-sm sm:p-6">
            <div className="rounded-xl bg-[linear-gradient(160deg,#1a1d24_0%,#0f1115_100%)] p-3 sm:p-5">
              <VideoPlayer src={DEMO_SRC} />
            </div>
          </div>
        </section>

        <section id="usage" className="mb-14 scroll-mt-24">
          <h2 className="mb-2 text-2xl font-semibold tracking-tight">Usage</h2>
          <p className="mb-6 max-w-2xl text-[var(--color-tint-muted)]">
            Import the component and pass a video source. Additional native video attributes such as{' '}
            <code className="rounded bg-[var(--color-tint-surface)] px-1.5 py-0.5 text-[13px]">
              loop
            </code>{' '}
            and{' '}
            <code className="rounded bg-[var(--color-tint-surface)] px-1.5 py-0.5 text-[13px]">
              muted
            </code>{' '}
            are supported.
          </p>

          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-base font-semibold">Install</h3>
              <CodeBlock code={installCode} language="bash" />
            </div>

            <div>
              <h3 className="mb-3 text-base font-semibold">Basic</h3>
              <CodeBlock code={basicUsageCode} />
            </div>

            <div>
              <h3 className="mb-3 text-base font-semibold">Media card pattern</h3>
              <p className="mb-3 text-sm text-[var(--color-tint-muted)]">
                Pair the player with surrounding content the way Material UI Card media examples
                reinforce a subject with image or video.
              </p>
              <CodeBlock code={mediaCardUsageCode} />
            </div>
          </div>
        </section>

        <section id="features" className="mb-14 scroll-mt-24">
          <h2 className="mb-2 text-2xl font-semibold tracking-tight">Features</h2>
          <p className="mb-6 max-w-2xl text-[var(--color-tint-muted)]">
            Focused controls for common media theme use cases without shipping a full player
            framework.
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              'Play / pause with click-to-toggle on the video surface',
              'Seek scrubber with spring-animated progress fill',
              'Mute toggle and volume slider',
              'Playback speed presets: 0.5x, 1x, 1.5x, 2x',
              'Auto-hiding control bar on hover and keyboard focus',
              'Accepts standard HTML video attributes',
            ].map((feature) => (
              <li
                key={feature}
                className="rounded-xl border border-[var(--color-tint-border)] bg-[var(--color-tint-panel)] px-4 py-3 text-sm text-[var(--color-tint-ink)]"
              >
                {feature}
              </li>
            ))}
          </ul>
        </section>

        <section id="api" className="scroll-mt-24">
          <h2 className="mb-2 text-2xl font-semibold tracking-tight">API</h2>
          <p className="mb-6 max-w-2xl text-[var(--color-tint-muted)]">
            Props for <code className="rounded bg-[var(--color-tint-surface)] px-1.5 py-0.5 text-[13px]">VideoPlayer</code>.
            Required props are marked with an asterisk.
          </p>
          <PropsTable rows={props} />
        </section>
      </main>

      <footer className="border-t border-[var(--color-tint-border)] py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 text-sm text-[var(--color-tint-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>tint · React component library</span>
          <span>Video Player is the first published component.</span>
        </div>
      </footer>
    </div>
  )
}
