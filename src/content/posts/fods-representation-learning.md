---
title: "表示学习：降维、对比学习与分布匹配"
description: "从特征工程到表示学习，理解充分降维、自监督与对比学习。"
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

对应讲义：`Fods_26.pdf` p.65–77。

本章目标：搞清楚「复杂数据为什么不能直接丢给 Lec1 的线性模型」，以及**没有标签、或标签很少**时，怎样先学一个低维特征，再在特征上做简单分类。

你会得到：

1. 分类流水线的三层：浅层简单数据 → 特征工程 → 端到端深度；最后一层仍然是线性 / logistic；
2. 什么叫好表示（像素 vs DNN encoder），以及 Deep Learning Book 那段话在说什么；
3. 有监督表示 / 充分降维（SDR）：$\dim(f^*(X))\ll\dim(X)$ 和条件独立 $X\perp Y\mid f^*(X)$；
4. 预训练 + 微调：先学表示，再在低维拟合；
5. 自监督学习（SSL）：数据增广、正样本对、两个力（类内拉近 vs 防崩塌）；
6. SimCLR 的 NT-Xent 损失（讲义没写公式，这里补全）和温度 $\tau$；
7. ACT：$\min_f\max_G L(f,G)$，对抗项如何强迫二阶矩接近 $I$；
8. 下游预测规则（类均值）和测试误差；
9. Distribution Matching：把表示的分布推到「概念高斯混合」上，为什么比硬聚类成 $K$ 类弱；
10. 一条主线：**超额风险仍是统计 + 逼近 + 优化，只是损失变成了对比损失或 IPM。**

需要的预备：

- Lec1：风险、线性 / logistic 分类、超额风险；
- Lec2：Hölder 类、ReLU 网络能逼近什么（宽度、深度、稀疏度）；覆盖数 / 经验过程的直觉；
- 附录 B：期望、条件分布、条件独立；
- Wasserstein-1（$W_1$）：这里先当「把一堆沙子搬成另一堆的平均代价」；Lec4 会正式讲 IPM / GAN。

讲义印刷事故（提取/排版会乱）：

- `leaning` = learning；`papulation` = population；`NeruIPS` = NeurIPS；
- p.66「Last layer is loss」= 最后一层仍是线性 / logistic **分类器**；
- p.68 的 $X\,Y\mid f^*(X)$ 中间掉了独立符号，应为 $X\perp Y\mid f^*(X)$；
- p.72 的 $\widehat G(f)$ 里范数写成了两截，完整式见第 7 节；
- 网络稀疏度与类别数都叫 $K$，下文会拆开。

---

## 0. 先用一个故事把问题钉死

Lec1、Lec2 默认：你已经拿到了「能用的特征」$X\in\mathbb{R}^d$。房价例子里，面积、房间数本身就是数字；线性模型直接吃这些数字。

现在 $X$ 是一张 $32\times 32$ 的彩色图，原始坐标是 $32\times 32\times 3=3072$ 维像素。两个麻烦同时出现：

1. **维数太高、样本相对太少。** 非参回归的速率里有 $n^{-\alpha/(2\alpha+d)}$（Lec2）。$d=3072$ 时，这个指数几乎是 $0$：像素空间里「光滑函数」根本学不动。
2. **欧氏距离不懂语义。** 同一只猫的两张裁剪，像素差可以很大；一只黑猫和一只黑狗，像素差反而可以很小。讲义 p.67 左边那张图就是这个意思：按像素聚类，你会按毛色而不是按物种把动物分开。

所以必须先把 $X$ 映成一个低维向量 $f(X)\in\mathbb{R}^{d^*}$，$d^*\ll d$，让

- 同一语义（同一只猫、同一类物体）靠得很近；
- 不同语义被推开；
- 后面只需一个线性 / logistic 头就能分类。

**表示学习 = 学这个 $f$。** 有标签时可以强迫 $f(X)$ 对预测 $Y$ 充分；没标签时，用「同一张图的两种增广应该像」来代替标签。这就是本章从 SDR 走到 SSL、ACT、Distribution Matching 的路线。

---

## 1. 分类流水线（p.66）

讲义把分类画成三条越来越「端到端」的管道。最后一层的角色始终没变。

### 1.1 浅层模型 + 简单数据

数据 $(X,Y)$，**$X$ 本身已经是特征**（表格、手工指标）。模型就是 Lec1 的线性回归或 logistic 回归：

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
- **最后一层**仍是线性映射 + logistic / softmax，即 Lec1 的模型，只是输入从原始 $X$ 换成了 $h_\theta(X)$。

**人话：** 深度学习并没有把线性分类扔掉。它把「人做特征工程」换成「网络自己学特征」，最后仍然在一个更好的坐标系里做超平面分类。

这一点 Deep Learning Book 写得很直白（讲义 p.67 引用，原文在 Goodfellow–Bengio–Courville《Deep Learning》表示学习一章；幻灯片标 “Deep Learning Book 16”）：

> Feedforward networks trained by supervised learning as performing a kind of representation learning. Specially, the last layer of the networks typically a linear classifier, such as a softmax regression classifier. The rest of the network learns to provide a representation to this classifier…. **Supervised training of feedforward networks does not involve explicitly imposing any condition on the learned intermediate features.**

前半句是流水线；后半句（讲义 p.67 **标红**）是本章的动机，值得单独钉死。

