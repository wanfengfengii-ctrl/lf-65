import {
  Paper,
  Title,
  Stack,
  Group,
  Text,
  Badge,
  Divider,
  Slider,
  Button,
  ActionIcon,
  Tooltip,
  ScrollArea,
  Collapse,
  ColorInput,
  TextInput,
} from '@mantine/core';
import {
  Sparkles,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  StretchHorizontal,
  Ruler,
  Shield,
  Target,
  ArrowDownToLine,
  Layers3,
  Droplets,
  Palette,
} from 'lucide-react';
import { useState } from 'react';
import { useCylinderStore } from '@/store/cylinderStore';
import {
  MIN_ELASTICITY,
  MAX_ELASTICITY,
  MIN_THICKNESS,
  MAX_THICKNESS,
  MIN_WEAR_RESISTANCE,
  MAX_WEAR_RESISTANCE,
  MIN_TENSILE_STRENGTH,
  MAX_TENSILE_STRENGTH,
  MIN_BREAKING_ELONGATION,
  MAX_BREAKING_ELONGATION,
} from '@/types/cylinder';

export default function YarnMaterialPanel({ compact = false }: { compact?: boolean }) {
  const {
    yarnMaterials,
    addYarnMaterial,
    updateYarnMaterial,
    removeYarnMaterial,
    yarnFeeders,
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

  const getUsedCount = (materialId: string) => {
    return yarnFeeders.filter((f) => f.materialId === materialId).length;
  };

  const addNewMaterial = () => {
    addYarnMaterial({
      name: `自定义材质 ${yarnMaterials.length + 1}`,
      elasticity: 50,
      thickness: 30,
      wearResistance: 60,
      colorMapping: '#c0c0c0',
      tensileStrength: 70,
      breakingElongation: 15,
      density: 1.3,
    });
  };

  const SliderWithIcon = ({
    icon,
    label,
    iconColor,
    value,
    min,
    max,
    onChange,
    unit,
    step,
    color,
  }: {
    icon: React.ReactNode;
    label: string;
    iconColor: string;
    value: number;
    min: number;
    max: number;
    onChange: (v: number) => void;
    unit?: string;
    step?: number;
    color: string;
  }) => (
    <Stack gap="xs">
      <Group justify="space-between">
        <Group gap="xs">
          <div style={{ color: iconColor }}>{icon}</div>
          <Text size="xs" fw={500}>
            {label}
          </Text>
        </Group>
        <Group gap={4}>
          <Text
            size="xs"
            fw={600}
            c={color}
          >
            {value.toFixed(typeof step === 'number' && step < 1 ? 2 : 0)}
          </Text>
          {unit && (
            <Text size="xs" c="dimmed">
              {unit}
            </Text>
          )}
        </Group>
      </Group>
      <Slider
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step || 1}
        size="xs"
        color={color}
        label={null}
      />
    </Stack>
  );

  return (
    <Paper
      p="md"
      radius="md"
      style={{
        background: 'rgba(26, 41, 66, 0.9)',
        border: '1px solid rgba(162, 155, 254, 0.4)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Sparkles size={18} color="#a29bfe" />
            <Title order={5} c="violet.4">
              纱线材质库
            </Title>
            <Badge size="xs" color="violet" variant="outline">
              {yarnMaterials.length} 种
            </Badge>
          </Group>
          <Tooltip label="添加新材质">
            <ActionIcon
              size="sm"
              variant="light"
              color="violet"
              onClick={addNewMaterial}
            >
              <Plus size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>

        <Divider c="dark.4" />

        <ScrollArea h={340} type="auto">
          <Stack gap="sm">
            {yarnMaterials.map((material) => {
              const isExpanded = expandedIds.has(material.id);
              const usedCount = getUsedCount(material.id);
              return (
                <Paper
                  key={material.id}
                  p="xs"
                  radius="sm"
                  style={{
                    background: 'rgba(10, 22, 40, 0.8)',
                    border: `1px solid ${material.colorMapping}40`,
                  }}
                >
                  <Stack gap="xs">
                    <Group justify="space-between" align="center">
                      <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: 4,
                            background: material.colorMapping,
                            flexShrink: 0,
                            boxShadow: `0 0 8px ${material.colorMapping}60`,
                            border: '1px solid rgba(255,255,255,0.2)',
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text
                            size="sm"
                            fw={600}
                            style={{
                              color: material.colorMapping,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {material.name}
                          </Text>
                        </div>
                        {usedCount > 0 && (
                          <Badge size="xs" variant="dot" color="violet">
                            {usedCount}路使用
                          </Badge>
                        )}
                      </Group>
                      <Group gap={4} wrap="nowrap">
                        <ActionIcon
                          size="xs"
                          variant="subtle"
                          onClick={() => toggleExpand(material.id)}
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
                          onClick={() => removeYarnMaterial(material.id)}
                          disabled={yarnMaterials.length <= 1}
                        >
                          <Trash2 size={14} />
                        </ActionIcon>
                      </Group>
                    </Group>

                    <Group gap="xs" wrap="nowrap">
                      <Badge size="xs" variant="outline" color="pink">
                        弹 {material.elasticity}
                      </Badge>
                      <Badge size="xs" variant="outline" color="yellow">
                        粗 {material.thickness}
                      </Badge>
                      <Badge size="xs" variant="outline" color="green">
                        磨 {material.wearResistance}
                      </Badge>
                      <Badge size="xs" variant="outline" color="blue">
                        强 {material.tensileStrength}
                      </Badge>
                    </Group>

                    <Collapse in={isExpanded}>
                      <Stack gap="sm" mt="xs">
                        <Divider c="dark.3" />

                        <Stack gap="xs">
                          <Group justify="space-between">
                            <Group gap="xs">
                              <Palette size={12} color={material.colorMapping} />
                              <Text size="xs" fw={500}>
                                材质名称
                              </Text>
                            </Group>
                          </Group>
                          <TextInput
                            value={material.name}
                            onChange={(e) =>
                              updateYarnMaterial(material.id, { name: e.currentTarget.value })
                            }
                            size="xs"
                            styles={{
                              input: {
                                background: 'rgba(10, 22, 40, 0.8)',
                                borderColor: `${material.colorMapping}40`,
                                color: '#fff',
                                fontSize: 11,
                                height: 28,
                              },
                            }}
                          />
                        </Stack>

                        <SliderWithIcon
                          icon={<StretchHorizontal size={12} />}
                          label="弹性系数"
                          iconColor="#ff6b8b"
                          value={material.elasticity}
                          min={MIN_ELASTICITY}
                          max={MAX_ELASTICITY}
                          onChange={(v) =>
                            updateYarnMaterial(material.id, { elasticity: v })
                          }
                          color="pink"
                          unit="%"
                        />

                        <SliderWithIcon
                          icon={<Ruler size={12} />}
                          label="纱线粗细"
                          iconColor="#ffd700"
                          value={material.thickness}
                          min={MIN_THICKNESS}
                          max={MAX_THICKNESS}
                          onChange={(v) =>
                            updateYarnMaterial(material.id, { thickness: v })
                          }
                          color="yellow"
                          unit="dtex"
                        />

                        <SliderWithIcon
                          icon={<Shield size={12} />}
                          label="耐磨系数"
                          iconColor="#2ed573"
                          value={material.wearResistance}
                          min={MIN_WEAR_RESISTANCE}
                          max={MAX_WEAR_RESISTANCE}
                          onChange={(v) =>
                            updateYarnMaterial(material.id, { wearResistance: v })
                          }
                          color="green"
                        />

                        <SliderWithIcon
                          icon={<Target size={12} />}
                          label="抗拉强度"
                          iconColor="#00d4ff"
                          value={material.tensileStrength}
                          min={MIN_TENSILE_STRENGTH}
                          max={MAX_TENSILE_STRENGTH}
                          onChange={(v) =>
                            updateYarnMaterial(material.id, { tensileStrength: v })
                          }
                          color="cyan"
                        />

                        <SliderWithIcon
                          icon={<ArrowDownToLine size={12} />}
                          label="断裂伸长率"
                          iconColor="#ff6b35"
                          value={material.breakingElongation}
                          min={MIN_BREAKING_ELONGATION}
                          max={MAX_BREAKING_ELONGATION}
                          onChange={(v) =>
                            updateYarnMaterial(material.id, { breakingElongation: v })
                          }
                          color="orange"
                          unit="%"
                        />

                        <SliderWithIcon
                          icon={<Layers3 size={12} />}
                          label="纱线密度"
                          iconColor="#a29bfe"
                          value={material.density}
                          min={0.5}
                          max={2.5}
                          step={0.05}
                          onChange={(v) =>
                            updateYarnMaterial(material.id, { density: v })
                          }
                          color="violet"
                          unit="g/cm³"
                        />

                        <Stack gap="xs">
                          <Group gap="xs">
                            <Droplets size={12} color={material.colorMapping} />
                            <Text size="xs" fw={500}>
                              颜色映射
                            </Text>
                          </Group>
                          <ColorInput
                            value={material.colorMapping}
                            onChange={(v) =>
                              updateYarnMaterial(material.id, { colorMapping: v })
                            }
                            size="xs"
                            format="hex"
                            styles={{
                              input: {
                                background: 'rgba(10, 22, 40, 0.8)',
                                borderColor: `${material.colorMapping}40`,
                                color: '#fff',
                                fontSize: 11,
                                height: 28,
                              },
                            }}
                          />
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
            color="violet"
            leftSection={<Plus size={12} />}
            onClick={addNewMaterial}
          >
            新增材质
          </Button>
        </Group>

        <Paper
          p="xs"
          radius="sm"
          style={{ background: 'rgba(10, 22, 40, 0.6)' }}
        >
          <Text size="xs" c="dimmed" lh={1.5}>
            💡 材质参数会直接影响质量预测结果：

            高弹性→降低断线概率，高耐磨→延长磨损寿命，

            抗拉强度高→综合质量更优。

          </Text>
        </Paper>
      </Stack>
    </Paper>
  );
}
