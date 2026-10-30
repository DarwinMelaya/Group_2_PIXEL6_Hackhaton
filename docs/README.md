# GabAI

Offline-first safety companion for Marinduque, PH. Expo SDK 58 / React Native, iOS & Android (web for previews).

## Features

### GabAI Assistant (chatbot)

- **Three AI modes**, switchable in Chatbot settings:
  - **Local AI** — Gemma 4 E2B runs on-device via llama.rn (optional 2.8 GB download, native only). Without it, the built-in guides answer instead.
  - **Cloud AI** — Google Gemini. Bring your own free API key (stored in SecureStore, never backed up).
  - **Custom backend** — any OpenAI-compatible server (Ollama, LM Studio, llama.cpp, vLLM) with optional bearer token.
- **Automatic model selection** — fetches the models your key can actually call (`models.list`, cached), prefers the cheapest free-tier-friendly catalog model, and respects vision requirements. Manual override in settings; unavailable models are shown disabled.
- **Photo analysis** — attach a photo from the camera or library with optional extra context; Gemini vision models analyze it (inline data, ~20 MB request cap). Local/guide fallback says so honestly instead of pretending.
- **Graceful fallback** — cloud/custom failure → local model → bundled-guide keyword retrieval, with a banner explaining which layer answered.
- **Token usage dialog** — per-source usage ring (only the active source is shown), resettable budgets.
- Reply length (short/detailed) applies to local and cloud replies.
- **Voice input** requires a development build containing `expo-speech-recognition`. After adding or upgrading the native package, build a new Android APK with `npx eas-cli@latest build --platform android --profile development` and install it, then run `npx expo start --dev-client`. The microphone stays visible; Expo Go, older builds, and unsupported devices explain why voice is unavailable when it is tapped. Web previews use the browser's speech recognition when supported.

### Safety content

- **Disaster guides** — before/during/after steps for local hazards (draft; needs authority review).
- **Emergency hotlines** — GPS resolves your barangay → municipal contacts, plus national and provincial numbers; tap to call. Manual municipality picker as fallback.

### Capture

- Camera or library photos saved on-device as a visual log; "Ask GabAI" sends a shot to the chat for analysis.

### Profile & data

- Emergency profile (personal, health, contact info) stored locally in SQLite.
- JSON backup export/import; clear-all-data. Onboarding with nickname on first launch.
- Light/dark/system theme and in-app text-size scaling.
- Web preview support via per-platform `.web.ts` fallbacks (no local model or filesystem on web).

## Project structure

```
gabai/
├── app.json                      # Expo config (CNG — no ios/ or android/ dirs)
├── eslint.config.js
├── metro.config.js
├── tsconfig.json
├── package.json
├── AGENTS.md
├── assets/                       # App icons & splash
│   ├── android-icon-background.png
│   ├── android-icon-foreground.png
│   ├── android-icon-monochrome.png
│   ├── favicon.png
│   ├── icon.png
│   └── splash-icon.png
├── docs/
│   └── README.md
└── src/
    ├── app/                      # Expo Router routes only
    │   ├── _layout.tsx           # Root stack (Stack.Protected onboarding gate)
    │   ├── +not-found.tsx
    │   ├── onboarding.tsx
    │   ├── settings.tsx
    │   ├── chat-settings.tsx     # AI mode: local Gemma / Gemini / custom backend
    │   ├── emergency.tsx
    │   ├── (tabs)/
    │   │   ├── _layout.tsx
    │   │   ├── index.tsx         # Home
    │   │   ├── guides.tsx
    │   │   ├── capture.tsx
    │   │   ├── chat.tsx          # AI chatbot
    │   │   └── profile.tsx
    │   ├── guide/
    │   │   └── [id].tsx          # formSheet
    │   └── profile/
    │       └── [group].tsx
    ├── components/
    │   ├── AppHeader.tsx
    │   ├── CalendarModal.tsx
    │   ├── DateField.tsx
    │   ├── EmergencyFab.tsx
    │   ├── GuideIllustration.tsx
    │   ├── MarinduqueScene.tsx
    │   ├── ProfileFieldInput.tsx
    │   ├── SafetyTipCard.tsx
    │   ├── SelectField.tsx
    │   ├── TabBar.tsx
    │   ├── TokenUsageModal.tsx
    │   ├── WeatherCard.tsx
    │   └── ui/                   # Themed primitives
    │       ├── AppText.tsx
    │       ├── Button.tsx
    │       ├── GroupedCard.tsx
    │       ├── Icon.tsx
    │       ├── IconTile.tsx
    │       ├── Layout.tsx
    │       ├── ListRow.tsx
    │       ├── Screen.tsx
    │       └── Touchable.tsx
    ├── data/                     # Bundled static content (draft, needs review)
    │   ├── ai.ts
    │   ├── barangayCentroids.ts
    │   ├── barangays.ts
    │   ├── contacts.ts           # Emergency hotlines
    │   ├── guides.ts
    │   ├── profile.ts
    │   ├── profileValidation.ts
    │   └── safetyTips.ts
    ├── db/                       # expo-sqlite (async APIs only)
    │   ├── migrations.ts         # Append-only, PRAGMA user_version
    │   ├── chat.ts
    │   ├── photos.ts
    │   ├── profile.ts
    │   ├── settings.ts
    │   ├── tokenUsage.ts
    │   └── webDatabaseLock.ts
    ├── providers/
    │   └── SettingsProvider.tsx  # Sync boot read to avoid theme flash
    ├── services/
    │   ├── assistant.ts          # Dispatcher: cloud/custom → local model → guide retrieval
    │   ├── attachment.ts         # Camera/library capture → chat photo attachment
    │   ├── customBackend.ts      # OpenAI-compatible server (Ollama, LM Studio…)
    │   ├── gemini.ts
    │   ├── geminiModels.ts       # models.list discovery + auto model selection
    │   ├── localModel.ts         # llama.rn Gemma 4 E2B
    │   ├── localModel.web.ts
    │   ├── deviceSpecs.ts
    │   ├── deviceSpecs.web.ts
    │   ├── appData.ts            # Clear all user data
    │   └── location.ts           # GPS → nearest barangay
    ├── storage/                  # expo-file-system (File/Directory/Paths)
    │   ├── photos.ts
    │   ├── photos.web.ts
    │   ├── backup.ts
    │   ├── backup.web.ts
    │   ├── backupFormat.ts
    │   ├── secrets.ts            # expo-secure-store (Gemini key)
    │   └── secrets.web.ts
    ├── theme/
    │   ├── tokens.ts             # Palette, spacing, type ramp
    │   └── useTheme.ts
    └── utils/
        ├── dialogs.ts
        ├── dialogs.web.ts
        └── navigation.ts
```
