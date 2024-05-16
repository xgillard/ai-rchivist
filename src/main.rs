use anyhow::Result;
use askama::Template;
use axum::{extract::Path, routing::{get, post}, Json, Router};
use serde::{Deserialize, Serialize};
use tokio::net::TcpListener;

/// This is a dummy placeholder to route incorrect requests towards an error page
#[derive(Debug, Clone, Copy, Default, Template)]
#[template(path = "fallback.html")]
struct Fallback;


#[derive(Debug, Clone, Default, Template, Serialize, Deserialize)]
#[template(path = "index.html")]
pub struct MainData {
    pub document:  String,
    #[serde(flatten)]
    pub metadata:  Metadata,
    pub persons:   Vec<Person>,
    pub locations: Vec<Location>,
}
impl MainData {
    pub fn to_string(&self) -> String {
        serde_json::to_string_pretty(self).unwrap()
    }
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

async fn index(Path(x): Path<usize>) -> MainData {
    println!("go fetch document {x} and process it");
    // MainData::default()
    //
    let json = include_str!("../response.json");
    let data : MainData = serde_json::from_str(json).unwrap();
    data
}

async fn save(Json(data): Json<MainData>) -> MainData {
    println!("{:#?}", data);
    data.clone()
}

#[tokio::main]
async fn main() -> Result<()> {
    let router = Router::new()
        .route("/:id", get(index))
        .route("/save", post(save))
        .nest_service("/static/", tower_http::services::ServeDir::new("static"))
        .fallback(|| async { Fallback });

    let listener = TcpListener::bind("0.0.0.0:8080").await?;
    axum::serve(listener, router).await?;

    Ok(())
}