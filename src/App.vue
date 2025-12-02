<script setup lang="ts">
import HomeView from "./views/HomeView.vue";
import { onMounted } from "vue";
import { useCommandStore } from "./stores/commandStore";
import { useSyncStore } from "./stores/syncStore";

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
  --bg: #f8fafc; /* Slate 50 */
  --card-bg: #ffffff;
  --text-main: #0f172a; /* Slate 900 */
  --text-muted: #64748b; /* Slate 500 */
  --border: #e2e8f0; /* Slate 200 */
  --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);

  --primary: #3b82f6; /* Blue 500 */
  --code-bg: #f1f5f9; /* Slate 100 */
  --code-gradient: linear-gradient(
    90deg,
    #3b82f6,
    #60a5fa,
    #93c5fd
  ); /* 蓝色系渐变 */

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
  --bg: #0f172a; /* Slate 900 */
  --card-bg: #1e293b; /* Slate 800 - 比背景稍亮 */
  --text-main: #f8fafc; /* Slate 50 */
  --text-muted: #94a3b8; /* Slate 400 */
  --border: #334155; /* Slate 700 */
  --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3);

  --primary: #60a5fa; /* Blue 400 - 深色模式下稍微提亮 */
  --code-bg: #020617; /* Slate 950 - 比卡片更深 */
  --code-gradient: linear-gradient(
    90deg,
    #3b82f6,
    #60a5fa,
    #93c5fd
  ); /* 蓝色系渐变 */

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
  --code-gradient: linear-gradient(
    90deg,
    #0891b2,
    #06b6d4,
    #22d3ee
  ); /* 青色系渐变 */

  --el-bg-color: var(--bg);
  --el-bg-color-overlay: var(--card-bg);
  --el-text-color-primary: var(--text-main);
  --el-border-color: var(--border);
  --el-color-primary: var(--primary);
  --el-fill-color-light: var(--code-bg);
  --el-fill-color-blank: var(--card-bg);
}

html[data-theme="emerald"] {
  --bg: #022c22; /* Emerald 950 */
  --card-bg: #064e3b; /* Emerald 900 */
  --text-main: #ecfdf5; /* Emerald 50 */
  --text-muted: #6ee7b7; /* Emerald 300 */
  --primary: #10b981; /* Emerald 500 */
  --code-bg: #022c22; /* Emerald 950 (darker) */
  --border: #065f46; /* Emerald 800 */
  --code-gradient: linear-gradient(
    90deg,
    #059669,
    #10b981,
    #34d399
  ); /* 绿色系渐变 */

  --el-bg-color: var(--bg);
  --el-bg-color-overlay: var(--card-bg);
  --el-text-color-primary: var(--text-main);
  --el-border-color: var(--border);
  --el-color-primary: var(--primary);
  --el-fill-color-light: var(--code-bg);
  --el-fill-color-blank: var(--card-bg);
}

html[data-theme="rose"] {
  --bg: #4c0519; /* Rose 950 */
  --card-bg: #881337; /* Rose 900 */
  --text-main: #fff1f2; /* Rose 50 */
  --text-muted: #fda4af; /* Rose 300 */
  --primary: #fb7185; /* Rose 400 */
  --code-bg: #4c0519;
  --border: #9f1239; /* Rose 800 */
  --code-gradient: linear-gradient(
    90deg,
    #e11d48,
    #fb7185,
    #fda4af
  ); /* 玫瑰色系渐变 */

  --el-bg-color: var(--bg);
  --el-bg-color-overlay: var(--card-bg);
  --el-text-color-primary: var(--text-main);
  --el-border-color: var(--border);
  --el-color-primary: var(--primary);
  --el-fill-color-light: var(--code-bg);
  --el-fill-color-blank: var(--card-bg);
}

html[data-theme="amber"] {
  --bg: #451a03; /* Amber 950 (using warm brown base) */
  --card-bg: #78350f; /* Amber 900 */
  --text-main: #fffbeb; /* Amber 50 */
  --text-muted: #fcd34d; /* Amber 300 */
  --primary: #fbbf24; /* Amber 400 */
  --code-bg: #451a03;
  --border: #92400e; /* Amber 800 */
  --code-gradient: linear-gradient(
    90deg,
    #d97706,
    #fbbf24,
    #fcd34d
  ); /* 琥珀色系渐变 */

  --el-bg-color: var(--bg);
  --el-bg-color-overlay: var(--card-bg);
  --el-text-color-primary: var(--text-main);
  --el-border-color: var(--border);
  --el-color-primary: var(--primary);
  --el-fill-color-light: var(--code-bg);
  --el-fill-color-blank: var(--card-bg);
}

