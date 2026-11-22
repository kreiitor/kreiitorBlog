---
title: "就业方向规划与学习路线"
description: "从 Python 与 Linux 基础出发，比较 AI Infra、算法、量化开发与系统软件四个方向，并给出微调、推理、性能分析、部署与可观测性的学习路线。"
pubDate: 2026-06-02
updatedDate: 2026-10-11
tags:
  - "职业规划"
  - "AI"
  - "学习路线"
category: knowledge
cover: /covers/post-learning-path.svg
---

## 学习路线的适用场景

这条路线面向希望从数学与编程基础走向模型工程化的读者，比较 AI Infra、算法、量化开发与系统软件四个方向。它以可迁移的系统能力和可复现的项目交付为目标；岗位选择还要看兴趣、基础和实际机会。

## 方向分析与对比

### 方向一：AI Infra / ML Systems 工程师（推荐主方向）

**做什么：** 深度学习模型的训练、推理、部署、资源调度、性能优化和可观测性系统。当前最好的练兵场是 LLM 推理与大模型平台，但长期能力不绑定某一种模型形态。

**为什么适合：**

- 从科研接触到的 LLM 微调切入，可以顺畅过渡到模型工程化与推理部署
- 需要数学理解、系统工程和性能分析能力，技术门槛比纯应用胶水开发更高
- 押注「模型规模化生产系统」这类通用能力：训练、推理、调度、监控、成本优化，不绑定单一模型热点
- 属于经验积累型方向，线上稳定性、性能瓶颈和资源利用率问题都需要长期实践
- 岗位集中在云平台和大模型基建团队（集中于一线及部分新一线城市），高质量岗位通常需要跨城市投递
- 基础设施团队相对看重工程深度，但大模型平台迭代同样高压，不能简单等同于工作节奏轻松

**需要补的能力：**

- Python 工程化、Linux、Docker、K8s、CI/CD、Prometheus/Grafana
- PyTorch、HuggingFace、PEFT/LoRA，能把学习项目做成可复现实验流水线
- vLLM/SGLang 推理服务、KV Cache、batching、TTFT/TPOT/throughput/p95 latency benchmark
- 分布式训练基础：FSDP、DeepSpeed ZeRO、NCCL、AllReduce，重点理解显存和通信开销
- CUDA/Triton 入门：能写和 benchmark 简单 kernel，理解 GPU 执行模型和访存瓶颈
- C++ 作为性能方向加分项；Go 作为平台/K8s 方向加分项，不在第一阶段同时强压

**方向边界：** 这条路线不押注文本 LLM 永远停留在当前形态。LLM serving 训练的是可迁移的 AI 系统能力：未来主流模型即使转向多模态、视频生成、Agent、具身智能或科学计算模型，训练、推理、调度、监控与成本优化仍然是共性基础设施。

### 方向二：量化开发工程师（备选）

**做什么：** 交易系统、回测框架、数据 pipeline。

**优势：** 数学背景加分；薪酬上限高；系统复杂度高，不易替代；经验积累性强。

**劣势：** 量化核心岗位高度集中于上海、北京、深圳等城市；C++ 极致性能优化要求高，前期准备成本大；对金融缺乏兴趣则难以长期投入；工作节奏未必轻松。

**结论：** 可作备选，不作为主方向。

### 方向三：AI 算法工程师（NLP/LLM 方向）

**做什么：** 大模型训练、对齐、RAG、Agent 系统。

**优势：** 与科研方向直接相关，论文成果易转化为简历亮点；数学功底加分；市场岗位总量较多。

**风险：** 竞争极其激烈；缺乏高水平论文时区分度有限；技术范式迭代快，局部经验容易过时；长期壁垒与经验沉淀不如底层系统方向明显。

**结论：** 可将已有研究成果作为敲门砖，但不把纯算法研究作为长期唯一主方向。

### 方向四：系统软件工程师（数据库/编译器/OS）

壁垒极高，工程经验长期有效；但前期技术栈跨度大，从零入门到具备求职竞争力的准备周期较长，且与模型方向直接积累关联较弱，短期内性价比偏低。

### 综合对比

