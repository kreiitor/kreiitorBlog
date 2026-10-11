---
title: "优化误差：梯度下降、SGD 与 SVRG"
description: "从下降引理出发，串起光滑性、凸性、近端梯度与随机优化。"
pubDate: 2026-10-11
tags:
  - 数据科学
  - 学习理论
  - FODS
category: course
series: fods
order: 4
cover: /covers/post-math.svg
---

对应讲义：`Fods_26.pdf` p.37–45（Gradient descent / Proximal GD / SGD / SVRG）。

上一份把「模型类有多能逼近」讲完。这一份处理误差分解里的第三块：

$$
E_{\mathrm{opt}}
\;=\;
\widehat L(f_A)-\widehat L(\widehat f)
\qquad\text{（算法没把经验风险真正降到最低）}.
$$

电脑真正在解的，是一个（可能带非光滑正则的）有限和最小化。我们要回答：

- 梯度下降（GD）在什么步长下会下降？要多少步才让梯度变小？
- **没有凸性**时还能保证什么？Polyak–Łojasiewicz（PL）条件为什么对过参数化网络重要？
- Lasso、核范数、指示函数这类不可微项怎么处理？（近端梯度）
- 随机梯度（SGD）的期望 / 高概率速率，以及强凸时为什么只能线性收敛到一个**邻域**？
- 方差缩减（SVRG）怎样把总成本从 $n\kappa\log(1/\varepsilon)$ 降到 $(n+\kappa)\log(1/\varepsilon)$？

讲义这几页公式挤、步骤跳（核范数近端写了 `?`，SVRG 证明尤其跳）。下面每条假设先用人话钉死，证明按可跟的顺序补全。

需要的预备（看不懂就去附录）：

- 内积、欧氏范数、Lipschitz、Hessian：附录 A
- 凸 / 强凸的一阶与二阶刻画、次梯度及其单调性、Bregman 散度 $D_f^\xi$、Fenchel 共轭：附录 A 后半
- SVD、核范数 $\|X\|_*$、谱范数 $\|X\|_2$：附录 A「SVD / Nuclear norm」
- 条件期望、塔性质：附录 B
- Hoeffding 引理（有界零均值变量的矩母函数）：附录 B 后半；本节会现场再证一遍

---

## 0. 先把「我们在优化什么」钉死

经验风险（或总体风险）对参数 $x\in\mathbb{R}^d$ 的依赖写成 $f(x)$ 或 $F(x)=f(x)+h(x)$。典型例子：

| 符号 | 例子 | 光滑？ |
|------|------|--------|
| $f(x)=\|Ax-b\|_2^2$ | 最小二乘 | 是，$\nabla f$ 的 Lipschitz 常数 $L=2\|A^\top A\|_2$ |
| $f(x)=\frac1n\sum_{i=1}^n\log\bigl(1+e^{-Y_i X_i^\top x}\bigr)$ | logistic | 是 |
| $h(x)=\lambda\|x\|_1$ | Lasso | **否**（坐标轴上折） |
| $h(x)=\lambda\|x\|_*$ | 矩阵补全 / 低秩 | **否** |
| $h(x)=I_C(x)$ | 约束 $x\in C$ | **否**（集合外是 $+\infty$） |

光滑部分用梯度，非光滑部分用**近端算子**。随机性来自：每次只抽一个样本（或一个 $f_i$）来估计 $\nabla f$。

**人话：** 统计误差问「样本够不够」，逼近误差问「模型死不死板」，优化误差问「你用的迭代有没有把眼前这个有限和真正变小」。

---

## 1. 光滑性：下降引理（p.37，完整证明）

### 1.1 假设在说什么

**假设（梯度 $L$-Lipschitz，记 $\nabla f\in\mathrm{Lip}(L)$）。** 对一切 $x,y\in\mathbb{R}^d$，

$$
\|\nabla f(x)-\nabla f(y)\|_2
\;\le\;
L\|x-y\|_2.
$$

**人话：** 你在 $x$ 处看到的「斜率」$\nabla f(x)$，走到旁边的 $y$ 时，斜率的改变量不超过距离的 $L$ 倍。$L$ 越大，函数越「尖」、越不能迈大步。

若 $f$ 二阶可微，这等价于 $\nabla^2 f(x)\preceq L I$（最大特征值 $\le L$）。**它不要求凸**：Hessian 仍可以有负特征值，只要不太正（不超过 $L$）。

### 1.2 定理（下降引理 / quadratic upper bound）

若 $\nabla f\in\mathrm{Lip}(L)$，则对一切 $x,y\in\mathbb{R}^d$，

$$
f(y)
\;\le\;
f(x)+\langle\nabla f(x),\, y-x\rangle+\frac L2\|y-x\|_2^2.
$$

右边是一个开口向上的二次碗，在 $x$ 处与 $f$ 零阶、一阶都贴住。后面所有「函数值下降」都从这只碗来。

下面给两个完整证明：积分（微积分基本定理）和 Nesterov（把光滑改写成一个凸函数）。

### 1.3 证明一：积分

令 $\varphi(t)=f\bigl(x+t(y-x)\bigr)$，$t\in[0,1]$。链式法则：

$$
\varphi'(t)=\bigl\langle\nabla f\bigl(x+t(y-x)\bigr),\, y-x\bigr\rangle.
$$

微积分基本定理：

$$
\begin{aligned}
f(y)-f(x)
&=\varphi(1)-\varphi(0)
=\int_0^1\varphi'(t)\,\mathrm{d}t\\
&=\int_0^1\bigl\langle\nabla f\bigl(x+t(y-x)\bigr),\, y-x\bigr\rangle\,\mathrm{d}t\\
&=\langle\nabla f(x),\, y-x\rangle
+\int_0^1\bigl\langle\nabla f\bigl(x+t(y-x)\bigr)-\nabla f(x),\, y-x\bigr\rangle\,\mathrm{d}t.
\end{aligned}
$$

Cauchy–Schwarz 再接 Lipschitz：

$$
\begin{aligned}
&\bigl\langle\nabla f\bigl(x+t(y-x)\bigr)-\nabla f(x),\, y-x\bigr\rangle\\
&\qquad\le
\bigl\|\nabla f\bigl(x+t(y-x)\bigr)-\nabla f(x)\bigr\|_2\,\|y-x\|_2
\le L t\|y-x\|_2^2.
\end{aligned}
$$

积分 $\int_0^1 Lt\,\mathrm{d}t=L/2$，即得下降引理。$\square$

### 1.4 证明二：Nesterov（讲义附录 p.160 的「$g$ 凸」路线）

先由 Lipschitz 推出：对一切 $x,y$，

$$
\langle\nabla f(x)-\nabla f(y),\, x-y\rangle
\;\le\;
L\|x-y\|_2^2,
$$

因为左边 $\le\|\nabla f(x)-\nabla f(y)\|\,\|x-y\|\le L\|x-y\|^2$。改写为

$$
\bigl\langle\bigl(Lx-\nabla f(x)\bigr)-\bigl(Ly-\nabla f(y)\bigr),\, x-y\bigr\rangle
\;\ge\;0.
$$

也就是映射 $x\mapsto Lx-\nabla f(x)$ **单调**。令

$$
g(x)\;=\;\frac L2\|x\|_2^2-f(x),
$$

则 $\nabla g(x)=Lx-\nabla f(x)$ 单调。可微函数凸 $\Leftrightarrow$ 梯度单调（附录 A），故 $g$ 凸。凸函数的一阶下界：

$$
g(y)\;\ge\; g(x)+\langle\nabla g(x),\, y-x\rangle,
$$

即

$$
\frac L2\|y\|_2^2-f(y)
\;\ge\;
\frac L2\|x\|_2^2-f(x)+\langle Lx-\nabla f(x),\, y-x\rangle.
$$

整理 $f(y)$，右边二次项为

$$
\frac L2\Bigl(\|y\|_2^2-\|x\|_2^2-2\langle x,\, y-x\rangle\Bigr)
=\frac L2\|y-x\|_2^2,
$$

即得同一条下降引理。$\square$

**推论（光滑函数在极小点附近的上下界）。** 若再有 $\mathrm{dom}(f)=\mathbb{R}^d$ 且 $x^*\in\arg\min f$（于是 $\nabla f(x^*)=0$），则

$$
\frac1{2L}\|\nabla f(x)\|_2^2
\;\le\;
f(x)-f(x^*)
\;\le\;
\frac L2\|x-x^*\|_2^2.
$$

右边：下降引理里令 $x\leftarrow x^*$、$y\leftarrow x$。左边：从 $x$ 沿 $-\nabla f(x)/L$ 走一步，函数值 $\le f(x)-\frac1{2L}\|\nabla f(x)\|^2$，而 $f(x^*)$ 更小。后文 PL、SVRG 都会用左边这条。

---

## 2. 梯度下降：步长、下降、梯度范数 $O(1/t)$（p.37）

### 2.1 算法

给定 $x_0$，步长 $\alpha_k>0$，

$$
x_{k+1}\;=\; x_k-\alpha_k\nabla f(x_k),\qquad k=0,1,\ldots.
$$

**还不需要凸性。** 没有凸性时，$x^*$ 只表示某个一阶驻点或全局极小（下面用到 $f(x^*)$ 时会标明）；能保证的是**梯度变小**，不是「一定到全局最小」。

### 2.2 一步下降

在下降引理里令 $y=x-\alpha\nabla f(x)$：

$$
\begin{aligned}
f(y)
&\le
f(x)+\bigl\langle\nabla f(x),\,-\alpha\nabla f(x)\bigr\rangle+\frac L2\alpha^2\|\nabla f(x)\|_2^2\\
&=
f(x)-\alpha\Bigl(1-\frac{\alpha L}2\Bigr)\|\nabla f(x)\|_2^2.
\end{aligned}
$$

**命题。** 若 $\alpha\in(0,2/L)$，则 $1-\alpha L/2>0$，从而 $f(y)\le f(x)$，且严格小于除非 $\nabla f(x)=0$。

**人话：** 步长不能超过 $2/L$，否则二次上界在那一步已经翘起来，不能保证下降。最常用的保险步长是 $\alpha=1/L$，此时

$$
f(y)\;\le\; f(x)-\frac1{2L}\|\nabla f(x)\|_2^2.
$$

### 2.3 把一步加起来

对 GD 写 $x=x_k$、$\alpha=\alpha_k$、$y=x_{k+1}$：

$$
\alpha_k\Bigl(1-\frac{L\alpha_k}2\Bigr)\|\nabla f(x_k)\|_2^2
\;\le\;
f(x_k)-f(x_{k+1}).
$$

对 $k=0,\ldots,t-1$ 求和，右边望远镜：

$$
\sum_{k<t}\alpha_k\Bigl(1-\frac{L\alpha_k}2\Bigr)\|\nabla f(x_k)\|_2^2
\;\le\;
f(x_0)-f(x_t)
\;\le\;
f(x_0)-f(x^*),
$$

最后一步只要 $f(x^*)\le f(x_t)$（例如 $x^*$ 是全局极小）。取常数步长 $\alpha_k=\alpha\in(0,2/L)$：

$$
\min_{k<t}\|\nabla f(x_k)\|_2^2
\;\le\;
\frac1t\sum_{k<t}\|\nabla f(x_k)\|_2^2
\;\le\;
\frac{2}{t\alpha(2-\alpha L)}\bigl(f(x_0)-f(x^*)\bigr).
$$

（讲义有的地方把 $\|\nabla f\|^2$ 的平方印丢了；从推导看必须是平方：左边与 $f$ 同量纲。）

对 $\alpha\in(0,2/L)$ 最小化右边：令 $\phi(\alpha)=\alpha(2-\alpha L)$，$\phi'(\alpha)=2-2\alpha L=0\Rightarrow\alpha=1/L$，此时 $\phi=1/L$，于是

$$
\min_{k<t}\|\nabla f(x_k)\|_2^2
\;\le\;
\frac{2L}{t}\bigl(f(x_0)-f(x^*)\bigr).
$$

**人话：** 不靠凸性，GD 就能让「曾经见过的最小梯度范数」以 $1/t$ 变小。这是驻点保证，不是全局最小保证。想要 $f(x_t)-f(x^*)$ 本身的速率，需要下一节的 $\gamma$-条件、凸性或 PL。

---

## 3. MM 算法观点（p.37）

Majorization–Minimization（MM）就三句话：

1. 找一个好算的上界 $M(x,y)$，对一切 $y$ 有 $M(x,y)\ge f(y)$（majorize）；
2. 在当前点贴住：$M(x,x)=f(x)$；
3. 下一步最小化上界：$x_{k+1}\in\arg\min_y M(x_k,y)$。

因为 $f(x_{k+1})\le M(x_k,x_{k+1})\le M(x_k,x_k)=f(x_k)$，函数值单调不增。

下降引理正好给了一只二次碗：

$$
M(x,y)
\;=\;
f(x)+\langle\nabla f(x),\, y-x\rangle+\frac L2\|y-x\|_2^2.
$$

