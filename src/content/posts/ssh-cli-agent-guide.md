---
title: "远程服务器 SSH 连接与 CLI AI 代理使用指南"
description: "整理远程服务器 SSH、tmux、VS Code Remote 与 CLI AI 代理的配置、密钥管理和安全实践。"
pubDate: 2026-06-04
updatedDate: 2026-10-26
tags:
  - "SSH"
  - "CLI"
  - "AI"
  - "工具"
category: knowledge
cover: /covers/post-cli-terminal.svg
---

## 适用场景

连接 GPU 服务器、云主机或 HPC 集群时，SSH 配置、会话保持、密钥管理和远程 CLI AI 代理的使用容易混在一起。下面按连接、保持、开发、代理四部分整理，命令按 OpenSSH 9+ 验证。

---

## 一、SSH 配置——一切远程工作的基础

### 1.1 为什么需要配置 `~/.ssh/config`

很多人习惯每次手动输入完整 SSH 命令：

```bash
ssh -p 2222 -i ~/.ssh/my_key alice@203.0.113.10
```

这种方式的缺点很明显：

- 每次都要记 IP、端口、用户名
- 容易打错
- 不方便管理多台服务器（开发、测试、生产）
- scp、rsync、VS Code 等工具无法直接复用

使用 `~/.ssh/config` 后，你只需要：

```bash
ssh prod-server
```

所有参数都预先定义好，所有工具都能共用这份配置。

### 1.2 创建和配置 SSH Config

**Windows 和 Linux 通用路径**：`~/.ssh/config`

在 PowerShell 中创建：

```powershell
$sshDir = "$env:USERPROFILE\.ssh"
if (-not (Test-Path $sshDir)) { New-Item -ItemType Directory -Path $sshDir }
New-Item -ItemType File -Path "$sshDir\config" -Force
```

> **权限注意**：config 文件权限应为 600（Linux/macOS 下 `chmod 600 ~/.ssh/config`）。Windows 下通常不需要额外设置，但如果权限过宽 SSH 会拒绝读取。

### 1.3 一套可直接参考的 SSH Config

```ssh-config
# ═══════════════════════════════════════════
# 全局默认（放在文件最后，对所有 Host 生效）
# ═══════════════════════════════════════════
Host *
    ServerAliveInterval 60
    ServerAliveCountMax 5
    TCPKeepAlive yes
    Compression yes
    ForwardAgent no
    ForwardX11 no
    IdentitiesOnly yes
    AddKeysToAgent yes
    StrictHostKeyChecking ask

# ═══════════════════════════════════════════
# 生产服务器
# ═══════════════════════════════════════════
Host prod-web
    HostName 203.0.113.10
    User deploy
    Port 22
    IdentityFile ~/.ssh/id_ed25519_prod
    LocalForward 8080 localhost:8080
    LocalForward 5432 localhost:5432

# ═══════════════════════════════════════════
# GPU 开发服务器（非标准端口）
# ═══════════════════════════════════════════
Host gpu-dev
    HostName 192.168.1.100
    User developer
    Port 2222
    IdentityFile ~/.ssh/id_ed25519_dev
    LocalForward 8888 localhost:8888
    LocalForward 6006 localhost:6006

# ═══════════════════════════════════════════
# 跳板机（Bastion / Jump Host）
# ═══════════════════════════════════════════
Host bastion
    HostName jump.example.com
    User ops
    IdentityFile ~/.ssh/id_ed25519_bastion

# ═══════════════════════════════════════════
# 通过跳板机访问的内网服务器
# ═══════════════════════════════════════════
Host db-internal
    HostName 10.0.1.50
    User postgres
    IdentityFile ~/.ssh/id_ed25519_prod
    ProxyJump bastion

# ═══════════════════════════════════════════
# GitHub / GitLab（多密钥场景）
# ═══════════════════════════════════════════
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_github
    IdentitiesOnly yes

Host gitlab.com
    HostName gitlab.com
    User git
    IdentityFile ~/.ssh/id_ed25519_gitlab
    IdentitiesOnly yes
```

### 1.4 关键配置项说明

