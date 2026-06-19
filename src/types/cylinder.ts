export interface Needle {
  id: number;
  enabled: boolean;
  tension: number;
}

export interface NeedleRiskStats {
  id: number;
  totalRiskScore: number;
  highRiskDuration: number;
  currentRisk: number;
}

export interface YarnMaterial {
  id: string;
  name: string;
  elasticity: number;
  thickness: number;
  wearResistance: number;
  colorMapping: string;
  tensileStrength: number;
  breakingElongation: number;
  density: number;
}

export interface PathInterference {
  feederA: string;
  feederB: string;
  needleIds: number[];
  interferenceLevel: 'low' | 'medium' | 'high';
  minDistance: number;
  crossAngle: number;
}

export interface TensionCoupling {
  feederId: string;
  affectedFeederId: string;
  couplingCoefficient: number;
  tensionTransferPercent: number;
  affectedNeedleIds: number[];
}

export interface LocalCrowding {
  needleId: number;
  feederCount: number;
  crowdingIndex: number;
  feederIds: string[];
  severity: 'low' | 'medium' | 'high';
}

export interface QualityPrediction {
  uniformityScore: number;
  breakageProbability: number;
  wearLifetime: number;
  patternFidelityScore: number;
  overallQualityScore: number;
  grade: 'A' | 'B' | 'C' | 'D';
  details: {
    uniformity: {
      tensionVariance: number;
      densityVariation: number;
      needleCoverageRate: number;
    };
    breakage: {
      maxTensionRatio: number;
      weakPointCount: number;
      fatigueFactor: number;
    };
    wear: {
      avgWearRate: number;
      criticalZoneCount: number;
      predictedCycles: number;
    };
    pattern: {
      alignmentError: number;
      colorShiftIndex: number;
      periodAccuracy: number;
    };
  };
}

export interface MultiYarnSimulationResult {
  interferences: PathInterference[];
  tensionCouplings: TensionCoupling[];
  crowdingZones: LocalCrowding[];
  qualityPrediction: QualityPrediction;
  synchronizedTensionMap: number[][];
}

export interface YarnFeederConfig {
  id: string;
  name: string;
  position: number;
  yarnLength: number;
  guideAngle: number;
  frictionCoefficient: number;
  color: string;
  enabled: boolean;
  materialId?: string;
  deliveryRate?: number;
  tensionOffset?: number;
}

export interface YarnPathPoint {
  needleId: number;
  x: number;
  y: number;
  tension: number;
  stretch: number;
  wearLevel: number;
  angle: number;
}

export interface YarnPathSegment {
  from: YarnPathPoint;
  to: YarnPathPoint;
  length: number;
  tensionVariation: number;
  stretchRatio: number;
  wearRisk: number;
}

export interface YarnDeliveryStats {
  fluctuation: number;
  fluctuationPercent: number;
  avgDeliveryRate: number;
  maxDeliveryRate: number;
  minDeliveryRate: number;
}

export interface StretchPeak {
  needleId: number;
  value: number;
  timestamp: number;
  severity: 'low' | 'medium' | 'high';
}

