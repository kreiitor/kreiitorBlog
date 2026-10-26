---
title: "值类别和移动语义"
description: "左值、右值、将亡值与移动构造：理解 std::move 到底做了什么。"
pubDate: 2026-10-26
tags:
  - "C++"
  - "移动语义"
  - "学习笔记"
category: course
series: cpp
order: 3
cover: /covers/post-code-cpp.svg
---

> 本章覆盖值语义、引用语义、表达式值类别、右值引用、移动语义、返回值优化、完美转发，以及三法则、五法则和零法则。

## 章节脉络

| 小节 | 主题 | 核心问题 |
| --- | --- | --- |
| 3.1 | 引用语义和值语义 | 赋值、传参和返回时，复制的是对象本身还是对象引用？ |
| 3.2 | 值类别 | 表达式是左值、纯右值还是将亡值？它能否被移动？ |
| 3.3 | 移动语义 | 如何在保持值语义直观性的同时避免昂贵深拷贝？ |
| 3.4 | 值类别的其他细节 | 为什么 `T&&` 变量仍可能是左值？如何实现完美转发？ |
| 3.5 | 三法则、五法则和零法则 | 自定义资源管理类应如何处理拷贝、移动和析构？ |
| 3.6 | 小结 | 用现代 C++ 的类型机制表达所有权、生命周期和值类别。 |

---

## 3.1 引用语义和值语义

### 3.1.1 值语义：对象拥有独立副本

值语义的关键是：赋值、初始化、传参或返回时，目标对象获得源对象状态的**独立副本**。之后修改其中一个对象，不会影响另一个对象。

```cpp
#include <string>
using std::string;

string a("hello");
string b;

b = a;
b[0] = 'H';

// a 仍然是 "hello"
// b 变成 "Hello
// 在python中，字符串是不可变对象
```

这类语义符合人们对普通数值类型的直觉：

```cpp
int x = 1;
int y = x;
y = 2;
// x 仍然是 1
```

C++ 标准库类型（如 `std::string`、`std::vector`）默认倾向于表现为值类型。这样做的好处是：

- 对象生命周期清晰；
- 所有权明确；
- 代码局部性强，容易推理；
- 修改副本不会产生隐式共享导致的意外影响。

值语义的传统代价是：如果对象内部资源很大，复制可能很昂贵。C++11 引入移动语义，就是为了在保留值语义直观性的同时，避免不必要的深拷贝。

### 3.1.2 引用语义：多个名字共享同一对象

引用语义指的是：赋值或传递时复制的是某种“引用”或“句柄”，多个变量指向同一个底层对象。很多动态语言和托管语言中，对普通对象赋值往往采用这种模型。

引用语义的优势是复制成本低，但也带来几个问题：

- 共享关系可能是隐式的；
- 修改一个名字看到的对象，其他名字也会受影响；
- 所有权和生命周期不容易从局部代码判断；
- 多线程或复杂控制流下容易出现别名问题。

在 C++ 中，如果确实需要引用语义，通常通过指针或智能指针表达：

```cpp
#include <memory>

struct Obj {
    void calc();
};

std::unique_ptr<Obj> p1 = std::make_unique<Obj>();
p1->calc();

std::shared_ptr<Obj> p2 = std::make_shared<Obj>();
std::shared_ptr<Obj> p3 = p2; // p2 和 p3 共享同一对象
```

需要注意：

- 裸指针 `T*` 只表达“指向”，不自动表达所有权；
- `std::unique_ptr<T>` 表示独占所有权；
- `std::shared_ptr<T>` 表示共享所有权；
- 指针语法和对象语法不同，例如 `ptr->member()`；
- 若没有明确共享或多态需求，应优先使用值语义。

### 3.1.3 实践建议

- 默认使用值语义，除非有明确理由使用引用语义。
- 不要仅仅因为担心复制成本就过早改用指针；现代 C++ 的移动语义和返回值优化已经能消除大量复制。
- 需要表达所有权时，优先使用智能指针，而不是裸指针。
- 如果一个类型看起来像普通值，就应尽量让它满足普通值的直觉：可复制时应复制出独立副本，不应隐式共享可变状态。

