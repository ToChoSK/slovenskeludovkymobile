import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback } from 'react';

const FAVORITES_KEY = 'favorites_songs';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load favorites', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = useCallback(async (songId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(songId)
        ? prev.filter((id) => id !== songId)
        : [...prev, songId];

      AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next)).catch((e) =>
        console.error('Failed to save favorites', e)
      );

      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (songId: string) => favorites.includes(songId),
    [favorites]
  );

  return { favorites, toggleFavorite, isFavorite, loading };
}