| 选项                    | 作用                             | 推荐值                 |
| --------------------- | ------------------------------ | ------------------- |
| `HostName`            | 服务器真实 IP 或域名                   | 你的服务器地址             |
| `User`                | 登录用户名                          | 你的远程用户名             |
| `Port`                | SSH 端口                         | 默认 22，建议改成非标准端口     |
| `IdentityFile`        | 指定密钥路径                         | `~/.ssh/id_ed25519` |
| `IdentitiesOnly`      | 只用配置指定的密钥，不尝试 ssh-agent 中的其他密钥 | `yes`（安全）           |
| `ServerAliveInterval` | 每隔 N 秒发送心跳保活                   | `60`（标准），`15`（激进）   |
| `ServerAliveCountMax` | 连续 N 次心跳失败后断开                  | `5`（配合 60 秒 = 5 分钟） |
| `Compression`         | 启用 SSH 压缩（慢速网络下有用）             | `yes`               |
| `ForwardAgent`        | 将本地 ssh-agent 转发到远程            | `no`（安全风险，按需开启）     |
| `ProxyJump`           | 通过跳板机连接                        | 跳板机的 Host 别名        |
| `LocalForward`        | 本地端口转发 → 远程服务                  | `本地端口 远程主机:远程端口`    |
| `DynamicForward`      | SOCKS 代理端口                     | 例如 `9999`           |

### 1.5 连接复用（大幅加速重复连接）

同一个服务器多次连接时，共享一条 TCP 通道，第二次起几乎瞬间完成：

```ssh-config
Host *
    ControlMaster auto
    ControlPath ~/.ssh/sockets/%r@%h:%p
    ControlPersist 10m
```

先创建 socket 目录：

```bash
mkdir -p ~/.ssh/sockets
```

效果：第一次连接建立 TCP 隧道，后续的 ssh、scp、rsync、sftp 全部复用，认证过程几乎为零延迟。

---

## 二、SSH 密钥管理

### 2.1 生成密钥（首选 Ed25519）

Ed25519 是现代标准：更快、更安全、密钥更短。

```bash
# Ed25519（推荐）
ssh-keygen -t ed25519 -C "你的邮箱@example.com" -f ~/.ssh/id_ed25519

# RSA 4096（仅用于不支持 Ed25519 的老系统）
ssh-keygen -t rsa -b 4096 -C "你的邮箱@example.com" -f ~/.ssh/id_rsa_4096
```

**密钥类型对比**：

| 类型 | 安全性 | 兼容性 | 速度 | 推荐 |
|------|--------|--------|------|------|
| Ed25519 | 高 | 现代系统 | 较快 | 优先 |
| RSA 4096 | 高 | 通用 | 较慢 | 老系统备选 |
| ECDSA | 高 | 较好 | 快 | 不推荐（随机数风险） |
| DSA | 低 | 老旧 | 慢 | **已废弃，不要用** |

### 2.2 务必设置密钥密码

没有密码的私钥一旦泄露，等同于服务器被直接入侵。推荐设置强密码：

```bash
# 生成时设置密码（交互式提示）
ssh-keygen -t ed25519 -C "your@email.com"

# 为已有密钥添加或修改密码
ssh-keygen -p -f ~/.ssh/id_ed25519
```

### 2.3 使用 ssh-agent 避免反复输入密码

**Windows（PowerShell）**：

```powershell
# 设置 ssh-agent 为自动启动
Get-Service ssh-agent | Set-Service -StartupType Automatic
Start-Service ssh-agent

# 添加密钥到 agent（只需输入一次密码）
ssh-add $env:USERPROFILE\.ssh\id_ed25519

# 查看已加载的密钥
ssh-add -l
```

**Linux**：

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

### 2.4 部署公钥到服务器

