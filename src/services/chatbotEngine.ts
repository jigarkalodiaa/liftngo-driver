/**
 * Self-resolution chatbot engine: state machine, context, decision trees, combo flows.
 * UI only renders; all branching and copy keys live here.
 */

export type ChatbotIntent =
  | "TRIP_ISSUES"
  | "WALLET_ISSUES"
  | "PERFORMANCE_ISSUES"
  | "CANCELLATION_ISSUES"
  | "APP_ISSUES"
  | "ACCOUNT_ISSUES"
  | "OTHER";

export type ChatbotFsmState = {
  step: string;
  intent: ChatbotIntent | null;
  /** Last focused sub-issue id for analytics / clarity */
  subIntent: string | null;
  /** Answers from decision-tree chips (e.g. nrt.online=yes) */
  context: Record<string, string>;
  /** Recent step ids — loop detection + “change topic” recovery */
  path: string[];
  updatedAt: number;
};

export type ChatbotOptionDef = {
  labelKey: string;
  next: string;
  contextPatch?: Record<string, string>;
  /** Clear intent/context and return to welcome */
  resetSession?: boolean;
};

export type ChatbotEngineTurn = {
  textKey: string;
  textVars?: Record<string, string | number>;
  options?: ChatbotOptionDef[];
  allowFreeText?: boolean;
};

export type MaterializedOption = {
  label: string;
  value: string;
  contextPatch?: Record<string, string>;
  resetSession?: boolean;
};

export type MaterializedBotPayload = {
  text: string;
  options?: MaterializedOption[];
  allowFreeText?: boolean;
  /** Current engine step after resolution (for message.nextStep) */
  stepId: string;
};

const MAX_PATH_LEN = 56;
const MAX_REPEAT_STEP = 5;

/** Performance threshold mentioned in copy (informational). */
export const CHATBOT_PERF_THRESHOLD = 50;

type StepDef = Omit<ChatbotEngineTurn, "textKey"> & { textKey: string };

function opt(labelKey: string, next: string, extras?: Partial<Omit<ChatbotOptionDef, "labelKey" | "next">>): ChatbotOptionDef {
  return { labelKey, next, ...extras };
}

const changeTopic = opt("chatbot.opt.changeTopic", "welcome", { resetSession: true });
const backMenu = opt("chatbot.opt.backMenu", "welcome", { resetSession: true });
const backTripJourney = opt("chatbot.tripJourney.back", "trip_journey.welcome");

