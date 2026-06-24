import type { GenerationId, GenerationOverview } from "./types"

export const GENERATIONS: Record<GenerationId, GenerationOverview> = {
  1: {
    id: 1,
    label: "Generation I",
    roman: "I",
    region: "Kanto",
    games: ["Red & Blue", "Yellow"],
  },
  2: {
    id: 2,
    label: "Generation II",
    roman: "II",
    region: "Johto",
    games: ["Gold & Silver", "Crystal"],
  },
  3: {
    id: 3,
    label: "Generation III",
    roman: "III",
    region: "Hoenn",
    games: ["Ruby & Sapphire", "Emerald", "FireRed & LeafGreen"],
  },
  4: {
    id: 4,
    label: "Generation IV",
    roman: "IV",
    region: "Sinnoh",
    games: ["Diamond & Pearl", "Platinum", "HeartGold & SoulSilver"],
  },
  5: {
    id: 5,
    label: "Generation V",
    roman: "V",
    region: "Unova",
    games: ["Black & White", "Black 2 & White 2"],
  },
  6: {
    id: 6,
    label: "Generation VI",
    roman: "VI",
    region: "Kalos",
    games: ["X & Y", "Omega Ruby & Alpha Sapphire"],
  },
  7: {
    id: 7,
    label: "Generation VII",
    roman: "VII",
    region: "Alola",
    games: ["Sun & Moon", "Ultra Sun & Ultra Moon", "Let's Go"],
  },
  8: {
    id: 8,
    label: "Generation VIII",
    roman: "VIII",
    region: "Galar & Hisui",
    games: ["Sword & Shield", "Brilliant Diamond & Shining Pearl", "Legends: Arceus"],
  },
  9: {
    id: 9,
    label: "Generation IX",
    roman: "IX",
    region: "Paldea",
    games: ["Scarlet & Violet", "Legends: Z-A"],
  },
}

export function isGenerationId(value: number): value is GenerationId {
  return Number.isInteger(value) && value >= 1 && value <= 9
}
