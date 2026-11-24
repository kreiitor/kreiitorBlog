---
title: 表示学习：降维、对比学习与分布匹配
description: 从特征工程到表示学习，理解充分降维、自监督与对比学习。
pubDate: 2026-10-11
tags:
  - 数据科学
  - 学习理论
  - FODS
category: course
series: fods
order: 6
cover: /covers/post-math.svg
---

本章探讨「复杂高维数据为什么不能直接送入[线性模型](/blog/fods-linear-models/)」，以及在**没有标签或标签稀缺**的情况下，如何先学出低维表示，再在表示空间上做简单分类。

你会得到：

1. 分类流水线的三层：浅层简单数据 → 特征工程 → 端到端深度；最后一层仍然是线性 / logistic；
2. 什么叫好表示（像素 vs DNN encoder），以及 Deep Learning Book 中关于前馈网络中间表示的经典论断；
3. 有监督表示 / 充分降维（SDR）：$\dim(f^*(X))\ll\dim(X)$ 和条件独立 $X\perp Y\mid f^*(X)$；
4. 预训练 + 微调：先学表示，再在低维拟合；
5. 自监督学习（SSL）：数据增广、正样本对、两个力（类内拉近 vs 防崩塌）；
6. SimCLR 的 NT-Xent 损失公式和温度 $\tau$ 的作用；
7. ACT：$\min_f\max_G L(f,G)$，对抗项如何强迫二阶矩接近 $I$；
8. 下游预测规则（类均值）和测试误差；
9. Distribution Matching：把表示的分布推到「概念高斯混合」上，为什么比硬聚类成 $K$ 类更弱约束、更易迁移；
10. 一条主线：**超额风险仍是统计 + 逼近 + 优化，只是损失变成了对比损失或 IPM。**

需要的预备：

- [线性模型](/blog/fods-linear-models/)：风险、线性 / logistic 分类、超额风险；
- [逼近误差](/blog/fods-approximation-error/) 与 [统计误差](/blog/fods-statistical-error/)：Hölder 类、ReLU 网络逼近性质与覆盖数 / 经验过程；
- [数学附录 B](/blog/fods-probability-concentration/)：期望、条件分布、条件独立；
- Wasserstein-1（$W_1$）：这里先直观理解为分布间平均最优传输代价；[生成学习与 LLM](/blog/fods-generative-learning-llm/) 会正式引入 IPM 与 GAN 框架。

下文已将网络稀疏度 $K_{\mathrm{nn}}$ 与下游类别数 $K$、以及判别器可行集符号 $\widehat{\mathcal{G}}(f)$ 分别加以区分，避免与超参数和中间矩阵记号冲突。

---

## 0. 问题引入：为什么像素不能直接分类

[线性模型](/blog/fods-linear-models/)和监督风险框架默认输入特征 $X\in\mathbb{R}^d$ 本身已足够结构化。例如房价预测中，面积与房间数已经是语义明确的数值特征。

但若现在 $X$ 是一张 $32\times 32$ 的彩色图，原始坐标是 $32\times 32\times 3=3072$ 维像素，两个麻烦会同时出现：

1. **维数太高、样本相对太少。** 非参回归的速率里有 $n^{-\alpha/(2\alpha+d)}$（见[下界与监督方法](/blog/fods-minimax-supervised-learning/)）。$d=3072$ 时指数几乎是 $0$，在原始像素空间里学不动光滑函数。
2. **欧氏距离不懂语义。** 同一只猫的两张裁剪，像素差可以很大；一只黑猫和一只黑狗，像素差反而可以很小。若按原始像素欧氏距离聚类，往往会按毛色深浅而不是按物种把图片分开。

所以必须先把 $X$ 映成一个低维向量 $f(X)\in\mathbb{R}^{d^*}$，$d^*\ll d$，让

- 同一语义（同一只猫、同一类物体）靠得很近；
- 不同语义被推开；
- 后面只需一个线性 / logistic 头就能分类。

**表示学习 = 学这个 $f$。** 有标签时可以强迫 $f(X)$ 对预测 $Y$ 充分；没标签时，用「同一张图的两种增广应该像」来代替标签。这就是本章从 SDR 走到 SSL、ACT、Distribution Matching 的路线。

---

## 1. 分类流水线

从浅层特征到端到端深度网络，分类流水线可以分为三层，最后一层的线性或逻辑回归结构始终未变。

### 1.1 浅层模型 + 简单数据

数据 $(X,Y)$，**$X$ 本身已经是特征**（表格、手工指标）。模型就是经典的线性回归或 logistic 回归：

$$
\frac1n\sum_{i=1}^n \ell\bigl(w^\top X_i+b,\, Y_i\bigr).
$$

这里没有「表示」可学：表示是人给的。

### 1.2 浅层模型 + 复杂数据：特征工程

$X$ 是文本、图像、语音，**离能用的特征很远**。传统做法：

$$
X \;\longmapsto\; \widetilde X \;=\; \Phi(X)
\quad\text{（SIFT、HOG、词袋、TF–IDF……）},
$$

再在 $\widetilde X$ 上跑线性 / logistic。$\Phi$ 是人设计的，不跟着损失训练。好用的时候极好用，坏处是：换任务就要重新设计，而且 $\Phi$ 几乎一定丢信息。

### 1.3 深度模型 + 复杂数据：端到端

把 $\Phi$ 也参数化成网络 $f_\theta$，和最后一层一起训练：

$$
\min_\theta\;
\frac1n\sum_{i=1}^n \ell\bigl(f_\theta(X_i),\, Y_i\bigr).
$$

拆开看：

- $f_\theta$ 的**躯干**（除最后一层以外）是特征提取器，输出 $z=h_\theta(X)\in\mathbb{R}^{d^*}$；
- **最后一层**仍是线性映射 + logistic / softmax 分类器，输入只是从原始 $X$ 换成了学到的特征 $h_\theta(X)$。

**核心认识：** 深度学习并没有舍弃线性分类，而是把「人工设计特征」替换成「网络自动学习特征」，最后仍在更合理的坐标系里做超平面划分。

这一点 Deep Learning Book 写得很直白：

> Feedforward networks trained by supervised learning as performing a kind of representation learning. Specially, the last layer of the networks typically a linear classifier, such as a softmax regression classifier. The rest of the network learns to provide a representation to this classifier…. **Supervised training of feedforward networks does not involve explicitly imposing any condition on the learned intermediate features.**

前半句点明了流水线角色；后半句则是表示学习的核心动机——明确需要加以强调的缺口。

**这句话为什么重要。** 有监督端到端只优化最后一层的分类风险 $\ell(Q(h_\theta(X)),Y)$。对中间特征 $h_\theta(X)$ **不显式加任何统计条件**：不要求低维、不要求坐标解耦、不要求「给定 $h_\theta(X)$ 之后 $Y$ 不再依赖原始 $X$」。只要 $Q\circ h_\theta$ 在当前标签上好用，训练就结束。后果有三：

1. $h_\theta$ 可以把对**下一个**任务有用、但对当前 $Y$ 无用的信息扔掉（不可迁移）；
2. 同类可以在特征里缠成一条不可线性切开的流形（几何不好）；
3. $\dim h_\theta(X)$ 不必 $\ll\dim(X)$，维数灾难还在。

所以「网络在学表示」只是副产品，不是定理。要把表示当成一个可分析的对象，必须**自己写下**中间层该满足的条件。

**接到 SDR。** 下一页给的条件正是被这句话点名要补的东西：

$$
\dim\bigl(f^*(X)\bigr)\ll\dim(X)
\quad\text{（低维）},\qquad
X\;\perp\; Y\;\bigm|\; f^*(X)
\quad\text{（充分：给定 $f^*$ 后 $X$ 不再提供关于 $Y$ 的信息）}.
$$

