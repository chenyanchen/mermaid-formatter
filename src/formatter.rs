use crate::ast::*;
use crate::config::Config;

/// Normalize content by fixing spacing issues using regex-like replacements.
/// This is simpler and more predictable than character-by-character processing.
fn normalize_content(content: &str) -> String {
    let mut result = content.to_string();

    // 1. Collapse multiple spaces into one (but preserve leading indent which is already handled)
    while result.contains("  ") {
        result = result.replace("  ", " ");
    }

    // 2. Normalize `: ` - ensure single space after colon when followed by content
    // Pattern: `: +` -> `: ` (colon followed by multiple spaces)
    while result.contains(":  ") {
        result = result.replace(":  ", ": ");
    }

    // 3. Normalize brackets with internal padding: `[ text ]` -> `[text]`
    // Only for brackets that have space immediately after opening
    result = normalize_bracket_pair(&result, '[', ']');
    result = normalize_bracket_pair(&result, '(', ')');
    result = normalize_bracket_pair(&result, '{', '}');

    // 4. Normalize pipes with internal padding: `| text |` -> `|text|`
    result = normalize_pipe_labels(&result);

    result
}

/// Normalize a bracket pair by removing internal padding.
/// Only affects brackets where the opening is followed by space.
fn normalize_bracket_pair(content: &str, open: char, close: char) -> String {
    let mut result = String::with_capacity(content.len());
    let chars: Vec<char> = content.chars().collect();
    let len = chars.len();
    let mut i = 0;

    while i < len {
        let c = chars[i];

        if c == open && i + 1 < len && chars[i + 1] == ' ' {
            // Found opening bracket followed by space
            // Look for the matching closing bracket
            let mut depth = 1;
            let mut j = i + 1;
            while j < len && depth > 0 {
                if chars[j] == open {
                    depth += 1;
                } else if chars[j] == close {
                    depth -= 1;
                }
                j += 1;
            }

            if depth == 0 {
                // Found matching close bracket at j-1
                let close_idx = j - 1;
                // Extract content between brackets
                let inner: String = chars[i + 1..close_idx].iter().collect();
                let trimmed = inner.trim();
                result.push(open);
                result.push_str(trimmed);
                result.push(close);
                i = j;
                continue;
            }
        }

        result.push(c);
        i += 1;
    }

    result
}

/// Normalize pipe labels: `| text |` -> `|text|`
/// Preserves space after closing pipe.
fn normalize_pipe_labels(content: &str) -> String {
    let mut result = String::with_capacity(content.len());
    let chars: Vec<char> = content.chars().collect();
    let len = chars.len();
    let mut i = 0;

    while i < len {
        let c = chars[i];

        if c == '|' && i + 1 < len && chars[i + 1] == ' ' {
            // Opening pipe followed by space - look for closing pipe
            let mut j = i + 1;
            while j < len && chars[j] != '|' {
                j += 1;
            }

            if j < len {
                // Found closing pipe
                let inner: String = chars[i + 1..j].iter().collect();
                let trimmed = inner.trim();
                result.push('|');
                result.push_str(trimmed);
                result.push('|');
                i = j + 1;
                continue;
            }
        }

        result.push(c);
        i += 1;
    }

    result
}

/// Format a parsed Mermaid diagram according to the given configuration
pub fn format(diagram: &Diagram, config: &Config) -> String {
    let mut output = String::new();
    let mut prev_was_blank = false;
    let mut seen_diagram_decl = false;
    let mut block_depth: usize = 0;  // Track nesting for brace blocks

    for (i, stmt) in diagram.statements.iter().enumerate() {
        // Determine if we need a blank line before this statement
        let needs_blank_before = should_have_blank_before(stmt, i, &diagram.statements);

        // Handle blank lines - keep at most one
        if matches!(stmt, Statement::BlankLine) {
            if prev_was_blank {
                continue;  // Skip consecutive blank lines
            }
            prev_was_blank = true;
            output.push('\n');  // Output one blank line
            continue;
        }

        // Add blank line if needed (but avoid at start of file)
        if needs_blank_before && !output.is_empty() && !prev_was_blank {
            output.push('\n');
        }

        prev_was_blank = false;

        // Handle brace block depth changes BEFORE formatting
        if matches!(stmt, Statement::BraceBlockEnd) && block_depth > 0 {
            block_depth -= 1;
        }

        // Calculate depth based on statement type
        let depth = get_depth(stmt, seen_diagram_decl, block_depth);

        // Format the statement
        let line = format_statement(stmt, depth, config);
        output.push_str(&line);
        output.push('\n');

        // Track diagram declaration
        if matches!(stmt, Statement::DiagramDecl(_)) {
            seen_diagram_decl = true;
        }

        // Handle brace block depth changes AFTER formatting
        if matches!(stmt, Statement::BraceBlockStart(_)) {
            block_depth += 1;
        }
    }

    // Remove trailing blank lines, keep exactly one newline at end
    let trimmed = output.trim_end();
    if trimmed.is_empty() {
        String::new()
    } else {
        format!("{}\n", trimmed)
    }
}

