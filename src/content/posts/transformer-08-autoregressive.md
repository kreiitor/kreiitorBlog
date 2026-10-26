---
title: "自回归生成"
description: "从 next-token 预测到 KV Cache：自回归生成的计算过程。"
pubDate: 2026-10-26
tags:
  - "Transformer"
  - "自回归"
  - "学习笔记"
category: course
series: transformer
order: 8
cover: /covers/series-deep-learning.svg
---

## 1. 自回归生成机制

### 核心循环

每一步用已有的token序列做一次前向传播,取最后一个位置的输出预测下一个token,然后把新token追加到序列中循环进行

### 停止条件

- eos token: end of sequence
- 最大长度达到
- 停止字符串:生成了特定的字符串

## 2. Token 采样策略

模型输出的是一个概率分布，从中选取下一个 token 的方式有多种。不同策略直接影响生成文本的质量和多样性。

### 2.1 Greedy Decoding（贪心解码）

每一步都选概率最大的 token：

```
next_token = torch.argmax(probs)
```

优点是确定性强、速度快；缺点是容易陷入重复循环（同一个短语反复出现），生成内容单调。适合需要确定性输出的场景（如代码补全、格式化输出）。

### 2.2 Temperature 缩放

在 softmax 之前对 logits 除以一个温度参数 T：

```
probs = softmax(logits / T)
```

温度的作用像一个”旋钮”，控制概率分布的”尖锐程度”：

| 温度值        | 效果                  | 类比                    |
| ---------- | ------------------- | --------------------- |
| T<1（如 0.3） | 分布变尖锐，高概率 token 更突出 | 谨慎保守的作者，倾向选最安全的词      |
| T=1        | 原始分布，不做调整           | 正常发挥                  |
| T>1（如 1.5） | 分布变平坦，低概率 token 被拉高 | 天马行空的创作者，更愿意冒险选”意外”的词 |
| T→0        | 退化为 greedy decoding | 只选最确定的那个              |
| T→∞        | 退化为均匀分布             | 完全随机                  |

### 2.3 Top-K 采样

只保留概率最高的 K 个 token，将其余 token 的概率置零后重新归一化：

```
topk_probs, topk_indices = torch.topk(probs, k=50)
topk_probs = topk_probs / topk_probs.sum()  # 重新归一化
next_token = topk_indices[torch.multinomial(topk_probs, 1)]
```

Top-K 的问题在于 K 是固定的。有时候概率分布很集中（只有 2-3 个合理选项），K=50 就引入了太多噪声；有时候分布很分散（很多 token 都合理），K=50又太限制了。

### 2.4 Top-P 采样（Nucleus Sampling）

一种自适应的方案：按概率从大到小排列 token，累加概率直到超过阈值 P（如 0.9），只在这个”核”内采样：

```
sorted_probs, sorted_indices = torch.sort(probs, descending=True)
cumsum_probs = torch.cumsum(sorted_probs, dim=0)
# 找到累积概率刚好超过 p 的位置
cutoff = (cumsum_probs > p).nonzero(as_tuple=True)[0][0]
# 只保留 cutoff 之前的 token
nucleus_probs = sorted_probs[:cutoff + 1]
nucleus_probs = nucleus_probs / nucleus_probs.sum()
next_token = sorted_indices[torch.multinomial(nucleus_probs, 1)]
```

Top-P 的优势在于自适应性：分布集中时自动缩小候选集，分布分散时自动扩大候选集。这就像点菜——如果菜单上有一道特别想吃的（概率集中），你直接点就好；如果好几道都不错（概率分散），你可以从更大的范围里挑。

实际使用中，Temperature + Top-P 的组合最为常见，比如 `temperature=0.7, top_p=0.9`。

## 3. Prefill 阶段：一次吃下整个 Prompt

### 3.1 Prefill 的计算过程

当用户发送一个请求给 LLM，推理过程首先进入 **Prefill（预填充）阶段**。这个阶段的任务是处理用户输入的整个 prompt，计算出所有 prompt token 的 Key 和 Value 并缓存起来，同时输出第一个生成 token。

假设 prompt 有 1000 个 token。Prefill 阶段将这 1000 个 token 一次性送入 Transformer，所有 token 并行经过每一层的 Self-Attention 和 FFN 计算：

