import { describe, expect, it } from 'vitest';
import { format as prettierFormat } from 'prettier';
import { readFileSync } from 'node:fs';
import mermaidPlugin from '../src/prettier-plugin.js';

describe('prettier plugin', () => {
  it('declares package subpath export for prettier plugin', () => {
    const pkg = JSON.parse(
      readFileSync(new URL('../package.json', import.meta.url), 'utf-8')
    ) as {
      exports?: Record<string, { import?: string }>;
    };

    expect(pkg.exports?.['./prettier-plugin']?.import).toBe(
      './dist/prettier-plugin.js'
    );
  });

  it('formats .mmd files through parser inference', async () => {
    const input = `sequenceDiagram
A->>B:hello
`;
    const output = await prettierFormat(input, {
      filepath: 'diagram.mmd',
      plugins: [mermaidPlugin],
      tabWidth: 2,
    });

    expect(output).toBe(`sequenceDiagram
  A ->> B: hello
`);
  });

  it('respects useTabs option', async () => {
    const input = `sequenceDiagram
participant A
`;
    const output = await prettierFormat(input, {
      filepath: 'diagram.mmd',
      plugins: [mermaidPlugin],
      useTabs: true,
    });

    expect(output).toBe(`sequenceDiagram
\tparticipant A
`);
  });

  it('formats mermaid fenced blocks in markdown', async () => {
    const input = `# Demo

\`\`\`mermaid
sequenceDiagram
A->>B:hello
\`\`\`
`;
    const output = await prettierFormat(input, {
      parser: 'markdown',
      plugins: [mermaidPlugin],
    });

    expect(output).toContain('A ->> B: hello');
    expect(output).toContain('```mermaid');
  });
});
