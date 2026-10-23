import type { HTMLVideoAttributes } from 'svelte/elements'

export type MediaSize = 'sm' | 'md' | 'lg'

export type RemoteMediaController = {
  playing: boolean
  currentTime: number
  duration: number
  volume: number
  muted?: boolean
  onPlay: () => void
  onPause: () => void
  onSeek: (positionSeconds: number) => void
  onVolumeChange: (level: number) => void
}

export type MediaTextTrack = {
  src: string
  kind: 'captions' | 'subtitles' | 'descriptions' | 'chapters' | 'metadata'
  srcLang: string
  label: string
  default?: boolean
}

type MediaPlayerBaseProps = {
  src: string
  label: string
  title?: string
  duration?: number
  waveform?: readonly number[]
  shadow?: boolean
  size?: MediaSize
  class?: string
  onPlay?: () => void
  onPause?: () => void
  onPrevious?: () => void
  onNext?: () => void
}

export type MediaPlayerAudioProps = MediaPlayerBaseProps & {
  kind: 'audio'
  artist?: string
  artwork?: string
  artworkAlt?: string
  playing?: boolean
  playbackNonce?: number
  remote?: RemoteMediaController
  onEnded?: () => void
  preload?: 'none' | 'metadata' | 'auto'
  /** Called once for an owned media/play failure, with the exact prop source. */
  onError?: (src: string) => void
  /** Players in the same group pause their peers when native playback starts. */
  playbackGroup?: string
  /** A fresh ID expresses a new seek intent; consumed IDs do not replay in this mount. */
  seekRequest?: { id: string | number; src: string; positionSeconds: number; play?: boolean }
}

export type MediaPlayerVideoProps = MediaPlayerBaseProps & {
  kind: 'video'
  poster?: string
  tracks?: readonly MediaTextTrack[]
  playbackSpeeds?: readonly number[]
  autoHideControls?: boolean
} & Omit<HTMLVideoAttributes, 'src' | 'poster' | 'class' | 'controls' | 'onplay' | 'onpause'>

export type MediaPlayerProps = MediaPlayerAudioProps | MediaPlayerVideoProps
