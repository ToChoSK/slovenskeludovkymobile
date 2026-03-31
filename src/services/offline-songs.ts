import * as FileSystem from "expo-file-system/legacy"
import bundledSongs from "../../allsongs.json"
import { songToMetadataRow } from "@/lib/search"
import type { MetadataAllSongsDoc, OfflineDatasetBundle, OfflineDatasetMeta, Song } from "@/types"

const SONGS_PATH = `${FileSystem.documentDirectory}allSongs.cached.json`
const META_PATH = `${FileSystem.documentDirectory}allSongs.cached.meta.json`

function normalizeSong(raw: any): Song {
  return {
    creationTime: raw.creationTime ?? new Date().toISOString(),
    favoriteCount: typeof raw.favoriteCount === "number" ? raw.favoriteCount : 0,
    id: Number(raw.id ?? 0),
    links: Array.isArray(raw.links) ? raw.links.filter((item: unknown): item is string => typeof item === "string") : [],
    nextSongs: Array.isArray(raw.nextSongs)
      ? raw.nextSongs.map((item: any) => ({ id: Number(item.id ?? item), likes: Number(item.likes ?? 0) }))
      : [],
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

function toMetadata(songs: Song[]): MetadataAllSongsDoc {
  const rows = songs.map(songToMetadataRow)
  return { count: rows.length, rows }
}

async function readFile<T>(path: string): Promise<T | null> {
  const info = await FileSystem.getInfoAsync(path)
  if (!info.exists) return null
  return JSON.parse(await FileSystem.readAsStringAsync(path)) as T
}

async function writeBundle(songs: Song[], meta: OfflineDatasetMeta) {
  await FileSystem.writeAsStringAsync(SONGS_PATH, JSON.stringify(songs))
  await FileSystem.writeAsStringAsync(META_PATH, JSON.stringify(meta))
}

export async function ensureOfflineDataset(): Promise<OfflineDatasetBundle> {
  const [cachedSongs, cachedMeta] = await Promise.all([readFile<Song[]>(SONGS_PATH), readFile<OfflineDatasetMeta>(META_PATH)])
  if (cachedSongs?.length) {
    const songs = cachedSongs.map(normalizeSong)
    return { songs, metadata: toMetadata(songs), meta: cachedMeta ?? { downloadedAt: new Date().toISOString(), source: "bundled" } }
  }

  const songs = (bundledSongs as unknown as any[]).map(normalizeSong)
  const meta: OfflineDatasetMeta = { downloadedAt: new Date().toISOString(), source: "bundled" }
  await writeBundle(songs, meta)
  return { songs, metadata: toMetadata(songs), meta }
}

export async function replaceOfflineDataset(songs: Song[], meta: OfflineDatasetMeta): Promise<OfflineDatasetBundle> {
  await writeBundle(songs, meta)
  return { songs, metadata: toMetadata(songs), meta }
}
