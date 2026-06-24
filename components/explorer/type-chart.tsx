"use client"

import * as React from "react"
import { Calculator, Shield } from "lucide-react"

import { TypeBadge } from "./type-badge"
import type { TypeChart as TypeChartData } from "@/lib/pokeapi/types"
import { cn } from "@/lib/utils"

export function TypeChart({
  generation,
  chart,
}: {
  generation: number
  chart: TypeChartData
}) {
  const [firstType, setFirstType] = React.useState(chart.types[0] ?? "")
  const [secondType, setSecondType] = React.useState("")

  const incoming = chart.types.map((attacking) => ({
    type: attacking,
    multiplier:
      multiplier(chart, attacking, firstType) *
      (secondType ? multiplier(chart, attacking, secondType) : 1),
  }))

  return (
    <div>
      <div className="mb-6">
        <div className="text-[11px] font-bold tracking-[0.18em] text-emerald-700 uppercase dark:text-emerald-400">
          Generation {generation}
        </div>
        <h1 className="mt-1 text-3xl font-black tracking-[-0.045em] sm:text-4xl">
          Type chart
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
          Historical attack multipliers for the types available in this
          generation. Rows attack; columns defend.
        </p>
      </div>

      <section className="mb-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2 font-bold">
          <Calculator className="size-4 text-emerald-600" />
          Defensive calculator
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <TypeSelect
            label="Primary type"
            value={firstType}
            types={chart.types}
            onChange={setFirstType}
          />
          <TypeSelect
            label="Secondary type"
            value={secondType}
            types={chart.types}
            optional
            onChange={setSecondType}
          />
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-9">
          {incoming.map((item) => (
            <div
              key={item.type}
              className={cn(
                "rounded-xl border px-2 py-3 text-center",
                item.multiplier > 1
                  ? "border-red-200 bg-red-50 dark:border-red-950 dark:bg-red-950/30"
                  : item.multiplier < 1
                    ? "border-emerald-200 bg-emerald-50 dark:border-emerald-950 dark:bg-emerald-950/30"
                    : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
              )}
            >
              <TypeBadge type={item.type} className="scale-90" />
              <div className="mt-2 font-mono text-sm font-black">
                ×{formatMultiplier(item.multiplier)}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2 border-b border-zinc-200 px-5 py-4 font-bold dark:border-zinc-800">
          <Shield className="size-4 text-emerald-600" />
          Full matchup matrix
        </div>
        <div className="max-h-[70svh] overflow-auto">
          <table className="border-collapse text-center text-xs">
            <thead className="sticky top-0 z-20 bg-zinc-50 dark:bg-zinc-950">
              <tr>
                <th className="sticky left-0 z-30 min-w-24 border-r border-b border-zinc-200 bg-zinc-50 p-2 text-left dark:border-zinc-800 dark:bg-zinc-950">
                  ATK ↓ / DEF →
                </th>
                {chart.types.map((type) => (
                  <th
                    key={type}
                    className="min-w-16 border-b border-zinc-200 p-2 dark:border-zinc-800"
                  >
                    <span className="inline-block -rotate-45 py-3 text-[9px] font-bold uppercase">
                      {type}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chart.types.map((attacking) => (
                <tr key={attacking}>
                  <th className="sticky left-0 z-10 border-r border-b border-zinc-200 bg-white p-2 text-left dark:border-zinc-800 dark:bg-zinc-900">
                    <TypeBadge type={attacking} />
                  </th>
                  {chart.types.map((defending) => {
                    const value = multiplier(chart, attacking, defending)
                    return (
                      <td
                        key={defending}
                        className={cn(
                          "border-b border-zinc-100 p-2 font-mono font-bold dark:border-zinc-800",
                          value === 0 && "bg-zinc-200 dark:bg-zinc-700",
                          value === 0.5 &&
                            "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
                          value === 2 &&
                            "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200"
                        )}
                      >
                        {value === 1 ? "·" : formatMultiplier(value)}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function TypeSelect({
  label,
  value,
  types,
  optional,
  onChange,
}: {
  label: string
  value: string
  types: string[]
  optional?: boolean
  onChange: (value: string) => void
}) {
  return (
    <label>
      <span className="mb-1.5 block text-xs font-semibold text-zinc-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
      >
        {optional ? <option value="">None</option> : null}
        {types.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
    </label>
  )
}

function multiplier(chart: TypeChartData, attacking: string, defending: string) {
  return (
    chart.cells.find(
      (cell) =>
        cell.attacking === attacking && cell.defending === defending
    )?.multiplier ?? 1
  )
}

function formatMultiplier(value: number) {
  if (value === 0.25) return "¼"
  if (value === 0.5) return "½"
  return String(value)
}
