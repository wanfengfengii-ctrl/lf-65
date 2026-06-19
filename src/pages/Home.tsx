import { Container, Grid, Title, Text, Group, Paper } from '@mantine/core';
import { Cpu, Info } from 'lucide-react';
import NeedleCylinder from '@/components/NeedleCylinder';
import ControlPanel from '@/components/ControlPanel';
import StatsPanel from '@/components/StatsPanel';

export default function Home() {
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
                <Text size="sm" c="dimmed">
                  Needle Cylinder Simulator
                </Text>
              </div>
            </Group>
          </Paper>
        </Group>

        <Grid gutter="md" align="flex-start">
          <Grid.Col span={{ base: 12, md: 3 }} order={{ base: 2, md: 1 }}>
            <ControlPanel />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }} order={{ base: 1, md: 2 }}>
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
                </Group>
              </Group>

              <NeedleCylinder />

              <Group mt="xs">
                <Info size={14} color="#6c7a8c" />
                <Text size="xs" c="dimmed">
                  点击针位切换启用/停用状态
                </Text>
              </Group>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 3 }} order={{ base: 3, md: 3 }}>
            <StatsPanel />
          </Grid.Col>
        </Grid>

        <Group justify="center" mt="md">
          <Text size="xs" c="dimmed">
            © 2024 纺织工程可视化教学工具 | 工业科技风格界面
          </Text>
        </Group>
      </Container>
    </div>
  );
}
