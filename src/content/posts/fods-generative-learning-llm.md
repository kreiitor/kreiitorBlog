---
title: 生成学习与 LLM：从 GAN 到扩散与 Transformer
description: 沿着分布建模与采样的主线，理解 GAN、Langevin、扩散模型和大语言模型。
pubDate: 2026-10-11
tags:
  - 数据科学
  - 学习理论
  - FODS
category: course
series: fods
order: 7
cover: /covers/post-math.svg
---

本章目标：把「从噪声变成数据」这件事，从 GAN 的对偶（IPM / min-max），写到梯度流的原问题（推送映射），再写到 Langevin / 扩散的 SDE，最后写到 **ODE 流的一步生成** 和 **Transformer / LLM 的误差**。全程用同一把尺子：两个概率分布有多像，以及你学到的生成器 / 速度场 / 条件概率有多准。

你会得到：

1. 为什么经典 MCMC（MH / Gibbs / Langevin / HMC）会 metastability、会维数灾难，以及三条 takehome（GAN / SDE / ODE）；
2. IPM 版 GAN 的总体 / 样本 min-max，以及 Huang–Jiao–Li–Liu–Wang–Yang JMLR 22 的速率 $n^{-\beta/d}\vee n^{-1/2}\log n$（含网络规模假设与误差分解）；
3. KL 对推送映射的第一变分：$\log\det(I+t\nabla g)=t\,\mathrm{tr}(\nabla g)+O(t^2)$，散度定理边界项消失，下降方向是 $\nabla\log(p/q)$；
4. 密度比二次损失的完整配方；EPT 算法；连续性方程、Otto 梯度流、LogSob 下 KL 指数衰减；与 Langevin / Fokker–Planck 的改写；
5. Stein 引理、去噪 autoencoder $\Rightarrow$ score matching 的完整计算；时间反转 OU / Song et al. 训练；
6. 高斯插值流 / Föllmer：条件期望速度场、MC 采样误差、回归损失 (10) 为何是条件期望、特征学习一步生成、潜空间误差分解、CIFAR FID、用条件生成做 UQ；
7. Transformer 的精确定义；Hölder $\to$ Transformer 的深度 $O(1)$ 上界与 VC 下界；$\beta$-mixing 滑动窗口 ERM；预训练与 in-context learning 为何像隐式贝叶斯。Huang et al. JMLR 论文里源分布叫 $\nu$、目标叫 $\mu$，内容相反（源 $\mu$、目标 $\nu$）。本文**跟内容**：目标是 $\nu$（或密度 $p$），源 / 参考是 $\mu$（或密度 $q$）。

---

## 第一部分 生成学习动机

## 0. 先用一张图把任务钉死

监督学习：你有成对的 $(X,Y)$，学 $f(x)\approx y$，最优是条件均值 $\mathbb{E}[Y\mid X=x]$（Lec1）。

生成学习：你只有一堆样本 $X_1,\ldots,X_n\sim\nu$，想要一台「生成器」——输入噪声 $Z\sim\mu$（通常是高斯或均匀），输出 $\widehat X=g(Z)$，使得

$$
g_\sharp\mu \;\approx\; \nu.
$$

**推送（pushforward）**：$g_\sharp\mu(A):=\mu(g^{-1}(A))$。人话：先按 $\mu$ 抽 $Z$，再经 $g$ 映射，得到的分布就是 $g_\sharp\mu$。若 $g$ 可逆且 $\mu$ 有密度 $q$，则 $g_\sharp\mu$ 的密度是

$$
(g_\sharp q)(x)
\;=\;
q\bigl(g^{-1}(x)\bigr)\,\bigl|\det\nabla g^{-1}(x)\bigr|.
$$

内容 的图（领域自适应 CycleGAN、扩散超分、Schrödinger Bridge 修复、文生图 / Stable Diffusion）都是这件事的特效版：不是预测一个数，而是**再画出一张和训练数据同分布的新图**。

条件生成更进一步：有成对数据 $(X_i,Y_i)$，学的不是 $\mathbb{E}[Y\mid X=x]$，而是整条条件分布 $\nu(\cdot\mid X=x)$。有了条件分布才能做不确定性量化（UQ）：给出 90% 预测区间，而不是一个点。 的 wine 数据就是这个。

---

## 1. 生成学习在统计里是什么

无条件：从 $X_1,\ldots,X_n\stackrel{\mathrm{iid}}{\sim}\nu$ 学习高维分布 $\nu$ 或其密度 $p$——这是非参数密度估计，维数 $d$ 一大，直方图 / 核密度直接崩。

条件：从 $(X_i,Y_i)$ 学 $\nu(\cdot\mid X=x)$，可做可控生成（给定标签、文本、低分图像……）。Stable Diffusion、Sora 是「潜空间里的条件生成」。

深度生成学习的共同写法：抽噪声 $Z\sim\mu$，学映射 $g$ 使 $g_\sharp\mu\approx\nu$。三条历史路线：

| 路线 | 代表 | 一句话 |
|------|------|--------|
| VAE | Kingma–Welling 2014 | 概率深度非线性因子模型 + 变分 EM + 采样 |
| GAN | Goodfellow et al. 2014 | 深度非线性因子分析 + 可微的「两样本检验」对着打 |
| SDE / 扩散 | Song–Ermon，Ho et al.，Song et al. | 根子是不精确 Langevin、Schrödinger Bridge、Nelson 随机力学 |

Yann LeCun 说 GAN 是「过去十年深度学习最酷的想法」；引用量内容写 83K。Stable Diffusion（Rombach et al. 2022）和 Sora 的关键是：**在 autoencoder 的潜空间里做扩散 / 流**，而不是直接在像素空间。

---

## 2. 经典采样为什么不够：metastability 与维数灾难

假设你已经知道目标（差一个归一化常数）$p(x)=e^{-U(x)}/Z$，只想抽样本。经典工具：

- **逆变换**：一维 CDF 的反函数，一步就成；高维几乎不可用。
- **Metropolis–Hastings**（Metropolis–Rosenbluth–Teller–Teller 1953，Hastings 1970）
- **Gibbs**（Geman–Geman 1984，Gelfand–Smith 1990）
- **Langevin**（Arnold 1974，Roberts–Tweedie 1996；约束版 Chang–Tang–Zhu 23）
- **HMC**（Duane–Kennedy–Pendleton–Roweth 1987，Neal 2011）

综述：Changye–Robert 2020，Dunson–Johndrow 2020。

它们都靠**遍历性**：Markov 链跑足够久，边际 $\approx$ 不变分布。两个硬伤：

### 2.1 Metastability（多峰之间过不去）

一维混合

$$
0.5\,N(-1,\sigma^2)+0.5\,N(1,\sigma^2).
$$

两峰隔着高度约 $1/\sigma^2$ 的能量墙。HMC（以及随机游走 MH）的混合时间有下界

$$
\exp\bigl(1/(2\sigma^2)\bigr).
$$

$\sigma\to 0$ 时指数爆炸。人话：链在一个峰里抖得很欢，翻到另一个峰要等天文数字步。这不是调步长能救的，是能量地形决定的。

### 2.2 维数灾难（LogSob 常数本身可以 $\exp(d)$）

Langevin 在 $\mu\in\mathrm{LogSob}(C)$（对数 Sobolev，常数 $C$）时，混合时间量级（Durmus–Moulines 17，Eberle–Guillin–Zimmer 17，Cattaux–Guillin–Monmarché–Zhang 17，Mou–Flammarion–Wainwright–Bartlett 19，Bortoli–Durmus 19）

$$
O\Bigl(\frac{d}{\varepsilon}\log(d/\varepsilon)\,C^{5/2}\Bigr)
$$

才能在 $W_2$ 或 KL 意义下到精度 $\varepsilon$。看起来多项式，但 **$C$ 可以是 $\exp(d)$**（Menz–Schlichting 14）。多峰、窄颈、弱对数凹，LSI 常数指数差，混合时间跟着指数差。

根因：这些算法要求链**遍历到不变分布**。后面 Schrödinger Bridge / Föllmer ODE 的想法是：**单位时间内一次运输，不靠遍历**（Huang–Jiao–Kang–Liao–Liu TIT 24，Dai–Jiao–Kang–Lu–Yang SICON 23），并做成「像逆变换那样可证明」的采样（Feng–Gao–Huang–Jiao–Liu JCGS 25，Ding–Jiao–Lu–Yang–Yuan arXiv:2311.03660）。

---

## 3. 三条 takehome

**GAN。** 模型本身好：IPM 误差有非参最优速率（Liang 21，Huang–Jiao–Li–Liu–Wang–Yang JMLR 22，Jiao–Wang–Yang ACHA 23，Chakraborty–Bartlett 24）。训练不稳是**算法**（min-max、Lipschitz 约束、mode collapse），不是模型定义错了。

**SDE 生成。** 训练稳（回归 score，不是对着打），但贵：要模拟一条长时间 SDE，NFE（函数求值次数）成百上千（Wang–Jiao–Xu–Wang–Yang ICML 21，Chen–Huang–Zhao–Wang 23，Oko–Akiyama–Suzuki 23，Jiao–Kang–Liu–Lin–Zuo arXiv:2404.13309）。

**ODE 流。** 概率空间上的梯度流给出 ODE，原则上可**一步生成**（Gao–Jiao–Wang–Wang–Yang–Zhang ICML 19，Gao–Huang–Jiao–Liu–Lu–Yang MSML 21，Song–Dhariwal–Chen–Sutskever 23），早期分析不完整。内容后续工作给出端到端（条件 / 无条件）可证明的一步生成：Gao–Huang–Jiao JMLR 24，Chang–Ding–Jiao–Li–Yang arXiv:2402.01460，Gao–Huang–Jiao–Zheng arXiv:2404.00551，以及特征学习 Ding–Duan–Jiao–Li–Yang–Zhang arXiv:2405.05512。

记这三句，后面每一部分都在给它们装上定理。

---

## 第二部分 GAN 误差

## 4. IPM：把「两分布有多像」写成对偶

### 4.1 定义

判别器类 $\mathcal{F}$ 是一族从 $\mathbb{R}^d$ 到 $\mathbb{R}$ 的函数（后面取 Hölder 球或神经网络）。**积分概率度量**（IPM，Müller 1997）

$$
d_{\mathcal{F}}(\nu,g_\sharp\mu)
\;:=\;
\sup_{f\in\mathcal{F}}
\Bigl(
\mathbb{E}_{X\sim\nu}[f(X)]
-
\mathbb{E}_{Z\sim\mu}[f(g(Z))]
\Bigr).
$$

人话：最好的那个「证人」$f$ 能把真数据和假数据的平均分差到多大。$\mathcal{F}$ 越大，尺子越严。

特例：

- $\mathcal{F}=\mathrm{Lip}(1)$（Lipschitz 常数 $\le 1$）$\Rightarrow$ $d_{\mathcal{F}}=W_1$（Kantorovich–Rubinstein），即 Wasserstein GAN（Arjovsky et al. 2017）。
- $\mathcal{F}$ 是 Sobolev 球 $\Rightarrow$ Sobolev GAN（Mroueh et al. 2018）。
- 内容主定理取 $\mathcal{F}=\mathcal{H}=\mathcal{H}^\beta(\mathbb{R}^d)$（Hölder-$\beta$ 球）。在 $[0,1]^d$、$\beta=1$ 时，内容写

$$
W_1(\nu,\widehat g_\sharp\mu)
\;\le\;
\sqrt{d}\,
d_{\mathcal{H}^1}(\nu,\widehat g_\sharp\mu).
$$

（$\mathcal{H}^1([0,1]^d)=\mathrm{Lip}([0,1]^d,1,1)$ 是**有界** 1-Lipschitz；真正的 $W_1$ 用的是 $\mathrm{Lip}([0,1]^d,1)$ 或 $\mathrm{Lip}([0,1]^d,1,\sqrt{d})$。在 $[0,1]^d$ 上 $|f(x)-f(y)|\le\sqrt{d}\,\|x-y\|_2$ 对 $\beta>1$ 的 Hölder 也成立，因而 $W_1\le\sqrt{d}\,d_{\mathcal{H}^1}$。）

### 4.2 总体 min-max 与样本 min-max

总体（上帝风险）：

$$
\min_{g\in\mathcal{G}}
d_{\mathcal{F}}(\nu,g_\sharp\mu)
\;=\;
\min_{g\in\mathcal{G}}
\max_{f\in\mathcal{F}}
\Bigl(
\mathbb{E}_\nu f(X)-\mathbb{E}_\mu f(g(Z))
\Bigr).
$$

这是对偶形式：内层在算 IPM，外层在把生成器推到目标旁边。

样本：真样本 $X_1,\ldots,X_n\sim\nu$，噪声 $Z_1,\ldots,Z_m\sim\mu$，网络类 $\mathcal{G}_{\mathrm{NN}}$、$\mathcal{F}_{\mathrm{NN}}$，

$$
(\widehat g,\widehat f)
\;\in\;
\arg\min_{g_\theta\in\mathcal{G}_{\mathrm{NN}}}
\max_{f_\omega\in\mathcal{F}_{\mathrm{NN}}}
\Biggl(
\frac1n\sum_{j=1}^n f_\omega(X_j)
-
\frac1m\sum_{i=1}^m f_\omega\bigl(g_\theta(Z_i)\bigr)
\Biggr).
$$

我们要的是 **$\mathbb{E}\bigl[d_{\mathcal{F}}(\nu,\widehat g_\sharp\mu)\bigr]$**（期望对训练样本），不是训练 loss 本身——训练 loss 用的是 $\mathcal{F}_{\mathrm{NN}}$ 和经验平均，目标尺子是 $\mathcal{F}$ 和总体。

---

## 5. 定理 Huang–Jiao–Li–Liu–Wang–Yang JMLR 22

记 $\mathrm{NN}(W,L)$ 为宽度 $\le W$、深度 $\le L$ 的 ReLU 网络；$\mathrm{Lip}(\mathbb{R}^d,K,1)$ 为 Lipschitz $\le K$ 且 $\|f\|_\infty\le 1$ 的函数。

**假设。**

1. 参考 $\mu$ 在 $\mathbb{R}^k$、$k<d$，关于 Lebesgue 绝对连续（高斯、均匀都满足）。
2. 目标 $\nu$ 支撑在 $[0,1]^d$。

**网络与样本量。**

$$
\begin{aligned}
\mathcal{G}_{\mathrm{NN}}
&=
\bigl\{
g\in\mathrm{NN}(W_1,L_1):\; g(\mathbb{R}^k)\subseteq[0,1]^d
\bigr\},
\qquad
W_1^2 L_1 \;\asymp\; n,\\[4pt]
\mathcal{F}_{\mathrm{NN}}
&=
\mathrm{NN}(W_2,L_2)\cap\mathrm{Lip}(\mathbb{R}^d,K,1),
\qquad
W_2 L_2 \;\lesssim\; n^{1/2}\log^2 n,\\[2pt]
K
&\;\lesssim\;
(W_2 L_2)^{2+\max\{(4\beta-4)/d,\,0\}}
L_2^{2L_2},\\[4pt]
m
&\;\gtrsim\;
n^{2+2\beta/d}\log^6 n.
\end{aligned}
$$

（$K$ 这一条来自：逼近 Hölder-$\beta$ 时，构造出的网络必须**同时**控制 Lipschitz，否则 IPM 对「尖」的判别器会爆；指数里的 $L_2^{2L_2}$ 是深度带来的 Lip 包络，见该文 Lemma 11。）

**结论。** 取 $\mathcal{F}=\mathcal{H}^\beta$，则

$$
\mathbb{E}\bigl[d_{\mathcal{F}}(\nu,\widehat g_\sharp\mu)\bigr]
\;\lesssim\;
n^{-\beta/d}\vee n^{-1/2}\log n.
$$

**备注（内容这里）。**

