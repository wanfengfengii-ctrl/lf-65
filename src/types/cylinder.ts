export interface Needle {
  id: number;
  enabled: boolean;
  tension: number;
}

export interface CylinderState {
  totalNeedles: number;
  needles: Needle[];
  patternPeriod: number;
  baseTension: number;
  rotationSpeed: number;
  isRunning: boolean;
  highRiskThreshold: number;
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
}

export type CylinderStore = CylinderState & CylinderActions;

export const HIGH_RISK_THRESHOLD = 80;
export const DEFAULT_TOTAL_NEEDLES = 48;
export const DEFAULT_PATTERN_PERIOD = 8;
export const DEFAULT_BASE_TENSION = 50;
export const DEFAULT_ROTATION_SPEED = 1;
export const MIN_TENSION = 1;
export const MAX_TENSION = 100;
export const MIN_SPEED = 0.1;
export const MAX_SPEED = 10;
