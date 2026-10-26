---
title: "函数对象"
description: "lambda、std::function、绑定与回调：把行为当作值传递。"
pubDate: 2026-10-26
tags:
  - "C++"
  - "lambda"
  - "学习笔记"
category: course
series: cpp
order: 6
cover: /covers/post-code-cpp.svg
---

> 重点是帮助初学者理解：为什么 C++ 里“对象也能像函数一样调用”，lambda 表达式本质是什么，捕获到底在捕获什么，以及 `std::function` 为什么能统一保存不同形式的可调用对象。

## 章节脉络

| 小节 | 主题 | 核心问题 |
| --- | --- | --- |
| 6.1 | 什么是函数对象 | 除了普通函数，还有哪些东西可以被当作函数调用？ |
| 6.1.1 | 函数对象 | 为什么一个对象可以写成 `obj(args...)` 的形式？ |
| 6.1.2 | 高阶函数 | 为什么算法可以接收“函数”作为参数？ |
| 6.1.3 | 函数的指针和引用 | 普通函数、函数指针、函数引用和函数对象有什么关系？ |
| 6.2 | lambda 表达式 | 如何现场写一个匿名函数对象？ |
| 6.2.1 | 基本用法和原理 | lambda 背后是不是编译器生成的函数对象？ |
| 6.2.2 | 捕获 | lambda 如何使用外部局部变量？值捕获和引用捕获有什么差别？ |
| 6.2.3 | 泛型 lambda 表达式 | 如何让 lambda 像函数模板一样接收不同类型？ |
| 6.3 | 使用 `function` 对象 | 如何把不同类型的可调用对象统一装进一个变量或容器？ |
| 6.4 | 小结 | 函数对象、lambda 和 `std::function` 各自适合什么场景？ |

---

## 先建立直觉：什么叫“可调用对象”

在 C++ 里，普通函数当然可以调用：

```cpp
int add2(int x) {
    return x + 2;
}

int y = add2(3); // 5
```

但 C++ 还允许很多“不是普通函数”的东西也用类似形式调用：

```cpp
something(3);
```

只要一个东西能写成 `xxx(args...)` 并执行某段逻辑，它就可以被看成**可调用对象**（callable）。本章讨论的函数对象、函数指针、lambda、`std::function` 都属于这个大框架。

你可以把它们理解成不同形态的“按钮”：

- 普通函数：一个固定按钮；
- 函数对象：一个可以带状态的按钮；
- lambda：现场临时做出来的小按钮；
- `std::function`：能装各种按钮的统一盒子。

---

## 6.1 什么是函数对象

### 6.1.1 函数对象

函数对象（function object，也常叫 functor）是一个对象，但它的类重载了函数调用运算符：

```cpp
operator()
```

于是这个对象就能像函数一样被调用。

“加法器”这个例子说明函数对象的基本形式：

```cpp
struct Adder {
    explicit Adder(int n) : n_(n) {}

    int operator()(int x) const {
        return x + n_;
    }

private:
    int n_;
};
```

使用方式：

```cpp
Adder add2(2);

int result = add2(3); // 5
```

这段代码的重点不是“加法”，而是这句：

```cpp
add2(3)
```

`add2` 明明是一个对象，不是函数，却可以像函数一样加括号调用。原因是编译器会把它理解成：

```cpp
add2.operator()(3)
```

也就是说：

> 函数对象的本质，是“定义了 `operator()` 的对象”。

#### 面向小白的类比

普通函数像一个固定公式：

```text
输入 x -> 输出 x + 2
```

函数对象像一台可以预先设置参数的小机器：

```text
先制造一台“加 n 机器”
Adder add2(2)  -> 每次调用都加 2
Adder add10(10) -> 每次调用都加 10
```

所以：

```cpp
Adder add2(2);
Adder add10(10);

add2(3);   // 5
add10(3);  // 13
```

同一个类 `Adder`，通过不同对象保存不同状态，就能产生不同的行为。

#### 为什么 `operator()` 常写成 `const`

```cpp
int operator()(int x) const {
    return x + n_;
}
```

***note:*** 末尾的 `const` 表示：调用这个函数对象时，不会修改 `Adder` 对象自身的状态。

