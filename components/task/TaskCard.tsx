import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Typography } from '../ui/Typography';
import { ProgressBar } from '../ui/ProgressBar';
import { Card } from '../ui/Card';
import { Chip } from '../ui/Chip';
import { formatDaysUntil, formatRelativeDate } from '../../utils/dateUtils';
import type { Task } from '../../types';

interface TaskCardProps {
  task: Task;
  onPress: (task: Task) => void;
  compact?: boolean;
}

export function TaskCard({ task, onPress, compact = false }: TaskCardProps) {
  const total = task.steps.length;
  const completed = task.steps.filter((s) => s.status === 'completed').length;
  const progress = total > 0 ? completed / total : 0;
  const isComplete = task.status === 'completed';

  const statusColor = isComplete ? Colors.success : Colors.primary;
  const statusLabel = isComplete ? 'Done' : 'Active';

  return (
    <TouchableOpacity onPress={() => onPress(task)} activeOpacity={0.85}>
      <Card
        style={[styles.card, isComplete ? styles.completedCard : null]}
        elevated={!isComplete}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Typography
              variant={compact ? 'body' : 'heading4'}
              color={isComplete ? Colors.textSecondary : Colors.textPrimary}
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
            />
          </View>

          {task.dueAt && !isComplete && (
            <Typography variant="caption" color={Colors.textTertiary} style={styles.due}>
              {formatDaysUntil(task.dueAt)}
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
  completedCard: {
    opacity: 0.8,
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
