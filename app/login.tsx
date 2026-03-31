import { useState } from "react"
import { router } from "expo-router"
import { Button, Card, Field, Heading, Screen, Subtle } from "@/components/ui"
import { useAppMode } from "@/providers/AppModeProvider"
import { useAuth } from "@/providers/AuthProvider"

export default function LoginScreen() {
  const { mode } = useAppMode()
  const { signIn, authWarning } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  if (mode !== "online") {
    return (
      <Screen>
        <Card>
          <Heading>Prihlasenie je dostupne len online</Heading>
        </Card>
      </Screen>
    )
  }

  return (
    <Screen>
      <Card>
        <Heading>Prihlasenie</Heading>
        <Field value={email} onChangeText={setEmail} placeholder="Email" />
        <Field value={password} onChangeText={setPassword} placeholder="Heslo" secureTextEntry />
        {!!error && <Subtle>{error}</Subtle>}
        {!!authWarning && <Subtle>{authWarning}</Subtle>}
        <Button
          label="Prihlasit"
          onPress={() =>
            void signIn(email, password)
              .then(() => router.replace("/"))
              .catch((reason: any) => setError(reason?.message ?? "Prihlasenie zlyhalo."))
          }
        />
      </Card>
    </Screen>
  )
}