**这句话为什么重要。** 有监督端到端只优化最后一层的分类风险 $\ell(Q(h_\theta(X)),Y)$。对中间特征 $h_\theta(X)$ **不显式加任何统计条件**：不要求低维、不要求坐标解耦、不要求「给定 $h_\theta(X)$ 之后 $Y$ 不再依赖原始 $X$」。只要 $Q\circ h_\theta$ 在当前标签上好用，训练就结束。后果有三：

1. $h_\theta$ 可以把对**下一个**任务有用、但对当前 $Y$ 无用的信息扔掉（不可迁移）；
2. 同类可以在特征里缠成一条不可线性切开的流形（几何不好）；
3. $\dim h_\theta(X)$ 不必 $\ll\dim(X)$，维数灾难还在。

所以「网络在学表示」只是副产品，不是定理。要把表示当成一个可分析的对象，必须**自己写下**中间层该满足的条件。

**接到 SDR。** 下一页（p.68）给的条件正是被这句话点名要补的东西：

$$
\dim\bigl(f^*(X)\bigr)\ll\dim(X)
\quad\text{（低维）},\qquad
X\;\perp\; Y\;\bigm|\; f^*(X)
\quad\text{（充分：给定 $f^*$ 后 $X$ 不再提供关于 $Y$ 的信息）}.
$$

条件独立 $\iff P(Y\mid X)=P(Y\mid f^*(X))$，Bayes 规则可以整段搬到低维特征上做，风险不增。这就是对中间特征的显式条件。SSL 没有 $Y$，就把条件改写成「增广不变 + 不崩塌 / 匹配参考分布」——仍然是显式的。纯有监督深度默认**不加**这些，所以要单独开表示学习这一讲。详细的 $\perp$ 见第 3.2 节。

---

## 2. 什么是好表示（p.67）

### 2.1 像素 vs encoder（人话 + 图意）

讲义放了两幅猫狗示意图（左：Default Representation；右：Semantic Representation；图源常见于表示学习综述）。

**左边：用像素当表示。**  
横轴可以想成「颜色 / 亮度」，纵轴想成「纹理」。黑猫和黑狗离得很近（都黑），白猫和白狗离得很近（都白）。线性分类器若想分猫/狗，必须画一条弯得很厉害的边界，浅层模型做不到。

**右边：一个好的 DNN encoder。**  
同一只猫的不同照片被收成一小团，猫和狗被拉开，团与团之间出现空隙。最后一层的线性分类器只要在这些团之间切几刀。

好表示的最低标准，用大白话说就三句：

1. **降维：** $d^*\ll d$，后面的统计速率不再被原始像素维数杀死；
2. **保信息：** 对当前（或下游）任务有用的东西还在；
3. **好几何：** 同类近、异类远，最好再有一点「坐标之间别高度相关」（后面 ACT / Barlow / VICReg 都在干这件事）。

经典出处（讲义点名，读思想即可）：Hinton 1986；Bengio–Courville–Vincent 2013（表示学习综述）；LeCun–Bengio–Hinton 2015（Nature 深度学习综述）。ICLR 从 2013 年起专门开「学表示」这个会，和 ICML、NeurIPS 同一档。

### 2.2 和全课误差分解的关系

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

变的是**损失**：有监督时是 $\ell(Q(f(X)),Y)$；SSL 时是对比损失或 $W_1$ 这类 IPM。Lec1 的公式不会作废，只是 $\ell$ 换了。第 12 节会再钉一次。

---

## 3. 有监督表示与充分降维 SDR（p.68）

### 3.1 目标：又短、又够用的摘要

有标签时，理想表示 $f^*$ 应满足两条（讲义两行公式）：

$$
\dim\bigl(f^*(X)\bigr) \;\ll\; \dim(X),
\qquad
f^*\text{ Lipschitz},
$$

以及**信息保全**

$$
X \;\perp\; Y \;\bigm|\; f^*(X).
$$

第一行：摘要很短，并且对输入别太敏感（Lipschitz），否则既不稳定也无法用 Lec2 的网络去逼近。

第二行是本章必须补全的条件独立，见下一小节。

讲义把这件事放到充分降维（Sufficient Dimension Reduction, SDR）的语言里，并指向

- Chen–Jiao–Qiu–Yu, *Annals of Statistics* 2024（深度非线性 SDR）；
- Huang–Jiao–Liao–Liu–Yu, *IEEE TIT* 2024（有监督表示 / 深度降维）。

思想（不抄论文）：经典 SDR（Li 1991 的切片逆回归 SIR 等）找的是**线性**投影 $x\mapsto B^\top x$，使得 $Y\perp X\mid B^\top X$。数据一复杂，线性不够，就让 $f$ 走深度网络，并用某种依赖性度量（例如广义鞅差散度）当作损失：度量越小，越接近「给定 $f(X)$ 之后 $Y$ 不再依赖 $X$」。再对这个损失做和 Lec2 同类的统计 + 逼近分析。

### 3.2 条件独立到底在说什么（补全）

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

**人话：**

- $X$：一张 $3072$ 维的猫图（毛色、背景、JPEG 噪声全在里面）；
- $Y$：标签「猫」；
- $f^*(X)$：比如「物种 + 粗姿态」这几个数。

给定 $f^*(X)$，背景地毯的纹路不再提供关于 $Y$ 的信息——那些纹路被「屏蔽」了。并不是说 $f^*(X)$ 和 $Y$ 独立（那表示学废了）；恰恰相反，$f^*$ 应该**留下所有对 $Y$ 有用的东西，丢掉其余**。

