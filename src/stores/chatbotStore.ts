"use client";

import { create } from "zustand";
import {
  type ChatbotFsmState,
  type ChatbotIntent,
  getFsmStateForStep,
  getInitialFsmState,
  getTurnForState,
  handleDisallowedFreeText,
  handleFreeTextSubmission,
  logChatbotIssue,
  materializeTurn,
  transitionFromOption,
  type ChatbotTranslate,
  type MaterializedOption,
} from "@/services/chatbotEngine";

const TYPING_MS = 380;

export type ChatMessage = {
  id: string;
  type: "bot" | "user";
  text: string;
  options?: MaterializedOption[];
  /** Engine step id when this bot message was shown (debug / support trail). */
  nextStep?: string;
};

function newId(): string {
  return `m_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

type ChatbotStore = {
  messages: ChatMessage[];
  currentStep: string;
  selectedIntent: ChatbotIntent | null;
  subIntent: string | null;
  context: Record<string, string>;
  loading: boolean;
  fsm: ChatbotFsmState;
  _typingTimer: ReturnType<typeof setTimeout> | null;

  addMessage: (msg: Omit<ChatMessage, "id"> & { id?: string }) => void;
  setStep: (step: string) => void;
  setIntent: (intent: ChatbotIntent | null) => void;
  setLoading: (v: boolean) => void;
  resetChat: (t: ChatbotTranslate) => void;
  resetChatToTripJourney: (t: ChatbotTranslate) => void;
  submitOption: (opt: MaterializedOption, t: ChatbotTranslate) => void;
  submitFreeText: (text: string, t: ChatbotTranslate) => void;
  cancelPending: () => void;
};

function pushBotFromFsm(fsm: ChatbotFsmState, t: ChatbotTranslate): Omit<ChatMessage, "id"> {
  const turn = getTurnForState(fsm);
  const m = materializeTurn(turn, fsm, t);
  return {
    type: "bot",
    text: m.text,
    options: m.options,
    nextStep: m.stepId,
  };
}

function maybeLogEscalation(fsm: ChatbotFsmState): void {
  if (fsm.step === "unresolved.soft") {
    logChatbotIssue({
      intent: fsm.intent,
      step: fsm.step,
      subIntent: fsm.subIntent,
      context: fsm.context,
      text: "escalation:self_help_exhausted",
    });
  }
  if (fsm.step === "unresolved.logged") {
    logChatbotIssue({
      intent: fsm.intent,
      step: fsm.step,
      subIntent: fsm.subIntent,
      context: fsm.context,
      text: "escalation:email_path",
    });
  }
}

export const useChatbotStore = create<ChatbotStore>((set, get) => ({
  messages: [],
  currentStep: "welcome",
  selectedIntent: null,
  subIntent: null,
  context: {},
  loading: false,
  fsm: getInitialFsmState(),
  _typingTimer: null,

  addMessage: (msg) =>
    set((s) => ({
      messages: [...s.messages, { ...msg, id: msg.id ?? newId() }],
    })),

  setStep: (currentStep) => set({ currentStep }),
  setIntent: (selectedIntent) => set({ selectedIntent }),
  setLoading: (loading) => set({ loading }),

  cancelPending: () => {
    const prev = get()._typingTimer;
    if (prev) clearTimeout(prev);
    set({ _typingTimer: null, loading: false });
  },

  resetChat: (t) => {
    const prev = get()._typingTimer;
    if (prev) clearTimeout(prev);
    const fsm = getInitialFsmState();
    const first = pushBotFromFsm(fsm, t);
    set({
      fsm,
      currentStep: fsm.step,
      selectedIntent: null,
      subIntent: null,
      context: {},
      loading: false,
      _typingTimer: null,
      messages: [{ ...first, id: newId() }],
    });
  },

  resetChatToTripJourney: (t) => {
    const prev = get()._typingTimer;
    if (prev) clearTimeout(prev);
    const fsm = getFsmStateForStep("trip_journey.welcome");
    const first = pushBotFromFsm(fsm, t);
    set({
      fsm,
      currentStep: fsm.step,
      selectedIntent: fsm.intent,
      subIntent: fsm.subIntent,
      context: fsm.context,
      loading: false,
      _typingTimer: null,
      messages: [{ ...first, id: newId() }],
    });
  },

  submitOption: (opt, t) => {
    const prevTimer = get()._typingTimer;
    if (prevTimer) clearTimeout(prevTimer);

    set((s) => ({
      messages: [...s.messages, { id: newId(), type: "user", text: opt.label }],
      loading: true,
      _typingTimer: null,
    }));

    const timer = setTimeout(() => {
      const nextFsm = transitionFromOption(get().fsm, opt);
      maybeLogEscalation(nextFsm);
      const botPayload = pushBotFromFsm(nextFsm, t);
      set((s) => ({
        fsm: nextFsm,
        currentStep: nextFsm.step,
        selectedIntent: nextFsm.intent,
        subIntent: nextFsm.subIntent,
        context: nextFsm.context,
        loading: false,
        _typingTimer: null,
        messages: [...s.messages, { ...botPayload, id: newId() }],
      }));
    }, TYPING_MS);

    set({ _typingTimer: timer });
  },

  submitFreeText: (text, t) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const prevTimer = get()._typingTimer;
    if (prevTimer) clearTimeout(prevTimer);

    const turn = getTurnForState(get().fsm);
    if (!turn.allowFreeText) {
      set((s) => ({
        messages: [...s.messages, { id: newId(), type: "user", text: trimmed }],
        loading: true,
        _typingTimer: null,
      }));
      const timer = setTimeout(() => {
        const nextFsm = handleDisallowedFreeText(get().fsm, trimmed);
        const botPayload = pushBotFromFsm(nextFsm, t);
        set((s) => ({
          fsm: nextFsm,
          currentStep: nextFsm.step,
          selectedIntent: nextFsm.intent,
          subIntent: nextFsm.subIntent,
          context: nextFsm.context,
          loading: false,
          _typingTimer: null,
          messages: [...s.messages, { ...botPayload, id: newId() }],
        }));
      }, TYPING_MS);
      set({ _typingTimer: timer });
      return;
    }

    set((s) => ({
      messages: [...s.messages, { id: newId(), type: "user", text: trimmed }],
      loading: true,
      _typingTimer: null,
    }));

    const timer = setTimeout(() => {
      const nextFsm = handleFreeTextSubmission(get().fsm, trimmed);
      const botPayload = pushBotFromFsm(nextFsm, t);
      set((s) => ({
        fsm: nextFsm,
        currentStep: nextFsm.step,
        selectedIntent: nextFsm.intent,
        subIntent: nextFsm.subIntent,
        context: nextFsm.context,
        loading: false,
        _typingTimer: null,
        messages: [...s.messages, { ...botPayload, id: newId() }],
      }));
    }, TYPING_MS);

    set({ _typingTimer: timer });
  },
}));
