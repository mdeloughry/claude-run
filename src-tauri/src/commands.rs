use std::sync::Arc;

use tauri::State;

use crate::storage::Storage;
use crate::types::{ConversationMessage, Session, StreamResult};

#[tauri::command]
pub async fn get_sessions(storage: State<'_, Arc<Storage>>) -> Result<Vec<Session>, String> {
    storage.get_sessions().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_projects(storage: State<'_, Arc<Storage>>) -> Result<Vec<String>, String> {
    storage.get_projects().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_conversation(
    session_id: String,
    storage: State<'_, Arc<Storage>>,
) -> Result<Vec<ConversationMessage>, String> {
    storage
        .get_conversation(&session_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_conversation_stream(
    session_id: String,
    offset: u64,
    storage: State<'_, Arc<Storage>>,
) -> Result<StreamResult, String> {
    storage
        .get_conversation_stream(&session_id, offset)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_session_meta(
    session_id: String,
    storage: State<'_, Arc<Storage>>,
) -> Result<Option<Session>, String> {
    storage
        .get_session_meta(&session_id)
        .await
        .map_err(|e| e.to_string())
}
