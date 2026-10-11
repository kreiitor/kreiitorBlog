---
title: "习题与证明：HW、Check 与 Hint 汇总"
description: "集中整理课程中的习题、提示与省略证明，便于逐题练习与复盘。"
pubDate: 2026-10-11
tags:
  - 数据科学
  - 学习理论
  - FODS
category: course
series: fods
order: 10
cover: /covers/post-math.svg
---

对应讲义 `Fods_26.pdf`。这份只收**老师标红、写成 HW / Check / Hint / 问号**的条目，证明按笔记里补全的版本写。记号跟原片。

纯装饰性的红字（文献编号、`n\ll d`、`\lambda_{\min}(\Sigma)` 这种强调）不单独开节，放在文末「只标红、不是作业」表。

Typora：正文公式用 `$...$` 和顶格 `$$...$$`。推送记号原片是 `#`，这里写成 `\sharp`（Typora 公式里不能写 `#`）。

| 标记 | 老师在干什么 | 你怎么用这份 |
|------|----------------|--------------|
| **HW / HW!** | 课堂上要自己补的证明或推导 | 先盖住证明自己写，再对答案 |
| **补充 HW** | 原片没标 HW、但与 p.3 平方损失对照的题 | §1.0 绝对值损失 $\Rightarrow$ 条件中位数 |
| **Check / check!** | 验证一个等式或例子 | 同上 |
| **Hint** | 证明提示，原片往往停在 Hint | 这里把 Hint 写成完整证明 |
| **?** | 原片空着（如核范数近端） | 直接给结论和证明 |
| **红字定理/公式** | 强调关键步骤或文献 | 把跳步补全 |

更细的讲解在 `01`–`06`。页码按 `Fods_26.pdf`。

---

## 一、Lec1 线性模型

## 1.0 补充 HW（对照 p.3 平方损失）：绝对值损失的 Bayes 规则

原片 p.3 只写了平方损失时 $f^*(x)=\mathbb{E}[Y\mid X=x]$。课堂对照题：**绝对值损失的 $f^*$ 是什么？证明。**

**题面。** $\mathcal{Y}=\mathbb{R}$，$\ell(a,y)=|a-y|$。证明

$$
f^*(x)\in\mathrm{Median}(Y\mid X=x).
$$

即 $m=f^*(x)$ 满足 $\mathbb{P}(Y\le m\mid X=x)\ge\tfrac12$ 且 $\mathbb{P}(Y\ge m\mid X=x)\ge\tfrac12$。连续时 $F_{Y\mid x}(m)=\tfrac12$。

**证明（切三块）。** 点点最优：$f^*(x)=\arg\min_a\mathbb{E}[|Y-a|\mid X=x]$。以下概率、期望都条件于 $X=x$，把条件省略。取一个中位数 $m$。只需对任意 $a>m$ 证明 $\mathbb{E}[|Y-a|]\ge\mathbb{E}[|Y-m|]$（$a<m$ 用 $-Y$、$-m$、$-a$ 化归到这一边：$-m$ 仍是 $-Y$ 的中位数）。

按 $y$ 相对 $m,a$ 分三块：

$$
|y-a|-|y-m|
=
\begin{cases}
(y-a)-(y-m)=m-a, & y\ge a,\\
(a-y)-(y-m)=a+m-2y, & m\le y<a,\\
(a-y)-(m-y)=a-m, & y<m.
\end{cases}
$$

中间块 $y<a$，故 $a+m-2y>a+m-2a=m-a$。因此三种情形都 $\ge m-a$ 在 $\{Y\ge m\}$ 上、$\ge a-m$ 在 $\{Y<m\}$ 上：

$$
|Y-a|-|Y-m|
\;\ge\;
(m-a)\,1_{\{Y\ge m\}}+(a-m)\,1_{\{Y<m\}}
=(m-a)\bigl(2\cdot 1_{\{Y\ge m\}}-1\bigr).
$$

取期望。$a-m>0$，且中位数给出 $\mathbb{P}(Y\ge m)\ge 1/2$，故

$$
\mathbb{E}[|Y-a|-|Y-m|]
\ge (m-a)\bigl(2\mathbb{P}(Y\ge m)-1\bigr)\ge 0.
$$

等号在例如 $a=m$ 时成立。任意中位数都是全局最小。$\square$

**另一条路（有密度时）。** 设 $Y\mid x$ 有密度 $p$、$F$ 为 CDF。在积分号下对 $a$ 求导（控制收敛：差商被 $1$ 控制）

$$
\frac{\partial}{\partial a}\mathbb{E}[|Y-a|]
=\mathbb{E}\bigl[\mathrm{sign}(a-Y)\bigr]
=\mathbb{P}(Y<a)-\mathbb{P}(Y>a)
=2F(a)-1.
$$

（在 $a=Y$ 的点，次梯度是 $[-1,1]$，单点不影响积分。）导数在 $F(a)=1/2$ 处过零；二阶意义下 $F$ 递增，故是最小。

**对照平方。** 平方：$\mathbb{E}[(a-Y)^2]=\bigl(a-\mathbb{E}Y\bigr)^2+\mathrm{Var}(Y)$，最小在均值。绝对值不放大离群点，最小在中位数。

---

## 1.1 p.10 HW：高斯条件分布

**题面。** $(Y,Z)$ 联合高斯。写出 $Z\mid Y$ 的条件均值、条件协方差。

**结论。** 均值 $(\mu_Y,\mu_Z)$，协方差分块
$\Sigma=\begin{pmatrix}\Sigma_{YY}&\Sigma_{YZ}\\\Sigma_{ZY}&\Sigma_{ZZ}\end{pmatrix}$。则

$$
Z\mid Y=y\sim N(\mu_{Z\mid Y},\Sigma_{Z\mid Y}),
$$

$$
\mu_{Z\mid Y}=\mu_Z+\Sigma_{ZY}\Sigma_{YY}^{-1}(y-\mu_Y),\qquad
\Sigma_{Z\mid Y}=\Sigma_{ZZ}-\Sigma_{ZY}\Sigma_{YY}^{-1}\Sigma_{YZ}.
$$

**证明。** 中心化 $\widetilde Y=Y-\mu_Y$，$\widetilde Z=Z-\mu_Z$。联合高斯的线性变换仍联合高斯。令

$$
W=\widetilde Z-\Sigma_{ZY}\Sigma_{YY}^{-1}\widetilde Y.
$$

则 $\mathbb{E}W=0$，且

$$
\mathrm{Cov}(W,\widetilde Y)
=\Sigma_{ZY}-\Sigma_{ZY}\Sigma_{YY}^{-1}\Sigma_{YY}=0.
$$

联合高斯且协方差为零 $\Rightarrow$ $W\perp\widetilde Y$。因此 $W\mid\widetilde Y=\widetilde y$ 的分布就是 $W$ 的无条件分布：$N(0,\mathrm{Cov}(W))$，其中

$$
\begin{aligned}
\mathrm{Cov}(W)
&=\mathrm{Cov}(\widetilde Z)-\Sigma_{ZY}\Sigma_{YY}^{-1}\mathrm{Cov}(\widetilde Y,\widetilde Z)\\
&\quad-\mathrm{Cov}(\widetilde Z,\widetilde Y)\Sigma_{YY}^{-1}\Sigma_{YZ}
+\Sigma_{ZY}\Sigma_{YY}^{-1}\Sigma_{YY}\Sigma_{YY}^{-1}\Sigma_{YZ}\\
&=\Sigma_{ZZ}-\Sigma_{ZY}\Sigma_{YY}^{-1}\Sigma_{YZ}.
\end{aligned}
$$

