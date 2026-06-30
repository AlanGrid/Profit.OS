// ============================================================
// EVENT SINK — writeEvent + JSONL persistence
// Dumb append-only sink. No merging. No mutation. No schema
// knowledge beyond "this is a trade event, append it."
// ============================================================

import { appendFile } from "fs/promises";
import { EngineEvent } from "./events.types";

const JOURNAL_PATH = process.env.PROFIT_OS_JOURNAL_PATH ?? "./journal.jsonl";

/**
 * Single entry point for all trade-event persistence.
 * STATE MACHINE -> EVENT BUS -> writeEvent -> journal.jsonl
 *
 * This function does not branch on event.type beyond stamping
 * schemaVersion. It does not patch, does not look up existing
 * rows, does not merge. Each call is one immutable line.
 */
export async function writeEvent(event: EngineEvent): Promise<void> {
  const line = JSON.stringify({ schemaVersion: "1.0", ...event });
  await appendFile(JOURNAL_PATH, line + "\n", "utf8");
}

/**
 * formatFeedAgreement — the ONLY place engine numbers become
 * schema enum strings. Engine never speaks schema language;
 * this is the adapter boundary, called at write time only.
 */
export function formatFeedAgreement(
  agreeCount: number
): "3/3" | "2/3" | "1/3" | "degraded" {
  if (agreeCount >= 3) return "3/3";
  if (agreeCount === 2) return "2/3";
  if (agreeCount === 1) return "1/3";
  return "degraded";
}

/**
 * Convenience wrapper: takes a raw ExecuteEvent (engine numbers)
 * and writes it with feedAgreement formatted to schema enum.
 * Only applies to engine-sourced executes — manual UI executes
 * have no agreeCount to format and pass through unchanged.
 */
export async function writeExecuteEvent(
  event: import("./events.types").ExecuteEvent
): Promise<void> {
  if (event.executionType === "MANUAL") {
    await writeEvent(event);
    return;
  }
  const { agreeCount, ...rest } = event;
  await writeEvent({
    ...rest,
    feedAgreement: formatFeedAgreement(agreeCount),
  } as unknown as import("./events.types").EngineEvent);
}
