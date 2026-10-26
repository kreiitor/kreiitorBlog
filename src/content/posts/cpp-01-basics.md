---
title: "C++ 基础速刷"
description: "把语法、类型、引用、const、运算符和异常这些高频基础一次过一遍。"
pubDate: 2026-10-26
tags:
  - "C++"
  - "语法"
  - "学习笔记"
category: course
series: cpp
order: 1
cover: /covers/post-code-cpp.svg
---

## 运算符重载
常见的运算符重载的情况：
* 对于类算术类型，支持`+` `-` `*` `/` 等常规计算操作
* 对于类指针对象，支持`*`，`->`等解引用的操作
* 对于可输出对象，支持`<<`流输出操作
* 对于可比较对象，支持`\==`,`<`之类的比较操作
```cpp
#include <iostream>
#include <string>

// ==========================================
// 场景 1, 3, 4: 类算术类型、可比较对象、可输出对象
// ==========================================
class Vector2D {
private:
    double x;
    double y;

public:
    Vector2D(double x = 0.0, double y = 0.0) : x(x), y(y) {}

    // 为了让非成员函数能够访问私有成员，声明为友元函数 (friend)
    // 对应笔记：支持 << 流输出操作
    friend std::ostream& operator<<(std::ostream& os, const Vector2D& vec);

    // 对应笔记：支持 + 常规计算操作。且作为对称运算符，定义为非成员函数
    friend Vector2D operator+(const Vector2D& lhs, const Vector2D& rhs);

    // 对应笔记：支持 == 比较操作。对称运算符，定义为非成员函数
    friend bool operator==(const Vector2D& lhs, const Vector2D& rhs);

    // 对应笔记：支持 < 比较操作（这里以向量的模长平方进行比较）
    friend bool operator<(const Vector2D& lhs, const Vector2D& rhs);
};

// --- 非成员函数的具体实现 ---

std::ostream& operator<<(std::ostream& os, const Vector2D& vec) {
    os << "(" << vec.x << ", " << vec.y << ")";
    return os; // 返回流对象的引用以支持连续输出，如 cout << a << b;
}

Vector2D operator+(const Vector2D& lhs, const Vector2D& rhs) {
    return Vector2D(lhs.x + rhs.x, lhs.y + rhs.y);
}

bool operator==(const Vector2D& lhs, const Vector2D& rhs) {
    return (lhs.x == rhs.x) && (lhs.y == rhs.y);
}

bool operator<(const Vector2D& lhs, const Vector2D& rhs) {
    // 比较 x^2 + y^2
    return (lhs.x * lhs.x + lhs.y * lhs.y) < (rhs.x * rhs.x + rhs.y * rhs.y);
}

// ==========================================
// 场景 2: 类指针对象
// ==========================================
template <typename T>
class SmartPtr {
private:
    T* ptr;

public:
    // 构造与析构，接管原始指针
    explicit SmartPtr(T* p = nullptr) : ptr(p) {}
    ~SmartPtr() {
        delete ptr;
        std::cout << "[SmartPtr destroyed]" << std::endl;
    }

    // 对应笔记：支持 * 解引用操作
    T& operator*() const {
        return *ptr;
    }

    // 对应笔记：支持 -> 成员访问操作
    T* operator->() const {
        return ptr;
    }
};

// 用于测试指针操作的辅助类
struct User {
    std::string name;
    void print() { std::cout << "User: " << name << std::endl; }
};

// ==========================================
// 测试主函数
// ==========================================
int main() {
    std::cout << "--- 测试算术、比较与输出重载 ---" << std::endl;
    Vector2D v1(1.0, 2.0);
    Vector2D v2(3.0, 4.0);
    Vector2D v3(1.0, 2.0);

    // 测试 << 输出
    std::cout << "v1 = " << v1 << "\n";
    std::cout << "v2 = " << v2 << "\n";

    // 测试 + 运算
    Vector2D sum = v1 + v2;
    std::cout << "v1 + v2 = " << sum << "\n";

    // 测试 == 与 < 比较
    std::cout << "v1 == v3: " << (v1 == v3 ? "True" : "False") << "\n";
    std::cout << "v1 < v2:  " << (v1 < v2 ? "True" : "False") << "\n";

    std::cout << "\n--- 测试类指针对象重载 ---" << std::endl;
    // 使用我们自定义的 SmartPtr
    SmartPtr<User> userPtr(new User{"Alice"});

    // 测试 -> 运算符
    userPtr->print();

    // 测试 * 运算符
    (*userPtr).name = "Bob";
    (*userPtr).print();

    return 0;
}
```
***note***：
* 对于对称运算符，如+,\==等操作，推荐采用非成员的独立函数
- **为什么 `<<` 必须是非成员函数？** 如果把 `<<` 写成成员函数，它的左操作数就必须是你的类对象（变成 `v1 << std::cout`），这违背了常规的输出习惯。写成非成员函数（通常加上 `friend`）才能保证 `std::ostream` 在左边。
- **非成员函数处理对称运算符的好处（如 `+`）：** 假设 `Vector2D` 有一个接受 `double` 的隐式构造函数。如果 `+` 是成员函数，`v1 + 2.0` 是合法的，但 `2.0 + v1` 就会报错（因为 `2.0` 不是对象）。将其定义为非成员函数后，左右两边的参数享有同等的隐式转换权利。
- **`->` 运算符的特殊性：** 重载 `->` 运算符时，它其实有着**传递性**。编译器看到 `userPtr->print()` 时，实际上执行的是 `(userPtr.operator->())->print()`。它必须返回一个真正的指针，或者另一个重载了 `->` 的对象。

