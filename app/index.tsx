import { Link } from "expo-router"
import { Text, View } from "react-native"
import { Button, Card, Heading, InlineSwitch, KeyValue, Screen, Subtle } from "@/components/ui"
import { useAppMode } from "@/providers/AppModeProvider"
import { useAuth } from "@/providers/AuthProvider"
import { useSongs } from "@/providers/SongsProvider"

export default function HomeScreen() {
  const { mode, setMode, dataset, syncing, syncFromCdn, isOnlineReachable } = useAppMode()
  const { user } = useAuth()
  const { metadata } = useSongs()

  return (
    <Screen>
      <Card>
        <Heading>Slovenske ludovky mobile</Heading>
        <Subtle>
          Expo + React Native verzia `slovenskeludovky` s rovnakym Firebase modelom pre online rezim a s plnym offline datasetom z `allSongs.json`.
        </Subtle>
      </Card>

      <Card>
        <InlineSwitch label="Offline rezim" value={mode === "offline"} onValueChange={(value) => void setMode(value ? "offline" : "online")} />
        <KeyValue label="Aktivny rezim" value={mode} />
        <KeyValue label="Internet" value={isOnlineReachable ? "dostupny" : "nedostupny"} />
        <KeyValue label="Pouzivatel" value={user ? `${user.nick} (${user.role})` : "neprihlaseny"} />
        <KeyValue label="Pocet piesni" value={String(metadata?.count ?? dataset?.metadata.count ?? 0)} />
        <KeyValue label="Offline dataset" value={dataset?.meta.source ?? "neznamy"} />
        <KeyValue label="Stiahnute" value={dataset?.meta.downloadedAt ?? "-"} />
        <Button label={syncing ? "Synchronizujem CDN..." : "Aktualizovat offline allSongs.json"} onPress={() => void syncFromCdn()} disabled={syncing} />
      </Card>

      <Card>
        <Heading>Rychle odkazy</Heading>
        <View style={{ gap: 10 }}>
          <Link href="/songs" asChild>
            <Button label="Piesne" />
          </Link>
          <Link href="/songs/add" asChild>
            <Button label="Pridat piesen" tone="secondary" />
          </Link>
          <Link href="/albums" asChild>
            <Button label="Albumy" tone="secondary" />
          </Link>
          <Link href="/profile" asChild>
            <Button label="Profil" tone="secondary" />
          </Link>
          <Link href="/admin/users" asChild>
            <Button label="Admin: pouzivatelia" tone="secondary" />
          </Link>
          <Link href="/admin/role-privileges" asChild>
            <Button label="Admin: opravnenia" tone="secondary" />
          </Link>
          <Link href="/export" asChild>
            <Button label="Export" tone="secondary" />
          </Link>
        </View>
      </Card>

      <Card>
        <Text style={{ fontSize: 16, fontWeight: "700", color: "#23160d" }}>Poznamka k offline rezimu</Text>
        <Subtle>
          V offline rezime sa piesne citaju len z lokalneho `allSongs.json`. Vyhladavanie ide cez nazov, obec, region aj texty v `textVersions`. Firestore zapisove akcie ostavaju dostupne len v online rezime.
        </Subtle>
      </Card>
    </Screen>
  )
}
