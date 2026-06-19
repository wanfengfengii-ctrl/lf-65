import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { useCylinderStore, useHeatMapData, calculateYarnPath, calculateDeliveryStats, detectStretchPeaks, detectWearZones, analyzeYarnStability } from '@/store/cylinderStore';
import { Needle, HIGH_RISK_THRESHOLD, YarnFeederConfig, WARNING_STRETCH_THRESHOLD, CRITICAL_STRETCH_THRESHOLD, WARNING_WEAR_LEVEL, CRITICAL_WEAR_LEVEL } from '@/types/cylinder';

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

function hexToNum(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

function getRiskColor(level: number, type: 'stretch' | 'wear'): number {
  if (type === 'stretch') {
    if (level > CRITICAL_STRETCH_THRESHOLD) return 0xff0000;
    if (level > WARNING_STRETCH_THRESHOLD) return 0xff4757;
    if (level > WARNING_STRETCH_THRESHOLD * 0.6) return 0xff6b35;
  } else {
    if (level > CRITICAL_WEAR_LEVEL) return 0xff0000;
    if (level > WARNING_WEAR_LEVEL) return 0xff4757;
    if (level > WARNING_WEAR_LEVEL * 0.6) return 0xff6b35;
  }
  return 0;
}

export default function NeedleCylinder() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<PIXI.Renderer | null>(null);
  const stageRef = useRef<PIXI.Container | null>(null);
  const cylinderGroupRef = useRef<PIXI.Container | null>(null);
  const yarnPathLayerRef = useRef<PIXI.Container | null>(null);
  const feederMarkerLayerRef = useRef<PIXI.Container | null>(null);
  const riskHighlightLayerRef = useRef<PIXI.Container | null>(null);
  const interferenceLayerRef = useRef<PIXI.Container | null>(null);
  const crowdingLayerRef = useRef<PIXI.Container | null>(null);
  const couplingLayerRef = useRef<PIXI.Container | null>(null);
  const needleSpritesRef = useRef<PIXI.Graphics[]>([]);
  const animationRef = useRef<number>(0);
  const isMounted = useRef(true);
  const isRunningRef = useRef(true);
  const rotationSpeedRef = useRef(1);
  const rotationRef = useRef(0);
  const totalRotationRef = useRef(0);
  const [size, setSize] = useState(400);
  const lastRiskUpdateRef = useRef(0);
  const lastYarnUpdateRef = useRef(0);
  const lastMultiYarnUpdateRef = useRef(0);

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
    yarnFeeders,
    yarnSimulationEnabled,
    showYarnPath,
    showRiskHighlight,
    yarnSimulationStats,
    updateYarnSimulationStats,
    baseTension,
    totalNeedles,
    addYarnBreakWarning,
    showInterferenceHighlight,
    showCrowdingHighlight,
    showTensionCoupling,
    runMultiYarnSimulation,
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

    const yarnPathLayer = new PIXI.Container();
    yarnPathLayer.x = centerX;
    yarnPathLayer.y = centerY;
    stage.addChild(yarnPathLayer);
    yarnPathLayerRef.current = yarnPathLayer;

    const feederMarkerLayer = new PIXI.Container();
    feederMarkerLayer.x = centerX;
    feederMarkerLayer.y = centerY;
    stage.addChild(feederMarkerLayer);
    feederMarkerLayerRef.current = feederMarkerLayer;

    const riskHighlightLayer = new PIXI.Container();
    riskHighlightLayer.x = centerX;
    riskHighlightLayer.y = centerY;
    stage.addChild(riskHighlightLayer);
    riskHighlightLayerRef.current = riskHighlightLayer;

    const interferenceLayer = new PIXI.Container();
    interferenceLayer.x = centerX;
    interferenceLayer.y = centerY;
    stage.addChild(interferenceLayer);
    interferenceLayerRef.current = interferenceLayer;

    const crowdingLayer = new PIXI.Container();
    crowdingLayer.x = centerX;
    crowdingLayer.y = centerY;
    stage.addChild(crowdingLayer);
    crowdingLayerRef.current = crowdingLayer;

    const couplingLayer = new PIXI.Container();
    couplingLayer.x = centerX;
    couplingLayer.y = centerY;
    stage.addChild(couplingLayer);
    couplingLayerRef.current = couplingLayer;

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
        rotationRef.current += rotationDelta;
        totalRotationRef.current += Math.abs(rotationDelta);
        
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

      if (yarnSimulationEnabled && currentTime - lastYarnUpdateRef.current > 50) {
        lastYarnUpdateRef.current = currentTime;
        updateYarnPathVisualization();
        updateFeederMarkers();
        if (showRiskHighlight) {
          updateRiskHighlights();
        }
        if (showInterferenceHighlight || showCrowdingHighlight || showTensionCoupling) {
          if (currentTime - lastMultiYarnUpdateRef.current > 200) {
            lastMultiYarnUpdateRef.current = currentTime;
            runMultiYarnSimulation();
          }
          updateMultiYarnVisualization();
        }
        if (continuousSimulation && isRunningRef.current) {
          updateYarnSimulationFromRunning(deltaTime);
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

  useEffect(() => {
    if (!yarnSimulationEnabled || !yarnPathLayerRef.current || !feederMarkerLayerRef.current) {
      if (yarnPathLayerRef.current) {
        yarnPathLayerRef.current.removeChildren();
      }
      if (feederMarkerLayerRef.current) {
        feederMarkerLayerRef.current.removeChildren();
      }
      if (riskHighlightLayerRef.current) {
        riskHighlightLayerRef.current.removeChildren();
      }
      if (interferenceLayerRef.current) {
        interferenceLayerRef.current.removeChildren();
      }
      if (crowdingLayerRef.current) {
        crowdingLayerRef.current.removeChildren();
      }
      if (couplingLayerRef.current) {
        couplingLayerRef.current.removeChildren();
      }
      return;
    }
    updateYarnPathVisualization();
    updateFeederMarkers();
    if (showRiskHighlight) {
      updateRiskHighlights();
    }
    updateMultiYarnVisualization();
  }, [yarnFeeders, showYarnPath, showRiskHighlight, yarnSimulationEnabled, size, totalNeedles, showInterferenceHighlight, showCrowdingHighlight, showTensionCoupling]);

  function updateYarnPathVisualization() {
    if (!yarnPathLayerRef.current) return;
    yarnPathLayerRef.current.removeChildren();

    if (!showYarnPath || !yarnSimulationEnabled) return;

    const radius = Math.min(size, size) / 2 - 60;
    const rotation = cylinderGroupRef.current?.rotation || 0;

    for (const feeder of yarnFeeders) {
      if (!feeder.enabled) continue;

      const segments = calculateYarnPath(
        feeder,
        needles,
        totalNeedles,
        rotation,
        baseTension,
        radius
      );

      const color = hexToNum(feeder.color);

      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        const line = new PIXI.Graphics();
        
        let lineColor = color;
        let lineWidth = 2;
        let alpha = 0.8;

        if (showRiskHighlight) {
          const maxRisk = Math.max(seg.stretchRatio, seg.wearRisk / 2);
          if (maxRisk > CRITICAL_STRETCH_THRESHOLD) {
            lineColor = 0xff0000;
            lineWidth = 4;
            alpha = 1;
          } else if (maxRisk > WARNING_STRETCH_THRESHOLD) {
            lineColor = 0xff4757;
            lineWidth = 3;
            alpha = 0.95;
          } else if (maxRisk > WARNING_STRETCH_THRESHOLD * 0.6) {
            lineColor = 0xff6b35;
            lineWidth = 2.5;
            alpha = 0.9;
          }
        }

        line.lineStyle(lineWidth, lineColor, alpha);
        line.moveTo(seg.from.x, seg.from.y);
        line.lineTo(seg.to.x, seg.to.y);
        yarnPathLayerRef.current.addChild(line);

        if (showRiskHighlight && (seg.stretchRatio > WARNING_STRETCH_THRESHOLD * 0.6 || seg.wearRisk > WARNING_WEAR_LEVEL * 0.6)) {
          const pulse = new PIXI.Graphics();
          const pulseSize = 6 + Math.sin(Date.now() / 200 + i) * 2;
          pulse.beginFill(lineColor, 0.3);
          pulse.drawCircle(seg.to.x, seg.to.y, pulseSize);
          pulse.endFill();
          yarnPathLayerRef.current.addChild(pulse);
        }
      }

      const flowAnim = (Date.now() / 100) % 1;
      for (let i = 0; i < segments.length; i++) {
        if ((i + flowAnim) % 3 < 1) {
          const seg = segments[i];
          const dot = new PIXI.Graphics();
          const t = (flowAnim + (i % 1)) % 1;
          const x = seg.from.x + (seg.to.x - seg.from.x) * t;
          const y = seg.from.y + (seg.to.y - seg.from.y) * t;
          dot.beginFill(color, 0.6);
          dot.drawCircle(x, y, 3);
          dot.endFill();
          yarnPathLayerRef.current.addChild(dot);
        }
      }
    }
  }

  function updateFeederMarkers() {
    if (!feederMarkerLayerRef.current) return;
    feederMarkerLayerRef.current.removeChildren();

    if (!yarnSimulationEnabled) return;

    const radius = Math.min(size, size) / 2 - 60;
    const rotation = cylinderGroupRef.current?.rotation || 0;

    for (const feeder of yarnFeeders) {
      if (!feeder.enabled) continue;

      const feederAngle = (feeder.position / totalNeedles) * Math.PI * 2 + rotation;
      const markerRadius = radius + 55;
      const x = Math.cos(feederAngle) * markerRadius;
      const y = Math.sin(feederAngle) * markerRadius;
      const color = hexToNum(feeder.color);

      const outerGlow = new PIXI.Graphics();
      const glowSize = 22 + Math.sin(Date.now() / 300) * 3;
      outerGlow.beginFill(color, 0.15);
      outerGlow.drawCircle(x, y, glowSize);
      outerGlow.endFill();
      feederMarkerLayerRef.current.addChild(outerGlow);

      const marker = new PIXI.Graphics();
      marker.beginFill(color, 0.9);
      marker.drawCircle(x, y, 12);
      marker.endFill();
      marker.lineStyle(2, 0xffffff, 0.8);
      marker.drawCircle(x, y, 12);
      feederMarkerLayerRef.current.addChild(marker);

      const inner = new PIXI.Graphics();
      inner.beginFill(0xffffff, 0.9);
      inner.drawCircle(x, y, 4);
      inner.endFill();
      feederMarkerLayerRef.current.addChild(inner);

      const indicator = new PIXI.Graphics();
      indicator.lineStyle(3, color, 1);
      indicator.moveTo(x, y);
      const lineLen = 30;
      indicator.lineTo(
        x + Math.cos(feederAngle) * lineLen,
        y + Math.sin(feederAngle) * lineLen
      );
      feederMarkerLayerRef.current.addChild(indicator);
    }
  }

  function updateRiskHighlights() {
    if (!riskHighlightLayerRef.current) return;
    riskHighlightLayerRef.current.removeChildren();

    if (!showRiskHighlight || !yarnSimulationEnabled) return;

    const radius = Math.min(size, size) / 2 - 60;
    const rotation = cylinderGroupRef.current?.rotation || 0;
    const needleSize = Math.max(4, Math.min(10, size / 48));

    for (const feeder of yarnFeeders) {
      if (!feeder.enabled) continue;

      const segments = calculateYarnPath(
        feeder,
        needles,
        totalNeedles,
        rotation,
        baseTension,
        radius
      );

      for (const seg of segments) {
        if (seg.to.needleId < 0) continue;
        
        const riskLevel = Math.max(seg.stretchRatio, seg.wearRisk / 2);
        if (riskLevel < WARNING_STRETCH_THRESHOLD * 0.5) continue;

        const needleAngle = (seg.to.needleId / totalNeedles) * Math.PI * 2 + rotation;
        const x = Math.cos(needleAngle) * radius;
        const y = Math.sin(needleAngle) * radius;

        const highlight = new PIXI.Graphics();
        let ringColor = 0xffd700;
        let ringSize = needleSize + 10;

        if (riskLevel > CRITICAL_STRETCH_THRESHOLD) {
          ringColor = 0xff0000;
          ringSize = needleSize + 18;
        } else if (riskLevel > WARNING_STRETCH_THRESHOLD) {
          ringColor = 0xff4757;
          ringSize = needleSize + 14;
        }

        const pulse = Math.sin(Date.now() / 150 + seg.to.needleId) * 0.3 + 0.7;
        highlight.lineStyle(3, ringColor, pulse);
        highlight.drawCircle(x, y, ringSize);
        riskHighlightLayerRef.current.addChild(highlight);

        if (riskLevel > WARNING_STRETCH_THRESHOLD) {
          const arc = new PIXI.Graphics();
          arc.lineStyle(2, ringColor, 0.6);
          const startAngle = needleAngle - 0.3;
          const endAngle = needleAngle + 0.3;
          arc.arc(x, y, ringSize + 4, startAngle, endAngle);
          riskHighlightLayerRef.current.addChild(arc);
        }
      }
    }
  }

  function updateMultiYarnVisualization() {
    if (interferenceLayerRef.current) {
      interferenceLayerRef.current.removeChildren();
    }
    if (crowdingLayerRef.current) {
      crowdingLayerRef.current.removeChildren();
    }
    if (couplingLayerRef.current) {
      couplingLayerRef.current.removeChildren();
    }

    if (!yarnSimulationEnabled) return;

    const state = useCylinderStore.getState();
    const multiYarnResult = state.yarnSimulationStats?.multiYarnResult;
    if (!multiYarnResult) return;

    const radius = Math.min(size, size) / 2 - 60;
    const rotation = cylinderGroupRef.current?.rotation || 0;
    const needleSize = Math.max(4, Math.min(10, size / 48));

    if (showInterferenceHighlight && interferenceLayerRef.current) {
      for (const interference of multiYarnResult.interferences) {
        const fA = yarnFeeders.find(f => f.id === interference.feederA);
        const fB = yarnFeeders.find(f => f.id === interference.feederB);
        if (!fA || !fB) continue;

        const colorA = hexToNum(fA.color);
        const colorB = hexToNum(fB.color);

        for (const needleId of interference.needleIds.slice(0, 20)) {
          const needleAngle = (needleId / totalNeedles) * Math.PI * 2 + rotation;
          const x = Math.cos(needleAngle) * radius;
          const y = Math.sin(needleAngle) * radius;

          const graphic = new PIXI.Graphics();
          const severity = interference.interferenceLevel;
          const sizeFactor = severity === 'high' ? 3 : severity === 'medium' ? 2 : 1.2;
          const pulse = Math.sin(Date.now() / 200 + needleId) * 0.3 + 0.7;
          const baseColor = severity === 'high' ? 0xff0000 : severity === 'medium' ? 0xff6b35 : 0xffd700;

          graphic.lineStyle(2, baseColor, pulse);
          graphic.drawCircle(x, y, needleSize + 10 * sizeFactor);

          graphic.lineStyle(1, colorA, 0.5);
          graphic.moveTo(x, y);
          const angleA = (fA.position / totalNeedles) * Math.PI * 2 + rotation;
          graphic.lineTo(
            x + Math.cos(angleA) * (needleSize + 20 * sizeFactor),
            y + Math.sin(angleA) * (needleSize + 20 * sizeFactor)
          );

          graphic.lineStyle(1, colorB, 0.5);
          graphic.moveTo(x, y);
          const angleB = (fB.position / totalNeedles) * Math.PI * 2 + rotation;
          graphic.lineTo(
            x + Math.cos(angleB) * (needleSize + 20 * sizeFactor),
            y + Math.sin(angleB) * (needleSize + 20 * sizeFactor)
          );

          interferenceLayerRef.current.addChild(graphic);
        }

        if (interference.interferenceLevel !== 'low') {
          const fAAngle = (fA.position / totalNeedles) * Math.PI * 2 + rotation;
          const fBAngle = (fB.position / totalNeedles) * Math.PI * 2 + rotation;
          const fAX = Math.cos(fAAngle) * (radius + 55);
          const fAY = Math.sin(fAAngle) * (radius + 55);
          const fBX = Math.cos(fBAngle) * (radius + 55);
          const fBY = Math.sin(fBAngle) * (radius + 55);

          const line = new PIXI.Graphics();
          const dash = 6;
          const gap = 4;
          const totalDist = Math.sqrt((fBX - fAX) ** 2 + (fBY - fAY) ** 2);
          const steps = Math.floor(totalDist / (dash + gap));
          line.lineStyle(2, interference.interferenceLevel === 'high' ? 0xff0000 : 0xff6b35, 0.6);
          for (let i = 0; i < steps; i++) {
            const t1 = (i * (dash + gap)) / totalDist;
            const t2 = Math.min(1, ((i * (dash + gap)) + dash) / totalDist);
            if (i === 0) {
              line.moveTo(fAX + (fBX - fAX) * t1, fAY + (fBY - fAY) * t1);
            }
            line.lineTo(fAX + (fBX - fAX) * t2, fAY + (fBY - fAY) * t2);
          }
          interferenceLayerRef.current.addChild(line);
        }
      }
    }

    if (showCrowdingHighlight && crowdingLayerRef.current) {
      for (const crowd of multiYarnResult.crowdingZones) {
        const needleAngle = (crowd.needleId / totalNeedles) * Math.PI * 2 + rotation;
        const x = Math.cos(needleAngle) * radius;
        const y = Math.sin(needleAngle) * radius;

        const graphic = new PIXI.Graphics();
        const severity = crowd.severity;
        const color = severity === 'high' ? 0xff0000 : severity === 'medium' ? 0x4ecdc4 : 0xa8e6cf;
        const ringSize = needleSize + 16 + (crowd.feederCount - 2) * 4;

        graphic.beginFill(color, 0.15 + Math.sin(Date.now() / 300) * 0.1);
        graphic.drawCircle(x, y, ringSize);
        graphic.endFill();

        for (let i = 0; i < crowd.feederCount; i++) {
          const offsetAngle = (i / crowd.feederCount) * Math.PI * 2;
          const ox = x + Math.cos(offsetAngle) * (ringSize - 4);
          const oy = y + Math.sin(offsetAngle) * (ringSize - 4);
          graphic.beginFill(color, 0.8);
          graphic.drawCircle(ox, oy, 3);
          graphic.endFill();
        }

        crowdingLayerRef.current.addChild(graphic);

        const countLabel = new PIXI.Graphics();
        countLabel.beginFill(0x0a1628, 0.9);
        countLabel.drawRoundedRect(x - 8, y - 6, 16, 12, 3);
        countLabel.endFill();
        crowdingLayerRef.current.addChild(countLabel);
      }
    }

    if (showTensionCoupling && couplingLayerRef.current) {
      const visibleCouplings = multiYarnResult.tensionCouplings
        .filter(c => c.couplingCoefficient > 0.2)
        .slice(0, 6);

      for (const coupling of visibleCouplings) {
        const fA = yarnFeeders.find(f => f.id === coupling.feederId);
        const fB = yarnFeeders.find(f => f.id === coupling.affectedFeederId);
        if (!fA || !fB) continue;

        const fAAngle = (fA.position / totalNeedles) * Math.PI * 2 + rotation;
        const fBAngle = (fB.position / totalNeedles) * Math.PI * 2 + rotation;
        const fAX = Math.cos(fAAngle) * (radius + 30);
        const fAY = Math.sin(fAAngle) * (radius + 30);
        const fBX = Math.cos(fBAngle) * (radius + 30);
        const fBY = Math.sin(fBAngle) * (radius + 30);

        const curve = new PIXI.Graphics();
        const alpha = Math.min(1, coupling.couplingCoefficient * 2);
        const lineWidth = 1 + coupling.couplingCoefficient * 3;
        const color = coupling.couplingCoefficient > 0.5 ? 0xff4757 : 0xffe66d;

        const midX = (fAX + fBX) / 2;
        const midY = (fAY + fBY) / 2;
        const dx = fBX - fAX;
        const dy = fBY - fAY;
        const perpX = -dy;
        const perpY = dx;
        const perpLen = Math.sqrt(perpX * perpX + perpY * perpY);
        const curveOffset = perpLen > 0 ? (radius * 0.15) / perpLen : 0;
        const ctrlX = midX + perpX * curveOffset;
        const ctrlY = midY + perpY * curveOffset;

        curve.lineStyle(lineWidth, color, alpha * (0.5 + Math.sin(Date.now() / 250) * 0.3));
        curve.moveTo(fAX, fAY);
        curve.quadraticCurveTo(ctrlX, ctrlY, fBX, fBY);

        couplingLayerRef.current.addChild(curve);

        for (const needleId of coupling.affectedNeedleIds.slice(0, 15)) {
          const needleAngle = (needleId / totalNeedles) * Math.PI * 2 + rotation;
          const nx = Math.cos(needleAngle) * radius;
          const ny = Math.sin(needleAngle) * radius;

          const dot = new PIXI.Graphics();
          dot.beginFill(color, alpha * 0.6);
          dot.drawCircle(nx, ny, 2);
          dot.endFill();
          couplingLayerRef.current.addChild(dot);
        }

        const labelPosX = ctrlX;
        const labelPosY = ctrlY;
        const labelBg = new PIXI.Graphics();
        labelBg.beginFill(0x0a1628, 0.85);
        labelBg.drawRoundedRect(labelPosX - 14, labelPosY - 7, 28, 14, 3);
        labelBg.endFill();
        couplingLayerRef.current.addChild(labelBg);
      }
    }
  }

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

  function updateYarnSimulationFromRunning(deltaTime: number) {
    const state = useCylinderStore.getState();
    if (!state.yarnSimulationStats) return;

    const stats = state.yarnSimulationStats;
    const radius = Math.min(size, size) / 2 - 60;
    const rotation = cylinderGroupRef.current?.rotation || 0;
    const now = Date.now();

    const newRuntime = stats.totalRuntime + deltaTime;
    const rotationsDelta = (rotationSpeedRef.current * deltaTime * 0.5);
    const newRotations = stats.totalRotations + rotationsDelta;

    const paths: Record<string, any[]> = {};
    const deliveryStats: Record<string, any> = {};
    let allPeaks: any[] = [];
    const newWearAccumulation = [...stats.wearAccumulation];

    for (const feeder of state.yarnFeeders) {
      if (!feeder.enabled) continue;

      const segs = calculateYarnPath(feeder, state.needles, state.totalNeedles, rotation, state.baseTension, radius);
      paths[feeder.id] = segs;
      deliveryStats[feeder.id] = calculateDeliveryStats(segs, state.baseTension, feeder.yarnLength);

      const peaks = detectStretchPeaks(segs, now);
      allPeaks = [...allPeaks, ...peaks];

      for (const seg of segs) {
        if (seg.to.needleId >= 0) {
          newWearAccumulation[seg.to.needleId] = (newWearAccumulation[seg.to.needleId] || 0) + seg.wearRisk * deltaTime * 0.1;
        }
      }

      const hist = stats.deliveryHistory[feeder.id] || [];
      hist.push(deliveryStats[feeder.id].fluctuationPercent);
      if (hist.length > 100) hist.shift();
      stats.deliveryHistory[feeder.id] = hist;

      const stretchHist = stats.stretchHistory[feeder.id] || [];
      const maxStretch = Math.max(...segs.map(s => s.stretchRatio), 0);
      stretchHist.push(maxStretch);
      if (stretchHist.length > 100) stretchHist.shift();
      stats.stretchHistory[feeder.id] = stretchHist;

      if (deliveryStats[feeder.id].fluctuationPercent > 15) {
        addYarnBreakWarning({
          type: 'delivery_fluctuation',
          level: deliveryStats[feeder.id].fluctuationPercent > 25 ? 'error' : 'warning',
          message: `${feeder.name}: 送纱波动异常 (${deliveryStats[feeder.id].fluctuationPercent.toFixed(1)}%)`,
          feederId: feeder.id,
          value: deliveryStats[feeder.id].fluctuationPercent,
          threshold: 15,
        });
      }
    }

    allPeaks.sort((a, b) => b.value - a.value);
    allPeaks = allPeaks.slice(0, 20);

    for (const peak of allPeaks) {
      if (peak.severity === 'high' || peak.severity === 'medium') {
        addYarnBreakWarning({
          type: 'excessive_stretch',
          level: peak.severity === 'high' ? 'error' : 'warning',
          message: `针位 #${peak.needleId + 1}: 拉伸值过高 (${peak.value.toFixed(1)}%)`,
          needleId: peak.needleId,
          value: peak.value,
          threshold: WARNING_STRETCH_THRESHOLD,
        });
      }
    }

    const allSegments: any[] = [];
    for (const key of Object.keys(paths)) {
      allSegments.push(...paths[key]);
    }
    const totalPasses = Math.floor(newRotations);
    const wearZones = detectWearZones(allSegments, state.totalNeedles, totalPasses);

    const frame = {
      rotation,
      paths,
      deliveryStats,
      stretchPeaks: allPeaks,
      wearZones,
      totalWearPerNeedle: newWearAccumulation,
    };

    const analysis = analyzeYarnStability(frame, state.yarnFeeders);

    if (analysis.breakRiskScore > 70) {
      addYarnBreakWarning({
        type: 'break_risk',
        level: analysis.breakRiskScore > 85 ? 'error' : 'warning',
        message: `综合断线风险较高: ${analysis.breakRiskScore.toFixed(0)}/100`,
        value: analysis.breakRiskScore,
        threshold: 70,
      });
    }

    for (const zone of wearZones) {
      if (zone.riskLevel !== 'low') {
        addYarnBreakWarning({
          type: 'high_wear',
          level: zone.riskLevel === 'high' ? 'error' : 'warning',
          message: `易磨损区: 针位 #${zone.startNeedle + 1} - #${zone.endNeedle + 1} (磨损度: ${zone.avgWearLevel.toFixed(1)})`,
          value: zone.avgWearLevel,
          threshold: WARNING_WEAR_LEVEL,
        });
      }
    }

    updateYarnSimulationStats({
      totalRuntime: newRuntime,
      totalRotations: newRotations,
      deliveryHistory: stats.deliveryHistory,
      stretchHistory: stats.stretchHistory,
      wearAccumulation: newWearAccumulation,
      lastFrame: frame,
      analysisResult: analysis,
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
