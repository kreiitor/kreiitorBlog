---
title: "Transformer 与 AI Infra 的联系"
description: "从矩阵乘法和访存出发，理解 Transformer 为什么是 AI Infra 的核心负载。"
pubDate: 2026-10-26
tags:
  - "Transformer"
  - "AI Infra"
  - "学习笔记"
category: course
series: transformer
order: 1
cover: /covers/series-deep-learning.svg
---

Transformer 是大模型时代的核心架构，也是 AI Infra 工程师必须深入理解的对象——你优化的每一个算子、设计的每一种并行策略，最终都作用在 Transformer 的某个组件上。

## 1. 为什么是Transformer
在Transformer时代之前，序列处理的模型是RNN及其改进版本LSTM，关键是：
1. 按顺序处理序列，下一步的记忆是之前记忆的传递，训练阶段是串行的，不能并行训练，模型训练效率低；
2. 并且，长序列信息衰减问题仍然很难处理。

Transformer带来了self-attention机制，一方面一个token直接去和所有token进行交互，然后根据权重聚合信息。这带来了解决方案：
1. 所有token之间的注意力可以同时计算，本质就是$QK^T$的矩阵计算
2. 一个token可以和所有token交互，不存在长距离衰减问题
3. 注意力机制可以让模型自主控制应该关注哪些信息
	- 例如：time flies like an arrow，这个flies就应该更多看向time和arrow
	- 而fruit flies like a banana中的flies更多看向fruit和banana

## 2. 从原始Transformer到LLM家族
原始的Transformer是encoder-decoder架构，适合seq2seq任务，用于machine translation。但是研究者对结构的研究得到了很多变体：
1. BERT（2018）：典型的encoder-only架构，通过双向注意力（一个token可以看到它前后的所有token）和掩码语言模型预训练，在自然语言理解上取得了重大进步。并且验证了大规模预训练+下游任务微调这个范式
2. GPT（2018-2023）：典型的decoder-only架构，通过单向注意力（一个token只能看到它前面的token）和自回归预训练在文本生成任务上不断突破。GPT-2证明LLM的文本生成能力，GPT-3证明了scaling law（更多参数+更多数据=更好效果），GPT-4证明了LLM在多模态和复杂推理上的能力提升
3. LLaMA（2023）：依旧沿用decoder-only，架构上采用pre-norm、SwiGlu激活函数，RoPE旋转位置编码等当时最佳实践。LLaMA 的开源让整个社区能够在统一的架构基础上进行研究和优化，极大地推动了 AI Infra 工具链的发展——vLLM、SGLang、Megatron-LM 等框架的默认支持对象首先就是 LLaMA 架构。
4. 后续演进（Mistral、Qwen、DeepSeek 等）：这些模型在 LLaMA 的基础上引入了 GQA（Grouped-Query Attention）、MoE（混合专家模型）、MLA（Multi-head Latent Attention）等架构变种，但它们的核心骨架始终是 Transformer Decoder。

## 3. AiInfra和Transformer之间的关联
AiInfra的优化对应Transformer上的哪个结构：

| AI Infra 层级 | 优化技术                           | 对应的 Transformer 模块                 |
| ----------- | ------------------------------ | ---------------------------------- |
| CUDA 算子优化   | FlashAttention / 高效 GEMM       | Self-Attention（QKTQKT 和 PVPV 矩阵乘法） |
| CUDA 算子优化   | Fused Softmax / Online Softmax | Self-Attention（Softmax 归一化）        |
| CUDA 算子优化   | LayerNorm kernel 融合            | 每个 Decoder Block 的归一化层             |
| CUDA 算子优化   | RoPE 融合到 Attention kernel      | 位置编码（旋转 Q 和 K 向量）                  |
| 分布式训练       | 张量并行（TP）                       | Attention 的多头切分 + FFN 的矩阵切分        |
| 分布式训练       | 流水线并行（PP）                      | Decoder Block 的层级堆叠结构              |
| 分布式训练       | ZeRO 显存优化                      | 所有参数矩阵的存储与梯度同步                     |
| 分布式训练       | 混合精度（BF16/FP8）                 | 所有权重矩阵与激活值的数据类型                    |
| 推理部署        | KV Cache 管理                    | Self-Attention（K 和 V 缓存）           |
| 推理部署        | PagedAttention                 | KV Cache 的显存分页与碎片管理                |
| 推理部署        | 量化（INT4/INT8/FP8）              | 所有权重矩阵和 KV Cache                   |
| 推理部署        | Speculative Decoding           | 自回归生成的串行瓶颈                         |