条件独立 $\iff P(Y\mid X)=P(Y\mid f^*(X))$，Bayes 规则可以整段搬到低维特征上做，风险不增。这就是对中间特征的显式条件。SSL 没有 $Y$，就把条件改写成「增广不变 + 不崩塌 / 匹配参考分布」——仍然是显式的。纯有监督深度默认**不加**这些，所以要单独开表示学习这一讲。详细的 $\perp$ 见第 3.2 节。

---

## 2. 什么是好表示

### 2.1 像素表示与深度编码器对比

在「原始像素空间（Default Representation）」与「语义表示空间（Semantic Representation）」下，类簇分布截然不同：

- **原始像素空间：** 横纵坐标对应颜色、亮度或局部纹理。黑猫和黑狗距离很近，白猫和白狗距离很近，猫与狗在像素空间交错纠缠，线性分类器难以画出简单分隔面。
- **语义编码器（DNN encoder）：** 同一语义类别的不同图像聚成紧凑簇，猫和狗被拉开，簇间留出清晰间隔，只需最后一层线性分类器即可划分。

好表示的三个核心标准：

1. **降维：** $d^*\ll d$，避免后续估计受制于原始像素维数的维数灾难；
2. **保信息：** 保留下游任务所需的充分语义信号；
3. **好几何：** 同类紧凑、异类分离，并尽量避免特征维度间的高度冗余（后续 ACT、Barlow Twins、VICReg 都围绕这一点设计）。

经典文献可参考 Hinton (1986)、Bengio–Courville–Vincent (2013) 表示学习综述以及 LeCun–Bengio–Hinton (2015) *Nature* 综述。

### 2.2 与全局误差分解的关系

把预测规则写成「表示 $f$ + 头 $Q$」。超额风险照旧

$$
\text{下游误差}
\;=\;
\text{统计误差（样本不够）}
+
\text{逼近误差（网络表达不了那个 $f^*$）}
+
\text{优化误差（min-max 没解好）}.
$$

改变的只是**损失定义**：有监督时为 $\ell(Q(f(X)),Y)$，自监督时为对比损失或 $W_1$ 等分布散度，整套统计–逼近–优化误差分解框架保持不变。

---

## 3. 有监督表示与充分降维 SDR

### 3.1 目标：低维、光滑且充分的摘要

有标签时，理想表示 $f^*$ 应同时满足低维与正则性：

$$
\dim\bigl(f^*(X)\bigr) \;\ll\; \dim(X),
\qquad
f^*\text{ Lipschitz},
$$

以及**信息保全（充分性）**：

$$
X \;\perp\; Y \;\bigm|\; f^*(X).
$$

第一行要求摘要维度低、对输入扰动不敏感（Lipschitz），从而可由 ReLU 网络高精度逼近；第二行则是充分降维的条件独立约束。

这一视角与充分降维（Sufficient Dimension Reduction, SDR）直接相连，现代非线性推广可参见：

- Chen–Jiao–Qiu–Yu, *Annals of Statistics* 2024（深度非线性 SDR）；
- Huang–Jiao–Liao–Liu–Yu, *IEEE TIT* 2024（有监督表示 / 深度降维）。

核心思想：经典 SDR（如 Li, 1991 的切片逆回归 SIR）寻找**线性**投影 $x\mapsto B^\top x$ 使 $Y\perp X\mid B^\top X$。数据非线性结构复杂时，用深度网络 $f$ 替代线性投影，并以条件独立性度量（例如广义鞅差散度）作为损失函数，再套用统一的统计与逼近误差分析框架。

### 3.2 条件独立的精确含义

先回忆无条件独立：$X\perp Y$ 意味着「看见 $X$ 对猜 $Y$ 没有任何帮助」，$P(Y\mid X)=P(Y)$。这对分类是灾难。

**条件独立** $X\perp Y\mid Z$ 是另一件事：

> 一旦你已经知道 $Z$，再把 $X$ 的细节给你，对猜 $Y$ **没有额外帮助**。

写成分布：

$$
P(X,Y\mid Z) \;=\; P(X\mid Z)\,P(Y\mid Z),
$$

或（对预测更有用的等价形式）

$$
P(Y\mid X,Z) \;=\; P(Y\mid Z).
$$

本章取 $Z=f^*(X)$。因为 $f^*(X)$ 是 $X$ 的函数，$P(Y\mid X,f^*(X))=P(Y\mid X)$，所以条件独立立刻给出

$$
P(Y\mid X) \;=\; P(Y\mid f^*(X)).
$$

**举例理解：**

- $X$：一张 $3072$ 维的猫图（毛色、背景、JPEG 噪声全在里面）；
- $Y$：标签「猫」；
- $f^*(X)$：提取出的「物种 + 粗姿态」低维特征。

给定 $f^*(X)$ 后，背景地毯纹路等无关细节不再提供关于 $Y$ 的额外信息。这并不是说 $f^*(X)$ 和 $Y$ 独立（那样表示没有保留标签信息），而是要求 $f^*$ **保留全部与 $Y$ 相关的信息、舍弃无关冗余**。

对分类任务，Bayes 规则是 $f_{\mathrm{Bayes}}(x)=\arg\max_k P(Y=k\mid X=x)$。条件独立说这个后验只通过 $f^*(x)$ 依赖 $x$，因此

$$
\arg\max_k P\bigl(Y=k\mid X=x\bigr)
\;=\;
\arg\max_k P\bigl(Y=k\mid f^*(X)=f^*(x)\bigr).
$$

在 $f^*$ 的值域里做 logistic，和在原始像素里做 Bayes，**风险相同**。这就是「充分」：降维不损失预测能力。

**误区：**

- $X\perp Y\mid f(X)$ 不是 $f(X)\perp Y$。后者叫「表示里没标签信息」。
- 充分性不唯一。恒等映射 $f(x)=x$ 永远充分，但 $\dim$ 没降。SDR 要的是**维数尽量低的充分表示**（中心子空间 / 中心 $\sigma$-域的非线性版）。
- 经验上用有监督损失训出来的网络，最后一层好用，并不自动推出中间层满足条件独立。监督训练通常不对中间特征显式加条件，而 SDR 把需要加的条件明确写为 $X\perp Y\mid f^*(X)$。

### 3.3 预训练 + 微调

从 SDR 视角看迁移学习（Jiao–Lin–Luo–Yang, arXiv:2410.09383；Duan–Jiao–Kang–Yang–Zhou, *Pattern Recognition* 2025），「大模型在源域预训练 → 目标小数据集上微调」的流程可拆为两步：

| 阶段 | 数据 | 核心操作 | 维数 |
|------|------|----------|------|
| 预训练 | 源域大量 $(X,Y)$，或至少大量 $X$ | 学一个好表示 $f$ | 输入 $d$ 很大，输出 $d^*$ 很小 |
| 微调 | 目标域少量带标签样本 | 在 $f(X)$ 上拟合线性 / logistic / 浅层分类器 | 在 $\mathbb{R}^{d^*}$ 内做低维估计 |

**为什么有效：**
若源域与目标域共享语义结构（例如同属自然图像），充分表示 $f^*$ 在两域间高度可迁移。目标样本很少时，无法在 $3072$ 维像素空间估计非参分类器，却可以在低维 $d^*\sim 128$ 中以 $d^*/n_t$ 的线性速率稳健拟合分类头。

SSL 进一步拿掉源域标签 $Y$，转而利用数据增广构造监督信号，下面第 4 节起展开讨论。

---

## 4. 无标签表示：SSL 与数据增广

### 4.1 LeCun 的蛋糕

Yann LeCun 用蛋糕比喻「学习时机器到底吃到多少信息」：

| 层次 | 比喻 | 每个样本给模型的信息 |
|------|------|----------------------|
| 纯强化学习 | 樱桃 | 一个标量奖励，极稀疏 |
| 监督学习 | 糖霜 | 一个类别或几个数，大约 $10$–$10^4$ bits |
| **自监督** | **蛋糕胚** | 预测输入的任意部分、视频的未来帧，可达数百万 bits |

SSL 的野心：标签昂贵，但原始输入自己含有丰富结构；用「预测自己」榨出表示，比等标签划算。

