---
title: "Python 刷 Hot100 速拾手册"
description: "语法学过但手生时的最小工作集：刷题五件套（defaultdict/Counter/deque/heapq/bisect）、高频模板默写、三个专项，以及 Python 特有的避坑清单。"
pubDate: 2026-10-14
updatedDate: 2026-10-26
tags:
  - "算法"
  - "学习笔记"
  - "Python"
category: knowledge
cover: /covers/post-code-python.svg
featured: true
---

这份手册给“学过 Python 基础但手生”的人用，目标是把刷题需要的那部分 Python 捡回来。没写过 Python 的，先看第 0 节；写过但很久没用的，直接从第 1 节开始。Python 的代码量少，但常数慢，所以要知道哪些写法既短又不拖性能。

---

## 0. 完全没写过 Python

先看这段代码。能读懂就可以进第 1 节；读不懂，先补 Python 的变量、`list`、`dict`、循环、函数和 `class`。

```python
def two_sum(nums, target):
    seen = {}
    for i, x in enumerate(nums):
        if target - x in seen:
            return [seen[target - x], i]
        seen[x] = i
    return []

class Solution:
    def twoSum(self, nums, target):
        return two_sum(nums, target)
```

刷题只需要这些：

| 需求 | 写法 |
| --- | --- |
| 变量 | `x = 0`、`ok = False`、`s = "abc"` |
| 列表 | `a = [1, 2, 3]`、`a.append(x)`、`a[i]` |
| 字典 | `d = {}`、`d[x] = 1`、`d.get(x, 0)` |
| 集合 | `s = set()`、`s.add(x)`、`x in s` |
| 循环 | `for x in a:`、`for i, x in enumerate(a):`、`while cond:` |
| 函数 | `def f(x): return x + 1` |
| 类 | `class Solution:`，方法第一个参数写 `self` |
| 推导式 | `[x*x for x in a]`、`{x: 1 for x in a}` |
| 排序 | `a.sort()`、`sorted(a, key=lambda x: x[0])` |

几个容易卡住的点：

- Python 靠缩进划分代码块，不用花括号。
- `a.sort()` 原地排序并返回 `None`；要新列表用 `sorted(a)`。
- `[[0] * n] * m` 的每一行是同一个列表，必须写 `[[0] * n for _ in range(m)]`。
- `dict[key]` 读取不存在的 key 会报 `KeyError`，不确定就用 `get` 或 `defaultdict`。
- Python 整数没有固定位宽，不会溢出；但浮点数有精度问题。
- 递归深度默认约 1000，深递归要改用迭代或调 `sys.setrecursionlimit`。

## 1. 最小必要语法

### 1.1 提交形态

```python
class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        ...
```

类型标注（`List[int]`）需要 `from typing import List`，LeetCode 已自动导入，本地调试自己加。Python 3.9+ 可直接写 `list[int]`。

### 1.2 高频惯例写法

```python
n = len(nums)
m, n = len(grid), len(grid[0])          # 矩阵行、列

ans: list[int] = []
cnt = defaultdict(int)                   # 计数首选
seen = set()

for x in nums: ...
for i, x in enumerate(nums): ...         # 要下标就 enumerate，别写 range(len(...))
for k, v in mp.items(): ...              # 遍历字典
```

**`enumerate` 优先于 `range(len())`**——更短、更不易错，这是 Pythonic 的第一课。

切片是刷题天天用的：

```python
nums[::-1]        # 反转
nums[1:3]         # [1, 3) 左闭右开
nums[:k] nums[k:] # 切两半（轮转数组题）
s[1:-1]           # 去掉首尾
```

注意：**切片产生新列表，O(k) 时间与空间**。大数组上反复切片是 TLE 的常见原因——能传下标就别切片。

### 1.3 推导式：一行顶三行

```python
squares = [x * x for x in nums]
evens = [x for x in nums if x % 2 == 0]
dp = [[0] * n for _ in range(m)]         # 二维初始化标准写法
flat = [x for row in grid for x in row]  # 拍平
```

二维数组**必须**这样写。`[[0] * n] * m` 是经典大坑：所有行指向同一个列表，改一格改一列。

### 1.4 sort 与 lambda

```python
nums.sort()                               # 原地升序，返回 None！
nums.sort(reverse=True)                   # 降序
intervals.sort(key=lambda x: x[0])        # 按第一个元素
arr.sort(key=lambda x: (-x[1], x[0]))     # 多关键字：第二降序、第一升序

sorted(nums)                              # 返回新列表，原列表不动
```

