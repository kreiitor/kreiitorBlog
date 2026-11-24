---
title: "Self-Attention 机制"
description: "Q/K/V、缩放点积注意力与多头注意力的计算过程。"
pubDate: 2026-10-26
tags:
  - "Transformer"
  - "注意力机制"
category: course
series: transformer
order: 3
cover: /covers/series-deep-learning.svg
---

## 1. Attention 的优势

- 并行性：只用计算矩阵乘法，天生适合并行；
- 长距离依赖：RNN 后一步依赖前一步，序列长了信号衰减明显；Self-Attention 直接计算任意两个位置之间的关联，没有顺序传递造成的长距离衰减。

## 2. Q、K、V 的直观理解

### 2.1 图书馆检索的类比

想象你走进一座图书馆，你脑子里有一个模糊的需求：「我想了解关于并行计算的内容」。这个需求就是你的 **Query**。

图书馆里每一本书的书脊上都贴着标签：「操作系统」「计算机网络」「并行计算导论」「数据结构」等。这些标签就是每本书的 **Key**。

你拿着自己的 Query，去和每本书的 Key 做比对。「并行计算导论」这个 Key 和你的 Query 高度匹配，分数最高；「操作系统」有一些相关性，分数中等；「数据结构」和你的需求关系不大，分数很低。

确定了匹配分数之后，被拿走的是每本书的**实际内容**（Value），按匹配分数加权汇总；书脊标签（Key）只参与匹配。「并行计算导论」的内容占大比重，「操作系统」占一点，「数据结构」几乎不占。最终得到一份以并行计算为主、兼顾一点操作系统知识的综合信息。

### 2.2 三元组的形式化定义

在 Self-Attention 中，给定输入序列 $X$（形状为 $(N,d_{model})$），三个线性变换将 $X$ 映射到不同的空间：

- **$Q=X\cdot W_Q$**：每个 token 生成自己的「查询向量」——「我需要什么信息」
- **$K=X\cdot W_K$**：每个 token 生成自己的「索引向量」——「我能提供什么信息的线索」
- **$V=X\cdot W_V$**：每个 token 生成自己的「内容向量」——「我实际携带的信息」

Q、K、V 从同一个 $X$ 做三次不同的线性变换，而非直接复用 $X$，原因在于**解耦不同的角色**。一个 token「需要什么」和它「能提供什么」往往不同。比如一个句子里，动词可能需要关注它的主语和宾语（Query 的方向），但它被别人关注时，提供的是动作语义（Key/Value 的方向）。三个独立的投影矩阵让模型有自由度学习这些不同的映射。

模型在捕捉句法结构与上下文关联时，三个投影矩阵分别承担不同方向的变换。

## 3. Scaled Dot-Product Attention 详解

