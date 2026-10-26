---
title: "字符串"
description: "std::string、string_view 与字符编码：字符串的所有权、视图和常见陷阱。"
pubDate: 2026-10-26
tags:
  - "C++"
  - "字符串"
  - "学习笔记"
category: course
series: cpp
order: 5
cover: /covers/post-code-cpp.svg
---

> 重点围绕 C++ 字符串的几种形态、`std::string` 的容器特性和字符串特性、`std::basic_string` 模板体系，以及实际编码中的生命周期、容量、编码和接口选择问题。

## 章节脉络

| 小节 | 主题 | 核心问题 |
| --- | --- | --- |
| 5.1 | 字符串概述 | C++ 中有哪些字符串形态？它们的所有权和生命周期有什么区别？ |
| 5.2 | `string` 的基本特点 | `std::string` 为什么既像容器，又有字符串专用能力？ |
| 5.3 | `basic_string` 模板 | `std::string`、`wstring`、`u16string` 等是什么关系？ |
| 5.4 | 小结 | 实际项目中应如何选择和使用字符串类型？ |

---

## 5.1 字符串概述

C++ 中“字符串”并不只有一种形式。常见形态包括：

| 形态                 | 示例                         | 是否拥有内容 | 主要特点                   |
| ------------------ | -------------------------- | ------ | ---------------------- |
| 字符数组               | `char s[] = "hello";`      | 是      | 数组对象保存字符内容，末尾通常有 `\0`。 |
| C 风格字符串            | `const char* p = "hello";` | 否      | 指针指向以 `\0` 结尾的字符序列。    |
| 字符串字面量             | `"hello"`                  | 静态存储期  | 通常位于只读存储区，不应修改。        |
| `std::string`      | `std::string s = "hello";` | 是      | 自动管理内存，提供丰富字符串操作。      |
| `std::string_view` | `std::string_view sv = s;` | 否      | 只观察字符序列，不复制、不拥有。       |

### 字符串字面量和 C 风格字符串

```cpp
const char* p = "hello";
```

`"hello"` 是字符串字面量，具有静态存储期。它的内容不应被修改，因此应使用 `const char*` 指向它。

错误做法：

```cpp
char* p = "hello"; // 现代 C++ 中不应这样写
```

即使某些旧编译器允许，也不代表可以安全修改字面量内容。

C 风格字符串依靠末尾的空字符 `\0` 判断结束：

```cpp
char s[] = {'h', 'i', '\0'};
```

这意味着：

- 如果缺少 `\0`，很多 C 字符串函数会越界读取；
- 字符串长度需要扫描才能知道；
- 调用者必须非常清楚指针指向的内存是否有效。

### `std::string`

`std::string` 是标准库提供的字符串类型，封装了：

- 内存分配和释放；
- 当前长度；
- 容量管理；
- 拷贝和移动；
- 拼接、查找、比较、插入、删除、替换；
- 与 C API 交互的 `c_str()`。

```cpp
#include <string>

std::string s = "hello";
s += " world";
```

相比 C 风格字符串，`std::string` 更符合 C++ 的值语义：

```cpp
std::string a = "hello";
std::string b = a;

b[0] = 'H';
// a 仍然是 "hello"
// b 是 "Hello"
```

### `std::string_view`

C++17 引入 `std::string_view`，它表示一段只读字符视图。

```cpp
#include <string>
#include <string_view>

void print(std::string_view text);

std::string s = "hello";
print(s);
print("world");
```

`string_view` 的优点是：

- 不复制字符串内容；
- 可以接收 `std::string`、字符串字面量、字符数组等；
- 适合只读参数。

但它不拥有数据，必须注意生命周期：

```cpp
std::string_view bad_view() {
    std::string s = "temporary";
    return std::string_view{s}; // 错误思路：返回后 s 已销毁
}
```

实践建议：

- 日常拥有字符串内容时，使用 `std::string`；
- 只读参数且不需要保存时，可使用 `std::string_view`；
- 不要让 `string_view` 活得比它观察的字符串更久；
- 与 C API 交互时通常仍需要 `c_str()`。

