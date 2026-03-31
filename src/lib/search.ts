import type { AllSongsRow, Song } from "@/types"

export function normalizeText(input: unknown): string {
  return String(input ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[.,;:!?'"(){}\[\]\\/_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/y/g, "i")
    .replace(/ch/g, "h")
    .replace(/dz/g, "c")
    .replace(/b/g, "p")
    .replace(/d/g, "t")
    .replace(/z/g, "s")
    .replace(/g/g, "k")
    .replace(/v/g, "f")
}

export function songToMetadataRow(song: Song): AllSongsRow {
  return {
    i: song.id,
    o: song.obec,
    r: song.region,
    t: song.title,
    f: song.favoriteCount,
    v: song.viewCount,
  }
}

export function matchesOfflineSong(song: Song, query: string): boolean {
  const q = normalizeText(query)
  if (!q) return true
  if (normalizeText(song.title).includes(q)) return true
  if (normalizeText(song.obec ?? "").includes(q)) return true
  if (normalizeText(song.region ?? "").includes(q)) return true
  return song.textVersions.some((version) => normalizeText(version.text).includes(q))
}
