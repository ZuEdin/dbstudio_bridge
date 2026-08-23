import { BackendConfig, VirtualFile } from '../../../types/index';

export const generateTauriConfigs = (
  config: BackendConfig,
  root: string
): VirtualFile[] => {
  const files: VirtualFile[] = [];

  // package.json
  const packageJson = {
    name: `${config.projectName.toLowerCase()}-tauri`,
    version: "1.0.0",
    description: "Generated Tauri Desktop App with Native SQLite and Remote SQL Connectors",
    scripts: {
      "tauri": "tauri",
      "dev": "tauri dev",
      "build": "tauri build",
      "frontend:install": "cd Frontend && npm install",
      "frontend:build": "cd Frontend && npm run build",
      "install-all": "npm install && cd Frontend && npm install"
    },
    devDependencies: {
      "@tauri-apps/cli": "^2.0.0"
    }
  };

  files.push({
    name: 'package.json',
    path: `${root}/package.json`,
    content: JSON.stringify(packageJson, null, 2),
    language: 'json'
  });

  // Cargo.toml
  const cargoToml = `[package]
name = "${config.projectName.toLowerCase()}-app"
version = "0.1.0"
description = "Native Tauri Desktop Client for ${config.projectName}"
authors = ["DB Studio Pro Generator"]
edition = "2021"

[build-dependencies]
tauri-build = { version = "1.5" }

[dependencies]
tauri = { version = "1.5", features = ["api-all", "custom-protocol"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tauri-plugin-sql = { version = "2.0.0", features = ["sqlite", "mysql", "postgres"], optional = true }

[features]
default = ["custom-protocol"]
custom-protocol = ["tauri/custom-protocol"]
`;

  files.push({
    name: 'Cargo.toml',
    path: `${root}/src-tauri/Cargo.toml`,
    content: cargoToml,
    language: 'toml'
  });

  // tauri.conf.json
  const tauriConf = {
    productName: config.projectName,
    version: "1.0.0",
    identifier: `com.${config.projectName.toLowerCase()}.desktop`,
    v2: true,
    build: {
      beforeDevCommand: "npm run dev --prefix Frontend",
      beforeBuildCommand: "npm run build --prefix Frontend",
      frontendDist: "../dist"
    },
    app: {
      windows: [
        {
          title: `${config.projectName} Desktop Studio`,
          width: 1280,
          height: 900,
          resizable: true,
          fullscreen: false
        }
      ],
      security: {
        csp: null
      }
    },
    bundle: {
      active: true,
      targets: "all",
      icon: [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/128x128@2x.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ]
    }
  };

  files.push({
    name: 'tauri.conf.json',
    path: `${root}/src-tauri/tauri.conf.json`,
    content: JSON.stringify(tauriConf, null, 2),
    language: 'json'
  });

  return files;
};