对 $y$ 求导：$\nabla_y M=\nabla f(x)+L(y-x)$，令其为 $0$，

$$
y
\;=\;
x-\frac1L\nabla f(x).
$$

所以**步长 $1/L$ 的 GD 就是这只碗的 MM**。后面近端梯度把 $h(y)$ 加进 $M$，最小化变成一次近端映射。

---

## 4. 没有凸性时的次线性率（p.38）

### 4.1 假设（1）在说什么

**假设（讲义 (1)）。** 存在 $\gamma>0$ 使得对一切 $x$，

$$
\langle\nabla f(x),\, x-x^*\rangle
\;\ge\;
\gamma\bigl(f(x)-f(x^*)\bigr).
$$

**人话：** 梯度在「指向极小点」的方向上，不能太弱。它比凸性弱、也和凸性不完全可比：

- 若 $f$ **凸**，一阶条件是 $f(x^*)\ge f(x)+\langle\nabla f(x),x^*-x\rangle$，即 $\langle\nabla f(x),x-x^*\rangle\ge f(x)-f(x^*)$，所以凸 $\Rightarrow$ $\gamma=1$ 的 (1)（有时叫 star-convex / 限制割线不等式）。
- 反过来 (1) 并不强迫 $f$ 处处凸，只要沿通往 $x^*$ 的射线不太坏。

没有这条，非凸时只能控制 $\|\nabla f\|$，不能控制 $f-f^*$。

再假设 $x^*$ 是无约束极小，于是 $\nabla f(x^*)=0$。GD 用 $\alpha=1/L$，函数值不增，整个轨道停在下水平集 $\{x:f(x)\le f(x_0)\}$ 里。

**假设（水平集有界）。** 记

$$
R
\;:=\;
\max\bigl\{\|x-x^*\|_2:\; f(x)\le f(x_0)\bigr\}
\;<\;\infty.
$$

**人话：** $f$ 不能有一条「函数值不太大、但跑到无穷远」的峡谷。强制（coercive）函数，例如 $\|x\|\to\infty\Rightarrow f(x)\to\infty$，就满足。若 $R=\infty$，下面的 $O(1/t)$ 常数炸掉，结论无信息。

### 4.2 从 (1) 到 $\varepsilon_{k+1}\le\varepsilon_k-\frac1{2L}(\varepsilon_k\gamma/R)^2$

Cauchy–Schwarz 接 (1)：

$$
\gamma\bigl(f(x)-f(x^*)\bigr)
\;\le\;
\langle\nabla f(x),\, x-x^*\rangle
\;\le\;
\|\nabla f(x)\|_2\,\|x-x^*\|_2.
$$

记 $\varepsilon_k=f(x_k)-f(x^*)$。轨道在水平集内，$\|x_k-x^*\|\le R$，故

$$
\varepsilon_k
\;\le\;
\frac1\gamma\|\nabla f(x_k)\|_2\, R
\qquad\Longleftrightarrow\qquad
\|\nabla f(x_k)\|_2
\;\ge\;
\frac{\varepsilon_k\gamma}{R}.
$$

步长 $1/L$ 的下降：

$$
f(x_{k+1})
\;\le\;
f(x_k)-\frac1{2L}\|\nabla f(x_k)\|_2^2,
$$

即

$$
\varepsilon_{k+1}
\;\le\;
\varepsilon_k-\frac1{2L}\|\nabla f(x_k)\|_2^2
\;\le\;
\varepsilon_k-\frac1{2L}\Bigl(\frac{\varepsilon_k\gamma}{R}\Bigr)^2.
$$

这就是讲义要的递推。特别地 $\varepsilon_{k+1}\le\varepsilon_k$。若某步右边 $\le 0$，已经到最优，停止。

### 4.3 倒数增量：$\frac1{\varepsilon_{k+1}}-\frac1{\varepsilon_k}\ge\frac{\gamma^2}{2LR^2}$

只要 $\varepsilon_{k+1}>0$，

$$
\frac1{\varepsilon_{k+1}}-\frac1{\varepsilon_k}
\;=\;
\frac{\varepsilon_k-\varepsilon_{k+1}}{\varepsilon_k\,\varepsilon_{k+1}}
\;\ge\;
\frac{\varepsilon_k-\varepsilon_{k+1}}{\varepsilon_k^2},
$$

因为 $\varepsilon_{k+1}\le\varepsilon_k$ 导致分母 $\varepsilon_k\varepsilon_{k+1}\le\varepsilon_k^2$（分母越小，分数越大，我们取较松的下界）。代入上一段：

$$
\varepsilon_k-\varepsilon_{k+1}
\;\ge\;
\frac1{2L}\Bigl(\frac{\varepsilon_k\gamma}{R}\Bigr)^2
\;=\;
\frac{\gamma^2}{2LR^2}\,\varepsilon_k^2,
$$

故

$$
\frac1{\varepsilon_{k+1}}-\frac1{\varepsilon_k}
\;\ge\;
\frac{\gamma^2}{2LR^2}.
$$

### 4.4 对 $k$ 求和得到 $O(1/t)$

先用下降引理控制 $\varepsilon_0$。令 $x\leftarrow x^*$、$y\leftarrow x_0$，$\nabla f(x^*)=0$：

$$
\varepsilon_0
\;=\;
f(x_0)-f(x^*)
\;\le\;
\frac L2\|x_0-x^*\|_2^2
\;\le\;
\frac{LR^2}2.
$$

（讲义写 $\varepsilon_0\le\langle\nabla f(x^*),x_0-x^*\rangle+\frac L2\|x_0-x^*\|^2\le LR^2/2$，第一项因 $\nabla f(x^*)=0$ 消失。）

于是 $\frac1{\varepsilon_0}\ge\frac2{LR^2}$。从 $k=0$ 加到 $t-1$：

$$
\frac1{\varepsilon_t}-\frac1{\varepsilon_0}
\;\ge\;
\frac{t\gamma^2}{2LR^2},
$$

$$
\frac1{\varepsilon_t}
\;\ge\;
\frac2{LR^2}+\frac{t\gamma^2}{2LR^2}
\;=\;
\frac{\gamma^2 t+4}{2LR^2}.
$$

因此

$$
f(x_t)-f(x^*)
\;=\;
\varepsilon_t
\;\le\;
\frac{2LR^2}{\gamma^2 t+4}
\;=\;
O\Bigl(\frac1t\Bigr).
$$

凸时 $\gamma=1$，这就是光滑凸 GD 的标准 $O(L R^2/t)$（常数因证明技术略有出入）。

---

## 5. PL 条件：没有强凸也能线性收敛（p.38）

### 5.1 假设在说什么

**Polyak–Łojasiewicz（PL）条件（Polyak 1963，Łojasiewicz 1963）。** 存在 $m>0$，对一切 $x$，

$$
\|\nabla f(x)\|_2^2
\;\ge\;
2m\bigl(f(x)-f(x^*)\bigr).
$$

**人话：** 函数值还没降到位，梯度就不能太小。强凸可微时，一阶条件给出 $f(x)-f^*\ge\frac m2\|x-x^*\|^2$ 以及 $f(x)-f^*\le\frac1{2m}\|\nabla f(x)\|^2$ 的「反过来」$\|\nabla f\|^2\ge 2m(f-f^*)$，所以

$$
\text{$m$-强凸（可微）}
\;\Longrightarrow\;
\text{PL}.
$$

PL **不**蕴含凸，更不蕴含强凸。过参数化神经网络里，经验风险常常不是凸的，但在流形 / 插值区域附近可以有 PL，于是 GD/SGD 仍线性降函数值。这就是讲义说「PL is important for over-parameterized deep learning」的原因。

由光滑性 $\|\nabla f(x)\|^2\le 2L(f-f^*)$（第 1.2 节推论），PL 常数必须满足 $m\le L$。

### 5.2 线性收敛

步长 $\alpha=1/L$：

$$
\varepsilon_{k+1}
\;\le\;
\varepsilon_k-\frac1{2L}\|\nabla f(x_k)\|_2^2
\;\le\;
\varepsilon_k-\frac1{2L}\cdot 2m\,\varepsilon_k
\;=\;
\Bigl(1-\frac mL\Bigr)\varepsilon_k.
$$

迭代：

$$
f(x_t)-f(x^*)
\;\le\;
\Bigl(1-\frac mL\Bigr)^t\bigl(f(x_0)-f(x^*)\bigr)
\;\le\;
\exp\Bigl(-\frac{mt}{L}\Bigr)\bigl(f(x_0)-f(x^*)\bigr).
$$

**人话：** 强凸给「点 $x_k$ 到 $x^*$ 的距离」线性收缩；PL 只给「函数值」线性收缩，不管是不是只有一个极小点（可以有一整个极小集合，PL 在商空间上看仍像强凸）。

### 5.3 例子：$f(x)=x^2+3\sin^2(x)$（PL 但非凸）

这是讲义上的一维例子。先算导数：

$$
f'(x)=2x+3\sin(2x),\qquad
f''(x)=2+6\cos(2x).
$$

**非凸。** $f''(x)\in[2-6,\,2+6]=[-4,8]$。例如 $x=\pi/2$，$f''(\pi/2)=2+6\cos\pi=-4<0$，Hessian 可以负，故非凸。

**$0$ 是唯一驻点，也是全局极小。** $f(x)\ge 0=f(0)$。$f'(x)=0\Leftrightarrow u+3\sin u=0$（$u=2x$）。令 $g(u)=u+3\sin u$，$g(0)=0$，$g'(u)=1+3\cos u=0\Leftrightarrow\cos u=-1/3$。在 $|u|\le 3$（因为 $|u|=3|\sin u|\le 3$）里，$g$ 在 $u\approx 1.91$ 取局部最大且为正，在 $u\approx-1.91$ 取局部最小且为负，$g(u)$ 在 $u>0$ 为正、在 $u<0$ 为负，故只有 $u=0$。于是只有 $x=0$ 是驻点。

**PL。** 要证

