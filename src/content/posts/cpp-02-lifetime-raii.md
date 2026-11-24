---
title: "对象生存期和 RAII"
description: "构造与析构、拷贝与移动、RAII 与异常安全：对象从创建到销毁的完整生命周期。"
pubDate: 2026-10-26
tags:
  - "C++"
  - "RAII"
category: course
series: cpp
order: 2
cover: /covers/post-code-cpp.svg
---

## C++ 对象的存储期和生存期
C++ 中有四种对象存储期：
- **静态：** 在整个程序的运行期间有固定的空间
- **动态：** 使用动态内存分配函数来管理其空间
- **自动：** 函数内自动分配和释放空间
- **线程局部：** 和静态类似，但不同的线程使用不同的对象（C++11 引入）

与存储期紧密相关的概念是生存期，也叫生命周期，也就是对象有效、可以被安全访问的时间。生存期可以跟存储期不同步——**特别地，我们可以通过 placement new（或 `std::construct_at`）手动构造对象并显式调用析构函数来控制对象的生存期**。

### 静态对象的生存期
当我们声明全局变量或者 static 变量的时候，该变量具有静态存储期。链接器负责为其分配固定的内存空间。在每次程序运行过程中，该变量的地址是固定的，不会发生变化。
> **链接器：** 不同翻译单元中的符号（函数、变量）通过链接器跨单元解析
```cpp
#include <string>

int count;  // (1)

static std::string msg;  // (2)
// std::string 即使写成 static std::string msg; 没有显式初值，也属于动态初始化，因为默认构造函数需要运行时执行。

class Obj {
    ...
private:
    static std::string name;  // (3)
};
// 类的静态成员变量一般在类内部声明，在类外部（一般在单独源文件）进行定义

std::string Obj::name;  // (3)

void func() {
    static std::string s;  // (4)
}
```

上面的四个变量都具有静态存储期，在编译生成的目标文件中可以找到这些符号。其中（1）和（3）是全局符号，如果在链接时发现多个目标文件中有同名符号，那链接器会报错。（2）和（4）是局部符号，可以在多个翻译单元出现。

> **翻译单元：** **一个源文件**（如 `.cpp`）**加上它通过 `#include` 引入的所有头文件内容**，经过**预处理器**处理后形成的完整代码文本。

对于（1）的简单对象，对象的生存期等于存储期，可以在编译的时候直接对内容进行初始化（静态初始化）。但是（2）、（3）、（4）有构造或析构函数，所以需要一个动态初始化的过程。

- （2）和（3）是同样的情况，**符号的全局性对对象的生存期没有影响**：
  - 在每个翻译单元，编译器按对象定义的先后顺序调用构造函数，同时把调用析构函数的代码注册到全局清理代码。
  - 当程序正常终止（`main` 返回或调用 `std::exit`，不含 `std::abort`/`std::quick_exit` 或未捕获异常触发 `std::terminate`）时，这些已注册的清理代码按逆序执行。不同翻译单元的静态对象之间没有规定的初始化顺序，但进入 `main` 之前通常都会完成。
- （4）是局部静态变量。`func` 第一次执行到 `s` 的声明时才构造 `s`，并注册退出时的析构逻辑。**C++ 编译器保证即便多线程同时调用 `func`，这一初始化也只会发生一次。**

---

### 动态对象的生存期
C++ 标准在内存方面没有堆（heap）的概念，而是使用自由存储区（free store）来指代使用 `new` 和 `delete` 运算符分配和释放内存的区域。一般而言，这是堆的一个子集。
> 但动态内存有不确定性——内存分配耗时多少？失败了怎么办？至今仍有很多场合限制动态内存的使用，尤其是实时性要求比较高的控制系统。

在堆上分配内存，有些语言使用 `new`（如 C++、Java），也有语言在构造对象时隐式分配（如 Python）。运行期内存管理器通常围绕三件事协作，而 C++ 一般只用前两项、Java 侧重分配与 GC、Python 三者兼有：

- **分配内存**：可用空间充足时从空闲块划出一段并做簿记，不足时向操作系统申请扩充（支持 GC 的运行环境此时也可能触发回收）。
- **释放内存**：不只是标记空闲，通常还会把相邻空闲块合并，以便后续满足更大的连续虚拟地址分配需求。
- **垃圾收集**：用不同策略自动寻回不可达对象，在吞吐、停顿时间和额外开销之间折中。

实际分配器交给代码的内存往往略大于请求尺寸，代码只能访问已获授权的那一段，剩余空闲区间留给后续分配复用。

