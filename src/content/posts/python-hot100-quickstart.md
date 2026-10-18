---
title: "Python 刷 Hot100 速拾手册"
description: "语法学过但手生时的最小工作集：刷题五件套（defaultdict/Counter/deque/heapq/bisect）、高频模板默写、三个专项，以及 Python 特有的避坑清单。"
pubDate: 2026-10-14
tags:
  - "算法"
  - "学习笔记"
  - "Python"
category: knowledge
cover: /covers/post-code-python.svg
featured: true
---

> 定位：不重新系统学 Python，只找回刷 Hot100 所需的最小必要集。
> 原则：Python 刷题的优势是表达力——同样逻辑代码量是 C++ 的一半。代价是常数慢，所以更要知道哪些写法「Pythonic 且快」。

## 1. 最小必要语法

### 高频惯例

```python
n = len(nums)
m, n = len(grid), len(grid[0])

for x in nums: ...
for i, x in enumerate(nums): ...      # 要下标用 enumerate，别写 range(len(...))
for k, v in mp.items(): ...

nums[::-1]; nums[1:3]; nums[:k] + nums[k:]   # 切片（产生新列表，O(k)）
```

注意：大数组上反复切片是 TLE 常见原因，能传下标就别切片。

### 推导式与二维初始化

```python
dp = [[0] * n for _ in range(m)]      # 标准写法
# [[0] * n] * m 是大坑：所有行指向同一个列表，改一格改一列
```

### sort 与 lambda

```python
nums.sort()                            # 原地，返回 None！
intervals.sort(key=lambda x: x[0])
arr.sort(key=lambda x: (-x[1], x[0]))  # 多关键字：数值取负调升降
# 复杂比较：from functools import cmp_to_key
```

### 整数特性

```python
n & 1; n >> 1; n & (n - 1); n & (-n); 1 << i
n.bit_count()                          # 3.10+，或 bin(n).count('1')
```

Python 整数无溢出（任意精度）。但**负数向下取整**：`-3 // 2 == -2`，要向零取整写 `int(a / b)`。

## 2. 刷题五件套 + 基础容器

### list 当栈，deque 当队列

```python
st.append(x); st.pop(); st[-1]         # list 当栈，全 O(1)
# list.pop(0) 是 O(n)，队列必须用 deque

from collections import deque
q.append(x); q.popleft(); q[0]; q[-1]  # BFS 标配；deque 只碰两端，中间下标 O(n)
```

### dict / defaultdict / Counter

```python
from collections import defaultdict, Counter
cnt = defaultdict(int)                 # 不存在自动为 0，cnt[x] += 1 直接写
c = Counter(nums); c.most_common(k)    # 一行计数 + 前 K 高频
key in d; d.get(key, 0)                # 存在性检查；d[key] 不存在会 KeyError
```

Counter 支持 `c1 + c2`、`c1 & c2`（交集），字母异位词类题特别好用。注意 Counter 减到 0 不自动删 key，统计种类时用 defaultdict 更省心。

### heapq（只有小根堆）

```python
import heapq
heapq.heappush(h, x); heapq.heappop(h); h[0]
heapq.heapify(nums); heapq.nlargest(k, nums)
h = [-x for x in nums]                 # 大根堆：存负数取反
heapq.heappush(h, (-priority, i, item))  # 元组堆：加唯一序号防 item 不可比
```

数据流中位数：大根堆（存负数）放左半，小根堆放右半，数量差 ≤ 1。

### bisect（手写二分的替代）

```python
from bisect import bisect_left, bisect_right
i = bisect_left(nums, x)     # 第一个 >= x
# x 的个数 = bisect_right(nums, x) - bisect_left(nums, x)
```

### 字符串

```python
s.split(','); ''.join(parts); s[::-1]; s.isdigit(); ord('a'); chr(97)
```

**循环里 `s += c` 是 O(n²)**（字符串不可变，每次新建）。用列表收集最后 `''.join`——Python 刷题最值得记住的性能习惯。

## 3. 高频模板（建议默写）

### 哈希补数

```python
seen = {}
for i, x in enumerate(nums):
    if target - x in seen:
        return [seen[target - x], i]
    seen[x] = i
```

### 滑动窗口

```python
left = 0
for right, x in enumerate(nums):
    # 加入 nums[right]，更新窗口状态
    while 不合法:
        # 移除 nums[left]
        left += 1
    # 此处窗口合法，更新答案
```

