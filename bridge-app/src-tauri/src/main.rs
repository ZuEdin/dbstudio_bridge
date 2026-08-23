#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use std::process::Command;
use std::thread;
use tauri::{
  CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem,
  WindowEvent,
};

// Spawns the Node.js bridge daemon server in a background thread if node is installed
fn start_node_bridge_daemon() {
  thread::spawn(|| {
    let server_dir = if std::path::Path::new("server/server.js").exists() {
      ".".to_string()
    } else if std::path::Path::new("../server/server.js").exists() {
      "..".to_string()
    } else {
      ".".to_string()
    };

    println!("[Tauri Rust] Starting Node.js Bridge Server with cwd: {}...", server_dir);
    let mut cmd = if cfg!(target_os = "windows") {
      let mut c = Command::new("cmd");
      c.current_dir(&server_dir);
      c.args(["/C", "node", "server/server.js"]);
      c
    } else {
      let mut c = Command::new("node");
      c.current_dir(&server_dir);
      c.arg("server/server.js");
      c
    };

    match cmd.spawn() {
      Ok(mut child) => {
        let _ = child.wait();
      }
      Err(e) => {
        eprintln!("[Tauri Rust] Warning: Failed to spawn node daemon directly: {}", e);
      }
    }
  });
}

fn main() {
  // Start background bridge daemon
  start_node_bridge_daemon();

  // Create System Tray Menu
  let show_item = CustomMenuItem::new("show".to_string(), "DB Studio Bridge öffnen");
  let status_item = CustomMenuItem::new("status".to_string(), "● Daemon Aktiv (Port 5050)").disabled();
  let quit_item = CustomMenuItem::new("quit".to_string(), "Beenden");

  let tray_menu = SystemTrayMenu::new()
    .add_item(show_item)
    .add_item(status_item)
    .add_native_item(SystemTrayMenuItem::Separator)
    .add_item(quit_item);

  let system_tray = SystemTray::new().with_menu(tray_menu);

  tauri::Builder::default()
    .system_tray(system_tray)
    .on_system_tray_event(|app, event| match event {
      SystemTrayEvent::LeftClick { .. } => {
        if let Some(window) = app.get_window("main") {
          let _ = window.show();
          let _ = window.unminimize();
          let _ = window.set_focus();
        }
      }
      SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
        "show" => {
          if let Some(window) = app.get_window("main") {
            let _ = window.show();
            let _ = window.unminimize();
            let _ = window.set_focus();
          }
        }
        "quit" => {
          std::process::exit(0);
        }
        _ => {}
      },
      _ => {}
    })
    .on_window_event(|event| {
      if let WindowEvent::CloseRequested { api, .. } = event.event() {
        // Prevent window close and instead hide to tray
        let window = event.window();
        let _ = window.hide();
        api.prevent_close();
      }
    })
    .run(tauri::generate_context!())
    .expect("Fehler beim Starten der Tauri Bridge-Anwendung");
}
