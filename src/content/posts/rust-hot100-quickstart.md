---
title: "Rust 刷 Hot100 速拾手册"
description: "用 Rust 刷题的最小工作集：所有权/借用的刷题语境化、Rc<RefCell> 树与 take() 链表生存指南、单调栈/单调队列/并查集专项与避坑清单。"
pubDate: 2026-10-14
tags:
  - "算法"
  - "学习笔记"
  - "Rust"
category: knowledge
cover: /covers/post-code-rust.svg
featured: true
---


> 定位：Rust 语法学过但手生，目标是用 Rust 刷完 Hot100，而不是重学语言。
> 实话先说：**Rust 不是刷题的最顺手语言**——所有权/借用检查在链表、树、图题上会持续制造摩擦。但正因如此，用 Rust 刷题对理解所有权是最好的实战。
> 用法：第 1～2 节是刷题语境下的 Rust 最小工作集（含 LeetCode 特有的 `Option<Rc<RefCell<TreeNode>>>` 处理套路），第 3 节模板，第 4～6 节专项，最后是刷题顺序与避坑清单。

---

## 1. 最小必要语法

### 1.1 提交形态

```rust
impl Solution {
    pub fn two_sum(nums: Vec<i32>, target: i32) -> Vec<i32> {
        // ...
    }
}
```

LeetCode 已导入常见类型。注意函数签名是**值传递的 `Vec<i32>`**——你拥有它，可以直接消费（`into_iter`）或就地修改。

### 1.2 所有权与借用：刷题只需要三条规则

1. 每个值有且只有一个所有者；赋值/传参默认**移动**（move），原变量失效。
2. 想借用就传引用：`&x`（只读）或 `&mut x`（独占可变），二选一不能同时存在。
3. 临时借用用引用，长期持有用 `.clone()` 或一开始就拿到所有权。

```rust
fn f(nums: &Vec<i32>) {}       // 只读借用，调用后还能用 nums
fn g(nums: &mut Vec<i32>) {}   // 可变借用
fn h(nums: Vec<i32>) {}        // 拿走所有权
```

函数内同时需要"读数组 + 写另一个数组"完全没问题；麻烦的是**同一容器一边遍历一边改**：

```rust
// 编译不过：遍历借用 nums，循环内又 mut 借用
for x in &nums { nums.push(*x); }

// 解法：先收集再修改，或用下标
for i in 0..nums.len() { let x = nums[i]; /* ... */ }
```

**下标循环绕开借用冲突**是刷题最常用的妥协。

### 1.3 高频惯例

```rust
let n = nums.len();
let (m, n) = (grid.len(), grid[0].len());

for x in &nums {}                  // 只读遍历
for (i, x) in nums.iter().enumerate() {}
for x in nums.iter_mut() {}        // 可变遍历
for x in nums {}                   // 消费（Vec 本身，之后不能再用了）

let mut ans: Vec<i32> = Vec::new();
let mut cnt: HashMap<i32, i32> = HashMap::new();
```

类型标注只在编译器推不出来时写（`collect`、`HashMap::new`）。

### 1.4 Vec / 二维 Vec

```rust
let mut v = vec![1, 2, 3];
v.push(4); v.pop();
v.len(); v.is_empty(); v[0]; v[v.len() - 1];  // 或 v.last()

// 二维初始化
let mut dp = vec![vec![0; n]; m];
let mut vis = vec![vec![false; n]; m];
```

`vec![x; n]` 要求元素 `Clone`，基本类型都没问题。越界 `v[i]` 会 panic（不是 UB）——Rust 的越界是显式崩溃，比 C++ 好调试。

### 1.5 字符串

Rust 的 `String` / `&str` 按 UTF-8 存储，**不能按下标取字符**：

```rust
let bytes = s.as_bytes();          // &[u8]，刷题基本都是 ASCII，转字节最顺手
bytes[i]; bytes.len();
(b'0' + d) as char; (c as u8 - b'0') as i32   // 字符 ↔ 数字

let chars: Vec<char> = s.chars().collect();   // 需要 Unicode 字符时
s.chars().count()                 // 字符数（≠ s.len() 字节数！）
```

