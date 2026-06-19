import {
  Paper,
  Title,
  Stack,
  Group,
  Text,
  Badge,
  Divider,
  SimpleGrid,
  ScrollArea,
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
  Cell,
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Layers,
} from 'lucide-react';
import { useCylinderStore, useCylinderStats } from '@/store/cylinderStore';
import { HIGH_RISK_THRESHOLD } from '@/types/cylinder';

export default function StatsPanel() {
  const { needles } = useCylinderStore();
  const stats = useCylinderStats();

  const highRiskNeedles = needles.filter(
    (n) => n.enabled && n.tension > HIGH_RISK_THRESHOLD
  );

  const tensionData = needles.slice(0, 24).map((n) => ({
    id: `#${n.id + 1}`,
    tension: Math.round(n.tension),
    enabled: n.enabled,
    highRisk: n.enabled && n.tension > HIGH_RISK_THRESHOLD,
  }));

  const getBarColor = (entry: { enabled: boolean; highRisk: boolean }) => {
    if (!entry.enabled) return '#3a4a6a';
    if (entry.highRisk) return '#ff4757';
    return '#00d4ff';
  };

  return (
    <Paper
      p="md"
      radius="md"
      style={{
        background: 'rgba(26, 41, 66, 0.9)',
        border: '1px solid rgba(0, 212, 255, 0.2)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={4} c="cyan.4">
            数据统计
          </Title>
          <Activity size={18} color="#00d4ff" />
        </Group>

        <Divider c="dark.4" />

        <SimpleGrid cols={2} spacing="sm">
          <Paper
            p="sm"
            radius="sm"
            style={{ background: 'rgba(10, 22, 40, 0.6)' }}
          >
            <Group gap="xs" mb="xs">
              <CheckCircle size={14} color="#2ed573" />
              <Text size="xs" c="dimmed">
                启用针数
              </Text>
            </Group>
            <Text size="xl" fw={700} c="green.4">
              {stats.enabledCount}
              <Text span size="sm" c="dimmed" ml={4}>
                / {stats.totalNeedles}
              </Text>
            </Text>
          </Paper>

          <Paper
            p="sm"
            radius="sm"
            style={{ background: 'rgba(10, 22, 40, 0.6)' }}
          >
            <Group gap="xs" mb="xs">
              <XCircle size={14} color="#6c7a8c" />
              <Text size="xs" c="dimmed">
                停用针数
              </Text>
            </Group>
            <Text size="xl" fw={700} c="gray.5">
              {stats.disabledCount}
            </Text>
          </Paper>

          <Paper
            p="sm"
            radius="sm"
            style={{ background: 'rgba(10, 22, 40, 0.6)' }}
          >
            <Group gap="xs" mb="xs">
              <Layers size={14} color="#ffd700" />
              <Text size="xs" c="dimmed">
                花型重复
              </Text>
            </Group>
            <Text size="xl" fw={700} c="yellow.4">
              {stats.patternRepeats}
              <Text span size="sm" c="dimmed" ml={4}>
                次
              </Text>
            </Text>
          </Paper>

          <Paper
            p="sm"
            radius="sm"
            style={{ background: 'rgba(10, 22, 40, 0.6)' }}
          >
            <Group gap="xs" mb="xs">
              <TrendingUp size={14} color="#00d4ff" />
              <Text size="xs" c="dimmed">
                平均张力
              </Text>
            </Group>
            <Text size="xl" fw={700} c="cyan.4">
              {stats.averageTension.toFixed(1)}
              <Text span size="sm" c="dimmed" ml={4}>
                N
              </Text>
            </Text>
          </Paper>
        </SimpleGrid>

        <Paper
          p="sm"
          radius="sm"
          style={{
            background:
              stats.highRiskCount > 0
                ? 'rgba(255, 71, 87, 0.1)'
                : 'rgba(46, 213, 115, 0.1)',
            border: `1px solid ${stats.highRiskCount > 0 ? 'rgba(255, 71, 87, 0.3)' : 'rgba(46, 213, 115, 0.3)'}`,
          }}
        >
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <AlertTriangle
                size={16}
                color={stats.highRiskCount > 0 ? '#ff4757' : '#2ed573'}
              />
              <Text size="sm" fw={500}>
                高风险针位
              </Text>
            </Group>
            <Badge
              color={stats.highRiskCount > 0 ? 'red' : 'green'}
              size="lg"
            >
              {stats.highRiskCount} 个
            </Badge>
          </Group>
        </Paper>

        <Divider c="dark.4" />

        <Stack gap="xs">
          <Text size="sm" fw={500}>
            张力分布 (前24针)
          </Text>
          <Paper
            p="sm"
            radius="sm"
            style={{ background: 'rgba(10, 22, 40, 0.6)' }}
          >
            <div style={{ height: 140, width: '100%', minWidth: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tensionData} barSize={12}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a3f5f" />
                  <XAxis
                    dataKey="id"
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
                    formatter={(value: number) => [`${value} N`, '张力']}
                  />
                  <Bar dataKey="tension" radius={[2, 2, 0, 0]}>
                    {tensionData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getBarColor(entry)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Paper>
        </Stack>

        <Divider c="dark.4" />

        <Stack gap="xs">
          <Group justify="space-between">
            <Text size="sm" fw={500}>
              高风险针位列表
            </Text>
            <Text size="xs" c="dimmed">
              阈值: {HIGH_RISK_THRESHOLD} N
            </Text>
          </Group>

          <ScrollArea h={120} type="auto">
            <Stack gap="xs">
              {highRiskNeedles.length === 0 ? (
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
                highRiskNeedles.map((needle) => (
                  <Paper
                    key={needle.id}
                    p="xs"
                    radius="sm"
                    style={{
                      background: 'rgba(255, 71, 87, 0.1)',
                      border: '1px solid rgba(255, 71, 87, 0.2)',
                    }}
                  >
                    <Group justify="space-between">
                      <Group gap="xs">
                        <Badge color="red" size="sm">
                          #{needle.id + 1}
                        </Badge>
                      </Group>
                      <Tooltip label="张力值">
                        <Text size="sm" fw={600} c="red.4">
                          {needle.tension.toFixed(1)} N
                        </Text>
                      </Tooltip>
                    </Group>
                  </Paper>
                ))
              )}
            </Stack>
          </ScrollArea>
        </Stack>

        <Paper
          p="xs"
          radius="sm"
          style={{ background: 'rgba(10, 22, 40, 0.6)' }}
        >
          <Text size="xs" c="dimmed" lh={1.5}>
            📊 花型节奏: 每 {stats.patternPeriod} 针重复一次，
            共 {stats.patternRepeats} 个完整周期。
            启用率:{' '}
            {((stats.enabledCount / stats.totalNeedles) * 100).toFixed(1)}%
          </Text>
        </Paper>
      </Stack>
    </Paper>
  );
}
