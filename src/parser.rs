use pest::Parser;
use pest_derive::Parser;
use thiserror::Error;

use crate::ast::*;

#[derive(Parser)]
#[grammar = "grammar.pest"]
pub struct MermaidParser;

#[derive(Error, Debug)]
pub enum ParseError {
    #[error("Parse error: {0}")]
    Pest(#[from] pest::error::Error<Rule>),
    #[error("Unexpected rule: {0:?}")]
    UnexpectedRule(Rule),
}

pub fn parse(input: &str) -> Result<Diagram, ParseError> {
    // Ensure input ends with newline for consistent parsing
    let input = if input.ends_with('\n') {
        input.to_string()
    } else {
        format!("{}\n", input)
    };

    let pairs = MermaidParser::parse(Rule::diagram, &input)?;
    let mut statements = Vec::new();

    for pair in pairs {
        match pair.as_rule() {
            Rule::diagram => {
                for inner in pair.into_inner() {
                    if let Rule::line = inner.as_rule() {
                        if let Some(stmt) = parse_line(inner)? {
                            statements.push(stmt);
                        }
                    }
                }
            }
            Rule::EOI => {}
            _ => {}
        }
    }

    Ok(Diagram { statements })
}

fn parse_line(pair: pest::iterators::Pair<Rule>) -> Result<Option<Statement>, ParseError> {
    let mut has_content = false;
    let mut stmt = None;

    for inner in pair.into_inner() {
        match inner.as_rule() {
            Rule::diagram_decl => {
                has_content = true;
                stmt = Some(parse_diagram_decl(inner)?);
            }
            Rule::directive => {
                has_content = true;
                stmt = Some(Statement::Directive(inner.as_str().to_string()));
            }
            Rule::participant_decl => {
                has_content = true;
                stmt = Some(parse_participant(inner)?);
            }
            Rule::sequence_block_start => {
                has_content = true;
                stmt = Some(parse_sequence_block_start(inner)?);
            }
            Rule::subgraph_start => {
                has_content = true;
                stmt = Some(parse_subgraph_start(inner)?);
            }
            Rule::state_block_start => {
                has_content = true;
                stmt = Some(parse_state_block_start(inner)?);
            }
            Rule::class_block_start => {
                has_content = true;
                stmt = Some(parse_class_block_start(inner)?);
            }
            Rule::namespace_start => {
                has_content = true;
                stmt = Some(parse_namespace_start(inner)?);
            }
            Rule::sequence_block_option => {
                has_content = true;
                stmt = Some(parse_block_option(inner)?);
            }
            Rule::sequence_block_else => {
                has_content = true;
                stmt = Some(parse_block_else(inner)?);
            }
            Rule::block_end => {
                has_content = true;
                stmt = Some(Statement::BlockEnd);
            }
            Rule::block_end_brace => {
                has_content = true;
                stmt = Some(Statement::BraceBlockEnd);
            }
            Rule::note_line => {
                has_content = true;
                stmt = Some(Statement::Note(inner.as_str().to_string()));
            }
            Rule::comment => {
                has_content = true;
                let text = inner.as_str().trim_start_matches("%%").to_string();
                stmt = Some(Statement::Comment(text));
            }
            Rule::generic_line => {
                has_content = true;
                stmt = Some(Statement::GenericLine(inner.as_str().trim().to_string()));
            }
            _ => {}
        }
    }

    if has_content {
        Ok(stmt)
    } else {
        Ok(Some(Statement::BlankLine))
    }
}

fn parse_diagram_decl(pair: pest::iterators::Pair<Rule>) -> Result<Statement, ParseError> {
    let text = pair.as_str().trim();

    let diagram_type = if text == "sequenceDiagram" {
        DiagramType::SequenceDiagram
    } else if text.starts_with("flowchart") {
        let dir = extract_direction(text, "flowchart");
        DiagramType::Flowchart(dir)
    } else if text.starts_with("graph") {
        let dir = extract_direction(text, "graph");
        DiagramType::Graph(dir)
    } else if text == "classDiagram" {
        DiagramType::ClassDiagram
    } else if text == "stateDiagram-v2" {
        DiagramType::StateDiagramV2
    } else if text == "stateDiagram" {
        DiagramType::StateDiagram
    } else if text == "erDiagram" {
        DiagramType::ErDiagram
    } else if text == "journey" {
        DiagramType::Journey
    } else if text == "gantt" {
        DiagramType::Gantt
    } else if text.starts_with("pie") {
        let show_data = text.contains("showData");
        DiagramType::Pie(show_data)
    } else if text == "quadrantChart" {
        DiagramType::QuadrantChart
    } else if text == "requirementDiagram" {
        DiagramType::RequirementDiagram
    } else if text == "gitGraph" {
        DiagramType::GitGraph
    } else if text == "mindmap" {
        DiagramType::Mindmap
    } else if text == "timeline" {
        DiagramType::Timeline
    } else if text == "sankey-beta" {
        DiagramType::SankeyBeta
    } else if text == "xychart-beta" {
        DiagramType::XyChartBeta
    } else if text == "block-beta" {
        DiagramType::BlockBeta
    } else {
        // Fallback - treat as flowchart
        DiagramType::Flowchart(None)
    };

    Ok(Statement::DiagramDecl(diagram_type))
}

fn extract_direction(text: &str, prefix: &str) -> Option<String> {
    let rest = text.strip_prefix(prefix)?.trim();
    if rest.is_empty() {
        None
    } else {
        Some(rest.to_string())
    }
}

fn parse_participant(pair: pest::iterators::Pair<Rule>) -> Result<Statement, ParseError> {
    let text = pair.as_str();
    let keyword = if text.starts_with("actor") {
        ParticipantKeyword::Actor
    } else {
        ParticipantKeyword::Participant
    };

    let mut name = String::new();
    let mut alias = None;

    for inner in pair.into_inner() {
        match inner.as_rule() {
            Rule::identifier => {
                if name.is_empty() {
                    name = inner.as_str().to_string();
                }
            }
            Rule::alias => {
                alias = Some(inner.as_str().trim().to_string());
            }
            _ => {}
        }
    }

    Ok(Statement::Participant(Participant {
        keyword,
        name,
        alias,
    }))
}

fn parse_sequence_block_start(pair: pest::iterators::Pair<Rule>) -> Result<Statement, ParseError> {
    let text = pair.as_str();

    let keywords = [
        ("critical", BlockKind::Critical),
        ("alt", BlockKind::Alt),
        ("loop", BlockKind::Loop),
        ("par", BlockKind::Par),
        ("opt", BlockKind::Opt),
        ("break", BlockKind::Break),
        ("rect", BlockKind::Rect),
    ];

    let mut kind = BlockKind::Critical;
    let mut keyword_len = 0;

    for (kw, k) in keywords {
        if text.starts_with(kw) {
            kind = k;
            keyword_len = kw.len();
            break;
        }
    }

    let mut label = None;
    for inner in pair.into_inner() {
        if let Rule::block_label = inner.as_rule() {
            let l = inner.as_str().trim();
            if !l.is_empty() {
                label = Some(l.to_string());
            }
        }
    }

    if label.is_none() && text.len() > keyword_len {
        let rest = text[keyword_len..].trim();
        if !rest.is_empty() {
            label = Some(rest.to_string());
        }
    }

    Ok(Statement::BlockStart(BlockStart { kind, label }))
}

fn parse_subgraph_start(pair: pest::iterators::Pair<Rule>) -> Result<Statement, ParseError> {
    let mut label = None;

    for inner in pair.into_inner() {
        if let Rule::subgraph_content = inner.as_rule() {
            let l = inner.as_str().trim();
            if !l.is_empty() {
                label = Some(l.to_string());
            }
        }
    }

    Ok(Statement::BlockStart(BlockStart {
        kind: BlockKind::Subgraph,
        label,
    }))
}

fn parse_state_block_start(pair: pest::iterators::Pair<Rule>) -> Result<Statement, ParseError> {
    let mut name = String::new();

    for inner in pair.into_inner() {
        if let Rule::state_name = inner.as_rule() {
            name = inner.as_str().trim().to_string();
        }
    }

    Ok(Statement::BraceBlockStart(BraceBlockStart {
        kind: BraceBlockKind::State,
        name,
    }))
}

fn parse_class_block_start(pair: pest::iterators::Pair<Rule>) -> Result<Statement, ParseError> {
    let mut name = String::new();

    for inner in pair.into_inner() {
        if let Rule::class_name = inner.as_rule() {
            name = inner.as_str().trim().to_string();
        }
    }

    Ok(Statement::BraceBlockStart(BraceBlockStart {
        kind: BraceBlockKind::Class,
        name,
    }))
}

fn parse_namespace_start(pair: pest::iterators::Pair<Rule>) -> Result<Statement, ParseError> {
    let mut name = String::new();

    for inner in pair.into_inner() {
        if let Rule::namespace_name = inner.as_rule() {
            name = inner.as_str().trim().to_string();
        }
    }

    Ok(Statement::BraceBlockStart(BraceBlockStart {
        kind: BraceBlockKind::Namespace,
        name,
    }))
}

fn parse_block_option(pair: pest::iterators::Pair<Rule>) -> Result<Statement, ParseError> {
    let mut label = None;
    for inner in pair.into_inner() {
        if let Rule::block_label = inner.as_rule() {
            let l = inner.as_str().trim();
            if !l.is_empty() {
                label = Some(l.to_string());
            }
        }
    }
    Ok(Statement::BlockOption(label))
}

fn parse_block_else(pair: pest::iterators::Pair<Rule>) -> Result<Statement, ParseError> {
    let mut label = None;
    for inner in pair.into_inner() {
        if let Rule::block_label = inner.as_rule() {
            let l = inner.as_str().trim();
            if !l.is_empty() {
                label = Some(l.to_string());
            }
        }
    }
    Ok(Statement::BlockElse(label))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_sequence_diagram() {
        let input = r#"sequenceDiagram
    participant A
    A ->> B: Hello
"#;
        let result = parse(input);
        assert!(result.is_ok());
    }

    #[test]
    fn test_parse_flowchart() {
        let input = r#"flowchart TD
    A --> B
    B --> C
"#;
        let result = parse(input);
        assert!(result.is_ok());
    }

    #[test]
    fn test_parse_with_subgraph() {
        let input = r#"flowchart TD
    subgraph one
        A --> B
    end
"#;
        let result = parse(input);
        assert!(result.is_ok());
    }
}
