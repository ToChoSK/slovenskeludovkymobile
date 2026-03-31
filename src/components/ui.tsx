import type { PropsWithChildren } from "react"
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native"

export function Screen({ children }: PropsWithChildren) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {children}
    </ScrollView>
  )
}

export function Card({ children }: PropsWithChildren) {
  return <View style={styles.card}>{children}</View>
}

export function Heading({ children }: PropsWithChildren) {
  return <Text style={styles.heading}>{children}</Text>
}

export function Subtle({ children }: PropsWithChildren) {
  return <Text style={styles.subtle}>{children}</Text>
}

export function Button({
  label,
  onPress,
  disabled,
  tone = "primary",
}: {
  label: string
  onPress?: () => void
  disabled?: boolean
  tone?: "primary" | "secondary" | "danger"
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        tone === "secondary" && styles.buttonSecondary,
        tone === "danger" && styles.buttonDanger,
        disabled && styles.buttonDisabled,
      ]}
    >
      <Text style={styles.buttonLabel}>{label}</Text>
    </Pressable>
  )
}

export function Field({
  value,
  onChangeText,
  placeholder,
  multiline,
  secureTextEntry,
}: {
  value: string
  onChangeText: (value: string) => void
  placeholder?: string
  multiline?: boolean
  secureTextEntry?: boolean
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      multiline={multiline}
      secureTextEntry={secureTextEntry}
      style={[styles.input, multiline && styles.textarea]}
      textAlignVertical={multiline ? "top" : "center"}
    />
  )
}

export function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.rowBetween}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  )
}

export function InlineSwitch({
  label,
  value,
  onValueChange,
}: {
  label: string
  value: boolean
  onValueChange: (value: boolean) => void
}) {
  return (
    <View style={styles.rowBetween}>
      <Text style={styles.label}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8f4ea" },
  content: { padding: 16, gap: 16 },
  card: { backgroundColor: "#fffaf2", borderRadius: 20, padding: 16, gap: 12, borderWidth: 1, borderColor: "#eadfcb" },
  heading: { fontSize: 26, fontWeight: "700", color: "#23160d" },
  subtle: { color: "#6d5b4a", fontSize: 14, lineHeight: 20 },
  button: { backgroundColor: "#b45309", paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, alignItems: "center" },
  buttonSecondary: { backgroundColor: "#efe2c6" },
  buttonDanger: { backgroundColor: "#b91c1c" },
  buttonDisabled: { opacity: 0.5 },
  buttonLabel: { color: "#fff", fontWeight: "600" },
  input: { borderRadius: 14, borderWidth: 1, borderColor: "#d8ccb9", backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 10 },
  textarea: { minHeight: 120 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 16 },
  label: { color: "#6d5b4a", fontWeight: "500", flex: 1 },
  value: { color: "#23160d", fontWeight: "600", flexShrink: 1, textAlign: "right" },
})
