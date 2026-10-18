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

## 一个最小端到端示例

样本文件使用 JSONL，一行一个任务。字段至少包含稳定 ID、输入、标签和切分，避免结果只能用文件名对应：

```jsonl
{"id":"issue-001","input":"...","label":"src/auth/session.py:42","split":"dev"}
{"id":"issue-002","input":"...","label":"src/api/orders.py:17","split":"test"}
```

运行器只做三件事：读取样本、调用模型、把原始响应和评分一起写入 `runs/`。目录按 `promptVersion/model/split` 分层，每次运行保留一个 `run.json`，记录模型版本、温度、最大 token、随机种子和代码提交号。

```ts
for (const sample of samples) {
  const output = await runModel(sample, { model, promptVersion, temperature, seed });
  const result = { sampleId: sample.id, output, score: score(output, sample.label) };
  await appendJsonl(`runs/${promptVersion}/${model}/${sample.split}.jsonl`, result);
}
```

汇总阶段不要只看平均值。至少同时输出：

- 每个 split 的均值、中位数和 p95；
- 失败样例按错误类型分组的数量；
- 同一 prompt 版本在不同模型上的配对比较；
- 与上一次运行的差值，以及差值是否超过评测集本身的波动。

复现检查清单：固定 prompt 与模型版本；固定样本切分；记录温度、种子和最大 token；保存原始输出；让评分脚本可单独重跑；在改动 prompt 或模型后重新跑完整测试集，而不是只挑几个成功案例。

## 评分与失败分类

评分函数要尽量小、可测试，并且与任务定义对齐。下面是一个文件定位任务的例子：完全命中、文件级命中、行级部分命中分别给不同分数。

```ts
type Sample = { id: string; input: string; label: string; split: 'dev' | 'test' };

export function score(output: string, label: string) {
  const predicted = output.trim();
  if (predicted === label) return 1;
  const [predFile] = predicted.split(':');
  const [labelFile] = label.split(':');
  if (predFile === labelFile) return 0.5;
  return 0;
}
```

评分之后，把失败样本按类型归档，不要只留一个总分。常见的分类是：

- 检索失败：没有找到相关文件或上下文；
- 推理失败：找到了证据，但结论错误；
- 工具使用失败：命令、参数或调用顺序不对；
- 格式失败：答案正确，但不符合解析格式；
- 拒答失败：应该回答却拒答，或应该说明不确定却编造。

失败分类的价值在于，它直接指向下一步该改哪里：检索失败改召回，推理失败改 prompt 或模型，格式失败改解析器或约束，拒答失败改安全提示和评估标准。

## 小结

毕业论文阶段写博客，不必追求每篇都“很完整”，但需要让每篇文章都能回到一个稳定的实验体系里。这也是我把博客和项目展示站放在一起建设的原因。
