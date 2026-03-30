import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChangeText, placeholder }: SearchBarProps) {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: C.card, borderColor: C.border },
      ]}
    >
      <Ionicons name="search" size={18} color={C.textMuted} style={styles.icon} />
      <TextInput
        style={[styles.input, { color: C.text }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? 'Hľadať pieseň...'}
        placeholderTextColor={C.textMuted}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close-circle" size={18} color={C.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
});
