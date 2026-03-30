import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  useColorScheme,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { songs } from '@/data/songs';
import { SongCard } from '@/components/SongCard';
import { SearchBar } from '@/components/SearchBar';
import { EmptyState } from '@/components/EmptyState';
import { useFavorites } from '@/hooks/useFavorites';

export default function HomeScreen() {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];
  const [query, setQuery] = useState('');
  const { isFavorite, toggleFavorite } = useFavorites();

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return songs;
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.region.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        (s.description?.toLowerCase().includes(q) ?? false)
    );
  }, [query]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
      <StatusBar
        barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={C.background}
      />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.emoji]}>🎶</Text>
          <View>
            <Text style={[styles.title, { color: C.text }]}>
              Slovenské ľudovky
            </Text>
            <Text style={[styles.subtitle, { color: C.textSecondary }]}>
              {songs.length} piesní z celého Slovenska
            </Text>
          </View>
        </View>

        {/* Search */}
        <SearchBar value={query} onChangeText={setQuery} />

        {/* List */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SongCard
              song={item}
              isFavorite={isFavorite(item.id)}
              onToggleFavorite={toggleFavorite}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={filtered.length === 0 ? styles.empty : undefined}
          ListEmptyComponent={
            <EmptyState
              title="Žiadne piesne"
              subtitle={`Pre výraz „${query}" sa nenašli žiadne piesne.`}
            />
          }
          ListFooterComponent={<View style={{ height: 20 }} />}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    paddingTop: 8,
  },
  emoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  empty: {
    flex: 1,
  },
});
