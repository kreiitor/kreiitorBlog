---
title: "标准容器"
description: "vector、map、unordered_map 等标准容器的复杂度、失效规则与选型。"
pubDate: 2026-10-26
tags:
  - "C++"
  - "STL"
  - "学习笔记"
category: course
series: cpp
order: 7
cover: /covers/post-code-cpp.svg
---

> 目标是帮助初学者理解：标准容器不只是数组的升级版；它们是一组针对不同访问、插入、删除、排序、查找需求设计的数据结构工具。

## 章节脉络

| 小节 | 主题 | 核心问题 |
| --- | --- | --- |
| 7.1 | 标准模板库和容器 | STL 为什么把容器、迭代器和算法拆开设计？ |
| 7.2 | 序列容器 | `vector`、`deque`、`list`、`forward_list`、`array` 分别适合什么场景？ |
| 7.2.1 | `vector` | 为什么它是默认首选容器？扩容和迭代器失效要注意什么？ |
| 7.2.2 | `deque` | 为什么它适合两端插入删除，但不保证整体连续？ |
| 7.2.3 | `list` | 链表插入删除快，为什么不总是比 `vector` 好？ |
| 7.2.4 | `forward_list` | 单向链表为了省空间牺牲了哪些接口？ |
| 7.2.5 | `array` | 固定大小数组如何获得标准容器接口？ |
| 7.3 | 关联容器 | 如何通过“键”而不是位置访问元素？ |
| 7.3.1 | 维护元素序 | 有序容器如何靠比较器维护顺序？ |
| 7.3.2 | 关联容器的特点 | `set`、`map`、`multiset`、`multimap` 有什么区别？ |
| 7.3.3 | 通过比较器 | 透明比较器如何支持更灵活的查找？ |
| 7.4 | 无序关联容器 | 哈希表如何用“不保证顺序”换取平均常数时间查找？ |
| 7.5 | 容器适配器 | 为什么 `queue`、`stack`、`priority_queue` 不算独立容器？ |
| 7.5.1 | `queue` | 先进先出队列对底层 `deque` 做了哪些接口限制？ |
| 7.5.2 | `stack` | 后进先出栈为什么更像“受限版 `vector`”？ |
| 7.5.3 | `priority_queue` | 它为什么不按 FIFO 或 LIFO，而是按优先级决定 `top()`？ |
| 7.6 | 性能说明 | 该如何从内存布局、插入和查找角度选择容器？ |
| 7.7 | 本章小结 | 这一章关于容器选择的核心结论是什么？ |

---

## 7.1 标准模板库和容器

STL 是 Standard Template Library 的缩写，通常译为标准模板库。它是 C++ 标准库中非常核心的一部分。

STL 的核心思想是：

> 把“存放数据的结构”“遍历数据的方式”“处理数据的算法”解耦。

也就是说：

- 容器负责存数据；
- 迭代器负责指向和遍历元素；
- 算法通过迭代器操作一段范围；
- 函数对象或 lambda 负责定制操作规则。

例如：

```cpp
#include <algorithm>
#include <vector>

std::vector<int> v{3, 1, 2};
std::sort(v.begin(), v.end());
```

这里：

- `std::vector<int>` 是容器；
- `v.begin()` 和 `v.end()` 是迭代器；
- `std::sort` 是算法。

`std::sort` 并不直接绑定 `vector`。它关心的是：传进来的迭代器是否支持随机访问，以及元素能否比较。

### 面向小白的类比

STL 像一个标准化厨房：

| STL 组件 | 类比                  |
| ------ | ------------------- |
| 容器     | 盘子、盒子、抽屉，用来装东西。     |
| 迭代器    | 夹子或手，用来逐个拿东西。       |
| 算法     | 菜谱步骤，比如排序、查找、复制。    |
| 函数对象   | 调味规则，比如按甜度排序、按重量筛选。 |

这种设计的好处是：同一个算法可以适配很多容器。

### 学容器时要关注什么

不要只记容器名字。每学一个容器，都要问：

1. 它底层大概怎么组织元素？
2. 是否支持随机访问？
3. 头部、尾部、中间插入删除成本如何？
4. 查找元素成本如何？
5. 修改容器后，迭代器、指针、引用会不会失效？
6. 是否要求元素有顺序或唯一性？

***note:*** 增删（头部，中部，尾部）改查（随机访问），修改容器后，迭代器指针和引用是否失效，元素是否有序或者唯一

这些问题比死记 API 更重要。

---

## 7.2 序列容器

序列容器（sequence container）保存一组按线性顺序排列的元素。元素有前后关系，可以从头到尾遍历。