- $O(n^{-\beta/d})$ 对**没有密度**的 $\nu$、在 $d_{\mathcal{F}}$ 下是 minimax 最优的（Liang 21，Singh et al. 18）。多出来的 $n^{-1/2}\log n$ 是「经验过程的参数部分」，$\beta/d>1/2$ 时被它盖住。
- 若 $\nu=\widetilde\nu\otimes\xi$，$\dim_M(\mathrm{supp}(\widetilde\nu))=d^*<d$（Minkowski 维），$\xi$ 零均值有界方差 $\sigma^2$，速率改进为 $O(n^{-\beta/d^*}+\sigma^2)$（内容；论文里紧支撑低维集是 $O((n^{-\beta/d^*}\vee n^{-1/2})\log n)$）。**环境维数 $d$ 不出现，内在维数 $d^*$ 出现**——图像「看起来 $d=3072$，其实趴在低维流形上」。
- 若 $\nu$ 有密度 $p_\nu\in\mathcal{H}^\alpha([0,1]^d)$，用正则化的 $\widehat\nu$，最优速率 $O\bigl(n^{-(\beta+\alpha)/d}\vee n^{-1/2}\log n\bigr)$。有密度 = 多 $\alpha$ 阶光滑，分子多一个 $\alpha$。
- 可延拓到无界支撑但次指数尾。

**人话：** GAN 作为统计方法，和「用 Hölder 球做两样本 IPM 检验、再对生成器求 min」是同一件事；网络够大、噪声样本 $m$ 够多时，统计误差就是非参最优的 $n^{-\beta/d}$。不稳的是 min-max 优化，不是这个速率。

---

## 6. 证明骨架：$d_{\mathcal{F}}(\nu,\widehat g_\sharp\mu)\le 4E_1+E_2+E_3+2E_4$

### 6.1 四项是什么

$$
d_{\mathcal{F}}(\nu,\widehat g_\sharp\mu)
\;\le\;
4E_1+E_2+E_3+2E_4,
$$

| 符号 | 内容定义 | 人话 |
|------|----------|------|
| $E_1=E(\mathcal{F},\mathcal{F}_{\mathrm{NN}})$ | 判别器类 $\mathcal{F}_{\mathrm{NN}}$ 对 $\mathcal{F}$ 的函数逼近误差（带 Lipschitz 控制） | 网络证人能不能扮演 Hölder 证人 |
| $E_2=\inf_{g\in\mathcal{G}_{\mathrm{NN}}}\|g_\sharp\mu-\widehat\nu\|_{\mathcal{F}_{\mathrm{NN}}}$ | 生成器类把参考推到经验目标旁边的分布逼近误差 | 生成器够不够灵活 |
| $E_3=\|\widehat\nu-\nu\|_{\mathcal{F}}$ | $\mathcal{F}$ 上的经验过程 | $n$ 个真样本够不够 |
| $E_4=\|\widehat\mu-\mu\|_{\mathcal{F}_{\mathrm{NN}}\circ\mathcal{G}_{\mathrm{NN}}}$ | 复合类 $\mathcal{F}_{\mathrm{NN}}\circ\mathcal{G}_{\mathrm{NN}}$ 上噪声的经验过程 | $m$ 个假样本够不够 |

逼近 $E_1$：Daubechies–DeVore–Foucart–Hanin–Petrova 2019，Shen–Yang–Zhang 2021，Lu–Shen–Yang–Zhang 2021，以及 Huang et al. 自己带 Lip 控制的构造。生成器 $E_2$：Yunfei Yang 的分布逼近（源与目标维数可以不同）。经验过程 $E_3,E_4$：Dudley 1967，van der Vaart–Wellner 1996，Schreuder 2020，Bartlett–Harvey–Liaw–Mehrabian 2019（网络伪维数）。

### 6.2 完整分解（补全）

假设 $\mathcal{F}$、$\mathcal{F}_{\mathrm{NN}}$ 对 $f\mapsto -f$ 封闭（IPM 才对称），生成器值域与 $\nu$ 都在 $\Omega=[0,1]^d$ 上。记

$$
E_1
\;:=\;
\sup_{f\in\mathcal{F}}
\inf_{\varphi\in\mathcal{F}_{\mathrm{NN}}}
\|f-\varphi\|_\infty
\;\vee\;
\sup_{\varphi\in\mathcal{F}_{\mathrm{NN}}}
\inf_{f\in\mathcal{F}}
\|\varphi-f\|_\infty
$$

（两类函数在 $\Omega$ 上的 Hausdorff 距离；构造 $\mathcal{F}_{\mathrm{NN}}$ 时一边逼近 Hölder、一边把网络投影到有界 Lip 球，两项同阶）。经验测度 $P_n=n^{-1}\sum_j\delta_{X_j}$，$Q_m=m^{-1}\sum_i\delta_{Z_i}$。$\|\alpha-\beta\|_{\mathcal{A}}:=d_{\mathcal{A}}(\alpha,\beta)$。$\widehat g$ 假设精确 min-max（优化误差另记，主定理里当成 0；实践中它才是 GAN 不稳的来源）。

**引理 A（IPM 对判别器类的稳定性）。** 对任意概率 $\alpha,\beta$，

$$
\bigl|d_{\mathcal{F}}(\alpha,\beta)-d_{\mathcal{F}_{\mathrm{NN}}}(\alpha,\beta)\bigr|
\;\le\;
2E_1.
$$

**证明。** 任取 $f\in\mathcal{F}$，存在 $\varphi\in\mathcal{F}_{\mathrm{NN}}$ 使 $\|f-\varphi\|_\infty\le E_1$。则

$$
\alpha f-\beta f
=
(\alpha\varphi-\beta\varphi)
+\alpha(f-\varphi)-\beta(f-\varphi)
\;\le\;
d_{\mathcal{F}_{\mathrm{NN}}}(\alpha,\beta)+2E_1.
$$

对 $f$ 取 $\sup$ 得 $d_{\mathcal{F}}\le d_{\mathcal{F}_{\mathrm{NN}}}+2E_1$。对称地换 $\mathcal{F}\leftrightarrow\mathcal{F}_{\mathrm{NN}}$。$\square$

于是

$$
d_{\mathcal{F}}(\nu,\widehat g_\sharp\mu)
\;\le\;
2E_1
+
d_{\mathcal{F}_{\mathrm{NN}}}(\nu,\widehat g_\sharp\mu).
\tag{A}
$$

**三角不等式：**

$$
d_{\mathcal{F}_{\mathrm{NN}}}(\nu,\widehat g_\sharp\mu)
\;\le\;
d_{\mathcal{F}_{\mathrm{NN}}}(\nu,P_n)
+
d_{\mathcal{F}_{\mathrm{NN}}}(P_n,\widehat g_\sharp Q_m)
+
d_{\mathcal{F}_{\mathrm{NN}}}(\widehat g_\sharp Q_m,\widehat g_\sharp\mu).
\tag{B}
$$

**第一段（真样本经验过程，换成 $\mathcal{F}$ 上的 $E_3$）。** 再用引理 A：

$$
d_{\mathcal{F}_{\mathrm{NN}}}(\nu,P_n)
\;\le\;
2E_1+d_{\mathcal{F}}(\nu,P_n)
\;=\;
2E_1+E_3.
$$

**第三段（噪声经验过程）。**

$$
d_{\mathcal{F}_{\mathrm{NN}}}(\widehat g_\sharp Q_m,\widehat g_\sharp\mu)
=
d_{\mathcal{F}_{\mathrm{NN}}\circ\{\widehat g\}}(Q_m,\mu)
\;\le\;
d_{\mathcal{F}_{\mathrm{NN}}\circ\mathcal{G}_{\mathrm{NN}}}(Q_m,\mu)
\;=\;
E_4.
$$

**第二段（$\widehat g$ 的最优性）。** 由 min-max 定义，对任意 $g\in\mathcal{G}_{\mathrm{NN}}$，

$$
d_{\mathcal{F}_{\mathrm{NN}}}(P_n,\widehat g_\sharp Q_m)
\;\le\;
d_{\mathcal{F}_{\mathrm{NN}}}(P_n,g_\sharp Q_m)
\;\le\;
d_{\mathcal{F}_{\mathrm{NN}}}(P_n,g_\sharp\mu)
+
d_{\mathcal{F}_{\mathrm{NN}}}(g_\sharp\mu,g_\sharp Q_m).
$$

第二项 $\le E_4$。对 $g$ 取 $\inf$：

$$
d_{\mathcal{F}_{\mathrm{NN}}}(P_n,\widehat g_\sharp Q_m)
\;\le\;
\inf_{g\in\mathcal{G}_{\mathrm{NN}}}
d_{\mathcal{F}_{\mathrm{NN}}}(P_n,g_\sharp\mu)
+E_4
\;=\;
E_2+E_4.
$$

把三段代回 (B)：

$$
d_{\mathcal{F}_{\mathrm{NN}}}(\nu,\widehat g_\sharp\mu)
\;\le\;
(2E_1+E_3)+ (E_2+E_4)+E_4
\;=\;
2E_1+E_2+E_3+2E_4.
$$

再代回 (A)：

$$
d_{\mathcal{F}}(\nu,\widehat g_\sharp\mu)
\;\le\;
4E_1+E_2+E_3+2E_4.
$$

这就是内容的分解。$\square$

### 6.3 系数 $4,1,1,2$ 从哪来（对照分解）

把 6.2 的四段贴在一起，只数 $E_1,E_2,E_3,E_4$ 出现几次：

| 来源 | $E_1$ | $E_2$ | $E_3$ | $E_4$ |
|------|---------|---------|---------|---------|
| (A)：尺子 $\mathcal{F}\to\mathcal{F}_{\mathrm{NN}}$（引理 A） | $2$ | | | |
| (B) 第一段：$d_{\mathcal{F}_{\mathrm{NN}}}(\nu,P_n)$ 再换回 $\mathcal{F}$ | $2$ | | $1$ | |
| (B) 第二段：$\widehat g$ 的 min-max 最优性 | | $1$ | | $1$ |
| (B) 第三段：噪声经验过程 | | | | $1$ |
| **合计** | **$4$** | **$1$** | **$1$** | **$2$** |

人话：

- **$4E_1$：** IPM 换判别器类，一次「真尺子 $\mathcal{F}$ → 网络尺子 $\mathcal{F}_{\mathrm{NN}}$」，一次「网络尺子上的真–经验差再换回 $\mathcal{F}$」。每次换类，$|\alpha(f-\varphi)-\beta(f-\varphi)|\le 2\|f-\varphi\|_\infty$，所以每次是 $2E_1$，两次共 $4E_1$。
- **$E_2$：** 只出现一次——最优性把 $\widehat g$ 换成「最好的那个网络生成器」，而 $E_2$ 正是这个 inf。
- **$E_3$：** 只出现一次——$n$ 个真样本的经验过程（已经写在 $\mathcal{F}$ 上）。
- **$2E_4$：** 噪声样本出现两次：三角不等式的「假经验 vs 假总体」，以及最优性里「任意 $g$ 的 $g_\sharp Q_m$ vs $g_\sharp\mu$」。同一类 $\mathcal{F}_{\mathrm{NN}}\circ\mathcal{G}_{\mathrm{NN}}$，故系数 $2$。

没有优化误差时这就是内容的 $4E_1+E_2+E_3+2E_4$。实践里再加 $\varepsilon_{\mathrm{opt}}$，它往往比统计项大——takehome「模型好、算法不稳」。

### 6.4 $E_1$：带 Lipschitz 控制的判别器逼近

目标：对每个 $h\in\mathcal{H}^\beta([0,1]^d)$，造一个 ReLU 网 $\varphi$ 使

$$
\|\varphi-h\|_\infty
\;\lesssim\;
(W_2 L_2)^{-2\beta/d},
\qquad
\varphi\in\mathrm{NN}(W_2,L_2)\cap\mathrm{Lip}(\mathbb{R}^d,K,1).
$$

**为什么必须控制 $\mathrm{Lip}\,\varphi$。** 三件独立的事绑在一起：

1. **$E_2=0$ 要用 $d_{\mathcal{F}_{\mathrm{NN}}}\le K\,W_1$。** 生成器只保证能把 $\mu$ 推到 $n$ 原子测度旁边（下一小节，尺子是 $W_1$）。若 $\mathcal{F}_{\mathrm{NN}}\subset\mathrm{Lip}(K)$，则 $d_{\mathcal{F}_{\mathrm{NN}}}\le K\,W_1$，$W_1$ 误差 $0$ 就给出 $E_2=0$。没有 $K<\infty$，网络证人可以任意陡，$W_1$ 小完全不能控制 IPM。
2. **经验过程的复杂度。** $\mathcal{F}_{\mathrm{NN}}\circ\mathcal{G}_{\mathrm{NN}}$ 的伪维数可以估，但若权重／Lip 不受控，覆盖数爆炸，$E_4$ 的 $m$ 会不够。
3. **一致逼近 $\neq$ IPM 逼近。** 两个函数 $\|f-\varphi\|_\infty$ 小，它们作为证人已经够（这是引理 A 的 $2E_1$）；但若构造出的 $\varphi$ 不在 $\mathcal{F}_{\mathrm{NN}}$ 的 Lip 约束里，它根本不是合法证人。

**构造思想（内容层面，Huang et al. JMLR 22 Lemma 11）。** 写 $\beta=s+r$，$s\in\mathbb{N}_0$，$r\in(0,1]$。

- 把 $[0,1]^d$ 切成边长 $N^{-1}$ 的小立方体，$N\asymp(WL)^{2/d}$。
- 每个立方体上用 $h$ 的 $s$ 阶 Taylor 多项式 $P_s$ 代替 $h$；Hölder-$\beta$ 给出 $\|h-P_s\|_\infty\lesssim N^{-\beta}$。
- ReLU 网实现：局部多项式、划分的单位（cutoff）、以及把它们加起来。这是 Daubechies–DeVore–Foucart–Hanin–Petrova 2019 / Shen–Yang–Zhang 2021 / Lu–Shen–Yang–Zhang 2021 的「分片多项式 $\to$ ReLU」路线。
- **额外跟踪 Lipschitz：** 每个仿射层的算子范数、每个 cutoff 的斜率、深度 $L$ 次复合。复合 Lip 的包络是内容写的

$$
K
\;\lesssim\;
(W_2 L_2)^{2+\max\{(4\beta-4)/d,\,0\}}
L_2^{2L_2}.
$$

（$\beta\le 1$ 时指数里的 $(4\beta-4)/d$ 不出现，只剩 $W^2 L^2$ 量级的多项式和深度包络。）取 $W_2 L_2\lesssim n^{1/2}\log^2 n$，则 $E_1\lesssim n^{-\beta/d}$，且这样的 $K$ 仍允许后面 $E_4$ 用伪维数控制。

没有「顺便把 Lip 卡住」这一步，判别器网络可以逼近 Hölder，但不能当 IPM 的合法证人，分解在 $E_2$ 处断掉。

### 6.5 $E_2$：生成器的分布逼近（构造思想）

$P_n$ 最多 $n$ 个原子。$E_2=\inf_{g\in\mathcal{G}_{\mathrm{NN}}}d_{\mathcal{F}_{\mathrm{NN}}}(g_\sharp\mu,P_n)$ 问的是：ReLU 生成器能不能把**绝对连续**的源 $\mu$（维数 $k$ 可以 $<d$）推到这堆原子上。

**几何事实。** 一维绝对连续的 $\mu$ 可以先仿射投到 $\mathbb{R}$（内容 / 论文 Remark：$k$ 维绝对连续先线性投到 1 维，仍绝对连续）。目标是任意

$$
\gamma
\;=\;
\sum_{i=1}^n p_i\delta_{x_i}
\in\mathcal{P}(n),
\qquad
x_i\in[0,1]^d.
$$

**构造（Yunfei Yang 的分布逼近，内容层）。**

