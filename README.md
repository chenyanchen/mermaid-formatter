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
npm install mermaid-formatter
```

## Usage

### CLI

```bash
# Format file to stdout
npx mermaid-formatter diagram.mmd

# Format file in-place
npx mermaid-formatter -w diagram.mmd

# Format from stdin
echo "sequenceDiagram
  A->>B: hello" | npx mermaid-formatter

# Custom indent (default: 4 spaces)
npx mermaid-formatter --indent 2 diagram.mmd

# Use tabs instead of spaces
npx mermaid-formatter --tabs diagram.mmd
```

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
//     A->>B: Hello

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
- Block keywords (`critical`, `alt`, `loop`, `par`, `opt`, `break`, `rect`, `subgraph`, `end`) at column 0
- Content inside blocks indented by configured amount
- Consecutive blank lines collapsed to single blank line
- Blank line inserted before block starts
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
- Prettier plugin (coming soon)

## Contributing

Issues and PRs welcome! See [GitHub Issues](https://github.com/chenyanchen/mermaid-formatter/issues).

## License

MIT