---

漏掉 `delete` 是常见情况，这叫**内存泄漏**。先看一段代码：
```cpp
void foo()
{
    Obj* ptr = new Obj();
    ...
    delete ptr;
}
```
这段代码有两个问题：
1. 中间省略的代码部分也许会抛出异常，导致最后的 `delete ptr;` 得不到执行。
2. 这段代码不符合 C++ 的惯用法。在 C++ 里，当对象大小可控且无需超出当前作用域存活时，应直接分配在栈上，而不是手动 `new`/`delete`。
如果内存的分配和释放不在一个函数里，那就更容易出问题了。比如下面这样：
```cpp
Obj* makeObj(...)
{
    Obj* ptr = nullptr;
    try {
        ptr = new Obj();
        ...
    }
    catch (...) {
        delete ptr;
        throw;
    }
    return ptr;
}

void foo()
{
    ...
    Obj* ptr = makeObj(...)
    ...
    delete ptr;
}
```

漏调用 `delete` 损失的不止是内存。如果你在析构函数里有工作要做，那么漏调用 `delete` 时那些代码也就得不到执行了。`new` 一个对象和 `delete` 一个指针时，编译器会在背后生成多步操作，大致等价于：

```cpp
// new Obj(...)
{
    void* temp = operator new(sizeof(Obj));
    try {
        Obj* ptr = static_cast<Obj*>(temp);
        ptr->Obj(...); // 伪代码：在 temp 所指内存上就地构造 Obj（placement new）
        return ptr;
    }
    catch (...) {
        operator delete(temp);
        throw;
    }
}

// delete ptr
if (ptr != nullptr) {
    ptr->~Obj();
    operator delete(ptr);
}
```

`new` 的时候先分配内存（失败时整个操作失败并向外抛出异常，通常是 `bad_alloc`），然后在结果指针上构造对象。构造成功则 `new` 操作整体完成，否则释放刚分配的内存，继续向外抛出构造函数产生的异常。`delete` 时则判断指针是否为空；不为空时调用析构函数，再释放之前分配的内存。

---

### 自动类型的生存期
当我们在函数里声明非 `static` 的局部变量时，就在使用**自动存储期**：
- 自动存储期的变量可以抽象看作存放在 **栈（stack）** 上，栈满足「后进先出」（LIFO, last-in-first-out）的特性。
- 自动存储期的对象会自动释放占用的存储空间，无需手动管理，也就避免了内存泄漏。
```cpp
void foo(int n)
{
    // ...
}

void bar(int n)
{
    int a = n + 1;
    foo(a);
}

int main()
{
    // ...
    bar(42);
    // ...
}
```
#### 栈的工作过程
1. **栈的增长方向**：在包括 x86 在内的大部分计算机体系架构中，栈的增长方向是朝向**低地址**，即「上方」对应低地址。
2. **函数调用的栈操作**：
    - 函数调用时，会将参数（忽略寄存器传参的情况）、返回地址（下一条汇编指令的地址）压入栈中。
    - 新函数进入后，会保存必要的上下文、调整栈指针，分配局部变量所需的栈空间。
    - 函数执行完毕后，根据返回地址回到调用者的代码继续执行。
3. **栈帧（Stack Frame）**：每个函数占用的栈空间称为栈帧。GCC/Clang 中的 `-fomit-frame-pointer` 参数即和栈帧相关。
#### 栈上内存管理的特点
- 分配简单：移动栈指针即可完成分配。
- 释放简单：函数执行结束时移动栈指针即可完成释放。
- 无内存碎片：后进先出的特性保证了栈上不会出现内存碎片。
#### 自动对象的构造与析构
- 对于有构造 / 析构函数的非平凡类型（非 POD 类型），栈上的内存分配同样有效：编译器会在合适位置自动插入构造函数和析构函数的调用。
- 自动存储期的对象的**生存期和存储期一致**：对象的生存期由作用域决定，超出作用域时会自动调用析构函数。
#### 栈展开（Stack Unwinding）与异常安全
当函数执行发生异常时，C++ 会通过 **栈展开（stack unwinding）** 机制，确保所有已创建的自动对象的析构函数被调用。
```cpp
#include <cstdio>

class Obj {
public:
    Obj() { puts("Obj()"); }
    ~Obj() { puts("~Obj()"); }
};

void foo(int n)
{
    Obj obj;
    if (n == 42) {
        throw "life, the universe and everything";
    }
}

int main()
{
    try {
        foo(41);
        foo(42);
    }
    catch (const char* s) {
        puts(s);
    }
}
```
#### 执行结果
```text
Obj()
~Obj()
Obj()
~Obj()
life, the universe and everything
```
#### 结果说明
无论是否发生异常，`obj` 的析构函数都会执行：
- `foo(41)` 正常执行，函数结束时 `obj` 析构。
- `foo(42)` 抛出异常，栈展开过程中 `obj` 的析构函数依然会被调用；之后异常被 `catch` 捕获并输出信息。
#### 关键结论
C++ 中自动变量的**确定性析构行为**（到达作用域尾部时自动调用析构，包括异常场景下的栈展开）是其最重要的特性之一，也是 RAII（资源获取即初始化）技术的基础。
> 使用 MSVC 编译含异常的 C++ 代码时，若未启用 `/EHsc` 选项，编译器会报出警告：
> `warning C4530: C++ exception handler used, but unwind semantics are not enabled. Specify /EHsc`
> 该警告提示开发者需要启用栈展开语义，以保证异常场景下析构函数能被正确调用。