---

## 面向对象编程
**面向对象编程的特点：** 封装，继承，多态以及随之而来的抽象
在上面的类中表示了封装，下面展示剩余的用法。

### 类
对于类，有四个特殊的非静态成员函数：
* 析构函数
* 默认构造函数
* 拷贝构造函数
* 拷贝赋值运算符
```cpp
#include <iostream>
#include <cstddef>

class DynamicArray {
public:
    // 默认构造函数：分配一个默认大小的数组并初始化为0
    DynamicArray(std::size_t n = 10)
        : size_(n), data_(new int[n]()) {
        std::cout << "默认构造函数 (size = " << size_ << ")" << std::endl;
    }

    // 拷贝构造函数：深拷贝另一个对象的数据
    DynamicArray(const DynamicArray& other)
        : size_(other.size_), data_(new int[other.size_]) {
        for (std::size_t i = 0; i < size_; ++i) {
            data_[i] = other.data_[i];
        }
        std::cout << "拷贝构造函数 (深拷贝)" << std::endl;
    }

    // 拷贝赋值运算符：释放原有资源，然后深拷贝右侧对象
    DynamicArray& operator=(const DynamicArray& other) {
    //这里不够项目安全，先删除了，如果后续赋值过程出现错误，旧数据消失，就出现了致命漏洞
        if (this != &other) {                 // 避免自赋值
            delete[] data_;                   // 释放已有资源
            size_ = other.size_;
            data_ = new int[size_];
            for (std::size_t i = 0; i < size_; ++i) {
                data_[i] = other.data_[i];
            }
            std::cout << "拷贝赋值运算符 (深拷贝)" << std::endl;
        } else {
            std::cout << "拷贝赋值运算符 (自赋值，跳过)" << std::endl;
        }
        return *this;
    }

    // 析构函数：释放动态分配的内存
    ~DynamicArray() {
        delete[] data_;
        std::cout << "析构函数 (释放内存)" << std::endl;
    }

private:
    std::size_t size_;
    int* data_;
};
}
```
***note***: 在拷贝复制运算符中，使用了this指针判断是否是自赋值，防止删除旧数据时新数据也丢失，造成错误。此外，对于返回类型是引用，这个可以使得s1=s2返回的是s1的引用，便于s1=s2=s3的连续赋值

---

