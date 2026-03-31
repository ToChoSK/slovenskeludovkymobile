import { Link } from "expo-router"
import { useState } from "react"
import { FlatList, Pressable, Text, View } from "react-native"
import { Button, Card, Field, Heading, Screen, Subtle } from "@/components/ui"
import { useSongsQuery } from "@/providers/SongsProvider"

export default function SongsScreen() {
  const [search, setSearch] = useState("")
  const [region, setRegion] = useState<"all" | string>("all")
  const [sortBy, setSortBy] = useState<"views" | "title" | "favorites">("views")
  const query = useSongsQuery({ search, region, sortBy, sortDir: sortBy === "title" ? "asc" : "desc" })

  return (
    <Screen>
      <Card>
        <Heading>Piesne</Heading>
        <Subtle>Online rezim hlada v `metadata/allSongs`, offline rezim aj v `textVersions` lokalneho datasetu.</Subtle>
        <Field value={search} onChangeText={setSearch} placeholder="Hladat podla nazvu, obce alebo textu" />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <Button label={`Region: ${region}`} tone="secondary" onPress={() => setRegion(region === "all" ? "horehronie" : "all")} />
          <Button
            label={`Sort: ${sortBy}`}
            tone="secondary"
            onPress={() => setSortBy(sortBy === "views" ? "title" : sortBy === "title" ? "favorites" : "views")}
          />
        </View>
      </Card>

      <Card>
        <Text style={{ fontWeight: "700", color: "#23160d" }}>{query.total} piesni</Text>
        <FlatList
          scrollEnabled={false}
          data={query.rows}
          keyExtractor={(item) => String(item.i)}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <Link href={`/songs/${item.i}` as const} asChild>
              <Pressable style={{ backgroundColor: "#fff", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#eadfcb", gap: 6 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#23160d" }}>{item.t}</Text>
                <Text style={{ color: "#6d5b4a" }}>
                  {[item.r, item.o].filter(Boolean).join(" · ") || "Bez regionu"}
                </Text>
                <Text style={{ color: "#6d5b4a" }}>Oblubene: {item.f} · Zobrazenia: {item.v}</Text>
              </Pressable>
            </Link>
          )}
        />
      </Card>
    </Screen>
  )
}
