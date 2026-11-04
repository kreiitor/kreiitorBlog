---
title: "C++ 基础速刷"
description: "运算符重载、面向对象、RTTI、异常处理、模板与类型转换的要点梳理。"
pubDate: 2026-10-26
tags:
  - "C++"
  - "语法"
category: course
series: cpp
order: 1
cover: /covers/post-code-cpp.svg
---

## 运算符重载
常见的运算符重载有这几种：
* 对于类算术类型，支持 `+` `-` `*` `/` 等常规计算操作
* 对于类指针对象，支持 `*`、`->` 等解引用操作
* 对于可输出对象，支持 `<<` 流输出操作
* 对于可比较对象，支持 `==`、`<` 之类的比较操作
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
**说明：**
- **`<<` 必须是非成员函数。** 写成成员函数时，左操作数只能是你的类对象（变成 `v1 << std::cout`），不符合常规的输出习惯。写成非成员函数（通常加上 `friend`），才能让 `std::ostream` 在左边。
- **对称运算符（如 `+`）写成非成员函数：** 假设 `Vector2D` 有一个接受 `double` 的隐式构造函数。如果 `+` 是成员函数，`v1 + 2.0` 合法，`2.0 + v1` 会报错（`2.0` 不是对象）。定义为非成员函数后，左右两边的参数享有同等的隐式转换权利。
- **`->` 的传递性：** 编译器看到 `userPtr->print()` 时，实际执行 `(userPtr.operator->())->print()`。重载的 `->` 必须返回真正的指针，或者另一个重载了 `->` 的对象。

---

## 面向对象编程
**面向对象编程的特点：** 封装、继承、多态，以及随之而来的抽象。
前面的 `Vector2D` 和 `SmartPtr` 体现了封装，下面看其余的用法。

### 类
类有四个特殊的非静态成员函数：
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
**说明：** 拷贝赋值运算符先用 `this` 判断左右是否为同一个对象，避免释放掉自己的数据。返回类型是引用，`s1 = s2` 的结果就是 `s1` 的引用，`s1 = s2 = s3` 才能连续赋值。

---

### 继承和多态
在面向对象设计中，基类（base class）暴露对象的基本行为，派生类实现具体子类型，并复用基类的代码。
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

- **概念：** `Warrior` 和 `Mage` 继承了 `Hero`，获得了 `Hero` 的 `name` 属性和基础行为。
- **意义：** 实现代码复用（DRY 原则），并建立「是一个 (IS-A)」的关系：战士是英雄，法师也是英雄。

#### 2. 虚函数与多态 (Virtual Functions & Polymorphism)

- **多态的表现：** 在 `main` 函数中，`hero1` 和 `hero2` 声明时都是 `Hero*`（基类指针）。调用 `->attack()` 时，程序没有调用 `Hero` 的普通攻击，而是分别调用了战士的「旋风斩」和法师的「大火球术」。
- **底层机制（动态绑定）：** 基类方法前加 `virtual` 后，调用在**运行期**按对象的实际类型查找函数，不看指针的静态类型。
- **函数覆盖 (`override`)：** 派生类重新定义基类虚函数的行为。强烈建议加上 `override` 关键字，编译器会检查函数签名是否完全一致，避免拼写错误导致覆盖失败。

#### 3. 基类与派生类的析构函数

例子中 `Hero` 的析构函数加了 `virtual`。在 C++ 面向对象设计里，这条规则几乎没有例外。

> **基类析构函数不是虚函数时：**
> 假设 `Hero::~Hero()` 没有 `virtual`。执行 `delete hero2;`（一个指向 `Mage` 的基类指针）时：
> 1. 编译器看到指针是 `Hero*`，析构函数不是虚函数，按静态绑定处理。
> 2. 它只调用 `~Hero()`，销毁基类部分。
> 3. `~Mage()` 永远不会被调用。法师在构造函数里 `new` 出来的 `magicCrystal` 留在内存里，造成**内存泄漏 (Memory Leak)**。

定义了虚析构函数之后，`delete hero2;` 会先定位到实际类型 `Mage`：
1. 调用派生类析构函数 `~Mage()`，释放魔法水晶。
2. 沿继承链向上调用 `~Hero()`，清理基类部分。

---

## 运行期类型识别 (RTTI) 与异常处理

### 一、运行期类型识别 (RTTI)
多态里用基类指针操作派生类对象时，RTTI 可以在运行期确认指针实际指向的派生类类型，以便调用该类型特有的非虚函数。C++ 提供两个 RTTI 操作符：
- **`dynamic_cast`**：把基类的指针或引用安全地转换为派生类的指针或引用。
- **`typeid`**：返回对象的实际类型信息。

#### RTTI 核心要点与机制
- **依赖多态 (V-Table)**：`dynamic_cast` 只能用于**多态类型**，也就是至少包含一个虚函数的类。它底层通过虚函数表（V-Table）确定对象的真实类型。基类没有虚函数（连虚析构函数也没有）时，转换会导致编译报错。
- **安全机制**：
    - **指针转换**：转换失败时返回 `nullptr`。
    - **引用转换**：转换失败时抛出 `std::bad_cast` 异常。