### 4.2 数据增广与正样本对

记增广族

$$
\mathcal{A} \;=\; \{A_\gamma(\cdot):\gamma\in[m]\},
$$

具体变换是预先定好的，例如 RandomCrop、HorizontalFlip、颜色抖动。它们的设计原则是：**尽量不改变语义标签**（猫裁一块还是猫），但像素可以改得很凶。

无标签源样本 $\{x^{(1)},\ldots,x^{(n_s)}\}$。对每一张图独立抽两次增广：

$$
x^{(i)} \;\stackrel{\mathcal{A}}{\longmapsto}\;
\bigl(x^{(i)}_1,\, x^{(i)}_2\bigr)
\;=\;
\bigl(A_{\gamma_1}(x^{(i)}),\, A_{\gamma_2}(x^{(i)})\bigr).
$$

正样本对数据集

$$
D_s \;:=\;
\bigl\{\tilde x^{(i)}:\tilde x^{(i)}=(x^{(i)}_1,x^{(i)}_2)\bigr\}_{i\in[n_s]}.
$$

$(x^{(i)}_1,x^{(i)}_2)$ 叫**正对**：同一图像的两种看法，模型应认为它们「是同一个东西」。不同图像抽出来的视图互为**负对**（SimCLR / MoCo 用；BYOL 等不用）。

**核心直觉：** 虽然没有「猫/狗」标签，但「同一张图的两种合理裁剪与调色在语义上应当相同」本身就是一条弱监督信号；自监督学习就把这条信号写进损失函数。

### 4.3 两个力：增广不变 vs 防崩塌

自监督学习常被概括为：

$$
\text{SSL}
\;\approx\;
\text{clustering aided classification},
$$

原因在于损失设计通常同时包含两种相互制衡的驱动力：

1. **增广不变（类内拉近）。** 正对的表示 $\|f(x_1)-f(x_2)\|$ 要小。同一物体的不同看法走进同一团——这是在做聚类的「连边」。
2. **防止模型崩塌（类间推开）。** 若只有 1，最优解是常数映射 $f\equiv 0$（或 $f\equiv c$）：所有点叠在一起，正对距离确实是 $0$，但表示废了。必须把不同图像推开，或强迫表示的协方差 / 二阶矩不要退化。

按照防崩塌机制的不同，主流方法可分为两条技术路线：

- **有负样本：** 在 encoder 之后，把正样本对拉近，同时把当前样本与其他样本（负样本）推开。SimCLR 的 NT-Xent（下一节）属于这一类，分母里的 $k\neq i$ 项正对应负样本集合。
- **无负样本：** 目标中只显式出现正样本对，转而依靠预测器、滑动平均、白化或方差约束防止特征塌缩。ACT 属于这一类：不使用 NT-Xent 分母，而是通过二阶矩残差罚项 $\|A(f)\|_F^2$ 维持特征各维度不退化。

对应文献（名字对上即可）：

| 有负样本 | 无负样本 |
|----------|----------|
| Ye–Zhang–Yuen–Chang 19 | Grill–Strub–Altché et al. 20（BYOL） |
| He–Fan–Wu–Xie–Girshick 20（MoCo） | Ermolov–Siarohin–Sangineto–Sebe 21（W-MSE） |
| Chen–Kornblith–Norouzi–Hinton 20（SimCLR） | Zbontar–Jing–Misra–LeCun–Deny 21（Barlow Twins） |
| Chen–Fan–Girshick–He 20（MoCo v2） | Bardes–Ponce–LeCun 22（VICReg） |
| HaoChen–Wei–Gaidon–Ma 21（谱对比） | HaoChen–Wei–Kumar–Ma 22 |

崩塌的极简计算：若 $f(x)=c$ 对所有 $x$，则任何「正对距离」损失都是 $0$。有负样本时，$c$ 与 $c$ 的相似度也最大，分母爆炸或 logit 无对比，常数不再最优。无负样本时必须另加「表示不能退化」的约束——Barlow 让交叉相关阵 $\approx I$，VICReg 管方差和协方差，ACT 用对抗项让二阶矩 $\approx I$。

---

## 5. SimCLR 与 NT-Xent

### 5.1 算法在干什么

SimCLR（Chen–Kornblith–Norouzi–Hinton, ICML 2020）是「有负样本」的代表。流程：

1. 一个 minibatch 抽 $N$ 张图，每张做两次增广，得到 $2N$ 个视图；
2. 共享的 encoder $f$（ResNet）给出表示 $h=f(x)$；
3. 再过一个小的投影头 $g$（MLP），$z=g(h)$。对比损失加在 $z$ 上；下游分类常用 $h$（投影头可以扔掉）；
4. 对每个正对，把 batch 里其余 $2N-2$ 个视图当负样本。

经验事实：ImageNet 上线性探测的 Top-1 可以和有监督 ResNet-50 接近；只用 $1\%$ 标签微调时，Top-5 超过 AlexNet。理论工作把这件事看成「总体层的聚类辅助分类」或「样本层的参数模型」（Arora et al., 2019；HaoChen et al., 2021/22/23；Huang–Yi–Zhao–Jiang, 2023；Lei–Yang–Ying–Zhou, 2023）。要同时兼具良好经验性能与端到端理论保证，正是 ACT 提出的主要动机。

### 5.2 NT-Xent 损失

SimCLR 属于有负样本的对比路线：**将正样本对拉近，同时与同批次中的其他视图（负样本）推开**。NT-Xent 的分母正是这些负样本；缺少这一分母就退化成只有正样本对齐项，常数映射会把损失直接降到 $0$。后文第 6 节的 ACT 不采用这一分母，而是改用二阶矩对抗项防止崩塌。

记 $\mathrm{sim}$ 为余弦相似度

$$
\mathrm{sim}(u,v)
\;=\;
\frac{\langle u,v\rangle}{\|u\|_2\|v\|_2}.
$$

对一个正对 $(z_i,z_j)$（同一图像的两个投影），**Normalized Temperature-scaled Cross-Entropy（NT-Xent）** 是

$$
\ell_{i,j}
\;=\;
-\log
\frac{\exp\bigl(\mathrm{sim}(z_i,z_j)/\tau\bigr)}
{\sum_{k\neq i}\exp\bigl(\mathrm{sim}(z_i,z_k)/\tau\bigr)}.
$$

分母中的 $k$ 跑遍当前对比集合里除自己以外的所有视图（若 minibatch 有 $N$ 张原图、共 $2N$ 个增广视图 $z$，分母含 $2N-1$ 项），最终损失对每个正样本对的两个对称方向 $(i,j)$ 与 $(j,i)$ 取平均。

**本质等价于带温度的 softmax 交叉熵：** 把「认出谁是我的正样本」当成一个 $2N-1$ 类分类问题，正样本是唯一正确类。分子大、分母里负样本的贡献小，损失才小。

### 5.3 温度 $\tau$ 的作用

$\tau>0$ 把相似度除完再送进 softmax。

- $\tau\to 0^+$：softmax 越来越尖。只有「当前最像的几个」还有梯度，模型被迫处理**难负样本**（和锚点很像但不是同一张图的视图）。太小会训飘。
- $\tau$ 太大：$\mathrm{sim}/\tau$ 都接近 $0$，正负差被抹平，拉近 / 推开的信号都弱。
- SimCLR 在常用设定下多取 $\tau\approx 0.5$（ImageNet 等大数据集上常取更小值如 $0.1\text{–}0.2$）。余弦值落在 $[-1,1]$，除以 $\tau$ 后进入指数函数，可有效放大正负样本对得分差距。

**对齐–均匀分解（Wang–Isola, 2020）：** 把 $-\ell_{i,j}$ 拆开，分子是正对对齐 $\mathrm{sim}(z_i,z_j)/\tau$；分母的 $\log\sum\exp$ 鼓励 $z_i$ 不要和所有人（含负样本）都像，在超球面上接近均匀，正好对应第 4.3 节的两种驱动力。

