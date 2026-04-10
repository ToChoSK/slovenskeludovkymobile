import { useState } from "react"
import { router } from "expo-router"
import { Alert } from "react-native"
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
  const [isSaving, setIsSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ tone: "neutral" | "success" | "error"; text: string } | null>(null)

  const handleSave = async () => {
    if (isSaving || !user) return

    setIsSaving(true)
    setStatusMessage({ tone: "neutral", text: "Prebieha vytvaranie piesne..." })

    try {
      const songId = await createSong({
        title: title.trim(),
        obec: obec.trim() || null,
        region: region.trim() || null,
        links: links.split("\n").map((line) => line.trim()).filter(Boolean),
        text: textVersion.trim(),
        userAddedId: user.id,
      })

      await refreshUser()
      setStatusMessage({ tone: "success", text: "Piesen bola uspesne pridana." })
      Alert.alert("Hotovo", "Piesen bola uspesne pridana.", [{ text: "OK", onPress: () => router.replace(`/songs/${songId}`) }])
    } catch (error) {
      const message = error instanceof Error ? error.message : "Piesen sa nepodarilo pridat."
      setStatusMessage({ tone: "error", text: message })
      Alert.alert("Chyba", message)
    } finally {
      setIsSaving(false)
    }
  }

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
        <Button label={isSaving ? "Ukladam..." : "Ulozit"} onPress={() => void handleSave()} disabled={!title.trim() || isSaving} loading={isSaving} />
        {statusMessage ? (
          <Subtle style={{ color: statusMessage.tone === "error" ? "#b42318" : statusMessage.tone === "success" ? "#0f7a3f" : "#5d7a92" }}>
            {statusMessage.text}
          </Subtle>
        ) : null}
      </Card>
    </Screen>
  )
}