---

## 3.2 值类别

C++ 表达式不仅有类型，还有**值类别**（value category）。值类别会影响：

- 表达式能否出现在赋值号左侧；
- 表达式是否表示一个可定位的对象；
- 它能绑定到左值引用还是右值引用；
- 它是否可以作为移动操作的资源来源。

### 3.2.1 值类别分类

现代 C++ 的值类别可概括为：

```text
expression
├── glvalue 泛左值
│   ├── lvalue 左值
│   └── xvalue 将亡值
└── rvalue 右值
    ├── prvalue 纯右值
    └── xvalue 将亡值
```

| 术语        | 全称                 | 含义                          |
| --------- | ------------------ | --------------------------- |
| `lvalue`  | left value         | 有身份、可定位，通常能出现在赋值号左边的表达式。    |
| `rvalue`  | right value        | 通常只能出现在赋值号右边，常表示临时结果或可移动对象。 |
| `glvalue` | generalized lvalue | 泛左值，包括左值和将亡值，表示有对象身份。       |
| `prvalue` | pure rvalue        | 纯右值，通常表示临时计算结果。             |
| `xvalue`  | expiring value     | 将亡值，有身份但资源可被“窃取”或移动。        |

`xvalue` 同时属于 `glvalue` 和 `rvalue`：它有对象身份，但又表示对象资源即将失效或可被转移。

### 3.2.2 左值

左值通常表示一个具有明确身份、能被定位的对象或函数。

常见左值包括：

1. 变量名、函数名、数据成员名；
2. 左值对象的成员或数组元素；
3. 返回左值引用的表达式；
4. 赋值表达式、前置自增表达式等返回自身引用的表达式；
5. 字符串字面量。

```cpp
int x = 0;
int y = 0;

x = 1;       // x 是左值
y = x = 2;   // x = 2 的结果仍表示 x 本身
++x = 3;     // 前置 ++x 返回 x 的左值引用
```

流输出能链式调用，也是因为运算符返回流对象本身的引用：

```cpp
#include <iostream>

std::cout << 'C' << '+' << '+';
```

这里 `std::cout << 'C'` 的结果仍是 `std::cout` 的引用，因此可以继续接 `<< '+'`。

字符串字面量比较特殊：

```cpp
const char* p = "hello";
```

`"hello"` 虽然看起来像临时值，但它有静态存储期，对应固定存储区域，因此在 C++ 中属于左值。

#### 左值引用绑定规则

```cpp
void read(const int& x);
void write(int& x);

int a = 1;
const int ca = 2;

read(a);   // OK，非 const 左值可绑定到 const 左值引用
read(ca);  // OK，const 左值可绑定到 const 左值引用
write(a);  // OK，非 const 左值可绑定到非 const 左值引用
// write(ca); // 错误，不能把 const 左值绑定到非 const 左值引用
```

实践规则：

- 函数只读取参数时，优先使用 `const T&`；
- 函数需要修改实参时，使用 `T&`；
- 不要用非 `const` 左值引用接收 `const` 对象或临时对象。
- 一般而言，非`const`左值可以放在赋值号的左侧，是名副其实的左值，而`const`左值虽然也是左值，实际并不能放到赋值号左侧

### 3.2.3 右值

右值包括纯右值和将亡值。

#### 纯右值 `prvalue`

纯右值通常表示临时计算结果或无持久身份的值。

常见纯右值：
```cpp
42;                 // 大多数字面量
true;
nullptr;

x + 1;              // 算术表达式结果
x++;                // 后置自增返回旧值的临时副本
make_obj();         // 返回非引用类型的函数调用
std::make_shared<int>(42);
```

字符串字面量是例外，它是左值，不是纯右值。

#### 将亡值 `xvalue`