**误区：** 分母包含正样本自己那一项 $\exp(\mathrm{sim}(z_i,z_j)/\tau)$，但不包含 $k=i$ 的自相似度（那一项恒为 $1$，没有信息）。常数映射下所有 $\mathrm{sim}=1$，$\ell_{i,j}=\log(2N-1)$：有 $2N-2$ 个负样本时这个值是 $\log(\text{对比集大小})$，与表示内容无关，**常数不再是最优**（任何把正对相似度抬到负对之上的 $f$ 都会更小）。若没有负样本，分母只剩正对自己，$\ell_{i,j}=0$，常数映射赢——这就是必须走「有负样本」或「另加防崩塌」两条路的原因。NT-Xent 属于前者；ACT / BYOL / Barlow / VICReg 属于后者。

---

## 6. ACT 模型

Adversarial Contrastive Training（Duan–Jiao–Lin–Ma–Yang, NeurIPS 2025）走无负样本路线，但把防崩塌写成一个**对二阶矩残差的对抗 / IPM 问题**，以便直接借用 GAN 的经验过程误差分析框架（见[生成学习与 LLM](/blog/fods-generative-learning-llm/)）。

### 6.1 总体想法

只要正对距离：

$$
\|f(x_1)-f(x_2)\|_2^2
$$

会崩塌。Barlow Twins 的修补是让交叉相关阵接近 $I$。ACT 把「接近 $I$」写成与矩阵判别器 $G$ 的 Frobenius 内积，然后 $\min_f\max_G$：判别器拼命找二阶矩和 $I$ 的差距，encoder 拼命消灭这个差距，同时保持增广不变。

### 6.2 经验极小极大问题

函数类（网络结构记号沿用[逼近误差](/blog/fods-approximation-error/)）：

$$
\mathcal{F}
\;=\;
\bigl\{
f_\theta\in\mathrm{NN}_{d_1,d_2}(W,L,K_{\mathrm{nn}})
:\
B_1\le \|f_\theta\|_2 \le B_2
\bigr\}.
$$

- $d_1=d$ 输入维，$d_2=d^*$ 表示维；
- $W$ 宽、$L$ 深、$K_{\mathrm{nn}}$ 非零参数个数（这里专记作 $K_{\mathrm{nn}}$，以与下文类别数 $K$ 区分）；
- $B_1\le\|f\|_2\le B_2$：表示既不能缩成 $0$，也不能爆掉。常在球壳上。

经验损失（展开为对齐项与二阶矩对抗项）：

$$
\widehat L(f,G)
\;:=\;
\frac1{n_s}\sum_{i=1}^{n_s}
\Big[
\underbrace{\bigl\|f(x^{(i)}_1)-f(x^{(i)}_2)\bigr\|_2^2}_{\text{对齐 / 增广不变}}
+
\lambda
\bigl\langle
f(x^{(i)}_1)f(x^{(i)}_2)^\top - I_{d^*},\;
G
\bigr\rangle_F
\Big].
$$

Frobenius 内积 $\langle A,G\rangle_F=\sum_{ab}A_{ab}G_{ab}=\mathrm{tr}(A^\top G)$。判别器的可行集依赖 $f$：

$$
\widehat{\mathcal{G}}(f)
\;:=\;
\Bigl\{
G\in\mathbb{R}^{d^*\times d^*}
:\
\|G\|_F
\le
\Bigl\|
\frac1{n_s}\sum_{i=1}^{n_s} f(x^{(i)}_1)f(x^{(i)}_2)^\top
- I_{d^*}
\Bigr\|_F
\Bigr\}.
$$

学到的 encoder

$$
\widehat f
\;\in\;
\arg\min_{f\in\mathcal{F}}
\max_{G\in\widehat{\mathcal{G}}(f)}
\widehat L(f,G).
$$

总体版把平均换成期望：$L(f,G)=\mathbb{E}_{D_s}[\widehat L(f,G)]$，$\mathcal{G}(f)$ 里的经验二阶矩换成 $\mathbb{E}_x\mathbb{E}_{x_1,x_2\in\mathcal{A}(x)}[f(x_1)f(x_2)^\top]$。

### 6.3 内层 $\max_G$ 如何强迫二阶矩接近 $I$

上式中的判别器可行集有时也简记作 $\widehat G(f)$，其完整集合就是 $\widehat{\mathcal{G}}(f)=\{G\in\mathbb{R}^{d^*\times d^*}:\|G\|_F\le\|A(f)\|_F\}$，其中

$$
A(f)
\;:=\;
\frac1{n_s}\sum_{i=1}^{n_s} f(x^{(i)}_1)f(x^{(i)}_2)^\top
\;-\;
I_{d^*}.
$$

把求和与内积交换（$G$ 对 $i$ 是同一个）：

$$
\widehat L(f,G)
\;=\;
\frac1{n_s}\sum_i \|f(x^{(i)}_1)-f(x^{(i)}_2)\|_2^2
\;+\;
\lambda
\langle A(f),\, G\rangle_F.
$$

第一项不含 $G$。内层只剩

$$
\max_{G\in\widehat{\mathcal{G}}(f)}\langle A(f),G\rangle_F
=
\max_{\|G\|_F\le\|A(f)\|_F}\langle A,G\rangle_F.
$$

Frobenius 是 Hilbert 内积，Cauchy–Schwarz：$\langle A,G\rangle_F\le\|A\|_F\|G\|_F$，等号当且仅当 $G=\tau A$ 且 $\tau\ge 0$。约束 $\|G\|_F\le\|A\|_F$ 把 $\tau\|A\|_F\le\|A\|_F$ 压成 $\tau\le 1$。于是最大值在 $G^*=A$（$A=0$ 时任意 $G=0$）达到，值为 $\|A\|_F^2$。

**为什么把球半径取成 $\|A\|_F$ 而不是 $1$。** 若 $\|G\|_F\le 1$，内层 max 是 $\|A\|_F$，罚的是残差的范数；半径取 $\|A\|_F$ 时罚的是残差的平方，与 Barlow Twins 的 $\|C-I\|_F^2$ 同型，且仍保持 $\sup_G\langle A,G\rangle$ 的 IPM 结构，便于直接套用 GAN 的经验过程工具。两者都能防止崩塌，ACT 采用了后者。

因此内层最大化之后，ACT 等价于（对 $f$）最小化

$$
\frac1{n_s}\sum_i \bigl\|f(x^{(i)}_1)-f(x^{(i)}_2)\bigr\|_2^2
\;+\;
\lambda
\Bigl\|
\frac1{n_s}\sum_i f(x^{(i)}_1)f(x^{(i)}_2)^\top
- I_{d^*}
\Bigr\|_F^2.
$$

总体版把 $A(f)$ 换成 $\mathbb{E}_x\mathbb{E}_{x_1,x_2\in\mathcal{A}(x)}[f(x_1)f(x_2)^\top]-I_{d^*}$，同一套 Cauchy–Schwarz，$\max_{G\in\mathcal{G}(f)}L(f,G)$ 仍是对齐项 $+\lambda\|A_{\mathrm{pop}}(f)\|_F^2$。

目标函数里的两项各有分工：

- 第一项：同一张图的两种增广，表示要近（类内拉近）；
- 第二项：两种增广的**跨视图二阶矩**要接近单位阵。对角 $\approx 1$：每个坐标都有能量，不能整张图缩成 $0$；非对角 $\approx 0$：不同坐标别高度相关，不能所有质量塌进一条直线。这和 Barlow Twins / VICReg 的白化是亲戚，但写成 $\min\max$ 之后，均匀偏差可以用 GAN / IPM 的经验过程控制。

崩塌检查：

- $f\equiv 0$：$A=-I$，$\|A\|_F=\sqrt{d^*}$，第二项是 $\lambda d^*$，不优；
- $f\equiv v$（常数向量）：$A=vv^\top-I$。$d^*>1$ 时秩一矩阵减单位阵不可能是 $0$；
- 所有表示落在一个低维子空间：$A+I$ 秩亏，$\|A\|_F$ 有一块下界。

