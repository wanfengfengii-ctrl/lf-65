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
  YarnMaterial,
  PathInterference,
  TensionCoupling,
  LocalCrowding,
  QualityPrediction,
  MultiYarnSimulationResult,
  DEFAULT_YARN_MATERIALS,
  INTERFERENCE_THRESHOLD_LOW,
  INTERFERENCE_THRESHOLD_MEDIUM,
  CROWDING_THRESHOLD_LOW,
  CROWDING_THRESHOLD_MEDIUM,
  COUPLING_THRESHOLD,
  OptimizationTarget,
  OptimizationConstraints,
  OptimizationCandidate,
  OptimizationResult,
  WorkOrder,
  ScheduleItem,
  ScheduleResult,
  DEFAULT_OPTIMIZATION_TARGETS,
  DEFAULT_OPTIMIZATION_CONSTRAINTS,
  DEFAULT_WORK_ORDERS,
  MIN_FRICTION,
  MAX_FRICTION,
  MIN_GUIDE_ANGLE,
  MAX_GUIDE_ANGLE,
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

function createDefaultMaterials(): YarnMaterial[] {
  return DEFAULT_YARN_MATERIALS.map(m => ({
    ...m,
    id: generateId(),
  }));
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

function detectPathInterferences(
  feeders: YarnFeederConfig[],
  needles: Needle[],
  totalNeedles: number,
  rotation: number,
  baseTension: number,
  radius: number = 200
): PathInterference[] {
  const interferences: PathInterference[] = [];
  const enabledFeeders = feeders.filter(f => f.enabled);

  for (let i = 0; i < enabledFeeders.length; i++) {
    for (let j = i + 1; j < enabledFeeders.length; j++) {
      const feederA = enabledFeeders[i];
      const feederB = enabledFeeders[j];
      const pathA = calculateYarnPath(feederA, needles, totalNeedles, rotation, baseTension, radius);
      const pathB = calculateYarnPath(feederB, needles, totalNeedles, rotation, baseTension, radius);

      const interferenceNeedles: number[] = [];
      let minDistance = Infinity;
      let maxCrossAngle = 0;

      const pointsA = pathA.map(s => ({ x: s.to.x, y: s.to.y, needleId: s.to.needleId }));
      const pointsB = pathB.map(s => ({ x: s.to.x, y: s.to.y, needleId: s.to.needleId }));

      for (const pa of pointsA) {
        for (const pb of pointsB) {
          if (pa.needleId < 0 || pb.needleId < 0) continue;
          const dist = Math.sqrt((pa.x - pb.x) ** 2 + (pa.y - pb.y) ** 2);
          if (dist < minDistance) minDistance = dist;
          if (dist < INTERFERENCE_THRESHOLD_LOW) {
            if (!interferenceNeedles.includes(pa.needleId)) interferenceNeedles.push(pa.needleId);
            if (!interferenceNeedles.includes(pb.needleId)) interferenceNeedles.push(pb.needleId);
            const angleA = Math.atan2(pa.y, pa.x);
            const angleB = Math.atan2(pb.y, pb.x);
            const crossAngle = Math.abs(Math.abs(angleA - angleB) - Math.PI / 2);
            if (crossAngle > maxCrossAngle) maxCrossAngle = crossAngle;
          }
        }
      }

      if (interferenceNeedles.length > 0) {
        let level: 'low' | 'medium' | 'high' = 'low';
        if (minDistance < INTERFERENCE_THRESHOLD_MEDIUM || interferenceNeedles.length > totalNeedles * 0.1) {
          level = 'high';
        } else if (interferenceNeedles.length > totalNeedles * 0.05) {
          level = 'medium';
        }
        interferences.push({
          feederA: feederA.id,
          feederB: feederB.id,
          needleIds: interferenceNeedles.sort((a, b) => a - b),
          interferenceLevel: level,
          minDistance,
          crossAngle: (maxCrossAngle * 180) / Math.PI,
        });
      }
    }
  }

  return interferences.sort((a, b) => {
    const levelOrder = { high: 0, medium: 1, low: 2 };
    return levelOrder[a.interferenceLevel] - levelOrder[b.interferenceLevel];
  });
}

function calculateTensionCouplings(
  feeders: YarnFeederConfig[],
  needles: Needle[],
  totalNeedles: number,
  baseTension: number
): TensionCoupling[] {
  const couplings: TensionCoupling[] = [];
  const enabledFeeders = feeders.filter(f => f.enabled);

  for (let i = 0; i < enabledFeeders.length; i++) {
    for (let j = 0; j < enabledFeeders.length; j++) {
      if (i === j) continue;
      const feederA = enabledFeeders[i];
      const feederB = enabledFeeders[j];

      const posDiff = Math.abs(feederA.position - feederB.position);
      const normalizedPosDiff = Math.min(posDiff, totalNeedles - posDiff) / totalNeedles;
      const proximityFactor = 1 - normalizedPosDiff;

      const avgFriction = (feederA.frictionCoefficient + feederB.frictionCoefficient) / 2;
      const angleDiff = Math.abs(feederA.guideAngle - feederB.guideAngle) / 90;

      const couplingCoefficient = proximityFactor * 0.6 + avgFriction * 0.25 + (1 - angleDiff) * 0.15;

      if (couplingCoefficient > COUPLING_THRESHOLD) {
        const affectedNeedles: number[] = [];
        const startPos = Math.floor(Math.min(feederA.position, feederB.position));
        const endPos = Math.ceil(Math.max(feederA.position, feederB.position));

        for (let n = startPos; n <= endPos; n++) {
          const idx = ((n % totalNeedles) + totalNeedles) % totalNeedles;
          if (needles[idx]?.enabled) {
            affectedNeedles.push(idx);
          }
        }

        const tensionTransfer = couplingCoefficient * 100 * (baseTension / 100);

        couplings.push({
          feederId: feederA.id,
          affectedFeederId: feederB.id,
          couplingCoefficient: clamp(couplingCoefficient, 0, 1),
          tensionTransferPercent: clamp(tensionTransfer, 0, 100),
          affectedNeedleIds: affectedNeedles,
        });
      }
    }
  }

  return couplings.sort((a, b) => b.couplingCoefficient - a.couplingCoefficient);
}

function detectLocalCrowding(
  feeders: YarnFeederConfig[],
  needles: Needle[],
  totalNeedles: number,
  rotation: number,
  baseTension: number,
  radius: number = 200
): LocalCrowding[] {
  const crowdingZones: LocalCrowding[] = [];
  const enabledFeeders = feeders.filter(f => f.enabled);
  const needleFeederMap: Map<number, string[]> = new Map();

  for (const feeder of enabledFeeders) {
    const path = calculateYarnPath(feeder, needles, totalNeedles, rotation, baseTension, radius);
    for (const seg of path) {
      if (seg.to.needleId >= 0) {
        if (!needleFeederMap.has(seg.to.needleId)) {
          needleFeederMap.set(seg.to.needleId, []);
        }
        const list = needleFeederMap.get(seg.to.needleId)!;
        if (!list.includes(feeder.id)) {
          list.push(feeder.id);
        }
      }
    }
  }

  for (const [needleIdStr, feederIds] of needleFeederMap.entries()) {
    const needleId = Number(needleIdStr);
    const count = feederIds.length;

    if (count >= CROWDING_THRESHOLD_LOW) {
      let severity: 'low' | 'medium' | 'high' = 'low';
      if (count >= CROWDING_THRESHOLD_MEDIUM + 1) {
        severity = 'high';
      } else if (count >= CROWDING_THRESHOLD_MEDIUM) {
        severity = 'medium';
      }

      const baseIndex = count / enabledFeeders.length;
      const materialPenalty = feederIds.some((fid) => {
        const f = feeders.find(ff => ff.id === fid);
        return f && (f.materialId ? true : false);
      }) ? 1.2 : 1;

      crowdingZones.push({
        needleId,
        feederCount: count,
        crowdingIndex: clamp(baseIndex * materialPenalty * 100, 0, 100),
        feederIds,
        severity,
      });
    }
  }

  return crowdingZones.sort((a, b) => b.crowdingIndex - a.crowdingIndex);
}

function calculateQualityPrediction(
  yarnAnalysis: YarnAnalysisResult | null,
  interferences: PathInterference[],
  couplings: TensionCoupling[],
  crowding: LocalCrowding[],
  feeders: YarnFeederConfig[],
  needles: Needle[],
  patternPeriod: number,
  totalNeedles: number,
  materials: YarnMaterial[]
): QualityPrediction {
  const enabledFeeders = feeders.filter(f => f.enabled);
  const enabledNeedles = needles.filter(n => n.enabled);

  const tensions = enabledNeedles.map(n => n.tension);
  const avgTension = tensions.length > 0 ? tensions.reduce((a, b) => a + b, 0) / tensions.length : 0;
  const tensionVariance = tensions.length > 0
    ? Math.sqrt(tensions.reduce((s, t) => s + (t - avgTension) ** 2, 0) / tensions.length)
    : 0;

  const interferencePenalty = interferences.reduce((s, i) => {
    const factor = i.interferenceLevel === 'high' ? 8 : i.interferenceLevel === 'medium' ? 4 : 1;
    return s + factor * (i.needleIds.length / totalNeedles);
  }, 0);

  const couplingPenalty = couplings.reduce((s, c) => s + c.couplingCoefficient * 3, 0);
  const crowdingPenalty = crowding.reduce((s, c) => {
    const factor = c.severity === 'high' ? 6 : c.severity === 'medium' ? 3 : 1;
    return s + factor * (c.crowdingIndex / 100);
  }, 0);

  let avgWearResistance = 60;
  let avgElasticity = 50;
  let avgTensileStrength = 70;
  const usedMaterials = enabledFeeders
    .map(f => f.materialId)
    .filter(id => id)
    .map(id => materials.find(m => m.id === id))
    .filter(Boolean) as YarnMaterial[];

  if (usedMaterials.length > 0) {
    avgWearResistance = usedMaterials.reduce((s, m) => s + m.wearResistance, 0) / usedMaterials.length;
    avgElasticity = usedMaterials.reduce((s, m) => s + m.elasticity, 0) / usedMaterials.length;
    avgTensileStrength = usedMaterials.reduce((s, m) => s + m.tensileStrength, 0) / usedMaterials.length;
  }

  const baseUniformity = 100;
  const tensionPenalty = (tensionVariance / 20) * 15;
  const coverageRate = enabledNeedles.length / totalNeedles;
  const coveragePenalty = (1 - coverageRate) * 30;
  const densityVariation = Math.abs(patternPeriod - Math.round(totalNeedles / enabledFeeders.length || 1)) / patternPeriod * 10;

  const uniformityScore = clamp(
    baseUniformity - tensionPenalty - coveragePenalty - densityVariation - interferencePenalty * 2,
    0, 100
  );

  const baseBreakageRisk = yarnAnalysis?.breakRiskScore || 50;
  const strengthBonus = (100 - avgTensileStrength) * 0.5;
  const elasticityBonus = (100 - avgElasticity) * 0.3;

  const breakageProbability = clamp(
    baseBreakageRisk + interferencePenalty * 3 + crowdingPenalty * 2 + strengthBonus - elasticityBonus * 0.5,
    0, 100
  );

  const baseLifetime = 10000;
  const wearFactor = (100 - avgWearResistance) / 100;
  const wearReduction = (yarnAnalysis?.criticalWearZones?.length || 0) * 500;
  const crowdingReduction = crowdingPenalty * 200;
  const interferenceReduction = interferencePenalty * 150;

  const wearLifetime = Math.max(
    500,
    Math.round(baseLifetime * (1 - wearFactor * 0.7) - wearReduction - crowdingReduction - interferenceReduction)
  );

  const enabledFeederPenalty = enabledFeeders.length > 4 ? (enabledFeeders.length - 4) * 3 : 0;
  const periodAccuracy = clamp(100 - Math.abs((patternPeriod || 8) - 8) * 5, 0, 100);
  const alignmentError = clamp(interferencePenalty * 2 + couplingPenalty * 1.5, 0, 50);
  const colorShiftIndex = clamp((usedMaterials.length > 1 ? usedMaterials.length * 5 : 0) + interferencePenalty, 0, 30);

  const patternFidelityScore = clamp(
    100 - alignmentError - colorShiftIndex - enabledFeederPenalty + periodAccuracy * 0.2,
    0, 100
  );

  const overallQualityScore = clamp(
    uniformityScore * 0.3 +
    (100 - breakageProbability) * 0.25 +
    clamp((wearLifetime / 10000) * 100, 0, 100) * 0.2 +
    patternFidelityScore * 0.25,
    0, 100
  );

  let grade: 'A' | 'B' | 'C' | 'D' = 'D';
  if (overallQualityScore >= 85) grade = 'A';
  else if (overallQualityScore >= 70) grade = 'B';
  else if (overallQualityScore >= 55) grade = 'C';

  return {
    uniformityScore,
    breakageProbability,
    wearLifetime,
    patternFidelityScore,
    overallQualityScore,
    grade,
    details: {
      uniformity: {
        tensionVariance: Number(tensionVariance.toFixed(2)),
        densityVariation: Number(densityVariation.toFixed(2)),
        needleCoverageRate: Number((coverageRate * 100).toFixed(1)),
      },
      breakage: {
        maxTensionRatio: yarnAnalysis ? Number(((yarnAnalysis.maxStretchPeak || 0) / 100).toFixed(3)) : 0,
        weakPointCount: (yarnAnalysis?.topRiskNeedles?.length || 0) + crowding.filter(c => c.severity === 'high').length,
        fatigueFactor: Number(clamp(couplingPenalty + crowdingPenalty * 0.5, 0, 10).toFixed(2)),
      },
      wear: {
        avgWearRate: Number(((100 - avgWearResistance) * (1 + crowdingPenalty * 0.02)).toFixed(2)),
        criticalZoneCount: (yarnAnalysis?.criticalWearZones?.length || 0) + crowding.filter(c => c.severity !== 'low').length,
        predictedCycles: wearLifetime,
      },
      pattern: {
        alignmentError: Number(alignmentError.toFixed(2)),
        colorShiftIndex: Number(colorShiftIndex.toFixed(2)),
        periodAccuracy: Number(periodAccuracy.toFixed(1)),
      },
    },
  };
}

function runFullMultiYarnSimulation(
  feeders: YarnFeederConfig[],
  needles: Needle[],
  totalNeedles: number,
  baseTension: number,
  patternPeriod: number,
  materials: YarnMaterial[],
  yarnAnalysis: YarnAnalysisResult | null,
  lastFrame: YarnSimulationFrame | null
): MultiYarnSimulationResult {
  const rotation = lastFrame?.rotation || 0;
  const radius = 180;

  const interferences = detectPathInterferences(feeders, needles, totalNeedles, rotation, baseTension, radius);
  const tensionCouplings = calculateTensionCouplings(feeders, needles, totalNeedles, baseTension);
  const crowdingZones = detectLocalCrowding(feeders, needles, totalNeedles, rotation, baseTension, radius);
  const qualityPrediction = calculateQualityPrediction(
    yarnAnalysis,
    interferences,
    tensionCouplings,
    crowdingZones,
    feeders,
    needles,
    patternPeriod,
    totalNeedles,
    materials
  );

  const synchronizedTensionMap: number[][] = [];
  for (let i = 0; i < totalNeedles; i++) {
    const row: number[] = [];
    for (const feeder of feeders) {
      if (feeder.enabled) {
        const couplingEffect = tensionCouplings
          .filter(c => c.affectedFeederId === feeder.id)
          .reduce((s, c) => s + (c.affectedNeedleIds.includes(i) ? c.tensionTransferPercent * 0.01 : 0), 0);
        const crowd = crowdingZones.find(c => c.needleId === i);
        const crowdingEffect = crowd ? (crowd.crowdingIndex / 100) * 15 : 0;
        const baseValue = needles[i]?.tension || baseTension;
        row.push(clamp(baseValue + couplingEffect + crowdingEffect, MIN_TENSION, MAX_TENSION));
      } else {
        row.push(0);
      }
    }
    synchronizedTensionMap.push(row);
  }

  return {
    interferences,
    tensionCouplings,
    crowdingZones,
    qualityPrediction,
    synchronizedTensionMap,
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
  yarnMaterials: createDefaultMaterials(),
  showInterferenceHighlight: true,
  showCrowdingHighlight: true,
  showTensionCoupling: true,
  qualityPrediction: null,
  optimizationTargets: { ...DEFAULT_OPTIMIZATION_TARGETS },
  optimizationConstraints: { ...DEFAULT_OPTIMIZATION_CONSTRAINTS },
  optimizationResult: null,
  isOptimizing: false,
  selectedCandidateId: null,
  workOrders: DEFAULT_WORK_ORDERS.map(o => ({ ...o, id: generateId(), status: 'pending' as const })),
  scheduleResult: null,
  isScheduling: false,

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
      yarnMaterials: createDefaultMaterials(),
      showInterferenceHighlight: true,
      showCrowdingHighlight: true,
      showTensionCoupling: true,
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
            multiYarnResult: null,
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
        multiYarnResult: null,
      },
      qualityPrediction: null,
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

  addYarnMaterial: (material: Omit<YarnMaterial, 'id'>) => {
    const newMaterial: YarnMaterial = { ...material, id: generateId() };
    set((state) => ({ yarnMaterials: [...state.yarnMaterials, newMaterial] }));
    get().runMultiYarnSimulation();
  },

  updateYarnMaterial: (id: string, updates: Partial<YarnMaterial>) => {
    set((state) => ({
      yarnMaterials: state.yarnMaterials.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    }));
    get().runMultiYarnSimulation();
  },

  removeYarnMaterial: (id: string) => {
    set((state) => ({
      yarnMaterials: state.yarnMaterials.filter((m) => m.id !== id),
      yarnFeeders: state.yarnFeeders.map((f) =>
        f.materialId === id ? { ...f, materialId: undefined } : f
      ),
    }));
    get().runMultiYarnSimulation();
  },

  setYarnMaterials: (materials: YarnMaterial[]) => {
    set({ yarnMaterials: materials });
    get().runMultiYarnSimulation();
  },

  toggleShowInterferenceHighlight: () => {
    set((state) => ({ showInterferenceHighlight: !state.showInterferenceHighlight }));
  },

  toggleShowCrowdingHighlight: () => {
    set((state) => ({ showCrowdingHighlight: !state.showCrowdingHighlight }));
  },

  toggleShowTensionCoupling: () => {
    set((state) => ({ showTensionCoupling: !state.showTensionCoupling }));
  },

  runMultiYarnSimulation: () => {
    const state = get();
    const { yarnFeeders, needles, totalNeedles, baseTension, patternPeriod, yarnMaterials, yarnSimulationStats } = state;

    if (yarnFeeders.filter(f => f.enabled).length === 0) {
      set((s) => ({
        yarnSimulationStats: s.yarnSimulationStats
          ? { ...s.yarnSimulationStats, multiYarnResult: null }
          : null,
      }));
      return;
    }

    const result = runFullMultiYarnSimulation(
      yarnFeeders,
      needles,
      totalNeedles,
      baseTension,
      patternPeriod,
      yarnMaterials,
      yarnSimulationStats?.analysisResult || null,
      yarnSimulationStats?.lastFrame || null
    );

    const highInterference = result.interferences.filter(i => i.interferenceLevel !== 'low');
    for (const interference of highInterference) {
      const fA = yarnFeeders.find(f => f.id === interference.feederA);
      const fB = yarnFeeders.find(f => f.id === interference.feederB);
      get().addWarning({
        type: 'high_risk',
        level: interference.interferenceLevel === 'high' ? 'error' : 'warning',
        message: `路径干涉: ${fA?.name || '送纱嘴A'} ↔ ${fB?.name || '送纱嘴B'}`,
        details: `在 ${interference.needleIds.length} 个针位检测到干涉，最小距离 ${interference.minDistance.toFixed(1)}px，交叉角度 ${interference.crossAngle.toFixed(0)}°`,
      });
    }

    const highCrowding = result.crowdingZones.filter(c => c.severity !== 'low');
    for (const crowd of highCrowding) {
      get().addWarning({
        type: 'high_risk',
        level: crowd.severity === 'high' ? 'error' : 'warning',
        message: `局部拥挤: 针位 #${crowd.needleId + 1} (${crowd.feederCount}条纱线)`,
        details: `拥挤指数 ${crowd.crowdingIndex.toFixed(1)}，建议调整送纱嘴位置或角度`,
      });
    }

    const highCoupling = result.tensionCouplings.filter(c => c.couplingCoefficient > 0.3).slice(0, 5);
    for (const coupling of highCoupling) {
      const fA = yarnFeeders.find(f => f.id === coupling.feederId);
      const fB = yarnFeeders.find(f => f.id === coupling.affectedFeederId);
      get().addWarning({
        type: 'tension',
        level: coupling.couplingCoefficient > 0.5 ? 'warning' : 'info',
        message: `张力耦合: ${fA?.name || 'A'} → ${fB?.name || 'B'}`,
        details: `耦合系数 ${coupling.couplingCoefficient.toFixed(2)}，张力传递 ${coupling.tensionTransferPercent.toFixed(1)}%`,
      });
    }

    set((s) => ({
      yarnSimulationStats: s.yarnSimulationStats
        ? { ...s.yarnSimulationStats, multiYarnResult: result }
        : null,
    }));
  },

  predictQuality: () => {
    const state = get();
    const { yarnFeeders, needles, totalNeedles, baseTension, patternPeriod, yarnMaterials, yarnSimulationStats } = state;

    if (yarnFeeders.filter(f => f.enabled).length === 0) {
      set({ qualityPrediction: null });
      return null;
    }

    const result = runFullMultiYarnSimulation(
      yarnFeeders,
      needles,
      totalNeedles,
      baseTension,
      patternPeriod,
      yarnMaterials,
      yarnSimulationStats?.analysisResult || null,
      yarnSimulationStats?.lastFrame || null
    );

    set({ qualityPrediction: result.qualityPrediction });
    return result.qualityPrediction;
  },

  setOptimizationTargets: (targets: Partial<OptimizationTarget>) => {
    set((state) => ({
      optimizationTargets: { ...state.optimizationTargets, ...targets },
    }));
  },

  setOptimizationConstraints: (constraints: Partial<OptimizationConstraints>) => {
    set((state) => ({
      optimizationConstraints: { ...state.optimizationConstraints, ...constraints },
    }));
  },

  startOptimizationSearch: () => {
    set({ isOptimizing: true, optimizationResult: null });

    setTimeout(() => {
      const state = get();
      const {
        optimizationTargets,
        optimizationConstraints,
        yarnMaterials,
        totalNeedles,
        needles,
      } = state;

      const candidates: OptimizationCandidate[] = [];
      const iterations = 30;
      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        const tension = optimizationConstraints.tensionRange[0] +
          Math.random() * (optimizationConstraints.tensionRange[1] - optimizationConstraints.tensionRange[0]);
        const speed = optimizationConstraints.speedRange[0] +
          Math.random() * (optimizationConstraints.speedRange[1] - optimizationConstraints.speedRange[0]);
        const period = Math.floor(
          optimizationConstraints.patternPeriodRange[0] +
          Math.random() * (optimizationConstraints.patternPeriodRange[1] - optimizationConstraints.patternPeriodRange[0])
        );

        const feederCount = 2 + Math.floor(Math.random() * 3);
        const feeders: YarnFeederConfig[] = [];
        const usedMaterials: string[] = [];

        for (let j = 0; j < feederCount; j++) {
          const material = yarnMaterials[Math.floor(Math.random() * yarnMaterials.length)];
          if (!usedMaterials.includes(material.name)) usedMaterials.push(material.name);

          const position = optimizationConstraints.feederPositionRange[0] +
            Math.random() * (optimizationConstraints.feederPositionRange[1] - optimizationConstraints.feederPositionRange[0]);
          const angle = optimizationConstraints.guideAngleRange[0] +
            Math.random() * (optimizationConstraints.guideAngleRange[1] - optimizationConstraints.guideAngleRange[0]);

          feeders.push({
            id: generateId(),
            name: `送纱嘴 ${j + 1}`,
            position: clamp(position, 0, totalNeedles - 1),
            yarnLength: 100 + Math.random() * 200,
            guideAngle: clamp(angle, MIN_GUIDE_ANGLE, MAX_GUIDE_ANGLE),
            frictionCoefficient: clamp(MIN_FRICTION + Math.random() * 0.3, MIN_FRICTION, MAX_FRICTION),
            color: YARN_FEEDER_COLORS[j % YARN_FEEDER_COLORS.length],
            enabled: true,
            materialId: material.id,
          });
        }

        const testNeedles = needles.map(n => ({
          ...n,
          tension: clamp(tension + (Math.random() - 0.5) * 15, MIN_TENSION, MAX_TENSION),
        }));

        const simResult = runFullMultiYarnSimulation(
          feeders,
          testNeedles,
          totalNeedles,
          tension,
          period,
          yarnMaterials,
          null,
          null
        );

        const quality = simResult.qualityPrediction;
        const productivity = speed * 60 * (totalNeedles / 48);

        const qualityScore = quality.overallQualityScore;
        const breakRiskScore = Math.max(0, 100 - quality.breakageProbability);
        const wearScore = Math.min(100, (quality.wearLifetime / 10000) * 100);
        const productivityScore = Math.min(100, (productivity / optimizationTargets.productivityTarget) * 100);

        const qualityWeight = 0.35;
        const breakRiskWeight = 0.25;
        const wearWeight = 0.2;
        const productivityWeight = 0.2;

        const totalScore =
          qualityScore * qualityWeight +
          breakRiskScore * breakRiskWeight +
          wearScore * wearWeight +
          productivityScore * productivityWeight;

        const advantages: string[] = [];
        const disadvantages: string[] = [];

        if (quality.overallQualityScore >= 80) advantages.push('质量优秀');
        else if (quality.overallQualityScore >= 65) advantages.push('质量良好');
        else disadvantages.push('质量一般');

        if (quality.breakageProbability <= 25) advantages.push('断线风险低');
        else if (quality.breakageProbability >= 50) disadvantages.push('断线风险较高');

        if (quality.wearLifetime >= 7000) advantages.push('磨损寿命长');
        else if (quality.wearLifetime <= 4000) disadvantages.push('磨损寿命短');

        if (productivity >= optimizationTargets.productivityTarget) advantages.push('产能达标');
        else disadvantages.push('产能不足');

        if (simResult.interferences.length === 0) advantages.push('无路径干涉');
        else if (simResult.interferences.filter(i => i.interferenceLevel === 'high').length > 0) disadvantages.push('存在严重干涉');

        if (simResult.crowdingZones.filter(c => c.severity === 'high').length === 0) advantages.push('无严重拥挤');
        else disadvantages.push('局部拥挤严重');

        const tradeoffNotes = quality.breakageProbability < 30 && productivity < 80
          ? '高质量低产速，适合高端订单'
          : quality.breakageProbability > 50 && productivity > 120
          ? '高产速高风险，需监控维护'
          : '质量与产能相对均衡';

        candidates.push({
          id: generateId(),
          name: `方案 ${i + 1}`,
          score: Number(totalScore.toFixed(1)),
          rank: 0,
          baseTension: Number(tension.toFixed(1)),
          rotationSpeed: Number(speed.toFixed(2)),
          patternPeriod: period,
          yarnFeeders: feeders,
          materialCombination: usedMaterials,
          qualityPrediction: quality,
          productivity: Number(productivity.toFixed(1)),
          advantages,
          disadvantages,
          tradeoffNotes,
        });
      }

      candidates.sort((a, b) => b.score - a.score);
      candidates.forEach((c, i) => { c.rank = i + 1; });

      const topCandidates = candidates.slice(0, 8);

      const result: OptimizationResult = {
        candidates: topCandidates,
        searchIterations: iterations,
        bestScore: topCandidates[0]?.score || 0,
        searchTime: Date.now() - startTime,
      };

      set({
        optimizationResult: result,
        isOptimizing: false,
        selectedCandidateId: topCandidates[0]?.id || null,
      });
    }, 800);
  },

  stopOptimizationSearch: () => {
    set({ isOptimizing: false });
  },

  selectOptimizationCandidate: (id: string) => {
    set({ selectedCandidateId: id });
  },

  applyOptimizationCandidate: (id: string) => {
    const state = get();
    const candidate = state.optimizationResult?.candidates.find(c => c.id === id);
    if (!candidate) return;

    set({
      baseTension: candidate.baseTension,
      rotationSpeed: candidate.rotationSpeed,
      patternPeriod: candidate.patternPeriod,
      yarnFeeders: candidate.yarnFeeders.map(f => ({ ...f })),
      needles: state.needles.map((n, i) => ({
        ...n,
        tension: clamp(candidate.baseTension + Math.sin(i * 0.5) * 5, MIN_TENSION, MAX_TENSION),
      })),
    });

    setTimeout(() => {
      get().checkForWarnings();
      get().checkYarnWarnings();
      get().runMultiYarnSimulation();
      get().predictQuality();
    }, 50);
  },

  addWorkOrder: (order: Omit<WorkOrder, 'id' | 'status'>) => {
    const newOrder: WorkOrder = {
      ...order,
      id: generateId(),
      status: 'pending',
    };
    set((state) => ({ workOrders: [...state.workOrders, newOrder] }));
  },

  removeWorkOrder: (id: string) => {
    set((state) => ({
      workOrders: state.workOrders.filter(o => o.id !== id),
    }));
  },

  updateWorkOrder: (id: string, updates: Partial<WorkOrder>) => {
    set((state) => ({
      workOrders: state.workOrders.map(o =>
        o.id === id ? { ...o, ...updates } : o
      ),
    }));
  },

  runBatchScheduling: () => {
    set({ isScheduling: true, scheduleResult: null });

    setTimeout(() => {
      const state = get();
      const { workOrders, yarnMaterials, totalNeedles, needles } = state;

      const items: ScheduleItem[] = [];
      let currentTime = Date.now();
      const priorityOrder = { high: 0, medium: 1, low: 2 };

      const sortedOrders = [...workOrders].sort((a, b) => {
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.deadline - b.deadline;
      });

      const qualityGradeScores: Record<string, number> = { A: 85, B: 70, C: 55, D: 40 };

      for (const order of sortedOrders) {
        const targetQuality = qualityGradeScores[order.requirements.qualityGrade] || 60;
        const targetWear = order.requirements.minWearLifetime;
        const maxBreak = order.requirements.maxBreakRisk;

        let bestScheme: OptimizationCandidate | null = null;
        let bestScore = -Infinity;

        for (let attempt = 0; attempt < 15; attempt++) {
          const tension = 30 + Math.random() * 40;
          const speed = 0.5 + Math.random() * 4;
          const period = 4 + Math.floor(Math.random() * 12);
          const feederCount = 2 + Math.floor(Math.random() * 3);

          const feeders: YarnFeederConfig[] = [];
          for (let j = 0; j < feederCount; j++) {
            const material = yarnMaterials[Math.floor(Math.random() * yarnMaterials.length)];
            feeders.push({
              id: generateId(),
              name: `送纱嘴 ${j + 1}`,
              position: (j / feederCount) * totalNeedles,
              yarnLength: 120 + Math.random() * 150,
              guideAngle: 25 + Math.random() * 40,
              frictionCoefficient: 0.08 + Math.random() * 0.2,
              color: YARN_FEEDER_COLORS[j % YARN_FEEDER_COLORS.length],
              enabled: true,
              materialId: material.id,
            });
          }

          const testNeedles = needles.map(n => ({
            ...n,
            tension: clamp(tension + (Math.random() - 0.5) * 10, MIN_TENSION, MAX_TENSION),
          }));

          const simResult = runFullMultiYarnSimulation(
            feeders, testNeedles, totalNeedles, tension, period, yarnMaterials, null, null
          );

          const quality = simResult.qualityPrediction;
          const productivity = speed * 60 * (totalNeedles / 48);

          const qualityMatch = quality.overallQualityScore >= targetQuality ? 1 : 0;
          const wearMatch = quality.wearLifetime >= targetWear ? 1 : 0;
          const breakMatch = quality.breakageProbability <= maxBreak ? 1 : 0;

          const score = productivity + qualityMatch * 50 + wearMatch * 30 + breakMatch * 20;

          if (score > bestScore && quality.overallQualityScore >= targetQuality * 0.9) {
            bestScore = score;
            bestScheme = {
              id: generateId(),
              name: `${order.sockType}方案`,
              score: 0,
              rank: 0,
              baseTension: Number(tension.toFixed(1)),
              rotationSpeed: Number(speed.toFixed(2)),
              patternPeriod: period,
              yarnFeeders: feeders,
              materialCombination: [],
              qualityPrediction: quality,
              productivity: Number(productivity.toFixed(1)),
              advantages: [],
              disadvantages: [],
              tradeoffNotes: '',
            };
          }
        }

        const warnings: string[] = [];
        if (bestScheme) {
          if (bestScheme.qualityPrediction.breakageProbability > maxBreak) {
            warnings.push('断线风险接近上限，建议降低转速');
          }
          if (bestScheme.qualityPrediction.wearLifetime < targetWear) {
            warnings.push('磨损寿命略低于要求，需定期检查');
          }
          if (bestScheme.qualityPrediction.overallQualityScore < targetQuality) {
            warnings.push('质量评分略低于目标等级');
          }
        } else {
          warnings.push('未能找到完全满足要求的方案，已选用最接近方案');
        }

        const estTime = order.batchSize / (bestScheme?.productivity || 50) * 60;
        const startTime = currentTime;
        const endTime = currentTime + estTime * 60 * 1000;
        currentTime = endTime;

        items.push({
          orderId: order.id,
          orderNo: order.orderNo,
          sockType: order.sockType,
          batchSize: order.batchSize,
          priority: order.priority,
          schemeId: bestScheme?.id,
          schemeName: bestScheme?.name,
          estimatedTime: Math.round(estTime),
          qualityPrediction: bestScheme?.qualityPrediction || {
            uniformityScore: 60,
            breakageProbability: 40,
            wearLifetime: 5000,
            patternFidelityScore: 65,
            overallQualityScore: 62,
            grade: 'C',
            details: {
              uniformity: { tensionVariance: 8, densityVariation: 5, needleCoverageRate: 90 },
              breakage: { maxTensionRatio: 0.6, weakPointCount: 3, fatigueFactor: 2 },
              wear: { avgWearRate: 30, criticalZoneCount: 2, predictedCycles: 5000 },
              pattern: { alignmentError: 5, colorShiftIndex: 3, periodAccuracy: 85 },
            },
          },
          startTime,
          endTime,
          warnings,
        });
      }

      const totalTime = items.length > 0
        ? Math.round((items[items.length - 1].endTime! - items[0].startTime!) / 60000)
        : 0;

      const avgQuality = items.length > 0
        ? items.reduce((s, i) => s + i.qualityPrediction.overallQualityScore, 0) / items.length
        : 0;

      const bottleneckOrders = items
        .filter(i => i.warnings.length > 0)
        .map(i => i.orderNo);

      const suggestions: string[] = [];
      if (bottleneckOrders.length > 0) {
        suggestions.push(`${bottleneckOrders.length} 个订单存在风险，建议优先处理`);
      }
      if (avgQuality < 70) {
        suggestions.push('整体质量偏低，建议优化材质组合');
      }
      if (totalTime > 1440) {
        suggestions.push('总排程时间较长，建议增加设备并行生产');
      }
      suggestions.push('按优先级排序可确保高优订单按时交付');

      const result: ScheduleResult = {
        items,
        totalTime,
        totalOrders: items.length,
        averageQuality: Number(avgQuality.toFixed(1)),
        bottleneckOrders,
        optimizationSuggestions: suggestions,
      };

      set({
        scheduleResult: result,
        isScheduling: false,
        workOrders: state.workOrders.map(o => ({
          ...o,
          status: 'scheduled' as const,
        })),
      });
    }, 1000);
  },

  applyScheduleScheme: (orderId: string) => {
    const state = get();
    const item = state.scheduleResult?.items.find(i => i.orderId === orderId);
    if (!item) return;

    const order = state.workOrders.find(o => o.id === orderId);
    if (order) {
      state.updateWorkOrder(orderId, { status: 'processing' });
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
  const { schemes, currentSchemeId, compareSchemeId, yarnMaterials } = useCylinderStore();

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

  const currentQuality = calculateQualityPrediction(
    null, [], [], [],
    currentScheme.yarnFeeders || [],
    currentScheme.needles,
    currentScheme.patternPeriod,
    currentScheme.totalNeedles,
    yarnMaterials
  );

  const compareQuality = calculateQualityPrediction(
    null, [], [], [],
    compareScheme.yarnFeeders || [],
    compareScheme.needles,
    compareScheme.patternPeriod,
    compareScheme.totalNeedles,
    yarnMaterials
  );

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
      quality: currentQuality,
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
      quality: compareQuality,
    },
    diff: {
      enabledCount: currentEnabled - compareEnabled,
      avgTension: currentAvgTension - compareAvgTension,
      highRiskCount: currentHighRisk - compareHighRisk,
      patternPeriod: currentScheme.patternPeriod - compareScheme.patternPeriod,
      rotationSpeed: currentScheme.rotationSpeed - compareScheme.rotationSpeed,
      feederCount: currentFeederCount - compareFeederCount,
      avgFriction: currentAvgFriction - compareAvgFriction,
      quality: {
        overall: currentQuality.overallQualityScore - compareQuality.overallQualityScore,
        uniformity: currentQuality.uniformityScore - compareQuality.uniformityScore,
        breakage: currentQuality.breakageProbability - compareQuality.breakageProbability,
        wear: currentQuality.wearLifetime - compareQuality.wearLifetime,
        pattern: currentQuality.patternFidelityScore - compareQuality.patternFidelityScore,
      },
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
