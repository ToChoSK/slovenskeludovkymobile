import * as Haptics from "expo-haptics"
import type { PropsWithChildren, ReactNode } from "react"
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native"

export function Screen({ children, onRefresh, refreshing }: PropsWithChildren<{ onRefresh?: () => void; refreshing?: boolean }>) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing ?? false} onRefresh={onRefresh} tintColor="#b45309" /> : undefined}
    >
      {children}
    </ScrollView>
  )
}

export function Card({ children, style }: PropsWithChildren<{ style?: object }>) {
  return <View style={[styles.card, style]}>{children}</View>
}

export function Heading({ children, size = "h1" }: PropsWithChildren<{ size?: "h1" | "h2" | "h3" }>) {
  return (
    <Text style={size === "h1" ? styles.headingH1 : size === "h2" ? styles.headingH2 : styles.headingH3}>
      {children}
    </Text>
  )
}

export function Subtle({ children }: PropsWithChildren) {
  return <Text style={styles.subtle}>{children}</Text>
}

export function Button({
  label,
  onPress,
  disabled,
  loading,
  tone = "primary",
  icon,
}: {
  label: string
  onPress?: () => void
  disabled?: boolean
  loading?: boolean
  tone?: "primary" | "secondary" | "danger"
  icon?: ReactNode
}) {
  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress?.()
  }
  const isDisabled = disabled || loading
  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        tone === "secondary" && styles.buttonSecondary,
        tone === "danger" && styles.buttonDanger,
        isDisabled && styles.buttonDisabled,
        pressed && !isDisabled && styles.buttonPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={tone === "secondary" ? "#b45309" : "#fff"} />
      ) : (
        <View style={styles.buttonContent}>
          {icon}
          <Text style={[styles.buttonLabel, tone === "secondary" && styles.buttonLabelSecondary]}>{label}</Text>
        </View>
      )}
    </Pressable>
  )
}

export function Field({
  value,
  onChangeText,
  placeholder,
  multiline,
  secureTextEntry,
  label,
}: {
  value: string
  onChangeText: (value: string) => void
  placeholder?: string
  multiline?: boolean
  secureTextEntry?: boolean
  label?: string
}) {
  return (
    <View style={styles.fieldWrapper}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#b8a89a"
        multiline={multiline}
        secureTextEntry={secureTextEntry}
        style={[styles.input, multiline && styles.textarea]}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  )
}

export function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.rowBetween}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text style={styles.kvValue}>{value}</Text>
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
      <Text style={styles.kvLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#d8ccb9", true: "#b45309" }}
        thumbColor="#fff"
      />
    </View>
  )
}

export function Badge({ label, color }: { label: string; color?: string }) {
  const bg = color ? `${color}22` : "#f0e6d3"
  const fg = color ?? "#b45309"
  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: `${fg}44` }]}>
      <Text style={[styles.badgeLabel, { color: fg }]}>{label}</Text>
    </View>
  )
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptyStateSubtitle}>{subtitle}</Text> : null}
    </View>
  )
}

export function Loading({ label }: { label?: string }) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#b45309" />
      {label ? <Text style={styles.loadingLabel}>{label}</Text> : null}
    </View>
  )
}

export function ModePill({ mode, onPress }: { mode: "online" | "offline"; onPress?: () => void }) {
  const isOnline = mode === "online"
  return (
    <Pressable onPress={onPress} style={[styles.modePill, isOnline ? styles.modePillOnline : styles.modePillOffline]}>
      <View style={[styles.modeDot, { backgroundColor: isOnline ? "#22c55e" : "#f59e0b" }]} />
      <Text style={[styles.modePillText, { color: isOnline ? "#15803d" : "#92400e" }]}>
        {isOnline ? "Online" : "Offline"}
      </Text>
    </Pressable>
  )
}

export function SongCard({
  title,
  region,
  obec,
  favoriteCount,
  viewCount,
  onPress,
}: {
  title: string
  region?: string | null
  obec?: string | null
  favoriteCount?: number
  viewCount?: number
  onPress?: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.songCard, pressed && { opacity: 0.85 }]}
    >
      <View style={styles.songCardBody}>
        <Text style={styles.songTitle} numberOfLines={2}>{title}</Text>
        <Text style={styles.songMeta}>{[region, obec].filter(Boolean).join(" · ") || "Bez regiónu"}</Text>
        <View style={styles.songStatsRow}>
          {typeof favoriteCount === "number" && (
            <Text style={styles.songStat}>♥ {favoriteCount}</Text>
          )}
          {typeof viewCount === "number" && (
            <Text style={styles.songStat}>👁 {viewCount}</Text>
          )}
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8f4ea" },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  card: {
    backgroundColor: "#fffaf2",
    borderRadius: 20,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: "#eadfcb",
    shadowColor: "#c8a96e",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 2,
  },
  headingH1: { fontSize: 26, fontWeight: "700", color: "#23160d", letterSpacing: -0.5 },
  headingH2: { fontSize: 20, fontWeight: "700", color: "#23160d" },
  headingH3: { fontSize: 17, fontWeight: "600", color: "#3d2910" },
  subtle: { color: "#6d5b4a", fontSize: 14, lineHeight: 21 },
  button: {
    backgroundColor: "#b45309",
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    shadowColor: "#b45309",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonSecondary: {
    backgroundColor: "#f0e6d3",
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 1,
    borderColor: "#d8ccb9",
  },
  buttonDanger: { backgroundColor: "#b91c1c", shadowColor: "#b91c1c" },
  buttonDisabled: { opacity: 0.45 },
  buttonPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  buttonLabel: { color: "#fff", fontWeight: "700", fontSize: 15 },
  buttonLabelSecondary: { color: "#7c3a12" },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#6d5b4a", marginBottom: 2 },
  input: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#d8ccb9",
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#23160d",
  },
  textarea: { minHeight: 120 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 16 },
  kvLabel: { color: "#6d5b4a", fontWeight: "500", flex: 1, fontSize: 14 },
  kvValue: { color: "#23160d", fontWeight: "600", flexShrink: 1, textAlign: "right", fontSize: 14 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  badgeLabel: { fontSize: 12, fontWeight: "600" },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyStateTitle: { fontSize: 17, fontWeight: "600", color: "#6d5b4a" },
  emptyStateSubtitle: { fontSize: 14, color: "#a08878", textAlign: "center" },
  loadingContainer: { alignItems: "center", paddingVertical: 40, gap: 12 },
  loadingLabel: { fontSize: 14, color: "#6d5b4a" },
  modePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  modePillOnline: { backgroundColor: "#f0fdf4", borderColor: "#86efac" },
  modePillOffline: { backgroundColor: "#fffbeb", borderColor: "#fcd34d" },
  modeDot: { width: 8, height: 8, borderRadius: 4 },
  modePillText: { fontSize: 12, fontWeight: "700" },
  songCard: {
    backgroundColor: "#fffdf8",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#eadfcb",
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#c8a96e",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  songCardBody: { flex: 1, gap: 4 },
  songStatsRow: { flexDirection: "row", gap: 12, marginTop: 2 },
  songTitle: { fontSize: 16, fontWeight: "700", color: "#23160d" },
  songMeta: { fontSize: 13, color: "#6d5b4a" },
  songStat: { fontSize: 12, color: "#a08878" },
  buttonContent: { flexDirection: "row", alignItems: "center", gap: 6 },
  fieldWrapper: { gap: 4 },
})