所以「对齐 + 二阶矩 $\approx I$」同时实现第 4.3 节的两个力，而且**不需要负样本**。

<figure>
  <img src="/figures/fods-contrastive-alignment.svg" width="800" height="280" alt="单位圆上常数塌缩、低维共线塌缩与对齐加各向同性二阶矩分布三种表征状态对比">
  <figcaption>从左到右读出两股约束的合力：只压近正样本对会让点簇聚到单点或一条线上，加上二阶矩逼近单位阵后，不同语义簇才会沿正交方向张开。</figcaption>
</figure>

为什么还要写成 $\min\max$ 而不是直接罚 $\|A\|_F^2$？因为 $\|A\|_F^2=\sup_{\|G\|_F\le\|A\|_F}\langle A,G\rangle_F$ 是一种 IPM；经验过程、逼近与优化分析都可以直接沿用 GAN 分析框架（见[生成学习与 LLM](/blog/fods-generative-learning-llm/)，文献见 Huang–Jiao–Li–Liu–Wang–Yang, JMLR 2022；Jiao–Wang–Yang, ACHA 2023）。直接平方罚当然也能训练，但端到端误差界对这种 min-max 形式最为现成。

---

## 7. 预测规则 $Q_{\widehat f}$ 与测试误差

表示 $\widehat f$ 在**无标签源域**上训好。下游是**带标签的目标域**（可以很少）：

$$
D_t
\;=\;
\bigl\{
(\tilde z^{(i)}, y_i):\
\tilde z^{(i)}=(z^{(i)}_1,z^{(i)}_2)
\bigr\}_{i\in[n_t]},
$$

每个目标样本同样做两次增广。类别 $k\in[K]$，$n_t(k)=\mathrm{card}\{i:y_i=k\}$。

### 7.1 类均值线性头

目标域只有 $n_t$ 个带标签样本，每个同样抽两次增广。第 $k$ 类的个数 $n_t(k)=\mathrm{card}\{i:y_i=k\}$，该类一共贡献 $2n_t(k)$ 个表示向量

$$
\bigl\{\widehat f(z^{(i)}_1),\;\widehat f(z^{(i)}_2):y_i=k\bigr\}.
$$

经验类均值矩阵行向量 $\widehat W(k,:)$（分母的 $2n_t(k)$ 来自两个增广视图全部计入）：

$$
\widehat\mu_k
\;=\;
\widehat W(k,:)
\;=\;
\frac1{2n_t(k)}
\sum_{i=1}^{n_t}
\bigl(\widehat f(z^{(i)}_1)+\widehat f(z^{(i)}_2)\bigr)
\mathbf{1}_{\{y_i=k\}}.
$$

$\widehat W\in\mathbb{R}^{K\times d^*}$ 的第 $k$ 行 $\widehat W(k,:)$ 就是 $\widehat\mu_k$（行向量）。查询 $z$ 的线性得分向量是

$$
\widehat W\,\widehat f(z)
\;=\;
\bigl(\langle\widehat\mu_1,\widehat f(z)\rangle,\;\ldots,\;\langle\widehat\mu_K,\widehat f(z)\rangle\bigr)^\top,
$$

故

$$
Q_{\widehat f}(z)
\;=\;
\arg\max_{k\in[K]}
\bigl(\widehat W\,\widehat f(z)\bigr)_k
\;=\;
\arg\max_{k\in[K]}
\bigl\langle \widehat\mu_k,\, \widehat f(z)\bigr\rangle.
$$

**为什么用内积而非重新训练 logistic 头：** 表示若已按类成团，类均值就是原型（prototype）。由于 $\mathcal{F}$ 把 $f$ 限制在球壳 $B_1\le\|f\|_2\le B_2$ 上，$\|\widehat f(z)\|_2$ 变化有限：

$$
\bigl\|\widehat f(z)-\widehat\mu_k\bigr\|_2^2
=
\|\widehat f(z)\|_2^2+\|\widehat\mu_k\|_2^2-2\langle\widehat\mu_k,\widehat f(z)\rangle.
$$

因为 $\|\widehat f(z)\|^2$ 与类别 $k$ 无关，且二阶矩 $\approx I$ 配合源域剖分条件（第 9.5 节）使各类均值能量接近，于是 $\arg\max_k\langle\widehat\mu_k,\widehat f(z)\rangle$ 与最近类均值 $\arg\min_k\|\widehat f(z)-\widehat\mu_k\|$ 基本一致，在表示空间中将平面划分为 $K$ 个 Voronoi 锥。

参数个数只有 $K\cdot d^*$，而且是样本均值、没有迭代。类均值用了 $2n_t(k)$ 个有界向量，随 $n_t(k)$ 集中，相应的样本平均失效概率上界为 $O(d^*/\sqrt{\min_k n_t(k)})$，说明少样本微调主要受限于每类标注数目。

**轻量下游适应的依据：** 表示本身已将同类聚集并拉开异类时，仅靠类均值原型便足够完成划分，这也对应前面「微调是在低维空间拟合简洁参数模型」的思路。

### 7.2 测试误差

记 $C_t(k)$ 为目标域第 $k$ 类的支撑（「第 $k$ 类的点住在哪」），$P_t$ 为目标分布。

$$
\mathrm{Err}(Q_{\widehat f})
\;=\;
\sum_{k=1}^K
P_t\bigl(
Q_{\widehat f}(z)\neq k,\;
z\in C_t(k)
\bigr).
$$

若 $\{C_t(k)\}_{k=1}^K$ 剖分了目标支撑，这就是普通分类错误率。若有些点不属于任何类区域（离群），它们不计入 $\mathrm{Err}$。第 9 节的 $(1-\sigma_t)$ 来自「核心以外的质量可以错」。

---

## 8. 实验表现对照

下表汇总对比各方法在 CIFAR-10、CIFAR-100 与 Tiny ImageNet 上同一套复现设定的线性探测与 5-NN 准确率（引自 ACT 论文实验结果）：

| Method | CIFAR-10 linear | CIFAR-10 5-NN | CIFAR-100 linear | CIFAR-100 5-NN | Tiny ImageNet linear | Tiny ImageNet 5-NN |
|--------|----------------:|--------------:|-----------------:|---------------:|---------------------:|-------------------:|
| SimCLR | 91.80 | 88.42 | 66.83 | 56.56 | 48.84 | 32.86 |
| BYOL | 91.73 | 89.45 | 66.60 | 56.82 | **51.00** | 36.24 |
| W-MSE 2 | 91.55 | 89.69 | 66.10 | 56.69 | 48.20 | 34.16 |
| W-MSE 4 | 91.99 | 89.87 | 67.64 | 56.45 | 49.20 | 35.44 |
| Barlow Twins | 83.96 | 81.18 | 56.75 | 47.91 | 41.80 | 33.60 |
| VICReg | 87.16 | 85.10 | 56.63 | 49.59 | 40.04 | 30.46 |
| HaoChen22 | 86.95 | 82.83 | 53.75 | 48.40 | 35.80 | 20.36 |
| **ACT (our repro.)** | **92.11** | **90.01** | **68.24** | **58.35** | 49.72 | **36.40** |

读表可见：ACT 在 CIFAR-10 与 CIFAR-100 上表现领先；Tiny ImageNet 线性探测略低于 BYOL（51.00 vs 49.72），5-NN 最高。重点在于**这种具备端到端理论保证的极小极大目标，经验性能同样达到与 SimCLR / BYOL 相当的一线水平**（代码实现参考 `https://github.com/vincen-github/Adversarial-Contrastive-Training`）。

---

## 9. ACT 误差分析：假设的直观解释与形式化

定理解读之前需明确四组结构假设，下面逐条将直觉翻译成严格记号。记 $f^*$ 为总体极小极大问题的解（满足 $B_1\le\|f\|_2\le B_2$），$f^*_i$ 为其第 $i$ 个坐标，$i\in[d^*]$。

