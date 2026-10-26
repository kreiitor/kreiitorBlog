---
title: "幂级数求收敛域并求和"
description: "用比值法求收敛半径，判断端点，再通过逐项求导求和函数。"
pubDate: 2026-10-26
tags:
  - "数学"
  - "级数"
  - "微积分"
category: knowledge
cover: /covers/post-math.svg
---

## 题目

$$
\sum_{n=1}^{\infty} (-1)^{n-1} \frac{x^{2n-1}}{2n-1}
$$

---

## 一、收敛半径（比值法）

记 $a_n = (-1)^{n-1} \dfrac{x^{2n-1}}{2n-1}$，则

$$
\left| \frac{a_{n+1}}{a_n} \right| = x^2 \cdot \frac{2n-1}{2n+1} \;\xrightarrow{n \to \infty}\; x^2
$$

由比值法，当 $x^2 < 1$ 即 $|x| < 1$ 时级数绝对收敛，收敛半径 $R = 1$。

---

## 二、端点判断

### $x = 1$

$$
\sum_{n=1}^{\infty} \frac{(-1)^{n-1}}{2n-1} = 1 - \frac{1}{3} + \frac{1}{5} - \frac{1}{7} + \cdots
$$

莱布尼茨交错级数，条件收敛。

### $x = -1$

$$
\sum_{n=1}^{\infty} (-1)^{n-1} \frac{(-1)^{2n-1}}{2n-1}
= -\sum_{n=1}^{\infty} \frac{(-1)^{n-1}}{2n-1}
$$

同样条件收敛。

**收敛域：$[-1,\, 1]$**

---

## 三、求和

该级数是 $\arctan x$ 的麦克劳林展开式。

令和函数为 $S(x)$，逐项求导：

$$
\begin{aligned}
S'(x) &= \sum_{n=1}^{\infty} (-1)^{n-1} x^{2n-2} \\
&= 1 - x^2 + x^4 - x^6 + \cdots \\
&= \frac{1}{1 + x^2}
\end{aligned}
$$

由 $S(0) = 0$，积分得：

$$
S(x) = \int_0^x \frac{1}{1 + t^2} \, dt = \arctan x
$$

---

## 答案

$$
\boxed{\sum_{n=1}^{\infty} (-1)^{n-1} \frac{x^{2n-1}}{2n-1} = \arctan x}
$$

$$
\boxed{x \in [-1,\, 1]}
$$
