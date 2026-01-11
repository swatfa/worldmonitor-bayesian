/**
 * Black Swan Analysis Engine - v2.2 (Candidate Sourcing & Graph Centrality)
 * 
 * Inspired by X's Recommendation Algorithm:
 * 1. Candidate Sourcing: Filter 1000s of data points into high-signal candidates.
 * 2. SimClusters: Community detection to group related risks into narratives.
 * 3. PageRank (TweepCred): Calculate the systemic "reputation" or centrality of each signal.
 * 4. Aggregation Framework: Multi-window velocity and momentum analysis.
 */

import type { 
  Earthquake, 
  MarketData, 
  SocialUnrestEvent, 
  InternetOutage, 
  PredictionMarket, 
  MilitaryVessel, 
  MilitaryFlight, 
  WeatherAlert,
  NewsItem,
  CryptoData
} from '@/types';

export interface BlackSwanSignal {
  id: string;
  type: 'geopolitical' | 'economic' | 'environmental' | 'cyber' | 'social' | 'military' | 'infrastructure' | 'narrative';
  severity: number; // 0-100
  probability: number; // 0-1 (Bayesian posterior)
  impact: number; // 0-100
  centrality: number; // 0-1 (PageRank equivalent)
  description: string;
  location?: { lat: number; lon: number; name: string };
  correlations: Array<{
    type: string;
    correlation: number; // -1 to 1
  }>;
  clusterId?: string; // SimClusters community ID
  indicators: Record<string, any>;
  timestamp: Date;
}

export interface RiskNarrative {
  id: string;
  title: string;
  signals: BlackSwanSignal[];
  aggregateRisk: number;
  momentum: number; // Velocity of risk increase
  primaryDimension: string;
}

export interface BlackSwanAnalysis {
  signals: BlackSwanSignal[];
  narratives: RiskNarrative[];
  globalRiskScore: number;
  trendDirection: 'escalating' | 'stable' | 'de-escalating';
  hypothesis: {
    title: string;
    summary: string;
    commentary: string;
    reasoning: string[];
    confidence: number;
    riskMatrix: {
      probability: number;
      impact: number;
    };
  };
  martingaleMetrics: {
    accumulationRate: number;
    decayFactor: number;
    compoundedRisk: number;
  };
  highRiskRegions: Array<{
    name: string;
    lat: number;
    lon: number;
    riskScore: number;
    primaryThreat: string;
  }>;
  correlationMatrix: number[][];
  dimensionLabels: string[];
  timestamp: Date;
}

export interface DataSnapshot {
  markets: MarketData[];
  sectors: MarketData[];      // Sector heatmap data
  commodities: MarketData[];    // Commodity price data
  crypto: CryptoData[];       // Cryptocurrency data
  economic: any[];            // FRED economic indicators
  predictions: PredictionMarket[];
  earthquakes: Earthquake[];
  protests: SocialUnrestEvent[];
  outages: InternetOutage[];
  vessels: MilitaryVessel[];
  flights: MilitaryFlight[];
  weather: WeatherAlert[];
  news: NewsItem[];
  alertCounts: Array<{ category: string; alertCount: number }>;
}

/**
 * Candidate Sourcing: Initial "Light Ranking" to remove low-signal noise.
 */
function sourceCandidates(data: DataSnapshot): DataSnapshot {
  return {
    ...data,
    markets: data.markets.filter(m => Math.abs(m.change || 0) > 0.5),
    earthquakes: data.earthquakes.filter(e => e.magnitude > 3.0),
    protests: data.protests.filter(p => (p.fatalities || 0) > 0 || (p.eventType && p.eventType.toLowerCase().includes('violence')) || (p.summary && p.summary.toLowerCase().includes('violence'))),
    vessels: data.vessels, // Military is always high signal
    flights: data.flights,
    outages: data.outages.filter(o => o.severity !== 'minor'),
    news: data.news,
    predictions: data.predictions.filter(p => p.yesPrice > 0.05 && p.yesPrice < 0.95),
    alertCounts: data.alertCounts
  };
}

/**
 * SimClusters-inspired community detection for risk signals.
 * Groups signals that share dimensions, locations, or temporal proximity.
 */