由 $Z=\mu_Z+W+\Sigma_{ZY}\Sigma_{YY}^{-1}(Y-\mu_Y)$，条件于 $Y=y$ 即得均值、协方差公式。$\square$

**接到 minimax。** 先验 $\theta^*\sim N(0,\frac{\sigma^2}{\lambda n}I)$ 与 $\varepsilon\sim N(0,\sigma^2 I)$ 独立，$Y=X\theta^*+\varepsilon$。联合协方差是讲义那块 $\frac{\sigma^2}{\lambda n}\begin{pmatrix}XX^\top+n\lambda I&X\\X^\top&I\end{pmatrix}$。条件均值 $A^*(y)=(X^\top X+n\lambda I)^{-1}X^\top y$ 即 Ridge。贝叶斯风险等于

$$
\frac{\sigma^2}{n}\mathrm{tr}\bigl[(\Sigma+\lambda I)^{-1}\Sigma\bigr]\xrightarrow{\lambda\to 0}\frac{d\sigma^2}{n}
$$

（$\Sigma$ 可逆）。详见 `01` §6。

## 1.2 p.11 红字：$\log(ed/(2k))$

**题面。** $K=B_0(k)=\{\theta:\|\theta\|_0\le k\}$ 的约束最小二乘，高概率界里出现 $\log(ed/(2k))$。

**证明。** 两个 $k$-稀疏向量之差至多 $2k$ 个非零，故 $A_k=\mathrm{supp}(\widehat\theta_K-\theta^*)$ 满足 $|A_k|\le 2k$。在这个支撑上问题回到维数 $\le 2k$ 的最小二乘。令 $\Phi$ 为 $X_{A_k}$ 列空间的标准正交基，$r_k\le 2k$，$\tilde\varepsilon=\Phi^\top\varepsilon\sim\mathrm{subG}_{r_k}(\sigma^2)$。与 OLS 相同：

$$
\|X(\widehat\theta_K-\theta^*)\|_2\le 2\max_{A:\,r(A)\le 2k}\sup_{\|v\|_2\le 1}\tilde\varepsilon_A^\top v.
$$

固定 $A$，球面 $\tfrac12$-网基数 $\le 5^{r_k}\le 6^{r_k}$，并集给出

$$
\mathbb{P}\bigl(\sup_{\|v\|_2\le 1}\tilde\varepsilon_A^\top v>t\bigr)\le 6^{r_k}e^{-t^2/(8\sigma^2)}.
$$

支撑个数 $\le\binom{d}{2k}$。Stirling：$\binom{d}{m}\le(ed/m)^m$，故 $\binom{d}{2k}\le(ed/(2k))^{2k}$。并集：

$$
\mathbb{P}(\max_A\sup_v\tilde\varepsilon_A^\top v>t)
\le\Bigl(\frac{ed}{2k}\Bigr)^{2k}6^{2k}e^{-t^2/(8\sigma^2)}.
$$

令右边 $\le\delta$，取对数：

$$
t^2\gtrsim\sigma^2\Bigl(k\log\frac{ed}{2k}+k\log 6+\log\frac1\delta\Bigr).
$$

再 $\|v\|_\Sigma^2=\frac1n\|Xv\|_2^2\le 4t^2/n$（讲义把 $t$ 写成了 $t^2$ 的阶）。这就是「不知道哪 $k$ 个坐标非零」的 $\log(d/k)$ 税。

## 1.3 p.12 Check：Lasso，$\lambda=2\sigma\sqrt{2\ln(2d/\delta)/n}$

**题面（红字）。** $n\ll d$。$\lambda=2\sigma\sqrt{2\ln(2d/\delta)/n}$ 时，RE 条件下

$$
\|\widehat\theta_L-\theta^*\|_2\le\frac6\gamma\sqrt{2\ln(2d/\delta)}\,\sigma\sqrt{\frac{s}{n}}.
$$

**事件。** 列 $\sqrt n$-归一化时 $X_{\cdot j}^\top\varepsilon/n$ 是次高斯，并集 $2d$ 个坐标：

$$
\mathbb{P}\Bigl(\Bigl\|\frac{X^\top\varepsilon}{n}\Bigr\|_\infty>\sigma\sqrt{\frac{2\ln(2d/\delta)}{n}}\Bigr)\le\delta.
$$

取 $\lambda=2\lambda^*$ 则在该事件上 $\lambda\ge 2\|X^\top\varepsilon/n\|_\infty$。

**基本不等式。** 目标是 $\frac1{2n}\|Y-X\theta\|_2^2+\lambda\|\theta\|_1$。最优性：$\widehat\theta_L$ 的目标值 $\le\theta^*$ 的目标值。展开 $\|X\theta^*+\varepsilon-X\widehat\theta_L\|_2^2$，与 $\|\varepsilon\|_2^2$ 相消，记 $v=\widehat\theta_L-\theta^*$、$A^*=\mathrm{supp}(\theta^*)$、$s=|A^*|$，得到

$$
\|v\|_\Sigma^2\le 2\Bigl\langle\frac{X^\top\varepsilon}{n},v\Bigr\rangle+2\lambda\bigl(\|\theta^*\|_1-\|\widehat\theta_L\|_1\bigr).
$$

（原片少写了这个 $2$；没有它，后面的 $6/\gamma$ 对不上。）在事件 $\mathcal{A}$ 上 $\langle X^\top\varepsilon/n,v\rangle\le(\lambda/2)\|v\|_1$，故

$$
\|v\|_\Sigma^2\le\lambda\|v\|_1+2\lambda\bigl(\|\theta^*\|_1-\|\widehat\theta_L\|_1\bigr).
$$

把 $\ell_1$ 拆成支撑内外：$\|v\|_1=\|v_{A^*}\|_1+\|v_{A^{*c}}\|_1$，且 $\|\theta^*\|_1-\|\widehat\theta_L\|_1\le\|v_{A^*}\|_1-\|v_{A^{*c}}\|_1$。代入整理：

$$
\|v\|_\Sigma^2+\frac\lambda2\|v_{A^{*c}}\|_1\le\frac{3\lambda}2\|v_{A^*}\|_1.
$$

特别地 $\|v_{A^{*c}}\|_1\le 3\|v_{A^*}\|_1$，即 $v$ 落在锥

$$
\mathcal{C}=\bigl\{v:\|v_{A^{*c}}\|_1\le 3\|v_{A^*}\|_1\bigr\}
$$

上。RE：$\inf_{v\in\mathcal{C}\setminus\{0\}}\|v\|_\Sigma^2/\|v\|_2^2=\gamma>0$，故 $\|v\|_\Sigma^2\ge\gamma\|v\|_2^2$。Cauchy–Schwarz：$\|v_{A^*}\|_1\le\sqrt s\|v_{A^*}\|_2\le\sqrt s\|v\|_2$。因此

$$
\gamma\|v\|_2^2\le 3\lambda\sqrt s\,\|v\|_2\implies\|v\|_2\le\frac{3\lambda\sqrt s}{\gamma}.
$$

代入 $\lambda=2\sigma\sqrt{2\ln(2d/\delta)/n}$：

