import {
  createRequestId,
  throwIfAborted,
  type AsyncOperationOptions,
  type FormSubmitEnvelope,
  type FormTransport,
  type OperationResult,
} from '../../form/contracts'
import type { GraphCommand } from './commands'

/**
 * Turn a form submit into the command the reducer already understands.
 *
 * The canvas still reports plain `GraphCommand`s. This is the form-shaped
 * client contract: an envelope in, `node.configure` out. Command buses,
 * repositories, and SQL/PGQ stay in Appendix A.
 */
export function graphConfigureCommand(nodeId: string, values: unknown): GraphCommand {
  return { type: 'node.configure', nodeId, configuration: values }
}

export async function submitNodeConfiguration(
  dispatch: (command: GraphCommand) => void,
  nodeId: string,
  envelope: FormSubmitEnvelope,
  options?: AsyncOperationOptions,
): Promise<OperationResult<{ nodeId: string }>> {
  const requestId = createRequestId(options)
  throwIfAborted(options?.signal, requestId)
  dispatch(graphConfigureCommand(nodeId, envelope.values))
  return { requestId, value: { nodeId }, warnings: [] }
}

export function createGraphNodeFormTransport(
  dispatch: (command: GraphCommand) => void,
  nodeId: string,
): FormTransport {
  return {
    async validate(_envelope, options) {
      throwIfAborted(options?.signal, options?.requestId)
      return { ok: true, issues: [] }
    },
    async submit(envelope, options) {
      return submitNodeConfiguration(dispatch, nodeId, envelope, options)
    },
  }
}