### 前缀和 + 哈希（和为 K 的子数组）

```python
cnt = defaultdict(int); cnt[0] = 1     # 空前缀先放一份
pre = ans = 0
for x in nums:
    pre += x
    ans += cnt[pre - k]
    cnt[pre] += 1
```

### 回溯

```python
def dfs(start: int, path: list[int]):
    if 到达叶子:
        ans.append(path.copy())        # 必须拷贝！path 是引用
        return
    for i in range(start, n):
        path.append(nums[i])
        dfs(i + 1, path)
        path.pop()
```

最大坑：`ans.append(path)` 不加 `.copy()`，后面 path 一改，ans 全跟着变。

### 网格 DFS（注意递归深度）

```python
import sys
sys.setrecursionlimit(10**5)           # 大网格必需，默认上限约 1000

def dfs(i: int, j: int):
    if not (0 <= i < m and 0 <= j < n) or grid[i][j] != '1':
        return
    grid[i][j] = '0'
    for di, dj in ((1,0), (-1,0), (0,1), (0,-1)):
        dfs(i + di, j + dj)
```

### BFS 逐层

```python
q = deque([(si, sj)])
while q:
    for _ in range(len(q)):            # 先定层大小
        x, y = q.popleft()
        # 四方向扩展
    # 一层结束
```

### 链表

```python
dummy = ListNode(0); cur = dummy
# ... return dummy.next

pre = None
while cur:
    nxt = cur.next; cur.next = pre; pre = cur; cur = nxt
# return pre
```

### lru_cache：记忆化搜索一行搞定

```python
from functools import lru_cache

@lru_cache(maxsize=None)
def dfs(i: int, j: int) -> int: ...    # 参数必须可哈希（list 不行，传 tuple/下标）
```

## 4. 单调栈

**什么时候用**：求「每个元素 左边/右边 第一个 比它大/小」。口诀：当前元素能解决谁，就弹谁。

```python
# 每日温度：右边第一个更大
def dailyTemperatures(t: list[int]) -> list[int]:
    ans = [0] * len(t)
    st = []                            # 存下标，值递减
    for i, x in enumerate(t):
        while st and x > t[st[-1]]:
            idx = st.pop()
            ans[idx] = i - idx
        st.append(i)
    return ans

# 柱状图最大矩形
def largestRectangleArea(heights: list[int]) -> int:
    heights = heights + [0]            # 哨兵
    st = []; ans = 0
    for i, h in enumerate(heights):
        while st and h < heights[st[-1]]:
            height = heights[st.pop()]
            left = st[-1] if st else -1
            ans = max(ans, height * (i - left - 1))
        st.append(i)
    return ans
```

易错：存下标不存值；`while st and ...` 利用空列表 falsy 判空；O(n)。

## 5. 单调队列

**什么时候用**：滑动窗口最值。直觉：新元素更大且更晚过期，队尾永久淘汰。

```python
def maxSlidingWindow(nums: list[int], k: int) -> list[int]:
    dq = deque(); ans = []
    for i, x in enumerate(nums):
        while dq and dq[0] <= i - k: dq.popleft()   # 1. 过期
        while dq and nums[dq[-1]] <= x: dq.pop()    # 2. 弹尾
        dq.append(i)                                # 3. 入队
        if i >= k - 1: ans.append(nums[dq[0]])      # 4. 记录
    return ans
```

四步顺序：过期 → 弹尾 → 入队 → 记录。对比：固定窗口最值用单调队列 O(n)；动态第 K 大用 heapq——「前 K 个高频元素」更短的写法是 `Counter(nums).most_common(k)`。

## 6. 并查集

**什么时候用**：动态连通性，只加边不删边。`union` 返回 False 可判环。

```python
class DSU:
    def __init__(self, n: int):
        self.parent = list(range(n))
        self.sz = [1] * n

    def find(self, x: int) -> int:
        while self.parent[x] != x:                    # 迭代版，避开递归深度
            self.parent[x] = self.parent[self.parent[x]]
            x = self.parent[x]
        return x

    def union(self, a: int, b: int) -> bool:
        ra, rb = self.find(a), self.find(b)
        if ra == rb: return False
        if self.sz[ra] < self.sz[rb]: ra, rb = rb, ra
        self.parent[rb] = ra
        self.sz[ra] += self.sz[rb]
        return True
```

