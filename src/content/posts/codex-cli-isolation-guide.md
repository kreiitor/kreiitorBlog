---
title: "Codex CLI 当前目录隔离与中转服务配置指南"
description: "记录在 Linux 远程服务器的共享环境中，如何通过项目内 .codex-home 隔离 Codex CLI 的配置、认证、日志与会话，并使用中转服务 base_url 和 API key 启动 Codex，避免读取同门或外部目录的 ~/.codex 配置。"
pubDate: 2026-05-20
updatedDate: 2026-10-11
tags:
  - "工具"
  - "AI"
  - "CLI"
category: knowledge
cover: /covers/post-tools.svg
---

## 这篇文档解决什么问题

在导师服务器、实验室服务器或多人共享账号环境中使用 Codex CLI 时，常见问题是：

- 不想读取同门已经配置好的 `~/.codex`
- 希望 Codex 只在当前项目目录中保存配置、日志、会话
- 使用中转服务，而不是直接用 OpenAI 官方登录
- 已经写了 `base_url` 和 API key，但启动时仍然弹出登录菜单
- `codex login status` 显示 `Not logged in`，但 Codex 实际可以对话
- 之前项目里的 `.codex/config.toml` 和用户级配置混在一起，导致行为难以判断

核心方案是：不要依赖当前目录下的 `.codex/config.toml` 作为完整隔离方案，而是显式设置 `CODEX_HOME`，让 Codex 把用户级状态目录放进当前项目。

---

## 核心结论

Codex 默认会使用：

```bash
~/.codex
```

如果多人共用同一台服务器、同一个 Linux 用户，或者同门已经在默认目录配置过 Codex，那么直接运行：

```bash
codex
```

可能会读取外部已有配置。

项目级 `.codex/config.toml` 只能作为项目覆盖层，不能完全替代用户级 Codex home。对于中转服务这类 provider 配置，应该放到隔离后的 Codex home 目录中。

推荐结构是：

```text
/srv/project
├── .codex-home/
│   ├── config.toml
│   ├── sessions/
│   ├── logs_*.sqlite
│   └── state_*.sqlite
└── run-codex.sh
```

其中：

| 路径 | 作用 |
| --- | --- |
| `.codex-home` | 当前项目专用的 Codex 用户目录 |
| `.codex-home/config.toml` | 当前项目专用 Codex 配置 |
| `.codex-home/sessions` | 当前项目专用会话记录 |
| `run-codex.sh` | 固定设置 `CODEX_HOME` 和 API key 的启动脚本 |
| `.codex` | 可选的项目级说明或覆盖配置，不是完整隔离目录 |

---

## 一、创建项目内 Codex home

进入项目目录：

```bash
cd /srv/project
```

创建隔离目录：

```bash
mkdir -p .codex-home
chmod 700 .codex-home
```

这里使用 `.codex-home`，而不是 `.codex`。  
原因是 `.codex` 更适合保留项目级规则或说明；`.codex-home` 则明确表示这是 Codex 的用户状态目录。

---

## 二、配置中转服务

创建当前目录专用配置：

```bash
cat > .codex-home/config.toml <<'EOF'
model_provider = "custom_provider"
model = "gpt-5-codex"

[model_providers.custom_provider]
name = "custom_provider"
base_url = "https://api.example.com/v1"
env_key = "OPENAI_API_KEY"
wire_api = "responses"
EOF

chmod 600 .codex-home/config.toml
```

关键点：

| 配置项 | 含义 |
| --- | --- |
| `model_provider = "custom_provider"` | 让 Codex 使用名为 `custom_provider` 的 provider |
| `model = "gpt-5-codex"` | 默认模型名，可按中转服务支持情况修改 |
| `base_url = "https://api.example.com/v1"` | 中转服务地址 |
| `env_key = "OPENAI_API_KEY"` | 从环境变量 `OPENAI_API_KEY` 读取 API key |
| `wire_api = "responses"` | 使用 Responses API 格式 |

注意：`env_key = "OPENAI_API_KEY"` 不是把 API key 写在配置里，而是告诉 Codex 去环境变量 `OPENAI_API_KEY` 读取密钥。

---

## 三、创建当前目录专用启动脚本

创建 `run-codex.sh`：

```bash
cat > run-codex.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

export CODEX_HOME="$PWD/.codex-home"
export OPENAI_API_KEY="把你的 sk-... API key 放在这里"

exec codex "$@"
EOF

chmod 700 run-codex.sh
```

之后固定使用：

```bash
./run-codex.sh
```

不要直接运行：

```bash
codex
```

因为裸运行 `codex` 时，如果当前 shell 没有设置 `CODEX_HOME`，Codex 仍可能读取默认的 `~/.codex`。

---

## 四、验证是否隔离成功

启动：

```bash
cd /srv/project
./run-codex.sh
```

如果终端出现类似信息：

```text
OpenAI Codex
model:     gpt-5-codex
directory: /srv/project
```

并且能够正常对话，说明中转服务路径可用。

再检查 `.codex-home` 是否产生状态文件：

```bash
ls -la .codex-home
```

常见输出包括：

```text
config.toml
history.jsonl
sessions
logs_2.sqlite
state_5.sqlite
skills
tmp
```

这些文件出现在 `.codex-home` 中，说明 Codex 的日志、会话和状态已经写入当前项目目录。

---

## 五、为什么 `codex login status` 会显示 Not logged in