---

## 5.2 `string` 的基本特点

`std::string` 可以从两个角度理解：

1. 它是一个字符容器；
2. 它是一个字符串工具类。

### 5.2.1 类容器特性

`std::string` 保存连续的字符序列，提供很多类似标准容器的接口。

#### 迭代器

```cpp
#include <string>
#include <iostream>

std::string s = "C++";

for (auto it = s.begin(); it != s.end(); ++it) {
    std::cout << *it << '\n';
}
```

常用迭代器接口：

| 接口                      | 含义                    |
| ----------------------- | --------------------- |
| `begin()` / `end()`     | 正向迭代范围，`end()` 是尾后位置。 |
| `cbegin()` / `cend()`   | 只读正向迭代范围。             |
| `rbegin()` / `rend()`   | 反向迭代范围。               |
| `crbegin()` / `crend()` | 只读反向迭代范围。             |

更常见的遍历写法是范围 `for`：

```cpp
for (char ch : s) {
    std::cout << ch << '\n';
}
```

如果只读且避免复制，可写：

```cpp
for (const char ch : s) {
    // char 很小，按值即可
}
```

#### 字符分类函数的细节

统计数字字符时，很多人会写：

```cpp
#include <cctype>
#include <string>

int count_digits(const std::string& s) {
    int count = 0;
    for (char ch : s) {
        if (std::isdigit(ch)) {
            ++count;
        }
    }
    return count;
}
```

更稳妥的写法是：

```cpp
#include <cctype>
#include <string>

int count_digits(const std::string& s) {
    int count = 0;
    for (unsigned char ch : s) {
        if (std::isdigit(ch)) {
            ++count;
        }
    }
    return count;
}
```

原因是 `std::isdigit` 等 C 字符分类函数要求参数要么是 `EOF`，要么能表示为 `unsigned char`。如果普通 `char` 是有符号类型，某些非 ASCII 字节可能变成负值，导致问题。

#### 大小、空字符串和首尾访问

```cpp
std::string s = "hello";

s.size();   // 当前字符元素数量
s.empty();  // 是否为空
s.front();  // 首字符，要求非空
s.back();   // 尾字符，要求非空
```

注意：

- `end()` 指向最后一个字符之后的位置，不是最后一个字符；
- `front()` 和 `back()` 不能在空字符串上调用；
- `size()` 返回的是元素数量，对 `std::string` 来说是 `char` 数量；
- 如果字符串存的是 UTF-8 中文，`size()` 通常是字节数，不是人眼看到的字符数。

```cpp
std::string s = "你好";
// 在 UTF-8 环境下，s.size() 通常是 6，不是 2
```

#### 容器式操作

`std::string` 也支持：

```cpp
std::string a = "hello";
std::string b = "world";

a.swap(b);
```

`swap` 可交换两个字符串的内容。由于现代 `std::string` 有移动语义和实现优化，交换通常比逐字符复制更高效。

实践建议：

- 判断空字符串优先使用 `empty()`；
- 遍历用范围 `for` 或迭代器；
- 使用字符分类函数时注意 `unsigned char`；
- 访问 `front()` / `back()` 前先确认非空；
- 不要把 `size()` 当成人类语言字符数。

### 5.2.2 字符串特性

除了容器接口，`std::string` 还提供大量字符串专用操作。

#### 构造

常见构造方式：

```cpp
std::string s1;                    // 空字符串
std::string s2 = "hello";          // 从 C 风格字符串构造
std::string s3(5, 'x');            // "xxxxx"
std::string s4(s2, 1, 3);          // 从 s2 的一部分构造
std::string s5(s2.begin(), s2.end()); // 从字符范围构造
```

注意：

- 从 `const char*` 构造时，指针必须有效，并指向以 `\0` 结尾的字符序列；
- `nullptr` 不能当成普通 C 字符串传给 `std::string` 构造；
- 位置和长度参数要避免越界。

#### 赋值和拼接

```cpp
std::string s;

s = "hello";
s.assign("world");
s.assign(3, 'x'); // "xxx"
```

