/**
 * Chat store — persists conversation across tab navigation within a session.
 * Messages survive navigating away from the chat screen and returning.
 */

import { create } from 'zustand';

export interface TaskAction {
  op: 'update_task';
  taskId: string;
  updates: Partial<{ status: string; title: string; completedAt: number }>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  taskAction?: TaskAction;
  actionExecuted?: boolean;
}

interface ChatState {
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  clearMessages: () => void;
}

function makeWelcome(): ChatMessage {
  return {
    id: 'welcome',
    role: 'assistant',
    content: "Hey! I'm Sid. I can help you manage your tasks, talk through what's making something feel hard, or just give you a push. What's going on?",
    timestamp: Date.now(),
  };
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [makeWelcome()],

  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),

  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, ...updates } : m,
      ),
    })),

  clearMessages: () => set({ messages: [makeWelcome()] }),
}));
