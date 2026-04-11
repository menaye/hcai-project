# Architecture Overview

## Design philosophy

Every architectural decision in Human.exe derives from two sources:
1. **The needfinding report** — what students actually need
2. **HCAI principles** — how AI systems should serve human well-being

### Key decisions

#### Why Expo Router (not React Navigation)?
File-based routing eliminates boilerplate and makes screen structure obvious from the directory tree. Every team member can navigate the codebase by looking at `app/`.

#### Why Zustand (not Redux or Context)?
- Redux is overkill for this scale; its ceremony adds friction
- Context re-renders everything on state change — bad for animations
- Zustand is minimal, fast, and supports slice-based organization

#### Why Firebase free tier?
- No server infrastructure to manage (lets us focus on the product)
- Real-time sync via Firestore listeners
- Auth is handled completely
- Free tier is sufficient for a course project and prototype testing

#### Why Claude Haiku (not Sonnet/Opus)?
- Haiku is optimized for speed — interactive task decomposition must feel snappy
- Sonnet-level quality isn't needed for structured JSON output
- Significantly lower cost per token (important for a student project)

---

## Data flow

```
User action
    │
    ▼
Screen (React Native View)
    │
    ├──► Zustand store (local state, immediate UI update)
    │
    └──► Firebase service (persistence)
              │
              └──► Firestore onSnapshot listener
                        │
                        └──► Zustand store (synced back)
```

**AI flow** (separate from data flow):

```
User types assignment description
    │
    ▼
services/ai/claude.ts → Anthropic API → Claude Haiku
    │
    ▼
JSON response parsed → Task + Steps created locally
    │
    ▼
Saved to Firestore → Real-time listener updates UI
```

---

## Firestore data model

```
users/
  {uid}/
    displayName: string
    email?: string
    context?: string          ← AI personalization context
    onboardingComplete: bool
    createdAt: number

    tasks/
      {taskId}/
        title: string
        description: string
        status: 'active' | 'completed' | 'abandoned'
        steps: TaskStep[]     ← embedded array (not subcollection)
        dueAt?: number
        aiContext?: string    ← AI-generated motivational note
        createdAt: number
        updatedAt: number
        completedAt?: number

    streaks/
      current/
        currentStreak: number
        longestStreak: number
        lastActiveDate: 'YYYY-MM-DD'
        totalTasksCompleted: number
        totalStepsCompleted: number
```

**Why steps are embedded (not a subcollection):**
A task with its steps is always read together. Embedding avoids an extra round-trip and keeps writes atomic. Max steps per task is ~6, so document size is never a concern.

---

## Authentication flow

```
App launch
    │
    ├── No user ──► WelcomeScreen
    │       ├── Email sign up ──► OnboardingScreen ──► (tabs)
    │       ├── Email sign in ──► (tabs)
    │       └── Guest ──► OnboardingScreen ──► (tabs)
    │
    └── Existing user
            ├── onboardingComplete = false ──► OnboardingScreen
            └── onboardingComplete = true ──► (tabs)
```

---

## AI prompt architecture

The system prompt in `services/ai/claude.ts` encodes all design principles from the needfinding report. Key constraints enforced by the prompt:

| Research principle | Prompt enforcement |
|---|---|
| Steps must be small (§14.1) | "5–20 minutes, never more" |
| Specific, not generic (§14.2) | Uses actual assignment text in every call |
| Supportive tone (§14.5) | "Never make students feel guilty" |
| Structured output | Strict JSON schema, no markdown |

The model returns structured JSON parsed in the service layer, with a graceful fallback if parsing fails (so the app never crashes on a malformed response).

---

## Component hierarchy

```
RootLayout (_layout.tsx)
├── AuthLayout ((auth)/_layout.tsx)
│   ├── WelcomeScreen
│   └── OnboardingScreen
└── TabLayout ((tabs)/_layout.tsx)
    ├── HomeScreen
    │   └── HumanMascot, TaskCard, StreakBadge
    ├── TasksScreen
    │   └── TaskCard (FlatList)
    ├── TimelineScreen
    │   └── TimelineItem (FlatList)
    └── SettingsScreen
        └── HumanMascot, StatItem, SettingRow

Modal stack:
├── NewTaskScreen (task/new.tsx)
│   ├── InputPhase → Input + Button
│   ├── LoadingPhase → HumanMascot (thinking)
│   └── ReviewPhase → StepItem (preview)
└── TaskDetailScreen (task/[id].tsx)
    └── StepItem (interactive)
```

---

## Performance considerations

- **Firestore listeners** are set up once on auth and torn down on sign-out. No polling.
- **AI calls** are async and non-blocking. Loading states are shown immediately.
- **Animations** use `useNativeDriver: true` wherever possible (transform, opacity).
- **FlatList** is used for all list views to virtualize long lists.
- **Image assets**: The mascot is pure React Native shapes — no image loading, instant render.
