import {
  Paper,
  Title,
  Stack,
  Group,
  Text,
  Badge,
  Divider,
  Button,
  ScrollArea,
  ActionIcon,
  Tooltip,
  Modal,
  Select,
  NumberInput,
  Collapse,
  Progress,
} from '@mantine/core';
import {
  Calendar,
  Plus,
  Trash2,
  Play,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ListOrdered,
  CheckCircle2,
  Lightbulb,
  Gauge,
  RefreshCw,
  Package,
} from 'lucide-react';
import { useState } from 'react';
import { useCylinderStore } from '@/store/cylinderStore';
import { SOCK_TYPES } from '@/types/cylinder';

export default function SchedulePanel() {
  const {
    workOrders,
    scheduleResult,
    isScheduling,
    addWorkOrder,
    removeWorkOrder,
    runBatchScheduling,
    applyScheduleScheme,
  } = useCylinderStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState(true);
  const [expandedSchedule, setExpandedSchedule] = useState(true);
  const [expandedSuggestions, setExpandedSuggestions] = useState(false);

  const [newOrder, setNewOrder] = useState({
    orderNo: '',
    sockType: '运动袜',
    batchSize: 100,
    priority: 'medium' as 'low' | 'medium' | 'high',
    qualityGrade: 'B' as 'A' | 'B' | 'C' | 'D',
    minWearLifetime: 5000,
    maxBreakRisk: 30,
  });

  const handleAddOrder = () => {
    if (!newOrder.orderNo.trim()) return;

    addWorkOrder({
      orderNo: newOrder.orderNo,
      sockType: newOrder.sockType,
      batchSize: newOrder.batchSize,
      deadline: Date.now() + 86400000 * 7,
      priority: newOrder.priority,
      requirements: {
        qualityGrade: newOrder.qualityGrade,
        minWearLifetime: newOrder.minWearLifetime,
        maxBreakRisk: newOrder.maxBreakRisk,
      },
    });

    setNewOrder({
      orderNo: '',
      sockType: '运动袜',
      batchSize: 100,
      priority: 'medium',
      qualityGrade: 'B',
      minWearLifetime: 5000,
      maxBreakRisk: 30,
    });
    setShowAddModal(false);
  };

  const getPriorityColor = (priority: string) => {
    if (priority === 'high') return 'red';
    if (priority === 'medium') return 'yellow';
    return 'green';
  };

  const getPriorityLabel = (priority: string) => {
    if (priority === 'high') return '高';
    if (priority === 'medium') return '中';
    return '低';
  };

  const getStatusColor = (status: string) => {
    if (status === 'completed') return 'green';
    if (status === 'processing') return 'blue';
    if (status === 'scheduled') return 'cyan';
    return 'gray';
  };

  const getStatusLabel = (status: string) => {
    if (status === 'completed') return '已完成';
    if (status === 'processing') return '生产中';
    if (status === 'scheduled') return '已排程';
    return '待排程';
  };

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}分钟`;
  };

  const formatDateTime = (timestamp?: number) => {
    if (!timestamp) return '--';
    const d = new Date(timestamp);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <Paper
      p="md"
      radius="md"
      style={{
        background: 'rgba(26, 41, 66, 0.9)',
        border: `1px solid ${
          isScheduling
            ? 'rgba(255, 165, 2, 0.5)'
            : scheduleResult
            ? 'rgba(46, 213, 115, 0.3)'
            : 'rgba(0, 212, 255, 0.3)'
        }`,
        backdropFilter: 'blur(10px)',
      }}
    >
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Calendar size={18} color="#00d4ff" />
            <Title order={5} c="cyan.4">
              批量工单排程
            </Title>
          </Group>
          <Group gap="xs">
            <Badge size="xs" color="cyan" variant="outline">
              共 {workOrders.length} 单
            </Badge>
            {isScheduling && (
              <Badge size="xs" color="yellow" variant="filled">
                排程中...
              </Badge>
            )}
          </Group>
        </Group>

        <Divider c="dark.4" />

        <Paper
          p="xs"
          radius="sm"
          style={{
            background: 'rgba(0, 212, 255, 0.06)',
            border: '1px solid rgba(0, 212, 255, 0.15)',
            cursor: 'pointer',
          }}
          onClick={() => setExpandedOrders(!expandedOrders)}
        >
          <Group justify="space-between">
            <Group gap="xs">
              <ListOrdered size={14} color="#00d4ff" />
              <Text size="sm" fw={500} c="cyan.4">
                工单列表
              </Text>
              <Badge size="xs" color="cyan" variant="outline">
                {workOrders.length}
              </Badge>
            </Group>
            <Group gap="xs">
              <Tooltip label="添加工单">
                <ActionIcon
                  size="xs"
                  variant="light"
                  color="green"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAddModal(true);
                  }}
                >
                  <Plus size={14} />
                </ActionIcon>
              </Tooltip>
              {expandedOrders ? (
                <ChevronUp size={14} color="#6c7a8c" />
              ) : (
                <ChevronDown size={14} color="#6c7a8c" />
              )}
            </Group>
          </Group>
        </Paper>

        <Collapse in={expandedOrders}>
          <ScrollArea h={200} type="auto">
            <Stack gap="xs">
              {workOrders.length === 0 ? (
                <Paper
                  p="md"
                  radius="sm"
                  style={{
                    background: 'rgba(10, 22, 40, 0.4)',
                    border: '1px dashed rgba(0, 212, 255, 0.3)',
                  }}
                >
                  <Stack align="center" gap="xs">
                    <Package size={24} color="#6c7a8c" />
                    <Text size="xs" c="dimmed" ta="center">
                      暂无工单
                      <br />
                      点击 + 添加新工单
                    </Text>
                  </Stack>
                </Paper>
              ) : (
                workOrders.map((order) => (
                  <Paper
                    key={order.id}
                    p="xs"
                    radius="sm"
                    style={{
                      background: 'rgba(10, 22, 40, 0.6)',
                      border: `1px solid rgba(255,255,255,0.08)`,
                    }}
                  >
                    <Stack gap={4}>
                      <Group justify="space-between">
                        <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                          <Package size={12} color="#a29bfe" />
                          <Text
                            size="xs"
                            fw={600}
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {order.orderNo}
                          </Text>
                        </Group>
                        <Group gap={4} wrap="nowrap">
                          <Badge size="xs" color={getPriorityColor(order.priority)} variant="light">
                            {getPriorityLabel(order.priority)}优
                          </Badge>
                          <Badge size="xs" color={getStatusColor(order.status)} variant="outline">
                            {getStatusLabel(order.status)}
                          </Badge>
                          <Tooltip label="删除工单">
                            <ActionIcon
                              size="xs"
                              variant="subtle"
                              color="red"
                              onClick={() => removeWorkOrder(order.id)}
                            >
                              <Trash2 size={12} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Group>

                      <Group gap={4} wrap="wrap">
                        <Badge size="xs" variant="outline" color="violet">
                          {order.sockType}
                        </Badge>
                        <Badge size="xs" variant="outline" color="cyan">
                          {order.batchSize} 件
                        </Badge>
                        <Badge size="xs" variant="outline" color="green">
                          质量 {order.requirements.qualityGrade}
                        </Badge>
                      </Group>

                      <Group gap={4} wrap="wrap">
                        <Text size="xs" c="dimmed">
                          磨损≥{order.requirements.minWearLifetime}次
                        </Text>
                        <Text size="xs" c="dimmed">
                          断线≤{order.requirements.maxBreakRisk}%
                        </Text>
                      </Group>
                    </Stack>
                  </Paper>
                ))
              )}
            </Stack>
          </ScrollArea>
        </Collapse>

        <Button
          size="sm"
          color={isScheduling ? 'yellow' : 'cyan'}
          leftSection={isScheduling ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
          onClick={runBatchScheduling}
          loading={isScheduling}
          fullWidth
          disabled={workOrders.length === 0}
        >
          {isScheduling ? '智能排程中...' : '运行智能排程'}
        </Button>

        <Divider c="dark.4" />

        {scheduleResult && (
          <>
            <Paper
              p="xs"
              radius="sm"
              style={{
                background: 'rgba(46, 213, 115, 0.06)',
                border: '1px solid rgba(46, 213, 115, 0.2)',
                cursor: 'pointer',
              }}
              onClick={() => setExpandedSchedule(!expandedSchedule)}
            >
              <Group justify="space-between">
                <Group gap="xs">
                  <Gauge size={14} color="#2ed573" />
                  <Text size="sm" fw={500} c="green.4">
                    排程结果
                  </Text>
                  <Badge size="xs" color="green" variant="outline">
                    {scheduleResult.totalOrders} 单
                  </Badge>
                </Group>
                {expandedSchedule ? (
                  <ChevronUp size={14} color="#6c7a8c" />
                ) : (
                  <ChevronDown size={14} color="#6c7a8c" />
                )}
              </Group>
            </Paper>

            <Collapse in={expandedSchedule}>
              <Stack gap="xs">
                <Group grow>
                  <Paper
                    p="xs"
                    radius="sm"
                    style={{
                      background: 'rgba(10, 22, 40, 0.6)',
                      border: '1px solid rgba(0, 212, 255, 0.2)',
                    }}
                  >
                    <Text size="xs" c="dimmed">
                      总耗时
                    </Text>
                    <Text size="sm" fw={600} c="cyan.4">
                      {formatTime(scheduleResult.totalTime * 60000)}
                    </Text>
                  </Paper>
                  <Paper
                    p="xs"
                    radius="sm"
                    style={{
                      background: 'rgba(10, 22, 40, 0.6)',
                      border: '1px solid rgba(46, 213, 115, 0.2)',
                    }}
                  >
                    <Text size="xs" c="dimmed">
                      平均质量
                    </Text>
                    <Text size="sm" fw={600} c="green.4">
                      {scheduleResult.averageQuality.toFixed(0)}分
                    </Text>
                  </Paper>
                </Group>

                <ScrollArea h={280} type="auto">
                  <Stack gap="xs">
                    {scheduleResult.items.map((item, index) => (
                      <Paper
                        key={item.orderId}
                        p="xs"
                        radius="sm"
                        style={{
                          background:
                            item.warnings.length > 0
                              ? 'rgba(255, 165, 2, 0.06)'
                              : 'rgba(10, 22, 40, 0.6)',
                          border: `1px solid ${
                            item.warnings.length > 0
                              ? 'rgba(255, 165, 2, 0.3)'
                              : 'rgba(255,255,255,0.08)'
                          }`,
                        }}
                      >
                        <Stack gap={4}>
                          <Group justify="space-between">
                            <Group gap="xs" wrap="nowrap">
                              <Badge size="xs" color="cyan" variant="filled">
                                #{index + 1}
                              </Badge>
                              <Text size="xs" fw={600}>
                                {item.orderNo}
                              </Text>
                            </Group>
                            <Badge
                              size="xs"
                              color={getPriorityColor(item.priority)}
                              variant="light"
                            >
                              {getPriorityLabel(item.priority)}优
                            </Badge>
                          </Group>

                          <Group gap={4} wrap="wrap">
                            <Badge size="xs" variant="outline" color="violet">
                              {item.sockType}
                            </Badge>
                            <Badge size="xs" variant="outline" color="cyan">
                              {item.batchSize} 件
                            </Badge>
                            <Badge size="xs" variant="outline" color="green">
                              {item.qualityPrediction.grade} 级
                            </Badge>
                          </Group>

                          <Group gap="xs" wrap="wrap">
                            <Group gap={2}>
                              <Clock size={10} color="#6c7a8c" />
                              <Text size="xs" c="dimmed">
                                {item.estimatedTime}分钟
                              </Text>
                            </Group>
                            <Group gap={2}>
                              <CheckCircle2 size={10} color="#2ed573" />
                              <Text size="xs" c="green.4">
                                {item.qualityPrediction.overallQualityScore.toFixed(0)}分
                              </Text>
                            </Group>
                          </Group>

                          <Group gap={4}>
                            <Text size="xs" c="dimmed">
                              {formatDateTime(item.startTime)} → {formatDateTime(item.endTime)}
                            </Text>
                          </Group>

                          {item.warnings.length > 0 && (
                            <Stack gap={2}>
                              {item.warnings.map((w, i) => (
                                <Group key={i} gap={4}>
                                  <AlertTriangle size={10} color="#ffa502" />
                                  <Text size="xs" c="yellow.4">
                                    {w}
                                  </Text>
                                </Group>
                              ))}
                            </Stack>
                          )}

                          <Progress
                            value={item.qualityPrediction.overallQualityScore}
                            size="xs"
                            color={
                              item.qualityPrediction.overallQualityScore >= 80
                                ? 'green'
                                : item.qualityPrediction.overallQualityScore >= 65
                                ? 'cyan'
                                : 'yellow'
                            }
                          />

                          <Group grow>
                            <Button
                              size="xs"
                              variant="light"
                              color="cyan"
                              leftSection={<Play size={12} />}
                              onClick={() => applyScheduleScheme(item.orderId)}
                            >
                              应用方案
                            </Button>
                          </Group>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                </ScrollArea>
              </Stack>
            </Collapse>

            <Paper
              p="xs"
              radius="sm"
              style={{
                background: 'rgba(255, 215, 0, 0.06)',
                border: '1px solid rgba(255, 215, 0, 0.2)',
                cursor: 'pointer',
              }}
              onClick={() => setExpandedSuggestions(!expandedSuggestions)}
            >
              <Group justify="space-between">
                <Group gap="xs">
                  <Lightbulb size={14} color="#ffd700" />
                  <Text size="sm" fw={500} c="yellow.4">
                    优化建议
                  </Text>
                  <Badge size="xs" color="yellow" variant="outline">
                    {scheduleResult.optimizationSuggestions.length}
                  </Badge>
                </Group>
                {expandedSuggestions ? (
                  <ChevronUp size={14} color="#6c7a8c" />
                ) : (
                  <ChevronDown size={14} color="#6c7a8c" />
                )}
              </Group>
            </Paper>

            <Collapse in={expandedSuggestions}>
              <Stack gap="xs">
                {scheduleResult.optimizationSuggestions.map((suggestion, i) => (
                  <Group key={i} gap="xs">
                    <Lightbulb size={12} color="#ffd700" />
                    <Text size="xs" c="yellow.4">
                      {suggestion}
                    </Text>
                  </Group>
                ))}
              </Stack>
            </Collapse>
          </>
        )}

        {!scheduleResult && !isScheduling && (
          <Paper
            p="md"
            radius="sm"
            style={{
              background: 'rgba(10, 22, 40, 0.4)',
              border: '1px dashed rgba(0, 212, 255, 0.3)',
            }}
          >
            <Stack align="center" gap="xs">
              <Calendar size={24} color="#6c7a8c" />
              <Text size="xs" c="dimmed" ta="center">
                添加工单后点击「运行智能排程」
                <br />
                系统将自动分配最优工艺参数
              </Text>
            </Stack>
          </Paper>
        )}
      </Stack>

      <Modal
        opened={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="添加工单"
        size="sm"
        styles={{
          content: {
            background: 'rgba(26, 41, 66, 0.95)',
            border: '1px solid rgba(0, 212, 255, 0.3)',
            backdropFilter: 'blur(10px)',
          },
          title: { color: '#00d4ff' },
          close: { color: '#6c7a8c' },
        }}
      >
        <Stack gap="md">
          <Stack gap="xs">
            <Text size="xs" fw={500}>
              工单编号
            </Text>
            <NumberInput
              value={parseInt(newOrder.orderNo.replace(/\D/g, '')) || ''}
              onChange={(v) =>
                setNewOrder({ ...newOrder, orderNo: `WO-${v || 0}` })
              }
              placeholder="WO-XXXX"
              size="xs"
              styles={{
                input: {
                  background: 'rgba(10, 22, 40, 0.8)',
                  borderColor: 'rgba(0, 212, 255, 0.3)',
                  color: '#fff',
                },
              }}
            />
          </Stack>

          <Stack gap="xs">
            <Text size="xs" fw={500}>
              袜型
            </Text>
            <Select
              value={newOrder.sockType}
              onChange={(v) => setNewOrder({ ...newOrder, sockType: v || '运动袜' })}
              data={SOCK_TYPES.map((t) => ({ value: t, label: t }))}
              size="xs"
              styles={{
                input: {
                  background: 'rgba(10, 22, 40, 0.8)',
                  borderColor: 'rgba(162, 155, 254, 0.3)',
                  color: '#fff',
                },
                dropdown: {
                  background: '#1a2942',
                  border: '1px solid rgba(162, 155, 254, 0.3)',
                },
                option: {
                  color: '#fff',
                  fontSize: 12,
                },
              }}
            />
          </Stack>

          <Group grow>
            <Stack gap="xs">
              <Text size="xs" fw={500}>
                批量数量
              </Text>
              <NumberInput
                value={newOrder.batchSize}
                onChange={(v) =>
                  setNewOrder({ ...newOrder, batchSize: Number(v) || 100 })
                }
                min={1}
                size="xs"
                styles={{
                  input: {
                    background: 'rgba(10, 22, 40, 0.8)',
                    borderColor: 'rgba(0, 212, 255, 0.3)',
                    color: '#fff',
                  },
                }}
              />
            </Stack>
            <Stack gap="xs">
              <Text size="xs" fw={500}>
                优先级
              </Text>
              <Select
                value={newOrder.priority}
                onChange={(v) =>
                  setNewOrder({
                    ...newOrder,
                    priority: (v as 'low' | 'medium' | 'high') || 'medium',
                  })
                }
                data={[
                  { value: 'high', label: '高优先级' },
                  { value: 'medium', label: '中优先级' },
                  { value: 'low', label: '低优先级' },
                ]}
                size="xs"
                styles={{
                  input: {
                    background: 'rgba(10, 22, 40, 0.8)',
                    borderColor: 'rgba(255, 165, 2, 0.3)',
                    color: '#fff',
                  },
                  dropdown: {
                    background: '#1a2942',
                    border: '1px solid rgba(255, 165, 2, 0.3)',
                  },
                  option: {
                    color: '#fff',
                    fontSize: 12,
                  },
                }}
              />
            </Stack>
          </Group>

          <Stack gap="xs">
            <Text size="xs" fw={500}>
              质量等级要求
            </Text>
            <Select
              value={newOrder.qualityGrade}
              onChange={(v) =>
                setNewOrder({
                  ...newOrder,
                  qualityGrade: (v as 'A' | 'B' | 'C' | 'D') || 'B',
                })
              }
              data={[
                { value: 'A', label: 'A级 - 高品质' },
                { value: 'B', label: 'B级 - 标准质量' },
                { value: 'C', label: 'C级 - 普通质量' },
                { value: 'D', label: 'D级 - 经济质量' },
              ]}
              size="xs"
              styles={{
                input: {
                  background: 'rgba(10, 22, 40, 0.8)',
                  borderColor: 'rgba(46, 213, 115, 0.3)',
                  color: '#fff',
                },
                dropdown: {
                  background: '#1a2942',
                  border: '1px solid rgba(46, 213, 115, 0.3)',
                },
                option: {
                  color: '#fff',
                  fontSize: 12,
                },
              }}
            />
          </Stack>

          <Group grow>
            <Stack gap="xs">
              <Text size="xs" fw={500}>
                最小磨损寿命(次)
              </Text>
              <NumberInput
                value={newOrder.minWearLifetime}
                onChange={(v) =>
                  setNewOrder({
                    ...newOrder,
                    minWearLifetime: Number(v) || 5000,
                  })
                }
                min={1000}
                step={500}
                size="xs"
                styles={{
                  input: {
                    background: 'rgba(10, 22, 40, 0.8)',
                    borderColor: 'rgba(255, 215, 0, 0.3)',
                    color: '#fff',
                  },
                }}
              />
            </Stack>
            <Stack gap="xs">
              <Text size="xs" fw={500}>
                最大断线风险(%)
              </Text>
              <NumberInput
                value={newOrder.maxBreakRisk}
                onChange={(v) =>
                  setNewOrder({
                    ...newOrder,
                    maxBreakRisk: Number(v) || 30,
                  })
                }
                min={5}
                max={80}
                size="xs"
                styles={{
                  input: {
                    background: 'rgba(10, 22, 40, 0.8)',
                    borderColor: 'rgba(255, 71, 87, 0.3)',
                    color: '#fff',
                  },
                }}
              />
            </Stack>
          </Group>

          <Group grow mt="md">
            <Button
              size="sm"
              variant="light"
              color="gray"
              onClick={() => setShowAddModal(false)}
            >
              取消
            </Button>
            <Button
              size="sm"
              color="green"
              leftSection={<Plus size={14} />}
              onClick={handleAddOrder}
            >
              添加
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Paper>
  );
}