- 降序数值用负号 `key=lambda x: -x`；字符串不能取负，用 `reverse=True` 或 `cmp_to_key`。
- 复杂比较：`from functools import cmp_to_key`，`sort(key=cmp_to_key(cmp))`，cmp 返回负数/0/正数。

### 1.5 位运算与整数

```python
n & 1          # 奇偶
n >> 1         # 除以 2
n & (n - 1)    # 消去最低位 1
n & (-n)       # lowbit
1 << i
bin(n).count('1')   # 1 的个数；3.10+ 可用 n.bit_count()
```

**Python 整数没有溢出**（任意精度），这是刷题时相比 C++ 的福利。但注意：**Python 的负数取整是向下取整**——`-3 // 2 == -2`，和 C++ 的向零取整不同。需要向零取整写 `int(a / b)`。

### 1.6 常用内置函数

```python
min(nums) max(nums) sum(nums) any(x > 0 for x in nums) all(...)
divmod(a, b)          # (商, 余数) 一次拿到
zip(a, b)             # 并行遍历；zip(*matrix) 转置矩阵
ord('a') chr(97)      # 字符 ↔ ASCII
```

---

## 2. 数据结构速查

### 2.1 list（兼任数组与栈）

```python
v = [1, 2, 3]
v.append(4); v.pop()          # 栈：append/push，pop 弹出栈顶
v[-1]                         # 栈顶
v.insert(0, x)                # O(n)，别在循环里用
```

当栈用：`append` + `pop()` + `v[-1]`，全部是 O(1)。**当队列用是错的**——`pop(0)` 是 O(n)，队列必须用 deque。

### 2.2 dict / set 与 defaultdict / Counter

```python
d = {}
d[key] = d.get(key, 0) + 1    # 朴素计数
key in d                      # 存在性检查

from collections import defaultdict, Counter
cnt = defaultdict(int)        # 不存在的 key 自动为 0，cnt[x] += 1 直接写
c = Counter(nums)             # 一行计数
c.most_common(k)              # 前 K 高频——「前 K 个高频元素」直接拿走
s = "abcabc"; Counter(s)
```

Counter 本质是 dict，支持 `c1 + c2`、`c1 & c2`（交集，取较小计数）等运算，字母异位词类题目特别好用。

注意：普通 dict 用 `d[key]` 访问不存在的 key 会 `KeyError`；要么 `d.get(key, default)`，要么换 defaultdict。

### 2.3 deque（双端队列）

```python
from collections import deque
q = deque()
q.append(x)      # 右进
q.appendleft(x)  # 左进
q.pop()          # 右出
q.popleft()      # 左出（BFS 出队用这个）
q[0] q[-1]       # 看两端
```

BFS 标配：`q.popleft()`。单调队列标配：两端操作都有。**deque 的随机访问 `q[i]` 是 O(n)**，只在两端玩。

### 2.4 heapq（堆，只有小根堆）

```python
import heapq
h = []
heapq.heappush(h, x)
heapq.heappop(h)              # 弹出最小
h[0]                          # 堆顶（最小值）
heapq.heapify(nums)           # 原地 O(n) 建堆
heapq.nlargest(k, nums)       # 前 K 大（k 小时比全排序快）
heapq.nsmallest(k, nums)
```

**只有小根堆**。要大根堆有两个办法：

```python
h = [-x for x in nums]; heapq.heapify(h)     # 存负数取反（最常用）
heapq.heappush(h, (-priority, item))         # 元组形式：比较第一元素，第二元素是数据
```

元组比较是字典序：`(priority, item)` 先比 priority。注意 item 类型不可比时（如 ListNode），priority 相同会接着比 item 然后报错——塞个唯一序号破局：`(-priority, i, item)`。

「数据流中位数」用两个堆：大根堆（存负数）放左半，小根堆放右半，保持数量差 ≤ 1。

### 2.5 字符串

```python
s = "abc"
s[i] s[1:3] s[::-1]
s.split() s.split(',') ', '.join(list)    # join 是字符串的方法，参数是列表
s.startswith(p) s.endswith(p)
s.isdigit() s.isalpha() s.lower() s.upper()
```

**字符串不可变**：`s += c` 在循环里是 O(n²)（每次新建字符串）。拼字符串用列表收集，最后 `''.join(parts)`——这是 Python 刷题最值得记住的性能习惯。

### 2.6 常用数学

```python
import math
math.gcd(a, b) math.inf -math.inf
float('inf') float('-inf')     # DP 初始化最值常用
```