/// Determine the depth for a statement
fn get_depth(stmt: &Statement, seen_diagram_decl: bool, block_depth: usize) -> usize {
    if !seen_diagram_decl {
        return 0;
    }

    // Base depth is 1 after diagram declaration
    // Block keywords are at depth 0
    // Brace blocks add to the depth

    match stmt {
        Statement::DiagramDecl(_) => 0,
        Statement::Directive(_) => 0,
        // Blocks that use "end" - keywords at depth 0
        Statement::BlockStart(_) => 0,
        Statement::BlockOption(_) => 0,
        Statement::BlockElse(_) => 0,
        Statement::BlockEnd => 0,
        // Brace blocks - indent based on nesting
        Statement::BraceBlockStart(_) => block_depth,
        Statement::BraceBlockEnd => block_depth,
        // Everything else is indented
        _ => 1 + block_depth,
    }
}

/// Determine if we should insert a blank line before this statement
fn should_have_blank_before(
    stmt: &Statement,
    index: usize,
    statements: &[Statement],
) -> bool {
    if index == 0 {
        return false;
    }

    // Get previous non-blank statement
    let prev = statements[..index]
        .iter()
        .rev()
        .find(|s| !matches!(s, Statement::BlankLine));

    match stmt {
        // Blank line before block starts when preceded by content
        Statement::BlockStart(_) | Statement::BraceBlockStart(_) => {
            matches!(
                prev,
                Some(Statement::BlockEnd)
                    | Some(Statement::BraceBlockEnd)
                    | Some(Statement::GenericLine(_))
                    | Some(Statement::Participant(_))
                    | Some(Statement::Note(_))
            )
        }
        _ => false,
    }
}

