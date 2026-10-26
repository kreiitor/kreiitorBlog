---
title: "C++ 刷 Hot100 速拾手册"
description: "语法学过但手生时的最小工作集：STL 速查、高频模板默写、单调栈/单调队列/并查集三个专项，以及按分类的刷题顺序与避坑清单。"
pubDate: 2026-10-14
updatedDate: 2026-10-26
tags:
  - "算法"
  - "学习笔记"
  - "cpp"
category: knowledge
cover: /covers/post-code-cpp.svg
featured: true
---

这份手册给“学过 C++ 语法但手生”的人用，目标是把刷题需要的那部分 C++ 捡回来。没写过 C++ 的，先看第 0 节；写过但很久没用的，直接从第 1 节开始。LeetCode 只要求写 `Solution` 类，模板元编程、RAII 这些与刷题无关的部分不用碰。

---

## 0. 完全没写过 C++

先看这段代码。能大致读懂，就可以直接进第 1 节；读不懂，先补 C++ 的变量、循环、函数、`vector` 和 `class`。

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    int n = 3;
    vector<int> a = {1, 2, 3};
    unordered_map<int, int> cnt;

    for (int x : a) {
        cnt[x]++;
    }

    int sum = 0;
    for (int i = 0; i < n; i++) {
        sum += a[i];
    }

    cout << sum << " " << cnt[3] << endl;
}
```

刷题只需要这些：

| 需求 | 写法 |
| --- | --- |
| 变量 | `int x = 0;`、`long long y = 0;`、`bool ok = false;` |
| 动态数组 | `vector<int> a(n);`、`a.push_back(x);`、`a.size()` |
| 字符串 | `string s = "abc";`、`s[i]`、`s.size()` |
| 哈希表 | `unordered_map<int,int> mp;`、`mp[x]++`、`mp.count(x)` |
| 集合 | `unordered_set<int> st;`、`st.insert(x)`、`st.count(x)` |
| 循环 | `for (int i = 0; i < n; i++)`、`for (int x : a)` |
| 函数 | `int f(int x) { return x + 1; }` |
| 类 | `class Solution { public: int f(...) { ... } };` |
| 引用 | `void f(vector<int>& a)` 会改原数组，`const vector<int>&` 只读 |
| 排序 | `sort(a.begin(), a.end());` |

几个容易卡住的点：

- `vector<int> a(n)` 会创建 n 个 0；`vector<int> a;` 是空数组，用 `push_back` 添加。
- `size()` 返回 `size_t`，和 `int` 比较时注意无符号/有符号警告。
- 递归传大对象用 `const vector<int>&`，否则每层都拷贝。
- `unordered_map::operator[]` 访问不存在的 key 会插入 0，计数方便；只查存在用 `count` 或 `find`。
- `INT_MAX` / `INT_MIN` 在 `<climits>` 里，`bits/stdc++.h` 已经包含。
- LeetCode 只写 `Solution` 类，不写 `main`。

## 1. 最小必要语法

### 1.1 提交形态

LeetCode 只判这个类，本地调试才需要 main：

```cpp
class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // ...
    }
};
```

```cpp
// 本地调试
#include <bits/stdc++.h>
using namespace std;
int main() { /* 造数据、调 Solution、打印 */ }
```

`bits/stdc++.h` 不是标准头文件，但 LeetCode 与竞赛环境都认，刷题阶段图省事就用它。

### 1.2 高频惯例写法

```cpp
int n = nums.size();
int m = grid.size(), n = grid[0].size();   // 矩阵：行、列

vector<int> ans;
vector<vector<int>> res;
unordered_map<int, int> cnt;
unordered_set<int> seen;

