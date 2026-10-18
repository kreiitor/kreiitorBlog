---
title: Minimax 下界与监督学习方法
description: 理解统计学习的最优速率，以及分类、SVM、核方法与 RKHS。
pubDate: 2026-10-11
tags:
  - 数据科学
  - 学习理论
  - FODS
category: course
series: fods
order: 5
cover: /covers/post-math.svg
---

1. **下界**：再聪明的估计，在最坏的 Hölder 回归上也不可能比 $n^{-2\alpha/(2\alpha+d)}$ 更快；
2. **监督方法**：0-1 损失不可训，所以要凸化；然后是 plugin、LDA/QDA、SVM、核与 RKHS。

本章目标：把内容里跳掉的 KL、变分式、共轭、左右导数、对偶、KKT、Moore–Aronszajn、表示定理全部写成可跟的证明。

你会得到：

1. packing + 两点分布，把回归 minimax 变成多假设检验；
2. $\mathrm{KL}(P_i,P_j)\le \frac43\|f_i-f_j\|_{L^2}^2$ 的完整计算；
3. KL 变分式（用 $\mathrm{KL}(P,Q')\ge 0$）；
4. Bernoulli 累积量 $m$ 与共轭 $m^*$；
5. 不交事件 $A_i$ 与 $\bar p$：要么 $\bar p\ge 1/2$，要么与 packing 基数矛盾；
6. Hölder 类速率 $T\ge O\bigl(n^{-2\alpha/(2\alpha+d)}\bigr)$；
7. 一般框架：$\mathrm{KL}(P_{\theta_i},P_{\theta_j})\le C_\Theta d^2(\theta_i,\theta_j)$，有界密度时 $\mathrm{KL}\le\int\frac{(p-q)^2}{q}$；
8. margin 损失、classification-calibrated；
9. 凸损失校准 $\iff$ 在 $0$ 可微且 $\ell'(0)<0$（$C_\eta$ 的左右导写全）；
10. 超额风险 $\mathcal{E}(f)=\mathbb{E}\bigl[|2\eta-1|\,|f^*-f|\bigr]$；
11. Bayes 风险 $L^*=\mathbb{E}|f^*-\eta|$；
12. plugin 的 $\mathcal{E}(f_{\hat\eta})\le 2\|\eta-\hat\eta\|_{L^1}$，以及它不是必要的；
13. logistic 负对数似然两种标签约定；
14. 从 Bayes 规则推出 QDA / LDA；
15. 间隔几何：硬间隔到软间隔；
16. 与 hinge ERM 等价；
17. Lagrange 对偶、强对偶、Gram 矩阵；
18. KKT：$\alpha_i\in(0,C)\Rightarrow y_i f(x_i)=1$，支持向量由此得名；
19. 核技巧，$\langle\phi(x),\phi(z)\rangle=(x\cdot z)^2$；
20. RKHS、再生性、核 = PSD；
21. 每个 RKHS 有唯一核；每个核有唯一 RKHS（Moore–Aronszajn 提纲）；
22. 表示定理完整证明；
23. 从 RKHS 正则 hinge 推出核 SVM 对偶。

需要的预备：

- KL 散度、绝对连续：附录 B；本节会从定义算起。
- 凸函数的左右导数、次梯度、KKT、强对偶：附录 A。
- Hölder 类 $\mathcal{H}^\alpha$、$L^2(\mu)$ packing 数：`02b`；本节会把用到的那一条熵写出来。
- Hilbert 空间、Riesz 表示：附录 A。

内容这一段排版很挤，有几处符号被挤断。下面以**能算对**为准，并标明和内容不一致的地方。

---

## 0. 先用一句话把两块钉在一起

**下界**回答：非参回归里，上界 $n^{-2\alpha/(2\alpha+d)}$ 能不能再改进？不能。方法是造 $N$ 个「彼此不太像、数据却很像」的回归函数，任何估计都至少会把其中一半搞错。

**监督方法**回答：分类的 0-1 损失不能梯度下降。换一个凸的 margin 损失，但要保证「凸问题的最优符号 = Bayes 分类器的符号」。这叫校准。然后 plugin / 线性模型 / SVM 都是在这个凸问题里找 $g$。

---

## 1. 非参回归的 minimax 下界

### 1.1 人话：上界说「我能做到」，下界说「没人能更好」

Lec1 的线性高斯模型里，OLS 的超额风险精确等于 $\frac{r\sigma^2}{n}$，贝叶斯方法给出同样的下界，于是 OLS 是 minimax 最优的。

现在函数类是无穷维的 Hölder 球。`02a`+`02b` 已经有上界：光滑 $\alpha$、维度 $d$ 时，合适的 ERM / 核 / 网络能做到

$$
\mathbb{E}\|\widehat f-f^*\|_{L^2}^2 \;\lesssim\; n^{-2\alpha/(2\alpha+d)}.
$$

若下界也是这个幂次，速率就是最优的。证明下界不能再对「某一个」$f^*$ 算（那个 $f^*$ 也许特别好估），必须对**最坏的** $f^*$ 说话：

$$
T \;=\; \inf_{\widehat f}\;\sup_{P^*\in\mathcal{M}}\;
\mathbb{E}_{P^{*n}}\bigl[\|\widehat f-f^*\|_{L^2(\mu)}^2\bigr].
$$

$\inf_{\widehat f}$ 是「你随便用什么算法」，$\sup_{P^*}$ 是「世界可以选对你最狠的那个分布」。$T$ 小，说明存在一个算法，对所有允许的 $P^*$ 都好；$T$ 大，说明再聪明也会在某个 $P^*$ 上惨。

### 1.2 模型

观测 $(X,Y)\sim P^*$，取值在 $[0,1]^d\times[-B,B]$，$B\ge 1$，

$$
Y \;=\; f^*(X)+\epsilon,\qquad
\mathbb{E}[\epsilon\mid X]=0,\qquad
\mathrm{Var}[\epsilon]\le\sigma^2,
$$

并且 $|Y|\le B$，$\|f^*\|_{L^\infty}\le B/2$，$|\epsilon|\le B/2$。记 $\mu=P^*_X$（$X$ 的边缘，内容把它固定下来，所以难度全在回归函数）。函数类

$$
\mathcal{X} \;\subseteq\; L^2([0,1]^d,\mu)\cap L^\infty_{B/2}([0,1]^d,\mu).
$$

允许的联合分布

$$
\mathcal{M}
=\bigl\{
P\text{ 在 }[0,1]^d\times[-B,B]\text{ 上}:\;
P_X=\mu,\;
\mathbb{E}_P[Y\mid X=x]\in\mathcal{X}
\bigr\}.
$$

估计 $\widehat f$ 是数据 $D=\{(X_i,Y_i)\}_{i=1}^n\sim (P^*)^n$ 的函数。目标是下界 $T$。

**内容符号的一处尺度。** 下面 packing 的是满足 $\|f_i\|_{L^\infty}\le 1/2$ 的函数，两点分布的条件期望是 $B f_i$。若坚持 $T$ 里比较的是回归函数 $Bf_i$，事件 $A_i$ 应写成 $\{\|\widehat f-Bf_i\|_{L^2}<Bc\xi/2\}$，下界多一个因子 $B^2$。$B$ 是固定常数，**不改变 $n$ 的幂次**。下文完全按内容：距离用 $\|f_i-f_j\|_{L^2}$，事件用 $\|\widehat f-f_i\|_{L^2}$。

### 1.3 packing 集

**定义（$\xi$-packing）。** 度量空间 $(\mathcal{X},\|\cdot\|_{L^2(\mu)})$ 的一个 $\xi$-packing 是有限子集 $\{f_1,\ldots,f_N\}$，满足 $i\neq j\Rightarrow \|f_i-f_j\|_{L^2}\ge\xi$。最大基数记成 $N(\xi)$（packing 数）。

内容取一个**最大** $\xi$-packing $\mathcal{C}=\{f_1,\ldots,f_N\}$，并且把距离夹在两常数之间（最大 packing 里最近的一对不会比 $\xi$ 大很多；上界 $C\xi$ 是为了把 KL 用 $\xi^2$ 控制）：

$$
c\xi \;\le\; \|f_i-f_j\|_{L^2(\mu)} \;\le\; C\xi,
\qquad i\neq j,\qquad
\|f_i\|_{L^\infty}\le \tfrac12.
$$

$c,C>0$ 只依赖函数类，不依赖 $n,\xi$。$\|f_i\|_{L^\infty}\le 1/2$ 是为了后面两点分布的概率落在 $[\frac14,\frac34]$，KL 分母不爆。

**人话：** $N$ 个函数两两在 $L^2$ 里隔开至少 $c\xi$。任何估计 $\widehat f$ 的 $c\xi/2$-球最多罩住其中一个，所以 $\widehat f$ 没法同时靠近两个 $f_i$。若数据又几乎分不清这些 $f_i$（KL 小），估计就不得不猜错。

### 1.4 两点分布 $P_i$

对每个 packing 函数 $f_i$，造一个联合分布：$X\sim\mu$，给定 $X=x$，

$$
Y \;=\;
\begin{cases}
+B, & \text{概率 }\dfrac{1+f_i(x)}{2},\\[4pt]
-B, & \text{概率 }\dfrac{1-f_i(x)}{2}.
\end{cases}
$$

写成密度（对 $\mu\otimes(\delta_B+\delta_{-B})$ 而言）

$$
\mathrm{d}P_i(x,y)
=\Biggl(
\frac{1+f_i(x)}{2}\,\mathrm{d}\delta_B(y)
+\frac{1-f_i(x)}{2}\,\mathrm{d}\delta_{-B}(y)
\Biggr)\mathrm{d}\mu(x).
$$

**引理 1.1。** $P_i\in\mathcal{M}$，且 $\mathbb{E}_{P_i}[Y\mid X=x]=B f_i(x)$。

**证明。** $\|f_i\|_{L^\infty}\le 1/2$ 故 $\frac{1\pm f_i}{2}\in[\frac14,\frac34]\subset(0,1)$，这是合法的 Bernoulli 型两点分布。边缘 $P_{i,X}=\mu$。条件期望

$$
\mathbb{E}[Y\mid X=x]
= B\cdot\frac{1+f_i(x)}{2} + (-B)\cdot\frac{1-f_i(x)}{2}
= B f_i(x).
$$

$|Bf_i|\le B/2$，$|Y|=B$，噪声 $\epsilon=Y-Bf_i(X)$ 满足 $|\epsilon|\le B+B/2$ 量级（内容写 $|\epsilon|\le B/2$ 是在「回归函数已是 $f^*$、$|Y|\le B$」的原模型里；两点构造里 $Y=\pm B$ 是为了让 KL 好算，有界性足够）。只要 $Bf_i$ 落在工作类 $\mathcal{X}$ 里（Hölder 球时把 bump 高度取得足够小即可），就有 $P_i\in\mathcal{M}$。$\square$

$n$ 个 i.i.d. 样本的联合是乘积测度 $P_i^n$。KL 的张量化：

$$
\mathrm{KL}(P_i^n,P_j^n) \;=\; n\,\mathrm{KL}(P_i,P_j).
$$

### 1.5 $\mathrm{KL}(P_i,P_j)\le \frac43\|f_i-f_j\|_{L^2}^2$（完整证明）

先写似然比。$Y$ 只取 $\pm B$，$\mathrm{sgn}(y)\in\{\pm 1\}$，

$$
\frac{\mathrm{d}P_i}{\mathrm{d}P_j}(x,y)
= \frac{1+\mathrm{sgn}(y)\,f_i(x)}{1+\mathrm{sgn}(y)\,f_j(x)}
= 1 + \frac{\mathrm{sgn}(y)\bigl(f_i(x)-f_j(x)\bigr)}{1+\mathrm{sgn}(y)\,f_j(x)}.
$$

（因为 $1+\mathrm{sgn}(y)f_j\ge 1-\|f_j\|_{L^\infty}\ge 1/2>0$，分母不零，$P_i\ll P_j$。）

**定理 1.2。** $\mathrm{KL}(P_i,P_j)\le \dfrac43\|f_i-f_j\|_{L^2(\mu)}^2$。因而

$$
\mathrm{KL}(P_i^n,P_j^n) \;\le\; \frac{4n}{3}\|f_i-f_j\|_{L^2(\mu)}^2 \;\le\; \frac{4C^2 n\xi^2}{3}.
$$

**证明。** 按定义 $\mathrm{KL}(P_i,P_j)=\mathbb{E}_{Z\sim P_i}\bigl[\log\frac{\mathrm{d}P_i}{\mathrm{d}P_j}(Z)\bigr]$。先对 $Y\mid X$ 积分：给定 $X=x$，

$$
\begin{aligned}
&\frac{1+f_i}{2}\log\frac{1+f_i}{1+f_j}
+\frac{1-f_i}{2}\log\frac{1-f_i}{1-f_j}\\
&=\frac12\Biggl[
(1+f_i)\log\Bigl(1+\frac{f_i-f_j}{1+f_j}\Bigr)
+(1-f_i)\log\Bigl(1-\frac{f_i-f_j}{1-f_j}\Bigr)
\Biggr].
\end{aligned}
$$

（用了 $\frac{1+f_i}{1+f_j}=1+\frac{f_i-f_j}{1+f_j}$，以及 $\frac{1-f_i}{1-f_j}=1-\frac{f_i-f_j}{1-f_j}$。）
对任意 $u>-1$ 有 $\log(1+u)\le u$。因此

$$
\mathrm{KL}(P_i,P_j)
\le \frac43\mathbb{E}_\mu[(f_i-f_j)^2]
= \frac43\|f_i-f_j\|_{L^2(\mu)}^2.
$$

$\square$

**误区：** 这里用的是 $\log(1+u)\le u$，得到的是 KL 的**上界**。下界证明里，对「数据有多像」要上界（KL 小），对「检验函数能分多开」要下界（下一小节的变分式）。方向不要反。

### 1.6 KL 变分式

**定理 1.3（Donsker–Varadhan 型）。** 设 $P\ll Q$。则对一切使下式有意义的可测函数 $g$（内容取有界，避免 $\mathbb{E}_Q e^g=\infty$），

$$
\mathrm{KL}(P,Q)
\;\ge\;
\sup_g\Bigl\{\mathbb{E}_P[g]-\log\mathbb{E}_Q[e^g]\Bigr\}.
$$

若 $P\not\ll Q$，左边是 $+\infty$，不等式平凡。

**证明。** 任取有界可测 $g$，令

$$
\mathrm{d}Q' \;=\; \frac{e^g}{\mathbb{E}_Q[e^g]}\,\mathrm{d}Q.
$$

这是概率测度（非负，积分为 1），且 $Q'\ll Q$。KL 非负：$\mathrm{KL}(P,Q')\ge 0$（取 $0\log 0=0$；若 $P\not\ll Q'$ 则 KL $=\infty\ge 0$）。而 $P\ll Q$ 且 $e^g>0$，故 $P\ll Q'$。于是

