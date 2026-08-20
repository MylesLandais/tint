import { useRef, useState } from 'react'
import {
  CHARACTER_CARD_FORM_SCHEMA,
  CharacterCardEditorForm,
  bytesFromObjectUrl,
  embedTavernCard,
  emptyTavernCard,
  extractTavernCard,
  parseTavernCardJson,
  serializeTavernCard,
  type TavernCardV2,
} from '../../components/character-card'
import type { FormFileValue } from '../../components/form'
import '../../components/form/styles.css'
import { CodeBlock } from '../components/CodeBlock'
import { DocsPage, DocsPreview, DocsSection } from '../components/DocsPage'
import { PropsTable } from '../components/PropsTable'

const usage = `import { useState } from 'react'
import {
  CharacterCardEditorForm,
  emptyTavernCard,
  serializeTavernCard,
} from 'tint/character-card'
import 'tint/form/styles.css'

const [card, setCard] = useState(() => emptyTavernCard())

<CharacterCardEditorForm
  value={card}
  onValueChange={setCard}
  onSubmit={(envelope) => save(envelope.values)}
/>`

const props = [
  { name: 'value', type: 'TavernCardV2', required: true, description: 'The character card. Unknown extensions survive a round-trip.' },
  { name: 'onValueChange', type: '(card: TavernCardV2) => void', required: true, description: 'Receives the next card after any field edit.' },
  { name: 'avatar', type: 'FormFileValue | null', description: 'Portrait used for PNG export. Not part of the V2 JSON.' },
  { name: 'onAvatarChange', type: '(file: FormFileValue | null) => void', description: 'Fires when the avatar file field changes.' },
  { name: 'busy', type: 'boolean', description: 'Disables the form while a host persist is in flight.' },
  { name: 'error', type: 'ReactNode', description: 'Form-level alert.' },
  { name: 'className', type: 'string', description: 'Appended to the FormLayout root.' },
  { name: 'submitLabel', type: 'string', defaultValue: "'Save character'", description: 'Idle submit copy.' },
  { name: 'submittingLabel', type: 'string', defaultValue: "'Saving…'", description: 'Busy submit copy.' },
  { name: 'hideSubmit', type: 'boolean', description: 'Hide the submit button when a parent toolbar owns save.' },
  { name: 'transport', type: 'FormTransport', description: 'Optional persist seam. Same Promise rules as FormLayout.' },
  { name: 'onSubmit', type: '(envelope: FormSubmitEnvelope) => void | Promise<void>', description: 'Called after validation with the form envelope.' },
]

