---
title: "Go 刷 Hot100 速拾手册"
description: "用 Go 刷题的最小工作集：slice 三件套、map 零值、heap 接口模板、链表/树的 GC 舒适度，以及单调栈/单调队列/并查集专项与避坑清单。"
pubDate: 2026-10-14
updatedDate: 2026-10-26
tags:
  - "算法"
  - "学习笔记"
  - "Go"
category: knowledge
cover: /covers/post-code-go.svg
featured: true
---

这份手册给两类人：

- 没写过 Go，但要用 Go 刷题；
- 学过 Go 语法，但手生。

没写过 Go 的，先看第 0 节。它只讲刷题够用的部分，目标是让你看懂后面的模板，而不是系统学完 Go。写过 Go 的，可以直接从第 1 节开始。

## 0. 零基础 Go 速成

### 0.1 一个 Go 程序长什么样

本地文件：

```go
package main

import "fmt"

func main() {
    fmt.Println("hello")
}
```

运行：

```bash
go run main.go
```

`package main` 和 `func main()` 是可执行程序的入口。LeetCode 不需要你写这两样，它只要求你实现题目给的函数：

```go
func twoSum(nums []int, target int) []int {
    // ...
}
```

如果要用标准库，在文件顶部加 `import`。LeetCode 的 Go 环境会处理包声明，你按题目模板补函数即可。

### 0.2 变量、常量和类型

```go
var a int          // 声明，零值是 0
var b = 10         // 类型推断为 int
c := 20            // 短声明，只能在函数内用
const MOD = 1_000_000_007
```

常见类型：

| 类型 | 用途 |
| --- | --- |
| `int` | 默认整数。LeetCode 的 64 位环境里是 64 位 |
| `int64` | 需要明确 64 位时用 |
| `float64` | 浮点数 |
| `bool` | `true` / `false` |
| `string` | 字符串，不可变 |
| `byte` | `uint8` 的别名，处理 ASCII/字节 |
| `rune` | `int32` 的别名，表示一个 Unicode 字符 |

零值不是“未初始化”的随机值：

```go
var i int       // 0
var s string    // ""
var b bool      // false
var p *ListNode // nil
var xs []int    // nil slice，len(xs) == 0，可以直接 append
```

类型转换必须显式写：

```go
x := 3
y := int64(x)
z := byte('a')
s := string([]byte{65, 66}) // "AB"
```

Go 编译器会报“声明了但没使用”的变量和 import。刷题时用 `_` 丢弃不需要的返回值。

### 0.3 条件与循环

`if` 不写括号，但花括号必须有：

```go
if x > 0 {
    // ...
} else if x == 0 {
    // ...
} else {
    // ...
}
```

Go 没有 `while`，用只有条件的 `for`：

```go
for i := 0; i < n; i++ {
    // 三段式
}

for i < n {
    // 相当于 while
}

for {
    // 死循环，里面自己 break
}
```

`switch` 默认不穿透，不需要 `break`：

```go
switch x {
case 1:
    // ...
case 2, 3:
    // ...
default:
    // ...
}
```

### 0.4 函数与多返回值

```go
func add(a, b int) int {
    return a + b
}

func div(a, b int) (int, bool) {
    if b == 0 {
        return 0, false
    }
    return a / b, true
}

q, ok := div(10, 2)
_, _ = q, ok
```

函数是一等值，可以赋给变量，也可以写闭包：

```go
add := func(a, b int) int { return a + b }
fmt.Println(add(1, 2))
```

递归闭包要先声明再赋值，否则函数体里引用不到自己：

```go
var dfs func(int)
dfs = func(x int) {
    if x == 0 {
        return
    }
    dfs(x - 1)
}
dfs(5)
```

### 0.5 数组与 slice

数组长度是类型的一部分，很少在刷题里直接用：

```go
var a [3]int       // 长度固定，零值 [0 0 0]
b := [3]int{1, 2, 3}
```

刷题几乎都用 slice：

```go
xs := []int{1, 2, 3}      // 字面量
ys := make([]int, n)      // 长度 n，全部零值
zs := make([]int, 0, n)   // 长度 0，容量 n
```

