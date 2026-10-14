# 站点实测研究（2026-10-14）

**这份文档是什么**：对调研清单里 40+ 个个人站点的**实地抓取与源码取证**结果，用于给 `kreiitor · 研究札记` 的重构提供有据可依的经验。所有结论都指向磁盘上的真实字节（原始 HTML / CSS 落盘副本），不是印象、不是搜索摘要。

**配套文档**：[重构方向](REFACTOR-2026-10-14.md)（决策），本文是它的**证据基座**。

---

## 0. 怎么做的：方法与诚实边界

### 0.1 环境障碍与绕行

本机环境的 `web_fetch` 完全不可用——任何域名都解析到 `198.18.x.x`（fake-IP 段）并被判定为非公网地址；`web_search` 返回 401；Windows `schannel` 栈的 HTTPS（`curl.exe` / `Invoke-WebRequest`）报 `SEC_E_NO_CREDENTIALS`。

**但 Node 与 Python 自带的 OpenSSL 栈是通的**。因此改用 Node `fetch` 抓取并落盘，再用脚本做机器化事实提取。这也意味着：**所有证据都可以重新抓取复现**，脚本保留在 `_site-research/`（已加入 `.gitignore`）。

### 0.2 语料规模（实测）

| 项目 | 数量 |
| --- | --- |
| 站点首页/列表页 | **53 / 53 全部 HTTP 200 成功** |
| 额外抓取的页面 | 6（`gwern` 的 `/Sidenotes`、`/Design`；`wcag-*` 三份；`lilianweng` 文章页等） |
| 真实文章页 | 6（`lilianweng--article`、`jvns--article`、`joshwcomeau--article`、`eugeneyan--article`、`benmyers--article`、`craigmod-essay`） |
| 抓到并分析了 CSS 原文 | **25+ 张样式表**（含构建产物、压缩单行文件） |
| 全部落盘素材 | 约 66 个 HTML + 25 张 CSS + 60 份纯文本 |

**53/53 全部成功**这一点本身有价值：它反证了你给的那份清单是真实的——对比你实测 404 后剔除的那批（见 §7）。

### 0.3 四条诚实边界（请连同结论一起读）

1. **不是每个站点都抓到了 CSS**。约 10 个站点（`anran758`、`jalammar`、`mccormickml`、`lena-voita`、`sgugger`、`jeremyjordan`、`iamtrask` 等）只抓到 HTML，**它们的字号/行宽/字体无从证实，本文一律留空，不用常识补全**。
2. **「CSS 里定义了」≠「页面上真有实例」**。最典型的两个反例：
   - `gwern` 首页有整套 `--GW-sidenote-*` / `--GW-footnote-*` 变量，但**零个边注/脚注实例**（只有变量定义 + 一个指向 `/sidenote` 的链接）。
   - `tonsky` 的 CSS 定义了 `.footnote` / `.reversefootnote` 规则，**同样零实例**。
3. **统计数字会骗人**。抓取脚本的数字必须回原文核对，本次就抓到至少 6 处假阳性（详见 §7.3）。
4. **`material-dark`（Material 暗色规范）只抓到 SPA 外壳**，正文 15 个字符，**该规范的实际规则本文无法引用**。你的清单里引用的 `#121212`、elevation、饱和度处理，本文只能通过**其他站点是否照做**来间接观察，不转述规范原文。WCAG 对比度条款则拿到了权威原文（§6.1）。

---

## 1. 暗色模式：唯一的大块能力缺口，也是取证最充分的一项

### 1.1 普查：真的实现了暗色的有多少

判定标准从严：**有真实切换控件 / 有 `.dark`、`[data-theme]`、`.is-dark` 的样式覆盖 / 有独立的暗色 token 值**，三者至少其一。仅出现 `prefers-color-scheme` 字样不算（可能只是 `theme-color` 的 media 属性）。

| 判定 | 数量 | 站点 |
| --- | --- | --- |
| **真的实现了暗色** | **18 个站（25 个页面）** | `lilianweng`、`gwern`、`craigmod`、`mollywhite`、`swyx`、`benmyers`、`allanware-zh`、`andlukyane`、`axutongxue`、`eugeneyan`、`joshwcomeau`、`imsyy`、`leaverou`、`liruifengv`、`taniarascia`、`hugo-deploy-ghpages`、`hugo-themes`、`tonsky`（存疑，见下） |
| **没有实现** | **41 个页面** | `karpathy`、`jvns`、`danluu`、`marginalia`、`maggieappleton`、`evanyou`、`sgugger`、`lena-voita`、`mccormickml`、`jeremyjordan`、`jalammar`、`iamtrask`、`alxddh`、`alpha2016`、`charlesliuyx`、`chinomars`、`aemoncao`、`bestxtools`、`dingran`、`yibie`、`lutaonan`、`shrekshao`、`anran758`、`brutalistwebsites`、`alexwest` 等 |

**两个反直觉但重要的事实：**

- **Karpathy、Julia Evans、Dan Luu、Marginalia、Maggie Appleton 这些最有名的「内容优先」站点，全都没有暗色模式。** 暗色不是优质个人站的标配。这一点对决策很关键：**做暗色是补能力，不是补「别人都有」**。
- **中文 Hexo/Jekyll 那一批 7 个站，暗色 0/7**。你在中文圈能参考的暗色先例，基本只有 `imsyy`（VitePress）和 `allanware-zh`、`liruifengv`。

### 1.2 暗色配色实况：`#121212` 其实是少数派

这是本次取证**最有决策价值**的一组数据。抠出的真实暗色基底色：

| 站点 | 暗色基底 | 文字 | 强调 | 冷暖 |
| --- | --- | --- | --- | --- |
| `gwern` | `#161616` | `#f1f1f1` | link `#dcdcdc` | **中性偏暖** |
| `mollywhite` | `#161616`（卡片 `#222222`） | `#f1f1f1` | `#b4abda`（亮色是 `#5948a4`） | **中性偏暖** |
| `craigmod` | `#222`（surface `#333`/rule `#555`/deep `#111`） | `#ddd` | `#fff` | **中性纯灰** |
| `swyx` | **`#111523`** | **`#f0e8d9`（暖米）** | **`#e7c985`（暖金）** | **冷底 + 暖字** |
| `taniarascia` | `#202025` | `#d4d4d8` | `#b26a34`（亮色 `#fede91`） | 冷中性 |
| `lilianweng`（PaperMod） | `rgb(29,30,32)` | `rgb(196,196,197)` | 主色 `rgb(218,218,219)` | 冷中性 |
| `joshwcomeau` | `hsl(210 15% 6%)` | `hsl(210 10% 90%)` | `hsl(225 100% 75%)` | 冷（蓝灰） |
| `benmyers` | `#3e1f60` | `#e5dbff` | `#ffd43b` | 冷（高饱和紫） |
| `eugeneyan` | `#333` | `#fff` | `#66b0ff` | 中性 |
| **`allanware-zh`** | **`#121212`** | `#e5e5e5` | `#6da6ff` | 冷中性 |
| **`andlukyane`** | **`#121212`**（备选 `#1e1e1e`） | `#e0e0e0` | `#42a5f5` | 冷中性 |

**结论：用 Material `#121212` 的只有 2 个站**，而且恰好都是「最套模板」的两个。用暖/中性暗底的有 5 处。

**最有力的信号**：`gwern` 与 `mollywhite` 互不相关，却**独立收敛到完全相同的 `#161616` / `#f1f1f1`**；并且 `gwern` 在 CSS 注释里写明了理由——纯 `#000` 会在像素熄灭/点亮时造成 *"nasty scrolling/update jank"*，纯 `#fff` 正文在暗色下 *"too high & stark"*。

**推论**：**没有一家给出「暖色暗底」的现成答案**——这是我们要自己填的空白，但也意味着它是差异化机会而非抄作业。

### 1.3 直接对你原始清单的两处修正

- 你在调研里写「暗色模式不是反色……规范页 `m2.material.io/design/color/dark-theme.html`」。**该页实测只抓到 SPA 外壳（正文 15 字符），规范原文取不到**。不过「`#121212` 基底 + 越亮越靠前」这条思路，在真实站点里只有 2/18 采纳（见 §1.2）——**照搬它反而会脱离主流**。
- 你写「Gwern 和 Lilian Weng 的站都能直接扒这套实现思路」。**Gwern 的暗色根本不是用类或属性实现的**：它是两个 `<style>` 元素，靠 **`media="all and (prefers-color-scheme: dark)"` 属性**切换整张样式表（`gwern.html:9-353` 浅色 / `:354-857` 深色），没有 `[data-theme]`、没有 `.dark` 主题类。**这种写法无法被用户手动覆盖**，与我们的架构不合，不能直接扒。真正可直接扒的是 Lilian Weng（见 §1.5）。

### 1.4 明暗 token 对照（可直接取用的三套真实值）

**① PaperMod / Lilian Weng（冷中性，结构最标准）**

| token | 浅色 | 深色 |
| --- | --- | --- |
| `--theme`（页底） | `rgb(255,255,255)` | `rgb(29,30,32)` |
| `--entry`（卡片面） | `rgb(255,255,255)` | `rgb(46,46,51)` |
| `--primary`（主色） | `rgb(30,30,30)` | `rgb(218,218,219)` |
| `--secondary` | `rgb(108,108,108)` | `rgb(155,156,157)` |
| `--tertiary`（边框） | `rgb(214,214,214)` | `rgb(65,66,68)` |
| `--content`（正文） | `rgb(31,31,31)` | `rgb(196,196,197)` |
| `--code-bg` | `rgb(245,245,245)` | `rgb(55,56,62)` |
| `--border` | `rgb(238,238,238)` | `rgb(51,51,51)` |

另有版面变量：`--main-width:720px`、`--nav-width:1024px`、`--gap:24px`、`--content-gap:20px`、`--radius:8px`。

**② Craig Mod（纯中性灰，同一灰阶反色复用）**

它的做法不是「另配一套深色」，而是**把同一条 5 级灰阶在两个主题里互换角色**：

| 浅色（paper/ink 命名） | 深色（`--dm-*` 命名） |
| --- | --- |
| `--paper:#fff` 页底 | `--dm-bright:#fff` 强调文字 |
| `--rule:#ddd` 细线 | `--dm-text:#ddd` 正文 |
| `--ink-soft:#555` | `--dm-rule:#555` 细线 |
| `--ink:#333` 正文 | `--dm-surface:#333` 抬升面 |
| `--ink-deep:#222` | `--dm-bg:#222` 页底 |
| — | `--dm-bg-deep:#111` 比页底更深的一层 |

