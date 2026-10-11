---
title: "逼近误差：从 Hölder 函数到 ReLU 网络"
description: "理解维数灾难、万能逼近与神经网络如何表达函数。"
pubDate: 2026-10-11
tags:
  - 数据科学
  - 学习理论
  - FODS
category: course
series: fods
order: 3
cover: /covers/post-math.svg
---

对应讲义：`Fods_26.pdf` p.28–36。

上一份把超额风险拆成了统计 / 逼近 / 优化。这一份只做中间那一块：

$$
E_{\mathrm{app}}
\;=\;
\inf_{f\in\mathcal{F}}\|f-f^*\|_{L^2(\mu_X)}^2.
$$

人话：**模型类 $\mathcal{F}$ 里，有没有一个函数离「上帝的回归函数 $f^*$」足够近？**  
神经网络的宽度、深度、权重有界，到底能逼近多光滑的函数、付多大的维数代价——这就是本节。

你会得到：

1. 平方损失下 $L(f)-L(f^*)=\|f-f^*\|_{L^2(\mu_X)}^2$ 的完整证明；
2. 为什么「用复合去逼近」在历史上就很难（Hilbert 第 13 问题、Kolmogorov–Arnold），以及这对神经网络万能逼近的启示；
3. 维数灾难：$C^\alpha([0,1]^d)$ 逼近到 $\varepsilon$，体积 / packing 给出规模必须 $\asymp\varepsilon^{-d/\alpha}$；讲义的 $O(\varepsilon^{-d/\alpha}\log(1/\varepsilon))$ 是同一指数的存在性上界；
4. 讲义引用的三条现代定理（Jiao–Shen–Lin–Huang AoS 23，Jiao–Lai–Lu–Wang–Yang SIMA 23，Yarotsky / Lu–Shen–Yang–Zhang）的假设与结论；
5. Hölder 类 $\mathcal{H}^\zeta$ 的精确定义；
6. 帽子函数单位分解 $\sum\psi_{\mathbf{n}}\equiv 1$ 的证明；
7. 局部 Taylor + 积分余项：$|f-p|\le 2^d d^r N^{-\zeta}$；
8. 网络的包含 / 复合 / 拼接 / 线性组合（Lemma 1）；
9. 用锯齿逼近 $x^2$：$T_i$、$I_k$ 与 $|x^2-I_k|\le 2^{-2(k+1)}$ 的完整证明；
10. 深度复合把平方误差打到 $(W/3)^{-D}$（Lemma 3）；
11. 极化恒等式造乘法，二叉树造 $d$ 元乘积；
12. 把局部多项式拼成网络 $\phi$，再选 $D=1+\zeta/d$、$N=W^{1/d}$ 得到 $|f-\phi|\le C_d W^{-\zeta/d}$；
13. p.36 改进分析的四块积木（离散化、系数拟合、单项式、乘法）。

需要的预备：

- Lec1 的风险、超额风险、$E_{\mathrm{app}}$；
- 一元微积分的 Taylor 公式（本节会写成多元）；
- ReLU $\sigma(t)=t\vee 0=\max\{t,0\}$；
- 多指标 $\alpha=(\alpha_1,\ldots,\alpha_d)$：$\|\alpha\|_1=\sum_i\alpha_i$，$\partial^\alpha=\partial_1^{\alpha_1}\cdots\partial_d^{\alpha_d}$，$h^\alpha=h_1^{\alpha_1}\cdots h_d^{\alpha_d}$，$\alpha!=\alpha_1!\cdots\alpha_d!$。

讲义排版里容易看错的地方：

- `H¨older` = Hölder；
- Hölder 定义里的 $|\partial^s f(x)-\partial^s f(x)|$ 是 OCR 事故，分母上的另一个点是 $y$；
- $c_{\mathbf{n},s}:=\partial^s h(\mathbf{n}/N)/s!$ 的 $h$ 就是目标函数 $f$；
- `ReLU-sine-2x` 的 `2x` 是指数激活 $2^x$，不是 $2x$；
- 网络类写成 $\mathrm{NN}_{(W,L,B)}(d,k)$ 或 $\mathrm{NN}(W,L,B)(d,k)$，同一件事。

---

## 0. 这一节在整门课里的位置

Lec1 已经写过（平方损失、$\bar f\in\arg\inf_{f\in\mathcal{F}}L(f)$）

$$
L(f_A)-L(f^*)
\;\le\;
E_{\mathrm{gen}}+E_{\mathrm{app}}+E_{\mathrm{opt}},
$$

其中

$$
E_{\mathrm{app}}=L(\bar f)-L(f^*).
$$

统计误差看 $\mathcal{F}$ 有多「肥」（覆盖数、Rademacher）；逼近误差看 $\mathcal{F}$ 有多「穷」——直线拟合抛物线，再多样本也救不了。

本节取 $\mathcal{F}$ 为 **ReLU 前馈网络**，目标 $f^*$ 放在 **Hölder 球** 里，给出构造性上界。构造的路线图（先看地图再进细节）：

$$
\begin{aligned}
&\text{Hölder }f
\;\xrightarrow{\text{单位分解 + 局部 Taylor}}\;
p=\sum_{\mathbf{n}}\sum_{\|\alpha\|_1\le r}c_{\mathbf{n},\alpha}\,p_{\mathbf{n},\alpha}\\
&\qquad \xrightarrow{\text{网络逼近每个 }p_{\mathbf{n},\alpha}}\;
\phi
\;\xrightarrow{\text{选 }N,D}\;
\|f-\phi\|_\infty\lesssim W^{-\zeta/d}.
\end{aligned}
$$

局部多项式里出现单项式，单项式来自乘法，乘法来自平方，平方来自锯齿。所以我们会花很多篇幅先逼近 $x^2$。

---

## 1. 逼近误差的定义，以及平方损失下的恒等式（p.29）

### 1.1 定义

设 $X\sim\mu_X$，$f^*$ 是回归的 Bayes 规则（平方损失下就是 $\mathbb{E}[Y\mid X]$）。函数类 $\mathcal{F}$ 的逼近误差写成

$$
E_{\mathrm{app}}
\;=\;
\inf_{f\in\mathcal{F}}\|f-f^*\|_{L^2(\mu_X)}^2
\;=\;
\inf_{f\in\mathcal{F}}\mathbb{E}_{X\sim\mu_X}\bigl[(f(X)-f^*(X))^2\bigr].
$$

讲义这里直接用 $L^2(\mu_X)$ 范数的平方，而不是 $L(\bar f)-L(f^*)$。下面证明：在平方损失下，这两件事是同一件事。

### 1.2 定理（平方损失 = $L^2$ 距离）

取 $\ell(a,y)=(a-y)^2$。讲义前后页并不一样：p.14 setup 写 $\ell(a,y)=\frac12(a-y)^2$；**当页 p.29** 把 $E_{\mathrm{app}}$ 写成 $\inf\|f-f^*\|_{L^2(\mu_X)}^2$，与 p.4 / p.15 非参数框架的 $\ell(f,Z)=(f(X)-Y)^2$ 一致。本节跟当页，不用 $\frac12$（差一个与 $\arg\min$ 无关的常数；若用 $\frac12$，恒等式右边多 $\frac12$，阶不变）。总体风险

$$
L(f)=\mathbb{E}\bigl[(f(X)-Y)^2\bigr].
$$

设 $f^*(x)=\mathbb{E}[Y\mid X=x]$。则对任意可测 $f$，

$$
L(f)-L(f^*)
\;=\;
\|f-f^*\|_{L^2(\mu_X)}^2.
$$

因此

$$
E_{\mathrm{app}}
\;=\;
\inf_{f\in\mathcal{F}}\bigl(L(f)-L(f^*)\bigr)
\;=\;
\inf_{f\in\mathcal{F}}\|f-f^*\|_{L^2(\mu_X)}^2.
$$

**证明。** 把 $f(X)-Y$ 拆成两段：

$$
f(X)-Y
\;=\;
\bigl(f(X)-f^*(X)\bigr)+\bigl(f^*(X)-Y\bigr).
$$

平方展开：

$$
\begin{aligned}
(f(X)-Y)^2
&=
(f-f^*)^2(X)
+
(f^*(X)-Y)^2
+
2(f(X)-f^*(X))(f^*(X)-Y).
\end{aligned}
$$

取期望。交叉项用全期望公式先对 $X$ 条件化：

$$
\begin{aligned}
&\mathbb{E}\bigl[(f(X)-f^*(X))(f^*(X)-Y)\bigr]\\
&=
\mathbb{E}\Bigl[
(f(X)-f^*(X))\,
\mathbb{E}\bigl[f^*(X)-Y\bigm|X\bigr]
\Bigr].
\end{aligned}
$$

而 $\mathbb{E}[Y\mid X]=f^*(X)$，所以 $\mathbb{E}[f^*(X)-Y\mid X]=0$。交叉项消失。于是

$$
L(f)
=
\mathbb{E}[(f-f^*)^2(X)]
+
\mathbb{E}[(f^*(X)-Y)^2]
=
\|f-f^*\|_{L^2(\mu_X)}^2
+
L(f^*).
$$

移项即得。证毕。

**几个立刻能用的推论。**

1. $L(f)\ge L(f^*)$，超额风险永远非负。  
2. 若我们造出一个网络 $\phi\in\mathcal{F}$ 满足 $\|f^*-\phi\|_\infty\le\varepsilon$，且 $\mathrm{supp}(\mu_X)\subseteq[0,1]^d$，则

$$
E_{\mathrm{app}}
\;\le\;
\|f^*-\phi\|_{L^2(\mu_X)}^2
\;\le\;
\varepsilon^2.
$$

   所以后面全部在 $\|\cdot\|_\infty$ 里干活，最后平方一下就回到风险。  
3. 若损失是 $\frac12(a-y)^2$，恒等式右边多一个 $\frac12$。阶（谁跟 $n$、$W$ 怎么走）完全不变。

**为什么不直接在 $L^2(\mu_X)$ 里逼近？** 可以。但 $\mu_X$ 未知，均匀范数给出对一切 $\mu_X$ 都成立的界，后面做 covering number 也更干净。代价是：界可能比「只在 $\mu_X$ 的支撑上逼近」略松。

---

## 2. 组合逼近很难：Hilbert 第 13 问题与 Kolmogorov–Arnold（p.29）

神经网络的本质是 **仿射变换与非线性的反复复合**。一个自然的问题是：复合到底有多强？这个问题比神经网络老得多。

### 2.1 Hilbert 第 13 问题（1900）

Hilbert 问：七次方程

$$
x^7+ax^3+bx^2+cx+1=0
$$

的根作为系数 $(a,b,c)$ 的函数 $x(a,b,c)$，**能不能写成只含两个变量的函数的复合**？

人话：三个自变量的「代数式」是否一定能拆成二元函数一层层嵌套？Hilbert 猜「不能」。这件事的连续函数版本，在 1950 年代被否定了。

### 2.2 Kolmogorov–Arnold 叠加定理（KAT, 1957）

**定理（Kolmogorov 1956 / Arnold 1957 / Kolmogorov 1957）。**  
对任意 $d\ge 2$、任意连续函数 $f\in C([0,1]^d)$，存在连续的一元函数 $\psi_{p,q}:\mathbb{R}\to\mathbb{R}$（**可以不依赖 $f$**）以及连续的一元函数 $\varphi_q^f:\mathbb{R}\to\mathbb{R}$（依赖 $f$），使得

$$
f(x_1,\ldots,x_d)
\;=\;
\sum_{q=1}^{2d+1}
\varphi_q^f
\Biggl(
\sum_{p=1}^d \psi_{p,q}(x_p)
\Biggr).
$$

人话：**任意多元连续函数都是「一元函数 + 加法」的有限次叠加。** 真正的「多变量连续函数」在复合意义下并不存在。

本节**不证明 KAT**（证明是构造性的，但内层 $\psi_{p,q}$ 非常不规则）。我们只要它的方向。

### 2.3 对神经网络万能逼近的启示

把 KAT 的图示画成网络：

- 第一层：每个坐标 $x_p$ 经过一元 $\psi_{p,q}$（像一组 1D 激活）；
- 然后按 $q$ 把 $d$ 个输出加起来（线性层）；
- 再经过一元 $\varphi_q^f$；
- 最后相加。

