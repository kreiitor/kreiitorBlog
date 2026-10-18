---
title: "Codex CLI 上下文显示实践"
description: "通过 tmux 包装器为 Codex CLI 添加可回滚的上下文与 token 使用量实时显示层，无需修改 Codex 本体配置。"
pubDate: 2026-05-22
tags:
  - 工具
  - AI
  - CLI
draft: false
category: knowledge
---

## 这个方案解决什么问题

Codex CLI 默认不会在终端里常驻显示上下文占用、token 使用量或剩余窗口。  
这个方案的目标是给 CLI 加一个轻量的可视化层，让你在使用时能看到类似下面的信息：

- 当前累计 token 使用量
- 模型上下文窗口大小
- input / output / cached / reasoning 的拆分
- 最近一次请求的 token 消耗

它适合下面几类场景：

- 想知道当前会话还剩多少上下文空间
- 想观察大任务里 token 消耗速度
- 想在不改 Codex 配置的前提下补一个状态提示
- 想要一个能随时回滚的外置方案

---

## 实现思路

这个实现没有修改 Codex 的认证配置，也没有改 `config.toml`。  
它只是新增了一个包装脚本：

- 脚本路径：`~/.local/bin/codex-usage`
- 作用：启动 Codex，并在 `tmux` 里打开一个侧窗监视上下文信息
- 数据来源：读取 `~/.codex/sessions/**/*.jsonl`
- 关键事件：`token_count`
- 分屏参数：使用 `tmux split-window -l 18%`；`-p` 也是百分比参数的简写，关键是不要漏写尺寸

Codex 的 session 文件里本来就会写出类似字段：

- `input_tokens`
- `output_tokens`
- `cached_input_tokens`
- `reasoning_output_tokens`
- `model_context_window`

所以这个方案本质上是"外部读事件，外部显示"，不是去改 Codex 内部 UI。

---

## 具体实现

### 1. 新增包装脚本

脚本放在：

```bash
~/.local/bin/codex-usage
```

它做了三件事：

1. 检查系统里有没有 `tmux`
2. 启动 Codex
3. 在侧窗里轮询 session JSONL，并把最新 token 状态打印出来

当前实现里，分屏用的是：

```bash
tmux split-window -v -l 18%
```

这里使用 `-l 18%` 更直观。  
`size missing` 通常是因为没有提供尺寸或百分比参数，而不是 `-p` 被移除：

```text
size missing
```

使用 `-l 18%` 更兼容。

### 2. 读取 session 文件

脚本会扫描：

```bash
~/.codex/sessions/**/*.jsonl
```

然后找最近的会话文件，从中提取 `token_count` 事件。  
如果当前不在 `tmux` 中，它会退回普通 `codex`，不影响原有用法。

下面是一份最小骨架。不同 Codex 版本的字段名可能不同，按实际 JSONL 调整 `jq` 过滤条件即可：

```bash
#!/usr/bin/env bash
set -euo pipefail

# 没有 tmux 时保持原样运行
if ! command -v tmux >/dev/null 2>&1; then
  exec codex "$@"
fi

# 侧窗模式：只读最新 session 文件，打印最近的 token_count
if [ "${1:-}" = "--watch" ]; then
  root="${CODEX_HOME:-$HOME/.codex}/sessions"
  while true; do
    file=$(find "$root" -name '*.jsonl' -type f -print0 2>/dev/null \
      | xargs -0 ls -t 2>/dev/null | head -1)
    if [ -n "${file:-}" ]; then
      tail -n 50 "$file" \
        | jq -r 'select(.type == "token_count" or .payload?.type == "token_count") | .payload // .' \
        | tail -1
    fi
    sleep 1
  done
fi

# 不在 tmux 里时，先建一个会话再回来
if [ -z "${TMUX:-}" ]; then
  exec tmux new-session -A -s codex-usage "$0" "$@"
fi

tmux split-window -v -l 18% "$0" --watch
exec codex "$@"
```

### 3. 保持可回滚

这个实现是独立包装器，不覆盖原始 `codex` 命令，不改系统级配置。  
所以回滚只需要删掉这个脚本即可。

---

## 使用方法

### 最简单用法

```bash
codex-usage
```

### 带提示词启动

```bash
codex-usage "你的任务描述"
```

### 透传 Codex 参数

```bash
codex-usage -- -m gpt-5.4
```

### 期望效果

在 `tmux` 环境中，会出现一个上下分屏：

- 上半部分：Codex 主会话
- 下半部分：上下文 / token 状态

显示内容会类似：

```text
ctx 123,456/258,400 (47.8%) | in 120,000 | out 3,456 | cached 80,000 | reason 1,024 | last 4,560
```

---

## 回滚方法

这个方案的回滚很简单。

### 方式一：删除包装脚本

```bash
rm ~/.local/bin/codex-usage
```

### 方式二：如果你以后自己加了别名，再删别名

如果你后来手动加了 shell alias 或函数，比如：

```bash
alias codex='codex-usage'
```

那就去你的 shell 配置里删掉那一行即可。

### 方式三：不改任何现有 Codex 配置

这个方案本身不会改：

- `~/.codex/auth.json`
- `~/.codex/config.toml`
- Windows 侧的 Codex 配置

所以一般不需要额外清理。

---

## 验证方式

可以先做两个最小验证：

```bash
command -v codex-usage
python3 -m py_compile ~/.local/bin/codex-usage
```

如果这两个都通过，说明脚本已经可用。

还可以单独验证 tmux 分屏参数：

```bash
s=codex-usage-test-$$
tmux new-session -d -s "$s" 'sleep 3'
tmux split-window -t "$s:0" -v -l 18% 'sleep 1'
tmux kill-session -t "$s"
```

这一步如果没有输出 `size missing`，说明分屏参数已被正确接受。

---

## 注意事项

- 这个实现依赖 `tmux`，没有 `tmux` 时会退回普通 Codex
- 它读取的是 session 日志，不是 Codex 内部实时 API
- 它显示的是当前会话的使用情况，不是全局账号配额
- 如果看到 `size missing`，优先检查脚本里是否还在使用 `tmux split-window -p 18`
- 如果以后 Codex CLI 原生加了状态栏，这个方案可以直接废弃

---

## 适用结论

如果你的目标是：

- 先快速看到上下文占用
- 不想动 Codex 本体配置
- 需要明确可回滚

那这个方案是合适的。  
它够轻，也够独立，后续要删掉不会留下配置债。
