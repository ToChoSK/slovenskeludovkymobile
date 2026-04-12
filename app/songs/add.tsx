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
    setStatusMessage({ tone: "neutral", text: "Prebieha vytváranie piesne..." })

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
      setStatusMessage({ tone: "success", text: "Pieseň bola úspešne pridaná." })
      Alert.alert("Hotovo", "Pieseň bola úspešne pridaná.", [{ text: "OK", onPress: () => router.replace(`/songs/${songId}`) }])
    } catch (error) {
      const message = error instanceof Error ? error.message : "Pieseň sa nepodarilo pridať."
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
          <Heading>Pridanie piesne nie je dostupné</Heading>
          <Subtle>Táto obrazovka je dostupná len pre prihlásené roly s oprávnením `add_song`.</Subtle>
        </Card>
      </Screen>
    )
  }

  return (
    <Screen>
      <Card>
        <Heading>Pridať pieseň</Heading>
        <Field value={title} onChangeText={setTitle} placeholder="Názov piesne" />
        <Field value={obec} onChangeText={setObec} placeholder="Obec" />
        <Field value={region} onChangeText={setRegion} placeholder="Región" />
        <Field value={links} onChangeText={setLinks} placeholder="Jeden URL na riadok" multiline />
        <Field value={textVersion} onChangeText={setTextVersion} placeholder="Prvá textová verzia" multiline />
        <Button label={isSaving ? "Ukladám..." : "Uložiť"} onPress={() => void handleSave()} disabled={!title.trim() || isSaving} loading={isSaving} />
        {statusMessage ? (
          <Subtle style={{ color: statusMessage.tone === "error" ? "#b42318" : statusMessage.tone === "success" ? "#0f7a3f" : "#5d7a92" }}>
            {statusMessage.text}
          </Subtle>
        ) : null}
      </Card>
    </Screen>
  )
}
