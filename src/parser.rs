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
    #[error("Invalid arrow type: {0}")]
    InvalidArrow(String),
    #[error("Invalid block kind: {0}")]
    InvalidBlockKind(String),
    #[error("Invalid note position: {0}")]
    InvalidNotePosition(String),
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
                stmt = Some(Statement::DiagramDecl);
            }
            Rule::participant_decl => {
                has_content = true;
                stmt = Some(parse_participant(inner)?);
            }
            Rule::message => {
                has_content = true;
                stmt = Some(parse_message(inner)?);
            }
            Rule::block_start => {
                has_content = true;
                stmt = Some(parse_block_start(inner)?);
            }
            Rule::block_option => {
                has_content = true;
                stmt = Some(parse_block_option(inner)?);
            }
            Rule::block_else => {
                has_content = true;
                stmt = Some(parse_block_else(inner)?);
            }
            Rule::block_end => {
                has_content = true;
                stmt = Some(Statement::BlockEnd);
            }
            Rule::activation => {
                has_content = true;
                stmt = Some(parse_activation(inner)?);
            }
            Rule::deactivation => {
                has_content = true;
                stmt = Some(parse_deactivation(inner)?);
            }
            Rule::note => {
                has_content = true;
                stmt = Some(parse_note(inner)?);
            }
            Rule::comment => {
                has_content = true;
                let text = inner.as_str().trim_start_matches("%%").to_string();
                stmt = Some(Statement::Comment(text));
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

fn parse_message(pair: pest::iterators::Pair<Rule>) -> Result<Statement, ParseError> {
    let mut from = String::new();
    let mut to = String::new();
    let mut arrow = Arrow::Solid;
    let mut text = None;
    let mut seen_arrow = false;

    for inner in pair.into_inner() {
        match inner.as_rule() {
            Rule::identifier => {
                if !seen_arrow {
                    from = inner.as_str().to_string();
                } else {
                    to = inner.as_str().to_string();
                }
            }
            Rule::arrow => {
                seen_arrow = true;
                let arrow_str = inner.as_str();
                arrow = Arrow::from_str(arrow_str)
                    .ok_or_else(|| ParseError::InvalidArrow(arrow_str.to_string()))?;
            }
            Rule::message_text => {
                let t = inner.as_str().trim();
                if !t.is_empty() {
                    text = Some(t.to_string());
                }
            }
            _ => {}
        }
    }

    Ok(Statement::Message(Message {
        from,
        arrow,
        to,
        text,
    }))
}

fn parse_block_start(pair: pest::iterators::Pair<Rule>) -> Result<Statement, ParseError> {
    let text = pair.as_str();

    // Extract the keyword from the beginning
    let keywords = ["critical", "alt", "loop", "par", "opt", "break", "rect"];
    let mut kind = BlockKind::Critical;
    let mut keyword_len = 0;

    for kw in keywords {
        if text.starts_with(kw) {
            kind = BlockKind::from_str(kw)
                .ok_or_else(|| ParseError::InvalidBlockKind(kw.to_string()))?;
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

    // If no label from inner rules, try to extract from remaining text
    if label.is_none() && text.len() > keyword_len {
        let rest = text[keyword_len..].trim();
        if !rest.is_empty() {
            label = Some(rest.to_string());
        }
    }

    Ok(Statement::BlockStart(BlockStart { kind, label }))
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

fn parse_activation(pair: pest::iterators::Pair<Rule>) -> Result<Statement, ParseError> {
    for inner in pair.into_inner() {
        if let Rule::identifier = inner.as_rule() {
            return Ok(Statement::Activation(inner.as_str().to_string()));
        }
    }
    Ok(Statement::Activation(String::new()))
}

fn parse_deactivation(pair: pest::iterators::Pair<Rule>) -> Result<Statement, ParseError> {
    for inner in pair.into_inner() {
        if let Rule::identifier = inner.as_rule() {
            return Ok(Statement::Deactivation(inner.as_str().to_string()));
        }
    }
    Ok(Statement::Deactivation(String::new()))
}

fn parse_note(pair: pest::iterators::Pair<Rule>) -> Result<Statement, ParseError> {
    let mut position = NotePosition::RightOf;
    let mut participant = String::new();
    let mut text = None;

    for inner in pair.into_inner() {
        match inner.as_rule() {
            Rule::note_position => {
                let pos_str = inner.as_str();
                position = NotePosition::from_str(pos_str)
                    .ok_or_else(|| ParseError::InvalidNotePosition(pos_str.to_string()))?;
            }
            Rule::identifier => {
                participant = inner.as_str().to_string();
            }
            Rule::note_text => {
                let t = inner.as_str().trim();
                if !t.is_empty() {
                    text = Some(t.to_string());
                }
            }
            _ => {}
        }
    }

    Ok(Statement::Note(Note {
        position,
        participant,
        text,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_simple_diagram() {
        let input = r#"sequenceDiagram
    participant A
    A ->> B: Hello
"#;
        let result = parse(input);
        assert!(result.is_ok());
    }

    #[test]
    fn test_parse_with_blocks() {
        let input = r#"sequenceDiagram
critical Block
    A ->> B: msg
option Alt
    A ->> B: other
end
"#;
        let result = parse(input);
        assert!(result.is_ok());
    }
}
