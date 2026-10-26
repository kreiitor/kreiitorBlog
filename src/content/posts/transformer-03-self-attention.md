---
title: "Self-Attention 机制"
description: "Q/K/V、缩放点积注意力与多头注意力的计算过程。"
pubDate: 2026-10-26
tags:
  - "Transformer"
  - "注意力机制"
  - "学习笔记"
category: course
series: transformer
order: 3
cover: /covers/series-deep-learning.svg
---

## 1. Attention的优势

- 并行性：只用计算矩阵乘法，天生适合并行
- 长距离依赖问题：原有的RNN后一步依赖前一步，序列长了信号衰减问题明显；现在的self-attention一次性计算任两个位置，不存在长距离衰减问题

## 2. QKV的“马后炮”解释

### 2.1 图书馆检索的类比

想象你走进一座图书馆，你脑子里有一个模糊的需求：“我想了解关于并行计算的内容”。这个需求就是你的 **Query**。

图书馆里每一本书的书脊上都贴着标签——“操作系统”、“计算机网络”、“并行计算导论”、“数据结构”等等。这些标签就是每本书的 **Key**。

你拿着自己的 Query，去和每本书的 Key 做比对。“并行计算导论”这个 Key 和你的 Query 高度匹配，匹配分数最高；“操作系统”可能有一些相关性，分数中等；“数据结构”和你的需求关系不大，分数很低。

确定了匹配分数之后，你不是把书脊标签（Key）拿走，而是把每本书的**实际内容**（Value）按照匹配分数加权汇总。“并行计算导论”的内容占大比重，“操作系统”的内容占一点，“数据结构”几乎不占——最终你得到的就是一份以并行计算为主、兼顾一点操作系统知识的综合信息。

### 2.2 三元组的形式化定义

回到 Self-Attention 的语境。给定输入序列 XX（形状为 (N,dmodel)(N,dmodel)），三个线性变换将 XX 映射到不同的空间：

- **$Q=X\cdot W_Q$**：每个 token 生成自己的”查询向量”——“我需要什么信息”
- **$K=X\cdot W_K$：每个 token 生成自己的”索引向量”——“我能提供什么信息的线索”
- **$V=X\cdot W_V$：每个 token 生成自己的”内容向量”——“我实际携带的信息”

Q、K、V 之所以要从同一个 $X$ 做三次不同的线性变换，而不是直接用 $X$ 本身，原因在于**解耦不同的角色**。一个 token “需要什么”和它”能提供什么”往往是不同的。比如在一个句子里，动词可能需要关注它的主语和宾语（Query 的方向），但它作为被别人关注的对象时，提供的是动作语义（Key/Value 的方向）。三个独立的投影矩阵让模型有自由度去学习这些不同的映射。

关键就是模型在学习的过程中，为了学习语言中的各种语义、结构、逻辑等内容，将设置的三个矩阵分别用于了不同类型的“语义”学习。

## 3. Scaled dot-product attention详解

注意力计算公式：
$$
Attention=softmax\left(\frac{QK^T}{\sqrt{d_k}}\right)V
$$

### 3.1 计算三个投影并拆头
```python
#x->(N, d_model)
Q = X @ W_Q
K = X @ W_K
V = X @ W_V

def split(x:torch.tensor):
	x = x.view(-1,num_heads, size_heads)
	x = x.transpose(0,1)
	return x
Q = split(Q)
K = split(K)
V = split(V)
```
### 3.2 计算注意力矩阵
```python
#Q,K->(num_heads, N, size_heads)
attn_scores = Q @ K.transpose(-1, -2) / math.sqrt(size_heads)

# 因果或者padding掩码在这个环节加上。假定处理后，True表示为掩码，False表示不为掩码
attn_scores += mask*torch.finfo(attn_scores.dtype).min
# 或者更工程： attn_scores.mask_fill(mask.bool(),'inf')
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
### 3.5 进行$W_O$投影，综合多头信息
```python
#合并头 attn->(num_heads, N, size_heads)
attn = attn.transpose(0,1).contiguous().view(-1,d_model)

