---
title: "数学附录 B：概率论与集中不等式"
description: "从概率空间与条件期望到次高斯变量、Hoeffding、Bernstein 与 McDiarmid。"
pubDate: 2026-10-11
tags:
  - 数据科学
  - 学习理论
  - FODS
category: course
series: fods
order: 9
cover: /covers/post-math.svg
---

对应讲义：`Fods_26.pdf` p.169–192（Review of probability：Basic definitions + Concentration inequalities）。

这份附录是给**完全零基础**的同学写的。目标不是把你变成测度论专家，而是让你以后看见 $\mathbb{E}$、$\mathrm{Var}$、$\sim N$、次高斯、Hoeffding、Bernstein、覆盖数时，知道它们从哪来、怎么用、证明卡在哪一步。

你会得到：

1. 为什么「成功次数 / 总次数」当概率不够用，公理怎么补；
2. $\sigma$-代数、概率空间 $(S,\mathcal{F},\mathbb{P})$ 是什么（用武大课堂点名当例子）；
3. 条件概率、Bayes、独立（含两两独立但非相互独立的反例）；
4. 随机变量、分布函数、密度、PMF、定律（pushforward）；
5. 期望、方差、MGF、$L^p$、条件期望的塔性质；
6. 高斯尾与次高斯 $\Leftrightarrow$ 指数尾（两边都证）；
7. Hoeffding 引理 / 不等式、次指数、Bernstein、McDiarmid（p.190 写全）；
8. 有限最大值、凸多面体顶点、覆盖数的体积证明；
9. 这些工具如何接到 Lec1 的并集界和 Lec2 的 Dudley。

讲义上所有 **Hint** 都写成完整证明。幻灯片后几页公式挤在一起，已对照 PDF 补全。

需要的预备：高中集合（并、交、补）、求和、一点定积分。不会 $\sigma$-代数也可以从第 0 节读。

---

## 0. 先用抛硬币把语言钉死

问：一枚公平硬币朝上是正面的概率是多少？直觉说 $\frac12$。要把这句话变成数学，需要几个词（讲义 p.170）。

| 词 | 意思 | 硬币例子 |
|----|------|----------|
| **试验 / 实验** experiment | 观察某个现象的过程 | 抛一次硬币 |
| **结果** outcome | 一次试验看到的东西 | 正面 $H$ 或反面 $T$ |
| **一次试验** trial | 实验的一次重复 | 你刚才那一抛 |
| **样本空间** $S$ 或 $\Omega$ | 所有可能结果的集合 | $S=\{H,T\}$ |
| **事件** event | 样本空间的一个子集 | $\{H\}$（「朝上是正面」） |
| **事件发生** | 实际结果落在这个子集里 | 抛出 $H$ 则 $\{H\}$ 发生 |

再看掷骰子（讲义红字：What is the outcome / sample space / event?）。一次试验 = 掷一枚公平六面骰。

| 问 | 答 |
|----|----|
| **outcome** | 朝上一面的点数，例如这次掷出了 $3$ |
| **sample space** | $S=\{1,2,3,4,5,6\}$ |
| **event** | $S$ 的任意子集，例如 $A=\{1,3,5\}$（奇数）、$B=\{6\}$、$C=\{3\}$ |

假设结果是 $3$。则：$A$ 发生，$C$ 发生，$A\cap C=\{3\}$ 发生，$B$ 没发生，$A\cup B=\{1,3,5,6\}$ 发生。朴素赋值 $\mathbb{P}(A)=3/6=1/2$，$\mathbb{P}(B)=\mathbb{P}(C)=1/6$。

**人话：** 事件就是「我们关心的那一类结果」。概率是给每个事件打一个 $0$ 到 $1$ 的分，表示它有多容易发生。

---

## 1. 朴素定义及其缺陷（p.170–171）

对硬币，自然的赋值是

$$
\mathbb{P}(\{H\})=\mathbb{P}(\{T\})=\frac12,\qquad
\mathbb{P}(\{H\}\cap\{T\})=\mathbb{P}(\emptyset)=0,\qquad
\mathbb{P}(\{H\}\cup\{T\})=1.
$$

对公平骰子，$\mathbb{P}(A)=\frac12$，$\mathbb{P}(B)=\mathbb{P}(C)=\frac16$。

这引出**朴素（频率 / 古典）定义**：设 $S$ 有限，$A\subseteq S$，

$$
\mathbb{P}(A)\;=\;\frac{|A|}{|S|}.
$$

它有两条硬伤（讲义 p.171 原话）：

1. **只适用于有限样本空间。** 往 $[0,1]$ 上随机扔一个点，「落在 $[0,1/2]$」的概率该是 $\frac12$，但 $|[0,1]|=\infty$，$|A|/|S|$ 没有意义。可列无限也麻烦：自然数上「每个点等可能」会迫使每个单点概率为 $0$，可列可加又迫使总概率为 $0$，矛盾。
2. **默认所有结果等可能。** 偏硬币 $\mathbb{P}(\{H\})=0.9$ 完全合理，但 $|\{H\}|/|S|=\frac12$，对不上。

还有第三件讲义在 p.172 说的事：就算你放弃「数个数」，想对 $S$ 的**每一个**子集都指定满足下面三条公理的 $\mathbb{P}$，当 $S$ 不可数时，这样的 $\mathbb{P}$ **一般不存在**（Vitali 不可测集）。所以必须先规定：哪些子集才允许被问「概率是多少」。这就是 $\sigma$-代数。

---

## 2. 公理、$\sigma$-代数、概率空间（p.172–174）

### 2.1 我们仍想保留的三条性质

朴素定义虽然窄，但它满足三条「概率该有的样子」（Kolmogorov 公理）：

- **(A1) 非负：** $\mathbb{P}(A)\ge 0$。
- **(A2) 全空间：** $\mathbb{P}(S)=1$。
- **(A3) 可列可加（$\sigma$-可加）：** 若 $A_1,A_2,\ldots$ 两两不交（$i\neq j\Rightarrow A_i\cap A_j=\emptyset$），则

$$
\mathbb{P}\Bigl(\bigcup_{j=1}^\infty A_j\Bigr)
\;=\;
\sum_{j=1}^\infty \mathbb{P}(A_j).
$$

### 2.2 哪些集合该有概率：$\sigma$-代数

我们希望：

- 不可能事件 $\emptyset$ 有概率（该是 $0$）；
- 若 $A$ 有概率，则「$A$ 没发生」$A^c=S\setminus A$ 也有概率；
- 若一列事件 $A_1,A_2,\ldots$ 都有概率，则「至少一个发生」$\bigcup_{j=1}^\infty A_j$ 也有概率。

于是定义：$\mathcal{F}$ 是 $S$ 上的一个 **$\sigma$-代数**，若它是 $S$ 的一些子集组成的家族，并且

1. $\emptyset\in\mathcal{F}$；
2. $A\in\mathcal{F}\Rightarrow A^c\in\mathcal{F}$；
3. $A_i\in\mathcal{F}\ (i=1,2,\ldots)\Rightarrow \bigcup_{j=1}^\infty A_j\in\mathcal{F}$。

由 De Morgan，$\mathcal{F}$ 对可列交也封闭：$\bigcap_j A_j=\bigl(\bigcup_j A_j^c\bigr)^c$。有限并、有限交当然也封闭。

**人话：** $\sigma$-代数 =「你被允许谈论的那些事件」。它在「补」和「可列并」下关上门，避免问出没有定义的概率。

### 2.3 武大课堂例子（讲义 p.174）

令 $S=\{\mathrm{St}1,\ldots,\mathrm{St}33\}$ 为本班 $33$ 名同学（带学号）。

- $\mathcal{F}_0:=\{\emptyset,S\}$：什么都不知道。只能说「没人」或「全班」。
- $\mathcal{F}_1:=\{\emptyset,\ \text{boys},\ \text{girls},\ S\}$：只知道性别。
- $\mathcal{F}_2:=2^S$（幂集，所有子集）：知道每个人是谁。

**补全：它们确实是 $\sigma$-代数。**

$\mathcal{F}_0$：$\emptyset^c=S$，$S^c=\emptyset$，并只有 $\emptyset$ 或 $S$。  
$\mathcal{F}_1$：boys 与 girls 互补（假设按性别二分、无第三类），它们的并是 $S$、交是 $\emptyset$。可列并重复取仍在这四个里。  
$\mathcal{F}_2$：任意子集的补、并还是子集。

信息量：$\mathcal{F}_0\subset\mathcal{F}_1\subset\mathcal{F}_2$。$\sigma$-代数越大，能分辨的事件越细。

### 2.4 概率与概率空间

$S$ 是样本空间，$\mathcal{F}$ 是其上 $\sigma$-代数。映射 $\mathbb{P}:\mathcal{F}\to\mathbb{R}$ 称为**概率**，若

- 非负：$\mathbb{P}(A)\ge 0$；
- $\mathbb{P}(S)=1$；
- 可列可加：$A_j$ 两两不交时 $\mathbb{P}(\bigcup_j A_j)=\sum_j\mathbb{P}(A_j)$。

三元组 $(S,\mathcal{F},\mathbb{P})$ 称为**概率空间**。讲义原话：这是我们谈论一切随机性的平台。

定义域必须是 $\sigma$-代数，否则 (A3) 左边的并可能根本不在定义域里。类比：函数 $1/x$ 不能在 $0$ 处取值（讲义红字 domain）。

更精确：若坚持 $\mathbb{P}$ 对 $S$ 的**任意子集**都有定义且满足 (A1)–(A3)，当 $S=[0,1]$（或任何不可数完备度量空间）时这样的 $\mathbb{P}$ **一般不存在**——Vitali 不可测集用选择公理造出，Lebesgue 测度无法在其上既平移不变又 $\sigma$-可加。所以必须先规定「哪些子集允许被问概率」，这就是 $\sigma$-代数。课堂三个例子 $\mathcal{F}_0\subset\mathcal{F}_1\subset\mathcal{F}_2$ 都是合法定义域；选哪个取决于你愿意分辨多细的事件。

---

## 3. 概率的八条性质（p.175，Hint 全部写成证明）

以下始终在一个概率空间 $(S,\mathcal{F},\mathbb{P})$ 上，$A,B,A_j\in\mathcal{F}$。

### (1) 不可能事件：$\mathbb{P}(\emptyset)=0$

**Hint：** 对 $\emptyset$ 用可列可加。

**证明。** $\emptyset=\emptyset\cup\emptyset\cup\emptyset\cup\cdots$，右边两两不交。可列可加给出

$$
\mathbb{P}(\emptyset)=\sum_{j=1}^\infty\mathbb{P}(\emptyset).
$$

若 $\mathbb{P}(\emptyset)=c>0$，右边是 $\infty$，左边有限，矛盾。故 $c=0$。  
（等价写法：$S=S\cup\emptyset\cup\emptyset\cup\cdots$，故 $1=1+\sum\mathbb{P}(\emptyset)$。）$\square$

### (2) 有限可加：$A\cap B=\emptyset\Rightarrow\mathbb{P}(A\cup B)=\mathbb{P}(A)+\mathbb{P}(B)$

**Hint：** 对 $A\cup B$ 用可列可加，再用 (1)。

**证明。** $A\cup B\cup\emptyset\cup\emptyset\cup\cdots$ 是两两不交的可列并，其并就是 $A\cup B$。于是

$$
\mathbb{P}(A\cup B)=\mathbb{P}(A)+\mathbb{P}(B)+\mathbb{P}(\emptyset)+\mathbb{P}(\emptyset)+\cdots=\mathbb{P}(A)+\mathbb{P}(B).
$$

对有限个两两不交事件同样：补无穷个空集。$\square$

### (3) 补集与分解：$\mathbb{P}(A)=1-\mathbb{P}(A^c)$；$\mathbb{P}(A)=\mathbb{P}(A\cap B)+\mathbb{P}(A\cap B^c)$

**Hint：** 用 (2)、$\mathbb{P}(S)=1$，以及 $A=(A\cap B)\cup(A\cap B^c)$。

**证明。** $S=A\cup A^c$ 不交，故 $1=\mathbb{P}(A)+\mathbb{P}(A^c)$。  
又 $A\cap B$ 与 $A\cap B^c$ 不交，并是 $A$，再用 (2)。$\square$

### (4) 单调：$A\subseteq B\Rightarrow\mathbb{P}(A)\le\mathbb{P}(B)$

**Hint：** $B=A\cup(B\cap A^c)$，再用 (2) 与非负。

**证明。** $A\cap(B\cap A^c)=\emptyset$，且 $A\subseteq B$ 时 $B=A\cup(B\cap A^c)$。故

$$
\mathbb{P}(B)=\mathbb{P}(A)+\mathbb{P}(B\cap A^c)\ge\mathbb{P}(A).
$$

$\square$

### (5) 值域：$\mathbb{P}(A)\in[0,1]$

**Hint：** 用 (1)、(4) 与 $\mathbb{P}(S)=1$。

**证明。** $\emptyset\subseteq A\subseteq S$，故 $0=\mathbb{P}(\emptyset)\le\mathbb{P}(A)\le\mathbb{P}(S)=1$。$\square$

### (6) 容斥：$\mathbb{P}(A\cup B)=\mathbb{P}(A)+\mathbb{P}(B)-\mathbb{P}(A\cap B)$

**Hint：** $A\cup B=B\cup(A\cap B^c)$，$A=(A\cap B)\cup(A\cap B^c)$，(2) 用两次。

**证明。** $B$ 与 $A\cap B^c$ 不交，并是 $A\cup B$，故 $\mathbb{P}(A\cup B)=\mathbb{P}(B)+\mathbb{P}(A\cap B^c)$。  
又 $\mathbb{P}(A)=\mathbb{P}(A\cap B)+\mathbb{P}(A\cap B^c)$，所以 $\mathbb{P}(A\cap B^c)=\mathbb{P}(A)-\mathbb{P}(A\cap B)$。代入即得。$\square$

### (7) 次可加（并集界的源头）

对任意（不必不交）$A_1,A_2,\ldots\in\mathcal{F}$，

$$
\mathbb{P}\Bigl(\bigcup_{j=1}^\infty A_j\Bigr)
\;\le\;
\sum_{j=1}^\infty\mathbb{P}(A_j).
$$

**证明（讲义没写 Hint，这里补全）。** 不交化：令 $B_1=A_1$，

$$
B_n\;=\;A_n\setminus\bigcup_{i=1}^{n-1}A_i
\;=\;A_n\cap A_1^c\cap\cdots\cap A_{n-1}^c,\qquad n\ge 2.
$$

则 $B_n\subseteq A_n$，$B_n$ 两两不交，且 $\bigcup_n B_n=\bigcup_n A_n$。可列可加与单调给出