对分类，Bayes 规则（Lec1）是 $f_{\mathrm{Bayes}}(x)=\arg\max_k P(Y=k\mid X=x)$。条件独立说这个后验只通过 $f^*(x)$ 依赖 $x$，因此

$$
\arg\max_k P\bigl(Y=k\mid X=x\bigr)
\;=\;
\arg\max_k P\bigl(Y=k\mid f^*(X)=f^*(x)\bigr).
$$

在 $f^*$ 的值域里做 logistic，和在原始像素里做 Bayes，**风险相同**。这就是「充分」：降维不损失预测能力。

**误区：**

- $X\perp Y\mid f(X)$ 不是 $f(X)\perp Y$。后者叫「表示里没标签信息」。
- 充分性不唯一。恒等映射 $f(x)=x$ 永远充分，但 $\dim$ 没降。SDR 要的是**维数尽量低的充分表示**（中心子空间 / 中心 $\sigma$-域的非线性版）。
- 经验上用有监督损失训出来的网络，最后一层好用，并不自动推出中间层满足条件独立。这正是 p.67 红字：监督训练不对中间特征显式加条件；SDR 把该加的条件写成 $X\perp Y\mid f^*(X)$。

### 3.3 预训练 + 微调（p.68 下半）

讲义第二块：用 SDR 的眼光看迁移学习（Jiao–Lin–Luo–Yang arXiv:2410.09383；Duan–Jiao–Kang–Yang–Zhou *Pattern Recognition* 2025）。幻灯片那张流程图（大源数据 → 预训练模型 → 目标小数据上微调）可以读成两步：

| 阶段 | 数据 | 在干什么 | 维数 |
|------|------|----------|------|
| 预训练 | 源域大量 $(X,Y)$，或至少大量 $X$ | 学一个好表示 $f$ | 输入 $d$ 很大，输出 $d^*$ 很小 |
| 微调 | 目标域少量带标签样本 | 在 $f(X)$ 上拟合线性 / logistic / 浅层网络 | 在 $\mathbb{R}^{d^*}$ 里做 Lec1 |

**为什么有效（直觉）：**  
源域若与目标共享「语义坐标系」（都是自然图像），充分表示 $f^*$ 在两个域上差不多。目标样本很少时，你不能在 $3072$ 维里估一个非参分类器，但可以在 $d^*\sim 128$ 维里估一个线性头——Lec1 的速率是 $d^*/n_t$，$n_t$ 小也可以。

SSL 把「源域的 $Y$」也拿掉：用增广代替标签来学 $f$，微调阶段才用目标标签。这是第 4 节以后的主题。

---

## 4. 无标签表示：SSL 与数据增广（p.69–70）

### 4.1 LeCun 的蛋糕（p.69，NeurIPS 2016 幻灯片）

Yann LeCun 用蛋糕比喻「学习时机器到底吃到多少信息」：

| 层次 | 比喻 | 每个样本给模型的信息 |
|------|------|----------------------|
| 纯强化学习 | 樱桃 | 一个标量奖励，极稀疏 |
| 监督学习 | 糖霜 | 一个类别或几个数，大约 $10$–$10^4$ bits |
| **自监督** | **蛋糕胚** | 预测输入的任意部分、视频的未来帧，可达数百万 bits |

SSL 的野心：标签昂贵，但原始输入自己含有丰富结构；用「预测自己」榨出表示，比等标签划算。

### 4.2 数据增广与正样本对（p.70）

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

**人话：** 你没有「猫/狗」标签，但你有一条弱监督：一张图的两种瞎裁，语义应当相同。SSL 把这条弱监督写成损失。

### 4.3 两个力：增广不变 vs 防崩塌（p.70 末）

讲义一句把 SSL 说成

$$
\text{SSL}
\;\approx\;
\text{clustering aided classification},
$$

原因是同时有两种力（讲义蓝字）：

1. **增广不变（类内拉近）。** 正对的表示 $\|f(x_1)-f(x_2)\|$ 要小。同一物体的不同看法走进同一团——这是在做聚类的「连边」。
2. **防止模型崩塌（类间推开）。** 若只有 1，最优解是常数映射 $f\equiv 0$（或 $f\equiv c$）：所有点叠在一起，正对距离确实是 $0$，但表示废了。必须把不同图像推开，或强迫表示的协方差 / 二阶矩不要退化。

讲义 p.70 那张双栏图（图源 Weiran Huang）：

- 左栏 **有负样本**：encoder 之后，正对拉近，同时和其他图（负样本）推开。SimCLR 的 NT-Xent（下一节）就是这一栏：分母里的 $k\neq i$ 项是负样本。
- 右栏 **无负样本**：只看见正对，防崩塌改用预测器、滑动平均、白化、方差约束等。ACT 走这一栏：没有 NT-Xent 那种分母，改用 $\|A(f)\|_F^2$。

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

## 5. SimCLR 与 NT-Xent（p.71，公式为补全）

### 5.1 算法在干什么

SimCLR（Chen–Kornblith–Norouzi–Hinton, ICML 2020）是「有负样本」的代表。流程：

1. 一个 minibatch 抽 $N$ 张图，每张做两次增广，得到 $2N$ 个视图；
2. 共享的 encoder $f$（ResNet）给出表示 $h=f(x)$；
3. 再过一个小的投影头 $g$（MLP），$z=g(h)$。对比损失加在 $z$ 上；下游分类常用 $h$（投影头可以扔掉）；
4. 对每个正对，把 batch 里其余 $2N-2$ 个视图当负样本。

