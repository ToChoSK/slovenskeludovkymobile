import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';

export default function RootLayout() {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: C.background },
      }}
    />
  );
}
