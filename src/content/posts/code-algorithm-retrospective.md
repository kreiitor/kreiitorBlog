---
title: 从 code_algorithm 看算法练习仓库怎样才能变成长期资产
description: 以 C++ 算法练习仓库 code_algorithm 为例，看目录分层、单文件可运行的取舍，以及 README、编码、模块化和题解索引四处待改。
pubDate: 2026-04-05
tags:
  - C++
  - 算法学习
  - 工程化
  - 项目复盘
draft: false
cover: /covers/post-code-algorithm.svg
featured: true
---

最近重新看了一遍自己的算法练习仓库 [code_algorithm](https://github.com/kreiitor/code_algorithm)。它是一条持续累积的学习轨迹：写基础数据结构和算法实现，记录 OJ 做题过程，再慢慢把零散练习收拢起来。

这类仓库很常见，能长期留下的不多。多数停在“刷完一道题、提交一个文件”这一层，没有继续沉淀。`code_algorithm` 已经开始分层，这是它值得继续做的原因。

## 目录已经分出层次

```text
algorithms/
data_structures/
hdoj/
docs/
```

四个目录对应三类内容：基础实现、题目练习、文档说明。没有把所有文件塞进一个扁平目录。

具体内容也往这个方向走。`algorithms/Sort.cpp` 把冒泡、选择、插入、快速、归并五种排序放在同一个文件里对照；`algorithms/Search.cpp` 有线性查找，也有二分的迭代版和递归版；`data_structures/BinarySearchTree.cpp` 继承 `BinaryTree.cpp`，补齐插入、查找、删除和最值查询。从基础结构到问题求解，这条线是看得见的。

## 每个文件都能单独跑

多数 `.cpp` 都自带 `main`。从库的角度看不划算，从学习角度很划算：一个知识点单独编译就能看到输出，回顾时不必先弄懂整套构建系统。

算法和数据结构偏练习，快速验证比工程结构重要。学习前期尤其如此。

## 还差四步

### README 和目录对不上

根目录 README 写的是 `code / latex / notes`，实际是 `algorithms / data_structures / docs / hdoj`。目录在演化，文档更新慢，这类不一致很常见。第一次进仓库的人会因此误判结构。

### 注释有编码乱码

`Sort.cpp`、`BinaryTree.cpp` 和 `docs/README.md` 里，一部分中文注释是乱码。逻辑没错，是编码在编辑器、终端、平台之间切换时留下的。不影响运行，但把仓库当复习材料再看一遍时很碍事。

### 实现还停在教学演示

`BinarySearchTree.cpp` 直接 `#include "BinaryTree.cpp"`，并在同一文件里写测试入口。学习时这样最省事，要复用到更多题目就得拆开：

- `include/` 放声明
- `src/` 放实现
- 测试和示例单独入口

### HDOJ 题解没有索引

`hdoj/` 按题号存了不少文件，说明练习一直在发生。但题号不是检索维度。要真正用起来，还得加一层索引：按题型分类、按知识点打标签、按难度或错误原因归档。否则题目越多，回看越难。

## 改造顺序

先改根 README，让它和真实目录一致，写清每个目录的职责。这一步成本最低。

再统一 UTF-8，清掉乱码注释。学习型仓库的可读性就是维护成本。

然后拆实现和入口，同时保留单文件可运行的优势：

```text
include/
src/
examples/
problems/
```

最后给题目加索引。OJ 练习到一定数量后，缺的不是新题，是回顾路径。一个标签表、一个 Markdown 索引，甚至一份 CSV 清单，都比再堆一批文件有用。

## 它现在能往上长了

算法练习看起来像在“做题”，真正留下来的却是组织知识和回看知识的方式。`code_algorithm` 有基础实现、有做题积累、有文档入口，也还有工程化的余地。它还没完成，但骨架已经立住了。
