---
title: 就业方向规划与学习路线
description: 基于数据科学硕士背景，系统分析 AI Infra/ML Systems、量化开发、AI 算法、系统软件四个方向的适配度，并规划可迁移的模型工程化能力学习路线。
pubDate: 2026-06-02
tags:
  - 职业规划
  - AI
  - 学习路线
draft: true
---

# 就业方向规划与学习路线

## 这篇文档解决什么问题

这篇文档回答一个具体问题：

某高校数学统计本科 + 数据科学硕士，导师方向 AI for Software Engineering，编程基础有但项目经验少，在 1.5 年准备期内，应该选什么方向、怎么准备、最终投什么岗位。

核心诉求：

- 行业壁垒高，不易被 AI 替代
- 有积累效应，年龄增长与技术深度正相关
- 工作节奏可控，不希望 996
- 地域优先杭州，其他城市可接受

---

## 个人背景

### 学历与研究

| 阶段 | 院校与专业 | 时间 |
|------|-----------|------|
| 本科 | 某高校数学与统计学院，数据科学与大数据技术 | 本科阶段 |
| 硕士 | 某高校前沿交叉学科研究院，数据科学（2 年制） | 硕士阶段 |

导师方向为 AI for Software Engineering，研究内容围绕 LLM 辅助软件工程问题优化。当前任务是利用大模型微调与提示词工程，发现 PR 中的安全问题。

### 技术现状

- Python、C、C++ 基础语法掌握，无超过 200 行的实际项目经验
- MySQL 基础，DSA 基础（LeetCode 刷过一部分，中高难度不稳定）
- Linux 使用经验（Ubuntu 环境下完成过反编译器评估项目）
- Git 基本操作，包管理和工程化经验较少

### 数学基础

本科数学统计学院，概率论、统计、优化基础扎实，复习可以快速拾起。

---

## 方向分析与对比

### 方向一：AI Infra / ML Systems 工程师（推荐主方向）

**做什么：** 面向深度学习模型的训练、推理、部署、资源调度、性能优化和可观测性系统。当前最好的练兵场是 LLM 推理与大模型平台，但长期能力不绑定某一种模型形态。

**为什么适合：**

- 读研接触 LLM 微调，是进入模型工程化和推理部署的天然入口
- 需要数学理解、系统工程和性能分析能力，壁垒比纯应用开发更厚
- 不押注某个具体模型热点，而是押注"模型规模化生产系统"：训练、推理、调度、监控、成本优化
- 经验积累型，线上稳定性、性能瓶颈和资源利用率问题都需要长期实践
- 杭州有头部云厂商和多家互联网企业机会，但高质量岗位仍需全国范围关注
- 基础设施团队相对重工程深度，但大模型平台也可能高压，不能简单等同于节奏稳定

**需要补的能力：**

- Python 工程化、Linux、Docker、K8s、CI/CD、Prometheus/Grafana
- PyTorch、HuggingFace、PEFT/LoRA，能把导师项目做成可复现实验流水线
- vLLM/SGLang 推理服务、KV Cache、batching、TTFT/TPOT/throughput/p95 latency benchmark
- 分布式训练基础：FSDP、DeepSpeed ZeRO、NCCL、AllReduce，重点理解显存和通信开销
- CUDA/Triton 入门：能写和 benchmark 简单 kernel，理解 GPU 执行模型和访存瓶颈
- C++ 作为性能方向加分项；Go 作为平台/K8s 方向加分项，不在第一阶段同时强压

**方向边界：** 本路线不是押注 LLM 永远处于前沿，而是用 LLM serving 训练可迁移的 AI 系统能力。未来主流模型即使转向多模态、视频生成、agent、具身智能或科学计算模型，训练/推理/调度/监控/成本优化仍然是共性基础设施。

### 方向二：量化开发工程师（备选）

**做什么：** 交易系统、回测框架、数据 pipeline。

**优势：** 数学背景加分；薪资高；系统复杂度高，不易替代；经验越多越值钱。

**劣势：** 杭州量化公司少，主要在上海/北京/深圳；C++ 性能优化要求高，当前基础弱，准备成本大；对金融无兴趣长期可能疲倦；工作节奏未必轻松。

**结论：** 可作备选，不建议主方向。

### 方向三：AI 算法工程师（NLP/LLM 方向）

**做什么：** 大模型训练、对齐、RAG、Agent 系统。

**优势：** 研究方向直接相关，有论文加持；数学功底好；杭州机会多。

