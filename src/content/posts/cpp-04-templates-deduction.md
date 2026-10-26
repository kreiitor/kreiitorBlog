---
title: "模板和自动类型推导"
description: "函数模板、类模板、可变参数模板与 auto/decltype 的推导规则。"
pubDate: 2026-10-26
tags:
  - "C++"
  - "模板"
  - "学习笔记"
category: course
series: cpp
order: 4
cover: /covers/post-code-cpp.svg
---

> 整理模板、类型推导、`auto`、`decltype`、变量模板、别名模板、可变参数模板、折叠表达式、初始化方式和结构化绑定的核心思想。

## 章节脉络

| 小节  | 主题     | 核心问题                         |
| --- | ------ | ---------------------------- |
| 4.1 | 模板概要   | 为什么 C++ 需要用模板表达“类型参数化”的代码？   |
| 4.2 | 函数模板   | 如何把一组相似函数抽象成一个模板？模板何时实例化？    |
| 4.3 | 类模板    | 如何把类型和值作为类定义的参数？如何特化？        |
| 4.4 | 变量模板   | 如何把编译期变量写成模板，简化 `::value`？   |
| 4.5 | 别名模板   | 如何用 `using` 简化复杂类型表达式？       |
| 4.6 | 可变模板参数 | 如何处理任意数量的类型和实参？类型推导还有哪些现代语法？ |
| 4.7 | 小结     | 模板和类型推导如何构成现代 C++ 泛型编程基础？    |
|     |        |                              |

---

## 4.1 模板概要

模板是 C++ 泛型编程的基础。它允许我们把“类型”甚至“编译期常量”作为参数，从而编写一份代码，适配多种具体类型。

如果没有模板，许多代码只能通过重复或宏来完成：

```cpp
int max_int(int a, int b) {
    return a < b ? b : a;
}

double max_double(double a, double b) {
    return a < b ? b : a;
}
```

使用函数模板后，可以把“类型不同，但操作结构相同”的部分抽象出来：

```cpp
template <typename T>
T max_value(T a, T b) {
    return a < b ? b : a;
}
```

模板的关键特点：

- 模板本身不是某个具体函数或具体类；
- 模板只有在被具体类型使用时，才会实例化出对应代码；
- 模板在编译期进行类型检查，不是预处理阶段的文本替换；
- 模板既可以参数化类型，也可以参数化编译期常量；
- 标准库大量使用模板，例如 `std::vector<T>`、`std::map<K, V>`、`std::unique_ptr<T>`、`std::tuple<Ts...>`。

### 模板不是宏

模板和宏都能减少重复代码，但二者层次完全不同：

| 对比项 | 宏 | 模板 |
| --- | --- | --- |
| 处理阶段 | 预处理阶段 | 编译阶段 |
| 本质 | 文本替换 | 类型参数化机制 |
| 类型检查 | 无 | 有 |
| 调试体验 | 容易产生晦涩错误 | 错误可能长，但仍基于类型系统 |
| 推荐程度 | 避免滥用 | 现代 C++ 泛型编程核心 |

实践中，应优先使用模板、`constexpr`、内联函数等类型安全机制，而不是用宏模拟泛型。

---

## 4.2 函数模板

函数模板定义的是“一类函数”，编译器会根据具体调用生成对应版本。

### 4.2.1 模板的定义

基本语法：

```cpp
template <typename T>
T gcd(T a, T b) {
    while (b != 0) {
        T r = a % b;
        a = b;
        b = r;
    }
    return a;
}
```

这里：

- `template <typename T>` 声明一个类型模板参数；
- `T` 是类型占位符；
- 调用时，编译器根据实参类型推导或由调用者显式指定 `T`；
- `typename` 和 `class` 在声明类型模板参数时基本等价。

也可以写成：

```cpp
template <class T>
T gcd(T a, T b) {
    // ...
}
```

但现代代码中更常用 `typename`，因为它更直接表达“这是一个类型参数”。

