# 添加与维护内容

首页固定为四个区块：精选思考、项目实践、成体系学习笔记、最近写下。新增内容通过 Markdown 资料自动进入页面，不需要逐个修改页面代码。

## 随笔与独立知识笔记

在 `src/content/posts/` 新建文件，例如 `my-new-note.md`：

```yaml
---
title: 一篇新的随笔
description: 用一两句话说明这篇文章在讨论什么。
pubDate: 2026-10-12
tags: [研究思考]
category: writing
draft: true
featured: false
---
```

下面直接写 Markdown 正文。将 `draft` 改成 `false` 后进入博客、归档、标签、RSS 和搜索；`featured: true` 的文章按发布日期进入首页精选（最多三篇）。`category: knowledge` 用于独立知识笔记，也会进入学习页的实践知识库。

正文从 `##` 开始，页面一级标题由 frontmatter 的 `title` 提供。块公式起止的 `$$` 各占一行；带 `\tag` 编号的公式必须使用块公式。构建会检查标题与 KaTeX 错误。代码块内的 `#` 和 `$` 不受这一约定影响。

长文章整篇渲染在一个页面里，阅读过程连续，正文内锚点和原文章深链接都指向同一页面；文章不会按小节拆成多个网址，也不需要增加 Markdown 文件或调整系列 `order`。发布日期保留真实记录，不需要为了列表视觉分散日期。

`facts` 用于原书页数、学习范围等补充信息，篇数由文章集合自动计算。项目尚未公开时可以省略 `repoUrl` / `demoUrl`，不要使用占位链接。

## 一组学习笔记，例如 Agent 或 Infra

先在 `src/content/series/` 新建系列资料。文件名使用小写英文、数字和连字符；文件名就是系列标识与目录网址。下面是示例，不会自动发布占位系列。

`src/content/series/agent.md`：

```yaml
---
title: Agent 学习笔记
englishTitle: Agents & Workflows
description: 从基本概念到工作流设计，记录理解、实验与复盘。
emblem: ↳
order: 10
facts: 概念与实践
---
```

`src/content/series/infra.md`：

```yaml
---
title: AI Infra 学习笔记
englishTitle: AI Infrastructure
description: 围绕训练、推理与部署，逐步整理基础设施知识。
emblem: ∞
order: 20
---
```

只有 `title` 和 `description` 必填。`englishTitle`、`emblem`、`facts`、`sourceNote` 可选，`order` 默认为 0，用于多个系列的展示排序。可在 YAML 之后写 Markdown 学习目标或路线，它会显示在目录页章节列表之前。

再在 `src/content/posts/` 新建章节，例如 `agent-overview.md`：

```yaml
---
title: Agent：学习地图
description: 学习目标、知识主线与实践安排。
pubDate: 2026-10-12
tags: [Agent]
category: course
series: agent
order: 0
draft: true
---
```

后续章节填写相同的 `series: agent`，`order` 依次为 1、2、3……。Infra 的章节填写 `series: infra`。两个 `order` 的含义不同：系列资料中的值决定系列展示顺序，章节中的值决定组内阅读顺序。

至少一篇章节发布后，系列自动出现在学习页 `/notes/`，并生成 `/notes/agent/` 或 `/notes/infra/`。首页按系列排序展示前三组，全部系列通过“全部学习专题”查看。资料存在但尚无已发布章节时不显示空目录。章节数量自动统计已发布笔记，正文顶部显示实际所属系列，返回目录及上一篇/下一篇只链接同组的已发布内容。原有 `/blog/fods-…/` 文章地址保持有效。

学习章节缺少 `series` / `order`、引用未配置系列或同组已发布章节序号重复时，检查或构建会报错并说明位置；草稿不参与目录和相邻章节导航。

## 隐藏页图片

隐藏页位于 `/gallery/`，入口是“关于”页右侧标志连续点击三次。新增图片分两步：

1. 把图片放入 `public/gallery/`。文件名可以使用中文，但应避免空格和特殊符号；推荐 JPG 或 WebP，并在提交前适当压缩。
2. 打开 `src/pages/gallery.astro`，在 `photos` 数组中加入一项：

```js
{ file: '新的图片.jpg', title: '显示在图片下方的标题' },
```

数组顺序就是页面展示顺序。当前第三张图会横跨两列；如需调整宽图位置，同时修改模板里的 `i === 2`。

## 项目说明

在 `src/content/projects/` 新建文件，例如 `my-project.md`：

```yaml
---
title: 我的项目
summary: 这个项目解决什么问题，当前做到哪里。
pubDate: 2026-10-12
tags: [实验工具]
status: 规划中
featured: false
repoUrl: https://github.com/kreiitor/your-repository
---
```

正文可包含背景、方法、使用方式、结果与后续计划。`status` 取“规划中”“进行中”或“已完成”；`repoUrl`、`demoUrl`、`cover` 可选。项目自动进入项目列表、标签和搜索；首页展示最新的两个 `featured: true` 项目。项目目前没有草稿字段，未准备发布的文件请保存在内容目录之外。

## 正文里可用的三种结构

以下三种都只需写 Markdown / 原生 HTML，站点已备好样式与语义。

### 脚注

用 `[^1]` 标注、`[^1]: ` 定义，文末会自动集中成带返回链接的脚注区：

```markdown
这一点有争议[^1]。

[^1]: 来源与补充说明。
```

引用标记的 `aria-describedby` 会指向文末标签，读屏可用。文末标签被刻意渲染成 `<p>` 而非 `<h2>`，**不会进入页内目录**（目录取 h2/h3，若用 h2 会多出一个假条目）。

### 图注

正文是 `.md`，不能使用 Astro 组件；但原生 HTML 会被放行，因此直接写：

```html
<figure>
  <img src="/covers/post-math.svg" alt="用文字描述图的内容，供读屏与图片加载失败时使用" width="800" height="420">
  <figcaption>短句说明放在这里；更长的解释写进 title，别和 alt 重复。</figcaption>
</figure>
```

三段分工（取自实测中图注做得最扎实的站点）：**短句进 `<figcaption>`，长解释进 `title`，无障碍描述进 `alt`**，三者互不重复。`width`/`height` 必填以防布局抖动。

### 长附录折叠

原始数据表、超长清单、逐条考证这类内容，用 `<details>` 收起，正文只留一句摘要（范式取自把「424 条失效博客」整张表塞进折叠区的做法）：

```html
<details>
  <summary>展开完整对照表</summary>

  | 列 A | 列 B |
  | --- | --- |
  | … | … |

</details>
```

`<details>` 内部有独立的纵向节奏（它不受正文 owl 规则影响，因为那条规则只作用于直接子元素）。

## 本地验证与发布

```sh
npm run check
npm run build
npm run preview
```

添加内容后先检查本地预览。只有明确准备发布时才提交并推送到 GitHub；构建本身不会提交或发布。新标题的字体自动使用完整回退，合并字体子集可以在内容定稿后统一更新，见 `docs/FONTS.md`。

在 `master` 分支发布时，可以依次执行：

```sh
git status
git add src/content/posts/ public/gallery/ src/pages/gallery.astro
git diff --cached
git commit -m "Add new writing and gallery photos"
git push origin master
```

`git status` 用来确认改动范围；`git diff --cached` 用来在提交前复核将要发布的内容。若只新增文章或只新增图片，就从 `git add` 中删掉无关路径。推送后可在 GitHub 仓库的 Actions 页面查看 `Deploy Astro site`，必须等 build 和 deploy 两个 job 都成功，网站才算发布完成。
