/// Configuration for the mermaid formatter

#[derive(Debug, Clone)]
pub struct Config {
    /// Number of spaces per indentation level (default: 4)
    pub indent_size: usize,
    /// Use tabs instead of spaces for indentation
    pub use_tabs: bool,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            indent_size: 4,
            use_tabs: false,
        }
    }
}

impl Config {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn with_indent_size(mut self, size: usize) -> Self {
        self.indent_size = size;
        self
    }

    pub fn with_tabs(mut self) -> Self {
        self.use_tabs = true;
        self
    }

    /// Get the indentation string for a given depth
    pub fn indent(&self, depth: usize) -> String {
        if self.use_tabs {
            "\t".repeat(depth)
        } else {
            " ".repeat(depth * self.indent_size)
        }
    }
}
