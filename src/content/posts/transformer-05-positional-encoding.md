---
title: "位置编码"
description: "绝对位置编码、旋转位置编码与长度外推。"
pubDate: 2026-10-26
tags:
  - "Transformer"
  - "位置编码"
category: course
series: transformer
order: 5
cover: /covers/series-deep-learning.svg
---

## 1. 为什么需要位置编码

### 1.1 自然语言使用语序表达语义

- 我爱你 -> 主宾
- 我今天开心 - 今天我开心 -> 强调位置不同

### 1.2 self-attention 位置「盲」

记输入矩阵 $X\in \mathbb{R}^{N\times d\_model}$，打乱输入 token 的顺序（即输入矩阵的行维度打乱，左乘排列矩阵 $\Pi$）。
有 $X^{'} = \Pi X$。经过投影之后，$Q^{'},K^{'},V^{'}$ 都是 $Q,K,V$ 左乘一个排列矩阵的结果。对于 attention 的计算，逐步代入：
由于 softmax 逐行操作，可以提出因子 $\Pi$；且排列矩阵有 $\Pi \Pi^T=I$。
$$
attn^{'}=softmax\left(\frac{Q^{'}K^{'T}}{d_k}\right)V^{'}=\Pi softmax\left(\frac{QK^{T}}{d_k}\right)\Pi^T\Pi V=\Pi attn
$$
可知，将输入 token 打乱之后，最终注意力等价于把原来的注意力按同样方式打乱（行维度），数值没有变化。

## 2. 如何引入位置编码

### 2.1 绝对位置编码

为每个位置生成一个固定的位置编码 $p_i$，然后加到 token 的嵌入向量中：$x=x+p_i$。

代表方案：Sinusoidal 编码（固定）、BERT/GPT-2 的可学习编码。

### 2.2 相对位置编码

不为每个位置生成固定的位置编码，而是在 attention 计算阶段注入两个 token「相隔多远」的信息。

代表方案：RoPE（旋转位置编码）、ALiBi（线性偏置）。

### 2.3 对比

| 维度                  | 绝对位置编码              | 相对位置编码             |
| ------------------- | ------------------- | ------------------ |
| 信息注入点               | 输入层（加到 embedding 上） | Attention 计算过程中    |
| 位置信息的持久性            | 随着网络深度增加可能逐渐稀释      | 每层 Attention 都重新注入 |
| 外推能力                | 通常较弱                | 通常较强               |
| 长度泛化<br>（和外推能力一体两面） | 难以处理训练时未见的长度        | 相对容易扩展到更长序列        |

当前大模型几乎全部采用相对位置编码方案（以 RoPE 为主），原因见第 8.3 节。

## 3. Sinusoidal 位置编码

### 3.1 数学实现
固定三角函数，生成位置指纹加到词嵌入向量中。对于隐藏维度的索引对 $(2i,2i+1)$，共用同一个频率 $\omega_i=1/1000^{\frac{2i}{d}}$，分别使用正弦和余弦编码：
$$
\begin{aligned}
PE(pos,2i)&=\sin\left(\frac{pos}{1000^{2i/d}}\right) \\
PE(pos,2i+1)&=\cos\left(\frac{pos}{1000^{2i/d}}\right)
\end{aligned}
$$

### 3.2 相对位置：可能学到
Sinusoidal 编码有一个精巧的数学性质：**任意两个位置之间的偏移量，可以通过一个固定的线性变换来表示。** 模型因此有能力学到相对位置信息。
对于任意固定偏移量 $k$，存在一个只依赖 $k$ 的矩阵 $M_k$，使得：
$$
PE(pos + k) = M_k \cdot PE(pos)
$$
对于单个频率 $\omega_i$，考虑维度对 $(2i, 2i+1)$：
$$
\begin{aligned}
\begin{bmatrix} \sin(\omega_i(pos + k)) \\ \cos(\omega_i(pos + k)) \end{bmatrix} &=
\begin{bmatrix} \cos(\omega_i k) & \sin(\omega_i k) \\ -\sin(\omega_i k) & \cos(\omega_i k) \end{bmatrix}
\begin{bmatrix} \sin(\omega_i \cdot pos) \\ \cos(\omega_i \cdot pos) \end{bmatrix}
\end{aligned}
$$
右边的旋转矩阵只依赖偏移量 $k$ 和频率 $\omega_i$，与绝对位置 $pos$ 无关。对所有维度对组合起来，就得到了一个分块对角矩阵 $M_k$。