这很合理，因为 `add2(3)` 只是读取 `n_`，不会把 `n_` 从 2 改成别的值。

如果函数对象调用时需要改变内部状态，就不能简单写 `const`：

```cpp
struct Counter {
    int operator()() {
        return ++count_;
    }

private:
    int count_ = 0;
};
```

这个 `Counter` 每调用一次就修改一次 `count_`，所以 `operator()` 不是 `const`。

#### 函数对象的优势

函数对象相比普通函数，多了一个重要能力：**保存状态**。

普通函数：

```cpp
int add2(int x) {
    return x + 2;
}
```

它只能固定加 2。

函数对象：

```cpp
Adder add2(2);
Adder add5(5);
Adder add100(100);
```

同一个类型可以生成很多带不同状态的对象。

这就是函数对象在标准库算法中很有用的原因：算法负责“怎么遍历”，函数对象负责“每个元素怎么处理”。

---

### 6.1.2 高阶函数

高阶函数指的是：可以接收函数或函数对象作为参数，或者返回函数/函数对象的函数。

C++ 标准库算法里有很多高阶函数。比如 `std::transform`：

```cpp
#include <algorithm>
#include <vector>

std::vector<int> v{1, 2, 3};

std::transform(v.begin(), v.end(), v.begin(), Adder(2));
```

这句代码的含义是：

```text
遍历 v 的每个元素
把每个元素传给 Adder(2)
把结果写回 v
```

执行后：

```text
{1, 2, 3} -> {3, 4, 5}
```

`std::transform` 自己不关心“加 2”还是“平方”还是“转大写”。它只负责遍历和写回。处理规则由最后一个参数决定。

#### C++98 时代的函数对象工具

C++98 标准库中已经有一些函数对象和适配器，例如：

```cpp
#include <algorithm>
#include <functional>
#include <vector>

std::vector<int> v{1, 2, 3};

std::transform(
    v.begin(), v.end(),
    v.begin(),
    std::bind2nd(std::plus<int>(), 2)
);
```

这里：

- `std::plus<int>()` 是一个二元函数对象，表示加法；
- `std::bind2nd(..., 2)` 把加法的第二个参数固定为 2；
- 最终得到一个“一元函数对象”：输入 `x`，输出 `x + 2`。

也就是说：

```cpp
std::bind2nd(std::plus<int>(), 2)
```

大致相当于前面的：

```cpp
Adder(2)
```

不过这种写法非常绕。它能帮助我们理解函数对象的历史，但现代 C++ 新代码一般不用 `bind2nd`，而是用 lambda。

现代写法：

```cpp
std::transform(
    v.begin(), v.end(),
    v.begin(),
    [](int x) { return x + 2; }
);
```

这就是第 6.2 节要讲的 lambda 表达式。

#### 小白理解

高阶函数可以理解成：

> 我写一个“流程函数”，但把其中某一步的具体规则交给你传进来。

比如 `std::transform`：

```text
我负责：从头到尾遍历容器
你负责：告诉我每个元素怎么变
```

这种设计让算法非常通用。

---

### 6.1.3 函数的指针和引用

普通函数也可以被当成可调用对象使用。

```cpp
int add2(int x) {
    return x + 2;
}
```

函数名 `add2` 在很多场景下会退化成函数指针。

函数指针可以这样写：

```cpp
int (*fp)(int) = add2;

int result = fp(3); // 5
```

这里 `fp` 是一个指向函数的指针。虽然它是指针，但也可以像函数一样调用。

#### 函数指针、函数引用和模板

下面的模板说明函数作为参数时会发生什么：

```cpp
int add2(int x) {
    return x + 2;
}

template <typename T>
auto test1(T fn) {
    return fn(2);
}

template <typename T>
auto test2(T& fn) {
    return fn(2);
}

template <typename T>
auto test3(T* fn) {
    return (*fn)(2);
}
```

调用：

```cpp
test1(add2);
test2(add2);
test3(add2);
```

三种形式都可以调用成功，但模板参数推导出来的类型不完全一样：

