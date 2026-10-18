---
title: "数据科学基础：课程地图与学习方法"
description: "一份完整的学习地图：课程主线、记号约定、章节顺序与学习方法。"
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

这份内容从零基础出发。公式较多、步骤容易跳过，很多地方只给结论。阅读时会重点补齐：

- 先讲「在干什么、为什么要这么干」；
- 把每个符号写清楚；
- 把省略的不等式、期望计算、对偶、KKT、集中不等式补成可跟的证明；
- 标出容易看错或写得太简的地方。

## 1. 这门内容在讲什么

一句话：**从数据里学一个“好的规则”，并且用数学证明这个规则有多好。**

数据科学里最常见的三件事：

| 任务 | 你看到的 | 你想得到的 |
|------|----------|------------|
| 监督学习 | 成对的 $(X,Y)$，例如图片和标签 | 一个预测函数 $f(x)\approx y$ |
| 表示学习 | 很多没有标签、或标签很少的 $X$ | 一个低维特征 $f(X)$，让后面分类变容易 |
| 生成学习 | 只有一堆样本 $X_1,\ldots,X_n$ | 能再“画出”新样本的机制（GAN、扩散、ODE 流） |

主线不是调参，而是**误差分解 + 上界 + 下界**：

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

## 2. 内容地图

| 部分 | 核心问题 | 关键词 |
| --- | --- | --- |
| 线性模型 | 最简单、能算到底的回归 | 风险、偏差–方差、最小二乘、Ridge、Lasso |
| 监督学习 | 一般函数类上的 ERM：误差从哪来、模型能逼近什么、算法多快 | 覆盖数、Rademacher、Dudley、Hölder、PL 条件、核、RKHS |
| 表示学习 | 复杂数据先学特征 | 有监督降维、对比学习、分布匹配 |
| 生成与采样 | 从噪声变成数据 | GAN、梯度流、Langevin、扩散、Föllmer 流、一步生成、Transformer 与上下文学习 |
| 数学附录 | 补齐线性代数、微积分、凸分析与概率工具 | SVD、核范数、凸函数、次梯度、KKT、集中不等式 |

**建议阅读顺序（零基础）：**

1. 先读本文件，建立误差分解与记号。
2. 读概率附录的前半：概率、期望、高斯、条件期望。看不懂后面的 $\mathbb{E}$、$\mathrm{Var}$、$\sim N$ 就先停在这里。
3. 读线性代数附录的前半：向量、范数、内积、正交投影、SVD。
4. 读线性模型：这是整条主线的「玩具模型」，所有抽象概念这里都有具体公式。
5. 读概率附录的后半（集中不等式）与凸优化部分。
6. 读监督学习，再读表示学习与生成学习。

## 3. 贯穿全篇的三个误差

想象你要学「根据房子面积预测房价」。

- **总体风险** $L(f)$：如果把所有可能数据都拿来测，平均错多少。这是理论上的目标。
- **经验风险** $\widehat L(f)$：只用你手头 $n$ 个样本的平均错误。这是你能算的。
- **目标** $f^*$：所有可测函数里，总体风险最小的那个（回归时就是条件期望 $\mathbb{E}[Y\mid X]$）。
- **函数类** $\mathcal{F}$：你允许自己用的模型集合（直线、神经网络……）。
- **经验风险最小元** $\widehat f$：在 $\mathcal{F}$ 里把 $\widehat L$ 降到最低的那个。
- **算法输出** $f_A$：电脑实际算出来的，可能没把 $\widehat L$ 降到最低（优化没做完）。

误差拆开：

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

**直观理解：**

- 模型太死板（只用直线去拟合很弯的曲线）→ 逼近误差大。
- 模型太灵活、样本太少 → 经验风险和总体风险差很远 → 统计误差大。
- 梯度下降步数不够、步长乱设 → 优化误差大。

线性模型把这三块都算成**显式公式**。监督学习把同样的故事推广到神经网络。生成学习把「风险」换成「两个概率分布有多像」。

## 4. 记号速查

开始阅读前，先认这些符号。

| 符号 | 读法 | 意思 |
|------|------|------|
| $\mathbb{R}^d$ | 阿尔 $d$ | $d$ 维实向量的全体 |
| $\langle x,y\rangle$ 或 $x^\top y$ | 内积 | $\sum_i x_i y_i$ |
| $\|x\|_2$ | 欧氏范数 | $\sqrt{\sum x_i^2}$ |
| $\|x\|_1$ | 一范数 | $\sum \|x_i\|$ |
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

## 5. 各章索引

- [线性模型](/blog/fods-linear-models/)：风险、ERM、误差分解、OLS、Ridge、minimax、约束最小二乘、Lasso。
- [统计误差](/blog/fods-statistical-error/)：Bernstein、覆盖数、Rademacher、对称化、Dudley。
- [逼近误差](/blog/fods-approximation-error/)：Hölder、单位分解、ReLU 逼近 $x^2$、乘积与 Taylor。
- [优化误差](/blog/fods-optimization-error/)：GD、近端 GD、SGD、SVRG。
- [下界与监督方法](/blog/fods-minimax-supervised-learning/)：非参 minimax、校准损失、plugin、LDA/QDA、SVM、RKHS。
- [表示学习](/blog/fods-representation-learning/)：有监督降维、SSL、SimCLR、ACT、分布匹配。
- [生成学习与 LLM](/blog/fods-generative-learning-llm/)：GAN、梯度流、Langevin、扩散、Föllmer 流、一步生成、Transformer。
- [数学附录 A](/blog/fods-linear-algebra-calculus-convexity/)：向量、SVD、核范数、凸函数、KKT。
- [数学附录 B](/blog/fods-probability-concentration/)：概率空间、期望、次高斯、Hoeffding、Bernstein、McDiarmid。
- [习题与证明](/blog/fods-exercises/)：题面、提示与补全的证明。

## 6. 怎么跟证明

遇到一个证明，按这个清单走，不要死记步骤：

1. **目标是谁？** 要证明 $A\le B$，还是 $\mathbb{P}(\cdots)\le e^{-t}$，还是 $\mathbb{E}[\cdots]\le \cdots$。
2. **已知是谁？** 高斯？有界？Lipschitz？凸？
3. **用了哪条工具？** 常见就这几件：
   - 代数：配方、投影、SVD、KKT；
   - 分析：Taylor、Lipschitz、均值不等式；
   - 概率：期望线性、条件期望塔性质、高斯/次高斯尾、Bernstein、并集界；
   - 优化：凸性、强凸、PL、近端算子。
4. **哪一步最容易跳？** 把跳过的步骤补出来，再回头看整体结构。
