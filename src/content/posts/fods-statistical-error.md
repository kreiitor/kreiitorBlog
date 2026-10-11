---
title: "统计误差：覆盖数与 Rademacher 复杂度"
description: "从经验风险到泛化界，逐步理解集中不等式、覆盖数、对称化与 Dudley 积分。"
pubDate: 2026-10-11
tags:
  - 数据科学
  - 学习理论
  - FODS
category: course
series: fods
order: 2
cover: /covers/post-math.svg
---

对应讲义：`Fods_26.pdf` p.13–27（Lec2 的「Statistical error」）。p.3–6 的监督学习总框架已在 [01_Lec1_线性模型](/blog/fods-linear-models/) 写过，这里只作最短回顾。

本章目标：把 Lec1 线性模型里那个「误差 $\asymp d/n$」推广到**一般函数类** $\mathcal{F}$（有限类、线性类、ReLU 网络……）。你会得到两条上界链：

1. **快速率（Esta）**：损失对 $f$ Lipschitz + 总体风险在 $f^*$ 处局部强凸 $\Rightarrow$ $\mathbb{E}[\text{超额风险}]$ 里统计部分 $\lesssim (\lambda B+\lambda^2/c)\,(\log N)/n$。
2. **慢速率（泛化误差 / Rademacher / Dudley）**：不靠强凸，用对称化 + 收缩 + chaining，得到 $\lesssim \lambda\,\mathrm{Rad}(\mathcal{F})$，再把 $\mathrm{Rad}$ 写成覆盖熵积分。

幻灯片在 Bernstein 的方差吸收、p.26 的「Hölder」、Dudley 从离散和到积分这几处跳步很大，下面逐步补全，并标明常数哪里松。

需要的预备：

- 风险、ERM、$E_{\mathrm{sta}}/E_{\mathrm{gen}}/E_{\mathrm{app}}$：Lec1 第 1–2 节
- 期望、方差、Chernoff、并集界：附录 B
- Bernstein（有界 r.v.）：附录 B p.188–189，本节会当场重写
- 覆盖数体积论证：附录 B p.191–192，与 p.19 重复，本节写完整证明

---

## 0. 监督学习 setup（p.14–15，指向 Lec1）

数据 $(X,Y)\sim P$（或写成 $Z\sim\mu_Z$）。损失函数 $\ell$，总体风险 $L(f)=\mathbb{E}[\ell(f(X),Y)]$。Bayes 规则

$$
f^*\;\in\;\arg\min_{\text{可测 }f}L(f),\qquad
f^*(x)=\arg\min_{a}\mathbb{E}[\ell(a,Y)\mid X=x].
$$

平方损失时 $f^*(x)=\mathbb{E}[Y\mid X=x]$；0-1 损失时是后验最大类。详见 Lec1 §1。

函数类 $\mathcal{F}$ 上的 ERM $\widehat f\in\arg\min_{f\in\mathcal{F}}\widehat L(f)$。优化器输出 $f_A(\tau)$ 满足 $\widehat L(f_A)\le\widehat L(\widehat f)+\tau$。$\mathcal{F}$ 里总体最好的记 $\bar f$，逼近误差 $E_{\mathrm{app}}=L(\bar f)-L(f^*)$。

**超额风险** $\mathcal{E}(f_A)=L(f_A)-L(f^*)$。Lec1 给出两条分解（p.4–5）：

$$
\mathbb{E}[\mathcal{E}(f_A)]
\;\le\;
E_{\mathrm{sta}}+2E_{\mathrm{app}}+2\tau,
$$

以及（点点成立）

$$
\mathcal{E}(f_A)
\;\le\;
E_{\mathrm{gen}}+E_{\mathrm{app}}+E_{\mathrm{opt}},
$$

其中 $E_{\mathrm{opt}}\le\tau$，$E_{\mathrm{gen}}:=2\sup_{f\in\mathcal{F}}|L(f)-\widehat L(f)|$。

**人话：** $E_{\mathrm{gen}}$ 是「整个 $\mathcal{F}$ 上经验风险和总体风险差多远」的最坏偏差，通常只有 $\sqrt{(\log N)/n}$ 这种慢速率。$E_{\mathrm{sta}}$ 长得怪，但中心化以后方差能跟超额风险成正比，Bernstein 可以给出 $(\log N)/n$。本节上半部分 bound $E_{\mathrm{sta}}$，下半部分把 $E_{\mathrm{gen}}$ 写成 Rademacher。

记号（与 Lec1 一致）：

$$
g(f,Z)=\ell(f,Z)-\ell(f^*,Z),\qquad
G(f,Z)=\mathbb{E}_{Z'}[g(f,Z')]-2g(f,Z).
$$

$Z'$ 是与训练数据独立的一份拷贝（ghost sample）。于是（p.15）

$$
E_{\mathrm{sta}}
=\mathbb{E}_D\bigl[L(f_A)-2\widehat L(f_A)+L(f^*)\bigr]
=\mathbb{E}_D\Bigl[\frac1n\sum_{i=1}^n G(f_A,Z_i)\Bigr].
$$

