// ============================================================
// TRADE EVENT STREAM — types only
// System 2 (low frequency, decision trace). NEVER mixed with
// tick/market data (System 1). See raw-tick-logger.ts for that.
// ============================================================

export type FeedSource = "jupiter" | "binance" | "coinbase";

export type PatternClass =
  | "Failed Breakdown"
  | "Breakout Retest"
  | "Support Bounce"
  | "Resistance Rejection"
  | "Liquidity Sweep"
  | "Trend Continuation"
  | "Range Expansion"
  | "Mean Reversion"
  | "Momentum Continuation"
  | "VWAP Reclaim"
  | "Indeterminate";

export type FeedAgreement = "3/3" | "2/3" | "1/3" | "degraded";

export type ExitReason =
  | "TARGET_HIT"
  | "STOP_HIT"
  | "MANUAL"
  | "TIMEOUT"
  | "INVALID_FIRED";

export type Result = "WIN" | "LOSS" | "BREAKEVEN";

// ---- TradePlan: the manual-input boundary -----------------
// Everything in here is human judgment. PLAN_SET structures
// and timestamps it — it does NOT automate it.
export interface TradePlan {
  ticker: string;
  direction: "LONG" | "SHORT";
  entryPrice: number;
  stopPrice: number;
  targetPrice: number;
  riskPct: number;
  rrRatio: number;
  patternClass: PatternClass;
  thesis: string; // <=10 words, execution-only trigger logic
  confirmLevel: number;
  invalidLevel: number;
}

// ---- Event 1: PLAN_SET -------------------------------------
export interface PlanSetEvent {
  type: "PLAN_SET";
  tradeId: string;
  timestamp: number; // -> timestampPlan
  planTimeSecs: number;
  plan: TradePlan;
}

// ---- Event 2: EXECUTE ----------------------------------------
// Decision-moment snapshot only. Engine speaks numbers;
// formatFeedAgreement() converts at the writer boundary, not here.
//
// EXECUTE has two distinct origins, never collapsed with PLAN_SET:
//   - executionType "MANUAL": fired by a UI click (rsky.trade.html).
//     No tick state machine was involved, so all CONFIRMED-state
//     fields (confirmTicksAtExecute, feedAgreement, latencySnapshot,
//     stateWindowSecs, stateAtExecute) are inapplicable and omitted —
//     not optional-but-empty, structurally absent.
//   - executionType "ENGINE": fired by the tick state machine's
//     CONFIRMED -> EXECUTE transition. All state-machine fields
//     are required in this path.
export type ExecuteEvent = ManualExecuteEvent | EngineExecuteEvent;

interface ExecuteEventBase {
  type: "EXECUTE";
  tradeId: string;
  timestamp: number; // -> timestampEntry

  // execution-venue fields, filled when fill confirmation lands
  // (may arrive async/slightly after EXECUTE; see note in README)
  actualEntryPrice?: number;
  executionVenue?: FeedSource | "other";
}

export interface ManualExecuteEvent extends ExecuteEventBase {
  executionType: "MANUAL";
  source: "ui";
}

export interface EngineExecuteEvent extends ExecuteEventBase {
  executionType: "ENGINE";
  source: "engine";

  referencePriceAtExecute: number;
  confirmLevel: number;
  deltaFromConfirm: number;

  confidenceScore: number;
  agreeCount: number; // raw engine number; writer formats -> feedAgreement

  latencySnapshot: Record<FeedSource, number>;

  confirmTicksAtExecute: number;
  stateWindowSecs: number;

  stateAtExecute: "CONFIRMED";
}

// ---- Event 3: EXIT --------------------------------------------
export interface ExitEvent {
  type: "EXIT";
  tradeId: string;
  timestamp: number; // -> timestampExit

  result: Result;
  exitPrice: number;
  exitReason: ExitReason;

  actualR: number;
  mfe: number;
  mae: number;
  holdTimeSecs: number;

  notes?: string;
  tags?: string[];
  marketRegime?: "risk-on" | "risk-off" | "neutral";
}

export type EngineEvent = PlanSetEvent | ExecuteEvent | ExitEvent;
