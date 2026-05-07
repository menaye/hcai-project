/**
 * Home screen
 *
 * The main hub of the app. Shows:
 *  - Greeting + mascot character (from rough UI sketch screen1)
 *  - Streak badge
 *  - Active task with progress or "Start something" CTA
 *  - Quick summary of pending work
 *
 * Design principles:
 *  - Minimal cognitive load — one primary action at a time (§14.1)
 *  - Supportive, non-judgmental tone (§14.5)
 *  - Progress visible at a glance (§14.3)
 */

import React from 'react';
import {
  Alert,
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import { Spacing, Layout, Radius, Shadow } from '../../constants/spacing';
import { H2, H3, H4, Body, BodySmall, Label } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Card } from '../../components/ui/Card';
import { HumanMascot } from '../../components/mascot/HumanMascot';
import { StreakBadge } from '../../components/task/StreakBadge';
import { TaskCard } from '../../components/task/TaskCard';
import { TaskActionSheet, type TaskActionSheetOption } from '../../components/task/TaskActionSheet';
import { useAuthStore } from '../../store/authStore';
import { useTaskStore } from '../../store/taskStore';
import { updateTask, deleteTask } from '../../services/firebase/firestore';
import { getGreeting } from '../../utils/dateUtils';
import type { Task } from '../../types';

export default function HomeScreen() {
  const { profile, user } = useAuthStore();
  const { tasks, streak } = useTaskStore();
  const [sheetTask, setSheetTask] = React.useState<Task | null>(null);

  const activeTasks = tasks
    .filter((t) => t.status === 'active')
    .sort((a, b) => b.updatedAt - a.updatedAt);
  const currentTask = activeTasks[0] ?? null;
  const completedToday = tasks.filter(
    (t) =>
      t.status === 'completed' &&
      t.completedAt &&
      new Date(t.completedAt).toDateString() === new Date().toDateString(),
  ).length;

  const firstName = profile?.displayName?.split(' ')[0] ?? 'there';

  const getMascotState = () => {
    if (completedToday > 0) return 'happy' as const;
    if (currentTask) return 'encouraging' as const;
    return 'idle' as const;
  };

  const getSubheading = () => {
    if (completedToday > 0) {
      return `You finished ${completedToday} task${completedToday > 1 ? 's' : ''} today. That's real progress.`;
    }
    if (currentTask) {
      return 'You have an active task. Ready to chip away at it?';
    }
    return 'Nothing on your plate yet. Want to tackle something?';
  };

  const handleTaskPress = (task: Task) => {
    router.push(`/task/${task.id}`);
  };

  const confirmDelete = (task: Task) => {
    if (!user) return;
    const completedSteps = task.steps.filter((s) => s.status === 'completed').length;
    const warningMsg = completedSteps > 0
      ? `You've already completed ${completedSteps} step${completedSteps > 1 ? 's' : ''} on this task. Deleting it will remove it from your timeline.`
      : 'This will permanently remove the task and its steps.';

    Alert.alert('Delete task?', warningMsg, [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteTask(user.uid, task.id),
      },
    ]);
  };

  const openTaskActions = (task: Task) => {
    if (!user) return;
    setSheetTask(task);
  };

  const getTaskActions = (task: Task): TaskActionSheetOption[] => {
    if (!user) return [];
    const actions: TaskActionSheetOption[] = [];

    if (task.status !== 'active') {
      actions.push({
        label: 'Set Active',
        onPress: () => updateTask(user.uid, task.id, { status: 'active' }),
      });
    }
    if (task.status !== 'queued') {
      actions.push({
        label: 'Set Queued',
        onPress: () => updateTask(user.uid, task.id, { status: 'queued' }),
      });
    }
    if (task.status !== 'inactive') {
      actions.push({
        label: 'Pause',
        onPress: () => updateTask(user.uid, task.id, { status: 'inactive' }),
      });
    }
    if (task.status !== 'completed') {
      actions.push({
        label: 'Mark Complete',
        onPress: () => updateTask(user.uid, task.id, { status: 'completed', completedAt: Date.now() }),
      });
    }
    actions.push({
      label: 'Delete task',
      destructive: true,
      onPress: () => confirmDelete(task),
    });

    return actions;
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header gradient */}
        <LinearGradient
          colors={[Colors.primaryLight, Colors.background]}
          style={styles.gradient}
        />

        {/* Top row */}
        <View style={styles.topRow}>
          <View>
            <Label color={Colors.textSecondary}>{getGreeting()}</Label>
            <H2 color={Colors.textPrimary}>{firstName}</H2>
          </View>
          {streak && <StreakBadge streak={streak.currentStreak} />}
        </View>

        {/* Mascot + subheading */}
        <View style={styles.mascotSection}>
          <HumanMascot state={getMascotState()} size="lg" />
          <Body
            align="center"
            color={Colors.textSecondary}
            style={styles.subheading}
          >
            {getSubheading()}
          </Body>
        </View>

        {/* Primary CTA */}
        <Button
          label="Start a new task"
          onPress={() => router.push('/task/new')}
          size="lg"
          fullWidth
          style={styles.cta}
          icon={<Ionicons name="add" size={20} color={Colors.textInverse} />}
        />

        {/* Active task */}
        {currentTask && (
          <View style={styles.section}>
            <Label color={Colors.textSecondary} style={styles.sectionLabel}>
              {currentTask.steps.some((s) => s.status === 'completed')
                ? 'IN PROGRESS'
                : 'UP NEXT'}
            </Label>
            <TaskCard
              task={currentTask}
              onPress={handleTaskPress}
              onLongPress={openTaskActions}
              onStatusChange={openTaskActions}
            />
          </View>
        )}

        {/* Other active tasks */}
        {activeTasks.length > 1 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Label color={Colors.textSecondary} style={styles.sectionLabel}>
                OTHER TASKS
              </Label>
              <TouchableOpacity onPress={() => router.push('/(tabs)/tasks')}>
                <BodySmall color={Colors.primary}>See all</BodySmall>
              </TouchableOpacity>
            </View>
            {activeTasks.slice(1, 3).map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onPress={handleTaskPress}
                onLongPress={openTaskActions}
                onStatusChange={openTaskActions}
                compact
              />
            ))}
          </View>
        )}

        {/* Empty state */}
        {activeTasks.length === 0 && completedToday === 0 && (
          <Card style={styles.emptyCard} color={Colors.primaryLight}>
            <Body align="center" color={Colors.primary} style={styles.emptyText}>
              No tasks yet. When you're ready to start something,{'\n'}hit the button above.
            </Body>
          </Card>
        )}

        {/* Stats footer */}
        {streak && (
          <View style={styles.statsRow}>
            <StatPill
              icon="checkmark-done"
              label={`${streak.totalTasksCompleted} done`}
              onPress={() => router.push({ pathname: '/(tabs)/tasks', params: { filter: 'completed' } })}
            />
          </View>
        )}

        {sheetTask && (
          <TaskActionSheet
            visible={!!sheetTask}
            title={sheetTask.title}
            actions={getTaskActions(sheetTask)}
            onClose={() => setSheetTask(null)}
          />
        )}
      </ScrollView>

    </SafeAreaView>
  );
}

