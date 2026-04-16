/**
 * Settings screen
 *
 * Profile, AI settings, preferences, and account management.
 * Completely rewritten with:
 *  - Fixed stat grid layout (wrapper View carries the width, not the Card)
 *  - AI provider picker with per-provider key/model fields
 *  - Preferences section with toggles
 *  - Cleaner section structure
 */

import React, { useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Switch,
  Platform,
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
import { useSettingsStore } from '../../store/settingsStore';
import { signOut } from '../../services/firebase/auth';
import { updateUserProfile } from '../../services/firebase/firestore';
import type { TaskPriority } from '../../types';

const AI_PROVIDERS = [
  { key: 'deepseek' as const, label: 'DeepSeek', sublabel: 'deepseek-chat · free tier', icon: 'flash-outline', keyUrl: 'platform.deepseek.com' },
  { key: 'anthropic' as const, label: 'Anthropic Claude', sublabel: 'claude-sonnet-4-6', icon: 'sparkles-outline', keyUrl: 'console.anthropic.com' },
  { key: 'openai' as const, label: 'OpenAI', sublabel: 'gpt-4o-mini · pay-per-use', icon: 'logo-electron', keyUrl: 'platform.openai.com' },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: Colors.success },
  { value: 'medium', label: 'Medium', color: Colors.gold },
  { value: 'high', label: 'High', color: Colors.accent },
  { value: 'urgent', label: 'Urgent', color: Colors.error },
];

function maskKey(key: string): string {
  if (!key || key.length < 8) return key ? '••••••••' : '';
  return key.slice(0, 4) + '••••••••' + key.slice(-4);
}

