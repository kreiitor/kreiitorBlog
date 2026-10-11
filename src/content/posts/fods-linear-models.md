---
title: "线性模型：从最小二乘到 Lasso"
description: "把风险、偏差与方差讲清楚，完整推导 OLS、Ridge 和 Lasso。"
pubDate: 2026-10-11
tags:
  - 数据科学
  - 学习理论
  - FODS
category: course
series: fods
order: 1
cover: /covers/post-math.svg
---

对应讲义：`Fods_26.pdf` p.3–12（线性模型主体）；p.3–6 同时是全课的「监督学习总框架」。

本章目标：在**最简单、能把每一步都算到底**的模型上，把后面所有课都会用的语言学会。

你会得到：

1. 风险、超额风险、ERM 是什么；
2. 误差怎么拆成统计 / 逼近 / 优化；
3. 固定设计最小二乘的精确误差 $\frac{r\sigma^2}{n}$；
4. Ridge 的偏差–方差公式，以及 $\lambda$ 怎么选；
5. OLS 的高概率界（次高斯 + 并集）；
6. minimax 下界为什么也是 $\frac{d\sigma^2}{n}$（贝叶斯方法，作业里的高斯条件分布会补全）；
7. 约束最小二乘（$\ell_1$ 球、稀疏球）和 Lasso 的完整证明。

需要的预备（看不懂就去附录）：

- 向量、内积、$\|x\|_2$、矩阵乘法、迹 $\mathrm{tr}$：附录 A
- 正交投影：附录 A「投影」
- 高斯分布、期望、方差、独立：附录 B
- 次高斯、Hoeffding、并集界：附录 B 后半（本节高概率部分会现场用）

---

## 0. 先用一个故事把符号钉死

假设房价 $Y$ 真的是面积等特征 $x\in\mathbb{R}^d$ 的线性函数，再加一点噪声：

$$
y = \langle x,\theta^*\rangle + \epsilon.
$$

- $\theta^*$：真正的「每平米多少钱」等系数，上帝知道、你不知道。
- $\epsilon$：噪声（看房时心情、议价……），我们常假设 $\epsilon\sim N(0,\sigma^2)$。
- 你有 $n$ 套房子的数据 $(x_i,y_i)$。
- 你的任务：给出一个 $\widehat\theta$，希望 $\widehat\theta\approx\theta^*$，更准确地说，希望**预测误差**小。

「预测误差」不是 $\|\widehat\theta-\theta^*\|_2^2$ 那么简单：如果某个方向上数据很少，那个方向估不准，但也许你也很少在那个方向上预测。正确的尺子是**用数据的协方差加权**。这就是后面的 $\|\cdot\|_\Sigma$。

---

## 1. 监督学习的总设置（p.3）

### 1.1 数据从哪来

把一对观测 $(X,Y)$ 看成某个未知联合分布 $P$ 的一次抽样：

$$
(X,Y)\sim P,\qquad X\in\mathcal{X},\; Y\in\mathcal{Y}.
$$

**原则：对 $P$ 假设越少越好。**

- **参数模型**：$P$ 属于一个有限维参数族 $\{P_\theta:\theta\in\Theta\subset\mathbb{R}^d\}$。例如「$Y\mid X$ 是均值 $\theta^\top X$ 的高斯」。
- **非参数模型**：$P$ 只满足光滑、有界等定性条件，参数可以是无穷维的（整个函数 $f^*$）。现代机器学习多半是这个。

### 1.2 损失函数与风险

选一个损失函数 $\ell:\mathcal{Y}\times\mathcal{Y}\to\mathbb{R}$。$\ell(a,y)$ 表示「我猜 $a$、真值是 $y$」有多痛。

**总体风险（population risk）**：

$$
L(f) \;=\; \mathbb{E}_{(X,Y)\sim P}\bigl[\ell\bigl(f(X),Y\bigr)\bigr].
$$

这是「如果永远按 $f$ 去猜，平均会错多少」。你算不出来，因为它依赖未知的 $P$。

**目标函数（Bayes 规则）**：

$$
f^* \;\in\; \arg\min_{\text{可测 }f}\, L(f).
$$

因为期望可以先对 $X$ 再对 $Y\mid X$，点点最优就是：

$$
f^*(x) \;=\; \arg\min_{a\in\mathcal{Y}}\; \mathbb{E}\bigl[\ell(a,Y)\mid X=x\bigr].
$$

**补全：平方损失 $\Rightarrow$ 条件均值。**

取 $\mathcal{Y}=\mathbb{R}$，平方损失 $\ell(a,y)=\frac12(a-y)^2$（常数 $\frac12$ 只是为了求导好看，不影响 argmin）。对固定的 $x$，

$$
\begin{aligned}
\mathbb{E}\bigl[\tfrac12(a-Y)^2\mid X=x\bigr]
&= \tfrac12\mathbb{E}\bigl[(a-\mathbb{E}[Y\mid x]+\mathbb{E}[Y\mid x]-Y)^2\mid x\bigr]\\
&= \tfrac12(a-\mathbb{E}[Y\mid x])^2 + \tfrac12\mathrm{Var}(Y\mid x).
\end{aligned}
$$

第二项与 $a$ 无关，所以最小在 $a=\mathbb{E}[Y\mid X=x]$。交叉项为 $0$：$\mathbb{E}[(a-\mathbb{E}[Y\mid x])(\mathbb{E}[Y\mid x]-Y)\mid x]=0$。

**补全：绝对值损失 $\Rightarrow$ 条件中位数。**

$\ell(a,y)=|a-y|$（也叫 $L^1$ / MAE）。Bayes 规则不再是均值，而是**条件中位数**。

称 $m$ 为 $Y\mid X=x$ 的中位数，若

$$
\mathbb{P}(Y\le m\mid X=x)\ge\tfrac12,\qquad
\mathbb{P}(Y\ge m\mid X=x)\ge\tfrac12.
$$

（连续时就是 $F_{Y\mid x}(m)=\tfrac12$；不唯一时任意一个中位数都最优。）

**证明。** 固定 $x$，以下概率都条件于 $X=x$。只要证：对任意 $a>m$，

$$
\mathbb{E}[|Y-a|]-\mathbb{E}[|Y-m|]\ge 0
$$

（$a<m$ 把 $Y$ 换成 $-Y$）。把实轴切成三块：

$$
|y-a|-|y-m|
=
\begin{cases}
m-a, & y\ge a,\\
a+m-2y, & m\le y<a,\\
a-m, & y<m.
\end{cases}
$$

中间那段 $y<a$，故 $a+m-2y>m-a$。于是整条 $\ge (m-a)\,1_{Y\ge m}+(a-m)\,1_{Y<m}$，即

$$
|Y-a|-|Y-m|
\;\ge\;
(m-a)\bigl(1_{Y\ge m}-1_{Y<m}\bigr)
=(m-a)\bigl(2\cdot 1_{Y\ge m}-1\bigr).
$$

取期望：$a>m$ 且 $\mathbb{P}(Y\ge m)\ge 1/2$，右边期望 $\ge 0$。$\square$

**人话。** 平方把大误差放大，最优猜「平均」；绝对值一视同仁，最优猜「排在正中间的那个」。有离群点时常用绝对值（或 Huber）。

若 $Y\mid x$ 有密度，也可对 $a$ 求导：

$$
\frac{\partial}{\partial a}\mathbb{E}[|Y-a|]
=\mathbb{P}(Y<a)-\mathbb{P}(Y>a)
=2F(a)-1,
$$

零点仍是 $F(a)=1/2$。

**分类（0-1 损失）。** $\mathcal{Y}=\{1,\ldots,K\}$，$\ell(a,y)=\mathbf{1}_{a\neq y}$。则

$$
f^*(x)=\arg\max_{k\in[K]}\mathbb{P}(Y=k\mid X=x)
$$

（后验概率最大的类）。二分类 $Y\in\{0,1\}$ 时，记 $\eta(x)=\mathbb{P}(Y=1\mid X=x)$，

$$
f^*(x)=\mathbf{1}_{\{\eta(x)\ge 1/2\}}.
$$

（讲义在 $\eta=1/2$ 时写了 $\le$ 和 $\ge$ 两边都可，因为两者风险相同。）

**另外两个常见损失（原片没有，后面会碰到，可先记结论）。**

- **Pinball / 分位数损失。** $\ell_\tau(a,y)=(y-a)(\tau-1_{y<a})$，$\tau\in(0,1)$。$\tau=1/2$ 就是绝对值的一半。Bayes 规则是条件 $\tau$-分位数：$\mathbb{P}(Y\le f^*(x)\mid x)=\tau$。证明与绝对值相同，左右权重变成 $\tau$ 与 $1-\tau$。
- **对数损失（交叉熵）。** 二分类若预测的是概率 $a\in(0,1)$，$\ell(a,y)=-y\log a-(1-y)\log(1-a)$，则 $f^*(x)=\eta(x)$。Lec2 的 logistic 就是在用这个。

| 损失 $\ell(a,y)$ | Bayes 规则 $f^*(x)$ |
|-----------------|---------------------|
| $\frac12(a-y)^2$ | 条件均值 $\mathbb{E}[Y\mid x]$ |
| $|a-y|$ | 条件中位数 |
| pinball $\tau$ | 条件 $\tau$-分位数 |
| $1_{a\neq y}$（分类） | 后验最大类；二分类 $1_{\{\eta\ge 1/2\}}$ |
| 对数损失 | 后验本身 $\eta(x)$ |

### 1.3 经验风险最小（ERM）

训练数据 $(X_i,Y_i)\stackrel{\mathrm{iid}}{\sim} P$，$i=1,\ldots,n$。把期望换成平均：

$$
\widehat L(f) \;=\; \frac1n\sum_{i=1}^n \ell\bigl(f(X_i),Y_i\bigr).
$$

在一个事先选好的函数类 $\mathcal{F}$ 里最小化：

$$
\widehat f \;\in\; \arg\min_{f\in\mathcal{F}}\widehat L(f).
$$

特例：