本章介绍的序列容器包括：

- `vector`
- `deque`
- `list`
- `forward_list`
- `array`

它们都能“按顺序存元素”，但底层结构和适用场景差别很大。

| 容器 | 直观模型 | 主要优势 | 主要限制 |
| --- | --- | --- | --- |
| `vector` | 连续动态数组 | 随机访问快，尾部追加高效，默认首选。 | 头部/中间插入删除慢，扩容会搬迁元素。 |
| `deque` | 分块双端队列 | 头尾插入删除都较快，支持随机访问。 | 不保证整体连续，结构比 `vector` 复杂。 |
| `list` | 双向链表 | 已知位置时插入删除快。 | 不支持随机访问，节点开销大，缓存不友好。 |
| `forward_list` | 单向链表 | 节点更省空间。 | 只能向前遍历，接口少。 |
| `array` | 固定大小数组 | 大小固定，轻量，有标准容器接口。 | 不能动态扩容。 |

---

## 7.2.1 `vector`

`vector` 是 C++ 中最常用的容器之一。可以把它理解成：

> 会自动扩容的数组。

它的底层通常是一段连续内存。

```cpp
#include <vector>

std::vector<int> v{1, 2, 3};

int x = v[1]; // 2
```

因为元素连续存放，所以 `vector` 支持快速随机访问：

```cpp
v[0];
v[1];
v.at(2);
```

### `vector` 的大小和容量

`vector` 有两个非常重要的概念：

| 概念 | 含义 |
| --- | --- |
| `size()` | 当前实际有多少个元素。 |
| `capacity()` | 当前已分配内存最多能容纳多少个元素。 |

```cpp
std::vector<int> v;

v.reserve(100); // 预留容量，不创建 100 个元素
v.resize(100);  // 改变大小，真的变成 100 个元素
```

这两个函数非常容易混淆：

- `reserve` 管容量；
- `resize` 管元素个数。

### 扩容和迭代器失效

当 `vector` 容量不够时，会分配一块更大的内存，把原来的元素搬过去，然后释放旧内存。

这会导致旧的：

- 指针；
- 引用；
- 迭代器；

全部可能失效。

```cpp
std::vector<int> v{1, 2, 3};
auto it = v.begin();

v.push_back(4); // 如果触发扩容，it 可能失效
```

所以不要长期保存 `vector` 的迭代器后又修改容器结构。

### `push_back` 与 `emplace_back`

尾部追加常用：

```cpp
v.push_back(4);
```

对于复杂对象，可以使用：

```cpp
#include <string>
#include <vector>

std::vector<std::string> words;

words.emplace_back(5, 'x'); // 直接构造 "xxxxx"
```

`push_back` 更像是：

```text
先造好对象，再放进容器
```

`emplace_back` 更像是：

```text
直接在容器内部构造对象
```

现代 C++ 有移动语义和复制省略，二者性能差距不一定总明显，但语义上：

- 已经有对象：用 `push_back`；
- 想用构造参数直接生成对象：用 `emplace_back`。

### 插入和删除

在尾部追加通常高效：

```cpp
v.push_back(10);
v.pop_back();
```

但在中间或头部插入、删除通常较慢：

```cpp
v.insert(v.begin(), 0);
v.erase(v.begin());
```

原因是后面的元素可能需要整体移动。

### `erase-remove` 惯用法

标准算法 `std::remove` 不会真的缩小容器大小，它只是把要保留的元素往前挪，并返回新的逻辑结尾。

真正删除要配合 `erase`：

```cpp
#include <algorithm>
#include <vector>

std::vector<int> v{1, 2, 3, 2, 4};

v.erase(std::remove(v.begin(), v.end(), 2), v.end());
```

执行后：

```text
{1, 3, 4}
```

理解这个惯用法的关键：

- `remove` 是算法，只调整区间内容；
- `erase` 是容器成员函数，真正删掉元素。

### `vector<bool>` 的特殊性

`vector<bool>` 是标准库中的特殊化版本。它可能把多个布尔值压缩存储到位中，不一定像普通 `vector<T>` 那样每个元素都是一个真正的 `bool` 对象。

所以：

- 它可能返回代理对象；
- 行为细节和普通 `vector<T>` 不完全一样；
- 如果需要真正的布尔数组语义，可以考虑其他表示方式。

### 面向小白的类比

`vector` 像电影院一整排连续座位：

- 找第 100 个座位很快，因为座位编号连续；
- 在最后加人通常方便；
- 在最前面插入一个人，后面所有人都要挪；
- 座位不够时，要换一排更大的座位，所有人搬过去。