### 继承和多态
在面向对象设计中，通过基类（base class）暴露对象的基本行为，然后使用派生类实现具体子类型代码复用
```cpp
#include <iostream>
#include <string>

// ==========================================
// 1. 基类 (Base Class)
// ==========================================
class Hero {
protected:
    std::string name;

public:
    Hero(const std::string& n) : name(n) {
        std::cout << "--> Hero [" << name << "] 构造" << std::endl;
    }

    // 【核心考点】：基类的析构函数必须是虚函数 (Virtual Destructor)
    virtual ~Hero() {
        std::cout << "<-- Hero [" << name << "] 析构" << std::endl;
    }

    // 虚函数 (Virtual Function)，允许派生类根据自身特性进行重写
    virtual void attack() const {
        std::cout << name << " 发起了基础的普通攻击！" << std::endl;
    }
};

// ==========================================
// 2. 派生类 (Derived Class) - 战士
// ==========================================
class Warrior : public Hero {
public:
    Warrior(const std::string& n) : Hero(n) {
        std::cout << "--> Warrior [" << name << "] 构造" << std::endl;
    }

    // 派生类析构函数
    ~Warrior() override {
        std::cout << "<-- Warrior [" << name << "] 析构 (清理战士专属资源)" << std::endl;
    }

    // 函数覆盖 (Function Override)：重写基类的攻击方式
    void attack() const override {
        std::cout << name << " 挥舞大剑，使用了 [旋风斩]！" << std::endl;
    }
};

// ==========================================
// 3. 派生类 (Derived Class) - 法师
// ==========================================
class Mage : public Hero {
private:
    int* magicCrystal; // 模拟法师独有、需要手动释放的堆内存资源

public:
    Mage(const std::string& n) : Hero(n) {
        magicCrystal = new int(100); // 分配资源
        std::cout << "--> Mage [" << name << "] 构造 (凝聚魔法水晶)" << std::endl;
    }

    // 派生类析构函数
    ~Mage() override {
        delete magicCrystal; // 释放资源
        std::cout << "<-- Mage [" << name << "] 析构 (碎裂魔法水晶，释放内存)" << std::endl;
    }

    // 函数覆盖 (Function Override)
    void attack() const override {
        std::cout << name << " 吟唱咒语，释放了 [大火球术]！" << std::endl;
    }
};

// ==========================================
// 测试多态与析构
// ==========================================
int main() {
    std::cout << "========== 阶段一：多态的展现 ==========" << std::endl;
    // 使用基类指针指向派生类对象
    Hero* hero1 = new Warrior("亚瑟");
    Hero* hero2 = new Mage("安琪拉");

    std::cout << "\n--- 发起攻击 ---" << std::endl;
    // 编译器会根据指针实际指向的「对象类型」，动态绑定并调用对应的 attack()
    hero1->attack();
    hero2->attack();

    std::cout << "\n========== 阶段二：内存释放与虚析构 ==========" << std::endl;
    // 释放内存
    delete hero1;
    std::cout << "-----------------" << std::endl;
    delete hero2;

    return 0;
}
```
#### 1. 继承 (Inheritance)

- **概念：** `Warrior` 和 `Mage` 继承了 `Hero`。这意味着它们自动获得了 `Hero` 的 `name` 属性和基础行为。
- **意义：** 实现了代码复用（DRY原则），并建立了“是一个 (IS-A)”的关系：战士是英雄，法师也是英雄。

#### 2. 虚函数与多态 (Virtual Functions & Polymorphism)

- **多态的表现：** 在 `main` 函数中，`hero1` 和 `hero2` 在声明时都是 `Hero*`（基类指针）。但是当调用 `->attack()` 时，程序并没有调用 `Hero` 的普通攻击，而是分别调用了战士的“旋风斩”和法师的“大火球术”。
- **底层机制（动态绑定）：** 通过在基类方法前加上 `virtual` 关键字，告诉编译器：“不要根据指针的类型来决定调用哪个函数，要在**运行期**去查一下这个指针到底指着什么对象，去调用那个对象实际的方法。”
- **函数覆盖 (`override`)：** 派生类重新定义基类虚函数的行为。强烈建议加上 `override` 关键字，它可以让编译器帮你检查函数签名是否完全一致，避免拼写错误导致覆盖失败。

#### 3. 极其重要的考点：基类与派生类的析构函数

在这个例子中，`Hero` 的析构函数前加上了 `virtual` 关键字。这是 C++ 面向对象设计中**几乎绝对的铁律**。