这正是 **2–3 层网络**。由此：

| 结果 | 说了什么 | 没说什么 |
|------|----------|----------|
| Cybenko 1989 | 单隐层 + 非多项式 sigmoid，在 $C(K)$ 上稠密（万能逼近） | 没有任何速率；隐层要多宽 |
| Kůrková 1992 | 用 KAT 把万能逼近写成 2/3 层网络 | 内层函数极不光滑，不能直接当 ReLU 用 |
| 本节后面 | ReLU 网络在 Hölder 球上的**定量**速率 | — |

**关键警告（一定要记住）：**  
KAT 的内层 $\psi_{p,q}$ 只有连续性，没有 Hölder / Lipschitz 控制。ReLU 网络的每一层都是 Lipschitz 的。所以

- KAT **不**蕴含「ReLU 网络可以打破维数灾难」；
- 对 **光滑函数类**，用 Lipschitz 积木去逼近，仍然会付出 $\varepsilon^{-d/\alpha}$ 这种维数代价（下节）；
- KAT 只解释「复合 + 叠加」在连续范畴里是万能的，不解释深度、宽度怎样换精度。

### 2.4 深度逼近的近代线索（讲义点名，不展开证明）

讲义列了一串名字，各自解决的是「定量、有深度」的问题：

- Telgarsky 2016：反复复合锯齿，深度网络能造出浅层网络用相近参数数造不出的高频振荡；
- Yarotsky 2017：Sobolev / Hölder 上 ReLU 网络的上、下界，size $\sim\varepsilon^{-d/\alpha}\log(1/\varepsilon)$；
- Petersen 2018/2019：不连续函数、分段光滑；
- Zhou 2019：CNN 的万能逼近；
- Yarotsky–Zhevnerchuk 2020：非常深的网络 + 不连续选权；
- Shen–Yang–Zhang 2019–2021：同时用宽度和深度刻画误差。

这些工作的共同背景：组合很强，但 **在 Hölder 球上仍受维数灾难约束**（除非换激活函数，见 3.3 的 sine–$2^x$ 网络）。

---

## 3. 维数灾难，以及讲义引用的三条定理（p.29）

### 3.1 经典图像：$C^\alpha([0,1]^d)$ 的维数灾难（CoD）

讲义 p.29 红字写：逼近 $f\in C^\alpha([0,1]^d)$ 到误差 $\varepsilon$，需要 NN 规模

$$
O\bigl(C_d\,(1/\varepsilon)^{d/\alpha}\log(1/\varepsilon)\bigr).
$$

这里的 $O$ 是**存在性上界**（有一张网能做到）。「Suffers CoD」说的是你**也必须付** $(1/\varepsilon)^{d/\alpha}$ 这一档——不能把「至少需要」和 $O$（至多）写在同一个等号里。下面用与 p.19 同一套**体积 / 覆盖 / packing** 把「为何是 $(1/\varepsilon)^{d/\alpha}$」写全。$C^\alpha$ 与 Hölder 球 $\mathcal{H}^\alpha$ 只差等价范数，指数相同。

#### 3.1.1 体积：局部尺度 $h\sim\varepsilon^{1/\alpha}$ 决定格子数

把 $[0,1]^d$ 切成边长 $h$ 的小立方体：每个体积 $h^d$，大立方体体积 $1$，故**这一次剖分**的格子数

$$
M
\;=\;
h^{-d}.
$$

这只是计数（$M\cdot h^d=1$），不是「任何方法都至少要 $h^{-d}$ 个参数」——体积不等式没有那个方向的下界。局部误差来自 $r=\lfloor\alpha\rfloor$ 阶 Taylor 余项 $\lesssim h^\alpha$（$\alpha\le 1$ 时就是振幅；$\alpha>1$ 时 $|f(x)-f(y)|$ 只有 $O(h)$，不能写成 $\le\|x-y\|_\infty^\alpha$）。要**这套格子方法**的一致误差 $\le\varepsilon$，取 $h\asymp\varepsilon^{1/\alpha}$，于是

$$
M
\;=\;
h^{-d}
\;\asymp\;
\varepsilon^{-d/\alpha}.
$$

$\alpha$ 越大，同样 $\varepsilon$ 允许的 $h$ 越大，格子越少。真正的「任何逼近都少不了 $(1/\varepsilon)^{d/\alpha}$ 自由度」见 3.1.3 的 packing，不要把上面的 $M\asymp$ 当成 minimax 下界。

#### 3.1.2 上界（讲义的 $O$）：局部 Taylor $\times$ 格子数

每个格子中心做 $r=\lfloor\alpha\rfloor$ 阶 Taylor，余项 $\le C_{d,\alpha}h^\alpha$（§6 会写成 $d^r N^{-\alpha}$，$N=1/h$）。取 $h\asymp\varepsilon^{1/\alpha}$ 则局部误差 $\le\varepsilon$。格子数 $M\asymp\varepsilon^{-d/\alpha}$。每个局部多项式有 $\binom{d+r}{d}=O_{d,\alpha}(1)$ 个系数，ReLU 实现乘法还要多一个 $\log(1/\varepsilon)$（§8–10 的锯齿 / 平方）。总规模

$$
S
\;=\;
O\bigl(C_d\,\varepsilon^{-d/\alpha}\log(1/\varepsilon)\bigr).
$$

这正是讲义写下的 $O$。后面 §5–12 把 $C^\alpha$ 换成 $\mathcal{H}^\zeta$、把 $S$ 换成宽度 $W$，得到 $\|f-\phi\|_\infty\lesssim W^{-\zeta/d}$，反解 $W\asymp\varepsilon^{-d/\zeta}$，同一指数。

#### 3.1.3 下界（为何「需要」$(1/\varepsilon)^{d/\alpha}$）：packing + 覆盖数

体积只说明「这套剖分有这么多格子」。要证明**任何**方法都少不了这些自由度，用 packing（与 p.19 的 $P(K,d,\varepsilon)$ 同一语言）。

取光滑 bump $\psi\in C_c^\infty(B_\infty(0,1/4))$，$\psi(0)>0$，$\|\psi\|_{C^\alpha}\le 1$。令 $h=\varepsilon^{1/\alpha}$。支撑半径 $h/4$：中心间距 $\ge h/2$ 则支撑不交。

**格子数的两边。** 下界用**网格构造**（不是体积）：按间距 $h$ 放点，可放

$$
M\;\ge\; c_d\,h^{-d}\;=\; c_d\,\varepsilon^{-d/\alpha}.
$$

上界才是体积：互不相交的 $\infty$-球给出 $M\cdot(h/2)^d\le(1+O(h))^d$，故 $M\lesssim h^{-d}$。体积**不能**反过来说 $M\ge$；下面只用网格的 $M\gtrsim\varepsilon^{-d/\alpha}$，不要写成更强的指数下界。

对每个中心定义缩放 bump

$$
\psi_j(x)
\;:=\;
h^\alpha\,\psi\bigl((x-x_j)/h\bigr).
$$

$k$ 阶导数带因子 $h^{\alpha-k}$：$\|\alpha\|_1=r=\lfloor\alpha\rfloor$ 时 Hölder-$s$ 半范把 $h^{s}$ 与 $\|(x-y)/h\|^s$ 消掉，故 $\|\psi_j\|_{C^\alpha}\le C\|\psi\|_{C^\alpha}$。支撑两两不交。对 $\xi\in\{0,1\}^M$ 令 $f_\xi=\sum_j\xi_j\psi_j$。不相交加上跨格子的差商 $\le (2h^s)/(c h)^s=O(1)$，故 $\|f_\xi\|_{C^\alpha}\le C'$。单位球里用 $f_\xi/C'$：若 $\xi\neq\xi'$，某个 $j$ 上 $\xi_j\neq\xi'_j$，在 $x_j$ 处间距

$$
\bigl\|f_\xi/C'-f_{\xi'}/C'\bigr\|_\infty
\;\ge\;
h^\alpha\psi(0)/C'
\;=\;
\varepsilon\cdot\psi(0)/C'.
$$

记 $\eta:=\varepsilon\cdot\psi(0)/C'$。一般 $\eta<\varepsilon$（$C'$ 可能大于 $\psi(0)$）。这是间距 $\eta$ 的 packing，基数 $2^M$。p.19：$N(K,d,\delta)\ge P(K,d,2\delta)$，取 $\delta=\eta/2$：

$$
\log N\bigl(\mathcal{H}^\alpha,\|\cdot\|_\infty,\eta/2\bigr)
\;\ge\;
\log P(\mathcal{H}^\alpha,\eta)
\;\ge\;
M\log 2
\;\gtrsim\;
\varepsilon^{-d/\alpha}.
$$

把哑变量 $\eta/2$ 换成 $\varepsilon$，仍是 $\log N(\mathcal{H}^\alpha,\|\cdot\|_\infty,\varepsilon)\gtrsim\varepsilon^{-d/\alpha}$（常数进 $\gtrsim$，指数不变）。**不要**用间距只有 $\eta$ 的 packing 去填 $P(\cdot,2\varepsilon)$，再写成 $N(\mathcal{H},\varepsilon)\ge 2^M$：若 $\psi(0)/C'<2$，$P(\mathcal{H},2\varepsilon)$ 可能远小于 $2^M$，那是过强的下界。

这是函数类的度量熵，与「有没有神经网络」无关。

现在把网络放进来。p.19：$S$ 个权、$\|\theta\|_\infty\le B$、参数到函数 Lipschitz 常数 $L$ 的 ReLU 网，函数 $\infty$-覆盖

$$
\log N(\text{网络类},\|\cdot\|_\infty,\varepsilon)
\;\le\;
S\log\bigl(1+2BL/\varepsilon\bigr).
$$

若每个 $f\in\mathcal{H}^\alpha$ 都能被某个网络 $\varepsilon$-逼近，则 $\mathcal{H}^\alpha$ 落在网络类的 $\varepsilon$-邻域里，于是 $N(\mathcal{H}^\alpha,\|\cdot\|_\infty,2\varepsilon)\le N(\text{网络类},\|\cdot\|_\infty,\varepsilon)$：

$$
S\log\bigl(1+2BL/\varepsilon\bigr)
\;\ge\;
\log N(\mathcal{H}^\alpha,\|\cdot\|_\infty,2\varepsilon)
\;\gtrsim\;
\varepsilon^{-d/\alpha}.
$$

讲义最后一条还允许 $B\le c S^{\log_2(d+r)+2}$（多项式），$L$ 至多 $S$ 的指数型但对数后仍是 $\mathrm{poly}(\log S,\log(1/\varepsilon))$。因此

$$
S
\;\gtrsim\;
\frac{\varepsilon^{-d/\alpha}}{\mathrm{polylog}(S,1/\varepsilon)},
$$

即规模必须是 $(1/\varepsilon)^{d/\alpha}$ 量级（对数下）。这就是 CoD：**指数在 $d/\alpha$ 上，不是在 $\log d$ 上。**

**人话。** 网格构造给出 $\varepsilon^{-d/\alpha}$ 个互不干涉的 bump（体积只禁止你装得更多）；packing 把它们变成覆盖数下界（尺度差常数，指数不变）；网络作为 $S$ 维参数族，覆盖数只有 $S\log(1/\varepsilon)$，所以 $S$ 必须跟上 $\varepsilon^{-d/\alpha}$。讲义的 $O(\cdots\log(1/\varepsilon))$ 是同一指数的上界（多一个实现乘法的对数）。

后面 6–12 节把上界走成可跟的构造：$\|f-\phi\|_\infty\lesssim W^{-\zeta/d}$，$W\sim\varepsilon^{-d/\zeta}$。

### 3.2 Jiao–Shen–Lin–Huang，Annals of Statistics 2023

文献：Yuling Jiao, Guohao Shen, Yuanyuan Lin, Jian Huang, *Deep nonparametric regression on approximate manifolds: Nonasymptotic error bounds with polynomial prefactors*, Ann. Statist. 51(2):691–716, 2023.

讲义把作者顺序写成 Jiao–Shen–Lin–Huang，同一篇。