```bash
# 方法一：ssh-copy-id（推荐）
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@server

# 方法二：手动复制（如果没有 ssh-copy-id）
type ~/.ssh/id_ed25519.pub | ssh user@server "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

### 2.5 权限检查常见问题

| 文件/目录 | 正确权限 | 问题表现 |
|-----------|----------|----------|
| `~/.ssh/` | `700` (drwx------) | SSH 拒绝连接 |
| `~/.ssh/id_ed25519`（私钥） | `600` (-rw-------) | 提示 "Permissions are too open" |
| `~/.ssh/id_ed25519.pub`（公钥） | `644` (-rw-r--r--) | 一般无影响 |
| `~/.ssh/authorized_keys`（服务器端） | `600` (-rw-------) | 密钥登录失败 |
| `~/.ssh/config` | `600` (-rw-------) | 配置不生效 |

---

## 三、TMUX——远程会话的持久化基石

### 3.1 为什么必须用 tmux

SSH 连接断了（合上笔记本、切换 Wi-Fi、VPN 掉线），终端里正在跑的程序跟着就没了。

tmux 解决这个问题：**会话在服务器上持续运行，你只是"接上"和"离开"**。就算网络断了，程序照跑不误。

| 功能 | tmux | screen | 评价 |
|------|------|--------|------|
| 会话管理 | 优秀 | 基础 | tmux 强得多 |
| 窗口分割 | 横向 + 纵向 | 有限 | tmux 体验更好 |
| 配置体验 | 清晰易懂 | 语法晦涩 | tmux 更友好 |
| 维护状态 | 活跃更新 | 维护模式 | tmux 更可靠 |
| 现代生态 | 丰富（插件系统） | 有限 | tmux 完胜 |

**结论**：除非有 screen 遗留依赖，否则一律用 tmux。

### 3.2 安装

```bash
# Ubuntu / Debian
sudo apt install tmux

# CentOS / RHEL
sudo yum install tmux

# macOS
brew install tmux
```

### 3.3 核心操作速查

默认前缀键：`Ctrl+b`。先按 `Ctrl+b`，松手，再按功能键。

**会话管理**：

```text
tmux                        # 启动新会话
tmux new -s work            # 启动命名会话 "work"
tmux ls                     # 列出所有会话
tmux attach -t work         # 接入会话 "work"
tmux kill-session -t work   # 杀死会话 "work"
Ctrl+b d                    # 脱离当前会话（Detach）
Ctrl+b $                    # 重命名当前会话
Ctrl+b s                    # 会话列表（方向键选择）
```

**窗口管理**：

```text
Ctrl+b c                    # 新建窗口
Ctrl+b ,                    # 重命名当前窗口
Ctrl+b n / p                # 下一个 / 上一个窗口
Ctrl+b 0-9                  # 跳到指定编号窗口
Ctrl+b &                    # 关闭当前窗口
Ctrl+b w                    # 窗口列表预览
```

**窗格（Pane）管理**：

```text
Ctrl+b %                    # 垂直分割（左右）
Ctrl+b "                    # 水平分割（上下）
Ctrl+b <方向键>              # 切换到方向键对应的窗格
Ctrl+b o                    # 循环切换窗格
Ctrl+b x                    # 关闭当前窗格
Ctrl+b z                    # 当前窗格全屏 / 恢复
Ctrl+b Ctrl+<方向键>         # 调整窗格大小（按住 Ctrl 不放）
Ctrl+b Space                # 切换内置布局
```

**复制模式（翻页查看历史输出）**：

```text
Ctrl+b [                    # 进入复制模式
Ctrl+b PgUp                 # 直接进入复制模式并上翻
Space                       # 开始选择（vi 模式）
Enter                       # 复制选中内容（vi 模式）
Ctrl+b ]                    # 粘贴
q 或 Esc                    # 退出复制模式
```

### 3.4 推荐 `.tmux.conf`

```bash
# ─── 基础设置 ───
set -g default-terminal "tmux-256color"
set -g history-limit 50000
set -g mouse on
set -g set-titles on

# ─── 窗口 / 窗格编号从 1 开始 ───
set -g base-index 1
setw -g pane-base-index 1

# ─── 更直观的分割快捷键 ───
bind v split-window -h -c "#{pane_current_path}"
bind s split-window -v -c "#{pane_current_path}"

# ─── 窗格切换（不需要每次按 Ctrl+b） ───
bind h select-pane -L
bind j select-pane -D
bind k select-pane -U
bind l select-pane -R

# ─── vi 风格复制模式 ───
setw -g mode-keys vi
bind -T copy-mode-vi v send-keys -X begin-selection
bind -T copy-mode-vi y send-keys -X copy-selection-and-cancel

# ─── 快捷键重载配置 ───
bind r source-file ~/.tmux.conf \; display "Config reloaded!"
```

### 3.5 每日工作流模板

```bash
# 早上开始工作
ssh gpu-dev
tmux new -s work

