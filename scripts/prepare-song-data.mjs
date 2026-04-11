import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, "..")
const detailChunkSize = 200

const PLACEHOLDER_DZH = "q"
const PLACEHOLDER_DZ = "w"
const PLACEHOLDER_CH = "x"

function canonicalizePhonetics(input) {
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

function normalizeSearchText(input) {
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

function parseEnv(raw) {
  const result = {}
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const separator = trimmed.indexOf("=")
    if (separator < 0) continue
    const key = trimmed.slice(0, separator).trim()
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "")
    result[key] = value
  }
  return result
}

async function loadEnv() {
  const envPath = path.join(rootDir, ".env")
  try {
    const raw = await readFile(envPath, "utf8")
    return parseEnv(raw)
  } catch {
    return {}
  }
}

function toCatalogSong(song) {
  return {
    id: Number(song.id ?? 0),
    title: typeof song.title === "string" ? song.title : "",
    obec: typeof song.obec === "string" ? song.obec : null,
    region: typeof song.region === "string" ? song.region : null,
    favoriteCount: typeof song.favoriteCount === "number" ? song.favoriteCount : 0,
    viewCount: typeof song.viewCount === "number" ? song.viewCount : 0,
  }
}

function toSearchIndexEntry(song) {
  return {
    songId: Number(song.id ?? 0),
    title: typeof song.title === "string" ? song.title : "",
    titleKey: normalizeSearchText(song.title ?? ""),
    region: typeof song.region === "string" ? song.region : null,
    regionKey: normalizeSearchText(song.region ?? ""),
    obec: typeof song.obec === "string" ? song.obec : null,
    obecKey: normalizeSearchText(song.obec ?? ""),
    fulltextKey: normalizeSearchText(
      [
        song.title,
        song.region,
        song.obec,
        ...(Array.isArray(song.textVersions) ? song.textVersions.map((version) => version?.text ?? "") : []),
      ]
        .filter(Boolean)
        .join(" "),
    ),
  }
}

function toDetailSong(song) {
  return {
    creationTime: song.creationTime ?? new Date().toISOString(),
    favoriteCount: typeof song.favoriteCount === "number" ? song.favoriteCount : 0,
    id: Number(song.id ?? 0),
    links: Array.isArray(song.links) ? song.links.filter((item) => typeof item === "string") : [],
    nextSongs: Array.isArray(song.nextSongs)
      ? song.nextSongs.map((item) => ({
          id: Number(item?.id ?? item ?? 0),
          likes: typeof item?.likes === "number" ? item.likes : 0,
        }))
      : [],
    obec: typeof song.obec === "string" ? song.obec : null,
    region: typeof song.region === "string" ? song.region : null,
    textVersions: Array.isArray(song.textVersions)
      ? song.textVersions.map((item, index) => ({
          creationTime: item?.creationTime ?? song.creationTime ?? new Date().toISOString(),
          id: typeof item?.id === "number" ? item.id : index + 1,
          likes: typeof item?.likes === "number" ? item.likes : 0,
          text: typeof item?.text === "string" ? item.text : "",
        }))
      : [],
    title: typeof song.title === "string" ? song.title : "",
    userAddedId: typeof song.userAddedId === "string" ? song.userAddedId : null,
    viewCount: typeof song.viewCount === "number" ? song.viewCount : 0,
  }
}

async function writeDetailChunks(songs) {
  const detailsDir = path.join(rootDir, "songs.details")
  const loaderPath = path.join(rootDir, "src", "generated", "song-detail-chunks.ts")
  const lookupPath = path.join(rootDir, "songs.detail-lookup.json")
  await mkdir(detailsDir, { recursive: true })
  await mkdir(path.dirname(loaderPath), { recursive: true })

  for (const entry of await readdir(detailsDir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".json")) {
      await rm(path.join(detailsDir, entry.name), { force: true })
    }
  }

  const chunkBySongId = {}
  const switchCases = []
  let chunkId = 0

  for (let index = 0; index < songs.length; index += detailChunkSize) {
    const chunkSongs = songs.slice(index, index + detailChunkSize).map(toDetailSong)
    for (const song of chunkSongs) chunkBySongId[song.id] = chunkId
    await writeFile(path.join(detailsDir, `chunk-${chunkId}.json`), `${JSON.stringify(chunkSongs, null, 2)}\n`, "utf8")
    switchCases.push(`    case ${chunkId}:\n      return require("../../songs.details/chunk-${chunkId}.json") as Song[]`)
    chunkId += 1
  }

  const loaderSource = `import type { Song } from "@/types"

export function loadSongDetailChunk(chunkId: number): Song[] {
  switch (chunkId) {
${switchCases.join("\n")}
    default:
      return []
  }
}
`

  await writeFile(loaderPath, loaderSource, "utf8")
  await writeFile(lookupPath, `${JSON.stringify(chunkBySongId, null, 2)}\n`, "utf8")
}

async function fetchLatestSongs(cdnUrl) {
  const response = await fetch(cdnUrl)
  if (!response.ok) throw new Error(`CDN request failed: ${response.status} ${response.statusText}`)
  return response.json()
}

async function main() {
  const allSongsPath = path.join(rootDir, "allsongs.json")
  const catalogPath = path.join(rootDir, "songs.catalog.json")
  const datasetMetaPath = path.join(rootDir, "songs.dataset-meta.json")
  const searchIndexPath = path.join(rootDir, "songs.search-index.json")
  const sourceMode = process.env.SONG_DATA_SOURCE === "local" ? "local" : "cdn"

  let songs
  if (sourceMode === "local") {
    songs = JSON.parse(await readFile(allSongsPath, "utf8"))
    if (!Array.isArray(songs)) throw new Error("Local allsongs.json payload is not an array.")
  } else {
    const env = await loadEnv()
    const cdnUrl = process.env.EXPO_PUBLIC_ALL_SONGS_CDN_URL || env.EXPO_PUBLIC_ALL_SONGS_CDN_URL
    if (!cdnUrl) throw new Error("Missing EXPO_PUBLIC_ALL_SONGS_CDN_URL in environment.")
    songs = await fetchLatestSongs(cdnUrl)
    if (!Array.isArray(songs)) throw new Error("CDN payload is not an array.")
    await writeFile(allSongsPath, `${JSON.stringify(songs, null, 2)}\n`, "utf8")
  }

  const catalog = songs.map(toCatalogSong)
  const searchIndex = songs.map(toSearchIndexEntry)
  const datasetMeta = {
    count: songs.length,
    sourceMode,
    version: new Date().toISOString(),
  }

  await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8")
  await writeFile(datasetMetaPath, `${JSON.stringify(datasetMeta, null, 2)}\n`, "utf8")
  await writeFile(searchIndexPath, `${JSON.stringify(searchIndex, null, 2)}\n`, "utf8")
  await writeDetailChunks(songs)

  process.stdout.write(`Prepared ${songs.length} songs from ${sourceMode}.\n`)
}

await main()