const STEP_DEFS: Record<string, StepDef> = {
  /** In-trip help menu (opened from active trip hamburger). */
  "trip_journey.welcome": {
    textKey: "chatbot.tripJourney.welcome",
    allowFreeText: true,
    options: [
      opt("chatbot.tripJourney.opt.mapsNav", "trip_journey.maps_nav"),
      opt("chatbot.tripJourney.opt.cashPay", "trip_journey.cash_pay"),
      opt("chatbot.tripJourney.opt.paymentApp", "trip_journey.payment_app"),
      opt("chatbot.tripJourney.opt.stuck", "trip_journey.stuck"),
      opt("chatbot.tripJourney.opt.breakdown", "cancel.break.sol"),
      opt("chatbot.tripJourney.opt.notReceiving", "trip.nrt.q_online"),
      opt("chatbot.tripJourney.opt.fullTripMenu", "trip.root"),
      opt("chatbot.tripJourney.opt.allTopics", "welcome", { resetSession: true }),
    ],
  },
  "trip_journey.maps_nav": {
    textKey: "chatbot.tripJourney.mapsNavSol",
    options: [backTripJourney],
  },
  "trip_journey.cash_pay": {
    textKey: "chatbot.tripJourney.cashPaySol",
    options: [backTripJourney, opt("chatbot.action.openTripMenu", "trip.accept.sol")],
  },
  "trip_journey.payment_app": {
    textKey: "chatbot.tripJourney.paymentAppSol",
    options: [backTripJourney],
  },
  "trip_journey.stuck": {
    textKey: "chatbot.tripJourney.stuckSol",
    options: [
      backTripJourney,
      opt("chatbot.action.checkNetwork", "trip.nrt.q_network"),
      opt("chatbot.action.openTripMenu", "trip.accept.sol"),
    ],
  },

  welcome: {
    textKey: "chatbot.welcomeV2",
    allowFreeText: true,
    options: [
      opt("chatbot.popular.notReceiving", "trip.nrt.q_online"),
      opt("chatbot.intentV2.trip", "trip.root"),
      opt("chatbot.intentV2.wallet", "wallet.root"),
      opt("chatbot.intentV2.performance", "perf.root"),
      opt("chatbot.intentV2.cancellation", "cancel.root"),
      opt("chatbot.intentV2.app", "app.root"),
      opt("chatbot.intentV2.account", "acct.root"),
      opt("chatbot.intentV2.other", "other.root"),
    ],
  },

  // ——— Trip issues ———
  "trip.root": {
    textKey: "chatbot.trip.root",
    options: [
      opt("chatbot.trip.sub.notReceiving", "trip.nrt.q_online"),
      opt("chatbot.trip.sub.disappeared", "trip.disp.sol"),
      opt("chatbot.trip.sub.wrongAssigned", "trip.wrong.sol"),
      opt("chatbot.trip.sub.cannotAccept", "trip.accept.sol"),
      opt("chatbot.trip.sub.comboHint", "combo.trip_perf.q"),
      changeTopic,
    ],
  },

  "trip.nrt.q_online": {
    textKey: "chatbot.trip.nrt.qOnline",
    options: [
      opt("chatbot.bool.yes", "trip.nrt.q_location", { contextPatch: { "nrt.online": "yes" } }),
      opt("chatbot.bool.no", "trip.nrt.sol_offline", { contextPatch: { "nrt.online": "no" } }),
      changeTopic,
    ],
  },
  "trip.nrt.q_location": {
    textKey: "chatbot.trip.nrt.qLocation",
    options: [
      opt("chatbot.bool.yes", "trip.nrt.q_network", { contextPatch: { "nrt.location": "yes" } }),
      opt("chatbot.bool.no", "trip.nrt.sol_location", { contextPatch: { "nrt.location": "no" } }),
      changeTopic,
    ],
  },
  "trip.nrt.q_network": {
    textKey: "chatbot.trip.nrt.qNetwork",
    options: [
      opt("chatbot.net.stable", "trip.nrt.q_suspended", { contextPatch: { "nrt.network": "ok" } }),
      opt("chatbot.net.unstable", "trip.nrt.sol_network", { contextPatch: { "nrt.network": "bad" } }),
      changeTopic,
    ],
  },
  "trip.nrt.q_suspended": {
    textKey: "chatbot.trip.nrt.qSuspended",
    options: [
      opt("chatbot.bool.yes", "trip.nrt.sol_suspended", { contextPatch: { "nrt.suspended": "yes" } }),
      opt("chatbot.bool.no", "trip.nrt.q_lowperf", { contextPatch: { "nrt.suspended": "no" } }),
      changeTopic,
    ],
  },
  "trip.nrt.q_lowperf": {
    textKey: "chatbot.trip.nrt.qLowPerf",
    options: [
      opt("chatbot.bool.yes", "combo.trip_perf.resolved", { contextPatch: { "nrt.lowperf": "yes" } }),
      opt("chatbot.bool.no", "trip.nrt.sol_all_clear", { contextPatch: { "nrt.lowperf": "no" } }),
      changeTopic,
    ],
  },

  "trip.nrt.sol_offline": {
    textKey: "chatbot.trip.nrt.solOffline",
    options: [
      opt("chatbot.action.retryOnline", "trip.nrt.q_online"),
      opt("chatbot.action.stillBroken", "unresolved.soft"),
      backMenu,
    ],
  },
  "trip.nrt.sol_location": {
    textKey: "chatbot.trip.nrt.solLocation",
    options: [
      opt("chatbot.action.fixedRetry", "trip.nrt.q_online"),
      opt("chatbot.action.stillBroken", "unresolved.soft"),
      backMenu,
    ],
  },
  "trip.nrt.sol_network": {
    textKey: "chatbot.trip.nrt.solNetwork",
    options: [
      opt("chatbot.action.tryAgain", "trip.nrt.q_online"),
      opt("chatbot.action.stillBroken", "unresolved.soft"),
      backMenu,
    ],
  },
  "trip.nrt.sol_suspended": {
    textKey: "chatbot.trip.nrt.solSuspended",
    textVars: { threshold: CHATBOT_PERF_THRESHOLD },
    options: [
      opt("chatbot.link.partnerTier", "perf.root"),
      opt("chatbot.action.tryAgain", "trip.nrt.q_online"),
      backMenu,
    ],
  },
  "trip.nrt.sol_all_clear": {
    textKey: "chatbot.trip.nrt.solAllClear",
    options: [
      opt("chatbot.action.tryAgain", "trip.nrt.q_online"),
      opt("chatbot.action.stillBroken", "unresolved.soft"),
      backMenu,
    ],
  },

  "trip.disp.sol": {
    textKey: "chatbot.trip.disp.sol",
    options: [
      opt("chatbot.action.refreshApp", "trip.disp.afterRefresh"),
      changeTopic,
      backMenu,
    ],
  },
  "trip.disp.afterRefresh": {
    textKey: "chatbot.trip.disp.afterRefresh",
    options: [opt("chatbot.action.stillBroken", "unresolved.soft"), backMenu],
  },

  "trip.wrong.sol": {
    textKey: "chatbot.trip.wrong.sol",
    options: [opt("chatbot.action.stillBroken", "unresolved.soft"), changeTopic, backMenu],
  },

  "trip.accept.sol": {
    textKey: "chatbot.trip.accept.sol",
    options: [
      opt("chatbot.action.checkNetwork", "trip.nrt.q_network"),
      opt("chatbot.action.openTripMenu", "trip.root"),
      backMenu,
    ],
  },

  // Combined: low performance + no trips
  "combo.trip_perf.q": {
    textKey: "chatbot.combo.tripPerf.q",
    options: [
      opt("chatbot.bool.yes", "combo.trip_perf.resolved", { contextPatch: { combo: "trip_perf" } }),
      opt("chatbot.bool.no", "trip.root"),
      changeTopic,
    ],
  },
  "combo.trip_perf.resolved": {
    textKey: "chatbot.combo.tripPerf.resolved",
    textVars: { threshold: CHATBOT_PERF_THRESHOLD },
    options: [
      opt("chatbot.link.partnerTier", "perf.root"),
      opt("chatbot.trip.sub.notReceiving", "trip.nrt.q_online"),
      backMenu,
    ],
  },

  // ——— Wallet ———
  "wallet.root": {
    textKey: "chatbot.wallet.rootV2",
    options: [
      opt("chatbot.wallet.sub.low", "wallet.low.sol"),
      opt("chatbot.wallet.sub.rechargeFail", "wallet.re.q1"),
      opt("chatbot.wallet.sub.deducted", "wallet.ded.sol"),
      opt("chatbot.wallet.sub.negative", "wallet.neg.sol"),
      opt("chatbot.wallet.sub.suspendedCombo", "wallet.sus.combo"),
      changeTopic,
    ],
  },
  "wallet.low.sol": {
    textKey: "chatbot.wallet.low.sol",
    options: [opt("chatbot.action.openWallet", "wallet.topup.hint"), backMenu],
  },
  "wallet.topup.hint": {
    textKey: "chatbot.wallet.topup.hint",
    options: [opt("chatbot.action.stillBroken", "unresolved.soft"), backMenu],
  },
  "wallet.re.q1": {
    textKey: "chatbot.wallet.re.q1",
    options: [
      opt("chatbot.wallet.re.bankPending", "wallet.re.pending"),
      opt("chatbot.wallet.re.appError", "wallet.re.app"),
      changeTopic,
    ],
  },
  "wallet.re.pending": {
    textKey: "chatbot.wallet.re.pending",
    options: [opt("chatbot.action.waitRetry", "wallet.re.q1"), opt("chatbot.action.stillBroken", "unresolved.soft"), backMenu],
  },
  "wallet.re.app": {
    textKey: "chatbot.wallet.re.app",
    options: [opt("chatbot.action.tryAgain", "wallet.re.q1"), backMenu],
  },
  "wallet.ded.sol": {
    textKey: "chatbot.wallet.ded.sol",
    options: [opt("chatbot.action.waitRetry", "wallet.ded.sol"), opt("chatbot.action.stillBroken", "unresolved.soft"), backMenu],
  },
  "wallet.neg.sol": {
    textKey: "chatbot.wallet.neg.sol",
    options: [opt("chatbot.link.partnerTier", "perf.root"), opt("chatbot.action.stillBroken", "unresolved.soft"), backMenu],
  },
  "wallet.sus.combo": {
    textKey: "chatbot.wallet.sus.combo",
    options: [
      opt("chatbot.wallet.sus.checkBanner", "trip.nrt.sol_suspended"),
      opt("chatbot.wallet.sus.checkWallet", "wallet.ded.sol"),
      backMenu,
    ],
  },

  // ——— Performance ———
  "perf.root": {
    textKey: "chatbot.perf.rootV2",
    options: [
      opt("chatbot.perf.sub.low", "perf.low.sol"),
      opt("chatbot.perf.sub.drop", "perf.drop.sol"),
      opt("chatbot.perf.sub.missed", "perf.missed.sol"),
      changeTopic,
      backMenu,
    ],
  },
  "perf.low.sol": {
    textKey: "chatbot.perf.low.sol",
    textVars: { threshold: CHATBOT_PERF_THRESHOLD },
    options: [opt("chatbot.trip.sub.notReceiving", "trip.nrt.q_online"), backMenu],
  },
  "perf.drop.sol": {
    textKey: "chatbot.perf.drop.sol",
    options: [opt("chatbot.link.partnerTier", "perf.root"), backMenu],
  },
  "perf.missed.sol": {
    textKey: "chatbot.perf.missed.sol",
    options: [opt("chatbot.action.tryAgain", "trip.nrt.q_online"), backMenu],
  },

  // ——— Cancellation ———
  "cancel.root": {
    textKey: "chatbot.cancel.rootV2",
    options: [
      opt("chatbot.cancel.sub.mistake", "cancel.mistake.sol"),
      opt("chatbot.cancel.sub.breakdown", "cancel.break.sol"),
      opt("chatbot.cancel.sub.penalty", "cancel.pen.sol"),
      changeTopic,
      backMenu,
    ],
  },
  "cancel.mistake.sol": {
    textKey: "chatbot.cancel.mistake.sol",
    options: [opt("chatbot.action.stillBroken", "unresolved.soft"), backMenu],
  },
  "cancel.break.sol": {
    textKey: "chatbot.cancel.break.sol",
    options: [opt("chatbot.link.partnerTier", "perf.root"), backMenu],
  },
  "cancel.pen.sol": {
    textKey: "chatbot.cancel.pen.sol",
    options: [opt("chatbot.action.stillBroken", "unresolved.soft"), backMenu],
  },

  // ——— App ———
  "app.root": {
    textKey: "chatbot.app.rootV2",
    options: [
      opt("chatbot.app.sub.crash", "app.crash.sol"),
      opt("chatbot.app.sub.gps", "app.gps.sol"),
      opt("chatbot.app.sub.network", "app.net.sol"),
      opt("chatbot.app.sub.login", "app.login.sol"),
      changeTopic,
      backMenu,
    ],
  },
  "app.crash.sol": {
    textKey: "chatbot.app.crash.solV2",
    options: [opt("chatbot.action.tryAgain", "app.root"), opt("chatbot.action.stillBroken", "unresolved.soft"), backMenu],
  },
  "app.gps.sol": {
    textKey: "chatbot.app.gps.solV2",
    options: [opt("chatbot.action.tryAgain", "trip.nrt.q_location"), backMenu],
  },
  "app.net.sol": {
    textKey: "chatbot.app.net.solV2",
    options: [opt("chatbot.action.tryAgain", "trip.nrt.q_network"), backMenu],
  },
  "app.login.sol": {
    textKey: "chatbot.app.login.sol",
    options: [opt("chatbot.action.tryAgain", "welcome"), backMenu],
  },

  // ——— Account ———
  "acct.root": {
    textKey: "chatbot.acct.root",
    options: [
      opt("chatbot.acct.sub.verify", "acct.verify.sol"),
      opt("chatbot.acct.sub.docs", "acct.docs.sol"),
      opt("chatbot.acct.sub.phone", "acct.phone.sol"),
      changeTopic,
      backMenu,
    ],
  },
  "acct.verify.sol": {
    textKey: "chatbot.acct.verify.sol",
    options: [opt("chatbot.action.stillBroken", "unresolved.soft"), backMenu],
  },
  "acct.docs.sol": {
    textKey: "chatbot.acct.docs.sol",
    options: [opt("chatbot.action.stillBroken", "unresolved.soft"), backMenu],
  },
  "acct.phone.sol": {
    textKey: "chatbot.acct.phone.sol",
    options: [opt("chatbot.action.stillBroken", "unresolved.soft"), backMenu],
  },

  // ——— Other / free text ———
  "other.root": {
    textKey: "chatbot.other.rootV2",
    allowFreeText: true,
    options: [changeTopic, backMenu],
  },

  "freeform_ack": {
    textKey: "chatbot.freeform.ackV2",
    options: [opt("chatbot.opt.backMenu", "welcome", { resetSession: true })],
  },

  // ——— System ———
  "clarify.pickOption": {
    textKey: "chatbot.clarify.pickOption",
    options: [opt("chatbot.opt.backMenu", "welcome", { resetSession: true })],
  },
  "unresolved.soft": {
    textKey: "chatbot.unresolved.soft",
    options: [
      opt("chatbot.unresolved.emailCta", "unresolved.logged"),
      opt("chatbot.action.newChat", "welcome", { resetSession: true }),
    ],
  },
  "unresolved.logged": {
    textKey: "chatbot.unresolved.logged",
    options: [opt("chatbot.opt.backMenu", "welcome", { resetSession: true })],
  },
  "system.loop_guard": {
    textKey: "chatbot.system.loopGuard",
    options: [opt("chatbot.action.newChat", "welcome", { resetSession: true })],
  },
};

