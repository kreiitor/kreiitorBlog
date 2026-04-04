# AI4SE Blog Site

个人博客与论文展示站，基于 `Astro + Tailwind CSS + Astro Content Collections + Pagefind + Giscus`。

## 本地运行

```powershell
cd E:\Code\ai4program
npm install
npm run dev
```

默认访问 [http://localhost:4321](http://localhost:4321)。

## 构建

```powershell
npm run check
npm run build
```

## 评论功能

站点已经接入 `Giscus`，但要让评论真正显示，还需要你在 GitHub 做一次配置。

1. 到仓库开启 `Discussions`
2. 打开 [Giscus 配置页](https://giscus.app/zh-CN)
3. 选择仓库 `kreiitor/kreiitorBlog`
4. 生成以下参数并写入项目根目录的 `.env`

可直接复制 `.env.example`：

```bash
cp .env.example .env
```

需要填写的关键项：

- `PUBLIC_GISCUS_REPO_ID`
- `PUBLIC_GISCUS_CATEGORY_ID`

填好后重新运行：

```powershell
npm run dev
```

或者重新部署到 GitHub Pages，文章详情页就会显示评论区。

## 部署

仓库内已经包含 GitHub Pages Actions 工作流：

- [deploy.yml](/E:/Code/ai4program/.github/workflows/deploy.yml)

推送到 `main` 或 `master` 后会自动触发部署。仓库的 `Settings -> Pages -> Source` 需要设为 `GitHub Actions`。
