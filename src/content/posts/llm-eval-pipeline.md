---
title: 为 LLM 软件工程评测搭一个可持续迭代的实验流水线
description: 从任务定义、样本组织到结果记录，梳理一个适合毕业论文阶段持续演进的评测结构。
pubDate: 2026-03-18
updatedDate: 2026-03-26
tags:
  - LLM
  - 软件工程
  - 实验复现
draft: false
cover: /covers/post-llm.svg
featured: true
---

研究型博客最容易在中后期失控的，不是写作速度，而是**实验结构没有被设计成可迭代的资产**。如果每次评测都重新组织数据、脚本和记录方式，文章会越写越碎，论文材料也越来越难回收。

## 为什么先搭流水线

我现在更倾向于把一次评测拆成四层：

1. 任务定义：明确输入、输出、评分方式和约束。
2. 数据组织：把样本、标签和补充材料放进稳定目录。
3. 运行脚本：用统一接口触发模型调用与结果保存。
4. 结果总结：把指标、案例和错误模式沉淀成可复用模板。

这四层的意义不在于“工程上更优雅”，而在于后续你要把这些材料改写成论文、报告或答辩文稿时，它们能自然对齐。

## 一份够用的目录结构

```text
experiments/
  issue-localization/
    datasets/
    prompts/
    runs/
    analysis/
```

这个结构很朴素，但非常适合论文阶段。`runs/` 保存原始输出，`analysis/` 放失败案例、图表和人工备注，能够显著降低后续回溯成本。

## 指标之外还要留什么

单独保存准确率、召回率远远不够。我通常会额外记录：

- 失败样例的类型标签
- Prompt 版本号
- 数据切分方式
- 模型与温度参数

这些信息决定了我们能不能解释“为什么这次结果变了”。

> 如果日志无法支持解释，实验就很难转化成论文叙述。

## 一个简单的记录函数

```ts
type RunRecord = {
  task: string;
  promptVersion: string;
  model: string;
  score: number;
  notes?: string;
};

export function summarizeRun(record: RunRecord) {
  return `${record.task} | ${record.model} | v${record.promptVersion} | ${record.score}`;
}
```

## 小结

毕业论文阶段写博客，不必追求每篇都“很完整”，但需要让每篇文章都能回到一个稳定的实验体系里。这也是我把博客和项目展示站放在一起建设的原因。
