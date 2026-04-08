"use client";

import { memo, useCallback, useEffect, useRef } from "react";
import { useLocale } from "@/context/LocaleContext";
import { getTurnForState } from "@/services/chatbotEngine";
import type { MaterializedOption } from "@/services/chatbotEngine";
import { useChatbotStore, type ChatMessage } from "@/stores/chatbotStore";

type HelpChatbotProps = {
  className?: string;
  active?: boolean;
  /** `trip_journey` = in-trip help menu (from active trip). */
  entry?: "default" | "trip_journey";
};

function TypingIndicator() {
  return (
    <div className="flex justify-start px-2 py-0.5" aria-live="polite" aria-label="Assistant is typing">
      <div className="flex gap-1 rounded-[18px] rounded-bl-sm bg-[#E8F5E9] px-3.5 py-2.5 shadow-sm">
        <span className="size-1.5 animate-bounce rounded-full bg-[#81C784] [animation-delay:-0.2s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-[#81C784] [animation-delay:-0.1s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-[#81C784]" />
      </div>
    </div>
  );
}

function MessageBubble({
  msg,
  showActions,
  onOption,
}: {
  msg: ChatMessage;
  showActions: boolean;
  onOption: (opt: MaterializedOption) => void;
}) {
  const isBot = msg.type === "bot";
  return (
    <div className={`flex w-full flex-col gap-2 ${isBot ? "items-start pl-1" : "items-end pr-1"}`}>
      <div
        className={`max-w-[min(100%,19rem)] rounded-[18px] px-3.5 py-2 text-[13px] leading-snug shadow-sm ${
          isBot
            ? "rounded-bl-sm bg-white text-[var(--color-text-primary)] ring-1 ring-black/[0.06]"
            : "rounded-br-sm bg-[#DCF8C6] text-[#0d1f12]"
        }`}
      >
        <p className="whitespace-pre-wrap">{msg.text}</p>
      </div>
      {showActions && msg.options && msg.options.length > 0 ? (
        <div className="flex w-full max-w-[min(100%,19rem)] flex-col gap-1.5 pl-0.5">
          {msg.options.map((opt) => (
            <button
              key={opt.value + opt.label}
              type="button"
              onClick={() => onOption(opt)}
              className="rounded-full border border-[#075E54]/20 bg-white px-3 py-2 text-left text-[12px] font-semibold text-[#075E54] shadow-sm transition-transform active:scale-[0.99] hover:bg-[#f0fff4]"
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function HelpChatbotInner({ className = "", active = true, entry = "default" }: HelpChatbotProps) {
  const { t } = useLocale();
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = useChatbotStore((s) => s.messages);
  const fsm = useChatbotStore((s) => s.fsm);
  const loading = useChatbotStore((s) => s.loading);
  const allowFreeText = Boolean(getTurnForState(fsm).allowFreeText);
  const resetChat = useChatbotStore((s) => s.resetChat);
  const resetChatToTripJourney = useChatbotStore((s) => s.resetChatToTripJourney);
  const submitOption = useChatbotStore((s) => s.submitOption);
  const submitFreeText = useChatbotStore((s) => s.submitFreeText);

  useEffect(() => {
    if (!active) return;
    if (entry === "trip_journey") resetChatToTripJourney(t);
    else resetChat(t);
  }, [active, entry, resetChat, resetChatToTripJourney, t]);

  useEffect(() => {
    return () => {
      useChatbotStore.getState().cancelPending();
    };
  }, []);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  const onOption = useCallback(
    (opt: MaterializedOption) => {
      if (loading) return;
      submitOption(opt, t);
    },
    [loading, submitOption, t],
  );

  const onSubmitText = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const raw = fd.get("chatbotInput");
      const text = typeof raw === "string" ? raw : "";
      if (!text.trim() || loading) return;
      submitFreeText(text, t);
      e.currentTarget.reset();
    },
    [loading, submitFreeText, t],
  );

  const lastIdx = messages.length - 1;

  return (
    <div
      className={`flex min-h-0 flex-1 flex-col rounded-xl bg-[#ECE5DD] ${className}`}
      style={{
        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 12px, rgba(0,0,0,0.015) 12px, rgba(0,0,0,0.015) 24px)`,
      }}
    >
      <div
        ref={scrollRef}
        className="min-h-[220px] flex-1 space-y-2 overflow-y-auto overscroll-contain px-2 py-3"
        role="log"
        aria-relevant="additions"
        aria-live="polite"
      >
        {messages.map((msg, i) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            showActions={!loading && msg.type === "bot" && i === lastIdx}
            onOption={onOption}
          />
        ))}
        {loading ? <TypingIndicator /> : null}
        <div ref={bottomRef} className="h-1 shrink-0" aria-hidden />
      </div>

      <form
        onSubmit={onSubmitText}
        className="flex shrink-0 gap-2 border-t border-black/5 bg-[#F0F0F0] px-2 py-2"
      >
        <label htmlFor={`help-chatbot-input-${entry}`} className="sr-only">
          {t("chatbot.inputLabel")}
        </label>
        <input
          id={`help-chatbot-input-${entry}`}
          name="chatbotInput"
          type="text"
          autoComplete="off"
          placeholder={t("chatbot.inputPlaceholder")}
          disabled={loading}
          className="min-w-0 flex-1 rounded-full border-0 bg-white px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 disabled:opacity-45"
        />
        <button
          type="submit"
          disabled={loading}
          className="shrink-0 rounded-full bg-[#075E54] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:opacity-95 disabled:pointer-events-none disabled:opacity-35"
        >
          {t("chatbot.send")}
        </button>
      </form>
    </div>
  );
}

export default memo(HelpChatbotInner);
