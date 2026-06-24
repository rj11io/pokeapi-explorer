import Link from "next/link"
import {
  Backpack,
  ChartNoAxesColumnIncreasing,
  Dna,
  Search,
  Shield,
  Sparkles,
  Swords,
} from "lucide-react"

import { GENERATIONS } from "@/lib/pokeapi/generations"
import type {
  ExplorerSection,
  GenerationId,
} from "@/lib/pokeapi/types"
import { cn } from "@/lib/utils"

const SECTIONS: {
  id: ExplorerSection
  label: string
  icon: typeof Search
}[] = [
  { id: "search", label: "Search", icon: Search },
  { id: "pokemon", label: "Pokémon", icon: Dna },
  { id: "moves", label: "Moves", icon: Swords },
  { id: "abilities", label: "Abilities", icon: Sparkles },
  { id: "items", label: "Items", icon: Backpack },
  { id: "types", label: "Type chart", icon: Shield },
]

export function ExplorerShell({
  generation,
  section,
  children,
}: {
  generation: GenerationId
  section: ExplorerSection
  children: React.ReactNode
}) {
  const selectedGeneration = GENERATIONS[generation]

  return (
    <div className="min-h-svh bg-[#f7f8f4] text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="border-b border-zinc-950/10 bg-white/85 backdrop-blur dark:border-white/10 dark:bg-zinc-950/85">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-6 px-5 py-4 lg:px-8">
          <Link href={`/generation/${generation}/search`} className="group">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-full border-[6px] border-zinc-950 bg-white shadow-sm dark:border-white dark:bg-zinc-950">
                <div className="size-2 rounded-full bg-emerald-500" />
              </div>
              <div>
                <div className="text-base font-black tracking-[-0.03em]">
                  PokéAPI Explorer
                </div>
                <div className="text-[11px] font-medium tracking-[0.16em] text-zinc-500 uppercase">
                  Cache-first field guide
                </div>
              </div>
            </div>
          </Link>

          <div className="hidden items-center gap-2 text-xs text-zinc-500 md:flex">
            <ChartNoAxesColumnIncreasing className="size-4" />
            <span>Official PokéAPI v2 data</span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="border-b border-zinc-950/10 bg-white px-4 py-5 dark:border-white/10 dark:bg-zinc-950 lg:min-h-[calc(100svh-73px)] lg:border-r lg:border-b-0 lg:px-5 lg:py-7">
          <div className="mb-6">
            <div className="mb-2 px-2 text-[10px] font-bold tracking-[0.16em] text-zinc-400 uppercase">
              Generation
            </div>
            <div className="grid grid-cols-5 gap-1.5 lg:grid-cols-3">
              {Object.values(GENERATIONS).map((item) => (
                <Link
                  key={item.id}
                  href={`/generation/${item.id}/${section}`}
                  className={cn(
                    "rounded-lg border px-2 py-2 text-center text-xs font-bold transition-colors",
                    item.id === generation
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-zinc-200 bg-zinc-50 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900"
                  )}
                >
                  {item.roman}
                </Link>
              ))}
            </div>
          </div>

          <nav className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1">
            {SECTIONS.map((item) => {
              const Icon = item.icon
              const active = item.id === section

              return (
                <Link
                  key={item.id}
                  href={`/generation/${generation}/${item.id}`}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white"
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="mt-7 hidden border-t border-zinc-200 pt-5 text-xs leading-relaxed text-zinc-500 dark:border-zinc-800 lg:block">
            <div className="font-semibold text-zinc-700 dark:text-zinc-300">
              {selectedGeneration.region}
            </div>
            <div className="mt-1">{selectedGeneration.games.join(" · ")}</div>
          </div>
        </aside>

        <main className="min-w-0 px-5 py-7 lg:px-9 lg:py-9">{children}</main>
      </div>
    </div>
  )
}
