---
title: "PowerShell 中文编码与 AI 工作流配置指南"
description: "系统整理 Windows 下 PowerShell 中文编码问题的成因、PowerShell 7 与 5.1 的差异、推荐配置、实际改动、验证方法、常见坑与回滚方式，适合中文 AI 工作流长期参考。"
pubDate: 2026-06-01
updatedDate: 2026-10-11
tags:
  - "PowerShell"
  - "编码"
  - "AI"
  - "工具"
category: knowledge
cover: /covers/post-cli-terminal.svg
---

## 这篇文档解决什么问题

这篇文档主要解决下面几类问题：

- PowerShell 里中文输出乱码
- AI 工具调用终端时中文工作流不顺畅
- Git 中文文件名显示异常
- Python、Node、PowerShell 之间传中文时容易出错
- Windows 上 `powershell.exe` 和 `pwsh` 混用导致行为不一致

如果你在和 AI 协作时，常见到“中文输出不对”“命令通过 shell 执行后乱码”“文件名正常但日志乱码”等现象，这篇文档就是为这种场景准备的。

---

## 为什么 PowerShell 中文会出问题

Windows 上的中文编码问题，通常不是单一工具的问题，而是多层叠加：

1. 终端本身的控制台代码页不是 UTF-8
2. PowerShell 的输入编码、输出编码和管道编码不一致
3. 老的 `Windows PowerShell 5.1` 和新的 `PowerShell 7` 默认行为不同
4. Git、Python、Node、AI 工具各自对子进程编码有自己的处理方式
5. 某些工具虽然界面是新的，但底层仍然偷偷调用 `powershell.exe`

所以中文工作流是否稳定，关键不是只看“能不能显示中文”，而是看整条链路：

`终端 -> shell -> 子进程 -> 文件读写 -> Git/AI工具`

只要其中一层还保持旧编码，中文就可能出问题。

---

## Windows PowerShell 5.1 和 PowerShell 7 的差异

### Windows PowerShell 5.1

特点：

- 系统自带
- 兼容很多老模块和老脚本
- 历史包袱比较重
- 在中文环境下更容易碰到编码不一致问题

可执行文件通常是：

```text
%SystemRoot%System32WindowsPowerShell1.0powershell.exe
```

### PowerShell 7

特点：

- 新版本，命令一般用 `pwsh`
- 跨平台
- 对现代工具链更友好
- 对 UTF-8、JSON、脚本自动化、AI 工具链更适合

可执行文件通常是：

```text
pwsh.exe
```

对于中文 AI 工作流，推荐优先使用 `PowerShell 7`，但不要立刻删除 `5.1`。  
原因很简单：老脚本可能还依赖 `5.1`，而新工作流更适合 `7`。

---

## 推荐配置方案

推荐方案不是“只升级 PowerShell”，而是同时处理 4 件事：

1. 安装 `PowerShell 7`
2. 把 Windows Terminal 默认 shell 改成 `pwsh`
3. 给 `pwsh` 配置 UTF-8 profile
4. 给 `Windows PowerShell 5.1` 也加一个 UTF-8 兜底 profile

这样做的目的很明确：

- 你主动开的终端默认走新壳
- 某些外部工具如果还偷偷调用旧壳，也不至于马上乱码

---

## 可直接使用的 profile 片段

PowerShell 7（`$PROFILE.CurrentUserAllHosts`）：

```powershell
$utf8 = [System.Text.UTF8Encoding]::new($false)
[Console]::InputEncoding = $utf8
[Console]::OutputEncoding = $utf8
$OutputEncoding = $utf8
```

Windows PowerShell 5.1（同样写入 `$PROFILE.CurrentUserAllHosts`）：

```powershell
$utf8 = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = $utf8
$OutputEncoding = $utf8
```

注意：5.1 的 `Set-Content -Encoding utf8` 会写入 BOM，PowerShell 7 的 `utf8` 默认不写 BOM；需要无 BOM 时，7 用 `-Encoding utf8NoBOM`，5.1 应改用 .NET 的 `[System.IO.File]::WriteAllText`。

---

## 一套可复用的配置顺序

1. 安装并使用 PowerShell 7。
2. 在 Windows Terminal 设置中选择默认终端。
3. 通过 `$PROFILE` 定位当前 shell 的配置文件，并统一控制台与管道编码。
4. 按需要设置 Git 的中文显示与提交编码。
5. 修改前备份配置，修改后验证中文读取、输出与重定向。

## 如何检查当前终端是不是 UTF-8

### 检查你现在是不是 `pwsh`

```powershell
(Get-Process -Id $PID) | Select-Object ProcessName,Path
```

如果看到进程名是：

```text
pwsh
```

说明你当前正在使用 `PowerShell 7`。

### 检查 PowerShell 版本

```powershell
$PSVersionTable
```

或者更短：

```powershell
"$($PSVersionTable.PSEdition) $($PSVersionTable.PSVersion)"
```

### 检查编码状态

```powershell
[Console]::InputEncoding.WebName
[Console]::OutputEncoding.WebName
$OutputEncoding.WebName
chcp.com
```

理想结果应该接近这样：

```text
utf-8
utf-8
utf-8
Active code page: 65001
```

### 直接做中文输出测试

```powershell
'中文输出测试'
```

如果直接显示正常，说明最基本的命令行中文输出已经通了。

---

## Git / Python / Node / AI 工作流中文检查

这次做过一套实际检查，结果都正常。

### 1. PowerShell 写入中文 Markdown

测试方式：

