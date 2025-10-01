# 导入与导出规则

本文档说明命令数据的导入与导出格式、字段别名支持、重复项处理与有效性校验，帮助你在不同来源之间稳定迁移命令片段。

## 导出格式

导出为一个命令对象数组（JSON），日期为 ISO 字符串：

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

> 提示：桌面环境通过 Tauri 原生对话框保存，浏览器环境自动触发下载。导出文件包含当前列表的所有命令。

## 导入格式与别名

支持两种外部 JSON 结构：

1) 顶层数组
```json
[
  { "title": "A", "command": "echo A" },
  { "title": "B", "command": "echo B" }
]
```

2) 对象包裹（`{ commands: [] }`）
```json
{
  "commands": [
    { "title": "A", "command": "echo A" },
    { "title": "B", "command": "echo B" }
  ]
}
```

字段别名支持：
- 标题：`title` 或 `name`
- 命令：`command` 或 `cmd` 或 `shell`
- 简介：`description` 或 `desc`

可选字段：
- `tags`: 字符串数组
- `favorite`: 布尔值

> 注意：`id/createdAt/updatedAt` 等字段在当前导入流程中不参与落库；导入时会生成新的 `id`，并以当前时间设置 `createdAt/updatedAt`。

## 校验与重复项处理

有效性校验：
- `command` 必须为非空字符串；
- `title`（或 `name`）必须为字符串；
- `tags`（如果提供）应为字符串数组；
- `favorite`（如果提供）应为布尔值；

重复项判定：
- 以 `command` 字段为唯一键进行去重（即相同命令文本视为重复，不再添加）。

结果反馈：
- 导入完成后会提示新增条数、重复条数与无效条数，便于确认本次合并效果。

## 桌面与浏览器差异

- 桌面（Tauri）：使用原生文件打开/保存对话框；路径选择由系统负责；若导入失败，弹窗提示错误信息。
- 浏览器：使用文件输入选择器；解析内容并按上述规则合并；结果在页面内以消息形式提示。

## 示例：包含别名与重复项

```json
[
  { "name": "列目录", "cmd": "ls -la", "desc": "查看隐藏文件" },
  { "title": "列目录", "command": "ls -la" },
  { "title": "打印Hello", "shell": "echo hello" },
  { "title": 123, "command": "invalid" }
]
```

导入结果：
- 新增：2（`ls -la` 和 `echo hello`）
- 重复：1（重复的 `ls -la`）
- 无效：1（`title` 非字符串）

## 常见问题与扩展

- 如何按“标题 + 命令”去重？
  - 目前版本按 `command` 去重以避免不同来源下标题小差异导致重复。若你需要更严格或更宽松的策略（例如按 `title+command`、按 `title` 或按哈希），我可以在导入逻辑中增加配置开关。
- 能否保留原导入数据的 `createdAt/updatedAt`？
  - 目前不会保留（统一以当前时间记录导入），以保持新合并项时间线清晰。如果你更希望保留历史时间戳，我可以扩展导入逻辑支持保留或按最早时间回填。
- 标签是否会合并？
  - 导入时会直接写入外部数据携带的标签；若存在同名命令的重复项，不会合并标签到已有项中（避免意外覆盖），但可以根据你的偏好增加“合并标签”选项。

## 参考实现位置

- `src/views/HomeView.vue`：`mergeImportedList` 函数实现了解析、别名映射、去重与结果反馈。
- `src/stores/commandStore.ts`：`addCommand` 会生成新的 `id` 与时间戳，并写入 `localStorage`。