$$
\|\widehat\theta_L-\theta^*\|_2\le\frac6\gamma\sqrt{2\ln(2d/\delta)}\,\sigma\sqrt{\frac s n}.
$$

---

## 二、Lec2 监督学习

## 2.1 p.22 红字：Ledoux–Talagrand 1991, Corollary 3.17

**题面。** $\varphi(\alpha,z)$ 对 $\alpha$ 是 $1$-Lipschitz，且 $\varphi(0,z)=0$。则

$$
\|R_n\|_{\varphi(\mathcal{F})}\le 2\|R_n\|_{\mathcal{F}}.
$$

**无绝对值的收缩（逐坐标）。** 冻结样本。对第 $k$ 个坐标，

$$
\mathbb{E}_{\tau_k}\sup_f\bigl(\tau_k\varphi_k(f_k)+a(f)\bigr)
=\frac12\sup_{f,g}\bigl[a(f)+a(g)+\varphi_k(f_k)-\varphi_k(g_k)\bigr].
$$

$|\varphi_k(f_k)-\varphi_k(g_k)|\le|f_k-g_k|$。$a(f)+a(g)$ 对称：若 $g_k>f_k$ 就对调标签，故

$$
\sup_{f,g}\bigl[a(f)+a(g)+|f_k-g_k|\bigr]
=\sup_{f,g}\bigl[a(f)+a(g)+f_k-g_k\bigr],
$$

右边正是 $\mathbb{E}_{\tau_k}\sup(\tau_k f_k+a(f))$。从 $k=1$ 做到 $k=n$。

**因子 $2$。** $\mathbb{E}\sup|\sum\tau\varphi|\le\mathbb{E}\sup\sum\tau\varphi+\mathbb{E}\sup\sum(-\tau)\varphi=2\mathbb{E}\sup\sum\tau\varphi$，再用上一段 $\le 2\mathbb{E}\sup|\sum\tau f|$。$\varphi(0)=0$ 给出 $|\varphi(t)|\le|t|$，用来把损失类收成过原点。$\lambda$-Lipschitz 则多乘 $\lambda$。

## 2.2 p.29 红字：CoD，$O(C_d(1/\varepsilon)^{d/\alpha})$

**题面。** 逼近 $f\in C^\alpha([0,1]^d)$ 到误差 $\varepsilon$，网络规模 $O(C_d(1/\varepsilon)^{d/\alpha}\log(1/\varepsilon))$，并写 Suffers CoD。

**体积。** Hölder：$|f(x)-f(y)|\le\|x-y\|_\infty^\alpha$。格子边长 $h\sim\varepsilon^{1/\alpha}$ 才能让局部振荡 $\le\varepsilon$。格子数

$$
M=h^{-d}\asymp\varepsilon^{-d/\alpha}.
$$

**上界（讲义的 $O$）。** 每格做 $r=\lfloor\alpha\rfloor$ 阶 Taylor，ReLU 实现乘法再付 $\log(1/\varepsilon)$，总规模 $O(\varepsilon^{-d/\alpha}\log(1/\varepsilon))$。

**下界（「必须付」）。** 互不相交的 bump packing 给出覆盖数 $\log N(\mathcal{H}^\alpha,\|\cdot\|_\infty,\varepsilon)\gtrsim\varepsilon^{-d/\alpha}$。$S$ 个参数的网络覆盖数只有 $S\log(1/\varepsilon)$，故 $S$ 必须跟上 $\varepsilon^{-d/\alpha}$。

## 2.3 p.39 问号：核范数的近端

**题面。** $\mathrm{Prox}_{\lambda\|\cdot\|_*}(X)={?}$

**结论。** $X=U\Sigma V^\top$ 为 SVD，则

$$
\mathrm{Prox}_{\lambda\|\cdot\|_*}(X)=U\,\mathrm{diag}\bigl((\sigma_i-\lambda)_+\bigr)\,V^\top.
$$

**证明。** 近端的最优性：$Z=\mathrm{Prox}_{\lambda\|\cdot\|_*}(X)$ $\iff$ $X-Z\in\lambda\partial\|Z\|_*$。核范数与谱范数对偶：

$$
\|X\|_*=\sup_{\|Y\|_2\le 1}\langle X,Y\rangle_F,
$$

故 $\partial\|Z\|_*=\{G:\|G\|_2\le 1,\ \langle Z,G\rangle_F=\|Z\|_*\}$。令 $Z=U\,\mathrm{diag}((\sigma_i-\lambda)_+)\,V^\top$。则

$$
X-Z=U\,\mathrm{diag}\bigl(\min(\sigma_i,\lambda)\bigr)\,V^\top,
$$

谱范数 $\le\lambda$。又 $\langle Z,X-Z\rangle_F=\sum_i(\sigma_i-\lambda)_+\cdot\min(\sigma_i,\lambda)=\lambda\sum_i(\sigma_i-\lambda)_+=\lambda\|Z\|_*$。因此 $(X-Z)/\lambda\in\partial\|Z\|_*$。近端唯一，这就是 $\mathrm{Prox}$。$\square$

## 2.4 p.40 HW!：Bregman 与 $\langle G(x),x-x^*\rangle\ge\gamma(F-F^*)$

**Bregman（红字 $D_f^\xi$）。** $\xi\in\partial f(x)$ 时

$$
D_f^\xi(z,x)=f(z)-f(x)-\langle\xi,z-x\rangle\ge 0
$$

（凸）。近端 GD 的基本不等式把余项写成 $-D_f^\xi(z,x)$。

**HW。** 假设 $\langle G(x),x-x^*\rangle\ge\gamma(F(x)-F^*)$，$G$ 是近端梯度映射，$\|G\|$ 有界于半径 $R$。则 $F(x_t)-F^*=O(1/t)$。

**证明。** 记 $\varepsilon_k=F(x_k)-F^*$。一步下降（光滑 $L$、步长 $1/L$）给出

$$
\varepsilon_{k+1}\le\varepsilon_k-\frac1{2L}\|G(x_k)\|^2.
$$

由假设与 Cauchy–Schwarz，$\varepsilon_k\le\frac1\gamma\|G(x_k)\|\,\|x_k-x^*\|\le\frac R\gamma\|G(x_k)\|$，故 $\|G\|^2\ge(\varepsilon_k\gamma/R)^2$。于是

$$
\varepsilon_{k+1}\le\varepsilon_k-\frac1{2L}\Bigl(\frac{\varepsilon_k\gamma}{R}\Bigr)^2.
$$

取倒数（$\varepsilon>0$）：

$$
\frac1{\varepsilon_{k+1}}-\frac1{\varepsilon_k}\ge\frac{\gamma^2}{2LR^2}.
$$

对 $k=0,\ldots,t-1$ 相加得 $\varepsilon_t\le O(LR^2/(\gamma^2 t))$。$\square$

## 2.5 p.41–45 红字：$\epsilon_k$、$G^2$、SVRG 的 $\mathbb{E}\|G_{s,k}\|^2$

**鞅差。** SGD：$\epsilon_k=\langle g_k-\nabla f(x_k),x_k-x^*\rangle$（或讲义里对函数值的噪声）。有界差则 Azuma：

$$
\mathbb{P}\Bigl(\sum_{k<t}\epsilon_k\ge s\Bigr)\le\exp\Bigl(-\frac{s^2}{2tB^2}\Bigr).
$$

