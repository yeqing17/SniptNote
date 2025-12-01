<template>
  <el-dialog
    v-model="visible"
    title="云同步设置"
    width="600px"
    :close-on-click-modal="false"
  >
    <el-form :model="form" label-width="120px">
      <el-form-item label="启用同步">
        <el-switch v-model="form.enabled" @change="handleEnabledChange" />
        <div class="form-tip">启用后，数据将自动同步到 GitHub Gist</div>
      </el-form-item>

      <el-form-item label="GitHub Token" required>
        <el-input
          v-model="form.token"
          type="password"
          placeholder="请输入 GitHub Personal Access Token"
          show-password
          @blur="handleTokenBlur"
        >
          <template #append>
            <el-button @click="testConnection" :loading="testing">
              测试
            </el-button>
          </template>
        </el-input>
        <div class="form-tip">
          <el-link
            href="https://github.com/settings/tokens/new"
            target="_blank"
            type="primary"
          >
            创建 Token
          </el-link>
          （需要 <code>gist</code> 权限）
        </div>
      </el-form-item>

      <template v-if="form.enabled">

        <el-form-item label="Gist ID" v-if="syncStore.gistId">
          <el-input v-model="gistIdDisplay" disabled>
            <template #append>
              <el-button @click="copyGistId">复制</el-button>
            </template>
          </el-input>
          <div class="form-tip">
            首次同步后自动生成
            <el-link
              :href="gistUrl"
              target="_blank"
              type="primary"
              style="margin-left: 8px"
            >
              在 GitHub 查看数据
            </el-link>
            <el-link
              href="https://gist.github.com"
              target="_blank"
              type="info"
              style="margin-left: 8px"
            >
              查看所有 Gist
            </el-link>
          </div>
        </el-form-item>

        <el-form-item label="自动同步">
          <el-switch v-model="form.autoSync" />
          <div class="form-tip">每次保存时自动同步到云端</div>
        </el-form-item>

        <el-form-item label="最后同步" v-if="syncStore.lastSyncAt">
          <span>{{ formatLastSyncAt }}</span>
        </el-form-item>

        <el-form-item>
          <el-space>
            <el-button type="primary" @click="handleSync" :loading="syncing">
              立即同步
            </el-button>
            <el-button @click="handlePull" :loading="pulling">
              拉取数据
            </el-button>
          </el-space>
        </el-form-item>
      </template>
    </el-form>

    <!-- 同步状态提示 -->
    <el-alert
      v-if="syncStore.syncError"
      :title="syncStore.syncError"
      type="error"
      :closable="true"
      @close="syncStore.clearSyncError()"
      style="margin-top: 16px"
    />

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
      <el-button type="primary" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useSyncStore } from '../stores/syncStore';
import { useCommandStore } from '../stores/commandStore';
import { ElMessage, ElMessageBox } from 'element-plus';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const syncStore = useSyncStore();
const commandStore = useCommandStore();

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const form = ref({
  enabled: syncStore.enabled,
  token: syncStore.token,
  autoSync: syncStore.autoSync,
});

const testing = ref(false);
const syncing = ref(false);
const pulling = ref(false);

const gistIdDisplay = computed(() => syncStore.gistId || '');

const gistUrl = computed(() => {
  if (syncStore.gistId) {
    // 如果有用户名，使用完整 URL，否则只使用 Gist ID
    if (syncStore.githubUsername) {
      return `https://gist.github.com/${syncStore.githubUsername}/${syncStore.gistId}`;
    }
    return `https://gist.github.com/${syncStore.gistId}`;
  }
  return 'https://gist.github.com';
});

const formatLastSyncAt = computed(() => {
  if (!syncStore.lastSyncAt) return '从未同步';
  const date = new Date(syncStore.lastSyncAt);
  return date.toLocaleString('zh-CN');
});

// 监听 store 变化，同步到 form
watch(
  () => [syncStore.enabled, syncStore.token, syncStore.autoSync],
  () => {
    form.value.enabled = syncStore.enabled;
    form.value.token = syncStore.token;
    form.value.autoSync = syncStore.autoSync;
  },
  { immediate: true }
);

async function handleEnabledChange(enabled: boolean) {
  // 允许先启用同步，再填写 token
  // 如果启用时没有 token，只提示但不阻止
  if (enabled && !form.value.token) {
    ElMessage.info('请填写 GitHub Token 后同步功能才能正常工作');
  }
  await syncStore.setEnabled(enabled);
}

async function handleTokenBlur() {
  if (form.value.token && form.value.token !== syncStore.token) {
    await syncStore.setToken(form.value.token);
  }
}

async function testConnection() {
  if (!form.value.token) {
    ElMessage.warning('请先输入 Token');
    return;
  }

  testing.value = true;
  try {
    await syncStore.setToken(form.value.token);
    const result = await syncStore.testConnection();
    if (result.success) {
      ElMessage.success(result.message);
    } else {
      ElMessage.error(result.message);
    }
  } catch (error: any) {
    ElMessage.error(`测试失败: ${error.message}`);
  } finally {
    testing.value = false;
  }
}

async function handleSync() {
  if (!form.value.token) {
    ElMessage.warning('请先设置 GitHub Token');
    return;
  }

  syncing.value = true;
  try {
    await syncStore.setToken(form.value.token);
    await commandStore.manualSync();
  } catch (error: any) {
    // 错误已在 manualSync 中处理
  } finally {
    syncing.value = false;
  }
}

async function handlePull() {
  if (!form.value.token) {
    ElMessage.warning('请先设置 GitHub Token');
    return;
  }

  pulling.value = true;
  try {
    await syncStore.setToken(form.value.token);
    const result = await commandStore.manualPull();
    
    if (result.conflict) {
      // 显示冲突解决对话框
      const choice = await ElMessageBox.confirm(
        '检测到数据冲突，请选择处理方式：',
        '数据冲突',
        {
          distinguishCancelAndClose: true,
          confirmButtonText: '使用远程数据',
          cancelButtonText: '保留本地数据',
          type: 'warning',
        }
      ).catch(() => 'cancel');

      if (choice === 'confirm') {
        // 使用远程数据（已经在 pullFromGist 中处理）
        ElMessage.success('已使用远程数据');
      }
    }
  } catch (error: any) {
    // 错误已在 manualPull 中处理
  } finally {
    pulling.value = false;
  }
}

function copyGistId() {
  if (syncStore.gistId) {
    navigator.clipboard.writeText(syncStore.gistId);
    ElMessage.success('已复制到剪贴板');
  }
}

async function handleSave() {
  try {
    if (form.value.enabled && !form.value.token) {
      ElMessage.warning('启用同步需要设置 GitHub Token');
      return;
    }

    await syncStore.setToken(form.value.token);
    await syncStore.setEnabled(form.value.enabled);
    await syncStore.setAutoSync(form.value.autoSync);

    ElMessage.success('设置已保存');
    visible.value = false;
  } catch (error: any) {
    ElMessage.error(`保存失败: ${error.message}`);
  }
}
</script>

<style scoped>
.form-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.form-tip code {
  background: var(--el-fill-color-light);
  padding: 2px 4px;
  border-radius: 2px;
  font-size: 11px;
}
</style>

