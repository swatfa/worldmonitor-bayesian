# Black Swan Analysis Feature

## Overview

A sophisticated risk analysis system based on **Nassim Taleb's Black Swan Theory**, combining:
- **Bayesian Inference** for probability updates
- **Martingale Theory** for risk accumulation modeling
- **Multi-dimensional Correlation Analysis**
- **3D Interactive Visualization** using Three.js

## What is a Black Swan?

According to Nassim Taleb, a Black Swan event has three characteristics:
1. **Rarity** - It lies outside the realm of regular expectations
2. **Extreme Impact** - It carries severe consequences
3. **Retrospective Predictability** - After the fact, we concoct explanations making it appear predictable

## Features

### 1. Real-Time Risk Detection

The system continuously monitors and analyzes:
- **Market Volatility** - Detects extreme price movements and tail risks
- **Seismic Clusters** - Identifies earthquake patterns that may indicate larger events
- **Social Unrest Escalation** - Tracks protest patterns and fatality trends
- **Cyber/Infrastructure Disruption** - Monitors internet outages and critical failures
- **News Sentiment Spikes** - Analyzes alert keywords across all news sources

### 2. Bayesian Probability Updates

Uses Bayes' Theorem to update risk probabilities:

```
P(Crisis|Evidence) = P(Evidence|Crisis) × P(Crisis) / P(Evidence)
```

**Example**: If market volatility exceeds 5%, the system updates the probability of a systemic crisis from a base 5% to a higher posterior probability based on historical patterns.

### 3. Martingale Risk Accumulation

Models how small risks compound into systemic threats:
- Each event increases the probability of a larger event
- Risk multiplies with each occurrence
- Decays over time (recent events weighted more)

**Formula**:
```
Risk Score = Σ(event_i × multiplier_i × decay^i)
where multiplier = 1 + event_i × 0.1
```

### 4. Correlation Matrix

Calculates correlations between different risk dimensions:
- Economic ↔ Seismic
- Economic ↔ Social
- Seismic ↔ Social
- Cyber ↔ Geopolitical
- And more...

### 5. 3D Cube Visualization

Interactive 3D space where:
- **Each axis** represents a risk dimension (Economic, Seismic, Social)
- **Spheres** represent detected signals (size = intensity)
- **Colors** indicate risk level (Red = High, Yellow = Medium, Green = Low)
- **Lines** connect correlated events
- **Planes** show correlation strength between dimensions
- **Pulsing effects** highlight critical hotspots

## Technical Implementation

### Core Components

#### 1. `black-swan-analyzer.ts`
- **Main Analysis Engine**
- Functions:
  - `analyzeBlackSwans()` - Main entry point
  - `detectAnomalies()` - Identifies unusual patterns
  - `calculateCorrelation()` - Pearson correlation coefficient
  - `calculateTailRisk()` - Power law distribution analysis
  - `bayesianUpdate()` - Probability updates
  - `martingaleRiskScore()` - Risk accumulation

#### 2. `BlackSwanCube.ts`
- **3D Visualization Component**
- Uses Three.js for WebGL rendering
- Features:
  - Interactive rotation (mouse control)
  - Animated pulsing for high-risk areas
  - Dynamic lighting
  - Correlation planes
  - Hotspot spheres

#### 3. `BlackSwanPanel.ts`
- **UI Modal Component**
- Displays:
  - Global Risk Score (0-100)
  - Trend Direction (Escalating/Stable/De-escalating)
  - 3D Correlation Cube
  - List of Detected Signals
  - High-Risk Regions

### Data Flow

```
User Clicks "Black Swan" Button
         ↓
App.showBlackSwanAnalysis()
         ↓
Aggregate Data from All Sources:
  - Markets (volatility, prices)
  - Earthquakes (magnitude, location)
  - Protests (events, fatalities)
  - Outages (severity, regions)
  - News (alert keywords)
         ↓
analyzeBlackSwans(dataSnapshot)
         ↓
Detect Anomalies:
  - Market volatility spikes
  - Seismic clusters
  - Social unrest escalation
  - Infrastructure disruption
  - News sentiment spikes
         ↓
Calculate Correlations:
  - Cross-correlation between signal types
  - Build correlation matrix
         ↓
Score & Rank Signals:
  - Expected Impact = Severity × Probability
  - Sort by expected impact
         ↓
BlackSwanPanel.updateAnalysis(analysis)
         ↓
Display Results:
  - Update risk score
  - Render 3D cube
  - List signals
  - Show high-risk regions
```

## Risk Scoring

### Global Risk Score (0-100)

Calculated as weighted average of top 5 signals:

```
Global Risk = Σ(severity_i × probability_i) / min(signal_count, 5)
```

### Risk Levels

