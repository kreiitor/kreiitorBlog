---
title: "前馈网络 FFN"
description: "Transformer 中 FFN 的结构、参数量与计算特征。"
pubDate: 2026-10-26
tags:
  - "Transformer"
  - "FFN"
  - "学习笔记"
category: course
series: transformer
order: 4
cover: /covers/series-deep-learning.svg
---

## 1. FFN的“先升维再降维”

ffn在事实上，就是用一个升维矩阵将输入升维，然后再高维空间内进行非线性激活，随后用降维矩阵将输出进行降维。

标准的ffn的$d_{ff}$是$d_{model}$的4倍，激活函数选择ReLU或者GeLU。前者有神经元死亡的问题，还有零点处不光滑的问题。

为什么先升维再降维：
- 高维特征更容易线性可分（类似SVM的核方法），模型更容易区分特征
- 高维中的激活函数更灵活，可以选择更多的通道（特征）去抑制或者激活，模型表达能力更强
- 降维是信息的压缩，迫使模型保留重要的信息，让模型“理解”什么更重要

## 2. 标准FFN的Pytorch的实现

```python
import torch
from torch import nn
from torch.nn import functional as F

class standardFFN(nn.Module):
	def __init__(self, d_model, d_ff, activation='relu'):
		super().__init__()
		# 超参数
		self.d_model = d_model
		self.d_ff = d_ff
		# 可学习参数
		self.W_up = nn.Linear(d_model, d_ff)
		self.W_down = nn.Linear(d_ff, d_model)
		# 结构
		if activation == 'relu':
			self.activation = nn.ReLU()
		elif activation == 'gelu':
			self.activation = nn.GELU()
		else:
			raise ValueError(f'不支持激活函数类型：{activation}')

	def forward(self, x):
		# 升维
		h = self.W_up(x)
		# 激活
		h = self.activation(h)
		# 降维
		out = self.W_down(h)
		return out
```

## 3. 激活函数详解

### 3.1 ReLU

$$
ReLU(x) = \max(0, x)
$$
即：大于零的值通过，小于零的值舍弃

优点：
- 计算简单，硬件友好：只需要一个比较操作
- 正半轴的梯度恒为1:梯度消失问题有所缓解
- 负半轴直接置0：引入稀疏性，有利于特征的稀疏表示
缺点：
最关键的缺点就是：**神经元死亡**
简单来讲，当一个神经元的输入刚好落在负数区间，经过ReLU，输出为0，梯度也为0。意味着梯度更新之后仍然为负数区间，就这样不参与后面的计算。神经元“死亡”，对后续没有贡献。
当学习率比较大时，随机到了一个坏区域，很多神经元落入负半轴，导致很多神经元死亡，模型有效容量缩水。
并且这个激活函数在0处不光滑，给负半轴加一个斜率很小的线性项只能一定程度缓解神经元死亡，但是零点处的光滑可微性质没有得到解决。

### 3.2 GELU

其中$\mu=0,\sigma=1$
$$
GELU(x)=x\Phi(x)=
\frac{x}{2}
\left[
1+\operatorname{erf}\left(\frac{x-\mu}{\sigma\sqrt{2}}\right)
\right]
$$
但是在实际计算中，常常使用更硬件友好的tanh来近似计算：
$$
\operatorname{GELU}(x)
\approx
\frac{x}{2}
\left[
1+
\tanh\left(
\sqrt{\frac{2}{\pi}}
\left(
x+0.044715x^3
\right)
\right)
\right]
$$
因为引入了标准正态分布的累积分布函数，所以可以看成是一个概率化的门控。以概率$\Phi(x)$保留x，以概率$1-\Phi(x)$置0的期望就是GELU的计算。
把神经元的输入看成标准正态分布的话（输入由来自不同方向的值组成，多个随机变量相加的分布近似正态分布），神经元的输入值越大，就越有可能有意义，应该被保留。而$\Phi(x)$刚好体现了这种递增的性质。

