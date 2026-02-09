# Integrations

## Current Integration Methods

| Method | Status | Notes |
|-----|------|------|
| **CLI** (`mermaidfmt`) | ✅ Available | Works with any tool that can run an external command |
| **Node.js Library** | ✅ Available | `formatMermaid()`, `formatMarkdownMermaidBlocks()` |
| **Prettier Plugin** | ✅ Available | `mermaid-formatter/prettier-plugin` |
| **VS Code Extension** | 🔜 Planned | Native formatting support |
| **Remark Plugin** | 🔜 Planned | Markdown processing pipeline |

---

## Prerequisites

### CLI / External Tool Integrations

```bash
npm install -g mermaid-formatter
```

This provides the `mermaidfmt` command for Run on Save, File Watcher, and CI shell workflows.

### Prettier Integration

```bash
npm install -D prettier mermaid-formatter
```

---

## VS Code

### Method 1: External Tool (Run on Save)

1. Install the [Run on Save](https://marketplace.visualstudio.com/items?itemName=emeraldwalk.RunOnSave) extension.

2. Add this to `.vscode/settings.json`:

```json
{
  "emeraldwalk.runonsave": {
    "commands": [
      {
        "match": "\\.mmd$",
        "cmd": "mermaidfmt -w ${file}"
      },
      {
        "match": "\\.md$",
        "cmd": "mermaidfmt -w ${file}"
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
      "command": "mermaidfmt -w ${file}"
    }
  ]
}
```

### VS Code + Prettier

Enable the plugin in your project's `.prettierrc`:

```json
{
  "plugins": ["mermaid-formatter/prettier-plugin"]
}
```

Behavior:
- `.mmd` / `.mermaid` files are formatted through the plugin.
- ` ```mermaid ` code blocks inside `.md` files are formatted automatically by Prettier (default `embeddedLanguageFormatting: "auto"`).

If the Prettier extension is installed in VS Code, this works on save.

---

## JetBrains IDEs (WebStorm, IntelliJ, GoLand, etc.)

### Method 1: File Watchers (Recommended)

1. Go to **Settings** → **Tools** → **File Watchers** → **+**.

2. Configure:

| Field | Value |
|-----|-----|
| Name | Mermaid Formatter |
| File type | Any (or custom `.mmd`) |
| Scope | Project Files |
| Program | `mermaidfmt` |
| Arguments | `-w $FilePath$` |
| Output paths | `$FilePath$` |
| Working directory | `$ProjectFileDir$` |

3. For `.md` files, create another watcher:

| Field | Value |
|-----|-----|
| File type | Markdown |
| Arguments | `-w $FilePath$` (formats Mermaid code blocks) |

### Method 2: External Tools

1. Go to **Settings** → **Tools** → **External Tools** → **+**.

2. Configure:

```
Name: Format Mermaid
Program: mermaidfmt
Arguments: -w $FilePath$
Working directory: $ProjectFileDir$
```

3. Bind a shortcut in **Settings** → **Keymap** (search for "Format Mermaid").

---

## Typora

Typora has no native extension system, but you can still integrate formatting.

### Method 1: Manual formatting before save

```bash
# Format one file
mermaidfmt -w document.md

# Format all md files in the current directory tree
find . -name "*.md" -exec mermaidfmt -w {} \;
```

### Method 2: Auto format with fswatch (macOS)

```bash
# Install fswatch
brew install fswatch

# Watch file changes and format automatically
fswatch -o ~/Documents/*.md | xargs -n1 -I{} mermaidfmt -w {}
```

### Method 3: Combine with Git hooks

Automatically format before commit (see the Pre-commit section below).

---

## mermaid.live / mermaid.ai

These are **online editors** for preview and sharing.

**Direct integration**: Not available (third-party service).

**Recommended workflow**:

1. Edit `.mmd` locally.
2. Run `mermaidfmt -w`.
3. Copy to mermaid.live for preview.
4. Or use VS Code + [Mermaid Preview](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid) for local preview.

---

## GitHub / GitLab Markdown

GitHub renders Mermaid code blocks natively, so formatting is not required for rendering.

Formatting still helps:
- Better readability in code review
- Consistent team style

### Pre-commit Hook (Recommended)

Use [husky](https://github.com/typicode/husky) + [lint-staged](https://github.com/lint-staged/lint-staged):

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
      - run: find . -name "*.mmd" -o -name "*.md" | xargs -I{} npx mermaid-formatter -w {}
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "style: format mermaid diagrams"
```

---

## Recommended Integration Priority

Based on common usage scenarios:

| Scenario | Best Current Option | Experience |
|-----|-------------|------|
| **VS Code** | Prettier Plugin | ⭐⭐⭐⭐⭐ Near-native |
| **JetBrains** | File Watcher | ⭐⭐⭐⭐ Native external-tool workflow |
| **Typora** | Manual CLI / fswatch | ⭐⭐ Extra setup required |
| **mermaid.ai** | N/A (online service) | - |
| **GitHub** | Pre-commit / CI | ⭐⭐⭐⭐ Automated |

---

## Roadmap

- [x] Prettier plugin (`mermaid-formatter/prettier-plugin`)
- [ ] VS Code Extension - Native format command
- [ ] `remark-mermaid-format` - Remark/MDX ecosystem
- [ ] Web API - Online formatting service
