# Fair use and operational policy

## Non-negotiable rules

PokéAPI is a free, public, consumption-only API intended primarily for education.

- Use only HTTP `GET` for resources.
- Do not send authentication; none is required.
- Cache every requested resource locally or in application-owned persistent storage.
- Minimize request frequency even though the hosted service has no formal rate limit.
- Never load-test, scrape aggressively, crawl the whole graph, or create denial-of-service-like traffic.
- Report security vulnerabilities responsibly through the official security policy.

An IP address may be permanently banned for violating fair use.

## What counts as local caching

Valid examples:

- a server-side disk, database, Redis, KV, or object-store cache;
- IndexedDB or Cache Storage for a browser-only application;
- checked-in fixtures for deterministic tests;
- a framework data cache only when its persistence and freshness are explicitly configured.

The upstream CDN's cache does not satisfy the consumer's responsibility to cache locally.

Cache both successful list pages and detail resources. Cache media independently when the application proxies or downloads it.

## Recommended request policy

- Default freshness: honor upstream `Cache-Control`; public responses commonly advertise a one-day maximum age.
- Revalidation: retain `ETag` and `Last-Modified`, then use conditional requests after expiry.
- Stale fallback: serve a stale cached response when upstream is temporarily unavailable.
- Request coalescing: share one in-flight promise per canonical URL.
- Concurrency: keep bulk traversal low and bounded; start around 2–4 concurrent requests.
- Retries: retry only transient failures, use exponential backoff with jitter, and cap attempts.
- `404`: cache briefly as a negative lookup when repeated misses are likely.
- `429`: stop, respect `Retry-After` if supplied, and substantially reduce traffic.
- `5xx` or network failure: prefer stale cache; otherwise fail clearly.

Do not repeatedly bypass caches with forced refreshes. Do not add automatic background crawling.

## Product-design implications

- Search exact names through detail endpoints when possible.
- For autocomplete, cache paginated resource summaries and search that local index.
- Load secondary relationships on demand rather than eagerly expanding every URL.
- Prefer server-rendered or server-mediated data access for shared caches.
- Make manual refresh explicit and throttled.
- Add cache observability: hit, miss, stale, revalidated, and error counters.

## Security reporting

Do not probe or exploit a suspected vulnerability. Preserve minimal evidence and follow:

`https://github.com/PokeAPI/pokeapi/blob/master/SECURITY.md#reporting-a-vulnerability`