优点：
- 处处光滑可微
- 负半轴仍有较小的值产出，不会神经元死亡
- **概率化门控，信息保留更精细**

缺点：
计算量较大，但是相比GEMM可以忽略不计

### 3.3 Swish

$$
Swish(x)=x\sigma(\beta x)=\frac{x}{1+\exp(-\beta x)}
$$
其中$\beta$是一个可学习或固定参数，当其值为1时，记为SiLU

简单来讲，这个激活函数构建了一种自门控，也即是说，sigmoid函数给出了0-1取值的门控，乘以x融入了输入值的信息。用输入值自身来控制信息通过量

优点：
- 光滑可微

### 3.4 对比总结

| 特性    | ReLU           | GELU        | Swish/SiLU       |
| ----- | -------------- | ----------- | ---------------- |
| 公式    | max⁡(0,x)      | x⋅Φ(x)      | x⋅σ(x)           |
| 输出范围  | [0,+∞)         | ≈[−0.17,+∞) | ≈[−0.278,+∞)     |
| 零点可微  | 否              | 是           | 是                |
| 单调性   | 是              | 否（近似单调）     | 否                |
| 负值输出  | 无              | 极小          | 小                |
| 神经元死亡 | 有              | 无           | 无                |
| 计算成本  | 最低             | 中           | 中                |
| 典型应用  | 原始 Transformer | BERT, GPT-2 | LLaMA (SwiGLU 中) |

## 4. SwiGLU——现代大模型的主流选择

### 4.1 GLU的提出

以上的激活函数都是我们选择一个类似超参数的形式进行门控，即使有可学习参数，也只类似$\beta$那样。所以想提出一种，有模型学习，哪些输入应该保留，哪些应该舍弃。即，增加一个可学习矩阵$W_{gate}$

$$
GLU(x) = (xW_{up})\otimes \sigma(xW_{gate})
$$
其中$\sigma$是sigmoid函数，$\otimes$是逐元素相乘。
用可学习的矩阵乘以x（引入输入本身的信息）经过sigmoid得到0-1的门控值，门控信号强的被激活，信号弱的被抑制，实现了模型对门控行为的控制

### 4.2 SwiGLU的优化

$$
SwiGLU(x)= (xW_{up})\otimes Swish(xW_{gate})
$$
SwiGLU只是把sigmoid函数替换成了原来的Swish激活函数，在实验层面上验证了替换的有限性，就逐渐变成主流。

优点：
- 模型自主学习门控信号强度，不再像之前的激活函数，给予统一的门控，这里让模型对每个维度门控信号的强度都可以自主决策，增强模型的学习能力。
- 原来梯度只有内容路径，现在增加了门控路径，参数的更新信号更加丰富。

### 4.3 SwiGLU的Pytorch实现

```python
import torch
from torch import nn
from torch.nn import functional as F

class SwiFFN(nn.Module):
	def __init__(self, d_model, d_ff):
		super().__init__()
		# 超参数
		self.d_model = d_model
		self.d_ff = d_ff
		# 可学习参数
		self.W_up = nn.Linear(d_model, d_ff)
		self.W_down = nn.Linear(d_ff, d_model)
		self.W_gate = nn.Linear(d_model, d_ff)
		# 结构
		self.activation = nn.SiLU()

	def forward(self, x):
		# 升维并计算门控
		h = self.activation(self.W_gate(x)) * self.W_up(x)
		# 降维
		out = self.W_down(h)
		return out
```

## 5. 参数量分析和对比

FFN 的参数量在整个 Transformer Block 中占据主导地位。准确计算参数量是显存规划和并行策略设计的基础。

### 5.1 标准 FFN vs SwiGLU FFN 参数量对比

以 dmodel=4096 为例，分别计算两种 FFN 结构的参数量。

**标准 FFN（dff=4×dmodel=16384）**

