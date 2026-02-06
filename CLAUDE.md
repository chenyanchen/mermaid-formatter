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
# Format file to stdout
npx mermaid-formatter diagram.mmd

# Format in-place
npx mermaid-formatter -w diagram.mmd

# From stdin
echo "sequenceDiagram" | npx mermaid-formatter

# Custom indent (default: 4 spaces)
npx mermaid-formatter --indent 2 diagram.mmd

# Use tabs
npx mermaid-formatter --tabs diagram.mmd
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

## Architecture

```
src/
├── index.ts       # Public API: formatMermaid, formatMarkdownMermaidBlocks
├── types.ts       # Type definitions (Diagram, Statement, FormatOptions)
├── parser.ts      # Lightweight parser → AST conversion
├── formatter.ts   # AST → formatted output
├── cli.ts         # CLI tool (mermaidfmt)
└── index.test.ts  # Tests
```

## Formatting Rules

- Diagram declaration at column 0
- `critical`, `alt`, `loop`, `par`, `opt`, `break`, `rect`, `subgraph`, `end` at column 0
- `else`, `option` at column 0
- `state Name {`, `class Name {`, `namespace Name {` with brace depth tracking
- All other statements indented by configured amount
- Consecutive blank lines collapsed to single blank line
- Blank line inserted before block starts when preceded by content
- Content normalization: multiple spaces → single, bracket padding removed

## Adding New Diagram Types

1. Add pattern in `parser.ts` `DIAGRAM_PATTERNS` array
2. Add type in `types.ts` `DiagramType` union
3. Add tests in `index.test.ts`

## Adding New Block Types

1. Add keyword to `BLOCK_KEYWORDS` or `BRACE_BLOCK_KEYWORDS` in `parser.ts`
2. Add type to `BlockKind` or `BraceBlockKind` in `types.ts`
3. Add tests