### `vector` 实践建议

- 默认优先选择 `vector`。
- 大概知道元素数量时，先 `reserve`。
- 尾部追加用 `push_back` 或 `emplace_back`。
- 不要在修改 `vector` 后继续使用旧迭代器。
- 频繁头部插入删除时，不要选 `vector`。

---

## 7.2.2 `deque`

`deque` 是 double-ended queue，双端队列。

它的特点是：

- 支持随机访问；
- 头部和尾部插入删除都比较高效；
- 底层通常分块存储，不是一整块连续内存。

```cpp
#include <deque>

std::deque<int> d;

d.push_back(1);
d.push_front(0);
d.pop_back();
d.pop_front();
```

### `deque` 和 `vector` 的区别

| 对比项 | `vector` | `deque` |
| --- | --- | --- |
| 内存布局 | 通常整体连续 | 分块连续，整体不保证连续 |
| 随机访问 | 很快 | 支持，但可能多一层定位 |
| 尾部操作 | 高效 | 高效 |
| 头部操作 | 慢 | 高效 |
| 传给 C API | 可用连续内存场景较多 | 不应假设整体连续 |

### 面向小白的类比

`vector` 像一整排座位；`deque` 像多节车厢：

```text
vector: [1][2][3][4][5]

deque:  [1][2]  [3][4]  [5][6]
        第一节  第二节  第三节
```

车头和车尾接新车厢都方便，所以 `deque` 适合两端操作。

### `deque` 实践建议

- 需要频繁 `push_front` / `pop_front` 时考虑 `deque`。
- 只在尾部追加、频繁随机访问时，通常仍优先 `vector`。
- 不要依赖 `deque` 内存整体连续。
- 修改 `deque` 后，谨慎使用旧迭代器。

---

## 7.2.3 `list`

`list` 是双向链表。

每个节点通常保存：

- 元素本身；
- 指向前一个节点的链接；
- 指向后一个节点的链接。

```cpp
#include <list>

std::list<int> values{1, 2, 3};
```

### `list` 的优势和代价

优势：

- 已经知道位置时，插入删除很快；
- 插入删除不会像 `vector` 那样移动大量元素；
- 某些操作如 `merge`、`splice`、`sort` 适合链表结构。

代价：

- 不支持下标访问；
- 找第 N 个元素需要从头或尾一步步走；
- 每个节点有额外指针开销；
- 内存分散，缓存局部性较差。

```cpp
// 错误：list 不支持 []
// values[0];
```

### 为什么 `std::sort` 不能直接用于 `list`

普通 `std::sort` 需要随机访问迭代器，而 `list` 只有双向迭代器。

所以不能这样：

```cpp
// std::sort(values.begin(), values.end()); // 错误
```

应该使用 `list` 自己的成员函数：

```cpp
values.sort();
```

`list` 还提供一些适合链表的成员操作：

```cpp
values.remove(2);
values.reverse();
values.unique();
```

### 面向小白的类比

`list` 像一队人手拉手：

- 每个人知道前面是谁、后面是谁；
- 插入一个人，只要让相邻几个人重新牵手；
- 但要找第 100 个人，只能一个一个数过去。

### `list` 实践建议

- 如果主要是随机访问，不要用 `list`。
- 如果只是偶尔中间插入删除，`vector` 可能仍更快。
- 如果频繁在已知位置插入删除，可以考虑 `list`。
- 链表排序用 `list::sort()`。
- 不要只看复杂度，也要考虑缓存局部性。

---

## 7.2.4 `forward_list`

`forward_list` 是单向链表。

和 `list` 相比，它每个节点通常只保存指向下一个节点的链接，因此更省空间，但功能也更少。

```cpp
#include <forward_list>

std::forward_list<int> values{1, 2, 3};
```

### 为什么接口少

因为它只知道“下一个节点”，不知道“上一个节点”，所以不支持很多双向链表或序列容器常见操作。

它没有：

- `back()`
- `size()`
- `push_back()`
- `emplace_back()`
- `pop_back()`

它主要提供围绕“当前位置之后”的操作：

```cpp
values.insert_after(values.before_begin(), 0);
values.erase_after(values.before_begin());
```

注意：

```cpp
erase_after(pos)
```

删除的是 `pos` 后面的元素，不是 `pos` 自己。

### 面向小白的类比

`forward_list` 像一条单向寻宝路线：

```text
第一站 -> 第二站 -> 第三站 -> 结束
```

每张纸条只告诉你下一站在哪里，不告诉你上一站在哪里。

