---
title: "AI Infra、算法、Agent 与后端学习资源推荐"
description: "面向 AI Infra、算法、Agent 与后端岗位的系统工程学习路线：从 C++、系统与分布式基础，到 PyTorch、CUDA、vLLM 和 Agent 工程化。"
pubDate: 2026-07-06
updatedDate: 2026-10-26
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

这份路线不是一条适合所有人的 12 个月计划。AI Infra、C++ 后端、Agent 工程是三套不同的岗位准备，共享一部分系统基础，但项目、面试重点和时间投入不一样。先选一条主线，再把另外两条当辅助。

相关文档：

- [就业方向规划与学习路线](/blog/career-planning-learning-roadmap/)
- [前沿算法岗位从零开始路线图](/blog/algorithm-career-roadmap/)

## 先选主线

| 主线 | 主要语言 | 核心能力 | 适合的人 |
| --- | --- | --- | --- |
| AI Infra / ML Systems | Python，C++ 加分 | PyTorch、推理服务、CUDA/Triton、分布式训练、K8s | 想做模型训练/推理系统、平台、性能优化 |
| C++ / 后端 | C++，Go/Python 加分 | Linux、网络、数据库、RPC、分布式、性能 | 想做后端、基础架构、高性能服务 |
| Agent / LLM 应用工程 | Python/TypeScript | 后端、RAG、工具调用、eval、可观测性 | 想做 LLM 应用、Agent 平台、AI 产品后端 |
| 算法岗 | Python | 深度学习、Transformer、训练/评测、论文复现 | 想做模型算法、研究工程；见[另一篇路线](/blog/algorithm-career-roadmap/) |

现实一点说：同时把四条线都准备好，通常每条都只能停在“看过教程”。选一条主线，另一条只补到能配合项目的程度。

## 共同底座

不管选哪条，下面这些都要有：

- 一门主力语言：Python 或 C++，能写 500 行以上的完整项目，不是只会做题。
- 计算机基础：进程/线程、内存、文件、网络、基本的性能分析。
- Git、Linux、Docker：能独立把项目跑起来、打包、部署。
- 算法：Hot100 常见题型能稳定写出来，面试前再集中刷。
- 一个能讲 20 分钟的项目：有 README、有数据、有失败记录。

## AI Infra / ML Systems

### 先学什么

1. Python 工程化：包管理、类型标注、测试、日志。
2. PyTorch：训练循环、autograd、DataLoader、AMP、checkpoint。
3. Transformer：attention、tokenizer、KV cache。
4. 推理服务：vLLM 或 SGLang，理解 batching、TTFT、TPOT、吞吐和 p95 延迟。
5. 分布式训练：DDP、FSDP、ZeRO、NCCL，重点是显存和通信，不是把 Megatron 跑通。
6. CUDA/Triton：能写 vector add、reduce、softmax、matmul，能和 PyTorch baseline 对比。
7. 部署与监控：Docker、K8s、Prometheus/Grafana。

### 资源

