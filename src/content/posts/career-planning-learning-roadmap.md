---
title: "就业方向规划与学习路线"
description: "面向模型工程化的通用学习路线：从 Python 与 Linux 基础，到微调、推理、性能分析、部署与可观测性。已移除个人履历和具体求职安排。"
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

面向希望从数学与编程基础走向模型工程化的学习者，比较 AI Infra、算法、量化开发与系统软件方向。路线以可迁移的系统能力和可复现的项目交付为目标；岗位选择需要结合自己的兴趣、基础和实际机会。

## 方向分析与对比

### 方向一：AI Infra / ML Systems 工程师（推荐主方向）

**做什么：** 面向深度学习模型的训练、推理、部署、资源调度、性能优化和可观测性系统。当前最好的练兵场是 LLM 推理与大模型平台，但长期能力不绑定某一种模型形态。

**为什么适合：**

- 读研接触 LLM 微调，是进入模型工程化和推理部署的天然入口
- 需要数学理解、系统工程和性能分析能力，壁垒比纯应用开发更厚
- 不押注某个具体模型热点，而是押注“模型规模化生产系统”：训练、推理、调度、监控、成本优化
- 经验积累型，线上稳定性、性能瓶颈和资源利用率问题都需要长期实践
- 目标城市有阿里云 PAI、蚂蚁、网易和部分创业公司机会，但高质量岗位仍需全国范围关注
- 基础设施团队相对重工程深度，但大模型平台也可能高压，不能简单等同于节奏稳定

**需要补的能力：**

- Python 工程化、Linux、Docker、K8s、CI/CD、Prometheus/Grafana
- PyTorch、HuggingFace、PEFT/LoRA，能把学习项目做成可复现实验流水线
- vLLM/SGLang 推理服务、KV Cache、batching、TTFT/TPOT/throughput/p95 latency benchmark
- 分布式训练基础：FSDP、DeepSpeed ZeRO、NCCL、AllReduce，重点理解显存和通信开销
- CUDA/Triton 入门：能写和 benchmark 简单 kernel，理解 GPU 执行模型和访存瓶颈
- C++ 作为性能方向加分项；Go 作为平台/K8s 方向加分项，不在第一阶段同时强压

**方向边界：** 本路线不是押注 LLM 永远处于前沿，而是用 LLM serving 训练可迁移的 AI 系统能力。未来主流模型即使转向多模态、视频生成、agent、具身智能或科学计算模型，训练/推理/调度/监控/成本优化仍然是共性基础设施。

### 方向二：量化开发工程师（备选）

**做什么：** 交易系统、回测框架、数据 pipeline。

**优势：** 数学背景加分；薪资高；系统复杂度高，不易替代；经验越多越值钱。

**劣势：** 目标城市量化公司少，主要在上海/北京/深圳；C++ 性能优化要求高，当前基础弱，准备成本大；对金融无兴趣长期可能疲倦；工作节奏未必轻松。

**结论：** 可作备选，不建议主方向。

### 方向三：AI 算法工程师（NLP/LLM 方向）

**做什么：** 大模型训练、对齐、RAG、Agent 系统。

**优势：** 研究方向直接相关，有论文加持；数学功底好；目标城市机会多。

**风险：** 竞争极其激烈；硕士无顶会论文竞争力有限；方法迭代快，今天的热门两年后可能过时；中年壁垒不明显，新人带新论文就能上。不符合「积累效应」诉求。

**结论：** 可利用研究成果作敲门砖，但单纯做算法研究不作为主方向。

### 方向四：系统软件工程师（数据库/编译器/OS）

壁垒极高、越老越吃香。但准备周期长，1.5 年不够从零入门到求职水平，且与研究方向关联弱。不建议。

### 综合对比

| 方向       | 壁垒  | 替代风险 | 积累效应 | 准备可行性 | 目标城市机会 |
| -------- | --- | ---- | ---- | ----- | ---- |
| AI Infra / ML Systems | 高   | 低    | 强    | 高     | 较多   |
| 量化开发     | 高   | 低    | 强    | 中     | 少    |
| AI 算法    | 中   | 中    | 弱    | 高     | 充足   |
| 系统软件     | 极高  | 极低   | 极强   | 低     | 一般   |