| 形式      | 大致含义          |
| ------- | ------------- |
| `T fn`  | 函数名通常退化为函数指针。 |
| `T& fn` | 通过引用接收函数本身。   |
| `T* fn` | 明确接收函数指针。     |

对初学者来说，不必一开始就死记这些类型细节。先记住核心结论：

> 普通函数、函数指针、函数引用、函数对象，只要能用 `()` 调用，很多标准库算法就可以接收它们。

#### 函数指针和函数对象的差别

| 对比项     | 函数指针      | 函数对象         |
| ------- | --------- | ------------ |
| 是否能保存状态 | 不能直接保存状态  | 可以通过成员变量保存状态 |
| 类型      | 指向函数的指针类型 | 普通类类型        |
| 调用形式    | `fp(x)`   | `obj(x)`     |
| 灵活性     | 适合指向普通函数  | 适合带状态、自定义行为  |

函数指针像“函数地址名片”；函数对象像“带参数的小机器”。

---

## 6.2 lambda 表达式

### 6.2.1 基本用法和原理

前面如果想给每个元素加 2，我们可以写函数对象类：

```cpp
std::transform(v.begin(), v.end(), v.begin(), Adder(2));
```

也可以写旧式函数对象适配器：

```cpp
std::transform(v.begin(), v.end(), v.begin(), std::bind2nd(std::plus<int>(), 2));
```

但这两种方式都有缺点：

- 专门写 `Adder` 类有点啰嗦；
- `bind2nd` 这类历史写法不直观。

C++11 引入 lambda 表达式，就是为了解决这个问题：

```cpp
std::transform(
    v.begin(), v.end(),
    v.begin(),
    [](int x) { return x + 2; }
);
```

这段 lambda：

```cpp
[](int x) { return x + 2; }
```

可以理解成“现场写了一个匿名函数对象”。

#### lambda 基本语法

完整形式大致是：

```cpp
[capture](parameters) mutable -> return_type {
    body
}
```

常见部分：

| 部分 | 含义 |
| --- | --- |
| `[capture]` | 捕获列表，用来说明如何使用外部局部变量。 |
| `(parameters)` | 参数列表，和普通函数参数类似。 |
| `mutable` | 允许修改按值捕获的副本。 |
| `-> return_type` | 显式返回类型，很多时候可省略。 |
| `{ body }` | 函数体。 |

最简单的 lambda：

```cpp
auto add2 = [](int x) {
    return x + 2;
};

int y = add2(3); // 5
```

#### lambda 的本质：编译器生成函数对象类

lambda 不是魔法。它可以理解为编译器帮你生成了一个函数对象类。

这段代码：

```cpp
auto add2 = [](int x) { return x + 2; };
```

大致可以理解成编译器生成了类似这样的类：

```cpp
struct SomeCompilerGeneratedName {
    auto operator()(int x) const {
        return x + 2;
    }
};

SomeCompilerGeneratedName add2;
```

真实的类名由编译器生成，程序员不能直接写出来。

关键点：

- 每个 lambda 表达式都有独一无二的闭包类型；
- lambda 对象就是这个闭包类型的对象；
- 没有捕获的 lambda 通常很轻量；
- 有捕获的 lambda 会把捕获内容保存到生成的对象里。

#### 小白理解

lambda 就像“临时写一个小函数对象”：

```text
不想专门起名字
不想单独写一个类
只想在这里写一小段规则
```

就用 lambda。

---

### 6.2.2 捕获

lambda 最重要的能力之一，是可以使用它所在作用域中的局部变量。

比如我们不想固定加 2，而是想加一个变量 `n`：

```cpp
int n = 5;

auto add_n = [n](int x) {
    return x + n;
};

int y = add_n(3); // 8
```

这里 `[n]` 就是捕获列表，表示把外部变量 `n` 捕获进 lambda。

### 值捕获

```cpp
int n = 5;

auto add_n = [n](int x) {
    return x + n;
};

n = 100;

int y = add_n(3); // 仍然是 8
```

`[n]` 是值捕获。lambda 对象内部保存的是 `n` 当时的副本。

可以理解成编译器生成了类似这样的函数对象：

```cpp
struct AddN {
    explicit AddN(int n) : n_(n) {}

    int operator()(int x) const {
        return x + n_;
    }

private:
    int n_;
};
```

