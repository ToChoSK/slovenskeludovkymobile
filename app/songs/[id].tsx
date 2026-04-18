import { Ionicons } from "@expo/vector-icons"
import { Timestamp } from "firebase/firestore"
import { Stack, router, useLocalSearchParams } from "expo-router"
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react"
import { Alert, Linking, Pressable, Text, View } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useHasPrivilege } from "@/lib/privileges"
import { REGION_META, resolveRegionKey } from "@/lib/regions"
import { normalizeSearchText } from "@/lib/search"
import { Button, Card, EmptyState, Field, Heading, Loading, Screen, SongCard, Subtle } from "@/components/ui"
import { useAuth } from "@/providers/AuthProvider"
import { useSongs } from "@/providers/SongsProvider"

export default function SongDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const songId = Number(id)
  const { user } = useAuth()
  const {
    songs: catalogSongs,
    getSongPreview,
    getSongs,
    getSong,
    incrementViewCount,
    toggleFavoriteSong,
    likeTextVersion,
    addTextVersion,
    deleteTextVersion,
    addNextSong,
    removeNextSong,
    toggleNextSongLike,
    deleteSong,
  } = useSongs()

  const canManageFavorites = useHasPrivilege(user, "manage_favorites")
  const canLikeTextVersion = useHasPrivilege(user, "like_text_version")
  const canAddTextVersion = useHasPrivilege(user, "add_text_version")
  const canDeleteTextVersion = useHasPrivilege(user, "delete_text_version")
  const canEditSong = useHasPrivilege(user, "edit_song")
  const canDeleteSong = useHasPrivilege(user, "delete_song")
  const canSelectNextSong = useHasPrivilege(user, "select_next_song")

  const songPreview = getSongPreview(songId)
  const [song, setSong] = useState<Awaited<ReturnType<typeof getSong>>>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [newTextVersion, setNewTextVersion] = useState("")
  const [nextSongQuery, setNextSongQuery] = useState("")
  const deferredNextSongQuery = useDeferredValue(nextSongQuery)
  const [selectedNextSongId, setSelectedNextSongId] = useState<number | null>(null)
  const [favoriteActive, setFavoriteActive] = useState(false)
  const [textLikeIds, setTextLikeIds] = useState<Set<number>>(new Set())
  const [nextLikeIds, setNextLikeIds] = useState<Set<number>>(new Set())
  const viewedSongIdRef = useRef<number | null>(null)
  const pendingLikeKeysRef = useRef<Set<string>>(new Set())
  const [resolvedNextSongs, setResolvedNextSongs] = useState<Awaited<ReturnType<typeof getSongs>>>([])
  const nextSongIdsKey = song?.nextSongs.map((item) => item.id).join("|") ?? ""

  useEffect(() => {
    let alive = true
    setSong(null)
    setLoadError(null)
    void (async () => {
      try {
        const loaded = await getSong(songId)
        if (!alive) return
        setSong(loaded)
        if (!loaded) setLoadError("Pieseň sa nenašla.")
      } catch (error) {
        if (!alive) return
        setLoadError(error instanceof Error ? error.message : "Nepodarilo sa načítať pieseň.")
      }
    })()
    return () => {
      alive = false
    }
  }, [songId])

  useEffect(() => {
    if (!song || viewedSongIdRef.current === song.id) return
    viewedSongIdRef.current = song.id
    setSong((current) => (current ? { ...current, viewCount: current.viewCount + 1 } : current))
    void incrementViewCount(song.id)
  }, [song?.id])

  useEffect(() => {
    let alive = true
    if (!song?.nextSongs.length) {
      setResolvedNextSongs([])
      return () => {
        alive = false
      }
    }
    void getSongs(song.nextSongs.map((item) => item.id)).then((rows) => {
      if (alive) setResolvedNextSongs(rows)
    })
    return () => {
      alive = false
    }
  }, [nextSongIdsKey])

  useEffect(() => {
    if (!song || !user) {
      setFavoriteActive(false)
      setTextLikeIds(new Set())
      setNextLikeIds(new Set())
      return
    }
    setFavoriteActive(user.favoriteSongIds.includes(song.id))
    setTextLikeIds(new Set(user.songsTextVersionLikes.filter((item) => item.songId === song.id).map((item) => item.textVersionId)))
    setNextLikeIds(new Set(user.songsNextSongLikes.filter((item) => item.songId === song.id).map((item) => item.nextSongId)))
  }, [song?.id, user?.id, user?.updatedAt])

  const nextSongTitleIndex = useMemo(
    () =>
      catalogSongs.map((item) => ({
        id: item.id,
        title: item.title,
        titleRaw: item.title.toLowerCase(),
        titleKey: normalizeSearchText(item.title),
        viewCount: item.viewCount,
        region: item.region,
        obec: item.obec,
      })),
    [catalogSongs],
  )

  const nextSongCandidates = useMemo(() => {
    const rawQuery = deferredNextSongQuery.trim().toLowerCase()
    const query = normalizeSearchText(deferredNextSongQuery)
    if (!query || !song || query.length < 2) return []
    const alreadyLinked = new Set(song.nextSongs.map((item) => item.id))
    const best: typeof nextSongTitleIndex = []
    const compare = (a: (typeof nextSongTitleIndex)[number], b: (typeof nextSongTitleIndex)[number]) =>
      b.viewCount - a.viewCount || a.title.localeCompare(b.title, "sk", { sensitivity: "base" })

    for (const item of nextSongTitleIndex) {
      if (item.id === song.id || alreadyLinked.has(item.id)) continue
      if (!(item.titleRaw.includes(rawQuery) || item.titleKey.includes(query))) continue

      if (best.length < 12) {
        best.push(item)
        best.sort(compare)
        continue
      }

      if (compare(item, best[best.length - 1]) < 0) {
        best[best.length - 1] = item
        best.sort(compare)
      }
    }

    return best
  }, [deferredNextSongQuery, nextSongTitleIndex, song])

  const selectedNextSong = useMemo(() => {
    if (selectedNextSongId == null) return null
    return catalogSongs.find((item) => item.id === selectedNextSongId) ?? null
  }, [catalogSongs, selectedNextSongId])

  function handleBack() {
    if (router.canGoBack()) {
      router.back()
    } else {
      router.replace("/(tabs)/songs")
    }
  }

  function ensureLikeAllowed() {
    if (!user) {
      Alert.alert("Je potrebné prihlásenie", "Pre túto akciu sa musíš najprv prihlásiť.")
      return false
    }
    return true
  }

  function acquireLikeLock(key: string) {
    if (pendingLikeKeysRef.current.has(key)) return false
    pendingLikeKeysRef.current.add(key)
    return true
  }

  function releaseLikeLock(key: string) {
    pendingLikeKeysRef.current.delete(key)
  }

  async function runWithTimeout<T>(task: Promise<T>, timeoutMs: number, timeoutMessage: string) {
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null
    try {
      return await Promise.race([
        task,
        new Promise<never>((_, reject) => {
          timeoutHandle = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
        }),
      ])
    } finally {
      if (timeoutHandle) clearTimeout(timeoutHandle)
    }
  }

  async function handleFavoriteToggle() {
    if (!song) return
    if (!canManageFavorites) return
    if (!ensureLikeAllowed()) return
    if (!acquireLikeLock("song")) return
    const wasActive = favoriteActive
    setFavoriteActive(!wasActive)
    setSong((current) => (current ? { ...current, favoriteCount: Math.max(0, current.favoriteCount + (wasActive ? -1 : 1)) } : current))
    try {
      await runWithTimeout(toggleFavoriteSong(user!.id, song.id, wasActive), 9000, "Akcia trvá príliš dlho. Skús to znova.")
    } catch (error) {
      setFavoriteActive(wasActive)
      setSong((current) => (current ? { ...current, favoriteCount: Math.max(0, current.favoriteCount + (wasActive ? 1 : -1)) } : current))
      Alert.alert("Chyba", error instanceof Error ? error.message : "Nepodarilo sa upraviť obľúbené.")
    } finally {
      releaseLikeLock("song")
    }
  }

  async function handleTextVersionLike(textVersionId: number) {
    if (!song) return
    if (!canLikeTextVersion) return
    if (!ensureLikeAllowed()) return
    const key = `text-${textVersionId}`
    if (!acquireLikeLock(key)) return
    const wasActive = textLikeIds.has(textVersionId)
    setTextLikeIds((current) => {
      const next = new Set(current)
      if (wasActive) next.delete(textVersionId)
      else next.add(textVersionId)
      return next
    })
    setSong((current) =>
      current
        ? {
            ...current,
            textVersions: current.textVersions.map((item) =>
              item.id === textVersionId ? { ...item, likes: Math.max(0, item.likes + (wasActive ? -1 : 1)) } : item,
            ),
          }
        : current,
    )
    try {
      await runWithTimeout(likeTextVersion(user!.id, song.id, textVersionId, wasActive), 9000, "Akcia trvá príliš dlho. Skús to znova.")
    } catch (error) {
      setTextLikeIds((current) => {
        const next = new Set(current)
        if (wasActive) next.add(textVersionId)
        else next.delete(textVersionId)
        return next
      })
      setSong((current) =>
        current
          ? {
              ...current,
              textVersions: current.textVersions.map((item) =>
                item.id === textVersionId ? { ...item, likes: Math.max(0, item.likes + (wasActive ? 1 : -1)) } : item,
              ),
            }
          : current,
      )
      Alert.alert("Chyba", error instanceof Error ? error.message : "Nepodarilo sa upraviť označenie páči sa mi pri textovej verzii.")
    } finally {
      releaseLikeLock(key)
    }
  }

  async function handleNextSongLike(nextSongId: number) {
    if (!song) return
    if (!canSelectNextSong) return
    if (!ensureLikeAllowed()) return
    const key = `next-${nextSongId}`
    if (!acquireLikeLock(key)) return
    const wasActive = nextLikeIds.has(nextSongId)
    setNextLikeIds((current) => {
      const next = new Set(current)
      if (wasActive) next.delete(nextSongId)
      else next.add(nextSongId)
      return next
    })
    setSong((current) =>
      current
        ? {
            ...current,
            nextSongs: current.nextSongs.map((item) =>
              item.id === nextSongId ? { ...item, likes: Math.max(0, item.likes + (wasActive ? -1 : 1)) } : item,
            ),
          }
        : current,
    )
    try {
      await runWithTimeout(toggleNextSongLike(user!.id, song.id, nextSongId, wasActive), 9000, "Akcia trvá príliš dlho. Skús to znova.")
    } catch (error) {
      setNextLikeIds((current) => {
        const next = new Set(current)
        if (wasActive) next.add(nextSongId)
        else next.delete(nextSongId)
        return next
      })
      setSong((current) =>
        current
          ? {
              ...current,
              nextSongs: current.nextSongs.map((item) =>
                item.id === nextSongId ? { ...item, likes: Math.max(0, item.likes + (wasActive ? 1 : -1)) } : item,
              ),
            }
          : current,
      )
      Alert.alert("Chyba", error instanceof Error ? error.message : "Nepodarilo sa upraviť označenie páči sa mi pri nadväzujúcej piesni.")
    } finally {
      releaseLikeLock(key)
    }
  }

  if (!song) {
    return (
      <Screen>
        <Card>
          {songPreview ? (
            <View style={{ gap: 10 }}>
              <Heading>{songPreview.title}</Heading>
              <Subtle>{[songPreview.region, songPreview.obec].filter(Boolean).join(" · ") || "Bez regiónu"}</Subtle>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                <MetricChip icon="heart-outline" label={String(songPreview.favoriteCount)} />
                <MetricChip icon="eye-outline" label={String(songPreview.viewCount)} />
              </View>
              {loadError ? <EmptyState title="Nepodarilo sa načítať pieseň" subtitle={loadError} /> : <Loading label="Načítavam texty a detaily piesne..." />}
            </View>
          ) : loadError ? (
            <EmptyState title="Nepodarilo sa načítať pieseň" subtitle={loadError} />
          ) : (
            <Loading label="Načítavam pieseň..." />
          )}
        </Card>
      </Screen>
    )
  }

  const regionKey = resolveRegionKey(song.region) ?? "slovensko"
  const regionMeta = REGION_META[regionKey]
  const regionColor = regionMeta.color

  return (
    <Screen>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <Pressable onPress={handleBack} style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 4, paddingVertical: 4 }}>
              <Ionicons name="chevron-back" size={18} color="#143853" />
              <Text style={{ color: "#143853", fontSize: 16, fontWeight: "800" }}>Späť</Text>
            </Pressable>
          ),
        }}
      />

      <LinearGradient
        colors={["#0f2d46", "#1a5b87", regionColor]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 28, padding: 18, gap: 12, borderWidth: 2, borderColor: regionColor }}
      >
        <Text style={{ fontSize: 30, lineHeight: 34, color: "#f3fbff", fontWeight: "900" }}>{song.title}</Text>
        <Text style={{ color: "#e8f7ff", fontSize: 13, fontWeight: "700" }}>{song.obec ?? "Neznáma obec"}</Text>

        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          <LikeChip active={favoriteActive} count={song.favoriteCount} onPress={() => void handleFavoriteToggle()} />
          <MetricChip icon="eye-outline" label={String(song.viewCount)} dark />
          {song.region ? <RegionTag label={song.region} color={regionColor} /> : null}
        </View>
      </LinearGradient>

      <Card>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {canEditSong ? <Button label="Upraviť pieseň" tone="secondary" onPress={() => router.push(`/songs/${song.id}/edit`)} /> : null}
          {canDeleteSong ? (
            <Button
              label="Vymazať pieseň"
              tone="danger"
              onPress={() =>
                void deleteSong(song.id).then(() => {
                  router.replace("/(tabs)/songs")
                })
              }
            />
          ) : null}
        </View>
      </Card>

      <Card>
        <Heading size="h2">Textové verzie</Heading>
        {song.textVersions.length === 0 ? <EmptyState title="Zatiaľ bez textov" /> : null}
        {song.textVersions.map((version) => {
          const liked = textLikeIds.has(version.id)
          return (
            <View key={version.id} style={{ gap: 10, borderWidth: 1, borderColor: "#d8eaf6", borderRadius: 18, padding: 14, backgroundColor: "#ffffff" }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <Text style={{ fontWeight: "800", color: "#153550" }}>Verzia #{version.id}</Text>
                <LikeChip active={liked} count={version.likes} onPress={() => void handleTextVersionLike(version.id)} />
              </View>
              <Text style={{ color: "#5d7a92", lineHeight: 22 }}>{version.text}</Text>
              {canDeleteTextVersion ? (
                <Button
                  label="Vymazať verziu"
                  tone="danger"
                  onPress={() =>
                    void deleteTextVersion(song.id, version.id).then(() => {
                      setSong((current) =>
                        current ? { ...current, textVersions: current.textVersions.filter((item) => item.id !== version.id) } : current,
                      )
                      setTextLikeIds((current) => {
                        const next = new Set(current)
                        next.delete(version.id)
                        return next
                      })
                    })
                  }
                />
              ) : null}
            </View>
          )
        })}

        {canAddTextVersion ? (
          <View style={{ gap: 8 }}>
            <Field value={newTextVersion} onChangeText={setNewTextVersion} placeholder="Nová textová verzia" multiline />
            <Button
              label="Pridať textovú verziu"
              onPress={() =>
                void addTextVersion(song.id, newTextVersion).then(() => {
                  const nextId = Math.max(0, ...song.textVersions.map((item) => item.id)) + 1
                  setSong((current) =>
                    current
                      ? {
                          ...current,
                          textVersions: [...current.textVersions, { id: nextId, text: newTextVersion, likes: 0, creationTime: Timestamp.now() }],
                        }
                      : current,
                  )
                  setNewTextVersion("")
                })
              }
            />
          </View>
        ) : null}
      </Card>

      <Card>
        <Heading size="h2">Nasledujúce piesne</Heading>
        {resolvedNextSongs.length === 0 ? <EmptyState title="Zatiaľ bez naviazaných piesní" /> : null}
        {resolvedNextSongs.map((nextSong) => {
          const liked = nextLikeIds.has(nextSong.id)
          return (
            <View key={nextSong.id} style={{ gap: 8 }}>
              <SongCard
                title={nextSong.title}
                region={nextSong.region}
                obec={nextSong.obec}
                favoriteCount={nextSong.favoriteCount}
                viewCount={nextSong.viewCount}
                onPress={() => router.push(`/songs/${nextSong.id}`)}
              />
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <LikeChip active={liked} count={song.nextSongs.find((item) => item.id === nextSong.id)?.likes ?? 0} onPress={() => void handleNextSongLike(nextSong.id)} />
                {canSelectNextSong ? (
                  <IconAction
                    label="Odstrániť nadväzujúcu pieseň"
                    icon="trash-outline"
                    onPress={() =>
                      void removeNextSong(song.id, nextSong.id).then(() => {
                        setSong((current) =>
                          current ? { ...current, nextSongs: current.nextSongs.filter((item) => item.id !== nextSong.id) } : current,
                        )
                        setResolvedNextSongs((current) => current.filter((item) => item.id !== nextSong.id))
                        setNextLikeIds((current) => {
                          const next = new Set(current)
                          next.delete(nextSong.id)
                          return next
                        })
                      })
                    }
                  />
                ) : null}
              </View>
            </View>
          )
        })}

        {canSelectNextSong ? (
          <View style={{ gap: 8 }}>
            <Field value={nextSongQuery} onChangeText={setNextSongQuery} placeholder="Vyhľadaj názov ďalšej piesne..." />

            {nextSongCandidates.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => {
                  setSelectedNextSongId(item.id)
                  setNextSongQuery(item.title)
                }}
                style={{
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: selectedNextSongId === item.id ? "#2f8fcd" : "#d8eaf6",
                  backgroundColor: selectedNextSongId === item.id ? "#e9f6fe" : "#ffffff",
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "800", color: "#153550" }}>{item.title}</Text>
                <Text style={{ fontSize: 12, color: "#5d7a92" }}>{[item.region, item.obec].filter(Boolean).join(" · ") || "Bez regiónu"}</Text>
              </Pressable>
            ))}
            {deferredNextSongQuery.trim().length > 0 && normalizeSearchText(deferredNextSongQuery).length >= 2 && nextSongCandidates.length === 0 ? (
              <Subtle>Nenašla sa zhoda v názvoch piesní.</Subtle>
            ) : null}
            {deferredNextSongQuery.trim().length > 0 && normalizeSearchText(deferredNextSongQuery).length < 2 ? (
              <Subtle>Pre rýchle vyhľadávanie zadaj aspoň 2 znaky.</Subtle>
            ) : null}

            {selectedNextSong ? <Subtle>Vybrané: {selectedNextSong.title}</Subtle> : null}

            <Button
              label="Pridať nadväzujúcu pieseň"
              disabled={!selectedNextSong}
              onPress={() =>
                void (async () => {
                  if (!selectedNextSong) return
                  try {
                    await addNextSong(song.id, selectedNextSong.id)
                    setSong((current) =>
                      current
                        ? {
                            ...current,
                            nextSongs: current.nextSongs.some((item) => item.id === selectedNextSong.id)
                              ? current.nextSongs
                              : [...current.nextSongs, { id: selectedNextSong.id, likes: 0 }],
                          }
                        : current,
                    )
                    const loaded = await getSongs([selectedNextSong.id])
                    if (loaded[0]) {
                      setResolvedNextSongs((current) => (current.some((item) => item.id === loaded[0].id) ? current : [...current, loaded[0]]))
                    }
                    setSelectedNextSongId(null)
                    setNextSongQuery("")
                    Alert.alert("Hotovo", "Nadväzujúca pieseň bola pridaná.")
                  } catch (error) {
                    Alert.alert("Chyba", error instanceof Error ? error.message : "Nepodarilo sa pridať nadväzujúcu pieseň.")
                  }
                })()
              }
            />
          </View>
        ) : null}
      </Card>

      {song.links.length > 0 ? (
        <Card>
          <Heading size="h2">Odkazy</Heading>
          {song.links.map((link) => (
            <Button key={link} label={link} tone="secondary" icon={<Ionicons name="open-outline" size={15} color="#17354d" />} onPress={() => void Linking.openURL(link)} />
          ))}
        </Card>
      ) : null}
    </Screen>
  )
}

