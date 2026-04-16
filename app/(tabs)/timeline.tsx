/**
 * Timeline screen
 *
 * Visual journey of the student's academic progress over time.
 * Supports two views:
 *  - List view: tasks in chronological order
 *  - Calendar view: monthly grid with task indicators
 *
 * Design principle: Show progress early and frequently (§14.3)
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Spacing, Layout, Radius, Shadow } from '../../constants/spacing';
import { H3, H4, Body, BodySmall, Label } from '../../components/ui/Typography';
import { TimelineItem } from '../../components/timeline/TimelineItem';
import { StreakBadge } from '../../components/task/StreakBadge';
import { useTaskStore } from '../../store/taskStore';
import { Card } from '../../components/ui/Card';
import type { Task } from '../../types';

type ViewMode = 'list' | 'week' | 'month';

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function TimelineScreen() {
  const { tasks, streak } = useTaskStore();
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const sorted = [...tasks]
    .filter((t) => t.status !== 'abandoned')
    .sort((a, b) => a.createdAt - b.createdAt);

  const completed = tasks.filter((t) => t.status === 'completed').length;
  const totalSteps = tasks.reduce(
    (sum, t) => sum + t.steps.filter((s) => s.status === 'completed').length,
    0,
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <H3 color={Colors.textPrimary}>Your Journey</H3>
          <Body color={Colors.textSecondary}>
            {sorted.length === 0
              ? 'No tasks yet'
              : `${sorted.length} task${sorted.length !== 1 ? 's' : ''} started`}
          </Body>
        </View>
        {streak && <StreakBadge streak={streak.currentStreak} />}
      </View>

      {/* Stats summary */}
      {sorted.length > 0 && (
        <View style={styles.statsRow}>
          <StatCard value={completed} label="Completed" color={Colors.success} />
          <StatCard value={totalSteps} label="Steps done" color={Colors.primary} />
          {streak && (
            <StatCard value={streak.longestStreak} label="Best streak" color={Colors.gold} emoji="🔥" />
          )}
        </View>
      )}

      {/* View toggle */}
      <View style={styles.viewToggle}>
        {([
          { key: 'list', icon: 'list-outline', label: 'List' },
          { key: 'week', icon: 'calendar-outline', label: 'Week' },
          { key: 'month', icon: 'grid-outline', label: 'Month' },
        ] as { key: ViewMode; icon: string; label: string }[]).map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.toggleBtn, viewMode === opt.key && styles.toggleBtnActive]}
            onPress={() => setViewMode(opt.key)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={opt.icon as any}
              size={15}
              color={viewMode === opt.key ? Colors.primary : Colors.textTertiary}
            />
            <BodySmall color={viewMode === opt.key ? Colors.primary : Colors.textTertiary}>
              {opt.label}
            </BodySmall>
          </TouchableOpacity>
        ))}
      </View>

      {viewMode === 'list' ? (
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
      ) : viewMode === 'week' ? (
        <WeekView tasks={tasks} />
      ) : (
        <CalendarView tasks={tasks} />
      )}
    </SafeAreaView>
  );
}

// ── Week View ──────────────────────────────────────────────────