惯例：**算法题字符串先 `.as_bytes()` 转成 `&[u8]` 处理，需要返回时再 `String::from_utf8(bytes).unwrap()`。**

字符串不可按位修改；要改就 `into_bytes()` 转成 `Vec<u8>` 改完再转回。拼接用 `push_str`/`push` 或收集后 `join`/`concat`。

### 1.6 Option / Result 与常用组合子

```rust
map.get(&x)              // Option<&V>
map.get(&x).copied().unwrap_or(0)    // 取计数，没有就是 0
v.last()                 // Option<&T>
if let Some(&val) = map.get(&x) {}   // 解构
map.contains_key(&x)
```

`.unwrap()` 在刷题里可以放心用（确定不会 None 时），不需要工程代码那样的错误处理。

### 1.7 排序与 lambda（闭包）

```rust
nums.sort();                       // 原地升序
nums.sort_by(|a, b| b.cmp(a));     // 降序
intervals.sort_by_key(|x| x[0]);   // 按第一个元素
arr.sort_by(|a, b| b[1].cmp(&a[1]).then(a[0].cmp(&b[0])));  // 多关键字
nums.sort_unstable();              // 更快，不保证相等元素顺序
```

比较器返回 `Ordering`：`a.cmp(&b)` 升序、`b.cmp(&a)` 降序——**用 `cmp` 而不用 `<`，不会写出 C++ 那种 `<=` UB**。

### 1.8 整数与位运算

```rust
n & 1; n >> 1; n & (n - 1); n & (-n); 1 << i;
n.count_ones()                     // 内置 popcount
```

`i32` 溢出在 debug 下 panic、release 下回绕。累加/乘法换 `i64`（LeetCode 的签名多是 i32，内部计算用 i64 再 `as i32` 转回）。

### 1.9 迭代器：Rust 的"推导式"

```rust
let squares: Vec<i32> = nums.iter().map(|x| x * x).collect();
let evens: Vec<&i32> = nums.iter().filter(|x| *x % 2 == 0).collect();
let sum: i32 = nums.iter().sum();
let max = nums.iter().max();              // Option<&i32>
nums.iter().any(|&x| x > 0); nums.iter().all(|&x| x > 0);
nums.windows(2)                  // 相邻对 [a, b]
nums.chunks(k)                   // 按块切
nums.iter().zip(other.iter())
```

迭代器是惰性且零成本的，放心链式写。

---

## 2. 标准库容器速查

### 2.1 Vec 兼任数组与栈

```rust
let mut st: Vec<i32> = Vec::new();
st.push(x); st.pop();            // pop 返回 Option<i32>
st.last()                        // 栈顶 Option<&i32>
```

**Rust 没有单独 stack 类型，Vec 就是栈**——单调栈直接 `Vec::new()`。

### 2.2 HashMap / HashSet

```rust
use std::collections::{HashMap, HashSet};

let mut cnt = HashMap::new();
*cnt.entry(x).or_insert(0) += 1;        // 计数惯用法（entry API）
cnt.get(&x).copied().unwrap_or(0);      // 查询
cnt.contains_key(&x);

let mut seen = HashSet::new();
seen.insert(x); seen.contains(&x); seen.remove(&x);
```

`entry().or_insert()` 是 HashMap 的精髓，一行完成"没有就插默认，再拿可变引用"。

有序需求用 `BTreeMap` / `BTreeSet`（O(log n)，有 `range(..)`）。

### 2.3 VecDeque（双端队列）

```rust
use std::collections::VecDeque;
let mut q = VecDeque::new();
q.push_back(x); q.push_front(x);
q.pop_front(); q.pop_back();     // 都返回 Option
q.front(); q.back();
```

BFS 标配 `pop_front()`。**别用 Vec 当队列**（`remove(0)` 是 O(n)）。

### 2.4 BinaryHeap（只有大根堆）

```rust
use std::collections::BinaryHeap;
use std::cmp::Reverse;

let mut h = BinaryHeap::new();
h.push(x); h.pop(); h.peek();    // 大根堆

let mut min_h = BinaryHeap::from([Reverse(x)]);   // 小根堆：包 Reverse
min_h.push(Reverse(5));
min_h.pop().map(|Reverse(v)| v);

h.push((priority, item));        // 元组按字典序比，大的在堆顶
```