---

#### 临时对象的生存期
在 C++ 中，除了具名变量，还会创建**临时对象**，常见场景包括：
- 直接调用构造函数创建对象（如 `Circle()`）
- 调用返回类型不是指针或引用的函数（返回值会生成临时对象）
临时对象的基础生存期规则：
> 在 **产生临时对象的完整表达式（大致可理解为单条语句）** 执行结束时，临时对象的生存期就会结束，其析构函数会被立即调用。

#### 临时对象的构造与析构顺序示例
```cpp
process_shape(Circle(), Triangle());
```
- C++ 标准**未规定** `Circle()` 和 `Triangle()` 临时对象的构造顺序；
- 但在 `process_shape` 函数调用结束时，两个临时对象一定会以**与构造顺序相反的顺序被析构**。
```cpp
#include <cstdio>  // puts

class Shape {
public:
    virtual ~Shape() {}
};

class Circle : public Shape {
public:
    Circle() { puts("Circle()"); }
    ~Circle() { puts("~Circle()"); }
};

class Triangle : public Shape {
public:
    Triangle() { puts("Triangle()"); }
    ~Triangle() { puts("~Triangle()"); }
};

class Result {
public:
    Result() { puts("Result()"); }
    ~Result() { puts("~Result()"); }
};

Result process_shape(const Shape& shape1, const Shape& shape2)
{
    puts("process_shape()");
    return Result();
}

int main()
{
    puts("main()");
    process_shape(Circle(), Triangle());
    puts("something else");
}
```
输出结果
```text
main()
Circle()
Triangle()
process_shape()
Result()
~Result()
~Triangle()
~Circle()
something else
```
> 注：`Circle()` 和 `Triangle()` 的输出顺序可以对调，两种都是合法的。

#### 临时对象的生存期延长规则

C++ 有一条特殊规则：
> 当临时对象被绑定到一个 **const 引用变量** 上时，它的生存期会延长到与该引用变量的生存期一致。

将 `main` 中的调用语句改为：
```cpp
const Result& r = process_shape(Circle(), Triangle());
```
修改后的输出结果
```text
main()
Circle()
Triangle()
process_shape()
Result()
~Triangle()
~Circle()
something else
~Result()
```
`Result` 临时对象的析构被延迟到 `main` 函数结束时（`something else` 输出之后），和引用变量 `r` 的生存期一致。

#### 返回局部变量的引用 / 指针的风险

返回对象的引用或指针可以规避复制操作，但存在严重的安全风险：

**核心原则：** 不要返回自动局部变量的指针或引用。

*错误示例：*
```cpp
int* get()
{
    int n = 42;
    return &n;  // 危险！
}
```
- 函数返回时，局部变量 `n` 的生存期已经结束，返回的指针会指向一个已销毁的对象，形成**悬空指针（dangling pointer）/ 悬空引用**。
- 访问悬空指针指向的对象属于**未定义行为**：
    - 如果对象有析构函数且包含清理逻辑，错误可能会较快暴露；
    - 如果对象是平凡类型（如 `int`），代码可能看似正常工作（编译器未复用栈空间），但后续修改代码或编译选项时，会突然出现难以排查的错误。
现代编译器通常会对这类代码发出警告，但这并非语法错误，无法从根本上杜绝风险。

---