**补全：为什么 $G$ 这么定义。** $L(f)-L(f^*)=\mathbb{E}[g(f,Z')]$，$\widehat L(f)-\widehat L(f^*)=\frac1n\sum g(f,Z_i)$，所以

$$
L(f)-2\widehat L(f)+L(f^*)
=\mathbb{E}[g(f,Z')]-2\cdot\frac1n\sum_i g(f,Z_i)
=\frac1n\sum_i G(f,Z_i).
$$

讲义把 $G(f,Z)=\mathbb{E}_{D'}[g(f,Z')-2g(f,Z)]$ 写在一起；对 $D'$ 的期望只打在第一项上。

---

## 1. $E_{\mathrm{sta}}$ 是什么、为何比 $E_{\mathrm{gen}}$ 更紧（p.16–17，p.20）

### 1.1 恒等式（Lec1 已有，这里只钉钉子）

$$
L(f_A)-L(f^*)
=
\bigl(L(f_A)-2\widehat L(f_A)+L(f^*)\bigr)
+
2\bigl(\widehat L(f_A)-L(f^*)\bigr).
$$

右边第一项期望是 $E_{\mathrm{sta}}$。第二项：因为 $\widehat L(f_A)-\tau\le\widehat L(\bar f)$，且 $\bar f,f^*$ 不依赖数据，

$$
\mathbb{E}[\widehat L(f_A)-L(f^*)]\;\le\; E_{\mathrm{app}}+\tau,
$$

所以 $\mathbb{E}[\mathcal{E}(f_A)]\le E_{\mathrm{sta}}+2E_{\mathrm{app}}+2\tau$。

若把 $f^*$ 改成「$\mathcal{F}$ 里的总体最优」（讲义 p.20 就是这样写的），则 $E_{\mathrm{app}}=0$，

$$
\mathbb{E}[\mathcal{E}(f_A)]\;\le\; E_{\mathrm{sta}}+2\tau.
$$

**误区：** p.14 的 $f^*$ 是所有可测函数上的 Bayes 规则；p.20 的 $f^*$ 是 $\arg\min_{f\in\mathcal{F}}L(f)$。同一符号两种含义。下面 Bound $E_{\mathrm{sta}}$ 时，局部强凸是对 Bayes 规则写的；若只相对 $\bar f$ 做超额，需要 $\mathcal{F}$ 凸（平方损失下投影正交）才能保住同样的 $c$。

### 1.2 为什么更紧

把 $\mathcal{F}$ 先想成有限类，$|\mathcal{F}|=N$。

- **均匀偏差 / $E_{\mathrm{gen}}$：** 每个 $f$ 的 $\widehat L(f)-L(f)$ 是有界 r.v. 的平均，Hoeffding + 并集给出

$$
\mathbb{E}\Bigl[\sup_{f\in\mathcal{F}}|\widehat L(f)-L(f)|\Bigr]
\;\lesssim\;
\lambda B\sqrt{\frac{\log N}{n}}.
$$

$E_{\mathrm{gen}}$ 带一个 2，超额风险因此是 $\sqrt{(\log N)/n}$ 型（**慢速率**）。它对「很尖、方差不随超额风险变小」的损失是对的，但平方损失这种强凸问题多付了一层根号。

- **$E_{\mathrm{sta}}$：** $g(f,Z)$ 的方差 $\le(\lambda^2/c)\,\mathbb{E}[g]$，也就是**方差跟超额风险成正比**。Bernstein 的分母是 $\sigma^2+bt$ 而不是常数；当你关心的偏差 $t$ 本身和 $\sigma^2$ 同阶时，指数从 $e^{-nt^2}$ 变成 $e^{-nt}$，积分以后是 $1/n$ 型（**快速率**）。

Lec1 的 OLS 精确等式 $\frac{r\sigma^2}{n}$ 就是快速率；下面用覆盖数 + Bernstein 在一般 $\mathcal{F}$ 上恢复「$(\log N)/n$」，只多一个对数。

---

## 2. Bound $E_{\mathrm{sta}}$（p.17–18）

### 2.1 假设

1. **$\mathcal{F}$ 有界 $B$：** $|f(x)|\le B$ 对所有 $f\in\mathcal{F}$ 和 $x$ 成立；也假定 $|f^*|\le B$（否则把 $B$ 换成两者的共同上界）。
2. **损失对 $f$ 是 $\mathrm{Lip}(\lambda)$：** $|\ell(f,Z)-\ell(f',Z)|\le\lambda\,|f(X)-f'(X)|$。  
   **补全：平方损失的 $\lambda$。** $\ell(f,Z)=(f(X)-Y)^2$，则

   
$$
|\ell(f)-\ell(g)|=|f-g|\,|f+g-2Y|.
$$

   若再假定 $|Y|\le B$，则 $|f+g-2Y|\le 4B$，可取 $\lambda=4B$。无界 $Y$ 时 Lipschitz 不成立，Esta 这条链不能直接用（改用次指数尾或截断）。
3. **$L$ 在 $f^*$ 处局部强凸，常数 $c>0$：** 对 $f\in\mathrm{Ball}_B(f^*)$，

   
$$
L(f)-L(f^*)\;\ge\; c\,\|f-f^*\|_{L^2(\mu_X)}^2.
$$

   **补全：平方损失 $c=1$。** $Y=f^*(X)+\epsilon$，$\mathbb{E}[\epsilon\mid X]=0$ 时交叉项消失，$L(f)-L(f^*)=\mathbb{E}[(f-f^*)^2]$。若损失带 $\frac12$，则 $c=\frac12$。

### 2.2 积分尾界（非负部分）

**引理。** 若 $\mathbb{E}[|W|]<\infty$，则

$$
\mathbb{E}[W]\;\le\;\int_0^\infty\mathbb{P}(W>t)\,dt.
$$

**证明（补全）。** $W_+=\max(W,0)$ 非负，层饼公式 $\mathbb{E}[W_+]=\int_0^\infty\mathbb{P}(W_+>t)\,dt=\int_0^\infty\mathbb{P}(W>t)\,dt$。而 $\mathbb{E}[W]=\mathbb{E}[W_+]-\mathbb{E}[W_-]\le\mathbb{E}[W_+]$。$\square$

讲义写「若 $\mathbb{E}[|W|]<\infty$，则 $\mathbb{E}[W]\le\int\mathbb{P}(W>w)\,dw$」——等号需要 $W\ge 0$，上界对有符号的 $W$ 也成立。下面取

$$
W=\frac1n\sum_{i=1}^n G(f_A,Z_i),
$$

则 $E_{\mathrm{sta}}=\mathbb{E}[W]\le\int_0^\infty\mathbb{P}(W>t)\,dt$。

因为 $f_A\in\mathcal{F}$，

$$
\mathbb{P}(W>t)
\;\le\;
\mathbb{P}\Bigl(\max_{f\in\mathcal{F}}\frac1n\sum_i G(f,Z_i)>t\Bigr).
$$

无穷类不能直接并集，所以先用覆盖数把 $\mathcal{F}$ 换成有限网。

### 2.3 覆盖网与 $G$ 的 $3\lambda\delta$ 扰动

设 $N=N(\mathcal{F},\|\cdot\|_{L^\infty},\delta)$，$C=\{f_1,\ldots,f_N\}$ 是 $\mathcal{F}$ 的一张 $\delta$-网：每个 $f\in\mathcal{F}$ 都有 $\widetilde f\in C$ 使 $\|f-\widetilde f\|_\infty\le\delta$。

Lipschitz 给出

$$
|g(f,Z)-g(\widetilde f,Z)|
=|\ell(f,Z)-\ell(\widetilde f,Z)|
\le\lambda|f(X)-\widetilde f(X)|
\le\lambda\delta.
$$

于是 $|\mathbb{E}[g(f)]-\mathbb{E}[g(\widetilde f)]|\le\lambda\delta$，且 $|2g(f,Z)-2g(\widetilde f,Z)|\le 2\lambda\delta$，所以

$$
G(f,Z)-G(\widetilde f,Z)
\;\le\;
3\lambda\delta.
$$

对 $i$ 平均后同样成立。因此「$\mathcal{F}$ 上平均 $G>t$」蕴含「网上平均 $G>t-3\lambda\delta$」：

$$
\mathbb{P}\Bigl(\max_{f\in\mathcal{F}}\frac1n\sum G(f,Z_i)>t\Bigr)
\;\le\;
\mathbb{P}\Bigl(\max_{\widetilde f\in C}\frac1n\sum G(\widetilde f,Z_i)>t-3\lambda\delta\Bigr).
$$

**误区：** 3 不是拍脑袋。一项来自 ghost 期望（总体），两项来自 $-2g$（经验）。若只用 $|L-\widehat L|$ 的均匀偏差，扰动会是 $2\lambda\delta$；这里因为 $G$ 里经验项系数是 2，多付 1 个 $\lambda\delta$。

### 2.4 单点上把 $G$ 改写成中心化的 $g$

固定 $\widetilde f\in C$。记 $\xi_i=g(\widetilde f,Z_i)$，$\mu=\mathbb{E}[\xi_i]$。则

$$
\frac1n\sum_i G(\widetilde f,Z_i)
=\mu-2\cdot\frac1n\sum_i\xi_i.
$$

事件 $\{\mu-2\,\mathrm{avg}\,\xi>t\}$ 即

$$
\mu-\mathrm{avg}\,\xi
\;>\;
\frac t2+\frac\mu2.
$$

左边是「平均值低于均值」的偏差。下一步用 Bernstein。

### 2.5 有界性、方差与 Bernstein

$|f|,|f^*|\le B$ 且损失 $\mathrm{Lip}(\lambda)$，故 $|g(\widetilde f,Z)|\le 2\lambda B$。中心化后

$$
|\xi-\mu|\;\le\;4\lambda B\;=:\;b.
$$

（这已经松了一倍：$|\xi|\le 2\lambda B$ 其实足以在不少 Bernstein 版本里当 $b$ 用。）

方差：$|g|\le\lambda|f-f^*|$ 故 $g^2\le\lambda^2(f-f^*)^2$，

$$
\sigma^2:=\mathrm{Var}(\xi)\;\le\;\mathbb{E}[\xi^2]\;\le\;\lambda^2\mathbb{E}[|\widetilde f-f^*|^2].
$$

局部强凸：$\mu=\mathbb{E}[g]=L(\widetilde f)-L(f^*)\ge c\,\|\widetilde f-f^*\|_{L^2}^2$，所以

$$
\sigma^2\;\le\;\frac{\lambda^2}{c}\,\mu,\qquad
\mu\;\ge\;\frac{c}{\lambda^2}\sigma^2.
$$

**Bernstein（附录 B p.188–189，有界版本）。** $X_i$ i.i.d.，$\mathbb{E}X=\mu$，$\mathrm{Var}=\sigma^2$，$|X-\mu|\le b$ a.s.，则

$$
\mathbb{P}\Bigl(\mu-\frac1n\sum_i X_i\ge u\Bigr)
\;\le\;
\exp\Bigl(-\frac{nu^2}{2(\sigma^2+bu)}\Bigr).
$$

**补全证明（Chernoff + 矩展开）。** 下面的 $s$ 是 Chernoff 参数，不要和损失的 Lipschitz 常数 $\lambda$ 搞混。令 $\eta=X-\mu$，$|\eta|\le b$，$\mathbb{E}\eta=0$，$\mathbb{E}\eta^2=\sigma^2$。对 $0<s<1/b$，

$$
\begin{aligned}
\mathbb{E}[e^{s\eta}]
&=1+\frac{s^2\sigma^2}{2}+\sum_{k\ge 3}\frac{s^k\mathbb{E}[\eta^k]}{k!}\\
&\le 1+\frac{s^2\sigma^2}{2}+\frac{s^2\sigma^2}{2}\sum_{k\ge 3}(|s|b)^{k-2}
=1+\frac{s^2\sigma^2}{2(1-bs)}
\le\exp\Bigl(\frac{s^2\sigma^2}{2(1-bs)}\Bigr).
\end{aligned}
$$

第三步用了 $|\mathbb{E}\eta^k|\le b^{k-2}\sigma^2$ 以及 $k\ge 3$ 时 $1/k!\le 1/2$。对 $n$ 个 i.i.d. 拷贝 $\eta_i$ 做 Chernoff：$\mathbb{P}(-\frac1n\sum\eta_i\ge u)\le e^{-snu}(\mathbb{E}e^{-s\eta})^n$（$-\eta$ 的 mgf 同样有界）。取 $s=u/(bu+\sigma^2)<1/b$，指数变成 $-nu^2/(2(\sigma^2+bu))$。$\square$

（经典教材常写分母 $2\sigma^2+(2/3)bt$，略紧。讲义用 $2(\sigma^2+bt)$，后面所有数字都跟着这个版本。）

### 2.6 把方差吸收进线性指数（幻灯片的计算）

我们需要的偏差水平是 $u_*=t/2+\mu/2$。讲义设

$$
u=\frac t2+\frac{\sigma^2 c}{\lambda^2},
$$

并写 $\sigma^2\le b\lambda u/(4Bc)$（因为 $b=4\lambda B$ 时 $b\lambda/(4Bc)=\lambda^2/c$，且 $u\ge\sigma^2 c/\lambda^2$ 给出 $\sigma^2\le(\lambda^2/c)u$），以及 $u\ge t/2$。

代入 Bernstein：

$$
\frac{nu^2}{2(\sigma^2+bu)}
\;\ge\;
\frac{nu^2}{2\bigl((\lambda^2/c)u+bu\bigr)}
=\frac{nu}{2b+2\lambda^2/c}.
$$

而 $2b+2\lambda^2/c=8\lambda B+2\lambda^2/c$。讲义把它写成

$$
(2+\lambda/(2Bc))b=2b+\frac{\lambda b}{2Bc}=2b+\frac{2\lambda^2}{c},
$$

同一件事。再用 $u\ge t/2$：

$$
\frac{nu}{8\lambda B+2\lambda^2/c}
\;\ge\;
\frac{n(t/2)}{8\lambda B+2\lambda^2/c}
=\frac{nt}{16\lambda B+4\lambda^2/c}.
$$

因此讲义得到：对每个网点心，

$$
\mathbb{P}\Bigl(\frac1n\sum_i G(\widetilde f,Z_i)>t\Bigr)
\;\le\;
\exp\Bigl(-\frac{nt}{16\lambda B+4\lambda^2/c}\Bigr).
$$

并集 $|C|=N$，再接上 $3\lambda\delta$ 扰动：对 $t>3\lambda\delta$，

$$
\mathbb{P}\Bigl(\max_{f\in\mathcal{F}}\frac1n\sum G(f,Z_i)>t\Bigr)
\;\le\;
N\exp\Bigl(-\frac{n(t-3\lambda\delta)}{16\lambda B+4\lambda^2/c}\Bigr).
$$

**补全：幻灯片这里有一处常数缝。** 真事件是 $\{\mu-\mathrm{avg}>t/2+\mu/2\}$。用 $\{\mu-\mathrm{avg}>t/2+\sigma^2 c/\lambda^2\}$ 去上界它，需要 $\mu/2\ge\sigma^2 c/\lambda^2$，即 $\mu\ge 2\sigma^2 c/\lambda^2$；我们只有 $\mu\ge\sigma^2 c/\lambda^2$，差一个 2。

严谨改法：令 $u=t/2+\mu/2\ge t/2$。则 $\sigma^2\le(\lambda^2/c)\mu=(2\lambda^2/c)(\mu/2)\le(2\lambda^2/c)u$，于是

$$
\frac{nu^2}{2(\sigma^2+bu)}
\;\ge\;
\frac{nu}{2b+4\lambda^2/c}
=\frac{nu}{8\lambda B+4\lambda^2/c}
\;\ge\;
\frac{nt}{16\lambda B+8\lambda^2/c}.
$$

指数分母里 $\lambda^2/c$ 的系数从 4 变成 8，**速率同阶**。下面继续用讲义的 $16\lambda B+4\lambda^2/c$ 写积分，你要写作业时用 $16\lambda B+8\lambda^2/c$ 更站得住。其它松弛还有：$|g-\mathbb{E}g|\le 4\lambda B$ 而不是 $2\lambda B$；Bernstein 分母的 2 对 $2/3$；指数里丢掉 $u$ 中的方差项只留 $t/2$。

### 2.7 积分尾：选 $a=3\lambda\delta+c_0$，$\delta=1/n$

记 $\kappa=16\lambda B+4\lambda^2/c$。则

$$
E_{\mathrm{sta}}
\le
\int_0^\infty\mathbb{P}(W>t)\,dt
\le
a+\int_a^\infty\mathbb{P}(W>t)\,dt.
$$

取 $\delta=1/n$，

$$
c_0=\frac{\kappa\log N}{n},\qquad
a=3\lambda\delta+c_0=\frac{3\lambda}{n}+\frac{\kappa\log N}{n}.
$$

对 $t\ge a$ 有 $t-3\lambda\delta\ge c_0$，故

$$
\int_a^\infty N\exp\Bigl(-\frac{n(t-3\lambda\delta)}{\kappa}\Bigr)\,dt
=\;N\cdot\frac{\kappa}{n}\exp\Bigl(-\frac{nc_0}{\kappa}\Bigr)
=N\cdot\frac{\kappa}{n}\cdot\frac1N
=\frac\kappa n,
$$

其中 $nc_0/\kappa=\log N$。于是

$$
E_{\mathrm{sta}}
\;\le\;
a+\frac\kappa n
=\frac{\kappa(\log N+1)+3\lambda}{n}
=\frac{(16\lambda B+4\lambda^2/c)(\log N+1)+3\lambda}{n}.
$$

这就是 p.18 最后一行。数量级

$$
E_{\mathrm{sta}}\;\lesssim\;\Bigl(\lambda B+\frac{\lambda^2}{c}\Bigr)\frac{\log N(\mathcal{F},\|\cdot\|_\infty,1/n)}{n}.
$$

**人话：** 复杂度只以对数进入；样本以 $1/n$ 进入。$\delta=1/n$ 不是唯一选择：$\log N(\delta)$ 通常随 $\delta\downarrow$ 变大，理论上应对 $\delta$ 做一点权衡，但 $3\lambda\delta$ 已经是 $O(1/n)$，对数项主导时不必纠结。

**误区：** $N$ 是 $\delta=1/n$ 的覆盖数，不是 $|\mathcal{F}|$。有限类可以取 $\delta=0$、$N=|\mathcal{F}|$，扰动项 $3\lambda\delta$ 消失，只剩 $\kappa(\log|\mathcal{F}|+1)/n$。

---

## 3. 覆盖数、packing、体积论证（p.19）

### 3.1 定义

固定 $K\subset\mathbb{R}^d$（后面 $K$ 也可以是函数类，距离换成 $\|\cdot\|_\infty$），$\varepsilon>0$。

- **$\varepsilon$-网：** $N\subset K$，使得每个 $z\in K$ 都有 $x\in N$ 满足 $d(x,z)\le\varepsilon$（讲义用的是**内网**：中心必须在 $K$ 里）。
- **覆盖数** $N(K,d,\varepsilon)$：最小 $\varepsilon$-网的基数。
- **$\varepsilon$-分离 / packing：** $P\subset K$，任意两点 $d(x,y)>\varepsilon$。
- **packing 数** $P(K,d,\varepsilon)$：最大 packing 的基数。

### 3.2 极大 packing 一定是网

**命题。** 极大的 $\varepsilon$-分离集一定是 $\varepsilon$-网，因此 $N(K,d,\varepsilon)\le P(K,d,\varepsilon)$。

**证明。** 设 $P$ 极大。任取 $x\in K$。若 $x\in P$ 则取 $x_0=x$。若 $x\notin P$，极大性说 $P\cup\{x\}$ 不再 $\varepsilon$-分离，故存在 $x_0\in P$ 使 $d(x,x_0)\le\varepsilon$。$\square$

（「极大」= 不能再加点，不一定已经是基数最大；但基数最大的那个也是极大，所以 $N\le P$。）

### 3.3 $P(K,2\varepsilon)\le N(K,\varepsilon)\le P(K,\varepsilon)$

右边上一段已经证了。左边：设 $\{y_1,\ldots,y_M\}$ 是 $2\varepsilon$-packing，$\{x_1,\ldots,x_N\}$ 是 $\varepsilon$-网。每个 $y_j$ 有一个网心 $x_{\pi(j)}$ 满足 $d(y_j,x_{\pi(j)})\le\varepsilon$。若 $\pi(j)=\pi(\ell)$，则 $d(y_j,y_\ell)\le 2\varepsilon$，与 $>2\varepsilon$ 矛盾。故 $\pi$ 单射，$M\le N$。$\square$

### 3.4 体积论证：欧氏单位球

**定理。**

$$
\varepsilon^{-d}\;\le\; N(B_2,\|\cdot\|_2,\varepsilon)\;\le\;\bigl(1+2/\varepsilon\bigr)^d.
$$

**证明（补全，与附录 B p.192 同一套体积）。**

**下界。** 取一张基数为 $N=N(B_2,\varepsilon)$ 的 $\varepsilon$-网 $\{x_i\}$。则 $B_2\subset\bigcup_i(x_i+\varepsilon B_2)$，两边比体积（Lebesgue 测度）：

$$
\mathrm{vol}(B_2)\;\le\; N\cdot\mathrm{vol}(\varepsilon B_2)=N\varepsilon^d\,\mathrm{vol}(B_2)
\;\Longrightarrow\;
N\ge\varepsilon^{-d}.
$$

（网心在 $B_2$ 内、球会伸出 $B_2$ 外面，但「被盖住的体积 $\le$ 各球体积之和」仍然成立。）

**上界。** 取极大 $\varepsilon$-packing，基数 $P=P(B_2,\varepsilon)$。分离 $>\varepsilon$ 推出半径 $\varepsilon/2$ 的开球两两不交；每个 packing 点在 $B_2$ 内，故这些小球都躺在半径 $1+\varepsilon/2$ 的球里：

$$
\bigsqcup_{i=1}^P\bigl(x_i+(\varepsilon/2)B_2\bigr)
\;\subset\;
(1+\varepsilon/2)B_2.
$$

比体积：

$$
P\cdot(\varepsilon/2)^d\;\le\;(1+\varepsilon/2)^d
\;\Longrightarrow\;
P\;\le\;\bigl(1+2/\varepsilon\bigr)^d.
$$

极大 packing 是 $\varepsilon$-网，故 $N\le P\le(1+2/\varepsilon)^d$。$\square$

$\varepsilon\ge 1$ 时左边 $\varepsilon^{-d}\le 1$，而 $N=1$（一个原点就盖住），不等式仍对。附录 B 还写过更粗的 $N(B_2,\varepsilon)\le(3/\varepsilon)^d$（$\varepsilon\le 1$ 时 $1+2/\varepsilon\le 3/\varepsilon$）。

**人话：** $d$ 维单位球，精度 $\varepsilon$，大约 $(1/\varepsilon)^d$ 个点。指数在维度上，这就是「维数灾难」。函数类如果「有效维度」是 $d$，覆盖数就是这个样子。

---

## 4. 线性类与 ReLU 网络的 $\log N$（p.19 下半）

覆盖数是抽象的；要进 Esta 的公式必须对具体 $\mathcal{F}$ 算出 $\log N(\mathcal{F},\|\cdot\|_\infty,\delta)$。基本套路：**参数空间的覆盖 $\times$ 参数到函数的 Lipschitz。**

### 4.1 线性类

$$
\mathcal{F}=\bigl\{f_\theta(x)=x^\top\theta:\ \|\theta\|_2\le B,\ x\in B_2\bigr\}.
$$

$$
|f_{\theta_1}(x)-f_{\theta_2}(x)|
=|(\theta_1-\theta_2)^\top x|
\le\|\theta_1-\theta_2\|_2\|x\|_2
\le\|\theta_1-\theta_2\|_2.
$$

故 $\|f_{\theta_1}-f_{\theta_2}\|_\infty\le\|\theta_1-\theta_2\|_2$。参数球半径 $B$ 的 $\delta$-覆盖数 $\le(1+2B/\delta)^d$，于是

$$
\log N(\mathcal{F},\|\cdot\|_\infty,\delta)
\;\le\;
d\log\bigl(1+2B/\delta\bigr).
$$

代进 Esta（$\delta=1/n$）：统计误差 $\lesssim\bigl(\lambda B+\lambda^2/c\bigr)\,d\log(nB)/n$。OLS 精确结果是 $d\sigma^2/n$；这里多一个 $\log n$，来自「并集 + 固定尺度覆盖」的粗糙，不是线性模型真的更差。

**误区：** 若 $x\in[0,1]^d$ 而不是 $B_2$，$\|x\|_2\le\sqrt{d}$，$\infty$-距离 $\le\sqrt{d}\,\|\theta_1-\theta_2\|_2$，覆盖数变成 $(1+2B\sqrt{d}/\delta)^d$，对数里多 $\frac12\log d$。

### 4.2 ReLU 网络：Lipschitz 常数 $L=O(2D^2(BW)^D)$

$$
\mathcal{F}
=\bigl\{
f_\theta^D:
\text{ReLU 网络，宽度 }W\text{，深度 }D,\
\|\theta\|_\infty\le B,\
x\in[0,1]^d
\bigr\},
$$

$$
f_\theta^D
=(W_D\sigma(\cdot)+b_D)\circ\cdots\circ(W_2\sigma(\cdot)+b_2)\circ(W_1 x+b_1).
$$

$\sigma(t)=\max\{t,0\}$。$\theta$ 收集所有权重和偏置，共 $S$ 个参数（稀疏时 $S$ 是非零个数；全连接大约 $S\asymp dW+(D-2)W^2+W$）。$\|\theta\|_\infty\le B$ 表示每个矩阵条目、每个偏置的绝对值 $\le B$。宽度 $\le W$（输入维 $d\le W$ 时可把 $d$ 吃进 $W$；否则第一层把 $d$ 写成 $W_0=d$）。

目标：找 $L$ 使

$$
|f_{\theta_1}(x)-f_{\theta_2}(x)|\;\le\; L\|\theta_1-\theta_2\|_\infty.
$$

**激活的 $\infty$-界（骨架）。** 令 $h_0(x)=x$，$\|h_0\|_\infty\le 1$；$h_\ell=\sigma(W_\ell h_{\ell-1}+b_\ell)$。行和 $\sum_j|W_{ij}|\le WB$，故

$$
\|h_\ell\|_\infty
\;\le\;
B\bigl(W\|h_{\ell-1}\|_\infty+1\bigr).
$$

记 $M_\ell=\|h_\ell\|_\infty$，$M_0\le 1$，则 $M_\ell\le(BW)M_{\ell-1}+B$。若 $BW\ge 1$，

$$
M_\ell
\;\le\;
(BW)^\ell+B\sum_{k=0}^{\ell-1}(BW)^k
\;\le\;
(BW)^\ell\bigl(1+\ell\bigr)
\;\le\;
2\ell\,(BW)^\ell
$$

（$\ell\ge 1$）。也可用更松的 $M_\ell\le(2BW)^\ell$ 做归纳：$BW\cdot(2BW)^{\ell-1}+B\le(2BW)^\ell$ 在 $BW\ge 1$ 时成立。

**差的递推。** 设 $\|\theta-\theta'\|_\infty\le\varepsilon$，$\Delta_\ell=\|h_\ell-h_\ell'\|_\infty$，$\Delta_0=0$。预激活

$$
\|Wh+b-W'h'-b'\|_\infty
\;\le\;
WB\,\Delta_{\ell-1}+\varepsilon W M_{\ell-1}+\varepsilon.
$$

ReLU 是 1-Lipschitz，输出层只是仿射，同一上界。于是

$$
\Delta_\ell\;\le\; WB\,\Delta_{\ell-1}+\varepsilon(WM_{\ell-1}+1).
$$

从 $\Delta_0=0$ 展开到输出（深度 $D$ 层权重）：

$$
|f_\theta(x)-f_{\theta'}(x)|
\;\le\;
\varepsilon\sum_{k=1}^D (W M_{k-1}+1)\,(WB)^{D-k}.
$$

把 $M_{k-1}\le O((BW)^{k-1})$（或带一个 $k$ 的多项式）代进去，每一项 $\le O(W^D B^{D-1})=O((BW)^D/B)$，一共 $D$ 项，故

$$
L=O\bigl(D(BW)^D\bigr)
$$

（$B\ge 1$ 时把 $1/B$ 吞掉）。讲义写 $L=O(2D^2(BW)^D)$：多一个 $D$ 和常数 2，相当于把 $M_\ell\le\ell(BW)^\ell$、以及宽度/输出维的次要因子一并包进 $O(\cdot)$。**对后面的 $\log N$，$D^2$ 只贡献 $2\log D$，被 $D\log(BWD/\delta)$ 吃掉。**

### 4.3 从参数立方体到函数覆盖数

参数落在 $[-B,B]^S$（$\|\cdot\|_\infty$ 球）。一维区间长度 $2B$ 的 $\eta$-网基数 $\le 1+2B/\eta$，立方体

$$
N\bigl([-B,B]^S,\|\cdot\|_\infty,\eta\bigr)
\;\le\;
\bigl(1+2B/\eta\bigr)^S.
$$

函数 $\infty$-距离 $\le L\times$ 参数 $\infty$-距离，要函数精度 $\delta$ 只需 $\eta=\delta/L$。因此

$$
N(\mathcal{F},\|\cdot\|_\infty,\delta)
\;\le\;
\bigl(1+2BL/\delta\bigr)^S,
$$

$$
\log N(\mathcal{F},\|\cdot\|_\infty,\delta)
\;\le\;
S\log\bigl(1+2BL/\delta\bigr)
\;\le\;
O\bigl(SD\log(BWD/\delta)\bigr),
$$

因为 $\log(BL/\delta)\le\log\bigl(C B\cdot D^2(BW)^D/\delta\bigr)=D\log(BW)+O(\log(BD/\delta))$。这就是 p.19 最后一行。

代进 Esta：统计误差

$$
\lesssim
\Bigl(\lambda B+\frac{\lambda^2}{c}\Bigr)\frac{SD\log(BWDn)}{n}.
$$

**人话：** 网络的「有效参数个数」是 $SD$ 而不是 $S$——深度在覆盖指数里又乘了一次，因为参数到函数的 Lipschitz 是 $(BW)^D$ 爆炸的。这只是最粗的 $\infty$-覆盖；用经验 $L^2$ 覆盖 / 范数约束（Bartlett 等）可以弱得多，那是后续文献，不是这页幻灯片。

---

## 5. 另一条路：对称化 $\to$ Rademacher $\to$ Dudley（p.20 总图）

Esta 要强凸。没有强凸时（0-1 损失、非凸 $\mathcal{F}$ 上相对 $\bar f$ 的超额），退回 $E_{\mathrm{gen}}$。

本节到 §11 的符号约定（把幻灯片里前后不一的 $E_{\mathrm{gen}}$ 钉死）：

$$
\Delta_n(\mathcal{F}):=\sup_{f\in\mathcal{F}}\bigl|\widehat L(f)-L(f)\bigr|
=\|P-P_n\|_{\ell\mathcal{F}}.
$$

Lec1 的 $E_{\mathrm{gen}}=2\Delta_n(\mathcal{F})$（随机量）。对「$\mathcal{F}$ 内超额」（p.20 的 $f^*=\arg\min_{\mathcal{F}}L$）：

$$
L(f_A)-L(f^*)
\le
\bigl(L(f_A)-\widehat L(f_A)\bigr)
+\tau
+\bigl(\widehat L(f^*)-L(f^*)\bigr)
\le
\tau+2\Delta_n(\mathcal{F}).
$$

取期望：

$$
\mathbb{E}[\mathcal{E}(f_A)]
\;\le\;
\tau+2\mathbb{E}[\Delta_n(\mathcal{F})].
$$

对称化（§8）给出 $\mathbb{E}[\Delta_n]\le 2\,\mathrm{Rad}(\ell\mathcal{F})$，故

$$
\mathbb{E}[\mathcal{E}(f_A)]
\;\le\;
\tau+4\,\mathrm{Rad}(\ell\mathcal{F}).
$$

Lipschitz 收缩（§7）给出 $\mathrm{Rad}(\ell\mathcal{F})\le 2\lambda\,\mathrm{Rad}(\mathcal{F})+O(B/\sqrt{n})$，故

$$
\mathbb{E}[\mathcal{E}(f_A)]
\;\le\;
\tau+8\lambda\,\mathrm{Rad}(\mathcal{F})+O(B/\sqrt{n}).
$$

Dudley（§9–§10）再把 $\mathrm{Rad}(\mathcal{F})$ 写成覆盖熵积分。这就是用户要求串起来的那条链；讲义 p.20 把 $\tau+2\mathbb{E}\Delta_n$ 和 $4\mathrm{Rad}$ 写在同一行，$\tau$ 有时被默认为 0。

下面先把 Rademacher、Massart、结构性质、对称化、chaining 逐个补成可跟的证明。

---

## 6. Rademacher 过程与 Massart finite lemma（p.21）

### 6.1 定义

Rademacher 随机变量：$\mathbb{P}(\tau_i=1)=\mathbb{P}(\tau_i=-1)=1/2$，独立。对 $\Theta\subset\mathbb{R}^n$，过程

$$
R_\theta=\langle\tau,\theta\rangle=\sum_{i=1}^n\tau_i\theta_i,
$$

**Rademacher 复杂度**（带绝对值，跟讲义一致）

$$
R(\Theta)=\mathbb{E}_\tau\Bigl[\sup_{\theta\in\Theta}|R_\theta|\Bigr].
$$

函数类 $\mathcal{G}=\{g:\mathbb{R}^d\to\mathbb{R}\}$，样本 $X_1,\ldots,X_n$，限制

$$
\mathcal{G}|_X=\bigl\{(g(X_1),\ldots,g(X_n)):g\in\mathcal{G}\bigr\}\subset\mathbb{R}^n.
$$

$$
\mathrm{Rad}(\mathcal{G})=\|R_n\|_{\mathcal{G}}
:=\mathbb{E}_X\Bigl[\frac1n R(\mathcal{G}|_X)\Bigr]
=\mathbb{E}_{X,\tau}\Bigl[\sup_{g\in\mathcal{G}}\Bigl|\frac1n\sum_{i=1}^n\tau_i g(X_i)\Bigr|\Bigr].
$$

讲义的 $\|R_n\|$ 已经含 $1/n$。印刷事故：`Randemacher` = Rademacher。

### 6.2 Massart finite lemma

**定理。** $A\subset\mathbb{R}^n$ 有限，$R=\max_{a\in A}\|a\|_2$。则

$$
R(A)\;\le\;\sqrt{2R^2\log(2|A|)}.
$$

**证明（Chernoff + 并集，补全讲义没写的优化 $\lambda$）。**

先控制不带绝对值的 $\mathbb{E}\sup_{a\in A}\langle\tau,a\rangle$。Jensen（$e^{\lambda\cdot}$ 凸）+ $\sup e\le\sum e$：

$$
\exp\Bigl(\lambda\mathbb{E}\sup_a\langle\tau,a\rangle\Bigr)
\le
\mathbb{E}\exp\bigl(\lambda\sup_a\langle\tau,a\rangle\bigr)
=\mathbb{E}\sup_a e^{\lambda\langle\tau,a\rangle}
\le
\sum_{a\in A}\mathbb{E}e^{\lambda\langle\tau,a\rangle}.
$$

对固定 $a$，独立性 + $\cosh(u)\le e^{u^2/2}$：

$$
\mathbb{E}e^{\lambda\langle\tau,a\rangle}
=\prod_{i=1}^n\mathbb{E}e^{\lambda\tau_i a_i}
=\prod_{i=1}^n\cosh(\lambda a_i)
\le
\prod_{i=1}^n\exp(\lambda^2 a_i^2/2)
=\exp\bigl(\lambda^2\|a\|_2^2/2\bigr)
\le
\exp(\lambda^2 R^2/2).
$$

故 $\lambda\mathbb{E}\sup\langle\tau,a\rangle\le\log|A|+\lambda^2 R^2/2$，即

$$
\mathbb{E}\sup_a\langle\tau,a\rangle
\;\le\;
\frac{\log|A|}{\lambda}+\frac{\lambda R^2}{2}.
$$

取 Chernoff 参数 $\lambda=\sqrt{2\log|A|/R^2}$（$R=0$ 显然；这里 $\lambda$ 不是损失的 Lipschitz 常数），得 $\sqrt{2R^2\log|A|}$。

带绝对值：$\sup_a|\langle\tau,a\rangle|=\sup_{a\in A\cup(-A)}\langle\tau,a\rangle$，$|A\cup(-A)|\le 2|A|$，同一套 $R$，故 $\sqrt{2R^2\log(2|A|)}$。$\square$

**人话：** 有限个高斯/Rademacher 最大值，期望是「半径 $\times\sqrt{\log\text{个数}}$」，不是个数本身。这就是为什么 Esta 和 Rad 里出现 $\log N$ 而不是 $N$。

---

## 7. Rademacher 的结构性质（p.22）

以下 $\|R_n\|_{\mathcal{F}}$ 都是 $\mathrm{Rad}(\mathcal{F})$。

### 7.1 单调、齐次

$\mathcal{F}\subset\mathcal{G}\Rightarrow\|R_n\|_{\mathcal{F}}\le\|R_n\|_{\mathcal{G}}$（sup 变小）。  
$\|R_n\|_{c\mathcal{F}}\le|c|\,\|R_n\|_{\mathcal{F}}$（绝对值把符号吃掉）。

### 7.2 加一个有界函数

$\bigl|\|R_n\|_{\mathcal{F}+g}-\|R_n\|_{\mathcal{F}}\bigr|\le\|R_n\|_g$。三角不等式：$\sup|R_{f}+R_g|$ 与 $\sup|R_f|$ 最多差 $\sup|R_g|$；单点类 $\{g\}$ 的 sup 就是 $|R_g|$。

若 $|g(X)|\le 1$，向量 $(g(X_1),\ldots,g(X_n))$ 的欧氏范数 $\le\sqrt{n}$。Massart，$|A|=1$：

$$
R(\{g\}|_X)\;\le\;\sqrt{2n\log 2}
\;\Longrightarrow\;
\|R_n\|_g\;\le\;\sqrt{\frac{2\log 2}{n}}.
$$

讲义写「$|g|\le 1$ 则差 $\le\sqrt{2\log 2/n}$」。

### 7.3 凸包不变

$\|R_n\|_{\mathrm{conv}(\mathcal{F})}=\|R_n\|_{\mathcal{F}}$。

**证明。** 线性泛函 $\theta\mapsto\langle\tau,\theta\rangle$ 在凸集上的最大值在极点取到。对有限凸组合：$\langle\tau,\sum\lambda_j v_j\rangle=\sum\lambda_j\langle\tau,v_j\rangle\le\max_j\langle\tau,v_j\rangle$；绝对值拆成 $\sup\langle\tau,\cdot\rangle$ 与 $\sup\langle-\tau,\cdot\rangle$ 两个线性问题。闭凸包用极限。$\square$

### 7.4 Lipschitz 收缩（Ledoux–Talagrand 1991, Corollary 3.17）

讲义原文（p.22，红字引用，下面按讲义陈述写完，不只写「Due to」）。

**定理（讲义形式）。** 若 $\varphi:\mathbb{R}\times\mathcal{Z}\to\mathbb{R}$ 满足：对每个固定的 $z$，$\alpha\mapsto\varphi(\alpha,z)$ 是 1-Lipschitz，并且 $\varphi(0,z)=0$。记 $\varphi(\mathcal{F})=\{z\mapsto\varphi(f(z),z):f\in\mathcal{F}\}$。则

$$
\|R_n\|_{\varphi(\mathcal{F})}\;\le\; 2\|R_n\|_{\mathcal{F}}.
$$

先把假设变成标量映射。样本 $X_1,\ldots,X_n$ 冻结时，令 $\varphi_i(t):=\varphi(t,X_i)$。则每个 $\varphi_i:\mathbb{R}\to\mathbb{R}$ 是 1-Lipschitz，且 $\varphi_i(0)=0$。于是 $|\varphi_i(t)|=|\varphi_i(t)-\varphi_i(0)|\le|t|$。$\|R_n\|$ 已含 $1/n$，只需证

$$
\mathbb{E}_\tau\sup_{f\in\mathcal{F}}\Bigl|\sum_{i=1}^n\tau_i\varphi_i\bigl(f(X_i)\bigr)\Bigr)
\;\le\;
2\,\mathbb{E}_\tau\sup_{f\in\mathcal{F}}\Bigl|\sum_{i=1}^n\tau_i f(X_i)\Bigr|.
$$

对 $X$ 再取期望即定理。下面分三步：逐坐标比较（因子 1，不带绝对值）$\to$ 绝对值拆成正负（因子 2）$\to$ $\lambda$-Lipschitz。

**引理（Talagrand 收缩，不带绝对值）。** $\varphi_i:\mathbb{R}\to\mathbb{R}$ 皆 1-Lipschitz（此条**不**需要 $\varphi_i(0)=0$）。则

$$
\mathbb{E}\sup_{f\in\mathcal{F}}\sum_{i=1}^n\tau_i\varphi_i\bigl(f(X_i)\bigr)
\;\le\;
\mathbb{E}\sup_{f\in\mathcal{F}}\sum_{i=1}^n\tau_i f(X_i).
$$

**证明。** 对 $k=0,1,\ldots,n$ 令

$$
S_k(f)
\;:=\;
\sum_{i=1}^k\tau_i f(X_i)
+\sum_{i=k+1}^n\tau_i\varphi_i\bigl(f(X_i)\bigr).
$$

$S_0$ 全是 $\varphi$，$S_n$ 全是恒等。只要证对每个 $k=1,\ldots,n$，

$$
\mathbb{E}\sup_f S_{k-1}(f)\;\le\;\mathbb{E}\sup_f S_k(f).
$$

固定 $k$。冻结 $\tau_{i\neq k}$ 与全部样本，令

$$
a(f)
\;:=\;
\sum_{i<k}\tau_i f(X_i)
+\sum_{i>k}\tau_i\varphi_i\bigl(f(X_i)\bigr),
$$

并写 $f_k:=f(X_k)$。只需对 $\tau_k$ 比较

$$
\mathbb{E}_{\tau_k}\sup_f\bigl(\tau_k\varphi_k(f_k)+a(f)\bigr)
\;\le\;
\mathbb{E}_{\tau_k}\sup_f\bigl(\tau_k f_k+a(f)\bigr).
$$

左边按 $\tau_k=\pm 1$ 各 $1/2$ 拆开：

$$
\begin{aligned}
&\frac12\sup_f\bigl(\varphi_k(f_k)+a(f)\bigr)
+\frac12\sup_g\bigl(-\varphi_k(g_k)+a(g)\bigr)\\
&\qquad=
\frac12\sup_{f,g\in\mathcal{F}}
\bigl[a(f)+a(g)+\varphi_k(f_k)-\varphi_k(g_k)\bigr].
\end{aligned}
$$

1-Lipschitz：$\varphi_k(f_k)-\varphi_k(g_k)\le|f_k-g_k|$，故上式

$$
\le
\frac12\sup_{f,g}\bigl[a(f)+a(g)+|f_k-g_k|\bigr].
$$

$a(f)+a(g)$ 对 $(f,g)$ 对称。右边 $\le$ 左边是因为 $f_k-g_k\le|f_k-g_k|$。反过来：任取一对 $(f,g)$，若 $f_k\ge g_k$ 则 $|f_k-g_k|=f_k-g_k$，同一对已在右边；若 $f_k<g_k$，换成 $(g,f)$，则 $a(g)+a(f)+g_k-f_k=a(f)+a(g)+|f_k-g_k|$。故两边的 sup 相等：

$$
\sup_{f,g}\bigl[a(f)+a(g)+|f_k-g_k|\bigr]
=
\sup_{f,g}\bigl[a(f)+a(g)+f_k-g_k\bigr].
$$

右边正是

$$
\sup_f\bigl(f_k+a(f)\bigr)+\sup_g\bigl(-g_k+a(g)\bigr)
=
2\,\mathbb{E}_{\tau_k}\sup_f\bigl(\tau_k f_k+a(f)\bigr).
$$

乘 $1/2$ 即所要的单坐标比较。对 $k=1,\ldots,n$ 逐次替换，得到 $\mathbb{E}\sup S_0\le\mathbb{E}\sup S_n$。$\square$

**从无绝对值到讲义的因子 2（这里用 $\varphi_i(0)=0$ 的讲义假设）。** 绝对值拆成两个线性问题：

$$
\sup_f\Bigl|\sum_i\tau_i\varphi_i(f_i)\Bigr|
=
\sup_f\max\Bigl(\sum_i\tau_i\varphi_i(f_i),\;-\sum_i\tau_i\varphi_i(f_i)\Bigr)
\le
\sup_f\sum_i\tau_i\varphi_i(f_i)
+\sup_f\sum_i(-\tau_i)\varphi_i(f_i).
$$

取期望。$-\tau$ 与 $\tau$ 同分布，两项相等，故

$$
\mathbb{E}\sup_f\Bigl|\sum_i\tau_i\varphi_i(f_i)\Bigr|
\;\le\;
2\,\mathbb{E}\sup_f\sum_i\tau_i\varphi_i(f_i).
$$

对右边用引理（$\varphi_i$ 1-Lipschitz）：

$$
\mathbb{E}\sup_f\sum_i\tau_i\varphi_i(f_i)
\;\le\;
\mathbb{E}\sup_f\sum_i\tau_i f(X_i)
\;\le\;
\mathbb{E}\sup_f\Bigl|\sum_i\tau_i f(X_i)\Bigr|.
$$

两边除以 $n$，再对 $X$ 取期望，即 $\|R_n\|_{\varphi(\mathcal{F})}\le 2\|R_n\|_{\mathcal{F}}$。

$\varphi_i(0)=0$ 在讲义里还有一层用处：它保证 $|\varphi_i(t)|\le|t|$，从而 $\varphi(\mathcal{F})$ 的坐标不会比 $\mathcal{F}$ 本身更大；后面把 $\ell(\alpha,y)$ 改写成 $\ell(\alpha,y)-\ell(0,y)$ 时，新映射过原点，正好套进这条定理。无绝对值的引理本身不需要过原点。

**$\lambda$-Lipschitz。** 若 $\alpha\mapsto\varphi(\alpha,z)$ 是 $\lambda$-Lipschitz，令 $\psi=\varphi/\lambda$，则 $\psi$ 是 1-Lipschitz。齐次性 $\|R_n\|_{c\mathcal{G}}=|c|\,\|R_n\|_{\mathcal{G}}$ 给出因子 $2\lambda$：

$$
\|R_n\|_{\varphi(\mathcal{F})}\;\le\; 2\lambda\,\|R_n\|_{\mathcal{F}}.
$$

### 7.5 应用到损失类 $\ell\mathcal{F}$

$\ell\mathcal{F}=\{(x,y)\mapsto\ell(f(x),y):f\in\mathcal{F}\}$。若 $\alpha\mapsto\ell(\alpha,y)$ 是 1-Lipschitz，令

$$
\varphi(\alpha,(x,y))=\ell(\alpha,y)-\ell(0,y),
$$

则 $\varphi(0,\cdot)=0$，$\varphi(\mathcal{F})=\ell\mathcal{F}-\ell_0$，$\|R_n\|_{\varphi(\mathcal{F})}\le 2\|R_n\|_{\mathcal{F}}$。若再有 $|\ell|\le 1$，§7.2 给出

$$
\|R_n\|_{\ell\mathcal{F}}
\;\le\;
2\|R_n\|_{\mathcal{F}}+\sqrt{\frac{2\log 2}{n}}.
$$

一般 $\mathrm{Lip}(\lambda)$、$|f|\le B$、$|\ell(0,y)|$ 有界（平方损失且 $|Y|\le B$ 时 $\ell(0,Y)=Y^2\le B^2$）：

$$
\mathrm{Rad}(\ell\mathcal{F})
\;\le\;
2\lambda\,\mathrm{Rad}(\mathcal{F})+O(B/\sqrt{n}).
$$

讲义 p.20 的 $O(B/\sqrt{n})$ 就是这个单点类余项（常数依损失有界性而定，不必记死）。

**误区：** 收缩的 2 来自定义里的绝对值。不少书对 $\mathbb{E}\sup\sum\tau_i f_i$（不带绝对值、类关于 0 对称）写因子 1。对作业：先看老师的 $\mathrm{Rad}$ 有没有绝对值。

---

## 8. 对称化（p.23）：ghost sample + $\tau_i$ 交换

**定理。** $\|P-P_n\|_{\mathcal{G}}=\sup_{g\in\mathcal{G}}|Pg-P_n g|$。则

$$
\mathbb{E}\|P-P_n\|_{\mathcal{G}}\;\le\; 2\|R_n\|_{\mathcal{G}}.
$$

**证明（逐步对应幻灯片）。**

**第一步（条件期望拉进绝对值）。** $X_1',\ldots,X_n'$ 是独立于 $X_1^n$ 的 i.i.d. 拷贝（ghost）。$Pg=\mathbb{E}[g(X_i')\mid X_1^n]$（其实与 $X_1^n$ 独立），故

$$
Pg-P_n g
=\mathbb{E}\Bigl[\frac1n\sum_{i=1}^n\bigl(g(X_i')-g(X_i)\bigr)\Bigm|X_1^n\Bigr].
$$

于是

$$
\mathbb{E}\|P-P_n\|_{\mathcal{G}}
=\mathbb{E}\sup_g\Bigl|\mathbb{E}\bigl[\tfrac1n\sum(g(X_i')-g(X_i))\mid X_1^n\bigr]\Bigr|.
$$

对每个冻结的 $X_1^n$，$|\mathbb{E}[Y_g\mid X]|\le\mathbb{E}[|Y_g|\mid X]\le\mathbb{E}[\sup_g|Y_g|\mid X]$，sup 与外层期望对调（非负）得

$$
\mathbb{E}\|P-P_n\|_{\mathcal{G}}
\;\le\;
\mathbb{E}\sup_g\Bigl|\frac1n\sum_{i=1}^n\bigl(g(X_i')-g(X_i)\bigr)\Bigr|.
$$

**第二步（乘上 $\tau_i$ 不改分布）。** 对每个 $i$，$(X_i,X_i')$ 与 $(X_i',X_i)$ 同分布。独立掷一枚公平硬币 $\tau_i$：$\tau_i=1$ 保持 $(X_i,X_i')$，$\tau_i=-1$ 对换。则

$$
g(X_i')-g(X_i)
\quad\text{与}\quad
\tau_i\bigl(g(X_i')-g(X_i)\bigr)
$$

同分布，而且这对所有坐标同时成立（$\tau_i$ 独立）。sup 的分布因而也不变：

$$
\mathbb{E}\sup_g\Bigl|\frac1n\sum(g(X_i')-g(X_i))\Bigr|
=
\mathbb{E}_{X,X',\tau}\sup_g\Bigl|\frac1n\sum\tau_i\bigl(g(X_i')-g(X_i)\bigr)\Bigr|.
$$

讲义说「对任意固定的 $\{\tau_i\}$ 都对，所以可以对随机的 $\tau$ 再取期望」——两种说法等价：你可以从「先对换再平均」或「先乘 $\pm 1$ 再平均」看。

**第三步（三角不等式拆成两份 Rademacher）。**

$$
\Bigl|\sum\tau_i(g(X_i')-g(X_i))\Bigr|
\le
\Bigl|\sum\tau_i g(X_i')\Bigr|
+\Bigl|\sum\tau_i g(X_i)\Bigr|,
$$

sup 亦然。$X$ 与 $X'$ 同分布，两项期望相等，各等于 $n\|R_n\|_{\mathcal{G}}$。除以 $n$ 得 $2\|R_n\|_{\mathcal{G}}$。$\square$

因此 $\mathbb{E}[\Delta_n(\mathcal{F})]\le 2\,\mathrm{Rad}(\ell\mathcal{F})$。接上 §5：$\mathbb{E}[\mathcal{E}(f_A)]\le\tau+4\,\mathrm{Rad}(\ell\mathcal{F})$。

**误区：** 对称化给的是期望意义的均匀偏差，不是高概率。高概率要用 McDiarmid / 有界差，从期望再涨一个 $\sqrt{(\log(1/\delta))/n}$。

---

## 9. Dudley 熵积分：定理（p.24）

样本 $Z_n=(Z_1,\ldots,Z_n)$，函数类 $\mathcal{U}$ 的限制 $\mathcal{U}|_{Z_n}\subset\mathbb{R}^n$。**一致覆盖数**

$$
N_n(\varepsilon,\mathcal{U},\ell_\infty)
=\max_{Z_n\in\Omega^n}N(\varepsilon,\mathcal{U}|_{Z_n},\ell_\infty).
$$

它 $\le N(\mathcal{U},\|\cdot\|_{L^\infty(\Omega)},\varepsilon)$（函数上的均匀覆盖一定给出每条样本上的覆盖）。

**定理（Dudley entropy formula，讲义形式）。** 假定 $0\in\mathcal{U}$，且 $\|u\|_{L^\infty}\le B$ 对所有 $u\in\mathcal{U}$。则

$$
\|R_n\|_{\mathcal{U}}
\;\le\;
\inf_{0<\delta<B}
\Biggl(
4\delta
+\frac{12}{\sqrt{n}}
\int_\delta^B
\sqrt{\log\bigl(2N_n(\varepsilon,\mathcal{U},\ell_\infty)\bigr)}\,d\varepsilon
\Biggr).
$$

**人话：** 不要用一张很细的网把整个类一次性并集（那会留下 $\sqrt{\log N(\delta_{\min})}$，$\delta_{\min}$ 太小时爆炸）。改成一层层网：粗网负责大尺度振荡，相邻两层的差很小，Massart 的半径跟着尺度走。把离散层求和变成积分，就是熵积分。

---

## 10. Dudley 的完整证明（p.25–27）：chaining

只需对**冻结的** $Z_n$ 证明

$$
\mathbb{E}_\tau\sup_{u\in\mathcal{U}}\Bigl|\frac1n\sum_{i=1}^n\tau_i u(Z_i)\Bigr|
$$

有上述上界（再对 $Z_n$ 取期望，$N(\varepsilon,\mathcal{U}|_{Z_n})\le N_n$）。

### 10.1 二进网

令 $\varepsilon_k=2^{-k+1}B$，$k=1,\ldots,K$。则 $\varepsilon_1=B$，$\varepsilon_{k+1}=\varepsilon_k/2$。设 $C_k$ 是 $\mathcal{U}|_{Z_n}$ 的一张 $\varepsilon_k$-网，$|C_k|=N(\varepsilon_k,\mathcal{U}|_{Z_n},\ell_\infty)$。对每个 $u$，记 $c^k(u)\in C_k$ 为 $\ell_\infty$ 最近（或任意足够近）的网心，$\|u|_{Z_n}-c^k(u)\|_\infty\le\varepsilon_k$。

### 10.2 望远镜

$$
u|_{Z_n}
=
\bigl(u|_{Z_n}-c^K(u)\bigr)
+\sum_{j=1}^{K-1}\bigl(c^j(u)-c^{j+1}(u)\bigr)
+c^1(u).
$$

取 $\frac1n\sum\tau_i(\cdot)$ 的绝对值，sup + 期望，三角不等式拆成三项。

### 10.3 第三项：$C_1=\{0\}$

$0\in\mathcal{U}$ 且直径 $\le B=\varepsilon_1$，零向量本身就是 $\varepsilon_1$-网。取 $C_1=\{0\}$，则 $c^1\equiv 0$，第三项消失。

**补全：** 若 $0\notin\mathcal{U}$ 但函数仍有界 $B$，可把 $\mathcal{U}$ 换成 $\mathcal{U}-u_0$，Rademacher 多一个单点项 $O(B/\sqrt{n})$，与收缩余项同类。

### 10.4 第一项：勘误讲义的「Hölder」（p.26）

讲义写

$$
\Bigl|\frac1n\sum_i\tau_i a_i\Bigr|
\le
\frac1n\Bigl(\sum_i|\tau_i|\Bigr)\Bigl(\sum_i\max_i|a_i|\Bigr)
$$

还声称这 $\le\varepsilon_K$。这是错的：$\sum|\tau_i|=n$，再乘 $\sum\max|a_i|$ 会多出 $n\varepsilon_K$，完全废掉。

**正确（补全）：** 令 $a_i=u(Z_i)-c^K_i(u)$，则 $\|a\|_\infty\le\varepsilon_K$，$|\tau_i|=1$，故

$$
\Bigl|\frac1n\sum_{i=1}^n\tau_i a_i\Bigr|
\;\le\;
\frac1n\sum_{i=1}^n|a_i|
\;\le\;
\|a\|_\infty
\;\le\;
\varepsilon_K.
$$

（更短：$\le\|a\|_\infty\cdot\frac1n\sum|\tau_i|=\|a\|_\infty$。）对 $u$ 取 sup、对 $\tau$ 取期望，第一项 $\le\varepsilon_K$。

### 10.5 增量类 $V_j$、基数与直径 $D_j$

$$
V_j=\bigl\{c^j(u)-c^{j+1}(u):u\in\mathcal{U}\bigr\}.
$$

$|V_j|\le|C_j|\,|C_{j+1}|$。覆盖数随尺度变细不减，可取 $|C_j|\le|C_{j+1}|$，故 $|V_j|\le|C_{j+1}|^2$。

直径（欧氏，Massart 要用 $\|\cdot\|_2$）：

$$
\begin{aligned}
D_j
:=\sup_{v\in V_j}\|v\|_2
&\le\sqrt{n}\sup_u\|c^j(u)-c^{j+1}(u)\|_\infty\\
&\le\sqrt{n}\sup_u\Bigl(\bigl\|c^j(u)-u|_{Z_n}\bigr\|_\infty+\bigl\|u|_{Z_n}-c^{j+1}(u)\bigr\|_\infty\Bigr)\\
&\le\sqrt{n}(\varepsilon_j+\varepsilon_{j+1})
=\sqrt{n}(2\varepsilon_{j+1}+\varepsilon_{j+1})
=3\sqrt{n}\,\varepsilon_{j+1}.
\end{aligned}
$$

### 10.6 Massart 控制增量

$$
\mathbb{E}_\tau\sup_{v\in V_j}\Bigl|\frac1n\sum_i\tau_i v_i\Bigr|
\le
\frac1n\sqrt{2D_j^2\log(2|V_j|)}
=\frac{D_j}{n}\sqrt{2\log(2|V_j|)}.
$$

代入 $D_j\le 3\sqrt{n}\,\varepsilon_{j+1}$：

$$
\frac{3\sqrt{n}\,\varepsilon_{j+1}}{n}\sqrt{2\log(2|V_j|)}
=\frac{3\sqrt{2}\,\varepsilon_{j+1}}{\sqrt{n}}\sqrt{\log(2|V_j|)}.
$$

要接到讲义的 $6\varepsilon_{j+1}/\sqrt{n}\sqrt{\log(2|C_{j+1}|)}$，需要 $3\sqrt{2}\,\sqrt{\log(2|V_j|)}\le 6\sqrt{\log(2|C_{j+1}|)}$。两边平方：

$$
\Bigl(\frac{3\sqrt{2}}{6}\Bigr)^2\log(2|V_j|)
=\frac12\log(2|V_j|)
\le
\frac12\log\bigl(2|C_{j+1}|^2\bigr)
=\tfrac12\log 2+\log|C_{j+1}|
\le
\log 2+\log|C_{j+1}|
=\log\bigl(2|C_{j+1}|\bigr).
$$

故

$$
\mathbb{E}_\tau\sup_{u}\Bigl|\frac1n\sum_i\tau_i\bigl(c^j_i(u)-c^{j+1}_i(u)\bigr)\Bigr|
\;\le\;
\frac{6\varepsilon_{j+1}}{\sqrt{n}}\sqrt{\log\bigl(2|C_{j+1}|\bigr)}.
$$

对 $j=1,\ldots,K-1$ 求和。

### 10.7 离散和 $\to$ 积分（补全 dyadic 因子 2）

目前

$$
\mathbb{E}_\tau\sup\Bigl|\frac1n\sum\tau_i u(Z_i)\Bigr|
\;\le\;
\varepsilon_K
+\sum_{j=1}^{K-1}
\frac{6\varepsilon_{j+1}}{\sqrt{n}}
\sqrt{\log\bigl(2|C_{j+1}|\bigr)}.
$$

$\varepsilon_{j+1}-\varepsilon_{j+2}=\varepsilon_{j+1}/2$，所以 $\varepsilon_{j+1}=2(\varepsilon_{j+1}-\varepsilon_{j+2})$。熵积分的被积函数 $\sqrt{\log(2N_n(\varepsilon))}$ 随 $\varepsilon$ 增大而减小，在区间 $[\varepsilon_{j+2},\varepsilon_{j+1}]$ 上最小值在右端点，因此

$$
\int_{\varepsilon_{j+2}}^{\varepsilon_{j+1}}
\sqrt{\log(2N_n(\varepsilon))}\,d\varepsilon
\;\ge\;
(\varepsilon_{j+1}-\varepsilon_{j+2})\sqrt{\log(2N_n(\varepsilon_{j+1}))}
=\frac{\varepsilon_{j+1}}{2}\sqrt{\log(2|C_{j+1}|)},
$$

即

$$
\varepsilon_{j+1}\sqrt{\log(2|C_{j+1}|)}
\;\le\;
2\int_{\varepsilon_{j+2}}^{\varepsilon_{j+1}}
\sqrt{\log(2N_n(\varepsilon))}\,d\varepsilon.
$$

这是「和 $\le$ 积分」必须付的 **dyadic 因子 2**。于是 6 变 12：

$$
\sum_{j=1}^{K-1}6\varepsilon_{j+1}\sqrt{\log(2|C_{j+1}|)}
\;\le\;
12\int_{\varepsilon_{K+1}}^{\varepsilon_2}
\sqrt{\log(2N_n(\varepsilon))}\,d\varepsilon
\;\le\;
12\int_{\varepsilon_{K+1}}^B
\sqrt{\log(2N_n(\varepsilon))}\,d\varepsilon.
$$

讲义把 6 写成 $12(\varepsilon_j-\varepsilon_{j+1})$ 再直接认成 Riemann 和，方向其实是「和 $\ge$ 积分」；上面这段才是 $\le$。

### 10.8 用 $\delta$ 换掉离散的 $K$：为什么是 $4\delta$

对任意 $0<\delta<B$，取最大的整数 $K$ 使 $\varepsilon_{K+1}>\delta$。则 $\varepsilon_{K+2}\le\delta$（否则 $K+1$ 也满足）。而 $\varepsilon_K=4\varepsilon_{K+2}\le 4\delta$。第一项 $\varepsilon_K\le 4\delta$，积分下限 $\varepsilon_{K+1}>\delta$ 换成 $\delta$ 只会变大。故

$$
\mathbb{E}_\tau\sup\Bigl|\frac1n\sum\tau_i u(Z_i)\Bigr|
\;\le\;
4\delta
+\frac{12}{\sqrt{n}}
\int_\delta^B
\sqrt{\log\bigl(2N_n(\varepsilon,\mathcal{U},\ell_\infty)\bigr)}\,d\varepsilon.
$$

对 $\delta$ 取 inf 即定理。$\square$

**常数松紧：** 4 来自二进尺度跳了两档；12 来自 $3\sqrt{2}\le 6$ 再乘 dyadic 的 2。用更密的尺度、更紧的 Massart，数字都能降，积分形状不变。

---

## 11. 把整条链串起来

### 11.1 不靠强凸：慢速率

$$
\begin{aligned}
\mathbb{E}[\mathcal{E}(f_A)]
&\le
\tau+2\mathbb{E}[\Delta_n(\mathcal{F})]
&&\text{（$\mathcal{F}$ 内超额；Lec1 的 $E_{\mathrm{gen}}=2\Delta_n$）}\\
&\le
\tau+4\,\mathrm{Rad}(\ell\mathcal{F})
&&\text{（对称化）}\\
&\le
\tau+8\lambda\,\mathrm{Rad}(\mathcal{F})+O(B/\sqrt{n})
&&\text{（收缩 + 单点余项）}\\
&\le
\tau+8\lambda\inf_{0<\delta<B}
\Biggl(4\delta+\frac{12}{\sqrt{n}}\int_\delta^B\sqrt{\log(2N_n(\varepsilon))}\,d\varepsilon\Biggr)
+O(B/\sqrt{n}).
\end{aligned}
$$

若还有 $E_{\mathrm{app}}$（相对 Bayes），左边换成 $\mathbb{E}[L(f_A)-L(\bar f)]$，再加 $E_{\mathrm{app}}$。

**线性类例子。** $\log N(\varepsilon)\le d\log(1+2B/\varepsilon)$。熵积分 $\int_\delta^B\sqrt{d\log(B/\varepsilon)}\,d\varepsilon=O(B\sqrt{d})$ 量级（$\delta$ 不必非常小），于是 $\mathrm{Rad}(\mathcal{F})\lesssim B\sqrt{d/n}$，超额 $\lesssim\lambda B\sqrt{d/n}$。这是**慢速率**，没有用到强凸。

### 11.2 靠强凸：快速率

$$
\mathbb{E}[\mathcal{E}(f_A)]
\;\le\;
E_{\mathrm{sta}}+2E_{\mathrm{app}}+2\tau,
\qquad
E_{\mathrm{sta}}
\;\le\;
\frac{(16\lambda B+4\lambda^2/c)(\log N+1)+3\lambda}{n},
$$

$N=N(\mathcal{F},\|\cdot\|_\infty,1/n)$。线性类 $\log N\lesssim d\log(nB)$，得到 $\frac{d\log n}{n}$ 型，与 OLS 的 $\frac{d}{n}$ 只差对数。ReLU：$\log N\lesssim SD\log(BWDn)$。

### 11.3 两条链何时用哪条

| 条件 | 工具 | 统计项典型速率 |
|------|------|----------------|
| 损失有界 Lipschitz，无强凸 | 对称化 + Rad + Dudley | $\lambda$ × 熵积分 $\sim n^{-1/2}$ |
| 再加 $L$ 在 $f^*$ 局部强凸 | 覆盖网 + Bernstein（Esta） | $(\lambda B+\lambda^2/c)(\log N)/n$ |
| 有限类、平方损失、模型正确 | 两者都可用 | 快速率多一个 $\log N$；Rad 链仍是慢的，除非再做局部 Rademacher / peeling |

**误区：** 不能把 Dudley 的 $\sqrt{(\log N)/n}$ 和 Esta 的 $(\log N)/n$ 乘在一起「两个都要」。它们是同一项超额风险的两种上界，取更小的那个。

---

## 12. 收束

Lec2 统计误差这一段，数学上只做了三件事：

1. 用一张网把函数类变成有限个点（覆盖数）；
2. 用集中不等式控制有限个经验过程（Bernstein 或 Massart）；
3. 要么直接积分尾界得到 Esta，要么用对称化把均匀偏差换成 Rademacher，再用 chaining 把 Massart 从「一张网」升级成「熵积分」。

和 Lec1 对照：线性高斯模型里「覆盖数的对数 $\approx$ 维度 $d$」，「Bernstein 的方差 $\approx\sigma^2$」，Esta 就回到 $\frac{d}{n}$。网络把 $d$ 换成 $SD\log(BWD/\delta)$。

下一份：[02b_Lec2_逼近误差](/blog/fods-approximation-error/)——$\mathcal{F}$ 是 ReLU 网络时，$E_{\mathrm{app}}$ 对 Hölder 函数能有多小。