$$
\mathbb{P}\Bigl(\bigcup_n A_n\Bigr)
=\sum_n\mathbb{P}(B_n)
\le\sum_n\mathbb{P}(A_n).
$$

有限个同样（后面补空集）。这就是 Lec1 里「并集界」$\mathbb{P}(\bigcup E_i)\le\sum\mathbb{P}(E_i)$。$\square$

### (8) 连续性

若 $A_1\subset A_2\subset A_3\subset\cdots$，则 $\lim_n A_n:=\bigcup_{i=1}^\infty A_i$ 满足

$$
\mathbb{P}\Bigl(\lim_{n\to\infty}A_n\Bigr)=\lim_{n\to\infty}\mathbb{P}(A_n).
$$

若 $A_1\supset A_2\supset A_3\supset\cdots$，则 $\lim_n A_n:=\bigcap_{i=1}^\infty A_i$，同样 $\mathbb{P}(\lim A_n)=\lim\mathbb{P}(A_n)$。

**证明。** 先看递增。令 $B_1=A_1$，$B_n=A_n\setminus A_{n-1}$（$n\ge 2$）。则 $B_n$ 两两不交，$\bigcup_{i=1}^n B_i=A_n$，$\bigcup_{i=1}^\infty B_i=\bigcup_{i=1}^\infty A_i$。故

$$
\mathbb{P}(A_n)=\sum_{i=1}^n\mathbb{P}(B_i),\qquad
\mathbb{P}\Bigl(\bigcup_{i=1}^\infty A_i\Bigr)=\sum_{i=1}^\infty\mathbb{P}(B_i)=\lim_{n\to\infty}\mathbb{P}(A_n).
$$

再看递减：$A_1\setminus A_n$ 递增，并集为 $A_1\setminus\bigcap_i A_i$。于是

$$
\mathbb{P}(A_1)-\mathbb{P}\Bigl(\bigcap_i A_i\Bigr)
=\lim_n\mathbb{P}(A_1\setminus A_n)
=\mathbb{P}(A_1)-\lim_n\mathbb{P}(A_n).
$$

（$\mathbb{P}(A_1)<\infty$ 自动成立。）$\square$

---

## 4. 条件概率、乘法、全概率、Bayes（p.176–177）

### 4.1 吸烟与肺癌，以及课堂点名

无条件的「得肺癌」和「在吸烟者里得肺癌」可以差很远：

$$
\mathbb{P}(\text{lung cancer})\;\neq\;\mathbb{P}(\text{lung cancer}\mid\text{smoker}).
$$

课堂例子（讲义 p.176）。$S=\{\mathrm{St}1,\ldots,33\}$，$\mathcal{F}=2^S$，均匀 $\mathbb{P}(A)=|A|/33$。有 $M$ 个男生、$33-M$ 个女生。老师说：「我要请一个男生自我介绍。」你被点到的概率是多少？

令 $B=\{\text{boys}\}$，$A=\{\text{you}\}$，$\mathbb{P}(B)=M/33$。

- 若你是男生：$\mathbb{P}(A)=\mathbb{P}(A\cap B)=1/33$，条件概率

$$
\mathbb{P}(A\mid B)
=\frac{1}{M}
=\frac{1/33}{M/33}
=\frac{\mathbb{P}(A\cap B)}{\mathbb{P}(B)}.
$$

- 若你是女生：$A\cap B=\emptyset$，$\mathbb{P}(A\cap B)/\mathbb{P}(B)=0$，你不可能被点到。

**人话：** 已知 $B$ 发生，等于把样本空间缩到 $B$，再重新归一化。

### 4.2 定义

设 $A,B\in\mathcal{F}$，$\mathbb{P}(B)>0$。定义**条件概率**

$$
\mathbb{P}(A\mid B)\;:=\;\frac{\mathbb{P}(A\cap B)}{\mathbb{P}(B)}.
$$

### 4.3 $\mathbb{P}(\,\cdot\mid B)$ 仍是 $\mathcal{F}$ 上的概率（定义域还是 $\mathcal{F}$）

讲义红字强调 $\mathbb{P}(B)>0$，并且 $\mathbb{P}(\,\cdot\mid B)$ 是**同一个** $\sigma$-代数 $\mathcal{F}$ 上的概率（不是改到 $B$ 的子集上去）。分母 $\mathbb{P}(B)>0$ 保证除法合法；分子 $\mathbb{P}(A\cap B)$ 有定义是因为 $\mathcal{F}$ 对交封闭。

非负显然。$\mathbb{P}(S\mid B)=\mathbb{P}(B)/\mathbb{P}(B)=1$。若 $A_j$ 两两不交，则 $A_j\cap B$ 两两不交，

$$
\mathbb{P}\Bigl(\bigcup_j A_j\Bigm| B\Bigr)
=\frac{\mathbb{P}\bigl((\bigcup_j A_j)\cap B\bigr)}{\mathbb{P}(B)}
=\frac{\sum_j\mathbb{P}(A_j\cap B)}{\mathbb{P}(B)}
=\sum_j\mathbb{P}(A_j\mid B).
$$

所以 $(S,\mathcal{F},\mathbb{P}(\,\cdot\mid B))$ 仍是概率空间：在 $B$ 上把概率重新归一化。

### 4.4 乘法公式

对任意 $A,B\in\mathcal{F}$（若 $\mathbb{P}(B)=0$，约定两边都为 $0$）：

$$
\mathbb{P}(A\cap B)=\mathbb{P}(A\mid B)\,\mathbb{P}(B).
$$

多个事件：$\mathbb{P}(A_1\cap\cdots\cap A_n)=\mathbb{P}(A_1)\mathbb{P}(A_2\mid A_1)\cdots\mathbb{P}(A_n\mid A_1\cap\cdots\cap A_{n-1})$（分母不为 $0$ 时）。

### 4.5 全概率公式

称 $\{B_i\}_{i=1}^\infty$ 是 $S$ 的一个**划分**，若它们两两不交、并集为 $S$，且每个 $B_i\in\mathcal{F}$。则对任意 $A\in\mathcal{F}$，

$$
\mathbb{P}(A)
=\sum_{i=1}^\infty\mathbb{P}(A\mid B_i)\mathbb{P}(B_i),
$$

其中 $\mathbb{P}(B_i)=0$ 的项视为 $0$。

**证明。** $A=\bigcup_i(A\cap B_i)$ 是不交并，可列可加再代入乘法公式。$\square$

有限划分同样。

### 4.6 Bayes 公式

若 $\mathbb{P}(A)>0$，则「反转条件」：

$$
\mathbb{P}(B\mid A)=\frac{\mathbb{P}(A\mid B)\mathbb{P}(B)}{\mathbb{P}(A)}.
$$

若 $\{B_i\}$ 是划分，则「由结果找原因」：

$$
\mathbb{P}(B_i\mid A)
=\frac{\mathbb{P}(A\mid B_i)\mathbb{P}(B_i)}{\sum_{j=1}^\infty\mathbb{P}(A\mid B_j)\mathbb{P}(B_j)}.
$$

**证明。** 分子是 $\mathbb{P}(A\cap B_i)$，分母是全概率给出的 $\mathbb{P}(A)$。$\square$

---

## 5. 独立（p.178）

### 5.1 两个事件

$A,B\in\mathcal{F}$ **独立**（常记 $A\perp B$）若

$$
\mathbb{P}(A\cap B)=\mathbb{P}(A)\mathbb{P}(B).
$$

否则称**相依**。若 $\mathbb{P}(B)>0$，独立 $\Leftrightarrow$ $\mathbb{P}(A\mid B)=\mathbb{P}(A)$：知道 $B$ 不改变 $A$ 的机会。

**几个立刻能证的事实。**

- $\emptyset$ 与任意 $A$ 独立：$\mathbb{P}(\emptyset\cap A)=0=0\cdot\mathbb{P}(A)$。
- 互斥（不交）且 $\mathbb{P}(A)>0,\mathbb{P}(B)>0$ 则**必相依**：左边 $0$，右边为正。硬币：$A=\{H\}$，$B=\{T\}$。
- $A\perp B\Rightarrow A\perp B^c$：

$$
\mathbb{P}(A\cap B^c)=\mathbb{P}(A)-\mathbb{P}(A\cap B)=\mathbb{P}(A)-\mathbb{P}(A)\mathbb{P}(B)=\mathbb{P}(A)\mathbb{P}(B^c).
$$

### 5.2 相互独立 vs 两两独立

称 $\{A_i\}_{i\ge 1}$ **相互独立**，若对任意有限指标集 $I$，$|I|\ge 2$，

$$
\mathbb{P}\Bigl(\bigcap_{i\in I}A_i\Bigr)=\prod_{i\in I}\mathbb{P}(A_i).
$$

只要求 $|I|=2$ 时，称为**两两独立**。相互独立 $\Rightarrow$ 两两独立；反过来不对。

**反例（讲义 p.178，补全计算）。** 独立抛两次公平硬币。样本空间 $\{HH,HT,TH,TT\}$，各概率 $\frac14$。令

$$
\begin{aligned}
A&=\{\text{两次相同}\}=\{HH,TT\},\\
B&=\{\text{第一次是 }H\}=\{HH,HT\},\\
C&=\{\text{第二次是 }H\}=\{HH,TH\}.
\end{aligned}
$$

则 $\mathbb{P}(A)=\mathbb{P}(B)=\mathbb{P}(C)=\frac12$，

$$
A\cap B=A\cap C=B\cap C=\{HH\},\qquad \mathbb{P}=\frac14=\frac12\cdot\frac12,
$$

所以两两独立。但 $A\cap B\cap C=\{HH\}$，

$$
\mathbb{P}(A\cap B\cap C)=\frac14\;\neq\;\frac18=\mathbb{P}(A)\mathbb{P}(B)\mathbb{P}(C).
$$

故非相互独立。

### 5.3 条件独立

掷两枚公平骰子，$D_1,D_2$。令 $A=\{D_1=1\}$，$B=\{D_2=1\}$，$C=\{D_1+D_2=5\}$。

**补全：$A\perp B$，但 $A$ 与 $C$ 相依；给定 $C$ 后 $A,B$ 不独立。**

$\mathbb{P}(A)=\mathbb{P}(B)=\frac16$，$\mathbb{P}(A\cap B)=\frac1{36}=\mathbb{P}(A)\mathbb{P}(B)$，故 $A\perp B$。  
$C=\{(1,4),(2,3),(3,2),(4,1)\}$，$\mathbb{P}(C)=\frac4{36}=\frac19$。  
$A\cap C=\{(1,4)\}$，$\mathbb{P}(A\cap C)=\frac1{36}\neq\frac1{54}=\mathbb{P}(A)\mathbb{P}(C)$，故 $A\not\perp C$。

$$
\mathbb{P}(A\mid C)=\frac{1/36}{4/36}=\frac14,\qquad
\mathbb{P}(B\mid C)=\frac14,\qquad
\mathbb{P}(A\cap B\mid C)=0,
$$

因为 $D_1=D_2=1$ 时和为 $2\neq 5$。于是 $\mathbb{P}(A\cap B\mid C)\neq\mathbb{P}(A\mid C)\mathbb{P}(B\mid C)$。

一般定义：$\mathbb{P}(C)>0$ 时，称 $A,B$ **在给定 $C$ 下独立**（$A\perp B\mid C$），若

$$
\mathbb{P}(A\cap B\mid C)=\mathbb{P}(A\mid C)\mathbb{P}(B\mid C).
$$

### 5.4 Hint：$A\perp B\mid C\ \Leftrightarrow\ \mathbb{P}(A\mid C\cap B)=\mathbb{P}(A\mid C)$

（默认 $\mathbb{P}(C\cap B)>0$，从而 $\mathbb{P}(C)>0$。）

**证明。** 左边 $\mathbb{P}(A\mid C\cap B)=\mathbb{P}(A\cap B\cap C)/\mathbb{P}(B\cap C)$。  
若 $A\perp B\mid C$，则 $\mathbb{P}(A\cap B\cap C)=\mathbb{P}(A\cap C)\mathbb{P}(B\cap C)/\mathbb{P}(C)$，代入得

$$
\mathbb{P}(A\mid C\cap B)=\frac{\mathbb{P}(A\cap C)}{\mathbb{P}(C)}=\mathbb{P}(A\mid C).
$$

反之，由 $\mathbb{P}(A\cap B\cap C)=\mathbb{P}(A\mid C\cap B)\mathbb{P}(B\cap C)=\mathbb{P}(A\mid C)\mathbb{P}(B\cap C)$，两边除以 $\mathbb{P}(C)$ 即得条件独立。$\square$

**人话：** 条件独立是因果/图模型的基本语言。无条件独立可以变成条件相依（两骰子之和），无条件相依也可以变成条件独立。后一个讲义的例子：随机选一周中的一天，

$$
A=\{\text{不是周一}\},\quad
B=\{\text{周六}\},\quad
C=\{\text{周末}\}.
$$

$\mathbb{P}(A\cap B)=\frac17\neq\frac6{49}=\mathbb{P}(A)\mathbb{P}(B)$，故相依。但周末里「不是周一」必然成立，$\mathbb{P}(A\mid C)=1$，$\mathbb{P}(B\mid C)=\frac12$，$\mathbb{P}(A\cap B\mid C)=\frac12$，所以 $A\perp B\mid C$。

---

## 6. 随机变量、分布函数、密度、PMF、定律（p.179–181）

### 6.1 从事件到数字

还是公平硬币，$(S,\mathcal{F},\mathbb{P})$ 中 $S=\{H,T\}$，$\mathcal{F}=\{\emptyset,\{T\},\{H\},S\}$，$\mathbb{P}(\{H\})=\mathbb{P}(\{T\})=\frac12$。约定：正面赢 $1$ 元，反面输 $1$ 元。定义映射

$$
X(H)=1,\qquad X(T)=-1.
$$

则 $\mathbb{P}(X=1)=\mathbb{P}(X=-1)=\frac12$，对其余 $x$ 有 $\mathbb{P}(X=x)=0$。

**朴素说法：** 随机变量（RV）是 $X:S\to\mathbb{R}$，给每个结果一个数。$\mathbb{P}(X=x)=\mathbb{P}(\{s:X(s)=x\})$——这要求 $\{s:X(s)=x\}\in\mathcal{F}$。

两枚硬币：$S=\{HH,HT,TH,TT\}$，赢利 $Y(HH)=2$，$Y(HT)=Y(TH)=0$，$Y(TT)=-2$。则 $\mathbb{P}(Y=\pm 2)=\frac14$，$\mathbb{P}(Y=0)=\frac12$。若 $X_i$ 是第 $i$ 枚的赢利，则 $Y=X_1+X_2$。$n$ 枚时 $Y=\sum_{i=1}^n X_i$。**人话：** 事件不好加减，数字可以；这就是为什么要随机变量。

