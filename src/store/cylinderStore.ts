import { create } from 'zustand';
import {
  Needle,
  PatternScheme,
  Warning,
  SimulationStats,
  CylinderStore,
  HIGH_RISK_THRESHOLD,
  DEFAULT_TOTAL_NEEDLES,
  DEFAULT_PATTERN_PERIOD,
  DEFAULT_BASE_TENSION,
  DEFAULT_ROTATION_SPEED,
  MIN_TENSION,
  MAX_TENSION,
  MIN_SPEED,
  MAX_SPEED,
  WARNING_TENSION_HIGH,
  WARNING_SPEED_HIGH,
  WARNING_DISABLED_NEEDLE_RATIO,
  CRITICAL_RISK_THRESHOLD,
  YarnFeederConfig,
  YarnPathPoint,
  YarnPathSegment,
  YarnSimulationStats,
  YarnSimulationFrame,
  YarnDeliveryStats,
  StretchPeak,
  WearZone,
  YarnBreakWarning,
  YarnAnalysisResult,
  DEFAULT_YARN_LENGTH,
  DEFAULT_FRICTION,
  DEFAULT_GUIDE_ANGLE,
  WARNING_STRETCH_THRESHOLD,
  CRITICAL_STRETCH_THRESHOLD,
  WARNING_FLUCTUATION_PERCENT,
  CRITICAL_FLUCTUATION_PERCENT,
  WARNING_WEAR_LEVEL,
  CRITICAL_WEAR_LEVEL,
  WARNING_BREAK_RISK,
  CRITICAL_BREAK_RISK,
  MAX_YARN_FEEDERS,
  YARN_FEEDER_COLORS,
} from '@/types/cylinder';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function generateNeedles(count: number, baseTension: number): Needle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    enabled: true,
    tension: clamp(baseTension + (Math.random() - 0.5) * 20, MIN_TENSION, MAX_TENSION),
  }));
}

function createDefaultFeeders(): YarnFeederConfig[] {
  return [
    {
      id: generateId(),
      name: '主送纱嘴',
      position: 0,
      yarnLength: DEFAULT_YARN_LENGTH,
      guideAngle: DEFAULT_GUIDE_ANGLE,
      frictionCoefficient: DEFAULT_FRICTION,
      color: YARN_FEEDER_COLORS[0],
      enabled: true,
    },
  ];
}

function createDefaultScheme(): PatternScheme {
  const now = Date.now();
  return {
    id: generateId(),
    name: '默认方案',
    createdAt: now,
    updatedAt: now,
    totalNeedles: DEFAULT_TOTAL_NEEDLES,
    needles: generateNeedles(DEFAULT_TOTAL_NEEDLES, DEFAULT_BASE_TENSION),
    patternPeriod: DEFAULT_PATTERN_PERIOD,
    baseTension: DEFAULT_BASE_TENSION,
    rotationSpeed: DEFAULT_ROTATION_SPEED,
    yarnFeeders: createDefaultFeeders(),
    description: '系统默认初始化方案',
  };
}

const defaultScheme = createDefaultScheme();

function calculateYarnPath(
  feeder: YarnFeederConfig,
  needles: Needle[],
  totalNeedles: number,
  rotation: number,
  baseTension: number,
  radius: number = 200
): YarnPathSegment[] {
  const segments: YarnPathSegment[] = [];
  const enabledNeedles = needles.filter(n => n.enabled);
  if (enabledNeedles.length === 0) return segments;

  const feederAngle = (feeder.position / totalNeedles) * Math.PI * 2 + rotation;
  const feederX = Math.cos(feederAngle) * (radius + 60);
  const feederY = Math.sin(feederAngle) * (radius + 60);

  let prevPoint: YarnPathPoint | null = {
    needleId: -1,
    x: feederX,
    y: feederY,
    tension: baseTension,
    stretch: 0,
    wearLevel: 0,
    angle: feederAngle,
  };

  const startIndex = Math.floor(feeder.position) % totalNeedles;
  const orderedNeedles: Needle[] = [];
  for (let i = 0; i < totalNeedles; i++) {
    const idx = (startIndex + i) % totalNeedles;
    if (needles[idx].enabled) {
      orderedNeedles.push(needles[idx]);
    }
  }

  const angleRad = (feeder.guideAngle * Math.PI) / 180;
  let cumulativeTension = baseTension;

  for (let i = 0; i < orderedNeedles.length; i++) {
    const needle = orderedNeedles[i];
    const needleAngle = (needle.id / totalNeedles) * Math.PI * 2 + rotation;
    const x = Math.cos(needleAngle) * radius;
    const y = Math.sin(needleAngle) * radius;

    const dx = prevPoint ? x - prevPoint.x : x - feederX;
    const dy = prevPoint ? y - prevPoint.y : y - feederY;
    const segmentLength = Math.sqrt(dx * dx + dy * dy);

    const angleAdjustment = Math.cos(angleRad);
    const frictionFactor = 1 + feeder.frictionCoefficient * (i / Math.max(1, orderedNeedles.length));
    const tensionVariation = (needle.tension - baseTension) * 0.5 * frictionFactor / angleAdjustment;
    cumulativeTension = clamp(cumulativeTension + tensionVariation, MIN_TENSION, MAX_TENSION);

    const nominalLength = feeder.yarnLength / Math.max(1, orderedNeedles.length);
    const stretchRatio = segmentLength > 0 ? ((segmentLength - nominalLength) / nominalLength) * 100 : 0;

    const wearLevel = feeder.frictionCoefficient * 100 * (1 + Math.abs(stretchRatio) / 20);

    const currentPoint: YarnPathPoint = {
      needleId: needle.id,
      x,
      y,
      tension: cumulativeTension,
      stretch: clamp(stretchRatio, -30, 50),
      wearLevel: clamp(wearLevel, 0, 100),
      angle: needleAngle,
    };

    if (prevPoint) {
      const segment: YarnPathSegment = {
        from: prevPoint,
        to: currentPoint,
        length: segmentLength,
        tensionVariation: Math.abs(cumulativeTension - prevPoint.tension),
        stretchRatio: Math.abs(stretchRatio),
        wearRisk: wearLevel,
      };
      segments.push(segment);
    }

    prevPoint = currentPoint;
  }

  if (segments.length > 0 && prevPoint) {
    const dx = feederX - prevPoint.x;
    const dy = feederY - prevPoint.y;
    const returnLength = Math.sqrt(dx * dx + dy * dy);
    segments.push({
      from: prevPoint,
      to: { needleId: -1, x: feederX, y: feederY, tension: baseTension, stretch: 0, wearLevel: 0, angle: feederAngle },
      length: returnLength,
      tensionVariation: Math.abs(baseTension - prevPoint.tension),
      stretchRatio: 0,
      wearRisk: feeder.frictionCoefficient * 50,
    });
  }

  return segments;
}