**注意它的命名与我们高度同构**（我们也是 paper / ink 语义），而且它用 CSS 注释直接标注对比度依据（如 `--wd-faint:#939393 /* 5.2:1 */`）。**它的深色是纯灰（R=G=B），未用 `#121212`，最深到 `#111`。**

**③ swyx（冷底暖字——与本项目最接近的一套暖色气质）**

这站与我们的**浅色配色几乎撞色**：

| token | 浅色 | 深色 |
| --- | --- | --- |
| `--page-bg` | **`#f5f0e7`**（我们 `#f4f1e8`） | `#111523` |
| `--page-ink` / `--page-text` | **`#333a31` / `#292a24`**（我们 `#35382f`） | `#f0e8d9` |
| `--page-link` | **`#974337`**（我们 `#925134`） | `#e7c985` |
| `--page-accent` | `#9e4235` | `#dfbd78` |
| `--page-surface` | `#fbf8f2` | `#171b2a` |
| `--page-border` | `#ddd2c1` | `#383747` |
| `--page-muted` | `#6c675d` | `#c0b6a5` |

它给出了**第三条路线**：底色转冷（深墨蓝）、文字与强调保持暖。若想要更强的「夜色」对比可采用；若要品牌连续性，纯暖底更好。

### 1.5 机制拆解：三种路线与各自的坑

**路线 A：`prefers-color-scheme` 纯自动，零 JS**（`allanware-zh`、`craigmod`、`leaverou`）

`allanware-zh` 的完整实现只有 9 行：

```css
@media (prefers-color-scheme: dark) {
  :root {
    --bg-color-primary: #121212;   --bg-color-secondary: #1c1f24;
    --text-color-primary: #e5e5e5; --text-color-secondary: #b3b3b7;
    --text-color-tertiary: #a0a0a0; --link-color: #6da6ff;
    --link-visited-color: #b388ff;  --border-color: #30363d;
    --upvoted-color: #ff6b6b;
  }
}
```

**最低成本、零 JS、无闪烁**。缺点：用户无法手动覆盖（对系统设为浅色但想夜间阅读的人无解）。

> **重要观点冲突**：Lea Verou（CSS 标准作者）在自己的文章里直接主张 **"The best dark mode toggle is probably none"** 与 **"Dark mode toggles: two states are enough"**（标题见 `leaverou.txt:45,51`）。她本人用纯 CSS `light-dark()` + `oklch(from X L c h)` 实现全自动明暗——**连切换按钮都不做**。这条观点直接挑战了「必须做三态切换」的直觉，值得在决策时正面权衡。

**路线 B：`.dark` 类 + localStorage 三态**（`lilianweng`/PaperMod、`swyx`、`liruifengv`）

PaperMod 的完整逻辑（`lilianweng.html:99-109`），放在 `<body>` 开头：

```js
if (localStorage.getItem("pref-theme") === "dark") {
    document.body.classList.add('dark');            // ① 显式选过暗
} else if (localStorage.getItem("pref-theme") === "light") {
    document.body.classList.remove('dark');          // ② 显式选过亮
} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.classList.add('dark');            // ③ 没选过 → 跟随系统，且不写存储
}
```

③ **故意不写 localStorage**，所以保持「未设置」状态、继续跟随系统变化——这是三态语义的正确写法。

**但 PaperMod 这份实现有 5 个坑，逐条记录以免我们照抄：**

1. **脚本在 `<body>` 开头而非 `<head>`**（`:100`，`<body>` 已开始解析）→ **会闪白**。正确位置是 `<head>` 内的阻塞式内联脚本。同理 `axutongxue` 的开关是 `<body>` 第一个元素，返回访客必闪。
2. **`document.body.className.includes("dark")`**（`:450`）是**子串匹配**——任何含 "dark" 的类名都会误判，应改 `classList.contains('dark')`。
3. **暗色 token 只写在 `<noscript>` 里**（`:33-60`）：JS 开启时根本不生效，真实暗色依赖外部样式表的 `.dark` 规则 → 同一套配色维护在两处，易漂移。
4. **只给 `<body>` 加类，`<html>` 拿不到 `.dark`** → `color-scheme` 无法切换，表单控件与滚动条不会跟随。
5. **`theme-color` 只有一组值** `#2e2e33`（`:20`），没有明暗两套。

**路线 C：`[data-theme]` 三态 + `:not([data-theme])` 回落系统**（`benmyers`，**最成熟，推荐照抄机制**）

已独立核验：该站 **52 处 `:root:not([data-theme])` 无一例外都位于 `prefers-color-scheme` 媒体查询内**，形成「显式优先、未设置才跟系统」的双通路；同时声明 `color-scheme: dark light`，让表单控件与滚动条跟随。

- 每条主题化规则有三份等价副本：`:root[data-theme=light]`、`:root[data-theme=dark]`、`@media(pcs){:root:not([data-theme])}`。
- 三态 UI 用自定义元素 `<segmented-control name="theme">`，`data-value="light"|"dark"|""`；选 "System" 时 `data-value=""`，JS 执行 `localStorage.removeItem(key)` + **`documentElement.removeAttribute('data-theme')`** → 回到 `:not([data-theme])` → 系统偏好生效。
- **最大的坑**：属性只要存在（**哪怕值是空字符串**），`:not([data-theme])` 就不匹配。**必须真的 removeAttribute，只写 `[data-theme=""]` 会让系统偏好永远失效。**
- **成本警告**：三份副本是真实开销（21 个 dark 媒体块 + 15 个 light 媒体块 + 33/19 处显式选择器）。在 Tailwind 4 里不应手写三份，应压缩成「**一份变量表 + 两条选择器通路**」。

**反面教材（不要学）：**

- `taniarascia` 为**每一个** token 生成 **4 条**规则（59 个 token → 约 **236 条**主题规则），每个 token 重复一遍媒体查询头。语义清楚、可逐条审计对比度，但规则数 ×4 且新增 token 极易漏写。
- `eugeneyan` 用 `<input type=checkbox>` 放在 `<body>` **之外**做纯 CSS 切换，且**完全没有 `prefers-color-scheme`**（实测 0 命中）→ 系统是深色的访客仍看到亮色站。
- `joshwcomeau` 用 **cookie** `saved-color-theme` + JS `colorMap` 逐条 `setProperty` 覆盖，SSR 输出永远浅色 → **配色有两份真相**。
- `tonsky` 的 `.dark` **不是暗色模式**，是「手电筒」遮罩特效（`box-shadow: 0 0 0 9999px #000` + 手电筒图片），底层仍是亮黄 `#FDDB29`，且在 `@media (any-hover: none)` 下整体隐藏（**触屏无此功能**）。是炫技彩蛋，不是低光可读的暗色主题。
- `imsyy` 是**反向强制暗色**：VitePress `appearance:"dark"` + 脚本默认值 `||"dark"`，系统偏好浅色且无存储值的访客也被强制暗色，**且无开关可退出**。
- `mollywhite` 的 `theme-color` 写 `#191919`，CSS 实际基底却是 `#161616` → 移动端地址栏与页面底色有色差。

### 1.6 我们该用什么色：含我自己复算的对比度

我独立实现了 WCAG 相对亮度公式并复算（结果与另一路计算逐位吻合），**这一步改变了方案**：

| 组合 | 对比度 | 判定 |
| --- | --- | --- |
| **现状·浅色** | | |
| 正文 `#35382f` / 纸 `#f4f1e8` | **10.58:1** | AA 通过 |
| 次级 `#5e6458` / 亚麻 `#e9e1d3` | **4.70:1** | AA 通过 |
| 陶土 `#925134` / 纸 `#f4f1e8` | **5.39:1** | AA 通过 |
| 主按钮文字 `#faf8f1` / 陶土 `#925134` | **5.73:1** | AA 通过 |
| 输入框边界 `#818574` / 纸 `#f4f1e8` | **3.36:1** | 仅大字/UI 通过（符合 1.4.11 的 3:1） |
| **候选·暖暗底** | | |
| 正文 `#e6e2d6` / `#1a1a17` | **13.47:1** | AA 通过 |
| 次级 `#c9c4b6` / `#1a1a17` | **10.01:1** | AA 通过 |
| 弱化 `#a09b8c` / `#1a1a17` | **6.28:1** | AA 通过 |
| **陶土原值 `#925134` / `#1a1a17`** | **2.86:1** | **不通过 ❌** |
| 陶土提亮 `#c9805c` / `#1a1a17` | **5.59:1** | AA 通过 |
| **同行实测（参照）** | | |
| swyx `#f0e8d9` / `#111523` | 14.93:1 | AA 通过 |
| swyx 链接 `#e7c985` / `#111523` | 11.33:1 | AA 通过 |
| gwern+mollywhite `#f1f1f1` / `#161616` | 16.02:1 | AA 通过 |
| PaperMod `rgb(196,196,197)` / `rgb(29,30,32)` | 9.57:1 | AA 通过 |

**这条是关键发现**：**我们现在的陶土色 `#925134` 直接搬到暖暗底上只有 2.86:1，过不了 WCAG AA。** 暗色模式**必须**为强调色另出一档提亮值，而不是复用原值。

**同行的一致手法**是把「同色相、只提亮度」：`mollywhite` 是 `#5948a4 → #b4abda`；`taniarascia` 是 `#fede91 → #b26a34`；`leaverou` 直接写相对色语法 `oklch(from var(--color) clamp(0.7, l, 1) a b)`——**锁住 H 与 C，只抬 L**，这正是我们要的手法。

---

## 2. 动效：实况统计，以及「少」是刻意的

### 2.1 全语料时长普查（我自己跑的，覆盖 25 张样式表）

| 排名 | 时长 | 出现次数 |
| --- | --- | --- |
| 1 | `.25s` | 81 |
| 2 | `.2s` | 77 |
| 3 | `0.15s` | 76 |
| 4 | `.3s` / `0.3s` | 57 / 55 |
| 5 | `0s` | 55 |
| 6 | `250ms` | 54 |
| 7 | `0.1s` | 49 |
| 8 | `.5s` | 35 |

**主流区间是 150–300ms**，500ms 已是长尾。