$$
\begin{aligned}
0 \;\le\; \mathrm{KL}(P,Q')
&= \mathbb{E}_P\Bigl[\log\frac{\mathrm{d}P}{\mathrm{d}Q'}\Bigr]
= \mathbb{E}_P\Bigl[\log\Bigl(\frac{\mathrm{d}P}{\mathrm{d}Q}\cdot\frac{\mathrm{d}Q}{\mathrm{d}Q'}\Bigr)\Bigr]\\
&= \mathrm{KL}(P,Q) + \mathbb{E}_P\Bigl[\log\frac{\mathrm{d}Q}{\mathrm{d}Q'}\Bigr].
\end{aligned}
$$

$\frac{\mathrm{d}Q}{\mathrm{d}Q'}=e^{-g}\,\mathbb{E}_Q[e^g]$，故

$$
\mathbb{E}_P\Bigl[\log\frac{\mathrm{d}Q}{\mathrm{d}Q'}\Bigr]
= \log\mathbb{E}_Q[e^g]-\mathbb{E}_P[g].
$$

整理：

$$
0 \;\le\; \mathrm{KL}(P,Q)+\log\mathbb{E}_Q[e^g]-\mathbb{E}_P[g],
$$

即 $\mathrm{KL}(P,Q)\ge \mathbb{E}_P[g]-\log\mathbb{E}_Q[e^g]$。对 $g$ 取 $\sup$。$\square$

**人话：** 把 $Q$ 扭成 $Q'\propto e^g Q$，非负性 $\mathrm{KL}(P,Q')\ge 0$ 把 $\mathbb{E}_P g$ 和 $\log\mathbb{E}_Q e^g$ 从 KL 里拆出来。后面取 $g=\lambda 1_{A_i}$，变分式就变成「事件 $A_i$ 在 $P_i$ 与 $P_j$ 下的概率差」。

### 1.7 Bernoulli 累积量 $m$ 与共轭 $m^*$

设 $b\sim\mathrm{Ber}(p)$（取值 $\{0,1\}$），$\lambda\ge 0$。对数矩母函数（累积量）

$$
m(p,\lambda)
\;=\; \log\mathbb{E}[e^{\lambda b}]
\;=\; \log\bigl(p e^\lambda + 1-p\bigr)
\;=\; \log\bigl(1+p(e^\lambda-1)\bigr).
$$

**引理 1.4。** 对固定 $\lambda\ge 0$，$p\mapsto m(p,\lambda)$ 在 $[0,1]$ 上递增且凹。

**证明。** $\partial_p m = \dfrac{e^\lambda-1}{1+p(e^\lambda-1)}\ge 0$（$\lambda\ge 0$）。再导一次

$$
\partial_{pp}m
= -\frac{(e^\lambda-1)^2}{\bigl(1+p(e^\lambda-1)\bigr)^2}\le 0.
$$

$\square$

**共轭（Legendre）：** 对 $0\le p\le a\le 1$，

$$
m^*(p,a)
\;:=\; \sup_{\lambda\in\mathbb{R}}\bigl\{\lambda a - m(p,\lambda)\bigr\}
\;=\; a\log\frac{a}{p} + (1-a)\log\frac{1-a}{1-p}.
$$

右边正是 $\mathrm{KL}\bigl(\mathrm{Ber}(a)\,\|\,\mathrm{Ber}(p)\bigr)$。

**证明（补全）。** 对 $\lambda$ 求导：

$$
\partial_\lambda\bigl(\lambda a-m(p,\lambda)\bigr)
= a - \frac{p e^\lambda}{p e^\lambda+1-p}.
$$

令其为 $0$：$a(p e^\lambda+1-p)=p e^\lambda$，即 $a(1-p)=p e^\lambda(1-a)$，故

$$
e^\lambda \;=\; \frac{a(1-p)}{p(1-a)}
\qquad\bigl(p\le a\le 1\text{ 且 }p\in(0,1),\;a\neq 1\text{ 时合法；边界用连续性}\bigr).
$$

代入 $p e^\lambda+1-p$：

$$
p\cdot\frac{a(1-p)}{p(1-a)}+1-p
= \frac{a(1-p)}{1-a}+1-p
= \frac{1-p}{1-a}.
$$

于是

$$
\begin{aligned}
\lambda a-m(p,\lambda)
&= a\log\frac{a(1-p)}{p(1-a)}-\log\frac{1-p}{1-a}\\
&= a\log\frac{a}{p}+a\log\frac{1-p}{1-a}-\log(1-p)+\log(1-a)\\
&= a\log\frac{a}{p}+(1-a)\log\frac{1-a}{1-p}.
\end{aligned}
$$

这是 $\sup$ 的达到值。$\square$

### 1.8 不交事件 $A_i$ 与 $\bar p$

估计 $\widehat f=\widehat f(D)$ 已固定。定义

$$
A_i \;=\; \bigl\{\|\widehat f-f_i\|_{L^2(\mu)} < \tfrac{c\xi}{2}\bigr\},
\qquad i=1,\ldots,N.
$$

**引理 1.5。** $\{A_i\}_{i=1}^N$ 两两不交。

**证明。** 若某个样本点同时落入 $A_i\cap A_j$（$i\neq j$），三角不等式给出

$$
\|f_i-f_j\|_{L^2}
\le \|\widehat f-f_i\|_{L^2}+\|\widehat f-f_j\|_{L^2}
< c\xi,
$$

与 packing $\|f_i-f_j\|\ge c\xi$ 矛盾。$\square$

记 $p_{j,i}:=P_j^n(A_i)$，以及

$$
\bar p \;:=\; \sup_{1\le i\le N} P_i^n(A_i^c).
$$

$\bar p$ 是「在真值是 $f_i$ 时，估计落在 $f_i$ 的 $c\xi/2$-球外面」的最坏概率。若 $\bar p\ge 1/2$，已经有某个假设上误差大，下界直接出来。若 $\bar p<1/2$，每个球都被对应的 $P_i^n$ 以超过一半的质量罩住——但球不交，$N$ 又大，这些 $P_i^n$ 必须彼此很不像，与「KL $\le O(n\xi^2)$」冲突。

**命题 1.6。** 要么 $\bar p>(N-1)/N$，要么

$$
m^*\Bigl(\frac{\bar p}{N-1},\,1-\bar p\Bigr)
\;\le\;
\inf_{j}\frac{1}{N-1}\sum_{i\neq j}\mathrm{KL}(P_i^n,P_j^n).
$$

（$\bar p>(N-1)/N$ 时对 $N\ge 2$ 已有 $\bar p\ge 1/2$。）

**证明。** 若 $\bar p>(N-1)/N$ 完毕。下设 $\bar p\le(N-1)/N$，此时 $\frac{\bar p}{N-1}\le 1-\bar p$，共轭 $m^*$ 的定义合法。

固定 $j\in\{1,\ldots,N\}$，对每个 $i\neq j$ 取检验函数 $g_i=\lambda 1_{A_i}$（$\lambda\ge 0$）。变分式：

$$
\begin{aligned}
\mathrm{KL}(P_i^n,P_j^n)
&\ge \mathbb{E}_{P_i^n}[g_i]-\log\mathbb{E}_{P_j^n}[e^{g_i}]\\
&= \lambda\, p_{i,i} - \log\bigl(p_{j,i}e^\lambda + 1-p_{j,i}\bigr)\\
&= \lambda\, p_{i,i} - m(p_{j,i},\lambda).
\end{aligned}
$$

对 $i\neq j$ 平均：

$$
\frac{1}{N-1}\sum_{i\neq j}\mathrm{KL}(P_i^n,P_j^n)
\ge
\lambda\cdot\frac{1}{N-1}\sum_{i\neq j}p_{i,i}
\;-\;
\frac{1}{N-1}\sum_{i\neq j}m(p_{j,i},\lambda).
$$

第一项：$p_{i,i}=P_i^n(A_i)=1-P_i^n(A_i^c)\ge 1-\bar p$，故平均 $\ge 1-\bar p$。
第二项：$m(\cdot,\lambda)$ 凹，Jensen 给出

$$
\frac{1}{N-1}\sum_{i\neq j}m(p_{j,i},\lambda)
\le
m\Biggl(\frac{1}{N-1}\sum_{i\neq j}p_{j,i},\,\lambda\Biggr).
$$

$A_i$ 不交，故 $\sum_{i\neq j}p_{j,i}=P_j^n\bigl(\bigcup_{i\neq j}A_i\bigr)\le P_j^n(A_j^c)\le\bar p$。$m$ 对 $p$ 递增，于是

$$
m\Biggl(\frac{1}{N-1}\sum_{i\neq j}p_{j,i},\,\lambda\Biggr)
\le m\Bigl(\frac{\bar p}{N-1},\lambda\Bigr).
$$

因此

$$
\frac{1}{N-1}\sum_{i\neq j}\mathrm{KL}(P_i^n,P_j^n)
\ge
\lambda(1-\bar p)-m\Bigl(\frac{\bar p}{N-1},\lambda\Bigr).
$$

对 $\lambda\ge 0$ 取 $\sup$，左边不变，右边变成 $m^*\bigl(\bar p/(N-1),\,1-\bar p\bigr)$。再对 $j$ 取 $\inf$。$\square$

再结合定理 1.2：右边 $\le \frac{4C^2 n\xi^2}{3}$。

### 1.9 要么 $\bar p\ge 1/2$，要么与 packing 基数矛盾

先把 $m^*$ 写成显式并降到能用的下界。

**引理 1.7。** 设 $0<\bar p\le 1/2$，$N\ge 2$。则

$$
\begin{aligned}
m^*\Bigl(\frac{\bar p}{N-1},\,1-\bar p\Bigr)
&= (1-\bar p)\log\frac{(1-\bar p)(N-1)}{\bar p}
+ \bar p\log\frac{\bar p}{1-\bar p/(N-1)}\\
&= \log(N-1)-\bar p\log(N-1-\bar p)+2\bar p\log\bar p\\
&\qquad +(1-\bar p)\log(1-\bar p)-\log\bar p,
\end{aligned}
$$

并且

$$
m^*\Bigl(\frac{\bar p}{N-1},\,1-\bar p\Bigr)
\;\ge\;
\frac12\log(N-1)-\log\bar p-2.
$$

**证明。** 第一行是共轭公式。第二行：把 $\log\frac{\bar p}{1-\bar p/(N-1)}=\log\bar p-\log\frac{N-1-\bar p}{N-1}$ 代入，$\log(N-1)$ 的系数合成 $1$，即内容的展开。

下界：$\bar p\log\frac{N-1}{N-1-\bar p}\ge 0$，故

$$
m^*
\ge (1-\bar p)\log(N-1)+2\bar p\log\bar p+(1-\bar p)\log(1-\bar p)-\log\bar p.
$$

$\bar p\le 1/2$ 时 $1-\bar p\ge 1/2$。对 $x\in[0,1]$，$x\log x\ge -e^{-1}$（规定 $0\log 0=0$；最小值在 $x=e^{-1}$）。因而

$$
2\bar p\log\bar p+(1-\bar p)\log(1-\bar p)
\ge -2e^{-1}-e^{-1}=-3e^{-1}>-2.
$$

（内容写 $\min x\log x\ge -e^{-1}\ge -1/3$。前半对，后半不对：$-1/e\approx-0.368<-1/3$。他们随后用 $-1$ 包住这些项，但 $h(\bar p)=2\bar p\log\bar p+(1-\bar p)\log(1-\bar p)$ 在 $\bar p=1/2$ 处约是 $-1.04$，$-1$ 不够。用 $-2$ 就严了。）于是

$$
m^* \;\ge\; \tfrac12\log(N-1)-\log\bar p-2.
$$

$\square$

**定理 1.8。** 取 $\xi=\xi^*$ 使得 $N(\xi^*)\ge 2$ 且

$$
\frac{\log N(\xi^*)}{n} \;\ge\; \frac{8C^2}{3}(\xi^*)^2
$$

（$n$ 充分大，或把 $\frac{8C^2}{3}$ 略放大以吸收 $O(1/n)$ 项）。则 $\bar p\ge 1/2$。因而存在 $k$ 使得

$$
P_k^n\Bigl(\|\widehat f-f_k\|_{L^2(\mu)}\ge \tfrac{c\xi^*}{2}\Bigr)\;\ge\;\tfrac12,
$$

并且

$$
\mathbb{E}_{P_k^n}\bigl[\|\widehat f-f_k\|_{L^2}^2\bigr]
\;\ge\; \frac{c^2(\xi^*)^2}{8}.
$$

对任意估计都成立，故 $T\ge c^2(\xi^*)^2/8$。

**证明。** 反证：设 $\bar p<1/2$。命题 1.6 + 定理 1.2 + 引理 1.7 给出

$$
\frac12\log(N-1)-\log\bar p-2
\le m^*
\le \frac{4C^2 n\xi^2}{3}.
$$

移项：

$$
\log\bar p \;\ge\; \tfrac12\log(N-1)-2-\frac{4C^2 n\xi^2}{3},
$$

$$
\bar p \;\ge\; \sqrt{N-1}\;\exp\Bigl(-2-\frac{4C^2 n\xi^2}{3}\Bigr).
$$

若

$$
\sqrt{N-1}\;\exp\Bigl(-2-\frac{4C^2 n\xi^2}{3}\Bigr)\;\ge\;\frac12,
$$

即

$$
\frac{\log(N-1)}{n}
\;\ge\; \frac{8C^2\xi^2}{3}+\frac{4-2\log 2}{n},
$$

则 $\bar p\ge 1/2$，矛盾。$N\ge 2$ 时 $\log(N-1)$ 与 $\log N$ 同阶；$O(1/n)$ 被略大的前导常数吃掉。这就是内容的工作条件 $\frac{\log N(\xi^*)}{n}\ge \frac{8C^2}{3}(\xi^*)^2$。

于是 $\bar p\ge 1/2$：存在 $k$ 使 $P_k^n(A_k^c)\ge 1/2$，即 $\|\widehat f-f_k\|_{L^2}\ge c\xi^*/2$ 的概率至少一半。令 $Z=\|\widehat f-f_k\|_{L^2}^2\ge 0$，$a=(c\xi^*/2)^2$。则 $\mathbb{P}(Z\ge a)\ge 1/2$，从而对一切 $t\in[0,a]$ 有 $\mathbb{P}(Z\ge t)\ge 1/2$。层公式：

$$
\mathbb{E}[Z]
= \int_0^\infty \mathbb{P}(Z\ge t)\,\mathrm{d}t
\ge \int_0^{a}\mathbb{P}(Z\ge t)\,\mathrm{d}t
\ge \frac{a}{2}
= \frac{c^2(\xi^*)^2}{8}.
$$

$\widehat f$ 任意，$T$ 是最坏风险的下确界，故 $T\ge c^2(\xi^*)^2/8$。**

- 指数里的 $n^2\xi^2$：同一页上一行工作条件写的是 $n(\xi^*)^2$，这里多出来的 $n$ 是 $n\xi^2$ 被挤断。正确是 $n\xi^2$。
- $\exp(1-\cdots)$ 与 $\exp(-1+\cdots)$：从 $\tfrac12\log(N-1)-1-\log\bar p\le \frac{4C^2 n\xi^2}{3}$ 移项，指数必须是 $-1-\frac{4C^2 n\xi^2}{3}$。正确的 $O(1/n)$ 是加号，见上面对 $\bar p\ge\sqrt{N-1}\exp(-2-4C^2 n\xi^2/3)$ 的整理。
- 同一页 $\min_{x\in[0,1]}x\log x\ge -e^{-1}\ge -1/3$：前半对，后半不对（$-1/e\approx-0.368<-1/3$）。用 $-1$ 包 $2\bar p\log\bar p+(1-\bar p)\log(1-\bar p)$ 也不够（$\bar p=1/2$ 处约 $-1.04$），所以上面改用 $-2$。**

$$
\bar p
\;\ge\;
\sqrt{N-1}\;
\exp\Bigl(-2-\frac{4C^2 n\xi^2}{3}\Bigr),
$$

要 $\bar p\ge 1/2$ 只需

$$
\frac{\log(N-1)}{n}
\;\ge\;
\frac{8C^2\xi^2}{3}+\frac{4-2\log 2}{n}.
$$

无论加减 $O(1/n)$，平衡 $\log N\sim n\xi^2$ 给出的 $\xi^*$ 幂次相同，故 $T\gtrsim n^{-2\alpha/(2\alpha+d)}$ 不受排版影响。

### 1.10 Hölder 类：$\xi^*=a n^{-\alpha/(d+2\alpha)}$，$T\ge O\bigl(n^{-2\alpha/(2\alpha+d)}\bigr)$

**Hölder 球（`02b` 的那一条）。** $\alpha>0$，写成 $\alpha=s+\beta$，$s\in\mathbb{N}$，$\beta\in(0,1]$。$\mathcal{H}^\alpha_1([0,1]^d)$ 是 $C^s$ 函数中，$s$ 阶导数 $\beta$-Hölder 半范 $\le 1$、且各阶导数有界的集合。它嵌入 $L^2([0,1]^d)$。

**packing 熵（数量级）。** 存在只依赖 $\alpha,d$ 的常数，使得对小 $\xi>0$，

$$
\log N(\xi) \;\asymp\; \xi^{-d/\alpha}.
$$

内容直接写 $\log N(\xi^*)=(\xi^*)^{-d/\alpha}$（把常数吞进 $\xi$ 的刻度里）。

**构造提纲（为了相信 $\xi^{-d/\alpha}$ 不是天上掉的）。**

1. 把 $[0,1]^d$ 切成 $m^d$ 个边长 $1/m$ 的小立方体，中心 $x_k$。
2. 取光滑 bump $\varphi\ge 0$ 支撑在单位立方体里。令 $\varphi_{m,k}(x)=h m^{-\alpha}\varphi\bigl(m(x-x_k)\bigr)$。$h>0$ 足够小则 $\|\varphi_{m,k}\|_{L^\infty}\le 1/2$，且 $\varphi_{m,k}\in\mathcal{H}^\alpha_1$。
3. Varshamov–Gilbert：存在 $\varepsilon\in\{0,1\}^{m^d}$ 的子集，基数 $N\ge \exp(c_0 m^d)$，两两 Hamming 距离 $\ge m^d/4$。
4. $f_\varepsilon=\sum_k \varepsilon_k\varphi_{m,k}$。支撑几乎不交，故

$$
\|f_\varepsilon-f_{\varepsilon'}\|_{L^2}^2
\asymp (\text{Hamming})\cdot (h m^{-\alpha})^2\cdot m^{-d}
\asymp m^{-2\alpha}.
$$

于是 $L^2$ 距离 $\asymp m^{-\alpha}$。令 $\xi\asymp m^{-\alpha}$，则 $\log N\asymp m^d\asymp \xi^{-d/\alpha}$。

**代入定理 1.8。** 取 $\xi^*=a n^{-\alpha/(d+2\alpha)}$。则

$$
\log N(\xi^*) \;\asymp\; (\xi^*)^{-d/\alpha} \;=\; a^{-d/\alpha}\, n^{d/(d+2\alpha)},
$$

$$
\frac{\log N(\xi^*)}{n} \;\asymp\; a^{-d/\alpha}\, n^{-2\alpha/(d+2\alpha)},
\qquad
(\xi^*)^2 \;=\; a^2 n^{-2\alpha/(d+2\alpha)}.
$$

选足够小的 $a>0$，使 $\frac{\log N}{n}\ge \frac{8C^2}{3}(\xi^*)^2$。定理 1.8 给出

$$
T \;\ge\; \frac{c^2}{8}(\xi^*)^2
\;=\; O\bigl(n^{-2\alpha/(2\alpha+d)}\bigr).
$$

**怎么记这个指数。** 风险是 $L^2$ **平方**，所以 packing 距离 $\xi$ 贡献 $\xi^2$；熵 $\xi^{-d/\alpha}$ 必须和 $n\xi^2$ 平衡：$\xi^{-d/\alpha}\sim n\xi^2\Rightarrow \xi^{2+d/\alpha}\sim n^{-1}\Rightarrow\xi\sim n^{-\alpha/(2\alpha+d)}$，平方后就是 $n^{-2\alpha/(2\alpha+d)}$。分子的 $2\alpha$ 来自光滑度（bump 高度 $m^{-\alpha}$），分母多一个 $d$ 来自立方体个数 $m^d$。

这与 `02a`+`02b` 的上界同阶，故 Hölder 非参回归的 minimax 速率是 $n^{-2\alpha/(2\alpha+d)}$。

### 1.11 一般框架

把「回归函数 + $L^2$」换成任意参数空间 $(\Theta,d(\cdot,\cdot))$，观测 $\sim P_{\theta^*}^n$，估计 $\widehat\theta$，

$$
T \;=\; \inf_{\widehat\theta}\sup_{P_{\theta^*}\in\mathcal{P}_\Theta}
\mathbb{E}_{P_{\theta^*}^n}\bigl[d^2(\widehat\theta,\theta^*)\bigr].
$$

假设：

- $\{\theta_1,\ldots,\theta_N\}$ 是 $\Theta$ 的 $\xi$-packing：$c\xi\le d(\theta_i,\theta_j)\le C\xi$；
- **KL  Lipschitz：** $\mathrm{KL}(P_{\theta_i},P_{\theta_j})\le C_\Theta\, d^2(\theta_i,\theta_j)$。

则 $n\mathrm{KL}\le C_\Theta C^2 n\xi^2$。第 1.8–1.9 节一字不改（事件 $A_i=\{d(\widehat\theta,\theta_i)<c\xi/2\}$，变分式里的 $C_\Theta$ 取代 $\frac43$），得到：

**定理 1.9。** 若 $N(\xi^*)\ge 2$ 且 $\dfrac{\log N(\xi^*)}{n}\ge 2C_\Theta(\xi^*)^2$，则 $T\ge c^2(\xi^*)^2/8$。工作条件就是 $\log N/n \gtrsim C_\Theta\xi^2$。）

**怎么用：** 只要你会 (i) 给 $\Theta$ 的 packing 熵，(ii) 验证 KL 被 $d^2$ 控制，下界就变成「解 $\log N(\xi)\sim n\xi^2$」。Lec1 的有限维 $\Theta=\mathbb{R}^d$、$d(\theta,\theta')=\|\theta-\theta'\|_\Sigma$ 时 $\log N(\xi)\sim d\log(1/\xi)$，平衡后 $\xi^2\sim d/n$，回到 $\frac{d\sigma^2}{n}$。

### 1.12 有界密度：$\mathrm{KL}(p,q)\le\int\frac{(p-q)^2}{q}$

取 $\Theta=\{p\text{ 密度}:0<c\le p\le C<\infty\}$，$d(p,q)=\|p-q\|_{L^2(\mathrm{d}x)}$。

**命题 1.10。** $\mathrm{KL}(p,q)\le \displaystyle\int\frac{(p-q)^2}{q}\,\mathrm{d}x \le \frac1c\|p-q\|_{L^2}^2$。

**证明。** $\log$ 凹，Jensen：

$$
\mathrm{KL}(p,q)
= \mathbb{E}_p\Bigl[\log\frac{p}{q}\Bigr]
\le \log\mathbb{E}_p\Bigl[\frac{p}{q}\Bigr]
= \log\int\frac{p^2}{q}\,\mathrm{d}x.
$$

而

$$
\int\frac{p^2}{q}
= \int\frac{\bigl(q+(p-q)\bigr)^2}{q}
= \int q + 2\int(p-q) + \int\frac{(p-q)^2}{q}
= 1 + \int\frac{(p-q)^2}{q},
$$

因为 $\int p=\int q=1$。故 $\mathbb{E}_p[p/q]=1+\int\frac{(p-q)^2}{q}$，

$$
\mathrm{KL}(p,q)
\le \log\Biggl(1+\int\frac{(p-q)^2}{q}\Biggr)
\le \int\frac{(p-q)^2}{q},
$$

最后一步 $\log(1+u)\le u$（$u\ge 0$）。再 $q\ge c\Rightarrow 1/q\le 1/c$。$\square$

于是 $C_\Theta=1/c$。密度被上下界夹住时，「$L^2$ 参数距离」自动给出 KL Lipschitz，定理 1.9 适用。

两点分布那一节不能直接套本命题（$Y$ 是离散的，密度对 Lebesgue 不存在），所以必须手算定理 1.2。精神相同：似然比靠近 1 时，KL 是 $L^2$ 的平方量级。

---

## 2. 凸化损失

从这里起，任务换成分类。回归的平方损失本身就凸、可导；0-1 损失不是。

### 2.1 0-1 不可训；margin 损失

标签 $Y\in\{-1,+1\}$。预测器用一个实值函数 $g:\mathcal{X}\to\mathbb{R}$ 的符号：$\mathrm{sign}(g(x))$（$g=0$ 的点怎么破无关紧要，连续分布下是零测集）。0-1 风险

$$
L(g)
= \mathbb{P}\bigl(\mathrm{sign}(g(X))\neq Y\bigr)
= \mathbb{E}\bigl[\mathbf{1}_{\{Y g(X)<0\}}\bigr]
= \mathbb{E}\bigl[\ell_{0\text{-}1}\bigl(Y g(X)\bigr)\bigr],
$$

其中 **margin 型 0-1 损失** $\ell_{0\text{-}1}(u)=\mathbf{1}_{\{u<0\}}$。乘积 $u=Yg(X)$ 叫间隔（margin）：$u>0$ 表示符号对了。

$\ell_{0\text{-}1}$ 在 $0$ 不连续、别处导数是 $0$，梯度下降走不动。这就是「不可训」。

**凸化：** 换一个凸、连续（通常还几乎处处可导）的 $\ell:\mathbb{R}\to\mathbb{R}$，定义 $\ell$-风险

$$
L_\ell(g) \;=\; \mathbb{E}\bigl[\ell\bigl(Y g(X)\bigr)\bigr],
$$

经验版 $\widehat L_\ell(g)=\frac1n\sum_i \ell(Y_i g(X_i))$。希望：把 $L_\ell$ 最小化，得到的 $g$ 的符号仍然是 Bayes 分类器。

### 2.2 classification-calibrated

记 $\eta(x)=\mathbb{P}(Y=1\mid X=x)$。对 $Y\in\{\pm 1\}$，

$$
\mathbb{E}[Y\mid X=x] \;=\; 2\eta(x)-1.
$$

Bayes 分类器是 $\mathrm{sign}(2\eta-1)$（$\eta>1/2$ 预测 $+1$）。内容写 $g^*(x)=2\eta(x)-1$，则 $g^*\in\arg\min L$（在「用 $\mathrm{sign}(g)$ 做预测」的意义下，$g^*$ 的符号最优；$g^*$ 本身不必取值 $\pm 1$）。

给定 $X$，$\ell$-风险的条件版本只依赖 $\alpha=g(X)$：

$$
C_{\eta(x)}\bigl(g(x)\bigr)
:= \mathbb{E}\bigl[\ell(Y g(X))\mid X\bigr]
= \eta(X)\,\ell\bigl(g(X)\bigr) + \bigl(1-\eta(X)\bigr)\,\ell\bigl(-g(X)\bigr).
$$

写成一元函数

$$
C_\eta(\alpha) \;=\; \eta\,\ell(\alpha) + (1-\eta)\,\ell(-\alpha),
\qquad \eta\in[0,1],\;\alpha\in\mathbb{R}.
$$

点点最小化：$g_\ell^*\in\arg\min L_\ell$ 当且仅当对 $\mu$-a.e. $x$，

$$
g_\ell^*(x)\in\arg\min_{\alpha\in\mathbb{R}} C_{\eta(x)}(\alpha).
$$

**定义（classification-calibrated）。** $\ell$ 称为 classification-calibrated，若

$$
\eta > \tfrac12 \;\Longleftrightarrow\; \arg\min_{\alpha\in\mathbb{R}} C_\eta(\alpha)\;\subset\; \mathbb{R}_{++},
$$

$$
\eta < \tfrac12 \;\Longleftrightarrow\; \arg\min_{\alpha\in\mathbb{R}} C_\eta(\alpha)\;\subset\; \mathbb{R}_{--},
$$

其中 $\mathbb{R}_{++}=(0,+\infty)$，$\mathbb{R}_{--}=(-\infty,0)$。（$\eta=1/2$ 时两类一样好，不约束。）

**人话：** $\eta>1/2$ 时，凸风险的最优 $\alpha$ 不许是负数；预测符号自动等于 Bayes。否则你可能把 $L_\ell$ 降到最低，符号却整类翻错。

### 2.3 凸损失校准 $\iff$ 在 $0$ 可微且 $\ell'(0)<0$

以下设 $\ell:\mathbb{R}\to\mathbb{R}$ **凸**（因而处处有左右导数 $\ell'_-\le\ell'_+$，且二者非降）。

**引理 2.1。** 对每个 $\eta\in[0,1]$，$C_\eta$ 凸。左右导数为

$$
\begin{aligned}
C_\eta'(0+)
&= \eta\,\ell'(0+) - (1-\eta)\,\ell'(0-),\\
C_\eta'(0-)
&= \eta\,\ell'(0-) - (1-\eta)\,\ell'(0+).
\end{aligned}
$$

**证明。** $\alpha\mapsto\ell(\alpha)$ 与 $\alpha\mapsto\ell(-\alpha)$ 都凸（后者是凸函数与仿射的复合），非负组合仍凸。差商写全：$C_\eta(0)=\ell(0)$，对 $h\neq 0$

$$
\frac{C_\eta(h)-C_\eta(0)}{h}
=
\eta\,\frac{\ell(h)-\ell(0)}{h}
+(1-\eta)\,\frac{\ell(-h)-\ell(0)}{h}.
$$

右导 $h\downarrow 0$：第一项 $\to\eta\,\ell'(0+)$。第二项改写

$$
\frac{\ell(-h)-\ell(0)}{h}
=
-\frac{\ell(-h)-\ell(0)}{-h}
\;\xrightarrow{h\downarrow 0}\;
-\ell'(0-),
$$

因为 $-h\uparrow 0$，差商走的是 $\ell$ 在 $0$ 的左导。故 $C_\eta'(0+)=\eta\,\ell'(0+)-(1-\eta)\,\ell'(0-)$。

左导 $h\uparrow 0$：令 $h=-t$，$t\downarrow 0$。第一项 $\to\eta\,\ell'(0-)$。第二项

$$
\frac{\ell(t)-\ell(0)}{-t}
=
-\frac{\ell(t)-\ell(0)}{t}
\;\to\;
-\ell'(0+),
$$

故 $C_\eta'(0-)=\eta\,\ell'(0-)-(1-\eta)\,\ell'(0+)$。$\square$

**引理 2.2（凸函数最小值的位置）。** 设 $C:\mathbb{R}\to\mathbb{R}$ 凸。则

$$
\arg\min C \;\subset\; \mathbb{R}_+
\;\iff\;
C'(0+)\;\le\; 0,
$$

$$
\arg\min C \;\subset\; \mathbb{R}_-
\;\iff\;
C'(0-)\;\ge\; 0.
$$

**证明。** 凸函数的次梯度 $\partial C(\alpha)=[C'(\alpha-),C'(\alpha+)]$，$\alpha^*$ 是最小点 $\iff 0\in\partial C(\alpha^*)$。左右导非降。

**$\Leftarrow$（校准真正用到的方向）。** $C'(0+)\le 0\Rightarrow C'(0-)\le C'(0+)\le 0$。对 $\alpha<0$，$C'(\alpha+)\le C'(0-)\le 0$，故 $C$ 在 $(-\infty,0]$ 上不增：任意负点都不是优于 $0$ 的最小点，$\arg\min\subset[0,+\infty)=\mathbb{R}_+$。对称地，$C'(0-)\ge 0\Rightarrow C'(0+)\ge 0$，$C$ 在 $[0,+\infty)$ 上不减，$\arg\min\subset\mathbb{R}_-$。

**$\Rightarrow$（几乎，边界要单独说）。** 若 $C'(0+)>0$，则对 $\alpha>0$ 有 $C'(\alpha-)\ge C'(0+)>0$，正半轴内部没有最小点。此时要么 $C'(0-)>0$（$C$ 在负半轴也在升，最小点在 $\mathbb{R}_-$），要么 $C'(0-)\le 0<C'(0+)$（$0\in\partial C(0)$，$\arg\min=\{0\}$）。

$0\in\mathbb{R}_+\cap\mathbb{R}_-$，所以 $\arg\min=\{0\}$ 时两边的 $\subset$ 都成立，内容把「$\subset\mathbb{R}_+$」与 $C'(0+)\le 0$ 写成 $\iff$ 在这一点上过强。校准定义在 $\eta\neq 1/2$ 时要的是**符号**：后面必须 $\ell'(0)<0$，把 $0$ 从 $\arg\min C_\eta$ 里赶走，最小点才真正落到 $(0,+\infty)$ 或 $(-\infty,0)$。$\square$

因而

$$
\arg\min C_\eta\subset\mathbb{R}_+
\;\iff\;
\eta\,\ell'(0+)-(1-\eta)\,\ell'(0-)\;\le\; 0,
$$

$$
\arg\min C_\eta\subset\mathbb{R}_-
\;\iff\;
\eta\,\ell'(0-)-(1-\eta)\,\ell'(0+)\;\ge\; 0.
$$

**定理 2.3。** 凸函数 $\ell$ 是 classification-calibrated，当且仅当 $\ell$ 在 $0$ 可微且 $\ell'(0)<0$。

**证明（$\Rightarrow$）。** 设 $\ell$ 已校准。令 $\eta\downarrow 1/2$ 从上方，校准要求 $\arg\min C_\eta\subset\mathbb{R}_+$，故 $C_\eta'(0+)\le 0$。取极限

$$
C_{1/2}'(0+)
= \tfrac12\bigl[\ell'(0+)-\ell'(0-)\bigr] \;\le\; 0.
$$

凸函数永远有 $\ell'(0+)-\ell'(0-)\ge 0$，两面夹死：$\ell'(0+)=\ell'(0-)$，即 $\ell$ 在 $0$ 可微。此时

$$
C_\eta'(0) \;=\; (2\eta-1)\,\ell'(0).
$$

再取 $\eta>1/2$：校准要求 $C_\eta'(0)\le 0$，而 $2\eta-1>0$，故 $\ell'(0)\le 0$。

必须是**严格**小于 $0$：若 $\ell'(0)=0$，则对一切 $\eta$ 有 $C_\eta'(0)=0$，于是 $0\in\arg\min C_\eta$。例如 $\ell(u)=u^2$，$C_\eta(\alpha)=\alpha^2$，唯一最小点是 $0$，$0$ 既不在 $(0,+\infty)$ 也不在 $(-\infty,0)$，符号不提供任何分类信息，不校准。更一般地，若 $\ell'(0)=0$ 且 $\ell$ 在 $0$ 附近不是严格凸，最小集还可能同时含正负，更糟。故 $\ell'(0)<0$。

**证明（$\Leftarrow$）。** 设 $\ell$ 在 $0$ 可微且 $\ell'(0)<0$。则 $C_\eta'(0)=(2\eta-1)\ell'(0)$。

- $\eta>1/2\Rightarrow 2\eta-1>0\Rightarrow C_\eta'(0)<0\Rightarrow\arg\min\subset\mathbb{R}_+$（其实最小点严格为正）；
- $\eta<1/2\Rightarrow C_\eta'(0)>0\Rightarrow\arg\min\subset\mathbb{R}_-$。

这正是校准。$\square$

**常见凸替代（都校准）：**

| $\ell(u)$ | 名字 | $\ell'(0)$ |
|---|---|---|
| $(1-u)_+$ | hinge（SVM） | $-1$（$0$ 在折点左侧，$\ell'(0)=-1$） |
| $\log(1+e^{-u})$ | logistic | $-\frac12$ |
| $e^{-u}$ | exponential（AdaBoost） | $-1$ |
| $(1-u)^2$ | 平方（对 $\pm 1$ 标签） | $-2$ |

hinge 在 $u=1$ 不可导，但在 $u=0$ 可导，定理用的只是 $0$ 处。$\ell(u)=|u|$ 或 $\ell(u)=u^2$ 在 $0$ 的导数不严格负（后者是 $0$），不校准。

---

## 3. 二分类超额风险

这一节标签改回 $Y\in\{0,1\}$（内容就是这样切的）。预测 $f:\mathcal{X}\to\{0,1\}$，0-1 损失 $\ell(f,Y)=\mathbf{1}_{\{f\neq Y\}}$，$L(f)=\mathbb{P}(f(X)\neq Y)$。后验 $\eta(x)=\mathbb{P}(Y=1\mid X=x)$，Bayes 规则

$$
f^*(x) \;=\; \mathbf{1}_{\{\eta(x)\ge 1/2\}}.
$$

超额风险 $\mathcal{E}(f)=L(f)-L(f^*)$（内容记 $E(f)$，这里用 $\mathcal{E}$ 以免和期望混淆）。

### 3.1 两个 $\{0,1\}$ 变量的恒等式

**引理 3.1。** $Y,Z\in\{0,1\}$ 则

$$
\mathbf{1}_{\{Y\neq Z\}} \;=\; |Y-Z| \;=\; (Y-Z)^2 \;=\; Y+Z-2YZ.
$$

**证明。** 四格验算：$(Y,Z)=(0,0),(1,1)$ 时全是 $0$；$(0,1),(1,0)$ 时全是 $1$。$\square$

### 3.2 $\mathcal{E}(f)=\mathbb{E}\bigl[|2\eta-1|\,|f^*-f|\bigr]$（完整证明）

把 $Z=f(X)$ 代入：$\mathbf{1}_{\{Y\neq f(X)\}}=Y+f(X)-2Y f(X)$。对 $f^*$ 同样写一行，相减：

$$
\begin{aligned}
\mathbf{1}_{\{Y\neq f(X)\}}-\mathbf{1}_{\{Y\neq f^*(X)\}}
&= \bigl(f(X)-f^*(X)\bigr)-2Y\bigl(f(X)-f^*(X)\bigr)\\
&= \bigl(1-2Y\bigr)\bigl(f(X)-f^*(X)\bigr)\\
&= \bigl(2Y-1\bigr)\bigl(f^*(X)-f(X)\bigr).
\end{aligned}
$$

两边取期望，左边正是 $\mathcal{E}(f)=L(f)-L(f^*)$。右边对 $Y\mid X$ 先积：$\mathbb{E}[2Y-1\mid X]=2\eta(X)-1$，故

$$
\mathcal{E}(f)
= \mathbb{E}\bigl[(2\eta(X)-1)\bigl(f^*(X)-f(X)\bigr)\bigr].
$$

**符号对齐：** $f,f^*\in\{0,1\}$，$f^*\neq f$ 时 $|f^*-f|=1$。

- 若 $\eta(X)\ge 1/2$，则 $f^*=1$。此时若 $f=0$，$f^*-f=1>0$，且 $2\eta-1\ge 0$；
- 若 $\eta(X)<1/2$，则 $f^*=0$。此时若 $f=1$，$f^*-f=-1<0$，且 $2\eta-1<0$。

所以 $(2\eta-1)(f^*-f)=|2\eta-1|\,|f^*-f|$ 几乎处处（$\eta=1/2$ 时两边都是 $0$）。因此

$$
\mathcal{E}(f)
= \mathbb{E}\bigl[|2\eta(X)-1|\,|f^*(X)-f(X)|\bigr]
= \mathbb{E}\bigl[|2\eta(X)-1|\,\mathbf{1}_{\{f^*\neq f\}}\bigr]
= \int |f^*-f|\,|2\eta-1|\,\mathrm{d}P_X.
$$

**人话：** 超额风险 = 「你和 Bayes 意见不同的那些 $x$」上，用 $|2\eta(x)-1|$ 加权。$\eta$ 靠近 $1/2$ 的点，分错了也不太疼（两类本来就差不多）；$\eta$ 靠近 $0$ 或 $1$ 的点，分错就很疼。

### 3.3 Bayes 风险 $L^*=\mathbb{E}|f^*-\eta|$

内容写 $L^*=L(f^*)=\mathbb{E}[f^*(X)-\eta(X)]$，漏了绝对值。下面按他们自己的条件概率计算写成正确的式子。

**命题 3.2。** $L(f^*)=\mathbb{E}\bigl[|f^*(X)-\eta(X)|\bigr]=\mathbb{E}\bigl[\min\bigl\{\eta(X),1-\eta(X)\bigr\}\bigr]$。

**证明。** 给定 $X$，

$$
\mathbb{P}(Y\neq f^*(X)\mid X)
=
\begin{cases}
\mathbb{P}(Y=0\mid X)=1-\eta(X), & f^*(X)=1,\\
\mathbb{P}(Y=1\mid X)=\eta(X), & f^*(X)=0.
\end{cases}
$$

$f^*=1$ 时 $\eta\ge 1/2$，$1-\eta=f^*-\eta=|f^*-\eta|$；$f^*=0$ 时 $\eta<1/2$，$\eta=\eta-f^*=|f^*-\eta|$。故条件错误率 $=|f^*-\eta|=\min(\eta,1-\eta)$。取期望。$\square$

$\mathbb{E}[f^*-\eta]$ 在 $f^*=0$ 的区域是负的，不是风险。

---

## 4. Plugin 估计

### 4.1 定义与 $L^1$ 界

Bayes 规则是 $\eta$ 的 $1/2$-阈值，自然想法：先估 $\hat\eta$，再阈值，

$$
f_{\hat\eta}(x) \;=\; \mathbf{1}_{\{\hat\eta(x)\ge 1/2\}}.
$$

**定理 4.1。** 对任意 $\hat\eta:\mathcal{X}\to\mathbb{R}$ （不必进 $[0,1]$），

$$
\mathcal{E}(f_{\hat\eta})
\;\le\; 2\mathbb{E}\bigl|\eta(X)-\hat\eta(X)\bigr|
\;=\; 2\|\eta-\hat\eta\|_{L^1(P_X)}.
$$

**证明。** $f^*\neq f_{\hat\eta}$ 当且仅当 $\eta$ 与 $\hat\eta$ 落在 $1/2$ 的两侧（一侧 $\ge$，一侧 $<$）。此时线段从 $\eta$ 到 $\hat\eta$ 必穿过 $1/2$，故

$$
\bigl|\eta-\tfrac12\bigr| \;\le\; |\eta-\hat\eta|.
$$

两边乘 $2$：$|2\eta-1|\le 2|\eta-\hat\eta|$。不一致时 $|f^*-f_{\hat\eta}|=1$，一致时左边 $0$。所以

$$
|f^*-f_{\hat\eta}|\,\bigl|\eta-\tfrac12\bigr|
\;\le\; |\eta-\hat\eta|.
$$

对 $P_X$ 积分，左边是 $\frac12\mathcal{E}(f_{\hat\eta})$（因为 $\mathcal{E}=\mathbb{E}[|2\eta-1|\,|f^*-f|]=\mathbb{E}[2|\eta-1/2|\,|f^*-f|]$）。$\square$

**充分但不必要。** $\hat\eta$ 在 $L^1$ 靠近 $\eta$ $\Rightarrow$ 分类超额风险小。反过来不必：分类只关心 $\eta-1/2$ 的符号。

反例（内容）：设 $\eta\in\{0,1\}$ a.s.（无噪声，两类完全可分）。取 $\hat\eta$ 与 $\eta$ 在 $1/2$ 同侧，但

$$
|\hat\eta(X)-\eta(X)| \;=\; \frac{1-\varepsilon}{2}\quad\text{a.s.}
$$

例如 $\eta=1$、$\hat\eta=\frac12+\frac{\varepsilon}{2}$。则 $f_{\hat\eta}=f^*$ a.s.，$\mathcal{E}(f_{\hat\eta})=0$，而 $2\|\eta-\hat\eta\|_{L^1}=1-\varepsilon$ 可以接近 $1$。plugin 的 $L^1$ 界在这个例子上松到没有信息。

**误区：** 「先把后验学准再分类」在有噪声、$\eta$ 贴着 $1/2$ 时是对的；在大间隔（$\eta$ 远离 $1/2$）时，你只需要符号，不必把 $\eta$ 估到小数点后三位。

### 4.2 Logistic MLE（内容 HW，两种约定）

**题面。** 参数模型 $\mathbb{P}(Y=1\mid X=x)=\sigma(\theta^\top x)$，$\sigma(t)=1/(1+e^{-t})$。用 MLE 估 $\theta$：

$$
\widehat\theta
\;\in\;
\arg\min_{\theta\in\mathbb{R}^d}
\frac1n\sum_{i=1}^n \ell_{\mathrm{lg}}\bigl(Y_i,\,\theta^\top x_i\bigr),
\qquad
\ell_{\mathrm{lg}}(y,t)
\;=\;
-yt+\log(1+e^t).
$$

然后 $\hat\eta(x)=\sigma(\widehat\theta^\top x)$，plugin 规则 $f_{\hat\eta}(x)=\mathbf{1}_{\{\hat\eta(x)\ge 1/2\}}=\mathbf{1}_{\{\widehat\theta^\top x\ge 0\}}$（决策边界线性）。HW 是：从条件似然推出 $\ell_{\mathrm{lg}}$，并弄清 $y\in\{0,1\}$ 与 $y\in\{\pm 1\}$ 两套写法。

**展开。** $\sigma(-t)=1-\sigma(t)$，且 $\sigma(t)\ge 1/2\iff t\ge 0$，所以 plugin 的阈值正好是超平面 $\{\widehat\theta^\top x=0\}$。下面从条件似然推出题面里的 $\ell_{\mathrm{lg}}$。i.i.d. 样本的对数似然是 $\sum_i\log\mathbb{P}(Y_i\mid X_i)$，MLE $=$ 最小化平均负对数似然，故只要把 $-\log\mathbb{P}(Y=y\mid\theta^\top x)$ 写成 $\ell_{\mathrm{lg}}(y,\theta^\top x)$。

#### 约定 A：$y\in\{0,1\}$（题面默认）

条件似然 $\mathbb{P}(Y=y\mid t)=\sigma(t)^y\bigl(1-\sigma(t)\bigr)^{1-y}$。负对数似然

$$
\begin{aligned}
-\log\mathbb{P}(Y=y\mid t)
&= -y\log\sigma(t)-(1-y)\log\bigl(1-\sigma(t)\bigr)\\
&= -y\log\frac{e^t}{1+e^t}-(1-y)\log\frac{1}{1+e^t}\\
&= -y\bigl(t-\log(1+e^t)\bigr)+(1-y)\log(1+e^t)\\
&= -yt + y\log(1+e^t) + (1-y)\log(1+e^t)\\
&= -y t +\log(1+e^t).
\end{aligned}
$$

这就是内容的

$$
\ell_{\mathrm{lg}}(y,t) \;=\; -y t + \log(1+e^t).
$$

验算两格：$y=1$ 时 $-t+\log(1+e^t)=\log(1+e^{-t})$，与 $-\log\sigma(t)$ 一致；$y=0$ 时 $\log(1+e^t)=-\log(1-\sigma(t))$。

#### 约定 B：$y\in\{\pm 1\}$

常用模型 $\mathbb{P}(Y=y\mid t)=\sigma(y t)=\frac{1}{1+e^{-y t}}$。负对数似然

$$
\ell_{\pm}(y,t) \;=\; \log\bigl(1+e^{-y t}\bigr).
$$

**两种约定给出同一个函数。** 令 $\tilde y=2y-1$ 把 $\{0,1\}$ 映到 $\{\pm 1\}$。则

- $y=1\Leftrightarrow\tilde y=+1$：$\ell_{\mathrm{lg}}(1,t)=-t+\log(1+e^t)=\log(1+e^{-t})=\ell_{\pm}(+1,t)$；
- $y=0\Leftrightarrow\tilde y=-1$：$\ell_{\mathrm{lg}}(0,t)=\log(1+e^t)=\ell_{\pm}(-1,t)$。

所以习题里写 $\ell_{\mathrm{lg}}(y,t)=-yt+\log(1+e^t)$ 默认 $y\in\{0,1\}$；写 $\log(1+e^{-yt})$ 默认 $y\in\{\pm 1\}$。不要混用（混用时 $y=-1$ 代入 $-yt+\log(1+e^t)$ 会得到 $t+\log(1+e^t)$，多了一个 $t$，错）。

作为 margin 损失，$\ell(u)=\log(1+e^{-u})$ 凸、在 $0$ 可微、$\ell'(0)=-1/2<0$，定理 2.3 保证校准。最小化 logistic 风险，最优符号仍是 Bayes。

### 4.3 LDA / QDA：从 Bayes 规则推到二次 / 线性边界

多类 $Y\in\{1,\ldots,K\}$。类条件密度 $p_k(x)=p(x\mid Y=k)$，先验 $\pi_k=\mathbb{P}(Y=k)$。Bayes 公式

$$
\mathbb{P}(Y=k\mid X=x)
= \frac{\pi_k p_k(x)}{\sum_{\ell=1}^K \pi_\ell p_\ell(x)}.
$$

分母与 $k$ 无关，故

$$
f^*(x) \;=\; \arg\max_{k\in[K]} \pi_k p_k(x).
$$

训练数据上估 $\pi_k$ 与 $p_k$，再代入，就是 plugin。

**高斯类条件：** $X\mid Y=k\sim N(\mu_k,\Sigma_k)$，

$$
p_k(x)
= (2\pi)^{-d/2}|\Sigma_k|^{-1/2}
\exp\Bigl(-\tfrac12(x-\mu_k)^\top\Sigma_k^{-1}(x-\mu_k)\Bigr).
$$

对数（丢掉与 $k$ 无关的 $-(d/2)\log(2\pi)$）

$$
\log(\pi_k p_k(x))
= -\tfrac12(x-\mu_k)^\top\Sigma_k^{-1}(x-\mu_k)
-\tfrac12\log|\Sigma_k|
+\log\pi_k.
$$

记 $c_k=-\frac12\log|\Sigma_k|+\log\pi_k$，展开二次型

$$
(x-\mu_k)^\top\Sigma_k^{-1}(x-\mu_k)
= x^\top\Sigma_k^{-1}x - 2\mu_k^\top\Sigma_k^{-1}x + \mu_k^\top\Sigma_k^{-1}\mu_k.
$$

于是

$$
f^*(x)
= \arg\max_k\Biggl\{
-\tfrac12 x^\top\Sigma_k^{-1}x + \mu_k^\top\Sigma_k^{-1}x
-\tfrac12\mu_k^\top\Sigma_k^{-1}\mu_k + c_k
\Biggr\}.
$$

这是 $x$ 的**二次**函数，决策边界 $\{x:\delta_k(x)=\delta_\ell(x)\}$ 是二次超曲面。此即 **QDA**（quadratic discriminant analysis）。实践中 $\mu_k,\Sigma_k,\pi_k$ 换成样本均值、样本协方差、频率。

**共协方差 $\Sigma_k=\Sigma$（LDA）。** $-\frac12 x^\top\Sigma^{-1}x$ 对所有 $k$ 相同，从 $\arg\max$ 里消掉。剩下 $x$ 的一次式：

$$
f^*(x)
= \arg\max_k\bigl(w_k^\top x + b_k\bigr),
$$

$$
w_k \;=\; \Sigma^{-1}\mu_k,\qquad
b_k \;=\; -\tfrac12\mu_k^\top\Sigma^{-1}\mu_k + \log\pi_k.
$$

（$c_k$ 里的 $-\frac12\log|\Sigma|$ 也不依赖 $k$，已丢。）决策边界是超平面，此即 **LDA**（linear discriminant analysis）。

**二分类 $K=2$，标签 $\{0,1\}$ 或 $\{1,2\}$。** 比较 $k=1$ 与 $k=0$：

$$
(w_1-w_0)^\top x + (b_1-b_0) \;\ge\; 0
\;\iff\;
f^*(x)=1.
$$

即 $f^*(x)=\mathbf{1}_{\{w^\top x+b\ge 0\}}$，其中

$$
w \;=\; \Sigma^{-1}(\mu_1-\mu_0),\qquad
b \;=\; -\tfrac12\mu_1^\top\Sigma^{-1}\mu_1+\tfrac12\mu_0^\top\Sigma^{-1}\mu_0+\log\frac{\pi_1}{\pi_0}.
$$

**和 logistic 的对比。** 二者都给出线性边界。LDA 假设类条件高斯、共协方差，估计的是 $\mu,\Sigma,\pi$；logistic 直接建模 $\mathbb{P}(Y=1\mid x)=\sigma(\theta^\top x)$，不声明 $X$ 的分布。类条件真是高斯时 LDA 更省样本；模型错时 logistic 往往更稳。

---

## 5. SVM

标签 $y_i\in\{-1,+1\}$，特征 $x_i\in\mathbb{R}^d$。

### 5.1 间隔的几何；硬间隔到软间隔

超平面 $\{x:w^\top x+b=0\}$，$w\neq 0$。点 $x_i$ 到超平面的欧氏距离是 $\frac{|w^\top x_i+b|}{\|w\|}$。若该点被正确分类，$y_i(w^\top x_i+b)>0$，距离就是

$$
\frac{y_i(w^\top x_i+b)}{\|w\|}.
$$

数据线性可分：存在 $(w,b)$ 使对一切 $i$，$y_i(w^\top x_i+b)>0$。**间隔（margin）**

$$
\gamma \;=\; \min_{1\le i\le n}\frac{y_i(w^\top x_i+b)}{\|w\|}
$$

是最近的正确点到超平面的距离。最大间隔分离超平面：

$$
\max_{w,b}\;\min_i\frac{y_i(w^\top x_i+b)}{\|w\|}.
$$

引进 $\gamma$ 作为优化变量（这里的 $\gamma$ 是未用 $\|w\|$ 归一的「函数间隔」）：

$$
\max_{\gamma,w,b}\;\frac{\gamma}{\|w\|}
\qquad\text{s.t.}\qquad
y_i(w^\top x_i+b)\;\ge\;\gamma,\quad i=1,\ldots,n.
$$

$(w,b,\gamma)$ 同时乘正数，约束与目标都不变。令函数间隔 $\gamma=1$（把尺度钉死），问题变成

$$
\min_{w,b}\;\|w\|
\qquad\text{s.t.}\qquad
y_i(w^\top x_i+b)\;\ge\; 1,\quad\forall i,
$$

或等价地（平方、乘 $\frac12$，不改 $\arg\min$，且可微）

$$
\min_{w,b}\;\frac12\|w\|^2
\qquad\text{s.t.}\qquad
y_i(w^\top x_i+b)\;\ge\; 1.
$$

这是凸二次规划（可行域是半空间交，凸）。几何间隔 $=1/\|w\|$：$\|w\|$ 越小，间隔越大。

**题面。** 若数据不是线性可分，引进松弛 $\xi_i\ge 0$，并把硬间隔换成

$$
\min_{w,b,\xi}\;
\frac12\|w\|^2 + C\sum_{i=1}^n \xi_i
\qquad\text{s.t.}\qquad
y_i(w^\top x_i+b)\ge 1-\xi_i,\;\;\xi_i\ge 0.
$$

**展开：硬间隔何时可行。** 硬间隔约束 $y_i(w^\top x_i+b)\ge 1$（全体 $i$）有解，当且仅当数据线性可分：若存在 $(w,b)$ 使 $y_i(w^\top x_i+b)>0$ 对一切 $i$，令 $\gamma=\min_i y_i(w^\top x_i+b)>0$，把 $(w,b)$ 除以 $\gamma$ 就得到间隔至少为 $1$ 的可行点；反过来，间隔 $\ge 1$ 的点已经给出严格的符号分离。因此**不是线性可分 $\iff$ 硬间隔 QP 的可行域是空集**，目标是 $+\infty$，没有解。这就是重点那一行必须改问题的原因。

**软间隔。** 允许点落到带子里甚至分错：把约束改成 $y_i(w^\top x_i+b)\ge 1-\xi_i$，$\xi_i\ge 0$。几何：

- $\xi_i=0$：在间隔外侧或间隔面上，硬约束满足；
- $0<\xi_i\le 1$：落进间隔带 $\{0<y_i f(x_i)<1\}$ 但仍在正确一侧；
- $\xi_i>1$：$y_i f(x_i)<0$，分错。$\xi_i$ 正好是「要把该点推回间隔面还差多少」。

可行域永远非空：例如 $w=0$、$b=0$、$\xi_i=1$。目标用 $C>0$ 惩罚 $\sum\xi_i$。$C\to\infty$ 时逼近硬间隔（不可分则最优值 $\to+\infty$）；$C$ 小则更容忍错分，$\|w\|$ 可以更小（间隔更大、边界更钝）。即使数据可分，噪声点也会逼硬间隔把边界扭得很凶，软间隔通常更稳。

### 5.2 与 hinge ERM 等价

约束 $\xi_i\ge 1-y_i(w^\top x_i+b)$ 与 $\xi_i\ge 0$ 合起来就是

$$
\xi_i \;\ge\; \max\bigl\{0,\,1-y_i(w^\top x_i+b)\bigr\}
= \bigl(1-y_i f(x_i)\bigr)_+,
$$

其中 $f(x)=w^\top x+b$。目标对 $\xi_i$ 递增，最优必取等号：

$$
\xi_i^* \;=\; \bigl(1-y_i(w^\top x_i+b)\bigr)_+.
$$

代入，无约束问题

$$
\min_{w,b}\;
\frac12\|w\|^2 + C\sum_{i=1}^n \max\bigl\{0,\,1-y_i(w^\top x_i+b)\bigr\}.
$$

写成经验风险 + 正则：

$$
\min_{w,b}\;
\frac1n\sum_{i=1}^n \ell_{\mathrm{hinge}}\bigl(y_i,\,w^\top x_i+b\bigr) + \lambda\|w\|^2,
$$

其中 $\ell_{\mathrm{hinge}}(y,t)=(1-yt)_+=\max\{0,1-yt\}$，$\lambda=\frac{1}{2nC}$。（把 $\frac12\|w\|^2+C\sum\xi$ 除以 $Cn$，经验项系数变成 $\frac1n$，正则系数变成 $\frac{1}{2nC}$。）

hinge 是凸的、在 $0$ 可微、$\ell'(0)=-1<0$，校准。SVM 就是「校准凸损失的正则 ERM」，不是另一套哲学。

### 5.3 Lagrange 对偶（完整推导）；强对偶；Gram 矩阵

**原问题（primal）：**

$$
\min_{w,\xi,b}\;
\frac12\|w\|^2 + C\sum_{i=1}^n \xi_i
\qquad\text{s.t.}\qquad
y_i(w^\top x_i+b)\ge 1-\xi_i,\;\;\xi_i\ge 0.
$$

不等式约束写成 $1-\xi_i-y_i(w^\top x_i+b)\le 0$，$-\xi_i\le 0$。乘子 $\alpha_i\ge 0$、$\mu_i\ge 0$，Lagrange 函数

$$
\begin{aligned}
\mathcal{L}(w,\xi,b;\alpha,\mu)
&= \frac12\|w\|^2 + C\sum_i\xi_i
+ \sum_i\alpha_i\bigl(1-\xi_i-y_i(w^\top x_i+b)\bigr)
- \sum_i\mu_i\xi_i\\
&= \frac12\|w\|^2
- w^\top\Biggl(\sum_i \alpha_i y_i x_i\Biggr)
- b\sum_i\alpha_i y_i
+ \sum_i\xi_i(C-\mu_i-\alpha_i)
+ \sum_i\alpha_i.
\end{aligned}
$$

原问题等于 $\inf_{w,\xi,b}\sup_{\alpha,\mu\ge 0}\mathcal{L}$（先 $\sup$ 把不可行点打到 $+\infty$）。

**强对偶。** 目标凸，约束仿射。软间隔 Slater 条件永远成立：取 $w=0$、$b=0$、$\xi_i=2>1$，所有不等式严格。故

$$
\inf_{w,\xi,b}\sup_{\alpha,\mu\ge 0}\mathcal{L}
= \sup_{\alpha,\mu\ge 0}\inf_{w,\xi,b}\mathcal{L}.
$$

（硬间隔需要数据严格可分，才能找到严格可行的 $(w,b)$。）

**对 $w,\xi,b$ 求 $\inf$。**

- 对 $w$：$\nabla_w\mathcal{L}=w-\sum_i\alpha_i y_i x_i=0$，故

$$
w^* \;=\; \sum_{i=1}^n \alpha_i y_i x_i.
$$

  代入 $\frac12\|w\|^2-w^\top(\sum\alpha_i y_i x_i)=-\frac12\bigl\|\sum\alpha_i y_i x_i\bigr\|^2$。
- 对 $b$：$\partial_b\mathcal{L}=-\sum_i\alpha_i y_i$。若 $\sum\alpha_i y_i\neq 0$，令 $b\to\pm\infty$ 可使 $\mathcal{L}\to-\infty$。故可行对偶点必须

$$
\sum_{i=1}^n \alpha_i y_i \;=\; 0,
$$

  此时 $b$ 项消失。
- 对 $\xi_i$：$\xi_i$ 的系数是 $C-\mu_i-\alpha_i$，且 $\xi_i\ge 0$。若 $C-\mu_i-\alpha_i<0$，令 $\xi_i\to+\infty$ 会使 $\mathcal{L}\to-\infty$。故 $\inf$ 有限必须 $C-\mu_i-\alpha_i\ge 0$。鞍点还要求驻点：$\partial_{\xi_i}\mathcal{L}=0$（非负约束已经交给乘子 $\mu_i\ge 0$），即

$$
C-\mu_i-\alpha_i \;=\; 0\qquad\forall i.
$$

  $\mu_i\ge 0$ 于是 $0\le\alpha_i\le C$。$\mu$ 的唯一作用是把 $\alpha_i\le C$ 写进对偶可行域。

对偶问题变成

$$
\sup_{\alpha,\mu\ge 0}
\sum_i\alpha_i -\frac12\Biggl\|\sum_i\alpha_i y_i x_i\Biggr\|^2
\qquad\text{s.t.}\qquad
C-\alpha_i-\mu_i=0,\;\;
\sum_i\alpha_i y_i=0.
$$

消掉 $\mu$，并展开平方：

$$
\Biggl\|\sum_i\alpha_i y_i x_i\Biggr\|^2
= \sum_{i,j}\alpha_i\alpha_j y_i y_j\langle x_i,x_j\rangle.
$$

**对偶（最终形式）：**

$$
\begin{aligned}
\max_{\alpha\in\mathbb{R}^n}\quad
&\sum_{i=1}^n\alpha_i -\frac12\sum_{i,j=1}^n \alpha_i\alpha_j y_i y_j\langle x_i,x_j\rangle\\
\text{s.t.}\quad
& 0\le\alpha_i\le C,\quad i=1,\ldots,n,\\
& \sum_{i=1}^n \alpha_i y_i \;=\; 0.
\end{aligned}
$$

这是盒约束 + 一个线性等式的凸二次规划。出现的数据信息只有 **Gram 矩阵** $G=(\langle x_i,x_j\rangle)_{i,j}\in\mathbb{R}^{n\times n}$。令 $\beta_i=\alpha_i y_i$（或写成 $K=G\odot yy^\top$ 的 Hadamard 积），二次项是 $\frac12\alpha^\top(G\odot yy^\top)\alpha$。

恢复：$w^*=\sum_i\alpha_i^* y_i x_i$，$b^*$ 由任意满足 $0<\alpha_k^*<C$ 的点用 $y_k((w^*)^\top x_k+b^*)=1$ 解出（下一小节 KKT）。决策函数

$$
f^*(x) \;=\; \langle w^*,x\rangle+b^* \;=\; \sum_{i=1}^n\alpha_i^* y_i\langle x_i,x\rangle + b^*.
$$

### 5.4 KKT 与「支持向量」这个名字

令 $f^*(x)=\langle w^*,x\rangle+b^*$。KKT（原可行、对偶可行、驻点、互补松弛）在强对偶下是充要的：

1. $w^*=\sum_i\alpha_i^* y_i x_i$；
2. $\alpha_i^*\bigl(1-\xi_i^*-y_i f^*(x_i)\bigr)=0$（间隔约束的互补松弛）；
3. $\mu_i^*\xi_i^*=0$，即 $(C-\alpha_i^*)\xi_i^*=0$；
4. $\alpha^*\in[0,C]^n$，$\sum_i y_i\alpha_i^*=0$，$\xi_i^*\ge 0$，以及原约束 $y_i f^*(x_i)\ge 1-\xi_i^*$。

由 2 和 3：

- $\alpha_i^*>0\Rightarrow 1-\xi_i^*-y_i f^*(x_i)=0\Rightarrow y_i f^*(x_i)=1-\xi_i^*$；
- $\alpha_i^*<C\Rightarrow\xi_i^*=0$；
- 因而 **$\alpha_i^*\in(0,C)\Rightarrow \xi_i^*=0$ 且 $y_i f^*(x_i)=1$**：点恰好在间隔面上。

再对照 $\alpha_i^*=0$ 与 $\alpha_i^*=C$：

| $\alpha_i^*$ | 几何 | 名称 |
|---|---|---|
| $=0$ | $y_i f^*(x_i)\ge 1$（间隔外侧或面上） | 非支持向量；对 $w^*$ 无贡献 |
| $\in(0,C)$ | $y_i f^*(x_i)=1$，$\xi_i^*=0$ | 间隔上的支持向量 |
| $=C$ | $y_i f^*(x_i)=1-\xi_i^*\le 1$ | 越过间隔面；可能分错（$\xi_i^*>1\Rightarrow y_i f^*<0$） |

反过来：$y_i f^*(x_i)>1\Rightarrow\alpha_i^*=0$（间隔约束不紧，互补松弛逼 $\alpha=0$）；$\alpha_i^*=0\Rightarrow y_i f^*\ge 1$。$\alpha_i^*=C\Rightarrow y_i f^*\le 1$。分错的点 $y_i f^*<0$ 一定落在 $\alpha_i^*=C$ 这一类里。

**名字：** $w^*=\sum_i\alpha_i^* y_i x_i$ 只依赖于 $\alpha_i^*>0$ 的那些训练点，这些点「撑起」最大间隔超平面，叫 **support vectors（支持向量）**。解只依赖边界附近的点，这是 SVM 的稀疏性。

---

## 6. 核技巧与 RKHS

对偶里数据只以 $\langle x_i,x_j\rangle$ 出现。若先把 $x$ 映到某个 $\phi(x)\in\mathcal{H}$，再在 $\mathcal{H}$ 里做线性 SVM，对偶里只会出现 $\langle\phi(x_i),\phi(x_j)\rangle$。若这个内积有闭式 $K(x_i,x_j)$，就不必真的造 $\phi(x)$。这是核技巧。

### 6.1 特征映射例子：$\langle\phi(x),\phi(z)\rangle=(x\cdot z)^2$

取 $x=(x_1,x_2)\in\mathbb{R}^2$，

$$
\phi(x) \;=\; \bigl(x_1^2,\; x_2^2,\; \sqrt{2}\,x_1 x_2\bigr)\in\mathbb{R}^3.
$$

则

$$
\begin{aligned}
\langle\phi(x),\phi(z)\rangle_{\mathbb{R}^3}
&= x_1^2 z_1^2 + x_2^2 z_2^2 + 2(x_1 x_2)(z_1 z_2)\\
&= (x_1 z_1 + x_2 z_2)^2
= \langle x,z\rangle^2.
\end{aligned}
$$

$\sqrt{2}$ 是为了让交叉项系数对上 $(a+b)^2=a^2+b^2+2ab$。一般 $x\in\mathbb{R}^d$，$K(x,z)=\langle x,z\rangle^2$ 对应 $\phi(x)$ 的坐标是 $\{x_j^2\}_{j}$ 与 $\{\sqrt{2}x_j x_\ell\}_{j<\ell}$，维数 $\frac{d(d+1)}{2}$。原空间里的二次决策边界，在 $\phi$ 的空间里是线性的。

一般地，需要 $\phi:\mathcal{X}\to\mathcal{H}$ 与 $K:\mathcal{X}\times\mathcal{X}\to\mathbb{R}$ 满足 $K(x,y)=\langle\phi(x),\phi(y)\rangle_{\mathcal{H}}$。核 SVM：把 $x_i$ 换成 $\phi(x_i)$，

**原问题**

$$
\min_{w,\xi,b}\frac12\|w\|_{\mathcal{H}}^2+C\sum_i\xi_i
\quad\text{s.t.}\quad
y_i\bigl(\langle w,\phi(x_i)\rangle+b\bigr)\ge 1-\xi_i,\;\;\xi_i\ge 0;
$$

**对偶**

$$
\max_{\alpha}\sum_i\alpha_i-\frac12\sum_{i,j}\alpha_i\alpha_j y_i y_j\,K(x_i,x_j)
\quad\text{s.t.}\quad
0\le\alpha_i\le C,\;\;\sum_i\alpha_i y_i=0;
$$

**决策**

$$
f^*(x)
= \langle w^*,\phi(x)\rangle+b^*
= \sum_{i=1}^n\alpha_i^* y_i K(x,x_i)+b^*,
$$

因为 $w^*=\sum_i\alpha_i^* y_i\phi(x_i)$。计算只碰 $K$，不碰 $\phi$。

### 6.2 RKHS：定义、再生性、核 = PSD

设 $\mathcal{H}$ 是由函数 $f:\mathcal{X}\to\mathbb{R}$ 组成的 Hilbert 空间（内积 $\langle\cdot,\cdot\rangle_{\mathcal{H}}$）。

**定义（RKHS）。** $\mathcal{H}$ 是 $\mathcal{X}$ 上的再生核 Hilbert 空间，若对每个 $x\in\mathcal{X}$，赋值泛函

$$
\delta_x:\mathcal{H}\to\mathbb{R},\qquad \delta_x(f)=f(x)
$$

连续（等价于 $|f(x)|\le C_x\|f\|_{\mathcal{H}}$）。

Riesz 表示：连续线性泛函 $\delta_x$ 对应唯一的 $K(\cdot,x)\in\mathcal{H}$，使得

$$
f(x) \;=\; \langle f,\, K(\cdot,x)\rangle_{\mathcal{H}},
\qquad \forall f\in\mathcal{H}.
$$

这叫 **再生性（reproducing property）**。二元函数 $K(x,y)=\langle K(\cdot,x),K(\cdot,y)\rangle_{\mathcal{H}}=K(\cdot,y)$ 在 $x$ 处的值，称为 $\mathcal{H}$ 的 **再生核**。

由再生性，$\|f_n-f\|_{\mathcal{H}}\to 0\Rightarrow f_n(x)\to f(x)$（赋值连续）：RKHS 里范数收敛 $\Rightarrow$ 逐点收敛。普通 $L^2$ 没有这件事（改一个点不改 $L^2$ 范数）。

**定义（核 / PSD）。** 对称函数 $K:\mathcal{X}\times\mathcal{X}\to\mathbb{R}$ 称为核，若它是正半定（PSD）的：对一切 $n\ge 1$、一切 $x_1,\ldots,x_n\in\mathcal{X}$，Gram 矩阵 $\bigl(K(x_i,x_j)\bigr)_{i,j}$ 半正定，即对一切 $c\in\mathbb{R}^n$，

$$
\sum_{i,j}c_i c_j K(x_i,x_j) \;\ge\; 0.
$$

**命题 6.1。** 若 $\mathcal{H}$ 有再生核 $K$，则：(i) $K$ 是核（PSD）；(ii) $\mathcal{H}$ 是 RKHS；(iii) $K(\cdot,x)$ 同时是 $\delta_x$ 的表示元和 $K$ 的特征映射 $\phi(x)=K(\cdot,x)$，因为 $K(x,y)=\langle\phi(x),\phi(y)\rangle_{\mathcal{H}}$。

**证明。** (ii) 即定义。(i)：$\sum_{i,j}c_i c_j K(x_i,x_j)=\bigl\|\sum_i c_i K(\cdot,x_i)\bigr\|_{\mathcal{H}}^2\ge 0$。对称性：$K(x,y)=\langle K(\cdot,x),K(\cdot,y)\rangle=K(y,x)$。$\square$

### 6.3 每个 RKHS 有唯一核；每个核有唯一 RKHS（HW：Moore–Aronszajn）

**题面。** Every RKHS has unique kernel $K(x,y)=\sum_{j\in J}e_j(x)e_j(y)$，其中 $(e_j)$ 是任意 ONB。Every kernel has a unique RKHS（HW）。

**命题 6.2（RKHS $\Rightarrow$ 唯一核）。** 再生核唯一。若 $(e_j)_{j\in J}$ 是 $\mathcal{H}$ 的标准正交基，则

$$
K(x,y) \;=\; \sum_{j\in J} e_j(x)\,e_j(y).
$$

**证明。** 若 $K,\widetilde K$ 都再生，则对每个 $x$，$K(\cdot,x)$ 与 $\widetilde K(\cdot,x)$ 都表示 $\delta_x$。Riesz 表示元唯一，故 $K(\cdot,x)=\widetilde K(\cdot,x)$，逐点 $K(x,y)=\widetilde K(x,y)$。

ONB 展开：$K(\cdot,y)=\sum_j\langle K(\cdot,y),e_j\rangle_{\mathcal{H}} e_j=\sum_j e_j(y)\,e_j$（再生性 $\langle K(\cdot,y),e_j\rangle=e_j(y)$）。级数在 $\mathcal{H}$ 中收敛；赋值连续，故在每个 $x$ 处 $K(x,y)=\sum_j e_j(x)e_j(y)$。平方可和：$\sum_j e_j(y)^2=\|K(\cdot,y)\|_{\mathcal{H}}^2=K(y,y)<\infty$。$\square$

**定理 6.3（Moore–Aronszajn；内容 HW）。** 每个 PSD 核 $K$ 存在唯一的 RKHS 以 $K$ 为再生核。

RKHS $\Rightarrow$ 唯一核已是命题 6.2。下面写核 $\Rightarrow$ 唯一 RKHS。先处理「同一个函数两个展开」时双线性型是否良定义，否则后面的再生性会循环。

**存在性。**

**第一步（预 Hilbert 空间）。** 令

$$
\mathcal{H}_0
= \Biggl\{
\sum_{i=1}^n a_i K(\cdot,x_i)
:\; n\in\mathbb{N},\; a_i\in\mathbb{R},\; x_i\in\mathcal{X}
\Biggr\}
$$

（有限线性组合，作为 $\mathcal{X}$ 上的函数）。对 $f=\sum_i a_i K(\cdot,x_i)$、$g=\sum_j b_j K(\cdot,y_j)$ 先**形式地**写

$$
\langle f,g\rangle_0
\;:=\;
\sum_{i,j} a_i b_j K(x_i,y_j).
$$

**第二步（半内积，且不依赖展开）。** PSD 给出 $\langle f,f\rangle_0=a^\top\bigl(K(x_i,x_j)\bigr)a\ge 0$，所以这是半内积，Cauchy–Schwarz $|\langle f,g\rangle_0|^2\le\langle f,f\rangle_0\langle g,g\rangle_0$ 对半内积成立。

良定义：设 $f$ 另有展开 $\sum_k c_k K(\cdot,z_k)$，差 $h=\sum_i a_i K(\cdot,x_i)-\sum_k c_k K(\cdot,z_k)$ 是**零函数**。把 $h=\sum_\ell d_\ell K(\cdot,u_\ell)$。零函数意味着每个点 $h(u_\ell)=0$，而

$$
\langle h,h\rangle_0
=\sum_{\ell,m}d_\ell d_m K(u_\ell,u_m)
=\sum_\ell d_\ell h(u_\ell)
=0.
$$

再对任意 $g$ 用半内积 Cauchy–Schwarz：$|\langle h,g\rangle_0|^2\le\langle h,h\rangle_0\langle g,g\rangle_0=0$，故 $\langle h,g\rangle_0=0$。两个展开算出的 $\langle f,g\rangle_0$ 相同。

**第三步（正定 + 再生）。** 已有 $\langle f,f\rangle_0\ge 0$。若 $\langle f,f\rangle_0=0$，则对任意 $x$，

$$
\bigl|f(x)\bigr|^2
=\bigl|\langle f,K(\cdot,x)\rangle_0\bigr|^2
\le\langle f,f\rangle_0\,K(x,x)
=0,
$$

这里用的 $\langle f,K(\cdot,x)\rangle_0=f(x)$ 就是定义：$f=\sum_i a_i K(\cdot,x_i)$ 时右边等于 $\sum_i a_i K(x_i,x)$。于是 $f\equiv 0$（作为函数），$\langle\cdot,\cdot\rangle_0$ 正定。再生性在 $\mathcal{H}_0$ 上就是上式。

**第四步（完备化，实现成函数）。** 令 $\mathcal{H}$ 为 $\mathcal{H}_0$ 按 $\|\cdot\|_0$ 的抽象完备化。$\mathcal{H}_0$ 中 Cauchy 列满足

$$
|f_n(x)-f_m(x)|
=\bigl|\langle f_n-f_m,K(\cdot,x)\rangle_0\bigr|
\le\|f_n-f_m\|_0\sqrt{K(x,x)},
$$

故对每个 $x$，$(f_n(x))$ 是 $\mathbb{R}$ 里的 Cauchy 列，极限定义为 $f(x)$。不同的抽象 Cauchy 列若 $\|\cdot\|_0$-等价，逐点极限相同，所以完备化的每个元素是一个真正的函数。赋值 $\delta_x$ 在极限下仍连续（同一不等式令 $m\to\infty$），$K(\cdot,x)\in\mathcal{H}_0\subset\mathcal{H}$，再生性从 $\mathcal{H}_0$ 按连续性延拓到 $\mathcal{H}$。于是 $\mathcal{H}$ 是以 $K$ 为再生核的 RKHS。

**唯一性。** 设 $\mathcal{H},\mathcal{H}'$ 都以 $K$ 为再生核。则每个 $K(\cdot,x)$ 同时属于两者，故 $\mathcal{H}_0\subset\mathcal{H}\cap\mathcal{H}'$。在 $\mathcal{H}_0$ 上两个内积都等于 $\sum a_i b_j K(x_i,y_j)$（再生性：$\langle K(\cdot,x_i),K(\cdot,y_j)\rangle=K(x_i,y_j)$），范数相同。

$\mathcal{H}_0$ 在 $\mathcal{H}$ 中稠密：若 $f\in\mathcal{H}$ 满足 $f\perp\mathcal{H}_0$，则 $f(x)=\langle f,K(\cdot,x)\rangle_{\mathcal{H}}=0$ 对一切 $x$，故 $f=0$。同理 $\mathcal{H}_0$ 在 $\mathcal{H}'$ 中稠密。因此 $\mathcal{H}$ 与 $\mathcal{H}'$ 都是同一预 Hilbert 空间 $\mathcal{H}_0$ 的完备化；逐点实现也唯一（Cauchy 列的逐点极限）。作为函数空间 $\mathcal{H}=\mathcal{H}'$，内积重合。$\square$

### 6.4 表示定理

**定理 6.4（Representer theorem）。** 设 $\mathcal{H}$ 是 $\mathcal{X}$ 上的 RKHS，核为 $K$。$L:\mathbb{R}^n\to\mathbb{R}$ 任意，$\omega:[0,+\infty)\to\mathbb{R}$ 递增。考虑

$$
\min_{f\in\mathcal{H}}
\; L\bigl(f(x_1),\ldots,f(x_n)\bigr) + \omega\bigl(\|f\|_{\mathcal{H}}^2\bigr).
$$

若最小点存在，则存在一个最小点落在 $\mathrm{span}\{K(\cdot,x_1),\ldots,K(\cdot,x_n)\}$ 里；若 $\omega$ 严格递增，则所有最小点都在这个有限维子空间中（正交补分量为 $0$）。

**证明。** 记 $\ell_x(f)=L(f(x_1),\ldots,f(x_n))$，

$$
L_x \;:=\; \mathrm{span}\bigl\{K(\cdot,x_i):i=1,\ldots,n\bigr\}.
$$

这是 $\mathcal{H}$ 的有限维闭子空间。把任意 $f$ 正交分解：

$$
f \;=\; f_1 + f_\perp,\qquad f_1\in L_x,\qquad f_\perp\perp L_x.
$$

再生性：$f_\perp(x_i)=\langle f_\perp, K(\cdot,x_i)\rangle_{\mathcal{H}}=0$。故 $f(x_i)=f_1(x_i)$，从而 $\ell_x(f)=\ell_x(f_1)$。Pythagoras：

$$
\|f\|_{\mathcal{H}}^2 \;=\; \|f_1\|_{\mathcal{H}}^2 + \|f_\perp\|_{\mathcal{H}}^2 \;\ge\; \|f_1\|_{\mathcal{H}}^2.
$$

$\omega$ 递增，故 $\omega(\|f\|^2)\ge\omega(\|f_1\|^2)$。目标函数在 $f_1$ 处不大于在 $f$ 处。若 $f$ 已是最小点，$f_1$ 也是；若 $\omega$ 严格递增且 $\|f_\perp\|>0$，则不等式严格，$f$ 不可能最优。因此最优解可取（在严格递增时必须取）$f_\perp=0$，即 $f^*\in L_x$。$\square$

**人话：** 损失只看见 $f$ 在 $n$ 个训练点上的值；与 $L_x$ 正交的方向在这些点上是 $0$，却白白增大 $\|f\|_{\mathcal{H}}$。正则化会把它们杀掉。于是无穷维优化塌缩成 $n$ 个系数。

### 6.5 HW：从 RKHS 正则 hinge 推出核 SVM 对偶

**题面。** (HW!) SVM with kernels can be derived from

$$
\min_{f\in\mathcal{H}}
\frac1n\sum_{i=1}^n \ell_{\mathrm{hinge}}\bigl(y_i,f(x_i)\bigr) + \lambda\|f\|_{\mathcal{H}}^2,
\qquad
\lambda=\frac{1}{2nC},\quad
\ell_{\mathrm{hinge}}(y,t)=(1-yt)_+=\max\{0,1-yt\}.
$$

这是**没有显式偏置 $b$** 的版本。、 的核 SVM 把 $b$ 单独留下、不进 $\|f\|_{\mathcal{H}}$。两种都写。

**展开（无偏置）。** 表示定理：最优 $f$ 可取 $f=\sum_{j=1}^n \beta_j K(\cdot,x_j)$。先把无约束 hinge 写成带松弛的约束问题，与 5.2 节同一换算：令 $\xi_i\ge(1-y_i f(x_i))_+$，目标对 $\xi$ 递增，最优 $\xi_i=(1-y_i f(x_i))_+$。原目标乘 $nC$（不改 $\arg\min$）：

$$
nC\Biggl(\frac1n\sum_i\xi_i+\lambda\|f\|_{\mathcal{H}}^2\Biggr)
=
C\sum_i\xi_i+\frac12\|f\|_{\mathcal{H}}^2,
$$

因为 $nC\lambda=nC\cdot\frac{1}{2nC}=\frac12$。于是

$$
\min_{f,\xi}\;
\frac12\|f\|_{\mathcal{H}}^2 + C\sum_i\xi_i
\quad\text{s.t.}\quad
y_i f(x_i)\ge 1-\xi_i,\;\;\xi_i\ge 0.
$$

Lagrange（$\alpha_i\ge 0$、$\mu_i\ge 0$）

$$
\mathcal{L}(f,\xi;\alpha,\mu)
= \frac12\|f\|_{\mathcal{H}}^2 + C\sum_i\xi_i
+ \sum_i\alpha_i\bigl(1-\xi_i-y_i f(x_i)\bigr)
- \sum_i\mu_i\xi_i.
$$

对 $f$ 的 Gâteaux 导数：沿任意 $h\in\mathcal{H}$，

$$
\begin{aligned}
\frac{\mathrm{d}}{\mathrm{d}\varepsilon}\Big|_{\varepsilon=0}
\mathcal{L}(f+\varepsilon h,\xi;\alpha,\mu)
&=
\langle f,h\rangle_{\mathcal{H}}
-\sum_i\alpha_i y_i\, h(x_i)\\
&=
\Bigl\langle f-\sum_i\alpha_i y_i K(\cdot,x_i),\; h\Bigr\rangle_{\mathcal{H}},
\end{aligned}
$$

第二步用再生性 $h(x_i)=\langle h,K(\cdot,x_i)\rangle_{\mathcal{H}}$。要对一切 $h$ 为零，必须

$$
f^* \;=\; \sum_{i=1}^n \alpha_i y_i K(\cdot,x_i).
$$

对 $\xi_i$：系数 $C-\alpha_i-\mu_i$ 必须为 $0$（否则 $\xi_i\to\pm\infty$ 使 $\mathcal{L}\to-\infty$），故 $\mu_i=C-\alpha_i\ge 0$，即 $0\le\alpha_i\le C$。没有 $b$，就没有 $\sum\alpha_i y_i=0$。

代入：$\|f^*\|_{\mathcal{H}}^2=\sum_{i,j}\alpha_i\alpha_j y_i y_j K(x_i,x_j)$，且 $\frac12\|f^*\|^2-\sum_i\alpha_i y_i f^*(x_i)=-\frac12\|f^*\|^2$（因为 $f^*(x_i)=\langle f^*,K(\cdot,x_i)\rangle=\sum_j\alpha_j y_j K(x_i,x_j)$）。对偶

$$
\max_{\alpha}\sum_i\alpha_i-\frac12\sum_{i,j}\alpha_i\alpha_j y_i y_j K(x_i,x_j)
\qquad\text{s.t.}\qquad
0\le\alpha_i\le C.
$$

决策 $f^*(x)=\sum_i\alpha_i^* y_i K(x,x_i)$。

**展开。**

$$
\min_{f\in\mathcal{H},\,b,\,\xi}
\frac12\|f\|_{\mathcal{H}}^2 + C\sum_i\xi_i
\quad\text{s.t.}\quad
y_i\bigl(f(x_i)+b\bigr)\ge 1-\xi_i,\;\;\xi_i\ge 0.
$$

表示定理仍只约束 $f$（$b$ 是额外标量，不进 $\|\cdot\|_{\mathcal{H}}$）：$f\in\mathrm{span}\{K(\cdot,x_i)\}$。Lagrange 比上面多 $-\,b\sum_i\alpha_i y_i$。对 $b$ 求 $\inf$：若 $\sum_i\alpha_i y_i\neq 0$，令 $b\to\pm\infty$ 可使 $\mathcal{L}\to-\infty$，故对偶可行必须

$$
\sum_i\alpha_i y_i \;=\; 0;
$$

对 $f$ 的 Gâteaux 与无偏置相同，仍得 $f^*=\sum_i\alpha_i y_i K(\cdot,x_i)$。对偶正是第 6.1 节那个带 $\sum\alpha_i y_i=0$ 的核 SVM 对偶。KKT 同样给出 $\alpha_i\in(0,C)\Rightarrow y_i(f^*(x_i)+b^*)=1$。

至此：RKHS 正则 hinge ERM = 核 SVM；对偶只依赖 Gram 矩阵 $(K(x_i,x_j))$；预测是核的有限展开。第 5 节的线性 SVM 是 $K(x,z)=\langle x,z\rangle$、$\mathcal{H}$ 为 $\mathbb{R}^d$ 上的线性函数（不含常数项，常数放进 $b$）的特例。

---

## 7. Lec2（下）收束：你应该记住的一张表

| 主题 | 结论 | 要点 |
|------|------|------|
| 非参回归 minimax | $T\gtrsim n^{-2\alpha/(2\alpha+d)}$ | packing + 两点分布 + KL $\le\frac43\|f_i-f_j\|_2^2$ + 变分式 |
| 一般下界 | $\log N(\xi)\gtrsim n\xi^2\Rightarrow T\gtrsim\xi^2$ | 只需 $\mathrm{KL}(P_{\theta_i},P_{\theta_j})\le C_\Theta d^2(\theta_i,\theta_j)$ |
| 有界密度 | $\mathrm{KL}(p,q)\le\int(p-q)^2/q$ | Jensen + $\log(1+u)\le u$ |
| 凸化 | 凸 $\ell$ 校准 $\iff$ $\ell'(0)$ 存在且 $<0$ | 看 $C_\eta$ 在 $0$ 的左右导 |
| 超额风险 | $\mathcal{E}(f)=\mathbb{E}[|2\eta-1|\,|f^*-f|]$ | $\mathbf{1}_{Y\neq Z}=Y+Z-2YZ$ |
| Bayes 风险 | $L^*=\mathbb{E}|f^*-\eta|=\mathbb{E}\min(\eta,1-\eta)$ | 内容漏了绝对值 |
| plugin | $\mathcal{E}(f_{\hat\eta})\le 2\|\eta-\hat\eta\|_{L^1}$ | 充分不必需；可分时只需符号 |
| logistic | $\ell_{\mathrm{lg}}=-yt+\log(1+e^t)$（$y\in\{0,1\}$） | $\{\pm 1\}$ 时写 $\log(1+e^{-yt})$ |
| QDA / LDA | Bayes + 高斯 $\Rightarrow$ 二次 / 线性边界 | $\Sigma_k=\Sigma$ 时 $x^\top\Sigma^{-1}x$ 消掉 |
| SVM | 最大间隔 = 正则 hinge ERM | $\xi_i=(1-y_i f_i)_+$，$\lambda=1/(2nC)$ |
| 对偶 | $\max_\alpha\sum\alpha_i-\frac12\alpha^\top(G\odot yy^\top)\alpha$ | $0\le\alpha_i\le C$，$\sum\alpha_i y_i=0$ |
| 支持向量 | $\alpha_i\in(0,C)\Rightarrow y_i f(x_i)=1$ | $w$ 只由 $\alpha_i>0$ 的点张成 |
| 核 | 对偶里 $\langle x_i,x_j\rangle\mapsto K(x_i,x_j)$ | $\phi(x)=(x_1^2,x_2^2,\sqrt{2}x_1 x_2)$ 给出 $(x\cdot z)^2$ |
| RKHS | 赋值连续 $\iff$ 再生核；核 $\iff$ PSD | 每个核 $\leftrightarrow$ 唯一 RKHS（Moore–Aronszajn） |
| 表示定理 | 最优 $f^*$ 在 $\mathrm{span}\{K(\cdot,x_i)\}$ | 正交补在训练点上是 $0$，只涨范数 |

**和 Lec2 上半的对接。** 统计误差上界用覆盖数 / Rademacher；下界用 packing 数。对 Hölder 球二者同阶 $\xi^{-d/\alpha}$，所以速率钉死在 $n^{-2\alpha/(2\alpha+d)}$。分类这边，0-1 超额风险被校准凸损失「代理」；SVM 是代理 + RKHS 范数正则，表示定理保证解是有限核展开。

下一份：[03_Lec3_表示学习](/blog/fods-representation-learning/)——有标签时的充分降维，没标签时的对比学习与分布匹配。
