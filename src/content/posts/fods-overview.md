---
title: "数据科学基础：课程地图与学习方法"
description: "一份完整的学习地图：课程主线、记号约定、章节顺序与讲义勘误。"
pubDate: 2026-10-11
tags:
  - 数据科学
  - 学习理论
  - FODS
category: course
series: fods
order: 0
cover: /covers/post-math.svg
---

对应讲义：`Fods_26.pdf`（Yuling Jiao，武汉大学人工智能学院）

这份笔记是给**完全零基础**的同学写的。讲义是研究生课的幻灯片：公式密、步骤跳、很多地方写了 “HW” 或直接给出结论。我会：

- 用大白话先讲「在干什么、为什么要这么干」；
- 把每个符号写清楚；
- 把省略的不等式、期望计算、对偶、KKT、集中不等式全部补成可跟的证明；
- 标出幻灯片里容易看错或写得太简的地方。

---

## 1. 这门课到底在干什么？

一句话：**从数据里学一个“好的规则”，并且用数学证明这个规则有多好。**

数据科学里最常见的三件事：

| 任务 | 你看到的 | 你想得到的 |
|------|----------|------------|
| 监督学习 | 成对的 $(X,Y)$，例如图片和标签 | 一个预测函数 $f(x)\approx y$ |
| 表示学习 | 很多没有标签、或标签很少的 $X$ | 一个低维特征 $f(X)$，让后面分类变容易 |
| 生成学习 | 只有一堆样本 $X_1,\ldots,X_n$ | 能再“画出”新样本的机制（GAN、扩散、ODE 流） |

课的主线不是调参，而是**误差分解 + 上界 + 下界**：

$$
\text{你学到的东西的误差}
=
\text{统计误差（样本不够）}
+
\text{逼近误差（模型太简单）}
+
\text{优化误差（算法没算到最优）}.
$$

上界告诉你：用这个方法，误差最多这么大。  
下界（minimax）告诉你：再聪明的方法，在最坏情况下也不可能比某个速度更快。两者对上，叫**最优速率**。

---

## 2. 四节课地图

讲义封面把课分成四讲，后面还附了两块数学复习。页码按 `Fods_26.pdf`。

| 讲 | 页码（约） | 核心问题 | 你会见到的关键词 |
|----|------------|----------|------------------|
| **Lec1 线性模型** | p.3–12 | 最简单、能算到底的回归：最小二乘、Ridge、约束最小二乘、Lasso | 风险、偏差–方差、minimax、$\ell_1$ |
| **Lec2 监督学习** | p.13–63 | 一般函数类上的 ERM：误差从哪来、神经网络能逼近什么、GD/SGD 多快、分类/SVM | 覆盖数、Rademacher、Dudley、Hölder、PL 条件、核、RKHS |
| **Lec3 表示学习** | p.65–77 | 复杂数据先学特征：有监督降维、对比学习、分布匹配 | SSL、SimCLR、ACT、W1 |
| **Lec4 生成与采样** | p.79–137 | 从噪声变成数据：GAN、梯度流、Langevin、扩散、Föllmer 流、一步生成、Transformer/LLM | IPM、score、Schrödinger Bridge、ICL |

复习附录：

| 附录 | 页码 | 作用 |
|------|------|------|
| A 线性代数 / 微积分 / 凸分析 | p.139–168 | SVD、核范数、凸函数、次梯度、KKT |
| B 概率与集中不等式 | p.170–192 | 概率空间、期望、次高斯、Hoeffding、Bernstein、覆盖数 |

**强烈建议阅读顺序（小白）：**

1. 先读本文件（你正在读）。
2. 读 `06_附录B` 的前半：概率、期望、高斯、条件期望。看不懂后面的 $\mathbb{E}$、$\mathrm{Var}$、$\sim N$ 就先停在这里。
3. 读 `05_附录A` 的前半：向量、范数、内积、正交投影、SVD。Lec1 几乎全靠这些。
4. `01_Lec1`：这是整门课的「玩具模型」，所有抽象概念这里都有具体公式。
5. `06_附录B` 的后半（集中不等式）+ `05_附录A` 的凸优化。
6. `02_Lec2`（按 2a→2d 四份读）。
7. `03_Lec3`、`04_Lec4`。

---