经验事实（讲义 p.71 图）：ImageNet 上线性探测的 Top-1 可以和有监督 ResNet-50 比；只用 $1\%$ 标签微调时，Top-5 超过 AlexNet。理论工作把这件事看成「总体层的聚类辅助分类」或「样本层的参数模型」（Arora et al. 2019；HaoChen et al. 2021/22/23；Huang–Yi–Zhao–Jiang 2023；Lei–Yang–Ying–Zhou 2023）。讲义的评论是：我们需要**既好用、又有端到端理论保证**的方法——这是 ACT 出场的理由。

### 5.2 NT-Xent 损失（讲义没写；这就是 p.70 **有负样本** 那一栏的公式）

SimCLR 走的是 p.70 左栏：**正对拉近，同时和 batch 里其它视图（负样本）推开**。NT-Xent 的分母就是这些负样本；没有分母就退化成右栏的「只看见正对」，常数映射会把损失打到 $0$。后面 ACT 故意不用这个分母，改用二阶矩对抗防崩塌。

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

这就是讲义省略、需要补上的公式。分母里 $k$ 跑遍当前对比集合中除自己以外的所有视图（SimCLR 的 minibatch 里一共 $2N$ 个 $z$，故有 $2N-1$ 项）。最终损失对每个正对的两个方向 $(i,j)$ 和 $(j,i)$ 取平均。

**这就是带温度的 softmax 交叉熵：** 把「认出谁是我的正样本」当成一个 $2N-1$ 类分类问题，正样本是唯一正确类。分子大、分母里负样本的贡献小，损失才小。

### 5.3 温度 $\tau$ 在干什么

$\tau>0$ 把相似度除完再送进 softmax。

- $\tau\to 0^+$：softmax 越来越尖。只有「当前最像的几个」还有梯度，模型被迫处理**难负样本**（和锚点很像但不是同一张图的视图）。太小会训飘。
- $\tau$ 太大：$\mathrm{sim}/\tau$ 都接近 $0$，正负差被抹平，拉近 / 推开的信号都弱。
- SimCLR 原文常用 $\tau\approx 0.5$（ImageNet 上再偏小一些）。数量级直觉：余弦在 $[-1,1]$，除以 $0.5$ 后进指数函数，差别会被放大到可用的程度。

**对齐–均匀分解（帮助直觉，Wang–Isola 2020）。** 把 $-\ell_{i,j}$ 拆开：分子是正对对齐 $\mathrm{sim}(z_i,z_j)/\tau$；分母的 $\log\sum\exp$ 鼓励 $z_i$ 不要和所有人（含负样本）都像，在超球面上接近均匀。这正是第 4.3 节的两个力。

**误区：** 分母包含正样本自己那一项 $\exp(\mathrm{sim}(z_i,z_j)/\tau)$，但不包含 $k=i$ 的自相似度（那一项恒为 $1$，没有信息）。常数映射下所有 $\mathrm{sim}=1$，$\ell_{i,j}=\log(2N-1)$：有 $2N-2$ 个负样本时这个值是 $\log(\text{对比集大小})$，与表示内容无关，**常数不再是最优**（任何把正对相似度抬到负对之上的 $f$ 都会更小）。若没有负样本，分母只剩正对自己，$\ell_{i,j}=0$，常数映射赢——这就是必须走「有负样本」或「另加防崩塌」两条路的原因。NT-Xent 属于前者；ACT / BYOL / Barlow / VICReg 属于后者。

---

## 6. ACT 模型（p.72）

Adversarial Contrastive Training（Duan–Jiao–Lin–Ma–Yang, NeurIPS 2025；讲义拼成 NeruIPS）走无负样本路线，但把防崩塌写成一个**对二阶矩残差的对抗 / IPM 问题**，以便套 GAN 的误差分析（Lec4 的工具）。

### 6.1 总体想法

只要正对距离：

$$
\|f(x_1)-f(x_2)\|_2^2
$$

会崩塌。Barlow Twins 的修补是让交叉相关阵接近 $I$。ACT 把「接近 $I$」写成与矩阵判别器 $G$ 的 Frobenius 内积，然后 $\min_f\max_G$：判别器拼命找二阶矩和 $I$ 的差距，encoder 拼命消灭这个差距，同时保持增广不变。

### 6.2 经验 min-max（补全）

函数类（与 Lec2 同一套网络记号）：

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
- $W$ 宽、$L$ 深、$K_{\mathrm{nn}}$ 非零参数个数。讲义把 $K_{\mathrm{nn}}$ 写成 $K$，与类别数撞名；
- $B_1\le\|f\|_2\le B_2$：表示既不能缩成 $0$，也不能爆掉。常在球壳上。

经验损失（把幻灯片两截符号拼回来）：

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

### 6.3 内层 $\max_G$ 在强迫二阶矩接近 $I$（$\widehat G(f)$ 写全）

讲义把判别器可行集写成 $\widehat G(f)$（排版拆成两截）。完整定义就是上一小节的 $\widehat{\mathcal{G}}(f)$：$G\in\mathbb{R}^{d^*\times d^*}$ 且 $\|G\|_F\le\|A(f)\|_F$，其中

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

**为什么把球半径取成 $\|A\|_F$ 而不是 $1$。** 若 $\|G\|_F\le 1$，内层 max 是 $\|A\|_F$，罚的是残差的范数；半径取 $\|A\|_F$ 时罚的是残差的平方，和 Barlow 的 $\|C-I\|_F^2$ 同型，又仍是 $\sup_G\langle A,G\rangle$ 这种 IPM，方便套 GAN 的经验过程。两种都防崩塌；讲义选后者。

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