虽然 Sinusoidal 编码是一种「绝对位置编码」，但它内含的三角函数结构让模型有可能通过学习线性变换来提取相对位置信息。这种能力是间接的：模型需要自己从数据中学会利用这一性质，无法直接获得显式的相对位置信号。

### 3.3 优缺点分析

这套构造可以为不同位置生成独一无二的编码，而且相对位置之间只差一个固定的线性变换。但它有三个问题：

1. 位置信息稀释：位置信息加到词嵌入向量中，随着模型加深会逐渐被稀释。
2. 外推困难：Sinusoidal 编码理论上可以生成任意位置的编码，但模型对没有训练到的位置缺乏有效训练，泛化能力较弱。
3. 相对位置信息的间接性：相对位置虽然可能被学到，但不如显式注入高效、稳定。

## 4. 可学习位置编码

### 4.1 嵌入矩阵 → 可学习

类似 FFN，我们让模型自主学习每个位置应该给什么信息（FFN 中模型自主学习每个维度激活还是抑制）。训练得到一个位置嵌入矩阵 $L\in \mathbb{R}^{l_{max}\times d_{model}}$，根据位置查表并加到词嵌入向量中：$x = x + L[pos]$。

### 4.2 优缺点

用可学习的矩阵直接查表，操作简单，位置信息也由模型自主学习，在训练长度范围内效果很好。但有几个问题：

- 位置信息稀释：仍然发生在编码阶段，多层结构叠加后稀释问题依然存在。
- 外推困难：没有训练到的位置（长度）查表查不到。
- 硬性固定长度：训练时确定最大长度，更长的序列需要重新训练或做复杂插值。

## 5. RoPE 旋转位置编码

### 5.1 数学实现

RoPE（Rotary Position Embedding）**通过旋转 Q 和 K 向量来编码位置，使 Attention 分数天然包含相对位置信息。**
> 没有旋转 V，只改变信息被读取的方向，信息本身的值不用旋转。

#### 二维情形

二维旋转的数学表达是：
$$
\begin{bmatrix}
x' \\
y'
\end{bmatrix}
=
\begin{bmatrix}
\cos\theta & -\sin\theta \\
\sin\theta & \cos\theta
\end{bmatrix}
\begin{bmatrix}
x \\
y
\end{bmatrix}
$$
RoPE 的核心思路是：**用 token 的位置决定旋转角度。** 位置 0 的 token 不旋转，位置 1 的 token 旋转 $\theta$ 度，位置 2 的 token 旋转 $2\theta$ 度，以此类推。**位置 $m$ 的 token 旋转 $m\theta$ 度。**

现在考虑两个 token：位置 $m$ 的 Q 向量被旋转了 $m\theta$ 度，位置 $n$ 的 K 向量被旋转了 $n\theta$ 度。当我们计算它们的内积（Attention 分数）时，由于旋转是刚性变换，**两个向量的内积只取决于它们之间的角度差 $(m - n)\theta$**，与各自的绝对旋转角度无关。

下面严格推导。考虑二维情形，设 Q 和 K 分别是位置 $m$ 和 $n$ 的查询和键向量。RoPE 对它们施加位置相关的旋转：
$$
\tilde{q} = R(m\theta) \cdot q =
\begin{bmatrix}
\cos(m\theta) & -\sin(m\theta) \\
\sin(m\theta) & \cos(m\theta)
\end{bmatrix}
\begin{bmatrix}
q_0 \\
q_1
\end{bmatrix}
$$

$$
\tilde{k} = R(n\theta) \cdot k =
\begin{bmatrix}
\cos(n\theta) & -\sin(n\theta) \\
\sin(n\theta) & \cos(n\theta)
\end{bmatrix}
\begin{bmatrix}
k_0 \\
k_1
\end{bmatrix}
$$
计算旋转后 Q 和 K 的内积：
$$
\tilde{q}^T \tilde{k} = q^T R(m\theta)^T R(n\theta) k
$$
由于旋转矩阵的性质 $R(\alpha)^T = R(-\alpha)$，因此：
$$
R(m\theta)^T R(n\theta) = R(-m\theta) R(n\theta) = R((n - m)\theta)
$$
最终：
$$
\tilde{q}^T \tilde{k} = q^T R((n - m)\theta) k
$$
结果只依赖 $(n - m)$，即两个 token 的**相对位置差**，与绝对位置 $m$、$n$ 的具体值无关。

