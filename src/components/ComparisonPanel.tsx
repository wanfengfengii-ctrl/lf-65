import {
  Paper,
  Title,
  Stack,
  Group,
  Text,
  Badge,
  Divider,
  SimpleGrid,
  ActionIcon,
  Tooltip,
  Progress,
} from '@mantine/core';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  ArrowRightLeft,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  Layers,
  Gauge,
  X,
  MapPin,
  Ruler,
  Compass,
  ShieldCheck,
  Sparkles,
  Activity,
} from 'lucide-react';
import { useSchemeComparison, useCylinderStore } from '@/store/cylinderStore';
import { HIGH_RISK_THRESHOLD } from '@/types/cylinder';

export default function ComparisonPanel() {
  const comparison = useSchemeComparison();
  const { showComparison, toggleComparison, setCompareScheme } = useCylinderStore();

  if (!comparison || !showComparison) {
    return (
      <Paper
        p="md"
        radius="md"
        style={{
          background: 'rgba(26, 41, 66, 0.9)',
          border: '1px solid rgba(255, 215, 0, 0.2)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Stack gap="md" align="center" ta="center">
          <ArrowRightLeft size={32} color="#ffd700" />
          <div>
            <Text size="sm" fw={500} c="yellow.4">
              方案对比
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              在方案管理中选择一个方案作为对比对象
            </Text>
          </div>
        </Stack>
      </Paper>
    );
  }

  const { current, compare, diff } = comparison;

  const getDiffColor = (value: number, isBetterPositive: boolean) => {
    if (value === 0) return 'dimmed';
    if (isBetterPositive) {
      return value > 0 ? 'green.4' : 'red.4';
    }
    return value > 0 ? 'red.4' : 'green.4';
  };

  const getDiffIcon = (value: number, isBetterPositive: boolean) => {
    if (value === 0) return '=';
    if (isBetterPositive) {
      return value > 0 ? '↑' : '↓';
    }
    return value > 0 ? '↑' : '↓';
  };

  const comparisonData = [
    {
      name: '启用针数',
      current: current.enabledCount,
      compare: compare.enabledCount,
      diff: diff.enabledCount,
      isBetterPositive: true,
      unit: '针',
    },
    {
      name: '花型周期',
      current: current.patternPeriod,
      compare: compare.patternPeriod,
      diff: diff.patternPeriod,
      isBetterPositive: false,
      unit: '针',
    },
    {
      name: '花型节奏',
      current: current.patternRepeats,
      compare: compare.patternRepeats,
      diff: current.patternRepeats - compare.patternRepeats,
      isBetterPositive: true,
      unit: '次',
    },
    {
      name: '平均张力',
      current: current.avgTension.toFixed(1),
      compare: compare.avgTension.toFixed(1),
      diff: diff.avgTension,
      isBetterPositive: false,
      unit: 'N',
    },
    {
      name: '高风险针位',
      current: current.highRiskCount,
      compare: compare.highRiskCount,
      diff: diff.highRiskCount,
      isBetterPositive: false,
      unit: '个',
    },
    {
      name: '转速',
      current: current.rotationSpeed.toFixed(1),
      compare: compare.rotationSpeed.toFixed(1),
      diff: diff.rotationSpeed,
      isBetterPositive: true,
      unit: '转/秒',
    },
    {
      name: '送纱嘴数',
      current: current.feederCount,
      compare: compare.feederCount,
      diff: diff.feederCount,
      isBetterPositive: true,
      unit: '个',
    },
    {
      name: '平均摩擦',
      current: current.avgFriction.toFixed(2),
      compare: compare.avgFriction.toFixed(2),
      diff: diff.avgFriction,
      isBetterPositive: false,
      unit: 'μ',
    },
  ];

  const chartData = [
    { name: '启用针数', 当前: current.enabledCount, 对比: compare.enabledCount },
    { name: '花型重复', 当前: current.patternRepeats, 对比: compare.patternRepeats },
    { name: '平均张力', 当前: Number(current.avgTension.toFixed(1)), 对比: Number(compare.avgTension.toFixed(1)) },
    { name: '高风险针', 当前: current.highRiskCount, 对比: compare.highRiskCount },
  ];

  const qualityDimData = [
    { name: '织物均匀度', subject: '均匀度', 当前: current.quality?.uniformityScore || 0, 对比: compare.quality?.uniformityScore || 0, fullMark: 100 },
    { name: '抗断裂性', subject: '抗断裂', 当前: current.quality ? (1 - current.quality.breakageProbability) * 100 : 0, 对比: compare.quality ? (1 - compare.quality.breakageProbability) * 100 : 0, fullMark: 100 },
    { name: '磨损寿命', subject: '耐磨损', 当前: current.quality?.wearLifetime ? Math.min(100, current.quality.wearLifetime / 5) : 0, 对比: compare.quality?.wearLifetime ? Math.min(100, compare.quality.wearLifetime / 5) : 0, fullMark: 100 },
    { name: '花型还原', subject: '花型', 当前: current.quality?.patternFidelityScore || 0, 对比: compare.quality?.patternFidelityScore || 0, fullMark: 100 },
    { name: '综合评分', subject: '综合', 当前: current.quality?.overallQualityScore || 0, 对比: compare.quality?.overallQualityScore || 0, fullMark: 100 },
  ];

  const qualityBarData = [
    { name: '综合分', 当前: current.quality?.overallQualityScore || 0, 对比: compare.quality?.overallQualityScore || 0 },
    { name: '均匀度', 当前: current.quality?.uniformityScore || 0, 对比: compare.quality?.uniformityScore || 0 },
    { name: '花型还原', 当前: current.quality?.patternFidelityScore || 0, 对比: compare.quality?.patternFidelityScore || 0 },
    { name: '抗断裂%', 当前: current.quality ? (1 - current.quality.breakageProbability) * 100 : 0, 对比: compare.quality ? (1 - compare.quality.breakageProbability) * 100 : 0 },
    { name: '寿命(h/5)', 当前: current.quality?.wearLifetime ? Math.min(100, current.quality.wearLifetime / 5) : 0, 对比: compare.quality?.wearLifetime ? Math.min(100, compare.quality.wearLifetime / 5) : 0 },
  ];

  return (
    <Paper
      p="md"
      radius="md"
      style={{
        background: 'rgba(26, 41, 66, 0.9)',
        border: '1px solid rgba(255, 215, 0, 0.3)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <ArrowRightLeft size={18} color="#ffd700" />
            <Title order={5} c="yellow.4">
              方案对比
            </Title>
          </Group>
          <Tooltip label="关闭对比">
            <ActionIcon
              size="sm"
              variant="transparent"
              c="dimmed"
              onClick={() => {
                toggleComparison();
                setCompareScheme(null);
              }}
            >
              <X size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>

        <Group grow>
          <Paper
            p="xs"
            radius="sm"
            style={{
              background: 'rgba(0, 212, 255, 0.1)',
              border: '1px solid rgba(0, 212, 255, 0.3)',
            }}
          >
            <Text size="xs" c="dimmed">
              当前方案
            </Text>
            <Text size="sm" fw={600} c="cyan.4" lineClamp={1}>
              {current.scheme.name}
            </Text>
          </Paper>
          <Paper
            p="xs"
            radius="sm"
            style={{
              background: 'rgba(255, 215, 0, 0.1)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
            }}
          >
            <Text size="xs" c="dimmed">
              对比方案
            </Text>
            <Text size="sm" fw={600} c="yellow.4" lineClamp={1}>
              {compare.scheme.name}
            </Text>
          </Paper>
        </Group>

        <Divider c="dark.4" />

        <SimpleGrid cols={2} spacing="xs">
          {comparisonData.map((item, index) => (
            <Paper
              key={item.name}
              p="xs"
              radius="sm"
              style={{ background: 'rgba(10, 22, 40, 0.6)' }}
            >
              <Group justify="space-between" align="flex-start" gap={4}>
                <div>
                  <Text size="xs" c="dimmed">
                    {item.name}
                  </Text>
                  <Group gap={4} mt={4} align="baseline">
                    <Text size="sm" fw={600} c="cyan.4">
                      {item.current}
                    </Text>
                    <Text size="xs" c="dimmed">
                      vs
                    </Text>
                    <Text size="sm" fw={600} c="yellow.4">
                      {item.compare}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {item.unit}
                    </Text>
                  </Group>
                </div>
                <Badge
                  size="xs"
                  color={
                    item.diff === 0
                      ? 'gray'
                      : (item.diff as number) > 0 === item.isBetterPositive
                      ? 'green'
                      : 'red'
                  }
                  variant="dot"
                >
                  {getDiffIcon(item.diff as number, item.isBetterPositive)}{' '}
                  {Math.abs(item.diff as number).toFixed(
                    typeof item.diff === 'number' && item.diff % 1 !== 0 ? 1 : 0
                  )}
                </Badge>
              </Group>
            </Paper>
          ))}
        </SimpleGrid>

        <Divider c="dark.4" />

        <Stack gap="xs">
          <Text size="sm" fw={500}>
            参数对比图表
          </Text>
          <Paper
            p="sm"
            radius="sm"
            style={{ background: 'rgba(10, 22, 40, 0.6)' }}
          >
            <div style={{ height: 160, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a3f5f" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#6c7a8c', fontSize: 10 }}
                    axisLine={{ stroke: '#2a3f5f' }}
                    tickLine={{ stroke: '#2a3f5f' }}
                  />
                  <YAxis
                    tick={{ fill: '#6c7a8c', fontSize: 10 }}
                    axisLine={{ stroke: '#2a3f5f' }}
                    tickLine={{ stroke: '#2a3f5f' }}
                  />
                  <ReTooltip
                    contentStyle={{
                      backgroundColor: '#1a2942',
                      border: '1px solid #00d4ff',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', color: '#6c7a8c' }}
                    iconType="circle"
                  />
                  <Bar dataKey="当前" fill="#00d4ff" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="对比" fill="#ffd700" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Paper>
        </Stack>

        <Stack gap="xs">
          <Group gap="xs">
            <AlertTriangle size={14} color="#ffd700" />
            <Text size="sm" fw={500}>
              高风险针位差异
            </Text>
          </Group>
          <Paper
            p="xs"
            radius="sm"
            style={{
              background:
                diff.highRiskCount !== 0
                  ? 'rgba(255, 71, 87, 0.1)'
                  : 'rgba(46, 213, 115, 0.1)',
              border: `1px solid ${
                diff.highRiskCount !== 0
                  ? 'rgba(255, 71, 87, 0.3)'
                  : 'rgba(46, 213, 115, 0.3)'
              }`,
            }}
          >
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed">
                  当前方案高风险针位
                </Text>
                <Text size="lg" fw={700} c={current.highRiskCount > 0 ? 'red.4' : 'green.4'}>
                  {current.highRiskCount} 个
                </Text>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Text size="xs" c="dimmed">
                  对比方案高风险针位
                </Text>
                <Text size="lg" fw={700} c={compare.highRiskCount > 0 ? 'red.4' : 'green.4'}>
                  {compare.highRiskCount} 个
                </Text>
              </div>
            </Group>
            <Divider c="dark.4" my="xs" />
            <Group justify="space-between">
              <Text size="xs" c="dimmed">
                差异
              </Text>
              <Text
                size="sm"
                fw={600}
                c={getDiffColor(diff.highRiskCount, false)}
              >
                {diff.highRiskCount > 0 ? '+' : ''}
                {diff.highRiskCount} 个
                {diff.highRiskCount !== 0 && (
                  <Text span size="xs" c="dimmed" ml={4}>
                    ({diff.highRiskCount > 0 ? '风险更高' : '风险更低'})
                  </Text>
                )}
              </Text>
            </Group>
          </Paper>
        </Stack>

        {(current.quality || compare.quality) && (
          <>
            <Divider c="dark.4" />

            <Stack gap="xs">
              <Group gap="xs">
                <ShieldCheck size={14} color="#2ed573" />
                <Text size="sm" fw={500}>
                  成品质量评分对比
                </Text>
                <Badge size="xs" color={
                  (current.quality?.overallQualityScore || 0) > (compare.quality?.overallQualityScore || 0)
                    ? 'green'
                    : (current.quality?.overallQualityScore || 0) < (compare.quality?.overallQualityScore || 0)
                    ? 'red'
                    : 'gray'
                } variant="dot">
                  当前{current.quality?.grade || '--'} vs 对比{compare.quality?.grade || '--'}
                </Badge>
              </Group>

              <SimpleGrid cols={2} spacing="xs">
                <Paper
                  p="xs"
                  radius="sm"
                  style={{
                    background: 'rgba(0, 212, 255, 0.08)',
                    border: '1px solid rgba(0, 212, 255, 0.3)',
                  }}
                >
                  <Group justify="space-between" mb={4}>
                    <Text size="xs" c="dimmed">当前综合质量</Text>
                    <Badge size="xs" color={
                      current.quality?.grade === 'A' ? 'green' : current.quality?.grade === 'B' ? 'cyan' : current.quality?.grade === 'C' ? 'yellow' : 'red'
                    }>{current.quality?.grade || '--'}</Badge>
                  </Group>
                  <Progress
                    value={current.quality?.overallQualityScore || 0}
                    color={
                      (current.quality?.overallQualityScore || 0) >= 80 ? 'green' :
                      (current.quality?.overallQualityScore || 0) >= 60 ? 'cyan' : 'red'
                    }
                    size="lg"
                    striped
                    animated
                    radius="sm"
                  />
                  <Text size="lg" fw={700} c="cyan.4" mt={4}>
                    {current.quality?.overallQualityScore?.toFixed(1) || '--'}分
                  </Text>
                </Paper>

                <Paper
                  p="xs"
                  radius="sm"
                  style={{
                    background: 'rgba(255, 215, 0, 0.08)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                  }}
                >
                  <Group justify="space-between" mb={4}>
                    <Text size="xs" c="dimmed">对比综合质量</Text>
                    <Badge size="xs" color={
                      compare.quality?.grade === 'A' ? 'green' : compare.quality?.grade === 'B' ? 'cyan' : compare.quality?.grade === 'C' ? 'yellow' : 'red'
                    }>{compare.quality?.grade || '--'}</Badge>
                  </Group>
                  <Progress
                    value={compare.quality?.overallQualityScore || 0}
                    color={
                      (compare.quality?.overallQualityScore || 0) >= 80 ? 'green' :
                      (compare.quality?.overallQualityScore || 0) >= 60 ? 'cyan' : 'red'
                    }
                    size="lg"
                    striped
                    animated
                    radius="sm"
                  />
                  <Text size="lg" fw={700} c="yellow.4" mt={4}>
                    {compare.quality?.overallQualityScore?.toFixed(1) || '--'}分
                  </Text>
                </Paper>
              </SimpleGrid>

              <SimpleGrid cols={2} spacing="xs">
                {[
                  { name: '织物均匀度', curr: current.quality?.uniformityScore || 0, comp: compare.quality?.uniformityScore || 0, icon: <Layers size={12} />, color: 'cyan', isBetterPositive: true },
                  { name: '断线概率', curr: (current.quality?.breakageProbability || 0) * 100, comp: (compare.quality?.breakageProbability || 0) * 100, icon: <AlertTriangle size={12} />, color: 'red', isBetterPositive: false, suffix: '%' },
                  { name: '磨损寿命', curr: current.quality?.wearLifetime || 0, comp: compare.quality?.wearLifetime || 0, icon: <Activity size={12} />, color: 'orange', isBetterPositive: true, suffix: 'h' },
                  { name: '花型还原度', curr: current.quality?.patternFidelityScore || 0, comp: compare.quality?.patternFidelityScore || 0, icon: <Sparkles size={12} />, color: 'violet', isBetterPositive: true, suffix: '%' },
                ].map((item) => {
                  const diffVal = item.curr - item.comp;
                  const isBetter = item.isBetterPositive ? diffVal > 0 : diffVal < 0;
                  return (
                    <Paper
                      key={item.name}
                      p="xs"
                      radius="sm"
                      style={{ background: 'rgba(10, 22, 40, 0.6)' }}
                    >
                      <Group gap={4} mb={3}>
                        {item.icon}
                        <Text size="xs" c="dimmed">{item.name}</Text>
                      </Group>
                      <Group gap={4} align="baseline">
                        <Text size="sm" fw={600} c="cyan.4">
                          {item.curr.toFixed(item.suffix === '%' || item.suffix === 'h' ? 0 : 0)}{item.suffix || ''}
                        </Text>
                        <Text size="xs" c="dimmed">vs</Text>
                        <Text size="sm" fw={600} c="yellow.4">
                          {item.comp.toFixed(item.suffix === '%' || item.suffix === 'h' ? 0 : 0)}{item.suffix || ''}
                        </Text>
                      </Group>
                      <Badge
                        mt={3}
                        size="xs"
                        color={diffVal === 0 ? 'gray' : isBetter ? 'green' : 'red'}
                        variant="dot"
                      >
                        {diffVal === 0 ? '持平' : (diffVal > 0 ? '+' : '')}{diffVal.toFixed(0)}{item.suffix || '分'}
                      </Badge>
                    </Paper>
                  );
                })}
              </SimpleGrid>

              <Paper
                p="sm"
                radius="sm"
                style={{ background: 'rgba(10, 22, 40, 0.6)' }}
              >
                <Text size="xs" fw={500} mb={6} c="dimmed">质量维度雷达图</Text>
                <div style={{ height: 200, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={qualityDimData} outerRadius={65}>
                      <PolarGrid stroke="#2a3f5f" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: '#6c7a8c', fontSize: 10 }}
                      />
                      <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        tick={{ fill: '#6c7a8c', fontSize: 8 }}
                      />
                      <Radar
                        name="当前方案"
                        dataKey="当前"
                        stroke="#00d4ff"
                        fill="#00d4ff"
                        fillOpacity={0.3}
                      />
                      <Radar
                        name="对比方案"
                        dataKey="对比"
                        stroke="#ffd700"
                        fill="#ffd700"
                        fillOpacity={0.2}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </Paper>

              <Paper
                p="sm"
                radius="sm"
                style={{ background: 'rgba(10, 22, 40, 0.6)' }}
              >
                <Text size="xs" fw={500} mb={6} c="dimmed">质量维度柱状对比</Text>
                <div style={{ height: 160, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={qualityBarData} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a3f5f" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: '#6c7a8c', fontSize: 10 }}
                        axisLine={{ stroke: '#2a3f5f' }}
                      />
                      <YAxis
                        tick={{ fill: '#6c7a8c', fontSize: 10 }}
                        axisLine={{ stroke: '#2a3f5f' }}
                        domain={[0, 100]}
                      />
                      <ReTooltip
                        contentStyle={{
                          backgroundColor: '#1a2942',
                          border: '1px solid #2ed573',
                          borderRadius: '6px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="当前" fill="#00d4ff" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="对比" fill="#ffd700" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Paper>
            </Stack>
          </>
        )}

        <Paper
          p="xs"
          radius="sm"
          style={{ background: 'rgba(10, 22, 40, 0.6)' }}
        >
          <Text size="xs" c="dimmed" lh={1.5}>
            💡 对比说明：绿色表示当前方案更优，红色表示当前方案需要改进。
            点击方案管理中的「设为对比」可切换对比对象。
            质量评分基于均匀度(30%)、抗断裂(25%)、耐磨损(20%)、花型还原(25%)加权计算。
          </Text>
        </Paper>
      </Stack>
    </Paper>
  );
}
