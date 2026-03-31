import { useEffect, useState } from "react"
import { router } from "expo-router"
import { Text, View } from "react-native"
import { Button, Card, EmptyState, Field, Heading, Loading, Screen, Subtle } from "@/components/ui"
import { useAppMode } from "@/providers/AppModeProvider"
import { useAuth } from "@/providers/AuthProvider"
import { useHasPrivilege } from "@/lib/privileges"
import { addSongToAlbum, createAlbum, deleteAlbum, getAlbumById, getSongsByIds, getUserAlbums, removeSongFromAlbum } from "@/services/firestore"
import type { Album, Song } from "@/types"

export default function AlbumsScreen() {
  const { mode } = useAppMode()
  const { user, refreshUser } = useAuth()
  const canManageAlbums = useHasPrivilege(user, "manage_albums")
  const [albums, setAlbums] = useState<Album[]>([])
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null)
  const [albumSongs, setAlbumSongs] = useState<Song[]>([])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [songIdToAdd, setSongIdToAdd] = useState("")
  const [loading, setLoading] = useState(false)

  const loadAlbums = async () => {
    if (!user) return
    setLoading(true)
    try {
      const loaded = await getUserAlbums(user.id)
      setAlbums(loaded)
      if (selectedAlbum) {
        const refreshed = loaded.find((item) => item.id === selectedAlbum.id) ?? null
        setSelectedAlbum(refreshed)
        setAlbumSongs(refreshed?.songIds.length ? await getSongsByIds(refreshed.songIds) : [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (mode === "online" && user && canManageAlbums) void loadAlbums()
  }, [mode, user?.id, canManageAlbums])

  if (mode !== "online" || !user || !canManageAlbums) {
    return (
      <Screen>
        <Card>
          <Heading>Albumy</Heading>
          <EmptyState
            title="Albumy nie sú dostupné"
            subtitle={!user ? "Prihlás sa pre správu albumov." : mode !== "online" ? "Prepni sa do online režimu." : "Nemáš oprávnenie na správu albumov."}
          />
          {!user && (
            <Button label="Prihlásiť sa" onPress={() => router.push("/login")} />
          )}
        </Card>
      </Screen>
    )
  }

  return (
    <Screen onRefresh={loadAlbums} refreshing={loading}>
      {/* Create album */}
      <Card>
        <Heading size="h2">Nový album</Heading>
        <Field value={title} onChangeText={setTitle} placeholder="Názov albumu" label="Názov" />
        <Field value={description} onChangeText={setDescription} placeholder="Popis albumu" multiline label="Popis" />
        <Button
          label="Vytvoriť album"
          disabled={!title.trim()}
          onPress={() =>
            void createAlbum(user.id, { title: title.trim(), description: description.trim() || null }).then(async () => {
              setTitle("")
              setDescription("")
              await refreshUser()
              await loadAlbums()
            })
          }
        />
      </Card>

      {/* Albums list */}
      {albums.length === 0 ? (
        <Card>
          <EmptyState title="Žiadne albumy" subtitle="Vytvor svoj prvý album vyššie." />
        </Card>
      ) : (
        albums.map((album) => (
          <Card key={album.id}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <Heading size="h3">{album.title}</Heading>
                <Subtle>{album.description ?? "Bez popisu"}</Subtle>
                <Text style={{ fontSize: 12, color: "#a08878", marginTop: 4 }}>{album.songsCount} piesní</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Button
                label="Otvoriť"
                tone="secondary"
                onPress={async () => {
                  setSelectedAlbum(album)
                  setAlbumSongs(album.songIds.length ? await getSongsByIds(album.songIds) : [])
                }}
              />
              <Button
                label="Vymazať"
                tone="danger"
                onPress={() => void deleteAlbum(album.id, user.id).then(loadAlbums)}
              />
            </View>
          </Card>
        ))
      )}

      {/* Selected album detail */}
      {selectedAlbum && (
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Heading size="h2">{selectedAlbum.title}</Heading>
            <Text onPress={() => setSelectedAlbum(null)} style={{ color: "#b45309", fontWeight: "600" }}>×</Text>
          </View>
          <Field value={songIdToAdd} onChangeText={setSongIdToAdd} placeholder="ID piesne" label="Pridať pieseň (ID)" />
          <Button
            label="Pridať pieseň do albumu"
            disabled={!songIdToAdd.trim()}
            onPress={() =>
              void addSongToAlbum(selectedAlbum.id, Number(songIdToAdd)).then(async () => {
                const refreshed = await getAlbumById(selectedAlbum.id)
                if (!refreshed) return
                setSelectedAlbum(refreshed)
                setAlbumSongs(await getSongsByIds(refreshed.songIds))
                setSongIdToAdd("")
              })
            }
          />
          {albumSongs.map((song) => (
            <Card key={song.id} style={{ backgroundColor: "#fff8f0" }}>
              <Text style={{ fontSize: 15, fontWeight: "600", color: "#23160d" }}>{song.title}</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Button label="Otvoriť" tone="secondary" onPress={() => router.push(`/songs/${song.id}`)} />
                <Button
                  label="Odstrániť"
                  tone="danger"
                  onPress={() =>
                    void removeSongFromAlbum(selectedAlbum.id, song.id).then(async () => {
                      const refreshed = await getAlbumById(selectedAlbum.id)
                      if (!refreshed) return
                      setSelectedAlbum(refreshed)
                      setAlbumSongs(await getSongsByIds(refreshed.songIds))
                    })
                  }
                />
              </View>
            </Card>
          ))}
        </Card>
      )}
    </Screen>
  )
}