在中转服务模式下，看到下面输出不一定是错误：

```bash
CODEX_HOME="$PWD/.codex-home" codex login status
```

可能显示：

```text
Not logged in
```

原因是 `codex login status` 主要检查 Codex 官方账号登录状态，例如 ChatGPT 登录或官方 API key 登录。  
如果当前配置走的是自定义 provider，并且 API key 来自 `OPENAI_API_KEY` 环境变量，那么即使 `login status` 显示未登录，Codex 仍然可以通过中转服务正常请求模型。

判断是否可用，应该以实际对话和中转服务响应为准。

---

## 六、如果启动时仍然弹出登录菜单

如果看到：

```text
Sign in with ChatGPT
Sign in with Device Code
Provide your own API key
```

优先检查下面几项。

### 6.1 是否通过脚本启动

应该使用：

```bash
./run-codex.sh
```

不要使用：

```bash
codex
```

### 6.2 当前 shell 是否设置了 CODEX_HOME

如果不用脚本，必须先设置：

```bash
cd /srv/project
export CODEX_HOME="$PWD/.codex-home"
export OPENAI_API_KEY="你的 sk-... API key"
codex
```

### 6.3 配置文件是否在正确位置

应该存在：

```bash
ls -l .codex-home/config.toml
```

不应该只依赖：

```bash
.codex/config.toml
```

### 6.4 `env_key` 是否误写成明文 key

正确写法：

```toml
env_key = "OPENAI_API_KEY"
```

错误理解：

```toml
env_key = "sk-..."
```

`env_key` 写的是环境变量名字，不是 API key 本身。

---

## 七、模型名问题

如果 Codex 启动后提示切换模型，例如：

```text
Model changed to gpt-5.5 high
```

说明当前环境可能支持新模型，或者用户在 CLI 中通过 `/model` 切换过模型。

如果想固定模型，可以修改：

```bash
nano .codex-home/config.toml
```

把：

```toml
model = "gpt-5-codex"
```

改成中转服务支持的模型名，例如：

```toml
model = "gpt-5.5"
```

如果模型名不被中转服务支持，常见表现是请求失败、超时或模型不存在。  
这种情况下应该查看中转服务后台支持的模型列表，并把 `model` 改成可用值。

---

## 八、权限设置

推荐权限：

```bash
chmod 700 run-codex.sh
chmod 700 .codex-home
chmod 600 .codex-home/config.toml
```

检查：

```bash
ls -l run-codex.sh .codex-home/config.toml
```

期望类似：

```text
-rw------- 1 user user 303 Jun  2 11:29 .codex-home/config.toml
-rwx------ 1 user user 207 Jun  2 11:28 run-codex.sh
```

含义：

| 权限 | 含义 |
| --- | --- |
| `700` | 只有当前用户可读、写、执行 |
| `600` | 只有当前用户可读、写 |

只要同门不是同一个 Linux 用户，就无法读取你的脚本和配置。

---

## 九、原来的 `.codex` 是否可以删除

如果之前把配置写在当前项目的 `.codex/config.toml`，并且已经移动到：

```text
.codex-home/config.toml
```

那么原来的 `.codex` 可以检查后删除：

```bash
cd /srv/project
ls -la .codex
```

如果里面只有旧的 `config.toml`，可以删除：

```bash
rm -rf .codex
```

如果里面有项目说明、指令、skills 或其他人工维护文件，先不要删除。

再次强调：

```text
.codex       项目级说明或覆盖配置，可选
.codex-home  当前项目专用 Codex 用户目录，不能删
```

---

## 十、完整可复制版本

下面是一套从零开始的完整命令。执行前把 API key 占位符替换成自己的密钥。

```bash
cd /srv/project

mkdir -p .codex-home
chmod 700 .codex-home

cat > .codex-home/config.toml <<'EOF'
model_provider = "custom_provider"
model = "gpt-5-codex"

[model_providers.custom_provider]
name = "custom_provider"
base_url = "https://api.example.com/v1"
env_key = "OPENAI_API_KEY"
wire_api = "responses"
EOF

chmod 600 .codex-home/config.toml

cat > run-codex.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

export CODEX_HOME="$PWD/.codex-home"
export OPENAI_API_KEY="把你的 sk-... API key 放在这里"

exec codex "$@"
EOF

chmod 700 run-codex.sh

./run-codex.sh
```

---

## 排查命令清单

检查 Codex home：

```bash
cd /srv/project
CODEX_HOME="$PWD/.codex-home" codex login status
ls -la .codex-home
```

检查配置文件权限：

```bash
ls -l run-codex.sh .codex-home/config.toml
```

临时绕过脚本启动：

```bash
cd /srv/project
export CODEX_HOME="$PWD/.codex-home"
export OPENAI_API_KEY="你的 sk-... API key"
codex
```

如果怀疑模型名不支持，先改 `.codex-home/config.toml` 里的：

```toml
model = "gpt-5-codex"
```

改成中转服务确认支持的模型名。

---

## 安全注意事项

API key 不建议写入公开仓库，也不建议提交到 Git。

如果当前项目是 Git 仓库，建议加入 `.gitignore`：

```bash
cat >> .gitignore <<'EOF'
.codex-home/
run-codex.sh
EOF
```

如果 API key 曾经被发到公开聊天、日志、截图或仓库中，应该在服务后台吊销旧 key，并重新生成新 key。