#### 模板参数不保证任意类型都可用

模板函数看似支持任意 `T`，但实际上 `T` 必须支持函数体中使用的操作。

上面的 `gcd` 使用了：

- `operator!=`；
- `%` 求余；
- 拷贝或移动赋值；
- 返回值构造。

所以它天然适合整数类型，不适合 `double`、`std::string` 等类型。

```cpp
auto x = gcd(12, 18);      // OK，T 可推导为 int
// auto y = gcd(1.2, 3.4); // 错误，double 不支持 %
```

这说明：

> 模板只是把类型作为参数，不等于函数逻辑能对所有类型成立。

### 4.2.2 模板的实例化

模板实例化是指编译器根据具体模板实参生成对应函数或类代码。

```cpp
gcd(12, 18);       // 可能实例化 gcd<int>
gcd(12L, 18L);     // 可能实例化 gcd<long>
```

这两个调用对应的是不同的函数实例。

模板实例化分为两类：

| 类型 | 含义 |
| --- | --- |
| 隐式实例化 | 编译器根据调用自动生成所需实例。 |
| 显式实例化 | 程序员明确要求编译器生成某个模板实例。 |

```cpp
template int gcd<int>(int, int); // 显式实例化声明/定义的典型形式之一
```

初学阶段更常见的是隐式实例化：写模板，然后直接调用，让编译器推导。

#### 模板错误常出现在实例化点

模板定义本身可能看起来没问题，但只有当某个具体类型触发实例化时，错误才暴露。

```cpp
template <typename T>
T remainder(T a, T b) {
    return a % b;
}

remainder(10, 3);       // OK
// remainder(1.5, 0.5); // 实例化 remainder<double> 时出错
```

阅读模板错误时，不要只看最后一行报错。要关注：

1. 哪个调用触发了实例化；
2. 模板参数被推导成了什么；
3. 模板函数体中哪条语句对该类型不成立。

### 4.2.3 模板参数推导和 `auto` 自动类型推导

模板参数推导是理解 `auto`、转发引用和现代 C++ 类型推导的基础。

#### 按值参数会丢弃顶层 `const`

```cpp
template <typename T>
void f(T x) {}

const int n = 42;
f(n); // T 推导为 int，而不是 const int
```

原因是 `x` 是副本，原对象的顶层 `const` 对副本没有约束意义。

类似地：

```cpp
const int n = 42;
auto x = n; // x 的类型是 int
```

`auto` 的推导规则与模板按值参数推导非常相似。

#### 底层 `const` 会保留

```cpp
template <typename T>
void f(T p) {}

const char* s = "hello";
f(s); // T 推导为 const char*
```

这里的 `const` 修饰的是指针指向的字符，不是指针变量本身，所以不会被丢掉。

区分顶层和底层 `const`：

```cpp
int value = 0;

const int a = value;       // 顶层 const：a 本身不可改
const int* p = &value;     // 底层 const：*p 不可改
int* const q = &value;     // 顶层 const：q 这个指针不可改
const int* const r = &value; // 两者都有
```

#### 引用参数会保留实参属性

```cpp
template <typename T>
void f(T& x) {}

const int n = 42;
f(n); // T 推导为 const int
```

因为 `x` 直接绑定到原对象，不能丢掉原对象的 `const` 属性。

#### `auto` 默认不是引用

```cpp
int n = 0;
int& ref = n;

auto x = ref;  // x 是 int，不是 int&
auto& y = ref; // y 是 int&
```

常见选择：

| 写法                      | 含义                     |
| ----------------------- | ---------------------- |
| `auto x = expr;`        | 拿一个副本，通常丢掉引用和顶层 const。 |
| `auto& x = expr;`       | 绑定可修改左值引用。             |
| `const auto& x = expr;` | 只读引用，避免拷贝，能绑定临时对象。     |
| `auto&& x = expr;`      | 推导语境中常作为转发引用。          |

#### `T&&` 在推导语境中可能是转发引用