**SVRG 关键引理（p.45 红字）。** $\phi$ 凸且 $\nabla\phi$ 为 $L$-Lipschitz。下降引理给出 $\phi(x)\le\phi(y)+\langle\nabla\phi(y),x-y\rangle+\frac L2\|x-y\|^2$。与凸的一阶下界相减：

$$
D_\phi(x,y)=\phi(x)-\phi(y)-\langle\nabla\phi(y),x-y\rangle\ge\frac1{2L}\|\nabla\phi(x)-\nabla\phi(y)\|^2,
$$

即 $\|\nabla\phi(x)-\nabla\phi(y)\|^2\le 2L\,D_\phi(x,y)$。取 $y=x^*$、$\nabla\phi(x^*)=0$：$\|\nabla\phi(x)\|^2\le 2L(\phi(x)-\phi^*)$。

方差缩减：$G_{s,k}=g(x_{s,k})-g(\tilde x_{s-1})+\tilde g_s$，其中 $g$ 是单样本梯度，$\tilde g_s=\nabla f(\tilde x_{s-1})$。$\mathbb{E}[G_{s,k}\mid x_{s,k},\tilde x]=\nabla f(x_{s,k})$。用 $\|u+v\|^2\le 2\|u\|^2+2\|v\|^2$ 以及上面的 $2L$ 界（分别在 $x_{s,k}$ 与 $\tilde x_{s-1}$ 上）：

$$
\mathbb{E}\|G_{s,k}\|^2\le 4L\,\mathbb{E}\bigl[f(x_{s,k})-f^*+f(\tilde x_{s-1})-f^*\bigr].
$$

把这个上界代进近端/GD 的一步展开，对内层 $T$ 步平均，再对 snapshot 取期望，得到收缩因子

$$
\rho=\frac{1}{m\alpha(1-2L\alpha)T}+\frac{2L\alpha}{1-2L\alpha}.
$$

$\alpha=1/(6L)$ 时 $1-2L\alpha=2/3$，$2L\alpha/(1-2L\alpha)=1/2$，且 $m=n$ 时第一项 $=9\kappa/T$（$\kappa=L/m_{\mathrm{sc}}$）。故 $\rho=\frac{9\kappa}{T}+\frac12$。讲义写 $T\ge 9\kappa\Rightarrow\rho<5/6$；按公式要 $\rho<5/6$ 需 $T>27\kappa$。复杂度仍是 $(n+\kappa)\log(1/\varepsilon)$。

## 2.6 p.55 HW!：logistic MLE

**题面。** 从条件似然推出 $\ell_{\mathrm{lg}}$。

**约定 A（讲义默认）$y\in\{0,1\}$。** $\sigma(t)=\frac{e^t}{1+e^t}$，$\mathbb{P}(Y=1\mid t)=\sigma(t)$，$\mathbb{P}(Y=0\mid t)=1-\sigma(t)=\frac{1}{1+e^t}$。负对数似然

$$
\begin{aligned}
-\log\mathbb{P}(Y=y\mid t)
&=-y\log\sigma(t)-(1-y)\log(1-\sigma(t))\\
&=-y\bigl(t-\log(1+e^t)\bigr)+(1-y)\log(1+e^t)\\
&=-yt+\log(1+e^t).
\end{aligned}
$$

故 $\ell_{\mathrm{lg}}(y,t)=-yt+\log(1+e^t)$。MLE $=$ 最小化平均 $\ell_{\mathrm{lg}}(Y_i,\theta^\top X_i)$。plugin：$\hat\eta(x)=\sigma(\widehat\theta^\top x)$，$f_{\hat\eta}(x)=\mathbf{1}_{\{\widehat\theta^\top x\ge 0\}}$。

**约定 B $y\in\{\pm 1\}$。** $\mathbb{P}(Y=y\mid t)=\sigma(yt)=\frac{1}{1+e^{-yt}}$，负对数似然 $\log(1+e^{-yt})$。两种损失只差一个仿射重参数，argmin 相同。

## 2.7 p.57 红字：not linearly separable

硬间隔要求存在 $w,b$ 使 $y_i(\langle w,x_i\rangle+b)\ge 1$ 对一切 $i$ 成立。线性不可分时该可行集为空。软间隔引入 $\xi_i\ge 0$：

$$
\min_{w,b,\xi}\ \frac12\|w\|_2^2+C\sum_{i=1}^n\xi_i
\quad\text{s.t.}\quad
y_i(\langle w,x_i\rangle+b)\ge 1-\xi_i,\ \xi_i\ge 0.
$$

对固定的 $w,b$，最优 $\xi_i$ 是能让约束成立的最小非负数，即 $\xi_i^*=(1-y_i f_i)_+$，$f_i=\langle w,x_i\rangle+b$。代回目标，得到 hinge ERM

$$
\min_{w,b}\ \frac12\|w\|_2^2+C\sum_{i=1}^n\bigl(1-y_i(\langle w,x_i\rangle+b)\bigr)_+.
$$

$\lambda=1/(2nC)$ 时与 $\frac\lambda2\|w\|_2^2+\frac1n\sum(1-y_if_i)_+$ 只差一个正常数倍。

## 2.8 p.62 HW：核唯一 RKHS（Moore–Aronszajn）

**题面。** 每个 RKHS 有唯一核；每个 PSD 核有唯一 RKHS。

**核 $\Rightarrow$ RKHS。** $K$ 对称正定：对任意有限 $x_i,c_i$，$\sum_{i,j}c_i c_j K(x_i,x_j)\ge 0$。令 $H_0$ 为有限和 $f=\sum_i a_i K(\cdot,x_i)$ 的全体，规定

$$
\Bigl\langle\sum_i a_i K(\cdot,x_i),\sum_j b_j K(\cdot,y_j)\Bigr\rangle_{H_0}=\sum_{i,j}a_i b_j K(x_i,y_j).
$$

PSD $\Rightarrow$ 右边 $\ge 0$。若 $\langle f,f\rangle_{H_0}=0$，再生性（直接代入定义）给出 $f(x)=\langle f,K(\cdot,x)\rangle_{H_0}=0$，故这是内积。$H_0$ 按该内积完备化得 Hilbert 空间 $H$。再生性按连续性延拓到 $H$。赋值 $f\mapsto f(x)$ 的算子范数 $\le\sqrt{K(x,x)}$，故 $H$ 是以 $K$ 为核的 RKHS。

**RKHS $\Rightarrow$ 核唯一。** 再生核是赋值泛函的 Riesz 表示元：$\langle f,K(\cdot,x)\rangle_H=f(x)$。Riesz 表示唯一，故核唯一。

**同核 $\Rightarrow$ RKHS 唯一。** 两个 RKHS 若同核，则在 $H_0$ 上内积相同（都由 $K$ 给出），完备化相同。

## 2.9 p.63 HW!：从 RKHS 正则 hinge 推出核 SVM

**题面。** $\min_{f\in H,\,b}\frac\lambda2\|f\|_H^2+\frac1n\sum_i(1-y_i(f(x_i)+b))_+$。