```
Prompt: [t_1, t_2, ..., t_1000]  （1000 个 token）
→ 一次前向传播
→ 每一层计算 Q, K, V（都是 1000 个 token 的）
→ 缓存所有层的 K, V
→ 输出位置 1000 的 logits → 采样得到第一个生成 token
```

### 3.2 为什么 Prefill 是 Compute Bound

Prefill 阶段的核心操作是大矩阵乘法。以 Attention 中的 `Q @ K^T` 为例：

```
Q: (1000, 128)  K^T: (128, 1000)  → 结果: (1000, 1000)
```

这是一个较大的矩阵乘法，GPU 的计算核心（Tensor Core）可以满载运行。矩阵乘法的计算量大，GPU 在计算上花的时间远超从显存搬运数据的时间，因此性能瓶颈在算力（compute），而非带宽（memory bandwidth）。

用 Roofline 模型的术语说，Prefill 的**算术强度（Arithmetic Intensity）** 很高——每从显存搬一个字节的数据，能做很多次运算。这恰好是 GPU 擅长的领域。

### 3.3 TTFT：用户感知的第一个指标

Prefill 阶段的耗时决定了 **TTFT（Time To First Token，首 Token 延迟）**——从用户发出请求到看到第一个输出字符的时间。

对于长 prompt（如上传一篇论文让模型总结），TTFT 可能达到数秒甚至十几秒。优化 TTFT 的思路包括：

- **Chunked Prefill**：将长 prompt 分成多个 chunk 分批处理，而不是一次性吃下。这样可以在处理 prompt 的同时穿插其他请求的 Decode 步骤，提升整体系统吞吐。但注意，Chunked Prefill 不会让单个请求的 TTFT 更快——它更多是系统级的调度优化
- **Prefix Cache / Prompt Cache**：如果多个请求共享相同的 system prompt（如”你是一个有帮助的助手”），可以预计算并缓存这部分的 KV，后续请求直接复用，跳过这段 prompt 的 Prefill 计算

## 4. Decode 阶段：逐字蹦出答案

### 4.1 Decode 的计算过程

Prefill 完成后，模型进入 **Decode（解码）阶段**，开始逐个生成输出 token。每一步只处理 1 个新 token：

```
Step 1: 新 token 的 Q (1, 128) × 缓存的 1001 个 K → Attention → 生成 token_1001
Step 2: 新 token 的 Q (1, 128) × 缓存的 1002 个 K → Attention → 生成 token_1002
...
```

每一步只需要计算新 token 的 Q、K、V（1 个 token 的线性投影），然后用新 Q 和所有历史 K 做 Attention，新的 K、V 追加到缓存中。

### 4.2 为什么 Decode 是 Memory Bound

Decode 阶段最核心的变化是：矩阵乘法退化为**矩阵-向量乘法**。

```
Prefill: Q (1000, 128) × K^T (128, 1000) = 矩阵 × 矩阵 → GPU 满载
Decode:  Q (1, 128)    × K^T (128, 1001) = 向量 × 矩阵 → GPU 空转
```

矩阵-向量乘法的计算量很小，但需要从显存中搬运的数据量并没有按比例减少——整个 K 矩阵 `(1001, 128)` 和权重矩阵仍然需要从 HBM 搬到计算核心。GPU 的计算核心在等数据到来的过程中大部分时间处于空闲状态。

打个比方，Prefill 阶段像一条高速运转的流水线，原材料（数据）源源不断地到来，工人（计算核心）忙个不停；Decode 阶段像只有一件零件需要加工，工人只干了一下就得等下一件零件从仓库搬过来，大部分时间在等待。

这就是为什么 Decode 的瓶颈在**显存带宽（Memory Bandwidth）** 而非算力——我们称之为 **Memory Bound**。

### 4.3 TPOT：决定用户体验的流畅度

Decode 阶段每一步的耗时决定了 **TPOT（Time Per Output Token，每 Token 延迟）**——用户看到输出文字”蹦出来”的速度。

人类的阅读速度大约是每秒 5-10 个词（约 7-15 个 token），因此 TPOT 在 50-100ms 以内就能给用户”实时输出”的流畅感。如果 TPOT 超过 200ms，用户会明显感到卡顿。

### 4.4 Continuous Batching

传统的 static batching 要求同一 batch 内所有请求同时开始、同时结束。长请求没结束前，短请求完成后的 GPU 资源就浪费了。