和 Python 正好相反：**Rust 默认大根堆，小根堆用 `Reverse<T>`**。元组比较要求整个元组 Ord——item 不可比时就只放 `(priority, index)`。

### 2.5 常用 slice/Vec 方法

```rust
v.reverse();
v.dedup();                        // 去重（需有序，原地）
v.binary_search(&x)               // Result<usize, usize>：Ok=找到，Err=应插入位置
v.partition_point(|&p| p < x)     // 第一个不满足谓词的下标 = lower_bound
v.swap(i, j);                     // 交换两元素（反转/荷兰国旗题常用来绕借用）
v.split_at_mut(mid)               // 同时拿两段 &mut，绕借用冲突的正规手段
```

`partition_point` 就是 lower_bound，手写二分前先用它。

---

## 3. 树与链表：Rc<RefCell<T>> 生存指南

LeetCode 的 Rust 签名：

```rust
// 二叉树
pub fn max_depth(root: Option<Rc<RefCell<TreeNode>>>) -> i32
// 链表
pub fn reverse_list(head: Option<Box<ListNode>>) -> Option<Box<ListNode>>
```

### 3.1 链表：Box 还好说

`Option<Box<ListNode>>` 是独占所有权，反转、合并这些题写法和其他语言几乎一样：

```rust
pub fn reverse_list(head: Option<Box<ListNode>>) -> Option<Box<ListNode>> {
    let mut pre = None;
    let mut cur = head;
    while let Some(mut node) = cur {
        cur = node.next.take();     // take() 把 next 取出来，原位留 None
        node.next = pre;
        pre = Some(node);
    }
    pre
}
```

**核心技巧是 `.take()`**：`Option::take(&mut self)` 交出值、留下 None，完美解决"要移动字段但结构体还被借用"的冲突。链表题十之八九靠它。

dummy 节点：

```rust
let mut dummy = Box::new(ListNode::new(0));
let mut cur = &mut dummy;
// ... 循环里 cur = cur.next.as_mut().unwrap();
dummy.next
```

### 3.2 二叉树：Rc<RefCell> 的套路

```rust
use std::rc::Rc;
use std::cell::RefCell;

pub fn max_depth(root: Option<Rc<RefCell<TreeNode>>>) -> i32 {
    match root {
        None => 0,
        Some(node) => {
            let node = node.borrow();                     // 只读借用
            1 + max_depth(node.left.clone()).max(max_depth(node.right.clone()))
        }
    }
}
```

三个固定动作：

1. **`node.borrow()`**（只读）/ **`node.borrow_mut()`**（可改）——RefCell 的运行时借用检查，同一时刻只能一个 mut 或多个读。
2. **`node.left.clone()`**——clone 的是 `Rc`（引用计数 +1，O(1)，不是深拷贝），因为子树的所有权要和父节点共享。
3. 递归签名不变，一路 `Option<Rc<RefCell<TreeNode>>>` 传下去。

层序遍历：

```rust
let mut q = VecDeque::new();
if let Some(r) = root { q.push_back(r); }
while !q.is_empty() {
    for _ in 0..q.len() {                          // 先定层大小
        let node = q.pop_front().unwrap();
        let node = node.borrow();
        // level.push(node.val);
        if let Some(l) = node.left.clone() { q.push_back(l); }
        if let Some(r) = node.right.clone() { q.push_back(r); }
    }
}
```

**borrow 的作用域注意**：`node.borrow()` 的临时值如果在 `if let Some(x) = node.borrow_mut().left` 这种写法里会活到整个语句结束，容易 "already mutably borrowed" panic。安全写法是先把 `borrow_mut()` 绑定到变量、操作完再进下一步，或借用前先把需要的数据读出来。

### 3.3 什么时候认输换写法

Rust 刷链表/树的困难题（LRU、反转 k 组、二叉树 Morris）借用冲突会非常痛苦。实用主义策略：