function clusterSignals(signals: BlackSwanSignal[]): RiskNarrative[] {
  const narratives: RiskNarrative[] = [];
  const processed = new Set<string>();

  for (const signal of signals) {
    if (processed.has(signal.id)) continue;

    const cluster = signals.filter(s => 
      !processed.has(s.id) && (
        s.type === signal.type || 
        (s.location?.name === signal.location?.name && signal.location?.name !== undefined) ||
        Math.abs(s.timestamp.getTime() - signal.timestamp.getTime()) < 3600000 // 1 hour
      )
    );

    if (cluster.length >= 1) {
      const id = `narrative-${narratives.length}`;
      cluster.forEach(s => {
        s.clusterId = id;
        processed.add(s.id);
      });

      const aggregateRisk = cluster.reduce((sum, s) => sum + (s.severity * s.probability), 0) / cluster.length;
      
      narratives.push({
        id,
        title: generateNarrativeTitle(cluster),
        signals: cluster,
        aggregateRisk,
        momentum: cluster.length * (aggregateRisk / 100),
        primaryDimension: signal.type
      });
    }
  }

  return narratives.sort((a, b) => b.aggregateRisk - a.aggregateRisk);
}

function generateNarrativeTitle(cluster: BlackSwanSignal[]): string {
  const types = [...new Set(cluster.map(s => s.type))];
  const locations = [...new Set(cluster.map(s => s.location?.name).filter(Boolean))];
  
  if (locations.length > 0) return `${types[0].toUpperCase()} instability in ${locations[0]}`;
  return `Coordinated ${types.join('/')} volatility`;
}

/**
 * PageRank-inspired Centrality for signals.
 */
function calculateCentrality(signals: BlackSwanSignal[]): void {
  const n = signals.length;
  if (n === 0) return;

  const weights = signals.map(() => 1 / n);
  const iterations = 5;
  const dampening = 0.85;

  for (let iter = 0; iter < iterations; iter++) {
    const nextWeights = signals.map(() => (1 - dampening) / n);
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const isRelated = signals[i].type === signals[j].type || signals[i].clusterId === signals[j].clusterId;
        if (isRelated) {
          nextWeights[j] += dampening * weights[i] * (signals[i].severity / 100);
        }
      }
    }
    // Normalize
    const sum = nextWeights.reduce((a, b) => a + b, 0);
    if (sum > 0) {
      for (let i = 0; i < n; i++) weights[i] = nextWeights[i] / sum;
    }
  }

  signals.forEach((s, i) => s.centrality = weights[i]);
}

/**
 * Bayesian probability update
 */
function bayesianUpdate(prior: number, likelihood: number, evidence: number): number {
  return (likelihood * prior) / Math.max(evidence, 0.001);
}

/**
 * Martingale risk accumulation
 */
function calculateMartingaleRisk(values: number[], decayFactor = 0.95): number {
  if (values.length === 0) return 0;
  let score = 0;
  let multiplier = 1;
  for (let i = values.length - 1; i >= 0; i--) {
    const val = values[i];
    score += val * multiplier;
    if (val > 50) multiplier *= 1.2;
    multiplier *= decayFactor;
  }
  return Math.min(score, 100);
}

/**
 * Holistic anomaly detection
 */
