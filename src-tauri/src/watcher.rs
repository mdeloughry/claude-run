use std::path::PathBuf;
use std::sync::Arc;

use anyhow::Result;
use notify_debouncer_mini::{new_debouncer, DebouncedEventKind};
use tauri::{AppHandle, Emitter};

use crate::storage::Storage;

pub fn start_watcher(storage: Arc<Storage>, app: AppHandle) -> Result<()> {
    let history_path = storage.claude_dir().join("history.jsonl");
    let projects_dir = storage.projects_dir().to_path_buf();

    let storage_clone = storage.clone();
    let app_clone = app.clone();

    let mut debouncer = new_debouncer(
        std::time::Duration::from_millis(20),
        move |events: Result<Vec<notify_debouncer_mini::DebouncedEvent>, notify::Error>| {
            let events = match events {
                Ok(e) => e,
                Err(e) => {
                    log::error!("Watcher error: {}", e);
                    return;
                }
            };

            let storage = storage_clone.clone();
            let app = app_clone.clone();
            let history_path = history_path.clone();

            // Process events on the async runtime
            tauri::async_runtime::spawn(async move {
                let mut sessions_changed = false;
                let mut changed_sessions: Vec<(String, PathBuf)> = Vec::new();

                for event in events {
                    if event.kind != DebouncedEventKind::Any {
                        continue;
                    }

                    let path = &event.path;
                    let path_str = path.to_string_lossy();

                    if *path == history_path {
                        sessions_changed = true;
                    } else if path_str.ends_with(".jsonl") {
                        if let Some(file_name) = path.file_stem() {
                            let session_id = file_name.to_string_lossy().to_string();
                            changed_sessions.push((session_id, path.clone()));
                        }
                    }
                }

                if sessions_changed {
                    storage.invalidate_history_cache().await;
                    let _ = app.emit("sessions-update", ());
                }

                for (session_id, path) in changed_sessions {
                    storage
                        .add_to_file_index(session_id.clone(), path)
                        .await;
                    let _ = app.emit("conversation-update", &session_id);
                }
            });
        },
    )?;

    debouncer
        .watcher()
        .watch(&storage.claude_dir().join("history.jsonl"), notify::RecursiveMode::NonRecursive)
        .ok(); // history.jsonl may not exist yet

    debouncer
        .watcher()
        .watch(&projects_dir, notify::RecursiveMode::Recursive)?;

    // Leak the debouncer so it lives for the lifetime of the app
    // This is intentional - the watcher should run until the app exits
    std::mem::forget(debouncer);

    Ok(())
}
