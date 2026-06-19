import { Container, Grid, Title, Text, Group, Paper, Tabs } from '@mantine/core';
import { Cpu, Info, BarChart3, ArrowRightLeft, Bell, Flame } from 'lucide-react';
import NeedleCylinder from '@/components/NeedleCylinder';
import ControlPanel from '@/components/ControlPanel';
import StatsPanel from '@/components/StatsPanel';
import SchemeManager from '@/components/SchemeManager';
import ComparisonPanel from '@/components/ComparisonPanel';
import WarningPanel from '@/components/WarningPanel';
import SimulationPanel from '@/components/SimulationPanel';
import { useCylinderStore } from '@/store/cylinderStore';
import { HIGH_RISK_THRESHOLD } from '@/types/cylinder';

export default function Home() {
  const {
    heatMode,
    currentSchemeId,
    schemes,
    warnings,
  } = useCylinderStore();

  const currentScheme = schemes.find((s) => s.id === currentSchemeId);

  const errorCount = warnings.filter((w) => w.level === 'error').length;
  const warningCount = warnings.filter((w) => w.level === 'warning').length;

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
            radial-gradient(circle at 80% 20%, rgba(255, 215, 0, 0.06) 0%, transparent 50%)
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
                  手摇织袜机针筒模拟器
                </Title>
                <Group gap="sm" mt={4}>
                  <Text size="sm" c="dimmed">
                    Needle Cylinder Simulator
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
                </Group>
              </div>
            </Group>
          </Paper>
        </Group>

        <Grid gutter="md" align="flex-start">
          <Grid.Col span={{ base: 12, md: 3 }} order={{ base: 2, md: 1 }}>
            <Stack gap="md">
              <ControlPanel />
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
                    针筒视图
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

                <NeedleCylinder />

                <Group mt="xs">
                  <Info size={14} color="#6c7a8c" />
                  <Text size="xs" c="dimmed">
                    点击针位切换启用/停用状态 | 黄色圆圈标记花型周期起点 | 风险阈值: {HIGH_RISK_THRESHOLD} N
                  </Text>
                </Group>
              </Paper>

              <Tabs defaultValue="stats" variant="pills" color="cyan">
                <Tabs.List grow>
                  <Tabs.Tab
                    value="stats"
                    leftSection={<BarChart3 size={14} />}
                  >
                    数据统计
                  </Tabs.Tab>
                  <Tabs.Tab
                    value="comparison"
                    leftSection={<ArrowRightLeft size={14} />}
                    rightSection={
                      errorCount + warningCount > 0 ? (
                        <span
                          style={{
                            display: 'inline-block',
                            background: '#ffd700',
                            color: '#000',
                            borderRadius: 10,
                            padding: '0 6px',
                            fontSize: 10,
                            fontWeight: 600,
                          }}
                        >
                          对比
                        </span>
                      ) : null
                    }
                  >
                    方案对比
                  </Tabs.Tab>
                  <Tabs.Tab
                    value="warnings"
                    leftSection={<Bell size={14} />}
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
                    leftSection={<Flame size={14} />}
                  >
                    运行模拟
                  </Tabs.Tab>
                </Tabs.List>

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
              </Tabs>
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 3 }} order={{ base: 3, md: 3 }}>
            <Stack gap="md">
              <WarningPanel />
              <SimulationPanel />
            </Stack>
          </Grid.Col>
        </Grid>

        <Group justify="center" mt="md">
          <Text size="xs" c="dimmed">
            © 2024 纺织工程可视化教学工具 | 工业科技风格界面 | 织袜工艺预警与方案对比系统 v2.0
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