所以外部 `n` 后来改成 100，不影响 lambda 内部保存的副本。

### 引用捕获

```cpp
int n = 5;

auto add_n = [&n](int x) {
    return x + n;
};

n = 100;

int y = add_n(3); // 103
```

`[&n]` 是引用捕获。lambda 对象里保存的是对外部 `n` 的引用。

可以理解为类似：

```cpp
struct AddNRef {
    explicit AddNRef(int& n) : n_(n) {}

    int operator()(int x) const {
        return x + n_;
    }

private:
    int& n_;
};
```

引用捕获不会复制变量，但它依赖外部变量继续活着。

#### 引用捕获的生命周期风险

```cpp
#include <functional>

std::function<int()> make_bad_counter() {
    int n = 0;
    return [&n] {
        return ++n;
    };
}
```

这个例子很危险。函数返回后，局部变量 `n` 已经销毁，但返回的 lambda 仍然引用它，后续调用会产生未定义行为。

所以要记住：

> 引用捕获适合 lambda 不离开当前作用域的场景；如果 lambda 会被保存、返回、异步执行，引用捕获要非常谨慎。

### 默认捕获

lambda 支持默认捕获：

```cpp
int a = 1;
int b = 2;

auto f1 = [=] { return a + b; }; // 默认按值捕获用到的局部变量
auto f2 = [&] { return a + b; }; // 默认按引用捕获用到的局部变量
```

默认按值捕获 `[=]` 要谨慎：它看起来省事，但容易让读者看不出 lambda 到底依赖了哪些外部变量。

更清晰的写法通常是显式捕获：

```cpp
auto f = [a, &b] {
    return a + b;
};
```

这样一眼能看出：

- `a` 是按值捕获；
- `b` 是按引用捕获。

### 捕获 `this` 和 `*this`

在成员函数里，lambda 如果要访问对象成员，通常会涉及 `this`。

```cpp
struct Widget {
    int value = 42;

    auto make_lambda() {
        return [this] {
            return value;
        };
    }
};
```

`[this]` 捕获的是当前对象指针，因此 lambda 内可以访问成员变量。

但 `[this]` 有风险：如果对象已经销毁，lambda 还在调用，就会悬空。

C++17 引入了 `[*this]`，可以捕获当前对象的副本：

```cpp
struct Widget {
    int value = 42;

    auto make_lambda_copy() {
        return [*this] {
            return value;
        };
    }
};
```

这时 lambda 保存的是当前对象的一份拷贝，而不是原对象指针。

### 初始化捕获

C++14 支持在捕获列表中创建新变量：

```cpp
int n = 10;

auto f = [m = n + 1] {
    return m;
};
```

这里 lambda 内部变量叫 `m`，值是 `n + 1`。

也可以用于移动捕获：

```cpp
#include <memory>

std::unique_ptr<int> p = std::make_unique<int>(42);

auto f = [p = std::move(p)] {
    return *p;
};
```

这类写法很适合把只能移动、不能拷贝的对象放进 lambda。

### `mutable`：允许修改按值捕获的副本

默认情况下，lambda 的 `operator()` 通常是 `const`，因此不能修改按值捕获的成员副本：

```cpp
int n = 0;

// auto f = [n] { return ++n; }; // 错误：默认不能修改按值捕获的副本
```

如果确实要修改 lambda 自己保存的副本，需要加 `mutable`：

```cpp
int n = 0;

auto counter = [n]() mutable {
    return ++n;
};

counter(); // 1
counter(); // 2

// 外部 n 仍然是 0
```

注意：这里修改的是 lambda 内部的副本，不是外部的 `n`。

### 结构化绑定与捕获

还提到，早期标准中 lambda 对结构化绑定的捕获支持有限。可以用初始化捕获规避：

```cpp
#include <utility>

std::pair<int, int> p{1, 2};
auto [x, y] = p;

auto f = [x = x] {
    return x;
};
```

这种写法的意思是：在 lambda 内新建一个捕获成员 `x`，用外部的 `x` 初始化它。

### 捕获实践建议