| 参数矩阵   | 形状            | 参数量                    |
| ------ | ------------- | ---------------------- |
| Wup   | (4096, 16384) | 67,108,864             |
| Wdown  | (16384, 4096) | 67,108,864             |
| **合计** |               | **134,217,728 (134M)** |

**SwiGLU FFN（dff=8/3×dmodel≈10922，实际取 11008）**

| 参数矩阵   | 形状            | 参数量                    |
| ------ | ------------- | ---------------------- |
| Wgate  | (4096, 11008) | 45,088,768             |
| Wup   | (4096, 11008) | 45,088,768             |
| Wdown  | (11008, 4096) | 45,088,768             |
| **合计** |               | **135,266,304 (135M)** |

### 5.2 对比分析

| 对比维度             | 标准 FFN      | SwiGLU FFN         |
| ---------------- | ----------- | ------------------ |
| 权重矩阵数量           | 2           | 3                  |
| 中间维度             | 4×dmodel   | 8/3×dmodel        |
| 总参数量             | 8×dmodel^2 | 3×dmodel×8/3dmodel |
| 以 dmodel=4096 计算 | 134M        | 135M               |
| GEMM 次数（前向）      | 2           | 3                  |
| 激活函数             | 全局施加        | 门控选择性施加            |

关键发现：**两种结构的总参数量几乎相同**（8×dmodel^2），但 SwiGLU 通过门控机制实现了更好的效果。代价是前向传播需要 3 次 GEMM 而非 2 次，计算量略有增加。

### 5.3 与 Attention 模块的参数量对比

| 模块                           | 参数量             | 占 Block 比例 |
| ---------------------------- | --------------- | ---------- |
| Self-Attention (WQ,WK,WV,WO) | 4×dmodel^2=67M  | ~33%       |
| FFN（标准或 SwiGLU）              | 8×dmodel^2=135M | ~67%       |
| LayerNorm ×2                 | 4×dmodel=16K    | <0.01%     |
| **单 Block 合计**               |                 | **~201M**  |

FFN 的参数量约为 Attention 的 2 倍，占单个 Block 参数总量的约 2/3。这意味着任何针对 FFN 的优化（并行切分、量化、专家化）都将对整体效率产生显著影响。

## 6. 为什么SwiGLU使用近似8/3 d\_model作为高维

### 6.1 标准FFN为什么使用4x

- 原始transformer是4x，约定俗成了
- 后面实验也表示，4x左右是最佳区间，太大边际效益递减，太小非线性激活效果不好，模型表达能力一般

### 6.2 SwiGLU为什么使用8/3

- SwiGLU引入了新的可学习矩阵，为了保证引入新的门控矩阵总参数量不变，则需要8/3作为系数

此外，在工程上，先对8/3的d_model取整，然后再向上取整到128或者256的倍数。（硬件下,tensor core偏好8的倍数）

## 7. 张量并行——切分FFN

FFN参数占比很大，如何优化对模型效率影响很大。

### 7.1 megatron-LM切分：矩阵分块

核心思想是矩阵分块乘法：
$$
h W_{\text{down}}
=
\begin{bmatrix} h_0 & h_1 \end{bmatrix}
\begin{bmatrix} W_{\text{down},0} \\ W_{\text{down},1} \end{bmatrix}
=
h_0 W_{\text{down},0} + h_1 W_{\text{down},1}
$$
也就是说$W_{gate},W_{up}$按列切分，$W_{down}$按行切分，然后分别在不同的GPU中计算，然后最后AllReduce进行综合。

无论是标准FFN还是SwiGLU的FFN，切分方式都一致，然后得到两份在不同的GPU分别正常计算，最后得到的结果相加即可。

### 7.2 工程视角

- 这样切分要求d_ff可以被2整除，这也是d_ff取整到128或者256倍数的原因之一
- 这样切分计算之后，只用在计算完成后进行一次AllReduce。attention阶段，也是最后进行一次AllReduce。一个transformer block只用两次AllReduce。

