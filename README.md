# slovenskeludovkymobile

Pouzivaj iba `pnpm`.

Zakladne prikazy:

```powershell
pnpm install
pnpm start
pnpm typecheck
```

## EAS Update flow

Appka je nastavena na EAS Update cez kanaly:

- `development`
- `preview`
- `production`

`runtimeVersion` pouziva policy `appVersion`, takze OTA update sa doruci iba buildom s rovnakou verziou appky.

Produkčný flow pre aktualizaciu databazy piesni bez noveho store releasu:

```powershell
pnpm prepare:song-data
pnpm update:production -- --message "Aktualizacia databazy piesni"
```

To publishne novy JS/asset bundle vratane `allsongs.json`, `songs.catalog.json`, `songs.search-index.json` a `songs.details/*` na production kanal. Nainstalovane production buildy s verziou `0.1.0` si update stiahnu pri dalsom spusteni appky.

Automatizacia z webu:

- workflow `.github/workflows/eas-update.yml` vie spustit `pnpm prepare:song-data` a nasledne `eas update`
- web repo moze tento workflow dispatchnut cez GitHub Actions API po uspesnom CDN uploade
- v GitHub secrets mobilneho repozitara musia byt nastavene:
  - `EXPO_TOKEN`
  - `EXPO_PUBLIC_ALL_SONGS_CDN_URL`
  - `EXPO_PUBLIC_FIREBASE_API_KEY`
  - `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
  - `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - `EXPO_PUBLIC_FIREBASE_APP_ID`
  - `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID`

Kedy treba novy store build:

- ked menis native zavislosti alebo native konfiguraciu
- ked zvysis `expo.version`, cim sa zmeni `runtimeVersion`

Kedy staci `eas update`:

- ked menis React Native/Expo JS kod
- ked menis bundlovane JSON data piesni
- ked menis assety, ktore idu do OTA bundle
