import * as FileSystem from "expo-file-system/legacy"
import bundledCatalog from "../../songs.catalog.json"
import { buildSongSearchIndex, songToMetadataRow, type SongSearchIndexEntry } from "@/lib/search"
import type { MetadataAllSongsDoc, OfflineDatasetBundle, OfflineDatasetMeta, OfflineSongOverrides, Song, SongCatalogItem } from "@/types"

const META_PATH = `${FileSystem.documentDirectory}allSongs.cached.meta.json`
const OVERRIDES_PATH = `${FileSystem.documentDirectory}allSongs.overrides.json`
let overridesCache: OfflineSongOverrides | null | undefined
let overridesPromise: Promise<OfflineSongOverrides | null> | null = null
let bundledSongsMapCache: Map<number, Song> | null = null
let bundledSongsMapPromise: Promise<Map<number, Song>> | null = null

function normalizeSong(raw: any): Song {
  return {
    creationTime: raw.creationTime ?? new Date().toISOString(),
    favoriteCount: typeof raw.favoriteCount === "number" ? raw.favoriteCount : 0,
    id: Number(raw.id ?? 0),
    links: Array.isArray(raw.links) ? raw.links.filter((item: unknown): item is string => typeof item === "string") : [],
    nextSongs: Array.isArray(raw.nextSongs) ? raw.nextSongs.map((item: any) => ({ id: Number(item.id ?? item), likes: Number(item.likes ?? 0) })) : [],
    obec: typeof raw.obec === "string" ? raw.obec : null,
    region: typeof raw.region === "string" ? raw.region : null,
    textVersions: Array.isArray(raw.textVersions)
      ? raw.textVersions
          .map((item: any, index: number) => ({
            creationTime: item.creationTime ?? raw.creationTime ?? new Date().toISOString(),
            id: typeof item.id === "number" ? item.id : index + 1,
            likes: typeof item.likes === "number" ? item.likes : 0,
            text: typeof item.text === "string" ? item.text : "",
          }))
          .filter((item: { text: string }) => item.text.length > 0)
      : [],
    title: typeof raw.title === "string" ? raw.title : "",
    userAddedId: typeof raw.userAddedId === "string" ? raw.userAddedId : null,
    viewCount: typeof raw.viewCount === "number" ? raw.viewCount : 0,
  }
}

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

function toMetadata(songs: SongCatalogItem[]): MetadataAllSongsDoc {
  const rows = songs.map(songToMetadataRow)
  return { count: rows.length, rows }
}

async function readFile<T>(path: string): Promise<T | null> {
  const info = await FileSystem.getInfoAsync(path)
  if (!info.exists) return null
  return JSON.parse(await FileSystem.readAsStringAsync(path)) as T
}

async function readOverrides() {
  if (overridesCache !== undefined) return overridesCache
  if (!overridesPromise) {
    overridesPromise = readFile<OfflineSongOverrides>(OVERRIDES_PATH).then((value) => {
      overridesCache = value
      overridesPromise = null
      return value
    })
  }
  return overridesPromise
}

async function writeFile(path: string, value: unknown) {
  await FileSystem.writeAsStringAsync(path, JSON.stringify(value))
}

function buildLocalMeta(previous?: OfflineDatasetMeta | null): OfflineDatasetMeta {
  return {
    downloadedAt: previous?.downloadedAt ?? new Date().toISOString(),
    etag: previous?.etag ?? null,
    lastModified: previous?.lastModified ?? null,
    source: previous?.source ?? "bundled",
  }
}

function normalizeCatalogSongs(raw: any[]): SongCatalogItem[] {
  return raw.map((song) => ({
    id: Number(song.id ?? 0),
    title: typeof song.title === "string" ? song.title : "",
    obec: typeof song.obec === "string" ? song.obec : null,
    region: typeof song.region === "string" ? song.region : null,
    favoriteCount: typeof song.favoriteCount === "number" ? song.favoriteCount : 0,
    viewCount: typeof song.viewCount === "number" ? song.viewCount : 0,
  }))
}

function applyOverridesToCatalog(baseSongs: SongCatalogItem[], overrides: OfflineSongOverrides | null | undefined): SongCatalogItem[] {
  if (!overrides || Object.keys(overrides).length === 0) return baseSongs
  const map = new Map(baseSongs.map((song) => [song.id, song]))

  for (const [key, value] of Object.entries(overrides)) {
    const songId = Number(key)
    if (!songId) continue
    if (value == null) {
      map.delete(songId)
      continue
    }
    map.set(songId, toCatalogSong(normalizeSong(value)))
  }

  return Array.from(map.values()).sort((a, b) => a.id - b.id)
}