**这对我们意味着什么（一处需要自我更正）**：我最初按「出现次数」统计，得出「我们现有的 160/220/360/380ms 完全落在主流区间内，不需要改」。按**站点覆盖率**重新统计后，结论要改：

| 值 | 覆盖站点数 | 判定 |
| --- | --- | --- |
| 200ms | **14 站**（并列第一） | 主流 |
| 300ms | **14 站**（并列第一） | 主流 |
| 500ms | 11 站 | 常用（面板/页面级） |
| 250ms | 9 站 | 常用 |
| 150ms | — | 微交互档（hover/焦点） |
| **220ms** | **仅 1 站（`swyx`）** | **我们的值，几乎孤例** |
| **360ms** | **59 个实测值里 0 次** | **我们的值，不存在于语料** |
| **380ms** | **59 个实测值里 0 次** | **我们的值，不存在于语料** |

**逐条结论**：`160ms` ✅ 合理（对应 100–150ms 微交互档）；`220ms` ⚠️ 建议改 **200ms**；`360ms` / `380ms` ❌ **在语料里零出现**（350ms 有 12 次、400ms 有 30 次，我们恰好落在两者之间的空档）→ 建议改 300ms 或 400ms。**建议收敛到 4 档：150 / 200 / 300 / 500ms。**

（说明：两套统计口径不同但方向一致——总频次看 250ms 最高，站点覆盖看 200/300ms 最广。无论哪种口径，**360/380ms 都不在主流带上**。）

**easing 实况**：关键字碾压自定义曲线——`ease` 182 次、`ease-in-out` 107、`linear` 71、`ease-out` 62、`ease-in` 37。自定义曲线里最通用的是 **`cubic-bezier(0.4, 0, 0.2, 1)`**（Material 标准，6 次）。**若只保留一条自定义曲线，用它。**

**`prefers-reduced-motion` 覆盖率：36 个可分析站点里只有 9 站做了（25%）**——`joshwcomeau` 27 次、`benmyers` 13、`eugeneyan` 6、`maggieappleton` 6、`lilianweng` 3、`craigmod` 2、`andlukyane` 2、`swyx` 2、`leaverou` 1。**我们已有完整处理，已在头部 25%。**

其中 `andlukyane` 做了一件和我们一样的事：`@media (prefers-reduced-motion: reduce){ @view-transition{ navigation: none } }`（我们 `Motion.astro:65` 已有）。

**两处假值（工具坑，记录备查）**：`craigmod` 的 24000ms 来自 SVG 路径数据 `...0 24s.06 10.95...`；`gwern` 的 13553ms 来自 `...13.553s-9.81...`。**SVG path/坐标数据会被正则误读成时长**，真实最长分别只有 2s 与 5s。

零动效的站点：`karpathy`、`mccormickml`、`mollywhite`（仅 1 处）、`lutaonan`（4 处，全部 ≤300ms）、`brutalistwebsites`（`<script>` 数为 **0**）、`taniarascia`（该样式表仅 1 处时长）。

超过 500ms 的时长集中且各有明确用途：`joshwcomeau`（入场编排 1.2s / 1225ms / 1.68s）、`gwern`（2s / 5s）、`maggieappleton`（logo 脉冲 1.2s）、`swyx`（1.4s）。**没有一个是「为了好看」的装饰。**

### 2.2 装饰性循环动效：几乎不存在

逐站确认，全语料里**只有两类无限循环**，且都挂在明确状态上：

1. `maggieappleton` 的 `.is-loading` **加载反馈**：`.is-loading .leaf{animation:leafWiggleLoop .9s infinite}`、`.is-loading .letter{…}`、`#logo.is-loading{animation:logoLoadingOpacityPulse 1.2s infinite}`——**全部限定在「加载中」状态**。
2. `joshwcomeau` 的 `spin var(--duration) linear infinite`（旋转指示器）。

`benmyers` 唯一一处循环是 `:hover` 触发且 **`animation-iteration-count: 3`**（播 3 次就停，不是 infinite）。

**这里有一处需要修正我自己的判断**：我最初写的是「**没有任何一站**存在无条件的、纯氛围的循环装饰动画」。按站点覆盖率重新核对后，**这个说法过于绝对**——确实存在少数低幅度环境循环，共 5 处：

| 站点 | 循环动效 | 周期 | 幅度 |
| --- | --- | --- | --- |
| `maggieappleton` | `#logo.is-loading` 透明度脉冲、叶片摆动 | `.9s`–`1.2s` infinite | 低幅透明度/位移 |
| `chinomars` | 骨架屏渐变斜纹 `gradient-move` | `2.5s` infinite | 背景位移 |
| `alexwest` | 直播状态点 | `2s` infinite | 透明度 |
| `leaverou` | `cta-hover` | `2s` infinite | 位移/缩放 |
| `axutongxue` | `.blink` 颜色闪烁 | `3s` infinite | 颜色 |

**共同特征**：**周期都在 0.9–3s、幅度都很低**（透明度、几像素位移、背景渐变），而且**没有一处把 >1s 的时长用在按钮/链接 hover 上**（>1s 的用途全部是：入场/自绘 SVG、弹层转场、循环状态提示、打字机、第三方组件 spinner）。

**修正后的结论**：装饰性循环动效**不是禁区，但要满足「低幅 + 慢周期（1–3s）+ 可关闭」三个条件**；而绝大多数高质量个人站（含 Karpathy、Dan Luu、Marginalia、gwern、joshwcomeau 的主体动效）选择了不做。我们现有实现（无粒子、无光标特效）方向正确，**若要加，只能按上述三条件加**。

### 2.3 最值得抄的一条：`prefers-reduced-motion` 的反向 opt-in

`benmyers` 的写法经我独立核验：**`prefers-reduced-motion` 出现 13 次，全部是 `no-preference`，`reduce` 是 0 次。**

```css
/* 样式表默认一条 transition/animation 都不声明 */
@media (prefers-reduced-motion: no-preference) {
  :root:not([data-animations]) .something { transition: … }
}
/* 用户在设置里显式开启动画时，用媒体查询之外的规则压过它 */
:root[data-animations="show"] .something { transition: … }
```

**为什么这比「写了再关掉」更好**：默认状态零动画，所以「减少动效」用户的偏好**天然被满足**，不依赖任何覆盖能生效；而显式开启动画的规则写在媒体查询**之外**，因此能压过 `no-preference` 判断。**这是零成本、零风险的健壮写法。**

对照：`maggieappleton` 在 `reduce` 下**只关掉叶片抖动、保留极低强度的透明度脉冲**——「限制而非取消」的范例。而覆盖率整体很低：`karpathy`、`jvns`、`mollywhite`、`lilianweng`、`lutaonan`、`tonsky`、`gwern`、`imsyy`、`axutongxue` 等**均为 0 处理**。我们已有完整处理，是优势。

### 2.4 easing 实况

主流是 `ease` / `ease-in` / `ease-out` 与 `cubic-bezier(0.5,0,0.5,1)` 一类温和曲线。唯一使用**弹簧**的是 `joshwcomeau`：

```css
--springy-spring-duration: 833ms;
--springy-spring-easing: linear(0, 0.1407 4.43%, 0.9383 16.72%, 1.0774 20.43%,
  1.1493 24.31%, 1.1629 26.95%, 1.1536 29.93%, 1.0168 43.09%, 0.9766 51%,
  1.0033 76.88%, 1);
--curve: cubic-bezier(0.17, 0, 0.21, 1.01);
```

`linear()` 手工采样出会**过冲到 1.16** 的弹簧曲线。**不建议照搬**：它与我们「克制」的动效基调不符，且 833ms 远超主流区间。

**另一处值得注意的失败模式**：`joshwcomeau` 用 `animation-delay: calc(var(--base-delay) + 1s)` 做入场接力，但 **`--base-delay` 在全语料里只有 15 处 `var()` 引用、没有任何声明**——它由客户端 JS 在运行时注入。**在 Astro 静态站上这会静默失效**（`calc()` 无效）。若采用接力编排，**必须给 `--base-delay: 0s` 兜底**。

---

## 3. 排版与度量：真实数字

### 3.1 正文度量对照（有 CSS 证据的）

| 站点 | 字号 / 行高 | 行宽（容器） | 换算成中文字 |
| --- | --- | --- | --- |
| **我们** | 18px / **1.95** | `minmax(0,760px)` | **约 42 字/行** |
| `craigmod` | **18px / 27px（1.5）** | `max-width:720px` | 约 40 字/行 |
| `lutaonan` | 17px / **1.85** | `max-w-3xl` = **768px** | 约 45 字/行 |
| `mollywhite` | 20px / 28px（1.4） | 正文另限 `40rem`；`70ch` 在 reading 列表页 | — |
| `benmyers` | — | 正文 **`min(80ch,100vw)`**，标题/侧栏才用 `30ch` | 约 80 西文/40 中文 |
| `jvns` | 16px / 20px（1.25em） | `max-width:45em` ≈ 720px | 约 40 字/行 |
| `karpathy` | 16px / 1.5 | `max-width:800px`（未设 `border-box`，外框实为 860px） | **约 100 西文/50 中文，过宽** |
| `swyx` | `--reading-font-size:1.1875rem`（19px） | `--reading-max-width:42.5rem`（680px） | — |
| `gwern` | `--GW-body-text-font-size:20px`（窄屏 18px） | `--GW-body-max-width:935px` | — |
| `allanware-zh` | `1em` / 1.5 | `--width-max:720px` | — |

**结论**：我们 `720–768px` 的行宽**与 `craigmod`、`lutaonan`、`jvns`、`allanware-zh` 完全一致**，只有 `karpathy`（800px）更宽且被公认为过宽。**行宽不需要改。**

`line-height: 1.95` 也没有同行对标可证明显偏高——`craigmod` 用 1.5（西文）、`lutaonan` 用 1.85（与中文站最接近）。**1.85–1.95 对中文长文是合理的，不建议下调。**

### 3.2 段落节奏：一条可直接用的「颗粒度」指标

`jvns` 的文章页做了量化：**64 个文本块，平均 101 字符，中位 55 字符，最长 583 字符**——中位 55 西文字符 ≈ **中文 30 字/段**。她的教程正文全部用 `<ol>`/`<ul>` 承载步骤（`ol=2 / ul=3 / li=20`），小节标题就是「step N: 动词短语」。

**可迁移**：把「**中位段落长度 30 字左右**」当作中文长文的写作硬指标，比「尽量写短」这种模糊要求可执行得多。