- [Stanford CS336](https://cs336.stanford.edu/)：从零理解 LLM 训练与系统，优先级最高。
- [CMU Deep Learning Systems](https://dlsyscourse.org/)：自动求导、算子、训练系统。
- [PyTorch FSDP 文档](https://docs.pytorch.org/docs/stable/fsdp.html)：分布式训练入门。
- [CUDA C++ Programming Guide](https://docs.nvidia.com/cuda/cuda-programming-guide/index.html)：需要查手册时看。
- [Triton Documentation](https://triton-lang.org/)：写 kernel 入门比 CUDA 轻。
- [vLLM Documentation](https://docs.vllm.ai/)：推理服务主线。
- [nanoGPT](https://github.com/karpathy/nanoGPT)：从零复现一个小 GPT。
- [Designing Data-Intensive Applications](https://www.oreilly.com/library/view/designing-data-intensive-applications/9781491903063/)：做平台和分布式时补。

### 项目

优先做一个完整的推理服务，而不是五个 demo：

- 用 LoRA 微调一个小模型，整理数据、训练、评测。
- 用 vLLM 部署成 OpenAI-compatible 服务，支持 streaming。
- 压测并记录 TTFT、TPOT、吞吐、p95 延迟、GPU 利用率。
- 用 Docker 打包，部署到一台带 GPU 的机器或 K8s。
- 接 Prometheus/Grafana，写一页性能分析。

这个项目能同时讲清训练、推理、部署和性能，比“跑过 CS336”更有说服力。

## C++ / 后端

### 先学什么

1. C++ 基础：RAII、智能指针、移动语义、模板基础。
2. 并发：线程池、锁、条件变量、原子变量、内存模型。
3. Linux：进程、线程、文件、socket、epoll。
4. 网络与协议：TCP、HTTP、RPC、序列化。
5. 数据库：索引、事务、MVCC，至少懂 MySQL 或 PostgreSQL 的基本原理。
6. 分布式：复制、分区、一致性、Raft。
7. 性能：cache、false sharing、profiling、benchmark。

### 资源

- [CSAPP](https://csapp.cs.cmu.edu/)：第 1–3、6、8、9、10、12 章优先。
- 《Effective Modern C++》：现代 C++ 语义和习惯。
- [C++ Concurrency in Action](https://www.manning.com/books/c-plus-plus-concurrency-in-action-second-edition)：多线程和内存模型。
- [MIT 6.5840](https://pdos.csail.mit.edu/6.824/)：分布式系统，做 MapReduce 和 Raft。
- [CMU 15-445/645](https://15445.courses.cs.cmu.edu/)：数据库系统实现。
- [DDIA](https://www.oreilly.com/library/view/designing-data-intensive-applications/9781491903063/)：数据系统设计。

### 项目

- C++ 线程池 + 任务队列：练并发和优雅退出。
- mini RPC：练网络、序列化、超时和重试。
- Raft KV store：练共识、复制、故障恢复。
- 高性能日志库：练异步写入和锁竞争。

不要只写“语法练习”。后端岗位看的是你能不能把服务跑稳，而不是会不会写智能指针。

## Agent / LLM 应用工程

### 先学什么

1. 后端基础：HTTP、鉴权、队列、缓存、重试、限流。
2. LLM 调用：prompt、function calling、流式输出、成本统计。
3. RAG：切分、embedding、检索、rerank、引用溯源。
4. Agent：工具调用、状态机、human-in-the-loop、失败恢复。
5. 评测：数据集、指标、回归测试、人工抽检。
6. 可观测性：tracing、日志、token/成本统计。

### 资源

- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/)：工具调用、handoff、tracing。
- [LangGraph / LangSmith](https://docs.langchain.com/langsmith/develop-agents-overview)：复杂 workflow 和可观测性。
- [Hugging Face Agents Course](https://huggingface.co/learn/agents-course/unit0/introduction)：免费入门。
- [MCP 文档](https://modelcontextprotocol.io/)：工具协议与 SDK 参考。

### 项目

- 一个带 RAG 的问答后端：能引用原文、能处理无答案。
- 一个工具调用 Agent：有权限边界、超时、重试和错误提示。
- 一个 eval harness：固定数据集、指标、回归测试和成本统计。

Agent 岗位的区分度不在“用了哪个框架”，而在你能不能处理失败、控制成本、做评测和定位问题。

## 时间怎么排

不要按“第 1 个月学 C++、第 2 个月学后端、第 3 个月学 AI”排。更实际的方式是：

- 前 3 个月：补共同底座，选一个主线开始做项目。
- 中间 6 个月：主线项目做深，辅助线只补项目需要的部分。
- 最后 3 个月：面试题、项目复盘、系统设计、简历。

如果你只有 6 个月，主线项目 + 算法 + 计算机基础，比四条线都碰一遍更有效。

## 常见问题

**Q：C++ 和 AI Infra 必须同时学吗？**
不必须。AI Infra 的日常更多是 Python、PyTorch、推理框架和系统排查；C++ 在 kernel、性能、基础架构岗位更有用。先把 Python 和推理服务做熟，再补 C++。

**Q：Agent 开发要不要学 C++？**
大多数 Agent 应用岗位不需要。后端、Python/TypeScript、RAG、eval 更重要。

**Q：资源都要看完吗？**
不需要。每一条主线选 2–3 个核心资源，其他当查阅。看完不是目标，做出项目才是。

**Q：项目要做几个？**
一个做深，两个做辅助。简历上三个能讲透的项目，比十个 demo 有用。
