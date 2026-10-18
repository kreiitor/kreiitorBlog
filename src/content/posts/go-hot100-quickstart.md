---
title: "Go 刷 Hot100 速拾手册"
description: "用 Go 刷题的最小工作集：slice 三件套、map 零值、heap 接口模板、链表/树的 GC 舒适度，以及单调栈/单调队列/并查集专项与避坑清单。"
pubDate: 2026-10-14
tags:
  - "算法"
  - "学习笔记"
  - "Go"
category: knowledge
cover: /covers/post-code-go.svg
featured: true
---


> 定位：Go 语法学过但手生，目标是找回「刷题所需的最小工作集」。
> 好消息：**Go 是四门语言里最接近"刷题舒适区"的**——语法简单、slice 灵活、指针 + GC 让链表/树题写法和 C++ 一样直观，还没有所有权负担。短板主要有两个：标准库没有现成的 deque，也没有泛型 heap（`container/heap` 需要实现接口），需要几行代码自己补。
> 用法：第 1～2 节当字典查，第 3 节模板默写，第 4～6 节专项，最后刷题顺序与避坑清单。

---

## 1. 最小必要语法

### 1.1 提交形态

```go
func twoSum(nums []int, target int) []int {
    // ...
}
```

LeetCode 上是裸函数/方法，不需要 main。本地调试：

```go
package main

import "fmt"

func main() {
    fmt.Println(twoSum([]int{2, 7, 11, 15}, 9))
}
```

### 1.2 slice：刷题的核心类型

```go
n := len(nums)
m, n := len(grid), len(grid[0])

nums[i]                    // 下标
nums[1:3]                  // 切片 [1,3)，与原数组共享底层
append(nums, x)            // 追加，可能重新分配——必须接回返回值！
nums[:k]; nums[k:]         // 切两半
```

**`append` 必须写 `nums = append(nums, x)`**——容量不够时它返回新 slice，丢弃返回值就丢了数据。这是 Go 第一坑。

**slice 共享底层数组**：传参、切片都不拷贝。函数里改 `nums[i]` 调用方可见（这点像 Python list、不像 C++ 值传递的 vector）。要独立副本：

```go
cp := make([]int, len(nums))
copy(cp, nums)
// 或简写：cp := append([]int(nil), nums...)
```

二维初始化：

```go
dp := make([][]int, m)
for i := range dp {
    dp[i] = make([]int, n)     // 每行独立 make，和 Python 的坑同理但写法正好相反
}
```

### 1.3 遍历

```go
for i, x := range nums {}       // 下标 + 值
for _, x := range nums {}       // 只要值
for i := 0; i < n; i++ {}       // 传统下标（需要修改或控制步进时用）
for k, v := range mp {}         // map 遍历
```

`range` 给出的是**值的拷贝**：`for _, x := range nums { x = 0 }` 改不了原数组，要写 `nums[i] = 0`。

### 1.4 常用内置与数学

```go
len(x); append(s, v); copy(dst, src); make([]int, n)
delete(mp, key)
max(a, b); min(a, b)           // Go 1.21+ 内置！之前要自己写
```

```go
import "math"
math.MaxInt32; math.MinInt32
// int 在 64 位平台是 64 位——LeetCode 环境就是，基本不用担心溢出
```

位运算：

```go
n & 1; n >> 1; n & (n - 1); n & (-n); 1 << i
bits.OnesCount(uint(n))        // math/bits，popcount
```

### 1.5 字符串与 byte/rune

```go
len(s)                         // 字节数，不是字符数！
s[i]                           // byte（uint8）
b := []byte(s)                 // 转字节切片——算法题标准开场
b[i] = 'x'                     // 字节可改
string(b)                      // 转回
'0' + byte(d); c - '0'         // 字符 ↔ 数字
strings.Join(parts, ""); strings.Split(s, ",")
```

惯例同 Rust：**字符串先转 `[]byte` 处理，返回前 `string(b)`**。要 Unicode 字符用 `[]rune(s)`。

### 1.6 排序

