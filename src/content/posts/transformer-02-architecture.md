---
title: "从原始 Transformer 到 Decoder-only 架构"
description: "Encoder-Decoder、Decoder-only 与主流大模型架构的演进关系。"
pubDate: 2026-10-26
tags:
  - "Transformer"
  - "模型架构"
  - "学习笔记"
category: course
series: transformer
order: 2
cover: /covers/series-deep-learning.svg
---

## 1. 原始Transformer架构

### 1.1 for seq2seq tasks
原始Transformer要解决的是seq2seq问题——给定一个输入序列（例如英文），生成一个输出序列（例如中文）。这个任务需要两个阶段：理解和生成
- Encoder：把输入序列压缩成一组“理解后”的表示
- Decoder：基于“理解后”的表示逐步生成输出序列

先去根据输入序列生成自己的理解，然后根据理解逐字写出中文翻译，每写一个都回头看看原文理解。

### 1.2 整体架构

输入序列与已生成序列分别加上位置编码后进入各自的堆栈；Decoder 的 Cross-Attention 从 Encoder 最后一层取 K、V。

| 层 | 组成（按数据流顺序） | 作用 |
| --- | --- | --- |
| Encoder × 6 | Multi-Head Self-Attention → Add & Norm → FFN → Add & Norm | 编码输入序列，把结果作为 K、V 提供给 Decoder |
| Decoder × 6 | Masked Multi-Head Self-Attention → Add & Norm → Cross-Attention → Add & Norm → FFN → Add & Norm | 结合已生成序列与 Encoder 输出，逐位置生成下一个 token |
| 输出层 | 线性层 + Softmax | 把 Decoder 的输出映射为词表上的概率分布 |

原始论文中，Encoder 和 Decoder 各有 $N=6$ 层，隐藏维度 $d_{model}=512$，注意力头数 h=8h=8，FFN 中间维度 $d_{intermediate}=2048$。

### 1.3 三种注意力机制的分工
原始 Transformer 中一共用到了三种不同的注意力机制，它们虽然底层计算方式相同（都是 Scaled Dot-Product Attention），但 Q、K、V 的来源不同，扮演的角色也不同：

| 注意力类型                         | 所在位置      | Q 来自  | K、V 来自     | 作用                         |
| ----------------------------- | --------- | ----- | ---------- | -------------------------- |
| Encoder Self-Attention        | Encoder 层 | 输入序列  | 输入序列       | 输入 token 之间互相交换信息          |
| Masked Decoder Self-Attention | Decoder 层 | 已生成序列 | 已生成序列      | 已生成的 token 之间互相交换信息（不能看未来） |
| Cross-Attention               | Decoder 层 | 已生成序列 | Encoder 输出 | 生成过程中”回头查看”输入序列            |

用翻译的比喻来理解：
- **Encoder Self-Attention** 就像读原文时反复揣摩每个词与其他词的关系
- **Masked Decoder Self-Attention** 就像写译文时回顾自己已经写了什么
- **Cross-Attention** 就像写译文时回头对照原文

## 2. Encoder结构详解
对于一个结构，关键是先清晰接受什么样的数据，最后输出什么样的数据。然后深入进去看如何加工的。

### 2.1 输入处理
在进入encoder之前，要经过embedding的处理：
- **Token embedding:** 将每个token id映射为一个$d_{model}$维的稠密向量。这个映射是通过一个可学习的嵌入矩阵$W_{emb} \in \mathbb{R}^{V\times d_{model}}$实现，其中V是词表大小
- **Position embedding:** 由于attention机制本身不包含位置信息（打乱token顺序之后，计算结果不变），需要显式注入位置信息。原始Transformer是使用正弦/余弦函数生成位置编码，直接加到token embedding上：
$$
Input = TokenEmbed(x) + PosEncode(position)
$$
经过处理后的输入形状为：$(N_{src}, d_{model})$，其中$N_{src}$即是原始序列长度。

