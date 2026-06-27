verifier.md — Profit.OS

1. Purpose

The Verifier is the final validation layer in Profit.OS before any capital allocation, signal execution, or state mutation.

It ensures:

Signal integrity (no noise passing as edge)
Structural consistency (matches system rules)
Risk compliance (within defined exposure limits)
Data validity (freshness, correctness, coherence)
Cross-module agreement (no internal contradictions)

The Verifier does NOT generate signals.
It only answers:

“Is this safe, valid, and consistent enough to execute?”

2. Position in System Architecture
   Signal Engine → Insight Compiler → Pipeline → Verifier → Enforcement Kernel → Execution

If Verifier fails → system MUST halt execution.

If Verifier passes → Enforcement Kernel applies constraints and allows execution.

3. Input Schema

The Verifier accepts a structured object:

{
"signal_id": "string",
"asset": "BTC/USDT",
"direction": "long | short | neutral",
"entry_zone": [number, number],
"timeframe": "1m | 5m | 1h | 1d",
"confidence": 0.0 - 1.0,
"leverage": number,
"stop_loss": number,
"take_profit": [number],
"source_signals": ["string"],
"market_context": {
"trend": "bull | bear | chop",
"volatility": "low | medium | high",
"liquidity": "low | medium | high"
}
} 4. Verification Layers
Layer 1 — Structural Validation

Reject if:

Missing required fields
Invalid numeric ranges
Stop-loss absent
Entry zone malformed
Confidence outside [0,1]
Layer 2 — Market Logic Validation

Reject if:

Long signal in strong bearish regime (unless counter-trend flagged)
Short signal in strong bullish expansion phase without reversal structure
Entry far outside volatility range (>2σ without justification)
TP/SL ratio < 1.2:1 (default threshold)
Layer 3 — Risk Validation

Hard constraints:

Max leverage exceeded (config-dependent, default ≤ 5x)
Risk per trade > portfolio rule (default ≤ 1–2%)
Stop-loss too tight (noise zone)
Take-profit unrealistic vs volatility
Layer 4 — Signal Integrity Validation

Reject if:

Conflicting source signals (e.g., long + short simultaneously)
Confidence inflated without supporting structure
Signal derived from stale data (> threshold freshness window)
Duplicate signal already active in system
Layer 5 — Cross-System Consistency

Checks against:

memory-policy.md (historical constraints)
enforcement-kernel.md (risk rules)
insight-compiler.md (signal derivation consistency)

Reject if:

Violates stored behavioral constraints
Contradicts active positions
Breaks enforced risk regime state 5. Scoring Model (Optional Extension)

Each signal receives a verification score:

score =
structural_score (0–1) +
market_alignment (0–1) +
risk_compliance (0–1) +
signal_integrity (0–1) +
system_consistency (0–1)
Decision thresholds:
≥ 0.85 → PASS (execute allowed)
0.70–0.84 → WEAK PASS (reduce size or leverage)
< 0.70 → REJECT 6. Output Contract
PASS
{
"status": "PASS",
"signal_id": "string",
"adjustments": {
"leverage_cap": number,
"position_size_multiplier": number
},
"reason": "string"
}
REJECT
{
"status": "REJECT",
"signal_id": "string",
"failed_layers": ["risk", "market_logic"],
"reason": "string",
"critical_failure": true
}
WEAK PASS
{
"status": "WEAK_PASS",
"signal_id": "string",
"adjustments": {
"reduce_risk_by": "percentage",
"recommended_leverage": number
},
"reason": "string"
} 7. Rejection Taxonomy

Standardized failure reasons:

STRUCTURE_INVALID
RISK_LIMIT_EXCEEDED
MARKET_CONFLICT
INSUFFICIENT_CONFIDENCE_SUPPORT
STALE_DATA
DUPLICATE_SIGNAL
SYSTEM_CONFLICT 8. Interaction with Enforcement Kernel

Verifier decides validity
Enforcement Kernel decides execution constraints

Flow:

Verifier PASS → Enforcement applies position sizing, leverage caps
Verifier WEAK PASS → Enforcement forces risk reduction
Verifier REJECT → Execution blocked

Verifier cannot override Enforcement rules.

9. Hard Rules (Non-Negotiable)
   No execution without PASS or WEAK_PASS
   No bypass via confidence inflation
   No override from upstream modules
   No execution on stale or contradictory data
   Deterministic evaluation required (no randomness)
10. Design Philosophy

The Verifier is intentionally conservative.

It prefers:

missing opportunities > executing bad trades

Because Profit.OS assumes:

Capital preservation > aggression
Consistency > frequency
Structural edge > signal noise 11. Integration Hooks
Input: pipeline.md
Reference: memory-policy.md
Constraint source: enforcement-kernel.md
Signal origin: insight-compiler.md
Output target: execution engine / broker bridge
