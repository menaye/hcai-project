/**
 * Tasks screen – To-Do list view
 *
 * Shows active tasks first, then completed.
 * FAB to add a new task.
 * Long-press a task card to edit title or delete.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing, Layout, Shadow } from '../../constants/spacing';
import { H3, Body, Label } from '../../components/ui/Typography';
import { Chip } from '../../components/ui/Chip';
import { TaskCard } from '../../components/task/TaskCard';
import { TaskActionSheet, type TaskActionSheetOption } from '../../components/task/TaskActionSheet';
import { useTaskStore } from '../../store/taskStore';
import { useAuthStore } from '../../store/authStore';
import { updateTask, deleteTask } from '../../services/firebase/firestore';
import type { Task } from '../../types';

type Filter = 'active' | 'completed' | 'inactive' | 'all';

export default function TasksScreen() {
  const { filter: filterParam } = useLocalSearchParams<{ filter?: string }>();
  const { tasks } = useTaskStore();
  const { user } = useAuthStore();
  const [filter, setFilter] = useState<Filter>(
    (filterParam as Filter) ?? 'active',
  );
  const [sheetTask, setSheetTask] = useState<Task | null>(null);

  // Sync filter when navigating to this tab with a filter param
  useEffect(() => {
    if (filterParam && filterParam !== filter) {
      setFilter(filterParam as Filter);
    }
  }, [filterParam]);

  const filtered = tasks.filter((t) => {
    if (filter === 'active') return t.status === 'active';
    if (filter === 'completed') return t.status === 'completed';
    if (filter === 'inactive') return t.status === 'inactive';
    // 'all' excludes abandoned tasks
    return t.status !== 'abandoned';
  });

  const handleTaskPress = (task: Task) => {
    router.push(`/task/${task.id}`);
  };

  const handleStatusUpdate = (taskId: string, newStatus: Task['status']) => {
    if (!user) return;
    const updates: Partial<Task> = { status: newStatus };
    if (newStatus === 'completed') {
      updates.completedAt = Date.now();
    }
    updateTask(user.uid, taskId, updates);
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

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Done' },
    { key: 'inactive', label: 'Paused' },
    { key: 'all', label: 'All' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <H3 color={Colors.textPrimary}>Your Tasks</H3>
        <Body color={Colors.textSecondary}>
          {tasks.filter((t) => t.status === 'active').length} active
        </Body>
      </View>

      {/* Filter chips */}
      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <Chip
            key={f.key}
            label={f.label}
            selected={filter === f.key}
            onPress={() => setFilter(f.key)}
          />
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onPress={handleTaskPress}
            onLongPress={openTaskActions}
            onStatusChange={openTaskActions}
            onStatusUpdate={handleStatusUpdate}
          />
        )}
        contentContainerStyle={[
          styles.list,
          filtered.length === 0 && styles.emptyList,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState filter={filter} />}
      />

      {sheetTask && (
        <TaskActionSheet
          visible={!!sheetTask}
          title={sheetTask.title}
          actions={getTaskActions(sheetTask)}
          onClose={() => setSheetTask(null)}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/task/new')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={Colors.textInverse} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function EmptyState({ filter }: { filter: Filter }) {
  const messages: Record<Filter, string> = {
    active: 'No active tasks.\nTap + to start a task.',
    completed: "You haven't completed any tasks yet.\nYou've got this.",
    inactive: 'No paused tasks.',
    queued: 'No queued tasks.\nLong-press a task to queue it.',
    all: 'No tasks yet. Tap + to begin.',
  };
  return (
    <View style={styles.empty}>
      <Body align="center" color={Colors.textSecondary}>
        {messages[filter]}
      </Body>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing[5],
    paddingBottom: Spacing[4],
  },
  filters: {
    flexDirection: 'row',
    gap: Spacing[2],
    paddingHorizontal: Layout.screenPaddingH,
    marginBottom: Spacing[4],
    flexWrap: 'wrap',
  },
  list: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingBottom: Spacing[20],
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: Spacing[8],
    paddingVertical: Spacing[12],
  },
  fab: {
    position: 'absolute',
    bottom: Spacing[8],
    right: Layout.screenPaddingH,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.lg,
  },
});
