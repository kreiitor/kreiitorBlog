# kreiitor · 研究札记

基于 Astro 7、Tailwind CSS 4、Pagefind、KaTeX 与 Giscus 的静态研究博客与作品集。文章、学习专题和项目分别由 `src/content/posts/`、`src/content/series/`、`src/content/projects/` 下的 Markdown 驱动，构建后是纯静态页面。

站点以个人研究和写作为中心。配色取自宣纸、黛色与朱砂：浅色主题是暖白纸底配深黛文字，朱砂只用在按钮、当前项和少量焦点上，松石绿用于栏目标签；首页主视觉与页脚是深黛色区块（`.dark-island` 让区块内的令牌取暗色值），主视觉中的「线索」画布由 `src/utils/threads.ts` 绘制，只在可见时运行，减少动态效果时停在静止帧。文章阅读页保持低调：窄栏衬线正文、发丝线分隔、目录当前项用朱砂细线标记。标题使用 Lora / 思源宋体，界面使用 DM Sans 与系统中文无衬线字体，正文使用 Source Serif / 思源宋体，代码使用 JetBrains Mono；明暗两套主题的令牌集中在 `src/styles/global.css` 顶部。

这份 README 是当前唯一需要维护的项目文档；提交前请先阅读根目录的 [AGENTS.md](AGENTS.md)。历史设计稿、审查报告和迭代记录已移除；需要追溯时查看 Git 历史。

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

`build` 会依次注入标题永久链接、生成 Pagefind 索引，并运行 `scripts/check-site.mjs` 校验每页单一 H1、KaTeX 错误、站内链接与锚点，以及同站分享图是否存在。搜索索引只在构建产物中生成；要验证搜索，请使用 `npm run preview` 或部署后的网站。

完整验证只在批次收尾或发布前跑一次，不要每改一个文件就全量执行。快速迭代时可以用：

```sh
npm run check:watch          # 首次检查后增量检查
npm run test:browser:fast    # 2 个 worker 跑浏览器回归
npm run test:browser:changed # 只跑与当前改动相关的测试文件
npm run build:fast           # 只构建页面，跳过 Pagefind、锚点与站内检查
npm run style:check          # 插图与文字的风格体检，只报告不改动
```

`build:fast` 的产物没有搜索索引和标题永久链接，只适合快速看页面；发布前仍要跑完整的 `npm run check && npm run test:unit && npm run build`。`preview` 本身只是启动静态服务器，耗时主要来自之前的构建，不需要额外加速。

有 Chrome 的环境可以运行 `npm run test:browser`，覆盖快捷搜索与焦点、评论失败恢复、公式滚动、阅读记录、打印、分页、全文锚点、代码复制和主要断点。测试失败截图保存在被忽略的 `.artifacts/`。

模拟 GitHub Pages 子目录部署（PowerShell）：

```powershell
$env:BASE_PATH = '/kreiitorBlog'
npm run build
npm run preview
```

此时访问 http://localhost:4321/kreiitorBlog/ 。恢复普通开发前执行 `Remove-Item Env:BASE_PATH`。

## 项目结构

```text
src/content/posts/      文章、学习章节
src/content/series/     学习专题
src/content/projects/   项目
src/data/site.ts        身份、首页精选配置
src/data/cover-catalog.json  封面元数据
src/pages/              页面路由
src/components/         页面组件
src/styles/global.css   颜色、间距、字体层级与组件样式
src/styles/fonts.css    自托管字体声明
public/covers/          SVG 封面与同名分享 PNG
public/figures/         正文自绘 SVG 插图
public/gallery/         画廊原图与优化候选图
docs/templates/         文章、章节、专题、项目模板
docs/cover-catalog.html 离线封面选图册
scripts/                构建、资源生成与校验脚本
```

## 内容维护

### 文章 frontmatter

