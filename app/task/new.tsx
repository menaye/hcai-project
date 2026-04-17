/**
 * New Task screen – AI task decomposition interface
 *
 * The core interaction of Human.exe:
 *  1. Student describes their task with optional deadline, priority, and motivation
 *  2. AI breaks it into 4–6 concrete, manageable steps
 *  3. Student reviews and can re-generate or start immediately
 *
 * Design principles applied:
 *  - §14.1 Focus on the moment of initiation — zero setup, immediate value
 *  - §14.2 Specific, contextual guidance — AI uses the actual assignment text
 *  - §14.6 Minimize interface complexity — advanced options are collapsible
 *  - §14.5 Emotional acknowledgment — AI tone is warm, not transactional
 */

import React, { useState, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Colors } from '../../constants/colors';
import { Spacing, Layout, Radius, Shadow } from '../../constants/spacing';
import { H3, H4, Body, BodySmall, Label } from '../../components/ui/Typography';
import { Button, Input, Card } from '../../components/ui';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { HumanMascot } from '../../components/mascot/HumanMascot';
import { StepItem } from '../../components/task/StepItem';
import { useAuthStore } from '../../store/authStore';
import { decomposeTask, regenerateStep } from '../../services/ai/claude';
import { createTask } from '../../services/firebase/firestore';
import { generateId, generateStepId } from '../../utils/idUtils';
import type { Task, TaskStep, AITaskBreakdown, TaskPriority } from '../../types';
import { LinearGradient } from 'expo-linear-gradient';
type Phase = 'input' | 'loading' | 'review';

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: Colors.success },
  { value: 'medium', label: 'Medium', color: Colors.gold },
  { value: 'high', label: 'High', color: Colors.accent },
  { value: 'urgent', label: 'Urgent', color: Colors.error },
];

