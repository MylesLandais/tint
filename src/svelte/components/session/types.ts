import type { Snippet } from 'svelte'

/**
 * Projection types for channel sessions. A host maps its own authoritative
 * session (for Nebula: contracts generated from the gateway's Rust types) into
 * these view props. Tint renders them and reports intent; it never decides who
 * may control playback or which resources a viewer may see.
 */

export type SessionPrincipalKind = 'human' | 'agent' | 'service'
export type SessionChannelMode = 'text' | 'voice' | 'stage'
export type SessionActivity = 'watch' | 'listen' | 'game' | 'collaborate' | 'broadcast'
export type SessionParticipantState = 'pending' | 'participating' | 'suspended' | 'departed'
export type SessionPlaybackState = 'idle' | 'waiting' | 'playing' | 'paused' | 'stalled'

/**
 * `controller` enlarges targets and strengthens focus for TV and gamepad use.
 * It changes presentation only; the session contract is identical.
 */
export type SessionAppearance = 'desktop' | 'controller'

export type SessionParticipantView = {
  id: string
  name: string
  kind: SessionPrincipalKind
  state: SessionParticipantState
  avatarUrl?: string
  /** Devices attached to this one participant. */
  connections?: number
  ready?: boolean
  speaking?: boolean
  /** Granted capabilities, for display only. */
  capabilities?: readonly string[]
}

/** A queue request. A redacted request is one the viewer may not see. */
export type SessionRequestView = {
  id: string
  requestedBy: string
  score?: number
  myVote?: 1 | -1 | null
  current?: boolean
} & (
  | { redacted?: false; title: string; subtitle?: string; artwork?: string; durationMs?: number }
  | { redacted: true }
)

export type SessionHeaderProps = {
  channel: string
  activity: SessionActivity
  mode: SessionChannelMode
  live?: boolean
  participantCount?: number
  appearance?: SessionAppearance
  actions?: Snippet
  class?: string
}

export type ParticipantListProps = {
  participants: readonly SessionParticipantView[]
  label?: string
  appearance?: SessionAppearance
  class?: string
}

export type RequestQueueProps = {
  requests: readonly SessionRequestView[]
  label?: string
  emptyLabel?: string
  appearance?: SessionAppearance
  onVote?: (request: SessionRequestView, value: 1 | -1) => void
  footer?: Snippet
  class?: string
}

export type SyncStatusProps = {
  /** Authoritative playhead, in source milliseconds. */
  desiredMs: number
  /** This connection's media position, in source milliseconds. */
  observedMs: number
  state: SessionPlaybackState
  buffering?: boolean
  appearance?: SessionAppearance
  onResync?: () => void
  class?: string
}

export type StageViewProps = {
  label?: string
  state?: SessionPlaybackState
  waitingLabel?: string
  appearance?: SessionAppearance
  children: Snippet
  /** Content attached to the stage: captions, an agent avatar, reactions. */
  overlay?: Snippet
  class?: string
}
