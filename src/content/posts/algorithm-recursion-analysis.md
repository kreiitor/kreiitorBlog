---
title: "经典递归过程分析：带路径 vs 不带路径"
description: "用调用树和路径状态分析经典递归问题，区分带路径与不带路径的写法。"
pubDate: 2026-10-26
tags:
  - "算法"
  - "递归"
  - "DFS"
category: knowledge
cover: /covers/post-code-algorithm.svg
---

## 第一章  什么是递归？

### 1.1 递归的概念

递归就是一个函数直接或间接调用自己。关键在于每次调用都把问题缩小，并且有明确的停止条件，否则会无限递归。

### 1.2 一个生活中的例子

一个常见的例子是排队时问前面的人“你是第几个”。如果对方不知道，就继续问更前面的人；直到第一排的人回答“我是第 1 个”，答案再一层层传回来。递归就是这种“把问题交给更小的一层，再等结果返回”的过程。

```python
def rank(n):
    if n <= 1:          # 基准条件：第一排
        return 1
    return rank(n - 1) + 1   # 递归条件：前面的人 + 1
```

### 1.3 递归的两个核心要素

每一个递归函数都必须包含两个部分，缺一不可：

- **① 基准条件（Base Case）**：告诉递归什么时候停止。没有它，函数会无限调用自己，最终导致栈溢出（Stack Overflow）。
- **② 递归条件（Recursive Case）**：把大问题分解成更小的子问题，然后递归地解决子问题。

记法：基准条件负责停，递归条件负责缩小问题。

### 1.4 理解递归的调用过程 — 函数调用栈

当程序运行时，每次函数调用都会在内存的一个叫做 **"调用栈（Call Stack）"** 的区域中创建一个 **"栈帧"（Stack Frame）**，保存函数的参数、局部变量和返回地址。

递归的过程可以分为两个阶段：“递”和“归”。

- **"递"阶段**：一层层深入调用，把函数调用"压入"栈中。
- **"归"阶段**：触底后一层层返回，把结果"弹出"栈。

下面我们就通过具体的算法题，来深入理解这个过程。

---

## 第二章  不带路径的递归分析

**"不带路径"** 意味着：递归函数只关心**最终的返回值**，不关心"中间经过了哪些选择"。

典型场景：计算一个值，如阶乘、斐波那契数、数组求和等。

### 例题 2.1 │ 阶乘（Factorial）

| 项目 | 内容 |
|------|------|
| **LeetCode 标签** | 无（基础题） |
| **问题** | 计算 $n! = n \times (n-1) \times (n-2) \times ... \times 1$。例如 $5! = 5 \times 4 \times 3 \times 2 \times 1 = 120$ |
| **递归思路** | $n! = n \times (n-1)!$，当 $n=0$ 或 $n=1$ 时，结果是 $1$（基准条件） |

#### 代码实现（Python / C++）

```python
def factorial(n):
    # 基准条件：触底反弹
    if n == 0 or n == 1:
        return 1

    # 递归条件：把问题缩小
    return n * factorial(n - 1)

print(factorial(5))  # 输出: 120
```

```cpp
#include <iostream>
using namespace std;

int factorial(int n) {
    // 基准条件：触底反弹
    if (n == 0 || n == 1)
        return 1;

    // 递归条件：把问题缩小
    return n * factorial(n - 1);
}

int main() {
    cout << factorial(5) << endl;  // 输出: 120
    return 0;
}
```

#### 递归调用过程详解（以 n=5 为例）

**"递"的路线（向下深入）** — 依次调用，每次 n 减 1：

```
factorial(5)                     ← 第一次调用
  └── 5 * factorial(4)           ← 5 * ?  等待 factorial(4) 返回
        └── 4 * factorial(3)     ← 4 * ?  等待 factorial(3) 返回
              └── 3 * factorial(2)  ← 3 * ?  等待 factorial(2) 返回
                    └── 2 * factorial(1)  ← 2 * ?  等待 factorial(1) 返回
                          └── return 1   ← 触底！基准条件 hit！
```

