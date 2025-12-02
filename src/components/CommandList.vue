<script setup lang="ts">
import { ref, computed } from "vue";
import { useCommandStore } from "../stores/commandStore";
import { useUiStore } from "../stores/uiStore";
import { Command } from "../types/command";
import { ElMessage } from "element-plus";
import MarkdownRenderer from "./MarkdownRenderer.vue";
import { highlightCode } from "../utils/markdown";

const commandStore = useCommandStore();
const ui = useUiStore();
const searchQuery = ref("");
const selectedTag = ref("");

// 使用计算属性来正确绑定 store 的响应式字段
const sortKey = computed({
  get: () => commandStore.sortKey,
  set: (val) => commandStore.setSortKey(val),
});

const sortOrder = computed({
  get: () => commandStore.sortOrder,
  set: (val) => commandStore.setSortOrder(val),
});

const favoritesFirst = computed({
  get: () => commandStore.favoritesFirst,
  set: (val) => commandStore.setFavoritesFirst(val),
});

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
  searchQuery.value = "";
  selectedTag.value = "";
  commandStore.setSearchQuery("");
  commandStore.setSelectedTag("");
}

// 排序与收藏优先
// 使用 v-model 直接双向绑定，无需额外 change 处理

// 复制命令到剪贴板
async function copyToClipboard(command: string) {
  try {
    await navigator.clipboard.writeText(command);
    ElMessage.success("命令已复制到剪贴板");
  } catch (error) {
    console.error("复制失败:", error);
    ElMessage.error("复制失败");
  }
}

// 删除命令
function deleteCommand(id: string) {
  commandStore.deleteCommand(id);
  ElMessage.success("命令已删除");
}

// 编辑命令（将在父组件中实现）
const emit = defineEmits(["edit-command"]);
function editCommand(command: Command) {
  emit("edit-command", command);
}

function toggleFavorite(command: Command) {
  commandStore.toggleFavorite(command.id);
}
</script>

<template>
  <div
    class="command-list-container"
    :class="{ 'single-line': ui.singleLineMode }"
  >
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
        <el-button
          v-if="selectedTag || searchQuery"
          size="small"
          @click="clearFilters"
        >
          清除过滤
        </el-button>
      </div>

      <div class="sort-row">
        <el-select
          v-model="sortKey"
          size="small"
          class="sort-control"
          style="width: 140px"
        >
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
      <el-empty
        v-if="filteredCommands.length === 0"
        description="没有找到命令"
      />

      <el-card
        v-for="command in filteredCommands"
        :key="command.id"
        class="command-card"
      >
        <template #header>
          <div class="card-header">
            <h3>{{ command.title }}</h3>
            <div class="card-actions">
              <el-button
                :type="command.favorite ? 'warning' : 'default'"
                size="small"
                @click="toggleFavorite(command)"
              >
                <el-icon><StarFilled /></el-icon>
                {{ command.favorite ? "已收藏" : "收藏" }}
              </el-button>
              <el-button
                type="primary"
                size="small"
                @click="copyToClipboard(command.command)"
              >
                <el-icon><DocumentCopy /></el-icon> 复制
              </el-button>
              <el-button type="info" size="small" @click="editCommand(command)">
                <el-icon><Edit /></el-icon> 编辑
              </el-button>
              <el-button
                type="danger"
                size="small"
                @click="deleteCommand(command.id)"
              >
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
  padding: 16px;
}

.filter-section {
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background: var(--card-bg);
  border-radius: 16px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
}

.tag-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.tag-item {
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.tag-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.sort-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding-top: 8px;
  border-top: 1px solid var(--border);
}

/* --- 命令列表区域 --- */
.commands-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* --- 卡片样式重构 --- */
.command-card {
  border: 1px solid var(--border) !important;
  background-color: var(--card-bg);
  box-shadow: var(--shadow);
  transition: all 0.3s ease;
  animation: cardFadeIn 0.4s ease;
}

@keyframes cardFadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.command-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.15);
  border-color: var(--primary);
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
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-main);
  letter-spacing: -0.025em;
  transition: color 0.2s ease;
}

.command-card:hover .card-header h3 {
  color: var(--primary);
}

.card-actions {
  display: flex;
  gap: 8px;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.command-card:hover .card-actions {
  opacity: 1;
}

/* 内容区域 */
.command-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 代码块样式 */
.command-code {
  background-color: var(--code-bg);
  border-radius: 12px;
  border: 1px solid var(--border);
  overflow: hidden;
  position: relative;
}

.command-code::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--code-gradient);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.command-card:hover .command-code::before {
  opacity: 1;
}

.command-code pre {
  margin: 0;
  padding: 16px 20px;
  overflow-x: auto;
  font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--text-main);
}

/* 描述区域 */
.command-description {
  padding: 12px 16px;
  background: var(--bg);
  border-radius: 10px;
  border-left: 3px solid var(--primary);
}

/* 标签区域 */
.command-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.command-tags .tag-item {
  font-size: 0.75rem;
  padding: 4px 10px;
}

/* 调整 Element Plus 卡片内边距 */
:deep(.el-card__header) {
  padding: 18px 24px;
  border-bottom: 1px solid var(--border);
  background: transparent;
}

:deep(.el-card__body) {
  padding: 20px 24px;
}

/* 空状态美化 */
:deep(.el-empty) {
  padding: 60px 20px;
}

:deep(.el-empty__description) {
  color: var(--text-muted);
  font-size: 1rem;
}

/* 单行模式优化 */
.single-line .command-card {
  margin-bottom: 8px;
}

.single-line :deep(.el-card__header) {
  padding: 12px 20px;
  border-bottom: none;
}

.single-line :deep(.el-card__body) {
  display: none;
}

.single-line .card-header h3 {
  font-size: 0.95rem;
}

.single-line .card-actions {
  opacity: 1;
}

/* 搜索框美化 */
:deep(.el-input__wrapper) {
  padding: 8px 16px;
}

:deep(.el-input__prefix) {
  color: var(--text-muted);
}

@media (max-width: 768px) {
  .command-list-container {
    padding: 12px;
  }

  .filter-section {
    padding: 16px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .card-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .sort-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
