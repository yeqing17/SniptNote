import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { Command } from '../types/command';
import { v4 as uuidv4 } from 'uuid';

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
  function addCommand(commandData: Omit<Command, 'id' | 'createdAt' | 'updatedAt'>) {
    const newCommand: Command = {
      id: uuidv4(),
      ...commandData,
      favorite: commandData.favorite ?? false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    commands.value.push(newCommand);
    saveToLocalStorage();
    return newCommand;
  }

  // 更新命令
  function updateCommand(id: string, commandData: Partial<Omit<Command, 'id' | 'createdAt' | 'updatedAt'>>) {
    const index = commands.value.findIndex(cmd => cmd.id === id);
    if (index !== -1) {
      commands.value[index] = {
        ...commands.value[index],
        ...commandData,
        updatedAt: new Date()
      };
      saveToLocalStorage();
      return commands.value[index];
    }
    return null;
  }

  // 删除命令
  function deleteCommand(id: string) {
    const index = commands.value.findIndex(cmd => cmd.id === id);
    if (index !== -1) {
      commands.value.splice(index, 1);
      saveToLocalStorage();
      return true;
    }
    return false;
  }

  function toggleFavorite(id: string) {
    const index = commands.value.findIndex(cmd => cmd.id === id);
    if (index !== -1) {
      commands.value[index].favorite = !commands.value[index].favorite;
      commands.value[index].updatedAt = new Date();
      saveToLocalStorage();
      return commands.value[index];
    }
    return null;
  }

  // 保存到本地存储
  function saveToLocalStorage() {
    localStorage.setItem('sniptnote-commands', JSON.stringify(commands.value));
  }

  // 从本地存储加载
  function loadFromLocalStorage() {
    const storedCommands = localStorage.getItem('sniptnote-commands');
    if (storedCommands) {
      try {
        const parsedCommands = JSON.parse(storedCommands);
        // 转换日期字符串为Date对象
        commands.value = parsedCommands.map((cmd: any) => ({
          ...cmd,
          favorite: !!cmd.favorite,
          createdAt: new Date(cmd.createdAt),
          updatedAt: new Date(cmd.updatedAt)
        }));
      } catch (error) {
        console.error('Failed to parse stored commands:', error);
      }
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

  // 初始化时加载数据
  loadFromLocalStorage();

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
    setFavoritesFirst
  };
});