# 字体与语料子集

研究札记的阅读正文保留 Source Serif 4 / 思源宋体。英文界面用 DM Sans，中文界面用苹方、微软雅黑等系统字体；代码用 IBM Plex Mono。英文正体和真斜体保留 Source Serif 4 的光学尺寸轴与 400–600 字重范围。

2026-10-14 起标题与装饰位引入展示字体：中文标题用霞鹜文楷 Regular（`Journal Kai SC` 是这套子集的内部名称，按 display 语料子集化），英文标题/装饰大字用 Lora Variable（400–600 字重；曾试 Fraunces，因笔画过细观感不佳而换）。代码字体从 IBM Plex Mono 换为 JetBrains Mono Variable（开发者推荐字形，400–600）。均为 OFL-1.1 许可：文楷来自 GitHub release v1.522（`lxgw/LxgwWenKai`），Lora / JetBrains Mono 来自对应 `@fontsource-variable/*` npm 包；许可证文本在 `public/fonts/licenses/`。`--font-display` 栈为 Lora → 文楷 → Source Serif 4 → 思源宋体回退；`--font-reading` 不变；`--font-mono` 栈为 JetBrains Mono → IBM Plex Mono 回退。标题统一用字重 500（Lora）/400（文楷），避免合成加粗。

中文宋体以当前 `src/` 中的正文、标题、强调和界面文字生成：常规字重 400 按使用频率分片，强调字重 600 将共享标题字形与其他标题/强调字形分开。`Journal Serif SC` 是这套思源宋体子集的内部名称。新增生僻字会显示系统宋体回退，更新子集后使用统一的站点字形。

2026-10-13 初次生成的八个字体资产共约 863KB。中文常规语料约 414KB，共享标题约 102KB，其他强调约 149KB；其余是两份 Source Serif 4 与 DM Sans。这是全站资源量，单页实际下载由字形、字重、斜体和页面内容决定。按语料准确覆盖正文比随机请求大量中文分片更稳定；不以固定的 150KB 作为不切实际的全站预算。

2026-10-14 温暖数字花园更新后已重新生成子集，共 863,316 字节；覆盖 2,173 个语料字形、589 个标题字形。对应文件大小与 SHA-256 记录在 `docs/font-manifest.json`。

`src/styles/fonts.css` 与 `src/assets/fonts/` 已提交。普通本地构建和 GitHub Actions 不需要 Python，也不下载字体。更新文章或界面后可重新生成：

```sh
python -m pip install fonttools==4.66.1 brotli==1.2.0
npm run fonts:prepare
npm run check
npm run build
```

脚本直接扫描源文件，无需先构建。思源宋体上游固定为 `docs/font-manifest.json` 的 Google Fonts revision，下载缓存位于忽略的 `.artifacts/font-sources/`。字体许可证在 `public/fonts/licenses/` 保留。所有站点文字字体使用 `font-display: swap`，不作全站字体预加载；小字体也作为独立资源缓存。

KaTeX 与代码字体样式只在阅读页引入。新增超出 400–600 的英文设计字重或新增中文字重时，同步修改生成脚本、CSS 声明和资产。