function calculateDeliveryStats(
  segments: YarnPathSegment[],
  baseTension: number,
  yarnLength: number
): YarnDeliveryStats {
  if (segments.length === 0) {
    return { fluctuation: 0, fluctuationPercent: 0, avgDeliveryRate: 0, maxDeliveryRate: 0, minDeliveryRate: 0 };
  }

  const totalLength = segments.reduce((sum, s) => sum + s.length, 0);
  const deliveryRates = segments.map(s => s.length);
  
  const avgRate = deliveryRates.reduce((a, b) => a + b, 0) / deliveryRates.length;
  const variance = deliveryRates.reduce((sum, r) => sum + Math.pow(r - avgRate, 2), 0) / deliveryRates.length;
  const stdDev = Math.sqrt(variance);
  
  const fluctuationPercent = totalLength > 0 ? (stdDev / avgRate) * 100 : 0;
  const maxRate = Math.max(...deliveryRates);
  const minRate = Math.min(...deliveryRates);

  return {
    fluctuation: stdDev,
    fluctuationPercent: clamp(fluctuationPercent, 0, 100),
    avgDeliveryRate: avgRate,
    maxDeliveryRate: maxRate,
    minDeliveryRate: minRate,
  };
}

function detectStretchPeaks(segments: YarnPathSegment[], timestamp: number): StretchPeak[] {
  const peaks: StretchPeak[] = [];
  for (const seg of segments) {
    if (seg.to.needleId >= 0 && seg.stretchRatio > WARNING_STRETCH_THRESHOLD) {
      peaks.push({
        needleId: seg.to.needleId,
        value: seg.stretchRatio,
        timestamp,
        severity: seg.stretchRatio > CRITICAL_STRETCH_THRESHOLD ? 'high' : seg.stretchRatio > (WARNING_STRETCH_THRESHOLD + CRITICAL_STRETCH_THRESHOLD) / 2 ? 'medium' : 'low',
      });
    }
  }
  return peaks.sort((a, b) => b.value - a.value).slice(0, 20);
}

function detectWearZones(
  segments: YarnPathSegment[],
  totalNeedles: number,
  passes: number
): WearZone[] {
  const needleWear: number[] = new Array(totalNeedles).fill(0);
  const needlePasses: number[] = new Array(totalNeedles).fill(0);

  for (const seg of segments) {
    if (seg.to.needleId >= 0) {
      needleWear[seg.to.needleId] += seg.wearRisk;
      needlePasses[seg.to.needleId]++;
    }
  }

  const zones: WearZone[] = [];
  let zoneStart = -1;
  let zoneWearSum = 0;
  let zoneCount = 0;

  for (let i = 0; i < totalNeedles; i++) {
    const avgWear = needlePasses[i] > 0 ? needleWear[i] / needlePasses[i] : 0;
    const isHighWear = avgWear > (WARNING_WEAR_LEVEL / 2);

    if (isHighWear) {
      if (zoneStart === -1) {
        zoneStart = i;
        zoneWearSum = 0;
        zoneCount = 0;
      }
      zoneWearSum += avgWear;
      zoneCount++;
    } else if (zoneStart !== -1) {
      const avgZoneWear = zoneCount > 0 ? zoneWearSum / zoneCount : 0;
      zones.push({
        startNeedle: zoneStart,
        endNeedle: i - 1,
        avgWearLevel: clamp(avgZoneWear, 0, 100),
        totalPasses: passes,
        riskLevel: avgZoneWear > CRITICAL_WEAR_LEVEL ? 'high' : avgZoneWear > WARNING_WEAR_LEVEL ? 'medium' : 'low',
      });
      zoneStart = -1;
    }
  }

  if (zoneStart !== -1) {
    const avgZoneWear = zoneCount > 0 ? zoneWearSum / zoneCount : 0;
    zones.push({
      startNeedle: zoneStart,
      endNeedle: totalNeedles - 1,
      avgWearLevel: clamp(avgZoneWear, 0, 100),
      totalPasses: passes,
      riskLevel: avgZoneWear > CRITICAL_WEAR_LEVEL ? 'high' : avgZoneWear > WARNING_WEAR_LEVEL ? 'medium' : 'low',
    });
  }

  return zones.sort((a, b) => b.avgWearLevel - a.avgWearLevel);
}

