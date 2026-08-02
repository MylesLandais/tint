# tint

Tint is a React component library. The first components are **VideoPlayer** and **SettingsPopout** — a media player with seek/volume controls and a CommandPalette-style settings picker for playback speed.

## Quick start

```bash
npm install
npm run dev
```

Open the docs site to preview the component and copy usage examples.

Demo video: [Big Buck Bunny](https://test-videos.co.uk/bigbuckbunny/mp4-h264) (MP4 H.264) stored at `public/videos/big-buck-bunny.mp4`.

## Using the component

```tsx
import { VideoPlayer } from 'tint'

export function Example() {
  return <VideoPlayer src="/videos/big-buck-bunny.mp4" />
}
```

## Project layout

```
src/
  components/video-player/     # reusable VideoPlayer
  components/settings-popout/  # searchable settings popout
  docs/                        # static documentation page
  index.ts                     # library exports
public/videos/                 # demo media assets
```

## Scripts

| Command         | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start the docs site      |
| `npm run build` | Typecheck and build docs |
| `npm run lint`  | Lint the project         |