另一条零成本的排版技巧，来自 `karpathy` 与 `jvns`：用**一条 owl 规则**统一所有块级纵向节奏，而不是给每个标签单独设 margin：

```css
.post-content > * { margin: 20px 0; }      /* karpathy */
main > * + * { margin-top: 0.75em; }        /* jvns */
```

### 3.3 `tonsky` 的 cap-height 系统：一个进阶答案

`tonsky` 不使用 4/8px 刻度，而是**从字面光学高度（cap height）推导一切**（CSS 原文摘录）：

```css
--cap-height: calc(1rem * 12.5 / 16);          /* 16px 根字号下 = 12.5px */
--cap-ratio: calc(1 / 0.698);                   /* ≈1.4327，该字面 cap-height 比的倒数 */
--gap: var(--cap-height);                       /* 间距 = 光学高度 */
--font-size: calc(var(--cap-height) * var(--cap-ratio));          /* ≈17.9px */
--font-smaller: calc(var(--cap-height) * 11 / 12 * var(--cap-ratio));
--font-small: calc(var(--cap-height) * 10 / 12 * var(--cap-ratio));
--width: 575px;
--border: 1.5px;
--radius: calc(var(--cap-height) / 3);          /* ≈4.17px */
/* 窄屏：--cap-height: calc(1rem * 18 / 16) */
```

**它在做什么**：把间距、圆角、三级字号全部绑到「一行大写字实际有多高」，于是版式随字体走，而不是随抽象网格走。

- **优点**：换字体只改 `--cap-ratio` 一处，间距与字号同步重标定，视觉密度天然一致。
- **缺点**：**不可预测、不可肉眼校验**——`17.9px`、`4.17px` 这类值无法与其他系统对齐；`0.698` 是写死的魔数，换字体即失效。
- 他本人有篇文章叫 **"Font size is useless; let's fix it"**（`tonsky.txt:117`）。

**结论：不适合整体照搬到我们站**（我们的刻度需要与 Tailwind 协作），但**「用一个光学变量统领局部垂直韵律」的思路可用于标题与引文的局部**。

### 3.4 字体的一个巧合与一个对照

- **`gwern` 的正文衬线栈以 `"Source Serif 4"` 打头**（`--GW-serif-font-stack`），**与我们同款字体**；他的 sans 是 `Source Sans 3`，mono 是 `IBM Plex Mono`（**也与我们同款**）。一个以信息密度著称的长文站与我们选了同一套字体族，是对我们字体方案的**外部印证**。
- `gwern` 的 `--GW-body-max-width:935px` 比我们宽，但他靠**边注通道**把正文压回舒适宽度（见 §5.2）。

---

## 4. 间距与刻度系统：两条可借鉴的路线

我们实测的问题是：间距声明 350 处、47 个不同 px 值，只有 15 个是 4 的倍数。对照同行的两条路线：

### 4.1 `benmyers`：数值刻度（已完整抠出，含负值与流体档）

一套数值刻度被 `gap` / `padding-inline` / `padding-block` / `margin` **共用**：

```
gap-000 = -0.5rem   gap-00 = -0.25rem   gap-0 = 0
gap-1 = .25rem   gap-2 = .5rem    gap-3 = 1rem     gap-4 = 1.25rem
gap-5 = 1.5rem   gap-6 = 1.75rem  gap-7 = 2rem     gap-8 = 3rem
gap-9 = 4rem     gap-10 = 5rem    gap-11 = 7.5rem  gap-12 = 10rem
gap-13 = 15rem   gap-14 = 20rem   gap-15 = 30rem
```

另有流体档 `gap-fluid-1..10 = clamp(.5rem,1vw,1rem) … clamp(20rem,40vw,30rem)`。

**几点值得学**：① 档位同时覆盖**负值**与**流体**；② 同一套数值被四类间距属性复用，一致性天然成立。
**两点不能照抄**：① **它与 Tailwind 默认刻度冲突**（它的 `3=1rem`、`4=1.25rem`，Tailwind 4 是 `.75rem`/`1rem`），直接定义同名数值会与现有 class 语义打架；② 它**没有 `--space-*` 变量**，全靠工具类，刻度不是单一事实来源。

### 4.2 `maggieappleton`：语义刻度（t-shirt 尺寸）

`--space-3xs / 2xs / xs / s / m / l / xl`（7 级）。她的色彩命名同样语义化：`--color-cream` / `--color-tinted-cream` / `--color-light-cream` / `--color-crimson` / `--color-sea-blue` + 多层灰。

**命名法与我们「暖纸色 / 墨绿 / 陶土」是同一套语言**，值得直接照着命名。**但具体值无法给出**——这 7 个变量在抓到的两份样式表里**只有 `var()` 引用、没有声明**，定义在未抓到的第三个文件里。**这一点必须如实说明，不能用常识补数值。**

### 4.3 结论

建议走**混合路线**：在 Tailwind 4 的 `@theme` 里定义**语义名**（`--space-3xs…3xl`，避免与 Tailwind 数值刻度冲突），内部值按我们自己的版心重算，并吸收 `benmyers` 的「负值 + `clamp()` 流体档」两个结构性优势。

---

## 5. 组件与信息架构

### 5.1 页内目录（TOC）：三条路线

| 路线 | 站点 | 实现 | 评价 |
| --- | --- | --- | --- |
| **原生折叠，零 JS** | `lilianweng` | `<div class="toc"><details><summary accesskey="c">Table of Contents</summary><div class="inner"><ul>…</ul></div></details>`，`<ul>` **按 h1/h2 层级嵌套**，末项含 `#references` | **最省**。我们已有侧栏 TOC，但可借鉴「零 hydration」思路 |
| **原生折叠，默认展开** | `benmyers` | `<nav class="disclosure-toc"><details open><summary id="table-of-contents">…</summary><div><ol>…</ol></div></details></nav>`，配套 CSS 只有一条 | 与我们移动端 `<details>` 菜单同构 |
| **列外固定 TOC** | `allanware-zh` | `div.toc{position:fixed;top:50%;left:calc((100vw + var(--width-max))/2);width:calc((90vw - var(--width-max))/2)}`，`@media(max-width:800px){display:none}` | **把 TOC 放到正文栏之外的空白区**，不挤占正文、不打断节奏 |

> **一处需要自我更正**：我最初以为 `leaverou` 用 `:nth-child(n){--index:n}` 做「目录自动编号」。复核后**不成立**——那个 `--index` 阶梯只喂两个视觉用途（社交图标的尺寸递减、`[reversed]` 列表 marker 渐隐），**且她根本没有页内 TOC**。这条不能作为 TOC 参考。

**目录深度的实况（含我们自己的缺口）**：

| 站点 | 深度 | 说明 |
| --- | --- | --- |
| `gwern` | **h2 → h3 → h4** | 目录树即导航主干，每项带稳定 `id="toc-xxx"` |
| `lilianweng` | h1 大节 → h2 小节 | 两层嵌套（但用 h1 当节标题，语义上有问题，不要学） |
| `benmyers` | 仅 h2（10 项） | 因为他文章本来就浅（11 h2 / 0 h3） |
| **我们** | **仅 `depth === 2`** | **57 篇里 48 篇含 h3、共 1211 个 h3**；`fods-linear-algebra-calculus-convexity.md` 单篇 **83 个 h3 / 26 个 h2** → **目录只覆盖骨架的约 1/4** |

**裁决**：结构上 `gwern` 最优、**我们最差**；交互上 `lilianweng` 的 `<details accesskey="c">`（默认收起）最好。**可行组合 = `gwern` 的深度（h2/h3 嵌套）+ `lilianweng` 的可折叠容器 + 保留我们已有的 `aria-current="location"`。** 默认展开还是收起取决于条目数——`benmyers` 默认 `open` 是因为只有 10 项，我们收进 h3 后条目会很长，应默认收起。

另外 `allanware-zh` 用了一条**列外 TOC**（`position:fixed; left:calc((100vw + var(--width-max))/2)`）——把目录放进正文栏之外的空白区，不挤占正文、不打断节奏。这是与「加深度」并行的另一条增量。

### 5.2 脚注 / 边注：一条被普遍误读的能力

**先纠正一个流行说法**：你在清单里写「Gwern……脚注悬浮、侧栏摘要、渐进式展开」。实测结果：

- **`gwern` 的 `/Essays` 首页：零边注实例、零脚注实例。** 全文 12 处 `sidenote` 匹配 = 5 个变量定义（浅色 `:124-128` / 深色 `:469-473`）+ 1 个指向 `/sidenote` 的链接 + 1 处正文提及；`<aside>` = 0、`fnref` = 0、`role="doc-footnote"` = 0。
- 他**确实**实现了这套机制，但**在同一站的专文里**（`/Sidenotes` 与 `/Design`，我另外抓了这两页）。术语由他本人定义：**编号且锚定的叫 "sidenote"；不编号、仅放在文旁的叫 "margin note"**。原话（可用于我们决策）：

> 边注「利用页面大片未被使用的左右留白」；margin note「**less useful & more obscure, so tend to be unsupported**」；他自己「occasionally use margin notes for summarizing paragraphs… they function as **extremely small 'section headers'**」。

**真实结构**（`gwern-sidenotes.html`）：

```html
<!-- 正文引用 -->
<a href="#fn1" class="footnote-ref" id="fnref1" role="doc-noteref"><sup>1</sup></a>
<!-- 无名边注 -->
<span class="margin-note">Making use of margins.</span>
<!-- 文末区 -->
<section id="footnotes" class="footnotes footnotes-end-of-document" role="doc-endnotes">
```

**关键的工程洞察**：他的边注本质是**把文末脚注在宽屏下搬到页边**，而**栏宽是从正文测度反推的**，不是硬写：

```css
--GW-sidenotes-max-width: 550px;
--GW-popups-popup-max-width: 640px;
/* 边注列宽 */
width: calc(50vw - (var(--GW-body-max-width) / 2 + 96px));
```

**另一条更保守的路线**（`craigmod-essay`）：**老老实实做文末 endnotes**，语义完整、带回链：

```html
<sup id="fnref:1"><a href="#fn:1" class="footnote-ref" role="doc-noteref">1</a></sup>
<div class="footnotes" role="doc-endnotes"> … </div>
<a href="#fnref:1" class="footnote-backref" role="doc-backlink">↩︎</a>
```

