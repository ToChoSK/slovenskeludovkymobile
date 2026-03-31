import { ALL_SONGS_CDN_URL } from "@/lib/config"
import { replaceOfflineDataset } from "@/services/offline-songs"
import type { OfflineDatasetBundle, Song } from "@/types"

function normalizeRemoteSong(raw: any): Song | null {
  if (!raw || typeof raw !== "object") return null
  const id = Number(raw.id ?? 0)
  const title = typeof raw.title === "string" ? raw.title : ""
  if (!id || !title) return null
  return {
    creationTime: raw.creationTime ?? new Date().toISOString(),
    favoriteCount: Number(raw.favoriteCount ?? 0),
    id,
    links: Array.isArray(raw.links) ? raw.links.filter((item: unknown): item is string => typeof item === "string") : [],
    nextSongs: Array.isArray(raw.nextSongs)
      ? raw.nextSongs
          .map((item: any) => {
            const nextId = Number(item?.id ?? item)
            if (!nextId) return null
            return { id: nextId, likes: Number(item?.likes ?? 0) }
          })
          .filter(Boolean) as Song["nextSongs"]
      : [],
    obec: typeof raw.obec === "string" ? raw.obec : null,
    region: typeof raw.region === "string" ? raw.region : null,
    textVersions: Array.isArray(raw.textVersions)
      ? raw.textVersions.map((item: any, index: number) => ({
          creationTime: item.creationTime ?? raw.creationTime ?? new Date().toISOString(),
          id: typeof item.id === "number" ? item.id : index + 1,
          likes: Number(item.likes ?? 0),
          text: typeof item.text === "string" ? item.text : "",
        }))
      : [],
    title,
    userAddedId: typeof raw.userAddedId === "string" ? raw.userAddedId : null,
    viewCount: Number(raw.viewCount ?? 0),
  }
}

export async function syncOfflineDatasetFromCdn(): Promise<OfflineDatasetBundle> {
  if (!ALL_SONGS_CDN_URL) throw new Error("Chyba EXPO_PUBLIC_ALL_SONGS_CDN_URL.")
  const response = await fetch(ALL_SONGS_CDN_URL)
  if (!response.ok) throw new Error(`CDN vratilo ${response.status}.`)
  const payload = await response.json()
  if (!Array.isArray(payload)) throw new Error("CDN subor nema ocakavany format pola piesni.")
  const songs = payload.map(normalizeRemoteSong).filter((song): song is Song => !!song)
  if (!songs.length) throw new Error("CDN subor neobsahuje ziadne validne piesne.")
  return replaceOfflineDataset(songs, {
    downloadedAt: new Date().toISOString(),
    etag: response.headers.get("etag"),
    lastModified: response.headers.get("last-modified"),
    source: "cdn",
  })
}