for (int x : nums) {}            // 值拷贝，便宜类型可用
for (int& x : nums) {}           // 要修改元素
for (const auto& x : v) {}       // 只读大对象，避免拷贝
for (auto& [k, v] : mp) {}       // C++17 结构化绑定遍历 map
```

经验法则：**范围 for 默认写 `const auto&`，要改才去 const，基本类型（int/char）直接按值。**

### 1.3 传参三选一

```cpp
void dfs(vector<int>& nums);        // 函数内要改
void dfs(const vector<int>& nums);  // 只读，大对象必须这样传
void dfs(string s);                 // 只有"函数内要改、且不影响外部"才按值
```

递归函数传大对象忘了加 `&`，每层拷贝一次，轻则 TLE 重则 MLE——这是手生期最常见的性能 bug。

### 1.4 sort 与 lambda

```cpp
sort(nums.begin(), nums.end());                      // 升序
sort(nums.begin(), nums.end(), greater<int>());      // 降序

sort(intervals.begin(), intervals.end(),
     [](const auto& a, const auto& b) { return a[0] < b[0]; });
```

两条铁律：

1. 比较函数表达的是 **strict weak ordering**——写 `a <= b` 是未定义行为，某些数据下直接崩。想要"相等时保持原顺序"用 `stable_sort`。
2. 捕获外部变量用 `[&]`，但在比较函数里通常什么都不需要捕获。

### 1.5 位运算速查

```cpp
n & 1                  // 奇偶：1 为奇
n >> 1                 // 除以 2（非负）
n & (n - 1)            // 消去最低位的 1（Brian Kernighan 数 1 的核心）
n & (-n)               // 取出最低位的 1（lowbit，树状数组常用）
1 << i                 // 第 i 位置 1
__builtin_popcount(n)  // 二进制中 1 的个数
```

### 1.6 溢出

`int` 大约 ±2×10⁹。两个 10⁹ 级别的数相加就溢出。看到累加、乘法、阶乘，先想要不要 `long long`：

```cpp
long long sum = 0;
sum += 1LL * a * b;    // 1LL 把表达式提升为 long long
```

---

## 2. STL 速查

### 2.1 vector

```cpp
vector<int> v = {1, 2, 3};
v.push_back(4); v.pop_back();
v.size(); v.empty(); v.front(); v.back(); v[0];

// 二维初始化——刷题每天都在写
vector<vector<int>> dp(m, vector<int>(n, 0));
vector<vector<bool>> vis(m, vector<bool>(n, false));
```

### 2.2 string

```cpp
s.size(); s[i]; s += 'c'; s.push_back('c');
s.substr(pos, len);          // 第二个参数是【长度】不是结束下标！
to_string(123); stoi("123"); stol("123");
char c = '0' + d;            // 数字转字符
int d = c - '0';             // 字符转数字
isdigit(c); isalpha(c); tolower(c); toupper(c);   // <cctype>
```

### 2.3 unordered_map / unordered_set

```cpp
unordered_map<int, int> cnt;
cnt[x]++;                    // 计数一把梭
cnt.count(x);                // 存在性检查，返回 0/1
cnt.find(x);                 // 找不到返回 cnt.end()

unordered_set<int> st;
st.insert(x); st.count(x); st.erase(x);
```

**最大的坑**：`mp[key]` 在 key 不存在时会**静默插入一个默认值**。只想查询就用 `count`/`find`，否则 map 会越查越大，逻辑也可能错。

### 2.4 map / set

有序（红黑树），操作 O(log n)。Hot100 里真正需要有序的场景很少（如需要 `lower_bound` 的动态查询），多数情况 `unordered_*` 的 O(1) 更香。

### 2.5 stack / queue / deque

```cpp
stack<int> st;  st.push(x); st.top(); st.pop();
queue<int> q;   q.push(x); q.front(); q.pop();
deque<int> dq;  dq.push_back(x); dq.push_front(x);
                dq.pop_back(); dq.pop_front(); dq.front(); dq.back();
```

注意 stack/queue 没有迭代器、没有 clear()，清空就 `while(!st.empty()) st.pop();` 或重新赋值。

### 2.6 priority_queue

```cpp
priority_queue<int> maxHeap;                                // 默认大根堆
priority_queue<int, vector<int>, greater<int>> minHeap;     // 小根堆