**第三条路线，也是最省事的**：`lilianweng--article` **完全不用脚注**（`sup` 计数 = **0**），学术引用走「**文末 `<h1 id="references">` + 逐条 `<p>[N] 作者. "标题" 刊名, 卷:页, 年.</p>` + 正文行内链接**」。全站一张图配统一句式图注（17 处）：`<figcaption>描述文字 (Image source: <a>Zhang et al. 2025</a>)</figcaption>`。

**我们的独特优势**：`remark-gfm` 由 Astro 默认注入，`[^1]` 语法**本来就能解析**，输出结构与我们需要的完全一致（这条我读了 `mdast-util-to-hast` 源码确认）：

```html
<sup><a href="#user-content-fn-1" data-footnote-ref aria-describedby="footnote-label">1</a></sup>
<section data-footnotes class="footnotes">
  <h2 class="sr-only" id="footnote-label">Footnotes</h2>
  <ol><li id="user-content-fn-1">…<a href="#user-content-fnref-1" data-footnote-backref>↩</a></li></ol>
</section>
```

**并且发现一个我们会真实踩到的坑**：那个 `<h2 class="sr-only" id="footnote-label">` 是 **h2**，而我们的 TOC 是 `headings.filter(depth === 2)` 生成的——**文章一旦用脚注，目录里就会多出一个假的 "Footnotes" 条目**。干净的修法是配置项（已从源码确认存在）：

```js
remarkRehype: { footnoteLabel: '脚注', footnoteLabelTagName: 'p' }  // 改 tag 名，假条目就不进 TOC
```

**结论**：脚注方向成立且成本低于预期——语义由 remark-gfm 免费提供，我们只需「一个配置项 + 一套样式」，边注则再叠加 Gwern 的栏宽几何。

### 5.3 内容组织：**没有一个站实现了真正的「主题树」**

你在清单里推荐 Eugene Yan 的「把文章归入主题树而非时间流」。实测结论要修正：

- **`eugeneyan` 没有层级主题树**（无 series、无父子关系、无反向链接）。它的可导航性来自**三层叠加**：
  1. **首页人工策展「书架」**：Latest / Trending This Week / More than 50k Reads / Featured Talks / My Favourites / Selected Prototypes / Resources；
  2. **扁平标签分两类**——**emoji 标签当「栏目」用**（`/tag/🔥/` = "More than 50k Reads"、`/tag/🩷/` = "My Favourites"，书架标题直接链到 tag 页）+ 普通词标签（`/tag/eval/`、`/tag/learning/`）；
  3. Algolia 搜索 + 趋势，另有规模计数 `212 posts, 31 talks, 19 prototypes, 426,689 words`。
- `swyx` 的分类维度是**「类型」而非主题**（`.type-hint[data-category=essay|tutorial|podcast|talk]`，查询参数筛选 `?show=Talk%2CPodcast`）。
- `sgugger` 是 Categories / Tags / Archives **三个独立页**分开。
- `mollywhite` 是**侧栏人工分组**（`nav-header` 小组标题：Work / Support / About）。
- **`danluu` 连标题层级都没有**：`h1/h2/h3` 计数全为 0，全站 **204 个 `<li>`** 一条条列，用裸文本 `↑ Public posts <hr id=pt> ↓Patreon posts` 当分隔符，全部 CSS 只有 4 条规则。

**共同结论**：**层级感全部来自人工策展，而非数据模型。** 这对我们是好消息——不需要新建数据模型，用现有 Astro collections + tags 就能落地。

**另一个量化证据**（来自案例库仓库 `chinese-independent-blogs`）：它收录 **982 个中文博客**，用**自由标注**产生了 **630 个不同标签**（`编程 525 / 生活 317 / 随笔 294 / 技术 261 / 前端 81 …`）。**自由标注的词汇量会爆炸**——这印证了我们站已有的 `canonicalTag` + `tagAliases` 标签规范化是必需的，不应放松。

### 5.4 组件的稀缺程度（反向证据）

| 能力 | 有实现的站点 | 说明 |
| --- | --- | --- |
| 页内目录 | `lilianweng`、`leaverou`、`benmyers`、`allanware-zh`、我们 | **稀缺**，多数站没有 |
| 脚注/边注 | `craigmod-essay`（1 个 endnote）、`gwern`（专文里） | **9 站全为 0**（英文组实测） |
| 暗色模式 | 18 站 | 见 §1.1，**多数没有** |
| 阅读时长 | `lilianweng`（服务端直出 "31 min"）、`leaverou`、`dingran` | 可低成本补 |
| 阅读进度 | 我们、`aemoncao`（回顶按钮内嵌百分比）、`chinomars` | **我们已超出多数站点** |
| 相关文章 | 仅 `eugeneyan`，且**绑死 Algolia Recommend**（容器初始 `display:none`） | 我们自己算更合适 |
| 反向链接 | 无 | — |
| 主题枢纽页 | 无（见 §5.3） | — |

**我们现有能力已超出同批绝大多数站点**：跨文档视图过渡（`@view-transition`）全语料**只有我们和 Hugo 官方文档在用**；`prefers-reduced-motion` 完整处理多数站没有；TOC + 进度 + 阅读记忆 + 代码复制 + 打印样式是成套的。

---

## 6. 可量化的硬指标（有权威出处）

### 6.1 WCAG 2.2「对比度（最低要求）」原文条款

W3C 官网对非浏览器 UA 一律 403（Cloudflare 拦截），改用 **W3C 官方 GitHub 仓库**的源文件取到原文：

- **AA 级正常文本 ≥ 4.5:1**（SC 1.4.3 原文：*"The visual presentation of text and images of text has a contrast ratio of at least 4.5:1"*）。
- **大字号文本 ≥ 3:1**（*"Large-scale text and images of large-scale text have a contrast ratio of at least 3:1"*）。
- **「大字号」的准确界定**：*"18 point text or 14 point bold text is judged to be large enough to require a lower contrast ratio"*；换算关系 *"1pt = 1.333px, therefore 14pt and 18pt are equivalent to approximately 18.5px and 24px"*。
- **不得四舍五入**：*"the computed values should not be rounded (e.g., 4.499:1 would not meet the 4.5:1 threshold)"*。
- **豁免**：无活动状态的 UI 组件内的文本、**纯装饰**、不可见文本、图片中伴随其他重要视觉内容的文本，**无对比度要求**；logo 与品牌名也无要求。
- **评估口径**：*"refer to the foreground and background colors obtained from the user agent, or the underlying markup and stylesheets, rather than the text as presented on screen"*——即按样式表算，不按屏幕看。

**对我们的适用性**：我们正文 18px，**未达 24px（18pt）的大字号门槛**，因此**正文字号必须按 4.5:1 要求**（不能因为是「正文大字」就放宽到 3:1）。这一条直接决定 §1.6 里陶土色必须提亮。图注、脚注等小字同样是 4.5:1。

### 6.2 其他可写进验收的硬指标

| 指标 | 数值 | 出处 |
| --- | --- | --- |
| 主流过渡时长 | 150–300ms（众数 `.25s`×81 / `.2s`×77） | 本文 §2.1 全语料普查 |
| 我们现有动效时长 | 160 / 220 / 360 / 380ms | 落在主流带内，无需改 |
| 中文长文行宽 | 720–768px / `min(80ch,100vw)` | `craigmod` 720 / `lutaonan` 768 / `jvns` ≈720 / `allanware-zh` 720 |
| 中文段落中位长度 | 约 30 字/段 | `jvns` 中位 55 西文字符换算 |
| 暗色下强调色 | **必须另出提亮值**（同色相抬 L） | 陶土 `#925134` 在暖暗底仅 2.86:1，不达 AA |
| `theme-color` | **明暗两套，带 `media` 属性** | `swyx.html:12-13` 原文 |

`swyx` 的正确写法（唯一一个做对的）：

```html
<meta name="theme-color" content="#f5f0e7" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#111523" media="(prefers-color-scheme: dark)" />
```

### 6.3 超长文的工程实况：`content-visibility` 的负面结论

这是我们最关心的一项（我们试过按章节用 `content-visibility:auto` + 2000px 占位，因会改变目录位置与阅读进度而放弃）。全语料普查结果：

| 命中 | 定性 |
| --- | --- |
| `gwern--css1.css:1081-1082` | **被 `/* */` 注释掉，未生效**：`section.level1:nth-of-type(n+4){content-visibility:auto;contain-intrinsic-size:200vh}` |
| `maggieappleton`、`allanware-zh` | `img{content-visibility:auto}`——**只作用于 `<img>`** |
| `lutaonan` 的 `contain-intrinsic-size:1px` | 是 Tailwind 的 `@supports` 特性探测，**不是性能手段** |

**最有分量的发现**：`gwern` 那段被注释掉的代码，注释原文是——

> *"Lazy-load below-fold sections in supported browsers. **Disabled temporarily pending layout redesign to compensate for layout containment.** —Obormot 2021-03-21"*

**即：Gwern 团队做过与我们几乎完全相同的实验（按章节、从第 4 个起、用 `200vh` 占位），并且因为同一个「布局包含（layout containment）」问题而放弃了。** 我们当初的否决因此获得了**独立同行证据**，不必再回头。

**精确结论**：全语料**没有任何站点把 `content-visibility` 用于正文/章节**；两处真正生效的用法都只挂在 `<img>` 上。

**但仍然有一条安全增量**：把 `content-visibility:auto` **只用在图片**上（`maggieappleton`、`allanware-zh` 的既有做法）——图片有显式 `width/height` 时占位高度确定，**文档总高不变，因此不动 TOC 位置、不动阅读进度**，与那个被否决的实验有本质差别。同理 `contain: content` 可以挂在**折叠内容的包裹层**上（`gwern--css2.css:1534-1536`）：合上时高度为 0，同样无几何风险。

**其他负面结论（明确「未发现」）**：未发现站点做文章级分页/分章、未发现虚拟滚动、**未发现任何站点处理 KaTeX/MathJax 的打印跨页断裂**（这是空白，需自研）。

**注记路线的工程代价（补充 §5.2）**：`gwern` 的边注在 `@media (max-width:1760px)` 下**直接 `display:none`**（`gwern--css1.css:2360`），页边注断点为 1497px；他自己也承认边注需要在全文范围内 *"reflow as necessary over the whole page, which is **user-visible & distracting**"*。这是「边注成本高」的一手自述。

