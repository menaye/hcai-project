import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Radius, Spacing } from '../../constants/spacing';
import { Typography } from '../ui/Typography';

interface StreakBadgeProps {
  streak: number;
  size?: 'sm' | 'md';
}

export function StreakBadge({ streak, size = 'md' }: StreakBadgeProps) {
  if (streak === 0) return null;

  const isSm = size === 'sm';

  return (
    <View style={[styles.badge, isSm && styles.badgeSm]}>
      <Typography
        variant={isSm ? 'caption' : 'label'}
        style={styles.emoji}
      >
        🔥
      </Typography>
      <Typography
        variant={isSm ? 'caption' : 'bodySmall'}
        color={Colors.gold}
        style={styles.count}
      >
        {streak}
      </Typography>
      {!isSm && (
        <Typography variant="caption" color={Colors.textSecondary}>
          {streak === 1 ? 'day streak' : 'day streak'}
        </Typography>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.goldLight,
    paddingVertical: Spacing[1] + 2,
    paddingHorizontal: Spacing[3],
    borderRadius: Radius.full,
    gap: Spacing[1],
  },
  badgeSm: {
    paddingVertical: Spacing[1],
    paddingHorizontal: Spacing[2],
  },
  emoji: {
    fontSize: 14,
  },
  count: {
    fontWeight: '700',
  },
});