| 场景 | 推荐写法 | 原因 |
| --- | --- | --- |
| lambda 只在当前语句或当前函数内立即使用 | 可以引用捕获 | 外部变量生命周期清楚。 |
| lambda 会被返回、保存、异步执行 | 优先值捕获 | 避免悬垂引用。 |
| 只需要少量变量 | 显式捕获 `[x, &y]` | 依赖关系清晰。 |
| 需要移动对象进 lambda | 初始化捕获 `[p = std::move(p)]` | 支持只移动类型。 |
| 需要修改值捕获副本 | `mutable` | 修改的是 lambda 内部状态。 |

---

### 6.2.3 泛型 lambda 表达式

有时我们希望 lambda 不只接收某一种类型，而是像函数模板一样适配多种类型。

C++14 引入泛型 lambda，可以在参数里使用 `auto`：

```cpp
#include <iostream>

const auto print = [](const auto& x) {
    std::cout << x << ' ';
};

print(42);
print(3.14);
print("hello");
```

这里 `const auto& x` 表示：参数类型由调用时的实参决定。

这很像下面的函数对象：

```cpp
#include <iostream>

struct Print {
    template <typename T>
    void operator()(const T& x) const {
        std::cout << x << ' ';
    }
};
```

也就是说：

> 泛型 lambda 可以理解为“带模板 `operator()` 的函数对象”的简写。

`for_each` 这类算法说明泛型 lambda 很适合做临时规则：

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

std::vector<int> v{1, 2, 3};

std::for_each(v.begin(), v.end(), [](const auto& x) {
    std::cout << x << ' ';
});
```

实践建议：

- 参数类型简单明确时，可以写具体类型；
- 希望 lambda 能适配不同类型时，用 `auto` 参数；
- 大对象参数通常写 `const auto&`，避免复制；
- 需要修改实参时写 `auto&`；
- 需要完美转发时再考虑 `auto&&` 和 `std::forward`。

---

## 6.3 使用 `function` 对象

函数对象、lambda、函数指针都有一个问题：它们的具体类型可能完全不同。

比如：

```cpp
int add2(int x) {
    return x + 2;
}

struct Adder {
    explicit Adder(int n) : n_(n) {}

    int operator()(int x) const {
        return x + n_;
    }

private:
    int n_;
};

auto lambda = [](int x) { return x + 2; };
```

这三者都能接收一个 `int`，返回一个 `int`，但类型分别是：

- 普通函数或函数指针；
- 自定义函数对象类型；
- 编译器生成的 lambda 闭包类型。

如果我们想把它们放进同一个变量、同一个容器、同一个 `map`，就需要一个统一类型。

这就是 `std::function` 的用途。

### 基本用法

```cpp
#include <functional>

int add2(int x) {
    return x + 2;
}

std::function<int(int)> f = add2;

int y = f(3); // 5
```

`std::function<int(int)>` 的意思是：

```text
保存一个可调用对象
它接收一个 int
返回一个 int
```

也可以保存 lambda：

```cpp
std::function<int(int)> f = [](int x) {
    return x + 2;
};
```

也可以保存函数对象：

```cpp
std::function<int(int)> f = Adder(2);
```

### `std::function` 的核心：类型擦除

`std::function` 可以把不同具体类型统一成同一种外部类型。

你可以把它理解成“万能可调用对象盒子”：

```text
普通函数       -> 放进 std::function<int(int)>
函数对象       -> 放进 std::function<int(int)>
lambda         -> 放进 std::function<int(int)>
```

外部只关心调用签名：

```cpp
int(int)
```

不再关心里面到底装的是函数指针、函数对象还是 lambda。

### 用 `map` 保存运算规则

“把字符串运算符映射到函数对象”这个例子说明 `std::function` 的用途：

```cpp
#include <functional>
#include <iostream>
#include <map>
#include <string>

std::map<std::string, std::function<int(int, int)>> ops{
    {"+", [](int x, int y) { return x + y; }},
    {"-", [](int x, int y) { return x - y; }},
    {"*", [](int x, int y) { return x * y; }},
    {"/", [](int x, int y) { return x / y; }},
};

