---
title: "PyTorch 与资源核算"
description: "从张量、显存和计算图出发，核算一次训练或推理的资源开销。"
pubDate: 2026-10-26
tags:
  - "AI Infra"
  - "PyTorch"
  - "CS336"
category: course
series: ai-infra-route
order: 3
cover: /covers/series-ai-infra.svg
---

## 1. 内存核算

### 1.1 张量基础

张量是存储一切的基础单元：参数、梯度、优化器状态、数据、激活值。
```python
x = torch.tensor([[1,2,3],[4,5,6]])
x = torch.zeros(4,8)
x = torch.ones(4,8)
x = torch.randn(4,8)
# 上面是pytorch中定义张量的几个方法
```

### 1.2 张量的操作

#### 1.2.1 张量的视图（view）

切片、`.view()`、`.transpose()` 这类操作不创建副本，和原始数据共用同一块内存：
```python
x = torch.tensor([[1,2,3],[4,5,6]])

# 这些操作不复制数据

y = x[0] # 获取第0行
y = x[:, 1] # 获取第1列
y = x.view(3, 2) # 重塑为3x2
y = x.transpose(1, 0) # 转置
```

> 视图在内存里不一定连续：x 转置之后，新矩阵的元素就不再连续。
> **对非连续张量执行 `.view()` 不被允许，需要先用 `.contiguous()` 复制一份，把元素按连续顺序写入。**

#### 1.2.2 逐元素操作

对张量 x，四则运算和常用数学函数都是逐元素操作的。
```python
x = torch.tensor([1, 4, 9])
assert torch.equal(x.pow(2), torch.tensor([1, 16, 81])) # 幂运算 (pow)，每个元素平方
assert torch.equal(x.sqrt(), torch.tensor([1, 2, 3])) # 对每个元素开平方根
assert torch.equal(x.rsqrt(), torch.tensor([1, 1/2, 1/3])) # rsqrt 是 reciprocal of sqrt 的缩写，即对每个元素先开方再取倒数
assert torch.equal(x + x, torch.tensor([2, 8, 18])) # 每个元素自加
assert torch.equal(x * 2, torch.tensor([2, 8, 18])) # 每个元素乘以标量2
assert torch.equal(x / 0.5, torch.tensor([2, 8, 18])) # 每个元素除以标量0.5
```

#### 1.2.3 上下三角矩阵

在大语言模型中，下三角矩阵用于因果注意力掩码。按最主流的定义，注意力权重矩阵的元素 $A[i,j]$ 表示第 i 个 token（query）对第 j 个 token（key）的注意力权重。因果掩码限定每个 token 只能看到自己和之前的 token，所以 $A[i,j]=0，while \quad j>i$。
```python
# 实用操作：下三角矩阵（用于因果注意力掩码）
x = torch.ones(3, 3).tril()  # 创建一个3x3全1矩阵，然后取其下三角部分（含对角线）
# 结果：
# [[1, 0, 0],
#  [1, 1, 0],
#  [1, 1, 1]]
# 含义：第0个词只能看到第0个词，第1个词能看到第0、1个词，依此类推
```

#### 1.2.4 矩阵乘法

```python
#基本矩阵乘法
# 基本矩阵乘法
x = torch.ones(16, 32)  # 16x32矩阵
w = torch.ones(32, 2)   # 32x2权重矩阵
y = x @ w               # 结果：16x2矩阵

#带广播的矩阵乘法
x = torch.ones(4, 8, 16, 32) # 形状为 [批大小, 序列长度, 样本特征, 特征维度]
w = torch.ones(32, 2)        # 权重矩阵
y = x @ w                    # 矩阵乘法      结果形状(4, 8, 16, 2)

#
```

### 1.3 张量的内存

张量的内存由两部分构成：

1. 元素数量：例如 $4\times 6$ 的矩阵有 24 个元素。
2. 元素的数据类型：例如 fp32 一个元素占 4 字节。

#### 1.3.1 浮点类型

在大语言模型中，选数据类型是在显存占用、计算速度和数值稳定性之间权衡，前两项是 infra 关心的。数值稳定性的主要威胁是溢出/下溢，而不是尾数精度不够。

参数、梯度、优化器状态、激活值，大多数都用浮点数存储。浮点数由符号位、指数位、尾数位组成：符号位管正负，指数位管动态范围，尾数位管精度。格式之间的差别，就是动态范围和精度怎么分配。

##### 1. fp32（单精度浮点数）

