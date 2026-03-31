import { router } from "expo-router"
import { useState } from "react"
import { Text, View } from "react-native"
import { Card, Heading, KeyValue, Loading, Screen, Subtle } from "@/components/ui"
import { SlovakiaMap } from "@/components/SlovakiaMap"
import { useAppMode } from "@/providers/AppModeProvider"
import { useAuth } from "@/providers/AuthProvider"
import { useSongs } from "@/providers/SongsProvider"

export default function HomeScreen() {
  const { mode, dataset, syncing, syncFromCdn, isOnlineReachable } = useAppMode()
  const { user } = useAuth()
  const { metadata, loading } = useSongs()
  const [selectedRegion, setSelectedRegion] = useState<string | "all">("all")

  const totalSongs = metadata?.count ?? dataset?.metadata.count ?? 0

  return (
    <Screen onRefresh={() => void syncFromCdn()} refreshing={syncing}>
      {/* Hero card */}
      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Heading>Slovenské ľudovky</Heading>
            <Subtle>Zbierka slovenských ľudových piesní — {totalSongs} piesní</Subtle>
          </View>
          {user && (
            <View style={{ alignItems: "flex-end", gap: 2 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#b45309" }}>{user.nick}</Text>
              <Text style={{ fontSize: 11, color: "#a08878" }}>{user.role}</Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <StatChip label="Piesne" value={String(totalSongs)} color="#b45309" />
          <StatChip label="Režim" value={mode === "online" ? "🟢 Online" : "🟡 Offline"} color={mode === "online" ? "#16a34a" : "#d97706"} />
          <StatChip label="Internet" value={isOnlineReachable ? "✓" : "✗"} color={isOnlineReachable ? "#16a34a" : "#dc2626"} />
        </View>
      </Card>

      {/* Interactive Slovakia map */}
      <Card>
        <Heading size="h2">Mapa regiónov</Heading>
        <Subtle>Klepni na región pre filtrovanie piesní</Subtle>
        {loading ? (
          <Loading label="Načítavam metadáta..." />
        ) : (
          <SlovakiaMap
            metadata={metadata}
            selectedRegion={selectedRegion}
            onSelectRegion={(region) => {
              setSelectedRegion(region)
              if (region !== "all") {
                router.push(`/(tabs)/songs/index?region=${encodeURIComponent(region)}`)
              }
            }}
          />
        )}
      </Card>

      {/* Dataset info */}
      <Card>
        <Heading size="h2">Informácie o dátach</Heading>
        <KeyValue label="Aktívny režim" value={mode} />
        <KeyValue label="Offline dataset" value={dataset?.meta.source ?? "neznámy"} />
        <KeyValue label="Stiahnutý" value={dataset?.meta.downloadedAt ?? "-"} />
        {mode === "online" && (
          <Text
            onPress={() => void syncFromCdn()}
            style={{
              color: syncing ? "#a08878" : "#b45309",
              fontWeight: "600",
              fontSize: 14,
              textAlign: "center",
              paddingVertical: 6,
            }}
          >
            {syncing ? "Synchronizujem..." : "↻ Aktualizovať offline dataset"}
          </Text>
        )}
      </Card>
    </Screen>
  )
}

function StatChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center", backgroundColor: `${color}11`, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 8, borderWidth: 1, borderColor: `${color}33` }}>
      <Text style={{ fontSize: 15, fontWeight: "700", color }}>{value}</Text>
      <Text style={{ fontSize: 11, color: "#6d5b4a", marginTop: 2 }}>{label}</Text>
    </View>
  )
}
