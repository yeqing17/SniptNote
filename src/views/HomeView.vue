<script setup lang="ts">
import { ref } from "vue";
import CommandList from "../components/CommandList.vue";
import CommandForm from "../components/CommandForm.vue";
import SyncSettings from "../components/SyncSettings.vue";
import { Command } from "../types/command";
import { useUiStore } from "../stores/uiStore";
import { useCommandStore } from "../stores/commandStore";
import { useSyncStore } from "../stores/syncStore";
import { ElMessage } from "element-plus";
import { save, open } from "@tauri-apps/plugin-dialog";
import { writeTextFile, readTextFile } from "@tauri-apps/plugin-fs";

// 控制表单显示状态
const showForm = ref(false);
// 控制是否为编辑模式
const editMode = ref(false);
// 当前编辑的命令
const currentCommand = ref<Command | undefined>();

// UI 与命令 store
const ui = useUiStore();
const commandStore = useCommandStore();
const syncStore = useSyncStore();

// 同步设置对话框
const showSyncSettings = ref(false);

// 同步状态图标 - 暂时使用固定图标，避免图标名称问题
// const syncStatusIcon = computed(() => {
//   switch (syncStore.syncStatus) {
//     case 'syncing':
//       return 'Loading';
//     case 'success':
//       return 'Check';
//     case 'error':
//       return 'Close';
//     default:
//       return 'Upload';
//   }
// });

// syncStatusColor 已移除，改用 CSS 类控制样式

// 显示添加表单
function showAddForm() {
  editMode.value = false;
  currentCommand.value = undefined;
  showForm.value = true;
}

// 显示编辑表单
function showEditForm(command: Command) {
  editMode.value = true;
  currentCommand.value = command;
  showForm.value = true;
}

// 表单提交后处理
function handleFormSubmitted() {
  showForm.value = false;
}

// 取消表单
function handleCancel() {
  showForm.value = false;
}

// 若可用，静态导入 Tauri API（避免 Vite 动态导入解析问题）
// 生成带到秒的安全文件名（避免 Windows 不允许的冒号）
function buildTimestampedName(prefix: string) {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const name = `${prefix}-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}.json`;
  return name;
}

