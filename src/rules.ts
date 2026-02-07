/**
 * Centralized grammar rules and patterns for Mermaid diagrams.
 * All syntax definitions in one place for easy maintenance.
 */

import type { DiagramType, BlockKind, BraceBlockKind } from './types.js';

/**
 * Patterns for detecting diagram types.
 * Order matters: more specific patterns should come first.
 */
export const DIAGRAM_PATTERNS: [RegExp, DiagramType][] = [
  [/^sequenceDiagram\b/, 'sequenceDiagram'],
  [/^flowchart(\s+(TD|TB|BT|LR|RL))?\b/, 'flowchart'],
  [/^graph(\s+(TD|TB|BT|LR|RL))?\b/, 'graph'],
  [/^classDiagram\b/, 'classDiagram'],
  [/^stateDiagram-v2\b/, 'stateDiagram-v2'],
  [/^stateDiagram\b/, 'stateDiagram'],
  [/^erDiagram\b/, 'erDiagram'],
  [/^journey\b/, 'journey'],
  [/^gantt\b/, 'gantt'],
  [/^pie(\s+showData)?\b/, 'pie'],
  [/^quadrantChart\b/, 'quadrantChart'],
  [/^requirementDiagram\b/, 'requirementDiagram'],
  [/^gitGraph\b/, 'gitGraph'],
  [/^mindmap\b/, 'mindmap'],
  [/^timeline\b/, 'timeline'],
  [/^sankey-beta\b/, 'sankey-beta'],
  [/^xychart-beta\b/, 'xychart-beta'],
  [/^block-beta\b/, 'block-beta'],
  [/^architecture-beta\b/, 'architecture-beta'],
];

/**
 * Block keywords that close with 'end' keyword.
 * Used in sequence diagrams, flowcharts, etc.
 */
export const BLOCK_KEYWORDS: BlockKind[] = [
  'critical',
  'alt',
  'loop',
  'par',
  'opt',
  'break',
  'rect',
  'subgraph',
];

/**
 * Block keywords that close with '}'.
 * Used in class diagrams, state diagrams, etc.
 */
export const BRACE_BLOCK_KEYWORDS: BraceBlockKind[] = [
  'state',
  'class',
  'namespace',
];

/**
 * Diagram types where indentation represents hierarchy.
 * These should NOT be reformatted as it would change semantics.
 */
export const INDENT_SENSITIVE_DIAGRAMS: DiagramType[] = ['mindmap', 'timeline'];

/**
 * Check if a diagram type is indent-sensitive.
 */
export function isIndentSensitive(diagramType: DiagramType): boolean {
  return INDENT_SENSITIVE_DIAGRAMS.includes(diagramType);
}

/**
 * Match diagram type from a line of text.
 */
export function matchDiagramType(line: string): DiagramType | null {
  for (const [pattern, type] of DIAGRAM_PATTERNS) {
    if (pattern.test(line)) {
      return type;
    }
  }
  return null;
}

/**
 * Match block start keyword (critical, alt, loop, etc.)
 */
export function matchBlockKeyword(line: string): BlockKind | null {
  for (const keyword of BLOCK_KEYWORDS) {
    const pattern = new RegExp(`^${keyword}\\b`);
    if (pattern.test(line)) {
      return keyword;
    }
  }
  return null;
}

/**
 * Supported arrow operators for arrow-message parsing.
 * Supports: ->>, -->>, ->, -->, -x, --x, -), --), <<->>, <<-->>
 * With optional +/- suffix for activation/deactivation.
 */
const ARROW_PATTERN =
  /^(.+?)\s*((?:<<-->>|<<->>|-->>|->>|-->|->|--x|-x|--\)|-\))[+-]?)\s*(.+?)\s*:\s*(.*)?$/;

/**
 * Match arrow message (e.g., "A->>B: Hello", "client ->> agent: initialize")
 */
export function matchArrowMessage(
  line: string
): { from: string; arrow: string; to: string; message: string } | null {
  const match = line.match(ARROW_PATTERN);
  if (!match) return null;
  // Keep flowchart class assignment syntax untouched, e.g. A --> B:::warning
  if ((match[4] ?? '').startsWith('::')) return null;
  return {
    from: match[1].trim(),
    arrow: match[2],
    to: match[3].trim(),
    message: (match[4] ?? '').trim(),
  };
}

/**
 * Match brace block start (state Name {, class Name {, namespace Name {)
 */
export function matchBraceBlockStart(
  line: string
): { kind: BraceBlockKind; name: string } | null {
  for (const keyword of BRACE_BLOCK_KEYWORDS) {
    const pattern = new RegExp(`^${keyword}\\s+(.+?)\\s*\\{\\s*$`);
    const match = line.match(pattern);
    if (match) {
      return { kind: keyword, name: match[1].trim() };
    }
  }
  return null;
}