### 6.2 正式定义：可测

$X:S\to\mathbb{R}$ 是随机变量，当且仅当对每个 $t\in\mathbb{R}$，

$$
X^{-1}\bigl((-\infty,t]\bigr)\;:=\;\{s\in S:X(s)\le t\}\;\in\;\mathcal{F}.
$$

只要求「$X\le t$」这类事件可测，则所有 Borel 集合（开集生成的 $\sigma$-代数 $\mathcal{B}(\mathbb{R})$）的原像都可测。这保证 $\mathbb{P}(X\le t)$、$\mathbb{P}(a<X\le b)$ 都有定义。

**补全：硬币上的 $X$ 是 RV。**

$$
X^{-1}((-\infty,t])
=
\begin{cases}
\emptyset, & t<-1,\\
\{T\}, & -1\le t<1,\\
S, & t\ge 1.
\end{cases}
$$

三者都在 $\mathcal{F}$ 里。

**示性函数。** $A\in\mathcal{F}$ 时，$\mathbf{1}_A(s)=1$ 若 $s\in A$，否则 $0$。则

$$
\mathbf{1}_A^{-1}((-\infty,t])
=
\begin{cases}
\emptyset, & t<0,\\
A^c, & 0\le t<1,\\
S, & t\ge 1,
\end{cases}
$$

全在 $\mathcal{F}$ 中，故 $\mathbf{1}_A$ 是 RV。后面 $\mathbb{E}[\mathbf{1}_A]=\mathbb{P}(A)$。

### 6.3 定律（law）= pushforward

对 Borel 集 $A\in\mathcal{B}(\mathbb{R})$（讲义说「先把 $\mathcal{B}$ 理解成开集生成的那些集合」），定义

$$
\mathbb{P}_X(A)\;:=\;\mathbb{P}\bigl(X^{-1}(A)\bigr)\;=\;\mathbb{P}(X\in A).
$$

则 $\mathbb{P}_X$ 是 $(\mathbb{R},\mathcal{B}(\mathbb{R}))$ 上的概率。称 $\mathbb{P}_X$ 为 $X$ 的**定律 / 分布**，记 $X\sim\mathbb{P}_X$。

讲义 p.181 的交换图：

$$
\begin{array}{ccc}
\Omega & \xrightarrow{\ X\ } & \mathbb{R}\\
\in\downarrow & & \downarrow\in\\
\mathcal{F} & \xleftarrow{\ X^{-1}\ } & \mathcal{B}(\mathbb{R})\\
\mathbb{P}\downarrow & & \downarrow\mathbb{P}_X\\
[0,1] & = & [0,1]
\end{array}
\qquad
\mathbb{P}_X(A)=\mathbb{P}\bigl(X^{-1}(A)\bigr).
$$

**人话：** 引入 RV 之后，原来在抽象 $(S,\mathcal{F},\mathbb{P})$ 上的问题，变成实线上 $(\mathbb{R},\mathcal{B},\mathbb{P}_X)$ 的问题。这就是 pushforward（前推测度）。Lec4 里 $f_{\sharp}\mu$ 是同一件事。

### 6.4 分布函数、PMF、密度

**CDF（累积分布函数）：**

$$
F_X(x)\;:=\;\mathbb{P}_X\bigl((-\infty,x]\bigr)\;=\;\mathbb{P}(X\le x),\qquad x\in\mathbb{R}.
$$

记 $X\sim F_X$。它满足：

- (i) $F_X(-\infty):=\lim_{x\to-\infty}F_X(x)=0$，$F_X(+\infty)=1$；$x\le y\Rightarrow F_X(x)\le F_X(y)$；右连续：$\lim_{y\downarrow x}F_X(y)=F_X(x)$。
- (ii) 反之，任何满足 (i) 的函数都是某个 RV 的 CDF（Skorokhod / 分位数构造：在 $([0,1],\mathcal{B},\mathrm{Leb})$ 上令 $X(\omega)=\inf\{x:F(x)\ge\omega\}$）。

**PMF（离散）。** 若 $X$ 只取有限或可列个值 $\{x_i\}$，定义 $p_X(x_i)=\mathbb{P}(X=x_i)$。则 $p_X\ge 0$，$\sum_i p_X(x_i)=1$，且

$$
F_X(t)=\sum_{x_i\le t}p_X(x_i),\qquad
\mathbb{P}(X\in A)=\sum_{x_i\in A}p_X(x_i).
$$

硬币赢利：$p_X(1)=p_X(-1)=\frac12$。

**密度（连续）。** 若存在非负可积 $f_X$ 使 $F_X(t)=\int_{-\infty}^t f_X(u)\,du$，称 $f_X$ 为**概率密度**。此时 $\mathbb{P}(X=x)=0$ 对每个单点成立，

$$
\mathbb{P}(X\in A)=\int_A f_X,\qquad
\mathbb{P}(a<X\le b)=\int_a^b f_X.
$$

在 $F_X$ 可导处 $f_X=F_X'$。高斯密度见第 10 节。

尾概率：$\mathbb{P}(X>t)=1-F_X(t)$（连续时也等于 $\mathbb{P}(X\ge t)$）。

---

## 7. Borel–Cantelli（p.181）

记 $\limsup_n A_n:=\bigcap_{N\ge 1}\bigcup_{n\ge N}A_n=\{\text{无穷多个 }A_n\text{ 发生}\}$。

**第一 BC 引理。** 不需要独立。若 $\sum_n\mathbb{P}(A_n)<\infty$，则 $\mathbb{P}(\limsup A_n)=0$。

**证明。** 令 $B_N=\bigcup_{n\ge N}A_n$。次可加：$\mathbb{P}(B_N)\le\sum_{n\ge N}\mathbb{P}(A_n)\to 0$（残项）。$B_N\downarrow\limsup A_n$，连续性给出 $\mathbb{P}(\limsup A_n)=\lim\mathbb{P}(B_N)=0$。$\square$

**第二 BC 引理。** 若 $\{A_n\}$ **相互独立**且 $\sum_n\mathbb{P}(A_n)=\infty$，则 $\mathbb{P}(\limsup A_n)=1$。

**证明。** $\mathbb{P}(B_N^c)=\mathbb{P}\bigl(\bigcap_{n\ge N}A_n^c\bigr)$。有限个独立推出

$$
\mathbb{P}\Bigl(\bigcap_{n=N}^{N+M}A_n^c\Bigr)
=\prod_{n=N}^{N+M}\bigl(1-\mathbb{P}(A_n)\bigr)
\le\exp\Bigl(-\sum_{n=N}^{N+M}\mathbb{P}(A_n)\Bigr),
$$

用了 $1-x\le e^{-x}$。令 $M\to\infty$，指数 $\to e^{-\infty}=0$，故 $\mathbb{P}(B_N^c)=0$，$\mathbb{P}(B_N)=1$。再令 $N\to\infty$。$\square$

第一引理在 Lec2 里保证「坏事件只发生有限次」；第二引理说明独立时发散就几乎必然发生无穷次。

---

## 8. 期望、方差、MGF、$L^p$（p.182）

### 8.1 期望怎么定义（小白版）

离散（绝对收敛时）：$\mathbb{E}[X]=\sum_i x_i\,p_X(x_i)$。  
有密度：$\mathbb{E}[X]=\int_{-\infty}^\infty x f_X(x)\,dx$。  
一般：非负 RV 先用简单函数（有限值可测函数）从下面逼近，再对 $X=X^+-X^-$ 分开；$\mathbb{E}|X|<\infty$ 时称 $X$ 可积。示性函数：$\mathbb{E}[\mathbf{1}_A]=\mathbb{P}(A)$。线性对几乎处处成立的等式自动成立。

**方差：** $\mathrm{Var}(X)=\mathbb{E}[(X-\mathbb{E}X)^2]$（需 $\mathbb{E}X^2<\infty$）。  
**MGF：** $M_X(t)=\mathbb{E}[e^{tX}]$（在使期望存在的 $t$ 上）。  
**$L^p$ 范数：** 对 $p\in(0,\infty)$，

$$
\|X\|_{L^p}\;:=\;\bigl(\mathbb{E}[|X|^p]\bigr)^{1/p}.
$$

**$L^\infty$：**

$$
\|X\|_{L^\infty}\;:=\;\mathrm{ess\,sup}|X|
\;:=\;\inf\bigl\{a\in\mathbb{R}:\mathbb{P}(|X|>a)=0\bigr\}.
$$

即「几乎必然的最小上界」。$L^p=L^p(\Omega,\mathcal{F},\mathbb{P}):=\{X:\|X\|_{L^p}<\infty\}$。

Minkowski 不等式：$p\in[1,\infty]$ 时 $\|X+Y\|_{L^p}\le\|X\|_{L^p}+\|Y\|_{L^p}$，故 $L^p$ 是赋范空间，且完备（Banach）。$p<1$ 时三角不等式失败，不是范数。

特别地 $L^2$ 是 Hilbert 空间，内积 $\langle X,Y\rangle_{L^2}=\mathbb{E}[XY]$。于是

$$
\|X-\mathbb{E}X\|_{L^2}=\sqrt{\mathrm{Var}(X)}=\sigma(X),
$$

$$
\mathrm{cov}(X,Y)=\mathbb{E}[(X-\mathbb{E}X)(Y-\mathbb{E}Y)]=\langle X-\mathbb{E}X,\ Y-\mathbb{E}Y\rangle_{L^2}.
$$

### 8.2 Jensen、Hölder、Minkowski、$L^p$ 嵌套

**Jensen。** $\varphi:\mathbb{R}\to\mathbb{R}$ 凸，则 $\varphi(\mathbb{E}X)\le\mathbb{E}[\varphi(X)]$（$X$ 与 $\varphi(X)$ 可积）。

**证明。** 凸 $\Rightarrow$ 存在 $a$ 使 $\varphi(x)\ge\varphi(\mathbb{E}X)+a(x-\mathbb{E}X)$（支撑直线；不可导时用单侧导数）。取期望，线性项消失。$\square$

因此 $t\mapsto t^{q/p}$ 在 $[0,\infty)$ 上当 $q/p\ge 1$ 时凸，令 $Y=|X|^p$，得 $\|X\|_{L^p}\le\|X\|_{L^q}$ 对 $0<p\le q\le\infty$（概率空间总质量为 $1$ 才有这个嵌套；无限测度空间没有）。

**Hölder。** $1/p+1/q=1$，$p,q\in(1,\infty)$，则 $\mathbb{E}|XY|\le\|X\|_{L^p}\|Y\|_{L^q}$。$p=1,q=\infty$ 也成立。$p=q=2$ 就是 Cauchy–Schwarz。

**证明（Young）。** 若 $\|X\|_p\|Y\|_q=0$ 显然。否则令 $u=|X|/\|X\|_p$，$v=|Y|/\|Y\|_q$。Young：$uv\le u^p/p+v^q/q$。取期望得 $\mathbb{E}|XY|\le\|X\|_p\|Y\|_q$。$p=1$：$|XY|\le\|Y\|_\infty|X|$ a.s.。$\square$

**Minkowski。** $p\in[1,\infty]$，$\|X+Y\|_p\le\|X\|_p+\|Y\|_p$。

**证明。** $p=\infty$ 用 ess sup 三角。$p=1$ 用 $|X+Y|\le|X|+|Y|$。$1<p<\infty$：$\|X+Y\|_p^p=\mathbb{E}[|X+Y|^{p-1}|X+Y|]\le\mathbb{E}[|X+Y|^{p-1}|X|]+\mathbb{E}[|X+Y|^{p-1}|Y|]$，再 Hölder（共轭指数 $p/(p-1)$）。$\square$

---

## 9. 期望与条件期望的性质（p.183）

以下期望均假设存在（绝对值可积，或非负）。

### 9.1 三条基本性质

**(a) $\mathbb{E}|X|=0\ \Leftrightarrow\ X=0$ a.s.**  
「$\Rightarrow$」：Markov 型估计 $\mathbb{P}(|X|\ge 1/n)\le n\mathbb{E}|X|=0$，故对每个 $n$，$\mathbb{P}(|X|\ge 1/n)=0$。于是 $\mathbb{P}(|X|>0)=\mathbb{P}(\bigcup_n\{|X|\ge 1/n\})=0$。  
「$\Leftarrow$」：$X=0$ a.s. 则 $|X|=0$ a.s.，期望为 $0$。

**(b) 单调：** $\mathbb{P}(X\ge Y)=1\Rightarrow\mathbb{E}X\ge\mathbb{E}Y$。因为 $X-Y\ge 0$ a.s.，非负 RV 的期望 $\ge 0$（从简单函数逼近，或从 $\mathbb{E}Z=\int_0^\infty\mathbb{P}(Z>t)\,dt$）。

**(c) 平方损失的最佳常数是均值。** 令 $\mu=\mathbb{E}X$，则

$$
\mathbb{E}[(X-\mu)^2]=\min_{c\in\mathbb{R}}\mathbb{E}[(X-c)^2].
$$

**证明。** $\mathbb{E}[(X-c)^2]=\mathbb{E}[(X-\mu+\mu-c)^2]=\mathrm{Var}(X)+(\mu-c)^2\ge\mathrm{Var}(X)$。$\square$

### 9.2 用尾积分写期望

**非负 RV：** $\mathbb{E}[X]=\int_0^\infty\mathbb{P}(X>x)\,dx$。（连续时 $>$ 与 $\ge$ 无别；一般用 $\int_0^\infty\mathbb{P}(X\ge x)\,dx$ 也对。）

**证明（Fubini）。** $\int_0^\infty\mathbb{P}(X>x)\,dx=\int_0^\infty\mathbb{E}[\mathbf{1}_{X>x}]\,dx=\mathbb{E}\int_0^\infty\mathbf{1}_{X>x}\,dx=\mathbb{E}\int_0^X dt=\mathbb{E}X$。$\square$

讲义对有密度的情形用换序：$\int_0^\infty(1-F(x))\,dx=\int_0^\infty\int_x^\infty f(t)\,dt\,dx=\int_0^\infty f(t)\bigl(\int_0^t dx\bigr)dt=\int_0^\infty t f(t)\,dt$。

**一般（可正可负）：**

$$
\mathbb{E}|X|=\int_0^\infty\bigl(1-F(x)\bigr)\,dx+\int_{-\infty}^0 F(x)\,dx,
$$

$\mathbb{E}|X|<\infty$ 当且仅当两个积分都有限。此时

$$
\mathbb{E}[X]=\int_0^\infty\bigl(1-F(x)\bigr)\,dx-\int_{-\infty}^0 F(x)\,dx.
$$

