---
title: "总览：核心公式与知识结构"
description: "从 Agent = LLM + 上下文 + 工具出发，说明环境边界、Harness 工程与后续章节的关系。"
pubDate: 2026-10-05
tags:
  - "AI Agent"
  - "学习笔记"
  - "LLM"
category: course
series: ai-agent
order: 1
cover: /covers/series-ai-agent.svg
---

## 核心公式

AI Agent 的最小工程结构是：

```text
Agent = LLM + 上下文 + 工具
```

这个公式只描述 Agent 边界之内的组成部分，不包含 Agent 要与之交互的 Environment。加号表示工程组件的组合，不是一个形式化定义。

- **LLM**：理解意图、推理、规划，并选择下一步行动。
- **上下文**：当前决策可见的信息，包括观察、历史、记忆、任务状态和工具定义。
- **工具**：Agent 感知或改变外部世界的接口，包括名称、参数、调用协议和适配器。

## Agent 与 Environment

Agent 与 Environment 构成闭环：

```text
Environment --观察--> Agent --行动--> Environment
```

Environment 包括文件系统、数据库、网页、API、用户、其他 Agent 和物理世界。上下文里放的是对环境的描述，不是环境本身；因此上下文可能过期或不完整，Agent 需要反复通过工具重新观察。

## Model 与 Harness

把公式进一步拆开，可以得到：

```text
Agent = Model + Harness
```

Model 负责决策；Harness 负责构造上下文、暴露工具、运行循环、管理状态、执行约束、验证结果和纠错。生产系统的可靠性主要来自 Harness，而不是单次模型输出的质量。

Harness 可以归纳为五项职责：

1. 上下文管理。
2. 工具接口。
3. 约束。
4. 验证。
5. 纠正。

模型选型、编排模式和护栏同样重要，但它们不是 Harness 的独立组件，而是贯穿这五项职责的设计决策。

<figure class="diagram">
  <img src="../../figures/ai-agent/model-harness.svg" alt="Agent 边界内的 Model 与 Harness；Harness 负责上下文管理、工具接口、约束、验证和纠正" width="800" height="410" loading="lazy" decoding="async">
  <figcaption><strong>Model 与 Harness。</strong> Harness 负责运行与治理，Model 负责决策，工具与动作接口连接外部环境。</figcaption>
</figure>

## 后续章节如何展开

- 第 1 章建立边界与术语。
- 第 2 至 6 章分别展开上下文、记忆、工具、Coding Agent 和交互。
- 第 7 至 9 章讨论评估、后训练和持续进化。
- 第 10 章讨论多 Agent 协作。
- 收束部分回到公式，说明三个组成部分如何共同决定系统能力。

读这一章不需要记住所有术语。先抓住“边界、闭环、三分法”三个结构，后面每一章都会把其中一个部分展开。
