# Contributing to Human.exe

This document defines the team workflow for collaborative development.

---

## Git branching strategy

We use **GitHub Flow** (simplified), with a `develop` integration branch.

```
main        ← production / demo-ready code only
  └── develop     ← integration branch (all features merge here first)
        ├── feature/ai-task-retry
        ├── fix/streak-count-off-by-one
        ├── design/home-screen-mascot
        └── chore/update-firebase-rules
```

### Branch types

| Prefix | Purpose | Example |
|---|---|---|
| `feature/` | New feature or screen | `feature/timeline-animations` |
| `fix/` | Bug fix | `fix/step-completion-not-saving` |
| `design/` | UI/UX work (no logic changes) | `design/onboarding-flow` |
| `chore/` | Config, tooling, deps | `chore/upgrade-expo-54` |
| `docs/` | Documentation only | `docs/firebase-setup-guide` |

---

## Daily workflow

### Starting new work

```bash
# Always start from develop, never from main
git checkout develop
git pull origin develop

# Create your branch
git checkout -b feature/your-feature-name
```

### Committing

Write commit messages in the imperative mood, referencing what and why:

```
feat: add step regeneration button to task detail screen
fix: streak not incrementing when task completed on same day
design: update mascot animation to use spring physics
docs: add Firebase Firestore security rules to setup guide
```

**Commit format:**
```
<type>: <short description (≤ 72 chars)>

[optional body explaining WHY, not what]
```

Types: `feat`, `fix`, `design`, `chore`, `docs`, `refactor`, `test`

### Opening a pull request

1. Push your branch: `git push -u origin feature/your-feature-name`
2. Open a PR from your branch **to `develop`** (never directly to `main`)
3. PR title = commit message format
4. Fill in the PR template:
   - **What changed** (brief)
   - **Why** (link to research/design decision if relevant)
   - **How to test**
   - **Screenshots** (required for any UI changes)
5. Request review from at least **one other team member**
6. Address all comments before merging

### Merging to main

`main` is merged from `develop` only when:
- The feature is fully working
- At least one team member has reviewed
- The app builds and runs on both iOS and Android

The team lead (Billy) merges to `main` after group agreement.

---

## Code standards

### TypeScript

- Strict mode is enabled. No `any` unless absolutely unavoidable (and comment why).
- Export types from `types/index.ts`, not inline.
- Prefer `interface` for objects, `type` for unions.

### Components

- One component per file.
- Props interface at the top of the file.
- No inline styles for repeated patterns — use `StyleSheet.create()`.
- All UI strings go through `Typography` components for consistent styling.

### File naming

| Type | Convention | Example |
|---|---|---|
| Components | `PascalCase.tsx` | `TaskCard.tsx` |
| Screens | `camelCase.tsx` | `index.tsx` |
| Utilities | `camelCase.ts` | `dateUtils.ts` |
| Constants | `camelCase.ts` | `colors.ts` |
| Types | `camelCase.ts` | `index.ts` |

### Imports

Order: external packages → internal absolute → relative

```typescript
// 1. External
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

// 2. Internal (absolute from root)
import { Colors } from '../../constants/colors';
import { Button } from '../../components/ui';

// 3. Types
import type { Task } from '../../types';
```

---

## Environment variables

- Never commit `.env` — it's in `.gitignore`
- Update `.env.example` when you add a new variable
- Prefix all Expo public vars with `EXPO_PUBLIC_`

---

## Firebase security rules

Before merging any feature that touches Firestore, verify security rules in `firestore.rules`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Each user can only read/write their own data. No exceptions.

---

## Getting unstuck

If you're blocked, open a GitHub issue with label `help wanted` and tag the relevant team member. Don't sit on a blocker for more than a day.
