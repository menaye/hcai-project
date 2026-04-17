/**
 * StepItem – renders one AI-generated step with its completion state
 *
 * Design principles:
 *  - Steps feel like small mastery experiences (Bandura) — satisfying to check
 *  - Active step is visually prominent to reduce decision about what to do next
 *  - Non-active steps are muted, reducing cognitive noise
 *  - Completed steps can be un-checked to recover from mistakes
 */

import React, { useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Radius, Spacing, Shadow } from '../../constants/spacing';
import { Typography } from '../ui/Typography';
import type { TaskStep } from '../../types';

interface StepItemProps {
  step: TaskStep;
  onComplete: (stepId: string) => void;
  onUncheck?: (stepId: string) => void;
  onPress?: (step: TaskStep) => void;
  onLongPress?: (step: TaskStep) => void;
}

export function StepItem({ step, onComplete, onUncheck, onPress, onLongPress }: StepItemProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [expanded, setExpanded] = useState(false);

  const isCompleted = step.status === 'completed';
  const isActive = step.status === 'active';
  const isPending = step.status === 'pending';

  const handleCheckPress = () => {
    if (isCompleted) {
      if (!onUncheck || !step.id) return;
      Alert.alert(
        'Un-mark this step?',
        'This will mark it as incomplete again.',
        [
          { text: 'Keep it done', style: 'cancel' },
          { text: 'Un-mark', onPress: () => onUncheck(step.id) },
        ],
      );
      return;
    }
    if (!step.id) return;
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

  const hasDetail = !!step.detail;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={hasDetail ? 0.85 : 1}
        onPress={() => {
          if (hasDetail && (isActive || isCompleted)) setExpanded((e) => !e);
          onPress?.(step);
        }}
        onLongPress={() => onLongPress?.(step)}
        delayLongPress={400}
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
          style={[
            styles.check,
            {
              borderColor,
              backgroundColor: isCompleted ? Colors.success : Colors.transparent,
            },
          ]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {isCompleted ? (
            <Typography variant="caption" color={Colors.textInverse} style={styles.checkmark}>
              ✓
            </Typography>
          ) : (
            <Typography
              variant="caption"
              color={isActive ? Colors.primary : Colors.textTertiary}
              style={styles.stepNum}
            >
              {step.order}
            </Typography>
          )}
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.content}>
          <Typography
            variant="body"
            color={
              isCompleted
                ? Colors.textSecondary
                : isActive
                ? Colors.textPrimary
                : Colors.textTertiary
            }
            style={[isCompleted && styles.strikethrough, isActive && styles.activeBold]}
          >
            {step.title}
          </Typography>

          {/* Detail (shown when expanded or active) */}
          {hasDetail && (isActive || expanded) && (
            <Typography
              variant="caption"
              color={Colors.textSecondary}
              style={styles.detail}
            >
              {step.detail}
            </Typography>
          )}

          {isActive && step.estimatedMinutes && (
            <View style={styles.meta}>
              <Ionicons name="time-outline" size={11} color={Colors.textTertiary} />
              <Typography variant="caption" color={Colors.textTertiary}>
                ~{step.estimatedMinutes} min
              </Typography>
            </View>
          )}
        </View>

        {/* Expand indicator for steps with detail */}
        {hasDetail && !isActive && !isPending && (
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={Colors.textTertiary}
            style={styles.expandIcon}
          />
        )}

        {/* Active indicator */}
        {isActive && <View style={styles.activeDot} />}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    marginTop: 1,
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
    gap: 4,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  activeBold: {
    fontWeight: '600',
  },
  detail: {
    lineHeight: 18,
    marginTop: 2,
  },
  meta: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expandIcon: {
    marginLeft: Spacing[2],
    marginTop: 5,
    flexShrink: 0,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginLeft: Spacing[2],
    flexShrink: 0,
    marginTop: 8,
  },
});