### 2.2 单个Encoder层的数据流
一层Encoder由两个子模块组成，每个子模块外面包裹着add&norm（残差连接和LayerNorm）。数据流如下：

1. 输入 $x$ 分成两路：一路进入 Multi-Head Self-Attention，另一路作为残差直连。
2. 注意力输出与残差相加，再做 LayerNorm（Add & Norm）。
3. 结果再次分成两路：一路进入 FFN，另一路作为第二次残差。
4. FFN 输出与残差相加，再做 LayerNorm，得到该层输出。

原始论文用的是 post-norm（先子层计算，再LayerNorm），即$LayerNorm(x+SubLayer(x))$。当前大模型大多都是pre-norm（先 LayerNorm，后子层计算）。

### 2.3 Encoder self-attention的关键特性
Encoder 中的 Self-Attention 是**双向的（Bidirectional）**——每个 token 可以关注序列中所有其他 token，包括它前面和后面的。

用注意力矩阵来表示（1 表示可以关注，形状 $N_{src}×N_{src}$）：
```
     t0  t1  t2  t3  t4
t0 [  1   1   1   1   1 ]
t1 [  1   1   1   1   1 ]
t2 [  1   1   1   1   1 ]
t3 [  1   1   1   1   1 ]
t4 [  1   1   1   1   1 ]
```

完全的全连接——没有任何遮挡。这意味着即使在第一层 Encoder 中，序列末尾的 token 也能直接影响开头的 token 的表示。经过 N 层 Encoder 之后，每个位置的输出向量实际上聚合了整个输入序列的全局信息。

### 2.4 Encoder多层堆叠的信息流动
原始论文使用 6 层 Encoder 堆叠。关键设计是：**每层的输入和输出维度完全相同**（都是 $(N_{src},d_{model})$）。这使得各层可以像乐高积木一样自由堆叠——你可以用 6 层、12 层甚至 100 层，只要显存放得下。

直觉上理解多层堆叠的意义：每一层做一次”信息混合与加工”。浅层可能学到词法和句法关系（哪些词是搭配的、哪些词修饰哪些词），深层可能学到更抽象的语义关系（指代消解、隐含关系推理）。层数越多，模型捕捉复杂关系的能力越强，但计算成本也线性增长。

## 3. Decoder结构详解

### 3.1 单个Decoder层的数据流
每个 Decoder 层由三个子模块组成（比 Encoder 多一个 Cross-Attention），数据流如下：

1. 输入 $x$ 分成两路：一路进入 Masked Multi-Head Self-Attention，另一路作为残差直连。
2. 注意力输出与残差相加，再做 LayerNorm。
3. 结果进入 Cross-Attention，K、V 取自 Encoder 最后一层的输出；输出再与残差相加并做 LayerNorm。
4. 结果进入 FFN，输出与残差相加并做 LayerNorm，得到该层输出。

### 3.2 Masked Self-Attention：不能偷看未来

Decoder 的 Self-Attention 带有因果掩码（Causal Mask），确保在生成第 $i$ 个 token 时只能看到位置 00 到 $i$，不能看到 $i$ 之后的 token。
```
     t0  t1  t2  t3  t4
t0 [  1   0   0   0   0 ]    只能看自己
t1 [  1   1   0   0   0 ]    能看 t0 和自己
t2 [  1   1   1   0   0 ]    能看 t0, t1 和自己
t3 [  1   1   1   1   0 ]    能看前面所有
t4 [  1   1   1   1   1 ]    能看全部
```

这是一个下三角矩阵。实现上，在 Attention 分数矩阵上加一个上三角的负无穷掩码，softmax 后这些位置的权重就变成零。（也就是加在算了$QK^T$之后，计算softmax之前）

***为什么需要这个掩码？***
因为训练时为了效率，我们会把整个目标序列一次性送入 Decoder 并行计算（称为 Teacher Forcing）。如果不加掩码，模型在预测第 3 个词时就能看到第 4、5 个词——等于”开卷考试”，模型学不到任何预测能力。

