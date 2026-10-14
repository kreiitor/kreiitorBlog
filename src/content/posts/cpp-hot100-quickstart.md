---
title: "C++ 刷 Hot100 速拾手册"
description: "语法学过但手生时的最小工作集：STL 速查、高频模板默写、单调栈/单调队列/并查集三个专项，以及按分类的刷题顺序与避坑清单。"
pubDate: 2026-10-14
tags:
  - "算法"
  - "学习笔记"
  - "cpp"
category: knowledge
cover: /covers/post-code-algorithm.svg
featured: true
---

> 定位：不重新系统学 C++，只找回刷 Hot100 所需的最小必要集。
> 用法：第 1～2 节当字典查，第 3 节模板抄到手熟，三个专项（单调栈 / 单调队列 / 并查集）单独突破，最后是刷题策略与避坑清单。
> 原则：在 LeetCode 上只需要写 `Solution` 类，语法学到够用就停。

## 1. 最小必要语法

### 提交形态

```cpp
class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) { /* ... */ }
};
```

本地调试才写 `#include <bits/stdc++.h>` + `main()`。

### 高频惯例

```cpp
int n = nums.size();
int m = grid.size(), n = grid[0].size();   // 矩阵行、列

for (int x : nums) {}            // 值拷贝，便宜类型可用
for (int& x : nums) {}           // 要修改
for (const auto& x : v) {}       // 只读大对象
for (auto& [k, v] : mp) {}       // C++17 结构化绑定遍历 map
```

经验法则：范围 for 默认 `const auto&`，要改才去 const，基本类型直接按值。

### 传参三选一

```cpp
void dfs(vector<int>& nums);        // 要改
void dfs(const vector<int>& nums);  // 只读，大对象必须这样传
void dfs(string s);                 // 只有"函数内要改、不影响外部"才按值
```

递归传大对象忘加 `&`，每层拷贝一次——手生期最常见的 TLE 来源。

### sort 与 lambda

```cpp
sort(nums.begin(), nums.end());
sort(nums.begin(), nums.end(), greater<int>());
sort(intervals.begin(), intervals.end(),
     [](const auto& a, const auto& b) { return a[0] < b[0]; });
```

铁律：比较函数写 `<=` 是未定义行为；要"相等保持原序"用 `stable_sort`。

### 位运算与溢出

```cpp
n & 1; n >> 1; n & (n - 1); n & (-n); 1 << i; __builtin_popcount(n);
```

`int` 约 ±2×10⁹，累加/乘法先上 `long long`，表达式里写 `1LL * a * b` 提升类型。

## 2. STL 速查

```cpp
// vector
vector<int> v = {1, 2, 3};
v.push_back(4); v.pop_back(); v.front(); v.back();
vector<vector<int>> dp(m, vector<int>(n, 0));      // 二维初始化

// string
s.substr(pos, len);          // 第二参数是【长度】
to_string(123); stoi("123");
char c = '0' + d; int d = c - '0';

// unordered_map / set
cnt[x]++; cnt.count(x); cnt.find(x);
// 坑：mp[key] 在 key 不存在时会【静默插入默认值】，只查用 count/find

// stack / queue / deque
st.push(x); st.top(); st.pop();
q.push(x); q.front(); q.pop();
dq.push_back(x); dq.push_front(x); dq.pop_front(); dq.front(); dq.back();

// priority_queue
priority_queue<int> maxHeap;                              // 默认大根堆
priority_queue<int, vector<int>, greater<int>> minHeap;   // 小根堆
auto cmp = [](ListNode* a, ListNode* b) { return a->val > b->val; };
priority_queue<ListNode*, vector<ListNode*>, decltype(cmp)> pq(cmp);
// 记忆法：sort 比较器是"谁排前面"，priority_queue 是"谁排后面"

// 常用算法
v.erase(unique(v.begin(), v.end()), v.end());   // 去重（需有序）
lower_bound(v.begin(), v.end(), x);             // 第一个 >= x，取下标：it - v.begin()
iota(parent.begin(), parent.end(), 0);          // 并查集必备
next_permutation(v.begin(), v.end());
```

## 3. 高频模板（建议默写）

### 哈希补数（两数之和）

```cpp
unordered_map<int, int> pos;
for (int i = 0; i < n; i++) {
    if (pos.count(target - nums[i])) return {pos[target - nums[i]], i};
    pos[nums[i]] = i;
}
```

### 滑动窗口

```cpp
int left = 0;
for (int right = 0; right < n; right++) {
    /* 加入 nums[right]，更新窗口状态 */
    while (/* 窗口不合法 */) { /* 移除 nums[left] */ left++; }
    /* 此处窗口必然合法，更新答案 */
}
```

### 二分

