# 字体加载与再生成

字体组合与设计保持不变。`src/styles/fonts.css` 和 `src/assets/fonts/` 是已提交的生成资源，普通本地构建和 GitHub Actions 无需 Python，也不会从外部下载字体。

2026-10-12 本地验证：以相同的 579px 首页视口、不同本地服务端口隔离浏览器缓存，通过静态服务器记录实际 WOFF2 请求。接手时的版本为 33 个请求 / 2,254,904 字节（包括两份无法被 CSS 复用的 preload 文件）；优化后为 9 个请求 / 858,216 字节，字体传输量减少约 62%。这是首页样本，长文章使用的回退字体数量随内容而变，不代表全站资产体积减少 62%。

- Source Serif 4 的正体与真斜体保留全部原有字符分片和 `opsz` 光学尺寸轴，实际裁剪 `wght` 至 400–600，覆盖当前正文、强调和标题字重。不是仅修改 CSS 的字重声明。
- 根据构建后首页正文、所有页面标题和共享导航/页脚收集中文字形，生成 Noto Serif SC / Noto Sans SC 的合并子集。现有 Fontsource 分片作为完整字符回退；新增标题和生僻字无需等待子集更新即可显示。
- 两个首屏衬线字体由 Vite 的 `?url` 导入预加载，地址与 CSS 的哈希资源一致，避免复制到 `public/` 后的重复下载。全部字体使用 `font-display: swap`。
- 原来的约 11.8 MB 是构建字体资源总量，不代表单页全部下载。中文原始分片按 `unicode-range` 使用；优化目标是实际请求数量与传输量，而不是删除未访问文章所需的字符。

更新标题后可选择重新生成子集（不是发布必需步骤）：

```sh
npm ci
npm run build
python -m pip install fonttools==4.66.1 brotli==1.2.0
python scripts/prepare-fonts.py
npm run check
npm run build
```

Google Fonts 上游固定版本、字体大小和 SHA-256 记录在 `docs/font-manifest.json`。再生成脚本使用锁定的 Fontsource 依赖与该固定版本；下载缓存位于被忽略的 `.artifacts/font-sources/`。字体许可证保留在 `public/fonts/licenses/`。

将来增加超出 400–600 的设计字重时，应同步调整生成脚本和 CSS 声明并重新生成，避免浏览器选择最近字重。中文阅读正文的合并子集只覆盖标题和首页的字形，其他正文字符仍按需使用原有完整回退。