const STEP_INTENT: Partial<Record<string, ChatbotIntent>> = {
  "trip.root": "TRIP_ISSUES",
  "trip.nrt.q_online": "TRIP_ISSUES",
  "trip.nrt.q_location": "TRIP_ISSUES",
  "trip.nrt.q_network": "TRIP_ISSUES",
  "trip.nrt.q_suspended": "TRIP_ISSUES",
  "trip.nrt.q_lowperf": "TRIP_ISSUES",
  "trip.nrt.sol_offline": "TRIP_ISSUES",
  "trip.nrt.sol_location": "TRIP_ISSUES",
  "trip.nrt.sol_network": "TRIP_ISSUES",
  "trip.nrt.sol_suspended": "TRIP_ISSUES",
  "trip.nrt.sol_all_clear": "TRIP_ISSUES",
  "trip.disp.sol": "TRIP_ISSUES",
  "trip.disp.afterRefresh": "TRIP_ISSUES",
  "trip.wrong.sol": "TRIP_ISSUES",
  "trip.accept.sol": "TRIP_ISSUES",
  "combo.trip_perf.q": "TRIP_ISSUES",
  "combo.trip_perf.resolved": "TRIP_ISSUES",
  "wallet.root": "WALLET_ISSUES",
  "wallet.low.sol": "WALLET_ISSUES",
  "wallet.topup.hint": "WALLET_ISSUES",
  "wallet.re.q1": "WALLET_ISSUES",
  "wallet.re.pending": "WALLET_ISSUES",
  "wallet.re.app": "WALLET_ISSUES",
  "wallet.ded.sol": "WALLET_ISSUES",
  "wallet.neg.sol": "WALLET_ISSUES",
  "wallet.sus.combo": "WALLET_ISSUES",
  "perf.root": "PERFORMANCE_ISSUES",
  "perf.low.sol": "PERFORMANCE_ISSUES",
  "perf.drop.sol": "PERFORMANCE_ISSUES",
  "perf.missed.sol": "PERFORMANCE_ISSUES",
  "cancel.root": "CANCELLATION_ISSUES",
  "cancel.mistake.sol": "CANCELLATION_ISSUES",
  "cancel.break.sol": "CANCELLATION_ISSUES",
  "cancel.pen.sol": "CANCELLATION_ISSUES",
  "app.root": "APP_ISSUES",
  "app.crash.sol": "APP_ISSUES",
  "app.gps.sol": "APP_ISSUES",
  "app.net.sol": "APP_ISSUES",
  "app.login.sol": "APP_ISSUES",
  "acct.root": "ACCOUNT_ISSUES",
  "acct.verify.sol": "ACCOUNT_ISSUES",
  "acct.docs.sol": "ACCOUNT_ISSUES",
  "acct.phone.sol": "ACCOUNT_ISSUES",
  "other.root": "OTHER",
  "freeform_ack": "OTHER",
  "clarify.pickOption": "OTHER",
  "unresolved.soft": "OTHER",
  "unresolved.logged": "OTHER",
  "system.loop_guard": "OTHER",
  "trip_journey.welcome": "TRIP_ISSUES",
  "trip_journey.maps_nav": "TRIP_ISSUES",
  "trip_journey.cash_pay": "TRIP_ISSUES",
  "trip_journey.payment_app": "TRIP_ISSUES",
  "trip_journey.stuck": "TRIP_ISSUES",
};

