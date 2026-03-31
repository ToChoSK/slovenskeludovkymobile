import { Tabs } from "expo-router"
import { Text, View } from "react-native"
import { useAppMode } from "@/providers/AppModeProvider"
import { useAuth } from "@/providers/AuthProvider"

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center", width: 32, height: 32 }}>
      <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.6 }}>{emoji}</Text>
    </View>
  )
}

export default function TabsLayout() {
  const { mode, setMode } = useAppMode()
  const { user } = useAuth()

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#fffaf2" },
        headerTintColor: "#23160d",
        tabBarStyle: {
          backgroundColor: "#fffaf2",
          borderTopColor: "#eadfcb",
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarActiveTintColor: "#b45309",
        tabBarInactiveTintColor: "#a08878",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        headerRight: () => (
          <View style={{ marginRight: 16 }}>
            <ModeToggle mode={mode} onToggle={() => void setMode(mode === "online" ? "offline" : "online")} />
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Domov",
          tabBarLabel: "Domov",
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
          headerTitle: "Slovenské ľudovky",
        }}
      />
      <Tabs.Screen
        name="songs/index"
        options={{
          title: "Piesne",
          tabBarLabel: "Piesne",
          tabBarIcon: ({ focused }) => <TabIcon emoji="🎵" focused={focused} />,
          headerTitle: "Piesne",
        }}
      />
      <Tabs.Screen
        name="albums"
        options={{
          title: "Albumy",
          tabBarLabel: "Albumy",
          tabBarIcon: ({ focused }) => <TabIcon emoji="📁" focused={focused} />,
          headerTitle: "Albumy",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: user ? user.nick : "Profil",
          tabBarLabel: "Profil",
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
          headerTitle: "Profil",
        }}
      />
    </Tabs>
  )
}

function ModeToggle({ mode, onToggle }: { mode: "online" | "offline"; onToggle: () => void }) {
  const isOnline = mode === "online"
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        backgroundColor: isOnline ? "#f0fdf4" : "#fffbeb",
        borderWidth: 1.5,
        borderColor: isOnline ? "#86efac" : "#fcd34d",
      }}
    >
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isOnline ? "#22c55e" : "#f59e0b" }} />
      <Text
        onPress={onToggle}
        style={{ fontSize: 12, fontWeight: "700", color: isOnline ? "#15803d" : "#92400e" }}
      >
        {isOnline ? "Online" : "Offline"}
      </Text>
    </View>
  )
}
