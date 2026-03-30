import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  useColorScheme,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { songs } from '@/data/songs';
import { useFavorites } from '@/hooks/useFavorites';

export default function SongDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];
  const { isFavorite, toggleFavorite } = useFavorites();

  const song = songs.find((s) => s.id === id);

  if (!song) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
        <View style={styles.center}>
          <Text style={[styles.notFound, { color: C.text }]}>
            Pieseň sa nenašla
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.back, { color: C.primary }]}>← Späť</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const favorite = isFavorite(song.id);

  const tempoColor =
    song.tempo === 'Pomalé'
      ? '#3b82f6'
      : song.tempo === 'Stredné'
      ? '#10b981'
      : '#f59e0b';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
      <StatusBar
        barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={C.background}
      />

      {/* Nav bar */}
      <View style={[styles.navbar, { borderBottomColor: C.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.navBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={C.primary} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: C.text }]} numberOfLines={1}>
          {song.title}
        </Text>
        <TouchableOpacity
          onPress={() => toggleFavorite(song.id)}
          style={styles.navBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={favorite ? 'heart' : 'heart-outline'}
            size={24}
            color={favorite ? C.favoriteActive : C.favoriteInactive}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Song title */}
        <Text style={[styles.songTitle, { color: C.text }]}>{song.title}</Text>

        {/* Tags */}
        <View style={styles.tags}>
          <View style={[styles.tag, { backgroundColor: C.categoryBg }]}>
            <Text style={[styles.tagText, { color: C.categoryText }]}>
              {song.category}
            </Text>
          </View>
          <View style={[styles.tag, { backgroundColor: tempoColor + '20' }]}>
            <Text style={[styles.tagText, { color: tempoColor }]}>
              {song.tempo}
            </Text>
          </View>
          <View style={[styles.tag, { backgroundColor: C.border }]}>
            <Text style={[styles.tagText, { color: C.textSecondary }]}>
              {song.region}
            </Text>
          </View>
        </View>

        {/* Description */}
        {song.description ? (
          <View style={[styles.descCard, { backgroundColor: C.card, borderColor: C.border }]}>
            <Ionicons name="information-circle" size={18} color={C.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.descText, { color: C.textSecondary }]}>
              {song.description}
            </Text>
          </View>
        ) : null}

        {/* Lyrics */}
        <Text style={[styles.lyricsHeader, { color: C.text }]}>🎵 Text piesne</Text>

        {song.verses.map((verse, idx) => (
          <View
            key={idx}
            style={[styles.verseCard, { backgroundColor: C.card, borderColor: C.border }]}
          >
            <Text style={[styles.verseNumber, { color: C.primary }]}>
              {idx + 1}. sloha
            </Text>
            <Text style={[styles.verseText, { color: C.text }]}>{verse}</Text>
          </View>
        ))}

        {song.chorus ? (
          <View
            style={[
              styles.chorusCard,
              { backgroundColor: C.primary + '15', borderColor: C.primary + '40' },
            ]}
          >
            <Text style={[styles.chorusLabel, { color: C.primary }]}>🎼 Refrén</Text>
            <Text style={[styles.chorusText, { color: C.text }]}>{song.chorus}</Text>
          </View>
        ) : null}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  notFound: {
    fontSize: 18,
    fontWeight: '700',
  },
  back: {
    fontSize: 16,
    fontWeight: '600',
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  navBtn: {
    width: 40,
    alignItems: 'center',
  },
  navTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  songTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
    lineHeight: 34,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
  },
  descCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 24,
  },
  descText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  lyricsHeader: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  verseCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  verseNumber: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  verseText: {
    fontSize: 16,
    lineHeight: 26,
    fontFamily: 'serif',
  },
  chorusCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
    marginTop: 4,
    marginBottom: 12,
  },
  chorusLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chorusText: {
    fontSize: 16,
    lineHeight: 26,
    fontFamily: 'serif',
    fontWeight: '600',
  },
});