#### 高维情形

实际模型的头维度 $d_k$ 远大于 2（通常为 64 或 128）。RoPE 的推广方式很直接：**把 $d_k$ 维向量拆分成 $d_k/2$ 个二维子空间，在每个子空间内独立做旋转，但使用不同的频率。**
对于第 $i$ 个二维子空间（$0 \le i < d_k/2$），旋转角度为 $m \cdot \theta_i$，其中频率参数为：
$$
\theta_i = \frac{1}{10000^{2i/d_k}}
$$
注意这个频率参数与 Sinusoidal 编码中的完全一致。
将所有子空间的旋转矩阵拼在一起，形成一个分块对角矩阵：
$$
R_m =
\begin{bmatrix}
R(m\theta_0) & & & \\
& R(m\theta_1) & & \\
& & \ddots & \\
& & & R(m\theta_{d_k/2 - 1})
\end{bmatrix}
$$
其中每个 $R(m\theta_i)$ 是一个 $2 \times 2$ 的旋转矩阵。
RoPE 的完整操作就是：

$$
\tilde{q}_m = R_m \cdot q_m, \quad \tilde{k}_n = R_n \cdot k_n
$$

在高维情形下，证明同样简洁。旋转后 Q 和 K 的内积为：
$$
\tilde{q}_m^T \tilde{k}_n = q_m^T R_m^T R_n k_n
$$
由于 $R_m$ 是分块对角矩阵，$R_m^T$ 也是分块对角矩阵（每个块取转置），因此：
$$
R_m^T R_n =
\begin{bmatrix}
R(m\theta_0)^T R(n\theta_0) & & & \\
& \ddots & & \\
& & R(m\theta_{d_k/2 - 1})^T R(n\theta_{d_k/2 - 1})
\end{bmatrix}
$$

每个对角块为：
$$
R(m\theta_i)^T R(n\theta_i) = R(-m\theta_i) R(n\theta_i) = R((n - m)\theta_i)
$$
所以：
$$
R_m^T R_n = R_{n-m}
$$
最终结果：
$$
\tilde{q}_m^T \tilde{k}_n = q_m^T R_{n-m} k_n = f(q_m, k_n, n - m)
$$

内积只依赖向量本身和相对位置差 $n - m$，与绝对位置无关。证毕。

#### 高效实现：避免显式构造旋转矩阵

在实际工程中，我们不会真的构造一个 $d_k \times d_k$ 的分块对角矩阵再做矩阵乘法。二维旋转可以用逐元素乘法和加法高效实现：
$$
\tilde{q}_{2i} = q_{2i} \cos(m\theta_i) - q_{2i+1} \sin(m\theta_i)
$$

$$
\tilde{q}_{2i+1} = q_{2i} \sin(m\theta_i) + q_{2i+1} \cos(m\theta_i)
$$

### 5.2 RoPE 与 Sinusoidal 的联系和区别

RoPE 和 Sinusoidal 编码之间有直接的联系，但工作方式不同。
**联系**：
- 两者使用**完全相同的频率参数** θi=1/100002i/dθi=1/100002i/d
- 两者都利用了三角函数的周期性和和角公式
- Sinusoidal 编码中相对位置的线性变换性质（第 3.2 节）可以看作一种旋转操作，RoPE 则把这一性质显式化了
**区别**：

| 维度      | Sinusoidal         | RoPE                |
| ------- | ------------------ | ------------------- |
| 注入方式    | 加到词嵌入上             | 旋转 Q 和 K 向量         |
| 注入位置    | 输入层（只注入一次）         | 每层 Attention（每层都注入） |
| 编码类型    | 绝对位置编码             | 相对位置编码              |
| 对 V 的影响 | 间接影响（V 的输入包含了位置信息） | 不影响（只旋转 Q 和 K）      |
| 深层保持性   | 位置信号可能在深层网络中衰减     | 每层重新注入，不会衰减         |
| 外推能力    | 较弱                 | 较强（配合插值方法）          |