---

## 用一个通用项目贯穿学习

选择一项公开数据上的模型任务，将数据处理、训练、评估、推理部署、性能基准和监控组织为可复现的流水线。学习者可自行选择文本分类、检索或代码理解任务。

交付应包含测试、容器化配置、基准报告与设计权衡说明。

## 学习路线与时间规划

时间窗口：按个人基础安排约一年的学习与项目实践。

路线原则：

- **主线：** AI Infra / ML Systems，当前项目载体是 模型推理与评测平台
- **核心能力：** Python 工程化 + PyTorch 微调 + vLLM/SGLang 推理服务 + benchmark + K8s + monitoring
- **辅线一：** FSDP/DeepSpeed/NCCL，用于理解训练基础设施，不在 集中求职前追求大规模训练经验
- **辅线二：** CUDA/Triton，用于建立性能优化能力，不把系统级 kernel 工程师作为第一求职目标

### 阶段一：暑假补基础

| 模块 | 具体内容 | 交付标准 |
|------|---------|---------|
| Python 深入 | 包管理（poetry/uv）、类型标注、项目结构、测试 | 完成一个 500-1000 行的 CLI 项目 |
| Linux + Git | shell 脚本、进程管理、网络基础、Git 工作流 | 能写 CI 脚本，熟练使用 rebase |
| Docker | Dockerfile、docker-compose、多阶段构建 | 将反编译器评估项目容器化 |
| GPU/CUDA 入门 | 环境配置、GPU 架构概念（SM/Warp/Thread）、Nsight 基本使用 | 能解释 GPU 和 CPU 执行模型的区别，跑通一个最小 CUDA/Triton 示例 |
| LeetCode | 数组、链表、哈希、二叉树、BFS/DFS | 每天 1-2 题，累计 60+ 题，覆盖基础题型 |

### 阶段二：ML 工程化 + 学习项目

| 模块             | 具体内容                                                                                     | 交付标准                                                 |
| -------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| PyTorch 深入     | 计算图、自动求导、显存管理、DataLoader、AMP、基础 DDP 概念                                                   | 跟 nanoGPT 从零手写小 transformer，能解释一次训练 step 的显存占用       |
| 微调工程           | HuggingFace + PEFT（LoRA），混合精度训练（AMP、Loss Scaling）                                        | 学习项目微调流程工程化                                          |
| 分布式训练基础        | FSDP 或 DeepSpeed ZeRO 跑通小规模实验，通信基础（NCCL、AllReduce、NVLink vs InfiniBand）                  | 能解释参数、梯度、优化器状态如何占显存，以及 ZeRO/FSDP 如何降低显存              |
| FlashAttention | 论文精读，tiling + online softmax 原理，为什么 FLOPS 高反而更快                                          | 能讲清楚 memory-bound 优化思路                               |
| CUDA/Triton 入门 | 手写 vector add、reduce、softmax 或 matmul 小练习，理解 shared memory、bank conflict、warp divergence | 完成 2-3 个可 benchmark 的小 kernel，并和 PyTorch baseline 对比 |
| C++ 重温         | 智能指针、RAII、移动语义、多线程                                                                       | 能写基本的 CUDA host 代码                                   |
| Go 语言（可选）      | 基础语法、并发模型（goroutine/channel）                                                             | 仅在偏向平台方向时投入，否则优先级低于 CUDA                             |
| LeetCode       | 滑动窗口、单调栈、动态规划、图遍历                                                                        | 每天 1-2 题，累计 120+ 题                                   |

### 阶段三：推理部署 + 项目产出

