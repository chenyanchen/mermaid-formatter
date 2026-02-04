//! mmdfmt - A formatter for Mermaid diagram syntax
//!
//! # Example
//!
//! ```rust
//! use mmdfmt::{format_mermaid, Config};
//!
//! let input = r#"sequenceDiagram
//!     A ->> B: hello
//! "#;
//!
//! let config = Config::default();
//! let output = format_mermaid(input, &config).unwrap();
//! println!("{}", output);
//! ```

pub mod ast;
pub mod config;
pub mod formatter;
pub mod parser;

pub use config::Config;
pub use parser::ParseError;

/// Format a Mermaid diagram string according to the given configuration
///
/// # Arguments
///
/// * `input` - The Mermaid diagram source code
/// * `config` - Formatting configuration options
///
/// # Returns
///
/// The formatted Mermaid diagram string, or an error if parsing fails
pub fn format_mermaid(input: &str, config: &Config) -> Result<String, ParseError> {
    let diagram = parser::parse(input)?;
    Ok(formatter::format(&diagram, config))
}