### 9.1 Hölder 光滑

**直观含义：** 理想编码器的每个输出分量都要足够「平缓」，不能是剧烈高频振荡函数，才能由 ReLU 网络以可控规模高精度逼近。

**形式记号：** $f^*_i\in\mathcal{H}^\alpha$（Hölder-$\alpha$ 类：直到阶 $\lfloor\alpha\rfloor$ 的导数存在，余项有指数 $\alpha-\lfloor\alpha\rfloor$ 的 Hölder 条件）。$\alpha$ 越大越光滑，越容易逼近。

### 9.2 源域 / 目标域在每一类上 $W_1$ 接近

**直观含义：** 无标签源域和有标签目标域不必同分布，但**每一类内部**不能相差太远——把源域的「狗」分布搬运到目标域的「狗」分布，平均传输距离不超过 $\epsilon_{\mathrm{ds}}$，且各类先验占比接近（属于温和的协变量或领域偏移）。

**形式记号：** $C_s(k),C_t(k)$ 为源 / 目标第 $k$ 类支撑，

$$
P_s(k)(\cdot)=P(\cdot\mid x\in C_s(k)),
\quad
P_t(k)(\cdot)=P(\cdot\mid z\in C_t(k)),
$$

$$
p_s(k)=P(x\in C_s(k)),
\quad
p_t(k)=P(z\in C_t(k)).
$$

要求

$$
\max_{k\in[K]} W_1\bigl(P_s(k),P_t(k)\bigr)\le\epsilon_{\mathrm{ds}},
\qquad
\max_{k\in[K]}\bigl|p_s(k)-p_t(k)\bigr|\le\epsilon_{\mathrm{ds}}.
$$

$W_1$：最优搬运方案下，把一堆沙子（源类条件分布）搬成另一堆（目标类条件）的平均距离。

### 9.3 增广 Lipschitz

**直观含义：** 裁剪、翻转、调色等增广不能把两张原本相近的图撕开得太远，否则「增广不变」在输入像素空间没有几何基础，表示空间也学不到连续的簇。

**形式记号：** 任意 $A_\gamma\in\mathcal{A}$，任意 $u_1,u_2\in[0,1]^d$，

$$
\|A_\gamma(u_1)-A_\gamma(u_2)\|_2 \le M\|u_1-u_2\|_2.
$$

### 9.4 核心集 $C^*$：一类里「够典型、且能被增广粘住」的部分

**直观含义：** 不要求每一类的所有图像都长得相像，允许存在少量难识别的边缘样本，但必须存在一块**高密度核心**：

- 核心占该类质量的至少 $\sigma_s$（源）或 $\sigma_t$（目标），$\sigma$ 接近 $1$ 最好；
- 核心里任意两张图，都能各自做一个增广，使得两个增广视图在输入空间里很近（直径 $\le\delta_s$ 或 $\delta_t$）。

第二点是「增广图连通」：核心里的样本可以被正对一条条串成一团，对比学习才会把它收成一个簇。目标域全部核心的总质量还要 $\ge\sigma_t$——定理里那块 $1-\sigma_t$ 就是允许边角样本分错的错误率上界。

**形式记号：** 对每个 $k$，存在 $C^*_s(k)\subseteq C_s(k)$、$C^*_t(k)\subseteq C_t(k)$，使得

$$
P_s\bigl(x\in C^*_s(k)\bigr)
\ge
\sigma_s\, P_s\bigl(x\in C_s(k)\bigr),
\quad
P_t\bigl(z\in C^*_t(k)\bigr)
\ge
\sigma_t\, P_t\bigl(z\in C_t(k)\bigr),
$$

其中 $\sigma_s,\sigma_t\in(0,1]$。定义增广直径为集合尺度上的全局上确界

$$
d_{\mathcal{A},C}
\;:=\;
\sup_{u_1,u_2\in C}
\min_{\substack{u_1'\in\mathcal{A}(u_1)\\ u_2'\in\mathcal{A}(u_2)}}
\|u_1'-u_2'\|_2,
$$

要求 $d_{\mathcal{A},C^*_s(k)}\le\delta_s$，$d_{\mathcal{A},C^*_t(k)}\le\delta_t$，并且

$$
P_t\Bigl(\bigcup_{k=1}^K C^*_t(k)\Bigr)\ge\sigma_t.
$$

（注意 $d_{\mathcal{A},C}$ 只依赖于集合 $C$ 与增广族 $\mathcal{A}$，度量核心中最远两点经过最佳增广配对后的最小距离。）

### 9.5 源域的剖分与质量平衡

**直观含义：** 源域可以切分成 $d^*$ 块（块数等于表示维数），每一块都占有不可忽略的概率质量，既不能过空也不能某块独大。这样「二阶矩 $\approx I$」才与「大约 $d^*$ 个正交方向模式」自洽。

**形式记号：** 存在 $X_s$ 的剖分 $\{P_1,\ldots,P_{d^*}\}$，使得对每个 $i\in[d^*]$，

$$
\frac1{B_2^2}
\;\le\;
P_s(P_i)
\;\le\;
\frac1{B_1^2},
$$

其中 $B_1,B_2$ 正是网络输出范数 $\|f\|_2$ 的上下界参数。

---

## 10. 定理与证明骨架

### 10.1 定理（Duan–Jiao–Lin–Ma–Yang, NeurIPS 2025）

在第 9 节假设下，取网络

$$
W \;\gtrsim\;
n_s^{\frac{2d+\alpha}{4(\alpha+d+1)}},
\qquad
L \;\ge\; 2\bigl\lceil\log_2(d+r)\bigr\rceil+2,
\qquad
K_{\mathrm{nn}}
\;=\;
n_s^{\frac{d+1}{2(\alpha+d+1)}},
$$

则以下事件的概率至少是

$$
\sigma_s
\;-\;
O\Bigl(n_s^{-\frac{\alpha}{16(\alpha+d+1)}}\Bigr)
\;-\;
\epsilon(\epsilon_{\mathrm{ds}},\delta_t,\delta_s)
\;-\;
O\Bigl(\frac{d^*}{\sqrt{\min_k n_t(k)}}\Bigr)
$$

时，有

$$
\mathbb{E}_{D_s}\bigl[\mathrm{Err}(Q_{\widehat f})\bigr]
\;\le\;
(1-\sigma_t)
\;+\;
O\Bigl(n_s^{-\frac{\alpha}{8(\alpha+d+1)}}\Bigr).
$$

这里 $r$ 是 Hölder 阶 $\alpha$ 对应的 Taylor 次数一类的量（见[逼近误差](/blog/fods-approximation-error/)中关于 $x^2$、乘积与局部多项式逼近的深度要求 $\log_2(d+r)$）。$\epsilon(\epsilon_{\mathrm{ds}},\delta_t,\delta_s)$ 随源–目标 $W_1$ 间隙和增广直径趋于 $0$。

**定理结论解读：**

- $(1-\sigma_t)$：目标域核心以外区域不作保证，相应质量直接计入误差项；数据较规整时 $\sigma_t\approx 1$，这一项趋近 $0$。
- $O(n_s^{-\alpha/(8(\alpha+d+1))})$：无标签源样本学习表示的收敛速率。指数同时依赖光滑阶 $\alpha$ 与输入维 $d$；分母多出的常数因子来自极小极大对抗结构带来的额外估计复杂度。
- 概率下界中的 $\sigma_s$：源域核心必须占主导质量，正对增广边才能连通成簇。
- $d^*/\sqrt{\min_k n_t(k)}$：目标域采用类均值分类器，只要表示学好，少样本（few-shot）微调的误差只依赖每类的少数标注样本量 $n_t(k)$。
- 网络宽度 $W$ 随 $n_s$ 多项式增长、深度仅对数增长，完全匹配 ReLU 网络逼近 Hölder 函数类的规模配置。