### 6.4 我们自己 4.1MB 页面的成因：已实测证实

专项报告提出一个**假设**（KaTeX 每式输出两份：可见 HTML + 隐藏 MathML），我直接对构建产物做了量化验证：

```powershell
# dist/blog/fods-linear-algebra-calculus-convexity/index.html
```

| 指标 | 实测值 |
| --- | --- |
| 页面总字节 | **4,083,673** |
| `katex-mathml` 块数（隐藏的 MathML） | **2,232** |
| `katex-html` 块数（可见排版） | **2,232** |
| **MathML 子树估算字节** | **1,661,341 ≈ 全页 40.7%** |
| 元素总数 / `<span>` 数 | 109,789 / 75,024 |
| `<annotation>` 数（TeX 源码副本） | 2,232 |

**假设成立**：那篇页面的 **约 41%（1.66MB）是视觉上完全不可见的 MathML**，每个公式都同时输出「可见 HTML」与「隐藏 MathML + TeX 源码副本」两份。

**但这个代价是自觉的取舍，不是 bug**：MathML 是给读屏软件与复制粘贴用的（我们的实施记录明确写了「可访问 MathML 均保留」）。KaTeX 的 `output` 选项可以切到 `html` 单份、体积近乎减半，但**会牺牲无障碍与公式复制**。因此**正确的动作是把这个数字记录下来，而不是删掉 MathML**——它解释了「为什么全文单页必然重」，也说明继续在 CSS 层面微调收益有限（能动的只有那 59%）。

### 6.5 CJK 排版：全语料实况与我们该改的几行

**中英混排间隙（CJK-Latin spacing）全语料只有 3 家做过：**

| 站点 | 做法 | 备注 |
| --- | --- | --- |
| `yibie` | **真的用 Heti**：CDN CSS + `heti-addon.min.js` + `new Heti(".heti").autoSpacing()` | 依赖 unpkg 单点 |
| `lutaonan` | **只有 Heti 的 CSS 垫片，运行时未证实**：CSS 里有 6 处 `heti-spacing` / `heti-adjacent` 类，但 HTML 里 `heti` 出现 **0 次**、无 Heti script → 「CSS 兼容层在，消费它的 JS 不在」 |
| `aemoncao` | **pangu.js**（`cdn.jsdelivr.net`） | 同样单点 |

其余中文站（`alpha2016`、`charlesliuyx`、`chinomars`、`dingran`、`shrekshao`、`bestxtools`、`imsyy`、`axutongxue`、`allanware-zh`）**零混排处理**。

**标点相关属性的全语料计数（全部为 0）：**

| 属性 | 命中 |
| --- | --- |
| `text-spacing-trim` | **0** |
| `text-autospace` | **0** |
| `hanging-punctuation` | **0** |
| `line-break` | **0**（包括我们自己以外的所有站） |
| `text-justify` | **0** |
| `keep-all` | 2（**都在 PaperMod，且只用于 `#menu` 与 `table`，没有一家用于正文**） |
| `font-feature-settings` 里的 `palt`/`halt` | **0**（41 处全是拉丁特性：`cv08`/`case`/`liga`/`ss01` 等） |

**`text-align: justify` 只有英文站在用**（`craigmod`、`lena-voita`、`gwern` 的 `--text-alignment:justify`）——**无 CJK 断行支持时 justify 会撕出字间大洞，我们不要**。

**首行缩进：中文站 0 例。** `text-indent` 的 91 处命中里，唯一「正经的正 em 缩进」是 `gwern`（英文站，`--text-indent:1.75em`，宽屏 2.5em）；其余全是反向证据——`craigmod` 显式清零（`text-indent:0em`）、`axutongxue`/`gwern`/我们自己的 TOC 用的是**悬挂缩进负值**、`eugeneyan` 的 `-999px` 是无障碍隐藏。**`2em` 首行缩进在书籍排版里是「替代段间距」的手段，与段间距同时用是重复标记**——我们不做是对的。

**字体策略：我们的方案该保留。** 实测我站字体总体积 **863,316 字节 / 8 文件**，其中中文子集 **5 文件 = 664,652 B**，拉丁/无衬线 3 文件 198,664 B，每个 face 带语料推导的显式 `unicode-range`、`font-display: swap`。

与 `imsyy`（HarmonyOS **53 个 @font-face**，按 `unicode-range` 切 6 个连续大块 + 47 个常用字离散清单，走 bilibili CDN）的机制差异：

- **它更省单页带宽**——普通页面只命中少数几片，稀有块常年不下载；
- **我们更省请求数/依赖/隐私，且覆盖有保证**——但因为我们按「全部语料」切片，**任何一篇真实长文都会同时命中全部 3 片正文分片**，读者要拿满约 650KB。

**裁决：保留现方案。** 对一个小型静态博客（文章长、语料固定、二次访问有缓存），650KB 一次性缓存优于 53 片外部 CDN 依赖。若哪天真要省，砍掉 600 字重子集可省 **250,936 B**，但宋体合成粗体很难看，**不建议**。

**我们正文度量的位置（含一处需要自知的高值）：**

| 站点 | 字号 | 行高 | ≈中文字/行 |
| --- | --- | --- | --- |
| `gwern` | 20px（手机 18px） | 1.45–1.60（按视口递增四档） | ≈47 |
| `karpathy` | 16px | 1.5 | ≈46 |
| `eugeneyan` | 16px | 1.5 | ≈45 |
| `lilianweng`/PaperMod | 16px | 1.6 | ≈45 |
| `lutaonan`（中文） | 17px | **1.85** | ≈42 |
| `jvns` | 17.3px | 1.25 | ≈40 |
| `tonsky` | ≈25.8px | 1.5 | ≈22 |
| **我们** | **18px**（手机 17px） | **1.95** | **≈42** |

- **行宽 ≈42 字/行：与中文样本（`lutaonan` 42）和英文样本（40–47）都对齐，无需改。**
- **段间距 `1.5em`：与语料一致（`lutaonan` 1.41em、`craigmod` 1.5em、`benmyers` 1.5rem），无需再加。**
- **行高 `1.95` 需要自知：它是语料观测上限（中文 `lutaonan` 1.85）之外的值。** 语料长文行高聚在 **1.5–1.6**；`craigmod` 给日文的规则也是 1.6。我们中文 + 高公式密度确实有理由疏排，**但「1.95 高于所有观测样本」是个事实**。若想更稳，**建议落到 1.85–1.9**；维持 1.95 不算错，但要清楚这是超出对照的选择（不是「大家都这样」）。

**`text-wrap: balance/pretty` 已是主流**（≥9 站：`benmyers`、`craigmod`、`gwern`、`joshwcomeau`、`leaverou`、`lutaonan`、`swyx`、`tonsky`、PaperMod）；中文页里只有 `lutaonan` 一家有。我们标题 `text-wrap: pretty` + `.text-balance` 与主流一致。

**我们 CSS 里两处该改的（一行级）**：

| 现状 | 问题 | 建议 |
| --- | --- | --- |
| `global.css:22` 的 `line-break: strict` **只写在 `h1,h2,h3,h4`** | **正文 `.rich-content` 完全没有 CJK 禁则**（只有 `overflow-wrap:anywhere`） | 把 `line-break: strict` **扩展到 `.rich-content`**——本报告里性价比最高的一条，1 行、只影响 CJK 禁则、拉丁无副作用 |
| `global.css:75` 的 `.rich-content{overflow-wrap: anywhere}` | `anywhere` **会参与 `min-content` 尺寸计算**，与我们的 `minmax(0,760px)` 栅格和宽表格相互作用；且允许拉丁词任意点断。**语料里 0 家对正文用 `anywhere`**（`gwern`/`joshwcomeau`/`tonsky` 均 `break-word`，`eugeneyan`/PaperMod 用 `word-break:break-word`） | 正文改 `overflow-wrap: break-word`；`anywhere` **只留给 `pre` 与长 URL** |

**可选、低优先**：`.rich-content{letter-spacing:.005em}`（≈0.09px）几乎无视觉收益，却是「人为引入 CJK 字距」——可删。

**明确不要做的 CJK 相关项**：引入 Heti / pangu **运行时**（单点 CDN、会污染复制文本、必须给 `.katex` 打排除补丁）；`text-indent: 2em`；全局 `keep-all`（只留给短 UI 串/表格）；对中文 `text-align: justify`；正文 `word-break: break-all`；指望 `font-feature-settings: palt/halt` 做标点挤压（**语料 0 例，且需字体保留对应 GSUB 表——我们的思源宋体子集是否保留 `palt` 本地无法验证，想用先查 GSUB**）。

**一个零风险的渐进增强**：`.rich-content{text-autospace: normal}` 一行——它正是为 CJK-Latin 自动间隙设计的属性，不支持即退化为现状。**先上这一行，不要一上来就写 JS。**（本环境离线，其浏览器支持度未能实测，需在目标浏览器验证。）

---

## 7. 对你原始清单的更正清单

你要求「亲自去看」，所以这些不一致必须逐条报给你。**这些更正不影响你的清单价值**——恰恰说明它是可核验的（如果它不可靠，我会到处都对不上）。

### 7.1 描述不符（4 处）

| 你的描述 | 实测 | 证据 |
| --- | --- | --- |
| `craigmod.com/essays/as_we_may_read/` 是「专门谈**网页**该怎么被阅读」的随笔 | 该页副标题是 **"From print to digital and back to print"**，谈的是**读书**（纸质 vs 数字）与读者对数字阅读的「信任被缓慢侵蚀」，并说明它是一篇发表于 Aeon 的长文 *Future Reading* 的背景说明。**价值很大，但方向是「阅读的信任」而非「网页排版」** | `craigmod-essay.txt` 全文 |
| `yibie.github.io` 是**摄影类**个人站，「图片密度高」 | 抓到的页面 `<title>` 是「纸短情长」，`description` 是「书桌上的一叠私人信札」，**`img=0`、`svg=0`、`figure=0`**；视觉由 CSS 层（`.dappled-layer` 四层光影）承担。是**书信体文字博客**，不是摄影站 | `yibie.html` / `text/yibie.txt` |
| Gwern 站「脚注悬浮、侧栏摘要、渐进式展开」（暗示首页可见） | **首页零边注/脚注实例**，只有 CSS 变量与指路链接；机制在同站 `/Sidenotes`、`/Design` 专文里 | `gwern.html:124-128,469-473,948,1404` |
| Marginalia「作者大量写『为什么删掉功能』」 | 抓到的首页**没有任何「删功能/拒绝现代 Web」宣言**。最接近的只有两句「给注意力加摩擦」的表述：*"the feeds and algorithms have a way of creeping up on you, taking over your whole existence"*、他给自己 *"add friction"* 的做法。相关文章列在 `web-design` 标签下（12 篇），**但正文不在语料内，我不据此推断** | `text/marginalia.txt:34-36` |

