import { useLocalSearchParams, router } from "expo-router"
import { useEffect, useState } from "react"
import { Button, Card, Field, Heading, Screen, Subtle } from "@/components/ui"
import { useAppMode } from "@/providers/AppModeProvider"
import { useAuth } from "@/providers/AuthProvider"
import { useSongs } from "@/providers/SongsProvider"
import { useHasPrivilege } from "@/lib/privileges"
import { deleteSong, deleteTextVersion, updateSong, updateTextVersion } from "@/services/firestore"
import type { Song } from "@/types"

export default function EditSongScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const songId = Number(id)
  const { mode } = useAppMode()
  const { user } = useAuth()
  const { getSong } = useSongs()
  const canEditSong = useHasPrivilege(user, "edit_song")
  const canDeleteSong = useHasPrivilege(user, "delete_song")
  const canEditTextVersion = useHasPrivilege(user, "edit_text_version")
  const canDeleteTextVersion = useHasPrivilege(user, "delete_text_version")
  const [song, setSong] = useState<Song | null>(null)
  const [title, setTitle] = useState("")
  const [obec, setObec] = useState("")
  const [region, setRegion] = useState("")
  const [links, setLinks] = useState("")
  const [textVersionTexts, setTextVersionTexts] = useState<Record<number, string>>({})

  useEffect(() => {
    void getSong(songId).then((loaded) => {
      setSong(loaded)
      if (!loaded) return
      setTitle(loaded.title)
      setObec(loaded.obec ?? "")
      setRegion(loaded.region ?? "")
      setLinks(loaded.links.join("\n"))
      setTextVersionTexts(Object.fromEntries(loaded.textVersions.map((item) => [item.id, item.text])))
    })
  }, [songId])

  if (mode !== "online" || !song || !(canEditSong || canDeleteSong || canEditTextVersion || canDeleteTextVersion)) {
    return (
      <Screen>
        <Card>
          <Heading>Uprava nie je dostupna</Heading>
          <Subtle>Sprava piesne funguje len online a len pre roly s prislusnymi opravneniami.</Subtle>
        </Card>
      </Screen>
    )
  }

  return (
    <Screen>
      <Card>
        <Heading>Sprava piesne</Heading>
        <Field value={title} onChangeText={setTitle} placeholder="Nazov" />
        <Field value={obec} onChangeText={setObec} placeholder="Obec" />
        <Field value={region} onChangeText={setRegion} placeholder="Region" />
        <Field value={links} onChangeText={setLinks} placeholder="Jeden URL na riadok" multiline />
        {canEditSong && (
          <Button
            label="Ulozit zmeny piesne"
            onPress={() =>
              void updateSong(song.id, {
                title: title.trim(),
                obec: obec.trim() || null,
                region: region.trim() || null,
                links: links.split("\n").map((line) => line.trim()).filter(Boolean),
              }).then(() => router.replace(`/songs/${song.id}`))
            }
          />
        )}
        {canDeleteSong && <Button label="Vymazat piesen" tone="danger" onPress={() => void deleteSong(song.id).then(() => router.replace("/songs"))} />}
      </Card>

      <Card>
        <Heading>Textove verzie</Heading>
        {song.textVersions.map((version) => (
          <Card key={version.id}>
            <Subtle>Verzia #{version.id}</Subtle>
            <Field
              value={textVersionTexts[version.id] ?? ""}
              onChangeText={(value) => setTextVersionTexts((current) => ({ ...current, [version.id]: value }))}
              multiline
            />
            {canEditTextVersion && (
              <Button label="Ulozit verziu" onPress={() => void updateTextVersion(song.id, version.id, textVersionTexts[version.id] ?? "")} />
            )}
            {canDeleteTextVersion && <Button label="Vymazat verziu" tone="danger" onPress={() => void deleteTextVersion(song.id, version.id)} />}
          </Card>
        ))}
      </Card>
    </Screen>
  )
}