# 在 tmux 内分配窗口：
#   窗口 1：vim / vscode 编辑代码
#   窗口 2：编译 / 训练 / 部署
#   窗口 3：数据库 / 日志
#   窗口 4：htop / nvidia-smi 监控

# 中午吃饭，断开连接：
#   按 Ctrl+b d 脱离

# 下午回来，重新连上：
ssh gpu-dev
tmux attach -t work
# 一切保持原样，程序没有中断

# 网络意外断开？重新 SSH，tmux attach 即可
```

### 3.6 配合 Mosh 使用（网络不稳定时）

Mosh 是 SSH 的增强替代，专为高延迟、不稳定网络设计：

- 本地即时回显（打字不等网络确认）
- 切换网络不掉线（Wi-Fi → 手机热点无缝切换）
- 笔记本休眠后自动恢复

```bash
# 安装（客户端和服务端都需要）
sudo apt install mosh   # Debian/Ubuntu
brew install mosh       # macOS

# 连接并自动 attach tmux
mosh gpu-dev -- tmux new -A -s work
```

**Mosh + tmux 是常用组合**：Mosh 改善连接稳定性，tmux 保证会话持久。

> Mosh 的限制：不支持端口转发（-L/-R/-D），不支持 agent 转发，不能滚动查看历史（用 tmux 弥补）。

---

## 四、VS Code Remote SSH——本地体验，远程算力

### 4.1 工作原理

VS Code Remote SSH 在远程服务器上运行一个完整的 VS Code Server。你本地 VS Code 只是一个瘦客户端的 UI 壳。**所有代码编辑、IntelliSense、终端、调试、扩展都发生在远程服务器上**。

好处：

- 完整的 IDE 体验，但代码和运行环境都在服务器上
- 不需要本地配置复杂的环境
- GPU 服务器上直接开发、调试、运行
- 本地的 VS Code 扩展自动同步到远程

### 4.2 安装和连接

1. 在 VS Code 扩展市场搜索安装 **Remote - SSH**
2. `Ctrl+Shift+P` → `Remote-SSH: Connect to Host...`
3. 输入 `user@host` 或选择 `~/.ssh/config` 中定义的主机
4. VS Code 自动打开新窗口，左下角绿色状态栏显示已连接的远程主机名

### 4.3 与 tmux 的配合

VS Code Remote SSH 的集成终端**跑在远程服务器上**。你可以在 VS Code 终端里直接操作 tmux：

```bash
# VS Code 终端中直接 attach tmux
tmux attach -t work
```

这样你同时拥有：

- VS Code 的编辑、导航、git 图形界面（远程）
- tmux 的持久化会话、多窗格（远程）

### 4.4 端口转发

远程服务器上的 Web 服务（如 Jupyter、TensorBoard、Web 应用），VS Code 可以自动转发到本地：

1. `Ctrl+Shift+P` → `Forward a Port`
2. 输入远程端口号（如 `8888` 对应 Jupyter，`6006` 对应 TensorBoard）
3. 本地浏览器直接访问 `http://localhost:8888`

或者在 SSH config 中永久设置：

```ssh-config
Host gpu-dev
    HostName 192.168.1.100
    User developer
    LocalForward 8888 localhost:8888
    LocalForward 6006 localhost:6006
```

---

## 五、文件传输——scp、rsync、sftp

### 5.1 工具对比

| 工具 | 适用场景 | 速度 | 断点续传 | 推荐度 |
|------|----------|------|----------|--------|
| **rsync** | 目录同步、大文件、增量传输 | 极快（delta传输） | 支持 | **首选** |
| **scp** | 简单单次复制 | 快 | 不支持 | 临时使用 |
| **sftp** | 交互式浏览、批量操作 | 中等 | 支持（reget） | 偶尔使用 |

### 5.2 rsync 常用命令

