import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { isRegionIncluded } from "@/lib/regions"
import { matchesOfflineSong, normalizeText, songToMetadataRow } from "@/lib/search"
import { useAppMode } from "@/providers/AppModeProvider"
import { getMetadataAllSongs, getSongById, getSongsByIds } from "@/services/firestore"
import type { MetadataAllSongsDoc, Song, SongIndexSortKey } from "@/types"

type SongsContextValue = {
  metadata: MetadataAllSongsDoc | null
  loading: boolean
  error: string | null
  getSong: (songId: number) => Promise<Song | null>
  getSongs: (songIds: number[]) => Promise<Song[]>
  offlineSongs: Song[]
}

const SongsContext = createContext<SongsContextValue | null>(null)

export function SongsProvider({ children }: { children: ReactNode }) {
  const { mode, dataset } = useAppMode()
  const [metadata, setMetadata] = useState<MetadataAllSongsDoc | null>(dataset?.metadata ?? null)
  const [loading, setLoading] = useState(mode === "online")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (mode === "offline") {
      setMetadata(dataset?.metadata ?? null)
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    void getMetadataAllSongs()
      .then((next) => {
        if (!alive) return
        setMetadata(next)
        setError(null)
      })
      .catch((reason: Error) => {
        if (alive) setError(reason.message)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [mode, dataset?.metadata])

  const value = useMemo<SongsContextValue>(
    () => ({
      metadata,
      loading,
      error,
      offlineSongs: dataset?.songs ?? [],
      getSong: async (songId) => {
        if (mode === "offline") return dataset?.songs.find((song) => song.id === songId) ?? null
        return getSongById(songId)
      },
      getSongs: async (songIds) => {
        if (mode === "offline") {
          const map = new Map((dataset?.songs ?? []).map((song) => [song.id, song]))
          return songIds.map((id) => map.get(id)).filter((song): song is Song => !!song)
        }
        return getSongsByIds(songIds)
      },
    }),
    [metadata, loading, error, dataset, mode],
  )

  return <SongsContext.Provider value={value}>{children}</SongsContext.Provider>
}

export function useSongs() {
  const value = useContext(SongsContext)
  if (!value) throw new Error("useSongs musi byt pouzity v SongsProvider.")
  return value
}

export function useSongsQuery(params: {
  region?: string | "all"
  search?: string
  sortBy?: SongIndexSortKey
  sortDir?: "asc" | "desc"
}) {
  const { metadata, offlineSongs } = useSongs()
  const { mode } = useAppMode()

  return useMemo(() => {
    const sortBy = params.sortBy ?? "views"
    const sortDir = params.sortDir ?? "desc"
    const rows = mode === "offline" ? offlineSongs.map(songToMetadataRow) : metadata?.rows ?? []
    const q = normalizeText(params.search ?? "")

    const filtered = rows.filter((row) => {
      if (!isRegionIncluded(params.region ?? "all", row.r)) return false
      if (!q) return true
      if (mode === "offline") {
        const song = offlineSongs.find((item) => item.id === row.i)
        return song ? matchesOfflineSong(song, q) : false
      }
      return normalizeText(row.t).includes(q) || normalizeText(row.o ?? "").includes(q)
    })

    const sorted = [...filtered].sort((a, b) => {
      const compare =
        sortBy === "views"
          ? a.v - b.v
          : sortBy === "favorites"
            ? a.f - b.f
            : sortBy === "obec"
              ? String(a.o ?? "").localeCompare(String(b.o ?? ""), "sk", { sensitivity: "base" })
              : sortBy === "region"
                ? String(a.r ?? "").localeCompare(String(b.r ?? ""), "sk", { sensitivity: "base" })
                : a.t.localeCompare(b.t, "sk", { sensitivity: "base" })
      return sortDir === "asc" ? compare || a.i - b.i : -(compare || a.i - b.i)
    })

    return {
      rows: sorted,
      total: sorted.length,
    }
  }, [metadata?.rows, mode, offlineSongs, params.region, params.search, params.sortBy, params.sortDir])
}