- 平方损失 + 线性类 $\mathcal{F}=\{x\mapsto x^\top\beta\}$ → **最小二乘**；
- 0-1 损失 → 经验分类错误率最小（不可微，后面要用 hinge 等凸替代）。

**超额风险（excess risk）**，我们真正关心的量：

$$
\mathcal{E}(\widehat f) \;:=\; L(\widehat f)-L(f^*).
$$

它永远 $\ge 0$，等于 0 当且仅当你已经和上帝一样好（在风险意义下）。

---

## 2. 非参数估计框架与误差分解（p.4–6）

把 $(X,Y)$ 写成一般的 $Z\sim\mu_Z$，损失写成 $\ell(f,Z)$。回归例子：

$$
Y=f_0(X)+\epsilon,\quad \mathbb{E}[\epsilon\mid X]=0,\quad \ell(f,Z)=(f(X)-Y)^2,
$$

此时 $f^*=f_0$。

### 2.1 四个对象（p.6 的 $u$ 语言）

讲义用 $u$ 表示「解」，监督学习里就是 $f$：

| 符号 | 意义 | 人话 |
|------|------|------|
| $u_o$ / $f^*$ | 问题的神谕解 | 真正最好的预测规则 |
| $u^*$ | 连续（总体）层的模型解 | 有时指模型方程的总体版 |
| $\bar u$ / $\bar f$ | 工作类 $\mathcal{F}$（或神经网络类）里对 $f^*$ 的最佳逼近 | 「模型能力允许的最好」 |
| $\widehat u$ / $\widehat f$ | 样本上的 ERM | 「有限数据上算出来的最好」 |
| $u_A$ / $f_A(\tau)$ | 优化算法实际输出 | 「电脑跑完给你的」 |

算法精度 $\tau\ge 0$ 的含义：

$$
\widehat L\bigl(f_A(\tau)\bigr) \;\le\; \widehat L(\widehat f)+\tau.
$$

$\tau=0$ 就是精确 ERM。

逼近误差：

$$
E_{\mathrm{app}} \;=\; L(\bar f)-L(f^*),\qquad
\bar f\in\arg\inf_{f\in\mathcal{F}}L(f).
$$

### 2.2 第一条分解（Esta 形式，p.4）

因为 $\widehat f$ 在 $\mathcal{F}$ 上最小化 $\widehat L$，而 $\bar f\in\mathcal{F}$，

$$
\widehat L(f_A)-\tau \;\le\; \widehat L(\widehat f) \;\le\; \widehat L(\bar f).
$$

两边减 $\widehat L(f^*)$（注意 $f^*$ 不一定在 $\mathcal{F}$ 里，所以 $\widehat L(f^*)$ 只是一个数）：

$$
\widehat L(f_A)-\tau-\widehat L(f^*)
\;\le\;
\widehat L(\bar f)-\widehat L(f^*).
$$

对数据求期望。$\bar f,f^*$ 不依赖数据，故 $\mathbb{E}[\widehat L(\bar f)]=L(\bar f)$，$\mathbb{E}[\widehat L(f^*)]=L(f^*)$。注意 $f_A$ 依赖数据，不能把 $\mathbb{E}[\widehat L(f_A)]$ 换成 $L(f_A)$；但

$$
\mathbb{E}\bigl[\widehat L(f_A)-\widehat L(f^*)\bigr]
\;\le\; E_{\mathrm{app}}+\tau,
$$

而 $\mathbb{E}[\widehat L(f^*)]=L(f^*)$，因此

$$
\mathbb{E}\bigl[\widehat L(f_A)-L(f^*)\bigr] \;\le\; E_{\mathrm{app}}+\tau.
\qquad\text{（*）}
$$

（讲义两边先乘 2，写成 $2\mathbb{E}_D[\widehat L(f_A)-L(f^*)]\le 2E_{\mathrm{app}}+2\tau$。）

定义

$$
E_{\mathrm{sta}} \;:=\; \mathbb{E}_D\bigl[L(f_A)-2\widehat L(f_A)+L(f^*)\bigr].
$$

（讲义写 $\mathbb{E}[L(f^*)-2\widehat L(f_A)+L(f_A)]$，一样。）

**关键恒等式（补全）：**

$$
L(f_A)-L(f^*)
\;=\;
\bigl(L(f_A)-2\widehat L(f_A)+L(f^*)\bigr)
\;+\;
2\bigl(\widehat L(f_A)-L(f^*)\bigr).
$$

右边第一项的期望就是 $E_{\mathrm{sta}}$，第二项用（*）：

$$
\mathbb{E}\bigl[\mathcal{E}(f_A)\bigr]
\;\le\;
E_{\mathrm{sta}} + 2E_{\mathrm{app}} + 2\tau.
$$

$E_{\mathrm{sta}}$ 看起来古怪，它的好处是：中心化以后可以用 **Bernstein 不等式**（方差和超额风险成正比），得到比「均匀偏差 $2\sup|L-\widehat L|$」更紧的速率。Lec2 会做这件事。

讲义还引入 ghost sample（独立的一份拷贝 $D'$）和

$$
g(f,Z)=\ell(f,Z)-\ell(f^*,Z),\qquad
G(f,Z)=\mathbb{E}_{D'}[g(f,Z')]-2g(f,Z),
$$

于是 $E_{\mathrm{sta}}=\mathbb{E}[\frac1n\sum_i G(f_A,Z_i)]$。这是为 Lec2 的 Esta 界做准备。

### 2.3 第二条分解（泛化误差形式，p.5）

把超额风险拆成五段：

$$
\begin{aligned}
L(f_A)-L(f^*)
&=
\bigl(L(f_A)-\widehat L(f_A)\bigr)
+
\bigl(\widehat L(f_A)-\widehat L(\widehat f)\bigr)
+
\bigl(\widehat L(\widehat f)-\widehat L(\bar f)\bigr)\\
&\quad+
\bigl(\widehat L(\bar f)-L(\bar f)\bigr)
+
\bigl(L(\bar f)-L(f^*)\bigr).
\end{aligned}
$$

- 第三段 $\le 0$（$\widehat f$ 是经验最小）；
- 第二段 $\le\tau$（算法精度），记 $E_{\mathrm{opt}}$；
- 第五段 $=E_{\mathrm{app}}$；
- 第一、四段各自 $\le \sup_{f\in\mathcal{F}}|L(f)-\widehat L(f)|$，合起来 $\le 2\sup|\cdots|$，记 $E_{\mathrm{gen}}$。

所以

$$
L(f_A)-L(f^*)
\;\le\;
E_{\mathrm{gen}}+E_{\mathrm{app}}+E_{\mathrm{opt}}.
$$

**两种分解的差别：** $E_{\mathrm{gen}}$ 是最坏函数的均匀偏差，对「很尖」的损失往往多付一个 $\sqrt{\log|\mathcal{F}|/n}$ 甚至更差的因子；$E_{\mathrm{sta}}$ 利用局部强凸，常能得到更快的 $1/n$ 型速率。Lec1 的线性高斯模型两种都能精确算。

---

## 3. 固定设计普通最小二乘（p.7）

### 3.1 模型

$n$ 个样本、$d$ 个特征，$n\ge d$。写成矩阵：

$$
Y = X\theta^* + \varepsilon,\qquad \varepsilon\sim N(0,\sigma^2 I_n).
$$

- $X\in\mathbb{R}^{n\times d}$：第 $i$ 行是 $x_i^\top$。**固定设计**意味着 $X$ 当成非随机的已知矩阵（实验设计里你选定了测哪些 $x$）。随机设计要把 $X$ 的随机性再平均进去，更难（讲义引用 Hsu–Kakade–Zhang 2014）。
- $\Sigma := \frac1n X^\top X\in\mathbb{R}^{d\times d}$。这是特征的经验协方差（差一个中心化）。

单点风险（对一个独立的新样本，且 $\theta$ 与新噪声独立）：

$$
L(\theta)=\mathbb{E}\bigl[(x^\top\theta-y)^2\bigr].
$$

**补全计算。** $y=x^\top\theta^*+\epsilon$，$\mathbb{E}[\epsilon]=0$，且 $\theta$ 与 $\epsilon$ 独立：

$$
\begin{aligned}
L(\theta)
&= \mathbb{E}\bigl[(x^\top(\theta-\theta^*)-\epsilon)^2\bigr]\\
&= \mathbb{E}\bigl[(x^\top(\theta-\theta^*))^2\bigr] + \mathbb{E}[\epsilon^2]
\quad\text{（交叉项 }-2\mathbb{E}[x^\top(\theta-\theta^*)\epsilon]=0\text{）}\\
&= (\theta-\theta^*)^\top\mathbb{E}[xx^\top](\theta-\theta^*) + \sigma^2\\
&= \|\theta-\theta^*\|_{\mathbb{E}[\Sigma]}^2 + \sigma^2.
\end{aligned}
$$

因此 $L(\theta^*)=\sigma^2$，超额风险就是 $\|\theta-\theta^*\|_{\mathbb{E}[\Sigma]}^2$。固定设计时 $\Sigma$ 非随机，

$$
\mathcal{E}(\theta) \;=\; \|\theta-\theta^*\|_\Sigma^2 \;=\; (\theta-\theta^*)^\top\Sigma(\theta-\theta^*)
\;=\; \frac1n\|X(\theta-\theta^*)\|_2^2.
$$

### 3.2 最小二乘解

$$
\widehat\theta_{\mathrm{ls}} \;\in\; \arg\min_\theta \frac1n\|Y-X\theta\|_2^2 \;=\; X^\dagger Y,
$$

其中 $X^\dagger$ 是 Moore–Penrose 伪逆（附录 A）。若 $X$ 列满秩，$X^\dagger=(X^\top X)^{-1}X^\top$，这就是正规方程。

记 $r=\mathrm{rank}(X^\top X)=\mathrm{rank}(X)$，$\Pi$ 为到 $\mathrm{range}(X)$（$X$ 的列空间）上的**正交投影**。正交投影满足 $\Pi^2=\Pi=\Pi^\top$，且 $\Pi X=X$。最小二乘拟合值 $X\widehat\theta_{\mathrm{ls}}=\Pi Y$。

