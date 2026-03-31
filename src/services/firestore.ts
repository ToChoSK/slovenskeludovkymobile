import {
  Timestamp,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type {
  Album,
  AlbumDoc,
  AllSongsRow,
  MetadataAllSongsDoc,
  MetadataRolePrivilegesDoc,
  NextSong,
  PrivilegeDefinition,
  PrivilegeId,
  Song,
  SongDoc,
  SongTextVersion,
  StoredMetadataAllSongsDoc,
  User,
  UserDoc,
  UserRole,
} from "@/types"

function requireDb() {
  if (!db) throw new Error("Firebase nie je inicializovany.")
  return db
}

const DEFAULT_PRIVILEGES: PrivilegeDefinition[] = [
  { id: "like_text_version", name: "Lajkovat textovu verziu", description: "Pouzivatel moze oznacovat textove verzie piesni." },
  { id: "select_next_song", name: "Vybrat dalsiu piesen", description: "Pouzivatel moze navrhovat nadvazujuce piesne." },
  { id: "add_song", name: "Pridat piesen", description: "Pouzivatel moze vytvarat nove piesne." },
  { id: "manage_favorites", name: "Spravovat oblubene", description: "Pouzivatel moze spravovat svoje oblubene piesne." },
  { id: "manage_albums", name: "Spravovat albumy", description: "Pouzivatel moze vytvarat a upravovat albumy." },
  { id: "add_text_version", name: "Pridat textovu verziu", description: "Pouzivatel moze pridavat textove verzie piesni." },
  { id: "edit_song", name: "Upravit piesen", description: "Pouzivatel moze upravovat existujuce piesne." },
  { id: "edit_text_version", name: "Upravit textovu verziu", description: "Pouzivatel moze upravovat textove verzie." },
  { id: "delete_song", name: "Vymazat piesen", description: "Pouzivatel moze mazat piesne." },
  { id: "delete_text_version", name: "Vymazat textovu verziu", description: "Pouzivatel moze mazat textove verzie." },
  { id: "manage_privileges", name: "Spravovat opravnenia", description: "Pouzivatel moze upravovat opravnenia roli." },
  { id: "export_all_songs", name: "Exportovat vsetky piesne", description: "Pouzivatel moze exportovat metadata vsetkych piesni." },
]

const DEFAULT_ROLE_PRIVILEGES: MetadataRolePrivilegesDoc = {
  anonymous: [],
  guest: ["like_text_version", "select_next_song", "manage_favorites"],
  subscriber: ["like_text_version", "select_next_song", "manage_favorites", "manage_albums", "add_text_version"],
  admin: [
    "like_text_version",
    "select_next_song",
    "add_song",
    "manage_favorites",
    "manage_albums",
    "add_text_version",
    "edit_song",
    "edit_text_version",
    "delete_text_version",
    "export_all_songs",
  ],
  superadmin: DEFAULT_PRIVILEGES.map((item) => item.id),
}

function usersCollection() {
  return collection(requireDb(), "users")
}

function songsCollection() {
  return collection(requireDb(), "songs")
}

function albumsCollection() {
  return collection(requireDb(), "albums")
}

function normalizeSongDoc(data: any): SongDoc {
  const creationTime = data.creationTime instanceof Timestamp ? data.creationTime : Timestamp.now()
  return {
    creationTime,
    favoriteCount: typeof data.favoriteCount === "number" ? data.favoriteCount : 0,
    id: Number(data.id ?? 0),
    links: Array.isArray(data.links) ? data.links.filter((item: unknown): item is string => typeof item === "string") : [],
    nextSongs: Array.isArray(data.nextSongs)
      ? data.nextSongs
          .map((item: any) => {
            const id = Number(item?.id ?? item)
            if (!id) return null
            return { id, likes: Number(item?.likes ?? 0) }
          })
          .filter(Boolean) as NextSong[]
      : [],
    obec: typeof data.obec === "string" ? data.obec : null,
    region: typeof data.region === "string" ? data.region : null,
    textVersions: Array.isArray(data.textVersions)
      ? data.textVersions
          .map((item: any, index: number) => ({
            creationTime: item.creationTime instanceof Timestamp ? item.creationTime : creationTime,
            id: typeof item.id === "number" ? item.id : index + 1,
            likes: typeof item.likes === "number" ? item.likes : 0,
            text: typeof item.text === "string" ? item.text : "",
          }))
          .filter((item: SongTextVersion) => item.text.length > 0)
      : [],
    title: typeof data.title === "string" ? data.title : "",
    userAddedId: typeof data.userAddedId === "string" ? data.userAddedId : null,
    viewCount: typeof data.viewCount === "number" ? data.viewCount : 0,
  }
}

function toSong(docId: string, data: SongDoc): Song {
  return { docId, ...data }
}

function toUser(id: string, data: UserDoc): User {
  return { id, ...data }
}

function toAlbum(id: string, data: AlbumDoc): Album {
  return { id, ...data }
}

function decodeStoredAllSongsPayload(data: StoredMetadataAllSongsDoc | undefined): AllSongsRow[] {
  if (!data) return []

  if (typeof data.payload === "string" && data.payload.length > 0) {
    try {
      const parsed = JSON.parse(data.payload) as {
        regions?: string[]
        obce?: string[]
        ids?: number[]
        titles?: string[]
        regionIndexes?: number[]
        obecIndexes?: number[]
        favoriteCounts?: number[]
        viewCounts?: number[]
      }
      const regions = Array.isArray(parsed.regions) ? parsed.regions.filter((item): item is string => typeof item === "string") : []
      const obce = Array.isArray(parsed.obce) ? parsed.obce.filter((item): item is string => typeof item === "string") : []
      if (!Array.isArray(parsed.ids) || !Array.isArray(parsed.titles)) return []
      return parsed.ids
        .map((id, index): AllSongsRow | null => {
          const title = parsed.titles?.[index]
          if (typeof id !== "number" || typeof title !== "string" || !title.length) return null
          const regionIndex = parsed.regionIndexes?.[index]
          const obecIndex = parsed.obecIndexes?.[index]
          return {
            i: id,
            t: title,
            r: typeof regionIndex === "number" && regionIndex >= 0 ? regions[regionIndex] ?? null : null,
            o: typeof obecIndex === "number" && obecIndex >= 0 ? obce[obecIndex] ?? null : null,
            f: typeof parsed.favoriteCounts?.[index] === "number" ? parsed.favoriteCounts[index] : 0,
            v: typeof parsed.viewCounts?.[index] === "number" ? parsed.viewCounts[index] : 0,
          }
        })
        .filter((row): row is AllSongsRow => !!row)
    } catch {
      return []
    }
  }

  if (Array.isArray(data.rows)) return data.rows
  return []
}

function encodeStoredAllSongsPayload(rows: AllSongsRow[]): string {
  const regions: string[] = []
  const obce: string[] = []
  const regionIndexes: number[] = []
  const obecIndexes: number[] = []
  const favoriteCounts: number[] = []
  const viewCounts: number[] = []
  const ids: number[] = []
  const titles: string[] = []
  const regionMap = new Map<string, number>()
  const obecMap = new Map<string, number>()

  const pushIndexedValue = (map: Map<string, number>, list: string[], value: string | null) => {
    if (value == null) return -1
    const normalized = String(value).trim()
    if (!normalized) return -1
    if (map.has(normalized)) return map.get(normalized) ?? -1
    const nextIndex = list.length
    list.push(normalized)
    map.set(normalized, nextIndex)
    return nextIndex
  }

  for (const row of rows) {
    ids.push(row.i)
    titles.push(row.t)
    regionIndexes.push(pushIndexedValue(regionMap, regions, row.r))
    obecIndexes.push(pushIndexedValue(obecMap, obce, row.o))
    favoriteCounts.push(row.f)
    viewCounts.push(row.v)
  }

  return JSON.stringify({ regions, obce, ids, titles, regionIndexes, obecIndexes, favoriteCounts, viewCounts })
}

function songToMetadataRow(song: Pick<SongDoc, "id" | "title" | "region" | "obec" | "favoriteCount" | "viewCount">): AllSongsRow {
  return { i: song.id, t: song.title, r: song.region, o: song.obec, f: song.favoriteCount, v: song.viewCount }
}

function upsertMetadataAllSongsRow(data: StoredMetadataAllSongsDoc | undefined, row: AllSongsRow): StoredMetadataAllSongsDoc {
  const rows = decodeStoredAllSongsPayload(data)
  const index = rows.findIndex((item) => item.i === row.i)
  if (index >= 0) rows[index] = row
  else rows.push(row)
  return { count: rows.length, payload: encodeStoredAllSongsPayload(rows) }
}

function removeMetadataAllSongsRow(data: StoredMetadataAllSongsDoc | undefined, songId: number): StoredMetadataAllSongsDoc {
  const rows = decodeStoredAllSongsPayload(data).filter((item) => item.i !== songId)
  return { count: rows.length, payload: encodeStoredAllSongsPayload(rows) }
}

async function getSongSnapshotByNumericId(songId: number) {
  const snap = await getDocs(query(songsCollection(), where("id", "==", songId), limit(1)))
  return snap.docs[0] ?? null
}

async function getNextSongId(): Promise<number> {
  const snap = await getDocs(query(songsCollection(), orderBy("id", "desc"), limit(1)))
  if (snap.empty) return 1
  return Number(snap.docs[0].data().id ?? 0) + 1
}

export async function ensureMetadataDefaults(): Promise<void> {
  const firestore = requireDb()
  const batch = writeBatch(firestore)
  const privilegesRef = doc(firestore, "metadata", "privileges")
  const rolePrivilegesRef = doc(firestore, "metadata", "rolePrivileges")
  const [privilegesSnap, rolePrivilegesSnap] = await Promise.all([getDoc(privilegesRef), getDoc(rolePrivilegesRef)])
  if (!privilegesSnap.exists()) batch.set(privilegesRef, { privileges: DEFAULT_PRIVILEGES })
  if (!rolePrivilegesSnap.exists()) batch.set(rolePrivilegesRef, DEFAULT_ROLE_PRIVILEGES)
  if (!privilegesSnap.exists() || !rolePrivilegesSnap.exists()) await batch.commit()
}

export async function createUserProfile(userId: string, data: { email: string; nick: string }) {
  await setDoc(
    doc(requireDb(), "users", userId),
    {
      albumIds: [],
      createdAt: serverTimestamp(),
      email: data.email,
      favoriteSongIds: [],
      nick: data.nick,
      role: "guest",
      songsAdded: [],
      songsNextSongLikes: [],
      songsTextVersionLikes: [],
      textVersionsAdded: [],
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function getUserById(userId: string): Promise<User | null> {
  const snap = await getDoc(doc(requireDb(), "users", userId))
  if (!snap.exists()) return null
  return toUser(snap.id, snap.data() as UserDoc)
}

export async function getAllUsers(): Promise<User[]> {
  const snap = await getDocs(query(usersCollection(), orderBy("email"), limit(200)))
  return snap.docs.map((item) => toUser(item.id, item.data() as UserDoc))
}

export async function updateUserRole(userId: string, role: UserRole) {
  await updateDoc(doc(requireDb(), "users", userId), { role, updatedAt: serverTimestamp() })
}

export async function deleteUser(userId: string) {
  const firestore = requireDb()
  const [userRef, songsSnap] = await Promise.all([doc(firestore, "users", userId), getDocs(query(songsCollection(), where("userAddedId", "==", userId)))])
  const batch = writeBatch(firestore)
  songsSnap.docs.forEach((songDoc) => batch.update(songDoc.ref, { userAddedId: null }))
  batch.delete(userRef)
  await batch.commit()
}

export async function getPrivileges(): Promise<PrivilegeDefinition[]> {
  await ensureMetadataDefaults()
  const snap = await getDoc(doc(requireDb(), "metadata", "privileges"))
  return (snap.data() as { privileges?: PrivilegeDefinition[] } | undefined)?.privileges ?? DEFAULT_PRIVILEGES
}

export async function getAllRolePrivileges(): Promise<MetadataRolePrivilegesDoc> {
  await ensureMetadataDefaults()
  const snap = await getDoc(doc(requireDb(), "metadata", "rolePrivileges"))
  const data = snap.data() as Partial<MetadataRolePrivilegesDoc> | undefined
  return {
    anonymous: data?.anonymous ?? DEFAULT_ROLE_PRIVILEGES.anonymous,
    guest: data?.guest ?? DEFAULT_ROLE_PRIVILEGES.guest,
    subscriber: data?.subscriber ?? DEFAULT_ROLE_PRIVILEGES.subscriber,
    admin: data?.admin ?? DEFAULT_ROLE_PRIVILEGES.admin,
    superadmin: data?.superadmin?.length ? data.superadmin : DEFAULT_ROLE_PRIVILEGES.superadmin,
  }
}

export async function updateRolePrivileges(role: "anonymous" | "guest" | "subscriber" | "admin", privileges: PrivilegeId[]) {
  await updateDoc(doc(requireDb(), "metadata", "rolePrivileges"), { [role]: Array.from(new Set(privileges)) })
}

export async function getMetadataAllSongs(): Promise<MetadataAllSongsDoc> {
  const snap = await getDoc(doc(requireDb(), "metadata", "allSongs"))
  const data = snap.data() as StoredMetadataAllSongsDoc | undefined
  const rows = decodeStoredAllSongsPayload(data)
  return { count: rows.length, rows }
}

export async function getSongById(songId: number): Promise<Song | null> {
  const snap = await getSongSnapshotByNumericId(songId)
  if (!snap) return null
  return toSong(snap.id, normalizeSongDoc(snap.data()))
}

export async function getSongsByIds(songIds: number[]): Promise<Song[]> {
  return (await Promise.all(songIds.map((songId) => getSongById(songId)))).filter((item): item is Song => !!item)
}

export async function createSong(input: {
  title: string
  obec: string | null
  region: string | null
  links: string[]
  textVersions: SongTextVersion[]
  userAddedId: string | null
}) {
  const nextId = await getNextSongId()
  const firestore = requireDb()
  const ref = doc(songsCollection())
  const metadataRef = doc(firestore, "metadata", "allSongs")
  await runTransaction(firestore, async (transaction) => {
    const metadataDoc = await transaction.get(metadataRef)
    transaction.set(ref, {
      creationTime: serverTimestamp(),
      favoriteCount: 0,
      id: nextId,
      links: input.links,
      nextSongs: [],
      obec: input.obec,
      region: input.region,
      textVersions: input.textVersions,
      title: input.title,
      userAddedId: input.userAddedId,
      viewCount: 0,
    })
    transaction.set(
      metadataRef,
      upsertMetadataAllSongsRow(metadataDoc.data() as StoredMetadataAllSongsDoc | undefined, {
        i: nextId,
        t: input.title,
        r: input.region,
        o: input.obec,
        f: 0,
        v: 0,
      }),
      { merge: false },
    )
    if (input.userAddedId) {
      transaction.update(doc(firestore, "users", input.userAddedId), {
        songsAdded: arrayUnion(nextId),
        updatedAt: serverTimestamp(),
      })
    }
  })
  return nextId
}

export async function updateSong(songId: number, patch: Partial<Omit<SongDoc, "id" | "creationTime" | "userAddedId">>) {
  const snap = await getSongSnapshotByNumericId(songId)
  if (!snap) throw new Error("Piesen sa nenasla.")
  const firestore = requireDb()
  const metadataRef = doc(firestore, "metadata", "allSongs")
  await runTransaction(firestore, async (transaction) => {
    const [songDoc, metadataDoc] = await Promise.all([transaction.get(snap.ref), transaction.get(metadataRef)])
    if (!songDoc.exists()) throw new Error("Piesen sa nenasla.")
    const currentSong = normalizeSongDoc(songDoc.data())
    const nextSong: SongDoc = {
      ...currentSong,
      ...patch,
      id: currentSong.id,
      creationTime: currentSong.creationTime,
      userAddedId: currentSong.userAddedId,
    }
    transaction.update(snap.ref, patch)
    transaction.set(
      metadataRef,
      upsertMetadataAllSongsRow(metadataDoc.data() as StoredMetadataAllSongsDoc | undefined, songToMetadataRow(nextSong)),
      { merge: false },
    )
  })
}

export async function deleteSong(songId: number) {
  const snap = await getSongSnapshotByNumericId(songId)
  if (!snap) return
  const firestore = requireDb()
  const metadataRef = doc(firestore, "metadata", "allSongs")
  await runTransaction(firestore, async (transaction) => {
    const metadataDoc = await transaction.get(metadataRef)
    transaction.delete(snap.ref)
    transaction.set(metadataRef, removeMetadataAllSongsRow(metadataDoc.data() as StoredMetadataAllSongsDoc | undefined, songId), { merge: false })
  })
}

export async function addTextVersion(songId: number, text: string) {
  const song = await getSongById(songId)
  if (!song) throw new Error("Piesen sa nenasla.")
  const nextId = Math.max(0, ...song.textVersions.map((item) => item.id)) + 1
  await updateSong(songId, {
    textVersions: [...song.textVersions, { id: nextId, creationTime: Timestamp.now(), likes: 0, text }],
  })
}

export async function updateTextVersion(songId: number, textVersionId: number, text: string) {
  const song = await getSongById(songId)
  if (!song) throw new Error("Piesen sa nenasla.")
  await updateSong(songId, {
    textVersions: song.textVersions.map((item) => (item.id === textVersionId ? { ...item, text } : item)),
  })
}

export async function deleteTextVersion(songId: number, textVersionId: number) {
  const song = await getSongById(songId)
  if (!song) throw new Error("Piesen sa nenasla.")
  await updateSong(songId, {
    textVersions: song.textVersions.filter((item) => item.id !== textVersionId),
  })
}

export async function toggleFavoriteSong(userId: string, songId: number) {
  const songSnap = await getSongSnapshotByNumericId(songId)
  if (!songSnap) throw new Error("Piesen sa nenasla.")
  const firestore = requireDb()
  const userRef = doc(firestore, "users", userId)
  const metadataRef = doc(firestore, "metadata", "allSongs")
  await runTransaction(firestore, async (transaction) => {
    const [userDoc, songDoc, metadataDoc] = await Promise.all([transaction.get(userRef), transaction.get(songSnap.ref), transaction.get(metadataRef)])
    if (!userDoc.exists() || !songDoc.exists()) throw new Error("Udaje sa nenasli.")
    const user = userDoc.data() as UserDoc
    const song = normalizeSongDoc(songDoc.data())
    const hasFavorite = user.favoriteSongIds.includes(songId)
    const nextFavoriteCount = Math.max(0, song.favoriteCount + (hasFavorite ? -1 : 1))
    transaction.update(userRef, {
      favoriteSongIds: hasFavorite ? arrayRemove(songId) : arrayUnion(songId),
      updatedAt: serverTimestamp(),
    })
    transaction.update(songSnap.ref, { favoriteCount: nextFavoriteCount })
    transaction.set(
      metadataRef,
      upsertMetadataAllSongsRow(
        metadataDoc.data() as StoredMetadataAllSongsDoc | undefined,
        songToMetadataRow({ ...song, favoriteCount: nextFavoriteCount }),
      ),
      { merge: false },
    )
  })
}

export async function incrementSongViewCount(songId: number) {
  const snap = await getSongSnapshotByNumericId(songId)
  if (!snap) return
  const firestore = requireDb()
  const metadataRef = doc(firestore, "metadata", "allSongs")
  await runTransaction(firestore, async (transaction) => {
    const [songDoc, metadataDoc] = await Promise.all([transaction.get(snap.ref), transaction.get(metadataRef)])
    if (!songDoc.exists()) return
    const song = normalizeSongDoc(songDoc.data())
    const nextViewCount = song.viewCount + 1
    transaction.update(snap.ref, { viewCount: increment(1) })
    transaction.set(
      metadataRef,
      upsertMetadataAllSongsRow(
        metadataDoc.data() as StoredMetadataAllSongsDoc | undefined,
        songToMetadataRow({ ...song, viewCount: nextViewCount }),
      ),
      { merge: false },
    )
  })
}

export async function addNextSong(songId: number, nextSongId: number) {
  const song = await getSongById(songId)
  if (!song) throw new Error("Piesen sa nenasla.")
  if (song.nextSongs.some((item) => item.id === nextSongId)) return
  await updateSong(songId, { nextSongs: [...song.nextSongs, { id: nextSongId, likes: 0 }] })
}

export async function removeNextSong(songId: number, nextSongId: number) {
  const song = await getSongById(songId)
  if (!song) throw new Error("Piesen sa nenasla.")
  await updateSong(songId, { nextSongs: song.nextSongs.filter((item) => item.id !== nextSongId) })
}

export async function toggleNextSongLikeWithCount(songId: number, nextSongId: number, userId: string) {
  const [user, song] = await Promise.all([getUserById(userId), getSongById(songId)])
  if (!user || !song) throw new Error("Udaje sa nenasli.")
  const exists = user.songsNextSongLikes.some((item) => item.songId === songId && item.nextSongId === nextSongId)
  const nextUserLikes = exists
    ? user.songsNextSongLikes.filter((item) => !(item.songId === songId && item.nextSongId === nextSongId))
    : [...user.songsNextSongLikes, { songId, nextSongId }]
  let found = false
  const nextSongs = song.nextSongs.map((item) => {
    if (item.id !== nextSongId) return item
    found = true
    return { ...item, likes: Math.max(0, item.likes + (exists ? -1 : 1)) }
  })
  if (!found && !exists) nextSongs.push({ id: nextSongId, likes: 1 })
  await Promise.all([
    updateDoc(doc(requireDb(), "users", userId), { songsNextSongLikes: nextUserLikes, updatedAt: serverTimestamp() }),
    updateSong(songId, { nextSongs }),
  ])
}

export async function likeTextVersion(userId: string, songId: number, textVersionId: number) {
  const [user, song] = await Promise.all([getUserById(userId), getSongById(songId)])
  if (!user || !song) throw new Error("Udaje sa nenasli.")
  const alreadyLiked = user.songsTextVersionLikes.some((item) => item.songId === songId && item.textVersionId === textVersionId)
  const nextLikes = alreadyLiked
    ? user.songsTextVersionLikes.filter((item) => !(item.songId === songId && item.textVersionId === textVersionId))
    : [...user.songsTextVersionLikes, { songId, textVersionId }]
  await Promise.all([
    updateDoc(doc(requireDb(), "users", userId), { songsTextVersionLikes: nextLikes, updatedAt: serverTimestamp() }),
    updateSong(songId, {
      textVersions: song.textVersions.map((item) =>
        item.id === textVersionId ? { ...item, likes: Math.max(0, item.likes + (alreadyLiked ? -1 : 1)) } : item,
      ),
    }),
  ])
}

export async function exportAllSongsIndex() {
  const metadata = await getMetadataAllSongs()
  return {
    json: JSON.stringify(metadata, null, 2),
    version: new Date().toISOString(),
    count: metadata.count,
  }
}

export async function createAlbum(userId: string, input: { title: string; description: string | null }) {
  const firestore = requireDb()
  const ref = doc(albumsCollection())
  await setDoc(ref, {
    ownerUserId: userId,
    title: input.title,
    description: input.description,
    songIds: [],
    songsCount: 0,
    editorUserIds: [],
    isPublic: false,
    shareSlug: null,
    coverSongId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  await updateDoc(doc(firestore, "users", userId), {
    albumIds: arrayUnion(ref.id),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function getAlbumById(albumId: string): Promise<Album | null> {
  const snap = await getDoc(doc(requireDb(), "albums", albumId))
  if (!snap.exists()) return null
  return toAlbum(snap.id, snap.data() as AlbumDoc)
}

export async function getUserAlbums(userId: string): Promise<Album[]> {
  const snap = await getDocs(query(albumsCollection(), where("ownerUserId", "==", userId), orderBy("updatedAt", "desc"), limit(100)))
  return snap.docs.map((item) => toAlbum(item.id, item.data() as AlbumDoc))
}

export async function deleteAlbum(albumId: string, userId: string) {
  const firestore = requireDb()
  const batch = writeBatch(firestore)
  batch.delete(doc(firestore, "albums", albumId))
  batch.update(doc(firestore, "users", userId), { albumIds: arrayRemove(albumId), updatedAt: serverTimestamp() })
  await batch.commit()
}

export async function addSongToAlbum(albumId: string, songId: number) {
  const album = await getAlbumById(albumId)
  if (!album || album.songIds.includes(songId)) return
  await updateDoc(doc(requireDb(), "albums", albumId), {
    songIds: arrayUnion(songId),
    songsCount: album.songsCount + 1,
    coverSongId: album.coverSongId ?? songId,
    updatedAt: serverTimestamp(),
  })
}

export async function removeSongFromAlbum(albumId: string, songId: number) {
  const album = await getAlbumById(albumId)
  if (!album) return
  const nextSongIds = album.songIds.filter((id) => id !== songId)
  await updateDoc(doc(requireDb(), "albums", albumId), {
    songIds: arrayRemove(songId),
    songsCount: nextSongIds.length,
    coverSongId: album.coverSongId === songId ? nextSongIds[0] ?? null : album.coverSongId,
    updatedAt: serverTimestamp(),
  })
}
