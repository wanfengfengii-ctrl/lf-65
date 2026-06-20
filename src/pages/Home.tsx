import { Container, Grid, Title, Text, Group, Paper, Tabs, Badge } from '@mantine/core';
import { Cpu, Info, BarChart3, ArrowRightLeft, Layers, Activity, AlertTriangle, Flame, Sparkles, ShieldCheck, Settings2, Calendar } from 'lucide-react';
import NeedleCylinder from '@/components/NeedleCylinder';
import ControlPanel from '@/components/ControlPanel';
import StatsPanel from '@/components/StatsPanel';
import SchemeManager from '@/components/SchemeManager';
import ComparisonPanel from '@/components/ComparisonPanel';
import WarningPanel from '@/components/WarningPanel';
import SimulationPanel from '@/components/SimulationPanel';
import YarnFeederPanel from '@/components/YarnFeederPanel';
import YarnAnalysisPanel from '@/components/YarnAnalysisPanel';
import YarnMaterialPanel from '@/components/YarnMaterialPanel';
import QualityPredictionPanel from '@/components/QualityPredictionPanel';
import OptimizationPanel from '@/components/OptimizationPanel';
import SchedulePanel from '@/components/SchedulePanel';
import { useCylinderStore } from '@/store/cylinderStore';
import { HIGH_RISK_THRESHOLD, WARNING_STRETCH_THRESHOLD } from '@/types/cylinder';
import { useEffect } from 'react';

