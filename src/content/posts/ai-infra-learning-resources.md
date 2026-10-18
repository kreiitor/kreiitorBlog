---
title: "AI Infra、算法、Agent 与后端学习资源推荐"
description: "面向 AI Infra、算法、Agent 与后端岗位的系统工程学习路线：从 C++、系统与分布式基础，到 PyTorch、CUDA、vLLM 和 Agent 工程化。"
pubDate: 2026-07-06
updatedDate: 2026-10-11
tags:
  - "ai知识库"
  - "career"
  - "learning-roadmap"
  - "ai-infra"
  - "agent"
  - "backend"
  - "cpp"
  - "algorithms"
  - "求职规划"
category: knowledge
cover: /covers/post-cli-terminal.svg
---

## 这篇文档解决什么问题

这篇文档回答一个具体问题：

如果求职意向同时包括 `AI Infra`、算法、Agent 开发、后端开发和 `C++`，应该读什么书、学哪些课程、做什么项目，才能形成一条不分裂的学习路线。

核心结论是：不要把这几个方向分开学。更稳的路线是围绕一条主线积累：

```text
系统工程能力
→ 高性能 C++ 与后端基础
→ 分布式系统与数据系统
→ 深度学习系统与推理服务
→ Agent 工程化与平台化
```

这样准备出来的能力可以同时覆盖：

- AI Infra / ML Systems 工程师
- LLM 推理服务与模型平台工程师
- Agent 后端 / Agent 平台工程师
- 偏系统的算法工程师
- C++ 后端 / 高性能服务开发

相关文档：

- [就业方向规划与学习路线](/blog/career-planning-learning-roadmap/)
- [前沿算法岗位从零开始路线图](/blog/algorithm-career-roadmap/)
- [uv包管理工具实践哲学与完整使用流程](/blog/uv-package-manager-guide/)

---

## 总体路线

最推荐的能力组合是：

```text
C++ / CSAPP / Linux
→ 算法与数据结构
→ 后端与分布式系统
→ PyTorch / LLM 基础
→ CUDA / Triton / vLLM
→ Agent 工程化
```

其中 `Agent` 适合作为上层应用方向，`AI Infra` 和 `后端/C++` 是底层护城河。只学 Agent 框架容易变成调 API；只学 C++ 又可能离 AI 岗位太远。把两者接起来，最好的作品形态是：

```text
一个可观测、可评测、可部署、可扩展的 LLM/Agent 后端系统
```

---

## 学习模块优先级

| 优先级 | 模块 | 为什么重要 | 交付标准 |
|---|---|---|---|
| P0 | C++ 与计算机系统 | 决定后端、AI Infra、性能优化的底层理解 | 能写稳定的多线程程序，能解释内存、链接、缓存、并发问题 |
| P0 | 算法与数据结构 | 面试硬门槛，也是系统设计中的基本语言 | 中等题稳定，图、堆、二分、DP、并查集不怵 |
| P0 | 后端与分布式系统 | AI Infra 和 Agent 平台最终都要上线服务 | 能实现 RPC、KV store、任务队列、限流、监控 |
| P1 | PyTorch 与 LLM 基础 | 进入 AI Infra 和算法方向的桥 | 能写训练循环，理解 Transformer、微调和评测 |
| P1 | CUDA / Triton / 推理服务 | AI Infra 的核心差异化能力 | 能写基础 kernel，能部署 vLLM 并 benchmark |
| P1 | Agent 工程化 | 贴近当前落地岗位和项目机会 | 能实现工具调用、RAG、workflow、tracing、eval |
| P2 | K8s / MLOps / 可观测性 | 平台岗加分项，线上系统必备 | 能容器化、部署、监控、定位性能瓶颈 |

---

## 必读书籍

### 计算机系统与 C++