function StatPill({ icon, label, onPress }: { icon: string; label: string; onPress?: () => void }) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper onPress={onPress} activeOpacity={0.7} style={styles.statPill}>
      <Ionicons name={icon as any} size={13} color={onPress ? Colors.primary : Colors.textSecondary} />
      <BodySmall color={onPress ? Colors.primary : Colors.textSecondary}>{label}</BodySmall>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingBottom: Spacing[16],
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing[4],
    marginBottom: Spacing[4],
  },
  mascotSection: {
    alignItems: 'center',
    marginBottom: Spacing[6],
  },
  subheading: {
    marginTop: Spacing[4],
    lineHeight: 22,
    paddingHorizontal: Spacing[4],
  },
  cta: {
    marginBottom: Spacing[8],
  },
  section: {
    marginBottom: Spacing[5],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  sectionLabel: {
    marginBottom: Spacing[3],
    letterSpacing: 0.8,
  },
  emptyCard: {
    marginBottom: Spacing[6],
    paddingVertical: Spacing[6],
  },
  emptyText: {
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing[3],
    flexWrap: 'wrap',
    marginTop: Spacing[4],
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    paddingVertical: Spacing[1] + 2,
    paddingHorizontal: Spacing[3],
    borderRadius: Radius.full,
    ...Shadow.sm,
  },
});