```cpp
int l = 0, r = n - 1;
while (l <= r) {
    int mid = l + (r - l) / 2;       // 防溢出，别写 (l+r)/2
    if (nums[mid] == target) return mid;
    else if (nums[mid] < target) l = mid + 1;
    else r = mid - 1;
}
```

找"第一个 >= x"直接用 `lower_bound`，别手写。

### 前缀和

```cpp
vector<int> pre(n + 1, 0);
for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + nums[i];
// 区间和 [l, r] = pre[r + 1] - pre[l]
```

「和为 K 的子数组」= 前缀和 + 哈希：`pre[j] - pre[i] == k` ⇔ `pre[i] == pre[j] - k`，边算边查 map。

### 回溯

```cpp
void dfs(int start, vector<int>& path) {
    if (/* 到达叶子 */) { ans.push_back(path); return; }
    for (int i = start; i < n; i++) {
        path.push_back(nums[i]);   // 做选择
        dfs(i + 1, path);
        path.pop_back();           // 撤销选择
    }
}
```

三要素：路径、选择列表、结束条件。子集/组合用 `start`，排列用 `used[]`。

### 网格 DFS / BFS

```cpp
int dirs[4][2] = {{1,0},{-1,0},{0,1},{0,-1}};

void dfs(vector<vector<char>>& grid, int i, int j) {
    if (i < 0 || i >= m || j < 0 || j >= n || grid[i][j] != '1') return;
    grid[i][j] = '0';                    // 原地标记
    for (auto& d : dirs) dfs(grid, i + d[0], j + d[1]);
}

// BFS 逐层：先定层大小
queue<pair<int,int>> q; q.push({si, sj});
while (!q.empty()) {
    int sz = q.size();
    while (sz--) {
        auto [x, y] = q.front(); q.pop();
        /* 四方向扩展 */
    }
    /* 一层结束 */
}
```

### 链表：dummy 与反转

```cpp
ListNode dummy(0); ListNode* cur = &dummy;
/* ... */ return dummy.next;

ListNode* pre = nullptr;
while (cur) { ListNode* nxt = cur->next; cur->next = pre; pre = cur; cur = nxt; }
return pre;
```

环检测/中点用快慢指针。

### 二叉树

```cpp
int maxDepth(TreeNode* root) {
    if (!root) return 0;
    return 1 + max(maxDepth(root->left), maxDepth(root->right));
}
```

BST 记住：中序遍历 = 升序。

### Trie

```cpp
struct TrieNode {
    TrieNode* child[26] = {};
    bool isEnd = false;
};
```

### DP 初始化

```cpp
vector<int> dp(n + 1, 0);
vector<vector<int>> dp(m, vector<int>(n, 0));
```

顺序：状态含义 → 转移方程 → 初始化 → 遍历顺序。初始化错是最常见的 WA 来源（背包求方案数 `dp[0]=1`，求最值 `dp[0]=0`）。

## 4. 单调栈

**什么时候用**：求「每个元素 左边/右边 第一个 比它大/小」。典型：每日温度、柱状图最大矩形、接雨水。

| 求什么 | 遍历方向 | 栈（底→顶） | 弹栈时机 |
|---|---|---|---|
| 右边第一个更大 | 左→右 | 递减 | 当前 > 栈顶 |
| 右边第一个更小 | 左→右 | 递增 | 当前 < 栈顶 |
| 左边第一个更大 | 右→左 | 递减 | 当前 > 栈顶 |
| 左边第一个更小 | 右→左 | 递增 | 当前 < 栈顶 |

口诀：**当前元素能解决谁，就弹谁。**

```cpp
// 每日温度：右边第一个更大
vector<int> dailyTemperatures(vector<int>& t) {
    vector<int> ans(t.size(), 0);
    stack<int> st;                       // 存下标，值递减
    for (int i = 0; i < t.size(); i++) {
        while (!st.empty() && t[i] > t[st.top()]) {
            int idx = st.top(); st.pop();
            ans[idx] = i - idx;
        }
        st.push(i);
    }
    return ans;
}

// 柱状图最大矩形：每个柱向左右延伸到第一个更矮处
int largestRectangleArea(vector<int>& h) {
    h.push_back(0);                      // 哨兵，强制最后弹空
    stack<int> st; int ans = 0;
    for (int i = 0; i < (int)h.size(); i++) {
        while (!st.empty() && h[i] < h[st.top()]) {
            int height = h[st.top()]; st.pop();
            int left = st.empty() ? -1 : st.top();
            ans = max(ans, height * (i - left - 1));
        }
        st.push(i);
    }
    return ans;
}
```

易错：栈存**下标**不存值；复杂度 O(n)，每个元素进出各一次。

## 5. 单调队列

