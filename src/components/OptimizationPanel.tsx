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
  ScrollArea,
  Progress,
  Tooltip,
  Collapse,
  ActionIcon,
  NumberInput,
} from '@mantine/core';
import {
  Target,
  Search,
  Zap,
  Shield,
  Clock,
  TrendingUp,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Play,
  Award,
  Settings2,
  Gauge,
  RotateCcw,
} from 'lucide-react';
import { useState } from 'react';
import { useCylinderStore } from '@/store/cylinderStore';
import {
  MIN_TENSION,
  MAX_TENSION,
  MIN_SPEED,
  MAX_SPEED,
  MIN_GUIDE_ANGLE,
  MAX_GUIDE_ANGLE,
} from '@/types/cylinder';

export default function OptimizationPanel() {
  const {
    optimizationTargets,
    optimizationConstraints,
    optimizationResult,
    isOptimizing,
    selectedCandidateId,
    setOptimizationTargets,
    setOptimizationConstraints,
    startOptimizationSearch,
    selectOptimizationCandidate,
    applyOptimizationCandidate,
    totalNeedles,
  } = useCylinderStore();

  const [expandedTarget, setExpandedTarget] = useState(true);
  const [expandedConstraints, setExpandedConstraints] = useState(false);
  const [expandedCandidates, setExpandedCandidates] = useState(true);

  const selectedCandidate = optimizationResult?.candidates.find(
    (c) => c.id === selectedCandidateId
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#2ed573';
    if (score >= 65) return '#00d4ff';
    if (score >= 50) return '#ffa502';
    return '#ff4757';
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { color: 'yellow', label: '🥇 最优' };
    if (rank === 2) return { color: 'gray', label: '🥈 次优' };
    if (rank === 3) return { color: 'orange', label: '🥉 第三' };
    return { color: 'dark', label: `#${rank}` };
  };

  return (
    <Paper
      p="md"
      radius="md"
      style={{
        background: 'rgba(26, 41, 66, 0.9)',
        border: `1px solid ${
          isOptimizing
            ? 'rgba(255, 165, 2, 0.5)'
            : optimizationResult
            ? 'rgba(46, 213, 115, 0.3)'
            : 'rgba(162, 155, 254, 0.3)'
        }`,
        backdropFilter: 'blur(10px)',
      }}
    >
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Settings2
              size={18}
              color={isOptimizing ? '#ffa502' : '#a29bfe'}
            />
            <Title order={5} c={isOptimizing ? 'yellow.4' : 'violet.4'}>
              工艺参数智能寻优
            </Title>
          </Group>
          {isOptimizing && (
            <Badge size="xs" color="yellow" variant="filled">
              搜索中...
            </Badge>
          )}
          {optimizationResult && !isOptimizing && (
            <Badge size="xs" color="green" variant="outline">
              已完成 {optimizationResult.searchIterations} 次搜索
            </Badge>
          )}
        </Group>

        <Divider c="dark.4" />

        <Paper
          p="xs"
          radius="sm"
          style={{
            background: 'rgba(162, 155, 254, 0.08)',
            border: '1px solid rgba(162, 155, 254, 0.2)',
            cursor: 'pointer',
          }}
          onClick={() => setExpandedTarget(!expandedTarget)}
        >
          <Group justify="space-between">
            <Group gap="xs">
              <Target size={14} color="#a29bfe" />
              <Text size="sm" fw={500} c="violet.4">
                目标设定
              </Text>
            </Group>
            {expandedTarget ? (
              <ChevronUp size={14} color="#6c7a8c" />
            ) : (
              <ChevronDown size={14} color="#6c7a8c" />
            )}
          </Group>
        </Paper>

        <Collapse in={expandedTarget}>
          <Stack gap="sm">
            <Stack gap="xs">
              <Group justify="space-between">
                <Group gap="xs">
                  <Award size={12} color="#2ed573" />
                  <Text size="xs" fw={500}>
                    质量目标
                  </Text>
                </Group>
                <Text size="xs" c="dimmed">
                  {optimizationTargets.qualityTarget} 分
                </Text>
              </Group>
              <Slider
                value={optimizationTargets.qualityTarget}
                onChange={(v) => setOptimizationTargets({ qualityTarget: v })}
                min={50}
                max={95}
                step={1}
                size="xs"
                color="green"
                label={null}
              />
            </Stack>

            <Stack gap="xs">
              <Group justify="space-between">
                <Group gap="xs">
                  <Shield size={12} color="#ff6b6b" />
                  <Text size="xs" fw={500}>
                    断线风险上限
                  </Text>
                </Group>
                <Text size="xs" c="dimmed">
                  {optimizationTargets.maxBreakRisk}%
                </Text>
              </Group>
              <Slider
                value={optimizationTargets.maxBreakRisk}
                onChange={(v) => setOptimizationTargets({ maxBreakRisk: v })}
                min={10}
                max={60}
                step={1}
                size="xs"
                color="red"
                label={null}
              />
            </Stack>

            <Stack gap="xs">
              <Group justify="space-between">
                <Group gap="xs">
                  <Clock size={12} color="#ffd700" />
                  <Text size="xs" fw={500}>
                    磨损寿命下限
                  </Text>
                </Group>
                <Text size="xs" c="dimmed">
                  {optimizationTargets.minWearLifetime} 次
                </Text>
              </Group>
              <Slider
                value={optimizationTargets.minWearLifetime}
                onChange={(v) => setOptimizationTargets({ minWearLifetime: v })}
                min={2000}
                max={15000}
                step={500}
                size="xs"
                color="yellow"
                label={null}
              />
            </Stack>

            <Stack gap="xs">
              <Group justify="space-between">
                <Group gap="xs">
                  <TrendingUp size={12} color="#00d4ff" />
                  <Text size="xs" fw={500}>
                    产能目标
                  </Text>
                </Group>
                <Text size="xs" c="dimmed">
                  {optimizationTargets.productivityTarget} 件/小时
                </Text>
              </Group>
              <Slider
                value={optimizationTargets.productivityTarget}
                onChange={(v) => setOptimizationTargets({ productivityTarget: v })}
                min={30}
                max={200}
                step={5}
                size="xs"
                color="cyan"
                label={null}
              />
            </Stack>
          </Stack>
        </Collapse>

        <Paper
          p="xs"
          radius="sm"
          style={{
            background: 'rgba(0, 212, 255, 0.06)',
            border: '1px solid rgba(0, 212, 255, 0.15)',
            cursor: 'pointer',
          }}
          onClick={() => setExpandedConstraints(!expandedConstraints)}
        >
          <Group justify="space-between">
            <Group gap="xs">
              <Gauge size={14} color="#00d4ff" />
              <Text size="sm" fw={500} c="cyan.4">
                搜索范围约束
              </Text>
            </Group>
            {expandedConstraints ? (
              <ChevronUp size={14} color="#6c7a8c" />
            ) : (
              <ChevronDown size={14} color="#6c7a8c" />
            )}
          </Group>
        </Paper>

        <Collapse in={expandedConstraints}>
          <Stack gap="sm">
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="xs" fw={500}>
                  张力范围
                </Text>
                <Text size="xs" c="dimmed">
                  {optimizationConstraints.tensionRange[0].toFixed(0)} - {optimizationConstraints.tensionRange[1].toFixed(0)} N
                </Text>
              </Group>
              <Group grow>
                <NumberInput
                  value={optimizationConstraints.tensionRange[0]}
                  onChange={(v) =>
                    setOptimizationConstraints({
                      tensionRange: [Number(v) || MIN_TENSION, optimizationConstraints.tensionRange[1]],
                    })
                  }
                  min={MIN_TENSION}
                  max={optimizationConstraints.tensionRange[1]}
                  size="xs"
                  hideControls
                  styles={{
                    input: {
                      background: 'rgba(10, 22, 40, 0.8)',
                      borderColor: 'rgba(0, 212, 255, 0.3)',
                      color: '#fff',
                      fontSize: 11,
                      height: 24,
                    },
                  }}
                />
                <Text size="xs" c="dimmed" ta="center">
                  ~
                </Text>
                <NumberInput
                  value={optimizationConstraints.tensionRange[1]}
                  onChange={(v) =>
                    setOptimizationConstraints({
                      tensionRange: [optimizationConstraints.tensionRange[0], Number(v) || MAX_TENSION],
                    })
                  }
                  min={optimizationConstraints.tensionRange[0]}
                  max={MAX_TENSION}
                  size="xs"
                  hideControls
                  styles={{
                    input: {
                      background: 'rgba(10, 22, 40, 0.8)',
                      borderColor: 'rgba(0, 212, 255, 0.3)',
                      color: '#fff',
                      fontSize: 11,
                      height: 24,
                    },
                  }}
                />
              </Group>
            </Stack>

            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="xs" fw={500}>
                  转速范围
                </Text>
                <Text size="xs" c="dimmed">
                  {optimizationConstraints.speedRange[0].toFixed(1)} - {optimizationConstraints.speedRange[1].toFixed(1)} 转/秒
                </Text>
              </Group>
              <Group grow>
                <NumberInput
                  value={optimizationConstraints.speedRange[0]}
                  onChange={(v) =>
                    setOptimizationConstraints({
                      speedRange: [Number(v) || MIN_SPEED, optimizationConstraints.speedRange[1]],
                    })
                  }
                  min={MIN_SPEED}
                  max={optimizationConstraints.speedRange[1]}
                  step={0.1}
                  size="xs"
                  hideControls
                  styles={{
                    input: {
                      background: 'rgba(10, 22, 40, 0.8)',
                      borderColor: 'rgba(0, 212, 255, 0.3)',
                      color: '#fff',
                      fontSize: 11,
                      height: 24,
                    },
                  }}
                />
                <Text size="xs" c="dimmed" ta="center">
                  ~
                </Text>
                <NumberInput
                  value={optimizationConstraints.speedRange[1]}
                  onChange={(v) =>
                    setOptimizationConstraints({
                      speedRange: [optimizationConstraints.speedRange[0], Number(v) || MAX_SPEED],
                    })
                  }
                  min={optimizationConstraints.speedRange[0]}
                  max={MAX_SPEED}
                  step={0.1}
                  size="xs"
                  hideControls
                  styles={{
                    input: {
                      background: 'rgba(10, 22, 40, 0.8)',
                      borderColor: 'rgba(0, 212, 255, 0.3)',
                      color: '#fff',
                      fontSize: 11,
                      height: 24,
                    },
                  }}
                />
              </Group>
            </Stack>

            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="xs" fw={500}>
                  导纱角度范围
                </Text>
                <Text size="xs" c="dimmed">
                  {optimizationConstraints.guideAngleRange[0]}° - {optimizationConstraints.guideAngleRange[1]}°
                </Text>
              </Group>
              <Group grow>
                <NumberInput
                  value={optimizationConstraints.guideAngleRange[0]}
                  onChange={(v) =>
                    setOptimizationConstraints({
                      guideAngleRange: [Number(v) || MIN_GUIDE_ANGLE, optimizationConstraints.guideAngleRange[1]],
                    })
                  }
                  min={MIN_GUIDE_ANGLE}
                  max={optimizationConstraints.guideAngleRange[1]}
                  size="xs"
                  hideControls
                  styles={{
                    input: {
                      background: 'rgba(10, 22, 40, 0.8)',
                      borderColor: 'rgba(0, 212, 255, 0.3)',
                      color: '#fff',
                      fontSize: 11,
                      height: 24,
                    },
                  }}
                />
                <Text size="xs" c="dimmed" ta="center">
                  ~
                </Text>
                <NumberInput
                  value={optimizationConstraints.guideAngleRange[1]}
                  onChange={(v) =>
                    setOptimizationConstraints({
                      guideAngleRange: [optimizationConstraints.guideAngleRange[0], Number(v) || MAX_GUIDE_ANGLE],
                    })
                  }
                  min={optimizationConstraints.guideAngleRange[0]}
                  max={MAX_GUIDE_ANGLE}
                  size="xs"
                  hideControls
                  styles={{
                    input: {
                      background: 'rgba(10, 22, 40, 0.8)',
                      borderColor: 'rgba(0, 212, 255, 0.3)',
                      color: '#fff',
                      fontSize: 11,
                      height: 24,
                    },
                  }}
                />
              </Group>
            </Stack>

            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="xs" fw={500}>
                  花型周期范围
                </Text>
                <Text size="xs" c="dimmed">
                  {optimizationConstraints.patternPeriodRange[0]} - {optimizationConstraints.patternPeriodRange[1]} 针
                </Text>
              </Group>
              <Group grow>
                <NumberInput
                  value={optimizationConstraints.patternPeriodRange[0]}
                  onChange={(v) =>
                    setOptimizationConstraints({
                      patternPeriodRange: [
                        Math.max(1, Number(v) || 1),
                        optimizationConstraints.patternPeriodRange[1],
                      ],
                    })
                  }
                  min={1}
                  max={optimizationConstraints.patternPeriodRange[1]}
                  size="xs"
                  hideControls
                  styles={{
                    input: {
                      background: 'rgba(10, 22, 40, 0.8)',
                      borderColor: 'rgba(0, 212, 255, 0.3)',
                      color: '#fff',
                      fontSize: 11,
                      height: 24,
                    },
                  }}
                />
                <Text size="xs" c="dimmed" ta="center">
                  ~
                </Text>
                <NumberInput
                  value={optimizationConstraints.patternPeriodRange[1]}
                  onChange={(v) =>
                    setOptimizationConstraints({
                      patternPeriodRange: [
                        optimizationConstraints.patternPeriodRange[0],
                        Math.min(totalNeedles, Number(v) || totalNeedles),
                      ],
                    })
                  }
                  min={optimizationConstraints.patternPeriodRange[0]}
                  max={totalNeedles}
                  size="xs"
                  hideControls
                  styles={{
                    input: {
                      background: 'rgba(10, 22, 40, 0.8)',
                      borderColor: 'rgba(0, 212, 255, 0.3)',
                      color: '#fff',
                      fontSize: 11,
                      height: 24,
                    },
                  }}
                />
              </Group>
            </Stack>
          </Stack>
        </Collapse>

        <Button
          size="sm"
          color={isOptimizing ? 'yellow' : 'violet'}
          leftSection={isOptimizing ? <RotateCcw size={14} className="animate-spin" /> : <Search size={14} />}
          onClick={startOptimizationSearch}
          loading={isOptimizing}
          fullWidth
        >
          {isOptimizing ? '智能搜索中...' : '开始智能寻优'}
        </Button>

        <Divider c="dark.4" />

        <Paper
          p="xs"
          radius="sm"
          style={{
            background: 'rgba(46, 213, 115, 0.06)',
            border: '1px solid rgba(46, 213, 115, 0.2)',
            cursor: 'pointer',
          }}
          onClick={() => setExpandedCandidates(!expandedCandidates)}
        >
          <Group justify="space-between">
            <Group gap="xs">
              <Zap size={14} color="#2ed573" />
              <Text size="sm" fw={500} c="green.4">
                候选方案
              </Text>
              <Badge size="xs" color="green" variant="outline">
                {optimizationResult?.candidates.length || 0} 个
              </Badge>
            </Group>
            {expandedCandidates ? (
              <ChevronUp size={14} color="#6c7a8c" />
            ) : (
              <ChevronDown size={14} color="#6c7a8c" />
            )}
          </Group>
        </Paper>

        <Collapse in={expandedCandidates}>
          {optimizationResult ? (
            <ScrollArea h={320} type="auto">
              <Stack gap="xs">
                {optimizationResult.candidates.map((candidate) => {
                  const isSelected = candidate.id === selectedCandidateId;
                  const rankInfo = getRankBadge(candidate.rank);

                  return (
                    <Paper
                      key={candidate.id}
                      p="xs"
                      radius="sm"
                      style={{
                        background: isSelected
                          ? 'rgba(162, 155, 254, 0.12)'
                          : 'rgba(10, 22, 40, 0.6)',
                        border: `1px solid ${
                          isSelected
                            ? 'rgba(162, 155, 254, 0.5)'
                            : 'rgba(255,255,255,0.08)'
                        }`,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onClick={() => selectOptimizationCandidate(candidate.id)}
                    >
                      <Stack gap="xs">
                        <Group justify="space-between" align="center">
                          <Group gap="xs" wrap="nowrap">
                            <Badge size="xs" color={rankInfo.color} variant="filled">
                              {rankInfo.label}
                            </Badge>
                            <Text size="sm" fw={600} c={isSelected ? 'violet.4' : 'white'}>
                              {candidate.name}
                            </Text>
                          </Group>
                          <Group gap="xs" wrap="nowrap">
                            <Text
                              size="lg"
                              fw={700}
                              style={{ color: getScoreColor(candidate.score) }}
                            >
                              {candidate.score}
                            </Text>
                            <Text size="xs" c="dimmed">
                              分
                            </Text>
                          </Group>
                        </Group>

                        <Group gap={4} wrap="wrap">
                          <Badge size="xs" variant="outline" color="cyan">
                            张力 {candidate.baseTension.toFixed(0)}N
                          </Badge>
                          <Badge size="xs" variant="outline" color="orange">
                            {candidate.rotationSpeed.toFixed(1)}转/秒
                          </Badge>
                          <Badge size="xs" variant="outline" color="violet">
                            周期 {candidate.patternPeriod}针
                          </Badge>
                          <Badge size="xs" variant="outline" color="green">
                            {candidate.yarnFeeders.length}路送纱
                          </Badge>
                        </Group>

                        <Group gap={4} wrap="wrap">
                          {candidate.materialCombination.map((mat, i) => (
                            <Badge key={i} size="xs" variant="light" color="pink">
                              {mat}
                            </Badge>
                          ))}
                        </Group>

                        {candidate.advantages.length > 0 && (
                          <Group gap={4} wrap="wrap">
                            {candidate.advantages.slice(0, 3).map((adv, i) => (
                              <Group key={i} gap={2}>
                                <CheckCircle size={10} color="#2ed573" />
                                <Text size="xs" c="green.4">
                                  {adv}
                                </Text>
                              </Group>
                            ))}
                          </Group>
                        )}

                        {candidate.disadvantages.length > 0 && (
                          <Group gap={4} wrap="wrap">
                            {candidate.disadvantages.slice(0, 2).map((dis, i) => (
                              <Group key={i} gap={2}>
                                <XCircle size={10} color="#ff6b6b" />
                                <Text size="xs" c="red.4">
                                  {dis}
                                </Text>
                              </Group>
                            ))}
                          </Group>
                        )}

                        <Group grow mt={4}>
                          <Button
                            size="xs"
                            variant="light"
                            color="violet"
                            leftSection={<Play size={12} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              applyOptimizationCandidate(candidate.id);
                            }}
                          >
                            一键应用
                          </Button>
                          <Tooltip label={candidate.tradeoffNotes}>
                            <ActionIcon size="xs" variant="subtle" color="gray">
                              <Zap size={12} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            </ScrollArea>
          ) : (
            <Paper
              p="md"
              radius="sm"
              style={{
                background: 'rgba(10, 22, 40, 0.4)',
                border: '1px dashed rgba(162, 155, 254, 0.3)',
              }}
            >
              <Stack align="center" gap="xs">
                <Search size={24} color="#6c7a8c" />
                <Text size="xs" c="dimmed" ta="center">
                  点击「开始智能寻优」
                  <br />
                  系统将自动搜索最优工艺参数组合
                </Text>
              </Stack>
            </Paper>
          )}
        </Collapse>

        {selectedCandidate && (
          <>
            <Divider c="dark.4" />

            <Paper
              p="xs"
              radius="sm"
              style={{
                background: 'rgba(255, 215, 0, 0.06)',
                border: '1px solid rgba(255, 215, 0, 0.2)',
              }}
            >
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="xs" fw={500} c="yellow.4">
                    📊 选中方案详情
                  </Text>
                  <Badge size="xs" color="yellow" variant="outline">
                    {selectedCandidate.name}
                  </Badge>
                </Group>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <div>
                    <Text size="xs" c="dimmed">
                      综合质量
                    </Text>
                    <Text size="sm" fw={600} c="green.4">
                      {selectedCandidate.qualityPrediction.overallQualityScore.toFixed(0)}分
                    </Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">
                      质量等级
                    </Text>
                    <Text size="sm" fw={600} c="cyan.4">
                      {selectedCandidate.qualityPrediction.grade}
                    </Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">
                      断线风险
                    </Text>
                    <Text
                      size="sm"
                      fw={600}
                      c={
                        selectedCandidate.qualityPrediction.breakageProbability < 30
                          ? 'green.4'
                          : selectedCandidate.qualityPrediction.breakageProbability < 50
                          ? 'yellow.4'
                          : 'red.4'
                      }
                    >
                      {selectedCandidate.qualityPrediction.breakageProbability.toFixed(0)}%
                    </Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">
                      磨损寿命
                    </Text>
                    <Text size="sm" fw={600} c="orange.4">
                      {selectedCandidate.qualityPrediction.wearLifetime.toFixed(0)}次
                    </Text>
                  </div>
                </div>

                <Progress
                  value={selectedCandidate.score}
                  size="xs"
                  color={getScoreColor(selectedCandidate.score)}
                />

                <Text size="xs" c="dimmed" lh={1.4}>
                  💡 {selectedCandidate.tradeoffNotes}
                </Text>
              </Stack>
            </Paper>
          </>
        )}
      </Stack>
    </Paper>
  );
}
