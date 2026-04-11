/**
 * Human.exe – Design System Colors
 *
 * Research basis:
 *  - Indigo/periwinkle (primary): calm focus, trustworthiness, creativity —
 *    ideal for reducing task-initiation anxiety (per HCI literature on color & cognition)
 *  - Warm orange (accent): approachability, energy without aggression —
 *    used sparingly for primary CTAs to draw attention without pressure
 *  - Amber/gold (achievement): reward, warmth — reserved for streaks & milestones
 *    to trigger positive reinforcement loops (gamification research, Lieder 2024)
 *  - Soft green (success): growth, completion — signals mastery experiences (Bandura)
 *  - Warm off-white (background): reduces screen-induced cognitive load
 */

export const Colors = {
  // ── Brand Primary ────────────────────────────────────────────
  primary: '#5B5BD6',        // Indigo – calm, focused, trustworthy
  primaryLight: '#EDEDFF',   // Light indigo – subtle backgrounds
  primaryMid: '#8080E0',     // Mid indigo – pressed states
  primaryDark: '#3D3D9E',    // Dark indigo – active/selected

  // ── Accent ───────────────────────────────────────────────────
  accent: '#FF7B54',         // Warm orange – CTAs, highlight moments
  accentLight: '#FFF0EB',    // Light orange – badge backgrounds

  // ── Achievement / Gamification ───────────────────────────────
  gold: '#F0A500',           // Amber gold – streaks, milestones
  goldLight: '#FFF8E6',      // Light gold – streak background

  // ── Semantic ─────────────────────────────────────────────────
  success: '#3DB87A',        // Green – step completion, progress
  successLight: '#E8F8F0',   // Light green
  warning: '#F0A500',        // Warning = gold (reused intentionally)
  error: '#E85D5D',          // Error red
  errorLight: '#FDEAEA',

  // ── Neutrals ─────────────────────────────────────────────────
  background: '#F8F7FF',     // Warm off-white – main app background
  surface: '#FFFFFF',        // Card / modal surfaces
  surfaceElevated: '#F2F0FF',// Slightly elevated surface

  // ── Text ─────────────────────────────────────────────────────
  textPrimary: '#1C1B2E',    // Deep navy – primary text
  textSecondary: '#7B7BA0',  // Muted indigo-grey – secondary text
  textTertiary: '#AEAEC8',   // Placeholder, disabled
  textInverse: '#FFFFFF',    // Text on dark backgrounds

  // ── Borders & Dividers ───────────────────────────────────────
  border: '#E8E8F4',         // Subtle border
  borderActive: '#5B5BD6',   // Active input border (= primary)
  divider: '#F0EFF8',        // Section dividers

  // ── Overlay ──────────────────────────────────────────────────
  overlay: 'rgba(28, 27, 46, 0.5)',
  overlayLight: 'rgba(28, 27, 46, 0.08)',

  // ── Tab Bar ──────────────────────────────────────────────────
  tabActive: '#5B5BD6',
  tabInactive: '#AEAEC8',

  // ── Step States ──────────────────────────────────────────────
  stepComplete: '#3DB87A',
  stepActive: '#5B5BD6',
  stepPending: '#E8E8F4',

  // ── Transparent ──────────────────────────────────────────────
  transparent: 'transparent',
} as const;

export type ColorKey = keyof typeof Colors;