1. 把源轴 $\mathbb{R}$ 切成 $n$ 段 $I_1,\ldots,I_n$，使 $\mu(I_i)=p_i$（绝对连续 $\Rightarrow$ 分位数存在）。
2. 在 $I_i$ 上把 $g$ 做成常值 $x_i$（或极窄的仿射过渡，ReLU 的 $\min\{\max\{x,-1\},1\}=\sigma(x+1)-\sigma(x-1)-1$ 再平移缩放到 $[0,1]$）。
3. 分段常数 / 分段仿射映射是浅 ReLU 网：$n$ 个断点 $\Rightarrow$ 宽度 $\asymp n$、深度 $O(1)$，或按内容的配额 $W_1^2 L_1\asymp n$（参数个数够 $n$ 段）。输出再 clip 进 $[0,1]^d$。

于是存在 $g\in\mathcal{G}_{\mathrm{NN}}$ 使 $g_\sharp\mu=P_n$（或 $W_1$ 误差 $0$）。又 $\mathcal{F}_{\mathrm{NN}}\subset\mathrm{Lip}(K)$，

$$
E_2
\;=\;
\inf_g d_{\mathcal{F}_{\mathrm{NN}}}(g_\sharp\mu,P_n)
\;\le\;
K\inf_g W_1(g_\sharp\mu,P_n)
\;=\;
0.
$$

生成器**不是瓶颈**：统计速率完全由判别器逼近 $E_1$ 和经验过程 $E_3,E_4$ 决定。源维 $k<d$ 不但没坏处，还符合「噪声维低于图像维」的实践。

### 6.6 $E_3,E_4$ 怎么变成 $n^{-\beta/d}\vee n^{-1/2}\log n$

- **$E_3$。** Hölder 球的覆盖熵 $\log\mathcal{N}(\varepsilon,\mathcal{H}^\beta,\|\cdot\|_\infty)\asymp\varepsilon^{-d/\beta}$。Dudley 积分给出

$$
\mathbb{E}[d_{\mathcal{F}}(\nu,P_n)]
\;\lesssim\;
n^{-\beta/d}\vee n^{-1/2}\log^{c(\beta,d)}n,
$$

$c(\beta,d)=1$ 当 $2\beta=d$，否则可取 $0$。这就是无密度时 $d_{\mathcal{F}}$ 的 minimax 最优速率（Liang 21，Singh et al. 18）。

- **$E_4$。** 复合类 $\mathcal{F}_{\mathrm{NN}}\circ\mathcal{G}_{\mathrm{NN}}$ 的伪维数由网络规模控制（Bartlett–Harvey–Liaw–Mehrabian 2019）。Rademacher / Dudley 给出经验过程；要它被主项盖住，内容取 $m\gtrsim n^{2+2\beta/d}\log^6 n$（噪声样本必须比真样本多一个多项式，因为证人是「判别器$\circ$生成器」，类更大）。

四项对齐：$E_2=0$，$E_1,E_3,E_4$ 都 $\lesssim n^{-\beta/d}\vee n^{-1/2}\log n$，即主定理。

延拓：范数控制的过参数网络（Jiao–Wang–Yang ACHA 23）；条件 GAN（Zhou–Jiao–Liu–Huang JASA 23）；Bi-GAN（Liu–Yang–Huang–Jiao–Wang NeurIPS 21）。

---

## 第三部分 梯度流 / EPT

GAN 在**对偶**里打：证人 $f$ 越大越好，生成器 $g$ 越小越好。这一部分改在**原空间**动粒子：给当前密度 $q$，找一个运输映射 $T$，让 $T_\sharp q$ 比 $q$ 更靠近目标 $p$。

## 7. 原问题：沿向量场微扰恒等映射

$x\sim q$，$T$ 可逆时 $T_\sharp q(x)=q(T^{-1}x)\,|\det\nabla T^{-1}(x)|$。取

$$
T(x)=x+tv(x),
\qquad
v\in [L^2(q)]^d.
$$

$t$ 小则 $I+t\nabla v$ 可逆（Neumann：$\|t\nabla v\|_{\mathrm{op}}<1$），密度连续变化，Jacobian 好算。定义

$$
L(v)
\;=\;
D_{\mathrm{KL}}\bigl((I+v)_\sharp q \,\|\, p\bigr)
:[L^2(q)]^d\to\mathbb{R},
$$

想要 $L(v)<L(0)$。第一变分：若 $\lim_{\|x\|_2\to\infty}\|g(x)q(x)\|=0$，则

$$
\bigl\langle -\partial L_q(0),\, g\bigr\rangle_{L^2(q)}
\;=\;
\bigl\langle \nabla\log\tfrac{p}{q},\, g\bigr\rangle_{L^2(q)}.
$$

最速下降方向是 $v=\nabla\log(p/q)$。下面把这个等式算到底。

---

## 8. 第一变分：完整计算

### 8.1 第一变分的定义

$$
\bigl\langle -\partial L(0),\, g\bigr\rangle_{L^2(q)}
\;:=\;
-\nabla_t L(tg)\big|_{t=0},
\qquad
\forall g\in[L^2(q)]^d.
$$

### 8.2 拉回恒等式

记 $T=I+tg$。拉回密度

$$
T^\sharp p(x)
\;=\;
p\bigl(T(x)\bigr)\,\bigl|\det\nabla T(x)\bigr|.
$$

**引理（KL 的推送–拉回）。** $D_{\mathrm{KL}}(T_\sharp q\,\|\,p)=D_{\mathrm{KL}}(q\,\|\,T^\sharp p)$。

**证明。** $T_\sharp q$ 在 $y=T(x)$ 处的密度是 $q(x)/|\det\nabla T(x)|$。换元 $\mathrm{d}y=|\det\nabla T|\,\mathrm{d}x$：

$$
\begin{aligned}
D_{\mathrm{KL}}(T_\sharp q\,\|\,p)
&=
\int q(x)
\log\frac{q(x)}{|\det\nabla T(x)|\,p(T(x))}\,\mathrm{d}x
=
\int q\log\frac{q}{T^\sharp p}
=
D_{\mathrm{KL}}(q\,\|\,T^\sharp p).
\end{aligned}
$$

$\square$

因此（$E_q\log q$ 与 $t$ 无关）

$$
\nabla_t D_{\mathrm{KL}}((I+tg)_\sharp q\,\|\,p)
\;=\;
-\mathbb{E}_{x\sim q}
\nabla_t
\Bigl[
\log p\bigl(x+tg(x)\bigr)
+
\log\bigl|\det\bigl(I+t\nabla g(x)\bigr)\bigr|
\Bigr].
$$

### 8.3 重点 Observing：两个 Taylor

内容重点 **Observing for small $t$**：

$$
\begin{aligned}
\log p\bigl(x+tg(x)\bigr)
&=
\log p(x)
+
t\,g(x)^\top\nabla_x\log p(x)
+
O(t^2),\\[4pt]
\log\det\bigl(I+t\nabla_x g(x)\bigr)
&=
t\,\mathrm{tr}\bigl(\nabla_x g(x)\bigr)
+
O(t^2).
\end{aligned}
$$

**第一条。** 沿曲线 $\gamma(t)=x+tg(x)$ 做链式法则：

$$
\frac{\mathrm{d}}{\mathrm{d}t}\log p(\gamma(t))
=
\bigl\langle\nabla\log p(\gamma(t)),\,g(x)\bigr\rangle.
$$

$t=0$ 时 $\gamma(0)=x$，再 Taylor：$\log p(x+tg)=\log p(x)+t\langle g,\nabla\log p\rangle+O(t^2)$。这里 $\nabla\log p=\nabla p/p$，所以后面会出现 $\langle g,\nabla\log p\rangle$。

**第二条（trace 必须写清）。** 记 $A=\nabla_x g(x)\in\mathbb{R}^{d\times d}$。三条等价理由，任选一条：

*(特征值。)* $I+tA$ 的特征值是 $1+t\lambda_j(A)$。$|t|$ 小到 $1+t\lambda_j>0$（从而 $|\det|=\det$），

$$
\log\det(I+tA)
=
\sum_{j=1}^d\log(1+t\lambda_j)
=
\sum_{j=1}^d\bigl(t\lambda_j+O(t^2\lambda_j^2)\bigr)
=
t\sum_j\lambda_j+O(t^2)
=
t\,\mathrm{tr}(A)+O(t^2).
$$

*(矩阵对数。)* $\log\det(I+tA)=\mathrm{tr}\log(I+tA)$，Neumann：$\log(I+tA)=tA-\frac12 t^2 A^2+\cdots$，取迹只用到 $\mathrm{tr}(A)$。