基本操作：

```go
len(xs)
cap(xs)
xs[i]
xs[1:3]          // [1,3)，左闭右开
append(xs, 4)    // 必须接返回值
copy(dst, src)   // 返回拷贝的元素个数
```

`append` 可能重新分配底层数组，所以必须写：

```go
xs = append(xs, 4)
```

只写 `append(xs, 4)` 不会改变 `xs`，这是 Go 新手最常见的错误。

slice 是“指针 + 长度 + 容量”，切片和传参都共享底层数组：

```go
a := []int{1, 2, 3}
b := a[1:]
b[0] = 99
// a 现在是 [1 99 3]
```

需要独立副本时：

```go
cp := make([]int, len(a))
copy(cp, a)
// 或 cp := append([]int(nil), a...)
```

二维 slice 要逐行初始化：

```go
dp := make([][]int, m)
for i := range dp {
    dp[i] = make([]int, n)
}
```

### 0.6 map

```go
cnt := make(map[int]int)
cnt[1]++                 // 不存在的 key 从零值开始
cnt[2] = 10
delete(cnt, 2)

v, ok := cnt[1]          // comma-ok：ok 表示 key 是否存在
if _, ok := cnt[3]; !ok {
    // 3 不存在
}
```

`cnt[x]` 读不存在的 key 会返回零值，不会报错。计数题可以直接 `cnt[x]++`；需要区分“不存在”和“值就是零”时用 comma-ok。

map 的遍历顺序是随机的，不要依赖顺序：

```go
for k, v := range cnt {
    _, _ = k, v
}
```

用 map 当 set：

```go
seen := make(map[int]struct{})
seen[x] = struct{}{}
if _, ok := seen[x]; ok {
    // 已存在
}
```

### 0.7 struct、指针和方法

LeetCode 的链表和树节点通常已经定义好：

```go
type ListNode struct {
    Val  int
    Next *ListNode
}

type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}
```

创建节点：

```go
p := &ListNode{Val: 1}
q := new(ListNode)      // 等价于 &ListNode{}
```

`nil` 指针不能解引用，访问 `p.Next` 前要判断 `p != nil`。

方法可以定义在值或指针上：

```go
func (p *ListNode) Len() int {
    n := 0
    for p != nil {
        n++
        p = p.Next
    }
    return n
}
```

刷题时链表题通常用指针接收者，因为要修改节点指针。树题的值接收者/指针接收者都可以，按需选择。

### 0.8 接口与 any

`any` 是 `interface{}` 的别名，表示任意类型：

```go
var x any = 3
n, ok := x.(int)   // 类型断言，ok 表示断言是否成功
```

标准库的 `sort.Interface` 和 `container/heap` 的 `heap.Interface` 都是接口。你实现这些方法，标准库就能操作你的类型：

```go
type IntHeap []int

func (h IntHeap) Len() int           { return len(h) }
func (h IntHeap) Less(i, j int) bool { return h[i] < h[j] }
func (h IntHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }
func (h *IntHeap) Push(x any)        { *h = append(*h, x.(int)) }
func (h *IntHeap) Pop() any {
    old := *h
    v := old[len(old)-1]
    *h = old[:len(old)-1]
    return v
}
```

刷题不需要自己设计复杂接口，但堆和排序会用到这套写法。

### 0.9 字符串、byte 和 rune

Go 的字符串是 UTF-8 字节序列，不是字符数组：

```go
s := "abc"
len(s)        // 字节数
s[0]          // byte，不是 rune
[]byte(s)     // 转成字节 slice，可修改
[]rune(s)     // 转成 Unicode 字符 slice
string(b)     // 字节 slice 转回字符串
string(rs)    // rune slice 转回字符串
```

遍历字符串：

```go
for i, r := range s {
    // i 是字节下标，r 是 rune
    _, _ = i, r
}
```

如果题目只含 ASCII，用 `[]byte(s)` 最方便：

```go
b := []byte(s)
b[0] = 'x'
s = string(b)
```

字符和数字互转：

