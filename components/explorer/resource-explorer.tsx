"use client"

import Link from "next/link"
import Image from "next/image"
import * as React from "react"
import {
  ArrowDownAZ,
  ChevronLeft,
  ChevronRight,
  Search,
  Sparkles,
  Swords,
} from "lucide-react"

import { TypeBadge } from "./type-badge"
import { humanizeIdentifier } from "@/lib/pokeapi/format"
import type {
  AbilityRow,
  ExplorerRow,
  ExplorerSection,
  ItemRow,
  MoveRow,
  PokemonRow,
} from "@/lib/pokeapi/types"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 24

type SortKey = "id" | "name" | "stat-total" | "power" | "accuracy" | "pp"

export function ResourceExplorer({
  generation,
  section,
  rows,
  note,
  initialQuery = "",
}: {
  generation: number
  section: ExplorerSection
  rows: ExplorerRow[]
  note?: string
  initialQuery?: string
}) {
  const [query, setQuery] = React.useState(initialQuery)
  const [sort, setSort] = React.useState<SortKey>("id")
  const [typeFilter, setTypeFilter] = React.useState("all")
  const [kindFilter, setKindFilter] = React.useState("all")
  const [abilityFilter, setAbilityFilter] = React.useState("all")
  const [page, setPage] = React.useState(1)

  const types = React.useMemo(
    () =>
      Array.from(
        new Set(
          rows.flatMap((row) =>
            row.kind === "pokemon"
              ? row.types
              : row.kind === "move"
                ? [row.type]
                : []
          )
        )
      ).sort(),
    [rows]
  )
  const abilities = React.useMemo(
    () =>
      Array.from(
        new Set(
          rows.flatMap((row) => (row.kind === "pokemon" ? row.abilities : []))
        )
      ).sort(),
    [rows]
  )

  const filteredRows = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return rows
      .filter((row) => {
        if (kindFilter !== "all" && row.kind !== kindFilter) return false
        if (
          typeFilter !== "all" &&
          !(
            (row.kind === "pokemon" && row.types.includes(typeFilter)) ||
            (row.kind === "move" && row.type === typeFilter)
          )
        ) {
          return false
        }
        if (
          abilityFilter !== "all" &&
          !(row.kind === "pokemon" && row.abilities.includes(abilityFilter))
        ) {
          return false
        }
        if (!normalizedQuery) return true

        return searchableText(row).includes(normalizedQuery)
      })
      .sort((a, b) => compareRows(a, b, sort))
  }, [rows, query, sort, typeFilter, kindFilter, abilityFilter])

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const visibleRows = filteredRows.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  )

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <div className="text-[11px] font-bold tracking-[0.18em] text-emerald-700 uppercase dark:text-emerald-400">
            Generation {generation}
          </div>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.045em] sm:text-4xl">
            {sectionTitle(section)}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
            {sectionDescription(section, rows.length)}
          </p>
        </div>

        <div className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          {filteredRows.length.toLocaleString()} results
        </div>
      </div>

      {note ? (
        <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          {note}
        </div>
      ) : null}

      <div className="mb-6 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_180px_180px_180px]">
          <label className="relative block">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                section === "search"
                  ? "Search this generation…"
                  : `Search ${section}…`
              }
              className="h-10 w-full rounded-lg border border-zinc-200 bg-zinc-50 pr-3 pl-9 text-sm outline-none transition focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/15 dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>

          {section === "search" ? (
            <FilterSelect
              value={kindFilter}
              onChange={setKindFilter}
              options={[
                ["all", "All sections"],
                ["pokemon", "Pokémon"],
                ["move", "Moves"],
                ["ability", "Abilities"],
                ["item", "Items"],
              ]}
            />
          ) : null}

          {(section === "pokemon" ||
            section === "moves" ||
            section === "search") &&
          types.length ? (
            <FilterSelect
              value={typeFilter}
              onChange={setTypeFilter}
              options={[
                ["all", "All types"],
                ...types.map((type) => [type, humanizeIdentifier(type)] as const),
              ]}
            />
          ) : null}

          {section === "pokemon" && abilities.length ? (
            <FilterSelect
              value={abilityFilter}
              onChange={setAbilityFilter}
              options={[
                ["all", "All abilities"],
                ...abilities.map(
                  (ability) =>
                    [ability, humanizeIdentifier(ability)] as const
                ),
              ]}
            />
          ) : null}

          <label className="relative block">
            <ArrowDownAZ className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className="h-10 w-full appearance-none rounded-lg border border-zinc-200 bg-zinc-50 pr-3 pl-9 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950"
            >
              <option value="id">Sort by number</option>
              <option value="name">Sort by name</option>
              {(section === "pokemon" || section === "search") && (
                <option value="stat-total">Sort by stat total</option>
              )}
              {(section === "moves" || section === "search") && (
                <>
                  <option value="power">Sort by power</option>
                  <option value="accuracy">Sort by accuracy</option>
                  <option value="pp">Sort by PP</option>
                </>
              )}
            </select>
          </label>
        </div>
      </div>

      {visibleRows.length ? (
        <ResourceGrid
          rows={visibleRows}
          generation={generation}
          searchMode={section === "search"}
        />
      ) : (
        <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-zinc-300 bg-white/50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
          <div>
            <Search className="mx-auto mb-3 size-7 text-zinc-400" />
            <div className="font-semibold">No matching records</div>
            <div className="mt-1 text-sm text-zinc-500">
              Try clearing a filter or changing your search.
            </div>
          </div>
        </div>
      )}

      {pageCount > 1 ? (
        <div className="mt-6 flex items-center justify-between border-t border-zinc-200 pt-5 dark:border-zinc-800">
          <div className="text-xs text-zinc-500">
            Page {safePage} of {pageCount}
          </div>
          <div className="flex gap-2">
            <PagerButton
              label="Previous"
              icon={ChevronLeft}
              disabled={safePage === 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            />
            <PagerButton
              label="Next"
              icon={ChevronRight}
              iconAfter
              disabled={safePage === pageCount}
              onClick={() =>
                setPage((value) => Math.min(pageCount, value + 1))
              }
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}

function ResourceGrid({
  rows,
  generation,
  searchMode,
}: {
  rows: ExplorerRow[]
  generation: number
  searchMode: boolean
}) {
  if (!searchMode && rows.every((row) => row.kind === "move")) {
    return <MoveTable rows={rows as MoveRow[]} />
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
      {rows.map((row) => {
        if (row.kind === "pokemon") {
          return <PokemonCard key={`pokemon-${row.id}`} row={row} />
        }
        if (row.kind === "move") {
          return (
            <MoveCard
              key={`move-${row.id}`}
              row={row}
              generation={generation}
              showSectionLink={searchMode}
            />
          )
        }
        if (row.kind === "ability") {
          return (
            <AbilityCard
              key={`ability-${row.id}`}
              row={row}
              generation={generation}
              showSectionLink={searchMode}
            />
          )
        }
        return <ItemCard key={`item-${row.id}`} row={row} />
      })}
    </div>
  )
}

function PokemonCard({ row }: { row: PokemonRow }) {
  const primaryStats = row.stats.special
    ? ["hp", "attack", "defense", "special", "speed"]
    : [
        "hp",
        "attack",
        "defense",
        "special-attack",
        "special-defense",
        "speed",
      ]

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex gap-4 p-4">
        <div className="grid size-24 shrink-0 place-items-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
          {/* Media is proxied so the application cache owns the upstream request. */}
          <Image
            src={`/api/media/pokemon/${row.id}`}
            alt=""
            width={80}
            height={80}
            unoptimized
            loading="lazy"
            className="size-20 object-contain [image-rendering:pixelated]"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold text-zinc-400">
            #{String(row.id).padStart(4, "0")}
          </div>
          <h2 className="truncate text-lg font-black tracking-[-0.025em]">
            {row.label}
          </h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {row.types.map((type) => (
              <TypeBadge key={type} type={type} />
            ))}
          </div>
          <div className="mt-3 truncate text-xs text-zinc-500">
            {row.abilities.length
              ? row.abilities.map(humanizeIdentifier).join(" · ")
              : "Abilities not used in this generation"}
          </div>
        </div>
      </div>
      <div
        className={cn(
          "grid border-t border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40",
          primaryStats.length === 5 ? "grid-cols-5" : "grid-cols-6"
        )}
      >
        {primaryStats.map((stat) => (
          <div
            key={stat}
            className="border-r border-zinc-100 px-2 py-2.5 text-center last:border-r-0 dark:border-zinc-800"
          >
            <div className="text-[9px] font-bold tracking-wide text-zinc-400 uppercase">
              {statLabel(stat)}
            </div>
            <div className="mt-0.5 font-mono text-xs font-bold">
              {row.stats[stat] ?? "—"}
            </div>
          </div>
        ))}
      </div>
    </article>
  )
}

function MoveTable({ rows }: { rows: MoveRow[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <table className="w-full min-w-[900px] text-left">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-[10px] tracking-[0.14em] text-zinc-500 uppercase dark:border-zinc-800 dark:bg-zinc-950/50">
          <tr>
            <th className="px-4 py-3">Move</th>
            <th className="px-3 py-3">Type</th>
            <th className="px-3 py-3">Power</th>
            <th className="px-3 py-3">Accuracy</th>
            <th className="px-3 py-3">PP</th>
            <th className="px-4 py-3">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {rows.map((row) => (
            <tr key={row.id} className="align-top hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
              <td className="px-4 py-3">
                <div className="font-semibold">{row.label}</div>
                <div className="text-xs text-zinc-400">#{row.id}</div>
              </td>
              <td className="px-3 py-3">
                <TypeBadge type={row.type} />
              </td>
              <Metric value={row.power} />
              <Metric value={row.accuracy} suffix={row.accuracy ? "%" : ""} />
              <Metric value={row.pp} />
              <td className="max-w-xl px-4 py-3 text-xs leading-relaxed text-zinc-500">
                {row.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MoveCard({
  row,
  generation,
  showSectionLink,
}: {
  row: MoveRow
  generation: number
  showSectionLink: boolean
}) {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-zinc-400">Move #{row.id}</div>
          <h2 className="text-lg font-black">{row.label}</h2>
        </div>
        <Swords className="size-5 text-zinc-400" />
      </div>
      <div className="mt-2 flex gap-2">
        <TypeBadge type={row.type} />
        <span className="text-xs text-zinc-500">{row.damageClass}</span>
      </div>
      <div className="mt-4 grid grid-cols-3 rounded-lg bg-zinc-50 p-2 text-center dark:bg-zinc-950">
        <MiniMetric label="Power" value={row.power} />
        <MiniMetric label="Accuracy" value={row.accuracy} />
        <MiniMetric label="PP" value={row.pp} />
      </div>
      <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-zinc-500">
        {row.description}
      </p>
      {showSectionLink ? (
        <SearchResultLink
          generation={generation}
          section="moves"
          name={row.name}
        />
      ) : null}
    </article>
  )
}

function AbilityCard({
  row,
  generation,
  showSectionLink,
}: {
  row: AbilityRow
  generation: number
  showSectionLink: boolean
}) {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
          <Sparkles className="size-5" />
        </div>
        <div>
          <div className="text-xs font-bold text-zinc-400">
            Ability #{row.id}
          </div>
          <h2 className="font-black">{row.label}</h2>
        </div>
      </div>
      <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-zinc-500">
        {row.description}
      </p>
      {showSectionLink ? (
        <SearchResultLink
          generation={generation}
          section="abilities"
          name={row.name}
        />
      ) : null}
    </article>
  )
}

function ItemCard({ row }: { row: ItemRow }) {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start gap-3">
        <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
          <Image
            src={`/api/media/item/${row.id}`}
            alt=""
            width={40}
            height={40}
            unoptimized
            loading="lazy"
            className="size-10 object-contain [image-rendering:pixelated]"
          />
        </div>
        <div>
          <div className="text-xs font-bold text-zinc-400">Item #{row.id}</div>
          <h2 className="font-black">{row.label}</h2>
        </div>
      </div>
      <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-zinc-500">
        {row.description}
      </p>
    </article>
  )
}

function SearchResultLink({
  generation,
  section,
  name,
}: {
  generation: number
  section: string
  name: string
}) {
  return (
    <Link
      href={`/generation/${generation}/${section}?q=${encodeURIComponent(name)}`}
      className="mt-3 inline-flex text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
    >
      Open in {section}
    </Link>
  )
}

function Metric({
  value,
  suffix = "",
}: {
  value: number | null
  suffix?: string
}) {
  return (
    <td className="px-3 py-3 font-mono text-sm font-semibold">
      {value ?? "—"}
      {value !== null ? suffix : ""}
    </td>
  )
}

function MiniMetric({
  label,
  value,
}: {
  label: string
  value: number | null
}) {
  return (
    <div>
      <div className="text-[9px] font-bold tracking-wide text-zinc-400 uppercase">
        {label}
      </div>
      <div className="font-mono text-sm font-bold">{value ?? "—"}</div>
    </div>
  )
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (value: string) => void
  options: readonly (readonly [string, string])[]
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 min-w-0 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950"
    >
      {options.map(([optionValue, label]) => (
        <option key={optionValue} value={optionValue}>
          {label}
        </option>
      ))}
    </select>
  )
}

function PagerButton({
  label,
  icon: Icon,
  iconAfter,
  disabled,
  onClick,
}: {
  label: string
  icon: typeof ChevronLeft
  iconAfter?: boolean
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900"
    >
      {!iconAfter && <Icon className="size-3.5" />}
      {label}
      {iconAfter && <Icon className="size-3.5" />}
    </button>
  )
}

function searchableText(row: ExplorerRow) {
  if (row.kind === "pokemon") {
    return [row.name, row.label, ...row.types, ...row.abilities]
      .join(" ")
      .toLowerCase()
  }
  if (row.kind === "move") {
    return [row.name, row.label, row.type, row.damageClass, row.description]
      .join(" ")
      .toLowerCase()
  }
  return [row.name, row.label, row.description].join(" ").toLowerCase()
}

function compareRows(a: ExplorerRow, b: ExplorerRow, sort: SortKey) {
  if (sort === "name") return a.label.localeCompare(b.label)
  if (sort === "stat-total") {
    return valueForSort(b, sort) - valueForSort(a, sort)
  }
  if (sort === "power" || sort === "accuracy" || sort === "pp") {
    return valueForSort(b, sort) - valueForSort(a, sort)
  }
  return a.id - b.id
}

function valueForSort(row: ExplorerRow, sort: SortKey) {
  if (sort === "stat-total" && row.kind === "pokemon") return row.statTotal
  if (sort === "power" && row.kind === "move") return row.power ?? -1
  if (sort === "accuracy" && row.kind === "move") return row.accuracy ?? -1
  if (sort === "pp" && row.kind === "move") return row.pp ?? -1
  return -1
}

function statLabel(stat: string) {
  const labels: Record<string, string> = {
    hp: "HP",
    attack: "Atk",
    defense: "Def",
    special: "Spc",
    "special-attack": "SpA",
    "special-defense": "SpD",
    speed: "Spe",
  }
  return labels[stat] ?? stat
}

function sectionTitle(section: ExplorerSection) {
  const titles: Record<ExplorerSection, string> = {
    search: "Global search",
    pokemon: "Pokémon",
    moves: "Moves",
    abilities: "Abilities",
    items: "Items",
    types: "Type chart",
  }
  return titles[section]
}

function sectionDescription(section: ExplorerSection, count: number) {
  if (section === "search") {
    return `Search across ${count.toLocaleString()} generation-scoped Pokémon, moves, abilities, and items.`
  }
  if (section === "pokemon") {
    return `${count.toLocaleString()} species introduced in this generation, with battle types, abilities, and base stats.`
  }
  if (section === "moves") {
    return `${count.toLocaleString()} moves introduced in this generation, with core battle values and effects.`
  }
  if (section === "abilities") {
    return `${count.toLocaleString()} main-series abilities introduced in this generation.`
  }
  return `${count.toLocaleString()} resources available for this generation.`
}
