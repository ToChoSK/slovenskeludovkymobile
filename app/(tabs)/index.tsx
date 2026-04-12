import { router } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import { useEffect, useMemo, useRef, useState } from "react"
import { Image, Linking, Pressable, ScrollView, Text, View } from "react-native"
import { Badge, Button, Card, EmptyState, Field, Loading, ProgressBar, SongCard } from "@/components/ui"
import { loadMobileAppUpdatePrompt } from "@/lib/app-update"
import { useSongs } from "@/providers/SongsProvider"
import type { MobileAppUpdatePrompt } from "@/types"

export default function SearchScreen() {
  const { songs, loading, error, searchSongs } = useSongs()
  const [query, setQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<number[]>([])
  const [searchedQuery, setSearchedQuery] = useState("")
  const [appUpdatePrompt, setAppUpdatePrompt] = useState<MobileAppUpdatePrompt | null>(null)
  const searchSignalRef = useRef<{ cancelled: boolean } | null>(null)

  const resultSongs = useMemo(
    () =>
      results
        .map((id) => songs.find((song) => song.id === id))
        .filter((song): song is NonNullable<typeof song> => !!song)
        .sort((a, b) => b.viewCount - a.viewCount || a.title.localeCompare(b.title, "sk", { sensitivity: "base" })),
    [results, songs],
  )

  async function runFulltextSearch(nextQuery?: string) {
    const trimmed = (nextQuery ?? query).trim()

    if (!trimmed) {
      setResults([])
      setSearchedQuery("")
      setProgress(0)
      return
    }

    if (searchSignalRef.current) searchSignalRef.current.cancelled = true
    const nextSignal = { cancelled: false }
    searchSignalRef.current = nextSignal

    setSearching(true)
    setProgress(0)
    setSearchedQuery(trimmed)

    try {
      const matches = await searchSongs(trimmed, (next) => {
        if (!nextSignal.cancelled) setProgress(next.ratio)
      })
      if (!nextSignal.cancelled) setResults(matches.map((song) => song.id))
    } finally {
      if (!nextSignal.cancelled) setSearching(false)
    }
  }

  useEffect(() => {
    let alive = true
    void loadMobileAppUpdatePrompt()
      .then((prompt) => {
        if (alive) setAppUpdatePrompt(prompt)
      })
      .catch(() => {
        if (alive) setAppUpdatePrompt(null)
      })

    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      if (searchSignalRef.current) searchSignalRef.current.cancelled = true
      setSearching(false)
      setResults([])
      setSearchedQuery("")
      setProgress(0)
      return
    }

    const timeoutId = setTimeout(() => {
      void runFulltextSearch(trimmed)
    }, 380)

    return () => clearTimeout(timeoutId)
  }, [query])

  if (loading) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: "#eef7fd" }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 120 }}>
        <Card>
          <Loading label="Načítavam lokálny katalóg..." />
        </Card>
      </ScrollView>
    )
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#eef7fd" }} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 120 }}>
      {appUpdatePrompt ? (
        <Card>
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <Text style={{ flex: 1, fontSize: 18, fontWeight: "900", color: "#13324a" }}>{appUpdatePrompt.title}</Text>
              <Badge label={`v${appUpdatePrompt.latestVersion}`} color="#c56a10" />
            </View>
            {appUpdatePrompt.message ? <Text style={{ color: "#5d7a92", fontSize: 14, lineHeight: 20 }}>{appUpdatePrompt.message}</Text> : null}
            <Button label="Aktualizovať v Google Play" onPress={() => void Linking.openURL(appUpdatePrompt.storeUrl)} />
          </View>
        </Card>
      ) : null}

      <LinearGradient
        colors={["#0a2539", "#16537e", "#7bd3ff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 32, padding: 18, gap: 14, overflow: "hidden" }}
      >
        <View
          style={{
            position: "absolute",
            right: -26,
            top: -18,
            width: 120,
            height: 120,
            borderRadius: 999,
            backgroundColor: "rgba(255,255,255,0.10)",
          }}
        />
        <View
          style={{
            position: "absolute",
            left: -34,
            bottom: -44,
            width: 150,
            height: 150,
            borderRadius: 999,
            backgroundColor: "rgba(255,255,255,0.08)",
          }}
        />

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
            <Image source={require("../../assets/ludovkylogo.png")} style={{ width: 52, height: 52, borderRadius: 14 }} resizeMode="contain" />
            <View style={{ flex: 1, gap: 4 }}>
              <Badge label="Hlavné vyhľadávanie" color="#b9ecff" />
              <Text style={{ fontSize: 30, lineHeight: 34, color: "#f3fbff", fontWeight: "900" }}>Hľadať</Text>
            </View>
          </View>
          <Badge label={`${songs.length} piesní`} color="#9ce1ff" />
        </View>

        <Text style={{ fontSize: 15, lineHeight: 22, color: "rgba(239,250,255,0.92)", fontWeight: "600" }}>
          Hľadať podľa názvu, obce, alebo textu.
        </Text>

        <View
          style={{
            borderRadius: 24,
            backgroundColor: "rgba(248,252,255,0.16)",
            borderWidth: 1,
            borderColor: "rgba(226,244,255,0.28)",
            padding: 12,
            gap: 10,
          }}
        >
          <Field value={query} onChangeText={setQuery} placeholder="Hľadať podľa názvu, obce, alebo textu" />

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1.4 }}>
              <Button label="Hľadať" onPress={() => void runFulltextSearch()} loading={searching} />
            </View>
            <View style={{ flex: 1 }}>
              <Button label="Piesne" tone="secondary" onPress={() => router.push("/(tabs)/songs")} />
            </View>
          </View>
        </View>

        {searching ? <ProgressBar progress={progress} label={`Prehľadávam index... ${Math.round(progress * 100)} %`} /> : null}
      </LinearGradient>

      <Pressable onPress={() => void Linking.openURL("https://slovenskeludovky.sk")} style={({ pressed }) => ({ opacity: pressed ? 0.96 : 1 })}>
        <LinearGradient
          colors={["#dff4ff", "#ecf9ff"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 24,
            padding: 14,
            borderWidth: 1,
            borderColor: "#cbe8f9",
            gap: 10,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Image source={require("../../assets/ludovkylogo.png")} style={{ width: 34, height: 34, borderRadius: 8 }} resizeMode="contain" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: "900", color: "#123a58" }}>Viac na slovenskeludovky.sk</Text>
              <Text style={{ fontSize: 13, color: "#456984" }}>Albumy, obľúbené piesne a živá databáza.</Text>
            </View>
          </View>
        </LinearGradient>
      </Pressable>

      {error ? (
        <Card>
          <Text style={{ fontSize: 15, fontWeight: "800", color: "#8f2d1c" }}>Dáta sa nepodarilo načítať.</Text>
          <Text style={{ color: "#7d6f63", fontSize: 14 }}>{error}</Text>
        </Card>
      ) : null}

      <Card>
        {!searchedQuery ? (
          <EmptyState title="Začni hľadať" subtitle="Napíš názov, obec alebo časť textu piesne a výsledky sa zobrazia automaticky." />
        ) : !searching && resultSongs.length === 0 ? (
          <EmptyState title="Bez výsledkov" subtitle="Skús iný názov, obec alebo časť textu." />
        ) : (
          resultSongs.slice(0, 20).map((song) => (
            <SongCard
              key={song.id}
              title={song.title}
              region={song.region}
              obec={song.obec}
              favoriteCount={song.favoriteCount}
              viewCount={song.viewCount}
              onPress={() => router.push(`/songs/${song.id}`)}
            />
          ))
        )}
        {resultSongs.length > 20 ? (
          <Button label={`Otvoriť v zozname (${resultSongs.length})`} tone="secondary" onPress={() => router.push({ pathname: "/(tabs)/songs", params: { query: searchedQuery } })} />
        ) : null}
      </Card>
    </ScrollView>
  )
}
