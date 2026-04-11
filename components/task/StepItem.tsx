/**
 * StepItem – renders one AI-generated step with its completion state
 *
 * Design principles:
 *  - Steps feel like small mastery experiences (Bandura) — satisfying to check
 *  - Active step is visually prominent to reduce decision about what to do next
 *  - Non-active steps are muted, reducing cognitive noise
 */

import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Colors } from '../../constants/colors';
import { Radius, Spacing, Shadow } from '../../constants/spacing';
import { Typography } from '../ui/Typography';
import type { TaskStep } from '../../types';

interface StepItemProps {
  step: TaskStep;
  onComplete: (stepId: string) => void;
  onPress?: (step: TaskStep) => void;
}

export function StepItem({ step, onComplete, onPress }: StepItemProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const isCompleted = step.status === 'completed';
  const isActive = step.status === 'active';
  const isPending = step.status === 'pending';

  const handleCheckPress = () => {
    if (isCompleted) return;
    // Satisfying spring animation
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.94, useNativeDriver: true, damping: 8 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 10 }),
    ]).start(() => onComplete(step.id));
  };

  const containerBg = isActive
    ? Colors.surface
    : isCompleted
    ? Colors.successLight
    : Colors.background;

  const borderColor = isActive ? Colors.primary : isCompleted ? Colors.success : Colors.border;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => onPress?.(step)}
        style={[
          styles.container,
          {
            backgroundColor: containerBg,
            borderColor,
            ...(isActive ? Shadow.sm : {}),
          },
        ]}
      >
        {/* Step number / check */}
        <TouchableOpacity
          onPress={handleCheckPress}
          style={[styles.check, { borderColor, backgroundColor: isCompleted ? Colors.success : Colors.transparent }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {isCompleted ? (
            <Typography variant="caption" color={Colors.textInverse} style={styles.checkmark}>
              ✓
            </Typography>
          ) : (
            <Typography variant="caption" color={isActive ? Colors.primary : Colors.textTertiary} style={styles.stepNum}>
              {step.order}
            </Typography>
          )}
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.content}>
          <Typography
            variant="body"
            color={isCompleted ? Colors.textSecondary : isActive ? Colors.textPrimary : Colors.textTertiary}
            style={[isCompleted && styles.strikethrough, isActive && styles.activeBold]}
          >
            {step.title}
          </Typography>

          {isActive && step.estimatedMinutes && (
            <View style={styles.meta}>
              <Typography variant="caption" color={Colors.textTertiary}>
                ~{step.estimatedMinutes} min
              </Typography>
            </View>
          )}
        </View>

        {/* Active indicator */}
        {isActive && (
          <View style={styles.activeDot} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    marginBottom: Spacing[2] + 2,
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing[3],
    flexShrink: 0,
  },
  checkmark: {
    fontWeight: '700',
    fontSize: 13,
  },
  stepNum: {
    fontWeight: '600',
    fontSize: 12,
  },
  content: {
    flex: 1,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  activeBold: {
    fontWeight: '600',
  },
  meta: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginLeft: Spacing[2],
    flexShrink: 0,
  },
});