DP 求最小值初始化 `dp = [inf] * (n + 1)`，求最大值用 `-inf` 或 0。

---

## 3. Hot100 高频模板

> 每个模板都对应一类题，建议达到默写程度。

### 3.1 哈希补数（两数之和）

```python
seen = {}
for i, x in enumerate(nums):
    if target - x in seen:
        return [seen[target - x], i]
    seen[x] = i
```

### 3.2 滑动窗口

```python
left = 0
for right, x in enumerate(nums):
    # 加入 nums[right]，更新窗口状态
    while 不合法:
        # 移除 nums[left]
        left += 1
    # 此处窗口合法，更新答案
```

和 C++ 一模一样的骨架。窗口状态用 `defaultdict(int)` 或 `Counter` 维护（注意 Counter 减到 0 要 `del`，否则 `len(cnt)` 统计种类会错——用 defaultdict 更省心）。

### 3.3 二分：直接用 bisect

```python
from bisect import bisect_left, bisect_right
i = bisect_left(nums, x)     # 第一个 >= x 的下标
j = bisect_right(nums, x)    # 第一个 > x 的下标
# x 的个数 = bisect_right - bisect_left
```

手写二分也简单，但 bisect 不会写错边界——能用就用。手写版：

```python
lo, hi = 0, len(nums) - 1
while lo <= hi:
    mid = (lo + hi) // 2     # Python 不溢出，直接写
    if nums[mid] == target: return mid
    elif nums[mid] < target: lo = mid + 1
    else: hi = mid - 1
```

### 3.4 前缀和

```python
pre = [0] * (n + 1)
for i, x in enumerate(nums):
    pre[i + 1] = pre[i] + x
# 区间和 [l, r] = pre[r + 1] - pre[l]
```

「和为 K 的子数组」：边遍历边维护 `pre_sum`，查 `pre_sum - k` 在哈希表里的出现次数：

```python
cnt = defaultdict(int); cnt[0] = 1     # 前缀和 0 先放一份（空前缀）
pre = ans = 0
for x in nums:
    pre += x
    ans += cnt[pre - k]
    cnt[pre] += 1
```

### 3.5 回溯

```python
def dfs(start: int, path: list[int]):
    if 到达叶子:
        ans.append(path.copy())        # 必须拷贝！path 会被后续修改
        return
    for i in range(start, n):
        path.append(nums[i])           # 做选择
        dfs(i + 1, path)
        path.pop()                     # 撤销选择
```

**最大的坑：`ans.append(path)` 存的是引用**，后面 path 一改，ans 里所有答案跟着变。用 `path.copy()` 或 `path[:]`。

### 3.6 网格 DFS

```python
def dfs(i: int, j: int):
    if not (0 <= i < m and 0 <= j < n) or grid[i][j] != '1':
        return
    grid[i][j] = '0'                   # 原地标记
    for di, dj in ((1,0), (-1,0), (0,1), (0,-1)):
        dfs(i + di, j + dj)
```

**Python 特有坑：递归深度。** 默认上限约 1000，网格大（如 300×300 全是陆地）直接爆栈：

```python
import sys
sys.setrecursionlimit(10**5)
```

LeetCode 上有效。更深的递归改用显式栈的迭代写法。

### 3.7 BFS

```python
from collections import deque
q = deque([(si, sj)])
while q:
    for _ in range(len(q)):            # 先定层大小 → 逐层处理
        x, y = q.popleft()
        for dx, dy in ((1,0), (-1,0), (0,1), (0,-1)):
            nx, ny = x + dx, y + dy
            # 边界 & 访问检查 → 标记 → q.append((nx, ny))
    # 一层结束
```

`for _ in range(len(q))` 就是 C++ 里 `sz = q.size()` 的写法，层序遍历、最短路径层数都靠它。

### 3.8 链表

```python
# dummy：把头节点变普通节点
dummy = ListNode(0)
cur = dummy
# ...
return dummy.next

# 反转：pre / cur / nxt 三指针
pre = None
while cur:
    nxt = cur.next
    cur.next = pre
    pre = cur
    cur = nxt
return pre
```

快慢指针找中点/判环：`fast = fast.next.next`，`slow = slow.next`。

### 3.9 二叉树

```python
def maxDepth(root):
    if not root:
        return 0
    return 1 + max(maxDepth(root.left), maxDepth(root.right))
```

层序遍历用 3.7 的逐层模式。BST 中序 = 升序。

### 3.10 Trie