### 3.3 Cross-Attention：连接 Encoder 和 Decoder 的桥梁

Cross-Attention 是 Encoder-Decoder 架构中最关键的连接机制。它的计算方式与 Self-Attention 完全相同，唯一的区别是 **Q、K、V 的来源不同**：

- **Q（Query）** 来自 Decoder 当前层的输出——“我想要什么信息”
- **K（Key）和 V（Value）** 来自 Encoder 最后一层的输出——“源序列中有什么信息可供查阅”

$$
\text{CrossAttn}(Q_{dec}, K_{enc}, V_{enc}) = \text{softmax}\left(\frac{Q_{dec} K_{enc}^T}{\sqrt{d_{model}}}\right) V_{enc}
$$

CrossAttn(Qdec,Kenc,Venc)=softmax(QdecKenc⊤dk)VencCrossAttn(Qdec,Kenc,Venc)=softmax(dkQdecKenc⊤)Venc

形状分析：如果源序列长度为 $N_{src}$，目标序列长度为 $N_{target}$，那么：

- $Q_{dec}\in \mathbb{R}^{N_{tgt}\times d_{model}}$
- $K_{enc},V_{enc}\in \mathbb{R}^{N_{src}\times d_{model}}$
- 注意力分数矩阵：($N_{tgt}\times N_{src}$)——不是方阵！

这里的注意力矩阵不需要因果掩码，因为 Decoder 中的每个 token 应该能够关注 Encoder 输出的所有位置——翻译时你需要看到完整的原文。

### 3.4 为什么 Decoder 层有三个子模块

把三个子模块串在一起看，每个子模块的职责分工非常清晰：

| 子模块                   | 输入         | 作用                       | 类比           |
| --------------------- | ---------- | ------------------------ | ------------ |
| Masked Self-Attention | 目标序列自身     | 已生成的词之间互相协调——确保语法通顺、前后一致 | 写作时回顾自己已写的段落 |
| Cross-Attention       | 目标序列 + 源序列 | 生成过程中参考源信息——确保翻译忠实于原文    | 写译文时回头对照原文   |
| FFN                   | 当前 token   | 对综合后的信息做深度非线性加工          | 消化理解后形成自己的表达 |

信息流动的顺序很有讲究：先通过 Self-Attention 整合”自己已有的上下文”，再通过 Cross-Attention 补充”来自输入的信息”，最后通过 FFN 做”深度加工”。这种顺序保证了每个 token 在做出预测时，既考虑了已生成的上文，也充分参考了源输入。

## 4. 架构演化

### 4.1 Encoder-only: BERT
2018 年，Google 发布 BERT（Bidirectional Encoder Representations from Transformers），只保留了 Transformer 的 Encoder 部分，砍掉了 Decoder 和 Cross-Attention。

**核心思想：** 舍弃生成任务，专注“理解”任务，BERT通过MLM（掩码语言模型，随机遮住一些token，让模型预测被遮住的词）来预训练，让模型获得对语言的双向理解能力。
```
输入: "The [MASK] sits on the mat"
      │
      ▼
  Encoder x 12 层 (双向注意力)
      │
      ▼
  每个位置输出一个上下文相关的表示向量
      │
      ▼
  [MASK] 位置 → 预测 "cat" (预训练)
  [CLS] 位置 → 分类标签 (微调)
```

**保留了什么**：双向 Self-Attention + FFN + 残差 + LayerNorm
**去除了什么：** 因果掩码、CrossAttention、自回归生成（只存在于decoder中的部分）
**适用场景：** 文本分类、命名实体识别（NER）、句子相似度、信息抽取——所有需要“理解”但是不用生成的任务

