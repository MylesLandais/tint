# Research brief: Vercel AI SDK and AI Elements

> **Status: not yet studied.** No source revision has been recorded. This brief
> lists the questions for M2. It does not adopt anything or imply a dependency.

- **Sources:** <https://github.com/vercel/ai> and <https://github.com/vercel/ai-elements>
- **Why:** they define streaming message representations, typed tool contracts,
  incremental rendering, transport abstraction, and reusable compositions for
  conversations, tool runs, attachments and artifacts.

## Questions

1. What is the message-part model (text, reasoning, tool call, tool result,
   file, source), and how does it compare with Tint `chat` (`ChatPart`,
   `ChatTool`, `ChatReasoning`, `ChatArtifact`, `ChatApproval`)?
2. How are tool input and output typed end to end, and how do approvals
   interrupt a stream?
3. What does the transport abstraction look like? Compare it with the
   `TintClient` adapters and Nebula's existing stream contracts (timeline
   cursors, event sequences, SSE), using the consumer's contract inventory.
4. How is partial output rendered without layout shift, and how are streamed
   updates announced to assistive technology?
5. Which AI Elements compositions are missing from Tint, and which overlap with it?

## Deliverable

Record the commit studied, the patterns verified in source, a comparison with
the existing Gateway contracts, Svelte compatibility, and a recommendation with
the reason.
