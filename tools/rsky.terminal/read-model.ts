// ============================================================
// READ MODEL — reduce(events by tradeId) -> journal schema row
// This is the ONLY place PLAN_SET + EXECUTE + EXIT are merged.
// The merge happens at read time, never at write time.
// ============================================================

import { readFile } from "fs/promises";
import { EngineEvent } from "./events.types";

// Shape mirrors rsky_trade_journal_schema_v1 fields.
// Optional until the corresponding event has landed —
// a trade with no EXIT yet is a valid, incomplete read-model row.
export interface JournalRow {
  tradeId: string;
  schemaVersion: "1.0";

  // core (from PLAN_SET)
  ticker?: string;
  direction?: "LONG" | "SHORT";
  entryPrice?: number;
  stopPrice?: number;
  targetPrice?: number;
  riskPct?: number;
  rrRatio?: number;
  patternClass?: string;
  thesis?: string;
  planTimeSecs?: number;
  timestampPlan?: number;

  // state machine (from EXECUTE)
  confirmLevel?: number;
  invalidLevel?: number;
  stateAtExecute?: "CONFIRMED";
  confirmTicksAtExecute?: number;
  feedAgreement?: "3/3" | "2/3" | "1/3" | "degraded";
  confidenceScore?: number;
  referencePriceAtExecute?: number;
  deltaFromConfirm?: number;
  latencySnapshot?: Record<string, number>;
  stateWindowSecs?: number;

  // execution (from EXECUTE, possibly patched async on fill)
  actualEntryPrice?: number;
  slippage?: number;
  timestampEntry?: number;
  executionVenue?: string;
  executionType?: "MANUAL" | "ENGINE";

  // outcome (from EXIT)
  result?: "WIN" | "LOSS" | "BREAKEVEN";
  exitPrice?: number;
  exitReason?: string;
  actualR?: number;
  mfe?: number;
  mae?: number;
  holdTimeSecs?: number;
  timestampExit?: number;

  // meta (from EXIT, optional)
  notes?: string;
  tags?: string[];
  marketRegime?: string;

  // read-model bookkeeping (not in schema, useful for debugging)
  _status: "PLANNED" | "EXECUTED" | "CLOSED";
  _eventsApplied: EngineEvent["type"][];
}

function reduceTrade(events: EngineEvent[]): JournalRow {
  const tradeId = events[0].tradeId;
  const row: JournalRow = {
    tradeId,
    schemaVersion: "1.0",
    _status: "PLANNED",
    _eventsApplied: [],
  };

  for (const ev of events.sort((a, b) => a.timestamp - b.timestamp)) {
    row._eventsApplied.push(ev.type);

    switch (ev.type) {
      case "PLAN_SET": {
        const { plan } = ev;
        Object.assign(row, {
          ticker: plan.ticker,
          direction: plan.direction,
          entryPrice: plan.entryPrice,
          stopPrice: plan.stopPrice,
          targetPrice: plan.targetPrice,
          riskPct: plan.riskPct,
          rrRatio: plan.rrRatio,
          patternClass: plan.patternClass,
          thesis: plan.thesis,
          confirmLevel: plan.confirmLevel,
          invalidLevel: plan.invalidLevel,
          planTimeSecs: ev.planTimeSecs,
          timestampPlan: ev.timestamp,
        });
        break;
      }
      case "EXECUTE": {
        Object.assign(row, {
          actualEntryPrice: ev.actualEntryPrice,
          executionVenue: ev.executionVenue,
          timestampEntry: ev.timestamp,
          executionType: ev.executionType,
        });
        if (ev.executionType === "ENGINE") {
          Object.assign(row, {
            stateAtExecute: ev.stateAtExecute,
            confirmTicksAtExecute: ev.confirmTicksAtExecute,
            feedAgreement: (ev as any).feedAgreement, // formatted at write time
            confidenceScore: ev.confidenceScore,
            referencePriceAtExecute: ev.referencePriceAtExecute,
            deltaFromConfirm: ev.deltaFromConfirm,
            latencySnapshot: ev.latencySnapshot,
            stateWindowSecs: ev.stateWindowSecs,
            slippage:
              ev.actualEntryPrice !== undefined
                ? ev.actualEntryPrice - ev.referencePriceAtExecute
                : undefined,
          });
        }
        row._status = "EXECUTED";
        break;
      }
      case "EXIT": {
        Object.assign(row, {
          result: ev.result,
          exitPrice: ev.exitPrice,
          exitReason: ev.exitReason,
          actualR: ev.actualR,
          mfe: ev.mfe,
          mae: ev.mae,
          holdTimeSecs: ev.holdTimeSecs,
          timestampExit: ev.timestamp,
          notes: ev.notes,
          tags: ev.tags,
          marketRegime: ev.marketRegime,
        });
        row._status = "CLOSED";
        break;
      }
    }
  }

  return row;
}

/** Load the full journal and reduce into per-trade rows. */
export async function loadJournal(
  journalPath = process.env.PROFIT_OS_JOURNAL_PATH ?? "./journal.jsonl"
): Promise<JournalRow[]> {
  let raw: string;
  try {
    raw = await readFile(journalPath, "utf8");
  } catch {
    return [];
  }

  const events: EngineEvent[] = raw
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));

  const byTrade = new Map<string, EngineEvent[]>();
  for (const ev of events) {
    const bucket = byTrade.get(ev.tradeId) ?? [];
    bucket.push(ev);
    byTrade.set(ev.tradeId, bucket);
  }

  return Array.from(byTrade.values()).map(reduceTrade);
}

/** Reconstruct a single trade by id without loading the whole file
 * into memory twice — still O(n) scan, but useful as the narrow API. */
export async function getTrade(
  tradeId: string,
  journalPath?: string
): Promise<JournalRow | null> {
  const all = await loadJournal(journalPath);
  return all.find((r) => r.tradeId === tradeId) ?? null;
}

/** CAL-only rows: only trades that reached EXECUTE or further. */
export async function loadCalibrationSet(
  journalPath?: string
): Promise<JournalRow[]> {
  const all = await loadJournal(journalPath);
  return all.filter((r) => r._status !== "PLANNED");
}