简言之，只要数据具备足够的类内聚类规整度（$\sigma_s,\sigma_t\approx 1$ 且 $\epsilon\approx 0$）且无标签样本量 $n_s$ 充分大，**ACT 仅凭极少的目标域标注样本就能获得很低的下游分类误差**。

### 10.2 证明骨架：对比 → 聚类 → 分类

完整证明涉及较大篇幅的技术引理，核心思路可以串成一条四步因果链（沿用 Huang–Yi–Zhao–Jiang 2023 的「对比即聚类辅助分类」思想与 GAN / IPM 经验过程分析，见 Huang–Jiao–Li–Liu–Wang–Yang JMLR 2022；Jiao–Wang–Yang ACHA 2023）。下面追踪每一步的误差传递。

记总体对齐误差 $\varepsilon_{\mathrm{ic}}(f)=\mathbb{E}\|f(x_1)-f(x_2)\|_2^2$，二阶矩残差 $A(f)=\mathbb{E}[f(x_1)f(x_2)^\top]-I_{d^*}$。$f$ 落在球壳上，其 Lipschitz 常数记为 $L_f$（对理想 $f^*$ 来自 $\mathcal{H}^\alpha$，对网络估计 $\widehat f$ 来自权界）。

**（i）对齐损失小 $\Rightarrow$ 增广几乎等距。**
当 $\varepsilon_{\mathrm{ic}}(f)$ 较小时，同一张图的两次增广视图在表示空间中的距离处于 $\sqrt{\varepsilon_{\mathrm{ic}}}$ 量级；结合 Markov 不等式，核心集上偏离较大的少数坏点可以一并归入 $(1-\sigma_s)$ 项中。

再结合增广算子的 Lipschitz 性质与核心集直径界 $d_{\mathcal{A},C^*_s(k)}\le\delta_s$：对任意 $u,v\in C^*_s(k)$，存在增广视图 $u'\in\mathcal{A}(u)$ 与 $v'\in\mathcal{A}(v)$ 满足 $\|u'-v'\|\le\delta_s$，因而 $\|f(u')-f(v')\|_2 \le L_f\delta_s$。

$u'$ 与 $u$ 的其他增广视图同属一张图，对齐项再将 $\|f(u')-\widetilde f(u)\|$ 控制在 $\sqrt{\varepsilon_{\mathrm{ic}}}$ 量级。由三角不等式得：

$$
\mathrm{diam}\bigl(f(C^*_s(k))\bigr)
\;\lesssim\;
\sqrt{\varepsilon_{\mathrm{ic}}(f)}+L_f\delta_s.
$$

同一类核心在表示空间中因此聚集为一个紧凑的小团：输入空间的增广连通性被直接转化为特征空间的类内紧致性。

**（ii）几乎等距 + 二阶矩 $\approx I$ $\Rightarrow$ 源类线性可分。**
当 $\|A(f)\|_F$ 较小时，跨视图二阶矩接近单位阵，保证了各个表示坐标均有显著能量，不会全部坍缩到单点或低维子空间。配合第 9.5 节的源域剖分条件，约 $d^*$ 个正概率模式会分别对应到彼此近乎正交的方向上。

若不同类的核心都已经聚成直径不超过 $\rho_s\lesssim\sqrt{\varepsilon_{\mathrm{ic}}}+L_f\delta_s$ 的紧团，而各团均值的间距保持 $\Theta(1)$（白化后的归一化尺度），那么只要 $\rho_s$ 小于均值间距的一半，源域核心之间就存在严格正间隔 $\gamma>0$：对 $x\in C^*_s(k)$ 与 $\ell\neq k$，总有

$$
\langle\mu_s(k)-\mu_s(\ell),\,f(x)\rangle
\;\ge\;
\gamma.
$$

常数映射、全体塌成一类，都会让 $\|A(f)\|_F$ 有一块下界（第 6.3 节崩塌检查），与「ACT 损失接近最优」矛盾。

**（iii）源类可分 $+$ $W_1$ 小 $\Rightarrow$ 团迁到目标。**
$f$ 是 $L_f$-Lipschitz，$W_1$ 在 Lipschitz 函数下收缩：

$$
W_1\bigl(f_{\sharp}P_s(k),\,f_{\sharp}P_t(k)\bigr)
\;\le\;
L_f\,W_1\bigl(P_s(k),P_t(k)\bigr)
\;\le\;
L_f\epsilon_{\mathrm{ds}}.
$$

类均值最多移动 $L_f\epsilon_{\mathrm{ds}}$；目标核心直径再被 $\delta_t$ 同样控制。因此 $C^*_t(k)$ 落在源团 $f(C^*_s(k))$ 的 $L_f(\epsilon_{\mathrm{ds}}+\delta_t)$ 邻域里。只要这个邻域还小于 $\gamma/2$，目标核心仍然落在第 $k$ 个 Voronoi 锥里。$\epsilon(\epsilon_{\mathrm{ds}},\delta_t,\delta_s)$ 收集的就是「邻域把间隔吃掉」的那一项；$\epsilon_{\mathrm{ds}},\delta_t,\delta_s\to 0$ 时它 $\to 0$。

**（iv）团在目标上 $\Rightarrow$ 类均值分类器误差。**
把误差劈成核心以外 + 核心以内：

$$
\mathrm{Err}(Q_{\widehat f})
\;\le\;
\underbrace{1-\sigma_t}_{\text{边角料，定理不保证}}
+
\sum_k P_t\bigl(Q_{\widehat f}(z)\neq k,\; z\in C^*_t(k)\bigr).
$$

核心以内：真均值 $\mu_t(k)$ 已分得开（iii）。经验均值 $\widehat\mu_k$ 是 $2n_t(k)$ 个有界向量的平均，偏离过大时会把间隔吃掉。这部分的集中概率误差被统一计入概率界中的 $O(d^*/\sqrt{\min_k n_t(k)})$ 项。

剩下的是「$\widehat f$ 有多接近总体 $f^*$」：$\varepsilon_{\mathrm{ic}}(\widehat f)$ 与 $\|A(\widehat f)\|_F$ 必须小到（i）（ii）能用。这一步拆成全局分解的那三块：

| 误差 | 在 ACT 里是什么 | 用什么工具 |
|------|-----------------|------------|
| 统计 | $\sup_{f,G}|L-\widehat L|$，min-max 的均匀偏差 | GAN / IPM 经验过程（覆盖数、Rademacher；见[统计误差](/blog/fods-statistical-error/)与[生成学习与 LLM](/blog/fods-generative-learning-llm/)） |
| 逼近 | 网络类 $\mathcal{F}$ 够不够贴 $f^*\in(\mathcal{H}^\alpha)^{d^*}$ | ReLU 逼近 Hölder，深度 $\log(d+r)$，宽度随 $n_s$ 增长（见[逼近误差](/blog/fods-approximation-error/)） |
| 优化 | $\widehat f$ 是否真是经验 min-max | 分析里当作近似 ERM；实践中交替梯度 |

代入前面定理设定的网络规模 $W,L,K_{\mathrm{nn}}$，这一段贡献 $O(n_s^{-\alpha/(8(\alpha+d+1))})$（概率项中的衰减指数再折半为 $16$）。

**超额风险的形态没变，变的是损失是对比项 + 二阶矩 IPM，而不是 $\ell(\text{线性}(X),Y)$。**

速率指数 $\alpha/(8(\alpha+d+1))$ 比经典非参回归的 $\alpha/(2\alpha+d)$ 更慢，因为多了一层对抗和「先聚类再分类」的传递。这不是缺陷，而是无标签表示学习的典型权衡：用大量无标签源域样本 $n_s$ 换掉了高维输入上直接做有监督非参回归的维数灾难。

---

## 11. Distribution Matching

ACT 的防崩塌是「二阶矩 $\approx I$」，仍然是防御性的：告诉你别塌，但没说表示的分布**应该长成什么样**。Distribution Matching（Jiao–Ma–Sun–Wang–Wang, arXiv:2502.14424）把目标改成：**一边增广不变，一边让 $f$ 推出的分布去贴一个事先画好的参考分布 $R$。**