| 方向 | 壁垒 | 替代风险 | 积累效应 | 准备可行性 | 岗位分布广度 |
| --- | --- | --- | --- | --- | --- |
| AI Infra / ML Systems | 高 | 低 | 强 | 高 | 较多（一二线核心集群） |
| 量化开发 | 高 | 低 | 强 | 中 | 较集中（京沪深为主） |
| AI 算法 | 中 | 中 | 弱 | 高 | 充足 |
| 系统软件 | 极高 | 极低 | 极强 | 低（从零转入周期长） | 一般 |

---

## 用一个通用项目贯穿学习

选一项公开数据上的模型任务，把数据处理、训练、评估、推理部署、性能基准和监控组织成可复现的流水线。任务内容可以自选：文本分类、检索或代码理解。

交付物包括测试、容器化配置、基准报告与设计权衡说明。

## 学习路线与时间规划

时间窗口：按个人基础安排约一年的学习与项目实践。

路线原则：

- **主线：** AI Infra / ML Systems，当前项目载体是模型推理与评测平台
- **核心能力：** Python 工程化 + PyTorch 微调 + vLLM/SGLang 推理服务 + benchmark + K8s + monitoring
- **辅线一：** FSDP/DeepSpeed/NCCL，用于理解训练基础设施，集中求职之前不追求大规模训练经验
- **辅线二：** CUDA/Triton，用于建立性能优化能力，不把系统级 kernel 工程师作为第一求职目标

### 阶段一：补齐工程基础

| 模块 | 具体内容 | 交付标准 |
|------|---------|---------|
| Python 深入 | 包管理（poetry/uv）、类型标注、项目结构、测试 | 完成一个 500–1000 行的 CLI 项目 |
| Linux + Git | shell 脚本、进程管理、网络基础、Git 工作流 | 能写 CI 脚本，熟练使用 rebase |
| Docker | Dockerfile、docker-compose、多阶段构建 | 将已有模型或评估脚手架容器化 |
| GPU/CUDA 入门 | 环境配置、GPU 架构概念（SM/Warp/Thread）、Nsight 基本使用 | 能解释 GPU 和 CPU 执行模型的区别，跑通一个最小 CUDA/Triton 示例 |
| LeetCode | 数组、链表、哈希、二叉树、BFS/DFS | 每天 1–2 题，累计 60+ 题，覆盖基础题型 |

### 阶段二：ML 工程化 + 学习项目

| 模块             | 具体内容                                                                                     | 交付标准                                                 |
| -------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| PyTorch 深入     | 计算图、自动求导、显存管理、DataLoader、AMP、基础 DDP 概念                                                   | 跟 nanoGPT 从零手写小 transformer，能解释一次训练 step 的显存占用       |
| 微调工程           | HuggingFace + PEFT（LoRA），混合精度训练（AMP、Loss Scaling）                                        | 学习项目微调流程工程化                                          |
| 分布式训练基础        | FSDP 或 DeepSpeed ZeRO 跑通小规模实验，通信基础（NCCL、AllReduce、NVLink vs InfiniBand）                  | 能解释参数、梯度、优化器状态如何占显存，以及 ZeRO/FSDP 如何降低显存              |
| FlashAttention | 论文精读，tiling + online softmax 原理，为什么 FLOPs 高反而更快                                          | 能讲清楚 memory-bound 优化思路                               |
| CUDA/Triton 入门 | 手写 vector add、reduce、softmax 或 matmul 小练习，理解 shared memory、bank conflict、warp divergence | 完成 2–3 个可 benchmark 的小 kernel，并和 PyTorch baseline 对比 |
| C++ 重温         | 智能指针、RAII、移动语义、多线程                                                                       | 能写基本的 CUDA host 代码                                   |
| Go 语言（可选）      | 基础语法、并发模型（goroutine/channel）                                                             | 仅在偏向平台方向时投入，否则优先级低于 CUDA                             |
| LeetCode       | 滑动窗口、单调栈、动态规划、图遍历                                                                        | 每天 1–2 题，累计 120+ 题                                   |

### 阶段三：推理部署 + 项目产出

