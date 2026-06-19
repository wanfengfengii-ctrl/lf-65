import { create } from 'zustand';
import {
  Needle,
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
} from '@/types/cylinder';

function generateNeedles(count: number, baseTension: number): Needle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    enabled: true,
    tension: baseTension + (Math.random() - 0.5) * 20,
  }));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export const useCylinderStore = create<CylinderStore>((set, get) => ({
  totalNeedles: DEFAULT_TOTAL_NEEDLES,
  needles: generateNeedles(DEFAULT_TOTAL_NEEDLES, DEFAULT_BASE_TENSION),
  patternPeriod: DEFAULT_PATTERN_PERIOD,
  baseTension: DEFAULT_BASE_TENSION,
  rotationSpeed: DEFAULT_ROTATION_SPEED,
  isRunning: true,
  highRiskThreshold: HIGH_RISK_THRESHOLD,

  toggleNeedle: (id: number) => {
    set((state) => ({
      needles: state.needles.map((n) =>
        n.id === id ? { ...n, enabled: !n.enabled } : n
      ),
    }));
  },

  setPatternPeriod: (period: number) => {
    const { totalNeedles } = get();
    const validPeriod = Math.max(1, Math.min(period, totalNeedles));
    set({ patternPeriod: validPeriod });
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
  },

  setRotationSpeed: (speed: number) => {
    const validSpeed = clamp(speed, MIN_SPEED, MAX_SPEED);
    set({ rotationSpeed: validSpeed });
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
  },

  toggleRunning: () => {
    set((state) => ({ isRunning: !state.isRunning }));
  },

  resetAll: () => {
    set({
      totalNeedles: DEFAULT_TOTAL_NEEDLES,
      needles: generateNeedles(DEFAULT_TOTAL_NEEDLES, DEFAULT_BASE_TENSION),
      patternPeriod: DEFAULT_PATTERN_PERIOD,
      baseTension: DEFAULT_BASE_TENSION,
      rotationSpeed: DEFAULT_ROTATION_SPEED,
      isRunning: true,
    });
  },

  setNeedleTension: (id: number, tension: number) => {
    const validTension = clamp(tension, MIN_TENSION, MAX_TENSION);
    set((state) => ({
      needles: state.needles.map((n) =>
        n.id === id ? { ...n, tension: validTension } : n
      ),
    }));
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
