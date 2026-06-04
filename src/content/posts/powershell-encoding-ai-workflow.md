---
title: PowerShell 中文编码与 AI 工作流配置指南
description: 系统整理 Windows 下 PowerShell 中文编码问题的成因、PowerShell 7 与 5.1 的差异、推荐配置、验证方法、常见坑与回滚方式，适合中文 AI 工作流长期参考。
pubDate: 2026-06-01
tags:
  - PowerShell
  - 编码
  - AI
  - 工具
draft: false
---

# PowerShell 中文编码与 AI 工作流配置指南

## 这篇文档解决什么问题

这篇文档主要解决下面几类问题：

- PowerShell 里中文输出乱码
- AI 工具调用终端时中文工作流不顺畅
- Git 中文文件名显示异常
- Python、Node、PowerShell 之间传中文时容易出错
- Windows 上 `powershell.exe` 和 `pwsh` 混用导致行为不一致

如果你在和 AI 协作时，常见到"中文输出不对""命令通过 shell 执行后乱码""文件名正常但日志乱码"等现象，这篇文档就是为这种场景准备的。

---

## 为什么 PowerShell 中文会出问题

Windows 上的中文编码问题，通常不是单一工具的问题，而是多层叠加：

1. 终端本身的控制台代码页不是 UTF-8
2. PowerShell 的输入编码、输出编码和管道编码不一致
3. 老的 `Windows PowerShell 5.1` 和新的 `PowerShell 7` 默认行为不同
4. Git、Python、Node、AI 工具各自对子进程编码有自己的处理方式
5. 某些工具虽然界面是新的，但底层仍然偷偷调用 `powershell.exe`

所以中文工作流是否稳定，关键不是只看"能不能显示中文"，而是看整条链路：

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
C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe
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

推荐方案不是"只升级 PowerShell"，而是同时处理 4 件事：

1. 安装 `PowerShell 7`
2. 把 Windows Terminal 默认 shell 改成 `pwsh`
3. 给 `pwsh` 配置 UTF-8 profile
4. 给 `Windows PowerShell 5.1` 也加一个 UTF-8 兜底 profile

这样做的目的很明确：

- 你主动开的终端默认走新壳
- 某些外部工具如果还偷偷调用旧壳，也不至于马上乱码

---

## 实际改动步骤

### 1. 安装 PowerShell 7

```powershell
winget install --id Microsoft.PowerShell --exact --source winget
```

### 2. 把 Windows Terminal 默认 shell 改成 PowerShell 7

在 Windows Terminal 的设置中，新增一个显式的 `PowerShell 7` profile，并把它设为默认 profile。建议修改前先备份 settings.json。

### 3. 写入 `pwsh` 的 UTF-8 profile

文件路径：`C:\Users\your-username\Documents\PowerShell\Microsoft.PowerShell_profile.ps1`

核心逻辑：

```powershell
$Utf8NoBom = [System.Text.UTF8Encoding]::new($false)
[Console]::InputEncoding = $Utf8NoBom
[Console]::OutputEncoding = $Utf8NoBom
$OutputEncoding = $Utf8NoBom
chcp.com 65001 > $null
```

作用：

- 统一控制台输入编码
- 统一控制台输出编码
- 统一 PowerShell 管道输出编码
- 把控制台代码页切到 UTF-8 对应的 `65001`

### 4. 给旧版 Windows PowerShell 5.1 加 UTF-8 兜底

文件路径：`C:\Users\your-username\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1`

这样即使某些工具仍然调用 `powershell.exe`，中文链路也更稳定。

### 5. 调整 Git 的全局中文显示设置

```powershell
git config --global core.quotepath false
git config --global i18n.commitEncoding utf-8
git config --global i18n.logOutputEncoding utf-8
```

作用：

- Git 不再把中文文件名显示成转义形式
- Git 提交信息和日志统一按 UTF-8 处理

---

## 如何检查当前终端是不是 UTF-8

### 检查你现在是不是 `pwsh`

```powershell
(Get-Process -Id $PID) | Select-Object ProcessName,Path
```

如果看到进程名是 `pwsh`，说明你当前正在使用 `PowerShell 7`。

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

### 1. PowerShell 写入中文 Markdown

测试方式：

- 创建中文文件名的 Markdown
- 用 `pwsh` 追加一行中文
- 再读回最后一行

结果：中文文件名正常、中文内容追加正常、读回内容正常。

### 2. Git 中文文件名显示

在临时仓库里测试：

```powershell
git status --short
```

结果：中文文件名正常显示，没有被转义成八进制或乱码。

### 3. Git 中文提交信息显示

```powershell
git commit -m "测试中文提交信息"
git log --oneline -1
```

结果能正常显示中文提交信息。

### 4. Python / Node 中文输出

Python 和 Node 的中文输出均正常。

### 5. PowerShell 通过 STDIN 接收中文脚本

这一步很关键，因为很多 AI 工具不是直接执行脚本文件，而是把命令通过标准输入喂给 shell。

分别验证了 `pwsh -Command -` 和 `powershell.exe -Command -`，两者都能正常接收并执行中文脚本内容。

---

## 推荐的日常使用方式

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

不要把"系统默认编码"当成理所当然。

---

## 常见坑与排查

### 1. 终端看起来是新的，但实际跑的是旧壳

```powershell
(Get-Process -Id $PID).ProcessName
```

如果结果是 `powershell`，说明你还在 `5.1`。

### 2. Windows Terminal 改了默认 shell，但当前窗口没变

终端配置修改不会自动影响已经打开的窗口。你需要关闭旧窗口、重新打开终端。

### 3. PowerShell 本身没问题，但某个工具还是乱码

这通常说明那个工具自己硬编码调用了 `powershell.exe`，或者它用了复杂的命令拼接/转义方式。这时要查它到底调的是 `pwsh` 还是 `powershell.exe`，它是 `-Command` 执行还是通过 STDIN 喂脚本。

### 4. Git 中文文件名还是转义

```powershell
git config --global --get core.quotepath
```

应该是 `false`。

---

## 回滚方法

如果你想回退改动：

### 1. 删除 `pwsh` profile

```powershell
Remove-Item 'C:\Users\your-username\Documents\PowerShell\Microsoft.PowerShell_profile.ps1'
```

### 2. 删除旧版 PowerShell 5.1 的 profile

```powershell
Remove-Item 'C:\Users\your-username\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1'
```

### 3. 取消 Git 全局设置

```powershell
git config --global --unset core.quotepath
git config --global --unset i18n.commitEncoding
git config --global --unset i18n.logOutputEncoding
```

### 4. 卸载 PowerShell 7

```powershell
winget uninstall --id Microsoft.PowerShell
```

一般不建议这样做，除非你确认某些旧脚本必须完全回退。

---

## 最短结论

1. Windows 中文 AI 工作流优先用 `PowerShell 7`
2. `pwsh` 和 `powershell.exe` 最好都做 UTF-8 profile 兜底
3. Git 需要设置 `core.quotepath=false` 和 UTF-8 相关项
4. 乱码问题往往不是单点问题，而是整条 shell 调用链的问题
5. 如果终端本身已经正常，但 AI 仍乱码，就该查工具怎么调用 shell，而不是只查 PowerShell 版本
