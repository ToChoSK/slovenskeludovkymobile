import { getApp, getApps, initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { FIREBASE_CONFIG } from "@/lib/config"

const missingRequired = !FIREBASE_CONFIG.apiKey || !FIREBASE_CONFIG.authDomain || !FIREBASE_CONFIG.projectId || !FIREBASE_CONFIG.appId
const app = missingRequired ? null : getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG)

export const auth = app ? getAuth(app) : null
export const db = app ? getFirestore(app) : null
