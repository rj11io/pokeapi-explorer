import { withRequestPermit } from "./limit"

const API_BASE = "https://pokeapi.co/api/v2/"

export async function fetchPokeApi<T>(resource: string): Promise<T> {
  const url = new URL(resource.replace(/^\/+/, ""), API_BASE)

  if (url.origin !== "https://pokeapi.co" || !url.pathname.startsWith("/api/v2/")) {
    throw new Error("Only PokéAPI v2 resources are allowed")
  }

  const result = await withRequestPermit(async () => {
    const response = await fetch(url, {
      method: "GET",
      cache: "force-cache",
      headers: { accept: "application/json" },
      next: {
        revalidate: 86400,
        tags: ["pokeapi-v2", `pokeapi-v2:${url.pathname}`],
      },
    })
    return {
      ok: response.ok,
      status: response.status,
      body: await response.json(),
    }
  })

  if (!result.ok) {
    throw new Error(`PokéAPI returned ${result.status} for ${url.pathname}`)
  }

  return result.body as T
}

export async function fetchPokeApiMedia(url: string) {
  const mediaUrl = new URL(url)

  if (
    mediaUrl.protocol !== "https:" ||
    !["raw.githubusercontent.com", "pokeapi.co"].includes(mediaUrl.hostname)
  ) {
    throw new Error("Unsupported PokéAPI media host")
  }

  return withRequestPermit(async () => {
    const response = await fetch(mediaUrl, {
      cache: "force-cache",
      next: { revalidate: 604800, tags: ["pokeapi-media"] },
    })

    if (!response.ok) {
      throw new Error(`Unable to load PokéAPI media: ${response.status}`)
    }

    return new Response(await response.arrayBuffer(), {
      headers: {
        "content-type":
          response.headers.get("content-type") ?? "application/octet-stream",
      },
    })
  })
}
