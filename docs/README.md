# GabAI

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