state = attn @ W_O.T + bias
```

## 4. Pytorch实现

下面实现单头和多头注意力。假定x->(B,N,d_model)

- 在实现上，init定义结构组织和超参数以及可训练参数；forward定义输入张量的动态计算过程
- 4.1和4.2一体，先实现单头再利用nn.ModuleList构建多头
- 4.3不再显式构建多头，用一个大矩阵进行统一计算
- 这个模块的输入和输出都是统一形状，就是TransformerBlock能像搭积木一样一直搭的关键

### 4.1 single-head self-attention
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
		# drop_out
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
### 4.2 multi-head self-attention
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

### 4.3 multi-head self-attention（非显式多头）
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
		attn_scores = attn_scores.masked_fill(mask.bool(), float('-inf'))
		# 计算注意力权重并dropout
		attn_probs = self.dropout(F.softmax(attn_scores, dim=-1))
		# 计算注意力，并合并头
		attn = attn_probs @ v# (B, head_nums, N, head_size)
		attn = attn.transpose(1,2).contiguous().view(x.shape[0], -1, d_model)
		# W_O投影并dropout
		return self.dropout(self.out_proj(attn))
```

## 5. 为什么要除以$\sqrt{d_k}$，数学推导

假定：$Q$和$K$中的每一个元素独立同分布，$x \sim \mathbb{N}(0,1)$，然后计算$QK^T$中元素的方差
对于$A = QK^T$，其中任一元素
$$
A_{i,j}=\sum_{k=1}^{d_k}Q_{i,k}K_{k,j}
$$
对于期望：
$$
E(A_{i,j})=E(\sum_k Q_{i,k} K_{k,j}) =\sum_k(E( Q_{i,k} K_{k,j}))=\sum_k(E(Q_{i,k}) E(K_{k,j}))=0
$$
对于方差：
$$
Var(A_{i,j})=Var(\sum_k Q_{i,k} K_{k,j}) =\sum_k(Var( Q_{i,k} K_{k,j}))=\sum_k(E(Q_{i,k}^2K_{k,j}^2) - E(Q_{i,k}K_{k,j})^2)=\sum_k(E(Q_{i,k}^2K_{k,j}^2)
$$
其中$E(Q_{i,k}^2K_{k,j}^2)=E(Q_{i,k}^2)E(K_{k,j}^2)=Var(Q_{i,k})Var(K_{k,j})=1$，即$Var(A_{i,j})=d_k$.

>我们需要拉小$QK^T$元素的方差，集中到1附近。**因为softmax对数值量级敏感，输入值差距太大，会导致softmax之后权重几乎集中在最大值上**

我们有
$$
Var(\frac{A_{i,j}}{\sqrt{d_k}})=\left(\frac{Var(A_{i,j})}{d_k}\right)=1
$$
推导完毕.

## 6. softmax的数值稳定性

### 6.1 溢出问题与平移不变性

- softmax因为有指数计算，所以对大值很敏感，会出现指数爆炸现象。
- 为了防止大值导致的指数爆炸造成数据类型（fp32/16，bf16），利用softmax的平移不变性——$f(x)=f(x-m)$,在实际工程中，选择$m=\max_i {x_i}$。

### 6.2 online softmax
>扫描（遍历）次数增多，会导致HBM多次读取数据，IO开销很大

$$
softmax(x_i)=\frac{\exp(x_i)}{\sum_j \exp(x_j)}
$$
计算softmax需要：
1. 遍历一遍得到$x_i$的最大值m
2. 遍历一遍得到$\sum_i\exp(x_i-m)$
3. 遍历一遍得到$x_1,x_2,...,x_N$的softmax

但是只要在遍历的时候同时维护两个变量$m_i$和$d_i$，分别是从$x_1$到$x_i$的最大值和$x_1$到$x_i$的平移softmax之和（选择的平移基为$m_i$）
递推公式（对于$d_i$先换平移基，然后加上新的元素）：
$m_i=\max(m_{i-1},x_i)$,$d_i = d_{i-1}\exp(m_{i-1}-m_i)+\exp(x_i-m_i)$

这样online softmax只用遍历两次，第一次计算最大值m和平移$\exp$之和；第二次计算$x_1,...,x_N$的平移softmax

online softmax保证了后续的flashattention可以分块计算（tile），分块中就可以计算softmax不用等到合并大矩阵再计算全局的softmax（这样违背了tile的作用和思想）

## 7. Multihead

### 7.1 多头的好处

多头可以分别学习不同的语义特征，多个注意力头分别负责不同的理解部分，能让模型学习更加多样，更具灵活性。实际上工程计算上，多个头就是大矩阵分成的几个小矩阵（一个大矩阵可以看作多个小矩阵拼接。
>多头每个头都有独立的K，V，一定程度上导致了KVcache很大，所以后面想削减KV的数目

工程上，多头的设计天然适合并行化：
- GPU内并行：在一个kernel中一次性计算出所有头的值
- 张量并行：将多头分散到多个GPU中计算，最后通过AllReduce汇总结果

### 7.2 参数量

涉及到四个矩阵：$W_Q,W_K,W_V,W_O$，形状统一为($d_{model}, d_{model})$，即参数量为：$4\times d_{model}^2$
>这里不再考虑bias，因为占比很低，是一次项。

## 8. MHA vs MQA vs GQA

为了缩减KV cache

### 8.1 MHA (Multi-Head Attention)

标准的 MHA 中，每个注意力头都有独立的 Q、K、V。如果有 $h$ 个头，那就有 $h$ 组 K 和 $h$ 组 V 需要缓存。

- $h$ 个 Q 头，$h$ 个 K 头，$h$ 个 V 头
- 每组 Q/K/V 独立，互不共享

### 8.2 MQA (Multi-Query Attention)

Shazeer 在 2019 年提出：**所有 Q 头共享同一组 K 和 V**。也就是说，只有 1 个 K 头和 1 个 V 头，但仍然有 $h$ 个 Q 头。

- $h$ 个 Q 头，1 个 K 头，1 个 V 头
- 所有 Q 头共享同一份 K 和 V

好处是 KV Cache 缩小为原来的 $\frac{1}{h}$，推理速度大幅提升。代价是模型表达能力下降——所有头被迫从同一组 KV 中提取信息，多样性受限。

### 8.3 GQA (Grouped-Query Attention)

GQA 是 MHA 和 MQA 的折中方案（Ainslie et al., 2023）。将 $h$ 个 Q 头分成 $g$ 个组（每组 $\frac{h}{g}$ 个 Q 头），每组共享一组 K 和 V。

- $h$ 个 Q 头，$g$ 个 K 头，$g$ 个 V 头
- 每 $\frac{h}{g}$个 Q 头共享一组 K 和 V
- 当 $g=h$ 时退化为 MHA，当 $g=1$ 时退化为 MQA

GQA 在模型质量和推理效率之间取得了更好的平衡。LLaMA-2-70B、Mistral-7B 等主流模型都采用了 GQA。

### 8.4 对比表格

>单 token 的 KV cache 计算方式是：
>$K=XW_K,V=XW_V$
>也就是说，K，V的形状为$(B, N, num\_heads, head\_dim)$

以 $d_{model}$=4096，num_heads = 32，head_dim = 128 为例，假设序列长度 N=4096，FP16 精度：

| 指标                      | MHA (g=32)       | GQA (g=8)      | MQA (g=1)        |
| ----------------------- | ---------------- | -------------- | ---------------- |
| Q 头数                    | 32               | 32             | 32               |
| KV 头数                   | 32               | 8              | 1                |
| $W_K$ 参数量               | 32×128×4096=16M  | 8×128×4096=4M  | 1×128×4096=0.5M  |
| $W_V$ 参数量               | 16M              | 4M             | 0.5M             |
| 单 token KV Cache        | 2×32×128×2B=16KB | 2×8×128×2B=4KB | 2×1×128×2B=0.5KB |
| 4096 token KV Cache / 层 | 64MB             | 16MB           | 2MB              |
| 模型质量                    | 最好               | 接近 MHA         | 有下降              |

注：Cache size = 2 × B × L × num_heads × head_dim × d_type_bytes （其中 2 是 K 和 V，B 是 batch_size，L 是已生成序列长度） 可以看到，从 MHA 到 GQA(g=8)，KV Cache 缩小为 1/4，参数量减少，但模型质量几乎不受影响。这就是 GQA 成为主流选择的原因。

### 8.5 MLA (Multi-Latent Attention)
DeepSeek-V2 提出了 MLA（Multi-Latent Attention），代表了另一种压缩 KV Cache 的思路。

MLA 的核心思想是：不直接缓存完整的 K 和 V 向量，而是将它们**压缩到一个低维潜在空间**（latent space），只缓存这个低维表示。推理时再将低维表示解压回完整的 K 和 V。

- **标准 MHA**：X→$W_K$→K（缓存 K，维度 = num_kv_heads × head_dim）
- **MLA**：X→$W_{DKV}$→c（缓存 c，维度远小于 K 的维度），推理时 c→$W_{UK}$→K 按需解压

MLA 通过低秩压缩将 KV Cache 大幅缩小（DeepSeek-V2 报告了约 93.3% 的压缩率），同时通过精心设计的上投影矩阵保持了模型质量。它与 GQA 的思路不同——GQA 是减少 KV 头的数量，MLA 是降低每个表示的维度——但目标一致：让推理时的 KV Cache 尽可能小。

## 9. casual mask

### 9.1 因果掩码

在进行自回归语言模型的训练的时候，因为任务目标是根据已生成的序列预测下一个词，所以在训练的时候不能偷看未来的词。
为了实现这一诉求，加入因果掩码让后面的词不参与计算。
>这导致在自注意力阶段，上半个矩阵不用参与运算，可以节省计算力

### 9.2 实现因果掩码
```python
def generate_casual_mask(seq_len):
	return torch.tril(torch.ones(seq_len, seq_len, dtype=torch.bool))
```

## 10. self-attention的计算瓶颈

### 10.1 Flops

在自注意力计算的时候，一共涉及了四个矩阵，因为分头事实上是形式上的，所以直接按大矩阵算计算量
1. QKV的计算，三个矩阵的投影，(N,d_model) * (d_model,d_model)
2. $QK^T$的计算，(N,d_model) * (d_model,N)
3. attn_scoresV的计算，(N,N) * (N,d_model)
4. 最后综合多头的投影计算，(N,d_model) * (d_model,d_model)
最终为$6Nd^2+2N^2d+2N^2d+2Nd^2=8Nd^2+4N^2d$
则，当序列长的时候，主要的计算瓶颈在注意力的计算，当序列长较小的时候，主要计算瓶颈在QKV$W_O$投影

### 10.2 算术强度和roofline

算术强度衡量一个算法的计算量：Flops/Bytes
加速器性能（GPU等）衡量一个硬件的计算能力：Flop/s / Bytes/s

当算术强度>加速器性能，则受限于计算，GPU满载，时间更多在做计算
当算术强度<加速器性能，则受限于内存，GPU很多时候并没有满载，时间更多在数据搬运

- Prefill阶段：预处理prompt计算GEMM，算术强度大，一般是计算受限
- Decode阶段：逐个吐出Token，计算GEMV，算术强度较低，一般是内存受限。大部分时间在HBM搬运模型权重和KVcache

### 10.3 self-attention的$O(N^2)$瓶颈

自注意力在进行注意力计算的时候要保留N\*N的矩阵，随序列长度有平方的增长速度。例如当N=128K，num\_heads=32，则32\*N\*N\*2B=1TB，即使是N=8K，也有4GB的显存。

这个平方复杂度，就是flashattention要解决的问题

## 11. FlashAttention 的核心思想

FlashAttention（Dao et al., 2022）是过去几年 Attention 优化领域最具影响力的工作。它不改变 Attention 的计算结果（是精确计算，不是近似），但通过重新编排计算顺序，大幅减少了对 HBM 的访问量。

### 11.1 GPU 存储层次回顾

要理解 FlashAttention，需要先了解 GPU 的存储层次：

- **HBM（High Bandwidth Memory）**：GPU 的主显存，容量大（如 A100 的 80 GB）但访问速度相对慢（2 TB/s）
- **SRAM（片上缓存）**：每个 SM（Streaming Multiprocessor）上的共享内存和寄存器，容量很小（如 A100 每个 SM 约 192 KB 共享内存，全部 SM 合计约 20 MB）但访问速度极快（约 19 TB/s）

标准 Attention 的流程是：在 HBM 中完成 Q⋅KT，把完整的 N×N 注意力矩阵写回 HBM；然后从 HBM 读取注意力矩阵做 Softmax，结果写回 HBM；最后从 HBM 读取 Softmax 结果和 V 做矩阵乘法。每一步都涉及对 N×N 大矩阵的 HBM 读写——这是巨大的带宽浪费。

### 11.2 Tiling：分块计算

FlashAttention 的第一个关键技术是 **Tiling（分块）**：不一次性计算完整的 N×N 注意力矩阵，而是将 Q、K、V 分成若干小块（tile），每次只加载一小块 Q 和一小块 K、V 到 SRAM 中，在 SRAM 内完成该块的 Attention 计算，然后将结果写回 HBM。

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

Tiling 带来一个棘手的问题：Softmax 需要对每一行的所有元素做归一化（需要全局最大值和全局求和），但分块计算时每次只看到一行的一部分——怎么在只看到局部数据的情况下计算全局 Softmax？

这就是 Online Softmax 派上用场的地方。回忆第 6.2 节的 Online Softmax 递推公式：当新数据块到来时，可以动态更新全局最大值和归一化分母，并修正之前块的计算结果。

具体来说，处理 Qi对 K1 块的 Attention 后，得到一个局部输出 O1 和对应的 Softmax 统计量（局部最大值 m1 和局部分母 l1）。当继续处理 Qi 对 K2 块时，会得到新的局部统计量 m2 和 l2。通过 Online Softmax 的修正：==其中O_j是以当前最大值为底和v_i计算过的==

$$
m_{\text{new}} = \max(m_1, m_2)
$$

$$
l_{\text{new}} = l_1 \cdot e^{m_1 - m_{\text{new}}} + l_2 \cdot e^{m_2 - m_{\text{new}}}
$$

$$
O_{\text{new}} = \frac{O_1 \cdot l_1 \cdot e^{m_1 - m_{\text{new}}} + O_2^{\text{local}} \cdot l_2 \cdot e^{m_2 - m_{\text{new}}}}{l_{\text{new}}}
$$

不断累积，直到所有 K 块处理完毕，最终结果与标准 Attention 的全局 Softmax 在数学上完全一致。

### 11.4 为什么能减少 HBM 访问

标准 Attention 的 HBM 访问量：

- 写入 S (N×N)：O(N2) 次写
- 读取 S 做 Softmax：O(N2) 次读
- 写入 P=Softmax(S)：O(N2) 次写
- 读取 P 做 P⋅V：O(N2) 次读
- **总 HBM 访问量：** O(N2)（加上 Q, K, V 本身的 O(Nd) 读取）

FlashAttention 的 HBM 访问量：

- 读取 Q, K, V：O(Nd)
- 写入最终输出 O：O(Nd)
- 中间的注意力矩阵始终在 SRAM 中，不写入 HBM
- **总 HBM 访问量：O(Nd)

从 O(N2) 降到 O(Nd)——当 N 远大于 d 时（长序列场景），这是一个数量级的改进。注意，计算量（FLOPs）没有变——仍然是 O(N2d)——改变的只是 IO 模式。FlashAttention 的加速主要来自**减少了对慢速 HBM 的访问，让计算尽可能在快速 SRAM 中完成**。

### 11.5 FlashAttention-2 和 FlashAttention-3

FlashAttention-2（Dao, 2023）在 FlashAttention 的基础上进一步优化了并行策略和 warp 调度：

- 调整了内外循环的顺序（外循环遍历 Q 块，内循环遍历 K/V 块），减少了共享内存的读写
- 更好的 warp 级工作分配，提升了 GPU 的占用率
- 利用 Causal Mask 跳过全零的 tile，进一步减少计算量

FlashAttention-3（Dao et al., 2024）则针对 Hopper 架构（H100）进行了优化，利用了 TMA（Tensor Memory Accelerator）和 wgmma（Warp Group MMA）指令，进一步提升了硬件利用率。

目前 FlashAttention 已经是所有主流推理和训练框架的标配——PyTorch 2.0+ 内置了 `torch.nn.functional.scaled_dot_product_attention`，底层默认调用 FlashAttention kernel。

### 自我检验清单

完成本文学习后，用以下问题检验自己的理解深度：

- 能从 Bahdanau Attention 到 Self-Attention 梳理出 Attention 机制的演进脉络，说清每一步解决了什么问题
- 能默写 Scaled Dot-Product Attention 的完整公式，并解释 Q、K、V 三元组各自的作用
- 能从零推导 “除以 dk” 的数学原因：假设 qi,ki 独立标准正态，推出点积方差为 dk
- 能手写 Single-Head 和 Multi-Head Self-Attention 的 PyTorch 实现，能说清每一步的张量维度变化
- 能解释 Softmax 为什么要减最大值，以及 Online Softmax 的核心递推思想
- 给定 seq_len、dmodel、num_heads 的具体数值，能完整跟踪每一步的张量形状
- 能画出 MHA / MQA / GQA 的结构差异，并估算各自的 KV Cache 大小
- 能说清 Causal Mask 的作用和实现方式（上三角设为负无穷，Softmax 后归零）
- 能区分 Compute Bound 和 Memory Bound，并说清 Prefill 和 Decode 阶段各自的瓶颈类型
- 能说清 FlashAttention 的核心思想：Tiling + Online Softmax 如何将 HBM 访问从 O(N2) 降到 O(Nd)
