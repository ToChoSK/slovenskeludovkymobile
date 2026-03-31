import AsyncStorage from "@react-native-async-storage/async-storage"
import * as Network from "expo-network"
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { syncOfflineDatasetFromCdn } from "@/services/dataset-sync"
import { ensureOfflineDataset } from "@/services/offline-songs"
import type { OfflineDatasetBundle, OfflineMode } from "@/types"

const MODE_KEY = "slovenske-ludovky-mobile.mode"

type AppModeContextValue = {
  mode: OfflineMode
  setMode: (mode: OfflineMode) => Promise<void>
  dataset: OfflineDatasetBundle | null
  datasetLoading: boolean
  datasetError: string | null
  syncing: boolean
  syncFromCdn: () => Promise<void>
  isOnlineReachable: boolean
}

const AppModeContext = createContext<AppModeContextValue | null>(null)

export function AppModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<OfflineMode>("online")
  const [dataset, setDataset] = useState<OfflineDatasetBundle | null>(null)
  const [datasetLoading, setDatasetLoading] = useState(true)
  const [datasetError, setDatasetError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [isOnlineReachable, setIsOnlineReachable] = useState(true)

  useEffect(() => {
    void AsyncStorage.getItem(MODE_KEY).then((value) => {
      if (value === "online" || value === "offline") setModeState(value)
    })
  }, [])

  useEffect(() => {
    let alive = true
    void ensureOfflineDataset()
      .then((bundle) => {
        if (!alive) return
        setDataset(bundle)
        setDatasetLoading(false)
      })
      .catch((error: Error) => {
        if (!alive) return
        setDatasetError(error.message)
        setDatasetLoading(false)
      })
    void Network.getNetworkStateAsync().then((state) => {
      if (alive) setIsOnlineReachable(Boolean(state.isInternetReachable ?? state.isConnected))
    })
    return () => {
      alive = false
    }
  }, [])

  const value = useMemo<AppModeContextValue>(
    () => ({
      mode,
      setMode: async (nextMode) => {
        setModeState(nextMode)
        await AsyncStorage.setItem(MODE_KEY, nextMode)
      },
      dataset,
      datasetLoading,
      datasetError,
      syncing,
      isOnlineReachable,
      syncFromCdn: async () => {
        setSyncing(true)
        setDatasetError(null)
        try {
          const nextDataset = await syncOfflineDatasetFromCdn()
          setDataset(nextDataset)
        } catch (error: any) {
          setDatasetError(error?.message ?? "Nepodarilo sa synchronizovat allSongs.json z CDN.")
          throw error
        } finally {
          setSyncing(false)
        }
      },
    }),
    [mode, dataset, datasetLoading, datasetError, syncing, isOnlineReachable],
  )

  return <AppModeContext.Provider value={value}>{children}</AppModeContext.Provider>
}

export function useAppMode() {
  const value = useContext(AppModeContext)
  if (!value) throw new Error("useAppMode musi byt pouzity v AppModeProvider.")
  return value
}
