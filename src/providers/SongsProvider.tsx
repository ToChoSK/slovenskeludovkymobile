import { Timestamp } from "firebase/firestore"
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { isRegionIncluded } from "@/lib/regions"
import { findLiveTitleMatches, normalizeSearchText, searchSongsWithProgress, songToMetadataRow, type AsyncSongSearchProgress, type SongSearchIndexEntry } from "@/lib/search"
import {
  addNextSong as addNextSongRemote,
  addTextVersion as addTextVersionRemote,
  createSong as createSongRemote,
  deleteSong as deleteSongRemote,
  deleteTextVersion as deleteTextVersionRemote,
  incrementSongViewCount,
  likeTextVersion as likeTextVersionRemote,
  removeNextSong as removeNextSongRemote,
  toggleFavoriteSong as toggleFavoriteSongRemote,
  toggleNextSongLikeWithCount,
  updateSong as updateSongRemote,
  updateTextVersion as updateTextVersionRemote,
} from "@/services/firestore"
import { ensureOfflineDataset, loadOfflineSearchIndex, loadOfflineSong, loadOfflineSongs, persistSongDeletion, persistSongOverride } from "@/services/offline-songs"
import type { MetadataAllSongsDoc, OfflineDatasetMeta, Song, SongCatalogItem, SongIndexSortKey, SongTextVersion } from "@/types"

type SongsContextValue = {
  songs: SongCatalogItem[]
  metadata: MetadataAllSongsDoc | null
  offlineMeta: OfflineDatasetMeta | null
  loading: boolean
  error: string | null
  getSongPreview: (songId: number) => SongCatalogItem | null
  titleSuggestions: (query: string, limit?: number) => SongCatalogItem[]
  searchSongs: (query: string, onProgress?: (progress: AsyncSongSearchProgress) => void) => Promise<SongCatalogItem[]>
  getSong: (songId: number) => Promise<Song | null>
  getSongs: (songIds: number[]) => Promise<Song[]>
  createSong: (input: { title: string; obec: string | null; region: string | null; links: string[]; text: string; userAddedId: string | null }) => Promise<number>
  updateSong: (songId: number, patch: Partial<Omit<Song, "id" | "creationTime" | "userAddedId" | "docId">>) => Promise<void>
  deleteSong: (songId: number) => Promise<void>
  addTextVersion: (songId: number, text: string) => Promise<void>
  updateTextVersion: (songId: number, textVersionId: number, text: string) => Promise<void>
  deleteTextVersion: (songId: number, textVersionId: number) => Promise<void>
  toggleFavoriteSong: (userId: string, songId: number, isFavorite: boolean) => Promise<void>
  likeTextVersion: (userId: string, songId: number, textVersionId: number, alreadyLiked: boolean) => Promise<void>
  addNextSong: (songId: number, nextSongId: number) => Promise<void>
  removeNextSong: (songId: number, nextSongId: number) => Promise<void>
  toggleNextSongLike: (userId: string, songId: number, nextSongId: number, alreadyLiked: boolean) => Promise<void>
  incrementViewCount: (songId: number) => Promise<void>
}

const SongsContext = createContext<SongsContextValue | null>(null)

function toCatalogSong(song: Pick<Song, "id" | "title" | "obec" | "region" | "favoriteCount" | "viewCount">): SongCatalogItem {
  return {
    id: song.id,
    title: song.title,
    obec: song.obec,
    region: song.region,
    favoriteCount: song.favoriteCount,
    viewCount: song.viewCount,
  }
}

function sortSongs(rows: SongCatalogItem[], sortBy: SongIndexSortKey, sortDir: "asc" | "desc") {
  return [...rows].sort((a, b) => {
    const compare =
      sortBy === "views"
        ? a.viewCount - b.viewCount
        : sortBy === "favorites"
          ? a.favoriteCount - b.favoriteCount
          : sortBy === "obec"
            ? String(a.obec ?? "").localeCompare(String(b.obec ?? ""), "sk", { sensitivity: "base" })
            : sortBy === "region"
              ? String(a.region ?? "").localeCompare(String(b.region ?? ""), "sk", { sensitivity: "base" })
              : a.title.localeCompare(b.title, "sk", { sensitivity: "base" })
    return sortDir === "asc" ? compare || a.id - b.id : -(compare || a.id - b.id)
  })
}

