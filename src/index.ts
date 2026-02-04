export type {
  FormatOptions,
  DiagramType,
  Statement,
  Diagram,
  StatementType,
  BlockKind,
  BraceBlockKind,
} from './types.js';

export { parse, detectDiagramType } from './parser.js';
export { format } from './formatter.js';

import { parse } from './parser.js';
import { format } from './formatter.js';
import type { FormatOptions } from './types.js';

/**
 * Format Mermaid diagram source code
 *
 * @param input - Mermaid diagram source code
 * @param options - Formatting options
 * @returns Formatted Mermaid code
 *
 * @example
 * ```ts
 * import { formatMermaid } from 'mermaid-formatter';
 *
 * const formatted = formatMermaid(`
 * sequenceDiagram
 *     participant A
 *         A->>B: Hello
 * `);
 * ```
 */
export function formatMermaid(input: string, options?: FormatOptions): string {
  const diagram = parse(input);
  return format(diagram, options);
}

/**
 * Format Mermaid code blocks in Markdown
 *
 * @param markdown - Markdown content
 * @param options - Formatting options
 * @returns Markdown with formatted Mermaid blocks
 *
 * @example
 * ```ts
 * import { formatMarkdownMermaidBlocks } from 'mermaid-formatter';
 *
 * const formatted = formatMarkdownMermaidBlocks(`
 * # My Document
 *
 * \`\`\`mermaid
 * sequenceDiagram
 *     A->>B: Hello
 * \`\`\`
 * `);
 * ```
 */
export function formatMarkdownMermaidBlocks(
  markdown: string,
  options?: FormatOptions
): string {
  // Support both LF and CRLF line endings
  return markdown.replace(
    /```mermaid\r?\n([\s\S]*?)```/g,
    (_, code: string) => '```mermaid\n' + formatMermaid(code, options) + '```'
  );
}
