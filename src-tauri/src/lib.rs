// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .setup(|_app| {
            // Spawn the FastAPI backend
            #[cfg(not(target_os = "windows"))]
            {
                std::process::Command::new("bash")
                    .args(&["-c", "cd ../backend && (fuser -k 11422/tcp || true) && ./venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 11422 --reload"])
                    .spawn()
                    .expect("Failed to start FastAPI backend");
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
