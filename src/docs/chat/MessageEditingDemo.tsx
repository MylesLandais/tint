import { useState } from 'react'
import { ChatMessage, ChatMessageAlternatives, ChatMessageEditor } from '../../components/chat'

export function MessageEditingDemo() {
  const [versions, setVersions] = useState(['The observatory opens at dusk.', 'Meet me beside the telescope.'])
  const [selected, setSelected] = useState(0)
  const [draft, setDraft] = useState<string | null>(null)
  return <ChatMessage message={{ id: 'example', actor: { id: 'aster', name: 'Aster', kind: 'assistant' },
    createdAt: '2026-09-13T18:00:00Z', status: 'complete',
    parts: [{ id: 'text', type: 'text', text: versions[selected] }] }}
    footer={draft === null ? <div className="flex flex-wrap items-center gap-3">
      <ChatMessageAlternatives alternatives={versions.map((_, index) => ({ id: String(index) }))}
        value={String(selected)} onValueChange={(id) => setSelected(Number(id))}
        onRegenerate={() => { setVersions([...versions, `Demo response ${versions.length + 1}: the stars are bright tonight.`]); setSelected(versions.length) }} />
      <button type="button" className="text-xs underline" onClick={() => setDraft(versions[selected])}>Edit message</button>
    </div> : <ChatMessageEditor value={draft} onValueChange={setDraft} onCancel={() => setDraft(null)}
      onSave={() => { setVersions([...versions, draft]); setSelected(versions.length); setDraft(null) }} />} />
}