### 3.3 精确期望误差

$$
\begin{aligned}
\frac1n\|X\widehat\theta_{\mathrm{ls}}-X\theta^*\|_2^2
&= \frac1n\|\Pi Y - X\theta^*\|_2^2
= \frac1n\|\Pi(X\theta^*+\varepsilon)-X\theta^*\|_2^2\\
&= \frac1n\|\Pi\varepsilon\|_2^2
= \frac1n \varepsilon^\top\Pi\varepsilon
= \frac1n\mathrm{tr}(\Pi\varepsilon\varepsilon^\top).
\end{aligned}
$$

最后一步：标量 $\varepsilon^\top\Pi\varepsilon=\mathrm{tr}(\varepsilon^\top\Pi\varepsilon)=\mathrm{tr}(\Pi\varepsilon\varepsilon^\top)$（$\mathrm{tr}(AB)=\mathrm{tr}(BA)$）。

取期望，$\mathbb{E}[\varepsilon\varepsilon^\top]=\sigma^2 I$，且 $\mathrm{tr}(\Pi)=r$（投影的迹等于像空间维数）：

$$
\mathbb{E}\bigl[\mathcal{E}(\widehat\theta_{\mathrm{ls}})\bigr]
= \frac1n\mathrm{tr}(\Pi\sigma^2 I)
= \frac{r\sigma^2}{n}.
$$

**这是精确等式，不是不等式。** 自由度有多少（有效参数个数 $r$），误差就按 $r/n$ 降。

若 $r=d$ 且 $\Sigma\succ 0$，则 $\|\widehat\theta_{\mathrm{ls}}-\theta^*\|_\Sigma^2\ge\lambda_{\min}(\Sigma)\|\widehat\theta_{\mathrm{ls}}-\theta^*\|_2^2$，故

$$
\|\widehat\theta_{\mathrm{ls}}-\theta^*\|_2^2
\le \frac{1}{\lambda_{\min}(\Sigma)}\|\widehat\theta_{\mathrm{ls}}-\theta^*\|_\Sigma^2,
$$

取期望并代入 $\mathbb{E}[\mathcal{E}(\widehat\theta_{\mathrm{ls}})]=d\sigma^2/n$，

$$
\mathbb{E}\bigl[\|\widehat\theta_{\mathrm{ls}}-\theta^*\|_2^2\bigr]
\;\le\;
\frac{d\sigma^2}{n\lambda_{\min}(\Sigma)}.
$$

**误区：** $\lambda_{\min}(\Sigma)$ 很小（特征共线）时，欧氏误差会爆炸，但预测误差 $\|\cdot\|_\Sigma^2$ 仍然是 $d\sigma^2/n$。预测和参数估计不是一回事。

---

## 4. Ridge（$\ell_2$ 正则，p.8–9）

### 4.1 定义与闭式

$$
\widehat\theta_r \;=\; \arg\min_{\theta\in\mathbb{R}^d}
\frac1n\|X\theta-Y\|_2^2 + \lambda\|\theta\|_2^2.
$$

对 $\theta$ 求导并令为零：

$$
\frac2n X^\top(X\theta-Y)+2\lambda\theta=0
\;\Longrightarrow\;
\bigl(\tfrac1n X^\top X+\lambda I\bigr)\theta = \tfrac1n X^\top Y.
$$

记 $\Sigma_\lambda := \Sigma+\lambda I=\frac1n X^\top X+\lambda I$（永远可逆，即使 $d>n$），

$$
\widehat\theta_r = \Sigma_\lambda^{-1}\bigl(\tfrac1n X^\top Y\bigr).
$$

**贝叶斯解释（补全）。** 若先验 $\theta\sim N(0,\tau^2 I)$，似然 $Y\mid\theta\sim N(X\theta,\sigma^2 I)$，则后验均值恰是 Ridge，且

$$
\lambda \;=\; \frac{\sigma^2}{n\tau^2}.
$$

$\lambda$ 大 = 你先验认为 $\theta$ 靠近 0 = 收缩得更狠。

### 4.2 偏差–方差分解

对任意随机向量，$\mathbb{E}[\|Z-a\|_\Sigma^2]=\mathbb{E}[\|Z-\mathbb{E}Z\|_\Sigma^2]+\|\mathbb{E}Z-a\|_\Sigma^2$（交叉项为 0，因为 $\Sigma$ 固定）。取 $Z=\widehat\theta_r$，$a=\theta^*$：

$$
\mathbb{E}\bigl[\|\widehat\theta_r-\theta^*\|_\Sigma^2\bigr]
= \underbrace{\mathbb{E}\bigl[\|\widehat\theta_r-\mathbb{E}\widehat\theta_r\|_\Sigma^2\bigr]}_{\mathrm{Var}}
+ \underbrace{\|\mathbb{E}\widehat\theta_r-\theta^*\|_\Sigma^2}_{\mathrm{Bias}^2}.
$$

讲义：令 $X=USV^\top$（SVD）。则

$$
\Sigma=\frac1n X^\top X=\frac1n V(S^\top S)V^\top.
$$

$V$ 正交，故可换到 $V$ 的坐标里算（$\|\cdot\|_\Sigma^2$ 与 $\mathbb{E}[\widehat\theta_r]$ 都随同一个正交变换变）。在这组坐标里

$$
\Sigma=\mathrm{diag}(\tau_1,\ldots,\tau_r,0,\ldots,0),\qquad
\tau_j=\frac{s_j^2}{n}
$$

（$\tau_j$ 是 $\Sigma$ 的特征值，不是噪声）。$\theta^*$ 的分量仍写作 $\theta_j^*$。同时

$$
\Sigma_\lambda=\Sigma+\lambda I=\mathrm{diag}(\tau_1+\lambda,\ldots,\tau_r+\lambda,\lambda,\ldots,\lambda)
$$

可逆，且 $\Sigma_\lambda^{-1}\Sigma=\mathrm{diag}\bigl(\frac{\tau_1}{\tau_1+\lambda},\ldots,\frac{\tau_r}{\tau_r+\lambda},0,\ldots,0\bigr)$。

闭式 $\widehat\theta_r=\Sigma_\lambda^{-1}n^{-1}X^\top Y=\Sigma_\lambda^{-1}n^{-1}X^\top(X\theta^*+\varepsilon)$，故

$$
\mathbb{E}[\widehat\theta_r]
=\Sigma_\lambda^{-1}n^{-1}X^\top X\theta^*
=\Sigma_\lambda^{-1}\Sigma\theta^*,
$$

（$\mathbb{E}[\varepsilon]=0$）。在特征坐标里第 $j$ 个分量

$$
\mathbb{E}[(\widehat\theta_r)_j]
=\frac{\tau_j}{\tau_j+\lambda}\theta_j^*
\qquad\bigl(j\le r\bigr),\qquad
\mathbb{E}[(\widehat\theta_r)_j]=0\quad\bigl(j>r,\;\tau_j=0\bigr).
$$

第 $j$ 个可观测方向被乘上收缩因子 $\frac{\tau_j}{\tau_j+\lambda}<1$。

偏差用 $\|w\|_\Sigma^2=w^\top\Sigma w=\sum_j\tau_j w_j^2$：对 $j\le r$，

$$
\mathbb{E}[(\widehat\theta_r)_j]-\theta_j^*
=\Bigl(\frac{\tau_j}{\tau_j+\lambda}-1\Bigr)\theta_j^*
=-\frac{\lambda}{\tau_j+\lambda}\theta_j^*,
$$

对 $j>r$ 有 $\tau_j=0$，该项对 $\|\cdot\|_\Sigma^2$ 贡献为 0。因此

$$
\mathrm{Bias}^2
=\sum_{j=1}^r\tau_j\Bigl(\frac{\tau_j}{\tau_j+\lambda}\theta_j^*-\theta_j^*\Bigr)^2
=\sum_{j=1}^r\frac{\tau_j\lambda^2(\theta_j^*)^2}{(\tau_j+\lambda)^2}.
$$

**两个极端：**

- $\lambda=0$：不收缩，Bias = 0（在 $\tau_j>0$ 的方向）；
- $\lambda\to\infty$：$\widehat\theta_r\to 0$，Bias$^2\to\|\theta^*\|_\Sigma^2$。

方差。中心化后只剩噪声：

$$
\widehat\theta_r-\mathbb{E}\widehat\theta_r=\Sigma_\lambda^{-1}n^{-1}X^\top\varepsilon.
$$

二次型 $\|Av\|_\Sigma^2=v^\top A^\top\Sigma A v$，并 $\mathbb{E}[v^\top Q v]=\mathrm{tr}(Q\,\mathbb{E}[vv^\top])$（标量 $v^\top Q v=\mathrm{tr}(v^\top Q v)=\mathrm{tr}(Q vv^\top)$）：

$$
\begin{aligned}
\mathrm{Var}
&= \mathbb{E}\bigl[\|\Sigma_\lambda^{-1}n^{-1}X^\top\varepsilon\|_\Sigma^2\bigr]
= n^{-2}\mathbb{E}\bigl[\varepsilon^\top X\Sigma_\lambda^{-1}\Sigma\Sigma_\lambda^{-1}X^\top\varepsilon\bigr]\\
&= n^{-2}\mathrm{tr}\bigl(\Sigma_\lambda^{-1}\Sigma\Sigma_\lambda^{-1}X^\top\mathbb{E}[\varepsilon\varepsilon^\top]X\bigr).
\end{aligned}
$$

$\mathbb{E}[\varepsilon\varepsilon^\top]=\sigma^2 I_n$，且 $X^\top X=n\Sigma$，故

$$
n^{-2}\sigma^2\mathrm{tr}\bigl(\Sigma_\lambda^{-1}\Sigma\Sigma_\lambda^{-1}X^\top X\bigr)
=n^{-2}\sigma^2\mathrm{tr}\bigl(\Sigma_\lambda^{-1}\Sigma\Sigma_\lambda^{-1}\cdot n\Sigma\bigr)
=\frac{\sigma^2}{n}\mathrm{tr}\bigl(\Sigma_\lambda^{-1}\Sigma\Sigma_\lambda^{-1}\Sigma\bigr).
$$