```python
class TrieNode:
    def __init__(self):
        self.children = {}             # dict: char -> TrieNode，比定长数组灵活
        self.is_end = False
```

插入/查询沿 `node.children.setdefault(c, TrieNode())` 或 `node.children.get(c)` 下钻。26 叉定长用 `[None] * 26` 也行，dict 写法更通用（处理任意字符集）。

### 3.11 lru_cache：记忆化搜索一行搞定

```python
from functools import lru_cache

@lru_cache(maxsize=None)
def dfs(i: int, j: int) -> int:
    ...
```

很多"DP 题"可以先用递归 + lru_cache 写出记忆化搜索版本，想清楚状态后再改递推。**注意：被装饰的参数必须可哈希**（list 不行，传 tuple 或下标）。

### 3.12 DP 初始化

```python
dp = [0] * (n + 1)
dp = [inf] * (n + 1)                          # 求最小
dp = [[0] * n for _ in range(m)]
dp = [[inf] * n for _ in range(m)]
```

顺序：状态含义 → 转移方程 → 初始化 → 遍历顺序。

---

## 4. 单调栈

### 4.1 什么时候想到它

> 「每个元素 左边/右边 第一个 比它大/小」。

### 4.2 方向表（与 C++ 版完全一致）

| 求什么 | 遍历方向 | 栈（底→顶） | 弹栈时机 |
|---|---|---|---|
| 右边第一个更大 | 左→右 | 递减 | 当前 > 栈顶 |
| 右边第一个更小 | 左→右 | 递增 | 当前 < 栈顶 |
| 左边第一个更大 | 右→左 | 递减 | 当前 > 栈顶 |
| 左边第一个更小 | 右→左 | 递增 | 当前 < 栈顶 |

口诀：**当前元素能解决谁，就弹谁。**

### 4.3 模板：每日温度

```python
def dailyTemperatures(t: list[int]) -> list[int]:
    ans = [0] * len(t)
    st = []                              # list 当栈，存下标，值递减
    for i, x in enumerate(t):
        while st and x > t[st[-1]]:
            idx = st.pop()
            ans[idx] = i - idx
        st.append(i)
    return ans
```

list 当栈：`append` / `pop()` / `st[-1]`，不需要 import 任何东西。

### 4.4 柱状图最大矩形

```python
def largestRectangleArea(heights: list[int]) -> int:
    heights.append(0)                    # 哨兵
    st = []                              # 递增栈，存下标
    ans = 0
    for i, h in enumerate(heights):
        while st and h < heights[st[-1]]:
            height = heights[st.pop()]
            left = st[-1] if st else -1  # 左边界（开区间）
            ans = max(ans, height * (i - left - 1))
        st.append(i)
    return ans
```

### 4.5 易错点

1. 存下标不存值。
2. `while st and ...`——Python 里空列表是 falsy，`if st` / `while st` 是最顺手的判空写法。
3. 哨兵 `append(0)` 简化最后弹栈（注意这会改原列表，介意就先 `heights = heights + [0]`）。
4. 复杂度 O(n)：每个元素进出各一次。

---

## 5. 单调队列

### 5.1 什么时候想到它

> 滑动窗口最大值/最小值。新元素更大且更晚过期，队尾永久淘汰——一句话直觉。

### 5.2 模板：滑动窗口最大值

```python
from collections import deque

def maxSlidingWindow(nums: list[int], k: int) -> list[int]:
    dq = deque()                         # 存下标，值从队首到队尾递减
    ans = []
    for i, x in enumerate(nums):
        while dq and dq[0] <= i - k:     # 1. 队首过期
            dq.popleft()
        while dq and nums[dq[-1]] <= x:  # 2. 队尾淘汰
            dq.pop()
        dq.append(i)                     # 3. 入队
        if i >= k - 1:                   # 4. 窗口形成，记录答案
            ans.append(nums[dq[0]])
    return ans
```

四步顺序：**过期 → 弹尾 → 入队 → 记录**。求最小值把第 2 步 `<=` 换成 `>=`。

### 5.3 单调队列 vs heapq

| | 单调队列 | heapq |
|---|---|---|
| 复杂度 | O(n) | O(n log n) |
| 适用 | 固定窗口最值 | 动态第 K 大、数据流中位数 |
| 过期删除 | 精确弹队首 | 懒删除（堆顶过期才 pop） |

「前 K 个高频元素」Python 有更短的写法：`Counter(nums).most_common(k)`——知道单调队列/堆的原理，但能用库就用库。

### 5.4 易错点

