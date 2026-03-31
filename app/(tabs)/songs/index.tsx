import { Link, useLocalSearchParams } from "expo-router"
import { useEffect, useState } from "react"
import { FlatList, Text, TouchableOpacity, View, ScrollView } from "react-native"
import { Card, EmptyState, Field, Screen, SongCard } from "@/components/ui"
import { MAP_REGION_KEYS, REGION_META, EXTRA_REGION_KEYS, type RegionKey } from "@/lib/regions"
import { useSongsQuery } from "@/providers/SongsProvider"

type SortBy = "views" | "title" | "favorites"

const SORT_LABELS: Record<SortBy, string> = {
  views: "Zobrazenia",
  title: "Názov",
  favorites: "Obľúbené",
}

const ALL_REGION_KEYS = [...MAP_REGION_KEYS, ...EXTRA_REGION_KEYS]

export default function SongsScreen() {
  const params = useLocalSearchParams<{ region?: string }>()
  const [search, setSearch] = useState("")
  const [region, setRegion] = useState<"all" | string>(params.region ?? "all")
  const [sortBy, setSortBy] = useState<SortBy>("views")

  // Sync region from route params
  useEffect(() => {
    if (params.region) setRegion(params.region)
  }, [params.region])

  const query = useSongsQuery({
    search,
    region,
    sortBy,
    sortDir: sortBy === "title" ? "asc" : "desc",
  })

  const nextSort: SortBy = sortBy === "views" ? "title" : sortBy === "title" ? "favorites" : "views"

  return (
    <Screen>
      {/* Search + filters */}
      <Card>
        <Field
          value={search}
          onChangeText={setSearch}
          placeholder="Hľadať podľa názvu, obce alebo textu…"
        />
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          <FilterChip
            label={`Zoradiť: ${SORT_LABELS[sortBy]}`}
            onPress={() => setSortBy(nextSort)}
            active={false}
            color="#7c3aed"
          />
          {region !== "all" && (
            <FilterChip
              label={`${REGION_META[region as RegionKey]?.label ?? region} ×`}
              onPress={() => setRegion("all")}
              active={true}
              color="#b45309"
            />
          )}
        </View>
      </Card>

      {/* Region quick filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 4 }}
      >
        <FilterChip label="Všetky" active={region === "all"} onPress={() => setRegion("all")} color="#b45309" />
        {ALL_REGION_KEYS.map((key) => {
          const meta = REGION_META[key as RegionKey]
          return (
            <FilterChip
              key={key}
              label={meta.label}
              active={region === key}
              color={meta.color}
              onPress={() => setRegion(region === key ? "all" : key)}
            />
          )
        })}
      </ScrollView>

      {/* Results header */}
      <View style={{ paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 13, color: "#6d5b4a", fontWeight: "500" }}>
          {query.total} {query.total === 1 ? "pieseň" : query.total < 5 ? "piesne" : "piesní"}
        </Text>
        <Link href="/songs/add" style={{ fontSize: 13, color: "#b45309", fontWeight: "700" }}>
          + Pridať pieseň
        </Link>
      </View>

      {/* Songs list */}
      {query.rows.length === 0 ? (
        <Card>
          <EmptyState title="Žiadne piesne" subtitle="Skús zmeniť filter alebo vyhľadávacie slovo." />
        </Card>
      ) : (
        <Card style={{ gap: 10 }}>
          <FlatList
            scrollEnabled={false}
            data={query.rows}
            keyExtractor={(item) => String(item.i)}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item }) => (
              <Link href={`/songs/${item.i}` as const} asChild>
                <SongCard
                  title={item.t}
                  region={item.r}
                  obec={item.o}
                  favoriteCount={item.f}
                  viewCount={item.v}
                />
              </Link>
            )}
          />
        </Card>
      )}
    </Screen>
  )
}

function FilterChip({ label, active, color, onPress }: { label: string; active: boolean; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: active ? color : `${color}18`,
        borderWidth: 1.5,
        borderColor: active ? color : `${color}55`,
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: "600", color: active ? "#fff" : color }}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}
