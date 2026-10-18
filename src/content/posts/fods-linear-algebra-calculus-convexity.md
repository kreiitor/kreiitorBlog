---
title: 数学附录 A：线性代数、微积分与凸分析
description: 从向量与矩阵到 SVD、次梯度和 KKT，为理解学习理论补齐数学工具。
pubDate: 2026-10-11
tags:
  - 数据科学
  - 学习理论
  - FODS
category: course
series: fods
order: 8
cover: /covers/post-math.svg
---

本附录是给**完全零基础**的同学写的。从「向量就是一列数」讲起，但会把内容 的每一个定义、每一条 HW、每一处省略的证明都补成可以逐步跟下来的论证。Lec1 的最小二乘、投影、伪逆，Lec2 的范数 / 近端算子 / 凸优化，后面的核范数与 SVD，全部从这里调用。

读法建议：

1. 第 0–5 节必须会（向量、子空间、投影、范数、对偶）。
2. 第 6–11 节（SVD、PCA、伪逆、Eckart–Young、条件数、核范数）是整门课的线性代数核心。
3. 第 12 节（梯度 / Hessian / Taylor）是后面求导的字典。
4. 第 13–24 节（凸集、凸函数、次梯度、共轭、对偶、KKT）在 Lec2 优化误差和约束问题里反复出现。

记号约定与全课一致：列向量默认，$x'$ 表示 $x^\top$，$\langle x,y\rangle=x^\top y$。内容把核写成 kernal，一律按 kernel 理解。

---

## 0. 这一附录要解决什么

线性代数在这门课里不是为了算行列式，而是为了回答四类问题：

| 问题 | 工具 |
|------|------|
| 「最好的线性拟合」是什么？ | 正交投影、伪逆、最小二乘 |
| 「把数据压到 $s$ 维，重建误差最小」？ | SVD / PCA / Eckart–Young |
| 「方程组差一点点，解会爆掉吗」？ | 条件数 |
| 「矩阵的秩太硬，用什么凸替代」？ | 核范数、奇异值软阈值 |

凸分析回答另一类问题：目标函数长什么样才「往下走一定能到最小」、约束的最优性怎么写成 KKT、对偶间隙何时为零。

---

## 1. 向量、矩阵、$\mathbb{R}^n$、对称与正定、迹

### 1.1 向量就是一列数

一个长度为 $p$ 的（列）向量是

$$
x=\begin{pmatrix}x_1\\x_2\\\vdots\\x_p\end{pmatrix}\in\mathbb{R}^p.
$$

人话：$p$ 个实数排成一列。$\mathbb{R}^n$ 表示所有 $n$ 维实列向量。两个向量相加、乘标量，按坐标做：

$$
(x+y)_i=x_i+y_i,\qquad (\lambda x)_i=\lambda x_i.
$$

这些运算满足结合、交换、分配，以及 $0$ 向量、$-x$。于是 $\mathbb{R}^n$ 是一个**向量空间**（线性空间）。

### 1.2 矩阵就是一张数表，也是线性映射

$A\in\mathbb{R}^{n\times p}$ 有 $n$ 行 $p$ 列，第 $(i,j)$ 个元素记 $a_{ij}$ 或 $A_{ij}$。$\mathbb{R}^{m\times n}$ 表示所有 $m\times n$ 实矩阵。

把 $A$ 的第 $j$ 列写成 $a_{\cdot j}$，则对 $x\in\mathbb{R}^p$，

$$
Ax=\sum_{j=1}^p x_j\,a_{\cdot j}.
$$

人话：$Ax$ 是 $A$ 的各列按 $x$ 的坐标做线性组合。所以矩阵 = 线性映射 $\mathbb{R}^p\to\mathbb{R}^n$。

转置 $A^\top$ 满足 $(A^\top)_{ij}=A_{ji}$，把行变成列。对兼容尺寸，$(AB)^\top=B^\top A^\top$，$(A^\top)^\top=A$。

### 1.3 对称、PSD、PD

$$
\begin{aligned}
\mathbb{S}^n
&=\bigl\{X\in\mathbb{R}^{n\times n}:X=X^\top\bigr\}
&&\text{（对称矩阵）},\\
\mathbb{S}^n_+
&=\bigl\{X\in\mathbb{S}^n:X\succeq 0\bigr\}
&&\text{（半正定，PSD）},\\
\mathbb{S}^n_{++}
&=\bigl\{X\in\mathbb{S}^n:X\succ 0\bigr\}
&&\text{（正定，PD）}.
\end{aligned}
$$

**定义（二次型）。** $X\succeq 0$ 的意思是：对一切 $v\in\mathbb{R}^n$，$v^\top X v\ge 0$。$X\succ 0$ 的意思是：对一切 $v\neq 0$，$v^\top X v>0$。

等价刻画（对称矩阵的谱分解 $X=Q\Lambda Q^\top$，$\Lambda=\mathrm{diag}(\lambda_i)$，$Q^\top Q=I$）：

- $X\succeq 0$ $\iff$ 所有特征值 $\lambda_i\ge 0$；
- $X\succ 0$ $\iff$ 所有 $\lambda_i>0$ $\iff$ $X$ 可逆且 $X^{-1}\succeq 0$。

**常见误区：** 「所有元素 $\ge 0$」不是半正定。$\begin{pmatrix}0&1\\1&0\end{pmatrix}$ 元素有正有零，但特征值 $\pm 1$，不定。

### 1.4 迹及其循环性质

方阵 $X\in\mathbb{R}^{n\times n}$ 的**迹**是对角线之和，也等于特征值之和：

$$
\mathrm{tr}(X)=\sum_{i=1}^n X_{ii}=\sum_{i=1}^n\lambda_i(X).
$$

**定理（循环性质）。** 只要乘积是方阵，

$$
\mathrm{tr}(CD)=\mathrm{tr}(DC).
$$

更一般，$\mathrm{tr}(ABC)=\mathrm{tr}(BCA)=\mathrm{tr}(CAB)$（循环置换）。

**证明。** 设 $C\in\mathbb{R}^{m\times n}$，$D\in\mathbb{R}^{n\times m}$。则

$$
\mathrm{tr}(CD)=\sum_{i=1}^m(CD)_{ii}=\sum_{i=1}^m\sum_{k=1}^n C_{ik}D_{ki},
$$

$$
\mathrm{tr}(DC)=\sum_{k=1}^n(DC)_{kk}=\sum_{k=1}^n\sum_{i=1}^m D_{ki}C_{ik}.
$$

两个双重求和只是下标顺序不同，相等。三个矩阵时令 $C\leftarrow AB$、$D\leftarrow C$ 即得 $\mathrm{tr}((AB)C)=\mathrm{tr}(C(AB))$，其余同理。

**推论。** 若 $Q$ 可逆，则 $\mathrm{tr}(QAQ^{-1})=\mathrm{tr}(A)$。

**证明。** $\mathrm{tr}(QAQ^{-1})=\mathrm{tr}(AQ^{-1}Q)=\mathrm{tr}(A)$。

人话：相似变换不改变迹（因为不改变特征值）。Lec1 里 $\varepsilon^\top\Pi\varepsilon=\mathrm{tr}(\Pi\varepsilon\varepsilon^\top)$ 用的就是 $\mathrm{tr}(ab^\top)=b^\top a$（标量的迹是自己）。

---

## 2. 内积、列空间、核、秩–零化度、四大子空间

### 2.1 标准内积

$$
\langle x,y\rangle=x^\top y=\sum_{i=1}^n x_i y_i,\qquad x,y\in\mathbb{R}^n.
$$

这是正定双线性对称型：$\langle x,x\rangle\ge 0$，等号当且仅当 $x=0$。由它诱导欧氏范数 $\|x\|_2=\sqrt{\langle x,x\rangle}$。

矩阵的 Frobenius 内积把矩阵当成「拉长的向量」：

$$
\langle X,Y\rangle_F=\mathrm{tr}(X^\top Y)=\sum_{i=1}^m\sum_{j=1}^n X_{ij}Y_{ij},\qquad X,Y\in\mathbb{R}^{m\times n}.
$$

### 2.2 列空间与核

设 $A\in\mathbb{R}^{m\times n}$，记 $r=\mathrm{rank}(A)$（列向量中线性无关的最大个数；也等于行秩）。

**列空间 / 值域**

$$
\mathcal{R}(A)=\bigl\{Ax:x\in\mathbb{R}^n\bigr\}\subseteq\mathbb{R}^m.
$$

这是 $A$ 的列的一切线性组合。$\dim\mathcal{R}(A)=r$。

**核 / 零空间**（内容拼成 kernal）

$$
\mathcal{N}(A)=\bigl\{x\in\mathbb{R}^n:Ax=0\bigr\}\subseteq\mathbb{R}^n.
$$

**秩–零化度定理。** $\dim\mathcal{N}(A)=n-r$。

人话：$n$ 个自由变量，被 $r$ 个独立方程钉死，剩下 $n-r$ 维可以随便走且 $Ax$ 仍是 $0$。

**行空间** $\mathcal{R}(A^\top)=\{A^\top y:y\in\mathbb{R}^m\}\subseteq\mathbb{R}^n$，维数也是 $r$。

**左零空间** $\mathcal{N}(A^\top)=\{y\in\mathbb{R}^m:A^\top y=0\}$，维数 $m-r$。

### 2.3 四大子空间及其正交分解

这四块合称 $A$ 的**四大基本子空间**：

| 子空间 | 所在 | 维数 |
|--------|------|------|
| $\mathcal{R}(A)$ | $\mathbb{R}^m$ | $r$ |
| $\mathcal{N}(A^\top)$ | $\mathbb{R}^m$ | $m-r$ |
| $\mathcal{R}(A^\top)$ | $\mathbb{R}^n$ | $r$ |
| $\mathcal{N}(A)$ | $\mathbb{R}^n$ | $n-r$ |

**定理（正交直和）。**

$$
\mathbb{R}^m=\mathcal{R}(A)\oplus\mathcal{N}(A^\top),\qquad
\mathbb{R}^n=\mathcal{R}(A^\top)\oplus\mathcal{N}(A),
$$

并且 $\mathcal{R}(A)\perp\mathcal{N}(A^\top)$，$\mathcal{R}(A^\top)\perp\mathcal{N}(A)$。

**证明。** 先证正交。取 $Ax\in\mathcal{R}(A)$、$y\in\mathcal{N}(A^\top)$，则

$$
\langle Ax,y\rangle=\langle x,A^\top y\rangle=\langle x,0\rangle=0.
$$

同理 $\mathcal{R}(A^\top)\perp\mathcal{N}(A)$。

维数相加已经等于全空间维数，且交是 $\{0\}$（正交子空间之交只能是 $0$），故为直和、等于全空间。

人话：$\mathbb{R}^m$ 里，$A$ 「够得着」的方向（列空间）和「从左边乘 $A^\top$ 会死」的方向（左零空间）互相垂直、拼成整个空间。最小二乘残差 $b-A\widehat x$ 一定落在左零空间里，这就是法方程 $A^\top(b-A\widehat x)=0$。

---

## 3. 投影

### 3.1 幂等：$P^2=P$

**定义。** $P\in\mathbb{R}^{n\times n}$ 称为**投影**（沿某个补空间投影到 $\mathcal{R}(P)$ 上），若它幂等：

$$
P^2=P.
$$

**立刻得到的事实。**

1. $I-P$ 也是投影：$(I-P)^2=I-2P+P^2=I-P$。
2. $\mathcal{R}(P)+\mathcal{N}(P)=\mathbb{R}^n$ 且二者之交为 $\{0\}$（从而是直和）。
3. 对一切 $x\in\mathcal{R}(P)$，$Px=x$（投影到自己的像上是恒等）。
4. $\mathcal{R}(I-P)=\mathcal{N}(P)$，$\mathcal{N}(I-P)=\mathcal{R}(P)$。

**证明。** （2）任意 $x=Px+(I-P)x$，第一项在 $\mathcal{R}(P)$，第二项在 $\mathcal{N}(P)$（因为 $P(I-P)=0$）。若 $x\in\mathcal{R}(P)\cap\mathcal{N}(P)$，则 $x=Pv$ 且 $Px=0$，故 $x=P(Pv)=P^2 v=Pv=x$ 推出 $x=Px=0$。

（3）$x\in\mathcal{R}(P)$ 则 $x=Pv$，故 $Px=P^2 v=Pv=x$。

（4）$y=(I-P)x\iff Py=P(I-P)x=0\iff y\in\mathcal{N}(P)$，故 $\mathcal{R}(I-P)=\mathcal{N}(P)$。对 $I-P$ 再用一遍得另一式。

人话：投影把空间拆成「留下的部分 $\mathcal{R}(P)$」和「扔掉的部分 $\mathcal{N}(P)$」。一般这两个子空间**不必垂直**——那叫斜投影。最小二乘用的是下面的正交投影。

### 3.2 正交投影 $\iff P=P^\top$

**定理。** 对投影 $P$，下列三条等价：

1. $P$ 是**正交投影**：$\mathcal{R}(P)\perp\mathcal{N}(P)$；
2. $P=P^\top$；
3. 对一切 $x$，$\|x\|^2=\|Px\|^2+\|(I-P)x\|^2$（勾股）。

**证明。**

**(1)$\Rightarrow$(2)。** 任意 $x,y$：$x=Px+(I-P)x$，$y=Py+(I-P)y$。正交性给出 $\langle Px,(I-P)y\rangle=0=\langle(I-P)x,Py\rangle$。于是

$$
\langle Px,y\rangle=\langle Px,Py\rangle=\langle x,Py\rangle,
$$

即 $\langle Px,y\rangle=\langle x,Py\rangle$ 对一切 $x,y$，故 $P=P^\top$。

**(2)$\Rightarrow$(1)。** 若 $P=P^\top$ 且 $P^2=P$，取 $u=Px\in\mathcal{R}(P)$、$v=(I-P)y\in\mathcal{N}(P)$，则

$$
\langle u,v\rangle=\langle Px,(I-P)y\rangle=\langle x,P(I-P)y\rangle=\langle x,0\rangle=0.
$$

**(2)$\Rightarrow$(3)。** $\|x\|^2=\|Px+(I-P)x\|^2=\|Px\|^2+\|(I-P)x\|^2+2\langle Px,(I-P)x\rangle$，交叉项 $\langle x,P(I-P)x\rangle=0$。

**(3)$\Rightarrow$(1)。** 取 $x=u+v$，$u\in\mathcal{R}(P)$，$v\in\mathcal{N}(P)$，则 $Px=u$，$(I-P)x=v$，勾股变成 $\|u+v\|^2=\|u\|^2+\|v\|^2$，即 $\langle u,v\rangle=0$。

### 3.3 到子空间的正交投影：存在唯一，且给出最近点

**定理。** 给定子空间 $S\subseteq\mathbb{R}^n$，存在**唯一**的正交投影 $P$ 使 $\mathcal{R}(P)=S$。对任意 $x_0\in\mathbb{R}^n$，$Px_0$ 是 $S$ 中到 $x_0$ 的**唯一最近点**：

$$
\|x_0-Px_0\|=\inf_{y\in S}\|x_0-y\|,
$$

并且当 $y\in S$、$y\neq Px_0$ 时严格不等式成立。

**证明（存在）。** 取 $S$ 的一组标准正交基 $q_1,\ldots,q_k$，令 $Q=[q_1,\ldots,q_k]$，$P=QQ^\top$。则 $P^\top=P$，$P^2=QQ^\top QQ^\top=QQ^\top=P$，且 $\mathcal{R}(P)=S$。

**证明（最近点，补全）。** $x_0-Px_0\in\mathcal{N}(P)=S^\perp$。对任意 $y\in S$，

$$
\begin{aligned}
\|x_0-y\|^2
&=\bigl\|(x_0-Px_0)+(Px_0-y)\bigr\|^2\\
&=\|x_0-Px_0\|^2+\|Px_0-y\|^2
\end{aligned}
$$

因为 $Px_0-y\in S$ 与 $x_0-Px_0\in S^\perp$ 正交。第二项 $\ge 0$，等号当且仅当 $y=Px_0$。因此 $Px_0$ 是唯一最近点。

**证明（唯一性）。** 若 $P,Q$ 都是到 $S$ 的正交投影，则对任意 $x$，$Px$ 与 $Qx$ 都是 $S$ 中到 $x$ 的最近点，故 $Px=Qx$。

**构造公式。** 若 $A$ 的列张成 $S$ 且 $A$ 列满秩，则

$$
P=A(A^\top A)^{-1}A^\top.
$$

这正是最小二乘里到 $\mathcal{R}(A)$ 的帽子矩阵。一般秩时用伪逆：$P=AA^\dagger$（第 8 节）。

---

## 4. 范数公理、$\ell_q$、$\ell_0$、TV、$\|x\|_A$

### 4.1 公理

$\|\cdot\|:\mathbb{R}^p\to\mathbb{R}$ 是**范数**，若对一切向量 $x,y$ 和标量 $\lambda$：

|  | 名字 | 要求 |
|--|------|------|
| (a) | 非负性 | $\|x\|\ge 0$ |
| (b) | 正定性 | $\|x\|=0\iff x=0$ |
| (c) | 绝对齐次 | $\|\lambda x\|=|\lambda|\,\|x\|$ |
| (d) | 三角不等式 | $\|x+y\|\le\|x\|+\|y\|$ |

矩阵范数同样四条，只是定义域换成 $\mathbb{R}^{n\times p}$。

- **拟范数（quasi-norm）**：把 (d) 改成 $\|x+y\|\le c(\|x\|+\|y\|)$，常数 $c\ge 1$。
- **半范数（semi / pseudo-norm）**：丢掉 (b)，允许非零向量范数为 $0$。

由 (a)(c)(d) 自动有 $\bigl|\|x\|-\|y\|\bigr|\le\|x-y\|$（反向三角），故范数作为函数是连续的（Lipschitz 常数 $1$）。

**收敛。** $\{x_k\}\to x$ 指 $\lim_k\|x_k-x\|=0$。有限维上所有范数等价：存在 $c,C>0$ 使 $c\|x\|_a\le\|x\|_b\le C\|x\|_a$，因此「收敛」不依赖于选哪一个范数。

### 4.2 $\ell_q$ 族

对 $q\in[1,\infty]$、$x\in\mathbb{R}^p$，

$$
\|x\|_q=\Bigl(\sum_{i=1}^p |x_i|^q\Bigr)^{1/q}\ (1\le q<\infty),\qquad
\|x\|_\infty=\max_i|x_i|.
$$

- $\ell_2$：欧氏，$\|x\|_2=\sqrt{\sum x_i^2}$。
- $\ell_1$：曼哈顿，$\|x\|_1=\sum|x_i|$。
- $\ell_\infty$：切比雪夫。

**$\ell_q$ 确为范数（$q\in[1,\infty]$）。** (a)(b)(c) 显然。三角不等式：$q=1,\infty$ 直接；$1<q<\infty$ 是 Minkowski 不等式，可由 Hölder（第 5 节）推出：对 $\|z\|_{q^*}=1$，$\sum |x_i+y_i|\,|z_i|\le\|x\|_q+\|y\|_q$，再取对偶表示 $\|x+y\|_q=\sup_{\|z\|_{q^*}\le 1}\langle x+y,z\rangle$。

**$q\in(0,1)$ 时是拟范数，常数 $c=2^{1/q-1}$。** 此时三角不等式失败：取 $x=e_1$、$y=e_2$，

$$
\|x+y\|_q=2^{1/q}>2=\|x\|_q+\|y\|_q.
$$

