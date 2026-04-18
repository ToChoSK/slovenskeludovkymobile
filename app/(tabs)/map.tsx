import { router } from "expo-router"
import { useRef, useState } from "react"
import { ScrollView, Text, View } from "react-native"
import { Card, HeroCard, Screen, Subtle } from "@/components/ui"
import { SlovakiaMap } from "@/components/SlovakiaMap"
import { REGION_META, type RegionKey } from "@/lib/regions"
import { useSongs } from "@/providers/SongsProvider"

export default function MapScreen() {
  const { metadata } = useSongs()
  const [selectedRegion, setSelectedRegion] = useState<RegionKey>("slovensko")
  const selectedRegionMeta = REGION_META[selectedRegion]
  const scrollRef = useRef<ScrollView>(null)

  function handleSelectRegion(region: string | "all") {
    scrollRef.current?.scrollTo({ x: 0, y: 0, animated: true })
    setSelectedRegion(region === "all" ? "slovensko" : (region as RegionKey))
  }

  return (
    <Screen scrollRef={scrollRef}>
      <HeroCard>
        <Text style={{ fontSize: 30, lineHeight: 34, color: "#f4fbff", fontWeight: "900" }}>Mapa regiónov</Text>
        <Text style={{ fontSize: 15, lineHeight: 22, color: "rgba(235,248,255,0.82)" }}>
          Vyber si región a otvor si zoznam piesní z danej oblasti.
        </Text>
      </HeroCard>

      <Card>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, fontWeight: "800", color: "#2b7fb9", letterSpacing: 1.1, textTransform: "uppercase" }}>Interaktívna mapa</Text>
          <Subtle>Klepni na výber regiónu nižšie a potom na zobraziť všetky piesne.</Subtle>
        </View>
        <SlovakiaMap
          metadata={metadata}
          selectedRegion={selectedRegion === "slovensko" ? "all" : selectedRegion}
          onSelectRegion={handleSelectRegion}
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
          <Text style={{ fontSize: 12, fontWeight: "800", color: "#2b7fb9", letterSpacing: 1.1, textTransform: "uppercase" }}>Vybraný región</Text>
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
              ? "Momentálne nie je vybraný konkrétny región."
              : "Opätovne klepni na vybraný región, ak ho chceš zrušiť."}
          </Subtle>
        </View>
      </Card>
    </Screen>
  )
}
