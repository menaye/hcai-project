/**
 * Task Detail screen – where the actual work happens
 *
 * Shows the full step list for a task with completion tracking.
 * Celebrates progress as steps are checked off.
 * AI-generated encouragement on step completion.
 *
 * Design principles:
 *  - §14.3 Show progress early and frequently — progress ring + bar always visible
 *  - §14.5 Emotional acknowledgment — mascot reacts to completions
 *  - §14.4 Preserve autonomy — students can skip steps or reorder
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import { Spacing, Layout, Radius } from '../../constants/spacing';
import { H3, H4, Body, BodySmall, Label } from '../../components/ui/Typography';
import { Button, Card } from '../../components/ui';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { HumanMascot } from '../../components/mascot/HumanMascot';
import { StepItem } from '../../components/task/StepItem';
import { useAuthStore } from '../../store/authStore';
import { useTaskStore } from '../../store/taskStore';
import { updateTaskStep, updateTask, recordActivity } from '../../services/firebase/firestore';
import { getStepEncouragement } from '../../services/ai/claude';
import { formatDaysUntil } from '../../utils/dateUtils';
import type { Task, TaskStep } from '../../types';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { tasks } = useTaskStore();

  const task = tasks.find((t) => t.id === id);
  const [encouragement, setEncouragement] = useState<string | null>(null);
  const [mascotState, setMascotState] = useState<'idle' | 'happy' | 'encouraging'>('idle');
  const [completing, setCompleting] = useState<string | null>(null);

  const isComplete = task?.status === 'completed';
  const totalSteps = task?.steps.length ?? 0;
  const completedSteps = task?.steps.filter((s) => s.status === 'completed').length ?? 0;
  const progress = totalSteps > 0 ? completedSteps / totalSteps : 0;

  const handleCompleteStep = async (stepId: string) => {
    if (!task || !user || completing) return;
    const step = task.steps.find((s) => s.id === stepId);
    if (!step || step.status === 'completed') return;

    setCompleting(stepId);
    setMascotState('happy');

    try {
      // Find next pending step
      const stepIndex = task.steps.findIndex((s) => s.id === stepId);
      const nextStep = task.steps[stepIndex + 1];

      // Update completed step + activate next
      await updateTaskStep(user.uid, task.id, stepId, {
        status: 'completed',
        completedAt: Date.now(),
      });

      if (nextStep && nextStep.status === 'pending') {
        await updateTaskStep(user.uid, task.id, nextStep.id, {
          status: 'active',
        });
      }

      // Record for streak
      await recordActivity(user.uid, 'step');

      // Get AI encouragement (non-blocking)
      const stepsLeft = totalSteps - completedSteps - 1;
      if (stepsLeft >= 0) {
        getStepEncouragement(task.title, step.title, stepsLeft)
          .then((msg) => {
            setEncouragement(msg);
            setTimeout(() => setEncouragement(null), 5000);
          })
          .catch(() => {});
      }

      // Check if task is now fully complete
      const allDone = task.steps.every(
        (s) => s.id === stepId ? true : s.status === 'completed' || s.status === 'skipped',
      );
      if (allDone) {
        await recordActivity(user.uid, 'task');
        setMascotState('happy');
      }
    } catch (e) {
      console.error('Step completion error:', e);
    } finally {
      setCompleting(null);
      setTimeout(() => setMascotState('idle'), 2000);
    }
  };

  const handleDeleteTask = () => {
    Alert.alert(
      'Abandon task?',
      'This will remove the task and all its steps.',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Abandon',
          style: 'destructive',
          onPress: async () => {
            if (!user || !task) return;
            await updateTask(user.uid, task.id, { status: 'abandoned' });
            router.back();
          },
        },
      ],
    );
  };

  if (!task) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.notFound}>
          <Body color={Colors.textSecondary}>Task not found.</Body>
          <Button label="Go back" onPress={() => router.back()} variant="ghost" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDeleteTask} style={styles.menuBtn}>
          <Ionicons name="trash-outline" size={20} color={Colors.textTertiary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress section */}
        <LinearGradient
          colors={[Colors.primaryLight, Colors.background]}
          style={styles.progressBanner}
        >
          <View style={styles.progressRow}>
            <View style={styles.progressInfo}>
              <Label color={Colors.textTertiary}>
                {isComplete ? 'COMPLETED' : 'IN PROGRESS'}
              </Label>
              <H3 color={Colors.textPrimary} style={styles.taskTitle} numberOfLines={3}>
                {task.title}
              </H3>
              {task.dueAt && !isComplete && (
                <BodySmall color={Colors.textSecondary}>
                  {formatDaysUntil(task.dueAt)}
                </BodySmall>
              )}
            </View>
            <View style={styles.mascotCol}>
              <HumanMascot state={mascotState} size="sm" />
            </View>
          </View>

          <View style={styles.progressBarRow}>
            <ProgressBar
              progress={progress}
              color={isComplete ? Colors.success : Colors.primary}
              trackColor={isComplete ? Colors.successLight : Colors.primaryLight}
              height={10}
            />
            <Body color={isComplete ? Colors.success : Colors.primary} style={styles.progressText}>
              {completedSteps}/{totalSteps} steps
            </Body>
          </View>
        </LinearGradient>

        {/* AI encouragement toast */}
        {encouragement && (
          <Card color={Colors.successLight} style={styles.encourageCard} padding={Spacing[4]}>
            <Body color={Colors.success}>{encouragement}</Body>
          </Card>
        )}

        {/* Motivational context */}
        {task.aiContext && !isComplete && (
          <Card color={Colors.primaryLight} style={styles.motivCard} padding={Spacing[4]}>
            <BodySmall color={Colors.primary} style={styles.motivText}>
              {task.aiContext}
            </BodySmall>
          </Card>
        )}

        {/* Completion celebration */}
        {isComplete && (
          <Card color={Colors.successLight} style={styles.completeCard} padding={Spacing[5]}>
            <H4 align="center" color={Colors.success}>
              Done! 🎉
            </H4>
            <Body align="center" color={Colors.success} style={styles.completeText}>
              You finished every step. That took real work.
            </Body>
          </Card>
        )}

        {/* Steps */}
        <Label color={Colors.textTertiary} style={styles.stepsLabel}>
          STEPS
        </Label>

        {task.steps.map((step) => (
          <StepItem
            key={step.id}
            step={step}
            onComplete={handleCompleteStep}
          />
        ))}

        {/* Description */}
        {task.description ? (
          <Card style={styles.descCard} padding={Spacing[4]}>
            <Label color={Colors.textTertiary} style={styles.descLabel}>
              ORIGINAL NOTE
            </Label>
            <Body color={Colors.textSecondary}>{task.description}</Body>
          </Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing[2],
    paddingBottom: Spacing[1],
  },
  backBtn: {
    padding: Spacing[2],
    marginLeft: -Spacing[2],
  },
  menuBtn: {
    padding: Spacing[2],
    marginRight: -Spacing[2],
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingBottom: Spacing[16],
  },
  progressBanner: {
    borderRadius: Radius.xl,
    padding: Spacing[5],
    marginBottom: Spacing[4],
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing[4],
  },
  progressInfo: {
    flex: 1,
    gap: Spacing[1],
  },
  taskTitle: {
    lineHeight: 30,
  },
  mascotCol: {
    marginLeft: Spacing[3],
  },
  progressBarRow: {
    gap: Spacing[2],
  },
  progressText: {
    fontWeight: '600',
    textAlign: 'right',
    fontSize: 13,
  },
  encourageCard: {
    marginBottom: Spacing[4],
  },
  motivCard: {
    marginBottom: Spacing[4],
  },
  motivText: {
    lineHeight: 20,
    fontStyle: 'italic',
  },
  completeCard: {
    marginBottom: Spacing[4],
  },
  completeText: {
    marginTop: Spacing[2],
    lineHeight: 22,
  },
  stepsLabel: {
    letterSpacing: 0.8,
    marginBottom: Spacing[3],
    marginTop: Spacing[2],
  },
  descCard: {
    marginTop: Spacing[4],
  },
  descLabel: {
    letterSpacing: 0.8,
    marginBottom: Spacing[2],
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[4],
  },
});
