---
title: "Obsidian 附件管理与审计"
description: "整理 Obsidian 附件目录、命名和引用检查的规则，以及一次附件审计的方法。"
pubDate: 2026-10-26
tags:
  - "Obsidian"
  - "知识管理"
  - "工具"
category: knowledge
cover: /covers/post-tools.svg
draft: true
---

## 当前规则

仓库里能直接找到的实现是 `attachment-management` 插件配置：

| 配置项 | 当前值 |
| --- | --- |
| 附件根目录 | `figures` |
| 保存方式 | `inFolderBelow` |
| 附件路径 | `${notename}` |
| 文件名格式 | `${originalname}` |
| 自动重命名 | 关闭 |
| 自动更新链接 | 开启（Obsidian `app.json` 的 `alwaysUpdateLinks`） |

在插件 `main.js` 里没有找到生成 `_unreferenced` 的逻辑；这个目录更像是手工整理或旧脚本留下的，不是当前插件自动维护的。

## 删除前审计结果（2026-10-24）

- `figures/` 共 1,290 个文件：1,285 张图片、5 个 PDF。
- 被笔记引用过的图片/PDF 文件名：625 个。
- 未被引用的图片：**693 张，150.6 MB**，全部在 `figures/_unreferenced/`。
- `_unreferenced` 里被引用的图片：**0 张**，说明这个目录的分类是准确的。
- 文件名里带 2 个以上日期后缀的图片：**466 张**。
- 有图片引用的笔记：22 篇；图片引用落在“当前笔记路径对应的 figures 子目录”里的只有 6 处，其余 1,702 处仍在旧路径。

全库 26 个 PDF 中，只有 1 个此前没有被任何笔记引用（一本 C++ 参考书，64.2 MB）。现在已在相关学习笔记中建立链接。

## 2026-10-24 执行记录

- 已把规则改为 `${notename}` / `${originalname}` / `autoRenameAttachment: false`。
- 已删除 693 张未被引用的图片，共 150.6 MB；删除前逐一确认引用数为 0。
- 删除清单（路径、大小、SHA-256）已归档到内部审计目录。
- `figures/_unreferenced/` 已清空并移除；`figures/` 剩余 597 个文件（592 张图片 + 5 个 PDF）。
- 删除后复查：0 个断开的图片/PDF 引用。

## 发现的问题

1. **自动重命名会不断追加日期后缀。** `${originalname}-${date}` 加上 `autoRenameAttachment: true`，每次附件被移动或重新保存都会再加一段日期。466 张图片已经出现重复后缀，之前 CS336 和 CSAPP 的断图就是这个原因。
2. **`${notepath}/${notename}` 和笔记路径强耦合。** 笔记改名或换文件夹时，插件会把附件一起搬走并重命名；这就是一次目录重命名后图片被迁移、后缀继续增加的原因。
3. **旧附件没有跟着新路径走。** 现在 1,702 处图片引用仍在旧目录。Obsidian 按文件名解析，所以链接还能用；但“附件应该在同名笔记目录下”这个规则已经不可靠。
4. **`_unreferenced` 的筛选是准确的。** 693 张图片都没有被引用，也没有哈希重复；已按确认删除，清单留档。
5. **文件名唯一性是当前还能正常显示的原因。** 全库图片没有重名；一旦以后出现同名附件，按文件名解析就可能指错。

## 已应用配置

2026-10-24 已应用：

```json
{
  "attachmentRoot": "figures",
  "saveAttE": "inFolderBelow",
  "attachmentPath": "${notename}",
  "attachFormat": "${originalname}",
  "autoRenameAttachment": false
}
```

含义：

- `attachmentPath` 只用 `${notename}`，不再绑定完整笔记路径；笔记换文件夹时附件不会跟着搬。
- `attachFormat` 不再追加日期；重名时让 Obsidian 自己加数字后缀。
- `autoRenameAttachment` 关闭，避免每次移动都重命名已有附件。
- `alwaysUpdateLinks` 保持开启。

如果你更希望附件跟着笔记走，可以保留 `${notepath}/${notename}`，但至少要把 `attachFormat` 改成 `${originalname}` 并关闭自动重命名。

这次只改规则并删除未引用图片，没有批量重命名 592 张仍被引用的图片。

## 清理建议

- 693 张未引用图片已于 2026-10-24 删除，清单在内部审计归档目录；如需找回，可从 Git 历史恢复。
- **不要批量重命名 466 个重复后缀文件。** 会牵动大量链接和 PDF++ 批注；规则已经改稳定，建议保留现状。
- 如果确实要清理，先导出 `_unreferenced` 的文件清单，按目录（CSAPP 截图、C++ 提取图、旧版笔记配图）分组人工确认。
- 新的截图和 PDF 标注按新规则进入 `figures/`，不要再手工搬到笔记旁边。

## 结论

- 图片链接本身是能用的，`_unreferenced` 的判断也是准确的。
- 但当前的附件路径规则没有真正“用对”：大部分附件不在当前笔记对应的目录下，自动重命名还在制造重复后缀。
- `autoRenameAttachment` 和日期后缀已停掉；693 张未引用图片已删除，问题不再扩大。