**风险：** 竞争极其激烈；硕士无顶会论文竞争力有限；方法迭代快，今天的热门两年后可能过时；中年壁垒不明显，新人带新论文就能上。不符合「积累效应」诉求。

**结论：** 可利用研究成果作敲门砖，但单纯做算法研究不作为主方向。

### 方向四：系统软件工程师（数据库/编译器/OS）

壁垒极高、越老越吃香。但准备周期长，1.5 年不够从零入门到求职水平，且与研究方向关联弱。不建议。

### 综合对比

| 方向       | 壁垒  | 替代风险 | 积累效应 | 准备可行性 | 杭州机会 |
| -------- | --- | ---- | ---- | ----- | ---- |
| AI Infra / ML Systems | 高   | 低    | 强    | 高     | 较多   |
| 量化开发     | 高   | 低    | 强    | 中     | 少    |
| AI 算法    | 中   | 中    | 弱    | 高     | 充足   |
| 系统软件     | 极高  | 极低   | 极强   | 低     | 一般   |

---

## 当前项目定位

### 项目背景

导师给定的课题「利用 LLM 发现 PR 中的安全问题」，涉及大模型微调、提示词工程、算法优化。

### 直接价值

- 证明能用 LLM 解决实际工程问题
- 微调经验是面试中可深入展开的技术点
- 如果发表论文，算法岗直接加分

### 如何向 AI Infra 方向延伸

同样一个微调项目，做成「跑通实验发论文」是算法向，做成「从训练到部署、监控和性能分析的完整工程系统」就是 Infra 向。两个都做到，求职时两条路都能走。

核心原则：导师课题不用改，但主动把工程标准拉高。每个环节都问自己——如果面试被问到这里，我能讲清楚底层原理吗？

**具体做法：**

1. **微调环节：** 搞清楚 LoRA/QLoRA 底层实现、显存计算方式、batch size 选择依据、梯度累积配置
2. **Pipeline 工程化：** 数据处理 -> 训练 -> 评估 -> 部署推理，用工程化方式组织代码，并保证实验可复现
3. **推理性能：** 用 vLLM/SGLang 部署微调后的模型，做 benchmark，记录 TTFT、TPOT、吞吐量、p95 latency、GPU 利用率
4. **平台化交付：** 用 Docker/K8s 部署服务，接入 Prometheus/Grafana，形成能放进简历和面试深挖的完整项目
5. **分布式训练：** 用 FSDP 或 DeepSpeed 跑通小规模实验，重点理解数据并行、状态分片、通信开销

---

## 学习路线与时间规划

路线原则：

- **主线：** AI Infra / ML Systems，当前项目载体是 LLM Code Security Review Inference Platform
- **核心能力：** Python 工程化 + PyTorch 微调 + vLLM/SGLang 推理服务 + benchmark + K8s + monitoring
- **辅线一：** FSDP/DeepSpeed/NCCL，用于理解训练基础设施
- **辅线二：** CUDA/Triton，用于建立性能优化能力

### 阶段一：暑假补基础

| 模块 | 具体内容 | 交付标准 |
|------|---------|---------|
| Python 深入 | 包管理（poetry/uv）、类型标注、项目结构、测试 | 完成一个 500-1000 行的 CLI 项目 |
| Linux + Git | shell 脚本、进程管理、网络基础、Git 工作流 | 能写 CI 脚本，熟练使用 rebase |
| Docker | Dockerfile、docker-compose、多阶段构建 | 将已有项目容器化 |
| GPU/CUDA 入门 | 环境配置、GPU 架构概念、Nsight 基本使用 | 能解释 GPU 和 CPU 执行模型的区别 |
| LeetCode | 数组、链表、哈希、二叉树、BFS/DFS | 每天 1-2 题，覆盖基础题型 |

### 阶段二：ML 工程化 + 导师项目

| 模块 | 具体内容 | 交付标准 |
|------|---------|---------|
| PyTorch 深入 | 计算图、自动求导、显存管理、DataLoader、AMP | 能从零手写小 transformer |
| 微调工程 | HuggingFace + PEFT（LoRA），混合精度训练 | 导师项目微调流程工程化 |
| 分布式训练基础 | FSDP 或 DeepSpeed ZeRO 小规模实验 | 能解释显存占用和 ZeRO 原理 |
| CUDA/Triton 入门 | 手写 vector add、reduce、softmax 小练习 | 完成 2-3 个可 benchmark 的小 kernel |
| LeetCode | 滑动窗口、单调栈、动态规划、图遍历 | 每天 1-2 题 |

