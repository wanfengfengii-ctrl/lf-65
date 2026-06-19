import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { useCylinderStore, useHeatMapData } from '@/store/cylinderStore';
import { Needle, HIGH_RISK_THRESHOLD } from '@/types/cylinder';

const COLORS = {
  cylinderBase: 0x2a3f5f,
  cylinderInner: 0x1a2942,
  needleEnabled: 0x00d4ff,
  needleDisabled: 0x3a4a6a,
  needleHighRisk: 0xff4757,
  needleMediumRisk: 0xff6b35,
  needleLowRisk: 0xffd700,
  patternMarker: 0xffd700,
  center: 0x0a1628,
  ringOuter: 0x3d5a80,
  ringInner: 0x1e3a5f,
};

export default function NeedleCylinder() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<PIXI.Renderer | null>(null);
  const stageRef = useRef<PIXI.Container | null>(null);
  const cylinderGroupRef = useRef<PIXI.Container | null>(null);
  const needleSpritesRef = useRef<PIXI.Graphics[]>([]);
  const animationRef = useRef<number>(0);
  const isMounted = useRef(true);
  const isRunningRef = useRef(true);
  const rotationSpeedRef = useRef(1);
  const [size, setSize] = useState(400);
  const lastRiskUpdateRef = useRef(0);

  const {
    needles,
    patternPeriod,
    rotationSpeed,
    isRunning,
    highRiskThreshold,
    toggleNeedle,
    heatMode,
    continuousSimulation,
    simulationStats,
    updateSimulationStats,
  } = useCylinderStore();

  const heatMapData = useHeatMapData();

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    rotationSpeedRef.current = rotationSpeed;
  }, [rotationSpeed]);

  useEffect(() => {
    isMounted.current = true;

    if (!containerRef.current) return;

    const updateSize = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const newSize = Math.min(containerWidth, 480);
      setSize(Math.max(newSize, 200));
    };

    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(containerRef.current);

    const width = size;
    const height = size;

    const renderer = new PIXI.Renderer({
      width,
      height,
      antialias: true,
      backgroundAlpha: 0,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    rendererRef.current = renderer;
    containerRef.current.appendChild(renderer.view as HTMLCanvasElement);

    const stage = new PIXI.Container();
    stageRef.current = stage;

    const centerX = width / 2;
    const centerY = height / 2;

    const background = new PIXI.Graphics();
    background.beginFill(0x0a1628, 0.5);
    background.drawCircle(centerX, centerY, Math.min(width, height) / 2 - 10);
    background.endFill();
    stage.addChild(background);

    const outerRing = new PIXI.Graphics();
    outerRing.lineStyle(4, COLORS.ringOuter, 1);
    outerRing.drawCircle(centerX, centerY, Math.min(width, height) / 2 - 20);
    stage.addChild(outerRing);

    const cylinderGroup = new PIXI.Container();
    cylinderGroup.x = centerX;
    cylinderGroup.y = centerY;
    stage.addChild(cylinderGroup);
    cylinderGroupRef.current = cylinderGroup;

    const baseCircle = new PIXI.Graphics();
    baseCircle.beginFill(COLORS.cylinderBase);
    baseCircle.drawCircle(0, 0, Math.min(width, height) / 2 - 40);
    baseCircle.endFill();
    cylinderGroup.addChild(baseCircle);

    const innerCircle = new PIXI.Graphics();
    innerCircle.beginFill(COLORS.cylinderInner);
    innerCircle.drawCircle(0, 0, Math.min(width, height) / 2 - 80);
    innerCircle.endFill();
    cylinderGroup.addChild(innerCircle);

    const centerCircle = new PIXI.Graphics();
    centerCircle.beginFill(COLORS.center);
    centerCircle.drawCircle(0, 0, 40);
    centerCircle.endFill();
    cylinderGroup.addChild(centerCircle);

    const centerDot = new PIXI.Graphics();
    centerDot.beginFill(0x00d4ff, 0.8);
    centerDot.drawCircle(0, 0, 8);
    centerDot.endFill();
    cylinderGroup.addChild(centerDot);

    createNeedles(cylinderGroup, needles, patternPeriod, highRiskThreshold, width, height, heatMode, heatMapData);

    let lastTime = performance.now();
    let rotationAccumulator = 0;

    const animate = (currentTime: number) => {
      if (!isMounted.current || !rendererRef.current || !stageRef.current) return;

      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (cylinderGroupRef.current && isRunningRef.current) {
        const rotationDelta = rotationSpeedRef.current * deltaTime * Math.PI * 0.5;
        cylinderGroupRef.current.rotation += rotationDelta;
        
        if (continuousSimulation) {
          rotationAccumulator += Math.abs(rotationDelta);
          
          if (currentTime - lastRiskUpdateRef.current > 100) {
            lastRiskUpdateRef.current = currentTime;
            
            const rotationsPerUpdate = rotationAccumulator / (Math.PI * 2);
            rotationAccumulator = 0;
            
            updateSimulationStatsFromRunning(deltaTime, rotationsPerUpdate);
          }
        }
      }

      rendererRef.current.render(stageRef.current);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      isMounted.current = false;
      resizeObserver.disconnect();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.destroy(true);
        rendererRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  useEffect(() => {
    if (!cylinderGroupRef.current) return;
    createNeedles(
      cylinderGroupRef.current,
      needles,
      patternPeriod,
      highRiskThreshold,
      size,
      size,
      heatMode,
      heatMapData
    );
  }, [needles, patternPeriod, highRiskThreshold, size, heatMode, heatMapData]);

  function updateSimulationStatsFromRunning(deltaTime: number, rotations: number) {
    const { simulationStats, needles, baseTension, rotationSpeed } = useCylinderStore.getState();
    if (!simulationStats) return;

    const newRuntime = simulationStats.totalRuntime + deltaTime;
    const newRotations = simulationStats.totalRotations + rotations;
    
    const enabledNeedles = needles.filter((n) => n.enabled);
    const currentAvgTension =
      enabledNeedles.length > 0
        ? enabledNeedles.reduce((sum, n) => sum + n.tension, 0) / enabledNeedles.length
        : 0;
    
    const newAvgTension =
      (simulationStats.avgTensionOverTime * simulationStats.totalRuntime +
        currentAvgTension * deltaTime) /
      newRuntime;

    const currentMaxTension = Math.max(...needles.map((n) => n.tension));
    const newMaxTension = Math.max(simulationStats.maxTensionReached, currentMaxTension);

    const speedFactor = rotationSpeed / 5;
    const tensionFactor = baseTension / 50;

    const newRiskStats = simulationStats.needleRiskStats.map((stat) => {
      const needle = needles.find((n) => n.id === stat.id);
      if (!needle || !needle.enabled) return stat;

      const tensionRisk = Math.max(0, (needle.tension - 50) / 50);
      const riskIncrement = tensionRisk * speedFactor * tensionFactor * deltaTime * 10;
      
      const isHighRisk = needle.tension > HIGH_RISK_THRESHOLD;
      
      return {
        ...stat,
        totalRiskScore: stat.totalRiskScore + riskIncrement,
        highRiskDuration: isHighRisk
          ? stat.highRiskDuration + deltaTime
          : stat.highRiskDuration,
        currentRisk: tensionRisk,
      };
    });

    updateSimulationStats({
      totalRuntime: newRuntime,
      totalRotations: newRotations,
      avgTensionOverTime: newAvgTension,
      maxTensionReached: newMaxTension,
      needleRiskStats: newRiskStats,
    });
  }

  function createNeedles(
    container: PIXI.Container,
    needleData: Needle[],
    period: number,
    riskThreshold: number,
    width: number,
    height: number,
    isHeatMode: boolean,
    heatData: Array<{ id: number; color: string; riskLevel: number }>
  ) {
    needleSpritesRef.current.forEach((sprite) => {
      container.removeChild(sprite);
      sprite.destroy();
    });
    needleSpritesRef.current = [];

    const radius = Math.min(width, height) / 2 - 60;
    const total = needleData.length;
    const needleSize = Math.max(4, Math.min(10, width / 48));

    for (let i = 0; i < total; i++) {
      const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      const needle = needleData[i];
      const heatDatum = heatData.find((h) => h.id === needle.id);
      const isHighRisk = needle.enabled && needle.tension > riskThreshold;
      const isPatternMarker = i % period === 0;

      const needleGraphic = new PIXI.Graphics();

      if (needle.enabled) {
        let color = COLORS.needleEnabled;
        
        if (isHeatMode && heatDatum) {
          color = parseInt(heatDatum.color.replace('#', ''), 16);
        } else if (isHighRisk) {
          color = COLORS.needleHighRisk;
        } else if (needle.tension > 60) {
          color = COLORS.needleLowRisk;
        }

        needleGraphic.beginFill(color);
        needleGraphic.drawCircle(0, 0, needleSize);
        needleGraphic.endFill();

        if (isHeatMode && heatDatum) {
          const glowSize = needleSize + 6 + heatDatum.riskLevel * 10;
          needleGraphic.beginFill(color, 0.2 + heatDatum.riskLevel * 0.3);
          needleGraphic.drawCircle(0, 0, glowSize);
          needleGraphic.endFill();
        } else {
          needleGraphic.beginFill(color, 0.3);
          needleGraphic.drawCircle(0, 0, needleSize + 6);
          needleGraphic.endFill();
        }
      } else {
        needleGraphic.beginFill(COLORS.needleDisabled);
        needleGraphic.drawCircle(0, 0, needleSize - 3);
        needleGraphic.endFill();
      }

      if (isPatternMarker && needle.enabled) {
        needleGraphic.lineStyle(2, COLORS.patternMarker, 1);
        needleGraphic.drawCircle(0, 0, needleSize + 4);
      }

      needleGraphic.x = x;
      needleGraphic.y = y;
      needleGraphic.eventMode = 'static';
      (needleGraphic as any).cursor = 'pointer';

      const needleId = needle.id;
      needleGraphic.on('pointerdown', () => {
        toggleNeedle(needleId);
      });

      needleGraphic.on('pointerover', () => {
        if (needle.enabled) {
          needleGraphic.scale.set(1.2);
        }
      });

      needleGraphic.on('pointerout', () => {
        needleGraphic.scale.set(1);
      });

      container.addChild(needleGraphic);
      needleSpritesRef.current.push(needleGraphic);
    }
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        maxWidth: '480px',
        aspectRatio: '1 / 1',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    />
  );
}