// 导出命令为 JSON 文件
async function exportCommands() {
  try {
    const dataStr = JSON.stringify(commandStore.commands, null, 2);
    // 优先尝试 Tauri 原生保存（桌面程序）；失败则回退到浏览器下载
    const def = buildTimestampedName("sniptnote-commands");
    try {
      const filePath = await save({
        defaultPath: def,
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (filePath) {
        await writeTextFile(filePath as string, dataStr);
        ElMessage.success(`导出成功：${filePath}`);
        return;
      } else {
        ElMessage.info("已取消导出");
        return;
      }
    } catch (tauriErr) {
      // ignore and fallback
      console.warn("Tauri 保存失败，回退浏览器下载", tauriErr);
    }

    // 浏览器环境：触发下载
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = def;
    a.click();
    URL.revokeObjectURL(url);
    ElMessage.success("导出成功（浏览器下载）");
  } catch (e) {
    console.error("导出失败", e);
    ElMessage.error("导出失败");
  }
}

// 导入命令（更健壮的合并逻辑）
function mergeImportedList(parsed: any): {
  added: number;
  duplicates: number;
  invalid: number;
} {
  const list = Array.isArray(parsed)
    ? parsed
    : parsed && Array.isArray(parsed.commands)
    ? parsed.commands
    : [];
  let added = 0;
  let duplicates = 0;
  let invalid = 0;
  list.forEach((item: any) => {
    const title = String(item.title ?? item.name ?? "").trim();
    const command = String(item.command ?? item.cmd ?? item.shell ?? "").trim();
    if (!command) {
      invalid++;
      return;
    }
    // 以 command 去重更稳妥（标题可能微调）
    const exists = commandStore.commands.some(
      (c) => c.command.trim() === command
    );
    if (exists) {
      duplicates++;
      return;
    }
    commandStore.addCommand({
      title: title || "未命名",
      command,
      description: String(item.description ?? item.desc ?? ""),
      tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
      favorite: !!item.favorite,
    });
    added++;
  });
  return { added, duplicates, invalid };
}

async function triggerImport() {
  try {
    // 优先尝试 Tauri 原生打开（桌面程序）；失败则回退到浏览器文件选择
    try {
      const file = await open({
        multiple: false,
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (!file) return;
      const content = await readTextFile(file as string);
      const parsed = JSON.parse(content);
      const { added, duplicates, invalid } = mergeImportedList(parsed);
      if (added > 0) {
        ElMessage.success(
          `导入成功：新增 ${added} 条，重复 ${duplicates} 条，无效 ${invalid} 条`
        );
      } else {
        ElMessage.warning("未导入任何记录：文件为空、格式不正确或均为重复");
      }
      return;
    } catch (tauriErr) {
      console.warn("Tauri 打开失败，回退浏览器选择", tauriErr);
    }

    const input = document.getElementById(
      "import-file"
    ) as HTMLInputElement | null;
    input?.click();
  } catch (e) {
    console.error("导入失败", e);
    ElMessage.error("导入失败");
  }
}

function importCommands(ev: Event) {
  const input = ev.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const { added, duplicates, invalid } = mergeImportedList(parsed);
      if (added > 0) {
        ElMessage.success(
          `导入成功：新增 ${added} 条，重复 ${duplicates} 条，无效 ${invalid} 条`
        );
      } else {
        ElMessage.warning("未导入任何记录：文件为空、格式不正确或均为重复");
      }
    } catch (e) {
      console.error("导入失败", e);
      ElMessage.error("导入失败");
    }
  };
  reader.readAsText(file);
}
</script>

<template>
  <div class="home-container">
    <header class="app-header card">
      <div class="header-left">
        <img src="/tauri.svg" alt="logo" class="logo" />
        <div>
          <h1>SniptNote</h1>
          <p class="muted">存储和管理您的常用命令</p>
        </div>
      </div>
      <div class="header-right">
        <el-tooltip content="主题切换" placement="bottom">
          <el-button circle @click="ui.toggleTheme()">
            <el-icon v-if="ui.theme === 'dark'"><Moon /></el-icon>
            <el-icon v-else><Sunny /></el-icon>
          </el-button>
        </el-tooltip>
        <el-select
          v-model="ui.theme"
          size="small"
          placeholder="主题"
          @change="ui.applyTheme()"
          style="width: 140px; margin-left: 8px"
        >
          <el-option
            v-for="t in ui.availableThemes"
            :key="t"
            :label="t"
            :value="t"
          />
        </el-select>
        <input
          id="import-file"
          type="file"
          accept="application/json"
          style="display: none"
          @change="importCommands"
        />
        <el-button @click="triggerImport" class="action-btn theme-btn">
          <el-icon><FolderOpened /></el-icon> 导入
        </el-button>
        <el-button @click="exportCommands" class="action-btn theme-btn-alt">
          <el-icon><Download /></el-icon> 导出
        </el-button>
        <el-tooltip
          :content="
            syncStore.enabled
              ? syncStore.syncStatus === 'syncing'
                ? '同步中...'
                : syncStore.syncError || '已启用同步'
              : '未启用同步'
          "
          placement="bottom"
        >
          <el-button
            circle
            @click="showSyncSettings = true"
            class="sync-btn"
            :class="{
              'sync-enabled': syncStore.enabled,
              'sync-error': syncStore.syncStatus === 'error',
              'sync-spinning': syncStore.syncStatus === 'syncing',
            }"
          >
            <el-icon>
              <Refresh />
            </el-icon>
          </el-button>
        </el-tooltip>
      </div>
    </header>

    <main class="main-content">
      <div class="actions-bar">
        <el-button type="primary" @click="showAddForm" v-if="!showForm">
          <el-icon><Plus /></el-icon> 添加命令
        </el-button>
        <el-switch
          v-model="ui.showDescriptions"
          active-text="显示简介"
          inactive-text="隐藏简介"
          style="margin-left: 12px"
        />
        <el-switch
          v-model="ui.singleLineMode"
          active-text="单行模式"
          inactive-text="普通模式"
          style="margin-left: 8px"
        />
      </div>

      <el-divider v-if="!showForm" />

      <div v-if="showForm" class="form-container">
        <h2>{{ editMode ? "编辑命令" : "添加新命令" }}</h2>
        <CommandForm
          :edit-mode="editMode"
          :command-to-edit="currentCommand"
          @form-submitted="handleFormSubmitted"
          @cancel="handleCancel"
        />
      </div>

      <div v-else class="list-container">
        <CommandList @edit-command="showEditForm" />
      </div>
    </main>

    <!-- 同步设置对话框 -->
    <SyncSettings v-model="showSyncSettings" />
  </div>
</template>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 20px;
  animation: fadeIn 0.4s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  margin-bottom: 20px;
  background: var(--card-bg);
  border-radius: 16px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  width: 36px;
  height: 36px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  transition: transform 0.3s ease;
}