**"归"的路线（向上返回）** — 逐层计算结果并返回：

```
factorial(1) = 1                                           ← 基准条件返回
factorial(2) = 2 × factorial(1) = 2 × 1 = 2               ← 向上返回
factorial(3) = 3 × factorial(2) = 3 × 2 = 6               ← 向上返回
factorial(4) = 4 × factorial(3) = 4 × 6 = 24              ← 向上返回
factorial(5) = 5 × factorial(4) = 5 × 24 = 120            ← 最终答案！
```

**调用栈快照（关键帧）**：

| 调用层 | n 的值 | 正在等待什么？ |
|--------|--------|---------------|
| 第1层 | n = 5 | 等待 factorial(4) 的结果，然后乘 5 |
| 第2层 | n = 4 | 等待 factorial(3) 的结果，然后乘 4 |
| 第3层 | n = 3 | 等待 factorial(2) 的结果，然后乘 3 |
| 第4层 | n = 2 | 等待 factorial(1) 的结果，然后乘 2 |
| 第5层 | n = 1 | 触底！直接返回 1，不再递归 |

整个计算是在“归”的阶段完成的：“递”只负责把问题分解并压入栈，“归”时才执行乘法。

---

### 例题 2.2 │ 斐波那契数列（Fibonacci）

| 项目 | 内容 |
|------|------|
| **LeetCode 509** | 斐波那契数 |
| **问题** | $F(0)=0,\ F(1)=1,\ F(n)=F(n-1)+F(n-2)$。求第 $n$ 个斐波那契数。 |
| **递归思路** | 直接按公式翻译：$F(n) = F(n-1) + F(n-2)$（虽然这种写法效率低，但非常适合理解递归结构） |

#### 代码实现（Python / C++）

```python
def fib(n):
    # 两个基准条件
    if n == 0:
        return 0
    if n == 1:
        return 1

    # 递归条件：分解为两个子问题
    return fib(n - 1) + fib(n - 2)

print(fib(5))  # 输出: 5
print(fib(7))  # 输出: 13
```

```cpp
#include <iostream>
using namespace std;

int fib(int n) {
    // 两个基准条件
    if (n == 0) return 0;
    if (n == 1) return 1;

    // 递归条件：分解为两个子问题
    return fib(n - 1) + fib(n - 2);
}

int main() {
    cout << fib(5) << endl;  // 输出: 5
    cout << fib(7) << endl;  // 输出: 13
    return 0;
}
```

#### 递归树图解（n=5）

斐波那契的递归是一棵 **二叉树**，不是一条直线：

```
                         fib(5)              ← ① 从这开始
                       /        \
                  fib(4)         fib(3)       ← ② 分为两路
                 /      \       /      \
            fib(3)    fib(2)  fib(2)   fib(1) ← ③ 继续分解...
           /    \    /   \   /   \      |
      fib(2)  fib(1)fib(1)fib(0)fib(1)fib(0) 1 ← ④ 叶子节点（基准条件）
      /   \    |     |     |     |     |
  fib(1)fib(0) 1     1     0     1     0      ← ⑤ 所有叶子都是 0 或 1
    |     |
    1     0
```

**自底向上计算**（叶子节点已知，逐层向上求和）：

```
fib(0) = 0    fib(1) = 1
fib(2) = fib(1) + fib(0) = 1 + 0 = 1
fib(3) = fib(2) + fib(1) = 1 + 1 = 2
fib(4) = fib(3) + fib(2) = 2 + 1 = 3
fib(5) = fib(4) + fib(3) = 3 + 2 = 5    ← 答案
```

> **注意**：你会发现 `fib(3)` 被计算了 2 次，`fib(2)` 被计算了 3 次！这就是为什么纯递归求斐波那契效率很低（$O(2^N)$）。实际做题时要加 **记忆化（Memoization）** 优化，不过作为理解递归结构，这个例子非常经典。

---

### 例题 2.3 │ 数组求和（Array Sum）

