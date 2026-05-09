/**
 * Settings store
 *
 * Zustand slice for app-wide settings including AI provider configuration,
 * preferences, and display options. In-memory only (no AsyncStorage dependency).
 *
 * Default AI provider: 'none' — user must configure via AI Setup screen or Settings.
 */

import { create } from 'zustand';
import type { TaskPriority } from '../types';

export type AIProviderType = 'deepseek' | 'anthropic' | 'openai' | 'ollama' | 'none';

export interface AppSettings {
  // AI Provider
  aiProvider: AIProviderType;
  deepseekApiKey: string;
  deepseekModel: string;
  anthropicApiKey: string;
  openaiApiKey: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
  openaiModel: string;
  anthropicModel: string;

  // Preferences
  defaultPriority: TaskPriority | null;
  focusModeDefault: boolean;
  hapticFeedback: boolean;
  showStreakOnHome: boolean;
}

interface SettingsState extends AppSettings {
  setAiProvider: (provider: AIProviderType) => void;
  setDeepseekApiKey: (key: string) => void;
  setDeepseekModel: (model: string) => void;
  setAnthropicApiKey: (key: string) => void;
  setOpenaiApiKey: (key: string) => void;
  setOllamaBaseUrl: (url: string) => void;
  setOllamaModel: (model: string) => void;
  setOpenaiModel: (model: string) => void;
  setAnthropicModel: (model: string) => void;
  setDefaultPriority: (priority: TaskPriority | null) => void;
  setFocusModeDefault: (value: boolean) => void;
  setHapticFeedback: (value: boolean) => void;
  setShowStreakOnHome: (value: boolean) => void;
  updateSettings: (partial: Partial<AppSettings>) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  // No AI provider configured by default — user must set one up
  aiProvider: 'none',
  deepseekApiKey: '',
  deepseekModel: 'deepseek-chat',
  anthropicApiKey: '',
  openaiApiKey: '',
  ollamaBaseUrl: 'http://localhost:11434',
  ollamaModel: 'llama3.2',
  openaiModel: 'gpt-4o-mini',
  anthropicModel: 'claude-sonnet-4-6',
  defaultPriority: null,
  focusModeDefault: false,
  hapticFeedback: true,
  showStreakOnHome: true,

  setAiProvider: (aiProvider) => set({ aiProvider }),
  setDeepseekApiKey: (deepseekApiKey) => set({ deepseekApiKey }),
  setDeepseekModel: (deepseekModel) => set({ deepseekModel }),
  setAnthropicApiKey: (anthropicApiKey) => set({ anthropicApiKey }),
  setOpenaiApiKey: (openaiApiKey) => set({ openaiApiKey }),
  setOllamaBaseUrl: (ollamaBaseUrl) => set({ ollamaBaseUrl }),
  setOllamaModel: (ollamaModel) => set({ ollamaModel }),
  setOpenaiModel: (openaiModel) => set({ openaiModel }),
  setAnthropicModel: (anthropicModel) => set({ anthropicModel }),
  setDefaultPriority: (defaultPriority) => set({ defaultPriority }),
  setFocusModeDefault: (focusModeDefault) => set({ focusModeDefault }),
  setHapticFeedback: (hapticFeedback) => set({ hapticFeedback }),
  setShowStreakOnHome: (showStreakOnHome) => set({ showStreakOnHome }),
  updateSettings: (partial) => set((state) => ({ ...state, ...partial })),
}));