```bash
# 本地 → 远程（同步整个目录）
rsync -avzP local_project/ user@server:/remote/path/

# 远程 → 本地
rsync -avzP user@server:/remote/path/ ./local/path/

# 排除不需要同步的目录
rsync -avzP --exclude='node_modules' --exclude='.git' --exclude='__pycache__' \
    --exclude='.env' --exclude='*.log' \
    local_project/ user@server:/remote/project/

# 试运行（只看会传什么，不实际传输）
rsync -avzn --delete source/ dest/

# 镜像同步（目标多余的删除，危险操作，先用 -n 测试）
rsync -avz --delete source/ dest/

# 限速传输（KB/s），避免占满带宽
rsync -avzP --bwlimit=10000 large_data/ user@server:/data/

# 指定 SSH 端口和密钥
rsync -avz -e "ssh -p 2222 -i ~/.ssh/special_key" local/ user@server:/remote/
```

**标志解释**：

| 标志 | 含义 |
|------|------|
| `-a` | 归档模式：递归 + 保留权限、时间戳、符号链接 |
| `-v` | 详细输出 |
| `-z` | 传输时压缩 |
| `-P` | 显示进度 + 保留部分传输的文件（断点续传） |
| `-n` | 试运行（dry-run），只显示会做什么 |
| `--delete` | 删除目标有而源没有的文件 |
| `--exclude` | 排除匹配的文件/目录 |
| `--bwlimit` | 限速（单位 KB/s） |

### 5.3 scp 快速参考

```bash
# 复制文件到远程
scp file.txt user@server:/path/

# 复制目录到远程
scp -r local_dir/ user@server:/remote/dir/

# 从远程下载
scp user@server:/remote/file.txt ./local/

# 使用 SSH config 别名（省去完整地址）
scp file.txt gpu-dev:/home/developer/data/

# 压缩传输（文本文件效果好）
scp -C large_log.txt user@server:/tmp/
```

### 5.4 推荐的文件同步策略

对于远程开发场景，**优先级从高到低**：

1. **Git 首选**：代码统一走 Git，本地和远程各 `clone` 一份。AI 代理在远程修改后 `git push`，本地 `git pull`。
2. **rsync 补充**：非 Git 管理的大文件（数据集、模型权重），用 rsync 同步。
3. **避免 scp 做日常同步**：scp 不支持增量，每次都全量传输，浪费时间和带宽。

---

## 六、CLI AI 代理在远程服务器上的使用

### 6.1 架构选择——代理跑在哪一台机器上

这是最重要的架构决策，三种模式各有适用场景：

**模式 A：代理跑在远程服务器上（推荐大多数场景）**

```
本地电脑 ◄── SSH ──► 远程 GPU 服务器
                      ├── 项目代码
                      ├── CLI AI 代理（opencode / codex / claude-code）
                      ├── MCP 服务器
                      └── LLM API 调用（走服务器外网）
```

- 适用：GPU 服务器、需要服务器环境才能运行的代码、大项目在服务器上有完整依赖
- 优点：AI 直接看到完整的远程环境，能正确理解项目上下文
- 缺点：服务器需要能访问外网（调用 LLM API）

**模式 B：代理跑在本地，代码在远程**

```
本地电脑 ◄── rsync / sshfs ──► 远程 GPU 服务器
├── CLI AI 代理                 ├── 项目代码
├── 编辑器                      └── 执行环境
└── LLM API 调用
```

- 适用：远程服务器网络不稳定、想用本地 IDE、服务器不能访问外网
- 优点：代理响应更快（无网络延迟），本地编辑器体验更好
- 缺点：文件同步可能出问题，AI 看到的可能不是远程真实环境

**模式 C：代理以 headless 服务模式运行，多人共用**

```
远程服务器                    HTTP API
opencode serve                 ◄─── VS Code 插件（多个开发者）
--port 4096                    ◄─── opencode attach（终端用户）
--hostname 0.0.0.0             ◄─── 自定义脚本 / CI
```

- 适用：团队共用一台开发服务器、希望共享 AI 会话
- 优点：一次部署，多人使用，集中管理
- 缺点：需要处理并发和认证

### 6.2 OpenCode 在远程服务器上

#### 安装

```bash
# Linux 服务器（推荐安装脚本）
curl -fsSL https://opencode.ai/install | bash

# 或通过 npm
npm install -g opencode-ai

# 或通过 Homebrew（Linuxbrew）
brew install anomalyco/tap/opencode
```

#### 三种运行方式

**方式一：交互式 TUI（最常用）——通过 SSH 使用时**

