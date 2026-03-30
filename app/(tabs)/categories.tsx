import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  useColorScheme,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { songs, categories, regions, type Category, type Region } from '@/data/songs';
import { SongCard } from '@/components/SongCard';
import { EmptyState } from '@/components/EmptyState';
import { useFavorites } from '@/hooks/useFavorites';

type FilterType = 'category' | 'region';

const categoryEmojis: Record<string, string> = {
  Svadobné: '💒',
  Tanečné: '💃',
  Pastierske: '🐑',
  Ľúbostné: '❤️',
  Vojenské: '⚔️',
  Salašnícke: '🏔️',
  Detské: '🧒',
  Vinšovacie: '🍾',
  Rekrutské: '🪖',
  Balady: '📜',
};

const regionEmojis: Record<string, string> = {
  Západ: '🌅',
  Stred: '🏔️',
  Východ: '🌄',
  Šariš: '🦅',
  Zemplín: '🌾',
  Spiš: '🏰',
  Liptov: '⛰️',
  Orava: '🐺',
  Tekov: '🍇',
  Hont: '🌸',
  Gemer: '🪵',
  Pohronie: '💧',
};

export default function CategoriesScreen() {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];
  const { isFavorite, toggleFavorite } = useFavorites();

  const [filterType, setFilterType] = useState<FilterType>('category');
  const [selected, setSelected] = useState<string | null>(null);

  const items = filterType === 'category' ? categories : regions;
  const emojis = filterType === 'category' ? categoryEmojis : regionEmojis;

  const filteredSongs = selected
    ? songs.filter((s) =>
        filterType === 'category'
          ? s.category === (selected as Category)
          : s.region === (selected as Region)
      )
    : [];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
      <StatusBar
        barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={C.background}
      />
      <View style={styles.container}>
        <Text style={[styles.title, { color: C.text }]}>Kategórie</Text>

        {/* Filter type toggle */}
        <View style={[styles.toggle, { backgroundColor: C.card, borderColor: C.border }]}>
          {(['category', 'region'] as FilterType[]).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.toggleBtn,
                filterType === type && { backgroundColor: C.primary },
              ]}
              onPress={() => {
                setFilterType(type);
                setSelected(null);
              }}
            >
              <Text
                style={[
                  styles.toggleText,
                  { color: filterType === type ? '#fff' : C.textSecondary },
                ]}
              >
                {type === 'category' ? 'Kategória' : 'Región'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {!selected ? (
          /* Grid of categories / regions */
          <FlatList
            data={items}
            keyExtractor={(item) => item}
            numColumns={2}
            columnWrapperStyle={styles.row}
            renderItem={({ item }) => {
              const count = songs.filter((s) =>
                filterType === 'category' ? s.category === item : s.region === item
              ).length;
              return (
                <TouchableOpacity
                  style={[styles.chip, { backgroundColor: C.card, borderColor: C.border }]}
                  onPress={() => setSelected(item)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.chipEmoji}>{emojis[item] ?? '🎵'}</Text>
                  <Text style={[styles.chipLabel, { color: C.text }]}>{item}</Text>
                  <Text style={[styles.chipCount, { color: C.textMuted }]}>
                    {count} {count === 1 ? 'pieseň' : count < 5 ? 'piesne' : 'piesní'}
                  </Text>
                </TouchableOpacity>
              );
            }}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={<View style={{ height: 20 }} />}
          />
        ) : (
          /* Song list for selected category/region */
          <>
            <TouchableOpacity
              style={[styles.backBtn, { borderColor: C.border }]}
              onPress={() => setSelected(null)}
            >
              <Text style={[styles.backText, { color: C.primary }]}>
                ← {emojis[selected] ?? '🎵'} {selected}
              </Text>
            </TouchableOpacity>
            <FlatList
              data={filteredSongs}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <SongCard
                  song={item}
                  isFavorite={isFavorite(item.id)}
                  onToggleFavorite={toggleFavorite}
                />
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={filteredSongs.length === 0 ? styles.empty : undefined}
              ListEmptyComponent={
                <EmptyState
                  title="Žiadne piesne"
                  subtitle={`V tejto kategórii zatiaľ nie sú žiadne piesne.`}
                />
              }
              ListFooterComponent={<View style={{ height: 20 }} />}
            />
          </>
        )}
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
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 16,
    paddingTop: 8,
  },
  toggle: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  row: {
    gap: 12,
    marginBottom: 12,
  },
  chip: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  chipEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  chipCount: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  backBtn: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 12,
    borderBottomWidth: 1,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
  },
  empty: {
    flex: 1,
  },
});