| 资源 | 用途 | 建议读法 |
|---|---|---|
| [Computer Systems: A Programmer's Perspective](https://csapp.cs.cmu.edu/) | 计算机系统底座，理解程序如何运行 | 精读第 1-3、6、8、9、10、12 章 |
| 《Effective Modern C++》 | 现代 C++ 语义、RAII、移动语义、模板习惯 | 边读边重构自己的 C++ 小项目 |
| [C++ Concurrency in Action](https://www.manning.com/books/c-plus-plus-concurrency-in-action-second-edition) | C++ 多线程、锁、原子变量、内存模型 | 配合线程池、任务队列项目练习 |
| [C++ Core Guidelines](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines) | 现代 C++ 长期查阅手册 | 遇到风格、生命周期、所有权问题时查阅 |

### 后端与分布式系统

| 资源 | 用途 | 建议读法 |
|---|---|---|
| [Designing Data-Intensive Applications](https://www.oreilly.com/library/view/designing-data-intensive-applications/9781491903063/) | 数据系统、复制、分区、一致性、流处理 | 后端和 AI Infra 都建议精读 |
| [MIT 6.5840 Distributed Systems](https://pdos.csail.mit.edu/6.824/) | 分布式系统经典课，含 MapReduce、Raft、KV store | 至少做 MapReduce 和 Raft/KV labs |
| [CMU 15-445/645 Database Systems](https://15445.courses.cs.cmu.edu/) | 数据库系统实现，项目质量高 | 适合补 buffer pool、索引、查询执行 |

### 算法与机器学习

| 资源 | 用途 | 建议读法 |
|---|---|---|
| [Algorithms by Jeff Erickson](https://jeffe.cs.illinois.edu/teaching/algorithms/) | 算法理论与直觉，免费教材 | 按专题补图、DP、贪心、复杂度 |
| [Dive into Deep Learning](https://d2l.ai/) | 深度学习入门，代码和数学结合 | 先用它建立 ML/DL 主线 |
| [Deep Learning Book](https://www.deeplearningbook.org/) | 深度学习理论参考书 | 用作查漏补缺，不建议一开始硬啃 |

---

## 官方课程与文档

### AI Infra / ML Systems

| 资源 | 用途 | 重点 |
|---|---|---|
| [CMU Deep Learning Systems](https://dlsyscourse.org/) | 深度学习系统全栈课程 | 自动求导、算子、编译、训练系统 |
| [Stanford CS336: Language Modeling from Scratch](https://cs336.stanford.edu/) | 从零理解 LLM 训练与系统 | tokenizer、Transformer、训练、推理、profiling |
| [PyTorch FSDP 文档](https://docs.pytorch.org/docs/stable/fsdp.html) | 分布式训练基础 | 参数、梯度、优化器状态如何分片 |
| [PyTorch FSDP2 Tutorial](https://docs.pytorch.org/tutorials/intermediate/FSDP_tutorial.html) | 官方上手教程 | 小规模跑通并理解显存变化 |
| [CUDA C++ Programming Guide](https://docs.nvidia.com/cuda/cuda-programming-guide/index.html) | CUDA 官方权威文档 | GPU 执行模型、内存层次、kernel 编写 |
| [Triton Documentation](https://triton-lang.org/) | 更适合 AI kernel 入门 | matmul、softmax、layernorm 小练习 |
| [vLLM Documentation](https://docs.vllm.ai/) | LLM 推理服务核心项目 | continuous batching、KV cache、engine 参数、benchmark |

### LLM / 算法 / NLP

| 资源 | 用途 | 重点 |
|---|---|---|
| [Stanford CS224N](https://web.stanford.edu/class/cs224n/) | NLP 与深度学习经典课 | Transformer、预训练、NLP 任务 |
| [Full Stack Deep Learning](https://fullstackdeeplearning.com/) | 从模型到产品的工程视角 | 训练、部署、评测、LLMOps |
| [Full Stack LLM Bootcamp](https://fullstackdeeplearning.com/llm-bootcamp/) | LLM 应用工程入门 | RAG、eval、产品化、部署 |
| [DataTalksClub MLOps Zoomcamp](https://github.com/DataTalksClub/mlops-zoomcamp) | MLOps 免费项目课 | 实验追踪、部署、监控、pipeline |

### Agent 工程化

| 资源 | 用途 | 重点 |
|---|---|---|
| [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/) | 官方 Agent SDK | turns、tool execution、handoffs、sessions |
| [OpenAI Agents SDK Tracing](https://openai.github.io/openai-agents-python/tracing/) | Agent 可观测性 | LLM generations、tool calls、handoffs、guardrails |
| [OpenAI Agents SDK Guardrails](https://openai.github.io/openai-agents-python/guardrails/) | 安全与边界控制 | 输入/输出检查、工具调用约束 |
| [LangGraph / LangSmith Agent Docs](https://docs.langchain.com/langsmith/develop-agents-overview) | 复杂 Agent workflow | streaming、human-in-the-loop、MCP、tracing |
| [Hugging Face Agents Course](https://huggingface.co/learn/agents-course/unit0/introduction) | 免费 Agent 入门课 | 从基础 agent 到工具调用实践 |

---

## 分方向学习建议

### 1. C++ 与系统基础

目标不是“会写语法”，而是能写可靠、高性能、可调试的系统程序。

必须掌握：

- RAII、智能指针、生命周期与所有权
- 移动语义、完美转发、模板基础
- 多线程、锁、条件变量、原子变量、内存模型
- Linux 进程、线程、文件、socket、epoll/io_uring 基础
- cache locality、false sharing、profiling、benchmark

建议项目：

| 项目 | 训练能力 |
|---|---|
| C++ 线程池 | 并发、任务队列、条件变量、优雅退出 |
| C++ 内存池 | 内存分配、对象生命周期、性能 benchmark |
| mini RPC | 网络、序列化、线程模型、超时重试 |
| 高性能日志库 | 异步写入、缓冲、锁竞争优化 |

---

### 2. 算法与面试

算法学习不要只追求题量，而要建立题型模板和复盘体系。

优先顺序：

1. 数组、哈希、双指针、滑动窗口
2. 二分、前缀和、差分
3. 栈、队列、堆、单调栈、单调队列
4. 二叉树、DFS、BFS、回溯
5. 图、拓扑排序、最短路、并查集
6. 动态规划：背包、区间、状态机、树形 DP
7. 高频困难题适量练，不要一开始陷进去

建议标准：

| 阶段 | 目标 |
|---|---|
| 入门 | 100 道基础题，覆盖所有常见数据结构 |
| 提升 | 200 道中等题，能稳定写出主流题型 |
| 秋招 | 250-300 道高质量题，有错题复盘和限时训练 |

---

### 3. 后端与分布式系统

后端方向的重点不是 CRUD，而是系统边界、性能、可靠性和数据一致性。

必须掌握：

- HTTP、RPC、序列化、连接池
- MySQL / PostgreSQL 基础与索引原理
- Redis、缓存一致性、热点 key、限流
- 消息队列、任务队列、重试、幂等
- 分布式一致性：Raft、复制、分区、故障恢复
- 可观测性：日志、metrics、tracing

建议项目：

| 项目 | 训练能力 |
|---|---|
| mini HTTP/RPC server | 网络编程、协议设计、并发模型 |
| Raft KV store | 共识、复制、故障恢复 |
| 任务队列系统 | 可靠投递、重试、幂等、延迟任务 |
| API Gateway | 鉴权、限流、路由、监控 |

---

### 4. AI Infra / ML Systems

AI Infra 的关键不是“会调模型”，而是理解模型在真实系统里如何训练、推理、部署、监控和优化。

必须掌握：

- PyTorch 训练循环、autograd、AMP、checkpoint
- Transformer、attention、tokenizer、KV cache
- LoRA/QLoRA、SFT、eval、ablation
- DDP、FSDP、ZeRO、NCCL、AllReduce
- vLLM/SGLang 推理服务、batching、TTFT、TPOT、p95 latency
- CUDA/Triton 基础 kernel，能做 benchmark
- Docker/K8s/GPU resource request、Prometheus/Grafana

建议项目：

| 项目 | 训练能力 |
|---|---|
| nanoGPT 训练复现 | Transformer、训练循环、显存分析 |
| LoRA 微调 + 评测 pipeline | 数据、训练、评测、可复现 |
| vLLM 推理服务 benchmark | 吞吐、延迟、batching、KV cache |
| Triton matmul/softmax/layernorm | GPU kernel、访存、性能对比 |
| K8s 部署模型服务 | 容器化、GPU 调度、监控 |

---

### 5. Agent 开发

Agent 开发要避免只停留在“套一个框架”。真正有岗位价值的是工程化能力：

- 工具调用与权限边界
- RAG 与数据权限
- workflow、状态机、任务恢复
- human-in-the-loop
- eval 与回归测试
- tracing 与成本统计
- 队列、缓存、重试、超时、限流
- 多租户、鉴权、审计日志

建议项目：

| 项目 | 训练能力 |
|---|---|
| RAG 问答后端 | embedding、检索、rerank、引用溯源 |
| 工具调用 Agent | function calling、权限、错误处理 |
| Code Review Agent | 代码解析、PR 上下文、静态检查、报告生成 |
| Agent workflow platform | 多步骤任务、状态持久化、人工确认、tracing |
| Agent eval harness | 数据集、指标、回归测试、成本统计 |

---

## 推荐项目组合

如果只做几个最有简历价值的项目，建议优先这 5 个。

### 1. C++ mini RPC + 线程池

目标：证明 C++ 后端和系统能力。

应包含：

- 线程池
- TCP 连接管理
- 简单序列化协议
- 超时和重试
- benchmark
- README 说明性能结果

### 2. MIT 6.5840 Raft KV Store

目标：证明分布式系统能力。

应包含：

- Raft leader election
- log replication
- snapshot
- fault tolerance
- KV service
- 测试说明和踩坑记录

### 3. Triton/CUDA Kernel Benchmark

目标：证明 AI Infra 性能优化潜力。

应包含：

- vector add
- reduce
- softmax
- matmul 或 layernorm
- 与 PyTorch baseline 对比
- Nsight / profiler 结果截图或表格

### 4. vLLM LLM Inference Service

目标：证明推理服务和模型平台能力。

应包含：

- OpenAI-compatible API
- streaming
- batching 配置
- TTFT / TPOT / throughput / p95 latency
- Docker 部署
- Prometheus/Grafana 监控

### 5. Production-style Agent Backend

目标：连接 Agent、后端和 AI Infra。

应包含：

- RAG
- tool calling
- task queue
- tracing
- eval
- auth
- rate limit
- 成本统计
- 错误恢复

---

## 12个月学习顺序

这是一条偏稳的顺序，不要求每一步完全结束再进入下一步，但主线不要乱。

| 时间 | 主线 | 交付 |
|---|---|---|
| 第 1-2 个月 | C++、CSAPP、Linux、LeetCode 基础 | 线程池、内存池、100 道算法题 |
| 第 3-4 个月 | 后端、网络、数据库、分布式入门 | mini RPC、Redis/MySQL 小项目 |
| 第 5-6 个月 | MIT 6.5840 / DDIA | MapReduce、Raft KV store |
| 第 7-8 个月 | PyTorch、Transformer、D2L、CS224N | mini Transformer、LoRA 微调 |
| 第 9-10 个月 | AI Infra：FSDP、CUDA/Triton、vLLM | kernel benchmark、推理服务 benchmark |
| 第 11-12 个月 | Agent 工程化 + 项目整合 | Production-style Agent backend |

---

## 每周学习节奏

如果一周能投入 20-25 小时，可以这样分配：

| 模块 | 时间 | 目标 |
|---|---:|---|
| C++ / 系统 / 后端 | 6-8 小时 | 写代码和读源码 |
| 算法题 | 4-5 小时 | 每周 6-10 题，必须复盘 |
| AI / ML / Infra | 6-8 小时 | 课程 + 项目推进 |
| 文档与复盘 | 2-3 小时 | 写 README、技术这里、踩坑记录 |
| 行业/论文跟进 | 1-2 小时 | 只跟和项目相关的内容 |

---

## 常见误区

### 误区一：五个方向平均用力

平均用力会导致每个方向都浅。更好的方式是用 `AI 系统工程` 作为主线，把后端、C++、算法、Agent 都服务于这个主线。

### 误区二：Agent 只学框架

框架很快会变。真正稳定的是：

- 状态管理
- 工具调用
- 权限边界
- 可观测性
- 评测
- 失败恢复
- 成本控制

### 误区三：AI Infra 只看论文不写系统

AI Infra 岗位很看重动手。只会讲 FlashAttention、PagedAttention、FSDP 不够，最好能给出自己的 benchmark、部署记录和性能分析。

### 误区四：C++ 只刷语法题

C++ 的求职价值来自系统能力，不是语法熟练度本身。要尽早写线程池、RPC、日志库、内存池这类项目。

### 误区五：算法刷题没有复盘

没有复盘的刷题很容易“看懂但写不出”。每道错题至少记录：

- 题型
- 核心思路
- 卡住原因
- 模板代码
- 一周后是否能独立写出

---

## 最小可执行版本

如果时间有限，只做下面这些：

1. 精读 CSAPP 核心章节，写一个 C++ 线程池
2. 刷 200 道 LeetCode 高频题并做错题本
3. 读 DDIA，做 MIT 6.5840 的 Raft KV store
4. 用 D2L + CS224N 补深度学习和 Transformer
5. 用 vLLM 部署一个 LLM 推理服务并做 benchmark
6. 用 OpenAI Agents SDK 或 LangGraph 做一个带 tracing 和 eval 的 Agent 后端

这 6 件事做扎实，比泛泛看 30 门课更有求职信号。

---

## 最终目标

这条路线最后要让简历和面试呈现出一种清晰信号：

> 我不是只会调用模型 API，也不是只会写普通后端。我能理解模型系统的底层约束，能写可靠的服务，能做性能分析，能把 LLM/Agent 系统真正部署、评测和维护起来。

如果要给这条路线起一个统一名字，可以叫：

```text
面向 AI Infra 与 Agent 平台的系统工程路线
```
