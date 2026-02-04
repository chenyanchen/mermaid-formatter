import type { Diagram, Statement, FormatOptions } from './types.js';

const DEFAULT_OPTIONS: Required<FormatOptions> = {
  indentSize: 4,
  useTabs: false,
};

/**
 * Format a parsed diagram AST back to string
 */
export function format(diagram: Diagram, options: FormatOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const indentStr = opts.useTabs ? '\t' : ' '.repeat(opts.indentSize);

  const lines: string[] = [];
  let braceBlockDepth = 0;
  let seenDiagramDecl = false;
  let lastNonBlankType: Statement['type'] | null = null;

  for (let i = 0; i < diagram.statements.length; i++) {
    const stmt = diagram.statements[i];

    // Handle blank lines: collapse consecutive blanks, skip trailing
    if (stmt.type === 'blank-line') {
      // Skip if last was also blank or if at the end
      if (
        lastNonBlankType === 'blank-line' ||
        i === diagram.statements.length - 1
      ) {
        continue;
      }
      // Skip blank at the very beginning
      if (lines.length === 0) {
        continue;
      }
      lines.push('');
      lastNonBlankType = 'blank-line';
      continue;
    }

    // Insert blank line before block-start if needed
    if (shouldInsertBlankBefore(stmt, lastNonBlankType)) {
      // Only if last line isn't already blank
      if (lines.length > 0 && lines[lines.length - 1] !== '') {
        lines.push('');
      }
    }

    // Decrement brace depth before formatting brace-block-end
    if (stmt.type === 'brace-block-end' && braceBlockDepth > 0) {
      braceBlockDepth--;
    }

    // Calculate indentation depth
    const depth = getIndentDepth(stmt, seenDiagramDecl, braceBlockDepth);

    // Format the statement
    const content = formatStatement(stmt);
    const formatted = depth > 0 ? indentStr.repeat(depth) + content : content;
    lines.push(formatted);

    // Update state
    if (stmt.type === 'diagram-decl') {
      seenDiagramDecl = true;
    }
    if (stmt.type === 'brace-block-start') {
      braceBlockDepth++;
    }
    lastNonBlankType = stmt.type;
  }

  // Ensure single trailing newline
  return lines.join('\n') + '\n';
}

/**
 * Calculate indentation depth for a statement
 */
function getIndentDepth(
  stmt: Statement,
  seenDiagramDecl: boolean,
  braceBlockDepth: number
): number {
  // Diagram declaration and directives: always at column 0
  if (stmt.type === 'diagram-decl' || stmt.type === 'directive') {
    return 0;
  }

  // Block control statements: at column 0 (relative to brace depth)
  if (
    stmt.type === 'block-start' ||
    stmt.type === 'block-option' ||
    stmt.type === 'block-else' ||
    stmt.type === 'block-end'
  ) {
    return braceBlockDepth;
  }

  // Brace block start/end: at brace depth level
  if (stmt.type === 'brace-block-start' || stmt.type === 'brace-block-end') {
    return braceBlockDepth;
  }

  // Inside brace blocks: use brace depth directly
  if (braceBlockDepth > 0) {
    return braceBlockDepth;
  }

  // At top level (after diagram decl): indent by 1
  if (seenDiagramDecl) {
    return 1;
  }

  return 0;
}

/**
 * Determine if a blank line should be inserted before this statement
 */
function shouldInsertBlankBefore(
  stmt: Statement,
  lastNonBlankType: Statement['type'] | null
): boolean {
  if (!lastNonBlankType) return false;

  // Insert blank before block-start or brace-block-start
  if (stmt.type === 'block-start' || stmt.type === 'brace-block-start') {
    // Insert blank if previous was content or diagram declaration
    return (
      lastNonBlankType === 'diagram-decl' ||
      lastNonBlankType === 'generic-line' ||
      lastNonBlankType === 'participant' ||
      lastNonBlankType === 'note' ||
      lastNonBlankType === 'block-end' ||
      lastNonBlankType === 'brace-block-end'
    );
  }

  return false;
}

/**
 * Format a single statement's content
 */
function formatStatement(stmt: Statement): string {
  switch (stmt.type) {
    case 'block-start':
      return formatBlockStart(stmt);
    case 'brace-block-start':
      return formatBraceBlockStart(stmt);
    case 'block-option':
      return stmt.label ? `option ${stmt.label}` : 'option';
    case 'block-else':
      return stmt.label ? `else ${stmt.label}` : 'else';
    case 'generic-line':
    case 'participant':
    case 'note':
      return normalizeContent(stmt.content);
    default:
      return stmt.content;
  }
}

/**
 * Format block start statement
 */
function formatBlockStart(stmt: Statement): string {
  if (stmt.blockKind && stmt.label) {
    return `${stmt.blockKind} ${stmt.label}`;
  }
  return stmt.blockKind || stmt.content;
}

/**
 * Format brace block start statement
 */
function formatBraceBlockStart(stmt: Statement): string {
  if (stmt.blockKind && stmt.label) {
    return `${stmt.blockKind} ${stmt.label} {`;
  }
  return stmt.content;
}

/**
 * Normalize content for consistent formatting
 */
function normalizeContent(content: string): string {
  let result = content;

  // Collapse multiple spaces to single space
  result = result.replace(/  +/g, ' ');

  // Normalize spaces after colon (A:  B -> A: B)
  result = result.replace(/:\s{2,}/g, ': ');

  // Normalize bracket padding: [ text ] -> [text]
  result = normalizeBracketPair(result, '[', ']');

  // Normalize brace padding: { text } -> {text}
  result = normalizeBracketPair(result, '{', '}');

  // Normalize paren padding: ( text ) -> (text)
  result = normalizeBracketPair(result, '(', ')');

  // Normalize pipe labels: | text | -> |text|
  result = normalizePipeLabels(result);

  return result;
}

/**
 * Normalize padding inside bracket pairs
 * Only normalizes when there's space after opening bracket
 */
function normalizeBracketPair(
  content: string,
  open: char,
  close: char
): string {
  const chars = [...content];
  const result: string[] = [];
  let i = 0;

  while (i < chars.length) {
    if (chars[i] === open && chars[i + 1] === ' ') {
      // Find matching close bracket
      let depth = 1;
      let j = i + 1;
      while (j < chars.length && depth > 0) {
        if (chars[j] === open) depth++;
        else if (chars[j] === close) depth--;
        j++;
      }

      if (depth === 0) {
        // Extract inner content (excluding brackets)
        const inner = chars
          .slice(i + 1, j - 1)
          .join('')
          .trim();
        result.push(open, inner, close);
        i = j;
        continue;
      }
    }
    result.push(chars[i]);
    i++;
  }

  return result.join('');
}

type char = string;

/**
 * Normalize pipe labels: |text| format
 */
function normalizePipeLabels(content: string): string {
  // Match | text | pattern (with space after opening pipe)
  return content.replace(
    /\|\s+([^|]*?)\s*\|/g,
    (_, inner) => `|${inner.trim()}|`
  );
}
