import { useState } from "react"
import { router } from "expo-router"
import { Button, Card, Field, Heading, Screen, Subtle } from "@/components/ui"
import { useAuth } from "@/providers/AuthProvider"

export default function LoginScreen() {
  const { signIn, authWarning } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  return (
    <Screen>
      <Card>
        <Heading>Prihlásenie</Heading>
        <Field value={email} onChangeText={setEmail} placeholder="Email" />
        <Field value={password} onChangeText={setPassword} placeholder="Heslo" secureTextEntry />
        {!!error && <Subtle>{error}</Subtle>}
        {!!authWarning && <Subtle>{authWarning}</Subtle>}
        <Button
          label="Prihlásiť sa"
          onPress={() =>
            void signIn(email, password)
              .then(() => router.replace("/"))
              .catch((reason: any) => setError(reason?.message ?? "Prihlásenie zlyhalo."))
          }
        />
      </Card>
    </Screen>
  )
}