/// Format a single statement with proper indentation
fn format_statement(stmt: &Statement, depth: usize, config: &Config) -> String {
    let indent = config.indent(depth);

    match stmt {
        Statement::DiagramDecl(dt) => dt.format(),

        Statement::Directive(content) => content.clone(),

        Statement::Participant(p) => {
            let mut line = format!("{}{} {}", indent, p.keyword.as_str(), p.name);
            if let Some(alias) = &p.alias {
                line.push_str(&format!(" as {}", alias));
            }
            line
        }

        Statement::BlockStart(b) => {
            let mut line = format!("{}{}", indent, b.kind.as_str());
            if let Some(label) = &b.label {
                line.push(' ');
                line.push_str(label);
            }
            line
        }

        Statement::BraceBlockStart(b) => {
            format!("{}{} {} {{", indent, b.kind.as_str(), b.name)
        }

        Statement::BlockOption(label) => {
            let mut line = format!("{}option", indent);
            if let Some(l) = label {
                line.push(' ');
                line.push_str(l);
            }
            line
        }

        Statement::BlockElse(label) => {
            let mut line = format!("{}else", indent);
            if let Some(l) = label {
                line.push(' ');
                line.push_str(l);
            }
            line
        }

        Statement::BlockEnd => format!("{}end", indent),

        Statement::BraceBlockEnd => format!("{}}}", indent),

        Statement::Note(content) => format!("{}{}", indent, content),

        Statement::Comment(text) => format!("{}%%{}", indent, text),

        Statement::GenericLine(content) => format!("{}{}", indent, normalize_content(content)),

        Statement::BlankLine => String::new(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::parser::parse;

    // ==================== Normalization Tests ====================

    #[test]
    fn test_normalize_spaces_after_colon() {
        assert_eq!(normalize_content("A:  B"), "A: B");
        assert_eq!(normalize_content("A:   B"), "A: B");
        assert_eq!(normalize_content("A: B"), "A: B");
        assert_eq!(normalize_content("A:B"), "A:B");  // No space, no change
    }

    #[test]
    fn test_normalize_spaces_inside_brackets() {
        // Only normalize when opening bracket is followed by space
        // This avoids false positives in cases like ER diagram `||--o{`
        assert_eq!(normalize_content("[ text ]"), "[text]");
        assert_eq!(normalize_content("[  text  ]"), "[text]");
        assert_eq!(normalize_content("[ text]"), "[text]");
        assert_eq!(normalize_content("[text ]"), "[text ]");  // No leading space, don't touch
        assert_eq!(normalize_content("[text]"), "[text]");
    }

    #[test]
    fn test_normalize_spaces_inside_braces() {
        assert_eq!(normalize_content("{ text }"), "{text}");
        assert_eq!(normalize_content("{  text  }"), "{text}");
    }

    #[test]
    fn test_normalize_spaces_inside_parens() {
        assert_eq!(normalize_content("( text )"), "(text)");
        assert_eq!(normalize_content("(  text  )"), "(text)");
    }

    #[test]
    fn test_normalize_spaces_inside_pipes() {
        assert_eq!(normalize_content("| text |"), "|text|");
        assert_eq!(normalize_content("|  text  |"), "|text|");
        assert_eq!(normalize_content("|text|"), "|text|");
    }

    #[test]
    fn test_normalize_preserves_space_after_closing_pipe() {
        assert_eq!(normalize_content("| label | B"), "|label| B");
        assert_eq!(normalize_content("|label| B"), "|label| B");
    }

    #[test]
    fn test_normalize_multiple_spaces() {
        assert_eq!(normalize_content("A  B"), "A B");
        assert_eq!(normalize_content("A   B   C"), "A B C");
    }

    #[test]
    fn test_normalize_complex_flowchart_line() {
        assert_eq!(
            normalize_content("B -->| 共享工作区 | C[ Agent ]"),
            "B -->|共享工作区| C[Agent]"
        );
    }

    // ==================== Formatting Tests ====================

    #[test]
    fn test_format_sequence_diagram() {
        let input = "sequenceDiagram\n    A ->> B: hello\n";
        let diagram = parse(input).unwrap();
        let config = Config::default();
        let output = format(&diagram, &config);
        assert!(output.contains("sequenceDiagram"));
        assert!(output.contains("    A ->> B: hello"));
    }

    #[test]
    fn test_format_sequence_normalizes_message() {
        let input = "sequenceDiagram\n    A ->> B:  hello\n";  // Double space after :
        let diagram = parse(input).unwrap();
        let config = Config::default();
        let output = format(&diagram, &config);
        assert!(output.contains("A ->> B: hello"));  // Single space
        assert!(!output.contains(":  "));  // No double space
    }

    #[test]
    fn test_format_flowchart() {
        let input = "flowchart TD\n    A --> B\n";
        let diagram = parse(input).unwrap();
        let config = Config::default();
        let output = format(&diagram, &config);
        assert!(output.contains("flowchart TD"));
        assert!(output.contains("    A --> B"));
    }

    #[test]
    fn test_format_flowchart_normalizes_brackets() {
        let input = "flowchart TD\n    A[ text ] --> B{ choice }\n";
        let diagram = parse(input).unwrap();
        let config = Config::default();
        let output = format(&diagram, &config);
        assert!(output.contains("[text]"));
        assert!(output.contains("{choice}"));
    }

    #[test]
    fn test_format_flowchart_normalizes_edge_labels() {
        let input = "flowchart TD\n    A -->| label | B\n";
        let diagram = parse(input).unwrap();
        let config = Config::default();
        let output = format(&diagram, &config);
        assert!(output.contains("|label|"));
    }

    #[test]
    fn test_format_removes_extra_blanks() {
        let input = "sequenceDiagram\n\n\n    A ->> B: hello\n";
        let diagram = parse(input).unwrap();
        let config = Config::default();
        let output = format(&diagram, &config);
        assert!(!output.contains("\n\n\n"));
    }

    #[test]
    fn test_format_preserves_single_blank() {
        let input = "sequenceDiagram\n\ncritical Block\nend\n";
        let diagram = parse(input).unwrap();
        let config = Config::default();
        let output = format(&diagram, &config);
        // Should have blank line before critical
        assert!(output.contains("sequenceDiagram\n\ncritical"));
    }

    #[test]
    fn test_format_subgraph() {
        let input = "flowchart TD\nsubgraph one\n    A --> B\nend\n";
        let diagram = parse(input).unwrap();
        let config = Config::default();
        let output = format(&diagram, &config);
        assert!(output.contains("subgraph one"));
        assert!(output.contains("    A --> B"));
        assert!(output.contains("\nend\n"));
    }

    #[test]
    fn test_format_class_diagram() {
        let input = "classDiagram\n    Animal <|-- Duck\n";
        let diagram = parse(input).unwrap();
        let config = Config::default();
        let output = format(&diagram, &config);
        assert!(output.contains("classDiagram"));
        assert!(output.contains("    Animal <|-- Duck"));
    }

    #[test]
    fn test_format_state_diagram() {
        let input = "stateDiagram-v2\n    [*] --> Still\n    Still --> Moving\n";
        let diagram = parse(input).unwrap();
        let config = Config::default();
        let output = format(&diagram, &config);
        assert!(output.contains("stateDiagram-v2"));
        assert!(output.contains("    [*] --> Still"));
    }

    #[test]
    fn test_format_er_diagram() {
        let input = "erDiagram\n    CUSTOMER ||--o{ ORDER : places\n";
        let diagram = parse(input).unwrap();
        let config = Config::default();
        let output = format(&diagram, &config);
        assert!(output.contains("erDiagram"));
        assert!(output.contains("CUSTOMER ||--o{ ORDER : places"));
    }

    #[test]
    fn test_format_custom_indent() {
        let input = "flowchart TD\n    A --> B\n";
        let diagram = parse(input).unwrap();
        let config = Config::new().with_indent_size(2);
        let output = format(&diagram, &config);
        assert!(output.contains("  A --> B"));  // 2 spaces
        assert!(!output.contains("    A"));  // Not 4 spaces
    }

    #[test]
    fn test_format_with_tabs() {
        let input = "flowchart TD\n    A --> B\n";
        let diagram = parse(input).unwrap();
        let config = Config::new().with_tabs();
        let output = format(&diagram, &config);
        assert!(output.contains("\tA --> B"));
    }
}
