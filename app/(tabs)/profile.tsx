import { Link, router } from "expo-router"
import { Text, View } from "react-native"
import { Button, Card, EmptyState, Heading, KeyValue, Loading, Screen, Subtle } from "@/components/ui"
import { hasPrivilege, PRIVILEGES } from "@/lib/privileges"
import { useAuth } from "@/providers/AuthProvider"

export default function ProfileScreen() {
  const { user, loading, logout } = useAuth()

  if (loading) {
    return (
      <Screen>
        <Card>
          <Loading label="Načítavam profil…" />
        </Card>
      </Screen>
    )
  }

  if (!user) {
    return (
      <Screen>
        <Card>
          <Heading>Vitajte!</Heading>
          <Subtle>Prihlás sa pre prístup k plnej funkcionalite — správa albumov, obľúbené piesne, pridávanie a úprava obsahu.</Subtle>
          <Link href="/login" asChild>
            <Button label="Prihlásiť sa" />
          </Link>
          <Link href="/register" asChild>
            <Button label="Registrovať sa" tone="secondary" />
          </Link>
        </Card>
      </Screen>
    )
  }

  return (
    <Screen>
      {/* User info */}
      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <View style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: "#fde68a",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: "#b45309",
          }}>
            <Text style={{ fontSize: 22, fontWeight: "700", color: "#b45309" }}>
              {user.nick.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Heading>{user.nick}</Heading>
            <Text style={{ fontSize: 13, color: "#6d5b4a" }}>{user.email}</Text>
          </View>
        </View>
        <View style={{ gap: 8 }}>
          <KeyValue label="Rola" value={user.role} />
          <KeyValue label="Pridané piesne" value={String(user.songsAdded.length)} />
          <KeyValue label="Obľúbené piesne" value={String(user.favoriteSongIds.length)} />
          <KeyValue label="Albumy" value={String(user.albumIds.length)} />
        </View>
        <Button
          label="Odhlásiť sa"
          tone="danger"
          onPress={() =>
            void logout().then(() => {
              router.replace("/(tabs)/")
            })
          }
        />
      </Card>

      {/* Admin quick links */}
      {(user.role === "admin" || user.role === "superadmin") && (
        <Card>
          <Heading size="h2">Admin</Heading>
          <Link href="/admin/users" asChild>
            <Button label="Správa používateľov" tone="secondary" />
          </Link>
          <Link href="/admin/role-privileges" asChild>
            <Button label="Oprávnenia rolí" tone="secondary" />
          </Link>
          <Link href="/export" asChild>
            <Button label="Export dát" tone="secondary" />
          </Link>
        </Card>
      )}

      {/* Privileges */}
      <Card>
        <Heading size="h2">Tvoje oprávnenia</Heading>
        <View style={{ gap: 6 }}>
          {PRIVILEGES.map((item) => {
            const has = hasPrivilege(user, item.id)
            return (
              <View key={item.id} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: has ? "#dcfce7" : "#fee2e2",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Text style={{ fontSize: 12, color: has ? "#16a34a" : "#dc2626" }}>
                    {has ? "✓" : "✗"}
                  </Text>
                </View>
                <Text style={{ fontSize: 13, color: has ? "#23160d" : "#a08878", flex: 1 }}>
                  {item.name}
                </Text>
              </View>
            )
          })}
        </View>
      </Card>
    </Screen>
  )
}