| 项目 | 内容 |
|------|------|
| **问题** | 给定一个数组，用递归求所有元素之和。例如 `[1, 2, 3, 4, 5] → 15` |
| **递归思路** | `sum(arr) = arr[0] + sum(arr[1:])`，即"第一个元素 + 剩余元素的和" |

#### 代码实现（Python / C++）

```python
def array_sum(arr, idx):
    """
    计算从 idx 位置到末尾的和
    arr:  原数组（不修改）
    idx:  当前处理的位置索引
    """
    # 基准条件：索引超出范围
    if idx >= len(arr):
        return 0

    # 当前元素 + 剩余部分的和
    return arr[idx] + array_sum(arr, idx + 1)

print(array_sum([1, 2, 3, 4, 5], 0))  # 输出: 15
```

```cpp
#include <iostream>
#include <vector>
using namespace std;

int array_sum(vector<int>& arr, int idx) {
    // 基准条件：索引超出范围
    if (idx >= arr.size())
        return 0;

    // 当前元素 + 剩余部分的和
    return arr[idx] + array_sum(arr, idx + 1);
}

int main() {
    vector<int> arr = {1, 2, 3, 4, 5};
    cout << array_sum(arr, 0) << endl;  // 输出: 15
    return 0;
}
```

#### 调用过程详解（arr = [1, 2, 3]）

**递的过程**：

```
array_sum(arr, 0)  → 1 + array_sum(arr, 1)
    array_sum(arr, 1)  → 2 + array_sum(arr, 2)
        array_sum(arr, 2)  → 3 + array_sum(arr, 3)
            array_sum(arr, 3)  → idx==3≥len  → return 0（触底）
```

**归的过程**：

```
array_sum(arr, 3) = 0
array_sum(arr, 2) = 3 + 0 = 3
array_sum(arr, 1) = 2 + 3 = 5
array_sum(arr, 0) = 1 + 5 = 6    ← 答案
```

#### "不带路径"的递归小结

这类递归的共同特征：**只需要返回值，不需要记录"怎么走到这一步的"**。

函数签名通常类似：`f(n) → 某个值`，计算过程是自底向上的。

> **递归模板**：先写基准条件 → 再写如何利用子问题的结果

---

## 第三章  带路径的递归分析

**"带路径"** 意味着：我们需要**记录"一路走来做了哪些选择"**。

典型场景：找出所有可能性（子集、排列、组合）、回溯问题、搜索问题等。

核心技巧：**使用一个额外的参数（通常是列表 `path`）来追踪当前路径。**

> **关键思维转换**："不带路径"是自底向上返回结果；"带路径"是自顶向下传递状态。

### 3.1 路径追踪的核心技巧

**方法一：参数传递路径** — 最常用

```python
def dfs(choices, path):
    # path —— 记录"走到当前节点经过的所有选择"
    if 到达目标:
        result.append(path)  # 把路径加入结果
        return
    for choice in choices:
        path.append(choice)      # 做选择
        dfs(choices, path)       # 递归
        path.pop()               # 撤销选择（回溯）
```

```cpp
void dfs(vector<int>& choices, vector<int>& path) {
    // path —— 记录"走到当前节点经过的所有选择"
    if (到达目标) {
        result.push_back(path);  // 把路径加入结果
        return;
    }
    for (int choice : choices) {
        path.push_back(choice);   // 做选择
        dfs(choices, path);       // 递归
        path.pop_back();          // 撤销选择（回溯）
    }
}
```

- **方法二：用返回值构建路径** — 适合路径就是返回值的情况
- **方法三：全局变量记录** — 用于需要在整个递归过程中共享状态

> **回溯（Backtracking）的本质**：走一条路 → 记录当前选择 → 继续深入 → 返回后撤销选择 → 换下一条路。就像走迷宫，每到一个岔路口，先走左边，走不通就退回来走右边。

---

### 例题 3.1 │ 子集（Subsets）

| 项目 | 内容 |
|------|------|
| **LeetCode 78** | 给你一个整数数组 `nums`，返回该数组所有可能的子集（幂集）。 |
| **示例** | 输入 `nums = [1, 2, 3]`，输出 `[[], [1], [2], [1,2], [3], [1,3], [2,3], [1,2,3]]` |
| **核心决策** | 对于每个元素，你有两个选择 — **"选它"** 或 **"不选它"**。 |

