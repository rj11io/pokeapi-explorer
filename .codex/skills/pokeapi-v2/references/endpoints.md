# Endpoint catalog

## Contents

- [Common route forms](#common-route-forms)
- [Endpoint map](#endpoint-map)
- [Special and operational routes](#special-and-operational-routes)
- [Identifier rules](#identifier-rules)
- [Pagination and local search](#pagination-and-local-search)

## Common route forms

```text
GET https://pokeapi.co/api/v2/
GET https://pokeapi.co/api/v2/{endpoint}/
GET https://pokeapi.co/api/v2/{endpoint}/{id-or-name}/
GET https://pokeapi.co/api/v2/{endpoint}/?limit=20&offset=0
```

Named list result:

```json
{
  "count": 1351,
  "next": "https://pokeapi.co/api/v2/pokemon/?offset=20&limit=20",
  "previous": null,
  "results": [
    { "name": "bulbasaur", "url": "https://pokeapi.co/api/v2/pokemon/1/" }
  ]
}
```

Unnamed list results contain `{ "url": "..." }` without `name`.

## Endpoint map

All routes below are under `/api/v2/`.

| Group | Endpoint | Primary purpose |
| --- | --- | --- |
| Berries | `berry` | Growth, harvest, flavor potency, firmness, associated item and Natural Gift data |
| Berries | `berry-firmness` | Firmness classification and berries |
| Berries | `berry-flavor` | Flavor, contest type, and berry potency |
| Contests | `contest-type` | Contest categories and localized names |
| Contests | `contest-effect` | Contest appeal/jam effects; numeric ID only |
| Contests | `super-contest-effect` | Super Contest effects and related moves; numeric ID only |
| Encounters | `encounter-method` | Walk, fishing, surfing, and other encounter methods |
| Encounters | `encounter-condition` | Encounter condition categories |
| Encounters | `encounter-condition-value` | Concrete condition values |
| Evolution | `evolution-chain` | Recursive species evolution trees; numeric ID only |
| Evolution | `evolution-trigger` | Level-up, trade, item use, and other triggers |
| Games | `generation` | Resources introduced by generation |
| Games | `pokedex` | Regional/National Pokédex entries and ordering |
| Games | `version` | Individual game versions |
| Games | `version-group` | Grouped versions used by move and encounter data |
| Items | `item` | Item effects, attributes, categories, sprites, holders, and machines |
| Items | `item-attribute` | Item property classifications |
| Items | `item-category` | Item categories and contained items |
| Items | `item-fling-effect` | Effects caused by Fling |
| Items | `item-pocket` | Bag pockets and categories |
| Locations | `location` | Named places and contained areas |
| Locations | `location-area` | Encounter areas, methods, versions, and Pokémon |
| Locations | `pal-park-area` | Pal Park areas and encounter scores |
| Locations | `region` | Regions, locations, generations, and Pokédexes |
| Machines | `machine` | TM/HM machine item, move, and version group; numeric ID only |
| Moves | `move` | Power, accuracy, PP, type, damage class, effects, learners, and version details |
| Moves | `move-ailment` | Move-induced ailment categories |
| Moves | `move-battle-style` | Battle Palace/Tent styles |
| Moves | `move-category` | Meta move-effect categories |
| Moves | `move-damage-class` | Physical, special, and status classes |
| Moves | `move-learn-method` | Level-up, machine, tutor, egg, and other methods |
| Moves | `move-target` | Move targeting patterns |
| Pokémon | `ability` | Ability effects, flavor text, Pokémon, and generation |
| Pokémon | `characteristic` | IV-derived characteristics; numeric ID only |
| Pokémon | `egg-group` | Breeding groups and species |
| Pokémon | `gender` | Gender ratios and affected species |
| Pokémon | `growth-rate` | Experience curves and level tables |
| Pokémon | `nature` | Stat modifiers, flavors, and battle preferences |
| Pokémon | `pokeathlon-stat` | Pokéathlon stat relationships |
| Pokémon | `pokemon` | Battle-facing Pokémon data: stats, types, abilities, moves, sprites, cries |
| Pokémon | `pokemon-color` | Species color classification |
| Pokémon | `pokemon-form` | Form appearance, sprites, types, and version group |
| Pokémon | `pokemon-habitat` | Species habitat classification |
| Pokémon | `pokemon-shape` | Species body-shape classification |
| Pokémon | `pokemon-species` | Taxonomy, evolution, breeding, descriptions, varieties, and Pokédex numbers |
| Pokémon | `stat` | Battle stats, affecting moves, and natures |
| Pokémon | `type` | Type relationships, Pokémon, moves, and historical relations |
| Utility | `language` | Language metadata used by localized text arrays |

## Special and operational routes

### Pokémon encounters

```text
GET /api/v2/pokemon/{id-or-name}/encounters
```

Returns an array of location areas with version-specific encounter details. It is not a standard paginated list.

The `pokemon` response also exposes this URL through `location_area_encounters`; prefer following that value.

### API root

```text
GET /api/v2/
```

Returns the live top-level endpoint map. Use it for discovery and drift checks, not on every application request; cache it.

### Meta

```text
GET /api/v2/meta/
```

The live API root and OpenAPI schema expose this operational deployment metadata route, but the human v2 docs do not describe it as a domain resource. Do not build product behavior around it without an explicit need.

## Identifier rules

Most detail routes accept a numeric ID or canonical resource name. Names are generally lowercase, hyphenated slugs.

Use numeric IDs only for:

- `characteristic`
- `contest-effect`
- `evolution-chain`
- `machine`
- `super-contest-effect`

When a response supplies a resource URL, preserve and follow it. This avoids guessing whether a relationship points to Pokémon, species, forms, items, versions, or version groups.

## Pagination and local search

- Default page size: 20.
- `limit`: number of summaries to return.
- `offset`: zero-based starting index.
- Use returned `next` and `previous` URLs where practical.
- Do not assume counts are permanent; data grows.
- Do not use `q` on the public service. The OpenAPI schema explicitly marks it as local-only, and the hosted API ignores it.

For autocomplete:

1. Fetch and cache summary pages.
2. Build a compact local index of `name`, URL, and parsed ID.
3. Filter locally.
4. Fetch one detail resource only after selection.

Do not fetch all detail records merely to populate search.
