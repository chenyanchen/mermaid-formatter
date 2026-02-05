/**
 * Mermaid Formatter - Public API
 *
 * Format Mermaid diagram syntax for consistent code style.
 */

// Type exports
export type {
  FormatOptions,
  DiagramType,
  Statement,
  Diagram,
  StatementType,
  BlockKind,
  BraceBlockKind,
} from './types.js';

// Function exports
export { parse, detectDiagramType } from './parser.js';
export { format } from './formatter.js';
export { isIndentSensitive, INDENT_SENSITIVE_DIAGRAMS } from './rules.js';

// Internal imports
import { parse, detectDiagramType } from './parser.js';
import { format } from './formatter.js';
import { isIndentSensitive } from './rules.js';
import type { FormatOptions } from './types.js';

// ============================================================================
// Main API
// ============================================================================

/**
 * Format Mermaid diagram source code.
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
  // Pipeline: detect -> check policy -> parse -> format
  const diagramType = detectDiagramType(input);

  // Policy: skip formatting for indent-sensitive diagrams
  if (isIndentSensitive(diagramType)) {
    return ensureTrailingNewline(input);
  }

  const diagram = parse(input);
  return format(diagram, options);
}

/**
 * Format Mermaid code blocks in Markdown.
 *
 * Preserves indentation for nested code blocks (in lists, blockquotes, etc.)
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
  // Pattern captures:
  // 1. Leading indentation (spaces/tabs before ```)
  // 2. Code content between fences
  // Supports both LF and CRLF line endings
  return markdown.replace(
    /^([ \t]*)```mermaid\r?\n([\s\S]*?)```/gm,
    (_, indent: string, code: string) => {
      const formatted = formatMermaid(code, options);
      const indentedCode = applyIndent(formatted, indent);
      return `${indent}\`\`\`mermaid\n${indentedCode}${indent}\`\`\``;
    }
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Ensure string ends with exactly one newline.
 */
function ensureTrailingNewline(input: string): string {
  return input.endsWith('\n') ? input : input + '\n';
}

/**
 * Apply indentation to each non-empty line.
 */
function applyIndent(content: string, indent: string): string {
  if (!indent) return content;
  return content
    .split('\n')
    .map((line) => (line ? indent + line : line))
    .join('\n');
}
