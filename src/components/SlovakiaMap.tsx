import { useMemo, useState } from "react"
import { ScrollView, Text, TouchableOpacity, View } from "react-native"
import Svg, { Path, Text as SvgText } from "react-native-svg"
import { REGION_META, MAP_REGION_KEYS, EXTRA_REGION_KEYS, type RegionKey } from "@/lib/regions"
import { REGION_PATHS, SLOVAKIA_MAP_VIEWBOX } from "@/lib/region-paths"
import type { MetadataAllSongsDoc } from "@/types"

type Props = {
  metadata: MetadataAllSongsDoc | null
  selectedRegion: string | "all"
  onSelectRegion: (region: string | "all") => void
}

function useRegionCounts(metadata: MetadataAllSongsDoc | null): Record<string, number> {
  return useMemo(() => {
    if (!metadata) return {}
    const counts: Record<string, number> = {}
    for (const row of metadata.rows) {
      if (row.r) {
        counts[row.r] = (counts[row.r] ?? 0) + 1
      }
    }
    return counts
  }, [metadata])
}

export function SlovakiaMap({ metadata, selectedRegion, onSelectRegion }: Props) {
  const [mapWidth, setMapWidth] = useState(320)
  const regionCounts = useRegionCounts(metadata)

  const mapHeight = useMemo(() => Math.round((mapWidth * 380) / 900), [mapWidth])

  return (
    <View>
      <View
        onLayout={(e) => setMapWidth(e.nativeEvent.layout.width)}
        style={{ width: "100%", aspectRatio: 900 / 380, borderRadius: 16, overflow: "hidden", backgroundColor: "#e8f4fd" }}
      >
        <Svg
          width={mapWidth}
          height={mapHeight}
          viewBox={SLOVAKIA_MAP_VIEWBOX}
        >
          {MAP_REGION_KEYS.map((key) => {
            const pathData = REGION_PATHS[key]
            if (!pathData) return null
            const meta = REGION_META[key as RegionKey]
            const isSelected = selectedRegion === key
            const baseColor = meta?.color ?? "#ccc"

            return (
              <Path
                key={key}
                d={pathData.d}
                fill={isSelected ? baseColor : `${baseColor}88`}
                stroke={isSelected ? baseColor : "#fff"}
                strokeWidth={isSelected ? 2.5 : 1.5}
                onPress={() => {
                  onSelectRegion(selectedRegion === key ? "all" : key)
                }}
              />
            )
          })}
          {MAP_REGION_KEYS.map((key) => {
            const pathData = REGION_PATHS[key]
            if (!pathData) return null
            const meta = REGION_META[key as RegionKey]
            if (!meta) return null
            return (
              <SvgText
                key={`label-${key}`}
                x={pathData.labelX}
                y={pathData.labelY}
                fontSize={10}
                fill="#fff"
                fontWeight="bold"
                textAnchor="middle"
              >
                {meta.label}
              </SvgText>
            )
          })}
        </Svg>
      </View>

      {/* Extra region chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}>
        <RegionChip
          label="Všetky"
          color="#7c3aed"
          selected={selectedRegion === "all"}
          onPress={() => onSelectRegion("all")}
        />
        {EXTRA_REGION_KEYS.map((key) => {
          const meta = REGION_META[key as RegionKey]
          return (
            <RegionChip
              key={key}
              label={meta.label}
              color={meta.color}
              selected={selectedRegion === key}
              onPress={() => onSelectRegion(selectedRegion === key ? "all" : key)}
            />
          )
        })}
      </ScrollView>

      {/* Selected region label */}
      {selectedRegion !== "all" && (
        <View style={{ marginTop: 10, flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: REGION_META[selectedRegion as RegionKey]?.color ?? "#999" }} />
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#23160d" }}>
            {REGION_META[selectedRegion as RegionKey]?.label ?? selectedRegion}
          </Text>
          {regionCounts[selectedRegion] !== undefined && (
            <Text style={{ fontSize: 13, color: "#6d5b4a" }}>
              — {regionCounts[selectedRegion]} piesní
            </Text>
          )}
          <TouchableOpacity onPress={() => onSelectRegion("all")} style={{ marginLeft: "auto" }}>
            <Text style={{ color: "#b45309", fontSize: 13, fontWeight: "600" }}>Zrušiť filter ×</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

function RegionChip({ label, color, selected, onPress }: { label: string; color: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: selected ? color : `${color}22`,
        borderWidth: 1.5,
        borderColor: selected ? color : `${color}66`,
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: "600", color: selected ? "#fff" : color }}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}