function WeekView({ tasks }: { tasks: Task[] }) {
  const today = new Date();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<string | null>(
    today.toISOString().split('T')[0],
  );

  // Build tasksByDay map
  const tasksByDay = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const task of tasks) {
      if (task.status === 'abandoned') continue;
      const epoch = task.dueAt ?? task.createdAt;
      const d = new Date(epoch);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!map[key]) map[key] = [];
      map[key].push(task);
    }
    return map;
  }, [tasks]);

  // Get the Sunday of the current displayed week
  const weekStart = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - d.getDay() + weekOffset * 7);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [weekOffset]);

  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    }),
  [weekStart]);

  const formatKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const weekLabel = `${MONTHS[weekStart.getMonth()]} ${weekStart.getDate()} – ${
    MONTHS[weekDays[6].getMonth()]
  } ${weekDays[6].getDate()}, ${weekDays[6].getFullYear()}`;

  const selectedTasks = selectedDay ? (tasksByDay[selectedDay] ?? []) : [];

  return (
    <ScrollView contentContainerStyle={styles.calendarContainer} showsVerticalScrollIndicator={false}>
      {/* Week navigation */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={() => setWeekOffset((w) => w - 1)} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <BodySmall color={Colors.textPrimary} style={{ fontWeight: '600', textAlign: 'center', flex: 1 }}>
          {weekLabel}
        </BodySmall>
        <TouchableOpacity onPress={() => setWeekOffset((w) => w + 1)} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Day strip */}
      <View style={styles.weekStrip}>
        {weekDays.map((d) => {
          const key = formatKey(d);
          const isToday = key === formatKey(today);
          const isSelected = key === selectedDay;
          const hasTasks = !!tasksByDay[key]?.length;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.weekStripDay, isSelected && styles.weekStripDaySelected]}
              onPress={() => setSelectedDay(key === selectedDay ? null : key)}
              activeOpacity={0.7}
            >
              <BodySmall
                color={Colors.textTertiary}
                style={[styles.weekStripDayLabel, isToday && { color: Colors.primary }]}
              >
                {DAYS_OF_WEEK[d.getDay()]}
              </BodySmall>
              <Body
                color={isSelected ? Colors.textInverse : isToday ? Colors.primary : Colors.textPrimary}
                style={[styles.weekStripDayNum, isToday && { fontWeight: '700' }]}
              >
                {d.getDate()}
              </Body>
              {hasTasks && (
                <View
                  style={[
                    styles.taskDot,
                    { backgroundColor: isSelected ? Colors.textInverse : Colors.primary },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected day tasks */}
      {selectedDay && (
        <View style={styles.selectedDaySection}>
          <Label color={Colors.textTertiary} style={styles.selectedDayLabel}>
            {new Date(selectedDay + 'T12:00:00').toLocaleDateString(undefined, {
              weekday: 'long', month: 'long', day: 'numeric',
            }).toUpperCase()}
          </Label>
          {selectedTasks.length === 0 ? (
            <Body color={Colors.textTertiary} style={styles.noTasksMsg}>
              No tasks on this day.
            </Body>
          ) : (
            selectedTasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                style={styles.calendarTaskRow}
                onPress={() => router.push(`/task/${task.id}`)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.calendarTaskDot,
                    { backgroundColor: task.status === 'completed' ? Colors.success : Colors.primary },
                  ]}
                />
                <Body color={Colors.textPrimary} style={styles.calendarTaskTitle} numberOfLines={1}>
                  {task.title}
                </Body>
                <Ionicons name="chevron-forward" size={14} color={Colors.textTertiary} />
              </TouchableOpacity>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

// ── Calendar View ──────────────────────────────────────────────

function CalendarView({ tasks }: { tasks: Task[] }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());

  // Build a map: 'YYYY-MM-DD' -> Task[]
  const tasksByDay = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const task of tasks) {
      if (task.status === 'abandoned') continue;
      // Use dueAt if set, else createdAt
      const epoch = task.dueAt ?? task.createdAt;
      const d = new Date(epoch);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!map[key]) map[key] = [];
      map[key].push(task);
    }
    return map;
  }, [tasks]);

  const selectedKey = selectedDay !== null
    ? `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
    : null;
  const selectedTasks = selectedKey ? (tasksByDay[selectedKey] ?? []) : [];

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  };

  // Build grid cells: null = empty slot, number = day
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // pad to full week row
  while (cells.length % 7 !== 0) cells.push(null);

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const getDayKey = (day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const hasTasks = (day: number) => !!tasksByDay[getDayKey(day)]?.length;

  return (
    <ScrollView contentContainerStyle={styles.calendarContainer} showsVerticalScrollIndicator={false}>
      {/* Month navigation */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <H4 color={Colors.textPrimary}>
          {MONTHS[month]} {year}
        </H4>
        <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Day of week headers */}
      <View style={styles.weekHeader}>
        {DAYS_OF_WEEK.map((d) => (
          <View key={d} style={styles.weekCell}>
            <Label color={Colors.textTertiary} style={styles.weekDayLabel}>
              {d}
            </Label>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.calendarGrid}>
        {cells.map((day, idx) => {
          if (day === null) {
            return <View key={`empty-${idx}`} style={styles.dayCell} />;
          }
          const isSelected = selectedDay === day;
          const hasT = hasTasks(day);
          const isTodayDay = isToday(day);
          return (
            <TouchableOpacity
              key={day}
              style={styles.dayCell}
              onPress={() => setSelectedDay(day === selectedDay ? null : day)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.dayCellInner,
                  isSelected && styles.dayCellInnerSelected,
                  isTodayDay && !isSelected && styles.dayCellInnerToday,
                ]}
              >
                <BodySmall
                  color={
                    isSelected
                      ? Colors.textInverse
                      : isTodayDay
                      ? Colors.primary
                      : Colors.textPrimary
                  }
                  style={[styles.dayNumber, isTodayDay && styles.dayNumberToday]}
                >
                  {day}
                </BodySmall>
                {hasT && (
                  <View
                    style={[
                      styles.taskDot,
                      { backgroundColor: isSelected ? Colors.textInverse : Colors.primary },
                    ]}
                  />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected day tasks */}
      {selectedDay !== null && (
        <View style={styles.selectedDaySection}>
          <Label color={Colors.textTertiary} style={styles.selectedDayLabel}>
            {MONTHS[month]} {selectedDay}
          </Label>
          {selectedTasks.length === 0 ? (
            <Body color={Colors.textTertiary} style={styles.noTasksMsg}>
              No tasks on this day.
            </Body>
          ) : (
            selectedTasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                style={styles.calendarTaskRow}
                onPress={() => router.push(`/task/${task.id}`)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.calendarTaskDot,
                    {
                      backgroundColor:
                        task.status === 'completed' ? Colors.success : Colors.primary,
                    },
                  ]}
                />
                <Body color={Colors.textPrimary} style={styles.calendarTaskTitle} numberOfLines={1}>
                  {task.title}
                </Body>
                <Ionicons name="chevron-forward" size={14} color={Colors.textTertiary} />
              </TouchableOpacity>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

// ── Shared sub-components ──────────────────────────────────────

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
        Head to Home and hit "Start a new task".
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
    marginBottom: Spacing[4],
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
  viewToggle: {
    flexDirection: 'row',
    marginHorizontal: Layout.screenPaddingH,
    marginBottom: Spacing[4],
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 3,
    ...Shadow.sm,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[1],
    paddingVertical: Spacing[2],
    borderRadius: Radius.md,
  },
  toggleBtnActive: {
    backgroundColor: Colors.primaryLight,
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
  // Calendar
  calendarContainer: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingBottom: Spacing[16],
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  navBtn: {
    padding: Spacing[2],
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: Spacing[2],
  },
  weekCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayLabel: {
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing[4],
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellInnerSelected: {
    backgroundColor: Colors.primary,
  },
  dayCellInnerToday: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  dayNumber: {
    fontWeight: '500',
  },
  dayNumberToday: {
    fontWeight: '700',
  },
  taskDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 2,
  },
  selectedDaySection: {
    marginTop: Spacing[2],
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: Spacing[4],
  },
  selectedDayLabel: {
    letterSpacing: 0.8,
    marginBottom: Spacing[3],
  },
  noTasksMsg: {
    paddingVertical: Spacing[3],
  },
  calendarTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  calendarTaskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  calendarTaskTitle: {
    flex: 1,
  },
  // Week view
  weekStrip: {
    flexDirection: 'row',
    marginBottom: Spacing[4],
    gap: 2,
  },
  weekStripDay: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing[2],
    borderRadius: Radius.lg,
  },
  weekStripDaySelected: {
    backgroundColor: Colors.primary,
  },
  weekStripDayLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  weekStripDayNum: {
    fontSize: 16,
    fontWeight: '500',
  },
});
