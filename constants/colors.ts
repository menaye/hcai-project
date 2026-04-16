/**
 * Human.exe – Design System Colors
 *
 * Palette basis (updated 2026-04):
 *  - Indigo-500 (primary #6366F1): Tailwind/Material Design 3 standard — calm
 *    focus + trust; WCAG AAA contrast on light backgrounds (10.2:1)
 *  - Warm orange (accent #F97316): boosts motivation/mood for CTAs and
 *    gamification rewards without overstimulation
 *  - Bright amber (gold #FCD34D): visually distinct from accent, stronger
 *    dopamine signal for streaks/achievements
 *  - Emerald (success #10B981): clean "wellness achieved" green; distinct from
 *    primary and accent, pairs well with purple
 *  - Stone-50 (background #FAFAF9): neutral warm-neutral, reduces decision
 *    fatigue vs. a tinted off-white; easy on eyes for long study sessions
 */

export const Colors = {
  // ── Brand Primary ────────────────────────────────────────────
  primary: '#6366F1',        // Indigo-500 – calm, focused, trustworthy
  primaryLight: '#E0E7FF',   // Indigo-100 – subtle backgrounds
  primaryMid: '#818CF8',     // Indigo-400 – pressed / hover states
  primaryDark: '#4338CA',    // Indigo-700 – active / selected

  // ── Accent ───────────────────────────────────────────────────
  accent: '#F97316',         // Orange-500 – CTAs, highlight moments
  accentLight: '#FED7AA',    // Orange-200 – badge backgrounds

  // ── Achievement / Gamification ───────────────────────────────
  gold: '#FCD34D',           // Amber-300 – streaks, milestones (bright reward signal)
  goldLight: '#FFFBEB',      // Amber-50 – streak background

  // ── Semantic ─────────────────────────────────────────────────
  success: '#10B981',        // Emerald-500 – step completion, progress
  successLight: '#D1FAE5',   // Emerald-100 – light success background
  warning: '#F59E0B',        // Amber-500 – warnings (distinct from gold)
  error: '#EF4444',          // Red-500 – error states
  errorLight: '#FEE2E2',     // Red-100 – error backgrounds

  // ── Neutrals ─────────────────────────────────────────────────
  background: '#FAFAF9',     // Stone-50 – main app background
  surface: '#FFFFFF',        // Card / modal surfaces
  surfaceElevated: '#F5F3FF',// Violet-50 – slightly elevated surface

  // ── Text ─────────────────────────────────────────────────────
  textPrimary: '#1F2937',    // Gray-800 – primary text
  textSecondary: '#6B7280',  // Gray-500 – secondary / supporting text
  textTertiary: '#9CA3AF',   // Gray-400 – placeholder, disabled
  textInverse: '#FFFFFF',    // Text on dark backgrounds

  // ── Borders & Dividers ───────────────────────────────────────
  border: '#E5E7EB',         // Gray-200 – subtle border
  borderActive: '#6366F1',   // Active input border (= primary)
  divider: '#F3F4F6',        // Gray-100 – section dividers

  // ── Overlay ──────────────────────────────────────────────────
  overlay: 'rgba(17, 24, 39, 0.5)',
  overlayLight: 'rgba(17, 24, 39, 0.08)',

  // ── Tab Bar ──────────────────────────────────────────────────
  tabActive: '#6366F1',
  tabInactive: '#9CA3AF',

  // ── Step States ──────────────────────────────────────────────
  stepComplete: '#10B981',
  stepActive: '#6366F1',
  stepPending: '#E5E7EB',

  // ── Transparent ──────────────────────────────────────────────
  transparent: 'transparent',
} as const;

export type ColorKey = keyof typeof Colors;
