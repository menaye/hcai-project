/**
 * New Task screen – AI task decomposition interface
 *
 * The core interaction of Human.exe:
 *  1. Student describes their assignment
 *  2. AI breaks it into 4–6 concrete, manageable steps
 *  3. Student sees steps and can start immediately
 *
 * From rough UI sketch (screen5): AI input area with response display.
 *
 * Design principles applied:
 *  - §14.1 Focus on the moment of initiation — zero setup, immediate value
 *  - §14.2 Specific, contextual guidance — AI uses the actual assignment text
 *  - §14.6 Minimize interface complexity — just one text field needed
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
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import { Spacing, Layout, Radius, Shadow } from '../../constants/spacing';
import { H3, H4, Body, BodySmall, Label } from '../../components/ui/Typography';
import { Button, Input, Card } from '../../components/ui';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { HumanMascot } from '../../components/mascot/HumanMascot';
import { StepItem } from '../../components/task/StepItem';
import { useAuthStore } from '../../store/authStore';
import { decomposeTask } from '../../services/ai/claude';
import { createTask } from '../../services/firebase/firestore';
import { generateId, generateStepId } from '../../utils/idUtils';
import type { Task, TaskStep, AITaskBreakdown } from '../../types';

type Phase = 'input' | 'loading' | 'review';

export default function NewTaskScreen() {
  const { user, profile } = useAuthStore();
  const [phase, setPhase] = useState<Phase>('input');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [breakdown, setBreakdown] = useState<AITaskBreakdown | null>(null);
  const [saving, setSaving] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

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
        } catch (e) {
          Alert.alert('Hmm, something went wrong', 'Check your connection and try again.');
          setPhase('input');
          Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
        }
      },
    );
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
        status: 'active',
        steps,
        createdAt: now,
        updatedAt: now,
        aiContext: breakdown.motivationalNote,
      };

      await createTask(task);
      router.replace(`/task/${taskId}`);
    } catch (e) {
      Alert.alert('Could not save', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Button
          label="Cancel"
          onPress={() => router.back()}
          variant="ghost"
          size="sm"
        />
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
          {/* Phase: Input */}
          {(phase === 'input') && (
            <InputPhase
              title={title}
              setTitle={setTitle}
              description={description}
              setDescription={setDescription}
              onSubmit={handleDecompose}
            />
          )}

          {/* Phase: Loading */}
          {phase === 'loading' && <LoadingPhase taskTitle={title} />}

          {/* Phase: Review */}
          {phase === 'review' && breakdown && (
            <ReviewPhase
              title={title}
              breakdown={breakdown}
              onSave={handleSave}
              onBack={() => setPhase('input')}
              saving={saving}
            />
          )}
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Sub-components ─────────────────────────────────────────────

function InputPhase({
  title,
  setTitle,
  description,
  setDescription,
  onSubmit,
}: {
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <View style={styles.phase}>
      <View style={styles.mascotRow}>
        <HumanMascot state="encouraging" size="md" />
      </View>

      <H3 color={Colors.textPrimary} style={styles.phaseTitle}>
        What do you need to work on?
      </H3>
      <Body color={Colors.textSecondary} style={styles.phaseSub}>
        Just describe it — I'll break it into steps you can actually start with.
      </Body>

      <Input
        label="Assignment or task"
        placeholder="e.g. Write the introduction for my research paper on climate policy"
        value={title}
        onChangeText={setTitle}
        autoFocus
        returnKeyType="next"
        containerStyle={styles.field}
      />

      <Input
        label="Any details? (optional)"
        placeholder="Due date, specific requirements, how stuck you feel..."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        containerStyle={styles.field}
      />

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
        AI will generate specific, concrete steps — not generic advice.
      </BodySmall>
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
      <ProgressBar
        progress={0.6}
        style={styles.loadingBar}
        animated
      />
    </View>
  );
}

function ReviewPhase({
  title,
  breakdown,
  onSave,
  onBack,
  saving,
}: {
  title: string;
  breakdown: AITaskBreakdown;
  onSave: () => void;
  onBack: () => void;
  saving: boolean;
}) {
  const completedCount = 0; // None complete yet in review

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
            <BodySmall color={Colors.textTertiary}>~{step.estimatedMinutes} min</BodySmall>
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
        label="Change the assignment"
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
  phaseTitle: {
    marginBottom: Spacing[2],
  },
  phaseSub: {
    marginBottom: Spacing[6],
    lineHeight: 22,
  },
  field: {
    marginBottom: Spacing[4],
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
  startBtn: {
    marginTop: Spacing[4],
    marginBottom: Spacing[3],
  },
});
