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
npm run build
npm run preview
```

`build` 后会自动生成全文搜索索引。搜索应在构建后的预览或已部署的网站验证，开发服务器不生成索引。

模拟 GitHub Pages 子目录部署（PowerShell）：

```powershell
$env:BASE_PATH = '/kreiitorBlog'
npm run build
npm run preview
```

此时访问 http://localhost:4321/kreiitorBlog/ 。恢复普通开发前执行 `Remove-Item Env:BASE_PATH`。

## 内容维护

文章位于 `src/content/posts/`，项目位于 `src/content/projects/`。身份与联系方式集中在 `src/data/site.ts`。

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
- `series` 与 `order`：用于课程目录、上一章和下一章。
- `draft: true`：不生成详情页，不进入搜索、RSS、归档与标签。
- `featured: true`：进入首页精选。
- 支持 `$...$` 行内公式与 `$$...$$` 公式块。
- Markdown 中以 `/` 开头的内部链接自动适配部署子目录。

SVG 插画和封面在 `public/` 中维护，不依赖外部图片服务。字体提供系统中文字体回退；远程字体不可用时仍可正常阅读。

## 评论

复制 `.env.example` 为 `.env`，配置 Giscus 仓库和分类 ID。没有配置评论时，文章页显示邮件交流入口。GitHub Pages 构建使用的环境变量需要在工作流中配置；本地 `.env` 不应提交。

## 部署

推送到 `main` 或 `master` 自动执行 `.github/workflows/deploy.yml`。在 GitHub 仓库 Settings → Pages 选择 GitHub Actions。

工作流自动设置站点域名与仓库子目录。自定义域名可通过仓库变量 `SITE_URL` 和 `BASE_PATH` 调整。

## 发布审阅

本次内容整理记录见 `docs/publication-review.json` 和 `docs/PUBLICATION.md`。记录只包含文件名、处理类型与数量，不包含原始敏感值。
