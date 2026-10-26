---
title: "完整 Transformer Decoder Block"
description: "把注意力、FFN、残差和归一化组合成一个完整的 Decoder Block。"
pubDate: 2026-10-26
tags:
  - "Transformer"
  - "Decoder"
  - "学习笔记"
category: course
series: transformer
order: 7
cover: /covers/series-deep-learning.svg
---

decoder-only在架构上实现简洁,并且获得了最好的通用能力,且对工程友好,成为绝对主流

## 1. Decoder Block 完整数据流

一个 Pre-Norm Decoder-only Block 内部的数据流转如下：

1. 输入 hidden states 分成两路：一路进入 RMSNorm，另一路作为残差直连。
2. 归一化结果进入 Masked Multi-Head Self-Attention，RoPE 只作用于其中的 Q、K。
3. 注意力输出与残差相加。
4. 相加结果再次分成两路：一路进入 RMSNorm 和 SwiGLU FFN，另一路作为第二条残差。
5. FFN 输出与残差相加，得到该 Block 的输出 hidden states。

几个值得注意的细节：

- **RMSNorm 而非 LayerNorm**。LLaMA 系列及后续大多数模型使用 RMSNorm（Root Mean Square Normalization），省去了减均值的步骤，只保留除以均方根的操作。计算更简单，效果相当。
- **RoPE 只作用于 Q 和 K**。旋转位置编码的作用是让 Q 和 K 的内积包含相对位置信息，V 不需要旋转，因为 V 承载的是”内容信息”而非”位置匹配信号”。
- **Pre-Norm 的残差路径是干净的**。两条残差路径都从 Add 节点直接接过来，中间没有经过任何变换。这保证了梯度可以无损地沿残差路径回传，是深层模型训练稳定的关键。

## 2. 完整pytorch实现decoder block

```python
import torch
from torch import nn
from torch.nn import functional as F

class TransformerBlock(nn.Module):
	def __init__(self, d_model, num_heads, d_ff, norm_eps=1e-6, dropout=0.1):
		super().__init__()
		# 结构
		self.norm1 = RMSNorm(d_model, norm_eps)
		self.attn = MaskedMultiHeadSelfAttention(d_model, num_heads, dropout)
		self.norm2 = RMSNorm(d_model, norm_eps)
		self.ffn = SwiGLUFFN(d_model, d_ff, dropout)
	def forward(self, x, cos, sin):
		h = x + self.attn(self.norm1(x), cos, sin)
		out = h + self.ffn(self.norm2(h))
		return out

class RMSNorm(nn.Module):
	def __init__(self, d_model, eps):
		super().__init__()
		# 超参数
		self.eps = eps
		# 可学习参数
		self.gamma = nn.Parameter(torch.ones(d_model))
	def forward(self, x):
		rms = torch.sqrt(x.pow(2).mean(dim=-1, keepdim=True)+self.eps)
		return self.gamma * x / rms

class MaskedMultiHeadSelfAttention(nn.Module):
	def __init__(self, d_model, num_heads, dropout=0.1):
		super().__init__()
		# 超参数
		assert d_model % num_heads == 0
		self.d_model = d_model
		self.num_heads = num_heads
		self.head_dim = d_model // num_heads
		# 可学习参数
		self.w_q = nn.Linear(d_model, d_model, bias=False)
		self.w_k = nn.Linear(d_model, d_model, bias=False)
		self.w_v = nn.Linear(d_model, d_model, bias=False)
		self.w_o = nn.Linear(d_model, d_model, bias=False)
		# 结构
		self.dropout = nn.Dropout(dropout)
	def forward(self, x, cos, sin):
		B, N, _ = x.shape
		# 计算投影
		Q = self.w_q(x)
		K = self.w_k(x)
		V = self.w_v(x)
		# 拆头
		Q = Q.view(B, -1, self.num_heads, self.head_dim)
		K = K.view(B, -1, self.num_heads, self.head_dim)
		V = V.view(B, -1, self.num_heads, self.head_dim)
		# QK旋转
		Q = apply_rope(Q, cos, sin)
		K = apply_rope(K, cos, sin)
		# 转置便于运算
		Q = Q.transpose(1,2)
		K = K.transpose(1,2)
		V = V.transpose(1,2)
		# 计算注意力分数
		attn_scores = Q @ K.transpose(-1, -2) / torch.sqrt(self.head_dim)
		# 加入因果掩码
		masked = torch.triu(
			torch.full((N,N), float('-inf'), device=x.device), diagonal=1)
		attn_scores += masked
		# 计算softmax dropout
		attn_probs = F.softmax(attn_scores, dim=-1)
		attn_probs = self.dropout(attn_probs)
		# 加权求和
		attn = attn_probs @ V
		# 合并多头
		attn = attn.transpose(1,2).contiguous().view(B,N,-1)
		# W_O投影
		out = self.w_o(attn)
		return self.dropout(out)

def precompute_rope_freqs(max_seq_len, d_k, base=10000.0):
	# theta_i = 1/base^{2i/d_k}
	theta = 1.0 / base**(torch.arange(0,d_k,2) / d_k) # (d_k//2,)
	position = torch.arange(max_seq_len) # (max_seq_len,)
	angles = torch.outer(position, theta) # (max_seq_len, d_k//2)
	return torch.cos(angles), torch.sin(angles)

def apply_rope(x, cos, sin):
	# 截取输入矩阵x需要的cos,sin, x->(B,N,num_heads,head_dim)
	N = x.shape[1]
	cos = cos[None, :N, None, :]
	sin = sin[None, :N, None, :]
	# 按照前后半
	x1 = x[..., :x.shape[-1]//2]
	x2 = x[..., x.shape[-1]//2:]
	return torch.cat([x1*cos-x2*sin, x1*sin+x2*cos], dim=-1)

class SwiGLUFFN(nn.Module):
	def __init__(self, d_model, d_ff, dropout=0.1):
		super().__init__()
		# 超参数
		self.d_model = d_model
		self.d_ff = d_ff
		# 可学习参数
		self.w_up = nn.Linear(d_model, d_ff)
		self.w_down = nn.Linear(d_ff, d_model)
		self.w_gate = nn.Linear(d_model, d_ff)
		# 结构
		self.silu = nn.SiLU()
		self.dropout = nn.Dropout(dropout)
	def forward(self, x):
		up = self.w_up(x) * self.silu(self.w_gate(x))
		down = self.w_down(self.dropout(up))
		return down
```

