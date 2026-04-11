# Git Branching Standards

## Branch diagram

```
main ──────────────────────────────────────────────────────► (demo / production)
  │                                        ▲
  └──► develop ──────────────────────────►─┘  (PR reviewed by team lead)
           │              ▲
           ├──► feature/ai-task-retry ──────►─┤
           ├──► fix/streak-bug ──────────────►─┤  (PR to develop, 1 reviewer min)
           ├──► design/home-layout ─────────►─┤
           └──► chore/upgrade-deps ─────────►─┘
```

## Rules

1. **Never push directly to `main`** — always via PR from `develop`
2. **Never push directly to `develop`** — always via PR from a feature branch
3. **One concern per branch** — don't mix feature work with bug fixes
4. **Delete branches after merge** — keep the remote clean
5. **Branch names are lowercase with hyphens** — no underscores, no CamelCase

## Naming conventions

```
feature/<short-description>     # New capability
fix/<what-was-broken>           # Bug repair
design/<screen-or-component>    # Visual/UX changes only
chore/<task>                    # Maintenance, deps, config
docs/<what-you-wrote>           # Documentation only
```

## Commit message format

```
<type>(<scope>): <description>

[optional body]
```

**Types:** `feat` `fix` `design` `chore` `docs` `refactor` `test`

**Scope** (optional): `home` `tasks` `ai` `auth` `firebase` `components`

**Examples:**
```
feat(ai): add step regeneration from task detail screen
fix(streak): off-by-one when task completed after midnight
design(home): reduce mascot size on small screens
chore: upgrade expo-router to 6.0.23
docs: add Firestore security rules to CONTRIBUTING.md
```

## Pull request checklist

Before requesting review:

- [ ] Branch is up to date with `develop` (`git fetch && git rebase origin/develop`)
- [ ] App runs on iOS or Android without errors
- [ ] No `console.log` left in production code
- [ ] Screenshots attached (for any UI change)
- [ ] `.env.example` updated if new env vars were added
- [ ] Types updated in `types/index.ts` if data model changed

## Handling conflicts

```bash
# Update your branch with latest develop
git fetch origin
git rebase origin/develop

# If conflicts: resolve, then
git add .
git rebase --continue

# Push (rebase rewrites history, so force-push to your own branch is OK)
git push --force-with-lease
```

Never force-push to `develop` or `main`.