### 阶段三：推理部署 + 项目产出

| 模块 | 具体内容 | 交付标准 |
|------|---------|---------|
| 推理引擎 | vLLM/SGLang 关键源码阅读 | 部署微调模型为 OpenAI-compatible 服务 |
| 推理优化 | KV Cache、量化、Speculative Decoding | 能完整讲清请求全链路优化 |
| K8s + Monitoring | Pod、Deployment、GPU resource、Prometheus/Grafana | 在 K8s 上部署推理服务 |
| 简历核心项目 | LLM Inference Platform | 完整 pipeline + CI/CD + benchmark + 监控 |
| LeetCode | 高频中等题 + 部分困难题 | 每天 2-3 题 |

### 阶段四：秋招冲刺

| 模块 | 具体内容 | 交付标准 |
|------|---------|---------|
| LeetCode | 按公司题库专项突破，限时模拟 | 高频中等题 20-30 分钟内有清晰思路 |
| 八股文 | OS、网络、数据库、分布式系统核心概念 | 能流畅回答，结合 Infra 场景举例 |
| 论文复习 | FlashAttention、PagedAttention、DeepSpeed ZeRO 等 | 能 3 分钟讲清每篇论文核心 idea |
| 模拟面试 | 找同学/学长 mock | 至少 5 次完整模拟 |
| 投递 | 头部互联网企业 AI 平台 | 目标城市优先，7 月起陆续投递 |

---

## 贯穿全程的习惯

1. **LeetCode 不断：** 从现在开始每天至少 1 题，不间断
2. **GitHub 保持活跃：** 代码都放上去，形成作品集
3. **源码阅读：** 持续阅读核心项目源码——vLLM/SGLang、PyTorch/FSDP、DeepSpeed
4. **论文跟进：** 精读必读论文，用自己的话写 notes
5. **关注行业动态：** 关注 AI Infra 开源项目，有能力时尝试贡献 PR
6. **导师项目往深做：** 每个环节都问自己「如果面试被问到这里，我能讲清楚底层原理吗」

---

## 必读论文与核心资源

### 必读论文（按学习顺序）

| 序号 | 论文 | 关键词 |
|------|------|--------|
| 1 | FlashAttention / FlashAttention-2 | tiling, online softmax, memory-bound |
| 2 | DeepSpeed ZeRO / PyTorch FSDP | ZeRO 状态分片, 参数/梯度/优化器状态显存 |
| 3 | Megatron-LM | TP + PP 三维并行 |
| 4 | PagedAttention (vLLM) | KV Cache 分页管理, Continuous Batching |
| 5 | AWQ | 权重量化, activation-aware |
| 6 | GPTQ | 逐层量化, Hessian-based |

### 课程与知识库

| 资源 | 用途 |
|------|------|
| [Stanford CS336](https://cs336.stanford.edu/) | LLM systems 主课 |
| [Stanford CS329S](https://stanford-cs329s.github.io/index.html) | ML Systems Design |
| [Full Stack LLM Bootcamp](https://fullstackdeeplearning.com/llm-bootcamp/) | LLM 应用工程化视角 |
| [AIInfraGuide](https://caomaolufei.github.io/AIInfraGuide/) | 中文 AI Infra 知识库 |

### 核心开源项目

| 项目 | 用途 |
|------|------|
| [nanoGPT](https://github.com/karpathy/nanoGPT) | 从零理解 GPT 训练 |
| [vLLM](https://github.com/vllm-project/vllm) | 推理引擎 |
| [SGLang](https://github.com/sgl-project/sglang) | 推理引擎 |
| [DeepSpeed](https://github.com/microsoft/DeepSpeed) | 分布式训练框架 |
| [Triton Tutorials](https://triton-lang.org/main/getting-started/tutorials/index.html) | GPU kernel 编程入门 |

---

## 立即开始的事情

距离秋招还有一年半，很多人最后半年才开始准备。保持节奏比焦虑有用。

今天就开始：

1. 开始刷 LeetCode，每天 1 题
2. 找一个 Python 小项目做起来
3. 把导师项目整理成可复现 Python 工程，补齐 README、依赖管理和基础测试
4. 配置 GPU/CUDA 或 Triton 开发环境，跑通第一个示例
5. 通读 AIInfraGuide 的学习路线和推理优化目录，建立岗位知识地图
6. 不用等开学
