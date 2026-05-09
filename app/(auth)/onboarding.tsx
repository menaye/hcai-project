/**
 * Onboarding screen – collects minimal context (name, optional major)
 * to personalize AI responses. Matches rough UI sketch (screen4: "First, a bit about you").
 *
 * Deliberately minimal — asks only what's needed.
 * Design principle §14.6: Minimize interface complexity.
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Spacing, Layout } from '../../constants/spacing';
import { Button, Input, H2, Body, BodySmall } from '../../components/ui';
import { HumanMascot } from '../../components/mascot/HumanMascot';
import { useAuthStore } from '../../store/authStore';
import { updateUserProfile } from '../../services/firebase/firestore';

export default function OnboardingScreen() {
  const { user, profile } = useAuthStore();
  const [displayName, setDisplayName] = useState(
    profile?.displayName ?? user?.displayName ?? '',
  );
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0); // 0 = name, 1 = context

  const handleNext = async () => {
    if (step === 0) {
      if (!displayName.trim()) return;
      setStep(1);
      return;
    }

    if (!user) return;
    setLoading(true);
    try {
      await updateUserProfile(user.uid, {
        displayName: displayName.trim(),
        context: context.trim() || undefined,
        onboardingComplete: true,
      });
      router.replace('/(auth)/ai-setup' as any);
    } catch (e) {
      console.error('Onboarding error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await updateUserProfile(user.uid, {
        displayName: displayName.trim() || 'Student',
        onboardingComplete: true,
      });
      router.replace('/(auth)/ai-setup' as any);
    } catch (e) {
      console.error('Skip error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.mascotContainer}>
            <HumanMascot state="encouraging" size="md" />
          </View>

          <H2 align="center" color={Colors.textPrimary} style={styles.title}>
            {step === 0 ? 'First, a bit about you.' : 'One more thing.'}
          </H2>

          <Body align="center" color={Colors.textSecondary} style={styles.subtitle}>
            {step === 0
              ? 'What should I call you?'
              : 'Share a little context — it helps me give better guidance.'}
          </Body>

          <View style={styles.form}>
            {step === 0 ? (
              <Input
                label="Your name"
                placeholder="e.g. Alex"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
                autoFocus
                returnKeyType="next"
                onSubmitEditing={handleNext}
              />
            ) : (
              <Input
                label="About you (optional)"
                placeholder="e.g. Junior studying Computer Science, tends to procrastinate on writing assignments"
                value={context}
                onChangeText={setContext}
                multiline
                numberOfLines={4}
                autoFocus
              />
            )}
          </View>

          <View style={styles.actions}>
            <Button
              label={step === 0 ? 'Next' : "Let's go"}
              onPress={handleNext}
              size="lg"
              fullWidth
              disabled={step === 0 && !displayName.trim()}
              loading={loading}
            />
            {step === 1 && (
              <Button
                label="Skip for now"
                onPress={handleSkip}
                variant="ghost"
                loading={loading}
              />
            )}
          </View>

          <BodySmall
            align="center"
            color={Colors.textTertiary}
            style={styles.note}
          >
            This context stays private and helps the AI understand your situation.
          </BodySmall>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Layout.screenPaddingH,
    paddingBottom: Spacing[10],
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotContainer: {
    marginBottom: Spacing[6],
  },
  title: {
    marginBottom: Spacing[2],
  },
  subtitle: {
    marginBottom: Spacing[8],
  },
  form: {
    width: '100%',
    marginBottom: Spacing[6],
  },
  actions: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing[3],
  },
  note: {
    marginTop: Spacing[6],
    paddingHorizontal: Spacing[4],
    lineHeight: 18,
  },
});