## 3. 贯穿全课的三个误差（先建立直觉）

想象你要学「根据房子面积预测房价」。

- **总体风险** $L(f)$：如果把全宇宙所有房子都拿来测，平均错多少。这是上帝才知道的数。
- **经验风险** $\widehat L(f)$：只用你手头 $n$ 套房子的平均错误。这是你能算的。
- **目标** $f^*$：所有可测函数里，总体风险最小的那个（回归时就是条件期望 $\mathbb{E}[Y\mid X]$）。
- **函数类** $\mathcal{F}$：你允许自己用的模型集合（直线、神经网络……）。
- **经验风险最小元** $\widehat f$：在 $\mathcal{F}$ 里把 $\widehat L$ 降到最低的那个。
- **算法输出** $f_A$：电脑实际算出来的，可能没把 $\widehat L$ 降到最低（优化没做完）。

误差拆开（讲义 p.5）：

$$
L(f_A)-L(f^*)
\;\le\;
\underbrace{2\sup_{f\in\mathcal{F}}|L(f)-\widehat L(f)|}_{\text{泛化 / 统计 }E_{\mathrm{gen}}}
+
\underbrace{L(\bar f)-L(f^*)}_{\text{逼近 }E_{\mathrm{app}}}
+
\underbrace{\widehat L(f_A)-\widehat L(\widehat f)}_{\text{优化 }E_{\mathrm{opt}}}.
$$

其中 $\bar f$ 是 $\mathcal{F}$ 里总体风险最小的那个（「模型里最好的」）。

**人话：**

- 模型太死板（只用直线去拟合很弯的曲线）→ 逼近误差大。
- 模型太灵活、样本太少 → 经验风险和总体风险差很远 → 统计误差大。
- 梯度下降步数不够、步长乱设 → 优化误差大。

Lec1 在线性模型里把这三块都算成**显式公式**。Lec2 把同样的故事推广到神经网络。Lec4 把「风险」换成「两个概率分布有多像」。

---

## 4. 记号速查（全课通用）

读任何一页幻灯片前，先认这些符号。

| 符号 | 读法 | 意思 |
|------|------|------|
| $\mathbb{R}^d$ | 阿尔 $d$ | $d$ 维实向量的全体 |
| $\langle x,y\rangle$ 或 $x^\top y$ | 内积 | $\sum_i x_i y_i$ |
| $\|x\|_2$ | 欧氏范数 | $\sqrt{\sum x_i^2}$ |
| $\|x\|_1$ | 一范数 | $\sum |x_i|$ |
| $\|x\|_0$ | 「零范数」（其实不是范数） | 非零坐标个数 |
| $\|x\|_\Sigma^2$ | $\Sigma$-范数平方 | $x^\top\Sigma x$ |
| $\mathbb{E}[X]$ | 期望 | 平均值（按概率加权） |
| $\mathrm{Var}(X)$ | 方差 | $\mathbb{E}[(X-\mathbb{E}X)^2]$ |
| $X\sim P$ | $X$ 服从 $P$ | $X$ 按分布 $P$ 随机产生 |
| i.i.d. | 独立同分布 | 各样本互不影响、同一规律 |
| $\mathbf{1}_{\{A\}}$ | 示性函数 | $A$ 发生为 1，否则 0 |
| $\arg\min_f L(f)$ | 使 $L$ 最小的 $f$ | 可能不唯一，所以常写成 $\in\arg\min$ |
| $\widehat{\theta},\widehat f,\widehat L$ | hat | 用数据算出来的量 |
| $A^\dagger$ | Moore–Penrose 伪逆 | 最小二乘解 $A^\dagger Y$ |
| $f_\sharp\mu$ | pushforward | 把分布 $\mu$ 经映射 $f$ 推过去 |
| $W_2,W_1$ | Wasserstein 距离 | 两个分布「搬沙子」的代价 |
| $\lesssim$ | 小于约等于 | 忽略只依赖常数的倍数 |
| w.h.p. | with high probability | 以至少 $1-\delta$ 的概率 |

幻灯片里常见的「印刷事故」（提取/排版会乱）：

- `Schoof of AI` = School of AI。
- `liner regression` = linear regression。
- `Randemacher` = Rademacher。
- `papulation` = population。
- `Langevian` = Langevin。
- `H¨older` = Hölder。
- 很多 $x'$ 表示 $x^\top$（转置）。