| 格式 | 符号位 | 指数位 | 尾数位 | 总位数 | 主要用途 |
| --- | --- | --- | --- | --- | --- |
| FP32 | 1 | 8 | 23 | 32 | 参数主副本、优化器状态 |
| FP16 | 1 | 5 | 10 | 16 | 旧式混合精度，需要 loss scaling |
| BF16 | 1 | 8 | 7 | 16 | 激活值、前向与反向矩阵乘 |
| FP8 E4M3 | 1 | 4 | 3 | 8 | 推理量化，精度优先 |
| FP8 E5M2 | 1 | 5 | 2 | 8 | 推理量化，动态范围优先 |

- 结构：符号位 1 位，指数位 8 位，尾数位 23 位。
- 优点：精度高，动态范围大，训练数值稳定。
- 缺点：太奢侈，占用显存是 16 位格式的 2 倍，且现代 GPU 多针对 Bf16 甚至 fp8 优化。
- 炼丹用途：存参数的主副本和优化器状态。

##### 2. fp16

- 结构：1 位符号位，5 位指数位，10 位尾数位。
- 优点：显存占用比 fp32 少一半，计算速度快。
- 缺点：动态范围低，超出范围的数表示不了：太小直接记成 0，梯度消失；太大记成 NaN，训练崩溃。

> 为了压住动态范围的问题，要做损失缩放。这是上一代混合精度的主流做法，目前已被 Bf16 取代。

##### 3. Bf16

- 结构：1 位符号位，8 位指数位，7 位尾数位。
- 优点：显存占用低，计算速度快，动态范围和 fp32 一致，训练稳定，不需要 loss scaling。
- 设计取舍：动态范围比精度重要得多，神经网络对小数点后几位不敏感，所以用精度换范围。

Bf16 是当前大模型的主流选择，常用于存激活值，以及前向、反向传播的矩阵乘法计算。

##### 4. fp8

分为 E4M3 和 E5M2 两种，从名字能看出前者精度较高，后者动态范围较高。

- 优点：显存占用小，计算吞吐高。
- 硬件限制：目前只有最新的 GPU 支持。
- 炼丹用途：目前只用于推理阶段的量化（理论上可以训练，但精度很低、训练不稳定，仍是前沿领域）。

##### 5. fp4 与部分比较

fp4 每个元素只占用 1 bit，是目前最新的成果（英伟达的软硬件协同，用户不可控，2026 年）。

**BF16 与 FP16 的差别**

> 训练里通常不关心小数点后第 10 位的精确度，但很关心能不能表示非常大或非常小的数，也就是动态范围。FP16 的指数位太少，训练中经常出现 `NaN` 或 `0`（下溢）。BF16 截短了 FP32 的尾数、保留了指数位，能表示的数值范围和 FP32 一样大，训练稳定性明显更好。

#### 1.3.2 张量在内存中的存储机制

以 shape=(3, 4) 的行主序张量为例，stride=(4, 1)：

| 行\列 | 0 | 1 | 2 | 3 |
| --- | --- | --- | --- | --- |
| 0 | 0 | 1 | 2 | 3 |
| 1 | 4 | 5 | 6 | 7 |
| 2 | 8 | 9 | 10 | 11 |

移动到下一行要跳过 4 个元素，移动到下一列要跳过 1 个元素；只改 stride 而不复制数据的操作就是 zero-copy。

张量并不「包含」数据：它指向一块连续内存，附带一套读取规则。这套规则就是步长：

```python
# x->torch.tensor
x.stride(0) #移动到下一行要跳过的元素数，图片中是4
x.stride(1) #移动到下一列要跳过的元素数，图片中是1
```

很多张量操作只改步长、不复制数据，成本很低。但用 `view()` 之前要确认数据在内存中连续。

#### 1.3.3 把张量从 CPU 内存移到 GPU 内存

默认情况下，张量存在 CPU 内存里。要利用 GPU 的大规模并行，得把张量搬到 GPU。

CPU 和系统内存（RAM）在主机侧，GPU 及其专用的高速显存（DRAM）在设备侧。GPU 内部由多个流式多处理器（streaming multiprocessor）组成，并行计算能力来自这里。

CPU 和 GPU 通过 PCI 总线相连，数据在两侧之间传输要过这条总线。它的带宽远小于 GPU 内部的内存带宽，通常就是瓶颈。实际应用中应尽量减少 CPU 和 GPU 之间的数据传输。

##### 如何移动张量（CPU 到 GPU）

