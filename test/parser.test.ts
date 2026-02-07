/**
 * Parser tests
 */

import { describe, it, expect } from 'vitest';
import { parse, detectDiagramType } from '../src/index.js';

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
    expect(diagram.statements[2].type).toBe('arrow-message');
    const arrow = diagram.statements[2];
    expect(arrow.type === 'arrow-message' && arrow.from).toBe('A');
    expect(arrow.type === 'arrow-message' && arrow.arrow).toBe('->>');
    expect(arrow.type === 'arrow-message' && arrow.to).toBe('B');
    expect(arrow.type === 'arrow-message' && arrow.message).toBe('Hello');
  });

  it('parses arrow message without space', () => {
    const input = `sequenceDiagram
    A->>B:Hello`;
    const diagram = parse(input);
    const arrow = diagram.statements[1];
    expect(arrow.type).toBe('arrow-message');
    expect(arrow.type === 'arrow-message' && arrow.from).toBe('A');
    expect(arrow.type === 'arrow-message' && arrow.to).toBe('B');
    expect(arrow.type === 'arrow-message' && arrow.message).toBe('Hello');
  });

  it('parses activation arrows', () => {
    const input = `sequenceDiagram
    A->>+B: Hello`;
    const diagram = parse(input);
    const arrow = diagram.statements[1];
    expect(arrow.type).toBe('arrow-message');
    expect(arrow.type === 'arrow-message' && arrow.arrow).toBe('->>+');
    expect(arrow.type === 'arrow-message' && arrow.from).toBe('A');
    expect(arrow.type === 'arrow-message' && arrow.to).toBe('B');
  });

  it('does not parse flowchart class syntax as arrow message', () => {
    const input = `flowchart TD
    A --> B:::warning`;
    const diagram = parse(input);
    expect(diagram.statements[1].type).toBe('generic-line');
  });

  it('parses arrows in non-sequence diagrams when pattern matches', () => {
    const input = `classDiagram
    Animal-->Dog:inherits`;
    const diagram = parse(input);

    expect(diagram.type).toBe('classDiagram');
    expect(diagram.statements[1].type).toBe('arrow-message');
    const arrow = diagram.statements[1];
    expect(arrow.type === 'arrow-message' && arrow.from).toBe('Animal');
    expect(arrow.type === 'arrow-message' && arrow.arrow).toBe('-->');
    expect(arrow.type === 'arrow-message' && arrow.to).toBe('Dog');
    expect(arrow.type === 'arrow-message' && arrow.message).toBe('inherits');
  });

  it('parses block structures', () => {
    const input = `sequenceDiagram
critical Section
    A->>B: hello
end`;
    const diagram = parse(input);

    expect(diagram.statements[1].type).toBe('block-start');
    expect(
      diagram.statements[1].type === 'block-start' &&
        diagram.statements[1].blockKind
    ).toBe('critical');
    expect(
      diagram.statements[1].type === 'block-start' &&
        diagram.statements[1].label
    ).toBe('Section');
    expect(diagram.statements[2].type).toBe('arrow-message');
    expect(diagram.statements[3].type).toBe('block-end');
  });

  it('parses par-and branches', () => {
    const input = `sequenceDiagram
par Branch A
    A->>B: hello
and Branch B
    B->>A: world
end`;
    const diagram = parse(input);

    expect(diagram.statements[1].type).toBe('block-start');
    expect(
      diagram.statements[1].type === 'block-start' &&
        diagram.statements[1].blockKind
    ).toBe('par');
    expect(diagram.statements[3].type).toBe('block-and');
    expect(
      diagram.statements[3].type === 'block-and' &&
        diagram.statements[3].label
    ).toBe('Branch B');
    expect(diagram.statements[5].type).toBe('block-end');
  });

  it('treats else/option/and without valid parent block as generic lines', () => {
    const input = `sequenceDiagram
else fallback
option maybe
and branch`;
    const diagram = parse(input);

    expect(diagram.statements[1].type).toBe('generic-line');
    expect(diagram.statements[2].type).toBe('generic-line');
    expect(diagram.statements[3].type).toBe('generic-line');
  });

  it('parses brace blocks', () => {
    const input = `classDiagram
class Animal {
    +name: string
}`;
    const diagram = parse(input);

    expect(diagram.statements[1].type).toBe('brace-block-start');
    expect(
      diagram.statements[1].type === 'brace-block-start' &&
        diagram.statements[1].blockKind
    ).toBe('class');
    expect(
      diagram.statements[1].type === 'brace-block-start' &&
        diagram.statements[1].name
    ).toBe('Animal');
    expect(diagram.statements[3].type).toBe('brace-block-end');
  });

  it('parses brace blocks with spaces in name', () => {
    const input = `classDiagram
class "HTTP Client" {
    +send()
}`;
    const diagram = parse(input);

    expect(diagram.statements[1].type).toBe('brace-block-start');
    expect(
      diagram.statements[1].type === 'brace-block-start' &&
        diagram.statements[1].blockKind
    ).toBe('class');
    expect(
      diagram.statements[1].type === 'brace-block-start' &&
        diagram.statements[1].name
    ).toBe('"HTTP Client"');
    expect(diagram.statements[3].type).toBe('brace-block-end');
  });

  it('parses state blocks with spaces in name', () => {
    const input = `stateDiagram-v2
state In Progress {
    Working
}`;
    const diagram = parse(input);

    expect(diagram.statements[1].type).toBe('brace-block-start');
    expect(
      diagram.statements[1].type === 'brace-block-start' &&
        diagram.statements[1].blockKind
    ).toBe('state');
    expect(
      diagram.statements[1].type === 'brace-block-start' &&
        diagram.statements[1].name
    ).toBe('In Progress');
  });
});