特征坐标里 $\Sigma_\lambda^{-1}\Sigma\Sigma_\lambda^{-1}\Sigma$ 的对角元是 $\frac{\tau_j}{\tau_j+\lambda}\cdot\frac{\tau_j}{\tau_j+\lambda}=\frac{\tau_j^2}{(\tau_j+\lambda)^2}$（$j\le r$；其余为 0），因此

$$
\mathrm{Var}
=\frac{\sigma^2}{n}\sum_{j=1}^r\frac{\tau_j^2}{(\tau_j+\lambda)^2}.
$$

$\lambda\uparrow$ 时每一项变小：正则化减小方差、增大偏差。

### 4.3 不求精确最优 $\lambda$ 的可算上界（p.9）

精确最小化 $\mathrm{Bias}^2+\mathrm{Var}$ 依赖未知的 $\theta^*$。改用更松、但可写闭式的界。

**引理（初等不等式）。** 对 $\tau,\lambda>0$，

$$
\frac{\tau\lambda^2}{(\tau+\lambda)^2}\le\frac\lambda2,
\qquad
\frac{\tau^2}{(\tau+\lambda)^2}\le\frac{\tau}{2\lambda}.
$$

证明：第一式 $\Leftrightarrow 2\tau\lambda\le(\tau+\lambda)^2=\tau^2+2\tau\lambda+\lambda^2\Leftrightarrow 0\le\tau^2+\lambda^2$。第二式 $\Leftrightarrow 2\lambda\tau\le(\tau+\lambda)^2$ 同样成立。$\tau=0$ 显然。

因此

$$
\mathrm{Bias}^2 \le \sum_j \frac\lambda2(\theta_j^*)^2 = \frac\lambda2\|\theta^*\|_2^2,
\qquad
\mathrm{Var} \le \frac{\sigma^2}{n}\sum_j\frac{\tau_j}{2\lambda} = \frac{\mathrm{tr}(\Sigma)\sigma^2}{2n\lambda}.
$$

于是

$$
\mathbb{E}[\mathcal{E}(\widehat\theta_r)]
\le \frac\lambda2\|\theta^*\|_2^2 + \frac{\mathrm{tr}(\Sigma)\sigma^2}{2n\lambda}.
$$

对 $\lambda$ 用 AM-GM：$\frac\lambda2\|\theta^*\|_2^2+\frac{\mathrm{tr}(\Sigma)\sigma^2}{2n\lambda}\ge 2\sqrt{\frac\lambda2\|\theta^*\|_2^2\cdot\frac{\mathrm{tr}(\Sigma)\sigma^2}{2n\lambda}}=\sqrt{\|\theta^*\|_2^2\mathrm{tr}(\Sigma)\sigma^2/n}$，等号当

$$
\lambda^* \;=\; \sqrt{\frac{\mathrm{tr}(\Sigma)\sigma^2}{n\|\theta^*\|_2^2}}
$$

时取到，于是

$$
\mathbb{E}[\mathcal{E}(\widehat\theta_r)]
\;\le\;
\sqrt{\frac{\|\theta^*\|_2^2\,\mathrm{tr}(\Sigma)\,\sigma^2}{n}}.
$$

（讲义把 $\mathrm{tr}(\Sigma)$ 有时写成 $\mathrm{tr}(P)$，同一意思。）

**怎么读这个界：**

- 它比 OLS 的 $\frac{r\sigma^2}{n}$ **更差**（多了 $\|\theta^*\|_2$ 这种未知半径，速率变成 $n^{-1/2}$ 型如果把 $\|\theta^*\|$ 当常数）；
- 但它在 $d\gg n$（$\Sigma$ 不可逆、OLS 不唯一）时仍然有定义；
- 现代「双下降」现象说明 $\lambda\to 0^+$ 的 ridgeless 在过参数化时也可以很好，见 Bartlett–Long–Lugosi–Tsigler 2019，Hastie–Montanari–Rosset–Tibshirani 2019。这超出 Lec1 计算范围。

---

## 5. OLS 的高概率界（p.9 下半）

期望误差是 $\frac{r\sigma^2}{n}$。我们还要「以 $1-\delta$ 的概率，误差不超过什么」。工具：次高斯 + 并集 / 集中。

### 5.1 从最优性推出基本不等式

$\widehat\theta_{\mathrm{ls}}$ 是无约束最小二乘，所以 $\|Y-X\widehat\theta_{\mathrm{ls}}\|_2^2\le\|Y-X\theta^*\|_2^2=\|\varepsilon\|_2^2$。展开左边：

$$
\|Y-X\widehat\theta_{\mathrm{ls}}\|_2^2
= \|X\theta^*+\varepsilon-X\widehat\theta_{\mathrm{ls}}\|_2^2
= \|X(\widehat\theta_{\mathrm{ls}}-\theta^*)\|_2^2 - 2\varepsilon^\top X(\widehat\theta_{\mathrm{ls}}-\theta^*) + \|\varepsilon\|_2^2.
$$

与 $\|\varepsilon\|_2^2$ 比较，得到

$$
\|X(\widehat\theta_{\mathrm{ls}}-\theta^*)\|_2^2
\;\le\;
2\varepsilon^\top X(\widehat\theta_{\mathrm{ls}}-\theta^*).
$$

记 $v=X(\widehat\theta_{\mathrm{ls}}-\theta^*)$。若 $v=0$ 已经结束。否则两边除以 $\|v\|_2$：

$$
\|v\|_2 \;\le\; 2\,\frac{\varepsilon^\top v}{\|v\|_2}.
$$

$v$ 落在 $\mathrm{range}(X)$ 里。令 $\Phi\in\mathbb{R}^{n\times r}$ 为 $\mathrm{range}(X)$ 的标准正交基（$\Phi^\top\Phi=I_r$），则 $v=\Phi\nu$ 对某个 $\nu\in\mathbb{R}^r$，且 $\|v\|_2=\|\nu\|_2$。于是

$$
\frac{\varepsilon^\top v}{\|v\|_2} = \tilde\varepsilon^\top \frac{\nu}{\|\nu\|_2}
\;\le\; \sup_{\|u\|_2\le 1}\tilde\varepsilon^\top u
= \|\tilde\varepsilon\|_2,
$$

其中 $\tilde\varepsilon=\Phi^\top\varepsilon\in\mathbb{R}^r$。因此

$$
\|X(\widehat\theta_{\mathrm{ls}}-\theta^*)\|_2 \;\le\; 2\|\tilde\varepsilon\|_2
\;=\; 2\sup_{\|u\|_2\le 1}\tilde\varepsilon^\top u.
$$

（讲义在球 $B_2$ 上取 $\sup$，一样。）

### 5.2 $\tilde\varepsilon$ 是次高斯向量

对任意单位向量 $u\in\mathbb{S}^{r-1}$，$\|\Phi u\|_2=1$，故 $\varepsilon^\top\Phi u$ 是标准高斯（或次高斯）的一维投影：

$$
\mathbb{E}\bigl[e^{s\tilde\varepsilon^\top u}\bigr]
= \mathbb{E}\bigl[e^{s\varepsilon^\top(\Phi u)}\bigr]
\le \exp\bigl(\tfrac{s^2\sigma^2}{2}\bigr).
$$

这正是「$\tilde\varepsilon\sim\mathrm{subG}_r(\sigma^2)$」的定义：每个一维投影都是参数 $\sigma^2$ 的次高斯。高斯 $N(0,\sigma^2 I)$ 是特例。

### 5.3 控制 $\|\tilde\varepsilon\|_2$（补全讲义的常数）

**方法 A（$\varepsilon$-网，适合小白，常数稍松）。**  
单位球面 $\mathbb{S}^{r-1}$ 的 $\frac12$-覆盖数 $\le 5^r$（附录 B 覆盖数：$N(B_2,\|\cdot\|_2,\varepsilon)\le(1+2/\varepsilon)^d$）。设 $\mathcal{N}$ 为 $\frac12$-网。对任意 $\|u\|_2=1$，取 $u_0\in\mathcal{N}$ 使 $\|u-u_0\|_2\le 1/2$，则

$$
\|\tilde\varepsilon\|_2 = \sup_{\|u\|=1}\tilde\varepsilon^\top u
\le \sup_{u_0\in\mathcal{N}}\tilde\varepsilon^\top u_0 + \tfrac12\|\tilde\varepsilon\|_2,
$$

故 $\|\tilde\varepsilon\|_2\le 2\max_{u_0\in\mathcal{N}}\tilde\varepsilon^\top u_0$。

一维次高斯尾（附录 B）：$\mathbb{P}(\tilde\varepsilon^\top u_0>t)\le\exp(-t^2/(2\sigma^2))$。并集界：

$$
\mathbb{P}\bigl(\max_{\mathcal{N}}\tilde\varepsilon^\top u_0 > t\bigr)
\le |\mathcal{N}|\,e^{-t^2/(2\sigma^2)}
\le e^{r\log 5 - t^2/(2\sigma^2)}.
$$

令右边 $=\delta/2$（再对 $-\tilde\varepsilon$ 同样，或直接用双边），取

$$
t \;=\; \sigma\sqrt{2r\log 5 + 2\log(2/\delta)},
$$

则以概率 $\ge 1-\delta$，

$$
\|\tilde\varepsilon\|_2 \;\le\; 2t
\;\le\; C\sigma\bigl(\sqrt{r}+\sqrt{\log(1/\delta)}\bigr).
$$

附录 B 用 $6^r$-网把同一件事写成：以概率 $\ge 1-\delta$，

$$
\|\tilde\varepsilon\|_2=\sup_{\|u\|_2\le 1}\tilde\varepsilon^\top u
\le 4\sigma\sqrt{r}+2\sigma\sqrt{2\log(1/\delta)}.
$$

再乘基本不等式里的 2，就是讲义的