| 模块               | 具体内容                                                                                         | 交付标准                                                  |
| ---------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 推理引擎             | vLLM/SGLang 官方文档 + 关键源码阅读（PagedAttention、Scheduler、Continuous Batching、RadixAttention、PD 分离） | 部署微调模型为 OpenAI-compatible 服务，产出吞吐/延迟 benchmark 报告     |
| 推理优化             | KV Cache 原理与显存估算，量化（GPTQ/AWQ/FP8/INT8，scaling factor 计算），Speculative Decoding、MTP/Medusa     | 能完整讲清一条请求从进来到返回的全链路优化                                 |
| Roofline Model   | 计算屋顶 vs 访存屋顶，判断 compute-bound vs memory-bound，prefill vs decode 的性能特征                        | 能画图分析一个具体模型（如 Llama-7B）的瓶颈                            |
| TensorRT-LLM     | 基本使用流程，与 vLLM/SGLang 的差异                                                                     | 了解部署链路；有余力时完成一次模型量化部署对比                               |
| K8s + Monitoring | Pod、Deployment、Service、GPU resource request、基础调度、Prometheus/Grafana                          | 在 K8s 上部署推理服务，配置 GPU 资源和基础监控面板                        |
| 简历核心项目           | 模型推理与评测平台                                                  | 完整 pipeline + CI/CD + 容器化 + benchmark + 监控面板 + 性能分析报告 |
| LeetCode         | 高频中等题 + 部分困难题，开始刷大厂高频题库                                                                      | 每天 2-3 题，累计 200+ 题                                    |

### 阶段四：秋招冲刺

| 模块 | 具体内容 | 交付标准 |
|------|---------|---------|
| LeetCode | 按公司题库专项突破，限时模拟 | 累计 250+ 题，高频中等题 20-30 分钟内有清晰思路并稳定写对 |
| 八股文 | OS、网络、数据库、分布式系统核心概念 | 能流畅回答，结合 Infra 场景举例 |
| 论文复习 | FlashAttention、PagedAttention、DeepSpeed ZeRO/FSDP、AWQ/GPTQ、Speculative Decoding | 能 3 分钟讲清每篇论文的核心 idea 和设计权衡 |
| 模拟面试 | 找同学/学长 mock，覆盖项目深挖 + 系统设计 + 手撕代码 | 至少 5 次完整模拟 |
| 简历 + 面试 | 项目包装、深挖准备，每个项目能讲清：为什么这样设计、踩过什么坑、性能提升数据 | STARR 法则（Situation-TaYOUR_API_KEY） |
| 投递 | 阿里云 PAI、蚂蚁、网易、大模型创业公司 | 目标城市优先，备选字节/腾讯/百度 AI 平台，7 月起陆续投递 |

---

## 贯穿全程的习惯

1. **LeetCode 不断：** 从现在开始每天至少 1 题，不间断。冲刺前用 Excel 或 Notion 记录每题的思路和易错点，方便复习
2. **GitHub 保持活跃：** 代码都放上去，形成作品集。README 写清楚项目解决了什么问题、技术选型理由
3. **源码阅读：** 持续阅读核心项目源码——vLLM/SGLang 的调度与 KV Cache 管理、PyTorch/FSDP 的核心流程、DeepSpeed 的 ZeRO 实现。不求一次全懂，每遍加深一层
4. **论文跟进：** 精读必读论文列表中的每篇，用自己的话写 notes。关注 MLSys/NeurIPS 每年新论文，尤其是推理优化方向
5. **关注行业动态：** 关注 AI Infra 开源项目（vLLM、SGLang、DeepSpeed），有能力时尝试贡献 PR，哪怕修一个 typo 也是开始
6. **学习项目往深做：** 每个环节都问自己「如果面试被问到这里，我能讲清楚底层原理吗」

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

每篇论文读完至少能回答：**核心解决什么问题？什么思路？关键 trade-off 是什么？**

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

距离秋招还有一年半，很多人最后半年才开始准备。保持节奏比焦虑有用。

今天就开始：

1. 开始刷 LeetCode，每天 1 题
2. 找一个 Python 小项目做起来
3. 把学习项目或反编译器评估项目整理成可复现 Python 工程，补齐 README、依赖管理和基础测试
4. 配置 GPU/CUDA 或 Triton 开发环境，跑通第一个 hello CUDA/Triton
5. 通读 AIInfraGuide 的学习路线和推理优化目录，建立岗位知识地图
6. 不用等开学