## RAII 惯用法
### 1. RAII 的核心概念
RAII 是 **Resource Acquisition Is Initialization（资源获取即初始化）** 的缩写，核心思想是：
> 利用**自动对象的确定性析构行为**，对所有资源（包括堆内存）进行管理。RAII 的重点是**清理**，不是初始化。

RAII 让 C++ 无需依赖垃圾回收（GC）就能高效管理内存，这也是 GC 从未在 C++ 中流行的主要原因。RAII 是 C++ 资源管理的核心惯用法，Ada、D、Rust 等语言也采用了类似机制。

### 2. 对象不能总是放在栈上的场景
C++ 的惯用方式是将对象存储在栈上，但以下场景中，对象**不能或不应该**存放在栈上：
- 对象体积过大，存在栈溢出的风险；
- 对象的大小在编译期无法确定；
- 函数返回多态类型时，不能直接返回对象值（会导致对象切片）。

### 3. 工厂方法与对象切片问题

#### 工厂方法示例
工厂方法常返回基类指针 / 引用，以支持多态：
```cpp
enum class ShapeType {
    circle,
    triangle,
    rectangle,
    // ...
};

class Shape { /* ... */ };
class Circle : public Shape { /* ... */ };
class Triangle : public Shape { /* ... */ };
class Rectangle : public Shape { /* ... */ };

Shape* createShape(ShapeType type)
{
    switch (type) {
        case ShapeType::circle:
            return new Circle(/*...*/);
        case ShapeType::triangle:
            return new Triangle(/*...*/);
        case ShapeType::rectangle:
            return new Rectangle(/*...*/);
        default:
            return nullptr;
    }
}
```

#### 对象切片（Object Slicing）
如果函数返回值类型是基类 `Shape` 而非指针 / 引用，会发生对象切片：
- 编译器会调用 `Shape` 的拷贝构造函数，用派生类对象（如 `Circle`）构造一个基类对象，丢失派生类的成员数据，导致语义错误。
- 这是 C++ 特有的陷阱，语法上合法但结果错误，编译器通常不会告警。

**解决方法：**
遵循 C++ Core Guidelines 条款 **C.67：多态类应当抑制公开的拷贝 / 移动操作**，禁止基类的拷贝 / 移动，让错误代码无法通过编译。

### 4. 用 RAII 管理堆内存：`ShapeWrapper` 示例
利用 RAII 的析构行为，可以自动释放堆内存，避免内存泄漏：
```cpp
class ShapeWrapper {
public:
    explicit ShapeWrapper(Shape* ptr = nullptr) : ptr_(ptr) {}
    ~ShapeWrapper() { delete ptr_; }  // 析构时自动释放内存
    Shape* get() const { return ptr_; }

private:
    Shape* ptr_;
};

void foo()
{
    ShapeWrapper ptr_wrapper(createShape(/*...*/));
    // 使用 ptr_wrapper.get() 访问对象
    // 函数结束时，ptr_wrapper 析构，自动 delete 堆对象
}
```

> `delete nullptr` 是合法行为，无需额外判空。

这个 `ShapeWrapper` 是一个**极简智能指针**的雏形，标准智能指针（如 `std::unique_ptr`）还需考虑拷贝、移动、所有权等细节。

<figure>
  <img src="/figures/cpp-raii-lifetime.svg" width="800" height="270" alt="裸指针手动管理与 RAII 句柄在提前返回和异常栈展开时的资源释放路径对比">
  <figcaption>左侧手动 `delete` 依赖控制流一路走到底；右侧栈上局部对象在作用域左括号处划定生命周期，无论正常结束还是异常展开都必然汇入析构清理。</figcaption>
</figure>

### 5. RAII 的通用应用场景
RAII 的清理逻辑不限于释放内存，还可以管理各类系统资源：
- 关闭文件（如 `std::fstream` 的析构函数）
- 降低引用计数
- 释放同步锁（如 `std::lock_guard`）
- 释放网络连接、数据库连接等其他资源

#### 示例：用 `std::lock_guard` 管理互斥锁
##### RAII 写法（异常安全）
```cpp
#include <mutex>

std::mutex mtx;

void someFunc()
{
    std::lock_guard<std::mutex> guard(mtx);  // 构造时加锁
    // 执行需要同步的工作
    // 函数结束时，guard 析构自动解锁（即使发生异常/提前返回）
}
```

##### 手动锁管理（不安全）
```cpp
#include <mutex>

std::mutex mtx;

void someFunc()
{
    mtx.lock();
    // 执行需要同步的工作……
    // 如果发生异常或提前返回，下面的 unlock() 永远不会执行
    mtx.unlock();
}
```
