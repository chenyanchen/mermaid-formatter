# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`mmdfmt` is a Rust-based formatter for Mermaid diagram syntax, specifically supporting sequenceDiagram currently.

## Build Commands

```bash
cargo build              # Build debug
cargo build --release    # Build release
cargo run -- <file>      # Format file to stdout
cargo run -- -w <file>   # Format file in-place
cargo test               # Run all tests
cargo clippy             # Lint
cargo fmt                # Format Rust code
```

## Usage

```bash
# Format file to stdout
mmdfmt diagram.mmd

# Format in-place
mmdfmt -w diagram.mmd

# From stdin
echo "sequenceDiagram" | mmdfmt

# Custom indent (default: 4 spaces)
mmdfmt --indent 2 diagram.mmd

# Use tabs
mmdfmt --tabs diagram.mmd
```

## Architecture

```
src/
├── main.rs        # CLI (clap-based)
├── lib.rs         # Public API: format_mermaid(input, config)
├── grammar.pest   # PEG grammar for mermaid syntax
├── parser.rs      # pest → AST conversion
├── ast.rs         # AST types (Diagram, Statement, Message, etc.)
├── formatter.rs   # AST → formatted output
└── config.rs      # Config struct (indent_size, use_tabs)
```

## Formatting Rules

- `sequenceDiagram` at column 0
- `critical`, `option`, `else`, `end` at column 0
- All other statements (participant, messages, notes) indented by configured amount
- Consecutive blank lines collapsed to single blank line
- Blank line inserted before `critical`/`alt`/`loop` blocks when preceded by content

## Adding New Diagram Types

1. Add grammar rules in `grammar.pest`
2. Add AST types in `ast.rs`
3. Update parser in `parser.rs` to handle new rules
4. Update formatter in `formatter.rs` for indentation/spacing
