import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import { useEffect, useMemo, useRef, useState } from "react"
import { Image, Linking, Pressable, ScrollView, Text, View } from "react-native"
import { Badge, Button, Card, EmptyState, Field, Loading, ProgressBar, SongCard } from "@/components/ui"
import { OnboardingOverlay } from "@/components/OnboardingOverlay"
import { loadMobileAppUpdatePrompt } from "@/lib/app-update"
import { useSongs } from "@/providers/SongsProvider"
import type { MobileAppUpdatePrompt, SongCatalogItem } from "@/types"

type SearchMode = "title" | "fulltext"

export default function SearchScreen() {
  const { songs, loading, error, searchSongs, titleSuggestions } = useSongs()
  const [query, setQuery] = useState("")
  const [searchMode, setSearchMode] = useState<SearchMode>("title")
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

  // Title search results (instant)
  const titleResults = useMemo(() => {
    if (searchMode !== "title" || !query.trim()) return []
    return titleSuggestions(query, 20)
  }, [query, searchMode, titleSuggestions])

  // Top songs for quick access
  const topSongs = useMemo(
    () => [...songs].sort((a, b) => b.viewCount - a.viewCount).slice(0, 6),
    [songs],
  )

  const favoriteSongs = useMemo(
    () => [...songs].sort((a, b) => b.favoriteCount - a.favoriteCount).slice(0, 6),
    [songs],
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

  // Clear fulltext results when switching modes or clearing query
  useEffect(() => {
    if (searchMode !== "fulltext") {
      if (searchSignalRef.current) searchSignalRef.current.cancelled = true
      setSearching(false)
      setResults([])
      setSearchedQuery("")
      setProgress(0)
    }
  }, [searchMode])

  // Clear fulltext results when query is emptied
  useEffect(() => {
    if (!query.trim() && searchMode === "fulltext") {
      if (searchSignalRef.current) searchSignalRef.current.cancelled = true
      setSearching(false)
      setResults([])
      setSearchedQuery("")
      setProgress(0)
    }
  }, [query])

  if (loading) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: "#f4fbff" }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 140 }}>
        <Card>
          <Loading label="Načítavam katalóg piesní..." />
        </Card>
      </ScrollView>
    )
  }

  const hasQuery = query.trim().length > 0
  const showTitleResults = searchMode === "title" && hasQuery && titleResults.length > 0
  const showFulltextResults = searchMode === "fulltext" && searchedQuery
  const showQuickAccess = !hasQuery

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f4fbff" }} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 140 }}>
      <OnboardingOverlay />

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

      {/* Search card */}
      <View
        style={{
          borderRadius: 28,
          backgroundColor: "#ffffff",
          borderWidth: 1,
          borderColor: "#d5ecf9",
          padding: 16,
          gap: 14,
          shadowColor: "#5fa8cf",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 20,
          elevation: 4,
        }}
      >
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Image source={require("../../assets/ludovkylogo.png")} style={{ width: 40, height: 40, borderRadius: 12 }} resizeMode="contain" />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 22, color: "#15354b", fontWeight: "900" }}>Hľadať piesne</Text>
            <Text style={{ fontSize: 13, color: "#7a98ad" }}>{songs.length} piesní v katalógu</Text>
          </View>
        </View>

        {/* Search mode toggle */}
        <View style={{ flexDirection: "row", borderRadius: 16, backgroundColor: "#eef7fd", padding: 4, gap: 4 }}>
          <SearchModeTab
            label="Podľa názvu"
            icon="text-outline"
            active={searchMode === "title"}
            onPress={() => setSearchMode("title")}
          />
          <SearchModeTab
            label="Podľa textu"
            icon="document-text-outline"
            active={searchMode === "fulltext"}
            onPress={() => setSearchMode("fulltext")}
          />
        </View>

        {/* Search input */}
        <Field
          value={query}
          onChangeText={setQuery}
          placeholder={searchMode === "title" ? "Napíš názov piesne..." : "Napíš úryvok textu piesne..."}
        />

        {searchMode === "fulltext" && (
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Button label="Vyhľadať v textoch" onPress={() => void runFulltextSearch()} loading={searching} />
            </View>
          </View>
        )}

        {searching && searchMode === "fulltext" ? (
          <ProgressBar progress={progress} label={`Prehľadávam texty... ${Math.round(progress * 100)} %`} />
        ) : null}
      </View>

      {/* Title search results (instant) */}
      {showTitleResults ? (
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 14, fontWeight: "800", color: "#5d7a92" }}>Výsledky ({titleResults.length})</Text>
          </View>
          {titleResults.map((song) => (
            <SongCard
              key={song.id}
              title={song.title}
              region={song.region}
              obec={song.obec}
              favoriteCount={song.favoriteCount}
              viewCount={song.viewCount}
              onPress={() => router.push(`/songs/${song.id}`)}
            />
          ))}
        </Card>
      ) : null}

      {/* Title search - no results */}
      {searchMode === "title" && hasQuery && titleResults.length === 0 ? (
        <Card>
          <EmptyState title="Bez výsledkov" subtitle="Skús iný názov alebo prepni na hľadanie podľa textu." />
        </Card>
      ) : null}

      {/* Fulltext results */}
      {showFulltextResults ? (
        <Card>
          {!searching && resultSongs.length === 0 ? (
            <EmptyState title="Bez výsledkov" subtitle="Skús iný text alebo prepni na hľadanie podľa názvu." />
          ) : (
            <>
              {resultSongs.length > 0 && (
                <Text style={{ fontSize: 14, fontWeight: "800", color: "#5d7a92" }}>Výsledky ({resultSongs.length})</Text>
              )}
              {resultSongs.slice(0, 20).map((song) => (
                <SongCard
                  key={song.id}
                  title={song.title}
                  region={song.region}
                  obec={song.obec}
                  favoriteCount={song.favoriteCount}
                  viewCount={song.viewCount}
                  onPress={() => router.push(`/songs/${song.id}`)}
                />
              ))}
              {resultSongs.length > 20 ? (
                <Button label={`Otvoriť v zozname (${resultSongs.length})`} tone="secondary" onPress={() => router.push({ pathname: "/(tabs)/songs", params: { query: searchedQuery } })} />
              ) : null}
            </>
          )}
        </Card>
      ) : null}

      {error ? (
        <Card>
          <Text style={{ fontSize: 15, fontWeight: "800", color: "#8f2d1c" }}>Dáta sa nepodarilo načítať.</Text>
          <Text style={{ color: "#7d6f63", fontSize: 14 }}>{error}</Text>
        </Card>
      ) : null}

      {/* Quick access sections */}
      {showQuickAccess ? (
        <>
          {/* Top viewed songs */}
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4 }}>
              <Text style={{ fontSize: 16, fontWeight: "900", color: "#13324a" }}>🔥 Najhľadanejšie</Text>
              <Pressable onPress={() => router.push("/(tabs)/songs")}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#2e89c7" }}>Všetky →</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 2 }}>
              {topSongs.map((song) => (
                <QuickSongCard key={song.id} song={song} onPress={() => router.push(`/songs/${song.id}`)} />
              ))}
            </ScrollView>
          </View>

          {/* Top favorited songs */}
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4 }}>
              <Text style={{ fontSize: 16, fontWeight: "900", color: "#13324a" }}>❤️ Obľúbené</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 2 }}>
              {favoriteSongs.map((song) => (
                <QuickSongCard key={song.id} song={song} onPress={() => router.push(`/songs/${song.id}`)} />
              ))}
            </ScrollView>
          </View>

          {/* Quick links */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable
              onPress={() => router.push("/(tabs)/songs")}
              style={{ flex: 1, borderRadius: 20, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#d5ecf9", padding: 16, alignItems: "center", gap: 8 }}
            >
              <Ionicons name="musical-notes" size={24} color="#2e89c7" />
              <Text style={{ fontSize: 13, fontWeight: "800", color: "#15354b" }}>Katalóg piesní</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/(tabs)/map")}
              style={{ flex: 1, borderRadius: 20, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#d5ecf9", padding: 16, alignItems: "center", gap: 8 }}
            >
              <Ionicons name="map" size={24} color="#9b59b6" />
              <Text style={{ fontSize: 13, fontWeight: "800", color: "#15354b" }}>Mapa regiónov</Text>
            </Pressable>
          </View>

          {/* Web link */}
          <Pressable onPress={() => void Linking.openURL("https://slovenskeludovky.sk")} style={({ pressed }) => ({ opacity: pressed ? 0.96 : 1 })}>
            <View
              style={{
                borderRadius: 20,
                padding: 14,
                borderWidth: 1,
                borderColor: "#d7edf8",
                backgroundColor: "#ffffff",
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Image source={require("../../assets/ludovkylogo.png")} style={{ width: 30, height: 30, borderRadius: 8 }} resizeMode="contain" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "800", color: "#123a58" }}>slovenskeludovky.sk</Text>
                <Text style={{ fontSize: 12, color: "#7a98ad" }}>Albumy, obľúbené a živá databáza</Text>
              </View>
              <Ionicons name="open-outline" size={16} color="#7a98ad" />
            </View>
          </Pressable>
        </>
      ) : null}
    </ScrollView>
  )
}

function SearchModeTab({ label, icon, active, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: active ? "#ffffff" : "transparent",
        shadowColor: active ? "#2d5874" : "transparent",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: active ? 0.1 : 0,
        shadowRadius: 8,
        elevation: active ? 2 : 0,
      }}
    >
      <Ionicons name={icon} size={14} color={active ? "#2e89c7" : "#7a98ad"} />
      <Text style={{ fontSize: 13, fontWeight: "800", color: active ? "#15354b" : "#7a98ad" }}>{label}</Text>
    </Pressable>
  )
}

function QuickSongCard({ song, onPress }: { song: SongCatalogItem; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 160,
        borderRadius: 20,
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#d8eaf6",
        padding: 14,
        gap: 6,
        opacity: pressed ? 0.9 : 1,
        shadowColor: "#2d5874",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 2,
      })}
    >
      <Text style={{ fontSize: 14, fontWeight: "900", color: "#13324a" }} numberOfLines={2}>{song.title}</Text>
      <Text style={{ fontSize: 11, color: "#7a98ad" }} numberOfLines={1}>{song.region ?? "Slovensko"}</Text>
      <View style={{ flexDirection: "row", gap: 8, marginTop: 2 }}>
        <Text style={{ fontSize: 11, color: "#7391a9" }}>👁 {song.viewCount}</Text>
        <Text style={{ fontSize: 11, color: "#7391a9" }}>❤️ {song.favoriteCount}</Text>
      </View>
    </Pressable>
  )
}
