/**
 * Character Card V2 (`chara_card_v2`) as SillyTavern and the public spec
 * describe it. Optional fields may be absent; `extensions` must survive a
 * round-trip even when this editor does not understand a key.
 *
 * @see https://github.com/malfoyslastname/character-card-spec-v2
 */

export type CharacterBookPosition = 'before_char' | 'after_char'

export type CharacterBookEntry = {
  keys: string[]
  content: string
  extensions: Record<string, unknown>
  enabled: boolean
  insertion_order: number
  case_sensitive?: boolean
  name?: string
  priority?: number
  id?: number
  comment?: string
  selective?: boolean
  secondary_keys?: string[]
  constant?: boolean
  position?: CharacterBookPosition
}

export type CharacterBook = {
  name?: string
  description?: string
  scan_depth?: number
  token_budget?: number
  recursive_scanning?: boolean
  extensions: Record<string, unknown>
  entries: CharacterBookEntry[]
}

export type DepthPrompt = {
  depth: number
  prompt: string
  role: string
}

export type TavernCardV2Data = {
  name: string
  description: string
  personality: string
  scenario: string
  first_mes: string
  mes_example: string
  creator_notes: string
  system_prompt: string
  post_history_instructions: string
  alternate_greetings: string[]
  character_book?: CharacterBook
  tags: string[]
  creator: string
  character_version: string
  extensions: Record<string, unknown>
}

export type TavernCardV2 = {
  spec: 'chara_card_v2'
  spec_version: '2.0'
  data: TavernCardV2Data
}

export const TINT_DEPTH_PROMPT_KEY = 'depth_prompt'
export const TINT_TALKATIVENESS_KEY = 'talkativeness'
