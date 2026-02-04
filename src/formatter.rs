use crate::ast::*;
use crate::config::Config;

/// Format a parsed Mermaid diagram according to the given configuration
pub fn format(diagram: &Diagram, config: &Config) -> String {
    let mut output = String::new();
    let mut prev_was_blank = false;
    let mut seen_diagram_decl = false;

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

        // Calculate depth based on statement type
        let depth = get_depth(stmt, seen_diagram_decl);

        // Format the statement
        let line = format_statement(stmt, depth, config);
        output.push_str(&line);
        output.push('\n');

        // Track diagram declaration
        if matches!(stmt, Statement::DiagramDecl) {
            seen_diagram_decl = true;
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
/// - sequenceDiagram: depth 0
/// - Block keywords (critical, option, else, end): depth 0
/// - Everything else: depth 1
fn get_depth(stmt: &Statement, seen_diagram_decl: bool) -> usize {
    if !seen_diagram_decl {
        return 0;
    }

    match stmt {
        Statement::DiagramDecl => 0,
        Statement::BlockStart(_) => 0,
        Statement::BlockOption(_) => 0,
        Statement::BlockElse(_) => 0,
        Statement::BlockEnd => 0,
        _ => 1,
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
        // Blank line before top-level block starts (critical, alt, etc.)
        Statement::BlockStart(_) => {
            matches!(
                prev,
                Some(Statement::BlockEnd)
                    | Some(Statement::Message(_))
                    | Some(Statement::Participant(_))
                    | Some(Statement::Activation(_))
                    | Some(Statement::Deactivation(_))
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
        Statement::DiagramDecl => "sequenceDiagram".to_string(),

        Statement::Participant(p) => {
            let mut line = format!("{}{} {}", indent, p.keyword.as_str(), p.name);
            if let Some(alias) = &p.alias {
                line.push_str(&format!(" as {}", alias));
            }
            line
        }

        Statement::Message(m) => {
            let mut line = format!(
                "{}{} {} {}:",
                indent,
                m.from,
                m.arrow.as_str(),
                m.to
            );
            if let Some(text) = &m.text {
                line.push(' ');
                line.push_str(text);
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

        Statement::Activation(name) => format!("{}activate {}", indent, name),

        Statement::Deactivation(name) => format!("{}deactivate {}", indent, name),

        Statement::Note(n) => {
            let mut line = format!(
                "{}Note {} {}:",
                indent,
                n.position.as_str(),
                n.participant
            );
            if let Some(text) = &n.text {
                line.push(' ');
                line.push_str(text);
            }
            line
        }

        Statement::Comment(text) => format!("{}%%{}", indent, text),

        Statement::BlankLine => String::new(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::parser::parse;

    #[test]
    fn test_format_simple() {
        let input = "sequenceDiagram\n    A ->> B: hello\n";
        let diagram = parse(input).unwrap();
        let config = Config::default();
        let output = format(&diagram, &config);
        assert!(output.contains("sequenceDiagram"));
        assert!(output.contains("    A ->> B: hello")); // Should be indented
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