```go
c := '7'
d := int(c - '0')   // 7
ch := byte('0' + d) // '7'
```

常用字符串函数：

```go
import "strings"

strings.Split(s, ",")
strings.Join(parts, "")
strings.Contains(s, "abc")
strings.HasPrefix(s, "ab")
strings.ToLower(s)
```

### 0.10 常用标准库

```go
import (
    "container/heap"
    "math"
    "math/bits"
    "slices"
    "sort"
    "strconv"
    "strings"
)
```

- `sort.Ints`、`sort.Slice`、`sort.Search`、`sort.SearchInts`
- `slices.Sort`、`slices.SortFunc`、`slices.BinarySearch`（Go 1.21+）
- `math.MaxInt32`、`math.MinInt32`
- `bits.OnesCount(uint(x))`
- `strconv.Atoi`、`strconv.Itoa`
- `heap.Init`、`heap.Push`、`heap.Pop`

### 0.11 从 Python / C++ / Java 过来

| 你可能熟悉的写法 | Go 写法 |
| --- | --- |
| Python `while cond:` | `for cond {}` |
| Python `x if c else y` | 没有三元运算符，写 `if` |
| Python `list.append(x)` | `xs = append(xs, x)` |
| Python `dict.get(k, 0)` | `cnt[k]` 直接返回零值 |
| C++ `vector<int> v(n)` | `make([]int, n)` |
| C++ `v.push_back(x)` | `v = append(v, x)` |
| C++ `for (int i=0; i<n; i++)` | `for i := 0; i < n; i++` |
| Java `map.containsKey(k)` | `_, ok := m[k]` |
| Java `null` | `nil` |

几个容易踩的点：

- Go 没有 `while`，用 `for`。
- Go 没有三元运算符。
- `range` 出来的值是拷贝，改它不会改原 slice。
- map 读取不存在的 key 返回零值。
- 变量和 import 声明了就必须使用。
- slice 共享底层数组，存答案时要拷贝。

### 0.12 编译错误速查

| 报错 | 常见原因 |
| --- | --- |
| `declared and not used` | 变量声明了没用，删掉或用 `_` |
| `imported and not used` | import 了没用，删掉 |
| `cannot use x (type int) as type int64` | 需要显式 `int64(x)` |
| `missing return` | 函数有返回值，但某条路径没 return |
| `assignment mismatch` | 返回值个数和接收变量个数不一致 |
| `invalid operation: ... mismatched types` | 类型不一致，先转换 |
| `nil pointer dereference` | 对 nil 指针取字段，先判空 |
| `index out of range` | 下标越界，检查 `len` |
| `append` 后数据没变 | 忘了 `xs = append(xs, x)` |

### 0.13 30 分钟上手路径

如果你完全没写过 Go，按这个顺序跑一遍：

1. 写 `hello` 程序，理解 `package main`、`import`、`func main`。
2. 写一个 slice 的增删改查，重点试 `append`、`copy`、切片共享。
3. 写一个 map 计数，试 comma-ok 和 `delete`。
4. 定义一个 `ListNode`，用 `&ListNode{}` 建节点并遍历。
5. 用 `sort.Slice` 给二维数组排序。
6. 抄一遍 `IntHeap`，跑一次 `heap.Push` / `heap.Pop`。
7. 回到第 1 节，开始看刷题模板。

做完这 7 步，后面的代码基本能看懂；剩下的语法边刷边补。

## 1. 刷题最小语法

### 1.1 提交形态

LeetCode 只要求实现函数，不需要 `main`：

```go
func twoSum(nums []int, target int) []int {
    // ...
}
```

本地调试时写完整程序：

```go
package main

import "fmt"

func main() {
    fmt.Println(twoSum([]int{2, 7, 11, 15}, 9))
}
```

### 1.2 slice 的三件事

```go
n := len(nums)
nums[i]
nums[1:3]                 // [1,3)
nums = append(nums, x)    // 必须接返回值
```

1. `append` 可能重新分配，必须接返回值。
2. 切片共享底层数组，函数里改 `nums[i]` 调用方可见。
3. 需要独立副本时用 `copy` 或 `append([]int(nil), nums...)`。

