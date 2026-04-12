import { Tabs } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { Text, View } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
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

export default function TabsLayout() {
  const { user } = useAuth()
  const canAddSong = useHasPrivilege(user, "add_song")

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#eef7fd" },
        headerTintColor: "#143853",
        headerShadowVisible: false,
        headerTitleStyle: { fontSize: 18, fontWeight: "800" },
        sceneStyle: { backgroundColor: "#eef7fd" },
        tabBarStyle: {
          position: "absolute",
          left: 14,
          right: 14,
          bottom: 14,
          height: 68,
          borderRadius: 24,
          borderTopWidth: 0,
          backgroundColor: "#123550",
          paddingBottom: 8,
          paddingTop: 8,
          paddingHorizontal: 6,
          shadowColor: "#0a2740",
          shadowOffset: { width: 0, height: 16 },
          shadowOpacity: 0.28,
          shadowRadius: 24,
          elevation: 12,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#f4fbff",
        tabBarInactiveTintColor: "rgba(232,247,255,0.74)",
        headerBackground: () => <LinearGradient colors={["#f9fdff", "#e9f6fe"]} style={{ flex: 1 }} />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Hľadať",
          tabBarIcon: ({ focused }) => <TabIcon label="Hľadať" icon={focused ? "search" : "search-outline"} focused={focused} />,
          headerTitle: "Hľadať",
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Mapa",
          tabBarIcon: ({ focused }) => <TabIcon label="Mapa" icon={focused ? "map" : "map-outline"} focused={focused} />,
          headerTitle: "Mapa regiónov",
        }}
      />
      <Tabs.Screen
        name="songs/index"
        options={{
          title: "Piesne",
          tabBarIcon: ({ focused }) => <TabIcon label="Piesne" icon={focused ? "musical-notes" : "musical-notes-outline"} focused={focused} />,
          headerTitle: "Piesne",
        }}
      />
      <Tabs.Screen
        name="add-song"
        options={{
          href: canAddSong ? undefined : null,
          title: "Pridať",
          tabBarIcon: ({ focused }) => <TabIcon label="Pridať" icon={focused ? "add-circle" : "add-circle-outline"} focused={focused} />,
          headerTitle: "Pridať pieseň",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: user ? user.nick : "Profil",
          tabBarIcon: ({ focused }) => <TabIcon label="Profil" icon={focused ? "person" : "person-outline"} focused={focused} />,
          headerTitle: "Profil",
        }}
      />
    </Tabs>
  )
}