**函数类。** $\mathcal{H}_\mu^\alpha([0,1]^d)$ 表示 Hölder 球：$\alpha=r+s$，$r=\lfloor\alpha\rfloor$，$s\in(0,1]$，$\|\partial^\beta f\|_\infty\le\mu$（$\|\beta\|_1\le r$），且 $r$ 阶导数是 Hölder-$s$、常数 $\mu$。讲义在 p.30 先把 $\mu=1$ 的单位球写成 $\mathcal{H}^\zeta$；带 $\mu$ 只是把所有界乘上 $\mu$。

**结论（讲义 p.29 的定量形式）。**  
$\forall f\in\mathcal{H}_\mu^\alpha([0,1]^d)$，存在 ReLU 网络 $f_\phi$，宽度、深度

$$
\begin{aligned}
W
&=
38\,(\lfloor\alpha\rfloor+1)^2\,d^{\lfloor\alpha\rfloor+1}\,N\lceil\log_2(8N)\rceil,\\
D
&=
21\,(\lfloor\alpha\rfloor+1)^2\,M\lceil\log_2(8M)\rceil,
\end{aligned}
$$

使得对 $p\in[1,\infty]$（讲义写 $L^p$）

$$
\|f-f_\phi\|_{L^p}
\;\le\;
18\mu\,(\lfloor\alpha\rfloor+1)^2\,
d^{\lfloor\alpha\rfloor+(\alpha\vee 1)/2}
\,(NM)^{-2\alpha/d}.
$$

**怎么读。**

- 误差里是 $(NM)^{-2\alpha/d}$：宽度资源 $N$ 和深度资源 $M$ **对称地** 进入，而且指数里有一个 $2$。这比本节 12 节「只用宽度、深度几乎固定」的 $W^{-\alpha/d}$ 更强，来自 p.36 那种「离散化 + 比特提取 / 点拟合」的改进构造。
- 前因子是 $d$ 的 **多项式**（$d^{\lfloor\alpha\rfloor+O(1)}$），不是 $2^d$ 或 $d^d$。这是该文相对 Yarotsky 2017 的要点之一，后面统计误差才不会被指数前因子吃掉。
- $W\sim N\log N$，$D\sim M\log M$，所以用宽度、深度来写，误差大约是 $(WD)^{-2\alpha/d}$（忽略对数）。

本节 5–12 节走的是「单位分解 + Taylor + 乘法网络」这条更初等的路，速率是 $W^{-\zeta/d}$；3.2 与 13 节才是「同时榨干宽和深」的改进。

### 3.3 Jiao–Lai–Lu–Wang–Yang，SIAM J. Math. Anal. 2023

文献：Yuling Jiao, Yanming Lai, Xiliang Lu, Fengru Wang, Zhijian Yang, *Deep neural networks with ReLU-sine-exponential activations break curse of dimensionality in approximation on Hölder class*, SIAM J. Math. Anal. 55(4), 2023.（arXiv:2103.00542）

**激活函数不是纯 ReLU**，而是 $\{\mathrm{ReLU},\;\sin,\;2^x\}$。

**结论（讲义 p.29）。**  
$\forall\varepsilon>0$，存在深度为 **6**、宽度为

$$
\max
\Biggl\{
2d\Biggl\lceil
\log_2\Biggl(\sqrt{d}\Bigl(\frac{3\mu}{\varepsilon}\Bigr)^{1/\alpha}\Biggr)
\Biggr\rceil,
\;
2\Biggl\lceil
\log_2\frac{3\mu\,d^{\alpha/2}}{2\varepsilon}
\Biggr\rceil
+2
\Biggr\}
$$

的 ReLU–sine–$2^x$ 网络，在 $L^p$（$p\in[1,\infty)$）意义下把 $f\in\mathcal{H}_\mu^\alpha([0,1]^d)$ 逼近到 $\varepsilon$。原文对 $\alpha\in(0,1]$ 陈述（Hölder 连续）；宽度对 $d$ 是线性、对 $1/\varepsilon$ 是对数。

**怎么读。**

- 深度锁死为 6，宽度 $\sim d\log(1/\varepsilon)$：这是在 **打破维数灾难**。原因是 $\sin$ 和 $2^x$ 能以指数效率做「编码 / 位提取」，表达力远强于 Lipschitz 的 ReLU。
- 这 **不能** 直接搬到纯 ReLU 网络，也不自动给出 SGD 可学性。讲义把它放在这里，是对照：CoD 是 ReLU + Hölder 的产物，不是「任何网络」的命运。
- 函数仍是广义可微的，形式上可以反传。这与 floor 激活的「超强但不可训」构造不同。

### 3.4 基于 Yarotsky 2017、Lu–Shen–Yang–Zhang 2021、Yang 2022 的「标准 CoD 速率」

讲义最后一条（纯 ReLU，权有界）：

**假设。** $f\in\mathcal{H}_\mu^\alpha([0,1]^d)$。

**结论。** 存在 ReLU 网络 $f_\theta$，规模 $S\asymp W$（神经元数与宽度同阶），深度

$$
D\;\ge\;\frac{\alpha}{d}+1,
$$

权重

$$
\|\theta\|_\infty
\;\le\;
c_{\alpha,d}\,S^{\log_2(d+r)+2}
$$

（$r=\lfloor\alpha\rfloor$），使得

$$
\|f-f_\theta\|_{L^\infty([0,1]^d)}
\;\le\;
C_{d,\alpha,\mu}\,S^{-\alpha/d}.
$$

**怎么读。**

- 速率 $S^{-\alpha/d}$ 正是 3.1 的 CoD 上界；深度只需略大于 $1+\alpha/d$。这与 12 节的选参 $D=1+\zeta/d$、$N=W^{1/d}$ **同一档**。
- 权的 $\infty$-范数可以随 $S$ 多项式增长。覆盖数估计里会出现 $\log B\sim \log S$，统计误差多一个对数，不改变主阶。
- Yarotsky 2017 原文对 Sobolev 球 $W^{n,\infty}$ 给出 size $O(\varepsilon^{-d/n}\log(1/\varepsilon))$、深度 $O(\log(1/\varepsilon))$；Lu–Shen–Yang–Zhang, *Deep network approximation for smooth functions*, SIMA 2021 进一步把误差同时写成宽度和深度的 $\mathcal{O}(N^{-2s/d}L^{-2s/d})$。讲义这条是「规模 $S$、深度下限 $\alpha/d+1$」的打包陈述。

**三条定理对照。**

| 结果 | 激活 | 误差（阶） | CoD？ |
|------|------|------------|------|
| 本节初等构造（§5–12） | ReLU | $W^{-\zeta/d}$（深 $\approx 1+\zeta/d$） | 有，指数 $d/\zeta$ |
| Jiao–Shen–Lin–Huang AoS 23 | ReLU | $(NM)^{-2\alpha/d}$ | 有，但前因子多项式、宽深都用上 |
| Jiao–Lai–Lu–Wang–Yang SIMA 23 | ReLU+$\sin$+$2^x$ | 深 6、宽 $\sim d\log(1/\varepsilon)$ | **打破** |
| Yarotsky / LSYZ 打包 | ReLU | $S^{-\alpha/d}$ | 有 |

下面从 Hölder 定义开始，把「初等构造」逐步写全。

---

## 4. Hölder 类 $\mathcal{H}^\zeta$ 的精确定义（p.30）

### 4.1 把光滑度拆成整数 + 小数

取 $\zeta>0$，唯一地写成

$$
\zeta=r+s,
\qquad
r\in\mathbb{N}_0=\{0,1,2,\ldots\},
\qquad
s\in(0,1].
$$

例子：$\zeta=0.7\Rightarrow r=0,s=0.7$（纯 Hölder）；$\zeta=1\Rightarrow r=0,s=1$（Lipschitz）；$\zeta=2.3\Rightarrow r=2,s=0.3$。

**注意：** 当 $\zeta$ 是整数时，讲义的 $\mathcal{H}^\zeta$ 是「$r=\zeta-1$ 阶导数 Lipschitz」，比「$C^\zeta$ 且 $\zeta$ 阶导数有界」略弱。这是 Hölder 空间的标准惯例。

### 4.2 定义（单位球）

多重指标 $\alpha\in\mathbb{N}_0^d$，$\|\alpha\|_1=\sum_i\alpha_i$。讲义在这一页用字母 $s$ 既当小数光滑度、又当多重指标，阅读时极容易混。**笔记里：小数光滑度叫 $s$，多重指标叫 $\alpha$。** 讲义的 $p_{\mathbf{n},s}$、$c_{\mathbf{n},s}$ 仍保留原符号，那时的 $s$ 是多重指标。

$$
\mathcal{H}^\zeta(\mathbb{R}^d)
\;:=\;
\Biggl\{
f:\mathbb{R}^d\to\mathbb{R}:
\;
\max_{\|\alpha\|_1\le r}\|\partial^\alpha f\|_\infty\le 1,
\;
\max_{\|\alpha\|_1=r}
\sup_{x\neq y}
\frac{|\partial^\alpha f(x)-\partial^\alpha f(y)|}{\|x-y\|_\infty^{s}}
\le 1
\Biggr\}.
$$

限制到立方体：

$$
\mathcal{H}^\zeta
\;:=\;
\bigl\{f:[0,1]^d\to\mathbb{R}:\;f\text{ 是 }\mathcal{H}^\zeta(\mathbb{R}^d)\text{ 中某函数的限制}\bigr\}.
$$

带半径 $\mu$ 的球 $\mathcal{H}_\mu^\zeta$ 就是把两个 $\le 1$ 改成 $\le\mu$。线性缩放：$f\in\mathcal{H}_\mu^\zeta\Leftrightarrow f/\mu\in\mathcal{H}^\zeta$（$\mu>0$）。

Hölder 商里用的是 $\|\cdot\|_\infty$ 而不是 $\|\cdot\|_2$。因为所有范数在 $\mathbb{R}^d$ 等价：

$$
\|z\|_\infty\le\|z\|_2\le\sqrt{d}\,\|z\|_\infty,
$$

换成 $\|\cdot\|_2$ 只改常数（$d^{s/2}$ 这一档），不改 $N^{-\zeta}$ 的指数。讲义 p.36 改进分析里余项写成 $d^{s}\|x-x_0\|_2^{\beta}$，用的就是 2-范数。

### 4.3 小白对照表

| $\zeta$ | 成员的直觉 | 局部 Taylor 用到几阶 |
|-----------|------------|----------------------|
| $(0,1]$ | $|f(x)-f(y)|\le\|x-y\|_\infty^\zeta$ | 0 阶：常数 $f(x_0)$ |
| $(1,2]$ | $\nabla f$ 有界且 Hölder | 1 阶：线性 |
| $(r,r+1]$ | $r$ 阶导数有界且 Hölder | $r$ 阶多项式 |

$\|\partial^\alpha f\|_\infty\le 1$ 对 $\|\alpha\|_1\le r$ 全部成立，所以 Taylor 系数

$$
c_{\alpha}(x_0)=\frac{\partial^\alpha f(x_0)}{\alpha!}
$$

满足 $|c_{\alpha}|\le 1$（因为 $\alpha!\ge 1$）。后面线性组合网络时会用到。

---

## 5. 帽子函数与单位分解（p.30）

目标：把 $[0,1]^d$ 盖住，每个点附近只有「几个」局部函数在干活，并且它们加起来恒等于 1。这样

$$
f(x)=\sum_{\mathbf{n}}\psi_{\mathbf{n}}(x)\,f(x),
$$

右边每一项可以换成该点的 Taylor 多项式。

### 5.1 一维帽子 $\psi$

ReLU $\sigma(t)=t\vee 0$。定义

$$
\psi(t)
\;=\;
\sigma\bigl(1-|t|\bigr)
\;=\;
\sigma\bigl(1-\sigma(t)-\sigma(-t)\bigr)
\;\in\;[0,1],
\qquad t\in\mathbb{R}.
$$

分段看：

$$
\psi(t)=
\begin{cases}
1-|t|, & |t|<1,\\
0, & |t|\ge 1.
\end{cases}
$$

这是底边 $[-1,1]$、顶点 $(0,1)$ 的帽子。它本身就是一个很小的 ReLU 网络：

