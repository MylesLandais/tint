/**
 * Identity of a value that can flow through a graph socket.
 *
 * A wildcard accepts any peer type. A union accepts any of the listed type
 * names (in addition to an exact match on {@link SocketType.name}).
 */
export interface SocketType {
  name: string
  wildcard?: boolean
  /** Alternate type names this socket also accepts or produces. */
  union?: readonly string[]
}

/**
 * Declaration of a socket on a node definition: its type plus evaluation flags.
 *
 * `rawLink` and `lazy` mirror host graph-runtime options (pass the link instead
 * of the resolved value; defer evaluation until the node asks for the input).
 */
export interface SocketSpec {
  type: SocketType
  rawLink?: boolean
  lazy?: boolean
}

/**
 * A socket as exposed on a node: typed payload shape plus UI/host metadata.
 *
 * `matchType` is an optional secondary key hosts may use when wiring sockets
 * whose {@link Socket.dataType} names alone are not enough to decide
 * compatibility. `extensions` is an opaque bag for host-specific data; Tint
 * never reads or writes it.
 */
export interface Socket {
  dataType: SocketType
  isList: boolean
  tooltip?: string
  matchType?: string
  extensions: Readonly<Record<string, unknown>>
}
