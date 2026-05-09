# CLAUDE.md — Human.exe Codebase Guide

## What is Human.exe?

Human.exe is an AI-powered task-initiation app for university students built with React Native + Expo.
Its core insight (from needfinding research at Johns Hopkins) is that students don't struggle to do work — they
struggle to _start_ it. The app uses AI to decompose any assignment into small, concrete, immediately actionable
steps, removing the "blank page" barrier.

## How to run

```bash
npm install
npx expo start          # opens Expo DevTools; scan QR with Expo Go
npx expo start --ios    # iOS simulator
npx expo start --android
```

No real credentials are needed. By default the app runs in **mock mode** (fake Firebase + fake AI).
To connect real services, copy `.env.example` → `.env` and fill in values.

## Architecture decisions

### Routing — Expo Router (file-based)
- `app/(tabs)/` — tab screens (index, tasks, timeline, stats, settings)
- `app/(auth)/` — onboarding screens
- `app/task/[id].tsx` — task detail (dynamic route)
- `app/task/new.tsx` — new task creation (AI decomposition flow)

### State — Zustand (no Redux)
- `store/authStore.ts` — Firebase user + UserProfile
- `store/taskStore.ts` — tasks[], streak, AI loading state
- `store/settingsStore.ts` — AI provider config, preferences (in-memory only)

Zustand was chosen over Redux for its minimal boilerplate and synchronous reads (`getState()`).

### AI — Multi-provider architecture
All AI calls go through a single facade in `services/ai/claude.ts` which delegates
to the factory (`services/ai/factory.ts`) that returns the right provider based on settings:

```
claude.ts (facade)
    └─► factory.ts (reads settingsStore)
            ├─► providers/anthropic.ts  (@anthropic-ai/sdk)
            ├─► providers/openai.ts     (fetch-based, no package)
            ├─► providers/ollama.ts     (extends OpenAI provider, local)
            └─► providers/mock.ts       (wraps mockAI.ts, no network)
```

All providers implement the `AIProvider` interface in `services/ai/types.ts`.
The mock provider is used when MOCK_MODE is true OR when no API key is configured.

**Default model**: `claude-sonnet-4-6` (upgraded from Haiku for better quality).

### Firebase — Mock layer
`services/firebase/config.ts` exports `MOCK_MODE`. When true, all Firestore/Auth
calls are intercepted by `services/mock/store.ts` (an in-memory store with subscriber
pattern that mimics Firestore real-time listeners).

## Key files

| File | Purpose |
|------|---------|
| `types/index.ts` | All shared TypeScript types |
| `constants/colors.ts` | Design system palette |
| `constants/spacing.ts` | 4px base unit spacing + radius + shadow |
| `constants/typography.ts` | Text style definitions |
| `components/ui/` | Button, Card, Input, Chip, ProgressBar, Typography |
| `components/task/StepItem.tsx` | Single step row with completion animation |
| `components/task/TaskCard.tsx` | Task list card |
| `components/mascot/HumanMascot.tsx` | Animated blob character (pure RN, no SVG) |
| `services/ai/claude.ts` | AI facade — call this from screens |
| `services/ai/factory.ts` | Provider selection logic |
| `services/ai/prompts.ts` | Shared system prompt + JSON parsing |
| `services/firebase/firestore.ts` | Data layer with mock fallback |
| `utils/dateUtils.ts` | Date formatting helpers |
| `utils/idUtils.ts` | ID generation |

## Testing approach

Currently all tests are manual via the Expo Go app.

**Mock mode** (default): no credentials needed, realistic UX with simulated delays.
To enable real services:
1. Set `EXPO_PUBLIC_FIREBASE_API_KEY` (and related vars) → real Firestore + Auth
2. Set `EXPO_PUBLIC_ANTHROPIC_API_KEY` → real Claude API (defaults to Anthropic provider)
3. Or set provider in Settings → AI Settings → pick OpenAI/Ollama/Mock

## Code conventions

- **TypeScript strict**: all files fully typed; no `any` unless truly unavoidable
- **StyleSheet.create**: all styles in StyleSheet, never inline object literals
- **No `any` imports**: import types with `type` keyword
- **Design system only**: use `Colors.*`, `Spacing[n]`, `Radius.*`, `Shadow.*` — no magic numbers
- **Components**: functional only, hooks at top level
- **Screens**: default export from route file; helper components in same file if small
- **AI calls**: always via `services/ai/claude.ts` — never import providers directly from screens
- **Firebase calls**: always via `services/firebase/firestore.ts` or `auth.ts`

## TaskStatus values

`'active' | 'completed' | 'abandoned' | 'inactive' | 'queued'`

- `active` — currently being worked on
- `queued` — planned but not yet started
- `inactive` — paused / backburner
- `completed` — all steps done
- `abandoned` — deleted (soft-delete, hidden from UI)

## AI system prompt

Defined in `services/ai/prompts.ts` (`SYSTEM_PROMPT`). Key principles:
- Warm, grounded voice (not falsely cheerful)
- Steps must be 5–20 min, concrete and specific
- First step = lowest friction entry point
- Reject off-topic/illegal/dishonest requests with `{"rejected": true, "reason": "..."}`
- Always return valid JSON only