拼接方式：

```cpp
std::string a = "hello";
std::string b = "world";

std::string c = a + " " + b; // 生成新字符串
a += " ";
a += b;                      // 修改 a
b.append("!");              // 修改 b
```

区别：

| 操作           | 特点               |
| ------------ | ---------------- |
| `operator+`  | 生成新字符串，可能产生临时对象。 |
| `operator+=` | 在原字符串末尾追加。       |
| `append`     | 追加，重载形式更丰富。      |
| `assign`     | 替换整个字符串内容。       |

实践建议：

- 少量拼接用 `+` 可读性好；
- 多次追加用 `+=` 或 `append`；
- 已知最终长度时，先 `reserve()`；
- 区分“生成新字符串”和“修改原字符串”。

#### 小字符串优化 SSO

小字符串优化（Small String Optimization，SSO）是许多标准库实现采用的优化：当字符串较短时，内容可能直接存放在 `std::string` 对象内部，而不是额外分配堆内存。

理解 SSO 的意义：

- 小字符串构造和复制可能比想象中便宜；
- 很多短文本、标识符、路径片段能受益；
- 但它是实现细节，不是标准承诺。

不要写依赖具体 SSO 容量的代码：

```cpp
// 不要假设某个平台 std::string 内部一定能容纳 15 个字符而不分配
```

不同编译器、标准库和平台可能有不同阈值。

#### 内容访问

```cpp
std::string s = "hello";

char a = s[1];     // 不做边界检查
char b = s.at(1);  // 做边界检查，越界抛异常
char first = s.front();
char last = s.back();
```

`operator[]` 和 `at()` 的区别：

| 接口 | 边界检查 | 适用场景 |
| --- | --- | --- |
| `operator[]` | 无 | 已确认下标合法，追求简洁或性能。 |
| `at()` | 有 | 下标来自外部输入或合法性尚未验证。 |

与 C API 交互：

```cpp
const char* p = s.c_str();
```

`c_str()` 返回以 `\0` 结尾的字符指针。但要注意：

- 修改字符串后，之前保存的指针可能失效；
- 不要长期保存 `c_str()` 返回值；
- 传给 C API 是典型用途。

`data()` 返回内部字符数据指针。C++17 后，非 const `std::string::data()` 可返回可写指针，但仍要遵守字符串对象的大小和生命周期约束。

#### 比较

`std::string` 支持常见关系运算：

```cpp
std::string a = "abc";
std::string b = "abd";

bool less = a < b;
bool same = a == b;
```

比较通常是按字符编码值做字典序比较。

易混点：

- 字符串比较不是数字比较：`"10" < "2"` 可能为真；
- 默认比较大小写敏感；
- 默认比较不等于本地化自然语言排序；
- 中文、大小写折叠、重音符号等复杂文本比较需要专门库或本地化支持。

#### 查找

常用查找函数：

| 函数 | 含义 |
| --- | --- |
| `find` | 从左向右查找子串或字符。 |
| `rfind` | 从右向左查找子串或字符。 |
| `find_first_of` | 查找任意一个属于给定字符集合的字符。 |
| `find_last_of` | 从右向左查找任意一个属于给定字符集合的字符。 |
| `find_first_not_of` | 查找第一个不属于给定字符集合的字符。 |
| `find_last_not_of` | 从右向左查找最后一个不属于给定字符集合的字符。 |

示例：

```cpp
std::string path = "src/main.cpp";

auto slash = path.rfind('/');
if (slash != std::string::npos) {
    std::string filename = path.substr(slash + 1);
}
```

`std::string::npos` 表示“未找到”。它通常是 `std::string::size_type` 的最大值，不要把它当普通 `-1` 随意参与计算。

`find` 与 `find_first_of` 的区别：

```cpp
std::string s = "abc123";

s.find("bc");          // 查找完整子串 "bc"
s.find_first_of("xy1"); // 查找 'x'、'y'、'1' 中任意一个
```

实践建议：