另外 `jvns` 的「手绘示意图」**我无法从抓取的页面证实**：她的文章页是 **4 张裸 `<img>` 位图、`figure=0`、`figcaption=0`、`svg=0`**。她的写作特征（短段 + 清单 + `step N:` 标题）是确凿的，但「手绘」需要看图片本身，文本证据不支持断言。

### 7.2 调研本人的两处推断需要修正

| 你的推断 | 实测 |
| --- | --- |
| 「Material 规范用 `#121212` 作基底……技术上就是 CSS 变量 + `prefers-color-scheme`，再用 localStorage 记住用户手动选择——Gwern 和 Lilian Weng 的站都能直接扒这套实现思路」 | ① Material 规范页**只抓到 SPA 外壳，规则原文取不到**；② 真实站点里 **`#121212` 只有 2/18 在用**，主流是 `#161616`/`#222` 这类中性暗；③ **Gwern 根本不是这套机制**（靠 `<style media="(prefers-color-scheme:dark)">` 整表切换，无类无属性、无法手动覆盖）；只有 Lilian Weng（PaperMod）是这套，**且它有 5 个实现坑**（§1.5 路线 B） |
| 「暗色模式不是反色」 | **这条被证据支持**，但要补一句更重要的：**也没有任何一家给出「暖色暗底」的现成答案**（暗色值清一色中性灰/冷灰）。暖色暗底是空白区 |

### 7.3 抓取脚本的假阳性（自查，避免污染结论）

机器统计不能用来看结论，本次抓到至少 6 处：

| 假信号 | 真相 |
| --- | --- |
| `taniarascia` 的 `color-scheme` 计数 127 | **126 个是 `prefers-color-scheme` 的子串**；真正独立的 `color-scheme` 声明**只有 1 条** |
| `maggieappleton` 的「15s、3s 超长动效」 | `15s` 实为 `animation-delay:-.15s`；`3s` 实为 `transition:all .3s`。**最长动画只有 1.2s** |
| `benmyers` 的「`ch=30` 作行宽」 | 正文行宽是 **`min(80ch,100vw)`**；`30ch` 只出现 3 次，给标题与侧栏 TOC |
| `craigmod` 的 `data-theme="auto"` | **是 Cloudflare Turnstile 组件的属性**，与主题无关；该站真实开关是 media query，CSS 里**没有任何 `[data-theme]` 选择器** |
| `axutongxue` 的「库: lunr」 | 唯一命中是微信 URL 里的子串 `luNR`；其搜索实为未落盘的 `find.js` |
| `eugeneyan` 的 `toggle=12` | 两份 HTML + 两份 CSS 里 `toggle` 计数**均为 0**，无法复现，已弃用 |
| `pages-themes`/`awesome-personal-websites` 等的 `.dark=1` | 是 GitHub 自身 UI 的噪声，实测真实 `.dark` 选择器为 **0** |

`leaverou` 的 `toggle=2` 也不是控件——是**两篇文章的标题**（`/blog/2026/dark-mode-toggles/`），而这两篇标题恰好就是 §1.5 引用的那个观点。

### 7.4 你剔除的失效链接：本次得到交叉印证

你实测 404 后剔除的链接里，`randallkanna.com`、`sjmielke.com`、`1023.io`、`mithi.github.io` **恰好都收录在 `awesome-personal-websites` 这份 2020 年的清单里**——说明**站点后来死了，不是清单造假**。这反过来印证了你的核验是认真的。

**更强的量化证据**（来自 `chinese-independent-blogs`）：该列表收录 982 个博客，末尾另有 **424 个被移入「疑似失效」区**（RSS 持续抓取失败），并逐条标注失败原因（`HTTP 522`/`526`/`530`、`response is not RSS/Atom` 等）。

**即约 30%（424/1406）的中文独立博客已经损坏。**

这条对我们是**直接可用的设计结论**：**任何依赖外部链接长期有效的功能（友链、blogroll、外链引用）都必须配机器校验**，否则必然腐烂。他们的做法是「每小时检测 RSS，明确错误持续 1 天、其他错误持续 7 天即移入失效区」——这套机制可以直接搬成我们构建期的一次外链检查。

---

## 8. 设计理念与美学：一手材料

### 8.1 Craig Mod：核心是「信任」

那篇说明文的核心论点（读完全文后提炼）：

1. 2014 年他发现自己已近一年没读完任何电子书，**并非主动决定，而是一次「缓慢的信任侵蚀」**（"a much more nuanced, slow erosion of trust"）。
2. 这不是反数字——他问过的作者、编辑、技术人里**没有人反对数字阅读**（"nobody I spoke with was against digital. That is, nobody was enraged."）。
3. 关键变量是读者与一本书的**关系与承诺**，而电子书生态的种种约束恰好在破坏这种关系。
4. 印刷术有数百年打磨其形态，数字只有约八年——**"we can do better"**。
5. 反例是 Web 本身：开放、可被所有人触碰，所以真的变好了；电子书是封闭宇宙，设计改进几乎推不动。
6. 结论：**读者不是理性主体而是情感主体**，所以我们有理由要求更好的排版、开放与信任。

**对我们的意义**：这段话解释了「为什么要为排版较真」——排版不是装饰，是**信任的载体**。对一个持续更新的研究札记站，「信任」的具体表现是：地址不变、内容不丢、长文可连续阅读、打印与离线可用。这些我们已经在做（全文单页、保留原地址、打印样式、RSS）。

他也提供了**最保守可用的脚注范式**（文末 endnotes + `role` 语义 + 回链 `↩︎`），见 §5.2。

### 8.2 Lea Verou：对「暗色开关」的正面反对

她有两篇直接相关的一手文章（标题即观点）：

- **"The best dark mode toggle is probably none"**
- **"Dark mode toggles: two states are enough"**

她本人用纯 CSS `light-dark()` + `oklch()` 实现全自动明暗，**不提供切换控件**。她的代码里还有一条很有价值的工程取舍记录（CSS 注释原文）：

> *"Disqus fails to parse the accent color from the stylesheet (i.e., it doesn't understand the `oklch()` function), so to make it work again (and show the comments), we need to set the accent color in the format Disqus can parse."* → 于是被迫回退 `--color-accent: hsl(336 100% 50%)`。

**对我们的意义**：① 暗色开关不是必须的，「跟系统」的纯 CSS 方案成本最低、零闪烁、零状态；② **如果我们全面 `oklch()` 化，任何第三方注入（我们这里是 Giscus 评论 iframe）都可能解析失败**——这是一个真实的兼容性约束，必须在方案里留回退。

她还提供了一条对我们「全文单页」很实用的排版技巧——**用 `clamp()` 从剩余外边距算出图可以出血多少**：

```css
--bleed: clamp(0px, var(--content-margin-end) - var(--sidebar-width)
              - var(--sidebar-gutter) - var(--min-padding), 3em);
margin-inline: 1em calc(-1 * var(--bleed));
```

**正文保持窄量度，图按可用外边距自动出血并封顶 3em**——这正是长文里「图要宽、字要窄」冲突的优雅解法。

### 8.3 Gwern：token 按组件语义组织

他的变量命名是 `--GW-<组件>-<部位>-<属性>`，**按组件语义分组**而非按颜色分组：

```
--GW-footnote-border-color            --GW-footnote-backlink-border-color
--GW-footnotes-section-top-rule-color --GW-sidenote-max-width
--GW-sidenote-scrollbar-thumb-color   --GW-sidenote-self-link-border-color
--GW-epigraph-quotation-mark-color    --GW-embed-border-color
--GW-table-zebra-stripe-alternate-row-background-color
```

全站 **170+ 个变量**。**优劣评价**：按组件分组的好处是「改一个组件的观感时，相关变量聚在一起」；坏处是**变量数会膨胀**，且同名颜色在不同组件下取值不同时（如他的 5 个 `#aaa`）会出现大量重复字面量。**折中方案**：底层保留语义色令牌（paper/ink/line/accent），上层再加少量组件级令牌引用它们。

### 8.4 图形语言：四种可辨识的路线

| 路线 | 站点 | 做法 |
| --- | --- | --- |
| **字体装饰纹样**（零位图） | `gwern` | 首页 **`<img>` = 0**。图形语言全部由 **22 个 data-URI** 承担：14 个 SVG（`--GW-image-*-svg`）+ 8 个 GIF 纹底。可读名字：`asterism-triplewhitestar`、`japanesecrest-tsukinihoshi-dotlessmoon`、`sun-verginasun-black`、`swiss-spiral-roll`、`three-wavy-lines-ornament-left/right`、`single-black-star` 等。用法是**装饰背景**与导航饰纹（`<use href="…/ornament/sequential-nav-icons-arabesque.svg#direction">`）。**零 HTTP 请求、可换色、随字号缩放** |
| **自绘矢量图标 + 单色驱动** | `maggieappleton` | 64 个内联 SVG **全是 15–32px 图标量级**（18×13、22×12、20×10、28×10 各若干，最大是 67×65 的叶子 logo），全部 `fill:#04A4BA` 单色。她的「手绘感」**载体是 12 张 webp 封面（400×400）**，不是 SVG——而**这些位图的画风从 HTML 判断不出来，我不作断言** |
| **自绘矢量做「手绘感」** | `joshwcomeau` | 54 个 SVG 分三类：①**全宽手写波浪分隔线**（`viewBox="0 0 1557 213"`、`0 0 5120 337`，配 `preserveAspectRatio="none"`）；② lucide 图标；③ 小符号。**说明手绘感完全可以用自绘矢量实现，不必退回位图** |
| **零图形** | `marginalia` | **`<script>`=0、`<img>`=0、`<svg>`=0**，整套图标系统用 **12 种 / 40 个 emoji**（📁 🤖 💭 📄 🔧 🏷 🔗 🌎 ✉️ …）；`<table>` 当布局与索引。图标系统总字节 = **0** |

**图片工程实践对照**（差异极大）：

