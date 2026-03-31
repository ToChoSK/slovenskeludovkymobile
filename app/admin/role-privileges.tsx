import { useEffect, useState } from "react"
import { Button, Card, Field, Heading, Screen, Subtle } from "@/components/ui"
import { PRIVILEGES, useHasPrivilege } from "@/lib/privileges"
import { useAppMode } from "@/providers/AppModeProvider"
import { useAuth } from "@/providers/AuthProvider"
import { getAllRolePrivileges, updateRolePrivileges } from "@/services/firestore"
import type { PrivilegeId, UserRole } from "@/types"

const ROLES: UserRole[] = ["anonymous", "guest", "subscriber", "admin", "superadmin"]

export default function RolePrivilegesScreen() {
  const { mode } = useAppMode()
  const { user } = useAuth()
  const canManagePrivileges = useHasPrivilege(user, "manage_privileges")
  const [drafts, setDrafts] = useState<Record<string, PrivilegeId[]>>({})
  const [input, setInput] = useState<Record<string, string>>({})

  useEffect(() => {
    if (mode === "online" && canManagePrivileges) {
      void getAllRolePrivileges().then((data) => {
        setDrafts({ ...data })
        setInput(Object.fromEntries(ROLES.map((role) => [role, (data[role] ?? []).join(", ")])))
      })
    }
  }, [mode, canManagePrivileges])

  if (mode !== "online" || !canManagePrivileges) {
    return (
      <Screen>
        <Card>
          <Heading>Sprava opravneni nie je dostupna</Heading>
        </Card>
      </Screen>
    )
  }

  return (
    <Screen>
      <Card>
        <Heading>Role a opravnenia</Heading>
        <Subtle>Dostupne privilegia: {PRIVILEGES.map((item) => item.id).join(", ")}</Subtle>
      </Card>
      {ROLES.map((role) => (
        <Card key={role}>
          <Heading>{role}</Heading>
          <Field value={input[role] ?? ""} onChangeText={(value) => setInput((current) => ({ ...current, [role]: value }))} multiline />
          <Subtle>Oddelene ciarkou.</Subtle>
          {role !== "superadmin" && (
            <Button
              label="Ulozit"
              onPress={() => {
                const privileges = input[role]
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean) as PrivilegeId[]
                setDrafts((current) => ({ ...current, [role]: privileges }))
                void updateRolePrivileges(role as "anonymous" | "guest" | "subscriber" | "admin", privileges)
              }}
            />
          )}
          <Subtle>Aktualne: {(drafts[role] ?? []).join(", ") || "-"}</Subtle>
        </Card>
      ))}
    </Screen>
  )
}