- **下标模拟指针**：图/树的节点存 `Vec`，"指针"用 `usize` 下标——这是 Rust 竞赛社区的标配（邻接表本来就这么写）。
- 双向链表/LRU 用下标 + `Vec<Node>` 实现，别硬刚 `Rc<RefCell>`。

```rust
// 图邻接表：节点用下标
let mut adj = vec![vec![]; n];
for e in &edges { adj[e[0] as usize].push(e[1] as usize); }
```

---

## 4. 高频模板

### 4.1 哈希补数（两数之和）

```rust
let mut seen = HashMap::new();
for (i, &x) in nums.iter().enumerate() {
    if let Some(&j) = seen.get(&(target - x)) {
        return vec![j as i32, i as i32];
    }
    seen.insert(x, i);
}
vec![]
```

### 4.2 滑动窗口

```rust
let mut left = 0;
for right in 0..n {
    // 加入 nums[right]
    while /* 不合法 */ {
        // 移除 nums[left]
        left += 1;
    }
    // 更新答案
}
```

窗口状态用 `HashMap<u8, i32>` 或定长数组（字符集已知时 `[0; 26]` 更快）。

### 4.3 二分

```rust
let mut lo = 0;
let mut hi = nums.len();                    // 半开区间 [lo, hi)
while lo < hi {
    let mid = lo + (hi - lo) / 2;
    if nums[mid] >= target { hi = mid; } else { lo = mid + 1; }
}
// lo = lower_bound，等价于：
let lo = nums.partition_point(|&x| x < target);
```

### 4.4 前缀和

```rust
let mut pre = vec![0; n + 1];
for i in 0..n { pre[i + 1] = pre[i] + nums[i]; }
// 区间和 [l, r] = pre[r + 1] - pre[l]
```

和为 K 的子数组：

```rust
let mut cnt = HashMap::new();
cnt.insert(0, 1);
let (mut pre, mut ans) = (0i64, 0);
for &x in &nums {
    pre += x as i64;
    ans += cnt.get(&(pre - k as i64)).copied().unwrap_or(0);
    *cnt.entry(pre).or_insert(0) += 1;
}
```

### 4.5 回溯

```rust
fn dfs(start: usize, nums: &Vec<i32>, path: &mut Vec<i32>, ans: &mut Vec<Vec<i32>>) {
    ans.push(path.clone());              // 存答案要 clone
    for i in start..nums.len() {
        path.push(nums[i]);
        dfs(i + 1, nums, path, ans);
        path.pop();
    }
}
```

Rust 回溯天然没有 Python 的引用坑——`path.clone()` 是显式的，想忘都忘不了（类型不匹配直接编译错）。

### 4.6 网格 DFS

```rust
fn dfs(grid: &mut Vec<Vec<char>>, i: usize, j: usize) {
    if i >= grid.len() || j >= grid[0].len() || grid[i][j] != '1' { return; }
    grid[i][j] = '0';
    let dirs = [(1isize, 0isize), (-1, 0), (0, 1), (0, -1)];
    for (di, dj) in dirs {
        let (ni, nj) = (i as isize + di, j as isize + dj);
        if ni >= 0 && nj >= 0 {
            dfs(grid, ni as usize, nj as usize);
        }
    }
}
```

**usize 没有负数**——`i - 1` 在 i=0 时下溢 panic。要么先判界，要么转 isize 算完再转回。递归深度大时 Rust 默认栈 8MB，岛屿这种深度没问题。

### 4.7 Trie

```rust
#[derive(Default)]
struct TrieNode {
    children: [Option<Box<TrieNode>>; 26],   // 定长数组版本
    is_end: bool,
}
// 字符集不固定：children: HashMap<u8, TrieNode>
```

定长数组初始化：`[(); 26].map(|_| None)`（`None` 不是 Copy，不能 `vec![None; 26]` 那套直接写，用 `Default::default()` 或 `std::array::from_fn`）。

---

## 5. 单调栈

**什么时候用**：每个元素左/右第一个比它大/小。口诀：当前元素能解决谁，就弹谁。