**Continuous Batching（连续批处理）** 的思想是：不再以请求为单位进行 batching，而是以 iteration（单步 Decode）为单位。每一步 Decode 结束后，完成的请求立即释放资源，新请求可以立即加入。

这就像银行叫号系统：传统方式是等一批人全办完才叫下一批，连续批处理是一个窗口空了就立刻叫下一个号。

Continuous Batching 由 Orca 系统首先提出，后来被 vLLM、SGLang、TensorRT-LLM 等推理引擎广泛采用，极大地提升了 GPU 的利用率和系统吞吐。

---

## 5. KV Cache 深度解析

### 5.1 为什么需要 KV Cache

回顾自回归生成的过程：每一步 Decode，新 token 的 Q 需要和所有历史 token 的 K 做内积来计算 Attention 权重。如果不做任何缓存，每一步都需要重新对所有历史 token 做 QKV 线性投影——但这些投影在之前的步骤中已经算过了。

打个比方，你在银行办理业务，每换一个窗口都要重新排队、重新提交所有材料。KV Cache 的做法是：你第一次提交的材料都存了档，之后换窗口只需报个编号就能调档，不必重新准备。

把已经计算好的 K 和 V 缓存在 GPU 显存中，每步 Decode 只需计算新 token 自己的 K、V 并追加到缓存，就把 QKV 投影的重复计算从 O(N) 降到了 O(1)。

### 5.2 有无 KV Cache 的计算量对比

用一个简单的数学对比来说明 KV Cache 的价值。设当前已生成序列长度为 nn，每个 token 经过 QKV 投影的单 token 计算量为 3dmodel^2（三个矩阵乘法），单个 Query 与所有缓存 Key/Value 交互的 Attention 计算量为 O(n⋅dmodel)。下面对比生成 NN 个 token 的累计代价（忽略层数 LL 这个公共因子）。

**❌ 无 KV Cache——每步把整个前缀（n 个 token）重新喂入模型**：

>没有KVcache,第i个token的第l层的kv要重新算,那么就需要第l-1层的输出结果,那么第l-1层的全部计算走一遍

每步有 n 个 Query，每个 Query 又要对 n 个 Key 做注意力，因此 Attention 计算量是 n2⋅d。

| 步骤      | QKV 投影计算量            | Attention 计算量   |
| ------- | -------------------- | --------------- |
| Step 1  | 1⋅3d2                | 12⋅d            |
| Step 2  | 2⋅3d2                | 22⋅d            |
| Step n  | n⋅3d2                | n2⋅d            |
| 总计（N 步） | 3d2⋅N(N+1)/2=O(N2d2) | ∑n=1Nn2d=O(N3d) |

**⭕ 有 KV Cache——每步只计算 1 个新 token 的 QKV**：

每步只有 1 个 Query，与已缓存的 nn 个 K/V 做注意力。

| 步骤      | QKV 投影计算量    | Attention 计算量      |
| ------- | ------------ | ------------------ |
| Step n  | 1⋅3d2        | n⋅d（仍需和所有缓存 K 做内积） |
| 总计（N 步） | N⋅3d2=O(Nd2) | O(N2d)             |

KV Cache 将 QKV 投影的总计算量从 O(N2d2) 降到了 O(Nd2)，节省 N 倍；Attention 总计算量从 O(N3d)降到了O(N2d)，同样节省 N 倍。在长序列下这是数量级的差异。

### 5.3 KV Cache 的数据结构

KV Cache 是一组张量，为模型的每一层存储所有已处理 token 的 Key 和 Value。数据结构如下：

```
# 对每一层 layer_i，维护两个张量：
kv_cache = {
    layer_0: {
        'key':   tensor of shape (batch_size, num_kv_heads, current_seq_len, head_dim),
        'value': tensor of shape (batch_size, num_kv_heads, current_seq_len, head_dim),
    },
    layer_1: { ... },
    ...
    layer_31: { ... },
}
```

每一步 Decode 时，新 token 的 K 和 V 追加到 `current_seq_len` 维度上：

```
# 计算新 token 的 K, V
new_k = linear_k(new_hidden_state)  # (batch, num_kv_heads, 1, head_dim)
new_v = linear_v(new_hidden_state)  # (batch, num_kv_heads, 1, head_dim)

# 追加到缓存
kv_cache[layer_i]['key'] = torch.cat([kv_cache[layer_i]['key'], new_k], dim=2)
kv_cache[layer_i]['value'] = torch.cat([kv_cache[layer_i]['value'], new_v], dim=2)

# Attention 使用完整缓存
attn_output = attention(new_q, kv_cache[layer_i]['key'], kv_cache[layer_i]['value'])
```

