# mermaid-formatter

A formatter for [Mermaid](https://mermaid.js.org/) diagram syntax.

## Features

- Format all Mermaid diagram types (sequenceDiagram, flowchart, classDiagram, etc.)
- Normalize indentation and whitespace
- Format Mermaid code blocks in Markdown
- CLI tool and programmatic API
- Zero dependencies (lightweight)

## Installation

```bash
# Global install (recommended for CLI usage)
npm install -g mermaid-formatter
```

## Usage

### CLI

```bash
# Format file to stdout
mermaidfmt diagram.mmd

# Format file in-place
mermaidfmt -w diagram.mmd

# Format from stdin
echo "sequenceDiagram
  A->>B: hello" | mermaidfmt

# Custom indent (default: 4 spaces)
mermaidfmt --indent 2 diagram.mmd

# Use tabs instead of spaces
mermaidfmt --tabs diagram.mmd
```

### Prettier Plugin

```bash
npm install -D prettier mermaid-formatter
```

```json
// .prettierrc
{
  "plugins": ["mermaid-formatter/prettier-plugin"]
}
```

```bash
# Format Mermaid files
npx prettier --write "**/*.mmd"

# Mermaid fenced code blocks in Markdown are also formatted
npx prettier --write "**/*.md"
```

> **Global install note:** If you use `npm install -g` instead of a project-local install, VS Code's Prettier extension cannot resolve the plugin by default (it bundles its own Prettier instance). You need to point VS Code to the global Prettier in `.vscode/settings.json`:
>
> ```json
> { "prettier.prettierPath": "<global-node-modules>/prettier" }
> ```
>
> Run `npm root -g` to find your global `node_modules` path. Project-local install is recommended to avoid this.

### Programmatic API

```typescript
import { formatMermaid, formatMarkdownMermaidBlocks } from 'mermaid-formatter';

// Format Mermaid code
const input = `sequenceDiagram
      participant A
        A->>B:  Hello`;

const formatted = formatMermaid(input);
// Output:
// sequenceDiagram
//     participant A
//     A ->> B: Hello

// With options
const formatted2 = formatMermaid(input, { indentSize: 2, useTabs: false });

// Format Mermaid blocks in Markdown
const markdown = `
# My Document

\`\`\`mermaid
sequenceDiagram
  A->>B: hello
\`\`\`
`;

const formattedMarkdown = formatMarkdownMermaidBlocks(markdown);
```

### API Reference

#### `formatMermaid(input: string, options?: FormatOptions): string`

Format Mermaid diagram source code.

**Options:**

- `indentSize` (number, default: 4) - Number of spaces for indentation
- `useTabs` (boolean, default: false) - Use tabs instead of spaces

#### `formatMarkdownMermaidBlocks(markdown: string, options?: FormatOptions): string`

Format all Mermaid code blocks in a Markdown document.

#### `parse(input: string): Diagram`

Parse Mermaid source into an AST.

#### `detectDiagramType(input: string): DiagramType`

Detect the diagram type from source code.

## Formatting Rules

- Diagram declaration at column 0
- Block keywords (`critical`, `alt`, `loop`, `par`, `opt`, `break`, `rect`, `subgraph`, `end`) indented based on nesting depth
- Block continuations (`else`, `option`, `and`) at same level as their opening block keyword
- Content inside blocks indented by configured amount
- Consecutive blank lines collapsed to single blank line
- Trailing blank lines removed
- Blank line inserted before block starts
- Arrow messages normalized when line matches `from ARROW to: message` pattern (`A->>B:msg` → `A ->> B: msg`)
- Flowchart class syntax is preserved (`A --> B:::warning` is not treated as arrow message)
- Whitespace normalized (multiple spaces → single, bracket padding removed)

## Supported Diagram Types

- sequenceDiagram
- flowchart / graph
- classDiagram
- stateDiagram / stateDiagram-v2
- erDiagram
- journey
- gantt
- pie
- quadrantChart
- requirementDiagram
- gitGraph
- mindmap (preserved, indent-sensitive)
- timeline (preserved, indent-sensitive)
- sankey-beta
- xychart-beta
- block-beta
- architecture-beta

## Editor Integration

See [Integrations Guide](docs/integrations.md) for:

- VS Code setup (tasks, run-on-save)
- Pre-commit hooks
- GitHub Actions
- Prettier plugin

## Contributing

Issues and PRs welcome! See [GitHub Issues](https://github.com/chenyanchen/mermaid-formatter/issues).

## License

MIT
