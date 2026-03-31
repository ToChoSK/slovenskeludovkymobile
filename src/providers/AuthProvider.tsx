import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, type User as FirebaseUser } from "firebase/auth"
import { Timestamp } from "firebase/firestore"
import { auth } from "@/lib/firebase"
import { createUserProfile, ensureMetadataDefaults, getUserById } from "@/services/firestore"
import type { User } from "@/types"

type AuthContextValue = {
  user: User | null
  loading: boolean
  authWarning: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, nick: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function toFallbackUser(firebaseUser: FirebaseUser): User {
  return {
    id: firebaseUser.uid,
    albumIds: [],
    createdAt: Timestamp.now(),
    email: firebaseUser.email ?? "",
    favoriteSongIds: [],
    nick: firebaseUser.displayName ?? (firebaseUser.email?.split("@")[0] ?? "host"),
    role: "guest",
    songsAdded: [],
    songsNextSongLikes: [],
    songsTextVersionLikes: [],
    textVersionsAdded: [],
    updatedAt: Timestamp.now(),
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authWarning, setAuthWarning] = useState<string | null>(null)

  const syncUserProfile = async (firebaseUser: FirebaseUser) => {
    const userDoc = await getUserById(firebaseUser.uid)
    if (userDoc) {
      setUser(userDoc)
      setAuthWarning(null)
      return
    }
    await createUserProfile(firebaseUser.uid, {
      email: firebaseUser.email ?? "",
      nick: firebaseUser.displayName ?? (firebaseUser.email?.split("@")[0] ?? "host"),
    })
    const created = await getUserById(firebaseUser.uid)
    if (created) {
      setUser(created)
      setAuthWarning(null)
      return
    }
    setUser(toFallbackUser(firebaseUser))
    setAuthWarning("Firebase Auth funguje, ale Firestore profil sa nepodarilo nacitat.")
  }

  const refreshUser = async () => {
    if (!auth?.currentUser) {
      setUser(null)
      return
    }
    await syncUserProfile(auth.currentUser)
  }

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }
    void ensureMetadataDefaults().catch(() => {})
    const off = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          setUser(null)
          setAuthWarning(null)
          return
        }
        await syncUserProfile(firebaseUser)
      } catch {
        setUser(firebaseUser ? toFallbackUser(firebaseUser) : null)
        setAuthWarning("Pouzivatel je prihlaseny, ale Firestore momentalne neodpoveda.")
      } finally {
        setLoading(false)
      }
    })
    return () => off()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      authWarning,
      signIn: async (email, password) => {
        if (!auth) throw new Error("Firebase Auth nie je inicializovany.")
        await signInWithEmailAndPassword(auth, email, password)
      },
      signUp: async (email, password, nick) => {
        if (!auth) throw new Error("Firebase Auth nie je inicializovany.")
        const credentials = await createUserWithEmailAndPassword(auth, email, password)
        await createUserProfile(credentials.user.uid, { email, nick })
        await refreshUser()
      },
      logout: async () => {
        if (!auth) throw new Error("Firebase Auth nie je inicializovany.")
        await signOut(auth)
        setUser(null)
      },
      refreshUser,
    }),
    [user, loading, authWarning],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error("useAuth musi byt pouzity v AuthProvider.")
  return value
}
