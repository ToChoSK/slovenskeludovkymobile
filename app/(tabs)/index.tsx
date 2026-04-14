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
      <ScrollView style={{ flex: 1, backgroundColor: "#f4fbff" }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 120 }}>
        <Card>
          <Loading label="Načítavam lokálny katalóg..." />
        </Card>
      </ScrollView>
    )
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f4fbff" }} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 120 }}>
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
        colors={["#f8fdff", "#eef8ff", "#e1f4ff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 34,
          padding: 18,
          gap: 16,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "#d2ebf8",
          shadowColor: "#5fa8cf",
          shadowOffset: { width: 0, height: 16 },
          shadowOpacity: 0.12,
          shadowRadius: 28,
          elevation: 6,
        }}
      >
        <View
          style={{
            position: "absolute",
            right: -18,
            top: -12,
            width: 128,
            height: 128,
            borderRadius: 999,
            backgroundColor: "rgba(123, 211, 255, 0.20)",
          }}
        />
        <View
          style={{
            position: "absolute",
            left: -36,
            bottom: -54,
            width: 168,
            height: 168,
            borderRadius: 999,
            backgroundColor: "rgba(182, 230, 255, 0.28)",
          }}
        />
        <View
          style={{
            position: "absolute",
            right: 56,
            bottom: 34,
            width: 76,
            height: 76,
            borderRadius: 24,
            backgroundColor: "rgba(255, 255, 255, 0.44)",
            transform: [{ rotate: "18deg" }],
          }}
        />

        <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
            <View
              style={{
                width: 58,
                height: 58,
                borderRadius: 18,
                backgroundColor: "rgba(255,255,255,0.84)",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "#d7edf8",
              }}
            >
              <Image source={require("../../assets/ludovkylogo.png")} style={{ width: 42, height: 42, borderRadius: 12 }} resizeMode="contain" />
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={{ fontSize: 30, lineHeight: 34, color: "#15354b", fontWeight: "900" }}>Hľadať</Text>
              <Text style={{ fontSize: 14, lineHeight: 20, color: "#55748a", fontWeight: "600" }}>
                Názov, obec, región alebo priamo text piesne.
              </Text>
            </View>
          </View>
          <View
            style={{
              borderRadius: 18,
              paddingHorizontal: 12,
              paddingVertical: 10,
              backgroundColor: "rgba(255,255,255,0.72)",
              borderWidth: 1,
              borderColor: "#d7edf8",
              minWidth: 84,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: "800", color: "#6d8ca0", textTransform: "uppercase", letterSpacing: 0.8 }}>Katalóg</Text>
            <Text style={{ fontSize: 20, fontWeight: "900", color: "#16374e", marginTop: 2 }}>{songs.length}</Text>
            <Text style={{ fontSize: 12, color: "#5f8096", fontWeight: "700" }}>piesní</Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          <SearchHint label="Názov piesne" />
          <SearchHint label="Obec a región" />
          <SearchHint label="Úryvok textu" />
        </View>

        <View
          style={{
            borderRadius: 28,
            backgroundColor: "rgba(255,255,255,0.72)",
            borderWidth: 1,
            borderColor: "#d5ecf9",
            padding: 14,
            gap: 12,
          }}
        >
          <Field value={query} onChangeText={setQuery} placeholder="Napíš názov, obec alebo časť textu piesne" />

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1.4 }}>
              <Button label="Vyhľadať" onPress={() => void runFulltextSearch()} loading={searching} />
            </View>
            <View style={{ flex: 1 }}>
              <Button label="Katalóg piesní" tone="secondary" onPress={() => router.push("/(tabs)/songs")} />
            </View>
          </View>
        </View>

        {searching ? <ProgressBar progress={progress} label={`Prehľadávam index... ${Math.round(progress * 100)} %`} /> : null}
      </LinearGradient>

      <Pressable onPress={() => void Linking.openURL("https://slovenskeludovky.sk")} style={({ pressed }) => ({ opacity: pressed ? 0.96 : 1 })}>
        <LinearGradient
          colors={["#edf9ff", "#f8fdff"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 24,
            padding: 14,
            borderWidth: 1,
            borderColor: "#d7edf8",
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

function SearchHint({ label }: { label: string }) {
  return (
    <View
      style={{
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: "rgba(255,255,255,0.64)",
        borderWidth: 1,
        borderColor: "#d8eef9",
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: "800", color: "#3b6f8d" }}>{label}</Text>
    </View>
  )
}