// 自定义比较：堆顶是"比较结果为 false 方向"的元素
// 想要 val 最小在堆顶，比较器写 a > b（和 sort 正好相反，容易绕晕）
auto cmp = [](ListNode* a, ListNode* b) { return a->val > b->val; };
priority_queue<ListNode*, vector<ListNode*>, decltype(cmp)> pq(cmp);
```

记忆法：**sort 的比较器是"谁该排前面"，priority_queue 的比较器是"谁该排后面"。**

### 2.7 pair

```cpp
pair<int,int> p = {1, 2};
p.first; p.second;
vector<pair<int,int>> v;
sort(v.begin(), v.end());   // 默认先比 first 再比 second，常能省掉 lambda
```

### 2.8 常用算法（<algorithm> / <numeric>）

```cpp
sort(v.begin(), v.end());
reverse(v.begin(), v.end());
v.erase(unique(v.begin(), v.end()), v.end());   // 去重（需先有序）
lower_bound(v.begin(), v.end(), x);             // 第一个 >= x，要求有序
upper_bound(v.begin(), v.end(), x);             // 第一个 > x
iota(parent.begin(), parent.end(), 0);          // 填 0,1,2,...，并查集必备
next_permutation(v.begin(), v.end());           // 下一个排列（需先升序）
min_element / max_element / accumulate(v.begin(), v.end(), 0LL);
```

`lower_bound` 返回迭代器，取下标要 `it - v.begin()`。

---

## 3. Hot100 高频模板

> 这一章建议达到"默写"程度。每个模板都标注了对应题型。

### 3.1 哈希计数 / 哈希补数

```cpp
// 两数之和：边遍历边查 target - x 是否出现过
unordered_map<int, int> pos;
for (int i = 0; i < n; i++) {
    if (pos.count(target - nums[i])) return {pos[target - nums[i]], i};
    pos[nums[i]] = i;
}
```

### 3.2 排序 + 去重

```cpp
sort(nums.begin(), nums.end());
nums.erase(unique(nums.begin(), nums.end()), nums.end());
```

### 3.3 对撞双指针

```cpp
int l = 0, r = n - 1;
while (l < r) {
    int sum = nums[l] + nums[r];
    if (sum == target) { /* 记录 */ l++; r--; }
    else if (sum < target) l++;
    else r--;
}
```

### 3.4 滑动窗口

```cpp
// 右指针负责扩张，左指针负责在"不合法"时收缩
int left = 0;
for (int right = 0; right < n; right++) {
    /* 加入 nums[right]，更新窗口状态 */
    while (/* 窗口不合法 */) {
        /* 移除 nums[left] */ left++;
    }
    /* 此处窗口必然合法，更新答案 */
}
```

窗口类题目（无重复字符最长子串、找到所有字母异位词）全是这个骨架，差别只在"合法性"如何定义与维护。

### 3.5 二分

```cpp
// 闭区间 [l, r]，找精确值
int l = 0, r = n - 1;
while (l <= r) {
    int mid = l + (r - l) / 2;         // 防溢出写法，(l+r)/2 在大数据下会溢出
    if (nums[mid] == target) return mid;
    else if (nums[mid] < target) l = mid + 1;
    else r = mid - 1;
}
```

找"第一个 >= x"直接用 `lower_bound`，别手写，边界容易错。

### 3.6 前缀和

```cpp
vector<int> pre(n + 1, 0);
for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + nums[i];
// 区间和 [l, r] = pre[r + 1] - pre[l]
```

「和为 K 的子数组」= 前缀和 + 哈希：`pre[j] - pre[i] == k` ⇔ `pre[i] == pre[j] - k`，边算边查 map。

### 3.7 回溯

```cpp
void dfs(int start, vector<int>& path) {
    if (/* 到达叶子 */) { ans.push_back(path); return; }
    for (int i = start; i < n; i++) {
        path.push_back(nums[i]);   // 做选择
        dfs(i + 1, path);          // 递归（排列题从 0 开始并配 used 数组）
        path.pop_back();           // 撤销选择
    }
}
```

三要素：**路径、选择列表、结束条件**。子集/组合用 `start` 控顺序，排列用 `used[]`。

### 3.8 网格 DFS

```cpp
int dirs[4][2] = {{1,0},{-1,0},{0,1},{0,-1}};