所以如果要删除“第二站”，你必须先站在“第一站”，让第一站直接指向第三站。

### `forward_list` 实践建议

- 只有确实需要单向链表且关注节点开销时才使用。
- 需要双向遍历，用 `list`。
- 需要随机访问，用 `vector` 或 `deque`。
- 需要尾部追加，不要优先选 `forward_list`。
- 使用它时要习惯 `before_begin`、`insert_after`、`erase_after`。

---

## 7.2.5 `array`

`std::array` 是 C++11 引入的固定大小数组容器。

```cpp
#include <array>

std::array<int, 3> a{1, 2, 3};
```

它和 C 风格数组类似，大小固定；但它提供标准容器接口。

### `std::array` 和 C 数组

C 数组：

```cpp
int a[3] = {1, 2, 3};
```

问题是：C 数组传给函数时常会退化为指针，长度信息丢失。

```cpp
void f(int a[]) {
    // 这里的 a 实际上是 int*，不知道原数组长度
}
```

`std::array` 不会这样退化：

```cpp
void f(const std::array<int, 3>& a) {
    auto n = a.size(); // 3
}
```

### `std::array` 的特点

- 大小是类型的一部分；
- 不动态扩容；
- 支持 `begin()` / `end()`；
- 支持 `size()`；
- 可以配合标准算法；
- 可以整体赋值和比较。

```cpp
std::array<int, 3> a{1, 2, 3};
std::array<int, 3> b{4, 5, 6};

a = b;
```

注意：

```cpp
std::array<int, 3>
std::array<int, 4>
```

这是两个不同类型。

### 通用工具：`std::begin`、`std::end`、`std::size`

C++17 提供了 `std::size`，可以统一处理标准容器和 C 数组：

```cpp
#include <iterator>

int a[3] = {1, 2, 3};

auto n = std::size(a); // 3
```

实践建议：

- 固定大小数据优先考虑 `std::array`，而不是裸 C 数组；
- 动态大小数据用 `std::vector`；
- 写通用代码时优先考虑 `std::begin`、`std::end`、`std::size`；
- 不要在函数参数里用裸数组表达“需要保留长度”的语义。

---

## 7.3 关联容器

序列容器主要按位置组织元素，而关联容器主要按“键”组织元素。

典型有序关联容器包括：

| 容器 | 含义 |
| --- | --- |
| `set` | 只保存键，键唯一。 |
| `multiset` | 只保存键，允许重复。 |
| `map` | 保存键值对，键唯一。 |
| `multimap` | 保存键值对，允许重复键。 |

关联容器的直觉是：

- `set` 像名单；
- `map` 像字典或通讯录；
- `multiset` 像投票箱；
- `multimap` 像一个人可以有多个号码的通讯录。

---

## 7.3.1 维护元素序

有序关联容器内部会维护元素顺序。默认使用比较器 `std::less<T>`，也就是“小的排前面”。

```cpp
#include <set>

std::set<int> s{3, 1, 2};
// 遍历结果是 1, 2, 3
```

### 自定义类型如何排序

如果元素是自定义类型，容器需要知道如何比较它们。

```cpp
#include <set>
#include <string>
#include <tuple>

struct PersonInfo {
    std::string name;
    std::string id_num;
};

struct PersonLess {
    bool operator()(const PersonInfo& lhs, const PersonInfo& rhs) const {
        return std::tie(lhs.name, lhs.id_num) < std::tie(rhs.name, rhs.id_num);
    }
};

std::set<PersonInfo, PersonLess> people;
```

这里的比较规则是：

1. 先按 `name` 排；
2. `name` 相同时，再按 `id_num` 排。

### 严格弱序

比较器必须满足严格弱序。你可以先不用记住数学定义，但要知道它要求“排序规则不能自相矛盾”。

基本要求包括：

- 一个对象不能小于自己；
- 如果 `a < b` 为真，那么 `b < a` 必须为假；
- 如果 `a < b` 且 `b < c`，那么 `a < c` 应该为真；
- 如果两个对象互相都不小于对方，容器会认为它们等价。

特别注意：

> `set` 判断重复，主要看比较器是否认为两个元素等价，而不一定看 `operator==`。

也就是说，如果：

```cpp
!(a < b) && !(b < a)
```

那么有序容器会把 `a` 和 `b` 当成等价元素。

### 小白类比

让全班同学排队，你必须给出稳定规则：

```text
先按身高
身高一样按学号
```

如果规则前后矛盾，队伍就排不起来。

容器内部维护平衡树结构，也依赖这种稳定规则。

### 实践建议

