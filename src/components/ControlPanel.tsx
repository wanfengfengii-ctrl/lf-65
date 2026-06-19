import {
  Paper,
  Title,
  Slider,
  NumberInput,
  Button,
  Group,
  Stack,
  Text,
  Badge,
  Switch,
  Divider,
  Tooltip,
} from '@mantine/core';
import {
  Play,
  Pause,
  RotateCcw,
  Zap,
  CircleDot,
  Repeat,
  Gauge,
} from 'lucide-react';
import { useCylinderStore } from '@/store/cylinderStore';
import {
  MIN_TENSION,
  MAX_TENSION,
  MIN_SPEED,
  MAX_SPEED,
  HIGH_RISK_THRESHOLD,
} from '@/types/cylinder';

export default function ControlPanel() {
  const {
    totalNeedles,
    patternPeriod,
    baseTension,
    rotationSpeed,
    isRunning,
    setTotalNeedles,
    setPatternPeriod,
    setBaseTension,
    setRotationSpeed,
    toggleRunning,
    resetAll,
  } = useCylinderStore();

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
            控制面板
          </Title>
          <Badge
            color={isRunning ? 'green' : 'gray'}
            variant="dot"
            size="lg"
          >
            {isRunning ? '运行中' : '已停止'}
          </Badge>
        </Group>

        <Divider c="dark.4" />

        <Stack gap="sm">
          <Group gap="xs">
            <CircleDot size={18} color="#00d4ff" />
            <Text size="sm" fw={500}>
              总针数
            </Text>
          </Group>
          <NumberInput
            value={totalNeedles}
            onChange={(val) => setTotalNeedles(Number(val) || 1)}
            min={1}
            max={200}
            size="sm"
            styles={{
              input: {
                background: 'rgba(10, 22, 40, 0.8)',
                borderColor: 'rgba(0, 212, 255, 0.3)',
                color: '#fff',
              },
            }}
          />
          <Slider
            value={totalNeedles}
            onChange={(val) => setTotalNeedles(val)}
            min={1}
            max={200}
            step={1}
            size="sm"
            color="cyan"
            label={null}
          />
        </Stack>

        <Stack gap="sm">
          <Group gap="xs" justify="space-between">
            <Group gap="xs">
              <Repeat size={18} color="#ffd700" />
              <Text size="sm" fw={500}>
                花型周期
              </Text>
            </Group>
            <Text size="xs" c="dimmed">
              {patternPeriod} 针 / 周期
            </Text>
          </Group>
          <Slider
            value={patternPeriod}
            onChange={setPatternPeriod}
            min={1}
            max={totalNeedles}
            step={1}
            size="sm"
            color="yellow"
            label={null}
          />
          {patternPeriod > totalNeedles && (
            <Text size="xs" c="red">
              花型周期不能超过总针数
            </Text>
          )}
        </Stack>

        <Stack gap="sm">
          <Group gap="xs" justify="space-between">
            <Group gap="xs">
              <Zap size={18} color="#ff6b6b" />
              <Text size="sm" fw={500}>
                基础张力
              </Text>
            </Group>
            <Text
              size="xs"
              c={baseTension > HIGH_RISK_THRESHOLD ? 'red' : 'dimmed'}
            >
              {baseTension.toFixed(0)} N
            </Text>
          </Group>
          <Slider
            value={baseTension}
            onChange={setBaseTension}
            min={MIN_TENSION}
            max={MAX_TENSION}
            step={1}
            size="sm"
            color="red"
            label={null}
            marks={[
              { value: HIGH_RISK_THRESHOLD, label: '风险' },
            ]}
          />
          <Tooltip label="张力超过 80 时，启用的针位会标红显示高风险">
            <Text size="xs" c="dimmed">
              风险阈值: {HIGH_RISK_THRESHOLD} N
            </Text>
          </Tooltip>
        </Stack>

        <Stack gap="sm">
          <Group gap="xs" justify="space-between">
            <Group gap="xs">
              <Gauge size={18} color="#2ed573" />
              <Text size="sm" fw={500}>
                转速
              </Text>
            </Group>
            <Text size="xs" c="dimmed">
              {rotationSpeed.toFixed(1)} 转/秒
            </Text>
          </Group>
          <Slider
            value={rotationSpeed}
            onChange={setRotationSpeed}
            min={MIN_SPEED}
            max={MAX_SPEED}
            step={0.1}
            size="sm"
            color="green"
            label={null}
          />
        </Stack>

        <Divider c="dark.4" />

        <Group grow>
          <Button
            leftSection={isRunning ? <Pause size={16} /> : <Play size={16} />}
            color={isRunning ? 'red' : 'green'}
            onClick={toggleRunning}
            variant="filled"
          >
            {isRunning ? '暂停' : '启动'}
          </Button>
          <Button
            leftSection={<RotateCcw size={16} />}
            color="gray"
            onClick={resetAll}
            variant="light"
          >
            重置
          </Button>
        </Group>

        <Stack gap="xs">
          <Text size="xs" fw={500} c="dimmed">
            快速预设
          </Text>
          <Group grow>
            <Button
              size="xs"
              variant="light"
              color="cyan"
              onClick={() => {
                setTotalNeedles(24);
                setPatternPeriod(6);
              }}
            >
              细针
            </Button>
            <Button
              size="xs"
              variant="light"
              color="cyan"
              onClick={() => {
                setTotalNeedles(48);
                setPatternPeriod(8);
              }}
            >
              标准
            </Button>
            <Button
              size="xs"
              variant="light"
              color="cyan"
              onClick={() => {
                setTotalNeedles(96);
                setPatternPeriod(12);
              }}
            >
              粗针
            </Button>
          </Group>
        </Stack>

        <Paper
          p="xs"
          radius="sm"
          style={{ background: 'rgba(10, 22, 40, 0.6)' }}
        >
          <Text size="xs" c="dimmed" lh={1.5}>
            💡 点击针筒上的针位可以切换启用/停用状态。
            黄色圆圈标记花型周期起点，红色针位表示高风险。
          </Text>
        </Paper>
      </Stack>
    </Paper>
  );
}