## 8. MoE：将 FFN 拆分为多个专家

### 8.1 核心思想

混合专家模型（Mixture of Experts, MoE）是一种扩大模型容量而不等比例增加计算量的技术，其核心改造对象正是 FFN 层。

基本思路非常直观：与其使用一个巨大的 FFN，不如将其拆分为多个较小的”专家”（Expert），每个专家都是一个独立的 FFN。对于每个输入 token，只激活其中少数几个专家进行计算，其余专家保持”休眠”。

例如，一个 MoE 层可能包含 64 个专家 FFN，但每个 token 只选择其中 2 个专家（Top-2）进行前向计算。这意味着：

- **模型总参数量** = 64 个专家的参数量之和（很大）
- **每个 token 的计算量** = 2 个专家的计算量（很小）

这就实现了”参数量大但计算量小”的目标——模型有足够的容量存储知识，但推理和训练时的计算成本可控。

### 8.2 路由机制（Router）

MoE 的关键组件是**路由器**（Router / Gate），它决定每个 token 应该被发送到哪些专家。

最常见的路由方式是 Top-K 路由：
g(x)=softmax(xWr)，TopK(g(x))→选出概率最大的 K 个专家

其中 Wr 是路由器的权重矩阵，形状为 (d_model, n_experts)。路由器将每个 token 的表示向量映射到一个 n_experts 维的概率分布，概率最大的 K 个专家被选中。

最终输出是被选中专家输出的加权和：

$$
MoE(x)=\sum_{i\in TopK}g_i(x)⋅Expert_i(x)
$$

权重 $g_i(x)$ 经过 re-normalize（重归一化为和为 1），确保输出的尺度与单个 FFN 一致。

### 8.3 负载均衡

MoE 训练中的一个棘手问题是**负载不均衡**——路由器可能倾向于把大部分 token 都发送给少数几个”明星专家”，导致其他专家得不到训练、逐渐退化，进而加剧不均衡，形成恶性循环。

常用的缓解策略包括：

**辅助损失（Auxiliary Loss / Load Balancing Loss）**

在训练目标中加入一项额外的损失函数，惩罚负载不均匀的情况。常见形式是：

$$
L_{aux}=α⋅n_{experts}⋅\sum_{i=1}^{n_{experts}}f_i \cdot p_i
$$

其中 fi 是专家 i 实际接收的 token 比例，pi 是路由器分配给专家 i 的平均概率，α 是平衡系数。当所有专家的负载均匀时，该损失取最小值。

**容量因子（Capacity Factor）**

为每个专家设定一个最大接收 token 数。超出容量的 token 会被丢弃（送入残差路径）或重新路由到其他专家。这从硬性约束的角度防止单个专家过载。

**Expert Choice 路由**

与传统的 token-choose-expert（由 token 选择专家）不同，Expert Choice 让每个专家主动选择要处理的 top-k 个 token。这天然保证每个专家处理相同数量的 token，从根本上解决负载不均衡的问题。

### 8.4 AI Infra 关联：Expert Parallelism

MoE 引入了一种新的并行维度——**专家并行（Expert Parallelism, EP）**。由于每个专家是独立的 FFN，可以将不同的专家放置在不同的 GPU 上。

这带来了独特的通信模式：传统的张量并行使用 AllReduce（所有卡都参与），而 MoE 的专家并行使用 **All-to-All** 通信——每个 GPU 需要把分配给其他 GPU 上专家的 token 发送过去，同时接收分配给本地专家的 token。这种通信模式对网络拓扑和通信库的要求与 AllReduce 截然不同，是 MoE 系统设计中的核心挑战。

Mixtral 8x7B、DeepSeek-V2 等模型的成功部署，背后都需要精心设计的 EP 调度策略和通信优化。

## 9. CUDA Kernel 融合在 FFN 中的应用

### 9.1 为什么需要 Kernel 融合