**什么时候用**：滑动窗口最值。直觉：新元素更大且更晚过期，队尾永久淘汰。

```cpp
vector<int> maxSlidingWindow(vector<int>& nums, int k) {
    deque<int> dq;                       // 存下标，值从队首到队尾递减
    vector<int> ans;
    for (int i = 0; i < nums.size(); i++) {
        while (!dq.empty() && dq.front() <= i - k) dq.pop_front(); // 1. 过期
        while (!dq.empty() && nums[dq.back()] <= nums[i]) dq.pop_back(); // 2. 弹尾
        dq.push_back(i);                                                // 3. 入队
        if (i >= k - 1) ans.push_back(nums[dq.front()]);                // 4. 记录
    }
    return ans;
}
```

四步顺序固定：过期 → 弹尾 → 入队 → 记录。求最小值把第 2 步 `<=` 换成 `>=`。

对比：固定窗口最值用单调队列 O(n)；动态第 K 大 / 前 K 高频用 `priority_queue` O(n log n)。

## 6. 并查集

**什么时候用**：动态连通性，只加边不删边。`unite` 返回 false（已连通）可判环。

```cpp
struct DSU {
    vector<int> parent, sz;
    DSU(int n) : parent(n), sz(n, 1) { iota(parent.begin(), parent.end(), 0); }
    int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]);   // 路径压缩
        return parent[x];
    }
    bool unite(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;
        if (sz[ra] < sz[rb]) swap(ra, rb);                 // 小挂大
        parent[rb] = ra; sz[ra] += sz[rb];
        return true;
    }
};
```

```cpp
// 岛屿数量（DSU 版）：陆地 +1，成功合并 −1，只查上/左邻居
int numIslands(vector<vector<char>>& grid) {
    int m = grid.size(), n = grid[0].size();
    DSU dsu(m * n); int cnt = 0;
    for (int i = 0; i < m; i++) for (int j = 0; j < n; j++) {
        if (grid[i][j] != '1') continue;
        cnt++;
        int id = i * n + j;                                // n 是列数
        if (i > 0 && grid[i-1][j] == '1' && dsu.unite(id, id - n)) cnt--;
        if (j > 0 && grid[i][j-1] == '1' && dsu.unite(id, id - 1)) cnt--;
    }
    return cnt;
}
```

易错：`unite` 前必须 `find`；`sz` 只有根有效；二维转一维 n 是列数；并查集不支持删边。

## 7. 推荐刷题顺序

按分类刷，不按题号刷：

1. **哈希**：两数之和 → 字母异位词分组 → 最长连续序列
2. **双指针**：移动零 → 盛最多水的容器 → 三数之和
3. **滑动窗口**：无重复字符最长子串 → 找到所有字母异位词
4. **子串**：和为 K 的子数组 → 滑动窗口最大值（衔接单调队列）
5. **数组/矩阵**：最大子数组和 → 合并区间 → 旋转图像
6. **链表**：反转 → 环形 → 合并有序链表 → LRU（压轴）
7. **二叉树**：最大深度 → 层序遍历 → 最近公共祖先
8. **图/回溯**：岛屿数量 → 课程表 → 全排列
9. **栈/堆**：有效括号 → 每日温度 → 数组中第 K 大
10. **贪心/DP**：买卖股票 → 跳跃游戏 → 爬楼梯 → 零钱兑换
11. **位运算/技巧**：只出现一次的数字 → 多数元素 → 颜色分类

专项顺序：每日温度 → 柱状图最大矩形 → 滑动窗口最大值 → 岛屿数量 → 冗余连接。

## 8. 避坑清单

1. `mp[key]` 查询时插入不存在的 key → 查询用 `count`/`find`
2. 递归传 `vector` 忘加 `&` → 每层拷贝，TLE
3. `sort` 比较函数写 `<=` → UB
4. `priority_queue` 默认**大**根堆
5. `substr(pos, len)` 第二参数是长度
6. 累加/乘法先上 `long long`；`(l+r)/2` 写成 `l+(r-l)/2`
7. 链表先想 dummy；二叉树先判 `nullptr`
8. 单调栈/队列存下标不存值；单调队列四步顺序固定
9. 多组测试全局变量要重置
10. `stack`/`queue` 取元素是 `top()`/`front()`，`pop` 无返回值

## 9. 节奏建议

- 第 1~2 天：语法速过，写两道简单题验证手感，不要停留
- 第 1 周：哈希到链表六类，每题一句话总结「本质模板是什么」
- 第 2 周：树、图、回溯 + 三个专项，模板默写到肌肉记忆
- 第 3 周起：贪心、DP 收尾；二刷错题（标准：不看题解独立 AC）
- 衡量标准不是「刷过」，是同类新题 10 分钟内有正确思路
