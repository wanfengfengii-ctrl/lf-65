import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { useCylinderStore } from '@/store/cylinderStore';
import { Needle } from '@/types/cylinder';

interface NeedleCylinderProps {
  width?: number;
  height?: number;
}

const COLORS = {
  cylinderBase: 0x2a3f5f,
  cylinderInner: 0x1a2942,
  needleEnabled: 0x00d4ff,
  needleDisabled: 0x3a4a6a,
  needleHighRisk: 0xff4757,
  patternMarker: 0xffd700,
  center: 0x0a1628,
  ringOuter: 0x3d5a80,
  ringInner: 0x1e3a5f,
};

export default function NeedleCylinder({
  width = 500,
  height = 500,
}: NeedleCylinderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<PIXI.Renderer | null>(null);
  const stageRef = useRef<PIXI.Container | null>(null);
  const cylinderGroupRef = useRef<PIXI.Container | null>(null);
  const needleSpritesRef = useRef<PIXI.Graphics[]>([]);
  const animationRef = useRef<number>(0);
  const isMounted = useRef(true);

  const {
    needles,
    patternPeriod,
    rotationSpeed,
    isRunning,
    highRiskThreshold,
    toggleNeedle,
  } = useCylinderStore();

  useEffect(() => {
    isMounted.current = true;

    if (!containerRef.current) return;

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

    createNeedles(cylinderGroup, needles, patternPeriod, highRiskThreshold);

    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      if (!isMounted.current || !rendererRef.current || !stageRef.current) return;

      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (cylinderGroupRef.current && isRunning) {
        cylinderGroupRef.current.rotation +=
        rotationSpeed * deltaTime * Math.PI * 0.5;
      }

      rendererRef.current.render(stageRef.current);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      isMounted.current = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.destroy(true);
        rendererRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!cylinderGroupRef.current) return;
    createNeedles(
      cylinderGroupRef.current,
      needles,
      patternPeriod,
      highRiskThreshold
    );
  }, [needles, patternPeriod, highRiskThreshold]);

  function createNeedles(
    container: PIXI.Container,
    needleData: Needle[],
    period: number,
    riskThreshold: number
  ) {
    needleSpritesRef.current.forEach((sprite) => {
      container.removeChild(sprite);
      sprite.destroy();
    });
    needleSpritesRef.current = [];

    const radius = Math.min(width, height) / 2 - 60;
    const total = needleData.length;

    for (let i = 0; i < total; i++) {
      const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      const needle = needleData[i];
      const isHighRisk = needle.enabled && needle.tension > riskThreshold;
      const isPatternMarker = i % period === 0;

      const needleGraphic = new PIXI.Graphics();

      if (needle.enabled) {
        const color = isHighRisk ? COLORS.needleHighRisk : COLORS.needleEnabled;

        needleGraphic.beginFill(color);
        needleGraphic.drawCircle(0, 0, 10);
        needleGraphic.endFill();

        needleGraphic.beginFill(color, 0.3);
        needleGraphic.drawCircle(0, 0, 16);
        needleGraphic.endFill();
      } else {
        needleGraphic.beginFill(COLORS.needleDisabled);
        needleGraphic.drawCircle(0, 0, 7);
        needleGraphic.endFill();
      }

      if (isPatternMarker && needle.enabled) {
        needleGraphic.lineStyle(2, COLORS.patternMarker, 1);
        needleGraphic.drawCircle(0, 0, 14);
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
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    />
  );
}