#### 代码实现（Python / C++）（选/不选模型）

```python
def subsets(nums):
    result = []       # 存放所有子集
    path = []         # 当前路径（记录选了哪些元素）

    def dfs(idx):
        # 到达终点：记录当前路径
        if idx == len(nums):
            result.append(path[:])     # path[:] 是拷贝！
            return

        # ① 选择：选当前元素
        path.append(nums[idx])          # 做选择
        dfs(idx + 1)                    # 继续走
        path.pop()                      # 撤销选择（回溯）

        # ② 选择：不选当前元素
        dfs(idx + 1)                    # 什么都不加，直接走

    dfs(0)
    return result
```

```cpp
#include <iostream>
#include <vector>
using namespace std;

class Solution {
    vector<vector<int>> result;
    vector<int> path;

    void dfs(vector<int>& nums, int idx) {
        // 到达终点：记录当前路径
        if (idx == nums.size()) {
            result.push_back(path);  // C++ 中 vector 赋值即拷贝！
            return;
        }

        // ① 选择：选当前元素
        path.push_back(nums[idx]);       // 做选择
        dfs(nums, idx + 1);              // 继续走
        path.pop_back();                 // 撤销选择（回溯）

        // ② 选择：不选当前元素
        dfs(nums, idx + 1);              // 什么都不加，直接走
    }

public:
    vector<vector<int>> subsets(vector<int>& nums) {
        dfs(nums, 0);
        return result;
    }
};
```

#### 递归树图解（nums = [1, 2, 3]）

下图展示了完整的递归过程，方括号内是当前 `path` 的内容。 星号标记的是"到达叶子节点"时记录到 `result` 中的路径。

```
                              dfs(0) path=[]
                            /              \
                    选1 ↓                     不选1 ↓
                   dfs(1) [1]                dfs(1) []
                 /          \              /          \
          选2 ↓          不选2 ↓     选2 ↓          不选2 ↓
        dfs(2) [1,2]    dfs(2) [1]   dfs(2) [2]    dfs(2) []
        /        \      /       \    /       \     /       \
   选3↓      不选3↓  选3↓   不选3↓ 选3↓   不选3↓ 选3↓    不选3↓
  [1,2,3]   [1,2]   [1,3]   [1]  [2,3]   [2]   [3]    []

```

> **重点理解**：回到上层前为什么要 `path.pop()`？因为你在下层做的选择（比如选了 1），不能影响你"不选 1"的那条路。这就像写作业用铅笔 — 写完一种方案，擦掉（pop），再试另一种方案。

#### 路径追踪详解

下面追踪"选1 → 不选2 → 选3"这条路径，观察 `path` 的变化：

| 步骤 | 操作 | path 的值 |
|------|------|-----------|
| 起点 | 开始 dfs(0) | `[]` |
| ① | 选1: path.append(1) | `[1]` |
| ② | 进入 dfs(1)，不选2 | `[1]` ← 不变 |
| ③ | 进入 dfs(2)，选3: path.append(3) | `[1, 3]` ←  记录到 result |
| ④ | 回溯: path.pop() | `[1]` ← 回到选完1的状态 |
| ⑤ | 进入 dfs(2)，不选3 | `[1]` ←  记录 [1] 到 result |
| ⑥ | 回溯: path.pop() | `[]` ← 回到起点状态 |

---

### 例题 3.2 │ 全排列（Permutations）

| 项目 | 内容 |
|------|------|
| **LeetCode 46** | 给定一个不含重复数字的数组 `nums`，返回其所有可能的全排列。 |
| **示例** | 输入 `nums = [1, 2, 3]`，输出 `[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]` |
| **与子集的区别** | 子集不要求顺序（`[1,2] = [2,1]`），排列要求顺序，且每个元素必须用一次。 |

#### 代码实现（Python / C++）

