export function humanizeIdentifier(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function cleanDescription(value: string | undefined) {
  if (!value) return "No English description is available."

  return value
    .replace(/\$effect_chance/g, "the listed chance")
    .replace(/[\n\f\r]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function parseResourceId(url: string) {
  const match = url.match(/\/(\d+)\/?$/)
  return match ? Number(match[1]) : 0
}