### 3.1 CUDA算子优化层
#### **1.FlashAttention 与 Self-Attention 的 $QK^T$ / $PV$ 计算**

Self-Attention 需要计算一个 $N×N$ 的注意力矩阵（$N$ 为序列长度），标准实现会把这个完整的矩阵写入 GPU 的高带宽显存（HBM），显存占用为 $O(N^2)$。当序列长度从 2K 增长到 128K 时，显存需求增长 4096 倍。FlashAttention 的核心贡献是将这个巨大的矩阵分块（tiling），每个小块在 GPU 的片上缓存（SRAM）中完成 $QK^T$、Softmax、$PV$ 的全部计算，避免将完整的 $N×N$ 矩阵写入 HBM。这项优化直接作用于 Self-Attention 的两次核心矩阵乘法，因此要理解 FlashAttention 就必须先理解 Attention 的计算流程。

#### **2.Fused Softmax 与 Attention 的归一化步骤**

Softmax 操作需要对注意力分数矩阵的每一行先求最大值、再求指数和、最后归一化——标准实现需要三遍扫描（第一遍求 max，第二遍求 exp 之和，第三遍归一化）。Online Softmax 算法将前两遍合并，只需两遍扫描即可完成，这个优化被集成到 FlashAttention 中，并结合 tiling 技术进一步实现了分块意义上的单次 pass。Softmax 是 Attention 计算管线中的一个关键步骤，把它与前后的矩阵乘法融合在一起可以大幅减少中间结果的显存读写。

#### **3.LayerNorm kernel 融合**

每个 Transformer Decoder Block 包含两个 LayerNorm 操作（Pre-Norm 架构下分别在 Attention 和 FFN 之前）。LayerNorm 本身计算量不大，但需要对整个特征向量做两遍扫描（算均值/方差和归一化），是典型的 Memory Bound 操作。CUDA 优化中通常将 Residual Add + LayerNorm 融合为一个 kernel，减少一次完整的 HBM 读写——理解这个融合的前提是知道残差连接和 LayerNorm 在 Transformer Block 中的具体位置。

#### **4.RoPE 融合到 Attention kernel**

旋转位置编码（RoPE）的计算本质是对 Q 和 K 向量的每对相邻维度做旋转变换，计算量不大但调用频繁。将它融合到 Attention kernel 中可以避免为这个小操作单独启动一个 GPU kernel 的开销。这项优化的前提是理解 RoPE 在 Attention 计算流程中的位置——它作用于 Q 和 K 的线性投影之后、$QK^T$ 矩阵乘法之前。

### 3.2 分布式训练层
#### **1.张量并行（TP）与 Attention 多头 / FFN 矩阵**

张量并行的核心思想是将一个大矩阵乘法切分到多张 GPU 上并行计算。Transformer 中有两个天然的切分点。第一个是 Multi-Head Attention：比如 32 个 Attention 头可以均匀分配到 4 张 GPU 上，每张卡处理 8 个头，这种切分不需要卡间通信直到最后一步的输出投影。第二个是 FFN：Megatron-LM 将 FFN 的升维矩阵 $W_{up}$ 按列切分、降维矩阵 $W_{down}$​ 按行切分，使得中间的激活值不需要跨卡通信。这两种切分策略都直接依赖于你对 Attention 多头结构和 FFN 升维-降维结构的理解。

#### **2.流水线并行（PP）与 Decoder Block 堆叠**

一个大模型通常由几十层 Decoder Block 堆叠而成（如 LLaMA-2-7B 有 32 层）。流水线并行将这些层分成若干段，分配到不同的 GPU 上——比如前 8 层在 GPU 0，第 9-16 层在 GPU 1，以此类推。数据像流水线一样依次流过每段。这种策略之所以可行，根本原因在于每个 Decoder Block 的输入输出维度完全相同（都是 $(N,d_{model})$），前一个 Block 的输出可以直接作为下一个 Block 的输入，天然支持分段。

#### **3.ZeRO 显存优化与所有参数矩阵**

ZeRO 的策略是将训练过程中的“重复存储”消除——标准数据并行中，每张 GPU 都保存完整的模型参数、梯度和优化器状态，而 ZeRO 将这些按切片分摊到各卡上。这项优化作用于模型的所有参数矩阵——包括 Attention 的 $W_Q/W_K/W_V/W_O$​ 和 FFN 的 $W_{gate}​/W_{up}​/W_{down}​$。理解模型的参数量分布（FFN 约占 2/3，Attention 约占 1/3）对于评估 ZeRO 的显存节省效果和通信开销至关重要。