- 第一层两个神经元：$\sigma(t)$、$\sigma(-t)$，权 $\pm 1$；
- 第二层：$\sigma(1-u-v)$，权 $1$。

所以 $\psi\in\mathrm{NN}_{(2,2,1)}(1,1)$（宽 2、深 2、权界 1）。

### 5.2 网格上的 $d$ 维帽子

取分辨率 $N\in\mathbb{N}$。对格子点

$$
\mathbf{n}=(n_1,\ldots,n_d)^\top\in\{0,1,\ldots,N\}^d,
$$

定义

$$
\psi_{\mathbf{n}}(x)
\;:=\;
\prod_{i=1}^d \psi(Nx_i-n_i),
\qquad
x\in\mathbb{R}^d.
$$

**支撑。** $\psi(Nx_i-n_i)\neq 0$ 当且仅当 $|Nx_i-n_i|<1$，即 $|x_i-n_i/N|<1/N$。因此

$$
\mathrm{supp}(\psi_{\mathbf{n}})
\;\subseteq\;
\bigl\{x:\|x-\mathbf{n}/N\|_\infty<1/N\bigr\}.
$$

相邻帽子重叠，但重叠的 $\mathbf{n}$ 不多：对固定的 $x\in[0,1]^d$，每个坐标 $i$ 至多两个整数 $n_i$ 满足 $|Nx_i-n_i|<1$（即 $\lfloor Nx_i\rfloor$ 与 $\lceil Nx_i\rceil$）。故

$$
\mathrm{card}\bigl\{\mathbf{n}:\psi_{\mathbf{n}}(x)\neq 0\bigr\}
\;\le\;
2^d.
$$

后面 $2^d$ 全部来自这里。

### 5.3 定理（单位分解）

$$
\sum_{\mathbf{n}\in\{0,1,\ldots,N\}^d}
\psi_{\mathbf{n}}(x)
\;=\;
\prod_{i=1}^d
\Biggl(
\sum_{n_i=0}^N \psi(Nx_i-n_i)
\Biggr)
\;\equiv\;
1,
\qquad
x\in[0,1]^d.
$$

**证明。** 第一等号是 Fubini（有限和与有限积）：

$$
\sum_{\mathbf{n}}\prod_{i=1}^d\psi(Nx_i-n_i)
=
\prod_{i=1}^d\Biggl(\sum_{n_i=0}^N\psi(Nx_i-n_i)\Biggr).
$$

于是只需证明 **一维** 命题：对任意 $t\in[0,1]$，

$$
\sum_{n=0}^N\psi(Nt-n)\;=\;1.
$$

令 $u=Nt\in[0,N]$，$k=\lfloor u\rfloor\in\{0,1,\ldots,N\}$，$\delta=u-k\in[0,1)$。帽子 $\psi(u-n)$ 只在 $|u-n|<1$ 时非零。

- 若 $\delta=0$（$u$ 是整数，含端点 $0$ 与 $N$）：只有 $n=u$ 这一项，$\psi(0)=1$。其余为 0。和为 1。
- 若 $\delta\in(0,1)$：可能非零的是 $n=k$ 与 $n=k+1$（且 $k+1\le N$，因为 $u<N$ 或 $u=N$ 已归入上款）。

$$
\psi(u-k)=\psi(\delta)=1-\delta,
\qquad
\psi(u-(k+1))=\psi(\delta-1)=1-(1-\delta)=\delta.
$$

和为 $(1-\delta)+\delta=1$。

对每个坐标这样做，再相乘，得到 $d$ 维和恒为 1。证毕。

**推论。** 对任意 $x\in[0,1]^d$，

$$
f(x)
\;=\;
\sum_{\mathbf{n}}\psi_{\mathbf{n}}(x)\,f(x).
$$

这是下一节把 $f$ 换成局部 Taylor 的起点。

---

## 6. 局部 Taylor 与积分余项（p.30–31）

### 6.1 局部多项式 $p$

对 $\mathbf{n}\in\{0,1,\ldots,N\}^d$ 与多重指标 $\alpha$（讲义符号 $s$），令

$$
p_{\mathbf{n},\alpha}(x)
\;:=\;
\psi_{\mathbf{n}}(x)\,
\Bigl(x-\frac{\mathbf{n}}{N}\Bigr)^\alpha,
\qquad
c_{\mathbf{n},\alpha}
\;:=\;
\frac{\partial^\alpha f(\mathbf{n}/N)}{\alpha!}.
$$

$p_{\mathbf{n},\alpha}$ 与 $\psi_{\mathbf{n}}$ 同支撑。拼起来

$$
p(x)
\;=\;
\sum_{\mathbf{n}\in\{0,1,\ldots,N\}^d}
\sum_{\|\alpha\|_1\le r}
c_{\mathbf{n},\alpha}\,p_{\mathbf{n},\alpha}(x).
$$

点点来看，这就是

$$
p(x)
=
\sum_{\mathbf{n}}
\psi_{\mathbf{n}}(x)\,
T_{\mathbf{n}}(x),
\qquad
T_{\mathbf{n}}(x)
=
\sum_{\|\alpha\|_1\le r}
\frac{\partial^\alpha f(\mathbf{n}/N)}{\alpha!}
\Bigl(x-\frac{\mathbf{n}}{N}\Bigr)^\alpha,
$$

即：**在每个格子中心 $\mathbf{n}/N$ 处把 $f$ 展开到 $r$ 阶，再用帽子做凸组合。** 因为 $\sum\psi_{\mathbf{n}}=1$ 且 $\psi_{\mathbf{n}}\ge 0$，$p(x)$ 是若干个局部 Taylor 多项式的凸组合。

### 6.2 一元热身：积分余项

设 $g\in C^r([0,1])$，$g^{(r)}$ 是 Hölder-$s$、常数 $\le 1$。一元 Taylor 带积分余项：

$$
g(1)
=
\sum_{k=0}^{r-1}\frac{g^{(k)}(0)}{k!}
+
\int_0^1\frac{(1-t)^{r-1}}{(r-1)!}g^{(r)}(t)\,dt
$$

（$r=0$ 时没有积分，下面单独说）。把 $r$ 阶项也写在 $t=0$ 处：

$$
\frac{g^{(r)}(0)}{r!}
=
g^{(r)}(0)\int_0^1\frac{(1-t)^{r-1}}{(r-1)!}\,dt,
$$

因为 $\int_0^1(1-t)^{r-1}dt=1/r$，再除以 $(r-1)!$ 得 $1/r!$。于是

$$
g(1)-\sum_{k=0}^{r}\frac{g^{(k)}(0)}{k!}
=
\int_0^1\frac{(1-t)^{r-1}}{(r-1)!}\bigl(g^{(r)}(t)-g^{(r)}(0)\bigr)\,dt.
$$

若 $|g^{(r)}(t)-g^{(r)}(0)|\le t^{s}\le 1$，右边绝对值 $\le 1/r!$。多元把这条沿线段做一遍。

### 6.3 多元 Taylor 余项（讲义用的 $d^r\|h\|_\infty^\zeta$）

**引理（Hölder 函数的 Taylor 余项）。**  
设 $f\in\mathcal{H}^\zeta$，$x_0,x\in[0,1]^d$，$h=x-x_0$。记

$$
T_r(x;x_0)
\;=\;
\sum_{\|\alpha\|_1\le r}
\frac{\partial^\alpha f(x_0)}{\alpha!}\,h^\alpha.
$$

则

$$
\bigl|f(x)-T_r(x;x_0)\bigr|
\;\le\;
d^r\,\|h\|_\infty^{\zeta}.
$$

**证明。** $r=0$ 时 $T_0=f(x_0)$，Hölder 条件直接给出 $|f(x)-f(x_0)|\le\|h\|_\infty^{s}=\|h\|_\infty^{\zeta}$，且 $d^0=1$。以下设 $r\ge 1$。

令 $g(t)=f(x_0+th)$，$t\in[0,1]$。一元链式法则（反复用）给出

$$
g^{(k)}(t)
=
\sum_{\|\alpha\|_1=k}
\partial^\alpha f(x_0+th)\,\frac{k!}{\alpha!}\,h^\alpha
=
(h\cdot\nabla)^k f(x_0+th).
$$

对 $g$ 用 6.2 的积分余项：

$$
\begin{aligned}
f(x)-T_r(x;x_0)
&=
\int_0^1\frac{(1-t)^{r-1}}{(r-1)!}
\bigl(g^{(r)}(t)-g^{(r)}(0)\bigr)\,dt\\
&=
\int_0^1\frac{(1-t)^{r-1}}{(r-1)!}
\sum_{\|\alpha\|_1=r}
\bigl(\partial^\alpha f(x_0+th)-\partial^\alpha f(x_0)\bigr)
\frac{r!}{\alpha!}\,h^\alpha
\,dt.
\end{aligned}
$$

Hölder 条件（$\|\alpha\|_1=r$）：

$$
\bigl|\partial^\alpha f(x_0+th)-\partial^\alpha f(x_0)\bigr)
\;\le\;
\|th\|_\infty^{s}
\;\le\;
\|h\|_\infty^{s}.
$$

又 $|h^\alpha|=\prod_i|h_i|^{\alpha_i}\le\|h\|_\infty^{r}$。于是每一项

$$
\biggl|
\bigl(\partial^\alpha f(x_0+th)-\partial^\alpha f(x_0)\bigr)
\frac{r!}{\alpha!}\,h^\alpha
\biggr|
\;\le\;
\frac{r!}{\alpha!}\,\|h\|_\infty^{\zeta}.
$$

对 $\|\alpha\|_1=r$ 求和。用「$r$ 次求导、每次选一个坐标」来数：这种有序选法有 $d^r$ 种，每种对应某个 $\alpha$，且 $\alpha$ 被数了 $\alpha!$ 次，因此

$$
\sum_{\|\alpha\|_1=r}\frac{r!}{\alpha!}
\;=\;
d^r.
$$

（等价写法：$\sum_{\|\alpha\|_1=r}h^\alpha/\alpha!=(1/r!)(\sum_i h_i)^r$，令 $h_i=1$。）所以

$$
\bigl|g^{(r)}(t)-g^{(r)}(0)\bigr|
\;\le\;
d^r\|h\|_\infty^{\zeta}.
$$

再乘积分 $\int_0^1(1-t)^{r-1}/(r-1)!\,dt=1/r!$：

$$
\bigl|f(x)-T_r(x;x_0)\bigr)
\;\le\;
\frac{1}{r!}\,d^r\|h\|_\infty^{\zeta}
\;\le\;
d^r\|h\|_\infty^{\zeta},
$$

最后一步 $1/r!\le 1$，与讲义的粗界一致。证毕。

**更紧但讲义没用的形式：** 保留 $1/r!$，或用 $\|h\|_2$ 写成 $C_{d,r}\|h\|_2^{\zeta}$。阶都是 $\|h\|^{\zeta}$。

### 6.4 从局部余项到 $|f-p|\le 2^d d^r N^{-\zeta}$

**定理。** 对任意 $x\in[0,1]^d$、$f\in\mathcal{H}^\zeta$，

$$
|f(x)-p(x)|
\;\le\;
2^d d^r N^{-\zeta}.
$$

**证明（把讲义 p.31 的每一步补全）。**  
因为 $\sum_{\mathbf{n}}\psi_{\mathbf{n}}(x)=1$，

$$
\begin{aligned}
f(x)-p(x)
&=
\sum_{\mathbf{n}}\psi_{\mathbf{n}}(x)f(x)
-
\sum_{\mathbf{n}}\psi_{\mathbf{n}}(x)\,T_{\mathbf{n}}(x)\\
&=
\sum_{\mathbf{n}}\psi_{\mathbf{n}}(x)\bigl(f(x)-T_{\mathbf{n}}(x)\bigr).
\end{aligned}
$$

$\psi_{\mathbf{n}}\ge 0$，故

$$
|f(x)-p(x)|
\;\le\;
\sum_{\mathbf{n}}\psi_{\mathbf{n}}(x)\,\bigl|f(x)-T_{\mathbf{n}}(x)\bigr|.
$$