将亡值表示一个有身份、但资源可以被转移的对象。它是移动语义的关键。

常见将亡值：

```cpp
std::move(obj);       // 返回右值引用的表达式
static_cast<T&&>(obj);
make_obj().member;    // 右值对象的成员
make_obj().array[0];
```

`std::move` 的名字容易误导：它本身并不移动任何资源，只是把表达式转换成右值引用表达式，使后续的移动构造或移动赋值有机会发生。

```cpp
#include <utility>
#include <string>

std::string a = "hello";
std::string b = std::move(a); // 真正移动发生在 string 的移动构造中
```

移动后，`a` 仍然是一个有效对象，可以析构、重新赋值，但不要依赖它原来的内容。

### 3.2.4 右值可以放在赋值号左侧吗？

一般来说，右值不应放在赋值号左边。但 C++ 的类型系统允许类通过成员函数设计出一些看似奇怪的行为，例如对临时对象赋值：

```cpp
struct Obj {};

Obj make_obj();

make_obj() = Obj{}; // 某些类型设计下可能通过编译，但通常没有意义
```

C++11 引入成员函数引用限定符，可以限制某些成员函数只能由左值对象调用：

```cpp
struct Obj {
    Obj& operator=(const Obj&) & = default;
};
```

末尾的 `&` 表示该赋值运算符只能用于左值对象，从而避免对临时对象赋值这类不符合直觉的写法。

---

## 3.3 移动语义

移动语义解决的问题是：当源对象即将不再被使用时，与其昂贵地复制资源，不如直接把资源所有权转移给目标对象。

### 3.3.1 提供移动操作的重载

资源管理类通常需要区分“复制”和“移动”。以简化版 `vector` 为例，它内部可能维护三根指针：

```cpp
template <typename T>
class Vector {
public:
    Vector(const Vector& rhs);             // 拷贝构造
    Vector& operator=(const Vector& rhs);  // 拷贝赋值

    Vector(Vector&& rhs) noexcept;         // 移动构造
    Vector& operator=(Vector&& rhs) noexcept; // 移动赋值

    ~Vector();

private:
    T* begin_ = nullptr;
    T* end_ = nullptr;
    T* end_cap_ = nullptr;
};
```

三个指针的含义：

| 成员 | 含义 |
| --- | --- |
| `begin_` | 已分配内存的起始位置。 |
| `end_` | 已构造元素的末尾后一位。 |
| `end_cap_` | 已分配内存的末尾后一位。 |

大小和容量可表示为：

```cpp
size()     == end_ - begin_;
capacity() == end_cap_ - begin_;
```

#### 拷贝构造：深拷贝资源

拷贝构造需要为目标对象分配新内存，并逐个构造元素：

```cpp
template <typename T>
Vector<T>::Vector(const Vector& rhs) {
    auto n = rhs.end_ - rhs.begin_;
    begin_ = allocate(n);
    end_ = begin_;
    end_cap_ = begin_ + n;

    try {
        for (T* p = rhs.begin_; p != rhs.end_; ++p, ++end_) {
            new (end_) T(*p);
        }
    } catch (...) {
        destroy(begin_, end_);
        deallocate(begin_);
        begin_ = end_ = end_cap_ = nullptr;
        throw;
    }
}
```

这类操作通常是 `O(N)`，而且需要处理异常安全：一旦某个元素构造失败，已经构造的元素必须正确析构，内存必须释放。

#### 移动构造：接管资源

移动构造不复制元素，而是直接接管源对象的内部资源：

```cpp
template <typename T>
Vector<T>::Vector(Vector&& rhs) noexcept
    : begin_(rhs.begin_),
      end_(rhs.end_),
      end_cap_(rhs.end_cap_) {
    rhs.begin_ = nullptr;
    rhs.end_ = nullptr;
    rhs.end_cap_ = nullptr;
}
```

关键点：

- 目标对象拿走源对象的内存；
- 源对象被置为空状态；
- 源对象仍然有效，可以析构或重新赋值；
- 不逐个复制元素，因此通常是 `O(1)`。