- 自定义比较器要简单、稳定、可预测。
- 多字段排序可以用 `std::tie`，减少手写错误。
- 不要用会变化的字段作为排序依据。
- 不要直接修改有序容器中的键；需要修改时，通常先删除再重新插入。

---

## 7.3.2 关联容器的特点

### 四种有序关联容器

| 容器 | 键是否唯一 | 是否有值 | 典型用途 |
| --- | --- | --- | --- |
| `set` | 唯一 | 否 | 判断元素是否存在。 |
| `multiset` | 可重复 | 否 | 保存重复元素或统计出现。 |
| `map` | 唯一 | 是 | 键到值的映射。 |
| `multimap` | 可重复 | 是 | 一个键对应多个值。 |

### `map` 的元素类型

`map<Key, T>` 中的元素大致是：

```cpp
std::pair<const Key, T>
```

这意味着：

- 键是 `const`，不能直接修改；
- 值可以修改。

```cpp
#include <map>
#include <string>

std::map<std::string, int> ages;
ages["Alice"] = 18;

ages["Alice"] = 19; // 修改值可以
// 不能直接修改 key
```

### 查找函数

常用查找操作：

| 函数 | 含义 |
| --- | --- |
| `find(key)` | 找到则返回迭代器，找不到返回 `end()`。 |
| `count(key)` | 返回匹配 key 的元素数量。 |
| `contains(key)` | C++20 起，判断 key 是否存在。 |
| `lower_bound(key)` | 第一个“不小于 key”的位置。 |
| `upper_bound(key)` | 第一个“大于 key”的位置。 |
| `equal_range(key)` | 返回所有等价 key 的区间。 |

例如：

```cpp
#include <set>

std::multiset<int> s{1, 2, 2, 2, 4};

auto first = s.lower_bound(2); // 第一个 2
auto last = s.upper_bound(2);  // 2 后面的 4
```

区间 `[first, last)` 就是所有等价于 2 的元素。

也可以直接：

```cpp
auto [first, last] = s.equal_range(2);
```

### 插入和更新

`map` 的插入更新接口容易混淆。

```cpp
#include <map>
#include <string>

std::map<std::string, int> m;

m.insert({"one", 1});
m.emplace("two", 2);
m["three"] = 3;
```

区别：

| 操作                 | 键不存在       | 键已存在         |
| ------------------ | ---------- | ------------ |
| `insert`           | 插入         | 不覆盖旧值        |
| `emplace`          | 原地构造并插入    | 不覆盖旧值        |
| `operator[]`       | 插入默认值并返回引用 | 返回已有值引用      |
| `try_emplace`      | 构造并插入      | 不覆盖，也尽量避免构造值 |
| `insert_or_assign` | 插入         | 覆盖旧值         |

### `operator[]` 的坑

很多初学者会这样查询：

```cpp
if (m["hello"] == 0) {
    // ...
}
```

问题是：如果 `"hello"` 不存在，`operator[]` 会自动插入一个默认值。

如果只是查询是否存在，应该用：

```cpp
if (m.find("hello") != m.end()) {
    // 存在
}
```

C++20 可以用：

```cpp
if (m.contains("hello")) {
    // 存在
}
```

### 实践建议

- 只关心是否存在：用 `set`。
- 需要 key 到 value：用 `map`。
- 允许重复 key：用 `multiset` 或 `multimap`。
- 查询时不要滥用 `operator[]`。
- 要覆盖旧值：用 `insert_or_assign`。
- 不想覆盖且想避免不必要构造：用 `try_emplace`。
- 遍历重复键范围：用 `equal_range`。

---

## 7.3.3 通透比较器

有序关联容器的排序和查找都依赖比较器。

C++14 后，标准比较器如 `std::less<>` 支持透明比较。它可以让容器支持异质查找，也就是：

> 容器里存的是一种 key 类型，查找时可以用另一种能比较的类型。

### `std::less<>` 和 `std::less<T>`

```cpp
std::set<std::string, std::less<>> names;
```

这里 `std::less<>` 是透明比较器。

它可能允许你用字符串字面量查找 `std::string` key，而不必显式构造临时 `std::string`：

```cpp
names.find("Alice");
```

如果比较器支持透明查找，容器就可以更灵活地比较不同类型。

### 自定义透明比较器

透明比较器通常会包含：

```cpp
using is_transparent = void;
```

并提供多个重载，让不同类型之间也能按同一套规则比较。

例如容器里存 `PersonInfo`，但经常想用 `id_num` 查找，就可以设计比较器支持：