$\psi_{\mathbf{n}}(x)=0$ 除非 $\|x-\mathbf{n}/N\|_\infty<1/N$，所以求和只需跑这些 $\mathbf{n}$。对每个这样的 $\mathbf{n}$，6.3 给出

$$
\bigl|f(x)-T_{\mathbf{n}}(x)\bigr|
\;\le\;
d^r\Bigl\|x-\frac{\mathbf{n}}{N}\Bigr\|_\infty^{\zeta}
\;\le\;
d^r N^{-\zeta}.
$$

讲义接下来把 $\psi_{\mathbf{n}}$ 丢掉、改成「支撑上的项数 $\times$ 每项上界」：

$$
|f-p|
\;\le\;
\sum_{\mathbf{n}:\|x-\mathbf{n}/N\|_\infty<1/N}
d^r N^{-\zeta}
\;\le\;
2^d d^r N^{-\zeta},
$$

因为重叠数 $\le 2^d$。证毕。

**更紧的写法（建议记住）。** $\sum\psi_{\mathbf{n}}=1$，所以其实

$$
|f-p|
\;\le\;
\max_{\mathbf{n}:\psi_{\mathbf{n}}(x)>0}\bigl|f-T_{\mathbf{n}}\bigr|
\;\le\;
d^r N^{-\zeta},
$$

$2^d$ 可以省掉。后面所有地方出现 $2^d d^r N^{-\zeta}$ 时，你都可以在心里换成 $d^r N^{-\zeta}$；讲义保留 $2^d$ 不影响对 $N$ 的阶。

### 6.5 还剩什么？

$p$ 不是网络：它含有

- 帽子 $\psi_{\mathbf{n}}$（已经是小网络，但含乘法 $\prod_{i=1}^d$）；
- 单项式 $(x-\mathbf{n}/N)^\alpha$；
- 再与帽子相乘。

ReLU 网络对 $x$ 是分段线性的，不能精确做乘法。策略（p.31 底部）：

1. 逼近平方 $x^2$；  
2. 用极化恒等式造乘法 $xy$；  
3. 二叉树复合造 $d$ 元乘积；  
4. 从而逼近每个 $p_{\mathbf{n},\alpha}$，再线性组合。

在此之前，先把「网络可以怎样拼装」写成 Lemma 1。

---

## 7. Lemma 1：网络的四则运算（p.32）

### 7.1 记号

$\mathrm{NN}_{(W,L,B)}(d,k)$ 表示满足下列条件的 ReLU 前馈网络全体（输入维 $d$，输出维 $k$）：

- 隐层宽度不超过 $W$；
- 深度（仿射层数 / 与讲义的 $L$ 一致）不超过 $L$；
- 所有权、偏置的绝对值 $\le B$，即 $\|\theta\|_\infty\le B$。

一层的写法：$z\mapsto \sigma(Az+b)$，最后一层通常不再套 $\sigma$（仿射输出）。覆盖数那一页（p.19）把网络写成

$$
f_\theta^D(x)
=
(W_D\sigma(\cdot)+b_D)\circ\cdots\circ(W_2\sigma(\cdot)+b_2)\circ(W_1 x+b_1).
$$

本节的 $L$ 就是这里的层数。常数因子（深 $L$ 还是 $L+1$）全部被后面的 $C_d$ 吃掉。

### 7.2 陈述

设 $\phi_1\in\mathrm{NN}_{(W_1,L_1,B_1)}(d_1,k_1)$，$\phi_2\in\mathrm{NN}_{(W_2,L_2,B_2)}(d_2,k_2)$。

**(1) 包含。** 若 $d_1=d_2$，$k_1=k_2$，$W_1\le W_2$，$L_1\le L_2$，$B_1\le B_2$，则

$$
\mathrm{NN}_{(W_1,L_1,B_1)}(d_1,k_1)
\;\subseteq\;
\mathrm{NN}_{(W_2,L_2,B_2)}(d_2,k_2).
$$

**(2) 复合。** 若 $k_1=d_2$，则

$$
\phi_2\circ\phi_1
\;\in\;
\mathrm{NN}_{(\max\{W_1,W_2\},\,L_1+L_2,\,\max\{W_1,W_2\}B_1 B_2)}(d_1,k_2).
$$

进一步，若 $A\in\mathbb{R}^{d_2\times d_1}$、$b\in\mathbb{R}^{d_2}$，$\|(A,b)\|_\infty\le B_3$，则 $\phi(x):=\phi_2(Ax+b)$ 满足

$$
\phi\in\mathrm{NN}_{(W_2,L_2,W_2 B_2 B_3)}(d_1,k_2).
$$

**(3) 拼接（concatenation）。** 若 $d_1=d_2$，令 $\phi(x)=(\phi_1(x),\phi_2(x))$，则

$$
\phi\in\mathrm{NN}_{(W_1+W_2,\,\max\{L_1,L_2\},\,\max\{B_1,B_2\})}(d_1,k_1+k_2).
$$

**(4) 线性组合。** 若 $d_1=d_2$ 且 $k_1=k_2$，则对任意 $c_1,c_2\in\mathbb{R}$，

$$
c_1\phi_1+c_2\phi_2
\;\in\;
\mathrm{NN}_{(W_1+W_2,\,\max\{L_1,L_2\},\,|c_1|B_1+|c_2|B_2)}(d_1,k_1).
$$

（讲义 (4) 把 $\mathrm{NN}$ 写成了 $\mathrm{N}$，印刷漏字。）

### 7.3 证明（短，但把坑说清楚）

**(1) 包含。**  

- 加宽：增加权全为 0 的死神经元，输出不变。  
- 加大 $B$：额度用不满即可。  
- 加深：ReLU 不是恒等。标准办法是插入

$$
z=\sigma(z)-\sigma(-z)
$$

把一条通道拆成正负两条再减回来。宽度至多翻倍。讲义的包含关系按「宽度差一个绝对常数因子」来理解；后面所有宽度本来就带着 $3$、$2^d$、$d^r$ 这种倍数，阶不受影响。另一种实现：若允许 skip / 恒等激活，加深是免费的。

**(2) 复合。** 把 $\phi_1$ 的层栈在 $\phi_2$ 前面。宽度取 $\max$（两段各自不超过自己的宽度），深度相加。

权界为什么是 $\max\{W_1,W_2\}B_1 B_2$，而不是 $\max\{B_1,B_2\}$？若只是把层首尾相接、不融合，$\|\theta\|_\infty$ 的确是 $\max\{B_1,B_2\}$。但若把 $\phi_1$ 的最后一层仿射 $A^{(1)}$ 与 $\phi_2$ 的第一层仿射 $A^{(2)}$ **融成一层** $A^{(2)}A^{(1)}$，矩阵元素是内积：

$$
\bigl|(A^{(2)}A^{(1)})_{ij}\bigr|
\;\le\;
(\text{中间维})\,B_2 B_1
\;\le\;
\max\{W_1,W_2\}B_1 B_2.
$$

讲义用这个融合后的权界，后面估计 $\|\theta\|_\infty$ 时站在安全的一边。第二句 $\phi_2(Ax+b)$ 同理：先做 $A$，再与 $\phi_2$ 的第一层融合，多一个因子 $W_2 B_3$。

**(3) 拼接。** 两个网络并排放，共享输入。宽度相加，深度取 $\max$（浅的那边用 (1) 垫到同样深度），权界取 $\max$。

**(4) 线性组合。** 先拼接得到 $(\phi_1,\phi_2)$，再在输出做仿射 $(u,v)\mapsto c_1 u+c_2 v$。把 $c_i$ 乘进各自最后一层：该层权的绝对值变成 $|c_i|$ 倍，再相加，权界 $|c_1|B_1+|c_2|B_2$。宽度仍是 $W_1+W_2$。

多次相加：$\sum_{j=1}^m c_j\phi_j$ 的宽度 $\le\sum W_j$，权界 $\le\sum |c_j|B_j$，深度 $\max L_j$。后面 $\sum_{\mathbf{n},\alpha}c_{\mathbf{n},\alpha}\phi_{\mathbf{n},\alpha}$ 就用这一条。

---

## 8. 逼近 $x^2$：锯齿 $T_i$ 与插值 $I_k$（p.32–33）

ReLU 网络是分段线性的，$x^2$ 是弯曲的。最老实的办法：在均匀格子上对 $x^2$ **做分段线性插值**。误差由二阶导数控制，格子越细误差按（段长）$^2$ 降——这已经是「用线性积木逼近二次」能达到的正确阶。

### 8.1 Lemma 2（插值误差）

设 $I_k:[0,1]\to\mathbb{R}$ 满足

- 在节点 $j/2^k$（$j=0,1,\ldots,2^k$）上，$I_k(j/2^k)=(j/2^k)^2$；
- 在每个小区间 $[(j-1)/2^k,\,j/2^k]$ 上 $I_k$ 是线性的。

则

$$
\bigl|x^2-I_k(x)\bigr|
\;\le\;
2^{-2(k+1)}
\;=\;
\frac1{4^{k+1}},
\qquad
x\in[0,1].
$$

**证明。** 任取一格 $[a,b]$，$a=(j-1)/2^k$，$b=j/2^k$，$b-a=2^{-k}$。$x^2$ 在两端的线性插值是

$$
I(x)
=
a^2+\frac{b^2-a^2}{b-a}(x-a)
=
(a+b)x-ab.
$$

因此 **精确地**

$$
x^2-I(x)
=
x^2-(a+b)x+ab
=
(x-a)(x-b).
$$

在 $[a,b]$ 上 $x-a\ge 0$、$x-b\le 0$，故 $x^2-I(x)\le 0$（凸函数躺在弦的下方），

$$
\bigl|x^2-I(x)\bigr|
=
(x-a)(b-x).
$$

一元二次 $(x-a)(b-x)$ 的最大值在中点 $x=(a+b)/2$，值为

$$
\Bigl(\frac{b-a}{2}\Bigr)^2
=
\bigl(2^{-k-1}\bigr)^2
=
2^{-2(k+1)}.
$$

每格都如此，故 $\|x^2-I_k\|_\infty\le 2^{-2(k+1)}$。等号在每个中点达到。证毕。

### 8.2 锯齿 $T_1$ 与迭代 $T_i$

定义帐篷（tent / 锯齿）

$$
T_1(x)
=
\begin{cases}
2x, & x\in[0,1/2],\\
2(1-x), & x\in[1/2,1].
\end{cases}
$$

等价地，$T_1(x)=1-|2x-1|$（在 $[0,1]$ 上）。它是一颗齿：$0\to 1\to 0$。

迭代

$$
T_i
\;=\;
T_1\circ T_{i-1}
\;=\;
\underbrace{T_1\circ\cdots\circ T_1}_{i\text{ 次}}.
$$

**$T_i$ 有 $2^{i-1}$ 颗齿。** $T_1$ 一颗；每次再套 $T_1$，每颗齿被「对折」成两颗，齿数翻倍。$T_i$ 的零点正好是 $j/2^{i-1}$，峰值 $1$ 在半整数 $(2j+1)/2^{i}$。

### 8.3 恒等式：$I_{k-1}-I_k=T_k/4^k$，从而 $I_k(x)=x-\sum_{i=1}^k 4^{-i}T_i(x)$

令 $I_0(x)=x$（这是 $x^2$ 在 $\{0,1\}$ 上的线性插值，因为 $0^2=0$、$1^2=1$）。

**引理。** 在 $[0,1]$ 上，对每个 $k\ge 1$，

$$
I_{k-1}(x)-I_k(x)
\;=\;
\frac{T_k(x)}{4^k}.
$$

因而

$$
I_k(x)
\;=\;
x-\sum_{i=1}^k 4^{-i}T_i(x).
$$

**证明。** 两个函数都连续、都是以 $\{j/2^{k}\}$ 为断点的分段线性函数。只需验证它们在所有 $k$-级二进点上取值相同，则恒等。

先看 $I_{k-1}-I_k$ 在 $k$-级二进点上的值。记 $a=j/2^{k-1}$、$b=(j+1)/2^{k-1}$，中点 $m=(2j+1)/2^k$。