export default function SettingsScreen() {
  const { user, profile, setProfile } = useAuthStore();
  const settings = useSettingsStore();

  const [signingOut, setSigningOut] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editContext, setEditContext] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // AI modals
  const [providerModalVisible, setProviderModalVisible] = useState(false);
  const [apiKeyModalVisible, setApiKeyModalVisible] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');

  const isGuest = user?.isAnonymous ?? true;

  const currentProvider = AI_PROVIDERS.find((p) => p.key === settings.aiProvider);
  const currentProviderLabel = currentProvider?.label ?? 'Not configured';

  const currentModelLabel = (() => {
    switch (settings.aiProvider) {
      case 'deepseek': return settings.deepseekModel;
      case 'anthropic': return settings.anthropicModel;
      case 'openai': return settings.openaiModel;
      default: return '—';
    }
  })();

  const currentApiKey = (() => {
    switch (settings.aiProvider) {
      case 'anthropic': return settings.anthropicApiKey;
      case 'openai': return settings.openaiApiKey;
      case 'deepseek': return settings.deepseekApiKey;
      default: return '';
    }
  })();

  const handleSignOut = () => {
    Alert.alert(
      'Sign out',
      isGuest
        ? 'Guest data will be lost. Are you sure?'
        : "You'll need to sign back in to access your tasks.",
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

  const handleOpenEdit = () => {
    setEditName(profile?.displayName ?? '');
    setEditEmail(profile?.email ?? user?.email ?? '');
    setEditContext(profile?.context ?? '');
    setEditVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!user || !editName.trim()) return;
    setSavingProfile(true);
    try {
      const updates: Partial<import('../../types').UserProfile> = {
        displayName: editName.trim(),
        context: editContext.trim() || undefined,
        ...(editEmail.trim() ? { email: editEmail.trim() } : {}),
      };
      await updateUserProfile(user.uid, updates);
      if (profile) setProfile({ ...profile, ...updates });
      setEditVisible(false);
    } catch {
      Alert.alert('Could not save', 'Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveApiKey = () => {
    const key = apiKeyInput.trim();
    if (settings.aiProvider === 'anthropic') {
      settings.setAnthropicApiKey(key);
    } else if (settings.aiProvider === 'openai') {
      settings.setOpenaiApiKey(key);
    } else if (settings.aiProvider === 'deepseek') {
      settings.setDeepseekApiKey(key);
    }
    setApiKeyModalVisible(false);
    setApiKeyInput('');
  };

  const handleOpenApiKey = () => {
    setApiKeyInput('');
    setApiKeyModalVisible(true);
  };

  const handleDefaultPriority = (value: TaskPriority) => {
    settings.setDefaultPriority(settings.defaultPriority === value ? null : value);
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
              {(profile?.email || user?.email) && (
                <BodySmall color={Colors.textSecondary}>
                  {profile?.email ?? user?.email}
                </BodySmall>
              )}
              {isGuest && (
                <BodySmall color={Colors.accent}>Guest account</BodySmall>
              )}
            </View>
            <TouchableOpacity
              onPress={handleOpenEdit}
              style={styles.editBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="pencil-outline" size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {profile?.context && (
            <View style={styles.contextRow}>
              <Label color={Colors.textTertiary} style={styles.contextLabel}>
                ABOUT YOU
              </Label>
              <Body color={Colors.textSecondary}>{profile.context}</Body>
            </View>
          )}

          {!profile?.context && !isGuest && (
            <TouchableOpacity onPress={handleOpenEdit} style={styles.addContextBtn}>
              <Ionicons name="add-circle-outline" size={16} color={Colors.primary} />
              <BodySmall color={Colors.primary}>Add context about yourself</BodySmall>
            </TouchableOpacity>
          )}
        </Card>

        {/* AI Settings */}
        <Label color={Colors.textTertiary} style={styles.sectionLabel}>
          AI SETTINGS
        </Label>
        <Card style={styles.settingsCard}>
          <SettingRow
            label="AI Provider"
            sublabel={currentProviderLabel}
            icon="sparkles-outline"
            onPress={() => setProviderModalVisible(true)}
          />
          {(settings.aiProvider === 'anthropic' || settings.aiProvider === 'openai' || settings.aiProvider === 'deepseek') && (
            <SettingRow
              label="API Key"
              sublabel={currentApiKey ? maskKey(currentApiKey) : `Not set · get one at ${currentProvider?.keyUrl}`}
              icon="key-outline"
              onPress={handleOpenApiKey}
            />
          )}
          {settings.aiProvider !== 'none' && (
            <SettingRow
              label="Model"
              sublabel={currentModelLabel}
              icon="cube-outline"
              onPress={() =>
                Alert.alert(
                  'AI Model',
                  `Current: ${currentModelLabel}\n\nTo use a different model, change the provider in AI Provider settings.`,
                  [{ text: 'OK' }],
                )
              }
              isLast
            />
          )}
          {settings.aiProvider === 'none' && (
            <SettingRow
              label="Set up AI"
              sublabel="Tap to configure a provider"
              icon="add-circle-outline"
              onPress={() => setProviderModalVisible(true)}
              accent
              isLast
            />
          )}
        </Card>

        {/* Preferences */}
        <Label color={Colors.textTertiary} style={styles.sectionLabel}>
          PREFERENCES
        </Label>
        <Card style={styles.settingsCard}>
          {/* Default Priority */}
          <View style={[styles.settingRow, styles.settingRowBorder]}>
            <View style={styles.settingLeft}>
              <Ionicons
                name="flag-outline"
                size={20}
                color={Colors.textPrimary}
                style={styles.settingIcon}
              />
              <View>
                <Body color={Colors.textPrimary}>Default Priority</Body>
                <BodySmall color={Colors.textTertiary}>
                  {settings.defaultPriority
                    ? PRIORITY_OPTIONS.find((p) => p.value === settings.defaultPriority)?.label ?? 'None'
                    : 'None'}
                </BodySmall>
              </View>
            </View>
            <View style={styles.priorityChips}>
              {PRIORITY_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.priorityChip,
                    {
                      borderColor: opt.color,
                      backgroundColor:
                        settings.defaultPriority === opt.value ? opt.color + '22' : Colors.background,
                    },
                  ]}
                  onPress={() => handleDefaultPriority(opt.value)}
                  activeOpacity={0.7}
                >
                  <BodySmall
                    color={settings.defaultPriority === opt.value ? opt.color : Colors.textSecondary}
                    style={settings.defaultPriority === opt.value ? { fontWeight: '700' } : {}}
                  >
                    {opt.label}
                  </BodySmall>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Focus Mode Default */}
          <View style={[styles.settingRow, styles.settingRowBorder]}>
            <View style={styles.settingLeft}>
              <Ionicons
                name="eye-outline"
                size={20}
                color={Colors.textPrimary}
                style={styles.settingIcon}
              />
              <View>
                <Body color={Colors.textPrimary}>Focus Mode by Default</Body>
                <BodySmall color={Colors.textTertiary}>
                  Open tasks in Focus Mode automatically
                </BodySmall>
              </View>
            </View>
            <Switch
              value={settings.focusModeDefault}
              onValueChange={settings.setFocusModeDefault}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.surface}
            />
          </View>

          {/* Haptic Feedback */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons
                name="phone-portrait-outline"
                size={20}
                color={Colors.textPrimary}
                style={styles.settingIcon}
              />
              <View>
                <Body color={Colors.textPrimary}>Haptic Feedback</Body>
                <BodySmall color={Colors.textTertiary}>
                  Vibrate on step completion
                </BodySmall>
              </View>
            </View>
            <Switch
              value={settings.hapticFeedback}
              onValueChange={settings.setHapticFeedback}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.surface}
            />
          </View>
        </Card>

        {/* Account */}
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
            label="Edit profile"
            icon="pencil-outline"
            onPress={handleOpenEdit}
          />
          <SettingRow
            label="Sign out"
            icon="log-out-outline"
            onPress={handleSignOut}
            danger
            loading={signingOut}
            isLast
          />
        </Card>

        <BodySmall align="center" color={Colors.textTertiary} style={styles.version}>
          Human.exe v0.2.0{'\n'}
          Made with care at Johns Hopkins University
        </BodySmall>
      </ScrollView>

      {/* Edit profile modal */}
      <Modal
        visible={editVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModal}>
            <H4 color={Colors.textPrimary} style={styles.editModalTitle}>
              Edit profile
            </H4>

            <Label color={Colors.textTertiary} style={styles.fieldLabel}>
              NAME
            </Label>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              style={styles.textInput}
              placeholder="Your name"
              placeholderTextColor={Colors.textTertiary}
              autoFocus
            />

            <Label color={Colors.textTertiary} style={[styles.fieldLabel, { marginTop: Spacing[4] }]}>
              EMAIL (OPTIONAL)
            </Label>
            <TextInput
              value={editEmail}
              onChangeText={setEditEmail}
              style={styles.textInput}
              placeholder="your@email.com"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Label color={Colors.textTertiary} style={[styles.fieldLabel, { marginTop: Spacing[4] }]}>
              ABOUT YOU (OPTIONAL)
            </Label>
            <BodySmall color={Colors.textTertiary} style={styles.fieldHint}>
              AI uses this to personalize step breakdowns.{'\n'}
              e.g. "Junior studying CS, procrastinates on writing"
            </BodySmall>
            <TextInput
              value={editContext}
              onChangeText={setEditContext}
              style={[styles.textInput, styles.textInputMultiline]}
              placeholder="Year, major, what tends to trip you up..."
              placeholderTextColor={Colors.textTertiary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <View style={styles.editModalActions}>
              <Button
                label="Cancel"
                variant="ghost"
                onPress={() => setEditVisible(false)}
                style={styles.editModalBtn}
              />
              <Button
                label="Save"
                onPress={handleSaveProfile}
                loading={savingProfile}
                disabled={!editName.trim()}
                style={styles.editModalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* AI Provider picker modal */}
      <Modal
        visible={providerModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setProviderModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModal}>
            <H4 color={Colors.textPrimary} style={styles.editModalTitle}>
              AI Provider
            </H4>
            {AI_PROVIDERS.map((p) => {
              const sel = settings.aiProvider === p.key;
              return (
                <TouchableOpacity
                  key={p.key}
                  style={[styles.providerRow, sel && styles.providerRowSelected]}
                  onPress={() => {
                    settings.setAiProvider(p.key);
                    setProviderModalVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.providerLeft}>
                    <Ionicons
                      name={p.icon as any}
                      size={18}
                      color={sel ? Colors.primary : Colors.textSecondary}
                    />
                    <View>
                      <Body color={sel ? Colors.primary : Colors.textPrimary} style={sel ? { fontWeight: '700' } : {}}>
                        {p.label}
                      </Body>
                      <BodySmall color={Colors.textTertiary}>{p.sublabel}</BodySmall>
                    </View>
                  </View>
                  {sel && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
                </TouchableOpacity>
              );
            })}
            <Button
              label="Done"
              variant="ghost"
              onPress={() => setProviderModalVisible(false)}
              style={{ marginTop: Spacing[3] }}
            />
          </View>
        </View>
      </Modal>

      {/* API Key entry modal */}
      <Modal
        visible={apiKeyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setApiKeyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModal}>
            <H4 color={Colors.textPrimary} style={styles.editModalTitle}>
              {currentProviderLabel} API Key
            </H4>
            <BodySmall color={Colors.textTertiary} style={{ marginBottom: Spacing[4], lineHeight: 18 }}>
              {'Get your key at '}
              <BodySmall color={Colors.primary}>{currentProvider?.keyUrl ?? 'your provider'}</BodySmall>
              {'. Keys are stored in memory only and never shared.'}
            </BodySmall>
            <View style={styles.keyRow}>
              <TextInput
                value={apiKeyInput}
                onChangeText={setApiKeyInput}
                style={[styles.textInput, { flex: 1 }]}
                placeholder={settings.aiProvider === 'anthropic' ? 'sk-ant-...' : 'sk-...'}
                placeholderTextColor={Colors.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={false}
                autoFocus
              />
              <TouchableOpacity
                style={styles.pasteBtn}
                onPress={async () => {
                  try {
                    const text = await Clipboard.getStringAsync();
                    if (text) setApiKeyInput(text.trim());
                  } catch {}
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="clipboard-outline" size={18} color={Colors.primary} />
                <BodySmall color={Colors.primary}>Paste</BodySmall>
              </TouchableOpacity>
            </View>
            <View style={styles.editModalActions}>
              <Button
                label="Cancel"
                variant="ghost"
                onPress={() => setApiKeyModalVisible(false)}
                style={styles.editModalBtn}
              />
              <Button
                label="Save"
                onPress={handleSaveApiKey}
                style={styles.editModalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────

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
        <View style={{ flex: 1 }}>
          <Body color={color}>{label}</Body>
          {sublabel && (
            <BodySmall color={Colors.textTertiary} numberOfLines={1}>
              {sublabel}
            </BodySmall>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
    </TouchableOpacity>
  );
}

// ── Styles ─────────────────────────────────────────────────────

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
  editBtn: {
    padding: Spacing[1],
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
  addContextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
    marginTop: Spacing[4],
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: Spacing[4],
  },
  sectionLabel: {
    letterSpacing: 0.8,
    marginBottom: Spacing[3],
    marginTop: Spacing[2],
  },
  // Settings card
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
    flex: 1,
  },
  settingIcon: {
    width: 24,
    textAlign: 'center',
  },
  // Priority chips (inline in preferences row)
  priorityChips: {
    flexDirection: 'row',
    gap: Spacing[1],
    flexWrap: 'wrap',
    maxWidth: 180,
  },
  priorityChip: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  version: {
    marginTop: Spacing[4],
    lineHeight: 20,
  },
  // Provider picker rows
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[2],
    borderRadius: Radius.md,
    marginBottom: 2,
  },
  providerRowSelected: {
    backgroundColor: Colors.primaryLight,
  },
  providerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  editModal: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    padding: Spacing[6],
    paddingBottom: Spacing[10],
    ...Shadow.lg,
  },
  editModalTitle: {
    marginBottom: Spacing[5],
  },
  fieldLabel: {
    letterSpacing: 0.8,
    marginBottom: Spacing[2],
  },
  fieldHint: {
    lineHeight: 18,
    marginBottom: Spacing[2],
    marginTop: -Spacing[1],
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: Colors.borderActive,
    borderRadius: Radius.md,
    padding: Spacing[4],
    fontSize: 16,
    color: Colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  textInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editModalActions: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginTop: Spacing[5],
  },
  editModalBtn: {
    flex: 1,
  },
  keyRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    alignItems: 'center',
  },
  pasteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[3],
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
});