- `PersonInfo` 和 `PersonInfo` 比；
- `PersonInfo` 和 `std::string` 比；
- `std::string` 和 `PersonInfo` 比。

核心原则：所有重载必须表达同一套排序规则。

### 实践建议

- 字符串键的有序容器可考虑 `std::less<>`。
- 异质查找可以减少临时 key 构造。
- 自定义透明比较器时必须保证排序规则一致。
- 拿不准比较规则时先使用普通比较器，避免破坏容器内部顺序。

---

## 7.4 无序关联容器

有序关联容器通常基于平衡树，查找复杂度通常是 `O(log N)`。

无序关联容器通常基于哈希表，平均情况下查找、插入、删除接近 `O(1)`。

标准库提供：

| 无序容器 | 对应有序容器 | 含义 |
| --- | --- | --- |
| `unordered_set` | `set` | 唯一键集合，不维护顺序。 |
| `unordered_multiset` | `multiset` | 允许重复键集合，不维护顺序。 |
| `unordered_map` | `map` | 唯一键到值映射，不维护顺序。 |
| `unordered_multimap` | `multimap` | 允许重复键到值映射，不维护顺序。 |

### 哈希表的直觉

哈希表大致过程：

1. 对 key 计算哈希值；
2. 根据哈希值找到桶；
3. 在桶里比较真正相等的元素。

```cpp
#include <string>
#include <unordered_map>

std::unordered_map<std::string, int> ages;

ages["Alice"] = 18;
ages["Bob"] = 20;
```

### 面向小白的类比

`map` 像按拼音排序的通讯录：

```text
查找时利用顺序
```

`unordered_map` 像很多抽屉：

```text
先根据名字算出应该去哪一个抽屉
再在那个抽屉里找
```

如果分得均匀，每个抽屉里东西很少，查找很快。

如果所有东西都被分到同一个抽屉，就会退化变慢。

### 无序容器和有序容器对比

| 对比项   | 有序关联容器        | 无序关联容器      |
| ----- | ------------- | ----------- |
| 典型实现  | 平衡树           | 哈希表         |
| 顺序    | 按比较器排序        | 不保证遍历顺序     |
| 查找复杂度 | 通常 `O(log N)` | 平均 `O(1)`   |
| 依赖规则  | 比较器           | 哈希函数 + 相等判断 |
| 适合场景  | 需要按 key 有序遍历  | 只关心快速查找     |

### 自定义 key 的要求

如果要把自定义类型作为 `unordered_map` 的 key，需要：

1. 相等判断；
2. 哈希函数。

并且必须满足：

> 如果两个 key 相等，它们的哈希值必须相同。

否则容器可能找不到本应存在的元素。

### 实践建议

- 不关心顺序，只想快速查找：优先考虑 `unordered_map` / `unordered_set`。
- 需要按 key 排序遍历：使用 `map` / `set`。
- 不要依赖无序容器的遍历顺序。
- 写测试时不要假设 `unordered_map` 输出顺序固定。
- 自定义 key 时，哈希函数和相等判断必须一致。
- 数据量大时，可关注桶数量、负载因子和哈希质量。

---

## 容器选择速查

| 需求 | 优先考虑 |
| --- | --- |
| 默认顺序存储、随机访问、尾部追加 | `vector` |
| 频繁头尾插入删除 | `deque` |
| 已知位置的中间插入删除很多 | `list` |
| 只需单向链表且极度关注节点开销 | `forward_list` |
| 固定大小数组 | `array` |
| 判断元素是否存在且希望有序 | `set` |
| key 到 value 映射且希望有序 | `map` |
| 允许重复 key 且希望有序 | `multiset` / `multimap` |
| 快速查找、不关心顺序 | `unordered_set` / `unordered_map` |

选择容器前，先问自己：

1. 是否需要随机访问？
2. 是否需要保持排序？
3. 是否需要快速按 key 查找？
4. 是否频繁在头部、中间、尾部插入删除？
5. 是否需要内存连续？
6. 是否会保存迭代器、引用或指针？
7. 是否允许重复 key？

---

## 7.5 容器适配器

C++ 标准库里存在三个容器适配器，它们建立在现有容器之上，通过模板参数修改其行为，本身不是独立容器。

你可以把它理解成：

> 底层还是在用现成容器存数据，只是对外只暴露符合特定数据结构语义的那部分接口。

下面通过几个例子简单看一下。

## 7.5.1 `queue`

我们先看一下队列 `queue`。它是先进先出（FIFO，first in first out）的数据结构。

`queue` 默认使用底层容器 `deque`。它的接口和 `deque` 比，有如下变化：