```yaml
---
title: 文章标题
description: 用一两句话说明文章讨论什么。
pubDate: 2026-10-18
tags: [研究思考]
category: writing
cover: /covers/post-paper.svg
draft: true
featured: false
---
```

必填字段是 `title`、`description`、`pubDate`、`tags`。其余字段：

- `category`：`writing`（默认）、`knowledge` 或 `course`。
- `series`：对应 `src/content/series/` 中的文件名；学习章节必须填写。
- `order`：系列内阅读顺序；学习章节必须填写，同一系列已发布章节不能重复。
- `draft: true`：不生成详情页，不进入博客列表、归档、标签、RSS 与搜索。
- `featured: true`：进入首页精选候选。注意首页先使用 `src/data/site.ts` 的 `homeFeaturedPosts`；该列表当前有 3 项并且正好占满首页 3 个位置，因此在列表不变的情况下，单独设置 `featured` 不会改变首页。
- `updatedDate`：可选，更新日期。
- `readingTime`：可选，整数分钟数；不填时按正文中文字符与英文词估算。

`category: knowledge` 的独立笔记会进入学习页的“实践知识库”。`category: course` 必须同时填写 `series` 和 `order`，否则检查或构建会报错。

### 系列 frontmatter

```yaml
---
title: 学习专题标题
englishTitle: A Learning Path
description: 说明这组笔记的主线、范围和阅读对象。
cover: /covers/series-research.svg
icon: book
order: 10
facts: 从概念到实践
---
```

只有 `title` 和 `description` 必填。`englishTitle`、`cover`、`icon`、`emblem`、`facts`、`sourceNote` 可选；`order` 默认 0，用于学习页的专题排序。`icon` 可选 `book`、`branch`、`layers`。YAML 之后可以写 Markdown 学习路线，它会显示在目录页的章节列表之前。

系列文件名只能使用小写英文、数字和连字符。至少一篇章节发布后，专题才会出现在 `/notes/` 并生成 `/notes/<series>/`；草稿不参与目录和上一篇 / 下一篇导航。引用未配置的系列、已发布章节缺少 `order`，或同组 `order` 重复，构建会报错。

### 项目 frontmatter

```yaml
---
title: 项目名称
summary: 这个项目解决什么问题，当前做到哪里。
pubDate: 2026-10-18
tags: [实验工具]
status: 规划中
featured: false
cover: /covers/project-benchmark.svg
---
```

必填字段是 `title`、`summary`、`pubDate`、`tags`、`status`、`featured`。`status` 取“规划中”“进行中”或“已完成”。`repoUrl`、`demoUrl`、`cover` 可选；没有公开地址时直接省略，不要写占位链接。首页展示最新的两个 `featured: true` 项目。

项目没有草稿字段。未准备发布的 Markdown 文件可以放在内容目录中，但文件名必须以 `_` 开头；加载器会忽略这类文件。

### 正文约定

- 正文从 `##` 开始，页面 H1 由 frontmatter 的 `title` 提供；构建会拒绝正文中的一级标题。
- 支持 `$...$` 行内公式与 `$$...$$` 块公式。块公式的 `$$` 各占一行；带 `\tag` 编号的公式必须使用块公式。
- Markdown 中以 `/` 开头的站内链接会自动适配部署子目录。
- 脚注使用 `[^1]` 与 `[^1]: 说明`，构建会生成带返回链接的文末脚注区；脚注标签不会进入目录。
- 图注直接写原生 HTML。短句放 `<figcaption>`，长解释放 `title`，无障碍描述放 `alt`，三者不要重复；`width` / `height` 必须填写。
- 正文插图放在 `public/figures/<series>/`，优先自绘 SVG。文章页使用相对路径 `../../figures/...`，根路径和子目录部署都能解析。

  ```html
  <figure class="diagram">
    <img src="../../figures/ai-agent/agent-environment-loop.svg" alt="用文字描述图的内容" width="800" height="384" loading="lazy" decoding="async">
    <figcaption>短句说明。</figcaption>
  </figure>
  ```