### 11.1 参考分布：概念高斯混合

在半径约 $1$ 的超球面上放 $K'$ 个几乎正交的中心 $c_i$（可取带符号的标准基向量）。第 $i$ 个概念不是一个点，而是中心附近一小团：把各向同性高斯方向加到 $c_i$ 上再归一化，得到概念混合分布：

$$
R
\;=\;
\sum_{i=1}^{K'}
P_i\,\mathbf{1}(C=i)
\;=\;
\sum_{i=1}^{K'}
\frac{
c_i + \varepsilon\,\gamma_{d^*}/\|\gamma_{d^*}\|_2
}{
\bigl\|
c_i + \varepsilon\,\gamma_{d^*}/\|\gamma_{d^*}\|_2
\bigr\|_2
}\,\mathbf{1}(C=i),
$$

其中 $\gamma_{d^*}\sim N(0,I_{d^*})$，$\varepsilon$ 控制团的半径，$C$ 是概念指示（通常均匀，$P(C=i)=1/K'$）。

**几何直观：** 期望表示空间呈现出「球面上 $K'$ 朵彼此分离的小云」。$K'$ 是**概念数**，不是下游类别数 $K$——例如一朵云对应「侧卧的虎斑猫」，下游分类头再把若干概念云聚合成标签「猫」；高斯方向噪声则把中心点平滑涂开成超球面上的一块小帽。

### 11.2 总体损失：对齐 + $W_1$

$P_f$ 是把增广后的数据经 $f$ 推到表示空间的分布（pushforward $f_{\sharp}P_{\mathcal{A}}$）。总体目标

$$
f^*
\;\in\;
\arg\min_{f\in\mathcal{F}}
L(f)
\;:=\;
L_{\mathrm{ic}}(f) + \lambda\, W_1(P_f, P_R).
$$

类内对齐项（invariance / intra-class loss，$L_{\mathrm{ic}}$）：

$$
L_{\mathrm{ic}}(f)
\;=\;
\mathbb{E}_x\mathbb{E}_{x_1,x_2\in\mathcal{A}(x)}
\bigl\|f(x_1)-f(x_2)\bigr\|_2^2.
$$

$W_1$ 的 Kantorovich–Rubinstein 对偶（以 Lipschitz-1 函数为判别器，属于[生成学习与 LLM](/blog/fods-generative-learning-llm/)中的 IPM 框架）给出：

$$
W_1(P_f,P_R)
\;=\;
\sup_{g\in\mathrm{Lip}(1)}
\Bigl[
\mathbb{E}_{Z\sim P_f} g(Z)
-
\mathbb{E}_{R\sim P_R} g(R)
\Bigr].
$$

（有的文本把两个期望对调，那只差一个符号，$\sup$ 变成对 $-g$ 即可。）于是 DM 也是一个 encoder–critic 的 min-max，和 WGAN 同型，只是方向反了：生成模型把简单先验推成复杂数据；DM 把复杂数据推进简单的概念混合。

### 11.3 为什么比「硬聚类成 $K$ 类」弱

硬聚类 / 硬原型会要求：表示空间恰好 $K$ 个团，并且团 = 下游类。这很强：

- 预训练时往往并不知道具体的下游类别数 $K$，更没有类名；
- 一个类内部本来就有多个概念（CIFAR-100 的「狗」含许多品种、姿态）；
- 离散指派不可微，对错一个团就是硬错误。

DM 弱在三处：

1. $K'$ 可以 $\neq K$，通常 $K'>K$：先在无标签阶段保留细结构，下游线性头再聚合；
2. 匹配的是整个分布（$W_1$），不是每个点的硬标签；团可以有半径 $\varepsilon$，点不必强制坍缩到单一中心 $c_i$ 上；
3. 参考分布在预训练之前就定好，**不依赖下游标签空间**，因此同一套 $f$ 可以直接迁移到另一套下游标签设定（即具备更弱的模型假设）。

这与第 3 节 SDR 的精神一致：预训练只负责「好几何 + 不丢信息」，不负责直接输出 $K$ 类后验。

### 11.4 概念网格粒度 $K'$ 的影响

下表列出 CIFAR-100（类别数 $K=100$，5-NN 中 $k=5$，表示维 $d^*=K'$）上不同概念网格数 $K'$ 的测试准确率对比（来自原论文实验）：

| 概念数 $K'$ | 64 | 128 | 256 | 384 | 512 |
|---------------|-----|-----|-----|-----|-----|
| Linear | 49.83 | 55.93 | 61.13 | **64.49** | 63.87 |
| k-NN | 32.73 | 44.17 | 51.00 | **53.11** | 52.45 |

$K'$ 从 64 加到 384 时两种探测都在稳步提升；$384>100$ 说明**比下游类别数更细的概念网格能保留更有区分度的语义子结构**。增加到 512 时略有回落，说明过细的划分会受制于样本量与维数开销，因此不必把 $K'$ 机械绑定为类别数 $K$。

---

## 12. 总结：损失形式变了，误差分解结构未变

将[线性模型](/blog/fods-linear-models/)的误差分解框架平移到这里：现在「假设类」是编码器 $f$（配对 ACT 的矩阵判别器 $G$ 或 DM 的 Lipschitz 判别器），「损失」是

$$
\ell_{\mathrm{SSL}}(f)
\;=\;
\text{对齐}
\;+\;
\text{防崩塌 / 分布匹配}.
$$

经验风险 $\widehat L$ 仍是样本平均（或样本 min-max），总体风险 $L$ 仍是期望。于是

$$
L(f_A)-L(f^*)
\;\le\;
E_{\mathrm{gen}} + E_{\mathrm{app}} + E_{\mathrm{opt}},
$$

或 $E_{\mathrm{sta}}$ 形式。具体含义：

- **统计：** 正对、负对或 IPM 判别器上的均匀偏差。工具仍是覆盖数、Rademacher 复杂度与 Dudley 链式积分（GAN 类对抗项则接入 IPM 经验过程分析）。
- **逼近：** $f^*$ 的坐标在 Hölder 类里，ReLU 网要够宽够深（如第 10.1 节定理的 $W,L,K_{\mathrm{nn}}$）。
- **优化：** $\min\max$ 比凸的最小二乘难，分析里常假设近似 ERM；实践是交替 SGD。

下游分类误差再由「表示质量 + 类均值估计的 $n_t(k)$」接上；few-shot 之所以可行，正是因为 $d^*$ 已经被充分压缩、且语义团在表示空间中实现了线性可分。

对照四类学习范式，表示学习的位置如下：

| | 监督线性模型 | 端到端监督深度 | SDR / 预训练微调 | SSL（SimCLR / ACT / DM） |
|--|------------------|----------------|------------------|---------------------------|
| 标签 | 全程要 | 全程要 | 源域要（或只要 $X$） | 预训练不要，下游要很少 |
| 最后一层 | 线性 | 仍是线性 | 仍是线性 | 仍是类均值 / 线性 |
| 对中间表示的显式条件 | 无 | 无（如 Deep Learning Book 所述） | 条件独立 + 低维 | 增广不变 + 防崩塌或匹配 $P_R$ |

全章脉络可凝练为三点：

1. 最后一层永远是浅层线性分类器；前面的网络都在学习更好的坐标系。
2. 好坐标系在有标签时追求「低维 + 对 $Y$ 条件充分」，在无标签时追求「低维 + 增广不变 + 不坍缩」。
3. 理论保证仍沿用「统计 + 逼近 + 优化」三分法，对比损失或 $W_1$ 散度只是替换了其中的损失函数。

下一篇：[生成学习与 LLM](/blog/fods-generative-learning-llm/)——深入 IPM、GAN、梯度流、扩散模型与 Transformer。本章引入的 $W_1$ 与对偶表达 $\sup_{g\in\mathrm{Lip}(1)}$ 将在那里成为生成模型的核心语言。
