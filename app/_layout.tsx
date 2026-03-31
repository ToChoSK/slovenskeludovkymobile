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
            />
          </SongsProvider>
        </AuthProvider>
      </AppModeProvider>
    </SafeAreaProvider>
  )
}
