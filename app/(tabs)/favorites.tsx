import React from 'react';
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
import { EmptyState } from '@/components/EmptyState';
import { useFavorites } from '@/hooks/useFavorites';

export default function FavoritesScreen() {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];
  const { favorites, isFavorite, toggleFavorite, loading } = useFavorites();

  const favoriteSongs = songs.filter((s) => favorites.includes(s.id));

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
        <View style={styles.center}>
          <Text style={[styles.loadingText, { color: C.textMuted }]}>
            Načítavam...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
      <StatusBar
        barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={C.background}
      />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.emoji}>❤️</Text>
          <View>
            <Text style={[styles.title, { color: C.text }]}>Obľúbené</Text>
            <Text style={[styles.subtitle, { color: C.textSecondary }]}>
              {favoriteSongs.length}{' '}
              {favoriteSongs.length === 1
                ? 'pieseň'
                : favoriteSongs.length < 5
                ? 'piesne'
                : 'piesní'}
            </Text>
          </View>
        </View>

        <FlatList
          data={favoriteSongs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SongCard
              song={item}
              isFavorite={isFavorite(item.id)}
              onToggleFavorite={toggleFavorite}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={favoriteSongs.length === 0 ? styles.empty : undefined}
          ListEmptyComponent={
            <EmptyState
              title="Žiadne obľúbené piesne"
              subtitle="Ťukni na ❤️ pri akejkoľvek piesni, aby si ju pridal/pridala medzi obľúbené."
            />
          }
          ListFooterComponent={<View style={{ height: 20 }} />}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  empty: {
    flex: 1,
  },
});