```cpp
template <typename T>
void f(T&& x) {}

int n = 0;
f(n);  // T 推导为 int&，形参类型折叠为 int&
f(0);  // T 推导为 int，形参类型为 int&&
```

这里 `T&&` 是转发引用，不是普通右值引用。它能根据实参保留左值/右值属性。

实践建议：

- 需要副本：用 `auto`；
- 只读且避免拷贝：用 `const auto&`；
- 需要修改原对象：用 `auto&`；
- 模板中需要完美转发：用 `T&&` + `std::forward<T>`。

---

## 4.3 类模板

类模板用于定义“一类类型”。最典型的例子是标准库容器：

```cpp
std::vector<int> vi;
std::vector<double> vd;
```

`std::vector` 是类模板，`std::vector<int>` 和 `std::vector<double>` 才是具体类型。

### 4.3.1 模板的定义

类模板可以有类型模板参数，也可以有非类型模板参数。

```cpp
#include <cstddef>

template <typename T, std::size_t N>
struct Data {
    T values[N];
};
```

这里：

- `T` 是类型模板参数；
- `N` 是非类型模板参数；
- `Data<int, 5>` 与 `Data<int, 6>` 是两个不同类型；
- `Data<int, 5>` 与 `Data<double, 5>` 也是两个不同类型。

```cpp
Data<int, 3> a{{1, 2, 3}};
Data<double, 3> b{{1.0, 2.0, 3.0}};
```

非类型模板参数必须能在编译期确定，常用于：

- 数组长度；
- 缓冲区大小；
- 维度；
- 编译期标志；
- 枚举值或整型常量。

#### 类外定义成员函数

如果类模板的成员函数在类外定义，需要重复模板参数列表：

```cpp
template <typename T, std::size_t N>
struct Data {
    T& at(std::size_t index);
    T values[N];
};

template <typename T, std::size_t N>
T& Data<T, N>::at(std::size_t index) {
    return values[index];
}
```

注意 `Data<T, N>::at` 中必须写具体的模板参数形式。

### 4.3.2 模板的显式特化

显式特化用于给某些特定模板参数提供专门实现。

类型萃取是常见应用。比如判断一个类型是否是数组：

```cpp
template <typename T>
struct is_array {
    static constexpr bool value = false;
};

template <typename T>
struct is_array<T[]> {
    static constexpr bool value = true;
};

template <typename T, std::size_t N>
struct is_array<T[N]> {
    static constexpr bool value = true;
};
```

含义：

- 默认情况下，`T` 不是数组；
- `T[]` 表示未知边界数组；
- `T[N]` 表示已知大小数组；
- 对数组形式的类型，特化版本把 `value` 设为 `true`。

```cpp
static_assert(!is_array<int>::value);
static_assert(is_array<int[]>::value);
static_assert(is_array<int[3]>::value);
```

#### 全特化和偏特化

| 类型  | 含义                | 示例                                            |
| --- | ----------------- | --------------------------------------------- |
| 全特化 | 所有模板参数都被固定。       | `template <> struct X<int> { ... };`          |
| 偏特化 | 只固定一部分模式，仍保留模板参数。 | `template <typename T> struct X<T*> { ... };` |

类模板支持偏特化。函数模板不支持偏特化，类似需求通常通过重载、辅助类模板或约束解决。

#### `constexpr` 与编译期常量

类型萃取常用 `static constexpr` 保存编译期布尔值：

```cpp
static constexpr bool value = true;
```

这使得结果可以用于 `static_assert`、模板条件、编译期分支等场景。

### 4.3.3 类模板的成员函数和成员函数模板

类模板中的成员函数可以依赖类模板参数，也可以自己再引入新的模板参数。

```cpp
template <typename T>
class Box {
public:
    explicit Box(T value) : value_(value) {}

    const T& value() const {
        return value_;
    }

    template <typename U>
    bool same_as(const U& other) const {
        return value_ == other;
    }

private:
    T value_;
};
```