const STEP_SUBINTENT: Partial<Record<string, string>> = {
  "trip.nrt.q_online": "not_receiving",
  "trip.disp.sol": "disappeared",
  "trip.wrong.sol": "wrong_assigned",
  "trip.accept.sol": "cannot_accept",
  "wallet.low.sol": "low_balance",
  "wallet.re.q1": "recharge_failed",
  "wallet.ded.sol": "payment_deducted",
  "wallet.neg.sol": "negative_balance",
  "perf.low.sol": "low_score",
  "perf.drop.sol": "sudden_drop",
  "perf.missed.sol": "missed_confusion",
  "cancel.mistake.sol": "cancel_mistake",
  "cancel.break.sol": "breakdown",
  "cancel.pen.sol": "penalty",
  "app.crash.sol": "crash",
  "app.gps.sol": "gps",
  "app.net.sol": "network",
  "app.login.sol": "login",
};

export const CHATBOT_INITIAL_STEP = "welcome";

export function getInitialFsmState(): ChatbotFsmState {
  return {
    step: CHATBOT_INITIAL_STEP,
    intent: null,
    subIntent: null,
    context: {},
    path: [],
    updatedAt: Date.now(),
  };
}

/** Start the FSM on a specific step (e.g. in-trip help root). Falls back to welcome if unknown. */
export function getFsmStateForStep(step: string): ChatbotFsmState {
  if (!STEP_DEFS[step]) return getInitialFsmState();
  return {
    step,
    intent: STEP_INTENT[step] ?? null,
    subIntent: STEP_SUBINTENT[step] ?? null,
    context: {},
    path: [],
    updatedAt: Date.now(),
  };
}

