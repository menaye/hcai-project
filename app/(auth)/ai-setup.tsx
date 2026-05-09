/**
 * AI Setup screen — shown once after onboarding.
 * User picks a provider, pastes an API key, and is sent to the main app.
 * Can be skipped and configured later in Settings → AI Provider.
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing, Layout, Radius, Shadow } from '../../constants/spacing';
import { H2, H4, Body, BodySmall, Label } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { useSettingsStore } from '../../store/settingsStore';

type ProviderId = 'deepseek' | 'openai' | 'anthropic';

interface ProviderConfig {
  id: ProviderId;
  name: string;
  tagline: string;
  icon: string;
  keyPlaceholder: string;
  keyHint: string;
  getKeyUrl: string;
  model: string;
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    tagline: 'Best value — free tier, very capable',
    icon: 'flash',
    keyPlaceholder: 'sk-...',
    keyHint: 'Get a free key at platform.deepseek.com',
    getKeyUrl: 'https://platform.deepseek.com',
    model: 'deepseek-chat',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    tagline: 'GPT-4o mini — fast and affordable',
    icon: 'logo-electron',
    keyPlaceholder: 'sk-...',
    keyHint: 'Get a key at platform.openai.com',
    getKeyUrl: 'https://platform.openai.com',
    model: 'gpt-4o-mini',
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    tagline: 'Claude Sonnet — great reasoning',
    icon: 'sparkles',
    keyPlaceholder: 'sk-ant-...',
    keyHint: 'Get a key at console.anthropic.com',
    getKeyUrl: 'https://console.anthropic.com',
    model: 'claude-sonnet-4-6',
  },
];

export default function AISetupScreen() {
  const settings = useSettingsStore();
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>('deepseek');
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);

  const provider = PROVIDERS.find((p) => p.id === selectedProvider)!;

  const handlePaste = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) setApiKey(text.trim());
    } catch {
      // clipboard not available
    }
  };

  const handleConnect = async () => {
    const key = apiKey.trim();
    if (!key) {
      Alert.alert('API key required', 'Paste your API key to continue.');
      return;
    }
    setSaving(true);
    try {
      settings.setAiProvider(selectedProvider);
      switch (selectedProvider) {
        case 'deepseek':
          settings.setDeepseekApiKey(key);
          settings.setDeepseekModel(provider.model);
          break;
        case 'openai':
          settings.setOpenaiApiKey(key);
          settings.setOpenaiModel(provider.model);
          break;
        case 'anthropic':
          settings.setAnthropicApiKey(key);
          settings.setAnthropicModel(provider.model);
          break;
      }
      router.replace('/(tabs)');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <H2 color={Colors.textPrimary} style={styles.title}>
            Set up your AI
          </H2>
          <Body align="center" color={Colors.textSecondary} style={styles.subtitle}>
            Human.exe uses AI to break down your tasks.{'\n'}
            Pick a provider and paste your API key.
          </Body>
        </View>

        {/* Provider selector */}
        <Label color={Colors.textTertiary} style={styles.sectionLabel}>
          CHOOSE PROVIDER
        </Label>
        <View style={styles.providerList}>
          {PROVIDERS.map((p) => {
            const selected = selectedProvider === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.providerCard, selected && styles.providerCardSelected]}
                onPress={() => {
                  setSelectedProvider(p.id);
                  setApiKey('');
                }}
                activeOpacity={0.75}
              >
                <View style={[styles.providerIcon, selected && styles.providerIconSelected]}>
                  <Ionicons
                    name={p.icon as any}
                    size={20}
                    color={selected ? Colors.textInverse : Colors.textSecondary}
                  />
                </View>
                <View style={styles.providerText}>
                  <Body
                    color={selected ? Colors.primary : Colors.textPrimary}
                    style={selected ? { fontWeight: '700' } : {}}
                  >
                    {p.name}
                  </Body>
                  <BodySmall color={Colors.textTertiary}>{p.tagline}</BodySmall>
                </View>
                {selected && (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* API Key input */}
        <Label color={Colors.textTertiary} style={styles.sectionLabel}>
          API KEY
        </Label>
        <View style={styles.keyCard}>
          <BodySmall color={Colors.textTertiary} style={styles.keyHint}>
            {provider.keyHint}
          </BodySmall>

          <View style={styles.keyRow}>
            <TextInput
              value={apiKey}
              onChangeText={setApiKey}
              placeholder={provider.keyPlaceholder}
              placeholderTextColor={Colors.textTertiary}
              style={styles.keyInput}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
            />
            <TouchableOpacity style={styles.pasteBtn} onPress={handlePaste} activeOpacity={0.7}>
              <Ionicons name="clipboard-outline" size={18} color={Colors.primary} />
              <BodySmall color={Colors.primary}>Paste</BodySmall>
            </TouchableOpacity>
          </View>

          {apiKey.length > 0 && (
            <View style={styles.keyPreview}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
              <BodySmall color={Colors.success}>
                Key entered ({apiKey.length} chars)
              </BodySmall>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            label={`Connect ${provider.name}`}
            onPress={handleConnect}
            size="lg"
            fullWidth
            loading={saving}
            disabled={!apiKey.trim()}
          />
          <Button
            label="Skip for now — set up later in Settings"
            onPress={handleSkip}
            variant="ghost"
          />
        </View>

        <BodySmall align="center" color={Colors.textTertiary} style={styles.note}>
          Your API key is stored in memory and never sent anywhere except the provider's own servers.
        </BodySmall>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Layout.screenPaddingH,
    paddingBottom: Spacing[10],
  },
  header: {
    alignItems: 'center',
    marginTop: Spacing[8],
    marginBottom: Spacing[6],
  },
  title: {
    marginBottom: Spacing[2],
  },
  subtitle: {
    lineHeight: 22,
  },
  sectionLabel: {
    letterSpacing: 0.8,
    marginBottom: Spacing[3],
    marginTop: Spacing[2],
  },
  providerList: {
    gap: Spacing[2],
    marginBottom: Spacing[6],
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    padding: Spacing[4],
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.divider,
    backgroundColor: Colors.surface,
    ...Shadow.sm,
  },
  providerCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  providerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerIconSelected: {
    backgroundColor: Colors.primary,
  },
  providerText: {
    flex: 1,
    gap: 2,
  },
  keyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    gap: Spacing[3],
    marginBottom: Spacing[6],
    ...Shadow.sm,
  },
  keyHint: {
    lineHeight: 18,
  },
  keyRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    alignItems: 'center',
  },
  keyInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.borderActive,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    fontSize: 15,
    color: Colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    backgroundColor: Colors.background,
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
  keyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
  },
  actions: {
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[4],
  },
  note: {
    lineHeight: 18,
    paddingHorizontal: Spacing[4],
  },
});
