import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import type { Song } from '@/data/songs';

interface SongCardProps {
  song: Song;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}

export function SongCard({ song, isFavorite, onToggleFavorite }: SongCardProps) {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];

  const tempoColor =
    song.tempo === 'Pomalé'
      ? '#3b82f6'
      : song.tempo === 'Stredné'
      ? '#10b981'
      : '#f59e0b';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}
      onPress={() => router.push(`/song/${song.id}`)}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        <View style={styles.titleArea}>
          <Text style={[styles.title, { color: C.text }]} numberOfLines={1}>
            {song.title}
          </Text>
          <Text style={[styles.region, { color: C.textSecondary }]}>
            {song.region}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => onToggleFavorite(song.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={22}
            color={isFavorite ? C.favoriteActive : C.favoriteInactive}
          />
        </TouchableOpacity>
      </View>

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
      </View>

      {song.description ? (
        <Text
          style={[styles.description, { color: C.textMuted }]}
          numberOfLines={2}
        >
          {song.description}
        </Text>
      ) : null}

      <View style={styles.footer}>
        <Text style={[styles.verseCount, { color: C.textMuted }]}>
          {song.verses.length}{' '}
          {song.verses.length === 1
            ? 'sloha'
            : song.verses.length < 5
            ? 'slohy'
            : 'slôh'}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  titleArea: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  region: {
    fontSize: 13,
    fontWeight: '500',
  },
  tags: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  verseCount: {
    fontSize: 12,
    fontWeight: '500',
  },
});
