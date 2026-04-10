import { useLocalSearchParams, router } from "expo-router"
import { useEffect, useState } from "react"
import { Alert } from "react-native"
import { Button, Card, Field, Heading, Screen, Subtle } from "@/components/ui"
import { useHasPrivilege } from "@/lib/privileges"
import { useAuth } from "@/providers/AuthProvider"
import { useSongs } from "@/providers/SongsProvider"

export default function EditSongScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const songId = Number(id)
  const { user } = useAuth()
  const { getSong, updateSong, updateTextVersion, deleteTextVersion, deleteSong } = useSongs()
  const canEditSong = useHasPrivilege(user, "edit_song")
  const canDeleteSong = useHasPrivilege(user, "delete_song")
  const canEditTextVersion = useHasPrivilege(user, "edit_text_version")
  const canDeleteTextVersion = useHasPrivilege(user, "delete_text_version")
  const [loaded, setLoaded] = useState(false)
  const [title, setTitle] = useState("")
  const [obec, setObec] = useState("")
  const [region, setRegion] = useState("")
  const [links, setLinks] = useState("")
  const [textVersionTexts, setTextVersionTexts] = useState<Record<number, string>>({})
  const [textVersionIds, setTextVersionIds] = useState<number[]>([])
  const [isSavingSong, setIsSavingSong] = useState(false)
  const [songSaveStatus, setSongSaveStatus] = useState<{ tone: "neutral" | "success" | "error"; text: string } | null>(null)

  const handleSaveSong = async () => {
    if (!canEditSong || isSavingSong) return

    setIsSavingSong(true)
    setSongSaveStatus({ tone: "neutral", text: "Prebieha ukladanie zmien..." })

    try {
      await updateSong(songId, {
        title: title.trim(),
        obec: obec.trim() || null,
        region: region.trim() || null,
        links: links.split("\n").map((line) => line.trim()).filter(Boolean),
      })

      setSongSaveStatus({ tone: "success", text: "Zmeny boli uspesne ulozene." })
      Alert.alert("Hotovo", "Zmeny boli uspesne ulozene.", [{ text: "OK", onPress: () => router.replace(`/songs/${songId}`) }])
    } catch (error) {
      const message = error instanceof Error ? error.message : "Zmeny sa nepodarilo ulozit."
      setSongSaveStatus({ tone: "error", text: message })
      Alert.alert("Chyba", message)
    } finally {
      setIsSavingSong(false)
    }
  }

  useEffect(() => {
    void getSong(songId).then((song) => {
      if (!song) return
      setTitle(song.title)
      setObec(song.obec ?? "")
      setRegion(song.region ?? "")
      setLinks(song.links.join("\n"))
      setTextVersionIds(song.textVersions.map((item) => item.id))
      setTextVersionTexts(Object.fromEntries(song.textVersions.map((item) => [item.id, item.text])))
      setLoaded(true)
    })
  }, [songId])

  if (!loaded || !(canEditSong || canDeleteSong || canEditTextVersion || canDeleteTextVersion)) {
    return (
      <Screen>
        <Card>
          <Heading>Uprava nie je dostupna</Heading>
          <Subtle>Sprava piesne je dostupna len pre roly s prislusnymi opravneniami.</Subtle>
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
        {canEditSong ? (
          <Button
            label={isSavingSong ? "Ukladam zmeny..." : "Ulozit zmeny"}
            onPress={() => void handleSaveSong()}
            disabled={!title.trim() || isSavingSong}
            loading={isSavingSong}
          />
        ) : null}
        {songSaveStatus ? (
          <Subtle style={{ color: songSaveStatus.tone === "error" ? "#b42318" : songSaveStatus.tone === "success" ? "#0f7a3f" : "#5d7a92" }}>
            {songSaveStatus.text}
          </Subtle>
        ) : null}
        {canDeleteSong ? <Button label="Vymazat piesen" tone="danger" onPress={() => void deleteSong(songId).then(() => router.replace("/songs"))} /> : null}
      </Card>

      <Card>
        <Heading size="h2">Textove verzie</Heading>
        {textVersionIds.map((versionId) => (
          <Card key={versionId} style={{ backgroundColor: "#fff" }}>
            <Subtle>Verzia #{versionId}</Subtle>
            <Field
              value={textVersionTexts[versionId] ?? ""}
              onChangeText={(value) => setTextVersionTexts((current) => ({ ...current, [versionId]: value }))}
              multiline
            />
            {canEditTextVersion ? <Button label="Ulozit verziu" onPress={() => void updateTextVersion(songId, versionId, textVersionTexts[versionId] ?? "")} /> : null}
            {canDeleteTextVersion ? (
              <Button
                label="Vymazat verziu"
                tone="danger"
                onPress={() =>
                  void deleteTextVersion(songId, versionId).then(() => {
                    setTextVersionIds((current) => current.filter((item) => item !== versionId))
                  })
                }
              />
            ) : null}
          </Card>
        ))}
      </Card>
    </Screen>
  )
}