- 查找结果必须和 `std::string::npos` 比较；
- 区分“查找完整子串”和“查找字符集合中的任意字符”；
- 现代 C++ 可用时，前缀/后缀判断可考虑 `starts_with`、`ends_with`。

#### 容量

容量相关接口：

```cpp
std::string s;

s.empty();
s.size();
s.capacity();
s.reserve(100);
s.shrink_to_fit();
```

含义：

| 接口                | 含义                    |
| ----------------- | --------------------- |
| `size()`          | 当前字符元素数量。             |
| `capacity()`      | 当前已分配空间可容纳的字符数量。      |
| `reserve(n)`      | 提前申请至少可容纳 `n` 个字符的空间。 |
| `shrink_to_fit()` | 请求释放多余容量，但不保证一定执行。    |

注意：

- `reserve(n)` 不会把字符串长度变成 `n`；
- `capacity()` 通常大于或等于 `size()`；
- 字符串扩容可能使迭代器、引用、指针失效；
- `clear()` 清空内容，但通常不保证释放容量。

适合 `reserve()` 的场景：

```cpp
std::string result;
result.reserve(1024);

for (std::string_view part : parts) {
    result += part;
}
```

如果预计会多次追加，提前保留容量可以减少重复分配。

#### 修改

常见修改函数：

```cpp
std::string s = "hello";

s.clear();
s = "hello";
s.erase(1, 2);       // 删除一段
s.insert(1, "XX");   // 插入
s.replace(1, 2, "YY");
s.push_back('!');
s.pop_back();
s.resize(10, '.');
```

含义：

| 函数          | 作用               |
| ----------- | ---------------- |
| `clear`     | 清空字符串内容。         |
| `erase`     | 删除指定位置或范围。       |
| `insert`    | 插入字符或字符串。        |
| `replace`   | 替换指定范围内容。        |
| `push_back` | 在末尾追加一个字符。       |
| `pop_back`  | 删除末尾字符，要求非空。     |
| `resize`    | 改变字符串长度，变长时填充字符。 |

实践建议：

- `pop_back()` 前先判断 `empty()`；
- 插入、删除、替换会影响位置和迭代器；
- 大量修改前考虑 `reserve()`；
- 如果只是追加单个字符，`push_back()` 比 `+= "x"` 更直接。

---

## 5.3 `basic_string` 模板

`std::string` 实际上是 `std::basic_string` 的一个特化。

常见别名：

| 类型 | 等价形式 | 常见用途 |
| --- | --- | --- |
| `std::string` | `std::basic_string<char>` | 窄字符字符串，常用于 UTF-8 字节序列。 |
| `std::wstring` | `std::basic_string<wchar_t>` | 宽字符字符串，平台差异较大。 |
| `std::u8string` | `std::basic_string<char8_t>` | C++20 UTF-8 字符类型字符串。 |
| `std::u16string` | `std::basic_string<char16_t>` | UTF-16 代码单元字符串。 |
| `std::u32string` | `std::basic_string<char32_t>` | UTF-32 代码单元字符串。 |

### 字符类型

#### `char`

`char` 是最常见的字符类型。现代跨平台项目中，经常使用 `std::string` 存储 UTF-8 字节序列。

但要记住：

```cpp
std::string s = "你好";
```

如果源文件和运行环境使用 UTF-8，`s` 中保存的是 UTF-8 编码后的字节，不是“两个 C++ 字符”。

#### `wchar_t`

`wchar_t` 的大小与平台相关：

- Windows 上通常是 16 位；
- 很多 Unix-like 系统上通常是 32 位。

因此 `std::wstring` 并不是天然跨平台统一的 Unicode 字符串方案。

#### `char16_t` 和 `char32_t`

C++11 引入：

- `char16_t` 通常用于 UTF-16 代码单元；
- `char32_t` 通常用于 UTF-32 代码单元。

它们让字符类型更明确，但不等于自动解决所有 Unicode 问题。

#### `char8_t`

C++20 引入 `char8_t`，用于更明确地表示 UTF-8 字符数据。

```cpp
// C++20 中，u8"hello" 的元素类型是 const char8_t
```