$$
\|X(\widehat\theta_{\mathrm{ls}}-\theta^*)\|_2
\;\le\;
2\|\tilde\varepsilon\|_2
\;\le\;
8\sigma\sqrt{r}+4\sigma\sqrt{2\log(1/\delta)}.
$$

数量级是 $\sigma(\sqrt{r}+\sqrt{\log(1/\delta)})$。

因此

$$
\|\widehat\theta_{\mathrm{ls}}-\theta^*\|_\Sigma^2
= \frac1n\|X(\widehat\theta_{\mathrm{ls}}-\theta^*)\|_2^2
\;\lesssim\;
\frac{\sigma^2\bigl(r+\log(1/\delta)\bigr)}{n}
\quad\text{w.h.p.}
$$

若 $r=d$，

$$
\|\widehat\theta_{\mathrm{ls}}-\theta^*\|_2^2
\;\lesssim\;
\frac{\sigma^2\bigl(d+\log(1/\delta)\bigr)}{n\lambda_{\min}(\Sigma)}.
$$

与期望界 $\frac{d\sigma^2}{n}$ 相比，高概率界只多了一个 $\log(1/\delta)$。

---

## 6. Minimax 下界（p.10）

上界说：OLS 能做到 $\frac{d\sigma^2}{n}$。会不会有更神的算法 $A:Y\mapsto\mathbb{R}^d$，在所有 $\theta^*$ 上都更好？minimax 说：**没有。**

### 6.1  minimax 风险

$$
T \;=\; \inf_{A}\sup_{\theta^*\in\mathbb{R}^d}\mathbb{E}_{\theta^*}\bigl[\|A(Y)-\theta^*\|_\Sigma^2\bigr].
$$

先把 $\sup_{\theta^*}$ 换成对 $\theta^*$ 的一个先验再平均（平均 $\le$ 最坏，所以这是下界）：

取 $\theta^*\sim N\bigl(0,\frac{\sigma^2}{\lambda n}I\bigr)$ 与 $\varepsilon\sim N(0,\sigma^2 I)$ 独立，$Y=X\theta^*+\varepsilon$。则

$$
T \;\ge\; \mathbb{E}_{\theta^*,\varepsilon}\bigl[\|A(Y)-\theta^*\|_\Sigma^2\bigr].
$$

右边对 $A$ 的最小，是给定 $Y$ 后 $\theta^*$ 的后验均值（$L^2$ 贝叶斯估计）：

$$
A^*(y)=\mathbb{E}[\theta^*\mid Y=y].
$$

### 6.2 作业：高斯条件分布（完整补全）

**引理（讲义 HW）。** $(Y,Z)$ 联合高斯，均值 $\mu=(\mu_Y,\mu_Z)$，协方差分块

$$
\Sigma=\begin{pmatrix}\Sigma_{YY}&\Sigma_{YZ}\\ \Sigma_{ZY}&\Sigma_{ZZ}\end{pmatrix}\succeq 0
$$

且 $\Sigma_{YY}$ 可逆。则

$$
Z\mid Y=y \;\sim\; N(\mu_{Z|Y},\Sigma_{Z|Y}),
$$

$$
\mu_{Z|Y}=\mu_Z+\Sigma_{ZY}\Sigma_{YY}^{-1}(y-\mu_Y),\qquad
\Sigma_{Z|Y}=\Sigma_{ZZ}-\Sigma_{ZY}\Sigma_{YY}^{-1}\Sigma_{YZ}.
$$

**证明。** 先中心化：$\widetilde Y=Y-\mu_Y$，$\widetilde Z=Z-\mu_Z$。联合高斯的平移仍联合高斯，且

$$
\mathrm{Cov}(\widetilde Y)=\Sigma_{YY},\quad
\mathrm{Cov}(\widetilde Z,\widetilde Y)=\Sigma_{ZY},\quad
\mathrm{Cov}(\widetilde Z)=\Sigma_{ZZ}.
$$

令 $A=\Sigma_{ZY}\Sigma_{YY}^{-1}$，$W=\widetilde Z-A\widetilde Y$。$(W,\widetilde Y)$ 是 $(\widetilde Z,\widetilde Y)$ 的线性变换，故仍联合高斯。交叉协方差

$$
\mathrm{Cov}(W,\widetilde Y)
=\mathbb{E}\bigl[(\widetilde Z-A\widetilde Y)\widetilde Y^\top\bigr]
=\Sigma_{ZY}-A\Sigma_{YY}
=\Sigma_{ZY}-\Sigma_{ZY}\Sigma_{YY}^{-1}\Sigma_{YY}
=0.
$$

零均值联合高斯若互不相关则独立，故 $W\perp\widetilde Y$（也即 $W\perp Y$）。改写

$$
\widetilde Z=W+A\widetilde Y
\qquad\Longrightarrow\qquad
Z=\mu_Z+W+\Sigma_{ZY}\Sigma_{YY}^{-1}(Y-\mu_Y).
$$

条件于 $Y=y$，右边除 $W$ 外都是常数，而 $W$ 的分布不依赖 $Y$，因此 $Z\mid Y=y$ 仍高斯，均值

$$
\mu_{Z|Y}
=\mu_Z+\Sigma_{ZY}\Sigma_{YY}^{-1}(y-\mu_Y)
$$

（$\mathbb{E}W=0$）。条件协方差等于 $\mathrm{Cov}(W)$：

$$
\begin{aligned}
\mathrm{Cov}(W)
&=\mathbb{E}\bigl[(\widetilde Z-A\widetilde Y)(\widetilde Z-A\widetilde Y)^\top\bigr]\\
&=\Sigma_{ZZ}-A\Sigma_{YZ}-\Sigma_{ZY}A^\top+A\Sigma_{YY}A^\top.
\end{aligned}
$$

代入 $A=\Sigma_{ZY}\Sigma_{YY}^{-1}$（于是 $A^\top=\Sigma_{YY}^{-1}\Sigma_{YZ}$）：

$$
A\Sigma_{YZ}=\Sigma_{ZY}\Sigma_{YY}^{-1}\Sigma_{YZ},\qquad
A\Sigma_{YY}A^\top=\Sigma_{ZY}\Sigma_{YY}^{-1}\Sigma_{YZ},
$$

故三项里后三个合成 $-\Sigma_{ZY}\Sigma_{YY}^{-1}\Sigma_{YZ}$，即

$$
\Sigma_{Z|Y}=\Sigma_{ZZ}-\Sigma_{ZY}\Sigma_{YY}^{-1}\Sigma_{YZ}.
$$

把平移加回去即得原公式。$\square$

**联合协方差（讲义那块矩阵）。** 模型 $Y=X\theta^*+\varepsilon$，$\theta^*\sim N\bigl(0,\frac{\sigma^2}{\lambda n}I_d\bigr)$ 与 $\varepsilon\sim N(0,\sigma^2 I_n)$ 独立。$(Y,\theta^*)$ 是 $(\theta^*,\varepsilon)$ 的线性像，故零均值联合高斯。逐块算：

$$
\mathrm{Cov}(\theta^*)
=\mathbb{E}[\theta^*\theta^{*\top}]
=\frac{\sigma^2}{\lambda n}I_d,
$$

$$
\begin{aligned}
\mathrm{Cov}(Y)
&=\mathrm{Cov}(X\theta^*+\varepsilon)
=X\,\mathrm{Cov}(\theta^*)\,X^\top+\mathrm{Cov}(\varepsilon)\\
&=\frac{\sigma^2}{\lambda n}XX^\top+\sigma^2 I_n
=\frac{\sigma^2}{\lambda n}\bigl(XX^\top+n\lambda I_n\bigr),
\end{aligned}
$$

（最后一步用 $\sigma^2 I_n=\frac{\sigma^2}{\lambda n}\cdot n\lambda I_n$）。交叉项

$$
\mathrm{Cov}(Y,\theta^*)
=\mathbb{E}\bigl[(X\theta^*+\varepsilon)\theta^{*\top}\bigr]
=X\,\frac{\sigma^2}{\lambda n}I_d
=\frac{\sigma^2}{\lambda n}X
\qquad(n\times d),
$$

$$
\mathrm{Cov}(\theta^*,Y)=\frac{\sigma^2}{\lambda n}X^\top
\qquad(d\times n).
$$

拼起来正是讲义的

$$
\mathrm{Cov}\begin{pmatrix}Y\\\theta^*\end{pmatrix}
=\frac{\sigma^2}{\lambda n}
\begin{pmatrix}XX^\top+n\lambda I_n & X\\ X^\top & I_d\end{pmatrix}.
$$

**后验均值。** 在引理里取「大 $Y$」=观测 $Y$，「$Z$」=$\theta^*$。则 $\mu_Y=\mu_Z=0$，

$$
\Sigma_{ZY}=\mathrm{Cov}(\theta^*,Y)=\frac{\sigma^2}{\lambda n}X^\top,\qquad
\Sigma_{YY}=\frac{\sigma^2}{\lambda n}(XX^\top+n\lambda I_n).
$$

故

$$
\begin{aligned}
A^*(y)
=\mathbb{E}[\theta^*\mid Y=y]
&=\Sigma_{ZY}\Sigma_{YY}^{-1}y
=\frac{\sigma^2}{\lambda n}X^\top
\Bigl(\frac{\sigma^2}{\lambda n}(XX^\top+n\lambda I_n)\Bigr)^{-1}y\\
&=X^\top(XX^\top+n\lambda I_n)^{-1}y.
\end{aligned}
$$

**推推等式：** $(X^\top X+n\lambda I_d)^{-1}X^\top=X^\top(XX^\top+n\lambda I_n)^{-1}$。两边左乘 $X^\top X+n\lambda I_d$、右乘 $XX^\top+n\lambda I_n$，得到同一矩阵

$$
X^\top(XX^\top+n\lambda I_n)=(X^\top X+n\lambda I_d)X^\top=X^\top XX^\top+n\lambda X^\top.
$$

$n\lambda>0$ 时两边可逆，故原式成立。因此