### 4.2 Encoder-Decoder: T5
2019 年，Google 发布 T5（Text-to-Text Transfer Transformer），保留了完整的 Encoder-Decoder 架构，但做了一个重要的范式统一：**把所有 NLP 任务都转化为“文本到文本”的格式**。
```
分类任务:    "classify: The movie is great" → "positive"
翻译任务:    "translate English to German: Hello" → "Hallo"
摘要任务:    "summarize: [长文本]" → "[摘要]"
```

T5 证明了一个有趣的观点：只要输入输出格式统一，同一个 Encoder-Decoder 架构可以处理几乎所有 NLP 任务。后续的 BART、mBART、UL2 等模型也沿袭了这条路线。

**保留了什么**：完整的 Encoder + Decoder + Cross-Attention
**改进了什么**：统一的 text-to-text 训练格式

### 4.3 Decoder-only：GPT 路线

2018 年，OpenAI 发布 GPT（Generative Pre-trained Transformer），只保留了 Transformer 的 Decoder 部分（去掉 Cross-Attention），通过纯粹的”预测下一个 token”来训练。

```
输入: "The cat sits on"
       │
       ▼
  Decoder x N 层 (因果注意力)
       │
       ▼
  最后一个位置的输出 → 预测 "the"
```

**保留了什么**：因果 Self-Attention + FFN + 残差 + LayerNorm
**砍掉了什么**：Encoder、Cross-Attention、双向注意力

从 GPT-1 到 GPT-4，从 LLaMA 到 Mistral、Qwen、DeepSeek，Decoder-only 路线最终成为大模型时代的主流。

## 5. Decoder-only：当前大模型的端到端结构
Decoder-only砍去了Encoder、Cross-Attention、双向注意力，整个模型可以用一个简洁公式描述：
**输入Token -> Embedding -> N层Decoder Block -> 预测下一个Token**

### 5.1 端到端数据流

以一次实际的 LLM 推理为例，跟踪数据从输入到输出的完整流程：

```
用户输入: "什么是注意力机制"

Step 1: Tokenizer 分词
────────────────────
"什么是注意力机制" → [1234, 567, 89, 2345, 678]  (5 个 token ID)

Step 2: Token Embedding
────────────────────
[1234, 567, 89, 2345, 678]
    │
    ▼
W_embed: (vocab_size, d_model)   查表得到每个 token 的向量
    │
    ▼
X: (5, d_model)                  5 个 d_model 维向量

Step 3: L 层 Decoder Block
────────────────────
┌─ Block 1 ─────────────────────────────────────────────┐
│                                                       │
│  x_norm = RMSNorm(X)                                  │
│  attn_out = MaskedSelfAttention(x_norm)  ← 含 RoPE    │
│  H = X + attn_out                        ← 残差连接   │
│                                                       │
│  h_norm = RMSNorm(H)                                  │
│  ffn_out = SwiGLU_FFN(h_norm)                         │
│  X = H + ffn_out                         ← 残差连接   │
│                                                       │
└───────────────────────────────────────────────────────┘
    │                          维度始终保持 (5, d_model)
    ▼
┌─ Block 2 ─────────── ... ───────── Block L ────────────┐
│                                                        │
│  完全相同的结构，重复 L 次                             │
│                                                        │
└────────────────────────────────────────────────────────┘
    │
    ▼
X_final: (5, d_model)

Step 4: Final LayerNorm
────────────────────
X_norm = RMSNorm(X_final)        (5, d_model)

Step 5: LM Head（语言模型头）
────────────────────
logits = X_norm @ W_lm_head      (5, d_model) × (d_model, vocab_size)
                                 = (5, vocab_size)

Step 6: 取最后一个位置，Softmax → 采样
────────────────────
logits[-1]: (vocab_size,)         最后一个 token 位置的输出
    │
    ▼
probabilities = Softmax(logits[-1])
    │
    ▼
next_token = Sample(probabilities)  → 比如采样到"注"

Step 7: 自回归循环
────────────────────
将新 token 拼接到输入末尾，重复 Step 2-6
"什么是注意力机制" + "注" → "什么是注意力机制注"
继续生成... "意" → "力" → "机" → "制" → "是" → ...
```

