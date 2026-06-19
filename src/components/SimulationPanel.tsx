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
} from '@mantine/core';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Play,
  Pause,
  Clock,
  RotateCcw,
  Thermometer,
  AlertTriangle,
  BarChart3,
  Flame,
  Download,
} from 'lucide-react';
import { useCylinderStore } from '@/store/cylinderStore';
import { HIGH_RISK_THRESHOLD } from '@/types/cylinder';

export default function SimulationPanel() {
  const {
    continuousSimulation,
    toggleContinuousSimulation,
    simulationStats,
    needles,
    isRunning,
    exportSimulationStats,
  } = useCylinderStore();

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const topRiskNeedles = useMemo(() => {
    if (!simulationStats) return [];
    return [...simulationStats.needleRiskStats]
      .filter((stat) => {
        const needle = needles.find((n) => n.id === stat.id);
        return needle?.enabled;
      })
      .sort((a, b) => b.totalRiskScore - a.totalRiskScore)
      .slice(0, 10);
  }, [simulationStats, needles]);

  const riskHistoryData = useMemo(() => {
    if (!simulationStats) return [];
    return needles.slice(0, 24).map((n) => {
      const stat = simulationStats.needleRiskStats.find((s) => s.id === n.id);
      return {
        name: `#${n.id + 1}`,
        risk: stat ? Math.min(stat.totalRiskScore / 10, 100) : 0,
        tension: n.tension,
        enabled: n.enabled,
      };
    });
  }, [simulationStats, needles]);

  const handleExportStats = () => {
    try {
      const data = exportSimulationStats();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `simulation-stats-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('导出失败:', e);
    }
  };

  const getRiskColor = (score: number): string => {
    const normalized = Math.min(score / 1000, 1);
    if (normalized > 0.7) return '#ff4757';
    if (normalized > 0.4) return '#ff6b35';
    if (normalized > 0.2) return '#ffd700';
    return '#00d4ff';
  };

  return (
    <Paper
      p="md"
      radius="md"
      style={{
        background: 'rgba(26, 41, 66, 0.9)',
        border: `1px solid ${
          continuousSimulation
            ? 'rgba(255, 107, 53, 0.4)'
            : 'rgba(255, 107, 53, 0.2)'
        }`,
        backdropFilter: 'blur(10px)',
      }}
    >
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Flame
              size={18}
              color={continuousSimulation ? '#ff6b35' : '#6c7a8c'}
            />
            <Title
              order={5}
              c={continuousSimulation ? 'orange.4' : 'dimmed'}
            >
              连续运行模拟
            </Title>
          </Group>
          <Group gap="xs">
            {simulationStats && (
              <Badge
                size="sm"
                color={continuousSimulation ? 'green' : 'gray'}
                variant="dot"
              >
                {continuousSimulation ? '运行中' : '已暂停'}
              </Badge>
            )}
          </Group>
        </Group>

        <Divider c="dark.4" />

        <Group grow>
          <Paper
            p="xs"
            radius="sm"
            style={{
              background: continuousSimulation
                ? 'rgba(255, 107, 53, 0.1)'
                : 'rgba(10, 22, 40, 0.6)',
              border: `1px solid ${
                continuousSimulation
                  ? 'rgba(255, 107, 53, 0.3)'
                  : 'rgba(255, 255, 255, 0.1)'
              }`,
              cursor: 'pointer',
            }}
            onClick={toggleContinuousSimulation}
          >
            <Group justify="space-between" align="center">
              <Group gap="xs">
                {continuousSimulation ? (
                  <Pause size={16} color="#ff6b35" />
                ) : (
                  <Play size={16} color="#2ed573" />
                )}
                <Text size="sm" fw={500}>
                  {continuousSimulation ? '暂停模拟' : '开始模拟'}
                </Text>
              </Group>
              <Badge
                size="xs"
                color={continuousSimulation ? 'orange' : 'green'}
              >
                {continuousSimulation ? '点击暂停' : '点击开始'}
              </Badge>
            </Group>
          </Paper>
          {simulationStats && (
            <Paper
              p="xs"
              radius="sm"
              style={{
                background: 'rgba(10, 22, 40, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
              }}
              onClick={handleExportStats}
            >
              <Group justify="space-between" align="center">
                <Group gap="xs">
                  <Download size={16} color="#00d4ff" />
                  <Text size="sm" fw={500}>
                    导出统计
                  </Text>
                </Group>
              </Group>
            </Paper>
          )}
        </Group>

        {!simulationStats ? (
          <Paper
            p="md"
            radius="sm"
            style={{
              background: 'rgba(10, 22, 40, 0.6)',
              border: '1px dashed rgba(255, 107, 53, 0.3)',
            }}
          >
            <Stack align="center" ta="center" gap="xs">
              <BarChart3 size={32} color="#6c7a8c" />
              <Text size="sm" c="dimmed">
                点击「开始模拟」启动连续运行统计
              </Text>
              <Text size="xs" c="dimmed">
                系统将实时累计各针位的风险值和运行时长
              </Text>
            </Stack>
          </Paper>
        ) : (
          <>
            <SimpleGrid cols={2} spacing="xs">
              <Paper
                p="xs"
                radius="sm"
                style={{ background: 'rgba(10, 22, 40, 0.6)' }}
              >
                <Group gap="xs" mb="xs">
                  <Clock size={14} color="#00d4ff" />
                  <Text size="xs" c="dimmed">
                    累计运行
                  </Text>
                </Group>
                <Text size="xl" fw={700} c="cyan.4">
                  {formatTime(simulationStats.totalRuntime)}
                </Text>
              </Paper>

              <Paper
                p="xs"
                radius="sm"
                style={{ background: 'rgba(10, 22, 40, 0.6)' }}
              >
                <Group gap="xs" mb="xs">
                  <RotateCcw size={14} color="#ffd700" />
                  <Text size="xs" c="dimmed">
                    累计转圈
                  </Text>
                </Group>
                <Text size="xl" fw={700} c="yellow.4">
                  {simulationStats.totalRotations.toFixed(1)}
                </Text>
              </Paper>

              <Paper
                p="xs"
                radius="sm"
                style={{ background: 'rgba(10, 22, 40, 0.6)' }}
              >
                <Group gap="xs" mb="xs">
                  <Thermometer size={14} color="#ff6b35" />
                  <Text size="xs" c="dimmed">
                    平均张力
                  </Text>
                </Group>
                <Text size="xl" fw={700} c="orange.4">
                  {simulationStats.avgTensionOverTime.toFixed(1)}
                  <Text span size="sm" c="dimmed" ml={4}>
                    N
                  </Text>
                </Text>
              </Paper>

              <Paper
                p="xs"
                radius="sm"
                style={{ background: 'rgba(10, 22, 40, 0.6)' }}
              >
                <Group gap="xs" mb="xs">
                  <AlertTriangle size={14} color="#ff4757" />
                  <Text size="xs" c="dimmed">
                    最高张力
                  </Text>
                </Group>
                <Text
                  size="xl"
                  fw={700}
                  c={
                    simulationStats.maxTensionReached > HIGH_RISK_THRESHOLD
                      ? 'red.4'
                      : 'green.4'
                  }
                >
                  {simulationStats.maxTensionReached.toFixed(1)}
                  <Text span size="sm" c="dimmed" ml={4}>
                    N
                  </Text>
                </Text>
              </Paper>
            </SimpleGrid>

            <Divider c="dark.4" />

            <Stack gap="xs">
              <Text size="sm" fw={500}>
                累计风险分布 (前24针)
              </Text>
              <Paper
                p="sm"
                radius="sm"
                style={{ background: 'rgba(10, 22, 40, 0.6)' }}
              >
                <div style={{ height: 120, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={riskHistoryData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#2a3f5f"
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: '#6c7a8c', fontSize: 9 }}
                        interval={2}
                        axisLine={{ stroke: '#2a3f5f' }}
                        tickLine={{ stroke: '#2a3f5f' }}
                      />
                      <YAxis
                        tick={{ fill: '#6c7a8c', fontSize: 10 }}
                        axisLine={{ stroke: '#2a3f5f' }}
                        tickLine={{ stroke: '#2a3f5f' }}
                        domain={[0, 100]}
                      />
                      <ReTooltip
                        contentStyle={{
                          backgroundColor: '#1a2942',
                          border: '1px solid #00d4ff',
                          borderRadius: '6px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                        formatter={(value: number) => [
                          `${value.toFixed(1)}`,
                          '累计风险',
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="risk"
                        stroke="#ff6b35"
                        strokeWidth={2}
                        dot={{ fill: '#ff6b35', r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Paper>
            </Stack>

            <Divider c="dark.4" />

            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" fw={500}>
                  高风险针位排行 (Top 10)
                </Text>
                <Text size="xs" c="dimmed">
                  按累计风险值排序
                </Text>
              </Group>

              <ScrollArea h={160} type="auto">
                <Stack gap="xs">
                  {topRiskNeedles.length === 0 ? (
                    <Paper
                      p="sm"
                      radius="sm"
                      style={{ background: 'rgba(46, 213, 115, 0.1)' }}
                    >
                      <Text size="sm" c="green.4" ta="center">
                        ✅ 暂无高风险针位
                      </Text>
                    </Paper>
                  ) : (
                    topRiskNeedles.map((stat, index) => {
                      const needle = needles.find((n) => n.id === stat.id);
                      const riskPercent = Math.min(
                        (stat.totalRiskScore / 1000) * 100,
                        100
                      );
                      return (
                        <Paper
                          key={stat.id}
                          p="xs"
                          radius="sm"
                          style={{
                            background: 'rgba(10, 22, 40, 0.6)',
                            borderLeft: `3px solid ${getRiskColor(
                              stat.totalRiskScore
                            )}`,
                          }}
                        >
                          <Group justify="space-between" mb={4}>
                            <Group gap="xs">
                              <Badge
                                size="xs"
                                color={
                                  index < 3 ? 'orange' : 'cyan'
                                }
                              >
                                #{index + 1}
                              </Badge>
                              <Text size="sm" fw={500}>
                                针位 #{stat.id + 1}
                              </Text>
                            </Group>
                            <Text
                              size="xs"
                              fw={600}
                              c={getRiskColor(stat.totalRiskScore)}
                            >
                              {stat.totalRiskScore.toFixed(1)}
                            </Text>
                          </Group>
                          <Progress
                            value={riskPercent}
                            size="xs"
                            color={getRiskColor(stat.totalRiskScore)}
                            radius="sm"
                          />
                          <Group justify="space-between" mt={4}>
                            <Text size="xs" c="dimmed">
                              高风险时长:{' '}
                              {formatTime(stat.highRiskDuration)}
                            </Text>
                            <Text size="xs" c="dimmed">
                              当前张力:{' '}
                              <Text
                                span
                                c={
                                  needle && needle.tension > HIGH_RISK_THRESHOLD
                                    ? 'red.4'
                                    : 'cyan.4'
                                }
                                fw={500}
                              >
                                {needle?.tension.toFixed(1) || 0} N
                              </Text>
                            </Text>
                          </Group>
                        </Paper>
                      );
                    })
                  )}
                </Stack>
              </ScrollArea>
            </Stack>
          </>
        )}

        <Paper
          p="xs"
          radius="sm"
          style={{ background: 'rgba(10, 22, 40, 0.6)' }}
        >
          <Text size="xs" c="dimmed" lh={1.5}>
            🔥 连续运行模式会实时计算每个针位的累计风险值，综合考虑张力、转速和运行时间。
            开启热力图模式可在针筒上直观查看风险分布。
          </Text>
        </Paper>
      </Stack>
    </Paper>
  );
}
