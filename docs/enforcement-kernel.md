enforcement-kernel.md

Profit.OS — Enforcement Kernel Specification

1. Purpose

The Enforcement Kernel (EK) is the deterministic control layer of Profit.OS.

Its role is to ensure that no decision, signal, or execution path can bypass system constraints related to:

Risk limits
Capital allocation rules
Strategy permissions
Data validity thresholds
Execution safety constraints

It acts as a hard gate between “decision” and “action.”

If the Decision Engine is the brain, the Enforcement Kernel is the reflexive nervous system that blocks unsafe impulses before they move capital.

2. Core Design Principles
   2.1 Determinism over intelligence

All enforcement outcomes must be:

Predictable
Replayable
Version-controlled

No probabilistic enforcement logic is allowed.

2.2 Fail-closed by default

If a rule cannot be evaluated:

❌ Default = BLOCK execution
Never default to allow
2.3 Stateless evaluation layer

The kernel itself:

Does not store portfolio state
Does not generate signals
Only evaluates inputs against rules + context snapshot
2.4 Layered enforcement

Enforcement occurs at 4 levels:

Signal-level validation
Decision-level validation
Portfolio-level validation
Execution-level firewall 3. System Positioning
Signal Engine → Decision Engine → ENFORCEMENT KERNEL → Execution Layer → Broker/API

The kernel is the final programmable gate before real-world action.

4. Core Architecture
   4.1 Components
   A. Rule Registry

Stores all enforceable constraints:

Risk rules
Position sizing rules
Asset restrictions
Time-based constraints
Strategy permissions

Rules are versioned and immutable per deployment cycle.

B. Constraint Evaluator

Evaluates:

input_context + rule_set → boolean decision

Outputs:

PASS
BLOCK
MODIFY (optional transformation allowed)
C. Policy Compiler

Converts human-readable policies into executable rule graphs.

Example:

"Max 2% risk per trade"
→ RiskRule(max_risk_pct=0.02)
D. Execution Firewall

Final gate before broker/API calls:

Validates order payload
Re-checks portfolio exposure
Enforces kill-switch conditions
E. Violation Logger

Stores:

Rule violated
Input state
Decision engine origin
Timestamp
Severity score

Feeds into Verifier system.

5. Rule Model
   5.1 Rule Structure
   {
   "rule_id": "RISK_MAX_EXPOSURE",
   "type": "portfolio_constraint",
   "scope": "global",
   "condition": "exposure_pct <= 0.25",
   "action": "BLOCK",
   "severity": "high",
   "version": "1.0.0"
   }
   5.2 Rule Types
1. Risk Rules
   Max drawdown
   Max exposure
   Position sizing caps
   Leverage limits
1. Strategy Rules
   Allowed strategies per asset class
   Time-window constraints
   Signal frequency throttling
1. Market Rules
   Volatility filters
   Liquidity thresholds
   Spread limits
1. Execution Rules
   Slippage bounds
   Order size constraints
   Broker-specific restrictions
1. Safety Rules
   Kill-switch triggers
   Circuit breakers
   Emergency flatten conditions
1. Enforcement Flow
   Step 1 — Input ingestion
   Decision Engine emits trade intent:
   {
   asset: BTCUSDT,
   size: 0.12,
   direction: LONG,
   confidence: 0.74
   }
   Step 2 — Context snapshot

Kernel pulls:

Portfolio exposure
Open positions
Risk metrics
Market conditions (cached snapshot)
Step 3 — Rule evaluation

Each rule is evaluated:

R1: exposure check → PASS
R2: volatility filter → PASS
R3: max position size → BLOCK
Step 4 — Decision aggregation
Rule Result Outcome
any BLOCK BLOCK EXECUTION
all PASS APPROVE
MODIFY transform payload
Step 5 — Execution gating

If approved:

Order sent to Execution Layer

If blocked:

Event logged
Signal optionally downgraded 7. Modification Mode (Advanced)

Some rules can transform actions instead of blocking.

Example:

Requested size: 10%
Rule: max size = 5%
Action: MODIFY → size = 5%

This enables:

Soft enforcement
Capital smoothing
Reduced signal loss 8. Kill Switch System

Hard override conditions:

Triggers:

Drawdown > threshold
API anomaly detection
Extreme volatility spike
Manual override flag

Behavior:

→ BLOCK ALL EXECUTION
→ FORCE FLATTEN (optional config)
→ LOCK SYSTEM STATE 9. Integration Points
9.1 Decision Engine
Sends trade intents
Receives allow/block/modification feedback
9.2 Verifier
Audits kernel decisions
Detects rule inefficiency or over-blocking
9.3 Memory Policy Layer
Supplies historical constraints
Stores rule evolution
9.4 Pipeline Layer
Ensures enforcement is applied before execution queue 10. Failure Modes
10.1 Rule bypass risk

Mitigation:

Hard separation between decision and execution layers
No shared memory write access
10.2 Rule explosion

Too many rules → latency increase
Mitigation:

Rule indexing
Pre-compilation into DAG
10.3 Conflicting rules

Resolution priority:

Safety rules (highest)
Risk rules
Execution rules
Strategy rules 11. Performance Requirements
Evaluation latency: < 5ms per trade intent
Throughput: 1,000+ evaluations/sec
Deterministic output under identical inputs 12. Observability

Kernel must expose:

Rule hit rate
Block frequency per rule
False-positive risk blocks (via Verifier feedback)
System-level enforcement stress index 13. Versioning

Rules are versioned:

EK_RULESET_v1.0.0
EK_RULESET_v1.1.0

Execution must always specify active ruleset hash:

enforcement_hash = SHA256(rule_bundle) 14. Summary

The Enforcement Kernel is not a helper system.

It is the hard boundary between intention and execution in Profit.OS.

Its job is simple:

Allow safe capital movement. Block everything else.
