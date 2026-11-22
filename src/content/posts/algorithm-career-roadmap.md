---
title: "前沿算法岗位从零开始路线图"
description: "基于当前公开岗位和官方学习资源，整理 AI 时代前沿算法岗位的核心能力要求、从零开始的阶段路线、项目标准、方向选择与现实时间预期。"
pubDate: 2026-06-03
updatedDate: 2026-10-26
tags:
  - "职业规划"
  - "算法"
  - "AI"
  - "学习路线"
category: knowledge
cover: /covers/post-learning-path.svg
---

“前沿算法岗”包含多个细分方向，常见岗位有 Research Engineer、ML Engineer、LLM / 多模态算法、训练系统、评测与后训练。它们的共同要求是能完成模型训练与评测，并分析实验结果，而不只是调用现成模型。

延伸阅读：

- [就业方向规划与学习路线](/blog/career-planning-learning-roadmap/)

## 岗位在做什么

当前公开岗位大致分几类：

- 预训练、后训练、RLHF：大规模训练和实验设计。
- 评测（eval）：设计数据集、指标、回归测试，判断模型能力。
- 推理与部署：推理优化、服务化、性能分析。
- 多模态：视觉、语音、视频与文本的联合建模。
- 训练基础设施：分布式训练、显存优化、数据流水线。

越往“研究工程”走，越看重实验能力和系统能力；越往“应用算法”走，越看重数据、微调、评测和业务理解。

## 核心能力

1. **工程基本功**：Python、Linux、Git、调试、日志、可复现实验。
2. **数学和 ML 基础**：线性代数、概率统计、优化；理解 loss、梯度、过拟合、评估指标。
3. **PyTorch**：数据加载、模型定义、训练循环、反向传播、checkpoint。
4. **LLM/Transformer**：tokenizer、attention、预训练、SFT、LoRA、评测。
5. **系统能力**：GPU、显存、吞吐、多卡训练、推理服务。
6. **实验能力**：读论文、复现、对比实验、消融实验、失败分析。
7. **表达**：写文档、讲清权衡取舍、汇报结果。

算法岗筛人时，工程基本功和实验能力与数学基础同样关键。如果缺少调试、复现和代码组织能力，项目往往很难推进。

## 阶段路线

### 0–2 个月：能写能跑

- Python、Git、Linux、NumPy。
- 能写中等长度脚本，会管理代码，能读改训练脚本。

### 2–4 个月：基础 ML/DL

- 线性/逻辑回归、MLP、CNN。
- loss、优化器、正则化、过拟合、训练/验证/测试。
- 能不靠封装写出基础训练循环，能解释模型为什么好或差。

### 4–7 个月：Transformer/LLM

- 自注意力、Transformer 结构、tokenizer。
- 数据处理、微调、评测。
- 能跑通一个小型 LLM 微调，能解释 prompt、数据和参数变化对结果的影响。

### 7–10 个月：项目

至少做三类项目：

1. 一个从零实现的小 Transformer 项目。
2. 一个 LoRA/SFT 与评测项目。
3. 一个推理优化或部署项目。

每个项目都应包含完整代码仓库、实验记录、结果分析和失败复盘，而不只是一个 notebook。

### 10–18 个月：选方向

- 应用型 LLM 算法：微调、RAG、Agent、评测。
- 训练系统/性能：分布式、显存、推理优化。
- 预训练/后训练/evals：更偏研究工程。
- 多模态、RL/RLHF：门槛更高，需要相应项目。

到这个阶段，你应该能说清楚自己想投什么方向，项目也开始围绕这个方向组合。

## 项目标准

能投递的项目通常具备：

- 完整流程：数据、训练、验证、结果、误差分析。
- 对比实验：和 baseline 差多少，为什么。
- 工程痕迹：配置、日志、checkpoint、复现命令、README。
- 明确主题：小规模 Transformer、LoRA/SFT、评测与推理优化。
- 能讲权衡取舍：效果与显存、速度与精度、数据量与收益之间的关系。

只有“跑通一个开源模型”不算项目，除非你能说清楚改了什么、为什么改、结果是否可信。

## 方向选择

- **想尽快就业**：应用型 LLM 算法、微调、RAG、Agent。岗位多，门槛相对低，但竞争也大。
- **想建立壁垒**：训练系统、推理优化、分布式训练。难度高，工程壁垒强。
- **想冲前沿实验室**：预训练、后训练、evals、可解释性、RL。要求高，通常需要更强的研究和工程背景。

## 时间预期

- 纯零基础到能投应用型 AI/LLM 岗：9–15 个月。
- 到比较像前沿实验室候选人：18–36 个月。

有计算机背景、Python 基础、数学基础和项目经验的人上手会快得多。准备周期会因基础不同而有明显差异，真正拉开差距的是持续输出项目、文档和实验记录。

## 资源

- [Dive into Deep Learning](https://d2l.ai/chapter_preliminaries/index.html)：系统打底。
- [PyTorch Learn the Basics](https://docs.pytorch.org/tutorials/beginner/basics/intro.html)：补框架使用。
- [Hugging Face LLM Course](https://huggingface.co/learn/llm-course/chapter1/1)：Transformer/LLM 主线。
- [OpenAI Research Engineer](https://openai.com/careers/research-engineer-san-francisco/)、[OpenAI Residency](https://openai.com/residency/)、[Anthropic Jobs](https://www.anthropic.com/jobs)、[DeepMind Careers](https://deepmind.google/careers/)：用来参考岗位要求，不必机械背诵岗位描述。

## 常见误区

- 以为算法岗只看数学：工程和实验能力同样筛人。
- 以为会调库就够了：说不清数据、结果和实验设计，很难通过面试。
- 以为必须先学完所有基础再做项目：基础和项目并行更现实。
- 以为读论文就会变强：没有实现、复现和失败分析，论文只是“看过”。
- 以为前沿岗位只收名校 PhD：背景重要，但项目和实验记录同样重要。