int result = ops.at("+")(5, 8); // 13
std::cout << result << '\n';
```

这里：

- `ops` 的 key 是字符串，比如 `"+"`；
- value 是 `std::function<int(int, int)>`；
- 每个 lambda 的具体类型都不同，但都能装进同一种 `std::function`；
- `ops.at("+")(5, 8)` 表示：先取出加法规则，再调用它。

这对初学者来说可能一开始有点绕，可以拆开看：

```cpp
auto plus_fn = ops.at("+");
int result = plus_fn(5, 8);
```

### 空 `std::function`

`std::function` 可以为空：

```cpp
std::function<int(int)> f;
```

调用空的 `std::function` 会抛出 `std::bad_function_call`。

所以调用前可以检查：

```cpp
if (f) {
    int y = f(3);
}
```

### 什么时候用 `std::function`

适合使用：

- 需要把不同可调用对象保存到同一个变量；
- 需要把不同 lambda 放进同一个容器；
- 需要保存回调函数；
- 接口希望接收“任何满足某个调用签名的对象”。

不一定需要使用：

- 只是在模板函数里临时接收一个可调用对象；
- 追求极致性能，且不需要类型擦除；
- 可调用对象类型在编译期已经明确。

这种场景用模板参数通常更直接：

```cpp
template <typename F>
void call_twice(F fn) {
    fn();
    fn();
}
```

`std::function` 更灵活，但通常也会有一点额外开销。初学阶段先记住：

> 模板适合“编译期知道具体类型”；`std::function` 适合“运行时统一保存不同可调用对象”。

---

## 6.4 小结

本章主要讲“函数调用形式的统一”。

C++ 中不仅普通函数能调用，很多对象也能调用：

- 重载了 `operator()` 的类对象，是函数对象；
- 普通函数可以通过函数指针或函数引用传递；
- lambda 是编译器生成的匿名函数对象；
- `std::function` 可以用统一类型保存不同可调用对象。

学习这章可以抓住三个层次：

1. **能不能调用**：能写 `x(args...)`，就是可调用对象；
2. **有没有状态**：函数对象和带捕获 lambda 可以保存状态；
3. **类型是否统一**：不同 lambda 类型不同，需要统一保存时用 `std::function`。

实践中：

- 简单、局部的一次性规则：优先用 lambda；
- 需要复用、需要清晰命名、状态较复杂：可以写函数对象类；
- 需要统一存储回调：使用 `std::function`；
- 对性能非常敏感且无需统一类型：优先考虑模板接收可调用对象。

---

## 关键术语表

| 术语 | 解释 |
| --- | --- |
| 可调用对象 | 能使用 `()` 调用的对象或函数实体。 |
| 函数对象 | 重载了 `operator()`、能像函数一样调用的对象。 |
| functor | 函数对象的英文常用称呼。 |
| `operator()` | 函数调用运算符，使对象可以写成 `obj(args...)`。 |
| 高阶函数 | 接收函数/函数对象作为参数，或返回函数/函数对象的函数。 |
| `std::transform` | 标准库算法，把输入范围中的元素变换后写入输出范围。 |
| 函数指针 | 指向普通函数的指针，如 `int (*)(int)`。 |
| 函数引用 | 绑定到函数本身的引用。 |
| lambda 表达式 | 用于现场创建匿名函数对象的语法。 |
| 闭包类型 | 编译器为 lambda 生成的匿名类类型。 |
| 捕获 | lambda 使用外部局部变量的机制。 |
| 值捕获 | 把外部变量复制进 lambda 对象。 |
| 引用捕获 | 在 lambda 对象中保存外部变量的引用。 |
| 默认捕获 | 用 `[=]` 或 `[&]` 捕获用到的外部局部变量。 |
| 初始化捕获 | 在捕获列表中创建并初始化 lambda 内部成员，如 `[x = expr]`。 |
| `mutable` lambda | 允许修改按值捕获副本的 lambda。 |
| 泛型 lambda | 参数中使用 `auto` 的 lambda，类似带模板 `operator()` 的函数对象。 |
| `std::function` | 用统一类型保存不同可调用对象的标准库模板。 |
| 类型擦除 | 隐藏具体类型，只暴露统一接口的技术。 |
| `std::bad_function_call` | 调用空 `std::function` 时抛出的异常。 |
