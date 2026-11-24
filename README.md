# 千羽 · senbazuru

基于 Astro 7、Tailwind CSS 4、Pagefind、KaTeX 与 Giscus 的静态研究博客与作品集。札记、长卷和项目分别由 `src/content/posts/`、`src/content/series/`、`src/content/projects/` 下的 Markdown 驱动，构建后是纯静态页面。

站名「千羽」取自川端康成的《千羽鹤》，Logo 是一只展翅的折纸鹤：身体和双翼用墨色，远侧翅膀半透明，鹤首用朱砂。Logo 的源文件是 `public/logo.svg`，修改后运行 `npm run brand:prepare`，会同步生成 favicon、头像和分享图。

站点采用「暖瓷画报 · 精密 Bento（Porcelain Editorial Bento）」视觉体系：浅色为暖瓷纸白（`#f4f3ef`）配纯白圆角卡片（`#ffffff`）、海雾蓝灰（`#2f5268`）主强调色与纸鹤首点缀朱砂（`#b43b24`）；暗色为温润夜瓷炭（`#121211` / `#1a1a18`）配浅海雾蓝（`#8cb4cb`）与暖朱砂（`#e06c53`）。所有明暗对比度均满足 WCAG AA（≥4.5:1），响应式严格沿用 600 / 900 / 1100 三条边界。首页分为五部分：首排左栏个人导言与右栏「近况 · 武汉」状态卡；第二排左栏支持标签筛选的精密札记表格与右栏 2×2 真实照片网格及最新闲笔；第三排三列长卷专著书架；第四排研究项目概览；第五排近 12 个月写作节律柱状图与来信卡片。文章阅读页配备阅读进度条、圆角顶栏代码块、页眉纸鹤与文末落款、以及 901px 起常驻的侧栏目录。明暗两套主题令牌集中在 `src/styles/global.css` 顶部。

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
npm run test:browser:fast    # 只跑对比度、主题与版式核心回归
npm run test:browser:changed # 只跑与当前改动相关的测试文件
npm run build:fast           # 只构建页面，跳过 Pagefind、锚点与站内检查
npm run style:check          # 插图与文字的风格体检，只报告不改动
```

`build:fast` 的产物没有搜索索引和标题永久链接，只适合快速看页面；发布前仍要跑完整验证 `npm run verify`，它会并行运行单元测试与 Astro 构建 / 类型检查，任何一步失败都会打印该步输出。`preview` 本身只是启动静态服务器，耗时主要来自之前的构建，不需要额外加速。

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
src/content/posts/      札记、长卷章节与闲笔
src/content/series/     长卷（学习专题）
src/content/projects/   项目
src/data/site.ts        身份与导航配置
src/pages/              页面路由
src/components/         页面组件
src/styles/global.css   颜色、间距、字体层级与组件样式
src/styles/fonts.css    自托管字体声明
public/covers/research/ 主题封面 WebP 与同名分享 PNG
public/figures/         正文自绘 SVG 插图
public/gallery/         画廊原图与优化图
docs/font-manifest.json 字体子集清单
firebase.json           Firebase Hosting 静态托管配置
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
category: knowledge
cover: /covers/research/reading.webp
draft: true
featured: false
---
```

必填字段是 `title`、`description`、`pubDate`、`tags`。其余字段：

- `category`：决定文章进入哪个栏目。`knowledge`（默认）是札记，`course` 是长卷章节，`writing` 是闲笔。
- `series`：对应 `src/content/series/` 中的文件名；学习章节必须填写。
- `order`：系列内阅读顺序；学习章节必须填写，同一系列已发布章节不能重复。
- `draft: true`：不生成详情页，不进入博客列表、归档、标签、RSS 与搜索。
- `featured`：保留的精选标记；当前首页按发布日期展示内容，不依据此字段排序。
- `updatedDate`：可选，更新日期。
- `readingTime`：可选，整数分钟数；不填时按正文中文字符与英文词估算。

三个栏目按文字形态划分：属于某个系列、有先后顺序的进长卷；不成系列但能学到可复用东西的进札记；其余日常片刻进闲笔。栏目名与地址集中在 `src/data/sections.ts`。三类文章的详情页都在 `/blog/<id>/`，页头按 `category` 高亮所属栏目。札记页 `/blog/` 只列 `knowledge`，按篇数最多的标签筛选；长卷页是 `/notes/`；闲笔页 `/jottings/` 只列出 `writing` 文章。`category: course` 必须同时填写 `series` 和 `order`，否则检查或构建会报错。

### 系列 frontmatter

```yaml
---
title: 学习专题标题
englishTitle: A Learning Path
description: 说明这组笔记的主线、范围和阅读对象。
cover: /covers/research/reading.webp
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
cover: /covers/research/research.webp
---
```