$$
A^*(y)=(X^\top X+n\lambda I_d)^{-1}X^\top y,
$$

这正是 Ridge（$\Sigma_\lambda=\Sigma+\lambda I$ 那一版：$\widehat\theta_r=(X^\top X+n\lambda I)^{-1}X^\top Y$）。

### 6.3 贝叶斯风险的显式计算（补全）

记 $S=X^\top X=n\Sigma$，$M=(S+n\lambda I)^{-1}$。则

$$
\begin{aligned}
A^*(Y)-\theta^*
&=M X^\top(X\theta^*+\varepsilon)-\theta^*
=M S\theta^*+M X^\top\varepsilon-\theta^*\\
&=M(S+n\lambda I)\theta^*-n\lambda M\theta^*+M X^\top\varepsilon-\theta^*\\
&=M X^\top\varepsilon-n\lambda M\theta^*.
\end{aligned}
$$

（中间用了 $M(S+n\lambda I)=I$。）$\varepsilon\perp\theta^*$ 且 $\mathbb{E}[\varepsilon]=0$，交叉项

$$
\mathbb{E}\bigl[(M X^\top\varepsilon)^\top\Sigma(n\lambda M\theta^*)\bigr]
=n\lambda\,\mathbb{E}\bigl[\varepsilon^\top X M\Sigma M\theta^*\bigr]
=0,
$$

于是贝叶斯风险 $=$ 偏差项 $+$ 方差项。对二次型用 $\mathbb{E}[U^\top Q U]=\mathrm{tr}(Q\,\mathbb{E}[UU^\top])$。

**偏差项。** $\mathbb{E}[\theta^*\theta^{*\top}]=\frac{\sigma^2}{\lambda n}I$，且 $M=n^{-1}(\Sigma+\lambda I)^{-1}$（因为 $S+n\lambda I=n(\Sigma+\lambda I)$）：

$$
\begin{aligned}
\mathbb{E}\bigl[\|n\lambda M\theta^*\|_\Sigma^2\bigr]
&=n^2\lambda^2\mathbb{E}\bigl[\theta^{*\top}M\Sigma M\theta^*\bigr]
=n^2\lambda^2\mathrm{tr}\bigl(M\Sigma M\cdot\tfrac{\sigma^2}{\lambda n}I\bigr)\\
&=n\lambda\sigma^2\mathrm{tr}(M\Sigma M)
=n\lambda\sigma^2\cdot n^{-2}\mathrm{tr}\bigl[(\Sigma+\lambda I)^{-1}\Sigma(\Sigma+\lambda I)^{-1}\bigr]\\
&=\frac{\sigma^2\lambda}{n}\mathrm{tr}\bigl[(\Sigma+\lambda I)^{-2}\Sigma\bigr].
\end{aligned}
$$

（$\Sigma$ 与 $\Sigma+\lambda I$ 可交换，故 $(\Sigma+\lambda I)^{-1}\Sigma(\Sigma+\lambda I)^{-1}=(\Sigma+\lambda I)^{-2}\Sigma$。）讲义把同一式写成 $\frac{\sigma^2}{n\lambda}\lambda^2\mathrm{tr}[(\Sigma+\lambda I)^{-2}\Sigma]$。

**方差项。** $\mathbb{E}[\varepsilon\varepsilon^\top]=\sigma^2 I_n$：

$$
\begin{aligned}
\mathbb{E}\bigl[\|M X^\top\varepsilon\|_\Sigma^2\bigr]
&=\mathbb{E}\bigl[\varepsilon^\top X M\Sigma M X^\top\varepsilon\bigr]
=\sigma^2\mathrm{tr}(X M\Sigma M X^\top)
=\sigma^2\mathrm{tr}(M\Sigma M\cdot X^\top X)\\
&=\sigma^2\mathrm{tr}(M\Sigma M\cdot n\Sigma)
=n\sigma^2\cdot n^{-2}\mathrm{tr}\bigl[(\Sigma+\lambda I)^{-2}\Sigma^2\bigr]
=\frac{\sigma^2}{n}\mathrm{tr}\bigl[(\Sigma+\lambda I)^{-2}\Sigma^2\bigr].
\end{aligned}
$$

**相加。** $\lambda\Sigma+\Sigma^2=\Sigma(\Sigma+\lambda I)=(\Sigma+\lambda I)\Sigma$，故

$$
(\Sigma+\lambda I)^{-2}(\lambda\Sigma+\Sigma^2)=(\Sigma+\lambda I)^{-1}\Sigma,
$$

$$
\frac{\sigma^2}{n}\mathrm{tr}\Bigl[(\Sigma+\lambda I)^{-2}(\lambda\Sigma+\Sigma^2)\Bigr]
=\frac{\sigma^2}{n}\mathrm{tr}\bigl[(\Sigma+\lambda I)^{-1}\Sigma\bigr]
=\frac{\sigma^2}{n}\sum_{j=1}^d\frac{\tau_j}{\tau_j+\lambda}.
$$

令 $\lambda\to 0^+$（先验越来越平，越来越接近「最坏 $\theta^*$ 可以任意远」），若 $\Sigma$ 可逆则每项 $\to 1$，故

$$
T \;\ge\; \frac{d\sigma^2}{n}.
$$

与 OLS 上界 $\frac{d\sigma^2}{n}$ **完全匹配**。所以在固定设计、平方损失、$\|\cdot\|_\Sigma$ 风险下，OLS 是 minimax 最优的。

若 $\mathrm{rank}(\Sigma)=r<d$，则 $\tau_j=0$ 的项贡献 0，下界是 $\frac{r\sigma^2}{n}$，同样匹配。讲义写 $\ge O(d\sigma^2/n)$，是同一件事。

---

## 7. 约束最小二乘（p.11）

若你事先知道 $\theta^*\in K\subset\mathbb{R}^d$（例如「系数稀疏」「系数 $\ell_1$ 有界」），应把估计限制在 $K$ 上：

$$
\widehat\theta_K \;\in\; \arg\min_{\theta\in K}\|Y-X\theta\|_2^2.
$$

### 7.1 基本不等式；$K-K=2K$

$\theta^*\in K$，所以 $\|Y-X\widehat\theta_K\|_2^2\le\|Y-X\theta^*\|_2^2=\|\varepsilon\|_2^2$。与 OLS 同样展开

$$
\|Y-X\widehat\theta_K\|_2^2
=\|X(\widehat\theta_K-\theta^*)\|_2^2-2\varepsilon^\top X(\widehat\theta_K-\theta^*)+\|\varepsilon\|_2^2,
$$

与 $\|\varepsilon\|_2^2$ 比较得

$$
\|X(\widehat\theta_K-\theta^*)\|_2^2
\;\le\;
2\varepsilon^\top X(\widehat\theta_K-\theta^*)
\;\le\;
2\sup_{u\in K-K}\varepsilon^\top X u,
$$

其中 $K-K=\{u-v:u,v\in K\}$（因为 $\widehat\theta_K,\theta^*\in K$）。

**引理。** 若 $K$ 对称（$K=-K$）且凸，则 $K-K=2K$。

**证明。** 先证 $K-K\subset 2K$。取 $u,v\in K$。对称 $\Rightarrow -v\in K$；凸 $\Rightarrow \frac{u+(-v)}{2}\in K$，即 $u-v\in 2K$。  
再证 $2K\subset K-K$。取 $k\in K$，则 $2k=k-(-k)$，且 $-k\in K$，故 $2k\in K-K$。$\square$

于是 $\sup_{u\in K-K}\varepsilon^\top Xu=\sup_{w\in K}\varepsilon^\top X(2w)=2\sup_{w\in K}\varepsilon^\top Xw$，

$$
\|X(\widehat\theta_K-\theta^*)\|_2^2
\;\le\;
4\sup_{u\in K}\varepsilon^\top X u
= 4\sup_{u\in K}\tilde\varepsilon^\top u,
$$

这里 $\tilde\varepsilon=X^\top\varepsilon$（注意与上一节的 $\Phi^\top\varepsilon$ 不同：这里没有归一化到列空间正交基）。

### 7.2 $K=B_1=\{\theta:\|\theta\|_1\le 1\}$（或一般半径，下面把归一化写清楚）

$B_1$ 凸且对称，故 $K-K=2B_1$。极点是 $\{\pm e_j\}_{j=1}^d$ 共 $2d$ 个。线性函数在凸集上的最大在极点达到：

$$
\sup_{\|u\|_1\le 1}\tilde\varepsilon^\top u = \|\tilde\varepsilon\|_\infty = \max_j|\tilde\varepsilon_j|.
$$

假设列已 $\sqrt{n}$-归一化：$\|X_{\cdot j}\|_2\le\sqrt{n}$。则每个

$$
\tilde\varepsilon_j = X_{\cdot j}^\top\varepsilon \;\sim\; \mathrm{subG}(n\sigma^2)
$$

（一维投影：$\mathbb{E}[e^{s\tilde\varepsilon_j}]=\mathbb{E}[e^{s X_{\cdot j}^\top\varepsilon}]\le\exp(s^2\sigma^2\|X_{\cdot j}\|_2^2/2)\le\exp(s^2 n\sigma^2/2)$）。次高斯尾：

$$
\mathbb{P}\bigl(|\tilde\varepsilon_j|>nt\bigr)\le 2\exp\bigl(-\tfrac{(nt)^2}{2n\sigma^2}\bigr)=2\exp\bigl(-\tfrac{nt^2}{2\sigma^2}\bigr).
$$

并集（$d$ 个坐标、双边）：

$$
\mathbb{P}\bigl(\|\tilde\varepsilon\|_\infty > nt\bigr)
\le 2d\exp\bigl(-\tfrac{nt^2}{2\sigma^2}\bigr).
$$

令右边 $=\delta$：$nt^2/(2\sigma^2)=\log(2d/\delta)$，即

$$
t=\sigma\sqrt{\frac{2\log(2d/\delta)}{n}}.
$$

以概率 $\ge 1-\delta$，$\|\tilde\varepsilon\|_\infty\le nt$。代回基本不等式