（把 $X^+$ 与 $X^-$ 分别用非负公式。）

### 9.3 条件期望（先可操作，再塔性质）

$Y$ 离散、$\mathbb{P}(Y=y)>0$ 时，

$$
\mathbb{E}[X\mid Y=y]\;:=\;\frac{\mathbb{E}[X\mathbf{1}_{\{Y=y\}}]}{\mathbb{P}(Y=y)}.
$$

$\mathbb{E}[X\mid Y]$ 是把 $y\mapsto\mathbb{E}[X\mid Y=y]$ 再套回 $Y$ 上得到的**随机变量**（是 $Y$ 的函数）。

一般：$\mathbb{E}[X\mid Y]$ 是（a.s. 唯一的）$\sigma(Y)$-可测可积 RV，使得对任意 Borel $B$，

$$
\mathbb{E}\bigl[\mathbf{1}_{\{Y\in B\}}\mathbb{E}[X\mid Y]\bigr]=\mathbb{E}\bigl[\mathbf{1}_{\{Y\in B\}}X\bigr].
$$

$g$ 可测时 $\mathbb{E}[X\mid g(Y)]$ 理解为对 $\sigma(g(Y))$ 条件。讲义列出的性质（存在时）：

| 性质 | 式子 | 人话 |
|------|------|------|
| 常数 | $\mathbb{E}[a\mid Y]=a$ | 非随机的东西不用估 |
| 线性 | $\mathbb{E}[aX+bZ\mid Y]=a\mathbb{E}[X\mid Y]+b\mathbb{E}[Z\mid Y]$ | 条件期望是线性投影 |
| 正性 | $X\ge 0\Rightarrow\mathbb{E}[X\mid Y]\ge 0$ | |
| 独立 | $X\perp Y\Rightarrow\mathbb{E}[X\mid Y]=\mathbb{E}X$ | 没有信息 |
| **塔性质** | $\mathbb{E}_Y\bigl[\mathbb{E}_X[X\mid Y]\bigr]=\mathbb{E}[X]$ | 先条件再平均 = 直接平均 |
| 代入 | $\mathbb{E}_Y\bigl[\mathbb{E}[g(X,Y)\mid Y]\bigr]=\mathbb{E}[g(X,Y)]$ | |
| 取出已知 | $\mathbb{E}[Xg(Y)\mid Y]=g(Y)\mathbb{E}[X\mid Y]$；特别 $\mathbb{E}[g(Y)\mid Y]=g(Y)$ | 已知的当常数 |
| 冗余 | $\mathbb{E}[X\mid Y,g(Y)]=\mathbb{E}[X\mid Y]$ | $g(Y)$ 不增加信息 |
| 塔（多变量） | $\mathbb{E}\bigl[\mathbb{E}[X\mid Y,Z]\mid Y\bigr]=\mathbb{E}[X\mid Y]$ | 细信息再粗化 |
| **$L^2$ 投影** | $\mathbb{E}\bigl[(X-\mathbb{E}[X\mid Y])^2\bigr]\le\mathbb{E}\bigl[(X-g(Y))^2\bigr]$，等号 $\Leftrightarrow g(Y)=\mathbb{E}[X\mid Y]$ | 条件期望是用 $Y$ 预测 $X$ 的最优平方估计 |

**塔性质的证明（定义版）。** 取 $B=\mathbb{R}$，定义给出 $\mathbb{E}[\mathbb{E}[X\mid Y]]=\mathbb{E}X$。多变量：$\mathbb{E}[X\mid Y]$ 已是 $\sigma(Y)$-可测，而对任意 $\sigma(Y)$ 事件 $A$，

$$
\mathbb{E}[\mathbf{1}_A\mathbb{E}[X\mid Y,Z]]=\mathbb{E}[\mathbf{1}_A X]=\mathbb{E}[\mathbf{1}_A\mathbb{E}[X\mid Y]],
$$

故 $\mathbb{E}[\mathbb{E}[X\mid Y,Z]\mid Y]=\mathbb{E}[X\mid Y]$。$\square$

**$L^2$ 投影的证明。** 令 $\mu(Y)=\mathbb{E}[X\mid Y]$，$g=g(Y)$。则

$$
\mathbb{E}[(X-g)^2]=\mathbb{E}[(X-\mu+\mu-g)^2]=\mathbb{E}[(X-\mu)^2]+\mathbb{E}[(\mu-g)^2]+2\mathbb{E}[(X-\mu)(\mu-g)].
$$

交叉项：$\mu-g$ 是 $Y$ 的函数，故 $\mathbb{E}[(X-\mu)(\mu-g)]=\mathbb{E}\bigl[\mathbb{E}[X-\mu\mid Y](\mu-g)\bigr]=0$。因此最小在 $g=\mu$。这推广了 (c)：不看任何信息时最佳预测是常数 $\mathbb{E}X$。$\square$

线性、单调对无条件期望也成立：$\mathbb{E}[aX+bZ]=a\mathbb{E}X+b\mathbb{E}Z$（由定义或条件期望再取外层期望）。

---

## 10. 高斯：密度、MGF、尾（p.184）

### 10.1 密度

称 $Z\sim N(\mu,\sigma^2)$，若它有密度

$$
f(z)
=\frac{1}{\sqrt{2\pi\sigma^2}}\exp\Bigl(-\frac{(z-\mu)^2}{2\sigma^2}\Bigr),\qquad z\in\mathbb{R}.
$$

$\mu=\mathbb{E}Z$，$\sigma^2=\mathrm{Var}(Z)$。标准正态：$\mu=0,\sigma^2=1$，密度 $(2\pi)^{-1/2}e^{-z^2/2}$。

标准化：若 $Z\sim N(\mu,\sigma^2)$，则 $(Z-\mu)/\sigma\sim N(0,1)$。

### 10.2 Mills 尾（讲义的 $\sqrt{2/\pi}$ 界）

讲义（对照 PDF p.184）：

$$
\mathbb{P}\bigl(|X-\mu|>t\bigr)
\;\le\;
\sqrt{\frac{2}{\pi}}\,\frac{\sigma}{t}\,\exp\Bigl(-\frac{t^2}{2\sigma^2}\Bigr),\qquad t>0.
$$

（幻灯片把 $\sigma/t$ 挤在分母上，对照 PDF 后的正确缩放就是这一式。）

**证明。** 先证 $Z\sim N(0,1)$。对 $x\ge t>0$ 有 $x/t\ge 1$，且 $\frac{d}{dx}e^{-x^2/2}=-x e^{-x^2/2}$，故

$$
\begin{aligned}
\mathbb{P}(Z>t)
&=\frac{1}{\sqrt{2\pi}}\int_t^\infty\exp\Bigl(-\frac{x^2}{2}\Bigr)\,dx
\le\frac{1}{\sqrt{2\pi}}\int_t^\infty\frac{x}{t}\exp\Bigl(-\frac{x^2}{2}\Bigr)\,dx\\
&=\frac{1}{t\sqrt{2\pi}}\int_t^\infty x\exp\Bigl(-\frac{x^2}{2}\Bigr)\,dx
=\frac{1}{t\sqrt{2\pi}}\exp\bigl(-t^2/2\bigr).
\end{aligned}
$$

对称性：$\mathbb{P}(|Z|>t)=\mathbb{P}(Z>t)+\mathbb{P}(Z<-t)=2\mathbb{P}(Z>t)$，故

$$
\mathbb{P}(|Z|>t)\le\sqrt{\frac{2}{\pi}}\,\frac{1}{t}\,e^{-t^2/2}.
$$

一般 $X\sim N(\mu,\sigma^2)$：$\mathbb{P}(|X-\mu|>t)=\mathbb{P}(|Z|>t/\sigma)$，代入即得 $\sqrt{2/\pi}\,(\sigma/t)\,e^{-t^2/(2\sigma^2)}$。$\square$

这个界在 $t\to 0$ 时炸掉（右边 $\to\infty$），所以小 $t$ 时用平凡界 $1$ 即可。讲义红字里的指数正是 $e^{-t^2/(2\sigma^2)}$（前面的 $\sqrt{2/\pi}\,\sigma/t$ 是 Mills 比）。后面 Chernoff 给出不带 $1/t$、处处有效的同指数界 $\mathbb{P}(|X-\mu|>t)\le 2e^{-t^2/(2\sigma^2)}$。

### 10.3 MGF

$Z\sim N(0,1)$：

$$
\begin{aligned}
M(s)=\mathbb{E}[e^{sZ}]
&=\frac{1}{\sqrt{2\pi}}\int_{-\infty}^\infty e^{sz}e^{-z^2/2}\,dz
=\frac{1}{\sqrt{2\pi}}\int_{-\infty}^\infty\exp\Bigl(-\frac{(z-s)^2}{2}+\frac{s^2}{2}\Bigr)\,dz\\
&=e^{s^2/2}.
\end{aligned}
$$

（配方：$sz-z^2/2=-(z-s)^2/2+s^2/2$，剩下的积分是标准正态密度的积分 $=1$。）

若 $X\sim N(\mu,\sigma^2)$，则 $X=\mu+\sigma Z$，

$$
\mathbb{E}[e^{sX}]=e^{s\mu}\mathbb{E}[e^{(s\sigma)Z}]=\exp\Bigl(s\mu+\frac{\sigma^2 s^2}{2}\Bigr).
$$

**Chernoff 界（高斯）。** $Z\sim N(0,1)$，$s>0$：

$$
\mathbb{P}(Z>t)\le e^{-st}\mathbb{E}[e^{sZ}]=\exp\bigl(-st+s^2/2\bigr).
$$

取 $s=t$ 得 $\mathbb{P}(Z>t)\le e^{-t^2/2}$，从而 $\mathbb{P}(|Z|>t)\le 2e^{-t^2/2}$。比 Mills 稍松（没有 $1/t$），但对一切 $t>0$ 干净，且正是次高斯尾的原型。

---

## 11. 次高斯（p.184）

### 11.1 一维

称中心化随机变量 $X$ 是**方差代理 $\sigma^2$ 的次高斯**，记 $X\sim\mathrm{subG}(\sigma^2)$，若 $\mathbb{E}[X]=0$ 且

$$
\mathbb{E}\bigl[e^{sX}\bigr]\;\le\;\exp\Bigl(\frac{\sigma^2 s^2}{2}\Bigr),\qquad\forall s\in\mathbb{R}.
$$

注意：$\mathrm{subG}(\sigma^2)$ 是**一类分布**，不是单个分布。写 $X\sim\mathrm{subG}(\sigma^2)$ 是滥用记号。$N(0,\sigma^2)$ 是特例（MGF 取等号）。有界中心化 RV 也是（Hoeffding 引理）。次高斯可以比高斯更「瘦」，但不能有更重的尾。

### 11.2 向量与矩阵

$X\in\mathbb{R}^d$ 称为 $X\sim\mathrm{subG}_d(\sigma^2)$，若 $\mathbb{E}[X]=0$ 且对一切单位向量 $u\in\mathbb{S}^{d-1}$，

$$
u^\top X\;\sim\;\mathrm{subG}(\sigma^2).
$$

即：**每个一维投影都是同样参数的次高斯。** Lec1 里 $\tilde\varepsilon=\Phi^\top\varepsilon$ 用的就是这个。

$X\in\mathbb{R}^{m\times n}$ 称为 $X\sim\mathrm{subG}_{m\times n}(\sigma^2)$，若 $\mathbb{E}[X]=0$ 且对一切 $u\in\mathbb{S}^{m-1}$、$v\in\mathbb{S}^{n-1}$，

$$
u^\top X v\;\sim\;\mathrm{subG}(\sigma^2).
$$

---

## 12. 次高斯 $\Leftrightarrow$ 指数尾（p.185，两边都证）

### 12.1 Markov 与 Chernoff

**Markov。** $X\ge 0$ a.s.，$\mathbb{E}X<\infty$，$t>0$：$\mathbb{P}(X\ge t)\le\mathbb{E}[X]/t$。

**证明。** $X\ge t\mathbf{1}_{\{X\ge t\}}$，取期望。$\square$

**Chernoff。** 对任意 $s>0$，$\mathbb{P}(X>t)=\mathbb{P}(e^{sX}>e^{st})\le e^{-st}\mathbb{E}[e^{sX}]$。再对 $s>0$ 取 inf。

### 12.2 次高斯 $\Rightarrow$ 指数尾

设 $X\sim\mathrm{subG}(\sigma^2)$。则对任意 $t>0$，

$$
\mathbb{P}(|X|>t)\;\le\;2\exp\Bigl(-\frac{t^2}{2\sigma^2}\Bigr).
$$

**证明。** 对 $s>0$，

$$
\mathbb{P}(X>t)
\le e^{-st}\mathbb{E}[e^{sX}]
\le\exp\Bigl(\frac{\sigma^2 s^2}{2}-st\Bigr).
$$

右边在 $s=t/\sigma^2$ 处最小，值为 $\exp(-t^2/(2\sigma^2))$。对 $-X$（同样次高斯）得 $\mathbb{P}(X<-t)\le\exp(-t^2/(2\sigma^2))$。相加。$\square$

### 12.3 指数尾 $\Rightarrow$ 矩

设 $\mathbb{P}(|X|>t)\le 2\exp(-t^2/(2\sigma^2))$ 对一切 $t>0$。则对任意整数 $k\ge 1$，

$$
\mathbb{E}[|X|^k]\;\le\;(2\sigma^2)^{k/2}\,k\,\Gamma(k/2).
$$

**证明（层饼 / 尾积分）。** 非负 RV $Z=|X|^k$ 满足 $\mathbb{E}Z=\int_0^\infty\mathbb{P}(Z>t)\,dt$，故

$$
\mathbb{E}[|X|^k]
=\int_0^\infty\mathbb{P}(|X|>t^{1/k})\,dt
\le 2\int_0^\infty\exp\Bigl(-\frac{t^{2/k}}{2\sigma^2}\Bigr)\,dt.
$$

换元 $u=t^{2/k}/(2\sigma^2)$，则 $t=(2\sigma^2 u)^{k/2}$，

$$
dt=(2\sigma^2)^{k/2}\cdot\frac{k}{2}\,u^{k/2-1}\,du.
$$

于是

$$
\int_0^\infty e^{-t^{2/k}/(2\sigma^2)}\,dt
=(2\sigma^2)^{k/2}\frac{k}{2}\int_0^\infty e^{-u}u^{k/2-1}\,du
=(2\sigma^2)^{k/2}\frac{k}{2}\Gamma(k/2).
$$

乘 $2$ 得 $\mathbb{E}[|X|^k]\le k(2\sigma^2)^{k/2}\Gamma(k/2)$。$\square$

**推论（$L^p$ 增长）。** 用 $\Gamma(k/2)\le(k/2)^{k/2}$（对 $k\ge 2$）与 $k^{1/k}\le e$，