---

## 5. 文件清单（已全部写完）

全部在文件夹 `C:/Projects/example`。

| 文件 | 讲义页 | 内容 |
|------|--------|------|
| [00_课程总览与怎么学](/blog/fods-overview/) | — | 本文件：地图、记号、页码对照、勘误 |
| [01_Lec1_线性模型](/blog/fods-linear-models/) | p.3–12 | 风险/ERM、误差分解、OLS、Ridge、minimax、约束 LS、Lasso |
| [02a_Lec2_统计误差](/blog/fods-statistical-error/) | p.13–27 | Esta、Bernstein、覆盖数、Rademacher、对称化、Dudley |
| [02b_Lec2_逼近误差](/blog/fods-approximation-error/) | p.28–36 | Hölder、单位分解、ReLU 逼近 $x^2$/乘积/Taylor |
| [02c_Lec2_优化误差](/blog/fods-optimization-error/) | p.37–45 | GD、近端 GD、SGD、SVRG |
| [02d_Lec2_下界与监督方法](/blog/fods-minimax-supervised-learning/) | p.46–63 | 非参 minimax、校准损失、plugin、LDA/QDA、SVM、RKHS |
| [03_Lec3_表示学习](/blog/fods-representation-learning/) | p.65–77 | SDR、SSL、SimCLR/NT-Xent、ACT、Distribution Matching |
| [04_Lec4_生成学习与LLM](/blog/fods-generative-learning-llm/) | p.79–137 | GAN、梯度流、Langevin/扩散、Föllmer、一步生成、Transformer/ICL |
| [05_附录A_线性代数微积分凸分析](/blog/fods-linear-algebra-calculus-convexity/) | p.139–168 | 向量→SVD→核范数→凸函数→KKT |
| [06_附录B_概率论与集中不等式](/blog/fods-probability-concentration/) | p.170–192 | 公理→期望→次高斯→Hoeffding/Bernstein/McDiarmid |
| [07_标红与HW汇总](/blog/fods-exercises/) | 全文特殊标记 | 标红 / HW / Check / Hint / 问号：题面 + 补全的证明 |

每份结构尽量统一：人话 → 预备 → 定义 → 定理+完整证明（省略处标「补全」）→ 误区。

---

## 6. 讲义页码对照（对着幻灯片查笔记）

| 幻灯片 | 主题 | 笔记 |
|--------|------|------|
| p.1–2 | 封面与大纲 | 本文件 |
| p.3–6 | 监督设置、误差分解 | `01` §1–2 |
| p.7 | 固定设计 OLS | `01` §3 |
| p.8–9 | Ridge、OLS 高概率 | `01` §4–5 |
| p.10 | 线性模型 minimax | `01` §6 |
| p.11–12 | 约束 LS、Lasso | `01` §7–8 |
| p.14–15 | setup 重述 | `02a` §0 |
| p.16–18 | Bound Esta | `02a` §1–2 |
| p.19 | 覆盖数 | `02a` §3 |
| p.20–27 | Rad / 对称化 / Dudley | `02a` §4–11 |
| p.28–36 | 逼近、Hölder、ReLU | `02b` |
| p.37–40 | GD、近端 GD | `02c` |
| p.41–45 | SGD、SVRG | `02c` |
| p.46–50 | 非参下界 | `02d` §1 |
| p.51–56 | 凸化、plugin、LDA | `02d` |
| p.57–63 | SVM、核、RKHS | `02d` |
| p.65–77 | 表示学习 | `03` |
| p.79–93 | 生成动机、GAN | `04` 第一、二部分 |
| p.94–106 | 梯度流 / EPT | `04` 第三部分 |
| p.107–112 | Langevin、扩散 | `04` 第四部分 |
| p.113–127 | Föllmer、一步生成、UQ | `04` 第五部分 |
| p.128–137 | Transformer / LLM / ICL | `04` 第六部分 |
| p.139–168 | 线代 / 凸 | `05` |
| p.170–192 | 概率 / 集中 | `06` |

---

## 7. 学习时怎么跟证明

遇到一个证明，按这个清单走，不要死记步骤：

