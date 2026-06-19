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
  description?: string;
}

export interface Warning {
  id: string;
  type: 'tension' | 'speed' | 'needle_distribution' | 'high_risk';
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
  saveScheme: (name: string, description?: string) => void;
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