必填字段是 `title`、`summary`、`pubDate`、`tags`、`status`、`featured`。`status` 取“规划中”“进行中”或“已完成”。`repoUrl`、`demoUrl`、`cover` 可选；没有公开地址时直接省略，不要写占位链接。`featured` 是保留的精选标记；当前首页第四排按时间展示近期研究项目，不依据此字段筛选。

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
    <img src="/figures/path-to-svg.svg" alt="用文字描述图的内容" width="800" height="384" loading="lazy" decoding="async">
    <figcaption>短句说明。</figcaption>
  </figure>
  ```

- 长附录、原始数据表或超长清单可以放进 `<details><summary>展开</summary>…</details>`。

### 写作与发布

1. 参考上文对应类型的 frontmatter 模板在 `src/content/` 下新建 Markdown 文件。
2. 修改 frontmatter 与正文，完成前保持草稿状态（文章）或使用 `_` 前缀（项目 / 系列）。
3. 批次收尾时运行 `npm run verify`（包含类型检查、单元测试与生产构建/站点检查），并在 `npm run preview` 中检查实际页面。
4. 确认改动范围后提交并推送；构建本身不会提交或发布。

新增或修改正文后，如果出现字体子集未覆盖的生僻字，浏览器会使用系统宋体回退。内容定稿后可以统一更新字体子集，见下文“字体”。

## 首页与阅读功能

首页顺序为：导言主卡与「近况 · 武汉」状态卡首排、支持按标签筛选的精密札记索引与 2×2 真实照片切片及最新闲笔、3 部长卷专著书架、近期研究项目概览、近 12 个月写作柱状图与来信卡片。各块按发布日期与画廊数据自动生成。

每篇文章完整渲染在同一页面，保留正文、MathML、原地址和章节锚点。文章页提供 h2/h3 目录、浏览器查找、复制、打印和阅读进度；阅读记录需要读者主动开启，只保存在本机 `localStorage`。顶部搜索或 `Ctrl/Cmd K` 打开快捷搜索，查询与完整搜索页共享；`Escape` 关闭并恢复焦点。

标签通过 `src/utils/tags.ts` 的 `tagAliases` 归一化，例如 `cpp` → `C++`、`algorithms` → `算法`。

## 画廊（隐藏页）

画廊 `/gallery/` 不进顶部主导航，可从首页「闲笔」2×2 照片网格或关于页连点三次右侧标志进入；`#photo-N` 直接打开对应照片。原图放在 `public/gallery/`。文件名可以使用中文，但应避免空格和特殊符号；**优化脚本只处理 `.jpg` / `.jpeg`**，新增照片请使用 JPEG。

新增一张照片：

1. 把 JPEG 放入 `public/gallery/`。
2. 在 `src/data/photos.ts` 的 `photos` 数组中增加一项，填写真实宽高：

   ```js
   { file: '新的图片.jpg', title: '显示在图片下方的标题', width: 1600, height: 1200 },
   ```

3. 运行 `npm run gallery:prepare`，在 `public/gallery/optimized/` 生成 WebP 与 AVIF 候选图。
4. 在预览中确认图片、说明和放大弹窗，然后提交 `public/gallery/`（包含 `optimized/`）。

照片按两栏瀑布流排列（服务端分栏，保证视觉顺序与灯箱顺序一致），点击照片打开大图弹窗，支持左右方向键、Esc 和关闭后恢复焦点。优化候选图的最长边为原图宽度与 1200px 中的较小值。

## 封面库

`public/covers/research/` 中有 5 张研究刊物风格的主题封面，覆盖研究评测、论文阅读、数学、系统和算法。封面为 2048×1152 的 WebP，同名分享 PNG 为 1200×630。

- 文章、项目和专题都可以用 `cover` 指定封面。原有内置 SVG 路径会按主题映射到新封面；其他显式配置的封面保持不变。
- 早期内置的 `/covers/*.svg` 路径已不存在对应文件，只作为主题别名由 `src/utils/covers.ts` 映射到上面 5 张封面；新文章直接写 `/covers/research/…webp`。
- 未指定时，文章按 `src/utils/content.ts` 的规则推断：文件名含 `infra`、阅读 / 论文类、算法 / 路线类、知识笔记分别使用对应默认图；其余文章使用通用论文封面。
- 学习专题的 `cover` 同时用于专题卡片、目录和分享预览；章节分享图优先使用自己的 `cover`，没有时继承专题封面。
- 站点页面目前不显示任何封面：文章、学习专题和项目的卡片与详情页都只用文字排版，`cover` 只用于分享预览图。

可选封面清单（仅用于社交分享预览图）：

| 路径 | 用途 | 适用场景 |
| --- | --- | --- |
| `/covers/research/research.webp` | 研究与评测 | 模型评测、实验设计与研究问题 |
| `/covers/research/reading.webp` | 论文与阅读 | 论文阅读、研究方法与知识整理 |
| `/covers/research/math.webp` | 数学与学习 | 数学概念、概率与优化专题 |
| `/covers/research/systems.webp` | 系统与基础设施 | 软件系统、数据与 AI 基础设施 |
| `/covers/research/algorithm.webp` | 算法与编程 | 算法结构、编程语言与工程工具 |

