# tint

Tint is a React component library. The first component is **VideoPlayer** — a reusable player with animated controls for play/pause, seek, volume, and playback speed.

## Quick start

```bash
npm install
npm run dev
```

Open the docs site to preview the component and copy usage examples.

## Using the component

```tsx
import { VideoPlayer } from 'tint'

export function Example() {
  return <VideoPlayer src="/media/demo.mp4" />
}
```

## Project layout

```
src/
  components/video-player/   # reusable VideoPlayer
  docs/                      # static documentation page
  index.ts                   # library exports
```

## Scripts

| Command         | Description                |
| --------------- | -------------------------- |
| `npm run dev`   | Start the docs site        |
| `npm run build` | Typecheck and build docs   |
| `npm run lint`  | Lint the project           |
