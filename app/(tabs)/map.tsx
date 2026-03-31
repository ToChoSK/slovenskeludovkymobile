import { router } from "expo-router"
import { useState } from "react"
import { Text, View } from "react-native"
import { Card, HeroCard, Screen, Subtle } from "@/components/ui"
import { SlovakiaMap } from "@/components/SlovakiaMap"
import { REGION_META, type RegionKey } from "@/lib/regions"
import { useSongs } from "@/providers/SongsProvider"

export default function MapScreen() {
  const { metadata } = useSongs()
  const [selectedRegion, setSelectedRegion] = useState<RegionKey>("slovensko")
  const selectedRegionMeta = REGION_META[selectedRegion]

  return (
    <Screen>
      <HeroCard>
        <Text style={{ fontSize: 30, lineHeight: 34, color: "#f4fbff", fontWeight: "900" }}>Mapa regionov</Text>
        <Text style={{ fontSize: 15, lineHeight: 22, color: "rgba(235,248,255,0.82)" }}>
          Vyber si region priamo z mapy. Dalsim klepnutim na rovnaky region sa vyber zrusi.
        </Text>
      </HeroCard>

      <Card>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, fontWeight: "800", color: "#2b7fb9", letterSpacing: 1.1, textTransform: "uppercase" }}>Interaktivna mapa</Text>
          <Subtle>Klik na mapu len prepina vybrany region. Filtrovanie sa nespusta automaticky.</Subtle>
        </View>
        <SlovakiaMap
          metadata={metadata}
          selectedRegion={selectedRegion === "slovensko" ? "all" : selectedRegion}
          onSelectRegion={(region) => {
            setSelectedRegion(region === "all" ? "slovensko" : (region as RegionKey))
          }}
          onOpenRegionSongs={(region) => {
            if (region === "all") {
              router.push("/(tabs)/songs")
              return
            }
            router.push({ pathname: "/(tabs)/songs", params: { region } })
          }}
        />
      </Card>

      <Card>
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: "800", color: "#2b7fb9", letterSpacing: 1.1, textTransform: "uppercase" }}>Vybrany region</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={{
                width: 14,
                height: 14,
                borderRadius: 999,
                backgroundColor: selectedRegionMeta.color,
              }}
            />
            <Text style={{ fontSize: 24, lineHeight: 28, fontWeight: "900", color: "#13324a" }}>{selectedRegionMeta.label}</Text>
          </View>
          <Subtle>
            {selectedRegion === "slovensko"
              ? "Momentalne nie je vybraty konkretny region."
              : "Opatovne klepni na vybrany region, ak ho chces zrusit."}
          </Subtle>
        </View>
      </Card>
    </Screen>
  )
}