### 5.4 KV Cache 显存计算

KV Cache 的显存占用可以用一个通用公式计算：

KV Cache 显存=2×L×n_kv×d_h×N×B×be

其中：

- 2：K 和 V 各一份
- L：层数（num_layers）
- nkv​：KV 的头数（MHA 等于 num_heads，GQA 等于 num_kv_groups）
- dh​：每个头的维度（head_dim）
- N：序列长度（seq_len）
- B：批大小（batch_size）
- be​：每个元素的字节数，FP16 为 2 字节，FP8 为 1 字节

以几种典型配置为例：

|模型|层数|KV 头数|dhdh​|每 token KV Cache (FP16)|4K 序列长度|128K 序列长度|
|---|---|---|---|---|---|---|
|LLaMA-2-7B (MHA)|32|32|128|512 KB|2 GB|64 GB|
|LLaMA-2-7B (GQA-8)|32|8|128|128 KB|0.5 GB|16 GB|
|LLaMA-3-8B (GQA-8)|32|8|128|128 KB|0.5 GB|16 GB|
|LLaMA-2-70B (GQA-8)|80|8|128|320 KB|1.25 GB|40 GB|

从表格中可以直观地看到：

1. **GQA 大幅减少 KV Cache**：从 MHA 的 32 个 KV 头减少到 8 个，KV Cache 缩小 4 倍
2. **长上下文是显存杀手**：128K 序列长度下，单请求的 KV Cache 就可能吃掉一整张 GPU 的显存
3. **Batch 放大效应**：如果同时服务 16 个请求，上表数字再乘以 16

### 5.5 显存碎片化问题

KV Cache 有一个棘手的工程问题：**动态增长导致的显存碎片化**。

不同请求的序列长度不同，KV Cache 大小不一。随着请求不断到来和完成，显存中会出现大量”空洞”——总空闲显存足够，但没有一块连续区域能放下新请求的 KV Cache。这就像停车场里车位很多，但都是零散的单个车位，无法停进一辆需要两个连续车位的大车。

传统做法是为每个请求预分配最大序列长度的 KV Cache 空间，但这会造成极大的浪费——大多数请求远远用不满最大长度。这正是 PagedAttention 要解决的核心问题。

## 6. KV Cache 优化技术全景

### 6.1 PagedAttention：借鉴操作系统的虚拟内存

PagedAttention 是 vLLM 推理引擎的核心创新，其思想直接来源于操作系统的**虚拟内存分页机制**。

操作系统面对的问题和 KV Cache 管理几乎一模一样：不同进程需要不同大小的内存，随着进程的创建和销毁，物理内存中出现碎片。操作系统的解决方案是：不再给每个进程分配连续的物理内存，而是把物理内存划分为固定大小的”页”（page），通过页表将虚拟地址映射到不连续的物理页。

PagedAttention 做的是同一件事：

1. **分页**：将 GPU 显存划分为固定大小的 Block（如每个 Block 存储 16 个 token 的 KV）
2. **按需分配**：请求开始时只分配少量 Block，随着生成过程推进逐步追加新 Block
3. **不要求连续**：同一个请求的 KV Cache 可以分散在不连续的显存 Block 中，通过一个 Block Table（类似页表）记录映射关系
4. **内存回收**：请求完成后立即释放 Block，供其他请求使用

```
传统方式（预分配连续显存）：
请求 A: [████████░░░░░░░░]  ← 预分配 max_len，大量浪费
请求 B: [██████████░░░░░░]

PagedAttention（分页管理）：
Block 池: [A1][B1][A2][B2][A3][空][B3][空][空]...
Block Table A: [1, 3, 5]   ← 请求 A 的 KV 分散在 Block 1, 3, 5
Block Table B: [2, 4, 7]   ← 请求 B 的 KV 分散在 Block 2, 4, 7
```

PagedAttention 的效果非常显著：实验表明它可以将 KV Cache 的显存利用率从约 20-40% 提升到接近 100%，在相同显存下支持 2-4 倍的并发请求数。

### 6.2 Prefix Cache / Prompt Cache

很多场景下，多个请求共享相同的前缀——比如相同的 system prompt（“你是一个有帮助的 AI 助手，请…”）。为每个请求都重新计算这段前缀的 KV 是浪费的。