function countStepRepeats(path: string[], step: string): number {
  return path.filter((s) => s === step).length;
}

function subIntentForStep(step: string, prev: ChatbotFsmState): string | null {
  return STEP_SUBINTENT[step] ?? (step.startsWith("trip.nrt") ? "not_receiving" : prev.subIntent);
}

export type TransitionInput = {
  nextStepId: string;
  contextPatch?: Record<string, string>;
  resetSession?: boolean;
};

export function transitionFsm(prev: ChatbotFsmState, input: TransitionInput): ChatbotFsmState {
  if (input.resetSession || input.nextStepId === "welcome") {
    return { ...getInitialFsmState(), updatedAt: Date.now() };
  }

  const context = { ...prev.context, ...input.contextPatch };
  let step = input.nextStepId;
  const path = [...prev.path, step].slice(-MAX_PATH_LEN);

  if (countStepRepeats(path, step) >= MAX_REPEAT_STEP) {
    return {
      ...prev,
      step: "system.loop_guard",
      context,
      path,
      updatedAt: Date.now(),
    };
  }

  const intent = STEP_INTENT[step] ?? prev.intent;
  const subIntent = subIntentForStep(step, prev);

  return {
    step,
    intent,
    subIntent,
    context,
    path,
    updatedAt: Date.now(),
  };
}