GPU 执行计算的基本单位是 kernel——每次从 CPU 调度一个 kernel 到 GPU 上执行。每次 kernel 启动（launch）都有固定的调度开销（通常几微秒），而且每个独立的 kernel 都需要从 HBM（高带宽显存）读取输入、写回输出。

FFN 的前向传播包含多个步骤：GEMM、激活函数、逐元素乘法等。如果每个步骤都作为独立的 kernel 执行，中间结果就需要反复在 HBM 和寄存器/SRAM 之间搬运。对于 SwiGLU FFN，一次前向传播的逐元素操作包括：

1. Swish 激活：gate=x_gate⋅σ(x_gate)（涉及 sigmoid 和逐元素乘法）
2. 门控乘法：hidden=gate⊗up

如果分开执行，gate 向量需要写入 HBM 后再读回来做乘法。融合后，这些操作可以在一个 kernel 内完成——gate 的中间结果驻留在寄存器中，直接与 up 相乘，完全不经过 HBM。

### 9.2 FFN 中的典型融合场景

**场景一：Swish 激活 + 门控乘法融合**

将 `Swish(gate) * up` 融合为一个 kernel。两个 (N,dff) 的输入产生一个 (N,dff) 的输出，HBM 读写量从 4 次降为 3 次（读 2 次 + 写 1 次，省去了 Swish 中间结果的写入和读回）。

**场景二：GEMM + 激活融合（Epilogue Fusion）**

在 GEMM kernel 的”收尾阶段”（epilogue）中嵌入激活函数。以 Wgate 的 GEMM 为例，标准流程是：

1. kernel A: xgate=xWgate，写入 HBM
2. kernel B: gate=Swish(xgate)，从 HBM 读出 xgate 并写回 gate

融合后，在 GEMM kernel 的最后一步（将结果写回 HBM 之前），直接在寄存器中对每个输出元素施加 Swish，然后写入 HBM。这样只需一个 kernel 和一次 HBM 写入。
cuBLAS 和 CUTLASS 等 GEMM 库都提供了 epilogue fusion 的接口，支持在 GEMM 输出后拼接自定义的逐元素操作。

**场景三：WgateWgate 和 WupWup 的 GEMM 合并**

Wgate 和 Wup 的输入都是同一个 x，可以将两个矩阵沿列方向拼接为一个 (dmodel,2×dff) 的大矩阵，执行一次大 GEMM，然后将输出切分为 gate 和 up 两部分。这将两次 GEMM 合并为一次，减少 kernel launch 开销，同时大 GEMM 的 GPU 利用率通常优于两个小 GEMM。

```python
# 分开执行（2 次 GEMM launch）：
gate = x @ W_gate    # (N, d_model) x (d_model, d_ff) = (N, d_ff)
up   = x @ W_up      # (N, d_model) x (d_model, d_ff) = (N, d_ff)

# 合并执行（1 次 GEMM launch）：
W_fused = concat(W_gate, W_up, dim=1)  # (d_model, 2*d_ff)
fused_out = x @ W_fused                 # (N, 2*d_ff)
gate, up = split(fused_out, d_ff, dim=1)
```

**场景四：偏置加法 + 残差加法 + LayerNorm 融合**

FFN 的输出通常要经过残差加法和后续的 LayerNorm。将这些逐元素操作融合为一个 kernel，可以将 FFN 输出、残差输入和 LayerNorm 参数一次性读入，在片上完成加法和归一化后写回，避免多次 HBM 往返。

### 9.3 性能影响

在实际大模型推理中，FFN 的 kernel 融合带来的加速效果因场景而异：

- **Decode 阶段**（每次只处理 1 个 token）：GEMM 退化为矩阵-向量乘法，计算量小，kernel launch 和 HBM 带宽是主要瓶颈，融合收益显著（可达 20-40% 的加速）
- **Prefill 阶段**（处理整段 prompt）：GEMM 的计算量占主导，逐元素操作的 HBM 开销占比较小，融合收益相对有限（通常 5-15%）
