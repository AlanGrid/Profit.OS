# memory-policy.md

## Overview

**Profit.OS Memory Policy** defines how the system records, retrieves, updates, and invalidates state across trading decisions, system components, and analytical outputs.

Memory is treated as a **first-class execution dependency**, not passive logging.

This policy applies to all components within :contentReference[oaicite:0]{index=0}.

---

## 1. Memory Model Layers

Profit.OS uses a 4-layer memory architecture:

### 1.1 Ephemeral Memory (Runtime)

- Lives during a single execution cycle
- Contains:
  - Live signals
  - Temporary calculations
  - API responses (market data, indicators)
- Automatically destroyed after pipeline completion

### 1.2 Working Memory (Session State)

- Persists during active analysis session
- Contains:
  - Current trade hypotheses
  - Signal confidence scoring
  - Active risk constraints
- Overwritten frequently

### 1.3 Structural Memory (System Knowledge)

- Long-lived system configuration
- Contains:
  - Strategy definitions
  - Risk models
  - Execution rules
  - Pipeline architecture decisions
- Requires explicit versioning

### 1.4 Audit Memory (Immutable Log)

- Append-only ledger
- Contains:
  - All decisions
  - All executed trades
  - Signal → decision mappings
- Never modified, only appended

---

## 2. Memory Write Rules

A write operation is only valid if it satisfies:

### 2.1 Signal Validity Gate

- Data must originate from:
  - Verified market feed
  - Internal deterministic computation
- No external subjective inputs allowed

### 2.2 Confidence Threshold

- Store only if:
  - Signal confidence ≥ system threshold
  - OR explicitly flagged as "research/experimental"

### 2.3 Structural Writes

Allowed only when:

- Explicit version bump is declared
- Change passes consistency validation against existing schema

---

## 3. Memory Read Rules

- Reads must be scoped:
  - By time window OR
  - By symbol OR
  - By strategy context
- Global unfiltered reads are forbidden in execution layer

Priority order:

1. Working Memory
2. Structural Memory
3. Audit Memory (for reconciliation only)

---

## 4. Update & Conflict Resolution

When conflicting memory entries exist:

### Rule 1 — Recency Dominance

- Newer validated signals override older ones

### Rule 2 — Confidence Override

- Higher confidence signal overrides lower confidence regardless of recency

### Rule 3 — Structural Lock

- Structural Memory overrides all runtime suggestions

### Rule 4 — Audit Integrity

- Audit Memory is never overridden
- Conflicts are appended as correction entries

---

## 5. Memory Immutability Rules

| Memory Type | Mutable | Delete Allowed | Notes              |
| ----------- | ------- | -------------- | ------------------ |
| Ephemeral   | Yes     | N/A            | Auto-destroyed     |
| Working     | Yes     | Partial        | Overwritten only   |
| Structural  | Limited | Versioned only | Never hard deleted |
| Audit       | No      | Never          | Append-only        |

---

## 6. Memory Retention Policy

- Ephemeral: minutes
- Working: session-bound
- Structural: indefinite (version controlled)
- Audit: permanent

No garbage collection applies to Audit Memory.

---

## 7. Memory Compression Strategy

To reduce redundancy:

- Merge similar signals within time window
- Aggregate repeated market states
- Store deltas instead of full snapshots when possible
- Preserve only:
  - First occurrence
  - Last occurrence
  - Extreme deviation points

---

## 8. Memory Integrity Checks

Every write cycle must pass:

- Schema validation
- Source verification
- Logical consistency check
- Cross-memory contradiction scan

If any check fails:

- Memory write is rejected
- Event is logged in audit trail

---

## 9. Memory Access Control (Logical)

- Signal Engine: read/write Working + Ephemeral
- Strategy Engine: read Structural + Working
- Execution Engine: read only validated Working snapshot
- Audit Layer: write-only

No component has unrestricted memory access.

---

## 10. Memory Failure Modes

### 10.1 Drift

- Working Memory diverges from Audit Memory
- Resolution: reconciliation job triggers revalidation

### 10.2 Contamination

- External or invalid data enters Working Memory
- Resolution: purge + rollback to last valid snapshot

### 10.3 Stale Structural State

- Strategy definitions outdated
- Resolution: forced version bump required

---

## 11. Example Memory Entry Schema

```json
{
  "timestamp": "ISO-8601",
  "type": "signal | decision | execution | config",
  "symbol": "BTCUSDT",
  "strategy": "scalp_v1",
  "confidence": 0.82,
  "state": {
    "price": 42000,
    "indicator_snapshot": {}
  },
  "decision": "ENTER_LONG",
  "risk": {
    "stop_loss": 41800,
    "take_profit": 42500
  }
}
```