### 3.3 推理部署层
#### **1.KV Cache 与 Self-Attention 的 K/V 矩阵**

LLM 的自回归生成每一步只输出一个 token，但 Attention 计算需要用新 token 的 Query 去和所有历史 token 的 Key 做内积。如果不缓存，每一步都要重新计算所有历史 token 的 K 和 V——纯粹的浪费。KV Cache 将每层、每步的 K 和 V 存储在显存中复用。这项优化直接作用于 Self-Attention 模块中 K 和 V 的生命周期管理。

#### **2.PagedAttention 与 KV Cache 的显存碎片**

不同请求的序列长度不同，KV Cache 的大小也不一样。传统的预分配方式会造成大量的显存碎片——短请求分配了过多空间浪费，长请求可能因为找不到足够的连续空间而被拒绝。PagedAttention 借鉴操作系统的虚拟内存分页机制，将 KV Cache 切成固定大小的”页”按需分配，彻底解决碎片问题。这个优化的根源在于 KV Cache 的动态增长特性——每生成一个新 token，KV Cache 就增加一”行”。

#### **3.量化与所有权重矩阵 / KV Cache**

量化的本质是用更少的比特位表示数值——比如从 FP16（16 位）压缩到 INT4（4 位），权重占用的显存直接降为 1/4。这项技术作用于 Transformer 中所有的权重矩阵（$W_Q,W_K,W_V,W_O,W_{gate},W_{up},W_{down}$​）以及 KV Cache。理解每个矩阵的数值分布特征（比如 FFN 的某些层是否有异常大的 activation outlier）对于选择合适的量化策略至关重要。

#### **4.Speculative Decoding 与自回归生成的串行瓶颈**

自回归生成的根本瓶颈在于每次只能生成一个 token，GPU 的大量算力被浪费。Speculative Decoding 的思路是用一个小而快的 Draft 模型先”猜”出多个 token，再由大模型一次性验证——猜对的直接用，猜错的重新采样。这项优化直接针对 Transformer Decoder 自回归生成的串行特性，用并行验证来加速串行生成。

## 4. 端到端案例：一次LLM推理请求的完整旅程
**理论到实践：**
从用户发出提问到收到回答，看数据如何流经 Transformer 的每个模块，以及每个环节对应哪些 AI Infra 优化。

假设部署了一个 LLaMA-2-7B 模型（32 层 Decoder Block，hidden_dim=4096，32 个 Attention 头），使用 vLLM 推理引擎，用户发送了请求：“请用一句话解释什么是 Transformer”。

#### 4.1 Tokenize 与 Embedding

```
用户输入 → Tokenizer → Token IDs: [3529, 671, 19, 13563, ...]（约 10 个 token）
Token IDs → Embedding 层 → 输入张量: (10, 4096)
```

**AI Infra 关联**：Tokenizer 在 CPU 上执行。如果并发量极大，CPU 端的 tokenize 开销可能成为瓶颈，需要用 Nsight Systems 检查是否存在 GPU idle gap。

#### 4.2 Prefill 阶段：并行处理整个 Prompt

所有 10 个 input token 同时进入模型，经过 32 层 Decoder Block。在每一层中：

**LayerNorm**：对输入做归一化。

```
(10, 4096) → RMSNorm → (10, 4096)
```

AI Infra 优化：Residual Add + RMSNorm 融合为一个 CUDA kernel，减少一次 HBM 读写。

**QKV 线性投影**：生成 Q、K、V 矩阵。

```
Q = X * W_Q: (10, 4096) x (4096, 4096) = (10, 4096) → reshape (10, 32, 128)
K = X * W_K: 同上
V = X * W_V: 同上
```

AI Infra 优化：三次 GEMM 操作是张量并行（TP）的切分点之一——如果使用 4 卡 TP，每张卡只计算 8 个头对应的 QKV。

**RoPE 位置编码**：对 Q 和 K 做旋转。

```
Q, K → 按位置旋转 → Q', K'  (形状不变)
```

AI Infra 优化：RoPE 计算量小但调用频繁，通常融合到后续的 Attention kernel 中。

**Self-Attention 计算**：

```
S = Q' * K'^T / sqrt(128): (10, 128) x (128, 10) = (10, 10)  [每个头独立]
A = softmax(mask(S)):       (10, 10)
O = A * V:                  (10, 10) x (10, 128) = (10, 128)  [每个头]
拼接 32 个头 → (10, 4096)
输出投影: (10, 4096) x (4096, 4096) = (10, 4096)
```