function applyOverridesToSearchIndex(baseIndex: SongSearchIndexEntry[], overrides: OfflineSongOverrides | null | undefined): SongSearchIndexEntry[] {
  if (!overrides || Object.keys(overrides).length === 0) return baseIndex
  const map = new Map(baseIndex.map((entry) => [entry.songId, entry]))

  for (const [key, value] of Object.entries(overrides)) {
    const songId = Number(key)
    if (!songId) continue
    if (value == null) {
      map.delete(songId)
      continue
    }
    const song = normalizeSong(value)
    map.set(songId, buildSongSearchIndex([song])[0])
  }

  return Array.from(map.values()).sort((a, b) => a.songId - b.songId)
}

function loadBundledSearchIndex(): SongSearchIndexEntry[] {
  return require("../../songs.search-index.json") as SongSearchIndexEntry[]
}

async function loadBundledSongsMap() {
  if (bundledSongsMapCache) return bundledSongsMapCache
  if (!bundledSongsMapPromise) {
    bundledSongsMapPromise = Promise.resolve().then(() => {
      console.log("[offline-songs] loadBundledSongsMap:start")
      const payload = require("../../allsongs.json") as Song[]
      console.log("[offline-songs] loadBundledSongsMap:required", Array.isArray(payload) ? payload.length : "invalid")
      const map = new Map<number, Song>()
      for (const rawSong of payload) {
        const song = normalizeSong(rawSong)
        map.set(song.id, song)
      }
      console.log("[offline-songs] loadBundledSongsMap:done", map.size)
      bundledSongsMapCache = map
      bundledSongsMapPromise = null
      return map
    })
  }
  return bundledSongsMapPromise
}

export async function ensureOfflineDataset(): Promise<OfflineDatasetBundle> {
  const [cachedMeta, overrides] = await Promise.all([readFile<OfflineDatasetMeta>(META_PATH), readOverrides()])
  const baseSongs = normalizeCatalogSongs(bundledCatalog as unknown as any[])
  const songs = applyOverridesToCatalog(baseSongs, overrides)
  const meta = cachedMeta ?? { downloadedAt: new Date().toISOString(), source: "bundled" as const }
  return { songs, metadata: toMetadata(songs), meta }
}

export async function loadOfflineSearchIndex(): Promise<SongSearchIndexEntry[]> {
  const overrides = await readOverrides()
  return applyOverridesToSearchIndex(loadBundledSearchIndex(), overrides)
}

export async function loadOfflineSong(songId: number): Promise<Song | null> {
  console.log("[offline-songs] loadOfflineSong:start", songId)
  const overrides = await readOverrides()
  const override = overrides?.[String(songId)]
  if (override === null) return null
  if (override) return normalizeSong(override)

  const song = (await loadBundledSongsMap()).get(songId) ?? null
  console.log("[offline-songs] loadOfflineSong:done", songId, !!song)
  return song
}

export async function loadOfflineSongs(songIds: number[]): Promise<Song[]> {
  if (songIds.length === 0) return []
  console.log("[offline-songs] loadOfflineSongs:start", songIds.length)

  const overrides = await readOverrides()
  const results = new Map<number, Song>()

  for (const songId of songIds) {
    const override = overrides?.[String(songId)]
    if (override === null) continue
    if (override) {
      results.set(songId, normalizeSong(override))
    }
  }

  const missingSongIds = songIds.filter((songId) => !results.has(songId))
  if (missingSongIds.length > 0) {
    const bundledMap = await loadBundledSongsMap()
    for (const songId of missingSongIds) {
      const song = bundledMap.get(songId)
      if (song) results.set(songId, song)
    }
  }

  const loadedSongs = songIds.map((songId) => results.get(songId)).filter((song): song is Song => !!song)
  console.log("[offline-songs] loadOfflineSongs:done", loadedSongs.length)
  return loadedSongs
}

export async function persistSongOverride(song: Song, previousMeta?: OfflineDatasetMeta | null): Promise<OfflineDatasetMeta> {
  const [currentOverrides] = await Promise.all([readOverrides()])
  const meta = buildLocalMeta(previousMeta)
  const nextOverrides: OfflineSongOverrides = { ...(currentOverrides ?? {}), [String(song.id)]: song }
  await Promise.all([writeFile(OVERRIDES_PATH, nextOverrides), writeFile(META_PATH, meta)])
  overridesCache = nextOverrides
  return meta
}

export async function persistSongDeletion(songId: number, previousMeta?: OfflineDatasetMeta | null): Promise<OfflineDatasetMeta> {
  const [currentOverrides] = await Promise.all([readOverrides()])
  const meta = buildLocalMeta(previousMeta)
  const nextOverrides: OfflineSongOverrides = { ...(currentOverrides ?? {}), [String(songId)]: null }
  await Promise.all([writeFile(OVERRIDES_PATH, nextOverrides), writeFile(META_PATH, meta)])
  overridesCache = nextOverrides
  return meta
}
