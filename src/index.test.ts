import { describe, it, expect } from 'vitest';
import { formatMermaid, formatMarkdownMermaidBlocks, parse, detectDiagramType } from './index.js';

describe('detectDiagramType', () => {
  it('detects sequenceDiagram', () => {
    expect(detectDiagramType('sequenceDiagram\n  A->>B: hello')).toBe('sequenceDiagram');
  });

  it('detects flowchart with direction', () => {
    expect(detectDiagramType('flowchart TD\n  A --> B')).toBe('flowchart');
  });

  it('detects classDiagram', () => {
    expect(detectDiagramType('classDiagram\n  class Animal')).toBe('classDiagram');
  });

  it('skips comments when detecting', () => {
    expect(detectDiagramType('%% comment\nsequenceDiagram')).toBe('sequenceDiagram');
  });
});

describe('parse', () => {
  it('parses sequence diagram', () => {
    const input = `sequenceDiagram
    participant A
    A->>B: Hello`;
    const diagram = parse(input);

    expect(diagram.type).toBe('sequenceDiagram');
    expect(diagram.statements).toHaveLength(3);
    expect(diagram.statements[0].type).toBe('diagram-decl');
    expect(diagram.statements[1].type).toBe('participant');
    expect(diagram.statements[2].type).toBe('generic-line');
  });

  it('parses block structures', () => {
    const input = `sequenceDiagram
critical Section
    A->>B: hello
end`;
    const diagram = parse(input);

    expect(diagram.statements[1].type).toBe('block-start');
    expect(diagram.statements[1].blockKind).toBe('critical');
    expect(diagram.statements[1].label).toBe('Section');
    expect(diagram.statements[3].type).toBe('block-end');
  });

  it('parses brace blocks', () => {
    const input = `classDiagram
class Animal {
    +name: string
}`;
    const diagram = parse(input);

    expect(diagram.statements[1].type).toBe('brace-block-start');
    expect(diagram.statements[1].blockKind).toBe('class');
    expect(diagram.statements[1].label).toBe('Animal');
    expect(diagram.statements[3].type).toBe('brace-block-end');
  });
});

describe('formatMermaid', () => {
  it('formats sequence diagram with proper indentation', () => {
    const input = `sequenceDiagram
      participant A
        A->>B: Hello`;
    const expected = `sequenceDiagram
    participant A
    A->>B: Hello
`;
    expect(formatMermaid(input)).toBe(expected);
  });

  it('formats with custom indent size', () => {
    const input = `sequenceDiagram
participant A`;
    const expected = `sequenceDiagram
  participant A
`;
    expect(formatMermaid(input, { indentSize: 2 })).toBe(expected);
  });

  it('formats with tabs', () => {
    const input = `sequenceDiagram
participant A`;
    const expected = `sequenceDiagram
\tparticipant A
`;
    expect(formatMermaid(input, { useTabs: true })).toBe(expected);
  });

  it('formats block structures at column 0', () => {
    const input = `sequenceDiagram
    participant A

    critical Section
        A->>B: hello
    end`;
    const expected = `sequenceDiagram
    participant A

critical Section
    A->>B: hello
end
`;
    expect(formatMermaid(input)).toBe(expected);
  });

  it('normalizes multiple spaces', () => {
    const input = `sequenceDiagram
    A->>B:  hello  world`;
    const expected = `sequenceDiagram
    A->>B: hello world
`;
    expect(formatMermaid(input)).toBe(expected);
  });

  it('normalizes bracket padding', () => {
    const input = `flowchart TD
    A[ Start ] --> B[ End ]`;
    const expected = `flowchart TD
    A[Start] --> B[End]
`;
    expect(formatMermaid(input)).toBe(expected);
  });

  it('collapses consecutive blank lines', () => {
    const input = `sequenceDiagram
    A->>B: hello


    B->>A: world`;
    const expected = `sequenceDiagram
    A->>B: hello

    B->>A: world
`;
    expect(formatMermaid(input)).toBe(expected);
  });

  it('inserts blank line before block start', () => {
    const input = `sequenceDiagram
    participant A
critical Section
    A->>B: hello
end`;
    const expected = `sequenceDiagram
    participant A

critical Section
    A->>B: hello
end
`;
    expect(formatMermaid(input)).toBe(expected);
  });

  it('formats nested brace blocks', () => {
    const input = `classDiagram
namespace Animals {
class Dog {
    +bark()
}
}`;
    const expected = `classDiagram

namespace Animals {
    class Dog {
        +bark()
    }
}
`;
    expect(formatMermaid(input)).toBe(expected);
  });

  it('formats flowchart with subgraph', () => {
    const input = `flowchart TD
A --> B
subgraph Group
    B --> C
end`;
    const expected = `flowchart TD
    A --> B

subgraph Group
    B --> C
end
`;
    expect(formatMermaid(input)).toBe(expected);
  });

  it('formats erDiagram', () => {
    const input = `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains`;
    const expected = `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
`;
    expect(formatMermaid(input)).toBe(expected);
  });

  it('preserves comments', () => {
    const input = `sequenceDiagram
    %% This is a comment
    A->>B: hello`;
    const expected = `sequenceDiagram
    %% This is a comment
    A->>B: hello
`;
    expect(formatMermaid(input)).toBe(expected);
  });

  it('preserves directives', () => {
    const input = `%%{init: {'theme': 'dark'}}%%
sequenceDiagram
    A->>B: hello`;
    const expected = `%%{init: {'theme': 'dark'}}%%
sequenceDiagram
    A->>B: hello
`;
    expect(formatMermaid(input)).toBe(expected);
  });
});

describe('formatMarkdownMermaidBlocks', () => {
  it('formats mermaid code blocks in markdown', () => {
    const input = `# Title

\`\`\`mermaid
sequenceDiagram
      A->>B: hello
\`\`\`

Some text.
`;
    const expected = `# Title

\`\`\`mermaid
sequenceDiagram
    A->>B: hello
\`\`\`

Some text.
`;
    expect(formatMarkdownMermaidBlocks(input)).toBe(expected);
  });

  it('formats multiple mermaid blocks', () => {
    const input = `\`\`\`mermaid
sequenceDiagram
  A->>B: hello
\`\`\`

\`\`\`mermaid
flowchart TD
  A --> B
\`\`\``;
    const result = formatMarkdownMermaidBlocks(input);

    expect(result).toContain('    A->>B: hello');
    expect(result).toContain('    A --> B');
  });
});
