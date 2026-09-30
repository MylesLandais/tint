<script lang="ts">
  import { GroupEditor, PersonaEditor, RegexRulesEditor, ImportReview,
    type GroupFields, type PersonaFields, type RegexRuleDocument } from '../../svelte/form'
  import DocPage from '../svelte/DocPage.svelte'
  import type { ApiRow } from '../svelte/types'

  let group = $state<GroupFields>({
    name: 'Evening crew', members: ['aria'], mutedMembers: [], strategy: 0, promptMode: 0,
    allowSelfReplies: false, delay: 2, prefix: 'Conversation:', suffix: 'End.', favorite: false,
  })
  let persona = $state<PersonaFields>({
    name: 'The Cartographer', title: 'Explorer', description: 'Maps distant places.', position: 4, depth: 2, role: 0,
  })
  let rules = $state<RegexRuleDocument[]>([{ scriptName: 'Trim spaces', findRegex: '\\s+$', replaceString: '', placement: [1, 2], disabled: false }])
  let imported = $state(false)
  const characters = [{ value: 'aria', label: 'Aria' }, { value: 'bea', label: 'Bea' }, { value: 'cora', label: 'Cora' }]
  const strategies = [{ value: 0, label: 'Manual' }, { value: 1, label: 'Round robin' }]
  const promptModes = [{ value: 0, label: 'Separate' }, { value: 1, label: 'Joined' }]
  const placements = [{ value: 1, label: 'User input' }, { value: 2, label: 'Assistant output' }]
  const rows = [
    { id: 'characters', label: 'Characters', files: 2, ready: 2, errors: 0 },
    { id: 'chats', label: 'Chats', files: 1, ready: 0, errors: 1 },
  ]
  const api: ApiRow[] = [
    { prop: 'GroupEditor.value / onValueChange', type: 'GroupFields / (value) => void', description: 'Host-owned group settings and ordered members.' },
    { prop: 'GroupEditor.characters / strategies / promptModes', type: 'readonly option[]', description: 'Current catalogs; unknown saved values remain selectable.' },
    { prop: 'PersonaEditor.value / onValueChange', type: 'PersonaFields / (value) => void', description: 'Host-owned persona and prompt placement.' },
    { prop: 'RegexRulesEditor.value / onValueChange', type: 'readonly RegexRuleDocument[] / (value) => void', description: 'Ordered rules; preserves fields the editor does not understand.' },
    { prop: 'ImportReview.rows / onImport', type: 'readonly ImportReviewRow[] / () => void', description: 'Review preserved files and emit import intent; the host performs persistence.' },
    { prop: 'disabled', type: 'boolean', description: 'Locks editor actions and inputs.' },
  ]
  const usage = `import { GroupEditor, PersonaEditor, RegexRulesEditor, ImportReview } from '@nebula/tint/form'

<GroupEditor value={group} onValueChange={(next) => group = next}
  {characters} {strategies} {promptModes} />
<PersonaEditor value={persona} onValueChange={(next) => persona = next} />
<RegexRulesEditor value={rules} onValueChange={(next) => rules = next} {placements} />
<ImportReview {rows} onImport={() => saveImport()} />`
</script>

<DocPage title="Roleplay Forms" description="Controlled group, persona, regex, and import review editors for roleplay data." importPath="@nebula/tint/form" {usage} {api} accessibility="Every editable field has an associated label. Ordered group members and regex rules expose named move and remove buttons. Disabled editors lock actions and inputs. ImportReview reports busy, error, and completion states semantically. The host owns values, rule execution, and import persistence.">
  <div class="roleplay-doc">
    <section aria-label="Group editor example">
      <h3>Group</h3>
      <GroupEditor value={group} onValueChange={(next) => group = next} {characters} {strategies} {promptModes} />
      <p role="status">Group members: {group.members.join(', ') || 'none'}</p>
    </section>
    <section aria-label="Persona editor example">
      <h3>Persona</h3>
      <PersonaEditor value={persona} onValueChange={(next) => persona = next} />
      <p role="status">Placement: {persona.position}</p>
    </section>
    <section aria-label="Regex editor example">
      <h3>Regex rules</h3>
      <RegexRulesEditor value={rules} onValueChange={(next) => rules = next} {placements} />
      <p role="status">Rules: {rules.length}</p>
    </section>
    <section aria-label="Import review example">
      <h3>Import review</h3>
      <ImportReview {rows} description="All source files remain available, even when some records cannot be read." notice="One chat has a read error." complete={imported} onImport={() => imported = true} />
    </section>
  </div>
</DocPage>

<style>
  .roleplay-doc { display: grid; gap: 2rem; }
  .roleplay-doc > section { display: grid; gap: .75rem; min-width: 0; }
  .roleplay-doc h3 { margin: 0; }
  .roleplay-doc p[role='status'] { margin: 0; color: var(--tint-muted); }
</style>