二维初始化：

```go
dp := make([][]int, m)
for i := range dp {
    dp[i] = make([]int, n)
}
```

### 1.3 遍历

```go
for i, x := range nums {}
for _, x := range nums {}
for i := 0; i < n; i++ {}
for k, v := range mp {}
```

`range` 给出的是值的拷贝：

```go
for _, x := range nums {
    x = 0          // 不会修改 nums
}
for i := range nums {
    nums[i] = 0    // 这样才会修改
}
```

### 1.4 常用内置与数学

```go
len(x)
append(s, v)
copy(dst, src)
make([]int, n)
delete(mp, key)
max(a, b)
min(a, b)          // Go 1.21+
```

```go
import "math"

math.MaxInt32
math.MinInt32
```

位运算：

```go
n & 1
n >> 1
n & (n - 1)
n & (-n)
1 << i
```

```go
import "math/bits"

bits.OnesCount(uint(n))
```

### 1.5 字符串

```go
len(s)          // 字节数
s[i]            // byte
[]byte(s)       // 字节 slice
[]rune(s)       // Unicode 字符 slice
string(b)       // 转回字符串
```

ASCII 题通常先转 `[]byte`：

```go
b := []byte(s)
b[i] = 'x'
s = string(b)
```

### 1.6 排序

```go
import "sort"

sort.Ints(nums)

sort.Slice(intervals, func(i, j int) bool {
    return intervals[i][0] < intervals[j][0]
})

sort.SearchInts(nums, x)
sort.Search(n, func(i int) bool {
    return nums[i] >= x
})
```

Go 1.21+ 也可以用：

```go
import "slices"

slices.Sort(nums)
slices.SortFunc(intervals, func(a, b []int) int {
    return a[0] - b[0]
})
```

`sort.Slice` 的 less 语义是“i 是否应该排在 j 前面”。

### 1.7 多返回值

```go
a, b = b, a
v, ok := mp[key]
_, _ = v, ok
```

刷题里很少需要 `error`，但要知道多返回值的写法。

## 2. 容器

### 2.1 map / set

```go
cnt := make(map[int]int)
cnt[x]++

v, ok := cnt[x]
if _, ok := cnt[x]; ok {
    // 存在
}

seen := make(map[int]struct{})
seen[x] = struct{}{}
if _, ok := seen[x]; ok {
    // 存在
}
```

### 2.2 slice 当栈

```go
st := []int{}
st = append(st, x)       // push
top := st[len(st)-1]     // 栈顶
st = st[:len(st)-1]      // pop
len(st) == 0             // 判空
```

### 2.3 slice 模拟 deque

Go 标准库没有刷题友好的 deque。`container/list` 是双向链表，接口和性能都不适合刷题。用 slice 写一个：

```go
type Deque struct {
    q []int
}

func (d *Deque) PushBack(v int) { d.q = append(d.q, v) }
func (d *Deque) PushFront(v int) {
    d.q = append([]int{v}, d.q...)
}
func (d *Deque) PopFront() int {
    v := d.q[0]
    d.q = d.q[1:]
    return v
}
func (d *Deque) PopBack() int {
    v := d.q[len(d.q)-1]
    d.q = d.q[:len(d.q)-1]
    return v
}
func (d *Deque) Front() int { return d.q[0] }
func (d *Deque) Back() int  { return d.q[len(d.q)-1] }
func (d *Deque) Len() int   { return len(d.q) }
```

`PushFront` 是 O(n)，但刷题里通常只在 BFS/滑动窗口用 `PushBack` + `PopFront`，够用。

BFS 也可以直接用 slice：

```go
q := []int{start}
for len(q) > 0 {
    cur := q[0]
    q = q[1:]
    // ...
}
```

### 2.4 heap

Go 的堆要自己实现 `heap.Interface` 的五个方法：

```go
import "container/heap"

type IntHeap []int

func (h IntHeap) Len() int           { return len(h) }
func (h IntHeap) Less(i, j int) bool { return h[i] < h[j] }
func (h IntHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }

func (h *IntHeap) Push(x any) {
    *h = append(*h, x.(int))
}

func (h *IntHeap) Pop() any {
    old := *h
    v := old[len(old)-1]
    *h = old[:len(old)-1]
    return v
}
```

