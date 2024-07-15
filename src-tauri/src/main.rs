// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Serialize;
use std::fs;
use std::path::Path;
use std::process::Command;
use tauri::regex::Regex;
use webbrowser;

// https://en.wikipedia.org/wiki/Raw_image_format#Raw_filename_extensions_and_respective_camera_manufacturers_or_standard
static ALLOWED_EXTENSIONS: &[&str] = &[
  "3fr", "ari", "arw", "srf", "sr2", "bay", "braw", "cri", "crw", "cr2", "cr3", "cap", "iiq", "eip", "dcs", "dcr", "drf", "k25", "kdc",
  "dng", "erf", "fff", "gpr", "jxs", "mef", "mdc", "mos", "mrw", "nef", "nrw", "orf", "pef", "ptx", "pxn", "R3D", "raf", "raw", "rw2",
  "raw", "rwl", "dng", "rwz", "srw", "tco", "x3f",
];

#[derive(Serialize)]
struct FileInfo {
  path: String,
  is_file: bool,
  size: Option<u64>,
}

#[derive(Serialize)]
struct ThumbnailResponse {
  thumbnail_path: String,
  original_path: String,
}

#[derive(Serialize)]
struct ErrorResponse {
  error: String,
}

fn is_hidden(entry: &walkdir::DirEntry) -> bool {
  entry
    .path()
    .file_name()
    .and_then(|file_name| file_name.to_str().map(|s| s.starts_with('.')))
    .unwrap_or(false)
}

// function to check if file extension is in a list of allowed extensions
fn is_allowed_extension(file_path: &str, allowed_extensions: &[&str]) -> bool {
  let file_extension = Path::new(file_path).extension().and_then(|ext| ext.to_str()).unwrap_or("");
  println!("File extension: {}", file_extension);
  allowed_extensions.contains(&file_extension.to_lowercase().as_str())
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
    .filter(|e| is_allowed_extension(&e.path().display().to_string(), ALLOWED_EXTENSIONS))
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
  let path_str = match path.to_str() {
    Some(p) => p,
    None => {
      return serde_json::to_string(&ErrorResponse {
        error: "Invalid path".to_string(),
      })
      .unwrap();
    }
  };
  println!("Received drive path: {}", path_str);

  let thumbnail_dir = "/Users/andy/Desktop/thumbnails/";

  // Ensure the directory exists
  if !Path::new(thumbnail_dir).exists() {
    if let Err(e) = std::fs::create_dir_all(thumbnail_dir) {
      return serde_json::to_string(&ErrorResponse {
        error: format!("Failed to create thumbnail directory: {}", e),
      })
      .unwrap();
    }
    println!("Created thumbnail directory: {}", thumbnail_dir);
  }

  // Define the thumbnail path
  let thumbnail_path = format!(
    "{}{}_thumb.jpg",
    thumbnail_dir,
    match path.file_stem() {
      Some(f) => match f.to_str() {
        Some(n) => n,
        None => {
          return serde_json::to_string(&ErrorResponse {
            error: "Invalid file name".to_string(),
          })
          .unwrap();
        }
      },
      None => {
        return serde_json::to_string(&ErrorResponse {
          error: "Invalid file name".to_string(),
        })
        .unwrap();
      }
    }
  );

  // Print the constructed thumbnail path
  println!("Thumbnail will be saved to: {}", thumbnail_path);

  // Check if the thumbnail already exists
  if Path::new(&thumbnail_path).exists() {
    println!("Thumbnail already exists, skipping creation: {}", thumbnail_path);
    return serde_json::to_string(&ThumbnailResponse {
      thumbnail_path,
      original_path: path_str.to_string(),
    })
    .unwrap();
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
    return serde_json::to_string(&ErrorResponse {
      error: format!("Failed to extract thumbnail: {}", String::from_utf8_lossy(&output.stderr)),
    })
    .unwrap();
  }

  serde_json::to_string(&ThumbnailResponse {
    thumbnail_path,
    original_path: path_str.to_string(),
  })
  .unwrap()
}

#[tauri::command]
fn open_url(url: &str) -> Result<(), String> {
  match webbrowser::open(url) {
    Ok(_) => Ok(()),
    Err(e) => Err(e.to_string()),
  }
}

fn get_shot_date(file_path: &str) -> Result<String, String> {
  let output = Command::new("exiftool")
    .arg("-DateTimeOriginal")
    .arg("-s3")
    .arg(file_path)
    .output()
    .map_err(|e| format!("Failed to execute exiftool: {}", e))?;

  if !output.status.success() {
    return Err(format!("exiftool failed with status: {}", output.status));
  }

  let stdout = String::from_utf8_lossy(&output.stdout);
  let date_str = stdout.trim();

  // Parse the date and format it as YYYY-MM-DD
  let date_re = Regex::new(r"(\d{4}):(\d{2}):(\d{2})").unwrap();
  if let Some(caps) = date_re.captures(date_str) {
    let date = format!("{}-{}-{}", &caps[1], &caps[2], &caps[3]);
    return Ok(date);
  }

  Err("Failed to extract shot date".to_string())
}

#[tauri::command]
fn copy_or_convert(sources: Vec<String>, destination: String, use_dng_converter: bool) -> Result<(), String> {
  for source in sources.iter() {
    let shot_date = get_shot_date(source)?;

    // Create the destination directory path
    let dest_dir = format!("{}/{}", destination, shot_date);
    fs::create_dir_all(&dest_dir).map_err(|e| format!("Failed to create destination directory: {}", e))?;

    if use_dng_converter {
      // Use Adobe DNG Converter
      let output = Command::new("/Applications/Adobe DNG Converter.app/Contents/MacOS/Adobe DNG Converter")
        .arg("-mp")
        .arg("-d")
        .arg(&dest_dir)
        .arg(source)
        .output()
        .map_err(|e| format!("Failed to execute DNG Converter: {}", e))?;

      if !output.status.success() {
        return Err(format!("DNG Converter failed with status: {}", output.status));
      }
    } else {
      // Copy the file to the destination directory
      let file_name = source.split('/').last().ok_or("Invalid source file path")?;
      let dest_path = format!("{}/{}", dest_dir, file_name);
      fs::copy(source, &dest_path).map_err(|e| format!("Failed to copy file: {}", e))?;
    }
  }

  Ok(())
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
  format!("Hello, {}! You've been greeted from Rust!", name)
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      copy_or_convert,
      extract_thumbnail,
      list_files,
      greet,
      open_url
    ])
    .plugin(tauri_plugin_system_info::init())
    .plugin(tauri_plugin_store::Builder::default().build())
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
