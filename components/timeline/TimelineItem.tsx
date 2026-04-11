import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Radius, Spacing } from '../../constants/spacing';
import { Typography } from '../ui/Typography';
import { formatDate } from '../../utils/dateUtils';
import type { Task } from '../../types';

interface TimelineItemProps {
  task: Task;
  isLast?: boolean;
}

export function TimelineItem({ task, isLast = false }: TimelineItemProps) {
  const isComplete = task.status === 'completed';
  const total = task.steps.length;
  const done = task.steps.filter((s) => s.status === 'completed').length;

  return (
    <View style={styles.row}>
      {/* Left: line + dot */}
      <View style={styles.lineCol}>
        <View style={[styles.dot, { backgroundColor: isComplete ? Colors.success : Colors.primary }]} />
        {!isLast && <View style={styles.line} />}
      </View>

      {/* Right: content */}
      <View style={styles.content}>
        <View style={styles.dateLine}>
          <Typography variant="caption" color={Colors.textTertiary}>
            {formatDate(task.createdAt)}
          </Typography>
          {isComplete && (
            <View style={styles.completeBadge}>
              <Typography variant="caption" color={Colors.success} style={styles.completeText}>
                ✓ Done
              </Typography>
            </View>
          )}
        </View>

        <Typography
          variant="bodyLarge"
          color={Colors.textPrimary}
          style={styles.title}
          numberOfLines={2}
        >
          {task.title}
        </Typography>

        <Typography variant="bodySmall" color={Colors.textSecondary}>
          {done}/{total} steps completed
        </Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing[4],
    marginBottom: Spacing[1],
  },
  lineCol: {
    alignItems: 'center',
    width: 20,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 4,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.border,
    marginTop: 4,
    marginBottom: -Spacing[1],
  },
  content: {
    flex: 1,
    paddingBottom: Spacing[6],
  },
  dateLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[1],
  },
  title: {
    marginBottom: Spacing[1],
    fontWeight: '600',
  },
  completeBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  completeText: {
    fontWeight: '600',
  },
});
