/**
 * Black Swan Analysis Panel
 * 
 * Embedded side panel that displays:
 * - 3D correlation cube visualization
 * - Advanced signal detection metrics
 * - Global risk score & trend
 * - Geographic high-risk regions
 */

import { BlackSwanCube, type CubeVisualizationData } from './BlackSwanCube';
import type { BlackSwanAnalysis, BlackSwanSignal } from '../services/black-swan-analyzer';

export class BlackSwanPanel {
  private container: HTMLElement;
  private cube: BlackSwanCube | null = null;
  private analysis: BlackSwanAnalysis | null = null;
  
  constructor(containerId: string) {
    this.container = document.getElementById(containerId) || document.body;
    this.renderInitialState();
  }
  
  private renderInitialState(): void {
    this.container.innerHTML = `
      <div class="black-swan-panel">
        <div class="panel-header">
          <div class="panel-header-left">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" class="swan-icon">
              <path d="M22,8c0,3-1.5,4.5-3,6c-1.5,1.5-2,2.5-2,4v1h-2v-1c0-2,1-3.5,2.5-5S22,11,22,8c0-2.5-1-4-2.5-4.5 c-0.5,1.5-1.5,2.5-2.5,2.5c-1,0-2-0.5-2.5-1.5C14,3.5,14,2.5,14,2c0-0.5,0-1,0.5-1.5C13.5,0.5,12.5,0,11,0C9.5,0,8.5,0.5,7.5,1.5 C8,2,8,2.5,8,3c0,0.5,0,1.5-0.5,2.5C7,6.5,6,7,5,7c-1,0-2-1-2.5-2.5C1,5,0,6.5,0,9c0,3,1.5,4.5,3,6c1.5,1.5,2,2.5,2,4v1h2v-1 c0-2-1-3.5-2.5-5S0,12,0,9c0-2.5,1-4,2.5-4.5C3,6,4,7,5,7c1,0,1.5-0.5,2-1.5C7.5,4.5,8,3.5,8,2.5C8,2,8,1.5,7.5,1 C8.5,0.5,9.5,0,11,0c1.5,0,2.5,0.5,3.5,1C14,1.5,14,2,14,2.5c0,1,0.5,2,1,3c0.5,1,1,1.5,2,1.5c1,0,2-1,2.5-2.5C21,5,22,6.5,22,8z M12,10c-0.5,0-1,0.5-1,1v9c0,0.5,0.5,1,1,1s1-0.5,1-1v-9C13,10.5,12.5,10,12,10z"/>
            </svg>
            <span class="panel-title">Black Swan Analysis</span>
          </div>
          <div class="panel-header-right">
            <span class="scanning-indicator">SCANNING...</span>
          </div>
        </div>
        
        <div class="black-swan-scroll-container">
          <div class="risk-dashboard">
            <div class="risk-gauge-container">
              <div class="risk-value" id="globalRiskScore">--</div>
              <div class="risk-label">Systemic Risk</div>
              <div class="risk-trend" id="riskTrend">Initializing...</div>
            </div>
            <div class="hypothesis-summary" id="hypothesisSummary">
              <div class="hyp-title" id="hypothesisTitle">CALIBRATING...</div>
              <div class="hyp-text" id="hypothesisText">Aggregating multi-source data streams for Bayesian inference.</div>
              <div class="hyp-commentary" id="hypothesisCommentary"></div>
            </div>
          </div>

          <div class="analysis-grid">
            <div class="analysis-section martingale-section">
              <div class="section-header">
                <span class="section-title">MARTINGALE RISK ACCUMULATION</span>
              </div>
              <div class="martingale-stats">
                <div class="m-stat">
                  <span class="m-label">ACCUMULATION</span>
                  <span class="m-value" id="accumulationRate">--</span>
                </div>
                <div class="m-stat">
                  <span class="m-label">DECAY FACTOR</span>
                  <span class="m-value" id="decayFactor">--</span>
                </div>
                <div class="m-stat">
                  <span class="m-label">COMPOUNDED</span>
                  <span class="m-value" id="compoundedRisk">--</span>
                </div>
              </div>
            </div>

            <div class="analysis-section bayesian-section">
              <div class="section-header">
                <span class="section-title">BAYESIAN PROBABILITY MAP</span>
              </div>
              <div class="hyp-reasoning" id="hypothesisReasoning"></div>
            </div>
          </div>

          <div class="viz-container">
            <div class="black-swan-cube-container" id="blackSwanCubeContainer">
              <div class="viz-overlay">
                <div class="viz-title">3D CORRELATION MATRIX</div>
                <div class="viz-subtitle">Drag to rotate • Scroll to zoom</div>
              </div>
            </div>
          </div>

          <div class="analysis-section">
            <div class="section-header">
              <span class="section-title">RISK NARRATIVES (SimClusters)</span>
              <span class="signal-count" id="narrativeCount">0 detected</span>
            </div>
            <div class="narratives-list" id="narrativesList">
              <div class="loading-placeholder">Detecting cross-dimensional clusters...</div>
            </div>
          </div>

          <div class="analysis-section">
            <div class="section-header">
              <span class="section-title">CENTRALITY SIGNALS (PageRank)</span>
              <span class="signal-count" id="signalCount">0 detected</span>
            </div>
            <div class="signals-list" id="signalsList">
              <div class="loading-placeholder">Calculating systemic influence...</div>
            </div>
          </div>

          <div class="analysis-section">
            <div class="section-header">
              <span class="section-title">GEOSPATIAL HOTSPOTS</span>
            </div>
            <div class="regions-list" id="regionsList">
              <div class="loading-placeholder">Analyzing geographic clusters...</div>
            </div>
          </div>
        </div>
        
        <div class="panel-footer">
          <div class="footer-timestamp" id="lastAnalysisTime">Last Update: --:--:--</div>
          <div class="footer-brand">CYBER-INTEL ENGINE v2.0</div>
        </div>
      </div>
    `;
  }
  
