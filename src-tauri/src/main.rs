// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Serialize;
use std::path::Path;
use std::process::Command;

#[derive(Serialize)]
struct FileInfo {
  path: String,
  is_file: bool,
  size: Option<u64>,
}

fn is_hidden(entry: &walkdir::DirEntry) -> bool {
  entry
    .path()
    .file_name()
    .and_then(|file_name| file_name.to_str().map(|s| s.starts_with('.')))
    .unwrap_or(false)
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
  for entry in walkdir::WalkDir::new(drive_path)
    .into_iter()
    .filter_map(|e| e.ok())
    .into_iter()
    .filter(|e| !is_hidden(e))
    .filter(|e| !e.file_type().is_dir())
  {
    let metadata = entry.metadata().map_err(|err| err.to_string())?;

    files.push(FileInfo {
      path: entry.path().display().to_string(),
      is_file: metadata.is_file(),
      size: if metadata.is_file() { Some(metadata.len()) } else { None },
    });
  }

  Ok(files)
}

#[tauri::command]
fn extract_thumbnail(path: &Path) -> String {
  let path_str = path.to_str().expect("Invalid path");
  println!("Received drive path: {}", path_str);

  let thumbnail_dir = "/Users/andy/Desktop/thumbnails/";

  // Ensure the directory exists
  if !Path::new(thumbnail_dir).exists() {
    match std::fs::create_dir_all(thumbnail_dir) {
      Ok(_) => println!("Created thumbnail directory: {}", thumbnail_dir),
      Err(e) => return format!("Failed to create thumbnail directory: {}", e),
    }
  }

  // Define the thumbnail path
  let thumbnail_path = format!(
    "{}{}_thumb.jpg",
    thumbnail_dir,
    path.file_stem().expect("Invalid file name").to_str().expect("Invalid file name")
  );

  // Print the constructed thumbnail path
  println!("Thumbnail will be saved to: {}", thumbnail_path);

  // Check if the thumbnail already exists
  if Path::new(&thumbnail_path).exists() {
    return format!("Thumbnail already exists for: {}", path_str);
  }

  let output = Command::new("exiftool")
    .args(&[
      "-thumbnailimage",
      "-b",
      "-w",
      "/Users/andy/Desktop/thumbnails/%f_thumb.jpg",
      path_str,
    ])
    .current_dir(thumbnail_dir) // Set the working directory to the thumbnail directory
    .output()
    .expect("failed to execute process");

  // Print the output status and any stderr output
  println!("Exiftool output status: {}", output.status);
  if !output.status.success() {
    println!("Exiftool error: {}", String::from_utf8_lossy(&output.stderr));
  }

  if output.status.success() {
    format!("Thumbnail extracted for: {}", path_str)
  } else {
    format!("Failed to extract thumbnail: {}", String::from_utf8_lossy(&output.stderr))
  }
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
  format!("Hello, {}! You've been greeted from Rust!", name)
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![extract_thumbnail, list_files, greet])
    .plugin(tauri_plugin_system_info::init())
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