```bash
# SSH 连上服务器后，直接启动
ssh gpu-dev
cd /path/to/project
opencode
```

OpenCode 会启动一个 TUI（终端用户界面），在 SSH 会话中交互使用。

**方式二：Headless 服务模式——适合长期运行**

```bash
# 在服务器上以后台服务启动
opencode serve --port 4096 --hostname 0.0.0.0

# 从本地机器通过 SSH 隧道连接
# 本地终端执行：
ssh -L 4096:localhost:4096 gpu-dev
# 然后用：
opencode attach http://localhost:4096
```

**方式三：非交互命令行——适合脚本和自动化**

```bash
# 直接执行单次任务
opencode run -m anthropic/claude-sonnet-4-5 "重构 src/auth 模块的错误处理"

# 指定输出格式
opencode run -f json "列出项目中的所有 TODO 注释"
```

#### 远程服务器推荐配置

在项目根目录创建 `opencode.json`：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "anthropic/claude-sonnet-4-5",
  "autoupdate": false,
  "shell": "bash",
  "permission": {
    "bash": "ask",
    "edit": "ask",
    "external_directory": "deny",
    "webfetch": "ask"
  },
  "snapshot": true,
  "provider": {
    "anthropic": {
      "options": {
        "apiKey": "{env:ANTHROPIC_API_KEY}",
        "timeout": 600000
      }
    }
  }
}
```

几个关键配置：

- `"autoupdate": false`：服务器上禁用自动更新，走包管理器统一管理
- `"snapshot": true`：启用撤销/重做功能
- `"shell": "bash"`：根据服务器 shell 设置
- `"permission"`：限制 AI 的操作权限，安全必备

#### `/init` 初始化项目上下文

```bash
# 在项目根目录执行
/init
```

这会分析项目结构，生成 `AGENTS.md`。建议提交到 Git，团队共用。

### 6.3 Codex CLI 在远程服务器上

#### 安装

```bash
npm install -g @openai/codex

# 或直接下载二进制
# https://github.com/openai/codex/releases/latest
```

#### 使用

```bash
# SSH 到服务器后启动
codex
# 选择 Sign in with ChatGPT 登录
# 使用 ChatGPT Plus / Pro / Business / Enterprise 计划
```

Codex CLI 的 LLM 推理在 OpenAI 服务器上进行，所以你的远程服务器只需要能访问互联网，不需要 GPU。

### 6.4 Claude Code 在远程服务器上

#### CLAUDE.md 记忆系统

Claude Code 和 OpenCode 都支持 `CLAUDE.md` 作为持久记忆：

| 位置 | 作用域 |
|------|--------|
| `~/.claude/CLAUDE.md` | 用户级（所有项目通用） |
| `项目根目录/CLAUDE.md` | 项目级（团队共享，提交到 Git） |
| `项目根目录/CLAUDE.local.md` | 本地级（不提交，个人偏好） |

#### 一个远程项目的 `CLAUDE.md` 示例

```markdown
# GPU 训练项目开发指南

## 环境说明
- 服务器：8×A100 GPU，Ubuntu 22.04
- Conda 环境：`conda activate ml-env`
- CUDA 版本：12.4

## 构建和测试
- 构建：`cmake --build build`
- 测试：`pytest tests/ -n auto -v`
- Lint：`pre-commit run --all-files`

## 注意事项
- 所有 GPU 操作前先检查 `nvidia-smi`
- 数据集路径：`/data/datasets/`
- 模型缓存路径：`/data/models/`
- 不要在 `/tmp` 下存大文件，重启会丢失

## 编码规范
- Python 3.11+，所有函数加类型标注
- Google 风格 docstring
- 最大行长 100
```

### 6.5 API 密钥在远程服务器上的安全管理

**最佳方案：环境变量（不落盘）**

```bash
# 仅在当前会话中设置，重启后消失
export ANTHROPIC_API_KEY="sk-ant-..."
export OPENAI_API_KEY="sk-..."
```

**推荐方案：受限权限文件**

```bash
# 创建安全目录
mkdir -p ~/.secrets
chmod 700 ~/.secrets

# 写入密钥文件
echo "sk-ant-..." > ~/.secrets/anthropic-key
chmod 600 ~/.secrets/anthropic-key