这里：

- `T` 是类模板参数；
- `U` 是成员函数模板自己的参数；
- `Box<int>` 确定后，`same_as` 仍可以根据传入对象继续推导 `U`。

标准库中的 `emplace_back` 就是成员函数模板的典型例子：

```cpp
std::vector<std::string> words;
words.emplace_back(5, 'x'); // 在 vector 内部构造 string("xxxxx")
```

`emplace_back` 不要求你先构造一个完整对象，而是把参数转发给元素类型的构造函数。

实践建议：

- 类模板参数表达“这个类整体依赖什么类型”；
- 成员函数模板参数表达“这个成员函数调用时还需要额外适配什么类型”；
- 容器、智能指针、工厂、包装器常用成员函数模板实现灵活接口。

---

## 4.4 变量模板

变量模板允许变量本身也依赖模板参数。它常用于简化类型萃取的 `::value` 写法。

有了前面的 `is_array<T>`，可以进一步定义：

```cpp
template <typename T>
inline constexpr bool is_array_v = is_array<T>::value;
```

于是：

```cpp
static_assert(is_array_v<int[3]>);
```

比：

```cpp
static_assert(is_array<int[3]>::value);
```

更短，也更符合现代标准库风格。

标准库中常见的 `_v` 形式包括：

```cpp
std::is_same_v<T, U>
std::is_array_v<T>
std::is_integral_v<T>
std::is_pointer_v<T>
```

其中 `_v` 不是语法关键字，只是命名约定，表示“取 trait 的 value”。

### 为什么常写 `inline constexpr`

变量模板通常放在头文件中。`inline` 变量是 C++17 引入的机制，可以避免多个翻译单元包含同一头文件时出现多重定义问题。

```cpp
template <typename T>
inline constexpr bool always_false_v = false;
```

这类写法在模板诊断和 `static_assert` 中很常见。

---

## 4.5 别名模板

别名模板用 `using` 给一类类型表达式起名字。

类型萃取中，早期常见写法是：

```cpp
typename remove_const<T>::type
```

现代写法可以定义别名模板：

```cpp
template <typename T>
using remove_const_t = typename remove_const<T>::type;
```

之后可以写：

```cpp
remove_const_t<const int> x = 0; // 类型是 int
```

标准库也大量使用 `_t` 后缀表示“取 trait 的 type”：

```cpp
std::remove_const_t<T>
std::remove_reference_t<T>
std::decay_t<T>
std::enable_if_t<Condition, T>
```

### `using` 与 `typedef`

旧式 `typedef` 也能起类型别名，但模板别名用 `using` 更自然：

```cpp
template <typename T>
using Vec = std::vector<T>;

Vec<int> values;
```

这类写法比用 `typedef` 模拟更清晰。

实践建议：

- 模板代码中优先用 `using`；
- 对复杂类型表达式提供别名模板；
- 看到 `_t` 时，通常理解为“类型结果”；
- 看到 `_v` 时，通常理解为“值结果”。

---

## 4.6 可变模板参数

可变模板参数允许模板接收任意数量的模板参数，是现代 C++ 泛型库的核心工具之一。

### 4.6.1 变长参数和折叠表达式

基本形式：

```cpp
template <typename... Args>
void print(Args... args) {
    // ...
}
```

这里有三个相关概念：

| 写法 | 含义 |
| --- | --- |
| `typename... Args` | 类型参数包。 |
| `Args... args` | 函数参数包。 |
| `args...` | 展开参数包。 |

#### C++17 折叠表达式

C++17 引入折叠表达式，让参数包处理更直接。

```cpp
template <typename... Args>
auto sum(Args... args) {
    return (... + args);
}

int n = sum(1, 2, 3, 4); // 10
```

`(... + args)` 是一元左折叠，可理解为：

```cpp
(((arg1 + arg2) + arg3) + arg4)
```

也可以对输出流折叠：

```cpp
#include <iostream>

template <typename... Args>
void print_all(const Args&... args) {
    ((std::cout << args << ' '), ...);
}
```