  public show(): void {
    // Already rendered in side-bar, just ensure it's visible if hidden
    const section = document.getElementById('blackSwanSection');
    if (section) section.classList.remove('hidden');
    
    // Initialize 3D cube
    requestAnimationFrame(() => {
      const container = this.container.querySelector('#blackSwanCubeContainer') as HTMLElement;
      if (container && !this.cube) {
        try {
          this.cube = new BlackSwanCube(container);
          
          // Initial data if available
          if (this.analysis) {
            this.updateAnalysis(this.analysis);
          } else {
            // Show scanning state if no analysis yet
            const dummyAnalysis: any = {
              globalRiskScore: 0,
              trendDirection: 'stable',
              signals: [],
              highRiskRegions: [],
              correlationMatrix: Array(6).fill(0).map(() => Array(6).fill(0)),
              dimensionLabels: ['Economic', 'Seismic', 'Social', 'Cyber', 'Geopolitical', 'Market Fear']
            };
            this.updateAnalysis(dummyAnalysis);
          }
        } catch (error) {
          console.error('[Black Swan] 3D Viz failed:', error);
        }
      }
    });
  }
  
  public hide(): void {
    const section = document.getElementById('blackSwanSection');
    if (section) section.classList.add('hidden');
  }
  
  public updateAnalysis(analysis: BlackSwanAnalysis): void {
    this.analysis = analysis;
    
    // Stop scanning indicator
    const scanningEl = this.container.querySelector('.scanning-indicator') as HTMLElement;
    if (scanningEl) scanningEl.style.display = 'none';
    
    // Update score
    const riskScoreEl = this.container.querySelector('#globalRiskScore') as HTMLElement;
    const score = Math.round(analysis.globalRiskScore);
    riskScoreEl.textContent = score.toString();
    riskScoreEl.className = 'risk-value ' + this.getRiskClass(score);
    
    // Update trend
    const trendEl = this.container.querySelector('#riskTrend') as HTMLElement;
    const trendIcons: Record<string, string> = {
      'escalating': '▲ ESCALATING',
      'stable': '■ STABLE',
      'de-escalating': '▼ DE-ESCALATING',
    };
    trendEl.textContent = trendIcons[analysis.trendDirection] || 'ANALYZING';
    trendEl.className = 'risk-trend ' + analysis.trendDirection;
    
    // Update cube
    if (this.cube) {
      this.cube.updateData(this.prepareCubeData(analysis));
    }
    
    // Update counts
    const countEl = this.container.querySelector('#signalCount') as HTMLElement;
    countEl.textContent = `${analysis.signals.length} detected`;
    
    const narrCountEl = this.container.querySelector('#narrativeCount') as HTMLElement;
    if (narrCountEl) narrCountEl.textContent = `${analysis.narratives?.length || 0} clusters`;
    
    // Update timestamp
    const timeEl = this.container.querySelector('#lastAnalysisTime') as HTMLElement;
    timeEl.textContent = `Last Update: ${new Date().toLocaleTimeString()}`;
    
    // Update Hypothesis
    if (analysis.hypothesis) {
      const hypTitle = this.container.querySelector('#hypothesisTitle') as HTMLElement;
      const hypText = this.container.querySelector('#hypothesisText') as HTMLElement;
      const hypCommentary = this.container.querySelector('#hypothesisCommentary') as HTMLElement;
      const hypReasoning = this.container.querySelector('#hypothesisReasoning') as HTMLElement;

      hypTitle.textContent = analysis.hypothesis.title;
      hypText.textContent = analysis.hypothesis.summary;
      hypCommentary.textContent = analysis.hypothesis.commentary;
      
      hypReasoning.innerHTML = (analysis.hypothesis.reasoning || []).map(r => `
        <div class="hyp-point">▶ ${r}</div>
      `).join('');

      // Confidence indicator
      const footerBrand = this.container.querySelector('.footer-brand') as HTMLElement;
      footerBrand.textContent = `CONFIDENCE: ${(analysis.hypothesis.confidence * 100).toFixed(1)}%`;
    }

    // Update Martingale Metrics
    if (analysis.martingaleMetrics) {
      const accRate = this.container.querySelector('#accumulationRate') as HTMLElement;
      const decay = this.container.querySelector('#decayFactor') as HTMLElement;
      const compounded = this.container.querySelector('#compoundedRisk') as HTMLElement;

      accRate.textContent = analysis.martingaleMetrics.accumulationRate.toFixed(2) + 'x';
      decay.textContent = analysis.martingaleMetrics.decayFactor.toFixed(2);
      compounded.textContent = Math.round(analysis.martingaleMetrics.compoundedRisk).toString();
    }

    // Render lists
    this.renderNarratives(analysis.narratives || []);
    this.renderSignals(analysis.signals);
    this.renderRegions(analysis.highRiskRegions);
  }

