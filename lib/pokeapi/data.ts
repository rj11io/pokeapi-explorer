import { cache } from "react"

import { cleanDescription, humanizeIdentifier } from "./format"
import { fetchCsv, type CsvRecord } from "./csv"
import type {
  AbilityRow,
  ExplorerRow,
  GenerationId,
  ItemRow,
  MoveRow,
  PokemonRow,
  SectionPayload,
  TypeChart,
} from "./types"

const ENGLISH_LANGUAGE_ID = "9"

function numberOrNull(value: string) {
  if (value === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function groupBy(rows: CsvRecord[], key: string) {
  const grouped = new Map<string, CsvRecord[]>()
  for (const row of rows) {
    const value = row[key]
    const values = grouped.get(value) ?? []
    values.push(row)
    grouped.set(value, values)
  }
  return grouped
}

function proseMap(rows: CsvRecord[], idKey: string) {
  return new Map(
    rows
      .filter((row) => row.local_language_id === ENGLISH_LANGUAGE_ID)
      .map((row) => [row[idKey], cleanDescription(row.short_effect)])
  )
}

export const getPokemonRows = cache(
  async (generation: GenerationId): Promise<PokemonRow[]> => {
    const [speciesRows, pokemonRows, typeRows, pokemonTypeRows, pastTypeRows] =
      await Promise.all([
        fetchCsv("pokemon_species.csv"),
        fetchCsv("pokemon.csv"),
        fetchCsv("types.csv"),
        fetchCsv("pokemon_types.csv"),
        fetchCsv("pokemon_types_past.csv"),
      ])
    const [
      abilityRows,
      pokemonAbilityRows,
      pastAbilityRows,
      statRows,
      pokemonStatRows,
      pastStatRows,
    ] =
      await Promise.all([
        fetchCsv("abilities.csv"),
        fetchCsv("pokemon_abilities.csv"),
        fetchCsv("pokemon_abilities_past.csv"),
        fetchCsv("stats.csv"),
        fetchCsv("pokemon_stats.csv"),
        fetchCsv("pokemon_stats_past.csv"),
      ])

    const types = new Map(typeRows.map((row) => [row.id, row.identifier]))
    const abilities = new Map(
      abilityRows.map((row) => [row.id, row.identifier])
    )
    const stats = new Map(statRows.map((row) => [row.id, row.identifier]))
    const pokemonTypes = groupBy(pokemonTypeRows, "pokemon_id")
    const pastPokemonTypes = groupBy(pastTypeRows, "pokemon_id")
    const pokemonAbilities = groupBy(pokemonAbilityRows, "pokemon_id")
    const pastPokemonAbilities = groupBy(pastAbilityRows, "pokemon_id")
    const pokemonStats = groupBy(pokemonStatRows, "pokemon_id")
    const pastPokemonStats = groupBy(pastStatRows, "pokemon_id")
    const defaultPokemon = new Map(
      pokemonRows
        .filter((row) => row.is_default === "1")
        .map((row) => [row.species_id, row])
    )

    return speciesRows
      .filter((row) => Number(row.generation_id) === generation)
      .flatMap((species): PokemonRow[] => {
        const pokemon = defaultPokemon.get(species.id)
        if (!pokemon) return []

        const currentStatRows = pokemonStats.get(pokemon.id) ?? []
        const statOverrides = (pastPokemonStats.get(pokemon.id) ?? [])
          .filter((row) => Number(row.generation_id) >= generation)
          .sort(
            (a, b) => Number(a.generation_id) - Number(b.generation_id)
          )
        const closestStatGeneration = statOverrides[0]?.generation_id
        const effectiveStatRows = [
          ...currentStatRows,
          ...statOverrides.filter(
            (row) => row.generation_id === closestStatGeneration
          ),
        ]
        const statValues: Record<string, number> = Object.fromEntries(
          effectiveStatRows
            .map((row) => [stats.get(row.stat_id), Number(row.base_stat)])
            .filter((entry): entry is [string, number] => Boolean(entry[0]))
        )
        if (statValues.special !== undefined) {
          delete statValues["special-attack"]
          delete statValues["special-defense"]
        }

        const typeOverrides = (pastPokemonTypes.get(pokemon.id) ?? [])
          .filter((row) => Number(row.generation_id) >= generation)
          .sort(
            (a, b) => Number(a.generation_id) - Number(b.generation_id)
          )
        const closestTypeGeneration = typeOverrides[0]?.generation_id
        const effectiveTypeRows = closestTypeGeneration
          ? typeOverrides.filter(
              (row) => row.generation_id === closestTypeGeneration
            )
          : (pokemonTypes.get(pokemon.id) ?? [])
        const typeNames = effectiveTypeRows
          .sort((a, b) => Number(a.slot) - Number(b.slot))
          .map((row) => types.get(row.type_id))
          .filter((value): value is string => Boolean(value))

        const currentAbilityRows = pokemonAbilities.get(pokemon.id) ?? []
        const abilityOverrides = (pastPokemonAbilities.get(pokemon.id) ?? [])
          .filter((row) => Number(row.generation_id) >= generation)
          .sort(
            (a, b) => Number(a.generation_id) - Number(b.generation_id)
          )
        const effectiveAbilityRows = currentAbilityRows.map((row) => {
          const override = abilityOverrides.find(
            (past) => past.slot === row.slot
          )
          return override ?? row
        })
        const abilityNames =
          generation < 3
            ? []
            : effectiveAbilityRows
                .sort((a, b) => Number(a.slot) - Number(b.slot))
                .map((row) => abilities.get(row.ability_id))
                .filter((value): value is string => Boolean(value))

        return [
          {
            kind: "pokemon",
            id: Number(pokemon.id),
            name: pokemon.identifier,
            label: humanizeIdentifier(pokemon.identifier),
            types: typeNames,
            abilities: abilityNames,
            stats: statValues,
            statTotal: Object.values(statValues).reduce(
              (total, value) => total + value,
              0
            ),
          },
        ]
      })
      .sort((a, b) => a.id - b.id)
  }
)

export const getMoveRows = cache(
  async (generation: GenerationId): Promise<MoveRow[]> => {
    const [moveRows, typeRows, damageClassRows, effectRows] =
      await Promise.all([
        fetchCsv("moves.csv"),
        fetchCsv("types.csv"),
        fetchCsv("move_damage_classes.csv"),
        fetchCsv("move_effect_prose.csv"),
      ])
    const [changelogRows, versionGroupRows] = await Promise.all([
      fetchCsv("move_changelog.csv"),
      fetchCsv("version_groups.csv"),
    ])

    const types = new Map(typeRows.map((row) => [row.id, row.identifier]))
    const damageClasses = new Map(
      damageClassRows.map((row) => [row.id, row.identifier])
    )
    const descriptions = proseMap(effectRows, "move_effect_id")
    const versionGroupGenerations = new Map(
      versionGroupRows.map((row) => [row.id, Number(row.generation_id)])
    )
    const changelogByMove = groupBy(changelogRows, "move_id")

    return moveRows
      .filter((row) => Number(row.generation_id) === generation)
      .map((row): MoveRow => {
        const historical = (changelogByMove.get(row.id) ?? [])
          .filter(
            (change) =>
              (versionGroupGenerations.get(
                change.changed_in_version_group_id
              ) ?? 0) > generation
          )
          .sort(
            (a, b) =>
              (versionGroupGenerations.get(
                a.changed_in_version_group_id
              ) ?? 0) -
              (versionGroupGenerations.get(
                b.changed_in_version_group_id
              ) ?? 0)
          )[0]
        const effective = historical ? { ...row, ...nonEmpty(historical) } : row

        return {
          kind: "move",
          id: Number(row.id),
          name: row.identifier,
          label: humanizeIdentifier(row.identifier),
          type: types.get(effective.type_id) ?? "unknown",
          damageClass:
            damageClasses.get(row.damage_class_id) ?? "status",
          power: numberOrNull(effective.power),
          accuracy: numberOrNull(effective.accuracy),
          pp: numberOrNull(effective.pp),
          description: (descriptions.get(row.effect_id) ?? "No English description is available.").replace(
            "the listed chance",
            effective.effect_chance
              ? `${effective.effect_chance}%`
              : "the listed chance"
          ),
        }
      })
      .sort((a, b) => a.id - b.id)
  }
)

export const getAbilityRows = cache(
  async (generation: GenerationId): Promise<AbilityRow[]> => {
    const [abilityRows, proseRows] = await Promise.all([
      fetchCsv("abilities.csv"),
      fetchCsv("ability_prose.csv"),
    ])
    const descriptions = proseMap(proseRows, "ability_id")

    return abilityRows
      .filter(
        (row) =>
          Number(row.generation_id) === generation && row.is_main_series === "1"
      )
      .map(
        (row): AbilityRow => ({
          kind: "ability",
          id: Number(row.id),
          name: row.identifier,
          label: humanizeIdentifier(row.identifier),
          description:
            descriptions.get(row.id) ?? "No English description is available.",
        })
      )
      .sort((a, b) => a.id - b.id)
  }
)

export const getItemRows = cache(
  async (generation: GenerationId): Promise<SectionPayload> => {
    if (generation < 3 || generation > 8) {
      return {
        rows: [],
        note:
          "PokéAPI's item game-index data currently covers Generations III–VIII. The explorer does not guess item availability for this generation.",
      }
    }

    const [itemRows, gameIndexRows, proseRows] = await Promise.all([
      fetchCsv("items.csv"),
      fetchCsv("item_game_indices.csv"),
      fetchCsv("item_prose.csv"),
    ])
    const descriptions = proseMap(proseRows, "item_id")
    const availableIds = new Set(
      gameIndexRows
        .filter((row) => Number(row.generation_id) === generation)
        .map((row) => row.item_id)
    )

    const rows: ItemRow[] = itemRows
      .filter((row) => availableIds.has(row.id))
      .map((row): ItemRow => ({
        kind: "item",
        id: Number(row.id),
        name: row.identifier,
        label: humanizeIdentifier(row.identifier),
        description:
          descriptions.get(row.id) ?? "No English description is available.",
      }))
      .sort((a, b) => a.id - b.id)

    return {
      rows,
      note:
        "Items are scoped by PokéAPI game-index availability, not by their original introduction generation.",
    }
  }
)

export const getTypeChart = cache(
  async (generation: GenerationId): Promise<TypeChart> => {
    const [typeRows, efficacyRows, pastRows] = await Promise.all([
      fetchCsv("types.csv"),
      fetchCsv("type_efficacy.csv"),
      fetchCsv("type_efficacy_past.csv"),
    ])

    const availableTypes = typeRows
      .filter(
        (row) =>
          Number(row.id) <= 18 &&
          Number(row.generation_id) > 0 &&
          Number(row.generation_id) <= generation
      )
      .sort((a, b) => Number(a.id) - Number(b.id))
    const typeNames = new Map(
      availableTypes.map((row) => [row.id, row.identifier])
    )
    const pastByPair = groupBy(pastRows, "damage_type_id")

    const cells = efficacyRows.flatMap((row) => {
      const attacking = typeNames.get(row.damage_type_id)
      const defending = typeNames.get(row.target_type_id)
      if (!attacking || !defending) return []

      const historical = (pastByPair.get(row.damage_type_id) ?? [])
        .filter(
          (past) =>
            past.target_type_id === row.target_type_id &&
            Number(past.generation_id) >= generation
        )
        .sort(
          (a, b) => Number(a.generation_id) - Number(b.generation_id)
        )[0]

      return [
        {
          attacking,
          defending,
          multiplier:
            Number(historical?.damage_factor ?? row.damage_factor) / 100,
        },
      ]
    })

    return {
      types: availableTypes.map((row) => row.identifier),
      cells,
    }
  }
)

export async function getSectionPayload(
  generation: GenerationId,
  section: string
): Promise<SectionPayload> {
  if (section === "pokemon") return { rows: await getPokemonRows(generation) }
  if (section === "moves") return { rows: await getMoveRows(generation) }
  if (section === "abilities")
    return {
      rows: await getAbilityRows(generation),
      note:
        generation < 3
          ? "Abilities were introduced in Generation III."
          : undefined,
    }
  if (section === "items") return getItemRows(generation)
  if (section === "search") {
    const pokemon = await getPokemonRows(generation)
    const moves = await getMoveRows(generation)
    const abilities = await getAbilityRows(generation)
    const items = await getItemRows(generation)

    return {
      rows: [...pokemon, ...moves, ...abilities, ...items.rows],
      note: items.note,
    }
  }

  return { rows: [] }
}

export function sectionCount(rows: ExplorerRow[], kind: ExplorerRow["kind"]) {
  return rows.filter((row) => row.kind === kind).length
}

function nonEmpty(row: CsvRecord) {
  return Object.fromEntries(
    Object.entries(row).filter(
      ([key, value]) =>
        value !== "" &&
        !["move_id", "changed_in_version_group_id"].includes(key)
    )
  )
}