**补全：拟范数常数。** 当 $0<q\le 1$ 时 $t\mapsto t^q$ 在 $[0,\infty)$ 上亚可加且凹，故

$$
\|x+y\|_q^q=\sum_i|x_i+y_i|^q\le\sum_i\bigl(|x_i|^q+|y_i|^q\bigr)=\|x\|_q^q+\|y\|_q^q.
$$

令 $\alpha=\|x\|_q$、$\beta=\|y\|_q$。由 $t^q$ 凹（Jensen）

$$
\frac{\alpha^q+\beta^q}{2}\le\Bigl(\frac{\alpha+\beta}{2}\Bigr)^q
\implies
(\alpha^q+\beta^q)^{1/q}\le 2^{1/q-1}(\alpha+\beta).
$$

于是 $\|x+y\|_q\le 2^{1/q-1}(\|x\|_q+\|y\|_q)$。

### 4.3 $\ell_0$ 不是范数（内容重点）

$$
\|x\|_0=\bigl|\{i:x_i\neq 0\}\bigr|
$$

只是非零坐标的个数。逐条对照范数公理：

- **(a) 非负：** $\|x\|_0\in\{0,1,\ldots,p\}$，成立。
- **(b) 正定：** $\|x\|_0=0\iff$ 没有非零坐标 $\iff x=0$，成立。
- **(d) 三角：** $\mathrm{supp}(x+y)\subseteq\mathrm{supp}(x)\cup\mathrm{supp}(y)$，故 $\|x+y\|_0\le\|x\|_0+\|y\|_0$，成立（甚至不必放大常数 $c$）。
- **(c) 绝对齐次：失败。** 对 $\lambda\neq 0$ 有 $\mathrm{supp}(\lambda x)=\mathrm{supp}(x)$，故 $\|\lambda x\|_0=\|x\|_0$。取 $x=e_1$、$\lambda=2$：

$$
\|2e_1\|_0=1\neq 2=2\|e_1\|_0.
$$

拟范数只把 (d) 改成带常数 $c$ 的三角，**仍然要求 (c)**；半范数只丢掉 (b)，**仍然要求 (c)**。因此 $\|\cdot\|_0$ 既不是范数，也不是拟范数，也不是半范数。内容仍叫「$\ell_0$ 范数」，全程加上引号理解。

### 4.4 TV 半范数

一维全变差

$$
\|x\|_{\mathrm{TV}}=\sum_{i=1}^{p-1}|x_{i+1}-x_i|.
$$

(a)(c)(d) 成立（绝对值的三角），但 (b) 失败：常数向量 $x=(1,\ldots,1)^\top\neq 0$ 却有 $\|x\|_{\mathrm{TV}}=0$。核（使 TV 为零的向量）恰是全体常数向量。这是半范数。

### 4.5 $\|x\|_A=\sqrt{x^\top A x}$（内容：Check）

**命题。** $A\in\mathbb{S}^p_{++}$ 时，$\|x\|_A=\sqrt{x^\top A x}$ 是范数。

**证明。** $A\succ 0$ 给出 $x^\top A x\ge 0$，且 $=0\iff x=0$，此即 (a)(b)。齐次性：$\|\lambda x\|_A=|\lambda|\|x\|_A$。三角：$\langle x,y\rangle_A:=x^\top A y$ 是内积（正定由 $A\succ 0$），Cauchy–Schwarz $\lvert x^\top A y\rvert\le\|x\|_A\|y\|_A$，故

$$
\|x+y\|_A^2=\|x\|_A^2+\|y\|_A^2+2x^\top Ay\le\bigl(\|x\|_A+\|y\|_A\bigr)^2.
$$

Lec1 的 $\|\theta-\theta^*\|_\Sigma$ 就是这个（$\Sigma$ 半正定时它是半范数：$\Sigma$ 的核方向「看不见」）。

### 4.6 把矩阵拉成向量；Frobenius

$\mathrm{Vec}(A)$ 把 $A$ 按列堆成 $np$ 维向量。定义 $\|A\|_q:=\|\mathrm{Vec}(A)\|_q$。特别

$$
\|A\|_F:=\|\mathrm{Vec}(A)\|_2=\Bigl(\sum_{i,j}a_{ij}^2\Bigr)^{1/2}=\bigl(\mathrm{tr}(AA^\top)\bigr)^{1/2}.
$$

内容写 $\|A\|_2:=\|A\|_F$ 是在「元素 $\ell_2$」的意义上；后面诱导谱范数也叫 $\|A\|_2$。上下文要分清：**向量 $\ell_2$ / Frobenius** 对矩阵元素，**谱范数**对作为算子的 $A$。本这里 Frobenius 一律写 $\|\cdot\|_F$，谱范数写 $\|\cdot\|_2$。

**命题。** 若 $U^\top U=I$ 且 $VV^\top=I$（左乘列正交、右乘行正交），则 $\|UAV\|_F=\|A\|_F$。

**证明。** $\|UAV\|_F^2=\mathrm{tr}(V^\top A^\top U^\top U AV)=\mathrm{tr}(V^\top A^\top AV)=\mathrm{tr}(A^\top A\,VV^\top)=\mathrm{tr}(A^\top A)=\|A\|_F^2$。

特例：左右乘方的正交阵不改变 Frobenius 范数。因此 $\|A\|_F=\|\Sigma\|_F=\bigl(\sum_i\sigma_i^2\bigr)^{1/2}$（SVD 见第 6 节）。

**Cauchy–Schwarz。** $\lvert\mathrm{tr}(A^\top B)\rvert\le\|A\|_F\|B\|_F$，因为左边是 $\lvert\langle A,B\rangle_F\rvert$。

### 4.7 范数球

$$
B_q(r)=\bigl\{x\in\mathbb{R}^p:\|x\|_q\le r\bigr\}.
$$

$q=1$ 是菱形（$\ell_1$ 球，Lasso 的约束集），$q=2$ 是圆盘，$q=\infty$ 是方块。$q$ 越小球越「尖」、越鼓励稀疏；这是 Lec1 约束最小二乘的几何。

内容 只有标题 Computational complexity，没有内容。补一句量级：$n\times n$ 乘加是 $O(n^3)$；$m\times n$ 的完整 SVD 大约 $O(\min\{mn^2,m^2 n\})$。

---

## 5. 对偶范数、Hölder、诱导范数、谱范数

### 5.1 相容（consistent）矩阵范数

若 $\|AB\|\le\|A\|\|B\|$（尺寸兼容时），称该矩阵范数**相容**。诱导范数（下面）都相容。Frobenius 相容：$\|AB\|_F\le\|A\|_F\|B\|_2\le\|A\|_F\|B\|_F$ 其实更强的是 $\|AB\|_F\le\|A\|_2\|B\|_F$，以及 $\|AB\|_F\le\|A\|_F\|B\|_F$（把 $AB$ 的列写成 $A$ 乘 $B$ 的列，对列用 Cauchy–Schwarz，或 $\|AB\|_F^2=\mathrm{tr}(B^\top A^\top AB)\le\|A^\top A\|_2\|B\|_F^2$）。

**$\|A\|_\infty^{\mathrm{entry}}=\max_{i,j}\lvert a_{ij}\rvert$ 不相容。** 取 $2\times 2$ 全 $1$ 矩阵 $J$，$\max\lvert J_{ij}\rvert=1$，但 $J^2=2J$，$\max\lvert(J^2)_{ij}\rvert=2>1\cdot 1$。

### 5.2 对偶范数

对 $\mathbb{R}^p$ 上的范数 $\|\cdot\|$，其对偶范数

$$
\|x\|_*=\sup_{\|y\|\le 1}x^\top y.
$$

这确实是范数：三角不等式来自 $\sup(a+b)\le\sup a+\sup b$；正定性：若 $x\neq 0$，取 $y=x/\|x\|$ 得 $\|x\|_*\ge\|x\|_2^2/\|x\|>0$（更干净：有限维上单位球面紧，连续函数 $y\mapsto x^\top y$ 在 $\|y\|=1$ 上能取到非零值）。

**Hölder 不等式。** 若 $1\le q,r\le\infty$ 且 $\frac1q+\frac1r=1$（约定 $1/\infty=0$），则

$$
\lvert x^\top y\rvert\le\|x\|_q\|y\|_r.
$$

因而 $\|\cdot\|_q$ 的对偶是 $\|\cdot\|_r$。特例：$\ell_2$ 自对偶（Cauchy–Schwarz）；$\ell_1$ 与 $\ell_\infty$ 互为对偶。

**对偶的对偶是自己：** $\|x\|_{**}=\|x\|$（有限维）。

**证明提纲。** $\|x\|_{**}=\sup_{\|y\|_*\le 1}x^\top y$。由定义 $x^\top y\le\|x\|\|y\|_*$，故 $\|x\|_{**}\le\|x\|$。反向：范数的单位球 $B$ 是原点对称的紧凸集，其极 $B^\circ=\{y:x^\top y\le 1\ \forall x\in B\}$ 恰是对偶单位球。有限维双极定理 $B^{\circ\circ}=B$，这正是 $\|x\|=\|x\|_{**}$。

内容写「$\|\cdot\|$ 自对偶当且仅当它是 $\|\cdot\|_2$」。在 $\ell_q$ 族里这是对的（只有 $q=2$）。更精确的说法：用欧氏内积来定义对偶时，**唯一自对偶的内积范数**是欧氏范数；一般范数可以有别的自对偶例子，本课用不到。

矩阵对偶范数用 Frobenius 内积同样定义：$\|X\|_*=\sup_{\|Y\|\le 1}\langle X,Y\rangle_F$。谱范数与核范数互为对偶（第 11 节）。

### 5.3 诱导（算子）范数

把 $A\in\mathbb{R}^{n\times p}$ 看成 $(\mathbb{R}^p,\|\cdot\|_s)\to(\mathbb{R}^n,\|\cdot\|_t)$ 的线性算子：

$$
\|A\|_{s,t}=\sup_{x\neq 0}\frac{\|Ax\|_t}{\|x\|_s}=\sup_{\|x\|_s=1}\|Ax\|_t.
$$

记 $\|A\|_t:=\|A\|_{t,t}$。始终有 $\|Ax\|_t\le\|A\|_{s,t}\|x\|_s$。

**伴随关系。** $\|A\|_{q,r}=\|A^\top\|_{r',q'}$，其中 $\frac1q+\frac1{q'}=\frac1r+\frac1{r'}=1$。

**证明。** $\|Ax\|_r=\sup_{\|y\|_{r'}\le 1}y^\top Ax=\sup_{\|y\|_{r'}\le 1}(A^\top y)^\top x\le\|A^\top\|_{r',q'}\|x\|_q$，取 $\sup_{\|x\|_q=1}$ 得 $\|A\|_{q,r}\le\|A^\top\|_{r',q'}$。对 $A^\top$ 再用一次得反向。

**常用诱导范数的显式公式。**

- **谱范数** $\|A\|_2=\sigma_1(A)=\sqrt{\lambda_{\max}(A^\top A)}$。若 $A=A^\top$，则 $\|A\|_2=\max_i\lvert\lambda_i(A)\rvert$。
- **$\infty$-算子范数** $\|A\|_\infty=\max_i\|A_{i\cdot}\|_1$（行 $\ell_1$ 最大）。
- **$1$-算子范数** $\|A\|_1=\max_j\|A_{\cdot j}\|_1$（列 $\ell_1$ 最大）。

**证明（$\|A\|_\infty=\max_i\|A_{i\cdot}\|_1$）。** 记 $r_i=\|A_{i\cdot}\|_1=\sum_j\lvert a_{ij}\rvert$，$R=\max_i r_i$。对 $\|x\|_\infty=1$，

$$
|(Ax)_i|=\Bigl\lvert\sum_j a_{ij}x_j\Bigr\rvert\le\sum_j\lvert a_{ij}\rvert=\|A_{i\cdot}\|_1\le R,
$$

故 $\|Ax\|_\infty\le R$。取使 $r_{i^*}=R$ 的那一行，令 $x_j=\mathrm{sign}(a_{i^*j})$（$a_{i^*j}=0$ 时取 $0$），则 $\|x\|_\infty=1$ 且 $(Ax)_{i^*}=R$，等号达到。

**证明（$\|A\|_1=\max_j\|A_{\cdot j}\|_1$）。** 对 $\|x\|_1=1$，$Ax=\sum_j x_j A_{\cdot j}$，三角给出 $\|Ax\|_1\le\sum_j\lvert x_j\rvert\|A_{\cdot j}\|_1\le\bigl(\max_j\|A_{\cdot j}\|_1\bigr)\|x\|_1$。取标准基向量 $e_{j^*}$（$j^*$ 取到列 $\ell_1$ 最大）得等号。

**命题（内容 Check）。** $\|A\|_2=\max_{\|x\|_2=\|y\|_2=1}x'Ay$，并且

$$
\|A\|_2^2\le\|A\|_1\|A\|_\infty.
$$

**证明（变分；内容写 $x'Ay$，与 $y^\top Ax$ 相同）。**

$$
\max_{\|x\|_2=\|y\|_2=1}x'Ay
=\max_{\|y\|_2=1}\max_{\|x\|_2=1}x^\top(Ay)
=\max_{\|y\|_2=1}\|Ay\|_2=\|A\|_2,
$$

因为 $\max_{\|x\|_2=1}x^\top z=\|z\|_2$（Cauchy–Schwarz，等号 $x=z/\|z\|_2$）。把 $x,y$ 对调得到同样的 $\max y^\top Ax$。

**证明（乘积界）。** 谱半径不超过任意诱导范数：若 $Bz=\lambda z$、$z\neq 0$，则 $\lvert\lambda\rvert\|z\|\le\|Bz\|\le\|B\|\|z\|$，故 $\rho(B)\le\|B\|$。取 $B=A^\top A$（对称 PSD，$\rho(B)=\lambda_{\max}(B)=\|A\|_2^2$）：

$$
\|A\|_2^2=\rho(A^\top A)\le\|A^\top A\|_1\le\|A^\top\|_1\|A\|_1=\|A\|_\infty\|A\|_1,
$$

其中 $\|A^\top\|_1=\|A\|_\infty$（$A^\top$ 的列 $\ell_1$ 最大 = $A$ 的行 $\ell_1$ 最大），诱导 $1$-范数相容。

---

## 6. 奇异值分解：构造、变分、Courant–Fischer

### 6.1 动机：线性方程组的「逆」（内容 Question）

标量 $ax=b$、$a\neq 0$ 则 $x=a^{-1}b$。方阵可逆则 $x=A^{-1}b$。内容 Question：考虑**相容**方程 $Ax=b$，$A\in\mathbb{R}^{m\times n}$，能否把一切相容对写成 $x=Xb$，其中 $X\in\mathbb{R}^{n\times m}$ **不依赖** $(x,b)$？

**若这样的 $X$ 存在，它必须满足四件事。** 相容意味着 $b=Ax$ 对某个 $x$ 成立。代入 $x=Xb$：

1. $Ax=AXb=AXAx$。希望这对一切 $x$ 成立（不只是某一个特解），即 $A=AXA$。
2. $Xb=XAx=XAXb$。希望这对一切相容的 $b$ 成立；若还要求对一切 $b$（把 $X$ 看成处处定义的「广义逆」）则 $X=XAX$。
3. $P:=AX$ 满足 $P^2=AXAX=AX=P$（用了 $A=AXA$），故 $AX$ 是投影。同理 $Q:=XA$ 满足 $Q^2=XAXA=XA=Q$，故 $XA$ 是投影。
4. 投影不必正交。加上 $(AX)^\top=AX$、$(XA)^\top=XA$，就把两个投影钉成正交投影：$AX$ 投影到 $\mathcal{R}(A)$，$XA$ 投影到 $\mathcal{R}(A^\top)$。

这四条正是 Moore–Penrose 公理（第 8 节）。存在性与 $A$ 的 SVD 是同一件事：有了 SVD，令 $X=V_1\Sigma_1^{-1}U_1^\top$ 即得。

### 6.2 SVD 的陈述

设 $A\in\mathbb{R}^{m\times n}$，$\mathrm{rank}(A)=r$。存在

$$
A=U_1\Sigma_1 V_1^\top=\sum_{i=1}^r\sigma_i u_i v_i^\top,
$$

其中 $U_1\in\mathbb{R}^{m\times r}$、$V_1\in\mathbb{R}^{n\times r}$ 列正交，$\Sigma_1=\mathrm{diag}(\sigma_1,\ldots,\sigma_r)$，$\sigma_1\ge\cdots\ge\sigma_r>0$。完整写法

$$
A=U\Sigma V^\top
=\begin{bmatrix}U_1&U_2\end{bmatrix}
\begin{bmatrix}\Sigma_1&0\\0&0\end{bmatrix}
\begin{bmatrix}V_1^\top\\V_2^\top\end{bmatrix},
$$

$U\in\mathbb{R}^{m\times m}$、$V\in\mathbb{R}^{n\times n}$ 正交。几何：

| 矩阵 | 列是谁的标准正交基 |
|------|-------------------|
| $U_1$ | $\mathcal{R}(A)$ |
| $V_1$ | $\mathcal{R}(A^\top)$ |
| $U_2$ | $\mathcal{N}(A^\top)$ |
| $V_2$ | $\mathcal{N}(A)$ |

### 6.3 从 $A^\top A$ 的谱分解构造（内容证明补全）

实对称矩阵都可正交对角化：$B\in\mathbb{S}^s$ 则存在 $Q^\top Q=I$ 使 $Q^\top BQ=\mathrm{diag}(\lambda_1,\ldots,\lambda_s)$。

$B=A^\top A\in\mathbb{S}^n$ 且 $B\succeq 0$（因为 $x^\top A^\top Ax=\|Ax\|_2^2\ge 0$）。故存在正交 $Q=[v_1,\ldots,v_n]$ 与 $\lambda_1\ge\cdots\ge\lambda_r>0=\lambda_{r+1}=\cdots=\lambda_n$（正特征值个数等于 $\mathrm{rank}(A^\top A)=\mathrm{rank}(A)=r$），使

$$
A^\top A v_i=\lambda_i v_i.
$$

令 $\sigma_i:=\sqrt{\lambda_i}=\|Av_i\|_2$（$i=1,\ldots,r$），

$$
u_i:=\frac{Av_i}{\sigma_i},\qquad U_1=[u_1,\ldots,u_r],\qquad V_1=[v_1,\ldots,v_r].
$$

**$U_1$ 列正交：**

$$
u_i^\top u_j=\frac{v_i^\top A^\top A v_j}{\sigma_i\sigma_j}=\frac{\lambda_j\,v_i^\top v_j}{\sigma_i\sigma_j}=\delta_{ij},
$$

因为 $\{v_i\}$ 正交且 $\lambda_j=\sigma_j^2$。于是 $U_1^\top A V_1=\Sigma_1$。把 $\{u_1,\ldots,u_r\}$ 扩张成 $\mathbb{R}^m$ 的标准正交基 $U=[U_1\ U_2]$（$U_2$ 的列张成 $\mathcal{R}(U_1)^\perp=\mathcal{R}(A)^\perp=\mathcal{N}(A^\top)$），令 $V=Q=[V_1\ V_2]$。则

$$
U^\top AV=\begin{bmatrix}U_1^\top A V_1&U_1^\top A V_2\\U_2^\top A V_1&U_2^\top A V_2\end{bmatrix}=\begin{bmatrix}\Sigma_1&0\\0&0\end{bmatrix},
$$