void dfs(vector<vector<char>>& grid, int i, int j) {
    if (i < 0 || i >= m || j < 0 || j >= n || grid[i][j] != '1') return;
    grid[i][j] = '0';              // 原地标记，省一个 vis 数组
    for (auto& d : dirs) dfs(grid, i + d[0], j + d[1]);
}
```

### 3.9 BFS（队列 + 逐层）

```cpp
queue<pair<int,int>> q;
q.push({si, sj});
while (!q.empty()) {
    int sz = q.size();             // 先定层大小，才能按层处理
    while (sz--) {
        auto [x, y] = q.front(); q.pop();
        for (auto& d : dirs) {
            int nx = x + d[0], ny = y + d[1];
            /* 边界 & 访问检查 → 标记 → q.push({nx, ny}) */
        }
    }
    /* 一层结束（层序遍历、最短路径步数 +1 都写这里） */
}
```

### 3.10 链表：dummy 与反转

```cpp
// dummy 把头节点变成"普通节点"，删除/合并类题必用
ListNode dummy(0);
ListNode* cur = &dummy;
/* ... */
return dummy.next;

// 反转链表：三指针，pre / cur / nxt
ListNode* pre = nullptr;
while (cur) {
    ListNode* nxt = cur->next;
    cur->next = pre;
    pre = cur;
    cur = nxt;
}
return pre;
```

环检测 / 链表中点用快慢指针：快指针走两步，慢指针走一步。

### 3.11 二叉树

```cpp
// 递归：先想清楚"这个函数对一棵子树返回什么"
int maxDepth(TreeNode* root) {
    if (!root) return 0;
    return 1 + max(maxDepth(root->left), maxDepth(root->right));
}
```

层序遍历见 3.9 的 `sz = q.size()` 模式。BST 记住：中序遍历 = 升序序列。

### 3.12 Trie

```cpp
struct TrieNode {
    TrieNode* child[26] = {};   // 花括号值初始化为 nullptr
    bool isEnd = false;
};
```

插入/查询都是沿字符下钻，`c - 'a'` 转下标。数组大小不固定时换 `unordered_map<char, TrieNode*>`。

### 3.13 DP 初始化

```cpp
vector<int> dp(n + 1, 0);
vector<vector<int>> dp(m, vector<int>(n, 0));
```

写 DP 的顺序：**先定义状态含义 → 写转移方程 → 定初始化 → 确定遍历顺序**。初始化错是最常见的 WA 来源（比如背包求方案数 `dp[0]=1`，求最值 `dp[0]=0`）。

---

## 4. 单调栈

### 4.1 什么时候想到它

> 题目要求「每个元素 左边/右边 第一个 比它大/小 的元素」。

关键词：下一个更大元素、每日温度、柱状图最大矩形、接雨水。

### 4.2 一张表记住方向

| 求什么 | 遍历方向 | 栈（底→顶） | 弹栈时机 |
|---|---|---|---|
| 右边第一个更大 | 左→右 | 递减 | 当前 > 栈顶 |
| 右边第一个更小 | 左→右 | 递增 | 当前 < 栈顶 |
| 左边第一个更大 | 右→左 | 递减 | 当前 > 栈顶 |
| 左边第一个更小 | 右→左 | 递增 | 当前 < 栈顶 |

不用背表，记住一句：**"当前元素能解决谁，就弹谁"**——当前元素是栈顶元素等待已久的"右边第一个更大"，所以弹出并记录。

### 4.3 模板：每日温度（右边第一个更大）

```cpp
vector<int> dailyTemperatures(vector<int>& t) {
    int n = t.size();
    vector<int> ans(n, 0);
    stack<int> st;                    // 存【下标】，对应值从栈底到栈顶递减
    for (int i = 0; i < n; i++) {
        while (!st.empty() && t[i] > t[st.top()]) {
            int idx = st.top(); st.pop();
            ans[idx] = i - idx;
        }
        st.push(i);
    }
    return ans;                       // 留在栈里的，右边没有更大值，ans 保持 0
}
```

### 4.4 柱状图最大矩形（每个柱的左右第一个更小）

```cpp
int largestRectangleArea(vector<int>& h) {
    h.push_back(0);                   // 哨兵：强制最后弹空
    stack<int> st;                    // 递增栈，存下标
    int ans = 0;
    for (int i = 0; i < (int)h.size(); i++) {
        while (!st.empty() && h[i] < h[st.top()]) {
            int height = h[st.top()]; st.pop();
            int left = st.empty() ? -1 : st.top();   // 左边界（开区间）
            ans = max(ans, height * (i - left - 1)); // i 是右边界（开区间）
        }
        st.push(i);
    }
    return ans;
}
```

理解要点：**以某根柱子为高时，它能向左右延伸到第一个比它矮的位置为止。** 弹栈那一刻，右边界是 i，左边界是新栈顶，宽度 `i - left - 1`。

### 4.5 易错点

1. **栈里存下标不存值**——答案几乎都是"距离"或要用下标算宽度。
2. 相等元素弹不弹，看题目边界定义；一般用严格 `<`/`>`。
3. 末尾加哨兵值可以避免循环结束后再写一遍弹栈逻辑。
4. 时间复杂度是 O(n)：每个元素最多入栈出栈各一次，不是 O(n²)。

---

## 5. 单调队列

### 5.1 什么时候想到它

> 滑动窗口的 最大值/最小值。

为什么新元素比队尾大就要踢掉队尾？**新元素更大、且更晚过期——队尾在任何未来窗口里都不可能赢过它，永久淘汰。** 这一句话就是单调队列的全部直觉。

### 5.2 模板：滑动窗口最大值

```cpp
vector<int> maxSlidingWindow(vector<int>& nums, int k) {
    deque<int> dq;                    // 存下标，对应值从队首到队尾递减
    vector<int> ans;
    for (int i = 0; i < nums.size(); i++) {
        // 1. 队首过期（滑出窗口左边界）
        while (!dq.empty() && dq.front() <= i - k) dq.pop_front();
        // 2. 维护单调性：比当前小的队尾永久淘汰
        while (!dq.empty() && nums[dq.back()] <= nums[i]) dq.pop_back();
        // 3. 入队
        dq.push_back(i);
        // 4. 窗口形成后，队首即最大值
        if (i >= k - 1) ans.push_back(nums[dq.front()]);
    }
    return ans;
}
```

四步顺序固定：**过期 → 弹尾 → 入队 → 记录**。求最小值只需把第 2 步的 `<=` 换成 `>=`。

### 5.3 单调队列 vs 堆

| | 单调队列 | priority_queue |
|---|---|---|
| 复杂度 | O(n) | O(n log n) |
| 删除过期元素 | 精确弹出 | 只能懒删除（堆顶过期才 pop） |
| 适用 | 固定大小窗口最值 | 动态集合第 K 大、前 K 高频、数据流中位数 |

「前 K 个高频元素」用堆，「滑动窗口最大值」用单调队列——别混。

### 5.4 易错点

1. 四步顺序写反会出玄学 bug：先入队再弹过期，新元素可能当场被判过期。
2. 相等建议用 `<=` 弹队尾，保证队列里总是较新的下标，过期判断更省心。
3. 同样**存下标不存值**，因为过期判断要下标。

---

## 6. 并查集（DSU）

### 6.1 什么时候想到它

> 动态维护「谁和谁连通」，只加边不删边。

两个操作：`find(x)` 找根（老大是谁），`unite(a,b)` 合并两个集合。`unite` 返回 false（本来就连通）可以判环、判冗余边。

### 6.2 模板（路径压缩 + 按大小合并）

```cpp
struct DSU {
    vector<int> parent, sz;
    DSU(int n) : parent(n), sz(n, 1) {
        iota(parent.begin(), parent.end(), 0);   // 初始各自为王
    }
    int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]);  // 路径压缩
        return parent[x];
    }
    bool unite(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;
        if (sz[ra] < sz[rb]) swap(ra, rb);        // 小挂大
        parent[rb] = ra;
        sz[ra] += sz[rb];
        return true;
    }
    bool connected(int a, int b) { return find(a) == find(b); }
};
```

两个优化同时上，单次操作均摊近似 O(1)（反阿克曼函数，当常数看）。只写路径压缩也够过 Hot100。

### 6.3 例题：岛屿数量（并查集版）

```cpp
int numIslands(vector<vector<char>>& grid) {
    int m = grid.size(), n = grid[0].size();
    DSU dsu(m * n);
    int cnt = 0;
    for (int i = 0; i < m; i++)
        for (int j = 0; j < n; j++) {
            if (grid[i][j] != '1') continue;
            cnt++;                                   // 先自成一个岛
            int id = i * n + j;                      // 二维 → 一维，n 是列数
            if (i > 0 && grid[i-1][j] == '1' && dsu.unite(id, id - n)) cnt--;
            if (j > 0 && grid[i][j-1] == '1' && dsu.unite(id, id - 1)) cnt--;
        }
    return cnt;
}
```

技巧：**每发现一块陆地先把计数 +1，每成功合并一次 -1**——不用最后扫 parent 数根。只查上方和左方两个邻居，避免重复 union。

同题用 DFS 淹没岛屿（3.8）更简单；并查集版的价值在于理解思想，为「只能并查集」的题热身。

### 6.4 例题：冗余连接（判环）

```cpp
vector<int> findRedundantConnection(vector<vector<int>>& edges) {
    DSU dsu(edges.size() + 1);
    for (auto& e : edges)
        if (!dsu.unite(e[0], e[1])) return e;   // 两端已连通 → 这条边成环
    return {};
}
```

### 6.5 应用速查

| 场景 | 思路 |
|---|---|
| 岛屿数量 / 省份数量 | 合并相邻连通块，统计集合数 |
| 冗余连接 | `unite` 返回 false 即答案 |
| 等式方程可满足性 | 先合并所有 `==`，再检查每个 `!=` 是否连通 |
| 最长连续序列 | 相邻数值合并（也可用哈希 O(n) 做） |
| 账户合并 | 邮箱 union，最后按根分组 |
| Kruskal 最小生成树 | 边按权排序，不连通才选 |

### 6.6 易错点

1. 合并前必须各自 `find`——`unite` 操作的是根。
2. `sz` 只在根节点上有效，非根的 sz 是历史残留，别去读。
3. 二维转一维 `id = i * n + j`，**n 是列数**，写错维度全部白搭。
4. 并查集不支持删边、不支持拆分。需要删边的题换思路。
5. 记得 `#include <numeric>`（iota）——用 bits 头文件则无所谓。

