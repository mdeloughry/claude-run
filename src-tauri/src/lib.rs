mod commands;
mod storage;
mod types;
mod watcher;

use std::sync::Arc;

use tauri::Manager;

use storage::Storage;
use watcher::start_watcher;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let storage = Arc::new(Storage::new(None)?);
            let storage_clone = storage.clone();

            tauri::async_runtime::block_on(async {
                storage_clone.load().await
            })?;

            start_watcher(storage.clone(), app.handle().clone())?;
            app.manage(storage);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_sessions,
            commands::get_projects,
            commands::get_conversation,
            commands::get_conversation_stream,
            commands::get_session_meta,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