这带来更强类型区分，但也可能影响与旧接口中 `const char*`、`std::string` 的兼容。

### Unicode 和编码的现实问题

`std::basic_string` 管理的是“字符类型元素序列”，但自然语言文本处理比这复杂得多。

需要区分：

| 概念 | 含义 |
| --- | --- |
| 字节 | 内存中的基本存储单位。 |
| 代码单元 | 某种编码中的基本单元，如 UTF-8 的 `char`、UTF-16 的 `char16_t`。 |
| 码点 | Unicode 中的抽象字符编号。 |
| 字素簇 | 用户视觉上认为的一个字符，可能由多个码点组成。 |

所以：

```cpp
std::string s = "你好";
auto n = s.size();
```

`n` 是 `char` 元素数量，通常是 UTF-8 字节数，不是汉字个数。

实践建议：

- 普通跨平台文本优先使用 UTF-8；
- 可用 `std::string` 存储 UTF-8，但要清楚 `size()` 是字节数；
- 与 Windows API 交互时可能需要 UTF-16 / `wstring` 转换；
- 不要以为换成 `wstring` 就自动解决中文和 Unicode；
- 复杂 Unicode 操作应使用专门库。

---

## 5.4 小结

本章的主线是：从 C 风格字符串过渡到现代 C++ 字符串对象，并理解 `std::string` 作为标准库类型的行为边界。

关键结论：

- 字符串字面量、C 风格字符串、字符数组、`std::string`、`std::string_view` 是不同概念；
- `std::string` 拥有内容，负责内存和长度管理；
- `std::string_view` 不拥有内容，只适合观察已有字符串；
- `std::string` 既有容器式接口，也有字符串专用接口；
- `end()` 是尾后位置，`npos` 表示未找到；
- `size()` 是元素数量，不一定是自然语言字符数；
- `capacity()` 和 `size()` 不同，扩容可能导致指针和迭代器失效；
- `c_str()` 适合传给 C API，但返回指针不能长期保存；
- `std::string` 是 `std::basic_string<char>`，其他字符串类型是不同字符类型的特化；
- 编码问题不是 `std::string` 自动解决的，需要程序员明确选择和处理。

---

## 关键术语表

| 术语 | 解释 |
| --- | --- |
| 字符串字面量 | 形如 `"hello"` 的字符串，具有静态存储期，通常不可修改。 |
| C 风格字符串 | 以 `\0` 结尾的字符序列，常由 `const char*` 表示。 |
| 字符数组 | 保存字符元素的数组，可用于存放 C 风格字符串。 |
| `std::string` | 标准库字符串类型，拥有内容并自动管理内存。 |
| `std::string_view` | 非拥有字符串视图，只观察一段字符序列。 |
| `std::basic_string` | 字符串类模板，`std::string` 是它的 `char` 特化。 |
| 迭代器 | 用于遍历字符串字符元素的对象。 |
| 尾后迭代器 | `end()` 返回的位置，位于最后一个元素之后。 |
| `size()` | 当前字符串元素数量。 |
| `capacity()` | 当前已分配容量。 |
| `reserve()` | 预留容量，不改变字符串长度。 |
| `shrink_to_fit()` | 请求收缩容量，不保证一定生效。 |
| SSO | 小字符串优化，短字符串可能不分配堆内存。 |
| `c_str()` | 返回以 `\0` 结尾的 C 字符串指针。 |
| `data()` | 返回内部字符数据指针。 |
| `npos` | 表示查找失败的特殊位置值。 |
| UTF-8 | Unicode 编码形式之一，常用 `char` 字节序列保存。 |
| UTF-16 | Unicode 编码形式之一，常用 `char16_t` 代码单元保存。 |
| UTF-32 | Unicode 编码形式之一，常用 `char32_t` 代码单元保存。 |
| Unicode | 全球字符集标准。 |
| 生命周期 | 对象或其内部数据保持有效的时间范围。 |
| 指针失效 | 原本指向字符串内部数据的指针因修改、扩容等变得不可用。 |
| 迭代器失效 | 原本用于遍历的迭代器因容器修改而变得不可用。 |
