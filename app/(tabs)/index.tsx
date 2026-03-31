import { router } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import { useMemo, useRef, useState } from "react"
import { Image, Linking, Pressable, ScrollView, Text, View } from "react-native"
import { Badge, Button, Card, EmptyState, Field, Loading, ProgressBar, SongCard } from "@/components/ui"
import { useSongs } from "@/providers/SongsProvider"

export default function SearchScreen() {
  const { songs, loading, error, titleSuggestions, searchSongs } = useSongs()
  const [query, setQuery] = useState("")
  const [mode, setMode] = useState<"titles" | "text">("titles")
  const [searching, setSearching] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<number[]>([])
  const [searchedQuery, setSearchedQuery] = useState("")
  const searchSignalRef = useRef<{ cancelled: boolean } | null>(null)
  const scrollRef = useRef<ScrollView | null>(null)
  const fulltextSectionY = useRef(0)

  const suggestions = useMemo(() => titleSuggestions(query, 8), [query, titleSuggestions])
  const suggestionSongs = useMemo(
    () => [...suggestions].sort((a, b) => b.viewCount - a.viewCount || a.title.localeCompare(b.title, "sk", { sensitivity: "base" })),
    [suggestions],
  )
  const resultSongs = useMemo(
    () =>
      results
        .map((id) => songs.find((song) => song.id === id))
        .filter((song): song is NonNullable<typeof song> => !!song)
        .sort((a, b) => b.viewCount - a.viewCount || a.title.localeCompare(b.title, "sk", { sensitivity: "base" })),
    [results, songs],
  )

  async function runFulltextSearch() {
    const trimmed = query.trim()
    setMode("text")
    scrollRef.current?.scrollTo({ y: fulltextSectionY.current, animated: true })

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

  if (loading) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: "#eef7fd" }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 120 }}>
        <Card>
          <Loading label="Nacitavam lokalny katalog..." />
        </Card>
      </ScrollView>
    )
  }

  return (
    <ScrollView ref={scrollRef} style={{ flex: 1, backgroundColor: "#eef7fd" }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 120 }}>
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
            <Text style={{ fontSize: 13, color: "#456984" }}>Albumy, oblubene piesne a ziva databaza.</Text>
          </View>
        </View>
        <Button label="Otvorit web" tone="secondary" onPress={() => void Linking.openURL("https://slovenskeludovky.sk")} />
      </LinearGradient>

      <LinearGradient
        colors={["#0f2d46", "#1a5b87", "#7bd3ff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 30, padding: 18, gap: 14 }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Image source={require("../../assets/ludovkylogo.png")} style={{ width: 46, height: 46, borderRadius: 12 }} resizeMode="contain" />
            <Text style={{ fontSize: 30, lineHeight: 34, color: "#f3fbff", fontWeight: "900" }}>Hladat</Text>
          </View>
          <Badge label={`${songs.length} piesni`} color="#9ce1ff" />
        </View>

        <View style={{ flexDirection: "row", gap: 8 }}>
          <ModeChip label="Nazvy" active={mode === "titles"} onPress={() => setMode("titles")} />
          <ModeChip
            label="Text"
            active={mode === "text"}
            onPress={() => {
              setMode("text")
              void runFulltextSearch()
            }}
          />
        </View>

        <Field value={query} onChangeText={setQuery} placeholder="Hladaj piesen..." />

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Button label="Hladat v texte" onPress={() => void runFulltextSearch()} loading={searching} />
          </View>
          <View style={{ flex: 1 }}>
            <Button label="Filtre" tone="secondary" onPress={() => router.push("/(tabs)/songs")} />
          </View>
        </View>

        {searching ? <ProgressBar progress={progress} label={`Prehladavam index... ${Math.round(progress * 100)} %`} /> : null}
      </LinearGradient>

      {error ? (
        <Card>
          <Text style={{ fontSize: 15, fontWeight: "800", color: "#8f2d1c" }}>Dataset sa nepodarilo nacitat</Text>
          <Text style={{ color: "#7d6f63", fontSize: 14 }}>{error}</Text>
        </Card>
      ) : null}

      <Card>
        <Text style={{ fontSize: 16, fontWeight: "900", color: "#153550" }}>Nazvy</Text>
        {mode !== "titles" ? (
          <Text style={{ color: "#63819a", fontSize: 14 }}>Prepni na rezim Nazvy pre live vysledky.</Text>
        ) : !query.trim() ? (
          <EmptyState title="Zacni pisat" subtitle="Vysledky sa ukazu okamzite." />
        ) : suggestionSongs.length === 0 ? (
          <EmptyState title="Bez zhody" subtitle="Skus iny zapis." />
        ) : (
          suggestionSongs.map((song) => (
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
      </Card>

      <View
        onLayout={(event) => {
          fulltextSectionY.current = event.nativeEvent.layout.y - 24
        }}
      >
        <Card>
          <Text style={{ fontSize: 16, fontWeight: "900", color: "#153550" }}>Fulltext</Text>
          {!searchedQuery ? (
            <EmptyState title="Spusti hladanie v texte" subtitle="Klikni na Hladat v texte." />
          ) : !searching && resultSongs.length === 0 ? (
            <EmptyState title="Bez vysledkov" subtitle="Skus iny zapis." />
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
            <Button label={`Otvorit vo filtroch (${resultSongs.length})`} tone="secondary" onPress={() => router.push({ pathname: "/(tabs)/songs", params: { query: searchedQuery } })} />
          ) : null}
        </Card>
      </View>
    </ScrollView>
  )
}

function ModeChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: active ? "rgba(240,250,255,0.95)" : "rgba(240,250,255,0.18)",
        borderWidth: 1,
        borderColor: active ? "#d0ecfb" : "rgba(232,247,255,0.42)",
      }}
    >
      <Text style={{ color: active ? "#1b5278" : "#eaf8ff", fontSize: 12, fontWeight: "800" }}>{label}</Text>
    </Pressable>
  )
}