- 创建中文文件名的 Markdown
- 用 `pwsh` 追加一行中文
- 再读回最后一行

实际测试文件：

`中文说明.md`

结果：

- 中文文件名正常
- 中文内容追加正常
- 读回内容正常

### 2. Git 中文文件名显示

在临时仓库里测试：

```powershell
git status --short
```

结果：

- `中文说明.md` 正常显示
- 没有被转义成奇怪的八进制或乱码

### 3. Git 中文提交信息显示

测试命令：

```powershell
git commit -m "测试中文提交信息"
git log --oneline -1
```

实际结果能正常显示：

```text
测试中文提交信息
```

### 4. Python 中文输出

测试文件：

`print_zh.py`

结果：

- 中文输出正常

### 5. Node 中文输出

测试文件：

`print_zh.js`

结果：

- 中文输出正常

### 6. Python / Node 读取中文文件名文件

测试文件：

`read_zh.py`
`read_zh.js`

结果：

- 都能正常读取 `中文说明.md`
- 读出的最后一行中文内容正常

### 7. PowerShell 通过 STDIN 接收中文脚本

这一步很关键，因为很多 AI 工具不是直接执行脚本文件，而是把命令通过标准输入喂给 shell。

这次分别验证了：

- `pwsh -Command -`
- `powershell.exe -Command -`

结果：

- 两者都能正常接收并执行中文脚本内容

---

## 推荐的日常使用方式

如果你的主要目的是 AI 协作和中文开发，推荐这样用：

### 1. 默认使用 `pwsh`

新开终端后优先确认：

```powershell
$PSVersionTable.PSVersion
```

### 2. 遇到奇怪乱码先查这 4 项

```powershell
[Console]::InputEncoding.WebName
[Console]::OutputEncoding.WebName
$OutputEncoding.WebName
chcp.com
```

### 3. 让 AI 在仓库根目录工作

先执行：

```powershell
git status
```

如果 Git 状态正常，说明项目路径和终端链路通常也更清晰。

### 4. 中文文件读写优先显式声明 UTF-8

例如 PowerShell 写文件：

```powershell
Set-Content -Path .\test.md -Value '中文内容' -Encoding utf8
```

Python 读写文件：

```python
open("test.md", "w", encoding="utf-8")
```

不要把“系统默认编码”当成理所当然。

---

## 常见坑与排查

### 1. 终端看起来是新的，但实际跑的是旧壳

检查：

```powershell
(Get-Process -Id $PID).ProcessName
```

如果结果是：

```text
powershell
```

说明你还在 `5.1`。

### 2. Windows Terminal 改了默认 shell，但当前窗口没变

终端配置修改不会自动影响已经打开的窗口。
你需要：

- 关闭旧窗口
- 重新打开终端

### 3. PowerShell 本身没问题，但某个工具还是乱码

这通常说明：

- 那个工具自己硬编码调用了 `powershell.exe`
- 或者它用了复杂的命令拼接/转义方式
- 或者它在子进程层又改了编码

这时不要只盯着终端，而要查：

- 它到底调的是 `pwsh` 还是 `powershell.exe`
- 它是 `-Command` 执行，还是通过 STDIN 喂脚本
- 它有没有在中间包了一层别的 shell

### 4. Git 中文文件名还是转义

检查：

```powershell
git config --global --get core.quotepath
```

应该是：

```text
false
```

### 5. Python / Node 正常，但 AI 执行时还是错

说明问题很可能已经不在解释器本身，而在 AI 工具的 shell 调用链。

---

## 回滚方法

如果你想回退这次改动，可以按下面处理。

### 1. 回滚 profile 设置

把备份的 profile 覆盖回去：

```powershell
$profilePath = $PROFILE.CurrentUserAllHosts
$backupPath = "$profilePath.bak"
if (Test-Path $backupPath) { Copy-Item $backupPath $profilePath -Force }
```

### 2. 删除 `pwsh` profile

```powershell
$profilePath = $PROFILE.CurrentUserAllHosts
if (Test-Path $profilePath) { Remove-Item $profilePath }
```

### 3. 删除旧版 PowerShell 5.1 的 profile

在 Windows PowerShell 5.1 中执行：

```powershell
$profilePath = $PROFILE.CurrentUserAllHosts
if (Test-Path $profilePath) { Remove-Item $profilePath }
```

### 4. 取消 Git 全局设置

```powershell
git config --global --unset core.quotepath
git config --global --unset i18n.commitEncoding
git config --global --unset i18n.logOutputEncoding
```

### 5. 卸载 PowerShell 7

如果你确实不想继续用：

```powershell
winget uninstall --id Microsoft.PowerShell
```

一般不建议这样做，除非你确认某些旧脚本必须完全回退。

---

## 最短结论

如果你只是想记住最关键的结论，可以只记这几条：

1. Windows 中文 AI 工作流优先用 `PowerShell 7`
2. `pwsh` 和 `powershell.exe` 最好都做 UTF-8 profile 兜底
3. Git 需要设置 `core.quotepath=false` 和 UTF-8 相关项
4. 乱码问题往往不是单点问题，而是整条 shell 调用链的问题
5. 如果终端本身已经正常，但 AI 仍乱码，就该查工具怎么调用 shell，而不是只查 PowerShell 版本

---

## 通用排查入口

- 当前 PowerShell 配置：`$PROFILE`。
- Windows Terminal 设置：从应用设置菜单打开配置。
- Git 编码配置：通过 `git config --get` 查询对应选项。

不同设备的具体目录与用户名无需写入公开笔记。