- 不能按下标访问元素。
- 没有 `begin()`、`end()` 等遍历成员函数。
- 用 `emplace()` 代替 `emplace_back()`，用 `push()` 代替 `push_back()`，用 `pop()` 代替 `pop_front()`；没有其他 `push_*`、`pop_*`、`emplace_*`、`insert` 函数，也不支持 `erase` 和 `clear()`。

它的实际内存布局当然仍随底层容器而定。逻辑上可以把它理解成这样：

```text
只能从前面 pop
front -> [0][1][2][3][4] <- back
                     只能从后面 push/emplace
```

`queue` 不提供 `begin()` 和 `end()` 方法，所以不能像普通容器那样直接遍历。不过首元素和尾元素仍然可以分别通过 `front()` 和 `back()` 访问。

```cpp
#include <iostream>
#include <queue>

std::queue<int> q;
q.push(1);
q.push(2);
q.push(3);
while (!q.empty()) {
    std::cout << q.front() << '\n';
    q.pop();
}
```

代码的输出自然是：

```text
1
2
3
```

## 7.5.2 `stack`

类似地，栈 `stack` 是后进先出（LIFO，last in first out）的数据结构。

`stack` 默认也是用 `deque` 来实现，但它的概念和 `vector` 更相似。它的接口跟 `vector` 比，有如下变化：

- 不能按下标访问元素。
- 没有 `begin()`、`end()` 等遍历成员函数。
- `back()` 成了 `top()`，没有 `front()`。
- 用 `emplace()` 代替 `emplace_back()`，用 `push()` 代替 `push_back()`，用 `pop()` 代替 `pop_back()`；没有其他 `push_*`、`pop_*`、`emplace_*`、`insert` 函数，也不支持 `erase` 和 `clear()`。

一般图形表示法会把 `stack` 表示成一个竖起来的 `vector`：

```text
top
[4]
[3]
[2]
[1]
[0]
```

这里有一个小细节需要注意。`stack` 跟我们前面讨论内存管理时的栈不是一回事：这里说的是一种抽象数据结构，图里常画成“向上增长”；而在讨论调用栈时，主流平台上的地址方向示意往往正好相反。提这一点，是希望你在看图时不要混淆；在实际使用 `stack` 时，这个区别通常无关紧要。

示例代码和上面的 `queue` 相似，但输出正好相反：

```cpp
#include <iostream>
#include <stack>

std::stack<int> s;
s.push(1);
s.push(2);
s.push(3);
while (!s.empty()) {
    std::cout << s.top() << '\n';
    s.pop();
}
```

输出为：

```text
3
2
1
```

## 7.5.3 `priority_queue`

`priority_queue` 也是一个容器适配器。它和 `stack` 相似，支持 `push`、`pop`、`top` 等有限的操作；但容器内的顺序既不是后进先出，也不是先进先出；它是（部分）排序的结果。

在使用默认的 `std::less<T>` 作为其 `Compare` 模板参数时，最大的数值会出现在容器的“顶部”。如果需要最小的数值出现在容器顶部，则可以传递 `std::greater<T>` 作为其 `Compare` 模板参数。

下面的代码可以演示它的功能：

```cpp
#include <functional>
#include <iostream>
#include <queue>
#include <utility>
#include <vector>

std::priority_queue<std::pair<int, int>,
                    std::vector<std::pair<int, int>>,
                    std::greater<>> q;
q.emplace(1, 1);
q.emplace(2, 2);
q.emplace(0, 3);
q.emplace(9, 4);
while (!q.empty()) {
    const auto [first, second] = q.top();
    std::cout << '(' << first << ", " << second << ")\n";
    q.pop();
}
```

输出为：

```text
(0, 3)
(1, 1)
(2, 2)
(9, 4)
```

这个结果说明：这里使用的是“最小值优先”的规则。

## 7.6 性能说明

对于容器，我们首先需要留意它的元素是在内存里连续排列，还是使用结点的方式存储，也就是每个元素占用独立的内存。

在现代处理器的体系架构下，连续内存的访问速度通常比不连续内存快得多。`vector`、`array` 使用连续内存，因此它们在遍历时的性能也通常最好。`list`、`forward_list`、关联容器和无序关联容器都基于结点，每个元素都占用单独的内存，并且对某一元素的操作不会影响其他元素的内存，因此在需要对任意位置的元素进行插入和删除时性能较高。当然，不同容器之间仍然有区别。至于 `deque`，它使用部分连续的内存，跟两者都不完全一样。

