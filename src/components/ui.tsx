import * as Haptics from "expo-haptics"
import { LinearGradient } from "expo-linear-gradient"
import type { PropsWithChildren, ReactNode, RefObject } from "react"
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native"

export function Screen({
  children,
  onRefresh,
  refreshing,
  scrollRef,
}: PropsWithChildren<{ onRefresh?: () => void; refreshing?: boolean; scrollRef?: RefObject<ScrollView | null> }>) {
  return (
    <ScrollView
      ref={scrollRef}
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing ?? false} onRefresh={onRefresh} tintColor="#3b9ed8" /> : undefined}
    >
      {children}
    </ScrollView>
  )
}

export function Card({ children, style }: PropsWithChildren<{ style?: object }>) {
  return <View style={[styles.card, style]}>{children}</View>
}

export function HeroCard({ children }: PropsWithChildren) {
  return (
    <LinearGradient colors={["#0f2742", "#184f74", "#6cc8f3"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
      {children}
    </LinearGradient>
  )
}

export function Heading({ children, size = "h1" }: PropsWithChildren<{ size?: "h1" | "h2" | "h3" }>) {
  return <Text style={size === "h1" ? styles.headingH1 : size === "h2" ? styles.headingH2 : styles.headingH3}>{children}</Text>
}

export function Subtle({ children, style }: PropsWithChildren<{ style?: object }>) {
  return <Text style={[styles.subtle, style]}>{children}</Text>
}

export function ProgressBar({ progress, label }: { progress: number; label?: string }) {
  return (
    <View style={styles.progressWrap}>
      {label ? <Text style={styles.progressLabel}>{label}</Text> : null}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.max(4, Math.min(progress * 100, 100))}%` }]} />
      </View>
    </View>
  )
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
        <ActivityIndicator size="small" color={tone === "secondary" ? "#17354d" : "#f7fdff"} />
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
        placeholderTextColor="#7f9ab0"
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

export function Badge({ label, color }: { label: string; color?: string }) {
  return (
    <View style={[styles.badge, color ? { backgroundColor: `${color}1f`, borderColor: `${color}40` } : null]}>
      <Text style={[styles.badgeLabel, color ? { color } : null]}>{label}</Text>
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
      <ActivityIndicator size="large" color="#3b9ed8" />
      {label ? <Text style={styles.loadingLabel}>{label}</Text> : null}
    </View>
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
    <Pressable onPress={onPress} style={({ pressed }) => [styles.songCard, pressed && { opacity: 0.9, transform: [{ scale: 0.995 }] }]}>
      <View style={styles.songCardBody}>
        <Text style={styles.songTitle} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.songMeta}>{[region, obec].filter(Boolean).join(" · ") || "Bez regiónu"}</Text>
        <View style={styles.songStatsRow}>
          {typeof favoriteCount === "number" && <Text style={styles.songStat}>Obľúbené {favoriteCount}</Text>}
          {typeof viewCount === "number" && <Text style={styles.songStat}>Zobrazenia {viewCount}</Text>}
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#eef7fd" },
  content: { padding: 16, gap: 16, paddingBottom: 120 },
  card: {
    backgroundColor: "#fafdff",
    borderRadius: 28,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: "#d8eaf6",
    shadowColor: "#2d5874",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.09,
    shadowRadius: 26,
    elevation: 4,
  },
  heroCard: {
    borderRadius: 32,
    padding: 22,
    gap: 16,
    shadowColor: "#0f1720",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.22,
    shadowRadius: 30,
    elevation: 8,
  },
  headingH1: { fontSize: 28, fontWeight: "900", color: "#13324a", letterSpacing: -0.8 },
  headingH2: { fontSize: 21, fontWeight: "800", color: "#13324a" },
  headingH3: { fontSize: 16, fontWeight: "800", color: "#13324a" },
  subtle: { color: "#5d7a92", fontSize: 14, lineHeight: 21 },
  progressWrap: { gap: 8 },
  progressLabel: { fontSize: 12, color: "#5e7e97", fontWeight: "700" },
  progressTrack: { height: 10, borderRadius: 999, backgroundColor: "#d9ecf8", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 999, backgroundColor: "#3b9ed8" },
  button: {
    backgroundColor: "#2e89c7",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  buttonSecondary: {
    backgroundColor: "#edf7fd",
    borderWidth: 1,
    borderColor: "#cfe5f3",
  },
  buttonDanger: { backgroundColor: "#b42318" },
  buttonDisabled: { opacity: 0.45 },
  buttonPressed: { opacity: 0.88 },
  buttonLabel: { color: "#f7fdff", fontWeight: "800", fontSize: 15 },
  buttonLabelSecondary: { color: "#17354d" },
  buttonContent: { flexDirection: "row", alignItems: "center", gap: 6 },
  fieldWrapper: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: "800", color: "#5d7a92" },
  input: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d0e5f3",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#13324a",
  },
  textarea: { minHeight: 140 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 16 },
  kvLabel: { color: "#5d7a92", fontWeight: "700", flex: 1, fontSize: 14 },
  kvValue: { color: "#13324a", fontWeight: "800", flexShrink: 1, textAlign: "right", fontSize: 14 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: "flex-start",
    backgroundColor: "#e5f4fd",
    borderColor: "#cfe5f3",
  },
  badgeLabel: { fontSize: 12, fontWeight: "800", color: "#2478b3" },
  emptyState: { alignItems: "center", paddingVertical: 42, gap: 8 },
  emptyStateTitle: { fontSize: 17, fontWeight: "800", color: "#55748d" },
  emptyStateSubtitle: { fontSize: 14, color: "#89a1b3", textAlign: "center" },
  loadingContainer: { alignItems: "center", paddingVertical: 40, gap: 12 },
  loadingLabel: { fontSize: 14, color: "#5d7a92" },
  songCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#d8eaf6",
  },
  songCardBody: { gap: 6 },
  songStatsRow: { flexDirection: "row", gap: 12, marginTop: 2, flexWrap: "wrap" },
  songTitle: { fontSize: 16, fontWeight: "900", color: "#13324a" },
  songMeta: { fontSize: 13, color: "#5d7a92" },
  songStat: { fontSize: 12, color: "#7391a9", fontWeight: "700" },
})
