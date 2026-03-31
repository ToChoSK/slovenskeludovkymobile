import { useState } from "react"
import { router } from "expo-router"
import { Button, Card, Field, Heading, Screen, Subtle } from "@/components/ui"
import { useAuth } from "@/providers/AuthProvider"

export default function RegisterScreen() {
  const { signUp, authWarning } = useAuth()
  const [nick, setNick] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  return (
    <Screen>
      <Card>
        <Heading>Registracia</Heading>
        <Field value={nick} onChangeText={setNick} placeholder="Prezivka" />
        <Field value={email} onChangeText={setEmail} placeholder="Email" />
        <Field value={password} onChangeText={setPassword} placeholder="Heslo" secureTextEntry />
        {!!error && <Subtle>{error}</Subtle>}
        {!!authWarning && <Subtle>{authWarning}</Subtle>}
        <Button
          label="Vytvorit ucet"
          onPress={() =>
            void signUp(email, password, nick)
              .then(() => router.replace("/"))
              .catch((reason: any) => setError(reason?.message ?? "Registracia zlyhala."))
          }
        />
      </Card>
    </Screen>
  )
}