Prefix Cache 的做法是：将公共前缀的 KV Cache 计算一次并缓存，后续有相同前缀的请求直接复用这份缓存，只需要对各自不同的后缀部分做 Prefill。

SGLang 的 **RadixAttention** 更进一步，用一棵 Radix Tree（基数树）来管理所有请求的前缀共享关系，实现了更精细的缓存复用。

### 6.3 KV Cache 量化

既然 KV Cache 是显存大户，一个直接的优化思路是用更低精度存储：

|精度|每个元素字节数|相对于 FP16 的压缩比|精度损失|
|---|---|---|---|
|FP16|2|1x（基线）|无|
|FP8 (E4M3)|1|2x|极小|
|INT8|1|2x|小|
|INT4|0.5|4x|中等|

KV Cache 量化的挑战在于：Attention 计算对 Key 的数值精度比较敏感（因为 Q 和 K 的内积直接决定了注意力权重的分配），而对 Value 的精度相对宽容一些。因此一些方案会对 K 和 V 使用不同的量化策略。

### 6.4 GQA / MQA 减少 KV 头数

从模型架构层面减少 KV Cache 的大小：

- **MHA（Multi-Head Attention）**：每个注意力头都有独立的 K 和 V，KV 头数等于总头数
- **MQA（Multi-Query Attention）**：所有注意力头共享一组 K 和 V，KV 头数为 1
- **GQA（Grouped-Query Attention）**：每 GG 个头共享一组 K 和 V，KV 头数为 总头数/GG

以 32 头模型为例：MHA 有 32 组 KV，GQA-8 有 4 组 KV（减少 8 倍），MQA 有 1 组 KV（减少 32 倍）。KV Cache 的大小与 KV 头数成正比，因此 GQA/MQA 对推理的显存节省效果非常显著。

### 6.5 Sliding Window Attention

Mistral 模型引入了**滑动窗口注意力**：每个 token 只关注最近 W 个 token（如 W=4096），而非全部历史。这意味着 KV Cache 只需要保留最近 W 个 token 的 K、V，超出窗口的可以丢弃。

KV Cache 从 O(N) 变为 O(W)，对超长序列的显存节省巨大。但代价是模型无法直接访问窗口之外的远距离信息（需要依靠多层堆叠间接传递）。

### 6.6 Token Eviction / Token Dropping

更激进的策略：在 KV Cache 达到容量上限时，主动丢弃一些”不重要”的 token 的 KV。

判断 token 重要性的方法包括：

- **基于 Attention 分数**：累积 Attention 权重较低的 token 可能不太重要（H2O: Heavy-Hitter Oracle）
- **基于位置**：保留开头的 token（通常是 system prompt，有”attention sink”现象）和最近的 token，丢弃中间的
- **基于语义**：保留关键的实体、数字等 token

---

## 7. 系统级推理优化

### 7.1 Prefill/Decode 解耦

前面分析过，Prefill 是 Compute Bound，Decode 是 Memory Bound——两者对硬件的需求截然不同。把它们放在同一组 GPU 上运行，意味着硬件配置只能”折中”，两边都不是最优。

**Prefill/Decode 解耦**的思想（DistServe、Splitwise 等提出）是：将 Prefill 和 Decode 分别部署在不同的 GPU 池上：

- **Prefill 池**：配置高算力 GPU，专门处理输入 prompt 的计算
- **Decode 池**：配置高带宽 GPU（或更多更便宜的 GPU），专门处理逐 token 生成

Prefill 完成后，将 KV Cache 传输到 Decode 池继续生成。这样两个池各自针对性优化，整体效率更高。

### 7.2 Speculative Decoding（投机解码）

自回归生成的根本瓶颈是串行——每步必须等前一步完成才能开始。投机解码试图打破这个限制：

1. 用一个**小模型**（Draft Model，如 7B 对应的 1B 蒸馏版本）快速生成 K 个候选 token（如 K=5）
2. 将这 K 个候选 token 一次性送入**大模型**（Target Model）做并行验证
3. 大模型检查每个位置小模型的预测是否与自己一致：
    - 一致的 token 直接接受
    - 不一致的地方由大模型重新采样，后续候选全部丢弃

如果小模型的猜测准确率较高（比如 70-80% 的 token 能被接受），一次验证就能确认多个 token，等效于一步生成了多个 token，将 Decode 吞吐提升数倍。