整个过程的数学表达可以简洁地写成：
$$
P(next\_token∣x_1,x_2,…,x_n)=Softmax(RMSNorm(DecoderBlocks^{(L)}(Embed(x)))W_{lm})
$$

### 5.2 五大组件拆解

把 Decoder-only 模型从头到尾拆成五个功能模块：

#### **5.2.1 Token Embedding**
作用如同一本”单词-向量”对照字典。模型维护一个嵌入矩阵 $W_{emb}\in \mathbb{R}^{V\times d_{model}}$，输入一个 token ID，输出对应行的向量。

- LLaMA-2-7B 的词表大小 $V=32000$，$dmodel=4096$，所以 $W_{emb}$ 有 $32000×4096≈131M$ 参数
- 对比模型总参数 6.7B，Embedding 只占约 2%

#### **5.2.2 Decoder Block 堆叠**
这是模型的”主体”，占据了 95%+ 的参数和计算量。每个 Block 内部的结构在入门篇和后续深入文章中详细讲解，这里只强调几个全局性质：

- **维度守恒**：每个 Block 的输入和输出形状严格相同，都是 $(N,d_{model})$，这使得 Block 可以任意堆叠
- **参数不共享**：每一层的 $W_Q,W_K,W_V,W_O,W_{gate},W_{up},W_{down}$ 都是独立的参数，不同层之间不共享权重
- **层数决定深度**：LLaMA-2-7B 有 32 层，LLaMA-2-70B 有 80 层，层数越多模型越”深”，理论上能捕捉更复杂的模式

#### **5.2.3 Final LayerNorm**
最后一层 Decoder Block 输出后，还有一个单独的归一化层。它的作用是在送入 LM Head 之前稳定数值范围，防止深层网络中数值漂移导致输出分布不稳定。

#### **5.2.4 LM Head（语言模型头）**
一个简单的线性层 $W_{lm}\in \mathbb{R}^{d_{model}\times V}$，将 $d_{model}$ 维的隐藏状态映射到词表大小 $V$ 的 logits 向量。

一个重要的工程优化：**Weight Tying（权重共享）**。许多模型（包括 LLaMA）让 LM Head 的权重直接复用 Token Embedding 的权重矩阵（转置后使用），即 $W_{lm}=W_{emb}^T$。这不仅减少了 131M 参数，而且从语义上也合理——“把向量映射回 token”和”把 token 映射为向量”应该是互逆操作。

#### **5.2.5 Softmax + 采样**
将 logits 转化为概率分布，再根据采样策略（Greedy、Top-k、Top-p、Temperature 等）选出下一个 token。不同的采样策略会显著影响生成质量和多样性——Temperature 越高输出越随机，越低越确定性。

### 5.3 与原始 Encoder-Decoder 的结构对比

把两种架构并排对比，可以清晰看到 Decoder-only 简化了什么：

| 组件                  | Encoder-Decoder           | Decoder-only                      |
| ------------------- | ------------------------- | --------------------------------- |
| Token Embedding     | Encoder 和 Decoder 各有一个    | 只有一个                              |
| Positional Encoding | 加法注入（Sinusoidal）          | 旋转注入（RoPE，在 Attention 时应用）        |
| Self-Attention      | Encoder: 双向 / Decoder: 因果 | 只有因果掩码的 Self-Attention            |
| Cross-Attention     | 有（Decoder 每层都有）           | 无                                 |
| FFN                 | Encoder 和 Decoder 各有      | 每层一个                              |
| LayerNorm 位置        | Post-Norm                 | Pre-Norm（多数大模型）                   |
| 归一化方式               | LayerNorm                 | RMSNorm（多数大模型）                    |
| 输出头                 | Linear + Softmax          | Linear + Softmax（可能 Weight Tying） |