移动构造和移动赋值若不会抛异常，应声明为 `noexcept`。标准库容器在扩容、搬迁元素时，会根据移动操作是否 `noexcept` 决定能否安全使用移动。如果移动可能抛异常，容器为了维持异常安全保证，可能退回使用拷贝。

### 3.3.2 移动对返回值的影响

C++11 之前，返回局部对象常被认为可能产生昂贵拷贝。现代 C++ 中，返回对象的成本通常由两类机制降低：

1. 返回值优化（RVO / NRVO）直接消除临时对象；
2. 如果优化不能发生，也可以使用移动构造代替深拷贝。

例如：

```cpp
#include <string>

std::string greeting(const std::string& name) {
    std::string result = "Hello, ";
    result += name;
    result += ".";
    return result;
}
```

推荐直接 `return result;`。不要为了“优化”写成：

```cpp
return std::move(result); // 通常不推荐
```

原因：

- 编译器本来可能对 `return result;` 做命名返回值优化；
- `std::move(result)` 把返回表达式变成右值表达式，可能抑制 NRVO；
- 即使 NRVO 不发生，编译器也通常能使用移动构造。

### 3.3.3 返回值优化

为了观察复制、移动和析构，可以定义一个带日志的类型：

```cpp
#include <iostream>
using std::cout;

class A {
public:
    A() { cout << "Create A\n"; }
    ~A() { cout << "Destroy A\n"; }

    A(const A&) { cout << "Copy A\n"; }
    A(A&&) noexcept { cout << "Move A\n"; }

    A& operator=(const A&) {
        cout << "Copy= A\n";
        return *this;
    }

    A& operator=(A&&) noexcept {
        cout << "Move= A\n";
        return *this;
    }
};
```

#### 未命名返回值优化

```cpp
A get_unnamed_rvo() {
    return A{};
}

int main() {
    A a = get_unnamed_rvo();
}
```

现代编译器通常会直接在 `a` 的存储位置构造对象，只看到一次构造和一次析构。这类优化称为未命名返回值优化。

#### 命名返回值优化

```cpp
A get_named_rvo() {
    A a;
    return a;
}
```

如果编译器执行 NRVO，局部变量 `a` 也可以直接构造在调用方的返回对象位置上。若 NRVO 没发生，C++11 之后通常会尝试移动，而不是拷贝。

#### `std::move` 会抑制 NRVO

```cpp
A get_named_rvo_suppressed() {
    A a;
    return std::move(a); // 不推荐
}
```

这里显式 `std::move` 会使返回表达式不再是直接的局部变量名，常见结果是无法应用 NRVO，只能执行一次移动构造。

#### 返回值优化不可用的情况

多个候选返回对象可能让 NRVO 无法应用：

```cpp
A get_no_rvo_1(bool cond) {
    A a;
    if (cond) {
        return A{};
    }
    return a;
}

A get_no_rvo_2(bool cond) {
    A a1;
    A a2;
    if (cond) {
        return a1;
    }
    return a2;
}
```

这些情况下，编译器可能无法把唯一的局部对象固定为返回对象，因而需要移动构造最终返回值。

### 3.3.4 实践建议

- 资源管理类应提供正确的移动构造和移动赋值。
- 移动操作后，源对象必须处于可析构、可重新赋值的有效状态。
- 不会抛异常的移动构造和移动赋值应标记 `noexcept`。
- 返回局部对象时直接写 `return obj;`，通常不要写 `return std::move(obj);`。
- 不要把 `std::move` 理解成移动动作；它只是值类别转换。

---

## 3.4 值类别的其他细节

### 3.4.1 右值引用变量的类型

一个容易混淆的规则：**有名字的变量作为表达式使用时是左值，即使它的类型是右值引用。**

