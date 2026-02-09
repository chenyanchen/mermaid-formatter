# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

`mermaid-formatter` is a TypeScript-based formatter for Mermaid diagram syntax. It can be used as a library, CLI tool, or integrated into Markdown formatters.

## Build Commands

```bash
npm install          # Install dependencies
npm run build        # Build TypeScript to dist/
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run lint         # Lint source code
npm run format       # Format source code
```

## Usage

### CLI

```bash
# Install globally (recommended)
npm install -g mermaid-formatter

# Format file to stdout
mermaidfmt diagram.mmd

# Format in-place
mermaidfmt -w diagram.mmd

# From stdin
echo "sequenceDiagram" | mermaidfmt

# Custom indent (default: 4 spaces)
mermaidfmt --indent 2 diagram.mmd

# Use tabs
mermaidfmt --tabs diagram.mmd
```

### Library

```typescript
import { formatMermaid, formatMarkdownMermaidBlocks } from 'mermaid-formatter';

// Format Mermaid code
const formatted = formatMermaid(`
sequenceDiagram
    participant A
        A->>B: Hello
`);

// Format Mermaid blocks in Markdown
const markdown = formatMarkdownMermaidBlocks(`
# Document

\`\`\`mermaid
sequenceDiagram
  A->>B: hello
\`\`\`
`);
```

### Prettier Plugin

Formats `.mmd`/`.mermaid` files and Mermaid code blocks in Markdown via Prettier.

#### Project-local install (recommended)

```bash
npm install -D mermaid-formatter
```

`.prettierrc`:
```json
{
  "plugins": ["mermaid-formatter/prettier-plugin"]
}
```

#### Global install

```bash
npm install -g mermaid-formatter
```

`~/.prettierrc`:
```json
{
  "plugins": ["mermaid-formatter/prettier-plugin"]
}
```

VS Code requires an additional setting when using a global install, because the Prettier extension bundles its own Prettier instance which cannot resolve globally installed plugins. Point it to the global Prettier:

`.vscode/settings.json`:
```json
{
  "prettier.prettierPath": "/opt/homebrew/lib/node_modules/prettier"
}
```

> **Note:** The exact path depends on your Node.js installation. Run `npm root -g` to find your global `node_modules` path.

## Architecture

```
src/
├── index.ts            # Public API: formatMermaid, formatMarkdownMermaidBlocks
├── types.ts            # Type definitions (Diagram, Statement, FormatOptions)
├── rules.ts            # Centralized grammar rules and patterns
├── parser.ts           # Lightweight parser → AST conversion
├── formatter.ts        # AST → formatted output
├── prettier-plugin.ts  # Prettier plugin (parser + printer)
├── cli.ts              # CLI tool (mermaidfmt)
test/
├── formatter.test.ts   # Formatter tests
├── parser.test.ts      # Parser tests
├── markdown.test.ts    # Markdown integration tests
└── prettier-plugin.test.ts  # Prettier plugin tests
```

## Formatting Rules

- Diagram declaration at column 0
- Block keywords (`critical`, `alt`, `loop`, `par`, `opt`, `break`, `rect`, `subgraph`, `end`) indented based on nesting depth
- Block continuations (`else`, `option`, `and`) at same level as their opening block keyword
- `state Name {`, `class Name {`, `namespace Name {` with brace depth tracking
- All other statements indented by configured amount
- Consecutive blank lines collapsed to single blank line
- Blank line inserted before block starts when preceded by content
- Arrow messages are parsed by `from ARROW to: message` pattern (flowchart `:::class` syntax is preserved)
- Content normalization: multiple spaces → single, bracket padding removed

## Adding New Diagram Types

1. Add pattern in `parser.ts` `DIAGRAM_PATTERNS` array
2. Add type in `types.ts` `DiagramType` union
3. Add tests

## Adding New Block Types

1. Add keyword to `BLOCK_KEYWORDS` or `BRACE_BLOCK_KEYWORDS` in `rules.ts`
2. Add type to `BlockKind` or `BraceBlockKind` in `types.ts`
3. Add tests