function analyzeYarnStability(
  frame: YarnSimulationFrame,
  feeders: YarnFeederConfig[]
): YarnAnalysisResult {
  let totalStabilityScore = 100;
  let totalBreakRisk = 0;
  let totalFluctuation = 0;
  let maxPeak = 0;
  const criticalZones: WearZone[] = [];
  const riskNeedleScores: Map<number, number> = new Map();

  let feederCount = 0;
  for (const feeder of feeders) {
    if (!feeder.enabled) continue;
    feederCount++;
    const segments = frame.paths[feeder.id] || [];
    const delivery = frame.deliveryStats[feeder.id];

    if (delivery) {
      totalFluctuation += delivery.fluctuationPercent;
      if (delivery.fluctuationPercent > CRITICAL_FLUCTUATION_PERCENT) {
        totalStabilityScore -= 30;
        totalBreakRisk += 25;
      } else if (delivery.fluctuationPercent > WARNING_FLUCTUATION_PERCENT) {
        totalStabilityScore -= 15;
        totalBreakRisk += 10;
      }
    }

    for (const seg of segments) {
      if (seg.stretchRatio > maxPeak) maxPeak = seg.stretchRatio;
      if (seg.stretchRatio > CRITICAL_STRETCH_THRESHOLD) {
        totalStabilityScore -= 20;
        totalBreakRisk += 30;
        const current = riskNeedleScores.get(seg.to.needleId) || 0;
        riskNeedleScores.set(seg.to.needleId, current + 50);
      } else if (seg.stretchRatio > WARNING_STRETCH_THRESHOLD) {
        totalStabilityScore -= 10;
        totalBreakRisk += 15;
        const current = riskNeedleScores.get(seg.to.needleId) || 0;
        riskNeedleScores.set(seg.to.needleId, current + 25);
      }

      if (seg.wearRisk > CRITICAL_WEAR_LEVEL) {
        totalStabilityScore -= 10;
        totalBreakRisk += 20;
        const current = riskNeedleScores.get(seg.to.needleId) || 0;
        riskNeedleScores.set(seg.to.needleId, current + 35);
      } else if (seg.wearRisk > WARNING_WEAR_LEVEL) {
        totalStabilityScore -= 5;
        totalBreakRisk += 8;
        const current = riskNeedleScores.get(seg.to.needleId) || 0;
        riskNeedleScores.set(seg.to.needleId, current + 15);
      }
    }
  }

  for (const zone of frame.wearZones) {
    if (zone.riskLevel === 'high') {
      criticalZones.push(zone);
    }
  }

  const topRiskNeedles: number[] = [];
  const sortedNeedles = Array.from(riskNeedleScores.entries()).sort((a, b) => b[1] - a[1]);
  for (let i = 0; i < Math.min(10, sortedNeedles.length); i++) {
    topRiskNeedles.push(sortedNeedles[i][0]);
  }

  return {
    overallStability: clamp(totalStabilityScore, 0, 100),
    breakRiskScore: clamp(totalBreakRisk, 0, 100),
    avgFluctuation: feederCount > 0 ? totalFluctuation / feederCount : 0,
    maxStretchPeak: maxPeak,
    criticalWearZones: criticalZones,
    topRiskNeedles,
  };
}

