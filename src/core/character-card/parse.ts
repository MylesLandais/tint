import {
  TINT_DEPTH_PROMPT_KEY,
  TINT_TALKATIVENESS_KEY,
  type CharacterBook,
  type CharacterBookEntry,
  type DepthPrompt,
  type TavernCardV2,
  type TavernCardV2Data,
} from './types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => asString(item)) : []
}

export function emptyTavernCard(): TavernCardV2 {
  return {
    spec: 'chara_card_v2',
    spec_version: '2.0',
    data: emptyData(),
  }
}

function emptyData(): TavernCardV2Data {
  return {
    name: '',
    description: '',
    personality: '',
    scenario: '',
    first_mes: '',
    mes_example: '',
    creator_notes: '',
    system_prompt: '',
    post_history_instructions: '',
    alternate_greetings: [],
    tags: [],
    creator: '',
    character_version: '',
    extensions: {
      [TINT_TALKATIVENESS_KEY]: 0.5,
      [TINT_DEPTH_PROMPT_KEY]: { depth: 4, prompt: '', role: 'system' } satisfies DepthPrompt,
    },
    character_book: emptyBook(),
  }
}

function emptyBook(): CharacterBook {
  return {
    name: '',
    description: '',
    scan_depth: 50,
    token_budget: 2048,
    recursive_scanning: false,
    extensions: {},
    entries: [],
  }
}

export function emptyLoreEntry(): CharacterBookEntry {
  return {
    keys: [],
    content: '',
    extensions: {},
    enabled: true,
    insertion_order: 100,
    case_sensitive: false,
    selective: false,
    secondary_keys: [],
    constant: false,
    position: 'before_char',
  }
}

/**
 * Accept V2, a bare `data` object, or a V1 flat card. Unknown extension keys
 * are copied through; they are never dropped.
 */
export function parseTavernCard(input: unknown): TavernCardV2 {
  if (!isRecord(input)) return emptyTavernCard()

  if (input.spec === 'chara_card_v2' && isRecord(input.data)) {
    return { spec: 'chara_card_v2', spec_version: '2.0', data: parseData(input.data) }
  }

  if (isRecord(input.data)) {
    return { spec: 'chara_card_v2', spec_version: '2.0', data: parseData(input.data) }
  }

  return { spec: 'chara_card_v2', spec_version: '2.0', data: parseData(input) }
}

function parseData(raw: Record<string, unknown>): TavernCardV2Data {
  const defaults = emptyData()
  const extensions = isRecord(raw.extensions) ? raw.extensions : {}
  const depthRaw = isRecord(extensions[TINT_DEPTH_PROMPT_KEY])
    ? (extensions[TINT_DEPTH_PROMPT_KEY] as Record<string, unknown>)
    : {}

  return {
    name: asString(raw.name, defaults.name),
    description: asString(raw.description, defaults.description),
    personality: asString(raw.personality, defaults.personality),
    scenario: asString(raw.scenario, defaults.scenario),
    first_mes: asString(raw.first_mes ?? raw.firstMes, defaults.first_mes),
    mes_example: asString(raw.mes_example ?? raw.mesExample, defaults.mes_example),
    creator_notes: asString(raw.creator_notes ?? raw.creatorNotes, defaults.creator_notes),
    system_prompt: asString(raw.system_prompt ?? raw.systemPrompt, defaults.system_prompt),
    post_history_instructions: asString(
      raw.post_history_instructions ?? raw.postHistoryInstructions,
      defaults.post_history_instructions,
    ),
    alternate_greetings: asStringArray(raw.alternate_greetings ?? raw.alternateGreetings),
    tags: asStringArray(raw.tags),
    creator: asString(raw.creator, defaults.creator),
    character_version: asString(raw.character_version ?? raw.characterVersion, defaults.character_version),
    extensions: {
      ...defaults.extensions,
      ...extensions,
      [TINT_DEPTH_PROMPT_KEY]: {
        depth: asNumber(depthRaw.depth, 4),
        prompt: asString(depthRaw.prompt),
        role: asString(depthRaw.role, 'system'),
      } satisfies DepthPrompt,
    },
    character_book: parseBook(raw.character_book ?? raw.characterBook),
  }
}

function parseBook(raw: unknown): CharacterBook {
  const defaults = emptyBook()
  if (!isRecord(raw)) return defaults
  const extensions = isRecord(raw.extensions) ? raw.extensions : {}
  return {
    name: asString(raw.name, defaults.name),
    description: asString(raw.description, defaults.description),
    scan_depth: asNumber(raw.scan_depth ?? raw.scanDepth, defaults.scan_depth ?? 50),
    token_budget: asNumber(raw.token_budget ?? raw.tokenBudget, defaults.token_budget ?? 2048),
    recursive_scanning: asBoolean(
      raw.recursive_scanning ?? raw.recursiveScanning,
      defaults.recursive_scanning ?? false,
    ),
    extensions: { ...extensions },
    entries: Array.isArray(raw.entries) ? raw.entries.map(parseEntry) : [],
  }
}

function parseEntry(raw: unknown, index: number): CharacterBookEntry {
  const defaults = emptyLoreEntry()
  if (!isRecord(raw)) return { ...defaults, insertion_order: (index + 1) * 100 }
  const extensions = isRecord(raw.extensions) ? raw.extensions : {}
  const position = raw.position === 'after_char' ? 'after_char' : 'before_char'
  return {
    keys: asStringArray(raw.keys),
    content: asString(raw.content),
    extensions: { ...extensions },
    enabled: asBoolean(raw.enabled, true),
    insertion_order: asNumber(raw.insertion_order ?? raw.insertionOrder, (index + 1) * 100),
    case_sensitive: asBoolean(raw.case_sensitive ?? raw.caseSensitive, false),
    name: typeof raw.name === 'string' ? raw.name : undefined,
    priority: typeof raw.priority === 'number' ? raw.priority : undefined,
    id: typeof raw.id === 'number' ? raw.id : undefined,
    comment: typeof raw.comment === 'string' ? raw.comment : undefined,
    selective: asBoolean(raw.selective, false),
    secondary_keys: asStringArray(raw.secondary_keys ?? raw.secondaryKeys),
    constant: asBoolean(raw.constant, false),
    position,
  }
}

export function serializeTavernCard(card: TavernCardV2): string {
  return `${JSON.stringify(card, null, 2)}\n`
}

export function parseTavernCardJson(text: string): TavernCardV2 {
  return parseTavernCard(JSON.parse(text) as unknown)
}