$$
\|X(\widehat\theta_K-\theta^*)\|_2^2
\le 4\|\tilde\varepsilon\|_\infty
\le 4nt,
$$

除以 $n$：

$$
\|\widehat\theta_K-\theta^*\|_\Sigma^2
=\frac1n\|X(\widehat\theta_K-\theta^*)\|_2^2
\le 4t
=4\sigma\sqrt{\frac{2\log(2d/\delta)}{n}}.
$$

讲义写成 $\lesssim\sigma\sqrt{\log(d/\delta)/n}$（同一数量级）。若约束是 $\|\theta\|_1\le R$ 而非单位球，则 $K-K=2RB_1$，右边多一个 $R$。

OLS 那套「$\|Xv\|_2\le 2\|\Phi^\top\varepsilon\|_2$」对约束 LS 仍然成立（$Xv$ 仍在 $\mathrm{range}(X)$ 里），故讲义同时保留

$$
\|\widehat\theta_K-\theta^*\|_\Sigma^2
\;\lesssim\;
\min\Bigl\{\frac{\sigma^2(r+\log(1/\delta))}{n},\;
\sigma\sqrt{\frac{\log(d/\delta)}{n}}\Bigr\}
\quad\text{w.h.p.}
$$

高维、真正低维结构时，右边的 $\sqrt{\log d/n}$ 比 $\sqrt{d/n}$ 好得多。

### 7.3 $K=B_0(k)=\{\theta:\|\theta\|_0\le k\}$（稀疏球）

这不是凸集，不能用 $K-K=2K$。但两个 $k$-稀疏向量之差最多 $2k$ 个非零：记 $A_k=\mathrm{supp}(\widehat\theta_K-\theta^*)$，则 $|A_k|\le 2k$。

在这个支撑上回到「维数 $\le 2k$ 的 OLS」。令 $\Phi$ 为 $X_{A_k}$ 列空间的标准正交基，$r_k=\mathrm{rank}(X_{A_k})\le 2k$，$X(\widehat\theta_K-\theta^*)=\Phi\nu$，$\tilde\varepsilon_{A_k}=\Phi^\top\varepsilon\sim\mathrm{subG}_{r_k}(\sigma^2)$。与第 5 节完全一样

$$
\|X(\widehat\theta_K-\theta^*)\|_2
\le 2\|\tilde\varepsilon_{A_k}\|_2
=2\sup_{\|v\|_2\le 1}\tilde\varepsilon_{A_k}^\top v
\le
2\max_{A:\,r(A)\le 2k}\;\sup_{\|v\|_2\le 1}\tilde\varepsilon_A^\top v.
$$

**固定 $A$：$\frac12$-网。** $\mathbb{S}^{r_k-1}$（或 $B_2$）的 $\frac12$-网基数 $\le(1+2/(1/2))^{r_k}=5^{r_k}$，讲义写成 $6^{r_k}$。对任意 $\|u\|_2\le 1$ 取网上 $u_0$ 使 $\|u-u_0\|_2\le 1/2$，则

$$
\sup_{\|v\|_2\le 1}\tilde\varepsilon_A^\top v
\le\max_{u_0}\tilde\varepsilon_A^\top u_0+\tfrac12\sup_{\|v\|_2\le 1}\tilde\varepsilon_A^\top v,
$$

故 $\sup\le 2\max_{\mathrm{net}}\tilde\varepsilon_A^\top u_0$。一维次高斯尾 $\mathbb{P}(\tilde\varepsilon_A^\top u_0>t/2)\le\exp\bigl(-(t/2)^2/(2\sigma^2)\bigr)=\exp(-t^2/(8\sigma^2))$，并集

$$
\mathbb{P}\bigl(\sup_{\|v\|_2\le 1}\tilde\varepsilon_A^\top v>t\bigr)
\le 6^{r_k}e^{-t^2/(8\sigma^2)}.
$$

**组合界（讲义红字 $\log(ed/(2k))$）。** 候选支撑至多 $\binom{d}{2k}$ 个（讲义写 $C_d^{2k}$；更精细可对 $|A|\le 2k$ 求和，阶不变）。Stirling $m!\ge(m/e)^m$ 给出

$$
\binom{d}{m}=\frac{d(d-1)\cdots(d-m+1)}{m!}\le\frac{d^m}{m!}\le\Bigl(\frac{ed}{m}\Bigr)^m.
$$

取 $m=2k$（假定 $1\le 2k\le d$）：$\binom{d}{2k}\le\bigl(\frac{ed}{2k}\bigr)^{2k}$。再 $r_k\le 2k$ 故 $6^{r_k}\le 6^{2k}$。并集

$$
\begin{aligned}
\mathbb{P}\bigl(\max_A\sup_v\tilde\varepsilon_A^\top v>t\bigr)
&\le\binom{d}{2k}6^{2k}e^{-t^2/(8\sigma^2)}
\le\Bigl(\frac{ed}{2k}\Bigr)^{2k}6^{2k}e^{-t^2/(8\sigma^2)}\\
&=\exp\Bigl(2k\log\frac{ed}{2k}+2k\log 6-\frac{t^2}{8\sigma^2}\Bigr).
\end{aligned}
$$

令右边 $\le\delta$：

$$
\frac{t^2}{8\sigma^2}
\ge 2k\log\frac{ed}{2k}+2k\log 6+\log\frac1\delta,
$$

即

$$
t^2
\;\gtrsim\;
\sigma^2\Bigl(k\log\frac{ed}{2k}+k\log 6+\log\frac1\delta\Bigr).
$$

（讲义把同一式写成 $t\ge O\bigl(\sigma^2(k\log(ed/(2k))+\cdots)\bigr)$，那是 $t^2$ 的阶。）以概率 $\ge 1-\delta$ 有 $\max_A\sup_v\le t$，于是 $\|X(\widehat\theta_K-\theta^*)\|_2\le 2t$，

$$
\|\widehat\theta_K-\theta^*\|_\Sigma^2
=\frac1n\|X(\widehat\theta_K-\theta^*)\|_2^2
\le\frac{4t^2}{n}
\;\lesssim\;
\frac{\sigma^2 k}{n}\log\frac{ed}{2k}+\frac{\sigma^2 k}{n}\log 6+\frac{\sigma^2}{n}\log\frac1\delta.
$$

**人话：** 若 $\theta^*$ 真的 $k$-稀疏，你又知道 $k$，误差相当于「有效维度 $k\log(d/k)$」的 OLS。多出来的 $\log(d/k)$ 是「不知道哪 $k$ 个坐标非零」的搜寻税。这几乎是 oracle（若上帝告诉你支撑，误差是 $\frac{k\sigma^2}{n}$）再乘对数。

**计算代价：** 枚举所有支撑需要 $\sum_{\ell=1}^k\binom{d}{\ell}(\ell^3+n^2\ell)\ge \Omega(d^k n^2 k)$ 量级，$d$ 稍大就不可能。这引出 Lasso。

---

## 8. Lasso（p.12）

设定：$Y=X\theta^*+\varepsilon$，$\varepsilon\sim N(0,\sigma^2 I)$，**$n\ll d$**。列 $\sqrt{n}$-归一化：$\|X_{\cdot j}\|_2\le\sqrt{n}$。

$$
\widehat\theta_L \;=\; \arg\min_{\theta\in\mathbb{R}^d}
\Bigl\{\frac1{2n}\|Y-X\theta\|_2^2 + \lambda\|\theta\|_1\Bigr\}.
$$

这是凸问题（可求近端梯度，见 Lec2），不必枚举子集。

### 8.1 慢速率（只靠 $\|\theta^*\|_1$，不对 $X$ 作相关假设）

由最优性，$\widehat\theta_L$ 的目标值 $\le\theta^*$ 的目标值：

$$
\frac1{2n}\|Y-X\widehat\theta_L\|_2^2+\lambda\|\widehat\theta_L\|_1
\;\le\;
\frac1{2n}\|Y-X\theta^*\|_2^2+\lambda\|\theta^*\|_1.
$$

记 $v=\widehat\theta_L-\theta^*$。左边的残差 $\|Y-X\widehat\theta_L\|_2^2=\|\varepsilon-Xv\|_2^2=\|Xv\|_2^2-2\varepsilon^\top Xv+\|\varepsilon\|_2^2$，右边 $\|Y-X\theta^*\|_2^2=\|\varepsilon\|_2^2$，$\|\varepsilon\|_2^2$ 消掉后

$$
\frac1{2n}\|Xv\|_2^2
\;\le\;
\Bigl\langle \frac{X^\top\varepsilon}{n},\;v\Bigr\rangle
+\lambda\bigl(\|\theta^*\|_1-\|\widehat\theta_L\|_1\bigr).
$$

$\|v\|_\Sigma^2=\frac1n\|Xv\|_2^2$，两边乘 2：

$$
\|v\|_\Sigma^2
\;\le\;
2\Bigl\langle \frac{X^\top\varepsilon}{n},\;v\Bigr\rangle
+2\lambda\bigl(\|\theta^*\|_1-\|\widehat\theta_L\|_1\bigr).
$$

（讲义在 $\frac1{2n}$ 损失下把基本不等式写成没有前面这个 2；按 $\|\cdot\|_\Sigma^2=\frac1n\|X\cdot\|_2^2$ 的定义应保留。下面一律用带 2 的版本，否则 8.2 的常数 $6/\gamma$ 对不上。）

**Hölder：** $\langle a,b\rangle\le\|a\|_\infty\|b\|_1$，且 $\|v\|_1\le\|\widehat\theta_L\|_1+\|\theta^*\|_1$，故

$$
\Bigl\langle \frac{X^\top\varepsilon}{n},\;v\Bigr\rangle
\le \Bigl\|\frac{X^\top\varepsilon}{n}\Bigr\|_\infty\|v\|_1
\le \Bigl\|\frac{X^\top\varepsilon}{n}\Bigr\|_\infty\bigl(\|\widehat\theta_L\|_1+\|\theta^*\|_1\bigr).
$$

定义事件

