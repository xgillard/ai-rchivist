use anyhow::Result;
use askama::Template;
use axum::{extract::Path, routing::{get, post}, Json, Router};
use dotenv::dotenv;
use mistralai_client::v1::chat::ChatMessage;
use serde::{Deserialize, Serialize};
use tokio::net::TcpListener;

pub mod model;
use model::*;

/// This is a dummy placeholder to route incorrect requests towards an error page
#[derive(Debug, Clone, Copy, Default, Template)]
#[template(path = "fallback.html")]
struct Fallback;

#[derive(Debug, Clone, Template, Serialize, Deserialize)]
#[template(path = "index.html")]
struct Index {
    pub document_data: DocumentData,
    pub conversation : Vec<ChatMessage>,
}
impl Index {
    pub fn to_string(&self) -> String {
        serde_json::to_string_pretty(self).unwrap()
    }
}

async fn index(Path(x): Path<usize>) -> Index {
    println!("go fetch document {x} and process it");
    // MainData::default()
    //
    let json = include_str!("../response.json");
    let data : DocumentData = serde_json::from_str(json).unwrap();
    Index{document_data: data, conversation: vec![]}
}

async fn save(Json(data): Json<Index>) -> Index {
    println!("{:#?}", data.document_data);
    data.clone()
}

#[tokio::main]
async fn main() -> Result<()> {
    dotenv()?;

    let router = Router::new()
        .route("/:id", get(index))
        .route("/save", post(save))
        .nest_service("/static/", tower_http::services::ServeDir::new("static"))
        .fallback(|| async { Fallback });

    let listener = TcpListener::bind("0.0.0.0:8080").await?;
    axum::serve(listener, router).await?;

    Ok(())
}