```python
# 岛屿数量（DSU 版）：陆地 +1，成功合并 −1
def numIslands(grid):
    m, n = len(grid), len(grid[0])
    dsu = DSU(m * n); cnt = 0
    for i in range(m):
        for j in range(n):
            if grid[i][j] != '1': continue
            cnt += 1
            id = i * n + j                            # n 是列数
            if i > 0 and grid[i-1][j] == '1' and dsu.union(id, id - n): cnt -= 1
            if j > 0 and grid[i][j-1] == '1' and dsu.union(id, id - 1): cnt -= 1
    return cnt
```

**Python 特解思路**：最长连续序列用 set 更短——只从 `x - 1 not in s` 的"序列起点"开始数，整体 O(n)。并查集是通用工具，set/dict 的表达力常给出特解，两个都要会。

## 7. 推荐刷题顺序

1. **哈希**：两数之和 → 字母异位词分组（`sorted(s)` 当 key）→ 最长连续序列
2. **双指针**：移动零 → 盛最多水的容器 → 三数之和
3. **滑动窗口**：无重复字符最长子串 → 找到所有字母异位词
4. **子串**：和为 K 的子数组 → 滑动窗口最大值
5. **数组/矩阵**：最大子数组和 → 合并区间 → 轮转数组（先做 `k %= len(nums)`，再切片 `nums[:] = nums[-k:] + nums[:-k]`）
6. **链表**：反转 → 环形 → 合并有序链表 → LRU（压轴）
7. **二叉树**：最大深度 → 层序遍历 → 最近公共祖先
8. **图/回溯**：岛屿数量 → 课程表 → 全排列
9. **栈/堆**：有效括号 → 每日温度 → 前 K 个高频元素
10. **贪心/DP**：买卖股票 → 跳跃游戏 → 爬楼梯 → 零钱兑换
11. **位运算/技巧**：只出现一次的数字 → 多数元素

专项顺序：每日温度 → 柱状图最大矩形 → 滑动窗口最大值 → 岛屿数量 → 冗余连接。

## 8. 避坑清单（Python 特有）

1. `ans.append(path)` 没加 `.copy()` → 回溯答案全错
2. `[[0] * n] * m` → 所有行是同一个列表
3. 循环里 `s += c` → O(n²)，用 `''.join`
4. `list.pop(0)` 当队列 → O(n)，BFS 用 deque
5. 递归爆栈 → `sys.setrecursionlimit(10**5)`
6. `sort()` 返回 None，`nums = nums.sort()` 直接炸
7. 负数向下取整：`-3 // 2 == -2`，向零取整用 `int(a / b)`
8. heapq 只有小根堆；元组堆加唯一序号防 item 不可比
9. Counter 减到 0 不删 key，统计种类用 defaultdict
10. `dfs(nums[1:])` 每层切片拷贝 O(n)，传下标
11. 可变对象当默认参数（`def f(x=[])`）是共享的

## 9. 节奏建议

- 第 1~2 天：确认五件套（defaultdict / Counter / deque / heapq / bisect）API 手感
- 第 1 周：哈希到链表，每题一句话总结模板
- 第 2 周：树、图、回溯 + 三个专项，模板默写到不思考
- 第 3 周起：贪心、DP 收尾，二刷错题
- 加分动作：AC 后看高票 Python 题解——「原来这个库一行就能做」比多刷题更能提升代码质量

## 附：C++ / Python 工具对照

| 用途 | C++ | Python |
|---|---|---|
| 动态数组 | `vector` | `list` |
| 栈 | `stack` | `list`（append/pop） |
| 队列 | `queue` / `deque` | `collections.deque` |
| 哈希表 | `unordered_map` | `dict` / `defaultdict` |
| 计数 | `unordered_map<int,int>` | `Counter` |
| 堆 | `priority_queue`（默认大根） | `heapq`（小根，负数取反） |
| 二分 | `lower_bound` | `bisect_left` |
| 排序自定义 | lambda 比较器 | `key=lambda` / `cmp_to_key` |
| 记忆化 | 手写 memo | `@lru_cache` |
| 溢出 | 小心，用 long long | 不存在 |
| 递归深度 | 基本不用担心 | `setrecursionlimit` |
