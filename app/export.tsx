import * as FileSystem from "expo-file-system/legacy"
import * as Sharing from "expo-sharing"
import { Button, Card, Heading, KeyValue, Screen, Subtle } from "@/components/ui"
import { useAppMode } from "@/providers/AppModeProvider"
import { exportAllSongsIndex } from "@/services/firestore"

export default function ExportScreen() {
  const { mode, dataset } = useAppMode()

  const shareContent = async (name: string, content: string) => {
    const path = `${FileSystem.cacheDirectory}${name}`
    await FileSystem.writeAsStringAsync(path, content)
    await Sharing.shareAsync(path)
  }

  return (
    <Screen>
      <Card>
        <Heading>Export</Heading>
        <Subtle>Online rezim exportuje `metadata/allSongs`, offline rezim lokalny cache `allSongs.json`.</Subtle>
        <KeyValue label="Rezim" value={mode} />
        {mode === "online" ? (
          <Button
            label="Exportovat metadata"
            onPress={() =>
              void exportAllSongsIndex().then((result) => {
                void shareContent(`slovenske-ludovky-export-${result.version}.json`, result.json)
              })
            }
          />
        ) : (
          <Button
            label="Exportovat offline dataset"
            onPress={() => {
              if (!dataset) return
              void shareContent(`slovenske-ludovky-offline-${dataset.meta.downloadedAt}.json`, JSON.stringify(dataset.songs, null, 2))
            }}
          />
        )}
      </Card>
    </Screen>
  )
}
