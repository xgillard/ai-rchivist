use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct DocumentData {
    pub document:  String,
    #[serde(flatten)]
    pub metadata:  Metadata,
    pub persons:   Vec<Person>,
    pub locations: Vec<Location>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct Metadata {
    pub doctype :  String,
    pub act_date:  String,
    pub fact_date: String,
    pub summary:   MultiLingual,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct MultiLingual {
    pub en: String,
    pub fr: String,
    pub nl: String,
    pub de: String,
}
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct Person {
    pub firstname: String,
    pub lastname:  String,
    pub role:      String,
    pub function:  String,
}
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct Location {
    pub name: String,
    pub loctype: String,
}