$$
\mathcal{A} \;=\; \Bigl\{\Bigl\|\frac{X^\top\varepsilon}{n}\Bigr\|_\infty\le\lambda^*\Bigr\},
\qquad
\lambda^* \;=\; \sigma\sqrt{\frac{2\log(2d/\delta)}{n}}.
$$

列 $\sqrt{n}$-归一化 $\Rightarrow$ 每个坐标 $X_{\cdot j}^\top\varepsilon/n\sim\mathrm{subG}(\sigma^2/n)$：

$$
\mathbb{E}\bigl[e^{s X_{\cdot j}^\top\varepsilon/n}\bigr]
\le\exp\bigl(s^2\sigma^2\|X_{\cdot j}\|_2^2/(2n^2)\bigr)
\le\exp\bigl(s^2(\sigma^2/n)/2\bigr).
$$

尾界 $\mathbb{P}(|X_{\cdot j}^\top\varepsilon/n|>t)\le 2\exp(-nt^2/(2\sigma^2))$。并集 $d$ 个坐标：

$$
\mathbb{P}(\mathcal{A}^c)
\le 2d\exp\bigl(-n(\lambda^*)^2/(2\sigma^2)\bigr)
=2d\exp\bigl(-\log(2d/\delta)\bigr)
=\delta,
$$

故 $\mathbb{P}(\mathcal{A})\ge 1-\delta$。

在 $\mathcal{A}$ 上取 $\lambda\ge\lambda^*$：

$$
\begin{aligned}
\|v\|_\Sigma^2
&\le 2\lambda^*\bigl(\|\widehat\theta_L\|_1+\|\theta^*\|_1\bigr)
+2\lambda\bigl(\|\theta^*\|_1-\|\widehat\theta_L\|_1\bigr)\\
&\le 2\lambda\bigl(\|\widehat\theta_L\|_1+\|\theta^*\|_1\bigr)
+2\lambda\bigl(\|\theta^*\|_1-\|\widehat\theta_L\|_1\bigr)
=4\lambda\|\theta^*\|_1.
\end{aligned}
$$

讲义写 $\le 2\lambda\|\theta^*\|_1$（来自漏掉的那个 2）；**数量级都是 $\lambda\|\theta^*\|_1$**。代入 $\lambda\sim\sigma\sqrt{\log(d/\delta)/n}$：

$$
\|\widehat\theta_L-\theta^*\|_\Sigma^2
\;\lesssim\;
\|\theta^*\|_1\sigma\sqrt{\frac{\log(d/\delta)}{n}}
\quad\text{w.h.p.}
$$

这叫**慢速率**：对强信号（很大的非零系数）它比稀疏约束 LS 的 $\frac{k\sigma^2\log(d/k)}{n}$ 差（后者对 $n$ 是 $1/n$，这里是 $1/\sqrt{n}$）。

### 8.2 快速率：限制特征值（RE）条件

若 $X$ 的列在「稀疏差」方向上不要太共线，就能恢复 $1/n$ 速率。

记 $A^*=\mathrm{supp}(\theta^*)$，$s=|A^*|$。锥

$$
\mathcal{C} \;=\; \bigl\{ v\in\mathbb{R}^d : \|v_{A^{*c}}\|_1 \le 3\|v_{A^*}\|_1 \bigr\}.
$$

**限制特征值：**

$$
\gamma \;=\; \inf_{v\in\mathcal{C}\setminus\{0\}}
\frac{v^\top(X^\top X/n)v}{\|v\|_2^2}
\;>\;0.
$$

（即在锥上 $\|v\|_\Sigma^2=v^\top\Sigma v\ge\gamma\|v\|_2^2$。）

**命题。** 取 $\lambda=2\sigma\sqrt{2\ln(2d/\delta)/n}$（即 $\lambda=2\lambda^*$，只是 $\log$ 写成 $\ln$）。则以概率 $\ge 1-\delta$，

$$
\|\widehat\theta_L-\theta^*\|_2 \;\le\; \frac6\gamma \sqrt{2\ln(2d/\delta)}\,\sigma\sqrt{\frac{s}{n}}.
$$

**证明。** 仍记 $v=\widehat\theta_L-\theta^*$。在 $\mathcal{A}$ 上 $\|X^\top\varepsilon/n\|_\infty\le\lambda^*=\lambda/2$。代入 8.1 带因子 2 的基本不等式，并用 Hölder：

$$
\|v\|_\Sigma^2
\le 2\cdot\frac\lambda2\|v\|_1
+2\lambda\bigl(\|\theta^*\|_1-\|\widehat\theta_L\|_1\bigr)
=\lambda\|v\|_1+2\lambda\bigl(\|\theta^*\|_1-\|\widehat\theta_L\|_1\bigr).
$$

把 $\ell_1$ 拆成支撑内外。$\theta^*_{A^{*c}}=0$，故 $\widehat\theta_{L,A^{*c}}=v_{A^{*c}}$，且

$$
\begin{aligned}
\|\theta^*\|_1-\|\widehat\theta_L\|_1
&=\|\theta^*_{A^*}\|_1-\|\widehat\theta_{L,A^*}\|_1-\|\widehat\theta_{L,A^{*c}}\|_1\\
&\le\|\theta^*_{A^*}-\widehat\theta_{L,A^*}\|_1-\|v_{A^{*c}}\|_1
=\|v_{A^*}\|_1-\|v_{A^{*c}}\|_1
\end{aligned}
$$

（三角不等式 $\|\theta^*_{A^*}\|_1\le\|\widehat\theta_{L,A^*}\|_1+\|v_{A^*}\|_1$）。又 $\|v\|_1=\|v_{A^*}\|_1+\|v_{A^{*c}}\|_1$。代入：

$$
\begin{aligned}
\|v\|_\Sigma^2
&\le\lambda\bigl(\|v_{A^*}\|_1+\|v_{A^{*c}}\|_1\bigr)
+2\lambda\bigl(\|v_{A^*}\|_1-\|v_{A^{*c}}\|_1\bigr)\\
&=3\lambda\|v_{A^*}\|_1-\lambda\|v_{A^{*c}}\|_1.
\end{aligned}
$$

移项

$$
\|v\|_\Sigma^2+\lambda\|v_{A^{*c}}\|_1
\;\le\;
3\lambda\|v_{A^*}\|_1.
$$

左边两项都 $\ge 0$，特别地 $\|v_{A^{*c}}\|_1\le 3\|v_{A^*}\|_1$，即 $v\in\mathcal{C}$。RE 给出 $\|v\|_\Sigma^2\ge\gamma\|v\|_2^2$。Cauchy–Schwarz：

$$
\|v_{A^*}\|_1\le\sqrt{s}\,\|v_{A^*}\|_2\le\sqrt{s}\,\|v\|_2,
$$

故

$$
\gamma\|v\|_2^2
\le\|v\|_\Sigma^2
\le 3\lambda\|v_{A^*}\|_1
\le 3\lambda\sqrt{s}\,\|v\|_2.
$$

$v=0$ 已经结束；否则除以 $\|v\|_2$：

$$
\|v\|_2
\;\le\;
\frac{3\lambda\sqrt{s}}{\gamma}.
$$

代入 $\lambda=2\sigma\sqrt{2\ln(2d/\delta)/n}$：

$$
\|v\|_2
\le\frac{3}{\gamma}\cdot 2\sigma\sqrt{\frac{2\ln(2d/\delta)}{n}}\sqrt{s}
=\frac6\gamma\sqrt{2\ln(2d/\delta)}\,\sigma\sqrt{\frac{s}{n}}.
$$

这正是讲义的界（$s=|A^*|$）。$\square$

若漏掉基本不等式里的 2，锥的系数仍是 3（$\frac\lambda2\|v\|_1+\lambda(\|v_{A^*}\|_1-\|v_{A^{*c}}\|_1)$ 同样给出 $\|v_{A^{*c}}\|_1\le 3\|v_{A^*}\|_1$），但最后只得到 $3\lambda\sqrt{s}/(2\gamma)$，常数变成 $3/\gamma$ 而不是讲义的 $6/\gamma$。

**人话：** Lasso 用凸问题「几乎」实现了稀疏约束 LS 的 oracle 速率，代价是 (i) 多一个 $\log d$；(ii) 需要 RE，不是对任意 $X$ 都成立。设计矩阵是随机高斯时，RE 在 $n\gtrsim s\log d$ 时以高概率成立。

---

## 9. Lec1 收束：你应该记住的一张表

| 方法 | 适用 | 预测误差（数量级） | 要点 |
|------|------|---------------------|------|
| OLS | $n\ge d$，固定设计 | $\dfrac{r\sigma^2}{n}$（期望精确） | minimax 最优 |
| Ridge | $d$ 可 $>n$ | $\sqrt{\|\theta^*\|_2^2\mathrm{tr}(\Sigma)\sigma^2/n}$（松上界） | 偏差–方差，贝叶斯高斯先验 |
| 约束 LS，$K=B_1$ | $\|\theta^*\|_1$ 小 | $\sigma\sqrt{\log d/n}$ | 并集界在 $2d$ 个顶点 |
| 约束 LS，$K=B_0(k)$ | $k$-稀疏 | $\dfrac{k\sigma^2\log(d/k)}{n}$ | 接近 oracle，但组合爆炸 |
| Lasso 慢速率 | 高维，只知 $\|\theta^*\|_1$ | $\|\theta^*\|_1\sigma\sqrt{\log d/n}$ | 凸、可算 |
| Lasso + RE | $s$-稀疏且 $X$ 不太共线 | $\dfrac{\sigma}{\gamma}\sqrt{s\log d/n}$ | 快速率 |

全课后面，每次看到「超额风险 $\le$ 统计 + 逼近 + 优化」，都可以回到本章：线性高斯模型里统计误差就是 $\frac{d\sigma^2}{n}$，逼近误差在模型正确时是 0，优化误差在有闭式解时是 0。

下一份：[02a_Lec2_统计误差](/blog/fods-statistical-error/)——把「$\frac{d}{n}$」推广到无穷维函数类。