---

## 7. Hot100 分类 × 模板对照

| 分类 | 顺手的 C++ 工具 | 核心模板 |
|---|---|---|
| 哈希 | unordered_map/set | 计数、补数、前缀和+哈希 |
| 双指针 | 下标 / 迭代器 | 对撞、快慢（链表） |
| 滑动窗口 | unordered_map 记窗口状态 | 3.4 骨架 |
| 子串 / 子数组 | 前缀和、单调队列 | pre[r+1]-pre[l]、窗口最值 |
| 数组 / 矩阵 | sort、二维 vector | 合并区间、原地置零 |
| 链表 | 指针、dummy | 反转三指针、快慢指针、合并 |
| 二叉树 | 递归、queue | DFS 返回值思维、层序 sz 技巧 |
| 图 | 邻接表、queue、DSU | BFS/DFS、拓扑排序、并查集 |
| 回溯 | path 数组 | 3.7 三要素 |
| 栈 | stack、deque | 括号匹配、单调栈 |
| 堆 | priority_queue | 第 K 大、前 K 高频 |
| 贪心 | sort + 自定义比较 | 区间、跳跃、股票 |
| 动态规划 | vector 初始化 | 背包、LIS、编辑距离 |
| 位运算 / 技巧 | 位操作 | 只出现一次、多数元素 |

