---
title: "AI Infra 概览"
description: "从系统工程的角度理解 AI Infra 的问题边界、三层结构和学习顺序。"
pubDate: 2026-10-26
tags:
  - "AI Infra"
  - "学习路线"
  - "系统"
category: course
series: ai-infra-route
order: 0
cover: /covers/series-ai-infra.svg
---

AI Infra 是支撑模型训练、推理和服务的整套技术体系，范围从 GPU 硬件、驱动和通信库，到训练框架、推理引擎、调度和监控。

## AI Infra 和算法有什么区别

- AI Infra 关心运行效率：吞吐、延迟、显存、成本、稳定性。
- 算法关心模型效果：准确率、生成质量、泛化能力。
- AI Infra 的日常是 GPU 编程、分布式训练、推理部署、性能分析；算法更多是数据、模型结构、训练策略和评测。
- 两者不是完全分开的。FlashAttention、PagedAttention 这类工作既需要理解模型，也需要系统实现能力。

## 技术栈分层

从下往上大致是：

- 硬件层：GPU、NVLink、Tensor Core、HBM、InfiniBand。
- 系统软件层：CUDA、NCCL、算子库、推理引擎、分布式训练框架。
- 模型与算法层：数据工程、模型结构、训练策略、RLHF。
- 应用层：聊天、Agent、搜索、推荐等。

## 硬件层

### GPU 为什么适合 AI

深度学习的核心运算大量是矩阵乘法和逐元素运算，这类运算可以拆成很多互不依赖的小任务，适合 GPU 的大量线程并行执行。

GPU 的线程层级：

- Thread：最小执行单元。
- Block：一组线程，可共享 shared memory。
- Grid：所有 Block 的集合。

### 互联

单卡显存和算力有上限，多卡训练需要高速互联：

- NVLink：GPU 之间的直连通道。
- NVSwitch：同一节点内多卡的全互联交换。
- InfiniBand：跨节点的高速网络。

训练扩展效率不高时，通信往往是先要排查的部分。

### 显存

现代 AI GPU 使用 HBM：

- H100 SXM：80GB HBM3，带宽约 3.35 TB/s。
- A100：80GB HBM2e，带宽约 2.0 TB/s。

很多推理负载受显存带宽限制，而不是算力限制。优化时先判断是 compute-bound 还是 memory-bound。

## 系统软件层

### CUDA

CUDA 是 NVIDIA 的 GPU 并行计算平台和编程模型。写 kernel 时要理解线程层级、shared memory、warp 调度和访存模式。

### NCCL

NCCL 提供 AllReduce、AllGather、ReduceScatter 等集合通信原语，是分布式训练的通信基础。

### 算子库

常见库：

- cuBLAS：矩阵乘法。
- cuDNN：卷积、池化、归一化等。
- cuFFT：快速傅里叶变换。

## 训练系统

### 为什么需要分布式训练

以 Llama 3 405B 为例，4050 亿参数用 FP16 存储约需 810GB，单卡放不下；训练时还要保存梯度、优化器状态和中间激活，总显存需求更高。所以大模型训练必须多卡甚至多节点。

### 并行方式

- 数据并行（DP）：每张卡有完整模型副本，处理不同数据，最后同步梯度。适合模型能放进单卡的情况。
- 张量并行（TP）：把单层的矩阵运算切到多张卡上，适合单层参数很大的模型。
- 流水线并行（PP）：按层把模型分段放到不同卡上，数据依次流过各段。
- 3D 并行：大规模训练通常组合 DP、TP、PP，具体比例取决于模型大小、集群规模和网络拓扑。

常见框架：PyTorch DDP、PyTorch FSDP、DeepSpeed、Megatron-LM。

## 推理系统

### 自回归生成

大模型推理通常每次只生成一个 token，且依赖之前所有 token，所以过程天然串行。推理优化既要提高吞吐，也要控制延迟。

### KV Cache

Attention 计算需要之前所有 token 的 Key 和 Value。把它们缓存起来可以避免重复计算，代价是显存随序列长度增长。

### PagedAttention

传统做法给每个请求预分配连续的 KV Cache 显存块，容易产生碎片。PagedAttention 借鉴操作系统分页，把 KV Cache 分成固定大小的 page，按需分配，减少碎片、提高显存利用率。具体提升取决于请求长度分布和实现。

### 量化

用 FP8、INT8、INT4 等更低精度表示权重或激活，降低显存占用和带宽需求，可能带来加速；幅度取决于模型、硬件和量化方式，也会带来精度损失。

### 主流推理引擎

- vLLM：PagedAttention，开源社区活跃。
- SGLang：RadixAttention，适合前缀共享和多轮对话。
- TensorRT-LLM：NVIDIA 自研 kernel，深度绑定 NVIDIA 硬件，性能优化空间大。

## 性能工程

### Roofline

Roofline 把算子分成两类：

- 计算瓶颈：算力不够，如大矩阵乘法。
- 访存瓶颈：数据搬运跟不上，如逐元素操作。

判断依据是算术强度：

$$
\text{Arithmetic Intensity} = \frac{\text{FLOPs}}{\text{Bytes Accessed}}
$$

性能上限大致是：

$$
\min(\text{峰值算力}, \text{峰值带宽} \times \text{算术强度})
$$

### Profiling

- Nsight Systems：系统级时间线，看 CPU/GPU 调度、Kernel 和通信，定位“哪里慢”。
- Nsight Compute：Kernel 级分析，看计算效率、内存吞吐和 warp 占用，定位“为什么慢”。

常用顺序是先用 Nsight Systems 找热点，再用 Nsight Compute 深入。

## 能力模型

- 基础：C/C++、计算机体系结构、Linux。
- 核心：CUDA 编程、分布式系统、PyTorch 内部机制。
- 进阶：算子优化、并行策略、推理引擎原理。

AI Infra 需要一定的广度，也需要至少一个方向的深度。先把全景建立起来，再选一个方向做深。

## 自我检查

- 能解释 AI Infra 和算法岗的区别。
- 能画出从硬件到应用的分层。
- 能说明 Tensor Core、NVLink、HBM 各自解决什么问题。
- 能区分 DP、TP、PP 的适用场景。
- 能解释 KV Cache 和 PagedAttention 的基本原理。
- 能判断一个算子是 compute-bound 还是 memory-bound。
- 能说明 Nsight Systems 和 Nsight Compute 的差别。
