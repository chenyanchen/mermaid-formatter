use crate::ast::*;
use crate::config::Config;

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

        Statement::GenericLine(content) => format!("{}{}", indent, content),

        Statement::BlankLine => String::new(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::parser::parse;

    #[test]
    fn test_format_sequence_diagram() {
        let input = "sequenceDiagram\n    A ->> B: hello\n";
        let diagram = parse(input).unwrap();
        let config = Config::default();
        let output = format(&diagram, &config);
        assert!(output.contains("sequenceDiagram"));
        assert!(output.contains("    A ->> B: hello")); // Should be indented
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
    fn test_format_removes_extra_blanks() {
        let input = "sequenceDiagram\n\n\n    A ->> B: hello\n";
        let diagram = parse(input).unwrap();
        let config = Config::default();
        let output = format(&diagram, &config);
        // Should not have multiple consecutive blank lines
        assert!(!output.contains("\n\n\n"));
    }
}