注意力计算公式：
$$
\operatorname{Attention} = \operatorname{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V
$$

### 3.1 计算三个投影并拆头
```python
# x -> (N, d_model)
Q = X @ W_Q
K = X @ W_K
V = X @ W_V

def split(x: torch.Tensor, num_heads: int, size_heads: int):
	x = x.view(-1, num_heads, size_heads)
	x = x.transpose(0, 1)
	return x

Q = split(Q, num_heads, size_heads)
K = split(K, num_heads, size_heads)
V = split(V, num_heads, size_heads)
```
### 3.2 计算注意力矩阵
```python
# Q, K -> (num_heads, N, size_heads)
attn_scores = Q @ K.transpose(-1, -2) / math.sqrt(size_heads)

# 因果或者 padding 掩码在这个环节加上。假定 True 表示被掩码，False 表示不被掩码
attn_scores += mask * torch.finfo(attn_scores.dtype).min
# 或使用 masked_fill：attn_scores = attn_scores.masked_fill(mask.bool(), float('-inf'))
```
### 3.3 计算注意力权重
```python
attn_probs = torch.softmax(attn_scores,dim=-1)
```
### 3.4 计算注意力
```python
#按权重综合上下文信息
attn = attn_probs @ V
```
### 3.5 进行 $W_O$ 投影，综合多头信息
```python
#合并头 attn->(num_heads, N, size_heads)
attn = attn.transpose(0,1).contiguous().view(-1,d_model)

state = attn @ W_O.T + bias
```

## 4. PyTorch 实现

下面实现单头和多头注意力，假定输入 `x` 的形状为 `(B, N, d_model)`。

- 在实现上，`__init__` 定义结构、超参数和可训练参数，`forward` 定义输入张量的动态计算过程；
- 4.1 与 4.2 先实现单头，再用 `nn.ModuleList` 拼接成多头，4.3 再给出用大矩阵统一投影后 reshape 拆头的工程写法；
- 模块的输入和输出形状一致，多个 Transformer Block 才能像积木一样堆叠。

### 4.1 Single-Head Self-Attention
```python
import torch
from torch import nn
from torch.nn import functional as F
import math

class SingleHeadSelfAttention(nn.Module):
	def __init__(self, d_model, head_size, dropout=0.0):
		super().__init__()
		# 超参数
		self.d_model = d_model
		self.head_size = head_size
		# 可学习参数
		self.q_proj = nn.Linear(d_model, head_size)
		self.k_proj = nn.Linear(d_model, head_size)
		self.v_proj = nn.Linear(d_model, head_size)
		# dropout
		self.dropout = nn.Dropout(dropout)
	def forward(self, x, mask=None):
		# 三个投影
		q, k, v = self.q_proj(x), self.k_proj(x), self.v_proj(x) # (B, N, head_size)
		# 计算注意力分数
		attn_scores = q @ k.transpose(-1,-2) / math.sqrt(self.head_size)
		# 加上掩码
		if mask is not None:
			attn_scores = attn_scores.masked_fill(mask.bool(), float('-inf'))
		# 计算注意力权重
		attn_probs = F.softmax(attn_scores, dim=-1)
		# dropout
		attn_probs = self.dropout(attn_probs)
		# 计算注意力
		return attn_probs @ v
```
### 4.2 Multi-Head Self-Attention
```python
class MultiHeadSelfAttention(nn.Module):
	def __init__(self, d_model, head_nums, dropout=0.0):
		super().__init__()
		# 超参数
		assert d_model % head_nums == 0
		self.d_model = d_model
		self.head_nums = head_nums
		self.head_size = d_model // head_nums
		# 结构
		self.heads = nn.ModuleList([SingleHeadSelfAttention(d_model, self.head_size, dropout)
		for _ in range(head_nums)])

		self.dropout = nn.Dropout(dropout)

		# 可学习参数
		self.out_proj = nn.Linear(d_model, d_model)
	def forward(self, x, mask=None):
		#计算单头注意力
		outputs = [head(x,mask=mask) for head in self.heads]

		# 拼接多头
		out = torch.cat(outputs, dim=-1)

		# W_O投影并dropout
		out = self.out_proj(out)
		return self.dropout(out)
```

### 4.3 Multi-Head Self-Attention（非显式多头）
```python
class MultiHeadSelfAttention(nn.Module):
	def __init__(self, d_model, head_nums, dropout=0.0):
		super().__init__()
		# 超参数
		assert d_model % head_nums == 0
		self.d_model = d_model
		self.head_nums = head_nums
		self.head_size = d_model // head_nums
		# 可学习参数
		self.q_proj = nn.Linear(d_model, d_model)
		self.k_proj = nn.Linear(d_model, d_model)
		self.v_proj = nn.Linear(d_model, d_model)
		self.out_proj = nn.Linear(d_model, d_model)
		# 结构
		self.dropout = nn.Dropout(dropout)

	def split_heads(self, x):
		B, N, _ = x.shape
		return x.view(B, -1, self.head_nums, self.head_size).transpose(1,2)

	def forward(self, x, mask=None):
		# 计算投影矩阵
		q = self.split_heads(self.q_proj(x))
		k = self.split_heads(self.k_proj(x))
		v = self.split_heads(self.v_proj(x))# (B, N, d_model) -> (B, head_nums, N, head_size)
		# 计算注意力分数
		attn_scores = q @ k.transpose(-1,-2) / math.sqrt(self.head_size)
		# 引入掩码
		if mask is not None:
			attn_scores = attn_scores.masked_fill(mask.bool(), float('-inf'))
		# 计算注意力权重并dropout
		attn_probs = self.dropout(F.softmax(attn_scores, dim=-1))
		# 计算注意力，并合并头
		attn = attn_probs @ v# (B, head_nums, N, head_size)
		attn = attn.transpose(1,2).contiguous().view(x.shape[0], -1, self.d_model)
		# W_O投影并dropout
		return self.dropout(self.out_proj(attn))
```

## 5. 为什么要除以 $\sqrt{d_k}$，数学推导

假定 $Q$ 和 $K$ 中的每个元素独立同分布，且 $Q_{i,k}, K_{k,j} \sim \mathcal{N}(0,1)$；计算 $QK^T$ 中元素的方差。对于 $A = QK^T$，其中任一元素
$$
A_{i,j}=\sum_{k=1}^{d_k}Q_{i,k}K_{k,j}
$$
对于期望：
$$
E(A_{i,j})=E\left(\sum_k Q_{i,k} K_{k,j}\right) =\sum_k E(Q_{i,k} K_{k,j})=\sum_k E(Q_{i,k}) E(K_{k,j})=0
$$
对于方差：
$$
\operatorname{Var}(A_{i,j})=\operatorname{Var}\left(\sum_k Q_{i,k} K_{k,j}\right) =\sum_k \operatorname{Var}(Q_{i,k} K_{k,j})=\sum_k \left(E(Q_{i,k}^2 K_{k,j}^2) - E(Q_{i,k} K_{k,j})^2\right)=\sum_k E(Q_{i,k}^2 K_{k,j}^2)
$$
其中 $E(Q_{i,k}^2K_{k,j}^2)=E(Q_{i,k}^2)E(K_{k,j}^2)=\operatorname{Var}(Q_{i,k})\operatorname{Var}(K_{k,j})=1$，即 $\operatorname{Var}(A_{i,j})=d_k$。

因此需要把 $QK^T$ 元素的方差缩放到 1（均值仍为 0）。softmax 对数值量级敏感，输入差距过大时权重会坍缩到最大值上，导致梯度消失：
$$
\operatorname{Var}\left(\frac{A_{i,j}}{\sqrt{d_k}}\right)=\frac{\operatorname{Var}(A_{i,j})}{d_k}=1
$$
缩放因子 $\frac{1}{\sqrt{d_k}}$ 正是由此而来。

## 6. softmax 的数值稳定性

### 6.1 溢出问题与平移不变性

- softmax 因为有指数计算，对大值很敏感，会出现指数爆炸。
- 为了防止指数爆炸超出数据类型（FP32/FP16、BF16）的表示范围，利用 softmax 的平移不变性——$f(x)=f(x-m)$。实际工程中取 $m=\max_i {x_i}$。

### 6.2 Online Softmax

标准遍历次数较多，HBM 会被多次读取，IO 开销很大：
$$
\operatorname{softmax}(x_i)=\frac{\exp(x_i)}{\sum_j \exp(x_j)}
$$
计算 softmax 需要：
1. 遍历一遍得到 $x_i$ 的最大值 $m$；
2. 遍历一遍得到 $\sum_i\exp(x_i-m)$；
3. 遍历一遍得到 $x_1, x_2, \dots, x_N$ 的 softmax。

只要在遍历时同时维护两个变量 $m_i$ 和 $d_i$，分别是从 $x_1$ 到 $x_i$ 的最大值和 $x_1$ 到 $x_i$ 的平移 softmax 之和（平移基为 $m_i$）。
递推公式（对于 $d_i$ 先换平移基，然后加上新的元素）：
$m_i=\max(m_{i-1},x_i)$, $d_i = d_{i-1}\exp(m_{i-1}-m_i)+\exp(x_i-m_i)$。

这样 online softmax 只需遍历两次：第一次计算最大值 $m$ 和平移 $\exp$ 之和，第二次计算 $x_1,\dots,x_N$ 的平移 softmax。

online softmax 让后续的 FlashAttention 可以分块（tiling）计算：在块内完成 softmax，不必等合并成大矩阵之后再算全局 softmax。

## 7. Multi-Head Attention

### 7.1 多头的好处

多头让不同的头学习不同的语义特征，模型的表征能力因此更多样、更灵活。工程实现上，多个头就是大矩阵切成的几个小矩阵（一个大矩阵可以看作多个小矩阵拼接）。

由于标准多头下每个头都有独立的 K、V，KV Cache 占用很大，这也引出了后续削减 KV 头数的需求。

工程上，多头的设计天然适合并行化：
- GPU 内并行：在一个 kernel 中一次性算出所有头的值
- 张量并行：将多头分散到多个 GPU 中计算，最后通过 AllReduce 汇总结果

### 7.2 参数量

涉及四个矩阵：$W_Q,W_K,W_V,W_O$，形状统一为 $(d_{model}, d_{model})$，参数量为 $4\times d_{model}^2$（此处忽略占比极低的一次项 bias）。

## 8. MHA vs MQA vs GQA

MQA 和 GQA 都是为了缩减 KV Cache。

### 8.1 MHA (Multi-Head Attention)

标准的 MHA 中，每个注意力头都有独立的 Q、K、V。如果有 $h$ 个头，那就有 $h$ 组 K 和 $h$ 组 V 需要缓存。

- $h$ 个 Q 头，$h$ 个 K 头，$h$ 个 V 头
- 每组 Q/K/V 独立，互不共享

### 8.2 MQA (Multi-Query Attention)

Shazeer 在 2019 年提出：**所有 Q 头共享同一组 K 和 V**。只有 1 个 K 头和 1 个 V 头，Q 头仍有 $h$ 个。

- $h$ 个 Q 头，1 个 K 头，1 个 V 头
- 所有 Q 头共享同一份 K 和 V

好处是 KV Cache 缩小为原来的 $\frac{1}{h}$，推理速度大幅提升。代价是模型表达能力下降——所有头被迫从同一组 KV 中提取信息，多样性受限。

### 8.3 GQA (Grouped-Query Attention)

GQA 是 MHA 和 MQA 的折中方案（Ainslie et al., 2023）。将 $h$ 个 Q 头分成 $g$ 个组（每组 $\frac{h}{g}$ 个 Q 头），每组共享一组 K 和 V。

- $h$ 个 Q 头，$g$ 个 K 头，$g$ 个 V 头
- 每 $\frac{h}{g}$ 个 Q 头共享一组 K 和 V
- 当 $g=h$ 时退化为 MHA，当 $g=1$ 时退化为 MQA

GQA 在模型质量和推理效率之间取得了更好的平衡。LLaMA-2-70B、Mistral-7B 等主流模型都采用了 GQA。

<figure>
  <img src="/figures/transformer-gqa-sharing.svg" width="800" height="250" alt="MHA、GQA 与 MQA 的键值头共享结构对比：8 个 Query 头在 MHA 中对应 8 组 KV，在 GQA 中分组共享 2 组 KV，在 MQA 中全部共享 1 组 KV" />
  <figcaption>自上而下看连接线的归并方式：MHA 每头独占一组 KV，GQA 将多个 Q 头归并到同组 KV 上，MQA 则让全部 Q 头共用单组 KV；下方方块的相对面积对应缓存开销。</figcaption>
</figure>

### 8.4 对比表格

单 token 的 KV Cache 计算方式为 $K=XW_K, V=XW_V$，其中 $K, V$ 的形状为 $(B, N, \text{num\_kv\_heads}, \text{head\_dim})$。

以 $d_{model}=4096$、`num_heads=32`、`head_dim=128` 为例，假设序列长度 $N=4096$，FP16 精度（表内 `1M` 按二进制 $2^{20}$ 换算）：

| 指标                      | MHA (g=32)       | GQA (g=8)      | MQA (g=1)        |
| ----------------------- | ---------------- | -------------- | ---------------- |
| Q 头数                    | 32               | 32             | 32               |
| KV 头数                   | 32               | 8              | 1                |
| $W_K$ 参数量               | 32×128×4096=16M  | 8×128×4096=4M  | 1×128×4096=0.5M  |
| $W_V$ 参数量               | 16M              | 4M             | 0.5M             |
| 单 token KV Cache        | 2×32×128×2B=16KB | 2×8×128×2B=4KB | 2×1×128×2B=0.5KB |
| 4096 token KV Cache / 层 | 64MB             | 16MB           | 2MB              |
| 模型质量                    | 最好               | 接近 MHA         | 有下降              |

注：单层 Cache 大小 = `2 × B × N × num_kv_heads × head_dim × dtype_bytes`（其中 `2` 是 K 和 V，`B` 是 `batch_size`，`N` 是已生成序列长度）。从 MHA 到 GQA(g=8)，KV Cache 缩小为 1/4，参数量减少，模型质量几乎不受影响，GQA 因此成为主流选择。

### 8.5 MLA (Multi-head Latent Attention)
DeepSeek-V2 提出了 MLA（Multi-head Latent Attention），是另一种压缩 KV Cache 的思路。

MLA 的核心思想是：不直接缓存完整的 K 和 V 向量，而是将它们**压缩到一个低维潜在空间**（latent space），只缓存这个低维表示。推理时再将低维表示解压回完整的 K 和 V。

- **标准 MHA**：X→$W_K$→K（缓存 K，维度 = num_kv_heads × head_dim）
- **MLA**：X→$W_{DKV}$→c（缓存 c，维度远小于 K 的维度），推理时 c→$W_{UK}$→K 按需解压

MLA 通过低秩压缩将 KV Cache 大幅缩小（DeepSeek-V2 报告了约 93.3% 的压缩率），并通过上投影矩阵保持模型质量。它与 GQA 的思路不同：GQA 减少 KV 头的数量，MLA 降低每个表示的维度。

## 9. Causal Mask

### 9.1 因果掩码

自回归语言模型的训练目标是根据已生成的序列预测下一个词，训练时不能看到未来的词。
因果掩码把后面的词排除在计算之外。标准实现通常先算完整矩阵再施加掩码，而 FlashAttention 等分块实现可直接跳过全零的上三角分块以节省算力。

### 9.2 实现因果掩码
```python
def generate_causal_mask(seq_len):
	return torch.tril(torch.ones(seq_len, seq_len, dtype=torch.bool))
```

## 10. Self-Attention 的计算瓶颈

### 10.1 FLOPs

自注意力计算涉及四个矩阵。分头只是形式上的拆分，计算量可以直接按大矩阵算。

1. QKV 的计算，三个矩阵的投影，(N, d_model) * (d_model, d_model)
2. $QK^T$ 的计算，(N, d_model) * (d_model, N)
3. attn_scores 与 V 的计算，(N, N) * (N, d_model)
4. 综合多头的投影计算，(N, d_model) * (d_model, d_model)

最终为 $6Nd^2+2N^2d+2N^2d+2Nd^2=8Nd^2+4N^2d$。

序列较长时，主要计算瓶颈在注意力计算；序列较短时，瓶颈在 QKV 和 $W_O$ 投影。

### 10.2 算术强度和 roofline

算术强度衡量一个算法的计算访存比：`FLOPs / Byte`。
加速器性能衡量硬件的算力与带宽比：`FLOP/s ÷ (Byte/s)`。

- 算术强度大于硬件拐点时，受限于计算，GPU 满载，时间主要花在计算上。
- 算术强度小于硬件拐点时，受限于显存带宽，GPU 经常等待数据搬运。

- Prefill 阶段：预处理 prompt 计算 GEMM，算术强度大，一般是计算受限。
- Decode 阶段：逐个生成 token，计算 GEMV，算术强度较低，一般是内存受限，大部分时间在从 HBM 搬运模型权重和 KV Cache。

### 10.3 Self-Attention 的 $O(N^2)$ 瓶颈

自注意力的注意力计算要保留 $N\times N$ 的矩阵，显存随序列长度平方增长。$N=128\text{K}$、`num_heads=32` 时，$32\times N\times N\times 2\text{B}=1\text{TB}$；即使 $N=8\text{K}$，也有 4 GB 的显存。

这个平方复杂度就是 FlashAttention 要解决的问题。

## 11. FlashAttention 的核心思想

FlashAttention（Dao et al., 2022）是 Attention 算子优化领域最具代表性的工作之一。它的计算是精确的，不改变 Attention 的数学结果，只重新编排计算顺序，大幅减少了对 HBM 的访问量。

### 11.1 GPU 存储层次回顾

GPU 的存储层次如下：

- **HBM（High Bandwidth Memory）**：GPU 的主显存，容量大（如 A100 的 80 GB）但访问速度相对慢（2 TB/s）
- **SRAM（片上缓存）**：每个 SM（Streaming Multiprocessor）上的共享内存和寄存器，容量很小（如 A100 每个 SM 约 192 KB 共享内存，全部 SM 合计约 20 MB）但访问速度极快（约 19 TB/s）

标准 Attention 的流程是：在 HBM 中完成 $QK^T$，把完整的 N×N 注意力矩阵写回 HBM；再从 HBM 读取注意力矩阵做 Softmax，结果写回 HBM；最后从 HBM 读取 Softmax 结果和 V 做矩阵乘法。每一步都涉及对 N×N 大矩阵的 HBM 读写，这是巨大的带宽浪费。

### 11.2 Tiling：分块计算

FlashAttention 的第一个关键技术是 **Tiling（分块）**：将 Q、K、V 分成若干小块（tile），每次只加载一小块 Q 和一小块 K、V 到 SRAM，在 SRAM 内完成该块的 Attention 计算，再将结果写回 HBM。

```
标准实现：
  Q, K 全部加载到 HBM → 计算完整 N x N 矩阵 → 写回 HBM → 读取做 Softmax → 写回 HBM → ...

FlashAttention：
  将 Q 分成 T_r 块，K/V 分成 T_c 块
  For 每一块 Q_i:
    For 每一块 K_j, V_j:
      从 HBM 加载 Q_i, K_j, V_j 到 SRAM（每块很小，能装下）
      在 SRAM 内计算 Q_i @ K_j^T → 局部 Softmax → 乘以 V_j
      累积到该块 Q_i 对应的输出中
    将 Q_i 块的最终输出写回 HBM
```

每次只处理一个 tile，注意力矩阵的这一小块始终驻留在 SRAM 中，永远不需要把完整的 N×N 矩阵写入 HBM。

### 11.3 Online Softmax 的关键作用

Tiling 带来一个问题：Softmax 需要对每一行的所有元素做归一化，需要全局最大值和全局求和；分块计算时每次只看到一行的一部分。

Online Softmax 解决的就是这个问题。第 6.2 节的递推公式可以在新数据块到来时动态更新全局最大值和归一化分母，并修正之前块的计算结果。

处理 $Q_i$ 对 $K_1$ 块的 Attention 后，得到一个局部输出 $O_1$ 和对应的 Softmax 统计量（局部最大值 $m_1$ 和局部分母 $l_1$）。继续处理 $Q_i$ 对 $K_2$ 块时，会得到新的局部统计量 $m_2$ 和 $l_2$。Online Softmax 的修正公式为（其中 $O_1$、$O_2^{\text{local}}$ 均是以各自局部最大值为基准、经局部分母加权后的 $V$ 聚合结果）：

$$
m_{\text{new}} = \max(m_1, m_2)
$$

$$
l_{\text{new}} = l_1 \cdot e^{m_1 - m_{\text{new}}} + l_2 \cdot e^{m_2 - m_{\text{new}}}
$$

$$
O_{\text{new}} = \frac{O_1 \cdot l_1 \cdot e^{m_1 - m_{\text{new}}} + O_2^{\text{local}} \cdot l_2 \cdot e^{m_2 - m_{\text{new}}}}{l_{\text{new}}}
$$

不断累积，直到所有 K 块处理完毕，最终结果在数学上与全局 Softmax 等价（工程上仅存在浮点运算顺序带来的极小舍入差异）。

### 11.4 为什么能减少 HBM 访问

标准 Attention 的 HBM 访问量：

- 写入 S（N×N）：O(N²) 次写
- 读取 S 做 Softmax：O(N²) 次读
- 写入 P=Softmax(S)：O(N²) 次写
- 读取 P 做 P⋅V：O(N²) 次读
- **总 HBM 访问量：** O(N²)（加上 Q、K、V 本身的 O(Nd) 读取）

FlashAttention 的 HBM 访问量：

- 读取 Q、K、V：O(Nd)
- 写入最终输出 O：O(Nd)
- 中间的注意力矩阵始终在 SRAM 中，不写入 HBM
- **总 HBM 访问量：** O(Nd)

从 O(N²) 降到 O(Nd)：N 远大于 d 时（长序列场景），这是一个数量级的改进。计算量（FLOPs）没有变，仍是 O(N²d)，改变的只是 IO 模式。FlashAttention 的加速主要来自**减少对慢速 HBM 的访问，让计算尽可能在快速 SRAM 中完成**。

### 11.5 FlashAttention-2 和 FlashAttention-3

FlashAttention-2（Dao, 2023）在 FlashAttention 的基础上改进了并行策略和 warp 调度：

- 调整了内外循环的顺序（外循环遍历 Q 块，内循环遍历 K/V 块），减少了共享内存的读写；
- 改善了 warp 级工作分配，提升了 GPU 的占用率；
- 利用 Causal Mask 跳过全零的 tile，减少无效计算。

FlashAttention-3（Shah et al., 2024）则针对 Hopper 架构（H100）做了适配优化，利用 TMA（Tensor Memory Accelerator）和 wgmma（Warp Group MMA）指令提升硬件利用率。

目前 FlashAttention 已经是所有主流推理和训练框架的标配：PyTorch 2.0+ 内置了 `torch.nn.functional.scaled_dot_product_attention`，底层默认调用 FlashAttention kernel。
