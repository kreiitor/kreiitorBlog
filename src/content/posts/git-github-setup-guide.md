---
title: "Git 仓库初始化与 GitHub 连接教程"
description: "从本地初始化 Git 仓库，到连接 GitHub 并完成日常提交、拉取、分支管理和问题排查的一份实用教程。"
pubDate: 2026-05-25
updatedDate: 2026-10-11
tags:
  - "Git"
  - "GitHub"
  - "教程"
category: knowledge
cover: /covers/post-git-graph.svg
---

## 这份文档适合什么场景

这份文档适合下面几类情况：

- 你有一个本地文件夹，还不是 Git 仓库
- 你希望把本地项目接入 Git，并同步到 GitHub
- 你经常和 AI 协作，希望 AI 能识别当前目录是一个 Git 仓库
- 你想要一份可以长期复用的 Git 常用命令速查

---

## 什么是 Git 仓库

Git 是一个版本控制工具，用来记录项目文件的历史变化。  
当一个文件夹被初始化为 Git 仓库后，里面会出现一个隐藏目录 `.git`，Git 会用它保存版本历史、分支信息和远程仓库配置。

如果当前目录没有 `.git`，很多工具和 AI 助手就会提示：

```text
fatal: not a git repository (or any of the parent directories): .git
```

这通常意味着两种情况：

1. 这个目录还没有执行过 `git init`
2. 你当前所在的目录不是项目根目录，而是跑到了仓库外面

---

## 初始化一个本地 Git 仓库

### 1. 进入项目目录

```powershell
cd C:/Projects/example
```

请把 `C:/Projects/example` 替换成你的实际项目目录。

### 2. 初始化仓库

```powershell
git init
```

执行后，当前目录就会生成 `.git` 目录，说明它已经变成 Git 仓库。

### 3. 检查状态

```powershell
git status
```

如果初始化成功，通常会看到类似输出：

```text
On branch master

No commits yet
```

或者在新版 Git 中，你可能后续会把默认分支改成 `main`。

---

## 建议先配置 Git 身份

如果这是你第一次使用 Git，建议先配置用户名和邮箱。提交记录会使用这两个信息。

```powershell
git config --global user.name "你的名字"
git config --global user.email "user@example.com"
```

检查配置：

```powershell
git config --global --list
```

如果你只想给当前项目设置，而不是全局设置，可以去掉 `--global`。

---

## 建议创建 `.gitignore`

`.gitignore` 用来告诉 Git 哪些文件不要纳入版本控制。  
这一步很重要，尤其是和 AI 协作时，避免把缓存、依赖、日志、密钥文件一起提交。

常见示例：

```gitignore
.vscode/
.idea/
node_modules/
dist/
build/
__pycache__/
*.pyc
.env
*.log
Thumbs.db
```

说明：

- `node_modules/` 是前端依赖目录，通常不提交
- `__pycache__/` 和 `*.pyc` 是 Python 缓存文件
- `.env` 常包含密钥，不建议提交
- `dist/`、`build/` 往往是构建产物

---

## 首次提交代码

### 1. 把文件加入暂存区

```powershell
git add .
```

这个命令表示把当前目录下的变更全部加入本次准备提交的内容。

如果你只想提交某个文件，也可以：

```powershell
git add README.md
```

### 2. 创建第一次提交

```powershell
git commit -m "chore: initial commit"
```

如果能成功提交，说明这个项目已经有了第一个历史版本。

### 3. 建议统一主分支名称

```powershell
git branch -M main
```

很多平台默认主分支已经是 `main`，这一步可以让本地和 GitHub 保持一致。

---

## 把本地仓库连接到 GitHub

### 方法一：先在本地初始化，再连接 GitHub

这是最常见的方式，适合你已经有项目文件的情况。

### 1. 在 GitHub 上创建一个新仓库

建议在 GitHub 新建仓库时：

- 仓库名和本地项目名尽量一致
- 如果你本地已经有完整文件，创建远程仓库时不要勾选自动生成 `README`、`.gitignore`、License

这样可以减少第一次推送时的冲突。

### 2. 复制 GitHub 仓库地址

常见有两种地址：

`HTTPS`

```text
https://github.com/你的用户名/你的仓库名.git
```

`SSH`

```text
git@github.com:你的用户名/你的仓库名.git
```

如果你刚开始使用 Git，`HTTPS` 更容易上手。  
如果你长期开发，`SSH` 通常更省事。

### 3. 添加远程仓库

```powershell
git remote add origin https://github.com/你的用户名/你的仓库名.git
```

检查是否绑定成功：

```powershell
git remote -v
```

---

## 第一次推送到 GitHub

```powershell
git push -u origin main
```

说明：

- `origin` 是远程仓库默认名字
- `main` 是你要推送的本地主分支
- `-u` 会建立本地分支和远程分支的跟踪关系，之后可以直接用 `git push` 和 `git pull`

如果你使用 `HTTPS`，GitHub 现在通常不再接受账号密码直接推送，而是使用以下方式之一：

- Personal Access Token
- Git Credential Manager
- SSH Key

---

## 推荐的 GitHub 连接方式

### 方案 A：HTTPS

优点：

- 配置简单
- 适合新手

缺点：

- 首次认证时可能需要 Token

示例：

```powershell
git remote add origin https://github.com/yourname/your-repo.git
git push -u origin main
```

### 方案 B：SSH

优点：

- 长期使用更方便
- 不用反复输入凭证

缺点：

- 第一次配置稍微复杂一点