1. **目标是谁？** 要证明 $A\le B$，还是 $\mathbb{P}(\cdots)\le e^{-t}$，还是 $\mathbb{E}[\cdots]\le \cdots$。
2. **已知是谁？** 高斯？有界？Lipschitz？凸？
3. **用了哪条工具？** 常见就这几件：
   - 代数：配方、投影、SVD、KKT；
   - 分析：Taylor、Lipschitz、均值不等式；
   - 概率：期望线性、条件期望塔性质、高斯/次高斯尾、Bernstein、并集界；
   - 优化：凸性、强凸、PL、近端算子。
4. **关键一步往往是「把随机的东西变成可以集中的东西」**，例如把 $\|X(\widehat\theta-\theta^*)\|$ 写成 $\sup_{\|u\|\le 1}\tilde\varepsilon^\top u$。

如果某一步突然出现一个不等式，笔记里会写成「为什么可以这样」。

---

## 8. 幻灯片里省略、标 HW 或写了「?」——笔记里已经补上的

这是「综合」：你不必在 192 页里自己猜跳了哪一步。

**Lec1**

- 回归 $f^*=\mathbb{E}[Y\mid X]$ 的配方证明
- Esta 恒等式 $L(f_A)-L(f^*)=(L-2\widehat L+L(f^*))+2(\widehat L-L(f^*))$
- OLS 预测误差 $=\frac{r\sigma^2}{n}$（迹与投影）
- Ridge 偏差–方差特征值公式；$\frac{\tau\lambda^2}{(\tau+\lambda)^2}\le\lambda/2$ 等初等不等式
- OLS 高概率：基本不等式 → 次高斯球面 → $\varepsilon$-网
- 高斯条件分布（HW）与贝叶斯风险 $\frac{\sigma^2}{n}\mathrm{tr}[(\Sigma+\lambda I)^{-1}\Sigma]$
- $\ell_1$ / $\ell_0$ 约束 LS 的并集界；Lasso 慢速率与 RE 快速率

**Lec2**

- Bernstein + 覆盖推出 Esta；指出讲义常数 $16\lambda B+4\lambda^2/c$ 与严谨推导差一个因子
- 体积法覆盖数 $1/\varepsilon^d\le N(B_2,\varepsilon)\le(1+2/\varepsilon)^d$
- Massart finite lemma、对称化、Dudley chaining（修正 p.26 误用的 Hölder）
- 平方损失 $L(f)-L(f^*)=\|f-f^*\|_{L^2}^2$
- 单位分解、Taylor 余项、$x^2$ 锯齿插值、极化乘积、网络四则运算
- 下降引理两条证明；核范数近端（讲义 `?`）= 奇异值软阈值
- Prox 坚定非扩张、Moreau、SVRG 的 $\mathbb{E}\|G\|^2$ 与 $\rho$（并指出 $T\ge 9\kappa\Rightarrow\rho<5/6$ 算术需 $T>27\kappa$，大 $O$ 不变）
- KL $\le\frac43\|f_i-f_j\|^2$、Donsker–Varadhan、packing 下界 $n^{-2\alpha/(2\alpha+d)}$
- 凸损失校准 $\iff\ell'(0)<0$；超额风险 $\mathbb{E}[|2\eta-1||f^*-f|]$
- logistic 两种标签约定（HW）；SVM 对偶与 KKT；Moore–Aronszajn 与表示定理（HW）

**Lec3–4**

- NT-Xent 公式（讲义未写）；ACT 对抗项 = 强迫 $\mathbb{E}[f(x_1)f(x_2)^\top]\approx I$
- IPM 分解 $4E_1+E_2+E_3+2E_4$
- KL 第一变分（$\log\det$ + 散度定理）；密度比二次损失配方
- Stein 引理；去噪损失 $\to$ score matching
- 回归 (10) 是条件期望 $V(t,x)$
- Transformer 注意力写全；ICL 的隐式贝叶斯解读

**附录**

- SVD 构造、Courant–Fischer（HW）、PCA 编解码器（HW）、MP 伪逆唯一性、Eckart–Young
- 条件数扰动（p.151 被截断处补完）、核范数三角不等式
- 强凸全部等价、次梯度、Fenchel、Slater、KKT
- $P(\emptyset)=0$ 等全部 Hint；次高斯 $\Leftrightarrow$ 尾；Hoeffding 引理；McDiarmid（p.190）

