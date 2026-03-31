import { useLocalSearchParams, router } from "expo-router"
import { useEffect, useState } from "react"
import { Linking, Text, View } from "react-native"
import { Button, Card, Field, Heading, Screen, Subtle } from "@/components/ui"
import { useAppMode } from "@/providers/AppModeProvider"
import { useAuth } from "@/providers/AuthProvider"
import { useSongs } from "@/providers/SongsProvider"
import { useHasPrivilege } from "@/lib/privileges"
import {
  addNextSong,
  addTextVersion,
  deleteSong,
  deleteTextVersion,
  incrementSongViewCount,
  likeTextVersion,
  removeNextSong,
  toggleFavoriteSong,
  toggleNextSongLikeWithCount,
} from "@/services/firestore"
import type { Song } from "@/types"

export default function SongDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const songId = Number(id)
  const { mode } = useAppMode()
  const { user, refreshUser } = useAuth()
  const { getSong, getSongs } = useSongs()
  const canManageFavorites = useHasPrivilege(user, "manage_favorites")
  const canAddTextVersion = useHasPrivilege(user, "add_text_version")
  const canDeleteTextVersion = useHasPrivilege(user, "delete_text_version")
  const canLikeTextVersion = useHasPrivilege(user, "like_text_version")
  const canEditSong = useHasPrivilege(user, "edit_song")
  const canDeleteSong = useHasPrivilege(user, "delete_song")
  const canSelectNextSong = useHasPrivilege(user, "select_next_song")
  const [song, setSong] = useState<Song | null>(null)
  const [nextSongs, setNextSongs] = useState<Song[]>([])
  const [newTextVersion, setNewTextVersion] = useState("")
  const [nextSongId, setNextSongId] = useState("")

  const load = async () => {
    const loaded = await getSong(songId)
    setSong(loaded)
    setNextSongs(loaded?.nextSongs.length ? await getSongs(loaded.nextSongs.map((item) => item.id)) : [])
  }

  useEffect(() => {
    void load()
    if (mode === "online") void incrementSongViewCount(songId)
  }, [songId, mode])

  if (!song) {
    return (
      <Screen>
        <Card>
          <Heading>Piesen sa nenasla</Heading>
        </Card>
      </Screen>
    )
  }

  const isFavorite = !!user && user.favoriteSongIds.includes(song.id)

  return (
    <Screen>
      <Card>
        <Heading>{song.title}</Heading>
        <Subtle>{[song.region, song.obec].filter(Boolean).join(" · ") || "Bez regionu"}</Subtle>
        <Subtle>Oblubene: {song.favoriteCount} · Zobrazenia: {song.viewCount}</Subtle>
        {mode === "online" && canManageFavorites && user && (
          <Button
            label={isFavorite ? "Odobrat z oblubenych" : "Pridat do oblubenych"}
            onPress={() =>
              void toggleFavoriteSong(user.id, song.id).then(async () => {
                await refreshUser()
                await load()
              })
            }
          />
        )}
        {canEditSong && mode === "online" && <Button label="Upravit piesen" tone="secondary" onPress={() => router.push(`/songs/${song.id}/edit`)} />}
        {canDeleteSong && mode === "online" && (
          <Button
            label="Vymazat piesen"
            tone="danger"
            onPress={() =>
              void deleteSong(song.id).then(() => {
                router.replace("/songs")
              })
            }
          />
        )}
      </Card>

      <Card>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#23160d" }}>Textove verzie</Text>
        {song.textVersions.map((version) => {
          const liked = user?.songsTextVersionLikes.some((item) => item.songId === song.id && item.textVersionId === version.id)
          return (
            <View key={version.id} style={{ gap: 8, borderWidth: 1, borderColor: "#eadfcb", borderRadius: 16, padding: 12, backgroundColor: "#fff" }}>
              <Text style={{ fontWeight: "700", color: "#23160d" }}>Verzia #{version.id}</Text>
              <Text style={{ color: "#6d5b4a" }}>{version.text}</Text>
              <Text style={{ color: "#6d5b4a" }}>Lajky: {version.likes}</Text>
              {mode === "online" && canLikeTextVersion && user && (
                <Button
                  label={liked ? "Zrusit lajknutie" : "Lajknut textovu verziu"}
                  tone="secondary"
                  onPress={() =>
                    void likeTextVersion(user.id, song.id, version.id).then(async () => {
                      await refreshUser()
                      await load()
                    })
                  }
                />
              )}
              {mode === "online" && canDeleteTextVersion && (
                <Button label="Vymazat verziu" tone="danger" onPress={() => void deleteTextVersion(song.id, version.id).then(load)} />
              )}
            </View>
          )
        })}
        {mode === "online" && canAddTextVersion && (
          <View style={{ gap: 8 }}>
            <Field value={newTextVersion} onChangeText={setNewTextVersion} placeholder="Nova textova verzia" multiline />
            <Button
              label="Pridat textovu verziu"
              onPress={() =>
                void addTextVersion(song.id, newTextVersion).then(async () => {
                  setNewTextVersion("")
                  await load()
                })
              }
            />
          </View>
        )}
      </Card>

      <Card>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#23160d" }}>Nasledujuce piesne</Text>
        {nextSongs.map((nextSong) => {
          const liked = user?.songsNextSongLikes.some((item) => item.songId === song.id && item.nextSongId === nextSong.id)
          return (
            <View key={nextSong.id} style={{ gap: 8, borderWidth: 1, borderColor: "#eadfcb", borderRadius: 16, padding: 12, backgroundColor: "#fff" }}>
              <Text style={{ fontWeight: "700", color: "#23160d" }}>{nextSong.title}</Text>
              <Button label="Otvorit" tone="secondary" onPress={() => router.push(`/songs/${nextSong.id}`)} />
              {mode === "online" && canSelectNextSong && user && (
                <Button
                  label={liked ? "Odobrat podporu" : "Podporit prechod"}
                  onPress={() =>
                    void toggleNextSongLikeWithCount(song.id, nextSong.id, user.id).then(async () => {
                      await refreshUser()
                      await load()
                    })
                  }
                />
              )}
              {mode === "online" && canSelectNextSong && (
                <Button label="Odstranit next song" tone="danger" onPress={() => void removeNextSong(song.id, nextSong.id).then(load)} />
              )}
            </View>
          )
        })}
        {mode === "online" && canSelectNextSong && (
          <View style={{ gap: 8 }}>
            <Field value={nextSongId} onChangeText={setNextSongId} placeholder="ID dalsej piesne" />
            <Button
              label="Pridat next song"
              onPress={() =>
                void addNextSong(song.id, Number(nextSongId)).then(async () => {
                  setNextSongId("")
                  await load()
                })
              }
            />
          </View>
        )}
      </Card>

      <Card>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#23160d" }}>Odkazy</Text>
        {song.links.map((link) => (
          <Button key={link} label={link} tone="secondary" onPress={() => void Linking.openURL(link)} />
        ))}
      </Card>
    </Screen>
  )
}