$$
\bigl(\mathbb{E}[|X|^k]\bigr)^{1/k}
\le\sigma\sqrt{2}\cdot k^{1/k}\cdot(k/2)^{1/2}
\le\sigma e\sqrt{k},\qquad k\ge 2.
$$

$k=1$：$\Gamma(1/2)=\sqrt{\pi}$，故 $\mathbb{E}|X|\le\sqrt{2}\,\sigma\cdot\sqrt{\pi}=\sigma\sqrt{2\pi}$。

### 12.4 指数尾 $\Rightarrow$ 次高斯（积分尾推 MGF）

讲义结论：若 $\mathbb{P}(|X|>t)\le 2\exp(-t^2/(2\sigma^2))$，则 $X\sim\mathrm{subG}(8\sigma^2)$（定义里还要 $\mathbb{E}X=0$；若未中心化，对 $X-\mathbb{E}X$ 做同一件事，因为 $\mathbb{E}|X|<\infty$）。

下面把「积分尾 $\to$ MGF」写全，并处理讲义最后一步对小 $s$ 偏松的问题。

**第一步：中心化后 Taylor 从二次开始。** $\mathbb{E}X=0$ 时 $e^{sX}$ 的一阶项期望为 $0$，故

$$
\mathbb{E}[e^{sX}]
\le 1+\sum_{k=2}^\infty\frac{|s|^k}{k!}\mathbb{E}[|X|^k].
$$

把 $\mathbb{E}|X|^k=\int_0^\infty k t^{k-1}\mathbb{P}(|X|>t)\,dt$ 代入并交换求和（正项，Tonelli）：

$$
\sum_{k=2}^\infty\frac{|s|^k}{k!}\mathbb{E}[|X|^k]
=\int_0^\infty\mathbb{P}(|X|>t)\sum_{k=2}^\infty\frac{|s|^k t^{k-1}}{(k-1)!}\,dt
=\int_0^\infty\mathbb{P}(|X|>t)\,|s|\bigl(e^{|s|t}-1\bigr)\,dt.
$$

因此

$$
\mathbb{E}[e^{sX}]
\;\le\;
1+\int_0^\infty |s|\bigl(e^{|s|t}-1\bigr)\,\mathbb{P}(|X|>t)\,dt.
$$

这就是「用尾积分控制 MGF」。因子 $(e^{|s|t}-1)$ 在 $t=0$ 处是 $O(t)$，所以整体对小 $s$ 是 $O(s^2)$，不会冒出假的线性项。

**第二步：分 $|s|$ 大/小，得到 $\mathrm{subG}(C\sigma^2)$。** 以下 $s\ge 0$（$s<0$ 看 $-X$）。

*小 $s$：* $0\le\sigma s\le 1$。由 12.3，

$$
\frac{s^k}{k!}\mathbb{E}[|X|^k]
\le s^k(2\sigma^2)^{k/2}\frac{\Gamma(k/2)}{(k-1)!}
=2\sigma^2 s^2\cdot(\sqrt{2}\,\sigma s)^{k-2}\frac{\Gamma(k/2)}{(k-1)!}.
$$

$\sigma s\le 1$ 时 $(\sqrt{2}\,\sigma s)^{k-2}\le(\sqrt{2})^{k-2}$，故

$$
\mathbb{E}[e^{sX}]
\le 1+2\sigma^2 s^2\sum_{k=2}^\infty(\sqrt{2})^{k-2}\frac{\Gamma(k/2)}{(k-1)!}.
$$

级数数值上 $\le 2.3$（$k=2$ 贡献 $1$，其后迅速衰减）。于是 $\mathbb{E}[e^{sX}]\le 1+5\sigma^2 s^2\le\exp(5\sigma^2 s^2)$。

*大 $s$：* $\sigma s\ge 1$。回到

$$
\mathbb{E}[e^{sX}]
\le 1+2s\int_0^\infty e^{st}e^{-t^2/(2\sigma^2)}\,dt
\le 1+2s\,e^{\sigma^2 s^2/2}\int_{-\infty}^\infty e^{-(t-\sigma^2 s)^2/(2\sigma^2)}\,dt
=1+2s\sigma\sqrt{2\pi}\,e^{\sigma^2 s^2/2}.
$$

令 $\tau=\sigma s\ge 1$。右边 $=1+2\sqrt{2\pi}\,\tau\,e^{\tau^2/2}$。而 $e^{4\tau^2}$ 在 $\tau\ge 1$ 时远大于它（$\tau=1$：左边 $\approx 8.3$，右边 $e^4\approx 54$）。故 $\mathbb{E}[e^{sX}]\le\exp(4\sigma^2 s^2)$。

两段合并：$\mathbb{E}[e^{sX}]\le\exp(5\sigma^2 s^2)=\exp\bigl((10\sigma^2)s^2/2\bigr)$，即 $X\sim\mathrm{subG}(10\sigma^2)$。讲义写 $\mathrm{subG}(8\sigma^2)$，来自下面的矩级数（常数不重要，后面只用「某个常数倍的 $\sigma^2$」）。

**讲义上的矩级数（对照 PDF p.185）。** 他们用 $e^{sX}\le\sum |s|^k|X|^k/k!$（含 $k=1$）以及 12.3，再按偶/奇 $k=2m$ / $2m+1$ 拆开：

$$
\begin{aligned}
\mathbb{E}[e^{sX}]
&\le 1+\sum_{k\ge 1}\frac{(2\sigma^2 s^2)^{k/2}k\Gamma(k/2)}{k!}\\
&=1+\sum_{m\ge 1}\frac{(2\sigma^2 s^2)^m\,2m\Gamma(m)}{(2m)!}
+\sum_{m\ge 1}\frac{(2\sigma^2 s^2)^{m+1/2}(2m+1)\Gamma(m+1/2)}{(2m+1)!}.
\end{aligned}
$$

偶项：$2m\Gamma(m)=2m!$（$m\ge 1$ 整数），故系数为 $2\cdot m!/(2m)!$。奇项用 $\Gamma(m+1/2)\le\sqrt{\pi}\,m!$ 一类的界，得到

$$
\mathbb{E}[e^{sX}]
\le 1+\bigl(2+\sqrt{\pi\cdot 2\sigma^2 s^2}\bigr)\sum_{m\ge 1}\frac{(2\sigma^2 s^2)^m m!}{(2m)!}.
$$

再用 $m!/(2m)!\le 1/m!$（因为 $(2m)!\ge(m!)^2$），

$$
\sum_{m\ge 1}\frac{a^m m!}{(2m)!}\le e^{a}-1,\qquad a=2\sigma^2 s^2,
$$

从而 $\le 1+2\bigl(1+\sqrt{2\sigma^2 s^2}\bigr)(e^{2\sigma^2 s^2}-1)$。讲义最后写 $\le e^{4\sigma^2 s^2}$。这一步对**很小的 $s$** 并不自动成立（右边二次、左边若保留 $k=1$ 的绝对矩会冒出 $O(|s|)$）。正确做法就是上面「从 $k=2$ 开始 + 分段」。结论不变：尾条件 $\Rightarrow$ 次高斯，方差代理 $O(\sigma^2)$。

---

## 13. 独立和与线性组合（p.186）

### 13.1 高斯的线性组合仍是高斯

若 $X_1,\ldots,X_n$ i.i.d. $N(0,\sigma^2)$，$a\in\mathbb{R}^n$，则

$$
\sum_{i=1}^n a_i X_i\;\sim\; N\bigl(0,\|a\|_2^2\sigma^2\bigr).
$$

（MGF 相乘：$\prod_i\exp(a_i^2\sigma^2 s^2/2)=\exp(\|a\|_2^2\sigma^2 s^2/2)$，这是 $N(0,\|a\|_2^2\sigma^2)$ 的 MGF。）

### 13.2 独立次高斯向量

若 $X=(X_1,\ldots,X_n)^\top$，$X_i$ i.i.d. $\mathrm{subG}(\sigma^2)$，则 $X\sim\mathrm{subG}_n(\sigma^2)$。

**证明。** 对 $u\in\mathbb{S}^{n-1}$，独立性把 MGF 变成乘积：

$$
\mathbb{E}\bigl[e^{s u^\top X}\bigr]
=\prod_{i=1}^n\mathbb{E}\bigl[e^{s u_i X_i}\bigr]
\le\prod_{i=1}^n\exp\Bigl(\frac{\sigma^2 s^2 u_i^2}{2}\Bigr)
=\exp\Bigl(\frac{\sigma^2 s^2\|u\|_2^2}{2}\Bigr)
=\exp\Bigl(\frac{\sigma^2 s^2}{2}\Bigr).
$$

$\square$

因而对任意 $a\in\mathbb{R}^n$，$a^\top X\sim\mathrm{subG}(\sigma^2\|a\|_2^2)$（把 $a=\|a\|_2\cdot u$）。Chernoff 给出

$$
\mathbb{P}(\langle X,a\rangle>t)\le\exp\Bigl(-\frac{t^2}{2\sigma^2\|a\|_2^2}\Bigr),
\qquad
\mathbb{P}(\langle X,a\rangle<-t)\le\exp\Bigl(-\frac{t^2}{2\sigma^2\|a\|_2^2}\Bigr).
$$

### 13.3 样本均值

取 $a_i=1/n$，$\bar X=n^{-1}\sum_i X_i$，则 $\|a\|_2^2=1/n$，$\bar X\sim\mathrm{subG}(\sigma^2/n)$，故

$$
\mathbb{P}\bigl(|\bar X|>t\bigr)\;\le\;2\exp\Bigl(-\frac{n t^2}{2\sigma^2}\Bigr).
$$

**人话：** 独立次高斯平均之后，方差代理除以 $n$，尾以 $e^{-n t^2}$ 消失。这是 Lec1「$\sigma^2 d/n$」里 $1/n$ 的概率来源。

---

## 14. Hoeffding 引理与不等式（p.186–187）

### 14.1 引理（有界 $\Rightarrow$ 次高斯）

设 $\mathbb{E}[X]=0$，且 $X\in[a,b]$ a.s.。则对任意 $s\in\mathbb{R}$，

$$
\mathbb{E}[e^{sX}]\;\le\;\exp\Bigl(\frac{s^2(b-a)^2}{8}\Bigr).
$$

特别地 $X\sim\mathrm{subG}\bigl((b-a)^2/4\bigr)$（因为定义里是 $e^{\sigma^2 s^2/2}$，所以 $\sigma^2/2=(b-a)^2/8$）。

下面给两个完整证明：用户要的凸组合，以及讲义的指数倾斜。

#### 证法 A（凸组合：$e^{sx}$ 不超过端点线性）

$x\mapsto e^{sx}$ 凸。对 $x\in[a,b]$ 写成凸组合

$$
x=\frac{b-x}{b-a}\,a+\frac{x-a}{b-a}\,b,
$$

故

$$
e^{sx}\;\le\;\frac{b-x}{b-a}\,e^{sa}+\frac{x-a}{b-a}\,e^{sb}.
$$

取期望，用 $\mathbb{E}X=0$：

$$
\mathbb{E}[e^{sX}]
\le\frac{b}{b-a}e^{sa}+\frac{-a}{b-a}e^{sb}.
$$

（$\mathbb{E}X=0$ 与 $X\in[a,b]$ 迫使 $a\le 0\le b$，故 $p:=-a/(b-a)\in[0,1]$，$1-p=b/(b-a)$。）令 $u=s(b-a)$。因为 $a=-p(b-a)$，$sa=-pu$，

$$
\mathbb{E}[e^{sX}]
\le e^{-pu}\bigl(1-p+p e^{u}\bigr)
=\exp\bigl(\varphi(u)\bigr),
$$

其中 $\varphi(u)=-pu+\log(1-p+pe^{u})$。直接计算 $\varphi(0)=0$，

$$
\varphi'(u)=-p+\frac{pe^{u}}{1-p+pe^{u}},\qquad\varphi'(0)=0,
$$

$$
\varphi''(u)=\frac{p(1-p)e^{u}}{(1-p+pe^{u})^2}=v(1-v)\le\frac14,
$$

这里 $v=pe^{u}/(1-p+pe^{u})\in(0,1)$，而 $v(1-v)\le 1/4$。Taylor：$\varphi(u)=\varphi''(\xi)u^2/2\le u^2/8$。故 $\mathbb{E}[e^{sX}]\le\exp(s^2(b-a)^2/8)$。$\square$

#### 证法 B（讲义：cumulant 的二阶导 = 倾斜方差）

令 $\psi(s)=\log\mathbb{E}[e^{sX}]$。则 $\psi(0)=\log 1=0$，$\psi'(0)=\mathbb{E}X=0$，且

$$
\psi'(s)=\frac{\mathbb{E}[Xe^{sX}]}{\mathbb{E}[e^{sX}]},\qquad
\psi''(s)=\frac{\mathbb{E}[X^2 e^{sX}]}{\mathbb{E}[e^{sX}]}-\Biggl(\frac{\mathbb{E}[Xe^{sX}]}{\mathbb{E}[e^{sX}]}\Biggr)^2.
$$

即 $\psi''(s)=\mathrm{Var}_Q(X)$，其中 $\mathrm{d}Q=e^{sX}/\mathbb{E}[e^{sX}]\,\mathrm{d}\mathbb{P}$（指数倾斜）。$X\in[a,b]$ a.s. 在 $Q$ 下仍成立，故

$$
\mathrm{Var}_Q(X)
=\mathrm{Var}_Q\Bigl(X-\frac{a+b}{2}\Bigr)
\le\mathbb{E}_Q\Bigl[\Bigl(X-\frac{a+b}{2}\Bigr)^2\Bigr]
\le\Bigl(\frac{b-a}{2}\Bigr)^2
=\frac{(b-a)^2}{4}.
$$

（落在长度为 $b-a$ 的区间上，到中点的距离 $\le(b-a)/2$。）再积分：

$$
\psi(s)=\int_0^s\int_0^\mu\psi''(\rho)\,d\rho\,d\mu
\le\int_0^s\int_0^\mu\frac{(b-a)^2}{4}\,d\rho\,d\mu
=\frac{s^2(b-a)^2}{8}.
$$

（$s<0$ 把积分上下限反过来，同样。）$\square$

### 14.2 Rademacher 是 $\mathrm{subG}(1)$

$\mathbb{P}(X=\pm 1)=\frac12$，则 $\mathbb{E}X=0$，$\mathbb{E}[e^{sX}]=\cosh(s)$。级数：

$$
\cosh(s)=\sum_{k=0}^\infty\frac{s^{2k}}{(2k)!}
\le\sum_{k=0}^\infty\frac{(s^2/2)^k}{k!}
=e^{s^2/2},
$$

