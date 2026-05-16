# Vaccinloggen — mobile

Expo SDK 54 + TypeScript + Expo Router. Lokal-only (SQLite, ingen backend).

## Stack

- **Mobile**: Expo SDK 54, React Native 0.81, React 19
- **Routing**: Expo Router 6 (file-based)
- **DB**: `expo-sqlite` (lokal, krypterad inom app sandbox)
- **Auth**: `expo-local-authentication` (Face ID / Touch ID / biometric)
- **Notifications**: `expo-notifications` (lokala påminnelser, ingen push-server)
- **State**: Zustand
- **Icons**: lucide-react-native
- **Date utils**: dayjs med svensk locale

## Köra appen

### Första gången (iOS, mac)

```bash
cd mobile
npm install --legacy-peer-deps
cd ios && pod install && cd ..
npx expo run:ios
```

Den första builden tar 5–15 min. Senare builds blir snabba.

Om du vill öppna Xcode-projektet direkt (som i GripAge):

```bash
open ios/Vaccinloggen.xcworkspace
```

### Vardagligt utvecklingsflöde

```bash
# Terminal 1: Metro bundler
npx expo start

# Terminal 2 eller via Xcode: Bygg och kör på simulator
npx expo run:ios
```

### Android

```bash
npx expo run:android
```

## Projektstruktur

```
mobile/
├── app/                       # Expo Router screens (file-based)
│   ├── _layout.tsx            # rootlayout, kör migrationer + lock
│   ├── index.tsx              # hem / familjedashboard
│   └── profile/
│       ├── new.tsx            # skapa profil (modal)
│       ├── [id].tsx           # profilvy
│       └── [id]/edit.tsx      # redigera profil (modal)
├── src/
│   ├── components/            # UI-komponenter (alla läser från theme/tokens.ts)
│   │   ├── Button, Card, Input, Avatar, EmptyState, Header, Screen, Text
│   │   ├── LockGate.tsx       # biometriskt lås
│   │   ├── FamilyBar.tsx      # horisontell familjelista
│   │   └── ProfileForm.tsx    # skapa/redigera-formulär
│   ├── theme/
│   │   ├── tokens.ts          # designtokens (färg/spacing/typografi/radii/shadows)
│   │   └── useTheme.ts        # hook som läser color scheme
│   ├── db/
│   │   ├── database.ts        # SQLite singleton
│   │   ├── migrations.ts      # migration runner
│   │   ├── migrations/001_init.sql
│   │   └── profiles.ts        # CRUD för profiles
│   ├── stores/
│   │   └── profilesStore.ts   # Zustand store för profiler
│   ├── i18n/sv.ts             # alla svenska strängar
│   └── utils/
│       ├── dates.ts           # dayjs setup + ageInMonths/Weeks/Years
│       └── ids.ts             # UUID generator
└── (PLAN.md ligger i ../PLAN.md)
```

## Vad som funkar nu (M0+M1 klart)

- Migrationer kör vid app-start
- Biometriskt lås (Face ID / Touch ID, fallback för simulator utan biometri)
- Skapa, lista, redigera, ta bort profiler
- Familjebar med flera profiler
- Riskgruppsmarkörer + kön + födelsedatum
- Svensk UI överallt

## Nästa milstenar

Se `../PLAN.md` för fullständig plan:

- **M2**: Vaccinationer — manuell registrering, timeline-vy
- **M3**: Bilagor — kamera, bibliotek, PDF
- **M4**: Svenska scheman + giltighetslogik + reminders
- **M5**: Resevaccin
- **M6**: Export / partner-delning
- **M7**: E2E-tester + polish

## Tester

```bash
npm test                       # Jest unit-tester (M4 derive, validity, encrypt, travel)
```

### E2E (Maestro)

Maestro körs mot iOS-simulator eller Android-emulator och driver appen som en användare.

**Installera (en gång):**

```bash
brew install maestro
# eller: curl -Ls "https://get.maestro.mobile.dev" | bash
```

**Kör flöden:**

```bash
# Bygg och starta appen i simulatorn först (npx expo run:ios), sen:
maestro test .maestro/
```

Flöden i `.maestro/`:
- `01-onboarding.yaml` — Lås upp + skapa första profilen
- `02-add-vaccination.yaml` — Lägg till en vaccination, verifiera timeline
- `03-expected-dose-prefill.yaml` — Tap på "Snart" → form öppnas pre-filled
- `04-trip-recommendations.yaml` — Skapa Thailand-resa, verifiera Hep A
- `05-share-export.yaml` — Profilvy → Dela → PDF + krypterad fil syns