常见流程：

```powershell
ssh-keygen -t ed25519 -C "user@example.com"
```

然后把公钥内容添加到 GitHub 的 SSH Keys 设置里，再测试连接：

```powershell
ssh -T git@github.com
```

之后绑定远程仓库：

```powershell
git remote add origin git@github.com:你的用户名/你的仓库名.git
```

---

## 常用 Git 操作速查

### 查看状态

```powershell
git status
```

看当前有哪些文件被修改、暂存或未跟踪。

### 查看提交历史

```powershell
git log --oneline --graph --decorate
```

适合快速看项目历史。

### 添加变更到暂存区

```powershell
git add .
git add 文件名
```

### 提交变更

```powershell
git commit -m "feat: 添加新功能"
git commit -m "fix: 修复某个问题"
git commit -m "docs: 更新文档"
```

### 推送到远程

```powershell
git push
```

### 从远程拉取更新

```powershell
git pull
```

如果你希望历史更整洁，可以优先使用：

```powershell
git pull --rebase
```

### 查看分支

```powershell
git branch
git branch -a
```

### 新建并切换分支

```powershell
git switch -c feature/my-change
```

如果 Git 版本较老，也可以使用：

```powershell
git checkout -b feature/my-change
```

### 切换分支

```powershell
git switch main
```

### 合并分支

```powershell
git merge feature/my-change
```

### 查看远程仓库

```powershell
git remote -v
```

### 修改远程仓库地址

```powershell
git remote set-url origin https://github.com/你的用户名/你的仓库名.git
```

### 克隆仓库

```powershell
git clone https://github.com/你的用户名/你的仓库名.git
```

### 撤销工作区修改

```powershell
git restore 文件名
```

### 从暂存区移出文件

```powershell
git restore --staged 文件名
```

### 临时保存当前改动

```powershell
git stash
git stash pop
```

---

## 一个推荐的日常工作流

```powershell
git status
git pull --rebase origin main
git switch -c feature/update-docs
git add .
git commit -m "docs: update knowledge base"
git push -u origin feature/update-docs
```

如果你只是个人项目，也可以直接在 `main` 上工作，但更推荐在功能分支上修改，再合并回主分支。

---

## 常见问题与排查

### 1. `fatal: not a git repository`

原因：

- 当前目录没有 `.git`
- 你不在项目根目录

解决：

```powershell
cd 你的项目目录
git init
git status
```

如果项目本来就是 Git 仓库，先确认你是不是进错目录了。

### 2. `remote origin already exists`

原因：

- 当前仓库已经绑定过远程仓库

查看当前远程：

```powershell
git remote -v
```

修改远程地址：

```powershell
git remote set-url origin 新地址
```

### 3. `src refspec main does not match any`

原因通常是：

- 你还没有任何提交
- 当前分支不叫 `main`

解决方式：

```powershell
git add .
git commit -m "chore: initial commit"
git branch -M main
git push -u origin main
```

### 4. 推送被拒绝

常见提示：

```text
rejected
failed to push some refs
```

原因：

- 远程仓库里已经有你本地没有的提交

可以先拉取再推送：

```powershell
git pull --rebase origin main
git push origin main
```

### 5. GitHub 认证失败

原因：

- 使用 HTTPS 时还在尝试直接输入密码

解决：

- 使用 Personal Access Token
- 或改用 SSH

### 6. AI 工具总说“当前仓库不是 git 仓库”

通常是这几类原因：

- 你打开的是一个普通文件夹，不是 Git 仓库根目录
- 仓库还没有执行 `git init`
- 你让 AI 在仓库外层目录工作
- `.git` 目录被删了，或者当前会话目录不对

优先检查：

```powershell
git status
```

如果还报错，就说明当前目录确实不是 Git 仓库。

---

## 适合 AI 协作时的 Git 建议

### 1. 让 AI 在仓库根目录工作

最简单的判断方式就是先执行：

```powershell
git status
```

只要这个命令成功，说明 AI 所在目录一般是对的。

### 2. 在让 AI 大改代码前先提交一次

建议在大改前先做一个基线提交：

```powershell
git add .
git commit -m "chore: checkpoint before AI changes"
```

这样即使 AI 改坏了，也容易定位差异。

### 3. 使用功能分支做实验

```powershell
git switch -c experiment/ai-refactor
```

这样 AI 的试验性改动不会直接污染主分支。

### 4. 保持 `.gitignore` 干净

不要把缓存文件、依赖目录、密钥文件和生成物交给 Git 管理，否则仓库会很乱，AI 也更容易误操作。

### 5. 让 AI 先看 `git status`

如果你让 AI 修改项目，最好先让它检查当前仓库状态，这样它更容易理解：

- 哪些文件已经改过
- 哪些变更还没提交
- 当前所在分支是什么

---

## 最短可用流程

如果你只想要一套最短命令，可以直接照着执行：

```powershell
cd C:/Projects/example
git init
git config user.name "你的名字"
git config user.email "user@example.com"
git add .
git commit -m "chore: initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

---

## 总结

把一个普通文件夹变成 Git 仓库，核心只有三步：

1. `git init`
2. `git add .` 和 `git commit`
3. `git remote add origin ...` 再 `git push -u origin main`

如果你的目标是和 AI 稳定协作，那么最重要的是：

- 保证 AI 工作目录就是仓库根目录
- 保证目录里存在 `.git`
- 保证关键改动前后都有清晰的提交记录

这样不管是人工开发还是 AI 协作，都会稳定很多。
