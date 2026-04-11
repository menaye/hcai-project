/**
 * Timeline screen
 *
 * Visual journey of the student's academic progress over time.
 * From rough UI sketch (screen2): wavy path / journey metaphor.
 * Shows tasks in chronological order with completion status.
 *
 * Design principle: Show progress early and frequently (§14.3)
 * — seeing the journey reinforces the growth narrative.
 */

import React from 'react';
import {
  View,
  FlatList,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Spacing, Layout } from '../../constants/spacing';
import { H3, Body, Label } from '../../components/ui/Typography';
import { TimelineItem } from '../../components/timeline/TimelineItem';
import { StreakBadge } from '../../components/task/StreakBadge';
import { useTaskStore } from '../../store/taskStore';
import { Card } from '../../components/ui/Card';

export default function TimelineScreen() {
  const { tasks, streak } = useTaskStore();

  // Sort by creation date ascending for timeline order
  const sorted = [...tasks].sort((a, b) => a.createdAt - b.createdAt);
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const totalSteps = tasks.reduce((sum, t) => sum + t.steps.filter((s) => s.status === 'completed').length, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <H3 color={Colors.textPrimary}>Your Journey</H3>
          <Body color={Colors.textSecondary}>
            {sorted.length === 0 ? 'No tasks yet' : `${sorted.length} task${sorted.length !== 1 ? 's' : ''} started`}
          </Body>
        </View>
        {streak && <StreakBadge streak={streak.currentStreak} />}
      </View>

      {/* Stats summary */}
      {sorted.length > 0 && (
        <View style={styles.statsRow}>
          <StatCard value={completed} label="Completed" color={Colors.success} />
          <StatCard value={totalSteps} label="Steps done" color={Colors.primary} />
          {streak && <StatCard value={streak.longestStreak} label="Best streak" color={Colors.gold} emoji="🔥" />}
        </View>
      )}

      {/* Timeline list */}
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <TimelineItem task={item} isLast={index === sorted.length - 1} />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState />}
      />
    </SafeAreaView>
  );
}

function StatCard({
  value,
  label,
  color,
  emoji,
}: {
  value: number;
  label: string;
  color: string;
  emoji?: string;
}) {
  return (
    <Card style={styles.statCard} padding={Spacing[3]}>
      <Body color={color} style={styles.statValue}>
        {emoji}{value}
      </Body>
      <Label color={Colors.textTertiary} style={styles.statLabel}>
        {label}
      </Label>
    </Card>
  );
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <Body align="center" color={Colors.textSecondary} style={styles.emptyText}>
        Your journey starts when you tackle{'\n'}your first task.{'\n\n'}
        Head to Home and hit "Start something new".
      </Body>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing[5],
    paddingBottom: Spacing[4],
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing[3],
    paddingHorizontal: Layout.screenPaddingH,
    marginBottom: Spacing[6],
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontWeight: '700',
    fontSize: 22,
    textAlign: 'center',
  },
  statLabel: {
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  list: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingBottom: Spacing[16],
    paddingTop: Spacing[2],
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[20],
  },
  emptyText: {
    lineHeight: 24,
  },
});