| 模块               | 具体内容                                                                                         | 交付标准                                                  |
| ---------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 推理引擎             | vLLM/SGLang 官方文档 + 关键源码阅读（PagedAttention、Scheduler、Continuous Batching、RadixAttention、PD 分离） | 部署微调模型为 OpenAI-compatible 服务，产出吞吐/延迟 benchmark 报告     |
| 推理优化             | KV Cache 原理与显存估算，量化（GPTQ/AWQ/FP8/INT8，scaling factor 计算），Speculative Decoding、MTP/Medusa     | 能完整讲清一条请求从进来到返回的全链路优化                                 |
| Roofline Model   | 计算屋顶 vs 访存屋顶，判断 compute-bound vs memory-bound，prefill vs decode 的性能特征                        | 能画图分析一个具体模型（如 Llama-7B）的瓶颈                            |
| TensorRT-LLM     | 基本使用流程，与 vLLM/SGLang 的差异                                                                     | 了解部署链路；有余力时完成一次模型量化部署对比                               |
| K8s + Monitoring | Pod、Deployment、Service、GPU resource request、基础调度、Prometheus/Grafana                          | 在 K8s 上部署推理服务，配置 GPU 资源和基础监控面板                        |
| 简历核心项目           | 模型推理与评测平台                                                  | 完整 pipeline + CI/CD + 容器化 + benchmark + 监控面板 + 性能分析报告 |
| LeetCode         | 高频中等题 + 部分困难题，开始刷高频面试题库                                                                      | 每天 2–3 题，累计 200+ 题                                    |

### 阶段四：求职冲刺

| 模块 | 具体内容 | 交付标准 |
|------|---------|---------|
| LeetCode | 按常见高频题型专项突破，限时模拟 | 累计 250+ 题，高频中等题 20–30 分钟内有清晰思路并稳定写对 |
| 计算机基础 | OS、网络、数据库、分布式系统核心概念 | 能流畅作答，并结合 AI Infra 实际场景举例 |
| 论文复习 | FlashAttention、PagedAttention、DeepSpeed ZeRO/FSDP、AWQ/GPTQ、Speculative Decoding | 能 3 分钟讲清每篇论文的核心 idea 和设计权衡 |
| 模拟面试 | 找同学/朋友进行 mock，覆盖项目深挖 + 系统设计 + 手撕代码 | 至少 5 次完整模拟 |
| 简历 + 面试 | 项目梳理与深挖准备，每个项目讲清：为什么这样设计、踩过什么坑、性能提升数据 | STAR 法则（Situation-Task-Action-Result，可补充复盘反思） |
| 投递策略 | 云厂商 AI 平台、大型互联网基础架构部门与大模型创业公司 | 按投递窗口分批投递并持续复盘面试反馈 |

---

## 贯穿全程的习惯

1. **LeetCode 不断：** 每天至少保持 1 题，不间断；冲刺前整理错题和思路清单方便复盘
2. **GitHub 保持活跃：** 核心代码尽量开源沉淀，README 写清楚项目解决什么问题、为什么这样选型
3. **源码阅读：** 持续阅读核心项目源码——vLLM/SGLang 的调度与 KV Cache 管理、PyTorch/FSDP 的核心流程、DeepSpeed 的 ZeRO 实现。不求一次全懂，每遍加深一层
4. **论文跟进：** 精读论文清单里的每篇，用自己的话写阅读笔记。关注 MLSys/NeurIPS 每年新论文，尤其是推理优化方向
5. **关注行业动态：** 持续跟进 AI Infra 开源项目（vLLM、SGLang、DeepSpeed），有余力时尝试提交 PR，哪怕修复一处文档拼写也是开始
6. **学习项目往深做：** 每个环节都反问自己「如果面试被问到这里，我能讲清楚底层原理吗」

---

## 必读论文与核心资源

### 必读论文（按学习顺序）

| 序号 | 论文 | 关键词 | 阶段 |
|------|------|--------|------|
| 1 | FlashAttention / FlashAttention-2 | tiling, online softmax, memory-bound | 阶段二 |
| 2 | DeepSpeed ZeRO / PyTorch FSDP | ZeRO 状态分片, 参数/梯度/优化器状态显存 | 阶段二 |
| 3 | Megatron-LM | TP + PP 三维并行 | 阶段二/四了解 |
| 4 | PagedAttention (vLLM) | KV Cache 分页管理, Continuous Batching | 阶段三 |
| 5 | AWQ | 权重量化, activation-aware | 阶段三 |
| 6 | GPTQ | 逐层量化, Hessian-based | 阶段三 |

每篇论文读完，至少要能说清三件事：**核心解决什么问题、用什么思路、关键权衡取舍在哪里。**

### 课程与知识库