```python
def permute(nums):
    result = []
    path = []          # 当前排列路径
    used = [False] * len(nums)  # 标记哪些元素已经用过

    def dfs():
        # 基准条件：路径长度等于 nums 长度
        if len(path) == len(nums):
            result.append(path[:])  # 拷贝！
            return

        for i in range(len(nums)):
            if used[i]:            # 已经用过，跳过
                continue

            # 做选择
            path.append(nums[i])
            used[i] = True
            dfs()                  # 递归
            # 撤销选择（回溯）
            used[i] = False
            path.pop()

    dfs()
    return result
```

```cpp
#include <iostream>
#include <vector>
using namespace std;

class Solution {
    vector<vector<int>> result;
    vector<int> path;
    vector<bool> used;  // 标记哪些元素已经用过

    void dfs(vector<int>& nums) {
        // 基准条件：路径长度等于 nums 长度
        if (path.size() == nums.size()) {
            result.push_back(path);  // C++ 中 vector 赋值即拷贝！
            return;
        }

        for (int i = 0; i < nums.size(); i++) {
            if (used[i])            // 已经用过，跳过
                continue;

            // 做选择
            path.push_back(nums[i]);
            used[i] = true;
            dfs(nums);              // 递归
            // 撤销选择（回溯）
            used[i] = false;
            path.pop_back();
        }
    }

public:
    vector<vector<int>> permute(vector<int>& nums) {
        used.resize(nums.size(), false);
        dfs(nums);
        return result;
    }
};
```

#### 递归树图解（nums = [1, 2, 3]）

```
                           dfs() path=[]
                     /          |          \
             选1 ↓            选2 ↓            选3 ↓
           dfs() [1]        dfs() [2]        dfs() [3]
           /       \        /       \        /       \
      选2↓       选3↓    选1↓      选3↓    选1↓      选2↓
   [1,2]      [1,3]    [2,1]      [2,3]    [3,1]      [3,2]
      |          |        |          |        |          |
   选3↓       选2↓     选3↓       选1↓     选2↓       选1↓
  [1,2,3]  [1,3,2]  [2,1,3]  [2,3,1]  [3,1,2]  [3,2,1]
```

> **重点理解**：for 循环每次从 `nums` 中选一个还没用过的元素，然后进入下一层。`used` 数组保证了不会重复选同一个元素。

#### 路径 + used 变化追踪（"1→2→3" 这条路线）

| 步骤 | 操作 | path | used |
|------|------|------|------|
| ① | dfs() 入口，i=0 选1 | `[1]` | `[T, F, F]` |
| ② | dfs() 中，i=1 选2 | `[1,2]` | `[T, T, F]` |
| ③ | dfs() 中，i=2 选3 | `[1,2,3]` | `[T, T, T]` |
| ④ |  记录 [1,2,3] 到 result | | |
| ⑤ | 撤销：used[2]=F, pop() | `[1,2]` | `[T, T, F]` |
| ⑥ | 撤销：used[1]=F, pop() | `[1]` | `[T, F, F]` |
| ⑦ | 撤销：used[0]=F, pop() | `[]` | `[F, F, F]` |

---

### 例题 3.3 │ 组合（Combinations）

| 项目 | 内容 |
|------|------|
| **LeetCode 77** | 给定两个整数 `n` 和 `k`，返回范围 `[1, n]` 中所有可能的 `k` 个数的组合。 |
| **示例** | `n=4, k=2`，输出 `[[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]]` |
| **与排列的区别** | 组合中 `[1,2]` 和 `[2,1]` 是同一个，不需要考虑顺序。 |
| **核心技巧** | 使用 `startIndex` 参数，保证只向后选，避免重复。 |

#### 代码实现（Python / C++）

```python
def combine(n, k):
    result = []
    path = []          # 当前组合路径

    def dfs(start):    # start: 从哪个数开始选
        # 基准条件：找到 k 个数
        if len(path) == k:
            result.append(path[:])  # 拷贝！
            return

        for i in range(start, n + 1):
            path.append(i)        # 选择 i
            dfs(i + 1)            # 下一层从 i+1 开始
            path.pop()            # 撤销选择

    dfs(1)              # 从 1 开始选
    return result
```

