#!/usr/bin/env node

import { createHash } from "node:crypto"
import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import { resolve } from "node:path"

const BASE_URL = "https://pokeapi.co/api/v2/"
const DEFAULT_MAX_AGE_SECONDS = 86_400

process.stdout.on("error", (error) => {
  if (error.code === "EPIPE") {
    process.exit(0)
  }
  throw error
})

function usage() {
  console.error(
    [
      "Usage: node pokeapi-fetch.mjs <resource-or-url> [options]",
      "",
      "Options:",
      "  --cache-dir <path>  Cache directory (default: .cache/pokeapi-v2)",
      "  --ttl <seconds>     Override response freshness",
      "  --refresh           Revalidate even when the cached entry is fresh",
      "  --cache-only        Fail instead of using the network on a cache miss",
      "  --compact           Print compact JSON",
    ].join("\n")
  )
}

function parseArgs(argv) {
  const options = {
    resource: undefined,
    cacheDir: resolve(".cache/pokeapi-v2"),
    ttl: undefined,
    refresh: false,
    cacheOnly: false,
    compact: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === "--cache-dir") {
      const value = argv[++index]
      if (!value) throw new Error("--cache-dir requires a path")
      options.cacheDir = resolve(value)
    } else if (arg === "--ttl") {
      const value = Number(argv[++index])
      if (!Number.isFinite(value) || value < 0) {
        throw new Error("--ttl requires a non-negative number")
      }
      options.ttl = value
    } else if (arg === "--refresh") {
      options.refresh = true
    } else if (arg === "--cache-only") {
      options.cacheOnly = true
    } else if (arg === "--compact") {
      options.compact = true
    } else if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`)
    } else if (!options.resource) {
      options.resource = arg
    } else {
      throw new Error(`Unexpected argument: ${arg}`)
    }
  }

  if (!options.resource) throw new Error("A resource path or URL is required")
  return options
}

function canonicalUrl(resource) {
  const input = /^https?:\/\//i.test(resource)
    ? new URL(resource)
    : new URL(resource.replace(/^\/+/, ""), BASE_URL)

  if (input.protocol !== "https:") {
    throw new Error("Only HTTPS requests are allowed")
  }
  if (input.hostname !== "pokeapi.co") {
    throw new Error("Only pokeapi.co requests are allowed")
  }
  if (!input.pathname.startsWith("/api/v2/")) {
    throw new Error("Only PokéAPI v2 paths under /api/v2/ are allowed")
  }
  if (input.searchParams.has("q")) {
    throw new Error(
      "The public PokéAPI ignores q. Cache a paginated summary list and search it locally."
    )
  }

  input.hash = ""
  input.searchParams.sort()
  return input.toString()
}

function cachePath(cacheDir, url) {
  const digest = createHash("sha256").update(url).digest("hex")
  return resolve(cacheDir, `${digest}.json`)
}

async function readCache(path) {
  try {
    const text = await readFile(path, "utf8")
    return JSON.parse(text)
  } catch (error) {
    if (error?.code === "ENOENT") return undefined
    console.error(`[pokeapi] ignoring unreadable cache entry: ${error.message}`)
    return undefined
  }
}

function maxAgeFrom(headers, override) {
  if (override !== undefined) return override

  const cacheControl = headers.get("cache-control") ?? ""
  const match = cacheControl.match(/(?:^|,)\s*max-age=(\d+)/i)
  return match ? Number(match[1]) : DEFAULT_MAX_AGE_SECONDS
}

async function writeCache(path, record) {
  await mkdir(resolve(path, ".."), { recursive: true })
  const temporaryPath = `${path}.${process.pid}.tmp`
  await writeFile(temporaryPath, JSON.stringify(record), "utf8")
  await rename(temporaryPath, path)
}

function print(value, compact) {
  process.stdout.write(`${JSON.stringify(value, null, compact ? 0 : 2)}\n`)
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const url = canonicalUrl(options.resource)
  const path = cachePath(options.cacheDir, url)
  const cached = await readCache(path)
  const now = Date.now()

  if (
    cached &&
    !options.refresh &&
    Number.isFinite(cached.expiresAt) &&
    cached.expiresAt > now
  ) {
    console.error(`[pokeapi] cache hit: ${url}`)
    print(cached.body, options.compact)
    return
  }

  if (options.cacheOnly) {
    if (!cached) throw new Error(`Cache miss: ${url}`)
    console.error(`[pokeapi] stale cache hit: ${url}`)
    print(cached.body, options.compact)
    return
  }

  const headers = { accept: "application/json" }
  if (cached?.etag) headers["if-none-match"] = cached.etag
  if (cached?.lastModified) headers["if-modified-since"] = cached.lastModified

  console.error(`[pokeapi] ${cached ? "revalidating" : "cache miss"}: ${url}`)

  let response
  try {
    response = await fetch(url, { method: "GET", headers })
  } catch (error) {
    if (cached) {
      console.error(`[pokeapi] network failed; serving stale cache: ${error.message}`)
      print(cached.body, options.compact)
      return
    }
    throw error
  }

  if (response.status === 304 && cached) {
    const maxAge = maxAgeFrom(response.headers, options.ttl)
    const record = {
      ...cached,
      fetchedAt: now,
      expiresAt: now + maxAge * 1000,
      etag: response.headers.get("etag") ?? cached.etag,
      lastModified:
        response.headers.get("last-modified") ?? cached.lastModified,
    }
    await writeCache(path, record)
    console.error(`[pokeapi] cache revalidated: ${url}`)
    print(record.body, options.compact)
    return
  }

  if (!response.ok) {
    if (cached && (response.status === 429 || response.status >= 500)) {
      console.error(
        `[pokeapi] upstream returned ${response.status}; serving stale cache`
      )
      print(cached.body, options.compact)
      return
    }
    throw new Error(`PokéAPI returned ${response.status} for ${url}`)
  }

  const body = await response.json()
  const maxAge = maxAgeFrom(response.headers, options.ttl)
  const record = {
    url,
    fetchedAt: now,
    expiresAt: now + maxAge * 1000,
    etag: response.headers.get("etag") ?? undefined,
    lastModified: response.headers.get("last-modified") ?? undefined,
    body,
  }

  await writeCache(path, record)
  console.error(`[pokeapi] cached for ${maxAge}s: ${url}`)
  print(body, options.compact)
}

main().catch((error) => {
  console.error(`[pokeapi] ${error.message}`)
  usage()
  process.exitCode = 1
})