/** Quick-select date options relative to today */
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
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function NewTaskScreen() {
  const { user, profile } = useAuthStore();
  const [phase, setPhase] = useState<Phase>('input');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueAt, setDueAt] = useState<number | undefined>();
  const [targetDate, setTargetDate] = useState<number | undefined>();
  const [priority, setPriority] = useState<TaskPriority | undefined>();
  const [reward, setReward] = useState('');
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showDuePicker, setShowDuePicker] = useState(false);
  const [showTargetPicker, setShowTargetPicker] = useState(false);
  const [breakdown, setBreakdown] = useState<AITaskBreakdown | null>(null);
  const [saving, setSaving] = useState(false);
  const [regeneratingIdx, setRegeneratingIdx] = useState<number | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleCancel = () => {
    const hasContent = title?.trim() || description?.trim();
    if (!hasContent) {
      router.back();
      return;
    }
    Alert.alert(
      'Discard this task?',
      "You'll lose what you've entered.",
      [
        { text: 'Keep editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() },
      ],
    );
  };

  const handleDecompose = async () => {
    if (!title.trim()) return;

    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(
      async () => {
        setPhase('loading');
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();

        try {
          const result = await decomposeTask(
            title.trim(),
            description.trim(),
            profile?.context,
          );
          setBreakdown(result);

          Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(
            () => {
              setPhase('review');
              Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
            },
          );
        } catch (e: any) {
          if (e?.code === 'AI_REJECTED') {
            Alert.alert(
              "Can't help with that one",
              e.message ?? "I can only break down real, constructive tasks. Try something like a project, assignment, or personal goal.",
              [{ text: 'Got it' }],
            );
          } else {
            Alert.alert('Hmm, something went wrong', 'Check your connection and try again.');
          }
          setPhase('input');
          Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
        }
      },
    );
  };

  const handleRegenerate = async () => {
    if (!title.trim()) return;
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(
      async () => {
        setPhase('loading');
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        try {
          const result = await decomposeTask(title.trim(), description.trim(), profile?.context);
          setBreakdown(result);
          Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
            setPhase('review');
            Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
          });
        } catch (e: any) {
          if (e?.code === 'AI_REJECTED') {
            Alert.alert("Can't help with that one", e.message, [{ text: 'Got it' }]);
            setPhase('input');
          } else {
            Alert.alert('Could not regenerate', 'Please try again.');
            setPhase('review');
          }
          Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
        }
      },
    );
  };

  const handleRegenerateStep = async (index: number) => {
    if (!breakdown) return;
    setRegeneratingIdx(index);
    try {
      const step = breakdown.steps[index];
      const newStep = await regenerateStep(title, step.title);
      const updatedSteps = [...breakdown.steps];
      updatedSteps[index] = newStep;
      setBreakdown({ ...breakdown, steps: updatedSteps });
    } catch {
      Alert.alert('Could not regenerate this step', 'Try again.');
    } finally {
      setRegeneratingIdx(null);
    }
  };

  const handleSave = async () => {
    if (!user || !breakdown) return;
    setSaving(true);

    try {
      const taskId = generateId();
      const now = Date.now();

      const steps: TaskStep[] = breakdown.steps.map((s, i) => ({
        id: generateStepId(taskId, i + 1),
        taskId,
        order: i + 1,
        title: s.title,
        detail: s.detail,
        estimatedMinutes: s.estimatedMinutes,
        status: i === 0 ? 'active' : 'pending',
      }));

      const task: Task = {
        id: taskId,
        userId: user.uid,
        title: title.trim(),
        description: description.trim(),
        dueAt,
        targetDate,
        priority,
        reward: reward.trim() || undefined,
        status: 'active',
        steps,
        createdAt: now,
        updatedAt: now,
        aiContext: breakdown.motivationalNote,
      };

      await createTask(task);
      router.replace(`/task/${taskId}`);
    } catch {
      Alert.alert('Could not save', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Button label="Cancel" onPress={handleCancel} variant="ghost" size="sm" />
        {phase === 'review' && (
          <Button
            label="Save & Start"
            onPress={handleSave}
            size="sm"
            loading={saving}
            icon={<Ionicons name="rocket-outline" size={16} color={Colors.textInverse} />}
          />
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.ScrollView
          style={{ opacity: fadeAnim }}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {phase === 'input' && (
            <InputPhase
              title={title}
              setTitle={setTitle}
              description={description}
              setDescription={setDescription}
              dueAt={dueAt}
              setDueAt={setDueAt}
              targetDate={targetDate}
              setTargetDate={setTargetDate}
              priority={priority}
              setPriority={setPriority}
              reward={reward}
              setReward={setReward}
              showMoreOptions={showMoreOptions}
              setShowMoreOptions={setShowMoreOptions}
              showDuePicker={showDuePicker}
              setShowDuePicker={setShowDuePicker}
              showTargetPicker={showTargetPicker}
              setShowTargetPicker={setShowTargetPicker}
              onSubmit={handleDecompose}
            />
          )}

          {phase === 'loading' && <LoadingPhase taskTitle={title} />}

          {phase === 'review' && breakdown && (
            <ReviewPhase
              title={title}
              breakdown={breakdown}
              onSave={handleSave}
              onBack={() => setPhase('input')}
              onRegenerate={handleRegenerate}
              onRegenerateStep={handleRegenerateStep}
              regeneratingIdx={regeneratingIdx}
              saving={saving}
            />
          )}
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Sub-components ─────────────────────────────────────────────

function DateQuickPicker({
  value,
  onChange,
  onClose,
  minDate,
}: {
  value?: number;
  onChange: (v: number | undefined) => void;
  onClose: () => void;
  minDate?: number;
}) {
  const [showCalendar, setShowCalendar] = useState(false);
  
  const options = quickDateOptions().filter((o) => !minDate || o.value >= minDate);
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.pickerCard}>
          <Label color={Colors.textTertiary} style={styles.pickerTitle}>
            PICK A DATE
          </Label>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.label}
              style={[styles.pickerRow, value === opt.value && styles.pickerRowSelected]}
              onPress={() => { onChange(opt.value); onClose(); }}
            >
              <Body color={value === opt.value ? Colors.primary : Colors.textPrimary}>
                {opt.label}
              </Body>
              <BodySmall color={Colors.textTertiary}>{formatDateShort(opt.value)}</BodySmall>
            </TouchableOpacity>
          ))}
          {/* Calendar picker button */}
          <TouchableOpacity
            style={styles.pickerRow}
            onPress={() => setShowCalendar(true)}
          >
            <Body color={Colors.primary}>Choose from calendar</Body>
            <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
          </TouchableOpacity>
          {value !== undefined && (
            <TouchableOpacity style={styles.pickerRow} onPress={() => { onChange(undefined); onClose(); }}>
              <Body color={Colors.error}>Clear date</Body>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.pickerClose} onPress={onClose}>
            <Body color={Colors.textTertiary}>Close</Body>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
      {showCalendar && (
        <DateTimePicker
          value={value ? new Date(value) : new Date()}
          mode="date"
          display="default"
          minimumDate={minDate ? new Date(minDate) : undefined}
          onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
            setShowCalendar(false);
            if (event.type === 'set' && selectedDate) {
              onChange(selectedDate.getTime());
              onClose();
            }
          }}
        />
      )}
    </Modal>
  );
}