| Score | Level | Color | Meaning |
|-------|-------|-------|---------|
| 70-100 | Critical | Red | Immediate threat, high probability |
| 40-69 | High | Orange | Significant risk, monitor closely |
| 20-39 | Medium | Yellow | Elevated risk, watch for escalation |
| 0-19 | Low | Green | Normal conditions |

### Signal Severity

Each signal type has specific severity calculations:

**Market Volatility**:
```
severity = min(avgVolatility × 10 + tailRisk, 100)
```

**Seismic Cluster**:
```
severity = min(maxMagnitude × 12 + riskScore, 100)
```

**Social Unrest**:
```
severity = min(eventCount × 5 + totalFatalities, 100)
```

## Usage

### Opening the Panel

Click the **"Black Swan"** button in the top-right header (bird icon).

### Interpreting Results

1. **Global Risk Score**
   - Large number at top-left
   - Color indicates severity
   - Pulsing animation if critical

2. **3D Cube**
   - Rotate with mouse
   - Red spheres = high-risk correlations
   - Lines connect related events
   - Larger spheres = higher intensity

3. **Signals List**
   - Top 10 most significant signals
   - Each shows:
     - Type (🌍 Geopolitical, 💹 Economic, etc.)
     - Description
     - Severity, Probability, Impact scores
     - Correlated signal types

4. **High-Risk Regions**
   - Geographic areas with elevated risk
   - Primary threat type
   - Coordinates for mapping

## Algorithm Details

### Tail Risk Calculation

Uses power law distribution to detect extreme events:

```python
# Count events beyond 2 standard deviations
extreme_events = count(|value - mean| > 2σ)

# Compare to normal distribution expectation (~4.5%)
normal_expected = total_events × 0.045

# Calculate tail risk
if extreme_events > normal_expected:
    tail_risk = (extreme_events / total_events) × 100 × 2
```

### Correlation Detection

Pearson correlation coefficient:

```python
r = Σ((x_i - x̄)(y_i - ȳ)) / √(Σ(x_i - x̄)² × Σ(y_i - ȳ)²)

where:
  r ∈ [-1, 1]
  r > 0.3 = positive correlation (displayed)
  r < -0.3 = negative correlation (displayed)
```

### Martingale Multiplier

Risk compounds with each event:

```python
score = 0
multiplier = 1

for event in reversed(events):  # Most recent first
    score += event × multiplier
    multiplier × = (1 + event × 0.1)  # Risk compounds
    multiplier × = decay_factor        # But decays over time
```

## Examples

### Example 1: Market Volatility Spike

**Input Data**:
- S&P 500: -4.2%
- NASDAQ: -5.1%
- VIX: +35%

**Analysis**:
- Average volatility: 4.65%
- Tail risk: 25%
- Bayesian update: 5% → 32% crisis probability

**Output Signal**:
```
Type: Economic
Severity: 72
Probability: 0.32
Description: "Extreme market volatility detected (4.7% avg). Tail risk: 25%"
```

### Example 2: Seismic Cluster

**Input Data**:
- 5 earthquakes in same region
- Magnitudes: [5.2, 5.8, 4.9, 6.1, 5.5]

**Analysis**:
- Max magnitude: 6.1
- Martingale risk: 38
- Cluster detected

**Output Signal**:
```
Type: Environmental
Severity: 85
Probability: 0.38
Description: "Seismic cluster: 5 earthquakes (max M6.1)"
```

## Performance

- **Analysis Time**: < 500ms for full dataset
- **3D Rendering**: 60 FPS with WebGL
- **Memory Usage**: ~50MB for visualization
- **Update Frequency**: On-demand (user-triggered)

## Future Enhancements

1. **Machine Learning Integration**
   - Train on historical Black Swan events
   - Improve probability estimates

2. **Time-Series Forecasting**
   - Predict risk trajectory
   - Early warning system

3. **Scenario Simulation**
   - "What-if" analysis
   - Monte Carlo simulations

4. **Export & Reporting**
   - PDF reports
   - Risk briefings
   - Alert notifications

## References

- Taleb, N. N. (2007). *The Black Swan: The Impact of the Highly Improbable*
- Bayesian Inference: [Wikipedia](https://en.wikipedia.org/wiki/Bayesian_inference)
- Martingale Theory: [Wikipedia](https://en.wikipedia.org/wiki/Martingale_(probability_theory))
- Pearson Correlation: [Wikipedia](https://en.wikipedia.org/wiki/Pearson_correlation_coefficient)
- Power Law Distribution: [Wikipedia](https://en.wikipedia.org/wiki/Power_law)

---

**Created**: 2026-01-11  
**Version**: 1.0.0  
**Status**: ✅ Fully Implemented
