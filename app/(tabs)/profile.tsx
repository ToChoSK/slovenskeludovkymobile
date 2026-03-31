import { router } from "expo-router"
import { useEffect, useState } from "react"
import { Text, TouchableOpacity, View } from "react-native"
import { Badge, Button, Card, EmptyState, Heading, HeroCard, KeyValue, Loading, Screen, SongCard, Subtle } from "@/components/ui"
import { useHasPrivilege } from "@/lib/privileges"
import { useAuth } from "@/providers/AuthProvider"
import { useSongs } from "@/providers/SongsProvider"
import type { User } from "@/types"

export default function ProfileScreen() {
  const { user, loading, logout } = useAuth()
  const { getSongs } = useSongs()

  if (loading) {
    return (
      <Screen>
        <Card>
          <Loading label="Nacitavam profil..." />
        </Card>
      </Screen>
    )
  }

  if (!user) {
    return (
      <Screen>
        <HeroCard>
          <Text style={{ fontSize: 28, lineHeight: 32, color: "#fff8ef", fontWeight: "900" }}>Prihlas sa a tvoje oblubene, lajky aj upravy budu okamzite zapisane do cloudu aj lokalneho katalogu.</Text>
        </HeroCard>
        <Card style={{ gap: 12 }}>
          <Button label="Prihlasit sa" onPress={() => router.push("/login")} />
          <Button label="Vytvorit ucet" tone="secondary" onPress={() => router.push("/register")} />
        </Card>
      </Screen>
    )
  }

  return <LoggedProfile user={user} logout={logout} getSongs={getSongs} />
}

function LoggedProfile({
  user,
  logout,
  getSongs,
}: {
  user: User
  logout: () => Promise<void>
  getSongs: (songIds: number[]) => Promise<any[]>
}) {
  const canAddSong = useHasPrivilege(user, "add_song")
  const canAddTextVersion = useHasPrivilege(user, "add_text_version")
  const canEditSong = useHasPrivilege(user, "edit_song")
  const canEditTextVersion = useHasPrivilege(user, "edit_text_version")
  const canDeleteSong = useHasPrivilege(user, "delete_song")
  const canDeleteTextVersion = useHasPrivilege(user, "delete_text_version")
  const canManageFavorites = useHasPrivilege(user, "manage_favorites")
  const canLikeTextVersion = useHasPrivilege(user, "like_text_version")
  const canSelectNextSong = useHasPrivilege(user, "select_next_song")
  const [favorites, setFavorites] = useState<Awaited<ReturnType<typeof getSongs>>>([])

  useEffect(() => {
    let alive = true
    void getSongs(user.favoriteSongIds).then((rows) => {
      if (alive) setFavorites(rows)
    })
    return () => {
      alive = false
    }
  }, [getSongs, user.favoriteSongIds.join("|")])

  const capabilityLabels = [
    canManageFavorites ? "oblubene" : null,
    canLikeTextVersion ? "lajkovanie textov" : null,
    canSelectNextSong ? "next songs" : null,
    canAddSong ? "pridanie piesni" : null,
    canAddTextVersion ? "pridanie verzii" : null,
    canEditSong ? "uprava piesni" : null,
    canEditTextVersion ? "uprava verzii" : null,
    canDeleteSong ? "mazanie piesni" : null,
    canDeleteTextVersion ? "mazanie verzii" : null,
  ].filter((item): item is string => !!item)

  return (
    <Screen>
        <HeroCard>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <View style={{ flex: 1, gap: 6 }}>
            <Text style={{ fontSize: 12, fontWeight: "800", letterSpacing: 1.1, color: "#8fe0ff", textTransform: "uppercase" }}>Profil</Text>
            <Text style={{ fontSize: 28, lineHeight: 32, color: "#f4fbff", fontWeight: "900" }}>{user.nick}</Text>
            <Text style={{ fontSize: 14, lineHeight: 20, color: "rgba(235,248,255,0.82)" }}>{user.email}</Text>
          </View>
          <Badge label={user.role} color="#7cd3ff" />
        </View>
      </HeroCard>

      <Card>
        <Heading size="h2">Prehlad uctu</Heading>
        <KeyValue label="Oblubene piesne" value={String(user.favoriteSongIds.length)} />
        <KeyValue label="Pridane piesne" value={String(user.songsAdded.length)} />
        <KeyValue label="Lajknute texty" value={String(user.songsTextVersionLikes.length)} />
        <KeyValue label="Podporene prechody" value={String(user.songsNextSongLikes.length)} />
        <Button
          label="Odhlasit sa"
          tone="danger"
          onPress={() =>
            void logout().then(() => {
              router.replace("/(tabs)")
            })
          }
        />
      </Card>

      <Card>
        <Heading size="h2">Mobilne opravnenia</Heading>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {capabilityLabels.map((item) => (
            <Badge key={item} label={item} color="#2f8fcd" />
          ))}
        </View>
      </Card>

      <Card>
        <View style={{ gap: 4 }}>
          <Heading size="h2">Oblubene piesne</Heading>
          <Subtle>Tieto data sa mozu citat aj z Firebase profilu, lebo inak by favorite flow nedaval zmysel.</Subtle>
        </View>
        {favorites.length === 0 ? (
          <EmptyState title="Zatial nic" subtitle="Oznac si oblubene piesne v detaile piesne." />
        ) : (
          favorites.map((song) => (
            <TouchableOpacity key={song.id} activeOpacity={0.92} onPress={() => router.push(`/songs/${song.id}`)}>
              <SongCard title={song.title} region={song.region} obec={song.obec} favoriteCount={song.favoriteCount} viewCount={song.viewCount} />
            </TouchableOpacity>
          ))
        )}
      </Card>
    </Screen>
  )
}
