---
title: "Add & Norm"
description: "残差连接与归一化的位置、作用和训练稳定性。"
pubDate: 2026-10-26
tags:
  - "Transformer"
  - "归一化"
category: course
series: transformer
order: 6
cover: /covers/series-deep-learning.svg
---

## 1. 为什么残差连接

1. 深度学习训练依赖反向传播，从损失出发按链式法则连乘，而乘法对数值很敏感。
	- 各个因子小于 1 时，模型一深，梯度传到后面就接近消失
	- 各个因子大于 1 时，经过深层结构，最后的梯度可能很大，甚至爆炸（NaN）
2. 卷积神经网络时期，深层网络的效果不如浅层网络。但浅层网络加上恒等映射层就是一个深层网络，所以问题出在模型学不好恒等映射。
	- 残差连接给反向传播留出一条直达深层的「捷径」，让模型在恒等映射的基础上学习

## 2. 残差连接

> 子结构的最终输出等于它的输出加上它的输入

### 2.1 残差连接对梯度影响

设第 $l$ 个残差块为
$$
x_{l+1}=x_l+F_l(x_l;W_l),\qquad l=0,\dots,L-1.
$$
令
$$
J_l=\frac{\partial F_l}{\partial x_l}.
$$
则前向雅可比为
$$
\frac{\partial x_{l+1}}{\partial x_l}=I+J_l.
$$

设损失为 $\mathcal L$，定义反向传播的行向量梯度
$$
\delta_l=\frac{\partial \mathcal L}{\partial x_l}.
$$
则
$$
\delta_l=\delta_{l+1}\frac{\partial x_{l+1}}{\partial x_l}
=\delta_{l+1}(I+J_l).
$$
从第 $L$ 层传回第 $l$ 层：
$$
\delta_l=\delta_L\prod_{i=l}^{L-1}(I+J_i).
$$

对比普通非残差网络：
$$
x_{l+1}=F_l(x_l),\qquad
\delta_l^{\text{plain}}=\delta_L\prod_{i=l}^{L-1}J_i.
$$
普通网络梯度是纯乘性链式乘积；残差网络则多出了单位阵 $I$。

==这样，无论后面那些残差块梯度组合出的数值是什么，反向传播时总有一个单位矩阵 I 可以传到深层==

### 2.2 PyTorch 实现 Add & Norm
```python
import torch
from torch import nn
from torch.nn import functional as F

class ResidualSublayer(nn.Module):
	def __init__(self, d_model, sublayer):
		super().__init__()
		# 超参数
		self.d_model = d_model
		# 可学习参数
		self.norm = nn.LayerNorm(d_model)
		# 结构
		self.sublayer = sublayer

	def forward(self, x):
		# pre-norm
		return x + self.sublayer(self.norm(x))

class SimpleFFN(nn.Module):
	def __init__(self, d_model, d_ff):
		super().__init__()
		# 超参数
		self.d_model = d_model
		self.d_ff = d_ff
		# 可学习参数
		self.w_up = nn.Linear(d_model, d_ff)
		self.w_down = nn.Linear(d_ff, d_model)
		# 结构
		self.activation = nn.GELU()
	def forward(self, x):
		return self.w_down(self.activation(self.w_up(x)))
```

## 3. 归一化各方法详解

### 3.1 BatchNorm（CV 时代）

$$
BatchNorm(x) = \gamma \cdot \frac{x-\mu}{\sqrt{\sigma^2 +\epsilon}}+\beta
$$
其中 $\gamma$ 学习缩放，$\beta$ 学习偏移（因为对 $x$ 做了中心化）。
- 这里的 $\mu,\sigma$ 沿批次维度求解：同一批内、同一个特征维度作为一组，算出均值和方差，再用它归一化

==缺陷==
- 大模型时代不好用：训练时批次够大，统计量还算准；推理时批次是 1，这个统计量基本失效。
- 训练和推理必须用两套统计量，行为不统一。
- CV 时代处理的是 (B, d) 数据，现在是 (B, N, d)，序列长度不一，padding 会引入无意义的偏差。

### 3.2 LayerNorm（Transformer 原始实现）

$$
LayerNorm(x) = \gamma \cdot \frac{x-\mu}{\sqrt{\sigma^2 +\epsilon}}+\beta
$$
这里改成按隐藏维度归一化

==优势==
- 按隐藏维度归一化，序列长度不一没有影响。
- 训练和推理使用同一套计算逻辑：不受批次差别影响，单个 token 也能独立归一化。

### 3.3 RMSNorm（现代大模型的新主流）

$$
RMSNorm(x) = \gamma \cdot \frac{x}{RMS(x)}
$$
其中 $RMS(x)=\sqrt{\frac{1}{d} \sum_{i=1}^{d}x_i^2}$

简化有两处：
1. 去掉中心化，不再计算均值
2. 去掉 $\beta$ 这个可学习参数：不再中心化，也就没有偏移项要学
$$
RMS(x)=mean(x^2)=var(x)+mean(x)^2
$$
当 $x$ 的均值接近 0 时，RMS(x) 近似等于标准差，RMSNorm 和 LayerNorm 的行为基本一致。
- 实验表明，深层 Transformer 中各层特征向量的均值通常接近 0，这支持了 RMS 近似的有效性