| 站点 | `loading="lazy"` | `srcset`/`sizes` | `width/height` 防 CLS | `<picture>` | webp |
| --- | --- | --- | --- | --- | --- |
| `lutaonan` | 63 | ✅ 64 处 | ✅ 64/65 | ❌ | ✅（`webp=192` 是 srcset **候选 URL 累加**，不是 192 个文件） |
| `gwern`（内容页） | 36/36 | ❌ | ✅ **36/36**（另加 `data-aspect-ratio`） | ❌ | ❌ |
| `swyx` | 7 | ❌ | ✅ 15/15 | ❌ | ✅ 13 |
| `brutalistwebsites` | **1599/1599**（含首屏） | ❌ | ❌ **`style="width:400px"` 无 height** | ❌ | ❌ |
| `imsyy` | **0** | ❌ | ❌ | ❌ | ✅ 12 |
| `alexwest` | **0** | ❌ | ❌ | ❌ | ❌（105 张原图 JPEG） |
| `jvns--article` | **0** | ❌ | ❌ | ❌ | ❌ |
| `hugo-themes`（产品页） | 0 | ✅ 1276 | ✅ 321 | ✅ **384** | ✅ 638 |

**两条结论：**

1. **`avif` 在全部 60+ 个页面里出现 0 次**；`<picture>` 只在 `hugo-themes`（主题画廊，产品页）大量出现。我们站内几乎不落位图，**为不存在的负载引入 `avif`/`<picture>` 是过度设计**。
2. **`brutalistwebsites` 的「全部 lazy」是个反面教材**：1599 张全部 `loading="lazy"`（**包括首屏**）且只有 `style="width:400px"`、**无 height / 无 aspect-ratio** → 既牺牲首屏 LCP 又制造布局抖动。「一律 lazy」这条规则本身不成立，**必须配合宽高与首屏 eager**。

**`lutaonan` 的单标签是本次普查里属性最完整的写法**（可作为我们的「属性清单」基准）：

```html
<img src="…webp"
     srcset="…320w, …640w"
     sizes="(min-width:1280px) 260px, (min-width:1024px) 23vw, (min-width:640px) 30vw, 100vw"
     width="1000" height="747" loading="lazy" decoding="async" alt>
```

### 8.5 图注规范：本次最明显的空白区

**除 `gwern` 系列外，60+ 个页面里 `figcaption` 几乎不出现。** 而 `gwern` 做得最好——`gwern-design` 有 **9 组 `<figure>` + 9 个 `<figcaption>`**，并做了**三段分工**：

| 位置 | 承载内容 | 例子 |
| --- | --- | --- |
| `<figcaption>` | **短句** | `Time well-spent.` |
| `title` 属性 | **长解释** | （悬停可见） |
| `alt` | **无障碍描述** | 与前两者互不重复 |

图片本身还带 `data-aspect-ratio` + `decoding="async"` + `loading="lazy"` + `height`。排版侧有专门规则（`.markdownBody .columns.figures figure/figcaption`）。

**其他站点的图注做法均为代偿或缺失**：

- `jvns--article`：**`figure=0`**，用**正文前一段散文**当图注（"Here's what the battery looked like:"），且 4 张图是**裸 `<img>`、无 alt、无宽高、无 lazy**，内容是**电路板/电池的实物照**——**她「以手绘示意图著称」这一点在这篇素材里无法证实**。
- `lilianweng--article`：**17 处统一句式** `<figcaption>描述文字 (Image source: <a>Zhang et al. 2025</a>)</figcaption>`——**先描述、再括号内给「作者 年份」并链接原文**。这是学术长文最值得抄的图注模板。
- `jalammar`：`<strong>Figure: 标题</strong><br />描述…<br /><strong>Model:</strong>…` 三段结构化，且截图加 `border:1px solid #bbb; width:90%`（**浅色截图放在暖底上必须描边，否则「飘」**）。
- `mccormickml`：**「图注做得扎实」这条我核实不了，且现有证据是反的**——抓到的只是索引页，5 张图全是 `img.post-thumbnail`，`figure=0`、`figcaption=0`。要验证需文章详情页，**本批素材没有**。

### 8.6 密度要看清来源：`alexwest` 不是作品集

`alexwest` 的 `img=105 / svg=138` 看着极密，实测**是一篇「嵌了几十条推文」的书籍营销落地页**（Rails + Bootstrap 4）：

- 105 张图 = **69 张推文头像**（`.tweet-card__avatar`）+ 36 张推文媒体图，全部内联 `style="height:150px"`、**无 width/height** → CLS 风险；
- 138 个 svg = 推文卡片的 **X 认证徽章**与 logo；
- **lazy / srcset / decoding / fetchpriority 全为 0**。

**结论：它的高图形密度来自第三方嵌入，不是设计资产**，不要把它当密度标杆。

另外 `tonsky` 有 **6 个自定义光标**（`--cursor` / `-pressed` / `-hand` / `-hand-pressed` / `-i-beam` / `-i-beam-pressed`），全部是 `-webkit-image-set(url(/i/*@2x.png) 2x) <hotspot>`。**取舍诚实**：优点是可表达「按下」反馈；(a) 6 个 2x PNG 位图各占一请求且带 `?t=` 时间戳破坏缓存共享；(b) **只有 `-webkit-` 前缀，Firefox 不生效**；(c) 自定义 i-beam 会削弱文本选区的命中感；(d) 每个光标要手调 hotspot，维护成本不低。**不建议抄。**

### 8.7 我们的 SVG 优先策略：站得住，且是少数派正解

60+ 个页面里**真正自绘矢量的只有 6–7 家**（`gwern`、`maggieappleton`、`joshwcomeau`、`benmyers`、`liruifengv`、`hugo-deploy-ghpages`、`mollywhite`）；其余是**外链徽章**（`bestxtools` 用 shields.io、`chinese-independent-blogs` 用 badgen）、**图标字体 CDN**（10 家仍在引 Font Awesome CDN，`axutongxue` 甚至引百度 CDN 的 FA 4.7.0）、或 GitHub 自身的 octicon。

**三个支持我们保持现状的证据：**

1. **内容页可以完全没有位图**：`gwern` 首页 `img=0`、`jvns` 首页 `img=0`、`marginalia` `img=0 svg=0`，都活得很好。
2. **`mollywhite` 给出了「不引 CDN 也能用成熟图标」的范式**：她把 Font Awesome 图标**内联成 SVG**（注释里保留 FA 许可）——**只借图形，不引单点**。
3. 我们**没有摄影内容不是短板**：`craigmod` 靠摄影撑是因为作者是摄影师；`jvns` 那些实物照是「我刚修好的电路板」这类**证据性内容**，是刚需而非装饰。研究札记不需要这种东西。

**可借鉴的三条增量**：① `gwern` 的 `<figure>` 三段分工（§8.5）——**我们最该补的一项**；② `joshwcomeau` 的明暗双版插画（`data-use-global-color-mode`），解决「暖纸底插图进暗色会脏」，**不必重绘**；③ 「手绘感用自绘矢量 + 纹样 data-URI 做」——把封面级 SVG 下沉到排版级 SVG（章节尾花、分隔纹样），零请求且随字号缩放。

---

## 9. 汇总：十二条可迁移经验，按优先级

| # | 经验 | 来源 | 对我们的动作 |
| --- | --- | --- | --- |
| 1 | **暗色必须另出提亮强调色**（同色相抬 L） | 对比度实算 + mollywhite/taniarascia/leaverou | 陶土 `#925134` → `#c9805c` 一类 |
| 2 | **三态 `[data-theme]` + `:not([data-theme])` 回落系统** | `benmyers`（已独立核验 52/52） | 照抄机制，但压缩成「一份变量表 + 两条通路」 |
| 3 | **首屏防闪白必须把内联脚本放 `<head>` 且是 `is:inline`** | PaperMod 的坑（脚本在 `<body>`）+ 多站正例 | 直接采用 |
| 4 | **`theme-color` 用明暗两套带 `media` 的 meta** | `swyx`（唯一做对） | 直接采用 |
| 5 | **`prefers-reduced-motion` 用反向 opt-in**（默认不声明动画） | `benmyers`（已核验 13/13） | 重构现有动效声明方式 |
| 6 | **脚注语义 remark-gfm 已提供，只需配置 + 样式** | `mdast-util-to-hast` 源码 + Gwern/CraigMod | 配置 `footnoteLabelTagName` 防污染 TOC |
| 7 | **边注栏宽从正文测度反推**，不硬写 | `gwern` `calc(50vw - max-width/2 - 96px)` | 边注阶段采用 |
| 8 | **语义化间距刻度（t-shirt）+ 负值 + `clamp()` 流体档** | `maggieappleton` + `benmyers` | 在 `@theme` 里定义 `--space-3xs…3xl` |
| 9 | **引用走「文末 References + 行内链接」比脚注更省** | `lilianweng--article`（`sup`=0） | 中文学术长文可优先这条 |
| 10 | **内容组织靠人工策展，不靠数据模型** | `eugeneyan` 书架 + 标签、`mollywhite` 侧栏分组 | 首页书架 + 稳定 slug 的精选 tag |
| 11 | **外链必须机器校验**（30% 损坏率） | `chinese-independent-blogs` 424/1406 | 构建期外链检查 |
| 12 | **明暗双版插画**而非重绘 | `joshwcomeau` `data-use-global-color-mode` | 暗色阶段采用 |

**以及三条明确不要做的**：装饰性循环动效（全语料无正例）、弹簧/超长动效编排（`joshwcomeau` 833ms 弹簧与我们基调不符）、per-token 复制 4 条主题规则（`taniarascia`，规则数 ×4）。

---

## 10. 复现方式

```powershell
# 抓取（Node 自带 OpenSSL，绕开本机 schannel 故障）
node _site-research/fetch-v2.mjs
node _site-research/extract-v2.mjs
# 交叉校验
node _site-research/dark-census.mjs      # 暗色普查
node _site-research/motion-census.mjs    # 动效时长普查
node _site-research/contrast.mjs         # WCAG 对比度复算
```

素材落在 `_site-research/`（已加入 `.gitignore`，可随时删除重建）。原始 HTML / CSS / 纯文本分别位于 `html/`、`css/`、`text/`；汇总事实在 `facts.json` 与 `facts.md`。

> **注意**：`facts.md` 是**机器初筛**，含 §7.3 列出的假阳性，引用前须回原始文件核对。
