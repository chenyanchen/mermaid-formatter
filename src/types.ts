/**
 * Type definitions for Mermaid formatter AST and options.
 */

/**
 * Formatting configuration options.
 */
export interface FormatOptions {
  /** Number of spaces for indentation (default: 4) */
  indentSize?: number;
  /** Use tabs instead of spaces (default: false) */
  useTabs?: boolean;
}

/**
 * Supported Mermaid diagram types.
 */
export type DiagramType =
  | 'sequenceDiagram'
  | 'flowchart'
  | 'graph'
  | 'classDiagram'
  | 'stateDiagram'
  | 'stateDiagram-v2'
  | 'erDiagram'
  | 'journey'
  | 'gantt'
  | 'pie'
  | 'quadrantChart'
  | 'requirementDiagram'
  | 'gitGraph'
  | 'mindmap'
  | 'timeline'
  | 'sankey-beta'
  | 'xychart-beta'
  | 'block-beta'
  | 'architecture-beta'
  | 'unknown';

/**
 * Block types that close with 'end' keyword.
 */
export type BlockKind =
  | 'critical'
  | 'alt'
  | 'loop'
  | 'par'
  | 'opt'
  | 'break'
  | 'rect'
  | 'subgraph';

/**
 * Block types that close with '}'.
 */
export type BraceBlockKind = 'state' | 'class' | 'namespace';

// ============================================================================
// AST Node Types - More semantic than raw strings
// ============================================================================

/** Base interface for all statement nodes */
interface StatementBase {
  type: string;
}

/** Diagram type declaration (e.g., "sequenceDiagram", "flowchart TD") */
export interface DiagramDeclStatement extends StatementBase {
  type: 'diagram-decl';
  diagramType: DiagramType;
  content: string;
}

/** Directive (e.g., "%%{init: {...}}%%") */
export interface DirectiveStatement extends StatementBase {
  type: 'directive';
  content: string;
}

/** Participant declaration (sequence diagram) */
export interface ParticipantStatement extends StatementBase {
  type: 'participant';
  content: string;
}

/** Block start with 'end' keyword (critical, alt, loop, etc.) */
export interface BlockStartStatement extends StatementBase {
  type: 'block-start';
  blockKind: BlockKind;
  label?: string;
  content: string;
}

/** Brace block start (state {, class {, namespace {) */
export interface BraceBlockStartStatement extends StatementBase {
  type: 'brace-block-start';
  blockKind: BraceBlockKind;
  name: string;
  content: string;
}

/** Block option (sequence diagram) */
export interface BlockOptionStatement extends StatementBase {
  type: 'block-option';
  label?: string;
  content: string;
}

/** Block else (sequence diagram) */
export interface BlockElseStatement extends StatementBase {
  type: 'block-else';
  label?: string;
  content: string;
}

/** Block and (e.g., "and Branch" in par blocks) */
export interface BlockAndStatement extends StatementBase {
  type: 'block-and';
  label?: string;
  content: string;
}

/** Block end ('end' keyword) */
export interface BlockEndStatement extends StatementBase {
  type: 'block-end';
  content: string;
}

/** Brace block end ('}') */
export interface BraceBlockEndStatement extends StatementBase {
  type: 'brace-block-end';
  content: string;
}

/** Note statement */
export interface NoteStatement extends StatementBase {
  type: 'note';
  content: string;
}

/** Comment (e.g., "%% comment") */
export interface CommentStatement extends StatementBase {
  type: 'comment';
  content: string;
}

/** Arrow message (e.g., "A->>B: Hello") */
export interface ArrowMessageStatement extends StatementBase {
  type: 'arrow-message';
  from: string;
  arrow: string;
  to: string;
  message: string;
  content: string;
}

/** Generic line (arrows, relationships, nodes, etc.) */
export interface GenericLineStatement extends StatementBase {
  type: 'generic-line';
  content: string;
}

/** Blank line */
export interface BlankLineStatement extends StatementBase {
  type: 'blank-line';
  content: '';
}

/**
 * Union of all statement types.
 */
export type Statement =
  | DiagramDeclStatement
  | DirectiveStatement
  | ParticipantStatement
  | ArrowMessageStatement
  | BlockStartStatement
  | BraceBlockStartStatement
  | BlockOptionStatement
  | BlockElseStatement
  | BlockAndStatement
  | BlockEndStatement
  | BraceBlockEndStatement
  | NoteStatement
  | CommentStatement
  | GenericLineStatement
  | BlankLineStatement;

/**
 * Statement type discriminator.
 */
export type StatementType = Statement['type'];

/**
 * Parsed diagram AST.
 */
export interface Diagram {
  type: DiagramType;
  statements: Statement[];
}

// Re-export from rules for backwards compatibility
export { INDENT_SENSITIVE_DIAGRAMS } from './rules.js';
