# kreiitor · 研究札记

基于 Astro、Tailwind CSS、Pagefind 与 KaTeX 的静态个人博客。

当前视觉采用群青蓝、朱橙与暖纸白；宋体大标题、非对称精选、横向学习索引与项目展示组成编辑式研究作品集。几何 K 标记、明暗主题与交互反馈沿用同一套视觉语言。设计取舍和技能应用见 [视觉精修记录](docs/DESIGN-REFINEMENT-2026-10-16.md)，此前版本见 [视觉设计记录](docs/VISUAL-DESIGN-2026-10-15.md)。

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

温暖数字花园的视觉、交互与功能优化已落地。设计取舍见 [方案](docs/WARM-DIGITAL-GARDEN-PLAN.md)，实现、验收和当前单页性能数据见 [实施记录](docs/WARM-DIGITAL-GARDEN-IMPLEMENTATION.md)。

下一轮重构方向（暗色模式、颜色与间距令牌化、目录升到 h3、脚注等）见 [重构方向](docs/REFACTOR-2026-10-14.md)；它的证据基座是对 53 个个人站点的实地抓取与源码取证，见 [站点实测研究](docs/SITE-STUDY-2026-10-14.md)。

有 Chrome 的环境可用 `npm run test:browser` 验证快捷搜索与焦点、搜索重试、评论配置与失败恢复、公式滚动、阅读记录、打印、列表分页、全文锚点、代码复制与主要屏幕断点。截图和失败记录保存在忽略的 `.artifacts/`。

2026-10-15 的滚动稳定性、可读性、字体加载与封面优化见 [优化记录](docs/OPTIMIZATION-2026-10-15.md)。

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

标题使用 Lora / 思源宋体，阅读正文使用 Source Serif 4 / 思源宋体，界面使用 DM Sans / 系统中文字体，代码使用 JetBrains Mono。中文字体按当前语料生成子集，界面不下载另一套中文字体。字体层级与字号在 `src/styles/global.css` 中统一维护；数学字体样式仅随阅读页面加载。

每篇文章完整呈现在同一页面，保留正文、MathML、原有地址和章节锚点。目录、浏览器查找、复制和打印沿用全文阅读。博客列表仍按学习专题与紧凑条目组织，每页展示 12 篇独立札记。

文章页可主动开启本机阅读记录，保存最近章节与近似进度，并提供继续、清除和关闭入口。数据只保存在当前浏览器的 localStorage；带明确锚点的链接优先定位到该章节。顶部搜索或 Ctrl/Cmd K 打开快捷搜索，Escape 关闭并恢复焦点；查询与完整搜索页共享。

字体的 SIL Open Font License 原文保留在 `public/fonts/licenses/`。

中文语料子集、Source Serif 4 字重裁剪与维护方式见 `docs/FONTS.md`。

分享预览使用 1200×630 PNG，站内封面保留 SVG。图形原稿集中在 `scripts/prepare-garden-art.mjs`；运行 `npm run art:prepare` 重建主题封面与分享图，手动编辑 SVG 后运行 `npm run social:prepare`。未指定封面时根据文章标识和栏目选择默认图，显式配置的封面始终优先。

30 张统一风格的封面与内容起始模板见 [封面库使用说明](docs/COVERS.md)，可打开 [离线选图册](docs/cover-catalog.html) 筛选并复制配置。新增专题直接设置 `cover` 和 `icon`，无需修改页面组件。

## 评论

站点默认沿用原有 Giscus 的公开仓库、分类 ID，无需本地 `.env` 即可显示评论。需要切换仓库时，复制 `.env.example` 为 `.env` 并完整替换对应配置；GitHub Pages 通过同名仓库 Variables 覆盖 `PUBLIC_GISCUS_REPO`、`PUBLIC_GISCUS_REPO_ID`、`PUBLIC_GISCUS_CATEGORY`、`PUBLIC_GISCUS_CATEGORY_ID`。这些 ID 为公开配置；本地 `.env` 不应提交。各项变量的含义与 `REPO_ID` / `CATEGORY_ID` 的获取步骤见 `.env.example` 的注释，配置本身可在 https://giscus.app 生成。

评论接近阅读末尾才连接，原路径对应的讨论关联保持一致。加载中、失败与重试状态可见，邮件交流入口始终保留。公开部署使用 `public/giscus-garden.css` 为 iframe 设置花园主题；localhost 预览使用 Giscus 内置 light 主题，避免请求尚未发布的样式。自定义域名需同时正确设置 `SITE_URL` 与 `BASE_PATH`。

## 部署

推送到 `main` 或 `master` 自动执行 `.github/workflows/deploy.yml`。在 GitHub 仓库 Settings → Pages 选择 GitHub Actions。

工作流自动设置站点域名与仓库子目录。自定义域名可通过仓库变量 `SITE_URL` 和 `BASE_PATH` 调整。

## 发布审阅

本次内容整理记录见 `docs/publication-review.json` 和 `docs/PUBLICATION.md`。记录只包含文件名、处理类型与数量，不包含原始敏感值。
