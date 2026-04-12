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
  MetadataRolePrivilegesDoc,
  NextSong,
  PrivilegeDefinition,
  PrivilegeId,
  Song,
  SongDoc,
  SongTextVersion,
  User,
  UserDoc,
  UserRole,
} from "@/types"

function requireDb() {
  if (!db) throw new Error("Firebase nie je inicializovaný.")
  return db
}

const DEFAULT_PRIVILEGES: PrivilegeDefinition[] = [
  { id: "like_text_version", name: "Lajkovať textovú verziu", description: "Používateľ môže označovať textové verzie piesní." },
  { id: "select_next_song", name: "Vybrať ďalšiu pieseň", description: "Používateľ môže navrhovať nadväzujúce piesne." },
  { id: "add_song", name: "Pridať pieseň", description: "Používateľ môže vytvárať nové piesne." },
  { id: "manage_favorites", name: "Spravovať obľúbené", description: "Používateľ môže spravovať svoje obľúbené piesne." },
  { id: "manage_albums", name: "Spravovať albumy", description: "Používateľ môže vytvárať a upravovať albumy." },
  { id: "add_text_version", name: "Pridať textovú verziu", description: "Používateľ môže pridávať textové verzie piesní." },
  { id: "edit_song", name: "Upraviť pieseň", description: "Používateľ môže upravovať existujúce piesne." },
  { id: "edit_text_version", name: "Upraviť textovú verziu", description: "Používateľ môže upravovať textové verzie." },
  { id: "delete_song", name: "Vymazať pieseň", description: "Používateľ môže mazať piesne." },
  { id: "delete_text_version", name: "Vymazať textovú verziu", description: "Používateľ môže mazať textové verzie." },
  { id: "manage_privileges", name: "Spravovať oprávnenia", description: "Používateľ môže upravovať oprávnenia rolí." },
  { id: "export_all_songs", name: "Exportovať všetky piesne", description: "Používateľ môže exportovať metadáta všetkých piesní." },
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

async function getAllUsers(): Promise<User[]> {
  const snap = await getDocs(query(usersCollection(), orderBy("email"), limit(200)))
  return snap.docs.map((item) => toUser(item.id, item.data() as UserDoc))
}

async function updateUserRole(userId: string, role: UserRole) {
  await updateDoc(doc(requireDb(), "users", userId), { role, updatedAt: serverTimestamp() })
}

async function deleteUser(userId: string) {
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

async function updateRolePrivileges(role: "anonymous" | "guest" | "subscriber" | "admin", privileges: PrivilegeId[]) {
  await updateDoc(doc(requireDb(), "metadata", "rolePrivileges"), { [role]: Array.from(new Set(privileges)) })
}

async function getSongById(songId: number): Promise<Song | null> {
  const snap = await getSongSnapshotByNumericId(songId)
  if (!snap) return null
  return toSong(snap.id, normalizeSongDoc(snap.data()))
}

async function getSongsByIds(songIds: number[]): Promise<Song[]> {
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
  await runTransaction(firestore, async (transaction) => {
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
  if (!snap) throw new Error("Pieseň sa nenašla.")
  const firestore = requireDb()
  await runTransaction(firestore, async (transaction) => {
    const songDoc = await transaction.get(snap.ref)
    if (!songDoc.exists()) throw new Error("Pieseň sa nenašla.")
    transaction.update(snap.ref, patch)
  })
}

export async function deleteSong(songId: number) {
  const snap = await getSongSnapshotByNumericId(songId)
  if (!snap) return
  await deleteDoc(snap.ref)
}

export async function addTextVersion(songId: number, text: string) {
  const song = await getSongById(songId)
  if (!song) throw new Error("Pieseň sa nenašla.")
  const nextId = Math.max(0, ...song.textVersions.map((item) => item.id)) + 1
  await updateSong(songId, {
    textVersions: [...song.textVersions, { id: nextId, creationTime: Timestamp.now(), likes: 0, text }],
  })
}

export async function updateTextVersion(songId: number, textVersionId: number, text: string) {
  const song = await getSongById(songId)
  if (!song) throw new Error("Pieseň sa nenašla.")
  await updateSong(songId, {
    textVersions: song.textVersions.map((item) => (item.id === textVersionId ? { ...item, text } : item)),
  })
}

export async function deleteTextVersion(songId: number, textVersionId: number) {
  const song = await getSongById(songId)
  if (!song) throw new Error("Pieseň sa nenašla.")
  await updateSong(songId, {
    textVersions: song.textVersions.filter((item) => item.id !== textVersionId),
  })
}

export async function toggleFavoriteSong(userId: string, songId: number) {
  const songSnap = await getSongSnapshotByNumericId(songId)
  if (!songSnap) throw new Error("Pieseň sa nenašla.")
  const firestore = requireDb()
  const userRef = doc(firestore, "users", userId)
  await runTransaction(firestore, async (transaction) => {
    const [userDoc, songDoc] = await Promise.all([transaction.get(userRef), transaction.get(songSnap.ref)])
    if (!userDoc.exists() || !songDoc.exists()) throw new Error("Údaje sa nenašli.")
    const user = userDoc.data() as UserDoc
    const song = normalizeSongDoc(songDoc.data())
    const hasFavorite = user.favoriteSongIds.includes(songId)
    const nextFavoriteCount = Math.max(0, song.favoriteCount + (hasFavorite ? -1 : 1))
    transaction.update(userRef, {
      favoriteSongIds: hasFavorite ? arrayRemove(songId) : arrayUnion(songId),
      updatedAt: serverTimestamp(),
    })
    transaction.update(songSnap.ref, { favoriteCount: nextFavoriteCount })
  })
}

export async function incrementSongViewCount(songId: number) {
  const snap = await getSongSnapshotByNumericId(songId)
  if (!snap) return
  await updateDoc(snap.ref, { viewCount: increment(1) })
}

export async function addNextSong(songId: number, nextSongId: number) {
  const song = await getSongById(songId)
  if (!song) throw new Error("Pieseň sa nenašla.")
  if (song.nextSongs.some((item) => item.id === nextSongId)) return
  await updateSong(songId, { nextSongs: [...song.nextSongs, { id: nextSongId, likes: 0 }] })
}

export async function removeNextSong(songId: number, nextSongId: number) {
  const song = await getSongById(songId)
  if (!song) throw new Error("Pieseň sa nenašla.")
  await updateSong(songId, { nextSongs: song.nextSongs.filter((item) => item.id !== nextSongId) })
}

export async function toggleNextSongLikeWithCount(songId: number, nextSongId: number, userId: string) {
  const [user, song] = await Promise.all([getUserById(userId), getSongById(songId)])
  if (!user || !song) throw new Error("Údaje sa nenašli.")
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
  if (!user || !song) throw new Error("Údaje sa nenašli.")
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

async function exportAllSongsIndex() {
  return { json: JSON.stringify({ count: 0, rows: [] }, null, 2), version: new Date().toISOString(), count: 0 }
}

async function createAlbum(userId: string, input: { title: string; description: string | null }) {
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

async function getAlbumById(albumId: string): Promise<Album | null> {
  const snap = await getDoc(doc(requireDb(), "albums", albumId))
  if (!snap.exists()) return null
  return toAlbum(snap.id, snap.data() as AlbumDoc)
}

async function getUserAlbums(userId: string): Promise<Album[]> {
  const snap = await getDocs(query(albumsCollection(), where("ownerUserId", "==", userId), orderBy("updatedAt", "desc"), limit(100)))
  return snap.docs.map((item) => toAlbum(item.id, item.data() as AlbumDoc))
}

async function deleteAlbum(albumId: string, userId: string) {
  const firestore = requireDb()
  const batch = writeBatch(firestore)
  batch.delete(doc(firestore, "albums", albumId))
  batch.update(doc(firestore, "users", userId), { albumIds: arrayRemove(albumId), updatedAt: serverTimestamp() })
  await batch.commit()
}

async function addSongToAlbum(albumId: string, songId: number) {
  const album = await getAlbumById(albumId)
  if (!album || album.songIds.includes(songId)) return
  await updateDoc(doc(requireDb(), "albums", albumId), {
    songIds: arrayUnion(songId),
    songsCount: album.songsCount + 1,
    coverSongId: album.coverSongId ?? songId,
    updatedAt: serverTimestamp(),
  })
}

async function removeSongFromAlbum(albumId: string, songId: number) {
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
