import type { Parser, Plugin, Printer } from 'prettier';
import { formatMermaid } from './index.js';

interface MermaidDocumentAst {
  type: 'mermaid-document';
  text: string;
}

const AST_FORMAT = 'mermaid-formatter-ast';
const PARSER_NAME = 'mermaid';

const mermaidParser: Parser<MermaidDocumentAst> = {
  astFormat: AST_FORMAT,
  parse(text) {
    return { type: 'mermaid-document', text };
  },
  locStart() {
    return 0;
  },
  locEnd(node) {
    return node.text.length;
  },
};

const mermaidPrinter: Printer<MermaidDocumentAst> = {
  print(path, options) {
    const node = path.node;
    return formatMermaid(node.text, {
      indentSize: options.tabWidth,
      useTabs: options.useTabs,
    });
  },
};

const plugin: Plugin<MermaidDocumentAst> = {
  languages: [
    {
      name: 'Mermaid',
      parsers: [PARSER_NAME],
      extensions: ['.mmd', '.mermaid'],
      aliases: ['mermaid'],
      vscodeLanguageIds: ['mermaid'],
    },
  ],
  parsers: {
    [PARSER_NAME]: mermaidParser,
  },
  printers: {
    [AST_FORMAT]: mermaidPrinter,
  },
};

export default plugin;