function download(filename: string, bytes: string | Uint8Array, type: string) {
  const blob =
    typeof bytes === 'string'
      ? new Blob([bytes], { type })
      : new Blob([Uint8Array.from(bytes).buffer as ArrayBuffer], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function CharacterCardDoc() {
  const [card, setCard] = useState<TavernCardV2>(() => {
    const next = emptyTavernCard()
    next.data.name = 'Aiko'
    next.data.description = 'A late-night barista with a pen tucked behind one ear.'
    next.data.personality = 'Sarcastic, quietly protective of regulars.'
    next.data.scenario = '{{user}} arrives just before closing.'
    next.data.first_mes = '"We\'re closed in ten. Sit down before you fall down."'
    next.data.tags = ['original', 'slice-of-life']
    next.data.creator = 'tint'
    next.data.character_version = '1.0'
    return next
  })
  const [avatar, setAvatar] = useState<FormFileValue | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const jsonInput = useRef<HTMLInputElement>(null)
  const pngInput = useRef<HTMLInputElement>(null)

  async function onExportPng() {
    const png = avatar?.objectUrl
      ? embedTavernCard(card, await bytesFromObjectUrl(avatar.objectUrl))
      : embedTavernCard(card)
    download(`${card.data.name || 'character'}.png`, png, 'image/png')
  }

  return (
    <DocsPage
      route="components/character-card"
      title="Character Card"
      intro="A SillyTavern-shaped Character Card V2 editor, composed on FormLayout. Identity, greetings, personality, prompt overrides, creator metadata, and embedded lore — plus JSON and PNG round-trips."
      note="Group chats, HotSwap, live tokenizer counts, and World Info file linking stay host-app features. This kit edits the card."
    >
      <DocsSection id="editor" title="Editor">
        <DocsPreview>
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-md border border-tint-border px-3 py-1.5 text-sm text-tint-ink hover:bg-tint-surface"
              onClick={() => jsonInput.current?.click()}
            >
              Import JSON
            </button>
            <button
              type="button"
              className="rounded-md border border-tint-border px-3 py-1.5 text-sm text-tint-ink hover:bg-tint-surface"
              onClick={() =>
                download(`${card.data.name || 'character'}.json`, serializeTavernCard(card), 'application/json')
              }
            >
              Export JSON
            </button>
            <button
              type="button"
              className="rounded-md border border-tint-border px-3 py-1.5 text-sm text-tint-ink hover:bg-tint-surface"
              onClick={() => pngInput.current?.click()}
            >
              Import PNG
            </button>
            <button
              type="button"
              className="rounded-md border border-tint-border px-3 py-1.5 text-sm text-tint-ink hover:bg-tint-surface"
              onClick={() => void onExportPng()}
            >
              Export PNG
            </button>
            <button
              type="button"
              className="rounded-md border border-tint-border px-3 py-1.5 text-sm text-tint-ink hover:bg-tint-surface"
              onClick={() => {
                setCard(emptyTavernCard())
                setAvatar((current) => {
                  if (current?.objectUrl) URL.revokeObjectURL(current.objectUrl)
                  return null
                })
                setMessage(null)
              }}
            >
              Reset
            </button>
            <input
              ref={jsonInput}
              className="sr-only"
              type="file"
              accept="application/json,.json"
              aria-label="Import character JSON"
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                if (!file) return
                void file.text().then((text) => {
                  try {
                    setCard(parseTavernCardJson(text))
                    setMessage(`Imported ${file.name}`)
                  } catch (cause) {
                    setMessage(cause instanceof Error ? cause.message : 'Could not parse JSON.')
                  }
                })
              }}
            />
            <input
              ref={pngInput}
              className="sr-only"
              type="file"
              accept="image/png,.png"
              aria-label="Import character PNG"
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                if (!file) return
                void file.arrayBuffer().then((buffer) => {
                  try {
                    setCard(extractTavernCard(new Uint8Array(buffer)))
                    setAvatar((current) => {
                      if (current?.objectUrl) URL.revokeObjectURL(current.objectUrl)
                      return {
                        name: file.name,
                        mimeType: file.type || 'image/png',
                        objectUrl: URL.createObjectURL(file),
                      }
                    })
                    setMessage(`Imported ${file.name}`)
                  } catch (cause) {
                    setMessage(cause instanceof Error ? cause.message : 'Could not read PNG.')
                  }
                })
              }}
            />
          </div>
          {message ? <p className="mt-0 mb-4 text-sm text-tint-muted">{message}</p> : null}
          <CharacterCardEditorForm
            value={card}
            onValueChange={setCard}
            avatar={avatar}
            onAvatarChange={setAvatar}
            onSubmit={() => setMessage('Saved in memory. Export JSON or PNG to take it with you.')}
          />
        </DocsPreview>
      </DocsSection>

      <DocsSection
        id="schema"
        title="Schema"
        description="The FormSchema the editor renders. Viewing it here is the same document FormLayout consumes."
      >
        <CodeBlock code={JSON.stringify(CHARACTER_CARD_FORM_SCHEMA, null, 2)} language="json" title="json" />
      </DocsSection>

      <DocsSection id="usage" title="Usage">
        <CodeBlock code={usage} />
      </DocsSection>

      <DocsSection id="api" title="API">
        <PropsTable rows={props} />
      </DocsSection>
    </DocsPage>
  )
}
