/**
 * Formatting configuration options
 */
export interface FormatOptions {
  /** Number of spaces for indentation (default: 4) */
  indentSize?: number;
  /** Use tabs instead of spaces (default: false) */
  useTabs?: boolean;
}

/**
 * Supported Mermaid diagram types
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
 * Statement types in the AST
 */
export type StatementType =
  | 'diagram-decl'
  | 'directive'
  | 'participant'
  | 'block-start'      // critical, alt, loop, par, opt, break, rect, subgraph
  | 'brace-block-start' // state {, class {, namespace {
  | 'block-option'     // option
  | 'block-else'       // else
  | 'block-end'        // end
  | 'brace-block-end'  // }
  | 'note'
  | 'comment'
  | 'generic-line'
  | 'blank-line';

/**
 * Block types that close with 'end' keyword
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
 * Block types that close with '}'
 */
export type BraceBlockKind = 'state' | 'class' | 'namespace';

/**
 * AST Statement node
 */
export interface Statement {
  type: StatementType;
  content: string;
  blockKind?: BlockKind | BraceBlockKind;
  label?: string;
}

/**
 * Parsed diagram AST
 */
export interface Diagram {
  type: DiagramType;
  statements: Statement[];
}
