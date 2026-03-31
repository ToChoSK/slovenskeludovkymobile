import { Tabs } from "expo-router"
import { Text, View } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useHasPrivilege } from "@/lib/privileges"
import { useAuth } from "@/providers/AuthProvider"

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <View
      style={{
        width: 48,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: focused ? "rgba(245,252,255,0.2)" : "transparent",
      }}
    >
      <Text style={{ color: focused ? "#f4fbff" : "rgba(232,247,255,0.74)", fontSize: 11, fontWeight: "800", letterSpacing: 0.8 }}>
        {label}
      </Text>
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
          height: 82,
          borderRadius: 30,
          borderTopWidth: 0,
          backgroundColor: "#123550",
          paddingBottom: 12,
          paddingTop: 10,
          shadowColor: "#0a2740",
          shadowOffset: { width: 0, height: 16 },
          shadowOpacity: 0.28,
          shadowRadius: 24,
          elevation: 12,
        },
        tabBarActiveTintColor: "#f4fbff",
        tabBarInactiveTintColor: "rgba(232,247,255,0.74)",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "800", marginTop: 2 },
        headerBackground: () => <LinearGradient colors={["#f9fdff", "#e9f6fe"]} style={{ flex: 1 }} />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Hladat",
          tabBarLabel: "Hladat",
          tabBarIcon: ({ focused }) => <TabIcon label="FND" focused={focused} />,
          headerTitle: "Hladat",
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Mapa",
          tabBarLabel: "Mapa",
          tabBarIcon: ({ focused }) => <TabIcon label="MAP" focused={focused} />,
          headerTitle: "Mapa regionov",
        }}
      />
      <Tabs.Screen
        name="songs/index"
        options={{
          title: "Filtre",
          tabBarLabel: "Filtre",
          tabBarIcon: ({ focused }) => <TabIcon label="FLT" focused={focused} />,
          headerTitle: "Filtre",
        }}
      />
      <Tabs.Screen
        name="add-song"
        options={{
          href: canAddSong ? undefined : null,
          title: "Pridat",
          tabBarLabel: "Pridat",
          tabBarIcon: ({ focused }) => <TabIcon label="ADD" focused={focused} />,
          headerTitle: "Pridat piesen",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: user ? user.nick : "Profil",
          tabBarLabel: "Profil",
          tabBarIcon: ({ focused }) => <TabIcon label="USR" focused={focused} />,
          headerTitle: "Profil",
        }}
      />
    </Tabs>
  )
}
