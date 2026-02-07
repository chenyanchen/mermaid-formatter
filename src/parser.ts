/**
 * Lightweight parser for Mermaid diagram syntax.
 * Converts source code into an AST for formatting.
 */

import type { Diagram, DiagramType, Statement } from './types.js';
import {
  matchDiagramType,
  matchBlockKeyword,
  matchBraceBlockStart,
  matchArrowMessage,
} from './rules.js';

/**
 * Parse Mermaid diagram source into AST.
 */
export function parse(input: string): Diagram {
  const lines = input.split('\n');
  const statements: Statement[] = [];
  let diagramType: DiagramType = 'unknown';

  for (const line of lines) {
    const trimmed = line.trim();
    const statement = parseLine(trimmed, diagramType);

    if (statement) {
      // Track diagram type from first declaration
      if (statement.type === 'diagram-decl' && diagramType === 'unknown') {
        diagramType = statement.diagramType;
      }
      statements.push(statement);
    }
  }

  return { type: diagramType, statements };
}

/**
 * Parse a single line into a statement.
 */
function parseLine(
  trimmed: string,
  currentDiagramType: DiagramType
): Statement {
  // Blank line
  if (trimmed === '') {
    return { type: 'blank-line', content: '' };
  }

  // Comment (but not directive)
  if (trimmed.startsWith('%%') && !trimmed.startsWith('%%{')) {
    return { type: 'comment', content: trimmed };
  }

  // Directive %%{ ... }%%
  if (trimmed.startsWith('%%{')) {
    return { type: 'directive', content: trimmed };
  }

  // Diagram declaration
  const detectedType = matchDiagramType(trimmed);
  if (detectedType && currentDiagramType === 'unknown') {
    return {
      type: 'diagram-decl',
      diagramType: detectedType,
      content: trimmed,
    };
  }

  // Block end: 'end'
  if (trimmed === 'end') {
    return { type: 'block-end', content: 'end' };
  }

  // Brace block end: '}'
  if (trimmed === '}') {
    return { type: 'brace-block-end', content: '}' };
  }

  // Block option (sequence diagram)
  if (/^option\b/.test(trimmed)) {
    const label = trimmed.slice(6).trim() || undefined;
    return { type: 'block-option', label, content: trimmed };
  }

  // Block else (sequence diagram)
  if (/^else\b/.test(trimmed)) {
    const label = trimmed.slice(4).trim() || undefined;
    return { type: 'block-else', label, content: trimmed };
  }

  // Block start with 'end' keyword
  const blockKind = matchBlockKeyword(trimmed);
  if (blockKind) {
    const label = trimmed.slice(blockKind.length).trim() || undefined;
    return {
      type: 'block-start',
      blockKind,
      label,
      content: trimmed,
    };
  }

  // Brace block start (state/class/namespace with {)
  const braceBlock = matchBraceBlockStart(trimmed);
  if (braceBlock) {
    return {
      type: 'brace-block-start',
      blockKind: braceBlock.kind,
      name: braceBlock.name,
      content: trimmed,
    };
  }

  // Participant declaration (sequence diagram)
  if (/^participant\b/.test(trimmed) || /^actor\b/.test(trimmed)) {
    return { type: 'participant', content: trimmed };
  }

  // Note
  if (/^note\b/i.test(trimmed)) {
    return { type: 'note', content: trimmed };
  }

  // Arrow message (sequence diagrams only, e.g., "A->>B: Hello")
  if (currentDiagramType === 'sequenceDiagram') {
    const arrowMatch = matchArrowMessage(trimmed);
    if (arrowMatch) {
      return {
        type: 'arrow-message',
        from: arrowMatch.from,
        arrow: arrowMatch.arrow,
        to: arrowMatch.to,
        message: arrowMatch.message,
        content: trimmed,
      };
    }
  }

  // Generic line (relationships, nodes, etc.)
  return { type: 'generic-line', content: trimmed };
}

/**
 * Detect diagram type from source code.
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
