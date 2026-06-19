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
} from 'recharts';
import {
  ArrowRightLeft,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  Layers,
  Gauge,
  X,
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
  ];

  const chartData = [
    { name: '启用针数', 当前: current.enabledCount, 对比: compare.enabledCount },
    { name: '花型重复', 当前: current.patternRepeats, 对比: compare.patternRepeats },
    { name: '平均张力', 当前: Number(current.avgTension.toFixed(1)), 对比: Number(compare.avgTension.toFixed(1)) },
    { name: '高风险针', 当前: current.highRiskCount, 对比: compare.highRiskCount },
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

        <Paper
          p="xs"
          radius="sm"
          style={{ background: 'rgba(10, 22, 40, 0.6)' }}
        >
          <Text size="xs" c="dimmed" lh={1.5}>
            💡 对比说明：绿色表示当前方案更优，红色表示当前方案需要改进。
            点击方案管理中的「设为对比」可切换对比对象。
          </Text>
        </Paper>
      </Stack>
    </Paper>
  );
}