用法：

```go
h := &IntHeap{}
heap.Init(h)
heap.Push(h, 3)
heap.Push(h, 1)

top := (*h)[0]
v := heap.Pop(h).(int)
```

这是小根堆。要改成大根堆，把 `Less` 改成 `h[i] > h[j]`。

`Push` / `Pop` 用指针接收者，因为 slice 头会变。

### 2.5 sort / slices 补充

```go
slices.Reverse(nums) // Go 1.21+

for i, j := 0, len(nums)-1; i < j; i, j = i+1, j-1 {
    nums[i], nums[j] = nums[j], nums[i]
}
```

## 3. 高频模板

### 3.1 哈希补数

```go
func twoSum(nums []int, target int) []int {
    seen := make(map[int]int)
    for i, x := range nums {
        if j, ok := seen[target-x]; ok {
            return []int{j, i}
        }
        seen[x] = i
    }
    return nil
}
```

### 3.2 滑动窗口

```go
left := 0
for right := 0; right < n; right++ {
    // 把 nums[right] 加入窗口

    for !valid() {
        // 把 nums[left] 移出窗口
        left++
    }

    // 用当前窗口更新答案
}
```

`valid()` 是占位，按题目替换成具体条件。比如“窗口内没有重复字符”：

```go
cnt := make(map[byte]int)
left := 0
ans := 0
for right := 0; right < len(s); right++ {
    cnt[s[right]]++
    for cnt[s[right]] > 1 {
        cnt[s[left]]--
        left++
    }
    if right-left+1 > ans {
        ans = right - left + 1
    }
}
```

### 3.3 二分

```go
func search(nums []int, target int) int {
    lo, hi := 0, len(nums)-1
    for lo <= hi {
        mid := lo + (hi-lo)/2
        if nums[mid] == target {
            return mid
        }
        if nums[mid] < target {
            lo = mid + 1
        } else {
            hi = mid - 1
        }
    }
    return -1
}
```

找第一个 `>= x` 的位置：

```go
i := sort.SearchInts(nums, x)
```

### 3.4 前缀和 + 哈希

```go
func subarraySum(nums []int, k int) int {
    cnt := map[int]int{0: 1}
    pre, ans := 0, 0
    for _, x := range nums {
        pre += x
        ans += cnt[pre-k]
        cnt[pre]++
    }
    return ans
}
```

### 3.5 回溯

```go
var ans [][]int
var path []int

var dfs func(start int)
dfs = func(start int) {
    ans = append(ans, append([]int(nil), path...))

    for i := start; i < len(nums); i++ {
        path = append(path, nums[i])
        dfs(i + 1)
        path = path[:len(path)-1]
    }
}
dfs(0)
```

两个关键点：

1. 存答案要拷贝。`append([]int(nil), path...)` 会新建底层数组。
2. 递归闭包先 `var dfs func(...)` 再赋值。

### 3.6 网格 DFS / BFS

```go
dirs := [][2]int{{1, 0}, {-1, 0}, {0, 1}, {0, -1}}

var dfs func(i, j int)
dfs = func(i, j int) {
    if i < 0 || i >= m || j < 0 || j >= n || grid[i][j] != '1' {
        return
    }
    grid[i][j] = '0'
    for _, d := range dirs {
        dfs(i+d[0], j+d[1])
    }
}
```

BFS：

```go
q := [][2]int{{si, sj}}
for len(q) > 0 {
    sz := len(q)
    for ; sz > 0; sz-- {
        cur := q[0]
        q = q[1:]
        for _, d := range dirs {
            ni, nj := cur[0]+d[0], cur[1]+d[1]
            // 判断边界、是否访问、是否合法
            // 标记后 q = append(q, [2]int{ni, nj})
        }
    }
}
```

Go 的 goroutine 栈会动态增长，递归深度一般不是问题。

### 3.7 链表

```go
dummy := &ListNode{}
cur := dummy
// ...
return dummy.Next
```

