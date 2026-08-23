import { BackendConfig, VirtualFile } from '../../../types/index';

export const generateTauriRustFiles = (
  config: BackendConfig,
  root: string,
  dbTypeStr: string,
  defaultDbPort: number
): VirtualFile[] => {
  const files: VirtualFile[] = [];

  const buildRs = `fn main() {
  tauri_build::build()
}
`;
  files.push({
    name: 'build.rs',
    path: `${root}/src-tauri/build.rs`,
    content: buildRs,
    language: 'rust'
  });

  const mainRs = `// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct DbConfig {
    db_type: String,
    host: String,
    port: u16,
    database: String,
    is_sqlite: bool,
}

#[tauri::command]
fn get_db_info() -> DbConfig {
    DbConfig {
        db_type: "${dbTypeStr}".to_string(),
        host: "localhost".to_string(),
        port: ${defaultDbPort},
        database: "${config.projectName.toLowerCase()}".to_string(),
        is_sqlite: ${dbTypeStr === 'sqlite' ? 'true' : 'false'},
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![get_db_info])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
`;

  files.push({
    name: 'main.rs',
    path: `${root}/src-tauri/src/main.rs`,
    content: mainRs,
    language: 'rust'
  });

  return files;
};