AI Infra 优化：FlashAttention 将 $QK^T$、Scale、Mask、Softmax、$PV$ 全部融合在一个 kernel 中，利用 tiling 技术在 SRAM 中完成计算。Prefill 阶段的 batch 维度较大（10 个 token），属于 Compute Bound 操作。

**缓存 K 和 V**：将本层的 K 和 V 存入 KV Cache。

AI Infra 优化：vLLM 的 PagedAttention 以”页”为单位分配 KV Cache 存储空间。这 10 个 token 的 KV 被写入预分配的物理页中。

**残差连接 + LayerNorm + FFN**：

```
残差加法: h = input + attention_output    (10, 4096)
RMSNorm(h):                                (10, 4096)
FFN (SwiGLU):
  gate = h * W_gate: (10, 4096) x (4096, 11008) = (10, 11008)
  up   = h * W_up:   (10, 4096) x (4096, 11008) = (10, 11008)
  mid  = Swish(gate) * up:                         (10, 11008)
  down = mid * W_down: (10, 11008) x (11008, 4096) = (10, 4096)
残差加法: output = h + down                 (10, 4096)
```

AI Infra 优化：FFN 的三个大矩阵（$W_{gate}, W_{up}, W_{down}$​）是模型参数的大头（约占 2/3）。在 TP 中，$W_{gate}$ 和 $W_{up}$ 按列切分、$W_{down}$ 按行切分。在量化场景中，这三个矩阵是 INT4/INT8 量化的主要对象。

**经过全部 32 层后**：最终输出 + Final LayerNorm + LM Head → 词表概率分布 → 采样得到第一个输出 token。

>其中LM head是语言模型头，经过final_layernorm之后，取出最后一个token，过一遍LM head，得到(vocab_size,)。实际上就是过一遍线性投影

至此，Prefill 阶段完成。用户从发出请求到看到第一个字的时间就是 **TTFT（Time To First Token）**。

#### 4.3 Decode 阶段：逐 Token 生成

从第二个输出 token 开始，进入 Decode 阶段。每一步只有 1 个新 token 参与计算：

```
每一步:
  新 token → Embedding → (1, 4096)
  每一层:
    LayerNorm → QKV 投影 → RoPE
    新 Q (32, 1, 128) × 缓存 K (32, n, 128).transpose(-1,-2) → (1, n) 注意力分数(除以sqrt(head_dim)) [n 为当前总长度，即之前所有的回答tokens + prompt tokens]
    Softmax → 加权 V → 输出投影
    追加新 K, V 到 KV Cache
    残差 + LayerNorm + FFN + 残差
  final_norm -> LM Head → 采样 → 输出一个 token
```

与 Prefill 阶段的关键区别：

- 矩阵乘法退化为矩阵-向量乘（batch 维度只有 1），GPU 算力远远用不满
- 大部分时间花在从 HBM 搬运 KV Cache 数据，属于 **Memory Bound** 操作
- 每步完成后 KV Cache 增长一行

**这一阶段对应的 AI Infra 优化最为密集**：

| 环节                  | 瓶颈           | 对应优化技术                                |
| ------------------- | ------------ | ------------------------------------- |
| 逐 token 串行          | GPU 利用率低     | Speculative Decoding（猜测+验证）           |
| KV Cache 搬运         | HBM 带宽受限     | FlashDecoding（分块并行化 Decode Attention） |
| KV Cache 增长         | 显存消耗线性增长     | PagedAttention（分页管理）                  |
| KV Cache 大小         | 长序列/高并发下显存不够 | KV Cache 量化（INT4/INT8/FP8）            |
| 并发请求混合              | 短请求被长请求拖累    | Continuous Batching（动态组批）             |
| Prefill 与 Decode 互扰 | 尾延迟失控        | Prefill/Decode 解耦部署                   |

#### 4.4 全链路示意

整次请求的完整数据流与 AI Infra 优化的对应关系汇总如下：

| 阶段      | 输入与产出                                | 对应优化                          |
| ------- | ------------------------------------ | ----------------------------- |
| Embedding | 输入 token 映射为向量序列                      | 查表与位置编码，通常不是瓶颈                |
| Prefill | 整个输入序列一次性经过多层 Attention 与 FFN，产出首个 token | FlashAttention、算子融合            |
| KV Cache | Prefill 写入各层的 K、V，Decode 每一步读取并追加一组新的 K、V | PagedAttention、KV Cache 量化     |
| Decode  | 以上一步的输出 token 为输入，逐 token 生成直到结束      | Continuous Batching、Prefill/Decode 解耦部署 |