### 5.3 朴素循环 → 向量化 → 工程实践

> 逐元素相乘的写法和工程思维，第一遍学时不容易跟上。

```python
# 对于每一个token的q为例
pos = torch.arange(seq_len).float()
for i in range(head_dim//2):
	x = q[:,2*i]
	y = q[:,2*i+1]
	freq = 1.0 / 10000**(2*i/head_dim) * pos
	x = x*torch.cos(freq)-y*torch.sin(freq)
	y = x*torch.cos(freq)+y*torch.sin(freq)

```
## 6. ALiBi：带距离惩罚的注意力

### 6.1 核心思想

ALiBi 完全不修改 Q 和 K 向量。它先算出 Attention 分数，再直接加上一个与相对距离成正比的负偏置：
$$
\text{Attention}(Q, K, V) = \text{softmax}\left( \frac{QK^T}{\sqrt{d_k}} + m \cdot \text{Bias} \right) V
$$
其中 Bias 矩阵的元素为：
$$
\text{Bias}[i][j] = -|i - j|
$$
$m$ 是一个头相关的标量斜率，不同头使用不同的 $m$ 值（通常按几何级数设置，如 $1/2, 1/4, 1/8, \dots$）。

ALiBi 相当于给 Attention 分数加了一个「距离惩罚」：两个 token 距离越远，分数被减去的值越大，注意力因此偏向近处的 token。不同的头有不同的衰减速率，有些头几乎只关注紧邻的 token（大斜率），有些头仍能关注远处的 token（小斜率）。

### 6.2 优势与局限

**优势：**

- 实现极其简单，只需要在 Attention 分数上做一次加法
- 不引入可学习参数
- 外推能力强：论文证明在 1024 长度上训练的模型可以在推理时外推到 2048 甚至更长
- 计算几乎零开销（只用 $O(N^2)$ 的加法）

**局限：**

- 位置信息的**表达能力**较为有限（只有线性距离衰减这一种模式）
- 在非常长的上下文中，线性惩罚可能过度压制远距离 token 的注意力
- 在实际的大模型竞赛中，ALiBi 的采用率远低于 RoPE

## 7. 长上下文扩展技术

### 7.1 为什么相对位置编码仍未解决外推？

$$
\theta_i=\frac{pos}{10000^{2i/d}}
$$
回到 base 的定义：$\theta_i = base^{-2i/d}$。

- 高频（维度索引 $i$ 小 → $\theta_i$ 大 → 位置前进几步就转满一圈 $2\pi$）：维护近邻 token 的位置关系，但相对位置一远就会「绕回」，对远距离的区分力弱。
- 低频（维度索引 $i$ 大 → $\theta_i$ 小 → 位置前进很多步才转满一圈 $2\pi$）：维护远距离 token 的位置关系，近距离 token 的变化角度很小，对近距离的区分能力弱。

原因在训练长度。训练时假定最大长度是 4095，则最大的 $m$ 为 4095。维度索引小的地方已经转了很大的角度、很多圈，再增加转数影响较小；索引大的地方转得少，增加乘数会进入「未知领域」。

### 7.2 朴素想法：位置插值（position interpolation）

**位置插值：** 将位置索引按比例缩小，使新的最大位置对应训练时的最大位置。如果新最大位置是 128，训练最大位置是 64，就要乘以缩放因子 $1/2$；同一个位置 $m$ 的旋转角度从 $m\theta_i$ 变为 $\frac{m}{2}\theta_i$。

这种做法的问题在于：低维度索引部分对转数增加的容忍度比高维度索引部分更强，但位置插值给所有维度统一的缩放因子，没有照顾到这种差异。

### 7.3 NTK-aware Scaling（Neural Tangent Kernel-aware Scaling）

