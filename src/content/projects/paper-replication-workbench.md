---
title: Paper Replication Workbench
summary: 记录论文复现过程中的环境配置、实验步骤和差异分析，作为后续写作与展示的统一入口。
pubDate: 2026-02-14
tags:
  - 实验复现
  - 论文阅读
  - 工具平台
status: 已完成
featured: true
cover: /covers/project-replication.svg
---

论文复现容易卡在环境漂移、脚本参数散落、消融对照无据可查三处。这个工作台把环境隔离、数据版本清单和结果对齐模板收进同一套约定，让每篇复现都有可直接回归的工程骨架。

## 标准结构与工作流

1. **隔离环境锁定**：Python 依赖统一交给 `uv` 锁定在 `uv.lock`，CUDA 与系统变量写成可重建的脚本入口，参见 [现代 Python 工具链：uv 实践指南](/blog/uv-package-manager-guide/)。
2. **输入输出约定**：原始数据只读挂载，中间特征与模型检查点按 Run ID 分目录落盘，避免覆盖历史对照实验。
3. **差异归因核对**：复现指标与论文汇报值有偏差时，按「数据预处理 → 评测脚本口径 → 超参默认值」三层逐项排查。

## 配套经验沉淀

工作台沉淀下来的阅读方法、误差排查记录与基线评测脚本分别收在 [论文精读笔记框架](/blog/paper-reading-notes/) 和 [AgentBench 论文与实现梳理](/blog/paper-agent-bench/)，让算法实现与理论分析保持同一条脉络。