```rust
// 每日温度：右边第一个更大
pub fn daily_temperatures(t: Vec<i32>) -> Vec<i32> {
    let n = t.len();
    let mut ans = vec![0; n];
    let mut st: Vec<usize> = Vec::new();       // Vec 当栈，存下标，值递减
    for i in 0..n {
        while let Some(&top) = st.last() {
            if t[i] <= t[top] { break; }
            let idx = st.pop().unwrap();
            ans[idx] = (i - idx) as i32;
        }
        st.push(i);
    }
    ans
}

// 柱状图最大矩形
pub fn largest_rectangle_area(mut heights: Vec<i32>) -> i32 {
    heights.push(0);                            // 哨兵
    let mut st: Vec<usize> = Vec::new();
    let mut ans = 0i64;
    for i in 0..heights.len() {
        while let Some(&top) = st.last() {
            if heights[i] >= heights[top] { break; }
            let h = heights[st.pop().unwrap()] as i64;
            let left = st.last().map(|&x| x as i64).unwrap_or(-1);
            ans = ans.max(h * (i as i64 - left - 1));
        }
        st.push(i);
    }
    ans as i32
}
```

`while let Some(&top) = st.last()` + 内部 `break`/`pop` 是单调栈在 Rust 下的标准形态（借用规则不允许在 while 条件里直接 pop）。

## 6. 单调队列

```rust
use std::collections::VecDeque;

pub fn max_sliding_window(nums: Vec<i32>, k: i32) -> Vec<i32> {
    let k = k as usize;
    let mut dq: VecDeque<usize> = VecDeque::new();
    let mut ans = Vec::new();
    for i in 0..nums.len() {
        while dq.front().map_or(false, |&f| f + k <= i) { dq.pop_front(); } // 1. 过期
        while dq.back().map_or(false, |&b| nums[b] <= nums[i]) { dq.pop_back(); } // 2. 弹尾
        dq.push_back(i);                                                  // 3. 入队
        if i + 1 >= k { ans.push(nums[*dq.front().unwrap()]); }           // 4. 记录
    }
    ans
}
```

四步顺序：过期 → 弹尾 → 入队 → 记录。`map_or(false, ...)` 处理空队列，比 `if let` 链简洁。

## 7. 并查集

```rust
struct DSU {
    parent: Vec<usize>,
    sz: Vec<usize>,
}

impl DSU {
    fn new(n: usize) -> Self {
        DSU { parent: (0..n).collect(), sz: vec![1; n] }
    }
    fn find(&mut self, x: usize) -> usize {
        if self.parent[x] != x {
            self.parent[x] = self.find(self.parent[x]);   // 路径压缩
        }
        self.parent[x]
    }
    fn union(&mut self, a: usize, b: usize) -> bool {
        let (mut ra, mut rb) = (self.find(a), self.find(b));
        if ra == rb { return false; }
        if self.sz[ra] < self.sz[rb] { std::mem::swap(&mut ra, &mut rb); }
        self.parent[rb] = ra;
        self.sz[ra] += self.sz[rb];
        true
    }
}
```

```rust
// 岛屿数量：陆地 +1，合并成功 −1
pub fn num_islands(grid: Vec<Vec<char>>) -> i32 {
    let (m, n) = (grid.len(), grid[0].len());
    let mut dsu = DSU::new(m * n);
    let mut cnt = 0;
    for i in 0..m {
        for j in 0..n {
            if grid[i][j] != '1' { continue; }
            cnt += 1;
            let id = i * n + j;
            if i > 0 && grid[i-1][j] == '1' && dsu.union(id, id - n) { cnt -= 1; }
            if j > 0 && grid[i][j-1] == '1' && dsu.union(id, id - 1) { cnt -= 1; }
        }
    }
    cnt
}
```

`find(&mut self)` 意味着并查集必须 `let mut dsu`——路径压缩是写操作。Rust 的所有权在这里反而帮你标清了哪些操作会改结构。

---

## 8. 推荐刷题顺序

先数组/哈希/字符串找回语法手感，再上树和链表（Rc<RefCell> 主战场）：

