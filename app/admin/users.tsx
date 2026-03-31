import { useEffect, useState } from "react"
import { Button, Card, Field, Heading, Screen, Subtle } from "@/components/ui"
import { useAppMode } from "@/providers/AppModeProvider"
import { useAuth } from "@/providers/AuthProvider"
import { useHasPrivilege } from "@/lib/privileges"
import { deleteUser, getAllUsers, updateUserRole } from "@/services/firestore"
import type { User, UserRole } from "@/types"

const ROLES: UserRole[] = ["guest", "subscriber", "admin", "superadmin"]

export default function AdminUsersScreen() {
  const { mode } = useAppMode()
  const { user } = useAuth()
  const canManagePrivileges = useHasPrivilege(user, "manage_privileges")
  const [users, setUsers] = useState<User[]>([])
  const [roleDrafts, setRoleDrafts] = useState<Record<string, string>>({})

  useEffect(() => {
    if (mode === "online" && canManagePrivileges) {
      void getAllUsers().then((data) => {
        setUsers(data)
        setRoleDrafts(Object.fromEntries(data.map((item) => [item.id, item.role])))
      })
    }
  }, [mode, canManagePrivileges])

  if (mode !== "online" || !canManagePrivileges) {
    return (
      <Screen>
        <Card>
          <Heading>Sprava pouzivatelov nie je dostupna</Heading>
        </Card>
      </Screen>
    )
  }

  return (
    <Screen>
      <Card>
        <Heading>Sprava pouzivatelov</Heading>
        {users.map((entry) => (
          <Card key={entry.id}>
            <Subtle>{entry.nick} · {entry.email}</Subtle>
            <Field value={roleDrafts[entry.id] ?? entry.role} onChangeText={(value) => setRoleDrafts((current) => ({ ...current, [entry.id]: value }))} />
            <Subtle>Povolene roly: {ROLES.join(", ")}</Subtle>
            <Button
              label="Ulozit rolu"
              onPress={() =>
                void updateUserRole(entry.id, (roleDrafts[entry.id] as UserRole) ?? entry.role).then(() => {
                  setUsers((current) => current.map((item) => (item.id === entry.id ? { ...item, role: roleDrafts[entry.id] as UserRole } : item)))
                })
              }
            />
            {entry.id !== user?.id && (
              <Button
                label="Vymazat pouzivatela"
                tone="danger"
                onPress={() => void deleteUser(entry.id).then(() => setUsers((current) => current.filter((item) => item.id !== entry.id)))}
              />
            )}
          </Card>
        ))}
      </Card>
    </Screen>
  )
}