/** Apply option from materialized payload (includes patch + reset). */
export function transitionFromOption(prev: ChatbotFsmState, opt: MaterializedOption): ChatbotFsmState {
  return transitionFsm(prev, {
    nextStepId: opt.value,
    contextPatch: opt.contextPatch,
    resetSession: opt.resetSession,
  });
}

export function getTurnForStep(stepId: string): ChatbotEngineTurn {
  const def = STEP_DEFS[stepId];
  if (!def) {
    return {
      textKey: "chatbot.fallback",
      options: [backMenu],
    };
  }
  return {
    textKey: def.textKey,
    textVars: def.textVars,
    options: def.options,
    allowFreeText: def.allowFreeText,
  };
}

export function getTurnForState(state: ChatbotFsmState): ChatbotEngineTurn {
  return getTurnForStep(state.step);
}

export type ChatbotTranslate = (path: string, vars?: Record<string, string | number>) => string;

export function materializeTurn(turn: ChatbotEngineTurn, state: ChatbotFsmState, t: ChatbotTranslate): MaterializedBotPayload {
  const vars = {
    ...turn.textVars,
    ...buildContextVars(state.context),
  };
  return {
    text: t(turn.textKey, vars),
    options: turn.options?.map((o) => ({
      label: t(o.labelKey),
      value: o.next,
      contextPatch: o.contextPatch,
      resetSession: o.resetSession,
    })),
    allowFreeText: turn.allowFreeText,
    stepId: state.step,
  };
}

