# Slovenské ľudovky 🎶

Mobilná aplikácia pre slovenské ľudové piesne, vytvorená pomocou **Expo + React Native**.

## Funkcie

- 📋 **Zoznam piesní** – 25 slovenských ľudoviek z celého Slovenska
- 🔍 **Vyhľadávanie** – rýchle hľadanie podľa názvu, kategórie alebo regiónu
- 🗂️ **Kategórie** – filtrovanie podľa typu (Tanečné, Ľúbostné, Pastierske...) alebo regiónu
- ❤️ **Obľúbené** – ukladanie obľúbených piesní (aj offline)
- 🌙 **Tmavý režim** – podpora svetlého aj tmavého motívu
- 📱 **Android & iOS** – plná kompatibilita

## Stack

- [Expo](https://expo.dev) SDK 52
- [React Native](https://reactnative.dev) 0.76
- [Expo Router](https://expo.github.io/router) – file-based navigation
- TypeScript
- AsyncStorage – lokálne ukladanie obľúbených

## Spustenie

```bash
npm install
npx expo start
```

Potom otvor aplikáciu cez **Expo Go** na telefóne alebo v simulátore.

## Štruktúra projektu

```
app/
  (tabs)/
    index.tsx       – domovská obrazovka (zoznam piesní)
    categories.tsx  – filtrovanie podľa kategórie/regiónu
    favorites.tsx   – obľúbené piesne
  song/
    [id].tsx        – detail piesne s textom
components/
  SongCard.tsx      – karta piesne v zozname
  SearchBar.tsx     – vyhľadávacie pole
  EmptyState.tsx    – prázdny stav
data/
  songs.ts          – dáta piesní (texty, kategórie, regióny)
constants/
  Colors.ts         – farebná paleta (svetlý/tmavý režim)
hooks/
  useFavorites.ts   – logika obľúbených
  useThemeColor.ts  – hook pre farby podľa témy
```