.logo:hover {
  transform: rotate(10deg) scale(1.1);
}

.app-header h1 {
  font-size: 1.5rem;
  margin: 0;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary), #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.app-header .muted {
  margin: 2px 0 0 0;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.app-header .action-btn {
  margin-left: 4px;
  font-weight: 500;
}

/* 主题适配按钮 */
.theme-btn {
  background: var(--primary) !important;
  border-color: var(--primary) !important;
  color: white !important;
}

.theme-btn:hover {
  background: color-mix(in srgb, var(--primary) 85%, white) !important;
  border-color: color-mix(in srgb, var(--primary) 85%, white) !important;
}

.theme-btn-alt {
  background: color-mix(in srgb, var(--primary) 70%, var(--card-bg)) !important;
  border-color: var(--primary) !important;
  color: var(--text-main) !important;
}

.theme-btn-alt:hover {
  background: var(--primary) !important;
  color: white !important;
}

.actions-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  padding: 12px 20px;
  background: var(--card-bg);
  border-radius: 12px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
}

.form-container {
  border-radius: 16px;
  padding: 24px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  max-width: 800px;
  margin: 0 auto 20px;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.form-container h2 {
  margin-top: 0;
  margin-bottom: 16px;
  color: var(--text-main);
  text-align: center;
  font-weight: 600;
  font-size: 1.25rem;
}

.list-container {
  margin-top: 12px;
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
}

/* 同步按钮样式 */
.sync-btn {
  background: var(--card-bg) !important;
  border-color: var(--border) !important;
  color: var(--text-muted) !important;
  opacity: 0.6;
  transition: all 0.2s ease;
}

.sync-btn:hover {
  border-color: var(--primary) !important;
  color: var(--primary) !important;
  opacity: 1;
}

/* 同步已启用 - 高亮状态 */
.sync-btn.sync-enabled {
  background: var(--primary) !important;
  border-color: var(--primary) !important;
  color: white !important;
  opacity: 1;
}

.sync-btn.sync-enabled:hover {
  background: color-mix(in srgb, var(--primary) 85%, white) !important;
}

/* 同步出错 */
.sync-btn.sync-error {
  background: #ef4444 !important;
  border-color: #ef4444 !important;
  color: white !important;
  opacity: 1;
}

/* 同步中 - 图标旋转 */
.sync-btn.sync-spinning .el-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Element Plus 分割线美化 */
:deep(.el-divider) {
  margin: 16px 0;
  border-color: var(--border);
}

@media (max-width: 768px) {
  .home-container {
    padding: 12px;
  }

  .app-header {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }

  .header-right {
    flex-wrap: wrap;
    justify-content: center;
  }

  .actions-bar {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