## 6. 从配置文件看真实模型结构

理解了架构之后，我们来看几个真实开源模型的配置，把抽象结构与具体数字对应起来。

### 6.1 LLaMA-2 系列

| 配置项                 | 7B       | 13B      | 70B     |
| ------------------- | -------- | -------- | ------- |
| $d_{model}$（隐藏维度）   | 4096     | 5120     | 8192    |
| $n_{layers}$（层数）    | 32       | 40       | 80      |
| $n_{heads}$（注意力头数）  | 32       | 40       | 64      |
| $d_k$（每头维度）        | 128      | 128      | 128     |
| $d_{ff}$（FFN 中间维度） | 11008    | 13824    | 28672   |
| vocab_size          | 32000    | 32000    | 32000   |
| 总参数量                | 6.7B     | 13B      | 70B     |
| 位置编码                | RoPE     | RoPE     | RoPE    |
| 归一化                 | RMSNorm  | RMSNorm  | RMSNorm |
| FFN 激活              | SwiGLU   | SwiGLU   | SwiGLU  |
| KV 头数               | 32 (MHA) | 40 (MHA) | 8 (GQA) |

注意 70B 模型的一个关键区别：它使用 **GQA（Grouped-Query Attention）**，KV 头数只有 8（而非 64），这意味着每 8 个 Q 头共享一组 KV，大幅减少了推理时的 KV Cache 开销。

### 6.2 从配置反推模型结构

拿到一个模型的配置文件，就能完整还原它的计算图。以 LLaMA-2-7B 为例，逐层展开：

```
输入: token_ids (batch, seq_len)
  │
  ▼
Token Embedding: (32000, 4096)          ← 131M 参数
  │
  ▼
═══════════ Decoder Block × 32 层 ═══════════
  每层包含:
  ├─ RMSNorm_1: (4096,)                ← 4K 参数
  ├─ W_Q: (4096, 4096)                 ← 16.8M 参数
  ├─ W_K: (4096, 4096)                 ← 16.8M 参数
  ├─ W_V: (4096, 4096)                 ← 16.8M 参数
  ├─ W_O: (4096, 4096)                 ← 16.8M 参数
  ├─ RMSNorm_2: (4096,)                ← 4K 参数
  ├─ W_gate: (4096, 11008)             ← 45.1M 参数
  ├─ W_up:   (4096, 11008)             ← 45.1M 参数
  └─ W_down: (11008, 4096)             ← 45.1M 参数

  单层合计: ~201M 参数
  32 层合计: ~6,432M 参数
═══════════════════════════════════════════════
  │
  ▼
Final RMSNorm: (4096,)                  ← 4K 参数
  │
  ▼
LM Head: (4096, 32000)                  ← 131M 参数 (可能与 Embedding 共享)
  │
  ▼
输出: logits (batch, seq_len, 32000)
```

**参数分布**：32 层 Decoder Block 占 6,432M / 6,738M ≈≈ **95.5%** 的参数。模型的”智慧”几乎全部存储在这些 Block 的权重矩阵中。

### 6.3 模型规模与层数/宽度的关系

扩大模型有两个维度——加深（增加层数 $L$）和加宽（增加隐藏维度 $d_{model}$）。参数量的粗略公式为：

$$
Params≈L\times (12\cdot d_{model}^2)+2\cdot V\cdot d_{model}
$$

其中 $12\cdot d_{model}^2$ 是单层 Decoder Block 的参数量（4 个 Attention 矩阵 + SwiGLU 的 3 个矩阵约等于 $4d^2+3\times \frac{8}{3}d^2=12\cdot d^2$），$2\cdot V\cdot d_{model}$ 是 Embedding 与 LM Head 的参数量（LLaMA 系列两者不共享权重；若像 GPT-2、Gemma 那样 tie embedding，则只算一份 $\cdot V\cdot d_{model}$）。