```cpp
#include <utility>

struct Obj {};

void bar(const Obj&); // 处理左值或 const 绑定
void bar(Obj&&);      // 处理右值

void foo(Obj&& obj) {
    bar(obj);            // 调用 bar(const Obj&)，因为 obj 是具名变量，是左值表达式
    bar(std::move(obj)); // 调用 bar(Obj&&)
}
```

结论：

- `Obj&& obj` 说明 `obj` 的声明类型是右值引用；
- 但表达式 `obj` 有名字、可定位，因此是左值；
- 如果要继续把它作为可移动对象传出，需要显式使用 `std::move(obj)`。

这也是为什么移动构造函数内部若要把成员继续移动到其他对象中，仍需要写 `std::move(member)`。

### 3.4.2 转发引用和完美转发

考虑一个包装函数，希望把参数原样转发给 `bar`：

```cpp
template <typename T>
void foo(T obj) {
    bar(obj);
}
```

问题：

- `obj` 是按值传入，会产生额外构造；
- 函数体内 `obj` 是具名变量，因此是左值；
- 调用者传入右值时，`bar(obj)` 也无法保留右值属性。

现代 C++ 使用转发引用和 `std::forward`：

```cpp
#include <utility>

template <typename T>
void foo(T&& obj) {
    bar(std::forward<T>(obj));
}
```

当 `T&&` 出现在函数模板参数中，并且 `T` 需要由调用实参推导时，它不是普通右值引用，而是**转发引用**。

```cpp
Obj obj;
foo(obj);   // T 推导为 Obj&，参数类型经引用折叠后为 Obj&
foo(Obj{}); // T 推导为 Obj，参数类型为 Obj&&
```

#### 引用折叠规则

```text
T&  &   -> T&
T&  &&  -> T&
T&& &   -> T&
T&& &&  -> T&&
```

记忆方式：只要出现左值引用 `&`，结果就是左值引用；只有两个都是右值引用时，结果才是右值引用。

#### `std::move` 与 `std::forward`

| 工具                   | 作用                          | 典型场景                 |
| -------------------- | --------------------------- | -------------------- |
| `std::move(x)`       | 无条件把 `x` 转成右值表达式。           | 当前作用域明确不再需要 `x` 的原值。 |
| `std::forward<T>(x)` | 根据 `T` 的推导结果，有条件地保留左值或右值属性。 | 函数模板中转发 `T&&` 参数。    |

错误示例：

```cpp
template <typename T>
void foo(T&& obj) {
    bar(std::move(obj)); // 会把左值实参也强行转成右值
}
```

正确示例：

```cpp
template <typename T>
void foo(T&& obj) {
    bar(std::forward<T>(obj));
}
```

如果调用者传入左值，`bar` 接收到左值；如果调用者传入右值，`bar` 接收到右值。这就是完美转发的目标。

### 3.4.3 “万能引用”和“转发引用”

Scott Meyers 曾把模板中的 `T&&` 称为“万能引用”，因为它既能绑定左值，也能绑定右值。标准术语更倾向于称为**转发引用**。

并不是所有 `&&` 都是转发引用：

```cpp
void f(Obj&& obj); // 普通右值引用

template <typename T>
void g(T&& obj);   // T 由实参推导时，T&& 是转发引用

template <typename T>
void h(const T&& obj); // 不是典型转发引用，const 会破坏完美转发能力
```

判断标准：

- 形式必须是未加额外修饰的 `T&&`；
- `T` 必须由当前调用的实参推导；
- 常与 `std::forward<T>` 成对出现。

---

## 3.5 三法则、五法则和零法则

特殊成员函数决定了对象如何构造、复制、移动、赋值和销毁。

现代 C++ 中常关注的特殊成员函数包括：

1. 析构函数；
2. 拷贝构造函数；
3. 拷贝赋值运算符；
4. 移动构造函数；
5. 移动赋值运算符。

### 3.5.1 三法则

三法则：如果一个类需要显式定义下面三者之一，通常也需要考虑另外两个：

- 析构函数；
- 拷贝构造函数；
- 拷贝赋值运算符。

