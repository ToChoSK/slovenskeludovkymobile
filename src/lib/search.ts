import { InteractionManager } from "react-native"
import type { AllSongsRow, Song } from "@/types"

export type SongSearchIndexEntry = {
  songId: number
  title: string
  titleKey: string
  region: string | null
  regionKey: string
  obec: string | null
  obecKey: string
  fulltextKey: string
}

export type AsyncSongSearchProgress = {
  processed: number
  total: number
  ratio: number
}

const PLACEHOLDER_DZH = "q"
const PLACEHOLDER_DZ = "w"
const PLACEHOLDER_CH = "x"

function canonicalizePhonetics(input: string): string {
  return input
    .replaceAll(PLACEHOLDER_DZH, "c")
    .replaceAll(PLACEHOLDER_DZ, "c")
    .replaceAll(PLACEHOLDER_CH, "h")
    .replace(/[yi]/g, "i")
    .replace(/[bp]/g, "p")
    .replace(/[dt]/g, "t")
    .replace(/[zs]/g, "s")
    .replace(/[gk]/g, "k")
    .replace(/[vf]/g, "f")
}

export function normalizeSearchText(input: unknown): string {
  return canonicalizePhonetics(
    String(input ?? "")
      .toLowerCase()
      .replaceAll("\u0064\u017e", PLACEHOLDER_DZH)
      .replaceAll("dz", PLACEHOLDER_DZ)
      .replaceAll("ch", PLACEHOLDER_CH)
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^\p{L}\p{N}\s]+/gu, " ")
      .replace(/\s+/g, " ")
      .trim(),
  )
}

export function songToMetadataRow(song: Pick<Song, "id" | "title" | "obec" | "region" | "favoriteCount" | "viewCount">): AllSongsRow {
  return {
    i: song.id,
    o: song.obec,
    r: song.region,
    t: song.title,
    f: song.favoriteCount,
    v: song.viewCount,
  }
}

export function buildSongSearchIndex(songs: Song[]): SongSearchIndexEntry[] {
  return songs.map((song) => ({
    songId: song.id,
    title: song.title,
    titleKey: normalizeSearchText(song.title),
    region: song.region,
    regionKey: normalizeSearchText(song.region ?? ""),
    obec: song.obec,
    obecKey: normalizeSearchText(song.obec ?? ""),
    fulltextKey: normalizeSearchText([song.title, song.region, song.obec, ...song.textVersions.map((version) => version.text)].filter(Boolean).join(" ")),
  }))
}

export function findLiveTitleMatches(index: SongSearchIndexEntry[], query: string, limit = 8): SongSearchIndexEntry[] {
  const normalizedQuery = normalizeSearchText(query)
  if (!normalizedQuery) return []

  const startsWith: SongSearchIndexEntry[] = []
  const includes: SongSearchIndexEntry[] = []

  for (const entry of index) {
    if (entry.titleKey.startsWith(normalizedQuery)) {
      startsWith.push(entry)
    } else if (entry.titleKey.includes(normalizedQuery)) {
      includes.push(entry)
    }

    if (startsWith.length + includes.length >= limit * 2) break
  }

  return [...startsWith, ...includes].slice(0, limit)
}

export async function searchSongsWithProgress(
  index: SongSearchIndexEntry[],
  query: string,
  options?: {
    signal?: { cancelled: boolean }
    onProgress?: (progress: AsyncSongSearchProgress) => void
    chunkSize?: number
  },
): Promise<number[]> {
  const normalizedQuery = normalizeSearchText(query)
  if (!normalizedQuery) return []

  const chunkSize = options?.chunkSize ?? 200
  const matches: number[] = []

  for (let offset = 0; offset < index.length; offset += chunkSize) {
    if (options?.signal?.cancelled) return []
    const end = Math.min(offset + chunkSize, index.length)

    for (let i = offset; i < end; i++) {
      if (index[i].fulltextKey.includes(normalizedQuery)) matches.push(index[i].songId)
    }

    const processed = end
    options?.onProgress?.({
      processed,
      total: index.length,
      ratio: index.length === 0 ? 1 : processed / index.length,
    })

    // Yield to the UI thread so animations/touches stay responsive
    await new Promise<void>((resolve) => {
      const handle = InteractionManager.runAfterInteractions(() => resolve())
      // Fallback timeout in case InteractionManager doesn't fire quickly
      setTimeout(() => { handle.cancel(); resolve() }, 8)
    })
  }

  return matches
}

export function matchesOfflineSong(song: Song, query: string): boolean {
  const q = normalizeSearchText(query)
  if (!q) return true
  return normalizeSearchText([song.title, song.obec, song.region, ...song.textVersions.map((version) => version.text)].join(" ")).includes(q)
}
