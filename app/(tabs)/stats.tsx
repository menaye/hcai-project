/**
 * Stats screen – beautiful Robinhood-inspired progress dashboard
 *
 * Shows task completion metrics, streak data, weekly activity,
 * and a breakdown of steps and categories. All rendered with
 * pure React Native Views (no SVG dependency required).
 */

import React, { useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing, Layout, Radius, Shadow } from '../../constants/spacing';
import { H2, H3, H4, Body, BodySmall, Label } from '../../components/ui/Typography';
import { useTaskStore } from '../../store/taskStore';

// ── Helpers ───────────────────────────────────────────────────

function getDayLabel(date: Date): string {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
}

function getDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getMotivationalMessage(
  completionRate: number,
  currentStreak: number,
  totalCompleted: number,
): string {
  if (totalCompleted === 0) return "Every journey starts with a single step. Create your first task.";
  if (completionRate >= 0.9) return "You're crushing it. Keep the momentum.";
  if (completionRate >= 0.7) return "Strong progress. You're building real consistency.";
  if (completionRate >= 0.5) return "More than halfway there. The habit is forming.";
  if (currentStreak >= 7) return "A 7-day streak — that's serious commitment.";
  if (currentStreak >= 3) return "Three days in a row. The momentum is real.";
  if (totalCompleted >= 10) return `${totalCompleted} tasks complete. You've proven you can finish things.`;
  return "Small consistent actions compound. Keep going.";
}

// ── Donut arc using two-semicircle trick ──────────────────────

function DonutArc({ progress, size = 120 }: { progress: number; size?: number }) {
  const strokeWidth = size * 0.12;
  const innerSize = size - strokeWidth * 2;
  const clampedProgress = Math.min(1, Math.max(0, progress));

  // We render a full circle track, then an arc overlay
  // For progress <= 0.5: show left half filled, right half track
  // For progress > 0.5: show right half filled fully, left half partially filled
  const halfSize = size / 2;
  const angle = clampedProgress * 360;

  // Render using two semicircle clip containers
  const leftFilled = angle > 180 ? 180 : angle; // degrees filled on left half
  const rightFilled = angle > 180 ? angle - 180 : 0; // degrees filled on right half

  const leftRotate = `${leftFilled - 180}deg`;
  const rightRotate = `${rightFilled}deg`;

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      {/* Track circle (background) */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: Colors.primaryLight,
        }}
      />

      {/* Right half clip container */}
      <View
        style={{
          position: 'absolute',
          width: halfSize,
          height: size,
          left: halfSize,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: Colors.primary,
            position: 'absolute',
            left: -halfSize,
            transform: [{ rotate: rightRotate }],
            opacity: angle > 0 ? 1 : 0,
          }}
        />
      </View>

      {/* Left half clip container */}
      <View
        style={{
          position: 'absolute',
          width: halfSize,
          height: size,
          left: 0,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: Colors.primary,
            position: 'absolute',
            left: 0,
            transform: [{ rotate: leftRotate }],
            opacity: angle > 180 ? 1 : 0,
          }}
        />
      </View>

      {/* Inner content */}
      <View
        style={{
          position: 'absolute',
          top: strokeWidth,
          left: strokeWidth,
          width: innerSize,
          height: innerSize,
          borderRadius: innerSize / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: Colors.surface,
        }}
      >
        <Body color={Colors.primary} style={{ fontWeight: '800', fontSize: 20 }}>
          {Math.round(clampedProgress * 100)}%
        </Body>
        <BodySmall color={Colors.textTertiary}>done</BodySmall>
      </View>
    </View>
  );
}

// ── Mini stat card ────────────────────────────────────────────