原因是：显式析构通常意味着类在管理资源；一旦管理资源，默认浅拷贝往往不安全。

```cpp
struct Shape {
    virtual ~Shape() = default;
};

class ShapeWrapper {
public:
    explicit ShapeWrapper(Shape* ptr = nullptr) : ptr_(ptr) {}

    ~ShapeWrapper() {
        delete ptr_;
    }

private:
    Shape* ptr_ = nullptr;
};
```

这个类拥有 `ptr_` 指向的对象。如果使用编译器生成的默认拷贝构造和默认拷贝赋值，就会发生浅拷贝：两个 `ShapeWrapper` 指向同一个 `Shape`，最后可能重复 `delete`，导致未定义行为。

如果不希望它可复制，应明确禁用拷贝：

```cpp
class ShapeWrapper {
public:
    explicit ShapeWrapper(Shape* ptr = nullptr) : ptr_(ptr) {}

    ~ShapeWrapper() {
        delete ptr_;
    }

    ShapeWrapper(const ShapeWrapper&) = delete;
    ShapeWrapper& operator=(const ShapeWrapper&) = delete;

private:
    Shape* ptr_ = nullptr;
};
```

`= delete` 比旧式“声明为 private 但不定义”更清楚，错误信息也更直接。

### 3.5.2 五法则

C++11 引入移动语义后，三法则扩展为五法则：如果一个类需要自定义析构、拷贝构造或拷贝赋值，也应系统考虑移动构造和移动赋值。

对 `ShapeWrapper` 这种独占资源的类型，合理做法是：禁止拷贝，允许移动。

```cpp
class ShapeWrapper {
public:
    explicit ShapeWrapper(Shape* ptr = nullptr) : ptr_(ptr) {}

    ~ShapeWrapper() {
        delete ptr_;
    }

    ShapeWrapper(const ShapeWrapper&) = delete;
    ShapeWrapper& operator=(const ShapeWrapper&) = delete;

    ShapeWrapper(ShapeWrapper&& rhs) noexcept
        : ptr_(rhs.ptr_) {
        rhs.ptr_ = nullptr;
    }

    ShapeWrapper& operator=(ShapeWrapper&& rhs) noexcept {
        if (this != &rhs) {
            delete ptr_;
            ptr_ = rhs.ptr_;
            rhs.ptr_ = nullptr;
        }
        return *this;
    }

private:
    Shape* ptr_ = nullptr;
};
```

移动操作的关键：

- 接管源对象资源；
- 把源对象置为安全空状态；
- 处理移动赋值时先释放当前资源；
- 检查自赋值；
- 若不会抛异常，标记 `noexcept`。

### 3.5.3 `= default` 和 `= delete`

```cpp
struct Value {
    Value() = default;
    ~Value() = default;

    Value(const Value&) = default;
    Value& operator=(const Value&) = default;
};
```

`= default` 表示显式要求编译器生成默认实现，适合表达“默认语义就是正确的”。

```cpp
struct NonCopyable {
    NonCopyable() = default;
    NonCopyable(const NonCopyable&) = delete;
    NonCopyable& operator=(const NonCopyable&) = delete;
};
```

`= delete` 表示明确禁止调用某个函数，常用于禁止拷贝、禁止某些重载或表达类型约束。

### 3.5.4 特殊成员函数的生成规则

需要记住几个实践层面的规则：

- 如果用户声明了析构函数、拷贝构造函数或拷贝赋值运算符，编译器通常不会再自动生成移动构造和移动赋值。
- 如果用户声明了移动构造函数或移动赋值运算符，默认拷贝构造和默认拷贝赋值可能会被删除。
- 如果类拥有裸资源指针，默认移动也往往只是复制指针值，不能直接代表安全的所有权转移。
- 编译器默认生成的拷贝操作在某些“用户已声明析构或拷贝操作”的场景中虽可能存在，但这种依赖容易过时且不清晰，应显式表达意图。

### 3.5.5 零法则

