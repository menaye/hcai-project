/**
 * Settings screen
 *
 * Profile, preferences, and account management.
 * Intentionally minimal — supports student autonomy without adding overhead.
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing, Layout, Radius, Shadow } from '../../constants/spacing';
import { H3, H4, Body, BodySmall, Label } from '../../components/ui/Typography';
import { Button, Card } from '../../components/ui';
import { HumanMascot } from '../../components/mascot/HumanMascot';
import { useAuthStore } from '../../store/authStore';
import { useTaskStore } from '../../store/taskStore';
import { signOut } from '../../services/firebase/auth';

export default function SettingsScreen() {
  const { user, profile } = useAuthStore();
  const { tasks, streak } = useTaskStore();
  const [signingOut, setSigningOut] = useState(false);

  const isGuest = user?.isAnonymous ?? true;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  const handleSignOut = () => {
    Alert.alert(
      'Sign out',
      isGuest
        ? 'Guest data will be lost. Are you sure?'
        : 'You\'ll need to sign back in to access your tasks.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            setSigningOut(true);
            await signOut();
            router.replace('/(auth)/welcome');
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <H3 color={Colors.textPrimary} style={styles.title}>
          Profile
        </H3>

        {/* Profile card */}
        <Card style={styles.profileCard} elevated>
          <View style={styles.profileRow}>
            <View style={styles.avatarWrap}>
              <HumanMascot size="sm" state="idle" />
            </View>
            <View style={styles.profileInfo}>
              <H4 color={Colors.textPrimary}>
                {profile?.displayName ?? 'Student'}
              </H4>
              {user?.email && (
                <BodySmall color={Colors.textSecondary}>{user.email}</BodySmall>
              )}
              {isGuest && (
                <BodySmall color={Colors.accent}>Guest account</BodySmall>
              )}
            </View>
          </View>

          {profile?.context && (
            <View style={styles.contextRow}>
              <Label color={Colors.textTertiary} style={styles.contextLabel}>
                ABOUT YOU
              </Label>
              <Body color={Colors.textSecondary}>{profile.context}</Body>
            </View>
          )}
        </Card>

        {/* Stats */}
        <Label color={Colors.textTertiary} style={styles.sectionLabel}>
          YOUR PROGRESS
        </Label>
        <View style={styles.statsGrid}>
          <StatItem value={tasks.length} label="Tasks created" />
          <StatItem value={completedCount} label="Tasks done" icon="checkmark-circle" color={Colors.success} />
          {streak && (
            <>
              <StatItem value={streak.currentStreak} label="Day streak" icon="flame" color={Colors.gold} />
              <StatItem value={streak.totalStepsCompleted} label="Steps done" />
            </>
          )}
        </View>

        {/* Settings rows */}
        <Label color={Colors.textTertiary} style={styles.sectionLabel}>
          ACCOUNT
        </Label>
        <Card style={styles.settingsCard}>
          {isGuest && (
            <SettingRow
              label="Create an account"
              sublabel="Save your progress across devices"
              icon="person-add-outline"
              onPress={() => router.push('/(auth)/welcome')}
              accent
            />
          )}
          <SettingRow
            label="Sign out"
            icon="log-out-outline"
            onPress={handleSignOut}
            danger
            loading={signingOut}
            isLast
          />
        </Card>

        {/* App info */}
        <BodySmall align="center" color={Colors.textTertiary} style={styles.version}>
          Human.exe v0.1.0{'\n'}
          Made with care at Johns Hopkins University
        </BodySmall>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatItem({
  value,
  label,
  icon,
  color = Colors.primary,
}: {
  value: number;
  label: string;
  icon?: string;
  color?: string;
}) {
  return (
    <Card style={styles.statItem} padding={Spacing[4]}>
      {icon && <Ionicons name={icon as any} size={18} color={color} style={styles.statIcon} />}
      <Body color={color} style={styles.statValue}>{value}</Body>
      <BodySmall color={Colors.textTertiary} align="center">{label}</BodySmall>
    </Card>
  );
}

function SettingRow({
  label,
  sublabel,
  icon,
  onPress,
  danger,
  accent,
  loading,
  isLast,
}: {
  label: string;
  sublabel?: string;
  icon: string;
  onPress: () => void;
  danger?: boolean;
  accent?: boolean;
  loading?: boolean;
  isLast?: boolean;
}) {
  const color = danger ? Colors.error : accent ? Colors.primary : Colors.textPrimary;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.settingRow, !isLast && styles.settingRowBorder]}
      disabled={loading}
    >
      <View style={styles.settingLeft}>
        <Ionicons name={icon as any} size={20} color={color} style={styles.settingIcon} />
        <View>
          <Body color={color}>{label}</Body>
          {sublabel && <BodySmall color={Colors.textTertiary}>{sublabel}</BodySmall>}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingBottom: Spacing[16],
  },
  title: {
    marginTop: Spacing[5],
    marginBottom: Spacing[5],
  },
  profileCard: {
    marginBottom: Spacing[6],
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
  },
  avatarWrap: {
    width: 64,
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  contextRow: {
    marginTop: Spacing[4],
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: Spacing[4],
  },
  contextLabel: {
    marginBottom: Spacing[1],
  },
  sectionLabel: {
    letterSpacing: 0.8,
    marginBottom: Spacing[3],
    marginTop: Spacing[2],
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[3],
    marginBottom: Spacing[6],
  },
  statItem: {
    width: '47%',
    alignItems: 'center',
    minHeight: 72,
    justifyContent: 'center',
  },
  statIcon: {
    marginBottom: Spacing[1],
  },
  statValue: {
    fontWeight: '700',
    fontSize: 22,
  },
  settingsCard: {
    marginBottom: Spacing[6],
    padding: 0,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[5],
  },
  settingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  settingIcon: {
    width: 24,
    textAlign: 'center',
  },
  version: {
    marginTop: Spacing[4],
    lineHeight: 20,
  },
});