```go
import "sort"

sort.Ints(nums)                          // 升序
sort.Sort(sort.Reverse(sort.IntSlice(nums)))   // 降序（啰嗦，记住即可）
sort.Slice(intervals, func(i, j int) bool {    // 自定义：返回"i 该排 j 前"
    return intervals[i][0] < intervals[j][0]
})
sort.SearchInts(nums, x)                 // 第一个 >= x 的下标（lower_bound）
sort.Search(n, func(i int) bool { return nums[i] >= x })   // 通用形式
```

Go 1.21+ 可用 `slices.Sort(nums)`、`slices.SortFunc`、`slices.BinarySearch`，比 sort 包顺手，LeetCode 环境支持。

### 1.7 多返回值与错误处理

刷题里基本只用多返回值的便利：

```go
a, b = b, a                    // 交换不用临时变量
```

`_` 丢弃不需要的值。`if err != nil` 在刷题里几乎用不到。

---

## 2. 容器速查（含两个要自己补的）

### 2.1 map / set

```go
cnt := make(map[int]int)
cnt[x]++                       // 不存在的 key 自动是零值——Go 的天然 defaultdict
v, ok := mp[key]               // comma-ok：ok 判断存在性
if _, ok := mp[key]; ok {}

// set：map[T]bool 或 map[T]struct{}（后者零内存，地道写法）
seen := make(map[int]struct{})
seen[x] = struct{}{}
if _, ok := seen[x]; ok {}
```

**`mp[key]` 不存在时返回零值且不报错**——对计数是福利，但"不存在"与"值就是 0"分不清时用 comma-ok。

### 2.2 slice 当栈

```go
st := []int{}
st = append(st, x)             // push
top := st[len(st)-1]           // 栈顶
st = st[:len(st)-1]            // pop
len(st) == 0                   // 判空
```

单调栈直接用 `[]int`，无需任何 import。

### 2.3 slice 模拟 deque

标准库没有 deque（`container/list` 是双向链表，接口啰嗦、性能差，**刷题别用**）。惯例写法：

```go
type Deque struct{ q []int }

func (d *Deque) PushBack(v int)  { d.q = append(d.q, v) }
func (d *Deque) PopFront() int   { v := d.q[0]; d.q = d.q[1:]; return v }
func (d *Deque) PopBack() int    { v := d.q[len(d.q)-1]; d.q = d.q[:len(d.q)-1]; return v }
func (d *Deque) Front() int      { return d.q[0] }
func (d *Deque) Back() int       { return d.q[len(d.q)-1] }
func (d *Deque) Len() int        { return len(d.q) }
```

`PopFront` 用 `q = q[1:]` 是 O(1)（只移动头指针），底层数组不再回收头部空间——刷题数据量下完全无所谓。

**BFS 也可以不用 deque**：`for len(q) > 0 { cur := q[0]; q = q[1:]; ... }`，一行搞定。

### 2.4 heap：实现接口，比想象简单

```go
import "container/heap"

// 小根堆（换成 > 就是大根堆）
type IntHeap []int
func (h IntHeap) Len() int            { return len(h) }
func (h IntHeap) Less(i, j int) bool  { return h[i] < h[j] }
func (h IntHeap) Swap(i, j int)       { h[i], h[j] = h[j], h[i] }
func (h *IntHeap) Push(x any)         { *h = append(*h, x.(int)) }
func (h *IntHeap) Pop() any {
    old := *h
    v := old[len(old)-1]
    *h = old[:len(old)-1]
    return v
}

// 用法
h := &IntHeap{}
heap.Init(h)
heap.Push(h, x)
heap.Pop(h).(int)
(*h)[0]                              // 堆顶
```

五个方法是固定模板，**背下来**（这是 Go 刷题唯一需要"背"的样板）。`Push`/`Pop` 操作的是指针接收者，因为 slice 头会变。

数据流中位数：一个大根堆 + 一个小根堆，各实现一遍（或用一个泛型封装）。

### 2.5 常用 sort/slices 补充

```go
slices.Reverse(nums)               // Go 1.21+
// 手写反转：
for i, j := 0, len(nums)-1; i < j; i, j = i+1, j-1 { nums[i], nums[j] = nums[j], nums[i] }
```