> **如果基类析构函数不是虚函数，会发生什么灾难？**
> 假设 `Hero::~Hero()` 没有 `virtual`。当执行 `delete hero2;` (它是一个指向 `Mage` 的基类指针) 时：
> 1. 编译器看到指针是 `Hero*`，且析构函数不是虚函数（静态绑定）。
> 2. 它只会调用 `~Hero()`，直接把基类的部分销毁了。
> 3. **致命后果：** `~Mage()` 永远不会被调用！法师在构造函数里 `new` 出来的 `magicCrystal` 将永远留在内存中，造成**内存泄漏 (Memory Leak)**。

**正确的执行流（定义了虚析构函数）：** 当你 `delete hero2;` 时，因为析构函数是虚函数，程序会先定位到实际的对象类型 `Mage`：
1. 先调用派生类的析构函数：`~Mage()`，安全释放魔法水晶。
2. 自动沿着继承链向上传导，调用基类的析构函数：`~Hero()`，清理基础属性。

---

## 运行期类型识别 (RTTI) 与异常处理

### 一、 运行期类型识别 (RTTI)
在多态机制中，当我们使用基类指针操作派生类对象时，RTTI 允许我们在**运行期间**明确指针所指向的具体派生类类型，以便调用特有的非虚函数 。
C++ 提供了两个主要的 RTTI 操作符 ：
- **`dynamic_cast`**：用于安全地将基类的指针或引用转换为派生类的指针或引用 。
- **`typeid`**：用于返回一个对象的实际类型信息 。
#### RTTI 核心要点与机制
- **依赖多态 (V-Table)**：`dynamic_cast` 只能用于**多态类型**（即至少包含一个虚函数的类） 。它在底层通过查阅虚函数表（V-Table）来确定对象的真实类型 。如果基类没有虚函数（例如连虚析构函数都没有），会导致编译报错 。
- **安全机制**：
    - **指针转换**：如果转换失败，`dynamic_cast` 会返回 `nullptr` 。
    - **引用转换**：如果转换失败，会抛出 `std::bad_cast` 异常 。

### 二、 异常处理 (Exception Handling)
C++ 面向对象编程中（如构造函数、无返回值的运算符重载），传统的 C 语言错误码机制（如返回 -1）不再适用 。异常处理（`try-catch-throw`）机制提供了一种将**正常逻辑与错误处理逻辑分离**的优雅方式 。
#### 核心考点与避坑指南
- **按常量引用捕获 (`catch (const ExceptionType& e)`)**：
    - 这是 C++ 异常捕获的最佳实践 。
    - 可以避免对象拷贝带来的性能损耗 。
    - **关键作用**：防止**对象切片（Object Slicing）** 问题，从而确保异常处理中的多态性正常工作 。
	    - 当你**按值捕获**时，C++ 会利用抛出的异常对象去“拷贝构造”一个局部对象 `e`。此时派生类异常被塞进了基类异常的模子里，导致自定义的错误信息或重写的虚函数全部失效。
		* 而当你**按引用捕获**时，你实际上是在操作原异常对象的内存地址（就像基类指针指向派生类对象一样），因此不会发生内存截断，从而**确保异常处理中的多态性正常工作** 。
- **栈展开 (Stack Unwinding) 与内存泄漏**：
    - 当异常被抛出时，程序会立即退出当前作用域并寻找匹配的 `catch` 块 。
    - 在此过程中，所有局部对象的析构函数会被自动调用 。
    - **危险**：如果使用 `new` 手动分配了内存，且没有被智能指针（如 RAII 机制包裹）管理，这块内存将不会在栈展开时被释放，从而导致**内存泄漏** 。
- **严禁在析构函数中抛出异常**：
    - 如果在栈展开清理对象的过程中，某个局部对象的析构函数再次抛出了异常，C++ 会直接调用 `std::terminate()` 强行终止整个程序 。

### 三、 总结
- **RTTI** 提供了程序在运行时的动态灵活性 。
- **异常机制** 则通过分离错误处理与业务逻辑，为程序的健壮性保驾护航 。

---

## 模板和具名类型转换

### 一、 模板 (Templates)
模板是 C++ 支持**泛型编程 (Generic Programming)** 的基石。它允许你编写与类型无关的代码，让编译器在编译期根据实际传入的类型自动生成对应的代码。