**人话：**

- 第一项：同一张图的两种增广，表示要近（类内拉近）；
- 第二项：两种增广的**跨视图二阶矩**要接近单位阵。对角 $\approx 1$：每个坐标都有能量，不能整张图缩成 $0$；非对角 $\approx 0$：不同坐标别高度相关，不能所有质量塌进一条直线。这和 Barlow Twins / VICReg 的白化是亲戚，但写成 $\min\max$ 之后，均匀偏差可以用 GAN / IPM 的经验过程控制。

崩塌检查：

- $f\equiv 0$：$A=-I$，$\|A\|_F=\sqrt{d^*}$，第二项是 $\lambda d^*$，不优；
- $f\equiv v$（常数向量）：$A=vv^\top-I$。$d^*>1$ 时秩一矩阵减单位阵不可能是 $0$；
- 所有表示落在一个低维子空间：$A+I$ 秩亏，$\|A\|_F$ 有一块下界。

所以「对齐 + 二阶矩 $\approx I$」同时实现第 4.3 节的两个力，而且**不需要负样本**。

为什么还要写成 $\min\max$ 而不是直接罚 $\|A\|_F^2$？因为 $\|A\|_F^2=\sup_{\|G\|_F\le\|A\|_F}\langle A,G\rangle_F$ 是一种 IPM；经验过程、逼近、优化可以沿用 Huang–Jiao–Li–Liu–Wang–Yang JMLR 2022、Jiao–Wang–Yang ACHA 2023 那套 GAN 分析（Lec4）。直接平方罚当然也能训，但端到端误差界对 min-max 更现成。

---

## 7. 预测规则 $Q_{\widehat f}$ 与测试误差（p.72）

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

### 7.1 类均值线性头（$n_t$ 预测规则写全）

目标域只有 $n_t$ 个带标签样本，每个同样抽两次增广。第 $k$ 类的个数 $n_t(k)=\mathrm{card}\{i:y_i=k\}$，该类一共贡献 $2n_t(k)$ 个表示向量

$$
\bigl\{\widehat f(z^{(i)}_1),\;\widehat f(z^{(i)}_2):y_i=k\bigr\}.
$$

经验类均值（讲义 $\widehat W(k,:)$，分母的 $2n_t(k)$ 来自「两个视图都算进去」）

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

**为什么是内积、不是再训一个 logistic。** 表示若已按类成团，类均值就是原型（prototype）。$\mathcal{F}$ 把 $f$ 限制在球壳 $B_1\le\|f\|_2\le B_2$ 上，$\|\widehat f(z)\|_2$ 几乎常数，

$$
\bigl\|\widehat f(z)-\widehat\mu_k\bigr\|_2^2
=
\|\widehat f(z)\|_2^2+\|\widehat\mu_k\|_2^2-2\langle\widehat\mu_k,\widehat f(z)\rangle.
$$

$\|\widehat f(z)\|^2$ 与 $k$ 无关；二阶矩 $\approx I$ 再加源域剖分（第 9.5 节）让各类均值能量差不多，于是 $\arg\max_k\langle\widehat\mu_k,\widehat f(z)\rangle$ 与最近类均值 $\arg\min_k\|\widehat f(z)-\widehat\mu_k\|$ 一致。讲义小图：平面被 $K$ 条类均值向量分成 $K$ 个锥。

参数个数只有 $K\cdot d^*$，而且是样本均值、没有迭代。类均值用了 $2n_t(k)$ 个有界向量，随 $n_t(k)$ 集中。幻灯片把这块失败概率写成 $O(d^*/\sqrt{\min_k n_t(k)})$（p.75；没有更细的 Hoeffding 常数，这里不另编），few-shot 只依赖每类标签数。

**没有再训一个复杂头。** 表示若真的已经按类成团，均值就够了。这对应「微调 = 在低维拟合参数模型」，而且参数少到只有 $K$ 个均值。

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

## 8. 数值：只作表引用（p.73）

讲义在 CIFAR-10 / CIFAR-100 / Tiny ImageNet 上比较线性探测与 5-NN（同一套复现设定）。数字以幻灯片为准。

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

读表：ACT 在 CIFAR-10 / CIFAR-100 上全面最高；Tiny ImageNet 线性探测略低于 BYOL（51.00 vs 49.72），5-NN 最高。结论不是「永远 SOTA」，而是：**这个有端到端界的 min-max 目标，经验上和 SimCLR / BYOL 同一档**。代码：`https://github.com/vincen-github/Adversarial-Contrastive-Training`。

---

## 9. ACT 误差分析：假设先翻成白话（p.74）

定理之前有一长串假设。下面按「人话 → 符号」对照。$f^*$ 是总体 min-max 的解（在 $B_1\le\|f\|_2\le B_2$ 里），$f^*_i$ 是它的第 $i$ 个坐标，$i\in[d^*]$。

### 9.1 Hölder 光滑

**人话：** 理想 encoder 的每个坐标都比较「平」，不能是到处跳的噪声。平的函数才能用 Lec2 的 ReLU 网络逼近。

**符号：** $f^*_i\in\mathcal{H}^\alpha$（Hölder-$\alpha$ 类：直到阶 $\lfloor\alpha\rfloor$ 的导数存在，余项有指数 $\alpha-\lfloor\alpha\rfloor$ 的 Hölder 条件）。$\alpha$ 越大越光滑，越容易逼近。

### 9.2 源域 / 目标域在每一类上 $W_1$ 接近

