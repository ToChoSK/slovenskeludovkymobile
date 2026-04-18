import { Ionicons } from "@expo/vector-icons"
import { router, usePathname } from "expo-router"
import { Pressable, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useHasPrivilege } from "@/lib/privileges"
import { useAuth } from "@/providers/AuthProvider"

function TabIcon({ label, icon, focused }: { label: string; icon: keyof typeof Ionicons.glyphMap; focused: boolean }) {
  return (
    <View
      style={{
        minWidth: 62,
        height: 42,
        paddingHorizontal: 12,
        borderRadius: 21,
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        backgroundColor: focused ? "rgba(245,252,255,0.16)" : "transparent",
      }}
    >
      <Ionicons name={icon} size={16} color={focused ? "#f4fbff" : "rgba(232,247,255,0.78)"} />
      <Text style={{ color: focused ? "#f4fbff" : "rgba(232,247,255,0.78)", fontSize: 10, fontWeight: "800" }}>{label}</Text>
    </View>
  )
}

type NavItem = {
  href: "/(tabs)" | "/(tabs)/map" | "/(tabs)/songs" | "/(tabs)/add-song" | "/(tabs)/profile"
  label: string
  active: boolean
  icon: keyof typeof Ionicons.glyphMap
  activeIcon: keyof typeof Ionicons.glyphMap
}

export function AppBottomNav() {
  const pathname = usePathname()
  const { user } = useAuth()
  const canAddSong = useHasPrivilege(user, "add_song")
  const insets = useSafeAreaInsets()
  const bottomOffset = Math.max(insets.bottom, 14)

  const items: NavItem[] = [
    {
      href: "/(tabs)",
      label: "Hľadať",
      active: pathname === "/" || pathname === "/index",
      icon: "search-outline",
      activeIcon: "search",
    },
    {
      href: "/(tabs)/map",
      label: "Mapa",
      active: pathname === "/map",
      icon: "map-outline",
      activeIcon: "map",
    },
    {
      href: "/(tabs)/songs",
      label: "Piesne",
      active: pathname === "/songs" || pathname.startsWith("/songs/"),
      icon: "musical-notes-outline",
      activeIcon: "musical-notes",
    },
    ...(canAddSong
      ? [
          {
            href: "/(tabs)/add-song" as const,
            label: "Pridať",
            active: pathname === "/add-song",
            icon: "add-circle-outline" as const,
            activeIcon: "add-circle" as const,
          },
        ]
      : []),
    {
      href: "/(tabs)/profile",
      label: "Profil",
      active: pathname === "/profile",
      icon: "person-outline",
      activeIcon: "person",
    },
  ]

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 14,
        right: 14,
        bottom: bottomOffset,
      }}
    >
      <View
        style={{
          height: 72,
          borderRadius: 24,
          backgroundColor: "#123550",
          paddingBottom: 8,
          paddingTop: 8,
          paddingHorizontal: 6,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-around",
          shadowColor: "#0a2740",
          shadowOffset: { width: 0, height: 16 },
          shadowOpacity: 0.28,
          shadowRadius: 24,
          elevation: 12,
        }}
      >
        {items.map((item) => (
          <Pressable key={item.href} onPress={() => router.replace(item.href)} style={{ paddingVertical: 4 }}>
            <TabIcon label={item.label} icon={item.active ? item.activeIcon : item.icon} focused={item.active} />
          </Pressable>
        ))}
      </View>
    </View>
  )
}
