/**
 * Formatter for Mermaid diagram AST.
 * Converts AST back to formatted source code.
 */

import type {
  Diagram,
  Statement,
  StatementType,
  FormatOptions,
  ArrowMessageStatement,
  BlockStartStatement,
  BraceBlockStartStatement,
} from './types.js';

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_OPTIONS: Required<FormatOptions> = {
  indentSize: 4,
  useTabs: false,
};

// ============================================================================
// Statement Formatters - Strategy pattern
// ============================================================================

type StatementFormatter = (stmt: Statement) => string;

const STATEMENT_FORMATTERS: Partial<Record<StatementType, StatementFormatter>> =
  {
    'block-start': (stmt) => {
      const s = stmt as BlockStartStatement;
      return s.label ? `${s.blockKind} ${s.label}` : s.blockKind;
    },
    'brace-block-start': (stmt) => {
      const s = stmt as BraceBlockStartStatement;
      return `${s.blockKind} ${s.name} {`;
    },
    'block-option': (stmt) => {
      const label = (stmt as { label?: string }).label;
      return label ? `option ${label}` : 'option';
    },
    'block-else': (stmt) => {
      const label = (stmt as { label?: string }).label;
      return label ? `else ${label}` : 'else';
    },
    'arrow-message': (stmt) => {
      const s = stmt as ArrowMessageStatement;
      const base = `${s.from} ${s.arrow} ${s.to}`;
      if (!s.message) return `${base}:`;
      // Normalize multiple spaces in message
      const message = s.message.replace(/  +/g, ' ');
      return `${base}: ${message}`;
    },
  };

// Statements that need content normalization
const NORMALIZABLE_TYPES: StatementType[] = [
  'generic-line',
  'participant',
  'note',
];

// ============================================================================
// Content Normalizers - Pipeline pattern
// ============================================================================

type ContentNormalizer = (content: string) => string;

const CONTENT_NORMALIZERS: ContentNormalizer[] = [
  // Collapse multiple spaces to single space
  (content) => content.replace(/  +/g, ' '),
  // Normalize bracket padding: [ text ] -> [text]
  (content) => normalizeBracketPair(content, '[', ']'),
  // Normalize brace padding: { text } -> {text}
  (content) => normalizeBracketPair(content, '{', '}'),
  // Normalize paren padding: ( text ) -> (text)
  (content) => normalizeBracketPair(content, '(', ')'),
  // Normalize pipe labels: | text | -> |text|
  (content) =>
    content.replace(/\|\s+([^|]*?)\s*\|/g, (_, inner) => `|${inner.trim()}|`),
];

function normalizeContent(content: string): string {
  return CONTENT_NORMALIZERS.reduce((acc, fn) => fn(acc), content);
}

// ============================================================================
// Indentation Rules
// ============================================================================

/** Statements that always appear at column 0 (relative to brace depth) */
const COLUMN_ZERO_TYPES: StatementType[] = [
  'diagram-decl',
  'directive',
  'block-start',
  'block-option',
  'block-else',
  'block-end',
];

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
  if (COLUMN_ZERO_TYPES.includes(stmt.type)) {
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

// ============================================================================
// Blank Line Rules
// ============================================================================

/** Types that trigger blank line insertion before block starts */
const BLANK_BEFORE_BLOCK_TYPES: StatementType[] = [
  'diagram-decl',
  'generic-line',
  'arrow-message',
  'participant',
  'note',
  'block-end',
  'brace-block-end',
];

function shouldInsertBlankBefore(
  stmt: Statement,
  lastNonBlankType: StatementType | null
): boolean {
  if (!lastNonBlankType) return false;

  // Insert blank before block-start or brace-block-start
  if (stmt.type === 'block-start' || stmt.type === 'brace-block-start') {
    return BLANK_BEFORE_BLOCK_TYPES.includes(lastNonBlankType);
  }

  return false;
}

// ============================================================================
// Main Format Function
// ============================================================================

/**
 * Format a parsed diagram AST back to string.
 */
export function format(diagram: Diagram, options: FormatOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const indentStr = opts.useTabs ? '\t' : ' '.repeat(opts.indentSize);

  const lines: string[] = [];
  let braceBlockDepth = 0;
  let seenDiagramDecl = false;
  let lastNonBlankType: StatementType | null = null;

  for (let i = 0; i < diagram.statements.length; i++) {
    const stmt = diagram.statements[i];

    // Handle blank lines: collapse consecutive blanks, skip trailing
    if (stmt.type === 'blank-line') {
      if (
        lastNonBlankType === 'blank-line' ||
        i === diagram.statements.length - 1
      ) {
        continue;
      }
      if (lines.length === 0) {
        continue;
      }
      lines.push('');
      lastNonBlankType = 'blank-line';
      continue;
    }

    // Insert blank line before block-start if needed
    if (shouldInsertBlankBefore(stmt, lastNonBlankType)) {
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
 * Format a single statement's content.
 */
function formatStatement(stmt: Statement): string {
  // Use custom formatter if available
  const formatter = STATEMENT_FORMATTERS[stmt.type];
  if (formatter) {
    return formatter(stmt);
  }

  // Normalize content for specific types
  if (NORMALIZABLE_TYPES.includes(stmt.type)) {
    return normalizeContent(stmt.content);
  }

  // Default: return content as-is
  return stmt.content;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Normalize padding inside bracket pairs.
 * Only normalizes when there's space after opening bracket.
 */
function normalizeBracketPair(
  content: string,
  open: string,
  close: string
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
