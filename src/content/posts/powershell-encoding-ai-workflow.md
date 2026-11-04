---
title: "PowerShell 中文编码与 AI 工作流配置指南"
description: "Windows 下 PowerShell 中文编码问题的成因、PowerShell 7 与 5.1 的差异、推荐配置、验证方法和回滚步骤。"
pubDate: 2026-06-01
updatedDate: 2026-10-26
tags:
  - "PowerShell"
  - "编码"
  - "AI"
  - "工具"
category: knowledge
cover: /covers/post-cli-terminal.svg
---

## 适用场景

PowerShell 输出中文乱码和 Git 中文文件名显示异常都很常见，Python/Node/AI 工具之间传中文也会出错。这些现象通常来自终端、shell、子进程和文件读写各层的编码不一致，很难归到某一个工具上。

---

## 为什么 PowerShell 中文会出问题

Windows 上的中文编码问题通常叠加了好几层：

1. 终端本身的控制台代码页不是 UTF-8
2. PowerShell 的输入编码、输出编码和管道编码不一致
3. 老的 `Windows PowerShell 5.1` 和新的 `PowerShell 7` 默认行为不同
4. Git、Python、Node、AI 工具各自对子进程编码有自己的处理方式
5. 某些工具虽然界面是新的，但底层仍然偷偷调用 `powershell.exe`

所以中文工作流是否稳定，要看整条链路，不能只看「能不能显示中文」：

`终端 -> shell -> 子进程 -> 文件读写 -> Git/AI工具`

只要其中一层还保持旧编码，中文就可能出问题。

---

## Windows PowerShell 5.1 和 PowerShell 7 的差异

### Windows PowerShell 5.1

它系统自带，兼容很多老模块和老脚本，但历史包袱比较重，在中文环境下更容易碰到编码不一致问题。可执行文件通常是：

```text
C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe
```

### PowerShell 7

PowerShell 7 是新版本，命令一般用 `pwsh`，跨平台，对现代工具链、UTF-8、JSON、脚本自动化和 AI 工具链都更友好。可执行文件通常是：

```text
pwsh.exe
```

对于中文 AI 工作流，推荐优先使用 `PowerShell 7`，但不要立刻删除 `5.1`。老脚本可能还依赖 `5.1`，新工作流更适合 `7`。

---

## 推荐配置方案

推荐同时处理 4 件事，不只升级 PowerShell：

1. 安装 `PowerShell 7`
2. 把 Windows Terminal 默认 shell 改成 `pwsh`
3. 给 `pwsh` 配置 UTF-8 profile
4. 给 `Windows PowerShell 5.1` 也加一个 UTF-8 兜底 profile

这样你主动打开的终端默认走新壳；某些外部工具如果还在调用旧壳，也不至于马上乱码。

---

## 具体改动清单

### 1. 安装了 PowerShell 7

安装的版本是：

```text
PowerShell 7.6.1
```

安装方式：

```powershell
winget install --id Microsoft.PowerShell --exact --source winget
```

### 2. 把 Windows Terminal 默认 shell 改成 PowerShell 7

修改了：

`$env:LOCALAPPDATA\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\settings.json`

并保留了备份：

`$env:LOCALAPPDATA\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\settings.backup.2026-05-11.json`

新增了一个显式的 `PowerShell 7` profile，并把它设为默认 profile。

### 3. 写入了 `pwsh` 的 UTF-8 profile

文件：

`$HOME\Documents\PowerShell\Microsoft.PowerShell_profile.ps1`

核心逻辑：

```powershell
$Utf8NoBom = [System.Text.UTF8Encoding]::new($false)
[Console]::InputEncoding = $Utf8NoBom
[Console]::OutputEncoding = $Utf8NoBom
$OutputEncoding = $Utf8NoBom
chcp.com 65001 > $null
```

这几行分别统一控制台的输入编码、输出编码和 PowerShell 管道输出编码，再把控制台代码页切到 UTF-8 对应的 `65001`。

### 4. 给旧版 Windows PowerShell 5.1 加了 UTF-8 兜底

文件：

`$HOME\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1`

这样即使某些工具仍然调用：

```text
powershell.exe
```

中文链路也更稳定。

### 5. 调整了 Git 的全局中文显示设置

执行了：

```powershell
git config --global core.quotepath false
git config --global i18n.commitEncoding utf-8
git config --global i18n.logOutputEncoding utf-8
```

Git 不再把中文文件名显示成转义形式，提交信息和日志也统一按 UTF-8 处理。

---

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

这几项我都实际跑过，结果正常。

### 1. PowerShell 写入中文 Markdown

我创建了一个中文文件名的 Markdown，用 `pwsh` 追加一行中文，再读回最后一行。测试文件是 `中文说明.md`，文件名显示正常，追加的中文读回来也没问题。

### 2. Git 中文文件名显示

在临时仓库里测试：

```powershell
git status --short
```

`中文说明.md` 正常显示，没有被转义成八进制或乱码。

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

测试文件是 `print_zh.py`，中文输出正常。

### 5. Node 中文输出

测试文件是 `print_zh.js`，中文输出正常。

### 6. Python / Node 读取中文文件名文件

测试文件是 `read_zh.py` 和 `read_zh.js`，两者都能正常读取 `中文说明.md`，读出的最后一行中文内容正常。

### 7. PowerShell 通过 STDIN 接收中文脚本

这一步很关键，因为很多 AI 工具会把命令通过标准输入喂给 shell，不直接执行脚本文件。

我分别验证了 `pwsh -Command -` 和 `powershell.exe -Command -`，两者都能正常接收并执行中文脚本内容。

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

不要把「系统默认编码」当成理所当然。

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

这通常说明那个工具自己硬编码调用了 `powershell.exe`，或者用了复杂的命令拼接和转义方式，也可能在子进程层又改了编码。这时先别改终端配置，去查工具本身：它调的是 `pwsh` 还是 `powershell.exe`，用 `-Command` 执行还是通过 STDIN 喂脚本。还要看中间有没有再包一层别的 shell。

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

需要回退时，按下面的顺序处理。

### 1. 回滚 Windows Terminal 设置

把备份文件覆盖回去：

```powershell
Copy-Item `
  "$env:LOCALAPPDATA\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\settings.backup.2026-05-11.json" `
  "$env:LOCALAPPDATA\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\settings.json" `
  -Force
```

### 2. 删除 `pwsh` profile

```powershell
Remove-Item "$HOME\Documents\PowerShell\Microsoft.PowerShell_profile.ps1"
```

### 3. 删除旧版 PowerShell 5.1 的 profile

```powershell
Remove-Item "$HOME\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1"
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

## 结论

Windows 中文 AI 工作流优先用 `PowerShell 7`，`pwsh` 和 `powershell.exe` 都做 UTF-8 profile 兜底。Git 这边要设置 `core.quotepath=false` 和 UTF-8 相关项。乱码往往出在整条 shell 调用链上；终端本身正常但 AI 仍乱码时，重点查工具怎么调用 shell。

---

## 参考路径

涉及的关键路径：

- PowerShell 7 profile：`$HOME\Documents\PowerShell\Microsoft.PowerShell_profile.ps1`
- Windows PowerShell 5.1 profile：`$HOME\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1`
- Windows Terminal settings：`$env:LOCALAPPDATA\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\settings.json`
- Windows Terminal settings backup：`$env:LOCALAPPDATA\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\settings.backup.2026-05-11.json`
