---
title: "Obsidian 附件管理与审计"
description: "整理 Obsidian 附件目录、命名与引用检查规则，以及避免断链和重复后缀的审计方法。"
pubDate: 2026-10-26
tags:
  - "Obsidian"
  - "知识管理"
  - "工具"
category: knowledge
cover: /covers/post-tools.svg
draft: true
---

## 推荐配置规则

以 Obsidian 的 `attachment-management` 插件配置为例，建议将附件规则固定为“按笔记名分目录、保留原始文件名、关闭自动重命名”：

| 配置项 | 推荐值 |
| --- | --- |
| 附件根目录 | `figures` |
| 保存方式 | `inFolderBelow` |
| 附件路径 | `${notename}` |
| 文件名格式 | `${originalname}` |
| 自动重命名 | 关闭 |
| 自动更新链接 | 开启（Obsidian `app.json` 的 `alwaysUpdateLinks`） |

对应的插件配置片段如下：

```json
{
  "attachmentRoot": "figures",
  "saveAttE": "inFolderBelow",
  "attachmentPath": "${notename}",
  "attachFormat": "${originalname}",
  "autoRenameAttachment": false
}
```

各配置项的作用：

- `attachmentPath` 只使用 `${notename}`，不绑定完整笔记路径；移动笔记目录时，附件不会跟着整体迁移。
- `attachFormat` 只保留 `${originalname}`，不再额外拼接日期；若出现重名，交由 Obsidian 自动追加数字后缀。
- 关闭 `autoRenameAttachment`，避免每次移动或重新保存笔记时都触发附件重命名。
- 保持 `alwaysUpdateLinks` 开启，确保手工调整路径时 Markdown 链接能够同步更新。

若更希望附件始终跟随笔记所在的完整文件夹层级，可以保留 `${notepath}/${notename}`，但仍建议将 `attachFormat` 改为 `${originalname}` 并关闭自动重命名。

## 常见问题与成因

1. **自动重命名持续追加日期后缀**
   若同时启用 `${originalname}-${date}` 与 `autoRenameAttachment: true`，每次笔记移动或附件重新保存都会追加一段日期，久而久之形成多重重复后缀并增加断链风险。

2. **`${notepath}/${notename}` 与目录层级强耦合**
   一旦笔记重命名或调整文件夹，插件会顺带搬移并重命名附件；历史引用往往未能全部同步，导致旧附件滞留在旧目录中。

3. **靠文件名唯一定位掩盖了路径漂移**
   只要全库图片没有重名，Obsidian 默认的最短路径解析通常还能正常显示图片；但一旦出现同名附件，仅靠文件名解析就可能指向错误文件，因此不应把“仍能显示”当成目录规则有效的证据。

4. **旧手工目录难以直接纳入插件管理**
   诸如早年脚本或手工整理留下的 `_unreferenced` 等目录，插件本身通常没有对应生成逻辑，继续保留容易与新规则混杂。

## 审计与清理流程

定期整理仓库附件时，建议按以下步骤执行，避免一次性批量操作引入大规模断链：

1. **先建全库引用索引，再筛未引用文件**
   扫描全库 Markdown 笔记与 PDF 批注中的所有附件引用，再与 `figures/` 下的图片和 PDF 文件对照，确认引用次数严格为 0 后再纳入待删清单。

2. **记录清单与校验和**
   删除前导出文件路径、体积和 SHA-256 校验和作为审计清单并备份（或确认可通过 Git 历史找回），删除后再复查一遍确认零断链。

3. **分类核对而非盲删**
   对待清理列表按来源（例如课程截图、论文附图、早期笔记配图、本地参考 PDF）分组抽查，尤其单独确认大体积 PDF 是否仍需要在相关笔记中补充链接。

4. **不要批量重命名已稳定引用的历史附件**
   对已经带有多重日期后缀、但仍在笔记或 PDF 批注中被正常引用的旧文件，建议保留现状，只在增量内容上严格执行新规则；批量改名容易波及大量 Markdown 链接和外部批注索引。
