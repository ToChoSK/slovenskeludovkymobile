import Constants from "expo-constants"
import { Platform } from "react-native"
import { MOBILE_APP_UPDATE_CONFIG_URL } from "@/lib/config"
import type { MobileAppUpdateConfig, MobileAppUpdatePlatformConfig, MobileAppUpdatePrompt } from "@/types"

function getInstalledAppVersion() {
  return Constants.nativeAppVersion ?? Constants.expoConfig?.version ?? "0.0.0"
}

function parseVersionParts(version: string) {
  return version
    .split(".")
    .map((part) => {
      const match = part.match(/\d+/)
      return match ? Number(match[0]) : 0
    })
}

function compareVersions(left: string, right: string) {
  const leftParts = parseVersionParts(left)
  const rightParts = parseVersionParts(right)
  const maxLength = Math.max(leftParts.length, rightParts.length)

  for (let index = 0; index < maxLength; index += 1) {
    const leftPart = leftParts[index] ?? 0
    const rightPart = rightParts[index] ?? 0
    if (leftPart > rightPart) return 1
    if (leftPart < rightPart) return -1
  }

  return 0
}

function getPlatformConfig(config: MobileAppUpdateConfig): MobileAppUpdatePlatformConfig | null {
  if (Platform.OS === "android") return config.android ?? null
  if (Platform.OS === "ios") return config.ios ?? null
  return null
}

export async function loadMobileAppUpdatePrompt(): Promise<MobileAppUpdatePrompt | null> {
  const response = await fetch(MOBILE_APP_UPDATE_CONFIG_URL, {
    headers: { Accept: "application/json" },
  })

  if (!response.ok) {
    throw new Error(`Update config request failed: ${response.status}`)
  }

  const payload = (await response.json()) as MobileAppUpdateConfig
  const platformConfig = getPlatformConfig(payload)
  if (!platformConfig || !platformConfig.enabled) return null

  const installedVersion = getInstalledAppVersion()
  const latestVersion = platformConfig.latestVersion
  if (compareVersions(latestVersion, installedVersion) <= 0) return null

  const minSupportedVersion = platformConfig.minSupportedVersion ?? null
  return {
    storeUrl: platformConfig.storeUrl,
    title: platformConfig.title?.trim() || "Je dostupná nová verzia aplikácie.",
    message: platformConfig.message?.trim() || null,
    latestVersion,
    minSupportedVersion,
    required: minSupportedVersion ? compareVersions(installedVersion, minSupportedVersion) < 0 : false,
  }
}
