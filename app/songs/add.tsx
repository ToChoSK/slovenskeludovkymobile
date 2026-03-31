import { useState } from "react"
import { router } from "expo-router"
import { Button, Card, Field, Heading, Screen, Subtle } from "@/components/ui"
import { useHasPrivilege } from "@/lib/privileges"
import { useAuth } from "@/providers/AuthProvider"
import { useSongs } from "@/providers/SongsProvider"

export default function AddSongScreen() {
  const { user, refreshUser } = useAuth()
  const { createSong } = useSongs()
  const canAddSong = useHasPrivilege(user, "add_song")
  const [title, setTitle] = useState("")
  const [obec, setObec] = useState("")
  const [region, setRegion] = useState("")
  const [links, setLinks] = useState("")
  const [textVersion, setTextVersion] = useState("")

  if (!user || !canAddSong) {
    return (
      <Screen>
        <Card>
          <Heading>Pridanie piesne nie je dostupne</Heading>
          <Subtle>Vyplna len pre prihlasene roly s opravnenim `add_song`.</Subtle>
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
              text: textVersion.trim(),
              userAddedId: user.id,
            }).then(async (songId) => {
              await refreshUser()
              router.replace(`/songs/${songId}`)
            })
          }
        />
      </Card>
    </Screen>
  )
}
