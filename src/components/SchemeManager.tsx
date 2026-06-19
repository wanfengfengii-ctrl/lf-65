import { useState, useRef } from 'react';
import {
  Paper,
  Title,
  Stack,
  Group,
  Text,
  Button,
  TextInput,
  Textarea,
  Modal,
  ActionIcon,
  Menu,
  Badge,
  ScrollArea,
  Divider,
  Tooltip,
} from '@mantine/core';
import {
  Save,
  FolderOpen,
  Trash2,
  Download,
  Upload,
  MoreHorizontal,
  FileText,
  Plus,
  Edit3,
  Copy,
} from 'lucide-react';
import { useCylinderStore } from '@/store/cylinderStore';
import { PatternScheme } from '@/types/cylinder';

export default function SchemeManager() {
  const {
    schemes,
    currentSchemeId,
    compareSchemeId,
    saveCurrentScheme,
    saveAsNewScheme,
    renameScheme,
    duplicateScheme,
    loadScheme,
    deleteScheme,
    setCompareScheme,
    exportScheme,
    importScheme,
  } = useCylinderStore();

  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [schemeName, setSchemeName] = useState('');
  const [schemeDescription, setSchemeDescription] = useState('');
  const [editingScheme, setEditingScheme] = useState<PatternScheme | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [saveMode, setSaveMode] = useState<'saveCurrent' | 'saveAsNew' | 'rename'>('saveCurrent');

  const currentScheme = schemes.find((s) => s.id === currentSchemeId);

  const handleSave = () => {
    if (!schemeName.trim()) return;

    switch (saveMode) {
      case 'saveCurrent':
        saveCurrentScheme(schemeName.trim(), schemeDescription.trim() || undefined);
        break;
      case 'saveAsNew':
        saveAsNewScheme(schemeName.trim(), schemeDescription.trim() || undefined);
        break;
      case 'rename':
        if (editingScheme) {
          renameScheme(editingScheme.id, schemeName.trim(), schemeDescription.trim() || undefined);
        }
        break;
    }

    setSaveModalOpen(false);
    setSchemeName('');
    setSchemeDescription('');
    setEditingScheme(null);
  };

  const openSaveModal = (mode: 'saveCurrent' | 'saveAsNew' | 'rename', scheme?: PatternScheme) => {
    setSaveMode(mode);
    if (mode === 'rename' && scheme) {
      setEditingScheme(scheme);
      setSchemeName(scheme.name);
      setSchemeDescription(scheme.description || '');
    } else if (mode === 'saveCurrent' && scheme) {
      setEditingScheme(null);
      setSchemeName(scheme.name);
      setSchemeDescription(scheme.description || '');
    } else {
      setEditingScheme(null);
      setSchemeName('');
      setSchemeDescription('');
    }
    setSaveModalOpen(true);
  };

  const handleExport = (id: string) => {
    try {
      const data = exportScheme(id);
      const scheme = schemes.find((s) => s.id === id);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${scheme?.name || 'scheme'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('导出失败:', e);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result as string;
        importScheme(data);
      } catch (err) {
        console.error('导入失败:', err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDuplicate = (scheme: PatternScheme) => {
    duplicateScheme(scheme.id);
  };

  return (
    <>
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
            <Group gap="xs">
              <FileText size={18} color="#ffd700" />
              <Title order={5} c="yellow.4">
                方案管理
              </Title>
            </Group>
            <Group gap="xs">
              <Tooltip label="导入方案">
                <ActionIcon
                  variant="light"
                  color="cyan"
                  onClick={handleImportClick}
                  size="sm"
                >
                  <Upload size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="新建方案">
                <ActionIcon
                  variant="light"
                  color="green"
                  onClick={() => openSaveModal('saveAsNew')}
                  size="sm"
                >
                  <Plus size={16} />
                </ActionIcon>
              </Tooltip>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleImport}
              />
            </Group>
          </Group>

          <Divider c="dark.4" />

          <Paper
            p="xs"
            radius="sm"
            style={{
              background: 'rgba(0, 212, 255, 0.1)',
              border: '1px solid rgba(0, 212, 255, 0.3)',
            }}
          >
            <Group justify="space-between" align="center">
              <div>
                <Text size="xs" c="dimmed">
                  当前方案
                </Text>
                <Text size="sm" fw={600} c="cyan.4">
                  {currentScheme?.name || '未命名'}
                </Text>
              </div>
              <Button
                leftSection={<Save size={14} />}
                size="xs"
                variant="light"
                color="cyan"
                onClick={() => openSaveModal('saveCurrent', currentScheme || undefined)}
              >
                保存
              </Button>
            </Group>
          </Paper>

          <Text size="xs" fw={500} c="dimmed">
            已保存方案 ({schemes.length})
          </Text>

          <ScrollArea h={200} type="auto">
            <Stack gap="xs">
              {schemes.map((scheme) => (
                <Paper
                  key={scheme.id}
                  p="xs"
                  radius="sm"
                  style={{
                    background:
                      scheme.id === currentSchemeId
                        ? 'rgba(0, 212, 255, 0.15)'
                        : 'rgba(10, 22, 40, 0.6)',
                    border: `1px solid ${
                      scheme.id === currentSchemeId
                        ? 'rgba(0, 212, 255, 0.5)'
                        : scheme.id === compareSchemeId
                        ? 'rgba(255, 215, 0, 0.5)'
                        : 'rgba(255, 255, 255, 0.1)'
                    }`,
                  }}
                >
                  <Group justify="space-between" align="flex-start">
                    <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                      <Group gap="xs" wrap="nowrap">
                        <Text
                          size="sm"
                          fw={600}
                          c={scheme.id === currentSchemeId ? 'cyan.4' : 'white'}
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {scheme.name}
                        </Text>
                        {scheme.id === compareSchemeId && (
                          <Badge size="xs" color="yellow">
                            对比中
                          </Badge>
                        )}
                      </Group>
                      <Group gap="xs" wrap="nowrap">
                        <Badge size="xs" variant="outline" color="cyan">
                          {scheme.totalNeedles}针
                        </Badge>
                        <Badge size="xs" variant="outline" color="yellow">
                          {scheme.patternPeriod}周期
                        </Badge>
                        <Badge size="xs" variant="outline" color="red">
                          {scheme.baseTension.toFixed(0)}N
                        </Badge>
                      </Group>
                      <Text size="xs" c="dimmed">
                        更新: {formatDate(scheme.updatedAt)}
                      </Text>
                    </Stack>

                    <Menu shadow="md" width={140}>
                      <Menu.Target>
                        <ActionIcon size="sm" variant="transparent" c="dimmed">
                          <MoreHorizontal size={16} />
                        </ActionIcon>
                      </Menu.Target>

                      <Menu.Dropdown
                        style={{
                          background: '#1a2942',
                          border: '1px solid rgba(0, 212, 255, 0.3)',
                        }}
                      >
                        <Menu.Item
                          leftSection={<FolderOpen size={14} />}
                          onClick={() => loadScheme(scheme.id)}
                          disabled={scheme.id === currentSchemeId}
                        >
                          加载方案
                        </Menu.Item>
                        <Menu.Item
                          leftSection={<Edit3 size={14} />}
                          onClick={() => openSaveModal('rename', scheme)}
                        >
                          重命名
                        </Menu.Item>
                        <Menu.Item
                          leftSection={<Copy size={14} />}
                          onClick={() => handleDuplicate(scheme)}
                        >
                          复制方案
                        </Menu.Item>
                        <Menu.Item
                          leftSection={
                            scheme.id === compareSchemeId ? (
                              <Text c="dimmed" size="xs">
                                取消对比
                              </Text>
                            ) : (
                              <Text c="yellow" size="xs">
                                设为对比
                              </Text>
                            )
                          }
                          onClick={() =>
                            setCompareScheme(
                              scheme.id === compareSchemeId ? null : scheme.id
                            )
                          }
                          disabled={scheme.id === currentSchemeId}
                        >
                          {scheme.id === compareSchemeId
                            ? '取消对比'
                            : '设为对比'}
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item
                          leftSection={<Download size={14} />}
                          onClick={() => handleExport(scheme.id)}
                        >
                          导出方案
                        </Menu.Item>
                        <Menu.Item
                          leftSection={<Trash2 size={14} />}
                          c="red"
                          onClick={() => deleteScheme(scheme.id)}
                          disabled={schemes.length <= 1}
                        >
                          删除方案
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>
                </Paper>
              ))}
            </Stack>
          </ScrollArea>
        </Stack>
      </Paper>

      <Modal
        opened={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        title={
          <Group gap="xs">
            <Save size={18} color="#00d4ff" />
            <Text>
              {saveMode === 'saveCurrent'
                ? '保存当前方案'
                : saveMode === 'saveAsNew'
                ? '新建方案'
                : `重命名方案`}
            </Text>
          </Group>
        }
        centered
        styles={{
          content: {
            background: '#1a2942',
            border: '1px solid rgba(0, 212, 255, 0.3)',
          },
          header: {
            background: '#1a2942',
          },
          title: {
            color: '#fff',
          },
          close: {
            color: '#fff',
          },
        }}
      >
        <Stack gap="md" mt="sm">
          <TextInput
            label="方案名称"
            placeholder="请输入方案名称"
            value={schemeName}
            onChange={(e) => setSchemeName(e.target.value)}
            styles={{
              label: { color: '#fff', marginBottom: '4px' },
              input: {
                background: 'rgba(10, 22, 40, 0.8)',
                borderColor: 'rgba(0, 212, 255, 0.3)',
                color: '#fff',
              },
            }}
          />
          <Textarea
            label="方案描述 (可选)"
            placeholder="描述此方案的特点或用途..."
            value={schemeDescription}
            onChange={(e) => setSchemeDescription(e.target.value)}
            minRows={3}
            styles={{
              label: { color: '#fff', marginBottom: '4px' },
              input: {
                background: 'rgba(10, 22, 40, 0.8)',
                borderColor: 'rgba(0, 212, 255, 0.3)',
                color: '#fff',
              },
            }}
          />
          <Group justify="flex-end" mt="md">
            <Button
              variant="light"
              color="gray"
              onClick={() => setSaveModalOpen(false)}
            >
              取消
            </Button>
            <Button
              leftSection={<Save size={16} />}
              color="cyan"
              onClick={handleSave}
              disabled={!schemeName.trim()}
            >
              {saveMode === 'saveCurrent'
                ? '保存'
                : saveMode === 'saveAsNew'
                ? '创建'
                : '确认'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