*(Jacobi 公式。)* $\frac{\mathrm{d}}{\mathrm{d}t}\det(M(t))=\det(M(t))\,\mathrm{tr}\bigl(M(t)^{-1}M'(t)\bigr)$。取 $M(t)=I+tA$，$t=0$ 时 $\frac{\mathrm{d}}{\mathrm{d}t}\det= \mathrm{tr}(A)$，故 $\frac{\mathrm{d}}{\mathrm{d}t}\log\det\big|_{t=0}=\mathrm{tr}(A)$。

于是

$$
\log\bigl|\det(I+t\nabla g(x))\bigr|
=
t\,\mathrm{tr}(\nabla g(x))+O(t^2).
$$

把两条 Observing 代回 8.2 的 $\nabla_t D_{\mathrm{KL}}$（$E_q\log q$ 与 $t$ 无关）：

$$
-\nabla_t L(tg)\big|_{t=0}
\;=\;
\mathbb{E}_{x\sim q}
\bigl[
\langle g(x),\nabla\log p(x)\rangle
+
\mathrm{tr}\bigl(\nabla g(x)\bigr)
\bigr].
$$

第一项已经是 $\langle\nabla\log p,\,g\rangle_{L^2(q)}$。第二项的 trace 还要变成 $-\langle\nabla\log q,\,g\rangle$，否则对不上 $\nabla\log(p/q)$。这就是下一小节的散度定理。

### 8.4 散度定理：边界项消失，trace 变成 $-\langle\nabla\log q,g\rangle$

逐点 $\mathrm{tr}(\nabla g)=\nabla\cdot g$（Jacobian 的迹 = 散度）。乘上密度用乘积法则：

$$
\nabla\cdot(qg)
\;=\;
\langle\nabla q,\,g\rangle
+
q\,\nabla\cdot g
\;=\;
q\langle\nabla\log q,\,g\rangle
+
q\,\mathrm{tr}(\nabla g).
$$

在大球 $B_R$ 上散度定理（$\,n$ 是外法向）：

$$
\int_{B_R} q\,\mathrm{tr}(\nabla g)\,\mathrm{d}x
\;=\;
\int_{\partial B_R} q\,g\cdot n\,\mathrm{d}S
-
\int_{B_R}\langle\nabla q,\,g\rangle\,\mathrm{d}x.
$$

内容假设 $\lim_{\|x\|_2\to\infty}\|g(x)q(x)\|=0$（$q$ 次高斯尾、$g$ 多项式增长就够）。球面面积 $\asymp R^{d-1}$，被积函数是 $qg\cdot n$，极限把边界积分送到 $0$。剩下

$$
\mathbb{E}_q\bigl[\mathrm{tr}(\nabla g)\bigr]
\;=\;
-\mathbb{E}_q\langle\nabla\log q,\,g\rangle.
$$

这就是重点里「as long as $\lim\|g q\|=0$」那一句：没有它，散度定理会留下一个边界，第一变分对不上 $\nabla\log(p/q)$。

### 8.5 拼起来：$\langle\nabla\log(p/q),g\rangle$

把 8.3 的两项和 8.4 的 trace 换元写在一起：

$$
\begin{aligned}
-\nabla_t L(tg)\big|_{t=0}
&=
\mathbb{E}_q\bigl[\langle g,\nabla\log p\rangle+\mathrm{tr}(\nabla g)\bigr]\\
&=
\mathbb{E}_q\langle g,\nabla\log p\rangle
-
\mathbb{E}_q\langle g,\nabla\log q\rangle\\
&=
\mathbb{E}_q
\bigl\langle
\nabla\log p-\nabla\log q,\,
g
\bigr\rangle
=
\bigl\langle
\nabla\log\tfrac{p}{q},\,
g
\bigr\rangle_{L^2(q)}.
\end{aligned}
$$

按定义这正是 $\langle-\partial L(0),\,g\rangle_{L^2(q)}$。对所有 $g\in[L^2(q)]^d$ 成立，故最速下降方向

$$
v
\;=\;
-\partial L(0)
\;=\;
\nabla\log\frac{p}{q}
\;=\;
\nabla\log r^*,
\qquad
r^*=p/q.
$$

,g\rangle_{L^2(q)}=\langle\nabla\log(p/q),g\rangle_{L^2(q)}$。）未知 $p,q$ 时不能直接写这个梯度，所以下一节先估密度比 $r^*$，再取 $\widehat v=\nabla\log\widehat r$。

---

## 9. 密度比的二次损失：完整配方

未知 $p,q$ 时不能直接写 $\nabla\log(p/q)$。先估密度比。

**命题。** $r^*(x)=p(x)/q(x)$ 是

$$
L(r)
\;=\;
\mathbb{E}_{X\sim q}[r(X)^2]
-
2\,\mathbb{E}_{X\sim p}[r(X)]
+1
$$

在 $L^2(q)$ 中的唯一最小元。

**证明（配方法）。** $\mathbb{E}_p[r]=\mathbb{E}_q[r\cdot(p/q)]=\mathbb{E}_q[r\,r^*]$，故

$$
\begin{aligned}
L(r)
&=
\mathbb{E}_q[r^2]-2\mathbb{E}_q[r\,r^*]+1
=
\mathbb{E}_q(r-r^*)^2
-
\mathbb{E}_q(r^*)^2
+1.
\end{aligned}
$$

第二、三项与 $r$ 无关，$L(r)-\mathrm{const}=\|r-r^*\|_{L^2(q)}^2$。唯一最小元 $r=r^*$（在 $L^2(q)$ 等价类里）。$\square$

注：$L(1)=0$ 恒成立；$p=q$ 时 $r^*=1$ 确实是最小且 $L\ge 0$。$p\neq q$ 时由 Cauchy–Schwarz $\mathbb{E}_q(p/q)^2\ge 1$，故 $L(r^*)\le 0$，最小值比 0 更小。

样本版：$\{X_i\}_{i=1}^n\sim p$（目标），$\{Y_i\}_{i=1}^n\sim q$（当前生成），

$$
\widehat r_\varphi
\;\in\;
\arg\min_{r_\varphi\in\mathcal{F}}
\frac1n\sum_{i=1}^n
\bigl[r_\varphi(Y_i)^2-2r_\varphi(X_i)\bigr].
\tag{2}
$$

（$+1$ 不影响 argmin。）这是可回归的平方损失，没有 GAN 的内层 max。

**从 $\widehat r$ 到向量场。** 总体最小元是 $r^*=p/q$，所以 $\nabla\log r^*=\nabla\log(p/q)$ 正是 8.5 的最速下降。样本上把 $\widehat r_\varphi$ 插进去：

$$
\widehat v
\;=\;
\nabla\log\widehat r_\varphi
\;=\;
\frac{\nabla\widehat r_\varphi}{\widehat r_\varphi}.
$$

网络 $\widehat r_\varphi$ 要对 $x$ 可微（实践里用 smooth 激活，或对 ReLU 网做弱梯度）。$\widehat T=I+s\widehat v$ 就是沿这个场走一小步。配方是：二次损失 $\to\widehat r\to\widehat v=\nabla\log\widehat r\to$ 推送粒子。

---

## 10. 算法：inexact Riemannian GD / EPT

Gao–Jiao–Wang–Wang–Yang–Zhang ICML 19，Gao–Huang–Jiao–Liu–Lu–Yang MSML 21。

**输入。** 目标样本 $X_1,\ldots,X_n\sim p$；初始生成器 $G_\theta$，$Y_i=G_\theta(Z_i)$，$Z_i\sim\mu$。

**迭代：**

1. 解 (2) 得 $\widehat r_\varphi$，令 $\widehat v=\nabla\log\widehat r_\varphi$，$\widehat T=I+s\widehat v$（步长 $s$ 小）。
2. 更新粒子：$Y_i\leftarrow\widehat T(Y_i)$。
3. 拟合生成器：$\min_\theta n^{-1}\sum_i\|G_\theta(Z_i)-Y_i\|_2^2$。

人话：估密度比 $\to$ 它的 score 当向量场 $\to$ 把粒子沿这个场推一小步 $\to$ 用网络记住「噪声到新粒子」的映射。这是概率空间上的不精确黎曼梯度下降，不是 min-max。 的实验（2D 多峰、4 正方形$\to$5 正方形、MNIST / Fashion-MNIST / CIFAR Inception Score 对外环稳定、粒子在 $\mathbb{R}^{2352}$ / $\mathbb{R}^{3072}$ 里走、CelebA 视觉对比）说明：用 Jeffrey / JS / KL 当外层损失时 IS 能稳住，不像 GAN 那样抖。细节略，理论在下一节。

---

## 11. 连续极限：连续性方程、Otto 梯度流、LogSob

粒子 $x_{t+\mathrm{d}t}=x_t+v_t(x_t)\,\mathrm{d}t$，$v_t=\nabla\log(p/q_t)$。密度 $q_t$ 满足**连续性方程**

$$
\partial_t q_t
\;=\;
-\nabla\cdot(q_t v_t)
\quad\text{在 }\mathbb{R}_+\times\mathbb{R}^d,\qquad
q_0=q.
\tag{3}
$$

**从粒子 $x_{t+\mathrm{d}t}=x_t+v_t(x_t)\,\mathrm{d}t$ 推连续性方程。**

粒子更新就是瞬时推送 $T(x)=x+v_t(x)\,\mathrm{d}t$。$\mathrm{d}t$ 无穷小时 $T^{-1}(x)=x-v_t(x)\,\mathrm{d}t+o(\mathrm{d}t)$，Jacobian $\nabla T^{-1}=I-\mathrm{d}t\,\nabla v_t+o(\mathrm{d}t)$。密度的推送公式

$$
q_{t+\mathrm{d}t}(x)
\;=\;
q_t\bigl(T^{-1}(x)\bigr)\,
\bigl|\det\nabla T^{-1}(x)\bigr|,
$$

取对数（内容把 $o(\mathrm{d}t)$ 写在 log 这一层）：

$$
\log q_{t+\mathrm{d}t}(x)
=
\log q_t\bigl(T^{-1}x\bigr)
+
\log\bigl|\det\nabla_x T^{-1}\bigr|
+
o(\mathrm{d}t).
$$

两项分别 Taylor / 8.3 的 $\log\det$：

$$
\begin{aligned}
\log q_t\bigl(x-v_t(x)\,\mathrm{d}t\bigr)
&=
\log q_t(x)
-
v_t(x)^\top\nabla_x\log q_t(x)\,\mathrm{d}t
+
o(\mathrm{d}t),\\[4pt]
\log\bigl|\det\bigl(I-\mathrm{d}t\,\nabla v_t(x)\bigr)\bigr|
&=
-\mathrm{d}t\,\mathrm{tr}(\nabla v_t(x))
+
o(\mathrm{d}t)
=
-\nabla\cdot v_t(x)\,\mathrm{d}t
+
o(\mathrm{d}t).
\end{aligned}
$$

相加：

$$
\log q_{t+\mathrm{d}t}(x)-\log q_t(x)
=
-\bigl(
v_t^\top\nabla\log q_t
+
\nabla\cdot v_t
\bigr)\mathrm{d}t
+
o(\mathrm{d}t)
=
-\frac{\nabla\cdot(v_t q_t)}{q_t}\,\mathrm{d}t
+
o(\mathrm{d}t).
$$

内容再用一次 $\log$ 的一阶：$\log(q+\Delta q)-\log q=\Delta q/q+o(\Delta q)$，即

$$
\log q_{t+\mathrm{d}t}-\log q_t
=
\frac{q_{t+\mathrm{d}t}-q_t}{q_t}+o(\mathrm{d}t).
$$

左端已经算出，乘 $q_t$：

$$
q_{t+\mathrm{d}t}(x)-q_t(x)
=
-\nabla\cdot\bigl(v_t(x)\,q_t(x)\bigr)\,\mathrm{d}t
+
o(\mathrm{d}t).
$$

除以 $\mathrm{d}t$ 取极限即 (3)。粒子形式（内容 (4)）就是 ODE

$$
\frac{\mathrm{d}}{\mathrm{d}t}x_t=v_t(x_t),\qquad t>0,\qquad x_0\sim q.
$$

密度 (3) 是这条 ODE 的 Liouville / 连续性方程；两者是同一件事的 Eulerian / Lagrangian 写法。

**Otto 演算**（Otto 2001，Villani 2008）。$(\mathcal{P}_2(\mathbb{R}^m),W_2)$ 是无限维黎曼流形：切向量 $\xi=-\nabla\cdot(\mu\nabla\phi)$，度量 $\langle\xi,\eta\rangle_\mu=\int\langle\nabla\phi,\nabla\psi\rangle\mathrm{d}\mu$。取 $L[q]=D_{\mathrm{KL}}(q\|p)$，一阶变分 $\frac{\delta L}{\delta q}=\log(q/p)+1$，Wasserstein 梯度 $\nabla_W L=\nabla\log(q/p)$。梯度流

$$
\partial_t q_t
\;=\;
-\nabla_W L[q_t]
\;=\;
-\nabla\cdot(q_t v_t),
\qquad
v_t=\nabla\log\frac{p}{q_t}
$$

恰好是 (3)。沿流 $\frac{\mathrm{d}}{\mathrm{d}t}L[q_t]=-\mathbb{E}_{q_t}\|v_t\|_2^2\le 0$。

若 $p\in\mathrm{LogSob}(c)$，即

$$
D_{\mathrm{KL}}(q\|p)
\;\le\;
\frac1{2c}\,
\mathbb{E}_q\Bigl\|\nabla\log\frac{q}{p}\Bigr\|_2^2
\quad\text{（Fisher 信息）},
$$

则 $\frac{\mathrm{d}}{\mathrm{d}t}L\le -2c\, L$，故 $L[q_t]=O(e^{-ct})$（Otto–Villani 2000；内容写 $\exp(-ct)$，常数 2 被吸收进 $c$ 的定义）。

EPT 是不精确黎曼 GD：

$$
q_{k+1}
\;=\;
\exp_{q_k}(s v_k)
\;\approx\;
\exp_{q_k}(s\widehat v_k)
\;\approx\;
(I+s\widehat v_k)_\sharp q_k.
$$

指数映射的一阶就是恒等加切向量——第 10 节的粒子更新。

---

## 12. 改写成 Langevin / Fokker–Planck（通向第四部分）

$v=\nabla\log p-\nabla\log q$，代入 (3)：

$$
\partial_t q
=
-\nabla\cdot(q\nabla\log p)
+\nabla\cdot(q\nabla\log q).
$$

$q\nabla\log q=\nabla q$，$\nabla\cdot\nabla q=\Delta q$，故

$$
\partial_t q_t
\;=\;
-\nabla\cdot(q_t\nabla\log p)+\Delta q_t,
\qquad
q_0=q.
\tag{5}
$$

这是 Fokker–Planck。对应的 SDE 是 Langevin：漂移 $\nabla\log p=-\nabla U$，扩散 $\sqrt{2}$。下一节从这里出发。

---

## 第四部分 Langevin 与扩散

## 13. Langevin SDE 与 ULA

目标 $p(x)=e^{-U(x)}/Z$，$\nabla U$ Lipschitz。**Langevin 扩散**（Arnold 1974）

$$
\mathrm{d}X_t
\;=\;
-\nabla U(X_t)\,\mathrm{d}t
+\sqrt{2}\,\mathrm{d}B_t
$$

以 $\Pi(dx)=p(x)dx$ 为唯一不变分布：Fokker–Planck 正是 (5)，$q=p$ 时右端 $-\nabla\cdot(p\nabla\log p)+\Delta p=0$。

**ULA**（Unadjusted Langevin Algorithm，Euler–Maruyama；Dalalyan 17 等）：

$$
X_{k+1}
\;=\;
X_k-\gamma_k\nabla U(X_k)+\sqrt{2\gamma_k}\,\xi_k,
\qquad
\xi_k\stackrel{\mathrm{iid}}{\sim}N(0,I).
$$

生成学习的设定：$U$ **未知**，只有样本 $X_1,\ldots,X_n\sim p$。不能直接插 $\nabla U$。但 $-\nabla U=\nabla\log p=s(x)$（**score**）。思路：用网络学 $\widehat s_\theta\approx s$，再跑 ULA（Song–Ermon 19）：

$$
X_{k+1}
\;=\;
X_k+\gamma_k\widehat s_\theta(X_k)+\sqrt{2\gamma_k}\,\xi_k.
$$

误差可并入 ULA 的已有分析（score 误差 = 漂移误差）。

---

## 14. 去噪 autoencoder 与模糊 score

直接学 $s=\nabla\log p$ 需要 $\nabla\log p$ 的标签，没有。Tweedie / 去噪给出可回归的代理。

令 $g_\sigma=N(0,\sigma^2 I)$，$p_\sigma=p*g_\sigma$（模糊密度），

$$
v_\sigma
\;\in\;
\arg\min_v
\mathbb{E}_{X\sim p,\,Z\sim g_\sigma}
\bigl\|v(X+Z)-X\bigr\|_2^2.
$$

这是「看见加噪点 $X+Z$，重建干净 $X$」的去噪 autoencoder。则

$$
s_\sigma(x)
\;:=\;
\nabla\log p_\sigma(x)
\;=\;
\frac{v_\sigma(x)-x}{\sigma^2}.
$$

$\sigma$ 小时 $s_\sigma\approx s$。样本版：$Z_i\sim N(0,\sigma^2 I)$，

$$
\widehat v_\theta
\;\in\;
\arg\min_{v_\theta\in\mathcal{F}}
\frac1n\sum_{i=1}^n
\bigl\|v_\theta(X_i+Z_i)-X_i\bigr\|_2^2,
\qquad
\widehat s_\theta(x)=\frac{\widehat v_\theta(x)-x}{\sigma^2}.
$$

下一节证明：这个 $L^2$ 重建损失，差一个常数，就是模糊密度上的 score matching。

---

## 15. Stein 引理：完整证明

**Stein 引理。** $\xi\sim N(0,I_d)$，$f:\mathbb{R}^d\to\mathbb{R}$ 几乎处处可微，$\mathbb{E}[\|\nabla f(\xi)\|]<\infty$，且对每个坐标 $\lim_{|x_i|\to\infty}f(x)\,e^{-x_i^2/2}=0$。则

$$
\mathbb{E}\bigl[f(\xi)\,\xi\bigr]
\;=\;
\mathbb{E}\bigl[\nabla f(\xi)\bigr].
$$

**一维证明（分部积分，按内容写全）。** $\xi\sim N(0,1)$，密度 $\phi(x)=(2\pi)^{-1/2}e^{-x^2/2}$。高斯的关键代数是 $\phi'(x)=-x\phi(x)$，即 $x\phi(x)=-\phi'(x)$。于是

$$
\mathbb{E}[f(\xi)\xi]
=
\int_{\mathbb{R}} f(x)\,x\,\phi(x)\,\mathrm{d}x
=
\int_{\mathbb{R}} f(x)\bigl(-\phi'(x)\bigr)\,\mathrm{d}x.
$$

分部积分：令 $u=f$，$dv=-\phi'\,\mathrm{d}x$，则 $du=f'\,\mathrm{d}x$，$v=-\phi$，

$$
\int_{-\infty}^{\infty} f(-\phi')
\;=\;
\bigl[-f(x)\phi(x)\bigr]_{-\infty}^{\infty}
+
\int_{-\infty}^{\infty} f'(x)\phi(x)\,\mathrm{d}x.
$$

边界项：$\phi(x)\propto e^{-x^2/2}$，内容假设 $\lim_{|x|\to\infty}f(x)\,e^{-x^2/2}=0$，故 $[-f\phi]_{-\infty}^{\infty}=0$。剩下 $\mathbb{E}[f'(\xi)]$。$\square$

（高维每个坐标的边界是 $\lim_{|x_i|\to\infty}f(x)\,e^{-x_i^2/2}=0$，对其余坐标积分后回到一维。）

**推广到 $\mathbb{R}^d$。** 第 $i$ 坐标：固定 $x_{-i}$，对 $x_i$ 用一维结论，$\mathbb{E}[f(\xi)\xi_i]=\mathbb{E}[\partial_i f(\xi)]$。叠成向量即 $\mathbb{E}[f(\xi)\xi]=\mathbb{E}[\nabla f(\xi)]$。

**向量场形式。** $w:\mathbb{R}^d\to\mathbb{R}^d$，$\mathbb{E}[\langle\xi,w(\xi)\rangle]=\sum_i\mathbb{E}[\xi_i w_i(\xi)]=\sum_i\mathbb{E}[\partial_i w_i]=\mathbb{E}[\nabla\cdot w(\xi)]$。

**缩放。** $Z=\sigma\xi\sim N(0,\sigma^2 I)$，$h(z)=w(x+z)$：

$$
\mathbb{E}[\langle Z,w(x+Z)\rangle]
=
\sigma\mathbb{E}[\langle\xi,w(x+\sigma\xi)\rangle]
=
\sigma^2\mathbb{E}[\nabla\cdot w(x+\sigma\xi)]
=
\sigma^2\mathbb{E}[\nabla\cdot w(x+Z)].
$$

---

## 16. 从 $\mathbb{E}\mathbb{E}\|v(X+Z)-X\|^2$ 到 score matching

记 $Y=X+Z$，$w(y)=v(y)-y$。内容把被积函数写成 $V(y)-y+z$，即 $w(y)+z$：

$$
v(X+Z)-X
=
v(Y)-(Y-Z)
=
w(Y)+Z.
$$

$$
\mathbb{E}_X\mathbb{E}_Z\|v(X+Z)-X\|^2
=
\mathbb{E}\|w(Y)+Z\|^2
=
\mathbb{E}\|w(Y)\|^2
+
2\mathbb{E}\langle Z,w(Y)\rangle
+
\mathbb{E}\|Z\|^2.
$$

第三项是常数 $C=d\sigma^2$。换元 $y=x+z$（内容写 $V(y)-y+z$，即 $w(y)+z$）：

$$
\mathbb{E}\|w(Y)\|^2
+
2\iint \langle z,w(y)\rangle p(y-z)\Phi_\sigma(z)\,\mathrm{d}y\mathrm{d}z
+C.
$$

**第一项。** $\int p(y-z)\Phi_\sigma(z)\mathrm{d}z=p_\sigma(y)$，故 $=\mathbb{E}_{Y\sim p_\sigma}[\|w(Y)\|^2]$。

**交叉项，对固定 $x$ 用 Stein。** $z=\sigma\xi$，

$$
\int\langle z,w(x+z)\rangle\Phi_\sigma(z)\,\mathrm{d}z
=
\sigma\mathbb{E}_\xi[\langle\xi,w(x+\sigma\xi)\rangle]
=
\sigma^2\mathbb{E}_Z[\nabla\cdot w(x+Z)].
$$

对 $X\sim p$ 再取期望：$Y=X+Z\sim p_\sigma$，交叉项 $=2\sigma^2\mathbb{E}_{Y\sim p_\sigma}[\nabla\cdot w(Y)]$。

**散度定理（假设 $\lim_{\|x\|\to\infty}w(x)p_\sigma(x)=0$）。**

$$
\int (\nabla\cdot w)\,p_\sigma
=
-\int \langle w,\nabla p_\sigma\rangle
=
-\mathbb{E}_{p_\sigma}\bigl\langle w,\,\nabla\log p_\sigma\bigr\rangle
=
-\mathbb{E}_{p_\sigma}\langle w,s_\sigma\rangle.
$$

故交叉项 $=-2\sigma^2\mathbb{E}_{p_\sigma}\langle w,s_\sigma\rangle$。

**拼起来。**

$$
\mathbb{E}\|v(X+Z)-X\|^2
=
\mathbb{E}_{p_\sigma}\|w\|^2
-
2\sigma^2\mathbb{E}_{p_\sigma}\langle w,s_\sigma\rangle
+C
=
\mathbb{E}_{p_\sigma}\|w-\sigma^2 s_\sigma\|^2
-
\sigma^4\mathbb{E}\|s_\sigma\|^2
+C.
$$

$L^2(p_\sigma)$ 最小元 $w^*=\sigma^2 s_\sigma$，即 $v^*(x)-x=\sigma^2\nabla\log p_\sigma(x)$，

$$
s_\sigma(x)
\;=\;
\frac{v_\sigma(x)-x}{\sigma^2}.
$$

差一个与 $S$ 无关的常数，去噪损失等价于 **score matching**

$$
\min_{S(\cdot)}
\mathbb{E}_{Y\sim p_\sigma}
\bigl\|S(Y)-\nabla\log p_\sigma(Y)\bigr\|_2^2.
$$

（Hyvärinen 2005 的显式 score matching 需要 $\Delta\log p$；Vincent 2011 的去噪形式避免了它。）

---

## 17. Inexact Langevin 与 Schrödinger Bridge

**算法（Inexact Langevin）。** 输入 $X_1,\ldots,X_n$、$\sigma$、$K$。

1. 加噪 $Y_i=X_i+\sigma\xi_i$，$\xi_i\sim N(0,I)$。
2. 训练 $\widehat v_\theta\in\arg\min n^{-1}\sum_i\|v_\theta(Y_i)-X_i\|_2^2$。
3. 从噪声出发迭代 $K$ 步：

$$
X_{k+1}
=
X_k+\gamma_k\frac{\widehat v_\theta(X_k)-X_k}{\sigma^2}
+\sqrt{2\gamma_k}\,\xi_k,
\qquad
k=0,\ldots,K-1.
$$

4. 对 $\sigma$ 做退火（大噪声 $\to$ 小噪声），即 NCSN 的多尺度。

**Schrödinger Bridge 视角**（Wang–Jiao–Xu–Wang–Yang ICML 21）。单位时间 SDE

$$
\mathrm{d}X_t
\;=\;
\sigma^2\,
s_{\sqrt{1-t}\,\sigma}(X_t)\,\mathrm{d}t
+\sigma\,\mathrm{d}B_t,
\tag{6}
$$

$X_0\sim p_\sigma$，则 $X_1\sim p$：从模糊分布走回干净分布，漂移是随时间变细的模糊 score。训练 $\widehat s_\theta(t_i,x)\approx s_{\sqrt{1-t_i}\sigma}(x)$，$t_i=i/K$，Euler–Maruyama 插进去采样。端到端一致性：score 误差 $\to$ 路径测度误差 $\to$ 终端分布误差。

人话：扩散模型不是「神秘的加噪再去噪」，是 **Schrödinger Bridge / 不精确 Langevin 的时间参数化**；训练目标仍然是去噪回归。

---

## 18. 时间反转：OU 过程与 Song et al.

### 18.1 正向 OU 的显式解

Ornstein–Uhlenbeck（内容）

$$
\mathrm{d}X_t=-X_t\,\mathrm{d}t+\sqrt{2}\,\mathrm{d}B_t,
\qquad
X_0\sim p.
$$

积分因子 $e^{t}$：Itô 乘积法则（$e^{t}$ 有限变差，二次协变差 $0$）

$$
\mathrm{d}\bigl(e^{t}X_t\bigr)
=
e^{t}X_t\,\mathrm{d}t
+
e^{t}\bigl(-X_t\,\mathrm{d}t+\sqrt{2}\,\mathrm{d}B_t\bigr)
=
\sqrt{2}\,e^{t}\,\mathrm{d}B_t.
$$

从 $0$ 积到 $t$，再乘 $e^{-t}$：

$$
X_t
=
e^{-t}X_0
+
e^{-t}\int_0^t\sqrt{2}\,e^{s}\,\mathrm{d}B_s.
$$

条件于 $X_0$，随机积分是高斯、均值 $0$。Itô 等距：

$$
\mathrm{Var}\bigl(e^{-t}\int_0^t\sqrt{2}\,e^{s}\,\mathrm{d}B_s\bigr)
=
e^{-2t}\int_0^t 2\,e^{2s}\,\mathrm{d}s
=
e^{-2t}\bigl(e^{2t}-1\bigr)
=
1-e^{-2t}.
$$

故 $X_t\mid X_0\sim N(e^{-t}X_0,\,(1-e^{-2t})I)$，与内容一致。

### 18.2 时间换元 $\varphi(t)=1-e^{-t}$

内容：$\varphi(t)=1-e^{-t}$ 把 OU 时钟 $[0,\infty)$ 映到新时钟 $[0,1)$。**新过程是旧过程在逆时钟上的取值**，不是 $X_{\varphi(t)}$（那会给出均值 $e^{-(1-e^{-t})}X_0$，对不上 $(1-t)X_0$）。正确的是

$$
\tau(t)
\;:=\;
\varphi^{-1}(t)
\;=\;
-\log(1-t),
\qquad
\widetilde X_t
\;:=\;
X_{\tau(t)}
\;=\;
X_{-\log(1-t)},
\qquad
t\in[0,1).
$$

此时 $e^{-\tau(t)}=1-t$，$\tau'(t)=1/(1-t)$。代入显式解：

$$
\widetilde X_t
=
(1-t)X_0
+
(1-t)\int_0^{\tau(t)}\sqrt{2}\,e^{s}\,\mathrm{d}B_s.
$$

把积分换到新时钟：$s=\tau(u)=-\log(1-u)$，$e^{s}=1/(1-u)$，布朗运动时间变换 $\mathrm{d}B_{\tau(u)}=\sqrt{\tau'(u)}\,\mathrm{d}W_u=(1-u)^{-1/2}\,\mathrm{d}W_u$，故

$$
\int_0^{\tau(t)}\sqrt{2}\,e^{s}\,\mathrm{d}B_s
=
\int_0^t\sqrt{2}\cdot\frac{1}{1-u}\cdot\frac{1}{\sqrt{1-u}}\,\mathrm{d}W_u
=
\int_0^t\sqrt{\frac{2}{(1-u)^3}}\,\mathrm{d}W_u.
$$

这就是内容

$$
\widetilde X_t
=
(1-t)X_0
+
(1-t)\int_0^t\sqrt{\frac{2}{(1-s)^3}}\,\mathrm{d}B_s,
\qquad
t\in[0,1).
$$

**SDE 系数。** 一般规则：$\mathrm{d}X_\tau=b(X_\tau)\,\mathrm{d}\tau+\sigma\,\mathrm{d}B_\tau$，新时间 $\tau=\tau(t)$，新漂移 $=b\cdot\tau'$，新扩散 $=\sigma\sqrt{\tau'}$。这里 $b(x)=-x$，$\sigma=\sqrt{2}$，$\tau'=1/(1-t)$，

$$
\text{新漂移}
=
-\widetilde X_t\cdot\frac{1}{1-t}
=
\frac{\widetilde X_t}{t-1},
\qquad
\text{新扩散}
=
\sqrt{2}\cdot\sqrt{\frac{1}{1-t}}
=
\sqrt{\frac{2}{1-t}}.
$$

故 $\widetilde X$ 是

$$
\mathrm{d}\widetilde X_t
=
\frac{\widetilde X_t}{t-1}\,\mathrm{d}t
+
\sqrt{\frac{2}{1-t}}\,\mathrm{d}B_t
$$

的唯一强解（与内容逐字一致）。

**边际。** $\widetilde X_t\mid X_0$ 仍高斯，均值 $(1-t)X_0$。方差用 Itô 等距：

$$
(1-t)^2\int_0^t\frac{2}{(1-s)^3}\,\mathrm{d}s
=
(1-t)^2\Biggl[\frac{1}{(1-t)^2}-1\Biggr]
=
1-(1-t)^2
=
t(2-t).
$$

故 $\widetilde X_t\mid X_0\sim N\bigl((1-t)X_0,\,t(2-t)I\bigr)$，密度

$$
p_t(x)
=
\int p(y)\,
\Phi_{\sqrt{t(2-t)}}\bigl(x-(1-t)y\bigr)\,\mathrm{d}y.
$$

### 18.3 反向 SDE（Haussmann–Pardoux 86）

$\varepsilon\in(0,1]$，定义 $X^*_t:=\widetilde X_{1-t}$，$t\in[\varepsilon,1]$。内容：$\widetilde X$ 在 $[0,1-\varepsilon]$ 上满足 Haussmann–Pardoux 86 的全部条件，故反向过程存在。

**一般公式。** 正向 $\mathrm{d}X_u=b(u,X_u)\,\mathrm{d}u+\sigma(u,X_u)\,\mathrm{d}B_u$，扩散矩阵 $a=\sigma\sigma^\top$。时间反转到 $Y_s=X_{T-s}$ 的漂移是

$$
-b(T-s,Y_s)
+
\nabla\cdot a(T-s,Y_s)
+
a(T-s,Y_s)\,\nabla\log p_{T-s}(Y_s),
$$

扩散仍是 $\sigma(T-s,Y_s)$。这里 $T=1$，$Y_t=X^*_t=\widetilde X_{1-t}$，正向系数（18.2）

$$
b(u,x)=\frac{x}{u-1},
\qquad
\sigma(u)=\sqrt{\frac{2}{1-u}}
\quad\text{（只依赖时间，故 }\nabla\cdot a=0\text{）},
\qquad
a(u)=\frac{2}{1-u}I.
$$

代入 $u=1-t$：

$$
b(1-t,x)
=
\frac{x}{(1-t)-1}
=
-\frac{x}{t},
\qquad
a(1-t)
=
\frac{2}{t}I,
\qquad
\sigma(1-t)=\sqrt{\frac{2}{t}}.
$$

反向漂移

$$
-b(1-t,X^*_t)
+
a(1-t)\nabla\log p_{1-t}(X^*_t)
=
\frac{X^*_t}{t}
+
\frac{2}{t}\nabla\log p_{1-t}(X^*_t)
=
\frac{X^*_t+2\nabla\log p_{1-t}(X^*_t)}{t}.
$$

这就是内容

$$
\mathrm{d}X^*_t
=
\frac{X^*_t+2\nabla\log p_{1-t}(X^*_t)}{t}\,\mathrm{d}t
+
\sqrt{\frac{2}{t}}\,\mathrm{d}B_t,
$$

且 $X^*_1=\widetilde X_0=X_0\sim p$。训练时学 $\nabla\log p_t$，Euler–Maruyama 插进这条反向 SDE，即 Song et al. 2021。

### 18.4 去噪 score matching 的等价形式（完整）

总体目标

$$
s(t,x)
\;\in\;
\arg\min_s
\mathbb{E}_{t\sim U(0,1),\,X_t\sim p_t}
\bigl\|s(t,X_t)-\nabla\log p_t(X_t)\bigr\|_2^2.
$$

**命题（Vincent）。** 上式与条件 score matching 只差与 $s$ 无关的常数。令 $\sigma_t=\sqrt{t(2-t)}$，$X_t=(1-t)X+\sigma_t\xi$，$X\sim p$，$\xi\sim N(0,I)$。条件密度对 $x$ 的 score 是

$$
\nabla_x\log p_{t\mid 0}(X_t\mid X)
=
-\frac{X_t-(1-t)X}{\sigma_t^2}
=
-\frac{\xi}{\sigma_t}.
$$

故

$$
\mathbb{E}\bigl\|s(t,X_t)+\xi/\sigma_t\bigr\|_2^2
=
\mathbb{E}\Bigl\|s(t,X_t)-\nabla\log p_{t\mid 0}\Bigr\|_2^2,
$$

与 $\mathbb{E}\|s-\nabla\log p_t\|^2$ 同 argmin。按 $\sigma_t^2=t(2-t)$ 改写 $\|s+\xi/\sigma_t\|_2^2=\sigma_t^{-2}\|\sigma_t s+\xi\|_2^2$：

$$
\bigl\|s+\xi/\sigma_t\bigr\|_2^2
=
\frac1{t(2-t)}
\Bigl\|
\sqrt{t(2-t)}\,s\bigl(t,\,(1-t)X+\sqrt{t(2-t)}\,\xi\bigr)
+\xi
\Bigr\|_2^2.
$$

这就是内容的等价损失（对每个固定 $t$，因子 $1/\sigma_t^2$ 不影响 $\arg\min$）。训练 $s_\theta(t,x)$，Euler–Maruyama 插进反向 SDE：Song et al. 2021（score-SDE / NCSN++）。

---

## 第五部分 一步生成 / Föllmer

扩散要模拟整条 SDE，NFE 大。ODE 流：单位时间把高斯运到 $\nu$，离散后可蒸馏成**一步**映射。

## 19. 三种插值

**测地线 / Benamou–Brenier。**

$$
W_2(\mu,\nu)
=
\inf_{\mu_t,v_t}
\Biggl(
\int_0^1
\mathbb{E}_{X\sim\mu_t}\|v_t(X)\|_2^2\,\mathrm{d}t
\Biggr)^{1/2}
$$

约束 $\partial_t\mu_t=-\nabla\cdot(\mu_t v_t)$，$\mu_0=\mu$，$\mu_1=\nu$。这是 $W_2$ 空间的测地线（Monge 1781，Kantorovich 1942，Benamou–Brenier 2000）。

**Schrödinger 熵插值**（Schrödinger 1932，Föllmer 1986/87）。在路径空间 $\mathcal{P}(\Omega)$ 上

$$
Q^*\in\arg\min D_{\mathrm{KL}}(Q\|W_\gamma),
\qquad
Q_0=\mu,\; Q_1=\nu,
$$

$W_\gamma$ 是 Wiener（或参考扩散）测度。边际 $Q^*_t$ 是熵正则的 OT 插值。

**随机插值**（Albergo–Boffi–Vanden-Eijnden 2023）：

$$
X_t=a(t)X_0+b(t)X_1,
\tag{7}
$$

$X_0\sim\mu$，$X_1\sim\nu$ 独立，$a,b\in C^1([0,1])$，内容 (8)：

$$
\begin{aligned}
&a'(t)\le 0,\quad b'(t)\ge 0,\\
&a(0)=1,\quad a(1)=0,\\
&b(0)=0,\quad b(1)=1,\\
&a(t)>0\text{ 在 }[0,1),\qquad
b(t)>0\text{ 在 }(0,1].
\end{aligned}
\tag{8}
$$

端点的人话：$t=0$ 时 $X_0=1\cdot X_0+0\cdot X_1$，纯噪声；$t=1$ 时 $X_1=0\cdot X_0+1\cdot X_1$，纯数据。$a$ 单调降、$b$ 单调升，中间严格为正，避免方差在开区间里退化。$\mu_t=\mathrm{Law}(X_t)$。直线插值，不求 OT，但诱导的 ODE 仍然把 $\mu_0$ 运到 $\nu$。 的表把 (8) 放宽到 $a_0>0$、$b_0\ge 0$（VE 的起点已经是卷积），Föllmer / Linear / Trig / Sqrt 仍满足原来的 $a(0)=1,\,b(0)=0$。

---

## 20. 高斯插值流：ODE、速度场、对照表

目标写成高斯卷积 $\nu=\gamma_{d,\sigma}*\rho$，$\rho$ 支撑在半径 $R$ 的球上（任何分布加一点点噪声都属此类）。ODE

$$
\mathrm{d}X_t=V(t,X_t)\,\mathrm{d}t,
\qquad t\in[0,1],
\tag{9}
$$

$X_0\sim\mu=\mathrm{Law}(a_0 Z+b_0 X_1)$，$Z\sim\gamma_d=N(0,I)$，

$$
V(t,x)
\;=\;
\mathbb{E}\bigl[
\dot a_t Z+\dot b_t X_1
\bigm|
a_t Z+b_t X_1=x
\bigr],
\quad t\in(0,1),
$$

端点 $V(0,x)=\lim_{t\downarrow 0}V(t,x)$，$V(1,x)=\lim_{t\uparrow 1}V(t,x)$。这就是条件期望：随机插值 $X_t=a_t Z+b_t X_1$ 的瞬时速度 $\dot a_t Z+\dot b_t X_1$，在看到 $X_t=x$ 之后的 $L^2$ 最佳预测。对测试函数 $\phi$，

$$
\frac{\mathrm{d}}{\mathrm{d}t}\mathbb{E}[\phi(X_t)]
=
\mathbb{E}\bigl[\langle\nabla\phi(X_t),V(t,X_t)\rangle\bigr]
=
\mathbb{E}\bigl[\langle\nabla\phi(a_t Z+b_t X_1),\,\dot a_t Z+\dot b_t X_1\rangle\bigr],
$$

右端正是 $\frac{\mathrm{d}}{\mathrm{d}t}\mathbb{E}[\phi(a_t Z+b_t X_1)]$，故 $V$ 满足连续性方程，把 $\mu_0$ 运到 $\nu$。

| 类型 | VE | VP | Linear | Föllmer | Trig | Sqrt |
|------|----|----|--------|---------|------|------|
| $a_t$ | $\sigma_t$ | $\alpha_t$ | $1-t$ | $\sqrt{1-t^2}$ | $\cos(\pi t/2)$ | $\sqrt{1-t}$ |
| $b_t$ | $1$ | $\sqrt{1-\alpha_t^2}$ | $t$ | $t$ | $\sin(\pi t/2)$ | $\sqrt{t}$ |
| $a_0$ | $\sigma_0$ | $\alpha_0$ | $1$ | $1$ | $1$ | $1$ |
| $b_0$ | $1$ | $\sqrt{1-\alpha_0^2}$ | $0$ | $0$ | $0$ | $0$ |
| 源 | 卷积 | 卷积 | $\gamma_d$ | $\gamma_d$ | $\gamma_d$ | $\gamma_d$ |

公共约束：$a,b\in C^2((0,1))$，$\dot a\le 0$，$\dot b\ge 0$，$a_0>0$，$b_0\ge 0$，$a_1=0$，$b_1=1$，中间严格为正。这是 Albergo–Vanden-Eijnden 23 的推广（允许 $b_0>0$ 的自适应起点，从而包含 VE）。

---

## 21. 定理 Gao–Huang–Jiao JMLR 24

**假设。** $\nu=\gamma_{d,\sigma}*\rho$，$\rho$ 支撑在半径 $R$ 的球上；$(a_t,b_t)$ 如上。$X_t$ 是 ODE (9) 从 $X_0\sim\mu=\mathrm{Law}(a_0 Z+b_0 X_1)$ 出发的流。

**结论。**

1. $X_t\sharp\mu=\mathrm{Law}(a_t Z+b_t X_1)$，$t\in[0,1]$；特别地 $X_1\sharp\mu=\nu$。
2. 终端映射 $x\mapsto X_1(x)$ Lipschitz，常数

$$
\frac{\sigma}{\sqrt{a_0^2+\sigma^2 b_0^2}}
\exp\Biggl(
\frac{a_0^2}{a_0^2+\sigma^2 b_0^2}
\cdot
\frac{R^2}{2\sigma^2}
\Biggr).
$$

**证明骨架。**

*边际。* $V$ 是条件期望，故对任意测试 $\phi$，

$$
\frac{\mathrm{d}}{\mathrm{d}t}\mathbb{E}[\phi(X_t)]
=
\mathbb{E}\bigl[\langle\nabla\phi(X_t),V(t,X_t)\rangle\bigr]
=
\mathbb{E}\bigl[\langle\nabla\phi(a_t Z+b_t X_1),\,\dot a_t Z+\dot b_t X_1\rangle\bigr],
$$

右端正是 $\frac{\mathrm{d}}{\mathrm{d}t}\mathbb{E}[\phi(a_t Z+b_t X_1)]$。初值相同 $\Rightarrow$ 边际相同。特征 ODE 的流映射把 $\mu$ 推到 $\mu_t$。

*Lipschitz。* Tweedie：$\nabla\log p_t$ 的 Jacobian $=-\mathrm{Cov}(\text{后验})^{-1}$ 型，高斯卷积把后验协方差从下方锁住。于是 $\lambda_{\max}(\nabla_x V(t,\cdot))$ 可积。变分方程 $\frac{\mathrm{d}}{\mathrm{d}t}DX_t=(\nabla_x V)\,DX_t$，Gronwall：

$$
\mathrm{Lip}(X_1)
\;\le\;
\exp\Biggl(\int_0^1\lambda_{\max}(\nabla_x V(t,\cdot))\,\mathrm{d}t\Biggr),
$$

算出的显式常数即上式。$a_0=\sigma_0$、$b_0=1$ 时，这给出 $\gamma_{d,\sigma_0}*\nu\to\nu$ 的**显式 Lipschitz 运输**（Klartag–Putterman 2021 是隐式存在性）。沿流的边际满足改进常数的 LSI / Poincaré（Bardet–Gozlan–Malrieu–Zitt 18，Chen–Chewi–Niles-Weed 21）。

---

## 22. 采样：归一化未知时 MC 估 $V$

Föllmer 特例：$\mu=\gamma_d$，$a(t)=\sqrt{1-t^2}$，$b(t)=t$。目标 $\nu(\mathrm{d}x)=C^{-1}e^{-U(x)}\mathrm{d}x$，$C$ 未知。

$\dot a=-t/\sqrt{1-t^2}$，$\dot b=1$，故条件期望定义给出

$$
V(t,x)
=
\mathbb{E}\Bigl[
X_1-\frac{t}{\sqrt{1-t^2}}Z
\Bigm|
\sqrt{1-t^2}\,Z+t X_1=x
\Bigr].
$$

归一化常数 $C$ 未知，不能直接从 $\nu$ 抽样。内容改用

$$
g(x)
\;=\;
\exp\bigl(-U(x)+\|x\|_2^2/2\bigr)
$$

（即 $\mathrm{d}\nu/\mathrm{d}\gamma_d$ 的未归一化版本）把 $V$ 写成**只对标准高斯求期望**的商。内容把 $\sqrt{1-t^2}$ 写在**分母期望之后**（不是分子）：

$$
V(t,x)
\;=\;
\frac{
\mathbb{E}_{Z\sim\gamma_d}\bigl[Z\,g\bigl(tx+\sqrt{1-t^2}Z\bigr)\bigr]
}{
\mathbb{E}_{Z\sim\gamma_d}\bigl[g\bigl(tx+\sqrt{1-t^2}Z\bigr)\bigr]
\,\sqrt{1-t^2}
}.
$$

这与 $\dfrac{1}{\sqrt{1-t^2}}\dfrac{\mathbb{E}[Zg]}{\mathbb{E}[g]}$ 相同。下面用条件期望算到底，确认 $\sqrt{1-t^2}$ 只能在分母。

分子分母用同一批高斯样本，$C$ 在比值里消掉。下面把贝叶斯 / 高斯密度算到底。

### 22.1 从条件期望到后验均值

记 $a=\sqrt{1-t^2}$。约束 $X_t=a Z+t X_1=x$ 给出 $Z=(x-t X_1)/a$，代入瞬时速度

$$
\begin{aligned}
\dot a\,Z+X_1
&=
\dot a\cdot\frac{x-t X_1}{a}+X_1
=
\frac{\dot a}{a}\,x
+
\Bigl(1-\frac{\dot a\,t}{a}\Bigr)X_1.
\end{aligned}
$$

$\dot a/a=-t/(1-t^2)$，$1-\dot a\,t/a=1/(1-t^2)$，故

$$
V(t,x)
=
-\frac{t}{1-t^2}\,x
+
\frac{1}{1-t^2}\,\mathbb{E}[X_1\mid X_t=x].
$$

只要算出 $\mathbb{E}[X_1\mid X_t=x]$。

### 22.2 贝叶斯：$X_1\mid X_t=x$ 的后验

$Z\perp X_1$，$X_t\mid X_1=y\sim N(ty,\,a^2 I)$，似然

$$
p(X_t=x\mid X_1=y)
\;\propto\;
\exp\Bigl(-\frac{\|x-ty\|_2^2}{2a^2}\Bigr).
$$

先验是 $\nu(\mathrm{d}y)=C^{-1}e^{-U(y)}\,\mathrm{d}y$。标准高斯密度 $\varphi(y)=(2\pi)^{-d/2}e^{-\|y\|_2^2/2}$，故

$$
\nu(\mathrm{d}y)
=
\kappa\,g(y)\,\gamma_d(\mathrm{d}y),
\qquad
\kappa=C^{-1}(2\pi)^{d/2},
\qquad
g(y)=e^{-U(y)+\|y\|_2^2/2}.
$$

后验 $\propto$ 似然 $\times$ 先验：

$$
p(y\mid X_t=x)
\;\propto\;
\exp\Bigl(-\frac{\|x-ty\|_2^2}{2(1-t^2)}\Bigr)
g(y)\,
e^{-\|y\|_2^2/2}.
$$

把指数里 $y$ 的二次型配平方。$\|x-ty\|_2^2/(2(1-t^2))+\|y\|_2^2/2$ 中 $\|y\|_2^2$ 的系数是

$$
\frac{t^2}{2(1-t^2)}+\frac12
=
\frac{1}{2(1-t^2)},
$$

线性项是 $-t\langle x,y\rangle/(1-t^2)$，因此

$$
\exp\bigl(\cdots\bigr)
\;\propto\;
\exp\Bigl(
-\frac{\|y-tx\|_2^2}{2(1-t^2)}
\Bigr).
$$

也就是说，**若不看 $g$**，后验是 $N(tx,\,(1-t^2)I)$；有 $g$ 之后，它是这个高斯被 $g$ 重加权。令 $Y=tx+a Z$，$Z\sim\gamma_d$，则

$$
\mathbb{E}[X_1\mid X_t=x]
=
\frac{
\mathbb{E}_Z\bigl[(tx+a Z)\,g(tx+a Z)\bigr]
}{
\mathbb{E}_Z\bigl[g(tx+a Z)\bigr]
}
=
tx
+
a\,
\frac{\mathbb{E}_Z[Z\,g(tx+a Z)]}{\mathbb{E}_Z[g(tx+a Z)]}.
$$

$\kappa$ 与 $C$ 在分子分母中约掉——这就是「归一化未知也能算 $V$」。

### 22.3 代回 $V$，得到 MC 公式

把 $\mathbb{E}[X_1\mid X_t=x]$ 代入 22.1：

$$
\begin{aligned}
V(t,x)
&=
-\frac{t}{a^2}\,x
+
\frac{1}{a^2}\Bigl(tx+a\,\mu_Z\Bigr)
=
\frac{\mu_Z}{a},
\qquad
\mu_Z
:=
\frac{\mathbb{E}[Z\,g(tx+a Z)]}{\mathbb{E}[g(tx+a Z)]}.
\end{aligned}
$$

$a=\sqrt{1-t^2}$，故

$$
V(t,x)
=
\frac{1}{\sqrt{1-t^2}}
\frac{\mathbb{E}_{Z\sim\gamma_d}[Z\,g(tx+\sqrt{1-t^2}Z)]}
{\mathbb{E}_{Z\sim\gamma_d}[g(tx+\sqrt{1-t^2}Z)]}.
$$

**检查 $t=0$：** $a=1$，$V(0,x)=\mathbb{E}[Z g(Z)]/\mathbb{E}[g(Z)]=\mathbb{E}_\nu[X]$，与 的 $V(0,x)=\mathbb{E}[X_1]$（与 $x$ 无关）一致。

**Stein 看法（同一式）。** 对高斯用 Stein 把 $\nabla g$ 换成 $Z g$，同样得到分子里的 $Z g$。习题跟内容：用 $g=\exp(-U+\|x\|_2^2/2)$ 的高斯商。

**算法。** $t_k=k/K$，$s=1/K$，$X_{t_0}\sim\gamma_d$，

$$
X_{t_{k+1}}
=
X_{t_k}+s\,\widehat V_m(X_{t_k},t_k),
$$

$\widehat V_m$ 是 $m$ 个 i.i.d. 高斯的 MC。

**定理 Ding–Jiao–Lu–Yang–Yuan arXiv:2311.03660。** $r=\mathrm{d}\nu/\mathrm{d}\gamma_d$，假设 $r,\nabla r$ Lipschitz 且 $r\ge c>0$。则

$$
W_2\bigl(\mathrm{Law}(X_{t_K}),\nu\bigr)
\;\le\;
O\bigl((d/K^2)^{1/3}\bigr)
+
O\bigl(d/(mK)\bigr).
$$

内容只给这两项，不把论文里的中间阶再拆细。不靠遍历、单位时间、多峰数值上比 ULA 稳。

确定性轨迹还可再拟合一步生成器 $\widehat g_\psi\in\arg\min N^{-1}\sum_i\|\widehat g_\psi(X_{t_0}^{(i)})-X_{t_K}^{(i)}\|_2^2$。

---

## 23. 生成学习：回归损失 (10) 是条件期望

现在 $p$ 未知，只有 $X_1,\ldots,X_n\sim\nu$。仍学 $V$，Euler 模拟 (9)。

$V(0,x)=\mathbb{E}_{Y\sim\nu}[Y]$（与 $x$ 无关），$\widehat V(0,\cdot)=n^{-1}\sum_i X_i$。

对 $t\in(0,1)$，Föllmer 速度 $V(t,x)=\mathbb{E}[X_1-\frac{t}{\sqrt{1-t^2}}Z\mid \sqrt{1-t^2}Z+t X_1=x]$。

**命题（损失 (10) 的总体版是条件期望回归）。** 令 $t\sim U(0,1)$，$Z\sim\gamma_d$，$X_1\sim\nu$ 独立，

$$
\begin{aligned}
L(v)
&=
\mathbb{E}
\Bigl\|
\Bigl(X_1-\frac{t}{\sqrt{1-t^2}}Z\Bigr)
-
v\bigl(t,\,\sqrt{1-t^2}Z+t X_1\bigr)
\Bigr\|_2^2.
\end{aligned}
$$

则 $V\in\arg\min_v L(v)$，且对几乎处处的 $(t,x)$，$V(t,x)$ 等于上述条件期望。这就是内容把 $V(t,x)$ 直接写成 $\arg\min_v L(v(t,x))$ 的理由。

**证明（$L^2$ 投影 = 条件期望）。** 记瞬时速度标签

$$
Y
\;=\;
X_1-\frac{t}{\sqrt{1-t^2}}Z
\;=\;
\dot a_t Z+\dot b_t X_1,
$$

协变量 $U=(t,X_t)$，$X_t=\sqrt{1-t^2}Z+t X_1$。对任意（平方可积、可测）$v$，正交分解

$$
Y-v(U)
=
\bigl(Y-\mathbb{E}[Y\mid U]\bigr)
+
\bigl(\mathbb{E}[Y\mid U]-v(U)\bigr).
$$

交叉项：对任意 $w(U)$，

$$
\mathbb{E}\bigl\langle Y-\mathbb{E}[Y\mid U],\,w(U)\bigr\rangle
=
\mathbb{E}\Bigl[
\mathbb{E}\bigl[\langle Y-\mathbb{E}[Y\mid U],\,w(U)\rangle\mid U\bigr]
\Bigr]
=
0,
$$

因为内层是 $\langle\mathbb{E}[Y\mid U]-\mathbb{E}[Y\mid U],\,w(U)\rangle=0$。故

$$
\mathbb{E}\|Y-v(U)\|_2^2
=
\mathbb{E}\|Y-\mathbb{E}[Y\mid U]\|_2^2
+
\mathbb{E}\|\mathbb{E}[Y\mid U]-v(U)\|_2^2.
$$

第一项与 $v$ 无关（不可约噪声），第二项 $\ge 0$，当且仅当 $v(U)=\mathbb{E}[Y\mid U]$ a.s. 时取 $0$。而 $\mathbb{E}[Y\mid t,X_t=x]$ 正是 (9) 里的 $V(t,x)$。所以总体 $\arg\min L(v)$ 就是速度场 $V$——**平方损失的回归目标是条件期望，不是密度、也不是 score 本身**。$\square$

**从总体到样本 (10)。** 有 i.i.d. $X_i\sim\nu$ 时，再独立抽 $t_i\sim U(0,1)$、$Z_i\sim\gamma_d$，经验风险就是把 $\mathbb{E}$ 换成平均：

$$
\widehat V_\theta
\;\in\;
\arg\min_{V_\theta}
\frac1n\sum_{i=1}^n
\Biggl\|
\Biggl(
X_i-\frac{t_i}{\sqrt{1-t_i^2}}Z_i
\Biggr)
-
V_\theta\Bigl(t_i,\,\sqrt{1-t_i^2}Z_i+t_i X_i\Bigr)
\Biggr\|_2^2.
\tag{10}
$$

这是标准监督回归：输入 $(t_i,\,a_{t_i}Z_i+b_{t_i}X_i)$，标签 $Y_i=\dot a_{t_i}Z_i+\dot b_{t_i}X_i$，网络拟合条件均值。不需要 $U$、不需要归一化常数、没有内层 max。$t=0$ 时标签退化为 $X_i$、输入退化为 $Z_i$，$V(0,\cdot)$ 与 $x$ 无关，经验版就是 $\widehat V(0,\cdot)=n^{-1}\sum_i X_i$，与内容一致。

**算法（Föllmer flow）。** $s=(1-a)/K$（早停 $a>0$，避免 $t\to 1$ 时条件方差 $\to 0$），$X_{t_0}\sim\gamma_d$，

$$
X_{t_{k+1}}=X_{t_k}+s\,\widehat V_\theta(t_k,X_{t_k}).
$$

---

## 24. 特征学习一步生成与速率

**特征学习（characteristic learning）。** 并行跑 $N$ 条 Euler 轨迹 $\{X_{t_k}^{(i)}\}$，学

$$
\widehat g_\psi(t,x)
\;\in\;
\arg\min_{g_\psi}
\sum_{i=1}^N
\sum_{k=1}^K
\sum_{\ell=k+1}^K
\frac1{2NK^2}
\bigl\|
g_\psi\bigl(t_\ell,X_{t_{k-1}}^{(i)}\bigr)
-
X_{t_\ell}^{(i)}
\bigr\|_2^2.
$$

$\widehat g_\psi(t,x)$ 直接从当前点跳到未来时间 $t$——真正的一步（或少步）生成。

**定理 Chang–Ding–Jiao–Li–Yang arXiv:2402.01460，Gao–Huang–Jiao–Zheng arXiv:2404.00551。** 网络结构与 $N,K,a$ 取得合适时，

$$
\mathbb{E}\bigl[W_2(\mathrm{Law}(X_{t_K}),\nu)\bigr]
\;\le\;
O\bigl(n^{-1/(d+5)}\bigr).
$$

**定理 Ding–Duan–Jiao–Li–Yang–Zhang arXiv:2405.05512。** $T\in(0,1)$，

$$
\mathbb{E}
\Biggl[
\frac2{T^2}
\int_0^T\int_t^T
W_2^2\bigl(\widehat g(s,\cdot)_\sharp\mu_t,\,\mu_s\bigr)
\,\mathrm{d}s\mathrm{d}t
\Biggr]
\;\le\;
O\bigl(n^{-1/(7d+13)}\bigr).
$$

**维数从哪来。** $V(t,x)$ 是 $(t,x)\in[0,1]\times\mathbb{R}^d$ 上的向量场，非参回归指数 $n^{-2s/(2s+(d+1))}$。高斯卷积让 $V$ 有有限光滑；再经 Euler、早停、Gronwall（$L^2(V)\to W_2(\mathrm{Law})$）损耗几个阶，合成 $n^{-1/(d+5)}$。**诅咒来自「在 $\mathbb{R}^d$ 上均匀地学一个场」**，不是 MCMC 的 $\exp(d)$。特征学习还要对 $(s,t,x)$ 学跳跃映射，指数更差 $7d+13$。低维潜空间（下一节）把 $d$ 换成 $d^*$。

---

## 25. 潜空间 Föllmer + autoencoder 误差分解

像素 $d=3072$ 时 $n^{-1/(d+5)}$ 没意义。先 autoencoder，再在 $d^*\ll d$ 的潜空间做流。

预训练 $(\widehat E,\widehat D)$ 于 $\widetilde X_i\sim\widetilde\nu$（可与生成数据 $\nu$ 不同，例如更大的无标签集），

$$
(\widehat E,\widehat D)
\;\in\;
\arg\min_{E:\mathbb{R}^d\to\mathbb{R}^{d^*},\;D:\mathbb{R}^{d^*}\to\mathbb{R}^d}
\frac1m\sum_{i=1}^m
\bigl\|D(E(\widetilde X_i))-\widetilde X_i\bigr\|_2^2.
\tag{11}
$$

潜变量 $\bar X_i=\widehat E(X_i)$，在 $\mathbb{R}^{d^*}$ 上估 $\widehat V_\theta$，从 $\gamma_{d^*}$ 跑 Föllmer 得 $\bar X_{t_k}$，解码 $X_{t_k}=\widehat D(\bar X_{t_k})$。

**定理 Jiao–Lai–Wang–Yan arXiv:2404.02538。** $(E^*,D^*)\in\arg\min L_{\mathrm{AE}}$。正则性与超参数合适时，

$$
\begin{aligned}
\mathbb{E}\bigl[W_2(\nu,\mathrm{Law}(X_{t_K}))\bigr]
&\;\le\;
O\bigl(n^{-1/(4(d^*+5))}\bigr)
+
O\bigl(m^{-1/(d+2)}\bigr)\\
&\quad+
O\bigl(\mathrm{Lip}(\widehat D)\mathrm{Lip}(\widehat E)\,W_2(\nu,\widetilde\nu)\bigr)
+
O\bigl(L_{\mathrm{AE}}(E^*,D^*)\bigr).
\end{aligned}
$$

四项：潜空间生成的统计误差（维数 $d^*$）；encoder 的统计误差（环境维 $d$，样本 $m$）；$\nu$ 与预训练分布的偏移；重构偏差。Stable Diffusion 的「先压再扩散」在这里有误差账本。

---

## 26. CIFAR-10：NFE vs FID

| 模型 | NFE $\downarrow$ | FID $\downarrow$ |
|------|--------------------|---------------------|
| BigGAN | 1 | 8.51 |
| StyleGAN-Ada | 1 | 2.92 |
| DDPM | 1000 | 3.17 |
| DDIM | 100 | 4.16 |
| Rectified Flow | 1 | 4.85 |
| PD | 1 | 9.12 |
| CD | 1 | 10.53 |
| CTM (without GAN) | 1 | 5.19 |
| **CG (ours)** | **1** | **4.59** |
| PD | 2 | 4.51 |
| CTM (without GAN) | 18 | 3.00 |
| **CG (ours)** | **2** | **3.50** |
| **CG (ours)** | **4** | **2.83** |

NFE = 每张图的网络前向次数。GAN 一步但训练不稳；DDPM 一千步才 3.17；特征学习 / CG 一步 4.59，四步 2.83，进入 StyleGAN-Ada 的球。takehome 的定量版：ODE 流可以又稳又少步。：swissroll / MNIST 上 $\widehat g_\psi$ 随 $1-t$ 的轨迹，粒子从噪声走到数据流形。

---

## 27. 条件生成做 UQ

学 $\nu(\cdot\mid X=x)$：条件 GAN（Zhou–Jiao–Liu–Huang JASA 23）、条件扩散（Jiao–Kang–Liu–Peng–Zuo TIT 25+）、条件 ODE 流（Chang–Ding–Jiao–Li–Yang arXiv:2402.01460）。

UCI wine quality：$n=6497$，$X_i\in\mathbb{R}^{11}$，75% / 15% / 10% 训练 / 验证 / 测试。左图：测试集上估计的条件密度 vs 真密度；右图：逐点预测区间。**名义 90% 区间，650 个测试点实际覆盖 91.23%。** 点估计永远给不出这句话。

---

## 第六部分 LLM 的误差分析

生成学习的「下一个 token」版本：学的是条件分布 $p^*(x\mid h)$，架构是 Transformer。

## 28. Transformer 类 $\mathcal{T}$ 的精确定义

输入 $X\in\mathbb{R}^{d_x\times n}$（$d_x$ 是 token 维，$n$ 是长度；列是 token）。类

$$
\mathcal{T}_{d_x,d_y}(D,H,S,W,L,N)
:=
\Bigl\{
E_{\mathrm{out}}\circ F_L^{(\mathrm{FF})}\circ F_L^{(\mathrm{SA})}\circ\cdots\circ F_1^{(\mathrm{FF})}\circ F_1^{(\mathrm{SA})}\circ E_{\mathrm{in}}
\Bigr\}.
$$

（内容还留了一个容量参数 $N$；下面上界主要用 $D,H,S,W,L$。）

**嵌入。** $E_{\mathrm{in}}(X)=E_{\mathrm{in}}X+P\in\mathbb{R}^{D\times n}$（可学习 + 位置编码 $P$），$E_{\mathrm{out}}(Y)=E_{\mathrm{out}}Y\in\mathbb{R}^{d_y\times n}$。

**第 $\ell$ 层自注意力**（残差；$H$ 个头，头维 $S$）：

$$
F_\ell^{(\mathrm{SA})}(Z)
\;=\;
Z
+
\sum_{h=1}^H
W_{h,\ell}^{(O)}
\Biggl(
\bigl(W_{h,\ell}^{(V)}Z\bigr)
\;
\sigma_S
\Bigl[
\bigl(W_{h,\ell}^{(K)}Z\bigr)^\top
\bigl(W_{h,\ell}^{(Q)}Z\bigr)
\Bigr]
\Biggr)
\in\mathbb{R}^{D\times n}.
$$

权重：$W_{h,\ell}^{(V)},W_{h,\ell}^{(K)},W_{h,\ell}^{(Q)}\in\mathbb{R}^{S\times D}$，$W_{h,\ell}^{(O)}\in\mathbb{R}^{D\times S}$。

**Softmax（写全，跟内容的 $K^\top Q$ 乘法顺序）。** 令 $Q=W^{(Q)}Z\in\mathbb{R}^{S\times n}$，$K=W^{(K)}Z\in\mathbb{R}^{S\times n}$，$V=W^{(V)}Z\in\mathbb{R}^{S\times n}$。$K^\top Q\in\mathbb{R}^{n\times n}$，$(K^\top Q)_{ij}=\langle K_{:i},Q_{:j}\rangle$（第 $i$ 个 key 与第 $j$ 个 query）。$\sigma_S$ **对每个 query 列在 key 上归一化**（列和为 1）：

$$
\sigma_S(A)_{ij}
\;=\;
\frac{\exp(A_{ij})}{\sum_{k=1}^n\exp(A_{kj})},
\qquad
i,j\in[n].
$$

于是第 $j$ 列是 query $j$ 对所有 key 的权重，$(V\,\sigma_S(K^\top Q))_{:j}=\sum_i V_{:i}\,(\sigma_S)_{ij}$，再经 $W^{(O)}$ 回到 $\mathbb{R}^{D\times n}$，残差加上 $Z$。这与内容

$$
F_\ell^{(\mathrm{SA})}(Z)
=
Z+\sum_h W_{h,\ell}^{(O)}\Bigl(
(W_{h,\ell}^{(V)}Z)\;
\sigma_S\bigl[(W_{h,\ell}^{(K)}Z)^\top(W_{h,\ell}^{(Q)}Z)\bigr]
\Bigr)
$$

逐符号一致。（实现里常加 $1/\sqrt{S}$；逼近定理对有界单调的 $\sigma_S$ 同类。）

**第 $\ell$ 层逐位前馈**（残差；$\sigma_R=\mathrm{ReLU}$）：

$$
F_\ell^{(\mathrm{FF})}(Z)
\;=\;
Z
+
W_\ell^{(2)}
\sigma_R
\bigl(
W_\ell^{(1)}Z+b_\ell^{(1)}1_n^\top
\bigr)
+
b_\ell^{(2)}1_n^\top
\in\mathbb{R}^{D\times n},
$$

$W_\ell^{(1)}\in\mathbb{R}^{W\times D}$，$W_\ell^{(2)}\in\mathbb{R}^{D\times W}$，$b_\ell^{(1)}\in\mathbb{R}^W$，$b_\ell^{(2)}\in\mathbb{R}^D$。$1_n^\top$ 让偏置对每个 token 相同——FF 是 token-wise 的 MLP。

人话：SA 让每列看所有列（上下文），FF 在每个位置单独非线性，残差保证恒等可表示。Vaswani et al. 2017；NLP（BERT）、CV（ViT）、扩散（DiT）、LLM（GPT）都是这个骨架。

---

## 29. 逼近上界：Hölder $\to$ Transformer，深度 $O(1)$

**定理 Jiao–Lai–Sun–Wang–Yan arXiv:2504.12175。** $\gamma\in(0,1]$，$K_H>0$。目标 $F:[0,1]^{d_x\times n}\to\mathbb{R}^{d_x\times n}$ 的每个分量 $F_{i,j}\in\mathcal{H}^\gamma([0,1]^{d_x\times n},K_H)$。则对任意 $\varepsilon\in(0,1)$、$p\in[1,\infty]$，存在

$$
N\in\mathcal{T}_{d_x,d_x}
\bigl(D=C_1,\; H=C_2,\; S=C_3,\; W=C_4\lceil\varepsilon^{-d_x n/\gamma}\rceil,\; L=C_5\bigr)
$$

使

$$
\|N-F\|_{L^p([0,1]^{d_x\times n})}
\;\le\;
4(d_x n)^2 K_H\varepsilon.
$$

常数：

- $p\in[1,\infty)$：$C_1=d_x$，$C_2=1$，$C_3=1$，$C_4=5n$，$C_5=2$（**深度 2，一头注意力**）；
- $p=\infty$：$C_1=5d_x\,3^{d_x n}$，$C_2=3^{d_x n}$，$C_3=1$，$C_4=5n\,3^{d_x n}$，$C_5=2+2d_x n$。

宽度的主项是 $\varepsilon^{-d_x n/\gamma}$：把 $n$ 个 $d_x$ 维 token 当成 $\mathbb{R}^{d_x n}$ 里的 Hölder 函数，这是非参逼近的标准指数。**深度可以 $O(1)$**，不随 $\varepsilon$ 长——和「堆很多层」的实践叙事不同，表达力的瓶颈在宽度 / 参数个数。

骨架：若 SA 能做列平均（注意力均匀时 $VZ$ 乘 $\frac1n 11^\top$），再经 FF 实现 Kolmogorov–Arnold 型叠加，把高维 Hölder 拆成一元函数；一元函数用宽度 $\varepsilon^{-1/\gamma}$ 的固定深度网络逼近。$p=\infty$ 需要更宽的网格与更多头。

**与已有上界。** Yun et al. 19 / Tokio–Issei 24 / Fang et al. 22 / Cheng et al. 25：$C^0$ 的万能逼近，无速率。Jiao–Lai–Wang–Yan 24：$\mathcal{H}^\gamma$、$L^\infty$、激活 $X\odot\sigma_H(X)$，宽度 $O(\varepsilon^{-d_x n/\gamma})$、深度 $O(\log(1/\varepsilon))$。Havrilla–Liao 24：ReLU 注意力，同样宽度、深度对数。**本文：标准 softmax 注意力 $\sigma_S$，深度 $O(1)$。**

---

## 30. 下界与 VC 维

**定理 He–Jiao–Lu–Yang 25。** 若某 Transformer 架构 $\mathcal{T}_{d_x,d_y}(D,H,S,W,L,N)$ 深度 $L\lesssim\varepsilon^{-d_x n/\gamma}$，且能把任意 $F\in\mathcal{H}^\gamma([0,1]^{d_x\times n},K_H)$ 逼近到精度 $\varepsilon$，则参数个数 $N$ 必须满足

$$
N^2\log N
\;\ge\;
\mathrm{VCdim}\bigl(\mathcal{T}_{d_x,d_y}(D,H,S,W,L,N)\bigr)
\;\gtrsim\;
\varepsilon^{-d_x n/\gamma}.
\tag{12}
$$

更粗的参数下界 $N\gtrsim\varepsilon^{-d_x n/(2\gamma)}$。

人话：上界宽度 $\varepsilon^{-d_x n/\gamma}$ 在 VC / 参数个数意义下是对的阶；不能指望用 $\mathrm{poly}(d_x n,1/\varepsilon)$ 的小网络一致逼近所有 Hölder-$\gamma$ 序列映射。序列长度 $n$ 进了指数，这是「上下文越长、要逼近的函数越复杂」。

---

## 31. 非参回归、$\beta$-mixing、滑动窗口 ERM

**模型。**

$$
Y=f^*(X_1,\ldots,X_n)+\varepsilon,
\tag{13}
$$

$f^*(x_1,\ldots,x_n)=\mathbb{E}[Y\mid X_1=x_1,\ldots,X_n=x_n]\in\mathcal{H}^\gamma([0,1]^{d_x\times n},K_H)$，$\varepsilon$ 次高斯、水平 $\sigma$、与 $X$ 独立、均值 0。观测 $\mathcal{D}_m=\{(x_t,y_t)\}_{t=1}^m$ **不必 i.i.d.**。

**$\beta$-mixing。** 平稳列 $\{x_t\}_{t\in\mathbb{Z}}$，

$$
\beta(k)
\;=\;
\sup_n
\mathbb{E}_{B\in\sigma_{-\infty}^n}
\Biggl[
\sup_{A\in\sigma_{n+k}^\infty}
\bigl|\mathbb{P}(A\mid B)-\mathbb{P}(A)\bigr|
\Biggr].
$$

几何 $\beta$-mixing：$\beta(k)\le\beta_0\exp(-\beta_1 k^r)$，$\beta_0,\beta_1,r>0$。依赖随间隔指数衰减——语言模型的 token 流比 i.i.d. 真实，比任意依赖可分析。

**滑动窗口。** 把长序列切成

$$
\bigl((x_1,\ldots,x_n),y_n\bigr),\;
\bigl((x_2,\ldots,x_{n+1}),y_{n+1}\bigr),\;
\ldots,\;
\bigl((x_{m-n+1},\ldots,x_m),y_m\bigr).
$$

ERM：

$$
\widehat f
\;\in\;
\arg\min_{f\in\mathcal{F}}
\widehat L(f)
\;=\;
\frac1{m-n+1}
\sum_{t=n}^m
\bigl(f(x_{t-n+1},\ldots,x_t)-y_t\bigr)^2,
$$

$$
\mathcal{F}
=
\bigl\{\langle N(X),E\rangle:\; N\in\mathcal{T}_{d_x,d_x}(D,H,S,W,L,N)\bigr\}
$$

（Transformer 输出再与固定方向 $E$ 内积，得到标量回归）。截断 $\bar f=C_B(\widehat f)$（输出裁到 $[-B,B]$）。

**定理 Jiao–Lai–Sun–Wang–Yan arXiv:2504.12175。** $B_m\asymp\log m$，

$$
\mathcal{F}\bigl(D\lesssim 1,\; H\lesssim 1,\; S\lesssim 1,\;
W\lesssim m^{d_x n/(2\gamma+2 d_x n)},\;
L\lesssim 1\bigr)
$$

时，

$$
\mathbb{E}_{\mathcal{D}_m}\bigl[L(\bar f)-L(f^*)\bigr]
\;\lesssim\;
m^{-2\gamma/(2\gamma+2 d_x n)}
(\log m)^{3+1/r}.
$$

这是 Hölder-$\gamma$、有效维 $d_x n$ 的标准非参指数 $2\gamma/(2\gamma+\mathrm{dim})$；几何 mixing 只多对数。宽度按偏差–方差平衡选取（逼近 $\varepsilon\sim W^{-\gamma/(d_x n)}$，方差 $\sim W/m$ 型）。$L\lesssim 1$ 与上界深度 $O(1)$ 一致。

---

## 32. 预训练：next-token，$\sup|\widehat p-p^*|\le O(\delta)$

语料 $X=\{x^{(1)},\ldots,x^{(n)}\}$，$x^{(i)}=\{x^{(i)}_1,\ldots,x^{(i)}_{n_i}\}$，token $x^{(i)}_j\in\mathbb{R}^d$。One-hot 时 $d=|V|$（词表）；N-gram 时 $d$ 是超参。历史 $h\in\mathbb{R}^{d(T-1)}$：最多 $T-1$ 个 token（不足则 padding）。数据

$$
\mathcal{D}
=
\bigl\{\bigl(h^{(i)}_{1:j-1},\,x^{(i)}_j\bigr)\bigr\}_{i\in[n],\,j\in[n_i]}.
$$

目标条件分布 $p^*(x\mid h)$。Next-token 的经验风险是交叉熵（负对数似然）。内容把 $\widehat L$ 写成了 $\sum\log p$ 却仍标 $\arg\min$，漏了负号；正确的是

$$
\widehat p
\;\in\;
\arg\min_{p\in\mathcal{F}}
\widehat L(p)
\;=\;
\frac1{\sum_{i=1}^n n_i}
\sum_{i\in[n],\,j\in[n_i]}
\bigl(-\log p\bigl(x^{(i)}_j\mid h^{(i)}_{1:j-1}\bigr)\bigr).
$$

函数类

$$
\mathcal{F}
=
\bigl\{\sigma_S(N):\; N\in\mathcal{T}_{1,dT}(D,H,S,W,L,N)\bigr\}
$$

（Transformer 输出经 softmax 变成概率）。

**定理（informal）Jiao–Lai–Lin–Ma–Sun 25。** 以高概率

$$
\sup_{(x,h)}
\bigl|\widehat p(x\mid h)-p^*(x\mid h)\bigr|
\;\le\;
O(\delta),
\qquad
\delta
=
\Biggl(\sum_{i=1}^n n_i\Biggr)^{-2\gamma/(2\gamma+4dT)}.
$$

指数里 $4dT$：条件概率作为 $(x,h)\in\mathbb{R}^{d}\times\mathbb{R}^{d(T-1)}$ 上的函数，有效维 $dT$ 量级，平方损失 / TV 类估计多一个 2。预训练把 $\widehat p$ 在 **sup 范数** 下贴到 $p^*$——下一步理解能力和 ICL 都把 $\delta$ 当「模型没学准」的预算。

---

## 33. 潜在概念、理解能力

预训练时模型隐式推断潜在概念（内容例子：wiki bios）。概率图：

1. $\theta\in\Theta$（「国家 / 类型」等共享概念），$\widetilde\theta\in\widetilde\Theta$（个体信息）。需要 $\widetilde\theta$，是因为 $\theta$ **不能**恢复 $x$ 的全部信息。
2. $x\sim p^*(x\mid\theta,\widetilde\theta)$，$\theta_x=\arg\max_{\theta\in\Theta}p^*(\theta\mid x)$。

- **无歧义：** $p^*(\theta_x\mid x)=1$。
- **$\varepsilon$-歧义：** $p^*(\theta_x\mid x)\ge 1-\varepsilon(x)$，$\varepsilon(x)\in[0,1)$。

$\varepsilon$-歧义下，用预训练误差 $\delta$：

$$
\bigl|\widehat p(y\mid x)-p^*(y\mid x,\theta_x)\bigr|
\;\le\;
\varepsilon(x)+\delta.
$$

人话：「理解」= 从 $x$ 推断概念 $\theta_x$，再按 $p^*(\cdot\mid x,\theta_x)$ 生成。输入本身含混（$\varepsilon(x)$ 大）时，再好的模型也只能模糊；$\delta$ 是预训练没把条件概率学到位的部分。

---

## 34. ICL：为什么像隐式贝叶斯

In-context learning：prompt 里给 $(x_1,y_1),\ldots,(x_m,y_m)$，预测 $y\mid x_{m+1}$，**不更新参数**。假设背后有不可见的 $\theta$，图

$$
\theta
\;\xrightarrow{p^*(\cdot\mid\theta,\widetilde\theta_i)}\;
x_i
\;\xrightarrow{p^*(\cdot\mid x_i,\theta)}\;
y_i.
$$

先验 $p^*(\theta)$ 均匀。对每一对示范，内容定义

$$
\varepsilon_0(x_k,y_k)
\;=\;
\frac{
\sum_{\widetilde\theta\neq\theta}
p^*(\theta_k=\widetilde\theta\mid x_k,y_k)
}{
p^*(\theta_k=\theta\mid x_k,y_k)
}
\;\le\;
\varepsilon_0\in(0,1)
$$

刻画「这一对上下文有多像真 $\theta$ 而不是别的概念」。误差式按内容：

$$
\bigl|
\widehat p\bigl(y\mid \{x_i,y_i\}_{i=1}^m,x_{m+1}\bigr)
-
p^*(y\mid x_{m+1},\,\theta_{m+1}=\theta)
\bigr|
\;\le\;
\varepsilon(x_{m+1})\,\varepsilon_0^m
+
T\delta.
$$

### 34.1 $\varepsilon_0^m$ 从哪来：均匀先验下的贝叶斯更新

假设给定 $\theta$ 后各对 $(x_k,y_k)$ 条件独立，先验 $p^*(\theta)$ 在有限概念集 $\Theta$ 上均匀。贝叶斯

$$
p^*(\theta\mid x_k,y_k)
\;\propto\;
p^*(x_k,y_k\mid\theta)\,p^*(\theta)
\;\propto\;
p^*(x_k,y_k\mid\theta),
$$

故似然比等于后验比：

$$
\frac{p^*(x_k,y_k\mid\theta')}{p^*(x_k,y_k\mid\theta)}
=
\frac{p^*(\theta'\mid x_k,y_k)}{p^*(\theta\mid x_k,y_k)}.
$$

$m$ 条独立示范之后，全数据后验（再乘均匀先验，常数与 $\theta$ 无关）

$$
\frac{p^*(\theta'\mid\{x_i,y_i\}_{i=1}^m)}{p^*(\theta\mid\{x_i,y_i\}_{i=1}^m)}
=
\prod_{k=1}^m
\frac{p^*(\theta'\mid x_k,y_k)}{p^*(\theta\mid x_k,y_k)}.
$$

对所有错概念求和：记 $r_k(\theta')=p^*(\theta'\mid x_k,y_k)/p^*(\theta\mid x_k,y_k)$，则 $\varepsilon_0(x_k,y_k)=\sum_{\theta'\neq\theta}r_k(\theta')\le\varepsilon_0$，并且

$$
\sum_{\theta'\neq\theta}
\prod_{k=1}^m r_k(\theta')
\;\le\;
\prod_{k=1}^m
\Bigl(\sum_{\theta'\neq\theta}r_k(\theta')\Bigr)
\;\le\;
\varepsilon_0^m.
$$

（不等式是：把 $\prod_k(\sum_{\theta'}r_k(\theta'))$ 展开，对角项 $\sum_{\theta'}\prod_k r_k(\theta')$ 被包在里面。）因此错 / 对的后验赔率 $\le\varepsilon_0^m$，从而

$$
p^*(\text{错概念}\mid\text{data})
\;\le\;
\frac{\varepsilon_0^m}{1+\varepsilon_0^m}
\;\le\;
\varepsilon_0^m,
\qquad
p^*(\theta\mid\text{data})
\;\ge\;
\frac{1}{1+\varepsilon_0^m}.
$$

$\varepsilon_0<1$ 时，错概念的后验质量随示范条数 **指数死掉**——这就是隐式贝叶斯：上下文里每多一条像 $\theta$ 的例子，后验就乘上一个 $<1$ 的因子。

### 34.2 从后验到预测，再换成 $\widehat p$

真预测是混合

$$
p^*(y\mid\{x_i,y_i\}_{i=1}^m,x_{m+1})
=
\sum_{\theta'\in\Theta}
p^*(y\mid x_{m+1},\theta')\,
p^*(\theta'\mid\text{data}).
$$

与「已知真 $\theta$」的 $p^*(y\mid x_{m+1},\theta)$ 相比，差被错概念的后验质量控制；再把查询点的 $\varepsilon$-歧义 $\varepsilon(x_{m+1})$\ge 1-\varepsilon(x)$）乘上去，内容写成 $\varepsilon(x_{m+1})\varepsilon_0^m$。不发明更细的常数。

预训练只给我们 $\widehat p$，$\sup|\widehat p-p^*|\le O(\delta)$。把长度为 $T$ 的条件链上每一步的 $p^*$ 换成 $\widehat p$，每步最多加 $\delta$，三角不等式累积 $T\delta$。两段相加即内容的

$$
\varepsilon(x_{m+1})\,\varepsilon_0^m+T\delta.
$$

人话：ICL 不是魔法。Transformer 在上下文里做的事，统计上等于「用 $m$ 条示范当似然、对潜在概念做贝叶斯更新，再按后验预测」。示范越像同一个 $\theta$（$\varepsilon_0$ 小）、条数 $m$ 越大，指数项消失；预训练越准（$\delta$ 小），加性误差越小。这把「prompt 里多写几个例子就变聪明」写成可证明的误差。

---

## Lec4 收束：你应该记住的一张表

| 对象 | 尺子 | 速率 / 结论 | 要点 |
|------|------|-------------|------|
| GAN（IPM / Hölder-$\beta$） | $d_{\mathcal{F}}(\nu,\widehat g_\sharp\mu)$ | $n^{-\beta/d}\vee n^{-1/2}\log n$ | 分解 $4E_1+E_2+E_3+2E_4$；模型最优、min-max 不稳 |
| 低维流形 GAN | 同上 | $n^{-\beta/d^*}$ | 内在维，不是像素维 |
| EPT / 梯度流 | $D_{\mathrm{KL}}(q_t\|p)$ | LogSob 下 $e^{-ct}$ | 第一变分 $v=\nabla\log(p/q)$；密度比二次损失 |
| Langevin / ULA | $W_2$ 到 $\Pi$ | 混合 $\mathrm{poly}(d)C^{5/2}$，$C$ 可 $e^{d}$ | 要 score；去噪 AE = score matching（Stein） |
| 扩散 / 时间反转 | 终端 $\mathrm{Law}(X_1^*)$ | 稳、NFE 大 | OU + Haussmann–Pardoux；Song et al. |
| Föllmer 采样（已知 $e^{-U}$） | $W_2$ | $(d/K^2)^{1/3}+d/(mK)$ | 不靠遍历；MC 估 $V$ |
| Föllmer 生成 | $W_2(\mathrm{Law}(X_{t_K}),\nu)$ | $n^{-1/(d+5)}$ | 损失 (10) = 条件期望 |
| 特征学习一步 | 积分 $W_2^2$ | $n^{-1/(7d+13)}$ | $\widehat g_\psi(t,x)$ 直接跳 |
| 潜空间流 | $W_2$ | $n^{-1/(4(d^*+5))}+m^{-1/(d+2)}+\cdots$ | autoencoder 四项账 |
| Transformer 逼近 Hölder-$\gamma$ | $L^p$ | 宽度 $\varepsilon^{-d_x n/\gamma}$，深度 $O(1)$ | softmax SA + FF + 残差 |
| 滑动窗口回归 | 超额风险 | $m^{-2\gamma/(2\gamma+2d_x n)}(\log m)^{\cdots}$ | $\beta$-mixing |
| 预训练 next-token | $\sup\|\widehat p-p^*\|$ | $(\sum n_i)^{-2\gamma/(2\gamma+4dT)}$ | $\delta$ 预算 |
| ICL | 条件概率 | $\varepsilon(x_{m+1})\varepsilon_0^m+T\delta$ | 隐式贝叶斯 |

三条 takehome 的闭环：GAN 的统计误差可以最优，不稳在算法；SDE 把 min-max 换成 score 回归，稳但贵；ODE / Föllmer 给出可证明的一步生成，再在潜空间和条件分布上接到 UQ 与 LLM。

下一份：[05_附录A_线性代数微积分凸分析](/blog/fods-linear-algebra-calculus-convexity/)（若你按 00 的顺序，附录应在 Lec1 前读过；没读的话现在补，Lec4 用到的散度定理、Jacobian、KKT 都在那里）。