**表示定理。** 把 $f=f_\parallel+f_\perp$ 正交分解，$f_\parallel\in\mathrm{span}\{K(\cdot,x_i)\}$。再生性：$f_\perp(x_i)=\langle f_\perp,K(\cdot,x_i)\rangle=0$，故训练点上的 hinge 只看 $f_\parallel$。$\|f\|_H^2=\|f_\parallel\|_H^2+\|f_\perp\|_H^2$，最优必有 $f_\perp=0$，即 $f^*=\sum_i\beta_i K(\cdot,x_i)$。写成 $\beta_i=\alpha_i y_i$。

**对偶。** 引入 $\xi_i\ge(1-y_i(f(x_i)+b))_+$，Lagrange 对 $f$ 求导得 $f=\frac1{n\lambda}\sum_i\alpha_i y_i K(\cdot,x_i)$（即 $C=1/(n\lambda)$ 时与线性 SVM 同一套 $0\le\alpha_i\le C$，$\sum\alpha_i y_i=0$）。对偶目标

$$
\max_\alpha\ \sum_i\alpha_i-\frac12\sum_{i,j}\alpha_i\alpha_j y_i y_j K(x_i,x_j).
$$

线性 SVM 是 $K(x,z)=\langle x,z\rangle$ 的特例。

---

## 三、Lec3 表示学习

## 3.1 p.67 Hint（红字，Deep Learning Book）

**原文。** Supervised training of feedforward networks does not involve explicitly imposing any condition on the learned intermediate features.

**意思。** 端到端分类只在最后一层对标签施加损失，中间层表示没有显式约束。SDR / 对比学习补的正是这件事：要 $X\perp Y\mid f^*(X)$（标签的信息全在 $f^*(X)$ 里），或增广不变 + 防崩塌。

## 3.2 p.70–71 Hint：增广不变 vs 防崩塌

类内：同一图的两个增广 $x_1,x_2$ 应 $f(x_1)\approx f(x_2)$。类间：不能把所有点映成同一个向量（model collapse）。有负样本（SimCLR 的 NT-Xent，原片无公式，按文献补）或无负样本（BYOL / Barlow / ACT 的二阶矩 $\approx I$）。

## 3.3 p.72 红字：$\widehat G(f)$ 与 $n_t$

内层：$\widehat G(f)=\{G:\|G\|_F\le\|A(f)\|_F\}$，$A(f)=\frac1{n_s}\sum f(x_1)f(x_2)^\top-I$。Cauchy–Schwarz：

$$
\max_{\|G\|_F\le\|A\|_F}\langle A,G\rangle_F=\|A\|_F^2,
$$

在 $G=A$ 达到。这就是「二阶矩接近 $I$」。

预测：$n_t(k)=\mathrm{card}\{i:y_i=k\}$，类均值用两个视图，分母 $2n_t(k)$。

---

## 四、Lec4 生成学习（数学红字）

文献 arXiv 红字见文末表。下面只收**要算的**。

## 4.1 p.93 红字：Lipschitz control 与 distribution approximation

IPM 分解（系数 $4,1,1,2$）：

$$
d_{\mathcal{F}}(\nu,\widehat g_\sharp\mu)\le 4E_1+E_2+E_3+2E_4.
$$

- $E_1$：证人类 $\mathcal{F}$ 与网络类的一致逼近（Lipschitz 控制：判别器不要太尖）。
- $E_2$：存在生成器使 $g_\sharp\mu$ 靠近经验/总体目标（分布逼近）。
- $E_3,E_4$：真/假样本的经验过程。

## 4.2 p.96 红字：$\partial_t L(0)$，Observing，$\mathrm{tr}(\nabla g)$

**第一变分。** $T_t=I+tg$，$q_t=(T_t)_\sharp q$。KL 沿推送的导数：

$$
D_{\mathrm{KL}}(q_t\|p)=\mathbb{E}_{q}\bigl[\log q_t(T_t(X))-\log p(T_t(X))\bigr].
$$

密度变换 $q_t(T_t(x))=q(x)/|\det\nabla T_t(x)|$，$\nabla T_t=I+t\nabla g$，故

$$
\log q_t(T_t(x))=\log q(x)-\log|\det(I+t\nabla g(x))|.
$$

特征值展开：$\det(I+tA)=1+t\mathrm{tr}(A)+O(t^2)$，故 $\log\det(I+t\nabla g)=t\,\mathrm{tr}(\nabla g)+O(t^2)$。又 $\log p(x+tg)=\log p(x)+t\langle\nabla\log p,g\rangle+O(t^2)$。对 $t$ 在 $0$ 求导：

$$
\frac{d}{dt}\Big|_{0}D_{\mathrm{KL}}
=\mathbb{E}_q\bigl[-\mathrm{tr}(\nabla g)-\langle\nabla\log p,g\rangle\bigr].
$$

散度定理（$g$ 紧支撑或边界项消失）：$\int q\,\mathrm{tr}(\nabla g)=-\int\langle\nabla q,g\rangle=-\mathbb{E}_q\langle\nabla\log q,g\rangle$。因此

$$
-\frac{d}{dt}\Big|_{0}D_{\mathrm{KL}}(q_t\|p)=\mathbb{E}_q\langle\nabla\log(p/q),g\rangle.
$$

最速下降方向 $g=\nabla\log(p/q)$。

## 4.3 p.97 红字：$\nabla\log\widehat r_\varphi$

密度比二次损失 $L(r)=\mathbb{E}_q[r(X)^2]-2\mathbb{E}_p[r(X)]+1$。写成对 $q$ 的积分（设 $p,q$ 有密度）：

$$
\begin{aligned}
L(r)
&=\int r^2 q-2\int r p+1
=\int\Bigl(r-\frac p q\Bigr)^2 q+\Bigl(1-\int\frac{p^2}q\Bigr).
\end{aligned}
$$

第二项不依赖 $r$，故 $\arg\min r^*=p/q$。算法用网络拟合 $\widehat r_\varphi$，再取 $\widehat v=\nabla\log\widehat r_\varphi$。

## 4.4 p.106 红字：infinitesimal 连续性方程

粒子 $x_{t+\mathrm{d}t}=x_t+v_t(x_t)\,\mathrm{d}t$。检验函数 $\phi$：

$$
\frac{d}{dt}\mathbb{E}[\phi(X_t)]=\mathbb{E}\langle\nabla\phi,v_t\rangle=\int\phi\bigl(-\nabla\cdot(q_t v_t)\bigr).
$$

故 $\partial_t q_t=-\nabla\cdot(q_t v_t)$。$v=\nabla\log(p/q)$ 即 KL 的 Wasserstein 梯度流。

## 4.5 p.108 红字：ULA，$U$ unknown

Langevin：$dX=-\nabla U\,dt+\sqrt{2}\,dB$，平稳密度 $\propto e^{-U}$。生成时 $U=-\log p$ 未知，用 score $\nabla\log p$ 代替 $-\nabla U$（score matching / 去噪）。

## 4.6 p.110 Stein 引理（推导 score matching 要用）

$\xi\sim N(0,I)$，$f$ 几乎处处可微，$\mathbb{E}\|\nabla f(\xi)\|<\infty$，且 $|x_i|\to\infty$ 时 $f(x)e^{-x_i^2/2}\to 0$。一维：密度 $\phi(t)=(2\pi)^{-1/2}e^{-t^2/2}$ 满足 $\phi'(t)=-t\phi(t)$。分部积分

$$
\mathbb{E}[f(\xi)\xi_i]
=\int f(x)\,x_i\phi(x)\,dx
=-\int f(x)\,\partial_{x_i}\phi(x)\,dx
=\int \partial_{x_i}f(x)\,\phi(x)\,dx
=\mathbb{E}[\partial_i f(\xi)].
$$

