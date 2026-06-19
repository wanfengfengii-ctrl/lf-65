import {
  Paper,
  Title,
  Stack,
  Group,
  Text,
  Badge,
  Divider,
  SimpleGrid,
  Progress,
  ThemeIcon,
  RingProgress,
  Tooltip,
  Accordion,
} from '@mantine/core';
import {
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import {
  Award,
  Gauge,
  AlertTriangle,
  Target,
  Layers,
  Activity,
  Sparkles,
  Crosshair,
  Link2,
  Users,
  TrendingUp,
  TrendingDown,
  Shield,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useEffect } from 'react';
import { useCylinderStore } from '@/store/cylinderStore';
import { QualityPrediction, PathInterference, TensionCoupling, LocalCrowding } from '@/types/cylinder';

const gradeColorMap: Record<string, string> = {
  A: '#2ed573',
  B: '#00d4ff',
  C: '#ffd700',
  D: '#ff4757',
};

const gradeLabelMap: Record<string, string> = {
  A: '优秀',
  B: '良好',
  C: '一般',
  D: '较差',
};

export default function QualityPredictionPanel() {
  const {
    yarnSimulationStats,
    yarnFeeders,
    totalNeedles,
    runMultiYarnSimulation,
  } = useCylinderStore();

  const multiYarnResult = yarnSimulationStats?.multiYarnResult;
  const quality: QualityPrediction | undefined = multiYarnResult?.qualityPrediction;
  const interferences: PathInterference[] = multiYarnResult?.interferences || [];
  const couplings: TensionCoupling[] = multiYarnResult?.tensionCouplings || [];
  const crowding: LocalCrowding[] = multiYarnResult?.crowdingZones || [];

  useEffect(() => {
    if (yarnFeeders.filter(f => f.enabled).length > 0) {
      runMultiYarnSimulation();
    }
  }, [yarnFeeders, totalNeedles, runMultiYarnSimulation]);

  const enabledFeederCount = yarnFeeders.filter(f => f.enabled).length;

  if (enabledFeederCount === 0) {
    return (
      <Paper
        p="md"
        radius="md"
        style={{
          background: 'rgba(26, 41, 66, 0.9)',
          border: '1px solid rgba(255, 107, 53, 0.2)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Stack gap="md" align="center" ta="center">
          <Award size={36} color="#ff6b35" />
          <div>
            <Text size="sm" fw={500} c="orange.4">
              质量预测
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              请至少启用一个送纱嘴以启用质量预测分析
            </Text>
          </div>
        </Stack>
      </Paper>
    );
  }

  if (!quality) {
    return (
      <Paper
        p="md"
        radius="md"
        style={{
          background: 'rgba(26, 41, 66, 0.9)',
          border: '1px solid rgba(255, 107, 53, 0.2)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Stack gap="md" align="center" ta="center">
          <Activity size={36} color="#00d4ff" className="animate-pulse" />
          <Text size="xs" c="dimmed">
            正在分析多纱路协同数据...
          </Text>
        </Stack>
      </Paper>
    );
  }

  const radarData = [
    { subject: '均匀度', value: quality.uniformityScore, fullMark: 100 },
    { subject: '抗断裂', value: 100 - quality.breakageProbability, fullMark: 100 },
    { subject: '耐磨损', value: Math.min((quality.wearLifetime / 10000) * 100, 100), fullMark: 100 },
    { subject: '花型还原', value: quality.patternFidelityScore, fullMark: 100 },
    { subject: '路数协同', value: Math.max(0, 100 - interferences.length * 10 - crowding.filter(c=>c.severity==='high').length*15), fullMark: 100 },
  ];

  const dimensionData = [
    {
      name: '均匀度',
      score: quality.uniformityScore,
      icon: <Layers size={16} />,
      color: '#00d4ff',
      description: '织物密度与张力分布均匀程度',
    },
    {
      name: '抗断裂',
      score: 100 - quality.breakageProbability,
      icon: <Shield size={16} />,
      color: '#2ed573',
      description: '纱线在运行过程中抵抗断裂的能力',
      inverse: true,
    },
    {
      name: '耐磨损',
      score: Math.min((quality.wearLifetime / 10000) * 100, 100),
      icon: <Clock size={16} />,
      color: '#a29bfe',
      description: '预测的磨损寿命与耐用程度',
    },
    {
      name: '花型还原',
      score: quality.patternFidelityScore,
      icon: <Target size={16} />,
      color: '#ff6b35',
      description: '设计花型的还原精度与色彩保真度',
    },
  ];

  const scoreColor =
    quality.overallQualityScore >= 80
      ? 'green.4'
      : quality.overallQualityScore >= 60
      ? 'yellow.4'
      : 'red.4';

  const interferenceStats = {
    high: interferences.filter(i => i.interferenceLevel === 'high').length,
    medium: interferences.filter(i => i.interferenceLevel === 'medium').length,
    low: interferences.filter(i => i.interferenceLevel === 'low').length,
  };

  const crowdingStats = {
    high: crowding.filter(c => c.severity === 'high').length,
    medium: crowding.filter(c => c.severity === 'medium').length,
    low: crowding.filter(c => c.severity === 'low').length,
  };

  const lifetimeChartData = Array.from({ length: 6 }, (_, i) => {
    const factor = 1 - (i * 0.15);
    return {
      period: `${i * 2}K`,
      预测磨损: Math.round(quality.details.wear.avgWearRate * (1 + i * 0.3)),
      累积疲劳: Math.round(quality.details.breakage.fatigueFactor * 10 * (1 + i * 0.25)),
    };
  });

  return (
    <Paper
      p="md"
      radius="md"
      style={{
        background: 'rgba(26, 41, 66, 0.9)',
        border: `1px solid ${gradeColorMap[quality.grade]}40`,
        backdropFilter: 'blur(10px)',
      }}
    >
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Award size={18} color={gradeColorMap[quality.grade]} />
            <Title order={5} style={{ color: gradeColorMap[quality.grade] }}>
              成品质量预测
            </Title>
          </Group>
          <Group gap="xs">
            <Badge
              size="lg"
              style={{
                background: `${gradeColorMap[quality.grade]}20`,
                color: gradeColorMap[quality.grade],
                border: `1px solid ${gradeColorMap[quality.grade]}60`,
                padding: '4px 12px',
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              {quality.grade} · {gradeLabelMap[quality.grade]}
            </Badge>
          </Group>
        </Group>

        <Divider c="dark.4" />

        <Group align="flex-start" style={{ alignItems: 'stretch' }}>
          <Stack
            align="center"
            justify="center"
            style={{
              width: 140,
              flexShrink: 0,
              padding: '8px 12px',
              background: 'rgba(10, 22, 40, 0.6)',
              borderRadius: 8,
              border: `1px solid ${gradeColorMap[quality.grade]}30`,
            }}
          >
            <RingProgress
              size={110}
              thickness={10}
              roundCaps
              sections={[
                {
                  value: quality.overallQualityScore,
                  color: gradeColorMap[quality.grade],
                },
              ]}
              label={
                <Stack align="center" gap={0} style={{ height: '100%' }} justify="center">
                  <Text
                    size="xl"
                    fw={800}
                    style={{ color: gradeColorMap[quality.grade], lineHeight: 1 }}
                  >
                    {quality.overallQualityScore.toFixed(0)}
                  </Text>
                  <Text size="xs" c="dimmed">综合分</Text>
                </Stack>
              }
            />
          </Stack>

          <Stack gap="sm" style={{ flex: 1, minWidth: 0 }}>
            {dimensionData.map((dim) => (
              <Group key={dim.name} gap="sm" wrap="nowrap" align="center">
                <ThemeIcon
                  size="md"
                  radius="sm"
                  style={{
                    background: `${dim.color}20`,
                    color: dim.color,
                    flexShrink: 0,
                  }}
                >
                  {dim.icon}
                </ThemeIcon>
                <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                  <Group justify="space-between" gap={4}>
                    <Text size="xs" fw={600} style={{ color: dim.color }}>
                      {dim.name}
                    </Text>
                    <Group gap={4}>
                      <Text size="xs" fw={700} style={{ color: dim.color }}>
                        {dim.score.toFixed(0)}
                      </Text>
                      <Text size="xs" c="dimmed">
                        /100
                      </Text>
                      {dim.score >= 80 ? (
                        <TrendingUp size={12} color="#2ed573" />
                      ) : dim.score >= 60 ? null : (
                        <TrendingDown size={12} color="#ff4757" />
                      )}
                    </Group>
                  </Group>
                  <Tooltip label={dim.description}>
                    <Progress
                      value={dim.score}
                      color={dim.color}
                      size="xs"
                      radius="sm"
                    />
                  </Tooltip>
                </Stack>
              </Group>
            ))}
          </Stack>
        </Group>

        <Divider c="dark.4" />

        <SimpleGrid cols={2} spacing="xs">
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#2a3f5f" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: '#6c7a8c', fontSize: 10 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: '#3a4a6a', fontSize: 9 }}
                />
                <Radar
                  name="评分"
                  dataKey="value"
                  stroke={gradeColorMap[quality.grade]}
                  fill={gradeColorMap[quality.grade]}
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <Stack gap="xs">
            <Paper
              p="xs"
              radius="sm"
              style={{ background: 'rgba(10, 22, 40, 0.6)', flex: 1 }}
            >
              <Group justify="space-between" align="center" mb="xs">
                <Group gap="xs">
                  <Crosshair size={12} color="#ff6b6b" />
                  <Text size="xs" fw={500} c="red.4">
                    路径干涉
                  </Text>
                </Group>
                <Badge size="xs" color={interferenceStats.high > 0 ? 'red' : interferenceStats.medium > 0 ? 'orange' : 'green'}>
                  {interferences.length} 处
                </Badge>
              </Group>
              <Group gap="xs" mb={4}>
                {interferenceStats.high > 0 && (
                  <Badge size="xs" color="red">高 {interferenceStats.high}</Badge>
                )}
                {interferenceStats.medium > 0 && (
                  <Badge size="xs" color="orange">中 {interferenceStats.medium}</Badge>
                )}
                {interferenceStats.low > 0 && (
                  <Badge size="xs" color="yellow">低 {interferenceStats.low}</Badge>
                )}
                {interferences.length === 0 && (
                  <Group gap={4}>
                    <CheckCircle2 size={12} color="#2ed573" />
                    <Text size="xs" c="green.4">无干涉</Text>
                  </Group>
                )}
              </Group>
            </Paper>

            <Paper
              p="xs"
              radius="sm"
              style={{ background: 'rgba(10, 22, 40, 0.6)', flex: 1 }}
            >
              <Group justify="space-between" align="center" mb="xs">
                <Group gap="xs">
                  <Link2 size={12} color="#ffe66d" />
                  <Text size="xs" fw={500} c="yellow.4">
                    张力耦合
                  </Text>
                </Group>
                <Badge size="xs" color={couplings.length > 4 ? 'orange' : couplings.length > 0 ? 'cyan' : 'green'}>
                  {couplings.length} 组
                </Badge>
              </Group>
              <Group gap="xs">
                <Text size="xs" c="dimmed">
                  最大耦合:
                </Text>
                <Text size="xs" fw={600} c="yellow.4">
                  {couplings.length > 0 ? `${(couplings[0].couplingCoefficient * 100).toFixed(0)}%` : '无'}
                </Text>
              </Group>
            </Paper>

            <Paper
              p="xs"
              radius="sm"
              style={{ background: 'rgba(10, 22, 40, 0.6)', flex: 1 }}
            >
              <Group justify="space-between" align="center" mb="xs">
                <Group gap="xs">
                  <Users size={12} color="#4ecdc4" />
                  <Text size="xs" fw={500} c="teal.4">
                    局部拥挤
                  </Text>
                </Group>
                <Badge size="xs" color={crowdingStats.high > 0 ? 'red' : crowdingStats.medium > 0 ? 'orange' : 'green'}>
                  {crowding.length} 区
                </Badge>
              </Group>
              <Group gap="xs">
                {crowdingStats.high > 0 && (
                  <Badge size="xs" color="red">高 {crowdingStats.high}</Badge>
                )}
                {crowdingStats.medium > 0 && (
                  <Badge size="xs" color="orange">中 {crowdingStats.medium}</Badge>
                )}
                {crowding.length === 0 && (
                  <Group gap={4}>
                    <CheckCircle2 size={12} color="#2ed573" />
                    <Text size="xs" c="green.4">正常</Text>
                  </Group>
                )}
              </Group>
            </Paper>
          </Stack>
        </SimpleGrid>

        <Divider c="dark.4" />

        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Sparkles size={14} color="#00d4ff" />
            <Text size="sm" fw={500}>
              详细质量指标
            </Text>
          </Group>
        </Group>

        <Accordion variant="filled" radius="sm">
          <Accordion.Item value="uniformity">
            <Accordion.Control>
              <Group gap="xs">
                <Layers size={14} color="#00d4ff" />
                <Text size="xs" fw={600}>
                  织物均匀度详情
                </Text>
                <Badge size="xs" color="cyan" variant="outline">
                  {quality.uniformityScore.toFixed(0)}分
                </Badge>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    张力标准差
                  </Text>
                  <Text size="xs" fw={600}>
                    {quality.details.uniformity.tensionVariance} N
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    密度偏差率
                  </Text>
                  <Text
                    size="xs"
                    fw={600}
                    c={
                      quality.details.uniformity.densityVariation < 5
                        ? 'green.4'
                        : quality.details.uniformity.densityVariation < 15
                        ? 'yellow.4'
                        : 'red.4'
                    }
                  >
                    {quality.details.uniformity.densityVariation.toFixed(1)}%
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    针位覆盖率
                  </Text>
                  <Text size="xs" fw={600} c="green.4">
                    {quality.details.uniformity.needleCoverageRate.toFixed(1)}%
                  </Text>
                </Group>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="breakage">
            <Accordion.Control>
              <Group gap="xs">
                <AlertTriangle size={14} color="#ff4757" />
                <Text size="xs" fw={600}>
                  断线风险详情
                </Text>
                <Badge
                  size="xs"
                  color={
                    quality.breakageProbability > 70
                      ? 'red'
                      : quality.breakageProbability > 40
                      ? 'orange'
                      : 'green'
                  }
                  variant="outline"
                >
                  概率 {quality.breakageProbability.toFixed(0)}%
                </Badge>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    最大张力比
                  </Text>
                  <Text
                    size="xs"
                    fw={600}
                    c={
                      quality.details.breakage.maxTensionRatio < 0.1
                        ? 'green.4'
                        : quality.details.breakage.maxTensionRatio < 0.2
                        ? 'yellow.4'
                        : 'red.4'
                    }
                  >
                    {(quality.details.breakage.maxTensionRatio * 100).toFixed(1)}%
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    薄弱点数
                  </Text>
                  <Text
                    size="xs"
                    fw={600}
                    c={quality.details.breakage.weakPointCount > 5 ? 'red.4' : 'green.4'}
                  >
                    {quality.details.breakage.weakPointCount} 处
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    疲劳因子
                  </Text>
                  <Text
                    size="xs"
                    fw={600}
                    c={quality.details.breakage.fatigueFactor > 5 ? 'red.4' : 'green.4'}
                  >
                    {quality.details.breakage.fatigueFactor}
                  </Text>
                </Group>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="wear">
            <Accordion.Control>
              <Group gap="xs">
                <Clock size={14} color="#a29bfe" />
                <Text size="xs" fw={600}>
                  磨损寿命详情
                </Text>
                <Badge size="xs" color="violet" variant="outline">
                  {quality.wearLifetime.toLocaleString()} 转
                </Badge>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    平均磨损率
                  </Text>
                  <Text
                    size="xs"
                    fw={600}
                    c={quality.details.wear.avgWearRate < 30 ? 'green.4' : quality.details.wear.avgWearRate < 60 ? 'yellow.4' : 'red.4'}
                  >
                    {quality.details.wear.avgWearRate.toFixed(1)}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    临界磨损区数
                  </Text>
                  <Text
                    size="xs"
                    fw={600}
                    c={quality.details.wear.criticalZoneCount > 3 ? 'red.4' : 'green.4'}
                  >
                    {quality.details.wear.criticalZoneCount} 处
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    预测寿命
                  </Text>
                  <Text size="xs" fw={600} c="violet.4">
                    {quality.details.wear.predictedCycles.toLocaleString()} 转次
                  </Text>
                </Group>
                <div style={{ height: 80, marginTop: 8 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lifetimeChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a3f5f" />
                      <XAxis dataKey="period" tick={{ fill: '#6c7a8c', fontSize: 9 }} />
                      <YAxis tick={{ fill: '#6c7a8c', fontSize: 9 }} />
                      <ReTooltip
                        contentStyle={{
                          backgroundColor: '#1a2942',
                          border: '1px solid #00d4ff',
                          borderRadius: 6,
                          color: '#fff',
                          fontSize: 11,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="预测磨损"
                        stroke="#a29bfe"
                        strokeWidth={2}
                        dot={{ r: 2 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="累积疲劳"
                        stroke="#ff6b35"
                        strokeWidth={2}
                        dot={{ r: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="pattern">
            <Accordion.Control>
              <Group gap="xs">
                <Target size={14} color="#ff6b35" />
                <Text size="xs" fw={600}>
                  花型还原度详情
                </Text>
                <Badge size="xs" color="orange" variant="outline">
                  {quality.patternFidelityScore.toFixed(0)}分
                </Badge>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    对齐误差
                  </Text>
                  <Text
                    size="xs"
                    fw={600}
                    c={quality.details.pattern.alignmentError < 10 ? 'green.4' : quality.details.pattern.alignmentError < 25 ? 'yellow.4' : 'red.4'}
                  >
                    {quality.details.pattern.alignmentError.toFixed(1)}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    色偏指数
                  </Text>
                  <Text
                    size="xs"
                    fw={600}
                    c={quality.details.pattern.colorShiftIndex < 10 ? 'green.4' : quality.details.pattern.colorShiftIndex < 20 ? 'yellow.4' : 'red.4'}
                  >
                    {quality.details.pattern.colorShiftIndex.toFixed(1)}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    周期精度
                  </Text>
                  <Text
                    size="xs"
                    fw={600}
                    c={quality.details.pattern.periodAccuracy > 85 ? 'green.4' : quality.details.pattern.periodAccuracy > 70 ? 'yellow.4' : 'red.4'}
                  >
                    {quality.details.pattern.periodAccuracy.toFixed(1)}%
                  </Text>
                </Group>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>

        <Paper
          p="xs"
          radius="sm"
          style={{ background: 'rgba(10, 22, 40, 0.6)' }}
        >
          <Group justify="space-between" align="flex-start">
            <Gauge size={14} color={scoreColor} style={{ flexShrink: 0, marginTop: 2 }} />
            <Stack gap={2} style={{ flex: 1 }}>
              <Text size="xs" fw={600} c={scoreColor}>
                {quality.grade === 'A'
                  ? '✨ 工艺方案优秀，质量稳定可靠'
                  : quality.grade === 'B'
                  ? '👍 工艺方案良好，建议小幅优化参数'
                  : quality.grade === 'C'
                  ? '⚠️ 工艺方案一般，存在改进空间'
                  : '🚨 工艺方案较差，建议重新设计参数'}
              </Text>
              <Text size="xs" c="dimmed" lh={1.5}>
                {quality.uniformityScore < 70 && '调整送纱嘴位置和角度以改善均匀度。'}
                {quality.breakageProbability > 50 && '降低张力或更换高弹性材质以减少断线风险。'}
                {quality.wearLifetime < 5000 && '选择高耐磨材质或减少送纱嘴数以延长寿命。'}
                {quality.patternFidelityScore < 70 && '优化花型周期和送纱配置以提高还原度。'}
              </Text>
            </Stack>
          </Group>
        </Paper>
      </Stack>
    </Paper>
  );
}
