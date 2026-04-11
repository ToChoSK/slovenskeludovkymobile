import type { Timestamp } from "firebase/firestore"

export type FirestoreTimestamp = Timestamp | string
export type UserRole = "anonymous" | "guest" | "subscriber" | "admin" | "superadmin"

export type PrivilegeId =
  | "like_text_version"
  | "select_next_song"
  | "add_song"
  | "manage_favorites"
  | "manage_albums"
  | "add_text_version"
  | "edit_song"
  | "edit_text_version"
  | "delete_song"
  | "delete_text_version"
  | "manage_privileges"
  | "export_all_songs"

export interface UserSongNextSongLike {
  songId: number
  nextSongId: number
}

export interface UserSongTextVersionLike {
  songId: number
  textVersionId: number
}

export interface NextSong {
  id: number
  likes: number
}

export interface UserDoc {
  albumIds: string[]
  createdAt: FirestoreTimestamp
  email: string
  favoriteSongIds: number[]
  nick: string
  role: UserRole
  songsAdded: number[]
  songsNextSongLikes: UserSongNextSongLike[]
  songsTextVersionLikes: UserSongTextVersionLike[]
  textVersionsAdded: number[]
  updatedAt: FirestoreTimestamp
}

export interface User extends UserDoc {
  id: string
}

export interface PrivilegeDefinition {
  id: PrivilegeId
  name: string
  description: string
}

export interface MetadataRolePrivilegesDoc {
  admin: PrivilegeId[]
  anonymous: PrivilegeId[]
  guest: PrivilegeId[]
  subscriber: PrivilegeId[]
  superadmin: PrivilegeId[]
}

export interface AllSongsRow {
  i: number
  o: string | null
  r: string | null
  t: string
  f: number
  v: number
}

export interface MetadataAllSongsDoc {
  count: number
  rows: AllSongsRow[]
}

export interface StoredMetadataAllSongsDoc {
  count: number
  payload?: string
  rows?: AllSongsRow[]
  regions?: string[]
  obce?: string[]
  ids?: number[]
  titles?: string[]
  regionIndexes?: number[]
  obecIndexes?: number[]
  favoriteCounts?: number[]
  viewCounts?: number[]
}

export interface SongTextVersion {
  creationTime: FirestoreTimestamp
  id: number
  likes: number
  text: string
}

export interface SongDoc {
  creationTime: FirestoreTimestamp
  favoriteCount: number
  id: number
  links: string[]
  nextSongs: NextSong[]
  obec: string | null
  region: string | null
  textVersions: SongTextVersion[]
  title: string
  userAddedId: string | null
  viewCount: number
}

export interface Song extends SongDoc {
  docId?: string
}

export interface SongCatalogItem {
  id: number
  title: string
  obec: string | null
  region: string | null
  favoriteCount: number
  viewCount: number
}

export interface AlbumDoc {
  ownerUserId: string
  title: string
  description: string | null
  songIds: number[]
  songsCount: number
  editorUserIds: string[]
  isPublic: boolean
  shareSlug: string | null
  coverSongId: number | null
  createdAt: FirestoreTimestamp
  updatedAt: FirestoreTimestamp
}

export interface Album extends AlbumDoc {
  id: string
}

export type SongIndexSortKey = "title" | "region" | "obec" | "favorites" | "views"
export type OfflineMode = "online" | "offline"

export interface OfflineDatasetMeta {
  bundledVersion?: string | null
  downloadedAt: string
  etag?: string | null
  lastModified?: string | null
  source: "bundled" | "cdn"
}

export interface OfflineDatasetBundle {
  songs: SongCatalogItem[]
  metadata: MetadataAllSongsDoc
  meta: OfflineDatasetMeta
}

export type OfflineSongOverrides = Record<string, Song | null>

export type DatasetVersionStatus = "checking" | "current" | "outdated" | "unknown" | "error"

export interface DatasetVersionInfo {
  status: DatasetVersionStatus
  checkedAt?: string | null
  remoteEtag?: string | null
  remoteLastModified?: string | null
  message?: string | null
}
