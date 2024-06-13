// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Serialize;

#[derive(Serialize)]
struct FileInfo {
    path: String,
    is_file: bool,
    size: Option<u64>,
}

#[tauri::command]
fn list_files(drive_path: String) -> Result<Vec<FileInfo>, String> {
  println!("Received drive path: {}", drive_path);

  // Check if path exists
  if !std::path::Path::new(&drive_path).exists() {
    return Err(format!("Path does not exist: {}", drive_path));
  }

  let mut files = Vec::new();
  // Iterate over entries in the provided drive_path
  for entry in walkdir::WalkDir::new(drive_path).into_iter().filter_map(|e| e.ok()) {
    let metadata = entry.metadata().map_err(|err| err.to_string())?;

    files.push(FileInfo {
      path: entry.path().display().to_string(),
      is_file: metadata.is_file(),
      size: if metadata.is_file() { Some(metadata.len()) } else { None },
    });
  }

  Ok(files)
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
  format!("Hello, {}! You've been greeted from Rust!", name)
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![list_files, greet])
    .plugin(tauri_plugin_system_info::init())
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
