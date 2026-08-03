# TypeScript API

The source below is the exported contract used by Tint’s chat components. It is available from
both `tint` and the focused `tint/chat` package subpath. It defines the vocabulary that
applications normalize their data into.

## Data model

`ChatMessageData<TCustomPart>` contains stable identity, actor, timestamps, lifecycle state, and
an ordered array of parts. It avoids a broad bag of optional fields and does not reuse a model
provider’s wire format.

Key decisions:

- Actors use `human | assistant | system | tool`, allowing both human messaging and AI agents.
- Alignment is a component concern, not inferred from an AI role.
- Message and part lifecycle states are independent.
- Attachments are controlled data, including upload progress and error state.
- Tool and approval data are serializable; React nodes are never stored in messages.
- Application-defined content extends the union through a generic custom part.
- Timestamps accept ISO strings, epoch numbers, or `Date`; formatting remains a presentation
  concern.

## Component props

The component props follow Tint’s current conventions:

- Compound roots extend the closest native element’s attributes.
- Controlled values use explicit `on…Change` callbacks.
- Events carry object payloads so the contract can grow without positional arguments.
- Message list behavior can be controlled from a local component or an external store.
- All rich rendering can be overridden with one typed `renderPart` function.

## Presentation-only boundary

The package intentionally does not include:

- `ChatProvider`, `ChatStore`, selectors, or a conversation context.
- `sendMessage`, `subscribe`, or backend adapter interfaces.
- Stream chunk types or a reducer tied to a specific AI SDK.
- Conversation CRUD, pagination cursor, or persistence types.
- Tool handler functions that execute application code.

Those interfaces belong to applications or a future headless package, not `tint`.

## Event semantics

| Callback | Meaning |
| --- | --- |
| `onSubmit(payload)` | The user submitted the current text and attachment set |
| `onStop()` | The user requested cancellation of current generation |
| `onMessageAction(payload)` | The user invoked copy, retry, edit, delete, reply, feedback, or a custom action |
| `onToolApproval(payload)` | The user approved or denied a specific approval part |
| `onAttachmentAdd(files)` | The user selected or dropped local files |
| `onAttachmentRemove(id)` | The user removed a draft attachment |
| `onFollowOutputChange(value)` | The transcript entered or left sticky-follow mode |
| `onLoadEarlier()` | The transcript reached the history-loading boundary |

Callbacks report intent and do not imply a successful backend mutation.

## Exported source

The live contract and a compile-checked usage fixture are rendered beneath this page in the
documentation application. The interactive component demo is available at `#/components/chat`.