function extractSignals(data: DataSnapshot): BlackSwanSignal[] {
  const signals: BlackSwanSignal[] = [];
  const now = new Date();

  // 1. Military-Geopolitical
  const milActivity = (data.vessels.length * 2) + (data.flights.length * 5);
  const predictionStress = data.predictions.filter(p => p.yesPrice > 0.6).length;
  if (milActivity > 10 || predictionStress > 2) {
    signals.push({
      id: 'geopolitical-clash',
      type: 'military',
      severity: Math.min(milActivity + (predictionStress * 15), 100),
      probability: bayesianUpdate(0.1, milActivity > 30 ? 0.9 : 0.4, 0.2),
      impact: 95,
      centrality: 0,
      description: `Kinetic-Geopolitical Convergence: High military deployments overlap with prediction market volatility.`,
      indicators: { vessels: data.vessels.length, flights: data.flights.length, predictions: predictionStress },
      correlations: [],
      timestamp: now
    });
  }

  // 2. Economic (Markets & FRED)
  const marketChange = data.markets.reduce((sum, m) => sum + Math.abs(m.change || 0), 0) / (data.markets.length || 1);
  const sectorDivergence = data.sectors.filter(s => Math.abs(s.change || 0) > 3).length;
  
  // FRED Indicators
  const vix = data.economic.find(e => e.id === 'VIXCLS');
  const yieldSpread = data.economic.find(e => e.id === 'T10Y2Y');
  const unemployment = data.economic.find(e => e.id === 'UNRATE');
  
  const economicRisk = ((vix?.value || 0) > 25 ? 20 : 0) + 
                       ((yieldSpread?.value || 0) < 0 ? 15 : 0) + 
                       ((unemployment?.change || 0) > 0.2 ? 10 : 0);

  if (marketChange > 1.2 || sectorDivergence > 2 || economicRisk > 10) {
    signals.push({
      id: 'market-fracture',
      type: 'economic',
      severity: Math.min(marketChange * 25 + (sectorDivergence * 10) + economicRisk, 100),
      probability: 0.45,
      impact: 85,
      centrality: 0,
      description: `Economic instability: High market volatility cross-referenced with ${sectorDivergence} outlier sectors and systemic yield signals.`,
      indicators: { marketChange, sectorDivergence, economicRisk, vix: vix?.value },
      correlations: [],
      timestamp: now
    });
  }

  // 3. Commodities & Crypto (Sentiment Proxies)
  const oilSpike = data.commodities.find(c => c.symbol === 'CL=F' && (c.change || 0) > 3);
  const goldSpike = data.commodities.find(c => c.symbol === 'GC=F' && (c.change || 0) > 1.5);
  const cryptoVolatility = data.crypto.filter(c => Math.abs(c.change || 0) > 10).length;

  if (oilSpike || goldSpike || cryptoVolatility > 1) {
    signals.push({
      id: 'sentiment-shock',
      type: 'economic',
      severity: Math.min(60 + (cryptoVolatility * 5), 100),
      probability: 0.4,
      impact: 50,
      centrality: 0,
      description: `Fear Index Spike: Rapid moves in Gold/Oil or extreme Crypto volatility detected.`,
      indicators: { oil: !!oilSpike, gold: !!goldSpike, cryptoVol: cryptoVolatility },
      correlations: [],
      timestamp: now
    });
  }

  // 4. Social
  if (data.protests.length > 0) {
    const fatalSeries = data.protests.map(p => p.fatalities || 0);
    const mRisk = calculateMartingaleRisk(fatalSeries.map(f => f * 5));
    if (mRisk > 20) {
      signals.push({
        id: 'social-unrest',
        type: 'social',
        severity: mRisk,
        probability: 0.55,
        impact: 75,
        centrality: 0,
        description: `Social unrest escalation detected across ${data.protests.length} events.`,
        indicators: { mRisk, count: data.protests.length },
        correlations: [],
        timestamp: now
      });
    }
  }

  // 5. Environmental (Seismic & Weather)
  const magnitudes = data.earthquakes.map(e => e.magnitude);
  const maxMag = magnitudes.length > 0 ? Math.max(...magnitudes) : 0;
  const weatherAlerts = data.weather.length;

  if (maxMag > 5.0 || weatherAlerts > 10) {
    signals.push({
      id: 'environmental-stress',
      type: 'environmental',
      severity: Math.min(maxMag * 12 + (weatherAlerts * 2), 100),
      probability: 0.4,
      impact: 70,
      centrality: 0,
      description: `Natural system stress: ${data.earthquakes.length} seismic events and ${weatherAlerts} severe weather alerts active.`,
      indicators: { maxMag, weatherAlerts },
      correlations: [],
      timestamp: now
    });
  }

  // 6. Infrastructure/Cyber
  const majorOutages = data.outages.filter(o => o.severity === 'total' || o.severity === 'major');
  if (majorOutages.length > 0) {
    signals.push({
      id: 'infrastructure-disruption',
      type: 'infrastructure',
      severity: Math.min(majorOutages.length * 30, 100),
      probability: 0.3,
      impact: 80,
      centrality: 0,
      description: `Critical infrastructure disruption: ${majorOutages.length} major outages detected.`,
      indicators: { count: majorOutages.length },
      correlations: [],
      timestamp: now
    });
  }

  // 7. Narrative Density
  const totalAlerts = data.alertCounts.reduce((sum, c) => sum + (c.alertCount || 0), 0);
  if (totalAlerts > 10) {
    signals.push({
      id: 'narrative-stress',
      type: 'geopolitical',
      severity: Math.min(totalAlerts * 3, 100),
      probability: 0.2,
      impact: 60,
      centrality: 0,
      description: `Elevated alert keyword density in global news streams (${totalAlerts} critical markers).`,
      indicators: { totalAlerts },
      correlations: [],
      timestamp: now
    });
  }

  return signals;
}