- 端点：$I_{k-1}$ 与 $I_k$ 都插值 $x^2$，故 $I_{k-1}(a)-I_k(a)=0$，同理 $b$ 处为 0。这些端点正好是 $T_k$ 的零点，右边也为 0。
- 中点：$I_k(m)=m^2$（$m$ 是 $I_k$ 的节点）。$I_{k-1}$ 在 $[a,b]$ 上是连接 $a^2$ 与 $b^2$ 的直线，故

$$
I_{k-1}(m)
=
\frac{a^2+b^2}{2}.
$$

差为

$$
\frac{a^2+b^2}{2}-\Bigl(\frac{a+b}{2}\Bigr)^2
=
\frac{(a-b)^2}{4}
=
\frac{(2^{-(k-1)})^2}{4}
=
2^{-2k}
=
4^{-k}.
$$

而 $T_k(m)=1$（一颗齿的顶点），所以 $T_k(m)/4^k=4^{-k}$。两边在中点也相等。

分段线性 + 节点值相同 $\Rightarrow$ 两函数恒等。

对 $k$ 求和：

$$
I_0-I_k
=
\sum_{i=1}^k(I_{i-1}-I_i)
=
\sum_{i=1}^k 4^{-i}T_i,
$$

即 $I_k=x-\sum_{i=1}^k 4^{-i}T_i$。证毕。

**无穷级数（直觉）。** $k\to\infty$ 时 $I_k\to x^2$ 一致，于是有经典展开

$$
x-x^2
\;=\;
\sum_{i=1}^\infty 4^{-i}T_i(x),
\qquad
x\in[0,1].
$$

讲义 p.33 的图按 Telgarsky 2015 画的是 $F(x)=x-x^2$ 的分段线性插值，与逼近 $x^2$ 是同一件事（差一个已知的恒等函数 $x$）。图中每一步，误差曲线都是「更密、更矮」的一排小帐篷，高度按 $1/4$ 缩小——这正是 $T_k/4^k$。

### 8.4 $T_1$ 的 ReLU 实现，以及 $T_i$、$I_k$ 的规模

在 $[0,1]$ 上

$$
T_1(x)
=
1-\sigma(2x-1)-\sigma(1-2x).
$$

第一层宽 2（算 $2x-1$ 与 $1-2x$ 再 ReLU），第二层仿射输出。权的绝对值 $\le 2$。故

$$
T_1\in\mathrm{NN}_{(2,2,2)}(1,1).
$$

（也常写成 $T_1(x)=2\sigma(x)-4\sigma(x-1/2)$，权出现 4；用绝对值实现可把权界压到 2，与讲义 $2^{2i-1}|_{i=1}=2$ 一致。）

**深度复合版 $T_i$。** $T_i=T_1^{\circ i}$。反复用 Lemma 1(2)：宽仍为 2，深 $2i$，权界

$$
B_i
=
2\cdot 2\cdot B_{i-1}
=
4 B_{i-1},
\qquad
B_1=2
\;\Rightarrow\;
B_i=2^{2i-1}.
$$

故 $T_i\in\mathrm{NN}_{(2,\,2i,\,2^{2i-1})}(1,1)$。

**浅而宽版 $T_i$。** $T_i$ 是有 $2^i$ 段的分段线性函数，单隐层宽 $O(2^i)$ 即可实现。讲义写 $T_i\in\mathrm{NN}_{(2^i,\,2,\,2^{2i-1})}$。

**深度版 $I_k$。** 用 skip 把 $x$ 一直带着，依次算 $T_1,T_2=T_1(T_1),\ldots,T_k$，再做线性组合 $x-\sum 4^{-i}T_i$。深度 $2k$（$k$ 次 $T_1$），宽度 $2k+1$（通道：恒等、当前锯齿、累加器，再留一点余量），权界 2（系数 $4^{-i}\le 1$，锯齿的权若按层融合会变大，讲义取了规范化后的界 2）。故

$$
I_k\in\mathrm{NN}_{(2k+1,\,2k,\,2)}(1,1).
$$

**浅而宽版 $I_k$。** $I_k$ 有 $2^k$ 段，宽 $2^{k+1}$、深 3、权界 2：

$$
I_k\in\mathrm{NN}_{(2^{k+1},\,3,\,2)}(1,1).
$$

### 8.5 用宽、深重写误差

取 $W=2^{k+1}$、$L=2k$。则 $2^{-2(k+1)}=W^{-2}$，且 $2^{-2(k+1)}\le 2^{-L}=2^{-2k}$。因此在 $[0,1]$ 上

$$
\bigl|x^2-I_k(x)\bigr|
\;\le\;
\min\{W^{-2},\,2^{-L}\}.
$$

人话：

- **加宽**（浅网、很多断点）：误差 $\sim W^{-2}$；  
- **加深**（反复复合锯齿）：误差 $\sim 2^{-L}$ 指数下降。

这已经能看见深度的好处。下一节把「任意宽 $W$、任意深 $D$」写成一条更整齐的界。

---

## 9. Lemma 3（Lu–Shen–Yang–Zhang）：$|f-x^2|\le(W/3)^{-D}$（p.34）

**引理 3。** 存在 ReLU 网络 $f\in\mathrm{NN}_{(W,D,2)}(1,1)$，使得在 $[0,1]$ 上

$$
\bigl|f(x)-x^2\bigr|
\;\le\;
(W/3)^{-D}.
$$

（默认 $W\ge 3$，$D\ge 1$；更小的 $W,D$ 用 Lemma 1(1) 垫到这个范围，或直接用 $I_k$ 的离散值。）

### 9.1 证明思想：宽度造齿，深度复合齿

Lemma 2 用的是 **二进** 齿数 $2^{k}$。现在宽度是任意的 $W$：一层里用约 $W/3$ 个 ReLU 就能造出 $M=\lfloor W/3\rfloor$ 颗齿的锯齿（每颗帐篷大约要 2–3 个神经元：上去、下来、对齐）。把这个「宽锯齿」当作新的 $T_1$，复合 $D$ 次，齿数变成

$$
M^{D}
\;\approx\;
(W/3)^{D}.
$$

对应的分段线性插值有 $\sim M^{D}$ 段，每段长度 $\sim M^{-D}$。Lemma 2 同款计算：

$$
\bigl|x^2-I(x)\bigr|
\;\le\;
\Bigl(\frac{\text{段长}}{2}\Bigr)^2
\;\lesssim\;
M^{-2D}
\;=\;
(W/3)^{-2D}.
$$

当 $W/3\ge 1$ 时 $(W/3)^{-2D}\le(W/3)^{-D}$。讲义写成更松、更好记的 $(W/3)^{-D}$。Lu–Shen–Yang–Zhang 2021 原文对多项式给出宽 $O(N)$、深 $O(L)$、误差 $O(N^{-L})$，平方是特例：把 $W=3N$ 代入即 $(W/3)^{-D}$。

### 9.2 把「齿数相乘」写清楚

设 $S_M:[0,1]\to[0,1]$ 是 $M$ 颗齿的锯齿：把 $[0,1]$ 切成 $M$ 个等长小段，每段上 $S_M$ 是从 0 到 1 再回到 0 的帐篷（或 0 到 1 的折线，细节只影响常数）。则 $S_M\circ S_M$ 在每个小段里又复制 $M$ 颗齿，总共 $M^2$ 颗。归纳：$S_M^{\circ D}$ 有 $M^{D}$ 颗齿。

与 8.3 完全平行，存在系数（类似于 $4^{-i}$，现在是 $M^{-2i}$ 这一档）使得

$$
x^2
\;=\;
x-\sum_{i=1}^{D} c_{M,i}\,S_M^{\circ i}(x)
\;+\;
R_D(x),
\qquad
|R_D|\le C M^{-2D}.
$$

有限和 $x-\sum_{i=1}^{D}c_{M,i}S_M^{\circ i}$ 由 Lemma 1 的复合 + 线性组合实现：宽 $O(M)\le W$（并排时把恒等通道算进去，$W=3M$ 足够），深 $O(D)$，权可以规范化到 2。这就是 Lemma 3 的网络。

### 9.3 与 Lemma 2 的关系（对照）

| | Lemma 2 / $I_k$ | Lemma 3 |
|--|-------------------|---------|
| 资源 | 深 $2k$ 或宽 $2^{k+1}$ | 同时有宽 $W$、深 $D$ |
| 误差 | $2^{-2(k+1)}=\min\{W^{-2},2^{-L}\}$ | $(W/3)^{-D}$（松）或 $(W/3)^{-2D}$（紧） |
| 角色 | 二进构造，证明完全初等 | 后面乘法、多元乘积的「黑盒」 |

后面一律调用 Lemma 3 的 $(W/3)^{-D}$，不再打开锯齿。

---

## 10. 从平方到乘法，再到 $d$ 元乘积（p.34）

### 10.1 极化恒等式

对一切实数 $x,y$，

$$
xy
\;=\;
2\Biggl(
\Bigl(\frac{x+y}{2}\Bigr)^2
-
\Bigl(\frac{x}{2}\Bigr)^2
-
\Bigl(\frac{y}{2}\Bigr)^2
\Biggr).
$$

**验证。** 右边 $=2\bigl[(x^2+2xy+y^2)/4-x^2/4-y^2/4\bigr]=2\cdot(xy/2)=xy$。

几何：平行四边形极化，用二次型还原双线性形式。对神经网络：乘法变成 **三次调用平方网络** + 仿射预处理。

### 10.2 Lemma 4（二元乘法）

存在 ReLU 网络 $\phi_1\in\mathrm{NN}_{(3W,\,D,\,12)}(2,1)$，使得在 $[0,1]^2$ 上

$$
\bigl|\phi_1(x,y)-xy\bigr|
\;\le\;
6(W/3)^{-D}.
$$

**证明。** 设 $f\in\mathrm{NN}_{(W,D,2)}(1,1)$ 是 Lemma 3 的平方网络，$|f(t)-t^2|\le\delta$，$\delta:=(W/3)^{-D}$。令

$$
\phi_1(x,y)
\;=\;
2\Bigl(
f\bigl(\tfrac{x+y}{2}\bigr)
-
f\bigl(\tfrac{x}{2}\bigr)
-
f\bigl(\tfrac{y}{2}\bigr)
\Bigr).
$$

对 $x,y\in[0,1]$，三个输入 $\frac{x+y}{2},\frac{x}{2},\frac{y}{2}$ 都在 $[0,1]$ 里。于是

$$
\begin{aligned}
\bigl|\phi_1(x,y)-xy\bigr|
&=
2\Bigl|
\bigl(f(u)-u^2\bigr)
-
\bigl(f(v)-v^2\bigr)
-
\bigl(f(w)-w^2\bigr)
\Bigr|\\
&\le
2(\delta+\delta+\delta)
=
6\delta,
\end{aligned}
$$

其中 $u=\frac{x+y}{2}$ 等。网络结构：三个平方网络并排（Lemma 1(3)），宽度 $3W$，深度 $D$；前面的 $\frac12$ 与后面的系数 $2$ 融进第一层 / 最后一层。权界 12：平方网权界 2，再乘系数 2 与若干 $1/2$ 的融合（Lemma 1(2) 的 $W B_2 B_3$ 被讲义收成常数 12）。证毕。

### 10.3 Lemma 5（$d$ 元乘积，二叉树）

存在 ReLU 网络 $\phi_d\in\mathrm{NN}_{(3\log_2 d\cdot W,\; D\log_2 d,\; (36W)^{\log_2 d})}(d,1)$，使得在 $[0,1]^d$ 上

$$
\bigl|\phi_d(x_1,\ldots,x_d)-x_1\cdots x_d\bigr|
\;\le\;
12d\,(W/3)^{-D}.
$$

**构造。** 先设 $d=2^m$。归纳定义 $\phi_k:[0,1]^{2^k}\to\mathbb{R}$：

- $\phi_1$ 就是 Lemma 4 的二元乘法；
- $\phi_{k+1}(x_1,\ldots,x_{2^{k+1}})
=\phi_1\bigl(\phi_k(x_1,\ldots,x_{2^k}),\,\phi_k(x_{2^k+1},\ldots,x_{2^{k+1}})\bigr)$。

这是一棵满二叉树：先两两相乘，再把乘积两两相乘，共 $m=\log_2 d$ 层乘法。