从插入的角度看，`vector` 在尾部插入时性能是分摊 `O(1)`，`deque` 在首尾插入时通常也是分摊 `O(1)`，`list`、`forward_list` 在任意已知位置插入的性能都是 `O(1)`。类似地，关联容器和无序关联容器的插入性能本身也基本稳定；但是，在未给出精确插入位置时，插入前仍然需要先查找实际插入位置。

从查找的角度看，虽然顺序查找的复杂度都是 `O(N)`，但如果必须使用顺序遍历来查找，`vector` / `array` 往往性能最好。有序关联容器里的元素天然排序，通过成员函数查找（`find`、`lower_bound`、`equal_range` 等）的性能通常是 `O(log N)`。无序关联容器里的元素不排序，理想情况下通过成员函数查找（`find`、`equal_range` 等）的性能是 `O(1)`，但最坏情况下也可能退化为 `O(N)`。

不过，复杂度里的常量因素仍然值得考虑：对于元素数量较少的情况，关联容器未必就比无序关联容器慢；但元素数量较大时，通常无序关联容器更容易表现出优势。

如果你打算使用关联容器，也请顺手考虑一下使用排序 `vector` 的可能。由于内存局部性，对 `vector` 使用 `std::binary_search` 和 `std::lower_bound` 来查找，常常比对关联容器使用 `find` 成员函数更快。当然，这主要适用于 `vector` 里的内容在构造完成之后基本不再更改的场景。

此外，C++23 和 Boost 库里的 `flat_map` / `flat_set` 实际上就是把这种“排序后的顺序存储”封装成 `map` / `set` 的接口，也值得了解。

## 7.7 本章小结

本章的重点是理解容器背后的数据结构选择，不是背容器 API。

关键结论：

- `vector` 是默认首选，除非你有明确理由不用；
- `deque` 适合两端操作；
- `list` 和 `forward_list` 是链表，插入删除的优势依赖“已知位置”；
- `array` 是固定大小数组的标准容器封装；
- `queue`、`stack`、`priority_queue` 是建立在现有容器之上的适配器，只暴露符合其语义的受限接口；
- 连续内存和结点式存储会显著影响遍历、插入和查找时的实际性能；
- 有序关联容器靠比较器维护顺序；
- `set` / `map` 的唯一性由比较器定义的等价关系决定；
- `map::operator[]` 查询时可能意外插入；
- `lower_bound`、`upper_bound`、`equal_range` 是理解有序范围查找的关键；
- 透明比较器支持更灵活的异质查找；
- 无序关联容器基于哈希表，平均查找快，但不保证遍历顺序。

---

## 关键术语表

| 术语 | 解释 |
| --- | --- |
| STL | 标准模板库，包含容器、迭代器、算法等重要组件。 |
| 容器 | 用于保存一组对象的数据结构。 |
| 迭代器 | 指向容器元素并支持遍历的对象。 |
| 序列容器 | 按线性顺序保存元素的容器。 |
| `vector` | 连续动态数组，默认首选顺序容器。 |
| `deque` | 双端队列，适合头尾插入删除。 |
| `list` | 双向链表。 |
| `forward_list` | 单向链表。 |
| `array` | 固定大小数组容器。 |
| `size()` | 当前元素数量。 |
| `capacity()` | 当前已分配容量。 |
| `reserve()` | 预留容量，不改变元素数量。 |
| `resize()` | 改变元素数量。 |
| 迭代器失效 | 容器修改后旧迭代器不再可用。 |
| `erase-remove` | 用 `remove` + `erase` 从顺序容器删除元素的惯用法。 |
| 关联容器 | 通过键组织和查找元素的容器。 |
| `set` | 唯一键集合。 |
| `multiset` | 允许重复键集合。 |
| `map` | 唯一键到值的映射。 |
| `multimap` | 允许重复键到值的映射。 |
| 比较器 | 决定有序容器元素顺序的函数对象。 |
| 严格弱序 | 比较器必须满足的一致排序规则。 |
| `lower_bound` | 第一个不小于 key 的位置。 |
| `upper_bound` | 第一个大于 key 的位置。 |
| `equal_range` | 某个 key 对应的等价元素区间。 |
| 透明比较器 | 支持不同类型之间比较和查找的比较器。 |
| 无序关联容器 | 基于哈希表、不维护排序顺序的关联容器。 |
| 哈希函数 | 把 key 映射为哈希值的函数。 |
| 桶 | 哈希表中存放元素的分组位置。 |
| 哈希冲突 | 不同 key 被映射到同一桶或同一哈希位置。 |
| 负载因子 | 哈希表元素数量与桶数量的比例。 |