这里使用逗号运算符折叠，依次执行输出。

#### 折叠方向很重要

对加法这类满足结合律的操作，折叠方向影响不大；但对减法、除法、流插入、赋值等操作，方向会影响结果或合法性。

```cpp
template <typename... Args>
auto subtract_left(Args... args) {
    return (... - args); // ((a - b) - c)
}

template <typename... Args>
auto subtract_right(Args... args) {
    return (args - ...); // (a - (b - c))
}
```

实践建议：

- C++17 及以后优先用折叠表达式；
- 展开参数包时注意求值顺序；
- 对非交换、非结合运算要明确折叠方向；
- 参数包代码可读性差时，宁可拆成辅助函数。

### 4.6.2 `decltype`

`decltype` 用于根据表达式推导类型。它和 `auto` 相似，但规则不同。

```cpp
int x = 0;
const int cx = 1;

decltype(x) a = x;   // int
decltype(cx) b = cx; // const int
```

`decltype` 更忠实地保留声明类型。

最容易混淆的是括号：

```cpp
int x = 0;

decltype(x) a = x;   // int
decltype((x)) b = x; // int&
```

原因：

- `decltype(x)` 中的 `x` 是未加括号的变量名，结果是它的声明类型；
- `decltype((x))` 分析的是表达式 `(x)`，它是左值表达式，所以结果是左值引用。

#### `decltype(auto)`

C++14 引入 `decltype(auto)`，用于让变量或函数返回值按 `decltype` 规则推导。

```cpp
int value = 0;
int& get_ref() {
    return value;
}

auto a = get_ref();           // int，拷贝
 decltype(auto) b = get_ref(); // int&，保留引用
```

> 注意：上面的第二行实际代码中不应有前导空格，这里只是为了突出两种写法的对比。

函数返回 `decltype(auto)` 时要格外注意生命周期：

```cpp
decltype(auto) bad() {
    int x = 0;
    return (x); // 返回 int&，但 x 即将销毁，危险
}
```

实践建议：

- 普通变量推导优先用 `auto`；
- 需要精确保留引用和 `const` 时用 `decltype`；
- 公共接口返回类型不要过度依赖 `decltype(auto)`；
- 牢记 `decltype(x)` 和 `decltype((x))` 可能不同。

### 4.6.3 后置返回类型声明和返回类型自动推导

C++11 引入后置返回类型：

```cpp
template <typename T, typename U>
auto add(T a, U b) -> decltype(a + b) {
    return a + b;
}
```

这种写法适合返回类型依赖参数表达式的场景。因为在传统函数声明中，返回类型写在参数列表之前，那时 `a` 和 `b` 还不可见。

C++14 支持函数返回类型自动推导：

```cpp
template <typename T, typename U>
auto add(T a, U b) {
    return a + b;
}
```

编译器根据 `return` 语句推导返回类型。

需要注意：

- 多个 `return` 分支必须推导出一致类型；
- 普通 `auto` 返回会按 `auto` 规则推导，可能丢掉引用；
- 如果需要精确保留引用，应使用 `decltype(auto)`；
- 公共 API 中显式写出返回类型有时更利于阅读和接口稳定。

### 4.6.4 声明变量和初始化的不同方式

C++ 的初始化方式很多，容易让初学者困惑。

```cpp
int a = 1;     // 拷贝初始化
int b(1);      // 直接初始化
int c{1};      // 列表初始化
int d = {1};   // 拷贝列表初始化
auto e = 1;    // auto 推导为 int
auto f = {1};  // 通常推导为 std::initializer_list<int>
```

花括号初始化有两个重要特点：

1. 可以阻止窄化转换；
2. 可能优先匹配 `std::initializer_list` 构造函数。

```cpp
int x{1.2}; // 错误，阻止 double 到 int 的窄化转换
```

但与 `auto` 结合时要小心：