因为 $(2k)!\ge 2^k k!$。故噪声水平 $1$。Lec2 的 Rademacher 复杂度用的就是它。

### 14.3 Hoeffding 不等式（完整）

设 $X_1,\ldots,X_n$ **独立**，$X_i\in[a_i,b_i]$ a.s.。记 $\bar X=n^{-1}\sum_i X_i$。则对任意 $t>0$，

$$
\mathbb{P}\bigl(\bar X-\mathbb{E}\bar X>t\bigr)
\le\exp\Biggl(-\frac{2n^2 t^2}{\sum_{i=1}^n(b_i-a_i)^2}\Biggr),
$$

$$
\mathbb{P}\bigl(\bar X-\mathbb{E}\bar X<-t\bigr)
\le\exp\Biggl(-\frac{2n^2 t^2}{\sum_{i=1}^n(b_i-a_i)^2}\Biggr).
$$

**证明。** 令 $Y_i=X_i-\mathbb{E}X_i\in[a_i-\mathbb{E}X_i,\,b_i-\mathbb{E}X_i]$，长度仍是 $b_i-a_i$，且 $\mathbb{E}Y_i=0$。对 $s>0$，Chernoff + 独立 + 引理：

$$
\mathbb{P}\Bigl(\sum_i Y_i>nt\Bigr)
\le e^{-s nt}\prod_i\mathbb{E}[e^{s Y_i}]
\le\exp\Biggl(-snt+\frac{s^2}{8}\sum_i(b_i-a_i)^2\Biggr).
$$

取 $s=4nt/\sum_i(b_i-a_i)^2$，指数变成 $-2n^2 t^2/\sum(b_i-a_i)^2$。负向对 $-Y_i$ 同样。$\square$

等价地，对和 $S=\sum_i X_i$：$\mathbb{P}(S-\mathbb{E}S>u)\le\exp\bigl(-2u^2/\sum(b_i-a_i)^2\bigr)$（$u=nt$）。

讲义还写了向量版：对 $w=u\mathbf{1}$ 不必；对任意 $u\in\mathbb{R}^n$，

$$
\mathbb{E}\bigl[e^{s u^\top X}\bigr]
=\prod_i\mathbb{E}[e^{s u_i X_i}]
\le\exp\Bigl(\frac{s^2}{8}\sum_i(b_i-a_i)^2 u_i^2\Bigr),
$$

即 $u^\top X\sim\mathrm{subG}\bigl(\sum_i(b_i-a_i)^2 u_i^2/4\bigr)$（此处 $X_i$ 已中心化）。

**代价：** Hoeffding 只用区间长度，**看不见方差**。若 $X_i$ 很瘦（方差 $\ll(b_i-a_i)^2/4$），界偏松。这引出 Bernstein。

---

## 15. 次指数与 Bernstein（p.187–189）

### 15.1 Laplace：比高斯重的尾

$X\sim\mathrm{Lap}(1)$，密度 $e^{-|x|}/2$。尾 $\mathbb{P}(|X|>t)=e^{-t}$（$t\ge 0$），只有指数、没有 $e^{-t^2}$。MGF：

$$
\mathbb{E}[e^{sX}]=\frac{1}{1-s^2},\qquad |s|<1.
$$

（分正负轴积分。）当 $|s|\le 1/2$ 时 $s^2\le 1/4$，$-\log(1-s^2)=s^2+s^4/2+\cdots\le s^2/(1-s^2)\le 4s^2/3\le 2s^2$，故 $\mathbb{E}[e^{sX}]\le e^{2s^2}$。MGF **只在 $|s|$ 的一个区间上**像次高斯——这是次指数的原型。

### 15.2 指数尾 $\Rightarrow$ 次指数型 MGF

设 $\mathbb{E}X=0$，$\mathbb{P}(|X|>t)\le 2e^{-2t/\lambda}$（$\lambda>0$）。则对整数 $k\ge 1$，$\mathbb{E}[|X|^k]\le\lambda^k k!$，并且

$$
\mathbb{E}[e^{sX}]\;\le\;e^{2s^2\lambda^2},\qquad |s|\le\frac{1}{2\lambda}.
$$

**证明。** 层饼：

$$
\mathbb{E}[|X|^k]
=\int_0^\infty\mathbb{P}(|X|>t^{1/k})\,dt
\le\int_0^\infty 2\exp\bigl(-2 t^{1/k}/\lambda\bigr)\,dt.
$$

换元 $u=2 t^{1/k}/\lambda$，$t=(\lambda u/2)^k$，$dt=k(\lambda/2)^k u^{k-1}\,du$，故

$$
\int_0^\infty 2 e^{-2t^{1/k}/\lambda}\,dt
=2k(\lambda/2)^k\int_0^\infty e^{-u}u^{k-1}\,du
=2k(\lambda/2)^k\Gamma(k)
=2(\lambda/2)^k k\cdot(k-1)!
=2^{1-k}\lambda^k k!.
$$

讲义用更松的 $2(\lambda/2)^k k\Gamma(k)\le\lambda^k k!$（$k\Gamma(k)=k!$，且 $2^{1-k}\le 1$ 对 $k\ge 1$ 在 $k=1$ 时是 $1$，对 $k\ge 2$ 更小；他们写 $\le\lambda^k k\Gamma(k)=\lambda^k k!$）。

MGF：$\mathbb{E}X=0$ 故从 $k=2$ 起，

$$
\mathbb{E}[e^{sX}]
\le 1+\sum_{k=2}^\infty\frac{|s|^k\mathbb{E}[|X|^k]}{k!}
\le 1+\sum_{k=2}^\infty(|s|\lambda)^k
=1+\frac{s^2\lambda^2}{1-|s|\lambda},
$$

当 $|s|\lambda\in(0,1/2]$ 时 $1/(1-|s|\lambda)\le 2$，故 $\le 1+2s^2\lambda^2\le e^{2s^2\lambda^2}$。$\square$

### 15.3 次指数的定义

称 $X\sim\mathrm{subE}(\lambda)$（次指数，参数 $\lambda$），若 $\mathbb{E}[X]=0$ 且

$$
\mathbb{E}[e^{sX}]\;\le\;\exp\bigl(s^2\lambda^2/2\bigr),\qquad\forall\,|s|\le\frac1\lambda.
$$

与次高斯的差别：MGF 界**只要求在一个对称区间上**成立。两个次高斯的乘积、次高斯的平方（中心化后）是次指数：若 $X\sim\mathrm{subG}(\sigma^2)$，则 $Z=X^2-\mathbb{E}[X^2]\sim\mathrm{subE}(4\sigma)$（细节见 HDP / Vershynin；本课后面用平方损失时会碰到）。

### 15.4 Bernstein（独立次指数的平均）

设 $X_1,\ldots,X_n$ 独立，$\mathbb{E}X_i=0$，$X_i\sim\mathrm{subE}(\lambda)$。记 $\bar X=n^{-1}\sum_i X_i$。则

$$
\mathbb{P}(\bar X>t)\vee\mathbb{P}(\bar X<-t)
\;\le\;
\exp\Biggl[-\frac n2\Biggl(\frac{t^2}{\lambda^2}\wedge\frac t\lambda\Biggr)\Biggr].
$$

**证明。** 不妨 $\lambda=1$（用 $X_i/\lambda$ 与 $t/\lambda$ 替换）。Chernoff：对 $s>0$，

$$
\mathbb{P}(\bar X>t)
\le e^{-snt}\prod_{i=1}^n\mathbb{E}[e^{s X_i}].
$$

定义要求 $|s|\le 1$ 时 $\mathbb{E}[e^{sX_i}]\le e^{s^2/2}$，故

$$
\mathbb{P}(\bar X>t)\le\exp\bigl(ns^2/2-snt\bigr).
$$

取 $s=1\wedge t$（保证 $s\le 1$）：

- 若 $t\le 1$，$s=t$，指数 $=nt^2/2-nt^2=-nt^2/2$；
- 若 $t>1$，$s=1$，指数 $=n/2-nt\le -nt/2$（因为 $t>1\Rightarrow n/2-nt\le -nt/2$）。

即 $\exp\bigl(-\frac n2(t^2\wedge t)\bigr)$。负向同样。$\square$

**人话：** 偏差 $t$ 小时像次高斯（$e^{-n t^2}$），$t$ 大时退化成指数尾（$e^{-nt}$）。Laplace 平均就是这样。

### 15.5 Bernstein：有界 RV 的方差感知版

设 $\mu=\mathbb{E}X$，$\mathrm{var}(X)=\sigma^2$，$|X-\mu|\le b$ a.s.。则对任意 $t>0$，

$$
\mathbb{P}[X-\mu\ge t]\;\le\;\exp\Biggl(-\frac{t^2}{2(\sigma^2+bt)}\Biggr).
$$

把 $X$ 换成 $-X$：$\mathbb{P}[\mu-X\ge t]\le\exp\bigl(-t^2/(2(\sigma^2+bt))\bigr)$。

**证明（对照 PDF p.188）。** 令 $Y=X-\mu$，$\mathbb{E}Y=0$，$\mathbb{E}Y^2=\sigma^2$，$|Y|\le b$。对 $k\ge 3$，

$$
\bigl|\mathbb{E}[Y^k]\bigr|\le\mathbb{E}[|Y|^k]=\mathbb{E}[|Y|^{k-2}Y^2]\le b^{k-2}\sigma^2.
$$

于是对 $|\lambda|<1/b$，

$$
\begin{aligned}
\mathbb{E}[e^{\lambda Y}]
&=1+\frac{\lambda^2\sigma^2}{2}+\sum_{k=3}^\infty\frac{\lambda^k\mathbb{E}[Y^k]}{k!}\\
&\le 1+\frac{\lambda^2\sigma^2}{2}+\frac{\lambda^2\sigma^2}{2}\sum_{k=3}^\infty(|\lambda|b)^{k-2},
\end{aligned}
$$

这里用了 $k\ge 3\Rightarrow 1/k!\le 1/2$。几何级数 $\sum_{j=1}^\infty r^j=r/(1-r)$，$r=|\lambda|b$，故

$$
\sum_{k=3}^\infty r^{k-2}=\frac{r}{1-r},\qquad
1+\frac{\lambda^2\sigma^2}{2}\Bigl(1+\frac{r}{1-r}\Bigr)
=1+\frac{\lambda^2\sigma^2}{2(1-b|\lambda|)}.
$$

再用 $1+u\le e^u$：

$$
\mathbb{E}[e^{\lambda Y}]\le\exp\Biggl(\frac{\lambda^2\sigma^2}{2(1-b|\lambda|)}\Biggr),\qquad |\lambda|<1/b.
$$

Chernoff（$\lambda\in(0,1/b)$）：

$$
\mathbb{P}(Y\ge t)\le\exp\Biggl(-\lambda t+\frac{\lambda^2\sigma^2}{2(1-b\lambda)}\Biggr).
$$

取 $\lambda=t/(bt+\sigma^2)$。此时 $\lambda<1/b$，且 $1-b\lambda=\sigma^2/(bt+\sigma^2)$，于是

$$
-\lambda t+\frac{\lambda^2\sigma^2}{2(1-b\lambda)}
=-\frac{t^2}{bt+\sigma^2}+\frac{t^2}{2(bt+\sigma^2)}
=-\frac{t^2}{2(\sigma^2+bt)}.
$$

$\square$

**i.i.d. 平均（讲义 p.189）。** 设 $X_1,\ldots,X_n$ 为 $X$ 的 i.i.d. 拷贝，$Y_i=X_i-\mu$。独立给出

$$
\mathbb{E}\bigl[e^{\lambda\sum_i Y_i}\bigr]
=\prod_{i=1}^n\mathbb{E}[e^{\lambda Y_i}]
\le\exp\Biggl(\frac{n\lambda^2\sigma^2}{2(1-b|\lambda|)}\Biggr),\qquad |\lambda|<1/b.
$$

Chernoff：$\mathbb{P}(n^{-1}\sum Y_i\ge t)=\mathbb{P}(\sum Y_i\ge nt)\le\exp\bigl(-n\lambda t+n\lambda^2\sigma^2/(2(1-b\lambda))\bigr)$。仍取 $\lambda=t/(bt+\sigma^2)$，指数多一个 $n$，即

$$
\mathbb{P}\Bigl[\mu-\frac1n\sum_i X_i\ge t\Bigr]
\le\exp\Biggl(-\frac{nt^2}{2(\sigma^2+bt)}\Biggr).
$$

（有界性用在每个 $X_i$ 上，$b$ 仍是单样本的界，不是平均的界。）

$t$ 较小时分母 $\approx 2\sigma^2$，回到次高斯；$t$ 较大时分母 $\approx 2bt$，回到 Hoeffding 型指数。**既用了方差，又用了有界。**

---

## 16. McDiarmid / 有界差分（p.189–190，证明写全）

### 16.1 定理

设 $X_1,\ldots,X_n$ **独立**，$X=(X_1,\ldots,X_n)$，$f:\mathbb{R}^n\to\mathbb{R}$ 可测。假设改变第 $i$ 个坐标最多改 $f$ 的 $c_i$：对任意 $x$ 以及只在第 $i$ 位不同的 $x'$，