**误差。** 令 $\delta=(W/3)^{-D}$，$\varepsilon_k=\|\phi_k-\text{真乘积}\|_\infty$。$\varepsilon_1\le 6\delta$。

为了让输出留在 $[0,1]$（否则误差会多乘一个「输出大小」），在每次乘法后可以夹紧：

$$
\mathrm{clip}_{[0,1]}(z)=\sigma(z)-\sigma(z-1),
$$

这是宽 2 的 ReLU 网络，不改变阶。夹紧后 $\phi_k\in[0,1]$，真乘积也在 $[0,1]$。于是

$$
\begin{aligned}
\varepsilon_{k+1}
&\le
\bigl|\phi_1(a,b)-ab\bigr|
+
\bigl|ab-P_L P_R\bigr|\\
&\le
6\delta
+
|a|\,|b-P_R|+|P_R|\,|a-P_L|\\
&\le
6\delta
+
\varepsilon_k+\varepsilon_k
=
6\delta+2\varepsilon_k,
\end{aligned}
$$

其中 $a=\phi_k(\text{左})$，$P_L$ 是左半的真乘积。解这个递推：

$$
\varepsilon_m
\;\le\;
6\delta(1+2+\cdots+2^{m-1})
\;=\;
6\delta(2^m-1)
\;\le\;
6d\,\delta.
$$

讲义写 $12d\,\delta$：多留 2 倍，覆盖「不夹紧、输出略超出 $[0,1]$」或 $d$ 不是 2 的幂（补 1 凑成 $2^{\lceil\log_2 d\rceil}$，$2^{\lceil\log_2 d\rceil}<2d$）。

**规模。** 每次复合用 Lemma 1(2)：深度乘上 $\log_2 d$ 档，变成 $D\log_2 d$。宽度：讲义取 $3\log_2 d\cdot W$（每一层乘法宽 $3W$，再把 $\log_2 d$ 层的常数乘进去；更省的实现是宽度 $\max\{3W,d\}$，只保留当前乘积与尚未使用的坐标）。权界按 Lemma 1(2) 每次乘上 $\mathrm{width}\cdot B\cdot B$ 这一档，$\log_2 d$ 次后变成 $(36W)^{\log_2 d}$ 型（$36\sim 3\times 12$）。

**$d$ 不是 2 的幂。** 用 1 把维数补到 $2^{\lceil\log_2 d\rceil}$（常数 1 是偏置，免费），或改成顺序乘法 $\phi_1(\phi_1(\cdots),\cdot)$：深度 $(d-1)D$，宽度 $3W+O(d)$，误差仍 $O(d\delta)$。阶不变。

**输入可能为负。** 后面 $x_i-n_i/N\in(-1/N,1/N)$。极化恒等式对一切实数成立。平方在 $[-1,1]$ 上：$t^2=|t|^2$，$|t|=\sigma(t)+\sigma(-t)$，先折到 $[0,1]$ 再调用 Lemma 3。误差界同阶。笔记下文默认 $\phi_{d}$ 已对 $\|z\|_\infty\le 1$ 的输入校准过。

---

## 11. 逼近 $p_{\mathbf{n},\alpha}$，再拼成 $\phi$（p.34–35）

### 11.1 每个局部单项式是一次多元乘法

$$
p_{\mathbf{n},\alpha}(x)
=
\psi_{\mathbf{n}}(x)\Bigl(x-\frac{\mathbf{n}}{N}\Bigr)^\alpha
=
\Biggl(\prod_{i=1}^d\psi(Nx_i-n_i)\Biggr)
\prod_{i=1}^d
\Bigl(x_i-\frac{n_i}{N}\Bigr)^{\alpha_i}.
$$

右边是 **$d+\|\alpha\|_1$ 个因子的乘积**：

- $d$ 个帽子值 $\psi(Nx_i-n_i)\in[0,1]$；
- 对每个 $i$，因子 $x_i-n_i/N$ 出现 $\alpha_i$ 次。

$\|\alpha\|_1\le r$，故因子个数 $\le d+r$。

帽子：$\psi\in\mathrm{NN}_{(2,2,1)}$。仿射 $t\mapsto Nt-n_i$ 的权是 $N$，所以 $\psi(Nx_i-n_i)$ 的权界带一个 $N$。

线性项用 ReLU 差：

$$
x_i-\frac{n_i}{N}
=
\sigma\Bigl(x_i-\frac{n_i}{N}\Bigr)
-
\sigma\Bigl(-x_i+\frac{n_i}{N}\Bigr).
$$

（在支撑上它就是仿射；写成 ReLU 是为了统一成网络积木。）

### 11.2 网络 $\phi_{\mathbf{n},\alpha}$

把 $d+\|\alpha\|_1$ 个因子送进 Lemma 5 的乘积网络：

$$
\phi_{\mathbf{n},\alpha}(x)
\;:=\;
\phi_{d+\|\alpha\|_1}
\bigl(
\psi(Nx_1-n_1),\ldots,\psi(Nx_d-n_d),\;
\underbrace{x_1-n_1/N,\ldots}_{\alpha_1\text{ 次}},\ldots
\bigr).
$$

由 Lemma 5（因子数 $\le d+r$）以及 Lemma 1（前面加一层算 $\psi$ 与线性项）：

$$
\phi_{\mathbf{n},\alpha}
\;\in\;
\mathrm{NN}_{
(\max\{3\log_2(d+r)\,W,\;2(d+r)\},\;
D\log_2(d+r)+2,\;
(36W)^{\log_2(d+r)}N)
}(d,1),
$$

并且

$$
\bigl|\phi_{\mathbf{n},\alpha}(x)-p_{\mathbf{n},\alpha}(x)\bigr|
\;\le\;
12(d+r)(W/3)^{-D}.
$$

深度 $+2$ 来自 $\psi$ 的两层；宽度 $2(d+r)$ 来自「每个因子宽 2」。这是讲义 p.34 最后三行。

### 11.3 线性组合：$\phi=\sum c_{\mathbf{n},\alpha}\phi_{\mathbf{n},\alpha}$

$$
\phi(x)
\;=\;
\sum_{\mathbf{n}\in\{0,\ldots,N\}^d}
\sum_{\|\alpha\|_1\le r}
c_{\mathbf{n},\alpha}\,\phi_{\mathbf{n},\alpha}(x).
$$

系数 $|c_{\mathbf{n},\alpha}|=|\partial^\alpha f(\mathbf{n}/N)/\alpha!|\le 1$。内层多重指标个数

$$
\sum_{\|\alpha\|_1\le r}1
=
\sum_{j=0}^r \mathrm{card}\{\|\alpha\|_1=j\}
\;\le\;
\sum_{j=0}^r d^j
\;\le\;
(r+1)d^r,
$$

因为 $\mathrm{card}\{\|\alpha\|_1=j\}\le d^j$（$j$ 次求导每次选 $d$ 个坐标之一）。

### 11.4 $|p-\phi|$：只用重叠的 $2^d$ 项

$$
\begin{aligned}
|p(x)-\phi(x)|
&=
\Biggl|
\sum_{\mathbf{n}}\sum_{\|\alpha\|_1\le r}
c_{\mathbf{n},\alpha}
\bigl(p_{\mathbf{n},\alpha}(x)-\phi_{\mathbf{n},\alpha}(x)\bigr)
\Biggr|\\
&\le
\sum_{\mathbf{n}}\sum_{\|\alpha\|_1\le r}
|c_{\mathbf{n},\alpha}|\,\bigl|p_{\mathbf{n},\alpha}-\phi_{\mathbf{n},\alpha}\bigr|.
\end{aligned}
$$

$p_{\mathbf{n},\alpha}$ 的支撑在 $\|x-\mathbf{n}/N\|_\infty<1/N$。在支撑外面，真的 $p_{\mathbf{n},\alpha}=0$，但网络 $\phi_{\mathbf{n},\alpha}$ 未必精确为零——讲义直接把求和限制在重叠的 $\mathbf{n}$ 上，等于默认我们在支撑外把 $\phi_{\mathbf{n},\alpha}$ 关掉，或吸收进 $12(d+r)$ 的常数。按讲义书写：

$$
|p-\phi|
\;\le\;
\sum_{\mathbf{n}:\|x-\mathbf{n}/N\|_\infty<1/N}
\sum_{\|\alpha\|_1\le r}
12(d+r)(W/3)^{-D}.
$$

重叠 $\le 2^d$，内层 $\le(r+1)d^r$，故

$$
|p(x)-\phi(x)|
\;\le\;
12\cdot 2^d(r+1)d^r(d+r)\,(W/3)^{-D}.
$$

### 11.5 总误差 $|f-\phi|$

$$
\begin{aligned}
|f(x)-\phi(x)|
&\le
|f(x)-p(x)|+|p(x)-\phi(x)|\\
&\le
2^d d^r N^{-\zeta}
+
12\cdot 2^d(r+1)d^r(d+r)\,(W/3)^{-D}\\
&=
2^d d^r
\Bigl(
N^{-\zeta}
+
12(r+1)(d+r)(W/3)^{-D}
\Bigr).
\end{aligned}
$$

这是 p.35 的主不等式。两项的来源：

| 项 | 来源 | 怎么变小 |
|----|------|----------|
| $N^{-\zeta}$ | Taylor 余项（格子边长 $1/N$） | 加密网格 |
| $(W/3)^{-D}$ | 乘法 / 平方的网络误差 | 加宽或加深 |

---

## 12. 选参：$D=1+\zeta/d$，$N=W^{1/d}$，得到 $W^{-\zeta/d}$（p.35）

### 12.1 让两项同阶

取

$$
D=1+\frac{\zeta}{d},
\qquad
N=W^{1/d}
$$

（$N$ 取整：$\lfloor W^{1/d}\rfloor$ 或 $\lceil W^{1/d}\rceil$，只影响常数）。则

$$
N^{-\zeta}=W^{-\zeta/d},
$$

$$
(W/3)^{-D}
=
(W/3)^{-1-\zeta/d}
=
3^{1+\zeta/d}\,W^{-1-\zeta/d}
\;\le\;
C'\,W^{-\zeta/d}
$$

（$W\ge 1$ 时 $W^{-1}\le 1$，$C'=3^{1+\zeta/d}$）。于是

$$
|f(x)-\phi(x)|
\;\le\;
C_d\,W^{-\zeta/d},
\qquad
x\in[0,1]^d,
$$

其中 $C_d$（其实依赖 $d,r,\zeta$）吸收 $2^d d^r$、$12(r+1)(d+r)$ 和 $3^{1+\zeta/d}$。

**这就是 3.1 的维数灾难。** 反解 $\varepsilon=C_d W^{-\zeta/d}$ 得 $W\asymp\varepsilon^{-d/\zeta}$。光滑度 $\zeta$ 越大越好，维数 $d$ 越大越惨。

### 12.2 网络的宽、深、权界

每个 $\phi_{\mathbf{n},\alpha}$ 的宽度 $\le\max\{3\log_2(d+r)\,W,\,2(d+r)\}$，深度 $\le D\log_2(d+r)+2$。

把它们线性组合。**点数：** 讲义按「每个 $x$ 处至多 $2^d$ 个帽子非零 $\times$ 至多 $(r+1)d^r$ 个多重指标」来计，写出

$$
\begin{aligned}
\phi
\;\in\;
\mathrm{NN}\Bigl(
&\max\{3\log_2(d+r)\,W,\,2(d+r)\}\cdot 2^d d^r(r+1),\\
&(1+2\zeta/d)\log_2(d+r)+2,\\
&2^d d^r(r+1)\,(36W)^{\log_2(d+r)+2}
\Bigr).
\end{aligned}
$$

对照我们的推导：

