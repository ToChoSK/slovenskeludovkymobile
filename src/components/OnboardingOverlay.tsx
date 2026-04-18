import AsyncStorage from "@react-native-async-storage/async-storage"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useEffect, useRef, useState } from "react"
import { Animated, Dimensions, FlatList, Modal, Pressable, Text, View } from "react-native"

const ONBOARDING_KEY = "@onboarding_completed"
const { width: SCREEN_WIDTH } = Dimensions.get("window")

type OnboardingPage = {
  icon: keyof typeof Ionicons.glyphMap
  title: string
  description: string
  color: string
}

const PAGES: OnboardingPage[] = [
  {
    icon: "musical-notes",
    title: "Vitaj v Slovenských ľudovkách!",
    description: "Objavuj slovenské ľudové piesne podľa názvu, textu alebo regiónu. Máme pre teba stovky piesní z celého Slovenska.",
    color: "#2e89c7",
  },
  {
    icon: "search",
    title: "Hľadanie piesní",
    description: "Na hlavnej stránke môžeš hľadať podľa názvu piesne (rýchle) alebo podľa textu v piesni (prehľadá celý obsah). Prepni si režim hľadania.",
    color: "#1a8a5c",
  },
  {
    icon: "map",
    title: "Mapa regiónov",
    description: 'V záložke Mapa si vyber región priamo z interaktívnej mapy Slovenska. Po výbere klikni na zvýraznené tlačidlo "Zobraziť piesne".',
    color: "#9b59b6",
  },
]

export function OnboardingOverlay() {
  const [visible, setVisible] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [dontShowAgain, setDontShowAgain] = useState(true)
  const flatListRef = useRef<FlatList>(null)
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    void AsyncStorage.getItem(ONBOARDING_KEY).then((value) => {
      if (value !== "true") {
        setVisible(true)
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start()
      }
    })
  }, [])

  async function handleClose() {
    if (dontShowAgain) {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true")
    }
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setVisible(false)
    })
  }

  function handleNext() {
    if (currentPage < PAGES.length - 1) {
      const next = currentPage + 1
      flatListRef.current?.scrollToIndex({ index: next, animated: true })
      setCurrentPage(next)
    } else {
      void handleClose()
    }
  }

  if (!visible) return null

  return (
    <Modal transparent animationType="none" visible={visible}>
      <Animated.View style={{ flex: 1, backgroundColor: "rgba(10,25,40,0.85)", justifyContent: "center", alignItems: "center", padding: 24, opacity: fadeAnim }}>
        <View style={{ backgroundColor: "#ffffff", borderRadius: 32, width: "100%", maxWidth: 380, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.3, shadowRadius: 30, elevation: 20 }}>
          <FlatList
            ref={flatListRef}
            data={PAGES}
            horizontal
            pagingEnabled
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => (
              <View style={{ width: SCREEN_WIDTH - 48 > 380 ? 380 : SCREEN_WIDTH - 48, paddingHorizontal: 28, paddingTop: 36, paddingBottom: 20, alignItems: "center", gap: 16 }}>
                <LinearGradient
                  colors={[item.color, `${item.color}88`]}
                  style={{ width: 72, height: 72, borderRadius: 24, alignItems: "center", justifyContent: "center" }}
                >
                  <Ionicons name={item.icon} size={34} color="#ffffff" />
                </LinearGradient>
                <Text style={{ fontSize: 22, fontWeight: "900", color: "#13324a", textAlign: "center" }}>{item.title}</Text>
                <Text style={{ fontSize: 15, lineHeight: 22, color: "#5d7a92", textAlign: "center" }}>{item.description}</Text>
              </View>
            )}
          />

          {/* Page dots */}
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, paddingVertical: 12 }}>
            {PAGES.map((_, i) => (
              <View
                key={i}
                style={{
                  width: i === currentPage ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: i === currentPage ? "#2e89c7" : "#d5e9f7",
                }}
              />
            ))}
          </View>

          {/* Don't show again checkbox */}
          <Pressable
            onPress={() => setDontShowAgain(!dontShowAgain)}
            style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 28, paddingBottom: 16 }}
          >
            <View style={{
              width: 22, height: 22, borderRadius: 6, borderWidth: 2,
              borderColor: dontShowAgain ? "#2e89c7" : "#b0c8da",
              backgroundColor: dontShowAgain ? "#2e89c7" : "transparent",
              alignItems: "center", justifyContent: "center",
            }}>
              {dontShowAgain && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={{ fontSize: 13, color: "#5d7a92", fontWeight: "600" }}>Už viac nezobrazovať</Text>
          </Pressable>

          {/* Buttons */}
          <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 28, paddingBottom: 28 }}>
            <Pressable
              onPress={() => void handleClose()}
              style={{ flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: "#edf7fd", borderWidth: 1, borderColor: "#cfe5f3", alignItems: "center" }}
            >
              <Text style={{ fontSize: 15, fontWeight: "800", color: "#17354d" }}>Preskočiť</Text>
            </Pressable>
            <Pressable
              onPress={handleNext}
              style={{ flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: "#2e89c7", alignItems: "center" }}
            >
              <Text style={{ fontSize: 15, fontWeight: "800", color: "#ffffff" }}>
                {currentPage < PAGES.length - 1 ? "Ďalej" : "Začať"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </Modal>
  )
}

