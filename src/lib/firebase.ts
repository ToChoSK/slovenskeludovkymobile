import AsyncStorage from "@react-native-async-storage/async-storage"
import { getApp, getApps, initializeApp } from "firebase/app"
import type { getAuth as getAuthType, initializeAuth as initializeAuthType } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { Platform } from "react-native"
import { FIREBASE_CONFIG } from "@/lib/config"

const rnAuth = require("firebase/auth") as {
  getAuth: typeof getAuthType
  getReactNativePersistence: (storage: typeof AsyncStorage) => unknown
  initializeAuth: typeof initializeAuthType
}

const missingRequired = !FIREBASE_CONFIG.apiKey || !FIREBASE_CONFIG.authDomain || !FIREBASE_CONFIG.projectId || !FIREBASE_CONFIG.appId
const app = missingRequired ? null : getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG)

function createAuth() {
  if (!app) return null
  if (Platform.OS === "web") return rnAuth.getAuth(app)

  try {
    return rnAuth.initializeAuth(app, {
      persistence: rnAuth.getReactNativePersistence(AsyncStorage) as any,
    })
  } catch {
    return rnAuth.getAuth(app)
  }
}

export const auth = createAuth()
export const db = app ? getFirestore(app) : null