反转：

```go
var pre *ListNode
cur := head
for cur != nil {
    nxt := cur.Next
    cur.Next = pre
    pre = cur
    cur = nxt
}
return pre
```

Go 有 GC，不需要手动释放节点，链表题写法接近 C++ 但没有内存管理负担。

### 3.8 二叉树

```go
func maxDepth(root *TreeNode) int {
    if root == nil {
        return 0
    }
    return 1 + max(maxDepth(root.Left), maxDepth(root.Right))
}
```

层序遍历用 BFS 的 `sz := len(q)` 模式。

### 3.9 Trie

LeetCode 208 的常见写法：

```go
type TrieNode struct {
    children [26]*TrieNode
    isEnd    bool
}

type Trie struct {
    root *TrieNode
}

func Constructor() Trie {
    return Trie{root: &TrieNode{}}
}

func (t *Trie) Insert(word string) {
    node := t.root
    for i := 0; i < len(word); i++ {
        c := word[i] - 'a'
        if node.children[c] == nil {
            node.children[c] = &TrieNode{}
        }
        node = node.children[c]
    }
    node.isEnd = true
}

func (t *Trie) Search(word string) bool {
    node := t.root
    for i := 0; i < len(word); i++ {
        c := word[i] - 'a'
        if node.children[c] == nil {
            return false
        }
        node = node.children[c]
    }
    return node.isEnd
}

func (t *Trie) StartsWith(prefix string) bool {
    node := t.root
    for i := 0; i < len(prefix); i++ {
        c := prefix[i] - 'a'
        if node.children[c] == nil {
            return false
        }
        node = node.children[c]
    }
    return true
}
```

字符集不固定时，把 `children` 换成 `map[byte]*TrieNode`。

## 4. 单调栈

适用场景：每个元素左边/右边第一个比它大或小的元素。

```go
func dailyTemperatures(t []int) []int {
    ans := make([]int, len(t))
    st := []int{} // 存下标，对应温度递减

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
```

柱状图最大矩形：

```go
func largestRectangleArea(heights []int) int {
    heights = append(heights, 0)
    st := []int{}
    ans := 0

    for i := range heights {
        for len(st) > 0 && heights[i] < heights[st[len(st)-1]] {
            h := heights[st[len(st)-1]]
            st = st[:len(st)-1]
            left := -1
            if len(st) > 0 {
                left = st[len(st)-1]
            }
            if area := h * (i - left - 1); area > ans {
                ans = area
            }
        }
        st = append(st, i)
    }
    return ans
}
```

`heights = append(heights, 0)` 在容量够时可能修改调用方的底层数组，刷题里通常无所谓，但要知道这一点。

## 5. 单调队列

```go
func maxSlidingWindow(nums []int, k int) []int {
    dq := []int{} // 存下标，对应值从队首到队尾递减
    ans := []int{}

    for i, x := range nums {
        for len(dq) > 0 && dq[0] <= i-k {
            dq = dq[1:]
        }
        for len(dq) > 0 && nums[dq[len(dq)-1]] <= x {
            dq = dq[:len(dq)-1]
        }
        dq = append(dq, i)
        if i >= k-1 {
            ans = append(ans, nums[dq[0]])
        }
    }
    return ans
}
```

顺序是：过期出队 → 弹出队尾 → 入队 → 记录答案。

## 6. 并查集

```go
type DSU struct {
    parent []int
    size   []int
}

func NewDSU(n int) *DSU {
    parent := make([]int, n)
    size := make([]int, n)
    for i := range parent {
        parent[i] = i
        size[i] = 1
    }
    return &DSU{parent: parent, size: size}
}

func (d *DSU) Find(x int) int {
    if d.parent[x] != x {
        d.parent[x] = d.Find(d.parent[x])
    }
    return d.parent[x]
}

func (d *DSU) Union(a, b int) bool {
    ra, rb := d.Find(a), d.Find(b)
    if ra == rb {
        return false
    }
    if d.size[ra] < d.size[rb] {
        ra, rb = rb, ra
    }
    d.parent[rb] = ra
    d.size[ra] += d.size[rb]
    return true
}
```