---

## 3. 高频模板

### 3.1 哈希补数（两数之和）

```go
seen := make(map[int]int)
for i, x := range nums {
    if j, ok := seen[target-x]; ok {
        return []int{j, i}
    }
    seen[x] = i
}
```

### 3.2 滑动窗口

```go
left := 0
for right := 0; right < n; right++ {
    // 加入 nums[right]
    for 不合法 {                    // Go 没有 while，for 单条件就是 while
        // 移除 nums[left]
        left++
    }
    // 更新答案
}
```

窗口状态：字符集已知用 `[128]int` 数组（最快），通用用 `map[byte]int`。

### 3.3 二分

```go
lo, hi := 0, len(nums)-1
for lo <= hi {
    mid := lo + (hi-lo)/2
    if nums[mid] == target { return mid }
    if nums[mid] < target { lo = mid + 1 } else { hi = mid - 1 }
}
// lower_bound 直接用：
i := sort.SearchInts(nums, x)
```

### 3.4 前缀和 + 哈希

```go
cnt := map[int]int{0: 1}               // 空前缀
pre, ans := 0, 0
for _, x := range nums {
    pre += x
    ans += cnt[pre-k]                  // 不存在自动 0
    cnt[pre]++
}
```

### 3.5 回溯

```go
var ans [][]int
var dfs func(start int, path []int)
dfs = func(start int, path []int) {
    ans = append(ans, append([]int(nil), path...))   // 拷贝！
    for i := start; i < len(nums); i++ {
        path = append(path, nums[i])
        dfs(i + 1, path)
        path = path[:len(path)-1]
    }
}
dfs(0, []int{})
```

两个 Go 特色注意点：

1. **存答案必须拷贝**（`append([]int(nil), path...)`）——slice 共享底层数组，不拷就是 Python 同款坑。
2. 递归闭包要先 `var dfs func(...)` 再赋值（声明与定义分开才能自引用）。也可以写成顶层函数、状态走参数/全局。

### 3.6 网格 DFS / BFS

```go
dirs := [][2]int{{1, 0}, {-1, 0}, {0, 1}, {0, -1}}

var dfs func(i, j int)
dfs = func(i, j int) {
    if i < 0 || i >= m || j < 0 || j >= n || grid[i][j] != '1' { return }
    grid[i][j] = '0'
    for _, d := range dirs { dfs(i+d[0], j+d[1]) }
}

// BFS：slice 当队列
q := [][2]int{{si, sj}}
for len(q) > 0 {
    sz := len(q)                       // 先定层大小
    for ; sz > 0; sz-- {
        cur := q[0]; q = q[1:]
        for _, d := range dirs {
            ni, nj := cur[0]+d[0], cur[1]+d[1]
            // 检查 → 标记 → q = append(q, [2]int{ni, nj})
        }
    }
}
```

Go 递归深度默认栈会自动增长（goroutine 栈动态扩容），网格 DFS 不用担心爆栈——比 Python 省心。

### 3.7 链表（指针 + GC，最舒服的一档）

```go
// dummy
dummy := &ListNode{}
cur := dummy
// ... return dummy.Next

// 反转
var pre *ListNode
for cur != nil {
    nxt := cur.Next
    cur.Next = pre
    pre = cur
    cur = nxt
}
// return pre
```

和 C++ 写法一模一样，但没有内存管理负担（GC 兜底），也没有 Rust 的所有权冲突。**链表/树题是 Go 的主场。**

### 3.8 二叉树

```go
func maxDepth(root *TreeNode) int {
    if root == nil { return 0 }
    return 1 + max(maxDepth(root.Left), maxDepth(root.Right))
}
```

层序遍历用 3.6 的 `sz := len(q)` 模式。

### 3.9 Trie

```go
type TrieNode struct {
    children [26]*TrieNode      // 定长数组，零值可直接用
    isEnd    bool
}
// 字符集不固定：children map[byte]*TrieNode
```

Go 零值哲学：`&TrieNode{}` 开箱即用，不需要构造函数。

---

