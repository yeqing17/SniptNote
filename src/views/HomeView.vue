<script setup lang="ts">
import { ref } from 'vue';
import CommandList from '../components/CommandList.vue';
import CommandForm from '../components/CommandForm.vue';
import { Command } from '../types/command';
import { useUiStore } from '../stores/uiStore';
import { useCommandStore } from '../stores/commandStore';
import { ElMessage } from 'element-plus';
import { save, open } from '@tauri-apps/plugin-dialog';
import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs';

// 控制表单显示状态
const showForm = ref(false);
// 控制是否为编辑模式
const editMode = ref(false);
// 当前编辑的命令
const currentCommand = ref<Command | undefined>();

// UI 与命令 store
const ui = useUiStore();
const commandStore = useCommandStore();

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
  const pad = (n: number) => String(n).padStart(2, '0');
  const name = `${prefix}-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}.json`;
  return name;
}

// 导出命令为 JSON 文件
async function exportCommands() {
  try {
    const dataStr = JSON.stringify(commandStore.commands, null, 2);
    // 优先尝试 Tauri 原生保存（桌面程序）；失败则回退到浏览器下载
    const def = buildTimestampedName('sniptnote-commands');
    try {
      const filePath = await save({
        defaultPath: def,
        filters: [{ name: 'JSON', extensions: ['json'] }]
      });
      if (filePath) {
        await writeTextFile(filePath as string, dataStr);
        ElMessage.success(`导出成功：${filePath}`);
        return;
      } else {
        ElMessage.info('已取消导出');
        return;
      }
    } catch (tauriErr) {
      // ignore and fallback
      console.warn('Tauri 保存失败，回退浏览器下载', tauriErr);
    }

    // 浏览器环境：触发下载
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = def;
    a.click();
    URL.revokeObjectURL(url);
    ElMessage.success('导出成功（浏览器下载）');
  } catch (e) {
    console.error('导出失败', e);
    ElMessage.error('导出失败');
  }
}

// 导入命令（更健壮的合并逻辑）
function mergeImportedList(parsed: any): { added: number; duplicates: number; invalid: number } {
  const list = Array.isArray(parsed)
    ? parsed
    : (parsed && Array.isArray(parsed.commands))
      ? parsed.commands
      : [];
  let added = 0;
  let duplicates = 0;
  let invalid = 0;
  list.forEach((item: any) => {
    const title = String(item.title ?? item.name ?? '').trim();
    const command = String(item.command ?? item.cmd ?? item.shell ?? '').trim();
    if (!command) { invalid++; return; }
    // 以 command 去重更稳妥（标题可能微调）
    const exists = commandStore.commands.some(c => c.command.trim() === command);
    if (exists) { duplicates++; return; }
    commandStore.addCommand({
      title: title || '未命名',
      command,
      description: String(item.description ?? item.desc ?? ''),
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
      const file = await open({ multiple: false, filters: [{ name: 'JSON', extensions: ['json'] }] });
      if (!file) return;
      const content = await readTextFile(file as string);
      const parsed = JSON.parse(content);
      const { added, duplicates, invalid } = mergeImportedList(parsed);
      if (added > 0) {
        ElMessage.success(`导入成功：新增 ${added} 条，重复 ${duplicates} 条，无效 ${invalid} 条`);
      } else {
        ElMessage.warning('未导入任何记录：文件为空、格式不正确或均为重复');
      }
      return;
    } catch (tauriErr) {
      console.warn('Tauri 打开失败，回退浏览器选择', tauriErr);
    }

    const input = document.getElementById('import-file') as HTMLInputElement | null;
    input?.click();
  } catch (e) {
    console.error('导入失败', e);
    ElMessage.error('导入失败');
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
        ElMessage.success(`导入成功：新增 ${added} 条，重复 ${duplicates} 条，无效 ${invalid} 条`);
      } else {
        ElMessage.warning('未导入任何记录：文件为空、格式不正确或均为重复');
      }
    } catch (e) {
      console.error('导入失败', e);
      ElMessage.error('导入失败');
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
        <el-select v-model="ui.theme" size="small" placeholder="主题" @change="ui.applyTheme()" style="width: 140px; margin-left: 8px">
          <el-option v-for="t in ui.availableThemes" :key="t" :label="t" :value="t" />
        </el-select>
        <input id="import-file" type="file" accept="application/json" style="display:none" @change="importCommands" />
        <el-button @click="triggerImport" class="action-btn" type="info">
          <el-icon><FolderOpened /></el-icon> 导入
        </el-button>
        <el-button @click="exportCommands" class="action-btn" type="success">
          <el-icon><Download /></el-icon> 导出
        </el-button>
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
          style="margin-left:12px"
        />
        <el-switch
          v-model="ui.singleLineMode"
          active-text="单行模式"
          inactive-text="普通模式"
          style="margin-left:8px"
        />
      </div>
      
      <el-divider v-if="!showForm" />
      
      <div v-if="showForm" class="form-container">
        <h2>{{ editMode ? '编辑命令' : '添加新命令' }}</h2>
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
  </div>
</template>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 12px;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  margin-bottom: 12px;
}

.header-left { display: flex; align-items: center; gap: 8px; }
.logo { width: 28px; height: 28px; }
.app-header h1 { font-size: 1.4rem; margin: 0; }
.app-header .action-btn { margin-left: 6px; }

.actions-bar {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}

.form-container { border-radius: 12px; padding: 12px; background: var(--card); border: 1px solid var(--border); max-width: 800px; margin: 0 auto 16px; }
.form-container h2 { margin-top: 0; margin-bottom: 8px; color: var(--text); text-align: center; }
.list-container { margin-top: 8px; max-width: 800px; margin-left: auto; margin-right: auto; }

@media (max-width: 768px) {
  .home-container { padding: 10px; }
}
</style>