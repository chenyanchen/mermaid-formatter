import { describe, it, expect } from 'vitest';
import {
  formatMermaid,
  formatMarkdownMermaidBlocks,
  parse,
  detectDiagramType,
} from '../src/index.js';

describe('detectDiagramType', () => {
  it('detects sequenceDiagram', () => {
    expect(detectDiagramType('sequenceDiagram\n  A->>B: hello')).toBe(
      'sequenceDiagram'
    );
  });

  it('detects flowchart with direction', () => {
    expect(detectDiagramType('flowchart TD\n  A --> B')).toBe('flowchart');
  });

  it('detects classDiagram', () => {
    expect(detectDiagramType('classDiagram\n  class Animal')).toBe(
      'classDiagram'
    );
  });

  it('skips comments when detecting', () => {
    expect(detectDiagramType('%% comment\nsequenceDiagram')).toBe(
      'sequenceDiagram'
    );
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

  it('parses brace blocks with spaces in name', () => {
    const input = `classDiagram
class "HTTP Client" {
    +send()
}`;
    const diagram = parse(input);

    expect(diagram.statements[1].type).toBe('brace-block-start');
    expect(diagram.statements[1].blockKind).toBe('class');
    expect(diagram.statements[1].label).toBe('"HTTP Client"');
    expect(diagram.statements[3].type).toBe('brace-block-end');
  });

  it('parses state blocks with spaces in name', () => {
    const input = `stateDiagram-v2
state In Progress {
    Working
}`;
    const diagram = parse(input);

    expect(diagram.statements[1].type).toBe('brace-block-start');
    expect(diagram.statements[1].blockKind).toBe('state');
    expect(diagram.statements[1].label).toBe('In Progress');
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

  it('formats with zero indent', () => {
    const input = `sequenceDiagram
participant A`;
    const expected = `sequenceDiagram
participant A
`;
    expect(formatMermaid(input, { indentSize: 0 })).toBe(expected);
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

  it('formats brace blocks with spaces in name', () => {
    const input = `classDiagram
class "HTTP Client" {
    +send()
}`;
    const expected = `classDiagram

class "HTTP Client" {
    +send()
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

  it('preserves mindmap indentation (indent-sensitive)', () => {
    const input = `mindmap
  root((mindmap))
    Origins
      Long history
    Research
      Popularisation`;
    // Should preserve original indentation, not reformat
    expect(formatMermaid(input)).toBe(input + '\n');
  });

  it('preserves timeline indentation (indent-sensitive)', () => {
    const input = `timeline
    title History
    2023 : Event A
        : Sub-event`;
    // Should preserve original indentation, not reformat
    expect(formatMermaid(input)).toBe(input + '\n');
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

  it('handles CRLF line endings', () => {
    const input = '```mermaid\r\nsequenceDiagram\r\n  A->>B: hello\r\n```';
    const result = formatMarkdownMermaidBlocks(input);

    expect(result).toContain('    A->>B: hello');
    // Output should use LF
    expect(result).not.toContain('\r\n');
  });

  it('preserves indentation for nested code blocks in lists', () => {
    const input = `- item
  \`\`\`mermaid
  sequenceDiagram
    A->>B: hello
  \`\`\`
- next item`;
    const result = formatMarkdownMermaidBlocks(input);

    // Both fences should be indented
    expect(result).toContain('  ```mermaid');
    expect(result).toContain('  ```\n- next item');
    // Content should also be indented
    expect(result).toContain('  sequenceDiagram');
    expect(result).toContain('      A->>B: hello');
  });

  it('preserves indentation for deeply nested code blocks', () => {
    const input = `> quote
>     \`\`\`mermaid
>     flowchart TD
>       A --> B
>     \`\`\``;
    const result = formatMarkdownMermaidBlocks(input);

    // Fence indentation should be preserved
    expect(result).toContain('>     ```mermaid');
    expect(result).toContain('>     ```');
  });
});
