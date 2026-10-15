# 封面库与新增内容

封面库包含 30 张独立构图，可供文章、学习专题和项目复用。打开同目录的 [离线选图册](cover-catalog.html)，按用途筛选或搜索，点击卡片的复制按钮即可取得 `cover: /covers/…svg`。选图册内嵌图片，无需启动网站或联网；复制受浏览器限制时会选中文本，手动复制即可。

## 直接新增内容

三个可复制的起始文件在 `docs/templates/`：

- `article.md` → 复制到 `src/content/posts/你的文章标识.md`。修改标题、日期、标签和封面；完成前保持 `draft: true`。
- `series.md` → 复制到 `src/content/series/你的专题标识.md`。设置专题封面、图标和展示顺序。
- `chapter.md` → 复制到 `src/content/posts/你的章节标识.md`。`series` 填专题文件名，`order` 为组内顺序；至少发布一章后，专题自动出现在学习页。

例如，建立一组深度学习笔记：

```yaml
# src/content/series/deep-learning.md
---
title: 深度学习：从模型到实验
englishTitle: Deep Learning
description: 沿模型、训练与实验这条主线逐步展开。
cover: /covers/series-deep-learning.svg
icon: branch
order: 10
---
```

```yaml
# src/content/posts/deep-learning-overview.md
---
title: 第一章：学习地图
description: 梳理前置知识、章节路线与实验目标。
pubDate: 2026-10-15
tags: [深度学习]
category: course
series: deep-learning
order: 0
draft: true
---
```

专题的 `cover` 同时用于首页/学习页专题卡片、专题目录和分享预览；`icon` 可选 `book`、`branch`、`layers`，默认 `book`。不填封面时使用通用研究专题封面。章节正文继续保持紧凑、无大封面的阅读布局；章节分享图优先使用自身 `cover`，未填写时继承专题封面。无需在每章重复配置同一张图。

普通文章与项目仍通过自己的 `cover` 字段选图。图片用途分组仅供选择参考，没有栏目限制；可以跨组复用适合主题的构图。外部自定义图片路径保持兼容，本地 SVG 分享需要同名 PNG。

显式填写的文章 `cover` 始终优先，不会因为文件名含某个关键词而被自动替换。

构建也会检查同站分享图片是否存在，避免选了 SVG 却漏掉对应 PNG。

## 储备主题

| 主题 | 可直接使用的文件 |
| --- | --- |
| 概率与不确定性 | `/covers/post-probability.svg` |
| 优化与训练 | `/covers/post-optimization.svg` |
| 神经网络与表示 | `/covers/post-neural-network.svg` |
| 检索与 RAG | `/covers/post-retrieval.svg` |
| 数据流程与处理 | `/covers/post-data-pipeline.svg` |
| 数据库与存储 | `/covers/post-database.svg` |
| 分布式系统 | `/covers/post-distributed-systems.svg` |
| 模型评估 | `/covers/post-evaluation.svg` |
| 数学专题 | `/covers/series-mathematics.svg` |
| 深度学习专题 | `/covers/series-deep-learning.svg` |
| 系统专题 | `/covers/series-systems.svg` |
| 研究方法专题 | `/covers/series-research.svg` |

另有语言模型、算法、C++/Python/Rust/Go、Git、工具、论文阅读、学习路线、AI Agent/Infra、实验基准与论文复现等既有封面。完整清单由 `src/data/cover-catalog.json` 维护，选图册从此清单自动生成。

## 美术规范与维护

- 原稿为 800×420，分享图为 1200×630。站内保持原比例，避免裁切标题与构图。
- 背景统一 `#f6f3eb`，内层纸片使用 `#fbf9f3` / `#f0eee6`。不以整片橙绿底区分主题。
- 标题基线 y66、左边距 40；分割线 y88。主图置于 x32–768、y100–392 安全区，保留底部留白。
- 结构线用鼠尾草绿，陶土色只突出少量节点、方向或结论。通过实虚线、线粗、纸片叠层和辅助构造线产生层级，不增加密集小字。
- 单张封面描绘一个主题关系。新主题应有独立构图，而非只替换标题和颜色。

在 `scripts/prepare-garden-art.mjs` 中新增主题构图和标题，在 `src/data/cover-catalog.json` 登记同名条目，然后运行：

```sh
npm run art:prepare
npm run check
npm run build
```

`art:prepare` 一次生成 SVG、同名分享 PNG、favicon 与离线选图册。只更新选图册时运行 `npm run covers:catalog`。正文与专题选用已存在的封面时，不需要重新生成图片。普通构建不会下载字体或调用外部图片服务。