- 长附录、原始数据表或超长清单可以放进 `<details><summary>展开</summary>…</details>`。

### 写作与发布

1. 从 `docs/templates/article.md`、`chapter.md`、`series.md` 或 `project.md` 复制起始文件。
2. 修改 frontmatter 与正文，完成前保持草稿状态（文章）或使用 `_` 前缀（项目 / 系列）。
3. 运行 `npm run check`、`npm run test:unit`、`npm run build`，并在 `npm run preview` 中检查实际页面。
4. 确认改动范围后提交并推送；构建本身不会提交或发布。

新增或修改正文后，如果出现字体子集未覆盖的生僻字，浏览器会使用系统宋体回退。内容定稿后可以统一更新字体子集，见下文“字体”。

## 首页与阅读功能

首页顺序为：首屏、站点概况、精选札记、学习专题、项目、最近写下与话题索引。精选、学习专题和项目分别由 `src/data/site.ts`、`src/content/series/` 和 `src/content/projects/` 配置。

每篇文章完整渲染在同一页面，保留正文、MathML、原地址和章节锚点。文章页提供 h2/h3 目录、浏览器查找、复制、打印和阅读进度；阅读记录需要读者主动开启，只保存在本机 `localStorage`。顶部搜索或 `Ctrl/Cmd K` 打开快捷搜索，查询与完整搜索页共享；`Escape` 关闭并恢复焦点。

标签通过 `src/utils/tags.ts` 的 `tagAliases` 归一化，例如 `cpp` → `C++`、`algorithms` → `算法`、`ai-infra` → `AI Infra`。

## 画廊

原图放在 `public/gallery/`。文件名可以使用中文，但应避免空格和特殊符号；**优化脚本只处理 `.jpg` / `.jpeg`**，新增照片请使用 JPEG。

新增一张照片：

1. 把 JPEG 放入 `public/gallery/`。
2. 在 `src/pages/gallery.astro` 的 `photos` 数组中增加一项，填写真实宽高：

   ```js
   { file: '新的图片.jpg', title: '显示在图片下方的标题', width: 1600, height: 1200 },
   ```

3. 运行 `npm run gallery:prepare`，在 `public/gallery/optimized/` 生成 WebP 与 AVIF 候选图。
4. 在预览中确认图片、说明和放大弹窗，然后提交 `public/gallery/`（包含 `optimized/`）。

画廊使用 CSS 多列瀑布流，点击照片打开大图弹窗，支持左右方向键、Esc 和关闭后恢复焦点。优化候选图的最长边为原图宽度与 1200px 中的较小值。

## 封面库

`public/covers/research/` 中有 5 张研究刊物风格的主题封面，覆盖研究评测、论文阅读、数学、系统和算法。封面为 2048×1152 的 WebP，同名分享 PNG 为 1200×630。

- 文章、项目和专题都可以用 `cover` 指定封面。原有内置 SVG 路径会按主题映射到新封面；其他显式配置的封面保持不变。
- 未指定时，文章按 `src/utils/content.ts` 的规则推断：文件名含 `infra`、阅读 / 论文类、算法 / 路线类、知识笔记分别使用对应默认图；其余文章使用通用论文封面。项目卡片未指定时使用 `/covers/project-benchmark.svg`。
- 学习专题的 `cover` 同时用于专题卡片、目录和分享预览；章节分享图优先使用自己的 `cover`，没有时继承专题封面。
- `cover` 始终影响卡片与分享图；`writing` 文章还会在正文顶部显示封面，`course` / `knowledge` 文章不插入装饰性大封面，项目详情页只在填写 `cover` 时显示横幅。

选择封面时打开 [离线选图册](docs/cover-catalog.html)，按用途筛选、搜索并复制 `cover: /covers/research/…webp`。选图册内嵌图片，不需要启动网站或联网。