# 在 .bashrc 或 .zshrc 中加载（或手动 source）
export ANTHROPIC_API_KEY=$(cat ~/.secrets/anthropic-key)
export OPENAI_API_KEY=$(cat ~/.secrets/openai-key)
```

**如果使用云平台（AWS / GCP / Azure）**：

```bash
# AWS Secrets Manager
export ANTHROPIC_API_KEY=$(aws secretsmanager get-secret-value \
  --secret-id anthropic-api-key --query SecretString --output text)

# GCP Secret Manager
export OPENAI_API_KEY=$(gcloud secrets versions access latest --secret=openai-api-key)
```

**OpenCode 配置中使用变量替换**：

```json
{
  "provider": {
    "anthropic": {
      "options": {
        "apiKey": "{env:ANTHROPIC_API_KEY}"
      }
    }
  }
}
```

这样密钥永远不会出现在配置文件里。

### 6.6 各 CLI 代理环境变量参考

| 工具 | 环境变量 | 对应提供商 |
|------|----------|------------|
| opencode / claude-code | `ANTHROPIC_API_KEY` | Anthropic |
| opencode / codex | `OPENAI_API_KEY` | OpenAI |
| opencode | `GEMINI_API_KEY` | Google Gemini |
| opencode | `GITHUB_TOKEN` | GitHub Copilot |
| opencode | `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` | AWS Bedrock |
| opencode server | `OPENCODE_SERVER_PASSWORD` | 服务端密码 |

---

## 七、安全最佳实践

### 7.1 基础安全规则

1. **禁用密码登录**，只用密钥认证（修改服务器 `/etc/ssh/sshd_config` 中 `PasswordAuthentication no`）
2. **禁用 root 直接登录**：`PermitRootLogin no`
3. **不同环境用不同密钥**：开发、测试、生产各用一把独立的密钥
4. **所有私钥都设密码**
5. **`IdentitiesOnly yes`**：ssh-agent 不会把所有密钥都试一遍
6. **定期审计 `authorized_keys`**：删除不再使用的公钥

### 7.2 AI 代理的权限控制

OpenCode 提供了精细的权限系统。在你的项目 `opencode.json` 中：

```json
{
  "permission": {
    "bash": {
      "*": "ask",
      "git *": "allow",
      "npm test": "allow",
      "npm run lint": "allow",
      "rm -rf *": "deny",
      "curl *": "deny",
      "wget *": "deny",
      "sudo *": "deny",
      "chmod 777 *": "deny"
    },
    "edit": {
      "*": "ask",
      ".env": "deny",
      ".env.*": "deny",
      "**/secrets/**": "deny",
      "**/credentials/**": "deny"
    },
    "read": {
      "*": "allow",
      ".env": "deny",
      ".env.*": "deny",
      "**/secrets/**": "deny"
    },
    "external_directory": "deny",
    "webfetch": "ask"
  }
}
```

### 7.3 千万不要做

- **不要以 root 身份运行 AI 代理**
- **不要把 API 密钥硬编码在配置文件里**
- **不要把 `.env`、密钥文件提交到 Git**
- **不要在共享服务器上把代理服务端口暴露到公网**

推荐的 `.gitignore` ：

```gitignore
# 密钥和凭证
.env
.env.*
*.pem
*.key
~/.secrets/
credentials.json

# AI 代理本地配置
.opencode/
.claude/
.settings.local.json
CLAUDE.local.md

# 通用
node_modules/
__pycache__/
*.pyc
```

---

## 八、常见问题与排查

### 8.1 SSH 连接被拒绝

```bash
# 排查步骤
ssh -v user@server
```

常见原因：

- 端口号不对（不是默认的 22）
- 防火墙拦截
- `~/.ssh/config` 中 HostName 写错
- 服务器上 SSH 服务没有运行

### 8.2 "Permission denied (publickey)"

原因通常是：

- 公钥没有正确添加到服务器的 `~/.ssh/authorized_keys`
- 私钥权限不对（应为 600）
- `IdentitiesOnly yes` 但 `IdentityFile` 路径错了
- ssh-agent 没有加载正确的密钥

排查：

```bash
# 列出已加载的密钥
ssh-add -l