### 二、异常处理 (Exception Handling)
C++ 面向对象编程中（如构造函数、无返回值的运算符重载），C 语言那种返回 -1 的错误码机制不再适用。`try-catch-throw` 把**正常逻辑与错误处理逻辑分开**。
#### 捕获与栈展开
- **按常量引用捕获 (`catch (const ExceptionType& e)`)**：这是 C++ 异常捕获的最佳实践，省掉一次对象拷贝，也防止**对象切片（Object Slicing）**。
    - 按值捕获时，C++ 用抛出的异常对象拷贝构造一个局部对象 `e`，派生类异常被塞进基类的模子里，自定义的错误信息和重写的虚函数全部失效。
    - 按引用捕获操作的是原异常对象，不发生截断，多态在异常处理中仍然有效。
- **栈展开 (Stack Unwinding) 与内存泄漏**：异常抛出后，程序退出当前作用域并寻找匹配的 `catch` 块，沿途局部对象的析构函数自动调用。如果一块内存是 `new` 出来的，又没有交给智能指针（RAII）管理，它不会在栈展开时释放，就会造成**内存泄漏**。
- **严禁在析构函数中抛出异常**：栈展开清理对象时，如果某个局部对象的析构函数又抛出异常，C++ 会直接调用 `std::terminate()` 终止程序。

### 三、总结
- **RTTI** 让程序在运行期取得对象的实际类型。
- **异常机制** 把错误处理与业务逻辑分开。

---

## 模板和具名类型转换

### 一、模板 (Templates)
模板是 C++ **泛型编程 (Generic Programming)** 的基础。代码与类型无关，编译器在编译期按实际传入的类型生成对应的代码。

#### 函数模板与类模板
1. **函数模板 (Function Templates)**：
    一套算法适用于多种类型。写一个通用的交换函数，传入 `int`、`double` 或前面定义的 `Vector2D` 对象，一份代码就能适配。
2. **类模板 (Class Templates)**：
    定义一个数据结构。C++ 标准模板库 (STL) 里的 `std::vector`（动态数组）、`std::map`（字典）都是用类模板实现的。

#### 优势
- **代码复用**：不同的数据类型不必编写重复的逻辑代码（遵循 DRY 原则）。
- **类型安全**：类型推导和检查都在**编译期**完成。类型不匹配时代码无法编译，运行期不会出现这类类型错误。

### 二、C++ 的四种类型转换 (Type Casts)

#### 1. `dynamic_cast`
C 语言没有这种转型，它主要用于带虚函数的继承体系，转换指针或引用。
- **工作机制**：有一个 `Shape` 指针 `ptr` 时，`dynamic_cast<Circle*>(ptr)` 会尝试转成 `Circle*`，并做运行期的类型检查。
- **失败处理**：指针转换失败（比如 `ptr` 实际指向 `Rectangle` 而不是 `Circle`）返回 `nullptr`；引用转换失败抛出异常。因此这种转型通常被认为是安全的。

#### 2. `static_cast`
这是「静态」转型，不做运行期检查，通常用在编译期认为安全的场景。
- **常见应用场景**：
    - **数值类型转换**：在数值类型之间转换，如 `long` 转 `int`、`long long` 转 `double`。转换可能有精度损失、无法隐式完成时，需要明确使用它。
    - **空指针转换**：把 `void*` 转换成实际类型的指针（如 `int*`）。
    - **类层次转换（向下转型）**：把基类指针转换成派生类指针。**前提**是从逻辑上确认这个基类指针确实指向对应的派生类对象。
- **性能与安全性**：向下转型时，`static_cast` 不如 `dynamic_cast` 安全。它不做运行期检查，性能比 `dynamic_cast` 高，很多情况下底层是空操作。

#### 3. `const_cast`
它只做一件事：去掉（或添加）指针或引用类型的 cv 限定符，比如 `const char*` 到 `char*`。这种转型可能不安全。
- **常见合法用途**：把 C++ 代码里的指针传给 `const` 标注不正确的旧式 C 接口。比如某个 C 接口不会修改字符串参数，形参理应是 `const char*`，实际却声明成 `char*`；字符串字面量退化成 `const char*`，传给 `char*` 形参无法通过编译，可以用 `const_cast` 去掉 const，「欺骗」类型系统。
- **未定义行为**：用 `const_cast` 去掉常量性后，修改一个**原本就声明为 `const`** 的对象，是**未定义行为 (UB)**。

#### 4. `reinterpret_cast`
它重新解释内存布局，是最不安全的转型，可以在完全不相关的类型之间转换。
- **常见应用场景**：把指针转换成足够宽的整数类型（如 `uintptr_t`），或反之。
- **核心隐患**：
    - **多继承指针偏移失效**：多继承下把基类指针转成派生类指针，`static_cast` 会在底层做正确的内存偏移调整，`reinterpret_cast` 只是直接转换，不调整偏移，结果通常错误。
    - **严格别名规则 (Strict Aliasing Rule) 违规**：用 `char` 或 `byte` 之外类型的指针访问非该类型的对象（例如通过 `int*` 访问 `double` 对象），会导致**未定义行为 (UB)**。