**人话：** 无标签源和有标签目标不必同分布，但**每一类内部**别差太远——源域的「狗」搬到目标域的「狗」，平均搬家距离 $\le\epsilon_{\mathrm{ds}}$；各类的占比也别差太多。这是温和的域适应，不是「源是猫、目标是飞机」。

**符号：** $C_s(k),C_t(k)$ 为源 / 目标第 $k$ 类支撑，

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

**人话：** 裁剪、翻转、调色不能把两张本来相近的图撕到天南海北。否则「增广不变」在像素空间里没有几何意义，表示空间里也学不到连续的团。

**符号：** 任意 $A_\gamma\in\mathcal{A}$，任意 $u_1,u_2\in[0,1]^d$，

$$
\|A_\gamma(u_1)-A_\gamma(u_2)\|_2 \le M\|u_1-u_2\|_2.
$$

### 9.4 核心集 $C^*$：一类里「够典型、且能被增广粘住」的部分

**人话：** 每一类不必所有图都长得像。允许有难看的边角料。但要有一块**核心**：

- 核心占该类质量的至少 $\sigma_s$（源）或 $\sigma_t$（目标），$\sigma$ 接近 $1$ 最好；
- 核心里任意两张图，都能各自做一个增广，使得两个增广视图在输入空间里很近（直径 $\le\delta_s$ 或 $\delta_t$）。

第二点是「增广图连通」：核心里的样本可以被正对一条条串成一团，对比学习才会把它收成一个簇。目标域全部核心的总质量还要 $\ge\sigma_t$——定理里那块 $1-\sigma_t$ 就是你愿意送给边角料的错误率。

**符号：** 对每个 $k$，存在 $C^*_s(k)\subseteq C_s(k)$、$C^*_t(k)\subseteq C_t(k)$，使得

$$
P_s\bigl(x\in C^*_s(k)\bigr)
\ge
\sigma_s\, P_s\bigl(x\in C_s(k)\bigr),
\quad
P_t\bigl(z\in C^*_t(k)\bigr)
\ge
\sigma_t\, P_t\bigl(z\in C_t(k)\bigr),
$$

$\sigma_s,\sigma_t\in(0,1]$。（原片把目标侧写成 $P_t(z\in C_t^*(k))\ge\sigma_t P_t(z\in C_t^*(k))$，右边重复了核心集，是排版；应按源侧对称，右边是 $C_t(k)$。）增广直径

$$
d_{\mathcal{A},C}
\;:=\;
\sup_{u_1,u_2\in C}
\min_{\substack{u_1'\in\mathcal{A}(u_1)\\ u_2'\in\mathcal{A}(u_2)}}
\|u_1'-u_2'\|_2,
$$

要求 $d_{\mathcal{A},C^*_s(k)}\le\delta_s$，$d_{\mathcal{A},C^*_t(k)}\le\delta_t$。并且

$$
P_t\Bigl(\bigcup_{k=1}^K C^*_t(k)\Bigr)\ge\sigma_t.
$$

（幻灯片把 $d_{\mathcal{A},C}$ 写成了带 $(u_1,u_2)$ 的函数；它其实是核心上的一个数：最坏一对点的「最好增广配对」距离。）

### 9.5 源域的剖分，质量别太偏

**人话：** 源域可以切成 $d^*$ 块（块数 = 表示维数），每块都占一块不可忽略的概率，也不能某一块独占。这样「二阶矩 $\approx I$」才和「大约 $d^*$ 个模式」兼容：一块对应一个大致正交的方向。

**符号：** 存在 $X_s$ 的剖分 $\{P_1,\ldots,P_{d^*}\}$，使得对每个 $i\in[d^*]$，

$$
\frac1{B_2^2}
\;\le\;
P_s(P_i)
\;\le\;
\frac1{B_1^2}.
$$

（$B_1,B_2$ 正是 $\|f\|_2$ 的上下界。讲义把分数排成了两截。）

---

## 10. 定理与证明骨架（p.75）

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

这里 $r$ 是 Hölder 阶 $\alpha$ 对应的 Taylor 次数一类的量（Lec2 逼近 $x^2$、乘积、再拼局部多项式时，深度带 $\log_2(d+r)$）。$\epsilon(\epsilon_{\mathrm{ds}},\delta_t,\delta_s)$ 随源–目标 $W_1$ 间隙和增广直径趋于 $0$。

**人话读界：**

- $(1-\sigma_t)$：目标域核心以外，定理不保证，把这笔错误先付掉。数据「规整」时 $\sigma_t\approx 1$，这一项 $\approx 0$。
- $O(n_s^{-\alpha/(8(\alpha+d+1))})$：无标签源样本把表示学好的速率。指数里同时有光滑阶 $\alpha$ 和输入维 $d$，是非参味道；分母里多出来的因子，是 min-max / 对比结构相对普通回归更难估。
- 概率里的 $\sigma_s$：源域核心也要够厚，否则正对连边连不起来。
- $d^*/\sqrt{\min_k n_t(k)}$：目标域用类均值，每类几个标签就有 $\sqrt{n_t(k)}$ 的均值误差。**这就是 few-shot：** 表示一旦好，目标不需要很多标签。
- 宽度 $W$ 随 $n_s$ 多项式增长、深度只需对数：正是 Lec2「用够宽的 ReLU 网去逼 Hölder」那一档。

讲义结论句：若数据足够规则（$\sigma_s,\sigma_t\approx 1$，$\epsilon\approx 0$）且 $n_s$ 够大，则 **ACT 在很小的目标集上仍然够用**。

