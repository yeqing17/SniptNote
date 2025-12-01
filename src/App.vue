<script setup lang="ts">
import HomeView from './views/HomeView.vue';
import { onMounted } from 'vue';
import { useCommandStore } from './stores/commandStore';
import { useSyncStore } from './stores/syncStore';

const commandStore = useCommandStore();
const syncStore = useSyncStore();

onMounted(async () => {
  // 加载命令数据
  await commandStore.loadData();
  // 加载同步配置
  await syncStore.loadConfig();
});
</script>

<template>
  <HomeView />
  
</template>

<style>
:root {
  /* --- 基础色板 (Light Mode) --- */
  --bg: #f8fafc;       /* Slate 50 */
  --card-bg: #ffffff;
  --text-main: #0f172a; /* Slate 900 */
  --text-muted: #64748b; /* Slate 500 */
  --border: #e2e8f0;    /* Slate 200 */
  --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  
  --primary: #3b82f6;   /* Blue 500 */
  --code-bg: #f1f5f9;   /* Slate 100 */

  /* Element Plus 映射 */
  --el-bg-color: var(--bg);
  --el-bg-color-overlay: var(--card-bg); /* 关键：卡片背景色 */
  --el-text-color-primary: var(--text-main);
  --el-text-color-regular: #334155;
  --el-text-color-secondary: var(--text-muted);
  --el-border-color: var(--border);
  --el-border-color-light: #f1f5f9;
  --el-fill-color-light: var(--code-bg);
  
  --el-color-primary: var(--primary);
  --el-border-radius-base: 12px;
}

/* --- 深色模式 (Dark Mode) --- */
html[data-theme="dark"] {
  --bg: #0f172a;        /* Slate 900 */
  --card-bg: #1e293b;   /* Slate 800 - 比背景稍亮 */
  --text-main: #f8fafc; /* Slate 50 */
  --text-muted: #94a3b8; /* Slate 400 */
  --border: #334155;    /* Slate 700 */
  --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3);

  --primary: #60a5fa;   /* Blue 400 - 深色模式下稍微提亮 */
  --code-bg: #020617;   /* Slate 950 - 比卡片更深 */

  --el-bg-color: var(--bg);
  --el-bg-color-overlay: var(--card-bg);
  --el-text-color-primary: var(--text-main);
  --el-text-color-regular: #cbd5e1;
  --el-text-color-secondary: var(--text-muted);
  --el-border-color: var(--border);
  --el-border-color-light: #334155;
  --el-fill-color-light: var(--code-bg);
  --el-fill-color-blank: var(--card-bg); /* 输入框背景等 */
}

/* --- 其他主题微调 --- */
html[data-theme="ocean"] {
  --bg: #0b1121;
  --card-bg: #151e32;
  --text-main: #e2e8f0;
  --text-muted: #64748b;
  --primary: #06b6d4; /* Cyan 500 */
  --code-bg: #080c19;
  --border: #1e293b;
  
  --el-bg-color: var(--bg);
  --el-bg-color-overlay: var(--card-bg);
  --el-text-color-primary: var(--text-main);
  --el-border-color: var(--border);
  --el-color-primary: var(--primary);
  --el-fill-color-light: var(--code-bg);
  --el-fill-color-blank: var(--card-bg);
}

html[data-theme="emerald"] {
  --bg: #022c22;        /* Emerald 950 */
  --card-bg: #064e3b;   /* Emerald 900 */
  --text-main: #ecfdf5; /* Emerald 50 */
  --text-muted: #6ee7b7; /* Emerald 300 */
  --primary: #10b981;   /* Emerald 500 */
  --code-bg: #022c22;   /* Emerald 950 (darker) */
  --border: #065f46;    /* Emerald 800 */
  
  --el-bg-color: var(--bg);
  --el-bg-color-overlay: var(--card-bg);
  --el-text-color-primary: var(--text-main);
  --el-border-color: var(--border);
  --el-color-primary: var(--primary);
  --el-fill-color-light: var(--code-bg);
  --el-fill-color-blank: var(--card-bg);
}

html[data-theme="rose"] {
  --bg: #4c0519;        /* Rose 950 */
  --card-bg: #881337;   /* Rose 900 */
  --text-main: #fff1f2; /* Rose 50 */
  --text-muted: #fda4af; /* Rose 300 */
  --primary: #fb7185;   /* Rose 400 */
  --code-bg: #4c0519;
  --border: #9f1239;    /* Rose 800 */
  
  --el-bg-color: var(--bg);
  --el-bg-color-overlay: var(--card-bg);
  --el-text-color-primary: var(--text-main);
  --el-border-color: var(--border);
  --el-color-primary: var(--primary);
  --el-fill-color-light: var(--code-bg);
  --el-fill-color-blank: var(--card-bg);
}

html[data-theme="amber"] {
  --bg: #451a03;        /* Amber 950 (using warm brown base) */
  --card-bg: #78350f;   /* Amber 900 */
  --text-main: #fffbeb; /* Amber 50 */
  --text-muted: #fcd34d; /* Amber 300 */
  --primary: #fbbf24;   /* Amber 400 */
  --code-bg: #451a03;
  --border: #92400e;    /* Amber 800 */
  
  --el-bg-color: var(--bg);
  --el-bg-color-overlay: var(--card-bg);
  --el-text-color-primary: var(--text-main);
  --el-border-color: var(--border);
  --el-color-primary: var(--primary);
  --el-fill-color-light: var(--code-bg);
  --el-fill-color-blank: var(--card-bg);
}

/* 通用重置 */
body {
  margin: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background-color: var(--bg);
  color: var(--text-main);
  transition: background-color 0.3s, color 0.3s;
}

#app {
  min-height: 100vh;
  width: 100%;
}

/* 滚动条美化 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}
</style>