$$
m_*
\;:=\;
\inf_{x\neq 0}
\frac{\bigl(f'(x)\bigr)^2}{2f(x)}
\;>\;0.
$$

用反证 + 紧性（小白版：如果比值能任意接近 0，极限点会制造第二个驻点，或与 $x=0$ 附近的局部强凸矛盾）。

- 若有 $x_n\neq 0$ 使比值 $\to 0$ 且 $|x_n|\to\infty$：$f(x)\sim x^2$，$f'(x)\sim 2x$，比值 $\to 4x^2/(2x^2)=2\neq 0$，矛盾。
- 若 $x_n\to x_\infty\in\mathbb{R}\setminus\{0\}$：连续，$f'(x_\infty)=0$，与唯一驻点矛盾。
- 若 $x_n\to 0$：L'Hôpital（或 Taylor），$f'(x)\sim f''(0)x=8x$，$f(x)\sim 4x^2$（因为 $f''(0)=8$），比值 $\to 64x^2/(8x^2)=8\neq 0$。

三种逃逸都不可能，故 $m_*>0$。$f$ 是 PL 且非凸。

（不必记住具体的 $m_*$。数值上它明显小于 $L=8$：例如 $x=\pi/2$ 处 $\bigl(f'\bigr)^2/(2f)\approx 0.9$，更远处还可以更小。）

---

## 6. 近端梯度：复合目标与 $\mathrm{Prox}$（p.39）

### 6.1 问题

$$
\min_{x\in\mathbb{R}^d} F(x)=f(x)+h(x),
$$

其中 $\nabla f\in\mathrm{Lip}(L)$，$h$ **凸**，可以不可微、甚至取 $+\infty$（用来编码约束）。

**人话：** $f$ 是「数据拟合」，好求导；$h$ 是「你喜欢的结构」（稀疏、低秩、落在某个凸集里），只在少数点折一下，但折的方式很规则，可以用一次小问题处理。

### 6.2 近端算子

$$
\mathrm{Prox}_h(x)
\;:=\;
\arg\min_{z\in\mathbb{R}^d}
\Bigl\{\frac12\|z-x\|_2^2+h(z)\Bigr\}.
$$

**人话：** 既要靠近 $x$，又要让 $h(z)$ 小。$h$ 闭真凸时，目标 $1$-强凸且强制，极小点**存在唯一**，所以 $\mathrm{Prox}_h$ 是良定义的单值映射。

一阶最优（Fermat：$0\in\partial(\frac12\|\cdot-x\|^2+h)(z)$）：

$$
0\in\partial h(z)+z-x
\qquad\Longleftrightarrow\qquad
x-z\in\partial h(z)
\qquad\Longleftrightarrow\qquad
x\in\bigl(I+\partial h\bigr)(z).
$$

因此

$$
z=\mathrm{Prox}_h(x)=\bigl(I+\partial h\bigr)^{-1}(x)
$$

（单调算子 $\partial h$ 的**预解式**）。讲义把最后一处写成 $(I+\partial f)^{-1}$，是把 $h$ 误写成 $f$。

### 6.3 三个基本例子

**（i）指示函数 $\Leftrightarrow$ 投影。** $h=I_C$（$C$ 上为 $0$，外面为 $+\infty$）当且仅当 $C$ 凸时 $h$ 凸。此时

$$
\mathrm{Prox}_{I_C}(x)=\mathrm{Proj}_C(x)=\arg\min_{z\in C}\|z-x\|_2,
$$

因为目标在 $C$ 外是 $+\infty$，在 $C$ 上就是到 $x$ 的距离平方。约束光滑问题 $\min_{x\in C}f(x)$ 的近端梯度就是**投影梯度**。

**（ii）$\ell_1$ $\Leftrightarrow$ 软阈值。** $h(x)=\lambda\|x\|_1=\lambda\sum_i|x_i|$ 可分离，逐坐标解

$$
\min_{z\in\mathbb{R}}\ \frac12(z-t)^2+\lambda|z|.
$$

- 若最优 $z>0$：$z-t+\lambda=0\Rightarrow z=t-\lambda$，需 $t>\lambda$；
- 若最优 $z<0$：$z-t-\lambda=0\Rightarrow z=t+\lambda$，需 $t<-\lambda$；
- 若最优 $z=0$：次微分 $\partial(\lambda|z|)|_{0}=[-\lambda,\lambda]$，需 $t\in[-\lambda,\lambda]$。

合起来就是**软阈值**

$$
S_\lambda(t)
\;=\;
\mathrm{sign}(t)\,\max\bigl(|t|-\lambda,\,0\bigr),
\qquad
\mathrm{Prox}_{\lambda\|\cdot\|_1}(x)=S_\lambda(x)
\ \text{（逐坐标）}.
$$

这就是 ISTA：梯度步之后把每个坐标往 0 缩 $\lambda$ 那么多，不够缩的直接剪成 0。

**（iii）核范数：讲义 p.39 在 $h(X)=\lambda\|X\|_*$ 处写 `Prox=?`。下一节给出完整的奇异值软阈值证明。**

### 6.4 近端梯度迭代

$$
x_{k+1}
\;=\;
\mathrm{Prox}_{\alpha_k h}\bigl(x_k-\alpha_k\nabla f(x_k)\bigr).
$$

**人话：** 先假装没有 $h$，沿 $-\nabla f$ 走一步；再把这一点「拉回」$h$ 喜欢的结构（稀疏、低秩、落到 $C$ 里）。$\alpha_k=1/L$ 时，这正是对

$$
M(x,z)=f(x)+\langle\nabla f(x),z-x\rangle+\frac L2\|z-x\|_2^2+h(z)
$$

做 MM（第 10 节）。

---

## 7. 核范数的近端 = 奇异值软阈值（补全讲义的 `?`）

### 7.1 结论

矩阵 $X\in\mathbb{R}^{m\times n}$，$h(X)=\lambda\|X\|_*$，$\|X\|_*=\sum_i\sigma_i(X)$（奇异值之和）。令紧 SVD $X=U\Sigma V^\top$，$\Sigma=\mathrm{diag}(\sigma_1,\ldots,\sigma_r)$。则

$$
\mathrm{Prox}_{\lambda\|\cdot\|_*}(X)
\;=\;
U\,S_\lambda(\Sigma)\,V^\top,
$$

即对每个奇异值做标量软阈值，左右奇异向量不动。这叫 **singular value thresholding (SVT)**。

**人话：** 核范数是「矩阵版 $\ell_1$」（$\ell_1$ 作用在奇异值上）。近端也是「矩阵版软阈值」。**千万不要**对矩阵元素做软阈值——那是 $\|X\|_1=\sum_{ij}|X_{ij}|$，对应元素稀疏，不是低秩。

下面两条路都写全：Fenchel / SVD 特征（与附录共轭配套），以及 von Neumann 迹不等式（讲义点名的工具）。

### 7.2 预备：核范数与谱范数对偶

谱范数 $\|Y\|_2=\sigma_1(Y)=\sup_{\|u\|_2=\|v\|_2=1}u^\top Y v$。

**引理。** $\sup_{\|Y\|_2\le 1}\langle X,Y\rangle_F=\|X\|_*$，其中 $\langle X,Y\rangle_F=\mathrm{tr}(X^\top Y)$。因此核范数的 Fenchel 共轭是谱范数单位球的指示函数：

$$
\bigl(\|\cdot\|_*\bigr)^*
\;=\;
I_{\{\|Y\|_2\le 1\}}.
$$

**证明。** 写 $X=\sum_{i=1}^r\sigma_i u_i v_i^\top$。取 $Y=\sum_{i=1}^r u_i v_i^\top$（不足的奇异方向补 0），则 $\|Y\|_2=1$ 且 $\langle X,Y\rangle_F=\sum\sigma_i=\|X\|_*$，故 $\sup\ge\|X\|_*$。

反过来，对任意 $\|Y\|_2\le 1$，

$$
\langle X,Y\rangle_F
=\sum_{i=1}^r\sigma_i\, u_i^\top Y v_i
\le\sum_{i=1}^r\sigma_i\,\|Y\|_2\|u_i\|_2\|v_i\|_2
\le\|X\|_*.
$$

于是 $\sup\le\|X\|_*$。$\square$

附录 A 的 Fenchel–Young：对闭真凸 $h$，

$$
Y\in\partial h(X)
\qquad\Longleftrightarrow\qquad
h(X)+h^*(Y)=\langle X,Y\rangle.
$$

取 $h=\|\cdot\|_*$：$Y\in\partial\|X\|_*$ 当且仅当 $\|Y\|_2\le 1$ 且 $\langle X,Y\rangle_F=\|X\|_*$。

### 7.3 用次微分验证 SVT 是近端（填讲义的 `?`）

$Z=\mathrm{Prox}_{\lambda\|\cdot\|_*}(X)$ 当且仅当 $X-Z\in\lambda\,\partial\|Z\|_*$。由 7.2，这等价于

$$
\Bigl\|\frac{X-Z}{\lambda}\Bigr\|_2\le 1
\qquad\text{且}\qquad
\Bigl\langle Z,\,\frac{X-Z}{\lambda}\Bigr\rangle_F
=\|Z\|_*.
$$

令 $Z=U S_\lambda(\Sigma)V^\top$（与 $X$ **共享**左右奇异向量）。逐个奇异值：

$$
S_\lambda(\sigma_i)=\max(\sigma_i-\lambda,0),\qquad
\sigma_i-S_\lambda(\sigma_i)=\min(\sigma_i,\lambda).
$$

因此

$$
X-Z=U\bigl(\Sigma-S_\lambda(\Sigma)\bigr)V^\top
$$

的奇异值是 $\{\min(\sigma_i,\lambda)\}$，最大不超过 $\lambda$，即 $\|X-Z\|_2\le\lambda$，第一条成立。

Frobenius 内积在共同奇异基下变成对角之和：

$$
\langle Z,X-Z\rangle_F
=\sum_i S_\lambda(\sigma_i)\cdot\bigl(\sigma_i-S_\lambda(\sigma_i)\bigr)
=\sum_i\max(\sigma_i-\lambda,0)\cdot\min(\sigma_i,\lambda).
$$

分两种：

- $\sigma_i>\lambda$：$\max(\sigma_i-\lambda,0)=\sigma_i-\lambda$，$\min=\lambda$，乘积 $\lambda(\sigma_i-\lambda)$；
- $\sigma_i\le\lambda$：$\max=0$，乘积 $0$。

故 $\langle Z,X-Z\rangle_F=\lambda\sum_i\max(\sigma_i-\lambda,0)=\lambda\|Z\|_*$，即 $\langle Z,(X-Z)/\lambda\rangle_F=\|Z\|_*$。两条最优性都成立。近端唯一，所以

$$
\mathrm{Prox}_{\lambda\|\cdot\|_*}(X)=U\,S_\lambda(\Sigma)\,V^\top.
$$

这就是讲义 `?` 处应写的公式。$\square$

### 7.4 用 von Neumann 迹不等式再证一遍

**定理（von Neumann）。** 对 $A,B\in\mathbb{R}^{m\times n}$，

$$
\langle A,B\rangle_F
\;\le\;
\sum_{i=1}^{\min(m,n)}\sigma_i(A)\,\sigma_i(B),
$$

等号在 $A,B$ 可取同一组左右奇异向量时达到。

**证明（Ky Fan + 重排）。** 令 $A=U\Sigma V^\top$ 为（满）SVD。则

$$
\langle A,B\rangle_F
=\langle\Sigma,\, U^\top B V\rangle_F
=\sum_i\sigma_i(A)\, M_{ii},
\qquad
M:=U^\top B V.
$$

奇异值的 Ky Fan 变分式：对任意矩阵 $M$ 与任意 $k$，

$$
\sum_{i=1}^k\sigma_i(M)
=\max\Bigl\{\sum_{i=1}^k a_i^\top M b_i:
\{a_i\}_{i=1}^k,\,\{b_i\}_{i=1}^k\text{ 标准正交}\Bigr\}.
$$

（SVD 给出可达；任意标准正交组不超过前 $k$ 个奇异值之和。）特别地，取 $a_i=b_i=e_{\pi(i)}$ 可吸收符号，得到 Fan 不等式：$M$ 对角线绝对值最大的 $k$ 项之和 $\le\sum_{i=1}^k\sigma_i(M)$。从而向量 $(|M_{11}|,|M_{22}|,\ldots)$ 被 $\sigma(M)=\sigma(B)$ 弱超优。$\sigma(A)$ 非负递减，重排不等式给出 $\sum\sigma_i(A)M_{ii}\le\sum\sigma_i(A)\sigma_i(B)$。$\square$

**用它证 SVT。** 目标 $\frac12\|Z-X\|_F^2+\lambda\|Z\|_*$ 等价于最小化 $\frac12\|Z\|_F^2-\langle Z,X\rangle_F+\lambda\|Z\|_*$。对任意 $Z$，

$$
\|Z\|_F^2\ge\sum_i\sigma_i(Z)^2,
\qquad
\langle Z,X\rangle_F\le\sum_i\sigma_i(Z)\sigma_i(X),
$$

故

$$
\frac12\|Z\|_F^2-\langle Z,X\rangle_F+\lambda\|Z\|_*
\;\ge\;
\sum_i\Bigl(\frac12\sigma_i(Z)^2-\sigma_i(X)\sigma_i(Z)+\lambda\sigma_i(Z)\Bigr).
$$

右边对每个奇异值分离。令 $\sigma=\sigma_i(X)$，一维问题 $\min_{s\ge 0}\ \frac12(s-\sigma)^2+\lambda s$（与上式差一个不依赖 $s$ 的 $\frac12\sigma^2$）。若 $s>0$，导数 $s-\sigma+\lambda=0\Rightarrow s=\sigma-\lambda$，需 $\sigma>\lambda$；若 $\sigma\le\lambda$，导数在 $0^+$ 处 $\lambda-\sigma\ge 0$，最小在 $s=0$。故 $s=\max(\sigma-\lambda,0)=S_\lambda(\sigma)$。

取 $Z=U S_\lambda(\Sigma)V^\top$ 时：$Z$ 与 $X$ 同左右奇异向量，von Neumann 取等；$\|Z\|_F^2=\sum\sigma_i(Z)^2$ 对任何矩阵都等。于是 $Z$ 达到下界，即近端。$\square$

---

## 8. Prox 的坚定非扩张（p.39）

### 8.1 定理

记 $P=\mathrm{Prox}_h$。对一切 $x_1,x_2$，

$$
\langle P(x_1)-P(x_2),\, x_1-x_2\rangle
\;\ge\;
\|P(x_1)-P(x_2)\|_2^2.
$$

这叫 **firmly nonexpansive（坚定非扩张）**。特别地 $P$ 是 $1$-Lipschitz（非扩张）：

$$
\|P(x_1)-P(x_2)\|_2
\;\le\;
\|x_1-x_2\|_2.
$$

**人话：** 近端映射不会把两点拉得更远；而且「沿着 $x_1-x_2$ 方向看，像的位移还挺长」——这比普通 $1$-Lipschitz 强（投影、软阈值都满足）。

### 8.2 用次梯度单调性证明

令 $z_i=P(x_i)$。最优性：$x_i-z_i\in\partial h(z_i)$，$i=1,2$。

凸函数的次梯度单调（附录 A，直接把次梯度不等式在 $(z_1,z_2)$ 上各写一次再相加）：对 $\xi_i\in\partial h(z_i)$，

$$
\langle\xi_1-\xi_2,\, z_1-z_2\rangle\ge 0.
$$

代入 $\xi_i=x_i-z_i$：

$$
\langle(x_1-z_1)-(x_2-z_2),\, z_1-z_2\rangle\ge 0,
$$

即

$$
\langle x_1-x_2,\, z_1-z_2\rangle
\;\ge\;
\|z_1-z_2\|_2^2.
$$

这就是坚定非扩张。再 Cauchy–Schwarz：

$$
\|z_1-z_2\|^2
\;\le\;
\|x_1-x_2\|\,\|z_1-z_2\|
\;\Longrightarrow\;
\|z_1-z_2\|
\;\le\;
\|x_1-x_2\|.
$$

$\square$

近端梯度里这件事保证：光滑步之后再 prox，点列不会被非光滑项「弹飞」。

---

## 9. Moreau 分解（p.39）

**定理。** $h:\mathbb{R}^d\to(-\infty,+\infty]$ 闭真凸（讲义说 closed），则对一切 $x$，

$$
x
\;=\;
\mathrm{Prox}_h(x)+\mathrm{Prox}_{h^*}(x),
$$

其中 $h^*$ 是 Fenchel 共轭。

**人话：** 像正交分解 $x=\mathrm{Proj}_S(x)+\mathrm{Proj}_{S^\perp}(x)$，但「子空间」换成「凸函数 $h$ 与它的共轭」。事实上指示函数就是特例。

**证明。** 闭真凸 $\Rightarrow h^{**}=h$，且（附录 A）

$$
\xi\in\partial h(z)
\qquad\Longleftrightarrow\qquad
z\in\partial h^*(\xi).
$$

令 $z=\mathrm{Prox}_h(x)$，则 $x-z\in\partial h(z)$，从而 $z\in\partial h^*(x-z)$。

另一方面，$w=\mathrm{Prox}_{h^*}(x)$ 的最优性是 $x-w\in\partial h^*(w)$。验证 $w=x-z$ 满足：此时 $x-w=z$，而刚才正有 $z\in\partial h^*(x-z)=\partial h^*(w)$。近端唯一，故 $\mathrm{Prox}_{h^*}(x)=x-z$。$\square$

讲义把链条缩成

$$
z=\mathrm{Prox}_h(x)
\;\Leftrightarrow\;
x-z\in\partial h(z)
\;\Leftrightarrow\;
z\in\partial h^*(x-z)
\;\Leftrightarrow\;
x-z=\mathrm{Prox}_{h^*}(x).
$$

最后一步就是「$z\in\partial h^*(x-z)$ 恰是 $w=x-z$ 的 prox 最优性」。

**子空间特例。** $h=I_S$，$S\subset\mathbb{R}^d$ 是子空间。共轭 $I_S^*=I_{S^\perp}$：因为 $\sup_{y\in S}\langle y,x\rangle$ 在 $x\in S^\perp$ 时为 $0$，否则为 $+\infty$。于是 Moreau 就是正交分解

$$
x=\mathrm{Proj}_S(x)+\mathrm{Proj}_{S^\perp}(x).
$$

---

## 10. 近端梯度的基本不等式（p.40）

取 $\alpha=1/L$，记

$$
y
\;=\;
\mathrm{Prox}_{h/L}\Bigl(x-\frac1L\nabla f(x)\Bigr)
$$

（一步近端梯度）。Bregman 散度（附录 A；讲义记号 $D_f^\xi(z,x)$，$\xi=\nabla f(x)$）

$$
D_f^\xi(z,x)
\;:=\;
f(z)-f(x)-\langle\nabla f(x),\, z-x\rangle.
$$

第一个槽 $z$ 是「走到的点」，第二个槽 $x$ 是「线性化的点」。立刻有讲义红字的那条代数恒等式：

$$
f(x)+\langle\nabla f(x),\, z-x\rangle-f(z)
\;=\;
-D_f^\xi(z,x).
$$

凸时 $D_f^\xi\ge 0$；$m$-强凸时 $D_f^\xi(z,x)\ge\frac m2\|z-x\|_2^2$。$D_f^\xi(x,x)=0$。

**基本不等式。** 对一切 $z$，

$$
F(y)
\;\le\;
F(z)+\frac L2\|x-z\|_2^2-\frac L2\|y-z\|_2^2-D_f^\xi(z,x).
$$

### 10.1 从 $M(x,z)$ 的强凸推出（按讲义三行写全）

令

$$
M(x,z)
\;=\;
f(x)+\langle\nabla f(x),\, z-x\rangle+\frac L2\|z-x\|_2^2+h(z).
$$

**（i）$M$ 是 $F$ 的上界。** 下降引理 $f(z)\le f(x)+\langle\nabla f(x),z-x\rangle+\frac L2\|z-x\|^2$，两边加 $h(z)$：

$$
M(x,z)\;\ge\; f(z)+h(z)=F(z)\qquad(\forall x,z).
$$

特别地 $M(x,y)\ge F(y)$。把 $M$ 用 Bregman 改写（加减 $f(z)$）：

$$
\begin{aligned}
M(x,z)
&=
\bigl[f(x)+\langle\nabla f(x),z-x\rangle-f(z)\bigr]
+F(z)
+\frac L2\|z-x\|_2^2\\
&=
F(z)+\frac L2\|z-x\|_2^2-D_f^\xi(z,x).
\end{aligned}
$$

**（ii）$z\mapsto M(x,z)$ 是 $L$-强凸，极小点是 $y$。** 二次项 $\frac L2\|z-x\|^2$ 的强凸模是 $L$，$h$ 凸不减损。$y=\mathrm{Prox}_{h/L}(x-\nabla f(x)/L)$ 按定义就是 $\arg\min_w M(x,w)$。强凸在极小点的二次下界：$0\in\partial_w M(x,y)$，故对一切 $z$

$$
M(x,z)
\;\ge\;
M(x,y)+\frac L2\|z-y\|_2^2
\;\ge\;
F(y)+\frac L2\|z-y\|_2^2.
$$

**（iii）两式拼起来。** 左边用（i）的改写：

$$
F(z)+\frac L2\|z-x\|_2^2-D_f^\xi(z,x)
\;\ge\;
F(y)+\frac L2\|z-y\|_2^2.
$$

移项、并把 $\|z-x\|=\|x-z\|$ 即基本不等式。$\square$

**人话：** $M$ 是 $F$ 的可最小化上界；它比 $F(y)$ 至少还高出一只以 $y$ 为底的碗 $\frac L2\|z-y\|^2$。把这只碗和「$f$ 在 $x$ 处线性化的误差 $D_f$」写回 $F$，就得到基本不等式。

若 $f$ 凸，$D_f^\xi\ge 0$ 可丢掉，得到更常用的

$$
F(y)
\;\le\;
F(z)+\frac L2\|x-z\|_2^2-\frac L2\|y-z\|_2^2.
$$

---

## 11. 近端 GD 的 $O(1/t)$ 与强凸线性率（p.40）

全程 $\alpha_k=1/L$，$x_{k+1}=\mathrm{Prox}_{h/L}(x_k-\nabla f(x_k)/L)$。设 $f$ 凸（于是 $D\ge 0$）。

### 11.1 函数值下降、距离不增

基本不等式里令 $z=x$（同一个 $x$）：右边 $\frac L2\|x-x\|^2-\frac L2\|y-x\|^2-D\le 0$，故 $F(y)\le F(x)$。沿轨道 $F(x_{k+1})\le F(x_k)$。

令 $z=x^*$：$F(y)\ge F(x^*)$ 推出 $\|y-x^*\|\le\|x-x^*\|$。沿轨道 $\|x_{k+1}-x^*\|\le\|x_k-x^*\|$。

### 11.2 $F(x_t)-F^*=O\bigl(L\|x_0-x^*\|_2^2/t\bigr)$

令 $x=x_k$，$y=x_{k+1}$，丢掉 $D\ge 0$：

$$
F(x_{k+1})-F(z)
\;\le\;
\frac L2\|x_k-z\|_2^2-\frac L2\|x_{k+1}-z\|_2^2.
$$

$k=0,\ldots,t-1$ 求和，右边望远镜：

$$
\sum_{k=0}^{t-1}\bigl(F(x_{k+1})-F(z)\bigr)
\;\le\;
\frac L2\|x_0-z\|_2^2-\frac L2\|x_t-z\|_2^2
\;\le\;
\frac L2\|x_0-z\|_2^2.
$$

$F(x_{k+1})$ 单调不增且 $\ge F(z)$（取 $z=x^*$），故左边 $\ge t\bigl(F(x_t)-F(x^*)\bigr)$。因此

$$
F(x_t)-F(x^*)
\;\le\;
\frac{L}{2t}\|x_0-x^*\|_2^2
\;=\;
O\Bigl(\frac{L\|x_0-x^*\|_2^2}{t}\Bigr).
$$

讲义写成 $O(L\|x_0-x^*\|/t)$，漏了范数的平方；量纲上必须是 $\|x_0-x^*\|^2$。

### 11.3 作业：用映射 $G$ 的 $\gamma$-条件也得 $O(1/t)$（题面保留，证明写全）

讲义 HW（p.40 红字，题面照抄）：令

$$
G(x)
\;=\;
x-\mathrm{Prox}_{h/L}\Bigl(x-\frac1L\nabla f(x)\Bigr)
\;=\;
x-y,
$$

并假设

$$
\langle G(x),\, x-x^*\rangle
\;\ge\;
\gamma\bigl(F(x)-F(x^*)\bigr),\qquad \gamma>0.
$$

求证近端 GD（步长 $1/L$）仍有 $F(x_t)-F^*=O(1/t)$。

**人话：** $h=0$ 时 $\mathrm{Prox}=I$，$G(x)=\nabla f(x)/L$，这条就是第 4 节假设 (1) 差一个 $1/L$ 的缩放。$G(x)=0\Leftrightarrow x$ 是近端梯度的不动点 $\Leftrightarrow 0\in\nabla f(x)+\partial h(x)$。下面不引用第 4 节的结论，把倒数增量从头写一遍。

**额外假设（与第 4 节相同角色）。** 下水平集有界：

$$
R
\;:=\;
\max\bigl\{\|x-x^*\|_2:\; F(x)\le F(x_0)\bigr\}
\;<\;\infty.
$$

记 $\varepsilon_k=F(x_k)-F(x^*)$，$y_k=x_k-G(x_k)=x_{k+1}$。

**第一步：函数值下降 $F(y)\le F(x)-\frac L2\|G(x)\|^2$。**  
基本不等式令 $z=x$：$D_f^\xi(x,x)=0$，$\|x-x\|=0$，故

$$
F(y)
\;\le\;
F(x)-\frac L2\|y-x\|_2^2
=
F(x)-\frac L2\|G(x)\|_2^2.
$$

因此 $\varepsilon_{k+1}\le\varepsilon_k$，轨道停在 $\{F\le F(x_0)\}$ 里，$\|x_k-x^*\|\le R$。

**第二步：$\|G(x_k)\|\ge\gamma\varepsilon_k/R$。**  
Cauchy–Schwarz 接 HW 假设：

$$
\gamma\varepsilon_k
=
\gamma\bigl(F(x_k)-F^*\bigr)
\;\le\;
\langle G(x_k),\, x_k-x^*\rangle
\;\le\;
\|G(x_k)\|_2\,\|x_k-x^*\|_2
\;\le\;
R\,\|G(x_k)\|_2,
$$

即 $\|G(x_k)\|_2\ge\gamma\varepsilon_k/R$。

**第三步：递推 $\varepsilon_{k+1}\le\varepsilon_k-\frac{L\gamma^2}{2R^2}\varepsilon_k^2$。**  
把第二步代入第一步：

$$
\varepsilon_{k+1}
\;\le\;
\varepsilon_k-\frac L2\|G(x_k)\|_2^2
\;\le\;
\varepsilon_k-\frac L2\Bigl(\frac{\gamma\varepsilon_k}{R}\Bigr)^2
=
\varepsilon_k-\frac{L\gamma^2}{2R^2}\,\varepsilon_k^2.
$$

若某步右边 $\le 0$，已经到最优。下面设 $\varepsilon_{k+1}>0$。

**第四步：倒数增量。** $\varepsilon_{k+1}\le\varepsilon_k$ 给出 $\varepsilon_k\varepsilon_{k+1}\le\varepsilon_k^2$，于是

$$
\frac1{\varepsilon_{k+1}}-\frac1{\varepsilon_k}
=
\frac{\varepsilon_k-\varepsilon_{k+1}}{\varepsilon_k\varepsilon_{k+1}}
\;\ge\;
\frac{\varepsilon_k-\varepsilon_{k+1}}{\varepsilon_k^2}
\;\ge\;
\frac{L\gamma^2}{2R^2}.
$$

（与第 4 节比：那里下降系数是 $1/(2L)$、$G$ 换成 $\nabla f$；这里 $G$ 已含 $1/L$，下降系数变成 $L/2$。）

**第五步：对 $k=0,\ldots,t-1$ 求和。**

$$
\frac1{\varepsilon_t}-\frac1{\varepsilon_0}
\;\ge\;
\frac{t L\gamma^2}{2R^2},
\qquad
\frac1{\varepsilon_t}
\;\ge\;
\frac1{\varepsilon_0}+\frac{t L\gamma^2}{2R^2}.
$$

因此

$$
F(x_t)-F(x^*)
=
\varepsilon_t
\;\le\;
\frac{1}{\dfrac1{\varepsilon_0}+\dfrac{t L\gamma^2}{2R^2}}
\;\le\;
\frac{2R^2}{L\gamma^2 t}
\;=\;
O\Bigl(\frac1t\Bigr).
$$

不必再 bound $\varepsilon_0$：它只影响有限项，不改变 $O(1/t)$。若还想要与第 4 节同形的显式常数，用 $F(x_0)-F^*\le\varepsilon_0<\infty$ 即可。$\square$

### 11.4 $f$ $m$-强凸：线性收缩

此时 $D_f^\xi(x^*,x_k)\ge\frac m2\|x_k-x^*\|_2^2$。基本不等式令 $z=x^*$：

$$
\begin{aligned}
0
&\le
F(x_{k+1})-F(x^*)\\
&\le
\frac L2\|x_k-x^*\|_2^2
-\frac L2\|x_{k+1}-x^*\|_2^2
-D_f^\xi(x^*,x_k)\\
&\le
\frac L2\|x_k-x^*\|_2^2
-\frac L2\|x_{k+1}-x^*\|_2^2
-\frac m2\|x_k-x^*\|_2^2.
\end{aligned}
$$

整理：

$$
\|x_{k+1}-x^*\|_2^2
\;\le\;
\Bigl(1-\frac mL\Bigr)\|x_k-x^*\|_2^2.
$$

从而

$$
\|x_{k+1}-x^*\|_2
\;\le\;
\sqrt{1-\frac mL}\;\|x_k-x^*\|_2
\;\le\;
\exp\Bigl(-\frac{m}{2L}\Bigr)\|x_k-x^*\|_2.
$$

讲义最后写成 $\|x_{k+1}-x^*\|\le(1-m/L)\|x_k-x^*\|$，把平方漏掉了；**由上面的推导，$(1-m/L)$ 是作用在 $\|\cdot\|^2$ 上的。** 函数值方面，光滑给出 $F-F^*\le\frac L2\|x-x^*\|^2$，故 $F(x_t)-F^*=O\bigl(e^{-mt/L}\bigr)$，与讲义 $\|x_t-x^*\|\le O(e^{-mt/L})$ 一致。

**条件数 $\kappa=L/m$。** 要让 $\bigl(1-m/L\bigr)^t\varepsilon_0\le\varepsilon$，需要 $t\asymp\kappa\log(1/\varepsilon)$ 次迭代。全梯度每次看 $n$ 个样本，总成本 $\asymp n\kappa\log(1/\varepsilon)$。这是第 15 节表格的 GD 一行。

---

## 12. SGD：关键展开、基本不等式、平均迭代 $O(1/\sqrt t)$（p.41–42）

### 12.1 设定

$$
\min_x f(x),\qquad f\text{ 凸}.
$$

（讲义说：要界 $\min_{k\le t}f(x_k)-f^*$，其实假设 (1) 也够；下面按凸来写，$\gamma=1$。）

迭代 $x_{k+1}=x_k-\alpha_k g_k$，$g_k$ 是 $\nabla f(x_k)$ 的替代。SGD 的关键假设是**条件无偏**：

$$
\mathbb{E}\bigl[g_k\bigm| x_0,x_1,\ldots,x_k\bigr]
\;=\;
\nabla f(x_k).
$$

讲义写成 $\mathbb{E}[g_k\mid x_1,\ldots,x_{k-1}]=\nabla f(x_k)$，少 conditioning 了当前的 $x_k$（$x_k$ 由 $g_0,\ldots,g_{k-1}$ 决定，应放进 $\sigma$-代数）。人话：给定我现在站在哪，随机梯度的平均必须等于真梯度。

两个标准构造（p.42 末）：

- **有限和 ERM。** $f=\sum_{i=1}^n f_i$，$f_i(x)=\ell(Y_i,\varphi_x(X_i))/n$。抽 $i_k=j$ 的概率 $p_j$，令 $g_k=\nabla f_{i_k}(x_k)/p_{i_k}$。则 $\mathbb{E}[g_k\mid x_k]=\sum_j\nabla f_j(x_k)=\nabla f(x_k)$。
- **总体风险。** 抽一份新样本 $(X^k,Y^k)\sim P$，$g_k=\nabla_x\ell(\varphi_x(X^k),Y^k)$。

### 12.2 关键展开

固定比较点 $z$（最后会取 $z=x^*$），$\alpha_k=\alpha$：

$$
\begin{aligned}
\|x_{k+1}-z\|_2^2
&=\|x_k-\alpha g_k-z\|_2^2\\
&=\|x_k-z\|_2^2-2\alpha\langle g_k,\, x_k-z\rangle+\alpha^2\|g_k\|_2^2\\
&=\|x_k-z\|_2^2+2\alpha\langle g_k-\nabla f(x_k)+\nabla f(x_k),\, z-x_k\rangle+\alpha^2\|g_k\|_2^2.
\end{aligned}
$$

凸性：$\langle\nabla f(x_k),z-x_k\rangle\le f(z)-f(x_k)$。定义**鞅差**

$$
\epsilon_k
\;:=\;
\langle g_k-\nabla f(x_k),\, z-x_k\rangle.
$$

则

$$
\|x_{k+1}-z\|_2^2
\;\le\;
\|x_k-z\|_2^2
+2\alpha\bigl(f(z)-f(x_k)+\epsilon_k\bigr)
+\alpha^2\|g_k\|_2^2.
$$

移项并除以 $2\alpha$，即讲义的**基本不等式**：

$$
f(x_k)
\;\le\;
f(z)
+\frac{\|x_k-z\|_2^2}{2\alpha}
-\frac{\|x_{k+1}-z\|_2^2}{2\alpha}
+\epsilon_k
+\frac\alpha2\|g_k\|_2^2.
$$

### 12.3 平均迭代，$\alpha=c/\sqrt t$

对 $k=0,\ldots,t-1$ 平均。令 $\bar x_t=\frac1t\sum_{k<t}x_k$。凸性 + Jensen：$f(\bar x_t)\le\frac1t\sum_{k<t}f(x_k)$。望远镜留下 $\|x_0-z\|^2/(2\alpha t)$。

设 $G$ 界住随机梯度与真梯度的欧氏范数（**p.41–42 的 $G$**：轨道上的一致上界。p.43 红字 $G^2$ 是最优点处的噪声二阶矩，同一字母两种角色，§14 再钉一次）：

$$
G
\;:=\;
\max_k\max\bigl\{\|g_k\|_2,\,\|\nabla f(x_k)\|_2\bigr\}
\;<\;\infty,
$$

并设轨道到 $z$ 的距离 $D:=\max_k\|x_k-z\|_2<\infty$（有界域、投影、或步长足够小时常成立）。则 $\frac\alpha2\|g_k\|^2\le\alpha G^2/2$。取 $\alpha=c/\sqrt t$：

$$
f(\bar x_t)
\;\le\;
\frac1t\sum_{k<t}f(x_k)
\;\le\;
f(z)
+\frac{\|x_0-z\|_2^2}{2c\sqrt t}
+\frac{c G^2}{2\sqrt t}
+\frac1t\sum_{k<t}\epsilon_k.
$$

**人话：** 前两项是「距离 / 步长」与「步长 $\times$ 梯度能量」的折中，各贡献 $1/\sqrt t$；最后一项是噪声，期望为 0，高概率是 $\sqrt{\log(1/\delta)/t}$。

### 12.4 $\epsilon_k$ 是有界鞅差

给定 $x_0,\ldots,x_k$，$z-x_k$ 已确定，$\mathbb{E}[g_k-\nabla f(x_k)\mid x_{0:k}]=0$，故

$$
\mathbb{E}[\epsilon_k\mid x_{0:k}]
=\bigl\langle\mathbb{E}[g_k-\nabla f(x_k)\mid x_{0:k}],\, z-x_k\bigr\rangle
=0.
$$

塔性质：$\mathbb{E}[\epsilon_k]=0$。有界性：

$$
|\epsilon_k|
\le\|g_k-\nabla f(x_k)\|_2\,\|z-x_k\|_2
\le 2GD
=:B.
$$

---

## 13. 鞅差的 Azuma / Hoeffding 型尾（p.42，完整递推）

要界 $\sum_{k<t}\epsilon_k$。这是有界鞅差之和，用指数马尔可夫 + 条件矩母函数。

### 13.1 Hoeffding 引理（现场证）

**引理。** $X$ 可测、$\mathbb{E}[X]=0$、$|X|\le B$ a.s.，则对一切 $\lambda\in\mathbb{R}$，

$$
\mathbb{E}\bigl[e^{\lambda X}\bigr]
\;\le\;
\exp\Bigl(\frac{\lambda^2 B^2}2\Bigr).
$$

**证明。** $u\mapsto e^{\lambda u}$ 凸，在 $[-B,B]$ 上不超过弦：

$$
e^{\lambda u}
\;\le\;
\frac{B-u}{2B}\,e^{-\lambda B}+\frac{u+B}{2B}\,e^{\lambda B}.
$$

取期望（$\mathbb{E}[X]=0$）得 $\mathbb{E}[e^{\lambda X}]\le\cosh(\lambda B)$。而 $\cosh u=\sum_{k\ge 0}u^{2k}/(2k)!$，$e^{u^2/2}=\sum_{k\ge 0}(u^2/2)^k/k!$。因为 $(2k)!\ge 2^k k!$（$1\cdot 2\cdots 2k$ 里抽出 $2\cdot 4\cdots 2k=2^k k!$），故 $\cosh u\le e^{u^2/2}$。令 $u=\lambda B$。$\square$

条件形式：$\mathbb{E}[e^{\lambda\epsilon_k}\mid x_{0:k}]\le\exp(\lambda^2 B^2/2)$。

### 13.2 对 $t$ 步做完整递推（填讲义 p.42 的跳步）

令 $S_0=0$，$S_j=\sum_{k=0}^{j-1}\epsilon_k$（于是 $S_t=\sum_{k<t}\epsilon_k$），$\mathcal{F}_j=\sigma(x_0,\ldots,x_j)$。$\epsilon_{j-1}$ 是 $\mathcal{F}_j$-可测，且 $\mathbb{E}[\epsilon_{j-1}\mid\mathcal{F}_{j-1}]=0$、$|\epsilon_{j-1}|\le B$。

马尔可夫：对 $\lambda>0$、$s>0$，

$$
\mathbb{P}(S_t\ge s)
=\mathbb{P}\bigl(e^{\lambda S_t}\ge e^{s\lambda}\bigr)
\le e^{-s\lambda}\,\mathbb{E}\bigl[e^{\lambda S_t}\bigr].
$$

把 $S_t=S_{t-1}+\epsilon_{t-1}$ 代进去。$S_{t-1}$ 对 $\mathcal{F}_{t-1}$ 可测，塔性质：

$$
\mathbb{E}\bigl[e^{\lambda S_t}\bigr]
=
\mathbb{E}\Bigl[e^{\lambda S_{t-1}}\,\mathbb{E}\bigl[e^{\lambda\epsilon_{t-1}}\bigm|\mathcal{F}_{t-1}\bigr]\Bigr].
$$

内层用 Hoeffding 引理的**条件**形式（给定 $\mathcal{F}_{t-1}$，$\epsilon_{t-1}$ 仍零均值、仍 $|\epsilon_{t-1}|\le B$）：

$$
\mathbb{E}\bigl[e^{\lambda\epsilon_{t-1}}\bigm|\mathcal{F}_{t-1}\bigr]
\;\le\;
\exp\bigl(\lambda^2 B^2/2\bigr).
$$

故 $\mathbb{E}[e^{\lambda S_t}]\le e^{\lambda^2 B^2/2}\,\mathbb{E}[e^{\lambda S_{t-1}}]$。从 $t$ 递推到 $0$（共 $t$ 个增量）：

$$
\mathbb{E}\bigl[e^{\lambda S_t}\bigr]
\;\le\;
\exp\Bigl(\frac{t\lambda^2 B^2}2\Bigr).
$$

讲义把 conditioning 写成 $x^{1:t-2}$，少写了当前的 $x_{t-1}$（应进 $\mathcal{F}_{t-1}$），并把某一行的 $\mathbb{E}$ 印丢了。按上面补全后，讲义最后两行成立：

$$
\mathbb{P}(S_t\ge s)
\;\le\;
\exp\Bigl(-s\lambda+\frac{t\lambda^2 B^2}2\Bigr).
$$

对 $\lambda$ 最小化：令 $\psi(\lambda)=-s\lambda+t\lambda^2 B^2/2$，$\psi'(\lambda)=-s+t B^2\lambda=0\Rightarrow\lambda=s/(t B^2)$（$s>0$ 时 $\lambda>0$）。代入 $\psi=-s^2/(2t B^2)$，得到 **Azuma–Hoeffding 单边尾**

$$
\mathbb{P}\Bigl(\sum_{k<t}\epsilon_k\ge s\Bigr)
\;\le\;
\exp\Bigl(-\frac{s^2}{2t B^2}\Bigr).
$$

令右边 $=\delta$，则 $s=B\sqrt{2t\log(1/\delta)}$。于是以概率至少 $1-\delta$，

$$
\sum_{k<t}\epsilon_k
\;\le\;
B\sqrt{2t\log(1/\delta)},
\qquad
\frac1t\sum_{k<t}\epsilon_k
\;\le\;
B\sqrt{\frac{2\log(1/\delta)}{t}}.
$$

这就是讲义红字 $\sum_{k<t}\epsilon_k\le B\sqrt{2t\log(1/\delta)}$。

### 13.3 高概率界与期望界

取 $z=x^*$，以概率 $\ge 1-\delta$，

$$
f(\bar x_t)-f^*
\;\le\;
\frac{\|x_0-x^*\|_2^2}{2c\sqrt t}
+\frac{c G^2}{2\sqrt t}
+B\sqrt{\frac{2\log(1/\delta)}{t}}.
$$

对基本不等式取期望：$\mathbb{E}[\epsilon_k]=0$，塔性质消掉噪声，

$$
\mathbb{E}\bigl[f(\bar x_t)-f^*\bigr]
\;\le\;
\frac{\|x_0-x^*\|_2^2}{2c\sqrt t}
+\frac{c G^2}{2\sqrt t}.
$$

选 $c\sim\|x_0-x^*\|/G$ 使两项平衡，期望超额风险 $O(GR/\sqrt t)$。要 $\varepsilon$ 精度，$t\asymp 1/\varepsilon^2$（凸、光滑但非强凸）。讲义表格把强凸 SGD 写成 $t\asymp 1/\varepsilon$，见下一节。

**常见误区：** 这个 $O(1/\sqrt t)$ 是**平均迭代** $\bar x_t$ 的函数值，不是最后一点 $x_t$。非强凸时最后一点可以振荡；实践中会做平均或取历史上函数值最好的点。

---

## 14. 强凸 SGD：协强制与线性到邻域（p.43）

现在 $f$ $m$-强凸且 $\nabla f\in\mathrm{Lip}(L)$。无偏随机梯度再加二阶矩控制（讲义 p.43 红字 $G^2$）

$$
\mathbb{E}\bigl[\|g(x)\|_2^2\bigr]
\;\le\;
G^2+M_f\|\nabla f(x)\|_2^2.
$$

**这个 $G^2$ 不是 p.41 那个一致上界。** p.41–42 的 $G=\max_k\max\{\|g_k\|,\|\nabla f(x_k)\|\}$ 用来把 $\alpha\|g_k\|^2$ 收成 $\alpha G^2$，给凸 SGD 的 $O(1/\sqrt t)$。p.43 的 $G^2$ 是**最优点处还剩下的噪声能量**：$\nabla f(x^*)=0$ 时 $\mathbb{E}\|g(x^*)\|^2\le G^2$。讲义两个地方都写 $G$，后面「Reduce the variance $G^2$」指的是本页这个噪声地板。

**人话：** 把 $\mathbb{E}\|g\|^2$ 拆成「固有噪声 $G^2$」和「随 $\|\nabla f\|$ 变大的部分」。方差分解 $\mathbb{E}\|g\|^2=\|\nabla f\|^2+\mathbb{E}\|g-\nabla f\|^2$ 表明通常 $M_f\ge 1$；若噪声均匀有界则 $G^2$ 是方差上界。GD 对应 $G=0$、$M_f=1$。SVRG 要消灭的正是这个 $G^2$：控制变量让 $x\approx\tilde x$ 时 $\mathbb{E}\|G_{\mathrm{SVRG}}\|^2\to 0$。

### 14.1 协强制不等式（完整证明）

**定理。** $f$ $m$-强凸、$\nabla f\in\mathrm{Lip}(L)$，则对一切 $x,y$，

$$
\langle\nabla f(x)-\nabla f(y),\, x-y\rangle
\;\ge\;
\frac{mL}{m+L}\|x-y\|_2^2
+\frac1{m+L}\|\nabla f(x)-\nabla f(y)\|_2^2.
$$

先证光滑**凸**函数的协强制（附录 p.160 的「blue part」）。

**引理（$m=0$）。** $f$ 凸且 $\nabla f\in\mathrm{Lip}(L)$，则

$$
\langle\nabla f(x)-\nabla f(y),\, x-y\rangle
\;\ge\;
\frac1L\|\nabla f(x)-\nabla f(y)\|_2^2.
$$

**证明。** 令 $\varphi(z)=f(z)-\langle\nabla f(y),z\rangle$。则 $\nabla\varphi\in\mathrm{Lip}(L)$，$\nabla\varphi(y)=0$，故 $y\in\arg\min\varphi$。从任意 $z$ 做一步步长 $1/L$ 的 GD：

$$
\varphi\Bigl(z-\frac1L\nabla\varphi(z)\Bigr)
\;\le\;
\varphi(z)-\frac1{2L}\|\nabla\varphi(z)\|_2^2.
$$

左边 $\ge\varphi(y)$，故 $\varphi(z)-\varphi(y)\ge\frac1{2L}\|\nabla\varphi(z)\|^2$，即

$$
f(z)
\;\ge\;
f(y)+\langle\nabla f(y),z-y\rangle+\frac1{2L}\|\nabla f(z)-\nabla f(y)\|_2^2.
$$

写两遍 $(z,y)\leftarrow(x,y)$ 与 $(z,y)\leftarrow(y,x)$ 再相加，交叉项变成 $\langle\nabla f(x)-\nabla f(y),x-y\rangle$，系数 $1/(2L)+1/(2L)=1/L$。$\square$

作为副产品（令 $y=x^*$，$\nabla f(x^*)=0$）：

$$
\|\nabla f(x)-\nabla f(x^*)\|_2^2
\;\le\;
2L\bigl(f(x)-f(x^*)-\langle\nabla f(x^*),x-x^*\rangle\bigr).
$$

$f$ 凸且 $\nabla f(x^*)=0$ 时即 $\|\nabla f(x)\|^2\le 2L(f(x)-f^*)$。SVRG 对每个 $f_i$ 用的是带 Bregman 余项的版本。

**回到 $m>0$。** 令 $h(x)=f(x)-\frac m2\|x\|_2^2$。则 $h$ 凸，$\nabla h(x)=\nabla f(x)-mx$，且 $\nabla h\in\mathrm{Lip}(L-m)$（因为 $\nabla^2 h=\nabla^2 f-mI\preceq(L-m)I$，或直接从定义验证）。对 $h$ 用引理：

$$
\langle\nabla h(x)-\nabla h(y),\, x-y\rangle
\;\ge\;
\frac1{L-m}\|\nabla h(x)-\nabla h(y)\|_2^2.
$$

令 $\Delta=x-y$，$g=\nabla f(x)-\nabla f(y)$，则 $\nabla h(x)-\nabla h(y)=g-m\Delta$，

$$
\langle g,\Delta\rangle-m\|\Delta\|^2
\;\ge\;
\frac1{L-m}\bigl(\|g\|^2-2m\langle g,\Delta\rangle+m^2\|\Delta\|^2\bigr).
$$

两边乘 $L-m$：

$$
(L-m)\langle g,\Delta\rangle-m(L-m)\|\Delta\|^2
\;\ge\;
\|g\|^2-2m\langle g,\Delta\rangle+m^2\|\Delta\|^2.
$$

把 $\langle g,\Delta\rangle$ 收到左边：

$$
\langle g,\Delta\rangle\bigl(L-m+2m\bigr)
\;\ge\;
\|g\|^2+\bigl(m(L-m)+m^2\bigr)\|\Delta\|^2
=\|g\|^2+mL\|\Delta\|^2,
$$

即 $\langle g,\Delta\rangle(L+m)\ge\|g\|^2+mL\|\Delta\|^2$。除以 $m+L$ 即定理。$\square$

### 14.2 代入 SGD 展开

$\nabla f(x^*)=0$，故 $\langle\nabla f(x_k),x^*-x_k\rangle=-\langle\nabla f(x_k)-\nabla f(x^*),x_k-x^*\rangle$。用协强制：

$$
\langle\nabla f(x_k),x^*-x_k\rangle
\;\le\;
-\frac{mL}{m+L}\|x_k-x^*\|_2^2
-\frac1{m+L}\|\nabla f(x_k)\|_2^2.
$$

与第 12.2 节同样展开（比较点 $z=x^*$），$\epsilon_k=\langle g_k-\nabla f(x_k),x^*-x_k\rangle$：

$$
\begin{aligned}
\|x_{k+1}-x^*\|_2^2
&=
\|x_k-x^*\|_2^2
-2\alpha\langle g_k,x_k-x^*\rangle
+\alpha^2\|g_k\|_2^2\\
&=
\|x_k-x^*\|_2^2
+2\alpha\langle\nabla f(x_k),x^*-x_k\rangle
+2\alpha\epsilon_k
+\alpha^2\|g_k\|_2^2.
\end{aligned}
$$

把协强制代进中间那项：

$$
\begin{aligned}
\|x_{k+1}-x^*\|_2^2
&\le
\Bigl(1-\frac{2\alpha m L}{m+L}\Bigr)\|x_k-x^*\|_2^2
-\frac{2\alpha}{m+L}\|\nabla f(x_k)\|_2^2
+2\alpha\epsilon_k
+\alpha^2\|g_k\|_2^2.
\end{aligned}
$$

（讲义 p.43 把 $2\alpha\epsilon_k$ 仍写成 $\epsilon_k$，只是记号。）对 $\mathcal{F}_k=\sigma(x_{0:k})$ 取条件期望：$\mathbb{E}[\epsilon_k\mid\mathcal{F}_k]=0$，再取全期望，$\mathbb{E}[\epsilon_k]=0$。红字 $G^2$ 在这里进场——用 $\mathbb{E}\|g_k\|^2\le G^2+M_f\|\nabla f(x_k)\|^2$ 替换最后一项：

$$
\mathbb{E}[\alpha^2\|g_k\|_2^2]
\;\le\;
\alpha^2 G^2+\alpha^2 M_f\,\mathbb{E}\|\nabla f(x_k)\|_2^2.
$$

$\|\nabla f\|^2$ 的系数合并为 $\alpha^2 M_f-2\alpha/(m+L)$：

$$
\begin{aligned}
\mathbb{E}\|x_{k+1}-x^*\|_2^2
&\le
\Bigl(1-\frac{2\alpha m L}{m+L}\Bigr)\mathbb{E}\|x_k-x^*\|_2^2
+\alpha^2 G^2\\
&\qquad
+\Bigl(\alpha^2 M_f-\frac{2\alpha}{m+L}\Bigr)\mathbb{E}\|\nabla f(x_k)\|_2^2.
\end{aligned}
$$

$G^2$ 这一项**不随** $\|\nabla f(x_k)\|\to 0$ 消失：它就是噪声地板。后面 SVRG 用控制变量把这一项换成 $O(f(x)-f^*+f(\tilde x)-f^*)$，在最优点处为 0。

选 $\alpha$ 使梯度能量的系数 $\le 0$，并保证收缩因子在 $(0,1)$：

$$
\alpha
\;\le\;
\frac{2}{(m+L)M_f},
\qquad
\alpha
\;<\;
\frac{m+L}{2mL}.
$$

讲义取 $M_f\ge 1$，$\alpha=1/(L M_f)$，并验证它落在上述区间内。因为 $L\ge m$，有 $2L/(m+L)\ge 1$，从而 $\frac{2\alpha m L}{m+L}\ge\alpha m$，收缩因子

$$
1-\frac{2\alpha m L}{m+L}
\;\le\;
1-\alpha m.
$$

丢掉非正的 $\|\nabla f\|^2$ 项：

$$
\mathbb{E}\|x_{k+1}-x^*\|_2^2
\;\le\;
(1-\alpha m)\,\mathbb{E}\|x_k-x^*\|_2^2
+\alpha^2 G^2.
$$

### 14.3 线性收敛到邻域 $\alpha G^2/m$

这是线性递推 $u_{k+1}\le(1-\rho)u_k+C$，$\rho=\alpha m$，$C=\alpha^2 G^2$。展开

$$
\begin{aligned}
\mathbb{E}\|x_k-x^*\|_2^2
&\le
(1-\alpha m)^k\,\mathbb{E}\|x_0-x^*\|_2^2
+\alpha^2 G^2\sum_{j=0}^{k-1}(1-\alpha m)^j\\
&\le
(1-\alpha m)^k\,\mathbb{E}\|x_0-x^*\|_2^2
+\frac{\alpha^2 G^2}{\alpha m}\\
&=
(1-\alpha m)^k\,\mathbb{E}\|x_0-x^*\|_2^2
+\frac{\alpha G^2}{m}.
\end{aligned}
$$

**人话：** 前一项指数消失，像 GD；后一项是噪声地板，半径 $\alpha G^2/m$。步长越小地板越低，但收缩越慢。常数步长 SGD **不能**精确到 $x^*$，除非 $G=0$（没有梯度噪声）。这就是为什么要方差缩减。

若用递减步长 $\alpha_k\sim 1/(mk)$，强凸 SGD 的函数值可以 $O(1/(mt))$，迭代复杂度 $t\asymp 1/\varepsilon$（表格里 SGD 的那一行）。

---

## 15. GD vs SGD 的计算复杂度（p.43–44）

ERM：$f=\sum_{i=1}^n f_i$（或 $\frac1n\sum\psi_i$），每次算一个 $\nabla f_i$ 的成本记为 $1$，全梯度成本 $n$。精度 $\varepsilon$ 指 $\mathbb{E}[f(x)-f^*]\le\varepsilon$ 或 $\mathbb{E}\|x-x^*\|^2\le\varepsilon$（强凸时两者差一个 $m,L$ 因子）。

讲义 p.43 的表（强凸、SGD 用到精度 $\varepsilon$ 所需的迭代，不把 $\kappa$ 写进 GD）：

|  | 迭代复杂度 | 每次迭代成本 | 总计算量 |
|--|------------|--------------|----------|
| GD | $\log(1/\varepsilon)$ | $n$ | $n\log(1/\varepsilon)$ |
| SGD | $1/\varepsilon$ | $1$ | $1/\varepsilon$ |

把条件数 $\kappa=L/m$ 写回去（p.44 比较 SVRG 时用的才是这张）：

|  | 迭代次数 | 每次成本 | 总成本 |
|--|----------|----------|--------|
| GD | $\kappa\log(1/\varepsilon)$ | $n$ | $n\kappa\log(1/\varepsilon)$ |
| SGD（强凸，递减步长） | $O(1/\varepsilon)$ | $1$ | $O(1/\varepsilon)$ |
| SGD（凸，平均） | $O(1/\varepsilon^2)$ | $1$ | $O(1/\varepsilon^2)$ |

**何时 SGD 更划算（讲义原话）。** 大样本、中等精度，使得 $\frac1\varepsilon < n\log\frac1\varepsilon$。例如 $n=10^6$、$\varepsilon=10^{-3}$：SGD 约 $10^3$ 量级的梯度，GD 即使 $\kappa=1$ 也要 $n\log(1/\varepsilon)\sim 10^7$。若你要 $\varepsilon=e^{-n}$ 那种荒谬精度，GD 的对数依赖又回来了。

SGD 的短板是地板 $G^2$：精度进入噪声区以后，再迭代也只是在极小点附近抖动。SVRG 就是来拆这根刺的。

---

## 16. 控制变量与 SVRG（Johnson–Zhang，p.44）

### 16.1 控制变量

要估 $\mathbb{E}[X]$，找一个与 $X$ **正相关**、且 $\mathbb{E}[Y]$ **已知**的 $Y$，令

$$
Z_\theta
\;=\;
X-\theta\bigl(Y-\mathbb{E}[Y]\bigr).
$$

仍无偏：$\mathbb{E}[Z_\theta]=\mathbb{E}[X]$。方差

$$
\mathrm{Var}(Z_\theta)
=\mathrm{Var}(X)+\theta^2\mathrm{Var}(Y)-2\theta\mathrm{Cov}(X,Y).
$$

$\theta$ 小且 $\mathrm{Cov}>0$ 时，方差比 $\mathrm{Var}(X)$ 小。最优 $\theta^*=\mathrm{Cov}(X,Y)/\mathrm{Var}(Y)$。

**SVRG 的选择（Johnson & Zhang, 2013；讲义拼成 Jonson）。** 在当前点 $x_k$ 与快照 $\tilde x$ 上，

$$
X=\frac{\nabla f_{i_k}(x_k)}{p_{i_k}},
\qquad
Y=\frac{\nabla f_{i_k}(\tilde x)}{p_{i_k}},
\qquad
\theta=1,
$$

且 $\mathbb{E}[Y]=\nabla f(\tilde x)$（全梯度，外层算一次存起来）。于是

$$
G
\;=\;
\frac{\nabla f_{i}(x)}{p_i}
-\frac{\nabla f_{i}(\tilde x)}{p_i}
+\nabla f(\tilde x)
$$

对 $\nabla f(x)$ 无偏。若 $x\approx\tilde x$，两个随机梯度相消，$\mathrm{Var}(G)$ 随 $\|x-\tilde x\|$ 变小——这是 SGD 做不到的。

### 16.2 算法（含近端，伪代码）

目标 $F(x)=f(x)+h(x)=\sum_{i=1}^n f_i(x)+h(x)$。内层循环长度 $T$，步长 $\alpha$。

```
输入：x_0，内层步数 T，步长 α，概率 (p_i)
令 x_{0,0}=⋯=x_{0,T-1} ← x_0          ▷ 第 0 个 epoch 是常值
for s = 1, 2, … until 收敛:
    抽 j ∼ Unif{0,1,…,T-1}
    ˜x_{s-1} ← x_{s-1,j}               ▷ 随机快照（也可用最后一点）
    ˜g_s ← ∇f(˜x_{s-1})                ▷ 全梯度，成本 n
    x_{s,0} ← ˜x_{s-1}
    for k = 0, 1, …, T-1:
        抽 i_k = j，概率 p_j
        g_{s,k}  ← ∇f_{i_k}(x_{s,k}) / p_{i_k}
        ˜g_{s,k} ← ∇f_{i_k}(˜x_{s-1}) / p_{i_k}
        x_{s,k+1} ← Prox_{α h}( x_{s,k} - α (g_{s,k} - ˜g_{s,k} + ˜g_s) )
    end
end
```

每个 epoch 的梯度次数：一次全梯度 $n$，内层每步两个分量梯度，共 $2T+n$。

收敛定理（讲义，$h=0$）：每个 $f_i$ 凸、$\nabla f_i\in\mathrm{Lip}(L)$，$f$ $m$-强凸，$0<c_1\le p_i\le c_2$。若

$$
\rho
\;=\;
\frac1{m\alpha(1-2L\alpha)T}
+\frac{2L\alpha}{1-2L\alpha}
\;<\;1,
$$

则

$$
\mathbb{E}\bigl[f(\tilde x_s)-f^*\bigr]
\;\le\;
\rho^s\bigl(f(\tilde x_0)-f^*\bigr).
$$

讲义取 $T\ge 9\kappa$（$\kappa=L/m$）、$\alpha=1/(6L)$，并声称 $\rho<5/6$。下一节补全证明后会把这个数字算清楚：公式本身是对的，$9\kappa$ 与 $5/6$ 对不上，但正确选 $T\asymp\kappa$ 仍给出总成本 $(n+\kappa)\log(1/\varepsilon)$。

---

## 17. SVRG 证明（p.45，把跳掉的步骤全部补上）

以下按讲义取 $h=0$，内层是

$$
x_{s,k+1}=x_{s,k}-\alpha G_{s,k},
\qquad
G_{s,k}=g_{s,k}-\tilde g_{s,k}+\tilde g_s.
$$

条件无偏：$\mathbb{E}[G_{s,k}\mid x_{s,0:k}]=\nabla f(x_{s,k})$。鞅差 $\epsilon_{s,k}=\langle G_{s,k}-\nabla f(x_{s,k}),\, x^*-x_{s,k}\rangle$ 条件期望为 0。为把常数写成讲义的 $4L$，下面用均匀抽样的标准记法（Johnson–Zhang）：

$$
f(x)=\frac1n\sum_{i=1}^n\psi_i(x),
\qquad
g=\nabla\psi_i(x),\qquad
G=\nabla\psi_i(x)-\nabla\psi_i(\tilde x)+\nabla f(\tilde x),
$$

每个 $\psi_i$ 凸且 $\nabla\psi_i\in\mathrm{Lip}(L)$。$p_i$ 只在 $c_1,c_2$ 之间变化时，$L$ 换成 $L/c_1$ 量级，结论形式不变。

### 17.1 关键引理：$\|\nabla\phi(x)-\nabla\phi(y)\|^2\le 2L\, D_\phi(x,y)$

$\phi$ 凸、$\nabla\phi\in\mathrm{Lip}(L)$。第 14.1 节已经证明

$$
\phi(x)
\;\ge\;
\phi(y)+\langle\nabla\phi(y),x-y\rangle+\frac1{2L}\|\nabla\phi(x)-\nabla\phi(y)\|_2^2,
$$

即

$$
\|\nabla\phi(x)-\nabla\phi(y)\|_2^2
\;\le\;
2L\bigl(\phi(x)-\phi(y)-\langle\nabla\phi(y),x-y\rangle\bigr)
=2L\, D_\phi(x,y).
$$

特别地，若 $y=x^*$ 且 $\nabla\phi(x^*)=0$，则 $\|\nabla\phi(x)\|^2\le 2L(\phi(x)-\phi^*)$。对单个 $\psi_i$，一般 $\nabla\psi_i(x^*)\neq 0$，必须保留 Bregman 余项；对 $i$ 取期望后余项会消失。

### 17.2 $\mathbb{E}\|G_{s,k}\|^2\le 4L\,\mathbb{E}\bigl[f(x_{s,k})-f^*+f(\tilde x_{s-1})-f^*\bigr]$（按 p.45 逐步展开）

讲义红字是这条。下面按幻灯片的 $p_i$ 写法走，再说明均匀抽样怎样把 $p_i$ 消掉得到 $4L$。

冻结 epoch $s$、内层步 $k$。简写 $x=x_{s,k}$、$\tilde x=\tilde x_{s-1}$、$i=i_k$，

$$
G
=
\frac{\nabla f_i(x)}{p_i}
-\frac{\nabla f_i(\tilde x)}{p_i}
+\nabla f(\tilde x).
$$

**第一步：加减 $\nabla f_i(x^*)/p_i$。** $\nabla f(x^*)=0$，故 $\mathbb{E}_i[\nabla f_i(x^*)/p_i]=\sum_j\nabla f_j(x^*)=\nabla f(x^*)=0$。于是

$$
G
=
\underbrace{\Bigl(\frac{\nabla f_i(x)}{p_i}-\frac{\nabla f_i(x^*)}{p_i}\Bigr)}_{a}
-
\underbrace{\Bigl(\frac{\nabla f_i(\tilde x)}{p_i}-\frac{\nabla f_i(x^*)}{p_i}-\nabla f(\tilde x)\Bigr)}_{b}.
$$

$\|a-b\|^2\le 2\|a\|^2+2\|b\|^2$，再对 $i\sim(p_j)$ 与历史取期望：

$$
\mathbb{E}\|G\|^2
\;\le\;
2\mathbb{E}\Bigl\|\frac{\nabla f_i(x)-\nabla f_i(x^*)}{p_i}\Bigr\|^2
+2\mathbb{E}\Bigl\|\frac{\nabla f_i(\tilde x)}{p_i}-\nabla f(\tilde x)-\frac{\nabla f_i(x^*)}{p_i}\Bigr\|^2.
$$

**第二步：第二项是中心化随机变量的方差。** 令 $\xi=\nabla f_i(\tilde x)/p_i-\nabla f_i(x^*)/p_i$。则

$$
\mathbb{E}_i[\xi]
=
\nabla f(\tilde x)-\nabla f(x^*)
=
\nabla f(\tilde x),
$$

故第二项是 $\mathbb{E}\|\xi-\mathbb{E}\xi\|^2=\mathrm{Var}(\xi)\le\mathbb{E}\|\xi\|^2$。于是

$$
\mathbb{E}\|G\|^2
\;\le\;
2\mathbb{E}\Bigl\|\frac{\nabla f_i(x)-\nabla f_i(x^*)}{p_i}\Bigr\|^2
+2\mathbb{E}\Bigl\|\frac{\nabla f_i(\tilde x)-\nabla f_i(x^*)}{p_i}\Bigr\|^2.
$$

这就是讲义 p.45 中间两行（它把 $\nabla f(x^*)$ 写成 $f_{i_k}(x^*)$，括号不齐，意思是这一步）。

**第三步：换成均匀抽样，套 17.1。** 讲义最后写成 $4L$、没有 $1/p_i$，对应标准记法 $f=\frac1n\sum_{j=1}^n\psi_j$、$p_j=1/n$、$G=\nabla\psi_i(x)-\nabla\psi_i(\tilde x)+\nabla f(\tilde x)$（此时 $\nabla f_i/p_i=\nabla\psi_i$）。对每个凸、$\nabla\psi_i\in\mathrm{Lip}(L)$ 的 $\psi_i$ 用 17.1：

$$
\|\nabla\psi_i(x)-\nabla\psi_i(x^*)\|_2^2
\;\le\;
2L\,D_{\psi_i}(x,x^*)
=
2L\bigl(\psi_i(x)-\psi_i(x^*)-\langle\nabla\psi_i(x^*),x-x^*\rangle\bigr).
$$

对 $i\sim\mathrm{Unif}$ 取期望。Bregman 的交叉项

$$
\mathbb{E}_i\bigl[\psi_i(x)-\psi_i(x^*)-\langle\nabla\psi_i(x^*),x-x^*\rangle\bigr]
=
f(x)-f^*-\langle\nabla f(x^*),x-x^*\rangle
=
f(x)-f^*,
$$

因为 $\nabla f(x^*)=0$。故

$$
\mathbb{E}_i\|\nabla\psi_i(x)-\nabla\psi_i(x^*)\|_2^2
\;\le\;
2L\bigl(f(x)-f^*\bigr).
$$

$\tilde x$ 同样：$\mathbb{E}_i\|\nabla\psi_i(\tilde x)-\nabla\psi_i(x^*)\|^2\le 2L(f(\tilde x)-f^*)$。代回第二步：

$$
\mathbb{E}\|G\|^2
\;\le\;
2\cdot 2L\bigl(f(x)-f^*\bigr)
+2\cdot 2L\bigl(f(\tilde x)-f^*\bigr)
=
4L\bigl(f(x)-f^*+f(\tilde x)-f^*\bigr).
$$

再对内层历史取期望（$x=x_{s,k}$ 依赖 $\mathcal{F}_{s,k}$）：

$$
\mathbb{E}\|G_{s,k}\|^2
\;\le\;
4L\,\mathbb{E}\bigl[f(x_{s,k})-f^*+f(\tilde x_{s-1})-f^*\bigr].
$$

**非均匀 $p_i$。** 若只知 $c_1\le p_i\le c_2$，第二步多因子 $1/p_i\le 1/c_1$，$L$ 换成 $L/c_1$ 量级，后面 $\rho$ 的形状不变。讲义假设 $0<c_1\le p_i\le c_2$ 就是为此。$\square$

### 17.3 内层递推与 $\rho$

凸性下的关键展开（第 12.2 节，比较点 $x^*$，$\mathbb{E}[\epsilon]=0$）：

$$
\mathbb{E}\|x_{s,k+1}-x^*\|^2
\;\le\;
\mathbb{E}\|x_{s,k}-x^*\|^2
+2\alpha\bigl(f^*-f(x_{s,k})\bigr)
+\alpha^2\mathbb{E}\|G_{s,k}\|^2.
$$

代入 17.2（期望可拆）：

$$
\begin{aligned}
\mathbb{E}\|x_{s,k+1}-x^*\|^2
&\le
\mathbb{E}\|x_{s,k}-x^*\|^2
-2\alpha\,\mathbb{E}[f(x_{s,k})-f^*]\\
&\qquad
+4L\alpha^2\,\mathbb{E}[f(x_{s,k})-f^*]
+4L\alpha^2\,\mathbb{E}[f(\tilde x_{s-1})-f^*]\\
&=
\mathbb{E}\|x_{s,k}-x^*\|^2
-2\alpha(1-2L\alpha)\,\mathbb{E}[f(x_{s,k})-f^*]\\
&\qquad
+4L\alpha^2\,\mathbb{E}[f(\tilde x_{s-1})-f^*].
\end{aligned}
$$

需要 $\alpha<1/(2L)$ 才能让 $1-2L\alpha>0$。移项并对 $k=0,\ldots,T-1$ 求和：

$$
\begin{aligned}
&\mathbb{E}\|x_{s,T}-x^*\|^2
+2\alpha(1-2L\alpha)\sum_{k=0}^{T-1}\mathbb{E}[f(x_{s,k})-f^*]\\
&\qquad\le
\mathbb{E}\|x_{s,0}-x^*\|^2
+4LT\alpha^2\,\mathbb{E}[f(\tilde x_{s-1})-f^*].
\end{aligned}
$$

丢掉左边的距离（非负）。快照 $\tilde x_s=x_{s,j}$、$j\sim\mathrm{Unif}\{0,\ldots,T-1\}$，故

$$
\mathbb{E}\bigl[f(\tilde x_s)-f^*\bigr]
=\frac1T\sum_{k=0}^{T-1}\mathbb{E}\bigl[f(x_{s,k})-f^*\bigr].
$$

又 $x_{s,0}=\tilde x_{s-1}$，因此

$$
2\alpha(1-2L\alpha)\,T\,\mathbb{E}[f(\tilde x_s)-f^*]
\;\le\;
\mathbb{E}\|\tilde x_{s-1}-x^*\|^2
+4LT\alpha^2\,\mathbb{E}[f(\tilde x_{s-1})-f^*].
$$

（讲义有一处把右边的 $f(\tilde x_s)$ 和 $f(\tilde x_{s-1})$ 写成同一个，那是笔误：方差项必须来自**上一轮**快照。）

强凸：$f(\tilde x)-f^*\ge\frac m2\|\tilde x-x^*\|^2$，即 $\|\tilde x-x^*\|^2\le\frac2m(f(\tilde x)-f^*)$。代入

$$
2\alpha(1-2L\alpha)\,T\,\mathbb{E}[f(\tilde x_s)-f^*]
\;\le\;
\Bigl(\frac2m+4LT\alpha^2\Bigr)\mathbb{E}[f(\tilde x_{s-1})-f^*].
$$

两边除以 $2\alpha(1-2L\alpha)T$：

$$
\begin{aligned}
\rho
&=\frac{2/m+4LT\alpha^2}{2\alpha(1-2L\alpha)T}
=\frac1{m\alpha(1-2L\alpha)T}+\frac{2L\alpha}{1-2L\alpha}.
\end{aligned}
$$

这就是讲义的 $\rho$。于是 $\mathbb{E}[f(\tilde x_s)-f^*]\le\rho\,\mathbb{E}[f(\tilde x_{s-1})-f^*]$，迭代得 $\rho^s$。

### 17.4 代入 $\alpha=1/(6L)$、$T\ge 9\kappa$

$\alpha=1/(6L)$ 时 $2L\alpha=1/3$，$1-2L\alpha=2/3$，于是

$$
\frac{2L\alpha}{1-2L\alpha}=\frac{1/3}{2/3}=\frac12,
\qquad
m\alpha(1-2L\alpha)=\frac{m}{6L}\cdot\frac23=\frac{m}{9L}=\frac1{9\kappa}.
$$

故

$$
\rho
=\frac{9\kappa}{T}+\frac12.
$$

- $T\ge 9\kappa$ $\Rightarrow$ $\rho\le 1+1/2=3/2>1$，**不能收缩**。讲义「$T\ge 9\kappa\Rightarrow\rho<5/6$」与它自己写出的 $\rho$ 公式在算术上对不上（p.45 很跳，常数也没对完）。
- 要 $\rho<1$：$9\kappa/T+1/2<1\Rightarrow T>18\kappa$。
- 要 $\rho<5/6$：$9\kappa/T+1/2<5/6\Rightarrow 9\kappa/T<1/3\Rightarrow T>27\kappa$。

取 $T=27\kappa$，则 $\rho=9\kappa/(27\kappa)+1/2=5/6$，再把 $T$ 略放大或把 $\alpha$ 略改小即可 $\rho<5/6$。例如 $T=28\kappa$ 已有 $\rho<5/6$。

**人话：** 内层必须跑大约 $\kappa$ 量级步，快照才够「新」，方差才够小；具体是 $9\kappa$ 还是 $27\kappa$ 只影响隐藏常数，不改变后面的大 $O$。

### 17.5 总成本：$(n+\kappa)\log(1/\varepsilon)$ vs GD 的 $n\kappa\log(1/\varepsilon)$

$\rho\le 5/6$ 时，要 $\rho^S(f(\tilde x_0)-f^*)\le\varepsilon$，epoch 数

$$
S
\;\le\;
\frac{\log\bigl((f(\tilde x_0)-f^*)/\varepsilon\bigr)}{\log(6/5)}
\;=\;
O\bigl(\log(1/\varepsilon)\bigr).
$$

每个 epoch 成本 $2T+n$。取 $T\asymp\max\{n,\kappa\}$（既满足 $T\gtrsim\kappa$，又不比扫一遍数据贵太多），总梯度次数

$$
(2T+n)\,O\bigl(\log(1/\varepsilon)\bigr)
\;\asymp\;
(n+\kappa)\log\frac1\varepsilon.
$$

GD 是每次全梯度、迭代 $\kappa\log(1/\varepsilon)$ 次，总成本 $n\kappa\log(1/\varepsilon)$。

| 算法 | 总成本（强凸 ERM） |
|------|-------------------|
| GD / 近端 GD | $n\kappa\log(1/\varepsilon)$ |
| SGD（常数步长） | 线性到半径 $\alpha G^2/m$，不能任意 $\varepsilon$ |
| SGD（递减步长） | $O(G^2/(m\varepsilon))$（不显含 $n$，但常数差、无加速于 $\kappa$） |
| SVRG | $(n+\kappa)\log(1/\varepsilon)$ |

当 $\kappa\gg 1$ 且 $n\gg 1$ 时，SVRG 比 GD 少一个 $\min\{n,\kappa\}$ 因子：要么少扫 $\kappa$ 遍数据，要么在病态问题上少付 $\kappa$。这是「有限和 + 强凸 + 光滑」设定下，方差缩减相对于朴素 SGD / GD 的核心收获。

---

## 18. 你应该记住的一张表

| 设定 | 步长 | 保证 | 要点 |
|------|------|------|------|
| 仅 $\nabla f\in\mathrm{Lip}(L)$ | $\alpha\in(0,2/L)$，最佳 $1/L$ | $\min_{k<t}\|\nabla f(x_k)\|^2\le\frac{2L}{t}(f(x_0)-f^*)$ | 下降引理，**不必凸**；MM 观点 |
| 再加假设 (1) 与有界水平集 | $1/L$ | $f(x_t)-f^*=O(LR^2/(\gamma^2 t))$ | 倒数增量 $1/\varepsilon_{k+1}-1/\varepsilon_k\ge\gamma^2/(2LR^2)$ |
| PL，$\|\nabla f\|^2\ge 2m(f-f^*)$ | $1/L$ | $f(x_t)-f^*\le(1-m/L)^t(f(x_0)-f^*)$ | 过参数网络；$x^2+3\sin^2 x$ PL 非凸 |
| 近端 GD，$f$ 凸 $L$-光滑，$h$ 凸 | $1/L$ | $F(x_t)-F^*\le\frac{L}{2t}\|x_0-x^*\|^2$ | 基本不等式来自 $M$ 的 $L$-强凸 |
| 近端 GD，$f$ 再 $m$-强凸 | $1/L$ | $\|x_{k+1}-x^*\|^2\le(1-m/L)\|x_k-x^*\|^2$ | 讲义漏了平方 |
| 凸 SGD，无偏、有界 | $\alpha=c/\sqrt t$ | 平均迭代 $O(1/\sqrt t)$（期望与高概率） | 鞅差 + Hoeffding/Azuma |
| 强凸光滑 SGD | $\alpha=1/(LM_f)$ | 线性到邻域 $\alpha G^2/m$ | 协强制；要任意 $\varepsilon$ 必须降方差 |
| SVRG | $\alpha=1/(6L)$，$T\asymp\kappa$ | $\rho^{s}$ 线性，总成本 $(n+\kappa)\log(1/\varepsilon)$ | 控制变量；$\mathbb{E}\|G\|^2\le 4L(\cdots)$ |

近端三件套：

- $I_C$ $\to$ 投影；
- $\lambda\|x\|_1$ $\to$ 软阈值 $S_\lambda$；
- $\lambda\|X\|_*$ $\to$ 奇异值软阈值 $U S_\lambda(\Sigma)V^\top$（von Neumann 或 SVD + Fenchel）。

Prox 坚定非扩张（次梯度单调性），因而 $1$-Lipschitz。闭凸 $h$ 有 Moreau 分解 $x=\mathrm{Prox}_h(x)+\mathrm{Prox}_{h^*}(x)$。

**常见误区（再钉一次）：**

1. 下降引理**不需要**凸性；没有凸性 GD 只保证梯度小，不保证全局最小。
2. PL $\not\Rightarrow$ 凸。强凸 $\Rightarrow$ PL，反过来不行。
3. 核范数近端是对**奇异值**软阈值，不是对矩阵元素。
4. 凸 SGD 的 $O(1/\sqrt t)$ 是平均迭代；强凸常数步长 SGD 有噪声地板。
5. 讲义 p.40 的 $\|x_{k+1}-x^*\|\le(1-m/L)\|x_k-x^*\|$、p.44 的「$T\ge 9\kappa\Rightarrow\rho<5/6$」都是常数/平方没对齐；推导以本节补全的版本为准，大 $O$ 结论不变。

全课的误差分解里，这一份给出了 $E_{\mathrm{opt}}$ 随迭代次数、样本数、条件数怎么走。把 $t$ 或 epoch 数选到 $E_{\mathrm{opt}}$ 与统计误差同阶，优化就不再是瓶颈。

下一份：[02d_Lec2_下界与监督方法](/blog/fods-minimax-supervised-learning/)——非参回归的 minimax 下界，以及凸化损失、plugin、LDA/QDA、SVM、核与 RKHS。
