import { router, useLocalSearchParams } from "expo-router"
import { startTransition, useDeferredValue, useEffect, useMemo, useState, useTransition } from "react"
import { ActivityIndicator, FlatList, ScrollView, Text, TouchableOpacity, View } from "react-native"
import { Badge, Card, EmptyState, Field, SongCard, Subtle } from "@/components/ui"
import { EXTRA_REGION_KEYS, MAP_REGION_KEYS, REGION_META, isRegionIncluded, type RegionKey } from "@/lib/regions"
import { normalizeSearchText } from "@/lib/search"
import { useSongs } from "@/providers/SongsProvider"

type SortBy = "views" | "title" | "favorites"

const SORT_LABELS: Record<SortBy, string> = {
  views: "Zobrazenia",
  title: "Názov",
  favorites: "Obľúbené",
}

const ALL_REGION_KEYS = [...MAP_REGION_KEYS, ...EXTRA_REGION_KEYS]

export default function SongsScreen() {
  const params = useLocalSearchParams<{ region?: string; query?: string }>()
  const { songs } = useSongs()
  const [search, setSearch] = useState("")
  const [region, setRegion] = useState<"all" | string>("all")
  const [sortBy, setSortBy] = useState<SortBy>("views")
  const [isSortPending, startSortTransition] = useTransition()
  const deferredSearch = useDeferredValue(search)
  const deferredRegion = useDeferredValue(region)
  const deferredSortBy = useDeferredValue(sortBy)

  useEffect(() => {
    setRegion(typeof params.region === "string" && params.region.length > 0 ? params.region : "all")
  }, [params.region])

  useEffect(() => {
    setSearch(typeof params.query === "string" ? params.query : "")
  }, [params.query])

  const rows = useMemo(() => {
    const q = normalizeSearchText(deferredSearch)
    const filtered = songs.filter((song) => {
      if (!isRegionIncluded(deferredRegion, song.region)) return false
      if (!q) return true
      return normalizeSearchText(`${song.title} ${song.region ?? ""} ${song.obec ?? ""}`).includes(q)
    })

    const effectiveSortBy: SortBy = q ? "views" : deferredSortBy

    return [...filtered].sort((a, b) => {
      const compare =
        effectiveSortBy === "views"
          ? a.viewCount - b.viewCount
          : effectiveSortBy === "favorites"
            ? a.favoriteCount - b.favoriteCount
            : a.title.localeCompare(b.title, "sk", { sensitivity: "base" })
      return effectiveSortBy === "title" ? compare || a.id - b.id : -(compare || a.id - b.id)
    })
  }, [songs, deferredRegion, deferredSearch, deferredSortBy])

  const nextSort: SortBy = sortBy === "views" ? "title" : sortBy === "title" ? "favorites" : "views"
  const header = (
    <View style={{ padding: 16, gap: 12, paddingBottom: 16 }}>
      <Card>
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 12, fontWeight: "800", color: "#2b7fb9", letterSpacing: 1.1, textTransform: "uppercase" }}>Katalog</Text>
          <Text style={{ fontSize: 24, fontWeight: "900", color: "#13324a" }}>Prehľadávaj regióny, názvy a metadáta.</Text>
          <Subtle>Fulltext podľa textu piesní beží z domovskej obrazovky. Tu nájdeš rýchly katalóg a filter regiónov.</Subtle>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <Badge label={`${rows.length} výsledkov`} />
          <TouchableOpacity
            onPress={() =>
              startSortTransition(() => {
                setSortBy(nextSort)
              })
            }
            disabled={Boolean(search.trim())}
            style={{
              borderRadius: 999,
              backgroundColor: search.trim() ? "#e5f2fb" : "#edf7fd",
              borderWidth: 1,
              borderColor: search.trim() ? "#d3e7f4" : "#cfe5f3",
              paddingHorizontal: 14,
              paddingVertical: 9,
              opacity: search.trim() ? 0.7 : 1,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            {isSortPending ? <ActivityIndicator size="small" color="#17354d" /> : null}
            <Text style={{ color: "#17354d", fontWeight: "800" }}>
              {isSortPending ? "Triedim..." : `Triedenie: ${search.trim() ? SORT_LABELS.views : SORT_LABELS[sortBy]}`}
            </Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}>
          <FilterChip
            label="Všetky"
            active={region === "all"}
            onPress={() =>
              startTransition(() => {
                setRegion("all")
              })
            }
            color="#3b9ed8"
          />
          {ALL_REGION_KEYS.map((key) => {
            const meta = REGION_META[key as RegionKey]
            return (
              <FilterChip
                key={key}
                label={meta.label}
                active={region === key}
                color={meta.color}
                onPress={() =>
                  startTransition(() => {
                    setRegion(region === key ? "all" : key)
                  })
                }
              />
            )
          })}
        </ScrollView>
        <Field
          value={search}
          onChangeText={(value) =>
            startTransition(() => {
              setSearch(value)
            })
          }
          placeholder="Filtruj podľa názvu, regiónu alebo obce..."
        />
      </Card>

    </View>
  )

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: "#eef7fd" }}
      contentContainerStyle={{ paddingBottom: 140 }}
      data={rows}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={header}
      ListEmptyComponent={<View style={{ paddingHorizontal: 16 }}><Card><EmptyState title="Žiadne piesne" subtitle="Skús iný filter alebo sa vráť na domovskú obrazovku a použi fulltextové hľadanie." /></Card></View>}
      renderItem={({ item }) => (
        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <SongCard
            title={item.title}
            region={item.region}
            obec={item.obec}
            favoriteCount={item.favoriteCount}
            viewCount={item.viewCount}
            onPress={() => router.push(`/songs/${item.id}`)}
          />
        </View>
      )}
      initialNumToRender={16}
      maxToRenderPerBatch={16}
      windowSize={8}
      removeClippedSubviews
    />
  )
}

function FilterChip({ label, active, color, onPress }: { label: string; active: boolean; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: active ? color : `${color}15`,
        borderWidth: 1,
        borderColor: active ? color : `${color}55`,
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: "800", color: active ? "#fff" : color }}>{label}</Text>
    </TouchableOpacity>
  )
}