export default function Home() {
  const {
    heatMode,
    currentSchemeId,
    schemes,
    warnings,
    yarnFeeders,
    yarnSimulationEnabled,
    showYarnPath,
    showRiskHighlight,
    checkYarnWarnings,
    yarnSimulationStats,
    yarnMaterials,
    qualityPrediction,
    showInterferenceHighlight,
    showCrowdingHighlight,
    showTensionCoupling,
    runMultiYarnSimulation,
    predictQuality,
  } = useCylinderStore();

  const currentScheme = schemes.find((s) => s.id === currentSchemeId);

  const errorCount = warnings.filter((w) => w.level === 'error').length;
  const warningCount = warnings.filter((w) => w.level === 'warning').length;
  const yarnBreakCount = yarnSimulationStats?.breakWarnings?.length || 0;
  const yarnWarningCount = warnings.filter((w) =>
    ['break_risk', 'excessive_stretch', 'high_wear', 'delivery_fluctuation', 'angle_violation', 'path_interference', 'local_crowding', 'tension_conflict'].includes(w.type)
  ).length;

  const stabilityScore = yarnSimulationStats?.analysisResult?.overallStability;
  const breakRiskScore = yarnSimulationStats?.analysisResult?.breakRiskScore;
  const maxStretchPeak = yarnSimulationStats?.analysisResult?.maxStretchPeak;
  const wearZones = yarnSimulationStats?.analysisResult?.criticalWearZones;
  const avgFluctuation = yarnSimulationStats?.analysisResult?.avgFluctuation;

  const multiYarnResult = yarnSimulationStats?.multiYarnResult;
  const qualityScore = qualityPrediction?.overallQualityScore;
  const qualityGrade = qualityPrediction?.grade;

  useEffect(() => {
    checkYarnWarnings();
    if (yarnFeeders.some(f => f.enabled)) {
      const t1 = setTimeout(() => runMultiYarnSimulation(), 100);
      const t2 = setTimeout(() => predictQuality(), 200);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [checkYarnWarnings, runMultiYarnSimulation, predictQuality, yarnFeeders]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a1628 0%, #1e3a5f 50%, #0a1628 100%)',
        padding: '20px 0',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            radial-gradient(circle at 20% 80%, rgba(0, 212, 255, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 215, 0, 0.06) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(255, 107, 53, 0.04) 0%, transparent 60%)
          `,
          pointerEvents: 'none',
        }}
      />

      <Container size="xl" style={{ position: 'relative', zIndex: 1 }}>
        <Group justify="center" mb="md">
          <Paper
            p="sm"
            radius="md"
            style={{
              background: 'rgba(26, 41, 66, 0.8)',
              border: '1px solid rgba(0, 212, 255, 0.3)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Group gap="sm">
              <Cpu size={28} color="#00d4ff" />
              <div>
                <Title order={2} c="cyan.4">
                  多纱路协同与成品质量预测系统
                </Title>
                <Group gap="sm" mt={4}>
                  <Text size="sm" c="dimmed">
                    Multi-Yarn Coordination & Quality Prediction System v3.0
                  </Text>
                  {currentScheme && (
                    <Text size="xs" c="cyan.4">
                      | 当前方案: {currentScheme.name}
                    </Text>
                  )}
                  {heatMode && (
                    <Text size="xs" c="orange.4">
                      | 🔥 热力模式
                    </Text>
                  )}
                  {yarnSimulationEnabled && showYarnPath && (
                    <Text size="xs" c="orange.4">
                      | 🧵 纱线可见
                    </Text>
                  )}
                  {qualityScore !== undefined && (
                    <Badge size="xs" color={qualityGrade === 'A' ? 'green' : qualityGrade === 'B' ? 'cyan' : qualityGrade === 'C' ? 'yellow' : 'red'} variant="filled">
                      质量 {qualityGrade} · {qualityScore.toFixed(0)}分
                    </Badge>
                  )}
                </Group>
              </div>
            </Group>
          </Paper>
        </Group>

        <Grid gutter="md" align="flex-start">
          <Grid.Col span={{ base: 12, md: 3 }} order={{ base: 2, md: 1 }}>
            <Stack gap="md">
              <ControlPanel />
              <YarnFeederPanel />
              <YarnMaterialPanel />
              <SchemeManager />
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }} order={{ base: 1, md: 2 }}>
            <Stack gap="md">
              <Paper
                p="md"
                radius="md"
                style={{
                  background: 'rgba(26, 41, 66, 0.9)',
                  border: '1px solid rgba(0, 212, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <Group justify="space-between" w="100%" mb="xs">
                  <Title order={5} c="cyan.4">
                    针筒视图 · 纱线路径模拟
                  </Title>
                  <Group gap="xs">
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: '#00d4ff',
                        display: 'inline-block',
                      }}
                    />
                    <Text size="xs" c="dimmed">
                      启用
                    </Text>
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: '#3a4a6a',
                        display: 'inline-block',
                      }}
                    />
                    <Text size="xs" c="dimmed">
                      停用
                    </Text>
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: '#ff4757',
                        display: 'inline-block',
                      }}
                    />
                    <Text size="xs" c="dimmed">
                      高风险
                    </Text>
                    {heatMode && (
                      <>
                        <span
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            background: '#ff6b35',
                            display: 'inline-block',
                          }}
                        />
                        <Text size="xs" c="dimmed">
                          中风险
                        </Text>
                        <span
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            background: '#ffd700',
                            display: 'inline-block',
                          }}
                        />
                        <Text size="xs" c="dimmed">
                          低风险
                        </Text>
                      </>
                    )}
                  </Group>
                </Group>

                {yarnFeeders.filter(f => f.enabled).length > 0 && (
                  <Group gap="xs" w="100%" mb="xs">
                    {yarnFeeders.filter(f => f.enabled).map((feeder) => (
                      <Group key={feeder.id} gap={4}>
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: feeder.color,
                            display: 'inline-block',
                            boxShadow: `0 0 6px ${feeder.color}`,
                          }}
                        />
                        <Text size="xs" c="dimmed">
                          {feeder.name}
                        </Text>
                      </Group>
                    ))}
                  </Group>
                )}

                <NeedleCylinder />

                <Group mt="xs">
                  <Info size={14} color="#6c7a8c" />
                  <Text size="xs" c="dimmed">
                    点击针位切换启用/停用 | 黄色圆圈标记花型周期起点 | 风险阈值: {HIGH_RISK_THRESHOLD} N | 拉伸阈值: {WARNING_STRETCH_THRESHOLD}%
                  </Text>
                </Group>
                {showRiskHighlight && (
                  <Group mt={4}>
                    <Flame size={12} color="#ff4757" />
                    <Text size="xs" c="orange.4">
                      🔴 红色脉冲圈 = 拉伸/磨损风险区  🟠 送纱嘴标记外圆
                    </Text>
                  </Group>
                )}
                {(showInterferenceHighlight || showCrowdingHighlight || showTensionCoupling) && (
                  <Group mt={4} wrap="wrap">
                    {showInterferenceHighlight && multiYarnResult && multiYarnResult.interferences.length > 0 && (
                      <Badge size="xs" color="red" variant="outline">
                        ⚡ 干涉 {multiYarnResult.interferences.length}
                      </Badge>
                    )}
                    {showCrowdingHighlight && multiYarnResult && multiYarnResult.crowdingZones.length > 0 && (
                      <Badge size="xs" color="cyan" variant="outline">
                        👥 拥挤 {multiYarnResult.crowdingZones.length}
                      </Badge>
                    )}
                    {showTensionCoupling && multiYarnResult && multiYarnResult.tensionCouplings.length > 0 && (
                      <Badge size="xs" color="yellow" variant="outline">
                        🔗 耦合 {multiYarnResult.tensionCouplings.filter(c => c.couplingCoefficient > 0.2).length}
                      </Badge>
                    )}
                  </Group>
                )}
              </Paper>

              <Tabs defaultValue="yarn" variant="pills" color="cyan">
                <Tabs.List grow>
                  <Tabs.Tab
                    value="yarn"
                    leftSection={<Layers size={14} />}
                    rightSection={
                      yarnWarningCount > 0 ? (
                        <span
                          style={{
                            display: 'inline-block',
                            background: yarnBreakCount > 0 ? '#ff4757' : '#ffa502',
                            color: '#fff',
                            borderRadius: 10,
                            padding: '0 6px',
                            fontSize: 10,
                            fontWeight: 600,
                          }}
                        >
                          {yarnWarningCount}
                        </span>
                      ) : null
                    }
                  >
                    纱线分析
                  </Tabs.Tab>
                  <Tabs.Tab
                    value="quality"
                    leftSection={<ShieldCheck size={14} />}
                    rightSection={
                      qualityScore !== undefined ? (
                        <span
                          style={{
                            display: 'inline-block',
                            background: qualityGrade === 'A' ? '#2ed573' : qualityGrade === 'B' ? '#1e90ff' : qualityGrade === 'C' ? '#ffa502' : '#ff4757',
                            color: '#fff',
                            borderRadius: 10,
                            padding: '0 6px',
                            fontSize: 10,
                            fontWeight: 600,
                          }}
                        >
                          {qualityGrade}
                        </span>
                      ) : null
                    }
                  >
                    质量预测
                  </Tabs.Tab>
                  <Tabs.Tab
                    value="material"
                    leftSection={<Sparkles size={14} />}
                    rightSection={
                      yarnMaterials.length > 0 ? (
                        <span
                          style={{
                            display: 'inline-block',
                            background: '#a29bfe',
                            color: '#fff',
                            borderRadius: 10,
                            padding: '0 6px',
                            fontSize: 10,
                            fontWeight: 600,
                          }}
                        >
                          {yarnMaterials.length}
                        </span>
                      ) : null
                    }
                  >
                    材质配置
                  </Tabs.Tab>
                  <Tabs.Tab
                    value="stats"
                    leftSection={<BarChart3 size={14} />}
                  >
                    数据统计
                  </Tabs.Tab>
                  <Tabs.Tab
                    value="comparison"
                    leftSection={<ArrowRightLeft size={14} />}
                  >
                    方案对比
                  </Tabs.Tab>
                  <Tabs.Tab
                    value="warnings"
                    leftSection={<AlertTriangle size={14} />}
                    rightSection={
                      errorCount + warningCount > 0 ? (
                        <span
                          style={{
                            display: 'inline-block',
                            background: errorCount > 0 ? '#ff4757' : '#ffa502',
                            color: '#fff',
                            borderRadius: 10,
                            padding: '0 6px',
                            fontSize: 10,
                            fontWeight: 600,
                          }}
                        >
                          {errorCount + warningCount}
                        </span>
                      ) : null
                    }
                  >
                    系统预警
                  </Tabs.Tab>
                  <Tabs.Tab
                    value="simulation"
                    leftSection={<Activity size={14} />}
                  >
                    运行模拟
                  </Tabs.Tab>
                  <Tabs.Tab
                    value="optimization"
                    leftSection={<Settings2 size={14} />}
                  >
                    智能寻优
                  </Tabs.Tab>
                  <Tabs.Tab
                    value="schedule"
                    leftSection={<Calendar size={14} />}
                  >
                    排程管理
                  </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="yarn" pt="md">
                  <YarnAnalysisPanel />
                </Tabs.Panel>

                <Tabs.Panel value="quality" pt="md">
                  <QualityPredictionPanel />
                </Tabs.Panel>

                <Tabs.Panel value="material" pt="md">
                  <YarnMaterialPanel compact />
                </Tabs.Panel>

                <Tabs.Panel value="stats" pt="md">
                  <StatsPanel />
                </Tabs.Panel>

                <Tabs.Panel value="comparison" pt="md">
                  <ComparisonPanel />
                </Tabs.Panel>

                <Tabs.Panel value="warnings" pt="md">
                  <WarningPanel />
                </Tabs.Panel>

                <Tabs.Panel value="simulation" pt="md">
                  <SimulationPanel />
                </Tabs.Panel>

                <Tabs.Panel value="optimization" pt="md">
                  <OptimizationPanel />
                </Tabs.Panel>

                <Tabs.Panel value="schedule" pt="md">
                  <SchedulePanel />
                </Tabs.Panel>
              </Tabs>
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 3 }} order={{ base: 3, md: 3 }}>
            <Stack gap="md">
              <Paper
                p="md"
                radius="md"
                style={{
                  background: 'rgba(26, 41, 66, 0.9)',
                  border: `1px solid ${
                    qualityScore !== undefined && qualityScore < 60
                      ? 'rgba(255, 71, 87, 0.5)'
                      : 'rgba(46, 213, 115, 0.4)'
                  }`,
                  backdropFilter: 'blur(10px)',
                }}
              >
                <Group justify="space-between" mb="sm">
                  <Group gap="xs">
                    <ShieldCheck size={18} color="#2ed573" />
                    <Title order={5} c="green.4">
                      🏆 成品质量预测
                    </Title>
                  </Group>
                  {qualityGrade && (
                    <Badge
                      size="lg"
                      color={qualityGrade === 'A' ? 'green' : qualityGrade === 'B' ? 'cyan' : qualityGrade === 'C' ? 'yellow' : 'red'}
                      variant="filled"
                    >
                      等级 {qualityGrade}
                    </Badge>
                  )}
                </Group>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <Paper
                    p="xs"
                    radius="sm"
                    style={{
                      background: 'rgba(10, 22, 40, 0.6)',
                      border: `1px solid ${
                        qualityScore !== undefined
                          ? qualityScore >= 80
                            ? 'rgba(46, 213, 115, 0.4)'
                            : qualityScore >= 60
                            ? 'rgba(255, 215, 0, 0.4)'
                            : 'rgba(255, 71, 87, 0.5)'
                          : 'rgba(0, 212, 255, 0.2)'
                      }`,
                    }}
                  >
                    <Text size="xs" c="dimmed">
                      综合质量分
                    </Text>
                    <Text
                      size="xl"
                      fw={700}
                      c={
                        qualityScore === undefined
                          ? 'dimmed'
                          : qualityScore >= 80
                          ? 'green.4'
                          : qualityScore >= 60
                          ? 'yellow.4'
                          : 'red.4'
                      }
                    >
                      {qualityScore !== undefined
                        ? `${qualityScore.toFixed(0)}`
                        : '--'}
                    </Text>
                  </Paper>

                  <Paper
                    p="xs"
                    radius="sm"
                    style={{
                      background: 'rgba(10, 22, 40, 0.6)',
                      border: '1px solid rgba(255, 107, 53, 0.3)',
                    }}
                  >
                    <Text size="xs" c="dimmed">
                      磨损寿命(h)
                    </Text>
                    <Text size="xl" fw={700} c="orange.4">
                      {qualityPrediction?.wearLifetime !== undefined
                        ? `${qualityPrediction.wearLifetime.toFixed(0)}`
                        : '--'}
                    </Text>
                  </Paper>

                  <Paper
                    p="xs"
                    radius="sm"
                    style={{
                      background: 'rgba(10, 22, 40, 0.6)',
                      border: '1px solid rgba(0, 212, 255, 0.2)',
                    }}
                  >
                    <Text size="xs" c="dimmed">
                      均匀度
                    </Text>
                    <Text size="xl" fw={700} c="cyan.4">
                      {qualityPrediction?.uniformityScore !== undefined
                        ? `${qualityPrediction.uniformityScore.toFixed(0)}%`
                        : '--'}
                    </Text>
                  </Paper>

                  <Paper
                    p="xs"
                    radius="sm"
                    style={{
                      background: 'rgba(10, 22, 40, 0.6)',
                      border: '1px solid rgba(162, 155, 254, 0.3)',
                    }}
                  >
                    <Text size="xs" c="dimmed">
                      花型还原
                    </Text>
                    <Text size="xl" fw={700} c="violet.4">
                      {qualityPrediction?.patternFidelityScore !== undefined
                        ? `${qualityPrediction.patternFidelityScore.toFixed(0)}%`
                        : '--'}
                    </Text>
                  </Paper>
                </div>

                {multiYarnResult && (
                  <Group mt="sm" grow>
                    <Badge size="sm" color="red" variant="light">
                      ⚡ 干涉 {multiYarnResult.interferences.filter(i => i.interferenceLevel !== 'low').length}
                    </Badge>
                    <Badge size="sm" color="cyan" variant="light">
                      👥 拥挤 {multiYarnResult.crowdingZones.filter(c => c.severity !== 'low').length}
                    </Badge>
                    <Badge size="sm" color="yellow" variant="light">
                      🔗 耦合 {multiYarnResult.tensionCouplings.filter(c => c.couplingCoefficient > 0.3).length}
                    </Badge>
                  </Group>
                )}
              </Paper>

              <Paper
                p="md"
                radius="md"
                style={{
                  background: 'rgba(26, 41, 66, 0.9)',
                  border: `1px solid ${
                    stabilityScore !== undefined && stabilityScore < 60
                      ? 'rgba(255, 71, 87, 0.5)'
                      : 'rgba(0, 212, 255, 0.3)'
                  }`,
                  backdropFilter: 'blur(10px)',
                }}
              >
                <Group justify="space-between" mb="sm">
                  <Title order={5} c="cyan.4">
                    📊 实时状态概览
                  </Title>
                </Group>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <Paper
                    p="xs"
                    radius="sm"
                    style={{
                      background: 'rgba(10, 22, 40, 0.6)',
                      border: '1px solid rgba(0, 212, 255, 0.2)',
                    }}
                  >
                    <Text size="xs" c="dimmed">
                      综合稳定性
                    </Text>
                    <Text
                      size="lg"
                      fw={700}
                      c={
                        stabilityScore === undefined
                          ? 'dimmed'
                          : stabilityScore >= 80
                          ? 'green.4'
                          : stabilityScore >= 60
                          ? 'yellow.4'
                          : 'red.4'
                      }
                    >
                      {stabilityScore !== undefined
                        ? `${stabilityScore.toFixed(0)}分`
                        : '--'}
                    </Text>
                  </Paper>

                  <Paper
                    p="xs"
                    radius="sm"
                    style={{
                      background: 'rgba(10, 22, 40, 0.6)',
                      border: '1px solid rgba(0, 212, 255, 0.2)',
                    }}
                  >
                    <Text size="xs" c="dimmed">
                      断线风险
                    </Text>
                    <Text
                      size="lg"
                      fw={700}
                      c={
                        breakRiskScore === undefined
                          ? 'dimmed'
                          : breakRiskScore < 40
                          ? 'green.4'
                          : breakRiskScore < 70
                          ? 'yellow.4'
                          : 'red.4'
                      }
                    >
                      {breakRiskScore !== undefined
                        ? `${breakRiskScore.toFixed(0)}%`
                        : '--'}
                    </Text>
                  </Paper>

                  <Paper
                    p="xs"
                    radius="sm"
                    style={{
                      background: 'rgba(10, 22, 40, 0.6)',
                      border: '1px solid rgba(0, 212, 255, 0.2)',
                    }}
                  >
                    <Text size="xs" c="dimmed">
                      送纱波动
                    </Text>
                    <Text
                      size="lg"
                      fw={700}
                      c={
                        avgFluctuation === undefined
                          ? 'dimmed'
                          : avgFluctuation < 10
                          ? 'green.4'
                          : avgFluctuation < 20
                          ? 'yellow.4'
                          : 'red.4'
                      }
                    >
                      {avgFluctuation !== undefined
                        ? `${avgFluctuation.toFixed(1)}%`
                        : '--'}
                    </Text>
                  </Paper>

                  <Paper
                    p="xs"
                    radius="sm"
                    style={{
                      background: 'rgba(10, 22, 40, 0.6)',
                      border: '1px solid rgba(0, 212, 255, 0.2)',
                    }}
                  >
                    <Text size="xs" c="dimmed">
                      最大拉伸
                    </Text>
                    <Text
                      size="lg"
                      fw={700}
                      c={
                        maxStretchPeak === undefined
                          ? 'dimmed'
                          : maxStretchPeak < 8
                          ? 'green.4'
                          : maxStretchPeak < 15
                          ? 'yellow.4'
                          : 'red.4'
                      }
                    >
                      {maxStretchPeak !== undefined
                        ? `${maxStretchPeak.toFixed(1)}%`
                        : '--'}
                    </Text>
                  </Paper>
                </div>

                {wearZones && wearZones.length > 0 ? (
                  <Group mt="sm">
                    <Text size="xs" c="orange.4">
                      ⚠️ 检测到 {wearZones.length} 处易磨损区
                    </Text>
                  </Group>
                ) : null}
              </Paper>

              <WarningPanel />
              <SimulationPanel />
            </Stack>
          </Grid.Col>
        </Grid>

        <Group justify="center" mt="md">
          <Text size="xs" c="dimmed">
            © 2024 纺织工程可视化教学工具 | 工业科技风格界面 | 多纱路协同与成品质量预测系统 v3.0 · 多纱路干涉/耦合/拥挤模拟 · 多维度质量评分与花型还原预测
          </Text>
        </Group>
      </Container>
    </div>
  );
}

function Stack({
  children,
  gap = 'sm',
  style,
}: {
  children: React.ReactNode;
  gap?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: gap === 'sm' ? '12px' : gap === 'md' ? '16px' : gap === 'lg' ? '24px' : gap,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