export const useCylinderStore = create<CylinderStore>((set, get) => ({
  totalNeedles: defaultScheme.totalNeedles,
  needles: defaultScheme.needles,
  patternPeriod: defaultScheme.patternPeriod,
  baseTension: defaultScheme.baseTension,
  rotationSpeed: defaultScheme.rotationSpeed,
  isRunning: true,
  highRiskThreshold: HIGH_RISK_THRESHOLD,
  currentSchemeId: defaultScheme.id,
  schemes: [defaultScheme],
  compareSchemeId: null,
  showComparison: false,
  heatMode: false,
  simulationStats: null,
  warnings: [],
  continuousSimulation: false,
  yarnFeeders: createDefaultFeeders(),
  yarnSimulationEnabled: true,
  yarnSimulationStats: null,
  showYarnPath: true,
  showRiskHighlight: true,

  toggleNeedle: (id: number) => {
    set((state) => ({
      needles: state.needles.map((n) =>
        n.id === id ? { ...n, enabled: !n.enabled } : n
      ),
    }));
    get().checkForWarnings();
    get().checkYarnWarnings();
  },

  setPatternPeriod: (period: number) => {
    const { totalNeedles } = get();
    const validPeriod = Math.max(1, Math.min(period, totalNeedles));
    set({ patternPeriod: validPeriod });
    get().checkForWarnings();
  },

  setBaseTension: (tension: number) => {
    const validTension = clamp(tension, MIN_TENSION, MAX_TENSION);
    set((state) => ({
      baseTension: validTension,
      needles: state.needles.map((n) => ({
        ...n,
        tension: clamp(
          validTension + (Math.random() - 0.5) * 20,
          MIN_TENSION,
          MAX_TENSION
        ),
      })),
    }));
    get().checkForWarnings();
    get().checkYarnWarnings();
  },

  setRotationSpeed: (speed: number) => {
    const validSpeed = clamp(speed, MIN_SPEED, MAX_SPEED);
    set({ rotationSpeed: validSpeed });
    get().checkForWarnings();
  },

  setTotalNeedles: (count: number) => {
    const validCount = Math.max(1, Math.floor(count));
    const { baseTension, patternPeriod } = get();
    const newPeriod = Math.min(patternPeriod, validCount);
    set({
      totalNeedles: validCount,
      needles: generateNeedles(validCount, baseTension),
      patternPeriod: newPeriod,
    });
    get().checkForWarnings();
    get().checkYarnWarnings();
  },

  toggleRunning: () => {
    set((state) => ({ isRunning: !state.isRunning }));
  },

  resetAll: () => {
    const newDefault = createDefaultScheme();
    set({
      totalNeedles: newDefault.totalNeedles,
      needles: newDefault.needles,
      patternPeriod: newDefault.patternPeriod,
      baseTension: newDefault.baseTension,
      rotationSpeed: newDefault.rotationSpeed,
      isRunning: true,
      currentSchemeId: newDefault.id,
      schemes: [newDefault],
      compareSchemeId: null,
      showComparison: false,
      heatMode: false,
      simulationStats: null,
      warnings: [],
      continuousSimulation: false,
      yarnFeeders: createDefaultFeeders(),
      yarnSimulationEnabled: true,
      yarnSimulationStats: null,
      showYarnPath: true,
      showRiskHighlight: true,
    });
  },

  setNeedleTension: (id: number, tension: number) => {
    const validTension = clamp(tension, MIN_TENSION, MAX_TENSION);
    set((state) => ({
      needles: state.needles.map((n) =>
        n.id === id ? { ...n, tension: validTension } : n
      ),
    }));
    get().checkForWarnings();
    get().checkYarnWarnings();
  },

  saveCurrentScheme: (name: string, description?: string) => {
    const now = Date.now();
    const {
      totalNeedles,
      needles,
      patternPeriod,
      baseTension,
      rotationSpeed,
      yarnFeeders,
      currentSchemeId,
      schemes,
    } = get();

    const targetIndex = schemes.findIndex((s) => s.id === currentSchemeId);

    if (targetIndex >= 0) {
      const updatedSchemes = [...schemes];
      updatedSchemes[targetIndex] = {
        ...updatedSchemes[targetIndex],
        name,
        description,
        totalNeedles,
        needles: [...needles],
        patternPeriod,
        baseTension,
        rotationSpeed,
        yarnFeeders: yarnFeeders.map(f => ({ ...f })),
        updatedAt: now,
      };
      set({ schemes: updatedSchemes });
    }
  },

  saveAsNewScheme: (name: string, description?: string) => {
    const now = Date.now();
    const {
      totalNeedles,
      needles,
      patternPeriod,
      baseTension,
      rotationSpeed,
      yarnFeeders,
      schemes,
    } = get();

    const newScheme: PatternScheme = {
      id: generateId(),
      name,
      description,
      totalNeedles,
      needles: [...needles],
      patternPeriod,
      baseTension,
      rotationSpeed,
      yarnFeeders: yarnFeeders.map(f => ({ ...f })),
      createdAt: now,
      updatedAt: now,
    };
    set({
      schemes: [...schemes, newScheme],
      currentSchemeId: newScheme.id,
    });
  },

  renameScheme: (id: string, name: string, description?: string) => {
    const now = Date.now();
    set((state) => ({
      schemes: state.schemes.map((s) =>
        s.id === id ? { ...s, name, description, updatedAt: now } : s
      ),
    }));
  },

  duplicateScheme: (sourceId: string) => {
    const { schemes } = get();
    const source = schemes.find((s) => s.id === sourceId);
    if (!source) return;

    const now = Date.now();
    const newScheme: PatternScheme = {
      ...source,
      id: generateId(),
      name: `${source.name} (副本)`,
      description: source.description
        ? `${source.description} - 副本`
        : undefined,
      needles: source.needles.map((n) => ({ ...n })),
      yarnFeeders: source.yarnFeeders?.map(f => ({ ...f })) || createDefaultFeeders(),
      createdAt: now,
      updatedAt: now,
    };
    set({ schemes: [...schemes, newScheme] });
  },

  loadScheme: (id: string) => {
    const { schemes } = get();
    const scheme = schemes.find((s) => s.id === id);
    if (scheme) {
      set({
        currentSchemeId: scheme.id,
        totalNeedles: scheme.totalNeedles,
        needles: scheme.needles.map((n) => ({ ...n })),
        patternPeriod: scheme.patternPeriod,
        baseTension: scheme.baseTension,
        rotationSpeed: scheme.rotationSpeed,
        yarnFeeders: scheme.yarnFeeders?.map(f => ({ ...f })) || createDefaultFeeders(),
        simulationStats: null,
        yarnSimulationStats: null,
      });
      get().checkForWarnings();
      get().checkYarnWarnings();
    }
  },

  deleteScheme: (id: string) => {
    const { schemes, currentSchemeId, compareSchemeId } = get();
    const filteredSchemes = schemes.filter((s) => s.id !== id);

    if (filteredSchemes.length === 0) {
      const newDefault = createDefaultScheme();
      set({
        schemes: [newDefault],
        currentSchemeId: newDefault.id,
        compareSchemeId: null,
        showComparison: false,
      });
    } else {
      const isCompareDeleted = compareSchemeId === id;
      const isCurrentDeleted = currentSchemeId === id;
      set({
        schemes: filteredSchemes,
        currentSchemeId: isCurrentDeleted ? filteredSchemes[0].id : currentSchemeId,
        compareSchemeId: isCompareDeleted ? null : compareSchemeId,
        showComparison: isCompareDeleted ? false : true,
      });
      if (isCurrentDeleted) {
        get().loadScheme(filteredSchemes[0].id);
      }
    }
  },

  updateScheme: (id: string, updates: Partial<PatternScheme>) => {
    const now = Date.now();
    set((state) => ({
      schemes: state.schemes.map((s) =>
        s.id === id ? { ...s, ...updates, updatedAt: now } : s
      ),
    }));
  },

  setCompareScheme: (id: string | null) => {
    set({ compareSchemeId: id, showComparison: id !== null });
  },

  toggleComparison: () => {
    set((state) => ({
      showComparison: !state.showComparison,
    }));
  },

  toggleHeatMode: () => {
    set((state) => ({ heatMode: !state.heatMode }));
  },

  toggleContinuousSimulation: () => {
    set((state) => {
      const nextContinuous = !state.continuousSimulation;
      if (nextContinuous) {
        return {
          continuousSimulation: true,
          simulationStats: state.simulationStats ?? {
            totalRuntime: 0,
            totalRotations: 0,
            avgTensionOverTime: 0,
            maxTensionReached: 0,
            needleRiskStats: get().needles.map((n) => ({
              id: n.id,
              totalRiskScore: 0,
              highRiskDuration: 0,
              currentRisk: 0,
            })),
          },
          yarnSimulationStats: state.yarnSimulationStats ?? {
            totalRuntime: 0,
            totalRotations: 0,
            deliveryHistory: {},
            stretchHistory: {},
            wearAccumulation: new Array(get().totalNeedles).fill(0),
            breakWarnings: [],
            lastFrame: null,
            analysisResult: null,
          },
        };
      } else {
        return {
          continuousSimulation: false,
        };
      }
    });
  },

  updateSimulationStats: (stats: Partial<SimulationStats>) => {
    set((state) => ({
      simulationStats: state.simulationStats
        ? { ...state.simulationStats, ...stats }
        : null,
    }));
  },

  addWarning: (warning: Omit<Warning, 'id' | 'timestamp'>) => {
    const now = Date.now();
    const newWarning: Warning = {
      ...warning,
      id: generateId(),
      timestamp: now,
    };
    
    set((state) => {
      const exists = state.warnings.some(
        (w) => w.type === warning.type && w.message === warning.message
      );
      if (exists) return state;
      return { warnings: [...state.warnings, newWarning] };
    });
  },

  clearWarnings: () => {
    set({ warnings: [] });
  },

  dismissWarning: (id: string) => {
    set((state) => ({
      warnings: state.warnings.filter((w) => w.id !== id),
    }));
  },

  checkForWarnings: () => {
    const {
      needles,
      baseTension,
      rotationSpeed,
      totalNeedles,
      highRiskThreshold,
    } = get();

    get().clearWarnings();

    if (baseTension > WARNING_TENSION_HIGH) {
      get().addWarning({
        type: 'tension',
        level: baseTension > CRITICAL_RISK_THRESHOLD ? 'error' : 'warning',
        message: `基础张力过高 (${baseTension.toFixed(0)} N)`,
        details: '高张力会显著增加断针风险，建议降低张力值。',
      });
    }

    if (rotationSpeed > WARNING_SPEED_HIGH) {
      get().addWarning({
        type: 'speed',
        level: 'warning',
        message: `转速过高 (${rotationSpeed.toFixed(1)} 转/秒)`,
        details: '高速运行会加速针位磨损，请确保张力在安全范围内。',
      });
    }

    const disabledCount = needles.filter((n) => !n.enabled).length;
    const disabledRatio = disabledCount / totalNeedles;
    if (disabledRatio > WARNING_DISABLED_NEEDLE_RATIO) {
      get().addWarning({
        type: 'needle_distribution',
        level: 'warning',
        message: `停针比例过高 (${(disabledRatio * 100).toFixed(1)}%)`,
        details: '大量针位停用可能导致织物张力不均，影响产品质量。',
      });
    }

    const highRiskCount = needles.filter(
      (n) => n.enabled && n.tension > highRiskThreshold
    ).length;
    if (highRiskCount > 0) {
      const criticalCount = needles.filter(
        (n) => n.enabled && n.tension > CRITICAL_RISK_THRESHOLD
      ).length;
      get().addWarning({
        type: 'high_risk',
        level: criticalCount > 0 ? 'error' : 'warning',
        message: `${highRiskCount} 个针位处于高风险状态`,
        details: `其中 ${criticalCount} 个针位张力超过 ${CRITICAL_RISK_THRESHOLD} N，建议立即调整。`,
      });
    }

    const enabledNeedles = needles.filter((n) => n.enabled);
    if (enabledNeedles.length > 0) {
      const tensions = enabledNeedles.map((n) => n.tension);
      const avgTension = tensions.reduce((a, b) => a + b, 0) / tensions.length;
      const variance =
        tensions.reduce((sum, t) => sum + Math.pow(t - avgTension, 2), 0) /
        tensions.length;
      const stdDev = Math.sqrt(variance);

      if (stdDev > 15) {
        get().addWarning({
          type: 'tension',
          level: 'warning',
          message: `张力分布不均 (标准差: ${stdDev.toFixed(1)})`,
          details: '针位间张力差异过大可能导致织物纹理不一致。',
        });
      }
    }
  },

  exportScheme: (id: string): string => {
    const { schemes } = get();
    const scheme = schemes.find((s) => s.id === id);
    if (!scheme) throw new Error('方案不存在');
    
    const exportData = {
      exportType: 'pattern-scheme',
      exportVersion: '2.0',
      exportedAt: new Date().toISOString(),
      scheme: {
        ...scheme,
        needles: scheme.needles.map((n) => ({ ...n })),
        yarnFeeders: scheme.yarnFeeders?.map(f => ({ ...f })),
      },
    };
    
    return JSON.stringify(exportData, null, 2);
  },

  exportSimulationStats: (): string => {
    const { simulationStats, yarnSimulationStats, needles, totalNeedles, patternPeriod, baseTension, rotationSpeed, yarnFeeders } = get();
    if (!simulationStats && !yarnSimulationStats) throw new Error('暂无模拟统计数据');
    
    const exportData = {
      exportType: 'simulation-stats',
      exportVersion: '2.0',
      exportedAt: new Date().toISOString(),
      currentConfig: {
        totalNeedles,
        patternPeriod,
        baseTension,
        rotationSpeed,
        yarnFeeders: yarnFeeders.map(f => ({ ...f })),
      },
      simulationStats: simulationStats ? {
        ...simulationStats,
        needleRiskStats: simulationStats.needleRiskStats.map((s) => ({ ...s })),
      } : null,
      yarnSimulationStats: yarnSimulationStats ? {
        ...yarnSimulationStats,
        wearAccumulation: [...yarnSimulationStats.wearAccumulation],
        breakWarnings: yarnSimulationStats.breakWarnings.map(w => ({ ...w })),
      } : null,
      currentNeedleState: needles.map((n) => ({ ...n })),
    };
    
    return JSON.stringify(exportData, null, 2);
  },

  importScheme: (data: string) => {
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.exportType !== 'pattern-scheme') {
        throw new Error('无效的方案文件格式');
      }
      
      const scheme = parsed.scheme as PatternScheme;
      const now = Date.now();
      const newScheme: PatternScheme = {
        ...scheme,
        id: generateId(),
        name: `${scheme.name} (导入)`,
        createdAt: now,
        updatedAt: now,
        yarnFeeders: scheme.yarnFeeders?.map(f => ({ ...f })) || createDefaultFeeders(),
      };
      
      set((state) => ({
        schemes: [...state.schemes, newScheme],
      }));
      
      get().loadScheme(newScheme.id);
    } catch (e) {
      throw new Error('导入失败：文件格式无效');
    }
  },

  addYarnFeeder: () => {
    const { yarnFeeders, totalNeedles } = get();
    if (yarnFeeders.length >= MAX_YARN_FEEDERS) return;

    const colorIndex = yarnFeeders.length % YARN_FEEDER_COLORS.length;
    const newFeeder: YarnFeederConfig = {
      id: generateId(),
      name: `送纱嘴 ${yarnFeeders.length + 1}`,
      position: (yarnFeeders.length * totalNeedles) / MAX_YARN_FEEDERS,
      yarnLength: DEFAULT_YARN_LENGTH,
      guideAngle: DEFAULT_GUIDE_ANGLE,
      frictionCoefficient: DEFAULT_FRICTION,
      color: YARN_FEEDER_COLORS[colorIndex],
      enabled: true,
    };

    set((state) => ({ yarnFeeders: [...state.yarnFeeders, newFeeder] }));
    get().checkYarnWarnings();
  },

  removeYarnFeeder: (id: string) => {
    set((state) => ({
      yarnFeeders: state.yarnFeeders.filter((f) => f.id !== id),
    }));
    get().checkYarnWarnings();
  },

  updateYarnFeeder: (id: string, updates: Partial<YarnFeederConfig>) => {
    set((state) => ({
      yarnFeeders: state.yarnFeeders.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      ),
    }));
    get().checkYarnWarnings();
  },

  toggleYarnFeeder: (id: string) => {
    set((state) => ({
      yarnFeeders: state.yarnFeeders.map((f) =>
        f.id === id ? { ...f, enabled: !f.enabled } : f
      ),
    }));
    get().checkYarnWarnings();
  },

  setYarnFeeders: (feeders: YarnFeederConfig[]) => {
    set({ yarnFeeders: feeders });
    get().checkYarnWarnings();
  },

  toggleYarnSimulation: () => {
    set((state) => ({ yarnSimulationEnabled: !state.yarnSimulationEnabled }));
  },

  toggleShowYarnPath: () => {
    set((state) => ({ showYarnPath: !state.showYarnPath }));
  },

  toggleShowRiskHighlight: () => {
    set((state) => ({ showRiskHighlight: !state.showRiskHighlight }));
  },

  updateYarnSimulationStats: (stats: Partial<YarnSimulationStats>) => {
    set((state) => ({
      yarnSimulationStats: state.yarnSimulationStats
        ? { ...state.yarnSimulationStats, ...stats }
        : null,
    }));
  },

  addYarnBreakWarning: (warning: Omit<YarnBreakWarning, 'id' | 'timestamp'>) => {
    const now = Date.now();
    const newWarning: YarnBreakWarning = {
      ...warning,
      id: generateId(),
      timestamp: now,
    };

    set((state) => {
      if (!state.yarnSimulationStats) return state;
      const exists = state.yarnSimulationStats.breakWarnings.some(
        (w) => w.type === warning.type && w.needleId === warning.needleId
      );
      if (exists) return state;
      return {
        yarnSimulationStats: {
          ...state.yarnSimulationStats,
          breakWarnings: [...state.yarnSimulationStats.breakWarnings, newWarning].slice(-50),
        },
      };
    });
  },

  clearYarnBreakWarnings: () => {
    set((state) => {
      if (!state.yarnSimulationStats) return state;
      return {
        yarnSimulationStats: {
          ...state.yarnSimulationStats,
          breakWarnings: [],
        },
      };
    });
  },

  resetYarnSimulation: () => {
    set((state) => ({
      yarnSimulationStats: {
        totalRuntime: 0,
        totalRotations: 0,
        deliveryHistory: {},
        stretchHistory: {},
        wearAccumulation: new Array(state.totalNeedles).fill(0),
        breakWarnings: [],
        lastFrame: null,
        analysisResult: null,
      },
    }));
  },

  checkYarnWarnings: () => {
    const { yarnFeeders, yarnSimulationStats, totalNeedles, baseTension, needles, rotationSpeed } = get();

    for (const feeder of yarnFeeders) {
      if (!feeder.enabled) continue;

      if (feeder.frictionCoefficient > 0.4) {
        get().addWarning({
          type: 'delivery_fluctuation',
          level: feeder.frictionCoefficient > 0.6 ? 'error' : 'warning',
          message: `${feeder.name}: 摩擦系数过高 (${feeder.frictionCoefficient.toFixed(2)})`,
          details: '高摩擦系数会增加纱线磨损和断线风险，建议降低摩擦系数或更换导纱器。',
        });
      }

      if (feeder.guideAngle < 15 || feeder.guideAngle > 75) {
        get().addWarning({
          type: 'angle_violation',
          level: feeder.guideAngle < 10 || feeder.guideAngle > 80 ? 'error' : 'warning',
          message: `${feeder.name}: 导纱角度异常 (${feeder.guideAngle.toFixed(0)}°)`,
          details: '导纱角度建议保持在 15°~75° 之间，角度过大或过小都会增加纱线张力波动。',
        });
      }

      if (feeder.position < 0 || feeder.position >= totalNeedles) {
        get().addWarning({
          type: 'delivery_fluctuation',
          level: 'error',
          message: `${feeder.name}: 位置超出范围`,
          details: `送纱嘴位置应在 0 ~ ${totalNeedles - 1} 之间。`,
        });
      }

      const segments = calculateYarnPath(feeder, needles, totalNeedles, 0, baseTension, 180);
      const delivery = calculateDeliveryStats(segments, baseTension, feeder.yarnLength);

      if (delivery.fluctuationPercent > WARNING_FLUCTUATION_PERCENT) {
        get().addWarning({
          type: 'delivery_fluctuation',
          level: delivery.fluctuationPercent > CRITICAL_FLUCTUATION_PERCENT ? 'error' : 'warning',
          message: `${feeder.name}: 送纱波动 ${delivery.fluctuationPercent.toFixed(1)}%`,
          details: '送纱量波动过大会导致织物密度不均，建议检查纱线张力设置和送纱嘴位置。',
        });
      }

      const peaks = detectStretchPeaks(segments, Date.now());
      if (peaks.length > 0 && peaks[0].value > WARNING_STRETCH_THRESHOLD) {
        const worstPeak = peaks[0];
        get().addWarning({
          type: 'excessive_stretch',
          level: worstPeak.value > CRITICAL_STRETCH_THRESHOLD ? 'error' : 'warning',
          message: `${feeder.name}: 针位 #${worstPeak.needleId + 1} 拉伸 ${worstPeak.value.toFixed(1)}%`,
          details: '局部拉伸过大会导致纱线断裂或织物变形，建议调整送纱嘴位置或导纱角度。',
        });
      }
    }

    if (rotationSpeed > 5) {
      const enabledCount = needles.filter(n => n.enabled).length;
      if (enabledCount > 0 && baseTension > 60) {
        get().addWarning({
          type: 'break_risk',
          level: baseTension > 75 ? 'error' : 'warning',
          message: `综合断线风险较高 (转速: ${rotationSpeed.toFixed(1)}, 张力: ${baseTension.toFixed(0)})`,
          details: '高转速配合高张力会显著增加纱线断线概率，建议降低转速或张力。',
        });
      }
    }
  },
}));