export function SongsProvider({ children }: { children: ReactNode }) {
  const [songs, setSongs] = useState<SongCatalogItem[]>([])
  const [meta, setMeta] = useState<OfflineDatasetMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const songCacheRef = useRef<Map<number, Song>>(new Map())
  const searchIndexRef = useRef<SongSearchIndexEntry[] | null>(null)

  useEffect(() => {
    let alive = true
    void ensureOfflineDataset()
      .then((bundle) => {
        if (!alive) return
        setSongs(bundle.songs)
        setMeta(bundle.meta)
        setError(null)
      })
      .catch((reason: Error) => {
        if (!alive) return
        setError(reason.message)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  const metadata = useMemo<MetadataAllSongsDoc>(() => ({ count: songs.length, rows: songs.map(songToMetadataRow) }), [songs])
  const songsById = useMemo(() => new Map(songs.map((song) => [song.id, song])), [songs])
  const titleIndex = useMemo<SongSearchIndexEntry[]>(
    () =>
      songs.map((song) => ({
        songId: song.id,
        title: song.title,
        titleKey: normalizeSearchText(song.title),
        region: song.region,
        regionKey: normalizeSearchText(song.region ?? ""),
        obec: song.obec,
        obecKey: normalizeSearchText(song.obec ?? ""),
        fulltextKey: "",
      })),
    [songs],
  )

  async function ensureSong(songId: number) {
    const cached = songCacheRef.current.get(songId)
    if (cached) return cached
    const song = await loadOfflineSong(songId)
    if (song) songCacheRef.current.set(songId, song)
    return song
  }

  async function ensureSongs(songIds: number[]) {
    const missingSongIds = songIds.filter((songId) => !songCacheRef.current.has(songId))
    if (missingSongIds.length > 0) {
      const loadedSongs = await loadOfflineSongs(missingSongIds)
      for (const song of loadedSongs) songCacheRef.current.set(song.id, song)
    }
    return songIds.map((songId) => songCacheRef.current.get(songId)).filter((song): song is Song => !!song)
  }

  useEffect(() => {
    if (loading || songs.length === 0 || songCacheRef.current.size > 0) return
    const timeoutId = setTimeout(() => {
      void loadOfflineSongs([songs[0]?.id].filter((songId): songId is number => typeof songId === "number")).then((loadedSongs) => {
        for (const song of loadedSongs) songCacheRef.current.set(song.id, song)
      })
    }, 600)
    return () => clearTimeout(timeoutId)
  }, [loading, songs])

  async function ensureSearchIndex() {
    if (!searchIndexRef.current) searchIndexRef.current = await loadOfflineSearchIndex()
    return searchIndexRef.current
  }

  async function upsertLocalSong(song: Song) {
    const nextMeta = await persistSongOverride(song, meta)
    setMeta(nextMeta)
    setSongs((current) => {
      const nextCatalogSong = toCatalogSong(song)
      const index = current.findIndex((item) => item.id === song.id)
      if (index < 0) return [...current, nextCatalogSong]
      const next = [...current]
      next[index] = nextCatalogSong
      return next
    })
    songCacheRef.current.set(song.id, song)
    if (searchIndexRef.current) {
      const nextEntry = {
        songId: song.id,
        title: song.title,
        titleKey: normalizeSearchText(song.title),
        region: song.region,
        regionKey: normalizeSearchText(song.region ?? ""),
        obec: song.obec,
        obecKey: normalizeSearchText(song.obec ?? ""),
        fulltextKey: normalizeSearchText([song.title, song.region, song.obec, ...song.textVersions.map((version) => version.text)].filter(Boolean).join(" ")),
      }
      searchIndexRef.current = [...searchIndexRef.current.filter((item) => item.songId !== song.id), nextEntry].sort((a, b) => a.songId - b.songId)
    }
  }

  async function removeLocalSong(songId: number) {
    const nextMeta = await persistSongDeletion(songId, meta)
    setMeta(nextMeta)
    setSongs((current) => current.filter((item) => item.id !== songId))
    songCacheRef.current.delete(songId)
    if (searchIndexRef.current) searchIndexRef.current = searchIndexRef.current.filter((item) => item.songId !== songId)
  }

  const value = useMemo<SongsContextValue>(
    () => ({
      songs,
      metadata,
      offlineMeta: meta,
      loading,
      error,
      getSongPreview: (songId) => songsById.get(songId) ?? null,
      titleSuggestions: (query, limit = 8) =>
        findLiveTitleMatches(titleIndex, query, limit)
          .map((entry) => songsById.get(entry.songId))
          .filter((song): song is SongCatalogItem => !!song),
      searchSongs: async (query, onProgress) => {
        const ids = await searchSongsWithProgress(await ensureSearchIndex(), query, { onProgress })
        return ids.map((id) => songsById.get(id)).filter((song): song is SongCatalogItem => !!song)
      },
      getSong: async (songId) => (await ensureSong(songId)) ?? null,
      getSongs: async (songIds) => ensureSongs(songIds),
      createSong: async ({ title, obec, region, links, text, userAddedId }) => {
        const textVersions: SongTextVersion[] = text.trim() ? [{ id: 1, creationTime: Timestamp.now(), likes: 0, text: text.trim() }] : []
        const songId = await createSongRemote({ title, obec, region, links, textVersions, userAddedId })
        const nextSong: Song = {
          id: songId,
          title,
          obec,
          region,
          links,
          textVersions,
          favoriteCount: 0,
          viewCount: 0,
          creationTime: Timestamp.now(),
          nextSongs: [],
          userAddedId,
        }
        await upsertLocalSong(nextSong)
        return songId
      },
      updateSong: async (songId, patch) => {
        const current = await ensureSong(songId)
        if (!current) throw new Error("Pieseň sa nenašla.")
        await updateSongRemote(songId, patch)
        await upsertLocalSong({ ...current, ...patch })
      },
      deleteSong: async (songId) => {
        await deleteSongRemote(songId)
        await removeLocalSong(songId)
      },
      addTextVersion: async (songId, text) => {
        const current = await ensureSong(songId)
        if (!current) throw new Error("Pieseň sa nenašla.")
        const nextId = Math.max(0, ...current.textVersions.map((item) => item.id)) + 1
        await addTextVersionRemote(songId, text)
        await upsertLocalSong({ ...current, textVersions: [...current.textVersions, { id: nextId, creationTime: Timestamp.now(), likes: 0, text }] })
      },
      updateTextVersion: async (songId, textVersionId, text) => {
        const current = await ensureSong(songId)
        if (!current) throw new Error("Pieseň sa nenašla.")
        await updateTextVersionRemote(songId, textVersionId, text)
        await upsertLocalSong({ ...current, textVersions: current.textVersions.map((version) => (version.id === textVersionId ? { ...version, text } : version)) })
      },
      deleteTextVersion: async (songId, textVersionId) => {
        const current = await ensureSong(songId)
        if (!current) throw new Error("Pieseň sa nenašla.")
        await deleteTextVersionRemote(songId, textVersionId)
        await upsertLocalSong({ ...current, textVersions: current.textVersions.filter((version) => version.id !== textVersionId) })
      },
      toggleFavoriteSong: async (userId, songId, isFavorite) => {
        const current = await ensureSong(songId)
        if (!current) throw new Error("Pieseň sa nenašla.")
        await toggleFavoriteSongRemote(userId, songId)
        const nextSong = { ...current, favoriteCount: Math.max(0, current.favoriteCount + (isFavorite ? -1 : 1)) }
        songCacheRef.current.set(songId, nextSong)
        setSongs((currentSongs) => currentSongs.map((item) => (item.id === songId ? toCatalogSong(nextSong) : item)))
      },
      likeTextVersion: async (userId, songId, textVersionId, alreadyLiked) => {
        const current = await ensureSong(songId)
        if (!current) throw new Error("Pieseň sa nenašla.")
        await likeTextVersionRemote(userId, songId, textVersionId)
        const nextSong = {
          ...current,
          textVersions: current.textVersions.map((version) =>
            version.id === textVersionId ? { ...version, likes: Math.max(0, version.likes + (alreadyLiked ? -1 : 1)) } : version,
          ),
        }
        songCacheRef.current.set(songId, nextSong)
      },
      addNextSong: async (songId, nextSongId) => {
        const current = await ensureSong(songId)
        if (!current) throw new Error("Pieseň sa nenašla.")
        await addNextSongRemote(songId, nextSongId)
        if (!current.nextSongs.some((item) => item.id === nextSongId)) {
          const nextSong = { ...current, nextSongs: [...current.nextSongs, { id: nextSongId, likes: 0 }] }
          songCacheRef.current.set(songId, nextSong)
          void persistSongOverride(nextSong, meta).then((nextMeta) => {
            setMeta(nextMeta)
          })
        }
      },
      removeNextSong: async (songId, nextSongId) => {
        const current = await ensureSong(songId)
        if (!current) throw new Error("Pieseň sa nenašla.")
        await removeNextSongRemote(songId, nextSongId)
        const nextSong = { ...current, nextSongs: current.nextSongs.filter((item) => item.id !== nextSongId) }
        songCacheRef.current.set(songId, nextSong)
        void persistSongOverride(nextSong, meta).then((nextMeta) => {
          setMeta(nextMeta)
        })
      },
      toggleNextSongLike: async (userId, songId, nextSongId, alreadyLiked) => {
        const current = await ensureSong(songId)
        if (!current) throw new Error("Pieseň sa nenašla.")
        await toggleNextSongLikeWithCount(songId, nextSongId, userId)
        const nextSong = {
          ...current,
          nextSongs: current.nextSongs.map((item) => (item.id === nextSongId ? { ...item, likes: Math.max(0, item.likes + (alreadyLiked ? -1 : 1)) } : item)),
        }
        songCacheRef.current.set(songId, nextSong)
      },
      incrementViewCount: async (songId) => {
        const current = await ensureSong(songId)
        if (!current) return

        const nextSong = { ...current, viewCount: current.viewCount + 1 }
        songCacheRef.current.set(songId, nextSong)
        setSongs((currentSongs) => currentSongs.map((item) => (item.id === songId ? toCatalogSong(nextSong) : item)))

        void incrementSongViewCount(songId)
      },
    }),
    [songs, metadata, meta, loading, error, titleIndex, songsById],
  )

  return <SongsContext.Provider value={value}>{children}</SongsContext.Provider>
}

export function useSongs() {
  const value = useContext(SongsContext)
  if (!value) throw new Error("useSongs musí byť použitý v SongsProvider.")
  return value
}

export function useSongsQuery(params: {
  region?: string | "all"
  search?: string
  sortBy?: SongIndexSortKey
  sortDir?: "asc" | "desc"
}) {
  const { songs } = useSongs()

  return useMemo(() => {
    const q = normalizeSearchText(params.search ?? "")
    const sortBy = params.sortBy ?? "views"
    const sortDir = params.sortDir ?? "desc"

    const filtered = songs.filter((song) => {
      if (!isRegionIncluded(params.region ?? "all", song.region)) return false
      if (!q) return true
      return normalizeSearchText([song.title, song.obec, song.region].join(" ")).includes(q)
    })

    const rows = sortSongs(filtered, sortBy, sortDir).map(songToMetadataRow)
    return { rows, total: rows.length }
  }, [songs, params.region, params.search, params.sortBy, params.sortDir])
}