#### 核心分类
1. **函数模板 (Function Templates)**：
    一套算法，多种类型适用。例如，编写一个通用的交换函数，无论传入 `int`、`double` 还是你之前笔记中定义的 `Vector2D` 对象，只需一份代码就能完美适配。
2. **类模板 (Class Templates)**：
    一个数据结构的蓝图。C++ 标准模板库 (STL) 中的 `std::vector`（动态数组）、`std::map`（字典）等容器，在底层全都是用类模板实现的。

#### 核心优势
- **代码复用**：彻底避免为不同的数据类型编写重复的逻辑代码（遵循 DRY 原则）。
- **类型安全**：所有的类型推导和检查都在**编译期**完成。如果类型不匹配，代码直接无法编译，从源头杜绝了运行期的潜在类型风险。

### 二、C++ 的四种类型转换 (Type Casts)

#### 1. `dynamic_cast`
这是 C 语言中不存在的转型方式，主要用于在带有虚函数的“动态对象”继承树里，进行指针或引用的类型转换。
- **工作机制**：例如，如果有一个 `Shape` 指针 `ptr`，可以使用 `dynamic_cast<Circle*>(ptr)` 尝试将其转型为 `Circle*`。系统会进行需要的动态类型检查。
- **安全保障**：
    - **指针转型**：转型成功时返回一个非空指针；如果失败（如 `ptr` 实际指向的是 `Rectangle` 而不是 `Circle`），则返回 `nullptr`。
    - **引用转型**：如果转型失败，会直接抛出异常。
- **安全性评估**：通常认为这种转型方式是**安全的**。

#### 2. `static_cast`
这是“静态”转型方式，通常用在一些编译期被认为较安全的场景，不进行运行期检查。
- **常见应用场景**：
    - **数值类型转换**：在不同的数值类型之间进行转换，如 `long` 转 `int`，或 `long long` 转 `double`。当转换可能存在精度损失、无法使用隐式转换时，需要明确使用它。
    - **空指针转换**：将 `void*` 转换成实际类型的指针（如 `int*`）。
    - **类层次转换（向下转型）**：将基类的指针转换成派生类的指针。**前提条件**：你必须能从逻辑上确认这个基类指针确实指向一个对应的派生类对象。
- **性能与安全性**：对于向下转型，`static_cast` 不如 `dynamic_cast` 安全。但由于它不需要进行运行期的检查，其性能比 `dynamic_cast` 要高，在很多情况下底层只是个空操作。

#### 3. `const_cast`
这种转型方式有可能不安全。它的唯一目的是去掉（或添加）一个指针或引用类型的 cv 限定符（如从 `const char*` 转换到 `char*`）。
- **常见合法用途**：把一个 C++ 的指针传递到一个 `const` 不正确的旧式 C 接口里。例如，某个 C 接口需要字符串参数且不会对其进行修改，形参理应是 `const char*`，但实际被声明成了 `char*`。为了让 C++ 退化后的 `const char*` 字符串字面量能通过编译，可以使用 `const_cast`“欺骗”类型系统。
- **危险警告（未定义行为）**：如果你通过 `const_cast` 去除常量性后，去修改一个**原本就被声明为 `const`** 的对象，这是**未定义行为 (UB)**，可能会导致奇怪的意外结果。

#### 4. `reinterpret_cast`
这是对数据内存布局进行“重新解释”的**最不安全**的转型方式，用来在完全不相关的类型之间进行暴力转换。
- **常见应用场景**：把指针转换成足够宽的整数类型（如 `uintptr_t`），或反之。
- **核心隐患**：
    - **多继承指针偏移失效**：在存在多继承的情况下，如果要把基类指针转成派生类指针，`static_cast` 会在底层进行正确的内存偏移量调整，而 `reinterpret_cast` 只是简单粗暴的硬转，结果通常错误。
    - **严格别名规则 (Strict Aliasing Rule) 违规**：如果你用 `char` 或 `byte` 之外类型的指针，去访问非该类型的对象（例如通过 `int*` 强行访问 `double` 对象），会导致**未定义行为 (UB)**。