/* 通用重置 */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    sans-serif;
  background-color: var(--bg);
  color: var(--text-main);
  transition: background-color 0.3s, color 0.3s;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  min-height: 100vh;
  width: 100%;
}

/* 全局按钮美化 */
.el-button {
  font-weight: 500;
  border-radius: 8px !important;
  transition: all 0.2s ease;
}

.el-button:hover {
  transform: translateY(-1px);
}

.el-button:active {
  transform: translateY(0);
}

/* 全局卡片美化 */
.el-card {
  border-radius: 16px !important;
  overflow: hidden;
}

/* 全局输入框美化 */
.el-input__wrapper,
.el-textarea__inner {
  border-radius: 10px !important;
  transition: all 0.2s ease;
}

.el-input__wrapper:focus-within,
.el-textarea__inner:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15) !important;
}

/* 全局标签美化 */
.el-tag {
  border-radius: 6px !important;
  font-weight: 500;
}

/* 全局选择器美化 */
.el-select__wrapper {
  border-radius: 10px !important;
}

/* 全局开关美化 */
.el-switch {
  --el-switch-on-color: var(--primary);
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

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.fade-enter-active {
  animation: fadeIn 0.3s ease;
}

.slide-enter-active {
  animation: slideIn 0.3s ease;
}

/* ========== 代码高亮样式 - 适配各主题 ========== */
.hljs {
  background: var(--code-bg) !important;
  color: var(--text-main) !important;
  padding: 1em;
  border-radius: 8px;
}

/* Light 主题代码高亮 */
:root {
  --hljs-keyword: #d73a49;
  --hljs-string: #032f62;
  --hljs-number: #005cc5;
  --hljs-comment: #6a737d;
  --hljs-function: #6f42c1;
  --hljs-variable: #e36209;
  --hljs-built-in: #005cc5;
}

/* Dark 主题代码高亮 */
html[data-theme="dark"] {
  --hljs-keyword: #ff7b72;
  --hljs-string: #a5d6ff;
  --hljs-number: #79c0ff;
  --hljs-comment: #8b949e;
  --hljs-function: #d2a8ff;
  --hljs-variable: #ffa657;
  --hljs-built-in: #79c0ff;
}

/* Ocean 主题代码高亮 */
html[data-theme="ocean"] {
  --hljs-keyword: #22d3ee;
  --hljs-string: #67e8f9;
  --hljs-number: #a5f3fc;
  --hljs-comment: #64748b;
  --hljs-function: #c4b5fd;
  --hljs-variable: #fcd34d;
  --hljs-built-in: #22d3ee;
}

/* Emerald 主题代码高亮 */
html[data-theme="emerald"] {
  --hljs-keyword: #34d399;
  --hljs-string: #6ee7b7;
  --hljs-number: #a7f3d0;
  --hljs-comment: #6ee7b7;
  --hljs-function: #a78bfa;
  --hljs-variable: #fbbf24;
  --hljs-built-in: #34d399;
}

/* Rose 主题代码高亮 */
html[data-theme="rose"] {
  --hljs-keyword: #fb7185;
  --hljs-string: #fda4af;
  --hljs-number: #fecdd3;
  --hljs-comment: #fda4af;
  --hljs-function: #c4b5fd;
  --hljs-variable: #fcd34d;
  --hljs-built-in: #fb7185;
}

/* Amber 主题代码高亮 */
html[data-theme="amber"] {
  --hljs-keyword: #fbbf24;
  --hljs-string: #fcd34d;
  --hljs-number: #fde68a;
  --hljs-comment: #fcd34d;
  --hljs-function: #c4b5fd;
  --hljs-variable: #fb7185;
  --hljs-built-in: #fbbf24;
}

/* 代码高亮语法着色 */
.hljs-keyword,
.hljs-selector-tag,
.hljs-literal,
.hljs-section,
.hljs-link {
  color: var(--hljs-keyword) !important;
}

.hljs-string,
.hljs-title,
.hljs-name,
.hljs-type,
.hljs-attribute,
.hljs-symbol,
.hljs-bullet,
.hljs-addition,
.hljs-quote {
  color: var(--hljs-string) !important;
}

.hljs-number,
.hljs-regexp,
.hljs-meta {
  color: var(--hljs-number) !important;
}

.hljs-comment,
.hljs-deletion {
  color: var(--hljs-comment) !important;
  font-style: italic;
}

.hljs-function,
.hljs-class .hljs-title {
  color: var(--hljs-function) !important;
}

.hljs-variable,
.hljs-template-variable,
.hljs-attr {
  color: var(--hljs-variable) !important;
}

.hljs-built_in,
.hljs-builtin-name {
  color: var(--hljs-built-in) !important;
}

.hljs-emphasis {
  font-style: italic;
}

.hljs-strong {
  font-weight: bold;
}
</style>
