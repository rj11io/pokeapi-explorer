import { fetchPokeApi, fetchPokeApiMedia } from "@/lib/pokeapi/client"

type PokemonMedia = {
  sprites?: {
    front_default?: string | null
    other?: {
      ["official-artwork"]?: { front_default?: string | null }
    }
  }
}

type ItemMedia = {
  sprites?: { default?: string | null }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ kind: string; id: string }> }
) {
  const { kind, id } = await context.params

  if (!/^\d+$/.test(id) || !["pokemon", "item"].includes(kind)) {
    return new Response("Not found", { status: 404 })
  }

  try {
    let mediaUrl: string | null | undefined

    if (kind === "pokemon") {
      const pokemon = await fetchPokeApi<PokemonMedia>(`pokemon/${id}`)
      mediaUrl =
        pokemon.sprites?.other?.["official-artwork"]?.front_default ??
        pokemon.sprites?.front_default
    } else {
      const item = await fetchPokeApi<ItemMedia>(`item/${id}`)
      mediaUrl = item.sprites?.default
    }

    if (!mediaUrl) {
      return new Response(null, { status: 204 })
    }

    const media = await fetchPokeApiMedia(mediaUrl)
    return new Response(media.body, {
      headers: {
        "content-type":
          media.headers.get("content-type") ?? "image/png",
        "cache-control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    })
  } catch {
    return new Response("Unable to load media", { status: 502 })
  }
}
