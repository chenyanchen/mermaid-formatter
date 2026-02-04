/// AST types for Mermaid sequence diagrams

#[derive(Debug, Clone)]
pub struct Diagram {
    pub statements: Vec<Statement>,
}

#[derive(Debug, Clone)]
pub enum Statement {
    DiagramDecl,
    Participant(Participant),
    Message(Message),
    BlockStart(BlockStart),
    BlockOption(Option<String>),  // label
    BlockElse(Option<String>),    // label
    BlockEnd,
    Activation(String),           // participant name
    Deactivation(String),         // participant name
    Note(Note),
    Comment(String),
    BlankLine,
}

#[derive(Debug, Clone)]
pub struct Participant {
    pub keyword: ParticipantKeyword,
    pub name: String,
    pub alias: Option<String>,
}

#[derive(Debug, Clone, Copy)]
pub enum ParticipantKeyword {
    Participant,
    Actor,
}

impl ParticipantKeyword {
    pub fn as_str(&self) -> &'static str {
        match self {
            ParticipantKeyword::Participant => "participant",
            ParticipantKeyword::Actor => "actor",
        }
    }
}

#[derive(Debug, Clone)]
pub struct Message {
    pub from: String,
    pub arrow: Arrow,
    pub to: String,
    pub text: Option<String>,
}

#[derive(Debug, Clone, Copy)]
pub enum Arrow {
    Solid,        // ->
    SolidOpen,    // ->>
    Dotted,       // -->
    DottedOpen,   // -->>
    SolidCross,   // -x
    DottedCross,  // --x
    SolidAsync,   // -)
    DottedAsync,  // --)
}

impl Arrow {
    pub fn as_str(&self) -> &'static str {
        match self {
            Arrow::Solid => "->",
            Arrow::SolidOpen => "->>",
            Arrow::Dotted => "-->",
            Arrow::DottedOpen => "-->>",
            Arrow::SolidCross => "-x",
            Arrow::DottedCross => "--x",
            Arrow::SolidAsync => "-)",
            Arrow::DottedAsync => "--)",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "->" => Some(Arrow::Solid),
            "->>" => Some(Arrow::SolidOpen),
            "-->" => Some(Arrow::Dotted),
            "-->>" => Some(Arrow::DottedOpen),
            "-x" => Some(Arrow::SolidCross),
            "--x" => Some(Arrow::DottedCross),
            "-)" => Some(Arrow::SolidAsync),
            "--)" => Some(Arrow::DottedAsync),
            _ => None,
        }
    }
}

#[derive(Debug, Clone)]
pub struct BlockStart {
    pub kind: BlockKind,
    pub label: Option<String>,
}

#[derive(Debug, Clone, Copy)]
pub enum BlockKind {
    Critical,
    Alt,
    Loop,
    Par,
    Opt,
    Break,
    Rect,
}

impl BlockKind {
    pub fn as_str(&self) -> &'static str {
        match self {
            BlockKind::Critical => "critical",
            BlockKind::Alt => "alt",
            BlockKind::Loop => "loop",
            BlockKind::Par => "par",
            BlockKind::Opt => "opt",
            BlockKind::Break => "break",
            BlockKind::Rect => "rect",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "critical" => Some(BlockKind::Critical),
            "alt" => Some(BlockKind::Alt),
            "loop" => Some(BlockKind::Loop),
            "par" => Some(BlockKind::Par),
            "opt" => Some(BlockKind::Opt),
            "break" => Some(BlockKind::Break),
            "rect" => Some(BlockKind::Rect),
            _ => None,
        }
    }
}

#[derive(Debug, Clone)]
pub struct Note {
    pub position: NotePosition,
    pub participant: String,
    pub text: Option<String>,
}

#[derive(Debug, Clone, Copy)]
pub enum NotePosition {
    RightOf,
    LeftOf,
    Over,
}

impl NotePosition {
    pub fn as_str(&self) -> &'static str {
        match self {
            NotePosition::RightOf => "right of",
            NotePosition::LeftOf => "left of",
            NotePosition::Over => "over",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "right of" => Some(NotePosition::RightOf),
            "left of" => Some(NotePosition::LeftOf),
            "over" => Some(NotePosition::Over),
            _ => None,
        }
    }
}
