# kreiitor · 研究札记

基于 Astro、Tailwind CSS、Pagefind 与 KaTeX 的静态个人博客。

## 本地开发

需要 Node.js 22.12 或更新版本。

```sh
npm ci
npm run dev
```

访问 http://localhost:4321 。

## 验证与构建

```sh
npm run check
npm run test:unit
npm run build
npm run preview
```

`build` 后会自动生成全文搜索索引，并校验页面只有一个一级标题、没有公式错误、内部链接和锚点有效。搜索应在构建后的预览或已部署的网站验证，开发服务器不生成索引。

阅读体验重构的实现说明、最终性能对比和根路径／子目录验收记录见 [重构记录](docs/REFACTOR-2026-10-13.md)。

有 Chrome 的环境可用 `npm run test:browser` 验证搜索、键盘、分页、分节深链接、代码复制与主要屏幕断点。截图和失败记录保存在忽略的 `.artifacts/`。

模拟 GitHub Pages 子目录部署（PowerShell）：

```powershell
$env:BASE_PATH = '/kreiitorBlog'
npm run build
npm run preview
```

此时访问 http://localhost:4321/kreiitorBlog/ 。恢复普通开发前执行 `Remove-Item Env:BASE_PATH`。

## 内容维护

文章位于 `src/content/posts/`，学习系列资料位于 `src/content/series/`，项目位于 `src/content/projects/`。身份与联系方式集中在 `src/data/site.ts`。随笔、Agent / Infra 学习系列与项目的完整添加示例见 [内容维护指南](docs/CONTENT.md)。

文章示例：

```yaml
---
title: 文章标题
description: 一段简短摘要
pubDate: 2026-10-11
tags:
  - 学习理论
category: course
series: fods
order: 0
cover: /covers/post-math.svg
---
```

- `category`：`writing`（默认）、`knowledge` 或 `course`。
- `series` 对应 `src/content/series/` 中的文件名；`order` 决定同系列阅读顺序。学习章节必须填写这两个字段。
- `draft: true`：不生成详情页，不进入搜索、RSS、归档与标签。
- `featured: true`：进入首页精选。
- 支持 `$...$` 行内公式与 `$$...$$` 公式块。
- Markdown 中以 `/` 开头的内部链接自动适配部署子目录。

SVG 插画和封面在 `public/` 中维护，不依赖外部图片服务。字体资产与 Fontsource 代码字体随网站构建部署，按字符范围按需加载；系统中文字体作为最终回退，读者访问网站时不需要连接 Google Fonts。

标题与阅读正文使用 Source Serif 4 / 思源宋体，界面使用 DM Sans / 系统中文字体，代码使用 IBM Plex Mono。中文宋体按当前语料生成常规与强调子集，界面不下载另一套中文字体。字体层级与字号在 `src/styles/global.css` 中统一维护；代码与数学字体样式仅随阅读页面加载。

长文自动按小节和完整段落生成静态阅读分节，原文章地址作为第一节。代码块、表格、公式和 MathML 保持完整；全文目录可跨节跳转，原有正文锚点会转到相应分节。博客以学习专题与紧凑列表组织内容，每页展示 12 篇独立札记。

字体的 SIL Open Font License 原文保留在 `public/fonts/licenses/`。

中文语料子集、Source Serif 4 字重裁剪与维护方式见 `docs/FONTS.md`。

分享预览使用 1200×630 PNG，站内封面保留 SVG。修改封面后运行 `npm run social:prepare` 更新分享图。

## 评论

复制 `.env.example` 为 `.env`，配置 Giscus 仓库和分类 ID。没有完整配置时，文章页显示邮件交流入口。评论接近阅读末尾才加载；同一篇文章的各分节共享原始路径对应的讨论。GitHub Pages 使用仓库 Variables 中的 `PUBLIC_GISCUS_REPO`、`PUBLIC_GISCUS_REPO_ID`、`PUBLIC_GISCUS_CATEGORY`、`PUBLIC_GISCUS_CATEGORY_ID`；本地 `.env` 不应提交。

## 部署

推送到 `main` 或 `master` 自动执行 `.github/workflows/deploy.yml`。在 GitHub 仓库 Settings → Pages 选择 GitHub Actions。

工作流自动设置站点域名与仓库子目录。自定义域名可通过仓库变量 `SITE_URL` 和 `BASE_PATH` 调整。

## 发布审阅

本次内容整理记录见 `docs/publication-review.json` 和 `docs/PUBLICATION.md`。记录只包含文件名、处理类型与数量，不包含原始敏感值。
