import { useMemo } from 'react';
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
  ScrollArea,
  Tooltip,
} from '@mantine/core';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts';
import {
  Activity,
  TrendingUp,
  AlertTriangle,
  Shield,
  Scissors,
  Waves,
  Target,
  Gauge,
  Flame,
  CheckCircle,
} from 'lucide-react';
import { useCylinderStore } from '@/store/cylinderStore';
import {
  WARNING_STRETCH_THRESHOLD,
  CRITICAL_STRETCH_THRESHOLD,
  WARNING_FLUCTUATION_PERCENT,
  CRITICAL_FLUCTUATION_PERCENT,
  WARNING_WEAR_LEVEL,
  CRITICAL_WEAR_LEVEL,
  WARNING_BREAK_RISK,
  CRITICAL_BREAK_RISK,
} from '@/types/cylinder';

export default function YarnAnalysisPanel() {
  const {
    yarnSimulationStats,
    yarnFeeders,
    totalNeedles,
    continuousSimulation,
    yarnSimulationEnabled,
  } = useCylinderStore();

  const analysis = yarnSimulationStats?.analysisResult;
  const lastFrame = yarnSimulationStats?.lastFrame;

  const deliveryChartData = useMemo(() => {
    if (!yarnSimulationStats) return [];
    const maxLen = Math.max(
      ...yarnFeeders
        .filter(f => f.enabled)
        .map(f => (yarnSimulationStats.deliveryHistory[f.id] || []).length),
      1
    );
    const data: Array<Record<string, any>> = [];
    for (let i = 0; i < maxLen; i++) {
      const point: Record<string, any> = { index: i + 1 };
      for (const feeder of yarnFeeders) {
        if (!feeder.enabled) continue;
        const hist = yarnSimulationStats.deliveryHistory[feeder.id] || [];
        point[feeder.name] = hist[i] ?? 0;
      }
      data.push(point);
    }
    return data.slice(-50);
  }, [yarnSimulationStats, yarnFeeders]);

  const stretchChartData = useMemo(() => {
    if (!yarnSimulationStats) return [];
    const maxLen = Math.max(
      ...yarnFeeders
        .filter(f => f.enabled)
        .map(f => (yarnSimulationStats.stretchHistory[f.id] || []).length),
      1
    );
    const data: Array<Record<string, any>> = [];
    for (let i = 0; i < maxLen; i++) {
      const point: Record<string, any> = { index: i + 1 };
      for (const feeder of yarnFeeders) {
        if (!feeder.enabled) continue;
        const hist = yarnSimulationStats.stretchHistory[feeder.id] || [];
        point[feeder.name] = hist[i] ?? 0;
      }
      data.push(point);
    }
    return data.slice(-50);
  }, [yarnSimulationStats, yarnFeeders]);

  const wearData = useMemo(() => {
    if (!yarnSimulationStats) return [];
    return yarnSimulationStats.wearAccumulation.map((wear, i) => ({
      id: `#${i + 1}`,
      needleId: i,
      wear: Math.min(wear, 100),
      critical: wear > CRITICAL_WEAR_LEVEL,
      warning: wear > WARNING_WEAR_LEVEL,
    }));
  }, [yarnSimulationStats]);

  const radarData = useMemo(() => {
    if (!analysis) return [];
    return [
      { subject: '稳定性', A: analysis.overallStability, fullMark: 100 },
      { subject: '断线风险', A: 100 - analysis.breakRiskScore, fullMark: 100 },
      { subject: '送纱均匀', A: 100 - analysis.avgFluctuation, fullMark: 100 },
      { subject: '抗拉伸', A: Math.max(0, 100 - analysis.maxStretchPeak * 3), fullMark: 100 },
      { subject: '耐磨损', A: Math.max(0, 100 - (analysis.criticalWearZones.length * 20)), fullMark: 100 },
    ];
  }, [analysis]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (value: number, warn: number, crit: number) => {
    if (value >= crit) return 'red';
    if (value >= warn) return 'orange';
    return 'green';
  };

  const getWearBarColor = (entry: { critical: boolean; warning: boolean }) => {
    if (entry.critical) return '#ff0000';
    if (entry.warning) return '#ff4757';
    return '#2ed573';
  };

  if (!yarnSimulationEnabled) {
    return (
      <Paper
        p="md"
        radius="md"
        style={{
          background: 'rgba(26, 41, 66, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Stack align="center" ta="center" gap="sm" py="xl">
          <Activity size={40} color="#6c7a8c" />
          <Text size="sm" c="dimmed">
            送纱系统未启用
          </Text>
          <Text size="xs" c="dimmed">
            请在送纱系统面板中开启分析功能
          </Text>
        </Stack>
      </Paper>
    );
  }

  if (!continuousSimulation || !yarnSimulationStats) {
    return (
      <Paper
        p="md"
        radius="md"
        style={{
          background: 'rgba(26, 41, 66, 0.9)',
          border: '1px dashed rgba(255, 107, 53, 0.3)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Stack align="center" ta="center" gap="sm" py="xl">
          <Gauge size={40} color="#ff6b35" />
          <Title order={5} c="orange.4">
            纱线稳定性分析
          </Title>
          <Text size="sm" c="dimmed">
            点击「运行模拟」中的「开始模拟」启动连续运行统计
          </Text>
          <Text size="xs" c="dimmed">
            系统将实时分析送纱波动、拉伸峰值、易磨损区和断线风险
          </Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper
      p="md"
      radius="md"
      style={{
        background: 'rgba(26, 41, 66, 0.9)',
        border: '1px solid rgba(255, 107, 53, 0.3)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Activity size={18} color="#ff6b35" />
            <Title order={5} c="orange.4">
              纱线稳定性分析
            </Title>
          </Group>
          <Group gap="xs">
            <Badge size="sm" color="cyan" variant="dot">
              {formatTime(yarnSimulationStats.totalRuntime)}
            </Badge>
            <Badge size="sm" color="yellow" variant="outline">
              {yarnSimulationStats.totalRotations.toFixed(1)} 转
            </Badge>
          </Group>
        </Group>

        <Divider c="dark.4" />

        {analysis && (
          <SimpleGrid cols={2} spacing="sm">
            <Paper
              p="sm"
              radius="sm"
              style={{
                background:
                  analysis.overallStability < 50
                    ? 'rgba(255, 71, 87, 0.1)'
                    : analysis.overallStability < 75
                    ? 'rgba(255, 215, 0, 0.1)'
                    : 'rgba(46, 213, 115, 0.1)',
                border: `1px solid ${
                  analysis.overallStability < 50
                    ? 'rgba(255, 71, 87, 0.3)'
                    : analysis.overallStability < 75
                    ? 'rgba(255, 215, 0, 0.3)'
                    : 'rgba(46, 213, 115, 0.3)'
                }`,
              }}
            >
              <Group gap="xs" mb="xs">
                <Shield
                  size={14}
                  color={
                    analysis.overallStability < 50
                      ? '#ff4757'
                      : analysis.overallStability < 75
                      ? '#ffd700'
                      : '#2ed573'
                  }
                />
                <Text size="xs" c="dimmed">
                  综合稳定性
                </Text>
              </Group>
              <Text
                size="xl"
                fw={700}
                c={
                  analysis.overallStability < 50
                    ? 'red.4'
                    : analysis.overallStability < 75
                    ? 'yellow.4'
                    : 'green.4'
                }
              >
                {analysis.overallStability.toFixed(0)}
                <Text span size="sm" c="dimmed" ml={4}>
                  /100
                </Text>
              </Text>
              <Progress
                value={analysis.overallStability}
                size="xs"
                mt="xs"
                color={getStatusColor(100 - analysis.overallStability, 25, 50)}
                radius="sm"
              />
            </Paper>

            <Paper
              p="sm"
              radius="sm"
              style={{
                background:
                  analysis.breakRiskScore > CRITICAL_BREAK_RISK
                    ? 'rgba(255, 0, 0, 0.15)'
                    : analysis.breakRiskScore > WARNING_BREAK_RISK
                    ? 'rgba(255, 71, 87, 0.1)'
                    : 'rgba(46, 213, 115, 0.1)',
                border: `1px solid ${
                  analysis.breakRiskScore > CRITICAL_BREAK_RISK
                    ? 'rgba(255, 0, 0, 0.4)'
                    : analysis.breakRiskScore > WARNING_BREAK_RISK
                    ? 'rgba(255, 71, 87, 0.3)'
                    : 'rgba(46, 213, 115, 0.3)'
                }`,
              }}
            >
              <Group gap="xs" mb="xs">
                <Scissors
                  size={14}
                  color={
                    analysis.breakRiskScore > CRITICAL_BREAK_RISK
                      ? '#ff0000'
                      : analysis.breakRiskScore > WARNING_BREAK_RISK
                      ? '#ff4757'
                      : '#2ed573'
                  }
                />
                <Text size="xs" c="dimmed">
                  断线风险
                </Text>
              </Group>
              <Text
                size="xl"
                fw={700}
                c={
                  analysis.breakRiskScore > CRITICAL_BREAK_RISK
                    ? 'red.6'
                    : analysis.breakRiskScore > WARNING_BREAK_RISK
                    ? 'red.4'
                    : 'green.4'
                }
              >
                {analysis.breakRiskScore.toFixed(0)}
                <Text span size="sm" c="dimmed" ml={4}>
                  /100
                </Text>
              </Text>
              <Progress
                value={analysis.breakRiskScore}
                size="xs"
                mt="xs"
                color={getStatusColor(analysis.breakRiskScore, WARNING_BREAK_RISK, CRITICAL_BREAK_RISK)}
                radius="sm"
              />
            </Paper>

            <Paper
              p="sm"
              radius="sm"
              style={{ background: 'rgba(10, 22, 40, 0.6)' }}
            >
              <Group gap="xs" mb="xs">
                <Waves size={14} color="#00d4ff" />
                <Text size="xs" c="dimmed">
                  平均送纱波动
                </Text>
              </Group>
              <Text
                size="xl"
                fw={700}
                c={
                  analysis.avgFluctuation > CRITICAL_FLUCTUATION_PERCENT
                    ? 'red.4'
                    : analysis.avgFluctuation > WARNING_FLUCTUATION_PERCENT
                    ? 'yellow.4'
                    : 'cyan.4'
                }
              >
                {analysis.avgFluctuation.toFixed(1)}
                <Text span size="sm" c="dimmed" ml={4}>
                  %
                </Text>
              </Text>
              <Progress
                value={Math.min(analysis.avgFluctuation * 3, 100)}
                size="xs"
                mt="xs"
                color={getStatusColor(analysis.avgFluctuation, WARNING_FLUCTUATION_PERCENT, CRITICAL_FLUCTUATION_PERCENT)}
                radius="sm"
              />
            </Paper>

            <Paper
              p="sm"
              radius="sm"
              style={{ background: 'rgba(10, 22, 40, 0.6)' }}
            >
              <Group gap="xs" mb="xs">
                <TrendingUp size={14} color="#ff6b35" />
                <Text size="xs" c="dimmed">
                  最大拉伸峰值
                </Text>
              </Group>
              <Text
                size="xl"
                fw={700}
                c={
                  analysis.maxStretchPeak > CRITICAL_STRETCH_THRESHOLD
                    ? 'red.4'
                    : analysis.maxStretchPeak > WARNING_STRETCH_THRESHOLD
                    ? 'yellow.4'
                    : 'orange.4'
                }
              >
                {analysis.maxStretchPeak.toFixed(1)}
                <Text span size="sm" c="dimmed" ml={4}>
                  %
                </Text>
              </Text>
              <Progress
                value={Math.min(analysis.maxStretchPeak * 4, 100)}
                size="xs"
                mt="xs"
                color={getStatusColor(analysis.maxStretchPeak, WARNING_STRETCH_THRESHOLD, CRITICAL_STRETCH_THRESHOLD)}
                radius="sm"
              />
            </Paper>
          </SimpleGrid>
        )}

        {analysis && analysis.topRiskNeedles.length > 0 && (
          <Paper
            p="xs"
            radius="sm"
            style={{
              background: 'rgba(255, 71, 87, 0.1)',
              border: '1px solid rgba(255, 71, 87, 0.3)',
            }}
          >
            <Group gap="xs" mb="xs">
              <Target size={14} color="#ff4757" />
              <Text size="xs" fw={500} c="red.4">
                高风险针位 Top 5
              </Text>
            </Group>
            <Group gap="xs" wrap="wrap">
              {analysis.topRiskNeedles.slice(0, 5).map((id) => (
                <Badge key={id} size="sm" color="red" variant="filled">
                  #{id + 1}
                </Badge>
              ))}
            </Group>
          </Paper>
        )}

        <Divider c="dark.4" />

        <Stack gap="xs">
          <Group justify="space-between">
            <Group gap="xs">
              <Waves size={14} color="#00d4ff" />
              <Text size="sm" fw={500}>
                送纱波动趋势
              </Text>
            </Group>
            <Text size="xs" c="dimmed">
              最近 {deliveryChartData.length} 帧
            </Text>
          </Group>
          <Paper p="sm" radius="sm" style={{ background: 'rgba(10, 22, 40, 0.6)' }}>
            <div style={{ height: 120, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={deliveryChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a3f5f" />
                  <XAxis
                    dataKey="index"
                    tick={{ fill: '#6c7a8c', fontSize: 9 }}
                    interval={10}
                    axisLine={{ stroke: '#2a3f5f' }}
                    tickLine={{ stroke: '#2a3f5f' }}
                  />
                  <YAxis
                    tick={{ fill: '#6c7a8c', fontSize: 10 }}
                    axisLine={{ stroke: '#2a3f5f' }}
                    tickLine={{ stroke: '#2a3f5f' }}
                    domain={[0, 'auto']}
                  />
                  <ReTooltip
                    contentStyle={{
                      backgroundColor: '#1a2942',
                      border: '1px solid #00d4ff',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, '波动']}
                  />
                  {yarnFeeders.filter(f => f.enabled).map((feeder) => (
                    <Line
                      key={feeder.id}
                      type="monotone"
                      dataKey={feeder.name}
                      stroke={feeder.color}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Paper>
        </Stack>

        <Stack gap="xs">
          <Group justify="space-between">
            <Group gap="xs">
              <TrendingUp size={14} color="#ff6b35" />
              <Text size="sm" fw={500}>
                局部拉伸趋势
              </Text>
            </Group>
            <Group gap="xs">
              <Badge size="xs" color="yellow" variant="outline">
                阈值 {WARNING_STRETCH_THRESHOLD}%
              </Badge>
            </Group>
          </Group>
          <Paper p="sm" radius="sm" style={{ background: 'rgba(10, 22, 40, 0.6)' }}>
            <div style={{ height: 120, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stretchChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a3f5f" />
                  <XAxis
                    dataKey="index"
                    tick={{ fill: '#6c7a8c', fontSize: 9 }}
                    interval={10}
                    axisLine={{ stroke: '#2a3f5f' }}
                    tickLine={{ stroke: '#2a3f5f' }}
                  />
                  <YAxis
                    tick={{ fill: '#6c7a8c', fontSize: 10 }}
                    axisLine={{ stroke: '#2a3f5f' }}
                    tickLine={{ stroke: '#2a3f5f' }}
                    domain={[0, 'auto']}
                  />
                  <ReTooltip
                    contentStyle={{
                      backgroundColor: '#1a2942',
                      border: '1px solid #ff6b35',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, '拉伸']}
                  />
                  {yarnFeeders.filter(f => f.enabled).map((feeder) => (
                    <Line
                      key={feeder.id}
                      type="monotone"
                      dataKey={feeder.name}
                      stroke={feeder.color}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Paper>
        </Stack>

        {analysis && (
          <Stack gap="xs">
            <Group justify="space-between">
              <Group gap="xs">
                <Flame size={14} color="#ffd700" />
                <Text size="sm" fw={500}>
                  五维性能雷达图
                </Text>
              </Group>
            </Group>
            <Paper p="sm" radius="sm" style={{ background: 'rgba(10, 22, 40, 0.6)' }}>
              <div style={{ height: 180, width: '100%' }}>
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
                      tick={{ fill: '#6c7a8c', fontSize: 9 }}
                    />
                    <Radar
                      name="性能"
                      dataKey="A"
                      stroke="#00d4ff"
                      fill="#00d4ff"
                      fillOpacity={0.3}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 10, color: '#6c7a8c' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </Paper>
          </Stack>
        )}

        <Divider c="dark.4" />

        <Stack gap="xs">
          <Group justify="space-between">
            <Group gap="xs">
              <AlertTriangle size={14} color="#ff6b35" />
              <Text size="sm" fw={500}>
                针位磨损分布
              </Text>
            </Group>
            <Text size="xs" c="dimmed">
              前 {Math.min(24, totalNeedles)} 针
            </Text>
          </Group>
          <Paper p="sm" radius="sm" style={{ background: 'rgba(10, 22, 40, 0.6)' }}>
            <div style={{ height: 100, width: '100%', minWidth: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={wearData.slice(0, 24)} barSize={8}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a3f5f" />
                  <XAxis
                    dataKey="id"
                    tick={{ fill: '#6c7a8c', fontSize: 8 }}
                    interval={2}
                    axisLine={{ stroke: '#2a3f5f' }}
                    tickLine={{ stroke: '#2a3f5f' }}
                  />
                  <YAxis
                    tick={{ fill: '#6c7a8c', fontSize: 9 }}
                    axisLine={{ stroke: '#2a3f5f' }}
                    tickLine={{ stroke: '#2a3f5f' }}
                    domain={[0, 100]}
                  />
                  <ReTooltip
                    contentStyle={{
                      backgroundColor: '#1a2942',
                      border: '1px solid #ff6b35',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [`${value.toFixed(1)}`, '磨损度']}
                  />
                  <Bar dataKey="wear" radius={[2, 2, 0, 0]}>
                    {wearData.slice(0, 24).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getWearBarColor(entry)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Paper>
        </Stack>

        {lastFrame && lastFrame.wearZones.length > 0 && (
          <Stack gap="xs">
            <Group justify="space-between">
              <Group gap="xs">
                <AlertTriangle size={14} color="#ff4757" />
                <Text size="sm" fw={500}>
                  易磨损区域
                </Text>
              </Group>
              <Badge size="xs" color="red" variant="outline">
                {lastFrame.wearZones.length} 处
              </Badge>
            </Group>
            <ScrollArea h={120} type="auto">
              <Stack gap="xs">
                {lastFrame.wearZones.map((zone, idx) => (
                  <Paper
                    key={idx}
                    p="xs"
                    radius="sm"
                    style={{
                      background:
                        zone.riskLevel === 'high'
                          ? 'rgba(255, 0, 0, 0.1)'
                          : zone.riskLevel === 'medium'
                          ? 'rgba(255, 71, 87, 0.1)'
                          : 'rgba(255, 215, 0, 0.1)',
                      border: `1px solid ${
                        zone.riskLevel === 'high'
                          ? 'rgba(255, 0, 0, 0.3)'
                          : zone.riskLevel === 'medium'
                          ? 'rgba(255, 71, 87, 0.3)'
                          : 'rgba(255, 215, 0, 0.3)'
                      }`,
                    }}
                  >
                    <Group justify="space-between" mb={4}>
                      <Group gap="xs">
                        <Badge
                          size="xs"
                          color={
                            zone.riskLevel === 'high'
                              ? 'red'
                              : zone.riskLevel === 'medium'
                              ? 'orange'
                              : 'yellow'
                          }
                        >
                          #{zone.startNeedle + 1} - #{zone.endNeedle + 1}
                        </Badge>
                        <Badge size="xs" variant="outline" color="gray">
                          {zone.endNeedle - zone.startNeedle + 1} 针
                        </Badge>
                      </Group>
                      <Text
                        size="xs"
                        fw={600}
                        c={
                          zone.riskLevel === 'high'
                            ? 'red.4'
                            : zone.riskLevel === 'medium'
                            ? 'orange.4'
                            : 'yellow.4'
                        }
                      >
                        {zone.avgWearLevel.toFixed(1)}
                      </Text>
                    </Group>
                    <Progress
                      value={zone.avgWearLevel}
                      size="xs"
                      color={
                        zone.riskLevel === 'high'
                          ? 'red'
                          : zone.riskLevel === 'medium'
                          ? 'orange'
                          : 'yellow'
                      }
                      radius="sm"
                    />
                    <Group justify="space-between" mt={4}>
                      <Text size="xs" c="dimmed">
                        通过次数: {zone.totalPasses}
                      </Text>
                      <Badge
                        size="xs"
                        color={
                          zone.riskLevel === 'high'
                            ? 'red'
                            : zone.riskLevel === 'medium'
                            ? 'orange'
                            : 'yellow'
                        }
                        variant="dot"
                      >
                        {zone.riskLevel === 'high'
                          ? '高危'
                          : zone.riskLevel === 'medium'
                          ? '中危'
                          : '低危'}
                      </Badge>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </ScrollArea>
          </Stack>
        )}

        {lastFrame && lastFrame.stretchPeaks.length > 0 && (
          <Stack gap="xs">
            <Group justify="space-between">
              <Group gap="xs">
                <TrendingUp size={14} color="#ff4757" />
                <Text size="sm" fw={500}>
                  拉伸峰值排行
                </Text>
              </Group>
              <Badge size="xs" color="red" variant="outline">
                Top 10
              </Badge>
            </Group>
            <ScrollArea h={120} type="auto">
              <Stack gap="xs">
                {lastFrame.stretchPeaks.slice(0, 10).map((peak, idx) => (
                  <Paper
                    key={`${peak.needleId}-${idx}`}
                    p="xs"
                    radius="sm"
                    style={{
                      background:
                        peak.severity === 'high'
                          ? 'rgba(255, 0, 0, 0.1)'
                          : peak.severity === 'medium'
                          ? 'rgba(255, 71, 87, 0.1)'
                          : 'rgba(255, 215, 0, 0.1)',
                      borderLeft: `3px solid ${
                        peak.severity === 'high'
                          ? '#ff0000'
                          : peak.severity === 'medium'
                          ? '#ff4757'
                          : '#ffd700'
                      }`,
                    }}
                  >
                    <Group justify="space-between">
                      <Group gap="xs">
                        <Badge
                          size="xs"
                          color={idx < 3 ? 'orange' : 'cyan'}
                        >
                          #{idx + 1}
                        </Badge>
                        <Text size="sm" fw={500}>
                          针位 #{peak.needleId + 1}
                        </Text>
                      </Group>
                      <Group gap="xs">
                        <Text
                          size="sm"
                          fw={600}
                          c={
                            peak.severity === 'high'
                              ? 'red.4'
                              : peak.severity === 'medium'
                              ? 'orange.4'
                              : 'yellow.4'
                          }
                        >
                          {peak.value.toFixed(1)}%
                        </Text>
                      </Group>
                    </Group>
                    <Progress
                      value={Math.min(peak.value * 4, 100)}
                      size="xs"
                      mt={4}
                      color={
                        peak.severity === 'high'
                          ? 'red'
                          : peak.severity === 'medium'
                          ? 'orange'
                          : 'yellow'
                      }
                      radius="sm"
                    />
                  </Paper>
                ))}
              </Stack>
            </ScrollArea>
          </Stack>
        )}

        {analysis && analysis.criticalWearZones.length === 0 && analysis.topRiskNeedles.length === 0 && (
          <Paper
            p="sm"
            radius="sm"
            style={{
              background: 'rgba(46, 213, 115, 0.1)',
              border: '1px solid rgba(46, 213, 115, 0.3)',
            }}
          >
            <Group gap="xs" justify="center">
              <CheckCircle size={16} color="#2ed573" />
              <Text size="sm" c="green.4" fw={500}>
                当前纱线运行状态良好，无临界风险区域
              </Text>
            </Group>
          </Paper>
        )}

        <Paper p="xs" radius="sm" style={{ background: 'rgba(10, 22, 40, 0.6)' }}>
          <Text size="xs" c="dimmed" lh={1.5}>
            📊 数据基于实时运行模拟统计。
            建议保持波动＜{WARNING_FLUCTUATION_PERCENT}%、拉伸＜{WARNING_STRETCH_THRESHOLD}%、磨损＜{WARNING_WEAR_LEVEL}。
            超过阈值的区域会在针筒视图上高亮预警。
          </Text>
        </Paper>
      </Stack>
    </Paper>
  );
}