  private renderNarratives(narratives: any[]): void {
    const container = this.container.querySelector('#narrativesList') as HTMLElement;
    if (!container) return;
    
    if (narratives.length === 0) {
      container.innerHTML = '<div class="no-data">NO COHERENT NARRATIVES</div>';
      return;
    }

    container.innerHTML = narratives.slice(0, 5).map(n => `
      <div class="narrative-card">
        <div class="narrative-header">
          <span class="narrative-title">${n.title}</span>
          <span class="narrative-momentum">VEL: ${n.momentum.toFixed(1)}x</span>
        </div>
        <div class="narrative-meta">
          <span>Signals: ${n.signals.length}</span>
          <span>Risk: ${n.aggregateRisk.toFixed(1)}</span>
        </div>
      </div>
    `).join('');
  }
  
  private prepareCubeData(analysis: BlackSwanAnalysis): CubeVisualizationData {
    const hotspots = analysis.signals.slice(0, 20).map((signal) => {
      const typeMap: Record<string, [number, number, number]> = {
        'economic': [0.8, 0.2, 0.5],
        'environmental': [0.2, 0.8, 0.5],
        'social': [0.5, 0.5, 0.8],
        'cyber': [0.8, 0.8, 0.2],
        'geopolitical': [0.5, 0.2, 0.2],
        'military': [0.9, 0.1, 0.1],
        'infrastructure': [0.1, 0.9, 0.9]
      };
      
      const basePos = typeMap[signal.type] || [0.5, 0.5, 0.5];
      const variation = 0.15;
      
      return {
        x: Math.max(0, Math.min(1, basePos[0] + (Math.random() - 0.5) * variation)),
        y: Math.max(0, Math.min(1, basePos[1] + (Math.random() - 0.5) * variation)),
        z: Math.max(0, Math.min(1, basePos[2] + (Math.random() - 0.5) * variation)),
        intensity: (signal.severity * signal.probability * (1 + signal.centrality)) / 100,
        label: signal.description,
      };
    });
    
    return {
      correlationMatrix: analysis.correlationMatrix,
      labels: analysis.dimensionLabels,
      hotspots,
    };
  }
  
  private renderSignals(signals: BlackSwanSignal[]): void {
    const container = this.container.querySelector('#signalsList') as HTMLElement;
    if (signals.length === 0) {
      container.innerHTML = '<div class="no-data">NO ANOMALIES DETECTED</div>';
      return;
    }
    
    container.innerHTML = signals.slice(0, 10).map(signal => {
      const score = Math.round(signal.severity * signal.probability);
      const centralityScore = Math.round(signal.centrality * 100);
      return `
        <div class="signal-card">
          <div class="signal-main">
            <div class="signal-score ${this.getRiskClass(score)}">${score}</div>
            <div class="signal-info">
              <div class="signal-type">${signal.type.toUpperCase()} | CENTRALITY: ${centralityScore}%</div>
              <div class="signal-desc">${signal.description}</div>
            </div>
          </div>
          <div class="signal-bar">
            <div class="bar-fill ${this.getRiskClass(score)}" style="width: ${score}%"></div>
          </div>
        </div>
      `;
    }).join('');
  }
  
  private renderRegions(regions: BlackSwanAnalysis['highRiskRegions']): void {
    const container = this.container.querySelector('#regionsList') as HTMLElement;
    if (regions.length === 0) {
      container.innerHTML = '<div class="no-data">GEOSPATIAL STABLE</div>';
      return;
    }
    
    container.innerHTML = regions.map(region => {
      const score = Math.round(region.riskScore);
      return `
        <div class="region-card">
          <div class="region-header">
            <span class="region-title">${region.name}</span>
            <span class="region-val ${this.getRiskClass(score)}">${score}</span>
          </div>
          <div class="region-meta">
            <span>THR: ${region.primaryThreat.toUpperCase()}</span>
            <span>LOC: ${region.lat.toFixed(1)}, ${region.lon.toFixed(1)}</span>
          </div>
        </div>
      `;
    }).join('');
  }
  
  private getRiskClass(score: number): string {
    if (score >= 75) return 'critical';
    if (score >= 50) return 'high';
    if (score >= 25) return 'medium';
    return 'low';
  }
  
  public destroy(): void {
    if (this.cube) {
      this.cube.destroy();
      this.cube = null;
    }
  }
}
