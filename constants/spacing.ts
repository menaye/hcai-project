/**
 * Human.exe – Spacing & Layout System
 *
 * 4px base unit system for consistent spacing.
 * Border radii designed for a friendly, soft feel — matching the
 * supportive, non-threatening tone of the app.
 */

export const Spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const;

export const Radius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

export const Shadow = {
  none: {},
  sm: {
    shadowColor: '#1C1B2E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#1C1B2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#5B5BD6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
} as const;

export const Layout = {
  screenPaddingH: 20,
  screenPaddingV: 24,
  tabBarHeight: 80,
  headerHeight: 56,
  inputHeight: 52,
  buttonHeight: 52,
  stepItemHeight: 60,
  cardRadius: Radius.xl,
} as const;
