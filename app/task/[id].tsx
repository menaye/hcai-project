/**
 * Task Detail screen – where the actual work happens
 *
 * Shows the full step list for a task with completion tracking.
 * Celebrates progress as steps are checked off.
 * AI-generated encouragement on step completion.
 * Focus Mode: minimal one-step-at-a-time view for deep work.
 *
 * Design principles:
 *  - §14.3 Show progress early and frequently — progress ring + bar always visible
 *  - §14.5 Emotional acknowledgment — mascot reacts to completions
 *  - §14.4 Preserve autonomy — students can un-check steps, edit title, delete task
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Colors } from '../../constants/colors';
import { Spacing, Layout, Radius, Shadow } from '../../constants/spacing';
import { H2, H3, H4, Body, BodySmall, Label } from '../../components/ui/Typography';
import { Button, Card } from '../../components/ui';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { HumanMascot } from '../../components/mascot/HumanMascot';
import { StepItem } from '../../components/task/StepItem';
import { useAuthStore } from '../../store/authStore';
import { useTaskStore } from '../../store/taskStore';
import { updateTaskStep, updateTask, recordActivity, deleteTask } from '../../services/firebase/firestore';
import { getStepEncouragement } from '../../services/ai/claude';
import { formatDaysUntil } from '../../utils/dateUtils';
import type { Task, TaskStep } from '../../types';

const PRIORITY_COLOR = { low: Colors.success, medium: Colors.gold, high: Colors.accent, urgent: Colors.error };
const PRIORITY_LABEL = { low: 'Low priority', medium: 'Medium priority', high: 'High priority', urgent: 'Urgent' };

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { tasks } = useTaskStore();

  const task = tasks.find((t) => t.id === id);
  const [encouragement, setEncouragement] = useState<string | null>(null);
  const [firstStepCelebration, setFirstStepCelebration] = useState(false);
  const [mascotState, setMascotState] = useState<'idle' | 'happy' | 'encouraging'>('idle');
  const [completing, setCompleting] = useState<string | null>(null);
  const [focusModeActive, setFocusModeActive] = useState(false);
  const [editTitleVisible, setEditTitleVisible] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [editDueAt, setEditDueAt] = useState<number | undefined>();
  const [editTargetDate, setEditTargetDate] = useState<number | undefined>();
  const [showEditDuePicker, setShowEditDuePicker] = useState(false);
  const [showEditTargetPicker, setShowEditTargetPicker] = useState(false);
  const [showEditDueCalendar, setShowEditDueCalendar] = useState(false);
  const [showEditTargetCalendar, setShowEditTargetCalendar] = useState(false);
  const [savingTitle, setSavingTitle] = useState(false);
  // Step editing
  const [editStepVisible, setEditStepVisible] = useState(false);
  const [editingStep, setEditingStep] = useState<TaskStep | null>(null);
  const [editStepTitle, setEditStepTitle] = useState('');
  const [editStepDetail, setEditStepDetail] = useState('');
  const [editStepMinutes, setEditStepMinutes] = useState('');
  const [savingStep, setSavingStep] = useState(false);

  const isComplete = task?.status === 'completed';
  const totalSteps = task?.steps.length ?? 0;
  const completedSteps = task?.steps.filter((s) => s.status === 'completed').length ?? 0;
  const progress = totalSteps > 0 ? completedSteps / totalSteps : 0;
  const activeStep = task?.steps.find((s) => s.status === 'active') ?? null;

  const handleCompleteStep = async (stepId: string) => {
    if (!task || !user || completing) return;
    const step = task.steps.find((s) => s.id === stepId);
    if (!step || step.status === 'completed') return;

    setCompleting(stepId);
    setMascotState('happy');

    // Detect first step completion (no steps completed yet)
    const isVeryFirstStep = completedSteps === 0;

    try {
      const stepIndex = task.steps.findIndex((s) => s.id === stepId);
      const nextStep = task.steps[stepIndex + 1];

      // Execute all independent updates in parallel for responsiveness
      const updates = [
        updateTaskStep(user.uid, task.id, stepId, {
          status: 'completed',
          completedAt: Date.now(),
        }),
        recordActivity(user.uid, 'step'),
      ];

      // Add next step activation if needed
      if (nextStep && nextStep.status === 'pending') {
        updates.push(updateTaskStep(user.uid, task.id, nextStep.id, { status: 'active' }));
      }

      // Wait for all core updates in parallel
      await Promise.all(updates);

      if (isVeryFirstStep) {
        setFirstStepCelebration(true);
        setTimeout(() => setFirstStepCelebration(false), 4000);
      }

      // Fire off encouragement in background (don't await)
      const stepsLeft = totalSteps - completedSteps - 1;
      if (stepsLeft >= 0 && !isVeryFirstStep) {
        getStepEncouragement(task.title, step.title, stepsLeft)
          .then((msg) => {
            setEncouragement(msg);
            setTimeout(() => setEncouragement(null), 5000);
          })
          .catch(() => {});
      }

      const allDone = task.steps.every(
        (s) => s.id === stepId ? true : s.status === 'completed' || s.status === 'skipped',
      );
      if (allDone) {
        await recordActivity(user.uid, 'task');
        setMascotState('happy');
        setFocusModeActive(false); // exit focus mode on task completion
      }
    } catch (e) {
      console.error('Step completion error:', e);
    } finally {
      setCompleting(null);
      setTimeout(() => setMascotState('idle'), 2000);
    }
  };

  const handleUncheckStep = async (stepId: string) => {
    if (!task || !user) return;
    try {
      const stepIndex = task.steps.findIndex((s) => s.id === stepId);
      if (stepIndex < 0) return;

      // Build updates: mark this step active, reset all subsequent steps to pending
      const updates = [
        updateTaskStep(user.uid, task.id, stepId, {
          status: 'active',
          completedAt: undefined,
        }),
      ];

      // Reset all steps after this one to pending
      for (let i = stepIndex + 1; i < task.steps.length; i++) {
        updates.push(
          updateTaskStep(user.uid, task.id, task.steps[i].id, {
            status: 'pending',
            completedAt: undefined,
          }),
        );
      }

      await Promise.all(updates);
    } catch (e) {
      console.error('Un-check error:', e);
    }
  };

  const handleDeleteTask = () => {
    if (!user || !task) return;
    const completedCount = task.steps.filter((s) => s.status === 'completed').length;
    const warningMsg = completedCount > 0
      ? `You've completed ${completedCount} step${completedCount > 1 ? 's' : ''} already. This will remove the task from your timeline.`
      : 'This will permanently remove the task and all its steps.';

    Alert.alert('Delete this task?', warningMsg, [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteTask(user.uid, task.id);
          router.back();
        },
      },
    ]);
  };

  const handleEditTitle = () => {
    if (!task) return;
    setEditTitleValue(task.title);
    setEditDueAt(task.dueAt);
    setEditTargetDate(task.targetDate);
    setEditTitleVisible(true);
  };

  const handleSaveTitle = async () => {
    if (!user || !task || !editTitleValue.trim()) return;
    setSavingTitle(true);
    try {
      await updateTask(user.uid, task.id, {
        title: editTitleValue.trim(),
        dueAt: editDueAt,
        targetDate: editTargetDate,
      });
      setEditTitleVisible(false);
    } catch {
      Alert.alert('Could not save', 'Please try again.');
    } finally {
      setSavingTitle(false);
    }
  };

  const openStepEditor = (step: TaskStep) => {
    setEditingStep(step);
    setEditStepTitle(step.title);
    setEditStepDetail(step.detail ?? '');
    setEditStepMinutes(step.estimatedMinutes ? String(step.estimatedMinutes) : '');
    setEditStepVisible(true);
  };

  const handleStepLongPress = (step: TaskStep) => {
    Alert.alert(step.title, undefined, [
      {
        text: 'Edit step',
        onPress: () => openStepEditor(step),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSaveStep = async () => {
    if (!user || !task || !editingStep || !editStepTitle.trim()) return;
    setSavingStep(true);
    try {
      const parsedMinutes = editStepMinutes.trim() ? Number(editStepMinutes.trim()) : undefined;
      await updateTaskStep(user.uid, task.id, editingStep.id, {
        title: editStepTitle.trim(),
        detail: editStepDetail.trim() || undefined,
        estimatedMinutes:
          parsedMinutes && Number.isFinite(parsedMinutes) && parsedMinutes > 0
            ? parsedMinutes
            : undefined,
      });
      setEditStepVisible(false);
      setEditingStep(null);
    } catch {
      Alert.alert('Could not save', 'Please try again.');
    } finally {
      setSavingStep(false);
    }
  };

  // Quick-select date options for editing
  function quickDateOptions() {
    const now = Date.now();
    const DAY = 86400000;
    return [
      { label: 'Today', value: now },
      { label: 'Tomorrow', value: now + DAY },
      { label: '3 days', value: now + 3 * DAY },
      { label: '1 week', value: now + 7 * DAY },
      { label: '2 weeks', value: now + 14 * DAY },
      { label: '1 month', value: now + 30 * DAY },
    ];
  }

  function formatDateShort(epoch: number): string {
    return new Date(epoch).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  }

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

  // ── Focus Mode ───────────────────────────────────────────────
  if (focusModeActive && activeStep) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <FocusModeView
          step={activeStep}
          task={task}
          completedSteps={completedSteps}
          totalSteps={totalSteps}
          encouragement={encouragement}
          mascotState={mascotState}
          onComplete={handleCompleteStep}
          onExit={() => setFocusModeActive(false)}
        />
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
        <View style={styles.headerActions}>
          {!isComplete && activeStep && (
            <TouchableOpacity onPress={() => setFocusModeActive(true)} style={styles.actionBtn}>
              <Ionicons name="eye-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleEditTitle} style={styles.actionBtn}>
            <Ionicons name="pencil-outline" size={20} color={Colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDeleteTask} style={styles.actionBtn}>
            <Ionicons name="trash-outline" size={20} color={Colors.textTertiary} />
          </TouchableOpacity>
        </View>
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
              {task.priority && (
                <View style={[styles.priorityTag, { backgroundColor: PRIORITY_COLOR[task.priority] + '22' }]}>
                  <BodySmall color={PRIORITY_COLOR[task.priority]}>
                    {PRIORITY_LABEL[task.priority]}
                  </BodySmall>
                </View>
              )}
              {task.dueAt && !isComplete && (
                <BodySmall color={Colors.textSecondary}>
                  {formatDaysUntil(task.dueAt)}
                </BodySmall>
              )}
              {task.targetDate && !isComplete && !task.dueAt && (
                <BodySmall color={Colors.primary}>
                  Target: {formatDaysUntil(task.targetDate)}
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

        {/* First-step celebration */}
        {firstStepCelebration && (
          <Card color={Colors.primaryLight} style={styles.encourageCard} padding={Spacing[4]}>
            <View style={styles.celebRow}>
              <Body style={styles.celebEmoji}>🚀</Body>
              <View style={{ flex: 1 }}>
                <Body color={Colors.primary} style={{ fontWeight: '700' }}>You've started!</Body>
                <BodySmall color={Colors.primary}>
                  The hardest part is done. Keep the momentum going.
                </BodySmall>
              </View>
            </View>
          </Card>
        )}

        {/* AI encouragement toast */}
        {encouragement && (
          <Card color={Colors.successLight} style={styles.encourageCard} padding={Spacing[4]}>
            <Body color={Colors.success}>{encouragement}</Body>
          </Card>
        )}

        {/* Self-reward reminder */}
        {task.reward && !isComplete && (
          <Card color={Colors.goldLight} style={styles.rewardCard} padding={Spacing[4]}>
            <View style={styles.rewardRow}>
              <Ionicons name="gift-outline" size={16} color={Colors.gold} />
              <BodySmall color={Colors.textSecondary} style={styles.rewardText}>
                {task.reward}
              </BodySmall>
            </View>
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
          <LinearGradient
            colors={[Colors.successLight, Colors.background]}
            style={styles.completeCard}
          >
            <HumanMascot state="happy" size="md" />
            <H4 align="center" color={Colors.success} style={{ marginTop: Spacing[3] }}>
              Task complete! 🎉
            </H4>
            <Body align="center" color={Colors.success} style={styles.completeText}>
              You finished every step. That took real effort.
            </Body>
            {task.reward && (
              <Body align="center" color={Colors.gold} style={styles.rewardCelebration}>
                🎁 {task.reward}
              </Body>
            )}
          </LinearGradient>
        )}

        {/* Focus Mode CTA */}
        {!isComplete && activeStep && (
          <TouchableOpacity
            style={styles.focusCta}
            onPress={() => setFocusModeActive(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="eye-outline" size={16} color={Colors.primary} />
            <BodySmall color={Colors.primary}>Switch to Focus Mode — one step at a time</BodySmall>
          </TouchableOpacity>
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
            onUncheck={!isComplete ? handleUncheckStep : undefined}
            onLongPress={!isComplete ? handleStepLongPress : undefined}
            onEdit={!isComplete ? openStepEditor : undefined}
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

      {/* Edit task modal */}
      <Modal
        visible={editTitleVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditTitleVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.editModal, styles.editModalSlide]}>
            <H4 color={Colors.textPrimary} style={styles.editModalTitle}>
              Edit task
            </H4>
            <Label color={Colors.textTertiary} style={styles.editFieldLabel}>
              TASK NAME
            </Label>
            <TextInput
              value={editTitleValue}
              onChangeText={setEditTitleValue}
              style={styles.editInput}
              multiline
              autoFocus
              placeholder="Task name"
              placeholderTextColor={Colors.textTertiary}
            />

            <Label color={Colors.textTertiary} style={[styles.editFieldLabel, { marginTop: Spacing[4] }]}>
              DEADLINE
            </Label>
            <TouchableOpacity
              style={styles.editDateField}
              onPress={() => setShowEditDuePicker(true)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="calendar-outline"
                size={16}
                color={editDueAt ? Colors.primary : Colors.textTertiary}
              />
              <Body color={editDueAt ? Colors.primary : Colors.textTertiary}>
                {editDueAt ? formatDateShort(editDueAt) : 'No deadline'}
              </Body>
            </TouchableOpacity>

            <Label color={Colors.textTertiary} style={[styles.editFieldLabel, { marginTop: Spacing[4] }]}>
              PERSONAL TARGET DATE
            </Label>
            <TouchableOpacity
              style={styles.editDateField}
              onPress={() => setShowEditTargetPicker(true)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="flag-outline"
                size={16}
                color={editTargetDate ? Colors.primary : Colors.textTertiary}
              />
              <Body color={editTargetDate ? Colors.primary : Colors.textTertiary}>
                {editTargetDate ? formatDateShort(editTargetDate) : 'No personal target'}
              </Body>
            </TouchableOpacity>

            <View style={styles.editModalActions}>
              <Button
                label="Cancel"
                variant="ghost"
                onPress={() => setEditTitleVisible(false)}
                style={styles.editModalBtn}
              />
              <Button
                label="Save"
                onPress={handleSaveTitle}
                loading={savingTitle}
                disabled={!editTitleValue.trim()}
                style={styles.editModalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit task — due date picker */}
      {showEditDuePicker && (
        <Modal transparent animationType="fade" onRequestClose={() => setShowEditDuePicker(false)}>
          <TouchableOpacity
            style={styles.pickerOverlay}
            activeOpacity={1}
            onPress={() => setShowEditDuePicker(false)}
          >
            <View style={styles.pickerCard}>
              <Label color={Colors.textTertiary} style={styles.pickerTitle}>DEADLINE</Label>
              {quickDateOptions().map((opt) => (
                <TouchableOpacity
                  key={opt.label}
                  style={[styles.pickerRow, editDueAt === opt.value && styles.pickerRowSelected]}
                  onPress={() => { setEditDueAt(opt.value); setShowEditDuePicker(false); }}
                >
                  <Body color={editDueAt === opt.value ? Colors.primary : Colors.textPrimary}>
                    {opt.label}
                  </Body>
                  <BodySmall color={Colors.textTertiary}>{formatDateShort(opt.value)}</BodySmall>
                </TouchableOpacity>
              ))}
              {/* Calendar picker button */}
              <TouchableOpacity
                style={styles.pickerRow}
                onPress={() => { setShowEditDuePicker(false); setShowEditDueCalendar(true); }}
              >
                <Body color={Colors.primary}>Choose from calendar</Body>
                <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
              </TouchableOpacity>
              {editDueAt !== undefined && (
                <TouchableOpacity
                  style={styles.pickerRow}
                  onPress={() => { setEditDueAt(undefined); setShowEditDuePicker(false); }}
                >
                  <Body color={Colors.error}>Clear deadline</Body>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.pickerClose} onPress={() => setShowEditDuePicker(false)}>
                <Body color={Colors.textTertiary}>Close</Body>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Edit task — target date picker */}
      {showEditTargetPicker && (
        <Modal transparent animationType="fade" onRequestClose={() => setShowEditTargetPicker(false)}>
          <TouchableOpacity
            style={styles.pickerOverlay}
            activeOpacity={1}
            onPress={() => setShowEditTargetPicker(false)}
          >
            <View style={styles.pickerCard}>
              <Label color={Colors.textTertiary} style={styles.pickerTitle}>PERSONAL TARGET DATE</Label>
              {quickDateOptions().map((opt) => (
                <TouchableOpacity
                  key={opt.label}
                  style={[styles.pickerRow, editTargetDate === opt.value && styles.pickerRowSelected]}
                  onPress={() => { setEditTargetDate(opt.value); setShowEditTargetPicker(false); }}
                >
                  <Body color={editTargetDate === opt.value ? Colors.primary : Colors.textPrimary}>
                    {opt.label}
                  </Body>
                  <BodySmall color={Colors.textTertiary}>{formatDateShort(opt.value)}</BodySmall>
                </TouchableOpacity>
              ))}
              {/* Calendar picker button */}
              <TouchableOpacity
                style={styles.pickerRow}
                onPress={() => { setShowEditTargetPicker(false); setShowEditTargetCalendar(true); }}
              >
                <Body color={Colors.primary}>Choose from calendar</Body>
                <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
              </TouchableOpacity>
              {editTargetDate !== undefined && (
                <TouchableOpacity
                  style={styles.pickerRow}
                  onPress={() => { setEditTargetDate(undefined); setShowEditTargetPicker(false); }}
                >
                  <Body color={Colors.error}>Clear target</Body>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.pickerClose} onPress={() => setShowEditTargetPicker(false)}>
                <Body color={Colors.textTertiary}>Close</Body>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Edit task — due date calendar */}
      {showEditDueCalendar && (
        <DateTimePicker
          value={editDueAt ? new Date(editDueAt) : new Date()}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
            setShowEditDueCalendar(false);
            if (event.type === 'set' && selectedDate) {
              setEditDueAt(selectedDate.getTime());
            }
          }}
        />
      )}

      {/* Edit task — target date calendar */}
      {showEditTargetCalendar && (
        <DateTimePicker
          value={editTargetDate ? new Date(editTargetDate) : new Date()}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
            setShowEditTargetCalendar(false);
            if (event.type === 'set' && selectedDate) {
              setEditTargetDate(selectedDate.getTime());
            }
          }}
        />
      )}

      {/* Edit step modal */}
      <Modal
        visible={editStepVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditStepVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModal}>
            <H4 color={Colors.textPrimary} style={styles.editModalTitle}>
              Edit step
            </H4>
            <Label color={Colors.textTertiary} style={styles.editFieldLabel}>
              STEP TITLE
            </Label>
            <TextInput
              value={editStepTitle}
              onChangeText={setEditStepTitle}
              style={styles.editInput}
              autoFocus
              placeholder="Step title"
              placeholderTextColor={Colors.textTertiary}
            />
            <Label color={Colors.textTertiary} style={[styles.editFieldLabel, { marginTop: Spacing[4] }]}>
              DETAILS
            </Label>
            <TextInput
              value={editStepDetail}
              onChangeText={setEditStepDetail}
              style={[styles.editInput, styles.editTextarea]}
              multiline
              numberOfLines={3}
              placeholder="How should you do this step?"
              placeholderTextColor={Colors.textTertiary}
            />
            <Label color={Colors.textTertiary} style={[styles.editFieldLabel, { marginTop: Spacing[4] }]}>
              ESTIMATED MINUTES
            </Label>
            <TextInput
              value={editStepMinutes}
              onChangeText={setEditStepMinutes}
              style={styles.editInput}
              keyboardType="number-pad"
              placeholder="20"
              placeholderTextColor={Colors.textTertiary}
            />
            <View style={styles.editModalActions}>
              <Button
                label="Cancel"
                variant="ghost"
                onPress={() => {
                  setEditStepVisible(false);
                  setEditingStep(null);
                }}
                style={styles.editModalBtn}
              />
              <Button
                label="Save"
                onPress={handleSaveStep}
                loading={savingStep}
                disabled={!editStepTitle.trim()}
                style={styles.editModalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Focus Mode ─────────────────────────────────────────────────

function FocusModeView({
  step,
  task,
  completedSteps,
  totalSteps,
  encouragement,
  mascotState,
  onComplete,
  onExit,
}: {
  step: TaskStep;
  task: Task;
  completedSteps: number;
  totalSteps: number;
  encouragement: string | null;
  mascotState: 'idle' | 'happy' | 'encouraging';
  onComplete: (stepId: string) => void;
  onExit: () => void;
}) {
  const progress = totalSteps > 0 ? completedSteps / totalSteps : 0;
  return (
    <View style={styles.focusContainer}>
      {/* Exit button */}
      <TouchableOpacity onPress={onExit} style={styles.focusExit}>
        <Ionicons name="close" size={22} color={Colors.textTertiary} />
      </TouchableOpacity>

      {/* Progress pill */}
      <Label color={Colors.textTertiary} style={styles.focusProgress}>
        STEP {completedSteps + 1} OF {totalSteps}
      </Label>

      <View style={styles.focusProgressBar}>
        <ProgressBar progress={progress} height={6} />
      </View>

      {/* Mascot */}
      <View style={styles.focusMascot}>
        <HumanMascot state={mascotState} size="md" />
      </View>

      {/* Big step text */}
      <H2 align="center" color={Colors.textPrimary} style={styles.focusStepTitle}>
        {step.title}
      </H2>

      {step.detail && (
        <Body align="center" color={Colors.textSecondary} style={styles.focusStepDetail}>
          {step.detail}
        </Body>
      )}

      {step.estimatedMinutes && (
        <View style={styles.focusTimePill}>
          <Ionicons name="time-outline" size={14} color={Colors.textTertiary} />
          <BodySmall color={Colors.textTertiary}>~{step.estimatedMinutes} min</BodySmall>
        </View>
      )}

      {/* Encouragement */}
      {encouragement && (
        <Body align="center" color={Colors.success} style={styles.focusEncouragement}>
          {encouragement}
        </Body>
      )}

      {/* Done button */}
      <Button
        label="I did this ✓"
        onPress={() => onComplete(step.id)}
        size="lg"
        fullWidth
        style={styles.focusDoneBtn}
      />

      <BodySmall align="center" color={Colors.textTertiary} style={styles.focusHint}>
        Tap to mark complete and see your next step.
      </BodySmall>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────

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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
  },
  actionBtn: {
    padding: Spacing[2],
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
  priorityTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: Radius.xs,
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
  celebRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  celebEmoji: {
    fontSize: 24,
  },
  encourageCard: {
    marginBottom: Spacing[4],
  },
  rewardCard: {
    marginBottom: Spacing[4],
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[2],
  },
  rewardText: {
    flex: 1,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  motivCard: {
    marginBottom: Spacing[4],
  },
  motivText: {
    lineHeight: 20,
    fontStyle: 'italic',
  },
  completeCard: {
    borderRadius: Radius.xl,
    padding: Spacing[6],
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  completeText: {
    marginTop: Spacing[2],
    lineHeight: 22,
  },
  rewardCelebration: {
    marginTop: Spacing[3],
    fontWeight: '600',
    lineHeight: 22,
  },
  focusCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    justifyContent: 'center',
    paddingVertical: Spacing[3],
    marginBottom: Spacing[2],
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight,
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
  // Edit modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: Layout.screenPaddingH,
  },
  editModal: {
    backgroundColor: Colors.surface,
    borderRadius: Radius['2xl'],
    padding: Spacing[6],
    ...Shadow.lg,
  },
  editModalTitle: {
    marginBottom: Spacing[4],
  },
  editInput: {
    borderWidth: 1.5,
    borderColor: Colors.borderActive,
    borderRadius: Radius.md,
    padding: Spacing[4],
    fontSize: 16,
    color: Colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  editTextarea: {
    minHeight: 110,
  },
  editModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing[2],
    marginTop: Spacing[4],
  },
  editModalBtn: {
    flex: 1,
  },
  // Edit task extended fields
  editModalSlide: {
    borderRadius: 0,
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    paddingBottom: Spacing[10],
  },
  editFieldLabel: {
    letterSpacing: 0.8,
    marginBottom: Spacing[2],
  },
  editDateField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    backgroundColor: Colors.background,
  },
  // Date picker
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  pickerCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    padding: Spacing[5],
    paddingBottom: Spacing[8],
  },
  pickerTitle: {
    letterSpacing: 0.8,
    marginBottom: Spacing[4],
    textAlign: 'center',
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  pickerRowSelected: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[2],
    marginHorizontal: -Spacing[2],
    borderBottomWidth: 0,
  },
  pickerClose: {
    marginTop: Spacing[4],
    alignItems: 'center',
  },
  // Focus mode
  focusContainer: {
    flex: 1,
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing[6],
    paddingBottom: Spacing[8],
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusExit: {
    position: 'absolute',
    top: Spacing[2],
    right: Layout.screenPaddingH,
    padding: Spacing[2],
  },
  focusProgress: {
    letterSpacing: 1,
    marginBottom: Spacing[3],
  },
  focusProgressBar: {
    width: '100%',
    marginBottom: Spacing[8],
  },
  focusMascot: {
    marginBottom: Spacing[6],
  },
  focusStepTitle: {
    lineHeight: 36,
    marginBottom: Spacing[4],
  },
  focusStepDetail: {
    lineHeight: 24,
    marginBottom: Spacing[4],
    paddingHorizontal: Spacing[4],
  },
  focusTimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing[4],
  },
  focusEncouragement: {
    lineHeight: 22,
    marginBottom: Spacing[4],
    paddingHorizontal: Spacing[4],
  },
  focusDoneBtn: {
    marginTop: Spacing[4],
    width: '100%',
  },
  focusHint: {
    marginTop: Spacing[3],
    lineHeight: 18,
  },
});