==为什么能替代 LayerNorm==
- 归一化的作用是控制数值的尺度、做缩放，除以 RMS 就够了

==优势==
- 效果基本不变，计算和工程实现更轻便

### 3.4 三种归一化方法对比

| 对比维度                    | BatchNorm              | LayerNorm          | RMSNorm              |
| ----------------------- | ---------------------- | ------------------ | -------------------- |
| **归一化维度**               | Batch 维度（对每个特征通道跨样本统计） | 特征维度（对每个样本独立统计）    | 特征维度（对每个样本独立统计）      |
| **是否有 Mean Shift（去均值）** | 是                      | 是                  | 否                    |
| **可学习参数**               | γ + β                  | γ + β              | 仅 γ                  |
| **Batch 依赖**            | 强依赖，小 batch 不稳定        | 无依赖                | 无依赖                  |
| **训练/推理一致性**            | 不一致（需 running stats）   | 完全一致               | 完全一致                 |
| **计算量（相对）**             | 较高（需跨 batch 通信）        | 中等（两遍扫描）           | 较低（可一遍扫描）            |
| **主要适用场景**              | CV（CNN + 大 batch）      | NLP / Transformer  | 大规模 LLM              |
| **代表使用者**               | ResNet, EfficientNet   | GPT-2, GPT-3, BERT | LLaMA, Mistral, Qwen |

## 4. Pre-Norm vs Post-Norm：归一化时机的路线之争

实践中，归一化的位置有两种流派：一种放在进入子结构之前，一种放在子结构输出之后。这两种选择对反向传播的梯度流影响较大，写法分别是：
pre:$out = x + sublayer(norm(x))$
post:$out = x + norm(sublayer(x))$
两边的梯度流：
pre:
$$
\frac{\partial \mathcal{L}}{\partial x_l} = \frac{\partial \mathcal{L}}{\partial x_L} \prod_{k=l}^{L-1} \left[ I + \frac{\partial (F_k(\text{LN}_k(x_k)))}{\partial x_k} \right]
$$
post:
$$
\frac{\partial \mathcal{L}}{\partial x_l} = \frac{\partial \mathcal{L}}{\partial x_L} \prod_{k=l}^{L-1} \left[ \frac{\partial \text{LN}_k}{\partial (x_k + F_k)} \cdot \left( I + \frac{\partial F_k}{\partial x_k} \right) \right]
$$
pre 路线和前面的残差作用类似，仍然保留一条通往深层的「捷径」，可以防止梯度消失和爆炸，训练稳定性更强。

post 的连乘里多出一个系数项，数值稳定性较差，训练相对不稳定。

实验里，Post 在训练收敛充分时效果比 pre 略好，但训练稳定性让这个优势很难在实际训练中拿到。大语言模型训练一次代价很大，pre 靠训练稳定性成了主流。

DeepNorm 在 post 的基础上给残差连接的输入 $x$ 加上调节参数 $\alpha$，试图复现 pre 的训练稳定性。但 pre 的训练本来就稳定，社区实践多，实现也简洁，没必要再引入新参数。

## 5. CUDA 优化视角

LayerNorm 和残差连接的数学不难，难的是在 GPU 上高效实现。

### 5.1 LayerNorm Kernel 的实现挑战

LayerNorm 的数学不复杂，在 GPU 上高效实现却有讲究。它是一个 **reduction 操作**，要对整个特征维度求和（算均值和方差），而 GPU 擅长的是大规模并行的逐元素计算。

**两遍扫描问题**

最朴素的 LayerNorm 实现需要两遍扫描输入数据：

```
第一遍：遍历 d 个元素，计算 sum(x) 和 sum(x²)，进而得到 mean 和 variance
第二遍：再次遍历 d 个元素，用 mean 和 variance 对每个元素做归一化
```

这意味着特征向量的数据要从 HBM（高带宽显存）读**两次**。dmodel=4096 甚至 8192 的大模型，每个 token 的特征向量有 4096-8192 个 float16 元素，绝对大小只有 8-16 KB。但 LayerNorm 在每个 Transformer Block 里调用两次（Attention 前一次，FFN 前一次），模型又有几十个 Block，再乘上 batch 和序列长度，累计的 HBM 访问量相当可观。

**Welford 算法与在线计算**

一种优化是用 Welford 在线算法，一遍扫描同时算出均值和方差，避开数值不稳定的 $\frac{1}{N} \sum x_i^2 - \left( \frac{1}{N} \sum x_i \right)^2$ 公式（_平方的均值 - 均值的平方_）。但这种方法的累加是顺序的，放到 GPU 的并行 reduction 框架下实现要仔细处理。

**RMSNorm 的优势**