1. 四步顺序别乱。
2. `dq[0]` 取队首查看、`dq[-1]` 队尾——deque 两端 `[]` 是 O(1)，中间下标是 O(n)，单调队列只碰两端。
3. 存下标不存值（过期判断要用下标）。

---

## 6. 并查集（DSU）

### 6.1 什么时候想到它

> 动态连通性：只加边、查连通、数集合个数。`union` 返回 False（已连通）可判环/冗余边。

### 6.2 模板（路径压缩 + 按大小合并）

```python
class DSU:
    def __init__(self, n: int):
        self.parent = list(range(n))
        self.sz = [1] * n

    def find(self, x: int) -> int:
        # 迭代版路径压缩，避免递归深度问题
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]   # 路径减半
            x = self.parent[x]
        return x

    def union(self, a: int, b: int) -> bool:
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return False
        if self.sz[ra] < self.sz[rb]:
            ra, rb = rb, ra
        self.parent[rb] = ra
        self.sz[ra] += self.sz[rb]
        return True
```

Python 版特意写成**迭代 find**——递归版要担心 recursion limit，迭代版没这个烦恼，而且"路径减半"效果和路径压缩一样是近似 O(1)。

### 6.3 例题：岛屿数量

```python
def numIslands(grid: list[list[str]]) -> int:
    m, n = len(grid), len(grid[0])
    dsu = DSU(m * n)
    cnt = 0
    for i in range(m):
        for j in range(n):
            if grid[i][j] != '1':
                continue
            cnt += 1                              # 先自成一岛
            id = i * n + j                        # 二维→一维，n 是列数
            if i > 0 and grid[i-1][j] == '1' and dsu.union(id, id - n):
                cnt -= 1
            if j > 0 and grid[i][j-1] == '1' and dsu.union(id, id - 1):
                cnt -= 1
    return cnt
```

技巧：发现陆地 +1，成功合并 −1；只查上、左两个邻居防重复。本题用 DFS 淹没岛屿（3.6）代码更短；并查集版是为判环类题目热身。

### 6.4 例题：冗余连接

```python
def findRedundantConnection(edges: list[list[int]]) -> list[int]:
    dsu = DSU(len(edges) + 1)
    for u, v in edges:
        if not dsu.union(u, v):
            return [u, v]
```

### 6.5 一个 Python 特有的替代思路

集合合并类问题有时可以用「哈希表 + 遍历」绕过并查集。比如最长连续序列：

```python
def longestConsecutive(nums: list[int]) -> int:
    s = set(nums)
    best = 0
    for x in s:
        if x - 1 not in s:                 # 只从"序列起点"开始数
            y = x
            while y in s:
                y += 1
            best = max(best, y - x)
    return best
```

`x - 1 not in s` 保证每个序列只数一次，整体 O(n)。**并查集是通用工具，但 Python 的 set 表达力经常给出更短的特解**——两个都要会。

### 6.6 易错点

1. `union` 前必须各自 `find`。
2. 二维转一维 `id = i * n + j`，n 是列数。
3. `sz` 只有根节点的值有效。
4. 并查集不支持删边。
5. 递归版 find 在大数据下可能爆递归，用迭代版（上面的模板）或调大 `sys.setrecursionlimit`。

---

## 7. Hot100 分类 × 工具对照

| 分类 | Python 顺手工具 | 核心模板 |
|---|---|---|
| 哈希 | dict / defaultdict / Counter | 计数、补数、前缀和+哈希 |
| 双指针 | 下标 | 对撞、快慢 |
| 滑动窗口 | defaultdict 记窗口 | 3.2 骨架 |
| 子串 / 子数组 | 前缀和、deque | 3.4 / 单调队列 |
| 数组 / 矩阵 | sort(key=...)、切片 | 合并区间、原地置零 |
| 链表 | 对象引用、dummy | 反转三指针、快慢 |
| 二叉树 | 递归、deque | DFS 返回值、逐层 BFS |
| 图 | dict 邻接表、deque、DSU | BFS/DFS、拓扑 |
| 回溯 | path 列表 + copy | 3.5 模板 |
| 栈 | list | 括号、单调栈 |
| 堆 | heapq（小根堆，负数取反） | 第 K 大、中位数 |
| 贪心 | sort + key | 区间、跳跃 |
| 动态规划 | 列表初始化 / lru_cache | 背包、LIS、编辑距离 |
| 位运算 | 位操作、bit_count | 只出现一次、比特计数 |

---

## 8. 推荐刷题顺序

按分类刷，不按题号刷：

