import { useEffect } from 'react';
import {
  Paper,
  Title,
  Stack,
  Group,
  Text,
  Badge,
  ActionIcon,
  ScrollArea,
  Tooltip,
} from '@mantine/core';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  X,
  Bell,
  CheckCircle,
} from 'lucide-react';
import { useCylinderStore } from '@/store/cylinderStore';
import { Warning } from '@/types/cylinder';

export default function WarningPanel() {
  const { warnings, dismissWarning, clearWarnings, checkForWarnings } =
    useCylinderStore();

  useEffect(() => {
    checkForWarnings();
  }, [checkForWarnings]);

  const getWarningIcon = (level: Warning['level']) => {
    switch (level) {
      case 'error':
        return <AlertCircle size={18} color="#ff4757" />;
      case 'warning':
        return <AlertTriangle size={18} color="#ffa502" />;
      case 'info':
        return <Info size={18} color="#00d4ff" />;
    }
  };

  const getWarningColor = (level: Warning['level']) => {
    switch (level) {
      case 'error':
        return {
          bg: 'rgba(255, 71, 87, 0.15)',
          border: 'rgba(255, 71, 87, 0.4)',
          badge: 'red',
        };
      case 'warning':
        return {
          bg: 'rgba(255, 165, 2, 0.1)',
          border: 'rgba(255, 165, 2, 0.3)',
          badge: 'orange',
        };
      case 'info':
        return {
          bg: 'rgba(0, 212, 255, 0.1)',
          border: 'rgba(0, 212, 255, 0.3)',
          badge: 'cyan',
        };
    }
  };

  const getTypeLabel = (type: Warning['type']) => {
    switch (type) {
      case 'tension':
        return '张力';
      case 'speed':
        return '转速';
      case 'needle_distribution':
        return '针位分布';
      case 'high_risk':
        return '高风险';
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const sortedWarnings = [...warnings].sort((a, b) => {
    const levelOrder = { error: 0, warning: 1, info: 2 };
    return levelOrder[a.level] - levelOrder[b.level];
  });

  const errorCount = warnings.filter((w) => w.level === 'error').length;
  const warningCount = warnings.filter((w) => w.level === 'warning').length;
  const infoCount = warnings.filter((w) => w.level === 'info').length;

  return (
    <Paper
      p="md"
      radius="md"
      style={{
        background: 'rgba(26, 41, 66, 0.9)',
        border: `1px solid ${
          errorCount > 0
            ? 'rgba(255, 71, 87, 0.4)'
            : warningCount > 0
            ? 'rgba(255, 165, 2, 0.3)'
            : 'rgba(46, 213, 115, 0.3)'
        }`,
        backdropFilter: 'blur(10px)',
      }}
    >
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Bell
              size={18}
              color={
                errorCount > 0
                  ? '#ff4757'
                  : warningCount > 0
                  ? '#ffa502'
                  : '#2ed573'
              }
            />
            <Title order={5} c={errorCount > 0 ? 'red.4' : warningCount > 0 ? 'orange.4' : 'green.4'}>
              系统预警
            </Title>
          </Group>
          <Group gap="xs">
            {errorCount > 0 && (
              <Badge size="sm" color="red">
                {errorCount} 严重
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge size="sm" color="orange">
                {warningCount} 警告
              </Badge>
            )}
            {infoCount > 0 && (
              <Badge size="sm" color="cyan">
                {infoCount} 提示
              </Badge>
            )}
            {warnings.length > 0 && (
              <Tooltip label="清除所有预警">
                <ActionIcon
                  size="sm"
                  variant="transparent"
                  c="dimmed"
                  onClick={clearWarnings}
                >
                  <X size={16} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        </Group>

        {sortedWarnings.length === 0 ? (
          <Paper
            p="md"
            radius="sm"
            style={{
              background: 'rgba(46, 213, 115, 0.1)',
              border: '1px solid rgba(46, 213, 115, 0.3)',
            }}
          >
            <Group gap="xs" justify="center">
              <CheckCircle size={20} color="#2ed573" />
              <Text size="sm" c="green.4" fw={500}>
                系统运行正常，暂无预警
              </Text>
            </Group>
          </Paper>
        ) : (
          <ScrollArea h={180} type="auto">
            <Stack gap="xs">
              {sortedWarnings.map((warning) => {
                const colors = getWarningColor(warning.level);
                return (
                  <Paper
                    key={warning.id}
                    p="xs"
                    radius="sm"
                    style={{
                      background: colors.bg,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <Group justify="space-between" align="flex-start" gap="xs">
                      <Group gap="xs" align="flex-start" style={{ flex: 1 }}>
                        {getWarningIcon(warning.level)}
                        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                          <Group gap="xs" wrap="nowrap">
                            <Badge
                              size="xs"
                              color={colors.badge}
                              variant="dot"
                            >
                              {getTypeLabel(warning.type)}
                            </Badge>
                            <Text
                              size="xs"
                              c="dimmed"
                              style={{ flexShrink: 0 }}
                            >
                              {formatTime(warning.timestamp)}
                            </Text>
                          </Group>
                          <Text
                            size="sm"
                            fw={600}
                            c={
                              warning.level === 'error'
                                ? 'red.4'
                                : warning.level === 'warning'
                                ? 'orange.4'
                                : 'cyan.4'
                            }
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {warning.message}
                          </Text>
                          {warning.details && (
                            <Text
                              size="xs"
                              c="dimmed"
                              style={{ lineHeight: 1.4 }}
                            >
                              {warning.details}
                            </Text>
                          )}
                        </Stack>
                      </Group>
                      <Tooltip label="忽略此预警">
                        <ActionIcon
                          size="sm"
                          variant="transparent"
                          c="dimmed"
                          onClick={() => dismissWarning(warning.id)}
                        >
                          <X size={14} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Paper>
                );
              })}
            </Stack>
          </ScrollArea>
        )}

        <Paper
          p="xs"
          radius="sm"
          style={{ background: 'rgba(10, 22, 40, 0.6)' }}
        >
          <Text size="xs" c="dimmed" lh={1.5}>
            🔔 系统会自动检测张力过高、转速过快、停针比例异常、张力分布不均等问题，
            并给出相应的预警提示。严重预警需要立即处理以避免断针。
          </Text>
        </Paper>
      </Stack>
    </Paper>
  );
}