function MiniStat({
  label,
  value,
  icon,
  color = Colors.primary,
}: {
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
}) {
  return (
    <View style={styles.miniStatCard}>
      {icon && (
        <Ionicons name={icon as any} size={18} color={color} style={{ marginBottom: 4 }} />
      )}
      <Body color={color} style={styles.miniStatValue}>
        {value}
      </Body>
      <BodySmall color={Colors.textTertiary} align="center" style={styles.miniStatLabel}>
        {label}
      </BodySmall>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────

export default function StatsScreen() {
  const { tasks, streak } = useTaskStore();

  const stats = useMemo(() => {
    const nonAbandoned = tasks.filter((t) => t.status !== 'abandoned');
    const completed = tasks.filter((t) => t.status === 'completed');
    const active = tasks.filter((t) => t.status === 'active');
    const queued = tasks.filter((t) => t.status === 'queued');

    const totalCreated = nonAbandoned.length;
    const totalCompleted = completed.length;
    const completionRate = totalCreated > 0 ? totalCompleted / totalCreated : 0;

    const allSteps = tasks.flatMap((t) => t.steps);
    const completedSteps = allSteps.filter((s) => s.status === 'completed').length;
    const avgStepsPerTask =
      totalCompleted > 0
        ? (completed.reduce((sum, t) => sum + t.steps.length, 0) / totalCompleted).toFixed(1)
        : '—';

    // Weekly activity: last 7 days of step completions
    const today = new Date();
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      return d;
    });

    const stepsByDay: Record<string, number> = {};
    weekDays.forEach((d) => { stepsByDay[getDateKey(d)] = 0; });

    allSteps.forEach((step) => {
      if (step.status === 'completed' && step.completedAt) {
        const key = getDateKey(new Date(step.completedAt));
        if (key in stepsByDay) {
          stepsByDay[key] = (stepsByDay[key] || 0) + 1;
        }
      }
    });

    const weekData = weekDays.map((d) => ({
      label: getDayLabel(d),
      dateKey: getDateKey(d),
      count: stepsByDay[getDateKey(d)] ?? 0,
      isToday: getDateKey(d) === getDateKey(today),
    }));
    const maxBar = Math.max(...weekData.map((d) => d.count), 1);

    return {
      totalCreated,
      totalCompleted,
      completionRate,
      completedSteps,
      avgStepsPerTask,
      activeCount: active.length,
      queuedCount: queued.length,
      weekData,
      maxBar,
      motivationalMessage: getMotivationalMessage(
        completionRate,
        streak?.currentStreak ?? 0,
        totalCompleted,
      ),
    };
  }, [tasks, streak]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <H3 color={Colors.textPrimary}>Your Stats</H3>
          <BodySmall color={Colors.textSecondary}>
            {stats.totalCreated} task{stats.totalCreated !== 1 ? 's' : ''} created
          </BodySmall>
        </View>

        {/* Hero card */}
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroLeft}>
              <Label color="rgba(255,255,255,0.7)" style={styles.heroLabel}>
                TASKS COMPLETED
              </Label>
              <H2 color={Colors.textInverse} style={styles.heroNumber}>
                {stats.totalCompleted}
              </H2>
              <View style={styles.heroDivider} />
              <BodySmall color="rgba(255,255,255,0.8)">
                of {stats.totalCreated} created
              </BodySmall>
              {streak && (
                <View style={styles.streakPill}>
                  <Ionicons name="flame" size={14} color={Colors.gold} />
                  <BodySmall color={Colors.gold} style={{ fontWeight: '700' }}>
                    {streak.currentStreak} day streak
                  </BodySmall>
                </View>
              )}
            </View>
            <DonutArc progress={stats.completionRate} size={110} />
          </View>
        </LinearGradient>

        {/* 7-day bar chart */}
        <View style={styles.sectionCard}>
          <Label color={Colors.textTertiary} style={styles.sectionLabel}>
            LAST 7 DAYS
          </Label>
          <View style={styles.barChart}>
            {stats.weekData.map((day) => {
              const barHeight = stats.maxBar > 0 ? (day.count / stats.maxBar) * 64 : 0;
              const isToday = day.isToday;
              return (
                <View key={day.dateKey} style={styles.barColumn}>
                  <BodySmall
                    color={day.count > 0 ? Colors.textPrimary : Colors.textTertiary}
                    style={styles.barCount}
                  >
                    {day.count > 0 ? day.count : ''}
                  </BodySmall>
                  <View style={styles.barTrack}>
                    {day.count > 0 ? (
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: Math.max(barHeight, 6),
                            backgroundColor: isToday ? Colors.primary : Colors.primaryMid,
                            opacity: isToday ? 1 : 0.6,
                          },
                        ]}
                      />
                    ) : (
                      <View style={styles.barEmpty} />
                    )}
                  </View>
                  <BodySmall
                    color={isToday ? Colors.primary : Colors.textTertiary}
                    style={[styles.barLabel, isToday && { fontWeight: '700' }]}
                  >
                    {day.label}
                  </BodySmall>
                </View>
              );
            })}
          </View>
          <BodySmall color={Colors.textTertiary} style={styles.barHint}>
            Steps completed per day
          </BodySmall>
        </View>

        {/* Streak section */}
        {streak && (
          <LinearGradient
            colors={[Colors.goldLight, Colors.background]}
            style={styles.streakCard}
          >
            <View style={styles.streakRow}>
              <View style={styles.streakItem}>
                <Ionicons name="flame" size={28} color={Colors.gold} />
                <Body color={Colors.textPrimary} style={styles.streakBigNum}>
                  {streak.currentStreak}
                </Body>
                <BodySmall color={Colors.textSecondary}>Current streak</BodySmall>
              </View>
              <View style={styles.streakDivider} />
              <View style={styles.streakItem}>
                <Ionicons name="trophy-outline" size={28} color={Colors.accent} />
                <Body color={Colors.textPrimary} style={styles.streakBigNum}>
                  {streak.longestStreak}
                </Body>
                <BodySmall color={Colors.textSecondary}>Best streak</BodySmall>
              </View>
            </View>
            <BodySmall color={Colors.textTertiary} align="center" style={styles.streakHint}>
              A streak day is earned by completing at least one step
            </BodySmall>
          </LinearGradient>
        )}

        {/* Breakdown grid */}
        <Label color={Colors.textTertiary} style={styles.gridSectionLabel}>
          BREAKDOWN
        </Label>
        <View style={styles.miniStatGrid}>
          <View style={styles.miniStatWrapper}>
            <MiniStat
              label="Steps completed"
              value={stats.completedSteps}
              icon="checkmark-done-outline"
              color={Colors.success}
            />
          </View>
          <View style={styles.miniStatWrapper}>
            <MiniStat
              label="Avg steps/task"
              value={stats.avgStepsPerTask}
              icon="list-outline"
              color={Colors.primary}
            />
          </View>
          <View style={styles.miniStatWrapper}>
            <MiniStat
              label="In progress"
              value={stats.activeCount}
              icon="play-circle-outline"
              color={Colors.accent}
            />
          </View>
          <View style={styles.miniStatWrapper}>
            <MiniStat
              label="Queued"
              value={stats.queuedCount}
              icon="time-outline"
              color={Colors.textSecondary}
            />
          </View>
        </View>

        {/* Motivational footer */}
        <LinearGradient
          colors={[Colors.primaryLight, Colors.background]}
          style={styles.motivFooter}
        >
          <Ionicons name="sparkles-outline" size={20} color={Colors.primary} style={{ marginBottom: Spacing[2] }} />
          <Body color={Colors.primary} align="center" style={styles.motivText}>
            {stats.motivationalMessage}
          </Body>
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingBottom: Spacing[16],
  },

  header: {
    paddingTop: Spacing[5],
    paddingBottom: Spacing[5],
    gap: 2,
  },

  // Hero card
  heroCard: {
    borderRadius: Radius['2xl'],
    padding: Spacing[6],
    marginBottom: Spacing[4],
    ...Shadow.lg,
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLeft: {
    flex: 1,
    gap: Spacing[1],
    paddingRight: Spacing[4],
  },
  heroLabel: {
    letterSpacing: 0.8,
    marginBottom: Spacing[1],
  },
  heroNumber: {
    fontWeight: '800',
    fontSize: 52,
    lineHeight: 56,
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: Spacing[2],
    width: 40,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    marginTop: Spacing[2],
  },

  // Bar chart section
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius['2xl'],
    padding: Spacing[5],
    marginBottom: Spacing[4],
    ...Shadow.sm,
  },
  sectionLabel: {
    letterSpacing: 0.8,
    marginBottom: Spacing[4],
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 96,
    marginBottom: Spacing[2],
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  barCount: {
    fontSize: 10,
    fontWeight: '700',
    height: 14,
  },
  barTrack: {
    width: 20,
    height: 64,
    justifyContent: 'flex-end',
    borderRadius: Radius.xs,
    backgroundColor: Colors.divider,
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: Radius.xs,
  },
  barEmpty: {
    width: '100%',
    height: 3,
    backgroundColor: Colors.border,
    borderRadius: Radius.xs,
  },
  barLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  barHint: {
    textAlign: 'center',
    marginTop: Spacing[2],
  },

  // Streak card
  streakCard: {
    borderRadius: Radius['2xl'],
    padding: Spacing[5],
    marginBottom: Spacing[4],
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: Spacing[3],
  },
  streakItem: {
    alignItems: 'center',
    gap: Spacing[1],
    flex: 1,
  },
  streakBigNum: {
    fontWeight: '800',
    fontSize: 36,
    lineHeight: 40,
  },
  streakDivider: {
    width: 1,
    height: 60,
    backgroundColor: Colors.border,
  },
  streakHint: {
    lineHeight: 18,
  },

  // Mini stat grid
  gridSectionLabel: {
    letterSpacing: 0.8,
    marginBottom: Spacing[3],
  },
  miniStatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[3],
    marginBottom: Spacing[4],
  },
  miniStatWrapper: {
    width: '47%',
  },
  miniStatCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 88,
    ...Shadow.sm,
  },
  miniStatValue: {
    fontWeight: '800',
    fontSize: 26,
    lineHeight: 30,
  },
  miniStatLabel: {
    marginTop: 2,
    lineHeight: 16,
  },

  // Motivational footer
  motivFooter: {
    borderRadius: Radius['2xl'],
    padding: Spacing[6],
    alignItems: 'center',
  },
  motivText: {
    lineHeight: 24,
    fontWeight: '500',
  },
});