## 3. 参数量手撕

token embedding -> decoder block -> 最后的RMSNorm和LM头
### token embedding

token -> id:一个词表,参数量为$V\times d_{model}$

### 单个decoder block

#### 两个RMSNorm

两个缩放可学习参数:参数量为$2\times d_{model}$

#### 多头自注意力

四个投影矩阵:参数量为$4\times d_{model}^2$

#### SwiGLUFFN

升维降维和门控矩阵:参数量为$3\times d_{model}\cdot d_{ff}$

#### 最后的RMSNorm和LM头

参数量为:$d_{model}+V\times d_{model}$

## 4. 计算量(FLOPS)手撕

### 线性层

>其中线性层和FFN中的N分别是四次投影中投影矩阵的参数量和FFN中三个矩阵的参数量

#### 四次投影

$4\times 2\times d_{model}^2\times s =  2Ns$

#### FFN层

$3\times 2\times s\times d_{model}\times d_{ff}=2Ns$

### 注意力层

>注意力层是$QK^T$和$AV$,其中$A=softmax\left(\frac{QK^T}{d_k}\right)$

$FLOPS = 2\times 2\times d_{model}\times s^2 \times h=4hd_{model}s^2$

==🟣可以看到,当序列长度较低的时候,线性层计算量占主导,2Ns足够估计计算量,但是当序列长度增大时,注意力部分的计算量逐渐变为主导,不可忽视==

## 5. 显存规划

### 模型权重显存

模型权重显存取决于模型参数多少和存储的数据类型,显存=参数量\*数据类型字节数

### 训练状态下的显存

>以混合精度训练为例:BF16权重+FP32优化器,共有四大组成

- 模型权重(BF16)
	- $2N$
- 梯度(形状与权重一致,BF16)
	- $2N$
- 优化器状态(随优化器改变),以Adam\AdamW为例
	- Fp32参数副本: 防止梯度太小BF16捕获不到. 4N
	- 一阶梯度动量: 梯度的指数移动平均. 4N
	- 二阶梯度动量:梯度平方的指数移动平均. 4N
- 激活值(动态部分)
	- 在反向传播时仍要重复利用的部分,在前向传播的时候计算之后就保存下来复用.
	- 大概$kBsdL$,其中k是个常数,和是否开启activation checkpoint,模型架构,是否并行等有关
	- 在计算过程中,张量大多是含有(B,s,d)的,参数量就是$Bsd$,然后乘以层数,并且存多少个对象等凝结为一个经验常数

### 推理状态下的显存

推理不需要梯度和优化器状态,但是要考虑KV cache

- 模型权重
- KV cache:每个token在每一次需要缓存K,V各一个张量
	- $2\times h_{kv} \times L \times Bsd \times bytes\_per\_ele$

### 自我检验清单

学完本文后，检验以下能力：

- 能解释 Decoder-only 架构为什么在大模型时代胜出，至少说出三个理由
- 能在白板上画出完整的 Decoder Block 数据流图，标注 RMSNorm、Masked MHA、SwiGLU FFN、残差连接的位置和顺序
- 能画出因果掩码矩阵（给定序列长度 N），解释上三角 −∞ 的作用
- 能手算 LLaMA-2-7B 和 13B 的参数量（误差不超过 5%），说清 FFN 和 Attention 的参数比例
- 能用 "6Ns" 公式估算训练 FLOPs，用 "2Ns" 估算推理 FLOPs
- 能计算给定模型在 FP16、INT8、INT4 下的权重显存
- 能算出 Adam 优化器需要多少显存，并解释为什么需要 FP32 Master Weights
- 给定一个模型配置和 GPU 型号，能完成完整的显存规划（权重 + KV Cache 或 权重 + 梯度 + 优化器 + Activation），判断是否能装下
