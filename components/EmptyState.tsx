import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { Colors } from '@/constants/Colors';

interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
}

export function EmptyState({ title, subtitle }: EmptyStateProps) {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🎵</Text>
      <Text style={[styles.title, { color: C.text }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: C.textMuted }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
});