```cpp
#include <iostream>
#include <vector>
using namespace std;

class Solution {
    vector<vector<int>> result;
    vector<int> path;  // 当前组合路径

    void dfs(int start, int n, int k) {
        // 基准条件：找到 k 个数
        if (path.size() == k) {
            result.push_back(path);  // C++ 中 vector 赋值即拷贝！
            return;
        }

        for (int i = start; i <= n; i++) {
            path.push_back(i);        // 选择 i
            dfs(i + 1, n, k);         // 下一层从 i+1 开始
            path.pop_back();          // 撤销选择
        }
    }

public:
    vector<vector<int>> combine(int n, int k) {
        dfs(1, n, k);  // 从 1 开始选
        return result;
    }
};
```

#### 递归树图解（n=4, k=2）

```
                      dfs(1) path=[]
              /         |          \
        i=1↓         i=2↓         i=3↓          (i=4 不用试，因为后面没了)
    dfs(2) [1]     dfs(3) [2]     dfs(4) [3]
   /    |    \      /     \         |
i=2↓  i=3↓  i=4↓  i=3↓   i=4↓      i=4↓
[1,2] [1,3] [1,4] [2,3] [2,4]  [3,4]
```

> **startIndex 的妙用**：递归调用 `dfs(i+1)` 保证了每个组合中的数字是递增的，这样 `[1,2]` 只会被生成一次，而不会出现 `[2,1]` 的重复。

#### 三个问题的对比

```
子集 (LC 78):  每个元素  选/不选       → 不用 for 循环, 也可以用 for
全排列 (LC 46): 每个元素必须用一次  → for + used[], 每层从 0 开始选
组合 (LC 77):  不考虑顺序          → for + startIndex, 只向后选
```

---

## 第四章  经典练习题

以下题目按难度排序，建议先自己思考，再看提示。每道题都附有递归分析的关键点。

### 4.1 │ 爬楼梯（Climbing Stairs）│ LeetCode 70 │ ★★

假设你正在爬楼梯，需要 `n` 阶才能到达楼顶。每次你可以爬 1 或 2 个台阶。有多少种不同的方法？

- **分析类型**：不带路径 — 只关心方法数
- **递归思路**：爬到第 n 阶 = 从 n-1 爬 1 步 + 从 n-2 爬 2 步。`f(n) = f(n-1) + f(n-2)`。
- **基准条件**：`f(1)=1`（只有1种方法），`f(2)=2`（1+1 或 2）。
- **本质**：这就是斐波那契数列！
- *提示：纯递归会超时，需要加记忆化或改用动态规划。*

---

### 4.2 │ 括号生成（Generate Parentheses）│ LeetCode 22 │ ★★★

数字 `n` 代表生成括号的对数，设计一个函数生成所有可能的且有效的括号组合。

例如 `n=3`：`["((()))","(()())","(())()","()(())","()()()"]`

- **分析类型**：带路径 — 需要记录括号字符串
- **递归思路**：每一步可加 `'('` 或 `')'`，但有约束条件
- **两条约束规则**：
  - ① 左括号数量 < n 时，可以加 `'('`
  - ② 右括号数量 < 左括号数量时，可以加 `')'`

#### 代码实现（Python / C++）

```python
def generateParenthesis(n):
    result, path = [], []
    def dfs(left, right):
        if len(path) == 2 * n:
            result.append(''.join(path))
            return
        if left < n:
            path.append('('); dfs(left+1, right); path.pop()
        if right < left:
            path.append(')'); dfs(left, right+1); path.pop()
    dfs(0, 0)
    return result
```

```cpp
#include <iostream>
#include <vector>
#include <string>
using namespace std;

class Solution {
    vector<string> result;
    string path;

    void dfs(int left, int right, int n) {
        if (path.size() == 2 * n) {
            result.push_back(path);
            return;
        }
        if (left < n) {
            path.push_back('('); dfs(left+1, right, n); path.pop_back();
        }
        if (right < left) {
            path.push_back(')'); dfs(left, right+1, n); path.pop_back();
        }
    }

public:
    vector<string> generateParenthesis(int n) {
        dfs(0, 0, n);
        return result;
    }
};
```

