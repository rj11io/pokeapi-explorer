import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ExplorerShell } from "@/components/explorer/explorer-shell"
import { ResourceExplorer } from "@/components/explorer/resource-explorer"
import { TypeChart } from "@/components/explorer/type-chart"
import { getSectionPayload, getTypeChart } from "@/lib/pokeapi/data"
import { GENERATIONS, isGenerationId } from "@/lib/pokeapi/generations"
import {
  EXPLORER_SECTIONS,
  type ExplorerSection,
} from "@/lib/pokeapi/types"

type Props = {
  params: Promise<{ generation: string; section: string }>
  searchParams: Promise<{ q?: string | string[] }>
}

function parseRoute(generationValue: string, sectionValue: string) {
  const generation = Number(generationValue)
  const section = sectionValue as ExplorerSection

  if (
    !isGenerationId(generation) ||
    !EXPLORER_SECTIONS.includes(section)
  ) {
    notFound()
  }

  return { generation, section }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const values = await params
  const { generation, section } = parseRoute(
    values.generation,
    values.section
  )

  return {
    title: `${GENERATIONS[generation].label} ${section === "types" ? "Type Chart" : section}`,
  }
}

export default async function GenerationSectionPage({
  params,
  searchParams,
}: Props) {
  const values = await params
  const queryValues = await searchParams
  const { generation, section } = parseRoute(
    values.generation,
    values.section
  )

  if (section === "types") {
    const chart = await getTypeChart(generation)
    return (
      <ExplorerShell generation={generation} section={section}>
        <TypeChart generation={generation} chart={chart} />
      </ExplorerShell>
    )
  }

  const payload = await getSectionPayload(generation, section)

  return (
    <ExplorerShell generation={generation} section={section}>
      <ResourceExplorer
        generation={generation}
        section={section}
        rows={payload.rows}
        note={payload.note}
        initialQuery={
          typeof queryValues.q === "string" ? queryValues.q : ""
        }
      />
    </ExplorerShell>
  )
}
