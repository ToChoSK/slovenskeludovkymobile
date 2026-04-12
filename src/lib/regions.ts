export const MAP_REGION_KEYS = [
  "abov",
  "gemer",
  "hont",
  "horehronie",
  "kysuce",
  "liptov",
  "myjava",
  "novohrad",
  "orava",
  "podpolanie",
  "podunajsko",
  "pohronie",
  "ponitrie",
  "povazie",
  "saris",
  "spis",
  "tekov",
  "turiec",
  "zahorie",
  "zemplin",
] as const

export const EXTRA_REGION_KEYS = ["vychod", "stred", "zapad", "slovensko"] as const
export type RegionKey = (typeof MAP_REGION_KEYS)[number] | (typeof EXTRA_REGION_KEYS)[number]

export const REGION_META: Record<RegionKey, { label: string; color: string }> = {
  abov: { label: "Abov", color: "#f59e0b" },
  gemer: { label: "Gemer", color: "#f97316" },
  hont: { label: "Hont", color: "#16a34a" },
  horehronie: { label: "Horehronie", color: "#0f766e" },
  kysuce: { label: "Kysuce", color: "#0284c7" },
  liptov: { label: "Liptov", color: "#22c55e" },
  myjava: { label: "Myjava", color: "#3b82f6" },
  novohrad: { label: "Novohrad", color: "#14b8a6" },
  orava: { label: "Orava", color: "#06b6d4" },
  podpolanie: { label: "Podpoľanie", color: "#15803d" },
  podunajsko: { label: "Podunajsko", color: "#60a5fa" },
  pohronie: { label: "Pohronie", color: "#10b981" },
  ponitrie: { label: "Ponitrie", color: "#1d4ed8" },
  povazie: { label: "Považie", color: "#1e40af" },
  saris: { label: "Šariš", color: "#dc2626" },
  spis: { label: "Spiš", color: "#fb923c" },
  tekov: { label: "Tekov", color: "#38bdf8" },
  turiec: { label: "Turiec", color: "#84cc16" },
  zahorie: { label: "Záhorie", color: "#0f4c81" },
  zemplin: { label: "Zemplín", color: "#ef4444" },
  vychod: { label: "Východ", color: "#f97316" },
  stred: { label: "Stred", color: "#16a34a" },
  zapad: { label: "Západ", color: "#2563eb" },
  slovensko: { label: "Slovensko", color: "#7c3aed" },
}

const REGION_GROUPS: Record<(typeof EXTRA_REGION_KEYS)[number], readonly (typeof MAP_REGION_KEYS)[number][]> = {
  vychod: ["abov", "gemer", "saris", "spis", "zemplin"],
  stred: ["hont", "horehronie", "kysuce", "liptov", "novohrad", "orava", "podpolanie", "pohronie", "turiec"],
  zapad: ["myjava", "podunajsko", "ponitrie", "povazie", "tekov", "zahorie"],
  slovensko: MAP_REGION_KEYS,
}

export function normalizeLooseString(value?: string | null): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[\s_-]+/g, "")
}

const LABEL_TO_KEY = new Map<string, RegionKey>(
  (Object.keys(REGION_META) as RegionKey[]).map((key) => [normalizeLooseString(REGION_META[key].label), key]),
)

export function resolveRegionKey(input?: string | null): RegionKey | undefined {
  const normalized = normalizeLooseString(input)
  if (!normalized) return undefined
  if ((REGION_META as Record<string, unknown>)[normalized]) return normalized as RegionKey
  return LABEL_TO_KEY.get(normalized)
}

export function isRegionIncluded(selected: string | undefined, songRegion: string | null): boolean {
  if (!selected || selected === "all") return true
  const selectedKey = resolveRegionKey(selected)
  const songKey = resolveRegionKey(songRegion)
  if (!selectedKey || selectedKey === "slovensko") return true
  if (!songKey) return false
  if (songKey === selectedKey) return true
  if (selectedKey in REGION_GROUPS) return (REGION_GROUPS as Record<string, readonly string[]>)[selectedKey].includes(songKey)
  return false
}
