---
title: "uv 包管理工具实践哲学与完整使用流程"
description: "讲解 uv 的实践哲学、完整使用流程、与其他工具的对比，以及在实际项目中的应用。"
pubDate: 2026-06-02
updatedDate: 2026-10-11
tags:
  - "Python"
  - "uv"
  - "工具"
category: knowledge
cover: /covers/post-cli-terminal.svg
---

## 这份文档适合什么场景

这份文档适合下面几类情况：

- 你想用现代的方式管理 Python 项目
- 你厌倦了 pip 和 conda 的复杂性
- 你需要一个快速、可靠的依赖管理工具
- 你想要项目隔离和依赖锁定
- 你和 AI 协作开发，需要稳定的环境
- 你想学习 Python 项目的最佳实践

---

## uv 是什么

**uv** 是一个现代的 Python 包管理和项目管理工具，用 Rust 编写，速度极快。

它的目标是让 Python 开发像 Node.js 一样简单。

### 核心特点

| 特点 | 说明 |
|------|------|
| **极速** | 比 pip 快 10-100 倍，比 conda 快 100+ 倍 |
| **简单** | 零配置，开箱即用，命令直观 |
| **可靠** | 自动锁定依赖版本，确保可重现构建 |
| **隔离** | 每个项目独立虚拟环境，不污染全局 |
| **现代** | 遵循 PEP 标准，支持 pyproject.toml |
| **兼容** | 完全兼容 Python 生态，所有 PyPI 包都能用 |

---

## uv 的实践哲学

uv 的哲学来自 Node.js 的成功经验，核心是 **"项目隔离 + 依赖锁定 + 快速执行"**。

### 1. 项目隔离

**问题：** 如果所有项目都用全局 Python，会发生什么？

项目 A 需要 numpy 1.20，项目 B 需要 numpy 1.25，冲突！

**uv 的解决方案：** 每个项目都有自己的虚拟环境。

**好处：**
- 项目之间互不影响
- 可以安心升级某个项目的依赖
- 新手也不会搞坏全局环境

### 2. 依赖锁定

**问题：** 如果只记录 numpy>=1.20，会发生什么？

你本地是 1.26.4，同事是 1.24.0，生产环境是 1.22.0，代码在你电脑能跑，在别人电脑跑不了！

**uv 的解决方案：** 自动生成 uv.lock 文件，记录精确版本。

**好处：**
- 团队所有人用同样的版本
- 生产环境和开发环境一致
- "在我电脑能跑"变成"在所有地方都能跑"

### 3. 快速执行

| 工具    | 安装 numpy 的时间 |
| ----- | ------------ |
| pip   | 30 秒         |
| conda | 2 分钟         |
| uv    | 1 秒          |

### 4. 零配置

**pip 的方式：** 需要手动创建虚拟环境、激活、安装依赖、导出 requirements.txt。

**uv 的方式：**
```powershell
uv init
uv add numpy pandas
```

---

## 完整使用流程

### 第 1 步：创建项目

安装 uv（Windows：`winget install --id=astral-sh.uv -e`；macOS/Linux：`curl -LsSf https://astral.sh/uv/install.sh | sh`），然后创建应用项目：

```powershell
uv init --app my_project
cd my_project
```

### 第 2 步：添加依赖

```powershell
uv add numpy pandas requests
```

### 第 3 步：运行代码

```powershell
uv run python main.py
```

### 第 4 步：分享项目

```powershell
git add pyproject.toml uv.lock main.py .python-version
git commit -m "Initial commit"
git push
```

### 第 5 步：别人使用

```powershell
git clone your-repo
cd your-repo
uv sync
uv run python main.py
```

---

## uv vs pip vs conda 对比

| 操作 | pip | conda | uv |
|------|-----|-------|-----|
| 创建项目 | 手动 venv | conda create | uv init |
| 添加依赖 | pip install | conda install | uv add |
| 锁定版本 | 手动 requirements.txt | 手动 environment.yml | 自动 uv.lock |
| 速度 | 慢（30 秒） | 很慢（2 分钟） | 极快（1 秒） |

---

## 常用命令速查

```powershell
uv init --app my_project     # 创建应用项目（含 main.py）
uv add numpy pandas         # 添加依赖
uv remove numpy             # 移除依赖
uv sync                     # 同步依赖
uv run python main.py       # 运行代码
uv pip list                 # 查看已安装的包
```

---

## 与 AI 协作时的最佳实践

1. **让 AI 在项目根目录工作** - 确保 AI 看到 pyproject.toml 和 uv.lock
2. **在大改前提交一次** - 这样 AI 的改动有清晰的基线
3. **使用功能分支做实验** - AI 在分支上工作，不污染主分支
4. **保持 .gitignore 干净** - 不要把 .venv 提交到 Git
5. **让 AI 先检查环境** - 运行 uv run python --version 确认环境

---

## 常见问题

### Q1: uv 和 pip 有什么区别？

uv 是 pip 的现代替代品，速度快 10-100 倍，自动锁定依赖版本，项目管理更完整。

### Q2: 如何迁移现有项目到 uv？

```powershell
cd your-project
uv init
uv add numpy pandas  # 添加你的依赖
```

### Q3: .venv 文件夹很大，可以删除吗？

可以。uv sync 会重新创建。

---

## uv 的使用哲学总结

```
新项目 → uv init
添加功能 → uv add 包名
开发测试 → uv run python 脚本
分享代码 → 提交 pyproject.toml + uv.lock
别人使用 → uv sync + uv run
```

---

## 总结

uv 是现代 Python 开发的最佳选择，因为它：

1. **快速** - 极速依赖解析和安装
2. **简单** - 零配置，命令直观
3. **可靠** - 自动锁定依赖，确保可重现构建
4. **隔离** - 项目独立虚拟环境
5. **现代** - 遵循 PEP 标准，支持 pyproject.toml
6. **兼容** - 完全兼容 Python 生态

如果你还在用 pip 或 conda，强烈建议迁移到 uv。

---

## 快速开始

```powershell
# 1. 创建项目
uv init my_project
cd my_project

# 2. 添加依赖
uv add numpy pandas

# 3. 运行
uv run python main.py

# 4. 分享
git add pyproject.toml uv.lock main.py
git commit -m "Initial commit"
git push
```
