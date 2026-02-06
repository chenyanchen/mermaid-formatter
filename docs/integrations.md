# Integrations

## Current Integration Methods

| 方式 | 状态 | 说明 |
|-----|------|------|
| **CLI** (`mermaidfmt`) | ✅ 可用 | 任何支持外部命令的工具都可集成 |
| **Node.js Library** | ✅ 可用 | `formatMermaid()`, `formatMarkdownMermaidBlocks()` |
| **Prettier Plugin** | 🔜 计划中 | `prettier-plugin-mermaid` |
| **VS Code Extension** | 🔜 计划中 | 原生格式化支持 |
| **Remark Plugin** | 🔜 计划中 | Markdown 处理管道 |

---

## VS Code

### Method 1: External Tool (Run on Save)

1. Install [Run on Save](https://marketplace.visualstudio.com/items?itemName=emeraldwalk.RunOnSave) extension

2. Add to `.vscode/settings.json`:

```json
{
  "emeraldwalk.runonsave": {
    "commands": [
      {
        "match": "\\.mmd$",
        "cmd": "npx mermaid-formatter -w ${file}"
      },
      {
        "match": "\\.md$",
        "cmd": "npx mermaid-formatter -w ${file}"
      }
    ]
  }
}
```

### Method 2: Task + Keybinding

```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Format Mermaid",
      "type": "shell",
      "command": "npx mermaid-formatter -w ${file}"
    }
  ]
}
```

### VS Code + Prettier

**当前状态**: Prettier 不原生支持 Mermaid。需要等待 `prettier-plugin-mermaid`。

**Workaround**: 使用 Run on Save 作为补充格式化。

---

## JetBrains IDEs (WebStorm, IntelliJ, GoLand, etc.)

### Method 1: File Watchers (推荐)

1. **Settings** → **Tools** → **File Watchers** → **+**

2. 配置:

| 字段 | 值 |
|-----|-----|
| Name | Mermaid Formatter |
| File type | Any (或自定义 .mmd) |
| Scope | Project Files |
| Program | `npx` |
| Arguments | `mermaidfmt -w $FilePath$` |
| Output paths | `$FilePath$` |
| Working directory | `$ProjectFileDir$` |

3. 对于 .md 文件，创建另一个 watcher:

| 字段 | 值 |
|-----|-----|
| File type | Markdown |
| Arguments | `mermaidfmt -w $FilePath$` (处理 mermaid 代码块) |

### Method 2: External Tools

1. **Settings** → **Tools** → **External Tools** → **+**

2. 配置:

```
Name: Format Mermaid
Program: npx
Arguments: mermaidfmt -w $FilePath$
Working directory: $ProjectFileDir$
```

3. 绑定快捷键: **Settings** → **Keymap** → 搜索 "Format Mermaid"

---

## Typora

Typora 没有内置扩展系统，但可以：

### Method 1: 保存前手动格式化

```bash
# 格式化单个文件
npx mermaid-formatter -w document.md

# 格式化目录下所有 md 文件
find . -name "*.md" -exec npx mermaid-formatter -w {} \;
```

### Method 2: 使用 fswatch (macOS) 自动格式化

```bash
# 安装 fswatch
brew install fswatch

# 监听文件变化并自动格式化
fswatch -o ~/Documents/*.md | xargs -n1 -I{} npx mermaid-formatter -w {}
```

### Method 3: 配合 Git Hooks

在提交前自动格式化（见下方 Pre-commit 章节）。

---

## mermaid.live / mermaid.ai

这些是**在线编辑器**，用于预览和分享。

**集成方式**: 无法直接集成（第三方服务）。

**建议工作流**:

1. 本地编辑 `.mmd` 文件
2. 使用 `mermaidfmt -w` 格式化
3. 复制到 mermaid.live 预览
4. 或使用 VS Code + [Mermaid Preview](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid) 扩展本地预览

---

## GitHub / GitLab Markdown

GitHub 原生渲染 mermaid 代码块，**无需格式化即可显示**。

但格式化仍有价值：
- 代码审查时更易读
- 保持团队代码风格一致

### Pre-commit Hook (推荐)

使用 [husky](https://github.com/typicode/husky) + [lint-staged](https://github.com/lint-staged/lint-staged):

```bash
npm install -D husky lint-staged
npx husky init
```

```json
// package.json
{
  "lint-staged": {
    "*.mmd": "mermaidfmt -w",
    "*.md": "mermaidfmt -w"
  }
}
```

### GitHub Actions

```yaml
# .github/workflows/format.yml
name: Format Mermaid
on: [push, pull_request]
jobs:
  format:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npx mermaid-formatter -w **/*.mmd **/*.md
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "style: format mermaid diagrams"
```

---

## 集成优先级建议

基于你的使用场景：

| 场景 | 当前可用方案 | 体验 |
|-----|-------------|------|
| **VS Code** | Run on Save | ⭐⭐⭐ 可用但需配置 |
| **JetBrains** | File Watcher | ⭐⭐⭐⭐ 原生支持外部工具 |
| **Typora** | 手动 CLI / fswatch | ⭐⭐ 需要额外步骤 |
| **mermaid.ai** | N/A (在线服务) | - |
| **GitHub** | Pre-commit / CI | ⭐⭐⭐⭐ 自动化 |

---

## Roadmap

- [ ] `prettier-plugin-mermaid` - Prettier 集成
- [ ] VS Code Extension - 原生格式化命令
- [ ] `remark-mermaid-format` - Remark/MDX 生态
- [ ] Web API - 在线格式化服务
