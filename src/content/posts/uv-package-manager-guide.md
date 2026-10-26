---
title: "uv 包管理工具实践哲学与完整使用流程"
description: "讲解 uv 的实践哲学、完整使用流程、与其他工具的对比，以及在实际项目中的应用。"
pubDate: 2026-06-02
updatedDate: 2026-10-26
tags:
  - "Python"
  - "uv"
  - "工具"
category: knowledge
cover: /covers/post-cli-terminal.svg
---

uv 是 Astral 用 Rust 写的 Python 包管理和项目管理工具。它把虚拟环境、依赖安装、锁文件和命令执行放在一个工具里，速度通常比 pip 快，具体取决于缓存、网络和项目规模。

如果你只想找一个比 pip 更省事的日常工具，uv 够用；如果你还在重度使用 conda 做科学计算环境，先确认关键包和 CUDA 依赖是否都能装，再决定是否迁移。

## 安装

Windows 可以用 winget：

```powershell
winget install --id astral-sh.uv -e
```

也可以用官方安装脚本或 pipx：

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
pipx install uv
```

安装后确认：

```bash
uv --version
```

## 一个项目长什么样

```text
my_project/
├── pyproject.toml     # 项目元数据和依赖
├── uv.lock            # 锁定精确版本，提交到 Git
├── .python-version    # 可选，固定 Python 版本
├── .venv/             # 虚拟环境，不提交
└── src/
```

`pyproject.toml` 记录你声明要什么，`uv.lock` 记录实际装了什么。两个文件都提交，别人才能复现。

## 常用流程

### 新建项目

```bash
uv init my_project
cd my_project
```

`uv init` 会生成 `pyproject.toml` 和一个示例文件。已有项目可以直接在根目录运行：

```bash
uv init
```

### 添加和删除依赖

```bash
uv add numpy pandas
uv add --dev pytest ruff
uv remove pandas
```

`uv add` 会同时更新 `pyproject.toml`、`uv.lock` 和虚拟环境。不要在 uv 项目里再用 `pip install`，否则锁文件会和环境不一致。

### 运行代码

```bash
uv run python main.py
uv run pytest
```

`uv run` 会自动使用项目的 `.venv`，不需要手动激活。临时执行一个包里的命令也可以用：

```bash
uvx ruff check .
```

### 同步环境

```bash
uv sync
```

拉下别人的项目后，先 `uv sync`，它会按 `uv.lock` 安装依赖。要升级依赖：

```bash
uv lock --upgrade
uv sync
```

### 查看依赖

```bash
uv tree
uv pip list
```

## 从 pip / conda 迁移

### 从 pip

已经有 `requirements.txt` 的项目：

```bash
uv init
uv add -r requirements.txt
```

确认 `pyproject.toml` 和 `uv.lock` 没问题后，可以删掉 `requirements.txt`，或者保留它给不使用 uv 的环境。

### 从 conda

如果项目依赖 conda 特有的二进制包（某些 CUDA、科学计算库），不要急着全迁。可以先在 uv 里试装关键依赖，确认能装、能跑，再迁移纯 Python 部分。conda 和 uv 也可以并存，但不要同时管理同一个环境。

## 常用命令

| 目的 | 命令 |
| --- | --- |
| 初始化项目 | `uv init` |
| 添加依赖 | `uv add package` |
| 添加开发依赖 | `uv add --dev pytest` |
| 删除依赖 | `uv remove package` |
| 安装锁文件 | `uv sync` |
| 升级依赖 | `uv lock --upgrade` |
| 运行命令 | `uv run python main.py` |
| 临时运行工具 | `uvx ruff check .` |
| 查看依赖树 | `uv tree` |
| 指定 Python 版本 | `uv python pin 3.12` |

## 和 AI 协作时

- 让 AI 改依赖时，要求它同时更新 `pyproject.toml` 和 `uv.lock`，不要只改一个。
- 不要提交 `.venv/`；把它写进 `.gitignore`。
- 在 README 里写清楚：`uv sync` 安装，`uv run ...` 运行。
- 如果 AI 生成 `pip install` 命令，改成 `uv add` 或 `uv run`，避免绕过锁文件。

## 常见问题

**Q：`uv.lock` 要提交吗？**
应用项目要提交；库项目也建议提交，保证 CI 和本地一致。

**Q：`.venv` 很大，可以删吗？**
可以。删掉后运行 `uv sync` 会按锁文件重建。

**Q：uv 和 pip 能混用吗？**
不建议在同一个 uv 项目里混用。混用会让锁文件和实际环境不一致。

**Q：Python 版本怎么固定？**
`uv python pin 3.12` 会写 `.python-version`；团队统一版本后，`uv sync` 会按这个版本创建环境。