### 10.2 证明骨架：对比 → 聚类 → 分类

完整证明是论文篇幅，课堂只跟下面这条不等式链（Huang–Yi–Zhao–Jiang 2023 的「对比 = 聚类辅助分类」，加上 Huang–Jiao–Li–Liu–Wang–Yang JMLR 2022、Jiao–Wang–Yang ACHA 2023 的 GAN / IPM 经验过程）。不抄技术引理，但每一步都要看到「谁小 ⇒ 谁小」。

记总体对齐 $\varepsilon_{\mathrm{ic}}(f)=\mathbb{E}\|f(x_1)-f(x_2)\|_2^2$，残差 $A(f)=\mathbb{E}[f(x_1)f(x_2)^\top]-I_{d^*}$。$f$ 落在球壳上，网络 / Hölder 给出 Lipschitz 常数 $L_f$（对 $f^*$ 来自 $\mathcal{H}^\alpha$，对 $\widehat f$ 来自 $\mathrm{NN}$ 的权界）。

**（i）对齐损失小 $\Rightarrow$ 增广几乎等距。**  
$\varepsilon_{\mathrm{ic}}(f)$ 小：同一张图的两个增广，表示距离 $\lesssim\sqrt{\varepsilon_{\mathrm{ic}}}$（Markov：对任意 $\eta$，$\mathbb{P}(\|f(x_1)-f(x_2)\|>\eta)\le\varepsilon_{\mathrm{ic}}/\eta^2$，核心上可把坏点并进 $1-\sigma_s$ 那笔）。再加增广 Lipschitz 与核心直径 $d_{\mathcal{A},C^*_s(k)}\le\delta_s$：对 $u,v\in C^*_s(k)$，存在 $u'\in\mathcal{A}(u)$、$v'\in\mathcal{A}(v)$ 使 $\|u'-v'\|\le\delta_s$，于是

$$
\|f(u')-f(v')\|_2
\;\le\;
L_f\delta_s.
$$

$u'$ 与 $u$ 的其它增广同属一张图，对齐又把 $\|f(u')-\widetilde f(u)\|$ 收成 $\sqrt{\varepsilon_{\mathrm{ic}}}$ 量级。三角不等式：

$$
\mathrm{diam}\bigl(f(C^*_s(k))\bigr)
\;\lesssim\;
\sqrt{\varepsilon_{\mathrm{ic}}(f)}+L_f\delta_s.
$$

同一类核心在表示空间里几乎是一个小团——增广把输入空间的「能被裁剪粘住」变成了特征空间的几乎等距 / 几乎不变。

**（ii）几乎等距 + 二阶矩 $\approx I$ $\Rightarrow$ 源类可分。**  
$\|A(f)\|_F$ 小 $\Rightarrow$ 跨视图二阶矩 $\approx I$：每个坐标有能量，不能全体塌到一个点或一条直线。配上第 9.5 节的剖分（每块质量夹在 $B_2^{-2}$ 与 $B_1^{-2}$ 之间），大约 $d^*$ 个有质量的模式对着 $d^*$ 个近正交方向。不同类核心若都缩成直径 $\rho_s\lesssim\sqrt{\varepsilon_{\mathrm{ic}}}+L_f\delta_s$ 的团，而类均值间距是 $\Theta(1)$（白化后的尺度），则只要 $\rho_s$ 小于间距的一半，源核心线性可分：存在间隔 $\gamma>0$，使得 $x\in C^*_s(k)$、$\ell\neq k$ 时

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

核心以内：真均值 $\mu_t(k)$ 已分得开（iii）。经验均值 $\widehat\mu_k$ 是 $2n_t(k)$ 个有界向量的平均，偏离过大时会把间隔吃掉。幻灯片把这块并进概率里的 $O(d^*/\sqrt{\min_k n_t(k)})$（没有给出 $\sqrt{d^*/n}$ 型精细常数，这里不另编）。

剩下的是「$\widehat f$ 有多接近总体 $f^*$」：$\varepsilon_{\mathrm{ic}}(\widehat f)$ 与 $\|A(\widehat f)\|_F$ 必须小到（i）（ii）能用。这一步拆成全课那三块——

| 误差 | 在 ACT 里是什么 | 用什么工具 |
|------|-----------------|------------|
| 统计 | $\sup_{f,G}|L-\widehat L|$，min-max 的均匀偏差 | GAN / IPM 经验过程（覆盖数、Rademacher；Lec2 / Lec4） |
| 逼近 | 网络类 $\mathcal{F}$ 够不够贴 $f^*\in(\mathcal{H}^\alpha)^{d^*}$ | Lec2：ReLU 逼近 Hölder，深度 $\log(d+r)$，宽度随 $n_s$ 涨 |
| 优化 | $\widehat f$ 是否真是经验 min-max | 分析里当作近似 ERM；实践中交替梯度 |

选讲义的 $W,L,K_{\mathrm{nn}}$，这一段贡献 $O(n_s^{-\alpha/(8(\alpha+d+1))})$（概率里再弱一档 $16$）。

**超额风险的形态没变，变的是损失是对比项 + 二阶矩 IPM，而不是 $\ell(\text{线性}(X),Y)$。**

速率指数 $\alpha/(8(\alpha+d+1))$ 比经典非参回归的 $\alpha/(2\alpha+d)$ 更慢，因为多了一层对抗和「先聚类再分类」的传递。这不是缺陷叙事，而是：你用无标签 $n_s$ 换掉了对高维 $X$ 直接做有监督非参的不可能速率。

---

