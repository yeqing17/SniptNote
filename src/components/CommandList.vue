<script setup lang="ts">
import { ref, computed } from 'vue';
import { useCommandStore } from '../stores/commandStore';
import { useUiStore } from '../stores/uiStore';
import { Command } from '../types/command';
import { ElMessage } from 'element-plus';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import 'highlight.js/styles/github.css';
hljs.registerLanguage('bash', bash);

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

// Markdown 渲染器（启用自动链接、换行；禁用原生 HTML）并集成代码高亮
const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
  highlight: (str: string, lang?: string): string => {
    const escapeHtml = (s: string) =>
      s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    try {
      if (lang && hljs.getLanguage(lang)) {
        return (
          `<pre><code class="hljs language-${lang}">` +
          hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
          '</code></pre>'
        );
      }
      return (
        '<pre><code class="hljs">' +
        hljs.highlightAuto(str).value +
        '</code></pre>'
      );
    } catch (_) {
      return '<pre><code class="hljs">' + escapeHtml(str) + '</code></pre>';
    }
  }
});

function renderMarkdown(text?: string) {
  return md.render(text || '');
}

function highlightCode(text?: string, lang?: string) {
  try {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(text || '', { language: lang, ignoreIllegals: true }).value;
    }
    return hljs.highlightAuto(text || '').value;
  } catch (_) {
    return md.utils.escapeHtml(text || '');
  }
}

// 设置搜索查询
function handleSearch() {
  commandStore.setSearchQuery(searchQuery.value);
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
            <div class="markdown" v-html="renderMarkdown(command.description)"></div>
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
  max-width: 800px;
  margin: 0 auto;
  padding: 10px;
}

.filter-section {
  margin-bottom: 10px;
}

.tag-filter {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-item {
  cursor: pointer;
}

.sort-row {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.sort-control { min-width: 120px; }

/* 卡片与内容更紧凑 */
.command-card { margin-bottom: 8px; }
.card-header h3 { font-size: 1rem; margin: 0; }
.card-actions { display: flex; gap: 6px; }
.command-content { display: grid; grid-template-columns: 1fr; gap: 6px; }
.command-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.command-code pre { padding: 8px; margin: 0; }
.markdown h1, .markdown h2, .markdown h3 { margin: 0 0 6px; }
.markdown p { margin: 0; }
.markdown code { padding: 2px 3px; }

/* 收紧 Element Plus 卡片内边距 */
:deep(.el-card__header) { padding: 8px 10px; }
:deep(.el-card__body) { padding: 10px; }

.commands-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.command-card {
  margin-bottom: 4px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
}

.card-actions {
  display: flex;
  gap: 4px;
}

.command-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.command-code {
  font-family: monospace;
  background-color: #f5f7fa;
  border-radius: 4px;
}
.command-code pre {
  margin: 0;
  padding: 6px;
  overflow: auto;
}
.markdown :where(h1, h2, h3) { margin: 0 0 4px; }
.markdown p { margin: 0; white-space: pre-wrap; }
.markdown code { background: #f5f7fa; border-radius: 4px; padding: 2px 4px; }

.command-description {
  color: #606266;
}

.command-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* 超紧凑模式（进一步缩小间距与控件尺寸） */
/* 已移除超紧凑模式：保留常规紧凑样式与单行模式 */

/* 单行模式：卡片主体更薄，去掉额外内容 */
.single-line :deep(.el-card__body) { padding: 4px 8px; }

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .card-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>