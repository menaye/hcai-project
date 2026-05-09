/**
 * Welcome screen – first screen new users see.
 * Matches the rough UI sketch (screen4.png): welcoming, minimal, focused.
 *
 * Design principle: Zero friction to get started.
 * "Guest" mode allows immediate use without account creation.
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, Layout } from '../../constants/spacing';
import { Button, Input, Typography, H1, H2, Body, BodySmall } from '../../components/ui';
import { HumanMascot } from '../../components/mascot/HumanMascot';
import { signInAsGuest, signInWithEmail, signUpWithEmail } from '../../services/firebase/auth';

type Mode = 'landing' | 'signin' | 'signup';

export default function WelcomeScreen() {
  const [mode, setMode] = useState<Mode>('landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGuest = async () => {
    setLoading(true);
    try {
      await signInAsGuest();
      router.replace('/(auth)/onboarding');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) return setError('Please fill in all fields.');
    setLoading(true);
    setError('');
    try {
      await signInWithEmail(email, password);
      router.replace('/(auth)/ai-setup' as any);
    } catch (e: any) {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!name || !email || !password) return setError('Please fill in all fields.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true);
    setError('');
    try {
      await signUpWithEmail(email, password, name);
      router.replace('/(auth)/onboarding');
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong.');
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
          {/* Header gradient */}
          <LinearGradient
            colors={[Colors.primaryLight, Colors.background]}
            style={styles.gradientHeader}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />

          {/* Mascot */}
          <View style={styles.mascotContainer}>
            <HumanMascot state={mode === 'landing' ? 'idle' : 'encouraging'} size="lg" />
          </View>

          {mode === 'landing' && (
            <View style={styles.content}>
              <H1 style={styles.headline} align="center" color={Colors.textPrimary}>
                Human.exe
              </H1>
              <Body
                align="center"
                color={Colors.textSecondary}
                style={styles.tagline}
              >
                Your AI companion for getting{'\n'}started on academic work.
              </Body>

              <View style={styles.actions}>
                <Button
                  label="Get Started"
                  onPress={() => setMode('signup')}
                  size="lg"
                  fullWidth
                  style={styles.primaryBtn}
                />
                <Button
                  label="Sign In"
                  onPress={() => setMode('signin')}
                  variant="secondary"
                  size="lg"
                  fullWidth
                  style={styles.secondaryBtn}
                />
                <Button
                  label="Continue as Guest"
                  onPress={handleGuest}
                  variant="ghost"
                  size="md"
                  loading={loading}
                />
              </View>

              <BodySmall align="center" color={Colors.textTertiary} style={styles.disclaimer}>
                Guest mode saves data locally. Create an account to sync across devices.
              </BodySmall>
            </View>
          )}

          {mode === 'signup' && (
            <View style={styles.content}>
              <H2 align="center" color={Colors.textPrimary} style={styles.formTitle}>
                Create Account
              </H2>
              <Body align="center" color={Colors.textSecondary} style={styles.formSub}>
                A few seconds and you're in.
              </Body>

              <View style={styles.form}>
                <Input
                  label="Your name"
                  placeholder="First name"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  containerStyle={styles.field}
                />
                <Input
                  label="Email"
                  placeholder="you@university.edu"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  containerStyle={styles.field}
                />
                <Input
                  label="Password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  containerStyle={styles.field}
                  error={error}
                />
              </View>

              <Button
                label="Create Account"
                onPress={handleSignUp}
                size="lg"
                fullWidth
                loading={loading}
                style={styles.primaryBtn}
              />
              <Button
                label="Already have an account? Sign in"
                onPress={() => { setMode('signin'); setError(''); }}
                variant="ghost"
              />
            </View>
          )}

          {mode === 'signin' && (
            <View style={styles.content}>
              <H2 align="center" color={Colors.textPrimary} style={styles.formTitle}>
                Welcome back
              </H2>

              <View style={styles.form}>
                <Input
                  label="Email"
                  placeholder="you@university.edu"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  containerStyle={styles.field}
                />
                <Input
                  label="Password"
                  placeholder="Your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  containerStyle={styles.field}
                  error={error}
                />
              </View>

              <Button
                label="Sign In"
                onPress={handleSignIn}
                size="lg"
                fullWidth
                loading={loading}
                style={styles.primaryBtn}
              />
              <Button
                label="Don't have an account? Sign up"
                onPress={() => { setMode('signup'); setError(''); }}
                variant="ghost"
              />
              <Button
                label="Continue as Guest"
                onPress={handleGuest}
                variant="ghost"
                loading={loading}
              />
            </View>
          )}
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
  },
  gradientHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  mascotContainer: {
    marginTop: Spacing[8],
    marginBottom: Spacing[6],
    alignItems: 'center',
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  headline: {
    marginBottom: Spacing[2],
  },
  tagline: {
    marginBottom: Spacing[8],
    lineHeight: 24,
  },
  actions: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing[3],
    marginBottom: Spacing[4],
  },
  primaryBtn: { marginBottom: 0 },
  secondaryBtn: { marginBottom: 0 },
  disclaimer: {
    marginTop: Spacing[4],
    lineHeight: 18,
    paddingHorizontal: Spacing[4],
  },
  formTitle: {
    marginBottom: Spacing[2],
  },
  formSub: {
    marginBottom: Spacing[6],
  },
  form: {
    width: '100%',
    marginBottom: Spacing[5],
  },
  field: {
    marginBottom: Spacing[4],
  },
});