## 4. 单调栈

**什么时候用**：每个元素左/右第一个比它大/小。口诀：当前元素能解决谁，就弹谁。

```go
// 每日温度：右边第一个更大
func dailyTemperatures(t []int) []int {
    ans := make([]int, len(t))
    st := []int{}                        // 存下标，值递减
    for i := range t {
        for len(st) > 0 && t[i] > t[st[len(st)-1]] {
            idx := st[len(st)-1]
            st = st[:len(st)-1]
            ans[idx] = i - idx
        }
        st = append(st, i)
    }
    return ans
}

// 柱状图最大矩形
func largestRectangleArea(heights []int) int {
    heights = append(heights, 0)         // 哨兵（append 可能改原 slice 容量，注意）
    st := []int{}
    ans := 0
    for i := range heights {
        for len(st) > 0 && heights[i] < heights[st[len(st)-1]] {
            h := heights[st[len(st)-1]]
            st = st[:len(st)-1]
            left := -1
            if len(st) > 0 { left = st[len(st)-1] }
            ans = max(ans, h*(i-left-1))
        }
        st = append(st, i)
    }
    return ans
}
```

栈顶下标 `st[len(st)-1]` 出现频率极高，手生期可以定义个小函数或就习惯它。

## 5. 单调队列

```go
func maxSlidingWindow(nums []int, k int) []int {
    dq := []int{}                        // 存下标，值从队首到队尾递减
    ans := []int{}
    for i, x := range nums {
        for len(dq) > 0 && dq[0] <= i-k { dq = dq[1:] }          // 1. 过期
        for len(dq) > 0 && nums[dq[len(dq)-1]] <= x {            // 2. 弹尾
            dq = dq[:len(dq)-1]
        }
        dq = append(dq, i)                                       // 3. 入队
        if i >= k-1 { ans = append(ans, nums[dq[0]]) }           // 4. 记录
    }
    return ans
}
```

四步顺序：过期 → 弹尾 → 入队 → 记录。slice 模拟 deque 的两端操作都是 O(1) 摊销，刷题完全够用。

## 6. 并查集

```go
type DSU struct {
    parent, sz []int
}

func NewDSU(n int) *DSU {
    p := make([]int, n)
    for i := range p { p[i] = i }
    return &DSU{p, make([]int, n)}     // sz 初始为 0？不——见下
}

// 修正版：sz 要初始化为 1
func NewDSU(n int) *DSU {
    p, sz := make([]int, n), make([]int, n)
    for i := range p { p[i] = i; sz[i] = 1 }
    return &DSU{p, sz}
}

func (d *DSU) Find(x int) int {
    if d.parent[x] != x {
        d.parent[x] = d.Find(d.parent[x])    // 路径压缩
    }
    return d.parent[x]
}

func (d *DSU) Union(a, b int) bool {
    ra, rb := d.Find(a), d.Find(b)
    if ra == rb { return false }
    if d.sz[ra] < d.sz[rb] { ra, rb = rb, ra }
    d.parent[rb] = ra
    d.sz[ra] += d.sz[rb]
    return true
}
```

```go
// 岛屿数量：陆地 +1，合并成功 −1
func numIslands(grid [][]byte) int {
    m, n := len(grid), len(grid[0])
    dsu := NewDSU(m * n)
    cnt := 0
    for i := 0; i < m; i++ {
        for j := 0; j < n; j++ {
            if grid[i][j] != '1' { continue }
            cnt++
            id := i*n + j
            if i > 0 && grid[i-1][j] == '1' && dsu.Union(id, id-n) { cnt-- }
            if j > 0 && grid[i][j-1] == '1' && dsu.Union(id, id-1) { cnt-- }
        }
    }
    return cnt
}
```

易错：slice 用 `make` 初始化时**所有元素是零值**——`sz` 要显式置 1（上面错误示范是真实翻车场景，特意保留说明）。

## 7. 推荐刷题顺序

