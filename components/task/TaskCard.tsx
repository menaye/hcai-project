import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Typography } from '../ui/Typography';
import { ProgressBar } from '../ui/ProgressBar';
import { Card } from '../ui/Card';
import { Chip } from '../ui/Chip';
import { formatDaysUntil, formatRelativeDate } from '../../utils/dateUtils';
import type { Task, TaskPriority } from '../../types';

interface TaskCardProps {
  task: Task;
  onPress: (task: Task) => void;
  onLongPress?: (task: Task) => void;
  onStatusChange?: (task: Task) => void;
  compact?: boolean;
}

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  low: Colors.success,
  medium: Colors.gold,
  high: Colors.accent,
  urgent: Colors.error,
};

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export function TaskCard({ task, onPress, onLongPress, onStatusChange, compact = false }: TaskCardProps) {
  const total = task.steps.length;
  const completed = task.steps.filter((s) => s.status === 'completed').length;
  const progress = total > 0 ? completed / total : 0;
  const isComplete = task.status === 'completed';
  const isInactive = task.status === 'inactive';

  const isQueued = task.status === 'queued';
  const statusColor = isComplete
    ? Colors.success
    : isInactive
    ? Colors.textTertiary
    : isQueued
    ? Colors.gold
    : Colors.primary;
  const statusLabel = isComplete
    ? 'Done'
    : isInactive
    ? 'Paused'
    : isQueued
    ? 'Queued'
    : 'Active';

  return (
    <TouchableOpacity
      onPress={() => onPress(task)}
      onLongPress={() => onLongPress?.(task)}
      activeOpacity={0.85}
      delayLongPress={400}
    >
      <Card
        style={[styles.card, (isComplete || isInactive) ? styles.dimmedCard : null]}
        elevated={!isComplete && !isInactive}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Typography
              variant={compact ? 'body' : 'heading4'}
              color={isComplete || isInactive ? Colors.textSecondary : Colors.textPrimary}
              style={[styles.title, isComplete && styles.completedTitle]}
              numberOfLines={2}
            >
              {task.title}
            </Typography>
            <Chip
              label={statusLabel}
              color={statusColor}
              selected
              style={styles.chip}
              onPress={onStatusChange ? () => onStatusChange(task) : undefined}
            />
          </View>

          {/* Priority badge */}
          {task.priority && !isComplete && (
            <View style={styles.metaRow}>
              <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLOR[task.priority] + '22' }]}>
                <Typography variant="caption" color={PRIORITY_COLOR[task.priority]} style={styles.priorityText}>
                  {PRIORITY_LABEL[task.priority]} priority
                </Typography>
              </View>
            </View>
          )}

          {task.dueAt && !isComplete && (
            <Typography variant="caption" color={Colors.textTertiary} style={styles.due}>
              {formatDaysUntil(task.dueAt)}
            </Typography>
          )}

          {task.targetDate && !isComplete && !task.dueAt && (
            <Typography variant="caption" color={Colors.primary} style={styles.due}>
              Target: {formatDaysUntil(task.targetDate)}
            </Typography>
          )}

          {isComplete && task.completedAt && (
            <Typography variant="caption" color={Colors.success} style={styles.due}>
              Completed {formatRelativeDate(task.completedAt)}
            </Typography>
          )}
        </View>

        {!compact && (
          <>
            {/* Progress */}
            <View style={styles.progressSection}>
              <ProgressBar
                progress={progress}
                color={isComplete ? Colors.success : Colors.primary}
                trackColor={isComplete ? Colors.successLight : Colors.primaryLight}
                height={6}
              />
              <Typography
                variant="caption"
                color={Colors.textTertiary}
                style={styles.progressLabel}
              >
                {completed} of {total} steps
              </Typography>
            </View>
          </>
        )}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing[3],
  },
  dimmedCard: {
    opacity: 0.75,
  },
  header: {},
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing[2],
  },
  title: {
    flex: 1,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
  },
  chip: {
    marginTop: 2,
    flexShrink: 0,
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: Spacing[1],
  },
  priorityBadge: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  due: {
    marginTop: Spacing[1],
  },
  progressSection: {
    marginTop: Spacing[3],
  },
  progressLabel: {
    marginTop: Spacing[1],
    textAlign: 'right',
  },
});