从这个端到端案例中可以清楚看到：推理请求经过的每一个环节——从 Embedding 到 Attention 到 FFN 到自回归生成——都是某项 AI Infra 优化技术的”着力点”。如果你不理解 Transformer 的内部结构，就无法定位性能瓶颈出在哪个模块，也无法评估优化方案的效果。

***关键疑问：*** 嗯，我还有一个疑问，为什每次都是要用上一次的KV？难道是上一次的KV保留了上下文信息？用新的Q是因为每个token的询问方式（query）都有差别？

***解答：*** 问题中带的回答是正确的

### 自我检验清单

完成本文学习后，检验自己是否真正理解了 AI Infra 与 Transformer 的关系：

- 能用自己的语言解释什么是 AI Infra，它在 AI 技术栈中处于什么位置，上下游分别是什么
- 能说清 RNN/LSTM 的两个核心弱点（串行、遗忘），以及 Transformer 如何用 Self-Attention 解决它们
- 能列出至少 3 项 CUDA 算子优化技术及其对应的 Transformer 模块，并解释对应关系
- 能列出至少 3 项分布式训练技术及其对应的 Transformer 模块，并解释对应关系
- 能列出至少 3 项推理优化技术及其对应的 Transformer 模块，并解释对应关系
- 给定一个 LLM 推理请求，能追踪数据流经 Transformer 各模块的过程，并指出每个环节对应哪些 AI Infra 优化
	<details> <summary>👉 点击查看答案</summary> 大阶段分为prefill和decode </details>
- 能回答”为什么 AI Infra 工程师必须懂 Transformer”这个问题，给出至少两个具体理由（而不是空泛的”因为很重要”）

## 📚 参考资料

### 论文

- **Attention Is All You Need** (Vaswani et al., 2017)：[https://arxiv.org/abs/1706.03762](https://arxiv.org/abs/1706.03762) — Transformer 原始论文
- **BERT: Pre-training of Deep Bidirectional Transformers** (Devlin et al., 2018)：[https://arxiv.org/abs/1810.04805](https://arxiv.org/abs/1810.04805) — Encoder-only 预训练范式
- **Language Models are Unsupervised Multitask Learners** (Radford et al., 2019, GPT-2)：[https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf](https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf) — GPT-2 技术报告
- **Language Models are Few-Shot Learners** (Brown et al., 2020, GPT-3)：[https://arxiv.org/abs/2005.14165](https://arxiv.org/abs/2005.14165) — 大规模语言模型的 Scaling Law 验证
- **LLaMA: Open and Efficient Foundation Language Models** (Touvron et al., 2023)：[https://arxiv.org/abs/2302.13971](https://arxiv.org/abs/2302.13971) — 开源大模型的里程碑
- **FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness** (Dao et al., 2022)：[https://arxiv.org/abs/2205.14135](https://arxiv.org/abs/2205.14135) — Memory-aware Attention 优化
- **Megatron-LM: Training Multi-Billion Parameter Language Models Using Model Parallelism** (Shoeybi et al., 2019)：[https://arxiv.org/abs/1909.08053](https://arxiv.org/abs/1909.08053) — 张量并行与流水线并行
- **ZeRO: Memory Optimizations Toward Training Trillion Parameter Models** (Rajbhandari et al., 2019)：[https://arxiv.org/abs/1910.02054](https://arxiv.org/abs/1910.02054) — 显存优化
- **Efficient Memory Management for Large Language Model Serving with PagedAttention** (Kwon et al., 2023)：[https://arxiv.org/abs/2309.06180](https://arxiv.org/abs/2309.06180) — vLLM / PagedAttention

### 教程与博客

- **The Illustrated Transformer** (Jay Alammar)：[https://jalammar.github.io/illustrated-transformer/](https://jalammar.github.io/illustrated-transformer/) — 图文并茂的 Transformer 入门
- **Andrej Karpathy: Let’s build GPT from scratch**：[https://www.youtube.com/watch?v=kCc8FmEb1nY](https://www.youtube.com/watch?v=kCc8FmEb1nY) — 从零手写 GPT
- **3Blue1Brown: But what is a GPT**： [https://www.youtube.com/watch?v=wjZofJX0v4M](https://www.youtube.com/watch?v=wjZofJX0v4M) — 直觉级理解 Transformer
- **The Annotated Transformer** (Harvard NLP)：[https://nlp.seas.harvard.edu/annotated-transformer/](https://nlp.seas.harvard.edu/annotated-transformer/) — 论文逐行对应 PyTorch 实现