*提示：这题是"带约束的回溯"，path 记录括号字符串，约束用两个计数器维护。*

---

### 4.3 │ 组合总和（Combination Sum）│ LeetCode 39 │ ★★★

给你一个无重复元素的数组 `candidates` 和一个目标数 `target`，找出 `candidates` 中所有可以使数字和为 `target` 的组合。同一个数字可以被无限制重复选取。

例如 `candidates=[2,3,6,7], target=7`：`[[2,2,3],[7]]`

- **分析类型**：带路径 — 需要记录组合
- **递归思路**：类似组合 + 可重复选 → `dfs(i)` 而不是 `dfs(i+1)`
- **与 LC 77 组合的区别**：不跳过当前元素！`dfs(i)` 表示允许重复选择。基准条件变为"和为 target"。

#### 代码实现（Python / C++）

```python
def combinationSum(candidates, target):
    result, path = [], []
    def dfs(start, total):
        if total == target:
            result.append(path[:]); return
        if total > target:
            return  # 剪枝
        for i in range(start, len(candidates)):
            path.append(candidates[i])
            dfs(i, total + candidates[i])  # i 而不是 i+1
            path.pop()
    dfs(0, 0)
    return result
```

```cpp
#include <iostream>
#include <vector>
using namespace std;

class Solution {
    vector<vector<int>> result;
    vector<int> path;

    void dfs(int start, int total, vector<int>& candidates, int target) {
        if (total == target) {
            result.push_back(path);  // C++ 中 vector 赋值即拷贝！
            return;
        }
        if (total > target)
            return;  // 剪枝

        for (int i = start; i < candidates.size(); i++) {
            path.push_back(candidates[i]);
            dfs(i, total + candidates[i], candidates, target);  // i 而不是 i+1
            path.pop_back();
        }
    }

public:
    vector<vector<int>> combinationSum(vector<int>& candidates, int target) {
        dfs(0, 0, candidates, target);
        return result;
    }
};
```

*提示：total 参数同时承担了"路径信息"（当前和）和"剪枝条件"两个角色。*

---

### 4.4 │ N 皇后（N-Queens）│ LeetCode 51 │ ★★★★

将 `n` 个皇后放置在 $n \times n$ 的棋盘上，彼此不攻击（不同行、不同列、不同对角线）。返回所有解决方案。

- **分析类型**：带路径 — 需要记录棋盘配置
- **递归思路**：逐行放置皇后，每行尝试所有列，用集合记录已被占据的列和对角线。
- **对角线判断技巧**：
  - 正对角线（左上→右下）：`row - col` 相同
  - 反对角线（右上→左下）：`row + col` 相同

#### 代码实现（Python / C++）

```python
def solveNQueens(n):
    result, board = [], [['.']*n for _ in range(n)]
    cols = set()       # 被占据的列
    diag1 = set()      # 正对角线: row - col
    diag2 = set()      # 反对角线: row + col
    def dfs(row):
        if row == n:
            result.append([''.join(r) for r in board])
            return
        for col in range(n):
            if col in cols or (row-col) in diag1 or (row+col) in diag2:
                continue  # 冲突，跳过
            board[row][col] = 'Q'
            cols.add(col); diag1.add(row-col); diag2.add(row+col)
            dfs(row + 1)
            cols.remove(col); diag1.remove(row-col); diag2.remove(row+col)
            board[row][col] = '.'
    dfs(0)
    return result
```

```cpp
#include <iostream>
#include <vector>
#include <string>
#include <unordered_set>
using namespace std;

class Solution {
    vector<vector<string>> result;
    vector<string> board;
    unordered_set<int> cols, diag1, diag2;

    void dfs(int row, int n) {
        if (row == n) {
            result.push_back(board);
            return;
        }
        for (int col = 0; col < n; col++) {
            if (cols.count(col) || diag1.count(row-col) || diag2.count(row+col))
                continue;  // 冲突，跳过
            board[row][col] = 'Q';
            cols.insert(col); diag1.insert(row-col); diag2.insert(row+col);
            dfs(row + 1, n);
            cols.erase(col); diag1.erase(row-col); diag2.erase(row+col);
            board[row][col] = '.';
        }
    }

public:
    vector<vector<string>> solveNQueens(int n) {
        board.assign(n, string(n, '.'));
        dfs(0, n);
        return result;
    }
};
```

