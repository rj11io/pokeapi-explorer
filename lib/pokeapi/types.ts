export const GENERATION_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const

export type GenerationId = (typeof GENERATION_IDS)[number]

export const EXPLORER_SECTIONS = [
  "search",
  "pokemon",
  "moves",
  "abilities",
  "items",
  "types",
] as const

export type ExplorerSection = (typeof EXPLORER_SECTIONS)[number]

export type NamedResource = {
  name: string
  url: string
}

export type BaseExplorerRow = {
  id: number
  name: string
  label: string
}

export type PokemonRow = BaseExplorerRow & {
  kind: "pokemon"
  types: string[]
  abilities: string[]
  stats: Record<string, number>
  statTotal: number
}

export type MoveRow = BaseExplorerRow & {
  kind: "move"
  type: string
  damageClass: string
  power: number | null
  accuracy: number | null
  pp: number | null
  description: string
}

export type AbilityRow = BaseExplorerRow & {
  kind: "ability"
  description: string
}

export type ItemRow = BaseExplorerRow & {
  kind: "item"
  description: string
}

export type ExplorerRow = PokemonRow | MoveRow | AbilityRow | ItemRow

export type DamageCell = {
  attacking: string
  defending: string
  multiplier: number
}

export type TypeChart = {
  types: string[]
  cells: DamageCell[]
}

export type GenerationOverview = {
  id: GenerationId
  label: string
  roman: string
  region: string
  games: string[]
}

export type SectionPayload = {
  rows: ExplorerRow[]
  note?: string
}
