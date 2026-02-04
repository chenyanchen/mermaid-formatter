#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs';
import { formatMermaid } from './index.js';
import type { FormatOptions } from './types.js';

interface CliArgs {
  file?: string;
  write: boolean;
  indent: number;
  tabs: boolean;
  help: boolean;
  version: boolean;
}

function parseArgs(args: string[]): CliArgs {
  const result: CliArgs = {
    write: false,
    indent: 4,
    tabs: false,
    help: false,
    version: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '-h' || arg === '--help') {
      result.help = true;
    } else if (arg === '-v' || arg === '--version') {
      result.version = true;
    } else if (arg === '-w' || arg === '--write') {
      result.write = true;
    } else if (arg === '--tabs') {
      result.tabs = true;
    } else if (arg === '--indent') {
      const next = args[++i];
      const parsed = parseInt(next, 10);
      result.indent = Number.isNaN(parsed) ? 4 : parsed;
    } else if (arg.startsWith('--indent=')) {
      const parsed = parseInt(arg.slice(9), 10);
      result.indent = Number.isNaN(parsed) ? 4 : parsed;
    } else if (!arg.startsWith('-')) {
      result.file = arg;
    }
  }

  return result;
}

function printHelp(): void {
  console.log(`
mmdfmt - Mermaid diagram formatter

USAGE:
    mmdfmt [OPTIONS] [FILE]

ARGS:
    <FILE>    Input file (reads from stdin if not provided)

OPTIONS:
    -w, --write         Write result to source file instead of stdout
    --indent <N>        Number of spaces for indentation (default: 4)
    --tabs              Use tabs instead of spaces
    -h, --help          Print help information
    -v, --version       Print version information

EXAMPLES:
    # Format file to stdout
    mmdfmt diagram.mmd

    # Format file in-place
    mmdfmt -w diagram.mmd

    # Format from stdin
    echo "sequenceDiagram" | mmdfmt

    # Custom indent
    mmdfmt --indent 2 diagram.mmd
    mmdfmt --tabs diagram.mmd
`);
}

function printVersion(): void {
  // Read version from package.json
  try {
    const pkg = JSON.parse(
      readFileSync(new URL('../package.json', import.meta.url), 'utf-8')
    );
    console.log(`mmdfmt ${pkg.version}`);
  } catch {
    console.log('mmdfmt 0.1.0');
  }
}

async function readStdin(): Promise<string> {
  const chunks: Uint8Array[] = [];

  return new Promise((resolve, reject) => {
    process.stdin.on('data', (chunk: Buffer) => chunks.push(chunk));
    process.stdin.on('end', () =>
      resolve(Buffer.concat(chunks).toString('utf-8'))
    );
    process.stdin.on('error', reject);
  });
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (args.version) {
    printVersion();
    process.exit(0);
  }

  const options: FormatOptions = {
    indentSize: args.indent,
    useTabs: args.tabs,
  };

  let input: string;

  if (args.file) {
    try {
      input = readFileSync(args.file, 'utf-8');
    } catch (_err) {
      console.error(`Error reading file: ${args.file}`);
      process.exit(1);
    }
  } else {
    // Check if stdin is a TTY (no piped input)
    if (process.stdin.isTTY) {
      printHelp();
      process.exit(0);
    }
    input = await readStdin();
  }

  try {
    const formatted = formatMermaid(input, options);

    if (args.write && args.file) {
      writeFileSync(args.file, formatted, 'utf-8');
    } else {
      process.stdout.write(formatted);
    }
  } catch (err) {
    console.error(
      `Error formatting: ${err instanceof Error ? err.message : err}`
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
