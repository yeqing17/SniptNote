import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { GistService, GistConfig } from '../services/gistService';
import { exists, readTextFile, writeTextFile, mkdir, BaseDirectory } from '@tauri-apps/plugin-fs';

const SYNC_CONFIG_FILENAME = 'sync-config.json';
const isTauri = () => typeof window !== 'undefined' && !!(window as any).__TAURI_INTERNALS__;

interface SyncConfig {
  token: string;
  gistId?: string;
  enabled: boolean;
  autoSync: boolean;
  lastSyncAt?: string;
}

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export const useSyncStore = defineStore('sync', () => {
  const token = ref<string>('');
  const gistId = ref<string | undefined>(undefined);
  const enabled = ref<boolean>(false);
  const autoSync = ref<boolean>(true);
  const lastSyncAt = ref<string | undefined>(undefined);
  const syncStatus = ref<SyncStatus>('idle');
  const syncError = ref<string | undefined>(undefined);
  const githubUsername = ref<string | undefined>(undefined);

  /**
   * 加载同步配置
   */
  async function loadConfig() {
    try {
      let configData: string | null = null;

      if (isTauri()) {
        const configExists = await exists(SYNC_CONFIG_FILENAME, { baseDir: BaseDirectory.AppData });
        if (configExists) {
          configData = await readTextFile(SYNC_CONFIG_FILENAME, { baseDir: BaseDirectory.AppData });
        }
      } else {
        configData = localStorage.getItem('sniptnote-sync-config');
      }

      if (configData) {
        const config: SyncConfig = JSON.parse(configData);
        token.value = config.token || '';
        gistId.value = config.gistId;
        enabled.value = config.enabled || false;
        autoSync.value = config.autoSync !== false; // 默认 true
        lastSyncAt.value = config.lastSyncAt;
      }
    } catch (error) {
      console.error('Failed to load sync config:', error);
    }
  }

  /**
   * 保存同步配置
   */
  async function saveConfig() {
    try {
      const config: SyncConfig = {
        token: token.value,
        gistId: gistId.value,
        enabled: enabled.value,
        autoSync: autoSync.value,
        lastSyncAt: lastSyncAt.value,
      };

      const configStr = JSON.stringify(config, null, 2);

      if (isTauri()) {
        const dirExists = await exists('', { baseDir: BaseDirectory.AppData });
        if (!dirExists) {
          await mkdir('', { baseDir: BaseDirectory.AppData, recursive: true });
        }
        await writeTextFile(SYNC_CONFIG_FILENAME, configStr, {
          baseDir: BaseDirectory.AppData,
        });
      } else {
        localStorage.setItem('sniptnote-sync-config', configStr);
      }
    } catch (error) {
      console.error('Failed to save sync config:', error);
      throw error;
    }
  }

  /**
   * 设置 GitHub Token
   */
  async function setToken(newToken: string) {
    token.value = newToken;
    await saveConfig();
  }

  /**
   * 设置 Gist ID
   */
  async function setGistId(id: string | undefined) {
    gistId.value = id;
    await saveConfig();
  }

  /**
   * 启用/禁用同步
   */
  async function setEnabled(value: boolean) {
    enabled.value = value;
    await saveConfig();
  }

  /**
   * 设置自动同步
   */
  async function setAutoSync(value: boolean) {
    autoSync.value = value;
    await saveConfig();
  }

  /**
   * 验证 Token 是否有效并获取用户名
   */
  async function validateToken(): Promise<boolean> {
    if (!token.value) {
      return false;
    }
    try {
      const userInfo = await GistService.getUserInfo(token.value);
      if (userInfo) {
        githubUsername.value = userInfo.login;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * 测试连接
   */
  async function testConnection(): Promise<{ success: boolean; message: string }> {
    if (!token.value) {
      return { success: false, message: '请先设置 GitHub Token' };
    }

    try {
      const isValid = await validateToken();
      if (!isValid) {
        return { success: false, message: 'Token 无效，请检查是否正确' };
      }

      if (gistId.value) {
        const exists = await GistService.checkGist(gistId.value, { token: token.value });
        if (!exists) {
          return { success: false, message: 'Gist 不存在或无法访问' };
        }
      }

      return { success: true, message: '连接成功' };
    } catch (error: any) {
      return { success: false, message: error.message || '连接失败' };
    }
  }

  /**
   * 获取 Gist 配置
   */
  function getGistConfig(): GistConfig {
    return {
      token: token.value,
      gistId: gistId.value,
    };
  }

  /**
   * 更新最后同步时间
   */
  function updateLastSyncAt() {
    lastSyncAt.value = new Date().toISOString();
    saveConfig();
  }

  /**
   * 设置同步状态
   */
  function setSyncStatus(status: SyncStatus, error?: string) {
    syncStatus.value = status;
    syncError.value = error;
  }

  /**
   * 清除同步错误
   */
  function clearSyncError() {
    syncError.value = undefined;
    if (syncStatus.value === 'error') {
      syncStatus.value = 'idle';
    }
  }

  // 监听配置变化，自动保存（延迟执行，避免初始化时立即保存）
  watch([token, gistId, enabled, autoSync], () => {
    // 延迟保存，避免在初始化时立即触发
    setTimeout(() => {
      saveConfig().catch(err => console.error('Failed to save sync config:', err));
    }, 100);
  });

  return {
    // 状态
    token,
    gistId,
    enabled,
    autoSync,
    lastSyncAt,
    syncStatus,
    syncError,
    githubUsername,
    // 方法
    loadConfig,
    saveConfig,
    setToken,
    setGistId,
    setEnabled,
    setAutoSync,
    validateToken,
    testConnection,
    getGistConfig,
    updateLastSyncAt,
    setSyncStatus,
    clearSyncError,
  };
});

