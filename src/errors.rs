use std::io;

use askama_axum::IntoResponse;
use axum::http::StatusCode;

pub type Result<T> = std::result::Result<T, Error>;

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("io error {0}")]
    IO(#[from] io::Error),
    #[error("dotenv error {0}")]
    Dotenv(#[from] dotenv::Error),
    #[error("json error {0}")]
    Json(#[from] serde_json::Error),
    #[error("error with the mistral client {0}")]
    MistralClient(#[from] mistralai_client::v1::error::ClientError),
    #[error("error with the mistral api {0}")]
    MistralApi(#[from] mistralai_client::v1::error::ApiError),
}
impl IntoResponse for Error {
    fn into_response(self) -> askama_axum::Response {
        (StatusCode::INTERNAL_SERVER_ERROR, format!("{self}")).into_response()
    }
}