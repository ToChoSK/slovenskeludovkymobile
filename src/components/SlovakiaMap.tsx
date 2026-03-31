import { useMemo } from "react"
import { ScrollView, Text, TouchableOpacity, View } from "react-native"
import Svg, { G, Path } from "react-native-svg"
import { Button } from "@/components/ui"
import { REGION_SVG_XML } from "@/lib/region-svg-xml"
import { EXTRA_REGION_KEYS, MAP_REGION_KEYS, REGION_META, resolveRegionKey, type RegionKey } from "@/lib/regions"
import type { MetadataAllSongsDoc } from "@/types"

type Props = {
  metadata: MetadataAllSongsDoc | null
  selectedRegion: string | "all"
  onSelectRegion: (region: string | "all") => void
  onOpenRegionSongs?: (region: string | "all") => void
}

type RegionShape = {
  transform?: string
  paths: string[]
}

const MAP_VIEWBOX_WIDTH = 193.70563
const MAP_VIEWBOX_HEIGHT = 96.92424
const ASSET_REGION_KEYS = MAP_REGION_KEYS.filter((key) => key in REGION_SVG_XML)

function useRegionCounts(metadata: MetadataAllSongsDoc | null): Record<string, number> {
  return useMemo(() => {
    if (!metadata) return {}
    const counts: Record<string, number> = {}
    for (const row of metadata.rows) {
      const regionKey = resolveRegionKey(row.r)
      if (!regionKey) continue
      counts[regionKey] = (counts[regionKey] ?? 0) + 1
    }
    return counts
  }, [metadata])
}

function parseRegionShape(xml: string): RegionShape {
  const normalized = xml.replace(/\r/g, "")
  const groupMatch = normalized.match(/<g\b([^>]*)>([\s\S]*?)<\/g>/)
  const groupAttrs = groupMatch?.[1] ?? ""
  const groupContent = groupMatch?.[2] ?? ""
  const transformMatch = groupAttrs.match(/transform="([^"]+)"/)
  const pathMatches = Array.from(groupContent.matchAll(/<path\b[^>]*\sd="([^"]+)"/g))

  return {
    transform: transformMatch?.[1],
    paths: pathMatches.map((match) => match[1]),
  }
}

const REGION_SHAPES = Object.fromEntries(
  ASSET_REGION_KEYS.map((key) => [key, parseRegionShape(REGION_SVG_XML[key])]),
) as Record<(typeof ASSET_REGION_KEYS)[number], RegionShape>

export function SlovakiaMap({ metadata, selectedRegion, onSelectRegion, onOpenRegionSongs }: Props) {
  const regionCounts = useRegionCounts(metadata)
  const hasSelectedRegion = selectedRegion !== "all"
  const selectedLabel = selectedRegion === "all" ? "Slovensko" : (REGION_META[selectedRegion as RegionKey]?.label ?? selectedRegion)

  return (
    <View style={{ gap: 14 }}>
      <View
        style={{
          borderRadius: 26,
          backgroundColor: "#eef8ff",
          borderWidth: 1,
          borderColor: "#d5e9f7",
          padding: 14,
          gap: 12,
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: "700", letterSpacing: 1.2, color: "#2c84bf", textTransform: "uppercase" }}>
          Mapa Slovenska
        </Text>

        <View
          style={{
            borderRadius: 22,
            overflow: "hidden",
            backgroundColor: "#fbfeff",
            borderWidth: 1,
            borderColor: "#d5e9f7",
            paddingHorizontal: 8,
            paddingVertical: 12,
            height: 220,
          }}
        >
          <Svg viewBox={`0 0 ${MAP_VIEWBOX_WIDTH} ${MAP_VIEWBOX_HEIGHT}`} width="100%" height="100%">
            {ASSET_REGION_KEYS.map((key) => {
              const meta = REGION_META[key]
              const selected = selectedRegion === key
              const dimmed = hasSelectedRegion && !selected
              const shape = REGION_SHAPES[key]

              return (
                <G key={`visual-${key}`} transform={shape.transform}>
                  {shape.paths.map((d, index) => (
                    <Path
                      key={`${key}-visual-${index}`}
                      d={d}
                      fill={meta.color}
                      fillOpacity={selected ? 0.95 : dimmed ? 0.22 : 0.56}
                      stroke={selected ? "#163854" : "#fbfeff"}
                      strokeWidth={selected ? 1.85 : 1.05}
                    />
                  ))}
                </G>
              )
            })}

            {ASSET_REGION_KEYS.map((key) => {
              const selected = selectedRegion === key
              const shape = REGION_SHAPES[key]

              return (
                <G key={`touch-${key}`} transform={shape.transform}>
                  {shape.paths.map((d, index) => (
                    <Path
                      key={`${key}-touch-${index}`}
                      d={d}
                      fill="#000000"
                      fillOpacity={0.015}
                      stroke="#000000"
                      strokeOpacity={0.01}
                      strokeWidth={8}
                      onPress={() => onSelectRegion(selected ? "all" : key)}
                    />
                  ))}
                </G>
              )
            })}
          </Svg>
        </View>

        <Text style={{ fontSize: 13, color: "#63819a" }}>Klepni priamo na region v mape alebo pouzi rychly vyber nizsie.</Text>

        <Button
          label={selectedRegion === "all" ? "Zobrazit vsetky piesne" : `Zobrazit piesne: ${selectedLabel}`}
          onPress={() => onOpenRegionSongs?.(selectedRegion)}
          disabled={!onOpenRegionSongs}
        />

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {ASSET_REGION_KEYS.map((key) => {
            const meta = REGION_META[key]
            const selected = selectedRegion === key
            return (
              <TouchableOpacity
                key={key}
                onPress={() => onSelectRegion(selected ? "all" : key)}
                style={{
                  minWidth: "31%",
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 18,
                  backgroundColor: selected ? `${meta.color}20` : "#fbfeff",
                  borderWidth: 1,
                  borderColor: selected ? meta.color : "#d8eaf6",
                  gap: 4,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: meta.color,
                    }}
                  />
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#153550", flexShrink: 1 }}>{meta.label}</Text>
                </View>
                <Text style={{ fontSize: 12, color: "#63819a" }}>{regionCounts[key] ?? 0} piesni</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}>
        <RegionChip label="Slovensko" color="#7c3aed" selected={selectedRegion === "all"} onPress={() => onSelectRegion("all")} />
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

      {selectedRegion !== "all" && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            borderRadius: 18,
            backgroundColor: "#eff8fe",
            borderWidth: 1,
            borderColor: "#d4e8f6",
            paddingHorizontal: 14,
            paddingVertical: 12,
          }}
        >
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: REGION_META[selectedRegion as RegionKey]?.color ?? "#999",
            }}
          />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#153550" }}>
              {REGION_META[selectedRegion as RegionKey]?.label ?? selectedRegion}
            </Text>
            <Text style={{ fontSize: 12, color: "#63819a" }}>{regionCounts[selectedRegion] ?? 0} piesni v aktualnom indexe</Text>
          </View>
          <TouchableOpacity onPress={() => onSelectRegion("all")}>
            <Text style={{ color: "#2a86c3", fontSize: 13, fontWeight: "700" }}>Zrusit</Text>
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
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: selected ? color : `${color}15`,
        borderWidth: 1,
        borderColor: selected ? color : `${color}50`,
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: "700", color: selected ? "#fff" : color }}>{label}</Text>
    </TouchableOpacity>
  )
}
