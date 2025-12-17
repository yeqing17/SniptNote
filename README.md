# SniptNote

![版本](https://img.shields.io/badge/版本-0.7.0-blue)

一个面向程序员的命令片段管理工具，支持快速添加、搜索、标签筛选、排序与导出导入。项目基于 `Tauri + Vue 3 + Vite + Pinia` 构建，桌面端体积小、性能好，亦可在浏览器中开发预览。

## 功能特性

- 命令管理：添加、编辑、删除、收藏，支持标签与搜索。
- 排序与过滤：按更新时间/创建时间/标题排序；支持收藏优先；标签点击筛选；清除过滤。
- 展示控制：
  - 显示/隐藏简介（默认隐藏，适合高密度浏览）。
  - 列表单行模式（仅显示“标题 + 操作按钮”，最大化可视数量）。
- Markdown 简介与代码高亮：使用 `markdown-it` 与 `highlight.js`（bash）。
- 数据持久化：桌面端数据存储在系统 `AppData` 目录下的 `commands.json` 文件，安全可靠；支持从旧版 `localStorage` 自动迁移。
- **GitHub Gist 云同步**：支持通过 GitHub Gist 进行数据云同步，实现跨设备数据共享和自动备份；支持自动同步和手动同步；自动冲突检测和智能合并。
- 导入导出：
  - 桌面环境：通过 Tauri 插件（`@tauri-apps/plugin-dialog`, `@tauri-apps/plugin-fs`）原生保存/打开。
  - 浏览器环境：自动回退为下载/文件选择。
- 窗口尺寸：默认 `1100x800`，最小 `900x600`（可修改配置），桌面端支持窗口尺寸持久化。
- 多主题与统一配色：提供 `light/dark/ocean/emerald/rose/amber` 多套主题，
  通过页面顶部下拉选择器或循环切换按钮应用；主题持久化存储；
  覆盖 Element Plus 的按钮与文字变量，实现随主题统一变化的更高级观感。
- 导入增强：支持顶层数组与 `{ commands: [] }` 两种结构，识别字段别名
  （`title|name`、`command|cmd|shell`、`description|desc`），按 `command` 去重并反馈新增/重复/无效条数。
- 文案优化：单行模式开关未激活文案为“普通模式”，更贴近使用习惯。

## 快速开始

### 环境要求

- Node.js `>= 18`
- 推荐包管理器：`npm` 或 `pnpm`
- 桌面开发与构建：需要安装 Rust 工具链与 Tauri CLI（参考 Tauri 官方文档）

### 安装依赖

```bash
npm install
# 或
pnpm install
```

### 开发运行

- 浏览器预览（Vite 开发服务器）：

```bash
npm run dev
# 默认端口为 5173（或根据你的环境为其他端口）
```

- 桌面应用（Tauri 开发模式）：

```bash
npm run tauri dev
```

### 生产构建

- Web 构建：

```bash
npm run build
```

- 桌面应用打包：

```bash
npm run tauri build
```

### 自动构建与发布

项目配置了 GitHub Actions 工作流，支持自动构建和发布：

- **自动触发**：推送以 `v` 开头的 tag（如 `v0.3.0`）时自动触发构建
- **构建产物**：自动生成 Windows 安装包（MSI/NSIS）和便携版（EXE）
- **自动发布**：构建完成后自动创建 GitHub Release 并上传构建产物

工作流配置文件：`.github/workflows/build.yml`

## 配置说明

- 默认窗口尺寸与最小尺寸在 `src-tauri/tauri.conf.json` 的 `windows` 配置中：

```json
{
  "tauri": {
    "windows": [
      {
        "width": 1100,
        "height": 800,
        "minWidth": 900,
        "minHeight": 600
      }
    ]
  }
}
```

- 窗口尺寸持久化逻辑在 `src/main.ts` 中（仅桌面环境生效）。

## 使用指南

- 添加命令：点击“添加命令”打开表单，填写标题、命令、描述（可选）、标签。
- 搜索与筛选：
  - 顶部搜索框支持标题/命令/简介全文搜索。
  - 标签区域点击即可筛选；“清除过滤”按钮恢复所有命令。
- 排序与收藏优先：
  - 选择排序键（更新时间/创建时间/标题）与排序方向（升/降）。
  - 打开“收藏优先”以优先显示收藏项。
- 展示控制：
  - “显示/隐藏简介”在高密度浏览时可关闭简介。
  - “单行模式”仅显示标题与操作按钮，适合列表密集浏览。
- 导入导出：
  - 导出会生成一个包含所有命令的 JSON 文件；桌面端使用原生对话框保存，浏览器环境自动触发下载。
  - 导入支持从 JSON 文件合并到现有列表：解析顶层数组或 `{ commands: [] }`；
    支持字段别名（`title|name`、`command|cmd|shell`、`description|desc`）；
    避免重复：按 `command` 字段去重；导入完成后会提示新增/重复/无效的条目数量。

### 导出 JSON 示例

导出的数据为命令对象数组（日期为 ISO 字符串）：

```json
[
  {
    "id": "uuid-xxxx",
    "title": "示例命令",
    "command": "echo hello",
    "description": "这是一个示例",
    "tags": ["demo", "bash"],
    "favorite": false,
    "createdAt": "2025-01-01T12:00:00.000Z",
    "updatedAt": "2025-01-01T12:00:00.000Z"
  }
]
```

详见 [/docs/import.md](./docs/import.md)

## 主题与配色

- 主题选择：页面顶部提供下拉选择器与循环切换按钮，可在 `light/dark/ocean/emerald/rose/amber` 六套主题中选择；选择会持久化到 `localStorage`。
- 统一配色：通过覆盖 Element Plus 的主题变量，按钮与文字、提示色、标签色随主题统一变化：
  - 主要色系：`--el-color-primary/success/warning/danger/info` 及对应 `-light-*`、`-dark-*`
  - 文本层级：`--el-text-color-primary/regular/secondary/disabled`
  - 圆角边框：`--el-border-radius-*` 与 `--el-border-color-*`
  - 交互反馈：统一了按钮的 `hover/active/focus` 亮度与阴影对比

自定义主题配色，参考 [/docs/themes.md](./docs/themes.md)

## 技术栈

- 前端：`Vue 3` + `Vite` + `TypeScript` + `Pinia` + `Element Plus`
- 桌面：`Tauri`
- Markdown：`markdown-it`
- 代码高亮：`highlight.js`（内置 bash 语言高亮）

## 目录结构（节选）

```

src/
  components/
    CommandForm.vue      # 新增/编辑命令的表单
    CommandList.vue      # 命令列表、筛选/排序与卡片显示
  stores/
    commandStore.ts      # 命令数据、搜索/过滤/排序、本地存储持久化
    uiStore.ts           # 主题、显示/隐藏简介、单行模式等 UI 状态
  views/
    HomeView.vue         # 页面布局与操作栏
src-tauri/
  tauri.conf.json        # 窗口尺寸等 Tauri 配置

```

## 推荐 IDE 配置

- [VS Code](https://code.visualstudio.com/)
- 插件：
  - [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
  - [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
  - [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

---

## 最近更新

- **v0.7.0**（2025-12-17）：

  - **代码显示修复**：修复多行命令在代码框中出现重影的显示问题。

- **v0.6.0**（2025-12-02）：

  - **UI 全面美化**：重构界面设计，优化卡片、按钮、表单等组件样式。
  - **代码高亮主题适配**：代码块样式现在完全适配各个主题配色。
  - **渐变装饰条适配**：代码块顶部渐变条颜色随主题变化。
  - **按钮主题适配**：导入、导出、同步按钮颜色跟随主题变换。
  - **同步按钮优化**：图标改为刷新图标，移除呼吸灯动画改用明暗状态区分。
  - **排序功能修复**：修复降序升序和收藏优先功能异常问题。

- **v0.5.0**（2025-12-01）：

  - **GitHub Gist 云同步**：新增数据云同步功能，支持跨设备数据共享和自动备份。
  - **应用图标更新**：更换为全新的终端风格图标，更符合应用定位。
  - **CI/CD 自动化**：新增 GitHub Actions 工作流，支持自动构建和发布。

- **v0.4.0**（2025-11-30）：

  - **应用图标更新**：更换为全新的终端风格图标，更符合应用定位。
  - **CI/CD 自动化**：新增 GitHub Actions 工作流，支持自动构建和发布。

- **v0.3.0**（2025-11-20）：

  - **数据持久化升级**：桌面端迁移至本地文件存储 (`AppData/commands.json`)，解决数据丢失风险，支持自动迁移。
  - **视觉体验重构**：全新 Slate 色系设计，彻底修复深色模式对比度问题，卡片更具质感。
  - **性能大幅优化**：重构 Markdown 渲染机制与搜索逻辑（防抖），列表滚动更丝滑，响应更迅速。
  - **主题系统完善**：全线优化 6 套主题配色，细节打磨更到位。

- **v0.2.0**：
  - 增强导入逻辑：支持顶层数组与 `{ commands: [] }`；字段别名识别；按 `command` 去重；导入结果给出新增/重复/无效条目统计。
  - 多主题与统一配色：新增 `light/dark/ocean/emerald/rose/amber` 主题；按钮与文字颜色随主题变 image.png 化，整体观感更协调、层次更清晰。
  - 单行模式文案优化：开关未激活文本调整为"普通模式"，更直观地提示当前展示样式。
  - 新增文档：`docs/themes.md` 和 `docs/import.md`

> 完整更新日志请查看 [CHANGELOG.md](./CHANGELOG.md)