function InputPhase({
  title, setTitle, description, setDescription,
  dueAt, setDueAt, targetDate, setTargetDate,
  priority, setPriority, reward, setReward,
  showMoreOptions, setShowMoreOptions,
  showDuePicker, setShowDuePicker,
  showTargetPicker, setShowTargetPicker,
  onSubmit,
}: {
  title: string; setTitle: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  dueAt?: number; setDueAt: (v: number | undefined) => void;
  targetDate?: number; setTargetDate: (v: number | undefined) => void;
  priority?: TaskPriority; setPriority: (v: TaskPriority | undefined) => void;
  reward: string; setReward: (v: string) => void;
  showMoreOptions: boolean; setShowMoreOptions: (v: boolean) => void;
  showDuePicker: boolean; setShowDuePicker: (v: boolean) => void;
  showTargetPicker: boolean; setShowTargetPicker: (v: boolean) => void;
  onSubmit: () => void;
}) {
  return (
    <View style={styles.phase}>
      <View style={styles.mascotRow}>
        <HumanMascot state="encouraging" size="md" />
      </View>

      <View style={styles.titleRow}>
        <H3 color={Colors.textPrimary} style={[styles.phaseTitle, styles.flex1]}>
          What do you need to work on?
        </H3>
        <TouchableOpacity
          onPress={() =>
            Alert.alert(
              'What can I break down?',
              "Any real task you want to make progress on:\n\n• Assignments and projects\n• Work tasks and goals\n• Personal errands or habits\n• Study sessions\n• Creative work\n\nI'll break it into small, specific steps you can actually start.\n\nI won't help with illegal, unethical, or harmful requests.",
              [{ text: 'Got it' }],
            )
          }
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.infoBtn}
        >
          <Ionicons name="information-circle-outline" size={22} color={Colors.textTertiary} />
        </TouchableOpacity>
      </View>
      <Body color={Colors.textSecondary} style={styles.phaseSub}>
        Describe it — I'll break it into steps you can actually start with.
      </Body>

      <Input
        label="Task or assignment"
        placeholder="e.g. Write the introduction for my research paper on climate policy"
        value={title}
        onChangeText={setTitle}
        autoFocus
        returnKeyType="next"
        containerStyle={styles.field}
      />

      <Input
        label="Any details? (optional)"
        placeholder="Requirements, how stuck you feel, context..."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        containerStyle={styles.field}
      />

      {/* More options toggle */}
      <TouchableOpacity
        style={styles.moreOptionsToggle}
        onPress={() => setShowMoreOptions(!showMoreOptions)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={showMoreOptions ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={Colors.primary}
        />
        <BodySmall color={Colors.primary}>
          {showMoreOptions ? 'Hide options' : 'Add deadline, priority, or motivation'}
        </BodySmall>
      </TouchableOpacity>

      {showMoreOptions && (
        <View style={styles.moreOptionsSection}>
          {/* Due date */}
          <Label color={Colors.textTertiary} style={styles.optLabel}>DEADLINE</Label>
          <TouchableOpacity
            style={styles.dateField}
            onPress={() => setShowDuePicker(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar-outline" size={16} color={dueAt ? Colors.primary : Colors.textTertiary} />
            <Body color={dueAt ? Colors.primary : Colors.textTertiary}>
              {dueAt ? formatDateShort(dueAt) : 'No deadline set'}
            </Body>
          </TouchableOpacity>

          {/* Personal target date */}
          <Label color={Colors.textTertiary} style={[styles.optLabel, { marginTop: Spacing[4] }]}>
            PERSONAL TARGET DATE
          </Label>
          <BodySmall color={Colors.textTertiary} style={styles.optHint}>
            When you want to finish — before the deadline, for peace of mind.
          </BodySmall>
          <TouchableOpacity
            style={styles.dateField}
            onPress={() => setShowTargetPicker(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="flag-outline" size={16} color={targetDate ? Colors.primary : Colors.textTertiary} />
            <Body color={targetDate ? Colors.primary : Colors.textTertiary}>
              {targetDate ? formatDateShort(targetDate) : 'No personal target set'}
            </Body>
          </TouchableOpacity>

          {/* Priority */}
          <Label color={Colors.textTertiary} style={[styles.optLabel, { marginTop: Spacing[4] }]}>
            PRIORITY
          </Label>
          <View style={styles.priorityRow}>
            {PRIORITY_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.priorityBtn,
                  {
                    borderColor: opt.color,
                    backgroundColor: priority === opt.value ? opt.color + '22' : Colors.surface,
                  },
                ]}
                onPress={() => setPriority(priority === opt.value ? undefined : opt.value)}
                activeOpacity={0.7}
              >
                <BodySmall
                  color={priority === opt.value ? opt.color : Colors.textSecondary}
                  style={priority === opt.value ? { fontWeight: '700' } : {}}
                >
                  {opt.label}
                </BodySmall>
              </TouchableOpacity>
            ))}
          </View>

          {/* Self-reward */}
          <Label color={Colors.textTertiary} style={[styles.optLabel, { marginTop: Spacing[4] }]}>
            REWARD / CONSEQUENCE (OPTIONAL)
          </Label>
          <BodySmall color={Colors.textTertiary} style={styles.optHint}>
            e.g. "If I finish this, I'll treat myself to matcha" — reminders will use this.
          </BodySmall>
          <Input
            placeholder="If I finish early, I'll..."
            value={reward}
            onChangeText={setReward}
            multiline
            numberOfLines={2}
            containerStyle={styles.field}
          />
        </View>
      )}

      <Button
        label="Break it down for me"
        onPress={onSubmit}
        size="lg"
        fullWidth
        disabled={!title.trim()}
        style={styles.submitBtn}
        icon={<Ionicons name="sparkles-outline" size={18} color={Colors.textInverse} />}
      />

      <BodySmall align="center" color={Colors.textTertiary} style={styles.hint}>
        AI generates specific, concrete steps — not generic advice.
      </BodySmall>

      {showDuePicker && (
        <DateQuickPicker
          value={dueAt}
          onChange={setDueAt}
          onClose={() => setShowDuePicker(false)}
          minDate={Date.now()}
        />
      )}
      {showTargetPicker && (
        <DateQuickPicker
          value={targetDate}
          onChange={setTargetDate}
          onClose={() => setShowTargetPicker(false)}
          minDate={Date.now()}
        />
      )}
    </View>
  );
}

function LoadingPhase({ taskTitle }: { taskTitle: string }) {
  return (
    <View style={styles.loadingPhase}>
      <HumanMascot state="thinking" size="lg" />
      <H4 align="center" color={Colors.textPrimary} style={styles.loadingTitle}>
        Thinking about{'\n'}"{taskTitle}"...
      </H4>
      <Body align="center" color={Colors.textSecondary} style={styles.loadingSub}>
        Breaking it into steps{'\n'}you can actually start with.
      </Body>
      <ProgressBar progress={0.6} style={styles.loadingBar} animated />
    </View>
  );
}

function ReviewPhase({
  title,
  breakdown,
  onSave,
  onBack,
  onRegenerate,
  onRegenerateStep,
  regeneratingIdx,
  saving,
}: {
  title: string;
  breakdown: AITaskBreakdown;
  onSave: () => void;
  onBack: () => void;
  onRegenerate: () => void;
  onRegenerateStep: (index: number) => void;
  regeneratingIdx: number | null;
  saving: boolean;
}) {
  return (
    <View style={styles.phase}>
      <View style={styles.mascotRow}>
        <HumanMascot state="happy" size="md" />
      </View>

      {/* First-step highlight */}
      <LinearGradient
        colors={[Colors.primaryLight, Colors.background]}
        style={styles.firstStepCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Label color={Colors.primary} style={styles.firstStepLabel}>
          FIRST STEP
        </Label>
        <Body color={Colors.textPrimary} style={styles.firstStepText}>
          {breakdown.firstStepGuidance}
        </Body>
      </LinearGradient>

      {/* Motivational note */}
      <Card color={Colors.accentLight} style={styles.motivCard} padding={Spacing[4]}>
        <Body color={Colors.accent} style={styles.motivText}>
          {breakdown.motivationalNote}
        </Body>
      </Card>

      {/* All steps */}
      <View style={styles.stepsHeader}>
        <H4 color={Colors.textPrimary}>Your {breakdown.steps.length} steps</H4>
        <BodySmall color={Colors.textTertiary}>
          ~{breakdown.steps.reduce((s, step) => s + step.estimatedMinutes, 0)} min total
        </BodySmall>
      </View>

      {breakdown.steps.map((step, i) => (
        <View key={i} style={styles.reviewStep}>
          <View style={styles.reviewStepNum}>
            <Body color={i === 0 ? Colors.primary : Colors.textTertiary} style={styles.stepNumText}>
              {i + 1}
            </Body>
          </View>
          <View style={styles.reviewStepContent}>
            <Body
              color={i === 0 ? Colors.textPrimary : Colors.textSecondary}
              style={i === 0 ? styles.activeStep : {}}
            >
              {step.title}
            </Body>
            {i === 0 && (
              <BodySmall color={Colors.textSecondary} style={styles.stepDetail}>
                {step.detail}
              </BodySmall>
            )}
            <View style={styles.stepMeta}>
              <BodySmall color={Colors.textTertiary}>~{step.estimatedMinutes} min</BodySmall>
              <TouchableOpacity
                onPress={() => onRegenerateStep(i)}
                disabled={regeneratingIdx !== null}
                style={styles.regenStepBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="refresh-outline"
                  size={13}
                  color={regeneratingIdx === i ? Colors.primary : Colors.textTertiary}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}

      <Button
        label="Let's start"
        onPress={onSave}
        size="lg"
        fullWidth
        loading={saving}
        style={styles.startBtn}
        icon={<Ionicons name="rocket-outline" size={18} color={Colors.textInverse} />}
      />

      <Button
        label="Re-generate steps"
        onPress={onRegenerate}
        variant="secondary"
        size="sm"
        fullWidth
        style={styles.regenBtn}
        icon={<Ionicons name="refresh-outline" size={15} color={Colors.primary} />}
      />

      <Button
        label="Edit the task"
        onPress={onBack}
        variant="ghost"
        size="sm"
      />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing[2],
    paddingBottom: Spacing[2],
  },
  scroll: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingBottom: Spacing[12],
  },
  phase: {
    paddingTop: Spacing[2],
  },
  mascotRow: {
    alignItems: 'center',
    marginVertical: Spacing[5],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  flex1: { flex: 1 },
  infoBtn: {
    paddingLeft: Spacing[2],
  },
  phaseTitle: {
    marginBottom: 0,
  },
  phaseSub: {
    marginBottom: Spacing[6],
    lineHeight: 22,
  },
  field: {
    marginBottom: Spacing[4],
  },
  moreOptionsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
    marginBottom: Spacing[4],
  },
  moreOptionsSection: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing[5],
    marginBottom: Spacing[4],
    ...Shadow.sm,
  },
  optLabel: {
    letterSpacing: 0.8,
    marginBottom: Spacing[2],
  },
  optHint: {
    lineHeight: 18,
    marginBottom: Spacing[2],
    marginTop: -Spacing[1],
  },
  dateField: {
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
  priorityRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    flexWrap: 'wrap',
  },
  priorityBtn: {
    flex: 1,
    minWidth: 68,
    alignItems: 'center',
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[2],
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },
  submitBtn: {
    marginTop: Spacing[2],
    marginBottom: Spacing[3],
  },
  hint: {
    lineHeight: 18,
  },
  loadingPhase: {
    flex: 1,
    alignItems: 'center',
    paddingTop: Spacing[12],
    gap: Spacing[4],
  },
  loadingTitle: {
    lineHeight: 30,
  },
  loadingSub: {
    lineHeight: 24,
  },
  loadingBar: {
    width: 200,
    marginTop: Spacing[4],
  },
  firstStepCard: {
    borderRadius: Radius.xl,
    padding: Spacing[5],
    marginBottom: Spacing[3],
  },
  firstStepLabel: {
    letterSpacing: 0.8,
    marginBottom: Spacing[2],
  },
  firstStepText: {
    lineHeight: 24,
    fontWeight: '500',
  },
  motivCard: {
    marginBottom: Spacing[6],
  },
  motivText: {
    lineHeight: 22,
    fontStyle: 'italic',
  },
  stepsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing[4],
  },
  reviewStep: {
    flexDirection: 'row',
    gap: Spacing[3],
    marginBottom: Spacing[4],
    paddingBottom: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  reviewStepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  stepNumText: {
    fontWeight: '700',
  },
  reviewStepContent: {
    flex: 1,
    gap: 4,
  },
  activeStep: {
    fontWeight: '600',
  },
  stepDetail: {
    lineHeight: 20,
  },
  stepMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  regenStepBtn: {
    padding: 2,
  },
  startBtn: {
    marginTop: Spacing[4],
    marginBottom: Spacing[3],
  },
  regenBtn: {
    marginBottom: Spacing[2],
  },
  // Date picker modal
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
});