# 明确指定密钥尝试连接
ssh -i ~/.ssh/id_ed25519 -o IdentitiesOnly=yes user@server -v
```

### 8.3 连接总断（Write failed / Broken pipe）

检查你的 SSH config 是否设了保活参数：

```ssh-config
Host *
    ServerAliveInterval 60
    ServerAliveCountMax 5
    TCPKeepAlive yes
```

如果还断，尝试把 `ServerAliveInterval` 改小到 `15`，并检查是否有防火墙在中间切断空闲连接。

### 8.4 tmux 会话还在但 attach 不上去

```bash
# 查看所有会话
tmux ls

# 强制 attach
tmux attach -t 会话名 -d

# 如果提示 "sessions should be nested with care"
# 说明当前已经在 tmux 里，先 exit 或 Ctrl+b d 退出再 attach
```

### 8.5 AI 代理在远程服务器上提示找不到命令

通常是 PATH 问题。AI 代理启动时的环境变量可能比交互式 shell 少。

解决方式：

```bash
# 检查代理能看到的 PATH
which opencode
which python

# 如果 agent 找不到 conda 环境
# 在 CLAUDE.md 或 AGENTS.md 中明确写上：
# 使用前先执行：conda activate ml-env
```

### 8.6 API 密钥报错 "Invalid API key"

- 检查环境变量是否设置：`echo $ANTHROPIC_API_KEY`
- 如果用了 restricted 文件，检查文件权限：`ls -la ~/.secrets/`
- OpenCode 配置中变量替换格式是 `{env:VAR_NAME}`（注意大括号和冒号）

---

## 九、结论

1. **花 10 分钟配好 `~/.ssh/config`**，后续远程操作会省很多重复输入
2. **建议装 tmux**，远程会话不会因为网络断开而丢失工作
3. **VS Code Remote SSH + tmux** 是常用的远程开发组合
4. **代码走 Git 同步**，数据文件走 rsync 同步
5. AI 代理在远程服务器上首选 **模式 A**（代理跑在服务器上），最贴近实际运行环境
6. API 密钥用**环境变量**或**600 权限文件**管理，永远不要硬编码在配置文件里
7. 生产服务器务必用 OpenCode 的 permission 系统**限制 AI 代理的操作权限**
8. 所有密钥**必须设置密码**，不同环境**必须用不同密钥**

---

## 十、一个可直接复制的工作流

### 初次配置（一次性）

```bash
# 1. 生成密钥
ssh-keygen -t ed25519 -C "your@email.com"
ssh-add ~/.ssh/id_ed25519

# 2. 部署公钥
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@your-server

# 3. 编辑 ~/.ssh/config
#    复制上文 1.3 节的模板，改成你自己的服务器信息

# 4. 在服务器上安装 tmux
ssh your-server
sudo apt install tmux

# 5. 在服务器上安装 AI 代理
curl -fsSL https://opencode.ai/install | bash

# 6. 设置 API 密钥
echo "sk-ant-..." > ~/.secrets/anthropic-key
chmod 600 ~/.secrets/anthropic-key
echo 'export ANTHROPIC_API_KEY=$(cat ~/.secrets/anthropic-key)' >> ~/.bashrc
source ~/.bashrc

# 7. 回到本地，配置 VS Code Remote SSH 扩展
```

### 每日工作流

```bash
# 早上一行命令搞定
ssh your-server -t "tmux new -A -s work"

# VS Code 中也连上同一台服务器
# Ctrl+Shift+P → Remote-SSH: Connect to Host... → 选你的服务器

# 在 VS Code 终端里操作 tmux
tmux attach -t work

# 需要 AI 帮忙时
cd /path/to/project
opencode
# /init  # 首次使用
# 开始提问和协作

# 在 tmux 里跑长时间任务（训练、构建、数据迁移）
Ctrl+b c               # 新窗口
./train_model.py       # 开始训练
Ctrl+b d               # 脱离，训练继续跑

# 下班时
# 关 VS Code 窗口
# 确认 tmux 里的长时间任务还在跑
# 关终端——tmux 帮你守着一切
```

### 第二天回来

```bash
ssh your-server -t "tmux attach -t work"
# 训练可能已经完成，所有窗口原样保留
```
