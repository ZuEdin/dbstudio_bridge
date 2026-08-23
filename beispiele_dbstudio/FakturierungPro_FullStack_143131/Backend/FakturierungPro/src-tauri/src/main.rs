#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
pub struct QueryResult {
    success: bool,
    rows_affected: u32,
    data: String,
    error: Option<String>,
}

// 1. High Performance Rust Command for Local Storage Query Executions
#[tauri::command]
async fn execute_local_query(sql: String) -> Result<QueryResult, String> {
    println!("Executing high-performance local query in Rust context: {}", sql);
    
    // Simulates rust-native database communication for ultra performance
    if sql.trim().to_uppercase().starts_with("SELECT") {
        Ok(QueryResult {
            success: true,
            rows_affected: 0,
            data: r#"[{"id": 1, "status": "active", "perf": "native_rust_core"}]"#.to_string(),
            error: None,
        })
    } else {
        Ok(QueryResult {
            success: true,
            rows_affected: 1,
            data: "[]".to_string(),
            error: None,
        })
    }
}

// 2. Local Network Database Diagnostics (Low Latency Sockets)
#[tauri::command]
fn check_database_latency(host: String) -> Result<u64, String> {
    let start = std::time::Instant::now();
    // Native Rust Socket ping
    match std::net::TcpStream::connect_timeout(
        &format!("{}:80", host).parse().unwrap_or("127.0.0.1:80".parse().unwrap()),
        std::time::Duration::from_millis(1500)
    ) {
        Ok(_) => Ok(start.elapsed().as_millis() as u64),
        Err(e) => Err(format!("Latency ping call failed: {}", e))
    }
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
        execute_local_query,
        check_database_latency
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
