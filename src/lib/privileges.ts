import { useSyncExternalStore } from "react"
import type { MetadataRolePrivilegesDoc, PrivilegeDefinition, PrivilegeId, UserRole } from "@/types"
import { getAllRolePrivileges } from "@/services/firestore"

export const PRIVILEGES: PrivilegeDefinition[] = [
  { id: "like_text_version", name: "Lajkovať textovú verziu", description: "Používateľ môže pracovať s hodnotením textových verzií." },
  { id: "select_next_song", name: "Vybrať ďalšiu pieseň", description: "Používateľ môže navrhovať nadväzujúce piesne." },
  { id: "add_song", name: "Pridať pieseň", description: "Používateľ môže vytvárať nové piesne." },
  { id: "manage_favorites", name: "Spravovať obľúbené", description: "Používateľ môže pridávať a odoberať obľúbené piesne." },
  { id: "manage_albums", name: "Spravovať albumy", description: "Používateľ môže vytvárať a spravovať albumy." },
  { id: "add_text_version", name: "Pridať textovú verziu", description: "Používateľ môže pridávať ďalšie textové verzie." },
  { id: "edit_song", name: "Upraviť pieseň", description: "Používateľ môže meniť metadáta piesne." },
  { id: "edit_text_version", name: "Upraviť textovú verziu", description: "Používateľ môže meniť textové verzie." },
  { id: "delete_song", name: "Vymazať pieseň", description: "Používateľ môže odstrániť pieseň." },
  { id: "delete_text_version", name: "Vymazať textovú verziu", description: "Používateľ môže odstrániť textovú verziu." },
  { id: "manage_privileges", name: "Spravovať oprávnenia", description: "Používateľ môže upravovať oprávnenia rolí." },
  { id: "export_all_songs", name: "Exportovať všetky piesne", description: "Používateľ môže exportovať metadáta všetkých piesní." },
]

const FALLBACK_ROLE_PRIVILEGES: MetadataRolePrivilegesDoc = {
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
  superadmin: PRIVILEGES.map((item) => item.id),
}

let cache = FALLBACK_ROLE_PRIVILEGES
let initialized = false
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((listener) => listener())
}

async function bootstrap() {
  try {
    cache = await getAllRolePrivileges()
  } catch {
    cache = FALLBACK_ROLE_PRIVILEGES
  }
  notify()
}

function ensureSubscription() {
  if (initialized) return
  initialized = true
  void bootstrap()
}

function subscribe(listener: () => void) {
  ensureSubscription()
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getAllRolePrivilegesSync() {
  ensureSubscription()
  return cache
}

export function hasRolePrivilege(role: UserRole, privilegeId: PrivilegeId) {
  if (role === "superadmin") return true
  return (getAllRolePrivilegesSync()[role] ?? []).includes(privilegeId)
}

export function hasPrivilege(user: { role: UserRole } | null | undefined, privilegeId: PrivilegeId) {
  return hasRolePrivilege(user?.role ?? "anonymous", privilegeId)
}

export function useHasPrivilege(user: { role: UserRole } | null | undefined, privilegeId: PrivilegeId) {
  useSyncExternalStore(subscribe, getAllRolePrivilegesSync, getAllRolePrivilegesSync)
  return hasPrivilege(user, privilegeId)
}
