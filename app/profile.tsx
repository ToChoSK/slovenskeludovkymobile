import { Link, router } from "expo-router"
import { Button, Card, Heading, KeyValue, Screen, Subtle } from "@/components/ui"
import { hasPrivilege, PRIVILEGES } from "@/lib/privileges"
import { useAuth } from "@/providers/AuthProvider"

export default function ProfileScreen() {
  const { user, loading, logout } = useAuth()

  if (loading) {
    return (
      <Screen>
        <Card>
          <Heading>Nacitavam profil</Heading>
        </Card>
      </Screen>
    )
  }

  if (!user) {
    return (
      <Screen>
        <Card>
          <Heading>Nie si prihlaseny</Heading>
          <Link href="/login" asChild>
            <Button label="Prihlasit sa" />
          </Link>
          <Link href="/register" asChild>
            <Button label="Registrovat sa" tone="secondary" />
          </Link>
        </Card>
      </Screen>
    )
  }

  return (
    <Screen>
      <Card>
        <Heading>{user.nick}</Heading>
        <KeyValue label="Email" value={user.email} />
        <KeyValue label="Rola" value={user.role} />
        <KeyValue label="Pridane piesne" value={String(user.songsAdded.length)} />
        <KeyValue label="Oblubene piesne" value={String(user.favoriteSongIds.length)} />
        <KeyValue label="Albumy" value={String(user.albumIds.length)} />
        <Button
          label="Odhlasit sa"
          onPress={() =>
            void logout().then(() => {
              router.replace("/")
            })
          }
        />
      </Card>

      <Card>
        <Heading>Tvoje opravnenia</Heading>
        {PRIVILEGES.map((item) => (
          <Subtle key={item.id}>{hasPrivilege(user, item.id) ? "Ano" : "Nie"} · {item.name}</Subtle>
        ))}
      </Card>
    </Screen>
  )
}
