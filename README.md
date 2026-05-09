# Human.exe

> An AI-powered academic companion that helps university students overcome the psychological barrier of task initiation.

Built for **Intro to Human-Centered AI** at Johns Hopkins University by **Human.exe** — Michael Enaye, Jialin Fu, Jaya Surya V. M., Billy Presume, Yuting Yan.

---

## What it does

Human.exe tackles procrastination at its root: the moment of initiation. Instead of another calendar or focus timer, it:

1. **Accepts any assignment description** in plain language
2. **Uses AI** to decompose it into 4–6 small, concrete, immediately actionable steps
3. **Tracks progress** as steps are completed, with real-time encouragement
4. **Builds streaks** to reinforce the habit of starting
5. **Focus Mode** — one-step-at-a-time view for deep work sessions
6. **Multi-provider AI** — swap between Anthropic Claude, OpenAI, local Ollama, or mock
7. **Stats dashboard** — beautiful charts showing completion rate, weekly activity, and streaks
8. **Task queue** — plan ahead by queuing tasks without starting them yet

**Core insight from our research:** Motivation follows action — it doesn't precede it. The app's job is to make the first action feel small enough to actually take.

---

## Features

- AI task decomposition into 4–6 concrete steps (Anthropic / OpenAI / Ollama / Mock)
- Focus Mode: minimal one-step-at-a-time view
- Step-level progress tracking with undo support
- Streak system: current streak, longest streak, step history
- Stats screen: completion rate donut, 7-day bar chart, breakdown grid
- Task lifecycle: Active → Queued → Paused → Completed
- Inline step editing (long-press a step)
- Task editing: title, deadline, personal target date
- Priority tags (Low / Medium / High / Urgent)
- Self-reward / consequence reminders
- Animated mascot companion with blink, bob, and state expressions
- Settings: AI provider picker, API key management, preference toggles
- Full offline-capable mock mode (no credentials needed to run)

---

## Tech stack

| Layer | Technology |
|---|---|
| Mobile framework | React Native + Expo (cross-platform iOS/Android/Web) |
| Navigation | Expo Router (file-based) |
| Language | TypeScript (strict mode) |
| State management | Zustand |
| Backend / DB | Firebase Firestore (free Spark tier) |
| Authentication | Firebase Auth (email/password + anonymous) |
| AI | Multi-provider: Anthropic Claude (`claude-sonnet-4-6` default), OpenAI, Ollama, or Mock |
| Animations | React Native Reanimated |

---

## Project structure

```
hcai-project/
├── app/                        # Expo Router screens (file = route)
│   ├── _layout.tsx             # Root layout — auth listener
│   ├── index.tsx               # Entry redirect
│   ├── (auth)/
│   │   ├── welcome.tsx         # Sign in / sign up / guest
│   │   └── onboarding.tsx      # Minimal user context collection
│   ├── (tabs)/
│   │   ├── index.tsx           # Home — mascot + active task
│   │   ├── tasks.tsx           # Task list with filters (active/queued/done/paused/all)
│   │   ├── timeline.tsx        # Progress journey view
│   │   ├── stats.tsx           # Stats dashboard (new)
│   │   └── settings.tsx        # Profile + AI settings + preferences
│   └── task/
│       ├── new.tsx             # AI task creation (3-phase flow)
│       └── [id].tsx            # Task detail + step completion
│
├── components/
│   ├── ui/                     # Design system primitives
│   │   ├── Typography.tsx      # Text variants
│   │   ├── Button.tsx          # 4 variants × 3 sizes
│   │   ├── Card.tsx            # Surface container
│   │   ├── Input.tsx           # Animated focus input
│   │   ├── ProgressBar.tsx     # Animated spring progress
│   │   └── Chip.tsx            # Filter / status chips
│   ├── mascot/
│   │   └── HumanMascot.tsx     # Animated companion character
│   ├── task/
│   │   ├── TaskCard.tsx        # Task summary card
│   │   ├── StepItem.tsx        # Individual step with completion
│   │   └── StreakBadge.tsx     # Flame streak display
│   └── timeline/
│       └── TimelineItem.tsx    # Chronological task entry
│
├── constants/
│   ├── colors.ts               # Research-backed color palette
│   ├── typography.ts           # Modular scale type system
│   └── spacing.ts              # 4px base unit spacing
│
├── services/
│   ├── firebase/
│   │   ├── config.ts           # Firebase init + MOCK_MODE flag
│   │   ├── auth.ts             # Auth operations
│   │   └── firestore.ts        # Data access layer (real + mock)
│   ├── ai/
│   │   ├── claude.ts           # Facade — call this from screens
│   │   ├── factory.ts          # Provider selection (reads settingsStore)
│   │   ├── prompts.ts          # Shared system prompt + JSON parsers
│   │   ├── types.ts            # AIProvider interface
│   │   └── providers/
│   │       ├── anthropic.ts    # Anthropic SDK provider
│   │       ├── openai.ts       # Fetch-based OpenAI provider
│   │       ├── ollama.ts       # Ollama (extends OpenAI, local)
│   │       └── mock.ts         # Mock provider (no network)
│   └── mock/
│       ├── mockAI.ts           # Mock AI responses
│       └── store.ts            # In-memory Firestore mock
│
├── store/
│   ├── authStore.ts            # Auth + profile state (Zustand)
│   ├── taskStore.ts            # Tasks + streak state (Zustand)
│   └── settingsStore.ts        # AI provider + preferences (Zustand)
│
├── hooks/
│   ├── useAuth.ts              # Firebase auth subscriber
│   └── useTasks.ts             # Firestore task subscriber
│
├── types/
│   └── index.ts                # Shared TypeScript types
│
├── utils/
│   ├── dateUtils.ts            # Date formatting helpers
│   └── idUtils.ts              # ID generation
│
└── docs/
    ├── ARCHITECTURE.md         # System design decisions
    └── BRANCHING.md            # Git workflow standards
```

