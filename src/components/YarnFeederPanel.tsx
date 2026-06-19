import {
  Paper,
  Title,
  Stack,
  Group,
  Text,
  Badge,
  Divider,
  Slider,
  NumberInput,
  Button,
  ActionIcon,
  Switch,
  Tooltip,
  ScrollArea,
  Collapse,
  ColorInput,
  Select,
  SimpleGrid,
} from '@mantine/core';
import {
  Layers,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  MapPin,
  Ruler,
  Compass,
  Gauge,
  CircleDot,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Crosshair,
  Users,
  Link2,
} from 'lucide-react';
import { useState } from 'react';
import { useCylinderStore } from '@/store/cylinderStore';
import {
  MIN_YARN_LENGTH,
  MAX_YARN_LENGTH,
  MIN_FRICTION,
  MAX_FRICTION,
  MIN_GUIDE_ANGLE,
  MAX_GUIDE_ANGLE,
  MAX_YARN_FEEDERS,
  WARNING_STRETCH_THRESHOLD,
} from '@/types/cylinder';

export default function YarnFeederPanel() {
  const {
    yarnFeeders,
    totalNeedles,
    addYarnFeeder,
    removeYarnFeeder,
    updateYarnFeeder,
    toggleYarnFeeder,
    showYarnPath,
    toggleShowYarnPath,
    showRiskHighlight,
    toggleShowRiskHighlight,
    yarnSimulationEnabled,
    toggleYarnSimulation,
    resetYarnSimulation,
    yarnMaterials,
    showInterferenceHighlight,
    toggleShowInterferenceHighlight,
    showCrowdingHighlight,
    toggleShowCrowdingHighlight,
    showTensionCoupling,
    toggleShowTensionCoupling,
    runMultiYarnSimulation,
  } = useCylinderStore();

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <Paper
      p="md"
      radius="md"
      style={{
        background: 'rgba(26, 41, 66, 0.9)',
        border: `1px solid ${
          yarnSimulationEnabled
            ? 'rgba(255, 107, 53, 0.4)'
            : 'rgba(0, 212, 255, 0.2)'
        }`,
        backdropFilter: 'blur(10px)',
      }}
    >
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Layers
              size={18}
              color={yarnSimulationEnabled ? '#ff6b35' : '#6c7a8c'}
            />
            <Title order={5} c={yarnSimulationEnabled ? 'orange.4' : 'dimmed'}>
              送纱系统
            </Title>
          </Group>
          <Switch
            checked={yarnSimulationEnabled}
            onChange={toggleYarnSimulation}
            color="orange"
            size="sm"
          />
        </Group>

        <Divider c="dark.4" />

        <Group grow>
          <Paper
            p="xs"
            radius="sm"
            style={{
              background: showYarnPath
                ? 'rgba(0, 212, 255, 0.1)'
                : 'rgba(10, 22, 40, 0.6)',
              border: `1px solid ${
                showYarnPath ? 'rgba(0, 212, 255, 0.3)' : 'rgba(255,255,255,0.1)'
              }`,
              cursor: 'pointer',
            }}
            onClick={toggleShowYarnPath}
          >
            <Group gap="xs" justify="center">
              {showYarnPath ? <Eye size={14} color="#00d4ff" /> : <EyeOff size={14} color="#6c7a8c" />}
              <Text size="xs" fw={500} c={showYarnPath ? 'cyan.4' : 'dimmed'}>
                {showYarnPath ? '路径可见' : '路径隐藏'}
              </Text>
            </Group>
          </Paper>
          <Paper
            p="xs"
            radius="sm"
            style={{
              background: showRiskHighlight
                ? 'rgba(255, 71, 87, 0.1)'
                : 'rgba(10, 22, 40, 0.6)',
              border: `1px solid ${
                showRiskHighlight ? 'rgba(255, 71, 87, 0.3)' : 'rgba(255,255,255,0.1)'
              }`,
              cursor: 'pointer',
            }}
            onClick={toggleShowRiskHighlight}
          >
            <Group gap="xs" justify="center">
              <AlertTriangle
                size={14}
                color={showRiskHighlight ? '#ff4757' : '#6c7a8c'}
              />
              <Text size="xs" fw={500} c={showRiskHighlight ? 'red.4' : 'dimmed'}>
                {showRiskHighlight ? '风险高亮' : '高亮关闭'}
              </Text>
            </Group>
          </Paper>
        </Group>

        <SimpleGrid cols={3} spacing="xs">
          <Paper
            p="xs"
            radius="sm"
            style={{
              background: showInterferenceHighlight
                ? 'rgba(255, 107, 107, 0.1)'
                : 'rgba(10, 22, 40, 0.6)',
              border: `1px solid ${
                showInterferenceHighlight ? 'rgba(255, 107, 107, 0.3)' : 'rgba(255,255,255,0.1)'
              }`,
              cursor: 'pointer',
            }}
            onClick={toggleShowInterferenceHighlight}
          >
            <Stack gap={4} align="center">
              <Crosshair
                size={14}
                color={showInterferenceHighlight ? '#ff6b6b' : '#6c7a8c'}
              />
              <Text size="xs" fw={500} c={showInterferenceHighlight ? 'red.4' : 'dimmed'} ta="center">
                干涉
              </Text>
            </Stack>
          </Paper>
          <Paper
            p="xs"
            radius="sm"
            style={{
              background: showCrowdingHighlight
                ? 'rgba(78, 205, 196, 0.1)'
                : 'rgba(10, 22, 40, 0.6)',
              border: `1px solid ${
                showCrowdingHighlight ? 'rgba(78, 205, 196, 0.3)' : 'rgba(255,255,255,0.1)'
              }`,
              cursor: 'pointer',
            }}
            onClick={toggleShowCrowdingHighlight}
          >
            <Stack gap={4} align="center">
              <Users
                size={14}
                color={showCrowdingHighlight ? '#4ecdc4' : '#6c7a8c'}
              />
              <Text size="xs" fw={500} c={showCrowdingHighlight ? 'teal.4' : 'dimmed'} ta="center">
                拥挤
              </Text>
            </Stack>
          </Paper>
          <Paper
            p="xs"
            radius="sm"
            style={{
              background: showTensionCoupling
                ? 'rgba(255, 230, 109, 0.1)'
                : 'rgba(10, 22, 40, 0.6)',
              border: `1px solid ${
                showTensionCoupling ? 'rgba(255, 230, 109, 0.3)' : 'rgba(255,255,255,0.1)'
              }`,
              cursor: 'pointer',
            }}
            onClick={toggleShowTensionCoupling}
          >
            <Stack gap={4} align="center">
              <Link2
                size={14}
                color={showTensionCoupling ? '#ffe66d' : '#6c7a8c'}
              />
              <Text size="xs" fw={500} c={showTensionCoupling ? 'yellow.4' : 'dimmed'} ta="center">
                耦合
              </Text>
            </Stack>
          </Paper>
        </SimpleGrid>

        <Divider c="dark.4" />

        <Group justify="space-between" align="center">
          <Group gap="xs">
            <CircleDot size={16} color="#00d4ff" />
            <Text size="sm" fw={500}>
              送纱嘴配置
            </Text>
            <Badge size="xs" color="cyan" variant="outline">
              {yarnFeeders.filter(f => f.enabled).length}/{yarnFeeders.length}
            </Badge>
          </Group>
          <Tooltip label={`最多添加 ${MAX_YARN_FEEDERS} 个送纱嘴`}>
            <ActionIcon
              size="sm"
              variant="light"
              color="green"
              onClick={addYarnFeeder}
              disabled={yarnFeeders.length >= MAX_YARN_FEEDERS}
            >
              <Plus size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>

        <ScrollArea h={280} type="auto">
          <Stack gap="sm">
            {yarnFeeders.map((feeder) => {
              const isExpanded = expandedIds.has(feeder.id);
              return (
                <Paper
                  key={feeder.id}
                  p="xs"
                  radius="sm"
                  style={{
                    background: feeder.enabled
                      ? 'rgba(10, 22, 40, 0.8)'
                      : 'rgba(30, 40, 60, 0.4)',
                    border: `1px solid ${
                      feeder.enabled ? feeder.color + '60' : 'rgba(255,255,255,0.08)'
                    }`,
                    opacity: feeder.enabled ? 1 : 0.6,
                  }}
                >
                  <Stack gap="xs">
                    <Group justify="space-between" align="center">
                      <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            background: feeder.color,
                            flexShrink: 0,
                            boxShadow: `0 0 8px ${feeder.color}`,
                          }}
                        />
                        <Text
                          size="sm"
                          fw={600}
                          style={{
                            color: feeder.enabled ? feeder.color : '#6c7a8c',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {feeder.name}
                        </Text>
                      </Group>
                      <Group gap={4} wrap="nowrap">
                        <Switch
                          checked={feeder.enabled}
                          onChange={() => toggleYarnFeeder(feeder.id)}
                          size="xs"
                          color="cyan"
                        />
                        <ActionIcon
                          size="xs"
                          variant="subtle"
                          onClick={() => toggleExpand(feeder.id)}
                        >
                          {isExpanded ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )}
                        </ActionIcon>
                        <ActionIcon
                          size="xs"
                          variant="subtle"
                          c="red"
                          onClick={() => removeYarnFeeder(feeder.id)}
                          disabled={yarnFeeders.length <= 1}
                        >
                          <Trash2 size={14} />
                        </ActionIcon>
                      </Group>
                    </Group>

                    <Group gap="xs" wrap="nowrap">
                      <Badge size="xs" variant="outline" color="cyan">
                        位置 #{Math.floor(feeder.position) + 1}
                      </Badge>
                      <Badge size="xs" variant="outline" color="yellow">
                        {feeder.yarnLength.toFixed(0)}mm
                      </Badge>
                      <Badge size="xs" variant="outline" color="green">
                        {feeder.guideAngle.toFixed(0)}°
                      </Badge>
                      <Badge size="xs" variant="outline" color="red">
                        μ{feeder.frictionCoefficient.toFixed(2)}
                      </Badge>
                    </Group>

                    <Collapse in={isExpanded}>
                      <Stack gap="sm" mt="xs">
                        <Divider c="dark.3" />

                        <Stack gap="xs">
                          <Group justify="space-between">
                            <Group gap="xs">
                              <MapPin size={12} color="#00d4ff" />
                              <Text size="xs" fw={500}>
                                送纱嘴位置
                              </Text>
                            </Group>
                            <Text size="xs" c="dimmed">
                              针位 #{Math.floor(feeder.position) + 1} / {totalNeedles}
                            </Text>
                          </Group>
                          <Slider
                            value={feeder.position}
                            onChange={(v) => updateYarnFeeder(feeder.id, { position: v })}
                            min={0}
                            max={totalNeedles - 0.01}
                            step={0.1}
                            size="xs"
                            color="cyan"
                            label={null}
                          />
                        </Stack>

                        <Stack gap="xs">
                          <Group justify="space-between">
                            <Group gap="xs">
                              <Ruler size={12} color="#ffd700" />
                              <Text size="xs" fw={500}>
                                纱线长度
                              </Text>
                            </Group>
                            <Text size="xs" c="dimmed">
                              {feeder.yarnLength.toFixed(0)} mm
                            </Text>
                          </Group>
                          <Slider
                            value={feeder.yarnLength}
                            onChange={(v) => updateYarnFeeder(feeder.id, { yarnLength: v })}
                            min={MIN_YARN_LENGTH}
                            max={MAX_YARN_LENGTH}
                            step={1}
                            size="xs"
                            color="yellow"
                            label={null}
                          />
                          <NumberInput
                            value={feeder.yarnLength}
                            onChange={(v) => updateYarnFeeder(feeder.id, { yarnLength: Number(v) || MIN_YARN_LENGTH })}
                            min={MIN_YARN_LENGTH}
                            max={MAX_YARN_LENGTH}
                            size="xs"
                            hideControls
                            styles={{
                              input: {
                                background: 'rgba(10, 22, 40, 0.8)',
                                borderColor: 'rgba(255, 215, 0, 0.3)',
                                color: '#fff',
                                fontSize: 11,
                                height: 24,
                              },
                            }}
                          />
                        </Stack>

                        <Stack gap="xs">
                          <Group justify="space-between">
                            <Group gap="xs">
                              <Compass size={12} color="#2ed573" />
                              <Text size="xs" fw={500}>
                                导纱角度
                              </Text>
                            </Group>
                            <Text
                              size="xs"
                              c={
                                feeder.guideAngle < 15 || feeder.guideAngle > 75
                                  ? 'red'
                                  : 'dimmed'
                              }
                            >
                              {feeder.guideAngle.toFixed(0)}°
                              {(feeder.guideAngle < 15 || feeder.guideAngle > 75) && (
                                <span> ⚠️</span>
                              )}
                            </Text>
                          </Group>
                          <Slider
                            value={feeder.guideAngle}
                            onChange={(v) => updateYarnFeeder(feeder.id, { guideAngle: v })}
                            min={MIN_GUIDE_ANGLE}
                            max={MAX_GUIDE_ANGLE}
                            step={1}
                            size="xs"
                            color="green"
                            label={null}
                            marks={[
                              { value: 15, label: '15°' },
                              { value: 45, label: '45°' },
                              { value: 75, label: '75°' },
                            ]}
                          />
                        </Stack>

                        <Stack gap="xs">
                          <Group justify="space-between">
                            <Group gap="xs">
                              <Gauge size={12} color="#ff6b6b" />
                              <Text size="xs" fw={500}>
                                摩擦系数
                              </Text>
                            </Group>
                            <Text
                              size="xs"
                              c={feeder.frictionCoefficient > 0.4 ? 'red' : 'dimmed'}
                            >
                              μ = {feeder.frictionCoefficient.toFixed(2)}
                              {feeder.frictionCoefficient > 0.4 && <span> ⚠️</span>}
                            </Text>
                          </Group>
                          <Slider
                            value={feeder.frictionCoefficient}
                            onChange={(v) => updateYarnFeeder(feeder.id, { frictionCoefficient: v })}
                            min={MIN_FRICTION}
                            max={MAX_FRICTION}
                            step={0.01}
                            size="xs"
                            color="red"
                            label={null}
                          />
                        </Stack>

                        <Stack gap="xs">
                          <Group gap="xs">
                            <Sparkles size={12} color={feeder.color} />
                            <Text size="xs" fw={500}>
                              颜色标识
                            </Text>
                          </Group>
                          <ColorInput
                            value={feeder.color}
                            onChange={(v) => updateYarnFeeder(feeder.id, { color: v })}
                            size="xs"
                            swatches={[
                              '#ff6b6b',
                              '#4ecdc4',
                              '#ffe66d',
                              '#a8e6cf',
                              '#c7ceea',
                              '#ffaaa5',
                              '#ffd3b6',
                              '#bae1ff',
                              '#00d4ff',
                              '#ffd700',
                              '#ff6b35',
                              '#a29bfe',
                            ]}
                            format="hex"
                            styles={{
                              input: {
                                background: 'rgba(10, 22, 40, 0.8)',
                                borderColor: `${feeder.color}40`,
                                color: '#fff',
                                fontSize: 11,
                                height: 28,
                              },
                            }}
                          />
                        </Stack>

                        <Stack gap="xs">
                          <Group gap="xs">
                            <Layers size={12} color="#a29bfe" />
                            <Text size="xs" fw={500}>
                              关联材质
                            </Text>
                          </Group>
                          <Select
                            value={feeder.materialId || null}
                            onChange={(val) => {
                              updateYarnFeeder(feeder.id, { materialId: val || undefined });
                              setTimeout(() => runMultiYarnSimulation(), 50);
                            }}
                            placeholder="选择纱线材质..."
                            data={yarnMaterials.map((m) => ({
                              value: m.id,
                              label: m.name,
                            }))}
                            size="xs"
                            allowDeselect
                            clearable
                            searchable
                            styles={{
                              input: {
                                background: 'rgba(10, 22, 40, 0.8)',
                                borderColor: 'rgba(162, 155, 254, 0.3)',
                                color: '#fff',
                                fontSize: 11,
                                height: 28,
                              },
                              dropdown: {
                                background: '#1a2942',
                                border: '1px solid rgba(162, 155, 254, 0.3)',
                              },
                              option: {
                                color: '#fff',
                                fontSize: 11,
                              },
                            }}
                          />
                          {feeder.materialId && (() => {
                            const mat = yarnMaterials.find((m) => m.id === feeder.materialId);
                            if (!mat) return null;
                            return (
                              <Group gap="xs" wrap="nowrap" mt={2}>
                                <div
                                  style={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: 3,
                                    background: mat.colorMapping,
                                    flexShrink: 0,
                                    border: '1px solid rgba(255,255,255,0.2)',
                                  }}
                                />
                                <Badge size="xs" variant="outline" color="pink">
                                  弹{mat.elasticity}
                                </Badge>
                                <Badge size="xs" variant="outline" color="green">
                                  磨{mat.wearResistance}
                                </Badge>
                                <Badge size="xs" variant="outline" color="cyan">
                                  强{mat.tensileStrength}
                                </Badge>
                              </Group>
                            );
                          })()}
                        </Stack>
                      </Stack>
                    </Collapse>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        </ScrollArea>

        <Group grow>
          <Button
            size="xs"
            variant="light"
            color="gray"
            leftSection={<Trash2 size={12} />}
            onClick={resetYarnSimulation}
          >
            重置统计
          </Button>
        </Group>

        <Paper
          p="xs"
          radius="sm"
          style={{ background: 'rgba(10, 22, 40, 0.6)' }}
        >
          <Text size="xs" c="dimmed" lh={1.5}>
            🧵 纱线路径将在针筒视图上实时显示。
            拉伸超过 {WARNING_STRETCH_THRESHOLD}% 的针位会标红预警。
            建议导纱角度在 15°~75° 之间。
          </Text>
        </Paper>
      </Stack>
    </Paper>
  );
}
