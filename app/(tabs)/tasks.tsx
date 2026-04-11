/**
 * Tasks screen – To-Do list view
 *
 * Shows active tasks first, then completed.
 * From rough UI sketch (screen3): numbered list with checkboxes.
 * FAB to add a new task.
 */

import React, { useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing, Layout, Radius, Shadow } from '../../constants/spacing';
import { H3, Body, Label } from '../../components/ui/Typography';
import { Chip } from '../../components/ui/Chip';
import { TaskCard } from '../../components/task/TaskCard';
import { useTaskStore } from '../../store/taskStore';
import type { Task } from '../../types';

type Filter = 'active' | 'completed' | 'all';

export default function TasksScreen() {
  const { tasks } = useTaskStore();
  const [filter, setFilter] = useState<Filter>('active');

  const filtered = tasks.filter((t) => {
    if (filter === 'active') return t.status === 'active';
    if (filter === 'completed') return t.status === 'completed';
    return true;
  });

  const handleTaskPress = (task: Task) => {
    router.push(`/task/${task.id}`);
  };

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
        {(['active', 'completed', 'all'] as Filter[]).map((f) => (
          <Chip
            key={f}
            label={f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Done'}
            selected={filter === f}
            onPress={() => setFilter(f)}
            style={styles.chip}
          />
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskCard task={item} onPress={handleTaskPress} />
        )}
        contentContainerStyle={[
          styles.list,
          filtered.length === 0 && styles.emptyList,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState filter={filter} />}
      />

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
  return (
    <View style={styles.empty}>
      <Body align="center" color={Colors.textSecondary}>
        {filter === 'active'
          ? 'No active tasks.\nTap + to start something.'
          : filter === 'completed'
          ? "You haven't completed any tasks yet.\nYou've got this."
          : 'No tasks yet. Tap + to begin.'}
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
  },
  chip: {},
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
