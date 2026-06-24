import { cn } from "@/lib/utils"
import { humanizeIdentifier } from "@/lib/pokeapi/format"

const TYPE_COLORS: Record<string, string> = {
  normal: "bg-stone-500",
  fighting: "bg-red-700",
  flying: "bg-sky-500",
  poison: "bg-purple-600",
  ground: "bg-amber-700",
  rock: "bg-yellow-700",
  bug: "bg-lime-600",
  ghost: "bg-violet-800",
  steel: "bg-slate-500",
  fire: "bg-orange-600",
  water: "bg-blue-600",
  grass: "bg-emerald-600",
  electric: "bg-yellow-500 text-zinc-950",
  psychic: "bg-pink-600",
  ice: "bg-cyan-500 text-zinc-950",
  dragon: "bg-indigo-700",
  dark: "bg-zinc-800",
  fairy: "bg-pink-400 text-zinc-950",
}

export function TypeBadge({
  type,
  className,
}: {
  type: string
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide text-white uppercase",
        TYPE_COLORS[type] ?? "bg-zinc-500",
        className
      )}
    >
      {humanizeIdentifier(type)}
    </span>
  )
}