因为 $AV_2=0$（$V_2$ 张成 $\mathcal{N}(A)$），$U_2^\top A=0$（$U_2$ 张成 $\mathcal{N}(A^\top)$）。两边左乘 $U$、右乘 $V^\top$ 得 $A=U\Sigma V^\top$。

（若从 $AA^\top$ 的谱分解出发，会先得到左奇异向量，再定义 $v_i=A^\top u_i/\sigma_i$，结果相同。）

### 6.4 变分刻画

$$
\begin{aligned}
v_1&\in\arg\max_{\|v\|_2=1}\|Av\|_2,
&\sigma_1&=\max_{\|v\|_2=1}\|Av\|_2=\max_{\|u\|_2=\|v\|_2=1}u^\top Av,\\
v_k&\in\arg\max_{\|v\|_2=1,\;v\perp\mathrm{span}\{v_1,\ldots,v_{k-1}\}}\|Av\|_2,
&\sigma_k&=\text{该最大值}.
\end{aligned}
$$

**证明。** 令 $v=Vc$、$\|c\|_2=1$。则 $\|Av\|_2^2=c^\top V^\top A^\top AVc=c^\top\Sigma^2 c=\sum_i\sigma_i^2 c_i^2$。若 $v\perp\mathrm{span}\{v_1,\ldots,v_{k-1}\}$，则 $c_1=\cdots=c_{k-1}=0$，故 $\|Av\|_2^2=\sum_{i\ge k}\sigma_i^2 c_i^2\le\sigma_k^2$。取 $v=v_k=Ve_k$ 等号成立。$\sigma_1=\max_{\|u\|=\|v\|=1}u^\top Av$ 已在第 5.3 节证明。

### 6.5 Courant–Fischer min-max（内容 HW）

**定理。**

$$
\sigma_k=\max_{\substack{S\subseteq\mathbb{R}^n\\\dim S=k}}\min_{\substack{v\in S\\\|v\|_2=1}}\|Av\|_2
=\min_{\substack{S\subseteq\mathbb{R}^n\\\dim S=n-k+1}}\max_{\substack{v\in S\\\|v\|_2=1}}\|Av\|_2.
$$

**证明（max-min）。** 记 $S_\star=\mathrm{span}\{v_1,\ldots,v_k\}$。对 $\|v\|_2=1$、$v\in S_\star$，$\|Av\|_2^2=\sum_{i=1}^k\sigma_i^2 c_i^2\ge\sigma_k^2$，故该 $S_\star$ 上的 $\min\ge\sigma_k$，从而 $\max_S\min\ge\sigma_k$。

反向：任意 $\dim S=k$。令 $W=\mathrm{span}\{v_k,\ldots,v_n\}$（维数 $n-k+1$）。则

$$
\dim S+\dim W=n+1>n\implies S\cap W\neq\{0\}.
$$

取 $z\in S\cap W$、$\|z\|_2=1$。则 $\|Az\|_2^2=\sum_{i\ge k}\sigma_i^2(v_i^\top z)^2\le\sigma_k^2$，故 $\min_{v\in S,\|v\|=1}\|Av\|_2\le\sigma_k$。对一切 $k$ 维 $S$ 成立，故 $\max_S\min\le\sigma_k$。

**证明（min-max）。** 令 $T_\star=\mathrm{span}\{v_k,\ldots,v_n\}$，$\dim T_\star=n-k+1$。对 $v\in T_\star$、$\|v\|_2=1$，$\|Av\|_2^2\le\sigma_k^2$，故该子空间上 $\max\le\sigma_k$，从而 $\min_S\max\le\sigma_k$。

反向：任意 $\dim S=n-k+1$。则 $S\cap\mathrm{span}\{v_1,\ldots,v_k\}\neq\{0\}$。取交里的单位 $z$，$\|Az\|_2^2\ge\sigma_k^2$，故 $\max_{v\in S}\|Av\|_2\ge\sigma_k$。于是 $\min_S\max\ge\sigma_k$。

这就是特征值的 Courant–Fischer 原理搬到 $\sqrt{A^\top A}$ 上。后面 Eckart–Young 的维数交错是同一套维数算术。

---

## 7. 最佳线性编解码器 = PCA

数据 $x_1,\ldots,x_n\in\mathbb{R}^d$，$d$ 很大。用线性编码器 $E\in\mathbb{R}^{s\times d}$ 和线性解码器 $D\in\mathbb{R}^{d\times s}$（$s\ll d$）最小化重建损失

$$
L(E,D)=\frac1n\sum_{i=1}^n\|x_i-DEx_i\|_2^2.
$$

把样本按**行**排成 $X\in\mathbb{R}^{n\times d}$（第 $i$ 行是 $x_i^\top$），则

$$
L(E,D)=\frac1n\|X-X(DE)^\top\|_F^2=\frac1n\|X-X E^\top D^\top\|_F^2.
$$

（若按列排成 $d\times n$，公式差一个转置，结论相同。）非线性版叫 autoencoder；这里只解线性。

**定理。** 设 $X=U\Sigma V^\top$ 为 SVD（$V$ 的列是 $\mathbb{R}^d$ 的右奇异向量 / 主成分方向）。则最优选择为

$$
E=V_{1:s}^\top,\qquad D=V_{1:s},
$$

其中 $V_{1:s}=[v_1,\ldots,v_s]$。此时 $DE=V_{1:s}V_{1:s}^\top$ 是到前 $s$ 个主成分的正交投影。最优值

$$
\min L=\frac1n\sum_{j=s+1}^{\mathrm{rank}(X)}\sigma_j^2.
$$

**证明（补全）。** 记 $M=DE\in\mathbb{R}^{d\times d}$，则 $\mathrm{rank}(M)\le s$，且

$$
nL(E,D)=\|X-XM^\top\|_F^2=\|X(I-M^\top)\|_F^2.
$$

**第一步：最优 $M$ 可取成正交投影。** 固定 $D$（设列满秩，否则先丢掉多余列，$s$ 只减不增）。$DEx_i$ 落在 $\mathcal{R}(D)$ 里。对每个 $x_i$，$\mathcal{R}(D)$ 中到 $x_i$ 的最近点是正交投影 $P_{\mathcal{R}(D)}x_i$。因此对固定的 $D$，取 $E=D^\dagger$（即 $DE=P_{\mathcal{R}(D)}$）不差于任何其他 $E$。于是只需在「$d$ 维空间的 $s$ 维子空间」上最小化

$$
\frac1n\sum_i\|x_i-Px_i\|_2^2=\frac1n\|X-XP\|_F^2=\frac1n\|X(I-P)\|_F^2,
$$

$P$ 跑遍秩 $\le s$ 的正交投影。

**第二步：化成 Eckart–Young。** $\|X-XP\|_F=\|X-B\|_F$，其中 $B=XP$ 满足 $\mathrm{rank}(B)\le s$。反过来，Eckart–Young（第 9 节）给出的最佳秩 $\le s$ 逼近是

$$
X_s=U_{1:s}\Sigma_{1:s}V_{1:s}^\top=X\,V_{1:s}V_{1:s}^\top,
$$

恰好是 $B=XP$ 的形式，$P=V_{1:s}V_{1:s}^\top$。因此这个 $P$ 同时是「秩 $\le s$ 矩阵逼近」和「线性编解码」的最优。对应 $E=V_{1:s}^\top$、$D=V_{1:s}$。

**第三步：最优值。** $\|X-X_s\|_F^2=\sum_{j>s}\sigma_j^2$（第 9 节）。

人话：最好的 $s$ 维线性压缩就是把数据投影到协方差（更精确：$X^\top X$）的前 $s$ 个特征向量上。残差能量是扔掉的那些奇异值的平方和。

---

## 8. Moore–Penrose 伪逆

### 8.1 四条公理

$X\in\mathbb{R}^{n\times m}$ 称为 $A\in\mathbb{R}^{m\times n}$ 的 **Moore–Penrose 逆**，若

1. $AXA=A$；
2. $XAX=X$；
3. $(AX)^\top=AX$；
4. $(XA)^\top=XA$。

记 $X=A^\dagger$。直观：(1)(3) 说 $AX$ 是到 $\mathcal{R}(A)$ 的正交投影；(2)(4) 说 $XA$ 是到 $\mathcal{R}(A^\top)$ 的正交投影。

### 8.2 用 SVD 构造：存在性

设 $A=U_1\Sigma_1 V_1^\top=\sum_{i=1}^r\sigma_i u_i v_i^\top$。令

$$
A^\dagger:=V_1\Sigma_1^{-1}U_1^\top=\sum_{i=1}^r\frac1{\sigma_i}v_i u_i^\top
$$

（完整写法 $A^\dagger=V\Sigma^+U^\top$，$\Sigma^+$ 在非零奇异值位置放倒数）。则

$$
AA^\dagger=U_1U_1^\top,\qquad A^\dagger A=V_1V_1^\top,
$$

都是对称幂等阵，故 (3)(4) 成立。进而

$$
AA^\dagger A=U_1U_1^\top U_1\Sigma_1 V_1^\top=U_1\Sigma_1 V_1^\top=A,
$$

$$
A^\dagger AA^\dagger=V_1V_1^\top V_1\Sigma_1^{-1}U_1^\top=V_1\Sigma_1^{-1}U_1^\top=A^\dagger.
$$

### 8.3 唯一性（内容证明写全）

设 $B,C$ 都满足四条公理。则

$$
\begin{aligned}
AB
&=(AB)^\top=B^\top A^\top=B^\top(ACA)^\top
=B^\top A^\top C^\top A^\top
=(AB)^\top(AC)^\top
=AB\,AC
=AC.
\end{aligned}
$$

中间用了 $A=ACA$ 故 $A^\top=(ACA)^\top$，以及 $AB$、$AC$ 对称。同理（把一切转置、左右对调）$BA=CA$。于是

$$
B=BAB=CAB=CAC=C.
$$

故 MP 逆存在且唯一。

### 8.4 左 / 右满秩的闭式；与四个投影

- 若 $r(A)=n$（列满秩，$A^\top A$ 可逆），则 $A^\dagger=(A^\top A)^{-1}A^\top$（左逆：$A^\dagger A=I_n$）。
- 若 $r(A)=m$（行满秩，$AA^\top$ 可逆），则 $A^\dagger=A^\top(AA^\top)^{-1}$（右逆：$AA^\dagger=I_m$）。
- 若 $A$ 方且可逆，则 $A^\dagger=A^{-1}$。

四个正交投影：

| 投影 | 到哪个子空间 |
|------|----------------|
| $AA^\dagger=U_1U_1^\top$ | $\mathcal{R}(A)$ |
| $A^\dagger A=V_1V_1^\top$ | $\mathcal{R}(A^\top)$ |
| $I-AA^\dagger=U_2U_2^\top$ | $\mathcal{N}(A^\top)$ |
| $I-A^\dagger A=V_2V_2^\top$ | $\mathcal{N}(A)$ |

### 8.5 最小范数最小二乘解

$x=A^\dagger b$ 是

$$
\min_x\|Ax-b\|_2
$$

的解中 $\|x\|_2$ 最小的那个。

**证明。** $Ax-b=AA^\dagger b-b=-(I-AA^\dagger)b\in\mathcal{N}(A^\top)$，故对任意 $z$，

$$
\|A(A^\dagger b+z)-b\|_2^2=\|AA^\dagger b-b\|_2^2+\|Az\|_2^2,
$$

残差最小当且仅当 $Az=0$，即 $z\in\mathcal{N}(A)$。通解 $x=A^\dagger b+z$，$z\in\mathcal{N}(A)$。但 $A^\dagger b\in\mathcal{R}(A^\top)\perp\mathcal{N}(A)$，故 $\|x\|_2^2=\|A^\dagger b\|_2^2+\|z\|_2^2$，最小当且仅当 $z=0$。

这就是 Lec1 的 $\widehat\theta_{\mathrm{ls}}=X^\dagger Y$。

---

## 9. Eckart–Young：最佳低秩逼近

设 $A=U\Sigma V^\top$ 秩为 $r$。对 $0<q\le r$ 令截断

$$
A_q=\sum_{i=1}^q\sigma_i u_i v_i^\top.
$$

**定理（Eckart–Young–Mirsky）。**

$$
\min_{\mathrm{rank}(B)\le q}\|A-B\|_2=\|A-A_q\|_2=\sigma_{q+1},
$$

$$
\min_{\mathrm{rank}(B)\le q}\|A-B\|_F=\|A-A_q\|_F=\sqrt{\sigma_{q+1}^2+\cdots+\sigma_r^2}.
$$

（谱范数那条对一切单位不变范数的 Mirsky 形式也对，本课只用谱和 Frobenius。）

### 9.1 谱范数：维数交错

先看 $A_q$：$A-A_q=\sum_{i>q}\sigma_i u_i v_i^\top$，最大奇异值 $\sigma_{q+1}$，故 $\|A-A_q\|_2=\sigma_{q+1}$。于是最小值 $\le\sigma_{q+1}$。

反向：任取 $\mathrm{rank}(B)\le q$。则 $\dim\mathcal{N}(B)\ge n-q$。令 $W=\mathrm{span}\{v_1,\ldots,v_{q+1}\}$（维数 $q+1$；若 $q\ge n$ 则 $\sigma_{q+1}=0$，下界平凡）。维数公式

$$
\dim\bigl(\mathcal{N}(B)+W\bigr)=\dim\mathcal{N}(B)+\dim W-\dim\bigl(\mathcal{N}(B)\cap W\bigr)\le n
$$

推出 $\dim(\mathcal{N}(B)\cap W)\ge\dim\mathcal{N}(B)+q+1-n\ge 1$。取单位向量

$$
z\in\mathcal{N}(B)\cap\mathrm{span}\{v_1,\ldots,v_{q+1}\}.
$$

则 $Bz=0$，故 $(A-B)z=Az$。而 $z=\sum_{i=1}^{q+1}(v_i^\top z)v_i$，因此

$$
Az=\sum_{i=1}^{q+1}\sigma_i(v_i^\top z)u_i,\qquad
\|Az\|_2^2=\sum_{i=1}^{q+1}\sigma_i^2(v_i^\top z)^2\ge\sigma_{q+1}^2\sum_{i=1}^{q+1}(v_i^\top z)^2=\sigma_{q+1}^2.
$$

谱范数定义给出

$$
\|A-B\|_2=\max_{\|x\|_2=1}\|(A-B)x\|_2\ge\|(A-B)z\|_2=\|Az\|_2\ge\sigma_{q+1}.
$$

（内容提取把 $v_i^\top z$ 偶写成 $v_j^\top z$，下标应一致。）等号被 $A_q$ 取到。

### 9.2 Frobenius：用投影 + Courant–Fischer

$\|A-A_q\|_F^2=\sum_{i>q}\sigma_i^2$ 显然。反向：$\mathrm{rank}(B)\le q$ 则 $\mathcal{R}(B)$ 维数 $\le q$。令 $P$ 为到 $\mathcal{R}(B)$ 的正交投影。$B$ 的每一列都在 $\mathcal{R}(B)$ 里，故对 $A$ 的每一列，到 $\mathcal{R}(B)$ 的最近点是 $P$ 作用在该列上，从而

$$
\|A-B\|_F^2\ge\|A-PA\|_F^2=\|(I-P)A\|_F^2=\mathrm{tr}\bigl(AA^\top(I-P)\bigr).
$$

$I-P$ 是秩 $\ge m-q$ 的正交投影。令 $W=AA^\top$（特征值 $\sigma_1^2\ge\cdots$）。对任意秩 $s$ 的正交投影 $Q$，

$$
\mathrm{tr}(WQ)=\sum_{j=1}^s q_j^\top W q_j,
$$

$\{q_j\}$ 是 $\mathcal{R}(Q)$ 的标准正交基。由 Courant–Fischer（第 6.5 节，用在 $W$ 的特征值上），$s$ 个 Rayleigh 商之和的最小值是 $W$ 最小的 $s$ 个特征值之和。取 $s=m-q$（必要时把零特征值补齐），

$$
\mathrm{tr}\bigl(W(I-P)\bigr)\ge\sigma_{q+1}^2+\cdots+\sigma_{\min(m,n)}^2.
$$

等号在 $P=U_{1:q}U_{1:q}^\top$、$B=A_q$ 时达到。

内容 用 cameraman 图片演示截断 SVD 压缩，结论：保留前 $k$ 个奇异值等于用秩 $k$ 矩阵近似原图，Frobenius 误差即扔掉的尾部能量。

---

## 10. 条件数与扰动

设 $A\in\mathbb{R}^{n\times n}$ 可逆，$Ax=b$。

**定义。** 条件数 $\mathrm{Cond}(A)=\|A\|\,\|A^{-1}\|$（对给定的相容矩阵范数）。谱条件下

$$
\mathrm{Cond}_2(A)=\|A\|_2\|A^{-1}\|_2=\frac{\sigma_1}{\sigma_n}.
$$

因为 $\|I\|=\|AA^{-1}\|\le\|A\|\|A^{-1}\|$ 且 $\|I\|=1$（诱导范数），故 $\mathrm{Cond}(A)\ge 1$。$\lvert\det A\rvert\approx 0$ 往往（不总是）伴随 $\sigma_n\approx 0$，从而 $\mathrm{Cond}\gg 1$，系统「病态」：右边或矩阵的一点点相对误差会被放大成解的大相对误差。

**例。** $A=\begin{pmatrix}1&1\\1&1+\varepsilon\end{pmatrix}$，$\sigma_{\min}\sim\lvert\varepsilon\rvert$，$\mathrm{Cond}_2\sim 1/\lvert\varepsilon\rvert$。$\varepsilon=10^{-10}$ 时，$b$ 的第 $10$ 位扰动就可以让 $x$ 面目全非。

### 10.1 右边扰动：完整推导（内容被截断处补完）

精确方程 $Ax=b$，扰动方程 $A(x+\delta x)=b+\delta b$。相减：

$$
A\,\delta x=\delta b\implies\delta x=A^{-1}\delta b.
$$

取范数：

$$
\|\delta x\|\le\|A^{-1}\|\,\|\delta b\|.
$$

把 $\|\delta b\|=\|b\|\,\frac{\|\delta b\|}{\|b\|}$ 代入，并用 $b=Ax$ 故 $\|b\|=\|Ax\|\le\|A\|\|x\|$，即 $\frac1{\|x\|}\le\frac{\|A\|}{\|b\|}$：

$$
\frac{\|\delta x\|}{\|x\|}\le\|A^{-1}\|\,\frac{\|\delta b\|}{\|x\|}=\|A^{-1}\|\,\|A\|\,\frac{\|\delta b\|}{\|A\|\|x\|}\le\mathrm{Cond}(A)\,\frac{\|\delta b\|}{\|b\|}.
$$

人话：解的相对误差 $\le$ 条件数 $\times$ 右边的相对误差。这是上界，可以被几乎取到（取 $\delta b$ 沿 $A^{-1}$ 的最大拉伸方向，$x$ 沿 $A$ 的最大拉伸方向）。

### 10.2 矩阵也扰动时（补全）

若 $(A+\delta A)(x+\delta x)=b$ 且 $\|A^{-1}\|\,\|\delta A\|<1$，则 $A+\delta A$ 仍可逆，且

$$
\frac{\|\delta x\|}{\|x\|}\le\frac{\mathrm{Cond}(A)}{1-\mathrm{Cond}(A)\frac{\|\delta A\|}{\|A\|}}\cdot\frac{\|\delta A\|}{\|A\|}.
$$