export function useCylinderStats() {
  const { needles, patternPeriod, totalNeedles, highRiskThreshold } =
    useCylinderStore();

  const enabledCount = needles.filter((n) => n.enabled).length;
  const disabledCount = needles.filter((n) => !n.enabled).length;
  const highRiskCount = needles.filter(
    (n) => n.enabled && n.tension > highRiskThreshold
  ).length;
  const patternRepeats = Math.floor(totalNeedles / patternPeriod) || 0;
  const averageTension =
    enabledCount > 0
      ? needles
          .filter((n) => n.enabled)
          .reduce((sum, n) => sum + n.tension, 0) / enabledCount
      : 0;

  return {
    enabledCount,
    disabledCount,
    highRiskCount,
    patternRepeats,
    averageTension,
    totalNeedles,
    patternPeriod,
  };
}

export function useSchemeComparison() {
  const { schemes, currentSchemeId, compareSchemeId } = useCylinderStore();

  const currentScheme = schemes.find((s) => s.id === currentSchemeId);
  const compareScheme = schemes.find((s) => s.id === compareSchemeId);

  if (!currentScheme || !compareScheme) return null;

  const currentEnabled = currentScheme.needles.filter((n) => n.enabled).length;
  const compareEnabled = compareScheme.needles.filter((n) => n.enabled).length;

  const currentAvgTension =
    currentEnabled > 0
      ? currentScheme.needles
          .filter((n) => n.enabled)
          .reduce((sum, n) => sum + n.tension, 0) / currentEnabled
      : 0;

  const compareAvgTension =
    compareEnabled > 0
      ? compareScheme.needles
          .filter((n) => n.enabled)
          .reduce((sum, n) => sum + n.tension, 0) / compareEnabled
      : 0;

  const currentHighRisk = currentScheme.needles.filter(
    (n) => n.enabled && n.tension > HIGH_RISK_THRESHOLD
  ).length;

  const compareHighRisk = compareScheme.needles.filter(
    (n) => n.enabled && n.tension > HIGH_RISK_THRESHOLD
  ).length;

  const currentPatternRepeats =
    Math.floor(currentScheme.totalNeedles / currentScheme.patternPeriod) || 0;
  const comparePatternRepeats =
    Math.floor(compareScheme.totalNeedles / compareScheme.patternPeriod) || 0;

  const currentFeederCount = currentScheme.yarnFeeders?.filter(f => f.enabled).length || 0;
  const compareFeederCount = compareScheme.yarnFeeders?.filter(f => f.enabled).length || 0;

  const currentAvgFriction = currentScheme.yarnFeeders?.length
    ? currentScheme.yarnFeeders.reduce((sum, f) => sum + f.frictionCoefficient, 0) / currentScheme.yarnFeeders.length
    : 0;
  const compareAvgFriction = compareScheme.yarnFeeders?.length
    ? compareScheme.yarnFeeders.reduce((sum, f) => sum + f.frictionCoefficient, 0) / compareScheme.yarnFeeders.length
    : 0;

  return {
    current: {
      scheme: currentScheme,
      enabledCount: currentEnabled,
      avgTension: currentAvgTension,
      highRiskCount: currentHighRisk,
      patternRepeats: currentPatternRepeats,
      patternPeriod: currentScheme.patternPeriod,
      rotationSpeed: currentScheme.rotationSpeed,
      feederCount: currentFeederCount,
      avgFriction: currentAvgFriction,
    },
    compare: {
      scheme: compareScheme,
      enabledCount: compareEnabled,
      avgTension: compareAvgTension,
      highRiskCount: compareHighRisk,
      patternRepeats: comparePatternRepeats,
      patternPeriod: compareScheme.patternPeriod,
      rotationSpeed: compareScheme.rotationSpeed,
      feederCount: compareFeederCount,
      avgFriction: compareAvgFriction,
    },
    diff: {
      enabledCount: currentEnabled - compareEnabled,
      avgTension: currentAvgTension - compareAvgTension,
      highRiskCount: currentHighRisk - compareHighRisk,
      patternPeriod: currentScheme.patternPeriod - compareScheme.patternPeriod,
      rotationSpeed: currentScheme.rotationSpeed - compareScheme.rotationSpeed,
      feederCount: currentFeederCount - compareFeederCount,
      avgFriction: currentAvgFriction - compareAvgFriction,
    },
  };
}