```cpp
auto x = 1;   // int
auto y = {1}; // std::initializer_list<int>
```

实践建议：

- 使用 `auto` 时避免无意写成 `auto x = { ... }`；
- 简单标量初始化保持清晰即可；
- 构造复杂对象时注意 `{}` 可能选择 `initializer_list` 重载；
- 不要为了“统一风格”而忽略初始化规则差异。

### 4.6.5 结构化绑定

C++17 引入结构化绑定，可以把对象中的多个元素一次性绑定到变量名。

```cpp
#include <utility>
#include <string>

std::pair<int, std::string> item{1, "C++"};
auto [id, name] = item;
```

等价理解：

```cpp
auto id = item.first;
auto name = item.second;
```

遍历 `map` 时尤其常见：

```cpp
#include <map>
#include <string>

std::map<std::string, int> scores;

for (const auto& [name, score] : scores) {
    // name 是 key，score 是 value
}
```

注意 `auto [a, b] = obj;` 默认可能复制。若对象较大或希望绑定原对象，应写引用：

```cpp
auto& [first, second] = item;
const auto& [key, value] = *scores.begin();
```

结构化绑定适用于：

- 数组；
- `std::pair`；
- `std::tuple`；
- 简单聚合结构体；
- 支持 tuple-like 接口的类型。

实践建议：

- 遍历 `map`、处理 `pair` 或 `tuple` 返回值时优先考虑结构化绑定；
- 大对象拆解时使用 `const auto& [a, b]`；
- 如果成员名本身更有语义，直接访问成员可能更清楚；
- 绑定数量必须与可拆解元素数量匹配。

---

## 4.7 小结

本章把现代 C++ 泛型编程的几条主线串了起来：

- 模板让类型和值成为编译期参数；
- 函数模板和类模板分别抽象函数族和类型族；
- 模板实例化发生在使用具体类型时；
- 模板参数推导解释了 `auto` 的许多行为；
- 类模板特化和类型萃取能在编译期根据类型选择逻辑；
- 变量模板和别名模板分别简化 `::value` 和 `::type`；
- 可变参数模板和折叠表达式让模板能处理任意数量的参数；
- `decltype`、后置返回类型、返回类型自动推导和结构化绑定让类型表达更灵活。

学习模板时，比死记语法更重要的是始终追问：

> 这个模板参数代表什么？它必须满足什么操作？实例化后生成的代码是否仍然合法？

---

## 关键术语表

| 术语 | 解释 |
| --- | --- |
| 模板 | 以类型或编译期值为参数生成代码的机制。 |
| 函数模板 | 定义一组结构相同、类型不同的函数。 |
| 类模板 | 定义一组结构相同、参数不同的类型。 |
| 模板实例化 | 编译器根据具体模板实参生成代码的过程。 |
| 类型模板参数 | 表示某个类型的模板参数，如 `typename T`。 |
| 非类型模板参数 | 表示编译期常量值的模板参数，如 `std::size_t N`。 |
| 显式特化 | 为特定模板实参提供专门实现。 |
| 偏特化 | 固定一部分模板参数模式，保留另一部分继续推导。 |
| 类型萃取 | 在编译期查询或转换类型信息的模板技术。 |
| 变量模板 | 以模板形式定义变量，常用于 `_v`。 |
| 别名模板 | 以模板形式定义类型别名，常用于 `_t`。 |
| 可变模板参数 | 接收任意数量模板参数的机制。 |
| 参数包 | 一组模板参数或函数参数。 |
| 折叠表达式 | C++17 中对参数包进行统一运算的表达式。 |
| `auto` | 根据初始化表达式自动推导变量或返回类型。 |
| `decltype` | 根据表达式得到类型，能保留更多值类别信息。 |
| `decltype(auto)` | 按 `decltype` 规则自动推导类型。 |
| 后置返回类型 | `auto f(...) -> T` 形式的返回类型声明。 |
| 结构化绑定 | 把对象的多个成员或元素绑定到多个变量名。 |
