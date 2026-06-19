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
} from '@/types/cylinder';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateNeedles(count: number, baseTension: number): Needle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    enabled: true,
    tension: clamp(baseTension + (Math.random() - 0.5) * 20, MIN_TENSION, MAX_TENSION),
  }));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
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
    description: '系统默认初始化方案',
  };
}

const defaultScheme = createDefaultScheme();

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

  toggleNeedle: (id: number) => {
    set((state) => ({
      needles: state.needles.map((n) =>
        n.id === id ? { ...n, enabled: !n.enabled } : n
      ),
    }));
    get().checkForWarnings();
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
  },

  toggleRunning: () => {
    set((state) => ({ isRunning: !state.isRunning }));
  },

  resetAll: () => {
    const defaultScheme = createDefaultScheme();
    set({
      totalNeedles: defaultScheme.totalNeedles,
      needles: defaultScheme.needles,
      patternPeriod: defaultScheme.patternPeriod,
      baseTension: defaultScheme.baseTension,
      rotationSpeed: defaultScheme.rotationSpeed,
      isRunning: true,
      currentSchemeId: defaultScheme.id,
      schemes: [defaultScheme],
      compareSchemeId: null,
      showComparison: false,
      heatMode: false,
      simulationStats: null,
      warnings: [],
      continuousSimulation: false,
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
  },

  saveScheme: (name: string, description?: string) => {
    const now = Date.now();
    const {
      totalNeedles,
      needles,
      patternPeriod,
      baseTension,
      rotationSpeed,
      currentSchemeId,
      schemes,
    } = get();

    const existingIndex = schemes.findIndex((s) => s.id === currentSchemeId);
    
    if (existingIndex >= 0) {
      const updatedSchemes = [...schemes];
      updatedSchemes[existingIndex] = {
        ...updatedSchemes[existingIndex],
        name,
        description,
        totalNeedles,
        needles: [...needles],
        patternPeriod,
        baseTension,
        rotationSpeed,
        updatedAt: now,
      };
      set({ schemes: updatedSchemes });
    } else {
      const newScheme: PatternScheme = {
        id: generateId(),
        name,
        description,
        totalNeedles,
        needles: [...needles],
        patternPeriod,
        baseTension,
        rotationSpeed,
        createdAt: now,
        updatedAt: now,
      };
      set({
        schemes: [...schemes, newScheme],
        currentSchemeId: newScheme.id,
      });
    }
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
        simulationStats: null,
      });
      get().checkForWarnings();
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
      set({
        schemes: filteredSchemes,
        currentSchemeId: currentSchemeId === id ? filteredSchemes[0].id : currentSchemeId,
        compareSchemeId: compareSchemeId === id ? null : compareSchemeId,
        showComparison: compareSchemeId === id ? false : undefined,
      });
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
    set((state) => ({
      continuousSimulation: !state.continuousSimulation,
      simulationStats: state.continuousSimulation
        ? state.simulationStats
        : {
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
    }));
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
      exportVersion: '1.0',
      exportedAt: new Date().toISOString(),
      scheme: {
        ...scheme,
        needles: scheme.needles.map((n) => ({ ...n })),
      },
    };
    
    return JSON.stringify(exportData, null, 2);
  },

  exportSimulationStats: (): string => {
    const { simulationStats, needles, totalNeedles, patternPeriod, baseTension, rotationSpeed } = get();
    if (!simulationStats) throw new Error('暂无模拟统计数据');
    
    const exportData = {
      exportType: 'simulation-stats',
      exportVersion: '1.0',
      exportedAt: new Date().toISOString(),
      currentConfig: {
        totalNeedles,
        patternPeriod,
        baseTension,
        rotationSpeed,
      },
      simulationStats: {
        ...simulationStats,
        needleRiskStats: simulationStats.needleRiskStats.map((s) => ({ ...s })),
      },
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
      };
      
      set((state) => ({
        schemes: [...state.schemes, newScheme],
      }));
      
      get().loadScheme(newScheme.id);
    } catch (e) {
      throw new Error('导入失败：文件格式无效');
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

  return {
    current: {
      scheme: currentScheme,
      enabledCount: currentEnabled,
      avgTension: currentAvgTension,
      highRiskCount: currentHighRisk,
      patternRepeats: currentPatternRepeats,
      patternPeriod: currentScheme.patternPeriod,
      rotationSpeed: currentScheme.rotationSpeed,
    },
    compare: {
      scheme: compareScheme,
      enabledCount: compareEnabled,
      avgTension: compareAvgTension,
      highRiskCount: compareHighRisk,
      patternRepeats: comparePatternRepeats,
      patternPeriod: compareScheme.patternPeriod,
      rotationSpeed: compareScheme.rotationSpeed,
    },
    diff: {
      enabledCount: currentEnabled - compareEnabled,
      avgTension: currentAvgTension - compareAvgTension,
      highRiskCount: currentHighRisk - compareHighRisk,
      patternPeriod: currentScheme.patternPeriod - compareScheme.patternPeriod,
      rotationSpeed: currentScheme.rotationSpeed - compareScheme.rotationSpeed,
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