export function useHeatMapData() {
  const { needles, highRiskThreshold, simulationStats, heatMode } =
    useCylinderStore();

  return needles.map((needle) => {
    let riskLevel = 0;
    let color = '#00d4ff';

    if (needle.enabled) {
      if (heatMode && simulationStats) {
        const riskStat = simulationStats.needleRiskStats.find(
          (r) => r.id === needle.id
        );
        if (riskStat) {
          const normalizedRisk = Math.min(
            riskStat.totalRiskScore / 1000,
            1
          );
          riskLevel = normalizedRisk;
          
          if (normalizedRisk > 0.7) {
            color = '#ff4757';
          } else if (normalizedRisk > 0.4) {
            color = '#ff6b35';
          } else if (normalizedRisk > 0.2) {
            color = '#ffd700';
          } else {
            color = '#00d4ff';
          }
        }
      } else {
        const tensionRatio = needle.tension / 100;
        riskLevel = tensionRatio;
        
        if (needle.tension > highRiskThreshold) {
          color = '#ff4757';
        } else if (needle.tension > 60) {
          color = '#ffd700';
        } else {
          color = '#00d4ff';
        }
      }
    } else {
      color = '#3a4a6a';
      riskLevel = 0;
    }

    return {
      ...needle,
      riskLevel,
      color,
    };
  });
}

export {
  calculateYarnPath,
  calculateDeliveryStats,
  detectStretchPeaks,
  detectWearZones,
  analyzeYarnStability,
};
