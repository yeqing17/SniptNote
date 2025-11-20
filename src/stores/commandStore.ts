import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { Command } from '../types/command';
import { v4 as uuidv4 } from 'uuid';
import { exists, readTextFile, writeTextFile, mkdir, BaseDirectory } from '@tauri-apps/plugin-fs';

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
    saveData
  };
});