---

## 8. 推荐刷题顺序

按分类刷，不按题号刷。每个分类先做 2~3 道简单题找回手感，再上中等：

1. **哈希**：两数之和 → 字母异位词分组 → 最长连续序列
2. **双指针**：移动零 → 盛最多水的容器 → 三数之和
3. **滑动窗口**：无重复字符最长子串 → 找到字符串中所有字母异位词
4. **子串**：和为 K 的子数组 → 滑动窗口最大值（衔接单调队列）
5. **数组/矩阵**：最大子数组和 → 合并区间 → 旋转图像
6. **链表**：反转链表 → 环形链表 → 合并两个有序链表 → LRU（压轴）
7. **二叉树**：最大深度 → 翻转 → 层序遍历 → 最近公共祖先
8. **图/回溯**：岛屿数量 → 课程表 → 全排列 → 子集
9. **栈/堆**：有效括号 → 每日温度 → 数组中第 K 大
10. **贪心/DP**：买卖股票 → 跳跃游戏 → 爬楼梯 → 零钱兑换 → 最长递增子序列
11. **位运算/技巧**：只出现一次的数字 → 多数元素 → 颜色分类

专项突破（第 4～6 章）配套顺序：每日温度 → 柱状图最大矩形 → 滑动窗口最大值 → 岛屿数量 → 冗余连接 → 等式方程可满足性。