1. **哈希**：两数之和 → 字母异位词分组 → 最长连续序列
2. **双指针**：移动零 → 盛最多水的容器 → 三数之和
3. **滑动窗口**：无重复字符最长子串 → 找到所有字母异位词
4. **子串**：和为 K 的子数组 → 滑动窗口最大值
5. **数组/矩阵**：最大子数组和 → 合并区间 → 旋转图像
6. **链表**（练 take/dummy）：反转 → 环形 → 合并有序链表
7. **二叉树**（练 Rc<RefCell>）：最大深度 → 翻转 → 层序遍历
8. **图/回溯**：岛屿数量 → 全排列 → 子集
9. **栈/堆**：有效括号 → 每日温度 → 数组中第 K 大
10. **贪心/DP**：买卖股票 → 爬楼梯 → 零钱兑换
11. **位运算/技巧**：只出现一次的数字 → 多数元素

专项：每日温度 → 柱状图最大矩形 → 滑动窗口最大值 → 岛屿数量 → 冗余连接。

---

## 9. 避坑清单（按翻车频率排序）

1. **遍历中修改同一容器** → 借用冲突。改下标循环、先收集后改、或 `split_at_mut`。
2. **链表忘了 `.take()`** → "cannot move out of borrowed content"。
3. **`borrow_mut` 生命周期过长** → 运行时 "already borrowed" panic。借用绑定到变量、用完立即结束作用域。
4. **`usize` 下溢**：`i - 1` 在 0 处 panic。先判界或转 isize。
5. **递归 clone 子树忘了 Rc 语义**：`node.left.clone()` 是 O(1) 的引用计数，放心用；但没有它所有权过不去。
6. **`BinaryHeap` 默认大根堆**，要小根堆包 `Reverse`。
7. **元组堆里 item 不可比** → 只放 `(priority, index)`。
8. **字符串按下标** → 编译错。先 `.as_bytes()` 或 `.chars().collect()`。
9. **`sort_by` 里写 `a.partial_cmp(b)`**：f64 没有 Ord，整数用 `cmp`。
10. **i32 溢出**：累加换 i64，返回前 `as i32`。
11. **`vec![None; n]` 编译错**（Option<Box<T>> 不是 Copy），用 `vec![(); n].map(|_| None)` 或 `Default::default()`。
12. **`map.get(&x)` 返回 `Option<&V>`**——数字要 `.copied()` 才能脱离借用。

---

## 10. 学习节奏建议

- **第 1~2 天**：只过第 1、2 节 + 4.1/4.2，在简单题上找回 HashMap entry API、Vec 当栈、sort_by 的手感。
- **第 1 周**：数组/字符串类刷完，刻意用迭代器改写一遍命令式循环，体会零成本抽象。
- **第 2 周**：集中攻克链表与二叉树——这是 Rust 刷题的真正分水岭，把 `take()`、`borrow()`、`clone()` 三件套练成条件反射。
- **第 3 周起**：三个专项 + DP/贪心。写不出来的题先想"能不能用下标代替指针"。
- 心态：和编译器搏斗是学费。每解决一个借用冲突，你对所有权的理解就深一层——**这才是用 Rust 刷题的真正收益**。

---

## 附：四语言刷题工具对照

| 用途 | C++ | Python | Rust | Go |
|---|---|---|---|---|
| 动态数组 | `vector` | `list` | `Vec` | `slice` |
| 栈 | `stack` | `list` | `Vec` | `slice` |
| 队列 | `deque` | `deque` | `VecDeque` | `slice` 切片模拟 |
| 哈希表 | `unordered_map` | `dict` | `HashMap` | `map` |
| 计数 | map 手动 | `Counter` | `entry().or_insert(0)` | `m[k]++` |
| 堆 | `priority_queue`（大根） | `heapq`（小根） | `BinaryHeap`（大根） | `container/heap`（接口） |
| 二分 | `lower_bound` | `bisect_left` | `partition_point` | `sort.Search` |
| 去重 | `unique`+`erase` | `set` | `dedup`（需有序） | 手动 |
| 链表指针 | 原生指针 | 引用 | `Option<Box<T>>` + `take()` | 指针，GC 兜底 |
| 树节点 | 原生指针 | 引用 | `Option<Rc<RefCell<T>>>` | 指针，GC 兜底 |
| 溢出 | 小心 | 不存在 | debug panic | 回绕，需自查 |