零法则：如果可以不写特殊成员函数，就不要写。

也就是说，不要让普通业务类直接管理裸资源，而应把资源管理交给标准库或专门的 RAII 类型。

```cpp
#include <memory>

class ShapeWrapper {
public:
    explicit ShapeWrapper(std::unique_ptr<Shape> ptr = nullptr)
        : ptr_(std::move(ptr)) {}

private:
    std::unique_ptr<Shape> ptr_;
};
```

使用 `std::unique_ptr` 后：

- 析构自动释放资源；
- 拷贝默认被禁止；
- 移动默认可用；
- 类本身不必手写析构、拷贝或移动函数。

零法则的好处：

- 代码更短；
- 异常安全更可靠；
- 不容易重复释放或泄漏资源；
- 编译器和标准库类型能提供正确的默认行为。

### 3.5.6 实践建议

- 普通类优先遵循零法则。
- 直接管理资源的底层类才需要手写特殊成员函数。
- 一旦写了析构、拷贝或移动中的任何一个，就检查另外几个是否也需要显式定义、默认或删除。
- 移动构造和移动赋值若不抛异常，应加 `noexcept`。
- 不要写无意义的空析构函数；它可能改变编译器生成移动操作的规则。

---

## 3.6 小结

本章的主线是：现代 C++ 通过值类别和移动语义，让自定义类型既能保持值语义的直观性，又能避免不必要的深拷贝。

关键结论：

- C++ 默认鼓励值语义；引用语义应通过指针、智能指针或引用显式表达。
- 表达式的类型和值类别是两回事；`T&&` 类型的具名变量仍是左值表达式。
- `std::move` 不移动对象，只把表达式转换成可移动的右值表达式。
- `std::forward` 用于模板转发引用，保留实参原本的左值或右值属性。
- 移动构造和移动赋值通过资源接管避免深拷贝，源对象必须保持有效但状态未指定。
- 返回局部对象时通常直接 `return obj;`，让编译器应用 RVO/NRVO 或移动语义。
- 管理资源的类应遵循三法则/五法则；更好的设计是遵循零法则，把资源交给 RAII 成员管理。

---

## 关键术语表

| 术语 | 解释 |
| --- | --- |
| 值语义 | 对象赋值或传递时得到独立副本，修改副本不影响原对象。 |
| 引用语义 | 多个名字或句柄共享同一个底层对象。 |
| 左值 `lvalue` | 有身份、可定位，通常可出现在赋值号左侧的表达式。 |
| 右值 `rvalue` | 通常表示临时值或可移动值的表达式。 |
| 泛左值 `glvalue` | 有对象身份的表达式，包括左值和将亡值。 |
| 纯右值 `prvalue` | 临时计算结果或无持久身份的值。 |
| 将亡值 `xvalue` | 有身份且资源可被移动的表达式。 |
| 右值引用 `T&&` | 可绑定到右值的引用类型，是移动语义的基础。 |
| 移动语义 | 通过转移资源所有权代替昂贵复制的机制。 |
| `std::move` | 无条件把表达式转换成右值表达式。 |
| `std::forward` | 在模板中按原值类别转发实参。 |
| 转发引用 | 模板参数推导场景中的 `T&&`，可绑定左值和右值。 |
| 引用折叠 | 引用的引用折叠成单一引用类型的规则。 |
| RVO | 返回值优化，直接在目标位置构造返回对象。 |
| NRVO | 命名返回值优化，对返回局部命名对象的优化。 |
| 三法则 | 若自定义析构、拷贝构造、拷贝赋值之一，通常要考虑三者。 |
| 五法则 | 在三法则基础上加入移动构造和移动赋值。 |
| 零法则 | 尽量不手写特殊成员函数，把资源管理交给 RAII 成员。 |
| `= default` | 显式要求编译器生成默认实现。 |
| `= delete` | 显式禁止某个函数被调用。 |
| `noexcept` | 声明函数不抛异常，可帮助标准库容器安全使用移动操作。 |