封面使用柔和色块和抽象线条表达主题，浅色与深色界面使用同一张图片。新增封面时将 WebP 放入 `public/covers/research/`，在 `src/data/cover-catalog.json` 登记，再运行：

```sh
npm run art:prepare
npm run check
npm run build
```

`art:prepare` 会同步品牌标记、封面的同名分享 PNG、站点分享图与离线选图册，不会重新绘制或覆盖封面。只更新选图册时运行 `npm run covers:catalog`。

## 字体

当前字体分工：

| 用途 | 字体栈 |
| --- | --- |
| 展示标题 | Lora → 思源宋体子集 → 系统宋体 |
| 阅读正文 | Source Serif 4 → 思源宋体子集 → 系统宋体 |
| 界面文字 | DM Sans → 苹方 / 微软雅黑 |
| 代码 | JetBrains Mono → IBM Plex Mono |

中文子集按 `src/` 中的正文、标题和界面文字生成；常规字重 400 按使用频率分片，强调字重 600 单独分片。资产与 `src/styles/fonts.css` 已提交，普通构建不需要 Python，也不会下载外部字体。

更新字体子集：

```sh
python -m pip install fonttools==4.66.1 brotli==1.2.0
npm run fonts:prepare
npm run check
npm run build
```

脚本会扫描源文件、更新 `src/assets/fonts/`、`src/styles/fonts.css` 与 `docs/font-manifest.json`。当前 14 个字体文件合计 **1,309,928 字节**，覆盖 2,270 个语料字形、1,264 个展示字形；文件大小与 SHA-256 记录在 `docs/font-manifest.json`。字体许可证保留在 `public/fonts/licenses/`。

所有字体使用 `font-display: swap`，不做全站预加载。KaTeX 与代码字体样式只在文章 / 项目阅读页引入。新增超出 400–600 的英文设计字重或新增中文字重时，需要同步修改生成脚本、CSS 声明和字体资产。

## 评论

站点默认沿用原有 Giscus 的公开仓库与分类配置，无需本地 `.env` 即可显示评论。默认值在 `src/utils/giscus.ts`，需要切换仓库时复制 `.env.example` 为 `.env` 并替换对应配置。

GitHub Pages 通过同名仓库 Variables 覆盖 `PUBLIC_GISCUS_REPO`、`PUBLIC_GISCUS_REPO_ID`、`PUBLIC_GISCUS_CATEGORY`、`PUBLIC_GISCUS_CATEGORY_ID`。这些 ID 会写进页面 HTML，属于公开配置；本地 `.env` 不应提交。

评论接近阅读末尾才连接，加载中、失败与重试状态可见。公开部署使用 `public/giscus-garden.css` 与 `public/giscus-garden-dark.css` 为 iframe 设置明暗主题；localhost 预览使用 Giscus 内置 light 主题。自定义域名需同时正确设置 `SITE_URL` 与 `BASE_PATH`。

## 部署

推送到 `main` 或 `master` 会执行 `.github/workflows/deploy.yml`。在 GitHub 仓库 Settings → Pages 选择 GitHub Actions。

工作流会运行单元检查、Astro 检查与生产构建，然后部署 `dist/`。站点域名与子目录由仓库变量 `SITE_URL` 和 `BASE_PATH` 调整；未设置时使用 GitHub Pages 默认地址和仓库名。

## 文档与资产

- `docs/templates/`：文章、学习章节、学习专题、项目四个起始模板。
- `docs/cover-catalog.html`：离线封面选图册，由 `npm run covers:catalog` 生成。
- `docs/font-manifest.json`：字体子集的大小与哈希记录，由 `npm run fonts:prepare` 更新。
- 历史设计、审查和性能记录已删除；如需回溯，请查看 Git 历史。

## 许可

站点代码与原创内容尚未声明统一许可证。字体按各自的 SIL Open Font License 使用，许可证原文在 `public/fonts/licenses/`。如果准备公开复用代码或内容，请先补充根目录 `LICENSE` 并明确第三方书籍笔记的授权范围。