关键约束是：投机解码必须保证生成结果与大模型独立生成完全一致（从概率分布意义上），不会牺牲质量。

### 7.3 Tensor Parallelism 在推理中的应用

推理时的张量并行与训练时的切分方式相同（沿 Attention 头和 FFN 矩阵切分），但目标不同：

- 训练时：切分是为了让大模型装进多张卡（显存限制）
- 推理时：切分是为了降低单步延迟（多卡并行计算，减少 TPOT）

但张量并行也带来了通信开销（每一步 Decode 都需要 AllReduce），因此通常限制在同一节点内的 GPU 之间（NVLink 高速互连），跨节点更适合用流水线并行。

## 8. 推理性能指标体系

理解推理性能需要一套完整的指标体系，不同角色关心不同指标：

### 8.1 延迟指标（用户视角）

|指标|全称|含义|典型目标|
|---|---|---|---|
|TTFT|Time To First Token|从请求发出到收到第一个输出 token|< 500ms|
|TPOT|Time Per Output Token|每个输出 token 的生成间隔|< 100ms|
|E2E Latency|End-to-End Latency|从请求发出到完整响应返回|取决于生成长度|

关系：`E2E Latency = TTFT + TPOT * (output_length - 1)`

### 8.2 吞吐指标（系统视角）

|指标|含义|优化方向|
|---|---|---|
|Tokens/s|系统每秒处理的总 token 数|增大 batch_size、提升 GPU 利用率|
|Requests/s|系统每秒完成的请求数|Continuous Batching、减少排队等待|
|GPU Utilization|GPU 计算核心的利用率|增大 batch_size（Decode 阶段往往很低）|

### 8.3 效率指标（成本视角）

|指标|含义|计算方式|
|---|---|---|
|$/1K tokens|每千 token 的推理成本|GPU 成本 / 总处理 token 数|
|Tokens/$/hour|每美元每小时处理的 token 数|吞吐量 / GPU 小时成本|

延迟和吞吐往往存在权衡（trade-off）：增大 batch_size 能提升吞吐（更多请求并行处理），但会增加单请求的 TPOT（每步需要处理更多 token 的 KV Cache）。推理系统的调优是在延迟 SLA 约束下最大化吞吐。

## 📝 总结

本文从语言模型的数学本质出发，完整剖析了 LLM 自回归生成的全链路：

1. **语言模型本质**：建模条件概率分布 P(xt∣x1,…,xt−1)
2. **自回归循环**：逐步预测 + 采样 + 追加，直到停止条件
3. **采样策略**：Temperature 控制随机性，Top-K/Top-P 控制候选范围
4. **Prefill 阶段**：并行处理 prompt，Compute Bound，决定 TTFT
5. **Decode 阶段**：逐 token 生成，Memory Bound，决定 TPOT
6. **KV Cache**：避免重复计算 K/V，以空间换时间
7. **KV Cache 优化**：PagedAttention（分页管理）、Prefix Cache（前缀复用）、量化（低精度存储）、GQA（减少头数）
8. **系统级优化**：Continuous Batching、Prefill/Decode 解耦、Speculative Decoding

对于 AI Infra 工程师来说，理解这些推理机制是设计和优化推理系统的基础。每一项优化技术都源于对推理过程某个环节的深入分析——Prefill 的 Compute Bound 催生了 Chunked Prefill，Decode 的 Memory Bound 催生了 Speculative Decoding，KV Cache 的显存压力催生了 PagedAttention 和量化技术。

---

### 自我检验清单

- 能解释自回归生成的数学本质，写出联合概率的链式分解公式
- 能说清 Prefill 和 Decode 两阶段的计算特性差异，以及为什么一个是 Compute Bound 另一个是 Memory Bound
- 能用通用公式计算给定模型配置下的 KV Cache 显存占用
- 能估算 LLaMA-2-7B 在 4096 序列长度、batch_size=16 下的 KV Cache 显存（约 32 GB）
- 能解释 PagedAttention 的核心思想，以及它如何解决显存碎片化问题
- 能区分 Temperature、Top-K、Top-P 三种采样策略的作用和适用场景
- 能解释 Speculative Decoding 如何在不牺牲质量的前提下加速生成
- 能说出 TTFT、TPOT、Throughput 三个指标的含义和它们之间的关系
