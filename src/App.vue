<script setup lang="ts">
import HomeView from './views/HomeView.vue';
</script>

<template>
  <HomeView />
  
</template>

<style>
:root {
  --bg: #f6f7fb;
  --text: #1f2328;
  --muted: #6b7280;
  --primary: #409EFF;
  --card: #ffffff;
  --border: #e5e7eb;

  /* Element Plus 全局配色与圆角 */
  --el-bg-color: var(--bg);
  --el-text-color-primary: var(--text);
  --el-text-color-regular: #4b5563; /* 灰600 */
  --el-text-color-secondary: var(--muted);
  --el-text-color-placeholder: #9ca3af; /* 灰400 */

  --el-color-primary: var(--primary);
  --el-color-success: #22c55e; /* 绿500 */
  --el-color-warning: #f59e0b; /* 橙500 */
  --el-color-danger: #ef4444;  /* 红500 */
  --el-color-info: #14b8a6;    /* 青500 */

  --el-border-color: var(--border);
  --el-button-border-color: var(--border);
  --el-fill-color: var(--card);
  --el-border-radius-base: 10px;
  --el-border-radius-small: 8px;
  --el-border-radius-round: 9999px;
}

html[data-theme="dark"] {
  --bg: #0f172a;
  --text: #e5e7eb;
  --muted: #9aa0aa;
  --primary: #66b1ff;
  --card: #0b1220;
  --border: #1f2937;

  --el-bg-color: var(--bg);
  --el-text-color-primary: var(--text);
  --el-text-color-regular: #cbd5e1; /* slate-300 */
  --el-text-color-secondary: #94a3b8; /* slate-400 */
  --el-text-color-placeholder: #64748b; /* slate-500 */

  --el-color-primary: var(--primary);
  --el-color-success: #22c55e;
  --el-color-warning: #f59e0b;
  --el-color-danger: #ef4444;
  --el-color-info: #14b8a6;

  --el-border-color: var(--border);
  --el-button-border-color: var(--border);
  --el-fill-color: var(--card);
}

/* 额外主题：海洋、翡翠、玫瑰、琥珀 */
html[data-theme="ocean"] {
  --bg: #0a192f;
  --text: #dbeafe;
  --muted: #93b3df;
  --primary: #00bcd4;
  --card: #102a43;
  --border: #1e3a5f;

  --el-bg-color: var(--bg);
  --el-text-color-primary: var(--text);
  --el-text-color-regular: #c7d2fe; /* indigo-200 */
  --el-text-color-secondary: var(--muted);
  --el-text-color-placeholder: #7fb1dd;

  --el-color-primary: var(--primary);
  --el-color-success: #22c55e;
  --el-color-warning: #f59e0b;
  --el-color-danger: #ef4444;
  --el-color-info: #38bdf8; /* sky-400 */

  --el-border-color: var(--border);
  --el-button-border-color: var(--border);
  --el-fill-color: var(--card);
}

html[data-theme="emerald"] {
  --bg: #0f291e;
  --text: #e8f5e9;
  --muted: #a7d3b2;
  --primary: #34d399;
  --card: #10241b;
  --border: #1f3b2c;

  --el-bg-color: var(--bg);
  --el-text-color-primary: var(--text);
  --el-text-color-regular: #cce3d5;
  --el-text-color-secondary: var(--muted);
  --el-text-color-placeholder: #89c0a2;

  --el-color-primary: var(--primary);
  --el-color-success: #10b981; /* emerald-500 */
  --el-color-warning: #f59e0b;
  --el-color-danger: #ef4444;
  --el-color-info: #14b8a6;

  --el-border-color: var(--border);
  --el-button-border-color: var(--border);
  --el-fill-color: var(--card);
}

html[data-theme="rose"] {
  --bg: #1f0f17;
  --text: #ffe4e6;
  --muted: #f5c2c7;
  --primary: #fb7185;
  --card: #190a12;
  --border: #40273a;

  --el-bg-color: var(--bg);
  --el-text-color-primary: var(--text);
  --el-text-color-regular: #fecdd3;
  --el-text-color-secondary: var(--muted);
  --el-text-color-placeholder: #f9a8b3;

  --el-color-primary: var(--primary);
  --el-color-success: #10b981;
  --el-color-warning: #f59e0b;
  --el-color-danger: #fb7185; /* 与主色同系，更和谐 */
  --el-color-info: #14b8a6;

  --el-border-color: var(--border);
  --el-button-border-color: var(--border);
  --el-fill-color: var(--card);
}

html[data-theme="amber"] {
  --bg: #1b1407;
  --text: #fff7ed;
  --muted: #f1c38e;
  --primary: #f59e0b;
  --card: #120c05;
  --border: #3a2b15;

  --el-bg-color: var(--bg);
  --el-text-color-primary: var(--text);
  --el-text-color-regular: #fde68a;
  --el-text-color-secondary: var(--muted);
  --el-text-color-placeholder: #f9cf7a;

  --el-color-primary: var(--primary);
  --el-color-success: #10b981;
  --el-color-warning: #f59e0b; /* 主色同系 */
  --el-color-danger: #ef4444;
  --el-color-info: #14b8a6;

  --el-border-color: var(--border);
  --el-button-border-color: var(--border);
  --el-fill-color: var(--card);
}

:root {
  font-family: Inter, Avenir, Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 24px;
  font-weight: 400;
  color: var(--text);
  background-color: var(--bg);
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
}

body {
  margin: 0;
  padding: 0;
  min-height: 100vh;
}

#app {
  width: 100%;
  min-height: 100vh;
}

.card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.muted {
  color: var(--muted);
}
</style>