$$
\bigl|f(x)-f(x')\bigr|\;\le\; c_i.
$$

则对任意 $t>0$，

$$
\mathbb{P}\bigl[f(X)-\mathbb{E}f(X)\ge t\bigr]
\;\le\;
\exp\Biggl(-\frac{2t^2}{\sum_{i=1}^n c_i^2}\Biggr).
$$

（对 $-f$ 同样，故双边多一个 $2$。）

这是 Hoeffding 的函数版：经验风险 $\widehat L(f)$、Rademacher 复杂度、$\sup_{g\in\mathcal{G}}n^{-1}\sum g(Z_i)$ 都满足有界差分。

### 16.2 鞅差分解

令 $\mathcal{F}_i=\sigma(X_1,\ldots,X_i)$，$\mathcal{F}_0$ 平凡。定义

$$
V_i\;:=\;\mathbb{E}[f\mid X_1,\ldots,X_i]-\mathbb{E}[f\mid X_1,\ldots,X_{i-1}].
$$

塔性质：$\mathbb{E}[V_i\mid X_1,\ldots,X_{i-1}]=0$（鞅差）。且

$$
\sum_{i=1}^n V_i
=\mathbb{E}[f\mid X_{1:n}]-\mathbb{E}[f]
=f(X)-\mathbb{E}f(X).
$$

定义（随机）上下界

$$
\begin{aligned}
L_i&=\inf_x\mathbb{E}[f\mid X_1,\ldots,X_{i-1},x]-\mathbb{E}[f\mid X_1,\ldots,X_{i-1}],\\
U_i&=\sup_x\mathbb{E}[f\mid X_1,\ldots,X_{i-1},x]-\mathbb{E}[f\mid X_1,\ldots,X_{i-1}].
\end{aligned}
$$

则 $L_i\le V_i\le U_i$ a.s.（$V_i$ 是把 inf/sup 里的 $x$ 换成真正的 $X_i$）。

### 16.3 $U_i-L_i\le c_i$

$$
\begin{aligned}
U_i-L_i
&=\sup_u\sup_l
\Bigl(\mathbb{E}[f\mid X_{1:i-1},u]-\mathbb{E}[f\mid X_{1:i-1},l]\Bigr)\\
&=\sup_u\sup_l\int\bigl[f(X_{1:i-1},u,x_{i+1:n})-f(X_{1:i-1},l,x_{i+1:n})\bigr]\,\mathrm{d}\mathbb{P}(x_{i+1:n}).
\end{aligned}
$$

（独立性：给定前 $i-1$ 个坐标并把第 $i$ 个钉死，后面 $X_{i+1:n}$ 的条件律就是自己的边际。）被积函数绝对值 $\le c_i$，故积分 $\le c_i$。$\square$

### 16.4 条件 Hoeffding + 迭代（p.190）

给定 $X_{1:i-1}$，$V_i$ 是中心化的、取值在长度为 $\le c_i$ 的随机区间 $[L_i,U_i]$ 里的 RV。Hoeffding 引理对**条件分布**给出

$$
\mathbb{E}\bigl[e^{s V_i}\mid X_{1:i-1}\bigr]
\le\exp\bigl(s^2(U_i-L_i)^2/8\bigr)
\le\exp(s^2 c_i^2/8).
$$

现在对 $s>0$，

$$
\begin{aligned}
\mathbb{P}\bigl(f(X)-\mathbb{E}f\ge t\bigr)
&=\mathbb{P}\Bigl(\sum_{i=1}^n V_i\ge t\Bigr)
=\mathbb{P}\Bigl(e^{s\sum V_i}\ge e^{st}\Bigr)
\le e^{-st}\mathbb{E}\bigl[e^{s\sum_{i=1}^n V_i}\bigr].
\end{aligned}
$$

把期望按 $X_{1:n-1}$ 条件化：$\sum_{i=1}^{n-1}V_i$ 对 $\mathcal{F}_{n-1}$ 可测，

$$
\mathbb{E}\bigl[e^{s\sum_{i=1}^n V_i}\bigr]
=\mathbb{E}\Bigl[e^{s\sum_{i=1}^{n-1}V_i}\,\mathbb{E}\bigl[e^{s V_n}\mid X_{1:n-1}\bigr]\Bigr]
\le e^{s^2 c_n^2/8}\,\mathbb{E}\bigl[e^{s\sum_{i=1}^{n-1}V_i}\bigr].
$$

向后迭代 $n$ 次：

$$
\mathbb{E}\bigl[e^{s\sum V_i}\bigr]
\le\exp\Bigl(\frac{s^2}{8}\sum_{i=1}^n c_i^2\Bigr).
$$

故 $\mathbb{P}\le\exp\bigl(-st+s^2\sum c_i^2/8\bigr)$。取 $s=4t/\sum_i c_i^2$，得到 $\exp(-2t^2/\sum c_i^2)$。$\square$

这就是 Azuma–Hoeffding 用在 Doob 鞅 $M_i=\mathbb{E}[f\mid\mathcal{F}_i]$ 上。

---

## 17. 有限最大值（p.190）

设 $X_1,\ldots,X_N$ 各 $\sim\mathrm{subG}(\sigma^2)$（**不必独立**），$Z=\max_{1\le i\le N}X_i$，$Y=\max_{1\le i\le N}|X_i|$。则

$$
\mathbb{E}[Z]\le\sigma\sqrt{2\log N},\qquad
\mathbb{E}[Y]\le\sigma\sqrt{2\log(2N)},
$$

且对 $t>0$，

$$
\mathbb{P}[Z>t]\le N\exp\Bigl(-\frac{t^2}{2\sigma^2}\Bigr),\qquad
\mathbb{P}[Y>t]\le 2N\exp\Bigl(-\frac{t^2}{2\sigma^2}\Bigr).
$$

**期望：Jensen + 和代替 max。** 对任意 $s>0$，

$$
\begin{aligned}
\mathbb{E}[Z]
&=\frac1s\mathbb{E}[\log e^{sZ}]
\le\frac1s\log\mathbb{E}[e^{sZ}]
=\frac1s\log\mathbb{E}\Bigl[\max_i e^{s X_i}\Bigr]\\
&\le\frac1s\log\sum_{i=1}^N\mathbb{E}[e^{s X_i}]
\le\frac1s\log\bigl(N e^{s^2\sigma^2/2}\bigr)
=\frac{\log N}{s}+\frac{\sigma^2 s}{2}.
\end{aligned}
$$

取 $s=\sqrt{2\log N}/\sigma$（$N\ge 2$；$N=1$ 时 $Z=X_1$，$\mathbb{E}Z=0$），得 $\sigma\sqrt{2\log N}$。

**$Y$：** 令 $X_{N+i}=-X_i$（$1\le i\le N$），则 $Y=\max_{1\le i\le 2N}X_i$，上式把 $N$ 换成 $2N$。

**尾：并集界。**

$$
\mathbb{P}[Z>t]
=\mathbb{P}\Bigl(\bigcup_{i=1}^N\{X_i>t\}\Bigr)
\le\sum_{i=1}^N\mathbb{P}(X_i>t)
\le N\exp\bigl(-t^2/(2\sigma^2)\bigr).
$$

$Y$ 对 $\pm X_i$ 共 $2N$ 项。

讲义最后写 $Y-\mathbb{E}[Y]\sim\mathrm{subG}(\sigma^2)$。严格说：仅由「每个 $X_i$ 次高斯」**不能**推出 $\max$ 中心化后有完全相同的方差代理（可以任意相关；$\psi_2$ 范数其实是 $\sigma\sqrt{\log N}$ 量级）。能无条件写下的是：均值已经是 $\sigma\sqrt{\log N}$，再往上走 $u$ 的概率 $\le 2N e^{-(\mathbb{E}Y+u)^2/(2\sigma^2)}$，对数只进均值、涨落仍是一个次高斯那么宽。这正是下一节覆盖数论证、以及 Lec2 Dudley 的输入。

---

## 18. 凸多面体上的最大值（p.191）

设紧凸集 $P=\mathrm{conv}(V(P))$，顶点 $v^1,\ldots,v^N$。令

$$
\mathcal{F}=\{\theta^\top X:\theta\in P\},
$$

其中 $X\in\mathbb{R}^d$ 满足 $\langle v^i,X\rangle\sim\mathrm{subG}(\sigma^2)$。则

$$
\mathbb{E}\bigl[\max_{f\in\mathcal{F}}f\bigr]\le\sigma\sqrt{2\log N},\qquad
\mathbb{E}\bigl[\max_{f\in\mathcal{F}}|f|\bigr]\le\sigma\sqrt{2\log(2N)},
$$

$$
\mathbb{P}\bigl(\max_{f\in\mathcal{F}}f>t\bigr)\le N e^{-t^2/(2\sigma^2)},\qquad
\mathbb{P}\bigl(\max_{f\in\mathcal{F}}|f|>t\bigr)\le 2N e^{-t^2/(2\sigma^2)}.
$$

**关键：线性函数在凸集上的最大在顶点取到。**

$$
\max_{x\in P}c^\top x=\max_{x\in V(P)}c^\top x.
$$

**证明。** 对任意 $x\in P$，存在 $\lambda_i\ge 0$，$\sum\lambda_i=1$，$x=\sum_{i=1}^N\lambda_i v^i$。故

$$
c^\top x=\sum_i\lambda_i c^\top v^i\le\sum_i\lambda_i\max_{v\in V(P)}c^\top v=\max_{v\in V(P)}c^\top v.
$$

反向：顶点本来就在 $P$ 里。$\square$

因此 $\max_{\theta\in P}\theta^\top X=\max_{1\le i\le N}(v^i)^\top X$，化成有限最大值。

**$\ell_1$ 球。** $B_1=\{x\in\mathbb{R}^d:\|x\|_1\le 1\}$ 的顶点是 $\{\pm e_j\}_{j=1}^d$，共 $2d$ 个。这就是 Lec1 约束 LS / Lasso 里「并集界打在 $2d$ 个坐标上、多一个 $\log d$」的几何来源。

---

## 19. 覆盖数、packing、欧氏球上的最大值（p.191–192）

### 19.1 $\varepsilon$-网与覆盖数

$K\subset\mathbb{R}^d$，距离 $d(\cdot,\cdot)$。集合 $\mathcal{N}$ 称为 $K$ 的 **$\varepsilon$-网（$\varepsilon$-net）**，若 $\mathcal{N}\subset K$，且每个 $z\in K$ 都存在 $x\in\mathcal{N}$ 使 $d(x,z)\le\varepsilon$。

**覆盖数** $N(K,d,\varepsilon)$：最小 $\varepsilon$-网的基数。欧氏球上常写 $N(B_2,\|\cdot\|_2,\varepsilon)$。

讲义先用一个稍松的界：$N(B_2,\|\cdot\|_2,\varepsilon)\le(3/\varepsilon)^d$（$\varepsilon\le 1$ 时由下面的 $(1+2/\varepsilon)^d\le(3/\varepsilon)^d$ 得到）。

### 19.2 packing vs covering

$P\subset K$ 称为 **$\varepsilon$-分离（packing）**，若任意不同的 $x,y\in P$ 满足 $d(x,y)>\varepsilon$。**packing 数** $\mathcal{P}(K,d,\varepsilon)$：最大 $\varepsilon$-分离集的基数。

**命题 1。** 极大 $\varepsilon$-分离集一定是 $\varepsilon$-网。

**证明。** 取极大 $\varepsilon$-分离集 $P$。对任意 $x\in K$：若 $x\in P$，取 $x_0=x$。若 $x\notin P$，极大性 $\Rightarrow$ $P\cup\{x\}$ 不再 $\varepsilon$-分离 $\Rightarrow$ 存在 $x_0\in P$ 使 $d(x,x_0)\le\varepsilon$。$\square$

**贪心构造。** 在紧集 $K$ 里任取 $x_1$；再取与 $x_1$ 距离 $>\varepsilon$ 的 $x_2$；再取与前两点都 $>\varepsilon$ 的 $x_3$……紧性 $\Rightarrow$ 有限步停止，得到 $\varepsilon$-网。

**命题 2。** 对紧 $K\subseteq\mathbb{R}^d$ 与 $\varepsilon>0$，

$$
\mathcal{P}(K,d,2\varepsilon)\;\le\; N(K,d,\varepsilon)\;\le\;\mathcal{P}(K,d,\varepsilon).
$$

**证明。** 右边：极大 $\varepsilon$-packing 是 $\varepsilon$-网（命题 1），故最小网的基数 $\le$ 最大 packing 的基数。

左边：取任意 $\varepsilon$-网 $\{x_1,\ldots,x_N\}$（$N=N(K,d,\varepsilon)$）和任意 $2\varepsilon$-packing $\{y_1,\ldots,y_P\}$。每个 $y_j$ 落在某个网心的 $\varepsilon$-球里：存在 $\pi(j)$ 使 $d(y_j,x_{\pi(j)})\le\varepsilon$。若 $\pi(i)=\pi(j)=k$ 且 $i\neq j$，三角不等式

$$
d(y_i,y_j)\le d(y_i,x_k)+d(x_k,y_j)\le 2\varepsilon,
$$

与 packing 要求 $d(y_i,y_j)>2\varepsilon$ 矛盾。故 $\pi$ 单射，$P\le N$。对一切 packing 取 max，即 $\mathcal{P}(K,d,2\varepsilon)\le N(K,d,\varepsilon)$。$\square$

### 19.3 体积论证：$1/\varepsilon^d\le N(B_2,\|\cdot\|_2,\varepsilon)\le(1+2/\varepsilon)^d$

记 $B_2=\{x:\|x\|_2\le 1\}$，体积记 $\mathrm{vol}(B_2)$。缩放：$\mathrm{vol}(r B_2)=r^d\mathrm{vol}(B_2)$。

**下界。** 取基数 $N=N(B_2,\|\cdot\|_2,\varepsilon)$ 的 $\varepsilon$-网 $\{x_1,\ldots,x_N\}$。则

$$
B_2\;\subseteq\;\bigcup_{i=1}^N(x_i+\varepsilon B_2).
$$

取体积：

$$
\mathrm{vol}(B_2)
\le N\cdot\mathrm{vol}(\varepsilon B_2)
=N\varepsilon^d\mathrm{vol}(B_2)
\qquad\Rightarrow\qquad
N\ge\frac1{\varepsilon^d}.
$$

**上界。** 取基数 $P=\mathcal{P}(B_2,\|\cdot\|_2,\varepsilon)$ 的极大 $\varepsilon$-packing $\{x_1,\ldots,x_P\}$。球 $x_i+(\varepsilon/2)B_2$ **两两不交**（中心距 $>\varepsilon$）。每个这种球落在 $(1+\varepsilon/2)B_2$ 里（$\|x_i\|_2\le 1$）。故

$$
\bigcup_{i=1}^P\bigl(x_i+\tfrac{\varepsilon}{2}B_2\bigr)
\;\subseteq\;
\bigl(1+\tfrac{\varepsilon}{2}\bigr)B_2.
$$

体积：

$$
P\cdot\Bigl(\frac{\varepsilon}{2}\Bigr)^d\mathrm{vol}(B_2)
\le\Bigl(1+\frac{\varepsilon}{2}\Bigr)^d\mathrm{vol}(B_2)
\qquad\Rightarrow\qquad
P\le\Bigl(\frac{2}{\varepsilon}+1\Bigr)^d.
$$

由命题 2，$N\le P\le(1+2/\varepsilon)^d$。$\square$

$\varepsilon=\frac12$ 时 $N(B_2,\frac12)\le 5^d$；讲义用 $(3/\varepsilon)^d$ 写成 $6^d$。Lec1 高概率 OLS 用的是 $5^r$ 这一档。

### 19.4 欧氏球上的最大值

设 $X\sim\mathrm{subG}_d(\sigma^2)$。则

$$
\mathbb{E}\Bigl[\max_{\theta\in B_2}\theta^\top X\Bigr]
=\mathbb{E}\Bigl[\max_{\theta\in B_2}|\theta^\top X|\Bigr]
\le 4\sigma\sqrt{d}.
$$

且对任意 $\delta>0$，以概率至少 $1-\delta$，

$$
\max_{\theta\in B_2}\theta^\top X
=\max_{\theta\in B_2}|\theta^\top X|
\;\le\;
4\sigma\sqrt{d}+2\sigma\sqrt{2\log(1/\delta)}.
$$

（$B_2=-B_2$，所以带绝对值的 max 与不带的相同。）

**证明。** 取 $B_2$ 的 $\frac12$-网 $\mathcal{N}$，$|\mathcal{N}|\le 6^d$。对任意 $\theta\in B_2$，存在 $z\in\mathcal{N}$ 与 $x$ 使 $\|x\|_2\le\frac12$，$\theta=z+x$。故

$$
\max_{\theta\in B_2}\theta^\top X
\le\max_{z\in\mathcal{N}}z^\top X+\max_{x\in\frac12 B_2}x^\top X
=\max_{z\in\mathcal{N}}z^\top X+\frac12\max_{u\in B_2}u^\top X.
$$

移项：$\max_{B_2}\theta^\top X\le 2\max_{z\in\mathcal{N}}z^\top X$。取期望，用有限最大值：

$$
\mathbb{E}\bigl[\max_{B_2}\theta^\top X\bigr]
\le 2\sigma\sqrt{2\log|\mathcal{N}|}
\le 2\sigma\sqrt{2d\log 6}.
$$

$\sqrt{2\log 6}\le 2$，故 $\le 4\sigma\sqrt{d}$。

尾：$\mathbb{P}(\max_{B_2}\theta^\top X>t)\le\mathbb{P}(2\max_{\mathcal{N}}z^\top X>t)\le|\mathcal{N}|\exp\bigl(-(t/2)^2/(2\sigma^2)\bigr)=|\mathcal{N}|e^{-t^2/(8\sigma^2)}$。  
令 $t=4\sigma\sqrt{d}+2\sigma\sqrt{2\log(1/\delta)}$。因为 $\max\le 2\max_{\mathcal{N}}$，等价于控制 $\max_{\mathcal{N}}>u$，$u=t/2=2\sigma\sqrt{d}+\sigma\sqrt{2\log(1/\delta)}$：

$$
\mathbb{P}(\max_{\mathcal{N}}>u)
\le 6^d\exp\Bigl(-\frac{u^2}{2\sigma^2}\Bigr).
$$

$u^2/(2\sigma^2)\ge d\log 6+\log(1/\delta)$（用 $\sqrt{A+B}\ge\sqrt{A}$ 的反向：$(a+b)^2\ge a^2+b^2$，$a=2\sigma\sqrt{d}$，$a^2/(2\sigma^2)=2d\ge d\log 6$ 因为 $\log 6<2$；交叉项再吸收 $\log(1/\delta)$）。讲义把这件事缩写成「$\le\delta$」。更干净的写法：取 $u=\sigma\sqrt{2\log(6^d/\delta)}$，则并集界恰好 $\delta$，再

$$
u\le\sigma\sqrt{2d\log 6}+\sigma\sqrt{2\log(1/\delta)}\le 2\sigma\sqrt{d}+\sigma\sqrt{2\log(1/\delta)},
$$

从而 $\max_{B_2}\le 2u\le 4\sigma\sqrt{d}+2\sigma\sqrt{2\log(1/\delta)}$。$\square$

这就是 Lec1 第 5.3 节「$\|\tilde\varepsilon\|_2=\sup_{\|u\|_2\le 1}\tilde\varepsilon^\top u$」的网论证。

---

## 20. HW：次高斯矩阵的算子范数（p.192，补全）

**题目。** $X\sim\mathrm{subG}_{m\times n}(\sigma^2)$。则存在绝对常数 $C$，对任意 $t>0$，

$$
\|X\|_2\;\le\; C\sigma\bigl(\sqrt{m}+\sqrt{n}+t\bigr)
$$

以概率至少 $1-2\exp(-t^2)$。这里 $\|X\|_2=\|X\|_{\mathrm{op}}=\sup_{\|v\|_2=1}\|Xv\|_2=\sup_{\|u\|_2=\|v\|_2=1}u^\top Xv$。

**证明。** 取单位球面的 $\varepsilon$-网：$\mathcal{N}_u$ 为 $\mathbb{S}^{m-1}$ 的 $\varepsilon$-网，$\mathcal{N}_v$ 为 $\mathbb{S}^{n-1}$ 的 $\varepsilon$-网。单位球面的欧氏覆盖数同样满足 $N(\mathbb{S}^{d-1},\varepsilon)\le(1+2/\varepsilon)^d$（体积论证做到半径 $1$ 的薄球壳上即可；与 $B_2$ 同阶）。取 $\varepsilon=\frac14$，则 $|\mathcal{N}_u|\le 9^m$，$|\mathcal{N}_v|\le 9^n$。

对任意单位 $u,v$，取 $u_0\in\mathcal{N}_u$，$v_0\in\mathcal{N}_v$ 使 $\|u-u_0\|_2\le\varepsilon$，$\|v-v_0\|_2\le\varepsilon$。则

$$
u^\top Xv-u_0^\top X v_0
=(u-u_0)^\top X v+u_0^\top X(v-v_0),
$$

$$
\bigl|u^\top Xv\bigr|
\le\bigl|u_0^\top X v_0\bigr|+\|X\|_{\mathrm{op}}\|u-u_0\|_2\|v\|_2+\|X\|_{\mathrm{op}}\|u_0\|_2\|v-v_0\|_2
\le\max_{\mathcal{N}_u\times\mathcal{N}_v}|u_0^\top X v_0|+2\varepsilon\|X\|_{\mathrm{op}}.
$$

对 $u,v$ 取 sup：$\|X\|_{\mathrm{op}}\le\max|u_0^\top X v_0|+2\varepsilon\|X\|_{\mathrm{op}}$。$\varepsilon=\frac14$ 时 $2\varepsilon=\frac12$，故

$$
\|X\|_{\mathrm{op}}\;\le\;2\max_{u_0\in\mathcal{N}_u,\,v_0\in\mathcal{N}_v}\bigl|u_0^\top X v_0\bigr|.
$$

每个 $u_0^\top X v_0\sim\mathrm{subG}(\sigma^2)$。并集界（$2|\mathcal{N}_u||\mathcal{N}_v|$ 个双边）：

$$
\mathbb{P}\Bigl(\max|u_0^\top X v_0|>s\Bigr)
\le 2\cdot 9^{m+n}\exp\bigl(-s^2/(2\sigma^2)\bigr).
$$

令 $s=\sigma\sqrt{2\bigl((m+n)\log 9+\log 2+t^2\bigr)}$，则右边 $\le 2e^{-t^2}$。于是 w.p. $\ge 1-2e^{-t^2}$，

$$
\|X\|_{\mathrm{op}}
\le 2s
\le C\sigma\bigl(\sqrt{m}+\sqrt{n}+t\bigr),
$$

其中 $C$ 来自 $\sqrt{m+n}\le\sqrt{m}+\sqrt{n}$ 以及 $\sqrt{\log 9}$ 等绝对常数。$\square$

---

## 21. 核对：次高斯 MGF、Hoeffding / Bernstein 分母（对照讲义）

以下与 `Fods_26.pdf` p.184–189 **逐字对齐**，避免和 Vershynin / Boucheron 的另一种归一化搞混。

**次高斯。** 讲义：$\mathbb{E}[X]=0$ 且 $\mathbb{E}[e^{sX}]\le\exp(\sigma^2 s^2/2)$（对一切 $s\in\mathbb{R}$），记 $X\sim\mathrm{subG}(\sigma^2)$。Chernoff 在 $s=t/\sigma^2$ 处给出

$$
\mathbb{P}(|X|>t)\le 2\exp\Bigl(-\frac{t^2}{2\sigma^2}\Bigr).
$$

指数里的 $2$ 在分母，来自 MGF 里的 $1/2$。若把定义改成 $\mathbb{E}e^{sX}\le e^{\sigma^2 s^2}$（无 $1/2$），尾会变成 $e^{-t^2/4\sigma^2}$，**不是**讲义。

**Hoeffding 引理。** $\mathbb{E}e^{sX}\le e^{s^2(b-a)^2/8}$，因此 $\sigma^2/2=(b-a)^2/8$，即 $X\sim\mathrm{subG}((b-a)^2/4)$。$8$ 来自区间上方差 $\le((b-a)/2)^2$ 再积分两次。

**Hoeffding 不等式。** 对**均值** $\bar X=n^{-1}\sum X_i$（$X_i\in[a_i,b_i]$ 独立）：

$$
\mathbb{P}(\bar X-\mathbb{E}\bar X>t)\le\exp\Biggl(-\frac{2n^2 t^2}{\sum_i(b_i-a_i)^2}\Biggr).
$$

分母是 $\sum(b_i-a_i)^2$，分子是 $2n^2 t^2$。对**和** $S=\sum X_i$ 写成 $\exp(-2u^2/\sum(b_i-a_i)^2)$（$u=nt$），是同一件事。

**Bernstein（次指数平均）。** $\mathbb{P}(|\bar X|>t)\le\exp\bigl[-\frac n2(t^2/\lambda^2\wedge t/\lambda)\bigr]$。小偏差分母像 $2\lambda^2/n$，大偏差变成线性尾。

**Bernstein（有界+方差）。** 单样本 $\exp\bigl(-t^2/(2(\sigma^2+bt))\bigr)$；$n$ 个 i.i.d. 平均把分子换成 $nt^2$，分母仍是 $2(\sigma^2+bt)$（$b,\sigma^2$ 是**单样本**的界，不随 $n$ 变）。

---

## 22. 地图：这些工具怎样接到 Lec1 和 Lec2

把附录 B 想象成工具箱，课上真正拧的螺丝钉只有几颗。

**Lec1 并集界（有限 / 顶点）。**

- OLS 高概率：$\|X(\widehat\theta-\theta^*)\|_2\le 2\sup_{\|u\|_2\le 1}\tilde\varepsilon^\top u$。一维投影是次高斯 $\Rightarrow$ 第 12 节的尾；$\sup$ 在球上 $\Rightarrow$ 第 19.4 节的 $\frac12$-网 + 并集；覆盖数 $5^r$ 或 $6^r$ $\Rightarrow$ $\sigma(\sqrt{r}+\sqrt{\log(1/\delta)})$。
- 约束 LS，$K=B_1$：第 18 节，最大值在 $2d$ 个顶点，并集出 $\sqrt{\log d}$。
- Lasso 的 $\lambda\sim\sigma\sqrt{\log(d/\delta)/n}$：$d$ 个坐标的次高斯尾 + 并集。

**Lec2 Dudley（无限函数类）。**

经验过程 $\sup_{f\in\mathcal{F}}|L(f)-\widehat L(f)|$ 不再是有限个次高斯的 max。做法：

1. 对称化之后变成 Rademacher 复杂度 $\mathbb{E}\sup_{f\in\mathcal{F}}n^{-1}\sum_i\varepsilon_i f(Z_i)$（$\varepsilon_i$ 是第 14.2 节的 Rademacher，$\mathrm{subG}(1)$）；
2. 对函数类用覆盖数 $N(\mathcal{F},\|\cdot\|_\infty,\varepsilon)$ 或经验 $L^2$ 覆盖数，把 $\sup$ 换成网上的有限 max（第 17 节：$\mathbb{E}\max\le\sigma\sqrt{\log N}$）；
3. 不同尺度的网一层层逼近，积分 $\int_0^\infty\sqrt{\log N(\mathcal{F},\varepsilon)}\,d\varepsilon$ ——这就是 **Dudley 熵积分**。第 19 节的体积界 $N(B_2,\varepsilon)\le(1+2/\varepsilon)^d$ 给出「$d$ 维球的熵是 $d\log(1/\varepsilon)$」，积分之后正是 $\sqrt{d/n}$ 这一档，和 Lec1 对上。

McDiarmid 则保证：Rademacher 复杂度作为 $Z_1,\ldots,Z_n$ 的函数，自己也集中在均值附近（有界差分 $c_i=O(1/n)$）。

**一句话：** 并集界管「有限个名字」；覆盖数把「无穷个名字」减成「有限个 $\varepsilon$-代表」；次高斯管每个代表的尾；Dudley 把所有尺度加起来。

---

## 23. 你应该记住的一张表

| 工具 | 假设 | 结论（数量级） | 用在哪 |
|------|------|----------------|--------|
| 并集界 | 任意事件 | $\mathbb{P}(\cup E_i)\le\sum\mathbb{P}(E_i)$ | 全程 |
| Markov / Chernoff | 非负 / MGF | $\mathbb{P}(X>t)\le e^{-st}M(s)$ | 所有集中 |
| 高斯 Mills | $N(\mu,\sigma^2)$ | $\mathbb{P}(|X-\mu|>t)\lesssim(\sigma/t)e^{-t^2/(2\sigma^2)}$ | 精确尾 |
| 次高斯 | $\mathbb{E}e^{sX}\le e^{\sigma^2 s^2/2}$ | $\mathbb{P}(|X|>t)\le 2e^{-t^2/(2\sigma^2)}$ | Lec1 噪声 |
| 独立和 | $X_i\sim\mathrm{subG}(\sigma^2)$ i.i.d. | $\bar X\sim\mathrm{subG}(\sigma^2/n)$ | 均值集中 |
| Hoeffding 引理 | $X\in[a,b]$，$\mathbb{E}X=0$ | $\mathrm{subG}((b-a)^2/4)$ | 有界 RV |
| Hoeffding 不等式 | 独立、有界 | $\mathbb{P}(|\bar X-\mu|>t)\le 2e^{-2n^2 t^2/\sum(b_i-a_i)^2}$ | 经验均值 |
| 次指数 / Bernstein | 指数尾或有界+方差 | $e^{-n(t^2/\sigma^2\wedge t/b)}$ | 方差感知 |
| McDiarmid | 有界差分 $c_i$ | $e^{-2t^2/\sum c_i^2}$ | 经验过程 |
| 有限 max | $N$ 个 $\mathrm{subG}(\sigma^2)$ | $\mathbb{E}\max\le\sigma\sqrt{2\log N}$ | 并集 / 网 |
| 凸多面体 | 顶点 $N$ 个 | max 在顶点，同上 | $B_1$、Lasso |
| 覆盖数 | $B_2\subset\mathbb{R}^d$ | $1/\varepsilon^d\le N\le(1+2/\varepsilon)^d$ | 网论证、Dudley |

读完本附录前半，可以去 `01_Lec1`。读完后半，Lec1 的高概率段和 `02a_Lec2` 的对称化 / Dudley 不再是黑盒。

下一份：若还没读附录 A，去 [05_附录A_线性代数微积分凸分析](/blog/fods-linear-algebra-calculus-convexity/)；否则继续 [02a_Lec2_统计误差](/blog/fods-statistical-error/)。