## 11. Distribution Matching（p.76–77）

ACT 的防崩塌是「二阶矩 $\approx I$」，仍然是防御性的：告诉你别塌，但没说表示的分布**应该长成什么样**。Distribution Matching（Jiao–Ma–Sun–Wang–Wang, arXiv:2502.14424）把目标改成：**一边增广不变，一边让 $f$ 推出的分布去贴一个事先画好的参考分布 $R$。**

### 11.1 参考分布：概念高斯混合

在半径约 $1$ 的超球面上放 $K'$ 个几乎正交的中心 $c_i$（可取带符号的标准基向量）。第 $i$ 个概念不是一个点，而是中心附近一小团：把各向同性高斯方向加到 $c_i$ 上再归一化。讲义写成

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

**人话：** 你希望表示空间看起来像「球面上 $K'$ 朵分离的小云」。$K'$ 是**概念数**，不是下游类别数 $K$。一朵云可以是「侧卧的虎斑猫」，下游再把若干朵云合成标签「猫」。

讲义左图：球面上一个中心 $c_i$，噪声把点涂成一小帽；右图：帽子里住着同一概念的图像。

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

对齐项（invariance / intra-class，讲义的 $L_{\mathrm{ic}}$）

$$
L_{\mathrm{ic}}(f)
\;=\;
\mathbb{E}_x\mathbb{E}_{x_1,x_2\in\mathcal{A}(x)}
\bigl\|f(x_1)-f(x_2)\bigr\|_2^2.
$$

$W_1$ 的 Kantorovich–Rubinstein 对偶（Lipschitz-1 函数当判别器，Lec4 的 IPM）给出讲义第二行：

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

- 预训练时你往往**不知道** $K$，更没有类名；
- 一个类内部本来就有多个概念（CIFAR-100 的「狗」含许多品种、姿态）；
- 离散指派不可微，对错一个团就是硬错误。

DM 弱在三处：

1. $K'$ 可以 $\neq K$，通常 $K'>K$：先在无标签阶段保留细结构，下游线性头再聚合；
2. 匹配的是整个分布（$W_1$），不是每个点的硬标签；团可以有半径 $\varepsilon$，点不必钉死在 $c_i$；
3. 参考分布在预训练之前就定好，**不依赖下游标签空间**，因此同一套 $f$ 可以迁到另一套标签（讲义写 Weaker assumptions）。

这与第 3 节 SDR 的精神一致：预训练只负责「好几何 + 不丢信息」，不负责直接输出 $K$ 类后验。

### 11.4 $K'$ 实验（p.77，CIFAR-100）

讲义表：全部在 CIFAR-100 上，5-NN 的 $k=5$，表示维 $d^*=K'$。

| 概念数 $K'$ | 64 | 128 | 256 | 384 | 512 |
|---------------|-----|-----|-----|-----|-----|
| Linear | 49.83 | 55.93 | 61.13 | **64.49** | 63.87 |
| k-NN | 32.73 | 44.17 | 51.00 | **53.11** | 52.45 |

CIFAR-100 的类别数是 $K=100$。$K'$ 从 64 加到 384，两种探测都在涨；$384>100$，说明**比类数更细的概念网格是有用的**。512 略回落，网格过细会和样本、维数打架。不要把 $K'$ 理解成「必须等于类数的聚类 $K$」。

---

## 12. 收束：损失换了，误差分解没换

把 Lec1 p.5 的分解原样搬过来。现在「模型」是 encoder $f$（外加 ACT 的 $G$ 或 DM 的 Lip 判别器），「损失」是

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

或 Esta 形式。具体含义：

- **统计：** 正对、负对或 IPM 判别器上的均匀偏差。工具仍是覆盖数、Rademacher、Dudley；GAN 那一侧用 Lec4 的 IPM 经验过程。
- **逼近：** $f^*$ 的坐标在 Hölder 类里，ReLU 网要够宽够深（本章定理的 $W,L,K_{\mathrm{nn}}$）。
- **优化：** $\min\max$ 比凸的最小二乘难，分析里常假设近似 ERM；实践是交替 SGD。

下游分类误差再由「表示质量 + 类均值的 $n_t(k)$」接上。所以 **few-shot 能工作，不是魔法，是 $d^*$ 已经很小、团已经分开。**

对照三条流水线，本章的位置是：

| | 监督线性（Lec1） | 端到端监督深度 | SDR / 预训练微调 | SSL（SimCLR / ACT / DM） |
|--|------------------|----------------|------------------|---------------------------|
| 标签 | 全程要 | 全程要 | 源域要（或只要 $X$） | 预训练不要，下游要很少 |
| 最后一层 | 线性 | 仍是线性 | 仍是线性 | 仍是类均值 / 线性 |
| 对中间表示的显式条件 | 无 | 无（Deep Learning Book 那句） | 条件独立 + 低维 | 增广不变 + 防崩塌或匹配 $P_R$ |

记住三句话就够带着公式走：

1. 最后一层永远是浅的；前面全在学坐标系。
2. 好坐标系 = 短 + 对 $Y$ 充分（有标签），或短 + 增广不变 + 不塌（无标签）。
3. 证明仍是统计 + 逼近 + 优化；对比 / $W_1$ 只是新的 $\ell$。

下一份：[04_Lec4_生成学习与LLM](/blog/fods-generative-learning-llm/)——IPM、GAN、梯度流、扩散。本章的 $W_1$ 和对偶 $\sup_{g\in\mathrm{Lip}(1)}$ 会在那里变成生成模型的主语言。