**NTK-aware scaling：** 对不同频率维度赋予不同的缩放策略。关键是给不同频率维度索引分配不同的缩放因子。取 $base^{'}=base\times s^{d/(d-2))}$，然后对于维度索引 $i$ 的新旧频率：
$$
\frac{\theta_i^{'}}{\theta_i}=\frac{base^{'-2i/d}}{base^{-2i/d}}=\frac{base^{-2i/d}\times s^{d/(d-2)\times2i/d}}{base^{-2i/d}}=s^{2i/(d-2)}
$$

- 这个缩放因子随着 $i$ 单调递增。
	- 高频时：极端取 $i=0$，缩放因子是 $s^0=1$，不动。
	- 低频时：极端取 $i=\frac{d}{2} -1$（默认 $d$ 是 2 的倍数，且从零编号，每两个索引为一组），缩放因子是 $s^{(d-1)/(d-2)}=\frac{1}{s}$。

> 这里实际上缩小了低频区域的频率，以覆盖更长的上下文。要保持远距离的位置关系，比如 $m=1$ 和 $m=1000000$，至少要求频率满足 1000000 步才转一圈，也就是波长要更大、频率要更低。

- 这样就实现了高低频不同步的缩放：高频索引继续维护近邻 token 的位置关系，低频索引通过缩放频率覆盖更大的位置范围。

### 7.4 YaRN 的改进

YaRN（Yet another RoPE extensioN）在 NTK-aware Scaling 的基础上做了两项关键改进：

**第一项改进：分段策略。** YaRN 根据频率的高低将维度分为三组，对每组采用不同的处理：

- **高频维度**（波长短于原始训练长度 / 某个阈值）：不做任何缩放，完全保留原始 RoPE 的行为。
- **低频维度**（波长长于训练长度 × 某个阈值）：做完整的线性插值缩放。
- **中间频段**：在「不缩放」和「完整缩放」之间做平滑过渡。

这种分段策略比 NTK-aware 的连续调整更精细，能在保留近距离分辨率的同时更好地扩展远距离能力。

**第二项改进：注意力分布的温度修正。** 扩展上下文长度后，Attention 分数的分布会发生变化（因为求和的 token 数量增多了），YaRN 引入一个与扩展比例相关的温度系数来校正这种分布偏移。

### 7.5 动态 NTK

上述方法在推理前需要预先确定目标长度并设置缩放参数。实际部署中，输入长度是动态变化的：有些请求很短，有些很长。为短请求也施加长度扩展的缩放没有必要，甚至会损害性能。

**动态 NTK** 根据当前实际序列长度动态调整 base 参数。推理过程中，当前序列长度 LcurrentLcurrent 会随着 token 的生成不断增长。如果 $L_{current}\le L_{train}$，使用原始的 base 参数（不做缩放）；如果 $L_{current}>L_{train}$，则根据 $L_{current}/L_{train}$ 的比值动态计算新的 base 值。

这种方法的优势在于：

- 短序列不受影响，保持原始精度
- 长序列自动获得合适的缩放
- 无需预先知道最大长度

## 8. AI Infra 工程实践

位置编码的选择和实现对 AI Infra 工程有直接影响。

### 8.1 RoPE 在 CUDA kernel 中的融合

> kernel 融合是贯穿始终的事：把几步操作合并到一个 kernel 中，降低 kernel launch 的耗时，减少 HBM 数据搬运（对 memory-bound 阶段尤其重要）。

RoPE 的核心操作是对 Q 和 K 向量做逐元素的乘加运算。从计算量看，这个操作非常轻量 $O(N⋅d)$，远小于 Attention 中的矩阵乘法 $（O(N^2⋅d)$。但如果把它作为一个独立的 CUDA kernel 执行，kernel launch 的开销和额外的显存读写就会成为瓶颈。

因此，在高性能推理引擎中，RoPE 通常被**融合（fuse）**到 Attention kernel 的前端：

1. **与 QKV 投影融合**：在完成 QKV 的线性投影后，直接在同一个 kernel 中对 Q 和 K 施加旋转，避免将中间结果写回 HBM 再读取
2. **与 FlashAttention 融合**：在 FlashAttention 的分块（tiling）循环中，当每个 block 的 Q、K 数据加载到 SRAM 后，原地施加 RoPE 旋转，然后立即做 Attention 计算

融合后的好处：

- 减少一次 kernel launch（节省约 5-10 微秒的启动开销，在 Decode 阶段每步只处理 1 个 token 时这个开销占比不小）
- 减少一次 HBM 读写往返（对于 Memory Bound 的 Decode 阶段尤其重要）

此外，RoPE 的三角函数值 $cos⁡(mθ_i)$ 和 $sin⁡(mθ_i)$ 通常会预计算并缓存为查找表，存放在 GPU 的常量内存或共享内存中，避免每次推理重复计算。

### 8.2 长上下文对 KV Cache 的影响

位置编码的外推能力直接决定了模型能支持多长的上下文，而上下文长度的增加对 KV Cache 管理产生了巨大压力。
以 LLaMA-2-7B 为例：

|上下文长度|单请求 KV Cache（FP16）|batch=16 总计|
|---|---|---|
|4K|2 GB|32 GB|
|32K|16 GB|256 GB|
|128K|64 GB|1024 GB|

> 一个头中的 K、V 是 (B, num_heads, N, head_dim)，fp16 是 2B，则 $4K\times 32 \times 128 \times 2\times 2B \times 32 / 1024 /1024 = 2GB$
> 记住，还有层数 32，缓存上一轮得到的所有 KV。
> B\* N\* head_dim\* num_KVheads\* 2\* {数据类型字节}\* {模型结构堆叠的层数}=KVcache

当上下文长度从 4K 扩展到 128K 时，KV Cache 的显存需求增长了 32 倍。

- **单请求即可能耗尽显存**：128K 上下文的单请求 KV Cache（64 GB）就已经接近一张 A100 的全部容量
- **并发能力急剧下降**：即使有足够的显存，能同时处理的请求数也会大幅减少
- **PagedAttention 的重要性凸显**：在长上下文场景中，KV Cache 的动态增长和碎片化问题更加严重，需要更精细的内存管理

因此，位置编码的长上下文扩展技术（第 7.2 至 7.5 节）既是模型能力问题，也是系统层面的挑战。工程上需要同时解决：

1. **位置编码层面**：选择合适的外推/插值方案（如 YaRN、动态 NTK），确保模型在长序列上的注意力质量
2. **KV Cache 管理层面**：采用分页管理、KV Cache 量化（如 FP8/INT4）、KV Cache 淘汰策略等技术控制显存开销
3. **计算层面**：FlashAttention 的 $O(N)$ 显存特性在长上下文场景中至关重要（否则 $O(N^2)$ 的注意力矩阵将消耗天量显存）

### 8.3 不同位置编码方案的工程对比

| 方案         | 推理额外计算          | 额外参数          | 实现复杂度 | 长上下文友好度 |
| ---------- | --------------- | ------------- | ----- | ------- |
| Sinusoidal | 预计算查表 + 向量加法    | 无             | 低     | 差       |
| Learned PE | 嵌入查表 + 向量加法     | Lmax×dLmax×d | 极低    | 差（硬性上限） |
| RoPE       | 逐元素旋转（可融合）      | 无             | 中等    | 好（配合插值） |
| ALiBi      | Attention 分数加偏置 | 无             | 低     | 好（天然外推） |

从工程实践看，RoPE 成为事实标准靠的是工程友好性：不引入额外参数，对模型并行无影响，也能无缝融合进现有 Attention kernel。长上下文扩展方案同样成熟。

### 自我检验清单

可以用下面几条检验自己是否真正理解了位置编码：

- 能解释为什么原始 Self-Attention 无法区分词序，并能简述排列等变性的数学含义
- 能区分绝对位置编码和相对位置编码的设计思路差异，说出各自的代表方案
- 能默写 Sinusoidal 编码的公式，并解释不同频率维度各自的作用
- 能用三角函数和角公式说明为什么 Sinusoidal 编码中的相对位置可以通过线性变换得到
- 能说清 RoPE 的核心操作（二维旋转），并推导为什么旋转后的内积只依赖相对位置差
- 能写出 RoPE 的逐元素实现代码，解释 cos/sin 预计算的作用
- 能说清 RoPE、Sinusoidal、Learned PE、ALiBi 四种方案的核心区别
- 能解释 NTK-aware Scaling 为什么比均匀位置插值更好（高频保留，低频拉伸）
- 能估算长上下文扩展对 KV Cache 显存的影响，并说出至少两种应对策略
- 能解释为什么 RoPE 通常会被融合到 Attention kernel 中执行
