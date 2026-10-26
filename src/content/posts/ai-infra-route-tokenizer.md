---
title: "Tokenizer"
description: "分词器的目标、BPE 与词表设计，以及 tokenizer 对模型输入的影响。"
pubDate: 2026-10-26
tags:
  - "AI Infra"
  - "Tokenizer"
  - "CS336"
category: course
series: ai-infra-route
order: 2
cover: /covers/series-ai-infra.svg
---

## 0.分词器大观

分词器的几个要求：
- 要能保证tokens2ids和ids2tokens可逆，不能是单向的
- 要保证压缩比，这样才能用相对少的token，毕竟注意力机制是$O(N^2)$
- 虽然扩展词表可以保证压缩比，但是词表太大又会产生稀疏性问题

## 1.Character Tokenizer

构建一个字符分词器：
```python
class CharTokenizer:
    """Unicode 字符级分词器"""

    def __init__(self):
        # Unicode 最大码点为 0x10FFFF，实际常用 < 0x30000
        self.vocab_size = 0x110000  # 1,114,112

    def encode(self, text: str) -> list[int]:
        return [ord(c) for c in text]

    def decode(self, ids: list[int]) -> str:
        return "".join(chr(i) for i in ids)

    @property
    def is_reversible(self) -> bool:
        return True  # ord/chr 严格可逆
```
- 对于 Python，可以用 `ord` 把 Unicode 字符转换为编码，再用 `chr` 逆过程
- 这样就实现了一个 Unicode 符号个数大小的词表（理论上限 ~1.1M，实际分配 ~150k+）
    - **词表利用率极低**：自然文本中活跃字符通常 < 5 万，大量码点对应的 Embedding 永远不被更新
    - **压缩比不高**：TPC ≈ 1.0，英文序列长度是 BPE 的 3–4 倍

## 2. Byte Tokenizer

构建一个字节级分词器：
```python
class ByteTokenizer:
    """UTF-8 字节级分词器"""

    def __init__(self):
        self.vocab_size = 256  # 固定 256 个字节

    def encode(self, text: str) -> list[int]:
        return list(text.encode("utf-8"))

    def decode(self, ids: list[int]) -> str:
        return bytes(ids).decode("utf-8")

    @property
    def is_reversible(self) -> bool:
        return True  # UTF-8 encode/decode 严格可逆
```
- 可以用python中字符串的encode，decode方法进行编解码
- 词表大小固定为 **256**，彻底消除稀疏性问题，每个 byte embedding 都能被充分训练
- 完美可逆，支持任意二进制数据（代码、图片 base64、多语言混合）
- **压缩比仍然低**：
    - 英文：BPT = 1.0（ASCII 每字符 1 byte → 1 token），TPC ≈ 1.0
    - 中文：BPT ≈ 3.0（CJK 每字符 3 bytes → 3 tokens），TPC ≈ 3.0
    - 相比 BPE 仍有 3–5× 的序列长度劣势

## 3.Word Tokenizer

- 类似NLP任务的做法，使用空格或者某些正则表达式将一个句子切分成块
- 这样可以保证每个token有意义，毕竟是人类发明的词语
- 但是词表的大小不可预测，随语料可能变化剧烈
- 这样的方法，压缩率很高
- 并且遇到了训练时没被见过的token就很糟糕

## 4.BPE Tokenizer

**关键思想：**
首先训练数据中的每个字节作为一个token，然后使用贪心策略将出现频率最高的相邻字节对合并。

若干问题：

- 会一直迭代合并下去吗？
	- 不会，会有最大词表大小限制，或者最小合并频率和最大token长度限制
- 没有意义的中间token如何处理？（例如学习low过程中的lo）
	- 不会丢弃，因为中间过程的这些“无意义”的token是对没见过的词或者乱码防止OOV的关键所在
	- 并且“意义”是模型考虑的，分词器只负责压缩，模型负责“理解”

> **关键结论**
>
> - Char Tokenizer 和 Byte Tokenizer **都不适合单独作为 LLM 分词器**，核心价值在于作为**评估基准**和**BPE/Unigram 的兜底机制**。
> - Byte Tokenizer 优于 Char Tokenizer：词表极小、无稀疏、跨语言公平、二进制安全。这也是为什么现代分词器（GPT-2+, Llama, Qwen）全部采用 **Byte-level BPE** 而非 Char-level BPE。
> - BPE是现在大模型较多使用的分词方法，除此以外还有wordpiece方法
## 附录
### A.压缩比公式
#### 1. 每字符 Token 数（Tokens Per Character, TPC）

$$
\text{TPC} = \frac{N_{\text{tokens}}}{N_{\text{chars}}}
$$

-   $N_{\text{tokens}}$：分词后的 token 数量
-   $N_{\text{chars}}$：原始文本的 Unicode 字符数（`len(text)`）
-   **含义**：平均每个字符消耗的 token 数，值越小压缩越好
-   **适用场景**：单语言内部比较、快速诊断

#### 2. 字节级压缩率（Bytes Per Token, BPT）

$$
\text{BPT} = \frac{N_{\text{bytes}}}{N_{\text{tokens}}}
$$

-   $N_{\text{bytes}}$：原始文本的 UTF-8 字节数（`len(text.encode('utf-8'))`）
-   $N_{\text{tokens}}$：分词后的 token 数量
-   **含义**：平均每个 token 承载的字节数，值越大压缩越好
-   **适用场景**：跨语言公平比较、多语言分词器评估（推荐首选）

#### 3. 相对压缩倍数（Compression Ratio vs Baseline）

$$
\text{CR} = \frac{N_{\text{tokens}}^{\text{(baseline)}}}{N_{\text{tokens}}^{\text{(target)}}}
$$

-   $N_{\text{tokens}}^{\text{(baseline)}}$：基线分词器（如 Unicode 字符级 / Byte-level）对同一文本产生的 token 数
-   $N_{\text{tokens}}^{\text{(target)}}$：目标分词器对同一文本产生的 token 数
-   **含义**：目标分词器相对于基线的压缩提升倍数
-   **注意**：CR > 1 表示优于基线；CR ≈ 1 表示无压缩收益

#### 4. 信息熵压缩效率（可选，理论分析用）

$$
\eta = \frac{H(\text{text})}{\bar{l} \cdot \log_2 |V|}
$$

-   $H(\text{text})$：文本的信息熵（bits/char）
-   $\bar{l}$：平均 token 长度（chars/token），即 $1 / \text{TPC}$
-   $|V|$：词表大小
-   **含义**：实际编码效率与理论最优的比值，$\eta \leq 1$
-   **适用场景**：学术研究、分词器理论上限分析

> **实践建议**
> -   工程评估优先使用 **BPT**（跨语言公平）+ **TPC**（直观）
> -   始终注明测试语料来源与规模，脱离语料的压缩比无意义
> -   报告时建议同时给出均值与分位数（如 P50/P95），避免长尾样本掩盖问题