在 PyTorch 中把张量从 CPU 移到 GPU，大致是这几步：
- 先确认机器上有没有 GPU：
```python
    if not torch.cuda.is_available():
            return
```
- 再读取 GPU 信息：
```python
    num_gpus = torch.cuda.device_count() # 获取GPU数量
    for i in range(num_gpus):
        properties = torch.cuda.get_device_properties(i) # 获取第i块GPU的属性（如型号、显存大小等）
    memory_allocated = torch.cuda.memory_allocated() # 获取当前已分配给PyTorch的显存总量
```
- 搬张量有两种做法：
    - 一是搬已有的张量
	```python
        y = x.to("cuda:0") # 将张量x移动到编号为0的GPU上
        assert y.device == torch.device("cuda", 0) # 验证移动成功
    ```
    - 二是直接在 GPU 上创建张量
    ```python
        z = torch.zeros(32, 32, device="cuda:0") # 在GPU上直接创建一个32x32的零矩阵
    ```
    后者更高效，省掉了先在 CPU 创建再搬运的过程。
- 最后确认显存占用：
```python
    new_memory_allocated = torch.cuda.memory_allocated() # 再次查询当前显存占用
    memory_used = new_memory_allocated - memory_allocated # 计算新增的显存占用
    assert memory_used == 2 * (32 * 32 * 4) # 验证：新增了2个32x32的矩阵，每个元素是4字节的float
```

## 2. 计算核算

### 2.1 浮点运算总数

#### 2.1.1 概念

- FLOP：一次浮点运算，比如一次加法或一次乘法。
- flops：一个算法的总浮点运算次数，用来衡量计算量。
- flop/s：每秒能执行的浮点运算次数，用来衡量计算速度。

#### 2.1.2 部分操作的 flops

##### dot-product

对于点积 $z=x\cdot y$，$x$ 和 $y$ 都是 $n$ 维：
$$
z_i=x_i\cdot y_i
$$
一共 $n-1$ 次加法、$n$ 次乘法，即 $2n-1$。

##### GEMV
矩阵向量乘法 $y=x@W$，维度分别是 $n$ 和 $n\times m$。结果向量的每一位：
$$
y_i=\sum_{k=1}^n x_k W_{k,i}
$$
一共 $n-1$ 次加法、$n$ 次乘法，做 $m$ 次，即 $m(2n-1)$。

##### GEMM
矩阵乘法 $Y=X@W$，维度分别是 $n\times m$ 和 $m\times k$。结果矩阵的每个元素：
$$
Y_{i,j}=\sum_{l=1}^m X_{i,l}W_{l,j}
$$
一共 $m-1$ 次加法、$m$ 次乘法，做 $n\times k$ 次，即 $nk(2m-1)$。

#### 2.1.3 实际计时（benchmark）关键点

实际计时容易踩两个坑：CPU 提交任务后立刻返回，测到的可能只是提交时间；时间戳没挂在 GPU 时间线上，就对不上真实执行。

- `torch.cuda.synchronize()` 让 CPU 等 GPU 队列里的任务跑完，避免测到的是从 CPU 提交的时间。
- `torch.cuda.Event` 把计时绑到 GPU 时间线上。
- 测量之前预热，去掉第一次运行时各种操作的干扰。

### 2.2 MFU

MFU（Model FLOPs Utilization）：实际每秒计算次数除以标定的每秒计算次数（忽略通信和系统开销，只看计算）。
$$
MFU=\f\frac{实测FLOP/s}{标定FLOP/s}
$$
MFU 0.5 常被当作经验参考线；实际高低取决于模型、kernel、硬件和并行策略，不能只看这一个数。

### 2.3 PyTorch 的梯度计算与 FLOPs

矩阵乘法的梯度可以直接写成矩阵形式。设前向为 `Y = XW`，损失为 `L`，则：

$$
\frac{\partial L}{\partial W} = X^T \frac{\partial L}{\partial Y},
\qquad
\frac{\partial L}{\partial X} = \frac{\partial L}{\partial Y} W^T
$$

反向传播时，这两次矩阵乘法的 FLOPs 与对应前向矩阵乘法同量级；对整个计算图来说，反向约为前向的 2 倍，所以一个训练 step（前向 + 反向）约为前向的 3 倍。PyTorch 的 autograd 会自动完成这些计算，手写时主要检查形状是否对齐。

PyTorch 中的梯度存在自变量身上，形状和自变量张量一致。反向传播之后，因变量对某个自变量的梯度写在该自变量的属性里，等优化器来取（反向传播和优化器解耦）。

带 `.requires_grad = True` 的自变量先经过各种运算（transformer 的各个模块）得到因变量（loss），`loss.backward()` 反向传播时把各处的梯度填进对应的自变量。

反向传播和前向传播的 FLOPs 关系：
$$
\text{反向 FLOPs} \approx 2 \times \text{前向 FLOPs}
$$
$$
\text{完整训练步（前向 + 反向）} \approx 3 \times \text{前向 FLOPs}
$$

