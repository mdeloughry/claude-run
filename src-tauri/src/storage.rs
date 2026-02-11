use std::collections::HashMap;
use std::collections::HashSet;
use std::path::{Path, PathBuf};

use anyhow::Result;
use tokio::fs;
use tokio::io::{AsyncBufReadExt, AsyncSeekExt, BufReader};
use tokio::sync::RwLock;

use crate::types::{ConversationMessage, HistoryEntry, Session, StreamResult};

pub struct Storage {
    claude_dir: PathBuf,
    projects_dir: PathBuf,
    file_index: RwLock<HashMap<String, PathBuf>>,
    history_cache: RwLock<Option<Vec<HistoryEntry>>>,
}

impl Storage {
    pub fn new(dir: Option<&str>) -> Result<Self> {
        let claude_dir = match dir {
            Some(d) => PathBuf::from(d),
            None => home::home_dir()
                .ok_or_else(|| anyhow::anyhow!("Could not find home directory"))?
                .join(".claude"),
        };
        let projects_dir = claude_dir.join("projects");

        Ok(Storage {
            claude_dir,
            projects_dir,
            file_index: RwLock::new(HashMap::new()),
            history_cache: RwLock::new(None),
        })
    }

    pub async fn load(&self) -> Result<()> {
        tokio::try_join!(self.build_file_index(), self.load_history_cache())?;
        Ok(())
    }

    pub async fn invalidate_history_cache(&self) {
        let mut cache = self.history_cache.write().await;
        *cache = None;
    }

    pub async fn add_to_file_index(&self, session_id: String, path: PathBuf) {
        let mut index = self.file_index.write().await;
        index.insert(session_id, path);
    }

    pub fn claude_dir(&self) -> &Path {
        &self.claude_dir
    }

    pub fn projects_dir(&self) -> &Path {
        &self.projects_dir
    }

    async fn build_file_index(&self) -> Result<()> {
        let mut index = self.file_index.write().await;

        let mut project_dirs = match fs::read_dir(&self.projects_dir).await {
            Ok(d) => d,
            Err(_) => return Ok(()), // Projects directory may not exist yet
        };

        while let Ok(Some(entry)) = project_dirs.next_entry().await {
            if !entry.file_type().await.map(|t| t.is_dir()).unwrap_or(false) {
                continue;
            }

            let project_path = entry.path();
            let mut files = match fs::read_dir(&project_path).await {
                Ok(f) => f,
                Err(_) => continue,
            };

            while let Ok(Some(file_entry)) = files.next_entry().await {
                let file_name = file_entry.file_name();
                let file_name_str = file_name.to_string_lossy();
                if file_name_str.ends_with(".jsonl") {
                    let session_id = file_name_str.trim_end_matches(".jsonl").to_string();
                    index.insert(session_id, file_entry.path());
                }
            }
        }

        Ok(())
    }

    async fn load_history_cache(&self) -> Result<()> {
        let history_path = self.claude_dir.join("history.jsonl");
        let content = match fs::read_to_string(&history_path).await {
            Ok(c) => c,
            Err(_) => {
                let mut cache = self.history_cache.write().await;
                *cache = Some(Vec::new());
                return Ok(());
            }
        };

        let mut entries = Vec::new();
        for line in content.lines() {
            let line = line.trim();
            if line.is_empty() {
                continue;
            }
            if let Ok(entry) = serde_json::from_str::<HistoryEntry>(line) {
                entries.push(entry);
            }
        }

        let mut cache = self.history_cache.write().await;
        *cache = Some(entries);
        Ok(())
    }

    async fn ensure_history_cache(&self) -> Vec<HistoryEntry> {
        {
            let cache = self.history_cache.read().await;
            if let Some(ref entries) = *cache {
                return entries.clone();
            }
        }
        // Cache is empty, reload
        let _ = self.load_history_cache().await;
        let cache = self.history_cache.read().await;
        cache.as_ref().cloned().unwrap_or_default()
    }

    fn encode_project_path(path: &str) -> String {
        path.chars()
            .map(|c| if c == '/' || c == '.' { '-' } else { c })
            .collect()
    }

    fn get_project_name(project_path: &str) -> String {
        project_path
            .split('/')
            .filter(|s| !s.is_empty())
            .last()
            .unwrap_or(project_path)
            .to_string()
    }

    async fn find_session_by_timestamp(
        &self,
        encoded_project: &str,
        timestamp: f64,
    ) -> Option<String> {
        let project_path = self.projects_dir.join(encoded_project);
        let mut files = fs::read_dir(&project_path).await.ok()?;

        let mut closest_file: Option<String> = None;
        let mut closest_diff = f64::INFINITY;

        while let Ok(Some(entry)) = files.next_entry().await {
            let file_name = entry.file_name();
            let file_name_str = file_name.to_string_lossy();
            if !file_name_str.ends_with(".jsonl") {
                continue;
            }

            if let Ok(meta) = entry.metadata().await {
                if let Ok(mtime) = meta.modified() {
                    let mtime_ms = mtime
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap_or_default()
                        .as_millis() as f64;
                    let diff = (mtime_ms - timestamp).abs();
                    if diff < closest_diff {
                        closest_diff = diff;
                        closest_file =
                            Some(file_name_str.trim_end_matches(".jsonl").to_string());
                    }
                }
            }
        }

        closest_file
    }

