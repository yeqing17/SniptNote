# 主题与配色指南

本项目内置多套可切换主题，并统一覆盖 Element Plus 的按钮与文字等组件配色，提供更协调与高级的视觉观感。本文档介绍主题系统的工作方式、可用主题、扩展方法以及设计建议。

## 可用主题

- light（亮色）
- dark（暗色）
- ocean（海洋蓝）
- emerald（翡翠绿）
- rose（玫瑰粉）
- amber（琥珀金）

主题选择支持：
- 页面顶部下拉选择器（直接选择某一主题）
- 循环切换按钮（在可用主题列表中顺序切换）
- 选择会持久化到 `localStorage`（键：`sniptnote-theme`）

## 工作原理

- 在 `src/App.vue` 中通过 `html[data-theme="..."]` 选择器定义每套主题的 CSS 变量。
- 在 `src/stores/uiStore.ts` 中维护 `availableThemes`、`setTheme`、`toggleTheme` 与 `applyTheme`，并将所选主题应用到 `document.documentElement` 的 `data-theme` 属性。
- 通过覆盖 Element Plus 的 CSS 变量，实现按钮、文字、标签、提示色等控件随主题统一变化。

核心变量（节选）：
- 页面基础：`--bg`（背景）、`--text`（主文本）、`--muted`（次文本）、`--card`（卡片）、`--border`（边框）
- Element Plus：
  - 主色系：`--el-color-primary/success/warning/danger/info` 及对应 `-light-*`/`-dark-*`
  - 文本层级：`--el-text-color-primary/regular/secondary/placeholder/disabled`
  - 背景与填充：`--el-bg-color`、`--el-fill-color`
  - 边框与圆角：`--el-border-color`、`--el-button-border-color`、`--el-border-radius-*`

相关文件：
- `src/App.vue`：主题 CSS 变量定义（每个 `html[data-theme="..."]` 块）
- `src/stores/uiStore.ts`：主题状态管理与应用逻辑
- `src/views/HomeView.vue`：主题选择器与切换入口

## 如何新增主题

1) 在 `src/App.vue` 中新增一段主题变量：

```css
html[data-theme="custom"] {
  /* 页面基础色 */
  --bg: #0e1116;
  --text: #e6edf3;
  --muted: #94a3b8;
  --primary: #7c3aed; /* 例如选择紫色系 */
  --card: #0b0f14;
  --border: #22272e;

  /* Element Plus 覆盖 */
  --el-bg-color: var(--bg);
  --el-text-color-primary: var(--text);
  --el-text-color-regular: #cbd5e1;
  --el-text-color-secondary: var(--muted);
  --el-text-color-placeholder: #64748b;

  --el-color-primary: var(--primary);
  --el-color-success: #22c55e;
  --el-color-warning: #f59e0b;
  --el-color-danger: #ef4444;
  --el-color-info: #14b8a6;

  --el-border-color: var(--border);
  --el-button-border-color: var(--border);
  --el-fill-color: var(--card);
}
```

2) 在 `src/stores/uiStore.ts` 的 `availableThemes` 中添加 `custom`：

```ts
const availableThemes = ['light', 'dark', 'ocean', 'emerald', 'rose', 'amber', 'custom'] as const;
```

3) 在页面顶部的主题选择器中即可选择并应用该主题（选择会自动持久化）。

## 设计建议

- 对比与层级：
  - 保证 `--text` 与 `--bg` 的对比度良好（参考 WCAG AA 对比度 4.5:1）。
  - 使用 `--el-text-color-primary/regular/secondary/disabled` 明确文本层级，避免信息密度高时难以区分主次。
- 主色与状态色：
  - `--el-color-primary` 决定按钮与高亮的主色；`success/warning/danger/info` 对应状态色，建议与主色协调但区分明显。
  - 根据需要微调 `-light-*`/`-dark-*` 阶梯，提升 hover/active 的质感（避免过度饱和或过暗）。
- 边框与卡片：
  - 调整 `--border` 与 `--card` 以控制卡片的分层与可读性；暗色主题建议提高卡片与背景的亮度差异。
- 圆角与阴影：
  - 通过 `--el-border-radius-*` 与适度阴影增强精致感，但避免过强阴影导致“浮躁”。

## 常见问题

- 主题不生效？
  - 确认 `document.documentElement` 的 `data-theme` 是否为目标值（可在控制台查看）。
  - 检查新增主题是否加入 `availableThemes`，以及 `App.vue` 中是否存在对应的 CSS 变量块。
- 某些控件颜色未变化？
  - 可能是组件内部使用了特定类名或未使用变量；优先通过覆盖 Element Plus 全局变量实现统一，再针对少量组件定向增强。

## 进一步定制

如果你有品牌色或特定审美倾向（更克制的灰蓝、或更浓郁的祖母绿），提供主色与文本/背景建议色值，我可以同步调整变量与梯度，让整体更符合你的偏好。