- **深度。** $D\log_2(d+r)+2=(1+\zeta/d)\log_2(d+r)+2$。讲义写成 $(1+2\zeta/d)\log_2(d+r)+2$，多留了 $\zeta/d$ 的余量（融合层、夹紧、$d+r$ 不是 2 的幂时 $\lceil\log_2\rceil$ 等）。  
- **宽度与 $2^d$。** 若把全部 $(N+1)^d$ 个格子的子网并排相加，宽度还应乘 $(N+1)^d$。取 $N=W^{1/d}$ 时 $(N+1)^d\asymp W$，朴素拼接的宽度仍是 $W$ 的多项式（再乘 $2^d d^r$）。讲义的 $2^d$ 是「点点活跃的枝数」；要在一个与 $x$ 无关的网络里只付 $2^d$ 而不是 $N^d$，需要 p.36 的离散化（先判断 $x$ 在哪个格子，再只算那个格子的 Taylor）。**对结论 $W^{-\zeta/d}$ 没有影响**：两种计数下宽度都是 $W\cdot\mathrm{poly}(d,r,2^d)$ 这一档。  
- **权界。** 线性组合把权界乘上项数；每条枝上已有 $(36W)^{\log_2(d+r)}N$，再多两个 $W$ 的对数次幂被写成 $(36W)^{\log_2(d+r)+2}$。与 3.4 的 $\|\theta\|_\infty\le c S^{\log_2(d+r)+2}$ 同源。

### 12.3 回到 $E_{\mathrm{app}}$

若 $f^*\in\mathcal{H}^\zeta$（或 $\mathcal{H}_\mu^\zeta$，常数进 $C_d$），$\mathcal{F}$ 包含上述 $\phi$ 所在的网络类，则

$$
E_{\mathrm{app}}
\;\le\;
\|f^*-\phi\|_{L^2(\mu_X)}^2
\;\le\;
\|f^*-\phi\|_\infty^2
\;\le\;
C_d^2\,W^{-2\zeta/d}.
$$

统计误差那一侧，覆盖数 $\log\mathcal{N}\lesssim SD\log(BWD/\delta)$（p.19）。把 $W,D,B$ 代进去，才能和 $E_{\mathrm{app}}$ 对 $n$ 做权衡——那是 Lec2 统计误差份的事。本节只把 $E_{\mathrm{app}}$ 收成 $W^{-2\zeta/d}$。

### 12.4 一张图看整条链

$$
\begin{aligned}
f
&\;\xrightarrow{\text{帽子单位分解}}\;
\sum_{\mathbf{n}}\psi_{\mathbf{n}}f
\;\xrightarrow{\text{局部 Taylor}}\;
p,\quad |f-p|\le 2^d d^r N^{-\zeta}\\
p_{\mathbf{n},\alpha}
&\;=\;
(\text{$d+\|\alpha\|_1$ 元乘积})
\;\xrightarrow{\text{二叉树 }\phi_d}\;
\phi_{\mathbf{n},\alpha}\\
xy
&\;=\;
2\bigl[((x+y)/2)^2-\cdots\bigr]
\;\xrightarrow{\text{Lemma 3}}\;
\text{误差 }(W/3)^{-D}\\
x^2
&\;\xrightarrow{\text{锯齿 }I_k}\;
\text{段长}^2\text{ 误差}.
\end{aligned}
$$

选 $N=W^{1/d}$、$D=1+\zeta/d$，所有误差并成 $W^{-\zeta/d}$。

---

## 13. p.36 改进分析的四块积木

5–12 节的单位分解是 **连续的帽子**。帽子之间重叠 $2^d$，并且实现 $\prod_i\psi(Nx_i-n_i)$ 要真的做乘法。Lu–Shen–Yang–Zhang 2021 与 Jiao–Shen–Lin–Huang 2023 换了一种更「数字」的局部化：先把 $x$ **量化到格子中心**，再在中心做 Taylor。讲义 p.36 把积木拆成四块。

### 13.1 余项的 2-范数写法

对 $x,x_0\in[0,1]^d$，Hölder 光滑 $f$ 满足

$$
\Biggl|
f(x)
-
\sum_{\|\alpha\|_1\le s}
\frac{\partial^\alpha f(x_0)}{\alpha!}(x-x_0)^\alpha
\Biggr|
\;\le\;
d^{s}\,\|x-x_0\|_2^{\beta},
$$

其中 $s$ 是 Taylor 的整数阶，$\beta$ 是剩余的 Hölder 指数（与前面 $\zeta=r+s$ 同一套拆法，字母在这一页被重用了：这里的 $s$ 是整数阶）。$\|x-x_0\|_2\le\sqrt{d}/K$ 若格子边长 $1/K$，余项 $\sim K^{-\beta}$ 或 $K^{-(s+\beta)}$。

### 13.2 积木一：离散化网络 $\psi$

把 $[0,1]^d$ 切成小立方体 $\bigcup_\theta Q_\theta$（讲义图是 $[0,1]^2$ 上的 $4\times 4$ 棋盘，每个 $Q_{(i,j)}$ 标了号）。构造网络 $\psi$，使得

$$
x\in Q_\theta
\quad\Longrightarrow\quad
\psi(x)\;\approx\;x_\theta,
$$

其中 $x_\theta\in Q_\theta$ 是该格子的代表点（中心或角）。于是 $\psi$ 近似地把连续的 $x$ **量化**成有限个点。

人话：$\psi$ 是一个「GPS」：告诉后面的层「你现在在哪个格子」。ReLU 实现量化，边界上会有一薄层（trifling region）量化不准；改进分析通常把这薄层的测度单独估计，或用 $\mathrm{mid}(x_1,x_2,x_3)$ 这类中值技巧把坏点抹掉（LSYZ 2021）。

**和帽子的差别：** 帽子是连续分区、重叠 $2^d$；$\psi$ 是近似分段常数、几乎不重叠。后面每个 $x$ 只对应 **一个** Taylor 中心，不再对 $N^d$ 项求和。

### 13.3 积木二：系数网络 $\varphi_\alpha$

格子确定之后，映射

$$
x\in Q_\theta
\;\longmapsto\;
\partial^\alpha f(x_\theta)
$$

是一个 **只在有限个点上取值的函数**（数据拟合 / 查表）。构造 $\varphi_\alpha$ 使

$$
\varphi_\alpha(x)
\;\approx\;
\partial^\alpha f\bigl(\psi(x)\bigr)
\;\approx\;
\partial^\alpha f(x_\theta).
$$

有限点拟合可以用「位提取」（bit extraction）：深度网络把输入的二进制位读出来，再按位组合出表里的值。这是改进分析能把深度也变成 $N^{-2\alpha/d}L^{-2\alpha/d}$ 里那个 $L$ 的原因——查表的效率随深度指数变好。

### 13.4 积木三：单项式网络 $P_\alpha$

$$
P_\alpha(z)
\;\approx\;
z^\alpha
=
z_1^{\alpha_1}\cdots z_d^{\alpha_d},
\qquad
z=x-\psi(x).
$$

$z$ 是「点到其所在格子代表点的位移」，长度 $O(K^{-1})$。$P_\alpha$ 仍由平方 $\to$ 乘法 $\to$ 多元乘积搭成，即 Lemma 3–5。因为 $\|z\|$ 已经很小，Taylor 余项本身就小；乘法误差只要比余项更小即可。

### 13.5 积木四：乘法网络 $\phi_\times$

$\phi_\times(u,v)\approx uv$，即 Lemma 4。把「系数」和「单项式」乘起来：

$$
\frac{\partial^\alpha f(x_0)}{\alpha!}(x-x_0)^\alpha
\;\approx\;
\phi_\times\Biggl(
\frac{\varphi_\alpha(x)}{\alpha!},\;
P_\alpha\bigl(x-\psi(x)\bigr)
\Biggr).
$$

### 13.6 总装

$$
\phi(x)
\;=\;
\sum_{\|\alpha\|_1\le s}
\phi_\times
\Biggl(
\frac{\varphi_\alpha(x)}{\alpha!},\;
P_\alpha\bigl(x-\psi(x)\bigr)
\Biggr).
$$

与 11 节对比：

| | 帽子构造（§5–12） | 离散化构造（p.36） |
|--|-------------------|---------------------|
| 局部化 | 连续单位分解 $\psi_{\mathbf{n}}$ | 量化 $\psi(x)\approx x_\theta$ |
| 对格子求和 | 理论上 $(N+1)^d$ 项（活跃 $2^d$） | 每个 $x$ 一项 |
| 系数 | 写死在权里 $c_{\mathbf{n},\alpha}$ | 网络 $\varphi_\alpha$ 拟合 |
| 宽深角色 | 深几乎固定 $1+\zeta/d$，误差 $W^{-\zeta/d}$ | 宽、深对称，误差 $(NM)^{-2\zeta/d}$ |
| 难度 | 初等，适合手算 | 需要位提取 / 点拟合 |

Jiao–Shen–Lin–Huang 的多项式前因子，很大一部分来自：量化 + 拟合比「把 $N^d$ 个帽子并排」更省，且避免了部分 $2^d$、$d^d$。

---

## 14. 本节收束

### 14.1 你应该带走的几行

**平方损失。**

$$
L(f)-L(f^*)=\|f-f^*\|_{L^2(\mu_X)}^2.
$$

**单位分解。** $\psi(t)=\sigma(1-|t|)$，$\psi_{\mathbf{n}}(x)=\prod_i\psi(Nx_i-n_i)$，$\sum\psi_{\mathbf{n}}\equiv 1$ 在 $[0,1]^d$ 上。

**Taylor。** $f\in\mathcal{H}^\zeta$，$\zeta=r+s$，则 $|f-T_r(\cdot;x_0)|\le d^r\|x-x_0\|_\infty^\zeta$；凸组合后 $|f-p|\le 2^d d^r N^{-\zeta}$。

**平方与乘法。**

$$
|x^2-I_k(x)|\le 2^{-2(k+1)},
\qquad
I_k=x-\sum_{i=1}^k 4^{-i}T_i,
$$

$$
xy=2\Bigl[\bigl(\tfrac{x+y}{2}\bigr)^2-\bigl(\tfrac{x}{2}\bigr)^2-\bigl(\tfrac{y}{2}\bigr)^2\Bigr],
$$

深度复合后 $|f-x^2|\le(W/3)^{-D}$，$d$ 元乘积误差 $12d(W/3)^{-D}$。

**主定理（初等构造）。** $f\in\mathcal{H}^\zeta$，存在 ReLU 网 $\phi$，在 $D=1+\zeta/d$、$N=W^{1/d}$ 时

$$
\|f-\phi\|_\infty
\;\le\;
C_d W^{-\zeta/d},
$$

从而 $E_{\mathrm{app}}\le C_d^2 W^{-2\zeta/d}$。这就是 Hölder 球上的维数灾难。

**KAT 的位置。** 连续范畴里复合是万能的，所以 2–3 层能稠密；Lipschitz 积木逼近 Hölder 球时，万能 $\neq$ 无 CoD。

### 14.2 和前后两份的接口

- 上一份（统计误差）：$E_{\mathrm{sta}}$ / $E_{\mathrm{gen}}$ 通过覆盖数依赖 $\mathcal{F}$ 的 $W,D,B$。本节给出：同样的 $W,D,B$ 决定了 $E_{\mathrm{app}}$。  
- 下一份（优化误差）：网络非凸，GD 不一定走到 $\bar f$。逼近论构造的 $\phi$ 只说明「类里有好函数」，不说明梯度下降找不找得到。

### 14.3 读讲义时的常见坑

1. $E_{\mathrm{app}}=\inf\|f-f^*\|_{L^2}^2$ 已经是超额风险，不要再平方一次；若你先证了 $\|f-\phi\|_\infty\le\varepsilon$，风险那边才是 $\varepsilon^2$。  
2. Hölder 定义里的 $s$ 有两个角色；多重指标请看成 $\alpha$。  
3. Lemma 1 的权界在「融合相邻仿射层」时才会出现 $\mathrm{width}\cdot B_1 B_2$；只拼接不加融合则是 $\max B_i$。讲义全程用前者，所以 $B$ 看起来很大。  
4. $(W/3)^{-D}$ 不是最优指数（可以 $^{-2D}$）；足够让 $D=1+\zeta/d$ 时这一项不超过 $W^{-\zeta/d}$。  
5. p.35 宽度里的 $2^d$ 与朴素的 $(N+1)^d$ 不是一回事；阶都是 $W^{-\zeta/d}$，改进构造见 p.36。  
6. ReLU–sine–$2^x$ 打破 CoD **不能** 当成「ReLU 也没有 CoD」。
