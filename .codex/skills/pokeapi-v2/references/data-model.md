# Data-model guide

## Contents

- [Resource links](#resource-links)
- [Pokémon, species, and forms](#pokémon-species-and-forms)
- [Localized text](#localized-text)
- [Versioned and historical data](#versioned-and-historical-data)
- [Evolution](#evolution)
- [Encounters](#encounters)
- [Types](#types)
- [Sprites and cries](#sprites-and-cries)
- [Typing guidance](#typing-guidance)

## Resource links

PokéAPI is a linked graph. Common references are:

```ts
type NamedAPIResource = {
  name: string
  url: string
}

type APIResource = {
  url: string
}
```

Normalize linked resources to `{ id, name?, url }` when useful, but retain the canonical URL. Parse IDs from URLs only as a convenience; do not discard the URL.

## Pokémon, species, and forms

These resources are related but not interchangeable:

- `pokemon`: battle/game implementation of a Pokémon variety. Use for base stats, types, abilities, moves, held items, dimensions, sprites, and cries.
- `pokemon-species`: biological/taxonomic record. Use for evolution chain, generation, color, shape, habitat, capture rate, breeding, genus, flavor text, Pokédex numbers, and varieties.
- `pokemon-form`: form-specific visual/type metadata tied to a Pokémon and version group.

A species can have several varieties; each variety points to a `pokemon` resource and marks whether it is the default. A Pokémon points back to its species.

For a typical detail screen:

1. Fetch `pokemon/{name-or-id}`.
2. Follow `species.url` only when species/evolution/descriptive data is needed.
3. Follow `evolution_chain.url` only when the evolution section is requested.
4. Load forms or encounter data on demand.

Do not assume a National Pokédex species ID and every Pokémon variety/form ID are identical.

## Localized text

Names, genera, flavor text, and effect text commonly appear as arrays carrying a `language` resource.

- Select the requested language explicitly.
- Define a fallback order, commonly requested language → English (`en`) → first available.
- Flavor text may contain newlines, form-feed characters, or repeated entries across versions. Normalize whitespace for display.
- Preserve version/version-group metadata when the product needs historical wording.
- Do not assume every resource has every language.

Some effect entries include an `effect_chance` value and text placeholders. Use the structured value rather than scraping numbers from prose.

## Versioned and historical data

Many arrays are scoped by:

- `version`
- `version_group`
- `generation`

Move-learning details, encounters, Pokédex entries, flavor text, types, abilities, stats, and damage relations may vary historically.

Never collapse version-specific records without a declared selection policy. For a “current/default” UI, document which generation or version group is considered current.

Treat `past_types`, `past_abilities`, `past_stats`, historical damage relations, and similar fields as optional/additive.

## Evolution

`evolution-chain/{id}` returns a recursive `chain`:

```text
ChainLink
├── species
├── evolution_details[]
└── evolves_to[]
    └── ChainLink ...
```

Traverse recursively. A chain can branch. Evolution requirements may combine trigger, item, held item, known move/type, location, affection, beauty, happiness, gender, time of day, rain, trade species, or level constraints.

Do not reduce evolution to a single level number.

## Encounters

Use either:

- `location-area/{id-or-name}` to answer “what appears here?”, or
- `pokemon/{id-or-name}/encounters` to answer “where does this Pokémon appear?”

Encounter data nests version details and encounter details. Chance, level range, method, and conditions are version-specific.

## Types

`type/{id-or-name}` contains directional damage relations:

- `double_damage_to`, `half_damage_to`, `no_damage_to`
- `double_damage_from`, `half_damage_from`, `no_damage_from`

Do not confuse attacking (`*_to`) with defending (`*_from`) relations. Account for historical relations when the selected generation requires them.

For dual-type defensive multipliers, combine each defending type's incoming relation multipliers.

## Sprites and cries

Pokémon sprites contain nullable direct fields plus nested `other` and `versions` collections. Item and form resources have different sprite shapes.

- Expect missing artwork.
- Define a fallback order, such as official artwork → home artwork → default front sprite.
- Use provided URLs; do not invent GitHub sprite paths.
- Cache media locally when proxying/downloading it.
- Avoid preloading every sprite in large lists.

Pokémon cries expose audio URLs such as `latest` and `legacy`. Lazy-load audio and handle unsupported or missing formats gracefully.

## Typing guidance

- Generate or hand-write types from the official OpenAPI schema, then verify important payloads against the public API.
- Keep transport types faithful to snake_case API fields.
- Map transport types into app-specific camelCase view models separately if desired.
- Model documented nullable fields as nullable.
- Tolerate unknown/additional fields so additive API changes do not break decoding.
- Validate boundary data at runtime for critical paths.
- Use discriminated application states for loading, success, not found, stale, and upstream failure.