---

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npm install -g expo-cli`)
- iOS Simulator (macOS) or Android emulator, or the Expo Go app on a physical device

### 1. Clone and install

```bash
git clone https://github.com/YOUR_ORG/hcai-project.git
cd hcai-project
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in `.env` with:
- **Firebase**: Create a project at [console.firebase.google.com](https://console.firebase.google.com). Enable **Authentication** (Email/Password + Anonymous) and **Firestore Database** (start in test mode initially).
- **Anthropic**: Get an API key at [console.anthropic.com](https://console.anthropic.com).

### 3. Run the app

```bash
npm run ios       # iOS Simulator
npm run android   # Android emulator
npm run web       # Browser (limited features)
```

Or scan the QR code with **Expo Go** after running `npm start`.

---

## Firebase setup (free tier)

1. Go to [Firebase Console](https://console.firebase.google.com) → New project
2. **Authentication** → Sign-in method → Enable **Email/Password** and **Anonymous**
3. **Firestore Database** → Create database → Start in **test mode**
4. **Project Settings** → Your apps → Add Web app → Copy config values to `.env`

**Free tier limits** (Spark plan — no credit card required):
- Firestore: 1 GiB storage, 50K reads/day, 20K writes/day
- Auth: Unlimited

---

## Design system

### Color palette

| Token | Hex | Usage |
|---|---|---|
| `primary` | `#5B5BD6` | Buttons, active states, focus |
| `primaryLight` | `#EDEDFF` | Backgrounds, chips |
| `accent` | `#FF7B54` | Primary CTAs, warmth |
| `gold` | `#F0A500` | Streaks, achievements |
| `success` | `#3DB87A` | Completions, progress |
| `background` | `#F8F7FF` | App background |
| `textPrimary` | `#1C1B2E` | Main text |

**Color research basis:** Indigo reduces anxiety and signals calm focus (HCAI literature). Warm orange for CTAs creates approachability without pressure. Gold for achievements triggers positive reinforcement (Lieder 2024 gamification research).

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full workflow.

**Quick reference:**

```bash
# Start from develop, always
git checkout develop && git pull

# Create a feature branch
git checkout -b feature/your-feature-name

# Push and open PR to develop
git push -u origin feature/your-feature-name
```

Branch naming: `feature/`, `fix/`, `design/`, `chore/`, `docs/`

---

## Team

| Name | GitHub |
|---|---|
| Michael Enaye | @menaye |
| Jialin Fu | @jialin-fu07 |
| Jaya Surya V. M. | @learner-3002 |
| Billy Presume | @Billy-Presume |
| Yuting Yan | @YutingYantina |

---

*Intro to Human-Centered AI · Johns Hopkins University · Spring 2026*