RMSNorm 去掉了均值计算，只需要计算 $\sum x^2$。reduction 从两个（sum 和 sum of squares）变成一个（sum of squares），kernel 实现更简单，计算量也更少，**数值稳定性问题也更少**。
>reduction 需要跨线程协作、通信，比较「贵」

### 5.2 Residual Add + LayerNorm 融合

在 Pre-Norm 架构里，残差加法和 LayerNorm 在数据流上紧挨着：

```
h = x + SubLayer_output    # Residual Add
next_input = LayerNorm(h)  # 下一个子层的输入需要先归一化
```

如果分开实现，`h` 要先写回 HBM，LayerNorm kernel 再把它读出来。这一写一读，两次 HBM 访问本可以省掉。

**融合 kernel 的思路：**

将 Residual Add 和 LayerNorm 合并为一个 kernel（fused kernel），在 GPU 的寄存器或 shared memory 中直接完成加法后立即做归一化，省去中间结果写回 HBM 的开销：

```
一个 fused kernel 内部：
1. 从 HBM 读取 x 和 SubLayer_output
2. 在寄存器中计算 h = x + SubLayer_output
3. 在寄存器/shared memory 中对 h 做 reduction（求 mean 和 var）
4. 对 h 做归一化，得到 LayerNorm(h)
5. 将 h（用于后续残差）和 LayerNorm(h)（用于下一个子层）写回 HBM
```

这种融合是 NVIDIA Apex、Megatron-LM 等框架中的标准优化。实测显示，Residual Add + LayerNorm 融合可以为整个 Transformer 带来约 5-10% 的端到端推理加速。

### 5.3 FP16/BF16 下的数值精度问题

大模型训练和推理普遍使用半精度浮点数（FP16 或 BF16）来节省显存和提升吞吐。但归一化操作对数值精度格外敏感：

**FP16 的精度陷阱**

FP16 的有效精度约 3.3 位十进制数（11 位尾数），可表示的最小正数约 6e-8，最大值约 65504。在归一化计算中：

1. **求和时的精度损失**：当 dmodel=4096 时，∑x 涉及 4096 个数的累加。如果这些数的量级相近且符号一致，累加结果可能远大于单个元素，导致精度不足。更严重的是，$∑x^2$ 中的平方操作会放大数值范围，可能溢出 FP16 的表示范围（65504）。
2. **方差计算的灾难性抵消**：$Var(x)=mean(x^2)−mean(x)^2$，当方差较小时，这是一个「大数减大数」的操作，会导致灾难性的精度损失。

**工程解决方案**

主流的做法是在 reduction 操作（求均值和方差）时**提升到 FP32 精度**进行累加，计算完 mean 和 variance 后再转回 FP16/BF16 做归一化。这在 CUDA kernel 的实现中通常表现为：

```
// 伪代码
float sum = 0.0f;      // FP32 累加器
float sum_sq = 0.0f;   // FP32 累加器
for (int i = 0; i < d; i++) {
    float val = (float)input[i];   // FP16 → FP32
    sum += val;
    sum_sq += val * val;
}
float mean = sum / d;
float var = sum_sq / d - mean * mean;
float inv_std = rsqrtf(var + eps);
for (int i = 0; i < d; i++) {
    float val = (float)input[i];
    output[i] = (half)((val - mean) * inv_std * gamma[i] + beta[i]);  // FP32 → FP16
}
```

这种「输入输出半精度、中间计算全精度」的混合精度策略，是主流框架常用的做法。

**BF16 vs FP16**

BF16（Brain Floating Point 16）的指数位更多（8 位 vs FP16 的 5 位），动态范围与 FP32 一致，大幅降低了溢出风险。代价是尾数位更少（7 位 vs FP16 的 10 位），单个数值的精度略低。在归一化场景里，BF16 不容易溢出，FP32 fallback 也更少，越来越多的大模型训练因此选 BF16 而非 FP16。

### 自检清单

- **基础概念**：梯度消失和梯度爆炸的根本原因是什么？为什么深度与这个问题正相关？
- **残差连接**：写出残差连接的反向传播公式，解释为什么它包含一个「恒等捷径」。
- **归一化对比**：BatchNorm 和 LayerNorm 的归一化维度有什么区别？为什么 BatchNorm 不适合 Transformer？
- **RMSNorm**：RMSNorm 相比 LayerNorm 省略了什么？为什么在大模型中效果不受影响？
- **Pre-Norm vs Post-Norm**：画出两种架构的数据流图，解释为什么 Pre-Norm 的梯度流更稳定。
- **工程实践**：为什么 Residual Add 和 LayerNorm 通常融合为一个 kernel？FP16 下归一化需要注意什么？

### 动手练习

1. 实现 LayerNorm 和 RMSNorm，对比两者在相同输入上的输出差异，观察输入均值接近 0 时两者的近似程度。
2. 实现一个完整的 Pre-Norm Transformer Block（包含 Attention + FFN + 两个残差连接），用随机数据跑一次前向传播和反向传播，打印每层的梯度范数。
3. 把练习 2 改为 Post-Norm 架构，对比两者在深层网络（比如 48 层堆叠）下的梯度范数变化趋势。
