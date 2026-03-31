import { useEffect, useState } from "react"
import { router } from "expo-router"
import { Button, Card, Field, Heading, Screen, Subtle } from "@/components/ui"
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

  const loadAlbums = async () => {
    if (!user) return
    const loaded = await getUserAlbums(user.id)
    setAlbums(loaded)
    if (selectedAlbum) {
      const refreshed = loaded.find((item) => item.id === selectedAlbum.id) ?? null
      setSelectedAlbum(refreshed)
      setAlbumSongs(refreshed?.songIds.length ? await getSongsByIds(refreshed.songIds) : [])
    }
  }

  useEffect(() => {
    if (mode === "online" && user && canManageAlbums) void loadAlbums()
  }, [mode, user?.id, canManageAlbums])

  if (mode !== "online" || !user || !canManageAlbums) {
    return (
      <Screen>
        <Card>
          <Heading>Albumy nie su dostupne</Heading>
          <Subtle>Sprava albumov funguje len online a len s opravnenim `manage_albums`.</Subtle>
        </Card>
      </Screen>
    )
  }

  return (
    <Screen>
      <Card>
        <Heading>Moje albumy</Heading>
        <Field value={title} onChangeText={setTitle} placeholder="Nazov albumu" />
        <Field value={description} onChangeText={setDescription} placeholder="Popis" multiline />
        <Button
          label="Vytvorit album"
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

      {albums.map((album) => (
        <Card key={album.id}>
          <Heading>{album.title}</Heading>
          <Subtle>{album.description ?? "Bez popisu"}</Subtle>
          <Subtle>{album.songsCount} piesni</Subtle>
          <Button
            label="Otvorit album"
            tone="secondary"
            onPress={async () => {
              setSelectedAlbum(album)
              setAlbumSongs(album.songIds.length ? await getSongsByIds(album.songIds) : [])
            }}
          />
          <Button label="Vymazat album" tone="danger" onPress={() => void deleteAlbum(album.id, user.id).then(loadAlbums)} />
        </Card>
      ))}

      {selectedAlbum && (
        <Card>
          <Heading>{selectedAlbum.title}</Heading>
          <Field value={songIdToAdd} onChangeText={setSongIdToAdd} placeholder="ID piesne na pridanie" />
          <Button
            label="Pridat piesen do albumu"
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
            <Card key={song.id}>
              <Subtle>{song.title}</Subtle>
              <Button label="Otvorit piesen" tone="secondary" onPress={() => router.push(`/songs/${song.id}`)} />
              <Button
                label="Odobrat z albumu"
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
            </Card>
          ))}
        </Card>
      )}
    </Screen>
  )
}
