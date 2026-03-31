import { Timestamp } from "firebase/firestore"
import { useState } from "react"
import { router } from "expo-router"
import { Button, Card, Field, Heading, Screen, Subtle } from "@/components/ui"
import { useAppMode } from "@/providers/AppModeProvider"
import { useAuth } from "@/providers/AuthProvider"
import { useHasPrivilege } from "@/lib/privileges"
import { createSong } from "@/services/firestore"

export default function AddSongScreen() {
  const { mode } = useAppMode()
  const { user } = useAuth()
  const canAddSong = useHasPrivilege(user, "add_song")
  const [title, setTitle] = useState("")
  const [obec, setObec] = useState("")
  const [region, setRegion] = useState("")
  const [links, setLinks] = useState("")
  const [textVersion, setTextVersion] = useState("")

  if (mode !== "online" || !user || !canAddSong) {
    return (
      <Screen>
        <Card>
          <Heading>Pridanie piesne nie je dostupne</Heading>
          <Subtle>Vyplna len online rezim s opravnenim `add_song`.</Subtle>
        </Card>
      </Screen>
    )
  }

  return (
    <Screen>
      <Card>
        <Heading>Pridat piesen</Heading>
        <Field value={title} onChangeText={setTitle} placeholder="Nazov piesne" />
        <Field value={obec} onChangeText={setObec} placeholder="Obec" />
        <Field value={region} onChangeText={setRegion} placeholder="Region" />
        <Field value={links} onChangeText={setLinks} placeholder="Jeden URL na riadok" multiline />
        <Field value={textVersion} onChangeText={setTextVersion} placeholder="Prva textova verzia" multiline />
        <Button
          label="Ulozit"
          onPress={() =>
            void createSong({
              title: title.trim(),
              obec: obec.trim() || null,
              region: region.trim() || null,
              links: links.split("\n").map((line) => line.trim()).filter(Boolean),
              textVersions: textVersion.trim() ? [{ id: 1, creationTime: Timestamp.now(), likes: 0, text: textVersion.trim() }] : [],
              userAddedId: user.id,
            }).then((songId) => router.replace(`/songs/${songId}`))
          }
        />
      </Card>
    </Screen>
  )
}