function buildContextVars(ctx: Record<string, string>): Record<string, string | number> {
  const o = ctx["nrt.online"] === "no";
  const loc = ctx["nrt.location"] === "no";
  const net = ctx["nrt.network"] === "bad";
  const sus = ctx["nrt.suspended"] === "yes";
  const low = ctx["nrt.lowperf"] === "yes";
  return {
    hasOffline: o ? 1 : 0,
    hasLoc: loc ? 1 : 0,
    hasNet: net ? 1 : 0,
    hasSus: sus ? 1 : 0,
    hasLow: low ? 1 : 0,
    threshold: CHATBOT_PERF_THRESHOLD,
  };
}

export function handleFreeTextSubmission(prev: ChatbotFsmState, text: string): ChatbotFsmState {
  const trimmed = text.trim().slice(0, 2000);
  logChatbotIssue({
    intent: prev.intent,
    step: prev.step,
    subIntent: prev.subIntent,
    context: prev.context,
    text: trimmed,
  });
  bumpRepeatIssue(trimmed);
  return transitionFsm(prev, { nextStepId: "freeform_ack" });
}

/** When free text is sent but step disallows it — no state change to path, show clarify. */
export function handleDisallowedFreeText(prev: ChatbotFsmState, text: string): ChatbotFsmState {
  logChatbotIssue({
    intent: prev.intent,
    step: prev.step,
    subIntent: prev.subIntent,
    context: { ...prev.context, strayInput: "1" },
    text: text.trim().slice(0, 500),
  });
  const step = "clarify.pickOption";
  const path = [...prev.path, step].slice(-MAX_PATH_LEN);
  return { ...prev, step, path, updatedAt: Date.now() };
}

export function logChatbotIssue(payload: {
  intent: ChatbotIntent | null;
  step: string;
  subIntent?: string | null;
  context?: Record<string, string>;
  text?: string;
}): void {
  if (typeof window === "undefined") return;
  try {
    const entry = { ...payload, at: new Date().toISOString() };
    const raw = window.localStorage.getItem("liftngo-chatbot-issue-log");
    const prev = raw ? (JSON.parse(raw) as unknown[]) : [];
    const next = [entry, ...prev].slice(0, 50);
    window.localStorage.setItem("liftngo-chatbot-issue-log", JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

function bumpRepeatIssue(normalized: string): void {
  if (typeof window === "undefined" || normalized.length < 3) return;
  try {
    const key = "liftngo-chatbot-repeat";
    const raw = window.localStorage.getItem(key);
    const map = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    const k = normalized.slice(0, 80).toLowerCase();
    map[k] = (map[k] ?? 0) + 1;
    window.localStorage.setItem(key, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function getRepeatCountForText(text: string): number {
  if (typeof window === "undefined" || text.length < 3) return 0;
  try {
    const raw = window.localStorage.getItem("liftngo-chatbot-repeat");
    if (!raw) return 0;
    const map = JSON.parse(raw) as Record<string, number>;
    const k = text.slice(0, 80).toLowerCase();
    return map[k] ?? 0;
  } catch {
    return 0;
  }
}