1. **哈希**：两数之和 → 字母异位词分组 → 最长连续序列
2. **双指针**：移动零 → 盛最多水的容器 → 三数之和
3. **滑动窗口**：无重复字符最长子串 → 找到所有字母异位词
4. **子串**：和为 K 的子数组 → 滑动窗口最大值
5. **数组/矩阵**：最大子数组和 → 合并区间 → 旋转图像
6. **链表**（Go 主场，最舒服）：反转 → 环形 → 合并有序链表 → LRU
7. **二叉树**：最大深度 → 层序遍历 → 最近公共祖先
8. **图/回溯**：岛屿数量 → 课程表 → 全排列
9. **栈/堆**：有效括号 → 每日温度 → 数组中第 K 大（练 heap 接口）
10. **贪心/DP**：买卖股票 → 跳跃游戏 → 爬楼梯 → 零钱兑换
11. **位运算/技巧**：只出现一次的数字 → 多数元素

专项：每日温度 → 柱状图最大矩形 → 滑动窗口最大值 → 岛屿数量 → 冗余连接。

## 8. 避坑清单（按翻车频率排序）

1. **`append` 没接返回值**：`append(s, x)` 单写一行 = 白写。
2. **slice 共享底层数组**：存回溯答案、传参给下一层，需要独立副本时 `append([]int(nil), s...)`。
3. **哨兵 append 改原 slice**：`heights = append(heights, 0)` 在底层容量够时会原地写入——不影响逻辑但要知道它可能改了调用方的底层数组。
4. **递归闭包**：`var dfs func(...)` 先声明再赋值，否则函数体内引用不到自己。
5. **`for _, x := range` 改 x 无效**——x 是拷贝，改原数组用下标。
6. **map 遍历时增删 key**：Go 允许但结果未定义顺序；计数题别在 range 里 delete（可以收集完再删）。
7. **零值 slice 初始化**：`make([]int, n)` 全是 0，需要 1（如 DSU 的 sz）要显式循环。
8. **堆接口的 Push/Pop 是指针接收者**：`func (h *IntHeap)`，写错编译直接报。
9. **`sort.Slice` 的比较语义是"i 排 j 前"**，和 C++ 一致、与堆相反；别混。
10. **`len(s)` 是字节数**：含中文的题先想想要 `[]rune`。
11. **Go 1.21 之前没有内置 max/min**——旧环境自己写两个函数。
12. **goroutine 不要带进刷题**：LeetCode 判题按函数调用，并发只会添乱。

## 9. 学习节奏建议

- **第 1~2 天**：第 1、2 节过一遍，重点：slice 三件套（append/copy/共享底层）、map 零值、把 IntHeap 模板抄一遍。
- **第 1 周**：哈希到链表，体会 Go 在链表/树题上的舒适度（这是选 Go 刷题的最大理由）。
- **第 2 周**：树、图、回溯 + 三个专项。回溯的拷贝坑踩过一次就记住了。
- **第 3 周起**：贪心、DP 收尾，二刷错题。
- Go 的加分项：刷题样板（heap 接口、DSU、deque）稳定后整理成自己的 snippet 文件，之后每题开箱即用。

---

## 附：四语言刷题工具对照

| 用途 | C++ | Python | Rust | Go |
|---|---|---|---|---|
| 动态数组 | `vector` | `list` | `Vec` | `slice` |
| 栈 | `stack` | `list` | `Vec` | `slice` |
| 队列/deque | `deque` | `deque` | `VecDeque` | slice 模拟 |
| 哈希表 | `unordered_map` | `dict` | `HashMap` | `map`（零值友好） |
| 计数 | map 手动 | `Counter` | `entry().or_insert(0)` | `m[k]++` |
| 堆 | `priority_queue`（大根） | `heapq`（小根） | `BinaryHeap`（大根） | `heap.Interface`（自定义） |
| 二分 | `lower_bound` | `bisect_left` | `partition_point` | `sort.Search` |
| 链表/树 | 原生指针 | 引用 | `Rc<RefCell>` 痛苦 | 指针 + GC，最舒服 |
| 溢出 | 小心 | 不存在 | debug panic | int=64 位，基本放心 |
| 递归深度 | 放心 | 要调 limit | 放心 | 栈自动增长，放心 |
