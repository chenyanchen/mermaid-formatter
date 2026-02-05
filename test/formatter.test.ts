/**
 * Formatter tests
 */

import { describe, it, expect } from 'vitest';
import { formatMermaid } from '../src/index.js';

describe('formatMermaid', () => {
  describe('indentation', () => {
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
  });

  describe('block structures', () => {
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
  });

  describe('normalization', () => {
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
  });

  describe('blank lines', () => {
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
  });

  describe('preservation', () => {
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

  describe('indent-sensitive diagrams', () => {
    it('preserves mindmap indentation', () => {
      const input = `mindmap
  root((mindmap))
    Origins
      Long history
    Research
      Popularisation`;
      // Should preserve original indentation, not reformat
      expect(formatMermaid(input)).toBe(input + '\n');
    });

    it('preserves timeline indentation', () => {
      const input = `timeline
    title History
    2023 : Event A
        : Sub-event`;
      // Should preserve original indentation, not reformat
      expect(formatMermaid(input)).toBe(input + '\n');
    });
  });
});
