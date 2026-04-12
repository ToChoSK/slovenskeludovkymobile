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
            <Stack.Screen name="songs/[id]" options={{ title: "Pieseň", headerBackTitle: "Späť" }} />
            <Stack.Screen name="songs/add" options={{ title: "Pridať pieseň", headerBackTitle: "Späť" }} />
            <Stack.Screen name="songs/[id]/edit" options={{ title: "Upraviť pieseň", headerBackTitle: "Späť" }} />
            <Stack.Screen name="login" options={{ title: "Prihlásenie", headerBackTitle: "Späť" }} />
            <Stack.Screen name="register" options={{ title: "Registrácia", headerBackTitle: "Späť" }} />
            <Stack.Screen name="index" options={{ headerShown: false }} />
          </Stack>
        </SongsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  )
}