去噪：$\mathbb{E}\|v(X+\sigma\xi)-X\|^2$。令 $Y=X+\sigma\xi$、$w(y)=v(y)-y$，展开后交叉项用 Stein 变成 $\mathbb{E}\langle w(Y),\nabla\log p_\sigma(Y)\rangle$，配方即 score matching $\mathbb{E}\|s(Y)-\nabla\log p_\sigma(Y)\|^2$。

## 4.7 p.114 红字：插值条件 $a(0)=1$, $b(0)=0$

$X_t=a(t)Z+b(t)X_1$。要 $X_0\sim\gamma_d$（或给定 $\mu$）、$X_1\sim\nu$：

$$
a(0)=1,\; b(0)=0,\qquad a(1)=0,\; b(1)=1.
$$

Föllmer：$a(t)=\sqrt{1-t^2}$，$b(t)=t$。速度 $V(t,x)=\mathbb{E}[\dot a Z+\dot b X_1\mid X_t=x]$。幻灯片把 $\sqrt{1-t^2}$ 放在 MC 公式的**分母**。

## 4.8 p.121 红字：unknown（回归损失是条件期望）

总体损失 $L(v)=\mathbb{E}\|Y-v(t,X_t)\|_2^2$，其中 $Y=X_1-\frac{t}{\sqrt{1-t^2}}Z$，$X_t=\sqrt{1-t^2}Z+t X_1$。对任意可测 $v$，正交分解

$$
\mathbb{E}\|Y-v\|^2
=\mathbb{E}\|Y-\mathbb{E}[Y\mid t,X_t]\|^2
+\mathbb{E}\|\mathbb{E}[Y\mid t,X_t]-v(t,X_t)\|^2.
$$

第一项不依赖 $v$，故 $\arg\min v^*=\mathbb{E}[Y\mid t,X_t]$，而这正是 Föllmer 速度 $V(t,x)$。样本版（10）是该回归的 ERM；注意括号：$\bigl(X_i-\frac{t_i}{\sqrt{1-t_i^2}}Z_i\bigr)$。

---

## 五、附录 A（线代 / 凸）

## 5.1 p.142 Check：$\ell_0$ 不是范数

范数四条：(a) 非负 (b) $\|x\|=0\iff x=0$ (c) $\|cx\|=|c|\|x\|$ (d) 三角不等式。

$\|x\|_0=\mathrm{card}\{i:x_i\neq 0\}$。取 $c=2$、$x=e_1$：$\|2e_1\|_0=1\neq 2=|2|\|e_1\|_0$，(c) 失败。故不是范数，也不是拟范数/半范数（后两者仍要齐次）。它甚至不满足 $\|cx\|_0=|c|^0\|x\|_0$ 那种 $0$-齐次的朴素修补（$c=0$ 时左边 $0$、右边无定义或 $0\cdot\infty$）。

## 5.2 p.144 Check：$\|A\|_2=\sigma_1$，且 $\|A\|_2^2\le\|A\|_1\|A\|_\infty$

$$
\|A\|_2=\sup_{\|x\|_2=1}\|Ax\|_2=\sigma_{\max}(A).
$$

$\|A\|_1=\max_j\sum_i|A_{ij}|$（列和），$\|A\|_\infty=\max_i\sum_j|A_{ij}|$（行和）。对 $\|x\|_2=1$，

$$
\|Ax\|_2^2=\sum_i\Bigl(\sum_j A_{ij}x_j\Bigr)^2
\le\sum_i\Bigl(\sum_j|A_{ij}|\Bigr)\Bigl(\sum_j|A_{ij}|x_j^2\Bigr)
\le\|A\|_\infty\sum_j\Bigl(\sum_i|A_{ij}|\Bigr)x_j^2
\le\|A\|_\infty\|A\|_1.
$$

故 $\|A\|_2^2\le\|A\|_1\|A\|_\infty$。变分：$\|A\|_2=\max_{\|u\|_2=\|v\|_2=1}u^\top Av=\sigma_1$。

## 5.3 p.146 Question：SVD 与四大子空间

$A=U\Sigma V^\top$。$V_1$ 张成 $\mathrm{range}(A^\top)$，$V_2$ 张成 $\ker(A)$，$U_1$ 张成 $\mathrm{range}(A)$，$U_2$ 张成 $\ker(A^\top)$。伪逆 $A^\dagger=V_1\Sigma_1^{-1}U_1^\top$ 满足四条 Penrose 公理，且唯一。

## 5.4 p.147 HW：Courant–Fischer

$$
\sigma_k=\max_{\dim S=k}\min_{\|x\|_2=1,\,x\in S}\|Ax\|_2
=\min_{\dim T=n-k+1}\max_{\|x\|_2=1,\,x\in T}\|Ax\|_2.
$$

**证明。** $\|Ax\|_2^2=x^\top(A^\top A)x$，故 $\sigma_k^2$ 是 $A^\top A$ 的第 $k$ 大特征值。Courant–Fischer 对对称矩阵 $B=A^\top A$：$\lambda_k=\max_{\dim S=k}\min_{\|x\|=1,x\in S}x^\top Bx$。开根号即左边。右边同样来自对称矩阵的 min-max。取 $S=\mathrm{span}\{v_1,\ldots,v_k\}$（右奇异向量）达到 $\sigma_k$。

## 5.5 p.148 HW：最优线性编解码器

数据矩阵 $X=[x_1,\ldots,x_n]^\top=U\Sigma V^\top$。$L(E,D)=\frac1n\|X-X(DE)^\top\|_F^2$（按行编码）。$P=DE$ 是秩 $\le s$ 的线性投影，Eckart–Young：

$$
\min_{\mathrm{rank}(B)\le s}\|X-B\|_F=\|X-X_s\|_F,\qquad X_s=\sum_{i=1}^s\sigma_i u_i v_i^\top.
$$

取 $E=V_{1:s}^\top$、$D=V_{1:s}$ 则 $DE=V_{1:s}V_{1:s}^\top$，$XDE=X_s$。这就是 PCA。

## 5.6 p.151 红字：$\mathrm{Cond}(A)$

$Ax=b$，$A(x+\delta x)=b+\delta b$。则 $\delta x=A^{-1}\delta b$，

$$
\frac{\|\delta x\|}{\|x\|}\le\mathrm{Cond}(A)\frac{\|\delta b\|}{\|b\|},\qquad\mathrm{Cond}_2(A)=\frac{\sigma_1}{\sigma_n}.
$$

## 5.7 p.152 红字：核范数是范数

$\|X\|_*=\sum\sigma_i(X)$。非负、齐次显然。三角不等式：变分

$$
\|X\|_*=\frac12\inf_{X=AB^\top}(\|A\|_F^2+\|B\|_F^2)
$$

或对偶 $\|X\|_*=\sup_{\|Y\|_2\le 1}\langle X,Y\rangle_F$。对偶形式立刻给出三角不等式。

## 5.8 p.154 check：$\nabla\log\det X=X^{-1}$

$X\succ 0$。$X+tH=X(I+tX^{-1}H)$，故 $\log\det(X+tH)=\log\det X+\log\det(I+tB)$，$B=X^{-1}H$。$\det(I+tB)=1+t\mathrm{tr}(B)+O(t^2)$，因此