（把 $A\delta x=-\delta A(x+\delta x)$ 取范数，移项解出 $\|\delta x\|$。）相对残差 $\|A\widehat x-b\|/(\|A\|\|\widehat x\|)$ 小并不等于 $\widehat x$ 接近 $x$——中间差一个 $\mathrm{Cond}(A)$。

---

## 11. 核范数、对偶、近端算子

### 11.1 Schatten $q$-范数

令 $\sigma(A)=(\sigma_1,\ldots,\sigma_r)^\top$，$r=\min\{n,p\}$。Schatten $q$-范数 $\|A\|_q:=\|\sigma(A)\|_q$。三个最常用的：

| 名字 | 定义 | 等于 |
|------|------|------|
| 核 / 迹范数 $\|A\|_*$ | $\|\sigma\|_1=\sum_i\sigma_i$ | $\mathrm{tr}\sqrt{A^\top A}$ |
| Frobenius $\|A\|_F$ | $\|\sigma\|_2$ | $\sqrt{\sum_{ij}a_{ij}^2}$ |
| 谱范数 $\|A\|_2$ | $\|\sigma\|_\infty=\sigma_1$ | $\max_{x\neq 0}\|Ax\|_2/\|x\|_2$ |

$\mathrm{rank}(A)=\|\sigma\|_0$（同样不是范数）。它们的对偶关系与向量 $\ell_q$ 平行：谱 $\leftrightarrow$ 核，Frobenius 自对偶。即

$$
\|X\|_*=\sup_{\|Y\|_2\le 1}\langle X,Y\rangle_F,\qquad
\|X\|_2=\sup_{\|Y\|_*\le 1}\langle X,Y\rangle_F,\qquad
\|X\|_F=\sup_{\|Y\|_F\le 1}\langle X,Y\rangle_F.
$$

**对偶公式的证明。** von Neumann 迹不等式 $\langle X,Y\rangle_F\le\sum_i\sigma_i(X)\sigma_i(Y)$，故 $\langle X,Y\rangle_F\le\sigma_1(Y)\sum_i\sigma_i(X)=\|Y\|_2\|X\|_*$。取 $X=U_1\Sigma_1 V_1^\top$、$Y=U_1 V_1^\top$（$\|Y\|_2=1$）得等号 $\langle X,Y\rangle_F=\sum\sigma_i$。因而核范数是谱范数的对偶；有限维对偶的对偶给出另一向。此式立刻给出三角不等式 $\|X+Y\|_*\le\|X\|_*+\|Y\|_*$。下面按内容走分解式证明，不依赖 von Neumann。

### 11.2 Lemma 1（PSD 块与核范数）

**引理 1。** 若 $W\in\mathbb{S}^m$、$\widetilde W\in\mathbb{S}^n$、$Z\in\mathbb{R}^{m\times n}$ 满足

$$
\begin{pmatrix}W&Z\\Z^\top&\widetilde W\end{pmatrix}\succeq 0,
$$

则 $\mathrm{tr}(W)+\mathrm{tr}(\widetilde W)\ge 2\|Z\|_*$。

**证明。** 块 PSD 推出主子块 $W,\widetilde W\succeq 0$。令 $Z=U_r\Sigma_r V_r^\top$ 为薄 SVD。令

$$
Q=\begin{pmatrix}U_r\\-V_r\end{pmatrix}^\top
\begin{pmatrix}W&Z\\Z^\top&\widetilde W\end{pmatrix}
\begin{pmatrix}U_r\\-V_r\end{pmatrix}
=U_r^\top W U_r-U_r^\top Z V_r-V_r^\top Z^\top U_r+V_r^\top\widetilde W V_r.
$$

大矩阵 PSD $\Rightarrow Q\succeq 0\Rightarrow\mathrm{tr}(Q)\ge 0$。而 $U_r^\top Z V_r=\Sigma_r$，故

$$
\mathrm{tr}(Q)=\mathrm{tr}(U_r^\top W U_r)+\mathrm{tr}(V_r^\top\widetilde W V_r)-2\mathrm{tr}(\Sigma_r)\ge 0.
$$

把 $U_r$ 扩成正交阵 $[U_r\ U_\perp]$：$\mathrm{tr}(W)=\mathrm{tr}(U_r^\top W U_r)+\mathrm{tr}(U_\perp^\top W U_\perp)\ge\mathrm{tr}(U_r^\top W U_r)$（第二项因 $W\succeq 0$ 非负）。对 $\widetilde W$ 同样。因此 $\mathrm{tr}(W)+\mathrm{tr}(\widetilde W)\ge 2\|Z\|_*$。

### 11.3 Lemma 2（变分公式）

**引理 2。**

$$
\|Z\|_*=\min_{L,R:\,Z=LR^\top}\frac12\bigl(\|L\|_F^2+\|R\|_F^2\bigr).
$$

（内容写成 $\min\frac12(\|L\|_F^2+\|R\|_F^2)$，等号成立。）

**证明（$\ge$，下界）。** 若 $Z=LR^\top$，令 $W=LL^\top$、$\widetilde W=RR^\top$。则

$$
\begin{pmatrix}W&Z\\Z^\top&\widetilde W\end{pmatrix}
=\begin{pmatrix}L\\R\end{pmatrix}\begin{pmatrix}L\\R\end{pmatrix}^\top\succeq 0,
$$

Lemma 1 给出 $\|L\|_F^2+\|R\|_F^2=\mathrm{tr}(W)+\mathrm{tr}(\widetilde W)\ge 2\|Z\|_*$。

**证明（$\le$，可达）。** 取 $L=U_r\Sigma_r^{1/2}$、$R=V_r\Sigma_r^{1/2}$。则 $LR^\top=U_r\Sigma_r V_r^\top=Z$，且

$$
\|L\|_F^2=\mathrm{tr}(\Sigma_r)=\|Z\|_*=\|R\|_F^2,
$$

故 $\frac12(\|L\|_F^2+\|R\|_F^2)=\|Z\|_*$。

### 11.4 核范数是范数：三角不等式

非负、正定、齐次显然（$\sigma_i(cX)=\lvert c\rvert\sigma_i(X)$）。只需三角。由 Lemma 2，取 $X=L_x R_x^\top$、$Y=L_y R_y^\top$ 达到各自的 inf，则

$$
X+Y=L_x R_x^\top+L_y R_y^\top
=\begin{bmatrix}L_x&L_y\end{bmatrix}
\begin{bmatrix}R_x&R_y\end{bmatrix}^\top
=:L_0 R_0^\top.
$$

再由 Lemma 2（这次用 $\ge$ 方向，不必最优分解）

$$
\|X+Y\|_*\le\frac12\bigl(\|L_0\|_F^2+\|R_0\|_F^2\bigr)
=\frac12\bigl(\|L_x\|_F^2+\|L_y\|_F^2+\|R_x\|_F^2+\|R_y\|_F^2\bigr)
=\|X\|_*+\|Y\|_*.
$$

### 11.5 核范数的近端算子 = 奇异值软阈值

对 $\lambda>0$，

$$
\mathrm{prox}_{\lambda\|\cdot\|_*}(Y)
:=\arg\min_X\Bigl\{\frac12\|X-Y\|_F^2+\lambda\|X\|_*\Bigr\}
=U\,\mathcal{S}_\lambda(\Sigma)\,V^\top,
$$

其中 $Y=U\Sigma V^\top$ 为 SVD，$\mathcal{S}_\lambda$ 对每个奇异值做软阈值 $\mathcal{S}_\lambda(\sigma)=\max(\sigma-\lambda,0)$（第 18 节的标量软阈值）。

**证明。** 记 $f(X)=\frac12\|X\|_F^2+\lambda\|X\|_*$（把问题写成 $\min_X f(X)-\langle Y,X\rangle_F$）。$f$ 是单位不变凸函数，最优 $X$ 可与 $Y$ 同时被同一对正交阵对角化（否则用 von Neumann：$\langle Y,X\rangle_F\le\sum\sigma_i(Y)\sigma_i(X)$，等号当左右奇异向量对齐时取到；目标 $\frac12\sum\alpha_i^2+\lambda\sum\alpha_i-\sum\sigma_i(Y)\alpha_i$ 只依赖奇异值）。于是化为分离的标量问题

$$
\min_{\alpha_i\ge 0}\ \frac12(\alpha_i-\sigma_i)^2+\lambda\alpha_i,
$$

解为 $\alpha_i=\max(\sigma_i-\lambda,0)$。

用次微分写最优性：$0\in X-Y+\lambda\partial\|X\|_*$。若 $X=U_1\mathrm{diag}(\alpha)V_1^\top$ 且 $\alpha_i=\mathcal{S}_\lambda(\sigma_i)$，则

$$
\frac{Y-X}{\lambda}=U_1\mathrm{sign}_+(\Sigma-\lambda)V_1^\top+W,
$$

其中 $W$ 活在被阈值掉的那些方向上且 $\|W\|_2\le 1$，这正好是 $\partial\|X\|_*$ 的刻画（第 18.4 节）。

人话：核范数是秩的凸包（在谱范数单位球上），近端算子就是把小奇异值掐掉——和 Lasso 的软阈值是同一件事，只是发生在奇异值上。

---

## 12. 微积分：梯度、Hessian、Taylor

### 12.1 定义

$f:\mathbb{R}^n\to\mathbb{R}$ 在 $x$ 处可微时，梯度 $\nabla f(x)\in\mathbb{R}^n$ 满足 $\nabla f(x)_i=\partial f/\partial x_i$。方向导数

$$
g(t)=f(x+ty)\implies g'(0)=\langle\nabla f(x),y\rangle.
$$

一阶 Taylor（仿射近似）：$f(x)+\nabla f(x)^\top(y-x)$。

Hessian $\nabla^2 f(x)\in\mathbb{R}^{n\times n}$，$\bigl(\nabla^2 f(x)\bigr)_{ij}=\partial^2 f/\partial x_i\partial x_j$。若二阶连续则 Hessian 对称。二阶近似

$$
f(x)+\nabla f(x)^\top(y-x)+\frac12(y-x)^\top\nabla^2 f(x)(y-x).
$$

$f:\mathbb{R}^n\to\mathbb{R}^m$ 的 Jacobian $Df(x)\in\mathbb{R}^{m\times n}$，$Df_{ij}=\partial f_i/\partial x_j$。标量时 $\nabla f=(Df)^\top$。链式法则：$h=g\circ f$ 则 $Dh(x)=Dg(f(x))\,Df(x)$。$\nabla^2 f=D(\nabla f)$。

**积分余项（内容最后两条）。** 令 $x_t=x+t(y-x)$，$g(t)=f(x_t)$。则

$$
f(y)-f(x)=g(1)-g(0)=\int_0^1 g'(t)\,dt=\int_0^1\nabla f(x_t)^\top(y-x)\,dt,
$$

$$
\nabla f(y)-\nabla f(x)=\int_0^1\nabla^2 f(x_t)(y-x)\,dt.
$$

### 12.2 例子（字典，求导时对照）

| $f$ | $\nabla f$ 或 $Df$ | Hessian |
|-------|------------------------|---------|
| $b^\top x$ | $b$ | $0$ |
| $Ax$（$A\in\mathbb{R}^{m\times n}$） | $Df=A$ | — |
| $\|x\|_2^2$ | $2x$ | $2I$ |
| $x^\top Ax$ | $(A+A^\top)x$；$A$ 对称时 $2Ax$ | $A+A^\top$；对称时 $2A$ |
| $\|Ax-b\|_2^2$ | $2A^\top(Ax-b)$ | $2A^\top A$ |
| $\frac12\|Ax-b\|_2^2$ | $A^\top(Ax-b)$ | $A^\top A$ |
| $\mathrm{tr}(AX^\top B)$ | $\nabla_X=BA$ | — |
| $\frac12\|XY-A\|_F^2$ | $\partial_Y=X^\top(XY-A)$，$\partial_X=(XY-A)Y^\top$ | — |

**链式法则特例。** $h=g\circ f$，$g:\mathbb{R}^m\to\mathbb{R}$：$\nabla h(x)=[Df(x)]^\top\nabla g(f(x))$。若再 $g:\mathbb{R}\to\mathbb{R}$、$h=g\circ f$：

$$
\nabla h=g'(f)\nabla f,\qquad
\nabla^2 h=g'(f)\nabla^2 f+g''(f)\nabla f\,\nabla f^\top.
$$

$f(x)=Ax+b$ 时 $\nabla h=A^\top\nabla g(Ax+b)$，$\nabla^2 h=A^\top\nabla^2 g(Ax+b)\,A$。

### 12.3 $\log\det$（内容 Check：$\nabla f(X)=X^{-1}$）

内容写 $f(X)=\log\det X$，$X\in\mathbb{S}^n_{++}$，check $\nabla f(X)=X^{-1}$。（后面凸性用的是 $-\log\det$，梯度差一个符号。）在 Frobenius 内积下，梯度由方向导数定义：$\mathrm{D}f(X)[H]=\langle\nabla f(X),H\rangle_F$。

**证明。** 对 $H\in\mathbb{S}^n$、$\lvert t\rvert$ 充分小使 $X+tH\succ 0$，

$$
\log\det(X+tH)
=\log\det\bigl(X(I+tX^{-1}H)\bigr)
=\log\det X+\log\det(I+tB),\qquad B:=X^{-1}H.
$$

令 $\mu_1,\ldots,\mu_n$ 为 $B$ 的特征值。则 $\det(I+tB)=\prod_i(1+t\mu_i)$，故

$$
\log\det(I+tB)=\sum_i\log(1+t\mu_i).
$$

在 $t=0$ 处求导：$\sum_i\mu_i=\mathrm{tr}(B)$。因此

$$
\frac{d}{dt}\Big|_{t=0}\log\det(X+tH)=\mathrm{tr}(X^{-1}H)=\langle X^{-1},H\rangle_F.
$$

