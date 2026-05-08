/**
 * AI Chat screen — Sid the study companion
 *
 * Persistent conversation (survives tab navigation via chatStore).
 * Responds to the actual content of every message.
 * Can update, complete, pause, or activate tasks on request.
 * Injects full task context (with IDs) into every AI call.
 * Parses [TASK_OP:{...}] action blocks from responses and executes them.
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Spacing, Layout, Radius, Shadow } from '../constants/spacing';
import { H4, Body, BodySmall } from '../components/ui/Typography';
import { HumanMascot } from '../components/mascot/HumanMascot';
import { chatWithAI } from '../services/ai/claude';
import { createTask, updateTask } from '../services/firebase/firestore';
import { useTaskStore } from '../store/taskStore';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { useChatStore } from '../store/chatStore';
import type { ChatMessage as APIChatMessage } from '../services/ai/types';
import type { ChatMessage, TaskAction } from '../store/chatStore';
import type { Task, UserProfile } from '../types';
import { generateId, generateStepId } from '../utils/idUtils';

// ── System context builder ────────────────────────────────────

function buildSystemContext(tasks: Task[], profile: UserProfile | null): string {
  const relevant = tasks.filter((t) => t.status !== 'abandoned');
  const active = relevant.filter((t) => t.status === 'active');
  const inactive = relevant.filter((t) => t.status === 'inactive');
  const completed = tasks.filter((t) => t.status === 'completed').length;

  const parts: string[] = [];
  if (profile?.displayName) parts.push(`Student: ${profile.displayName}`);
  if (profile?.context) parts.push(`About them: ${profile.context}`);

  const taskData = [...active, ...inactive].map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
  }));
  if (taskData.length > 0) {
    parts.push(`TASK_DATA:${JSON.stringify(taskData)}`);
  }

  if (active.length > 0) parts.push(`Active tasks: ${active.map((t) => `"${t.title}"`).join(', ')}`);
  if (inactive.length > 0) parts.push(`Paused tasks: ${inactive.map((t) => `"${t.title}"`).join(', ')}`);
  if (completed > 0) parts.push(`Completed: ${completed} task${completed !== 1 ? 's' : ''}`);

  return parts.join('\n');
}

// ── Action block parser ───────────────────────────────────────

function parseActionBlock(text: string): { cleaned: string; action: TaskAction | null } {
  const marker = '[TASK_OP:';
  const start = text.indexOf(marker);
  if (start === -1) return { cleaned: text.trim(), action: null };

  let depth = 0;
  let inString = false;
  let escaped = false;
  let jsonStart = -1;
  let jsonEnd = -1;

  for (let i = start + marker.length; i < text.length; i += 1) {
    const char = text[i];

    if (jsonStart === -1) {
      if (char === '{') {
        jsonStart = i;
        depth = 1;
      }
      continue;
    }

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;

    if (depth === 0) {
      jsonEnd = i;
      break;
    }
  }

  if (jsonStart === -1 || jsonEnd === -1) {
    return { cleaned: text.trim(), action: null };
  }

  const rawJson = text.slice(jsonStart, jsonEnd + 1);
  const closingBracketIndex = text.indexOf(']', jsonEnd);
  const cleaned =
    closingBracketIndex === -1
      ? text.trim()
      : `${text.slice(0, start)}${text.slice(closingBracketIndex + 1)}`.trim();

  try {
    const action = JSON.parse(rawJson) as TaskAction;
    return { cleaned, action };
  } catch {
    return { cleaned, action: null };
  }
}

// ── Chat screen ───────────────────────────────────────────────

export default function ChatScreen() {
  const { tasks, upsertTask } = useTaskStore();
  const { profile, user } = useAuthStore();
  const { aiProvider, deepseekApiKey, anthropicApiKey, openaiApiKey } = useSettingsStore();
  const { messages, addMessage, updateMessage, clearMessages } = useChatStore();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const hasAIConfigured =
    (aiProvider === 'deepseek' && !!deepseekApiKey) ||
    (aiProvider === 'anthropic' && !!anthropicApiKey) ||
    (aiProvider === 'openai' && !!openaiApiKey) ||
    aiProvider === 'ollama';

  const scrollToBottom = () =>
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);

  const executeAction = useCallback(
    async (action: TaskAction, msgId: string) => {
      if (!user) return;
      try {
        if (action.op === 'update_task' && action.taskId && action.updates) {
          await updateTask(user.uid, action.taskId, action.updates as any);
        }

        if (action.op === 'create_task' && action.title) {
          const taskId = generateId();
          const now = Date.now();
          const sourceSteps = action.steps?.length
            ? action.steps
            : [
                {
                  title: 'Open your notes and list the most important topics',
                  detail: 'Write down what you most need to review first so the task feels concrete.',
                  estimatedMinutes: 10,
                },
              ];

          const steps = sourceSteps.map((step, index) => ({
            id: generateStepId(taskId, index + 1),
            taskId,
            order: index + 1,
            title: step.title,
            detail: step.detail,
            estimatedMinutes: step.estimatedMinutes,
            status: index === 0 ? 'active' as const : 'pending' as const,
          }));

          const task: Task = {
            id: taskId,
            userId: user.uid,
            title: action.title,
            description: action.description ?? '',
            status: 'active',
            steps,
            createdAt: now,
            updatedAt: now,
            aiContext: action.aiContext,
          };

          await createTask(task);
          upsertTask(task);
        }

        updateMessage(msgId, { actionExecuted: true });
      } catch {
        // no-op
      }
    },
    [user, updateMessage, upsertTask],
  );

  const handleClear = () => {
    Alert.alert('Clear conversation', 'Start a fresh chat with Sid?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearMessages },
    ]);
  };

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    addMessage(userMsg);
    setLoading(true);
    scrollToBottom();

    const history: APIChatMessage[] = messages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({ role: m.role, content: m.content }));
    history.push({ role: 'user', content: text });

    try {
      const systemContext = buildSystemContext(tasks, profile);
      const rawReply = await chatWithAI(history, systemContext);
      const { cleaned, action } = parseActionBlock(rawReply);

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: cleaned,
        timestamp: Date.now(),
        taskAction: action ?? undefined,
        actionExecuted: false,
      };
      addMessage(assistantMsg);

      if (action) {
        executeAction(action, assistantMsg.id);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      addMessage({
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `I couldn't connect right now. ${errorMessage}`,
        timestamp: Date.now(),
      });
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }, [input, loading, messages, tasks, profile, addMessage, executeAction]);

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAI]}>
        {!isUser && (
          <View style={styles.avatarWrap}>
            <HumanMascot size="sm" state="idle" />
          </View>
        )}
        <View style={styles.bubbleCol}>
          <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
            <Body
              color={isUser ? Colors.textInverse : Colors.textPrimary}
              style={styles.bubbleText}
            >
              {item.content}
            </Body>
          </View>
          {item.taskAction && (
            <View style={styles.actionBadge}>
              <Ionicons
                name={item.actionExecuted ? 'checkmark-circle' : 'sync-outline'}
                size={13}
                color={item.actionExecuted ? Colors.success : Colors.textTertiary}
              />
              <BodySmall
                color={item.actionExecuted ? Colors.success : Colors.textTertiary}
                style={styles.actionBadgeText}
              >
                {item.actionExecuted ? 'Task synced' : 'Syncing task...'}
              </BodySmall>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-down" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <H4 color={Colors.textPrimary}>Sid</H4>
          <BodySmall color={Colors.textSecondary}>Your study companion</BodySmall>
        </View>
        <TouchableOpacity
          onPress={handleClear}
          style={styles.clearBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={20} color={Colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* No AI banner */}
      {!hasAIConfigured && (
        <TouchableOpacity
          style={styles.noBanner}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="key-outline" size={15} color={Colors.warning} />
          <BodySmall color={Colors.textSecondary} style={styles.noBannerText}>
            No AI connected — go to Settings → AI Provider to add a free API key.
          </BodySmall>
          <Ionicons name="chevron-forward" size={14} color={Colors.textTertiary} />
        </TouchableOpacity>
      )}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: false })
        }
      />

      {/* Typing indicator */}
      {loading && (
        <View style={[styles.messageRow, styles.messageRowAI, styles.typingRow]}>
          <View style={styles.avatarWrap}>
            <HumanMascot size="sm" state="thinking" />
          </View>
          <View style={[styles.bubble, styles.bubbleAI, styles.typingBubble]}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        </View>
      )}

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.inputBar}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder='Ask Sid anything... try "complete my essay task"'
            placeholderTextColor={Colors.textTertiary}
            style={styles.input}
            multiline
            maxLength={800}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!input.trim() || loading}
            activeOpacity={0.8}
          >
            <Ionicons
              name="arrow-up"
              size={18}
              color={!input.trim() || loading ? Colors.textTertiary : Colors.textInverse}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPaddingH,
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  backBtn: {
    width: 40,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  clearBtn: {
    width: 40,
    alignItems: 'flex-end',
  },
  noBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Layout.screenPaddingH,
    paddingVertical: Spacing[2] + 2,
    backgroundColor: '#FFF8E1',
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  noBannerText: {
    flex: 1,
    lineHeight: 18,
  },
  list: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing[4],
    paddingBottom: Spacing[4],
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: Spacing[3],
    alignItems: 'flex-end',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAI: {
    justifyContent: 'flex-start',
  },
  avatarWrap: {
    width: 50,
    alignItems: 'center',
    marginRight: Spacing[2],
    marginBottom: 2,
  },
  bubbleCol: {
    maxWidth: '75%',
  },
  bubble: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderRadius: Radius.xl,
  },
  bubbleUser: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: Radius.xs,
    alignSelf: 'flex-end',
  },
  bubbleAI: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: Radius.xs,
    ...Shadow.sm,
  },
  bubbleText: {
    lineHeight: 22,
  },
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing[1],
    marginLeft: Spacing[2],
  },
  actionBadgeText: {
    fontSize: 11,
  },
  typingRow: {
    paddingHorizontal: Layout.screenPaddingH,
    marginBottom: Spacing[2],
  },
  typingBubble: {
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing[2],
    paddingHorizontal: Layout.screenPaddingH,
    paddingVertical: Spacing[3],
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    backgroundColor: Colors.background,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    fontSize: 16,
    color: Colors.textPrimary,
    maxHeight: 120,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    ...Shadow.sm,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sendBtnDisabled: {
    backgroundColor: Colors.surface,
    ...Shadow.sm,
  },
});