1. **哈希**：两数之和 → 字母异位词分组（`sorted(s)` 或 Counter 当 key）→ 最长连续序列
2. **双指针**：移动零 → 盛最多水的容器 → 三数之和
3. **滑动窗口**：无重复字符最长子串 → 找到所有字母异位词
4. **子串**：和为 K 的子数组 → 滑动窗口最大值（衔接单调队列）
5. **数组/矩阵**：最大子数组和 → 合并区间 → 轮转数组（切片一行：`nums[:] = nums[-k:] + nums[:-k]`）
6. **链表**：反转 → 环形 → 合并有序链表 → LRU（压轴）
7. **二叉树**：最大深度 → 层序遍历 → 最近公共祖先
8. **图/回溯**：岛屿数量 → 课程表 → 全排列 → 子集
9. **栈/堆**：有效括号 → 每日温度 → 前 K 个高频元素
10. **贪心/DP**：买卖股票 → 跳跃游戏 → 爬楼梯 → 零钱兑换
11. **位运算/技巧**：只出现一次的数字（`functools.reduce(xor, nums)`）→ 多数元素

专项突破：每日温度 → 柱状图最大矩形 → 滑动窗口最大值 → 岛屿数量 → 冗余连接。

---

## 9. 避坑清单（Python 特有版，按出错频率排序）

1. **`ans.append(path)` 没加 `.copy()`** → 回溯答案全是同一个列表，全错。
2. **`[[0] * n] * m`** → 所有行是同一个列表对象，改一格改一列。用推导式。
3. **循环里 `s += c` 拼字符串** → O(n²)。用列表收集 + `''.join`。
4. **`list.pop(0)` 当队列用** → O(n)。BFS 必须 `deque` + `popleft()`。
5. **递归爆栈** → `sys.setrecursionlimit(10**5)`，或改迭代。
6. **`sort()` 返回 None** → `nums = nums.sort()` 把 nums 变成 None。要么 `nums.sort()` 要么 `nums = sorted(nums)`。
7. **负数向下取整**：`-3 // 2 == -2`，要向零取整用 `int(a / b)`。
8. **heapq 只有小根堆**；元组堆里 priority 相同时会接着比 item，ListNode 之类不可比会炸——加唯一序号。
9. **Counter 减计数到 0 不自动删 key**，`len(counter)` 统计种类会偏大；用 defaultdict 或手动 `del`。
10. **大数组切片传参**（`dfs(nums[1:])`）每层拷贝 O(n)，传下标。
11. `dict[key]` 访问不存在的 key 抛 KeyError，查询用 `in` / `.get()` / defaultdict。
12. 可变对象当默认参数（`def f(x=[])`）是共享的——刷题签名别加默认值。

---

## 10. 学习节奏建议

- **第 1~2 天**：第 1、2 章过一遍，重点确认 defaultdict / Counter / deque / heapq / bisect 这几个"刷题五件套"的 API 手感。
- **第 1 周**：按第 8 章刷前 6 类。每道题做完写一句话：这题的本质模板是什么、用了哪个库函数省了多少行。
- **第 2 周**：树、图、回溯 + 三个专项。单调栈 / 单调队列 / 并查集模板默写到不思考。
- **第 3 周起**：贪心、DP 收尾，二刷错题（标准：不看题解独立 AC）。
- Python 选手的加分动作：AC 后看一眼官方/高票题解的 Python 写法——经常能学到「原来这个库函数一行就能做」，这比刷更多题更能提升代码质量。

---

## 附：C++ / Python 刷题工具对照速查

| 用途 | C++ | Python |
|---|---|---|
| 动态数组 | `vector` | `list` |
| 栈 | `stack` | `list`（append/pop） |
| 队列 / 双端队列 | `queue` / `deque` | `collections.deque` |
| 哈希表 | `unordered_map` | `dict` / `defaultdict` |
| 哈希集合 | `unordered_set` | `set` |
| 计数 | `unordered_map<int,int>` | `Counter` |
| 堆 | `priority_queue`（默认大根） | `heapq`（只有小根，负数取反） |
| 二分 | `lower_bound` | `bisect_left` |
| 排序自定义 | lambda 比较器 | `key=lambda` / `cmp_to_key` |
| 前缀填数 | `iota` | `list(range(n))` |
| 记忆化 | 手写 memo 数组 | `@lru_cache` |
| 溢出 | 小心，用 long long | 不存在（任意精度） |
| 递归深度 | 基本不用担心 | `setrecursionlimit` |
