import type { NodeRuntimeSummary, ValidationIssue } from '../contracts'

/**
 * What a node's chrome shows: its runtime state, or the worst thing wrong with
 * it when it is not running.
 *
 * One vocabulary, shared. There were three — `NodeRuntimeSummary.status`
 * (`idle | running | succeeded | failed`), each node view's own private set
 * (`ready | invalid | warn | error | queue`), and a label mapper that rendered
 * `idle` as "queue" and `succeeded` as "DONE" — so the same node could be
 * described three different ways depending on which file you read, and
 * `graph.css` had to carry selectors for the union of all of them.
 */
export type NodeStatus =
  | 'ready'
  | 'error'
  | 'warning'
  | 'idle'
  | 'running'
  | 'succeeded'
  | 'failed'

/**
 * Runtime wins while a run is in progress or has finished, because it is the
 * more specific claim: a node with a validation warning that is *running* should
 * read as running. Validation only speaks when the runtime has nothing to say.
 */
export function resolveNodeStatus(
  validation: readonly ValidationIssue[],
  runtime: NodeRuntimeSummary | undefined,
): NodeStatus {
  if (runtime?.status === 'running') return 'running'
  if (runtime?.status === 'failed') return 'failed'
  if (runtime?.status === 'succeeded') return 'succeeded'
  if (validation.some((issue) => issue.severity === 'error')) return 'error'
  if (validation.some((issue) => issue.severity === 'warning')) return 'warning'
  if (runtime?.status === 'idle') return 'idle'
  return 'ready'
}

const LABELS: Record<NodeStatus, string> = {
  ready: 'ready',
  error: 'ERROR',
  warning: 'WARN',
  idle: 'queued',
  running: 'RUN',
  succeeded: 'DONE',
  failed: 'FAIL',
}

export function nodeStatusLabel(status: NodeStatus): string {
  return LABELS[status]
}