---

## 9. 避坑清单（按出错频率排序）

1. `mp[key]` 查询时插入了不存在的 key → 查询用 `count`/`find`。
2. 递归函数传 `vector` 忘了 `&` → 每层拷贝，TLE。
3. `sort` 比较函数写成 `<=` → UB，随机 RE。
4. `priority_queue` 默认**大**根堆，要小根堆自己写 `greater<int>`。
5. `substr(pos, len)` 第二参数是长度不是结束位置。
6. `int` 溢出：累加、乘法先上 `long long`。
7. `(l + r) / 2` 在大数据下溢出，写 `l + (r - l) / 2`。
8. 链表题先想 dummy；二叉树先判 `nullptr`。
9. `vector` 下标越界不报错，表现为玄学 RE/WA——越界检查靠自己。
10. 单调栈/单调队列存**下标**不存值。
11. 单调队列四步顺序：过期 → 弹尾 → 入队 → 记录。
12. 多组测试时全局变量忘记重置。
13. `stack`/`queue` 取元素是 `top()`/`front()`，没有 `pop` 返回值。

---

## 10. 学习节奏建议

- **第 1~2 天**：第 1、2 章快速过一遍，在 LeetCode 上随便写两题简单题验证环境手感。不要停留，语法在刷题中补。
- **第 1 周**：按第 8 章顺序刷前 6 类（哈希到链表），每题做完用一句话总结「这题的本质模板是什么」写进错题本。
- **第 2 周**：树、图、回溯 + 第 4~6 章三个专项。单调栈/队列/并查集的模板要练到能默写。
- **第 3 周起**：贪心、DP、技巧题收尾；二刷错题，标准是不看题解独立写出且一次通过。
- 衡量标准不是「刷过」，是**同类新题 10 分钟内有正确思路**。