$$
\frac{d}{dt}\Big|_{0}\log\det(X+tH)=\mathrm{tr}(X^{-1}H)=\langle X^{-1},H\rangle_F.
$$

Frobenius 梯度是 $X^{-1}$。讲义写 $\nabla f(X)=X^{-1}$。二阶：$g''(0)=-\mathrm{tr}(X^{-1}HX^{-1}H)\le 0$，故 $\log\det$ 凹，$-\log\det$ 凸。

## 5.9 p.157–159 HW：严格凸的类似条件；$h=f-\frac m2\|\cdot\|^2$

$f$ 凸 $\iff$ $g(t)=f(x+tv)$ 凸。严格凸：Jensen 用严格不等式（$x\neq y$，$\lambda\in(0,1)$）。强凸：

$$
h(x)=f(x)-\frac m2\|x\|_2^2\text{ 凸}.
$$

一阶：$f(y)\ge f(x)+\langle\nabla f(x),y-x\rangle+\frac m2\|y-x\|_2^2$。Hessian：$\nabla^2 f\succeq mI$。p.160 绿字：$\nabla h\in\mathrm{Lip}(L-m)$，再用 $\nabla h$ 的 cocoercivity。

## 5.10 p.161 问号 / HW：$f(x)=x^3$；次梯度；次微分和

**$\partial|x|$。** $x\neq 0$ 为 $\{\mathrm{sign}(x)\}$；$x=0$ 为 $[-1,1]$。

**$f(x)=x^3$ 在 $0$。** 次梯度定义：$z\in\partial f(0)\iff y^3\ge z\cdot y$ 对一切 $y\in\mathbb{R}$。$y>0$ 两边除以 $y$：$y^2\ge z$，令 $y\downarrow 0$ 得 $z\le 0$。$y<0$ 除以负的 $y$ 反向：$y^2\le z$，令 $y\uparrow 0$ 得 $z\ge 0$。故只能 $z=0$。但 $z=0$ 要求 $y^3\ge 0$ 对一切 $y$，取 $y=-1$ 失败。故 $\partial f(0)=\emptyset$。非凸函数在光滑点也可以没有次梯度。

**次微分和。** $f=f_1+f_2$ 凸，$\exists x_0\in\mathrm{dom}(f_1)\cap\mathrm{dom}(f_2)$ 且 $f$ 在 $x_0$ 连续 $\Rightarrow\partial f(x)=\partial f_1(x)+\partial f_2(x)$。

## 5.11 p.162 Check：$\partial\|x\|_1$、$\partial\|x\|_2$

$\partial\|x\|_1=\prod_i\partial|x_i|$。$\partial\|x\|_2=\{x/\|x\|_2\}$（$x\neq 0$），$x=0$ 时为单位球。

## 5.12 p.163 红字：$f\le f^{**}$ 用分离定理

Young：$f^{**}\le f$ 总成立。若 $f$ 闭凸，epigraph 是闭凸，用严格分离：过 $(x,t)$、$t<f(x)$ 的超平面给出 $f^{**}(x)\ge t$ 对一切 $t<f(x)$，故 $f^{**}(x)\ge f(x)$。合起来 $f=f^{**}$。

## 5.13 p.165 Check：$\bar\partial f(x^*)\ni 0$ 的必要

局部最小 $\Rightarrow 0\in\bar\partial f(x^*)$（Fréchet / 极限次梯度），$f$ 可以非凸非光滑。凸时 $\bar\partial=\partial$，回到 $0\in\partial f(x^*)$。

## 5.14 p.167 红字：Slater，$N_C$

Slater：$x_0\in\mathrm{reint}(\mathrm{dom}(f))\cap C$，非仿射不等式在 $x_0$ 严格可行。则强对偶、KKT 必要且充分。

$$
N_C(x^*)=\sum_{c_i(x^*)=0}\mathrm{cone}(\partial c_i(x^*))+\mathcal{R}(A^\top).
$$

## 5.15 p.168 红字：$T_C(x^*)=F_C(x^*)$

切锥 $\subseteq$ 可行方向锥总成立。反向需要约束规格（LICQ $\Rightarrow$ MFCQ $\Rightarrow T=F$）。相等后 KKT 的乘子存在。

---

## 六、附录 B（概率 / 集中）

## 6.1 p.170 红字：骰子实验

一次掷骰：outcome 是 $\{1,\ldots,6\}$ 之一；sample space $S=\{1,2,3,4,5,6\}$；event 是 $S$ 的子集，如「偶数」$\{2,4,6\}$。

## 6.2 p.172–174 红字：不能对任意子集赋概率；$\sigma$-代数

$S=\mathbb{R}$ 时不是每个子集都可测（Vitali）。$\sigma$-代数：含 $S$，对补和可列并封闭。$\mathbb{P}$ 的定义域必须是 $\sigma$-代数。课堂：$\mathcal{F}_0=\{\emptyset,S\}\subset\mathcal{F}_1\subset\mathcal{F}_2$。

## 6.3 p.175 Hint ×6：概率八条性质（全部写成证明）

**(1)** $\mathbb{P}(\emptyset)=0$。$S=S\cup\emptyset\cup\emptyset\cup\cdots$，可列可加：$\mathbb{P}(S)=\mathbb{P}(S)+\sum\mathbb{P}(\emptyset)$，故 $\mathbb{P}(\emptyset)=0$。

**(2)** 有限可加：可列可加里后面填 $\emptyset$。

**(3)** $\mathbb{P}(A^c)=1-\mathbb{P}(A)$，因为 $A\cup A^c=S$ 不交。

**(4)** 单调：$B=A\cup(B\setminus A)$ 不交，$\mathbb{P}(B)=\mathbb{P}(A)+\mathbb{P}(B\setminus A)\ge\mathbb{P}(A)$。

**(5)** $0\le\mathbb{P}(A)\le 1$：非负 + $\mathbb{P}(A)\le\mathbb{P}(S)=1$。

**(6)** 容斥：$\mathbb{P}(A)+\mathbb{P}(B)=\mathbb{P}(A\cup B)+\mathbb{P}(A\cap B)$（画两个不交分解）。

**(7) 可列次可加。** $A\subset\bigcup_n A_n$。令 $B_1=A_1$，$B_k=A_k\setminus\bigcup_{j<k}A_j$，则 $B_k$ 不交、$\bigcup B_k=\bigcup A_n$，且 $B_k\subset A_k$。可列可加 + 单调：$\mathbb{P}(\bigcup A_n)=\sum\mathbb{P}(B_k)\le\sum\mathbb{P}(A_k)$。再限制到 $A$。

**(8) 单调连续。** $A_n\uparrow A$ 时令 $C_1=A_1$、$C_k=A_k\setminus A_{k-1}$，则 $\mathbb{P}(A)=\sum\mathbb{P}(C_k)=\lim\mathbb{P}(A_n)$。$A_n\downarrow A$ 看补集。

## 6.4 p.176–177 红字：条件概率定义域；$P(B)>0$；全概率；Bayes

$$
\mathbb{P}(A\mid B)=\frac{\mathbb{P}(A\cap B)}{\mathbb{P}(B)}\quad(\mathbb{P}(B)>0).
$$