function MetricChip({ icon, label, dark }: { icon: "eye-outline" | "heart-outline"; label: string; dark?: boolean }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: dark ? "rgba(245,252,255,0.2)" : "#edf7fd",
        borderWidth: 1,
        borderColor: dark ? "rgba(233,247,255,0.55)" : "#cfe5f3",
      }}
    >
      <Ionicons name={icon} size={13} color={dark ? "#eaf8ff" : "#2f8fcd"} />
      <Text style={{ color: dark ? "#eaf8ff" : "#17354d", fontSize: 12, fontWeight: "800" }}>{label}</Text>
    </View>
  )
}

function RegionTag({ label, color }: { label: string; color: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: `${color}22`,
        borderWidth: 1,
        borderColor: `${color}88`,
      }}
    >
      <Ionicons name="location-outline" size={13} color={color} />
      <Text style={{ color, fontSize: 12, fontWeight: "800" }}>{label}</Text>
    </View>
  )
}

function LikeChip({
  active,
  count,
  onPress,
}: {
  active: boolean
  count: number
  onPress: () => void
}) {
  return (
    <Pressable
      delayLongPress={120}
      unstable_pressDelay={35}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: active ? "#ffeef4" : "#edf7fd",
        borderWidth: 1,
        borderColor: active ? "#f4b8cb" : "#cfe5f3",
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Ionicons name={active ? "heart" : "heart-outline"} size={15} color={active ? "#d63c6b" : "#2f8fcd"} />
      <Text style={{ color: "#17354d", fontSize: 12, fontWeight: "800" }}>{count}</Text>
    </Pressable>
  )
}

function IconAction({
  icon,
  label,
  onPress,
}: {
  icon: "trash-outline"
  label: string
  onPress: () => void
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 36,
        height: 36,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff2f1",
        borderWidth: 1,
        borderColor: "#f3c7c3",
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Ionicons name={icon} size={16} color="#c23a2b" />
    </Pressable>
  )
}
