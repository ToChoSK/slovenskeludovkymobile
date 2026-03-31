import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { AppModeProvider } from "@/providers/AppModeProvider"
import { AuthProvider } from "@/providers/AuthProvider"
import { SongsProvider } from "@/providers/SongsProvider"

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AppModeProvider>
        <AuthProvider>
          <SongsProvider>
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: "#fffaf2" },
                headerTintColor: "#23160d",
                contentStyle: { backgroundColor: "#f8f4ea" },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="songs/[id]" options={{ title: "Pieseň", headerBackTitle: "Späť" }} />
              <Stack.Screen name="songs/add" options={{ title: "Pridať pieseň", headerBackTitle: "Späť" }} />
              <Stack.Screen name="songs/[id]/edit" options={{ title: "Upraviť pieseň", headerBackTitle: "Späť" }} />
              <Stack.Screen name="login" options={{ title: "Prihlásenie", headerBackTitle: "Späť" }} />
              <Stack.Screen name="register" options={{ title: "Registrácia", headerBackTitle: "Späť" }} />
              <Stack.Screen name="export" options={{ title: "Export", headerBackTitle: "Späť" }} />
              <Stack.Screen name="admin/users" options={{ title: "Správa používateľov", headerBackTitle: "Späť" }} />
              <Stack.Screen name="admin/role-privileges" options={{ title: "Oprávnenia rolí", headerBackTitle: "Späť" }} />
              <Stack.Screen name="index" options={{ headerShown: false }} />
            </Stack>
          </SongsProvider>
        </AuthProvider>
      </AppModeProvider>
    </SafeAreaProvider>
  )
}
