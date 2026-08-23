# Tauri Premium Desktop Integration

Tauri replaces high-cost client wrappers with a **Rust-Native High Performance Backend**.

## Schnelle Einrichtung (Lokale Entwicklung)

1. **Systemvoraussetzungen (Rust Compiler)**:
   * macOS / Linux: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
   * Windows: Installationsassistent von [tauri.app](https://tauri.app/v1/guides/getting-started/prerequisites) ausführen.

2. **Tauri CLI installieren**:
   ```bash
   npm install -D @tauri-apps/cli
   ```

3. **Desktop Developer Server starten**:
   ```bash
   npm run tauri dev
   ```

## Produktion Ready Native Installer Builden

```bash
npm run tauri build
```
Die fertige, kompilierte Standalone Desktop-App (`< 15MB` Dateigröße, `< 40MB RAM` Verbrauch) wird unter `src-tauri/target/release/bundle/` abgelegt!
