/// AST types for Mermaid diagrams

#[derive(Debug, Clone)]
pub struct Diagram {
    pub statements: Vec<Statement>,
}

#[derive(Debug, Clone)]
pub enum Statement {
    /// Diagram type declaration (sequenceDiagram, flowchart TD, classDiagram, etc.)
    DiagramDecl(DiagramType),
    /// Directive (%%{ ... }%%)
    Directive(String),
    /// Participant declaration (sequence diagram)
    Participant(Participant),
    /// Block start that uses "end" to close (critical, alt, loop, subgraph, etc.)
    BlockStart(BlockStart),
    /// Block start that uses "}" to close (state X {, class X {, namespace X {)
    BraceBlockStart(BraceBlockStart),
    /// Option within a block (sequence diagram)
    BlockOption(Option<String>),
    /// Else within a block (sequence diagram)
    BlockElse(Option<String>),
    /// End keyword (closes BlockStart)
    BlockEnd,
    /// Closing brace (closes BraceBlockStart)
    BraceBlockEnd,
    /// Note statement
    Note(String),
    /// Comment
    Comment(String),
    /// Generic content line (arrows, nodes, relationships, etc.)
    GenericLine(String),
    /// Blank line
    BlankLine,
}

#[derive(Debug, Clone)]
pub enum DiagramType {
    SequenceDiagram,
    Flowchart(Option<String>),  // direction
    Graph(Option<String>),      // direction
    ClassDiagram,
    StateDiagram,
    StateDiagramV2,
    ErDiagram,
    Journey,
    Gantt,
    Pie(bool),  // showData
    QuadrantChart,
    RequirementDiagram,
    GitGraph,
    Mindmap,
    Timeline,
    SankeyBeta,
    XyChartBeta,
    BlockBeta,
}

impl DiagramType {
    pub fn format(&self) -> String {
        match self {
            DiagramType::SequenceDiagram => "sequenceDiagram".to_string(),
            DiagramType::Flowchart(dir) => {
                match dir {
                    Some(d) => format!("flowchart {}", d),
                    None => "flowchart".to_string(),
                }
            }
            DiagramType::Graph(dir) => {
                match dir {
                    Some(d) => format!("graph {}", d),
                    None => "graph".to_string(),
                }
            }
            DiagramType::ClassDiagram => "classDiagram".to_string(),
            DiagramType::StateDiagram => "stateDiagram".to_string(),
            DiagramType::StateDiagramV2 => "stateDiagram-v2".to_string(),
            DiagramType::ErDiagram => "erDiagram".to_string(),
            DiagramType::Journey => "journey".to_string(),
            DiagramType::Gantt => "gantt".to_string(),
            DiagramType::Pie(show_data) => {
                if *show_data {
                    "pie showData".to_string()
                } else {
                    "pie".to_string()
                }
            }
            DiagramType::QuadrantChart => "quadrantChart".to_string(),
            DiagramType::RequirementDiagram => "requirementDiagram".to_string(),
            DiagramType::GitGraph => "gitGraph".to_string(),
            DiagramType::Mindmap => "mindmap".to_string(),
            DiagramType::Timeline => "timeline".to_string(),
            DiagramType::SankeyBeta => "sankey-beta".to_string(),
            DiagramType::XyChartBeta => "xychart-beta".to_string(),
            DiagramType::BlockBeta => "block-beta".to_string(),
        }
    }
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

/// Block that uses "end" to close
#[derive(Debug, Clone)]
pub struct BlockStart {
    pub kind: BlockKind,
    pub label: Option<String>,
}

#[derive(Debug, Clone)]
pub enum BlockKind {
    // Sequence diagram
    Critical,
    Alt,
    Loop,
    Par,
    Opt,
    Break,
    Rect,
    // Flowchart
    Subgraph,
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
            BlockKind::Subgraph => "subgraph",
        }
    }
}

/// Block that uses "}" to close
#[derive(Debug, Clone)]
pub struct BraceBlockStart {
    pub kind: BraceBlockKind,
    pub name: String,
}

#[derive(Debug, Clone, Copy)]
pub enum BraceBlockKind {
    State,
    Class,
    Namespace,
}

impl BraceBlockKind {
    pub fn as_str(&self) -> &'static str {
        match self {
            BraceBlockKind::State => "state",
            BraceBlockKind::Class => "class",
            BraceBlockKind::Namespace => "namespace",
        }
    }
}