---

## 9. 读笔记时请记住的几处勘误（幻灯片排版）

这些不是「老师数学错了」，多半是 beamer 折行。笔记用纠正后的式子，并标明原文。

| 位置 | 幻灯片容易看成 | 应读成 |
|------|----------------|--------|
| p.26 Dudley | 用 $\sum|\tau_i|$ 乘 $\sum\max$ 的 Hölder | $\|(1/n)\sum\tau_i a_i\|\le\|a\|_\infty$ |
| p.49 下界 | 指数里出现 $n^2\xi^2$ | $n\xi^2$（速率结论不变） |
| p.54 Bayes 风险 | $L^*=\mathbb{E}[f^*-\eta]$ | $\mathbb{E}|f^*-\eta|$ |
| p.44–45 SVRG | $T\ge 9\kappa\Rightarrow\rho<5/6$ | 按写出的 $\rho$ 公式需 $T>27\kappa$；复杂度仍是 $(n+\kappa)\log(1/\varepsilon)$ |
| 全文 | `Randemacher` / `Langevian` / `papulation` | Rademacher / Langevin / population |

论文级定理（GAN JMLR 22、ACT NeurIPS 25、Föllmer JMLR 24、Transformer arXiv:2504.12175 等）笔记给**假设、结论、证明骨架**，不逐行抄几十页论文。

---

## 10. 和讲义的关系

- 讲义是**课堂投影片**，不是教科书。它默认你已经上过实分析/概率/凸优化。
- 笔记**不替代原片**：考试或作业仍以老师课堂上的记号、作业为准。
- 原片里的数值实验、图片（MNIST、CIFAR、swissroll）这里只叙述结论，不复制图像。

**从哪一页开始读：** 线性代数/概率完全空白 → `05` 第 0 节 + `06` 第 0 节，然后 `01`。否则直接 `01`，按 `02a→02d→03→04`。卡住某个符号就回附录。

---

## 11. 验收说明（对照原片后的处理原则）

笔记已按 `Fods_26.pdf` 并行验收过一遍。原则：

- **课程记号、作业题面**跟老师，不改成另一套符号。
- **标红的数学**（定理、Hint、`?`、Check）把证明写全；纯记号（如 $\lambda_{\min}(\Sigma)$、$n\ll d$）和文献编号只保留，不编造论文里没有的精细常数。
- **跳步**（Dudley chaining、SVRG 的 $\mathbb{E}\|G\|^2$、KL 第一变分、Stein、Föllmer 的 $V$、时间反转换元等）补成可跟推导。
- **原片排版/印刷**与数学正确式冲突时：题面照印，证明用正确式，并在旁边标明。已知几处：p.4 把 $2\sup|L-\widehat L|$ 标成 $E_{\mathrm{sta}}$；p.12 Lasso 基本不等式漏因子 2；p.26 Dudley 的 Hölder；p.44–45 SVRG 的 $T\ge 9\kappa\Rightarrow\rho<5/6$（$\alpha=1/(6L)$ 时 $\rho=9\kappa/T+1/2$，要 $\rho<5/6$ 需 $T>27\kappa$）；p.49 下界指数里的 $n^2$；p.54 $L^*$ 漏绝对值；p.74 $P_t(C_t^*)$ 右边类名；p.112 字面 $X_{\varphi(t)}$ 与同页显式解矛盾（笔记按显式解用 $\tau=-\log(1-t)$）；p.134 预训练 $\sum\log p$ 漏负号。

第二轮独立重算后仍成立、并小幅修正的：Lasso 的 $6/\gamma$ 与因子 2 对齐；OLS 欧氏误差改用 Rayleigh 而不是错误的中间恒等式；SVM Lagrange 里 $b\sum\alpha_i y_i$ 的符号；平方损失跟当页（p.29 无 $1/2$）；CoD 体积只给剖分计数、packing 才给下界；Föllmer $V$ 按幻灯片把 $\sqrt{1-t^2}$ 放在分母；损失 (10) 补括号；Slater 用 $\mathrm{reint}(\mathrm{dom}(f))\cap C$；Eckart–Young 对 $\mathrm{rank}\le q$。
