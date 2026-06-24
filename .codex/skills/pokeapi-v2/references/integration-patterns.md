# Integration patterns

## Contents

- [Recommended architecture](#recommended-architecture)
- [Cache key and record](#cache-key-and-record)
- [Request algorithm](#request-algorithm)
- [Pagination](#pagination)
- [Search](#search)
- [Relationship loading](#relationship-loading)
- [Errors and retries](#errors-and-retries)
- [Testing](#testing)
- [Next.js applications](#nextjs-applications)

## Recommended architecture

```text
UI / route
    ↓
domain query
    ↓
PokéAPI adapter
    ├── request coalescing
    ├── persistent local cache
    ├── validation / transport types
    └── bounded HTTP GET client
            ↓
      https://pokeapi.co/api/v2/
```

Keep raw network access inside one adapter. Expose domain operations such as:

- `listPokemon({ limit, offset })`
- `getPokemon(idOrName)`
- `getPokemonSpecies(urlOrIdOrName)`
- `getEvolutionChain(urlOrId)`
- `getPokemonEncounters(urlOrIdOrName)`

Accept canonical URLs for linked resources so callers do not reconstruct them.

## Cache key and record

Canonicalize:

- HTTPS scheme and `pokeapi.co` host
- `/api/v2/` path
- trailing slash policy
- sorted query parameters
- default pagination parameters when intentionally equivalent

Example cache record:

```ts
type CacheRecord<T> = {
  url: string
  value: T
  fetchedAt: string
  expiresAt: string
  etag?: string
  lastModified?: string
}
```

Do not include volatile headers in the key. Keep list pages and detail resources as separate entries.

## Request algorithm

```text
canonicalize URL
check in-flight request map
check persistent cache
if fresh → return cached
if stale → conditional GET with ETag/Last-Modified
  304 → refresh timestamps and return cached
  200 → validate, persist, return
  transient failure → return stale if available
  permanent failure → return typed error
```

Store successful responses before returning them to callers where practical.

## Pagination

- Render a page from one cached list request.
- Follow `next` rather than recalculating when possible.
- Abort superseded UI requests.
- Avoid requesting every page at startup.
- If constructing a complete name index, persist it and refresh deliberately rather than per session.
- Treat `count` as informational, not a permanent constant.

## Search

The hosted API does not implement server-side partial-name search.

Use:

- exact lookup: `GET /pokemon/pikachu/`
- autocomplete: filter a locally cached list of named resource summaries
- cross-resource search: maintain separate local indexes per endpoint

Do not call `?q=...`; it is a local-server-only OpenAPI parameter and is ignored by the hosted API.

## Relationship loading

- Expand only relationships visible or required for the current task.
- Batch UI state updates, but keep HTTP concurrency bounded.
- Cache each linked URL independently.
- Detect repeated URLs during graph traversal.
- Put explicit depth/resource limits on recursive or user-driven traversal.
- Evolution chains are recursive but finite; render branches rather than flattening them blindly.

## Errors and retries

Suggested application errors:

```ts
type PokeApiError =
  | { kind: "not-found"; url: string }
  | { kind: "rate-limited"; retryAfter?: number }
  | { kind: "upstream"; status: number; url: string }
  | { kind: "network"; url: string; cause: unknown }
  | { kind: "invalid-response"; url: string; cause: unknown }
```

- Do not retry `404`.
- Retry a small number of transient network/`5xx` failures with exponential backoff and jitter.
- On `429`, stop normal retrying and obey `Retry-After`.
- Prefer stale cached data for transient failures and label it as stale.
- Log URLs and status codes, but avoid dumping huge payloads.

## Testing

- Unit-test URL normalization, pagination, language fallback, recursive evolution parsing, type multipliers, and cache state transitions.
- Stub the adapter in UI tests.
- Use cached fixtures instead of hitting PokéAPI in routine test runs.
- Add one opt-in integration smoke test with a known small resource.
- Never run large live integration suites in parallel.
- Make live tests explicit, serial, and cache-aware.

## Next.js applications

Before using Next.js caching APIs, read the installed version's documentation because caching defaults and APIs can change.

- Keep page and layout components as Server Components unless browser interactivity requires a client boundary.
- Fetch through a server-side PokéAPI adapter to share a persistent cache.
- Do not assume plain `fetch` is cached by the installed Next.js version.
- Configure explicit persistence and revalidation, or use an application-owned disk/database/KV cache.
- Avoid making each client component call PokéAPI directly.
- Use route handlers only when the browser genuinely needs an app-owned API boundary.
- Cache normalized domain records separately from rendered route output when several pages reuse them.
- Add `loading`, `not-found`, and error states without turning transient upstream errors into permanent build failures.
