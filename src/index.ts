export type {
  FormatOptions,
  DiagramType,
  Statement,
  Diagram,
  StatementType,
  BlockKind,
  BraceBlockKind,
} from './types.js';

export { INDENT_SENSITIVE_DIAGRAMS } from './types.js';
export { parse, detectDiagramType } from './parser.js';
export { format } from './formatter.js';

import { parse, detectDiagramType } from './parser.js';
import { format } from './formatter.js';
import { INDENT_SENSITIVE_DIAGRAMS } from './types.js';
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
  // Check if this is an indent-sensitive diagram type
  const diagramType = detectDiagramType(input);
  if (INDENT_SENSITIVE_DIAGRAMS.includes(diagramType)) {
    // For indent-sensitive diagrams, preserve original formatting
    // Only ensure trailing newline
    return input.endsWith('\n') ? input : input + '\n';
  }

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
  // Capture leading indentation to preserve it for nested code blocks
  return markdown.replace(
    /^([ \t]*)```mermaid\r?\n([\s\S]*?)```/gm,
    (_, indent: string, code: string) => {
      const formatted = formatMermaid(code, options);
      // Add indentation to each line of the formatted code
      const indentedCode = indent
        ? formatted
            .split('\n')
            .map((line) => (line ? indent + line : line))
            .join('\n')
        : formatted;
      return indent + '```mermaid\n' + indentedCode + indent + '```';
    }
  );
}