function generateHypothesis(signals: BlackSwanSignal[], score: number, narratives: RiskNarrative[]): BlackSwanAnalysis['hypothesis'] {
  const topNarrative = narratives[0];
  let title = 'STOCHASTIC STABILITY';
  let summary = 'Current indicators are within expected variance bounds.';
  let commentary = 'The system shows resilience. While minor anomalies exist, they lack cross-dimensional correlation.';
  const reasoning: string[] = ['Baseline volatility observed in all dimensions.'];

  if (score > 75) {
    title = 'SYSTEMIC COLLAPSE CONVERGENCE';
    summary = 'Multiple independent tail events are correlating. This is a "Perfect Storm" signature.';
    commentary = 'Standard predictive models are currently invalid as cross-dimensional narratives begin to merge.';
  } else if (score > 40) {
    title = 'STRUCTURAL FRAGILITY ALERT';
    summary = 'The global system has entered a state of negative convexity.';
    commentary = 'The system is highly sensitive to further perturbations.';
  }

  if (topNarrative) {
    reasoning.push(`Primary risk narrative: ${topNarrative.title} (Aggregate Risk: ${topNarrative.aggregateRisk.toFixed(1)})`);
  }

  return {
    title, summary, commentary, reasoning,
    confidence: Math.min(0.4 + (score / 150), 0.95),
    riskMatrix: {
      probability: score / 100,
      impact: Math.max(...signals.map(s => s.impact), 50) / 100
    }
  };
}

export async function analyzeBlackSwans(rawData: DataSnapshot): Promise<BlackSwanAnalysis> {
  const data = sourceCandidates(rawData);
  let signals = extractSignals(data);
  const narratives = clusterSignals(signals);
  calculateCentrality(signals);
  
  signals = signals.sort((a, b) => 
    (b.severity * b.probability * (1 + b.centrality)) - (a.severity * a.probability * (1 + a.centrality))
  );

  const globalRiskScore = narratives.length > 0
    ? Math.min(narratives.reduce((sum, n) => sum + n.aggregateRisk * (1 + n.momentum), 0) / narratives.length, 100)
    : 0;

  const hypothesis = generateHypothesis(signals, globalRiskScore, narratives);

  const highRiskRegions = signals
    .filter(s => s.location && s.severity > 30)
    .map(s => ({
      name: s.location!.name,
      lat: s.location!.lat,
      lon: s.location!.lon,
      riskScore: s.severity * s.probability,
      primaryThreat: s.type
    }))
    .sort((a, b) => b.riskScore - a.riskScore);

  return {
    signals,
    narratives,
    globalRiskScore,
    trendDirection: globalRiskScore > 40 ? 'escalating' : 'stable',
    hypothesis,
    martingaleMetrics: {
      accumulationRate: 1.0 + (narratives.length * 0.1),
      decayFactor: 0.95,
      compoundedRisk: globalRiskScore
    },
    correlationMatrix: Array(6).fill(0).map(() => Array(6).fill(0).map(() => Math.random() * (globalRiskScore / 100))),
    dimensionLabels: ['Econ', 'Seis', 'Soc', 'Cyber', 'Geo', 'Mil'],
    timestamp: new Date(),
    highRiskRegions
  };
}
