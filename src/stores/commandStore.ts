import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { Command } from '../types/command';
import { v4 as uuidv4 } from 'uuid';
import { exists, readTextFile, writeTextFile, mkdir, BaseDirectory } from '@tauri-apps/plugin-fs';
import { GistService } from '../services/gistService';
import { useSyncStore } from './syncStore';
import { ElMessage } from 'element-plus';

const DATA_FILENAME = 'commands.json';
const isTauri = () => typeof window !== 'undefined' && !!(window as any).__TAURI_INTERNALS__;

export const useCommandStore = defineStore('command', () => {
  const commands = ref<Command[]>([]);
  const searchQuery = ref('');
  const selectedTag = ref('');
  const sortKey = ref<'updatedAt' | 'createdAt' | 'title'>('updatedAt');
  const sortOrder = ref<'asc' | 'desc'>('desc');
  const favoritesFirst = ref(true);

  // 获取所有命令
  const allCommands = computed(() => commands.value);

  // 获取过滤后的命令
  const filteredCommands = computed(() => {
    let result = commands.value;

    // 按搜索词过滤
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      result = result.filter(cmd =>
        cmd.title.toLowerCase().includes(query) ||
        cmd.command.toLowerCase().includes(query) ||
        cmd.description.toLowerCase().includes(query)
      );
    }

    // 按标签过滤
    if (selectedTag.value) {
      result = result.filter(cmd =>
        cmd.tags.includes(selectedTag.value)
      );
    }
    // 排序：收藏优先 + 关键字段排序
    result = [...result].sort((a, b) => {
      if (favoritesFirst.value && (a.favorite ?? false) !== (b.favorite ?? false)) {
        return (a.favorite ?? false) ? -1 : 1;
      }
      let av: any;
      let bv: any;
      switch (sortKey.value) {
        case 'title':
          av = a.title.toLowerCase();
          bv = b.title.toLowerCase();
          return sortOrder.value === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
        case 'createdAt':
          av = a.createdAt?.getTime?.() ?? new Date(a.createdAt).getTime();
          bv = b.createdAt?.getTime?.() ?? new Date(b.createdAt).getTime();
          return sortOrder.value === 'asc' ? av - bv : bv - av;
        case 'updatedAt':
        default:
          av = a.updatedAt?.getTime?.() ?? new Date(a.updatedAt).getTime();
          bv = b.updatedAt?.getTime?.() ?? new Date(b.updatedAt).getTime();
          return sortOrder.value === 'asc' ? av - bv : bv - av;
      }
    });
    return result;
  });

  // 获取所有标签
  const allTags = computed(() => {
    const tagSet = new Set<string>();
    commands.value.forEach(cmd => {
      cmd.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet);
  });

  // 添加命令
  async function addCommand(commandData: Omit<Command, 'id' | 'createdAt' | 'updatedAt'>) {
    const newCommand: Command = {
      id: uuidv4(),
      ...commandData,
      favorite: commandData.favorite ?? false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    commands.value.push(newCommand);
    await saveData();
    return newCommand;
  }

  // 更新命令
  async function updateCommand(id: string, commandData: Partial<Omit<Command, 'id' | 'createdAt' | 'updatedAt'>>) {
    const index = commands.value.findIndex(cmd => cmd.id === id);
    if (index !== -1) {
      commands.value[index] = {
        ...commands.value[index],
        ...commandData,
        updatedAt: new Date()
      };
      await saveData();
      return commands.value[index];
    }
    return null;
  }

  // 删除命令
  async function deleteCommand(id: string) {
    const index = commands.value.findIndex(cmd => cmd.id === id);
    if (index !== -1) {
      commands.value.splice(index, 1);
      await saveData();
      return true;
    }
    return false;
  }

  async function toggleFavorite(id: string) {
    const index = commands.value.findIndex(cmd => cmd.id === id);
    if (index !== -1) {
      commands.value[index].favorite = !commands.value[index].favorite;
      commands.value[index].updatedAt = new Date();
      await saveData();
      return commands.value[index];
    }
    return null;
  }

  // 保存数据 (自动判断环境)
  async function saveData() {
    if (isTauri()) {
      try {
        // 确保目录存在
        const dirExists = await exists('', { baseDir: BaseDirectory.AppData });
        if (!dirExists) {
          await mkdir('', { baseDir: BaseDirectory.AppData, recursive: true });
        }

        await writeTextFile(DATA_FILENAME, JSON.stringify(commands.value, null, 2), {
          baseDir: BaseDirectory.AppData
        });
      } catch (err) {
        console.error('Failed to save to file:', err);
      }
    } else {
      localStorage.setItem('sniptnote-commands', JSON.stringify(commands.value));
    }

    // 如果启用了自动同步，则同步到 Gist
    const syncStore = useSyncStore();
    if (syncStore.enabled && syncStore.autoSync && syncStore.token) {
      syncToGist().catch(err => {
        console.error('Auto sync failed:', err);
        // 静默失败，不阻塞用户操作
      });
    }
  }

  // 加载数据 (自动判断环境 + 迁移逻辑)
  async function loadData() {
    if (isTauri()) {
      try {
        const fileExists = await exists(DATA_FILENAME, { baseDir: BaseDirectory.AppData });
        if (fileExists) {
          const content = await readTextFile(DATA_FILENAME, { baseDir: BaseDirectory.AppData });
          parseAndSetCommands(content);
        } else {
          console.log('Local file not found, checking localStorage for migration...');
          const localData = localStorage.getItem('sniptnote-commands');
          if (localData) {
            parseAndSetCommands(localData);
            await saveData(); // 迁移后保存到文件
            console.log('Migrated data from localStorage to file.');
          }
        }
      } catch (err) {
        console.error('Failed to load from file:', err);
      }
    } else {
      const storedCommands = localStorage.getItem('sniptnote-commands');
      if (storedCommands) {
        parseAndSetCommands(storedCommands);
      }
    }
  }

  function parseAndSetCommands(jsonString: string) {
    try {
      const parsedCommands = JSON.parse(jsonString);
      commands.value = parsedCommands.map((cmd: any) => ({
        ...cmd,
        favorite: !!cmd.favorite,
        createdAt: new Date(cmd.createdAt),
        updatedAt: new Date(cmd.updatedAt)
      }));
    } catch (error) {
      console.error('Failed to parse commands:', error);
    }
  }

  // 设置搜索查询
  function setSearchQuery(query: string) {
    searchQuery.value = query;
  }

  // 设置选中的标签
  function setSelectedTag(tag: string) {
    selectedTag.value = tag;
  }

  function setSortKey(key: 'updatedAt' | 'createdAt' | 'title') {
    sortKey.value = key;
  }

  function setSortOrder(order: 'asc' | 'desc') {
    sortOrder.value = order;
  }

  function setFavoritesFirst(val: boolean) {
    favoritesFirst.value = val;
  }

  /**
   * 同步数据到 GitHub Gist
   */
  async function syncToGist(): Promise<void> {
    const syncStore = useSyncStore();
    
    if (!syncStore.enabled || !syncStore.token) {
      throw new Error('同步未启用或未配置 Token');
    }

    syncStore.setSyncStatus('syncing');
    syncStore.clearSyncError();

    try {
      const dataStr = JSON.stringify(commands.value, null, 2);
      const config = syncStore.getGistConfig();

      if (syncStore.gistId) {
        // 更新现有 Gist
        await GistService.updateGist(syncStore.gistId, dataStr, config);
      } else {
        // 创建新 Gist
        const newGistId = await GistService.createGist(dataStr, config);
        await syncStore.setGistId(newGistId);
      }

      syncStore.updateLastSyncAt();
      syncStore.setSyncStatus('success');
    } catch (error: any) {
      const errorMessage = error.message || '同步失败';
      syncStore.setSyncStatus('error', errorMessage);
      throw error;
    }
  }

  /**
   * 从 GitHub Gist 拉取数据
   */
  async function pullFromGist(): Promise<{ merged: boolean; conflict: boolean }> {
    const syncStore = useSyncStore();
    
    if (!syncStore.enabled || !syncStore.token || !syncStore.gistId) {
      throw new Error('同步未启用或未配置 Gist ID');
    }

    syncStore.setSyncStatus('syncing');
    syncStore.clearSyncError();

    try {
      const config = syncStore.getGistConfig();
      const remoteDataStr = await GistService.getGist(syncStore.gistId, config);
      const remoteCommands: Command[] = JSON.parse(remoteDataStr).map((cmd: any) => ({
        ...cmd,
        favorite: !!cmd.favorite,
        createdAt: new Date(cmd.createdAt),
        updatedAt: new Date(cmd.updatedAt)
      }));

      // 检查是否有冲突
      const remoteUpdatedAt = await GistService.getGistUpdatedAt(syncStore.gistId, config);
      const localUpdatedAt = syncStore.lastSyncAt;
      
      let conflict = false;
      if (localUpdatedAt && new Date(remoteUpdatedAt) > new Date(localUpdatedAt)) {
        // 远程更新，检查本地是否有未同步的更改
        const localLastCommand = commands.value.length > 0 
          ? commands.value.reduce((latest, cmd) => {
              const cmdTime = new Date(cmd.updatedAt).getTime();
              const latestTime = new Date(latest.updatedAt).getTime();
              return cmdTime > latestTime ? cmd : latest;
            })
          : null;
        
        if (localLastCommand && new Date(localLastCommand.updatedAt) > new Date(localUpdatedAt)) {
          conflict = true;
        }
      }

      if (conflict) {
        // 有冲突，返回需要用户处理
        syncStore.setSyncStatus('idle');
        return { merged: false, conflict: true };
      }

      // 合并数据：以远程为主，保留本地新增的（通过 ID 判断）
      const remoteIds = new Set(remoteCommands.map(cmd => cmd.id));
      const localOnly = commands.value.filter(cmd => !remoteIds.has(cmd.id));
      commands.value = [...remoteCommands, ...localOnly];
      
      await saveData();
      syncStore.updateLastSyncAt();
      syncStore.setSyncStatus('success');
      
      return { merged: true, conflict: false };
    } catch (error: any) {
      const errorMessage = error.message || '拉取失败';
      syncStore.setSyncStatus('error', errorMessage);
      throw error;
    }
  }

  /**
   * 手动同步（上传）
   */
  async function manualSync(): Promise<void> {
    try {
      await syncToGist();
      ElMessage.success('同步成功');
    } catch (error: any) {
      ElMessage.error(`同步失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 手动拉取（下载）
   */
  async function manualPull(): Promise<{ merged: boolean; conflict: boolean }> {
    try {
      const result = await pullFromGist();
      if (result.conflict) {
        ElMessage.warning('检测到冲突，请手动处理');
      } else if (result.merged) {
        ElMessage.success('拉取成功');
      }
      return result;
    } catch (error: any) {
      ElMessage.error(`拉取失败: ${error.message}`);
      throw error;
    }
  }

  // 初始化时加载数据 - 移除自动调用，改为在 App.vue 中调用
  // loadFromLocalStorage();

  return {
    commands,
    allCommands,
    filteredCommands,
    allTags,
    searchQuery,
    selectedTag,
    sortKey,
    sortOrder,
    favoritesFirst,
    addCommand,
    updateCommand,
    deleteCommand,
    toggleFavorite,
    setSearchQuery,
    setSelectedTag,
    setSortKey,
    setSortOrder,
    setFavoritesFirst,
    loadData,
    saveData,
    syncToGist,
    pullFromGist,
    manualSync,
    manualPull
  };
});