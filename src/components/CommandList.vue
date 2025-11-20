<script setup lang="ts">
import { ref, computed } from 'vue';
import { useCommandStore } from '../stores/commandStore';
import { useUiStore } from '../stores/uiStore';
import { Command } from '../types/command';
import { ElMessage } from 'element-plus';
import MarkdownRenderer from './MarkdownRenderer.vue';
import { highlightCode } from '../utils/markdown';

const commandStore = useCommandStore();
const ui = useUiStore();
const searchQuery = ref('');
const selectedTag = ref('');
// 直接使用 store 的响应式字段，避免二次 Ref 包裹造成绑定异常
const sortKey = commandStore.sortKey;
const sortOrder = commandStore.sortOrder;
const favoritesFirst = commandStore.favoritesFirst;

// 计算属性：过滤后的命令列表
const filteredCommands = computed(() => {
  return commandStore.filteredCommands;
});

// 计算属性：所有标签
const allTags = computed(() => {
  return commandStore.allTags;
});

// 搜索防抖
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// 设置搜索查询
function handleSearch() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    commandStore.setSearchQuery(searchQuery.value);
  }, 300);
}

// 设置标签过滤
function handleTagSelect(tag: string) {
  selectedTag.value = tag;
  commandStore.setSelectedTag(tag);
}

// 清除过滤
function clearFilters() {
  searchQuery.value = '';
  selectedTag.value = '';
  commandStore.setSearchQuery('');
  commandStore.setSelectedTag('');
}

// 排序与收藏优先
// 使用 v-model 直接双向绑定，无需额外 change 处理

// 复制命令到剪贴板
async function copyToClipboard(command: string) {
  try {
    await navigator.clipboard.writeText(command);
    ElMessage.success('命令已复制到剪贴板');
  } catch (error) {
    console.error('复制失败:', error);
    ElMessage.error('复制失败');
  }
}

// 删除命令
function deleteCommand(id: string) {
  commandStore.deleteCommand(id);
  ElMessage.success('命令已删除');
}

// 编辑命令（将在父组件中实现）
const emit = defineEmits(['edit-command']);
function editCommand(command: Command) {
  emit('edit-command', command);
}

function toggleFavorite(command: Command) {
  commandStore.toggleFavorite(command.id);
}
</script>

<template>
  <div class="command-list-container" :class="{ 'single-line': ui.singleLineMode }">
    <!-- 搜索和过滤区域 -->
    <div class="filter-section">
      <el-input
        v-model="searchQuery"
        placeholder="搜索命令..."
        clearable
        @input="handleSearch"
        @clear="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      
      <div class="tag-filter">
        <el-tag 
          v-for="tag in allTags" 
          :key="tag"
          :type="selectedTag === tag ? 'primary' : 'info'"
          effect="light"
          class="tag-item"
          @click="handleTagSelect(tag)"
        >
          {{ tag }}
        </el-tag>
        <el-button v-if="selectedTag || searchQuery" size="small" @click="clearFilters">
          清除过滤
        </el-button>
      </div>

      <div class="sort-row">
        <el-select v-model="sortKey" size="small" class="sort-control" style="width:140px">
          <el-option label="按更新时间" value="updatedAt" />
          <el-option label="按创建时间" value="createdAt" />
          <el-option label="按标题" value="title" />
        </el-select>
        <el-radio-group v-model="sortOrder" size="small">
          <el-radio-button label="desc">降序</el-radio-button>
          <el-radio-button label="asc">升序</el-radio-button>
        </el-radio-group>
        <el-switch v-model="favoritesFirst" active-text="收藏优先" />
      </div>
    </div>
    
    <!-- 命令列表 -->
    <div class="commands-section">
      <el-empty v-if="filteredCommands.length === 0" description="没有找到命令" />
      
      <el-card v-for="command in filteredCommands" :key="command.id" class="command-card">
        <template #header>
          <div class="card-header">
            <h3>{{ command.title }}</h3>
            <div class="card-actions">
              <el-button :type="command.favorite ? 'warning' : 'default'" size="small" @click="toggleFavorite(command)">
                <el-icon><StarFilled /></el-icon> {{ command.favorite ? '已收藏' : '收藏' }}
              </el-button>
              <el-button type="primary" size="small" @click="copyToClipboard(command.command)">
                <el-icon><DocumentCopy /></el-icon> 复制
              </el-button>
              <el-button type="info" size="small" @click="editCommand(command)">
                <el-icon><Edit /></el-icon> 编辑
              </el-button>
              <el-button type="danger" size="small" @click="deleteCommand(command.id)">
                <el-icon><Delete /></el-icon> 删除
              </el-button>
            </div>
          </div>
        </template>
        
        <div class="command-content" v-if="!ui.singleLineMode">
        <div class="command-code">
            <pre><code class="hljs language-bash" v-html="highlightCode(command.command, 'bash')"></code></pre>
          </div>
          
          <div class="command-description" v-if="ui.showDescriptions">
            <MarkdownRenderer :source="command.description" class="markdown" />
          </div>
          
          <div class="command-tags">
            <el-tag 
              v-for="tag in command.tags" 
              :key="tag"
              size="small"
              effect="plain"
              class="tag-item"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.command-list-container {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.filter-section {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tag-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  cursor: pointer;
  transition: all 0.2s;
}
.tag-item:hover {
  transform: translateY(-1px);
}

.sort-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* --- 卡片样式重构 --- */
.command-card {
  margin-bottom: 16px;
  border: none !important; /* 移除默认边框 */
  background-color: var(--el-bg-color-overlay);
  box-shadow: var(--shadow); /* 使用自定义阴影 */
  transition: transform 0.2s, box-shadow 0.2s;
}

.command-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}

/* 标题区域 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0;
}

.card-header h3 {
  margin: 0;
  font-size: 1.125rem; /* 18px */
  font-weight: 600;
  color: var(--el-text-color-primary);
  letter-spacing: -0.025em;
}

.card-actions {
  display: flex;
  gap: 8px;
  opacity: 0.8;
  transition: opacity 0.2s;
}
.command-card:hover .card-actions {
  opacity: 1;
}

/* 内容区域 */
.command-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 代码块样式 */
.command-code {
  background-color: var(--el-fill-color-light); /* 使用新的代码背景变量 */
  border-radius: 8px;
  border: 1px solid var(--el-border-color-light);
  overflow: hidden;
}

.command-code pre {
  margin: 0;
  padding: 12px 16px;
  overflow-x: auto;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--el-text-color-regular);
}

/* 标签区域 */
.command-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

/* 调整 Element Plus 卡片内边距 */
:deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color-light);
}
:deep(.el-card__body) {
  padding: 16px 20px;
}

/* 单行模式优化 */
.single-line :deep(.el-card__body) {
  padding: 8px 20px;
}
.single-line .card-header h3 {
  font-size: 1rem;
}

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .card-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>