*提示：这是回溯的经典难题。关键是理解约束条件的表示方式（用 Set 做 O(1) 冲突检查）。*

---

## 附录  递归学习总结

### 一、不带路径 vs 带路径 对比表

| 对比维度 | 不带路径 | 带路径 |
|----------|----------|--------|
| **目标** | 计算一个值 | 找到所有可能的方案 |
| **方向** | 自底向上（从结果往回推） | 自顶向下（逐步构建方案） |
| **关键参数** | 递推参数（n, idx 等） | 递推参数 + path（记录路径） |
| **返回值** | 单个值（数字、布尔等） | void（把结果放入全局 list） |
| **典型操作** | `return f(子问题)` | `path.append → dfs → path.pop` |
| **经典题目** | 阶乘、斐波那契、数组求和 | 子集、排列、组合、N皇后 |

### 二、递归解题四步法

| 步骤 | 内容 |
|------|------|
| **第一步** │ 找基准条件 | 什么情况下不需要再递归了？最小的子问题是什么？ |
| **第二步** │ 找递归关系 | 大问题和子问题之间是什么关系？<br>不带路径：`f(n) = ? × f(n-1)` 之类的数学关系<br>带路径：每一步可以做哪些选择？每个选择后问题如何缩小？ |
| **第三步** │ 设计参数 | 不带路径：递推的变量（如 n, idx）<br>带路径：递推变量 + 路径参数（如 path, used, start） |
| **第四步** │ 画出递归树 | 用纸笔画出小规模输入的递归过程，验证逻辑正确性。**这是最重要的一步！** |

### 三、常见回溯模板速查

```python
# 模板 1: 选/不选模型（子集）
def dfs(idx):
    if idx == n: res.append(path[:]); return
    path.append(arr[idx]); dfs(idx+1); path.pop()
    dfs(idx+1)

# 模板 2: for循环模型（排列/组合）
def dfs(start):
    if 满足条件: res.append(path[:]); return
    for i in range(start, n):
        if 不合法: continue  # 剪枝
        path.append(arr[i]); dfs(下一层); path.pop()  # 回溯

# 模板 3: 多约束模型（N皇后）
def dfs(row):
    if row == n: res.append(copy); return
    for col in range(n):
        if col in cols or diag1 in s1 or diag2 in s2: continue
        做选择; dfs(row+1); 撤销选择  # 回溯
```

```cpp
// 模板 1: 选/不选模型（子集）
void dfs(int idx, vector<int>& arr) {
    if (idx == n) { res.push_back(path); return; }
    path.push_back(arr[idx]); dfs(idx+1, arr); path.pop_back();
    dfs(idx+1, arr);
}

// 模板 2: for循环模型（排列/组合）
void dfs(int start, vector<int>& arr) {
    if (满足条件) { res.push_back(path); return; }
    for (int i = start; i < n; i++) {
        if (不合法) continue;  // 剪枝
        path.push_back(arr[i]); dfs(下一层, arr); path.pop_back();  // 回溯
    }
}

// 模板 3: 多约束模型（N皇后）
void dfs(int row, int n) {
    if (row == n) { res.push_back(board); return; }
    for (int col = 0; col < n; col++) {
        if (cols.count(col) || diag1.count(row-col) || diag2.count(row+col)) continue;
        做选择; dfs(row+1, n); 撤销选择;  // 回溯
    }
}
```

---

> **最后叮嘱**：递归不是魔法，只是函数调用自己的编程技巧。搞懂"递"和"归"两个阶段，理解调用栈的工作方式，画出递归树，你就能掌握它！

**祝学习顺利。**