（等价：Jacobi 公式 $\frac{d}{dt}\det M(t)=\det M(t)\cdot\mathrm{tr}\bigl(M(t)^{-1}M'(t)\bigr)$，再除以 $\det M$。）故 $\nabla f(X)=X^{-1}$。

**Hessian（后面 $-\log\det$ 凸会用）。** 再对 $t$ 求导一次：$g(t)=\log\det(X+tH)$，$g'(t)=\mathrm{tr}\bigl((X+tH)^{-1}H\bigr)$，

$$
g''(0)=-\mathrm{tr}(X^{-1}HX^{-1}H)=-\|X^{-1/2}HX^{-1/2}\|_F^2\le 0.
$$

故 $\nabla^2(\log\det)\preceq 0$（凹），$\nabla^2(-\log\det)\succeq 0$（凸）。

### 12.4 log-sum-exp

$$
f(x)=\log\sum_{k=1}^n e^{x_k}.
$$

令 $z_k=e^{x_k}$、$s=1^\top z$。则 $\nabla f=z/s$，

$$
\nabla^2 f=\frac1s\mathrm{diag}(z)-\frac1{s^2}zz^\top.
$$

对任意 $v$，Cauchy–Schwarz $\bigl(\sum z_i v_i^2\bigr)\bigl(\sum z_i\bigr)\ge\bigl(\sum z_i v_i\bigr)^2$ 给出 $v^\top\nabla^2 f\,v\ge 0$，故 $\nabla^2 f\succeq 0$，$f$ 凸。这是 softmax 的 log 配分函数，Lec2 分类会用。

---

## 13. 凸集

### 13.1 定义与运算

$C\subseteq\mathbb{R}^d$ **凸**：$x_1,x_2\in C$ $\Rightarrow$ $\lambda x_1+(1-\lambda)x_2\in C$ 对一切 $\lambda\in[0,1]$。人话：两点的线段仍在集合里。

**保持凸的运算：** 正数倍 $tC$（$t\ge 0$）、Minkowski 和 $C+D=\{c+d\}$、任意交 $\bigcap C_i$。凸集的闭包、内部仍凸。

**凸组合 / 凸包。** $x=\sum_{i=1}^k\theta_i x_i$，$\theta_i\ge 0$、$\sum\theta_i=1$。$\mathrm{conv}(C)$ 是一切凸组合，也等于包含 $C$ 的所有凸集之交（最小凸超集）。

**锥 / 凸锥。** 锥：$c\in C$、$t>0\Rightarrow tc\in C$。既是锥又凸则是凸锥。$\mathrm{cone}(C)=\{tc:c\in C,\,t\ge 0\}$。

**法锥。** $C$ 非空闭凸，$x\in C$：

$$
N_C(x)=\bigl\{z:\langle z,y-x\rangle\le 0\ \forall y\in C\bigr\}.
$$

人话：从 $x$ 出发，所有「不指向 $C$ 内部」的方向（支撑超平面的外法向）。

**法锥的加法（约束资格）。** $C=\bigcap_{i=1}^m C_i$，各 $C_i$ 闭凸，且 $\bigcap\mathrm{int}(C_i)\neq\emptyset$，则 $N_C(x)=\sum_i N_{C_i}(x)$。

**不等式与等式的法锥。** $c$ 真闭凸，$\partial c(x_0)\neq\emptyset$，$c(x_0)=0$，$C=\{x:c(x)\le 0\}$。若存在 $x$ 使 $c(x)<0$（Slater 型），则 $N_C(x_0)=\mathrm{cone}(\partial c(x_0))$。等式 $C=\{x:Ax=b\}$ 时 $N_C(x)=\mathcal{R}(A^\top)$（整块行空间；与 $x$ 无关）。

### 13.2 例子

- 超平面 $\{x:a^\top x=b\}$；半空间 $\{x:a^\top x\le b\}$。
- 球 $B(x,r)=\{y:\|x-y\|\le r\}$（任意范数）。
- 椭球 $\{y:(x-y)^\top A(x-y)\le r\}$，$A\succ 0$。
- 多面体 $\{x:Ax\le b,\ Cx=d\}$。
- $k$-单形：$k+1$ 个仿射无关点的凸包。（内容写 $v_1-v_0,\ldots,v_0-v_k$ 线性无关，即仿射无关。）
- 仿射像与原像：$f(x)=Ax+b$，$C$ 凸 $\Rightarrow$ $f(C)$、$f^{-1}(C)$ 凸。
- 半正定锥 $\mathbb{S}^n_+$ 是闭凸锥。

### 13.3 分离与支撑

**分离超平面。** $C,D$ 凸且不交，则存在 $a\neq 0$、$b$ 使 $a^\top x\le b\ \forall x\in C$，$a^\top x\ge b\ \forall x\in D$。若 $C$ 闭、$D$ 紧，可严格分离：$a^\top x<b$ 在 $C$ 上，$a^\top x>b$ 在 $D$ 上。

**支撑超平面。** $C$ 凸，$x_0$ 在边界上，则存在 $a\neq 0$ 使 $a^\top x\le a^\top x_0$ 对一切 $x\in C$。

有限维证明要点：把 $D-C$ 与 $\{0\}$ 分离；严格分离用到两点间的最近点（第 3.3 节）——闭凸集外一点到该集有唯一最近点，连接它们的向量就是法向。

---

## 14. 凸函数：定义、上图、Jensen

扩充实直线 $\overline{\mathbb{R}}=\mathbb{R}\cup\{\pm\infty\}$。$f:\mathbb{R}^n\to\overline{\mathbb{R}}$ 的有效域 $\mathrm{dom}(f)=\{x:f(x)<+\infty\}$。**真（proper）**：$\mathrm{dom}(f)\neq\emptyset$ 且从不取 $-\infty$。

- $\alpha$-下水平集 $C_\alpha=\{x:f(x)\le\alpha\}$。
- **上图** $\mathrm{epi}(f)=\{(x,t):f(x)\le t\}\subseteq\mathbb{R}^{n+1}$。
- **闭**函数：$\mathrm{epi}(f)$ 闭。
- **下半连续（lsc）** 于 $x$：$\liminf_{y\to x}f(y)\ge f(x)$。

**HW：lsc $\iff$ 所有 $C_\alpha$ 闭 $\iff$ $f$ 闭。**

**证明。**

*epi 闭 $\Rightarrow$ $C_\alpha$ 闭。* $x_k\in C_\alpha$、$x_k\to x$，则 $(x_k,\alpha)\in\mathrm{epi}(f)\to(x,\alpha)$，闭性给出 $f(x)\le\alpha$。

*$C_\alpha$ 皆闭 $\Rightarrow$ lsc。* 若某点不 lsc，则存在 $y_k\to x$ 使 $\lim f(y_k)=L<f(x)$（允许 $L=-\infty$）。取 $\alpha\in(L,f(x))$，最终 $y_k\in C_\alpha$，闭性推出 $x\in C_\alpha$，即 $f(x)\le\alpha$，矛盾。

*lsc $\Rightarrow$ epi 闭。* $(x_k,t_k)\to(x,t)$ 且 $f(x_k)\le t_k$，则 $f(x)\le\liminf f(x_k)\le t$。

**凸函数。** $\mathrm{dom}(f)$ 凸，且 Jensen：对一切 $x,y\in\mathrm{dom}(f)$、$\theta\in[0,1]$，

$$
f\bigl(\theta x+(1-\theta)y\bigr)\le\theta f(x)+(1-\theta)f(y).
$$

- **严格凸：** $x\neq y$、$\theta\in(0,1)$ 时上式改 $<$。
- **$m$-强凸（$m>0$）：** $x\mapsto f(x)-\frac m2\|x\|_2^2$ 凸。

**定理。** $f$ 凸 $\iff$ $\mathrm{epi}(f)$ 凸。

**证明。** $\Rightarrow$：取 $\mathrm{epi}$ 中两点 $(x,s)$、$(y,t)$，Jensen 给出 $f(\theta x+(1-\theta)y)\le\theta s+(1-\theta)t$，故凸组合仍在 epi 中。$\Leftarrow$：$(x,f(x))$、$(y,f(y))\in\mathrm{epi}$，凸组合的第二坐标是 $\theta f(x)+(1-\theta)f(y)$，epi 凸推出它 $\ge f(\theta x+(1-\theta)y)$。

示性函数 $I_C(x)=0$（$x\in C$）否则 $+\infty$：$I_C$ 凸 $\iff$ $C$ 凸（因为 $\mathrm{epi}(I_C)=C\times[0,+\infty)$）。

---

## 15. 零阶 / 一阶 / 二阶 / 单调性

以下均默认 $f$ 真。

### 15.1 零阶：限制在直线上（内容证明提纲写全）

**定理。** $f:\mathbb{R}^n\to\overline{\mathbb{R}}$ 凸 $\iff$ 对一切 $x\in\mathrm{dom}(f)$、$v\in\mathbb{R}^n$，一元函数 $g(t)=f(x+tv)$（$\mathrm{dom}(g)=\{t:x+tv\in\mathrm{dom}(f)\}$）凸。

**证明 $\Rightarrow$。** $\mathrm{dom}(g)$ 是 $\mathrm{dom}(f)$ 与一条直线之交，凸。对 $t_1,t_2\in\mathrm{dom}(g)$、$\theta\in[0,1]$，

$$
g(\theta t_1+(1-\theta)t_2)=f\bigl(\theta(x+t_1 v)+(1-\theta)(x+t_2 v)\bigr)
\le\theta g(t_1)+(1-\theta)g(t_2).
$$

**证明 $\Leftarrow$。** 先看 $\mathrm{dom}(f)$：取 $x,y\in\mathrm{dom}(f)$，令 $v=y-x$，则 $0,1\in\mathrm{dom}(g)$，$g$ 凸推出 $[0,1]\subset\mathrm{dom}(g)$，即线段在 $\mathrm{dom}(f)$ 里。再

$$
f(\theta x+(1-\theta)y)=g(\theta\cdot 1+(1-\theta)\cdot 0)\le\theta g(1)+(1-\theta)g(0)=\theta f(y)+(1-\theta)f(x).
$$

**应用：$f(X)=-\log\det X$ 在 $\mathbb{S}^n_{++}$ 上凸（内容 HW）。** 把环境空间当成 $\mathbb{S}^n$。对 $X\succ 0$、$V\in\mathbb{S}^n$，

$$
g(t)=-\log\det(X+tV)=-\log\det X-\sum_i\log(1+t\lambda_i),
$$

$\lambda_i$ 是 $X^{-1/2}VX^{-1/2}$ 的特征值（在 $X+tV\succ 0$ 的开区间上）。则

$$
g''(t)=\sum_i\frac{\lambda_i^2}{(1+t\lambda_i)^2}\ge 0,
$$

故 $g$ 凸，由零阶条件 $f$ 凸。

### 15.2 一阶：切线在图像下方

**定理。** $f$ 在凸域上可微。则 $f$ 凸 $\iff$ 对一切 $x,y\in\mathrm{dom}(f)$，

$$
f(y)\ge f(x)+\nabla f(x)^\top(y-x).
$$

**证明 $\Rightarrow$。** 由凸性，对 $\theta\in(0,1]$，

$$
f(x+\theta(y-x))\le(1-\theta)f(x)+\theta f(y)
\implies
\frac{f(x+\theta(y-x))-f(x)}{\theta}\le f(y)-f(x).
$$

令 $\theta\downarrow 0$，左边 $\to\langle\nabla f(x),y-x\rangle$。

**证明 $\Leftarrow$。** 对 $\theta\in[0,1]$ 令 $z=\theta x+(1-\theta)y$。一阶条件在点 $z$ 处分别对 $x$ 和 $y$：

$$
f(x)\ge f(z)+\nabla f(z)^\top(x-z),\qquad
f(y)\ge f(z)+\nabla f(z)^\top(y-z).
$$

$\theta$ 倍加 $(1-\theta)$ 倍：右边交叉项 $\theta(x-z)+(1-\theta)(y-z)=0$，故 $\theta f(x)+(1-\theta)f(y)\ge f(z)$。

人话：凸函数始终在自己的切平面上方。这是后面次梯度定义的可微版。

### 15.3 二阶：Hessian PSD

**定理。** $f$ 在凸域上二阶可微。则 $f$ 凸 $\iff$ $\nabla^2 f(x)\succeq 0$ 对一切 $x\in\mathrm{dom}(f)$。进一步，$\nabla^2 f(x)\succ 0$ 处处成立 $\Rightarrow$ $f$ 严格凸（反过来不对）。

**证明 $\Rightarrow$。** 一阶条件写在 $x$ 和 $x+tv$（$t\neq 0$）：

$$
f(x+tv)\ge f(x)+t\nabla f(x)^\top v,\qquad
f(x)\ge f(x+tv)-t\nabla f(x+tv)^\top v.
$$

两式相加：$0\ge t\bigl(\nabla f(x)-\nabla f(x+tv)\bigr)^\top v$。除以 $t^2$（$t>0$ 时）：

$$
\frac{\bigl(\nabla f(x+tv)-\nabla f(x)\bigr)^\top v}{t}\ge 0.
$$

令 $t\to 0$：左边 $\to v^\top\nabla^2 f(x)v$。$t<0$ 同样（不等式方向在除以 $t^2>0$ 时不变）。

**证明 $\Leftarrow$。** Taylor 带积分余项：

$$
f(y)=f(x)+\nabla f(x)^\top(y-x)+\int_0^1(1-t)(y-x)^\top\nabla^2 f(x_t)(y-x)\,dt.
$$

被积函数 $\ge 0$，故一阶不等式成立，从而凸。

**内容 check：$\nabla^2 f(x)\succ 0$ 处处 $\Rightarrow$ 严格凸。** 若 Hessian 处处正定且 $y\neq x$，余项积分里 $(y-x)^\top\nabla^2 f(x_t)(y-x)>0$ 对每个 $t$ 成立，故一阶不等式**严格**，Jensen 也严格。反过来不对：$f(x)=x^4$ 严格凸（$g(t)=t^4$ 的二阶差商为正），但 $f''(0)=0$。

### 15.4 梯度单调

映射 $h:\mathbb{R}^n\to\mathbb{R}^n$ **单调**：$\langle h(x)-h(y),x-y\rangle\ge 0$。

**定理。** 可微 $f$（凸域）凸 $\iff$ $\nabla f$ 单调。

**证明 $\Rightarrow$。** 一阶条件 $f(y)\ge f(x)+\langle\nabla f(x),y-x\rangle$ 与对调 $f(x)\ge f(y)+\langle\nabla f(y),x-y\rangle$ 相加即得。

**证明 $\Leftarrow$。** 令 $g(\theta)=f(x+\theta(y-x))$，$g'(\theta)=\langle\nabla f(x+\theta(y-x)),y-x\rangle$。单调性给出 $g'(\theta)\ge g'(0)$（比较点 $x+\theta(y-x)$ 与 $x$）。于是

$$
g(1)=g(0)+\int_0^1 g'(t)\,dt\ge g(0)+g'(0),
$$

即 $f(y)\ge f(x)+\langle\nabla f(x),y-x\rangle$。

---

## 16. 严格凸、强凸的全部等价条件

### 16.1 严格凸：平行于凸的条件（内容 HW）

内容：Derive the similar conditions of strictly convex function。把第 15 节四条全部改成严格版。以下 $x\neq y$、$\theta\in(0,1)$，$\mathrm{dom}$ 凸。

**（零阶）** $f$ 严格凸 $\iff$ 对一切 $x\in\mathrm{dom}(f)$、$v\neq 0$，$g(t)=f(x+tv)$ 在其有效域的每个开区间上严格凸。证明与 15.1 相同，Jensen 里的 $\le$ 换成 $<$（$t_1\neq t_2$）。

**（一阶，可微）** $f$ 严格凸 $\iff$

$$
f(y)>f(x)+\nabla f(x)^\top(y-x)\qquad\forall y\neq x.
$$

**证明 $\Rightarrow$。** 与 15.2 相同：差商 $\le f(y)-f(x)$，但现在 $\theta\in(0,1)$ 时 Jensen 是严格的，

$$
\frac{f(x+\theta(y-x))-f(x)}{\theta}<f(y)-f(x).
$$

令 $\theta\downarrow 0$：左边 $\to\langle\nabla f(x),y-x\rangle$，极限保留 $\le$。若等号成立，则 $f$ 在线段上是仿射（一阶切线贴住两端），与严格 Jensen 矛盾。更干净：假设等号，则对一切 $\theta\in(0,1)$，

$$
f(x+\theta(y-x))\le(1-\theta)f(x)+\theta f(y)=f(x)+\theta\langle\nabla f(x),y-x\rangle,
$$

但一阶不等式（由凸，严格凸 $\Rightarrow$ 凸）给出反向 $\ge$，故线段上 $f$ 仿射，与严格凸矛盾。因此必须 $>$。

**证明 $\Leftarrow$。** 与 15.2 相同：在中点 $z=\theta x+(1-\theta)y$ 写两条严格一阶（$x\neq z\neq y$），$\theta$ 倍加 $(1-\theta)$ 倍，交叉项仍消掉，得严格 Jensen。

**（二阶）** $\nabla^2 f(x)\succ 0$ 处处 $\Rightarrow$ 严格凸（15.3 的 check）。反过来不必（$x^4$）。充分且接近必要的条件：$\nabla^2 f\succeq 0$，且对任意 $x\neq y$，映射 $t\mapsto(y-x)^\top\nabla^2 f(x+t(y-x))(y-x)$ 不几乎处处为零。

**（梯度严格单调，可微）** $f$ 严格凸 $\iff$ $x\neq y\Rightarrow\langle\nabla f(x)-\nabla f(y),x-y\rangle>0$。

**证明 $\Rightarrow$。** 两条严格一阶相加。
**证明 $\Leftarrow$。** 15.4 的积分里 $g'(t)-g'(0)=\langle\nabla f(x+t(y-x))-\nabla f(x),y-x\rangle>0$ 对 $t\in(0,1]$，故 $g(1)>g(0)+g'(0)$。

### 16.2 $m$-强凸：五条等价（用 $h=f-\frac m2\|\cdot\|_2^2$）

$m>0$。下列在相应正则性下等价（$f$ 真，$\mathrm{dom}$ 凸）。内容定义就是最后一条。

**（定义）** $h(x):=f(x)-\frac m2\|x\|_2^2$ 凸。

**（Jensen 加强）**

$$
f\bigl(\theta x+(1-\theta)y\bigr)
\le\theta f(x)+(1-\theta)f(y)-\frac m2\theta(1-\theta)\|x-y\|_2^2.
$$

**（一阶，可微）**

$$
f(y)\ge f(x)+\nabla f(x)^\top(y-x)+\frac m2\|y-x\|_2^2.
$$

**（二阶，二阶可微）** $\nabla^2 f(x)\succeq mI$。

**（梯度强制 / 强单调，可微）**

$$
\langle\nabla f(x)-\nabla f(y),x-y\rangle\ge m\|x-y\|_2^2.
$$

**证明（全部回到定义）。** 先记下平行四边形展开，对一切 $x,y,\theta\in[0,1]$：

$$
\|\theta x+(1-\theta)y\|_2^2
=\theta\|x\|_2^2+(1-\theta)\|y\|_2^2-\theta(1-\theta)\|x-y\|_2^2.
$$

（展开 $\|\theta x+(1-\theta)y\|_2^2=\theta^2\|x\|_2^2+(1-\theta)^2\|y\|_2^2+2\theta(1-\theta)x^\top y$，再与 $\theta\|x\|_2^2+(1-\theta)\|y\|_2^2-\theta(1-\theta)(\|x\|_2^2+\|y\|_2^2-2x^\top y)$ 对照。）

*定义 $\Rightarrow$ Jensen 加强。* $h$ 凸：

$$
h(\theta x+(1-\theta)y)\le\theta h(x)+(1-\theta)h(y).
$$

代入 $h=f-\frac m2\|\cdot\|_2^2$，把二次项移到右边，用上面的展开，恰好多出 $\frac m2\theta(1-\theta)\|x-y\|_2^2$。

*Jensen 加强 $\Rightarrow$ 定义。* 反过来把 $\frac m2\|\cdot\|_2^2$ 加回去，用同一展开，得到 $h$ 的 Jensen。

*定义 $\iff$ 一阶。* $h$ 可微时 $\nabla h=\nabla f-m\,\mathrm{Id}$，切线在图像下：

$$
h(y)\ge h(x)+\langle\nabla h(x),y-x\rangle.
$$

展开：

$$
f(y)-\frac m2\|y\|_2^2
\ge f(x)-\frac m2\|x\|_2^2+\langle\nabla f(x),y-x\rangle-m\langle x,y-x\rangle.
$$

右边二次项：$-\frac m2\|x\|_2^2-m\langle x,y-x\rangle=-\frac m2\|y\|_2^2+\frac m2\|y-x\|_2^2$（配方）。两边加 $\frac m2\|y\|_2^2$ 即得一阶加强。反向同样。

*定义 $\iff$ Hessian。* $\nabla^2 h=\nabla^2 f-mI\succeq 0\iff\nabla^2 f\succeq mI$。

*定义 $\iff$ 强单调。* $h$ 凸 $\iff\nabla h$ 单调：$\langle\nabla h(x)-\nabla h(y),x-y\rangle\ge 0$，即 $\langle\nabla f(x)-\nabla f(y),x-y\rangle\ge m\|x-y\|_2^2$。

### 16.3 强凸的二次夹挤（$\mathrm{dom}=\mathbb{R}^n$）

可微 $m$-强凸函数有**唯一**最小点 $x^*$（严格凸已保证唯一；强凸再加强制性保证存在：沿任意射线 $g(t)=f(x+tv)\to+\infty$）。在一阶不等式里令 $x=x^*$、$\nabla f(x^*)=0$：

$$
\frac m2\|x-x^*\|_2^2\le f(x)-f(x^*).
$$

另一侧：把一阶不等式对 $y$ 取 inf，

$$
\inf_y\Bigl[f(x)+\langle\nabla f(x),y-x\rangle+\frac m2\|y-x\|_2^2\Bigr]
=f(x)-\frac1{2m}\|\nabla f(x)\|_2^2
$$

（配方，最小在 $y=x-\frac1m\nabla f(x)$）。左边 $\le f(x^*)$，故

$$
f(x)-f(x^*)\le\frac1{2m}\|\nabla f(x)\|_2^2.
$$

合起来即内容

$$
\frac m2\|x-x^*\|_2^2\le f(x)-f(x^*)\le\frac1{2m}\|\nabla f(x)\|_2^2.
$$

### 16.4 保持凸的运算

- **非负组合：** $f_i$ 凸、$\alpha_i\ge 0\Rightarrow\sum\alpha_i f_i$ 凸。例：对数障碍 $f(x)=-\sum_i\log(b_i-a_i^\top x)$，$\mathrm{dom}=\{x:a_i^\top x<b_i\}$（每项是凸增函数 $\,-\log$ 复合仿射）。
- **仿射复合：** $f$ 凸 $\Rightarrow$ $f(Ax+b)$ 凸。例 $\|Ax+b\|$。
- **点式最大 / 上确界：** $g(x)=\max_{i\in I}f_i(x)$；更一般 $g(x)=\sup_{y\in Y}f(x,y)$，每个 $f(\cdot,y)$ 凸 $\Rightarrow g$ 凸。例：前 $r$ 大坐标之和 $x\mapsto\sum_{i=1}^r x_{[i]}$ 是若干线性函数的最大；支撑函数 $S_C(x)=\sup_{y\in C}y^\top x$；谱范数 $\sigma_1(X)=\sup_{\|u\|_2=\|v\|_2=1}u^\top Xv$。
- **部分下确界：** $f(x,y)$ 联合凸、$C$ 凸 $\Rightarrow$ $g(x)=\inf_{y\in C}f(x,y)$ 凸（epi 是原 epi 的投影，凸集的投影凸）。注意 inf 可能取到 $-\infty$，需要真性另说。

**内容问：一般复合 $h(g_1,\ldots,g_k)$ 何时凸？** 不是任意凸 $h$ 配凸 $g_i$ 都行。反例：$h(t)=t^2$ 凸，$g(x)=x^2-1$ 凸，但 $h(g(x))=(x^2-1)^2=x^4-2x^2+1$ 在 $0$ 附近凹（$f''(0)=-4<0$）。

**充分条件：** $h$ 凸且**在每个坐标上非降**，每个 $g_i$ 凸，则 $h\circ g$ 凸。或者 $h$ 凸、每个 $g_i$ 仿射。可微时 Hessian 交叉项的符号需要 $h$ 的单调性来控制。

---

## 17. 应用：最小点、最小二乘、光滑

### 17.1 $\nabla f(x^*)=0\iff$ 全局最小（凸）

**定理。** $f$ 凸可微。则 $x^*\in\arg\min f$ $\iff$ $\nabla f(x^*)=0$。若再严格凸，最小点至多一个，故 $\iff x^*=\arg\min f$（作为唯一元）。

**证明。** $\Rightarrow$：无约束可微，局部最小已有 $\nabla f=0$（否则沿 $-\nabla f$ 下降）。$\Leftarrow$：一阶不等式变成 $f(y)\ge f(x^*)$。严格凸时若还有 $y\neq x^*$ 也最小，Jensen 会把中点降得更低，矛盾。

**最小二乘。** $f(x)=\|Ax-b\|_2^2$ 凸（Hessian $2A^\top A\succeq 0$）。临界点即法方程 $A^\top Ax=A^\top b$，解集是仿射空间 $x=A^\dagger b+\mathcal{N}(A)$；$A$ 列满秩时严格凸、解唯一。

### 17.2 Lipschitz 梯度

$\nabla f\in\mathrm{Lip}(L)$ 指 $\|\nabla f(x)-\nabla f(y)\|_2\le L\|x-y\|_2$。

**推论。**

1. $\langle\nabla f(x)-\nabla f(y),x-y\rangle\le L\|x-y\|_2^2$，即 $x\mapsto Lx-\nabla f(x)$ 单调，等价于 $g(x)=\frac L2\|x\|_2^2-f(x)$ 凸。
2. 若 Hessian 存在，则 $\nabla^2 f(x)\preceq LI$。
3. **下降引理（descent lemma）：**

$$
f(y)\le f(x)+\nabla f(x)^\top(y-x)+\frac L2\|y-x\|_2^2.
$$

   这是对 $g$ 写一阶条件再移项。若 $\mathrm{dom}=\mathbb{R}^n$ 且 $x^*\in\arg\min f$，则

$$
\frac1{2L}\|\nabla f(x)\|_2^2\le f(x)-f(x^*)\le\frac L2\|x-x^*\|_2^2.
$$

   （上界：下降引理在 $x^*$ 处，$\nabla f(x^*)=0$；下界：用 $g$ 的凸性或对 $y=x-\frac1L\nabla f(x)$ 代入下降引理。）

### 17.3 余强制（co-coercivity，内容蓝字）

若 $f$ 凸且 $\nabla f\in\mathrm{Lip}(L)$，则

$$
\langle\nabla f(x)-\nabla f(y),x-y\rangle\ge\frac1L\|\nabla f(x)-\nabla f(y)\|_2^2.
$$

**证明。** 令 $f_1(z)=f(z)-\nabla f(x)^\top z$，则 $\nabla f_1(x)=0$，凸性推出 $x\in\arg\min f_1$。同样 $f_2(z)=f(z)-\nabla f(y)^\top z$ 在 $y$ 最小。两者的梯度仍 Lip $L$，用 17.2 的下界（「蓝字」）：

$$
\frac1{2L}\|\nabla f_1(y)\|_2^2\le f_1(y)-f_1(x),\qquad
\frac1{2L}\|\nabla f_2(x)\|_2^2\le f_2(x)-f_2(y).
$$

$\nabla f_1(y)=\nabla f(y)-\nabla f(x)$。两式相加，左边是 $\frac1L\|\nabla f(x)-\nabla f(y)\|_2^2$，右边

$$
f(y)-f(x)-\langle\nabla f(x),y-x\rangle+f(x)-f(y)-\langle\nabla f(y),x-y\rangle
=\langle\nabla f(x)-\nabla f(y),x-y\rangle.
$$

**强凸 + 光滑（内容绿字：对 $h=f-\frac m2\|\cdot\|_2^2$ 写余强制）。** 设 $f$ 可微、$m$-强凸、$\nabla f\in\mathrm{Lip}(L)$，$L>m>0$。令

$$
h(x)=f(x)-\frac m2\|x\|_2^2.
$$

则 $h$ 凸（强凸定义），且 $\nabla h(x)=\nabla f(x)-mx$ 满足 $\nabla h\in\mathrm{Lip}(L-m)$。注意三角不等式只会给出 $\|\nabla h(x)-\nabla h(y)\|_2\le(L+m)\|x-y\|_2$，太松，不能直接减。正确理由：$\frac L2\|\cdot\|_2^2-f$ 凸（17.2）且 $f-\frac m2\|\cdot\|_2^2$ 凸，两式相加得 $\frac{L-m}2\|\cdot\|_2^2-h$ 凸，即 $\nabla h\in\mathrm{Lip}(L-m)$。等价地，Hessian 夹在 $mI$ 与 $LI$ 之间时，$\nabla^2 h$ 夹在 $0$ 与 $(L-m)I$ 之间。

对凸且 $\nabla h\in\mathrm{Lip}(L-m)$ 的 $h$ 用上面已证的余强制：

$$
\langle\nabla h(x)-\nabla h(y),x-y\rangle
\ge\frac1{L-m}\|\nabla h(x)-\nabla h(y)\|_2^2.
$$

记 $\delta=x-y$、$g=\nabla f(x)-\nabla f(y)$，则 $\nabla h(x)-\nabla h(y)=g-m\delta$。代入：

$$
\langle g-m\delta,\delta\rangle\ge\frac1{L-m}\|g-m\delta\|_2^2,
$$

$$
\langle g,\delta\rangle-m\|\delta\|_2^2
\ge\frac1{L-m}\bigl(\|g\|_2^2-2m\langle g,\delta\rangle+m^2\|\delta\|_2^2\bigr).
$$

两边乘 $L-m>0$：

$$
(L-m)\langle g,\delta\rangle-m(L-m)\|\delta\|_2^2
\ge\|g\|_2^2-2m\langle g,\delta\rangle+m^2\|\delta\|_2^2.
$$

把含 $\langle g,\delta\rangle$ 的项移到左边：

$$
(L-m+2m)\langle g,\delta\rangle
\ge\|g\|_2^2+\bigl(mL-m^2+m^2\bigr)\|\delta\|_2^2,
$$

$$
(L+m)\langle g,\delta\rangle
\ge\|g\|_2^2+mL\|\delta\|_2^2.
$$

除以 $L+m$：

$$
\langle\nabla f(x)-\nabla f(y),x-y\rangle
\ge\frac{mL}{m+L}\|x-y\|_2^2+\frac1{m+L}\|\nabla f(x)-\nabla f(y)\|_2^2.
$$

这是 Nesterov 估计里的标准插值不等式。内容绿字的用法就是这一段代数，没有别的输入。

---

## 18. 次梯度与次微分

### 18.1 定义

$z$ 是 $f$ 在 $x$ 的**次梯度**，若

$$
f(y)\ge f(x)+\langle z,y-x\rangle\qquad\forall y.
$$

全体次梯度构成**次微分** $\partial f(x)$（可能空）。几何：$z$ 是上图在 $(x,f(x))$ 处某张支撑超平面的「斜率」。

可微凸函数处处 $\partial f(x)=\{\nabla f(x)\}$；反之若 $\partial f(x)=\{g\}$ 单点，则 $f$ 在 $x$ 可微且 $\nabla f=g$。

**Fermat 法则。** $x^*\in\arg\min_{x\in\mathbb{R}^n}f(x)$ $\iff$ $0\in\partial f(x^*)$。证明就是把定义里的 $z=0$ 写成 $f(y)\ge f(x^*)$。

示性函数：$x\in C$ 时 $\partial I_C(x)=N_C(x)$，否则 $\partial I_C(x)=\emptyset$。

非凸例子（内容重点）：$f(x)=x^3$。则 $\partial f(0)=\emptyset$。

**证明。** 若 $z\in\partial f(0)$，则对一切 $y\in\mathbb{R}$，$y^3\ge z y$。

- $y>0$：两边除以 $y$ 得 $y^2\ge z$。令 $y\downarrow 0$，得 $z\le 0$。
- $y<0$：两边除以 $y$（变号）得 $y^2\le z$。令 $y\uparrow 0$，得 $z\ge 0$。

于是 $z=0$。但 $y^3\ge 0$ 对一切 $y$ 不成立（取 $y=-1$）。矛盾。几何：过原点的直线无法把立方曲线整个托在上方。凸函数在连续点次微分非空（18.6），所以这个例子必须非凸。

### 18.2 内容问号：$\partial\lvert x\rvert=?$

对 $f(x)=\lvert x\rvert$（$x\in\mathbb{R}$）：

$$
\partial\lvert x\rvert=
\begin{cases}
\{1\},&x>0,\\
\{-1\},&x<0,\\
[-1,1],&x=0.
\end{cases}
$$

**证明。** $x>0$ 时 $f$ 在邻域内等于恒等，可微，$\nabla f=1$，故 $\partial f(x)=\{1\}$。$x<0$ 时 $f$ 等于 $-x$，$\nabla f=-1$。

$x=0$：$z\in\partial f(0)$ $\iff$ $\lvert y\rvert\ge z y$ 对一切 $y$。

- 取 $y=1$：$1\ge z$。
- 取 $y=-1$：$1\ge -z$，即 $z\ge -1$。
- 若 $z\in[-1,1]$，则 $zy\le\lvert z\rvert\lvert y\rvert\le\lvert y\rvert$，成立。

故 $\partial\lvert 0\rvert=[-1,1]$。

### 18.3 运算法则（含次微分和：内容重点条件）

$f$ 凸时：

- **仿射复合：** $g(x)=f(Ax+b)$ $\Rightarrow$ $\partial g(x)=A^\top\partial f(Ax+b)$。
- **非负组合 / 次微分和：** $\partial(\alpha f_1+\beta f_2)\supseteq\alpha\partial f_1+\beta\partial f_2$（$\alpha,\beta>0$）。若存在一点 $x_0\in\mathrm{dom}(f_1)\cap\mathrm{dom}(f_2)$ 使 $f_1$（或 $f_2$）在 $x_0$ **连续**，则等号。
- **点式最大：** $f=\max_{i=1,\ldots,n}f_i$，则 $\partial f(x)=\mathrm{conv}\{\partial f_i(x):f_i(x)=f(x)\}$（只混合达到最大的那些）。
- **可分和：** $f(x)=\sum_i f_i(x_i)$ $\Rightarrow$ $\partial f(x)=\partial f_1(x_1)\times\cdots\times\partial f_n(x_n)$。

**次微分和：$\supseteq$ 永远成立。** 设 $z_i\in\partial f_i(x)$。则 $f_i(y)\ge f_i(x)+\langle z_i,y-x\rangle$。乘 $\alpha,\beta>0$ 再相加，即 $\alpha z_1+\beta z_2\in\partial(\alpha f_1+\beta f_2)(x)$。

**等号需要正则：反例（没有公共连续点）。** 在 $\mathbb{R}^2$ 上取 $f_1=I_{\{y=0\}}$、$f_2=I_{\{y=x^2\}}$，在原点 $x_0=(0,0)$ 考虑。两个定义域只在原点相交，$f_1+f_2=I_{\{(0,0)\}}$，故 $\partial(f_1+f_2)(x_0)=\mathbb{R}^2$；而两个法锥都沿竖直方向，$\partial f_1(x_0)+\partial f_2(x_0)$ 只是竖直直线，不等于 $\mathbb{R}^2$。

**等号：存在 $x_0$ 使其中一个连续。** 证 $\partial(f_1+f_2)(x)\subseteq\partial f_1(x)+\partial f_2(x)$（$\alpha=\beta=1$；一般情形对 $\alpha f_1,\beta f_2$ 同样）。有限维里凸函数在 $\mathrm{int}(\mathrm{dom})$ 连续，故「某点连续」可用 $\mathrm{ri}(\mathrm{dom} f_1)\cap\mathrm{ri}(\mathrm{dom} f_2)\neq\emptyset$ 代替（Moreau–Rockafellar）。

取 $g\in\partial(f_1+f_2)(x)$。令

$$
\varphi(d)=f_1(x+d)-f_1(x)-\langle g,d\rangle,\qquad
\psi(d)=f_2(x+d)-f_2(x).
$$

则 $\varphi(0)=\psi(0)=0$，且 $\varphi+\psi\ge 0$（因为 $g$ 是 $f_1+f_2$ 的次梯度）。定义凸集

$$
C=\bigl\{(d,r):r\ge\varphi(d)\bigr\},\qquad
D=\bigl\{(d,r):r\le-\psi(d)\bigr\}.
$$

若 $r\ge\varphi(d)$ 且 $r<-\psi(d)$，则 $\varphi(d)+\psi(d)<0$，与 $\varphi+\psi\ge 0$ 矛盾，故 $C\cap\mathrm{int}(D)=\emptyset$。设 $f_1$ 在某点连续，则 $\varphi$ 在某点有限且连续，$C$ 有非空内部。分离：存在 $(z,\beta)\neq 0$ 与 $\gamma$ 使

$$
\langle z,d\rangle+\beta r\le\gamma\quad\forall(d,r)\in C,
\qquad
\langle z,d\rangle+\beta r\ge\gamma\quad\forall(d,r)\in D.
$$

$C$ 在 $r$ 方向无上界：$\langle z,d\rangle+\beta r\le\gamma$ 对任意大的 $r$ 成立 $\Rightarrow\beta\le 0$。$D$ 在 $\mathrm{dom}\,\psi$ 上 $r$ 无下界：$\langle z,d\rangle+\beta r\ge\gamma$ 对任意小的 $r$ 成立 $\Rightarrow\beta\le 0$（若 $\beta>0$ 则 $r\to-\infty$ 使左边 $\to-\infty$）。若 $\beta=0$，则 $\langle z,d\rangle\le\gamma$ 对 $C$ 的 $d$-投影成立；连续性让该投影含 $0$ 的一个球，迫使 $z=0$，矛盾。故 $\beta<0$。除以 $\lvert\beta\rvert$ 可设 $\beta=-1$。再把 $d=0$、$r=0$（属于 $C\cap D$）代入，得 $\gamma=0$。于是

$$
\varphi(d)\ge\langle z,d\rangle,\qquad
\psi(d)\ge-\langle z,d\rangle,
$$

即 $g+z\in\partial f_1(x)$、$-z\in\partial f_2(x)$。故 $g\in\partial f_1(x)+\partial f_2(x)$。

**仿射复合。** $z\in\partial f(Ax+b)$ $\Rightarrow$ $f(Ay+b)\ge f(Ax+b)+\langle z,A(y-x)\rangle=\cdots+\langle A^\top z,y-x\rangle$，故 $A^\top z\in\partial g(x)$。反向：令 $\varphi=g-f\circ(A\cdot+b)$ 在 $x$ 处次梯度为 $0$ 的部分用链式法则；或直接从定义，$A^\top\partial f(Ax+b)\subseteq\partial g(x)$ 已得，维数/连续性给出等号（$f$ 在 $Ax+b$ 连续即够）。

**可分和。** $f(y)-f(x)=\sum_i\bigl(f_i(y_i)-f_i(x_i)\bigr)$。若 $z_i\in\partial f_i(x_i)$，则 $\langle z,y-x\rangle=\sum z_i(y_i-x_i)$ 拆开，得 $\supseteq$。反向：把其他坐标钉在 $x_{-i}$，一元限制的次微分是 $\partial f_i(x_i)$。

### 18.4 HW：$\partial\|x\|_1$、$\partial\|x\|_2$、$\partial\|x\|_\infty$、$\partial\|X\|_*$

题面不改：compute $\partial f$ with $f(x)=\|x\|_1$，$\|x\|_2$，$\|x\|_\infty$，$f(X)=\|X\|_*$。

**$\|x\|_1=\sum_i\lvert x_i\rvert$（可分和）。** 由 18.3，

$$
\partial\|x\|_1=\prod_{i=1}^n\partial\lvert x_i\rvert,
$$

即 $g_i=\mathrm{sign}(x_i)$ 当 $x_i\neq 0$，$g_i\in[-1,1]$ 当 $x_i=0$。等价写法：$\|g\|_\infty\le 1$ 且 $\langle g,x\rangle=\|x\|_1$（在支撑上对齐符号）。

**$\|x\|_2$。** $x\neq 0$ 时 $f$ 可微：$\nabla f(x)=x/\|x\|_2$（链式法则，$\frac{d}{dx}\sqrt{x^\top x}$）。$x=0$：$g\in\partial f(0)$ $\iff$ $\|y\|_2\ge\langle g,y\rangle$ 对一切 $y$ $\iff$ $\|g\|_2=\sup_{\|y\|_2\le 1}\langle g,y\rangle\le 1$。故

$$
\partial\|x\|_2=
\begin{cases}
\bigl\{x/\|x\|_2\bigr\},&x\neq 0,\\
\{g:\|g\|_2\le 1\},&x=0.
\end{cases}
$$

**$\|x\|_\infty=\max_i\lvert x_i\rvert$（点式最大）。** 令 $f_i(x)=\lvert x_i\rvert$，则 $\|x\|_\infty=\max_i f_i(x)$。活性指标 $I(x)=\{i:\lvert x_i\rvert=\|x\|_\infty\}$。18.3 的点式最大：

$$
\partial\|x\|_\infty=\mathrm{conv}\bigl\{\mathrm{sign}(x_i)e_i:i\in I(x)\bigr\}\quad(x\neq 0).
$$

即 $g$ 满足 $\mathrm{supp}(g)\subseteq I(x)$、$g_i x_i\ge 0$、$\|g\|_1=1$。$x=0$ 时所有 $f_i$ 活性，$\partial\|0\|_\infty=\mathrm{conv}\{\pm e_i\}=\{g:\|g\|_1\le 1\}$。

**核范数。** 令 $X=U\mathrm{diag}(\sigma)V^\top$ 为紧 SVD（只含 $\sigma_i>0$）。对偶公式 $\|X\|_*=\sup_{\|Y\|_2\le 1}\langle X,Y\rangle_F$ 给出：$Y\in\partial\|X\|_*$ $\iff$ $\|Y\|_2\le 1$ 且 $\langle X,Y\rangle_F=\|X\|_*$。von Neumann：$\langle X,Y\rangle_F\le\sum\sigma_i(X)\sigma_i(Y)$，等号当且仅当 $X,Y$ 可同时被同一对正交阵对角化且奇异值同序。因而 $\sigma_i(Y)=1$ 在 $\sigma_i(X)>0$ 的位置，其余 $\sigma_j(Y)\le 1$。写成

$$
\partial\|X\|_*=\bigl\{UV^\top+W:U^\top W=0,\ WV=0,\ \|W\|_2\le 1\bigr\}.
$$

$X=0$ 时 $\partial\|X\|_*=\{W:\|W\|_2\le 1\}$（谱范数单位球）。

### 18.5 软阈值与 ISTA 不动点

**标量。** $\widehat x=\arg\min_x\frac12(x-t)^2+\lambda\lvert x\rvert$（$\lambda>0$）的充要条件 $0\in(\widehat x-t)+\lambda\partial\lvert\widehat x\rvert$，解为

$$
\widehat x=\mathcal{S}_\lambda(t)=\mathrm{sign}(t)\max\bigl(\lvert t\rvert-\lambda,0\bigr).
$$

**向量 $\ell_1$（ISTA / 近端梯度的一步）。** $\widehat x\in\arg\min\frac12\|Ax-b\|_2^2+\lambda\|x\|_1$ 当且仅当对一切 $\tau>0$，

$$
\widehat x=\mathcal{S}_{\lambda\tau}\bigl(\widehat x+\tau A^\top(b-A\widehat x)\bigr).
$$

（对 $\frac12\|x-z\|_2^2+\lambda\tau\|x\|_1$ 的近端，坐标分别软阈值；再令 $z=\widehat x+\tau A^\top(b-A\widehat x)$，这是前向–后向分裂的不动点。）

**约束凸问题。** 在「存在 $x_0\in\mathrm{dom}(f)\cap C$ 且 $f$ 在 $x_0$ 连续」之类正则条件下，

$$
0\in\partial f(x^*)+N_C(x^*)\iff x^*\in\arg\min\{f(x):x\in C\}.
$$

这就是 $0\in\partial(f+I_C)(x^*)$。

### 18.6 次微分非空、单调、Lipschitz

**定理。** $f$ 真凸。若 $f$ 在 $x_0\in\mathrm{dom}(f)$ **连续**，则 $\partial f(x_0)\neq\emptyset$。若 $f$ 在某点邻域上有上界，则 $f$ 在 $\mathrm{int}(\mathrm{dom}(f))$ 上连续（因而内部处处次微分非空）。

**证明（次微分非空）。** 连续 $\Rightarrow$ 存在 $\varepsilon>0$ 使 $f(y)<f(x_0)+1$ 对 $\|y-x_0\|<\varepsilon$。于是 $\mathrm{int}(\mathrm{epi}(f))$ 非空（含 $\bigl(x_0,f(x_0)+2\bigr)$ 的一个球），而 $\bigl(x_0,f(x_0)\bigr)$ 在 epi 的边界上。支撑超平面：存在 $(g,-\beta)\neq 0$ 使

$$
\langle g,y-x_0\rangle-\beta\bigl(t-f(x_0)\bigr)\le 0\qquad\forall(y,t)\in\mathrm{epi}(f).
$$

$t$ 可任意大 $\Rightarrow\beta\ge 0$。若 $\beta=0$，则 $\langle g,y-x_0\rangle\le 0$ 对 $y$ 在 $x_0$ 的一个球内成立，迫使 $g=0$，与 $(g,-\beta)\neq 0$ 矛盾。故 $\beta>0$。除以 $\beta$，得 $g/\beta\in\partial f(x_0)$。

**有上界 $\Rightarrow$ 内部连续。** 设 $f\le M$ 在 $x_0$ 的球 $B(x_0,r)$ 上。对 $\|h\|<r$，把 $x_0+h$ 写成 $x_0$ 与球面上一点的凸组合的「反向外推」：令 $z=x_0-\frac{r-t}{t}h$ 等标准论证给出局部 Lipschitz（常数 $\le 2(M-f(x_0))/r$），从而连续。凸函数在 $\mathrm{int}(\mathrm{dom})$ 上处处连续、处处 $\partial f\neq\emptyset$。

**次梯度单调：** $\langle\xi-\eta,x-y\rangle\ge 0$ 对 $\xi\in\partial f(x)$、$\eta\in\partial f(y)$（把次梯度不等式对调相加）。

**内容 Check：$f\in\mathrm{Lip}(L)$（相对 $\|\cdot\|$）$\iff$ 一切次梯度满足 $\|g\|_*\le L$。**

**证明 $\Rightarrow$。** 取 $g\in\partial f(x)$、$\|v\|=1$、$t>0$，$y=x+tv$。Lipschitz 给出 $f(y)-f(x)\le Lt$，次梯度给出 $f(y)-f(x)\ge t\langle g,v\rangle$，故 $\langle g,v\rangle\le L$。对一切 $\|v\|=1$ 取 sup：$\|g\|_*=\sup_{\|v\|\le 1}\langle g,v\rangle\le L$。

**证明 $\Leftarrow$。** 对任意 $x,y$，取 $g_y\in\partial f(y)$（内部点存在；边界用闭性/逼近）。则

$$
f(y)-f(x)\le\langle g_y,y-x\rangle\le\|g_y\|_*\|y-x\|\le L\|y-x\|.
$$

对调 $x,y$ 得另一侧，故 $\lvert f(y)-f(x)\rvert\le L\|y-x\|$。

### 18.7 Bregman 距离

若 $\xi\in\partial f(x)$，

$$
D_f^\xi(y,x):=f(y)-f(x)-\langle\xi,y-x\rangle\ge 0.
$$

一般不对称、无三角不等式。例子：

- $f(x)=\frac12 x^\top Ax$（$A\succ 0$）：$D=\frac12(x-z)^\top A(x-z)$（与 $\xi$ 无关，因为可微）。
- 负熵 $f(x)=\sum_i x_i\log x_i$ 在概率单纯形上关于 $\|\cdot\|_1$ 是 $1$-强凸，Bregman 即 KL：$D(x,z)=\sum x_i\log(x_i/z_i)$。

若 $f$ 可微且 $m$-强凸（相对 $\|\cdot\|$），则 $D_f(x,z)\ge\frac m2\|x-z\|^2$，且 $D_f(\cdot,z)$ 对第一变元凸，$\nabla_x D_f(x,z)=\nabla f(x)-\nabla f(z)$。

**广义余弦定律。** $\xi\in\partial f(x)$、$\eta\in\partial f(y)$：

$$
D_f^\xi(z,x)-D_f^\eta(z,y)=D_f^\xi(y,x)+\langle\xi-\eta,y-z\rangle.
$$

（把三个定义展开即得。）$f=\|\cdot\|_2^2$ 时回到

$$
\|x-z\|_2^2=\|x-y\|_2^2+\|y-z\|_2^2-2\langle x-y,z-y\rangle.
$$

**Bregman 投影（内容 Check）。** $\Pi^{D_f}_C(z)=\arg\min_{x\in C}D_f^\xi(x,z)$。Check：$\forall z$，$D_f^\xi\bigl(y,\Pi^{D_f}_C(z)\bigr)\le D_f^\xi(y,z)$ 对一切 $y\in C$。

**证明。** 以下写可微情形（$\xi=\nabla f(z)$，$\Pi=\Pi^{D_f}_C(z)$）；非光滑时把 $\nabla f$ 换成对应次梯度，最优性仍是变分不等式。$C$ 凸，$\Pi$ 最小化 $x\mapsto D_f(x,z)=f(x)-f(z)-\langle\nabla f(z),x-z\rangle$，一阶条件（18.5 约束 Fermat）：

$$
\langle\nabla f(\Pi)-\nabla f(z),\,y-\Pi\rangle\ge 0\qquad\forall y\in C.
$$

广义余弦定律（上面）在点 $\Pi,z$ 与方向 $y$：

$$
D_f(y,z)-D_f(y,\Pi)=D_f(\Pi,z)+\langle\nabla f(\Pi)-\nabla f(z),y-\Pi\rangle.
$$

右边第一项 $\ge 0$（Bregman 非负），第二项 $\ge 0$（变分不等式）。故 $D_f(y,\Pi)\le D_f(y,z)$。欧氏投影是 $f=\frac12\|\cdot\|_2^2$ 的特例：$\|y-\Pi\|_2\le\|y-z\|_2$ 并不总对，但 $\|y-\Pi\|_2^2\le\|y-z\|_2^2-\|z-\Pi\|_2^2$ 成立。

---

## 19. Fenchel 共轭

### 19.1 定义

问：哪些仿射函数 $\langle z,x\rangle-\alpha$ 处处在 $f$ 的图像下方？即 $\langle z,x\rangle-\alpha\le f(x)$ $\forall x$。最好（最大）的 $\alpha$ 是 $\sup_x(\langle z,x\rangle-f(x))$。这定义 **Fenchel / Legendre 共轭**

$$
f^*(z)=\sup_{x\in\mathrm{dom}(f)}\bigl\{x^\top z-f(x)\bigr\}.
$$

无论 $f$ 凸不凸，$f^*$ 都是若干线性函数的点式上确界，故**永远凸**（可取 $+\infty$）。若 $f$ 真且在某点 lsc，则 $f^*$ 真、lsc、凸。$+\infty$ 与 $-\infty$ 互为共轭（在处处 $+\infty$ / 处处 $-\infty$ 的平凡函数之间）。

### 19.2 计算例子

- $f(x)=ax+b$：$f^*(a)=-b$，$\mathrm{dom}(f^*)=\{a\}$。
- $f(x)=\|x\|$：$f^*(z)=I_{\{\|\cdot\|_*\le 1\}}(z)$（对偶单位球的示性）。因为 $\sup_x(\langle z,x\rangle-\|x\|)=\sup_{t\ge 0}t(\|z\|_*-1)$。
- $f(x)=\frac1p\|x\|^p$（$p>1$）：$f^*(z)=\frac1q\|z\|_*^q$，$\frac1p+\frac1q=1$。计算：先对半径 $t=\|x\|$ 取 $\sup_{\|x\|=t}\langle z,x\rangle=t\|z\|_*$，再 $\sup_{t\ge 0}(t\|z\|_*-\frac1p t^p)$。
- $f(x)=\frac12 x^\top Ax$（$A\succ 0$）：$f^*(z)=\frac12 z^\top A^{-1}z$（配方，或令梯度 $Ax=z$）。

### 19.3 Fenchel–Young 与次微分

**Young 不等式。** $f(x)+f^*(z)\ge z^\top x$ 对一切 $x,z$（由 $f^*$ 的定义）。

**定理。** $f$ 真凸时，

$$
z\in\partial f(x)
\iff
f(x)+f^*(z)\le\langle z,x\rangle
\iff
f(x)+f^*(z)=\langle z,x\rangle.
$$

**证明。** $z\in\partial f(x)$ $\iff$ $f(y)\ge f(x)+\langle z,y-x\rangle$ $\forall y$ $\iff$ $\langle z,x\rangle-f(x)\ge\langle z,y\rangle-f(y)$ $\forall y$ $\iff$ $\langle z,x\rangle-f(x)\ge f^*(z)$。与 Young 合起来是等号。

因而 $z\in\partial f(x)\Rightarrow x\in\partial f^*(z)$（对 $f^*$ 写 Young 等号）。若再 $f$ 真凸 lsc，则反向也成立（因为下面 $f=f^{**}$）。

### 19.4 双共轭

Young 给出 $f(x)\ge\sup_z\bigl(\langle z,x\rangle-f^*(z)\bigr)=:f^{**}(x)$，即 $f\ge f^{**}$。$f^{**}$ 是 $f$ 的**双共轭**，也是 $\le f$ 的最大闭凸函数（闭凸包）。

**定理。** $f$ 真凸 lsc $\Rightarrow$ $f=f^{**}$。内容重点：$f\le f^{**}$ 由凸集分离定理（Young 已经给出另一向 $f\ge f^{**}$，合起来就是等号）。

**证明。** Young 对一切 $z$ 给出 $f(x)\ge\langle z,x\rangle-f^*(z)$，对 $z$ 取 $\sup$ 即 $f\ge f^{**}$。以下证 $f\le f^{**}$。用反证：若某点 $x_0$ 有 $f^{**}(x_0)<f(x_0)$（允许 $f(x_0)=+\infty$），取 $\gamma$ 使

$$
f^{**}(x_0)<\gamma<f(x_0).
$$

点 $p=(x_0,\gamma)$ **不在** $\mathrm{epi}(f)$ 中。$f$ 真凸 lsc $\Rightarrow\mathrm{epi}(f)$ 是非空闭凸集。$\{p\}$ 是紧凸。严格分离（13.3）：存在 $(z,-\beta)\neq 0$ 与 $\alpha\in\mathbb{R}$ 使

$$
\langle z,x\rangle-\beta t\le\alpha\qquad\forall(x,t)\in\mathrm{epi}(f),
$$

$$
\langle z,x_0\rangle-\beta\gamma>\alpha.
$$

*先排除 $\beta<0$。* epi 在 $t$ 方向无上界：$t\to+\infty$ 会使 $-\beta t\to+\infty$，与 $\le\alpha$ 矛盾。

*再排除 $\beta=0$。* 此时 $\langle z,x\rangle\le\alpha<\langle z,x_0\rangle$ 对一切 $x\in\mathrm{dom}(f)$。于是对任意 $\lambda>0$，

$$
f^*(\lambda z)=\sup_x\bigl(\langle\lambda z,x\rangle-f(x)\bigr)\le\lambda\alpha-\inf f.
$$

更关键：$\langle z,x\rangle-\alpha\le 0$ 在 $\mathrm{dom}(f)$ 上，把仿射函数 $\langle\lambda z,\cdot\rangle-(\lambda\alpha+c)$ 的斜率拉到无穷会推出 $f^{**}(x_0)=+\infty$ 或与 $f$ 真矛盾。标准写法：$\beta=0$ 给出垂直分离，$\mathrm{dom}(f)$ 落在闭半空间 $\{x:\langle z,x\rangle\le\alpha\}$ 里且 $x_0$ 在其外。则对一切 $\lambda>0$，

$$
\langle\lambda z,x_0\rangle-f^*(\lambda z)
=\langle\lambda z,x_0\rangle-\sup_x\bigl(\langle\lambda z,x\rangle-f(x)\bigr)
\ge\langle\lambda z,x_0\rangle-\lambda\alpha+\inf_{x\in\mathrm{dom}(f)}f(x).
$$

$\langle z,x_0\rangle-\alpha>0$，令 $\lambda\to+\infty$ 得 $f^{**}(x_0)=+\infty$，与 $f^{**}(x_0)<\gamma$ 矛盾。

*故 $\beta>0$。* 除以 $\beta$，令 $w=z/\beta$、$c=\alpha/\beta$。则 $\langle w,x\rangle-t\le c$ 对一切 $t\ge f(x)$，即 $\langle w,x\rangle-f(x)\le c$，故 $f^*(w)\le c$。另一方面 $\langle w,x_0\rangle-\gamma>c$，因此

$$
f^{**}(x_0)=\sup_u\bigl(\langle u,x_0\rangle-f^*(u)\bigr)
\ge\langle w,x_0\rangle-f^*(w)
>\gamma+c-c=\gamma,
$$

与 $f^{**}(x_0)<\gamma$ 矛盾。

所以不存在这样的 $x_0$，即 $f\le f^{**}$。与 Young 合起来 $f=f^{**}$。

---

## 20. 凸性的推广：拟凸与对数凹

### 20.1 拟凸

$f$ **拟凸**：$\mathrm{dom}(f)$ 凸，且每个下水平集 $S_\alpha=\{f\le\alpha\}$ 凸。

等价的 Jensen：$f(\theta x+(1-\theta)y)\le\max\{f(x),f(y)\}$。

例子：$\sqrt{\lvert x\rvert}$、天花板函数 $\lceil x\rceil$ 在 $\mathbb{R}$ 上拟凸；$\log x$ 在 $\mathbb{R}_{++}$ 上拟凸（其实还是凹的，凹 $\Rightarrow$ 拟凸）。凸 $\Rightarrow$ 拟凸，反过来很弱。

**严格拟凸：** $x\neq y$、$\theta\in(0,1)$ 时 $f(\theta x+(1-\theta)y)<\max\{f(x),f(y)\}$。严格拟凸的最小点若存在则唯一（否则线段上函数不能低于两端的共同值）。

**一阶条件。** 可微、$\mathrm{dom}$ 凸。则拟凸 $\iff$

$$
f(y)\le f(x)\ \implies\ \nabla f(x)^\top(y-x)\le 0.
$$

**证明 $\Rightarrow$。** 若 $f(y)\le f(x)$ 但 $\langle\nabla f(x),y-x\rangle>0$，则沿 $y-x$ 的方向导数为正，小步 $f(x+t(y-x))>f(x)$。但拟凸 Jensen 给出 $f(x+t(y-x))\le\max\{f(x),f(y)\}=f(x)$，矛盾。

**证明 $\Leftarrow$。** 若线段上某点 $z=\theta x+(1-\theta)y$ 有 $f(z)>\max\{f(x),f(y)\}$，在线段上取 $f$ 的最大值点（紧），该点导数沿线段应为 $0$，但两端函数更小，与一阶条件矛盾（细节见 Boyd & Vandenberghe, §3.4.3）。

### 20.2 对数凹

$f>0$ 且 $\log f$ 凹，即 $f(\theta x+(1-\theta)y)\ge f(x)^\theta f(y)^{1-\theta}$。常见指数族密度是对数凹的。凸集的示性 $1_C$（在 $C$ 上为 $1$、外为 $0$）在「$0$-$1$ 函数」意义下当 $C$ 凸时对数凹。

二阶：$\mathrm{dom}$ 凸且 Hessian 存在时，对数凹 $\iff$ $f(x)\nabla^2 f(x)\preceq\nabla f(x)\nabla f(x)^\top$。

**Prékopa–Leindler / Dinghas。** 两个对数凹函数的乘积、点式最小、卷积仍对数凹；对数凹密度的线性像、边缘、分布函数仍对数凹。特别：$f(x,y)$ 联合对数凹 $\Rightarrow$ $g(x)=\int f(x,y)\,dy$ 对数凹。因而若 $X$ 有对数凹密度、$C$ 凸，则 $x\mapsto\mathbb{P}(x+Y\in C)$ 对数凹（把 $1_C$ 与密度卷积）。

---

## 21. 解的存在性与无约束最优性

考虑 $\min_{x\in C}f(x)$，或无约束形式 $\min\bigl(f+I_C\bigr)$。

### 21.1 Weierstrass 型存在性

若 $f$ 真且 lsc，并且下列之一成立：

- 某个下水平集 $C_\alpha\cap C$ 非空有界（因而闭有界，有限维紧）；
- $\mathrm{dom}(f)\cap C$ 有界；
- $f$ 在 $C$ 上强制：$\lim_{\|x\|\to\infty,\,x\in C}f(x)=+\infty$；

则解集非空紧。若问题凸（$f$ 与 $C$ 都凸），解集还凸。若 $C$ 非空凸且 $f$ 严格拟凸，则解若存在必唯一。

人话：连续函数在紧集上取到最小；强制把「无穷远」赶出下水平集，使下水平集紧。

### 21.2 无约束二阶条件（$C=\mathbb{R}^n$，Hessian 存在）

- **必要：** $x^*$ 局部最小 $\Rightarrow$ $\nabla f(x^*)=0$、$\nabla^2 f(x^*)\succeq 0$。
- **充分：** $\nabla f(x^*)=0$ 且 $\nabla^2 f(x^*)\succ 0$ $\Rightarrow$ $x^*$ 严格局部最小。

（必要：沿任意方向的一元限制在 $0$ 处有 $g'(0)=0$、$g''(0)\ge 0$。充分：Taylor 余项被正定二次型控制，邻域内 $f(x)>f(x^*)$。）

### 21.3 内容 Check：相位恢复

$$
f(x)=\sum_{i=1}^n\bigl((a_i^\top x)^2-b_i^2\bigr)^2.
$$

令 $\varphi_i(x)=(a_i^\top x)^2-b_i^2$。则 $\nabla\varphi_i=2(a_i^\top x)a_i$，

$$
\nabla f(x)=4\sum_{i=1}^n\varphi_i(x)\,(a_i^\top x)\,a_i,
$$

$$
\nabla^2 f(x)=4\sum_{i=1}^n\bigl(3(a_i^\top x)^2-b_i^2\bigr)a_i a_i^\top.
$$

$x=0$ 总是临界点。若存在 $b_i\neq 0$，则 $\nabla^2 f(0)=4\sum(-b_i^2)a_i a_i^\top\preceq 0$ 且不是零，**不满足局部最小的二阶必要**（Hess 半正定），故 $0$ 不是局部最小。无噪声全局最小满足 $(a_i^\top x)^2=b_i^2$，此时 $\nabla^2 f(x)=8\sum b_i^2 a_i a_i^\top\succeq 0$；若 $\{a_i\}$ 张成 $\mathbb{R}^n$ 且 $b_i$ 不全零，通常正定，从而那些全局最小是严格局部最小。这解释了相位恢复「原点是鞍 / 局部最大，真正的解在球面附近」。

### 21.4 非凸非光滑：三类次微分（知道名字即可）

$f$ 真 lsc（可不凸）：

- **Fréchet：** $\partial_F f(x)=\bigl\{u:\liminf_{y\to x,y\neq x}\frac{f(y)-f(x)-\langle u,y-x\rangle}{\|y-x\|}\ge 0\bigr\}$。
- **极限次微分：** $\overline{\partial} f(x)=\{u:\exists x_k\to x,\ f(x_k)\to f(x),\ u_k\in\partial_F f(x_k),\ u_k\to u\}$。
- **Clarke：** $\partial_C f(x)=\mathrm{conv}(\partial_B f(x))$，其中 $\partial_B$ 是可微点梯度的极限（$f$ 局部 Lipschitz 时 Rademacher 保证几乎处处可微）。

局部 Lipschitz 的局部最小满足 $0\in\partial_F f(x^*)\subseteq\overline{\partial}f(x^*)\subseteq\partial_C f(x^*)$。凸时它们与 $\partial f$ 一致。

---

## 22. Lagrange 对偶与弱对偶

### 22.1 原问题与 Lagrangian

$$
\min_x f(x)\quad\mathrm{s.t.}\quad
c_i(x)\le 0,\ i\in I,\qquad
c_j(x)=0,\ j\in E,
$$

$\lvert I\rvert=m$、$\lvert E\rvert=q$。可行集 $C=\{x:c_I(x)\le 0,\ c_E(x)=0\}\cap\mathrm{dom}(f)$，原最优值 $p^*=\inf_{x\in C}f(x)$。

**Lagrangian**

$$
\mathcal{L}(x,\lambda,\nu)=f(x)+\sum_{i\in I}\lambda_i c_i(x)+\sum_{j\in E}\nu_j c_j(x),
\qquad\lambda\ge 0.
$$

$\lambda_i$ 是不等式乘子，$\nu_j$ 是等式乘子。

**对偶函数** $g(\lambda,\nu)=\inf_x\mathcal{L}(x,\lambda,\nu)$，作为 $(\lambda,\nu)$ 的函数是若干仿射函数的下确界，**永远凹**（不论 $f,c$ 凸否），值域 $[-\infty,+\infty)$。对偶问题 $\sup_{\lambda\ge 0,\nu}g(\lambda,\nu)$，对偶最优值 $d^*$。对偶可行集 $G=\{g>-\infty\}$。

### 22.2 弱对偶 $d^*\le p^*$

对任意可行 $x\in C$ 和任意 $\lambda\ge 0,\nu$，

$$
\mathcal{L}(x,\lambda,\nu)=f(x)+\sum\lambda_i\underbrace{c_i(x)}_{\le 0}+\sum\nu_j\underbrace{c_j(x)}_{=0}\le f(x),
$$

故 $g(\lambda,\nu)\le f(x)$。左边对 $(\lambda,\nu)$ 取 sup、右边对 $x\in C$ 取 inf：$d^*\le p^*$。差值 $p^*-d^*$ 叫对偶间隙。

### 22.3 线性规划及其对偶（内容写法）

原问题 $\min a^\top x$ s.t. $Ax=b$、$x\ge 0$。Lagrangian 对 $x\ge 0$ 的 inf 有限当且仅当 $A^\top\nu+a\ge 0$，此时 $g=-b^\top\nu$（内容把等式乘子的符号写成 $\max -b^\top\nu$）。这是标准 LP 对偶的一种符号约定。

一般线性约束 $Ax\le b$、$Cx=d$ 时，

$$
g(\lambda,\nu)=-f^*(-A^\top\lambda-C^\top\nu)-b^\top\lambda-d^\top\nu.
$$

例：负熵 $f(x)=\sum x_i\log x_i$，$f^*(y)=\sum(e^{y_i}-1)$。

---

## 23. 凸问题的强对偶、Slater、KKT

### 23.1 陈述

考虑凸问题

$$
\min f(x)\quad\mathrm{s.t.}\quad c_i(x)\le 0,\ i=1,\ldots,m,\quad Ax=b,
$$

$f$ 真凸，$c_i$ 凸，可行集 $C$ 非空凸。

**Slater 约束资格。** 存在 $x_0\in\mathrm{ri}(\mathrm{dom}(f))\cap C$ 使得对一切**非仿射**的 $c_i$ 有 $c_i(x_0)<0$（内容：$x_0\in\mathrm{reint}(\mathrm{dom}(f))\cap C$；仿射不等式只需 $\le 0$，已含在 $C$ 里）。

**强对偶。** Slater $\Rightarrow$ $d^*=p^*$，且对偶最优乘子存在（只要 $p^*$ 有限）。

### 23.2 强对偶：分离论证（内容重点 Slater）

定义值域集合

$$
\mathcal{A}=\bigl\{(u,v,t)\in\mathbb{R}^m\times\mathbb{R}^{n_A}\times\mathbb{R}:
\exists x\in\mathrm{dom}(f),\ c(x)\le u,\ Ax-b=v,\ f(x)\le t\bigr\},
$$

其中 $n_A$ 是 $A$ 的行数。$f,c_i$ 凸 $\Rightarrow\mathcal{A}$ 凸。若 $p^*$ 有限，则 $(0,0,p^*)$ 在 $\mathcal{A}$ 的边界上：任何 $t<p^*$ 的 $(0,0,t)\notin\mathcal{A}$（否则会有可行点函数值 $<p^*$）。分离 $\mathcal{A}$ 与 $\{(0,0,p^*)\}$：存在不全为零的 $(\lambda,\nu,\mu)$ 使

$$
\lambda^\top u+\nu^\top v+\mu t\ \ge\ \mu p^*\qquad\forall(u,v,t)\in\mathcal{A}.
$$

**符号。** $\mathcal{A}$ 在每个 $u_i$ 方向含 $+\mathbb{R}_+$（把 $u_i$ 再加大仍属于 $\mathcal{A}$），故 $\lambda_i\ge 0$（否则 $u_i\to+\infty$ 左边 $\to-\infty$）。同理 $\mu\ge 0$。

**Slater $\Rightarrow\mu>0$。** 若 $\mu=0$，则 $\lambda^\top u+\nu^\top v\ge 0$ 对一切 $\mathcal{A}$ 中的 $(u,v,\cdot)$。取 Slater 点 $x_0\in\mathrm{ri}(\mathrm{dom}(f))\cap C$，故 $Ax_0=b$、全体 $c_i(x_0)\le 0$，且非仿射的 $c_i(x_0)<0$。把 $u=c(x_0)$、$v=0$ 代入得 $\lambda^\top c(x_0)\ge 0$。但 $\lambda\ge 0$ 且 $c(x_0)\le 0$，故 $\lambda^\top c(x_0)=0$；非仿射坐标的 $c_i(x_0)<0$ 迫使这些 $\lambda_i=0$。剩下仿射不等式与等式：$\lambda_{\mathrm{aff}}^\top c_{\mathrm{aff}}(x)+\nu^\top(Ax-b)\ge 0$ 必须对 $\mathrm{ri}(\mathrm{dom})$ 里相对开的一块成立。仿射函数在相对开集上非负只能是恒等于 $0$，故 $\lambda_{\mathrm{aff}}=0$、$\nu=0$。于是 $(\lambda,\nu,\mu)=0$，矛盾。故 $\mu>0$。

**归一化。** 除以 $\mu$，仍记 $\lambda,\nu$。对任意 $x\in\mathrm{dom}(f)$ 取 $u=c(x)$、$v=Ax-b$、$t=f(x)$：

$$
f(x)+\lambda^\top c(x)+\nu^\top(Ax-b)\ge p^*\qquad\forall x,
$$

即 $g(\lambda,\nu)\ge p^*$。弱对偶另一向 $g\le p^*$，故 $d^*=p^*$，$(\lambda,\nu)$ 对偶最优。

人话：Slater 的严格可行点把「竖直」分离（$\mu=0$）打死，分离超平面一定有函数值坐标，归一化后就是一组对偶可行乘子。仿射约束不需要严格可行，因为它们已经是「薄」的，相对内部就够。

### 23.3 凸问题的 KKT

在 Slater 下，$x^*$ 原最优 $\iff$ 存在 $(\lambda^*,\nu^*)$ 使

$$
\begin{aligned}
0&\in\partial f(x^*)+\sum_{i=1}^m\lambda_i^*\partial c_i(x^*)+A^\top\nu^*,
&&\text{（驻点）}\\
Ax^*&=b,\quad c_i(x^*)\le 0,
&&\text{（原可行）}\\
\lambda_i^*&\ge 0,
&&\text{（对偶可行）}\\
\lambda_i^* c_i(x^*)&=0,\quad i=1,\ldots,m
&&\text{（互补松弛）}.
\end{aligned}
$$

此时 $(\lambda^*,\nu^*)$ 对偶最优，且 $d^*=p^*$。可微时把次微分换成梯度。

**证明 $\Leftarrow$。** 驻点说 $x^*$ 最小化 $\mathcal{L}(\cdot,\lambda^*,\nu^*)$，故 $g(\lambda^*,\nu^*)=\mathcal{L}(x^*,\lambda^*,\nu^*)$。互补松弛与可行性推出 $\mathcal{L}(x^*,\lambda^*,\nu^*)=f(x^*)$。于是

$$
f(x^*)=\mathcal{L}(x^*,\lambda^*,\nu^*)\ge p^*\ge d^*\ge g(\lambda^*,\nu^*)=\mathcal{L}(x^*,\lambda^*,\nu^*),
$$

全部等号，$p^*=d^*$，原–对偶同时最优。

**证明 $\Rightarrow$。** Fermat：$x^*\in\arg\min(f+I_C)$ $\iff$ $0\in\partial f(x^*)+N_C(x^*)$。把 $C$ 写成交：$C=\bigcap_i C_i\cap C_{\mathrm{eq}}$，$C_i=\{c_i\le 0\}$，$C_{\mathrm{eq}}=\{Ax=b\}$。

- 等式：$N_{C_{\mathrm{eq}}}(x^*)=\mathcal{R}(A^\top)$（第 13.1 节）。
- 不等式：若 $c_i(x^*)<0$，$x^*$ 是 $C_i$ 的内点，$N_{C_i}(x^*)=\{0\}$。若 $c_i(x^*)=0$ 且 Slater（存在 $c_i<0$ 的点），第 13.1 节给出 $N_{C_i}(x^*)=\mathrm{cone}(\partial c_i(x^*))$。
- 交的法锥可加：Slater 给出 $\bigcap\mathrm{ri}(C_i)\cap C_{\mathrm{eq}}\neq\emptyset$ 这一类约束资格，故

$$
N_C(x^*)=\sum_{i:\,c_i(x^*)=0}\mathrm{cone}\bigl(\partial c_i(x^*)\bigr)+\mathcal{R}(A^\top).
$$

非积极约束的法锥是 $\{0\}$，对应 $\lambda_i^*=0$，此即互补松弛。积极约束的锥组合给出 $\lambda_i^*\ge 0$。把 $0\in\partial f(x^*)+N_C(x^*)$ 展开即 KKT 驻点。

---

## 24. 切锥与一般约束的 KKT 必要

现在 $f,c_i$ 只假设可微，不必凸。可行集仍记 $C$。

### 24.1 切锥与线性化可行锥

$x\in C$ 处的**切锥**

$$
T_C(x)=\Bigl\{d:\ \exists\, z_k\in C,\ z_k\to x,\ t_k\downarrow 0,\ \frac{z_k-x}{t_k}\to d\Bigr\}.
$$

人话：沿可行点列能逼近的方向。

积极集 $A(x)=E\cup\{i\in I:c_i(x)=0\}$。**线性化可行方向锥**

$$
F(x)=\bigl\{d:\ \nabla c_j(x)^\top d=0\ (j\in E),\quad
\nabla c_i(x)^\top d\le 0\ (i\in A(x)\cap I)\bigr\}.
$$

始终有 $T_C(x)\subseteq F(x)$。反向 $T_C(x)=F(x)$ 叫做 Abadie 约束资格（ACQ），是导出 KKT 的最小几何假设之一。内容重点问的就是：何时 $T_C(x^*)=F_C(x^*)$。

**证明 $T\subseteq F$。** 取 $d\in T_C(x)$，即存在 $z_k\in C$、$t_k\downarrow 0$ 使 $(z_k-x)/t_k\to d$。对每个等式 $c_j(z_k)=0=c_j(x)$，

$$
\nabla c_j(x)^\top d
=\lim_k\frac{c_j(z_k)-c_j(x)}{t_k}=0.
$$

对每个积极不等式 $c_i(x)=0$、$c_i(z_k)\le 0$，

$$
\nabla c_i(x)^\top d
=\lim_k\frac{c_i(z_k)-c_i(x)}{t_k}\le 0.
$$

故 $d\in F(x)$。

### 24.2 一般 KKT 必要

设 $x^*$ 是 $\min\{f+I_C\}$ 的局部最小，$f$ 与诸 $c$ 可微。若 $T_C(x^*)=F(x^*)$，则存在 $(\lambda^*,\nu^*)$ 使

$$
\begin{aligned}
\nabla f(x^*)+\sum_{i=1}^m\lambda_i^*\nabla c_i(x^*)+\sum_{j=1}^q\nu_j^*\nabla c_j(x^*)&=0,\\
c_i(x^*)&\le 0,\quad c_j(x^*)=0,\\
\lambda_i^*&\ge 0,\\
\lambda_i^*c_i(x^*)&=0.
\end{aligned}
$$

（内容把等式乘子也写成 $\lambda$、下标从 $j=q$ 起，属排版；上式是标准写法。）

**为什么需要 $T=F$（Farkas）。** 局部最小 $\Rightarrow$ 沿一切切方向不能下降：$\langle\nabla f(x^*),d\rangle\ge 0$ 对一切 $d\in T_C(x^*)$。若 $T=F$，即

$$
\nabla c_j(x^*)^\top d=0\ (j\in E),\quad
\nabla c_i(x^*)^\top d\le 0\ (i\in A(x^*)\cap I)
\quad\Longrightarrow\quad
\nabla f(x^*)^\top d\ge 0.
$$

这排除了线性系统 $\nabla f^\top d<0$、$\nabla c_E^\top d=0$、$\nabla c_{A\cap I}^\top d\le 0$ 的存在性。Farkas 引理：存在 $\lambda_i^*\ge 0$（$i\in A\cap I$）、$\nu_j^*$ 使

$$
\nabla f(x^*)+\sum_{i\in A(x^*)\cap I}\lambda_i^*\nabla c_i(x^*)+\sum_{j\in E}\nu_j^*\nabla c_j(x^*)=0.
$$

非积极约束令 $\lambda_i^*=0$，即互补松弛。这就是 KKT。没有 $T=F$，切锥可能比线性化锥更小，Farkas 用不上去，乘子可以不存在。

### 24.3 保证 $T=F$ 的两个条件

**LICQ（线性无关约束资格）。** $\{\nabla c_i(x^*):i\in A(x^*)\}$ 线性无关 $\Rightarrow$ $T_C(x^*)=F(x^*)$。

**MFCQ（Mangasarian–Fromovitz）。** $\{\nabla c_j(x^*):j\in E\}$ 线性无关，且存在 $w$ 使

$$
\nabla c_i(x^*)^\top w<0\quad(i\in A(x^*)\cap I),\qquad
\nabla c_j(x^*)^\top w=0\quad(j\in E).
$$

则同样 $T=F$。

**证明：LICQ $\Rightarrow$ MFCQ。** 把积极约束的梯度排成行满秩矩阵 $G$。线性系统 $Gw=v$ 对任意右边可解。取 $v_j=0$（$j\in E$）、$v_i=-1$（$i\in A\cap I$），解出的 $w$ 即 MFCQ 方向。等式梯度是 $G$ 的子行，当然线性无关。

**证明：MFCQ $\Rightarrow$ $T=F$。** 已证 $T\subseteq F$。取 $d\in F(x^*)$。对 $\tau>0$ 令 $d_\tau=d+\tau w$。则

$$
\nabla c_j(x^*)^\top d_\tau=0\ (j\in E),\qquad
\nabla c_i(x^*)^\top d_\tau
=\nabla c_i^\top d+\tau\nabla c_i^\top w<0\ (i\in A\cap I),
$$

因为第一项 $\le 0$、第二项 $<0$。等式梯度线性无关，隐函数定理：存在 $C^1$ 曲线 $z(t)=x^*+t d_\tau+o(t)$（$t\downarrow 0$）落在等式约束流形上。积极不等式沿 $d_\tau$ 的方向导数严格负，故小 $t>0$ 时 $c_i(z(t))<0$；非积极的本来就 $<0$，小扰动仍 $<0$。于是 $z(t)\in C$，$(z(t)-x^*)/t\to d_\tau$，故 $d_\tau\in T_C(x^*)$。切锥闭，令 $\tau\downarrow 0$ 得 $d\in T_C(x^*)$。因此 $F\subseteq T$。

凸问题的 Slater 比这些弱一点、全局一点：它给出强对偶和乘子存在，不必在最优点检验梯度线性无关。非凸问题没有弱对偶变强对偶的免费午餐，KKT 只是**局部最小的必要**条件，还可能有乘子不存在的病态约束（需要 CQ）。

---

## 25. 对照表：内容 HW / 「?」/ Check 清单

| 题目 | 本附录 |
| ------ | -------- |
| $\mathrm{tr}(CD)=\mathrm{tr}(DC)$，$\mathrm{tr}(QAQ^{-1})=\mathrm{tr}(A)$ | §1.4 |
| 正交投影 $\iff P=P^\top$；最近点 | §3 |
| $\ell_0$ 不是范数；$\ | x\ | _A$ 是范数 | §4.3, §4.5 |
| $\ | A\ | _2=\max u^\top Av$；$\ | A\ | _2^2\le\ | A\ | _1\ | A\ | _\infty$ | §5.3 |
| SVD Question：四条广义逆公理 | §6.1, §8 |
| SVD 构造；Courant–Fischer HW | §6.3–6.5 |
| 最佳线性编解码器 HW | §7 |
| MP 存在唯一 | §8 |
| Eckart–Young 维数交错 | §9 |
| 扰动 $\ | \delta x\ | /\ | x\ | \le\mathrm{Cond}(A)\ | \delta b\ | /\ | b\ | $ | §10 |
| 核范数三角；变分 / 对偶 | §11 |
| 核范数近端 = 奇异值软阈值 | §11.5 |
| 梯度例子；$\nabla\log\det=X^{-1}$ | §12 |
| lsc $\iff$ 闭水平集 $\iff$ 闭上图 | §14 |
| 零阶；$-\log\det$ 凸；一阶二阶 | §15 |
| 严格凸平行条件 HW；强凸用 $h=f-\frac m2\ | \cdot\ | ^2$ | §16 |
| 绿字：对 $h$ 写余强制 | §17.3 |
| $\nabla f=0\iff\min$；余强制 | §17 |
| $\partial\lvert x\rvert=?$；次微分和的连续点条件；HW $\partial\ | \cdot\ | _{1,2,\infty,*}$；$x^3$ 在 $0$ | §18 |
| Check Lipschitz $\iff\ | g\ | _*\le L$；Bregman 投影 | §18.6–18.7 |
| $f\le f^{**}$ 用分离定理 | §19.4 |
| 相位恢复二阶 | §21.3 |
| Slater $\Rightarrow$ 强对偶；$N_C=\sum\mathrm{cone}(\partial c_i)+\mathcal{R}(A^\top)$ | §23 |
| 何时 $T_C(x^*)=F_C(x^*)$（LICQ / MFCQ） | §24 |

读完本附录，Lec1 的 $\Pi$、$X^\dagger$、$\|\cdot\|_\Sigma$ 和 Lec2 的近端梯度、KKT，不应再有符号障碍。概率与集中不等式见附录 B。
