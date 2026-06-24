import { withRequestPermit } from "./limit"

const DATASET_BASE =
  "https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/"

export type CsvRecord = Record<string, string>

export async function fetchCsv(filename: string): Promise<CsvRecord[]> {
  const result = await withRequestPermit(async () => {
    const response = await fetch(`${DATASET_BASE}${filename}`, {
      cache: "force-cache",
      next: {
        revalidate: 604800,
        tags: ["pokeapi-dataset", `pokeapi-dataset:${filename}`],
      },
    })
    return {
      ok: response.ok,
      text: await response.text(),
    }
  })

  if (!result.ok) {
    throw new Error(`Failed to fetch PokéAPI dataset file ${filename}`)
  }

  return parseCsv(result.text)
}

export function parseCsv(source: string): CsvRecord[] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let quoted = false

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index]

    if (quoted) {
      if (character === '"' && source[index + 1] === '"') {
        field += '"'
        index += 1
      } else if (character === '"') {
        quoted = false
      } else {
        field += character
      }
      continue
    }

    if (character === '"') {
      quoted = true
    } else if (character === ",") {
      row.push(field)
      field = ""
    } else if (character === "\n") {
      row.push(field)
      rows.push(row)
      row = []
      field = ""
    } else if (character !== "\r") {
      field += character
    }
  }

  if (field || row.length) {
    row.push(field)
    rows.push(row)
  }

  const [headers, ...dataRows] = rows
  if (!headers) return []

  return dataRows
    .filter((values) => values.some(Boolean))
    .map((values) =>
      Object.fromEntries(
        headers.map((header, index) => [header, values[index] ?? ""])
      )
    )
}