    async fn find_session_file(&self, session_id: &str) -> Option<PathBuf> {
        // Check index first
        {
            let index = self.file_index.read().await;
            if let Some(path) = index.get(session_id) {
                return Some(path.clone());
            }
        }

        // Scan directories
        let target_file = format!("{}.jsonl", session_id);
        let mut project_dirs = fs::read_dir(&self.projects_dir).await.ok()?;

        while let Ok(Some(entry)) = project_dirs.next_entry().await {
            if !entry.file_type().await.map(|t| t.is_dir()).unwrap_or(false) {
                continue;
            }

            let project_path = entry.path();
            let mut files = match fs::read_dir(&project_path).await {
                Ok(f) => f,
                Err(_) => continue,
            };

            while let Ok(Some(file_entry)) = files.next_entry().await {
                if file_entry.file_name().to_string_lossy() == target_file {
                    let path = file_entry.path();
                    // Add to index for future lookups
                    let mut index = self.file_index.write().await;
                    index.insert(session_id.to_string(), path.clone());
                    return Some(path);
                }
            }
        }

        None
    }

    pub async fn get_sessions(&self) -> Result<Vec<Session>> {
        let entries = self.ensure_history_cache().await;
        let mut sessions = Vec::new();
        let mut seen_ids = HashSet::new();

        for entry in &entries {
            let session_id = if let Some(ref id) = entry.session_id {
                Some(id.clone())
            } else {
                let encoded = Self::encode_project_path(&entry.project);
                self.find_session_by_timestamp(&encoded, entry.timestamp)
                    .await
            };

            let session_id = match session_id {
                Some(id) => id,
                None => continue,
            };

            if seen_ids.contains(&session_id) {
                continue;
            }

            seen_ids.insert(session_id.clone());
            sessions.push(Session {
                id: session_id,
                display: entry.display.clone(),
                timestamp: entry.timestamp,
                project: entry.project.clone(),
                project_name: Self::get_project_name(&entry.project),
            });
        }

        sessions.sort_by(|a, b| b.timestamp.partial_cmp(&a.timestamp).unwrap_or(std::cmp::Ordering::Equal));
        Ok(sessions)
    }

    pub async fn get_projects(&self) -> Result<Vec<String>> {
        let entries = self.ensure_history_cache().await;
        let mut projects = HashSet::new();

        for entry in &entries {
            if !entry.project.is_empty() {
                projects.insert(entry.project.clone());
            }
        }

        let mut result: Vec<String> = projects.into_iter().collect();
        result.sort();
        Ok(result)
    }

    pub async fn get_session_meta(&self, session_id: &str) -> Result<Option<Session>> {
        let sessions = self.get_sessions().await?;
        Ok(sessions.into_iter().find(|s| s.id == session_id))
    }

    pub async fn get_conversation(&self, session_id: &str) -> Result<Vec<ConversationMessage>> {
        let file_path = match self.find_session_file(session_id).await {
            Some(p) => p,
            None => return Ok(Vec::new()),
        };

        let content = match fs::read_to_string(&file_path).await {
            Ok(c) => c,
            Err(e) => {
                log::error!("Error reading conversation: {}", e);
                return Ok(Vec::new());
            }
        };

        let mut messages = Vec::new();
        for line in content.lines() {
            let line = line.trim();
            if line.is_empty() {
                continue;
            }
            match serde_json::from_str::<ConversationMessage>(line) {
                Ok(msg) => {
                    if msg.msg_type == "user" || msg.msg_type == "assistant" {
                        messages.push(msg);
                    } else if msg.msg_type == "summary" {
                        messages.insert(0, msg);
                    }
                }
                Err(_) => continue,
            }
        }

        Ok(messages)
    }

    pub async fn get_conversation_stream(
        &self,
        session_id: &str,
        from_offset: u64,
    ) -> Result<StreamResult> {
        let file_path = match self.find_session_file(session_id).await {
            Some(p) => p,
            None => {
                return Ok(StreamResult {
                    messages: Vec::new(),
                    next_offset: 0,
                })
            }
        };

        let metadata = match fs::metadata(&file_path).await {
            Ok(m) => m,
            Err(_) => {
                return Ok(StreamResult {
                    messages: Vec::new(),
                    next_offset: from_offset,
                })
            }
        };

        let file_size = metadata.len();
        if from_offset >= file_size {
            return Ok(StreamResult {
                messages: Vec::new(),
                next_offset: from_offset,
            });
        }

        let file = match tokio::fs::File::open(&file_path).await {
            Ok(f) => f,
            Err(e) => {
                log::error!("Error opening conversation file: {}", e);
                return Ok(StreamResult {
                    messages: Vec::new(),
                    next_offset: from_offset,
                });
            }
        };

        let mut file = file;
        file.seek(std::io::SeekFrom::Start(from_offset)).await?;

        let reader = BufReader::new(file);
        let mut lines = reader.lines();
        let mut messages = Vec::new();
        let mut bytes_consumed: u64 = 0;

        while let Ok(Some(line)) = lines.next_line().await {
            let line_bytes = line.len() as u64 + 1; // +1 for newline

            let trimmed = line.trim();
            if trimmed.is_empty() {
                bytes_consumed += line_bytes;
                continue;
            }

            match serde_json::from_str::<ConversationMessage>(trimmed) {
                Ok(msg) => {
                    if msg.msg_type == "user" || msg.msg_type == "assistant" {
                        messages.push(msg);
                    }
                    bytes_consumed += line_bytes;
                }
                Err(_) => break,
            }
        }

        let actual_offset = from_offset + bytes_consumed;
        let next_offset = if actual_offset > file_size {
            file_size
        } else {
            actual_offset
        };

        Ok(StreamResult {
            messages,
            next_offset,
        })
    }
}