反向传播按链式法则从 loss 往回算：每层先算出自己参数的梯度，再把梯度继续往前传。

### 2.4 模型构建和训练

用一个最小线性回归把流程走通，重点看每一步的张量形状和 FLOPs。

```python
import torch

torch.manual_seed(0)
X = torch.randn(1024, 128)
true_w = torch.randn(128, 1)
y = X @ true_w + 0.01 * torch.randn(1024, 1)

w = torch.randn(128, 1, requires_grad=True)
lr = 0.01

for step in range(100):
    pred = X @ w                 # (1024, 128) @ (128, 1) -> (1024, 1)
    loss = ((pred - y) ** 2).mean()
    loss.backward()              # 计算 w.grad

    with torch.no_grad():
        w -= lr * w.grad
    w.grad.zero_()
```

单步计算量（忽略广播和逐元素操作的常数项）：

- 前向 `X @ w`：约 `2 * 1024 * 128 * 1 ≈ 2.6e5` FLOPs。
- 反向：矩阵乘法部分约为前向的 2 倍。
- 整个训练 step 约为前向的 3 倍，即 `≈ 7.9e5` FLOPs。

这个例子故意很小，方便手算。换成一个 Transformer block 时，矩阵乘法的形状会变多，但「前向 FLOPs 估算 → 反向约 2 倍 → 训练步约 3 倍」的框架不变。

### 2.5 算术强度和 Roofline 分析

#### 2.5.1 计算不只有「算」

计算单元要先从 HBM 取数据，才能开始算：

1. 从 HBM 发送输入到计算核心。
2. 计算核心执行计算。
3. 将计算结果写回 HBM。

所以总时间取决于：

- 加速器速度：flop/s
- 内存带宽：byte/s

#### 2.5.2 算术强度和加速器强度

加速器强度 = flop/s / byte/s（随器件固定）
算术强度 = flops / bytes（随算法变化）

算术强度低于加速器强度时，操作是 memory-bound，瓶颈在数据传输。高于时是 compute-bound，瓶颈在计算。

#### 2.5.3 部分操作的算术强度对比（假定 BF16）

| 操作                | FLOPs    | Bytes  | 算术强度        | 瓶颈                |
| ----------------- | -------- | ------ | ----------- | ----------------- |
| **ReLU**          | n        | 4n     | ≈ 0.25      | Memory-bound      |
| **GeLU**          | 20n      | 4n     | ≈ 5         | Memory-bound      |
| **Dot Product**   | 2n-1     | 4n+2   | ≈ 0.5       | Memory-bound      |
| **Matrix-Vector** | n(2n-1)  | 2n²+4n | ≈ 1         | Memory-bound      |
| **Matrix-Matrix** | n²(2n-1) | 6n²    | ≈ n/3 ≈ 340 | **Compute-bound** |

ReLU 的数据搬运量：输入 n 个数，输出 n 个数，每个数 2 字节。计算量：n 个元素和 0 比较，比较 n 次。

#### 2.5.4 推理与训练

推理是自回归的，以 GEMV 为主；训练以 GEMM 为主。后者计算强度更高，偏计算瓶颈，前者则更受限于数据传输。

> MFU 的差异来自瓶颈：瓶颈在内存时，MFU 就会偏低。

#### 2.5.5 Roofline 图

```text
性能（FLOP/s）
  ^
  |            ____________________  compute-bound
  |           /
  |          /
  |         /  memory-bound
  |        /
  +-------+-----------------------> 算术强度（FLOP/Byte）
        kink
```

| 区域 | 位置 | 主要限制 | 优化方向 |
| --- | --- | --- | --- |
| 转折点左侧 | 算术强度低于 kink | 内存带宽 | 提高数据复用、分块、算子融合 |
| 转折点右侧 | 算术强度高于 kink | 计算能力 | 提高吞吐、使用低精度计算 |

Roofline 图的读法：

- **X 轴**：算术强度（每个「切片」对应一个特定算法）
- **Y 轴**：实际达到的 FLOP/s
- **每条分段线性曲线**：一个特定的硬件平台（H100、B200 等）
- **转折点（kink）**：该硬件的加速器强度。左侧是 memory-bound 区域（斜率上升），右侧是 compute-bound 区域（水平天花板）

操作落在转折点左侧，说明算术强度不够高，实际 FLOPs 远低于硬件的峰值能力。算术强度超过转折点，才能接近峰值 FLOP/s。

**MFU 与 Roofline 的关系**：

```
MFU = min(1, 算术强度 / 加速器强度)
```

很多操作的算术强度低于加速器强度，GPU 的计算单元在「空转等待数据」，MFU 通常只有 0.5 左右。
