import { useSyncExternalStore } from "react"
import type { MetadataRolePrivilegesDoc, PrivilegeDefinition, PrivilegeId, UserRole } from "@/types"
import { getAllRolePrivileges } from "@/services/firestore"

export const PRIVILEGES: PrivilegeDefinition[] = [
  { id: "like_text_version", name: "Lajkovat textovu verziu", description: "Pouzivatel moze pracovat s hodnotenim textovych verzii." },
  { id: "select_next_song", name: "Vybrat dalsiu piesen", description: "Pouzivatel moze navrhovat nadvazujuce piesne." },
  { id: "add_song", name: "Pridat piesen", description: "Pouzivatel moze vytvarat nove piesne." },
  { id: "manage_favorites", name: "Spravovat oblubene", description: "Pouzivatel moze pridavat a odoberat oblubene piesne." },
  { id: "manage_albums", name: "Spravovat albumy", description: "Pouzivatel moze vytvarat a spravovat albumy." },
  { id: "add_text_version", name: "Pridat textovu verziu", description: "Pouzivatel moze pridavat dalsie textove verzie." },
  { id: "edit_song", name: "Upravit piesen", description: "Pouzivatel moze menit metadata piesne." },
  { id: "edit_text_version", name: "Upravit textovu verziu", description: "Pouzivatel moze menit textove verzie." },
  { id: "delete_song", name: "Vymazat piesen", description: "Pouzivatel moze odstranit piesen." },
  { id: "delete_text_version", name: "Vymazat textovu verziu", description: "Pouzivatel moze odstranit textovu verziu." },
  { id: "manage_privileges", name: "Spravovat opravnenia", description: "Pouzivatel moze upravovat opravnenia roli." },
  { id: "export_all_songs", name: "Exportovat vsetky piesne", description: "Pouzivatel moze exportovat metadata vsetkych piesni." },
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