`size` 必须初始化为 1。`make([]int, n)` 只会给零值，直接拿它做按大小合并会出错。

岛屿数量：

```go
func numIslands(grid [][]byte) int {
    m, n := len(grid), len(grid[0])
    dsu := NewDSU(m * n)
    cnt := 0

    for i := 0; i < m; i++ {
        for j := 0; j < n; j++ {
            if grid[i][j] != '1' {
                continue
            }
            cnt++
            id := i*n + j
            if i > 0 && grid[i-1][j] == '1' && dsu.Union(id, id-n) {
                cnt--
            }
            if j > 0 && grid[i][j-1] == '1' && dsu.Union(id, id-1) {
                cnt--
            }
        }
    }
    return cnt
}
```

## 7. 推荐刷题顺序

1. 哈希：两数之和 → 字母异位词分组 → 最长连续序列
2. 双指针：移动零 → 盛最多水的容器 → 三数之和
3. 滑动窗口：无重复字符最长子串 → 找到所有字母异位词
4. 子串：和为 K 的子数组 → 滑动窗口最大值
5. 数组/矩阵：最大子数组和 → 合并区间 → 旋转图像
6. 链表：反转 → 环形 → 合并有序链表 → LRU
7. 二叉树：最大深度 → 层序遍历 → 最近公共祖先
8. 图/回溯：岛屿数量 → 课程表 → 全排列
9. 栈/堆：有效括号 → 每日温度 → 数组中第 K 大
10. 贪心/DP：买卖股票 → 跳跃游戏 → 爬楼梯 → 零钱兑换
11. 位运算/技巧：只出现一次的数字 → 多数元素

专项：每日温度 → 柱状图最大矩形 → 滑动窗口最大值 → 岛屿数量 → 冗余连接。

## 8. 避坑清单

1. `append` 没接返回值：`append(s, x)` 单独一行等于没写。
2. slice 共享底层数组：存回溯答案、传给下一层时，需要独立副本。
3. `for _, x := range` 改 `x` 无效，改原数组要用下标。
4. 递归闭包先 `var dfs func(...)` 再赋值。
5. `make([]int, n)` 全是 0，需要 1 的地方要显式初始化。
6. heap 的 `Push` / `Pop` 用指针接收者。
7. `sort.Slice` 的 less 是“i 是否排在 j 前面”。
8. `len(s)` 是字节数，处理中文先想 `[]rune`。
9. Go 1.21 之前没有内置 `max` / `min`。
10. LeetCode 里不要起 goroutine，判题按函数调用，不值得引入并发。

## 9. 学习节奏

- 第 1～2 天：第 0 节过一遍，重点是 slice、map、struct、指针。
- 第 1 周：第 1～3 节，刷哈希、双指针、滑动窗口、链表。
- 第 2 周：树、图、回溯，加上单调栈和单调队列。
- 第 3 周起：贪心、DP、错题二刷。
- 把 heap、DSU、deque、Trie 四个模板整理成自己的 snippet，之后直接复用。

## 附：四语言对照

| 用途 | C++ | Python | Rust | Go |
| --- | --- | --- | --- | --- |
| 动态数组 | `vector` | `list` | `Vec` | slice |
| 栈 | `stack` | `list` | `Vec` | slice |
| 队列/deque | `deque` | `deque` | `VecDeque` | slice 模拟 |
| 哈希表 | `unordered_map` | `dict` | `HashMap` | `map` |
| 计数 | map 手动 | `Counter` | `entry().or_insert(0)` | `m[k]++` |
| 堆 | `priority_queue` | `heapq` | `BinaryHeap` | `heap.Interface` |
| 二分 | `lower_bound` | `bisect_left` | `partition_point` | `sort.Search` |
| 链表/树 | 原生指针 | 引用 | `Rc<RefCell>` | 指针 + GC |
| 溢出 | 注意 | 不常见 | debug panic | int 在 64 位环境基本够用 |
| 递归深度 | 注意栈 | 要调 limit | 注意栈 | goroutine 栈动态增长 |
