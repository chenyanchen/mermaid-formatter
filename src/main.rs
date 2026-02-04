use clap::Parser;
use std::fs;
use std::io::{self, Read, Write};
use std::path::PathBuf;
use std::process;

use mmdfmt::{format_mermaid, Config};

#[derive(Parser)]
#[command(name = "mmdfmt")]
#[command(author, version, about = "A formatter for Mermaid diagram syntax")]
struct Cli {
    /// Input file path (reads from stdin if not provided)
    #[arg()]
    file: Option<PathBuf>,

    /// Write result to source file instead of stdout
    #[arg(short, long)]
    write: bool,

    /// Number of spaces per indentation level
    #[arg(long, default_value = "4")]
    indent: usize,

    /// Use tabs instead of spaces for indentation
    #[arg(long)]
    tabs: bool,
}

fn main() {
    let cli = Cli::parse();

    // Build config
    let mut config = Config::new().with_indent_size(cli.indent);
    if cli.tabs {
        config = config.with_tabs();
    }

    // Read input
    let (input, source_path) = match &cli.file {
        Some(path) => {
            let content = match fs::read_to_string(path) {
                Ok(c) => c,
                Err(e) => {
                    eprintln!("Error reading file '{}': {}", path.display(), e);
                    process::exit(1);
                }
            };
            (content, Some(path.clone()))
        }
        None => {
            let mut content = String::new();
            if let Err(e) = io::stdin().read_to_string(&mut content) {
                eprintln!("Error reading from stdin: {}", e);
                process::exit(1);
            }
            (content, None)
        }
    };

    // Format
    let output = match format_mermaid(&input, &config) {
        Ok(o) => o,
        Err(e) => {
            eprintln!("Error parsing mermaid: {}", e);
            process::exit(1);
        }
    };

    // Write output
    if cli.write {
        match source_path {
            Some(path) => {
                if let Err(e) = fs::write(&path, &output) {
                    eprintln!("Error writing to file '{}': {}", path.display(), e);
                    process::exit(1);
                }
            }
            None => {
                eprintln!("Error: -w/--write flag requires a file argument");
                process::exit(1);
            }
        }
    } else {
        if let Err(e) = io::stdout().write_all(output.as_bytes()) {
            eprintln!("Error writing to stdout: {}", e);
            process::exit(1);
        }
    }
}