| 资源 | 用途 | 使用方式 |
|------|------|---------|
| [Stanford CS336](https://cs336.stanford.edu/) | LLM systems 主课，覆盖训练、tokenizer、GPU profiling、分布式和推理 | 阶段二/三作为系统主线，重点做与项目相关的 lecture/assignment |
| [Stanford CS329S](https://stanford-cs329s.github.io/index.html) | ML Systems Design，全局理解数据、训练、部署、监控和可靠性 | 阶段一/二建立系统视角 |
| [Full Stack LLM Bootcamp](https://fullstackdeeplearning.com/llm-bootcamp/) | LLM 应用到部署的工程化视角 | 阶段二快速补齐应用、评估和部署 |
| [AIInfraGuide](https://caomaolufei.github.io/AIInfraGuide/) | 中文 AI Infra 知识库与面试题库，贴近国内岗位语境 | 阶段一读路线和前置知识，阶段三读推理优化，阶段四刷面试宝典 |
| [ai-infra-engineer-learning](https://github.com/ai-infra-curriculum/ai-infra-engineer-learning) | AI Infra 项目清单和学习地图 | 作为项目灵感参考，不作为唯一教材 |

### 核心开源项目与官方文档（按深度递进）

| 项目 | 用途 | 阅读优先级 |
|------|------|-----------|
| [nanoGPT](https://github.com/karpathy/nanoGPT) | 从零理解 GPT 训练 | 阶段二必读 |
| [vLLM](https://github.com/vllm-project/vllm) / [vLLM Docs](https://docs.vllm.ai/) | 推理引擎（重点：PagedAttention、Scheduler、Continuous Batching） | 阶段三必读 |
| [SGLang](https://github.com/sgl-project/sglang) / [SGLang Docs](https://docs.sglang.ai/) | 推理引擎（重点：RadixAttention、结构化生成、PD 分离） | 阶段三必读 |
| [DeepSpeed](https://github.com/microsoft/DeepSpeed) | 分布式训练框架 | 阶段二理解 ZeRO，阶段四复习 |
| [Megatron-LM](https://github.com/NVIDIA/Megatron-LM) | 大模型训练框架 | 阶段二/四了解 TP/PP/DP，不作为必须跑通项 |
| [Triton Tutorials](https://triton-lang.org/main/getting-started/tutorials/index.html) | GPU kernel 编程入门 | 阶段二做 2-3 个 benchmark 小练习 |
| [LeetCUDA](https://github.com/xlite-dev/LeetCUDA) | CUDA 编程练习 | 阶段二选做基础题 |
| [ml-engineering](https://github.com/stas00/ml-engineering) | 工业级训练实战总结 | 全程参考 |
| [KServe](https://kserve.github.io/website/) / [Ray Serve](https://docs.ray.io/en/latest/serve/) | 模型服务与平台化部署 | 平台方向加分资源 |

### 推荐书籍

| 类别    | 书名                                                                  | 使用方式                    |
| ----- | ------------------------------------------------------------------- | ----------------------- |
| 计算机基础 | 《深入理解计算机系统》(CSAPP)                                                  | 精读第 1-3、6 章（存储器层次结构、链接） |
| CUDA  | 《CUDA C++ Programming Guide》(NVIDIA 官方)                             | 手册式查阅 + LeetCUDA 对照练习   |
| CUDA  | 《CUDA 编程：基础与实践》(樊哲勇)                                                | 中文入门，阶段二配合使用            |
| 面试    | 《百面大模型》                                                             | 阶段四系统复习                 |
| 工程    | [ml-engineering (stas00)](https://github.com/stas00/ml-engineering) | 训练遇到具体问题时查阅             |
| 面试    | [AIInfraGuide](https://caomaolufei.github.io/AIInfraGuide/)         | 阶段四按公司和技术栈查漏补缺          |

---

## 立即开始的事情

完整路线按一年左右周期规划，建议尽早起步、分散到日常迭代，避免临近求职再集中突击。

今天就可以开始：

1. 开始刷 LeetCode，每天保持 1 题
2. 找一个 Python 小项目动手做起来
3. 把学习项目或已有实验脚本整理成可复现 Python 工程，补齐 README、依赖管理和基础测试
4. 配置 GPU/CUDA 或 Triton 开发环境，跑通第一个 CUDA / Triton 最小示例
5. 通读 AIInfraGuide 的学习路线和推理优化目录，建立岗位知识地图
6. 尽早搭建基础实验环境并记录第一份基准数据
