import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { AuthProvider } from "@/providers/AuthProvider"
import { SongsProvider } from "@/providers/SongsProvider"

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <SongsProvider>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: "#f2faff" },
              headerTintColor: "#143853",
              contentStyle: { backgroundColor: "#eef7fd" },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="songs/[id]" options={{ title: "Piesen", headerBackTitle: "Spat" }} />
            <Stack.Screen name="songs/add" options={{ title: "Pridat piesen", headerBackTitle: "Spat" }} />
            <Stack.Screen name="songs/[id]/edit" options={{ title: "Upravit piesen", headerBackTitle: "Spat" }} />
            <Stack.Screen name="login" options={{ title: "Prihlasenie", headerBackTitle: "Spat" }} />
            <Stack.Screen name="register" options={{ title: "Registracia", headerBackTitle: "Spat" }} />
            <Stack.Screen name="index" options={{ headerShown: false }} />
          </Stack>
        </SongsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  )
}
