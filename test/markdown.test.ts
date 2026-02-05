/**
 * Markdown integration tests
 */

import { describe, it, expect } from 'vitest';
import { formatMarkdownMermaidBlocks } from '../src/index.js';

describe('formatMarkdownMermaidBlocks', () => {
  it('formats mermaid code blocks in markdown', () => {
    const input = `# Title

\`\`\`mermaid
sequenceDiagram
      A->>B: hello
\`\`\`

Some text.
`;
    const expected = `# Title

\`\`\`mermaid
sequenceDiagram
    A->>B: hello
\`\`\`

Some text.
`;
    expect(formatMarkdownMermaidBlocks(input)).toBe(expected);
  });

  it('formats multiple mermaid blocks', () => {
    const input = `\`\`\`mermaid
sequenceDiagram
  A->>B: hello
\`\`\`

\`\`\`mermaid
flowchart TD
  A --> B
\`\`\``;
    const result = formatMarkdownMermaidBlocks(input);

    expect(result).toContain('    A->>B: hello');
    expect(result).toContain('    A --> B');
  });

  it('handles CRLF line endings', () => {
    const input = '```mermaid\r\nsequenceDiagram\r\n  A->>B: hello\r\n```';
    const result = formatMarkdownMermaidBlocks(input);

    expect(result).toContain('    A->>B: hello');
    // Output should use LF
    expect(result).not.toContain('\r\n');
  });

  describe('nested code blocks', () => {
    it('preserves indentation for code blocks in lists', () => {
      const input = `- item
  \`\`\`mermaid
  sequenceDiagram
    A->>B: hello
  \`\`\`
- next item`;
      const result = formatMarkdownMermaidBlocks(input);

      // Both fences should be indented
      expect(result).toContain('  ```mermaid');
      expect(result).toContain('  ```\n- next item');
      // Content should also be indented
      expect(result).toContain('  sequenceDiagram');
      expect(result).toContain('      A->>B: hello');
    });

    it('preserves indentation for deeply nested code blocks', () => {
      const input = `> quote
>     \`\`\`mermaid
>     flowchart TD
>       A --> B
>     \`\`\``;
      const result = formatMarkdownMermaidBlocks(input);

      // Fence indentation should be preserved
      expect(result).toContain('>     ```mermaid');
      expect(result).toContain('>     ```');
    });
  });
});
