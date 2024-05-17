use anyhow::Result;
use askama::Template;
use axum::{extract::Path, routing::{get, post}, Json, Router};
use dotenv::dotenv;
use mistralai_client::v1::{chat::ChatMessage, client::Client, constants::Model};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tokio::net::TcpListener;

pub mod model;
use model::*;

/// This is a dummy placeholder to route incorrect requests towards an error page
#[derive(Debug, Clone, Copy, Default, Template)]
#[template(path = "fallback.html")]
struct Fallback;

#[derive(Debug, Clone, Template, Serialize, Deserialize)]
#[template(path = "index.html")]
struct GlobalState {
    pub document_data: DocumentData,
    pub conversation : Vec<ChatMessage>,
}
impl GlobalState {
    pub fn to_json(&self) -> String {
        serde_json::to_string_pretty(self).unwrap()
    }
}

async fn index(Path(x): Path<usize>) -> GlobalState {
    println!("go fetch document {x} and process it");
    let document = include_str!("../document.txt");
    initial_interaction(document.to_string())
}

async fn save(Json(data): Json<GlobalState>) -> GlobalState {
    println!("{:#?}", data.document_data);
    data.clone()
}

async fn chat(Json(mut state): Json<GlobalState>) -> Json<GlobalState> {
    let message = interact_with_llm(state.conversation.clone());
    let response = message.content.clone();
    state.conversation.push(message);
    
    // FIXME: gérer les rponses du llm qui pourraient etre toute pétées
    let mut response: Value = serde_json::from_str(&response).unwrap();
    response["document"]    = serde_json::Value::String(state.document_data.document.clone());
    state.document_data     = serde_json::from_value(response).unwrap();

    Json::from(state)
}

fn initial_interaction(document: String) -> GlobalState {
    let mut convers = initial_convers(&document);
    let response = interact_with_llm(convers.clone());

    // FIXME: gérer les rponses du llm qui pourraient etre toute pétées
    let mut docdata: Value = serde_json::from_str(&response.content).unwrap();
    docdata["document"]    = serde_json::Value::String(document);
    let docdata = serde_json::from_value(docdata).unwrap();
    convers.push(response);

    GlobalState { document_data: docdata, conversation: convers }
}

fn initial_convers(document: &str) -> Vec<ChatMessage> {
    let prompt= include_str!("../prompt.txt");
    let prompt = format!("{prompt}\n# Document\n{document}");

    vec![
        ChatMessage::new_user_message(&prompt)
    ]
}

fn interact_with_llm(conversation: Vec<ChatMessage>) -> ChatMessage {
    /* THIS IS WHAT SHOULD BE DONE 
    let client = Client::new(None, None, None, None).unwrap();
    let response = client.chat(
        Model::OpenMistral7b, 
        conversation, 
        Default::default()).unwrap();
    
    response.choices[0].message.clone()
    */
    let response = include_str!("../response.json");
    let message = ChatMessage::new_assistant_message(response, None);
    message
}

#[tokio::main]
async fn main() -> Result<()> {
    dotenv()?;

    let router = Router::new()
        .route("/:id", get(index))
        .route("/save", post(save))
        .route("/chat", post(chat))
        .nest_service("/static/", tower_http::services::ServeDir::new("static"))
        .fallback(|| async { Fallback });

    let listener = TcpListener::bind("0.0.0.0:8080").await?;
    axum::serve(listener, router).await?;

    Ok(())
}