# insight-compiler.md

## Profit.OS — Insight Compiler Module

### 1. Purpose

The **Insight Compiler** is the cognitive transformation layer of Profit.OS.  
It converts raw inputs (market data, signals, logs, events, and execution feedback) into **structured, decision-ready insights**.

It is not a signal generator.  
It is not an analytics dashboard.

It is a **compression engine for meaning under uncertainty**.

---

### 2. Core Responsibility

The Insight Compiler performs four deterministic transformations:

1. **Noise → Signal Candidates**
   - Filter irrelevant or low-information data
   - Identify statistically or structurally meaningful changes

2. **Signal → Hypotheses**
   - Convert patterns into testable market hypotheses
   - Assign confidence ranges (not binary classification)

3. **Hypotheses → Decision Inputs**
   - Translate hypotheses into actionable decision primitives:
     - direction bias
     - risk posture
     - execution sensitivity

4. **Feedback → Learning Updates**
   - Compare expected vs actual outcomes
   - Update internal weighting of signal sources

---

### 3. Input Layer

The compiler accepts structured and unstructured inputs:

#### Market Data

- OHLCV candles
- Order book snapshots (if available)
- Volatility regimes
- Liquidity shifts

#### System Signals

- Strategy outputs (scalp, swing, macro)
- Risk engine alerts
- Position state

#### External Signals

- News events
- Macro releases
- Sentiment streams (optional / low trust by default)

#### Internal Memory

- Past trade outcomes
- Strategy performance history
- Known failure modes

---

### 4. Processing Pipeline

[Raw Inputs]
↓
[Normalization Layer]
↓
[Signal Extraction Engine]
↓
[Pattern Aggregation Layer]
↓
[Hypothesis Generator]
↓
[Confidence Scoring Model]
↓
[Insight Object Builder]
↓
[Decision Bus Output]

---

### 5. Insight Object Schema

Every output of the compiler must conform to a structured insight object:

```json
{
  "asset": "BTCUSDT",
  "timeframe": "5m",
  "insight_type": "momentum_shift | liquidity_event | regime_change | anomaly",
  "direction_bias": "bullish | bearish | neutral",
  "confidence": 0.0-1.0,
  "time_decay": "fast | medium | slow",
  "key_drivers": [
    "liquidity expansion",
    "volatility compression break"
  ],
  "invalidations": [
    "retest below VWAP",
    "volume collapse"
  ],
  "recommended_action_state": "observe | prepare | execute | avoid",
  "meta": {
    "data_quality": 0.0-1.0,
    "signal_confluence": 0.0-1.0,
    "regime_context": "trend | chop | reversal"
  }
}
6. Scoring Model

Each insight is scored along three independent axes:

6.1 Signal Strength
How strong is the underlying pattern?
Based on:
volume confirmation
volatility expansion
multi-timeframe alignment
6.2 Context Fit
Does the signal align with current regime?
Penalize:
counter-regime signals
isolated anomalies
6.3 Execution Viability
Can this be acted on reliably?
Includes:
liquidity conditions
spread conditions
slippage risk

Final confidence:

confidence = weighted(Signal Strength, Context Fit, Execution Viability)
7. Regime Awareness Layer

The compiler must always classify market state before issuing insights:

Trend Regime
directional continuation favored
Chop Regime
mean reversion favored
Transition Regime
low confidence, high volatility risk
Shock Regime
event-driven discontinuity

Regime misclassification is treated as a critical failure mode.

8. Anti-Noise Constraints

The compiler explicitly rejects:

single-candle signals without confirmation
low-volume breakouts
sentiment-only triggers
non-reproducible patterns
overfitted historical heuristics

Rule:

If it cannot survive repeated sampling across timeframes, it is not an insight.

9. Memory Integration

The Insight Compiler writes back into Profit.OS memory:

validated patterns → reinforce weight
failed hypotheses → decay weight
regime misreads → penalty adjustment

Memory is not passive storage.
It is a weight update system for future inference.

10. Output Interface

The compiler does NOT execute trades.

It outputs into:

Decision Engine
Risk Engine
Strategy Router

Allowed outputs:

insight objects
confidence maps
regime classifications
anomaly flags

Prohibited outputs:

direct execution orders
portfolio allocation changes
unmanaged trade triggers
11. Failure Modes

Critical risks:

Overfitting to recent volatility
Signal contamination from external noise
Regime lag (late classification)
False confluence inflation
Memory corruption (reinforcing bad trades)

Mitigation:

decay-based memory weighting
multi-timeframe validation
adversarial signal testing
12. Design Principle

The Insight Compiler does not predict markets.
It compresses uncertainty into structured decision space.

13. Dependency Map
Upstream:
Data ingestion layer
Signal generators
Market adapters
Downstream:
Decision Engine
Risk Engine
Execution Bridge
14. Evolution Path

Future upgrades:

probabilistic transformer model for signal fusion
reinforcement learning from trade outcomes
cross-asset correlation inference graph
real-time regime classifier (online learning)
15. Summary

The Insight Compiler is the translation layer between market chaos and structured decision logic.

It ensures that Profit.OS never acts on raw noise—only on compressed, validated, regime-aware insight objects.
```