修改 Logo 或新增封面 WebP 后运行：

```sh
npm run brand:prepare
npm run verify
```

`brand:prepare` 会从 `public/logo.svg` 同步生成 `favicon.svg`、`avatar.svg`、`favicon.ico`、站点分享图以及 `public/covers/research/` 中每张 WebP 对应的 1200×630 分享 PNG。

## 字体

当前字体分工：

| 用途 | 字体栈 |
| --- | --- |
| 展示标题 | Lora → 思源宋体子集 → 系统宋体 |
| 阅读正文 | Source Serif 4 → 思源宋体子集 → 系统宋体 |
| 界面文字 | DM Sans → 苹方 / 微软雅黑 |
| 代码 | JetBrains Mono → SFMono-Regular / Consolas |

中文子集按 `src/` 中的正文、标题和界面文字生成；400 与 600 两个字重覆盖同一套字符，按使用频率切成 `unicode-range` 分片，浏览器只下载页面用到的分片。`tests/fonts.test.mjs` 检查站内汉字的字重覆盖，以及字体声明、文件大小和哈希是否与清单一致；改完文案后测试失败就重新运行 `npm run fonts:prepare`。资产与 `src/styles/fonts.css` 已提交，普通构建不需要 Python，也不会下载外部字体。

更新字体子集：

```sh
python -m pip install fonttools==4.66.1 brotli==1.2.0
npm run fonts:prepare
npm run check
npm run build
```

脚本会扫描源文件、更新 `src/assets/fonts/`、`src/styles/fonts.css` 与 `docs/font-manifest.json`。当前 13 个字体文件合计 **986,888 字节**，覆盖 1,704 个语料字形；文件大小与 SHA-256 记录在 `docs/font-manifest.json`。字体许可证保留在 `public/fonts/licenses/`。

所有字体使用 `font-display: swap`，不做全站预加载。KaTeX 样式只在文章阅读页引入；代码字体由自托管 `JetBrains Mono Variable` 统一提供。新增超出 400–600 的英文设计字重或新增中文字重时，需要同步修改生成脚本、CSS 声明和字体资产。

## 评论

站点默认沿用原有 Giscus 的公开仓库与分类配置，无需本地 `.env` 即可显示评论。默认值在 `src/utils/giscus.ts`，需要切换仓库时复制 `.env.example` 为 `.env` 并替换对应配置。

GitHub Pages 通过同名仓库 Variables 覆盖 `PUBLIC_GISCUS_REPO`、`PUBLIC_GISCUS_REPO_ID`、`PUBLIC_GISCUS_CATEGORY`、`PUBLIC_GISCUS_CATEGORY_ID`。这些 ID 会写进页面 HTML，属于公开配置；本地 `.env` 不应提交。

评论接近阅读末尾才连接，加载中、失败与重试状态可见。公开部署使用 `public/giscus-garden.css` 与 `public/giscus-garden-dark.css` 为 iframe 设置明暗主题；localhost 预览使用 Giscus 内置 light 主题。自定义域名需同时正确设置 `SITE_URL` 与 `BASE_PATH`。

## 部署

### GitHub Pages

推送到 `main` 或 `master` 会执行 `.github/workflows/deploy.yml`。在 GitHub 仓库 Settings → Pages 选择 GitHub Actions。

工作流会运行 `npm run verify`（单元测试 + 生产构建 + 类型检查）并部署 `dist/`。站点域名与子目录由仓库变量 `SITE_URL` 和 `BASE_PATH` 调整；未设置时使用 GitHub Pages 默认地址和仓库名。

### Firebase Hosting（Google 免费静态部署）

根目录已配置 [`firebase.json`](firebase.json)（发布目录 `dist`，启用 `cleanUrls` 与 `trailingSlash`，并为 `/_astro/**` 与 `/gallery/optimized/**` 设置长效缓存）。Spark 免费套餐提供 **10 GB** 托管存储与 **10 GB/月** 传输流量及自动 HTTPS。

首次绑定项目并部署：

```powershell
npx -y firebase-tools@latest login
npx -y firebase-tools@latest use <PROJECT_ID>          # 或 projects:create 创建新项目
$env:SITE_URL = "https://<PROJECT_ID>.web.app"
$env:BASE_PATH = "/"
npm run verify
npx -y firebase-tools@latest deploy --only hosting
```

本地调试后记得清理环境变量（`Remove-Item Env:SITE_URL, Env:BASE_PATH`）。

## 文档与资产

- `docs/font-manifest.json`：字体子集的大小与哈希记录，由 `npm run fonts:prepare` 更新。
- 其余内容模板与封面清单均整合在本文件中，历史设计稿与审查流水账已删除；如需回溯请查看 Git 历史。

## 许可

站点代码与原创内容尚未声明统一许可证。字体按各自的 SIL Open Font License 使用，许可证原文在 `public/fonts/licenses/`。如果准备公开复用代码或内容，请先补充根目录 `LICENSE` 并明确第三方书籍笔记的授权范围。
