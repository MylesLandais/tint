import { VideoPlayer } from '@/components/video-player'
import { CodeBlock } from './components/CodeBlock'
import { PropsTable } from './components/PropsTable'
import { ThemeControls } from './components/ThemeControls'

const DEMO_SRC = '/videos/big-buck-bunny.mp4'

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
        src="/videos/big-buck-bunny.mp4"
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

const settingsUsageCode = `import { SettingsPopout } from 'tint'
import { useState } from 'react'

const items = [
  { id: 'speed-1', label: '1x', group: 'Playback speed' },
  { id: 'speed-1.5', label: '1.5x', group: 'Playback speed' },
  { id: 'speed-2', label: '2x', group: 'Playback speed' },
]

export function SettingsExample() {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('speed-1')

  return (
    <SettingsPopout
      isOpen={open}
      onOpenChange={setOpen}
      items={items}
      value={value}
      onSelect={setValue}
      label="Player settings"
    />
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

const settingsProps = [
  {
    name: 'isOpen',
    type: 'boolean',
    required: true,
    description: 'Whether the settings popout is visible.',
  },
  {
    name: 'onOpenChange',
    type: '(isOpen: boolean) => void',
    required: true,
    description: 'Called when the popout should open or close.',
  },
  {
    name: 'items',
    type: 'SettingsPopoutItem[]',
    required: true,
    description: 'Selectable settings items, optionally grouped.',
  },
  {
    name: 'value',
    type: 'string',
    description: 'Currently selected item id in picker mode.',
  },
  {
    name: 'onSelect',
    type: '(id: string) => void',
    description: 'Called when an item is selected.',
  },
  {
    name: 'placeholder',
    type: 'string',
    defaultValue: "'Search settings…'",
    description: 'Placeholder text for the search input.',
  },
]

export function VideoPlayerDoc() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-tint-border bg-tint-panel/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="inline-flex size-7 items-center justify-center rounded-md bg-tint-accent text-sm text-tint-on-accent">
              t
            </span>
            tint
          </a>
          <nav className="flex items-center gap-5 text-sm text-tint-muted">
            <a
              href="#/components/chat"
              className="transition-colors hover:text-tint-ink"
            >
              Chat
            </a>
            <a
              href="#/chat/patterns"
              className="transition-colors hover:text-tint-ink"
            >
              Chat research
            </a>
            <a href="#preview" className="transition-colors hover:text-tint-ink">
              Preview
            </a>
            <a href="#usage" className="transition-colors hover:text-tint-ink">
              Usage
            </a>
            <a href="#api" className="transition-colors hover:text-tint-ink">
              API
            </a>
            <ThemeControls />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 text-sm font-medium tracking-[0.08em] text-tint-accent uppercase">
            Components
          </p>
          <h1 className="mb-3 text-4xl font-semibold tracking-tight text-tint-ink sm:text-5xl">
            Video Player
          </h1>
          <p className="text-lg leading-relaxed text-tint-muted">
            A reusable React video player with a compact control bar — seek, a vertical volume
            drawer, and a CommandPalette-style settings popout. Click the video surface to play
            or pause.
          </p>
        </div>

        <section id="preview" className="mb-14 scroll-mt-24">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Preview</h2>
              <p className="mt-1 text-tint-muted">
                Demo uses Big Buck Bunny from{' '}
                <a
                  href="https://test-videos.co.uk/bigbuckbunny/mp4-h264"
                  className="text-tint-accent underline-offset-2 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  test-videos.co.uk
                </a>
                . Volume and settings sit together on the right — hover the speaker,
                then type a value or drag the vertical slider.
              </p>
            </div>
            <span className="rounded-md bg-tint-accent-soft px-2.5 py-1 text-xs font-medium text-tint-accent">
              Live demo
            </span>
          </div>

          <div className="overflow-visible rounded-xl border border-tint-border bg-tint-panel p-4 shadow-sm sm:p-6">
            <div className="overflow-visible rounded-lg bg-[linear-gradient(160deg,#1a1d24_0%,#0f1115_100%)] p-3 sm:p-5">
              <VideoPlayer src={DEMO_SRC} />
            </div>
          </div>
        </section>

        <section id="usage" className="mb-14 scroll-mt-24">
          <h2 className="mb-2 text-2xl font-semibold tracking-tight">Usage</h2>
          <p className="mb-6 max-w-2xl text-tint-muted">
            Import the component and pass a video source. Playback toggles from the video surface;
            speed and other options live in the settings popout.
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
              <p className="mb-3 text-sm text-tint-muted">
                Pair the player with surrounding content the way Material UI Card media examples
                reinforce a subject with image or video.
              </p>
              <CodeBlock code={mediaCardUsageCode} />
            </div>

            <div>
              <h3 className="mb-3 text-base font-semibold">Settings popout</h3>
              <p className="mb-3 text-sm text-tint-muted">
                <code className="rounded bg-tint-surface px-1.5 py-0.5 text-[13px]">
                  SettingsPopout
                </code>{' '}
                is a searchable picker inspired by Astryx CommandPalette — grouped items, keyboard
                navigation, and a selected checkmark.
              </p>
              <CodeBlock code={settingsUsageCode} />
            </div>
          </div>
        </section>

        <section id="features" className="mb-14 scroll-mt-24">
          <h2 className="mb-2 text-2xl font-semibold tracking-tight">Features</h2>
          <p className="mb-6 max-w-2xl text-tint-muted">
            Focused controls for common media theme use cases without shipping a full player
            framework.
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              'Click the video surface to play or pause',
              'Compact control bar with seek plus volume and settings grouped on the right',
              'Vertical volume drawer with typed percentage input and slider',
              'Settings popout for playback speed (CommandPalette-style)',
              'Auto-hiding control bar on hover and keyboard focus',
              'Accepts standard HTML video attributes',
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
            <p className="mb-6 max-w-2xl text-tint-muted">
              Props for{' '}
              <code className="rounded bg-tint-surface px-1.5 py-0.5 text-[13px]">
                VideoPlayer
              </code>
              . Required props are marked with an asterisk.
            </p>
            <PropsTable rows={props} />
          </div>

          <div>
            <h3 className="mb-2 text-xl font-semibold tracking-tight">SettingsPopout</h3>
            <p className="mb-6 max-w-2xl text-tint-muted">
              Reusable searchable settings picker used by the player gear menu.
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
