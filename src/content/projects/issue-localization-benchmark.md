---
title: Issue Localization Benchmark
summary: 面向软件仓库定位任务的实验基线整理，目标是形成可复现实验设置与项目展示页面。
pubDate: 2026-03-09
tags:
  - 软件工程
  - LLM
  - Benchmark
status: 进行中
featured: true
cover: /covers/project-benchmark.svg
---

这个项目梳理「面向代码仓库上下文的 Issue 定位」评测流水线，解决数据划分失真、提示模板漂移、候选排序对比不可复现的问题。

## 评测流程与目录组织

```text
exp-localization/
├── datasets/        # SWE-bench 抽样索引与仓库快照映射
├── prompts/         # 结构化检索模板（文件级 / 函数级）
├── runs/            # 各组超参下的原始预测与延迟日志
└── analysis/        # Top-k 命中率、漏检样本归因表
```

每轮实验统一锁定随机种子、仓库 Commit 哈希和模型温度参数，把输出对齐成固定的 JSONL 格式后再做聚合指标统计；详细评测思路见 [大模型实验评测流水线](/blog/llm-eval-pipeline/)。

## 核心指标与观察维度

- **准确率层级**：区分 File-level Top-k、Symbol-level 与最终 Patch 目标一致性
- **失败模式归类**：统计究竟是关键词未命中、调用图跨文件断裂，还是上下文窗口截断导致的漏检
- **成本边界**：记录平均输入 token 量与单条样本检索耗时，对比简单 BM25 与结构化代理定位的性价比