从表中可以观察到一个规律：
- 7B → 13B：层数从 32 增到 40（+25%），宽度从 4096 增到 5120（+25%），参数量约翻倍
- 13B → 70B：层数从 40 增到 80（+100%），宽度从 5120 增到 8192（+60%），参数量增长 5.4 倍
参数量对宽度是二次方关系、对深度是线性关系，因此加宽比加深对参数增长的影响更大。

> AI Infra 关联：这个二次方关系直接影响显存规划和并行策略。宽度翻倍意味着每层参数量翻四倍，单张卡可能放不下一层——这时需要张量并行（Tensor Parallelism）在层内切分。层数翻倍则可以用流水线并行（Pipeline Parallelism）在层间切分。实际部署中往往需要两者结合。

## 7. 三种架构的工程特性对比

从 AI Infra 工程师的视角，三种架构在系统设计上有显著差异。

### 7.1 计算特性对比

| 维度       | Encoder-only     | Encoder-Decoder                                                                        | Decoder-only        |
| -------- | ---------------- | -------------------------------------------------------------------------------------- | ------------------- |
| 注意力复杂度   | $O(N^2)$，N 为输入长度 | Encoder: $O(N_{src}^2)$ + Cross: $O(N_{tgt}\cdot N_{src})$ + Decoder: $O(N_{tgt}^2)$ | $O(N^2)$，N 为已生成序列长度 |
| 推理模式     | 单次前向传播（非自回归）     | 自回归生成（Decoder 部分）                                                                      | 自回归生成               |
| KV Cache | 不需要（不做生成）        | Encoder KV + Decoder KV 两套                                                             | 一套 Decoder KV       |
| 典型推理延迟   | 毫秒级（分类任务）        | 较高（两个组件）                                                                               | 取决于生成长度             |

### 7.2 并行策略差异

| 并行方式      | 切分维度              | Encoder-Decoder                                                  | Decoder-only         |
| --------- | ----------------- | ---------------------------------------------------------------- | -------------------- |
| 张量并行（TP）  | $d_{model}$/heads | Encoder 和 Decoder 需要各自切分，Cross-Attention 的 KV 来自 Encoder，通信模式更复杂 | 每层结构一致，切分方式统一，通信模式简单 |
| 流水线并行（PP） | layer             | 需要决定 Encoder 和 Decoder 各占多少 stage，负载均衡更困难                        | 所有层结构相同，均匀切分即可       |
| 序列并行（SP）  | $S$(token序列长度)    | 两侧序列（一个是原始序列长度，一个是已生成序列长度）长度可能不同，需要分别处理                          | 只有一个序列维度，处理统一        |

### 7.3 为什么 Decoder-only 对工程最友好

除了模型效果之外，Decoder-only 成为大模型主流还有深刻的工程原因：

**架构统一性**。整个模型只有一种 Block 结构反复堆叠，这意味着：
- CUDA kernel 只需要优化一套（同样的 Attention kernel、同样的 FFN kernel 复用 L 次）
- 并行策略只需要设计一次（不需要 Encoder/Decoder 分别调度）
- 性能分析和瓶颈定位更简单（任意一层的特性代表所有层）

**KV Cache 管理简单**。只有一套 KV Cache 需要管理，PagedAttention 等优化技术可以直接应用，不需要处理 Encoder 输出的缓存和 Decoder KV Cache 的两套数据。

**Scaling 路径清晰**。想要更大的模型？增加层数、增加宽度、增加头数——三个旋钮，效果可预测。不需要纠结 Encoder 和 Decoder 的比例分配。

**训练数据利用率高**。“预测下一个 token” 的训练目标意味着每个 token 都产生一个训练信号（loss），数据利用率较高。而 Encoder-Decoder 的训练信号只在 Decoder 部分产生，Encoder 的梯度**间接依赖** Decoder 的 loss 回传，信号经过 Cross-Attention 多层传递后衰减，导致 Encoder 收敛更慢、对学习率更敏感。