export interface WearZone {
  startNeedle: number;
  endNeedle: number;
  avgWearLevel: number;
  totalPasses: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface YarnBreakWarning {
  id: string;
  type: 'break_risk' | 'excessive_stretch' | 'high_wear' | 'delivery_fluctuation' | 'angle_violation';
  level: 'info' | 'warning' | 'error';
  message: string;
  details?: string;
  needleId?: number;
  feederId?: string;
  value?: number;
  threshold?: number;
  timestamp: number;
}

export interface YarnSimulationFrame {
  rotation: number;
  paths: Record<string, YarnPathSegment[]>;
  deliveryStats: Record<string, YarnDeliveryStats>;
  stretchPeaks: StretchPeak[];
  wearZones: WearZone[];
  totalWearPerNeedle: number[];
}

export interface YarnAnalysisResult {
  overallStability: number;
  breakRiskScore: number;
  avgFluctuation: number;
  maxStretchPeak: number;
  criticalWearZones: WearZone[];
  topRiskNeedles: number[];
}

export interface PatternScheme {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  totalNeedles: number;
  needles: Needle[];
  patternPeriod: number;
  baseTension: number;
  rotationSpeed: number;
  yarnFeeders: YarnFeederConfig[];
  description?: string;
}

export interface Warning {
  id: string;
  type: 'tension' | 'speed' | 'needle_distribution' | 'high_risk' | 'break_risk' | 'excessive_stretch' | 'high_wear' | 'delivery_fluctuation' | 'angle_violation';
  level: 'info' | 'warning' | 'error';
  message: string;
  details?: string;
  timestamp: number;
}

export interface SimulationStats {
  totalRuntime: number;
  totalRotations: number;
  avgTensionOverTime: number;
  maxTensionReached: number;
  needleRiskStats: NeedleRiskStats[];
}

export interface YarnSimulationStats {
  totalRuntime: number;
  totalRotations: number;
  deliveryHistory: Record<string, number[]>;
  stretchHistory: Record<string, number[]>;
  wearAccumulation: number[];
  breakWarnings: YarnBreakWarning[];
  lastFrame: YarnSimulationFrame | null;
  analysisResult: YarnAnalysisResult | null;
  multiYarnResult: MultiYarnSimulationResult | null;
}

export interface CylinderState {
  totalNeedles: number;
  needles: Needle[];
  patternPeriod: number;
  baseTension: number;
  rotationSpeed: number;
  isRunning: boolean;
  highRiskThreshold: number;
  currentSchemeId: string | null;
  schemes: PatternScheme[];
  compareSchemeId: string | null;
  showComparison: boolean;
  heatMode: boolean;
  simulationStats: SimulationStats | null;
  warnings: Warning[];
  continuousSimulation: boolean;
  yarnFeeders: YarnFeederConfig[];
  yarnSimulationEnabled: boolean;
  yarnSimulationStats: YarnSimulationStats | null;
  showYarnPath: boolean;
  showRiskHighlight: boolean;
  yarnMaterials: YarnMaterial[];
  showInterferenceHighlight: boolean;
  showCrowdingHighlight: boolean;
  showTensionCoupling: boolean;
  qualityPrediction: QualityPrediction | null;
}

export interface CylinderActions {
  toggleNeedle: (id: number) => void;
  setPatternPeriod: (period: number) => void;
  setBaseTension: (tension: number) => void;
  setRotationSpeed: (speed: number) => void;
  setTotalNeedles: (count: number) => void;
  toggleRunning: () => void;
  resetAll: () => void;
  setNeedleTension: (id: number, tension: number) => void;
  saveCurrentScheme: (name: string, description?: string) => void;
  saveAsNewScheme: (name: string, description?: string) => void;
  renameScheme: (id: string, name: string, description?: string) => void;
  duplicateScheme: (sourceId: string) => void;
  loadScheme: (id: string) => void;
  deleteScheme: (id: string) => void;
  updateScheme: (id: string, updates: Partial<PatternScheme>) => void;
  setCompareScheme: (id: string | null) => void;
  toggleComparison: () => void;
  toggleHeatMode: () => void;
  toggleContinuousSimulation: () => void;
  updateSimulationStats: (stats: Partial<SimulationStats>) => void;
  addWarning: (warning: Omit<Warning, 'id' | 'timestamp'>) => void;
  clearWarnings: () => void;
  dismissWarning: (id: string) => void;
  checkForWarnings: () => void;
  exportScheme: (id: string) => string;
  exportSimulationStats: () => string;
  importScheme: (data: string) => void;
  addYarnFeeder: () => void;
  removeYarnFeeder: (id: string) => void;
  updateYarnFeeder: (id: string, updates: Partial<YarnFeederConfig>) => void;
  toggleYarnFeeder: (id: string) => void;
  setYarnFeeders: (feeders: YarnFeederConfig[]) => void;
  toggleYarnSimulation: () => void;
  toggleShowYarnPath: () => void;
  toggleShowRiskHighlight: () => void;
  updateYarnSimulationStats: (stats: Partial<YarnSimulationStats>) => void;
  addYarnBreakWarning: (warning: Omit<YarnBreakWarning, 'id' | 'timestamp'>) => void;
  clearYarnBreakWarnings: () => void;
  resetYarnSimulation: () => void;
  checkYarnWarnings: () => void;
  addYarnMaterial: (material: Omit<YarnMaterial, 'id'>) => void;
  updateYarnMaterial: (id: string, updates: Partial<YarnMaterial>) => void;
  removeYarnMaterial: (id: string) => void;
  setYarnMaterials: (materials: YarnMaterial[]) => void;
  toggleShowInterferenceHighlight: () => void;
  toggleShowCrowdingHighlight: () => void;
  toggleShowTensionCoupling: () => void;
  runMultiYarnSimulation: () => void;
  predictQuality: () => QualityPrediction | null;
}

export type CylinderStore = CylinderState & CylinderActions;

export const HIGH_RISK_THRESHOLD = 80;
export const CRITICAL_RISK_THRESHOLD = 90;
export const DEFAULT_TOTAL_NEEDLES = 48;
export const DEFAULT_PATTERN_PERIOD = 8;
export const DEFAULT_BASE_TENSION = 50;
export const DEFAULT_ROTATION_SPEED = 1;
export const MIN_TENSION = 1;
export const MAX_TENSION = 100;
export const MIN_SPEED = 0.1;
export const MAX_SPEED = 10;
export const MAX_NEEDLES = 200;
export const WARNING_TENSION_HIGH = 75;
export const WARNING_SPEED_HIGH = 7;
export const WARNING_DISABLED_NEEDLE_RATIO = 0.3;

export const DEFAULT_YARN_LENGTH = 150;
export const MIN_YARN_LENGTH = 50;
export const MAX_YARN_LENGTH = 500;
export const DEFAULT_FRICTION = 0.15;
export const MIN_FRICTION = 0.01;
export const MAX_FRICTION = 0.8;
export const DEFAULT_GUIDE_ANGLE = 45;
export const MIN_GUIDE_ANGLE = 0;
export const MAX_GUIDE_ANGLE = 90;
export const WARNING_STRETCH_THRESHOLD = 8;
export const CRITICAL_STRETCH_THRESHOLD = 15;
export const WARNING_FLUCTUATION_PERCENT = 10;
export const CRITICAL_FLUCTUATION_PERCENT = 20;
export const WARNING_WEAR_LEVEL = 50;
export const CRITICAL_WEAR_LEVEL = 80;
export const WARNING_BREAK_RISK = 70;
export const CRITICAL_BREAK_RISK = 90;
export const MAX_YARN_FEEDERS = 8;
export const YARN_FEEDER_COLORS = [
  '#ff6b6b',
  '#4ecdc4',
  '#ffe66d',
  '#a8e6cf',
  '#c7ceea',
  '#ffaaa5',
  '#ffd3b6',
  '#bae1ff',
];

export const DEFAULT_YARN_MATERIALS: Omit<YarnMaterial, 'id'>[] = [
  {
    name: '标准棉线',
    elasticity: 35,
    thickness: 28,
    wearResistance: 60,
    colorMapping: '#f5deb3',
    tensileStrength: 70,
    breakingElongation: 8,
    density: 1.54,
  },
  {
    name: '高弹涤纶',
    elasticity: 85,
    thickness: 22,
    wearResistance: 75,
    colorMapping: '#ffffff',
    tensileStrength: 85,
    breakingElongation: 25,
    density: 1.38,
  },
  {
    name: '耐磨锦纶',
    elasticity: 65,
    thickness: 20,
    wearResistance: 92,
    colorMapping: '#e8e8e8',
    tensileStrength: 90,
    breakingElongation: 18,
    density: 1.14,
  },
  {
    name: '柔软羊毛',
    elasticity: 55,
    thickness: 35,
    wearResistance: 45,
    colorMapping: '#d4c4a8',
    tensileStrength: 55,
    breakingElongation: 30,
    density: 1.31,
  },
  {
    name: '高强丝线',
    elasticity: 25,
    thickness: 15,
    wearResistance: 68,
    colorMapping: '#fffacd',
    tensileStrength: 95,
    breakingElongation: 15,
    density: 1.25,
  },
];

export const MIN_ELASTICITY = 5;
export const MAX_ELASTICITY = 100;
export const MIN_THICKNESS = 5;
export const MAX_THICKNESS = 100;
export const MIN_WEAR_RESISTANCE = 10;
export const MAX_WEAR_RESISTANCE = 100;
export const MIN_TENSILE_STRENGTH = 10;
export const MAX_TENSILE_STRENGTH = 100;
export const MIN_BREAKING_ELONGATION = 1;
export const MAX_BREAKING_ELONGATION = 50;

export const INTERFERENCE_THRESHOLD_LOW = 15;
export const INTERFERENCE_THRESHOLD_MEDIUM = 8;
export const CROWDING_THRESHOLD_LOW = 2;
export const CROWDING_THRESHOLD_MEDIUM = 3;
export const COUPLING_THRESHOLD = 0.15;
