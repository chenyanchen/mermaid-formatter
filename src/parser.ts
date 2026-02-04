import type {
  Diagram,
  DiagramType,
  Statement,
  BlockKind,
  BraceBlockKind,
} from './types.js';

// Diagram type patterns
const DIAGRAM_PATTERNS: [RegExp, DiagramType][] = [
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

// Block keywords that close with 'end'
const BLOCK_KEYWORDS: BlockKind[] = [
  'critical',
  'alt',
  'loop',
  'par',
  'opt',
  'break',
  'rect',
  'subgraph',
];

// Block keywords that close with '}'
const BRACE_BLOCK_KEYWORDS: BraceBlockKind[] = ['state', 'class', 'namespace'];

/**
 * Parse Mermaid diagram source into AST
 */
export function parse(input: string): Diagram {
  const lines = input.split('\n');
  const statements: Statement[] = [];
  let diagramType: DiagramType = 'unknown';

  for (const line of lines) {
    const trimmed = line.trim();

    // Blank line
    if (trimmed === '') {
      statements.push({ type: 'blank-line', content: '' });
      continue;
    }

    // Comment
    if (trimmed.startsWith('%%') && !trimmed.startsWith('%%{')) {
      statements.push({ type: 'comment', content: trimmed });
      continue;
    }

    // Directive %%{ ... }%%
    if (trimmed.startsWith('%%{')) {
      statements.push({ type: 'directive', content: trimmed });
      continue;
    }

    // Diagram declaration
    const diagramMatch = matchDiagramType(trimmed);
    if (diagramMatch && diagramType === 'unknown') {
      diagramType = diagramMatch;
      statements.push({ type: 'diagram-decl', content: trimmed });
      continue;
    }

    // Block end: 'end'
    if (trimmed === 'end') {
      statements.push({ type: 'block-end', content: 'end' });
      continue;
    }

    // Brace block end: '}'
    if (trimmed === '}') {
      statements.push({ type: 'brace-block-end', content: '}' });
      continue;
    }

    // Block option (sequence diagram)
    if (/^option\b/.test(trimmed)) {
      const label = trimmed.slice(6).trim() || undefined;
      statements.push({ type: 'block-option', content: trimmed, label });
      continue;
    }

    // Block else (sequence diagram)
    if (/^else\b/.test(trimmed)) {
      const label = trimmed.slice(4).trim() || undefined;
      statements.push({ type: 'block-else', content: trimmed, label });
      continue;
    }

    // Block start with 'end' keyword
    const blockKind = matchBlockStart(trimmed);
    if (blockKind) {
      const keyword = blockKind;
      const label = trimmed.slice(keyword.length).trim() || undefined;
      statements.push({
        type: 'block-start',
        content: trimmed,
        blockKind,
        label,
      });
      continue;
    }

    // Brace block start (state/class/namespace with {)
    const braceBlock = matchBraceBlockStart(trimmed);
    if (braceBlock) {
      statements.push({
        type: 'brace-block-start',
        content: trimmed,
        blockKind: braceBlock.kind,
        label: braceBlock.name,
      });
      continue;
    }

    // Participant declaration (sequence diagram)
    if (/^participant\b/.test(trimmed) || /^actor\b/.test(trimmed)) {
      statements.push({ type: 'participant', content: trimmed });
      continue;
    }

    // Note
    if (/^note\b/i.test(trimmed)) {
      statements.push({ type: 'note', content: trimmed });
      continue;
    }

    // Generic line (arrows, relationships, nodes, etc.)
    statements.push({ type: 'generic-line', content: trimmed });
  }

  return { type: diagramType, statements };
}

/**
 * Match diagram type declaration
 */
function matchDiagramType(line: string): DiagramType | null {
  for (const [pattern, type] of DIAGRAM_PATTERNS) {
    if (pattern.test(line)) {
      return type;
    }
  }
  return null;
}

/**
 * Match block start keywords (critical, alt, loop, etc.)
 */
function matchBlockStart(line: string): BlockKind | null {
  for (const keyword of BLOCK_KEYWORDS) {
    // Must match word boundary to avoid 'participant' matching 'par'
    const pattern = new RegExp(`^${keyword}\\b`);
    if (pattern.test(line)) {
      return keyword;
    }
  }
  return null;
}

/**
 * Match brace block start (state Name {, class Name {, namespace Name {)
 * Supports names with spaces, quotes, etc. (e.g., class "HTTP Client" {)
 */
function matchBraceBlockStart(
  line: string
): { kind: BraceBlockKind; name: string } | null {
  for (const keyword of BRACE_BLOCK_KEYWORDS) {
    // Match: keyword <name> { where name is everything before the last {
    const pattern = new RegExp(`^${keyword}\\s+(.+?)\\s*\\{\\s*$`);
    const match = line.match(pattern);
    if (match) {
      return { kind: keyword, name: match[1].trim() };
    }
  }
  return null;
}

/**
 * Detect diagram type from source code
 */
export function detectDiagramType(input: string): DiagramType {
  const lines = input.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('%%')) continue;
    const type = matchDiagramType(trimmed);
    if (type) return type;
  }
  return 'unknown';
}