对固定 $B$，$\mathbb{P}(\cdot\mid B)$ 仍是同一个 $\mathcal{F}$ 上的概率。全概率：分划 $\{B_i\}$ 时 $\mathbb{P}(A)=\sum\mathbb{P}(A\mid B_i)\mathbb{P}(B_i)$。Bayes：$\mathbb{P}(B_j\mid A)=\mathbb{P}(A\mid B_j)\mathbb{P}(B_j)/\mathbb{P}(A)$。

## 6.5 p.178 Hint：两两独立 $\neq$ 相互独立

样本空间 $\{\mathrm{HH},\mathrm{HT},\mathrm{TH},\mathrm{TT}\}$ 均匀。$A=\{\mathrm{HH},\mathrm{HT}\}$（第一次正），$B=\{\mathrm{HH},\mathrm{TH}\}$（第二次正），$C=\{\mathrm{HH},\mathrm{TT}\}$（两次相同）。$\mathbb{P}(A)=\mathbb{P}(B)=\mathbb{P}(C)=1/2$。

$$
\mathbb{P}(A\cap B)=\mathbb{P}(\mathrm{HH})=1/4=\mathbb{P}(A)\mathbb{P}(B),
$$

同理 $A\perp C$、$B\perp C$。但 $A\cap B\cap C=\{\mathrm{HH}\}$，

$$
\mathbb{P}(A\cap B\cap C)=1/4\neq 1/8=\mathbb{P}(A)\mathbb{P}(B)\mathbb{P}(C).
$$

条件独立：若 $\mathbb{P}(B\cap C)>0$，则 $A\perp B\mid C\iff\mathbb{P}(A\mid B\cap C)=\mathbb{P}(A\mid C)$。由定义 $\mathbb{P}(A\cap B\mid C)=\mathbb{P}(A\mid C)\mathbb{P}(B\mid C)$ 两边同乘 $\mathbb{P}(C)$ 再除以 $\mathbb{P}(B\cap C)$ 即得。

## 6.6 p.179–180 红字：RV 可测；$X=\pm 1$

$X$ 可测 $\iff$ $\{X\le t\}\in\mathcal{F}$ 对一切 $t$。例子 $P(X=1)=P(X=-1)=1/2$：原像 $\{X=1\}$、$\{X=-1\}$ 必须是事件。Borel $\sigma$-代数「理解成开集生成」即可（讲义 Check）。

## 6.7 p.183 红字：a.s.；$g$ 的条件期望

$\mathbb{E}|X|=0\iff X=0$ a.s.。塔性质：$\mathbb{E}[\mathbb{E}[X\mid\mathcal{G}]]=\mathbb{E}[X]$。$L^2$：$g=\mathbb{E}[X\mid\mathcal{G}]$ 最小化 $\mathbb{E}(X-g)^2$。

## 6.8 p.184 红字：高斯尾 $e^{-t^2/(2\sigma^2)}$

$Z\sim N(\mu,\sigma^2)$：Chernoff 给出 $\mathbb{P}(|Z-\mu|>t)\le 2\exp(-t^2/(2\sigma^2))$。Mills 更精：前因子 $\sqrt{2/\pi}\,(\sigma/t)$。

## 6.9 p.192 HW!：覆盖数；$1/\varepsilon^d\le N(B_2,\varepsilon)\le(1+2/\varepsilon)^d$

记 $B=B_2(1)\subset\mathbb{R}^d$，$N=N(B,\|\cdot\|_2,\varepsilon)$。

**上界。** 设 $\mathcal{P}$ 是极大 $\varepsilon$-packing（点对距离 $>\varepsilon$）。极大 $\Rightarrow$ $\mathcal{P}$ 是 $\varepsilon$-网，故 $N\le|\mathcal{P}|$。以 packing 点为心、半径 $\varepsilon/2$ 的球两两不交，且落在 $B_2(1+\varepsilon/2)$ 内。体积：

$$
|\mathcal{P}|\cdot\mathrm{vol}(B_2(\varepsilon/2))\le\mathrm{vol}(B_2(1+\varepsilon/2))
\implies
|\mathcal{P}|\le\Bigl(\frac{1+\varepsilon/2}{\varepsilon/2}\Bigr)^d=\Bigl(1+\frac2\varepsilon\Bigr)^d.
$$

**下界。** $\varepsilon$-网的每个点覆盖一块半径 $\varepsilon$ 的球，这些球覆盖 $B$。把网的球限制在 $B$ 上，体积比给出 $N\cdot\mathrm{vol}(B_2(\varepsilon))\ge\mathrm{vol}(B_2(1))$，即 $N\ge\varepsilon^{-d}$。讲义写 $1/\varepsilon^d\le N\le(1+2/\varepsilon)^d$。

极大 packing 是网，且 $P(K,2\varepsilon)\le N(K,\varepsilon)\le P(K,\varepsilon)$。矩阵谱范数 HW：对 $\mathbb{S}^{d-1}$ 取 $\varepsilon$-网，把 $\sup_{\|u\|=\|v\|=1}u^\top X v$ 化成有限个次高斯，并集，见 `06` §20。

---

## 七、只标红、不是作业（查阅用）

这些红字是强调或文献，不必当作业交。证明/算法在对应笔记。

| 页 | 红字在强调什么 | 去哪看 |
|----|----------------|--------|
| p.4,15,20 | $E_D[\mathcal{E}(f_A(\tau))]$ 超额风险 | `01` §2，`02a` |
| p.7,9 | $\lambda_{\min}(\Sigma)$，$d\sigma^2/(n\lambda_{\min})$ | `01` §3,§5 |
| p.12 | $n\ll d$ | `01` §8 |
| p.17–18 | $\max_{f\in\mathcal{F}}$ 换成网上 max | `02a` §2 |
| p.66 | complex data | `03` §1 |
| p.68,75,76 | 论文 arXiv | `03` |
| p.73 | ACT 代码链接 | GitHub |
| p.86–89 | 维数 $d$、ergodicity、三条 takehome、若干 arXiv | `04` 第一、二部分 |
| p.91–92 | GNN/FNN、速率里的 $d$ | `04` GAN |
| p.116–123,127,130–134 | implicit、unknown、Transformer 论文与非 i.i.d. | `04` 第五、六部分 |
| p.166 | 可行集 $\mathbb{R}^m_+$ | `05` KKT |

---

## 八、对照：原片排版 vs 证明用的式子

考试抄幻灯片题面；推导用右边。

| 页 | 原片 | 证明里 |
|----|------|--------|
| p.12 | Lasso 基本不等式少 $2$ | 目标 $\frac1{2n}$ 时左边 $\|v\|_\Sigma^2$ 对应系数 $2$ |
| p.26 | Dudley 误用 Hölder | $\|(1/n)\sum\tau_i a_i\|\le\|a\|_\infty$ |
| p.44 | $T\ge 9\kappa\Rightarrow\rho<5/6$ | $\alpha=1/(6L)$ 时 $\rho=9\kappa/T+1/2$，要 $<5/6$ 需 $T>27\kappa$ |
| p.49 | 指数里 $n^2\xi^2$ | $n\xi^2$ |
| p.54 | $L^*=\mathbb{E}[f^*-\eta]$ | $\mathbb{E}|f^*-\eta|$ |
| p.112 | 字面 $X_{\varphi(t)}$ | $\tau=-\log(1-t)$ |
| 公式里的 `#` | 推送 $g_\#\mu$ | Typora 写 $g_\sharp\mu$ |
