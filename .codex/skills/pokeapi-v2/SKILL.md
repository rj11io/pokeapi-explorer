---
name: pokeapi-v2
description: Design, implement, debug, or review integrations with the public PokéAPI REST API v2 at pokeapi.co. Use for Pokémon data explorers, Pokédex applications, endpoint selection, pagination, linked-resource traversal, schemas and TypeScript types, sprites and cries, encounters, evolution chains, localized text, and cache-first API clients. Enforce PokéAPI's fair-use policy, GET-only behavior, and local caching for every request.
---

# PokéAPI v2

Use PokéAPI v2 as a linked, read-only data graph while minimizing network traffic. Treat fair use as a functional requirement, not an optimization.

## Mandatory fair-use gate

Before making or implementing any request:

1. Read `references/fair-use.md`.
2. Confirm the operation uses HTTP `GET`; never send mutations.
3. Check a local or application-owned cache before the network.
4. Store every successful response in that cache.
5. Avoid broad crawling, duplicate requests, speculative prefetching, and unbounded concurrency.

Do not claim that the absence of server rate limits permits high request volume. PokéAPI can permanently ban abusive IP addresses.

## Integration workflow

1. Identify the smallest resource or list endpoint that answers the task.
2. Read `references/endpoints.md` to select the endpoint and determine whether it accepts a name, an ID, or only an ID.
3. Read `references/data-model.md` when joining resources, handling localized text, Pokémon/species/forms, encounters, evolution, sprites, cries, or version-specific data.
4. Read `references/integration-patterns.md` before writing a client, server adapter, search index, cache, retry policy, or framework integration.
5. Fetch exact resources by name or ID when known. Fetch paginated summaries for browsing.
6. Follow returned resource URLs rather than constructing uncertain relationships.
7. Validate assumptions against the current official docs or OpenAPI schema when field-level precision matters.

Official sources:

- Documentation: `https://pokeapi.co/docs/v2`
- API root: `https://pokeapi.co/api/v2/`
- OpenAPI schema: `https://github.com/PokeAPI/pokeapi/blob/master/openapi.yml`
- Security reporting: `https://github.com/PokeAPI/pokeapi/blob/master/SECURITY.md#reporting-a-vulnerability`

## Fetch data safely

Use the bundled cache-first utility for exploration and one-off inspection:

```bash
node scripts/pokeapi-fetch.mjs pokemon/pikachu
node scripts/pokeapi-fetch.mjs "pokemon?limit=20&offset=0"
node scripts/pokeapi-fetch.mjs pokemon/pikachu/encounters
```

The utility:

- permits only HTTPS requests to `pokeapi.co/api/v2`;
- rejects the unsupported public `q` parameter;
- reads a disk cache before networking;
- respects response `Cache-Control` freshness where available;
- stores ETags and performs conditional revalidation;
- serves stale cached data if revalidation fails;
- writes JSON to stdout and cache diagnostics to stderr.

By default it stores data in `.cache/pokeapi-v2` under the current working directory. Keep that directory out of version control unless cached fixtures are intentionally part of the project.

## Public API rules

- Base URL: `https://pokeapi.co/api/v2/`
- Authentication: none.
- Supported resource method: `GET`.
- Detail shape: `/api/v2/{endpoint}/{id-or-name}/`.
- List shape: `/api/v2/{endpoint}/?limit={n}&offset={n}`.
- Default list size: 20.
- Lists return `count`, `next`, `previous`, and `results`.
- Most detail endpoints accept either a numeric ID or a canonical lowercase name.
- `characteristic`, `contest-effect`, `evolution-chain`, `machine`, and `super-contest-effect` are unnamed resources; retrieve them by numeric ID.
- The public hosted API does not support OpenAPI's local-only `q` search parameter. Build search over a locally cached list index instead.
- Treat missing and nullable fields as normal. Data availability varies by generation and resource.

## Design expectations

- Put PokéAPI access behind one cache-aware adapter rather than scattering raw `fetch` calls through UI components.
- Deduplicate concurrent requests for the same URL.
- Bound parallel fetches. Prefer sequential or low-concurrency traversal unless the user has an explicit, justified bulk operation.
- Cache list pages, details, sprites, and cries independently.
- Prefer stale-while-revalidate behavior for interactive applications.
- Preserve canonical resource URLs and IDs in normalized records.
- Keep raw API response types separate from UI view models.
- Do not download every detail record to implement initial browsing or search.
- Do not rely only on PokéAPI/CDN caching; fair use explicitly asks consumers to cache locally.

## Handling documentation drift

Use the live API root to discover currently exposed top-level endpoints. The root may expose operational resources such as `meta` that are not part of the human documentation's domain-resource catalog.

When the docs and OpenAPI schema differ:

1. Prefer verified behavior from the public `https://pokeapi.co/api/v2/` service.
2. Treat fields or query parameters marked local-only as unavailable on the hosted service.
3. Keep decoders tolerant of additive fields.
4. Report the discrepancy instead of silently depending on undocumented behavior.
