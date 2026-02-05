# Integrations

## VS Code

### Option 1: Custom Task (Recommended for .mmd files)

1. Create `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Format Mermaid",
      "type": "shell",
      "command": "npx mmdfmt -w ${file}",
      "problemMatcher": [],
      "presentation": {
        "reveal": "silent"
      }
    }
  ]
}
```

2. Add keybinding in `keybindings.json`:

```json
{
  "key": "ctrl+shift+m",
  "command": "workbench.action.tasks.runTask",
  "args": "Format Mermaid",
  "when": "editorLangId == mermaid"
}
```

### Option 2: Run on Save Extension

1. Install [Run on Save](https://marketplace.visualstudio.com/items?itemName=emeraldwalk.RunOnSave) extension

2. Add to `.vscode/settings.json`:

```json
{
  "emeraldwalk.runonsave": {
    "commands": [
      {
        "match": "\\.mmd$",
        "cmd": "npx mmdfmt -w ${file}"
      }
    ]
  }
}
```

### Option 3: Format Markdown Mermaid Blocks

For `.md` files with mermaid code blocks, use the library programmatically:

```javascript
// scripts/format-md-mermaid.js
import { readFileSync, writeFileSync } from 'fs';
import { formatMarkdownMermaidBlocks } from 'mermaid-formatter';

const file = process.argv[2];
const content = readFileSync(file, 'utf-8');
const formatted = formatMarkdownMermaidBlocks(content);
writeFileSync(file, formatted);
```

Then in `.vscode/settings.json`:

```json
{
  "emeraldwalk.runonsave": {
    "commands": [
      {
        "match": "\\.md$",
        "cmd": "node scripts/format-md-mermaid.js ${file}"
      }
    ]
  }
}
```

## Prettier Plugin (Coming Soon)

A Prettier plugin is planned for future releases. This will enable:

```json
// .prettierrc
{
  "plugins": ["prettier-plugin-mermaid"]
}
```

Track progress: [GitHub Issues](https://github.com/chenyanchen/mermaid-formatter/issues)

## CLI Integration

### Pre-commit Hook

Using [husky](https://github.com/typicode/husky) and [lint-staged](https://github.com/okonet/lint-staged):

```json
// package.json
{
  "lint-staged": {
    "*.mmd": "mmdfmt -w",
    "*.md": "node scripts/format-md-mermaid.js"
  }
}
```

### GitHub Actions

```yaml
- name: Format Mermaid files
  run: npx mmdfmt -w **/*.mmd
```

## Remark Plugin (Coming Soon)

For [remark](https://github.com/remarkjs/remark) (Markdown processor):

```javascript
import { remark } from 'remark';
import remarkMermaidFormat from 'remark-mermaid-format'; // coming soon

const result = await remark()
  .use(remarkMermaidFormat)
  .process(markdown);
```
